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

### Home — *pending interview*
### Explore — *pending*
### Places — *pending*
### Talk — *pending*
### You — *pending*
