#!/usr/bin/env python3
"""Fail when the Supabase keep-alive could silently stop working (docs/EXCHANGE.md section 17, M7).

    python3 scripts/check-keepalive.py

WHY THIS EXISTS. The Market's Supabase project was found paused on 2026-11-24, after a week
without a visitor. .github/workflows/supabase-keepalive.yml keeps it awake by running
scripts/supabase_keepalive.py twice a day. That only works while (1) js/market-config.js still
holds a URL and a publishable key the script will send, (2) the workflow still runs the script on
a schedule with no secret and no write access, and (3) the script still tells a healthy answer
from a dead one. A rename in any of the three stops the calls and tells nobody: the project would
pause a week later.

WHAT IT DOES. No network beyond 127.0.0.1.
  * Runs the script's check() against a throwaway local server in six situations: every call
    answered 200, the closed beta's 400 `market_closed`, a 521 that recovers on the second try, a
    521 that stays, a 400 with another message, and a refused connection. It requires each exit
    code, request count and wait. The last three are its negative controls: it cannot pass if
    check() never fails.
  * Requires each request to be anonymous and well formed: a POST of the call's JSON to the call's
    path, an apikey header, no Authorization header, a User-Agent of its own, and the key nowhere
    in the output.
  * Requires load_config() to accept the real js/market-config.js and to refuse a foreign host, a
    lookalike host, a secret key and a short key.
  * Requires the workflow to have two or more cron lines that do not start on the hour, a manual
    trigger, read-only contents, no secret, a run of the script, and a sparse checkout of both files
    the script reads. It plants four broken copies of the workflow and requires each to be flagged.
"""
import http.server
import importlib.util
import json
import os
import re
import socket
import sys
import tempfile
import threading

sys.dont_write_bytecode = True    # importing the script must not leave scripts/__pycache__ in the tree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKFLOW = '.github/workflows/supabase-keepalive.yml'
SCRIPT = 'scripts/supabase_keepalive.py'
CONFIG = 'js/market-config.js'

CLOSED = '{"code":"P0001","details":null,"hint":null,"message":"market_closed"}'
HTML_521 = '<!DOCTYPE html><html><body>Web server is down</body></html>'


def load_script():
    spec = importlib.util.spec_from_file_location('supabase_keepalive', os.path.join(ROOT, SCRIPT))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Server:
    """A local HTTP server that answers from answer(n, path) -> (status, body) and records requests."""

    def __init__(self, answer):
        self.requests = []
        outer = self

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                raw = self.rfile.read(int(self.headers.get('Content-Length') or 0))
                outer.requests.append((self.path, {k.lower(): v for k, v in self.headers.items()}, raw))
                status, text = answer(len(outer.requests), self.path)
                data = text.encode('utf-8')
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def log_message(self, *args):
                pass

        self.httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.url = 'http://127.0.0.1:%d' % self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *exc):
        self.httpd.shutdown()
        self.httpd.server_close()


def unused_url():
    sock = socket.socket()
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
    sock.close()
    return 'http://127.0.0.1:%d' % port


def scenario_problems(mod, key):
    calls, tries, waits = len(mod.CALLS), mod.ATTEMPTS, list(mod.WAITS[:mod.ATTEMPTS - 1])
    stays = [(521, HTML_521)]
    # name, answer(n, path), want exit, want requests (None: not counted), want waits
    cases = [
        ('every call answered 200', lambda n, p: (200, '[]'), 0, calls, []),
        ('the closed beta answers 400 market_closed', lambda n, p: (400, CLOSED), 0, calls, []),
        ('a 521 that recovers on the second try',
         lambda n, p: stays[0] if n == 1 else (200, 'null'), 0, calls + 1, waits[:1]),
        ('a 521 that stays', lambda n, p: stays[0], 1, calls * tries, waits * calls),
        ('a 400 with another message', lambda n, p: (400, '{"message":"sort_invalid"}'), 1, calls * tries, waits * calls),
        ('a refused connection', None, 1, None, waits * calls),
    ]
    problems = []
    for name, answer, want_exit, want_requests, want_waits in cases:
        slept, lines = [], []
        if answer is None:
            code = mod.check(unused_url(), key, sleep_fn=slept.append, annotate=False, summary_path='', out=lines.append)
            requests = None
        else:
            with Server(answer) as server:
                code = mod.check(server.url, key, sleep_fn=slept.append, annotate=False, summary_path='', out=lines.append)
                requests = list(server.requests)
        if code != want_exit:
            problems.append('%s: exit %s, wanted %s' % (name, code, want_exit))
        if want_requests is not None and len(requests) != want_requests:
            problems.append('%s: %d requests, wanted %d' % (name, len(requests), want_requests))
        if slept != want_waits:
            problems.append('%s: waits %s, wanted %s' % (name, slept, want_waits))
        if key in '\n'.join(lines):
            problems.append('%s: the key was printed' % name)
        if name == 'every call answered 200' and requests is not None:
            problems += request_problems(mod, key, requests)
    return problems


