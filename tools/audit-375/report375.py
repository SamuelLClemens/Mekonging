#!/usr/bin/env python3
"""Turn audit375.py results into the tables of docs/AUDIT_375.md.

    python3 tools/audit-375/report375.py RUN_DIR [--baseline DIR] [--brief] [--markdown OUT.md]

RUN_DIR holds run-light.jsonl, run-dark.jsonl, variant-light.jsonl, variant-dark.jsonl, routes.txt,
routes-derived.json, redirects.json and meta.json. tools/audit-375/run.py writes them; the 2026-10-19 audit
is in tools/audit-375/baseline-2026-10-19/. Prints the setup, the headline table, the routes by severity,
the findings that repeat across routes, the map credits panel, one table per route with both themes, and
the legacy Market routes. --baseline adds the earlier run's headline numbers beside this one. --brief stops
after the severity table.

Only a route measured visible and complete in BOTH themes is in a table. A route that failed, or stayed
document.hidden, is listed under "Incomplete" and never counted: a hidden page undercounts controls.

The prose of docs/AUDIT_375.md (what the numbers say, method and limits, fix slices) is written by hand and
is not generated.
"""
import argparse
import collections
import json
import os
import re
import sys

TAP = 44
INFO_FLAGS = ("very short", "NEVER SETTLED", "NO TOPBAR", "ZERO-SIZE")


def load_jsonl(path):
    rows = []
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            if line.strip():
                rows.append(json.loads(line))
    return rows


def short(s, n=70):
    s = re.sub(r"\s+", " ", s or "").strip()
    return s if len(s) <= n else s[: n - 1] + "…"


def dash(s):
    """No em dashes in Markdown (PR 148): text quoted from the app keeps its words and loses the dash."""
    return str(s).replace(" " + chr(0x2014) + " ", ", ")


def esc(s):
    t = dash(s)
    t = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[email]", t)             # contact addresses from the app's data are not for this repo
    t = re.sub(r"\+?\d[\d ()-]{7,}\d", "[number]", t)                  # nor phone numbers
    return t.replace("|", "\\|").replace("\n", " ")


def nsel(x):
    """drop generated ids (#fld-12) so the same control kind merges"""
    return re.sub(r"#([A-Za-z_]+(?:-[A-Za-z_]+)*)-\d+", r"#\1-N", x or "")


def is_network(e):
    t = e.get("text", "")
    return t.startswith("Failed to load resource") or "net::ERR" in t or e.get("kind", "").startswith("log:network")


