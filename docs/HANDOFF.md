# Handoff — 2026-10-25 (slice F1, every town, village and island in the place pickers)

## Shipped
- **F1**, branch `feat/f1-place-list`, [PR #132](https://github.com/SamuelLClemens/Mekonging/pull/132), `mk-v0.648.0`, stacked on #131 (merged 2026-10-24, 1a1c8ef). Screenshots are on the orphan branch `assets/f1-shots` (0cda8bc), safe to delete after the PR merges.
  - The five place pickers (Home's location sheet, Explore's "Where are you?", `#setcity-<cc>`, the Places sheet, the journey's "Add a stop you missed") are one search-as-you-type box: `locationSelect()` in `js/ui-widgets.js`, at most six matches, `onChange(key)` unchanged.
  - `js/place-search.js` searches the 165 curated cities first and then the offline place list: accents, Ko or Koh, word prefixes, one letter of tolerance on words of 5 letters or more, and Thai, Khmer or Lao script. It also took over the Weather finder's matching ("Look up another city" now finds the list too).
  - `scripts/build-gazetteer.py` writes `js/data/gazetteer.{th,vi,kh,la}.js` from GeoNames (CC BY 4.0, credited on Help): 13,204 places (th 9,092, vi 1,626, kh 2,192, la 294). Precached by `sw.js`.
  - The place set is the owner's ruling of 2026-10-25, "only places with a population", as complete as possible without a long list. It holds every island, administrative seat and place with a population, the subdistricts and communes with a population, and the 425 populated places with a Wikipedia or Wikidata entry.
  - A list place is never in `WEATHER_SPOTS`. `setFocusSpot()` pairs it with its nearest anchor and stores it as `prefs.focusPlace`, and `focusSpot()` returns it as `place` (its name is `displayCity`). Four things read the place itself: Home's and Weather's forecast, the forecast keep-set, the distance anchor on Places, and the pin `setPlacePin` draws on the Map and Places maps (any place picked by hand). `spotKey()` adds coordinates for a list place.

## Verified
Headless Chrome over CDP, 375 x 812 at DPR 2, fresh profiles on `127.0.0.1`, `document.hidden` false on every load. The driver is `~/Library/Caches/mk-f1/drive.py` (`before`, `after`, `warm`, `offline`) with `cdp.py`; screenshots are under `~/Library/Caches/mk-f1/`.
- Reproduced on the base branch (worktree since removed): all five pickers were `<select>`s of 45 cities, with no Koh Chang or Koh Mak.
- After, 25 of 25 states pass:
  - **Pickers.** Each of the five pickers, searched for "Koh Chang" and for "Koh Mak", leads with the curated Koh Chang and with Ko Mak (Island, Trat). There is 0 overflow and 0 picker controls under 44 px.
  - **Twelve places.** Each was picked in the Places sheet. Each showed a 16-day forecast named after the place on `#weather` and a titled pin inside the map on `#map`, with 0 console errors:
    - Koh Chang, Ko Mak, Railay Beach and Ko Kut;
    - Côn Sơn and Bạch Long Vĩ;
    - Koh Rong Sanloem (typed "Samloem"), Kampong Khleang and Kaoh Tonsay;
    - Don Khon (typed "Don Khone"), Don Det Tok and Ban Hatxao.
  - **Home and Places on Ko Mak.** Home reads "Ko Mak · Sun, Oct 25" with Ko Mak's 28°C. Places reads "Near Ko Mak", and its 4 Nearby places are sorted by distance (Koh Mak's beach card, Koh Kood, two Koh Chang places).
  - **1280 px.** The picker and the forecast show 0 overflow.
- **Offline.** After one online visit, the four list files and `js/place-search.js` were in the worker's cache. Then the server was stopped (curl: HTTP 000), and both the location sheet and the Places sheet still found Ko Mak, with 0 errors.
- **Search speed** in jsc over 13,204 places: median 13 ms, worst 36 ms; the list loads in 66 ms.
- **Sizes.**
  - `PRECACHE` grew from 214 files, 11,661 KB raw and 3,373 KB gzip to 219 files, 12,487 KB and 3,652 KB.
  - The manifest grew from 263 files, 20,150 KB raw and 6,496 KB gzip to 268 files, 20,976 KB and 6,775 KB.
  - `PACK_BYTES` is unchanged.
  - New files, raw and gzip: th 588 and 195 KB, vi 76 and 28 KB, kh 132 and 45 KB, la 16 and 6 KB, `place-search.js` 9 and 4 KB.
- **Guards.** Every CI guard passes (js-syntax, imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, secrets and market-sql). So do place-fields, port-themes and cache-version against `origin/feat/scaffold-bangkok-slice`. `jsc -m scripts/validate-jsc.mjs` gives 19,297 of 19,297. CI on #132 was pending when this was written.

## Owner checks for M3b (carried; the first two are done)
- [x] Migration 001 run, repaired by 001b (see the earlier handoff in git, `3f4d32f`), `001_rls.sql` 65 of 65 PASS.
- [x] Security Advisor after 001: 0 errors.
- [ ] The owner signs in on the iPhone Home Screen app by code. Then their user id goes into `private.admins` and `private.testers` (look the id up in Authentication, Users; one line of SQL inserts it into each table).
- [ ] The owner signs in by link in Safari, then deletes a test account there (the app confirms deletion only when Auth refuses the old token).
- [ ] From the first real email: whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has (the input takes 6 to 10).

## Not done / known issues
- New in F1:
  - **Laos and Vietnam are thin under the owner's rule.** GeoNames gives a population to 108 of 13,388 Lao villages and to 28 of 10,579 Vietnamese communes, so the list keeps 294 Lao places and 1,626 Vietnamese ones. Every Lao village would be 91 KB compressed; every Vietnamese populated place, 275 KB. See open decision 21.
  - The journey screen shows "Add a stop you missed" only once it has a stop (its empty state returns early). The F1 run seeded a Bangkok stop. This is F2's ground.
  - The curated "Trat" anchor (11.82, 102.47) is 1.6 km from Ko Mak and 47.4 km from Trat town (GeoNames 12.2436, 102.5151), so Ko Mak's anchor is "Trat". See decision 22.
  - Found on the way, identical on the base branch:
    - The forecast calendar inside its closed `<details>` lays out 68 px columns to 495 px at 375 px.
    - `check-offline-boot` fails: `js/market-routes.js` and `js/market-link.js` are on the eager path but not in `PRECACHE`. The guard is not in CI; see decision 23.
    - The `#map` `getSource` race (Q1) showed once in four runs, on a fast hop from Places to the journey.
  - A GPS fix still outranks a place picked by hand, as before; F3 owns location.
  - The Today, Arrival and transport screens still read the anchor, not the picked place.
  - The new strings are English only.
  - A picked place is saved through the store's debounced save: a CDP `Browser.close` without a reload lost it in a probe. Real launches flush on `pagehide`.
  - The preview entry `mekong-f1` (8961) is in the parent folder's shared `.claude/launch.json`, uncommitted there like the others. `mekong-f1-before` (8962) points at a removed worktree.
- Carried from M4b-1:
  - Proven in fixture mode only. Production still answers `market_closed` (`market_open` is false) and holds no real listing.
  - The driver is not in the repo: `~/Library/Caches/mk-m4b1/drive.py` and `cdp.py` (stdlib), with `signin_return.py`. Run with `MX_PORT=<port>`; `MX_THEME` and `MX_WIDTH` narrow it.
  - "Reset everything" in Settings does not clear recent searches (`mk-market-recent` in `localStorage`).
  - With a city chosen, price sorts still compare across currencies where one city's listings mix them (Cambodia: USD and KHR).
  - The fixture's `&tester=1` opens search even signed out; the server needs a tester's session. The tester states were measured signed in.
  - The new strings are English only. The ride drawing reads as a van more than a tuk-tuk.
  - The preview entries `mekong-m4b1` (8954) and `mekong-m4b1-before` (8955) are in the parent folder's shared `.claude/launch.json`, uncommitted there like the others. The `m4b1-before` worktree was removed.
- Carried from M4a:
  - The Advisor's warnings were not itemised (the owner reported 0 Errors). Whoever next opens `.../advisors/security` should confirm the expected list.
  - Nothing has been posted on production and `market_open` is false, so no real listing has been read back. M4b's live check ("the owner and a tester see each other's listings") needs the carried M3b checks first: the owner's user id in `private.admins` and `private.testers`.
  - The Thai, Vietnamese, Khmer and Lao block terms are unchecked by a native speaker (none available, owner 2026-10-19).
  - `001_rls.sql` now fails two catalogue lines after 002 (which functions `anon` and `authenticated` may execute); its header says so, and `002_rls.sql` repeats the catalogue for the whole schema.
  - A list of four 2-digit sizes ("38 39 40 41") reads as a phone number and is refused; a person can still write a number in words. The report path is the second line of defence (`docs/EXCHANGE.md` §8).
  - `market_search` price sorts compare amounts across currencies (a dong price sorts above a baht price); pair them with a city or a currency in the screens.
  - `market_listing` returns the owner's month of joining (`member_since`, "YYYY-MM"): M4b asked for "member since", and it is a weak fingerprint across one person's listings.
  - `service_role` keeps Supabase's default table grants and can read `owner`. By design; the migration does not revoke it.
  - Supabase's own `rls_auto_enable` shows as an Advisor warning. It is an event-trigger function, not callable through the API; the tests skip it and the migration leaves it alone.
  - The fixture's typo match and word splitting approximate the server's (`pg_trgm`, the default text-search parser): a dotted token such as "3.5" is two words in the fixture and one on the server.
- Carried from M3b:
  - Renaming a profile now has its rate limit (3 a day), proven only once 002's test has run.
  - The Market's new strings are English only. "Send a new code" returns to the form, because each code needs a new robot check.
  - The iOS wrapper shows the honest gate ("open www.mekonging.com in Safari or the Home Screen app"). It was proven by `signInPlace('mekong:', ...)` in `validate.mjs`, not on a device.
- Carried from M3a:
  - In the iOS wrapper, OCR from `mekong://` (a blob worker's `importScripts` through `WebSchemeHandler`) is untested. Check Point & translate at the next wrapper build.
  - Offline OCR after first use is untested. The `.traineddata.gz` files are not in the service-worker manifest.
- Carried from D5 Laos:
  - Homepage-only records: 21 (th 1, vi 7, kh 5, la 8, all filed `open`). Unsourced routes: 0. 2 place records still name a source with no URL: th (`th-ext-rca-royal-city-avenue`, `th-ext-nimmanhaemin-road-bar-scene`). Edit them by hand: `--install` refuses them.
  - Who tourismlaos.org is: its footer names the Tourism Marketing and Promotion Department of the Ministry of Culture and Tourism, so it is the ministry's own site. 46 leftover entries in 8 data files still carry the label "Lao National Tourism Administration" (and 4 say "Ministry of Information, Culture and Tourism"). See Open decision 13.
  - tourismlaos.org's robots.txt disallows every crawler except Googlebot. Nothing was crawled: pages were found through search and read once each in the in-app browser. Its province pages keep the per-attraction text in hidden "Read more" blocks, so read them with `document.body.textContent`, not `innerText`. Two Tourism Laos posts that look like pages about a place are reposts and were not cited as its own pages: the 2023 Patuxay post credits wearelao.com, and the 2025 Black Stupa post credits the Laotian Times.
  - Discover Laos Today is a booking platform ("supported by Laos Tourism Board"). Its pages are cited only for Tad Katamtok and Tad Yuang, where the card already cited it. Its sitemap omits some pages (Tad Katamtok is not in it).
  - Cards that disagree with the page now cited, left unchanged:
    - Tad Champee: Wikivoyage gives a 30,000 kip entry and the card 10,000 to 20,000. Tad Yuang: Wikivoyage 40,000 kip.
    - Tad Katamtok: the Discover Laos Today page puts it in Sekong Province, about 47 km east of Paksong, and the card says Paksong (coordinates 15.07, 106.30, unchecked). Tourism Laos's Xekatam Waterfall (100 m, Huay Katam River) is probably the same fall but does not use the card's name, so it was not cited.
    - Plain of Jars Site 2: Tourism Laos gives 20 km south-west of Phonsavan on one section and 25 km south in another, and the card says 25 km. Wikivoyage's Site 2 entry is 30,000 kip against the card's 10,000 to 20,000.
    - Savannakhet Dinosaur Museum: the Lao article says 8:00 to 12:00 and 13:00 to 14:00, Wikivoyage 08:00 to 11:30 and 13:30 to 16:30, and the card 08:00 to 12:00 and 13:00 to 16:00.
    - Mekong slow boat: Wikivoyage gives 200,000 kip to Pak Beng and 400,000 to Luang Prabang (Dec 2024), and the card's low is 500,000.
    - Vang Vieng rentals: Wikivoyage gives bicycles at 60,000 kip and motorbikes at 170,000 to 200,000, and the card says scooters from about 60,000. It names no buggies.
    - Pakse to Thakhek: Wikivoyage says 8 to 9 h; 12Go shows 7 h on a sleeper; the card says 6 to 7.5 h.
  - Thin matches, kept because each page names the place: the Thakhek night market (Wikivoyage names night food stalls, no grills), the Thakhek square guesthouses (the square is named in Eat, not in Sleep), the Nong Khiaw homestays (no host named), Vientiane long-stay (one serviced-apartment block), Vang Vieng riverside bars (Travelfish names a sunset bar, not the riverside decks), and the Bolaven coffee tour (a province page, not an operator).
  - Coordinates not checked: the Tad Champee and Tad Yuang cards sit within 0.3 km of each other (15.192, 106.128 and 15.19, 106.13) although Wikivoyage puts them 38 and 40 km from Pakse. The Wikipedia coordinate for Champasak town (14.84, 105.75) is about 14 km from the card's (14.8933, 105.8722) and looks wrong; the card was kept. The Wikipedia and Wikidata coordinate for That Sikhottabong (Q7711276) is in Thailand; it was not fixed upstream.
  - No operator page was reachable for the six routes. Lao Airlines' schedule pages name neither Phonsavan nor Savannakhet in their text, and `kpl.gov.la` (the Lao news agency's report on Southern Bus Station fares) does not load from here. Wikivoyage names Lao Airlines, Lanexang Airways and Lao Skyway for the Phonsavan flights.
  - Hosts that block curl and were read in the in-app browser: 12Go, UNESCO, Travelfish, Tourism Laos (robots.txt). The 12Go page title appears a step late in the tab list; read `document.title` after a short wait.
- Carried from D5 Cambodia:
  - Who tourismcambodia.com and .org are (Open decision 11). tourismcambodia.org's own About page calls it "an independent guide" that earns booking commission; tourismcambodia.com sells tours and hotels. The ministry's own sites are tourism.gov.kh (script-rendered) and visitcambodia.com (Cloudflare). 50 leftover entries in 6 data files still carry a "Ministry of Tourism" label on these two hosts.
  - Citations that cannot be read from here, or are broken: `cambodia.panda.org` (certificate mismatch), `wildlifealliance.org/chi-phat-ecotourism/` (404), `travelguide.michelin.com` (does not resolve), `angkorenterprise.gov.kh` and `visitcambodia.com` (Cloudflare).
  - Cards that disagree with the page now cited, left unchanged: Long Beach (Sok San) and Long Set Beach (4K Beach) may be one beach (Open decision 12); Yeak Laom's direction from Banlung; Kampot Night Market is mostly clothes; Kratie to Banlung lists only buses on 12Go; Phnom Sampov's page is Sampeou Mountain; Ka Tieng Waterfall's page has no figures.
  - No Cambodian operator page was reachable for Kampot to Kep, Kampot to Sihanoukville or Kratie to Banlung.
  - Pages cited for stay and food clusters name the place or street but do not support the card's prices. The check was that the page names the place; figures were compared only where noted.
  - The preview entries `mekong-d5kh` and `mekong-d5la` are in the parent folder's shared `.claude/launch.json`, uncommitted there, like the other entries.
- Carried from D5 Vietnam and Thailand:
  - 7 Vietnamese records are filed `open`, and Nan Walking Street stays `open`.
  - On 12Go, the `dalat` slug serves an empty "Travel Options" placeholder; the real slug is `da-lat`. Check a page's title before citing it.
  - Banh It Cham Towers: the card says 11th to 12th centuries, and Wikivoyage says 10th to 11th. The card is unchanged.
  - La Siesta's cited `www.lasiestahotels.com` homepage returns Cloudflare 526. The bare domain works and is cited.
  - Airline route pages were not tried for the Vietnamese and Thai flight options; 12Go lists the flights.
  - 12Go headline fares are live and date-dependent. They back operators, modes and durations better than fixed fares; no fares were changed.
  - English Wikipedia's Huai Nam Dang infobox places the park about 55 km from the viewpoint (an error in the article). Pong Dueat hot springs' coordinates (19.28, 98.63) are rounded and were not checked.
- Carried from Q1 (all in `docs/AUDIT_375.md`, nothing fixed):
  - The audit driver is not in the repo. It is in the shared notes folder (see the Q2 prompt).
  - Empty states only, `th` only for `{cc}` routes, no detail screens or sheets. The base moved after the audit and was not re-measured.
  - `scripts/route-sweep.js` flags 170 zero-size controls on `#weather-th`; they are `content-visibility` artefacts. Its `EXTRA` list has no `#market`.
  - The `#map` `getSource` exception was seen in 1 of 3 light loads and 0 of 3 dark loads.
  - 66 of 77 routes carry body controls under 44 px; the dark calendar's selected day is 1.21:1; the journey credits panel covers 16.6% of its map.
- Carried from D4:
  - 512 places have no `localName` (th 153, vi 125, kh 92, la 142). There is no OpenStreetMap name lane: Overpass fails from this machine and Nominatim name search found a native name for 1 of 12 places. Nominatim does resolve coordinates by name (D5 Laos used it).
  - Cards mix the newer native-only names with older "native · romanisation" values.
  - Six activity cards carry the venue's name, and the Ho Chi Minh Mausoleum Complex card carries the mausoleum's.
  - `fetch-place-photos.py` still exits 0 when lookups fail.
- Carried from the exchange slices and earlier:
  - The top ~3 px of the tab bar show content scrolled beneath the retro stripe.
  - The unseen-notifications badge waits for M5.
  - The on-phone board's chip labels (Items, Rooms, Rides, Cash) are English only. Inside its fold on `#market-items`, two board chips show as pressed.
  - "Traveller board" remains on the Travel circle card and the Near me chip. Malay "Laman utama" is truncated in the tab bar.
  - Two Vietnamese photos are archival black-and-white images. The Museum of Cham Sculpture credit reads "Unknown authorUnknown author".
  - Eight Vietnamese activity cards use their landmark's image.
  - Some Cambodian and Lao photos are flagged: the Skuon vendor, the Muang Sing market faces, Tonle Bati showing the lake, and Phare Circus not fetched.
  - Tall portrait photos are uncapped (Phanom Rung is 548 px at 375 px wide).
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - `js/main.js` is 7,558 lines; the ceiling is ~1,500.
  - The main checkout is behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.


## Open decisions (need the user)
Closed on 2026-10-25: which places F1 keeps (the owner: places with a population, as complete as possible without a long list). Closed on 2026-10-24: 20 (the owner widened the Thai report into the language work F5 and L1 to L5). Closed on 2026-10-19: 9, 11 and 12 (earlier that day), 15 to 18 (D5 tidy after M5; the city-depth order; M5 right after M4c; visitors may browse, which gates on M9), and during M4a: "kush" and "gun" allowed in names, no native speaker available, the closed beta stays closed to visitors.

The numbers below keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
8. Legal, for Omer Hanegbi or Omri Siri: the questions in `docs/EXCHANGE.md` §14, including item 8 (photos uploaded by travellers) and item 5 (the privacy policy must say that listings are public before visitors read them), and the dispensary question in `docs/PLAN.md`, Bangkok build-out. The terms and privacy policy gate M9 (opening to everyone); cash swap gates M10.
10. Topbar icon spacing: the title column has 102 px, so a 44 px pitch costs title width. Recommended: leave the topbar until Q3 to Q5 are done, then test a wider pitch against the nine longest titles.
13. Relabel the 46 leftover "Lao National Tourism Administration" entries (and 4 "Ministry of Information, Culture and Tourism") on tourismlaos.org as "Tourism Laos"? This is data text only, and it bumps the version. Recommended: yes, inside D5 tidy.
14. Add a coordinates check slice? D5 Laos checked 2 of 185 Lao pins, and both were wrong. Recommended: yes, one country per session, starting with Laos's remote sites, flagging any record more than 2 km from its OSM object.
19. Install `pglast` (a PostgreSQL parser for Python, from PyPI, a few MB) so a future session can syntax-check SQL and PL/pgSQL before the owner pastes it? It parses only; it runs no database. Recommended: yes. It would have caught the type of mistake this slice's reviewer found by reading.
21. Widen the place list for Laos to every village (13,388 places, 91 KB compressed, under the 250 KB cap)? The picker shows at most six matches at a time, whatever the list holds, so a longer list does not mean more scrolling, which was the concern behind the ruling. Recommended: yes for Laos, where villages (ban) are the administrative unit and GeoNames gives almost none a population. Leave Vietnam (275 KB for every populated place, over the cap) until a traveller reports a missing place. It is one rule in `scripts/build-gazetteer.py`.
22. The curated "Trat" anchor sits on Ko Mak, 47.4 km from Trat town. Recommended: check it inside the coordinates slice (decision 14), together with the records filed under city "Trat", before moving or renaming it, because a rename changes which records Nearby shows.
23. Add `js/market-routes.js` and `js/market-link.js` to `PRECACHE` and `check-offline-boot` to CI? Recommended: yes, riding along with F2 (two lines in `sw.js`, one in `guards.yml` and the scripts README).

## Next session prompts
Order (owner, 2026-10-24): **F1 (built, PR #132), F2, F3, F4, F5, L1, L2, L3, L4 (the traveller fixes and the language work), then M4b-2**, then M4c, M5, then L5, then D5 tidy, then Bangkok B1 to B8, then city depth C1 onward (Chiang Mai, Hanoi, Ho Chi Minh City, Siem Reap, Phnom Penh, Luang Prabang, Da Nang and Hoi An, Vientiane). Each releasing slice stacks on the merged tip of the one before. Q2 (tools only) can run alongside any of them. The F and L slices are written out in `docs/PLAN.md`, "Traveller fixes and language work".

### F2: Your journey, the whole world, fully editable (next)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md (owner rulings, then F2). Run /slice for slice F2: Your journey on a world map, every stop editable.
> **Start.** `git fetch`; `gh pr list --state all`. PR #132 (F1) must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice` on `feat/f2-journey-world`. Reproduce first: at 375 px the journey map is fenced to the region, and a stop from a journal entry has no edit control.
> **What F1 left for F2.**
> - "Add a stop you missed" already uses F1's picker. `spotForKey(key)` returns a list place `{ gz: true, country, city, lat, lng, local, prov, kind }`, and `addTrailStop()` takes its `lat`, `lng`, `city` and `country` as they are.
> - The journey's empty state returns before that button exists. Offer it there too.
> - `setPlacePin(spot)` on the `initMap` controller (`js/map.js`) draws one titled pin. The search box is `locationSelect()`, and the matching is `findPlaces()` in `js/place-search.js`.
> - Decision 23 (two `PRECACHE` lines and the offline-boot guard in CI) is recommended to ride along.
> **Pitfalls.**
> - CDP clip coordinates are page coordinates: after scrolling, capture from `scrollY`.
> - `Browser.close` fires no `pagehide`, so reload before closing a profile that a later run reuses.
> - `mount()` folds sections: open the `<details>` around a control before measuring it.
> - The F1 driver is `~/Library/Caches/mk-f1/drive.py`. Copy its pattern.
> **Done when.** The F2 "Done when" in docs/PLAN.md holds in headless Chrome over CDP at 375 px, light and dark; every guard and `jsc -m scripts/validate-jsc.mjs` pass; the PR is open. Then run /handoff.
> **Out of scope.** The share-journey file format beyond carrying the new stops, automatic location (F3), the recap (F4).

### F3 to F5, then L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <F3 to F5 or L1 to L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code.
> F5, L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.

### M4b-2: the marketplace redesign, post side
> Read CLAUDE.md, docs/HANDOFF.md, DESIGN_SYSTEM.md, and docs/EXCHANGE.md §3, §8, §9, §16 and §17 (M4, M4b-1 built, and M4b-2). Run /slice for slice M4b-2: the marketplace screens, post side.
> **Start.** `git fetch`; `gh pr list --state all`. L4 must be merged (owner, 2026-10-24: the traveller fixes and the language work come first), and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice` on `feat/m4b2-market-post`.
> **Where M4b-1 left the hooks.** The Post button (`.mxh-post` in `js/screens/market-home.js`) opens `postSoonSheet` from `js/screens/market-parts.js`: replace it with the forms. Reuse `listingCard` and `artNode` (`js/market-art.js`) for the live preview, `signInSheet('post', hash)` for a signed-out poster (it returns after sign-in), and `KIND_META`, `CATEGORY_LABEL`, `citySelect` and `CURRENCY_FOR` from `market-parts.js`. Styles go in `css/market.css`. The listing page's ⋯ menu says "My listings, coming in the next update" on the traveller's own listing: link it.
> **Scope.**
> 1. Post forms (`#market-new-<kind>`), reached from the home's Post button:
>    - a short stepper per kind (item, meetup, room, ride), with a live card preview built from M4b-1's card and artwork;
>    - client checks that mirror the server's: the kind and intent pairs, the window caps, prices, seats, cities, and the contact-detail rule. Server errors map through `listingErrorText`;
>    - the posting contract: `postListing` picks the id, inserts with `return=minimal` and reads the row back.
> 2. My listings (`#market-mine`): status chips (open, closed, "under review" for hidden, ended), and close and delete through `confirmAction`.
> 3. The live check needs the carried M3b owner checks first, walked through one small step per message:
>    - the owner signs in on the iPhone Home Screen app;
>    - their user id goes into `private.admins` and `private.testers`;
>    - a second tester is available (EXCHANGE §16, from M4).
> **Pitfalls.** Headless Chrome needs `--no-sandbox` and a profile outside `/private/tmp` (CLAUDE.md). M4b-1's driver, `~/Library/Caches/mk-m4b1/drive.py` with `cdp.py` beside it (not in the repo), measures every state at 375 and 1280 px on three themes; copy its pattern. The router renders twice at start-up: after every await, check `isConnected`.
> **Done when:**
> - The post form for each kind, and My listings, render at 375 px and at 1280 px, in light and dark, on the default skin and one dark skin.
>   - Each has 0 overflow, 0 console errors, 0 CSP violations and 0 body controls under 44 px.
> - A fixture post of each kind round-trips into search and into My listings.
> - On production, the owner and a tester each post one listing and see each other's.
> - Every guard and the validator pass, and the PR is open. Then run /handoff.
> **Out of scope:** photos (M4c), messages and block (M5), matching (M6).

### M4c: listing photos
> Read CLAUDE.md, docs/HANDOFF.md, and docs/EXCHANGE.md §2 (photos), §10, §13, §14 (item 8) and §17 (M4c). Run /slice for slice M4c: listing photos.
> **Start.** `git fetch`; `gh pr list --state all`. M4b-2 must be merged. Read the current Supabase Free limits for Storage size and egress from supabase.com/pricing, and cap photos per account to fit them. Worktree on `feat/m4c-photos`.
> **Scope.**
> 1. Migration 003 (renumber the later slices' migrations in §17):
>    - a private bucket;
>    - `storage.objects` rules: upload only under `<uid>/<listing id>/` by the listing's owner while it is open; read by anyone who can see the listing, visitors included (owner ruling 2026-10-19); delete by the owner;
>    - at most 3 photos per listing, purged with the listing;
>    - a reported listing's photos hidden with it.
> 2. Client:
>    - pick from the camera or the library;
>    - resize on a canvas to at most 1280 px on the long side and re-encode at about 300 KB, which drops the metadata, GPS included;
>    - upload progress, and required alt text;
>    - show photos by an authenticated fetch into a `blob:` URL (`img-src` already allows `blob:`), held in memory only, never stored (§2);
>    - the first photo replaces the artwork on the card, and the listing page shows a gallery.
> 3. A test in the 001 pattern for the storage rules.
> **Pitfalls.**
> - There is no automated image scanning on the Free tier. Say so in the PR, and keep the report path one tap away.
> - Before the market opens to everyone, §14 item 8 must be answered (M9).
> **Done when:**
> - The SQL test shows a stranger cannot upload into another person's folder or read the photos of a hidden or ended listing.
> - A test JPEG carrying GPS metadata arrives on the server with none (read the stored bytes back).
> - The gallery renders at 375 px in light and dark, with 0 overflow and 0 errors.
> - The owner uploads from the iPhone, and a tester sees the photo.
> - Every guard passes, and the PR is open. Then run /handoff.

### M5: messages, block and live alerts (right after M4c)
> Read CLAUDE.md, docs/HANDOFF.md, and docs/EXCHANGE.md §2 (Realtime), §3 (threads, messages, blocks, notifications), §4, §8 (messages), §9, §13 and §17 (M5). Run /slice for slice M5.
> **Start.** `git fetch`; `gh pr list --state all`. M4c must be merged. Worktree on `feat/m5-messages`.
> **Scope.**
> - The next migration: `threads`, `messages`, `blocks` and `notifications` (added to the `supabase_realtime` publication), `market_start_thread`, `market_block_owner`, and the message triggers. Messages reject URLs and allow phone numbers, with the safety line.
> - `js/market-realtime.js`: a small Phoenix WebSocket client with a polling fallback. Add `wss://xnruspjauhmcrqxmjmxg.supabase.co` to `connect-src`, which M3b deliberately left out.
> - The inbox, conversation and blocked-people screens in M4b's design language, "Message" switched on in the listing page, and the tab badge (§11).
> **Pitfalls.** The same as M4a (draft PR until the owner's SQL passes; no local Postgres; the escape quirk), and the double render at start-up for live screens.
> **Done when:**
> - The RLS tests show a non-participant reads nothing and a blocked pair cannot message.
> - A tester's message reaches the owner's open app in under 5 seconds without a reload, with the tab badge showing 1 at 375 px.
> - After a block, neither side can send, and the conversation shows as closed.
> - Every guard passes, and the PR is ready. Then run /handoff.

### D5 tidy (after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the Release order and D5 sections of docs/PLAN.md. Run /slice for slice D5 tidy.
> - Relabel the 50 entries in 6 data files that cite tourismcambodia.com or tourismcambodia.org as "Ministry of Tourism" to "Tourism Cambodia". Change no URL; treat tourism.gov.kh as the ministry.
> - If the owner agrees (open decision 13), relabel the 46 "Lao National Tourism Administration" entries and the 4 "Ministry of Information, Culture and Tourism" entries on tourismlaos.org to "Tourism Laos".
> - Compare the coordinates of Long Beach (Sok San) and Long Set Beach (4K Beach) with Wikivoyage's Koh Rong section and the island's map. If they are one beach, merge them with a `js/data/place-merges.js` line in the same commit, and give the merged card a citation.
> - Done when: no "Ministry of Tourism" label remains on either Cambodian host; the beach decision is recorded with its evidence; the affected cards show correctly at 375 px in headless Chrome; all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> - Out of scope: other citations, photos, Bangkok.

### Bangkok B1, Old City and Rattanakosin (then B2 to B8 in the same shape)
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" section of docs/PLAN.md. Run /slice for slice B1: Old City and Rattanakosin.
> - Count Bangkok's records by category first (40 of 293 Thai places). Run `check-place-dupes.py` before adding: a name collision silently deletes travellers' saved data.
> - Add the district's records in a new file, `js/data/places.th.bkk.rattanakosin.js`, with one loader line in `js/data/regions.js` next to `PLACES_TH` and `PLACES_TH_EXT`. Ids are `th-bkk-<slug>`.
> - Cover every category in the plan that fits the district, the practical ones included (health, errands, daily shopping, visa and living).
> - Each record ships complete: a Thai-script `localName`, page-level `sources` (the venue's own page or its Wikipedia article first), `hours`, a price tier, `coords` and `tips`. A photo comes only from the place's own Wikipedia article. Hold dispensaries out.
> - Done when: Bangkok records for the district are counted by category before and after; every new record passes `check-place-fields.py --assert`; 10 sample cards show correctly at 375 px in headless Chrome over CDP; all guards and `jsc -m scripts/validate-jsc.mjs` pass; the pack size is reported before and after if photos were added; the PR is open into `feat/scaffold-bangkok-slice`.
> - Out of scope: the other districts, dispensaries, D6 fields beyond the `afterDark` contract.
>
> For B2 to B8, swap the district, the file name (`places.th.bkk.<district>.js`) and the slice number. The district order is in docs/PLAN.md: B2 Chinatown and Yaowarat, B3 Siam, Pratunam and Ratchathewi, B4 Sukhumvit, B5 Silom, Sathorn and Bang Rak, B6 Riverside and Thonburi, B7 north and the outskirts, B8 a gap sweep and the 300 reassessment. B2 onward adds only a file and a loader line.

### City depth C1, Chiang Mai (then C2 onward in the same shape)
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" and "City depth" sections of docs/PLAN.md. Run /slice for slice C1: Chiang Mai.
> - Count Chiang Mai's 33 records by category, and run `check-place-dupes.py` first.
> - Add new records in `js/data/places.th.chiangmai.js`, with one loader line in `js/data/regions.js`, and ids `th-chiangmai-<slug>`. Existing records stay where they are.
> - Apply the Bangkok rules: every category, complete at creation, page-level sources, photos only from the place's own Wikipedia article, no dispensaries, and adult nightlife as factual area entries only.
> - Target: double the city's records in the first pass, and record what is still missing.
> - Done when: the same done-when as a B slice, for Chiang Mai.

### Q2: commit the audit driver (tools only, no version bump, can run alongside any slice)
> Read CLAUDE.md, docs/HANDOFF.md and docs/AUDIT_375.md (Method and limits; Proposed fix slices). Run /slice for slice Q2: add the driver under `tools/audit-375/`.
> - The files are in `/Users/zim/Library/Application Support/Claude/side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/q1-audit-driver/`. The M3b CDP client (`m3b-cdp/cdp.py`, stdlib only) is in the same folder and may replace the driver's own client.
> - Make one command print the headline table and the per-route tables for both themes. It must refuse a load where `document.hidden` is true, and it must keep the display awake (`caffeinate -d`).
> - Done when: a clean worktree reproduces the headline numbers in `docs/AUDIT_375.md` and the script is documented.
> - Out of scope: fixing what the audit finds.
