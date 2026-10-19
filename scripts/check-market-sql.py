#!/usr/bin/env python3
"""Static checks for the Market's SQL, because no Postgres runs here (CLAUDE.md, Environment).

    python3 scripts/check-market-sql.py

The owner runs supabase/migrations/*.sql and supabase/tests/*.sql by hand in the SQL editor, and
the session that wrote them cannot execute them. This guard catches the mistakes a reader misses
and a run would punish, before the owner is asked to paste anything:

  * ASCII only. Migration 001 reached the database garbled because a clipboard read UTF-8 as
    Mac Roman (001b repaired it), so every SQL file stays pure ASCII: non-ASCII text is written as
    U&'...' escapes or chr().
  * Quotes, dollar quotes, comments and parentheses balance, in every function body too.
  * Every `begin` line has its `end;` line.
  * Every migration is one transaction: it opens with `begin;` and closes with `commit;`.
  * Every table has `enable row level security` in the file that creates it.
  * Every function pins `set search_path = ''`, and every function a migration creates is named in
    a `revoke execute` statement (Supabase grants EXECUTE to anon and authenticated by default).
  * No policy names the `owner` column: they call private.owns() and private.can_see(), so none
    depends on whether a policy expression needs privilege on a column no role may select.
  * private.contact_hit() (the phone, email, link and handle check on listings) is run in Python on
    the same patterns, read out of the SQL, against 60-odd phrases: each must be refused or accepted
    as docs/EXCHANGE.md section 8 says. Python's regex engine is not Postgres's, so this proves the
    logic and the patterns, not the engine; the owner's run of supabase/tests/002_rls.sql proves that.

It self-tests first: it feeds the linter broken samples and refuses to report PASS unless each is
caught, so it cannot pass without checking.
"""
import glob
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Applied history, never run again: 001 held non-ASCII text, reached the database garbled and was
# repaired by 001b. It stays as it was committed; every later file is held to the rule.
ASCII_EXEMPT = {'supabase/migrations/001_accounts.sql'}


# ---- the linter -----------------------------------------------------------------------------------
def lex(text, label, line0=1):
    """Check quotes, comments, dollar quotes and parentheses. Returns a list of error strings."""
    errs = []
    i, n, line = 0, len(text), line0
    depth = []
    while i < n:
        c = text[i]
        if c == '\n':
            line += 1
            i += 1
        elif text.startswith('--', i):
            j = text.find('\n', i)
            i = n if j < 0 else j
        elif text.startswith('/*', i):
            j = text.find('*/', i + 2)
            if j < 0:
                errs.append('%s:%d: unterminated /* comment' % (label, line)); return errs
            line += text.count('\n', i, j)
            i = j + 2
        elif c == "'":
            j, start = i + 1, line
            while True:
                k = text.find("'", j)
                if k < 0:
                    errs.append('%s:%d: unterminated string' % (label, start)); return errs
                if text.startswith("''", k):
                    j = k + 2
                    continue
                break
            line += text.count('\n', i, k)
            i = k + 1
        elif c == '$':
            m = re.match(r'\$([A-Za-z_]*)\$', text[i:])
            if not m:
                i += 1
                continue
            tag = m.group(0)
            k = text.find(tag, i + len(tag))
            if k < 0:
                errs.append('%s:%d: unterminated %s quote' % (label, line, tag)); return errs
            body = text[i + len(tag):k]
            errs += lex(body, label, line)
            line += text.count('\n', i, k)
            i = k + len(tag)
        elif c in '([':
            depth.append((c, line)); i += 1
        elif c in ')]':
            want = '(' if c == ')' else '['
            if not depth or depth[-1][0] != want:
                errs.append('%s:%d: unbalanced %s' % (label, line, c))
                return errs
            depth.pop(); i += 1
        else:
            i += 1
    for ch, ln in depth:
        errs.append('%s:%d: %s is never closed' % (label, ln, ch))
    return errs


def begin_end(text, label):
    lines = [l.strip().lower() for l in text.split('\n')]
    b = sum(1 for l in lines if l == 'begin')
    e = sum(1 for l in lines if l == 'end;' or l.startswith('end $$') or l.startswith('end $test$'))
    return [] if b == e else ['%s: %d "begin" lines but %d "end" lines' % (label, b, e)]