def analyse(rec):
    """-> dict of findings for one route load."""
    out = {"ok": rec.get("ok"), "fatal": rec.get("fatal")}
    m = rec.get("measure") or {}
    out["title"] = m.get("title")
    out["chars"] = m.get("chars")
    out["boot_hash"] = (rec.get("boot") or {}).get("hash")
    out["settled"] = (rec.get("settle") or {}).get("quiet")
    out["dataset"] = m.get("dataset")
    out["viewport"] = m.get("viewport")
    ofs = [m.get("overflowAsLoaded") or {}, m.get("overflowFoldsOpen") or {}]
    out["over_right"] = max([o.get("pastRight", 0) or 0 for o in ofs] + [o.get("docOver", 0) or 0 for o in ofs])
    out["over_left"] = max([o.get("pastLeft", 0) or 0 for o in ofs])
    out["over_culprits"] = (ofs[1].get("culprits") or []) or (ofs[0].get("culprits") or [])
    c = m.get("controls") or {}
    out["controls_total"] = c.get("total", 0)
    out["controls_checked"] = c.get("checked", 0)
    out["controls_skipped"] = c.get("skipped", {})
    out["pin_overlap"] = c.get("pinOverlap", 0)
    out["zero"] = c.get("zero", 0)
    out["capped"] = c.get("capped", False)
    small = c.get("small", [])
    for s_ in small:
        s_["sel"] = nsel(s_["sel"])
    shell = [s for s in small if s["shell"]]
    body = [s for s in small if not s["shell"]]
    out["small_shell"] = shell
    groups = collections.OrderedDict()
    for s in body:
        g = groups.setdefault(s["sel"], {"sel": s["sel"], "n": 0, "lt24": 0, "min_hit": [999, 999], "min_vis": [999, 999], "labels": []})
        g["n"] += 1
        g["lt24"] += 1 if min(s["hit"]) < 24 else 0
        g["min_hit"] = [min(g["min_hit"][0], s["hit"][0]), min(g["min_hit"][1], s["hit"][1])]
        g["min_vis"] = [min(g["min_vis"][0], s["vis"][0]), min(g["min_vis"][1], s["vis"][1])]
        if len(g["labels"]) < 2 and s["label"] and s["label"] not in g["labels"]:
            g["labels"].append(s["label"])
    out["small_groups"] = list(groups.values())
    out["small_body_n"] = len(body)
    out["small_body_lt24"] = sum(1 for s in body if min(s["hit"]) < 24)
    out["covered"] = c.get("covered", [])
    for c_ in out["covered"]:
        c_["sel"] = nsel(c_["sel"])
        c_["by"] = nsel(c_["by"])
    ct = m.get("contrast") or {}
    fails = ct.get("fails", [])
    for f_ in fails:
        f_["sel"] = nsel(f_["sel"])
    cg = collections.OrderedDict()
    for f in fails:
        k = (f["sel"], f["fg"], f["bg"], f["kind"])
        g = cg.setdefault(k, dict(f, n=0))
        g["n"] += 1
    out["contrast"] = list(cg.values())
    out["contrast_checked"] = ct.get("checked", 0)
    out["contrast_unmeasured"] = ct.get("unmeasured", 0)
    out["contrast_unmeasured_list"] = ct.get("unmeasuredList", [])
    errs = []
    for key in ("errorsBoot", "errorsMeasure", "errorsSweep"):
        errs += rec.get(key, [])
    seen, uniq = set(), []
    for e in errs:
        k = (e["text"][:100], e.get("url", ""))
        if k not in seen:
            seen.add(k)
            uniq.append(e)
    out["errors"] = uniq
    out["errors_code"] = [e for e in uniq if not is_network(e)]
    out["errors_net"] = [e for e in uniq if is_network(e)]
    sw = (rec.get("sweep") or {}).get("broken") or []
    flags = sw[0]["problem"] if sw else []
    out["sweep_flags"] = [f for f in flags]
    out["sweep_zero_artefact"] = [f for f in flags if "ZERO-SIZE" in f]
    out["sweep_info"] = [f for f in flags if any(i in f for i in INFO_FLAGS) or "DISABLED ON ARRIVAL" in f]
    out["sweep_real"] = [f for f in flags if f not in out["sweep_info"] and not f.startswith("TypeError") and "Error" not in f[:12]]
    out["intermittent"] = rec.get("intermittent", "")
    out["map_credits"] = m.get("mapCredits") or []
    return out


def score(a):
    s = 0
    s += (100 + a["over_right"] + a["over_left"]) if (a["over_right"] > 0 or a["over_left"] > 0) else 0
    s += 50 * len(a["errors_code"]) + 10 * len(a["errors_net"])
    s += 40 * len(a["covered"])
    for mc in a["map_credits"]:
        if (mc["asLoaded"].get("open") and mc["asLoaded"].get("areaPct", 0) >= 5) or mc["whenOpened"].get("pinsUnder"):
            s += 40
    s += 10 * len(a["contrast"])
    s += 2 * a["small_body_lt24"] + (a["small_body_n"] - a["small_body_lt24"])
    s += 20 * len(a["sweep_real"])
    if not a["ok"]:
        s += 500
    return s


def kind_of(sel):
    if "maplibregl" in sel and ("marker" in sel or "mk-" in sel):
        return "map pin"
    if "maplibregl" in sel:
        return "map control (MapLibre)"
    last = sel.split(" > ")[-1]
    if last.startswith("summary") or "> summary" in sel:
        return "fold or hint summary"
    if last.startswith("input") or last.startswith("select") or last.startswith("textarea"):
        return "form field, checkbox or radio"
    if "u-tap" in last:
        return "inline unit toggle"
    if last.startswith("a"):
        return "standalone link"
    if "chip" in last or "tog" in last or "pill" in last:
        return "chip or toggle"
    return "button"


def merge(rows_l, rows_d, keyf):
    d = collections.OrderedDict()
    for x in rows_l:
        d.setdefault(keyf(x), [None, None])[0] = x
    for x in rows_d:
        d.setdefault(keyf(x), [None, None])[1] = x
    return [(k, v[0], v[1]) for k, v in d.items()]


