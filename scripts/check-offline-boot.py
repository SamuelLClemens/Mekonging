#!/usr/bin/env python3
"""Every module on the eager launch path must be precached, or the app cannot boot offline.

WHY THIS EXISTS. On 2026-09-20 the app was found to be completely broken offline: with no
network it rendered "Loading your companion…" and nothing else — no map, no screens. Three
modules (js/offline-pack.js, js/data/place-months.js, js/data/month-verdict.js) were imported
eagerly by main.js but absent from sw.js's PRECACHE list. Offline they returned 504, module
evaluation stopped there, and the whole app died.

It was invisible because every ONLINE load works perfectly, and because the twelve existing
guards each check one side of this: check-preloads.py keeps index.html's modulepreload tags in
step with the eager import graph, and nothing at all compared that graph against PRECACHE.

WHAT IT CHECKS. index.html's modulepreload list is generated from the real eager import graph
(see check-preloads.py), so it is the authoritative statement of "needed before first paint".
Every entry must therefore also appear in sw.js's PRECACHE. The check is deliberately one-way:
PRECACHE legitimately holds far more than the launch path (emergency data, all 29 UI-string
dictionaries, per-country place files), and warming those on idle is the point.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def strip_comments(text):
    # Strip // comments BEFORE extracting strings: an apostrophe inside a comment
    # ("hospital's") otherwise opens a phantom string and swallows real entries.
    return "\n".join(re.sub(r"//.*$", "", ln) for ln in text.splitlines())


def precache_entries():
    src = open(os.path.join(ROOT, "sw.js"), encoding="utf-8").read()
    m = re.search(r"PRECACHE\s*=\s*\[(.*?)\]", src, re.S)
    if not m:
        print("FAIL — could not find the PRECACHE array in sw.js")
        sys.exit(1)
    block = strip_comments(m.group(1))
    pairs = re.findall(r"'([^']+)'|\"([^\"]+)\"", block)
    return {a or b for a, b in pairs}


def preloaded_modules():
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    return re.findall(
        r'<link[^>]+rel=["\']modulepreload["\'][^>]+href=["\']([^"\']+)["\']', html)


def main():
    pre = precache_entries()
    eager = preloaded_modules()

    missing = [m for m in eager if m.lstrip("./") not in pre]
    absent = [m for m in eager if not os.path.exists(os.path.join(ROOT, m.lstrip("./")))]

    print("eager modules (modulepreload): %d" % len(eager))
    print("PRECACHE entries:              %d" % len(pre))

    if absent:
        print("\nFAIL — preloaded files that do not exist on disk:")
        for m in absent:
            print("   ", m)

    if missing:
        print("\nFAIL — on the eager launch path but NOT precached.")
        print("Offline these return 504 and module evaluation stops, so the app never boots:")
        for m in missing:
            print("   ", m)
        print("\nAdd each to the PRECACHE list in sw.js.")

    if missing or absent:
        sys.exit(1)

    print("\nPASS — every module needed before first paint is precached.")


if __name__ == "__main__":
    main()
