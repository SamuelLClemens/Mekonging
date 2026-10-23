# Handoff — 2026-10-24 (M4a merged; M4b split in two)

**Since the M4a handoff below:**
- M4a merged as af2e9fe (PR #127, 2026-10-23 20:56 UTC). www.mekonging.com serves `mk-v0.646.0`.
- On 2026-10-24 the owner split M4b in two (`docs/EXCHANGE.md` §16 and §17):
  - **M4b-1, browse:** the artwork, the new home, search and filters, the listing page and the closed-beta preview.
  - **M4b-2, post:** the post forms, My listings and the live owner-and-tester check.
  - Each is one PR and one fresh session; the prompts are below.
- Nothing was built for M4b yet. The branch name `feat/m4b-market-ui` was not used: the prompts name `feat/m4b1-market-browse` and `feat/m4b2-market-post`.

## The M4a handoff (2026-10-23, slice M4a: listings and search, server side)

## Shipped
- **Built and proven, awaiting the owner's merge:** M4a, branch `feat/m4a-listings`, [PR #127](https://github.com/SamuelLClemens/Mekonging/pull/127) (`mk-v0.646.0`). The owner ran `002_listings.sql` and `supabase/tests/002_rls.sql` in the SQL editor, and the test's second run printed `PASS summary: 314 checks, 0 failed, nothing kept`; the output is in the PR ([comment](https://github.com/SamuelLClemens/Mekonging/pull/127#issuecomment-6374419083)). [PR #126](https://github.com/SamuelLClemens/Mekonging/pull/126) (docs and 001b) merged first, as 6742a29. The PR is marked ready once CI passes on the handoff commit.
  - `supabase/migrations/002_listings.sql` (pure ASCII, one transaction, decisions in its header):
    - the enums, `listings`, `reports`, `blocks` (table and policies only, nothing granted until M5) and `private.name_changes`;
    - BEFORE triggers: the kind, intent, field, price and window rules (`NaN` refused), the §8 text check, the contact-detail check (phones of 8 or more digits with Thai, Lao and Khmer digits, emails, URLs, bare domains, `@handles`, messenger names), `updated_at`, the §9 rate limits (including a new account's lower limits) and the 3-a-day name-change limit;
    - AFTER triggers: a flag term files a `filter` report; report weight counts distinct reporters whose accounts were 24 hours old plus system flags, one lock per listing, and the listing is hidden at 3;
    - `private.today()`, `private.search_fold()` (a light fold for search: accents out, digits kept), `private.contact_hit()`, `private.listing_json()` (the one list of columns that leave the server: no `owner`), and the helpers `private.owns(id)`, `private.can_see(id)`, `private.can_post(kind)`, `private.owner_ok`, `private.blocked`;
    - `market_search` and `market_listing` (callable by `anon`; they answer `market_closed` to visitors and non-testers until `market_open` is true) and `market_my_listings`;
    - column grants that make `owner`, `report_weight`, `search` and `search_text` unreadable and unsettable by any role, and the §4 policies, which never name `owner`;
    - "kush" and "gun" no longer block display names (`private.filter_terms.in_names`).
  - `supabase/tests/002_rls.sql`: one rolled-back block, PASS or FAIL per check, then a summary line. About 300 checks (the summary line gives the exact number). Pure ASCII.
  - `js/market-listings.js` (search, one listing, my listings, post, close, delete, report; imports only names `market-api.js` already exports, so an open app holding the old copy is safe) and `js/market-fixture-listings.js` (47 visible listings in 4 kinds and 17 cities, free, paid and no-price rows in 5 currencies, Thai, Vietnamese, Khmer and Lao titles, an 80-character title, and the rows that must never show: an ended listing, an under-review owner, and the traveller's own closed and hidden listings).
  - `scripts/check-market-sql.py` (new guard; README row; `guards.yml`): see Verified.
  - `docs/EXCHANGE.md`: §3 to §4 (the RPC table, the owner-free policies and the posting rule), §8 (the two names, the messenger list, the contact-detail rules), §16 (three rulings) and §17 (M4a built).
- **Posting contract (it changes M4b):** `INSERT ... RETURNING` is refused, because PostgreSQL checks the SELECT policy against a row that does not exist yet and a policy that looks the row up cannot find it. `postListing` therefore picks the id (`newListingId()`), inserts with `Prefer: return=minimal` and reads the row back with `getListing(id)`. Every read must name its columns (`LISTING_COLUMNS`): `select=*` asks for `owner` and fails.
- Owner rulings during M4a (2026-10-19, recorded in §16): the closed beta stays closed to visitors until M9; "kush" and "gun" are allowed in names and refused in listings; no native speaker is available to check the Thai, Vietnamese, Khmer and Lao terms (they ship unchecked).
- Earlier and already merged: M3b (PR #125, `mk-v0.645.0`), M3a (#124), D5 Laos (#122).

## Verified
- **The SQL ran** (the owner, in the SQL editor of project `xnruspjauhmcrqxmjmxg`; no Postgres on this machine):
  - `002_listings.sql`: "Success". `POST /rest/v1/rpc/market_search` and `market_listing` with only the publishable key now answer HTTP 400 `market_closed` (before: 404 `PGRST202`).
  - `002_rls.sql`, first run (2026-10-20): 121 of 314 FAIL, every one a defect in the test, none in the migration.
    - 116 came from the test's own inserts calling `private.today()` as role `authenticated`. 002 revokes that function from clients on purpose, and the test asserts the denial for `anon`.
    - 5 came from three `lines || 'PASS ...'` appends. Postgres reads a bare literal after `||` on a `text[]` as an array literal ("malformed array literal"), which rolled back the rate-limit and report-limit loops, so the limit checks failed in turn.
    - Fix (commit 21b2814, migration unchanged): the inserts use `(now() at time zone 'Asia/Bangkok')::date`, the three literals are cast to text.
  - `002_rls.sql`, second run (2026-10-23): 314 of 314 PASS, 0 FAIL, nothing kept.
  - Security Advisor after 002: the owner reports 0 Errors and only warnings. The warnings were not itemised; expected are the five from 001 plus `market_search`, `market_listing` (definer, `anon`, by design) and `market_my_listings`.
- Checked by reading before the SQL ran:
  - `python3 scripts/check-market-sql.py`: PASS on 5 SQL files. It checks ASCII only (from 002 on), balanced quotes, dollar quotes and brackets, `begin`/`end;` pairs, `begin;` and `commit;`, RLS on every table, `search_path` pinned on every function, every function named in a `revoke execute`, no policy naming `owner`, and runs `contact_hit`'s patterns in Python (30 phrases that must be refused, 28 that must pass). Its negative controls: a deleted quote or bracket is caught about 4 times in 5 (the rest fall in comments or strings); a policy naming `owner`, a table without RLS, a function never revoked, dropping `whatsapp` from the list and allowing leading-zero amounts are each caught.
  - An independent read of both SQL files (a Sonnet reviewer, then each finding checked against the code) found six defects, all fixed: a variable in the test that clashed with a column alias (the run would have aborted at its last line); a race in the auto-hide count (now `pg_advisory_xact_lock` per listing); query words split differently from the stored text (now taken from the same parser); `NaN` accepted as a price; `@8am` read as a handle; a cash filter test that could not fail (a real cash row is now seeded).
  - It could not settle whether a policy expression needs privilege on a column no role may select (the PostgreSQL documentation is silent; the regression tests have no case). So the policies no longer name `owner`: they call `private.owns(id)` and `private.can_see(id)`, which led to the posting contract above.
  - The reviewer ran `contact_hit`'s regexes in Tcl's engine (the same Spencer engine as Postgres) and a 4,000-string fuzz: 3 outcomes differed from the Python mirror and in all 3 the mirror was stricter. The lookbehind constraints could not be run (Tcl 8.5 has none) and are verified by reading.
- `jsc -m scripts/validate-jsc.mjs`: 19,252 of 19,252 checks, EXIT 0 (was 18,470). The new checks cover the fixture against the server's own rules (intent pairs, window caps, prices, seats, cities, no contact details), `fixtureSearch` (the gate, paging, every filter, every sort, typos, accents, scripts without spaces), `fixtureListing`, `fixtureMine`, and the pure helpers. Two deliberate breaks of the fixture search (ended rows visible; `owner` leaking) failed it with 10 and 4 errors.
- All 17 guards pass (`js-syntax` 246 files, `imports`, `lazy-data`, `preloads`, `ui-strings`, `month-arrays`, `contrast`, `skins`, `spacing`, `place-dupes`, `undefined`, `net-gates`, `sources`, `secrets`, `market-sql`), as do `check-place-fields --assert`, `port-themes --check`, `check-cache-version` (manifest regenerated, 258 files) and `build-market-cities --check`. `jsc -m` parses every edited JS file (`main.js` and `sw.js` stop at the expected `navigator` and `self` ReferenceErrors).
- Nothing on screen changed (M4a has no screens), so there is no 375 px proof.
- From the owner's earlier session (M3b, recorded for the record): migration 001 and the repair 001b ran, `001_rls.sql` printed 65 of 65 PASS, and the Security Advisor showed 0 errors and 5 warnings on 2026-10-19: Supabase's own `rls_auto_enable` twice, and `market_delete_account`, `market_join` and `market_me` (definer by design).

## Owner steps for M4a (all done except the merge)
- [x] PR #126 merged (6742a29); #127's own diff shows only M4a.
- [x] `002_listings.sql` run; the probe answers 400 `market_closed`.
- [x] `002_rls.sql`: 314 of 314 PASS on the second run; the output is in PR #127.
- [x] Security Advisor after 002: 0 Errors.
- [x] #127 marked ready and merged by the owner (af2e9fe, 2026-10-23).

## Owner checks for M3b (carried; the first two are done)
- [x] Migration 001 run, repaired by 001b (see the earlier handoff in git, `3f4d32f`), `001_rls.sql` 65 of 65 PASS.
- [x] Security Advisor after 001: 0 errors.
- [ ] The owner signs in on the iPhone Home Screen app by code. Then their user id goes into `private.admins` and `private.testers` (look the id up in Authentication, Users; one line of SQL inserts it into each table).
- [ ] The owner signs in by link in Safari, then deletes a test account there (the app confirms deletion only when Auth refuses the old token).
- [ ] From the first real email: whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has (the input takes 6 to 10).

## Not done / known issues
- New in M4a:
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
  - The router renders a route twice at start-up (carried): M4b's async screens must check `isConnected`.
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
  - Meetups have no chip until M4, and the unseen-notifications badge waits for M5.
  - The Market chip labels (Items, Rooms, Rides, Cash) are English only. On `#market-items` two chips show as pressed.
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
Closed on 2026-10-19: 9, 11 and 12 (earlier that day), 15 to 18 (D5 tidy after M5; the city-depth order; M5 right after M4c; visitors may browse, which gates on M9), and during M4a: "kush" and "gun" allowed in names, no native speaker available, the closed beta stays closed to visitors.

The numbers below keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
8. Legal, for Omer Hanegbi or Omri Siri: the questions in `docs/EXCHANGE.md` §14, including item 8 (photos uploaded by travellers) and item 5 (the privacy policy must say that listings are public before visitors read them), and the dispensary question in `docs/PLAN.md`, Bangkok build-out. The terms and privacy policy gate M9 (opening to everyone); cash swap gates M10.
10. Topbar icon spacing: the title column has 102 px, so a 44 px pitch costs title width. Recommended: leave the topbar until Q3 to Q5 are done, then test a wider pitch against the nine longest titles.
13. Relabel the 46 leftover "Lao National Tourism Administration" entries (and 4 "Ministry of Information, Culture and Tourism") on tourismlaos.org as "Tourism Laos"? This is data text only, and it bumps the version. Recommended: yes, inside D5 tidy.
14. Add a coordinates check slice? D5 Laos checked 2 of 185 Lao pins, and both were wrong. Recommended: yes, one country per session, starting with Laos's remote sites, flagging any record more than 2 km from its OSM object.
19. Install `pglast` (a PostgreSQL parser for Python, from PyPI, a few MB) so a future session can syntax-check SQL and PL/pgSQL before the owner pastes it? It parses only; it runs no database. Recommended: yes. It would have caught the type of mistake this slice's reviewer found by reading.

## Next session prompts
Order (owner, 2026-10-19; M4b split on 2026-10-24): **M4a is merged; next M4b-1, then M4b-2, M4c, M5**, then D5 tidy, then Bangkok B1 to B8, then city depth C1 onward (Chiang Mai, Hanoi, Ho Chi Minh City, Siem Reap, Phnom Penh, Luang Prabang, Da Nang and Hoi An, Vientiane). Each releasing slice stacks on the merged tip of the one before. Q2 (tools only) can run alongside any of them.

### M4b-1: the marketplace redesign, browse side
> Read CLAUDE.md, docs/HANDOFF.md, DESIGN_SYSTEM.md, and docs/EXCHANGE.md §2, §11, §13, §16 (the 2026-10-19 and 2026-10-24 rulings) and §17 (M4 and M4b-1). Run /slice for slice M4b-1: the marketplace screens, browse side.
> **Brief (owner, 2026-10-19).** The Market must look and feel like a modern marketplace: Facebook Marketplace, eBay, Amazon. It should be beautiful, modern, fun to look at and fun to use, with search, pictures and the app's own links. It is still a closed beta for testers. The post side (post forms, My listings) is M4b-2 (owner ruling 2026-10-24).
> **Start.** `git fetch`; `gh pr list --state all`. PR #127 (M4a) and the `docs/m4b-split` PR must be merged, and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice` on `feat/m4b1-market-browse`.
> **Scope.**
> 1. Category artwork:
>    - one illustration per kind (item, meetup, room, ride) and per item category (`ITEM_CATEGORIES`, 10), 14 in all, in the house style (DESIGN_SYSTEM.md, Mekong Retro), self-hosted;
>    - an SVG loaded through `<img>` cannot read the skin's CSS variables, so build them as inline SVG in a new lazy module (for example `js/market-art.js`) whose fills are theme tokens, so all 11 skins read well;
>    - no stock photos and no hotlinking. Report the total bytes.
> 2. Market home (`#market`):
>    - a sticky search bar, kind tabs (Items, Meetups, Rooms, Rides) and category tiles with artwork;
>    - city and date chips, and a prominent "Post" button. Until M4b-2 ships, it opens an honest sheet: posting to the shared market arrives next, and the board on this phone works now;
>    - a picture-led card grid, two columns at 375 px and more at 1280 px: artwork, the price through `money()`, "Free" instead of "฿0", a two-line title, the city and date window, the kind colour;
>    - skeleton cards while loading;
>    - the link-based board folded under "On this phone" (§11).
>    - Three audiences, all designed:
>      - a tester, who browses;
>      - a visitor, or a signed-in non-tester, while the market is closed. The server answers `market_closed`, so show an inviting, honest closed-beta preview built from the artwork, with sign-in for testers;
>      - anyone once the market opens (M9), when visitors browse without an account.
>    - Sign-in appears on actions, as a sheet that returns the traveller to what they were doing.
> 3. Search:
>    - debounced live results;
>    - a filters sheet: kind, category, city, dates, a price range with its currency, free only;
>    - sorting: offer the price sorts only with a currency or a city, because the server compares amounts across currencies;
>    - a result count, and active-filter chips that clear in one tap;
>    - an empty state with suggestions;
>    - recent searches kept on the phone, as a convenience outside the store. Never store anything another traveller wrote.
> 4. The listing page (`#market-l-<id>`):
>    - the hero artwork (photos come in M4c), the price, chips, the body, and the kind's safety line;
>    - "A traveller · member since …", as the month only. M4a notes it is a weak fingerprint across one person's listings;
>    - app links only: the city's guide, nearby places, and the scam and safety pages;
>    - Report in a ⋯ menu (`reportListing`, `REPORT_REASONS`, `listingErrorText`);
>    - Block left out until M5, where its RPC lands: no dead controls;
>    - "Message" shown with an honest line until M5.
> 5. Motion: tasteful press and transition feedback that respects `prefers-reduced-motion`.
> **Rules.**
> - New lazy modules (for example `market-home.js`, `market-search.js`, `market-listing.js`, `market-art.js`), each under about 1,500 lines. `main.js` gets registration lines only.
> - Tokens only (`check-spacing`, `check-contrast`), and 44 px targets.
> - Remote text renders as text only. Personal values carry `data-no-i18n` and `data-no-mt`.
> - Nothing another traveller wrote is stored on the phone (§2).
> - Every gate still renders something (`check-net-gates`).
> **Pitfalls.**
> - The router renders a route twice at start-up: after every await, check `isConnected`, and share in-flight work.
> - Fixture mode is `?market=fixture` on 127.0.0.1, with M4a's data (`js/market-fixture-listings.js`). The market is closed in the fixture as on the server: add `&open=1` for everyone, or `&tester=1` to make the signed-in traveller a tester.
> - Make every listing call through `js/market-listings.js`: explicit columns (`LISTING_COLUMNS`), and print `listingErrorText(err)`, never a server message.
> - Use the M3b CDP driver (`side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/m3b-cdp/`, a stdlib client) for real layout and screenshots. The Turnstile token is in `input[name=cf-turnstile-response]`.
> - Anything the owner pastes goes through `LANG=en_US.UTF-8 pbcopy` and a byte compare. The Write tool decodes a typed backslash-u escape.
> **Done when:**
> - At 375 px and at 1280 px, in light and dark, on the default skin and one dark skin, these screens render:
>   - home: the closed preview, tester browsing, and the open-market visitor;
>   - results with a query, and with filters;
>   - the filters sheet, the listing page and the report sheet;
>   - the empty and offline states.
> - Each has 0 overflow, 0 console errors, 0 CSP violations and 0 body controls under 44 px, and `check-contrast` passes.
> - Before and after screenshots of `#market` are in the PR.
> - Every guard and the validator pass, and the PR is open. Then run /handoff.
> **Out of scope:** post forms and My listings (M4b-2), photos (M4c), messages and block (M5), matching (M6).

### M4b-2: the marketplace redesign, post side
> Read CLAUDE.md, docs/HANDOFF.md, DESIGN_SYSTEM.md, and docs/EXCHANGE.md §3, §8, §9, §16 and §17 (M4 and M4b-2). Run /slice for slice M4b-2: the marketplace screens, post side.
> **Start.** `git fetch`; `gh pr list --state all`. M4b-1 must be merged, and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice` on `feat/m4b2-market-post`.
> **Scope.**
> 1. Post forms (`#market-new-<kind>`), reached from the home's "Post" button (replace M4b-1's interim sheet):
>    - a short stepper per kind (item, meetup, room, ride), with a live card preview built from M4b-1's card and artwork;
>    - client checks that mirror the server's: the kind and intent pairs, the window caps, prices, seats, cities, and the contact-detail rule. Server errors map through `listingErrorText`;
>    - the posting contract: `postListing` picks the id, inserts with `return=minimal` and reads the row back.
> 2. My listings (`#market-mine`): status chips (open, closed, "under review" for hidden, ended), and close and delete through `confirmAction`.
> 3. The live check needs the carried M3b owner checks first, walked through one small step per message:
>    - the owner signs in on the iPhone Home Screen app;
>    - their user id goes into `private.admins` and `private.testers`;
>    - a second tester is available (EXCHANGE §16, from M4).
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