class Run:
    """The records of one run folder, analysed."""

    def __init__(self, run_dir):
        self.dir = run_dir
        p = lambda n: os.path.join(run_dir, n)  # noqa: E731
        self.meta = json.load(open(p("meta.json"), encoding="utf-8")) if os.path.exists(p("meta.json")) else {}
        self.routes = [r.strip() for r in open(p("routes.txt"), encoding="utf-8") if r.strip()]
        derived = {}
        if os.path.exists(p("routes-derived.json")):
            derived = {x["hash"]: x["from"] for x in json.load(open(p("routes-derived.json"), encoding="utf-8"))}
        for r in self.routes:
            derived.setdefault(r, "Market" if r.startswith("#market") else "")
        self.derived = derived
        self.redirects = []
        if os.path.exists(p("redirects.json")):
            try:
                self.redirects = json.load(open(p("redirects.json"), encoding="utf-8"))
            except ValueError:
                self.redirects = []          # an interrupted run left it empty: the table is simply absent
        self.A, self.V, self.bad = {}, {}, {}
        self.hidden_retries = 0
        for theme in ("light", "dark"):
            for rec in load_jsonl(p("run-%s.jsonl" % theme)):
                self._take(self.A, (rec["route"], theme), rec)
        for theme in ("light", "dark"):
            for rec in load_jsonl(p("variant-%s.jsonl" % theme)):
                self._take(self.V, (rec["route"], theme, rec.get("variant", "")), rec)
        self.done = [r for r in self.routes if (r, "light") in self.A and (r, "dark") in self.A]
        self.missing = [r for r in self.routes if r not in self.done]

    def _take(self, store, key, rec):
        """The last record of a route and theme wins; one that was refused or failed is never kept as a result."""
        self.hidden_retries += rec.get("hiddenRetries", 0) or 0
        if rec.get("ok") and not rec.get("hidden"):
            store[key] = analyse(rec)
            self.bad.pop(key, None)
        elif key not in store:
            self.bad[key] = "hidden after 3 tries" if rec.get("hidden") else (rec.get("fatal") or "failed")


def numbers(run):
    """The headline numbers of a run, as plain values."""
    A, V, done = run.A, run.V, run.done
    both = lambda f: sorted({r for r in done if any(f(A[(r, th)]) for th in ("light", "dark"))})  # noqa: E731
    xc_sel = {f["sel"] for r in done for th in ("light", "dark") for f in A[(r, th)]["contrast"]}
    cred = {r for r in done for th in ("light", "dark") for mc in A[(r, th)]["map_credits"] if mc["whenOpened"].get("pinsUnder")}
    for th in ("light", "dark"):
        v = V.get(("#journey", th, "journey-2-stops"))
        if v and any(mc["whenOpened"].get("pinsUnder") for mc in v["map_credits"]):
            cred.add("#journey (2 stops)")
    tl = [A[(r, "light")] for r in done]
    td = [A[(r, "dark")] for r in done]
    return {
        "routes": len(done),
        "overflow": both(lambda a: a["over_right"] > 0 or a["over_left"] > 0),
        "errors_code": both(lambda a: a["errors_code"]),
        "errors_net": both(lambda a: a["errors_net"]),
        "covered": both(lambda a: a["covered"]),
        "contrast": both(lambda a: a["contrast"]),
        "contrast_light": len({r for r in done if A[(r, "light")]["contrast"]}),
        "contrast_dark": len({r for r in done if A[(r, "dark")]["contrast"]}),
        "contrast_selectors": len(xc_sel),
        "small": both(lambda a: a["small_body_n"]),
        "small_light": sum(a["small_body_n"] for a in tl),
        "small_dark": sum(a["small_body_n"] for a in td),
        "small_lt24": sum(a["small_body_lt24"] for a in tl),
        "credits": sorted(cred),
        "sweep": both(lambda a: a["sweep_real"]),
        "sweep_zero": both(lambda a: a["sweep_zero_artefact"]),
    }


