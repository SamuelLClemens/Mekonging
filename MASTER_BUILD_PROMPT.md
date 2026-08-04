# Mekonging — "Into the Future" Master Build Prompt

> **Purpose.** This is a self-contained execution brief for Claude Code to bring the
> Mekonging travel PWA to production quality across location accuracy, true offline
> operation, places depth and browsing, weather, money, journalling, and mobile UX.
> It was written from a direct audit of the live codebase (file and line references are
> current as of `mk-v0.325.0`). Read Sections 0–3 fully before editing anything, then
> execute the phases in Section 4 in order. Each phase ships independently.

---

## 0. Role and operating mode

- You are extending an existing, shipped, vanilla ES6-module PWA. There is **no build
  step**: `index.html` loads `js/main.js` as a module; DOM is built with a hyperscript
  helper `h(tag, attrs, children)` (null attributes and children are skipped); routing is
  hash-based; state persists to `localStorage` via a debounced `save()` in `js/state.js`,
  with binary blobs in IndexedDB (`js/idb.js`).
- **Extend, do not rebuild.** Much of the requested machinery already exists in partial
  form. Section 2 maps it. Prefer surgical additions that match the surrounding idiom
  (comment density, naming, card construction) over rewrites.
- Work is grounded and verified, never fabricated. Every user-facing place, price, rating,
  or fact traces to a real, specific source URL.

## 1. Non-negotiable constraints

These apply to every phase. A phase is not "done" if it violates any of them.

- **Security first.** Never commit or output secrets, tokens, API keys, credentials, or
  PII. Open-Meteo and the tile source require no keys; keep it that way. Any user-supplied
  translation endpoint or key stays on-device only (`prefs.translateEndpoint`,
  `prefs.translateKey`) and is never logged, committed, or transmitted anywhere except the
  endpoint the user configured.
- **Branch and PR flow.** Never commit to `main`. Work on `feat/deep-content`. Ship by
  `git merge --no-ff` into `feat/scaffold-bangkok-slice` (the only auto-deploying branch →
  www.mekonging.com), push, then `git checkout feat/deep-content`. Bump `APP_VERSION`
  (js/main.js) and `CACHE_VERSION` (sw.js:11) in lockstep on every ship.
- **No fabrication; real sources.** Cite specific, deep source URLs — never a homepage
  placeholder (for example, an actual TripAdvisor attraction page, not `tripadvisor.com`).
  When a fact cannot be verified, omit it or leave native script blank rather than ship
  something wrong.
- **Offline-first, self-hosted UI-critical data.** Any data whose absence breaks the UI is
  self-hosted in the repository, never fetched from a third-party CDN at runtime. External
  fetches are permitted only where graceful degradation is designed in (live weather, live
  exchange rates, satellite tiles, TTS audio — all cached after first online use).
- **No on-screen prose padding.** Add function, not paragraphs. Match the app's terse,
  helpful microcopy.
- **Formal register in all reporting.** Active voice, no contractions, no slang, no
  decorative emojis in prose. UI glyphs referenced in code are acceptable.
- **HR, legal, or contract questions** are out of scope; direct such questions to Omer
  Hanegbi or Omri Siri.

### Global workflow rules (from the operator's standing configuration)

- Any multi-phase workflow begins with a **Phase 0 preflight** that fails fast and cheap:
  resolve the runtime, confirm every target file exists and is non-empty, brace-balance the
  JS to be edited, and check git state before spending budget.
- Every data-generating agent starts with an **idempotency guard** so a partial run resumes
  safely.
- Run an **inter-phase gate** (brace balance + file-count) between expensive phases.
- **Never** attach a `schema` to an agent that writes files via Bash and returns plain text.
- `parallel()` is a barrier; keep any single agent's scope small so one hang cannot stall a
  whole phase. Split data tasks larger than ~40 items.
- Inside JavaScript template literals, bash-style `${VAR}` throws at parse time; use `$VAR`,
  escape as `\${VAR}`, or prefer Python for file operations inside agent prompts.

### Environment note

No Node.js is on `PATH` in this environment. Validate edited JS without Node:

- Parse-check by evaluating a stripped copy with JXA
  (`osascript -l JavaScript`, after removing `export`), or
- Parse the data arrays as JSON-style with Python, or
- Load the file in the browser preview and read the console.

