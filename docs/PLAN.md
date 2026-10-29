# Plan — data gaps and the traveller exchange (2026-10-12)

## How the slices run
- One slice per fresh session. Start it from `CLAUDE.md`, `docs/HANDOFF.md`, this file and the files the slice names.
- Every slice that changes a shipped file bumps `APP_VERSION` and `CACHE_VERSION`. Those slices therefore stack: each starts from the merged tip of `feat/scaffold-bangkok-slice`, and two releasing slices never run at the same time.
- M0, the exchange planning session, changed documents only and is done: see `docs/EXCHANGE.md`.
- Exchange slices M1–M10 (`docs/EXCHANGE.md` §17) change shipped files, so they stack with the data slices like any other releasing slice.
- M1 (the board moved to `js/screens/exchange.js`) is PR #108, `mk-v0.633.0`, 2026-10-12.
- M1 (PR #108) and M2 (the Market tab, PR #111, `mk-v0.635.0`) are merged. M3 is next on the exchange side. Its owner actions (`docs/EXCHANGE.md` §15, the M3 rows up to sending the public values) were done on 2026-10-19.

### Release order (owner, 2026-10-19; updated after M3b; fixes inserted 2026-10-24; program order 2026-10-25)
- **Owner rulings, 2026-10-25 (program session 0).** `docs/PROGRAM.md` holds the re-measured open-item register, the style
  brief and the ranked feature backlog (T1 to T15). The owner answered one form: the style work splits (S0, the style gate,
  runs alongside; S1, the style foundation, goes just before F4; Q3 to Q7 go after L4), trust comes first (T1, fact
  freshness, and T2, border status, run right after Q7, before M4b-2; T3 to T15 after C8), decisions 14, 19 and 23 are yes,
  13 is yes, 10 waits until Q5 is done, and 24 is yes (every Cambodian village, slice F1b). The order is now:
  F2 (with decision 23), F1b, F3, S1, F7a (placed before F4 by the owner, 2026-10-27), F4, F5, F7b (placed right after F5, 2026-10-27; decision 26's outline measurement first), L1, L2, L3, L4, Q3 to Q7, T1, T2, M4b-2, M4c (installs `pglast`, decision 19),
  M5, L5, D5 tidy (with decision 13), G1 to G4 (coordinates checks, decision 14, with decision 22 in G1), R1 to R3 (the style
  roll-out), B1 to B8, C1 onward, then T3 to T15. Q2, S0 and Q8 run alongside. Session 0 chose the places of F1b, G1 to G4,
  R1 to R3 and `pglast` (the form did not ask); the owner can move them.
- **Owner rulings, 2026-10-24: the traveller fixes and the language work (section below) come before M4b-2**, in the order F1, F2, F3, F4, F5, L1, L2, L3, L4. They stack like any releasing slice. The Market's M4b-2, M4c and M5 then follow, then **L5** (Talk by invite, which reuses M5), then D5 tidy and the rest as listed.
- Merged on 2026-10-19: D5 Laos (PR #122, `mk-v0.643.0`), M3a (PR #124, `mk-v0.644.0`) and **M3b, accounts and sign-in** (PR #125, `mk-v0.645.0`). M3b's owner checks (migration 001, the RLS test, the Security Advisor, the iPhone sign-ins) are tracked in `docs/HANDOFF.md`.
- **Owner ruling after M3b: Market first, one slice per session** (`docs/EXCHANGE.md` §16, 2026-10-19). Releasing slices stack, one at a time, each from the merged tip:
  1. **M4a**: listings and search, server side. Built on 2026-10-19; the owner's SQL run passed on 2026-10-23 (314 of 314) and the owner merged it on 2026-10-23 (af2e9fe, `mk-v0.646.0`) ([PR #127](https://github.com/SamuelLClemens/Mekonging/pull/127), `mk-v0.646.0`; `docs/HANDOFF.md`).
  2. **M4b**: the marketplace redesign, split in two by the owner on 2026-10-24:
     - **M4b-1**, browse: category artwork, the home, search and filters, the listing page, the closed-beta preview. Merged on 2026-10-23 (6e5a7cc, [PR #129](https://github.com/SamuelLClemens/Mekonging/pull/129), `mk-v0.647.0`, live);
     - **M4b-2**, post: the post forms, My listings and the live owner-and-tester check.
  3. **M4c**: listing photos.
  4. **M5**: messages, block and live alerts, right after M4c (owner, 2026-10-19): a marketplace that cannot message cannot complete a hand-off. M6 onward follow later.
  5. **D5 tidy** (approved): relabel the 50 "Ministry of Tourism" entries on tourismcambodia.com and .org (34 in `places.kh.ext.js`, 6 in `places.kh.js`, 5 in `local.kh.js`, 3 in `itineraries.js`, 1 each in `info.kh.js` and `prices.kh.js`) as "Tourism Cambodia", with tourism.gov.kh as the ministry. Check Long Beach (Sok San) against Long Set Beach (4K Beach) and merge them if they are one beach (with a `place-merges.js` line). Open decision 13 (the Tourism Laos relabel) is recommended to ride along.
  6. **Bangkok B1 to B8** (below), then **city depth C1 onward** (below, order confirmed by the owner).
- Q2, the audit driver under `tools/audit-375/` (tools only, no version bump), can run alongside any of these, and so can S0 and Q8. Q3 to Q7 stack like any releasing slice, after L4 (owner, 2026-10-25).

## Traveller fixes and language work (owner, 2026-10-24)
The owner listed five fixes "we need to make for sure", then widened the language one. Code facts below were measured at 6e5a7cc (`mk-v0.647.0`, the live version). Each slice is one session, run with `/slice`, and stacks on the merged tip of the one before. F2 and F3 use F1's place list; L2 uses F5's check; L4 uses L3's list. Since 2026-10-25, F1b runs between F2 and F3, and S1 (`docs/PROGRAM.md` section 5) between F3 and F4.

### Owner rulings, 2026-10-24
- The five fixes come before M4b-2.
- Place list: an offline list of every town, village and island in the four countries, from GeoNames (CC BY 4.0, credited in the app), stored in the app so it works without signal. Not online search alone, and not a hand-picked list.
- Location: ask once on first open. After a yes, track silently on every launch and use the fix everywhere. A dismissed or denied request never re-raises the browser dialog; one banner offers it again.
- Languages (second round, the same day). The owner saw Thai go wrong in Safari on iPhone but did not describe it, and asked instead that every language be checked and made to work, the four host languages first; that every widely spoken local language be added; that Talk end with a map coloured by where each language is spoken; and that Talk let two people converse with the app translating both sides. Rulings:
  - Machine translation may fill missing interface text in all 29 languages, each entry recorded as machine-made for a later native review. Thai, Vietnamese, Khmer and Lao go first. This overrides rule 2 in `js/data/ui-strings.js` ("an omitted entry is a feature"); F5 rewrites that comment to match.
  - Local languages with 1 million or more speakers in the four countries are added, with cited speaker counts.
  - Conversation: a face-to-face mode on one phone first (no server), then a remote chat joined by invite link or code only, after M5.
  - F5 is now the language check and the host-language fixes. Open decision 20 is closed.

### F1: every place in the place pickers
- **Built** 2026-10-25 ([PR #132](https://github.com/SamuelLClemens/Mekonging/pull/132), `mk-v0.648.0`, merged; Laos follow-up [PR #133](https://github.com/SamuelLClemens/Mekonging/pull/133), `mk-v0.649.0`): 26,195 places, a search picker in all five callers, forecast, pin and nearest places for a picked place, offline. Owner ruling that day, after the measurement (154,792 places in GeoNames, 965 KB compressed for Thailand alone): **only places with a population, as complete as possible without a long list**. The list keeps every island, administrative seat and place with a population, the subdistricts and communes with a population, and populated places with a Wikipedia or Wikidata entry. Laos was thin under it (294 places), so the owner had every Lao village added the same day (13,285, 182 KB gzip). Vietnam (1,626) stays thin: every populated place is 478 KB, over the 250 KB cap; see `docs/HANDOFF.md`, open decision 24 for Cambodia.
- **Problem.** Koh Chang and Koh Mak are missing. A traveller anywhere in the four countries must be able to pick their place, check its weather and see it.
- **Measured.** Every place picker is `locationSelect` (`js/ui-widgets.js:328`), which lists `WEATHER_SPOTS` only: 165 cities (th 53, vi 37, kh 35, la 40). Its callers are `js/main.js:1251` (`locationFixCard`), `js/main.js:2568`, `js/screens/country-info.js:43`, `js/screens/places.js:95` and `js/screens/journal.js:1103` (the journey's "Add a stop you missed"). No place record exists for Koh Chang or Koh Mak; only their piers are in `js/data/ferries.js`. Weather already fetches by coordinates (`js/weather.js:504`), so any place with coordinates can have a forecast.
- **Source.** GeoNames country dumps at `download.geonames.org/export/dump/`: TH.zip 9.8 MB, VN.zip 2.0 MB, KH.zip 0.8 MB, LA.zip 0.7 MB (Content-Length, 2026-10-24). Use feature class P (leave out PPLX sections, PPLH historical and PPLQ abandoned places) and the islands (T: ISL, ISLS, ISLET). Download into a new empty folder; process with `python3 -I`.
- **Scope.**
  - `scripts/build-gazetteer.py` writes one lazily loaded file per country, listed in the service-worker manifest so it works offline. Fields: name, local-script name where GeoNames has one, coordinates (5 decimals), country, province, kind (town, village or island). Measure first. Keep each country's file under 250 KB after gzip; if the full set is larger, keep every island and every place with a population or an administrative role, and report what was dropped.
  - A search-as-you-type picker replaces the `<select>` in every caller: the 165 curated cities first, then the place list. Keep the `onChange(key)` contract. A place-list key needs its own resolver beside `spotForKey`. Check what each `setFocusSpot` consumer reads from a spot (`city`, `country`, `lat`, `lng`, `hub`) before passing a place-list entry to it.
  - Never add place-list entries to `WEATHER_SPOTS`: those are the Nearby anchors (CLAUDE.md).
  - A picked place shows its forecast (within the cap of 8 saved forecasts), a map pin, and the nearest curated places by distance.
  - Credit GeoNames where the app lists its data sources.
- **Done when.** Koh Chang, Koh Mak and 10 sampled small places (at least two per country, including Koh Rong Samloem in Cambodia, Con Son in Vietnam and Don Khone in Laos) can be found in every picker and show a forecast and a pin at 375 px. The place list loads offline after the first visit. File and pack sizes are reported before and after. All guards and the validator pass.
- **Out of scope.** Place records and guides for the new places (content for Koh Chang and Koh Mak is its own data slice), the journey map (F2), automatic location (F3).

### F1b: every village in Cambodia (owner, 2026-10-25, decision 24)
- **Problem.** Cambodia's place list holds its communes and populated places but few villages: 2,192 places, 341 of them
  villages (`js/data/gazetteer.kh.js`, measured 2026-10-25).
- **Measured.** Every village would make 12,128 places, 213 KB gzip, under the 250 KB cap (F1's measurement, `docs/HANDOFF.md`
  decision 24). Laos took the same step in PR #133 through `EVERY_VILLAGE` in `scripts/build-gazetteer.py`. The worst
  keystroke at 26,195 places is 73 ms under a 6x CPU slowdown; about 9,900 more places add about 40% to it.
- **Scope.** Add Cambodia to `EVERY_VILLAGE`, rebuild and measure. Thailand, Vietnam and Laos stay byte for byte unchanged.
  Measure the keystroke cost before and after under a 6x CPU slowdown; if the worst query passes 100 ms, tune the matcher in
  the same slice.
- **Done when.** Three Cambodian villages absent before are found in every picker and show a forecast and a pin at 375 px;
  the offline probe finds one with the server stopped; file, `PRECACHE` and manifest sizes are reported before and after;
  all guards and the validator pass.
- **Out of scope.** Landmarks (T3 in `docs/PROGRAM.md`), Vietnam (T13).
- **Built 2026-10-26** ([PR #137](https://github.com/SamuelLClemens/Mekonging/pull/137), `mk-v0.651.0`). 12,128 places, 212.9 KB gzip; the worst keystroke is 80.9 ms at the 6x estimate (renderer CPU time times 6; 93.9 ms with the old matcher). The matcher got two cheaper checks with identical answers. 660 communes are now dropped as duplicates of a village within 5 km. Details: `docs/HANDOFF.md`.

### F2: Your journey, the whole world, fully editable
- **Built** 2026-10-26 ([PR #136](https://github.com/SamuelLClemens/Mekonging/pull/136), `mk-v0.650.0`). Proof: headless Chrome over CDP at 375 px, light and dark, `document.hidden` false,
  driver `~/Library/Caches/mk-f2/drive.py`. Before: the map's bounds were `[92, 2, 115, 27.5]` (a jump to Singapore landed at
  latitude 3.65) and 1 of 3 stops had an Edit control (Bangkok, from the trail; Chiang Mai from the plan and Hanoi from a
  journal entry had none). After: no bounds (floor at zoom 1), 3 of 3 stops have Edit and Remove, and 26 of 26 checks pass in
  each theme (the empty state: 4 of 4).
  - **Three ways to place a stop** (`js/screens/journey-edit.js`, one form for adding and for moving): the F1 picker; a pin
    dropped by a real tap on the map (a banner and a frame show while it waits, and the markers let the tap through); "I am
    here" (one reading from the phone, the app's last fix if the phone refuses). Outside the four countries the traveller types
    the name; inside, a name is offered only for an exact town (within 6 km of a place, or 15 km of a hub), never a far guess.
  - **Overrides** (`js/trail.js`, `profile.trail.over`, `js/state.js` version 17): a journal entry's or trip stop's stop is
    renamed, re-dated, moved or hidden by a record keyed `entry:<id>` or `trip:<id>`; `journeyStops()` reads it. The journal
    entry and the trip plan are byte for byte unchanged (checked). A trail stop is rewritten in place, as before. "Bring back
    removed stops" clears the hidden flags.
  - **Empty state** keeps the map and the add form. The share-journey route also carries the stops the traveller added by hand
    (`manual`), under the existing "stops" box; automatic pins still never go.
  - **Decision 23** rode along: `js/market-routes.js` and `js/market-link.js` in `PRECACHE`; `check-offline-boot` in CI and the
    scripts README.
  - **Basemap outside the region** (measured, zooms 1 to 9): online, the Esri imagery is worldwide: 75 tiles loaded across 18
    views (Singapore, Koh Mak, London) and none failed. Offline with every external host unresolvable, 0 of 124 requested tiles
    loaded and the map is bare sea: the self-hosted land geometry covers the four countries only, so at Singapore it draws nothing from zoom 5 and at London nothing at any zoom. See `docs/PROGRAM.md` 4.4.
- **Problem.** "My journey" must be fully editable, and its map must cover the world so a traveller can tag where they are from anywhere.
- **Measured.** `journeyScreen` (`js/screens/journal.js:762`) calls `initMap` (`journal.js:961`) without `worldBounds`, so the map is fenced to `REGION_BOUNDS` [[92, 2], [115, 27.5]] (`js/map.js:555`, applied at `map.js:901`). "Add a stop you missed" (`journal.js:1095`) offers only `WEATHER_SPOTS`. Edit and delete appear only on stops with a `trail.js` component (`journal.js:1044`); stops that come from journal entries, the trip plan or saved places cannot be edited on this screen.
- **Scope.**
  - Pass `worldBounds: true`. Check what the basemap draws outside the region at zooms 1 to 9, online and offline.
  - Add a stop anywhere in three ways: F1's picker, a pin dropped by tapping the map anywhere in the world, or "I am here" from the live fix. Outside the four countries the traveller types the name. Add no new third-party host without the owner.
  - Every stop can be renamed, re-dated, moved and removed from this screen. For a stop that comes from a journal entry, a trip stop or a saved place, store the change as a journey override in `js/trail.js`, keyed by that stop, and leave the source record untouched (the reason given at `journal.js:1044` still holds). The override store is a `js/state.js` schema change, so it bumps the store version.
  - Order stays date-driven: re-dating a stop moves it.
- **Done when.** A stop added in Singapore and one on Koh Mak show on the map in date order. A journal-derived stop is renamed, re-dated, moved and removed on the journey screen while its journal entry stays unchanged. 375 px, light and dark, 0 overflow, 0 console errors. All guards pass.
- **Out of scope.** The share-journey file format beyond carrying the new stops; how the trail records points automatically.

### F3: location known from the first open
- **Built 2026-10-27** (`mk-v0.652.0`, store version unchanged at 17). Proof: headless Chrome over CDP, fresh profiles on 127.0.0.1, 375 x 812 at DPR 2, `document.hidden` false, driver `~/Library/Caches/mk-f3/drive.py` (not in the repo): 25 of 25 checks, 0 console errors in the position scenarios (the welcome, card and banner scenarios did not collect them).
  - **Measured before, at `acbc7a3`.** The welcome step made 0 geolocation calls and "Skip" marked `prefs.geoAsked` true although nothing was asked. A traveller who had finished setup saw no location control on Home (the old hint needs phase "traveling"). A denied profile made 0 calls on load and on reload (already right) and showed no banner. Koh Chang already read "Koh Chang" on Home and Weather, because it is a curated anchor, so the done criterion passed before any change. Koh Mak read "Trat", Anlong Chambak read "Pursat" (56.1 km; Siem Reap is 58.5 km) and an emulated fix in Singapore read "Songkhla" (751 km) on Home and Weather and was filed in the trail as `th`.
  - **Welcome and Home** (`js/screens/welcome.js`, `js/location-ask.js`, `locationFixCard` in `js/main.js`): the card's filled "Use my location" is step one's main action, with a one-sentence reason; Next is a ghost until location is on and still works. The browser's dialog is raised only by a tap (`refreshLocation()` records it in the new `prefs.geoPrompted`): 0 calls on load, exactly 1 `getCurrentPosition` after the tap. Home shows one card to a traveller who was never asked and one dismissible banner to one who refused or swiped the dialog away, each only while there is no fix; dismissal is stored in `prefs.geoNudgeOff`. A denied profile makes 0 calls on load and on reload, and the banner stays gone after its dismissal.
  - **Where the fix goes** (`js/fix-place.js`): within 15 km of a curated city that city names the spot, as before (Koh Chang, Koh Mak and Bangkok are unchanged). Beyond 15 km, the place-list entry nearest to the fix (within 25 km) names it: `focusSpot().place` and `displayCity`, so Home, the right-now card, Weather, Places, Explore's "You're around", Nearby and Emergency (through `whereAmI`'s new `list` source) and the trail pin name the village. Sampled: Anlong Chambak (kh, 56.1 km from its anchor) and Don Không (la, 16.9 km) read their own names on Home and Weather, with their own forecast. The answer is stored in `prefs.fixPlace` and read synchronously; the four lists load only for a fix not yet resolved. CPU per resolution, renderer thread: 21 to 24 ms with the lists in memory, 84 ms cold (about 130 to 145 ms and 500 ms at a 6x slowdown).
  - **Outside the region**: a fix more than 250 km from every curated city (Singapore 751, Kuala Lumpur 457, Hong Kong 739, Kunming 322; 99.9% of the 36,131 list places are within 186 km) no longer names a far city. The focus ignores it, and the trail pin is filed with no name and no country. The 10 km outline band cannot be the test: it calls 681 list places (625 islands) outside.
  - **Deviations from the scope above.** (1) The scope's test `prefs.geoAsked` false cannot find travellers who finished setup (`finish()` sets it), so the card and banner read the new `geoPrompted`. (2) Koh Chang being an anchor, the criterion was also run on a remote village. (3) Today, Transport and Explore's "Places in X" still read the anchor: their content is keyed to curated cities. (4) A GPS fix still outranks a place picked by hand (F1's item, left).
  - **Not done.** The iPhone (owner check); offline was not re-run (the place is read from the on-device store, and the lists are precached: `check-offline-boot`). Details and the open items: `docs/HANDOFF.md`, `docs/PROGRAM.md` 4.4.
- **Problem.** The app must know where the traveller is from the first visit and use it everywhere, not only after they search or tap.
- **Measured.** Once permission is granted, a location watch starts silently on every launch (`js/main.js:6371` to `6420`). While the permission is unanswered, the app waits for a tap on a "Use my location" control. This is by design, after an earlier "asks me every single time" report. The welcome flow's first step already shows `locationFixCard` (`js/screens/welcome.js:84`), but "Next" and "Skip — just explore" both pass it without asking, and travellers who finished setup earlier are never asked again.
- **Scope.**
  - Make the location request the welcome step's main action, with a one-line reason. "Next" still works.
  - Travellers who were never asked (`prefs.geoAsked` false and permission still "prompt") get one Home card that asks on a tap.
  - After a denial or a dismissal, show one dismissible Home banner. Never raise the browser dialog on load.
  - With a fix, every "where am I" default (the `focusSpot()` consumers: Home, Weather, Nearby, Emergency, Places) uses the nearest place from F1's list instead of the browsed country's default. List the consumers and prove each one.
  - iOS wrapper: check whether `Mekonging Xcode/` declares a location usage description. If it does not, tell the owner; do not edit the wrapper in this slice.
- **Done when.** In a fresh profile, the first open asks once. With a granted, emulated position on Koh Chang (CDP `Browser.grantPermissions` and `Emulation.setGeolocationOverride`), Home and Weather show Koh Chang without any tap. In a denied profile, the banner shows once and no dialog appears on reload. 375 px. All guards pass.

### S1: the style foundation, tokens and machinery (`docs/PROGRAM.md` section 5)
- **Built 2026-10-27** (`mk-v0.653.0`, store version unchanged at 17), [PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139). Items 1 to 10 of 5.3 as tokens and components; no existing screen uses them. What was built, where, and the proof: `docs/PROGRAM.md` 5.5 and `DESIGN_SYSTEM.md` ("S1").
  - **The opt-in mechanism.** The refined `--fs-*` values, the line heights and the reduced-motion rule are declared on `[data-refined]`, so `:root` keeps today's values and nothing moves until R1 to R3 add the attribute to a screen group's root. Item 1's "keep the existing names" and the done criterion "nothing outside the new components moved" cannot both hold with a global change: 241 places read those tokens.
  - **Chart colours.** `tools/style-tiles/derive-viz.py` derives `--viz-1` to `--viz-8` for 16 surfaces into `round2.json`; `port-themes.py` writes them into `css/refined.css`; `check-contrast.py` and `derive-viz.py --check` hold them. Method: the `dataviz` skill, and its own `validate_palette.py` reproduces the checks.
  - **Guards.** `check-font-sizes.py` (a ratchet on literal font sizes: 138 CSS declarations, 74 in JS strings), `check-icons.py`, and the two checks above; all in `scripts/README.md` and `.github/workflows/guards.yml`.
  - **Proof tools** (`tools/style-digest/`): `digest.py` compares two running copies of the app by a hash of every element's computed style and box, per screen and theme; `components.py` mounts and measures the new components on the live app. R1 to R3 reuse `digest.py` with `--allow`.
- **Scope.** As written in `docs/PROGRAM.md` 5.3 and 5.4. Out of scope: applying the tokens to existing screens (R1 to R3), and the tap-target and contrast fixes (Q3 to Q7).
- **Done when.** A computed-style digest shows that nothing outside the new components moved, on 8 screens and 3 themes at 375 px; every guard passes; the register is updated; the PR is open.

### F4: the post-trip recap, with charts
- **Problem.** After a trip, Home should break down everything the traveller logged, with graphs and facts about the trip.
- **Measured.** After a trip, Home shows `returnRecapCard` (`js/main.js`, about line 2860): counts of journal entries, places loved and rated and stops, plus one "Spent ≈" total. There is no breakdown and no chart anywhere in the app's screens.
- **Scope.**
  - A new lazy screen, `js/screens/trip-recap.js` (`#recap`), registered in `js/nav-groups.js` and the router. `returnRecapCard` moves out of `main.js` with it.
  - Home's post-trip block shows a short summary and "See your whole trip".
  - The screen covers what was logged: dates and nights; countries and cities, with nights per country; distance travelled and the route map (reuse the journey map); spending in the home currency by category, by country and by day, through `money()`, with unknown rates flagged; journal entries and photos; places visited, rated and loved, with the top-rated; transport legs by mode where logged. A section with no data is left out.
  - Charts are inline SVG coloured from theme tokens (the `js/market-art.js` pattern), so all 11 skins repaint them. No chart library. Load the `dataviz` skill before the first chart.
- **Done when.** A seeded post-trip persona (mutate the store in memory through `import('/js/state.js')`) shows every section at 375 px and 1280 px, in light, dark and one dark skin, with 0 overflow, 0 console errors and no body control under 44 px. A traveller with nothing logged sees an honest empty state. `check-contrast` passes on the chart colours, and all guards pass.

### F5: the language check, and the four host languages made complete
- **Problem.** The owner saw Thai go wrong in Safari on iPhone (not described) and asked that everything be checked in every language, the host languages first.
- **Measured.** The interface translates finished screens by exact English match (`js/i18n.js`). Each of the 29 dictionaries holds 369 keys (`check-ui-strings`), while the app shows thousands of distinct strings. While online, an optional pass (`autoTranslateTree`, `js/i18n.js:529`, gated by `mtEnabled()`) machine-translates what the dictionary lacks and caches it per language. Talk translates one way only, from the traveller's language into the phrasebook's; the phrasebook's own language is left out of the "translate from" list (`js/screens/phrasebook.js:1137`). This machine has desktop Safari 18.6 but no Xcode app, so no iOS Simulator.
- **Scope.**
  - A repeatable check under `tools/lang-check/` that loads every route in each of the 29 languages and records: visible strings still in English (leaving out place names, data text and the traveller's own content); text cut off or overflowing; missing glyphs (boxes); line breaking in Thai, Lao and Khmer, which have no spaces between words; right-to-left layout for Hebrew, Arabic, Persian and Urdu; and what the online pass changed. One command prints a table per language and route. Numbers come from headless Chrome over CDP; Thai, Lao and Khmer rendering is also checked in desktop Safari (WebKit).
  - Find the owner's Thai problem in that table, reproduce it and fix it.
  - Harvest every interface string the check found. Give each one a key in all 29 files: a value of `null` means "not translated yet, show English". `js/i18n.js` treats `null` as English, and `check-ui-strings` counts the nulls per language while keeping key parity.
  - Fill Thai, Vietnamese, Khmer and Lao completely. The translations are machine-made by the session itself (no new service, key or cost), checked by translating a sample of 50 per language back into English, and recorded in a review register (`scripts/ui-strings-review.json`: language, key, machine-made, date). Strings on the Emergency, first-aid and medical screens are listed first in the register.
  - The language picker marks a language with machine-made entries as "machine-translated, under review".
  - Talk: confirm that translation, speech input and read-aloud work in each host language in Safari, and report any that do not.
  - If the harvest is too large for one session, split F5 by screen group and say where it stopped.
- **Done when.** The check's table shows 0 untranslated interface strings for th, vi, km and lo on every route, and no clipping or missing glyphs in those four. The owner's Thai problem is shown fixed. The owner confirms on their iPhone in Safari, using a short checklist the slice writes. All guards pass.
- **Built** 2026-10-28 (`mk-v0.656.0`), in part. `tools/lang-check/` (one command, a table per language and route; `webkit.swift` runs the same measurements in WebKit). **The owner's Thai problem:** Thai tone marks were cut off by line boxes of 1.1 to 1.22 em that also hide their overflow, found on the tab bar ("สถานที่" read "สถานที": 2.3 px of ink above the box in Chrome, 3.0 px in WebKit) and the top-bar title; Khmer lost ink on 355 of 426 tab labels. One rule in `css/style.css` fixes it (ink lost by more than 0.4 px: th 226, km 398, vi 81, lo 5 before on 73 routes; 0 after on 96). **Harvest:** 405 keys in all 29 files (`null` in the 25 others), th, vi, km and lo filled and registered (1,620 entries in `scripts/ui-strings-review.json`, 200 back-translated: 171 same, 29 close, 0 differing); the picker marks the four. **Not finished:** 631 fixed interface strings are still English in each of the four (538 on screens the harvest did not reach), plus composed strings and data text; the numbers and the next slice (F5b) are in `docs/PROGRAM.md` 4.1 and 4.4.
- **Finished** 2026-10-29 by F5b (`mk-v0.657.0`, [PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145)): the check shows 0 untranslated fixed interface strings for th, vi, km and lo on all 96 routes, with no clipping, overflow or missing glyphs. The Emergency and first-aid data text is in lazy `js/data/safety-text.<code>.js` modules; a late-paint pass (`watchLateText`) translates screens that repaint after an async load; the 29-file key rule is relaxed to the four (decision 30). Composed strings and data text remain, as F5c (`docs/PROGRAM.md` 4.1).

### L1: Talk face to face, on one phone
- **Problem.** Two people who share no language talk, and the app translates both sides.
- **Measured.** `translate(text, target, source)` (`js/translate.js:291`) takes any pair. Talk already has speech input (stopped by the traveller with a Done button) and read-aloud (`js/tts.js`); each language in `LANGS` carries a `speech` locale.
- **Scope.**
  - A conversation mode in Talk. The screen splits in two, with the far half turned 180° for the person opposite. Each half has its own language (by default the traveller's and the phrasebook's), a microphone and a text box.
  - Each turn is translated into the other half's language, shown there and, if chosen, read aloud. Every sound registers with `js/audio-control.js`.
  - A running transcript is kept on the phone only and can be cleared.
  - It needs a connection. Offline, it says so and offers the phrasebook. Where a phone has no speech recognition for a language, that half offers typing only, and says so.
- **Done when.** In Safari, and on the owner's iPhone, a four-turn exchange between English and Thai works both ways by typing, and by voice where the phone supports it. Both halves are readable at 375 px in portrait. 0 console errors. All guards pass.

### L2: the other 25 interface languages filled
- **Scope.** Drive F5's `null` entries to 0 for the other 25 languages, in the same way: machine-made, recorded in the review register, with the safety screens first. Check right-to-left layout for Hebrew, Arabic, Persian and Urdu. Split by language group if one session cannot finish.
- **Done when.** The F5 check shows 0 untranslated interface strings in every language on every route, with no clipping, overflow or missing glyphs. All guards pass.

### L3: local languages with 1 million or more speakers, and the language map
- **Scope.**
  - A cited list of the local languages with 1 million or more speakers in the four countries, each with its speaker count and the provinces where it is spoken, each backed by a real source URL. Better to leave a language out than cite an aggregator's unsourced number. Candidates to check: Isan, Northern Thai, Southern Thai, Pattani Malay, Northern Khmer, Teochew, Tay, Tai Dam and Tai Don, Muong, Nung and Hmong. Khmer Krom is Khmer and is already covered.
  - The language map, as the last card on Talk: an inline SVG of the four countries by province, built from Natural Earth admin-1 boundaries (public domain; the app's country outlines in `js/data/geo.js` are already Natural Earth-derived). Each province is coloured by its main local language, and smaller language areas show as dots or hatching. It has a legend, and tapping a language opens its phrasebook where one exists. It works offline.
  - Colours come from theme tokens so all 11 skins repaint the map, and they must pass `check-contrast`. Load the `dataviz` skill first: a dozen categorical colours need care, and grouping by language family is one way to manage that.
- **Done when.** The map renders at 375 px in light, dark and one dark skin. Every colour is labelled, and every language and region is cited. 0 console errors. All guards pass.

### L4: phrasebooks for the local languages
- **Scope.** Every L3 language without a phrasebook gets one of the essentials, in the existing format (`js/data/phrasebook.<code>.js`, registered in `js/data/phrasebooks.js`); Thai, Vietnamese, Khmer, Lao, Chinese, Malay, Burmese and Hmong already have one. Each phrase is in the language's script with a romanisation, and is cited. Translation services mostly do not cover these languages, so entries come from cited, published phrase lists, not machine translation. A language with no citable source stays out, and the handoff says which. Audio only where a voice exists. Each phrasebook is marked unreviewed.
- **Done when.** Each new phrasebook opens from Talk and from the map, renders at 375 px with every entry cited, and all guards pass.

### L5: Talk with someone far away, by invite (after M5)
- **Problem.** Two people in different countries converse, each in their own language.
- **Scope.**
  - One person starts a conversation in Talk and shares a link or a code. The other opens it and signs in with a Market account. There is no way to find or message a stranger.
  - Each message is stored once, in its sender's language, and translated on each reader's phone into theirs. There is no server-side translation and no new paid service. Voice input and read-aloud work as in L1.
  - Block and report come from M5. Conversations are deleted after a period the owner sets at the start of L5 (recommended: 30 days).
  - Reuse M5's live client and decide at M5's end whether these are M5 threads of a new kind or a table of their own. Read the Supabase Free Realtime limits at the start.
  - Talk's translation depends on Google's free web endpoint, which can rate-limit or change without notice. Say so in the PR, and show a plain failure state rather than a wrong message.
  - Legal, for Omer Hanegbi or Omri Siri (open decision 8): the privacy policy must say that the server stores conversation text.
- **Done when.** The owner on an iPhone and a tester elsewhere exchange messages in two languages, each reading their own, delivered in under 5 seconds without a reload. Block stops both sides. The RLS test shows that a non-participant reads nothing. All guards pass.

## Data inventory (measured 2026-10-12 at fc4c9dc)
Method: jsc over `loadAllCountries()`, plus `check-place-fields.py` and `check-sources.py`.

| Gap | th | vi | kh | la | Total |
|---|---|---|---|---|---|
| Places | 293 | 241 | 164 | 185 | 883 |
| No photo (`js/data/photos.js`) | 247 | 202 | 131 | 163 | 743 |
| No `localName` | 164 | 144 | 108 | 156 | 572 |
| No `whyItFits` | 35 | 0 | 0 | 0 | 35 |
| No `tips` | 36 | 2 | 1 | 0 | 39 |
| No `mapQuery` | 36 | 2 | 1 | 0 | 39 |

These are counted for all countries together only:

| Field | Missing |
|---|---|
| `access` | 650 |
| `afterDark` | 675 |
| `kidFriendly` | 403 |
| `recognition` | 426 |
| `rating` | 181 |

Other gaps:
- **Stays:** 156 stay records, none with `externalPrices`. Not planned, because those prices go stale.
- **Citations:** 247 place records (28.0%) are homepage-only. 37 of 135 routes have no `sources`.
- **Dishes:** all 135 are complete in every field.

## Data slices (owner order, 2026-10-12)

### D1 — Place text and the validator in CI
- **Status:** done in PR #103 (`mk-v0.630.0`). The 8 place "inversions" were missing `low`/`high`, and the 2 route ones were "from" fares with `high: null`; see `scripts/README.md`.
- The 35 records with no `whyItFits` are Thai stay-area cards, such as `th-chiang-mai-old-city-hostels` and `th-bangkok-khaosan-hostels`. Each one also lacks `tips` and `mapQuery`.
- Four beaches lack only `tips`: `th-ext-chaweng-beach`, `vi-ext-mui-ne-beach`, `vi-ext-vung-tau-back-beach` and `kh-ext-kep-beach`.
- Fix the other 11 validator findings:
  - 8 place price ranges with the low above the high.
  - 2 route prices with the same fault: `th-bangkok-kohsamui` and `th-bangkok-kohphangan`.
  - The dish category `veg`.
- Then add `validate.mjs` to `.github/workflows/guards.yml`. CI has Node.
- Done when `validate.mjs` reports 0 errors in CI and the 39 places show their text at 375 px.

### D2 — City gaps
- **Status:** done in PR #106 (`mk-v0.631.0`): 18 anchors and 24 history entries. Duy Phu was a name mismatch, and Ponhea Krek was a mislabelled duplicate of Wat Nokor Bachey, merged via `place-merges.js`.
- **Weather spots for 19 cities.** A city with places but no spot gets another city's places ranked as Nearby. Spots go in `WEATHER_SPOTS`, `js/weather.js`:
  - Thailand: Kamphaeng Phet, Nakhon Pathom, Nakhon Si Thammarat, Lampang, Phitsanulok, Songkhla.
  - Vietnam: Tay Ninh, Cai Be, Vinh Long, Ben Tre, Dien Bien Phu, Moc Chau, Ca Mau.
  - Cambodia: Banteay Chhmar, Pursat, Pailin, Ba Phnom, Ponhea Krek.
  - Laos: Xaysetha.
- **City history entries for 26 cities.** These go in `js/data/history.cities.<cc>.js`, which `check-month-arrays.py` parses, so keep its layout. The 26 are all 19 cities above, plus:
  - Koh Samet, Koh Kret, Bang Krachao, Koh Si Chang, Koh Larn, Duy Phu and Ly Son.
  - Check Duy Phu first: history files it as "Duy Phu (My Son)", so it may be a name mismatch rather than a missing entry.
- Done when every city that has places has a weather spot and a history entry.

### Q1 — Rendered-screen audit at 375 px
- Queued from the earlier plan; the owner's data order comes first.
- Load every route in `js/nav-groups.js` in headless Chrome. Use `launch` and `CDP` from `tools/style-tiles/capture.py`, in Mekong Retro light and dark.
- For each route, record: horizontal overflow, controls under 44 × 44 px, console errors, contrast failures, and controls covered by overlays. The journey map's credits panel is a known case of the last one.
- Write the results to `docs/AUDIT_375.md`.
- **Status (2026-10-19):** done, documents only: `docs/AUDIT_375.md` covers 77 routes in Mekong Retro light and dark (154 cold loads). No horizontal overflow and no failed request. The findings are tap targets (66 routes with body controls under 44 px; topbar icons 30 to 36 px wide), contrast (27 routes in light, 6 in dark) and the map credits panel (open as loaded; covers 16.6% of the journey map and its first pin). Its last section proposes the follow-up slices Q2 (commit the audit driver, first) to Q8.

### D3 — Place photos (one session per country: th 247, vi 202, kh 131, la 163)
- **Status, Thailand:** PR #109 (`mk-v0.632.0`): 47 photos, so Thailand has 93 of 293. Of the 247 gaps, 186 have no article of their own and 14 have an unusable lead image. Every decision is in `scripts/place-photo-articles.json`.
- **Status, Vietnam:** PR #110 (`mk-v0.634.0`): 37 photos, so Vietnam has 76 of 241. Of the 202 gaps, 159 have no article of their own and 6 have an unusable lead image. Every decision is in `scripts/place-photo-articles.json`.
- **Status, Cambodia:** PR #113 (`mk-v0.637.0`): 21 photos, so Cambodia has 54 of 163. The report counted 130 gaps, not 131. Of the 130, 101 have no article of their own and 8 have an unusable or unrepresentative lead image (five with no lead image, one site map, two that do not show the place). Every decision is in `scripts/place-photo-articles.json`.
- **Status, Laos:** PR #115 (`mk-v0.638.0`): 17 photos, so Laos has 39 of 185. Of the 146 gaps, 136 have no article of their own and 10 have an unusable or unrepresentative lead image (seven with no lead image, three looked at and refused: a captive-looking gibbon, a cave interior for a trek card, and a 250 px image). Every decision is in `scripts/place-photo-articles.json`.
- **D3 is closed (2026-10-17):** all four countries are reviewed. 262 of 882 places have a photo (29.7%). Each of the 620 gaps is filed under `no_article` (582) or `rejected` (38), so no place is left unreviewed. More photos need a different source, which is an owner decision (see `docs/HANDOFF.md`).
- **Expect about 1 in 5:** most gaps are stay clusters, practical cards and food runs with no article. The ~45 MB estimate below assumed every gap filled; Thailand added 3.0 MB and Vietnam 2.3 MB.
- **Run order:** `fetch-place-photos.py --country <cc>` with `--report`, `--suggest`, a review of the suggestions, `--fetch`, `--sheet`, then `--install` (see `scripts/README.md`).
- **Licences:** openly licensed only (public domain, CC0, CC BY, CC BY-SA, GFDL). Record the credit verbatim.
- **Source:** the Wikipedia lead image of the place's own article, not a keyword search, because keyword search picks the wrong subject. Look at every image before keeping it.
- **Tooling:** `scripts/fetch-identify-photos.py` covers the identify guide, not places. Extend it or add a sibling script, and commit it.
- **Size:** today's 140 place photos weigh 25 MB, about 180 KB each. At that size the 743 missing photos would add about 133 MB. Resize to about 800 px wide and about 60 KB each, which is about 45 MB in total.
- **Caching:** photos are cached at runtime and never precached.
- Done when a country's coverage is reported with its new count and 10 sample cards are checked by eye at 375 px.

### D4 — Local-script names (th 164, vi 144, kh 108, la 156)
- **Status (2026-10-17):** PR #116 (`mk-v0.639.0`): 59 names from Wikipedia and Wikidata, so 370 of 882 places have a `localName` (was 311). 512 remain (th 153, vi 125, kh 92, la 142). Each name and its source is in `scripts/local-names.json`, with 37 refused candidates and their reasons. No OpenStreetMap lane: Overpass is unreachable or failing from the build machine and Nominatim found a name for 1 of 12 places (see `docs/HANDOFF.md`).
- Take each name from the matching local-language Wikipedia title or the OpenStreetMap `name` tag, in native script.
- Leave the field unset when neither source has the place.

### D5 — Citations (all four country sessions done 2026-10-19; one session per country: places th 64, vi 78, kh 59, la 46; routes th 13, vi 14, kh 4, la 6)
- **Status, Thailand:** PR #117 (`mk-v0.640.0`). 63 places cite a page about the place, and Nan Walking Street is filed `open`. All 13 routes cite their 12Go route page. Homepage-only records are 184 (was 247) and unsourced routes 24 (was 37); the baselines match. The coordinates of Mae Surin Waterfall, Huai Nam Dang viewpoint and both Pang Ung cards are fixed. Every decision is in `scripts/place-citations.json`.
- **Status, Vietnam:** PR #118 (`mk-v0.641.0`). 71 places cite a page about the place: 50 vietnam.travel pages, 5 of the cited organisation's own pages, 10 Wikipedia articles (2 Vietnamese) and 6 Wikivoyage sections. 7 are filed `open`. The 5 URL-less records now cite real pages. 6 train routes cite Vietnam Railways' Train routes page (plus 12Go), Hanoi to Ha Giang cites Cat Ba Express, and 7 bus and flight routes cite 12Go. Homepage-only records are 113 and unsourced routes 10; the baselines match.
- **Status, Cambodia:** PR #121 (`mk-v0.642.0`). 54 places cite a page about the place: 29 Tourism Cambodia pages, the National Museum's own visitor page, 9 Wikipedia articles and 15 Wikivoyage sections (Kampi dolphins also has a Tourism Cambodia page). 5 are filed `open`. The 2 URL-less records now cite real pages, 4 routes have sources (Giant Ibis for Phnom Penh to Kep, 12Go and Wikivoyage for the other three), and the Wat Nokor Bachey blurb was corrected from the 11th century to the last years of Jayavarman VII's reign (about 1200). Homepage-only records are 59 and unsourced routes 6; the baselines match.
- **Status, Laos:** PR #122 (`mk-v0.643.0`). 38 places cite a page about the place: 16 swap a homepage for the cited organisation's own page (10 Tourism Laos province pages, 2 Discover Laos Today, the Gibbon Experience, TAEC, UNESCO, the Plain of Jars Wikivoyage section), 6 more add Wikipedia (2 of them Lao articles), and 15 add a Wikivoyage section. 8 are filed `open`. The 3 URL-less records cite Travelfish and Wikivoyage pages, the 6 unsourced routes cite 12Go and Wikivoyage (no operator page was reachable), and two coordinates were fixed from OpenStreetMap (Nong Fa Lake moved 28 km; That Sikhottabong's pin was in Thailand). Homepage-only records are 21 (th 1, vi 7, kh 5, la 8) and unsourced routes 0; the baselines match. **The four D5 country sessions are done.** The only leftover is the 2 Thai records whose source has no URL (see below).
- **Run order:** `fetch-place-citations.py --country <cc>` with `--report --list`, then `--suggest`. Open each page and record the decision. Then run `--install`, lower the baselines and bump the version (see `scripts/README.md`).
- **Sources (owner, 2026-10-18):**
  - Prefer the cited organisation's own page about the place (a swap). Else use the place's own Wikipedia article. Else, for stay and food clusters, use a tourism-board page or a Wikivoyage section.
  - Leftover bare homepages stay in the list.
  - Routes cite operator pages first. Use a booking platform's route page (12Go, Baolau) only where no operator page is reachable.
- **Hosts:** TAT, the MICHELIN Guide, 12Go, UNESCO and Travelfish block curl, so read them in the in-app browser. FUTA refuses automated browsers. Nok Air's route pages return a Cloudflare error, and Sombat Tour's schedule pages render no timetable. visitcambodia.com and angkorenterprise.gov.kh answer Cloudflare 403 to curl and to the in-app browser. tourismcambodia.com has no sitemap: crawl `/travelguides/provinces/<province>/what-to-see.htm` (and `where-to-stay`, `where-to-eat`), which link one page per attraction.
- **Also in the country slices:**
  - The 7 records whose source has no URL (th 2, kh 2, la 3). Vietnam's 5, Cambodia's 2 and Laos's 3 are done; Thailand's 2 remain (listed in `docs/HANDOFF.md`).
  - The Wat Nokor Bachey date (kh): done, corrected in D5 Cambodia.
  - The That Sikhottabong and Nong Fa Lake coordinates (la): done, fixed in D5 Laos.

### D6 — Access, kids, after dark
- Use genuine sources only. The `afterDark` contract in `js/data/places.th.js` says to omit a field rather than infer it.
- Expect low yield. This has the lowest value per credit, so it runs last.

## Bangkok build-out (owner, 2026-10-19)
Runs after D5 Cambodia and D5 Laos and before D6. Releasing slices stack, so one B slice at a time, each from the merged tip.

### Where Bangkok stands (measured 2026-10-19 at 5f5cb6c, parsing `places.th.js` and `places.th.ext.js`)
- 40 Bangkok place records of 293 for Thailand: 12 food, 9 stay, 7 culture, 3 nightlife, 3 transport, 2 market, 1 nature and 3 practical (money, health, sim).
- Of the 40: photo 18, `localName` 17, `access` 15, `afterDark` 16, `kidFriendly` 36, `recognition` 23, `rating` 31. Every record has `whyItFits`, `tips`, `mapQuery`, `coords`, `hours`, `priceRange` and `sources`.
- Day-trip cities are separate and already have records: Ayutthaya 9, Kanchanaburi 8, Koh Kret 2, Bang Krachao 2, Amphawa 1, Samut Songkhram 1, Nakhon Pathom 1. This build-out is Bangkok itself.

### Owner rulings, 2026-10-19
- **Size:** first phase about 150 Bangkok records (about 110 new). Then reassess for 300 or more.
- **Shape:** one district per session, each releasing on its own. B1 is Old City and Rattanakosin. The later order is open; the proposal is B2 Chinatown and Yaowarat, B3 Siam, Pratunam and Ratchathewi, B4 Sukhumvit, B5 Silom, Sathorn and Bang Rak, B6 Riverside and Thonburi, B7 north (Ari, Chatuchak, Ladprao) and the outskirts, then B8 a gap sweep and the 300 reassessment.
- **Scope per district, every category:** temples, palaces, museums, parks, markets, viewpoints, food, stays, bars and rooftops, transport, plus:
  - shopping malls and department stores;
  - adult nightlife districts (Patpong, Nana, Soi Cowboy) as factual area entries only: location, hours and the scam warnings that have a source. No safety verdicts; the `afterDark` contract applies;
  - spas and Thai massage;
  - classes, tours and activities (operator pages, price tier only, no booking);
  - health (pharmacies, clinics, international hospitals), errands (SIM, money exchange, ATMs worth knowing, laundry, post), daily shopping (supermarkets, convenience chains, vegan and halal shops, electronics, tailors, bookshops), and visa and living (immigration, embassies, visa services, coworking).
- **Held out: dispensaries.** Cannabis rules in Thailand have changed repeatedly and the iOS wrapper (`Mekonging Xcode`) adds App Store exposure. Do not add a dispensary record until Omer Hanegbi or Omri Siri has answered; if cleared it becomes a later slice. Owner action: put that question to them.
- **Named venues:** named restaurants and hotels are allowed, alongside areas and markets.
  - Prefer the venue's own page or its Wikipedia article.
  - Fallback is a guide-site write-up, and then two independent pages are required.
  - Show a price tier and a verified date, never a quoted rate. No `externalPrices` (they go stale).
- **Complete at creation:** each new record ships with its Thai-script `localName`, page-level `sources`, `hours`, a price tier, `coords` and `tips`. A photo only where the place has its own Wikipedia article (the D3 rule). Checked at 375 px before release.
- **D5 rulings, same day:** a Vietnamese, Khmer or Lao Wikipedia article is an acceptable citation where the place has no English article. A URL-less source may be replaced by another checkable page. The 7 Vietnamese `open` records stay homepage-only. Older "native · romanisation" `localName` values stay. A Meetups-free Market is acceptable until M4.

### How a B slice runs
- New records go in a new file per district, `js/data/places.th.bkk.<district>.js`, never into the existing files (lazy modules take new exports in a new file). B1 adds the loader line next to `PLACES_TH` and `PLACES_TH_EXT` in `js/data/regions.js`; later slices only add a file and a line. Ids are `th-bkk-<slug>`.
- Run `check-place-dupes` first: Bangkok already has 40 records, and a name collision silently deletes travellers' saved data.
- A slice that adds photos also runs `build-pack-sizes.py --write`. The offline pack grows with every district, so report the pack size before and after.
- Done when: Bangkok records for the district are counted by category before and after; every new record passes `check-place-fields.py --assert`; 10 sample cards show correctly at 375 px in headless Chrome over CDP; all guards and `jsc -m scripts/validate-jsc.mjs` pass; the PR is open into `feat/scaffold-bangkok-slice`.

## City depth (owner request, 2026-10-19)
"Make the site rich and informative, with a lot for travellers": after Bangkok's first phase, the B recipe (above) is applied to the next hubs, one city per session, each releasing on its own.
- **Order** (confirmed by the owner, 2026-10-19): C1 Chiang Mai (33 records), C2 Hanoi (22), C3 Ho Chi Minh City (11), C4 Siem Reap (23), C5 Phnom Penh (16), C6 Luang Prabang (23), C7 Da Nang and Hoi An (18 and 17), C8 Vientiane (21), then Phuket and Krabi, then a gap sweep.
- **Same rules as Bangkok:** every category in the Bangkok scope, the practical ones included (health, errands, daily shopping, visa and living); complete at creation; page-level sources; photos only from the place's own Wikipedia article; no dispensaries; adult nightlife as factual area entries only.
- **Files:** `js/data/places.<cc>.<city>.js` per city, with one loader line in `js/data/regions.js`; ids `<cc>-<city>-<slug>`. A city with existing records keeps them where they are; `check-place-dupes` runs first.

## Traveller exchange (marketplace and meetups)
Today's board (`#exchange`, `#swap`, `#market`, `#circle`) has no backend. A post stays on the phone until its link is shared, so two strangers cannot find each other.

### Decided by the owner, 2026-10-12
- **Backend:** Supabase Free, with Resend Free as the custom SMTP sender. Cost $0.
  - Cloudflare Workers + D1 was rejected because sign-in, sessions and access rules would be written by hand.
  - The mekonging.com DNS is on Cloudflare; Resend's records go there.
- **Identity:** email magic-link sign-in; a display name is the only profile field required.
- **First release:**
  - Item hand-off by city and date (give, sell, trade or request), with match alerts.
  - Solo-traveller meetups.
  - Room and ride share.
  - Cash swap, after the legal check below.
- **Moderation:** both mechanisms, as follows.
  - A listing is hidden automatically after a set number of reports, and a word filter runs on every post.
  - Reports also go to a review queue that only the owner can see.

### Fixed by policy (not open for decision)
- **No drug listings of any kind, cannabis included.**
  - Thailand has required a medical prescription for cannabis since mid-2025. It is illegal in Vietnam, Cambodia and Laos.
  - The listing types and the word filter enforce this.
- **Privacy:**
  - Listings show a city and a date window only, never an exact location.
  - Contact details are never shown; people message inside the app.
  - Block and report are on every listing and thread.
  - Listings expire when their date window ends.
- **Security:**
  - Only the publishable key ships in the client.
  - Row-level security is on for every table.
  - The service-role key and the Resend API key never enter the repo, the client or a chat.
- **Offline-first stays:**
  - The rest of the app works offline. The shared board needs internet and says so.
  - Any client library is self-hosted under `lib/`, or replaced with plain `fetch`.
- **Fallback:** the current link-based board remains as the offline fallback.

### Free-tier limits (checked 2026-10-12)
Sources: supabase.com/pricing, supabase.com/docs/guides/auth/auth-smtp, resend.com/pricing, firebase.google.com/docs/auth/limits.
- **Supabase Free:**
  - 500 MB database, 50,000 monthly active users, 5 GB egress.
  - Realtime: 200 concurrent connections and 2 million messages a month.
  - 500,000 Edge Function calls.
  - The project pauses after one week without activity. A weekly GitHub Action keeps it awake.
- **Supabase's built-in email:** sends only to team-member addresses, at about 2 an hour. That is why Resend is needed.
- **Resend Free:** 100 emails a day, 3,000 a month, 3 domains. This caps new sign-ins at 100 a day; existing sessions persist.
- **Firebase Spark:** rejected, because email-link sign-in is limited to 5 emails a day without billing.

### Owner actions before M3 (M1 and M2 need none)
1. Create the Supabase project and the Resend account, both on free plans. Keep every key out of the repo and out of chat.
2. Verify mekonging.com in Resend by adding its DNS records in Cloudflare.
3. Ask Omer Hanegbi or Omri Siri about cash swap, private motorbike sales, and liability for meetups and shared rooms. They also review the terms of use and the privacy policy.
4. The full list, slice by slice, is in `docs/EXCHANGE.md` §15. The questions for legal are in §14.

### Owner rulings, 2026-10-12 (M0 session)
- Reading the shared board requires sign-in. *Superseded on 2026-10-19: visitors may browse without an account (`docs/EXCHANGE.md` §16).*
- Listing cards are anonymous. A display name appears only inside a conversation.
- The exchange becomes a sixth bottom tab, "Market".
- The whole exchange is 18+.
- The Supabase publishable key is committed in `js/market-config.js` (`docs/EXCHANGE.md` §16).
- M3 tightens the CSP before sign-in tokens exist (`docs/EXCHANGE.md` §16). Done in M3a (PR #124).

### M0 — Exchange planning session (documents only) — done 2026-10-12, `docs/EXCHANGE.md`
Write `docs/EXCHANGE.md` with:
- Tables and row-level security policies.
- The sign-in flow.
- The matching rule: same city, with overlapping or adjacent date windows.
- Alert delivery: realtime while the app is open, and Web Push when it is closed.
- Moderation flows and the word list.
- Per-user rate limits and data retention.
- How the screens fit `js/nav-groups.js`, and how existing on-device listings move over.
- A threat model covering spam, scams, stalking and harassment.
- M1…Mn slices, each one PR with proof at 375 px.
