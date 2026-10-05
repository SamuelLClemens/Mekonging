#!/usr/bin/env python3
"""Port the four new themes from round2.json into css/style.css (Phase 3 of the retro redesign).

    python3 tools/style-tiles/port-themes.py            # rewrite the generated block in css/style.css
    python3 tools/style-tiles/port-themes.py --check    # exit 1 if the block is not what round2.json produces

round2.json is the single source of every value (VISUAL_DIRECTION_PROMPT.md section 6, Phase 3: "port the
values from round2.json; do not retype them"). The block lands between the two marker comments at the end of
css/style.css, so a tie in specificity is won by the theme. It holds, per theme:

  * `:root[data-skin="<id>"][data-theme="light"|"dark"]` token blocks (specificity 0,3,0, so a light block
    can never leak into dark mode): the role tokens mapped onto the app's own tokens, the Phase 2 chrome
    tokens (--btn-*, --back-*, --sea, --on-fill ...), --country-* and, for the retro theme, --stripe-*;
  * the chrome rules that preview.py draws for the candidate (the same ones the owner approved on the
    Phase 1 gallery), written once per theme selector.

Theme ids: retro (Mekong Retro, the `retro-map` tuning the owner chose), river, flags, temples.
Nothing here reads the network; the only inputs are round2.json and tools/style-tiles/preview.py.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import measure as m  # noqa: E402
import preview as pv  # noqa: E402

CSS = os.path.join(ROOT, 'css', 'style.css')
BEGIN = '/* ==== BEGIN GENERATED THEMES (tools/style-tiles/port-themes.py; do not edit by hand) ==== */'
END = '/* ==== END GENERATED THEMES ==== */'
PH = '@@P@@'

# app id -> round2.json key
THEMES = {'retro': 'retro-map', 'river': 'river', 'flags': 'flags', 'temples': 'temples'}


def rgb_triplet(h):
    r, g, b = m.rgb(h)
    return f'{r}, {g}, {b}'


def extra_tokens(t, mode):
    """The Phase 2 chrome tokens, set to what preview.py's literal overrides painted."""
    fill = t['accentFill'] if isinstance(t['accentFill'], str) else t['accentFill'][-1]
    shadow = t['text'] if mode == 'light' else '#000000'
    deep = pv.deep_fill(t['secondary'])
    sea = t['sea']
    return [
        # a label on the sun-orange fill (.phase-btn, .country-chip, .pill-best, .update-toast-btn), and the primary button
        f"--on-fill:{t['onAccent']}",
        f"--btn-bg:{fill}", f"--btn-ink:{t['onAccent']}", "--btn-ink-shadow:none",
        f"--back-bg:{t['surface2']}", f"--back-ink:{t['text']}",
        # a fill that carries a white label (.cat-tag, .attr-tag.at-info, the pressed segment): the
        # secondary, deepened until white reads on it at 4.6:1 or better
        f"--teal-deep:{deep}",
        "--hero-wash:linear-gradient(transparent,transparent)", "--hero-sun:linear-gradient(transparent,transparent)",
        "--glow-chip:none", "--glow-country:none", "--tile-ring:none",
        "--rule-brand:linear-gradient(var(--line),var(--line))", f"--pip-brand:linear-gradient({t['sun']},{t['sun']})",
        f"--shadow-tint:{rgb_triplet(shadow)}",
        f"--shadow-up:0 -8px 20px -14px {pv.rgba(shadow, 0.35 if mode == 'light' else 0.6)}",
        f"--scrim:{pv.rgba(shadow, 0.5 if mode == 'light' else 0.62)}",
        f"--sea:{sea}", f"--map-stroke:{t['surface']}", f"--map-halo:{pv.rgba(t['surface'], 0.92)}",
        f"--river:{t['secondary']}", f"--river-ink:{t['secondary']}",
        f"--map-label:{'#FFFFFF' if mode == 'light' else t['bg']}",
        f"--map-label-halo:{pv.rgba(t['text'], 0.55) if mode == 'light' else pv.rgba('#FFFFFF', 0.55)}",
    ], deep


def split_top(text, sep=','):
    """Split on `sep` outside (), [] and quotes."""
    parts, depth, cur, quote = [], 0, [], None
    for ch in text:
        if quote:
            cur.append(ch)
            if ch == quote:
                quote = None
            continue
        if ch in '"\'':
            quote = ch
        elif ch in '([':
            depth += 1
        elif ch in ')]':
            depth -= 1
        elif ch == sep and depth == 0:
            parts.append(''.join(cur).strip())
            cur = []
            continue
        cur.append(ch)
    if ''.join(cur).strip():
        parts.append(''.join(cur).strip())
    return parts