Run the dev server with `scripts/serve.py` (port 8742; app at
`http://localhost:8742/index.html`). The in-app browser preview pane is occasionally flaky;
if it blanks, resize to mobile (375×812) to recover it, and prefer short, single-purpose
verification calls.

---

## 2. Current-state map (audited; do not rediscover)

### 2.1 Location and "where am I"

- Location is **opt-in and one-time**, not on from the start: a Home invite gated by
  `prefs.geoAsked` (js/main.js:1130, 1155, 1204). The last fix is cached as
  `prefs.lastFix { lat, lng, at }` (js/state.js:~38) and read by `getLastFix()`.
- The current town is derived by **snapping the fix to the nearest hub in
  `WEATHER_SPOTS`** — `nearestSpotGlobal(fix)` (js/main.js:10268) and
  `nearestSpot(coords, country)` (js/weather.js:89). `WEATHER_SPOTS` (js/weather.js:17) is a
  sparse ~37-city list. **Pai is listed (weather.js:22); Mae Hong Son town is not.**
- **This is the reported "in Mae Hong Son it says Pai" bug.** The hub list is correct for
  *regional weather* (weather is deliberately the nearest hub, with distance labelled) but
  is the wrong source for *naming the user's location*. The SOS screen even prints "You
  appear to be near {spot.city}" from this list (js/main.js:10290).
- A rich, coordinate-bearing place database and province geometry already exist:
  `allPlaces({ country })` entries carry `coords {lat, lng}`; `pointInProvince(...)`
  (js/main.js:~2545) and `haversineKm(...)` are available.

### 2.2 Offline and the service worker

- `sw.js` precaches the full app shell and **every `js/data/*.js` file** (sw.js:25–125),
  the map engine (`lib/maplibre-gl.*`), and CSS/icons. App code is served **network-first**
  (newest when online, last-cached when offline); heavy immutable assets are cache-first.
- **Downloadable packs already exist** via `postMessage`: satellite tiles
  (`PREFETCH_TILES`, `TILE_CACHE`, host `server.arcgisonline.com`, cap 3000) and phrase
  audio (`PREFETCH_TTS`, `TTS_CACHE`, host `translate.google.com`, cap 4000). Both survive
  version bumps (activate handler keeps them, sw.js:150).
- **Confirmed offline holes:**
  1. **Identifier photos:** none are bundled — `js/data/nature.js` header states "photo-
     search link; no bundled photos." Images resolve to an online search, so the identifier
     shows no picture offline.
  2. **Identifier sounds:** `playCall()` (js/main.js:9073) fetches the iNaturalist API
     (`inatSoundUrl`, js/main.js:9068) at play time — online only.
  3. **Live weather** requires network to refresh (correct by design; it caches after first
     fetch). Confirm the cache is honoured on every offline path.
  4. **Basemap GeoJSON:** verify whether the country GeoJSON the map needs is in `PRECACHE`
     (sw.js lists `js/data/basemap.js`, not a `countries.geojson`). If the map depends on a
     `.geojson` that is only cached cache-first on first online view, a first-run offline
     user gets no map. This must be precached or embedded.

### 2.3 Identifier (wildlife, dishes, produce) and "My Identifier"

- `js/data/nature.js`: 102 species, grouped (`NATURE_GROUPS`: bird, mammal, fish, reptile,
  plant, insect, danger). Vocal species carry `call: true`; `playCall` streams from
  iNaturalist. `speciesCard` at js/main.js:9193.
- **My Identifier already ships** (`mk-v0.325.0`): starred items via `idPins` +
  `idPinMeta { tags, note }`, "By type" and "By category" views, per-item reorder, tag,
  note, and remove; quick-pin stars (`idPinStar`) on browse cards.

### 2.4 Phrasebook and "Your Dictionary"

- Per-language pins and hides already exist: `phraseKey(code, catId, p)` (js/main.js:3564),
  `phrasePinsFor` / `phraseHiddenFor` / `togglePhrasePin` / `movePhrasePin`
  (js/main.js:3565–3576); an `essentialsCard` (js/main.js:3594) and `ESSENTIALS` data
  (`js/data/essentials.js`).
- **A dictionary screen already exists:** `dictionaryScreen()` (js/main.js:3771), routed as
  `#dictionary`, surfaced from the "You" hub as "My phrases" (js/main.js:2408). This is
  most of the requested "Your Dictionary." The work is symmetry with My Identifier and
  discoverability, not a new build.

