#!/usr/bin/env python3
"""Positive control: plant defects in a real route and require the page script to report each.

    python3 tools/audit-375/poscontrol.py --base http://127.0.0.1:8761

A detector that has never been shown to fire proves nothing when it reports zero. This plants, in #currency,
a 520 px wide box (overflow), grey text on white at 14 px (contrast), a 20 px button (tap size) and a fixed
overlay across a 120 x 44 px button (covered control), runs audit375-page.js, and exits 1 unless every one is
reported. run.py runs it before every audit.
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'cdp'))
sys.path.insert(0, HERE)
from cdp import Chrome  # noqa: E402
from audit375 import CHROME_ARGS, PAGE_JS, READY, SEED  # noqa: E402

PLANT = """(() => { const app = document.getElementById('app'); const box = document.createElement('div');
  box.id = 'q1-plant';
  box.innerHTML = '<div style="width:520px;height:12px;background:#c00">PLANT-WIDE</div>'
    + '<p style="color:#9a9a9a;background:#fff;font-size:14px">PLANT-LOWCONTRAST light grey on white</p>'
    + '<button style="width:20px;height:20px;padding:0">x</button>'
    + '<button id="q1-under" style="width:120px;height:44px">under overlay</button>';
  app.appendChild(box);
  const ov = document.createElement('div'); ov.style.cssText = 'position:fixed;left:0;right:0;top:300px;height:600px;background:rgba(0,0,0,.3);z-index:50'; ov.id = 'q1-overlay'; document.body.appendChild(ov); })()"""


def run(base):
    """-> (ok, lines): one line per planted defect, FIRED or MISSED."""
    c = Chrome(extra_args=CHROME_ARGS)
    try:
        c.send("Page.enable")
        c.send("Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 2, "mobile": True})
        c.send("Page.navigate", {"url": f"{base}/?pos=1#settings"})
        c.js(READY % 500)
        c.js(SEED % ('"retro"', "true", '"light"'))
        c.send("Page.navigate", {"url": f"{base}/?pos=2#currency"})
        c.js(READY % 1500)
        c.js(PLANT)
        r = c.js(PAGE_JS, timeout=600)
    finally:
        c.close()
    past = r["overflowFoldsOpen"]["pastRight"]
    low = [f["ratio"] for f in r["contrast"]["fails"] if "PLANT" in f["text"]]
    small = [s for s in r["controls"]["small"] if s["vis"][0] == 20]
    covered = [x["label"] for x in r["controls"]["covered"]]
    checks = [
        ("overflow: a 520 px box reported past the edge (145 px expected)", 140 <= past <= 150, "%s px" % past),
        ("contrast: grey on white text reported below 4.5:1", bool(low) and min(low) < 4.5, "%s:1" % (min(low) if low else "none")),
        ("tap size: a 20 px button reported under 44 px", bool(small), "%d reported" % len(small)),
        ("covered: a button under a fixed overlay reported", any("under overlay" in x for x in covered), "%d covered" % len(covered)),
    ]
    lines = ["%-70s %s (%s)" % (name, "FIRED" if ok else "MISSED", detail) for name, ok, detail in checks]
    return all(ok for _, ok, _ in checks), lines


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base", required=True)
    a = ap.parse_args()
    ok, lines = run(a.base)
    print("\n".join(lines))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
