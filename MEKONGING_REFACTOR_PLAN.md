# MEKONGING_REFACTOR_PLAN.md

Baseline: `mk-v0.265.0`, branch `feat/deep-content`. Vanilla ES6 modules, no framework, no build step. Strict CSP `script-src 'self'` — **all new behaviour lives in `.js` files, no inline scripts**. Offline-first, no CDN for required data, no fabricated travel facts. Deploy: work on `feat/deep-content` → merge `--no-ff` into `feat/scaffold-bangkok-slice` (only auto-deploying branch); never `main`. Every wave bumps `APP_VERSION` (js/main.js:197) **and** `CACHE_VERSION` (sw.js:10) in sync, and adds any new module to the `sw.js` PRECACHE list.

This plan is organised under the four directive priorities. Items already verified shipped are marked and NOT padded.

---

## Priority 1 — Information Architecture & Layout

### 1.1 Regroup the country-hub "More for &lt;country&gt;" 26-tile wall — GENUINELY NEW
- **Current status:** Flat, undifferentiated 26-tile grid behind one `<details>` (js/main.js:2027-2060; tiles array 2027-2054). Highest cognitive-load surface.
- **Change:** In the country hub renderer (`js/main.js`, around 2027-2060), split the single `tiles` array into 4 labelled sub-clusters, each an `h3` divider or nested `<details>`, ordered by arrival-journey frequency:
  - *Get oriented:* Just arrived, Guide, Best of, Map, Weather
  - *Getting around:* Getting around, Journey planner, Schedules, Between countries
  - *Eat & drink:* Food, Street food, Produce, Fair prices, Currency
  - *On the ground:* Things to do, Nature, Sounds, Pools, With kids, Festivals, Noticeboard, Worship, Phrasebook, Emergency, Saved
- **Constraints:** Pure array reorganisation; no new routes/data. Keep the top-level collapse.
- **Acceptance:** Every existing tile still routes; four labelled groups render; no duplicate/orphan tiles; identify-cluster (food/nature/sounds) sits together (subsumes 1.4). Verify in preview, 0 console errors.
- **Effort:** M

### 1.2 Resolve Signature-Sights vs Explore-mini-map redundancy on the country hub — PARTIAL (task #104)
- **Current status:** Signature strip (js/main.js:1998-2000) then Explore mini-map + city picker (js/main.js:2011-2024) render back-to-back — same heroes twice.
- **Change:** Pick one lead per intent. Keep a **compact** photo-forward Signature teaser high (emotional "why here"); demote the full Explore mini-map+city-picker below the History/guide cards (or fold it). Do NOT bury all imagery at the very end — behavioral lens warns against dopamine-forward loss. Hub should read: why-here → orient (map/cities) → tools.
- **Acceptance:** No two full-height overview blocks adjacent; a visual hook remains above the fold; city-picker still scopes Places. Preview-verified.
- **Effort:** S

### 1.3 De-duplicate Right-now + Coming-up across Home and YOU — PARTIAL
- **Current status:** `rightNowSection` on Home (js/main.js:1519) **and** meHub (1656); "Coming up" reminders on Home (1530-1540) **and** meHub (1641-1651).
- **Change:** One job per tab. Keep `rightNowSection` on Home (live "what now" lead), remove from meHub. Keep full "Coming up" on YOU (planning home); replace Home's copy with a compact one-line "next reminder →" linking to YOU.
- **Acceptance:** Each engine renders on exactly one tab; Home is shorter; links resolve. Preview-verified.
- **Effort:** S

### 1.4 Group the three "identify what's around me" tools — GENUINELY NEW (IA only)
- **Current status:** Food (js/main.js:2042), Nature (2047), Sounds (2048) scattered in the flat grid.
- **Change:** Absorbed by 1.1's "On the ground" / a dedicated "Identify & sense" sub-cluster. No new screen required (optionally a thin hub tile).
- **Acceptance:** The three appear adjacent under one label. Ships with 1.1.
- **Effort:** S (folded into 1.1)

### 1.5 Home Signature Sights removal — ALREADY SHIPPED, no action
- `homeScreen()` never calls `signatureSightsStrip()` (js/main.js:1494-1602). Done in mk-v0.263.0.

### 1.6 Home layout order & core-group ordering — ALREADY SHIPPED, minor polish only
- Deliberate order implemented (js/main.js:1494-1601). Optional polish: collapse Home mid-section cards (journey companion / backup nudge) to reduce phone scroll. Low priority; no rebuild.

---

## Priority 2 — Feature Discovery & Guidance

