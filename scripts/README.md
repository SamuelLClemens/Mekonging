# scripts/

No build step and no `node` on the machine this is developed on. Everything here is either
Python 3 (no dependencies, run it directly) or a browser module you import in the page.

## Before every commit

Seventeen guards, plus the content validator below. Each one exists because the failure it catches actually shipped. Run all of
them; each prints one line and exits non-zero on failure.

```bash
for g in js-syntax imports lazy-data preloads ui-strings month-arrays contrast skins spacing place-dupes undefined net-gates sources secrets; do
  printf '%-14s ' "$g"; python3 scripts/check-$g.py | tail -1
done
python3 scripts/check-place-fields.py --assert
python3 tools/style-tiles/port-themes.py --check
python3 scripts/check-cache-version.py --base feat/scaffold-bangkok-slice
```

The same seventeen also run in CI, from `.github/workflows/guards.yml`, on every pull request into
`feat/scaffold-bangkok-slice` and on every push to it. CI runs every guard even after one
fails, prints the full output of each failure, and fails the check if any guard does. On a
pull request `check-cache-version` compares against `origin/feat/scaffold-bangkok-slice`; on a
push it compares against the commit the branch pointed at before the push. CI is the backstop,
not the first check: run the guards before you commit. The workflow keeps its own copy of the
list above, so a new guard goes in both places.

| guard | catches | why it exists |
|---|---|---|
| `check-imports` | a named import with no matching export | a file split leaves them behind and the module simply never loads |
| `check-undefined` | an identifier used but never declared, imported or parametered | ES modules are strict mode, so this is a ReferenceError waiting for the right tap. Caught `wxMetric` and `weatherKey` — the same refactor missed them two comments apart |
| `check-net-gates` | an `online()` gate that can render nothing | shipped three times in three files: Home lost its weather section, rates froze 8% out, and Talk lost live translation entirely |
| `check-lazy-data` | a route reading a lazy data module it does not gate | the read succeeds against an empty default, so a visa screen with no visa rules still looks like a visa screen |
| `check-preloads` | `<link rel=modulepreload>` drifting from the real eager graph | cold-start cost, and the list is hand-kept |
| `check-ui-strings` | the 29 language tables disagreeing on keys | a missing key falls back to English silently |
| `check-month-arrays` | a month claimed by an array but not by the record's own prose | the two are written by different hands and drift |
| `check-place-fields` | inconsistent figures, broken afterDark contract | |
| `check-place-dupes` | duplicate ids, new name collisions | a merged place silently deletes travellers' saved data |
| `check-js-syntax` | a JavaScript file that does not parse | every other guard reads JavaScript with regular expressions, so a stray token passed them all and the module never loaded. Uses `node --check` in CI and the macOS JavaScriptCore shell locally; it self-tests the parser on a broken module and script first, so it cannot pass without checking |
| `check-sources` | homepage-only place citations and unsourced routes getting WORSE | the 2026-10-02 content-truth audit found 5 of 10 spot-checked places contradicted their own cited source; this ratchets the two structural gaps behind that (a citation that is just a homepage, a route with no source at all) so they can shrink but never silently grow |
| `check-contrast` | text below its WCAG AA threshold on any of the seven skins | `--good` was unreadable on all four dark skins for months |
| `check-skins` | a theme id that `js/theme.js`, the CSS blocks, the Settings picker, the first-paint script or the default profile disagree about | an unknown skin falls back to the default without any page failing, so a renamed or half-added theme would ship silently. Added with the retro redesign's theme table |
| `port-themes.py --check` (in `tools/style-tiles/`) | the generated theme block at the end of `css/style.css` differing from what `round2.json` produces | the four regional themes' values are ported by a script, never typed; a hand edit to the block, or to `round2.json` without re-running the script, would ship a palette no one measured |
| `check-spacing` | more inline spacing declarations than a file's ceiling | a ratchet: 651 inline margins, none using the `--sp-*` scale |
| `check-cache-version` | `APP_VERSION`/`CACHE_VERSION` not moved when a shipped asset changed | the service worker is cache-first, so a stale version means nobody gets the fix |
| `check-secrets` | a whole secret key in any file git would commit: a Supabase secret key, a service-role JWT, a Resend key, a PEM private key, a literal assigned to a `SERVICE_ROLE`, `VAPID_PRIVATE` or `TURNSTILE_SECRET` name, or a publishable key outside `js/market-config.js` | the site deploys from this repository, so a committed secret is published (docs/EXCHANGE.md §2, added in M3a before any sign-in code). It matches whole keys, not prefixes, so the design docs pass; it prints file, line and kind but never the value; and it self-tests on planted fakes first, so it cannot pass without checking. If it fires, rotate the key before removing it |
| `check-market-sql` | a Supabase SQL file (`supabase/**/*.sql`) that is not pure ASCII (from 002 on), has unbalanced quotes, dollar quotes or brackets, an unmatched `begin` and `end;`, a migration without `begin;` and `commit;`, a table without `enable row level security`, a function without `set search_path = ''` or never named in a `revoke execute`, or a `private.contact_hit` pattern that lets a phone number, email, link or handle through (or refuses an ordinary price or date) | there is no Postgres on this machine and the owner runs the SQL by hand, so a typo costs a round trip. Migration 001 reached the database garbled by a clipboard (001b repaired it), which is why the files stay ASCII. It runs the contact-detail patterns in Python, read out of the SQL, so it proves the logic and not Postgres's regex engine; the owner's run of `supabase/tests/002_rls.sql` proves that. It self-tests on broken samples first, so it cannot pass without checking |

