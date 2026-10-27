#!/usr/bin/env python3
"""Computed-style digest: prove that a style change moved nothing it was not meant to move (S1, docs/PROGRAM.md 5.4).

    python3 tools/style-digest/digest.py <before-url> <after-url> [--out DIR] [--screens a,b] [--themes x,y]

<before-url> and <after-url> are two running copies of the app, for example `python3 scripts/serve.py 8964` in a
worktree at `origin/feat/scaffold-bangkok-slice` and another in the branch under test. For every theme and screen
the driver loads each in headless Chrome at 375 x 812 (device scale 2, mobile), waits for the page to settle, and
digests every element:

  * a 53-bit hash of ALL its computed properties (custom properties excluded) and its box, keyed by its path in the
    DOM (tag, first class, child index), and the same for its ::before and ::after where they generate content;
  * separately, the value of every custom property declared in the app's stylesheets, resolved on <html>.

It then loads the BEFORE tree a second time, so a difference that appears between two loads of the same code (a
clock, a shimmer, a random tip) is reported as noise and not as a change. The result per screen:

  added / removed   an element exists on one side only
  changed           the same path has a different hash, and the path is not noise; each is explained property by property
  tokens            a custom property that existed before and has another value (a NEW token name is listed, not a fault)

Exit 0 only if no screen has an added, removed or changed element and no existing token moved. A change that is
meant to move something (an R slice) passes `--allow <selector-prefix>` for the part of the DOM it owns; its elements
are then reported but not counted.

The driver refuses a page that loaded with `document.hidden` true (layout reads 0 there; keep the display awake,
`caffeinate -d`), runs every host except 127.0.0.1 as unresolvable so the pages are offline and repeatable, and
disables animations and transitions on both sides. Profiles live in ~/Library/Caches/mk-s1-chrome (a profile under
/private/tmp makes Chrome fail on this machine).
"""
import json
import os
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Chrome  # noqa: E402

PROFILES = os.path.expanduser('~/Library/Caches/mk-s1-chrome')

# the eight screens of docs/PROGRAM.md 5.4 (S0's list): the tab roots, a place card without a photo, the map screen
# and the Market's home
SCREENS = [
    ('home', '#home'),
    ('places', '#places'),
    ('place-card', '#place-th-chiang-mai-old-city-hostels'),
    ('explore', '#explore'),
    ('talk', '#phrasebook'),
    ('weather', '#weather-th'),
    ('journey', '#journey'),
    ('market', '?market=fixture#market'),
]
# the three themes: Mekong Retro light and dark (the default, following the phone) and Night Market (a fixed dark skin)
THEMES = {
    'retro-light': ('retro', 'light'),
    'retro-dark': ('retro', 'dark'),
    'night-dark': ('night', 'auto'),
}

PAGE_JS = r"""
(() => {
  if (window.__digest) return true;
  const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT', 'TEMPLATE']);
  const cs0 = getComputedStyle(document.body);
  const names = [];
  for (let i = 0; i < cs0.length; i++) if (!cs0[i].startsWith('--')) names.push(cs0[i]);
  names.sort();
  const cyrb53 = (str) => {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };
  const rect = (el) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100).join(','); };
  const props = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo || null);
    if (pseudo && (cs.content === 'none' || cs.content === 'normal' || cs.content === '')) return null;
    const out = {};
    for (const n of names) out[n] = cs.getPropertyValue(n);
    return out;
  };
  const walk = (visit) => {
    const rec = (el, path) => {
      let i = 0;
      for (const c of el.children) {
        if (SKIP.has(c.tagName)) { i++; continue; }
        const cls = typeof c.className === 'string' && c.className.trim() ? '.' + c.className.trim().split(/\s+/)[0] : '';
        const p = path + '>' + c.tagName.toLowerCase() + cls + ':' + i;
        visit(c, p);
        rec(c, p);
        i++;
      }
    };
    rec(document.documentElement, 'html');
  };
  window.__digest = {
    capture() {
      const paths = {};
      walk((el, p) => {
        const a = props(el), b = props(el, '::before'), c = props(el, '::after');
        let s = names.map((n) => a[n]).join('|') + '#' + rect(el);
        if (b) s += '#b' + JSON.stringify(b);
        if (c) s += '#a' + JSON.stringify(c);
        paths[p] = cyrb53(s);
      });
      const tokens = {};
      const seen = new Set();
      const addNames = (rules) => { for (const r of rules) { if (r.style) { for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) seen.add(r.style[i]); } if (r.cssRules) addNames(r.cssRules); } };
      for (const sh of document.styleSheets) { try { addNames(sh.cssRules); } catch (e) { /* cross-origin */ } }
      const root = getComputedStyle(document.documentElement);
      for (const n of [...seen].sort()) tokens[n] = root.getPropertyValue(n).trim();
      return { hidden: document.hidden, n: Object.keys(paths).length, paths, tokens,
               skin: document.documentElement.dataset.skin, theme: document.documentElement.dataset.theme,
               scrollH: document.documentElement.scrollHeight, title: document.title };
    },
    explain(list) {
      const want = new Set(list), out = {};
      walk((el, p) => {
        if (!want.has(p)) return;
        const a = props(el), b = props(el, '::before'), c = props(el, '::after');
        out[p] = { box: rect(el), props: a, before: b, after: c, text: (el.textContent || '').trim().slice(0, 50) };
      });
      return out;
    },
  };
  const style = document.createElement('style');
  style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
  document.documentElement.append(style);
  window.__mut = 0;
  new MutationObserver(() => { window.__mut++; }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  return true;
})()
"""

