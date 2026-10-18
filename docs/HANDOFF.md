# Handoff — 2026-10-18 (slice D5, citations: Thailand)

## Shipped
- D5 Thailand: branch `data/d5-citations`, [PR #117](https://github.com/SamuelLClemens/Mekonging/pull/117), `mk-v0.640.0`, commit c8d2049. Open: its `guards` check was pending when this handoff was written. The docs commit that follows re-runs it.
  - 63 of the 64 Thai homepage-only places now cite a page about the place, so homepage-only records fall from 247 to 184:
    - 32 cite Wikipedia;
    - 21 cite a Wikivoyage section;
    - 5 cite Thai National Parks pages;
    - 3 cite the MICHELIN Guide;
    - 1 swaps the TAT homepage for TAT's own Karon Viewpoint entry.
  - Every decision and what the page supports is in `scripts/place-citations.json`. Nan Walking Street is filed `open` there.
  - All 13 unsourced Thai routes cite their 12Go route page, so unsourced routes fall from 37 to 24. `check-sources.py` baselines are now 184 and 24.
  - Coordinates fixed:
    - Mae Surin Waterfall: was the park centroid, 24.7 km off.
    - Huai Nam Dang viewpoint: 2.3 km off.
    - Pang Ung Reservoir: 22 km off.
    - Pang Ung homestays: 14.5 km off.
  - New tool `scripts/fetch-place-citations.py` (`--report --list`, `--suggest`, `--install`), documented in `scripts/README.md`.
- The owner's sourcing rules for D5 (2026-10-18):
  - Prefer the cited organisation's own page about the place; else the place's Wikipedia article; else a tourism-board page or a Wikivoyage section for stay and food clusters.
  - Leftover bare homepages stay in the list.
  - Routes cite operator pages first, and a booking platform's route page (12Go, Baolau) only where no operator page is reachable.

## Verified
Headless Chrome over CDP at 375 x 812, fresh profile on `127.0.0.1`, served from the worktree (`mekong-d5`, port 8746).
- 10 cards: Bua Tong, Similan Islands, Railay climbing, Khao Yai camping, Khao Soi Mae Sai, Karon Viewpoint, Lard Yai, Mae Kampong, Huai Nam Dang viewpoint and the Phuket Hokkien cluster. On each, the Sources sheet lists the new page first, linked to the recorded URL. The sheet is 343 px wide, with 0 px horizontal overflow, no clipped item and 0 page errors. Two were checked by eye from screenshots.
- On `#transport`, the Bangkok to Chiang Rai card's sheet shows "12Go — Bangkok to Chiang Rai".
- All 60 new Wikipedia, Wikivoyage and Thai National Parks URLs return HTTP 200. The 3 Michelin pages and the TAT page block curl, so they were read in the in-app browser. So were the 13 12Go pages, each confirming the route and its modes.
- The coordinates come from OSM nodes, Wikipedia and geotagged Commons photos:
  - Mae Surin: OSM waterfall node, and a Commons photo 150 m from it.
  - Huai Nam Dang: four Commons photos of the Doi Kiew Lom viewpoint.
  - Pang Ung: Wikipedia and OSM agree within 50 m.
- `--install` was tested on all 882 arrays. An add plus a swap parses back on 870, a no-op is byte-identical, and the other 12 are refused (they have no URL). A second install changes nothing.
- Guards: js-syntax (240 files), imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, place-fields, port-themes and cache-version all pass. Cache-version's changed-file list is the 2 data files, `main.js` and `sw.js`. `jsc -m scripts/validate-jsc.mjs`: 18,097 of 18,097 checks, EXIT 0.

## Not done / known issues
- New in this slice:
  - D5 has three countries left. Homepage-only: vi 78, kh 59, la 46. Unsourced routes: vi 14, kh 4, la 6. `--report` gives each record's lane.
  - 12 place records name a source with no URL at all, for example `{ org: "Lonely Planet Bangkok" }`. The guard does not count them, and `--install` refuses them:
    - th: rca-royal-city-avenue, nimmanhaemin-road-bar-scene.
    - vi: bui-vien-walking-street, an-thuong-western-street-area, dragon-bridge-fire-water-show, an-hoi-night-s-ng-ho-i-lantern-boats, tran-phu-beachfront-bars.
    - kh: kampot-riverfront-bars, kep-crab-market-evening-seafront.
    - la: nam-song-riverside-bars, utopia-bar-the-late-bowling-alley-scene, bor-pen-nyang-riverfront-bar-strip.
    - All ids carry the `<cc>-ext-` prefix.
  - 12Go headline fares are live and date-dependent (Bangkok to Phuket showed "from THB 10,235" on 2026-10-18). They back operators, modes and durations better than the fixed fares on the cards. No fares were changed.
  - Wikivoyage citations for food and stay clusters cite the town's section. They name the place or the street but do not support the card's prices.
  - English Wikipedia's Huai Nam Dang National Park infobox places the park about 55 km from the viewpoint. The error is in the article, not in our data.
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
  - The journey map's credits panel covers about a quarter of the map at 375 px.
  - `js/main.js` is 7,558 lines; the ceiling is ~1,500.
  - The main checkout is at 5dc10b4, behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #117 once its `guards` check passes. Recommended: yes.
2. Leave Nan Walking Street homepage-only until a checkable page exists? Recommended: yes.
3. Keep 12Go route pages as the route fallback for Vietnam, Cambodia and Laos? Vietnam Railways (dsvn.vn) is the operator to try first for trains. Recommended: yes.
4. Leave the older "native · romanisation" `localName` values as they are? Recommended: yes.
5. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
6. Is a Meetups-free Market acceptable until M4? Recommended: yes.
7. Exchange M3 waits on the owner actions below. The legal questions in `docs/EXCHANGE.md` §14 go to Omer Hanegbi or Omri Siri.

## Next session prompts
Start only after PR #117 has merged. The next releasing slice stacks on `mk-v0.640.0`.

D5 Vietnam (the next slice; no owner action needed):
> Read CLAUDE.md, docs/HANDOFF.md and the D5 section of docs/PLAN.md. Run /slice for slice D5 Vietnam: citations.
> Run `python3 scripts/fetch-place-citations.py --country vi --report --list`, then `--suggest`. Review each page, record the decisions in `scripts/place-citations.json`, and run `--install`. Follow the owner's sourcing rules in HANDOFF. Check vietnam.travel's sitemap for a same-organisation swap.
> Add `sources` to the 14 unsourced Vietnamese routes: operator first (Vietnam Railways), then the 12Go or Baolau route page. Give the 5 Vietnamese URL-less records a URL. Lower both baselines in `check-sources.py`.
> Done when: the new counts are reported against the baselines, 10 sample cards show their citations at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: photos, local names, the "Free" price display.

D5 Cambodia and Laos follow in the same shape:
- Cambodia adds the Wat Nokor Bachey blurb date.
- Laos adds the That Sikhottabong (10.5 km) and Nong Fa Lake (28.4 km) coordinate checks.

Q1, the 375 px audit (documents only, so it can run alongside D5):
> Read CLAUDE.md, docs/HANDOFF.md and the Q1 section of docs/PLAN.md. Run /slice for slice Q1: load every route in `js/nav-groups.js` in headless Chrome at 375 px, in Mekong Retro light and dark, and record horizontal overflow, controls under 44 x 44 px, console errors, contrast failures and controls covered by overlays in `docs/AUDIT_375.md`.
> Out of scope: fixing what it finds.

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