### 2.1 Fix time-to-first-value for skip-setup users — GENUINELY NEW
- **Current status:** No fix + no focus city → `rightNowSection` shows only the location-invite empty card (js/main.js:778-790); daily strip empty (7396-7399); no active phase (1509).
- **Change:** On a fresh profile with no GPS fix and no `focusSpotKey`, seed a default focus city (capital of the implied/last-scoped country, or an inline "Where headed first?" 4-country + city chip in the right-now card) so ranked picks render immediately with the honest "showing &lt;city&gt; — set location for exactly-here picks" label (approx path already exists, js/main.js:773). Convert the location prompt from precondition to value-upgrade.
- **Constraints:** No permission required; reuse existing scoring. Offline.
- **Acceptance:** Fresh install + declined GPS still shows real ranked picks with an honest label; enabling GPS upgrades to exact picks. Preview with a cleared profile, 0 errors.
- **Effort:** M

### 2.2 Reduce first-open cognitive load + one next-best-action — GENUINELY NEW
- **Current status:** Both tool decks default `open:''` (js/main.js:1585-1590) → 16 tiles; `phaseLead()` (js/main.js:1332) exists but is unused on Home.
- **Change:** Default the two decks COLLAPSED when `profileIsSet()` is false (js/main.js:3578); OPEN once the user has journal/budget/trip data. Promote a single phase-aware next-best-action above the decks via `phaseLead()`.
- **Acceptance:** Fresh profile shows collapsed decks + one recommended action; a profile with data shows expanded decks (power-user grid preserved). Preview-verified both states.
- **Effort:** S

### 2.3 Auto-infer & pre-select journey phase — GENUINELY NEW
- **Current status:** Phase defaults to `''` (js/main.js:1509); abstract question with no scaffolding.
- **Change:** Infer initial phase: GPS fix inside TH/VI/KH/LA → arrived/traveling; future-dated trip stops (`tripStartISO()` js/main.js:1370) → planning; else planning. Pre-select it; reframe heading as a correctable statement ("Planning your trip · change") keeping the segmented control.
- **Acceptance:** New user sees a sensible pre-selected phase, still switchable; inference matches fix/trip signals. Preview-verified.
- **Effort:** M

### 2.4 Scoped onboarding: dismiss-once contextual hints (NOT a spotlight engine) — GENUINELY NEW (task #106, scoped down)
- **Current status:** `welcomeScreen` is a static setup form (js/main.js:9925-10018); zero tour symbols. All four lenses: do NOT build WalkMe.
- **Change:** Add a `prefs.hintsSeen` map and a reusable `oneTimeHint(key, text)` that renders a small inline, self-dismissing callout the first time a key screen is reached — Home ("Everything works offline — tap Explore to pick a country"), Places ("Toggle List/Map, or sort Nearest-first"), first place detail ("Tap Find it for distance + directions"), right-now card, phrasebook. Seen-flags persist like the existing `geoAsked` pattern (js/main.js:9933).
- **Constraints:** Inline DOM only (CSP-safe); no overlay engine; each hint self-dismisses on tap.
- **Acceptance:** Each hint shows once, dismisses on tap, never returns; state persists across reloads. Preview-verified.
- **Effort:** M

### 2.5 Near-Me honesty + 90-min retune + terrain override — PARTIAL (task #105)
- **Current status (verified):** Drive-TIME ceiling genuinely enforced — ROAD_FACTOR=1.35, DRIVE_KMH=50, NEAR_MAX_MIN=**75**, DAYTRIP_MAX_MIN=180 (js/main.js:646-652); `scoreForNow` -Infinity beyond ceiling (707); distant hubs demoted to "Further afield" fold (2308-2309). It is a flat multiplier, NOT terrain routing: Pai→Chiang Mai estimates ~89 min vs real ~3 h. Do NOT rebuild the model.
- **Change:**
  1. Set `NEAR_MAX_MIN = 90` (js/main.js:648) to satisfy task #105.
  2. Add an optional data-driven per-place/per-corridor `roadFactor` override (default 1.35; ~2.0-2.5 for known mountain corridors: Pai/Mae Hong Son loop, Ha Giang, Sapa, Bolaven/Thakhek), reusing regions data. `estDriveMin` (js/main.js:650) reads the override when present.
  3. Soften the drive chip label (`driveLabel` js/main.js:654-663) to "~Xh by road (straight-line estimate; mountain routes take longer)"; append "mountain road, allow much longer" for flagged corridors.
- **Constraints:** No live routing engine / CDN. Data-only overrides, curated + web-verifiable.
- **Acceptance:** Cap is 90 min; a Pai pin near Chiang Mai no longer reads "~1h30m day trip"; label discloses estimate nature. Preview-verified with a known mountain pin.
- **Effort:** M

