#!/usr/bin/env python3
"""The language check (F5): every route in each of the 29 interface languages, in headless Chrome over CDP.

    python3 scripts/serve.py 8751 &                          # serve the tree (no-cache)
    python3 tools/lang-check/lang-check.py --base http://127.0.0.1:8751

One command, one table per language and route. For each language and route it records:
  English   strings still in English (they read exactly as in the English render of that route), in three classes:
              ui    a fixed interface string: a literal in the app's code (js/, not js/data/). F5's done criterion is 0 of these.
              tpl   an interface string with a value in it ("6 nights · 4 stops", "Speak: <phrase>"): it matches a template
                    literal in the code, so an exact-match dictionary key cannot hold it
              data  everything else: place names, editorial text, phrases and other data from js/data/ (the online pass's job)
  clip      boxes that hide text they hold (overflow hidden or clamped lines)
  over      boxes that leave the viewport
  tight     th, lo, km, vi: text whose line box is too short for stacked marks (CLIPS = it also hides overflow)
  glyph     characters the browser draws as the missing-glyph box (headless Chrome's own fonts, not iOS's)
  break     th, lo, km: lines that break inside a word / inside a letter (Intl.Segmenter is the judge)
  rtl       he, ar, fa, ur: text not set right to left, text pinned left, the two bars' order
  mt        with --mt: strings the online pass changed on that route (needs a connection)

Options:
  --lang th,vi,km,lo   languages to run (default: all 29); `en` is always run first as the baseline
  --route '#sos,#home' routes to run (default: every route the sweep knows)
  --width 375          viewport width (default 375, DPR 2)
  --out DIR            where the raw records go (default ~/Library/Caches/mk-lang-check/run-<time>)
  --report DIR         print the tables for an earlier run and exit
  --summary            one row per language only
  --mt                 also run the online pass per route (lets translate.googleapis.com and api.mymemory.translated.net through)
  --jobs N             run N Chrome processes in parallel (default 3)
  --checks a,b         layout checks to run: over, clip, tight, glyph, break, rtl (default all; `tight,clip,over` is the fast set)
  --strings            write <out>/strings.json: every untranslated `ui` string, keyed the way the dictionaries are (a leading emoji
                       is left off, js/i18n.js puts it back), with the routes it appears on and a review group
                       (emergency, medical, firstaid, safety, core, talk, then the rest), safety groups first

It refuses a page whose document.hidden is true (a hidden page has no layout), and every host except 127.0.0.1
(and the two translation hosts with --mt) is unresolvable, so a result never depends on the network.
"""
import argparse
import concurrent.futures as cf
import json
import os
import re
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'style-digest'))
import cdp  # noqa: E402

CACHE = os.path.expanduser('~/Library/Caches/mk-lang-check')
PAGE_JS = open(os.path.join(HERE, 'page.js'), encoding='utf-8').read()
LATIN = re.compile(r'[A-Za-z]{2}')
EMOJI_LEAD = re.compile(r'^([\U0001F000-\U0001FFFF\u2190-\u2BFF\u2600-\u27BF\uFE0F\u200d\u20e3+＋\s]+)(.+)$', re.S)


def all_langs():
    src = open(os.path.join(ROOT, 'js', 'i18n.js'), encoding='utf-8').read()
    return re.findall(r"^\s*\{ code: '([^']+)'", src, re.M)


# ---- the browser half ---------------------------------------------------------------------------------------
class Page:
    def __init__(self, base, width, mt, slot, tag):
        self.base = base.rstrip('/')
        self.prof = os.path.join(CACHE, 'profile-%s-%d' % (tag, slot))
        shutil.rmtree(self.prof, ignore_errors=True)
        os.makedirs(self.prof, exist_ok=True)
        rules = 'MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'
        if mt:
            rules += ', EXCLUDE translate.googleapis.com, EXCLUDE api.mymemory.translated.net'
        self.c = cdp.Chrome(self.prof, 9700 + (os.getpid() % 150) * 4 + slot, ['--host-resolver-rules=' + rules, '--window-size=%d,900' % width])
        for d in ('Page', 'Runtime', 'Network', 'Log'):
            self.c.send(d + '.enable')
        self.c.send('Network.setCacheDisabled', {'cacheDisabled': True})
        self.c.send('Network.setBypassServiceWorker', {'bypass': True})
        self.c.send('Emulation.setDeviceMetricsOverride', {'width': width, 'height': 812, 'deviceScaleFactor': 2, 'mobile': width < 700})
        self.c.send('Page.navigate', {'url': self.base + '/#home'})
        self.c.wait("document.readyState === 'complete' && !!document.querySelector('#app .screen')", 150)
        self.c.pump(1.5)
        self.c.js(PAGE_JS)
        if self.c.js('document.hidden'):
            raise SystemExit('document.hidden is true: no layout. Keep the display awake (caffeinate -d) and rerun.')

    def call(self, expr, timeout=90):
        return self.c.js(expr, timeout)

    def close(self):
        self.c.close()
        shutil.rmtree(self.prof, ignore_errors=True)


