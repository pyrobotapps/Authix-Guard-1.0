from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Authix API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "authix", "status": "ok"}


@api_router.get("/health")
async def health():
    try:
        await client.admin.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return {"api": "ok", "mongo": "ok" if mongo_ok else "down"}


@api_router.get("/stats")
async def stats():
    """Public stats for the landing page."""
    doc = await db.authix_stats.find_one({"_id": "global"}, {"_id": 0}) or {}
    servers = int(doc.get("servers_protected", 0))
    users = int(doc.get("users_verified", 0))
    return {
        "servers_protected": servers,
        "users_verified": users,
        "uptime_percent": 99.98,
    }


@api_router.get("/commands")
async def commands():
    """Commands reference consumed by the landing page."""
    return {
        "commands": [
            {
                "name": "/config role",
                "description": "Set the verified role (and optional unverified role) for your server.",
                "premium": False,
            },
            {
                "name": "/config admin",
                "description": "Allow a specific role to manage Authix settings.",
                "premium": False,
            },
            {
                "name": "/config panel",
                "description": "Post the verification panel with the Verify button in a channel.",
                "premium": False,
            },
            {
                "name": "/config stats",
                "description": "In-Discord dashboard: verifications, failure rate, and rate-limited users.",
                "premium": False,
            },
            {
                "name": "/config digest",
                "description": "Auto-post the stats embed to a channel every Monday ~09:00 UTC.",
                "premium": False,
            },
            {
                "name": "/config alerts",
                "description": "Real-time raid alert when captcha failure rate spikes above your threshold.",
                "premium": True,
            },
            {
                "name": "/customization",
                "description": "Customize the embed title, body, footer, and image.",
                "premium": True,
            },
            {
                "name": "/help",
                "description": "Show the Authix setup guide.",
                "premium": False,
            },
        ]
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