### 2.6 Rabies / animal-bite first aid — GENUINELY NEW, SAFETY-CRITICAL
- **Current status:** `FIRST_AID` (js/main.js:8740-8770) lacks mammal-bite/rabies entry; `FIRSTAID_SOURCES` (js/main.js:8790) already cites WHO; risk flagged at nature.js:1134 but no action given.
- **Change:** Add one WHO-sourced entry "🐕 Animal bite or scratch (rabies risk)" — DO: wash wound with soap under running water 15 min immediately; antiseptic; same-day hospital PEP even if pre-vaccinated, even for a minor scratch/lick on broken skin; applies to dogs/cats/monkeys/bats. DON'T: don't scrub to bleeding, don't suture/close, don't wait-and-watch. Web-verify against WHO before writing; cite in `FIRSTAID_SOURCES`.
- **Acceptance:** Entry renders in FIRST_AID and the SOS flow (`sosScreen` js/main.js:8878); source cited; no fabricated claims. Preview-verified.
- **Effort:** S

### 2.7 Consolidated per-country "Common scams" screen — GENUINELY NEW
- **Current status:** Scam data scattered (visa js/main.js:1177, arrival 2143, per-place 4557, per-route 4882, borders 5254); no aggregation screen.
- **Change:** Add `scamsScreen(cc)` (new route `#scams-<cc>`, one router case) that aggregates existing scam fields for the active country + a short curated, web-verified top-list with a one-line counter-move each (TH gem/tailor, "Grand Palace closed today" tuk-tuk detour, jet-ski deposit, passport-as-deposit; KH Poipet fake visa office; VN meter/"you damaged it"). Link from SOS and arrival hub. Reuse the existing warn-note card style. Add the route tile within the 1.1 "On the ground" cluster.
- **Constraints:** Curated facts must be web-verified + sourced; no fabrication.
- **Acceptance:** Screen aggregates existing fields with no duplication + top-list with sources; linked from SOS + arrival. Preview-verified.
- **Effort:** M

### 2.8 Habit anchor — trip-day / story-so-far line — GENUINELY NEW
- **Current status:** `dailyStripCard` (js/main.js:7381) has no day-of-trip anchor; `tripStartISO()` (js/main.js:1370) already computes start.
- **Change:** When a trip start exists, add a light line to the daily strip: "Day 3 of your trip" + a one-line tally (entries/spend/saved). **No streak-break guilt mechanics.**
- **Acceptance:** Line shows only with a trip start date; tally accurate; absent otherwise. Preview-verified.
- **Effort:** M

### 2.9 Search zero-state launchpad — GENUINELY NEW
- **Current status:** Empty state is a dead-end prompt (js/main.js:8554-8557).
- **Change:** Below the category chips, add example-query chips that populate the box ("pad thai", "ATM fees", "gecko", "visa on arrival", "tuk-tuk price") and, if any, a capped-5 `prefs.recentSearches` "Recent" list (on-device).
- **Acceptance:** Empty state shows tappable examples; chips populate + run; recents persist and cap at 5. Preview-verified.
- **Effort:** S

### 2.10 eSIM consistency in essentials.js — GENUINELY NEW (small)
- **Current status:** eSIM covered in arrival hub (js/main.js:2161) but absent from `essentials.js` SIM rows.
- **Change:** Add one line to each country's SIM item: eSIM alternative (buy before departure, active on arrival; physical local SIM usually cheaper for longer stays).
- **Acceptance:** All four countries' Essentials SIM rows mention eSIM consistently. Preview-verified.
- **Effort:** S

### 2.11 Visa/border freshness badge + staleness nudge — GENUINELY NEW (small)
- **Current status:** `verified` dates exist in borders.js/visa.js/schedules.js but not surfaced on crossings (js/main.js:5236) or visa screens.
- **Change:** Show the existing `verified` date as a "Checked &lt;month&gt; — reconfirm officially" badge; when older than ~6 months vs device date, add a soft caveat linking the official portal already in the data.
- **Acceptance:** Badge renders with the real date; nudge appears past 6 months; links resolve. Preview-verified.
- **Effort:** S

### 2.12 Optimistic undo for reversible done/skip — GENUINELY NEW
- **Current status:** `confirmSpotDone/Hide` use blocking `window.confirm` (js/main.js:593-594) despite reversibility (`clearSuggestionMarks` js/main.js:616, reset button 838).
- **Change:** Drop the pre-confirm on these reversible gestures; apply optimistically + show a small reusable "Marked done · Undo" toast (vanilla, CSP-safe). Reserve confirmation for truly destructive ops (see 4.7). Pairs with the `confirmAction()` work.
- **Acceptance:** Done/hide is one tap with an Undo toast; Undo restores; no OS confirm on these two. Preview-verified.
- **Effort:** S

