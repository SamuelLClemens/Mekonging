#!/usr/bin/env python3
"""Screenshot helper for checking a finding by eye: seed Mekong Retro, optionally seed more, load a route, scroll to a selector.

    python3 tools/audit-375/shot.py --base http://127.0.0.1:8761 --route '#calendar' --theme dark --out /path/shot.png \
        [--scroll 'button.cal-today'] [--seed-extra JS] [--wait 2500]

Saves the 375 x 812 viewport (2x) as a PNG. Keep screenshots out of the repository.
"""
import argparse
import base64
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'cdp'))
sys.path.insert(0, HERE)
from cdp import Chrome, keep_awake  # noqa: E402
from audit375 import CHROME_ARGS, READY, SEED  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base", required=True)
    ap.add_argument("--route", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--theme", default="light", choices=["light", "dark"])
    ap.add_argument("--scroll", default="", help="CSS selector to scroll to the middle of the viewport")
    ap.add_argument("--seed-extra", default="", help="JS body run after the seed, with `s` = the state module")
    ap.add_argument("--wait", type=int, default=2500, help="milliseconds to wait after the route renders")
    a = ap.parse_args()
    keep_awake()
    c = Chrome(extra_args=CHROME_ARGS)
    try:
        c.send("Page.enable")
        c.send("Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 2, "mobile": True})
        c.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-color-scheme", "value": a.theme}]})
        c.send("Page.navigate", {"url": f"{a.base}/?shot=0#settings"})
        c.js(READY % 500)
        c.js(SEED % ('"retro"', "true", json.dumps(a.theme)))
        if a.seed_extra:
            c.js("(async () => { const s = await import('/js/state.js'); " + a.seed_extra + "; s.flushSaveNow(); return 1; })()")
        c.send("Page.navigate", {"url": f"{a.base}/?shot=1{a.route}"})
        c.js(READY % a.wait)
        c.assert_visible()
        if a.scroll:
            print(c.js("(() => { const e = document.querySelector(%s); if (!e) return 'no match'; e.scrollIntoView({block:'center'}); const r = e.getBoundingClientRect(); return JSON.stringify([r.left, r.top, r.width, r.height]); })()" % json.dumps(a.scroll)))
            c.js("new Promise(r => setTimeout(r, 600))")
        with open(a.out, "wb") as fh:
            fh.write(base64.b64decode(c.send("Page.captureScreenshot", {"format": "png"})["data"]))
        print("saved", a.out)
    finally:
        c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