def headline_lines(n, base=None):
    """The headline table; with `base` (numbers of an earlier run) a Before column is added."""
    def row(measure, count, detail, before=None):
        if base is None:
            return "| %s | %d | %s |" % (measure, count, detail)
        return "| %s | %d | %s | %s |" % (measure, count, ("%d" % before) if before is not None else "n/a", detail)

    over = ", ".join(n["overflow"]) if n["overflow"] else "none: no unclipped box extends past either edge in either theme"
    errc = ", ".join(n["errors_code"]) if n["errors_code"] else "none"
    errn = (", ".join(n["errors_net"][:12]) + (" …" if len(n["errors_net"]) > 12 else "")) if n["errors_net"] else "none"
    cov = ", ".join(n["covered"]) if n["covered"] else "none; the credits panel is covered separately below"
    b = (lambda k: len(base[k])) if base else (lambda k: None)
    out = []
    if base is None:
        out += ["| Measure | Routes affected (of %d) | Detail |" % n["routes"], "| --- | --- | --- |"]
    else:
        out += ["| Measure | Routes affected (of %d) | Before (of %d) | Detail |" % (n["routes"], base["routes"]), "| --- | --- | --- | --- |"]
    out.append(row("Horizontal overflow past the 375 px edge", len(n["overflow"]), over, b("overflow") if base else None))
    out.append(row("Console errors or exceptions from the app", len(n["errors_code"]), errc, b("errors_code") if base else None))
    out.append(row("Network errors (failed requests)", len(n["errors_net"]), errn, b("errors_net") if base else None))
    out.append(row("Controls covered by an overlay", len(n["covered"]), cov, b("covered") if base else None))
    out.append(row("Contrast failures (WCAG AA, rendered colours)", len(n["contrast"]), "%d distinct selectors" % n["contrast_selectors"], b("contrast") if base else None))
    out.append(row("Controls under 44 x 44 px in the screen body", len(n["small"]), "%d controls in light, %d in dark, summed over routes" % (n["small_light"], n["small_dark"]), b("small") if base else None))
    out.append(row("Map credits panel covering a pin when opened", len(n["credits"]), ", ".join(n["credits"]) if n["credits"] else "none", b("credits") if base else None))
    out.append(row("`route-sweep.js` flags other than the zero-size artefact", len(n["sweep"]), ", ".join(n["sweep"]) if n["sweep"] else "none", b("sweep") if base else None))

    def also(m):
        return "contrast fails on %d routes in light and %d in dark; %d of the %d controls under 44 px in the light pass are under 24 px" % (
            m["contrast_light"], m["contrast_dark"], m["small_lt24"], m["small_light"])

    out.append("")
    if base is None:
        out.append("Also: %s." % also(n))
    else:
        out.append("Now (%d routes): %s." % (n["routes"], also(n)))
        out.append("")
        out.append("Before (%d routes): %s." % (base["routes"], also(base)))
        added = sorted(set(n.get("route_list", [])) - set(base.get("route_list", [])))
        gone = sorted(set(base.get("route_list", [])) - set(n.get("route_list", [])))
        if added:
            out.append("")
            out.append("Routes measured now and not before (%d): %s." % (len(added), ", ".join(added)))
        if gone:
            out.append("")
            out.append("Routes measured before and not now (%d): %s." % (len(gone), ", ".join(gone)))
    return out


def setup_lines(run):
    m = run.meta
    n = len(run.done)
    out = ["| Item | Value |", "| --- | --- |"]
    out.append("| Date | %s |" % m.get("date", "n/a"))
    out.append("| Build audited | %s |" % m.get("build", "n/a"))
    out.append("| Browser | %s |" % m.get("browser", "n/a"))
    out.append("| Viewport | 375 x 812 CSS px, device scale factor 2, mobile emulation with touch. `document.hidden` is false on every recorded route; a load that reported hidden was refused and measured again (%d refusals in this run) |" % run.hidden_retries)
    out.append("| Skin | Mekong Retro (`retro`) seeded through the live store, once with `theme: light` and once with `theme: dark`, with `prefers-color-scheme` emulated to match |")
    out.append("| Server | %s |" % m.get("server", "n/a"))
    out.append("| Routes | %d%s |" % (n, (": " + m["routes_note"]) if m.get("routes_note") else ""))
    out.append("| Loads | %d route loads (%d routes x 2 themes), each a cold deep link (`/?q=<n>#route`) so every route boots as a shared link would |" % (n * 2, n))
    out.append("| State | A fresh profile: every screen is in its empty state. One extra pass seeds two trip stops so the journey map renders |")
    return out


