#!/usr/bin/env python3
"""Capture Mekonging screens as image files through headless Chrome's DevTools protocol.

Standard library only: no websocket package is installed on the development machine. Headless
Chrome is not `document.hidden`, so layout, requestAnimationFrame and timers behave as they do on
a phone. The Browser pane computes no layout while hidden and cannot write files.

    python3 scripts/serve.py 8950          # in another terminal, from the repository root
    python3 tools/style-tiles/capture.py --base http://127.0.0.1:8950 --out <scratchpad>/baseline \
        --surfaces classic-light,classic-dark \
        --routes home,phrasebook,me,places,explore,everything,place-th-bkk-wat-pho,settings

A surface is `classic-light`, `classic-dark` or a named skin (night, silk, tropical, psych,
psychnight, expedition).

`--preview a.css,b.css` renders candidate themes that are not in the app yet (VISUAL_DIRECTION_PROMPT.md
Phase 1). Each stylesheet comes from preview.py; it is injected at document start with
Page.addScriptToEvaluateOnNewDocument as `<style id="mk-preview">`, kept last in <head>, and the
script stamps `html[data-preview]` plus the wayfinding hooks the stylesheet reads: `html[data-tab]`
(the active tab), `html[data-country]` (from the route or the country context line), `html[data-route]`
(the hash head) and `data-cc` on country chips, cards and context lines (from their flags). Every shot
then asserts that the logo's computed stop colours are the pinned sun, and that every element painted
in a country colour also names its country, so colour is never the only cue. Each surface is seeded through the app's live store, which keeps the
capture deterministic: Classic's `auto` theme otherwise follows prefers-color-scheme and then the
local clock, and a first-run `#home` redirects to Welcome. Screenshots go to the session
scratchpad, never into the repository.

`launch()` and `CDP` are importable for other in-browser checks, such as a computed-style digest.
"""
import argparse, base64, json, os, re, shutil, socket, struct, subprocess, tempfile, time, urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SKIN_MODE = {"night": "dark", "psychnight": "dark", "expedition": "dark",
             "silk": "light", "tropical": "light", "psych": "light"}   # mirrors applyTheme() in js/main.js


class WS:
    """A minimal RFC 6455 client: masked client frames, no Origin header (so Chrome needs no
    --remote-allow-origins), fragmented and ping frames handled."""

    def __init__(self, url):
        assert url.startswith("ws://"), url
        hostport, path = url[5:].split("/", 1)
        host, port = hostport.rsplit(":", 1)
        self.sock = socket.create_connection((host, int(port)), timeout=90)
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall((f"GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n"
                           f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n"
                           f"Sec-WebSocket-Version: 13\r\n\r\n").encode())
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise RuntimeError("websocket handshake: connection closed")
            resp += chunk
        head, rest = resp.split(b"\r\n\r\n", 1)
        if b" 101 " not in head.split(b"\r\n")[0]:
            raise RuntimeError("websocket handshake refused: " + head.decode(errors="replace"))
        self.buf = bytearray(rest)

    def _exact(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(max(1 << 16, n - len(self.buf)))
            if not chunk:
                raise RuntimeError("websocket closed")
            self.buf += chunk
        out = bytes(self.buf[:n])
        del self.buf[:n]
        return out

    def _frame(self, opcode, payload):
        hdr = bytearray([0x80 | opcode])
        n = len(payload)
        if n < 126:
            hdr.append(0x80 | n)
        elif n < 65536:
            hdr.append(0x80 | 126); hdr += struct.pack(">H", n)
        else:
            hdr.append(0x80 | 127); hdr += struct.pack(">Q", n)
        mask = os.urandom(4)
        hdr += mask
        self.sock.sendall(bytes(hdr) + bytes(b ^ mask[i & 3] for i, b in enumerate(payload)))

    def send(self, text):
        self._frame(0x1, text.encode())

    def recv(self):
        parts = []
        while True:
            b1, b2 = self._exact(2)
            fin, op, n = b1 & 0x80, b1 & 0x0F, b2 & 0x7F
            if n == 126:
                n = struct.unpack(">H", self._exact(2))[0]
            elif n == 127:
                n = struct.unpack(">Q", self._exact(8))[0]
            mask = self._exact(4) if b2 & 0x80 else None
            data = self._exact(n)
            if mask:
                data = bytes(b ^ mask[i & 3] for i, b in enumerate(data))
            if op == 0x8:
                raise RuntimeError("websocket closed by peer")
            if op == 0x9:
                self._frame(0xA, data)
                continue
            if op == 0xA:
                continue
            parts.append(data)
            if fin:
                return b"".join(parts).decode()


class CDP:
    def __init__(self, ws_url):
        self.ws, self.next_id = WS(ws_url), 0

    def call(self, method, **params):
        self.next_id += 1
        mid = self.next_id
        self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    def js(self, expr, await_promise=True):
        r = self.call("Runtime.evaluate", expression=expr, awaitPromise=await_promise, returnByValue=True)
        if "exceptionDetails" in r:
            raise RuntimeError("JS exception: " + json.dumps(r["exceptionDetails"])[:600])
        return r.get("result", {}).get("value")


def launch(port, profile):
    """Start headless Chrome with its own profile; return (process, page websocket URL)."""
    proc = subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={port}",
                             f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
                             "--hide-scrollbars", "--enable-unsafe-swiftshader", "--window-size=375,812",
                             "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(100):
        try:
            targets = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=2))
            pages = [t for t in targets if t.get("type") == "page"]
            if pages:
                return proc, pages[0]["webSocketDebuggerUrl"]
        except OSError:
            pass
        time.sleep(0.2)
    proc.kill()
    raise RuntimeError("Chrome did not expose a page target")


