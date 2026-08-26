#!/usr/bin/env python3
"""Fail if shipped code changed without a CACHE_VERSION / APP_VERSION bump.

    python3 scripts/check-cache-version.py [--base <git-ref>]

WHY THIS EXISTS. The service worker serves app code CACHE-FIRST from a cache named after
CACHE_VERSION, and activate() deletes every other cache. That is what makes a repeat launch
instant — it issues no network request for code at all — but it has one sharp edge: if a
release changes JavaScript and does NOT bump CACHE_VERSION, returning visitors keep being
served the previous build out of the old cache, forever, with no error anywhere. The app looks
deployed, the files are on the host, and every existing user is on stale code.

APP_VERSION (js/main.js) must move with it, because that is the string the user can read in
Settings and quote in a bug report; a mismatch makes every report untrustworthy.

Run before any deploy. Compares the working tree against a base ref (default: upstream of the
current branch, else the previous commit).
"""
import re
import subprocess
import sys

CODE_SUFFIXES = ('.js', '.css', '.html', '.webmanifest')
SKIP_PREFIXES = ('scripts/', 'tools/', 'Mekonging Xcode/')


def sh(*args):
    return subprocess.run(args, capture_output=True, text=True).stdout.strip()


def version_in(ref, path, pattern):
    src = sh('git', 'show', f'{ref}:{path}') if ref else open(path, encoding='utf-8').read()
    m = re.search(pattern, src)
    return m.group(1) if m else None


def main():
    base = None
    if '--base' in sys.argv:
        base = sys.argv[sys.argv.index('--base') + 1]
    if not base:
        base = sh('git', 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}') or 'HEAD~1'

    changed = [l for l in sh('git', 'diff', '--name-only', base).splitlines() if l]
    # Untracked files count too: a release that ADDS a module ships new code just as much as one
    # that edits a module, and `git diff` alone never sees it. Missing these was how this check
    # first passed over 29 brand-new dictionary files.
    changed += [l for l in sh('git', 'ls-files', '--others', '--exclude-standard').splitlines() if l]
    code = sorted({f for f in changed
                   if f.endswith(CODE_SUFFIXES) and not f.startswith(SKIP_PREFIXES)})

    cache_pat = r"const CACHE_VERSION = '([^']+)'"
    app_pat = r"const APP_VERSION = '([^']+)'"
    now_cache = version_in(None, 'sw.js', cache_pat)
    now_app = version_in(None, 'js/main.js', app_pat)
    was_cache = version_in(base, 'sw.js', cache_pat)
    was_app = version_in(base, 'js/main.js', app_pat)

    print(f'base            : {base}')
    print(f'code files changed: {len(code)}')
    for f in code[:12]:
        print(f'   {f}')
    if len(code) > 12:
        print(f'   … {len(code) - 12} more')
    print(f'CACHE_VERSION   : {was_cache} -> {now_cache}')
    print(f'APP_VERSION     : {was_app} -> {now_app}')

    problems = []
    if code and now_cache == was_cache:
        problems.append(
            f'{len(code)} shipped code file(s) changed but CACHE_VERSION is still {now_cache!r}. '
            'The worker serves code cache-first, so every returning visitor would keep the old '
            'build indefinitely. Bump CACHE_VERSION in sw.js.')
    if now_cache != now_app:
        problems.append(
            f'CACHE_VERSION ({now_cache!r}) and APP_VERSION ({now_app!r}) disagree — Settings '
            'would report a build the cache is not serving.')

    if problems:
        print('\nFAIL')
        for p in problems:
            print('  - ' + p)
        return 1
    print('\nPASS — versioning is consistent with what changed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