def non_ascii(text, label):
    errs = []
    for ln, l in enumerate(text.split('\n'), 1):
        bad = sorted(set(ch for ch in l if ord(ch) > 127))
        if bad:
            errs.append('%s:%d: non-ASCII character U+%04X (write it as U&\'...\' or chr())' % (label, ln, ord(bad[0])))
    return errs


def structure(text, label, migration):
    errs = []
    code = re.sub(r'--[^\n]*', '', text)
    if migration:
        stmts = [s.strip() for s in code.split(';') if s.strip()]
        # `begin;` and `commit;` are the first and last statements; function bodies hide their own ';'.
        if not re.match(r'begin\b', code.strip(), re.I):
            errs.append('%s: a migration must open with begin;' % label)
        if not re.search(r'\bcommit\s*;\s*$', code.strip(), re.I):
            errs.append('%s: a migration must end with commit;' % label)
    for m in re.finditer(r'create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_]+\.[a-z_]+|[a-z_]+)', code, re.I):
        name = m.group(1)
        if not re.search(r'alter\s+table\s+' + re.escape(name) + r'\s+enable\s+row\s+level\s+security', code, re.I):
            errs.append('%s: table %s has no "enable row level security" in this file' % (label, name))
    if migration:
        for m in re.finditer(r'create\s+policy\s+(\w+)\s+on\s+([\w.]+)(.*?);', code, re.I | re.S):
            if re.search(r'\bowner\b', m.group(3), re.I):
                errs.append('%s: policy %s names the owner column; call private.owns() or private.can_see() instead' % (label, m.group(1)))
    for m in re.finditer(r'create\s+(or\s+replace\s+)?function\s+([a-z_]+\.[a-z_]+)\s*\((.*?)\)\s*returns\s.*?\bas\s+\$', code, re.I | re.S):
        replace, name = m.group(1), m.group(2)
        header = m.group(0)
        if not re.search(r"set\s+search_path\s*=\s*''", header, re.I):
            errs.append("%s: function %s does not pin set search_path = ''" % (label, name))
        if migration and not replace:
            revokes = ' '.join(re.findall(r'revoke\s+execute\s+on\s+function(.*?)from\s', code, re.I | re.S))
            if (name + '(') not in revokes:
                errs.append('%s: function %s is never named in a "revoke execute" statement' % (label, name))
    return errs


# ---- the contact_hit mirror -----------------------------------------------------------------------
def sql_literal(tok):
    return tok[1:-1].replace("''", "'")


def evaluate(expr, env):
    """A `||` chain of 'literals', chr(n) and earlier constants, as the SQL builds its patterns."""
    toks = re.findall(r"'(?:[^']|'')*'|chr\(\d+\)|[a-z_0-9]+|\|\|", expr)
    out = ''
    for t in toks:
        if t == '||':
            continue
        if t.startswith("'"):
            out += sql_literal(t)
        elif t.startswith('chr('):
            out += chr(int(t[4:-1]))
        elif t in env:
            out += env[t]
        else:
            raise ValueError('unknown name %r in %r' % (t, expr))
    return out


def py_regex(p):
    # [[:<:]] and [[:>:]] are Postgres word boundaries; the two POSIX classes used are ASCII here.
    p = p.replace('[[:<:]]', r'\b').replace('[[:>:]]', r'\b')
    return p.replace('[:alnum:]', 'a-zA-Z0-9').replace('[:alpha:]', 'a-zA-Z')


def normalise(t):
    s = unicodedata.normalize('NFKC', t or '')
    s = re.sub('[' + chr(0xad) + chr(0x200b) + '-' + chr(0x200f) + chr(0x2060) + chr(0xfeff) + ']', '', s)
    s = unicodedata.normalize('NFD', s)
    s = re.sub('[' + chr(0x300) + '-' + chr(0x36f) + ']', '', s)
    s = s.lower()
    s = s.translate(str.maketrans(chr(0x111) + chr(0x110) + '01345@$', 'ddoieasas'))
    return re.sub(r'(.)\1{2,}', r'\1\1', s)


