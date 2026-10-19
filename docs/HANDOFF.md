# Handoff — 2026-10-19 (slice D5, citations: Vietnam; slice Q1, 375 px audit)

## Shipped
- D5 Vietnam: branch `data/d5-vietnam`, [PR #118](https://github.com/SamuelLClemens/Mekonging/pull/118), `mk-v0.641.0`, commit 81b8cab. Its `guards` check was still pending when this handoff was written.
  - 71 of the 78 Vietnamese homepage-only places now cite a page about the place, so homepage-only records fall from 184 to 113:
    - 50 swap the vietnam.travel homepage for the board's own page about the place. They were found through its sitemap (13,314 URLs, 1,032 in English); 303 pages were read.
    - 5 swap to the cited organisation's own page: UNESCO for My Son and for the Khai Dinh tomb (Complex of Hué Monuments), Sun World Ba Na Hills, La Siesta Ma May and Sapa O'Chau.
    - 10 add a Wikipedia article. 6 were reviewed in D3; 2 are Vietnamese articles (the Kenh Ga hot spring, the Sa Pa ancient rock field).
    - 6 add a Wikivoyage section for stay and food clusters.
    - 7 are filed `open` in `scripts/place-citations.json`: Cannon Fort (Cat Ba), the Con Son evening stalls, the Da Lat night-market banh trang nuong stalls, the Hue herbal bath, Cho Rong market, Cau May and the Giang Ta Chai waterfall.
  - The 5 Vietnamese records whose sources had no URL now cite real pages (Bui Vien, An Thuong, the Dragon Bridge show, the An Hoi lantern boats, the Tran Phu bars). Where the named organisation had no page about the place, the entry was replaced with a page that does (see Open decisions 3).
  - All 14 unsourced Vietnamese routes have `sources`, so unsourced routes fall from 24 to 10:
    - 6 routes with a train option cite the passenger operator's Train routes page (Railway Transport JSC, the Vietnam Railways company; dsvn.vn has no route pages) plus the 12Go route page for the other modes.
    - Hanoi to Ha Giang cites Cat Ba Express's route page.
    - 7 bus and flight routes cite 12Go. FUTA refuses automated browsers, Hai Van runs neither Mai Chau nor Hue to Hoi An, and no other named operator had a reachable route page.
  - `check-sources.py` baselines are now 113 and 10.
- Q1, the 375 px audit (documents only, no version bump): branch `docs/q1-audit-375`, [PR #119](https://github.com/SamuelLClemens/Mekonging/pull/119). `docs/AUDIT_375.md` covers 77 routes (the 72 from `routeSweepRoutes()`, plus `#market` and its four chips) in Mekong Retro light and dark, 154 cold loads at 375 x 812 on build `mk-v0.640.0`.
  - Layout: 0 routes overflow in either theme; 0 failed requests; 0 console errors except one intermittent exception on `#map` (`setWeather`, `js/map.js:1450`, runs after the map is removed).
  - Tap size: 66 of 77 routes carry body controls under 44 px (1,315 controls, 199 under 24 px). The topbar icons have a 30 to 36 px wide hit area. Disclosure `summary` rows are the most widespread (301 controls on 62 routes).
  - Contrast: 27 routes in light, 6 in dark. Worst: today's selected calendar day in dark, 1.21:1 (confirmed in a screenshot). Placeholders are 4.31:1 on 22 routes.
  - Credits panel: open as loaded; 16.6% of the 343 x 300 px journey map (285 x 60 px plate), over the pin for stop 1; 10.5% of the Places and offline maps, over two pins on Places.
  - The last section of the document proposes Q2 (commit the audit driver) to Q8.

## Verified
Headless Chrome over CDP at 375 x 812, fresh profile on `127.0.0.1`, served from the worktree (`mekong-d5vi`, port 8747). The app reports `mk-v0.641.0`.
- 10 cards: Ban Gioc, My Son, Golden Bridge, Banh Mi 25, the Lunch Lady, the Sa Pa rock field, Ta Van Giay village, La Siesta Ma May, the Phong Nha homestays and the Dragon Bridge show.
  - On each, the Sources sheet lists the new page first, linked to the recorded URL.
  - The sheet is 343 px wide, with 0 px horizontal overflow, no clipped item and 0 page errors. Two were checked by eye from screenshots.
- On `#transport-vi`, the Hanoi to Da Nang, Hanoi to Ha Giang and HCMC to Can Tho cards show their new sources the same way.
- 64 of the 67 new place URLs return HTTP 200. UNESCO (2) and Travelfish (1) block curl; they were read in the in-app browser, and each names its place. The 13 12Go pages were read there too; each title names the route and the card's modes.
- `--install` rewrote 71 arrays, and a second run changed nothing.
- Guards: js-syntax (240 files), imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, place-fields, port-themes and cache-version all pass.
  - Cache-version's changed-file list is the 2 data files, `main.js` and `sw.js`.
  - `jsc -m scripts/validate-jsc.mjs`: 18,097 of 18,097 checks, EXIT 0.

Q1 (PR #119): headless Chrome 155 over CDP at 375 x 812 (device scale 2, mobile), fresh profile per theme, served from the worktree on `127.0.0.1:8761`.
- `document.hidden` is false on every recorded route. The first pass ran while macOS display sleep had hidden the pages; 51 routes per theme were measured again visible, and 33 of them differed (`#settings` 11 controls against 111). Only visible numbers are in the document.
- Each detector was shown to fire on a planted defect: a 520 px box (reported as 145 px past the edge), 2.7:1 text, a 20 px button, a fixed overlay over controls, a planted 404, `console.error`, exception and CSP block.
- Two findings were checked by eye from screenshots: the dark calendar's selected day and the journey credits panel. Three false positives were found and fixed in the driver (wrapped inline links, off-map pins, SVG country shapes); a transient hit on `#everything` did not reproduce in two re-measures or a direct probe.
- `check-cache-version.py --base origin/feat/scaffold-bangkok-slice` passes. No shipped file changed.
- The legacy Market hashes (`#swap`, `#exchange*`, `#market-gear`) all land on the right chip.

## Not done / known issues
- New in Q1 (all in `docs/AUDIT_375.md`, nothing fixed):
  - The audit driver is not in the repo. It is in the shared notes folder (see the Q2 prompt) and proposed as slice Q2.
  - Empty states only, `th` only for `{cc}` routes, no detail screens or sheets. The base moved to PR #118 after the audit and was not re-measured.
  - `scripts/route-sweep.js` flags 170 zero-size controls on `#weather-th`; they are `content-visibility` artefacts. Its `EXTRA` list has no `#market`.
  - The `#map` `getSource` exception was seen in 1 of 3 light loads and 0 of 3 dark loads.
- New in the D5 Vietnam slice:
  - D5 has two countries left. Homepage-only: kh 59, la 46. Unsourced routes: kh 4, la 6. `--report --list` gives each record's lane.
  - 7 place records still name a source with no URL. The guard does not count them, and `--install` refuses them:
    - th: rca-royal-city-avenue, nimmanhaemin-road-bar-scene.
    - kh: kampot-riverfront-bars, kep-crab-market-evening-seafront.
    - la: nam-song-riverside-bars, utopia-bar-the-late-bowling-alley-scene, bor-pen-nyang-riverfront-bar-strip.
    - All ids carry the `<cc>-ext-` prefix. Vietnam's were edited by hand: give each entry a URL, or replace it with a page that names the place.
  - On 12Go, the `dalat` slug serves an empty "Travel Options" placeholder; the real slug is `da-lat`. Check a page's title before citing it.
  - Banh It Cham Towers: the card says 11th to 12th centuries, and Wikivoyage says 10th to 11th. vietnam.travel gives no date. The card is unchanged.
  - La Siesta's cited `www.lasiestahotels.com` homepage now returns Cloudflare 526. The bare domain works and is now cited.
  - Pages cited for stay and food clusters name the place or street but do not support the card's prices.
  - Airline route pages were not tried for the flight options; 12Go lists the flights.
  - The preview entry `mekong-d5vi` was added to `/Users/zim/Claude Code/.claude/launch.json`, the parent folder's shared launch file. It is uncommitted there, like the other entries.
- Carried from D5 Thailand:
  - Nan Walking Street stays `open`.
  - 12Go headline fares are live and date-dependent. They back operators, modes and durations better than fixed fares; no fares were changed.
  - English Wikipedia's Huai Nam Dang infobox places the park about 55 km from the viewpoint (an error in the article).
  - Pong Dueat hot springs' coordinates (19.28, 98.63) are rounded and were not checked.
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
- Carried from D3 and earlier:
  - Two Vietnamese photos are archival black-and-white images. The Museum of Cham Sculpture credit reads "Unknown authorUnknown author".
  - Eight Vietnamese activity cards use their landmark's image.
  - Some Cambodian and Lao photos are flagged: the Skuon vendor, the Muang Sing market faces, Tonle Bati showing the lake, and Phare Circus not fetched.
  - Tall portrait photos are uncapped (Phanom Rung is 548 px at 375 px wide).
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - The journey map's credits panel: measured in Q1 at 16.6% of the map, not a quarter (see above).
  - `js/main.js` is 7,558 lines; the ceiling is ~1,500.
  - The main checkout is at 5dc10b4, behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #118 once its `guards` check passes. Recommended: yes.
2. Accept a Vietnamese-language Wikipedia article as the citation where the place has no English article (Kenh Ga hot spring, Sa Pa ancient rock field)? Recommended: yes. Cambodia and Laos would use Khmer and Lao articles the same way.
3. Where a URL-less source's organisation has no page about the place, accept replacing that entry with another checkable page instead of leaving it URL-less? This affected Lonely Planet for Bui Vien and An Thuong, Travelfish for An Thuong, and Danang Tourism for the Dragon Bridge. Recommended: yes.
4. Leave the 7 Vietnamese `open` records homepage-only until a checkable page exists? Recommended: yes.
5. Leave the older "native · romanisation" `localName` values as they are? Recommended: yes.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
7. Is a Meetups-free Market acceptable until M4? Recommended: yes.
8. Exchange M3 waits on the owner actions below. The legal questions in `docs/EXCHANGE.md` §14 go to Omer Hanegbi or Omri Siri.
9. Commit the audit driver under `tools/audit-375/` before any Q1 fix slice (Q2)? Recommended: yes. It was left out of PR #119 to keep it documents-only.
10. Topbar icon spacing: the title column has 102 px, so a 44 px pitch costs title width. Recommended: leave the topbar until Q3 to Q5 are done, then test a wider pitch against the nine longest titles.

## Next session prompts
Start only after PR #118 has merged. The next releasing slice stacks on `mk-v0.641.0`.

D5 Cambodia (the next slice; no owner action needed):
> Read CLAUDE.md, docs/HANDOFF.md and the D5 section of docs/PLAN.md. Run /slice for slice D5 Cambodia: citations.
> Run `python3 scripts/fetch-place-citations.py --country kh --report --list`, then `--suggest`. Review each page, record the decisions in `scripts/place-citations.json`, and run `--install`. Follow the owner's sourcing rules in docs/PLAN.md D5. Check each cited organisation's own site (its sitemap first) for a same-organisation page before Wikipedia.
> Add `sources` to the 4 unsourced Cambodian routes: operator first (Giant Ibis route pages are already cited elsewhere), then the 12Go or Baolau route page. Give the 2 Cambodian URL-less records a URL. Check the Wat Nokor Bachey blurb date. Lower both baselines in `check-sources.py` (start: 113 homepage-only, 10 unsourced routes).
> Done when: the new counts are reported against the baselines, 10 sample cards show their citations at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: photos, local names, the "Free" price display.

D5 Laos follows in the same shape, and adds the That Sikhottabong (10.5 km) and Nong Fa Lake (28.4 km) coordinate checks.

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