# Waits for the router to mount real content, then for fonts, then a settle delay (lazy screens,
# images, weather). Returns what was rendered so the caller can check it.
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

SEED = """(async () => {
  const s = await import('/js/state.js');
  s.store.profile.seenWelcome = true;
  s.store.profile.skin = %s;
  if (%s) s.store.profile.theme = %s;
  s.flushSaveNow();
  return { skin: s.store.profile.skin, theme: s.store.profile.theme };
})()"""


PREVIEW_SCRIPT = r"""(() => {
  const ID = %s, CSS = %s;
  const FLAGS = { '\u{1F1F9}\u{1F1ED}': 'th', '\u{1F1FB}\u{1F1F3}': 'vi', '\u{1F1F0}\u{1F1ED}': 'kh', '\u{1F1F1}\u{1F1E6}': 'la' };
  const TABS = ['home', 'talk', 'me', 'places', 'explore'];   // the order of TABS in js/main.js
  function ensure() {
    const root = document.documentElement;
    if (!root) return;
    if (root.getAttribute('data-preview') !== ID) root.setAttribute('data-preview', ID);
    let st = document.getElementById('mk-preview');
    if (!st) { st = document.createElement('style'); st.id = 'mk-preview'; st.textContent = CSS; }
    const parent = document.head || root;
    if (st.parentNode !== parent || parent.lastElementChild !== st) parent.appendChild(st);
  }
  function sync() {
    ensure();
    const root = document.documentElement;
    const head = (location.hash || '#home').replace(/^#/, '');
    root.setAttribute('data-route', head.split('-')[0] || 'home');
    const cur = document.querySelector('.tabbar button[aria-current="page"]');
    if (cur) root.setAttribute('data-tab', TABS[[...cur.parentNode.children].indexOf(cur)] || '');
    else root.removeAttribute('data-tab');
    for (const el of document.querySelectorAll('.country-chip, .explore-card, .country-context')) {
      if (el.hasAttribute('data-cc')) continue;
      const t = el.textContent || '';
      for (const f in FLAGS) if (t.includes(f)) { el.setAttribute('data-cc', FLAGS[f]); break; }
    }
    let cc = (head.match(/(?:^|-)(th|vi|kh|la)(?:-|$)/) || [])[1];
    if (!cc) { const ctx = document.querySelector('.country-context[data-cc]'); if (ctx) cc = ctx.getAttribute('data-cc'); }
    if (cc) root.setAttribute('data-country', cc); else root.removeAttribute('data-country');
  }
  const mo = new MutationObserver(() => { mo.disconnect(); try { sync(); } finally { watch(); } });
  function watch() { mo.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current'] }); }
  ensure(); watch();
  addEventListener('hashchange', sync);
  document.addEventListener('DOMContentLoaded', sync);
})()"""

# Per shot, with a preview: the pinned logo, and a country name beside every country colour.
PREVIEW_CHECK = """(() => {
  const want = ['rgb(242, 169, 59)', 'rgb(232, 99, 42)', 'rgb(214, 51, 108)'];
  const logo = document.querySelector('svg.logo');
  let logoOk = null;
  if (logo) {
    const stops = [...logo.querySelectorAll('stop')].map(s => getComputedStyle(s).stopColor);
    const rays = getComputedStyle(logo.querySelector('g[stroke-width] line') || logo).stroke;
    const river = getComputedStyle(logo.querySelector('path')).stroke;
    logoOk = JSON.stringify(stops) === JSON.stringify(want) && rays === want[0] && river === 'rgb(22, 163, 154)';
  }
  const NAMES = { th: 'Thailand', vi: 'Vietnam', kh: 'Cambodia', la: 'Laos' };
  const coloured = [...document.querySelectorAll('[data-cc], .ctry-group[data-country]')];
  const unnamed = coloured.filter(el => {
    const cc = el.getAttribute('data-cc') || el.getAttribute('data-country');
    const text = (el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '');
    return !text.includes(NAMES[cc]);
  }).map(el => el.className.baseVal !== undefined ? el.className.baseVal : el.className);
  const root = document.documentElement;
  return { preview: root.getAttribute('data-preview'), styled: !!document.getElementById('mk-preview'),
           tab: root.getAttribute('data-tab'), country: root.getAttribute('data-country'), route: root.getAttribute('data-route'),
           logo: logoOk, countryMarks: coloured.length, unnamed };
})()"""


