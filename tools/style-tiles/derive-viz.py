#!/usr/bin/env python3
"""Derive the --viz-1..8 data-visualisation palette for every skin surface (S1, docs/PROGRAM.md 5.3 item 4).

    python3 tools/style-tiles/derive-viz.py            # derive, validate and write round2.json["viz"]
    python3 tools/style-tiles/derive-viz.py --check    # validate the stored palette on all 16 surfaces (CI)

round2.json["viz"] is the single source: port-themes.py writes it into css/refined.css, and
scripts/check-contrast.py holds each colour to 3:1 as a graphic on its surface's card.

HOW A PALETTE IS MADE. The method is the `dataviz` skill's: eight hue families in a fixed slot order, never
cycled; each colour is a point in OKLCH, and a palette is legal only if it passes the checks below. Nothing is
chosen by eye.

  * Hue families. Four are the four countries' own hues (Thailand brick, Vietnam plum, Cambodia gold, Laos
    green, read from Mekong Retro's --country-* tokens), so the stripe colours and the chart colours are one
    family. Four more fill the circle: the logo's teal and rose (pinned in index.html) and, because the country
    set has no blue or violet, the Flags theme's Laos blue and Classic's grape. The hue of a family is the same
    on every skin; a skin changes only the lightness and chroma, which are stepped for its card.
  * Slot order. A single global order, chosen once by enumerating every order of the eight families and keeping
    the one that maximises the worst adjacent colour-vision separation across the Mekong Retro surfaces. The
    order is the CVD-safety mechanism and never changes per skin.
  * Per surface. For each slot, every lightness inside the mode's band whose chroma is at least the floor and
    whose contrast on the card is at least 3:1 is a candidate; a dynamic programme along the chain picks the
    lightness of each slot that maximises the worst neighbouring pair.

THE CHECKS (the dataviz skill's, in OKLab x100 Delta E; the skill's own validate_palette.py reproduces them):
  lightness band  L 0.43-0.77 light, 0.48-0.67 dark      chroma floor  C >= 0.10
  CVD separation  adjacent pairs, protan and deutan (Machado 2009, severity 1.0), >= 6 (8 is the target)
  normal vision   adjacent pairs >= 15                    contrast  >= 3:1 on the card
A palette is for lines, bars and stacks, where only neighbours touch. A scatter or a map, where any two marks can
sit side by side, takes the first three slots only (the skill's all-pairs rule); more series fold into "Other".
"""
import importlib.util
import itertools
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
JSON_PATH = os.path.join(HERE, 'round2.json')

BAND = {'light': (0.43, 0.77), 'dark': (0.48, 0.67)}
CHROMA_FLOOR = 0.10
CVD_TARGET, CVD_FLOOR = 8.0, 6.0
NORMAL_FLOOR = 15.0
CONTRAST_MIN = 3.0
CONTRAST_AIM = 3.1          # derive with a margin so a rounding step cannot land under 3:1
CHROMA_AIM = (0.12, 0.15)   # candidate chromas (capped by the sRGB gamut)