def run_langs(args, langs, routes, outdir, slot):
    """Run `langs` over `routes`, appending one JSON line per (language, route) to <outdir>/<lang>.jsonl."""
    pg = Page(args['base'], args['width'], args['mt'], slot, 'run')
    try:
        if routes is None:
            routes = pg.call('__lc.routes()')
        for lang in langs:
            pg.call('__lc.setLang(%s, false)' % json.dumps(lang))
            path = os.path.join(outdir, lang + '.jsonl')
            with open(path, 'w', encoding='utf-8') as fh:
                for r in routes:
                    t0 = time.time()
                    v = pg.call('__lc.visit(%s)' % json.dumps(r), 60)
                    if v.get('hidden'):
                        raise SystemExit('document.hidden turned true during %s %s' % (lang, r))
                    rec = {'lang': lang, 'route': r, 'at': v['hash'], 'title': v['title']}
                    texts = pg.call('__lc.texts()')
                    rec['texts'] = texts if lang == 'en' else [t for t in texts if LATIN.search(t['s'])]
                    rec['all'] = len(texts)
                    rec['layout'] = pg.call('__lc.layout(%s, %s)' % (json.dumps(lang), json.dumps(args['checks'] or None)), 90)
                    if lang != 'en':
                        if args['mt']:
                            pg.call('__lc.setLang(%s, true)' % json.dumps(lang))
                            rec['mt'] = pg.call('__lc.mtPass()', 120)
                            pg.call('__lc.setLang(%s, false)' % json.dumps(lang))
                    rec['ms'] = int((time.time() - t0) * 1000)
                    fh.write(json.dumps(rec, ensure_ascii=False) + '\n')
                    fh.flush()
            print('done %s' % lang, flush=True)
    finally:
        pg.close()
    return langs


# ---- classifying the leftovers --------------------------------------------------------------------------------
STR_LIT = re.compile(r"""'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\$]|\\.|\$(?!\{))*)`""")


def data_strings():
    """Every string literal in the datasets (js/data, not the dictionaries): what a screen shows from data, not chrome."""
    out = set()
    base = os.path.join(ROOT, 'js', 'data')
    for dp, _, files in os.walk(base):
        for f in files:
            if not f.endswith('.js') or f.startswith('ui-strings'):
                continue
            src = open(os.path.join(dp, f), encoding='utf-8', errors='replace').read()
            for m in STR_LIT.finditer(src):
                s = next((g for g in m.groups() if g is not None), '')
                s = re.sub(r'\\(.)', r'\1', s)
                s = re.sub(r'\s+', ' ', s).strip()
                if len(s) >= 3:
                    out.add(s)
    return out


LIT = re.compile(r"""'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`""", re.S)
_CODE = None


def code_strings():
    """(static literals, template regexes) from the app's own code: js/ without js/data and the market fixtures."""
    global _CODE
    if _CODE:
        return _CODE
    static, tpls = set(), []
    for dp, _, files in os.walk(os.path.join(ROOT, 'js')):
        if os.sep + 'data' in dp[len(ROOT):] or 'fixture' in dp:
            continue
        for f in files:
            if not f.endswith('.js') or 'fixture' in f:
                continue
            src = open(os.path.join(dp, f), encoding='utf-8', errors='replace').read()
            for m in LIT.finditer(src):
                g = next((x for x in m.groups() if x is not None), '')
                if m.group(3) is not None and '${' in g:
                    flat = re.sub(r'\s+', ' ', g).strip()
                    if len(re.sub(r'\$\{.*?\}', '', flat).strip()) >= 4:
                        parts = re.split(r'\$\{(?:[^{}]|\{[^{}]*\})*\}', flat)
                        tpls.append(re.compile('^' + '(.+?)'.join(re.escape(p) for p in parts) + '$', re.S))
                    continue
                s = re.sub(r'\\(.)', lambda mm: {'n': ' ', 't': ' '}.get(mm.group(1), mm.group(1)), g)
                s = re.sub(r'\s+', ' ', s).strip()
                if len(s) >= 2:
                    static.add(s)
    _CODE = (static, tpls)
    return _CODE


def classify(s, data):
    """'ui', 'tpl' or 'data' for a string that reads as it does in English."""
    static, tpls = code_strings()
    m = EMOJI_LEAD.match(s)
    k = m.group(2).strip() if m else s
    in_code = s in static or k in static
    in_data = s in data or k in data
    # a name such as "Mae Chaem" or "Four Flags" sits in the code as a label and in the data as a record: it is data
    name = all(w[:1].isupper() or not w[:1].isalpha() or w in ('of', 'de', 'and', '&', 'the') for w in k.split()) and len(k.split()) <= 4
    if in_code and not (in_data and name):
        return 'ui'
    if in_data:
        return 'data'
    if any(rx.match(s) or rx.match(k) for rx in tpls):
        return 'tpl'
    return 'data'


