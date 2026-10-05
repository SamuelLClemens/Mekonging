#!/usr/bin/env python3
"""Render a candidate theme from round2.json into the preview stylesheet that capture.py --preview injects.

    python3 tools/style-tiles/preview.py tools/style-tiles/round2.json --theme retro-map --nav country \
        --out <scratchpad>/previews/retro-map--country.css

The stylesheet maps the theme's roles onto the app's existing tokens (`--cream`, `--card`, `--ink`, ...),
overrides the chrome selectors that still carry literal colours (the list in VISUAL_DIRECTION_PROMPT.md
Phase 2), pins the logo, and for the retro family draws the four-stripe band. Everything is scoped under
`html[data-preview="<id>"][data-theme="light"|"dark"]`, so nothing leaks between modes or into the app.

`--nav country` marks the active tab with the sun orange and lets the four country colours do the
wayfinding. `--nav tabs` gives each tab its own colour as well, so the gate can compare the two.

It depends on three attributes that the app itself sets on <html> (applyTab() in js/main.js, Phase 2):
`data-tab` (the active tab: home, talk, you, places, explore), `data-country` (the country in context)
and `data-route` (the hash head); plus `data-cc` on country chips, country cards and the country
context line.
"""
import argparse, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import measure as m  # noqa: E402

COUNTRIES = ["th", "vi", "kh", "la"]          # stripe order, top to bottom and outside in
TABS = ["home", "talk", "you", "places", "explore"]      # the ids of TABS in js/main.js
LOGO_PIN = "--sun:#F2A93B;--sun-deep:#E8632A;--magenta:#D6336C;--teal:#16A39A"   # index.html splash, icons/icon.svg


def rgba(h, a):
    r, g, b = m.rgb(h)
    return f"rgba({r},{g},{b},{a})"


def deep_fill(h):
    """The colour's own hue, deepened until a white label reads on it at 4.5:1 (for --teal-deep fills)."""
    if m.contrast("#FFFFFF", h) >= 4.6:
        return h
    import colorsys
    r, g, b = (v / 255 for v in m.rgb(h))
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    while ll > 0.05:
        ll -= 0.01
        c = "#" + "".join(f"{round(v * 255):02X}" for v in colorsys.hls_to_rgb(hh, ll, ss))
        if m.contrast("#FFFFFF", c) >= 4.6:
            return c
    return "#000000"


def stripes(direction="to bottom"):
    stops = ", ".join(f"var(--stripe-{i + 1}) {i * 25}% {(i + 1) * 25}%" for i in range(4))
    return f"linear-gradient({direction}, {stops})"


def arc(inner, width, at="50% 100%", first_outside=True):
    """Four concentric rings as one radial gradient: the band bent into an arc. Read top to bottom, an arc
    keeps the straight band's order: the first country is outermost on a crown (centre below) and
    innermost on a bowl (centre above), so a bowl passes first_outside=False."""
    parts, r = [f"transparent 0 {inner}px"], inner
    for i in (reversed(range(4)) if first_outside else range(4)):
        parts.append(f"var(--stripe-{i + 1}) {r}px {r + width}px")
        r += width
    parts.append(f"transparent {r}px")
    return f"radial-gradient(circle at {at}, {', '.join(parts)})"