SEED_JS = """(async () => { const m = await import('/js/state.js'); m.store.profile.seenWelcome = true;
  m.store.profile.skin = %s; m.store.profile.theme = %s; m.store.profile.prefs.netMode = 'online'; m.flushSaveNow(); return true; })()"""


def errors_of(events):
    errs = []
    for e in events:
        m, p = e.get('method'), e.get('params', {})
        if m == 'Runtime.exceptionThrown':
            d = p.get('exceptionDetails', {})
            errs.append('exception: ' + str((d.get('exception') or {}).get('description') or d.get('text'))[:160])
        elif m == 'Runtime.consoleAPICalled' and p.get('type') == 'error':
            errs.append('console: ' + ' '.join(str(a.get('value', a.get('description', ''))) for a in p.get('args', []))[:160])
    return errs


def settle(sides, min_s=8.0, quiet_s=2.0, max_s=40.0):
    """Wait until every side has been up for at least `min_s` seconds and has had no DOM mutation for `quiet_s`, so pages
    loaded together are captured at the same age (a status that resolves after a few seconds is then in both or in neither)."""
    end = time.time() + max_s
    while time.time() < end:
        for side in sides:
            side.c.pump(0.25)
        calm = [side.quiet(quiet_s) for side in sides]
        if all(calm) and all(time.time() - side.t0 >= min_s for side in sides):
            return


