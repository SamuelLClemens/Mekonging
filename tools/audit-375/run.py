#!/usr/bin/env python3
"""One command: serve a tree, measure every route at 375 px in both themes, print the audit tables.

    python3 tools/audit-375/run.py                        # this checkout: light and dark, every route
    python3 tools/audit-375/run.py --repo /path/to/tree   # another checkout or a detached worktree
    python3 tools/audit-375/run.py --baseline tools/audit-375/baseline-2026-10-19
    python3 tools/audit-375/run.py --only '#home,#sos' --brief          # a quick look at two routes

What it does, in order:
  1. keeps the display awake for its whole life (`caffeinate -d`), because macOS display sleep flips headless
     pages to document.hidden and a hidden page undercounts controls;
  2. serves the tree with its own scripts/serve.py on a free port (--base uses a server that is already up);
  3. derives the route list from scripts/route-sweep.js (or reads --routes);
  4. runs the positive controls: a planted overflow, low contrast, small button, covered button and three kinds
     of console error must each be reported, or the run stops (exit 2);
  5. measures both themes in parallel (--serial for one after the other), then the journey map with two trip
     stops and the legacy Market hashes;
  6. prints the setup, the headline table, the routes by severity, the findings that repeat and one table per
     route with both themes; the same text is saved as report.md in the run folder.

The run folder (default ~/Library/Caches/mk-audit-375/<stamp>-<commit>/, outside the repository) keeps the raw
results next to report.md, so a later run can use it as --baseline. A load whose page is document.hidden is
refused, retried and, if it stays hidden, left out and named. Exit codes: 0 complete, 1 a route failed,
2 setup or a positive control failed, 3 a route stayed hidden.
"""
import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'cdp'))
sys.path.insert(0, HERE)
from cdp import Chrome, free_port, keep_awake, wait_http  # noqa: E402
import listroutes  # noqa: E402
import poscontrol  # noqa: E402
import poslog  # noqa: E402
import redirects  # noqa: E402
import report375  # noqa: E402

CACHE = os.path.join(os.path.expanduser('~'), 'Library', 'Caches', 'mk-audit-375')

# The journey screen draws no map until the traveller has a stop, so its map (and the credits panel on it)
# is measured in a second profile that holds two trip stops.
JOURNEY_SEED = ("s.store.trip.stops.length = 0; "
                "s.addStop({ title: 'Bangkok', country: 'th', date: '2026-10-20', endDate: '2026-10-22' }); "
                "s.addStop({ title: 'Chiang Mai', country: 'th', date: '2026-10-22' })")


def sh(cmd, cwd):
    try:
        return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=30).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ''


def app_version(repo):
    try:
        m = re.search(r"APP_VERSION\s*=\s*'([^']+)'", open(os.path.join(repo, 'js', 'main.js'), encoding='utf-8').read())
        return m.group(1) if m else 'unknown'
    except OSError:
        return 'unknown'


def spawn(args_list):
    return subprocess.Popen([sys.executable, os.path.join(HERE, 'audit375.py')] + args_list)


