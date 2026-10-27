#!/usr/bin/env python3
"""Fail on a secret in any file git would commit (docs/EXCHANGE.md §2, added in M3a).

    python3 scripts/check-secrets.py            # self-test, then scan tracked and untracked files
    python3 scripts/check-secrets.py PATH...    # self-test, then scan only these files

WHY THIS EXISTS. The Market (M3 onward) talks to Supabase from the browser. Its public values
(the project URL, the publishable key, the Turnstile site key) are committed in
js/market-config.js by owner ruling (EXCHANGE §16). The secret ones (the Supabase secret key, a
service-role JWT, the Resend API key, the VAPID private key, the Turnstile secret) must never
reach the repository: the site deploys from it, so a committed secret is published.

WHAT IT FLAGS. Whole keys, never bare prefixes, so the design docs that name the prefixes pass:
  * a Supabase secret key: `sb_secret_` and 20 or more key characters;
  * a JWT whose payload says "role": "service_role" (the legacy service key);
  * a Resend API key: `re_` and 20 or more key characters;
  * a PEM private-key header (`-----BEGIN ... PRIVATE KEY-----`, any key type);
  * a literal of 8 or more characters assigned to a name containing SERVICE_ROLE,
    VAPID_PRIVATE or TURNSTILE_SECRET (any case). `${{ secrets.X }}`, `$VAR` and `<placeholder>`
    values are references, not literals, and pass;
  * a Supabase publishable key (`sb_publishable_` and 20 or more key characters) anywhere except
    js/market-config.js. It is public, but one home keeps a pasted secret from hiding beside it.

It scans every file `git ls-files --cached --others --exclude-standard` lists, so a planted file
fails before it is staged. Binary files (by extension or a NUL byte) are skipped. A finding prints
the file, the line and the kind of secret, never the value: CI logs are public.

It self-tests first: it plants a fake of every kind in a temporary tree, plus near-misses that
must pass, and refuses to report PASS unless each lands as expected. So it cannot pass without
checking. The fakes are assembled at run time, so this file holds no whole key of its own.

IF IT FIRES. Do not just delete the line: the value is already in your working tree and maybe in
a commit. Rotate the key in its dashboard first, then remove it (and rewrite history if it was
pushed).
"""
import base64
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = 'js/market-config.js'

KEY = r'[A-Za-z0-9_-]{20,}'
PATTERNS = [
    ('Supabase secret key', re.compile(r'\bsb_secret_' + KEY)),
    ('Resend API key', re.compile(r'\bre_[A-Za-z0-9_]{20,}')),
    ('PEM private key', re.compile(r'-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----')),
]
PUBLISHABLE = re.compile(r'\bsb_publishable_' + KEY)
JWT = re.compile(r'\beyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}')
# Starts at the keyword, not at the start of the name: a leading `[A-Za-z0-9_]*` matches nothing
# more but backtracks quadratically, and took 1.4 s per 20 KB of the base64 WASM core.
ASSIGNED = re.compile(
    r'(?i)(?:service_role|vapid_private|turnstile_secret)[A-Za-z0-9_]*["\']?'
    r'\s*[:=]\s*["\'`]([^"\'`\s]{8,})["\'`]')

BINARY_EXT = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.heic', '.pdf', '.zip', '.gz',
              '.wasm', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.m4a', '.ogg', '.wav', '.mp4',
              '.mov', '.pbf', '.mbtiles', '.pmtiles', '.sqlite', '.db')


def jwt_role(segment):
    try:
        raw = base64.urlsafe_b64decode(segment + '=' * (-len(segment) % 4))
        return json.loads(raw.decode('utf-8')).get('role')
    except (ValueError, UnicodeDecodeError, AttributeError):
        return None


def findings(rel, text):
    """[(line, kind)] for one file's text. Never returns the matched value."""
    out = []

    def line(pos):
        return text.count('\n', 0, pos) + 1

    for kind, rx in PATTERNS:
        out += [(line(m.start()), kind) for m in rx.finditer(text)]
    out += [(line(m.start()), 'service-role JWT') for m in JWT.finditer(text)
            if jwt_role(m.group(1)) == 'service_role']
    out += [(line(m.start()), 'secret assigned to a secret-named variable') for m in ASSIGNED.finditer(text)
            if not m.group(1).startswith(('$', '<', '{'))]
    if rel != CONFIG:
        out += [(line(m.start()), f'publishable key outside {CONFIG}') for m in PUBLISHABLE.finditer(text)]
    return sorted(out)


