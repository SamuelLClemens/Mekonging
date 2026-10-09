# Mekong (Mekonging) — project rules for Claude

An offline-first travel PWA for Thailand, Vietnam, Cambodia and Laos: plain ES modules, no build step, no
framework. Live at www.mekonging.com. Remote: github.com/SamuelLClemens/Mekonging. Read this file and the
relevant section of the docs below, not the whole repo.

## Environment
- No `node` and no bundler. Guards are dependency-free Python 3. `npm run validate` does not work (broken since PR #39).
- Parse-check a JS file with macOS `jsc -m <file>` (it links the whole import graph). A `ReferenceError` about
  `navigator` means it parsed fine. No guard parses JavaScript; also load the app.
- Preview: `preview_start {name:'mekong'}` runs `python3 scripts/serve.py 8742` (no-cache). Every worktree has its own
  `.claude/launch.json`; check the entry exists before relying on it.
- The in-app browser pane is always `document.hidden`: timers are clamped, `javascript_tool` times out at 30 s, maps
  never paint and layout reads 0. Measure layout and take screenshots with headless Chrome over CDP, not the pane.
- `gh` is installed and authenticated. `curl`/Python TLS to some hosts fails here (OSRM, Overpass): use curl with a
  descriptive User-Agent.
- Keep this project off `~/Desktop`, `~/Documents` and `~/Downloads` (macOS permission denials).

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
for g in imports lazy-data preloads ui-strings month-arrays contrast skins spacing place-dupes undefined net-gates sources; do
  printf '%-14s ' "$g"; python3 scripts/check-$g.py | tail -1
done
python3 scripts/check-place-fields.py --assert
python3 tools/style-tiles/port-themes.py --check
python3 scripts/check-cache-version.py --base origin/feat/scaffold-bangkok-slice
```
- `scripts/README.md` explains each guard and the failure that put it there. A new guard goes in the README AND
  `.github/workflows/guards.yml`.
- Pass an `origin/` base to `check-cache-version.py` and sanity-check its changed-file list before trusting a PASS.

## Layout
- `js/main.js` is still about 7,800 lines. Do not add to it: put new code in `js/screens/<name>.js` (one per screen,
  lazy) or a focused module. Target a ceiling of ~1,500 lines per file. When extracting, move by function name,
  move module `let` state with the code, and let `check-undefined` list the missing imports.
- `js/data/` holds the datasets (places per country, routes, firstaid, emergency numbers, islands). Data for a route is
  lazy: a screen that reads it must be listed in `NEEDS_COUNTRY_DATA` in main.js or it shows a false empty state on a
  deep link. `check-lazy-data` enforces it.
- `js/nav-groups.js` is the single manifest for feature navigation; every feature has one label and one home.
- `js/state.js` is the on-device store. Schema changes bump its version. Deleting or merging a place record also needs a
  line in `js/data/place-merges.js` in the same commit, or travellers' saved data is lost.
- `js/theme.js` plus `DESIGN_SYSTEM.md` own colour and skins; the default is "Mekong Retro". `css/style.css` is the stylesheet.
- `Mekonging Xcode/` is a live iOS WKWebView wrapper (`sync-web.sh` copies the web app in). Never delete or edit it as
  a side effect; exclude it from greps.

## Conventions
- UI copy is brief and tight. No loose help text: it goes behind `screenHint` (the info icon, `js/ui-widgets.js`).
- Every screen's sections fold automatically in `mount()`. Opt out with `data-nofold`; never nest a `<details>` inside a
  `<summary>`. Hold child nodes, not the card, in handlers (folding detaches the card element).
- Money goes through `money()` in `js/util.js` only (Intl has no symbol for THB, KHR or LAK).
- Every "now" decision uses `regionNow()` (UTC+7), not the phone clock. Saved forecasts are capped (keep-set).
- Any sound registers with `js/audio-control.js` so one thing plays at a time.
- A new city needs an anchor in `WEATHER_SPOTS` (js/weather.js, with `hub` where it is a hub), or places rank under the wrong
  "Nearby" city. Anchors are cities that have place records.
- A gated feature (`online()`, consent, country data) must still render something when the gate is shut.
- Sourcing: cite every entry compactly with a real URL. Better to leave a gap open than publish a number traced to an
  aggregator's unsourced synthesis. Pai is deferred until the owner says.
- Honest labels: the ATM layer says "free" only for Vietnam/VPBank and "lowest fee" elsewhere. The first-aid guide prints
  no phone numbers; hotlines are described in prose.
- A topbar title gets about 102 px at 375 px wide; never prefix it with a flag or emoji.
- Translations: 29 language tables must agree on keys (`check-ui-strings`), but agreement is not coverage; a screen can
  still render untranslated strings.

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

## Docs map (most are history; read only what the task names)
- `scripts/README.md`: the guards. `DESIGN_SYSTEM.md` and `VISUAL_DIRECTION_PROMPT.md`: theme, all four phases merged.
- `AUDIT_REPORT.md` section 7: the 11 audit slices (all merged). `WORK_ORDER.md`: the 15-item owner list in slices.
- `MASTER_BUILD_PROMPT.md`, `OVERHAUL.md`, `UX_OVERHAUL_PROMPT.md`, `MEKONGING_REFACTOR_*`: earlier planning, now history.

## Open items
- A full multi-country offline routing engine is wanted by the owner but unscoped (a Valhalla-WASM spike was 10 MB with
  tiles that cannot be built on this machine). It needs its own design pass first.
- Transport gaps left open on purpose for lack of a checkable source: Khun Yuam, Mae Chaem, Preah Vihear.
- Session discipline: one shipped slice per session, then `/handoff`. Start the next with `/slice`.
