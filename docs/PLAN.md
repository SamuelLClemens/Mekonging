# Plan — data gaps and the traveller exchange (2026-10-12)

## How the slices run
- One slice per fresh session. Start it from `CLAUDE.md`, `docs/HANDOFF.md`, this file and the files the slice names.
- Every slice that changes a shipped file bumps `APP_VERSION` and `CACHE_VERSION`. Those slices therefore stack: each starts from the merged tip of `feat/scaffold-bangkok-slice`, and two releasing slices never run at the same time.
- M0, the exchange planning session, changed documents only and is done: see `docs/EXCHANGE.md`.
- Exchange slices M1–M10 (`docs/EXCHANGE.md` §17) change shipped files, so they stack with the data slices like any other releasing slice.
- M1 (the board moved to `js/screens/exchange.js`) is PR #108, `mk-v0.633.0`, 2026-10-12.
- M1 (PR #108) and M2 (the Market tab, PR #111, `mk-v0.635.0`) are merged. M3 is next on the exchange side. Its owner actions (`docs/EXCHANGE.md` §15, the M3 rows up to sending the public values) were done on 2026-10-19.

### Release order (owner, 2026-10-19; updated after M3b)
- Merged on 2026-10-19: D5 Laos (PR #122, `mk-v0.643.0`), M3a (PR #124, `mk-v0.644.0`) and **M3b, accounts and sign-in** (PR #125, `mk-v0.645.0`). M3b's owner checks (migration 001, the RLS test, the Security Advisor, the iPhone sign-ins) are tracked in `docs/HANDOFF.md`.
- **Owner ruling after M3b: Market first, one slice per session** (`docs/EXCHANGE.md` §16, 2026-10-19). Releasing slices stack, one at a time, each from the merged tip:
  1. **M4a**: listings and search, server side. Built on 2026-10-19 and open as a draft ([PR #127](https://github.com/SamuelLClemens/Mekonging/pull/127), `mk-v0.646.0`); it merges after the owner's SQL run passes (`docs/HANDOFF.md`).
  2. **M4b**: the marketplace redesign (search, filters, picture-led cards with category artwork, listing pages, post forms).
  3. **M4c**: listing photos.
  4. **M5**: messages, block and live alerts, right after M4c (owner, 2026-10-19): a marketplace that cannot message cannot complete a hand-off. M6 onward follow later.
  5. **D5 tidy** (approved): relabel the 50 "Ministry of Tourism" entries on tourismcambodia.com and .org (34 in `places.kh.ext.js`, 6 in `places.kh.js`, 5 in `local.kh.js`, 3 in `itineraries.js`, 1 each in `info.kh.js` and `prices.kh.js`) as "Tourism Cambodia", with tourism.gov.kh as the ministry. Check Long Beach (Sok San) against Long Set Beach (4K Beach) and merge them if they are one beach (with a `place-merges.js` line). Open decision 13 (the Tourism Laos relabel) is recommended to ride along.
  6. **Bangkok B1 to B8** (below), then **city depth C1 onward** (below, order confirmed by the owner).
- Q2, the audit driver under `tools/audit-375/` (tools only, no version bump), can run alongside any of these. Q3 to Q8 stack like any releasing slice.

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
