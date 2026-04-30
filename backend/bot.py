"""
Authix - Discord Verification & Security Bot
Letter-based captcha verification, role management, premium customization via Discord Monetization.
"""
import os
import io
import random
import string
import logging
import asyncio
from pathlib import Path
from typing import Optional

import discord
from discord import app_commands
from discord.ext import commands
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from captcha.image import ImageCaptcha

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
log = logging.getLogger("authix")

# ---- Config ----
BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
PREMIUM_SKU_ID = os.environ.get("DISCORD_PREMIUM_SKU_ID", "")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# ---- Mongo ----
mongo = AsyncIOMotorClient(MONGO_URL)
db = mongo[DB_NAME]


async def get_guild_config(guild_id: int) -> dict:
    doc = await db.guild_configs.find_one({"guild_id": str(guild_id)}, {"_id": 0})
    if not doc:
        doc = {
            "guild_id": str(guild_id),
            "verified_role_id": None,
            "unverified_role_id": None,
            "admin_role_ids": [],
            "embed": {
                "title": "Server Verification",
                "body": "Click the button below and solve the captcha to gain access to this server.",
                "footer": "Powered by Authix",
                "image_url": None,
            },
        }
    return doc


async def save_guild_config(guild_id: int, config: dict) -> None:
    config["guild_id"] = str(guild_id)
    await db.guild_configs.update_one(
        {"guild_id": str(guild_id)}, {"$set": config}, upsert=True
    )


async def increment_stat(key: str, inc: int = 1) -> None:
    await db.authix_stats.update_one(
        {"_id": "global"}, {"$inc": {key: inc}}, upsert=True
    )


async def has_admin_permission(interaction: discord.Interaction) -> bool:
    if interaction.user.guild_permissions.administrator:
        return True
    cfg = await get_guild_config(interaction.guild_id)
    admin_role_ids = set(cfg.get("admin_role_ids", []))
    user_role_ids = {str(r.id) for r in interaction.user.roles}
    return bool(admin_role_ids & user_role_ids)


def has_premium_entitlement(interaction: discord.Interaction) -> bool:
    """Check if the guild has an active premium entitlement via Discord Monetization."""
    if not PREMIUM_SKU_ID:
        # No SKU configured yet — allow premium for server owners as fallback
        return interaction.user.id == interaction.guild.owner_id
    entitlements = getattr(interaction, "entitlements", []) or []
    for ent in entitlements:
        if str(getattr(ent, "sku_id", "")) == PREMIUM_SKU_ID:
            return True
    return False


def generate_captcha_code(length: int = 6) -> str:
    # Letters + digits, excluding visually ambiguous characters (0/O, 1/I/L)
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(random.choices(alphabet, k=length))


# Reusable captcha image renderer
_captcha_image = ImageCaptcha(width=360, height=120)


def generate_captcha_image(code: str) -> io.BytesIO:
    """Render a distorted captcha image (PNG) containing the code."""
    data = _captcha_image.generate(code, format="png")
    buf = io.BytesIO(data.read() if hasattr(data, "read") else data)
    buf.seek(0)
    return buf


# ---- Bot ----
intents = discord.Intents.default()
intents.members = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    log.info("Authix logged in as %s (id=%s)", bot.user, bot.user.id if bot.user else "?")
    try:
        synced = await bot.tree.sync()
        log.info("Synced %d slash commands", len(synced))
    except Exception as e:
        log.exception("Command sync failed: %s", e)
    await db.authix_stats.update_one(
        {"_id": "global"},
        {"$set": {"servers_protected": len(bot.guilds)}},
        upsert=True,
    )


@bot.event
async def on_guild_join(guild: discord.Guild):
    await db.authix_stats.update_one(
        {"_id": "global"},
        {"$set": {"servers_protected": len(bot.guilds)}},
        upsert=True,
    )


@bot.event
async def on_guild_remove(guild: discord.Guild):
    await db.authix_stats.update_one(
        {"_id": "global"},
        {"$set": {"servers_protected": len(bot.guilds)}},
        upsert=True,
    )


