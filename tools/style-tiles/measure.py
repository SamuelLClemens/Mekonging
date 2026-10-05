#!/usr/bin/env python3
"""Measure candidate palettes for the style tiles: WCAG 2.x contrast for every role pair the tiles
use, and CIEDE2000 between accent and danger, which asks whether a destructive control can be told
apart from a primary one.

    python3 tools/style-tiles/measure.py tools/style-tiles/round1.json --out <scratchpad>/palettes.json

Input: {"<id>": {"name": str, "secondaryName": str, "light": {role: hex}, "dark": {role: hex}}}.
Keys starting with "_" are notes and are skipped. Roles: bg surface surface2 line borderStrong text
text2 accent onAccent accentSoft secondary star danger onDanger. The "Watch out" tint (dangerSoft) is
derived. The floors are those of VISUAL_DIRECTION_PROMPT.md section 4.1. Exit status 1 on any failure.
"""
import argparse, json, math, sys

ROLES = ["bg", "surface", "surface2", "line", "borderStrong", "text", "text2", "accent", "onAccent",
         "accentSoft", "secondary", "star", "danger", "onDanger"]

# (foreground role, background roles it can sit on, threshold, what the pair is)
CHECKS = [
    ("text", ("surface", "bg", "surface2"), 4.5, "body text"),
    ("text", ("surface",), 7.0, "body text in sunlight, on its main surface"),
    ("text2", ("surface", "bg", "surface2"), 4.5, "secondary text"),
    ("accent", ("surface", "bg"), 4.5, "accent as text (tertiary buttons, active tab label)"),
    ("onAccent", ("accent",), 4.5, "label on the primary button"),
    ("accent", ("accentSoft",), 3.0, "active tab icon on its indicator"),
    ("secondary", ("surface", "bg"), 4.5, "secondary hue as text"),
    ("star", ("surface", "bg"), 3.0, "rating star (graphic)"),
    ("danger", ("surface", "bg"), 4.5, "danger as text or outline"),
    ("onDanger", ("danger",), 4.5, "label on a danger fill (SOS)"),
    ("borderStrong", ("surface", "bg", "surface2"), 3.0, "input, chip and secondary-button boundary"),
    ("text", ("dangerSoft",), 4.5, "Watch-out text on its tint"),
    ("danger", ("dangerSoft",), 3.0, "Watch-out icon on its tint"),
]
DE00_FLOOR = 15.0   # accent against danger; round 1 measured 9.1 for a pair that read alike


def rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    r, g, b = (lin(v) for v in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def mix(a, b, t):
    """t of colour a over colour b, in 8-bit sRGB."""
    return "#" + "".join(f"{round(x * t + y * (1 - t)):02X}" for x, y in zip(rgb(a), rgb(b)))


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


def measure(spec):
    out, fails = {}, []
    for d, s in spec.items():
        if d.startswith("_"):
            continue
        out[d] = {"name": s["name"], "secondaryName": s.get("secondaryName", "Secondary"), "modes": {}}
        for mode in ("light", "dark"):
            t = dict(s[mode])
            missing = [r for r in ROLES if r not in t]
            if missing:
                raise SystemExit(f"{d}/{mode}: missing roles {missing}")
            t["dangerSoft"] = mix(t["danger"], t["surface"], 0.10 if mode == "light" else 0.18)
            rows = []
            for fg, bgs, need, what in CHECKS:
                vals = {bg: round(contrast(t[fg], t[bg]), 2) for bg in bgs}
                worst = min(vals.values())
                rows.append({"fg": fg, "vs": vals, "min": worst, "need": need, "ok": worst >= need, "what": what})
                if worst < need:
                    fails.append(f"{d}/{mode}: {fg} on {min(vals, key=vals.get)} = {worst} < {need} ({what})")
            de = round(de2000(t["accent"], t["danger"]), 1)
            if de < DE00_FLOOR:
                fails.append(f"{d}/{mode}: accent vs danger dE00 {de} < {DE00_FLOOR}")
            info = {"accentVsDangerDE00": de, "lineOnSurface": round(contrast(t["line"], t["surface"]), 2),
                    "surfaceOnBg": round(contrast(t["surface"], t["bg"]), 2)}
            out[d]["modes"][mode] = {"tokens": t, "checks": rows, "info": info}
    return out, fails


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("spec", help="directions JSON (see the module docstring)")
    ap.add_argument("--out", help="write the measured JSON here")
    args = ap.parse_args()
    out, fails = measure(json.load(open(args.spec, encoding="utf-8")))
    if args.out:
        json.dump(out, open(args.out, "w", encoding="utf-8"), indent=1)
    for d, v in out.items():
        for mode, m in v["modes"].items():
            worst_text = min(r["min"] for r in m["checks"] if r["fg"] in ("text", "text2"))
            print(f"{d} {v['name']} / {mode}: {sum(r['ok'] for r in m['checks'])}/{len(m['checks'])} pairs pass, "
                  f"weakest text {worst_text}:1, accent vs danger dE00 {m['info']['accentVsDangerDE00']}")
    print("FAIL\n  " + "\n  ".join(fails) if fails else "PASS — every pair clears its floor")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