def build(run_dir, baseline_dir=None):
    """The audit tables of a run folder -> {'setup', 'headline', 'severity', 'shared', 'routes', 'redirects', 'numbers', 'missing'}."""
    run = Run(run_dir)
    A, V, done = run.A, run.V, run.done
    num = numbers(run)
    num["route_list"] = list(done)
    base_num = None
    if baseline_dir:
        brun = Run(baseline_dir)
        base_num = numbers(brun)
        base_num["route_list"] = list(brun.done)

    def sev(r):
        return max(score(A[(r, "light")]), score(A[(r, "dark")]))

    order = sorted(done, key=lambda r: (-sev(r), r))

    # shell findings: topbar controls
    shell_agg = collections.OrderedDict()
    for r in done:
        for th in ("light", "dark"):
            for s in A[(r, th)]["small_shell"]:
                k = (s["label"][:30], s["sel"])
                g = shell_agg.setdefault(k, {"label": s["label"], "sel": s["sel"], "vis": s["vis"], "hit": s["hit"], "n": 0, "min_hit": list(s["hit"]), "routes": set()})
                g["n"] += 1
                g["routes"].add(r)
                g["min_hit"] = [min(g["min_hit"][0], s["hit"][0]), min(g["min_hit"][1], s["hit"][1])]

    # body selectors on five or more routes
    xc = collections.OrderedDict()
    for r in done:
        for th in ("light", "dark"):
            for g in A[(r, th)]["small_groups"]:
                x = xc.setdefault(g["sel"], {"sel": g["sel"], "routes": set(), "controls": 0, "min_hit": [999, 999], "min_vis": [999, 999], "label": (g["labels"] or [""])[0]})
                x["routes"].add(r)
                if th == "light":
                    x["controls"] += g["n"]
                x["min_hit"] = [min(x["min_hit"][0], g["min_hit"][0]), min(x["min_hit"][1], g["min_hit"][1])]
                x["min_vis"] = [min(x["min_vis"][0], g["min_vis"][0]), min(x["min_vis"][1], g["min_vis"][1])]

    xc_contrast = collections.OrderedDict()
    for r in done:
        for th in ("light", "dark"):
            for f in A[(r, th)]["contrast"]:
                k = (f["sel"], th)
                x = xc_contrast.setdefault(k, {"sel": f["sel"], "theme": th, "routes": set(), "n": 0, "fg": f["fg"], "bg": f["bg"], "ratio": f["ratio"], "need": f["need"], "size": f["size"], "kind": f["kind"], "text": f["text"]})
                x["routes"].add(r)
                x["n"] += f["n"]
                if f["ratio"] < x["ratio"]:
                    x.update(fg=f["fg"], bg=f["bg"], ratio=f["ratio"], text=f["text"])

    kinds = collections.OrderedDict()
    for r in done:
        for g in A[(r, "light")]["small_groups"]:
            k = kind_of(g["sel"])
            x = kinds.setdefault(k, {"n": 0, "lt24": 0, "routes": set(), "ex": g["sel"], "hits": collections.Counter()})
            x["n"] += g["n"]
            x["lt24"] += g["lt24"]
            x["routes"].add(r)
            x["hits"][(g["min_hit"][0], g["min_hit"][1])] += g["n"]

    sections = {"numbers": num, "missing": run.missing, "failures": dict(("%s %s" % (k[0], k[1]), v) for k, v in run.bad.items())}
    w = []

    # ---- setup, headline
    sections["setup"] = setup_lines(run)
    lines = []
    if run.missing or run.bad:
        lines.append("**Incomplete:** %d routes have no visible, complete result in both themes: %s." % (len(run.missing), ", ".join(run.missing) or "none (only a variant failed)"))
        for k, why in sorted(run.bad.items(), key=lambda kv: str(kv[0])):
            lines.append("")
            lines.append("- %s %s: %s" % (k[0], " / ".join(str(x) for x in k[1:] if x), why))
        lines.append("")
    lines += headline_lines(num, base_num)
    sections["headline"] = lines

    # ---- severity table
    w = ["Sorted by the larger of the light and dark scores. The score is a triage aid, not a measurement: horizontal overflow 100 + px, a console exception 50, a failed request 10, a control covered by an overlay or a map credits panel that covers a pin or 5% or more of the map 40, a contrast failure 10, a `route-sweep.js` flag 20, a control under 24 px in either axis 2, any other control under 44 px 1.", "",
         "| Route | Title | Overflow px (L / D) | Controls under 44 (L / D) | of which under 24 | Contrast fails (L / D) | Covered (L / D) | Errors code + network (L / D) | Score L / D |",
         "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    ov = lambda a: max(a["over_right"], a["over_left"])  # noqa: E731
    cov = lambda a: len(a["covered"]) + sum(1 for mc in a["map_credits"] if mc["whenOpened"].get("pinsUnder"))  # noqa: E731
    for r in order:
        L, D = A[(r, "light")], A[(r, "dark")]
        w.append("| `%s` | %s | %s / %s | %d / %d | %d / %d | %d / %d | %d / %d | %d+%d / %d+%d | %d / %d |" % (
            r, esc(short(L["title"] or "", 28)), ov(L), ov(D), L["small_body_n"], D["small_body_n"], L["small_body_lt24"], D["small_body_lt24"],
            len(L["contrast"]), len(D["contrast"]), cov(L), cov(D), len(L["errors_code"]), len(L["errors_net"]), len(D["errors_code"]), len(D["errors_net"]), score(L), score(D)))
    sections["severity"] = w

    # ---- findings that repeat
    w = ["### App shell: topbar controls (on every route that has a topbar)", "",
         "Measured on every route load. The hit area is the visual box plus whatever the control's own `::before` adds, found by `elementFromPoint` probing from the centre, so it is what a thumb can actually hit.", "",
         "| Control | Selector | Visual w x h px | Hit area w x h px | Seen on routes |", "| --- | --- | --- | --- | --- |"]
    for k, g in sorted(shell_agg.items(), key=lambda kv: kv[1]["min_hit"][0]):
        w.append("| %s | `%s` | %s x %s | %s x %s | %d |" % (esc(short(g["label"], 34)), esc(g["sel"]), g["vis"][0], g["vis"][1], g["min_hit"][0], g["min_hit"][1], len(g["routes"])))
    w += ["", "### Screen-body selectors under 44 x 44 px on five or more routes", "",
          "| Selector | Example label | Visual min w x h | Hit area min w x h | Routes | Controls (light pass, summed over routes) |", "| --- | --- | --- | --- | --- | --- |"]
    rows = [x for x in xc.values() if len(x["routes"]) >= 5]
    rows.sort(key=lambda x: (-len(x["routes"]), -x["controls"]))
    for x in rows:
        w.append("| `%s` | %s | %s x %s | %s x %s | %d | %d |" % (esc(x["sel"]), esc(short(x["label"], 30)), x["min_vis"][0], x["min_vis"][1], x["min_hit"][0], x["min_hit"][1], len(x["routes"]), x["controls"]))
    w += ["", "### Screen-body controls under 44 px, by kind", "",
          "Counted in the light pass (geometry does not change with theme), every control once, summed over routes. Under 24 px means either axis of the effective hit area is below 24 px, the WCAG 2.2 AA minimum.", "",
          "| Kind | Controls | Under 24 px | Routes | Most common hit area w x h | Example selector |", "| --- | --- | --- | --- | --- | --- |"]
    for k, x in sorted(kinds.items(), key=lambda kv: -kv[1]["n"]):
        w.append("| %s | %d | %s | %d | %s | `%s` |" % (k, x["n"], x["lt24"], len(x["routes"]), "%s x %s" % x["hits"].most_common(1)[0][0], esc(short(x["ex"], 70))))
    w += ["", "### Contrast failures that repeat or are widest", "",
          "Rendered foreground against the effective backdrop (opacity, alpha and gradient stops composited). 4.5:1 for normal text, 3:1 for text of 24 px, or 18.66 px and bold.", "",
          "| Selector | Theme | Sample text | Foreground | Backdrop | Worst ratio | Needs | Font px | Routes | Elements |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for x in sorted(xc_contrast.values(), key=lambda x: (-len(x["routes"]), x["ratio"])):
        if len(x["routes"]) < 2 and x["ratio"] >= 3.0:
            continue
        w.append("| `%s` | %s | %s | `%s` | `%s` | %s | %s | %s | %d | %d |" % (esc(x["sel"]), x["theme"], esc(short(x["text"], 26)), x["fg"], x["bg"], x["ratio"], x["need"], x["size"], len(x["routes"]), x["n"]))
    w += ["", "### Map credits panel (the known overlay case)", "",
          "The MapLibre attribution plate is the one overlay in the app that covers other controls. Its state is read as loaded (the `<details>` is not forced open), then with the (i) opened. `Open as loaded` is the `details` open attribute at first paint.", "",
          "| Route and state | Theme | Map px | Panel px | Open as loaded | Share of map covered | Pins under the panel |", "| --- | --- | --- | --- | --- | --- | --- |"]
    cred_rows = []
    for r in ("#places", "#map", "#weather-th"):
        for th in ("light", "dark"):
            for mc in (A.get((r, th)) or {"map_credits": []})["map_credits"]:
                cred_rows.append((r, th, mc))
    for th in ("light", "dark"):
        v = V.get(("#journey", th, "journey-2-stops"))
        if v:
            for mc in v["map_credits"]:
                cred_rows.append(("#journey with 2 trip stops", th, mc))
    for r, th, mc in cred_rows:
        pins = ", ".join(mc["whenOpened"]["pinsUnder"]) or "none"
        w.append("| `%s` | %s | %d x %d | %d x %d | %s | %s%% | %s |" % (r, th, mc["map"][0], mc["map"][1], mc["asLoaded"]["w"], mc["asLoaded"]["h"], "yes" if (mc["asLoaded"]["open"] and mc["asLoaded"]["w"] > 0) else "no (plate 0 x 0)", mc["asLoaded"]["areaPct"], esc(pins)))
    w += ["", "`#journey` shows no map until the traveller has a stop, so its row comes from a separate profile with two trip stops (Bangkok, Chiang Mai)."]
    sections["shared"] = w

    # ---- per route
    def route_lines(r, L, D, heading, from_note):
        out = []
        o = out.append
        o("### %s" % heading)
        o("")
        note = []
        if from_note:
            note.append("from " + dash(from_note))
        note.append("%s controls in light, %s in dark" % (L["controls_total"], D["controls_total"]))
        if L["boot_hash"] and L["boot_hash"] != r:
            note.append("redirected to `%s`" % L["boot_hash"])
        if not L["settled"] or not D["settled"]:
            note.append("DOM still changing after 6 s in %s" % ("both themes" if not L["settled"] and not D["settled"] else ("light" if not L["settled"] else "dark")))
        if L["capped"] or D["capped"]:
            note.append("control scan capped at 1600")
        skipped = {}
        for a in (L, D):
            for k, v in a["controls_skipped"].items():
                skipped[k] = max(skipped.get(k, 0), v)
        skipped = {k: v for k, v in skipped.items() if k not in ("tiny", "canvas")}
        if skipped:
            note.append("not hit-tested: " + ", ".join("%d %s" % (v, k) for k, v in skipped.items()))
        o("_" + "; ".join(note) + "._")
        o("")
        o("| Type | Detail | Measured light | Measured dark |")
        o("| --- | --- | --- | --- |")
        n = 0
        if L["over_right"] > 0 or L["over_left"] > 0 or D["over_right"] > 0 or D["over_left"] > 0:
            cul = (L["over_culprits"] or D["over_culprits"])[:3]
            o("| Overflow | %s | %s px right, %s px left | %s px right, %s px left |" % (esc("; ".join("`%s` right edge %s" % (c["sel"], c["right"]) for c in cul)), L["over_right"], L["over_left"], D["over_right"], D["over_left"]))
            n += 1
        for k, a, b in merge(L["errors"], D["errors"], lambda e: (e["kind"].split(":")[0], e["text"][:90])):
            e = a or b
            extra = (" (" + (L["intermittent"] or D["intermittent"]) + ")") if (L["intermittent"] or D["intermittent"]) else ""
            o("| Console | %s: %s%s | %s | %s |" % (e["kind"], esc(short(e["text"].split("\n")[0] + (" " + e["text"].split("\n")[1].strip() if "\n" in e["text"] else ""), 150)), esc(extra), "yes" if a else "no", "yes" if b else "no"))
            n += 1
        for f in sorted(set(L["sweep_real"] + D["sweep_real"])):
            o("| route-sweep | %s | %s | %s |" % (esc(short(f, 120)), "flagged" if f in L["sweep_real"] else "ok", "flagged" if f in D["sweep_real"] else "ok"))
            n += 1
        for k, a, b in merge(L["covered"], D["covered"], lambda c: (c["sel"], c["label"])):
            c = a or b
            o("| Covered | `%s` \"%s\" under `%s` (%s) | %s | %s |" % (esc(short(c["sel"], 60)), esc(short(c["label"], 30)), esc(short(c["by"], 70)), c["byPos"], ("%d of %d points" % (a["blocked"], a["inView"])) if a else "no", ("%d of %d points" % (b["blocked"], b["inView"])) if b else "no"))
            n += 1
        for i, a in enumerate(L["map_credits"]):
            b = D["map_credits"][i] if i < len(D["map_credits"]) else None
            pa = ("; covers pins " + ", ".join(a["whenOpened"]["pinsUnder"])) if a["whenOpened"]["pinsUnder"] else ""
            pb = ("; covers pins " + ", ".join(b["whenOpened"]["pinsUnder"])) if b and b["whenOpened"]["pinsUnder"] else ""
            ca = "%s%% of map%s" % (a["asLoaded"]["areaPct"], pa)
            cb = ("%s%% of map%s" % (b["asLoaded"]["areaPct"], pb)) if b else "n/a"
            o("| Credits panel | map %d x %d px, plate %d x %d px, shown as loaded: %s | %s | %s |" % (a["map"][0], a["map"][1], a["asLoaded"]["w"], a["asLoaded"]["h"], "yes" if (a["asLoaded"]["open"] and a["asLoaded"]["w"] > 0) else "no", ca, "same" if cb == ca else cb))
            n += 1
        if L["pin_overlap"] or D["pin_overlap"]:
            o("| Map pins | pins under another pin at the default zoom | %d | %s |" % (L["pin_overlap"], "same" if D["pin_overlap"] == L["pin_overlap"] else D["pin_overlap"]))
            n += 1
        for k, a, b in merge(L["contrast"], D["contrast"], lambda f: (f["sel"], f["kind"])):
            f = a or b
            fm = lambda x: "%s:1 (%s on %s, needs %s, %spx)%s" % (x["ratio"], x["fg"], x["bg"], x["need"], x["size"], (" x%d" % x["n"]) if x["n"] > 1 else "")  # noqa: E731
            ca, cb = (fm(a) if a else "pass"), (fm(b) if b else "pass")
            o("| Contrast | `%s` %s \"%s\" | %s | %s |" % (esc(f["sel"]), f["kind"], esc(short(f["text"], 24)), ca, "same" if cb == ca else cb))
            n += 1
        for k, a, b in merge(L["small_groups"], D["small_groups"], lambda g: g["sel"]):
            g = a or b
            fm = lambda x: "%s x %s hit (%s x %s visual)%s" % (x["min_hit"][0], x["min_hit"][1], x["min_vis"][0], x["min_vis"][1], (" x%d" % x["n"]) if x["n"] > 1 else "")  # noqa: E731
            lab = (" \"%s\"" % esc(short(g["labels"][0], 28))) if g["labels"] else ""
            ua, ub = (fm(a) if a else "ok"), (fm(b) if b else "ok")
            o("| Under 44 | `%s`%s | %s | %s |" % (esc(short(g["sel"], 100)), lab, ua, "same" if ub == ua else ub))
            n += 1
        if L["contrast_unmeasured"] or D["contrast_unmeasured"]:
            o("| Contrast, not measured | text over a photo background | %d elements | %d elements |" % (L["contrast_unmeasured"], D["contrast_unmeasured"]))
            n += 1
        for f in sorted(set(L["sweep_info"] + D["sweep_info"])):
            if "ZERO-SIZE" in f:
                o("| route-sweep (artefact) | %s: these controls sit in closed `display: none` panels (the 10-day forecast's day rows), which have no box; `route-sweep.js` has not counted them since Q2 | flagged | flagged |" % esc(short(f, 80)))
            else:
                o("| route-sweep (info) | %s | %s | %s |" % (esc(short(f, 100)), "flagged" if f in L["sweep_info"] else "ok", "flagged" if f in D["sweep_info"] else "ok"))
            n += 1
        if not n:
            o("| none | no finding in either theme | clean | clean |")
        o("")
        return out

    w = ["One table per route, both themes, sorted by severity. Topbar controls are in the shell table above and are not repeated. The light value comes first and the dark value second; `same` means the dark value equals the light one, and `ok` or `pass` means that theme had no finding for the row. Under-44 rows give the effective hit area (`::before` included) and the visual box in brackets; `xN` is the number of controls with that selector.", ""]
    for r in order:
        L, D = A[(r, "light")], A[(r, "dark")]
        w.extend(route_lines(r, L, D, "`%s`: %s" % (r, esc(L["title"] or "")), run.derived.get(r, "")))
    for key in sorted({(k[0], k[2]) for k in V}):
        r, var = key
        if (r, "light", var) in V and (r, "dark", var) in V:
            w.extend(route_lines(r, V[(r, "light", var)], V[(r, "dark", var)], "`%s` with two trip stops (map rendered)" % r, "a separate profile with trip stops Bangkok and Chiang Mai"))
    sections["routes"] = w

    # ---- legacy Market routes
    w = ["`js/market-routes.js` rewrites old board hashes. Each was loaded cold and the final hash and the pressed chips were read.", "",
         "| Legacy hash | Lands on | Topbar | Chips pressed |", "| --- | --- | --- | --- |"]
    for x in run.redirects:
        w.append("| `%s` | `%s` | %s | %s |" % (x["from"], x["to"], esc(x["title"]), esc(", ".join(x["pressed"]))))
    multi = [x for x in run.redirects if len(x["pressed"]) > 1]
    if multi:
        w += ["", "More than one chip has `aria-pressed=true` on: %s." % ", ".join("`%s` (%s)" % (x["from"], ", ".join(x["pressed"])) for x in multi)]
    sections["redirects"] = w
    return sections


def render(sec, brief=False):
    """Sections -> Markdown lines."""
    out = ["## Setup", ""] + sec["setup"] + ["", "## Headline numbers", ""] + sec["headline"]
    out += ["", "## Routes by severity", ""] + sec["severity"]
    if not brief:
        out += ["", "## Findings that repeat across routes", ""] + sec["shared"]
        out += ["", "## Per-route results", ""] + sec["routes"]
        out += ["## Legacy Market routes", ""] + sec["redirects"]
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("run_dir")
    ap.add_argument("--baseline", default="", help="an earlier run folder: its headline numbers go beside this run's")
    ap.add_argument("--brief", action="store_true", help="stop after the routes-by-severity table")
    ap.add_argument("--markdown", default="", help="also write the tables to this file")
    a = ap.parse_args()
    sec = build(a.run_dir, a.baseline or None)
    lines = render(sec, a.brief)
    print("\n".join(lines))
    if a.markdown:
        with open(a.markdown, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")
    return 0 if not sec["missing"] and not sec["failures"] else 1


if __name__ == "__main__":
    sys.exit(main())
