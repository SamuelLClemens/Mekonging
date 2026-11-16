# tools/audit-375: the 375 px rendered-screen audit

One command measures every route of a tree at 375 x 812 in headless Chrome, in the light and the dark theme, and prints
the tables of `docs/AUDIT_375.md`: a headline table, a severity table, the findings that repeat, and one table per route
with both themes. Q1 (2026-10-19) wrote the driver and used it once; Q2 committed it so every later slice can print its
own before and after.

```bash
python3 tools/audit-375/run.py                    # this checkout, every route, both themes
```

It needs the system Python 3.9 and Google Chrome, nothing else. The first full run takes about **15 minutes** (156 cold
route loads and a long scroll of each page, two Chrome processes at once, on a loaded machine); `--only '#home,#sos' --brief` takes about a minute.

## What one run does

1. Keeps the display awake for its whole life (`caffeinate -d`). macOS display sleep flips headless pages to
   `document.hidden` mid-run and a hidden page undercounts controls (Q1: `#settings` read 11 against 111).
2. Serves the tree with its own `scripts/serve.py` on a free port (`--base` audits a server that is already up).
3. Derives the route list from `scripts/route-sweep.js` (every feature, every `#hub-*` door, the tab bar, `#market` and its
   four chips), or reads `--routes`. `{cc}` routes use `th`.
4. Runs the **positive controls** (`poscontrol.py`, `poslog.py`): a planted overflow, a low-contrast text, a 20 px button,
   a button under an overlay, a 404, a `console.error` and an exception must each be reported, or the run stops with
   exit 2. A detector that has never fired proves nothing when it reports zero.
5. Measures both themes in parallel (`--serial` to run them one after the other). Every route is a cold deep link
   (`/?q=<n>#route`) in a fresh Mekong Retro profile seeded through the live store; the page is scrolled top to bottom
   before and after every fold is opened, so `content-visibility` cards have boxes. Then it measures the journey map with
   two trip stops (the screen draws no map without a stop) and loads the legacy Market hashes.

   A route is measured only once its topbar is on screen (Welcome, the one route without a topbar, is named in
   `NO_TOPBAR` in `audit375.py`). A deep link boots through three placeholder screens, the splash, a "Loading <flags>"
   card and "Opening…", and on a loaded machine the DOM can go quiet before the screen lands: a route whose screen has
   not mounted in 15 s is loaded again, up to three times, and is then reported as incomplete with the reason. Before
   each scan the page script jumps every finite animation to its end state: the app's entrance motion (`riseIn`, `pageIn`)
   leaves text at a fraction of its opacity for up to half a second, and a card measured mid-fade reads as contrast 1.0.
6. Prints the tables and saves them as `report.md` in the run folder.

A load whose page reports `document.hidden` is **refused**: retried up to three times and, if it stays hidden, left out
of every table, named, and the run exits 3. No hidden measurement reaches a number.

Exit codes: 0 complete; 1 a route failed or never mounted; 2 setup failed or a positive control was missed; 3 a route stayed hidden.

## Reading the result

- **Headline table.** Routes affected, per measure, of the routes measured: overflow past the 375 px edge, console errors
  (the app's own, apart from failed requests), failed requests, controls covered by an overlay, contrast failures (WCAG AA,
  rendered colours), body controls under 44 x 44 px, map credits panel covering a pin when opened, and `route-sweep.js`
  flags other than informational ones. The line under it gives the light and dark contrast counts and the controls under 24 px.
- **Routes by severity.** One row per route. The score is a triage aid, not a measurement: overflow 100 + px, a console
  exception 50, a failed request 10, a covered control or a credits panel over a pin or 5% of the map 40, a contrast
  failure 10, a `route-sweep.js` flag 20, a control under 24 px 2, any other control under 44 px 1.
- **Per-route tables.** Type, detail, light value, dark value; `same` means the dark value equals the light one. An
  under-44 row gives the effective hit area (the control's own `::before` counted, a neighbour painted over it taken
  off) and the visual box in brackets.

