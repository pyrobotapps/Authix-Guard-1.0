"""
Authix - Discord Verification & Security Bot
Letter-based captcha verification, role management, premium customization via Discord Monetization.
"""
import os
import io
import time
import random
import string
import logging
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import discord
from discord import app_commands
from discord.ext import commands, tasks
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
            "digest_channel_id": None,
            "last_digest_ts": None,
            "alert_channel_id": None,
            "alert_threshold": 40,       # percent
            "alert_min_attempts": 5,     # in the alert window
            "last_alert_ts": None,
            "auto_mitigate": False,
            "mitigation_max": 1,         # rate-limit cap during mitigation
            "mitigation_duration": 3600, # seconds
            "mitigation_active_until": None,
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


# ---- Rate limit ----
RATE_LIMIT_MAX = 3           # attempts
RATE_LIMIT_WINDOW = 3600     # seconds (1 hour)


async def get_effective_rate_limit(guild_id: int) -> tuple[int, bool]:
    """Return (max_attempts, mitigation_active) for this guild."""
    cfg = await db.guild_configs.find_one(
        {"guild_id": str(guild_id)},
        {"_id": 0, "mitigation_max": 1, "mitigation_active_until": 1},
    ) or {}
    until = cfg.get("mitigation_active_until")
    if until and int(until) > int(time.time()):
        return int(cfg.get("mitigation_max", 1)), True
    return RATE_LIMIT_MAX, False


async def check_and_record_attempt(guild_id: int, user_id: int) -> tuple[bool, int, int]:
    """
    Returns (allowed, remaining_after, retry_after_seconds).

    Honors per-guild mitigation: if mitigation is active for this guild,
    a tighter cap (mitigation_max, default 1) is used instead of RATE_LIMIT_MAX.
    """
    now = int(time.time())
    cutoff = now - RATE_LIMIT_WINDOW
    key = f"{guild_id}:{user_id}"

    max_attempts, _mitigating = await get_effective_rate_limit(guild_id)

    doc = await db.captcha_attempts.find_one({"_id": key}, {"_id": 0, "attempts": 1})
    attempts = [t for t in (doc or {}).get("attempts", []) if t > cutoff]

    if len(attempts) >= max_attempts:
        oldest = min(attempts)
        retry_after = max(1, (oldest + RATE_LIMIT_WINDOW) - now)
        await db.captcha_attempts.update_one(
            {"_id": key}, {"$set": {"attempts": attempts}}, upsert=True
        )
        return False, 0, retry_after

    attempts.append(now)
    await db.captcha_attempts.update_one(
        {"_id": key}, {"$set": {"attempts": attempts}}, upsert=True
    )
    return True, max_attempts - len(attempts), 0


def _format_retry(seconds: int) -> str:
    minutes = (seconds + 59) // 60
    if minutes >= 60:
        hours = minutes // 60
        return f"{hours} hour{'s' if hours != 1 else ''}"
    return f"{minutes} minute{'s' if minutes != 1 else ''}"