# Review order for harvested strings: the first pattern a string's routes match decides its group (and the order of work).
GROUPS = [('emergency', r'^#sos'), ('medical', r'^#hospital'), ('firstaid', r'^#firstaid'), ('safety', r'^#(danger|scams)'),
          ('core', r'^#(home|me|welcome|settings|search|help|everything|saved|hub-.*)$'), ('talk', r'^#(phrasebook|dictionary|signtranslate)')]


def group_of(routes):
    best = (len(GROUPS), 'screens')
    for r in routes:
        for i, (g, pat) in enumerate(GROUPS):
            if re.search(pat, r) and i < best[0]:
                best = (i, g)
    return best


def app_key(s):
    """The key js/i18n.js looks a string up by: the words, without a leading emoji run (it puts the emoji back)."""
    m = EMOJI_LEAD.match(s)
    return m.group(2).strip() if m else s


def load_run(outdir):
    runs = {}
    for f in sorted(os.listdir(outdir)):
        if f.endswith('.jsonl'):
            runs[f[:-6]] = [json.loads(l) for l in open(os.path.join(outdir, f), encoding='utf-8') if l.strip()]
    return runs


# Strings that must read the same in every language (F5b): web addresses, an example e-mail, a brand or organisation name, the name of a file
# format, a language written in its own name. They are not interface text to translate, so they are not counted in `ui`.
KEEP = {
    'OpenStreetMap ↗', 'Google Lens ↗', 'iNaturalist ↗', 'GeoNames', 'you@example.com', 'https://your-endpoint/translate', '< 0.1 MB',
    'CSV (.csv)', 'Excel (.xlsx)', 'Friends-International', 'MAG (Mines Advisory Group)', 'Thrive Networks (East Meets West)', 'ban',
    # the interface languages' own names, as the Talk screen lists them
    'English', 'Español', 'Français', 'Deutsch', 'Italiano', 'Nederlands', 'Polski', 'Português', 'Svenska', 'Türkçe', 'Čeština', 'Filipino',
    'Bahasa Indonesia', 'Bahasa Melayu',
}


def untranslated(rec, base_set, data, dictvals):
    """(ui, tpl, data) strings on this route that read exactly as they do in English."""
    out = {'ui': [], 'tpl': [], 'data': []}
    for t in rec['texts']:
        if t['b'] or t['s'] not in base_set or not LATIN.search(t['s']):
            continue
        if {t['s'], app_key(t['s'])} & (dictvals | KEEP):   # a word the language shares with English (Filipino "Home"), or one that must not change (with or without its leading emoji)
            continue
        out[classify(t['s'], data)].append(t['s'])
    return out['ui'], out['tpl'], out['data']


def dict_values(lang):
    """Values in the language's own dictionary that equal their English key: shared words, not gaps."""
    p = os.path.join(ROOT, 'js', 'data', 'ui-strings.%s.js' % lang)
    if not os.path.exists(p):
        return set()
    src = open(p, encoding='utf-8').read()
    return {k for k, v in re.findall(r"'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'", src) if k == v}


def table(rows, head):
    w = [max(len(str(x)) for x in col) for col in zip(head, *rows)] if rows else [len(h) for h in head]
    line = lambda r: '  '.join(str(x).ljust(w[i]) if i == 0 else str(x).rjust(w[i]) for i, x in enumerate(r))
    return '\n'.join([line(head), '  '.join('-' * x for x in w)] + [line(r) for r in rows])