### 2.5 Places

- `placesScreen(arg)` (js/main.js:4101): a living map (`<details>` disclosure) with
  category-layer chips, a "closest to you" slot, a city picker, "your own places," and
  interest and budget filters. `placeCard(p, num)` at js/main.js:4907.
- The **data model is already rich** (js/data/places.*.js): `id, name, city, country,
  coords, categories[], budgetTier, rating, reviewSources, priceRange {low, typical, high,
  currency, note}, hours, kidFriendly, activities[], amenities[], stayType, blurb,
  whyItFits, recognition, access, tips[], scamWarnings[], externalRatings[], externalPrices[]`.
  Every field the requested quick-view needs already exists — **coverage and browsing UX are
  the gap, not the schema.** Two on-disk formats coexist: compact (unquoted keys) and
  JSON-style (quoted keys).
- View and sort preferences exist: `prefs.placesView ('list'|'map')`,
  `prefs.placesSort ('best'|'near')` (js/state.js:42–43).

### 2.6 Weather

- `js/weather.js` fetches Open-Meteo (`ENDPOINT`, weather.js:9) and caches **current**,
  **hourly**, and **daily**. The hourly records already include everything the requested
  watch-face needs: `temp`, `pp` (precipitation probability), `precip`, `wind`, `hum`
  (relative humidity), `app` (apparent temperature). Daily includes `tmax, tmin, appMax,
  appMin, rainProb, precip, uv, windMax, sunrise, sunset`.
- `weatherScreen(country)` (js/main.js:8253) renders the current forecast; `forecastOutlook`
  (js/main.js:775) derives a forward-looking line. **The data is already present; the
  watch-ring and month-calendar visualisations and metric toggles are new UI only.**

### 2.7 Money

- `trip.budgetLog[] { id, date, amount, currency, note, category }` (js/state.js:99), with
  add/remove/edit helpers (js/state.js:400–419) and a one-tap `quickSpendRow`
  (js/main.js:~2136).
- **A by-category donut already exists:** `budgetSummaryCard()` (js/main.js:9639) renders a
  by-category donut plus budget progress; it is shown on the money hub (js/main.js:2388) but
  **not on Home**. `expensesScreen()` at js/main.js:9742.
- **There is no numeric total budget.** `prefs.budget` is a coarse tier
  (`'low'|'mid'|'high'|'flexible'`, js/state.js:18), not an amount. The requested "total
  budget the user sets" needs a new field.

### 2.8 Journal and translation

- `journal.entries[] { id, ts, date, title, text, place, coords }` (js/state.js:104);
  `journalFormScreen(editId)` (js/main.js:6944) is **text only**.
- **Voice infrastructure partly exists:** the translator already uses
  `webkitSpeechRecognition` (`rec.onresult`, js/main.js:4008) to fill an input by voice.
  Binary blobs already persist in IndexedDB with an object-URL helper that revokes on
  cleanup (js/main.js:485; js/idb.js) — the exact pattern needed to store journal audio.

---

## 3. Traceability — reported failures → phases

The operator ran a live test and reported specific failures. Each maps to a phase.

| # | Reported problem | Root cause / current state | Phase |
|---|------------------|----------------------------|-------|
| 1 | Location not on from the start; must use actual location | Opt-in one-time invite; no live watch | A |
| 2 | In Mae Hong Son, app says Pai | Names location from sparse `WEATHER_SPOTS`; Mae Hong Son absent | A |
| 3 | Identifier pictures and sounds must work offline | No bundled photos; sounds fetched live from iNaturalist | B |
| 4 | Everything must work offline; currently does not | Media holes + verify basemap GeoJSON precache | B |
| 5 | Huge gap versus Google Maps; too few options | Curated set is thin in most categories/towns | C |
| 6 | Places list without details; expand/contract per item | Cards are detail-forward; no lightweight accordion | C |
| 7 | Category → large list with name, distance, rating, price, budget, category | Schema supports it; no category-first quick-view list | C |
| 8 | Hourly weather like an Apple Watch face; toggle temp/rain%/humidity | Hourly data cached; no ring UI, no toggles | D |
| 9 | Monthly weather on a calendar with the same toggles | No month/calendar view | D |
| 10 | "You" needs Your Dictionary of starred phrases | `dictionaryScreen` exists; needs symmetry + discoverability | G |
| 11 | Identifier needs the same for starred items | Ships in `mk-v0.325.0`; align with dictionary | G |
| 12 | Expense logging must be one modern, easy flow | Multiple entry points; unify | E |
| 13 | Home budget widget: pie by category vs a total the user sets | Donut exists off-Home; no numeric total | E |
| 14 | Journal + translation voice recording; transcribe to editable text; keep original audio | Text-only journal; speech-recognition exists in translator | F |
| 15 | Mobile optimised | Cross-cutting audit | H |
| 16 | Easy to find what the user needs | Cross-cutting IA/findability pass | H |

