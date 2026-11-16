#!/usr/bin/env python3
"""Load each legacy Market hash cold and record where it lands.

    python3 tools/audit-375/redirects.py --base http://127.0.0.1:8761 --out redirects.json

js/market-routes.js rewrites the old board hashes. For each one this reads the final hash, the topbar title and
the chips that carry aria-pressed=true, so a chip that shows as pressed twice is visible (Q1 found it on
#market-items).
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'cdp'))
sys.path.insert(0, HERE)
from cdp import Chrome  # noqa: E402
from audit375 import CHROME_ARGS, READY, SEED  # noqa: E402

LEGACY = ["#swap", "#exchange", "#exchange-ride", "#exchange-house", "#exchange-kids", "#exchange-swap", "#market-gear"]


def legacy(base):
    """-> [{'from', 'to', 'title', 'pressed'}] for each legacy hash."""
    res = []
    c = Chrome(extra_args=CHROME_ARGS)
    try:
        c.send("Page.enable")
        c.send("Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 2, "mobile": True})
        c.send("Page.navigate", {"url": f"{base}/?red=0#settings"})
        c.js(READY % 500)
        c.js(SEED % ('"retro"', "true", '"light"'))
        for i, h in enumerate(LEGACY):
            c.send("Page.navigate", {"url": f"{base}/?red={i + 1}{h}"})
            info = c.js(READY % 800)
            res.append({"from": h, "to": info["hash"],
                        "title": c.js("(document.querySelector('.topbar h1')||{}).textContent"),
                        "pressed": c.js("[...document.querySelectorAll('.bb-chip[aria-pressed=true]')].map(b => b.textContent.trim())")})
    finally:
        c.close()
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    res = legacy(a.base)
    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(res, fh, indent=1, ensure_ascii=False)
    print(json.dumps(res, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