### 2.13 AI/scanner centralisation — PREMISE FALSE, no action
- No AI/CV/scanner modules exist. "Identify food" (js/main.js:6785) is manual text search; nature ID defers to external iNaturalist (js/main.js:7979); only camera use is photo capture (js/main.js:4621). Do NOT build/relocate an offline classifier — violates no-fabrication + no-CDN. If wanted later: explicitly-online, opt-in, behind `navigator.onLine` + offline fallback.

---

## Priority 3 — Media & Accessibility

### 3.1 Multi-speed read-aloud reader (1.0x–2.0x) for long prose — GENUINELY NEW (task #106, highest-value)
- **Current status:** TTS phrase-only; rate HARDCODED `u.rate=0.9` (js/tts.js:49); `speak()/say()` take no rate; no reader UI. App collects "Blind / low vision" need (js/main.js:9969) and ships long prose (history js/main.js:1983, guide, province write-ups regions.info.js).
- **Change:**
  1. Thread an optional `{rate}` through `speak()/say()` in js/tts.js (default 0.9 preserved).
  2. Add a reusable `readAloud(getText)` control (new small module, e.g. `js/reader.js`, or a helper in main.js) — a ▶︎/pause button + a 1.0x/1.25x/1.5x/2.0x segmented chip row — that walks the screen's prose in sentence-sized chunks via `speechSynthesis` (English device voice for prose), cancelable on navigation (hook into `liveCleanup` js/main.js:11029).
  3. Drop it at the top of history / guide / province / first-aid screens. Persist chosen rate in `profile`. Gate on `window.speechSynthesis` existing; degrade gracefully where no voice is installed.
- **Constraints:** On-device Web Speech, CSP-safe, offline where a voice exists; if new module, add to sw.js PRECACHE.
- **Acceptance:** Long-content screens show a play + speed control; playback obeys the chosen rate; pause/skip works; utterances cancel on route change; rate persists. Preview-verified with a history screen.
- **Effort:** M

### 3.2 Collapsible section headings across long guides — ALREADY SHIPPED, no action
- Pervasive native `<details>/<summary>` (js/main.js:1586, 1977, 2057, 2085, 3233, 3278, 3407). A reusable `foldable()` helper is a code-quality nicety only (see 4.8), not a media gap.

---

## Priority 4 — Code Quality & Technical Debt

### 4.1 Photo thumbnail object-URL leak — PARTIAL fix (med)
- **Current status:** 7 read-only thumbnail paths (js/main.js:4647, 5784, 5854, 5865, 5871, 5952, 6334) + editor path (6059) never revoke; the 4 existing revokes (9225/9302/9323/10922) are correct download flows.
- **Change:** For read-only thumbnails, revoke after paint: `img.addEventListener('load', () => URL.revokeObjectURL(img.src))` (decoded bitmap is retained post-load). For editor thumbs (js/main.js:6056/6059, URL must live during edit) push minted URLs into an array and revoke in the existing `liveCleanup` hook (js/main.js:11029/11035).
- **Acceptance:** Repeated visits to scrapbook/journal/album do not grow `performance.memory`/blob registry; photos still render. Verify by navigating photo screens repeatedly in preview.
- **Effort:** S

### 4.2 Debounce localStorage save() + drop redundant re-parse — GENUINELY NEW (med)
- **Current status:** `save()` (js/state.js:212-233) stringifies the whole store synchronously on every mutation (~30 sites) and re-reads + `JSON.parse`s the previous blob for .bak (219-222) — two full passes per edit. IDB mirror already debounced 600 ms (236-243).
- **Change:** Debounce the localStorage write like `mirrorStore()` (coalesce bursts on a short timer); keep an immediate synchronous flush on `pagehide`/`visibilitychange`. Write .bak from the last in-memory known-good stringify instead of re-reading+parsing.
- **Constraints:** No data loss on background/kill; preserve triple-redundant backup semantics.
- **Acceptance:** Rapid edits coalesce into one write; nothing lost on backgrounding (test via forced reload after edits); .bak still populated. Preview-verified.
- **Effort:** S

