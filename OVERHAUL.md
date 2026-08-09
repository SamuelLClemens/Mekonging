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

#### Addendum 2 — Trip status merge, budget health, online/offline → topbar, SHIPPED as mk-v0.350.0

Requested directly, three follow-up asks in one message: (1) fold Trip status's remaining
chips into Quick access rather than keeping two separate boxes both full of "chips about the
trip"; (2) make the Calendar and Budget chips carry more meaning instead of bare labels; (3)
put per-category budget stats (and the donut) somewhere real. A later same-turn message added
a fourth: move the online/offline toggle out of a chip and into the shared top bar.

- **Merged** Trip status and Quick access into one collapsible (`quickAccessRow()`,
  `js/screens/home.js`) — phase switcher plus every status chip, one box instead of two.
  `tripStatusRow()` and main.js's `homeStatusBand()` are both deleted; `tripStartISO()` is now
  exported so home.js can read it directly.
- **Calendar chip:** bare `Calendar` label until the trip actually starts (`tripStartISO()`),
  then a running day count (`Day 1`, `Day 2`…) replaces the label instead — the old "X days to
  go" pre-trip countdown is dropped in favour of just naming the destination. The next plan
  item's title + timing (previously its own standalone 📍 chip) now rides along as the
  Calendar chip's sub-label instead of being repeated elsewhere.
- **Budget chip:** with no target set, unchanged — the plain spent total. Once a target exists
  *and* at least one expense is logged, the label promotes to a live percentage (`46% spent` for
  a whole-trip target, `99% of daily budget` for a per-day one) and the chip takes a colour
  ring — green on track to land under budget, yellow if the current pace projects going over,
  red if already over. Trip targets with known trip-end dates use a real pace projection
  (`dailyRate × totalDays` vs the target); without an end date, or for per-day targets, it
  falls back to straightforward thresholds. New CSS: `.status-chip.budget-green/yellow/red`
  (`css/style.css`).
- **Budget section (`#expenses`, `budgetSummaryCard()` in main.js):** the per-category legend
  now shows each category's share of total spend next to its amount (`33 USD · 62%`), sorted
  biggest-category-first. Donut, remaining-vs-target bar, and the over/under-budget projection
  message were already there from before — this closes the "stats on what percentage of
  spending is on each category" ask directly against the existing budget picture rather than
  building a second one.
- **Online/offline moved to the shared `topbar()`** (main.js) — a small icon button
  (📶 / ✈️) next to Saved / Settings / Emergency, so it is reachable from *every* screen, not
  one tap into Home's own collapsible. New CSS: `.topbar-net`. Home's Quick access row lost its
  fifth (online/offline) chip as a result — now exactly four: Calendar, Budget, Weather (or
  Scrapbook, post phase), Journal.

**Verified:** all three budget-health colours confirmed live for both target types (green /
yellow / red × whole-trip and per-day — six combinations, e.g. a whole-trip target where actual
spend is a modest 46% but the pace projects finishing over budget correctly shows yellow, not
green); the plain-spent-total no-target fallback still shows `Budget · N USD`; Calendar
confirmed bare pre-trip and `Day N` once started, with the next-plan item's title+timing
riding on the sub-label; post-phase Scrapbook swap intact; the topbar network icon confirmed
present (and independently toggleable) on Home, Explore and Settings, and correctly hidden only
where Settings's own gear icon self-hides — never conditionally hidden itself, since it belongs
everywhere. `#expenses` legend confirmed sorted biggest-first with correct percentages. True
offline test repeated after every code change (forced Service Worker update, `mk-v0.350.0`
confirmed in `caches.keys()`, dev server killed, hard-reloaded — full render from Cache
Storage, chips and topbar icon both intact) — zero console errors throughout.

#### Addendum 3 — Quick access defaults open, SHIPPED as mk-v0.352.0

The Quick access `<details>` (`js/screens/home.js`) previously defaulted CLOSED on a fresh
profile (`!!store.profile.prefs.quickAccessOpen` is `false` when the pref has never been set)
and only opened once the traveller had expanded it at least once. Flipped to default OPEN —
`store.profile.prefs.quickAccessOpen !== false` — so it now only ever collapses because the
traveller closed it themselves; the existing `toggle` listener already persisted whichever
state it was left in, so no other change was needed. Verified: cleared the pref directly on the
live in-memory `store` (not just `localStorage` — see the Talk addendum below for why the
distinction matters) and confirmed the fold rendered open on a fresh load; manually collapsing
it persisted `false` and stayed collapsed across a reload.

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

#### Addendum — country-select row + map-first landing, SHIPPED as mk-v0.354.0

Traveller feedback: remove the hero photo, fit as many countries as possible on one row in
the country-select strip, drop the phrasebook/currency/places/map/emergency quick-link row,
and lead with the map right after country select — defaulting to the traveller's anchored
country, or the four-country chooser if not yet anchored anywhere.

- **One country-select row, both branches.** `countryHeroBand()` (the per-country "chapter
  opener" photo) and the old scoped-only chip switcher / unscoped grid-of-cards (two
  parallel, inconsistent pickers) are replaced by one `.chips.country-select-row` — every
  country plus "All", `flex-wrap: nowrap` with horizontal scroll instead of wrapping to a
  second line, so as many as fit show on one row at any width, mobile included. Renders
  identically whether or not a country is scoped, immediately under the topbar.
- **`countryHeroBand()` removed entirely** — zero call sites once the hero photo left; its
  `.country-hero*` CSS removed alongside it.
- **Map leads, plainly, in both branches** — the unscoped branch's "Choose on the map"
  (`regionPicker()`) and the scoped branch's "Regions of Country" (`regionsMap()`) render as
  plain, always-visible blocks right after country select, no collapsible fold — the same
  "map is the focus" treatment Places' own Addendum (above) established for its living map.
  Country defaulting needed no new logic: `anchorCountry()` (GPS in-region, then focus city,
  then dated trip stop, else null) already returns exactly "the country the traveller is in,
  or null if not yet in one" — Explore's unscoped branch already is the four-country
  chooser, so this alone satisfies the request.
- **Quick-link row removed, no destination lost** — Phrasebook/Currency/Places/Map/Emergency
  used to sit as a row of chips right under the (now-removed) hero photo. Every one of those
  destinations is still reachable: Phrasebook and Currency via their tiles in the "Get
  oriented" tile group further down this same screen (unchanged), Places via its own bottom
  tab and the "See all N places" buttons throughout Explore, Map via the Places tab's living
  map and this screen's own new map-first block, Emergency via the shared topbar's SOS icon.
- **A real bug found and fixed during verification, not left to review:** removing the old
  quick-link chip row also removed its `const lang = getLanguage(c.lang);` declaration — but
  the "Get oriented" tile group's Phrasebook tile (further down the same function) still
  reads `lang.label` for its subtitle. Threw nothing visibly on the two branches tested
  first (both took the unscoped early-return path), but would have thrown `lang is not
  defined` the moment a scoped country screen actually rendered that tile group. Caught by
  reading the full function body rather than trusting the first two screenshots; fixed by
  re-adding the declaration immediately before the tile group that needs it.
- **CSS:** `.country-select-row { flex-wrap: nowrap; overflow-x: auto; }` overriding the base
  `.chips` wrap behaviour, plus `flex: 0 0 auto` on its chips so they never shrink to fit.

**Verified:** all four countries plus "All" fit on one row at both desktop (1280px) and
mobile widths with no wrapping; the `lang` fix confirmed live (Phrasebook tile correctly
reads "Thai" for Thailand); no hero photo, no quick-link row, map renders immediately after
country select in both the scoped and unscoped cases. **True offline test**: killed the dev
server, reloaded on `#explore-all` and `#country-th` — both rendered fully from Service
Worker Cache Storage, zero console errors.

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

#### Addendum — map-first: bigger, never-collapsible, everything else folded closed, SHIPPED as mk-v0.352.0

