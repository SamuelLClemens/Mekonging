#!/usr/bin/env python3
"""The routes scripts/route-sweep.js derives from js/nav-groups.js, for the audit.

    python3 tools/audit-375/listroutes.py --base http://127.0.0.1:8761 --out routes-derived.json [--routes routes.txt]

route-sweep.js builds its list from nav-groups.js (every feature and every #hub-* door) plus an EXTRA table of
real destinations that are not features: the tab bar, search, saved, SOS, welcome and, since Q2, the Market tab
and its four chips. A tree older than Q2 has no Market in EXTRA (the 2026-10-19 audit measured 77 routes because
it added the five Market routes by hand), so ALWAYS adds them whenever the tree's own list lacks one.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'cdp'))
sys.path.insert(0, HERE)
from cdp import Chrome  # noqa: E402
from audit375 import CHROME_ARGS, READY  # noqa: E402

ALWAYS = [('#market', 'the Market tab'),
          ('#market-items', 'a Market chip'), ('#market-rooms', 'a Market chip'),
          ('#market-rides', 'a Market chip'), ('#market-cash', 'a Market chip')]


def derive(base):
    """-> [{'hash': '#home', 'from': 'the tab bar'}, ...] as route-sweep.js lists them, plus any missing Market route."""
    c = Chrome(extra_args=CHROME_ARGS)
    try:
        c.send("Page.enable")
        c.send("Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 2, "mobile": True})
        c.send("Page.navigate", {"url": f"{base}/?list=1#settings"})
        c.js(READY % 500)
        routes = c.js("(async () => { const m = await import('/scripts/route-sweep.js'); return await m.routeSweepRoutes(); })()")
    finally:
        c.close()
    have = {r["hash"] for r in routes}
    for h, why in ALWAYS:
        if h not in have:
            routes.append({"hash": h, "from": why})
    return routes


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base", required=True)
    ap.add_argument("--out", required=True, help="routes-derived.json to write")
    ap.add_argument("--routes", default="", help="also write one #route per line to this file")
    a = ap.parse_args()
    routes = derive(a.base)
    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(routes, fh, indent=1, ensure_ascii=False)
    if a.routes:
        with open(a.routes, "w", encoding="utf-8") as fh:
            fh.write("\n".join(r["hash"] for r in routes) + "\n")
    print(len(routes), "routes: nav-groups.js, route-sweep EXTRA and the Market routes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