---

## 4. Phases

Each phase states its goal, the exact change surface (with file and line), the approach,
any state or data-schema change, acceptance criteria, and verification. Ship each phase on
its own (`--no-ff` merge, version bump) so a regression is isolatable.

### Phase 0 — Reproduce and instrument the bad first run *(do this first)*

**Goal.** Reproduce the operator's failed test run and capture a baseline before changing
anything.

1. Run `scripts/serve.py`; open `http://localhost:8742/index.html` in a fresh profile
   (cleared storage) to simulate a first install.
2. Reproduce, and record exactly what breaks, each of: (a) first-run with no interaction,
   (b) DevTools "Offline" from a cold cache, (c) a simulated Mae Hong Son GPS fix
   (lat 19.301, lng 97.968) fed to the location path, (d) the identifier with a photo and a
   sound while offline.
3. Confirm the preflight passes: every file in Section 2 exists and is non-empty; brace-
   balance the JS to be edited; `git status` clean on `feat/deep-content`.

**Acceptance.** A short written baseline noting which of the 16 items reproduce, so each
fix can be checked against a real "before."

---

### Phase A — Location: on from the start, real GPS, correct place name

**Goal.** From launch, obtain the user's actual position (with permission) and name the
**actual nearest place/town**, not the nearest weather hub. Keep hub-snapping for weather
only.

**Change surface.**

- `nearestSpotGlobal(fix)` — js/main.js:10268 (weather-hub snap; keep for weather).
- `nearestSpot(coords, country)` — js/weather.js:89 (weather-hub snap; keep for weather).
- Home geo invite — js/main.js:1130, 1155, 1204; `prefs.geoAsked` (js/state.js:45).
- SOS "You appear to be near {city}" — js/main.js:10290.
- Province geometry `pointInProvince` — js/main.js:~2545; `haversineKm`, `getLastFix`.

**Approach.**

1. Add a **`whereAmI(fix)`** resolver, separate from weather snapping. Resolution order:
   1. Nearest curated place within a small radius (for example ≤ 8 km) by `haversineKm`
      over `allPlaces()` entries that carry `coords`.
   2. Otherwise, the containing province/region via `pointInProvince`, named from the
      regions data.
   3. Otherwise, fall back to the nearest `WEATHER_SPOTS` hub, but phrase it as "near {hub}"
      and always label the straight-line distance so it never masquerades as pinpoint.
   Replace location-*naming* call sites (Home hero, SOS line, "near me" headers) with
   `whereAmI`. Leave the weather fetch bound to `nearestSpot`.
2. Add **`Mae Hong Son`** and other visited-but-unlisted towns to `WEATHER_SPOTS` so even
   the weather fallback is closer to correct; more importantly, resolution (1)/(2) should
   already name the real town from the places/regions data.
3. **Turn location on from the start, respectfully.** On first launch, request geolocation
   promptly with a one-line rationale, and, when granted, keep a **live** position via
   `navigator.geolocation.watchPosition` with `{ enableHighAccuracy: true }`, throttled and
   written to `prefs.lastFix`. Never block the UI on it; degrade to the manual city picker
   when denied or unavailable (that path already exists). Persist the permission decision so
   the app does not nag.
4. Guard privacy: position stays on-device; never place coordinates in a URL or send them
   anywhere.

**Acceptance.**

- A simulated Mae Hong Son fix names Mae Hong Son (or its province), not Pai.
- On a fresh install with permission granted, the app has a real fix without the user
  hunting for a button; with permission denied, the manual picker still works fully offline.
- Weather still resolves to the nearest hub with the distance labelled.

**Verification.** Feed both the Mae Hong Son and a central-Pai fix through `whereAmI`;
confirm each names its own town. Toggle permission off; confirm graceful fallback.

