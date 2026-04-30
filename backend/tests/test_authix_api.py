"""Backend API tests for Authix service."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Read frontend/.env as a fallback for local execution
    import pathlib
    env_path = pathlib.Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Root / health ----
class TestRootHealth:
    def test_root(self, client):
        r = client.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("service") == "authix"
        assert data.get("status") == "ok"

    def test_health(self, client):
        r = client.get(f"{API}/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("api") == "ok"
        assert data.get("mongo") == "ok"


# ---- Stats ----
class TestStats:
    def test_stats_shape(self, client):
        r = client.get(f"{API}/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "servers_protected" in data
        assert "users_verified" in data
        assert "uptime_percent" in data
        assert isinstance(data["servers_protected"], int)
        assert isinstance(data["users_verified"], int)
        assert isinstance(data["uptime_percent"], (int, float))
        assert data["servers_protected"] >= 0
        assert data["users_verified"] >= 0


# ---- Commands ----
class TestCommands:
    def test_commands_list(self, client):
        r = client.get(f"{API}/commands", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "commands" in data
        cmds = data["commands"]
        assert isinstance(cmds, list)
        assert len(cmds) == 5
        names = [c["name"] for c in cmds]
        for expected in ["/config role", "/config admin", "/config panel", "/customization", "/help"]:
            assert expected in names, f"missing command {expected}"

    def test_customization_is_premium(self, client):
        r = client.get(f"{API}/commands", timeout=15)
        data = r.json()
        cust = next((c for c in data["commands"] if c["name"] == "/customization"), None)
        assert cust is not None
        assert cust["premium"] is True

    def test_non_premium_commands(self, client):
        r = client.get(f"{API}/commands", timeout=15)
        data = r.json()
        for c in data["commands"]:
            if c["name"] != "/customization":
                assert c["premium"] is False, f"{c['name']} should not be premium"
