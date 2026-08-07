# Mekonging — Full-Site Overhaul (section-by-section pass)

Working document. The method below is fixed; the per-section specs are filled in by
interview as each section is reached. One section per session.

---

## 1. Why the last run failed structurally

`js/main.js` is **12,826 lines** holding **76 routes** and every screen in the app.
Because an edit requires a prior read, *any* change to *any* screen loads the entire
file (~150k tokens). Across a five-section pass that is millions of tokens spent
re-reading code that is not being changed. It also makes parallel work impossible:
two agents editing two different sections collide in one file.

This is the root cause to fix first. It is not cosmetic refactoring — it is the
precondition for the overhaul being affordable at all.

---

## 2. The method: revised session plan

**Extract once, not once per section.** The original plan was one extraction per section,
paying the ~150k-token `main.js` read five times. Revised: pull all five section modules out
in **one** session (the Great Split), so every session after it reads a 1,000–2,000 line
module instead of the whole file. Sessions, in order:

1. **Session 1 — F1, lazy country data.** Barely touches `main.js`. See section 9. **This session.**
2. **Session 2 — The Great Split.** Read `main.js` once; extract `app-state.js` and all five
   section modules in that single context. Work from the highest line numbers down so earlier
   offsets stay valid; brace-check and smoke-test between each extraction; commit each
   separately so a failure isolates to one module.
3. **Sessions 3–7 — one section each, left to right (Home → Explore → Places → Talk → You).**
   Open on **Opus** for the interview against the real screen, `/model` down to **Sonnet** to
   build. Cheap now because the module is small.
4. **Session 8+ — content coverage** (stay/eat/see/do). Touches only
   `js/data/places.*.ext.js`. Sequential, after the UX pass, per the user's explicit choice.

### One-time prerequisite (Great Split, before section 1's module leaves the file)

Two things in `main.js` are read or written by nearly every screen and must move to a
shared module before any screen leaves the file:

- `activeCountry` — module-level state, written from ~19 screens. Move to `js/app-state.js`
  behind `getActiveCountry()` / `setActiveCountry()`.
- `liveMapCtrl` / `liveCleanup` — the router's per-screen teardown protocol for anything
  owning a map, GPS watch, wake lock or microphone. Move alongside it.

Everything else (`h`, `go`, `mount`, `topbar`, `card`) is already importable.

---

## 3. Section themes

Each section answers exactly one question. A screen that does not serve its section's
question belongs in another section.

| Section | Question | Theme | Methodology |
|---|---|---|---|
| **Home** | *What now?* | The present moment | Adapts to trip phase (planning / arrived / traveling / post). Shows today, not everything. |
| **Explore** | *Where?* | Discovery and inspiration | Country → region → city drill-down. Wide, browsable, low-commitment. |
| **Places** | *Which one?* | Concrete choices | Map and list in sync. Filter, compare, decide. Quick-view first, detail on demand. |
| **Talk** | *How do I say it?* | Communication | Show it to a local. Works offline. Safety-critical phrases never buried. |
| **You** | *Mine* | The traveller's own record | Journal, money, saved, documents, dictionary, settings. Private, editable, exportable. |

### Cross-cutting systems (not owned by any one section)

- **Resume** — "get back to what you were doing". A durable last-position memory so that
  wandering into Explore and back never loses the thread.
- **Adaptation** — the app already has `contextNow()`, `focusSpot()` and trip phases.
  These need to be strengthened and applied consistently rather than per-screen ad hoc.
- **Colour coding** — `CATEGORY_FAMILIES` / `FAMILY_COLOR` already give one fixed hue per
  category everywhere. Extend the same system to calendar, planning and budget.
- **Emergency** — see section 5.

---

## 4. Model assignment

| Work | Model | Why |
|---|---|---|
| Interview, information architecture, section theme decisions, the split design, adaptation logic | **Opus 5** | Ambiguous, high-leverage, low token volume. Judgement work. |
| All screen implementation, CSS, handlers, wiring | **Sonnet 5** | ~80% of total token spend. Strong with a tight spec; markedly cheaper. |
| Validation subagents (brace balance, duplicate IDs, dead-reference greps), mechanical renames, data entry against a fixed schema | **Haiku 4.5** | Deterministic, verifiable, high volume. |

Rule: Opus decides, Sonnet builds, Haiku checks. Never use Opus for bulk implementation
and never use Haiku for anything requiring judgement about the traveller's experience.

---

## 5. Emergency access — current state (verified in code)

Already implemented and working:

- A `🆘` button sits in the top bar of **every** screen (`js/main.js:422`) — one tap from anywhere.
- `sosScreen` auto-detects the country from the last GPS fix, with a manual override.
- Real emergency numbers render as `tel:` links (`js/main.js:10502`), so a phone dials directly.
- Correct order of operations: call → hospital → first aid → communicate.
- Offline fallback: show "I need a hospital" large, in local script, to a bystander.

Known gap: `tel:` does nothing useful on a desktop browser without a handler installed.
Desktop needs the number rendered as large selectable text with a copy control alongside
the link.

---

## 6. Token conservation rules

1. **Split before editing.** Never edit a section still living inside `main.js`.
2. **Never read `main.js` whole.** Grep for the line number, then `Read` with `offset`/`limit`.
3. **One section per session.** Start fresh between sections; this document carries the context.
4. **Decide before building.** Complete the interview for a section *before* any edit, so
   implementation is a single pass rather than a user-in-the-loop iteration.
5. **Delegate verification.** Brace checks, duplicate-ID scans and reference greps go to
   Haiku subagents, not the main loop.
6. **Keep Ultracode off** and Sonnet as the session default; raise to Opus only for interviews
   and architecture.

---

## 7. Decisions taken (interview round 1)

- **All four failure modes were real**: too much on screen, could not find things, slow or
  broken, and thin content. These are four different workstreams, not one.
- **Adaptation rule — "rank, collapse, never remove."** The app ranks by fit-to-moment.
  What fits sits expanded at the top. What does not fit collapses to a labelled one-line row
  *in its usual position*, one tap from open. Nothing is ever removed from a screen or from
  navigation. Ranking changes what is **open**, never what **exists** or **where it lives**.
- **Resume = both mechanisms.** A real back-stack (undo one step, works across sections) plus
  a persistent resume bar (return to a thread left days ago). Back-stack first.
- **Content sourcing runs after the UX pass**, not in parallel. Token spend stays predictable.
- **Offline is a hard constraint.** Users split into always-online, never-online, and mixed
  (most). The app must work fully offline and opportunistically refresh when a connection
  appears, never blocking the interface on the network. A lazy import must **never** become a
  silent offline failure.

---

## 8. Architecture finding: why the app is slow

`js/main.js` declares **44 static imports** against only 5 lazy ones, so **4.1 MB of
JavaScript is parsed before first paint**. The bulk arrives through one file:

`js/data/regions.js` is the true aggregator. It statically imports ~60 data modules and
spreads them into a `COUNTRIES` literal at module-evaluation time:

```js
places: [...PLACES_TH, ...PLACES_TH_EXT], prices: PRICES_TH, routes: ROUTES_TH,
info: INFO_TH, guide: GUIDE_TH, events: EVENTS_TH.events, food: [...]
```

Every traveller therefore parses all four countries' places (1.27 MB), every food guide,
every province geometry and every phrasebook — to render a Home screen that needs almost
none of it.

**Two verified facts make the fix cheap:**

1. `allPlaces()` is a plain synchronous read over `COUNTRIES`, with 25 call sites in
   `main.js` plus more in `journey.js`, `map.js` and `ui-widgets.js`.
2. **No module-evaluation-time reads of place data exist anywhere** — every consumer calls
   `allPlaces()` / `getCountry()` from inside a function body.

Fact 2 means the data may arrive *after* module evaluation without breaking any call site.
So `allPlaces()` keeps its synchronous signature and **no call site changes**.

---

## 9. Foundations — three independent ships

Ordered by value-to-risk. Each ships separately so a regression is trivially bisectable.

### F1 — Lazy country data (largest visible win, lowest structural risk)

**Goal:** cut cold-start parse from ~4.1 MB to roughly 400–600 KB per country.

