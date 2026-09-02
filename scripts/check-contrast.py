#!/usr/bin/env python3
"""Verify every colour token used as text clears WCAG AA on every surface the app renders.

    python3 scripts/check-contrast.py            # report failures, non-zero exit on any
    python3 scripts/check-contrast.py --all      # also print the passing rows

WHY THIS EXISTS. The palette is token-driven and the app renders eight distinct surfaces:
classic light, classic dark, and six named skins (js/main.js applyTheme()). A token that is
legible on the cream default can be invisible on the dark grape card, and nothing catches it
— the page renders, the text is simply unreadable. That failure has been found and repaired
BY HAND at least four times in this file's history, each time for a different token:

  --warn      given a brighter dark value, with a comment citing the new ratio
  --good      given #34C77B for dark
  --grape     .phrase .native and .local-name both re-pointed on dark, the second with a
              comment reading "--grape on the dark grape card is 2.27:1"
  --teal      split into --teal / --teal-deep precisely so each surface gets a legible one

Four manual discoveries of one bug class is the definition of something a guard should own.
And the fifth was already shipped when this was written: --magenta as text measured 2.78:1 on
the tropical skin.

HOW IT AVOIDS FALSE POSITIVES. Two things make a naive sweep useless here, and both are
handled:

  1. A token is only tested on the surfaces where it is ACTUALLY used. `--teal` reads 2.90:1
     on classic light, which is irrelevant: on light surfaces the rule uses `--teal-deep`.
     So for every `color: var(--x)` rule this checks whether a `html[data-theme="dark"]`
     -scoped rule overrides the same selector. If one does, the base rule is tested on light
     surfaces only and the override on dark ones.
  2. The threshold follows what the element is. Body text needs 4.5:1; text at 24px, or 18.66px
     and bold, needs 3.0:1; a glyph that is itself the whole control (a rating star) is a
     non-text UI component and needs 3.0:1 under WCAG 1.4.11.

KNOWN, ACCEPTED EXCEPTIONS live in EXCEPTIONS below, each with a reason and a measured ratio.
An exception is a decision someone made on the record, not a way to silence this.
"""
import re
import sys

CSS = 'css/style.css'
MAIN = 'js/main.js'
AA_TEXT = 4.5
AA_LARGE = 3.0

# Tokens that name a surface, a border or a shadow. They appear inside `color:` only in
# prose comments, and comparing a background against a card is meaningless.
NOT_TEXT = {'cream', 'card', 'line', 'bg', 'shadow', 'shadow-soft', 'badge-ink',
            'key-dot-ring', 'elev-1', 'elev-2', 'tile-accent', 'cat', 'sunburst'}

# (selector, token) pairs whose shortfall has been looked at and accepted, with the reason.
EXCEPTIONS = {
    ('.save-star', 'sun-deep'): 'brand orange on the cream default measures 2.80:1 against a '
                                '3:1 glyph threshold; darkening --sun-deep changes the brand '
                                'colour everywhere it fills rather than writes. Raised as a '
                                'design decision, not silently patched.',
    ('.star', 'sun-deep'): 'same glyph, same 2.80:1, same decision as .save-star.',
}


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def strip_comments(css):
    """Blank out /* ... */ so commented-out rules and prose never parse as declarations."""
    return re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group(0)), css, flags=re.S)


def token_block(css, at):
    open_i = css.index('{', at)
    close_i = css.index('}', open_i)
    return css[open_i + 1:close_i]


def tokens_in(text):
    return {m.group(1): m.group(2).strip()
            for m in re.finditer(r'--([a-z0-9-]+):\s*([^;]+);', text)}


def skin_modes(main_js):
    """The light/dark pairing each skin carries, read from applyTheme()'s own SKIN_MODE."""
    m = re.search(r'const SKIN_MODE = \{([^}]*)\}', main_js)
    if not m:
        raise SystemExit('FAIL — could not find SKIN_MODE in js/main.js; applyTheme() moved.')
    return dict(re.findall(r"(\w+):\s*'(\w+)'", m.group(1)))


def build_surfaces(css, modes):
    base = tokens_in(token_block(css, css.index('\n:root {')))
    dark = {}
    for m in re.finditer(r'html\[data-theme="dark"\]\s*\{', css):
        dark.update(tokens_in(token_block(css, m.start())))
    light = {}
    for m in re.finditer(r'html\[data-theme="light"\]\s*\{', css):
        light.update(tokens_in(token_block(css, m.start())))
    skins = {}
    for m in re.finditer(r':root\[data-skin="([a-z]+)"\]\s*\{', css):
        skins.setdefault(m.group(1), {}).update(tokens_in(token_block(css, m.start())))

    surfaces = {}
    for name, mode in (('classic-light', 'light'), ('classic-dark', 'dark')):
        t = dict(base)
        t.update(light if mode == 'light' else dark)
        surfaces[name] = (t, mode)
    for skin, mode in modes.items():
        if skin not in skins:
            continue
        t = dict(base)
        t.update(light if mode == 'light' else dark)
        t.update(skins[skin])
        surfaces[skin] = (t, mode)
    return surfaces