class Side:
    """One copy of the app in its own headless Chrome and profile."""

    def __init__(self, label, base, port, theme):
        self.label, self.base = label, base.rstrip('/')
        self.skin, self.mode = THEMES[theme]
        self.prof = os.path.join(PROFILES, f'{label}-{theme}')
        shutil.rmtree(self.prof, ignore_errors=True)
        os.makedirs(PROFILES, exist_ok=True)
        self.c = Chrome(self.prof, port, ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'])
        for d in ('Page', 'Runtime', 'Network', 'Log'):
            self.c.send(d + '.enable')
        self.c.send('Network.setCacheDisabled', {'cacheDisabled': True})
        self.c.send('Network.setBypassServiceWorker', {'bypass': True})
        self.c.send('Emulation.setEmulatedMedia', {'features': [{'name': 'prefers-color-scheme', 'value': 'dark' if self.mode == 'dark' or self.skin == 'night' else 'light'}]})
        self.c.send('Emulation.setDeviceMetricsOverride', {'width': 375, 'height': 812, 'deviceScaleFactor': 2, 'mobile': True})
        self.c.send('Page.addScriptToEvaluateOnNewDocument', {'source': 'window.__t0 = 1;'})
        self.go('#home')
        self.c.js(SEED_JS % (json.dumps(self.skin), json.dumps(self.mode)))
        self.c.pump(0.5)

    def start(self, route):
        self.c.events.clear()
        # through about:blank, so the page loads in full even when only the hash differs (a hash-only
        # navigation keeps the running SPA and its in-memory state)
        self.c.send('Page.navigate', {'url': 'about:blank'})
        self.c.pump(0.3)
        self.c.send('Page.navigate', {'url': self.base + '/' + route})

    def ready(self):
        self.c.wait("document.readyState === 'complete' && !!document.querySelector('#app .screen')", 150)
        self.c.js(PAGE_JS)
        self.t0 = time.time()
        self.last, self.quiet_since = self.c.js('window.__mut'), time.time()

    def quiet(self, quiet_s):
        now = self.c.js('window.__mut')
        if now != self.last:
            self.last, self.quiet_since = now, time.time()
        return time.time() - self.quiet_since >= quiet_s

    def go(self, route):
        self.start(route)
        self.ready()
        settle([self])

    def capture(self):
        d = self.c.js('window.__digest.capture()', 300)
        d['errors'] = errors_of(self.c.events)
        return d

    def explain(self, paths):
        return self.c.js('window.__digest.explain(%s)' % json.dumps(paths), 300)

    def close(self):
        self.c.close()


def diff_props(a, b):
    out = []
    if a['box'] != b['box']:
        out.append(f"box {a['box']} -> {b['box']}")
    for k, name in (('props', ''), ('before', '::before '), ('after', '::after ')):
        x, y = a.get(k), b.get(k)
        if (x is None) != (y is None):
            out.append(f'{name}generated content appears or goes')
            continue
        if x is None:
            continue
        for n in sorted(x):
            if x[n] != y.get(n):
                out.append(f'{name}{n}: {x[n]} -> {y.get(n)}')
    return out


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        return 2
    before, after = args[0], args[1]
    opt = lambda name, default=None: args[args.index(name) + 1] if name in args else default
    screens = [s for s in SCREENS if not opt('--screens') or s[0] in opt('--screens').split(',')]
    themes = [t for t in THEMES if not opt('--themes') or t in opt('--themes').split(',')]
    allow = opt('--allow')
    out_dir = opt('--out')
    port = 9330
    failed = False
    report = {}
    print(f'{"theme":12s} {"screen":11s} {"elements":>8s} {"added":>5s} {"removed":>7s} {"changed":>7s} {"noise":>5s}  tokens moved / new  errors b/a', flush=True)
    for theme in themes:
        sides = {}

        def open_sides():
            nonlocal port
            for k in list(sides):
                try:
                    sides.pop(k).close()
                except Exception:
                    pass
            sides['a'] = Side('before', before, port, theme)
            sides['b'] = Side('after', after, port + 1, theme)
            port += 2

        open_sides()
        try:
            for name, route in screens:
                for attempt in (1, 2, 3):
                    try:
                        a1, b = sides['a'], sides['b']
                        a1.start(route)
                        b.start(route)
                        a1.ready()
                        b.ready()
                        settle([a1, b])
                        x1, y = a1.capture(), b.capture()
                        a1.start(route)
                        a1.ready()
                        settle([a1])
                        x2 = a1.capture()
                        break
                    except (TimeoutError, OSError, ConnectionError) as e:
                        print(f'{theme:12s} {name:11s} stalled ({type(e).__name__}), attempt {attempt}; restarting Chrome', flush=True)
                        os.system("pkill -f mk-s1-chrome")
                        time.sleep(3)
                        open_sides()
                else:
                    raise SystemExit(f'{theme} {name}: three attempts stalled')
                for side, d in (('before', x1), ('after', y)):
                    if d['hidden']:
                        raise SystemExit(f'{theme} {name} {side}: document.hidden is true; keep the display awake and run again')
                p1, p2, q = x1['paths'], x2['paths'], y['paths']
                noise = {p for p in p1 if p in p2 and p1[p] != p2[p]} | (set(p1) ^ set(p2))
                added = sorted(set(q) - set(p1) - noise)
                removed = sorted(set(p1) - set(q) - noise)
                changed = sorted(p for p in p1 if p in q and p1[p] != q[p] and p not in noise)
                if allow:
                    owned = lambda p: allow in p
                    added, removed, changed = ([p for p in lst if not owned(p)] for lst in (added, removed, changed))
                moved = sorted(k for k in x1['tokens'] if k in y['tokens'] and x1['tokens'][k] != y['tokens'][k])
                gone = sorted(k for k in x1['tokens'] if k not in y['tokens'])
                new = sorted(k for k in y['tokens'] if k not in x1['tokens'])
                bad = bool(added or removed or changed or moved or gone)
                failed = failed or bad
                print(f'{theme:12s} {name:11s} {y["n"]:8d} {len(added):5d} {len(removed):7d} {len(changed):7d} {len(noise):5d}  '
                      f'{len(moved) + len(gone)} / {len(new)}  {len(x1["errors"])}/{len(y["errors"])}' + ('   <-- MOVED' if bad else ''), flush=True)
                report[f'{theme}/{name}'] = {'before': x1['n'], 'after': y['n'], 'added': added, 'removed': removed, 'changed': changed,
                                             'noise': len(noise), 'tokens_moved': moved, 'tokens_gone': gone, 'tokens_new': new,
                                             'errors_before': x1['errors'], 'errors_after': y['errors'], 'skin': y['skin'], 'theme_attr': y['theme']}
                if bad:
                    for k in moved + gone:
                        print(f'     token {k}: {x1["tokens"].get(k)} -> {y["tokens"].get(k)}', flush=True)
                    show = changed[:12]
                    if show:
                        ex1, ex2 = sides['a'].explain(show), sides['b'].explain(show)
                        for p in show:
                            if p in ex1 and p in ex2:
                                print(f'     changed {p[-90:]}', flush=True)
                                for line in diff_props(ex1[p], ex2[p])[:6]:
                                    print(f'         {line}', flush=True)
                    for p in (added + removed)[:6]:
                        print(f'     {"added" if p in added else "removed"} {p[-90:]}', flush=True)
        finally:
            for k in list(sides):
                try:
                    sides.pop(k).close()
                except Exception:
                    pass
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, 'digest-report.json'), 'w', encoding='utf-8') as fh:
            json.dump(report, fh, indent=1)
    tot = sum(r['after'] for r in report.values())
    new = sorted({k for r in report.values() for k in r['tokens_new']})
    print(f'\n{len(report)} screen/theme pairs, {tot} elements digested after the change; {len(new)} new custom properties '
          f'(none of them existed before): ' + ', '.join(new[:40]) + (' ...' if len(new) > 40 else ''))
    print('FAIL: something outside the allowed scope moved.' if failed else 'PASS: nothing moved.')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
