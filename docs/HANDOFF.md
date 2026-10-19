# Handoff — 2026-10-19 (slice D5, citations: Cambodia)

## Shipped
- D5 Cambodia: branch `data/d5-cambodia`, [PR #121](https://github.com/SamuelLClemens/Mekonging/pull/121), `mk-v0.642.0`. Stacked on PR #118 (D5 Vietnam, merged as 5f5cb6c) and branched from the merged tip 141a2a3.
  - 54 of the 59 Cambodian homepage-only places now cite a page about the place, so homepage-only records fall from 113 to 59 (Cambodia alone: 59 to 5). Each page was opened and checked to name the place; every decision and what it supports is in `scripts/place-citations.json`.
    - 30 swap a homepage for the cited organisation's own page: 29 Tourism Cambodia pages and the National Museum's own visitor page. The 29 were found by crawling tourismcambodia.com's province guides (181 pages; it has no sitemap, and its robots.txt disallows `/provinces/` but not the `/travelguides/provinces/` pages cited). It has one page per attraction (`what-to-see/<id>_<name>.htm`) and stay, eat and shop lists per province.
    - 9 add Wikipedia: 8 are the place's own article (the Norry for the Battambang bamboo train, Phare Ponleu Selpak, Preah Monivong National Park for Bokor, Kbal Spean, Kep National Park, Koh Ta Kiev, Phnom Chhnork, Virachey National Park) and Long Beach on Koh Rong cites the island's article beside a Wikivoyage section. No Khmer article was needed: each place had an English article or none.
    - 15 add a Wikivoyage section (Kampot, Battambang, Koh Rong, Koh Rung Sanloem, Kampong Cham, Chi Phat, Senmonorom, Kratie). Kampi dolphins also gets a Tourism Cambodia page.
    - 5 are filed `open` in `scripts/place-citations.json`: the Battambang riverside evening stalls, Long Set Beach (4K Beach), Koh Trong Island, the Koh Trong homestays and the Road 60 Night Market.
  - The 2 Cambodian records whose sources had no URL (Kampot riverfront bars, Kep Crab Market evening seafront) now cite a Tourism Cambodia page and a Wikivoyage section. Their Travelfish and Lonely Planet entries were replaced (owner ruling 2026-10-19).
  - 4 unsourced Cambodian routes have `sources`, so unsourced routes fall from 10 to 6 (all Lao):
    - Phnom Penh to Kep cites Giant Ibis's route page (167 km, 4 h) and the 12Go route page for the vans.
    - Kampot to Kep, Kampot to Sihanoukville and Kratie to Banlung have no reachable operator page. They cite the 12Go route page and the Wikivoyage section that gives the fares (Kampot "Go next", Banlung "By bus").
  - Wat Nokor Bachey: the blurb said "11th-century". Wikipedia (Banteay Prey Nokor: "dates from the last years of the reign of Jayavarman VII") and the Travelfish page the card itself cites ("dating back to the era of Jayavarman VII") contradict it. Jayavarman VII was crowned in 1181 and died in 1218, so the blurb now says "from the last years of Jayavarman VII's reign (around 1200)" and the Wikipedia article is a source. Nothing else in the record changed.
  - `check-sources.py` baselines are now 59 and 6. `APP_VERSION` and `CACHE_VERSION` are `mk-v0.642.0`; the manifest was regenerated.
- Earlier and already merged: D5 Thailand (#117), D5 Vietnam (#118), the Q1 375 px audit (#119, `docs/AUDIT_375.md`) and the Bangkok build-out plan (#120).

## Verified
Headless Chrome over CDP at 375 x 812 (device scale 2, mobile), fresh profile on `127.0.0.1`, served from the worktree (`mekong-d5kh`, port 8748). `document.hidden` was false on every load.
- 10 cards: Bou Sra Waterfall, Central Market, Kep Crab Market, Kampot Salt Fields, Koh Ta Kiev, the National Museum, the Tonle Sap villages, Wat Nokor Bachey, Kampot riverfront bars and Kampi dolphins.
  - On each, the place's own Sources sheet (the last of the two `.src-note-btn` buttons) lists the new page, linked to the recorded URL. A Tripadvisor homepage renders as a search link, so that href differs from the data file.
  - The sheet is 343 px wide, with 0 clipped items and 0 page errors. No element passes the 375 px edge except the 1 px `sr-only` helper at -1..0.
  - Two screenshots were looked at: the Tonle Sap villages sheet (`.../scratchpad/shots/card-tonlesap-villages.png`) and the Phnom Penh to Kep route sheet (`.../scratchpad/shots/route-pp-kep.png`).
- On `#transport-kh`, the Phnom Penh to Kep, Kampot to Kep, Kampot to Sihanoukville and Kratie to Banlung cards each show their new sources, linked to the recorded URLs, with 0 errors. The first five route cards fold into summaries, so find a card by its summary text as well as its heading.
- All 54 distinct new place URLs return HTTP 200 to curl (no blocked host among them), and each swapped Tourism Cambodia page contains the words that name its place. The Wikivoyage anchors were checked against the API. The four 12Go route pages were read in the in-app browser: each heading names the route.
- `--install` rewrote 55 arrays (54 places and the Wat Nokor Bachey source), and a second run changed nothing.
- Guards: js-syntax (240 files), imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, place-fields, port-themes and cache-version all pass.
  - Cache-version's changed-file list is `places.kh.ext.js`, `routes.kh.js`, `main.js` and `sw.js`.
  - `jsc -m` parses all four edited JS files (`main.js` and `sw.js` stop at the expected `navigator` and `self` ReferenceErrors).
  - `jsc -m scripts/validate-jsc.mjs`: 18,097 of 18,097 checks, EXIT 0.

## Not done / known issues
- New in D5 Cambodia:
  - D5 has one country left. Homepage-only records: la 46 (plus th 1, vi 7 and kh 5 filed `open`). Unsourced routes: la 6. `--report --list` gives each record's lane.
  - 5 place records still name a source with no URL: th (rca-royal-city-avenue, nimmanhaemin-road-bar-scene) and la (nam-song-riverside-bars, utopia-bar-the-late-bowling-alley-scene, bor-pen-nyang-riverfront-bar-strip). All ids carry the `<cc>-ext-` prefix. Edit them by hand: `--install` refuses them.
  - Who tourismcambodia.com and .org are (see Open decisions 11). tourismcambodia.org's own About page calls it "an independent guide" that earns booking commission. tourismcambodia.com says it was "established under" the Ministry of Tourism's law, but it sells tours and hotels and never says "Ministry" elsewhere. The ministry's own sites are tourism.gov.kh (a script-rendered page that curl cannot read) and visitcambodia.com (Cloudflare). 50 leftover entries in 6 data files still carry a "Ministry of Tourism" label on these two hosts.
  - Citations that cannot be read from here, or are broken:
    - `cambodia.panda.org` (Kampi dolphins): TLS certificate mismatch. WWF-Cambodia is now `wwf.org.kh`, and its dolphin page does not name Kampi, so it was not cited.
    - `wildlifealliance.org/chi-phat-ecotourism/` (1 place): HTTP 404.
    - `travelguide.michelin.com` (Wat Nokor Bachey): the host does not resolve.
    - `angkorenterprise.gov.kh` (6 entries) and `visitcambodia.com`: Cloudflare blocks both curl and the in-app browser.
  - Cards that disagree with the page now cited, left unchanged:
    - Long Beach (Sok San) and Long Set Beach (4K Beach): Wikivoyage's 7 km Long Set strand ends at Sok San on the west coast, so the two cards may be one beach. The 4K card says "eastern side" and is filed `open`.
    - Yeak Laom: the card says 5 km east of Banlung and Tourism Cambodia says 5 km south.
    - Kampot Night Market: Wikivoyage says mostly clothes with "a bit of food", where the card says rows of food stalls.
    - Kratie to Banlung: 12Go lists only buses (3 to 3.5 h), and the card recommends a minivan (3.5 to 5 h). Wikivoyage gives a shared minibus at 5 to 6 h and US$8. 12Go's `/banlung` slug serves a "Travel Options" title with real trips; `/ratanakiri` has a proper title and the same trips.
    - Phnom Sampov: the cited Tourism Cambodia page is Sampeou Mountain (same hill, other spelling) and does not mention the bat exodus.
    - Ka Tieng Waterfall's page is a visitor's account of three waterfalls with no figures. Phnom Chhnok and Koh Pen Beach on that site are location stubs, so Wikipedia was used for Phnom Chhngok and the bamboo bridge cites Wikivoyage.
  - No Cambodian operator page was reachable for Kampot to Kep, Kampot to Sihanoukville or Kratie to Banlung. vireakbuntham.com serves a 931-byte shell, and Champa Mekong, Kampot Transports and Ekareach Express have no route pages.
  - Pages cited for stay and food clusters name the place or street but do not support the card's prices. For every record the check was that the page names the place; hours, fares and other figures on the cards were compared only where noted above.
  - The preview entry `mekong-d5kh` is in `/Users/zim/Claude Code/.claude/launch.json`, the parent folder's shared launch file. It is uncommitted there, like the other entries.
- Carried from D5 Vietnam and Thailand:
  - 7 Vietnamese records are filed `open`, and Nan Walking Street stays `open`.
  - On 12Go, the `dalat` slug serves an empty "Travel Options" placeholder; the real slug is `da-lat`. Check a page's title before citing it.
  - Banh It Cham Towers: the card says 11th to 12th centuries, and Wikivoyage says 10th to 11th. vietnam.travel gives no date. The card is unchanged.
  - La Siesta's cited `www.lasiestahotels.com` homepage returns Cloudflare 526. The bare domain works and is cited.
  - Airline route pages were not tried for the flight options; 12Go lists the flights.
  - 12Go headline fares are live and date-dependent. They back operators, modes and durations better than fixed fares; no fares were changed.
  - English Wikipedia's Huai Nam Dang infobox places the park about 55 km from the viewpoint (an error in the article). Pong Dueat hot springs' coordinates (19.28, 98.63) are rounded and were not checked.
- Carried from Q1 (all in `docs/AUDIT_375.md`, nothing fixed):
  - The audit driver is not in the repo. It is in the shared notes folder (see the Q2 prompt).
  - Empty states only, `th` only for `{cc}` routes, no detail screens or sheets. The base moved after the audit and was not re-measured.
  - `scripts/route-sweep.js` flags 170 zero-size controls on `#weather-th`; they are `content-visibility` artefacts. Its `EXTRA` list has no `#market`.
  - The `#map` `getSource` exception was seen in 1 of 3 light loads and 0 of 3 dark loads.
  - 66 of 77 routes carry body controls under 44 px; the dark calendar's selected day is 1.21:1; the journey credits panel covers 16.6% of its map.
- Carried from D4:
  - 512 places have no `localName` (th 153, vi 125, kh 92, la 142). There is no OpenStreetMap lane: Overpass fails from this machine.
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
  - The main checkout is at 5dc10b4, behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
Closed on 2026-10-19 by the owner (recorded in `docs/PLAN.md`, Bangkok build-out, Owner rulings): 1 (PR #118 is merged), and 2, 3, 4, 5 and 7 accepted. The numbers below keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
8. Exchange M3 waits on the owner actions below. The legal questions in `docs/EXCHANGE.md` §14 go to Omer Hanegbi or Omri Siri.
9. Commit the audit driver under `tools/audit-375/` before any Q1 fix slice (Q2)? Recommended: yes. It was left out of PR #119 to keep it documents-only.
10. Topbar icon spacing: the title column has 102 px, so a 44 px pitch costs title width. Recommended: leave the topbar until Q3 to Q5 are done, then test a wider pitch against the nine longest titles.
11. Relabel the 50 leftover "Ministry of Tourism" entries on tourismcambodia.org and .com as "Tourism Cambodia" (data text only; it bumps the version)? The .org site calls itself an independent guide and the .com site is a travel agency. Recommended: yes, in a small data slice, and treat tourism.gov.kh as the ministry.
12. Check Long Beach (Sok San) and Long Set Beach (4K Beach) against coordinates and merge them if they are one beach (a merge needs a `place-merges.js` line)? Recommended: yes, as part of a coordinates check, before the 4K card gets a citation.

## Next session prompts
Start only after PR #121 has merged. The next releasing slice stacks on `mk-v0.642.0`.

D5 Laos (the next data slice; no owner action needed):
> Read CLAUDE.md, docs/HANDOFF.md and the D5 section of docs/PLAN.md. Run /slice for slice D5 Laos: citations.
> Run `python3 scripts/fetch-place-citations.py --country la --report --list`, then `--suggest`. Review each page, record the decisions in `scripts/place-citations.json`, and run `--install` twice (the second must change nothing). Follow the owner's sourcing rules in docs/PLAN.md D5. A Lao-language Wikipedia article is acceptable where no English one exists. Check each cited organisation's own site first (its sitemap, or crawl its guide pages if it has none: Cambodia's had one page per attraction).
> Add `sources` to the 6 unsourced Lao routes: operator first, then the 12Go or Baolau route page (check the page title names the route). Give the 3 Lao URL-less records a real URL (edit them by hand). Check the That Sikhottabong (10.5 km) and Nong Fa Lake (28.4 km) coordinates. Lower both baselines in `check-sources.py` (start: 59 homepage-only, 6 unsourced routes).
> Done when: the new counts are reported against the baselines, 10 sample cards show their citations at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: photos, local names, the "Free" price display, Bangkok.

Bangkok B1, Old City and Rattanakosin (after D5 Laos has merged; owner rulings are in docs/PLAN.md, Bangkok build-out):
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" section of docs/PLAN.md. Run /slice for slice B1: Old City and Rattanakosin.
> Count Bangkok's records by category first (40 of 293 Thai places). Run `check-place-dupes.py` before adding: a name collision silently deletes travellers' saved data.
> Add the district's records in a new file, `js/data/places.th.bkk.rattanakosin.js`, with one loader line in `js/data/regions.js` next to `PLACES_TH` and `PLACES_TH_EXT`. Ids are `th-bkk-<slug>`. Cover the categories in the plan that fit the district. Each record ships complete: Thai-script `localName`, page-level `sources` (the venue's own page or its Wikipedia article first), `hours`, a price tier, `coords` and `tips`; a photo only from the place's own Wikipedia article. Hold dispensaries out.
> Done when: Bangkok records for the district are counted by category before and after; every new record passes `check-place-fields.py --assert`; 10 sample cards show correctly at 375 px in headless Chrome over CDP; all guards and `jsc -m scripts/validate-jsc.mjs` pass; the pack size is reported before and after if photos were added; the PR is open into `feat/scaffold-bangkok-slice`.
> Out of scope: the other districts, dispensaries, D6 fields beyond the `afterDark` contract.

Q2, commit the audit driver (tools only, no version bump, so it can run alongside D5):
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
