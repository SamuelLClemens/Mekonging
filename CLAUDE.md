# Mekong (Mekonging) — project rules for Claude

An offline-first travel PWA for Thailand, Vietnam, Cambodia and Laos: plain ES modules, no build step, no
framework. Live at www.mekonging.com. Remote: github.com/SamuelLClemens/Mekonging. Read this file and the
relevant section of the docs below, not the whole repo.

## Environment
- No `node` and no bundler. Guards are dependency-free Python 3. `scripts/validate.mjs` needs Node and runs in CI; run it
  locally with `jsc -m scripts/validate-jsc.mjs` (see scripts/README.md).
- Parse-check a JS file with macOS `jsc -m <file>` (it links the whole import graph; `jsc` is not on PATH, it is
  `/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc`). A `ReferenceError` about
  `navigator` means it parsed fine. `check-js-syntax` parses every tracked file; still load the app.
  It parses a file as a module only if it has a static `import`/`export`; a top-level-await-only file needs `export {};`.
- Preview: `preview_start {name:'mekong'}` runs `python3 scripts/serve.py 8742` (no-cache). It reads the PARENT folder's
  `.claude/launch.json`, never a worktree's: add `bash -c "cd '<worktree>' && python3 scripts/serve.py <port>"` there.
- The in-app browser pane is always `document.hidden`: timers are clamped, `javascript_tool` times out at 30 s, maps
  never paint and layout reads 0. Measure layout and take screenshots with headless Chrome over CDP, not the pane.
- `fetch-place-photos.py` (`--suggest`, `--fetch`) exits 0 even when curl cannot resolve Wikipedia. Grep its log for
  `Could not resolve host` and rerun before reviewing (Laos: 68 of 163 lookups failed on the first pass).
- `gh` is installed and authenticated. `curl`/Python TLS to some hosts fails here (OSRM, Overpass): use curl with a
  descriptive User-Agent.
- Overpass is unreliable from this machine: overpass-api.de times out and a mirror returned HTTP 500 on 10 of 12 queries.
  Nominatim name search found a native-script name for 1 of 12 places. Test an OSM lane on a dozen places before planning one.
- tourismthailand.org (403), guide.michelin.com, 12go.asia (202 bot check), whc.unesco.org and travelfish.org (403) block
  curl but load in the in-app browser; read them there with `javascript_tool` on `document.body.innerText`. vietnam.travel
  answers curl, and its sitemap index lists every board page (D5 found 50 same-organisation pages through it). futabus.vn
  refuses automated browsers outright ("turn off Developer Tools").
- `sources` arrays come in five formats (one line, per entry, per key, trailing commas, single quotes): edit them with
  `scripts/fetch-place-citations.py --install`, which keeps each one's format, not with a regex.
- Keep this project off `~/Desktop`, `~/Documents` and `~/Downloads` (macOS permission denials).
- Headless Chrome here needs `--no-sandbox` (its network sandbox cannot open sockets, so a load of 127.0.0.1 hangs) and a
  profile outside `/private/tmp`. The scratchpad is wiped when the app restarts: keep drivers in `~/Library/Caches/`. A fresh profile's first minute is not representative (the service worker is still installing): wait for `caches` to hold the files under test.
- No Postgres here (the owner declined a local install, 2026-10-19): Supabase SQL is reviewed by reading and run by the owner
  in the SQL editor. A PR whose code needs that SQL opens as a draft until the owner's run passes (PR #125 merged first).
- Market SQL rules: no policy names `owner` (they call `private.owns` and `private.can_see`); a client picks a listing's id and reads it back, because `INSERT ... RETURNING` is refused; every read names its columns. `scripts/check-market-sql.py` reads the SQL.
- Market SQL tests act as role `authenticated` or `anon`, which cannot call `private.*` helpers (002 revokes them): write dates inline, never `private.today()`, in dynamic SQL. Append to a `text[]` only with a text expression: a bare `'literal'` after `||` is read as an array literal (002's first run, 2026-10-20).
- `pbcopy`/`pbpaste` in Claude's shell run without a UTF-8 locale and turn non-ASCII into Mac Roman mojibake (migration 001's Thai
  terms arrived garbled, fixed by 001b): always `LANG=en_US.UTF-8 pbcopy`, and write SQL for the owner in ASCII (`U&'...'`, `chr()`).

## Branches and delivery
- There is no `main`. `feat/scaffold-bangkok-slice` is the integration and production branch (auto-deploys).
  Never push it directly: feature branch, then `gh pr create` into it. Merges are merge commits, not squashes.
- Push finished, verified work and open the PR without asking. One open PR at a time unless asked to batch.
  Branches that touch the same line (version, manifest) are stacked, not parallel.
- `git fetch origin` before any claim about merge or PR state. Compare against `origin/feat/scaffold-bangkok-slice`,
  never the local branch name (it goes stale per worktree).