def mode_block(sel, t, family, mode):
    surface, bg = t["surface"], t["bg"]
    fill = t["accentFill"] if isinstance(t["accentFill"], str) else t["accentFill"][-1]
    sec_fill = deep_fill(t["secondary"])
    shadow = t["text"] if mode == "light" else "#000000"
    a1, a2 = (0.06, 0.12) if mode == "light" else (0.35, 0.5)
    sea = t.get("sea") or m.mix(t["secondary"], surface, 0.16 if mode == "light" else 0.30)
    river = t["secondary"]
    lines = [
        f"--bg:{bg}", f"--cream:{bg}", f"--card:{surface}", f"--line:{t['line']}",
        f"--ink:{t['text']}", f"--ink-soft:{t['text2']}", f"--muted:{t['text2']}",
        f"--orange:{t['title']}", f"--head-accent:{t['title']}",
        f"--sun:{t['sun']}", f"--sun-deep:{t['sun']}",
        f"--teal:{t['secondary']}", f"--teal-deep:{t['secondary'] if mode == 'light' else sec_fill}",
        f"--magenta:{t['danger']}", f"--magenta-deep:{t['danger']}", f"--pink:{t['danger']}", f"--coral:{t['danger']}",
        f"--warn:{t['danger']}", f"--gold:{t['star']}",
        f"--badge-ink:{t['text'] if mode == 'light' else bg}",
        f"--grad-sun:linear-gradient({fill},{fill})", f"--grad-teal:linear-gradient({sec_fill},{sec_fill})",
        "--sunburst:linear-gradient(transparent,transparent)",
        "--edge-hi:linear-gradient(transparent,transparent)", "--card-wash:linear-gradient(transparent,transparent)",
        f"--shadow:0 10px 28px -10px {rgba(shadow, a2)},0 1px 3px {rgba(shadow, a1)}",
        f"--shadow-soft:0 2px 10px -4px {rgba(shadow, a2)}",
        f"--elev-1:0 1px 2px {rgba(shadow, a1)},0 2px 8px -4px {rgba(shadow, a2)}",
        f"--elev-2:0 2px 4px {rgba(shadow, a1)},0 12px 28px -12px {rgba(shadow, a2)}",
        f"--elev-3:0 4px 10px {rgba(shadow, a1)},0 24px 48px -16px {rgba(shadow, a2)}",
        f"--pv-surface:{surface}", f"--pv-surface2:{t['surface2']}", f"--pv-border-strong:{t['borderStrong']}",
        f"--pv-accent:{t['accent']}", f"--pv-fill:{fill}", f"--pv-on-accent:{t['onAccent']}",
        f"--pv-accent-soft:{t['accentSoft']}", f"--pv-sun:{t['sun']}", f"--pv-title:{t['title']}",
        f"--pv-danger:{t['danger']}", f"--pv-on-danger:{t['onDanger']}", f"--pv-sea:{sea}", f"--pv-river:{river}",
        f"--pv-shadow:{rgba(shadow, a2)}",
        f"--pv-map-label:{'#FFFFFF' if mode == 'light' else bg}",
        f"--pv-map-halo:{rgba(t['text'], 0.55) if mode == 'light' else rgba('#FFFFFF', 0.55)}",
    ]
    for cc in COUNTRIES:
        lines.append(f"--country-{cc}:{t['country'][cc]}")
    if family == "retro":
        lines += [f"--stripe-{i + 1}:var(--country-{cc})" for i, cc in enumerate(COUNTRIES)]
    for tab, col in (t.get("tabs") or {}).items():
        lines.append(f"--tab-{tab}:{col}")
    return f"{sel} {{\n  " + ";\n  ".join(lines) + ";\n}\n"