Three changes, all in `placesScreen()` (`js/main.js`): (1) the map's `<details>` wrapper is gone
— it is now a plain `<div>`, always visible, never collapsible (the one section on this whole
screen that is not a fold), and its CSS height went from 130px to 320px (420px from 700px
viewport width up) so it reads as the actual focus rather than a strip above the real content.
(2) Everything else on the screen now starts closed instead of open: the city-scoped "About"
and "Right now" cards (new closed-by-default folds), the city picker (`collapsibleCard`'s
`defaultOpen` param, now `false` here), "Closest to you", and every best-sort category group.
(3) Because `renderList()` rebuilds the closest-card and category `<details>` on every
filter/search keystroke, their open state is tracked in local per-visit variables
(`closestOpen`, `openBuckets`) rather than re-derived from scratch each time — otherwise typing
in the search box would silently re-collapse whatever the traveller had just opened. This is
deliberately NOT persisted to `prefs` across a full navigation away and back (unlike Home's
Quick access or Talk's categories) — Places' own ask was "collapsed by default," not "remembers
across visits," so it resets closed the next time the screen is opened, matching two existing
un-persisted folds already on this same screen ("Your places", "Colour key"). `collapsibleCard`
(`js/ui-widgets.js`) gained the `defaultOpen` parameter itself, backward-compatible — its six
existing Explore-hub callers are unaffected (`defaultOpen` defaults to `true`).

**Verified:** map confirmed a `<div>` (not `<details>`), 320px tall, always visible with no
disclosure control; on a fresh profile every fold (About, Right now, city picker, closest-to-
you, all 7-8 category groups) confirmed closed; opening one, then typing in search, confirmed it
does not silently re-collapse; true offline test — killed the dev server, hard-reloaded on
`#places-th-chiang-mai` — map, folds and category chips all rendered from Cache Storage, only
error was the expected benign "failed to update Service Worker" (network-dependent update check
failing offline, not a real defect — documented pattern).

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

#### Addendum — dropdown language picker, cross-language pins, compact Essentials, SHIPPED as mk-v0.351.0

Requested directly, two follow-up messages: (1) the language picker should be a dropdown, not
a row of 8 chips; two quick-access buttons (Language, My Dictionary) at the top; a phrase
pinned in one language should auto-pin in every other language too, unless individually
unpinned; Essentials should be the first category, collapsible, with phrases packed many-per-
line; (2) anything that needs a live connection (Say-it/translate) should only appear when
online, positioned before the search box.

- **Language dropdown + My Dictionary button** (`talk-top-row`, `phrasebookScreen`): replaces
  the old `lang-tabs` chip row with `selectEl()` (already used elsewhere in the app) plus a
  direct `#dictionary` shortcut — already reachable via You, now one tap closer from Talk too.
- **Cross-language pin propagation** (`propagatePinAcrossLanguages()`, main.js): pinning a
  phrase auto-pins the same phrase (matched by English text, via `phraseSlug`) in every other
  language's book, searched across ALL of that language's categories — the 8 phrasebooks do
  not share one category taxonomy (Lao's "essentials" category covers ground Thai splits
  across "food"/"directions"), so matching only within the same category id would miss real
  matches. Unpinning is per-language only and never cascades. Coverage is honest, not
  fabricated: a phrase worded differently across two books (Thai's "Excuse me / Sorry" vs
  Lao's "Sorry / Excuse me") will not cross-match until the wording is aligned.
- **Essentials is now the first collapsible category** (`phrase-cat-essentials`, open by
  default), phrased as compact wrapping chips (`phraseChip()`) instead of full detail rows —
  "as many on one line as possible." Allergy/diet phrases are the one exception, kept as full
  rows since they are exactly what gets shown to a cook. `showBigPhrase()` (the tap-to-enlarge
  view) now carries Pin/Hide/Copy actions, since the compact chip has nowhere on the chip
  itself for those controls — a `phraseRow` passes the same actions through too, for
  consistency wherever a phrase is shown large. Other categories are unchanged (still full
  rows, already collapsible from Talk T2).
- **Say-it / live translate** now renders only when `online()` is true, moved from the foot of
  the screen to right after the header row — before the search box — since it is the one
  control on this screen with zero offline value (a real online translation + speech API call,
  no cached fallback), unlike the phrasebook itself.

**Verified:** language dropdown + My Dictionary button confirmed live; pinning "Hello" in Thai
confirmed cascading to all 7 other languages (Vietnamese, Khmer, Lao, Chinese, Burmese, Malay,
Hmong) with each keyed under its own language in the dictionary; unpinning it in Lao only
confirmed NOT cascading (the other 7 stayed pinned); Essentials confirmed as a real collapsible
`<details>`, first in the jump-chip row and the category list, all 30 of its chips compact and
wrapping (both desktop and 375px mobile widths, light and dark theme), allergy phrases kept as
full rows; a real (non-Essentials) category confirmed still rendering full detail rows,
unaffected; search still narrows correctly and Essentials stays visible regardless of query;
translate box confirmed absent while offline and present (positioned before search) once
toggled online via the topbar network icon. True offline test: forced a Service Worker update
(`mk-v0.351.0` confirmed in `caches.keys()`), killed the dev server, hard-reloaded — full
render from Cache Storage, dropdown/dictionary button/Essentials chips all intact, translate
box correctly still absent (offline). Zero console errors throughout. Spot-checked Home and You
after the shared `topbar()`/main.js edits — clean.

#### Addendum 2 — every category (incl. Essentials) closed by default, SHIPPED as mk-v0.352.0

Essentials previously had a hardcoded `open: ''`, and with no active search the single top-
ranked category (by trip phase + time of day) auto-opened too. Both removed: every fold in
`phrasebookScreen` now starts closed, tracked per-language via a new `talkCatOpen` pref
(`{ 'th|food': true, … }`) so a category the traveller actually opens stays open — across a
search, a pin/hide repaint, and a later visit to this screen. A live search still force-opens
whichever categories match (otherwise the results would be invisible), but that alone must never
count as "the traveller opened it" — closing the search should return to whatever was actually,
manually opened, nothing more. This turned out to need a specific fix: the natural approach
(persist on the `<details>` element's `toggle` event) is wrong, because setting the `open`
attribute programmatically — exactly what a search force-open does — still fires a `toggle`
event in this browser, which would have wrongly saved the search-driven state as if it were a
real tap. Fixed by tracking a `click` listener on the `<summary>` instead (predicting the new
state as `!details.open`, read before the browser's own default toggle action applies) — a real
tap is the only thing that ever fires a summary click.

**Verified**, and this surfaced a second, unrelated harness issue worth recording: editing
`localStorage` directly while the app tab stays open does not reliably stick, because this
project's `pagehide`/`beforeunload` autosave (`js/state.js`) flushes the tab's OWN in-memory
`store` back over any external edit the instant that tab reloads or unloads — even a `reload()`
called right after the edit loses it. `location.reload()` is a real navigation and fires exactly
that unload handler on the OLD document before the new one loads. The reliable fix used here:
`await import('/js/state.js')` from the page's own console context resolves to the SAME
already-loaded module instance (browsers cache ES module instances per URL), so mutating
`store.profile.prefs` directly and calling the exported `flushSaveNow()` edits the live object
itself rather than racing it — confirmed this way that every category (Essentials included)
starts closed on a clean profile, a manual click on Essentials persists and survives a reload,
and a search match (typed via a native `input` event, not a raw `value` set, so the real
`oninput` debounce path runs) opens a category WITHOUT persisting it — clearing the search
returns every category to closed again. Also re-confirmed here: the Service Worker's own
`CACHE_VERSION` must actually change for a `reg.update()`/reload to pick up new code at all —
mid-session testing against the still-`mk-v0.351.0` cache silently ran stale (pre-fix) code
until the version bump below made `caches.keys()` show `mk-v0.352.0`.

#### Addendum 3 — "Phrase of the day" removed, SHIPPED as mk-v0.354.0

Traveller feedback: remove it outright. `phraseOfTheDay(code)` and its now-orphaned helper
`dayIndex()` (confirmed via grep to have no other callers) are deleted entirely, along with
the card that rendered them inside `phrasebookScreen` and their `.potd-*` CSS. No destination
lost: every phrase it rotated through daily is still reachable via Essentials or its own
category — it only ever surfaced one phrase a day from the same pool the list already shows
in full.

#### Addendum 4 — searching a phrase yourself adds it to your dictionary, SHIPPED as mk-v0.354.0

Traveller feedback: anything a user searches for themselves should be added to their
dictionary automatically — no separate pin tap should be required.

- **`ensurePhrasePinned(code, key)`** — an idempotent, never-unpins sibling to the existing
  `togglePhrasePin()`, reusing the same `propagatePinAcrossLanguages()` so an auto-pin
  propagates to the phrase's counterpart in every other language exactly like a manual pin
  does. Returns whether it actually added anything new, so the caller only says something
  when there is something to say.
- **A second, much longer debounce on the search box** (900ms, independent of the existing
  120ms live-filter debounce), firing only once typing has genuinely settled. This is the
  load-bearing design decision: debouncing on every keystroke at the *filter* speed would
  auto-pin a wall of one-letter matches while a word is still being typed ("h", "he", "hel"…)
  — most of which stop matching once the word is finished. Only the settled query's matches
  ever get pinned.
- **Category-name matches do not count.** The existing filter treats a query matching a
  *category's name* (e.g. "taxi" matches every phrase in Taxi & directions) as a match for
  every phrase in it, so the visible list stays useful for browsing by category. Auto-pin
  deliberately uses a stricter check — only phrases whose own English/romanised/script text
  actually contains the query — so browsing a category by name never floods the dictionary
  with everything in it; only what was actually searched for does. Verified live: searching
  "taxi" (a pure category-name match) added nothing, while searching "hospital" added the two
  phrases whose own text matches, propagated across all eight languages.
- A brief inline status line ("✓ Added N phrases to your dictionary") confirms what happened,
  and the list repaints so the 📌 icon itself visibly reflects the new pinned state — nothing
  is a silent, invisible side effect of typing.

**Verified:** typing "hospital" in Thai auto-pinned "Hospital" and "Where is the nearest
hospital" in Thai and propagated to all seven other languages; typing "taxi" immediately
after added nothing further (category-name match correctly excluded). **True offline test**:
killed the dev server, hard-reloaded on `#phrasebook-th` — full render from Service Worker
Cache Storage, zero console errors.

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

#### Addendum — resume section replaced with a fixed quick-access chip row, SHIPPED as mk-v0.352.0

The Y2 "resume" button (one dynamic primary action picked by what had content, plus up to two
smaller secondary chips for whatever else did) is gone from `meHubScreen` (`js/main.js`) —
replaced with a fixed 8-chip row in the same `.status-chip` visual language as Home's Quick
access: Calendar, My Dictionary, Budget, Journal, then Documents, My trip, Buy or sell and For
you promoted to chips too (previously tile-only, inside the "Trip tools" fold below — which
still exists unchanged, rank-collapse-never-remove: the tiles stay as a second path to the same
six destinations already duplicated between Home and You). Calendar and Budget reuse Home's
exact live logic verbatim (bare label pre-trip / `Day N` once started; plain spent total with no
target, live percentage + green/yellow/red pace ring once one is set) rather than a simplified
copy, so the two screens never show conflicting numbers for the same trip.

**Verified:** fresh profile shows exactly the 8 chips, no `.me-resume` button anywhere in the
DOM; Budget chip confirmed correctly bare (`Budget`) with no target set, then set a target live
via the in-memory `store` (see the Talk addendum for the technique) and confirmed it promoted to
`76% spent` with a `budget-yellow` ring, matching Home's own colour rule exactly. Screenshot
confirmed the 2-column chip grid renders cleanly in both the populated and empty states. True
offline test passed (see the Places addendum above — same session, same forced Service Worker
update to `mk-v0.352.0`).

**Ship note (mk-v0.352.0):** this version bump covers all four changes shipped together in this
round — Home's Quick access default-open, Talk's default-closed categories, Places' map-first
layout, and this chip row — one version, one commit, one verification pass across all four
screens.

#### Addendum 2 — Trip tools fold removed (fully covered by chips), Travel circle built out, SHIPPED as mk-v0.354.0

Traveller feedback: (1) anything already in the chip row above should not also sit in the
Trip tools fold below it; (2) Travel circle should be built out so a traveller can connect to
or invite anyone to join via WhatsApp contacts or phone contacts; (3) Travel circle and
Traveller board should themselves be chips.

- **Two more chips promoted, one renamed.** The chip row gains **Travel circle** (`#circle`,
  showing an unread-inbox count with the same `budget-red` ring Budget uses for "needs
  attention" when the count is non-zero). The existing **Buy or sell** chip/tile is renamed
  **Traveller board** to match the name the destination screen itself already used
  everywhere else it appeared (its own topbar, and an existing "🤝 Traveller board" chip
  inside Explore) — one name for one place, not two names for the same screen.
- **The "Trip tools" tile group is removed entirely**, not merely trimmed. Every single one
  of its five tiles (My trip, Documents, Traveller board, Travel circle, For you) is now also
  a chip in the row above — so the group had become a five-tile wall of pure duplicates.
  Rank-collapse-never-remove still holds: nothing lost a destination, each one just has a
  faster first path (a tap on the chip row) instead of two competing paths to the same place.
  "Your stuff" and "You & settings" groups are unchanged.
- **Travel Circle invite build-out** (`circleScreen`, `js/main.js`) — the existing "Share your
  card" card is renamed **"Invite a friend"** and gains two explicit invite paths alongside
  its existing OS-share-sheet and copy-link buttons:
  - **💬 Invite via WhatsApp** — `https://wa.me/?text=<invite message + card link>` with no
    phone number opens WhatsApp's *own* "choose a chat" picker (the same thing tapping "New
    chat" inside WhatsApp does), so picking who to invite is entirely WhatsApp's native
    contact list — nothing this app can or does see.
  - **📇 Invite from phone contacts** — the Contact Picker API (`navigator.contacts.select`),
    feature-detected (`'contacts' in navigator && 'ContactsManager' in window`) since it is
    Chrome/Android-only; the button simply does not render elsewhere. Each tap opens the
    native OS contact picker fresh — a one-off, user-initiated selection, no standing access
    granted. Each picked contact gets its own WhatsApp (`wa.me/<digits>`) and SMS
    (`sms:+<digits>?body=…` / `&body=` on iOS) button.
  - This app has no server and no accounts (its own stated architecture) — a real WhatsApp
    Business API integration or a contacts-sync backend is out of scope and was not
    attempted; the wa.me + Contact Picker approach is the honest, fully client-side ceiling
    of what "invite via WhatsApp/phone contacts" can mean for a backendless static PWA. Every
    invite link opens the target app with the message *pre-filled, never auto-sent* — the
    traveller still taps send themselves, same as the pre-existing `navigator.share` flow.

**Verified:** fresh profile shows the 9-chip row (Calendar, My Dictionary, Budget, Journal,
Documents, My trip, Traveller board, For you, Travel circle) and no "Trip tools" heading
anywhere in the DOM; "Your stuff" and "You & settings" unchanged. WhatsApp invite button
confirmed to build the correct `wa.me` URL (intercepted `window.open` rather than actually
navigating away, since this is an external site). Contact Picker button confirmed correctly
absent in this browser context (no `navigator.contacts`) — graceful feature-detection, not a
bug. **True offline test**: killed the dev server, hard-reloaded on `#me` and `#circle` —
both rendered fully from Service Worker Cache Storage, zero console errors.

### Weather & forecast — cross-cutting, cleaned up as part of this round (mk-v0.354.0)

Reached from Home, Explore and Places, not owned by any one section. Traveller feedback: the
weather/forecast screen needed a general clean-up, and both the daily and hourly forecast
should be as detailed as realistically possible.

- **"Right now" consolidated into one card.** Current conditions, air quality and UV used to
  be three separate stacked `.card`s each saying "this is the situation right now" in a
  different box. Now one `.wx-now` card with a thin `.wx-now-div` divider between the three —
  same information, a third of the visual weight.
- **A real hour-by-hour list, not just the ring.** The existing watch-face ring
  (`wxHourlyRingSvg`) shows one metric at a time by design — that is what makes it readable
  as a shape — but that meant seeing temp *and* rain *and* wind for the same hour needed
  flipping through all 6 metric chips. New `wxHourlyListNode()` adds a scrollable strip of
  the next 24 hours, each showing time, icon, temp, rain % and wind all at once — the ring's
  "as detailed as possible" companion, not a replacement.
- **The "This month" calendar's N/A wall fixed.** It rendered a full calendar-month grid, so
  every day before today *and* every day past the ~16-day forecast horizon (often more than
  half the grid, on the day this was checked) showed a bare "N/A" cell — reading as broken,
  not just empty. `wxMonthCalendarNode()` now renders exactly one cell per *real* forecast
  day (renamed "Upcoming forecast," since it is no longer month-bounded) — only the leading
  blank cells needed to line the first real day up under its weekday remain, and those are
  empty, not labelled "N/A". A single legitimate "this one field is missing for this one day"
  case (the API's own last-day edge, sometimes short a value) can still show its metric as
  "N/A" — that is honest, not the structural padding bug this fixes.
- Removed the now-orphaned "Next 24 hours · see this month ↓" jump link and the `.nodata`
  CSS rules it needed, along with the dead-code cleanup that came with both.
- The 7-day forecast list (already detailed — per-day morning/afternoon/evening/night
  breakdown) is unchanged; it already was the detailed daily forecast the request asked for.

**Verified:** consolidated "Right now" card confirmed rendering (temp/conditions, divider,
air quality, divider, UV, all one card) for Bangkok live. Hourly list confirmed showing 24
real entries (time/icon/temp/rain%/wind) alongside the ring. Upcoming-forecast grid
confirmed down to a single legitimate "N/A" (the API's own last-day gap) versus roughly 14
padding N/A cells before the fix. **True offline test**: killed the dev server, hard-reloaded
on `#weather-th` — full render from Service Worker Cache Storage (cached forecast data
included), zero console errors.

**Ship note (mk-v0.354.0):** this version bump covers everything in this round together —
Explore's country-select-row + map-first landing, Talk's phrase-of-day removal and
auto-add-on-search, You's chip-row dedup and Travel Circle build-out, and this Weather
clean-up — one version, one commit, one combined verification pass (including a true offline
test) across all five screens.

### Housekeeping — help/onboarding cleanup and Explore country picker (mk-v0.355.0)

- **Removed the guided "walk-me" tour overlay entirely.** The first-run coach-mark dialog
  (spotlighting the tab bar and SOS button, auto-offered once from Home and replayable from
  Help & FAQ as "Take a quick tour") was removed per direct request ("remove the help
  windows") — `TOUR_STEPS`, `startTour`/`endTour`/`maybeOfferTour`, the tour overlay's `.tour*`
  CSS, the "New here?" card on the Help screen, the `endTour(false)` call in the router's
  teardown, and the now-unused `tourSeen`/`tourStep` prefs were all deleted. Every screen it
  pointed at remains reachable via the tab bar and Help & FAQ themselves, so nothing it
  covered became unreachable.
- **Explore's country picker is now a dropdown, not a chip row.** The `.country-select-row`
  horizontal-scrolling chip row (this round's own earlier fix for "every country fitting on
  one line") is replaced by a single native `<select>` (via the existing `selectEl()`
  helper) listing "🌏 All countries" plus each of the four countries — simpler, no
  horizontal-scroll discovery problem, and it doubles as a clear "you are here" indicator
  since the select's value always reflects the current country.

**Verified:** confirmed via direct DOM inspection that the tour's CSS classes, JS functions,
and prefs keys have zero remaining references anywhere in `js/` or `css/`; confirmed the
Help screen no longer shows the "New here?" card; exercised the new Explore dropdown's
`onchange` end-to-end (selecting "Thailand" navigated to `#country-th` and the select
reflected the new value on both the unscoped and scoped views); **true offline test**: killed
the dev server, hard-reloaded on `#explore-all` — full render from Service Worker Cache
Storage, dropdown present and functional, zero console errors.

### Places, You & Weather round (mk-v0.356.0)

- **Places — confirmed already correct.** Direct DOM inspection of `#places-th` confirmed
  the screen already leads with the map, then "Closest to you," then the category groups
  (established in the earlier Places P1/P6 work) — no change needed.
- **You — the "Trip in numbers" strip removed.** This second, static status-chip row sat
  directly under the quick-access chip row and duplicated its own Calendar day-count,
  Journal-entry-count and spend/budget figures a second time. Removed along with its now-dead
  `tripNumbersStrip()` function — every figure it showed still shows live on the one chip
  above that already owns it.
- **You — every remaining tile group is now chips, and three previously-unreachable global
  features were added.** Per direct request ("turn all the your stuff in you into chips ...
  so users can reach everything from you"): the "Your stuff" and "You & settings" tile grids
  are now `chips` rows using the same `status-chip` look as the quick-access row above
  (Journal dropped from "Your stuff" — same reasoning that already dropped "My phrases": the
  chip row above already covers it). A new "Journey map" chip was added to "Your stuff" (it
  was previously reachable only from deep inside a Journal entry). A new "Plan & prepare"
  group brings Home's own Trip plans / Pre-trip checklist / Bargain helper to You for the
  first time — previously these had no path from You at all. "You & settings" gained Search
  everything (already on Home, now here too) and Export & backup (previously two taps deep
  inside Settings, now one). Deliberately NOT added: the ~30 country-scoped content screens
  (weather, places, food, transport, etc.) — those remain Explore/Places' job and stay
  reachable there; mirroring all of them into You would rebuild the exact "wall of tiles"
  clutter this round (and the last several) worked to remove.
- **Weather — the top trip-itinerary calendar is gone, and the screen is fully reordered.**
  `planCalendarCard()`/`planCalendar()` (the "🗓 Trip calendar" that used to lead the whole
  screen with a day-by-day itinerary) are deleted entirely. New order: Right now → Next 24
  hours → Upcoming forecast calendar (the screen's one calendar now) → 7-day forecast →
  Refresh, THEN "Weather in your trip cities" (unchanged per-city panels, just with no
  leading itinerary calendar above them), THEN "Look up another city" — the existing map
  plus a new free-text search (a native `<datalist>` of all 39 cities across all four
  countries, offline, no extra library) that jumps to a city on an exact match exactly like
  tapping it on the map. The old bottom "See another city" dropdown is gone, folded into this
  one section. Also fixed a real, pre-existing CSS bug found along the way: two unrelated
  `.wx-cal` rules collided (the deleted trip-calendar card's `border-top` rule and the
  forecast-calendar grid's `display:grid` rule shared one class name), which had been
  quietly bleeding a teal top-border onto the forecast calendar grid.
- **Calendar — partner-naming and per-partner orgasm tracking already exists; verified, not
  rebuilt.** The private calendar's intimacy tracker (`js/main.js`'s `personalEncounterForm` +
  `js/personal.js`) already does exactly what was asked: typing a name into "Or a new partner
  name" and saving calls `personal.addPartner()`, which immediately appears as a "Partner"
  dropdown option on every future entry, and each entry has its own "Orgasms" number field.
  It is off by default (behind "Turn on private calendar" on the Calendar screen) — a
  deliberate privacy default, not a bug — which is likely why it read as missing. Verified
  live: enabling it, adding a partner named "Alex" with 3 orgasms logged the entry correctly
  and "Alex" immediately appeared in the Partner dropdown for next time; both the entry and
  the test partner were then removed.

**Verified:** all of the above checked live in the browser (console-clean throughout);
Weather's new order and trip-cities section confirmed against a real added trip stop; the
new city search confirmed against all 39 cities and a live switch (Bangkok → Pai); the
calendar/partner flow confirmed end-to-end as described above.

**Ship note (mk-v0.356.0):** this bump covers the You chip conversion + new feature chips,
the Weather restructure (trip-calendar removal, reorder, new city search, `.wx-cal` CSS
collision fix), and the Places/Calendar verification passes above — one version, one commit.

### Home phase merge, "Just arrived" chip & expense-logging unification (mk-v0.357.0)

- **"Arrived" and "Travelling" merged into one trip stage.** Per direct request ("arrived
  and traveling should be combined"), the four-stage journey model (`PHASE_ORDER`/`PHASES`,
  `js/main.js`) is now three: Planning → On the ground → Post. They differed only in
  emphasis (both were "on the ground"); every place that branched on the two separately
  (`phaseLead`, `phaseNextBest`, `inferPhase`, `phaseSwitchRow`'s short labels, the Explore
  `PHASE_DECK`, and the Places/Talk phase-fit ranking functions `rankedPlaceBuckets`/
  `rankedPhraseCats`) now has one merged `'traveling'` branch — for the two ranking
  functions, a union of both phases' old boosts, so nothing that used to rank first
  silently stopped mattering. The on-Home 24h weather ring (`homeWeatherRing`), previously
  gated to the old `'arrived'` phase only, now shows for the whole merged on-the-ground
  phase instead of just the first couple of days.
- **"Just arrived" is now its own dismissible Home chip, not a whole trip stage.** What made
  the old "Arrived" phase distinct — the first-hour arrival guide — is `justArrivedChip()`
  (`js/screens/home.js`): a chip reading "🛬 Just arrived — first-hour guide" that opens
  `arrivalScreen` (`#arrival-{country}`, already keyed to the traveller's actual
  gateway/city, so one chip covers "arrival info for each place"). It carries its own ✕,
  which asks for confirmation first (`confirmAction`, not a silent one-tap dismiss, since
  hiding this is bigger than dismissing a one-line tip) before setting the new
  `prefs.justArrivedHidden` pref and disappearing from Home. It is never gone for good:
  Settings → Journey phase (`settingsScreen`) grows a "🛬 Show the 'Just arrived' chip
  again" button whenever the pref is set, and the arrival guide itself stays reachable
  regardless via Explore's own "Just arrived" tile and the near-me screen's "Full arrival
  guide" button. `arrivalEssentials()`'s open-by-default ("featured") state on the near-me
  screen — previously tied to the now-removed `'arrived'` phase value — now tracks this same
  signal (on the ground AND not yet dismissed).
- **Expense logging now looks and works identically everywhere.** Per direct request ("the
  logging expenses should look the way it does inside the budget section consistently and
  that should be the master"), a single shared `expenseAddCard()` (`js/main.js`) — Amount +
  Currency row, "On what?" with smart frequent-title chips, Category, Date, one full-width
  "＋ Add expense" button — replaces three separately-drifting forms: Expenses & budget
  (`#expenses`, the master reference), My Trip's "Budget log" add block (previously no date
  field and no title chips), and Home's one-tap "Right now" spend row (`quickSpendRow`,
  previously a compact icon-only strip with no date or title chips). All three now render
  the exact same card and share one `addBudgetItem()` call path.

**Verified:** all of the above checked live in the browser (console-clean throughout except
one pre-existing, unrelated sandbox geolocation warning) — phase merge confirmed on Home,
Explore, Places, Talk and the near-me screen; the full "Just arrived" round-trip (chip →
arrival guide → back → ✕ → confirm modal → Hide → chip gone → Settings → "Show again" →
chip back) walked end to end; a real expense logged from My Trip's shared card was
confirmed to appear identically on Expenses & budget and to roll into Home's "spent today"
line, then deleted. **True offline test:** dev server killed, full render from Service
Worker Cache Storage on `#home`, `#me` and `#settings`, zero console errors, "Just arrived"
chip and shared expense card both present.

**Ship note (mk-v0.357.0):** this bump covers the Home phase merge (planning/on-the-ground/
post), the new dismissible "Just arrived" chip with its Settings restore control, and the
expense-logging unification (`expenseAddCard()`) — one version, one commit.

### Rename "On the ground" → "Traveling" (mk-v0.358.0)

Per direct request, the merged trip stage's user-facing label changes from "On the ground"
to "Traveling" (internal key `'traveling'`, `PHASE_ORDER`/`PHASES` in `js/main.js`, unchanged
from the v0.357.0 merge above — only the display strings move). Four occurrences updated:
`PHASES.traveling.label`/`.stmt`, `phaseSwitchRow`'s short-label map, and the post-trip-start
hint on the countdown card ("Switch Home to 'Traveling' for near-me help..."). Verified live:
Settings → Journey phase and the phase segment both show "Traveling", console-clean, and a
true offline test (dev server killed, full render from Service Worker Cache Storage on
`#settings`) confirmed the new label ships correctly with zero console errors.

### Swap "Search everything" and the weather ring's placement, on Home while Traveling (mk-v0.359.0)

Per direct request, Home's "Search everything" button and the 24h weather ring swap positions
in the traveling phase only. Previously the weather ring rendered nested at the top of the
"Right now" card (leading, right after Quick access/"Just arrived") while "Search everything"
sat much further down, just before the "Plan & tools" menu. Now: "Search everything" leads
(moved up, right after "Just arrived") and the weather ring — extracted out of the "Right now"
card into its own standalone `.card` — takes Search's old trailing spot instead, just before
"Plan & tools". `homeWeatherRing()` (`js/main.js`) is now exported so `js/screens/home.js` can
render it directly; `homeNowCard()` no longer inserts it into the card itself. The button
markup itself is deduplicated into a single `searchEverythingBtn()` helper (`js/screens/
home.js`) shared by both of its call sites (leading for traveling, trailing for planning/post,
which never had a ring to swap with, so their layout is unchanged). Verified live: phase set to
Traveling, console-clean, DOM order confirmed via the accessibility tree ("🔎 Search
everything" ahead of the "Right now" card, "Weather ring for Bangkok — open full forecast"
after "Where you are"); true offline test (dev server killed) confirmed the same order renders
correctly from Service Worker Cache Storage with zero console errors.

### Talk: searching "Say it" auto-saves the translation to your dictionary (mk-v0.361.0)

Per direct request ("if a user searches something in [Talk], what they search should be added
to their dictionary"), this closes the one gap the earlier phrasebook-search auto-pin
(mk-v0.35x) didn't cover: the "Say it in X" live-translate box. Typing an arbitrary phrase
there and translating it has no static category/phrase object to pin (unlike the phrasebook's
own fixed phrase list), so it gets its own storage: `customPhrases` (`js/state.js`, self-
defaults via the migrate spread — no version bump), a `{ th: [{ key, en, script, ts }] }` map
alongside `phrasePins`. `addCustomPhrase()`/`removeCustomPhrase()`/`moveCustomPhrase()`
(`js/main.js`) manage it, keyed `${code}|custom|${slug}` — same shape as a book `phraseKey`
with a synthetic `'custom'` catId no real category ever uses, so the existing note system
(`phraseNoteFor`/`setPhraseNote`) works unchanged. `liveTranslateBox()`'s `doTranslate()` now
calls `addCustomPhrase(code, text, res)` after every successful translation — idempotent (re-
translating an already-saved phrase is a no-op, no duplicate), so only a genuinely new phrase
gets a "✓ Saved to your dictionary · View →" confirmation line.

`dictionaryScreen()` grows a "📝 Your own translations" section per language (below any book-
pinned phrases, using a new `customPhraseRow()` — same look, its own reorder/remove controls
since it isn't part of the book's pin/hide system) and its language list is now the union of
book-pinned and custom-phrase codes, so a language with ONLY custom translations still gets
its own card; the empty-state and total count both account for custom phrases too, so "no
saved phrases yet" no longer shows incorrectly once one exists.

**Found and fixed in passing:** `.dict-note-save`'s `hidden` attribute was being defeated by
`.btn`'s `display: inline-flex` (equal specificity, author beats the UA default at that tie) —
the "Save note" button was showing even when it should be hidden, on EVERY note editor in the
dictionary (book-pinned or custom), not just the new one. Added `.dict-note-save[hidden] {
display: none; }` (`css/style.css`), the same pattern already used for `.dict-note[hidden]`
right above it.

**Verified:** translated "Where is the nearest pharmacy?" in Thai, confirmed the save
confirmation line, the dictionary entry (correct text, no roman line since the translate
service returns script only), a note saved and displayed correctly with the note editor now
correctly hidden by default, re-translating the same phrase confirmed idempotent (no
duplicate, no repeat confirmation), and Remove (with its confirm modal) correctly cleared it
back to the empty state. True offline test (dev server killed): full render from Service
Worker Cache Storage on `#phrasebook-th`, zero console errors.

### You: named by the traveller, chips lead, name-entry prompt at the top until set (mk-v0.362.0)

Per direct request, the "YOU" tab/section is now identified by whatever name the traveller
enters, in full, regardless of length:

- **`meTabLabel()`** (`js/main.js`) no longer falls back to "YOU" once a name exceeds 3
  characters — that length cap is gone. The tab bar's own CSS (`.tabbar button >
  span:last-child`) already ellipsis-truncates long labels without ever wrapping or breaking
  the 5-tab bar's layout, so a long name just truncates visually (with a `title` attribute
  carrying the full name for hover/accessibility) instead of silently reverting to "YOU".
- **`nameEntryCard()`** (new, `js/main.js`): a one-tap "👋 What should we call you?" prompt
  that leads `meHubScreen()` (You) until a name is set — no more trip to Settings required.
  Saves as the traveller types (mirrors Settings' own name field) but only re-renders — which
  is what makes the prompt, the tab label and the topbar title all update — once they actually
  commit it (Enter, or moving on), never on every keystroke, so typing is never interrupted by
  a mid-word repaint. Steps aside for good the moment a name is saved; clearing the name back
  to empty (from here while unset, or from Settings once set) brings it back, so it is never a
  one-way door.
- **The old identity "lead" card is gone** — per direct request ("the name and how many
  phrases should be removed and the chips should start the you section"). It used to show a
  big avatar + the name a second time + a one-line stat summary (journal entries · saved
  places · phrases) directly below the topbar, which already carries the name; every stat it
  summarised already shows live on one of the chips just below anyway (Journal's entry count,
  "Saved places · N" in Your stuff, My Dictionary's phrase count) — rank-collapse-never-remove,
  a duplicated CARD removed, not a duplicated destination. The quick-access chip row is now
  the first thing in You once a name is set (or the first thing after the name prompt, until
  one is).
- Dead CSS (`.me-lead`, `.me-lead-head`, `.me-avatar`, `.me-lead-txt`, `.me-lead-name`,
  `.me-lead-sub`) removed from `css/style.css`, replaced with the small `.name-entry-card`
  rule the new prompt needs.

**Verified:** with no name set, the prompt led You, chips came immediately after, tab read
"YOU". Typed "Alexandria Montgomery-Smith" (27 characters) and committed it: the topbar title
showed the full name, the prompt disappeared with chips now truly leading, and the tab
correctly showed the full name text (confirmed via the DOM, not just the visual ellipsis) with
a matching `title` attribute — the 5-tab bar layout did not break. Cleared the name from
Settings and confirmed the prompt reappeared on You and the tab reverted to "YOU" — reversible
in both directions. True offline test (dev server killed): full render from Service Worker
Cache Storage on `#me`, zero console errors.

### Danger screen reorder, Home planning-phase reorder, Plan/Money chips, dictionary rebuild (mk-v0.363.0)

Four direct requests, verified and shipped together:

**Health & wildlife hazards — mosquitoes/dengue moved to the end.** `dangerScreen()`
(`js/main.js`) used to lead with `mosquitoCard()`, before the dangerous-animal groups
(snakes, in the sea, scorpions & centipedes, larger animals). Per direct request it now
renders last, after the wildlife groups' own sources note and disclaimer — it carries its
own sources note and disclaimer already, so it reads as a self-contained closing section
rather than the screen's lead.

**Home planning phase: "Plan your trip" and "Money & tools" are now chip rows, not tile
grids.** Per direct request ("turn all the things in home plan your trip and money and
tools into chips"), both groups in `homeScreen()` (`js/screens/home.js`) now render as
`.chips` rows of `.status-chip` buttons — the same look already used by `quickAccessRow()`
above them and by You's own tile→chip conversion (`meHubScreen`'s `chipGrp`/`flatChip`,
`js/main.js`, mk-v0.348.0). Icon + label only, same call as that earlier conversion (the
old tile descriptions are dropped); Travel circle keeps its live " · N unread" sub and red
accent, identical to meHubScreen's own copy of that chip. The "🔎 Identify what's around
you" group below is unchanged — still a `.tile` grid — since it was not part of the request.

**Home planning phase reorder:** per direct request ("first I have arrived butoon and then
search everything and then plan your trip and tune 'for you'"), the planning-phase stage
block now reads: the countdown card (which shows an "I have arrived →" button once the trip
has started) → 🔎 Search everything → the "🧭 Plan your trip" / "🎯 Tune 'For you'" actions
row. Search everything used to trail the whole "Plan & tools" menu much further down;
`homeStageBlock()`'s return value (built in `main.js`, opaque to `home.js`) is now kept as a
variable in `homeScreen()` and, for the planning phase only, Search everything is inserted
via `Element.before()` directly ahead of its `.home-actions` row — the same `.before()`/
`insertBefore()` DOM-splicing pattern already used elsewhere in `main.js` (e.g. `keyCard`
before `layersCard`), needed here because Search everything is defined in `home.js` while
the stage block it needs to land inside is composed in `main.js`. Other phases (traveling,
post) are unaffected — Search still trails there, as before.

**My Dictionary rebuilt: language dropdown, one merged alphabetical list, collapsible.** Per
direct request:
- **Dropdown, not stacked cards.** With more than one language holding saved phrases,
  `dictionaryScreen()` now shows a `field('Language', selectEl(...))` dropdown (reusing
  `ui-widgets.js`'s existing `selectEl`, the same helper other screens' language/location
  pickers already use) and renders only the selected language, instead of every language's
  card stacked one after another. One language: the dropdown is skipped entirely. The
  selection itself (`dictLangSel`, a new module-level variable, same pattern as the
  calendar's `calSelDate`) is a view choice, not trip data, so it is not persisted to the
  store — it resets to the first available language on a fresh load.
- **One merged, alphabetical list per language**, not book-pinned phrases followed by a
  "📝 Your own translations" sub-heading. Book phrases and custom ("Say it") translations
  are combined into one array and sorted by their English text (`localeCompare`, case-
  insensitive) before rendering — a phrase's origin no longer affects where it sits.
- **Collapsible.** Each language's list is now a `<details class="filters-collapse">`
  (open by default — this screen's whole point — but foldable like every other card group
  in the app), wrapped in a `.card.dict-card` so the pill-styled summary sits on a card
  surface, the same nesting `dangerScreen()`'s first-aid entries already use.
- Manual reordering (↑ ↓, `movePhrasePin`/`moveCustomPhrase`) is retired: with the list now
  always alphabetical, those controls would silently do nothing, so they and the two
  now-dead helper functions are removed. Copy, speak, note and remove are unchanged.

**Verified (all four, live in the browser, via the accessibility tree and direct DOM
inspection — screenshots included for the chip/dropdown/merge views):** mosquito card
confirmed as the last child of `#danger`'s screen div, after the wildlife sources/
disclaimer. Home's planning-phase stage block confirmed in DOM order: `card companion-card`
→ `card home-outlook` → `btn ... home-search` → `home-actions`; "Plan your trip" and "Money
& tools" confirmed rendering 8 and 7 `.status-chip` buttons respectively inside `.chips`
(the "Identify" group beside them still `.tile`/`.grid`, untouched). Dictionary: pinned one
phrase (auto-propagated to all 8 languages), translated a second phrase via "Say it" (auto-
saved as a custom phrase), and confirmed the dropdown listed all 8 languages; switching
languages re-rendered the correct single collapsible with that language's own phrases;
Thai's list showed "Delicious food" (custom) interleaved correctly between "Excuse me /
Sorry" and "Hello" (both book phrases) with no sub-heading — proving the merge and the A–Z
sort together. Note-add, note-save and remove (with its confirm dialog) all worked
correctly post-rebuild. Zero console errors throughout. True offline test (dev server
killed, `caches.keys()` confirmed on `mk-v0.363.0`): `#danger`, `#home` and `#dictionary`
all rendered correctly from Service Worker Cache Storage with zero console errors.

### Home: "Identify what's around you" becomes chips too, for consistency (mk-v0.364.0)

Direct follow-up ("make identify whats around me section elements chips as well the site
should be consistent in that way"): the one remaining tile grid on Home — "🔎 Identify
what's around you" (Food, Produce, Nature, Sounds, Dangerous, My identifier) — is now a
chip row too, folded into the same `groups` array/loop as "Plan your trip" and "Money &
tools" (`js/screens/home.js`) instead of its own separately-styled `<details>` below them.
It previously had a visibly different summary (a plain `.home-section` span) from the other
two groups' small-caps `.home-group` label; it now uses the exact same summary markup, so
all three collapsibles look and behave identically, closing the inconsistency the request
was about.

The shared `chip()` helper (added last round for Plan/Money) is generalised to the same
`(ic, label, sub, onclick, extraClass)` shape `quickAccessRow()` and `meHubScreen()`'s own
chip already use, rather than the narrower one-off `(ic, label, hash, badge)` shape it had —
this is what lets "My identifier" show its live "· N saved" count (previously baked into
the tile's `d` description) the same way Travel circle already shows its live "· N unread"
badge, instead of inventing a second mechanism. Icons were chosen to match each
destination's own established emoji elsewhere rather than new ones: 🍜 (Food/dish, `catEmoji`/
`ID_TYPES`), 🍈 (Produce, `ID_TYPES`), 🔍 (My identifier, meHubScreen's own chip for the same
destination). Nature (🌿), Sounds (🔊) and Dangerous (⚠️) had no prior chip-emoji precedent,
so were picked to match their existing SVG tile icon's meaning (leaf, speaker, warning
triangle). `ICON`/`sectionTile` are no longer imported in `home.js` — this was their last
use in the file.

Open-by-default logic carries over unchanged in spirit: the Identify group (now index 2)
opens automatically on the ground (`onGround`), same as its old standalone `identifyOpen`
did; Plan-your-trip (index 0) still opens automatically in planning/post.

**Verified:** confirmed via direct DOM inspection that all four of Home's collapsibles
(Quick access, Plan your trip, Money & tools, Identify) now share the identical `summary`
class, and that Identify renders 6 `.status-chip` buttons inside a `.chips` div (previously
6 `.tile` buttons inside a `.grid`) with the correct labels and live "My identifier" count
sub. Switched to the Traveling phase via the real phase-switcher button and confirmed
Identify auto-opens while Plan-your-trip/Money-and-tools auto-close, matching the prior
open/closed behaviour exactly. Zero console errors. True offline test (dev server killed,
`caches.keys()` confirmed on `mk-v0.364.0`): `#home` in both planning and traveling phases
rendered the correct chip groups from Service Worker Cache Storage with zero console errors.

### Home planning: weather outlook trails the actions; Home traveling: weather widget upgraded to the full Weather-screen view; ring hour labels clarified (mk-v0.365.0)

Two direct requests, both about Home's weather presentation:

**Planning-phase reorder** — "after Your trip has started then search everything button
then plan your trip and tune for you and then the weather": `planningStageBlock()`
(`js/main.js`) used to append the destination weather outlook (`destinationOutlookCard`)
between the countdown card and the "Plan your trip"/"Tune 'For you'" actions row; it now
appends the actions row first and the outlook last. Since home.js's Search-everything
splice (`stageBlock.querySelector('.home-actions').before(...)`) targets the actions row by
selector rather than position, it needed no change — Search still lands directly before
the actions row regardless of where the outlook falls. Final order: countdown ("🛬 Your
trip has started" once the trip's underway) → Search everything → Plan your trip/Tune "For
you" → 🌤 destination outlook.

**Traveling-phase weather widget** — "the weather widget should look like the larger one
in the weather section with layers and hours need to be much clearer in the wheel to know
when. and that should be in the weather section too": Home's on-the-ground weather card
used to be `homeWeatherRing()`, a small (max 190px) button wrapping just the 24h ring fixed
to the Temp metric. It is now `homeWeatherCard()` (renamed, same export point), which
builds and returns `wxVizCard(rec, spot)` — the exact same widget the Weather screen's own
"Right now" view uses: the metric chip row ("layers" — Temp/Rain/Humidity/UV/Feels/Wind),
the 24h watch-face ring at full size, the detailed hour-by-hour scroll strip, and the
upcoming-forecast month calendar. `wxVizCard` already returns a styled `.card`, so home.js
appends it directly rather than wrapping it in another card div as the old ring needed; a
trailing "Full forecast →" button is appended (the old ring's whole surface was itself the
tap-through; `wxVizCard` has no built-in link out) so tapping through to `#weather` still
works. The now-unused `.home-wx-ring`/`.home-wx-card` classes are removed from
`css/style.css` and `homeWeatherRing`'s old export name is gone (renamed throughout, one
call site in `home.js`).

**Ring hour-label clarity** — `wxHourlyRingSvg()` (`js/main.js`) is the one function behind
both the old compact ring and the full `wxVizCard`, on both Home and the Weather screen, so
fixing it here fixes it everywhere it is used. It labelled only every 6th hour (4 labels —
N/E/S/W) at 11px in muted grey; it now labels every 3rd hour (8 labels), each with a short
radial tick connecting it to its wedge, at 12px/700-weight in full ink contrast instead of
muted, and the "now" label (the first wedge, always at the top) gets its own accent-coloured
class to anchor the reading. This reads noticeably more clearly at a glance which segment is
which hour, on both the (now much larger) Home widget and the Weather screen's own ring.

Bumped `APP_VERSION`/`CACHE_VERSION` to `mk-v0.365.0`.

**Verified:** direct DOM inspection confirmed the planning-phase stage block's child order
is countdown → search button → actions row (Plan your trip/Tune "For you") → outlook card,
screenshot-confirmed visually as well. Switched to Traveling via the real phase button and
confirmed `.wx-viz` renders on Home with all 6 metric chips, 8 ring labels (`7pm 10pm 1am
4am 7am 10am 1pm 4pm` for the tested time), 8 ticks, the hourly scroll strip, the month
calendar, and a trailing "Full forecast →" button that navigates to `#weather` on click;
confirmed the Weather screen's own ring shows the identical 8 labels/8 ticks, proving the
shared-function fix reached both places. Zero console errors. True offline test (dev server
killed, `caches.keys()` confirmed on `mk-v0.365.0`): `#home` in both planning and traveling
phases, including the full weather widget, rendered correctly from Service Worker Cache
Storage with zero console errors (only the expected harmless "failed to update the
ServiceWorker" background-check noise while the origin was unreachable).

### Home: Plan/Money chips merge into one default-open Tools group; ring hour-labels no longer clipped; post phase leads with Search, recap gets a gamification level + rating (mk-v0.366.0)

Three direct requests:

**Tools merge** — "make all the plan and tools chips and the money and tools chips
combined into one tools section and default it expanded": Home's "Plan your trip" (8 chips)
and "Money & tools" (7 chips) collapsibles (`js/screens/home.js`) are now one — "🧰 Tools"
— with all 15 chips concatenated in their original order. It defaults open in every phase
now (previously "Plan your trip" only opened by default in planning/post); "🔎 Identify
what's around you" is untouched and keeps its own on-the-ground-only auto-open rule.

**Ring label clipping** — "Make the numbers on the circle weather section all clear and
visable and not obstructed": `wxHourlyRingSvg()`'s hour labels (added last round) sat at a
radius that put the south label's baseline 3 units past the bottom of the old 240×240
viewBox, and the east/west labels' centred text hung half off those edges — genuinely
clipped, not just visually tight (this predates last round's change; adding 4 more labels
only made it more noticeable). Fixed at the geometry level: the ring now draws inside a
280×280 box with the centre shifted to (140,140) — the wedge/ring radii themselves
(`rIn`/`rOut`) are unchanged, so the ring's own size and look on screen do not change, only
the margin around it. Verified with `getBBox()` against the SVG's `viewBox`: all 8 labels
now fit fully inside on both axes, on both Home and the Weather screen (same shared
function).

**Post-phase reorder + recap additions** — "in home post section: start with search
everything then welcome back section which should have the gamification level and rating
there": post used to show the "📖 Welcome back" recap card before Search everything; Search
now leads (`js/screens/home.js` — the on-the-ground Search condition now also covers
`phase === 'post'`, and the old post-only trailing `else` that used to append it after the
recap is gone, since nothing else reaches that branch). `returnRecapCard()` (`js/main.js`)
now opens with a level badge — the same on-device points/level system already shown in full
on `#contributions` (`gamify.contributionPoints`/`levelInfo`), tapping through there — in
both the empty and populated states (a level exists from the first point, so nothing to
gate on). The existing stats row (journal entries, places loved, stops) gains a "places
rated" count alongside "places loved", giving the "rating" side of the request a real
number rather than folding it into the existing loved-places stat, which is a subset of it.

Bumped `APP_VERSION`/`CACHE_VERSION` to `mk-v0.366.0`.

**Verified:** DOM inspection confirmed the Tools group renders 15 `.status-chip`s and stays
open regardless of phase (checked in traveling and post). Switched to post via the real
phase button and confirmed the screen's child order: Quick access → Search everything →
Welcome back (with the level badge reading "🌱 Newcomer · Level 1 →" and the recap stats)
→ Tools → Identify (correctly closed, not on the ground). `getBBox()` against the ring's
`viewBox` confirmed all 8 hour labels fit fully on-screen with no clipping on the Weather
screen. Zero console errors. True offline test (dev server killed, `caches.keys()`
confirmed on `mk-v0.366.0`): `#home` rendered the Tools group (open, 15 chips) correctly
from Service Worker Cache Storage with zero console errors.

### Home: drop the "Plan & tools" heading; right-now suggestions get a real upgrade — info cards excluded, colour-consistent tags, budget tiers, rain-aware markets, closed places actually hidden (mk-v0.367.0)

Five direct requests, all about the quality of Home's "right now" suggestions and the
duplicate heading above the merged Tools group:

**"Plan and tools title can go away and tools just have the tools title that already is
there"** — the merged Tools collapsible (shipped last round) still sat under a separate
`<h2>Plan & tools</h2>` (`js/screens/home.js`) that duplicated its own "🧰 Tools" summary
text right below it. The heading is gone; the group's own summary is the only title now.

**"Practical: cash, health and road safety does not belong here"** — traced to a real data/
logic mismatch, not a one-off. `js/data/places.th.ext.js` and `places.vi.ext.js` carry a
handful of orientation/practical "info" cards (e.g. `th-ext-pai-cash-health-safety`, "Pai
practical: cash, health & road safety", `categories: ["health","money","info"]`) — written
to be read on a place's own page, never meant to be suggested as somewhere to go.
`daySuggestScreen`'s `todoDoable()` whitelist already excluded these correctly, but Home's
own "right now" card (`rightNowSection` → `scoreForNow`, `js/main.js`) had no equivalent
filter, so an info card with a decent rating and nearby coordinates could still surface as
a go-do pick. `scoreForNow` now runs the exact same `todoDoable()` whitelist, so the two
surfaces that offer "what to do right now" can no longer disagree about what counts as a
thing to do.

**"The color coding for food and history and all that should be color coded with a
consistency in the site" / "budget and midlevel and all that should also be tagged here and
color coded with consistency across the site"** — Home's right-now picks (`rn-item` rows)
showed only a plain-text category label and no budget tier at all, while every other list on
the site (`todoCard`, place-card rows) already uses one canonical colour system: `catTag()`
(family-hued category pills, `FAMILY_COLOR`/`CATEGORY_FAMILIES`, `render-utils.js`) and
`tierBadge()` (Budget/Mid/Higher-end pills, `TIER_COLOR`). Home's picks now show up to 3
`catTag()` pills plus a `tierBadge()` when a budget tier exists, a star rating, and a
category-coloured left accent bar (`--cat` custom property, same technique `place-card`
already uses) — the exact same components, not a parallel Home-only look. `todoCard()`
(the fuller `daySuggestScreen` list) gained the same `tierBadge()` too, since it was missing
there as well — budget tier is now visible and consistently coloured everywhere a place
card appears.

**"At midnight it shouldn't be suggesting restaurants that are closed... important to
always suggest places that are not obviously closed"** — Home's `scoreForNow` already
excluded known-closed places outright (`open === false → -Infinity`); the actual gap was
`daySuggestScreen`'s `drawList()`, which only sank closed-now places to the bottom of their
tier, tagged "🔒 Closed now" — still shown, not hidden. Closed-now places (when planning for
"Now" specifically; irrelevant when planning for a different time) are now filtered out of
the pool entirely, with a one-line transparency note ("N more are closed right now, so
they're hidden — see 'Plan for a different time' above") so nothing feels silently removed.
Unknown/unparseable hours are still never treated as closed — only what the data actually
says.

**"When raining it should [not] suggest the night outdoor markets unless they are truly good
in the rain"** — a real scoring bug: `INDOOR_CATS` (`scoreForNow`) bundled `market` in with
genuinely indoor categories (culture, food, wellness), so every market — including open-air
walking-street and floating markets — got the rain bonus and a "Good in the rain" reason.
`todoScore` (`daySuggestScreen`) had the same shape of bug from the other direction: markets
weren't in `TODO_RAIN_BAD` at all, so they fell into the generic "else" branch and got
"☔ Good in the rain" regardless. Added `marketCovered(p)` — a best-effort text scan
(`marketType`/`blurb`/`recognition`/`tips` for "covered market", "market hall", "tin-roofed",
"corrugated roof", "under ... roof(s)") since no structured indoor/covered field exists in
the data. Verified against the real Thailand dataset (13 market entries): Chatuchak Weekend
Market correctly reads as covered (its recognition text says "under corrugated roofs");
every walking-street, floating and railway market (Damnoen Saduak, Maeklong, Chiang Mai's
Sunday/Saturday walking streets, Asiatique, Mae Hong Son/Mae Sariang night markets) correctly
reads as open-air. Both `scoreForNow`/`whyNow` (Home) and `todoScore` (daySuggestScreen) now
judge a market on its own covered-or-not status rather than lumping it in with unrelated
categories — an uncovered market is penalised like any other outdoor pick in the rain; a
covered one still gets the rain-friendly bonus and a specific "Covered market — good in the
rain" reason.

Bumped `APP_VERSION`/`CACHE_VERSION` to `mk-v0.367.0`.

**Verified:** DOM inspection on the live Home right-now card (traveling phase, Bangkok)
confirmed all 5 picks now render colour-matched category pills, tier badges ("Budget" /
"Mid" / "Higher-end") and a matching left accent bar (e.g. food → `rgb(232,99,42)`, matching
`FAMILY_COLOR.food`; nightlife → `rgb(214,51,108)`, matching `FAMILY_COLOR.nightlife`) — a
screenshot confirmed the same visually. Dynamically imported `js/data/regions.js` in the
live page to confirm the Pai practical/info card resolves `todoDoable() === false` (so it is
excluded from both surfaces), and ran the exact `marketCovered()` regex against all 13 real
Thai market entries, matching the analysis above exactly. On `#today-th`, confirmed 9 cards
rendered across 3 tiers with zero "Closed now" tags visible and a note reading "13 more are
closed right now, so they're hidden — see 'Plan for a different time' above." Zero console
errors throughout. True offline test (dev server killed, `caches.keys()` confirmed
`["mk-v0.367.0"]`): Home's right-now card (5 items) and the Tools group rendered correctly
from Service Worker Cache Storage with zero console errors.