---

### Phase B — True offline, including identifier media

**Goal.** Everything the app shows must work with no signal, including identifier pictures
and sounds. Close the confirmed holes in Section 2.2.

**Change surface.** `sw.js` (PRECACHE sw.js:25; pack handlers sw.js:273–357); `js/data/nature.js`;
`playCall` / `inatSoundUrl` (js/main.js:9068–9097); `speciesCard` (js/main.js:9193); the
map/basemap load path.

**Approach.**

1. **Basemap first.** Confirm whether the country GeoJSON the map needs is precached. If it
   is fetched cache-first only on first online view, add it to `PRECACHE` (or keep it
   embedded in `js/data/basemap.js`). A first-run offline user must get a map.
2. **Identifier media pack.** Introduce a self-hosted, licence-clean media bundle: for each
   of the 102 species, one representative photo and, for `call: true` species, one audio
   clip. Sources must be CC-licensed (iNaturalist photos under their per-observation CC
   terms; xeno-canto recordings under their CC terms) with attribution retained in the data.
   - Store a stable local reference on each species record (for example
     `photo: 'media/nature/<id>.jpg'`, `audio: 'media/nature/<id>.mp3'`).
   - Rewrite `speciesCard` to show the local photo and to play the local audio; remove the
     live iNaturalist fetch from the default path (keep an optional "more photos online"
     link that degrades gracefully offline).
   - **Decide the delivery model (see Section 6):** either (a) precache a compact, resized
     set so every install is offline-complete out of the box, or (b) ship a "Download the
     field-guide media" pack using the existing `PREFETCH_*` / dedicated-cache pattern so the
     base install stays small. Recommendation: a compact always-bundled set (predictable
     offline for everyone) plus an optional high-resolution pack.
   - Respect licensing and size: resize/compress; keep total predictable; record each asset's
     source URL, author, and licence.
3. **Weather offline.** Verify every weather render path reads the cache when `online()` is
   false and never shows a spinner that cannot resolve offline.
4. **Regression-proof the version bump.** Because installs fetch with `{cache:'reload'}`
   (sw.js:134), confirm the new media and any new precache entries land in the new
   `CACHE_VERSION`.

**Acceptance.** With DevTools offline from a cold cache: the map renders, a species shows
its picture and plays its sound, weather shows the last cached forecast, and no screen
depends on a live fetch to become usable.

**Verification.** Cold-cache offline pass across map, identifier (photo + sound), weather,
phrasebook, places, and money.

---

### Phase C — Places: category-first browse, collapsible quick-view rows, and depth

**Goal.** Close the "too few options" gap and deliver the requested browsing model: choose a
category, see a large list, each row a compact quick-view that expands in place for detail.

**Change surface.** `placesScreen` (js/main.js:4101), `placeCard` (js/main.js:4907),
`allPlaces`, the places data files (js/data/places.*.js and *.ext.js), `prefs.placesView` /
`prefs.placesSort` (js/state.js:42).

**Approach.**

1. **Category-first browse.** Add a mode where the user picks a category (food, stays,
   culture, nature, nightlife, and the practical categories added in step 3) and sees the
   full list for the active area, sorted by nearest-first when a fix exists, else by rating.
2. **Collapsible quick-view rows.** Replace the detail-forward card in list mode with a
   lightweight row rendered as a `<details>`/summary accordion (the codebase already uses
   `<details>` and `collapsibleCard`). The **collapsed summary** shows, in one compact line:
   - name,
   - distance from the user (via `haversineKm(fix, p.coords)`; the app already renders a
     `dist-chip`),
   - rating (from `rating` / `externalRatings`),
   - price (from `priceRange`),
   - a budget flag (from `budgetTier`),
   - the category.
   The **expanded** body shows the existing detail (blurb, hours, tips, scam warnings,
   sources, "open full page"). Expansion is per-row and does not navigate away.
