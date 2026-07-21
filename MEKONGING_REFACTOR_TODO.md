# MEKONGING_TODO.md

Checkpoint list of GENUINELY-NEW work only (already-shipped items excluded). Each task is small and independently shippable. Ordered within each priority by value/effort. Tick the box and bump `APP_VERSION` + `CACHE_VERSION` after each shipped wave.

Baseline: `mk-v0.265.0` · branch `feat/deep-content` → merge `--no-ff` into `feat/scaffold-bangkok-slice` · never `main`.

---

## Priority 1 — Information Architecture & Layout
- [x] **1.1** (shipped mk-v0.267.0) Regroup country-hub "More for &lt;country&gt;" 26 tiles into 4 labelled sub-clusters (Get oriented / Getting around / Eat & drink / On the ground) — `js/main.js` ~2027-2060 (also groups the identify tools). [M]
- [x] **1.3** (shipped mk-v0.268.0) De-duplicate: keep `rightNowSection` on Home only (drop from meHub 1656); keep "Coming up" on YOU only, replace Home copy (1530-1540) with a one-line "next reminder →". [S]
- [x] **1.2** (shipped mk-v0.268.0) Resolve Signature-Sights vs Explore-mini-map redundancy on the country hub (js/main.js:1998-2024): compact photo teaser high, demote/fold full mini-map below History/guide. [S]

## Priority 2 — Feature Discovery & Guidance
- [x] **2.6** (shipped mk-v0.266.0) Add WHO-sourced rabies / animal-bite first-aid entry to `FIRST_AID` + SOS (js/main.js:8740-8770, sources 8790) — SAFETY-CRITICAL, web-verify + cite. [S]
- [~] **2.5** (partial mk-v0.269.0: label honesty + caveat done; 90-min cap deferred pending verified corridor drive times) Near-Me: set `NEAR_MAX_MIN=90` (js/main.js:648), add data-driven `roadFactor` corridor override, soften `driveLabel` to disclose straight-line estimate + "mountain road, allow longer". [M]
- [x] **2.1** (shipped mk-v0.270.0) Seed a default focus city for no-fix/no-focusSpotKey fresh profiles so `rightNowSection` shows real picks with honest "showing &lt;city&gt;" label (js/main.js:773, 778-790). [M]
- [x] **2.2** (shipped mk-v0.271.0) Collapse both Home tool decks by default for fresh profiles (`profileIsSet()` js/main.js:3578); promote one phase-aware next-best-action via `phaseLead()` (1332). [S]
- [x] **2.3** Auto-infer + pre-select journey phase from GPS fix + `tripStartISO()` (js/main.js:1370); reframe heading as correctable statement. [M] — shipped mk-v0.272.0 (inferPhase() reads dates+fix, never persists; heading now "You are…"/"Looks like you are…"; phaseSelector(active)).
- [x] **2.7** New `scamsScreen(cc)` / `#scams-<cc>`: aggregate existing scattered scam fields + curated web-verified top-list; link from SOS + arrival. [M] — shipped mk-v0.273.0 (new web-verified js/data/scams.js top-list per th/vi/kh/la + folds in VISA scams + arrival pointer; TH tourist-police 1155; linked from SOS + arrival hub; sources cited).
- [ ] **2.12** Drop pre-confirm on reversible done/skip (js/main.js:593-594); optimistic action + reusable "Undo" toast. [S]
- [ ] **2.9** Search zero-state launchpad: example-query chips + capped-5 `prefs.recentSearches` (js/main.js:8554-8557). [S]
- [ ] **2.4** Dismiss-once contextual hints: `prefs.hintsSeen` + `oneTimeHint(key,text)` on Home/Places/first-place-detail/right-now/phrasebook (NOT a spotlight engine). [M]
- [ ] **2.8** Trip-day / story-so-far anchor line on the daily strip when a trip start exists (js/main.js:7381; tripStartISO 1370) — no streak guilt. [M]
- [ ] **2.10** Add eSIM line to each country's SIM row in `essentials.js` (consistency with arrival hub js/main.js:2161). [S]
- [ ] **2.11** Surface `verified` date badge + >6-month staleness nudge on visa + crossings screens (js/main.js:5236). [S]

## Priority 3 — Media & Accessibility
- [ ] **3.1** Multi-speed read-aloud reader: thread `{rate}` through `speak()/say()` (js/tts.js:49); reusable `readAloud(getText)` play/pause + 1.0/1.25/1.5/2.0x, sentence-chunked, cancel on nav; drop on history/guide/province/first-aid; persist rate. [M]

## Priority 4 — Code Quality & Technical Debt
- [ ] **4.1** Fix photo object-URL leak: revoke read-only thumbs on `img load` (js/main.js:4647,5784,5854,5865,5871,5952,6334); revoke editor thumbs (6059) via `liveCleanup` (11029). [S]
- [ ] **4.2** Debounce localStorage `save()` (js/state.js:212-233) + drop per-save `JSON.parse` of prev blob; immediate flush on `pagehide`. [S]
- [ ] **4.7** Build `confirmAction()` on `openModal()` (js/main.js:3048); route the ~20 destructive `window.confirm` sites through it. [M]
- [ ] **4.4** Replace `uid()` with `crypto.randomUUID()` (js/state.js:504-509); injectable id source for tests. [S]
- [ ] **4.5** Memoize `idb.open()` (js/idb.js:5-12) — one cached connection. [S]
- [ ] **4.3** Country-scoped dynamic `import()` of `places.<cc>.ext.js`/prices/routes/food on country select, preload step (js/main.js:4-79; mirror map.js). [M]
- [ ] **4.8** Extract reusable `foldable(summary, body, {open})` helper; replace inlined `<details>` blocks incrementally. [S]
- [ ] **4.6** Incrementally split `main.js` monolith into `screens/*` + `ui/*` modules; add each to sw.js PRECACHE; sequence after 4.3. [L, multi-wave]

---
_Skipped (already shipped, verified): Home Signature-Sights removal; Home layout order; collapsible `<details>` headings; drive-TIME near-me ceiling + distant-hub exclusion; trust/consent architecture. Skipped (premise false): AI/scanner centralisation._