def render(spec, theme, nav, scope=None, split=False):
    """The preview stylesheet. `scope` replaces the `html[data-preview=...]` prefix (port-themes.py passes a
    placeholder it expands per theme); `split` returns (tokens, chrome) instead of one string."""
    s = spec[theme]
    family = s.get("family", "modern")
    P = scope or f'html[data-preview="{theme}"]'
    css = [f"/* mk-preview id={theme} nav={nav} */\n/* {s['name']}. Generated by tools/style-tiles/preview.py from round2.json; do not edit. */\n"]
    for mode in ("light", "dark"):
        css.append(mode_block(f'{P}[data-theme="{mode}"]', s[mode], family, mode))
    n_tokens = len(css)
    css.append(f"""
/* The logo is pinned: the same sun on every theme, identical to icons/icon.svg and the splash. */
{P} .logo {{ {LOGO_PIN}; }}

/* ---- Chrome that still carries literal colours (VISUAL_DIRECTION_PROMPT.md Phase 2 list) ---- */
{P} .topbar .back, {P}[data-theme="dark"] .topbar .back {{ background: var(--pv-surface2); color: var(--ink); border: 1px solid var(--line); }}
{P} .hero, {P} .welcome-hero {{ background: var(--card); box-shadow: var(--elev-1); }}
{P} .hero::before {{ display: none; }}
{P} .btn {{ background: var(--pv-fill); color: var(--pv-on-accent); text-shadow: none; box-shadow: none; }}
{P} .btn:not(.ghost)::before {{ display: none; }}
{P} .btn.ghost, {P}[data-theme="dark"] .btn.ghost {{ background: transparent; color: var(--ink); border: 1.5px solid var(--pv-border-strong); }}
{P} .btn.ghost:hover {{ background: color-mix(in srgb, var(--ink) 6%, transparent); }}
{P} .btn.danger {{ background: var(--pv-danger); border-color: var(--pv-danger); color: var(--pv-on-danger); }}
{P} .chip, {P} .country-chip {{ border-color: var(--pv-border-strong); }}
{P} .chip[aria-pressed="true"] {{ background: var(--ink); color: var(--pv-surface); border-color: transparent; box-shadow: none; }}
{P} .country-chip[aria-pressed="true"] {{ background: var(--card); color: var(--ink); border: 2px solid var(--pv-cc, var(--ink)); box-shadow: none; }}
{P} .tile .ic {{ background: var(--pv-surface2); color: var(--ink); box-shadow: none; }}
/* the feature accents are literal hexes, several of them country colours (Phase 2 makes them neutral) */
{P} .tile, {P} .hub-row {{ --tile-accent: var(--line) !important; }}
{P} .tile::after {{ background: var(--pv-sun); }}
{P} .tabbar, {P}[data-theme="dark"] .tabbar {{ border-top: 1px solid var(--line); border-image: none; box-shadow: 0 -8px 20px -14px var(--pv-shadow); }}
{P} .tabbar button[aria-current="page"] {{ color: var(--pv-accent); }}
{P} .tabbar button[aria-current="page"]::before {{ background: var(--pv-sun); width: 30px; height: 3px; }}
{P} .sheet {{ border-image: none; border-top: 1px solid var(--line); }}
{P} .home-section::before {{ background: var(--pv-sun); width: 18px; }}
/* Selected is a state, not an action: ink, so the sun orange keeps meaning "tap here" and "you are here". */
{P} .phase-btn[aria-pressed="true"] {{ background: var(--ink); color: var(--pv-surface); box-shadow: none; }}
{P} .pill-best {{ background: var(--teal-deep); color: #fff; }}
{P} .update-toast-btn {{ background: var(--pv-fill); color: var(--pv-on-accent); }}
{P} .compare-tray {{ border-image: none; border-top: 1px solid var(--line); box-shadow: 0 -8px 20px -14px var(--pv-shadow); }}
{P} .route-opt.best {{ background: var(--pv-accent-soft); }}

/* ---- Wayfinding: the four country colours answer "which country am I looking at" ---- */
{P} [data-cc="th"] {{ --pv-cc: var(--country-th); }}
{P} [data-cc="vi"] {{ --pv-cc: var(--country-vi); }}
{P} [data-cc="kh"] {{ --pv-cc: var(--country-kh); }}
{P} [data-cc="la"] {{ --pv-cc: var(--country-la); }}
{P} .country-context {{ display: flex; align-items: center; gap: var(--sp-2); color: var(--ink); }}
{P} .country-context::before {{ content: ''; flex: none; width: 4px; height: 1.15em; border-radius: 2px; background: var(--pv-cc, var(--line)); }}
""")
    # The cards and the map read --country-* themselves since Phase 2 (REGION_COLORS is var(--country-*)),
    # so redefining the four tokens above is all it takes; no selector has to chase an inline hex.
    css.append(f"""{P} .region-map {{ background: var(--pv-sea); }}
{P} .ctry {{ stroke: var(--pv-surface); }}
{P} .mekong {{ stroke: var(--pv-river); }}
{P} .mekong-casing {{ stroke: var(--pv-surface); }}
{P} .mekong-name {{ fill: var(--pv-river); stroke: var(--pv-surface); }}
{P} .ctry-name {{ fill: var(--pv-map-label); stroke: var(--pv-map-halo); }}
""")
    for cc in COUNTRIES:   # a country's own pages carry its colour under the header
        css.append(f'{P}[data-country="{cc}"]:is([data-route="country"],[data-route="region"]) .topbar {{ '
                   f'border-bottom: 0; box-shadow: inset 0 -4px 0 var(--country-{cc}); }}\n')
    if nav == "tabs":
        for tab in TABS:
            css.append(f'{P}[data-tab="{tab}"] {{ --pv-tab: var(--tab-{tab}); }}\n')
        css.append(f"""
/* Navigation variant: every tab has its own colour (nine hues with the four countries). */
{P}[data-tab] .topbar h1 {{ color: var(--pv-tab); }}
{P}[data-tab] .tabbar button[aria-current="page"] {{ color: var(--pv-tab); }}
{P}[data-tab] .tabbar button[aria-current="page"]::before {{ background: var(--pv-tab); }}
{P}[data-tab] .topbar:not(:has(.back)) {{ border-bottom: 0; box-shadow: inset 0 -4px 0 var(--pv-tab); }}
""")
    if family == "retro":
        R, W = 640, 8                       # Welcome arc: radius and stripe width
        D = 2 * (R + 2 * W)
        TOP, ARC = 2 * R + 2 * W, arc(R - 2 * W, W, "50% 50%", first_outside=False)
        css.append(f"""
/* ---- The retro element: the four-stripe band, one stripe per country (th, vi, kh, la) ---- */
{P} {{ --pv-stripes: {stripes()}; }}
/* the tab bar's top edge */
{P} .tabbar::before {{ content: ''; position: absolute; left: 0; right: 0; top: -7px; height: 6px; background: var(--pv-stripes); pointer-events: none; }}
{P} .tabbar, {P}[data-theme="dark"] .tabbar {{ border-top: 0; }}
/* a thin rule under the tab-root headers (a root screen has no Back button) */
{P} .topbar:not(:has(.back)) {{ border-bottom: 0; padding-bottom: calc(var(--sp-3) + 8px);
  background: var(--pv-stripes) left bottom / 100% 8px no-repeat, var(--bg); }}
/* Home's header */
{P} .hero:not(.welcome-hero) {{ background: var(--pv-stripes) left bottom / 100% 8px no-repeat, var(--card); }}
/* section dividers */
{P} .home-section::before {{ width: 26px; height: 8px; border-radius: 1px; background: var(--pv-stripes); }}
/* empty states */
{P} .empty::before {{ content: ''; display: block; width: 64px; height: 32px; margin: 0 auto var(--sp-3);
  background: {arc(12, 5, "50% 100%")}; }}
/* Welcome: the band sweeps behind the sun. A wide arc whose lowest point is the sun's centre
   (the logo puts it at a tenth of the logo's width from the top), lifted 4px, rising toward the
   edges and clear of the wordmark below. Radius {R}px, four {W}px stripes. */
{P} .welcome-hero {{ overflow: hidden; }}
{P} .welcome-hero .logo-wrap {{ position: relative; isolation: isolate; --pv-sun-y: calc(min(74vw, 320px) / 10); }}
{P} .welcome-hero .logo-wrap::before {{ content: ''; position: absolute; z-index: -1; left: 50%;
  width: {D}px; height: {D}px; top: calc(var(--pv-sun-y) - {TOP + 4}px); transform: translateX(-50%);
  /* a window of page colour around the sun, so its rays never fall on a stripe */
  background: radial-gradient(circle at 50% {D // 2 + R + 4}px, var(--card) 0 calc(var(--pv-sun-y) * 0.98), transparent calc(var(--pv-sun-y) * 0.98 + 0.5px)), {ARC};
  pointer-events: none; }}
""")
    else:
        css.append(f"""
/* The modern themes use no stripes: plain hairlines, and the theme's own secondary on section marks. */
{P} .hero:not(.welcome-hero) {{ border-bottom: 1px solid var(--line); }}
{P} .home-section::before {{ background: var(--teal); }}
""")
    if split:
        return "".join(css[:n_tokens]), "".join(css[n_tokens:])
    return "".join(css)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("spec")
    ap.add_argument("--theme", required=True)
    ap.add_argument("--nav", choices=("country", "tabs"), default="country")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    spec = json.load(open(args.spec, encoding="utf-8"))
    if args.theme not in spec or args.theme.startswith("_"):
        raise SystemExit(f"unknown theme {args.theme!r}")
    if args.nav == "tabs" and "tabs" not in spec[args.theme]["light"]:
        raise SystemExit(f"{args.theme} defines no tab colours")
    css = render(spec, args.theme, args.nav)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    open(args.out, "w", encoding="utf-8").write(css)
    print(f"wrote {args.out} ({len(css)} bytes, {css.count('{')} rules)")


if __name__ == "__main__":
    main()