def build_mirror(sql):
    m = re.search(r'-- BEGIN contact_hit.*?\n(.*?)-- END contact_hit', sql, re.S)
    if not m:
        return None, ['contact_hit block markers not found in 002_listings.sql']
    block = m.group(1)
    env = {}
    for c in re.finditer(r'^\s+(\w+)\s+constant\s+text\s*:=\s*(.*?);[ \t]*(?:--.*)?$', block, re.M):
        name, expr = c.group(1), c.group(2).strip()
        if expr.startswith('(select'):
            continue
        env[name] = evaluate(expr, env)
    body = block[block.index('begin\n  r := lower'):]
    inline = [sql_literal("'" + x + "'") for x in re.findall(r"r ~ '((?:[^']|'')*)'", body)]
    names = [x.strip() for x in re.findall(r"strpos\(words, '((?: ?[a-z ]+ ?))'\) > 0", body)]
    steps = []
    for s in re.finditer(r"digits := regexp_replace\(digits, (.*?), '(x|)', 'g'\);", body):
        steps.append((py_regex(evaluate(s.group(1), env)), s.group(2)))
    domain = py_regex(env['domain_re'])
    inline = [py_regex(p) for p in inline]
    wanted = ('iso_date', 'dmy_date', 'amount', 'tail', 'unit', 'sign', 'seps', 'domain_re')
    missing = [k for k in wanted if k not in env]
    errs = ['constant %s not found' % k for k in missing]
    if len(steps) < 5 or len(inline) < 4 or len(names) < 5:
        errs.append('could not read the contact_hit patterns (steps %d, inline %d, names %d)' % (len(steps), len(inline), len(names)))
    return (inline, domain, names, steps), errs


def contact_hit(mirror, t):
    inline, domain, names, steps = mirror
    r = unicodedata.normalize('NFKC', t or '').lower()
    if r == '':
        return False
    if any(re.search(p, r) for p in inline) or re.search(domain, r):
        return True
    words = ' ' + re.sub(r'[^a-zA-Z0-9]+', ' ', normalise(t)) + ' '
    if any(w in words for w in (' ' + x.strip() + ' ' for x in names)):
        return True
    local = ''.join(chr(b + d) for b in (3664, 3792, 6112) for d in range(10))
    digits = r.translate(str.maketrans(local, '0123456789' * 3))
    for pat, rep in steps:
        digits = re.sub(pat, rep or '', digits)
    return re.search('[0-9]{8}', digits) is not None


THAI_DIGITS = ''.join(chr(3664 + d) for d in range(10))
REFUSED = [
    'Call me 081-234-5678', 'Call 0812345678', 'Call +66 81 234 5678', 'Call (081) 234 5678', 'Call 081.234.5678',
    'Call ' + '0812345678'.translate(str.maketrans('0123456789', THAI_DIGITS)), 'Call 081 234 5678 per night',
    'Mail me sam@example.com', 'See https://example.com/page', 'See www.example.com', 'See example.com',
    'See my.site.travel', 'Message wa.me/66812345678', 'Message t.me/samtravel', 'Find me @samtravel',
    'My line id is sam', 'Message me on WhatsApp', 'Message me on Telegram', 'Message me on Whats App',
    'Message me on Wh@tsapp', 'L1ne id: sam', 'Zalo me', 'Call me 66 81 234 5678', 'tel 0812345678 baht',
    'Phone: 081 234 5678', 'Reach me at sam at gmail.com', 'ftp://files.example.org/x', 'Viber me', 'wechat sam', 'Message @_sam.travel',
]
ACCEPTED = [
    'Available 2026-10-20 to 2026-10-25', 'Available 20/10/2026 to 25/10/2026', 'About 15,000,000 VND a month',
    'About 15.000.000 VND', 'About 15000000 VND', 'Price 1,500 baht per night', '1500-2000 baht per night',
    'Sizes 38 and 40', 'Room for 2, 3 nights, 2 beds, 1 bathroom', 'Pickup 7:30, 25 km, 4 seats', 'Pipeline identifier',
    'Go online and ask', chr(3647) + '1,500/night', 'Price 3,500,000 dong', 'Free, no fee, collect soon',
    'Gunnar tent from Iceland', 'Toy box', 'Stroller, barely used', 'Room near the old quarter, quiet street',
    'Fits most cars. Seat is 2 years old.', 'US$50 per week', 'Rent 4,500,000 VND, bills 500,000 VND',
    'From 9am to 5pm, 3 days', 'Bicycle with 21 gears, 26 inch wheels', 'Window 20.10.2026 to 25.10.2026',
    'Pickup @8am, meet @ the pier', 'Tent for 3.5 persons', 'Sunset @7pm',
]