def luminance(value):
    v = value.strip()
    if not v.startswith('#'):
        return None
    h = v[1:]
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    if len(h) != 6:
        return None
    try:
        parts = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    except ValueError:
        return None

    def channel(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in parts)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg, bg):
    lf, lb = luminance(fg), luminance(bg)
    if lf is None or lb is None:
        return None
    return (max(lf, lb) + 0.05) / (min(lf, lb) + 0.05)


REM = {'--fs-display': 2.2, '--fs-h1': 1.45, '--fs-h2': 1.18, '--fs-h3': 1.02,
       '--fs-lg': 1.18, '--fs-body': 1.0, '--fs-base': 1.0, '--fs-sm': 0.875,
       '--fs-label': 0.7}


def rule_threshold(body):
    """4.5 for body text, 3.0 for large text and for a glyph that is the whole control."""
    size_m = re.search(r'font-size:\s*([^;]+)', body)
    weight_m = re.search(r'font-weight:\s*(\d+)', body)
    rem = None
    if size_m:
        raw = size_m.group(1).strip()
        if raw in REM:
            rem = REM[raw]
        else:
            num = re.match(r'([\d.]+)rem', raw)
            if num:
                rem = float(num.group(1))
    if rem is None:
        return AA_TEXT, 'inherited size — treated as body text'
    px = rem * 16
    bold = bool(weight_m and int(weight_m.group(1)) >= 700)
    if px >= 24 or (px >= 18.66 and bold):
        return AA_LARGE, f'{px:.0f}px{" bold" if bold else ""} — large text'
    # A cursor:pointer element with no other content is a control drawn as a glyph.
    if 'cursor: pointer' in body and px >= 18:
        return AA_LARGE, f'{px:.0f}px glyph control — WCAG 1.4.11'
    return AA_TEXT, f'{px:.0f}px{" bold" if bold else ""} — body text'


def main():
    show_all = '--all' in sys.argv
    raw = read(CSS)
    css = strip_comments(raw)
    modes = skin_modes(read(MAIN))
    surfaces = build_surfaces(css, modes)

    rules = [(m.group(1).strip(), m.group(2))
             for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css)]

    # Selectors that a dark-scoped rule re-colours, so the base rule is light-only.
    dark_overridden = set()
    for sel, body in rules:
        if not re.search(r'(^|[^-])color:\s*var\(--', body):
            continue
        for part in sel.split(','):
            part = part.strip()
            m = re.match(r'html\[data-theme="dark"\]\s+(.*)$', part)
            if m:
                dark_overridden.add(m.group(1).strip())

    failures, checked = [], 0
    for sel, body in rules:
        m = re.search(r'(^|[^-])color:\s*var\(--([a-z0-9-]+)\)', body)
        if not m:
            continue
        token = m.group(2)
        if token in NOT_TEXT:
            continue
        threshold, why = rule_threshold(body)
        for part in [p.strip() for p in sel.split(',') if p.strip()]:
            dark_scoped = part.startswith('html[data-theme="dark"]')
            bare = re.sub(r'^html\[data-theme="dark"\]\s+', '', part)
            if not dark_scoped and bare in dark_overridden:
                scope = 'light'          # the dark surfaces use the override instead
            elif dark_scoped:
                scope = 'dark'
            else:
                scope = 'both'
            for name, (toks, mode) in surfaces.items():
                if scope != 'both' and scope != mode:
                    continue
                fg, bg = toks.get(token), toks.get('card')
                if not fg or not bg:
                    continue
                ratio = contrast(fg, bg)
                if ratio is None:
                    continue
                checked += 1
                if ratio + 0.005 < threshold:
                    key = (bare, token)
                    if key in EXCEPTIONS:
                        continue
                    failures.append((bare, token, name, ratio, threshold, fg, bg, why))
                elif show_all:
                    print(f'  ok   {bare[:40]:40s} --{token:11s} {name:14s} {ratio:5.2f}:1')

    print(f'{checked} selector/surface colour pairs checked across {len(surfaces)} surfaces '
          f'({len(EXCEPTIONS)} accepted exceptions).')
    if not failures:
        print('\nPASS — every text colour clears its WCAG AA threshold on every surface.')
        return 0

    print(f'\nFAIL — {len(failures)} below threshold:\n')
    for bare, token, name, ratio, threshold, fg, bg, why in sorted(failures, key=lambda r: r[3]):
        print(f'  {bare[:42]:42s} --{token:11s} {name:14s} '
              f'{ratio:5.2f}:1 (needs {threshold}) {fg} on {bg}')
        print(f'  {"":42s} {why}')
    print('\nFix by giving the token a value that works on that surface (the --teal /'
          '\n--teal-deep split and the dark --warn / --good values are the precedents), or'
          '\nby re-pointing the rule at a token that already passes there. If the shortfall'
          '\nis genuinely acceptable, add it to EXCEPTIONS with the reason and the measurement.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