3. **Coverage expansion — realistic scope.** Literal Google-Maps parity is neither possible
   nor desirable for a curated, sourced, offline app. Instead, densify by **category × hub
   town**, each entry individually sourced with a real deep URL (no homepage placeholders,
   no fabrication). Prioritise the categories a traveller reaches for and that are currently
   thin: eat (street food, local restaurants, cafes), sleep (hostels, guesthouses, hotels),
   money/health (ATMs, pharmacies, clinics/hospitals), transport (bus/train/ferry terminals),
   and sights (temples, viewpoints, waterfalls, markets). Prioritise the hub towns the app
   already centres on (`WEATHER_SPOTS`) plus the loop/Pai/Sapa areas already deeply built.
   Ensure new entries carry `coords` (required for distance), `categories`, `rating` with
   source, `priceRange`/`budgetTier` where meaningful, and `hours` where known.
   - This is workflow-scale, parallel content curation. Split by (country, category) into
     agents of ≤ 40 entries each, each with an idempotency guard and a real-source
     requirement, gated by a validation pass between waves. Do **not** attach a `schema` to
     agents that write data files and return text.

**Acceptance.** A user picks a category and sees a long, sorted list; each row shows the
quick-view fields at a glance and expands in place for detail; distance is correct relative
to the live fix; every new entry has a working, specific source URL.

**Verification.** Category browse in at least two hub towns; confirm sort-by-nearest matches
the fix; spot-check five new entries' source URLs resolve; brace-balance and parse-check all
edited data files.

---

### Phase D — Weather: watch-face hourly ring and month calendar, with metric toggles

**Goal.** Present the hourly forecast as an Apple-Watch-style ring the user can read at a
glance, and the monthly outlook as a calendar, both with a metric toggle (temperature, rain
probability, humidity, and others the data supports).

**Change surface.** `weatherScreen(country)` (js/main.js:8253); cached records from
`js/weather.js` (hourly: `temp, pp, precip, wind, hum, app`; daily: `tmax, tmin, rainProb,
precip, uv, windMax, sunrise, sunset`). No new network work — the data is already cached.

**Approach.**

1. **Hourly ring.** Render the next ~24 hours around a circular dial (SVG), each hour a spoke
   or arc segment coloured/scaled by the selected metric, with sunrise/sunset marked. A
   segmented control toggles the active metric: temperature, rain % (`pp`), humidity (`hum`),
   apparent temperature (`app`), wind (`wind`). The centre shows the current reading for the
   selected metric. Keep it legible at 375 px width and touch-friendly.
2. **Month calendar.** Render the available daily forecast as a month grid; each day cell
   shows the selected metric (high/low for temperature, `rainProb` for rain, and so on) with
   a WMO glyph (`wmo(code)`), respecting the same metric toggle. Where the forecast horizon
   is shorter than the month, show forecast days as live and the remainder as unavailable or
   as climatological guidance clearly labelled as such (never invent daily values).
3. **Honesty.** Weather remains regional (nearest hub, distance labelled). Offline, both
   views render from cache; with no cache, they invite one online refresh rather than
   showing empty dials.

**Acceptance.** The hourly ring and the month calendar render from cached data; the metric
toggle switches both without a refetch; sunrise/sunset and current reading are correct;
both are legible and usable on a phone.

**Verification.** Load a city with cached forecast; toggle every metric on both views;
confirm offline still renders from cache.

---

### Phase E — Money: one modern expense flow and a Home budget pie versus a set total

**Goal.** Make logging an expense fast and consistent everywhere, and put a budget widget on
Home: a by-category pie measured against a total budget the user sets.

**Change surface.** `expensesScreen()` (js/main.js:9742); `quickSpendRow` (js/main.js:~2136);
`budgetSummaryCard()` (js/main.js:9639); `homeScreen`/Home composition (around js/main.js:1983–2240);
`trip.budgetLog` and helpers (js/state.js:99, 400–419); add a numeric total to state.

**Approach.**

1. **Numeric total budget.** Add `trip.budgetGoal { amount, currency }` (self-defaulting via
   the migrate spread in js/state.js, so no store-version bump). Provide a simple setter in
   the money area.
2. **One expense component.** Extract a single, modern "log expense" component (amount,
   category, optional note, date defaulting to today, currency defaulting to the local
   currency) and reuse it in `quickSpendRow`, `expensesScreen`, and the Home widget so the
   interaction is identical everywhere. Keep it one-tap for the common case.
3. **Home budget widget.** Reuse `budgetSummaryCard`'s donut, now measured against
   `trip.budgetGoal`: show spent-by-category as pie slices, total spent versus the set total,
   and remaining. Place it on Home (it currently lives only on the money hub). Return null
   only until either a spend or a goal exists, then invite the first action.