### 4.3 Country-scoped code-splitting — GENUINELY NEW (med)
- **Current status:** 39 static imports (js/main.js:4-79) eagerly parse ~3.64 MB; `places.*.ext.js` (~13.8k lines) load for all 4 countries every launch. Deferral precedent works (map.js:136-151; dynamic `import('./map.js')` at 2015/3547/4337/5585/10273).
- **Change:** Add an async preload boundary keyed to `activeCountry`; dynamic-`import()` `places.<cc>.ext.js` / prices / routes / food.`<cc>` on country selection. Because `allPlaces()/getPlace()` are synchronous, scope async work to a **preload-on-country-select step**, not per-caller. Files stay in PRECACHE (sw.js:66-101) and runtime cache (sw.js:161) → offline-safe.
- **Acceptance:** Cold start parses only the active country's heavy data; switching country lazy-loads the rest; offline still works (test with network off after first load). Preview-verified.
- **Effort:** M

### 4.4 uid() cross-session collision — GENUINELY NEW (low)
- **Current status:** `uid()` = `${prefix}-${Math.floor(performance.now())}-${_seq}` (js/state.js:504-509); both components reset on reload; ids are edit/delete keys. `crypto.randomUUID` already used at js/state.js:623-626.
- **Change:** Generate record ids with `crypto.randomUUID()`/`getRandomValues` (as `newUserId` does), or persist a monotonic counter. Preserve test determinism via an injectable id source.
- **Acceptance:** New ids are globally unique across sessions; existing stored ids still resolve (no migration break). Preview-verified add/edit/delete on journal + budget.
- **Effort:** S

### 4.5 Memoize idb.open() — GENUINELY NEW (low)
- **Current status:** `open()` (js/idb.js:5-12) invoked per op (14/32/42/54).
- **Change:** Cache the `open()` promise in a module-level var; reuse; reopen only on error/close.
- **Acceptance:** Blob bursts (full-backup enumeration, scrapbook render) reuse one connection; blobs still read/write correctly. Preview-verified.
- **Effort:** S

### 4.6 Incremental main.js monolith split — GENUINELY NEW (large)
- **Current status:** 11,170 lines / 694 KB; router + 74 screens + shared builders in one file. Internally clean (render() switch 11030-11119, error boundary 11120-11128). Maintainability/merge risk, not a bug.
- **Change:** Incrementally extract cohesive screen groups (`screens/places.js`, `screens/journal.js`) and shared h-based builders (`ui/cards.js`, chip/tag/foldable helpers) into modules imported by main.js; add each to sw.js PRECACHE on extraction. Sequence AFTER 4.3 so extracted screen modules can also lazy-load. One small group per wave.
- **Acceptance:** Each extraction leaves all routes working, PRECACHE updated, 0 console errors; no behaviour change. Preview-verified per wave.
- **Effort:** L (multi-wave)

### 4.7 Styled confirmAction() modal + route 20 confirm sites — GENUINELY NEW (task #100)
- **Current status:** 20 bare `window.confirm()` (js/main.js:4575, 5156, 5790, 6349, 8112, 8384, 9232, 9259, 9289, 9352, 10967, 10986, …). `openModal()` (js/main.js:3048) is a ready focus-trapping/Esc host.
- **Change:** Build `confirmAction({title, body, confirmLabel, danger})` on `openModal` returning a promise — themed sheet, red destructive primary, neutral cancel, light/dark aware. Route the destructive sites through it. (Reversible done/skip go to the undo-toast path in 2.12, not this modal.)
- **Acceptance:** Destructive actions show the styled modal (not OS confirm); Esc/cancel aborts, confirm proceeds; theme-correct. Preview-verified on delete-pin + vault-wipe.
- **Effort:** M

### 4.8 Extract foldable() helper — GENUINELY NEW (small, optional, task #100)
- **Current status:** `<details>` pattern inlined at each call site (js/main.js:1586, 1977, 2057, 3233, 3278) — capability fully present, just not DRY.
- **Change:** Extract `foldable(summary, body, {open})` and replace inlined blocks incrementally. Ship alongside 4.6 UI-builder extraction.
- **Acceptance:** Folds render identically; keyboard behaviour unchanged. Preview-verified.
- **Effort:** S

---

## Sequencing note
Ship in small independent waves. Recommended value/effort order: 2.6 (safety) → 4.1 (leak) → 1.1 (hub regroup) → 3.1 (reader) → 2.5 (near-me honesty) → 2.1/2.2/2.3 (activation) → 2.7 (scams) → 4.2 (save debounce) → 4.7 (confirmAction) + 2.12 (undo) → 2.4 (hints) → smaller wins (2.9/2.10/2.11/1.2/1.3/4.4/4.5) → 4.3 (code-split) → 4.6/4.8 (monolith split, multi-wave). Each wave = one TODO checkbox, one version bump, one merge.