def read_text(path):
    if path.lower().endswith(BINARY_EXT):
        return None
    try:
        with open(path, 'rb') as fh:
            data = fh.read()
    except OSError:
        return None
    if b'\0' in data[:8192]:
        return None
    return data.decode('utf-8', errors='replace')


def repo_files():
    res = subprocess.run(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'],
                         cwd=ROOT, capture_output=True, check=True)
    return sorted(p for p in res.stdout.decode('utf-8').split('\0') if p and os.path.isfile(os.path.join(ROOT, p)))


def scan(root, rels):
    hits, scanned = [], 0
    for rel in rels:
        text = read_text(os.path.join(root, rel))
        if text is None:
            continue
        scanned += 1
        hits += [(rel, ln, kind) for ln, kind in findings(rel, text)]
    return hits, scanned


def fake(label, n=40):
    # Deterministic key-shaped filler, assembled here so no whole key sits in this file.
    alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    digest = hashlib.sha256(label.encode()).digest() * 2
    return ''.join(alphabet[b % len(alphabet)] for b in digest[:n])


def b64url(obj):
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).decode().rstrip('=')


def self_test():
    sb, pub, rs = 'sb_' + 'secret_', 'sb_' + 'publishable_', 're' + '_'
    jwt = lambda role: '.'.join([b64url({'alg': 'HS256', 'typ': 'JWT'}),
                                 b64url({'iss': 'supabase', 'role': role, 'ref': fake('ref', 20)}),
                                 fake('sig-' + role, 43)])
    pem = '-' * 5 + 'BEGIN ' + 'EC PRIVATE KEY' + '-' * 5
    planted = {   # path: (content, kinds expected)
        'a/secret.txt': (f'key={sb}{fake("sb")}\n', ['Supabase secret key']),
        'a/service.js': (f"const k = '{jwt('service_role')}';\n", ['service-role JWT']),
        'a/anon.js': (f"const k = '{jwt('anon')}';\n", []),
        'a/resend.env': (f'RESEND={rs}{fake("re", 8)}_{fake("re2", 24)}\n', ['Resend API key']),
        'a/key.pem': (f'{pem}\nMHcCAQEE\n', ['PEM private key']),
        'a/vapid.js': (f"export const VAPID_PRIVATE_KEY = '{fake('vapid', 43)}';\n",
                       ['secret assigned to a secret-named variable']),
        'a/ci.yml': ('TURNSTILE_SECRET: ${{ secrets.TURNSTILE }}\nSERVICE_ROLE = "<set-in-dashboard>"\n', []),
        'a/elsewhere.js': (f"const p = '{pub}{fake('pub')}';\n", [f'publishable key outside {CONFIG}']),
        CONFIG: (f"export const SUPABASE_KEY = '{pub}{fake('pub')}';\n", []),
        'a/doc.md': (f'The `{sb}` prefix, `{rs}` keys, `{pub}…` and -----BEGIN … PRIVATE KEY----- pass.\n', []),
    }
    problems = []
    with tempfile.TemporaryDirectory() as tmp:
        for rel, (content, _) in planted.items():
            os.makedirs(os.path.dirname(os.path.join(tmp, rel)), exist_ok=True)
            with open(os.path.join(tmp, rel), 'w', encoding='utf-8') as fh:
                fh.write(content)
        hits, _ = scan(tmp, sorted(planted))
    for rel, (_, want) in planted.items():
        got = sorted(kind for r, _, kind in hits if r == rel)
        if got != sorted(want):
            problems.append(f'{rel}: expected {want or "nothing"}, got {got or "nothing"}')
    return problems, sum(1 for _, want in planted.values() if want)


def main(argv):
    problems, caught = self_test()
    if problems:
        print('FAIL: the self-test did not behave, so a scan would prove nothing:')
        for p in problems:
            print(f'   {p}')
        return 1
    if argv:
        rels = [os.path.relpath(os.path.abspath(p), ROOT).replace(os.sep, '/') for p in argv]
    else:
        rels = repo_files()
    hits, scanned = scan(ROOT, rels)
    if hits:
        print(f'FAIL: {len(hits)} secret(s) found. Rotate each key first, then remove it:')
        for rel, ln, kind in hits:
            print(f'   {rel}:{ln}: {kind}')
        return 1
    print(f'PASS: no secrets in {scanned} text files (self-test caught all {caught} planted fakes)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