def expand(chrome, scopes):
    """Rewrite each `selector-list { body }` of preview.py's chrome so every PH becomes each scope in turn."""
    chrome = re.sub(r'/\*.*?\*/', '', chrome, flags=re.S)
    out = []
    for sel, body in re.findall(r'([^{}]+)\{([^{}]*)\}', chrome):
        sels = []
        for part in split_top(sel.strip()):
            for sc in scopes:
                sels.append(part.replace(PH, sc))
        body = ' '.join(body.split())
        out.append(',\n'.join(sels) + ' { ' + body + ' }')
    return '\n'.join(out)


def build(spec):
    out = [BEGIN,
           '/* The four themes of the retro redesign (VISUAL_DIRECTION_PROMPT.md section 3): Mekong Retro, River, Four',
           '   Flags and Temples & Markets. Every value comes from tools/style-tiles/round2.json. Token blocks first',
           '   (one light and one dark block per theme), then the chrome rules they share. */']
    chrome_by_family = {'retro': [], 'modern': []}
    report = []
    for sid, key in THEMES.items():
        s = spec[key]
        fam = s.get('family', 'modern')
        scope = f':root[data-skin="{sid}"]'
        tokens, chrome = pv.render(spec, key, 'country', scope=PH, split=True)
        # token blocks: scope the placeholder, add the Phase 2 tokens, rename --pv- to --th-
        blocks = []
        for mode in ('light', 'dark'):
            t = s[mode]
            extras, deep = extra_tokens(t, mode)
            if m.contrast('#FFFFFF', deep) < 4.5:
                raise SystemExit(f'{sid} {mode}: white on --teal-deep {deep} is under 4.5:1')
            report.append((sid, mode, deep))
            sel = f'{scope}[data-theme="{mode}"]'
            hit = re.search(re.escape(f'{PH}[data-theme="{mode}"]') + r' \{\n  (.*?);\n\}\n', tokens, flags=re.S)
            if not hit:
                raise SystemExit(f'{sid} {mode}: could not find its token block in preview.py output')
            decls = [d for d in hit.group(1).split(';\n  ') if d]
            decls += extras
            blocks.append(f'{sel} {{\n  ' + ';\n  '.join(decls) + ';\n}')
        out.append(f'/* {s["name"]} */\n' + '\n'.join(blocks))
        chrome_by_family[fam].append((sid, chrome))
    # the chrome is identical for every theme of a family apart from the scope, so it is written once per family
    for fam, items in chrome_by_family.items():
        scopes = [f':root[data-skin="{sid}"]' for sid, _ in items]
        base = items[0][1]
        for sid, ch in items[1:]:
            if ch != base:
                raise SystemExit(f'{sid}: chrome differs from {items[0][0]}; port-themes.py assumes one chrome per family')
        out.append(f'/* chrome rules, {"retro (stripe band)" if fam == "retro" else "modern (hairlines, no stripes)"} */\n'
                   + expand(base, scopes))
    out.append(END)
    css = '\n'.join(out) + '\n'
    return css.replace('--pv-', '--th-'), report


def main():
    spec = json.load(open(os.path.join(HERE, 'round2.json'), encoding='utf-8'))
    block, report = build(spec)
    cur = open(CSS, encoding='utf-8').read()
    i, j = cur.find(BEGIN), cur.find(END)
    if (i < 0) != (j < 0):
        raise SystemExit('css/style.css has one generated-block marker but not the other')
    if i >= 0:
        new = cur[:i] + block + cur[j + len(END) + 1:]
    else:
        new = cur.rstrip('\n') + '\n\n' + block
    if '--check' in sys.argv:
        if new != cur:
            print('FAIL: the generated theme block in css/style.css is not what tools/style-tiles/port-themes.py writes from round2.json.')
            print('Run: python3 tools/style-tiles/port-themes.py')
            return 1
        print(f'PASS: the generated theme block matches round2.json ({len(block)} bytes, {len(THEMES)} themes).')
        return 0
    if new != cur:
        open(CSS, 'w', encoding='utf-8').write(new)
    print(f'wrote {len(block)} bytes of generated themes to css/style.css; --teal-deep per theme/mode:')
    for sid, mode, deep in report:
        print(f'  {sid:8s} {mode:5s} {deep}  white {m.contrast("#FFFFFF", deep):.2f}:1')
    return 0


if __name__ == '__main__':
    sys.exit(main())
