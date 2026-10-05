#!/usr/bin/env python3
"""Verify every colour token used as text clears WCAG AA on every surface the app renders.

    python3 scripts/check-contrast.py            # report failures, non-zero exit on any
    python3 scripts/check-contrast.py --all      # also print the passing rows

WHY THIS EXISTS. The palette is token-driven and the app renders one surface per skin and mode:
the ids and modes in js/theme.js (SKIN_MODE), built here in cascade order. A token that is
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
THEME = 'js/theme.js'
AA_TEXT = 4.5
AA_LARGE = 3.0
AA_GRAPHIC = 3.0

# Skins that shipped before the retro redesign. Their palettes are measured and reported, but
# the page-colour and country-colour floors below are enforced only on the new themes, because
# Classic as shipped fails 19 of them (VISUAL_DIRECTION_PROMPT.md section 7) and the six named
# skins were never held to them. Text on a card and the primary button's label are enforced on all.
LEGACY = {'classic', 'night', 'silk', 'tropical', 'psych', 'psychnight', 'expedition'}

# Skins whose id is in theme.js but whose palette has not landed yet (Phase 3 empties this set
# and the assertion on the surface count then covers them). Mirrors PENDING in check-skins.py.
PENDING = {'retro', 'river', 'flags', 'temples'}

# (label token, fill token, what it is). The label must clear 4.5:1 against EVERY hex stop of the fill.
LABELS = [
    ('btn-ink', 'btn-bg', 'primary button (.btn)'),
    ('back-ink', 'back-bg', 'Back pill (.topbar .back)'),
]
# Labels that sit on a brand fill and are held to 4.5:1 on the new themes only (Classic's white on
# the #E07A1F stop of --grad-sun is 3.01:1; the Phase 3 palettes carry their own --on-fill).
LABELS_NEW_ONLY = [
    ('on-fill', 'grad-sun', 'chips, phase switch, pills, update toast'),
    ('on-fill', 'teal-deep', 'pressed chip (.chip[aria-pressed])'),
]
COUNTRIES = ['th', 'vi', 'kh', 'la']

# The primary button's white label on the five named skins that were never given a dark ink (Classic
# was, in Phase 2). Each is the measured shortfall on one fill stop, on the record: the guard fails if
# the ratio moves (a change nobody looked at) or if it now passes (a stale entry). Fixing them changes
# those skins' look, so it is not part of the no-visual-change phase.
LABEL_EXCEPTIONS = {
    ('night-dark', 'btn-ink', '#F5A524'): 2.04, ('night-dark', 'btn-ink', '#FF5C8A'): 2.94,
    ('expedition-dark', 'btn-ink', '#F2A44E'): 2.06, ('expedition-dark', 'btn-ink', '#E4663B'): 3.35,
    ('tropical-light', 'btn-ink', '#12B886'): 2.55, ('tropical-light', 'btn-ink', '#1098AD'): 3.43,
    ('psychnight-dark', 'btn-ink', '#FF3D9A'): 3.29, ('psychnight-dark', 'btn-ink', '#F0561A'): 3.47,
    ('psychnight-dark', 'btn-ink', '#B15CFF'): 3.59, ('psych-light', 'btn-ink', '#D9541E'): 4.01,
}

# Tokens that name a surface, a border or a shadow. They appear inside `color:` only in
# prose comments, and comparing a background against a card is meaningless.
NOT_TEXT = {'cream', 'card', 'line', 'bg', 'shadow', 'shadow-soft', 'badge-ink',
            'key-dot-ring', 'elev-1', 'elev-2', 'tile-accent', 'cat', 'sunburst',
            # labels that sit ON a fill, not on the card: checked against their fill in LABELS
            'on-fill', 'btn-ink', 'back-ink', 'map-label'}

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


def skin_modes(theme_js):
    """id -> 'light' | 'dark' | 'auto', read from js/theme.js SKIN_MODE (the same table applyTheme() uses)."""
    m = re.search(r'export const SKIN_MODE = \{([^}]*)\}', theme_js)
    if not m:
        raise SystemExit('FAIL — could not find SKIN_MODE in js/theme.js.')
    modes = dict(re.findall(r"(\w+):\s*'(\w+)'", m.group(1)))
    if not modes:
        raise SystemExit('FAIL — SKIN_MODE in js/theme.js parsed to nothing.')
    return modes


SEL_RE = re.compile(r'^(:root|html)((?:\[data-(?:skin|theme)="[a-z]+"\])*)$')


def token_rules(css):
    """Every rule whose selector is :root / html plus data-skin / data-theme conditions, as
    (skin|None, theme|None, specificity, order, tokens). Anything else is not a token block."""
    out = []
    for order, m in enumerate(re.finditer(r'([^{}]+)\{([^{}]*)\}', css)):
        toks = tokens_in(m.group(2))
        if not toks:
            continue
        for part in m.group(1).split(','):
            sm = SEL_RE.match(part.strip())
            if not sm:
                continue
            attrs = dict(re.findall(r'data-(skin|theme)="([a-z]+)"', sm.group(2)))
            spec = (len(attrs) + (1 if sm.group(1) == ':root' else 0), 0 if sm.group(1) == ':root' else 1)
            out.append((attrs.get('skin'), attrs.get('theme'), spec, order, toks))
    return out


def resolve(tokens, value, depth=0):
    """Substitute var(--x) / var(--x, fallback) until none are left; None if one cannot be resolved."""
    value = value.strip()
    for _ in range(12):
        m = re.search(r'var\(\s*--([a-z0-9-]+)\s*(?:,\s*([^()]*))?\)', value)
        if not m:
            return value
        ref = tokens.get(m.group(1))
        rep = resolve(tokens, ref, depth + 1) if ref is not None and depth < 8 else m.group(2)
        if rep is None:
            return None
        value = value[:m.start()] + rep.strip() + value[m.end():]
    return None


def build_surfaces(css, modes):
    """-> {'<id>-<mode>': (tokens, mode)}: one per auto skin and mode, one per fixed skin. Rules apply in
    cascade order (specificity, then source order), var() resolved at the end, as html would see them."""
    rules = token_rules(css)
    surfaces, skipped = {}, []
    for skin, kind in modes.items():
        if skin in PENDING:
            skipped.append(skin)
            continue
        for mode in (('light', 'dark') if kind == 'auto' else (kind,)):
            hits = [r for r in rules
                    if (r[0] in (None, skin)) and (r[1] in (None, mode))]
            raw = {}
            for _, _, _, _, toks in sorted(hits, key=lambda r: (r[2], r[3])):
                raw.update(toks)
            surfaces[f'{skin}-{mode}'] = ({k: resolve(raw, v) for k, v in raw.items()}, mode)
    return surfaces, skipped


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


def hex_stops(value):
    """Every #rrggbb / #rgb in a resolved fill (a gradient gives one per stop)."""
    return re.findall(r'#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b', value or '')


