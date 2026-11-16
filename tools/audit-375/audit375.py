#!/usr/bin/env python3
"""Measure routes cold at 375 x 812 in headless Chrome and write one JSON line per route load.

    python3 tools/audit-375/audit375.py --base http://127.0.0.1:8761 --theme light \
        --routes tools/audit-375/baseline-2026-10-19/routes.txt --out run-light.jsonl
        [--only '#home,#sos'] [--tag name] [--seed-extra JS] [--resume] [--port N]

Normally run through tools/audit-375/run.py, which serves the tree, runs both themes, runs the positive
controls and prints the tables. This is the measuring half.

Every load is a cold deep link (`/?q=<n>#route`) in one Chrome profile per run, seeded with Mekong Retro
in the chosen theme. A load whose page reports document.hidden is refused: macOS display sleep flips
headless pages to hidden in the middle of a run and a hidden page undercounts controls (Q1: #settings
read 11 against 111). The load is retried, up to three times; if the page is still hidden the record
says so (`ok: false`, `hidden: true`) and the process exits 3. A hidden measurement is never kept as a
result. Exit codes: 0 every route measured visible, 1 a route failed for another reason, 3 a route stayed
hidden.

Imports Chrome from tools/cdp/cdp.py, not from the tree being audited, so an old commit can be audited
with today's driver (the tree only has to serve scripts/route-sweep.js and js/state.js, which every
build since 2026-10-19 does).
"""
import argparse
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'cdp'))
from cdp import Chrome, keep_awake  # noqa: E402

PAGE_JS = open(os.path.join(HERE, 'audit375-page.js'), encoding='utf-8').read()

CHROME_ARGS = ['--hide-scrollbars', '--enable-unsafe-swiftshader', '--window-size=375,812']
MAP_ROUTES = ('#map', '#places', '#weather-th', '#journey', '#nearby', '#route')

# Waits for the router to mount real content, then for fonts, then a settle delay. Returns what rendered.
READY = """(async () => {
  const t0 = Date.now();
  const app = () => document.querySelector('#app');
  while (Date.now() - t0 < 20000) {
    const a = app(), txt = a ? a.innerText : '';
    if (document.readyState === 'complete' && a && txt.length > 80 && !/Loading your companion/.test(txt)) break;
    await new Promise(r => setTimeout(r, 150));
  }
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, %d));
  const a = app(), root = document.documentElement;
  return { ms: Date.now() - t0, hash: location.hash, chars: a ? a.innerText.length : 0,
           theme: root.getAttribute('data-theme'), skin: root.getAttribute('data-skin') };
})()"""

# Seeds the skin and theme through the app's own live store (a first-run #home redirects to Welcome).
SEED = """(async () => {
  const s = await import('/js/state.js');
  s.store.profile.seenWelcome = true;
  s.store.profile.skin = %s;
  if (%s) s.store.profile.theme = %s;
  s.flushSaveNow();
  return { skin: s.store.profile.skin, theme: s.store.profile.theme };
})()"""

# MutationObserver quiet wait (route-sweep's settle idea): 40 quiet ticks and a 700 ms floor, 6 s cap.
SETTLE = """(async () => {
  const app = document.getElementById('app');
  const yt = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  let since = 0, muts = 0;
  const ob = new MutationObserver(() => { muts++; since = 0; });
  ob.observe(app, { childList: true, subtree: true, characterData: true });
  const t0 = performance.now();
  let quiet = false;
  while (performance.now() - t0 < 6000) {
    await yt(); since++;
    const opening = /Opening…|One moment\\./.test(app.textContent || '');
    if (!opening && since >= 40 && performance.now() - t0 >= 700) { quiet = true; break; }
  }
  ob.disconnect();
  return { quiet, mutations: muts, ms: Math.round(performance.now() - t0) };
})()"""

# Routes with no topbar by design (the first-run Welcome). Every other route is mounted when its topbar title is on screen: a deep link
# boots through the splash, a "Loading <flags> ..." card while the country data loads and an "Opening... / One moment." card first, and
# the first two are 55 and 137 characters of text without a topbar. Add a route here only when it has no topbar by design.
NO_TOPBAR = ("#welcome",)

# On a loaded machine the DOM can go quiet before a lazy screen module lands: wait up to 15 s for the screen, then let the caller load
# the route again. The router's own cards are matched by element and exact text (a screen can say "Opening…" itself: the Phrasebook's
# lesson line does).
MOUNTED = """(async (noTopbar) => {
  const txt = (e) => (e.textContent || '').trim();
  const state = () => {
    const a = document.getElementById('app');
    const text = txt(a || document.body);
    const has = (sel, re) => !!a && [...a.querySelectorAll(sel)].some((e) => re.test(txt(e)));
    const loading = has('h2', /^(Opening…|Loading\\b)/) || /Loading your companion/.test(text);
    const failed = has('h1', /^This screen could not open$/);
    return { topbar: !!document.querySelector('.topbar h1'), chars: text.length, loading, failed };
  };
  const good = (s) => !s.failed && (s.topbar || (noTopbar && s.chars >= 120 && !s.loading));
  const t0 = performance.now();
  let s = state();
  while (!good(s) && performance.now() - t0 < 15000) { await new Promise(r => setTimeout(r, 250)); s = state(); }
  return Object.assign(s, { ok: good(s), waitedMs: Math.round(performance.now() - t0) });
})(%s)"""

