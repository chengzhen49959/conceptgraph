import asyncio, traceback, uuid
import httpx
from sqlalchemy import text
from app.db import session_scope
from app.main import app
from app.auth import get_current_user, CurrentUser

USER = "a4d84498-3071-704c-8afd-eaab1274cb2f"

async def main():
    # 1) list this user's workspaces + role
    async with session_scope() as s:
        rows = (await s.execute(text("""
            SELECT w.id, w.name, w.type, m.role
            FROM workspaces w
            LEFT JOIN workspace_members m ON m.workspace_id = w.id AND m.user_id = :u
            WHERE w.owner_id = :u OR m.user_id = :u
            ORDER BY w.name
        """), {"u": USER})).all()
    print("=== workspaces for user ===")
    for r in rows:
        print(f"  {r[0]}  name={r[1]!r:20} type={r[2]:8} role={r[3]}")

    # 2) in-process clip into each, fresh URL per ws to avoid dedup short-circuit
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=USER, email="e", token="x")
    async with app.router.lifespan_context(app):
        tr = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=tr, base_url="http://t") as c:
            for r in rows:
                wid = str(r[0])
                body = {"title":"probe","content":"# probe\n\nbody text",
                        "source_url": f"https://probe.example/{wid}",
                        "workspace_id": wid, "metadata": {"site":"probe"}}
                try:
                    resp = await c.post("/api/imports/clip", json=body)
                    print(f"  clip {r[1]!r:20} -> {resp.status_code}  {resp.text[:120]}")
                except Exception as e:
                    print(f"  clip {r[1]!r:20} -> RAISED {type(e).__name__}: {e}")
                    traceback.print_exc()

asyncio.run(main())