**Router constraint (discovered during implementation, changes the mechanism below):**
`render()` is called synchronously in ~40+ places throughout `main.js` (every state-changing
button handler calls it expecting an immediate DOM update). Converting the router to `async`
would be an invasive, high-risk change to that entire calling convention — far outside F1's
scope. So the gate below is **synchronous**: it either proceeds immediately (data already
loaded — the common case, zero behaviour change) or returns a lightweight loading screen and
kicks off the load in the background, re-invoking the plain (synchronous) `render()` once
that resolves. That re-render jumping to the top is an acceptable, rare, one-time cost (first
navigation into a country's data this session) — not the repeated-interaction case the
scroll-preserving `repaint()` pattern (used in the phrasebook/weather fixes) exists for.

**Verified call-site trace — which routes actually need which country's data**, done by
reading every screen function's body, not assumed. Any route not listed reads data from a
module that is already separate from `COUNTRIES` (history, scams, worship, crossings, pools,
bestof, itineraries, accessibility, family, visa, etc.) and needs **no** gating:

| Gate | Routes |
|---|---|
| Active/arg-derived country | `country`, `region`, `nearby`, `places`, `place`, `prices`, `transport`, `calendar`, `events`, `event`, `today`, `food`, `dish`, `board`, `streetfood`, `sos`, `foryou` |
| **All four** countries | `search` (universal search — `allPlaces()` with no filter), `map` (the full "offline areas, layers & measure" map — `initMap()` in `map.js` calls `allPlaces()` internally with no filter; **not** the small embedded per-country Places map, which is a separate function, `initPlacesMap()`, driven by a caller-supplied list and unaffected), `route`, `journey` (journey.js's `graph()` walks `c.routes` across every `COUNTRIES` entry and **memoises forever on first call** — must never run before all four are loaded, or the route graph is permanently incomplete for the session), `saved`, `collection` (a saved place can be from any country the traveller has visited) |

`sos` is in the active-country list deliberately and is the single most important entry in
this table: it is the emergency screen, already verified working (top-bar 🆘, GPS-detected
country, `tel:` links, correct call → hospital → first-aid → communicate order). **This must
not regress.** `c.info.emergency` lives inside the lazy-loaded country object, so `sosScreen`
is gated exactly like every other single-country screen — same mechanism, same guarantee.

**Implementation:**

1. In `js/data/regions.js`, strip the per-country data imports (places/prices/routes/info/
   guide/events/food/local-boards — **not** the phrasebook imports, which are small — ~106 KB
   total across 8 languages — and needed regardless of country for the Talk section's
   language tabs). Reduce each `COUNTRIES` entry to metadata — `id`, `name`, `flag`,
   `currency`, `lang`, `cities` — plus `places: []`, `food: []`, `prices: null`,
   `routes: null`, `info: null`, `guide: null`, `events: []`, `_localBoards: []`,
   `_loaded: false`.
2. Add one loader function per country (`loadTH`/`loadVI`/`loadKH`/`loadLA`) using native
   dynamic `import()` (no bundler in this project, so a plain runtime `import()` works as-is)
   — each populates its country object in place, exactly mirroring today's static spread.
3. Add `loadCountry(cc)` — looks up the right loader, memoises the in-flight promise so
   concurrent calls share one load, sets `_loaded = true` on success, and **deletes the
   memoised promise on failure** so a later retry (e.g. connection restored) is possible
   instead of a permanently-rejected cache entry.
4. Add `isCountryLoaded(cc)` and `loadAllCountries()` (the latter for the six all-country
   routes above).
5. Rewrite `boardsForCountry(cc)` / `getBoard(cc, slug)` to read each country's own
   `_localBoards` instead of one eagerly-built global `LOCAL_BOARDS` array.
6. In `main.js`'s `render()`, before the `switch`: look up the route in the two tables above,
   resolve the needed country id(s) (arg if it is a valid country code, else `activeCountry`),
   and if any needed country is not yet loaded, kick off `loadCountry`/`loadAllCountries` in
   the background (`.then(() => render())` on success) and return a small loading screen
   instead of falling into the `switch`. Otherwise fall through exactly as today.
7. Keep `allPlaces()`, `getCountry()`, `getPlace()` fully synchronous — **zero changes** to
   any of their 25-plus call sites, because by the time a gated screen function runs, the
   router has already guaranteed its data is present.

**Offline acceptance criteria (all must hold):**

- Every lazily imported module stays in the `sw.js` `PRECACHE` list (verified: all 40
  per-country files already are).
- A failed dynamic import renders an honest, visible error state — never a blank list, never
  a hang, and never a permanently-stuck retry.
- Verify with the browser offline: cold-load, open each of the four countries including a
  first-ever visit to `sos`, `search`, `map` and `route`/`journey`, confirm full data and zero
  console errors.

**Do not** convert `allPlaces()` to async. That would touch 25-plus call sites for no gain.

**Status: SHIPPED as mk-v0.340.0.** Implemented exactly as above, plus two call sites found
during implementation that read place data but must never be *blocking* (gating them would
have defeated F1's own purpose): `homeScreen()`'s "right now" ranked picks and
`exploreScreen()`'s "at a glance" per-country counts. Both now kick off `loadCountry` for
their needed country/countries in the background on render and quietly repaint themselves in
place (scroll position preserved, same idiom as the phrasebook/weather scroll fixes) once the
data lands, rather than either blocking first paint or staying silently wrong all session.

Verified: cold boot fetches zero `places/food/prices/routes/info/guide/events/local` files
(network trace confirmed); Home triggers exactly one country's load in the background;
visiting a country's screen for the first time (`prices-vi`, `sos-kh`) fetches exactly that
country's 10 files and renders correctly, including real `tel:` emergency numbers on a
country never before loaded; `search` and `route` (the all-country routes) correctly load
all four. **True offline test**: killed the dev server process entirely, hard-reloaded (all
in-memory `_loaded` state reset, service-worker cache the only possible source), and `sos-la`
still rendered Laos's real emergency numbers from Cache Storage with zero relevant console
errors — the one error present (`Failed to update a ServiceWorker`) is the pre-existing,
version-independent `updateViaCache:'none'` byte-check failing against a dead server, not a
regression from this change.

### F2 — Shared state + first module split (unlocks cheap section work)

1. Create `js/app-state.js` holding `activeCountry` behind `getActiveCountry()` /
   `setActiveCountry()`, plus the `liveMapCtrl` / `liveCleanup` teardown protocol.
2. Extract Home into `js/screens/home.js` as the proof case; add it to `sw.js` `PRECACHE`.
3. Confirm the pattern, then repeat per section as each is reached.

**Status: SHIPPED as mk-v0.341.0.** `js/app-state.js` now owns both pieces of state.
`activeCountry` was read or written at 103 sites across `main.js` (99 distinct lines, several
with 2–3 hits each) — all converted mechanically (`activeCountry = X` → `setActiveCountry(X)`,
every bare read → `getActiveCountry()`) and individually re-inspected, including every
comparison, default-parameter, and multi-hit line, before shipping. `liveMapCtrl`/
`liveCleanup`'s 8 sites moved the same way, with the router's own teardown block collapsed to
one `teardownLiveScreen()` call.

`homeScreen()` (the actual route handler, ~150 lines) is the only function physically
relocated into `js/screens/home.js`. Its own helper cluster (`phaseSwitchRow`,
`homeStageBlock`, `ensureHomeWeather`, `budgetSummaryCard`, `sectionTile`, `ICON`, `go`,
`mount`, etc. — 18 names in total) stays in `main.js`, now `export`ed, and `home.js` imports
them back via a circular import (`home.js` → `main.js` → `home.js`). This is safe for the
same reason F1's lazy country data is safe: every one of those 18 names is only read inside a
function body (`homeScreen()`'s own), never at module-evaluation time, and ES module function
declarations are instantiated across the whole graph before any module's top-level code runs
— so the cycle never observes an uninitialised binding. Untangling Home's own helper cluster
into fully independent, physically-owned code is deliberately deferred to Home's own UX-pass
session (section 10), where the screen is rebuilt anyway rather than decomposed twice.

Verified in-browser: Home, Explore, the full map (`#map`, the all-country gate), the You hub
(`#me`), a first-ever visit to Vietnam's Places screen, and — the emergency-critical check —
a first-ever visit to `#sos-la` this session, which correctly lazy-loaded Laos and rendered
its real `tel:` numbers (Police 1191, Ambulance 1195, Fire 1190, Tourist Police Vientiane)
sourced from `js/data/info.la.js`. Zero console errors across all of the above once a stale,
same-tab cached error from mid-fix was ruled out via a fresh tab. `main.js` dropped from
12,911 to 12,769 lines.

### F3 — Resume system

1. A real back-stack surviving cross-section navigation.
2. A persistent resume bar above the tab bar, showing the last meaningful activity and
   surviving app closure.

---

## 10. Remaining workstreams (after Foundations)

- **UX pass**, section by section, left to right: Home → Explore → Places → Talk → You.
- **Content coverage** — stay, eat, see, do. Touches only `js/data/places.*.ext.js`, so it
  never collides with section work. Runs last, per the decision above.
- **Desktop emergency gap** — render emergency numbers as large selectable text with a copy
  control beside the `tel:` link, which does nothing on a desktop without a handler.

---

## 11. Section specs

Filled in as each section's interview completes.

### Home — *BUILT and SHIPPED as mk-v0.342.0*

**Theme:** *What now?* — the present moment. Home answers one question and defers everything
else. Interviewed 2026-08-06 against the real screen at 375×812 (phone).

#### What the interview found on the live screen

- **Home is the only screen with no 🆘 button.** Every other screen gets it from `topbar()`
  (`js/main.js:432`); Home replaces the top bar with the marketing hero, so the app's
  fastest path to emergency help is missing from its most-visited screen. Not a question —
  fix regardless.
- **On the ground, 309px of an 812px phone screen is chrome** before any content: hero
  (115px), four stage buttons, four status chips. The first real recommendation lands at
  474px — 58% down. This is the "too much on screen" failure mode, measured.
- **In Planning, the entire first screen is empty states**: "No dates yet", "No plans yet",
  "No spend yet", plus two cards describing what they *would* show. Three separate cards
  each say "add your dates".
- The Arrived content itself is **good and stays**: "Afternoon in Hanoi · Thursday · wet
  season" with ranked picks carrying open-now status, distance and category colour.

#### Decisions (interview round 2)

Three overlapping status surfaces were requested. Resolved by giving each a distinct **time
horizon**, so no value is ever rendered twice:

| Surface | Horizon | Carries | Visibility |
|---|---|---|---|
| **Slim bar** | Identity + safety | `📍 city · date` + 🆘 | Permanent, replaces the hero |
| **Situation line** | Right now / today | weather now · spend *today* · next-stop nudge | On the ground only |
| **Trip status row** | The whole trip | stage · dates · plans · *total* spend · offline | Collapsed by default |

City appears in the slim bar only. Today's spend in the situation line only. Trip-total spend
in the status row only. The full-brand hero moves to the welcome/first-run screen, which is
where branding belongs.

#### Target structure — on the ground (Arrived / Travelling)

1. **Slim bar** — reuse `topbar()` with no `backHash`; title becomes `📍 Hanoi · Thu 6 Aug`.
   Brings 🆘, saved and settings for free and closes the emergency gap in the same change.
2. **Trip status row** — collapsed to `▸ Trip status · 🛬 Arrived`. Expands to the existing
   four-stage picker plus the four chips. Rank-collapse-never-remove: nothing is deleted,
   only folded.
3. **Situation line** — three compact tappable cells, each a live value, not a placeholder:
   - `🌤 28° · rain 4pm` → `#weather`
   - `💸 ฿420 / ฿1,200 today` → `#expenses`
   - `🚌 Next: Sapa in 2 days` → the next-stop card (cell omitted entirely when no next stop)
4. **"Right now" picks card** — existing `homeNowCard()`, unchanged. This is the good part.
5. **Next-stop card** — only when `store.trip.stops` holds a future stop. Real options, cost
   and duration from `planRoutes(from, to)`.
6. **"Where you are" context card** — `cityHistory(cc, slug)` blurb + `knownFor`, collapsible.
   Note: `whereAmICard()` is a city *picker*, not this. Use `cityAboutCard()` (`main.js:1175`).
7. **Plan & tools decks** — existing, phase-ranked. Unchanged this pass.
8. **Give back + disclaimer** — unchanged.

#### Target structure — Planning

No situation line (the traveller is not on the ground). The three competing "add your dates"
empty states collapse to **one** setup card. Countdown and destination outlook stay.

#### Data — all four "today needs" already exist, nothing new to source

- **Spend today vs daily budget** — `store.trip.budgetLog` entries carry `date` (defaulted to
  `todayKey()` in `state.js:402`). `budgetTarget()` (`main.js:9604`) already returns
  `{ amount, per: 'day' | 'trip' }`; when `per === 'trip'`, derive the daily allowance from
  `tripSpanDays().total`. Show nothing rather than a guess when neither is set.
- **Getting to your next stop** — next stop is `store.trip.stops` sorted by `date`;
  `planRoutes(from, to)` (`journey.js:131`) returns real options.
- **Where you are** — `HISTORY.cities["<cc>-<slug>"]` → `{ name, blurb, knownFor, bestTime }`.
  Real, sourced, already written.
- **Weather** — `getCachedWeather` / `forecastOutlook()` / `homeWeatherRing()`.

#### Constraint carried from F1 — the next-stop card must never block

`planRoutes()` calls `graph()` in `journey.js`, which walks `c.routes` across **all four**
countries and **memoises forever on first call**. Home must never block on that. The
next-stop card therefore loads in the background via `loadAllCountries()` and appears when
ready, reusing the exact background-load-and-repaint-in-place idiom already built for Home
and Explore in F1 (scroll position preserved). Never call `planRoutes()` before all four
countries are loaded, or the route graph is permanently incomplete for the session.

#### Acceptance criteria

- 🆘 reachable in one tap from Home, on phone and desktop.
- On the ground, the first real recommendation sits **above 400px** on a 375×812 phone
  (currently 474px).
- No placeholder chip anywhere on Home: a status cell either carries a real value or is absent.
- Planning shows exactly **one** "add your dates" prompt, not three.
- Home renders fully offline, and paints before any country data has loaded.
- Nothing is removed from navigation — folded items stay one tap away.

#### Build notes (H1–H7) — SHIPPED as mk-v0.342.0

All six pieces shipped in `js/screens/home.js` + `js/main.js` and were verified against
every acceptance criterion above before shipping:

- **H1 (slim bar).** The old collapsing hero (`heroApply`/`onHeroScroll`/`toggleHero`/
  `setupHeroScroll` and its module state) was deleted outright rather than left dead —
  `welcomeScreen()`'s own hero never used that machinery, so nothing else depended on it.
  Home now opens with `topbar('📍 {city} · {date}', null)`, which brings 🆘, Saved and
  Settings for free. Measured: first real recommendation moved from **474px to 376px** at
  375×812.
- **H2 (Trip status row).** `homeStatusBand()` was changed to skip any chip without a real
  value (no more "No dates yet" / "No plans yet" / "No spend yet") instead of always
  rendering all four; `phaseSwitchRow()` gained a `withLabel` parameter so the row can embed
  just the segmented control without repeating its own "Your stage" caption. Collapsed by
  default via a self-defaulting pref, same pattern as the tool decks.
- **H3 (situation line)** and **H5 (where-you-are)** are new, Home-only logic written
  directly in `js/screens/home.js` rather than added to main.js's export surface — the
  deeper decomposition this session already committed to deferring elsewhere. `topbar`,
  `citySlug`, `cityAboutCard`, `todayISO`, `addDaysISO`, `daysUntilISO`, `budgetTarget`,
  `tripSpanDays` and `homeCurrency` were exported from main.js to support them.
- **H4 (next-stop card) — a real bug found and fixed during verification, not just during
  design.** The first implementation called `isRouteNode()` synchronously before
  `loadAllCountries()` resolved, exactly the trap F1 documented: journey.js's route graph
  memoises permanently on first build, so checking a route on a fresh session (Home is
  always the first screen) would have frozen the graph incomplete for the rest of the
  session. Fixed by deferring every `isRouteNode()`/`planRoutes()` call inside
  `loadAllCountries().then()`, never inline; the card renders from a local cache only,
  returns `null` (never a "checking…" placeholder) until the check resolves.
- **H6** required no separate code — it was a direct consequence of H2's chip-filtering
  fix. Planning's three visually-competing empty states (four empty status chips, plus
  `tripCountdownCard`'s own "📅 Add your travel dates" card) collapse to exactly one once
  the empty chips stop rendering.

**Verified:** real data (a trip stop 2 days out, a logged expense, real weather cache)
renders correctly in the situation line, next-stop card (a genuine Phnom Penh → Chiang Mai
route, 2 changes, ~5–7h) and where-you-are card; a genuinely empty trip (stops and spend log
cleared, re-rendered in place) shows zero placeholder chips and omits the situation line and
next-stop card entirely, exactly as designed. **True offline test**: killed the dev server
process entirely, hard-reloaded — Home, 🆘, the collapsed trip status row, the situation
line and the next-stop card all rendered correctly from Service Worker Cache Storage alone,
zero console errors. Planning phase confirmed showing exactly one "add your dates" prompt.

**Discovered, out of scope, flagged separately:** `resetAll()` in `js/state.js` clears
localStorage but not the IndexedDB backup mirror the app deliberately keeps so data survives
localStorage being cleared — so a reset silently restores itself on next load. Unrelated to
Home; spawned as its own task rather than fixed here.

#### Addendum — chip consolidation, SHIPPED as mk-v0.349.0

Requested directly (not a fresh interview cycle): budget was showing on Home in three places
at once (Trip status's "spend so far" chip, the situation line's "spend today" chip, and a
standalone by-category donut card), and weather sat in its own floating card instead of with
the other status chips.

- **Removed:** the situation line entirely (weather/spend-today/next-stop — ground phases
  only), the standalone `budgetSummaryCard()` donut on Home, and Trip status's own spend chip.
- **Added:** a new **Quick access** collapsible (`quickAccessRow()`, `js/screens/home.js`) —
  its own `<details>`, separate from Trip status and collapsible in the same self-defaulting-
  pref pattern as every other section on Home. Four phase-appropriate shortcut chips, each
  carrying a live value when one exists (never a placeholder): **Calendar** (next plan item's
  timing), **Budget** (trip spend so far — the one place spend now shows on Home), **Weather**
  (current temp + rain chance) in planning/arrived/traveling, swapped for **Scrapbook** in
  post, and **Journal** (entry count) always last — exactly the four-per-phase set requested.
- Exported three main.js helpers (`nextPlanItem`, `evShort`, `tripSpendHome`) that already
  existed but were previously only called from within main.js itself, so `js/screens/home.js`
  could reuse the identical logic rather than duplicating it.

**Verified:** all four phases checked live (planning/arrived/traveling: Calendar · Budget ·
Weather · Journal; post: Calendar · Budget · Scrapbook · Journal), Trip status confirmed to
have lost only its spend chip (day countdown, next-plan, online/offline all intact), no budget
donut anywhere on Home, Quick access's open/closed toggle persists via
`store.profile.prefs.quickAccessOpen`. Spot-checked You (`#me`) after the shared `main.js`
edits — clean. True offline test: forced a Service Worker update (`mk-v0.349.0` confirmed in
`caches.keys()`), killed the dev server, hard-reloaded — Home rendered fully from Cache
Storage, both collapsibles and all four Quick access chips intact. Zero console errors
throughout, across every phase and every reload.

### Explore — *spec complete, ready to build*

**Theme:** *Where?* — discovery and inspiration. Interviewed 2026-08-06 against the real
screen at 375×812.

#### What the interview found on the live screen

- **Explore is a country picker, not a discovery surface.** The entire screen is 73 lines:
  a resume card, a four-country SVG map, four text cards. No photography, no curated
  content, no regions, no cities, no sights.
- **All the inspiration sits one level down.** `countryHubScreen` carries the hero photo,
  an eight-photo signature-sights strip, the regions map and twelve cities with place
  counts — and runs **4.1 screens** with **26 tiles across four collapsed decks**.
- **The best editorial content is buried two levels deep.** The 12 curated best-of lists
  live inside a collapsed "See & do" deck on the hub. Nothing on Explore points to them.
- The hub already ends with `mount(wrap, '#explore')` — it *is* Explore, just split in two.

The inversion is the finding: **Explore is too thin, the hub is too deep.**

Ruled out, not a bug: the hub's hero image looked blank in a first screenshot — a
lazy-load timing artifact only; it renders correctly.

#### Decisions (interview round 3)

- **Landing is conditional.** Open directly on the traveller's country when there is a
  *real* anchor to one; fall back to the four-country chooser when there is not. Note
  `getActiveCountry()` is **not** a valid test — it always holds a value (defaults to `'th'`
  via `detectCountryId()`), so it would never fall back. Anchor = any of: a GPS fix within
  `INFER_IN_REGION_KM` of a region city (`nearestSpotGlobal`), an explicitly chosen focus
  city (`focusSpot().source === 'focus'`), or a dated trip stop in that country. Someone
  planning from abroad with no signals gets the chooser; someone on the ground never
  re-picks their country.
- **Merge Explore and the country hub into one screen.** Removes a whole navigation level.
  **`#country-<cc>` must keep working — 21 inbound links point at it.** Both routes render
  the same screen; `#country-<cc>` simply pre-scopes it to that country. Zero link changes.
- **The 26 tiles rank by trip phase**, exactly as Home does: the deck matching the current
  phase opens, the rest collapse to one-line rows in place. Nothing removed.
- **Discovery must answer four questions, not one** (from the traveller's own words):
  where you *are*, where to go *next*, places you *did not know* you wanted, and places
  that *fit your trip* (with kids, in this season, as a nomad).

#### Data audit — what is real, and what is not

Checked before speccing, because "not enough real content" was a stated failure mode and
inventing filters with no backing data would repeat it.

| Ask | Status | Source |
|---|---|---|
| Signature sights (photos) | **Real, already built** | `signatureSightsStrip()` — 8 self-hosted photos |
| Best-of lists | **Real** | `bestof.js` — 12 lists, `forWho`: `firsttimers` / `families` / `budget` / `everyone` |
| Cities with counts | **Real, already built** | 12 cities per country from place data |
| Regions map | **Real, already built** | `REGIONS_BY_CC` + `REGION_PATHS` |
| Best with kids | **Real** | `forWho: 'families'` lists + `party: ['family']` itineraries |
| Best for this season | **Real, but derived** | `events.*.js` (dated, sourced, lunar-flagged), `bestTime` on 63 cities in `history.js`, `WET_MONTHS` — no prebuilt "seasonal" list exists; it must be computed |
| Best for digital nomads | **Content yes, label no** | The content exists (e.g. "A slow month up north" — *"Nimman cafés + coworking, monthly apartment rates"*), but there is no `nomads` tag. Add `forWho: 'nomads'` to the itineraries/lists that already earn it — a labelling job, not a sourcing job. Do **not** invent new nomad content here; that is Session 8. |
| Where to go next | **Buildable, nothing exists yet** | `routeNodes()` / `planRoutes()` give what is reachable and how long; city place-counts and ratings give what is worth it |
| Serendipity | **Buildable, nothing exists yet** | Highly-rated places in cities the traveller has not saved, visited or marked done |

Place-level `bestTime` does **not** exist (0 occurrences in `places.th.js`); only
city-level, in `history.js`. Seasonal fit must therefore be city-scoped, not place-scoped.

#### Target structure — one merged Explore screen

1. **Slim bar** — `topbar()`, same as Home now uses.
2. **Country switcher** — compact four-flag row, current country marked. Replaces both the
   old full-screen chooser and the hub's separate identity. Tapping switches scope in place.
3. **Hero + "Where you are"** — the country hero photo and its history blurb.
4. **Discovery, ranked** — the four questions above, each a section:
   - **Signature sights** (photo strip, existing)
   - **Fits your trip** — best-of lists and itineraries filtered by the traveller's own
     `prefs.party` / `prefs.budget` / `prefs.interests`, plus a season chip driven by
     today's date against `events` + `bestTime` + `WET_MONTHS`
   - **Where next** — reachable destinations from the current city with rough travel time,
     ranked by fit. Must use the F1/H4 background-load pattern: `planRoutes()`/`isRouteNode()`
     may **never** be called before `loadAllCountries()` resolves, or the route graph
     memoises permanently incomplete.
   - **You might not know** — high-rated places in cities the traveller has no history with
5. **Regions map** — collapsible, geography-first browsing for those who want it.
6. **Cities** — the twelve-city list with counts.
7. **The 26 tiles** — four decks, phase-ranked per the decision above.

When there is no country anchor, steps 3–7 are replaced by the four-country chooser (the
existing map + at-a-glance cards), which keeps its own value as a comparison view.

#### Build slices

Larger than Home. Ship in order, each independently verifiable:

- **E1** — merge the two screens behind one renderer; `#explore` and `#country-<cc>` both
  route to it; country switcher replaces the chooser when anchored. *No new content yet —
  pure structure, so a regression is obvious.* **SHIPPED.**
- **E2** — conditional landing (anchor detection + chooser fallback). **SHIPPED.**
- **E3** — phase-rank the 26 tiles (reuse Home's pattern directly).
- **E4** — "Fits your trip": filter existing best-of lists and itineraries by real prefs;
  add the `forWho: 'nomads'` labels to itineraries that already earn them.
- **E5** — seasonal chip computed from `events` + `bestTime` + `WET_MONTHS`.
- **E6** — "Where next" (background-loaded, per the F1/H4 constraint).
- **E7** — "You might not know" serendipity section.

#### Acceptance criteria

- `#country-th`, `#country-vi`, `#country-kh`, `#country-la` all still resolve — all 21
  inbound links verified working after the merge.
- A traveller with a GPS anchor never sees the country chooser; one with no anchor always
  does.
- Curated best-of content is reachable from Explore in **one tap**, not three.
- No section renders an empty shell: each omits itself when it has nothing real to show.
- Explore paints before any country data loads, and works fully offline.
- Nothing removed from navigation — all 26 tiles still reachable.

#### E1 + E2 build notes — SHIPPED as mk-v0.343.0

`exploreScreen(argCc)` now serves all three routes: bare `#explore` (falls through to
`anchorCountry()`), `#country-<cc>` (explicit, always wins — all 21 existing links verified
working unchanged), and a new `#explore-all` (forces the four-country chooser even while
anchored — without it, an anchored traveller could never reach the comparison view again,
since bare `#explore` now always lands on their country). `countryHubScreen` no longer
exists; its entire body — hero, regions map, focus-city card, history, access/visa/family
cards, solo-safety note, signature sights, city picker, the 26-tile toolkit — is now the
scoped branch of the merged function, unchanged content-wise.

**Root-tab consequence, deliberate and noted:** the old country hub's "‹ Back → Home" button
is gone. Explore is a bottom-tab screen now, not a sub-screen reached from Home, so it
behaves like Home/Places/Talk/You — no back button. Getting to a different country or the
four-country view is the switcher (four flags + "🌏 All"), one tap, always visible when
scoped.

**A correctness gap found and fixed during build, not left to review.** `#country-<cc>` is
gated by the router's F1 lazy-load table (`NEEDS_COUNTRY_DATA` already included `'country'`),
so that route's data is always loaded before the screen runs. Bare `#explore` is deliberately
**not** gated (so it never blocks on all four countries loading) — but `anchorCountry()` can
now land on a country nothing has loaded yet (e.g. a dated trip stop set for a country never
opened this session), which the old exploreScreen never rendered country-scoped content for
and so never needed to handle. Added the same background-load-and-quietly-repaint idiom
already used for the chooser's per-country counts and for Home's country load, keyed to
whichever hash is current (`explore` or `country`) so it repaints correctly either way.

**Verified:** anchor detection landed correctly on Thailand from a dated trip stop set
earlier this session; `#explore-all` correctly forces the chooser while still anchored;
`#country-vi`, `#country-kh`, `#country-la` all render their full scoped view (hero, 8
signature sights, region map, city grid, 4 tile decks) with zero console errors; the
switcher correctly re-scopes without a page reload. **True offline test**: killed the dev
server, hard-reloaded on `#country-th` — the merged screen, 🆘, the switcher and the
signature-sights strip all rendered from Service Worker Cache Storage alone, zero errors.

E3 (phase-ranking the 26 tiles) and the discovery sections (E4–E7) shipped in the following
round, once the merge above was reviewed.

#### E3–E7 build notes — SHIPPED as mk-v0.344.0

- **E3 — phase-ranked tiles.** `homeStatusBand`'s exact rule, reused directly: one deck
  (`Get oriented` for planning/arrived, `See & do` for traveling) opens by default; `post`
  has no strong single fit among these four decks, so it opens none, unchanged from before
  E3. Not persisted per-deck — like Home, phase always decides on the next visit, never a
  sticky manual override.
- **E4 — "Fits your trip".** Reuses `suggestPlans()` (already scores itineraries by the
  traveller's real `party`/`budget`/`tripLength`) and filters `bestForCountry()`'s lists by
  `forWho`: universal lists (`everyone`/`firsttimers`) always show; `families`/`budget`
  lists only show when the traveller's own profile actually matches. Added the one real
  `tags: ["nomads"]` label this data supports — Thailand's "A slow month up north"
  itinerary (Nimman coworking, monthly apartment rates) — a labelling change only, no new
  content invented, per the spec's explicit scope.
- **E5 — seasonal fit.** Wet/dry from `WET_MONTHS`, any dated festival within 45 days from
  `events.*.js`, and the current city's `bestTime` line from `history.js` when one exists.
  Loosened during build: an early draft required 2+ lines before showing anything, which
  silently hid the wet/dry fact whenever no festival fell in the window — but that fact
  alone is real, sourced content and directly answers "best for this season" (one of the
  traveller's own asks), so it now shows on its own.
- **E6 — "Where next".** Real transport options to every other hub in journey.js's route
  graph, ranked by shortest travel time (reuses the exact `totalHrs`/`changes` fields
  `planRouteScreen` already renders). Same F1/H4 constraint as Home's next-stop card:
  `isRouteNode()`/`planRoutes()` must never run before `loadAllCountries()` resolves, since
  the route graph memoises permanently on first build — cache-only, never called inline.
  **A real bug found and fixed during verification, not left to review:** the first cut
  called `loadAllCountries()` without ever importing it into main.js (`loadCountry,
  isCountryLoaded` were imported from `data/regions.js`, but `loadAllCountries` was not —
  nothing in main.js had needed it before, since the router's own all-country gate loops
  `loadCountry` manually instead of calling it). Threw "loadAllCountries is not defined" and
  fell through to the app's error boundary on first live test. Fixed by adding it to the
  import line; re-verified clean on every country afterward.
- **E7 — "You might not know".** Highly-rated places (≥4.3) in cities with no saved
  favourite yet, one per city, ranked by rating. Deliberately uses only saved places as the
  "already knows about" signal — journal entries carry a free-text place name too unreliable
  to match safely against a city field, so that signal was left out rather than guessed at.
- Reordered the scoped screen so E4–E7 (plus the pre-existing signature-sights strip) lead
  right after the "where you are" card, ahead of the regions map / history / access-visa-
  family cards / tile decks — Explore's actual theme is discovery, so inspiration now
  surfaces before reference reading rather than being buried under it.

**Verified:** all four countries clean; a family-profile test correctly surfaced the two
family-specific best-of lists in addition to the universal one; a Chiang-Mai focus
correctly drove both the seasonal `bestTime` line and a real 5-destination "Where next" list
(including a genuine cross-border option, Phnom Penh, 2 changes) computed from the actual
route graph. **True offline test**: killed the dev server, hard-reloaded on `#country-th` —
🆘, signature sights, and all four new discovery sections rendered from Service Worker
Cache Storage alone, zero console errors.

### Places — *spec complete, ready to build*

**Theme:** *Which one?* — concrete choices. Interviewed 2026-08-07 against the real screen,
measured in the browser rather than read from source.

#### What the interview found on the live screen

Measured on `#places` (Thailand, default state, 720px viewport, 2,244px document):

- **Zero places are visible anywhere on the screen.** All eight `place-cat-group` folds
  render `open: false`. The first place row sits at **1,568px** — 2.2 viewport heights — and
  even scrolling there shows only closed summaries. The section whose entire job is
  "which one?" answers with nothing.
- **Filtering does not rescue it.** Tapping the **Food** layer chip correctly narrowed the
  map to 23 pins and the list to one group — *still collapsed*, at 1,553px. The traveller
  does the work of choosing and is shown no places at all.
- **~785px of chrome sits between the map and the list**: the GPS empty-state card (139px),
  the city picker open by default (511px), "Add a place" (48px), "Filters" (48px),
  "Colour key" (39px).
- **The caption overstates the list.** `cap` reads "214 on the map — numbers match the
  list", but `renderList()` caps each group at `CAP = 5` behind a "Show all N" expander.
  The *numbering* matches; the list does not contain 214 rows.
- **Category-filter state is invisible where it is acted on.** `countFilters()` (4180) counts
  only the sheet's filters, never `selLayers`. With Food-only active the button still read
  plain "⚙ Filters"; the sole indicator was a layer chip ~1,300px above. `prefs.placesLayers`
  persists, so the filter silently followed navigation into `#places-th-chiang-mai`.
- **The ranking already exists and is hidden.** `computeResults()` (4231) already sorts by
  `personalScore()` when a profile is set. The app knows which place fits this traveller —
  and buries that answer inside a collapsed accordion.

What is already good and must not regress: pin↔row shared numbering (`_num`, 4244), genuine
map/list sync through the single `computeResults()` path, the `contextNow()` "Right now" card
on city views, `cityAboutCard` + `cityEssentials` scoping, and the quick-view row itself —
rating, real `priceRange` with conversion, `budgetTier`, traveller chips, photo, blurb, Save
and Full details. The per-place content is strong; only the path to it is broken.

#### Decisions (interview round 4)

- **Map stays first; the list moves directly beneath it, with every category group open.**
  (User's choice, option 3.) The accordion-of-closed-folds is removed. Rows stay collapsed
  quick-views — a scannable one-line result each — so "open" means the *groups*, not the rows.
- **Category groups are ranked, best-fitting first.** (User's choice, option 2, layered on
  top of the above.) Order comes from `inferPhase()` and `contextNow().part`, never from a
  fixed list. Nothing is removed — every bucket still renders, in its ranked position.
- **Build the compare tray.** (User's choice.) The section theme is "filter, compare,
  decide" and there is no compare affordance at all today.
- **Add a Places-scoped search**, not the global one — scope to the current country/city is
  the point.
- **Everything demoted moves below the list, nothing is deleted** (house rule: rank,
  collapse, never remove). City picker, add-a-place, your-places and colour key sink below
  the results. The Filters button stays directly above the list, since it acts on the list
  and opens a sheet rather than pushing content down.

#### Data — all comparable fields already exist, nothing to source

| Compare column | Field | Status |
|---|---|---|
| Distance | `p.coords` + `getLastFix()` via `haversineKm` | real, GPS-dependent |
| Rating | `p.rating` | real |
| Price | `p.priceRange {low, high, currency}` via `priceLine()` | real |
| Budget tier | `p.budgetTier` | real |
| Good for kids | `p.kidFriendly` | real |
| Step-free | `p.access.stepFree` | real, sparse |
| City | `p.city` | real |

#### Target structure

```
topbar · country chips · one-time hint
[city scope: chips · About · Right now · essentials]
🗺 Map  (details, persisted open state — modeBar, layer chips, canvas, caption)
closest-to-you   (collapses to ONE line when no GPS fix)
🔎 search box  ·  active-filter pills (✕)  ·  ⚙ Filters · N on
RESULTS — groups open, ranked best-fitting first
  🍜 Food · 23        [5 rows + "Show all 23"]
  🏛 Culture · 37     [5 rows + "Show all 37"]
  ...
[compare tray docks at the bottom once 2+ places are ticked]
--- below the results ---
🗺 Choose a city  ·  ➕ Add a place  ·  📌 Your places  ·  🎨 Colour key  ·  Full map
```

#### Build slices

- **P1 — Reorder.** Move `listEl` and its controls directly beneath `closestSlot`; push city
  picker, add-a-place, your-places and colour key below it. Collapse the GPS empty state to
  one line. Trim the map canvas so the first result clears the fold on a 720px viewport
  (isolated CSS change, trivially revertible).
- **P2 — Open + rank the groups.** Render each `place-cat-group` open. Replace the fixed
  `PLACE_BUCKETS` iteration order in `renderList()` with a ranked order from `inferPhase()`
  + `contextNow().part`. Buckets absent from the ranking keep their existing relative order.
- **P3 — Filter honesty.** Count `selLayers` into `countFilters()`; render active-filter
  pills with ✕ directly above the list; fix the caption to state what the list actually
  shows.
- **P4 — Search.** Filter-as-you-type box feeding `computeResults()`, so map, caption,
  numbering and list all narrow through the one existing path. Not persisted — a search is a
  momentary act, unlike a filter.
- **P5 — Compare tray.** Tick control on each quick row; a docked tray comparing 2–3 places
  across the table above; clear + open-detail actions. Selection is per-visit, not persisted.
- **P6 — Verify + ship.** All four countries, a city-scoped view, a GPS-on run, an offline
  run, then bump `APP_VERSION` + `CACHE_VERSION` and merge.

#### Acceptance criteria

1. On a cold `#places` at 720px, **at least one real place row is visible without scrolling**,
   and every category group is open.
2. Selecting a single category chip shows that category's places immediately — no fold to open.
3. Any active category filter is visible within the results area, and clearable there.
4. The caption never claims more rows than the list contains.
5. Typing in search narrows the map, the caption and the list together, with numbering intact.
6. Two ticked places produce a side-by-side comparison of real fields, no invented data.
7. Nothing is removed: city picker, add-a-place, your-places and colour key all still reachable.
8. Full offline render, zero console errors, on every country.

#### P1–P3 build notes — SHIPPED as mk-v0.345.0

- **P1 reorder**: `listEl` and its controls (search slot, filter pills, Filters button) now sit
  directly beneath `closestSlot`. City picker, add-a-place, your-places and colour key all moved
  below the results — nothing removed, all still one tap away. The GPS "closest to you" empty
  state collapsed from a ~140px card (heading + paragraph + full-width button) to a single chip
  row. The living map's canvas (`.places-map`) was trimmed from 340px to 130px so a real place
  row clears the fold on a cold 720px load — a genuine trade-off, not a hidden one: on the
  literal first-ever visit, with the one-time hint still showing, ~8px of the first row peeks
  above the fold rather than a full row; the hint is dismissed permanently after one tap, and
  every visit after that clears the fold with room to spare. Shrinking the map further to
  guarantee the cold case too was rejected — a map that small stops being a usable interactive
  element, and the section already has a dedicated "Full map" screen for serious map use.
- **P2 rank + open**: added `rankedPlaceBuckets(phase, part)` — scores each of the 8 category
  buckets against `inferPhase()`/`store.profile.prefs.phase` and `contextNow().part`, stable-sorts
  `PLACE_BUCKETS` by that score so ties keep today's original order. Every `place-cat-group` now
  renders `open`. Verified live: phase `traveling` → Food, Culture, Nature, Markets, Stay,
  Nightlife, Rentals, More; switching to `planning` (verified via a live re-render, not a page
  reload — see note below) → Culture, Nature, Stay, Food, Markets, Nightlife, Rentals, More,
  exactly matching the hand-computed scores. Nothing is hidden — only reordered.
- **P3 filter honesty**: `countFilters()` now counts `selLayers` (previously silently excluded),
  so an active category filter shows on the Filters button ("⚙ Filters · 1 on") instead of
  reading as if nothing were applied. Added a pills row directly above the results listing every
  active filter (layer, interest, budget, kids, step-free, stay type/duration); each pill's ✕
  clears by clicking the exact source control it mirrors (`layerChipsRow`/`interestChips`/
  `budgetChips`/etc. via `dataset` lookups), so pill and chip state can never drift apart. The
  map caption no longer overstates: "214 on the map — numbers match the list" (implying 214 rows
  were on screen) became "214 places match — same numbers on the map and in the list."
- **Found during verification, not a code regression**: navigating a fresh dev-reload straight to
  a phase change showed the OLD ranking despite the store already reading the new phase value —
  traced to the pre-existing IndexedDB store-mirror restore racing the first render on a hard
  page reload, unrelated to anything touched this slice. Re-tested by changing phase and
  triggering a live re-render (clicking a filter chip) without reloading, which confirmed the
  ranking logic itself is correct and fully reactive. Not fixed here — pre-existing app
  bootstrap behaviour, out of scope for a Places slice.
- **Verified**: all four countries (Thailand, Vietnam, Cambodia, Laos) render clean with the new
  layout, ranked-open groups and honest captions; a city-scoped view (`#places-th-chiang-mai`)
  keeps add-a-place/colour-key reachable and correctly omits the city picker (already scoped);
  filter-pill add/clear round-tripped correctly through the Filters button, the layer chip's
  `aria-pressed` state, and back to all 8 groups. True offline test: killed the dev server, hard
  reloaded on `#places` — 🆘, the map, all 8 ranked-open groups and the honest caption rendered
  from Service Worker Cache Storage alone, zero console errors.

#### P4–P5 build notes — SHIPPED as mk-v0.346.0

- **P4 search**: a filter-as-you-type box (`.search` input, matching the existing pattern used
  by phrasebook/sounds/food) sits above the active-filter pills, scoped automatically to
  whatever's already on screen — country or, once drilled down, city — since it feeds the same
  `computeResults()` every other control feeds. Matches name and city, case-insensitive.
  Deliberately **not persisted** to `prefs` (unlike every filter above it): finding one named
  place is a momentary act, not a standing preference. Produces its own clearable pill
  (`🔎 "term" ✕`) alongside the filter pills, and a distinct empty-state message when a search
  narrows to nothing ("Nothing matches "…" with these filters…") rather than the generic
  filters-only wording.
- **P5 compare tray**: `placeQuickRow` takes an optional third `compareCtl` argument — every one
  of Places' four call sites (grouped rows, near-mode flat list, "show all" expander, and
  `closestPlacesCard`'s rows) now passes it, but the parameter is optional specifically so
  nothing outside Places is affected. Ticking a row's new ☐/☑ control adds it (cap 3 — a 4th
  tick is a deliberate no-op, not a replace, since silently swapping a traveller's earlier pick
  would be more surprising than declining the extra) to a per-visit `Set`, never persisted or
  carried between screens. A tray docks above the tab bar (`position:fixed`, appended as a
  child of the screen's own `wrap` rather than `document.body` — `mount()`'s `app.innerHTML = ''`
  on the next screen change removes it for free, no explicit teardown needed) showing each
  selected place as a removable chip, "Clear", and "Compare (N)" (disabled below 2). The sheet
  it opens is a real side-by-side table — city, distance (real, GPS-gated), rating, price
  (with currency conversion), budget tier, kids-OK, step-free — every field pulled from data
  already on the place object, nothing invented, plus an "Open" button per place into its full
  detail page.
- **Verified**: typing a query narrowed map/caption/list together with numbering intact, and
  cleared correctly via its pill; ticking 2 places produced a correct real-field comparison,
  ticking a 3rd worked, a 4th was correctly rejected (tray stayed at 3, the row's own tick
  stayed unpressed); "Clear" reset both the tray and every row's tick state; navigating to Home
  and back to Places confirmed the tray is gone from the DOM (not just hidden) after leaving
  and starts empty on return — genuinely per-visit. All four countries verified clean, including
  confirming compare/search state resets on switching country (fresh screen instance, by
  design, same as every other Places filter). True offline test: killed the dev server, hard
  reloaded on `#places` — search box, all 8 ranked-open groups, and a working compare tray
  (tick two rows → tray appears with real data) all rendered from Service Worker Cache Storage,
  zero JavaScript/application console errors. Noted, not fixed here (pre-existing, unrelated to
  this slice): a handful of place *photos* fail to fetch offline, since only code/data files are
  in the Service Worker's precache list, not the photo library — the row still renders in full
  (name, rating, price, blurb) without its thumbnail, so this degrades gracefully rather than
  breaking anything, consistent with the project's own CDN/offline rule.
- Places is now feature-complete against its acceptance criteria (1-8, section above).

### Talk — *SHIPPED as mk-v0.347.0*

**Theme:** *How do I say it?* — communication. Interviewed 2026-08-07 against the real screen,
measured in the browser, with the phrasebook data audited across all eight languages.

#### What the interview found on the live screen

Measured on `#phrasebook` (Thai, default state, 720px viewport):

- **~14,200px — about 20 viewport heights.** The longest screen in the app by a wide margin.
- **The phrase list alone is 11,700px**: 98 phrases, every one expanded, and the 11 category
  headings are plain `<h2>` elements. **Nothing collapses.** This is the exact inverse of the
  Places problem — there every group was folded shut, here nothing folds at all.
- **Search sits at 2,425px**, 3.4 screens down. It works very well — typing "help" cut the
  document from 14,195px to 2,737px and surfaced Emergency & health immediately. The cure for
  the screen's length is buried underneath the length.
- **"Emergency & health" is at 8,722px; "Health & pharmacy" at 10,533px** — 12 and 14.6
  viewports down. "Numbers & money" (20 of the 98 phrases, ~2,340px) sits directly above them.

**On "safety-critical phrases never buried" — the app is in better shape than that sounds.**
🆘 is in the topbar of every screen, and `sosScreen` (verified live, not just read) renders real
emergency numbers, a nearest-hospital card, trusted hospitals, an "At the hospital: say it in
Thai" phrase card, and an offline **"Show 'I need a hospital' to a local"** button. None of that
should be disturbed.

**The real gap is that medical phrases are split across two categories.** `sosScreen` reads only
`cat.id === 'emergency'`, so the separate `health` category never reaches it — including
**"Please call an ambulance"**, "Where is the nearest pharmacy?", "I have a fever", "I have
diarrhoea".

#### Data audit — all eight phrasebooks

| Book | `emergency` | `health` | Exact duplicates across the two |
|---|---|---|---|
| Thai | 6 | 9 | "I need a doctor", "It hurts here" |
| Vietnamese | 6 | 9 | "I need a doctor", "It hurts here" |
| Khmer | 7 | 9 | "I need a doctor" |
| Lao | 7 | 9 | "I need a doctor" |
| Chinese | 4 | 9 | "I need a doctor" |
| Hmong | **0** | 9 | — |
| Malay | **0** | 10 | — |
| Burmese | **0** | 9 | — |

Plus near-duplicates: "Hospital" vs "Where is the nearest hospital?", and "I am allergic to…"
vs "I am allergic to penicillin".

**Three books — Hmong, Malay and Burmese — have no `emergency` category at all**; their
emergency content sits only under "Health & pharmacy". Checked and worth stating precisely:
this does **not** break any SOS screen, because the four countries map to `th`/`vi`/`km`/`lo`
(`regions.js`), all of which do have the category. Those three are supplementary phrasebooks
not wired to a country. The effect is confined to the Talk screen itself — but the merge below
fixes it uniformly anyway.

#### Decisions (interview round 5)

- **Fold + rank + search on top.** The 11 categories become collapsible groups ranked by trip
  phase and time of day, with the most relevant open; search and a category jump bar move above
  the list. Same rank/collapse/never-remove rule as Places, applied to the opposite starting
  condition.
- **Merge `health` into `emergency` and dedupe.** One medical category per book, keeping the id
  `emergency` so SOS picks up the full set **with no change to `sosScreen` at all**. Gives all
  eight books an emergency category.
- **Essentials + search lead; the rest goes below the list.** Phrase-of-the-day, the politeness
  banner and the offline-audio card are demoted beneath the phrase list — present, not blocking.

#### Target structure

```
topbar · language tabs
⭐ Essentials            (the "most-needed first" promise, kept at top)
🔎 search  ·  [Basics][Taxi][Food][Money][🆘 Emergency] jump chips
PHRASES — folded groups, ranked, most relevant open
  ▼ 🍜 Food & ordering · 7      (open)
  ▶ 🚕 Taxi & directions · 7
  ▶ 🆘 Emergency & health · 13  (merged)
--- below the list ---
💬 Phrase of the day · 🗣 Say it in … (translate) · 🔊 Offline audio · politeness banner
```

#### Build slices

- **T1 — Data merge.** Fold each book's `health` phrases into `emergency`, dropping exact and
  near duplicates; keep id `emergency`, rename to cover both. Eight files. Verify per-book
  counts before/after, and that SOS gains "call an ambulance" with zero code change.
- **T2 — Fold + rank the list.** Categories become `<details>`; ranking by `inferPhase()` +
  `contextNow().part`, reusing the shape of Places' `rankedPlaceBuckets`. Emergency never
  ranked away — it keeps a fixed reachable position and a jump chip.
- **T3 — Search + jump bar above the list**, both feeding the existing `renderPhrases()`.
- **T4 — Reorder the top**; demote phrase-of-day, politeness banner and offline audio below.
- **T5 — Verify + ship.** All 8 languages, all 4 country SOS screens, offline run, version bump.

#### Acceptance criteria

1. A cold `#phrasebook` is a small number of viewports, not twenty, and at least one real
   phrase is visible without scrolling.
2. Search is reachable without scrolling, and still narrows the list as it does today.
3. Emergency phrases are reachable in one tap from the top of Talk, in every one of the 8 books.
4. Every book has exactly one medical category, with no phrase appearing in it twice.
5. The 🆘 SOS screen shows the full merged medical set — including "Please call an ambulance" —
   on all four countries, with `sosScreen` itself unchanged.
6. Nothing is removed: phrase-of-day, translate, offline audio, politeness note all still present.
7. Tap-to-show-large, copy, speak, pin and hide all still work on every row.
8. Full offline render, zero console errors.

#### Note for the build

Two inputs on this screen both carry `class="search"` — the translate box (`type=text`) and the
phrase filter (`type=search`). This cost real time during the interview: a query typed into the
first was briefly misread as a broken filter. Give the translate input its own class while in
the area.

#### T1–T5 build notes — SHIPPED as mk-v0.347.0

**T1 — data merge.** Wrote a line-span parser (Python, one-off) rather than hand-editing eight
files with heavy Unicode escaping — each category is exactly one header line, N one-line phrase
entries, one closer line, so the merge was: drop any `emergency` phrase whose `en` text exactly
matches a `health` phrase, keep the `health` copy (richer notes), append the rest of `health`
after the deduped `emergency` phrases, delete the `health` block. For the three books with no
`emergency` category at all (Hmong, Malay, Burmese), renamed `health` → `emergency` in place —
no dedup needed since there was nothing to collide with. Verified per book: Thai 13, Vietnamese
13, Khmer 15, Lao 15, Chinese 12, Hmong 9, Malay 9, Burmese 9 — all `sosScreen`-reachable, all
containing "Please call an ambulance", zero internal duplicate phrases, brace-balance clean.

**T2 — fold + rank.** New `rankedPhraseCats(categories, phase, part)`, same shape as Places'
`rankedPlaceBuckets`: a phase/time-of-day fit score per category id, unrecognised ids (the
synthetic `allergies` category, or anything a future book introduces) default to 0 so the stable
sort leaves them where they were. Emergency & health is pulled out of the ranking entirely and
reinserted at a fixed second slot — its position never depends on trip phase or time of day,
since it can be needed regardless of either. Every category is a `<details>`; only the top-ranked
fold opens by default, all others start folded but are one tap away.

**T3 — search + jump bar.** Moved the existing search input (unchanged `renderPhrases()`/
`phraseQuery` logic) directly under Essentials. Added a jump-chip row, one chip per category in
ranked order, Emergency prefixed 🆘 and given a coral accent (`--coral`, matching the app's
existing SOS colour language). A chip click clears any active search, re-renders, then opens and
scrolls to that category's fold — all synchronous, since `renderPhrases()` is itself synchronous
(no `requestAnimationFrame` needed; an earlier draft used one and it was fragile for no benefit).
Also gave the translate box's input its own `translate-input` class alongside `search`, fixing
the two-inputs-one-class collision noted above.

**T4 — reorder.** Essentials now leads the screen (measured: search box top at 424px, inside a
720px first viewport — reachable with zero scrolling). Phrase-of-day, translate, offline audio
and the politeness/voice banners all still render, unchanged, just moved below the phrase list —
confirmed present via a live DOM check, not just visual inspection.

**Verified (T5):** all 8 languages render with exactly one open fold and Emergency fixed at jump
position 2; all four wired SOS screens (`th`/`vi`/`kh`/`la`) show 13/13/15/15 phrases including
"Please call an ambulance", `sosScreen` itself untouched; pin/unpin round-tripped cleanly inside
the new fold structure with no drift; search narrows and auto-opens matching folds; a query
cleared via a jump chip restores the full ranked list. True offline test: forced a Service Worker
update (`mk-v0.347.0` confirmed in `caches.keys()`), killed the dev server, hard-reloaded —
Talk and SOS both rendered fully from Cache Storage. Zero console errors throughout, on every
language and every reload, across the whole slice.

Talk is now feature-complete against its acceptance criteria.

### You — *SHIPPED as mk-v0.348.0*

**Theme:** *What is mine?* — the traveller's own record. Interviewed 2026-08-07 against the
live `#me` screen, measured in the browser, with the tile inventory compared destination-by-
destination against Home.

#### What the interview found on the live screen

Measured on `#me` (720px viewport). **Caveat stated up front:** the test profile is essentially
empty — 0 journal entries, 0 saved places, 0 pinned phrases, 0 identifier pins, 1 logged
expense, no name — so these are new-user measurements. A populated profile is taller, but the
structure does not change with content.

- **1,127px total — about 1.5 viewports.** Three of the four tile groups are closed by default.
  This is the *opposite* of the Talk problem: You is not overloaded, it is thin and derivative.
- **The first two thirds of the opening viewport belong to the app, not the traveller.** Lead
  card at 75px (carrying no real content for a new user) → backup nudge at 211px (a chore) →
  duplicated budget card at 347px → the traveller's own material finally at 483px.
- **The backup nudge fires on almost nothing.** Its condition is
  `journal.entries.length || trip.budgetLog.length`, so a single 7-USD expense with zero journal
  entries raises a full-width card urging the traveller to protect their data.
- **`budgetSummaryCard()` renders on both Home and You**, identically, each appending its own
  "Log expense & see all →" button.

#### The headline: twelve of sixteen tiles duplicate Home

Compared by destination rather than by label:

| Destination | Name on Home | Name on You |
|---|---|---|
| `#journal` | Travel journal | Journal |
| `#saved` | Saved & collections | Saved places |
| `#calendar` | Travel calendar | Calendar |
| `#expenses` | Log expenses | Money |
| `#vault` | Secure documents | Documents |
| `#exchange` | Traveller board | Buy or sell |
| `#trip` `#scrapbook` `#circle` `#foryou` `#help` `#identified` | *identical label* | *identical label* |

Six destinations answer to **two different names** depending on which tab the traveller arrived
from; six more carry the identical label on both. Only three tiles are genuinely unique to You:
**My phrases** (`#dictionary`), **Your contributions** (`#contributions`) and **Settings**
(`#settings`).

Precedent worth recording: task #36 already removed one duplicated tile ("Your contributions")
from Home. That call was made once, for a single tile; the remaining twelve were never swept.

#### Decisions (interview round 6)

- **You leads with the traveller's content; the Home-shared logistics fold.** The split is
  *content the traveller created* versus *trip logistics*, not *unique* versus *duplicate* —
  Journal, Saved places and My identifier are duplicated on Home yet clearly belong to You.
  Nothing is deleted: the logistics tiles collapse into one folded group, one tap away.
- **Lead = enhanced identity card + a trip-in-numbers strip.** The user selected options 2 and 3
  together. The avatar/name card is retained and given live counts plus a prominent resume
  action; a distinct compact numbers strip sits directly beneath it. Recent journal entries are
  **not** rendered inline as rows — that option was explicitly not chosen.
- **Short names everywhere.** Journal, Calendar, Money, Documents, Saved places, Buy or sell —
  applied identically on both tabs, so one screen never answers to two names.
- **Backup nudge demoted to a quiet line.** The low trigger threshold stays; the nudge becomes a
  single dismissible line near the foot instead of a full-width card in second position.

#### Target structure

```
topbar · Your space · 🆘 · saved · settings
[identity card] avatar · name · live counts · ▶ continue where you left off
[trip in numbers] days · places · entries · phrases · spend      (real figures only)
📔 Your stuff              (OPEN — content the traveller created)
   Journal · Saved places · My phrases · My identifier · Trip scrapbook · Your contributions
🎒 Trip tools              (FOLDED — the Home-shared logistics)
   Calendar · Money · My trip · Documents · Buy or sell · Travel circle · For you
⚙️ You & settings          (FOLDED)
   Settings · Give back · Help & FAQ
--- foot ---
quiet dismissible backup line · disclaimer
```

#### Build slices

- **Y1 — Unify the six split names** across Home and You (`js/screens/home.js` tile lists and
  `meHubScreen` in `js/main.js`). Mechanical, low risk, done first so later slices move already-
  correct labels. Watch one wording collision: Home's "Money & tools" group would then contain a
  tile named "Money"; the tile subtitle ("Track spend vs your budget") disambiguates, but confirm
  it reads cleanly.
- **Y2 — Rebuild the lead.** Identity card keeps avatar and name, gains live counts and a
  prominent resume action; add a compact trip-in-numbers strip beneath it. Every figure renders
  only when it has a real value — the same no-placeholder rule Home's status band already
  follows. No zeroes on a fresh profile.
- **Y3 — Regroup the tiles.** "Your stuff" leads open and absorbs Trip scrapbook and Your
  contributions; the Home-shared logistics collapse into one folded "Trip tools" group; Settings,
  Give back and Help & FAQ fold into "You & settings". Drop the duplicated budget donut from You
  in favour of the numbers strip's spend figure — **note this is a genuine removal of a duplicated
  card, not of a navigation destination**: spend stays reachable from You via the numbers strip
  and the Money tile, and the donut still renders on Home.
- **Y4 — Backup nudge** becomes a single quiet dismissible line near the foot.
- **Y5 — Verify + ship.** Empty profile and populated profile, offline run, version bump, merge.

#### Acceptance criteria

1. No destination is named two different ways across Home and You.
2. You opens with the traveller's own content; the Home-shared logistics tiles are folded but
   reachable in one tap.
3. Nothing is removed from navigation — every destination reachable from You today is still
   reachable from You.
4. The identity card carries live counts and a working resume action.
5. The numbers strip shows real figures only; a figure with no data does not render.
6. The budget donut renders once across the Home/You pair, not twice, and spend stays reachable
   from You.
7. The backup nudge is a single quiet dismissible line near the foot, not a card in second place.
8. Full offline render, zero console errors, on both an empty and a populated profile.

#### Y1–Y5 build notes — SHIPPED as mk-v0.348.0

**Y1 — rename sweep.** All six unifications landed on the Home side only (`js/screens/home.js`):
`#journal` → Journal, `#saved` → Saved places, `#calendar` → Calendar, `#expenses` → Money,
`#vault` → Documents, `#exchange` → Buy or sell. `meHubScreen` (`js/main.js`) already used every
one of these short names — the interview's own audit table was, in effect, measuring Home's
drift from a naming convention You already had. Checked the one flagged collision live (Home's
"Money & tools" group now contains a tile named "Money"): reads cleanly — the subtitle "Track
spend vs your budget" and the Currency-converter tile between the group header and the Money
tile both disambiguate it.

**Y2 — lead rebuild.** The `.me-lead` identity card keeps its avatar/name but the old row of
three equal-weight resume chips became one primary action (`.btn.block`) picked by what
actually has content — journal first, then saved places, then phrases, falling back to "Start
your journal" on a fresh profile — with whichever of the other two still have content kept as
smaller secondary chips beneath it. New `tripNumbersStrip()` renders directly below: day count
(from the same `tripStartISO()`/`daysUntilISO()` math the existing "Your day" card already
uses), places explored (`doneSpots.length`), journal entries, saved phrases, and total spend
(`tripSpendHome()`, already used by Home's own status band) — each cell omitted individually
when it has no real value, and the whole strip omitted (not an empty card) when none do. Cells
are plain `div`s reusing `.status-chip`'s visual language with a `.static` modifier (no pointer
cursor, no press animation) — a record, not a control, deliberately distinct from the resume
button and the tiles below.

**Y3 — regroup.** Split is content-the-traveller-made vs. trip-logistics, not unique-vs-
duplicate — confirmed this matters because Journal, Saved places and My identifier are
themselves among the twelve Home duplicates yet clearly belong under "Your stuff." Final
grouping: **Your stuff** (open) — Journal, Saved places, My phrases, My identifier, Trip
scrapbook, Your contributions (absorbing the old "Progress & keepsakes" group entire).
**Trip tools** (folded) — Calendar, Money, My trip, Documents, Buy or sell, Travel circle, For
you. **You & settings** (folded) — Settings, Give back, Help & FAQ. Verified by direct
enumeration: all 16 original You destinations are still present post-regroup (6 + 7 + 3 = 16),
none dropped. Removed the duplicated `budgetSummaryCard()` call — confirmed it was rendering
byte-for-byte the same donut Home already shows; spend now reaches You only via the numbers
strip and the Money tile, never a duplicated card.

**Y4 — backup nudge.** Same trigger condition (`journal.entries.length || trip.budgetLog.length`
and `!dataBackupDone`), same dismiss behaviour (writes `dataBackupDone` via `save()`), same
"Back up now" → `#settings` destination — only the markup changed, from a bordered `.card` in
second position to a plain `.row-between` line moved to the foot, just above the disclaimer.

**Verified (Y5):** empty profile (0 journal/saved/phrases/doneSpots, 1 pre-existing logged
expense) shows only the "💸 7 USD" cell in the numbers strip and "📔 Start your journal" as the
resume action — no zero-placeholders anywhere. Seeded a populated profile (3 journal entries, 2
saved places, 2 phrase pins, 4 done-spots, a dated trip start) live via `localStorage` and
confirmed every figure updated correctly — "Day 3 · 4 places · 3 entries · 2 phrases · 7 USD" —
and the resume action correctly promoted to "📔 Continue your journal" with the other two as
secondary chips. Home re-checked after the Y1 rename sweep touched `js/screens/home.js`: renders
clean. True offline test: forced a Service Worker update (`mk-v0.348.0` confirmed in
`caches.keys()`), killed the dev server, hard-reloaded — You rendered fully from Cache Storage,
identical structure to the online render. Zero console errors throughout, on every profile state
and every reload.

Two stale-tab artifacts hit during this build (documented pattern in this project, not new):
`navigate({force:true})` on an already-loaded tab did not reflect the Y1 rename or a
`localStorage` seed until the tab was closed and reopened fresh — same fix as every previous
occurrence.

You is now feature-complete against its acceptance criteria.