def measure(base, routes_file, run_dir, theme_list, serial, extra, prefix, resume, only=''):
    """Run audit375.py once per theme (in parallel unless serial). -> the worst exit code."""
    codes = []
    procs = []
    for theme in theme_list:
        a = ['--base', base, '--theme', theme, '--routes', routes_file, '--out', os.path.join(run_dir, '%s-%s.jsonl' % (prefix, theme))] + extra
        if only:
            a += ['--only', only]
        if resume:
            a.append('--resume')
        p = spawn(a)
        if serial:
            codes.append(p.wait())
        else:
            procs.append(p)
    codes += [p.wait() for p in procs]
    return 3 if 3 in codes else (1 if any(codes) else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0], formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--repo', default=os.path.abspath(os.path.join(HERE, '..', '..')), help='the tree to serve and audit (default: this checkout)')
    ap.add_argument('--base', default='', help='audit a server that is already up instead of serving --repo')
    ap.add_argument('--out-dir', default='', help='run folder (default ~/Library/Caches/mk-audit-375/<stamp>-<commit>)')
    ap.add_argument('--resume', action='store_true', help='continue an interrupted run in --out-dir: skip routes already measured visible')
    ap.add_argument('--routes', default='', help='a file with one #route per line (default: derived from the tree)')
    ap.add_argument('--only', default='', help='comma separated #routes: measure only these')
    ap.add_argument('--baseline', default='', help='an earlier run folder: its headline numbers go beside this run')
    ap.add_argument('--markdown', default='', help='also write the printed tables to this file')
    ap.add_argument('--serial', action='store_true', help='measure the themes one after the other (default: in parallel)')
    ap.add_argument('--brief', action='store_true', help='print the headline and severity tables, not the per-route tables')
    ap.add_argument('--no-variants', action='store_true', help='skip the journey map with two trip stops')
    ap.add_argument('--no-redirects', action='store_true', help='skip the legacy Market hashes')
    ap.add_argument('--no-selftest', action='store_true', help='skip the positive controls (not for a result you will quote)')
    ap.add_argument('--port', type=int, default=0, help='port for the tree server (default: a free one)')
    a = ap.parse_args()

    repo = os.path.abspath(a.repo)
    if not os.path.exists(os.path.join(repo, 'scripts', 'serve.py')):
        print('%s is not a Mekong tree (no scripts/serve.py)' % repo)
        return 2
    commit = sh(['git', 'rev-parse', '--short', 'HEAD'], repo) or 'nogit'
    version = app_version(repo)
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    run_dir = os.path.abspath(a.out_dir) if a.out_dir else os.path.join(CACHE, '%s-%s' % (stamp, commit))
    os.makedirs(run_dir, exist_ok=True)

    awake = keep_awake()
    print('display kept awake (caffeinate -d): %s' % ('yes' if awake else 'NO, caffeinate is missing; hidden loads are still refused'), flush=True)
    srv = None
    base = a.base.rstrip('/')
    t_start = time.time()
    try:
        if not base:
            port = a.port or free_port()
            srv = subprocess.Popen([sys.executable, os.path.join(repo, 'scripts', 'serve.py'), str(port)], cwd=repo,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            base = 'http://127.0.0.1:%d' % port
        if not wait_http(base + '/', 30):
            print('nothing answers at %s' % base)
            return 2
        print('auditing %s (%s, %s) at %s; run folder %s' % (repo, version, commit, base, run_dir), flush=True)

        # 3. routes
        routes_file = os.path.join(run_dir, 'routes.txt')
        if a.routes:
            lines = [r.strip() for r in open(a.routes, encoding='utf-8') if r.strip()]
            with open(routes_file, 'w', encoding='utf-8') as fh:
                fh.write('\n'.join(lines) + '\n')
            derived = [{'hash': r, 'from': ''} for r in lines]
            side = os.path.join(os.path.dirname(os.path.abspath(a.routes)), 'routes-derived.json')
            if os.path.exists(side):
                derived = json.load(open(side, encoding='utf-8'))
            routes_note = 'the list in %s' % os.path.basename(a.routes)
        else:
            derived = listroutes.derive(base)
            with open(routes_file, 'w', encoding='utf-8') as fh:
                fh.write('\n'.join(r['hash'] for r in derived) + '\n')
            routes_note = ('derived from `js/nav-groups.js` and the `EXTRA` table of `scripts/route-sweep.js`, plus `#market` and its four chips where '
                           'the tree\'s `route-sweep.js` lacks them. `{cc}` routes use `th`')
        with open(os.path.join(run_dir, 'routes-derived.json'), 'w', encoding='utf-8') as fh:
            json.dump(derived, fh, indent=1, ensure_ascii=False)
        print('%d routes' % len(derived), flush=True)

        # 4. positive controls
        if not a.no_selftest:
            ok1, l1 = poscontrol.run(base)
            ok2, l2 = poslog.run(base)
            print('\n'.join(l1 + l2), flush=True)
            if not (ok1 and ok2):
                print('a positive control was MISSED: the detectors cannot be trusted, stopping')
                return 2

        browser = ''
        try:
            c = Chrome()
            browser = c.version()
            c.close()
        except Exception:  # noqa: BLE001
            pass
        meta = {'date': datetime.date.today().isoformat(), 'build': '`%s`, commit %s' % (version, commit),
                'browser': '%s, `--headless=new`, fresh profile per theme, one stdlib CDP client (`tools/cdp/cdp.py`)' % browser,
                'server': '`python3 scripts/serve.py <port>` on 127.0.0.1 from `%s`' % repo,
                'routes_note': routes_note, 'commit': commit, 'version': version, 'repo': repo}
        with open(os.path.join(run_dir, 'meta.json'), 'w', encoding='utf-8') as fh:
            json.dump(meta, fh, indent=1, ensure_ascii=False)

        # 5. measure
        code = measure(base, routes_file, run_dir, ['light', 'dark'], a.serial, [], 'run', a.resume, a.only)
        if not a.no_variants and (not a.only or '#journey' in a.only):
            vcode = measure(base, routes_file, run_dir, ['light', 'dark'], a.serial,
                            ['--only', '#journey', '--tag', 'journey-2-stops', '--seed-extra', JOURNEY_SEED], 'variant', a.resume)
            code = 3 if 3 in (code, vcode) else (1 if (code or vcode) else 0)
        if not a.no_redirects and not a.only:
            legacy = redirects.legacy(base)          # measure first: a failure must not leave an empty file behind
            with open(os.path.join(run_dir, 'redirects.json'), 'w', encoding='utf-8') as fh:
                json.dump(legacy, fh, indent=1, ensure_ascii=False)
    finally:
        if srv:
            srv.terminate()

    # 6. the tables
    if a.only:
        wanted = [x.strip() for x in a.only.split(',') if x.strip()]
        with open(os.path.join(run_dir, 'routes.txt'), 'w', encoding='utf-8') as fh:
            fh.write('\n'.join(wanted) + '\n')
    sec = report375.build(run_dir, a.baseline or None)
    lines = report375.render(sec, a.brief)
    text = '\n'.join(lines) + '\n'
    with open(os.path.join(run_dir, 'report.md'), 'w', encoding='utf-8') as fh:
        fh.write(text)
    if a.markdown:
        with open(a.markdown, 'w', encoding='utf-8') as fh:
            fh.write(text)
    print()
    print(text)
    print('run folder: %s (%.0f minutes)' % (run_dir, (time.time() - t_start) / 60))
    if sec['missing'] or sec['failures']:
        code = code or 1
    return code


if __name__ == '__main__':
    sys.exit(main())
