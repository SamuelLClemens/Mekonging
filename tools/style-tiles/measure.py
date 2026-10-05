#!/usr/bin/env python3
"""Measure candidate palettes for the style tiles: WCAG 2.x contrast for every role pair the screens
use, CIEDE2000 between the colours that must never be mistaken for one another, and the same
separation as people with the three kinds of colour-vision deficiency see it.

    python3 tools/style-tiles/measure.py tools/style-tiles/round2.json --out <scratchpad>/palettes.json

Input: {"<id>": {"name": str, "light": {role: value}, "dark": {role: value}}}. Keys starting with
"_" are notes and are skipped. A theme that has no colours of its own (today's Classic, measured
for comparison) may set "reference": true; its failures are reported but do not fail the run.

Required roles: bg surface surface2 line borderStrong text text2 accent onAccent accentSoft secondary
star danger onDanger. The "Watch out" tint (dangerSoft) is derived.

Optional roles, each checked only when present:
  title       the screen title (topbar h1), which sits on bg
  accentFill  the primary button's fill: one hex, or a list of gradient stops; onAccent is checked
              against every stop (default: accent)
  sun         the one sun orange as a graphic: the active-tab marker and the action colour
  country     {"th", "vi", "kh", "la"}: the wayfinding colours, which are also the stripe colours
  tabs        {"home", "talk", "me", "places", "explore"}: per-tab colours (a navigation variant)
  sea         the illustrated map's sea, which every country colour must stand out from

The floors are those of VISUAL_DIRECTION_PROMPT.md section 4. Exit status 1 on any failure.
"""
import argparse, json, math, sys

ROLES = ["bg", "surface", "surface2", "line", "borderStrong", "text", "text2", "accent", "onAccent",
         "accentSoft", "secondary", "star", "danger", "onDanger"]
COUNTRIES = ["th", "vi", "kh", "la"]
TABS = ["home", "talk", "me", "places", "explore"]

# (foreground role, background roles it can sit on, threshold, what the pair is)
CHECKS = [
    ("text", ("surface", "bg", "surface2"), 4.5, "body text"),
    ("text", ("surface",), 7.0, "body text in sunlight, on its main surface"),
    ("text2", ("surface", "bg", "surface2"), 4.5, "secondary text"),
    ("accent", ("surface", "bg"), 4.5, "accent as text (tertiary buttons, active tab label)"),
    ("accent", ("accentSoft",), 3.0, "active tab icon on its indicator"),
    ("secondary", ("surface", "bg"), 4.5, "secondary hue as text"),
    ("star", ("surface", "bg"), 3.0, "rating star (graphic)"),
    ("danger", ("surface", "bg"), 4.5, "danger as text or outline"),
    ("onDanger", ("danger",), 4.5, "label on a danger fill (SOS)"),
    ("borderStrong", ("surface", "bg", "surface2"), 3.0, "input, chip and secondary-button boundary"),
    ("text", ("dangerSoft",), 4.5, "Watch-out text on its tint"),
    ("danger", ("dangerSoft",), 3.0, "Watch-out icon on its tint"),
]
OPTIONAL_CHECKS = [
    ("title", ("bg",), 4.5, "screen title on the page"),
    ("sun", ("surface", "bg"), 3.0, "sun orange as a graphic (active-tab marker, stripe beside it)"),
]
DE00_ACCENT_DANGER = 15.0   # round 1 measured 9.1 for a pair that read alike
DE00_COUNTRY_PAIR = 12.0    # the four country colours against one another
DE00_COUNTRY_ROLE = 15.0    # each country colour against danger and against the sun orange

# Machado, Oliveira and Fernandes (2009), severity 1.0, applied to linear sRGB.
CVD = {
    "protan": ((0.152286, 1.052583, -0.204868), (0.114503, 0.786281, 0.099216), (-0.003882, -0.048116, 1.051998)),
    "deutan": ((0.367322, 0.860646, -0.227968), (0.280085, 0.672501, 0.047413), (-0.011820, 0.042940, 0.968881)),
    "tritan": ((1.255528, -0.076749, -0.178779), (-0.078411, 0.930809, 0.147602), (0.004733, 0.691367, 0.303900)),
}


def rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def unlin(v):
    v = min(1.0, max(0.0, v))
    v = v * 12.92 if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055
    return round(v * 255)