def check_mirror(sql):
    mirror, errs = build_mirror(sql)
    if errs:
        return errs
    out = []
    for t in REFUSED:
        if not contact_hit(mirror, t):
            out.append('contact_hit lets through: %r' % t)
    for t in ACCEPTED:
        if contact_hit(mirror, t):
            out.append('contact_hit refuses an ordinary phrase: %r' % t)
    return out


# ---- self-test ------------------------------------------------------------------------------------
def selftest():
    bad = []
    cases = [
        (lex("select 'abc;", 'x'), 'an unterminated string'),
        (lex('select (1;', 'x'), 'an unclosed parenthesis'),
        (lex('select 1);', 'x'), 'a stray parenthesis'),
        (lex("do $$ begin select '; end $$;", 'x'), 'a quote broken inside a function body'),
        (lex('select $t$ never closed', 'x'), 'an unterminated dollar quote'),
        (non_ascii('select 1 -- caf' + chr(233), 'x'), 'a non-ASCII character'),
        (begin_end('begin\nbegin\nend;\n', 'x'), 'a missing end'),
        (structure('create table public.t (a int);', 'x', False), 'a table without RLS'),
        (structure("create function private.f() returns int language sql as $$ select 1 $$;", 'x', False), 'a function without search_path'),
        (structure("begin;\ncreate function private.f() returns int language sql set search_path = '' as $$ select 1 $$;\ncommit;", 'x', True), 'a function never revoked'),
        (structure('select 1;', 'x', True), 'a migration without begin and commit'),
        (structure("begin;\ncreate policy p on public.t for select using (owner = auth.uid());\ncommit;", 'x', True), 'a policy that names owner'),
    ]
    for errs, what in cases:
        if not errs:
            bad.append('self-test: %s was not caught' % what)
    fine = lex("select 'it''s', $$ a (b) 'c' $$, (1 + 2) -- ok ( \n", 'x') + begin_end('begin\nend;\n', 'x')
    if fine:
        bad.append('self-test: a clean sample was refused: %s' % fine)
    # The mirror must be able to fail: a copy with no patterns lets a dashed phone number through.
    weak = ([], r'zzz-never', [], [])
    if contact_hit(weak, 'Call 081-234-5678'):
        bad.append('self-test: a mirror with no patterns refused a dashed phone number')
    return bad


def main():
    errors = selftest()
    if errors:
        print('SELF-TEST FAILED')
        print('\n'.join(errors))
        return 1
    files = sorted(glob.glob(os.path.join(ROOT, 'supabase', '**', '*.sql'), recursive=True))
    if not files:
        print('FAIL: no SQL files under supabase/')
        return 1
    for path in files:
        label = os.path.relpath(path, ROOT)
        text = open(path, encoding='utf-8').read()
        migration = '/migrations/' in path
        if label not in ASCII_EXEMPT:
            errors += non_ascii(text, label)
        errors += lex(text, label)
        errors += begin_end(text, label)
        errors += structure(text, label, migration)
    path = os.path.join(ROOT, 'supabase', 'migrations', '002_listings.sql')
    if os.path.exists(path):
        errors += check_mirror(open(path, encoding='utf-8').read())
    if errors:
        print('check-market-sql: %d problem(s)' % len(errors))
        print('\n'.join('  ' + e for e in errors))
        return 1
    print('check-market-sql: PASS (%d SQL files; contact_hit mirror %d refused, %d accepted)' % (len(files), len(REFUSED), len(ACCEPTED)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
