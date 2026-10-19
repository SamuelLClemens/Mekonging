# Handoff — 2026-10-19 (slice D5, citations: Laos)

## Shipped
- D5 Laos: branch `data/d5-laos`, [PR #122](https://github.com/SamuelLClemens/Mekonging/pull/122), `mk-v0.643.0`. Stacked on PR #121 (D5 Cambodia, merged as 64d67a4). The four D5 country sessions are done; the only D5 leftover is 2 Thai records whose source has no URL.
  - 38 of the 46 Lao homepage-only places now cite a page about the place, so homepage-only records fall from 59 to 21 (Laos alone: 46 to 8). Each page was opened and checked to name the place; every decision and what it supports is in `scripts/place-citations.json`.
    - 16 swap a homepage for the cited organisation's own page: 10 Tourism Laos pages (the ministry's Vientiane Capital, Luang Prabang, Luang Namtha and Champasak province pages, which hold one section per attraction), 2 Discover Laos Today pages (Tad Katamtok, Tad Yuang), the Gibbon Experience Classic tour page, TAEC's visitor page, UNESCO's Town of Luang Prabang page and the Plain of Jars Wikivoyage section. Settha Palace also swaps its own site's hotel page. 12 of the 16 also add the place's Wikipedia article.
    - 6 more add Wikipedia: 4 English articles (Tham Phu Kham for Blue Lagoon 1, Khong Island, Tham Jang, Champasak town) and 2 Lao articles where no English one exists (the Savannakhet Dinosaur Museum, That Ing Hang).
    - 15 add a Wikivoyage section for stay and food clusters and for places with no article. The Thakhek Buddha Cave adds Tourism Laos's Caves page beside Wikivoyage.
    - 8 are filed `open` in `scripts/place-citations.json`: the Nong Khiaw bridge food stalls, the Pakse riverside night market, the Bolaven lodges and homestays, Phosy Market, the Don Det sunset-strip kitchens, the Vang Vieng riverside food, the Wat Sok Pa Luang herbal sauna and the Vientiane khao piak sen shops.
  - The 3 Lao records whose sources had no URL now cite real pages: Nam Song riverside bars (Travelfish Vang Vieng, Wikivoyage Drink), Utopia and the bowling alley (Travelfish Luang Prabang, which names both, and Wikivoyage Drink) and Bor Pen Nyang (its own Travelfish profile, Wikivoyage Vientiane Drink). The Lonely Planet and Travelfish entries without URLs were replaced (owner ruling 2026-10-19).
  - The 6 unsourced Lao routes have `sources` (unsourced routes fall from 6 to 0): Luang Prabang to Nong Khiaw, Vientiane to Phonsavan, Vientiane to Thakhek, Vientiane to Savannakhet, Pakse to Savannakhet and Pakse to Thakhek. Each cites its 12Go route page and the Wikivoyage Get in section for the route. No operator page was reachable (see Not done).
  - Two coordinates were fixed from OpenStreetMap (Nominatim answers from this machine):
    - Nong Fa Crater Lake was 28.3 km west of its lake. It is now 15.1061, 107.4235 (OSM way 276269655; Wikipedia and Wikidata give 15.1075, 107.4244, 0.2 km away).
    - That Sikhottabong's pin fell in Thailand (Nominatim reverses it to Ban Noi Tai, Nakhon Phanom). It moved 1.8 km to the Lao bank, 17.3502, 104.8071 (OSM node 2791090723, Ban Sikhottabong, 4.9 km south of Thakhek, matching the card's "about 6 km south"). The 10.5 km gap came from comparing the card with the Wikipedia and Wikidata coordinate (17.436, 104.740), which is itself in Nakhon Phanom: that coordinate is the wrong one.
    - Both records now cite their OSM object as a source.
  - `check-sources.py` baselines are now 21 and 0. `APP_VERSION` and `CACHE_VERSION` are `mk-v0.643.0`; the manifest was regenerated.