- The main checkout is shared by several sessions. Do feature work in a worktree. Before every commit run
  `git branch --show-current`, `git status` and `git worktree list`. Stage named files only.
- Omit AI-attribution lines in commits and PR bodies (a plugin hook bans them; the owner has not ruled).
- Never commit secrets, keys or the personal poster reference image.

## Versioning (a file reaches users only when its hash moves in the manifest)
- Changing shipped `.js`, `.css`, `.html` or the web manifest: bump `APP_VERSION` (js/main.js) and `CACHE_VERSION`
  (sw.js) together, then run `python3 scripts/build-sw-manifest.py --write`. Scripts, `tools/` and
  `Mekonging Xcode/` changes do not bump.
- A stale manifest ships nothing to returning users, silently. Never hand-edit the generated MANIFEST block.
- Adding a photo or pack content: run `python3 scripts/build-pack-sizes.py --write`.
- Lazy data modules: put new exports in a NEW file. An open app keeps old eager modules after a deploy, and a new
  export imported by an old lazy module spins forever.

## Guards (run before every commit; CI runs the same list)
```bash
for g in js-syntax imports lazy-data preloads ui-strings month-arrays contrast skins spacing place-dupes undefined net-gates sources secrets market-sql offline-boot font-sizes icons emergency-world; do
  printf '%-14s ' "$g"; python3 scripts/check-$g.py | tail -1
done
python3 scripts/check-place-fields.py --assert
python3 tools/style-tiles/port-themes.py --check
python3 tools/style-tiles/derive-viz.py --check
python3 scripts/check-cache-version.py --base origin/feat/scaffold-bangkok-slice
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -m scripts/validate-jsc.mjs | tail -1
```
- `scripts/README.md` explains each guard and the failure that put it there. A new guard goes in it AND `.github/workflows/guards.yml`.
- Pass an `origin/` base to `check-cache-version.py` and sanity-check its changed-file list before trusting a PASS.

## Layout
- `js/main.js` is still about 7,800 lines. Do not add to it: put new code in `js/screens/<name>.js` (one per screen,
  lazy) or a focused module. Target a ceiling of ~1,500 lines per file. When extracting, move by function name,
  move module `let` state with the code, and let `check-undefined` list the missing imports.
- `js/data/` holds the datasets (places per country, routes, firstaid, emergency numbers, islands). Data for a route is
  lazy: a screen that reads it must be listed in `NEEDS_COUNTRY_DATA` in main.js or it shows a false empty state on a
  deep link. `check-lazy-data` enforces it.
- Place records mix JS keys (`name:`) and JSON-style quoted keys (`"name":`; all 97 of those are in the `.ext.js` files).
  A regex or an edit written for one style silently misses the other; `scripts/fetch-local-names.py` handles both.
- `js/nav-groups.js` is the single manifest for feature navigation; every feature has one label and one home.
- The offline place list (`js/data/gazetteer.<cc>.js`, built by `scripts/build-gazetteer.py`, searched by `js/place-search.js`)
  is never added to `WEATHER_SPOTS`. A picked list place, or a live fix more than 15 km from an anchor (`js/fix-place.js`), rides beside its nearest anchor as `focusSpot().place`.
- `js/state.js` is the on-device store. Schema changes bump its version. Deleting or merging a place record also needs a
  line in `js/data/place-merges.js` in the same commit, or travellers' saved data is lost.
- The journey screen builds its stops from trail points, journal entries and trip stops. A change to an entry's or trip stop's stop is
  a journey override (`js/trail.js`, `profile.trail.over`), never an edit to the entry; `js/screens/journey-edit.js` is the one stop form.
- `js/theme.js` plus `DESIGN_SYSTEM.md` own colour and skins; the default is "Mekong Retro". `css/style.css` is the stylesheet. The Market's rules are in `css/market.css`, loaded lazily by `js/screens/market-parts.js` (`check-contrast` reads it).
- `css/refined.css` (S1) holds the refined tokens and components (`--viz-*` generated). The refined `--fs-*` scale applies only inside `[data-refined]`; R1 to R3 add it per screen group. New chrome uses `icons/ui.svg` (`js/icons.js`), new sizes use `--fs-*`.
- `Mekonging Xcode/` is a live iOS WKWebView wrapper (`sync-web.sh` copies the web app in). Never delete or edit it as
  a side effect; exclude it from greps.

## Conventions
- UI copy is brief and tight. No loose help text: it goes behind `screenHint` (the info icon, `js/ui-widgets.js`).
- Every screen's sections fold automatically in `mount()`. Opt out with `data-nofold`; never nest a `<details>` inside a
  `<summary>`. Hold child nodes, not the card, in handlers (folding detaches the card element).