def lum(h):
    r, g, b = (lin(v) for v in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def mix(a, b, t):
    """t of colour a over colour b, in 8-bit sRGB."""
    return "#" + "".join(f"{round(x * t + y * (1 - t)):02X}" for x, y in zip(rgb(a), rgb(b)))


def simulate(h, kind):
    """The colour as a dichromat of the given kind sees it (Machado 2009, full severity)."""
    v = [lin(c) for c in rgb(h)]
    m = CVD[kind]
    return "#" + "".join(f"{unlin(sum(m[i][j] * v[j] for j in range(3))):02X}" for i in range(3))


def lab(h):
    r, g, b = (lin(v) for v in rgb(h))
    x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def de2000(h1, h2):
    L1, a1, b1 = lab(h1); L2, a2, b2 = lab(h2)
    Cb = (math.hypot(a1, b1) + math.hypot(a2, b2)) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360
    h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dLp, dCp, dh = L2 - L1, C2p - C1p, h2p - h1p
    if C1p * C2p == 0:
        dh = 0
    elif dh > 180:
        dh -= 360
    elif dh < -180:
        dh += 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dh / 2))
    Lbp, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbp = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbp = (h1p + h2p) / 2
    elif h1p + h2p < 360:
        hbp = (h1p + h2p + 360) / 2
    else:
        hbp = (h1p + h2p - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp))
         + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.20 * math.cos(math.radians(4 * hbp - 63)))
    dtheta = 30 * math.exp(-(((hbp - 275) / 25) ** 2))
    Rc = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / math.sqrt(20 + (Lbp - 50) ** 2)
    Sc, Sh = 1 + 0.045 * Cbp, 1 + 0.015 * Cbp * T
    Rt = -math.sin(math.radians(2 * dtheta)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


def stops(v):
    return list(v) if isinstance(v, (list, tuple)) else [v]


def pair_check(t, fg, bgs, need, what):
    raw = {bg: contrast(t[fg], t[bg]) for bg in bgs}      # floors compare unrounded values: 4.495 fails 4.5
    return {"fg": fg, "vs": {k: round(v, 2) for k, v in raw.items()}, "min": round(min(raw.values()), 2),
            "need": need, "ok": min(raw.values()) >= need, "what": what}


def measure_mode(d, mode, t, fails, warns):
    rows = []
    for fg, bgs, need, what in CHECKS + [c for c in OPTIONAL_CHECKS if c[0] in t]:
        rows.append(pair_check(t, fg, bgs, need, what))
    # The primary button's label against every stop of its fill: a gradient's lightest stop is
    # where a label fails first, and a checker that reads only one stop misses it.
    fill = stops(t.get("accentFill", t["accent"]))
    raw = {f"stop{i}:{s}": contrast(t["onAccent"], s) for i, s in enumerate(fill)}
    rows.append({"fg": "onAccent", "vs": {k: round(v, 2) for k, v in raw.items()}, "min": round(min(raw.values()), 2),
                 "need": 4.5, "ok": min(raw.values()) >= 4.5, "what": "label on the primary fill, every stop"})
    for tab, col in (t.get("tabs") or {}).items():
        raw = {bg: contrast(col, t[bg]) for bg in ("bg", "surface")}
        rows.append({"fg": f"tabs.{tab}", "vs": {k: round(v, 2) for k, v in raw.items()}, "min": round(min(raw.values()), 2),
                     "need": 4.5, "ok": min(raw.values()) >= 4.5, "what": f"{tab} tab colour as title text and active label"})
    info = {"lineOnSurface": round(contrast(t["line"], t["surface"]), 2),
            "surfaceOnBg": round(contrast(t["surface"], t["bg"]), 2),
            "accentVsDangerDE00": round(de2000(t["accent"], t["danger"]), 1)}
    if de2000(t["accent"], t["danger"]) < DE00_ACCENT_DANGER:
        fails.append(f"{d}/{mode}: accent vs danger dE00 {info['accentVsDangerDE00']} < {DE00_ACCENT_DANGER}")
    if "sun" in t:
        info["sunVsDangerDE00"] = round(de2000(t["sun"], t["danger"]), 1)
        if de2000(t["sun"], t["danger"]) < DE00_ACCENT_DANGER:
            fails.append(f"{d}/{mode}: sun vs danger dE00 {info['sunVsDangerDE00']} < {DE00_ACCENT_DANGER}")
    country = t.get("country")
    if country:
        missing = [c for c in COUNTRIES if c not in country]
        if missing:
            raise SystemExit(f"{d}/{mode}: country colours missing {missing}")
        cinfo = {"graphic": {}, "pairs": {}, "vsDanger": {}, "vsSun": {}, "label": {}, "cvd": {}}
        for cc in COUNTRIES:
            col = country[cc]
            raw = {bg: contrast(col, t[bg]) for bg in ("bg", "surface", "sea") if bg in t}
            g = {k: round(v, 2) for k, v in raw.items()}
            cinfo["graphic"][cc] = g
            if min(raw.values()) < 3.0:
                fails.append(f"{d}/{mode}: country {cc} {col} as a graphic {min(g.values())} < 3.0")
            # Which label reads best on the colour as a fill, and how well. Information only:
            # the screens never put small text on a country fill without a halo.
            cands = {"text": t["text"], "surface": t["surface"]}
            best = max(cands, key=lambda k: contrast(cands[k], col))
            cinfo["label"][cc] = {"label": best, "ratio": round(contrast(cands[best], col), 2)}
            for role in ("danger", "sun"):
                if role in t:
                    de = round(de2000(col, t[role]), 1)
                    cinfo["vsDanger" if role == "danger" else "vsSun"][cc] = de
                    if de2000(col, t[role]) < DE00_COUNTRY_ROLE:
                        fails.append(f"{d}/{mode}: country {cc} vs {role} dE00 {de} < {DE00_COUNTRY_ROLE}")
        for i, a in enumerate(COUNTRIES):
            for b in COUNTRIES[i + 1:]:
                de = round(de2000(country[a], country[b]), 1)
                cinfo["pairs"][f"{a}-{b}"] = de
                if de2000(country[a], country[b]) < DE00_COUNTRY_PAIR:
                    fails.append(f"{d}/{mode}: countries {a}-{b} dE00 {de} < {DE00_COUNTRY_PAIR}")
        # The same pairs through each kind of dichromacy. Reported, and a warning below the floor
        # rather than a failure: the country's name always travels with its colour.
        for kind in CVD:
            sim = {cc: simulate(country[cc], kind) for cc in COUNTRIES}
            raw = {f"{a}-{b}": de2000(sim[a], sim[b]) for i, a in enumerate(COUNTRIES) for b in COUNTRIES[i + 1:]}
            pairs = {k: round(v, 1) for k, v in raw.items()}
            low = min(raw, key=raw.get)
            cinfo["cvd"][kind] = {"min": pairs[low], "pair": low, "pairs": pairs}
            if raw[low] < DE00_COUNTRY_PAIR:
                warns.append(f"{d}/{mode}: {kind} sees countries {low} at dE00 {pairs[low]} < {DE00_COUNTRY_PAIR}")
        info["country"] = cinfo
    for r in rows:
        if not r["ok"]:
            fails.append(f"{d}/{mode}: {r['fg']} on {min(r['vs'], key=r['vs'].get)} = {r['min']} < {r['need']} ({r['what']})")
    return rows, info


def measure(spec):
    out, fails, warns, ref_fails = {}, [], [], []
    for d, s in spec.items():
        if d.startswith("_"):
            continue
        out[d] = {k: v for k, v in s.items() if k not in ("light", "dark")}
        out[d]["modes"] = {}
        sink = ref_fails if s.get("reference") else fails
        for mode in ("light", "dark"):
            t = dict(s[mode])
            missing = [r for r in ROLES if r not in t]
            if missing:
                raise SystemExit(f"{d}/{mode}: missing roles {missing}")
            t["dangerSoft"] = mix(t["danger"], t["surface"], 0.10 if mode == "light" else 0.18)
            rows, info = measure_mode(d, mode, t, sink, warns)
            out[d]["modes"][mode] = {"tokens": t, "checks": rows, "info": info}
    return out, fails, warns, ref_fails


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("spec", help="palette JSON (see the module docstring)")
    ap.add_argument("--out", help="write the measured JSON here")
    args = ap.parse_args()
    out, fails, warns, ref_fails = measure(json.load(open(args.spec, encoding="utf-8")))
    if args.out:
        json.dump(out, open(args.out, "w", encoding="utf-8"), indent=1)
    for d, v in out.items():
        for mode, m in v["modes"].items():
            worst_text = min(r["min"] for r in m["checks"] if r["fg"] in ("text", "text2"))
            line = (f"{d} {v['name']} / {mode}: {sum(r['ok'] for r in m['checks'])}/{len(m['checks'])} pairs pass, "
                    f"weakest text {worst_text}:1, accent vs danger dE00 {m['info']['accentVsDangerDE00']}")
            c = m["info"].get("country")
            if c:
                line += (f", countries: graphic >= {min(min(g.values()) for g in c['graphic'].values())}:1, "
                         f"pairs >= dE00 {min(c['pairs'].values())}, "
                         + ", ".join(f"{k} >= {c['cvd'][k]['min']}" for k in CVD))
            print(line)
    if ref_fails:
        print("REFERENCE (not counted)\n  " + "\n  ".join(ref_fails))
    if warns:
        print("WARN\n  " + "\n  ".join(warns))
    print("FAIL\n  " + "\n  ".join(fails) if fails else "PASS — every pair clears its floor")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