def preview_id(css):
    m = re.match(r"/\* mk-preview id=([\w-]+)", css)
    if not m:
        raise SystemExit("a --preview stylesheet must start with the /* mk-preview id=... */ line that preview.py writes")
    return m.group(1)


def surface_spec(surface):
    """-> (skin, theme to seed or None, expected data-theme, expected data-skin)."""
    if surface in ("classic-light", "classic-dark"):
        mode = surface.split("-")[1]
        return "classic", mode, mode, None
    if surface not in SKIN_MODE:
        raise SystemExit(f"unknown surface {surface!r}: use classic-light, classic-dark or one of {sorted(SKIN_MODE)}")
    return surface, None, SKIN_MODE[surface], surface


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--base", required=True, help="the app's origin, e.g. http://127.0.0.1:8950")
    ap.add_argument("--out", required=True, help="output directory (use the session scratchpad)")
    ap.add_argument("--routes", required=True, help="comma-separated hash routes, without '#'")
    ap.add_argument("--surfaces", default="classic-light,classic-dark")
    ap.add_argument("--settle", type=int, default=2500, help="ms to wait after content appears")
    ap.add_argument("--route-settle", default="places=9000",
                    help="per-route overrides, e.g. places=9000 (the satellite map paints late)")
    ap.add_argument("--port", type=int, default=9333)
    ap.add_argument("--webp", action="store_true", help="also write a WebP copy of each shot")
    ap.add_argument("--preview", default="", help="comma-separated stylesheets from preview.py; Classic surfaces only")
    args = ap.parse_args()
    previews = [p for p in args.preview.split(",") if p] or [None]
    route_settle = {k: int(v) for k, v in (x.split("=") for x in args.route_settle.split(",") if x)}
    if previews != [None] and any(not s.startswith("classic-") for s in args.surfaces.split(",")):
        raise SystemExit("--preview themes ride Classic's light and dark modes: use --surfaces classic-light,classic-dark")
    os.makedirs(args.out, exist_ok=True)
    profile = tempfile.mkdtemp(prefix="mk-capture-")   # a fresh profile: no stale service worker or store
    proc, ws_url = launch(args.port, profile)
    report = []
    try:
        c = CDP(ws_url)
        c.call("Page.enable")
        c.call("Emulation.setDeviceMetricsOverride", width=375, height=812, deviceScaleFactor=2, mobile=True)
        c.call("Emulation.setTouchEmulationEnabled", enabled=True, maxTouchPoints=5)
        for preview in previews:
          css = open(preview, encoding="utf-8").read() if preview else None
          pid = preview_id(css) if css else None
          label = os.path.splitext(os.path.basename(preview))[0] if preview else None
          script = (c.call("Page.addScriptToEvaluateOnNewDocument", source=PREVIEW_SCRIPT % (json.dumps(pid), json.dumps(css)))
                    ["identifier"] if css else None)
          for surface in args.surfaces.split(","):
            skin, theme, want_theme, want_skin = surface_spec(surface)
            c.call("Emulation.setEmulatedMedia", features=[{"name": "prefers-color-scheme", "value": want_theme}])
            # Settings sits outside the first-run gate, and the seed writes the same store module
            # instance the app imported.
            c.call("Page.navigate", url=f"{args.base}/?seed={surface}#settings")
            c.js(READY % 800)
            seeded = c.js(SEED % (json.dumps(skin), "true" if theme else "false", json.dumps(theme)))
            print("seeded", label or "", surface, seeded, flush=True)
            for i, route in enumerate(args.routes.split(",")):
                c.call("Page.navigate", url=f"{args.base}/?b={label or ''}{surface}{i}#{route}")
                info = c.js(READY % route_settle.get(route.split("-")[0], args.settle))
                stem = os.path.join(args.out, f"{route}--{label}--{surface}" if label else f"{route}--{surface}")
                ok = info.get("theme") == want_theme and info.get("skin") == want_skin and info.get("chars", 0) >= 80
                if css:
                    pv = c.js(PREVIEW_CHECK)
                    info.update(pv=pv, preview=label)
                    ok = ok and pv["preview"] == pid and pv["styled"] and pv["logo"] is not False and not pv["unnamed"]
                open(stem + ".png", "wb").write(base64.b64decode(c.call("Page.captureScreenshot", format="png")["data"]))
                if args.webp:
                    shot = c.call("Page.captureScreenshot", format="webp", quality=72)["data"]
                    open(stem + ".webp", "wb").write(base64.b64decode(shot))
                info.update(route=route, surface=surface, ok=ok)
                report.append(info)
                print(json.dumps(info, ensure_ascii=False), flush=True)
          if script:
            c.call("Page.removeScriptToEvaluateOnNewDocument", identifier=script)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(profile, ignore_errors=True)
    json.dump(report, open(os.path.join(args.out, "report.json"), "w"), indent=1, ensure_ascii=False)
    bad = [f"{r['route']}/{r.get('preview') or ''}/{r['surface']}" for r in report if not r["ok"]]
    print("CAPTURE", "FAIL" if bad else "PASS", f"{len(report)} shots", "bad:", bad)
    raise SystemExit(1 if bad else 0)


if __name__ == "__main__":
    main()