async def record_verification_event(guild_id: int, user_id: int, outcome: str) -> None:
    """Record a verification outcome ('success' or 'failure') for admin stats."""
    await db.verification_events.insert_one(
        {
            "guild_id": str(guild_id),
            "user_id": str(user_id),
            "outcome": outcome,
            "ts": int(time.time()),
        }
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
    if not weekly_digest_loop.is_running():
        weekly_digest_loop.start()
    if not raid_alert_loop.is_running():
        raid_alert_loop.start()


# ---- Weekly digest ----
# Fires every 30 min. Posts once per guild whose digest_channel_id is set,
# when the current UTC time is Monday 09:xx and the last digest was > 6 days ago.
@tasks.loop(minutes=30)
async def weekly_digest_loop():
    now_dt = datetime.now(timezone.utc)
    if now_dt.weekday() != 0 or now_dt.hour != 9:
        return

    now_ts = int(now_dt.timestamp())
    six_days = 6 * 24 * 3600

    async for cfg in db.guild_configs.find(
        {"digest_channel_id": {"$ne": None}}, {"_id": 0}
    ):
        guild_id = int(cfg["guild_id"])
        channel_id = int(cfg["digest_channel_id"])
        last_ts = cfg.get("last_digest_ts") or 0
        if now_ts - last_ts < six_days:
            continue

        guild = bot.get_guild(guild_id)
        if not guild:
            continue
        channel = guild.get_channel(channel_id)
        if not channel:
            log.warning("Digest channel missing for guild %s", guild_id)
            continue

        try:
            embed = await build_stats_embed(
                guild_id, guild.name, title_prefix="📊 Weekly Digest — "
            )
            await channel.send(embed=embed)
            await db.guild_configs.update_one(
                {"guild_id": str(guild_id)},
                {"$set": {"last_digest_ts": now_ts}},
            )
            log.info("Posted weekly digest to guild %s / channel %s", guild_id, channel_id)
        except discord.Forbidden:
            log.warning(
                "Missing permissions to post digest in guild %s / channel %s",
                guild_id,
                channel_id,
            )
        except Exception as e:
            log.exception("Digest post failed for guild %s: %s", guild_id, e)


@weekly_digest_loop.before_loop
async def _before_digest_loop():
    await bot.wait_until_ready()


# ---- Raid alert loop ----
# Fires every 5 min. For each guild with alert_channel_id set, checks the last
# 30 min of verification events. If failures >= alert_min_attempts AND
# failure_rate >= alert_threshold AND we haven't alerted in the cooldown window,
# posts an alert and stamps last_alert_ts.
@tasks.loop(minutes=5)
async def raid_alert_loop():
    now_ts = int(time.time())
    window_start = now_ts - ALERT_WINDOW_SECONDS

    async for cfg in db.guild_configs.find(
        {"alert_channel_id": {"$ne": None}}, {"_id": 0}
    ):
        guild_id = int(cfg["guild_id"])
        channel_id = int(cfg["alert_channel_id"])
        threshold = int(cfg.get("alert_threshold", 40))
        min_attempts = int(cfg.get("alert_min_attempts", 5))
        last_alert = int(cfg.get("last_alert_ts") or 0)

        if now_ts - last_alert < ALERT_COOLDOWN_SECONDS:
            continue

        gid_str = str(guild_id)
        successes = await db.verification_events.count_documents(
            {"guild_id": gid_str, "outcome": "success", "ts": {"$gte": window_start}}
        )
        failures = await db.verification_events.count_documents(
            {"guild_id": gid_str, "outcome": "failure", "ts": {"$gte": window_start}}
        )
        total = successes + failures
        if total < min_attempts:
            continue
        rate = (failures / total) * 100
        if rate < threshold:
            continue

        guild = bot.get_guild(guild_id)
        if not guild:
            continue
        channel = guild.get_channel(channel_id)
        if not channel:
            log.warning("Alert channel missing for guild %s", guild_id)
            continue

        # Count distinct users that failed in the window — useful raid signal
        distinct_failing_users = len(
            await db.verification_events.distinct(
                "user_id",
                {"guild_id": gid_str, "outcome": "failure", "ts": {"$gte": window_start}},
            )
        )

        embed = discord.Embed(
            title="🚨 Possible raid in progress",
            description=(
                f"Captcha failure rate is **{rate:.1f}%** in the last 30 minutes — "
                f"above the configured **{threshold}%** threshold."
            ),
            color=0xFF3B30,
        )
        embed.add_field(name="Failures", value=f"`{failures}`", inline=True)
        embed.add_field(name="Successes", value=f"`{successes}`", inline=True)
        embed.add_field(
            name="Distinct failing users",
            value=f"`{distinct_failing_users}`",
            inline=True,
        )

        # ---- Auto-mitigation ----
        mitigation_update = {}
        if cfg.get("auto_mitigate"):
            duration = int(cfg.get("mitigation_duration", 3600))
            mit_max = int(cfg.get("mitigation_max", 1))
            mitigation_update["mitigation_active_until"] = now_ts + duration
            embed.add_field(
                name="🛡️ Auto-mitigation activated",
                value=(
                    f"Rate limit tightened to **{mit_max}/hour** for the next "
                    f"**{duration // 60} minutes**. New verification attempts beyond "
                    "that cap will be blocked automatically."
                ),
                inline=False,
            )
        else:
            embed.add_field(
                name="What to do",
                value=(
                    "• Consider raising the slowmode in your verification channel.\n"
                    "• Enable auto-mitigation: `/config alerts auto_mitigate:True`.\n"
                    "• Review your audit log for suspicious account-creation patterns."
                ),
                inline=False,
            )
        embed.set_footer(text="Powered by Authix · alerts cool down for 30 min")

        try:
            await channel.send(embed=embed)
            update_doc = {"last_alert_ts": now_ts}
            update_doc.update(mitigation_update)
            await db.guild_configs.update_one(
                {"guild_id": gid_str},
                {"$set": update_doc},
            )
            log.info(
                "Posted raid alert to guild %s / channel %s (rate=%.1f%% failures=%d, mitigation=%s)",
                guild_id,
                channel_id,
                rate,
                failures,
                bool(mitigation_update),
            )
        except discord.Forbidden:
            log.warning(
                "Missing permissions to post alert in guild %s / channel %s",
                guild_id,
                channel_id,
            )
        except Exception as e:
            log.exception("Alert post failed for guild %s: %s", guild_id, e)


@raid_alert_loop.before_loop
async def _before_alert_loop():
    await bot.wait_until_ready()


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
            await record_verification_event(
                interaction.guild_id, interaction.user.id, "failure"
            )
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
        await record_verification_event(
            interaction.guild_id, interaction.user.id, "success"
        )
        # Clear this user's rate-limit window on success.
        await db.captcha_attempts.delete_one(
            {"_id": f"{interaction.guild_id}:{interaction.user.id}"}
        )
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

        # Rate limit: cap is 3/hour normally, drops to mitigation_max during raids.
        allowed, remaining, retry_after = await check_and_record_attempt(
            interaction.guild_id, interaction.user.id
        )
        max_attempts, mitigating = await get_effective_rate_limit(interaction.guild_id)
        if not allowed:
            extra = (
                "\n*Raid mitigation is active — limits are temporarily tightened.*"
                if mitigating
                else ""
            )
            await interaction.response.send_message(
                f"You've reached the verification attempt limit "
                f"({max_attempts} per hour). Please try again in "
                f"**{_format_retry(retry_after)}**.{extra}",
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
        if mitigating:
            footer = (
                f"Powered by Authix · Raid mitigation active · "
                f"{remaining} attempt{'s' if remaining != 1 else ''} left this hour"
            )
        else:
            footer = (
                f"Powered by Authix · "
                f"{remaining} attempt{'s' if remaining != 1 else ''} left this hour"
            )
        embed.set_footer(text=footer)

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


@config_group.command(
    name="stats",
    description="Show Authix verification stats for this server.",
)
async def config_stats(interaction: discord.Interaction):
    if not await has_admin_permission(interaction):
        await interaction.response.send_message(
            "You don't have permission to use this command.", ephemeral=True
        )
        return

    await interaction.response.defer(ephemeral=True, thinking=True)
    embed = await build_stats_embed(interaction.guild_id, interaction.guild.name)
    await interaction.followup.send(embed=embed, ephemeral=True)


async def build_stats_embed(
    guild_id: int, guild_name: str, *, title_prefix: str = ""
) -> discord.Embed:
    """Compute Authix stats for a guild and return a reusable embed."""
    now = int(time.time())
    week_ago = now - 7 * 24 * 3600
    day_ago = now - 24 * 3600
    hour_ago = now - RATE_LIMIT_WINDOW
    gid = str(guild_id)

    week_success = await db.verification_events.count_documents(
        {"guild_id": gid, "outcome": "success", "ts": {"$gte": week_ago}}
    )
    week_failure = await db.verification_events.count_documents(
        {"guild_id": gid, "outcome": "failure", "ts": {"$gte": week_ago}}
    )
    day_success = await db.verification_events.count_documents(
        {"guild_id": gid, "outcome": "success", "ts": {"$gte": day_ago}}
    )
    day_failure = await db.verification_events.count_documents(
        {"guild_id": gid, "outcome": "failure", "ts": {"$gte": day_ago}}
    )

    week_total = week_success + week_failure
    failure_rate = (
        f"{(week_failure / week_total * 100):.1f}%" if week_total else "—"
    )

    rate_limited = 0
    async for doc in db.captcha_attempts.find({"_id": {"$regex": f"^{gid}:"}}):
        recent = [t for t in doc.get("attempts", []) if t > hour_ago]
        if len(recent) >= RATE_LIMIT_MAX:
            rate_limited += 1

    # Mitigation status
    cfg = await db.guild_configs.find_one(
        {"guild_id": gid},
        {"_id": 0, "mitigation_active_until": 1, "mitigation_max": 1, "auto_mitigate": 1},
    ) or {}
    mit_until = cfg.get("mitigation_active_until")
    mitigating = bool(mit_until and int(mit_until) > now)
    mit_max = int(cfg.get("mitigation_max", 1))
    mit_minutes_left = (
        max(0, (int(mit_until) - now) // 60) if mitigating else 0
    )

    title = f"{title_prefix}Authix — Server Stats" if title_prefix else "Authix — Server Stats"
    embed = discord.Embed(
        title=title,
        description=f"Verification activity in **{guild_name}**.",
        color=0x00D2FF,
    )
    embed.add_field(
        name="Last 24 hours",
        value=f"✅ `{day_success}` verified\n❌ `{day_failure}` failed",
        inline=True,
    )
    embed.add_field(
        name="Last 7 days",
        value=(
            f"✅ `{week_success}` verified\n"
            f"❌ `{week_failure}` failed\n"
            f"📉 Failure rate: `{failure_rate}`"
        ),
        inline=True,
    )
    embed.add_field(
        name="Right now",
        value=(
            f"🚧 `{rate_limited}` user{'s' if rate_limited != 1 else ''} "
            f"rate-limited (3/hour cap)"
        ),
        inline=False,
    )
    if mitigating:
        embed.add_field(
            name="🛡️ Auto-mitigation active",
            value=(
                f"Rate limit tightened to **{mit_max}/hour** for "
                f"**{mit_minutes_left} more minute{'s' if mit_minutes_left != 1 else ''}**."
            ),
            inline=False,
        )
    embed.set_footer(text="Powered by Authix")
    return embed


@config_group.command(
    name="digest",
    description="Set a channel to receive a weekly stats digest (Monday ~9:00 UTC).",
)
@app_commands.describe(
    channel="Channel to post the weekly digest in. Leave empty to disable.",
)
async def config_digest(
    interaction: discord.Interaction,
    channel: Optional[discord.TextChannel] = None,
):
    if not await has_admin_permission(interaction):
        await interaction.response.send_message(
            "You don't have permission to use this command.", ephemeral=True
        )
        return

    cfg = await get_guild_config(interaction.guild_id)

    if channel is None:
        cfg["digest_channel_id"] = None
        await save_guild_config(interaction.guild_id, cfg)
        await interaction.response.send_message(
            "Weekly digest disabled.", ephemeral=True
        )
        return

    # Verify the bot can send messages + embed links in the target channel.
    me = interaction.guild.me
    perms = channel.permissions_for(me)
    if not (perms.send_messages and perms.embed_links):
        await interaction.response.send_message(
            f"I can't post in {channel.mention}. Please grant me **Send Messages** and "
            "**Embed Links** there, then try again.",
            ephemeral=True,
        )
        return

    cfg["digest_channel_id"] = str(channel.id)
    await save_guild_config(interaction.guild_id, cfg)
    await interaction.response.send_message(
        f"Weekly digest will be posted in {channel.mention} every **Monday around 09:00 UTC**. "
        "The first digest will arrive on the next scheduled run.",
        ephemeral=True,
    )


# ---- Raid alerts ----
ALERT_WINDOW_SECONDS = 30 * 60   # look at the last 30 minutes
ALERT_COOLDOWN_SECONDS = 30 * 60  # don't re-alert the same guild within 30 min


@config_group.command(
    name="alerts",
    description="Configure real-time raid alerts when captcha failure rate spikes.",
)
@app_commands.describe(
    channel="Channel to receive raid alerts. Leave empty to disable.",
    threshold="Failure-rate percent that triggers an alert (default 40, range 10-95).",
    min_attempts="Minimum attempts in the last 30 min before an alert can fire (default 5).",
    auto_mitigate=(
        "Automatically tighten rate limits to 1/hour for 60 min when an alert fires."
    ),
)
async def config_alerts(
    interaction: discord.Interaction,
    channel: Optional[discord.TextChannel] = None,
    threshold: Optional[int] = None,
    min_attempts: Optional[int] = None,
    auto_mitigate: Optional[bool] = None,
):
    if not await has_admin_permission(interaction):
        await interaction.response.send_message(
            "You don't have permission to use this command.", ephemeral=True
        )
        return

    cfg = await get_guild_config(interaction.guild_id)

    if (
        channel is None
        and threshold is None
        and min_attempts is None
        and auto_mitigate is None
    ):
        cfg["alert_channel_id"] = None
        await save_guild_config(interaction.guild_id, cfg)
        await interaction.response.send_message(
            "Raid alerts disabled.", ephemeral=True
        )
        return

    if channel is not None:
        me = interaction.guild.me
        perms = channel.permissions_for(me)
        if not (perms.send_messages and perms.embed_links):
            await interaction.response.send_message(
                f"I can't post in {channel.mention}. Please grant me **Send Messages** "
                "and **Embed Links** there, then try again.",
                ephemeral=True,
            )
            return
        cfg["alert_channel_id"] = str(channel.id)

    if threshold is not None:
        if threshold < 10 or threshold > 95:
            await interaction.response.send_message(
                "Threshold must be between 10 and 95.", ephemeral=True
            )
            return
        cfg["alert_threshold"] = threshold

    if min_attempts is not None:
        if min_attempts < 1 or min_attempts > 100:
            await interaction.response.send_message(
                "min_attempts must be between 1 and 100.", ephemeral=True
            )
            return
        cfg["alert_min_attempts"] = min_attempts

    if auto_mitigate is not None:
        cfg["auto_mitigate"] = bool(auto_mitigate)

    await save_guild_config(interaction.guild_id, cfg)

    target = (
        interaction.guild.get_channel(int(cfg["alert_channel_id"]))
        if cfg.get("alert_channel_id")
        else None
    )
    target_str = target.mention if target else "*(no channel set — alerts will not fire)*"
    mitigate_str = "✅ enabled (1/hour for 60 min)" if cfg.get("auto_mitigate") else "❌ disabled"
    await interaction.response.send_message(
        f"Raid alerts updated.\n"
        f"• Channel: {target_str}\n"
        f"• Threshold: **{cfg.get('alert_threshold', 40)}%** failure rate\n"
        f"• Minimum attempts: **{cfg.get('alert_min_attempts', 5)}** in last 30 min\n"
        f"• Auto-mitigation: **{mitigate_str}**\n"
        f"• Cooldown between alerts: 30 min",
        ephemeral=True,
    )


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
            "**3.** `/config panel` — post the verification panel in the current channel.\n"
            "**4.** `/config stats` — in-Discord dashboard of verifications, failures, and rate-limited users.\n"
            "**5.** `/config digest channel:#admin-log` — post the stats embed every Monday ~09:00 UTC.\n"
            "**6.** `/config alerts channel:#admin-log` — real-time raid alert when failure rate spikes.\n\n"
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