4. Sum across currencies using the existing home-currency conversion (js/main.js:2091).

**Acceptance.** The same logging interaction appears on Home, the money hub, and the
expenses screen; the Home pie reflects category spend against the user's set total in home
currency, updating immediately after a log.

**Verification.** Set a total; log spends in two categories and two currencies; confirm the
pie, total, and remaining are correct and identical across all three entry points.

---

### Phase F — Journal and translation: voice capture, transcription, editable text with original audio

**Goal.** Let the user record their voice in the journal and the translator. A journal
recording is transcribed to written text that is editable, while the original audio is kept
and playable alongside it.

**Change surface.** `journalFormScreen(editId)` (js/main.js:6944); `journal.entries` schema
(js/state.js:104); IndexedDB blob storage and the object-URL helper (js/main.js:485,
js/idb.js); the translator's existing `webkitSpeechRecognition` use (js/main.js:4008).

**Approach.**

1. **Record.** Use `MediaRecorder` (`getUserMedia({ audio: true })`) to capture a clip; store
   the blob in IndexedDB keyed to the entry (the app already stores photo blobs this way and
   revokes object URLs on cleanup). Handle permission denial gracefully.
2. **Transcribe.** Use the Web Speech API (`webkitSpeechRecognition`, already used by the
   translator) to produce a live transcript during recording. Where speech recognition is
   unavailable, keep the audio and let the user type; never lose the recording.
3. **Store both.** Extend a journal entry with `audioKey` (IndexedDB reference) and keep the
   transcribed `text`. The written text is fully editable after the fact; edits never destroy
   the original audio.
4. **Present both.** In the entry, show an audio player for the original recording and the
   editable written version together, so the user can listen back and read/edit.
5. **Translator parity.** Offer the same voice capture in the translation input (it already
   supports voice-to-text); keep behaviour consistent with the journal.
6. Privacy: audio stays on-device (IndexedDB); nothing is uploaded. If any cloud
   transcription is ever offered, it must be explicit, opt-in, and off by default.

**Acceptance.** The user records a journal note; a transcript appears and is editable; the
original audio persists and plays back; both survive reload; denial of the microphone
degrades to typing without data loss.

**Verification.** Record, transcribe, edit the text, reload, and confirm both the edited text
and the original audio remain and play.

---

### Phase G — "You": Your Dictionary and Your Identifier symmetry and findability

**Goal.** A coherent "You" hub where starred phrases (Your Dictionary) and starred identifier
items (Your Identifier) behave and read the same, and are easy to reach.

**Change surface.** `dictionaryScreen()` (js/main.js:3771) and phrase-pin helpers
(js/main.js:3564–3576); the shipped My Identifier (`idPins`, `idPinMeta`,
`myIdentifierScreen`, `idPinStar`); the "You" hub composition (js/main.js:2331–2416).

**Approach.**

1. **Confirm and polish Your Dictionary.** `dictionaryScreen` already collects
   `phrasePins`. Align its interaction model with My Identifier: categories/tags, reorder,
   note, and remove, using the same visual language (the pin helpers already support pin,
   hide, reorder, and per-phrase notes).
2. **Mirror in Your Identifier.** My Identifier already ships; ensure its "By type"/"By
   category", reorder, tag, note, and remove match the dictionary one-for-one so the two feel
   like one system.
3. **Findability.** In the "You" hub, present both prominently with live counts ("My phrases
   · N", "My identifier · N"), and make starring discoverable from the source screens (the
   star already exists on identifier browse cards; ensure the phrasebook's pin control is
   equally obvious).

**Acceptance.** Starring a phrase adds it to Your Dictionary; starring a species/dish/produce
adds it to Your Identifier; both support the same organise actions and are one tap from the
"You" hub with correct counts.

**Verification.** Star and organise in each; reload; confirm parity of behaviour and counts.

---

### Phase H — Mobile optimisation and findability (cross-cutting)

**Goal.** The app is fast, legible, and obviously navigable on a phone; users reach what they
need quickly.

**Approach.**

1. **Mobile pass.** Verify touch-target sizes, single-column legibility at 360–414 px, safe-
   area insets, no horizontal overflow, and that new components (weather ring, month calendar,
   places accordion, budget pie) are thumb-friendly and performant on mid-range hardware.