def request_problems(mod, key, requests):
    problems = []
    for (label, path, body), (got_path, headers, raw) in zip(mod.CALLS, requests):
        if got_path != path:
            problems.append('%s: sent to %s, wanted %s' % (label, got_path, path))
        try:
            if json.loads(raw) != body:
                problems.append('%s: the body differs from the call' % label)
        except ValueError:
            problems.append('%s: the body is not JSON' % label)
        if headers.get('apikey') != key:
            problems.append('%s: no apikey header holding the key' % label)
        if 'authorization' in headers:
            problems.append('%s: sent an Authorization header, so it is not anonymous' % label)
        if 'application/json' not in headers.get('content-type', ''):
            problems.append('%s: Content-Type is not JSON' % label)
        if headers.get('user-agent', 'Python-urllib').startswith('Python-urllib'):
            problems.append('%s: no User-Agent of its own (a default one is blocked by some gateways)' % label)
    return problems


def config_problems(mod, key):
    good_url = 'https://' + 'a' * 20 + '.supabase.co'
    secret = 'sb_' + 'secret_' + 'k' * 30
    cases = [
        ('the project URL with a publishable key', good_url, key, True),
        ('a foreign host', 'https://example.com', key, False),
        ('a lookalike host', good_url + '.example.com', key, False),
        ('a secret key', good_url, secret, False),
        ('a short key', good_url, 'sb_' + 'publishable_' + 'k' * 5, False),
    ]
    problems = []
    try:
        mod.load_config(os.path.join(ROOT, CONFIG))
    except (OSError, ValueError) as err:
        problems.append('the real %s is not fit to send: %s' % (CONFIG, err))
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, 'market-config.js')
        for name, url, k, accepted in cases:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write("export const SUPABASE_URL = '%s';\nexport const SUPABASE_KEY = '%s';\n" % (url, k))
            try:
                mod.load_config(path)
                ok = True
            except ValueError:
                ok = False
            if ok != accepted:
                problems.append('load_config %s %s' % ('refused' if accepted else 'accepted', name))
    return problems


def workflow_problems(text):
    problems = []
    crons = re.findall(r"^\s*-\s*cron:\s*'([^']+)'", text, re.M)
    if len(crons) < 2:
        problems.append('fewer than two cron lines (the project needs a few requests a day)')
    for cron in crons:
        if len(cron.split()) != 5 or not re.fullmatch(r'[1-5]?[0-9]', cron.split()[0]) or cron.split()[0] == '0':
            problems.append("cron '%s' starts on the hour (GitHub delays or drops those) or is not five fields" % cron)
    if not re.search(r'^\s*workflow_dispatch:', text, re.M):
        problems.append('no workflow_dispatch (a run by hand re-checks the project after a restore)')
    if not re.search(r'^\s*contents:\s*read\s*$', text, re.M) or re.search(r'^\s*[a-z-]+:\s*write\s*$', text, re.M):
        problems.append('permissions are not read-only contents')
    if re.search(r'\$\{\{\s*secrets\.', text):
        problems.append('it reads a secret: the job needs only the public values in the config')
    if not re.search(r'^\s*run:\s*python3 scripts/supabase_keepalive\.py\s*$', text, re.M):
        problems.append('no step runs python3 scripts/supabase_keepalive.py')
    block = re.search(r'sparse-checkout:\s*\|\s*\n((?:[ \t]+\S+[ \t]*\n)+)', text)
    listed = block.group(1).split() if block else []
    for needed in (SCRIPT, CONFIG):
        if needed not in listed:
            problems.append('the sparse checkout does not list %s' % needed)
    return problems


def main():
    mod = load_script()
    key = 'sb_' + 'publishable_' + 'k' * 30
    problems = scenario_problems(mod, key) + config_problems(mod, key)
    planted = 0
    try:
        with open(os.path.join(ROOT, WORKFLOW), encoding='utf-8') as fh:
            text = fh.read()
    except OSError:
        problems.append('%s is missing' % WORKFLOW)
        text = None
    if text is not None:
        problems += ['%s: %s' % (WORKFLOW, p) for p in workflow_problems(text)]
        broken = {
            'no cron lines': re.sub(r'(?m)^\s*-\s*cron:.*\n', '', text),
            'no manual trigger': re.sub(r'(?m)^\s*workflow_dispatch:.*\n', '', text),
            'write access': text.replace('contents: read', 'contents: write'),
            'a secret': text + '\n# ${{ secrets.EXAMPLE }}\n',
        }
        for name, copy in broken.items():
            planted += 1
            if copy == text or not workflow_problems(copy):
                problems.append('self-test: a workflow with %s was not flagged' % name)
    if problems:
        print('FAIL: %d problem(s) with the Supabase keep-alive:' % len(problems))
        for p in problems:
            print('   ' + p)
        return 1
    print('PASS: keep-alive: 6 situations behaved, the config is fit to send, the workflow runs on a schedule '
          '(self-test caught all %d planted breaks)' % planted)
    return 0


if __name__ == '__main__':
    sys.exit(main())