MAP_WAIT = """(async () => { const t0 = performance.now(); while (performance.now() - t0 < 9000) { if (document.querySelector('.maplibregl-ctrl-attrib')) break; await new Promise(r => setTimeout(r, 200)); } await new Promise(r => setTimeout(r, 800)); return { mounted: !!document.querySelector('.maplibregl-ctrl-attrib'), ms: Math.round(performance.now() - t0) }; })()"""

# route-sweep.js by import: hash-navigate to the route from another one and let it grade the route.
SWEEP = """(async (hash, alt) => {
  const m = await import('/scripts/route-sweep.js');
  location.hash = alt;
  await new Promise(r => setTimeout(r, 400));
  const esc = hash.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
  const s = await m.routeSweep({ only: new RegExp('^' + esc + '$'), quiet: true });
  return { routes: s.routes, clean: s.clean, layoutChecked: s.layoutChecked, broken: s.broken, foldPrefsWritten: s.foldPrefsWritten };
})(%s, %s)"""


def digest(events):
    """console errors / exceptions / browser error logs -> [{kind, text, url}]"""
    out, seen = [], set()
    for e in events:
        m, p = e["method"], e.get("params", {})
        item = None
        if m == "Runtime.exceptionThrown":
            d = p.get("exceptionDetails", {})
            ex = d.get("exception", {})
            item = {"kind": "exception", "text": (ex.get("description") or d.get("text") or "")[:300], "url": d.get("url", "")}
        elif m == "Runtime.consoleAPICalled" and p.get("type") == "error":
            parts = []
            for a in p.get("args", []):
                parts.append(str(a.get("value", a.get("description", ""))))
            item = {"kind": "console.error", "text": " ".join(parts)[:300], "url": (p.get("stackTrace", {}).get("callFrames") or [{}])[0].get("url", "")}
        elif m == "Log.entryAdded" and p.get("entry", {}).get("level") == "error":
            en = p["entry"]
            item = {"kind": "log:" + en.get("source", ""), "text": en.get("text", "")[:300], "url": en.get("url", "")}
        if item:
            k = (item["kind"].split(":")[0] if item["kind"].startswith("log") else item["kind"], item["text"][:120], item["url"])
            if k in seen:
                continue
            seen.add(k)
            out.append(item)
    return out


