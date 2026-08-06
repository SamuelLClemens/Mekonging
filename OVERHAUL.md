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

### Places — *pending*
### Talk — *pending*
### You — *pending*
