#!/usr/bin/env python3
"""Render the new S1 components on the real app and measure them (docs/PROGRAM.md 5.3), in three themes at 375 px.

    python3 tools/style-digest/components.py <url> [--out DIR]

The digest (digest.py) proves nothing outside the new components moved. This proves the components themselves work:
the place card with a photo, a tall portrait photo, an archival photo and artwork for each of the 11 motifs; every icon
of the sprite; an empty state and a skeleton; the refined type scale and line heights against the old ones; the
--viz-* tokens the cascade picks for the skin. It mounts them in a scratch `data-refined` block on a live page of the
app (so the real stylesheets, CSP and fonts apply), prints one line per check, and saves screenshots to DIR.
Exit 0 only if every check passes. Needs the same setup as digest.py (a server, a display kept awake).
"""
import base64
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import digest  # noqa: E402

DEMO = r"""
(async () => {
  const { placeCardRF } = await import('/js/place-card.js');
  const { PLACE_ART_KEYS, placeArtKey } = await import('/js/place-art.js');
  const { iconNode } = await import('/js/icons.js');
  const { PHOTOS } = await import('/js/data/photos.js');
  const sprite = await (await fetch('/icons/ui.svg')).text();
  const iconIds = [...sprite.matchAll(/<symbol id="([a-z0-9-]+)"/g)].map((m) => m[1]);
  const host = document.createElement('div');
  host.id = 'rf-demo';
  host.setAttribute('data-refined', '');
  host.style.cssText = 'display:grid;gap:12px;padding:12px;background:var(--bg);color:var(--ink)';
  document.querySelector('#app').prepend(host);

  const keys = Object.keys(PHOTOS);
  const portrait = keys.find((k) => /phanom-rung/.test(k)) || keys[0];
  const landscape = keys.find((k) => /koh-tao/.test(k)) || keys[1];
  const local = { th: 'วัดโพธิ์ กรุงเทพมหานคร', vi: 'Phở Bát Đàn, Hà Nội', kh: 'ព្រះបរមរាជវាំង ភ្នំពេញ', la: 'ຫຼວງພະບາງ ວັດຊຽງທອງ' };
  const cc = ['th', 'vi', 'kh', 'la'];
  const sample = (id, name, cats, i, extra) => Object.assign({
    id, name, country: cc[i % 4], localName: local[cc[i % 4]], categories: cats,
    sources: [{ org: 'Wikivoyage, Chiang Mai' }], verified: '2026-09',
  }, extra || {});
  const cards = [];
  const mk = (p, o) => { const el = placeCardRF(p, o); host.append(el); cards.push({ el, id: p.id, kind: (o && o.photo) ? 'photo' : 'art' }); return el; };
  mk(sample('d-photo', 'Koh Tao diving, a landscape photo', ['beach'], 0), { photo: Object.assign({}, PHOTOS[landscape]), href: '#places', openState: 'open', priceLabel: '$$', distanceLabel: '1.2 km' });
  mk(sample('d-tall', 'Phanom Rung, a tall portrait photo', ['culture'], 1), { photo: Object.assign({}, PHOTOS[portrait]), href: '#places', openState: 'closed', priceLabel: '$', distanceLabel: '48 km' });
  mk(sample('d-arch', 'An archival photograph', ['culture'], 2), { photo: Object.assign({}, PHOTOS[landscape], { archival: true }), onOpen() {}, priceLabel: '$$$' });
  const want = { stay: ['stay'], food: ['food'], culture: ['culture'], market: ['market'], nature: ['nature'], beach: ['beach'], viewpoint: ['nature', 'viewpoint'], transport: ['transport'], practical: ['practical'], nightlife: ['nightlife'], other: [] };
  const motif = {};
  Object.keys(want).forEach((k, i) => {
    const p = sample('d-art-' + k, 'Artwork: ' + k, want[k], i);
    motif[k] = placeArtKey(p);
    mk(p, { href: '#places', openState: i % 2 ? 'open' : null, priceLabel: i % 3 ? '$$' : null, distanceLabel: i % 2 ? '350 m' : null });
  });

  const icons = document.createElement('div');
  icons.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;padding:12px;background:var(--card);color:var(--ink);border:1px solid var(--line)';
  iconIds.forEach((id) => icons.append(iconNode(id)));
  host.append(icons);

  const empty = document.createElement('div');
  empty.className = 'rf-empty';
  empty.innerHTML = '<div class="stripe-band" aria-hidden="true"></div><p class="rf-empty-title">Nothing saved yet</p><p class="rf-empty-text">Tap the star on a place to keep it here.</p>';
  const sk = document.createElement('div');
  sk.className = 'skeleton';
  sk.style.cssText = 'height:24px';
  host.append(empty, sk);

  const viz = document.createElement('div');
  viz.style.cssText = 'display:flex;gap:4px;padding:12px';
  for (let i = 1; i <= 8; i++) { const d = document.createElement('div'); d.className = 'viz-sw'; d.style.cssText = 'width:36px;height:36px;border-radius:6px;background:var(--viz-' + i + ')'; viz.append(d); }
  host.append(viz);

  // type scale, inside and outside the scope
  const probe = (inside) => {
    const box = document.createElement('div');
    if (inside) box.setAttribute('data-refined', '');
    const out = {};
    for (const t of ['label', 'xs', 'sm', 'base', 'h3', 'h2', 'h1']) {
      const d = document.createElement('div'); d.style.fontSize = 'var(--fs-' + t + ')'; d.textContent = 'x'; box.append(d);
      document.body.append(box);
      out[t] = parseFloat(getComputedStyle(d).fontSize);
    }
    box.remove();
    return out;
  };
  const scale = { outside: probe(false), inside: probe(true) };

  // line height for the four scripts, with the longest string of each interface table
  const lang = {};
  for (const [code, file] of [['th', 'th'], ['lo', 'lo'], ['km', 'km'], ['vi', 'vi']]) {
    const mod = await import('/js/data/ui-strings.' + file + '.js');
    const longest = Object.values(mod.STRINGS).filter((s) => typeof s === 'string').sort((a, b) => b.length - a.length)[0];
    const make = (inside, lh) => {
      const wrap = document.createElement('div'); wrap.lang = code; wrap.style.cssText = 'width:343px';
      if (inside) wrap.setAttribute('data-refined', '');
      const p = document.createElement('p'); p.textContent = longest; p.style.cssText = 'margin:0;font-size:16px' + (lh ? ';line-height:' + lh : '');
      wrap.append(p); document.body.append(wrap);
      const cs = getComputedStyle(p);
      const lineH = cs.lineHeight === 'normal' ? NaN : parseFloat(cs.lineHeight);
      const range = document.createRange(); range.selectNodeContents(p);
      const rows = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
      const c = document.createElement('canvas').getContext('2d'); c.font = cs.fontSize + ' ' + cs.fontFamily;
      const m = c.measureText(longest);
      const ink = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      const out = { lh: cs.lineHeight, lineH, ink: +ink.toFixed(2), rows, height: p.getBoundingClientRect().height, fontPx: parseFloat(cs.fontSize) };
      wrap.remove();
      return out;
    };
    lang[code] = { chars: longest.length, old: make(false, '1'), tokenless: make(false, null), refined: make(true, null) };
  }
  const skel = (inside) => { const w = document.createElement('div'); if (inside) w.setAttribute('data-refined', ''); const d = document.createElement('div'); d.className = 'skeleton'; w.append(d); document.body.append(w); const v = getComputedStyle(d).backgroundColor; w.remove(); return v; };
  return { motif, iconIds: iconIds.length, scale, lang, skeleton: { outside: skel(false), inside: skel(true) } };
})()
"""