def open_session(args):
    """Chrome at 375 x 812 (2x, touch, the theme's colour scheme), seeded with Mekong Retro in that theme."""
    c = Chrome(port=args.port or None, extra_args=CHROME_ARGS)
    try:
        for d in ("Page", "Runtime", "Log"):
            c.send(d + ".enable")
        c.send("Emulation.setDeviceMetricsOverride", {"width": 375, "height": 812, "deviceScaleFactor": 2, "mobile": True})
        c.send("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 5})
        c.send("Emulation.setFocusEmulationEnabled", {"enabled": True})
        c.send("Emulation.setEmulatedMedia", {"features": [{"name": "prefers-color-scheme", "value": args.theme}]})
        c.send("Page.navigate", {"url": f"{args.base}/?seed=retro-{args.theme}#settings"})
        c.js(READY % 800)
        seeded = c.js(SEED % (json.dumps("retro"), "true", json.dumps(args.theme)))
        print("seeded", args.theme, seeded, c.version(), flush=True)
        if args.seed_extra:
            print("seed-extra", c.js("(async () => { const s = await import('/js/state.js'); " + args.seed_extra + "; s.flushSaveNow(); return 'ok'; })()"), flush=True)
        return c
    except BaseException:
        c.close()
        raise


def hidden_now(c):
    v = c.visibility()
    return bool(v.get("hidden")) or v.get("state") != "visible"


def measure_route(c, args, i, route, t0):
    """One route, up to three attempts. -> record."""
    rec = {"route": route, "theme": args.theme, "variant": args.tag, "attempts": 0}
    for attempt in range(3):
        rec["attempts"] = attempt + 1
        rec.pop("fatal", None)
        rec.pop("hidden", None)
        rec.pop("unmounted", None)
        c.events.clear()
        try:
            c.send("Page.bringToFront")
            c.send("Page.navigate", {"url": f"{args.base}/?q={args.theme}{i}-{int(t0)}{route}"})
            # cold deep-link boot: wait for #app to hold real content, then for the DOM to go quiet
            rec["boot"] = c.js(READY % 600)
            if hidden_now(c):          # refuse before spending minutes on a page that cannot be measured
                rec["hidden"] = True
                rec["ok"] = False
                rec["hiddenRetries"] = rec.get("hiddenRetries", 0) + 1
                time.sleep(3)
                continue
            rec["settle"] = c.js(SETTLE)
            rec["mount"] = c.js(MOUNTED % ("true" if route in NO_TOPBAR else "false"))
            if not rec["mount"]["ok"]:     # the screen never mounted: load the route again
                rec["ok"] = False
                rec["unmounted"] = True
                rec["fatal"] = "screen did not mount in %d ms (topbar %s, %d characters, loading card %s, failure card %s)" % (
                    rec["mount"]["waitedMs"], rec["mount"]["topbar"], rec["mount"]["chars"], rec["mount"]["loading"], rec["mount"]["failed"])
                time.sleep(2)
                continue
            if route in MAP_ROUTES:
                rec["mapWait"] = c.js(MAP_WAIT)
            c.js("0")
            rec["errorsBoot"] = digest(c.events)
            c.events.clear()
            rec["measure"] = c.js(PAGE_JS, timeout=1800)
            c.js("0")
            rec["errorsMeasure"] = digest(c.events)
            c.events.clear()
            alt = "#phrasebook" if route == "#home" else "#home"
            rec["sweep"] = c.js(SWEEP % (json.dumps(route), json.dumps(alt)), timeout=600)
            c.js("0")
            rec["errorsSweep"] = digest(c.events)
            rec["ok"] = True
        except (ConnectionError, BrokenPipeError):
            raise                      # Chrome is gone: the caller starts a new one
        except Exception as ex:  # keep going: a failed route is itself a finding
            rec["ok"] = False
            rec["fatal"] = str(ex)[:400]
        hid = ((rec.get("measure") or {}).get("viewport") or {}).get("hidden")
        if rec.get("ok") and not hid and not hidden_now(c):
            rec.pop("hidden", None)
            return rec
        if rec.get("ok") and (hid or rec.get("hidden")):
            rec["hidden"] = True
            rec["hiddenRetries"] = rec.get("hiddenRetries", 0) + 1
            rec["ok"] = False
            time.sleep(3)
    return rec


def done_routes(path, tag):
    """Routes already recorded visible and ok in an earlier run of this file (for --resume)."""
    done = set()
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            if line.strip():
                r = json.loads(line)
                if r.get("ok") and not r.get("hidden") and r.get("variant", "") == tag:
                    done.add(r["route"])
    return done


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--base", required=True, help="origin of a served tree, e.g. http://127.0.0.1:8761")
    ap.add_argument("--theme", required=True, choices=["light", "dark"])
    ap.add_argument("--out", required=True, help="JSON lines file to write")
    ap.add_argument("--routes", required=True, help="file with one #route per line")
    ap.add_argument("--only", default="", help="comma separated #routes to keep from --routes")
    ap.add_argument("--port", type=int, default=0, help="Chrome debugging port (default: a free one)")
    ap.add_argument("--seed-extra", default="", help="JS body run after the seed, with `s` = the state module")
    ap.add_argument("--tag", default="", help="variant name stored on every record")
    ap.add_argument("--resume", action="store_true", help="append to --out and skip routes already measured visible")
    args = ap.parse_args()

    routes = [r.strip() for r in open(args.routes) if r.strip() and not r.startswith("//")]
    if args.only:
        want = [x.strip() for x in args.only.split(",") if x.strip()]
        routes = [r for r in routes if r in want] or want
    skip = done_routes(args.out, args.tag) if args.resume else set()
    todo = [(i, r) for i, r in enumerate(routes) if r not in skip]
    keep_awake()
    out = open(args.out, "a" if args.resume else "w", encoding="utf-8")
    bad_hidden, bad_other, restarts = [], [], 0
    c = open_session(args)
    try:
        for i, route in todo:
            t0 = time.time()
            while True:
                try:
                    rec = measure_route(c, args, i, route, t0)
                    break
                except (ConnectionError, BrokenPipeError) as ex:
                    restarts += 1
                    print(f"{args.theme:5} {route:24} Chrome lost ({ex}); restart {restarts}", flush=True)
                    if restarts > 5:
                        raise
                    try:
                        c.close()
                    except Exception:
                        pass
                    c = open_session(args)
            rec["secs"] = round(time.time() - t0, 1)
            if rec.get("hidden"):
                bad_hidden.append(route)
            elif not rec.get("ok"):
                bad_other.append(route)
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
            out.flush()
            m = rec.get("measure") or {}
            print(f"{args.theme:5} {route:24} ok={rec['ok']} {rec['secs']:5.1f}s title={m.get('title')!r} chars={m.get('chars')} "
                  f"over={((m.get('overflowFoldsOpen') or {}).get('docOver'))} small={len((m.get('controls') or {}).get('small', []))} "
                  f"contrast={len((m.get('contrast') or {}).get('fails', []))} covered={len((m.get('controls') or {}).get('covered', []))} "
                  f"errs={len(rec.get('errorsBoot', []))}" + (" HIDDEN, REFUSED" if rec.get("hidden") else ""), flush=True)
    finally:
        out.close()
        c.close()
    if bad_hidden:
        print(f"{args.theme}: {len(bad_hidden)} route(s) stayed document.hidden after 3 tries and were refused: {', '.join(bad_hidden)}", flush=True)
        return 3
    if bad_other:
        print(f"{args.theme}: {len(bad_other)} route(s) failed: {', '.join(bad_other)}", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