`check-spacing.py --update` lowers a file's ceiling after you have removed declarations.
`check-place-fields.py` and `check-lazy-data.py` both take `--report` for the derived data.

## Content validator (in CI)

`scripts/validate.mjs` (`npm run validate`, needs Node) checks required fields, `verified` stamps,
low-to-high price ranges and the diet rules across every country's places, dishes and prices. It
broke at PR #39 when `LANGUAGES` moved to `js/data/phrasebooks.js`, and once repaired it still read
only the eager data: places and dishes are lazy, so it passed over empty lists. It now calls
`loadAllCountries()` first (17,927 checks instead of 2,609).

It joined CI in slice D1 (2026-10-12) once its 46 errors were fixed: 35 Thai stay cards got
`whyItFits`, 8 Lao places got the `low`/`high` their own notes state, and the dish category `veg`
became `street`. The 2 route errors were the validator's: a flight priced "from US$68" has
`high: null`, which `range()` prints as one figure. A route option may now give an explicit
`high: null`, with a number `low` (a "from" fare) or `low: null` (quoted on request). Undefined
fields and real inversions still fail. `isLocal: false` is allowed (owner, 2026-10-12).

There is no Node on the development machine. Run it locally under JavaScriptCore before pushing:

```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -m scripts/validate-jsc.mjs | tail -2
```

## Sweeping every screen

`route-sweep.js` visits all 73 real routes and reports what is broken. It needs a live DOM, so
it runs in the page rather than on the command line:

```bash
python3 scripts/serve.py 8817
```

Then, in the console or Claude Code's Browser pane:

```js
const { routeSweep } = await import('/scripts/route-sweep.js');
await routeSweep();
```

It audits **controls**, not just content: every fold is opened first (so nothing hides inside a
collapsed section), then it reports controls that arrive disabled, controls with no accessible
name by any mechanism, controls that are operable but have no size, and any `<summary>` that
has become a grid or flex ITEM of its parent. Those last two checks exist because two
regressions shipped in three releases — Talk's lesson audio disabled on every language, and
the You hub's quick-access row stacked into one column — and both were catchable without
clicking anything. Both are negative-tested: reintroduce either and the sweep names it.

`routeSweep({ clicks: true })` additionally presses screen buttons and reports what throws.
It is opt-in and refuses anything whose accessible name suggests it deletes, sends, exports or
spends, so the default pass stays safe to run against real data.

Read its header before trusting a result — it documents the traps that made earlier
hand-written versions of this sweep report confident nonsense, including the one where a
hidden page computes no layout at all and every width check silently inverts.

## Generators

`build_*.py` and `match-osm-access.py` regenerate data files from source data.
`build-sw-manifest.py` and `build-pack-sizes.py` regenerate the generated blocks in `sw.js` and
`js/offline-pack.js` (the field guide's size per tier) with `--write`; `check-cache-version.py`
runs both in verify mode.
`derive-place-fit.py` and `verify-hospital-countries.py` are one-off derivations kept for
the next refresh. `serve.py` is the static server used for every local check.

`build-market-cities.py` builds the shared Market's city list (docs/EXCHANGE.md §3) from the place
records' cities and the route endpoints, and writes it twice so the phone and the server agree:
`js/data/market-cities.js` and the seed block in `supabase/migrations/001_accounts.sql` (plus the
count the RLS test expects). A route endpoint that is not a place city must be named in its
`ENDPOINTS` or `OUTSIDE` table, or the script stops. `--check` exits 1 when either output is stale.
A migration runs once, so after 001 a new city reaches the database only through a new migration.

`fetch-identify-photos.py` fills the identify guide's photos. `fetch-place-photos.py` fills place
photos from each place's own Wikipedia article (plan slice D3), one country per session:
`--suggest` lists candidate articles with their distance from the place, a person records the
right ones in `place-photo-articles.json`, `--fetch` stages the lead images (openly licensed,
about 800 px and 60 KB), `--sheet` makes contact sheets so every image is looked at, and
`--install` writes the accepted ones to `img/places/` and `js/data/photos.js`. Then run
`build-pack-sizes.py --write`. `--report` gives a country's coverage.

`fetch-local-names.py` fills a place's `localName` (plan slice D4). It starts from the English
article already reviewed for the place (`place-photo-articles.json`, or a page the record cites,
or the top search hits for places never reviewed), asks Wikipedia for that article's title in the
country's own language and Wikidata for its label, and a person records the right ones in
`local-names.json` with their source. `--suggest` exits 1 if any lookup failed, because a failed
lookup looks like "no local name". `--install` inserts each accepted name before the record's
`categories` line, in the record's own key style (the place files mix JS keys and quoted keys).
Then bump the version and run `build-pack-sizes.py --write` and `build-sw-manifest.py --write`.

`fetch-place-citations.py` gives a homepage-only place record a page about the place (plan slice
D5), one country per session. `--report --list` shows each record's lane; `--suggest` proposes the
article reviewed in D3 (or search hits with their distance from the card) and the Wikivoyage page
for the card's city, and exits 1 if a lookup failed. A person opens each page, keeps it only if it
names the place, and records it in `place-citations.json` (`add`, or `swap` for the same
organisation's own page) or files the record under `open` with the reason. `--install` edits each
`sources` array in place, keeping its format (the files use one-line, per-entry and per-key arrays),
and fails if a decided record is still homepage-only. Then lower the baselines in `check-sources.py`
and bump the version. TAT, Michelin and 12Go block curl; open their pages in the in-app browser.