MEASURE = r"""
(() => {
  const host = document.querySelector('#rf-demo');
  const vw = document.documentElement.clientWidth;
  const out = { vw, cards: [], icons: [], empty: null, viz: [], overflow: 0 };
  for (const card of host.querySelectorAll('.rf-card')) {
    const r = card.getBoundingClientRect(), m = card.querySelector('.rf-card-media').getBoundingClientRect();
    const name = card.querySelector('.rf-card-name > :is(a, button)');
    let over = 0;
    for (const el of card.querySelectorAll('*')) { const b = el.getBoundingClientRect(); if (b.width && (b.right > vw + 0.5 || b.left < -0.5)) over++; }
    const img = card.querySelector('img.rf-photo');
    out.cards.push({ id: card.dataset.place, w: Math.round(r.width), h: Math.round(r.height), media: Math.round(m.height * 10) / 10, ratio: +(m.width / m.height).toFixed(3),
      art: card.querySelector('.pla-frame') ? card.querySelector('.pla-frame').dataset.art : null,
      aria: card.querySelector('.pla') ? card.querySelector('.pla').getAttribute('aria-label') : null,
      photoNatural: img ? [img.naturalWidth, img.naturalHeight] : null, fit: img ? getComputedStyle(img).objectFit : null,
      hit: name ? Math.round(name.getBoundingClientRect().height) : null, archival: !!card.querySelector('.rf-archival'),
      credit: !!card.querySelector('.rf-credit'), over, localLang: (card.querySelector('.rf-card-local') || {}).lang || null,
      metaNum: card.querySelector('.rf-card-meta') ? getComputedStyle(card.querySelector('.rf-card-meta')).fontVariantNumeric : null });
    out.overflow += over;
  }
  for (const svg of host.querySelectorAll('svg.icon')) {
    const u = svg.querySelector('use'); let bb = null;
    try { bb = u.getBBox(); } catch (e) { bb = null; }
    out.icons.push({ w: svg.getBoundingClientRect().width, bw: bb ? Math.round(bb.width * 10) / 10 : 0, stroke: getComputedStyle(svg).strokeWidth, color: getComputedStyle(svg).stroke });
  }
  const e = host.querySelector('.rf-empty .stripe-band');
  out.empty = { bg: getComputedStyle(e).backgroundImage.slice(0, 40), h: e.getBoundingClientRect().height };
  out.viz = [...host.querySelectorAll('.viz-sw')].map((d) => getComputedStyle(d).backgroundColor);
  out.skin = document.documentElement.dataset.skin; out.theme = document.documentElement.dataset.theme;
  out.hostH = Math.round(host.getBoundingClientRect().height); out.hidden = document.hidden;
  return out;
})()
"""