MACHADO = {
    'protan': [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    'deutan': [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
}

# slot -> (family name, how its hue is found). A token is read from a surface of the resolved cascade.
FAMILIES = [
    ('brick', ('token', 'retro-light', 'country-th')),     # Thailand
    ('teal', ('hex', '#16A39A')),                           # the logo's teal (index.html splash, pinned)
    ('gold', ('token', 'retro-light', 'country-kh')),      # Cambodia
    ('plum', ('token', 'retro-light', 'country-vi')),      # Vietnam
    ('green', ('token', 'retro-light', 'country-la')),     # Laos
    ('blue', ('token', 'flags-light', 'country-la')),      # the Flags theme's Laos blue
    ('violet', ('token', 'classic-dark', 'grape')),        # Classic's grape
    ('rose', ('hex', '#D6336C')),                           # the logo's rose
]


# ---- colour maths (stdlib; the same formulas as the dataviz skill's validator) ----
def hex2lin(h):
    h = h.lstrip('#')
    return tuple(s2lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


def s2lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lin2s(c):
    c = max(0.0, min(1.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def lin2oklab(r, g, b):
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def oklab2lin(L, a, b):
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)


def oklch(h):
    L, a, b = lin2oklab(*hex2lin(h))
    return L, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def in_gamut(rgb):
    return all(-1e-6 <= c <= 1 + 1e-6 for c in rgb)


def from_oklch(L, C, hue):
    a, b = C * math.cos(math.radians(hue)), C * math.sin(math.radians(hue))
    return oklab2lin(L, a, b)


def max_chroma(L, hue):
    lo, hi = 0.0, 0.4
    for _ in range(30):
        mid = (lo + hi) / 2
        if in_gamut(from_oklch(L, mid, hue)):
            lo = mid
        else:
            hi = mid
    return lo


def to_hex(rgb):
    return '#' + ''.join(f'{round(lin2s(c) * 255):02X}' for c in rgb)


def luminance(h):
    r, g, b = hex2lin(h)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    x, y = sorted((luminance(a), luminance(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def delta_e(h1, h2, kind=None):
    def pt(h):
        rgb = hex2lin(h)
        if kind:
            M = MACHADO[kind]
            rgb = tuple(max(0.0, min(1.0, sum(M[i][j] * rgb[j] for j in range(3)))) for i in range(3))
        return lin2oklab(*rgb)
    return 100 * math.dist(pt(h1), pt(h2))


def edge(h1, h2):
    """(worst CVD, normal) separation of one neighbouring pair."""
    return min(delta_e(h1, h2, 'protan'), delta_e(h1, h2, 'deutan')), delta_e(h1, h2)


# ---- the surfaces: the same cascade check-contrast.py resolves ----
def load_surfaces():
    spec = importlib.util.spec_from_file_location('check_contrast', os.path.join(ROOT, 'scripts', 'check-contrast.py'))
    cc = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cc)
    cwd = os.getcwd()
    os.chdir(ROOT)
    try:
        css = cc.strip_comments(cc.read(cc.CSS))     # only the stylesheet that has the skins: viz tokens are not an input
        surfaces, _ = cc.build_surfaces(css, cc.skin_modes(cc.read(cc.THEME)))
    finally:
        os.chdir(cwd)
    return surfaces


def anchors(surfaces):
    out = []
    for name, (kind, *args) in FAMILIES:
        if kind == 'hex':
            out.append((name, oklch(args[0])[2]))
        else:
            toks = surfaces[args[0]][0]
            out.append((name, oklch(toks[args[1]])[2]))
    return out


# ---- candidates and the chain search ----
def candidates(hue, card, mode, l_step, chromas):
    lo, hi = BAND[mode]
    out = []
    n = int(round((hi - lo) / l_step))
    for i in range(n + 1):
        L = lo + i * l_step
        cmax = max_chroma(L, hue)
        for C in chromas:
            c = min(C, cmax)
            if c < CHROMA_FLOOR + 0.002:
                continue
            h = to_hex(from_oklch(L, c, hue))
            L2, C2, _ = oklch(h)
            if not (lo <= L2 <= hi) or C2 < CHROMA_FLOOR or contrast(h, card) < CONTRAST_AIM:
                continue
            if h not in [x[0] for x in out]:
                out.append((h, L2))
    return out


def best_chain(order, cands):
    """DP over the chain: maximise the worst neighbouring (CVD) separation, ties by the sum. Returns (score, [hex])."""
    prev = {h: ((99.0, 0.0), [h]) for h, _ in cands[order[0]]}
    for k in range(1, len(order)):
        cur = {}
        for h, _ in cands[order[k]]:
            best = None
            for ph, (sc, path) in prev.items():
                cvd, normal = edge(ph, h)
                if normal < NORMAL_FLOOR:
                    continue
                cand = (min(sc[0], cvd), sc[1] + cvd)
                if best is None or cand > best[0]:
                    best = (cand, path + [h])
            if best:
                cur[h] = best
        if not cur:
            return None
        prev = cur
    return max(prev.values(), key=lambda v: v[0])


def validate(palette, card, mode):
    """The checks, as (name, ok, detail) rows. Adjacent pairs only."""
    lo, hi = BAND[mode]
    rows = []
    off = [(h, round(oklch(h)[0], 3)) for h in palette if not lo <= oklch(h)[0] <= hi]
    rows.append(('lightness band', not off, f'all {len(palette)} inside L {lo}-{hi}' if not off else f'outside: {off}'))
    low = [(h, round(oklch(h)[1], 3)) for h in palette if oklch(h)[1] < CHROMA_FLOOR]
    rows.append(('chroma floor', not low, f'all >= {CHROMA_FLOOR}' if not low else f'below: {low}'))
    worst = min(((edge(a, b)[0], a, b) for a, b in zip(palette, palette[1:])), key=lambda r: r[0])
    rows.append(('CVD separation', worst[0] >= CVD_FLOOR, f'worst adjacent {worst[1]}-{worst[2]} dE {worst[0]:.1f} (target {CVD_TARGET:g}, floor {CVD_FLOOR:g})'))
    nw = min(((edge(a, b)[1], a, b) for a, b in zip(palette, palette[1:])), key=lambda r: r[0])
    rows.append(('normal vision', nw[0] >= NORMAL_FLOOR, f'worst adjacent {nw[1]}-{nw[2]} dE {nw[0]:.1f} (floor {NORMAL_FLOOR:g})'))
    cmin = min((contrast(h, card), h) for h in palette)
    rows.append(('contrast on card', cmin[0] >= CONTRAST_MIN, f'lowest {cmin[1]} {cmin[0]:.2f}:1 on {card}'))
    return rows


def choose_order(surfaces, hues):
    """Enumerate every order (slot 1 fixed: an order and its reverse score the same) on the Mekong Retro surfaces."""
    probe = ['retro-light', 'retro-dark']
    coarse = {}
    for sid in probe:
        toks, mode = surfaces[sid]
        coarse[sid] = [candidates(h, toks['card'], mode, 0.03, (0.13,)) for _, h in hues]
    best = None
    count = 0
    for tail in itertools.permutations(range(1, len(hues))):
        order = (0,) + tail
        if order[1] > order[-1]:
            continue                      # the reverse is the same chain
        worst = 99.0
        total = 0.0
        for sid in probe:
            res = best_chain(order, coarse[sid])
            if res is None:
                worst = -1.0
                break
            worst = min(worst, res[0][0])
            total += res[0][1]
        count += 1
        if best is None or (worst, total) > best[0]:
            best = ((worst, total), order)
    return best[1], best[0][0], count


def main():
    check = '--check' in sys.argv
    surfaces = load_surfaces()
    spec = json.load(open(JSON_PATH, encoding='utf-8'))
    hues = anchors(surfaces)
    names = [n for n, _ in hues]
    if check:
        stored = {k: v for k, v in spec.get('viz', {}).items() if not k.startswith('_')}
        bad = 0
        if sorted(stored) != sorted(surfaces):
            print(f'FAIL: round2.json viz holds {len(stored)} surfaces, the cascade has {len(surfaces)} '
                  f'({", ".join(sorted(set(surfaces) ^ set(stored)))} differ).')
            return 1
        for sid, (toks, mode) in surfaces.items():
            pal = stored[sid]
            for name, ok, detail in validate(pal, toks['card'], mode):
                if not ok:
                    bad += 1
                    print(f'FAIL {sid}: {name}: {detail}')
        if bad:
            print('Run: python3 tools/style-tiles/derive-viz.py')
            return 1
        print(f'PASS: the viz palette passes the dataviz checks on all {len(surfaces)} surfaces (adjacent pairs).')
        return 0

    print('hue families (OKLCH hue, degrees):', ', '.join(f'{n} {h:.0f}' for n, h in hues))
    order, worst, count = choose_order(surfaces, hues)
    print(f'slot order from {count} chains on the Mekong Retro surfaces:', ' > '.join(names[i] for i in order),
          f'(worst adjacent CVD dE {worst:.1f} on the coarse grid)')
    viz, fails = {}, 0
    for sid, (toks, mode) in surfaces.items():
        card = toks['card']
        cands = [candidates(h, card, mode, 0.01, CHROMA_AIM) for _, h in hues]
        res = best_chain(order, cands)
        if res is None:
            print(f'FAIL {sid}: no chain clears the normal-vision floor')
            fails += 1
            continue
        pal = res[1]
        viz[sid] = pal
        rows = validate(pal, card, mode)
        bad = [r for r in rows if not r[1]]
        fails += len(bad)
        cvd = [r for r in rows if r[0] == 'CVD separation'][0][2]
        print(f'  {sid:18s} card {card}  {" ".join(pal)}  {cvd}' + ('  FAIL ' + str(bad) if bad else ''))
    if fails:
        return 1
    spec['viz'] = {'_about': 'Derived by tools/style-tiles/derive-viz.py; do not edit by hand. Eight slots per surface in the fixed order '
                             + ', '.join(names[i] for i in order) + '; css/refined.css is written from this by port-themes.py.',
                   '_order': [names[i] for i in order],
                   **viz}
    # the `_`-prefixed keys are not surfaces
    new = json.dumps(spec, indent=1, ensure_ascii=False)
    if new != open(JSON_PATH, encoding='utf-8').read():
        open(JSON_PATH, 'w', encoding='utf-8').write(new)
    print(f'wrote viz for {len(viz)} surfaces to tools/style-tiles/round2.json')
    return 0


if __name__ == '__main__':
    sys.exit(main())
