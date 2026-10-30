#!/usr/bin/env python3
"""F5c driver: the Emergency and hospital screens at a faked GPS fix, in each host language, at 375 px.

usage: drive-fix.py <base-url> <out-dir> <tree>      env: LANGS=th,vi,km,lo  ONLY=singapore,...  ROUTES=sos,hospital  SHOT=1  CHECKS=tight,clip,over,glyph
Uses lang-check's in-page measurer (`__lc`), so a string counts as English the way the language check counts it, and its layout checks.
Writes one JSON document to stdout and, with SHOT=1, a screenshot per point/route/language into <out-dir>.
"""
import base64, json, os, shutil, sys, time

BASE, OUT, TREE = sys.argv[1].rstrip('/'), sys.argv[2], sys.argv[3]
sys.path.insert(0, os.path.join(TREE, 'tools', 'style-digest'))
import cdp  # noqa: E402

PAGE_JS = open(os.path.join(TREE, 'tools', 'lang-check', 'page.js'), encoding='utf-8').read()
PROF = os.path.expanduser('~/Library/Caches/mk-lang-check/profile-fix-' + os.path.basename(OUT.rstrip('/')))
shutil.rmtree(PROF, ignore_errors=True)
os.makedirs(PROF, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

POINTS = [  # name, lat, lng; the world and the four countries' own islands, as in F7b's driver
    ('singapore', 1.3521, 103.8198), ('kuala-lumpur', 3.1390, 101.6869), ('yangon', 16.8409, 96.1735), ('gulf-mid-sea', 11.0, 101.0),
    ('kunming', 25.0389, 102.7183), ('colombo', 6.9271, 79.8612), ('tokyo', 35.6762, 139.6503), ('paris', 48.8566, 2.3522),
    ('cairo', 30.0444, 31.2357), ('sydney', -33.8688, 151.2093), ('new-york', 40.7128, -74.0060), ('london', 51.5074, -0.1278),
    ('tripoli-gap', 32.8872, 13.1913), ('st-thomas', 18.3358, -64.8963), ('mid-atlantic', 30.0, -40.0), ('south-pole', -89.9, 0.0),
    ('surin-islands', 9.4224, 97.8696), ('bangkok', 13.7563, 100.5018),
]
if os.environ.get('ONLY'):
    POINTS = [p for p in POINTS if p[0] in os.environ['ONLY'].split(',')]
LANGS = os.environ.get('LANGS', 'th,vi,km,lo').split(',')
ROUTES = os.environ.get('ROUTES', 'sos,hospital').split(',')
CHECKS = [c for c in os.environ.get('CHECKS', 'tight,clip,over').split(',') if c]
SHOT = bool(os.environ.get('SHOT'))

SEED = """(async () => { const m = await import('/js/state.js'); m.store.profile.seenWelcome = true;
  m.store.profile.prefs.netMode = 'online'; m.flushSaveNow(); return true; })()"""


def main():
    c = cdp.Chrome(PROF, 9331 + (os.getpid() % 400), ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'])
    for d in ('Page', 'Runtime', 'Network', 'Log'):
        c.send(d + '.enable')
    c.send('Network.setCacheDisabled', {'cacheDisabled': True})
    c.send('Network.setBypassServiceWorker', {'bypass': True})
    c.send('Emulation.setDeviceMetricsOverride', {'width': 375, 'height': 812, 'deviceScaleFactor': 2, 'mobile': True})
    c.send('Page.navigate', {'url': BASE + '/#home'})
    c.wait("document.readyState === 'complete' && !!document.querySelector('#app .screen')", 150)
    c.js(SEED)
    result = {'base': BASE, 'hidden': c.js('document.hidden'), 'rows': []}
    for lang in LANGS:
        for name, lat, lng in POINTS:
            for route in ROUTES:
                c.events.clear()
                c.js("(async () => { const m = await import('/js/state.js'); m.store.profile.prefs.uiLang = %s; m.setLastFix({lat: %s, lng: %s}); m.flushSaveNow(); return true; })()"
                     % (json.dumps(lang), lat, lng))
                c.send('Page.navigate', {'url': 'about:blank'})
                c.pump(0.3)
                c.send('Page.navigate', {'url': BASE + '/#' + route})
                c.wait("document.readyState === 'complete' && !!document.querySelector('#app .screen')", 150)
                c.pump(3.0)
                c.js(PAGE_JS)
                texts = c.js('__lc.texts()')
                lay = c.js('__lc.layout(%s, %s)' % (json.dumps(lang), json.dumps(CHECKS or None)), 90)
                errs = [(e.get('params', {}).get('exceptionDetails', {}).get('text') or 'console error')
                        for e in c.events if e.get('method') == 'Runtime.exceptionThrown'
                        or (e.get('method') == 'Runtime.consoleAPICalled' and e['params'].get('type') == 'error')]
                body = c.js("document.querySelector('#app').innerText")
                import re
                english = [('[no-mt] ' if t['b'] else '') + t['s'] for t in texts if re.search(r'[A-Za-z]{2}', t['s'])]
                if os.environ.get('CLASSIFY'):
                    import importlib.util
                    global LC, DATA
                    if 'LC' not in globals():
                        spec = importlib.util.spec_from_file_location('lc', os.path.join(TREE, 'tools/lang-check/lang-check.py'))
                        LC = importlib.util.module_from_spec(spec); spec.loader.exec_module(LC); DATA = LC.data_strings()
                    english = [e for e in english if LC.classify(e.replace('[no-mt] ', ''), DATA) in ('ui', 'tpl') or e.startswith('[no-mt]') and LC.classify(e.replace('[no-mt] ', ''), DATA) != 'data']
                row = {'lang': lang, 'point': name, 'route': route, 'hidden': c.js('document.hidden'), 'english': english, 'errors': errs,
                       'undef': bool(re.search(r'undefined|NaN', body)), 'layout': {k: (len(v) if isinstance(v, list) else v) for k, v in lay.items()},
                       'text': [t['s'] for t in texts][:60]}
                result['rows'].append(row)
                if SHOT:
                    shot = c.send('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})
                    with open(os.path.join(OUT, '%s-%s-%s.png' % (lang, name, route)), 'wb') as fh:
                        fh.write(base64.b64decode(shot['data']))
    c.close()
    print(json.dumps(result, indent=1, ensure_ascii=False))


main()