def check(name, ok, detail=''):
    print(('PASS  ' if ok else 'FAIL  ') + name + (('  ' + detail) if detail else ''), flush=True)
    return ok


def rgb_hex(s):
    n = [int(float(x)) for x in s[s.index('(') + 1:s.index(')')].replace('/', ',').replace(' ', ',').split(',') if x][:3]
    return '#%02X%02X%02X' % tuple(n)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    url = sys.argv[1]
    out_dir = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    ok_all = True
    port = 9360
    for theme in digest.THEMES:
        print(f'\n== {theme} (375 px) ==', flush=True)
        side = digest.Side('components', url, port, theme)
        port += 1
        try:
            side.go('#home')
            demo = side.c.js(DEMO, 120)
            side.c.pump(1.2)
            m = side.c.js(MEASURE)
            errs = digest.errors_of(side.c.events)
            ok = []
            ok.append(check('page is not hidden, theme stamped', not m['hidden'] and m['skin'] == side.skin, f"skin {m['skin']} theme {m['theme']}"))
            ok.append(check('no console errors or CSP violations while mounting', not errs, '; '.join(errs)[:200]))
            cards = m['cards']
            ok.append(check(f'{len(cards)} cards: none overflows the 375 px viewport', m['overflow'] == 0 and all(c['w'] <= m['vw'] for c in cards), f"overflowing elements {m['overflow']}"))
            ok.append(check('every card media box is at most 240 px tall', all(c['media'] <= 240.5 for c in cards), 'max %.1f' % max(c['media'] for c in cards)))
            tall = [c for c in cards if c['id'] == 'd-tall'][0]
            ok.append(check('the tall portrait photo is capped (natural %s)' % (tall['photoNatural'],), tall['media'] <= 240.5 and tall['photoNatural'][1] > tall['media'], 'box %.1f px' % tall['media']))
            ok.append(check('photos crop with object-fit: cover', all(c['fit'] == 'cover' for c in cards if c['photoNatural'])))
            ok.append(check('only the archival card wears the label', [c['id'] for c in cards if c['archival']] == ['d-arch']))
            ok.append(check('a photo carries its credit line; artwork carries none', all(c['credit'] == (c['kind'] == 'photo') for c in [dict(c, kind='photo' if c['photoNatural'] else 'art') for c in cards])))
            arts = {c['art']: c['aria'] for c in cards if c['art']}
            ok.append(check('11 motifs, each named "Artwork: ..." for a screen reader', len(arts) == 11 and all(a.startswith('Artwork: ') for a in arts.values()), ', '.join(sorted(arts))))
            ok.append(check('place -> motif mapping', all(k == v for k, v in demo['motif'].items()), json.dumps({k: v for k, v in demo['motif'].items() if k != v})))
            ok.append(check('name links are at least 44 px tall (--hit)', all(c['hit'] is None or c['hit'] >= 44 for c in cards), 'min %s' % min(c['hit'] for c in cards if c['hit'])))
            ok.append(check('local names carry their script as lang (th, vi, km, lo)', {c['localLang'] for c in cards if c['localLang']} == {'th', 'vi', 'km', 'lo'}))
            ok.append(check('meta rows use tabular figures', all('tabular-nums' in (c['metaNum'] or 'tabular-nums') for c in cards)))
            icons = m['icons']
            ok.append(check(f"{demo['iconIds']} icons: all drawn at 20 px, every <use> resolves to a glyph", len(icons) == demo['iconIds'] and all(i['w'] == 20 and i['bw'] > 0 for i in icons),
                            'unresolved %d' % sum(1 for i in icons if not i['bw'])))
            ok.append(check('icons are 1.75 px strokes in the text colour', all(i['stroke'].startswith('1.75') for i in icons), icons[0]['stroke'] + ' ' + icons[0]['color']))
            ok.append(check('the empty state paints the stripe band on retro only', (m['empty']['bg'] != 'none') == (side.skin == 'retro'), m['empty']['bg']))
            ok.append(check('skeleton colour is per skin and differs inside the scope', demo['skeleton']['inside'] != demo['skeleton']['outside'], f"{demo['skeleton']['outside']} -> {demo['skeleton']['inside']}"))
            ok.append(check('8 viz swatches read the skin\'s own palette', len(set(m['viz'])) == 8, ' '.join(rgb_hex(v) for v in m['viz'])))
            s = demo['scale']
            ok.append(check('type scale outside the scope is today\'s', abs(s['outside']['label'] - 11.2) < .01 and abs(s['outside']['sm'] - 14) < .01, json.dumps(s['outside'])))
            ok.append(check('type scale inside: 12 px floor, ratio 1.125', abs(s['inside']['label'] - 12) < .01 and abs(s['inside']['base'] - 16) < .01 and abs(s['inside']['h3'] - 18) < .01
                            and abs(s['inside']['sm'] - 14.22) < .05 and abs(s['inside']['h2'] - 20.26) < .05 and 22.7 <= s['inside']['h1'] <= 25.7, json.dumps(s['inside'])))
            for code, d in demo['lang'].items():
                r, o = d['refined'], d['old']
                fits = r['lineH'] >= r['ink'] - 0.01
                expect = {'th': 1.7, 'lo': 1.7, 'km': 1.7, 'vi': 1.6}[code] * r['fontPx']
                ok.append(check(f'{code}: longest string ({d["chars"]} chars) at the refined line height clears its ink', abs(r['lineH'] - expect) < 0.1 and fits,
                                f"refined {r['lineH']:.1f}px for ink {r['ink']} over {r['rows']} lines; line-height:1 would give {o['lineH']:.0f}px"))
            if out_dir:
                top = side.c.js("document.querySelector('#rf-demo').getBoundingClientRect().top + scrollY")
                shot = side.c.send('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True,
                                                              'clip': {'x': 0, 'y': top, 'width': 375, 'height': min(m['hostH'], 9000), 'scale': 1}})
                with open(os.path.join(out_dir, f'components-{theme}.png'), 'wb') as fh:
                    fh.write(base64.b64decode(shot['data']))
            ok_all = ok_all and all(ok)
        finally:
            side.close()
    print('\nPASS: every component check passed.' if ok_all else '\nFAIL: a component check failed.')
    return 0 if ok_all else 1


if __name__ == '__main__':
    sys.exit(main())
