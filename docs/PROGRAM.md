# Program — open work, the style refinement and the feature backlog (session 0, 2026-10-25)

Written by session 0 of `BEST_TOOL_PROMPT.md`, against `origin/feat/scaffold-bangkok-slice` at e98f4a7 (`mk-v0.649.0`).
Between 1e98e6f (PR #133) and e98f4a7 only `BEST_TOOL_PROMPT.md` and `CLAUDE.md` changed, so the shipped files are the
ones #133 measured. Every slice that closes an item below updates this file in its own PR.
F2 (2026-10-26, `mk-v0.650.0`) updated sections 2 to 4: decision 23 is done, `check-offline-boot` runs in CI, and 4.4 gained
two defects found on the way (the automatic trail's far-off name, and the offline map outside the region).
S1 (2026-10-27, `mk-v0.653.0`) built section 5.3 as tokens and components (5.5 records what was built and measured), recorded
decisions 25, 28 and 29, and added slices F6 and F7 to 4.1.
F7a (2026-10-27, `mk-v0.654.0`, [PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140)) built the Emergency screen for a fix outside the four countries; the owner's answers to decision 28 are in 4.3 and the rest of F7 is F7b in 4.1.

Method for the numbers: jsc over the place modules (`~/Library/Caches/mk-program/measure.mjs` and `cats.mjs`), the
repo's own guards, `git` and `gh`, and `grep` with the `file:line` given. Rendered-screen values (layout, tap
targets, contrast) were not re-measured in this documents-only session; each says where and when it was last measured.

## 1. Owner answers (2026-10-25, one form)

| Question | Answer | What it means |
|---|---|---|
| Where the style work goes | Split it (recommended) | Q2 and the style gate S0 run alongside the queue (tools and documents only). The style foundation S1 goes just before F4. Q3 to Q7 go after L4 and before M4b-2. |
| Where the feature backlog goes | Trust first (recommended) | T1 (fact freshness) and T2 (border status) run right after Q7, before M4b-2. T3 to T15 go after C8 unless the owner moves one up. |
| Decisions 14, 19 and 23 | All three approved | 14: coordinates-check slices G1 to G4, Laos first. 19: install `pglast`. 23: the two `PRECACHE` lines and `check-offline-boot` in CI ride along with F2. |
| Decisions 10, 13 and 24 | As recommended, but widen Cambodia | 10: deferred until Q3 to Q5 are done. 13: yes, the Tourism Laos relabel rides in D5 tidy. 24: **yes**, every Cambodian village, in a small slice of its own (F1b). |

Placements the form did not ask, chosen by session 0 (the owner can move any of them):
- **F1b** (every Cambodian village) runs right after F2, so F3's "nearest place" already sees the widened list.
- **G1 to G4** (coordinates checks) run after D5 tidy and before R1: fix the existing pins before adding records. Decision 22
  (the Trat anchor) rides in G1, because it changes which records Ko Mak's "Nearby" shows.
- **`pglast`** is installed at the start of M4c, the next slice that writes SQL, and wired into `check-market-sql.py`.
- **R1 to R3** (the style roll-out by screen group) run after G4 and before B1. New screens built after S1 (F4, L3, M4b-2
  onward) use S1's machinery from the start; R1 to R3 retrofit the older screens.

## 2. The merged release order

Releasing slices stack, one at a time, each from the merged tip. The owner's queue is unchanged except where the form said.

1. **F2**, your journey on a world map, every stop editable (with decision 23). **Built**, [PR #136](https://github.com/SamuelLClemens/Mekonging/pull/136), `mk-v0.650.0`.
2. **F1b**, every village in Cambodia (decision 24). **Built**, [PR #137](https://github.com/SamuelLClemens/Mekonging/pull/137), `mk-v0.651.0`.
3. **F3**, location from the first open. **Built**, [PR #138](https://github.com/SamuelLClemens/Mekonging/pull/138), `mk-v0.652.0`.
4. **S1**, the style foundation: tokens and machinery (section 5). **Built**, [PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139), `mk-v0.653.0`.
5. **F7a**, Emergency outside the four countries (decision 28). The owner placed it before F4 (2026-10-27). **Built**, [PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140), `mk-v0.654.0`.
6. **F4**, the post-trip recap with charts (uses S1's chart palette).
7. **F5**, then **L1**, **L2**, **L3** (uses S1's chart palette), **L4**.
8. **Q3**, **Q4**, **Q5**, **Q6**, **Q7**, the sound base (section 5). Decision 10 is asked again after Q5.
9. **T1**, fact freshness, then **T2**, border status (section 6).
10. **M4b-2**, then **M4c** (installs `pglast`), then **M5**.
11. **L5**, Talk by invite.
12. **D5 tidy** (with decision 13), then **G1** to **G4**, the coordinates checks.
13. **R1**, **R2**, **R3**, the style roll-out.
14. **B1** to **B8**, then **C1** to **C8**, then Phuket and Krabi and a gap sweep.
15. **T3** to **T15** in rank order, unless the owner moves one up.
16. Later: **D6**, and the Market's **M6** to **M10** (M9 waits on legal for the terms and privacy policy; M10 on legal for cash swap).

Alongside any slice (no shipped file changes, no version bump): **Q2** (the audit driver), **S0** (the style gate
gallery and its form), **Q8** (the wider audit). T4 and T7 also change no shipped file; by the owner's answer they wait
until after C8, but either could run alongside if the owner says so.

## 3. Where the project stands (re-measured 2026-10-25)

| Area | Measured | Change since the prompt's table |
|---|---|---|
| Release | `mk-v0.653.0` (`js/main.js:823`, `sw.js:55`) on the S1 branch; `mk-v0.652.0` on `origin/feat/scaffold-bangkok-slice` until [PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139) merges. | S1 built; F2, F1b and F3 merged. |
| Content | 882 curated places; 262 with a photo (29.7%); 26,195 list places (th 9,092, vi 1,626, kh 2,192, la 13,285); 135 routes, 0 unsourced; 21 homepage-only citations. | None. |
| Code shape | `js/main.js` 7,601 lines (ceiling ~1,500, no guard); 44 modules in `js/screens/`. | None. |
| Market | Fixture-proven only; production answers `market_closed`; no real listing. | None. |
| Style | Mekong Retro is the default of 11 skins (`js/theme.js:14`). Q1's faults are unfixed. S1's tokens and components exist in `css/refined.css`, `icons/ui.svg`, `js/icons.js`, `js/place-art.js` and `js/place-card.js`, and no existing screen uses them (section 5.5). | S1 built the foundation. |
| Guards | All CI guards pass, place-fields, port-themes and cache-version too; `jsc -m scripts/validate-jsc.mjs` passes 19,297 of 19,297 (measured at F3). The list gained `check-font-sizes`, `check-icons` and `derive-viz.py --check` in S1. | Three guards added. |

## 4. The unresolved register

Every item from the prompt's section 4, re-measured, with an owner: a slice id or an owner action. Nothing was
dropped silently: dropped items are listed in 4.7 with their evidence, and items found in this session are marked **new**.

### 4.1 Planned slices not yet started

| Slice | What | Placement |
|---|---|---|
| F2 | Journey on a world map, every stop editable | **built** 2026-10-26, [PR #136](https://github.com/SamuelLClemens/Mekonging/pull/136) |
| F1b | Every Cambodian village in the place list (12,128 places, 212.9 KB gzip) | **built** 2026-10-26, [PR #137](https://github.com/SamuelLClemens/Mekonging/pull/137) |
| F3 | Location from the first open | **built** 2026-10-27, [PR #138](https://github.com/SamuelLClemens/Mekonging/pull/138) |
| F4 | Post-trip recap with charts | after S1 |
| F5 | Language check; Thai, Vietnamese, Khmer and Lao complete | after F4 |
| L1 to L4 | Talk face to face; 25 interface languages; local languages and the map; their phrasebooks | after F5 |
| L5 | Talk by invite | after M5 |
| M4b-2, M4c, M5 | Post forms and My listings; listing photos; messages, block and alerts | after T2 |
| M6 to M10 | Matching; review queue and retention; Web Push; move on-device posts and launch; cash swap | later; M9 and M10 gated on legal |
| D5 tidy | Relabels and the Long Beach question | after L5 |
| G1 to G4 | Coordinates checks, one country per session: G1 Laos's remote sites plus the Trat anchor, G2 Cambodia, G3 Vietnam, G4 Thailand | after D5 tidy, owner 2026-10-25 (decision 14) |
| B1 to B8 | Bangkok, about 150 records in phase one | after R3 |
| C1 to C8, then Phuket and Krabi and a gap sweep | City depth | after B8 |
| D6 | Access, kids, after dark | last |
| Q2 | Commit the audit driver under `tools/audit-375/` | alongside |
| Q3 to Q7 | Disclosure targets; topbar and form fields; buttons, chips, toggles, links and map controls; contrast; map credits and the `getSource` race | after L4 |
| Q8 | Widen the audit (populated states, four countries, detail screens) | alongside |
| S0, S1, R1 to R3 | The style gate, foundation and roll-out (section 5) | S0 alongside; **S1 built** 2026-10-27, [PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139) (5.5); R after G4 |
| F6 | **New (decision 29, owner 2026-10-27):** a place picked by hand holds over a live fix. The ruling is "hold the pick"; how long it holds (a time, until the traveller moves a distance, until they ask) is not ruled, and the slice's first step is to ask | unplaced: the owner places it. It sits beside F1 and F3, whose pickers and fix it changes |
| F7a | **Built 2026-10-27**, [PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140), `mk-v0.654.0` (decision 28): Emergency and the hospital screen stop naming a region country for a fix outside it. `countryOfFix` returns null past `OUTSIDE_KM`; `js/screens/emergency-outside.js` shows the coordinates, the distance to the nearest city, 112 with an honest note and a hospital map search; a `far` card adds 112 for fixes more than 60 km from every city with no outline within 10 km | placed before F4 by the owner |
| F7b | **New (decision 28, owner 2026-10-27):** the national emergency numbers for the rest of the world, from a sourced table (every entry cited, a gap left open rather than an unsourced number), and the world outline that finds the country of a fix outside the four. The outline is a download (Natural Earth is the candidate) and needs the owner's yes with file name, source and size first; decision 26's measurement covers the same file. Roughly 200 countries is more than one session: split by region if needed | unplaced: the owner places it. Recommended right after F5, with decision 26's measurement run beforehand |
| T1 to T15 | The feature backlog (section 6) | T1 and T2 after Q7; the rest after C8 |
| Routing engine | Multi-country offline routing: wanted, unscoped | the design pass is T7 |

### 4.2 Owner actions pending

| Action | Gates | Status 2026-10-25 |
|---|---|---|
| Sign in on the iPhone Home Screen app by code; then the owner's user id goes into `private.admins` and `private.testers` | M4b-2's live check | open (`docs/HANDOFF.md`, M3b checks) |
| Sign in by link in Safari and delete a test account there | M4b-2's live check | open |
| From the first real email: do `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has | M4b-2 | open |
| A second tester for the Market's live checks (`docs/EXCHANGE.md` §16) | M4b-2, M4c, M5, L5 | open |
| Legal, for Omer Hanegbi or Omri Siri (decision 8): `docs/EXCHANGE.md` §14, the terms of use and privacy policy (listings are public; L5 stores conversation text), the dispensary question | M9 (terms, privacy), M10 (cash swap), any dispensary record | open |
| M7: GitHub secret-scanning push protection; the publishable key as a repository variable for the keep-awake workflow | M7 | open |
| M8: generate the VAPID key pair; the private half stored as a secret only | M8 | open |
| Native-speaker review of "Market" (decision 6; least sure: Korean, Polish, Turkish, Filipino, Chinese, Japanese) and the Thai, Vietnamese, Khmer and Lao block terms | none; quality | open; no native speaker available (owner, 2026-10-19) |
| F3, Xcode: the live Xcode project is not in the repo (its `project.pbxproj` was removed from git in `4f06543`, 2026-07-17; no `Info.plist`, entitlements or `.xcconfig` is tracked), so the current tree declares no location usage description. Its last committed version did: `INFOPLIST_KEY_NSLocationWhenInUseUsageDescription` = "Mekonging uses your location to show places near you and to stamp journal entries." Confirm the owner's local project still has it. If it does not, the WKWebView never shows the location dialog | none | **owner check**, read only; F3 edited nothing |
| F3, iPhone: open the app fresh in Safari, then as a Home Screen app. The welcome step's "Use my location" raises the dialog once; allow it and Home names the place with no further tap; on a second fresh install refuse it and check the banner shows once and no dialog appears on reload | F3 | open |
| Decision 25: remove the spent worktrees and branches listed in 4.6 | none | **worktrees done 2026-10-27**: f1b, f2 and f3 (and the `f3-base` branch) are gone, as the owner told S1; `git worktree list` at the start of S1 showed only the main checkout. Their remote branches are still on origin (4.6) |

### 4.3 Open decisions (numbers as in `docs/HANDOFF.md`)

| No. | Decision | Status |
|---|---|---|
| 6 | Native review of the "Market" translations | open (owner action above) |
| 8 | Legal questions | open (owner action above) |
| 10 | Topbar icon spacing (the title column has 102 px) | **deferred** by the owner until Q3 to Q5 are done; asked again after Q5 |
| 13 | Relabel the Tourism Laos entries | **closed: yes**, in D5 tidy. Re-measured: 45 "Lao National Tourism Administration" (not 46) and 4 "Ministry of Information, Culture and Tourism", 49 in all. The 45 are in 8 files: `places.la.ext.js` 20, `places.la.js` 8, `local.la.js` 7, `regions.info.js` 4, `itineraries.js` 2, `info.la.js` 2, `borders.js` 1, `prices.la.js` 1 |
| 14 | A coordinates-check slice | **closed: yes**, G1 to G4, Laos first |
| 19 | Install `pglast` | **closed: yes**, at the start of M4c |
| 22 | The Trat anchor sits on Ko Mak, 47.4 km from Trat town | **closed:** settled inside G1 |
| 23 | `js/market-routes.js` and `js/market-link.js` into `PRECACHE`; `check-offline-boot` into CI | **closed: done** in F2 ([PR #136](https://github.com/SamuelLClemens/Mekonging/pull/136)) |
| 24 | Widen Cambodia's list to every village | **closed: yes** (against the recommendation), slice F1b, built in [PR #137](https://github.com/SamuelLClemens/Mekonging/pull/137) |
| 25 | Remove the spent worktrees and branches (4.6) | **closed: done** for worktrees and local branches, 2026-10-27 (f1b, f2, f3). The remote branches stay until the owner approves their removal (4.6) |
| 26 | A coarse world outline for the journey map offline (4.4) | open; owner, 2026-10-26: measure a simplified Natural Earth outline (KB, gzip) first, nothing built yet |
| 27 | The share-journey route carries stops added by hand | **closed: yes, keep** (owner, 2026-10-26) |
| 28 | What Emergency shows for a fix outside the four countries (4.4): it named the nearest anchor's country, so Singapore showed Thailand's numbers | **closed: ruled** (owner, 2026-10-27, against the recommendation): "no matter where you are in the world it should give you the emergency info". Answers, 2026-10-27: show a **worldwide table of national numbers**, and say where the fix is **with the coordinates**. F7a ([PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140)) built the safe part with no new data: coordinates, 112 and the four-country chips. F7b is the table and the world outline |
| 29 | Should a place picked by hand hold over a live fix for a while? Today the fix always wins | **closed: ruled** (owner, 2026-10-27, against the recommendation): hold the pick. Slice F6 (4.1). Not ruled: for how long |
| (none) | A new source for more place photos (620 places have none) | open; S1's artwork makes a photo-less card deliberate, so no new photo source is proposed |

### 4.4 Known defects

| Area | Defect | Measured | Owner |
|---|---|---|---|
| Offline | The OCR language files are not in the service-worker manifest, so offline OCR after first use is untested | `grep -c traineddata sw.js`: 0; the files are `lib/tesseract/lang/{khm,lao,tha,vie}.traineddata.gz` | F5 (it touches the host languages) |
| iOS wrapper | OCR from `mekong://` (a blob worker's `importScripts`) is untested | not measurable here (no Xcode) | next wrapper build; owner check |
| Location | A GPS fix outranks a place picked by hand: a traveller in one town who picks another sees the town they are in. Unchanged by F3 | `docs/HANDOFF.md` (F1) | decision 29 is ruled (4.3): hold the pick; slice F6, which asks for how long |
| Location | Today, Arrival, Transport and Explore's "Places in X" read the anchor, not the picked or fix place: at the Anlong Chambak fix they say "Near Pursat" and "Places in Pursat". Their content is keyed to curated cities, so this is by design; F3 changed the labels that say where the traveller is | F3 driver, 2026-10-27 | none unless the owner wants a place-level "Today" |
| Location | A picked place, and now a fix's place (`prefs.fixPlace`), is saved only through the debounced store save | F1 probe (`Browser.close` lost it) | Q7 (store flush) |
| Location | Two anchors sit on islands: Trat at 11.82, 102.47 is Ko Mak (decision 22), and **new:** Ba Ria-Vung Tau at 8.69, 106.61 is Côn Sơn island (the city is near 10.35, 107.08). A fix on either island reads the anchor's name (1.6 km and 0.4 km), so F3's list place never takes over | F3 driver, 2026-10-27 | G1 (Trat), G3 (Ba Ria-Vung Tau) |
| Location | **Partly fixed (F7a, `mk-v0.654.0`).** A fix more than 250 km from every curated city now gets the outside screen: Singapore (743 km), Kuala Lumpur (457) and Kunming (321) no longer show Thailand's or Vietnam's numbers. Still open: a fix in a neighbouring country within 60 km of a curated city (about 30 km into Myanmar from Mae Sot) reads as the region country, and Yangon (237 km), Mawlamyine (189) and Penang (165) read `far`: the named country and 112 together. No distance separates them from remote region sites: of the 36,131 list places, 681 have no outline within 10 km and 124 of those are more than 60 km from a city. The world outline in F7b settles it. `getLastFix` never expires, so a stale fix keeps the outside screen until the next fix. Direct `nearestSpotGlobal` callers that do not feed Emergency are untouched: `js/main.js` 2817 and 3709 (trip stage, `anchorCountry`), 6880 (worship), `js/screens/country-info.js:280`, `js/screens/journal.js:349`, `js/screens/places.js:999` | rendered in headless Chrome at 375 px, 15 fixes, 2026-10-27 | F7b; the callers only if a screen proves wrong outside the region |
| Location | `prefs.geoAsked` is now read by nothing: `finish()` and every Home button set it, so it never meant "asked". `prefs.geoPrompted` is the working flag | grep, 2026-10-27 | D5 tidy (remove it) |
| Location | First launch, fresh profile: the imports of the four place lists sat unrequested for 9 s in 1 of 8 runs while the service worker installed. `js/fix-place.js` now times out each attempt (12 s) and retries 3 times; 5 later runs resolved in 1.5 to 2.7 s, and with the lists blocked for 6.7 s the place landed at 10.7 s. The stall itself was not seen again | F3 probes, 2026-10-27 | none; watch |
| Location | Out-of-region distance is a cap, not a border: Penang (165 km from Satun) and Yangon (238 km from Mae Sariang) still read their nearest anchor | measured from `js/weather.js` anchors | T14 or never |
| Layout | The forecast calendar inside its closed `<details>` lays out 68 px columns to 495 px at 375 px | 495 px (F1, 2026-10-25) | Q3 |
| Layout | The top ~3 px of the tab bar show content scrolled beneath the retro stripe | ~3 px (exchange slices) | Q4 |
| Layout | Tall portrait photos are uncapped (Phanom Rung renders 548 px tall at 375 px) | 548 px (carried) | **built in S1** (the card's media box is capped at 240 px; a 548 px portrait measures 240 px in the box, 5.5); applied in R1 |
| Layout | Malay "Laman utama" is truncated in the tab bar | string at `js/data/ui-strings.ms.js:10`; truncation carried, not re-rendered | L2 |
| Map | The `#map` `getSource` race | 1 of 4 runs (F1), 1 of 3 light loads (Q1), 1 of 15 picker loads (F1b) | Q7 |
| Map | With no signal and no cached imagery, the journey map is bare sea outside the four countries, at every zoom from 1 to 9. Rendered `land` features: 0 at Singapore from zoom 5 and 0 at London at every zoom; imagery tiles: 0 of 124 requested loaded across the 18 views (online, 75 of 75). A pin and its name still save, and the pin hint says so. The offline geometry (`js/data/basemap.js`, 26 KB) holds the four countries only; a coarse world outline would be a new data file | F2 probe, 2026-10-26: headless Chrome with every external host unresolvable (`~/Library/Caches/mk-f2/world.py`) | open: owner decision (measure the outline's size first) |
| Map | The MapLibre credits plate opens expanded and covers 16.6% of the journey map and its first pin | 16.6% (Q1, 2026-10-19) | Q7 |
| Map | With no network, the maps log `TypeError: Failed to fetch` for every tile request: per load 42 to 63 errors on Places, 86 to 102 on the journey map, 44 to 57 on a place page and 8 to 9 on Weather (609 over the 24 loads of the S1 digest, one kind of error) | `tools/style-digest/digest.py`, 2026-10-27; offline only | Q7 (with the `getSource` race), or none |
| Accessibility | 66 of 77 routes carry body controls under 44 px (1,315 controls, 199 under 24 px); topbar icons 30 to 36 px wide | Q1, 2026-10-19; not re-measured since M4b-1 and F1 merged | Q2 re-measures; Q3 to Q5 fix |
| Accessibility | Contrast fails on 27 routes in light and 6 in dark (28 routes, 19 selectors); the dark calendar's selected day is 1.21:1 | Q1, 2026-10-19 | Q6 |
| Copy | Free places print "฿0 (≈ $0)": `range()` returns `money(0)` when low equals high (`js/util.js:111`), so the `\|\| 'Free'` fallbacks after `priceLine()` (`js/screens/places.js:774`, `1095`, `1734`) never fire | code read, 2026-10-25 | T6 |
| Copy | "Traveller board" remains on the Travel circle card (`js/screens/circle.js:62`) and the Near me chip (`js/screens/nearby.js:91`) | grep, 2026-10-25 | R2 |
| Copy | The on-phone board chips (Items, Rooms, Rides, Cash) are English only, and two show as pressed on `#market-items` | carried (exchange slices) | M4b-2 |
| Copy | The strings added by M3b, M4a, M4b-1, F1, F3 and S1 are English only | carried; every table has the same 369 keys (`check-ui-strings`) | F5 (host languages), L2 (the rest) |
| Copy | Topbar titles with an emoji or flag prefix, which `CLAUDE.md` forbids: `${c.flag} Culture & etiquette` (`js/screens/etiquette.js:62`), `${catOpen.emoji} Market products` (`js/screens/produce.js:32`), and **new:** `${emoji} ${title}` on saved collections such as "⭐ Favourites" (`js/main.js:4642`) | grep, 2026-10-25 | Q4 |
| Market | "Reset everything" does not clear recent searches: `mk-market-recent` is named only in `js/screens/market-home.js:39`, and the reset (`js/screens/settings.js:694`) clears the store keys (`js/state.js:582`) | grep, 2026-10-25 | M4b-2 |
| Market | Price sorts compare amounts across currencies | carried (M4a, M4b-1) | M4b-2 |
| Market | The fixture's `&tester=1` opens search when signed out | carried (M4b-1) | M4b-2 |
| Market | `member_since` ("YYYY-MM") is a weak fingerprint across one person's listings | carried (M4a) | M5 |
| Market | The ride artwork reads as a van more than a tuk-tuk | carried (M4b-1) | M4b-2 |
| Photos | Two archival black-and-white Vietnamese photos | carried | S1 built the label (`photo.archival` on `placeCardRF`); R1 marks the two photos, because the data does not say which they are |
| Photos | Eight Vietnamese activity cards reuse their landmark's image | carried | R1 |
| Photos | Flagged: the Skuon vendor, the Muang Sing market faces, Tonle Bati showing the lake, Phare Circus not fetched | carried | R1 |
| Tooling | `fetch-place-photos.py` exits 0 when lookups fail: `main()` ends in `return 0` with no failure path, and `sys.exit(main())` is at `scripts/fetch-place-photos.py:466` | code read, 2026-10-25 | Q2 |
| Tooling | `scripts/route-sweep.js` has no `#market` in `EXTRA` (`scripts/route-sweep.js:60`) and reports `content-visibility` cards as zero-size controls | grep, 2026-10-25 | Q2 |
| Data | **New:** one place has no `hours`: `la-ext-rental-vang-vieng` (`check-place-fields`: hours 881 of 882) | jsc, 2026-10-25 | D5 tidy |

**Closed in 4.4**
- The automatic trail named a far-off place for a fix outside the region (F2's leftover): closed by F3 (`mk-v0.652.0`). `logTrail` now names a pin only from a `whereAmI` result that is not a guess, or from the place list; before, an emulated Singapore fix was filed `{city: 'Songkhla', cc: 'th'}`, after, `{city: '', cc: ''}`.
- Anlong Chambak was paired with the Pursat anchor (F1b's leftover): measured, not a fault. The pairing is by distance, as Nearby ranks: Pursat 56.1 km, Siem Reap 58.5 km, Kampong Thom 83.9 km. The village is in Siem Reap province. F3 keeps the distance rule and names the village itself (Home, Weather and Places read "Anlong Chambak").

### 4.5 Data gaps and disputes

| Gap | Measured 2026-10-25 | Owner |
|---|---|---|
| Records citing a source with no URL | 2, both Thai: `th-ext-rca-royal-city-avenue`, `th-ext-nimmanhaemin-road-bar-scene` (edit by hand; `--install` refuses them) | D5 tidy |
| Homepage-only citations | 21 (th 1, vi 7, kh 5, la 8), all filed `open`; `check-sources` baseline 21 | stay open by ruling (2026-10-19); the city slices revisit their own |
| No `localName` | 512 (th 153, vi 125, kh 92, la 142); cards mix native-only and older "native · romanisation" values (the older stay, by ruling) | no lane: Overpass fails here; B and C slices ship complete records |
| No photo | 620 of 882 (th 200, vi 165, kh 109, la 146), each filed `no_article` (582) or `rejected` (38). By first category, stays (148) and food (110) are 41.6% of the gaps | S1 artwork, applied in R1 |
| Fields missing (were, 2026-10-12) | `access` 648 (650), `afterDark` 674 (675), `kidFriendly` 402 (403), `recognition` 426 (426), `rating` 180 (181) | D6 |
| Cards that disagree with the page they cite, left unchanged | Tad Champee and Tad Yuang (fees), Tad Katamtok (province, distance), Plain of Jars Site 2 (distance, fee), Savannakhet Dinosaur Museum (hours), the Mekong slow boat (fare), Vang Vieng rentals, Pakse to Thakhek (duration), Banh It Cham Towers (century), Long Beach and Long Set Beach, Yeak Laom (direction), Kampot Night Market, Kratie to Banlung, Phnom Sampov, Ka Tieng Waterfall | Long Beach in D5 tidy; the Lao items in G1; the Cambodian items in G2; Banh It Cham in G3. Each fix needs a second source |
| Coordinates not checked | Tad Champee and Tad Yuang (0.3 km apart, though 38 and 40 km from Pakse), Champasak town, Pong Dueat hot springs, Tad Katamtok, the Trat anchor | G1 (Laos and Trat), G4 (Pong Dueat) |
| Transport gaps left open (no checkable source) | Khun Yuam, Mae Chaem, Preah Vihear; no operator page reachable for six Lao and three Cambodian routes (12Go and Wikivoyage cited instead) | open by policy; T2 and T7 revisit |
| Landmarks not in the place list | Kong Lor Cave: 0 rows matching "kong lo" in `js/data/gazetteer.la.js` | T3 |
| Vietnam's list is thin | 1,626 places (towns 825, islands 498, villages 289, communes 14); GeoNames gives a population to 28 of 10,579 communes; every populated place is 478 KB gzip, over the 250 KB cap | T13 |
| Mislabelled host | 50 "Ministry of Tourism" entries on tourismcambodia.com and .org: `places.kh.ext.js` 34, `places.kh.js` 6, `local.kh.js` 5, `itineraries.js` 3, `info.kh.js` 1, `prices.kh.js` 1 | D5 tidy |
| Unreadable citations | `cambodia.panda.org` (certificate), `wildlifealliance.org/chi-phat-ecotourism/` (404), `travelguide.michelin.com` (does not resolve), `angkorenterprise.gov.kh` and `visitcambodia.com` (Cloudflare); carried from D5 Cambodia | G2 replaces them where a checkable page exists |

### 4.6 Housekeeping

| Item | Measured 2026-10-25 | Owner |
|---|---|---|
| `js/main.js` size | 7,601 lines against ~1,500; no guard enforces a ceiling (no `1500` in `scripts/` or `.github/workflows/`) | T4 adds a ratchet. Until then, every slice that edits `main.js` moves the code it touches into a module (F4 moves `returnRecapCard`) |
| Test drivers outside the repo (S1 committed its own under `tools/style-digest/`: `digest.py`, `components.py`, and a copy of the stdlib CDP client that Q2's `tools/cdp/` absorbs) | `~/Library/Caches/mk-f1/`, `mk-f2/` and `mk-m4b1/` (plus their Chrome profiles); the Q1 driver and the M3b CDP client in the notes folder `local_45164220-ea74-40e6-851e-808583e5b9f4/` (`q1-audit-driver/`, `m3b-cdp/`) | Q2 commits the audit driver and one shared stdlib CDP client (`tools/cdp/cdp.py`) that later drivers import |
| Spent worktrees | **Removed** (decision 25, 2026-10-27): f1b, f2 and f3 and the local branch `f3-base`. S1 found none of the 7 older ones either (best-tool-prompt, f1, fixes-plan, m3a, m4a, m4b1, rulings-1019): `git worktree list` showed only the main checkout. S1 adds two under `Mekong/.claude/worktrees/`: `s1-tokens` (the branch) and `s1-before` (detached at `b7dd04a`, the digest's baseline); both are spent when its PR merges | none; remove the two when the PR merges |
| Spent remote branches | 14 merged (and, since 2026-10-27, three more: `data/f1b-cambodia-villages`, `feat/f2-journey-world`, `feat/f3-location-first-open`, from PRs #137, #136 and #138; the worktrees are gone, the remote branches are still on origin): `data/d4-local-names`, `data/d5-vietnam`, `data/f1-laos-villages`, `docs/bangkok-buildout-plan`, `docs/language-work-plan`, `docs/m3b-handoff`, `docs/m4b-split`, `docs/owner-rulings-2026-10-19`, `docs/q1-audit-375`, `feat/f1-place-list`, `feat/m3-signin`, `feat/m3a-csp-secrets`, `feat/m4a-listings`, `feat/m4b1-market-browse`. **New:** `fix/transport-leaving-reverse` (PR #95 merged; its one extra commit, 3533216, merges #96 into it, and both fixes are on the tip) | owner action: approve removal |
| Orphan screenshot branches | `assets/f1-shots` (0cda8bc), `assets/f1-laos-shots` (ab20737) and **new** `assets/m4b1-shots` (229be7f); the PRs that link to them are merged | owner action: approve removal (the PR pages' images then break) |
| Preview entries | The parent folder's `/Users/zim/Claude Code/.claude/launch.json` holds 58 entries (F3 added `mekong-f3`, port 8963), 33 named `mekong*`, several for removed worktrees; it is modified and uncommitted in that folder's own repository | owner action: approve pruning with the worktrees |
| The main checkout | `Mekong/` sits at ddf57b9, behind the tip | none; sessions start from `origin/` in a worktree (`CLAUDE.md`) |
| Precache size | 3,829 KB gzip after #133 (`docs/HANDOFF.md`); no budget guard | T4 |

### 4.7 Dropped, with evidence

- **`check-offline-boot` failed on `js/market-routes.js` and `js/market-link.js`** (on the eager path, not in `PRECACHE`; the
  worker caches a sub-resource only when a request passes through it, so a first visit followed by going offline could fail
  to start). Fixed in F2: both are in `PRECACHE` (`sw.js:108`, `109`), and the guard runs in `.github/workflows/guards.yml`
  and is described in `scripts/README.md`. It passes on `mk-v0.650.0`.
- **The Museum of Cham Sculpture credit "Unknown authorUnknown author"** is fixed: `js/data/photos.js:595` reads
  `vi-ext-cham-museum-v2.jpg`, "Daderot, CC0, via Wikimedia Commons", and the string appears nowhere in `js/`
  (`scripts/fetch-place-photos.py:280` now strips the hidden duplicate).
- **Local reminders as a new feature:** they exist. `js/reminders.js:1` to `8` delivers calendar reminders in-app and by
  notification while the app is open, and says why background push is not used. What remains is a visa days-left
  countdown, which joins T10, and background delivery, which is M8's.
- **Ride-hailing per country as a new slice:** the transport screen already has a "Ride-hailing apps" card
  (`js/screens/transport.js:177`, with Grab, Bolt and the local apps in `js/data/transit.js`). Its freshness is T1's.
- **Nearest hospital by GPS:** it exists (`nearestCare`, `js/screens/medical.js:295`); pharmacies are the gap (T5).
- **A correction path:** places already have "Suggest an edit" (`js/screens/places.js:1682`, `1773`) into the offline
  feedback form (`js/screens/help.js:1`). T1 adds it to the other fact cards.

## 5. The style refinement: "Mekong Retro, refined"

### 5.1 Locked (not reopened)
Mekong Retro is the default (cream poster paper by day, navy night poster by night, following the phone). Four stripes
for the four countries (Thailand brick, Vietnam plum, Cambodia gold, Laos green); stripe bands only, no emblem rings,
grain or new display face; Be Vietnam Pro stays; the sun logo is unchanged. The country colours do the wayfinding, the
sun orange marks the active tab and is the only primary-action colour, and red means danger only. All 11 skins stay
selectable. The five tabs, `js/nav-groups.js` and each screen's information architecture stay fixed.

### 5.2 What the tokens look like today (measured)
- **Type.** `css/style.css` defines `--fs-label` 0.7rem, `--fs-xs` 0.78rem, `--fs-sm` 0.875rem, `--fs-base` and
  `--fs-body` 1rem, `--fs-h3` 1.0625rem and fluid `--fs-h2`, `--fs-h1` and `--fs-display`. They are used 203 times in
  the CSS and 0 times in JS. Beside them sit 49 distinct literal `font-size` values in the CSS (most often 12 px x 12,
  11 px x 11, 13 px x 8, 10 px x 6) and 47 inline pixel font sizes in JS.
- **Line height.** 41 rules set `line-height: 1`. That is the risk for Thai, Lao and Khmer stacked marks and for Vietnamese
  diacritics on two lines.
- **Figures.** 8 rules use `tabular-nums`.
- **Icons.** `js/nav-groups.js` carries 64 emoji `ic:` values, which are the chrome icons today.
- **Motion and states.** 3 `prefers-reduced-motion` rules in `style.css` and 1 in `market.css`; 4 skeleton rules.
- **Artwork.** `js/market-art.js` (143 lines: `artSVG`, `artNode`, `ART_KEYS`) draws token-coloured inline SVG for the
  Market. Places have no equivalent.
- **Photos.** No height cap on place photos (Phanom Rung 548 px at 375 px).

### 5.3 Proposed token changes (built in S1, see 5.5; nothing moves on screen until R1 to R3 apply them)
1. **Type scale.** Keep the existing names and put them on one ratio (1.125): `--fs-label` 0.75rem (a 12 px floor; no
   text below it), `--fs-xs` 0.79rem, `--fs-sm` 0.889rem, `--fs-base` 1rem, `--fs-h3` 1.125rem, `--fs-h2` 1.266rem,
   `--fs-h1` 1.424rem (fluid to 1.6rem), `--fs-display` unchanged. A new guard counts literal font sizes and holds the
   count at its baseline, so R1 to R3 can only lower it.
2. **Line height for every script.** `--lh-tight` 1.2 (Latin headings), `--lh-body` 1.5, and `--lh-script` 1.7 applied
   under `:lang(th)`, `:lang(lo)` and `:lang(km)` (1.6 under `:lang(vi)`), tested with the longest strings of the 29 tables.
3. **Figures.** A `.num` utility (`font-variant-numeric: tabular-nums`) on every price, time, distance and count.
4. **Data-visualisation palette.** `--viz-1` to `--viz-8` per skin, derived from the four country colours and the role
   hues, plus `--viz-grid`, `--viz-axis` and `--viz-label`. Defined in `tools/style-tiles/round2.json` so `port-themes.py`
   writes them, and checked by `check-contrast.py` at 3:1 as graphics on the card surface of every skin, in light and
   dark where the skin has both. The `dataviz` skill is loaded first.
5. **Icons.** One self-hosted, subsetted SVG sprite (`icons/ui.svg`) from Lucide (ISC licence, recorded in the repo),
   about 40 glyphs, drawn at `--icon-size` 20 px with `--icon-stroke` 1.75 in `currentColor`. `nav-groups.js` gains an
   `icon:` id beside each `ic:`; emoji stay only inside content.
6. **One place-card anatomy.** Media (photo or artwork) at `--card-media-ratio` 3 / 2, capped by `--card-media-max`
   240 px; name and local name; a meta row (open now, price tier, distance) in `.num`; the source chip; "Checked <date>".
7. **Artwork for photo-less places.** `js/place-art.js` on the `market-art.js` pattern, about 10 motifs that cover the
   gap categories: stay, food, temple and culture, market, waterfall and nature, beach and island, viewpoint, transport
   and rental, health and practical, nightlife. Labelled as artwork to screen readers, never captioned as a photo.
8. **Photo treatment.** One crop rule (`object-fit: cover`, centred), the height cap above, one credit-line style, and an
   "Archival photo" label for the black-and-white images.
9. **States and motion.** `--dur-1` 120 ms, `--dur-2` 200 ms and one easing token; one global
   `prefers-reduced-motion` rule; a `.skeleton` with per-skin colours; empty states with the stripe band.
10. **Target size.** `--hit` 44 px, used by Q3 to Q5 for summaries, buttons, chips and the topbar.

### 5.4 How it ships
1. **S0, the gate (alongside, documents and tools only).** A private gallery artifact, captured in headless Chrome over
   CDP at 375 px with `document.hidden === false`: Home, Places, a place card without a photo (a stay cluster such as
   `th-chiang-mai-old-city-hostels`), Explore, Talk, Weather, the journey map and the Market home; current against
   proposed; in Mekong Retro light, Mekong Retro dark and Night Market (`night`, a fixed dark skin). That is 48 captures.
   The owner answers one `AskUserQuestion` form, and the answers are recorded in `DESIGN_SYSTEM.md`.
2. **S1, tokens and machinery (before F4). Built 2026-10-27 (5.5).** Items 1 to 10 above as tokens, the sprite, the card component, the artwork
   generator, and the guards (`check-contrast` reads the viz tokens; a literal-font-size ratchet). It is proven with a
   computed-style digest, and nothing outside the new components moves.
3. **Q3 to Q7, the sound base (after L4).** As in `docs/AUDIT_375.md`, "Proposed fix slices". Done when every control is
   at least 44 x 44 px or carries a named exemption, contrast has 0 failures in both themes (with `check-contrast.py`
   extended to composed colours), the credits plate is collapsed as loaded, and `getSource` is guarded.
4. **R1 to R3, the roll-out (after G4).** R1 covers Home, Places and every place card (anatomy, artwork, photo treatment);
   R2 covers Explore, Talk, Weather, the map and the journey; R3 covers You, Settings and the remaining screens. Each
   proves with a computed-style digest that nothing outside its scope moved.

### 5.5 S1 as built (2026-10-27, `mk-v0.653.0`, [PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139))

S0 had not run, so the values are 5.3's own. The values, the method and the deviations are in `DESIGN_SYSTEM.md` ("S1"). Nothing
applies to an existing screen: the refined type scale, the line heights and the reduced-motion rule are declared on `[data-refined]`,
which no element carries until R1 to R3 add it to a screen group's root. 5.3 item 1 ("keep the existing names") and the done
criterion ("nothing outside the new components moved") cannot both hold with a change at `:root`, because 241 places read the
`--fs-*` tokens; this scoping is how both hold.

| 5.3 item | Built as | Measured |
|---|---|---|
| 1 Type scale | `[data-refined]` in `css/refined.css`; `scripts/check-font-sizes.py` and `scripts/font-size-baseline.json` | inside the scope 12, 12.64, 14.22, 16, 18, 20.26 and 23.4 px at 375 px; outside, today's 11.2, 12.48, 14, 16, 17, 18.2 and 22.3 px. Literal sizes held at 138 CSS declarations (50 distinct) and 74 in JS strings (47 in pixels); the register's "49 distinct" was counted a little differently |
| 2 Line height | `--lh-tight` 1.2, `--lh-body` 1.5, `--lh-script` 1.7, `--lh-vi` 1.6 under `:lang()` in the scope | the longest string of the th, lo, km and vi tables (81 to 102 characters) at 27.2 px (25.6 for vi) against an ink height of 21.6, 20.5, 25.3 and 18.3 px; `line-height: 1` gives 16 px, which clips Thai and Khmer marks |
| 3 Figures | `.num` | the card's meta row and checked date use it |
| 4 Chart colours | `--viz-1` to `--viz-8` for 16 surfaces, generated; `tools/style-tiles/derive-viz.py`; `check-contrast.py` reads them | 160 chart colours at 3:1 or better on their card; worst neighbouring pair under colour-vision deficiency 16.4 (target 8); the skill's `validate_palette.py` passes retro light and dark, Night Market and Flags |
| 5 Icons | `icons/ui.svg` (51 Lucide glyphs, 12.0 KB, 3.7 KB gzip), `js/icons.js`, `icon:` ids on all 64 `nav-groups.js` entries, `scripts/check-icons.py`, `icons/LICENSE-lucide.txt` | all 51 draw at 20 px, 1.75 stroke, in the text colour, under the CSP, in 3 themes. About 40 was the estimate; 51 distinct glyphs are needed |
| 6 Place card | `js/place-card.js`, `.rf-card` | 14 cards in 3 themes at 375 px: 0 overflowing elements, media 232.7 px at most, name link 44 px |
| 7 Artwork | `js/place-art.js`, 11 motifs, 9.1 KB | all 11 draw in 3 themes and parse as XML; each is named "Artwork: ..." |
| 8 Photos | `.rf-photo`, `.rf-credit`, `.rf-archival`; `photo.archival` | a 506 x 900 portrait renders in a 232.7 px box; the label shows only when asked |
| 9 States and motion | `--dur-1`, `--dur-2`, the existing `--ease`, `[data-refined] .skeleton`, `.rf-empty` | the skeleton colour differs per skin; the stripe band paints on retro only |
| 10 Target size | `--hit` 44 px | used by the card's name link |

**Proof that nothing moved.** `tools/style-digest/digest.py` loads `origin/feat/scaffold-bangkok-slice` (`b7dd04a`) and the S1 branch
side by side, offline (every host but 127.0.0.1 unresolvable), at 375 x 812 with `document.hidden` false, 8 screens (Home, Places, a
place card without a photo, Explore, Talk, Weather, the journey map, the Market home) in Mekong Retro light, Mekong Retro dark and
Night Market: 24 pairs, 10,923 elements. Each element is hashed over all its computed properties and its box, with its `::before` and
`::after`. Result: 0 added, 0 removed, 0 changed in all 24 pairs, and 0 of the existing custom properties changed value (26 new
ones appeared, all of them S1's). A second load of the baseline marks what is noise: 18 elements on Weather in the two dark themes
(the map's city chips, `.wx-mchip`, which place themselves differently on each load); a repeat of that pair three times showed 0
before-to-after differences with those 18 counted. The console shows one kind of error on both sides (`TypeError: Failed to fetch`, the
map's tile requests to hosts that do not resolve), 609 before and 635 after over the 24 loads, which varies with timing.
`components.py` then mounts the new components on the live app: 24 checks per theme, 72 of 72 pass.

**Guards proved to fail.** A literal `font-size: 13px` added to `css/refined.css` fails `check-font-sizes` (139 against 138); a
misspelt icon id in `nav-groups.js` fails `check-icons`; a pale teal in `round2.json` fails `derive-viz --check` (lightness 0.881, chroma
0.073, 1.30:1) and `port-themes --check` (stale block). Each file was restored and its hash checked.

**Cost.** `css/refined.css` is 14.8 KB (4.5 KB gzip), eager and precached, and `icons/ui.svg` 3.7 KB gzip, precached, so about 8 KB
gzip more on the first visit; `js/icons.js`, `js/place-art.js` (9.1 KB) and `js/place-card.js` are lazy and load when R1 first uses
them; `js/nav-groups.js` (eager) grew by the 64 `icon:` fields. The manifest has 276 files (271 before).

**Not done, on purpose.** Applying any of it (R1 to R3); marking which two Vietnamese photos are archival (R1); the five tab icons and
the chrome glyphs are in the sprite but not wired (R2 and R3); S0's gallery and the owner's answers; the tap-target and contrast
fixes (Q3 to Q7).

## 6. The feature backlog (ranked, 15 slices)

Score = value x confidence / cost, where value and confidence run from 1 to 5 and cost is in sessions. Every slice
follows `BEST_TOOL_PROMPT.md` §8 (the definition of done). Every published fact carries a real, checked URL; the URLs
under "Sources" are where to start, and each slice confirms they load before it cites them. No slice adds a third-party
host to the running app.

| Rank | Slice | Value | Confidence | Cost | Score | Placement |
|---|---|---|---|---|---|---|
| 1 | T1 Fact freshness | 5 | 5 | 1 | 25 | after Q7 |
| 2 | T2 Border status | 5 | 4 | 1 | 20 | after T1 |
| 3 | T3 Landmarks in the place search | 4 | 4 | 1 | 16 | after C8 |
| 4 | T4 Size guards | 3 | 5 | 1 | 15 | after C8 (or alongside) |
| 5 | T5 Nearest pharmacy | 4 | 3 | 1 | 12 | after C8 |
| 6 | T6 Practical facts (plugs, tipping, "Free") | 3 | 4 | 1 | 12 | after C8 |
| 7 | T7 Offline routing design pass | 4 | 3 | 1 | 12 | after C8 (or alongside) |
| 8 | T8 The "now" card | 3 | 3 | 1 | 9 | after C8 |
| 9 | T9 Home Screen shortcuts and share target | 2 | 4 | 1 | 8 | after C8 |
| 10 | T10 Entry rules by passport | 5 | 3 | 2 | 7.5 | after C8 |
| 11 | T11 City transit diagrams | 4 | 3 | 2 | 6 | after C8 |
| 12 | T12 Seasons and closures | 4 | 3 | 2 | 6 | after C8 |
| 13 | T13 A wider Vietnam list | 3 | 2 | 1 | 6 | after C8 |
| 14 | T14 Arriving by land | 3 | 3 | 2 | 4.5 | after C8 |
| 15 | T15 Multi-country itinerary builder | 4 | 2 | 3 | 2.7 | after T7 and C8 |

### T1: fact freshness (every stale-prone fact shows its source and the date it was checked)
- **Problem.** Visa rules, border status, entry forms, fares and hours go stale, and a traveller cannot tell how old a fact is.
- **Measured.** Freshness exists but is uneven. `freshnessLine()` (`js/main.js:2680`) is called in 4 places. Visa rules carry
  one `asOf` per country (`js/data/visa.js:50`, "2026-07-08"); crossings carry a month (`verified: '2026-06'`,
  `js/data/borders.js:13`), and the crossings screen shows only the newest of them (`js/main.js:4756`). Places show
  `verified` through `sourcesNote` (`js/screens/places.js:1807`). No guard lists a fact past its review age. "Suggest an
  edit" exists for places only (`js/screens/places.js:1682`).
- **Scope.** A register, `scripts/volatile-facts.json`: each stale-prone field (visa, entry form, border, fare, hours,
  ride-hailing apps) with a review age (visa and entry forms 90 days, borders 30, fares 180, hours 365). A guard,
  `check-freshness.py`, lists facts past their age (report-only in CI at first, failing once the overdue list is cleared).
  Every visa, border, arrival, transport and price card shows "Checked <date>" and a "Report a correction" link into
  the existing feedback form, carrying the card's id.
- **Sources.** None new; the existing `sources` arrays.
- **Offline.** All on the device; the dates ship with the data.
- **Done when.** The guard runs in CI and prints the overdue list; the five card types show the date and the link at 375 px
  in light and dark; 0 overflow, 0 console errors.

### T2: border status
- **Problem.** The Thailand and Cambodia land border closed to travellers after the 2025 conflict, but the app says so only
  in prose (`js/data/borders.js:49`, `notes`). No crossing has a status field (`grep -c status js/data/borders.js`: 0),
  so neither a card nor the journey planner can act on it.
- **Measured.** 26 crossings, each with a source (often a homepage such as `immigration.gov.la` or `evisa.gov.kh`) and a
  month in `verified`. `CROSSINGS` is read in `js/main.js`, `js/screens/places.js`, `js/lazy-data.js` and
  `js/data/transit.js`; whether any route avoids a closed crossing is unknown, and T2 measures it first.
- **Scope.** Each crossing gains `status` (`open`, `restricted`, `closed`, `unknown`), `statusSource` (an official URL) and
  `statusChecked` (a date). The crossing card shows a status pill; the journey planner and the route graph leave closed
  crossings out and say why. A guard asserts the three fields on every crossing. The T1 register gives borders a 30-day age.
- **Sources.** Thailand's Immigration Bureau (`https://www.immigration.go.th`) and Ministry of Foreign Affairs
  (`https://www.mfa.go.th`); Cambodia's e-Visa portal (`https://www.evisa.gov.kh`, which lists the crossings that accept
  e-visas); Laos's e-visa portal (`https://laoevisa.gov.la`); Vietnam's immigration department
  (`https://xuatnhapcanh.gov.vn`). An embassy notice is acceptable; a news report only beside an official page.
- **Offline.** Status and date ship in the bundle. There is no live feed: "live" means curated and dated, and the card
  says "as of <date>".
- **Done when.** All 26 crossings carry the three fields; the Thai and Cambodian land crossings show "closed" with an
  official source (or "unknown" if none can be found); a journey from Bangkok to Siem Reap by land does not route
  through a closed crossing; 375 px, light and dark, 0 errors.

### T3: landmarks in the place search
- **Problem.** A traveller who types "Kong Lor" finds nothing.
- **Measured.** The place list holds populated places and islands only; 0 rows match "kong lo" in `js/data/gazetteer.la.js`.
  Kong Lor Cave is a GeoNames spot (class S, CAVE) and Ban Konglo an abandoned place (PPLQ) (`docs/HANDOFF.md`, F1).
- **Scope.** `scripts/build-gazetteer.py` adds natural and built landmarks (GeoNames classes S, T and H: caves,
  waterfalls, temples, viewpoints, lakes, hot springs) that have a Wikipedia or Wikidata link, as a new kind `l`. Each
  country stays under 250 KB gzip, and a keystroke stays under 100 ms with a 6x CPU slowdown.
- **Sources.** GeoNames dumps (`https://download.geonames.org/export/dump/`, CC BY 4.0, already credited).
- **Offline.** In the precached list files.
- **Done when.** Kong Lor Cave and three sampled landmarks in other countries are found in every picker and show a
  forecast and a pin; sizes are reported before and after.

### T4: size guards (tools only)
- **Problem.** The precache (3,829 KB gzip after #133) grows with every district, and `js/main.js` (7,601 lines) has no ceiling.
- **Measured.** No budget or line-count guard in `scripts/` or `.github/workflows/`.
- **Scope.** `check-precache-budget.py` fails above a budget the owner sets (proposed: 4.5 MB gzip). `check-file-size.py`
  fails when a file over 1,500 lines grows, and when a new file passes 1,500. Both go into `scripts/README.md` and `guards.yml`.
- **Done when.** Both guards pass on the tip, both fail on a planted breach, and CI runs them.

### T5: nearest pharmacy, offline
- **Problem.** Abroad, a pharmacy is the first stop for most health needs; the app finds hospitals, clinics and doctors, but not pharmacies.
- **Measured.** `KIND_LABEL` has hospital, clinic and doctor only (`js/data/hospitals.js:42`); `nearestCare` already ranks by
  GPS (`js/screens/medical.js:295`). Dengue (44 mentions) and rabies (21) are covered, mostly in `js/data/firstaid.js`.
- **Scope.** Pharmacies from OpenStreetMap (`amenity=pharmacy`) through a country extract, added beside the hospitals
  in the same lazy, per-country files; the medical screen offers "nearest pharmacy"; a pharmacy phrase card (pain,
  fever, diarrhoea, allergy, "do you have...") linked to Talk.
- **Sources.** Geofabrik country extracts (`https://download.geofabrik.de/asia.html`, ODbL), downloaded once into an empty
  folder with the owner's approval of the file and its size. Overpass is unreliable from this machine (`CLAUDE.md`).
- **Offline.** Precached per country, like the hospitals.
- **Done when.** In each country, an emulated position finds the nearest pharmacy offline; sizes are reported; 375 px, 0 errors.

### T6: practical facts (plugs and voltage, tipping, "Free")
- **Problem.** Basic practical questions have thin answers: plugs and voltage are mentioned once (`js/data/checklist.js`),
  and tipping about 20 times in passing with no per-country norm. Free places print "฿0 (≈ $0)" (4.4).
- **Scope.** A per-country card in the country guide: plug types and voltage, tipping norms (restaurants, guides, drivers,
  massage) and service-charge practice, each sourced; `range()` returns "Free" when both ends are 0.
- **Sources.** IEC World Plugs (`https://www.iec.ch/world-plugs`); tipping from each national tourism board's own page
  where one exists, else Wikivoyage's country sections.
- **Offline.** In the country's lazy data.
- **Done when.** Four cards render at 375 px with sources; a free place reads "Free" on Places, the place page and Nearby.

### T7: offline routing design pass (documents and tools)
- **Problem.** The owner wants multi-country offline routing; a Valhalla-WASM spike was 10 MB with tiles that cannot be built here.
- **Scope.** Compare a precomputed multi-modal graph (the existing routes, ferries and crossings, with times, fares and
  frequencies) against road routing, measured on size, accuracy against 20 known journeys, and build cost. Write the
  result and a recommended slice plan into `docs/ROUTING.md`. No app change.
- **Done when.** The document holds the measured table and a recommendation the owner can answer in one form.

### T8: the "now" card
- **Problem.** On the ground, the useful question is "what can I do now, here".
- **Measured.** Open-now logic exists (26 mentions, 12 in `js/main.js`), weather and air quality exist, and the calendar has
  festivals, but nothing joins them; no event record says what closes (0 matches for a holiday closure in `js/data/events.*.js`).
- **Scope.** One Home card on `regionNow()`: what is open now nearby (from hours), today's public holiday and what its
  source says closes, weather and air quality now, and the next departures from the nearest hub where schedules exist.
- **Offline.** Everything except the live forecast, which falls back to the saved one with its age.
- **Done when.** Seeded on a holiday and an ordinary day in two countries, the card renders at 375 px in light and dark
  with 0 errors and an honest empty state.

### T9: Home Screen shortcuts and a share target
- **Measured.** `manifest.webmanifest` has neither `shortcuts` nor `share_target`.
- **Scope.** Shortcuts to Emergency, Talk and the map; a share target that files a shared link or text into the journal.
- **Done when.** The manifest validates; Chrome lists the shortcuts; sharing a link opens the journal with it filled in.

### T10: entry rules by passport, with a days-left countdown
- **Problem.** The visa screen gives rules by group, and the traveller cannot choose their passport.
- **Measured.** A "Visa rules depend on your nationality" banner (`js/screens/country-info.js:229`); rules grouped as
  "~93 exemption nationalities" (`js/data/visa.js:12`); no nationality preference in `js/state.js`. TDAC (21 mentions),
  Cambodia's e-Arrival (17) and e-visas (159) are covered as text. No visa days-left countdown exists.
- **Scope.** The 30 most common passports among arrivals, each with its rule in each country (exemption length, e-visa,
  arrival form, onward-ticket check), sourced and dated; other passports see the group rule and the official link. The
  passport is stored on the device only. An entry date on the trip gives "visa days left" on Home through `js/reminders.js`.
- **Sources.** `https://www.mfa.go.th` and `https://tdac.immigration.go.th` (Thailand); `https://evisa.gov.vn` and
  `https://xuatnhapcanh.gov.vn` (Vietnam); `https://www.evisa.gov.kh` (Cambodia); `https://laoevisa.gov.la` (Laos).
- **Offline.** In the bundle; dated under T1.
- **Done when.** 30 passports by 4 countries are filled with sources, or marked "check official" with the link; the
  countdown shows on Home; 375 px; 0 errors.

### T11: city transit diagrams
- **Measured.** `js/data/transit.js` has hubs with "getting into town" text but no station lists (0 `stations:` fields);
  BTS and MRT appear 62 and 40 times, mostly in place text.
- **Scope.** Offline line diagrams (inline SVG, token-coloured), fares and hours for Bangkok's BTS, MRT, Airport Rail Link
  and SRT Red Line, Hanoi Metro lines 2A and 3, and Ho Chi Minh City Metro Line 1.
- **Sources.** `https://www.bts.co.th`, `https://metro.bemplc.co.th`, `https://www.srtet.co.th`, `https://hanoimetro.net.vn`,
  and the operator of Ho Chi Minh City's Line 1 (the slice confirms the official page).
- **Done when.** Six diagrams render at 375 px in three skins with sources; a place card near a station names it.

### T12: seasons and closures
- **Measured.** Best and avoid months exist for regions, cities and places (`js/data/month-verdict.js:1`, `js/data/zones.js`);
  typhoon guidance appears 9 times and the burning season 22, mostly in place text; no event says what it closes.
- **Scope.** A region-by-month view: the monsoon, Vietnam's central-coast typhoon months, the northern burning season, and
  the festivals that close businesses or fill transport (Songkran, Tet, Pchum Ben, Khmer and Lao New Year), each sourced.
- **Sources.** The national meteorological services (`https://www.tmd.go.th`, `https://nchmf.gov.vn`), Thailand's Pollution
  Control Department (`https://www.pcd.go.th`), and the tourism boards' festival pages.
- **Done when.** Every region shows 12 months with sources; the "now" card (T8) reads the closures.

### T13: a wider Vietnam list
- **Measured.** 1,626 places; every populated place would be 478 KB gzip in today's format, over the 250 KB cap.
- **Scope.** A compact row encoding (delta coordinates, province index, kind), Vietnam first, keeping search speed.
- **Done when.** Vietnam's list holds every populated place under 250 KB gzip, with 0 differences in search results for
  the other three countries.

### T14: arriving by land
- **Measured.** 12 arrival guides, all by city (`js/data/arrival.js:5`: Bangkok, Chiang Mai, Phuket, Krabi, Koh Samui, Hanoi,
  Ho Chi Minh City, Da Nang, Siem Reap, Phnom Penh, Vientiane, Luang Prabang); none for a land crossing.
- **Scope.** For the open land crossings in T2: getting to the next town at a fair price, SIM and money on the far side,
  and the scams that have a source.
- **Done when.** Each open crossing has an arrival card at 375 px with sources.

### T15: multi-country itinerary builder (after T7)
- **Measured.** Itineraries are fixed and single-country (`suggestPlans({ country, ... })`, `js/data/itineraries.js:350`).
- **Scope.** As T7 recommends: a plan across countries that respects travel times, crossing status (T2) and seasons (T12).
- **Done when.** Defined by T7's document.

## 7. How this file is kept
- A slice that closes an item moves it to a "Closed" list at the end of its section, with the PR and the measured value.
- A slice that finds an item adds it, measured, with an owner.
- The release order in section 2 changes only by an owner answer, recorded in section 1 with its date.