# ---- Captcha Modal ----
class CaptchaModal(discord.ui.Modal, title="Server Verification"):
    def __init__(self, code: str):
        super().__init__(timeout=120)
        self.code = code
        self.answer = discord.ui.TextInput(
            label="Enter the code from the image above",
            placeholder="Type the characters you see",
            min_length=len(code),
            max_length=len(code) + 2,
            required=True,
        )
        self.add_item(self.answer)

    async def on_submit(self, interaction: discord.Interaction):
        if self.answer.value.strip().upper() != self.code:
            await interaction.response.send_message(
                "Verification failed. The code you entered did not match. Click **Verify** again to retry with a new captcha.",
                ephemeral=True,
            )
            return

        cfg = await get_guild_config(interaction.guild_id)
        guild = interaction.guild
        member = interaction.user

        verified_role_id = cfg.get("verified_role_id")
        unverified_role_id = cfg.get("unverified_role_id")

        if not verified_role_id:
            await interaction.response.send_message(
                "Verification is not yet configured on this server. Please contact an admin.",
                ephemeral=True,
            )
            return

        verified_role = guild.get_role(int(verified_role_id))
        if not verified_role:
            await interaction.response.send_message(
                "The configured verified role no longer exists. Please contact an admin.",
                ephemeral=True,
            )
            return

        try:
            await member.add_roles(verified_role, reason="Authix: captcha verified")
            if unverified_role_id:
                unverified_role = guild.get_role(int(unverified_role_id))
                if unverified_role and unverified_role in member.roles:
                    await member.remove_roles(
                        unverified_role, reason="Authix: captcha verified"
                    )
        except discord.Forbidden:
            await interaction.response.send_message(
                "I don't have permission to assign roles. Please ask an admin to move my role higher in the hierarchy.",
                ephemeral=True,
            )
            return

        await increment_stat("users_verified", 1)
        await interaction.response.send_message(
            f"You're verified. Welcome to **{guild.name}**.",
            ephemeral=True,
        )


class EnterCodeView(discord.ui.View):
    """Non-persistent view attached to a per-user ephemeral captcha image."""

    def __init__(self, code: str, owner_id: int):
        super().__init__(timeout=180)  # 3 min to solve
        self.code = code
        self.owner_id = owner_id

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.owner_id:
            await interaction.response.send_message(
                "This captcha isn't for you.", ephemeral=True
            )
            return False
        return True

    @discord.ui.button(
        label="Enter Code",
        style=discord.ButtonStyle.success,
        emoji="🔑",
    )
    async def enter_code(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        await interaction.response.send_modal(CaptchaModal(self.code))


# ---- Verify Button (persistent) ----
class VerifyView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Verify",
        style=discord.ButtonStyle.primary,
        custom_id="authix:verify",
        emoji="🔐",
    )
    async def verify(self, interaction: discord.Interaction, button: discord.ui.Button):
        cfg = await get_guild_config(interaction.guild_id)
        verified_role_id = cfg.get("verified_role_id")
        if verified_role_id:
            role = interaction.guild.get_role(int(verified_role_id))
            if role and role in interaction.user.roles:
                await interaction.response.send_message(
                    "You are already verified on this server.",
                    ephemeral=True,
                )
                return

        # Generate image captcha and send it ephemerally to the user
        code = generate_captcha_code()
        image_buf = await asyncio.to_thread(generate_captcha_image, code)
        file = discord.File(image_buf, filename="captcha.png")

        embed = discord.Embed(
            title="Solve the captcha to verify",
            description=(
                "Type the characters shown in the image below, then click **Enter Code**.\n"
                "Codes are case-insensitive. This captcha expires in 3 minutes."
            ),
            color=0x00D2FF,
        )
        embed.set_image(url="attachment://captcha.png")
        embed.set_footer(text="Powered by Authix")

        view = EnterCodeView(code=code, owner_id=interaction.user.id)
        await interaction.response.send_message(
            embed=embed, file=file, view=view, ephemeral=True
        )


# ---- /config group ----
config_group = app_commands.Group(
    name="config",
    description="Configure Authix for this server",
    default_permissions=discord.Permissions(manage_guild=True),
)


@config_group.command(name="role", description="Set the verified role and optional unverified role.")
@app_commands.describe(
    verified_role="Role users receive after passing the captcha",
    unverified_role="(Optional) Role removed after verification",
)
async def config_role(
    interaction: discord.Interaction,
    verified_role: discord.Role,
    unverified_role: Optional[discord.Role] = None,
):
    if not await has_admin_permission(interaction):
        await interaction.response.send_message(
            "You don't have permission to use this command.", ephemeral=True
        )
        return

    me = interaction.guild.me
    if verified_role >= me.top_role:
        await interaction.response.send_message(
            f"I cannot assign **{verified_role.name}** because it is above or equal to my highest role. "
            "Please move my role above it in Server Settings → Roles.",
            ephemeral=True,
        )
        return

    cfg = await get_guild_config(interaction.guild_id)
    cfg["verified_role_id"] = str(verified_role.id)
    cfg["unverified_role_id"] = str(unverified_role.id) if unverified_role else None
    await save_guild_config(interaction.guild_id, cfg)

    msg = f"Verified role set to {verified_role.mention}."
    if unverified_role:
        msg += f"\nUnverified role set to {unverified_role.mention} (will be removed after verification)."
    await interaction.response.send_message(msg, ephemeral=True)