def report(outdir, summary, want_strings):
    runs = load_run(outdir)
    if 'en' not in runs:
        sys.exit('no English baseline in ' + outdir)
    base = {r['route']: {t['s'] for t in r['texts']} for r in runs['en']}
    data = data_strings()
    summ = []
    strings = {}
    for lang in [l for l in all_langs() if l in runs]:
        recs = runs[lang]
        dv = dict_values(lang)
        rows = []
        tot = {'ui': 0, 'tpl': 0, 'dat': 0, 'clip': 0, 'over': 0, 'tight': 0, 'clips': 0, 'glyph': 0, 'wb': 0, 'lb': 0, 'rtl': 0, 'mt': 0}
        for r in recs:
            ui, tpl, dat = ([], [], []) if lang == 'en' else untranslated(r, base.get(r['route'], set()), data, dv)
            L = r.get('layout')
            if not L:
                continue
            br = L['breaks'] or {}
            rt = L['rtl'] or {}
            rtl_n = (rt.get('pinnedLeft', 0) + rt.get('wrongDir', 0) + (1 if rt.get('tabOrder') == 'ltr' else 0)
                     + (1 if rt.get('backSide') == 'left' else 0)) if rt else 0
            clips = sum(1 for x in L['tight'] if x.startswith('CLIPS'))
            mt = (r.get('mt') or {}).get('changed', '')
            rows.append([r['route'] + ('' if r['at'] == r['route'] else ' ->' + r['at']), len(ui), len(tpl), len(dat), len(L['clipped']), len(L['overflow']),
                         len(L['tight']), clips, len(L['glyphs']), br.get('midWord', 0) if br else '', br.get('midLetter', 0) if br else '', rtl_n if rt else '', mt])
            for k, v in (('ui', len(ui)), ('tpl', len(tpl)), ('dat', len(dat)), ('clip', len(L['clipped'])), ('over', len(L['overflow'])), ('tight', len(L['tight'])),
                         ('clips', clips), ('glyph', len(L['glyphs'])), ('wb', br.get('midWord', 0) if br else 0),
                         ('lb', br.get('midLetter', 0) if br else 0), ('rtl', rtl_n)):
                tot[k] += v
            tot['mt'] += mt if isinstance(mt, int) else 0
            for s in ui:
                strings.setdefault(app_key(s), set()).add(r['route'])
        summ.append([lang, len(recs), tot['ui'], tot['tpl'], tot['dat'], tot['clip'], tot['over'], tot['tight'], tot['clips'], tot['glyph'], tot['wb'], tot['lb'], tot['rtl'], tot['mt']])
        if not summary:
            print('\n== %s  (%d routes)' % (lang, len(recs)))
            print(table(rows, ['route', 'ui', 'tpl', 'data', 'clip', 'over', 'tight', 'CLIPS', 'glyph', 'wordbrk', 'letbrk', 'rtl', 'mt']))
    print('\n== summary: counts summed over every route (ui = fixed interface strings still English, tpl = interface strings with a value in them, data = place and editorial text)')
    print(table(summ, ['lang', 'routes', 'ui', 'tpl', 'data', 'clip', 'over', 'tight', 'CLIPS', 'glyph', 'wordbrk', 'letbrk', 'rtl', 'mt']))
    if want_strings:
        rows = []
        for s, rs in strings.items():
            rank, g = group_of(rs)
            rows.append((rank, g, s, sorted(rs)))
        rows.sort(key=lambda t: (t[0], t[3][0], t[2]))
        p = os.path.join(outdir, 'strings.json')
        json.dump([{'key': s, 'group': g, 'routes': rs} for _, g, s, rs in rows], open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('\n%d distinct untranslated interface strings -> %s' % (len(rows), p))
        for g in sorted({r[1] for r in rows}, key=lambda g: min(r[0] for r in rows if r[1] == g)):
            print('  %-10s %d' % (g, sum(1 for r in rows if r[1] == g)))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--base', default='http://127.0.0.1:8751')
    ap.add_argument('--lang', default='')
    ap.add_argument('--route', default='')
    ap.add_argument('--width', type=int, default=375)
    ap.add_argument('--out', default='')
    ap.add_argument('--report', default='')
    ap.add_argument('--summary', action='store_true')
    ap.add_argument('--mt', action='store_true')
    ap.add_argument('--jobs', type=int, default=3)
    ap.add_argument('--strings', action='store_true')
    ap.add_argument('--checks', default='')
    a = ap.parse_args()
    if a.report:
        return report(a.report, a.summary, a.strings)
    langs = [l for l in (a.lang.split(',') if a.lang else all_langs()) if l and l != 'en']
    routes = [r if r.startswith('#') else '#' + r for r in a.route.split(',')] if a.route else None
    out = a.out or os.path.join(CACHE, 'run-' + time.strftime('%Y%m%d-%H%M%S'))
    os.makedirs(out, exist_ok=True)
    args = {'base': a.base, 'width': a.width, 'mt': a.mt, 'checks': [c for c in a.checks.split(',') if c]}
    subprocess.Popen(['caffeinate', '-d', '-w', str(os.getpid())], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0 = time.time()
    print('run -> %s' % out, flush=True)
    run_langs(args, ['en'], routes, out, 0)
    if a.jobs <= 1 or len(langs) == 1:
        run_langs(args, langs, routes, out, 1)
    else:
        chunks = [langs[i::a.jobs] for i in range(a.jobs)]
        with cf.ProcessPoolExecutor(max_workers=a.jobs) as ex:
            futs = [ex.submit(run_langs, args, ch, routes, out, i + 1) for i, ch in enumerate(chunks) if ch]
            for f in futs:
                f.result()
    print('%d languages in %.0f s' % (len(langs), time.time() - t0), flush=True)
    report(out, a.summary, a.strings)


if __name__ == '__main__':
    main()
