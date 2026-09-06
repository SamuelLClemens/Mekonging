# scripts/

No build step, no CI, no `node` on the machine this is developed on. Everything here is
either Python 3 (no dependencies, run it directly) or a browser module you import in the page.

## Before every commit

Twelve guards. Each one exists because the failure it catches actually shipped. Run all of
them; each prints one line and exits non-zero on failure.

```bash
for g in imports lazy-data preloads ui-strings month-arrays contrast spacing place-dupes undefined net-gates; do
  printf '%-14s ' "$g"; python3 scripts/check-$g.py | tail -1
done
python3 scripts/check-place-fields.py --assert
python3 scripts/check-cache-version.py --base feat/scaffold-bangkok-slice
```

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
| `check-contrast` | text below its WCAG AA threshold on any of the seven skins | `--good` was unreadable on all four dark skins for months |
| `check-spacing` | more inline spacing declarations than a file's ceiling | a ratchet: 651 inline margins, none using the `--sp-*` scale |
| `check-cache-version` | `APP_VERSION`/`CACHE_VERSION` not moved when a shipped asset changed | the service worker is cache-first, so a stale version means nobody gets the fix |

`check-spacing.py --update` lowers a file's ceiling after you have removed declarations.
`check-place-fields.py` and `check-lazy-data.py` both take `--report` for the derived data.

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

Read its header before trusting a result — it documents the four traps that made earlier
hand-written versions of this sweep report confident nonsense, including the one where a
hidden page computes no layout at all and every width check silently inverts.

## Generators

`build_*.py` and `match-osm-access.py` regenerate data files from source data.
`derive-place-fit.py` and `verify-hospital-countries.py` are one-off derivations kept for
the next refresh. `serve.py` is the static server used for every local check.
