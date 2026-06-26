"""Poll until every document in the target workspace is terminal (done/failed)
and the doc count is stable (no new upload mid-flight). Print a status line each
tick. Exit 0 when quiescent, exit 2 on the 40-min guard."""
import asyncio
import sys
import time
from sqlalchemy import text
from app.db import _sessionmaker

WS = "1ac8d8b9-dd37-4d2c-b1cc-d3e9e97244ba"
TERMINAL = {"done", "failed"}
GUARD_S = 40 * 60
TICK_S = 25


async def snapshot(s):
    rows = (await s.execute(text(
        "select status, count(*) from documents where workspace_id=:w group by status"
    ), {"w": WS})).all()
    return {r[0]: r[1] for r in rows}


async def main():
    sm = _sessionmaker()
    start = time.time()
    stable_total = None
    stable_hits = 0
    while True:
        async with sm() as s:
            counts = await snapshot(s)
        total = sum(counts.values())
        active = sum(v for k, v in counts.items() if k not in TERMINAL)
        elapsed = int(time.time() - start)
        line = " ".join(f"{k}={v}" for k, v in sorted(counts.items()))
        print(f"[{elapsed:>4}s] total={total} active={active} | {line}", flush=True)
        if active == 0:
            if stable_total == total:
                stable_hits += 1
            else:
                stable_total, stable_hits = total, 1
            if stable_hits >= 2:  # terminal + count held one extra tick
                print("QUIESCENT", flush=True)
                return 0
        else:
            stable_hits = 0
        if elapsed > GUARD_S:
            print("GUARD_TIMEOUT", flush=True)
            return 2
        await asyncio.sleep(TICK_S)


sys.exit(asyncio.run(main()))