@config_group.command(name="admin", description="Allow a role to manage Authix settings.")
@app_commands.describe(
    role="Role allowed to manage Authix",
    action="Add or remove permission",
)
@app_commands.choices(
    action=[
        app_commands.Choice(name="add", value="add"),
        app_commands.Choice(name="remove", value="remove"),
    ]
)
async def config_admin(
    interaction: discord.Interaction,
    role: discord.Role,
    action: app_commands.Choice[str],
):
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message(
            "Only server administrators can manage admin roles.", ephemeral=True
        )
        return

    cfg = await get_guild_config(interaction.guild_id)
    admin_ids = set(cfg.get("admin_role_ids", []))
    if action.value == "add":
        admin_ids.add(str(role.id))
        txt = f"{role.mention} can now manage Authix settings."
    else:
        admin_ids.discard(str(role.id))
        txt = f"{role.mention} can no longer manage Authix settings."
    cfg["admin_role_ids"] = list(admin_ids)
    await save_guild_config(interaction.guild_id, cfg)

    await interaction.response.send_message(txt, ephemeral=True)


@config_group.command(
    name="panel",
    description="Post the verification panel in this channel.",
)
async def config_panel(interaction: discord.Interaction):
    if not await has_admin_permission(interaction):
        await interaction.response.send_message(
            "You don't have permission to use this command.", ephemeral=True
        )
        return

    cfg = await get_guild_config(interaction.guild_id)
    if not cfg.get("verified_role_id"):
        await interaction.response.send_message(
            "Configure a verified role first with `/config role`.", ephemeral=True
        )
        return

    embed_cfg = cfg.get("embed", {})
    embed = discord.Embed(
        title=embed_cfg.get("title") or "Server Verification",
        description=embed_cfg.get("body")
        or "Click the button below and solve the captcha to gain access to this server.",
        color=0x00D2FF,
    )
    footer = embed_cfg.get("footer") or "Powered by Authix"
    embed.set_footer(text=footer)
    if embed_cfg.get("image_url"):
        embed.set_image(url=embed_cfg["image_url"])

    await interaction.channel.send(embed=embed, view=VerifyView())
    await interaction.response.send_message("Verification panel posted.", ephemeral=True)


bot.tree.add_command(config_group)


# ---- /customization (Premium) ----
@bot.tree.command(
    name="customization",
    description="[PREMIUM] Customize the verification embed appearance.",
)
@app_commands.describe(
    title="Embed title",
    body="Embed description/body",
    footer="Embed footer",
    image_url="Embed image URL (optional)",
)
async def customization(
    interaction: discord.Interaction,
    title: Optional[str] = None,
    body: Optional[str] = None,
    footer: Optional[str] = None,
    image_url: Optional[str] = None,
):
    if not await has_admin_permission(interaction):
        await interaction.response.send_message(
            "You don't have permission to use this command.", ephemeral=True
        )
        return

    if not has_premium_entitlement(interaction):
        # Prompt the user to upgrade via Discord's built-in monetization flow
        try:
            await interaction.response.send_message(
                "**Customization is a Premium feature.**\n"
                "Upgrade to Authix Premium in the bot profile or via the Monetization tab "
                "to unlock custom embed title, body, footer, and image.",
                ephemeral=True,
            )
        except Exception:
            pass
        return

    cfg = await get_guild_config(interaction.guild_id)
    embed_cfg = cfg.get("embed", {}) or {}
    if title is not None:
        embed_cfg["title"] = title[:256]
    if body is not None:
        embed_cfg["body"] = body[:2000]
    if footer is not None:
        embed_cfg["footer"] = footer[:2048]
    if image_url is not None:
        embed_cfg["image_url"] = image_url if image_url.strip() else None
    cfg["embed"] = embed_cfg
    await save_guild_config(interaction.guild_id, cfg)

    await interaction.response.send_message(
        "Embed customization updated. Use `/config panel` to repost the verification panel.",
        ephemeral=True,
    )


# ---- /help ----
@bot.tree.command(name="help", description="How to set up Authix on your server.")
async def help_cmd(interaction: discord.Interaction):
    embed = discord.Embed(
        title="Authix Setup",
        description=(
            "**1.** `/config role verified_role:@Verified` — set the role users receive after passing captcha.\n"
            "**2.** `/config admin role:@Moderators action:add` — let a role manage Authix.\n"
            "**3.** `/config panel` — post the verification panel in the current channel.\n\n"
            "**Premium**\n"
            "• `/customization` — custom embed title, body, footer, and image."
        ),
        color=0x00D2FF,
    )
    embed.set_footer(text="Powered by Authix")
    await interaction.response.send_message(embed=embed, ephemeral=True)


async def main():
    if not BOT_TOKEN:
        log.error(
            "DISCORD_BOT_TOKEN is not set. Add it to backend/.env and restart the 'authix_bot' service."
        )
        # Keep the process alive so supervisor doesn't spam restarts
        while True:
            await asyncio.sleep(3600)

    # Register persistent view so the Verify button survives restarts
    bot.add_view(VerifyView())

    async with bot:
        await bot.start(BOT_TOKEN)


if __name__ == "__main__":
    asyncio.run(main())
