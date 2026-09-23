#!/usr/bin/env python3
"""Generate (or verify) the content manifest sw.js uses to keep unchanged files cached.

    python3 scripts/build-sw-manifest.py            # verify; exit 1 if stale
    python3 scripts/build-sw-manifest.py --write    # regenerate the block in sw.js

WHY THIS EXISTS. The worker serves app code cache-first. It used to name its cache after
CACHE_VERSION and delete every other cache on activate, so a release that changed three files
threw away all 205 and every returning traveller re-downloaded the whole 860 KB shell on their
next launch. Measured over the last dozen releases, the median release changes 6 shipped files.
On the 0.65 Mbps link this app is built for, the difference is roughly eight seconds of staring
at a splash screen, once per user per release.

So the cache now outlives the release, and activate() deletes ONLY the entries whose content
actually changed. It knows which those are by comparing the manifest below against the one it
stored last time.

THE SHARP EDGE. A stale manifest is worse than no manifest: it tells the worker a file is
unchanged when it is not, and that file is then served from cache forever — the exact silent
failure that "bump CACHE_VERSION" exists to prevent. That is why the default mode here is
verify, why it is wired into scripts/check-cache-version.py (the one command already run before
every deploy), and why the hashes are read from disk rather than maintained by hand.
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SW = os.path.join(ROOT, 'sw.js')

BEGIN = '// ---- BEGIN GENERATED MANIFEST — scripts/build-sw-manifest.py ----'
END = '// ---- END GENERATED MANIFEST ----'

# Everything the shell cache can hold. img/ and audio/ are deliberately absent: the field
# guide's photos and calls live in MEDIA_CACHE, which is not release-scoped and is reconciled
# by its own per-tier count (see sw.js mediaStatus), so hashing 567 files here would add
# nothing and cost a slow walk on every check.
EXTS = ('.js', '.css', '.html', '.webmanifest', '.json', '.geojson', '.svg', '.png', '.woff2')
SKIP_DIRS = {'.git', '.claude', 'scripts', 'tools', 'img', 'audio', 'node_modules', 'Mekonging Xcode'}


def shipped_files():
    out = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
        for fn in filenames:
            if not fn.endswith(EXTS):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, ROOT).replace(os.sep, '/')
            if rel == 'sw.js':
                continue   # the worker is never served from its own cache
            out.append(rel)
    return sorted(out)


def digest(rel):
    h = hashlib.sha256()
    with open(os.path.join(ROOT, rel), 'rb') as fh:
        for block in iter(lambda: fh.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()[:8]


def render():
    lines = [BEGIN, 'const MANIFEST = {']
    for rel in shipped_files():
        lines.append(f"  '{rel}': '{digest(rel)}',")
    lines.append('};')
    lines.append(END)
    return '\n'.join(lines)


def main():
    src = open(SW, encoding='utf-8').read()
    block = render()
    pattern = re.compile(re.escape(BEGIN) + r'.*?' + re.escape(END), re.S)
    if not pattern.search(src):
        print(f'FAIL — no generated-manifest block in sw.js. Expected a line reading:\n  {BEGIN}')
        return 1
    current = pattern.search(src).group(0)
    if '--write' in sys.argv:
        if current == block:
            print(f'manifest already current ({len(shipped_files())} files)')
            return 0
        open(SW, 'w', encoding='utf-8').write(pattern.sub(lambda _: block, src, count=1))
        print(f'manifest rewritten ({len(shipped_files())} files)')
        return 0
    if current != block:
        now = dict(re.findall(r"'([^']+)': '([0-9a-f]{8})'", current))
        want = dict(re.findall(r"'([^']+)': '([0-9a-f]{8})'", block))
        drifted = sorted(set(now) ^ set(want)) + sorted(k for k in set(now) & set(want) if now[k] != want[k])
        print(f'FAIL — sw.js manifest is stale against the working tree ({len(drifted)} file(s) differ).')
        for f in drifted[:12]:
            print(f'   {f}')
        if len(drifted) > 12:
            print(f'   … {len(drifted) - 12} more')
        print('\nThe worker would keep serving the OLD copy of each of these from cache, with no\n'
              'error anywhere. Run: python3 scripts/build-sw-manifest.py --write')
        return 1
    print(f'PASS — manifest matches the working tree ({len(shipped_files())} files)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