def main():
    show_all = '--all' in sys.argv
    raw = read(CSS)
    css = strip_comments(raw)
    modes = skin_modes(read(THEME))
    surfaces, pending = build_surfaces(css, modes)

    # The surface count is asserted, so a skin that silently drops out of the cascade (a renamed
    # block, a selector this parser cannot read) fails here instead of going unchecked.
    expected = sum(2 if k == 'auto' else 1 for sid, k in modes.items() if sid not in PENDING)
    if len(surfaces) != expected:
        print(f'FAIL — built {len(surfaces)} surfaces, js/theme.js implies {expected}.')
        return 1
    if any(sid not in modes for sid in PENDING):
        print('FAIL — PENDING names an id that js/theme.js does not define.')
        return 1

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
    skipped = {'label token': 0, 'no hex value': 0}
    for sel, body in rules:
        m = re.search(r'(^|[^-])color:\s*var\(--([a-z0-9-]+)\)', body)
        if not m:
            continue
        token = m.group(2)
        if token in NOT_TEXT:
            skipped['label token'] += 1
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
                skin = name.rsplit('-', 1)[0]
                # Text sits on a card or, for a screen title, on the page. The page is held to it
                # on the new themes only (see LEGACY).
                grounds = ['card'] + ([] if skin in LEGACY else ['bg'])
                for ground in grounds:
                    fg, bg = toks.get(token), toks.get(ground)
                    if not fg or not bg:
                        continue
                    ratio = contrast(fg, bg)
                    if ratio is None:
                        skipped['no hex value'] += 1
                        continue
                    checked += 1
                    if ratio + 0.005 < threshold:
                        key = (bare, token)
                        if key in EXCEPTIONS:
                            continue
                        failures.append((bare, token, f'{name} on {ground}', ratio, threshold, fg, bg, why))
                    elif show_all:
                        print(f'  ok   {bare[:40]:40s} --{token:11s} {name:14s} {ratio:5.2f}:1')

    # Labels on fills: every stop of the fill, 4.5:1.
    label_checked = 0
    for name, (toks, mode) in surfaces.items():
        skin = name.rsplit('-', 1)[0]
        pairs = LABELS + ([] if skin in LEGACY else LABELS_NEW_ONLY)
        for label, fill, what in pairs:
            fg = toks.get(label)
            for stop in hex_stops(toks.get(fill)):
                ratio = contrast(fg, stop) if fg else None
                if ratio is None:
                    continue
                label_checked += 1
                known = LABEL_EXCEPTIONS.get((name, label, stop.upper()))
                if ratio + 0.005 < AA_TEXT:
                    if known is not None and abs(known - ratio) < 0.01:
                        continue
                    failures.append((what, label, f'{name} on --{fill} {stop}', ratio, AA_TEXT, fg, stop, 'label on fill'))
                elif known is not None:
                    failures.append((what, label, f'{name} on --{fill} {stop}', ratio, AA_TEXT, fg, stop,
                                     'now passes: remove it from LABEL_EXCEPTIONS'))

    # Country colours as graphics: 3:1 against the page and the card, new themes only.
    country_checked = 0
    for name, (toks, mode) in surfaces.items():
        skin = name.rsplit('-', 1)[0]
        if skin in LEGACY:
            continue
        for cc in COUNTRIES:
            fg = toks.get(f'country-{cc}')
            for ground in ('bg', 'card'):
                bg = toks.get(ground)
                ratio = contrast(fg, bg) if fg and bg else None
                if ratio is None:
                    failures.append(('country colour', f'country-{cc}', f'{name} on {ground}', 0.0, AA_GRAPHIC, str(fg), str(bg), 'missing or not a hex value'))
                    continue
                country_checked += 1
                if ratio + 0.005 < AA_GRAPHIC:
                    failures.append(('country colour', f'country-{cc}', f'{name} on {ground}', ratio, AA_GRAPHIC, fg, bg, 'graphic'))

    print(f'{checked} selector/surface colour pairs, {label_checked} label-on-fill stops and {country_checked} '
          f'country colours checked across {len(surfaces)} surfaces ({len(EXCEPTIONS)} accepted exceptions).')
    print(f'  skipped: {skipped["label token"]} rules whose colour is a label on a fill (checked above), '
          f'{skipped["no hex value"]} pairs with a non-hex value; '
          f'ids awaiting a palette: {", ".join(sorted(pending)) or "none"}.')
    if not failures:
        print('\nPASS — every text colour clears its WCAG AA threshold on every surface.')
        return 0

    print(f'\nFAIL — {len(failures)} below threshold:\n')
    for bare, token, name, ratio, threshold, fg, bg, why in sorted(failures, key=lambda r: r[3]):
        print(f'  {bare[:42]:42s} --{token:11s} {name:24s} '
              f'{ratio:5.2f}:1 (needs {threshold}) {fg} on {bg}')
        print(f'  {"":42s} {why}')
    print('\nFix by giving the token a value that works on that surface (the --teal /'
          '\n--teal-deep split and the dark --warn / --good values are the precedents), or'
          '\nby re-pointing the rule at a token that already passes there. If the shortfall'
          '\nis genuinely acceptable, add it to EXCEPTIONS with the reason and the measurement.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
