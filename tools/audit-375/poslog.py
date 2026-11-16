#!/usr/bin/env python3
"""Positive control for the error capture: plant a 404, a console error and an exception and require all three.

    python3 tools/audit-375/poslog.py --base http://127.0.0.1:8761

A failed request, a console.error and an uncaught exception are planted in #currency; audit375.digest() must
report each, or an audit that says "0 console errors" means nothing. Exits 1 on a miss. run.py runs it before
every audit.
"""
import argparse
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'cdp'))
sys.path.insert(0, HERE)
from cdp import Chrome  # noqa: E402
from audit375 import CHROME_ARGS, READY, digest  # noqa: E402

PLANT = """(async () => { const i = new Image(); i.src = '/planted-404.png?x=1'; setTimeout(() => console.error('planted console error'), 50); setTimeout(() => { throw new Error('planted exception'); }, 80); await new Promise(r => setTimeout(r, 1500)); fetch('https://example.invalid/x').catch(() => {}); await new Promise(r => setTimeout(r, 1500)); return 1; })()"""


def run(base):
    """-> (ok, lines): one line per planted error, FIRED or MISSED."""
    c = Chrome(extra_args=CHROME_ARGS)
    try:
        for d in ("Page", "Runtime", "Log"):
            c.send(d + ".enable")
        c.send("Page.navigate", {"url": f"{base}/?log=1#currency"})
        c.js(READY % 500)
        c.events.clear()
        c.js(PLANT)
        c.js("0")
        found = digest(c.events)
    finally:
        c.close()
    text = " | ".join("%s: %s" % (f["kind"], f["text"]) for f in found)
    checks = [
        ("a failed request (404) is captured", any(f["kind"].startswith("log:network") and "404" in f["text"] for f in found)),
        ("a console.error is captured", any(f["kind"] == "console.error" and "planted console error" in f["text"] for f in found)),
        ("an uncaught exception is captured", any(f["kind"] == "exception" and "planted exception" in f["text"] for f in found)),
    ]
    lines = ["%-70s %s" % (name, "FIRED" if ok else "MISSED") for name, ok in checks]
    if not all(ok for _, ok in checks):
        lines.append("captured: " + text[:400])
    return all(ok for _, ok in checks), lines


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base", required=True)
    a = ap.parse_args()
    ok, lines = run(a.base)
    print("\n".join(lines))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