## Before and after (a fix slice, Q3 to Q7)

```bash
python3 tools/audit-375/run.py --out-dir ~/Library/Caches/mk-audit-375/before-q3     # on the tip, before the change
# make the change, bump the version, then:
python3 tools/audit-375/run.py --baseline ~/Library/Caches/mk-audit-375/before-q3 --markdown /path/after.md
```

`--baseline` puts the earlier run's headline numbers beside this one's and lists any route added or dropped. The raw
results of the first audit are kept in `baseline-2026-10-19/`, so `--baseline tools/audit-375/baseline-2026-10-19` works
from any checkout. `--repo <tree>` audits another checkout or a detached worktree with this checkout's driver; that is how
`baseline-2026-10-19` was reproduced at its own commit (`1aa5876`), see `docs/AUDIT_375.md`.

The run folder (default `~/Library/Caches/mk-audit-375/<stamp>-<commit>/`, outside the repository) holds
`run-light.jsonl`, `run-dark.jsonl`, `variant-*.jsonl`, `routes.txt`, `routes-derived.json`, `redirects.json`, `meta.json`
and `report.md`. `report375.py <run-folder> [--baseline DIR] [--brief]` prints the tables again without a browser.
`--resume` continues an interrupted run in `--out-dir`.

## Files

| File | Role |
| --- | --- |
| `run.py` | The one command. |
| `audit375.py` | Measures routes for one theme and writes one JSON line per route load; refuses hidden pages. |
| `audit375-page.js` | The in-page measurement (overflow, controls and hit areas, covered controls, contrast, map credits panel). Evaluated through CDP, so the page CSP does not apply. |
| `report375.py` | Turns a run folder into the tables; `build()` and `render()` are importable. |
| `listroutes.py`, `redirects.py` | The route list from `route-sweep.js`; the legacy Market hashes. |
| `poscontrol.py`, `poslog.py` | The positive controls. |
| `shot.py` | A screenshot of a route (a finding is confirmed by eye before it is quoted). |
| `baseline-2026-10-19/` | Q1's raw results (contact addresses and phone numbers from the app data redacted), `routes.txt`, `routes-derived.json`, `redirects.json`, `meta.json`. |

`../cdp/cdp.py` is the shared stdlib Chrome client (see `../cdp/README.md`).

## What it does not cover

The same limits as `docs/AUDIT_375.md` (Method and limits): empty states only (a fresh profile, plus two trip stops for
the journey map), Thailand for the `{cc}` routes, no detail screens, sheets or dialogs, a machine with internet, and a
`div` made clickable by a script listener alone is not found. Q8 widens it.

## Traps

- **Machine load changes timing, not counts.** A route whose DOM does not go quiet within 6 s is reported as such in its
  table's note; the controls, contrast and overflow numbers do not depend on it.
- **Live data moves a few numbers between runs.** The Weather forecast and air-quality line (a toggle more or fewer, the heat-cell
  colours), the calendar month, the date on Home, and whether the credits plate on `#weather-th` is already collapsed. The
  controls under 44 px on every other route do not move. `docs/AUDIT_375.md` lists each difference between the reproduction and the first audit.
- **`#phrasebook` always notes "DOM still changing after 6 s".** The settle check (Q1's, and the one in `route-sweep.js`)
  reads any "Opening…" text as the router's placeholder, and the Phrasebook's own lesson line says "Opening…". Counts are unaffected.
- **The `#map` exception is intermittent.** Leaving `#map` raised a `getSource` `TypeError` in 1 of 4 runs (`js/map.js`,
  `setWeather`); a run that shows it and one that does not are both correct.
- **`html` and `body` set `overflow-x: hidden`**, so `scrollWidth - clientWidth` is always 0. The audit scans box edges instead.
- **Do not paste `route-sweep.js`.** The CSP forbids `eval`; the driver imports it from the served tree.
