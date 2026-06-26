import urllib.request

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness check — no auth required."""
    return {"status": "ok"}


@router.get("/_egress_ip")
def egress_ip() -> dict[str, str]:
    """TEMP deploy aid: report this server's public egress IP so the Aurora
    security group can whitelist Render's outbound NAT. Remove after wiring."""
    with urllib.request.urlopen("https://checkip.amazonaws.com", timeout=5) as r:
        return {"ip": r.read().decode().strip()}
