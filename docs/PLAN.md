# Plan — data gaps and the traveller exchange (2026-10-12)

## How the slices run
- One slice per fresh session. Start it from `CLAUDE.md`, `docs/HANDOFF.md`, this file and the files the slice names.
- Every slice that changes a shipped file bumps `APP_VERSION` and `CACHE_VERSION`. Those slices therefore stack: each starts from the merged tip of `feat/scaffold-bangkok-slice`, and two releasing slices never run at the same time.
- M0, the exchange planning session, changed documents only and is done: see `docs/EXCHANGE.md`.
- Exchange slices M1–M10 (`docs/EXCHANGE.md` §17) change shipped files, so they stack with the data slices like any other releasing slice.
- M1 (the board moved to `js/screens/exchange.js`) is PR #108, `mk-v0.633.0`, 2026-10-12.
- M1 (PR #108) and M2 (the Market tab, PR #111, `mk-v0.635.0`) are merged. M3 is next on the exchange side, after the owner actions in `docs/EXCHANGE.md` §15.

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

### D5 — Citations
- Replace the 247 homepage-only place citations with the specific page.
- Add `sources` to the 37 unsourced routes.
- Lower the baselines in `check-sources.py` to lock in the gain.

### D6 — Access, kids, after dark
- Use genuine sources only. The `afterDark` contract in `js/data/places.th.js` says to omit a field rather than infer it.
- Expect low yield. This has the lowest value per credit, so it runs last.

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
- Reading the shared board requires sign-in.
- Listing cards are anonymous. A display name appears only inside a conversation.
- The exchange becomes a sixth bottom tab, "Market".
- The whole exchange is 18+.
- The Supabase publishable key is committed in `js/market-config.js` (`docs/EXCHANGE.md` §16).
- M3 tightens the CSP before sign-in tokens exist (`docs/EXCHANGE.md` §16).

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