- Money goes through `money()` in `js/util.js` only (Intl has no symbol for THB, KHR or LAK).
- Every "now" decision uses `regionNow()` (UTC+7), not the phone clock. Saved forecasts are capped (keep-set).
- Any sound registers with `js/audio-control.js` so one thing plays at a time.
- MapLibre: a `['zoom']` curve must be the top-level paint expression. `['+', curve, 3]` is rejected with a console
  error and the layer is never added (route casing, PR #100); give each width its own `interpolate`.
- A new city needs an anchor in `WEATHER_SPOTS` (js/weather.js, with `hub` where it is a hub), or places rank under the wrong
  "Nearby" city. Anchors are cities that have place records.
- A "missing city" can be a mislabelled `city` field: check a single-record city's coordinates against its source,
  and search for the place's other names (Banteay Prey Nokor = Wat Nokor Bachey) before adding an anchor (D2).
- A gated feature (`online()`, consent, country data) must still render something when the gate is shut.
- The router can render a route twice while the app starts: async screen work checks `isConnected` after each await and
  shares one in-flight request (the Market's sign-in link, `js/screens/market-account.js`).
- Sourcing: cite every entry compactly with a real URL. Better to leave a gap open than publish a number traced to an
  aggregator's unsourced synthesis. Pai is deferred until the owner says.
- Place photos come only from the place's own Wikipedia article, via `scripts/fetch-place-photos.py` and the reviewed
  `scripts/place-photo-articles.json`. Never keyword-search an image; a place with no article of its own keeps no photo.
- Honest labels: the ATM layer says "free" only for Vietnam/VPBank and "lowest fee" elsewhere. The first-aid guide prints
  no phone numbers; hotlines are described in prose.
- A topbar title gets about 102 px at 375 px wide; never prefix it with a flag or emoji.
- Translations: th, vi, km, lo agree on keys, the other 25 may omit one (decision 30); a gap shows English (`check-ui-strings`). Emergency and first-aid
  text is data: a lazy `js/data/safety-text.<code>.js` per host language. Coverage is `python3 tools/lang-check/lang-check.py` (F5, F5b).

## Verification (a fix is done when shown on the real rendered screen)
- Reload for real after a code change: `location.reload()` plus clearing the service worker and caches. A hash-only
  navigate does not reload the SPA, and a zombie service worker can serve stale files.
- State resets do not work by clear-then-reload (`state.js` flushes the live store on `pagehide`). Use a fresh origin
  (`127.0.0.1` instead of `localhost`) or mutate the store in memory via `import('/js/state.js')`.
- Check at 375 px wide. Treat card-heavy screens' `scrollHeight` and `innerText` as unreliable (`content-visibility`).
  Prove a refactor is a no-op with a computed-style digest keyed by element path.
- For route sweeps, import `scripts/route-sweep.js` (never paste it: the CSP forbids eval) and wait for a
  MutationObserver hit after each navigation before reading the DOM.
- Route-graph work: test in a brand-new tab loaded directly at `#route` (the graph memoizes on first call).
- Headless Chrome pages turn `document.hidden` when macOS display sleep starts mid-run, and a hidden pass undercounts controls (`#settings` read 11 against 111). Keep the display awake and assert `document.hidden === false` for every route (Q1, `docs/AUDIT_375.md`).
- Camera screens run end to end in headless Chrome: `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream
  --use-file-for-fake-video-capture=<x>.mjpeg` plays a single JPEG as the camera. Attach to workers too
  (`Target.setAutoAttach`, flatten): a blob worker's requests and CSP errors never reach the page session (M3a).
- Market screens: `?market=fixture` on 127.0.0.1 answers from `js/market-fixture.js`; Turnstile (test key locally) sits in a
  closed shadow root, so read its token from `input[name=cf-turnstile-response]`.
- `html` and `body` set `overflow-x: hidden`, so `scrollWidth - clientWidth` is always 0. Measure overflow from box edges, not from scroll width. `route-sweep.js` reports false zero-size controls on `content-visibility` cards until they are scrolled into view.

## Docs map (most are history; read only what the task names)
- `scripts/README.md`: the guards. `DESIGN_SYSTEM.md` and `VISUAL_DIRECTION_PROMPT.md`: theme, all four phases merged.
- `AUDIT_REPORT.md` section 7: the 11 audit slices (all merged). `WORK_ORDER.md`: the 15-item owner list in slices.
- `BEST_TOOL_PROMPT.md`: the program prompt for session 0. Its output, `docs/PROGRAM.md`, holds the open-item register, the style brief and the feature backlog (T1 to T15); every slice updates it.
- `MASTER_BUILD_PROMPT.md`, `OVERHAUL.md`, `UX_OVERHAUL_PROMPT.md`, `MEKONGING_REFACTOR_*`: earlier planning, now history.

## Open items
- A full multi-country offline routing engine is wanted by the owner but unscoped (a Valhalla-WASM spike was 10 MB with
  tiles that cannot be built on this machine). It needs its own design pass first.
- Transport gaps left open on purpose for lack of a checkable source: Khun Yuam, Mae Chaem, Preah Vihear.
- Session discipline: one shipped slice per session, then `/handoff`. Start the next with `/slice`.
