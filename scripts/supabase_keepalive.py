#!/usr/bin/env python3
"""Keep the Market's Supabase project from being paused for inactivity, and say so when it is down.

    python3 scripts/supabase_keepalive.py      # three anonymous read calls; exit 1 if any fails

WHY THIS EXISTS. Supabase pauses a Free-plan project that sees too little database activity over
seven days ("a few user requests to the database each day over the previous week is enough",
https://supabase.com/docs/guides/platform/free-project-pausing, read 2026-11-24). The Market's
project was found paused on 2026-11-24 after a week with no visitor, and the owner restored it by
hand in the dashboard. .github/workflows/supabase-keepalive.yml runs this twice a day, so the
project keeps receiving requests and a pause is noticed within a day, by a failed run, instead of
when the Market is next opened.

WHAT IT SENDS. The two read RPCs a visitor's browser calls, public.market_search and
public.market_listing (both granted to anon in supabase/migrations/002_listings.sql), through the
URL and publishable key in js/market-config.js, with no account, no token and no write. While the
Market is a closed beta both answer HTTP 400 `market_closed`, raised by the gate at the top of the
function. That counts as a healthy answer, because the request reached the database. Once the
Market opens they answer 200.

WHAT IT REFUSES. A URL that is not https://<20 letters or digits>.supabase.co, and a key that does
not start with `sb_publishable_`, so a secret key pasted into the config can never be sent
anywhere. It never prints the key.

WHAT IT PROVES, AND WHAT IT CANNOT. A healthy answer proves the project is awake and its database
answers. Supabase publishes no activity threshold, so whether these calls are "sufficient" rests
on its documentation, which names API calls to the project as a way to prevent a pause. The
measure is the absence of a second warning email and of a failed run. If a warning arrives anyway,
the next step is the RPC `market_ping()` that docs/EXCHANGE.md section 17 (M7) names, which needs
a migration the owner runs.
"""
import http.client
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, 'js', 'market-config.js')

URL_SHAPE = re.compile(r'^https://[a-z0-9]{20}\.supabase\.co$')
KEY_PREFIX = 'sb_publishable_'

# (label, path, body). The nil id matches no listing, so market_listing answers null once the Market opens.
CALLS = (
    ('search, newest first', '/rest/v1/rpc/market_search', {'page_size': 1}),
    ('search, soonest first', '/rest/v1/rpc/market_search', {'page_size': 1, 'sort': 'soonest'}),
    ('one listing, no such id', '/rest/v1/rpc/market_listing',
     {'listing_id': '00000000-0000-0000-0000-000000000000'}),
)
ATTEMPTS = 3        # per call
WAITS = (10, 30)    # seconds before the second and the third attempt
TIMEOUT = 15        # seconds per request

PAUSED_HELP = ('If the project is paused, restore it for free: supabase.com/dashboard, project '
               'Mekonging, Restore project. Then re-run this workflow.')


def load_config(path=CONFIG):
    """(url, key) from js/market-config.js. Raises ValueError, never quoting a value, unless both are fit to send."""
    with open(path, encoding='utf-8') as fh:
        text = fh.read()
    url = re.search(r"export const SUPABASE_URL = '([^']*)';", text)
    key = re.search(r"export const SUPABASE_KEY = '([^']*)';", text)
    if not url or not URL_SHAPE.match(url.group(1)):
        raise ValueError('SUPABASE_URL in js/market-config.js is missing or is not https://<project>.supabase.co')
    if not key or not key.group(1).startswith(KEY_PREFIX) or len(key.group(1)) < len(KEY_PREFIX) + 20:
        raise ValueError('SUPABASE_KEY in js/market-config.js is missing or is not a publishable key')
    return url.group(1), key.group(1)


def classify(status, text):
    """('ok' | 'closed' | 'bad', note). 'closed' is the closed beta's own answer; both mean awake."""
    if status == 200:
        return 'ok', 'HTTP 200'
    if status == 400:
        try:
            message = json.loads(text).get('message')
        except (ValueError, AttributeError):
            message = None
        if message == 'market_closed':
            return 'closed', 'HTTP 400 market_closed (the closed beta)'
        return 'bad', 'HTTP 400' + (' ' + str(message)[:60] if message else '')
    if status == 0:
        return 'bad', 'no answer: ' + text[:80]
    return 'bad', 'HTTP %d' % status


def send(url, key, path, body, timeout=TIMEOUT):
    """(status, text). Status 0 means no HTTP answer at all: DNS, refused, TLS or a timeout."""
    req = urllib.request.Request(
        url + path, data=json.dumps(body).encode('utf-8'), method='POST',
        headers={'apikey': key, 'Content-Type': 'application/json', 'Accept': 'application/json',
                 'User-Agent': 'mekonging-keepalive'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, res.read(4096).decode('utf-8', 'replace')
    except urllib.error.HTTPError as err:
        return err.code, err.read(4096).decode('utf-8', 'replace')
    except (urllib.error.URLError, http.client.HTTPException, OSError, ValueError) as err:
        return 0, type(err).__name__ + ' ' + str(getattr(err, 'reason', err))


def run(url, key, calls=CALLS, send_fn=send, sleep_fn=time.sleep, out=print):
    """Make every call, trying a bad answer again after a wait. Returns [(label, verdict, note)]."""
    results = []
    for label, path, body in calls:
        verdict, note = 'bad', 'not tried'
        for attempt in range(ATTEMPTS):
            if attempt:
                sleep_fn(WAITS[attempt - 1])
            started = time.monotonic()
            status, text = send_fn(url, key, path, body)
            verdict, note = classify(status, text)
            out('%-24s try %d: %-6s %s (%d ms)' % (label, attempt + 1, verdict, note,
                                                   int((time.monotonic() - started) * 1000)))
            if verdict != 'bad':
                break
        results.append((label, verdict, note))
    return results


def check(url, key, send_fn=send, sleep_fn=time.sleep, annotate=None, summary_path=None, out=print):
    """Run the calls, report, and return the exit code: 0 when every call reached the database.

    annotate and summary_path default (None) to what GitHub Actions asks for; False and '' switch them off.
    """
    if annotate is None:
        annotate = bool(os.environ.get('GITHUB_ACTIONS'))
    if summary_path is None:
        summary_path = os.environ.get('GITHUB_STEP_SUMMARY')
    results = run(url, key, CALLS, send_fn, sleep_fn, out)
    bad = [label for label, verdict, _ in results if verdict == 'bad']
    if summary_path:
        with open(summary_path, 'a', encoding='utf-8') as fh:
            fh.write('| call | answer |\n|---|---|\n')
            for label, verdict, note in results:
                fh.write('| %s | %s: %s |\n' % (label, verdict, note))
    if bad:
        out('FAIL: %d of %d calls got no healthy answer: %s. %s' % (len(bad), len(results), '; '.join(bad), PAUSED_HELP))
        if annotate:
            out('::error title=Supabase project is not answering::%d of %d calls failed. %s'
                % (len(bad), len(results), PAUSED_HELP))
        return 1
    out('PASS: the project answered all %d calls' % len(results))
    return 0


def main():
    try:
        url, key = load_config()
    except (OSError, ValueError) as err:
        print('FAIL: ' + str(err))
        return 1
    print('Calling %s as an anonymous visitor: %d reads, up to %d tries each' % (url[len('https://'):], len(CALLS), ATTEMPTS))
    return check(url, key)


if __name__ == '__main__':
    sys.exit(main())