2. **Information architecture.** Audit the five-tab structure and the "You" hub so the
   highest-value daily actions (where am I, near me, log spend, phrase, journal, weather) are
   at most one or two taps away. Reduce duplicate entry points; keep one canonical path per
   task.
3. **First-run.** With location on from the start (Phase A) and offline-complete media
   (Phase B), the first run should feel immediately useful and trustworthy.

**Acceptance.** A first-time user on a phone can, without guidance, find where they are,
what is near, the weather, and how to log a spend or a phrase; no layout breaks at common
phone widths; interactions stay smooth.

**Verification.** Test at 360, 390, and 414 px; dark and light; verify no overflow and smooth
scrolling on the heaviest new views.

---

## 5. Cross-cutting engineering rules

- **DOM.** Build with `h(tag, attrs, children)`; match existing card structure (for example
  the `id-cardrow` / `id-cardmain` pattern from My Identifier, and `<details>`/`collapsibleCard`
  for accordions).
- **State.** New `profile.prefs` and `trip` fields self-default via the migrate spread in
  js/state.js; no store-version bump for additive fields. Remember `save()` is debounced — do
  not read `localStorage` synchronously right after a mutation to assert persistence; re-read
  after a tick.
- **Data formats.** Respect the two place-file formats (compact vs JSON-style). Keep new
  entries consistent with the file they are added to.
- **Versioning.** Bump `APP_VERSION` (js/main.js) and `CACHE_VERSION` (sw.js:11) together on
  every ship; add any new precache paths (media, basemap) to `PRECACHE`.
- **Validation without Node.** JXA `osascript -l JavaScript` eval (strip `export`) or Python
  JSON parsing; then a browser preview console check. Brace-balance edited JS before every
  ship.

## 6. Decisions to confirm before executing

Three product forks materially change scope. Confirm with the operator before the relevant
phase; a sensible default is recommended for each so work is not blocked.

1. **Identifier media delivery (Phase B).** Always-bundled compact set (offline-complete for
   everyone, larger base install) versus an optional downloadable pack (small base, opt-in
   offline). *Recommended:* compact always-bundled photo + audio per species, with an optional
   high-resolution pack.
2. **Coverage depth and breadth (Phase C).** How many hub towns and which categories to
   densify first, and the target count per (town, category). *Recommended:* start with eat,
   sleep, money/health, and transport across the existing `WEATHER_SPOTS` hubs, ~15–30 sourced
   entries per town per priority category, expanding in waves.
3. **Transcription engine (Phase F).** On-device Web Speech only (private, variable accuracy,
   offline-limited) versus an optional opt-in cloud transcription for accuracy. *Recommended:*
   on-device only by default; no cloud upload unless the operator explicitly requests an
   opt-in path.

## 7. Ship ritual (every phase)

1. Brace-balance and parse-check every edited JS file (JXA or Python).
2. Run the dev server; verify the phase's acceptance criteria in the preview, including an
   offline pass where relevant; read the console (zero errors before merge).
3. Bump `APP_VERSION` and `CACHE_VERSION` in lockstep; add any new precache paths.
4. Commit on `feat/deep-content` via `git commit -F <message-file>` (avoid heredoc/apostrophe
   breakage). Never commit secrets or PII.
5. `git checkout feat/scaffold-bangkok-slice` → `git merge --no-ff feat/deep-content` → push
   (auto-deploys) → `git checkout feat/deep-content`.
6. Confirm propagation on www.mekonging.com (version string), then update memory/notes.

## 8. Suggested execution order and workflow shape

- **Order.** A (location) → B (offline + media) → C (places) → D (weather) → E (money) →
  F (journal voice) → G ("You" symmetry) → H (mobile/UX). A and B are correctness and trust;
  they precede feature depth. C's content expansion is the long pole and can run as parallel,
  sourced content waves while the code phases proceed.
- **Workflow shape.** Code phases (A, D, E, F, G, H) are best done in the main loop or a small
  workflow with adversarial verification of each acceptance criterion. Phase C's content is a
  classic fan-out: parallel finders per (country, category), each with an idempotency guard and
  a hard real-source requirement, an inter-wave validation gate, then integration. Begin every
  multi-phase run with the Phase 0 preflight. Respect rate limits: when the subagent pool is
  limited, main-loop web search and file work continue to function.

---

*End of brief. Execute Section 4 in order; treat Sections 0–3 and 5–7 as always-on constraints.*