- Earlier and already merged: D5 Thailand (#117), D5 Vietnam (#118), the Q1 375 px audit (#119, `docs/AUDIT_375.md`), the Bangkok build-out plan (#120) and D5 Cambodia (#121).

## Verified
Headless Chrome over CDP at 375 x 812 (device scale 2, mobile), fresh profile on `127.0.0.1`, served from the worktree (`mekong-d5la`, port 8749). `document.hidden` was false on every load.
- 10 cards: That Sikhottabong, Nong Fa Crater Lake, Wat Xieng Thong, Tad Katamtok, Plain of Jars Site 2, Settha Palace, the Savannakhet Dinosaur Museum, TAEC, Bor Pen Nyang and Ban Anou night market.
  - On each, the place's own Sources sheet (the last of the two `.src-note-btn` buttons) lists the new pages, linked to the recorded URLs. A Tripadvisor homepage renders as a search link, so that href differs from the data file.
  - The sheet is 343 px wide, with 0 clipped items and 0 page errors. No element passes the 375 px edge except the 1 px `sr-only` helper at -1..0.
  - The served coordinates of the two fixed cards were read back from the module (17.3502, 104.8071 and 15.1061, 107.4235).
  - Two screenshots were looked at: Plain of Jars Site 2 (`.../scratchpad/shots-la/card-plain-of-jars-2.png`) and the Vientiane to Savannakhet route sheet (`.../scratchpad/shots-la/route-vte-savannakhet.png`).
- On `#transport-la`, the six new route cards each show their two sources, linked to the recorded URLs, with 0 errors.
- Of the 45 distinct new place URLs, 35 return HTTP 200 to curl. The other 10 (9 Tourism Laos pages and UNESCO's) were read in the in-app browser and each names its place. The 3 Travelfish pages were read there too. The six 12Go route pages were read there: each title names the route. The Wikivoyage anchors were checked against the API. The OSM node, the OSM way and the Nong Fa Lake article return 200.
- `--install` rewrote 38 arrays and a second run changed nothing. The 3 URL-less records and the 2 coordinates were edited by hand.
- Guards: js-syntax (240 files), imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, place-fields, port-themes and cache-version all pass.
  - Cache-version's changed-file list is `places.la.ext.js`, `routes.la.js`, `main.js` and `sw.js`.
  - `jsc -m` parses all four edited JS files (`main.js` and `sw.js` stop at the expected `navigator` and `self` ReferenceErrors).
  - `jsc -m scripts/validate-jsc.mjs`: 18,097 of 18,097 checks, EXIT 0.

## Not done / known issues
- New in D5 Laos:
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
  - The main checkout is at 64d67a4, behind or level with origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
Closed on 2026-10-19 by the owner (recorded in `docs/PLAN.md`, Bangkok build-out, Owner rulings): 1 (PR #118 is merged), and 2, 3, 4, 5 and 7 accepted. The numbers below keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
8. Exchange M3 waits on the owner actions below. The legal questions in `docs/EXCHANGE.md` §14 go to Omer Hanegbi or Omri Siri.
9. Commit the audit driver under `tools/audit-375/` before any Q1 fix slice (Q2)? Recommended: yes. It was left out of PR #119 to keep it documents-only.
10. Topbar icon spacing: the title column has 102 px, so a 44 px pitch costs title width. Recommended: leave the topbar until Q3 to Q5 are done, then test a wider pitch against the nine longest titles.
11. Relabel the 50 leftover "Ministry of Tourism" entries on tourismcambodia.org and .com as "Tourism Cambodia" (data text only; it bumps the version)? The .org site calls itself an independent guide and the .com site is a travel agency. Recommended: yes, in a small data slice, and treat tourism.gov.kh as the ministry.
12. Check Long Beach (Sok San) and Long Set Beach (4K Beach) against coordinates and merge them if they are one beach (a merge needs a `place-merges.js` line)? Recommended: yes, as part of a coordinates check, before the 4K card gets a citation.
13. Relabel the 46 leftover "Lao National Tourism Administration" entries (and 4 "Ministry of Information, Culture and Tourism") on tourismlaos.org as "Tourism Laos" (data text only; it bumps the version)? The site's footer names the Tourism Marketing and Promotion Department of the Ministry of Culture and Tourism. Recommended: yes, in one small data slice together with decision 11.
14. Add a coordinates check slice? D5 Laos checked 2 of 185 Lao pins and both were wrong (one 28 km, one in Thailand), and Nominatim resolves coordinates by name from this machine. Recommended: yes, one country per session, starting with Laos's remote sites (waterfalls, caves, lakes), flagging any record more than 2 km from its OSM object. It would also settle decision 12.

## Next session prompts
Start only after PR #122 has merged. The next releasing slice stacks on `mk-v0.643.0`.

Bangkok B1, Old City and Rattanakosin (the next data slice; owner rulings are in docs/PLAN.md, Bangkok build-out):
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" section of docs/PLAN.md. Run /slice for slice B1: Old City and Rattanakosin.
> Count Bangkok's records by category first (40 of 293 Thai places). Run `check-place-dupes.py` before adding: a name collision silently deletes travellers' saved data.
> Add the district's records in a new file, `js/data/places.th.bkk.rattanakosin.js`, with one loader line in `js/data/regions.js` next to `PLACES_TH` and `PLACES_TH_EXT`. Ids are `th-bkk-<slug>`. Cover the categories in the plan that fit the district. Each record ships complete: Thai-script `localName`, page-level `sources` (the venue's own page or its Wikipedia article first), `hours`, a price tier, `coords` and `tips`; a photo only from the place's own Wikipedia article. Hold dispensaries out.
> Done when: Bangkok records for the district are counted by category before and after; every new record passes `check-place-fields.py --assert`; 10 sample cards show correctly at 375 px in headless Chrome over CDP; all guards and `jsc -m scripts/validate-jsc.mjs` pass; the pack size is reported before and after if photos were added; the PR is open into `feat/scaffold-bangkok-slice`.
> Out of scope: the other districts, dispensaries, D6 fields beyond the `afterDark` contract.

Q2, commit the audit driver (tools only, no version bump, so it can run alongside B1):
> Read CLAUDE.md, docs/HANDOFF.md and docs/AUDIT_375.md (Method and limits; Proposed fix slices). Run /slice for slice Q2: add the driver under `tools/audit-375/`.
> The files are in `/Users/zim/Library/Application Support/Claude/side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/q1-audit-driver/`: `audit375.py`, `audit375-page.js`, `report375.py`, `listroutes.py`, `redirects.py`, `shot.py`. If that folder is gone, rebuild them from the Method section.
> Make one command print the headline table and the per-route tables for both themes. It must refuse a load where `document.hidden` is true, and keep the display awake (`caffeinate -d`).
> Done when: a clean worktree reproduces the headline numbers in `docs/AUDIT_375.md` (66 routes with controls under 44 px, 0 overflow) and the script is documented in `scripts/README.md` or `tools/audit-375/README.md`.
> Out of scope: fixing what the audit finds.

Q3 to Q8 follow in the shape set out under Proposed fix slices in `docs/AUDIT_375.md`. Q3 to Q7 change shipped files, so they are stacked, one at a time.

Exchange M3 (owner actions first). Every key and password stays in a dashboard or a password manager, never in the repo or in chat:
1. Create the Supabase project (Free, Singapore) and turn on MFA for the Supabase account.
2. Create the Resend account. Verify mekonging.com with Resend's DNS records in Cloudflare. Enter the Resend SMTP details in Supabase Auth.
3. Create a Turnstile widget for www.mekonging.com in Cloudflare. Enter its secret in Supabase's captcha settings.
4. Apply the Auth settings and email templates in `docs/EXCHANGE.md` §5.
5. Send the project URL, the publishable key and the Turnstile site key (all public) for `js/market-config.js`.
6. Run each migration and RLS test in the SQL editor as the slice delivers them. Add the owner's own account to `private.admins` and `private.testers`.

> Read CLAUDE.md, docs/HANDOFF.md and docs/EXCHANGE.md §3 to §5, §16 and §17 (M3). Run /slice for slice M3: accounts and sign-in (closed beta). Confirm the owner actions above are done first; if the project URL and publishable key are missing, stop and ask.
> Scope: migration 001 (`profiles`, `cities` seeded, the `private` schema and helpers, `market_join`, `market_delete_account`, display-name filter terms); the `check-secrets` guard, `js/market-config.js` and `js/market-api.js` (with fixture mode); sign-in and account screens under `#market-signin` and `#market-me`; the CSP changes, Turnstile, and the CSP tightening in §16.
> Done when: the RLS test prints only PASS and the Security Advisor shows no errors; at 375 px the signed-out, code-entry, signed-in and offline states render; the owner signs in on an iPhone home-screen app by code and in Safari by link, then deletes a test account; `check-secrets` fails on a planted fake secret key and passes on the tree, including `docs/EXCHANGE.md`.
> Out of scope: listings, messages, alerts, moderation tooling, cash swap.
