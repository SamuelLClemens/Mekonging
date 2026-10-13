# Handoff — 2026-10-13 (slice D3, Cambodia)

## Shipped
- Slice D3 for Cambodia: branch `data/d3-photos-kh`, [PR #113](https://github.com/SamuelLClemens/Mekonging/pull/113), `mk-v0.637.0`, commit 32dc9d6. Open: its `guards` check was pending when this was written. Merge it once the check passes.
  - 21 place photos from each place's own English Wikipedia article. Cambodia has 54 of 163 places with a photo (was 33).
  - The files total 1.6 MB, 61 to 100 KB each. The licences are CC BY and CC BY-SA, with the credit text verbatim.
  - Every decision is in `scripts/place-photo-articles.json`: 23 articles accepted, 8 rejected (listed under `rejected`) and 101 places under `no_article.kh`.
- Already merged before this session (the session note that named D3 Vietnam and M2 as next was stale): D3 Vietnam as PR #110 (`mk-v0.634.0`), the three Vietnam photo swaps as PR #112 (`mk-v0.636.0`), exchange M2 (the Market tab) as PR #111 (`mk-v0.635.0`), M1 as PR #108 and D3 Thailand as PR #109.

## Verified
Headless Chrome over CDP at 375 x 812, Mekong Retro light, fresh profile on `127.0.0.1`, served from the worktree.
- All 21 `#place-<id>` routes show the photo with its credit. Each image decoded (natural width 537 to 800 px), rendered 309 px wide, and the page has no horizontal overflow.
- Ten cards were checked by eye: Malis, Sisowath Quay, Pre Rup, Banteay Kdei, Skuon spider market, Tonle Bati, Wat Banan, Central Market, Pailin and Choeung Ek.
- Rendered heights at 309 px wide: Pre Rup 129 px (a 2.4:1 panorama, the thinnest), Banteay Kdei 465 px, Wat Banan 411, Malis 411 and the National Museum 411 (the tall portraits).
- Contact sheets of all 23 staged images were viewed. Two were rejected: Phare Ponleu Selpak (two people at an event, not the circus) and Kampong Luong (the village church, not the floating village).
- `fetch-place-photos.py --country kh --report` after install: 163 places, 54 with a photo, 109 without; of those, 101 have no article of their own, 8 had their image rejected and 0 are unreviewed.
- Guards: js-syntax (240 files), imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, place-fields, port-themes and cache-version (manifest matches 246 files; pack sizes match) all pass. `jsc -m scripts/validate-jsc.mjs`: 18,021 of 18,021 checks, EXIT 0. `jsc -m` on `js/main.js` and `sw.js` reports only the expected `navigator` and `self` ReferenceErrors, so both parsed.

## Not done / known issues
- New in this slice:
  - Of the 109 Cambodian gaps, 101 have no English Wikipedia article of their own. Only the 8 rejected could be revisited. The article for "Phare Circus" (a Siem Reap troupe, lead image `Phare_Circus.jpg`) exists but was not fetched. The card is the Battambang school's circus.
  - The Skuon photo (Skun Spider Market) shows a smiling vendor holding a bowl of fried spiders. It is the town article's own lead image under CC BY 2.5. Say so if you want a photo without a face.
  - The Tonle Bati photo shows the lake, but the card is "Ta Prohm Temple & Tonle Bati Lake".
  - The plan counted 131 Cambodian gaps. The report counts 130.
- Carried from the exchange slices and earlier:
  - The top ~3 px of the tab bar show the content scrolled beneath it under the retro stripe. It predates M2.
  - Meetups have no chip until M4. The tab badge for unseen notifications waits for M5.
  - The new Market chip labels (Items, Rooms, Rides, Cash) are not in the UI string tables, so they show in English. Only "Market" is translated.
  - On `#market-items` the second chip row looks like the kind chips, so two chips show as pressed.
  - The "Traveller board" name remains on the Travel circle card and the Near me chip. The search screen's "Market" example chip searches the English word.
  - Malay "Laman utama" (Home) is truncated in the tab bar, before and after M2.
- Carried from D3 and earlier:
  - Two Vietnamese photos are archival black-and-white images (Museum of Cham Sculpture, Hỏa Lò Prison). The Museum of Cham Sculpture credit reads "Unknown authorUnknown author" (`fetch-place-photos.py` joins two author elements without a space).
  - Eight Vietnamese cards are an activity at a landmark and carry the landmark's own lead image.
  - Tall portrait photos render tall, because `.id-photo img` has no height cap (Phanom Rung is 548 px at 375 px wide).
  - Coordinate gaps to check in D5: Mae Surin Waterfall, Huai Nam Dang viewpoint, Pang Ung.
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - On the journey map at 375 px, the credits panel covers about a quarter of the map.
  - Wat Nokor Bachey's blurb gives the wrong date (D5).
  - `js/main.js` is 7,558 lines; the ceiling is ~1,500.
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #113 once its `guards` check passes. Recommended: yes.
2. Translation review of "Market", by a native speaker if one is available. Least sure: Korean "마켓" (alternative "장터"), Polish "Targ" (alternative "Rynek"), Turkish "Pazar" (also means Sunday), Filipino "Palengke" (a wet market; alternative "Pamilihan"), Chinese "市场" and "市場" (alternative "市集"), Japanese "マーケット" (alternative "市場").
3. Is a Meetups-free Market acceptable until M4? Recommended: yes.
4. Exchange M3 needs the owner actions below before its session. The legal questions in `docs/EXCHANGE.md` §14 go to Omer Hanegbi or Omri Siri.

## Next session prompts
Start only after PR #113 has merged. The next releasing slice stacks on `mk-v0.637.0`.

D3, Laos (recommended next: no owner action needed):
> Read CLAUDE.md, docs/HANDOFF.md and the D3 section of docs/PLAN.md. Run /slice for slice D3: place photos, Laos (`--country la`, about 163 gaps).
> Run `scripts/fetch-place-photos.py` with `--report`, `--suggest` (about 6 minutes for 130 places), a review into `scripts/place-photo-articles.json`, `--fetch`, `--sheet` (look at every image), then `--install`. Run `build-pack-sizes.py --write` and `build-sw-manifest.py --write`, and bump the version.
> Tip: `--suggest` searches by the place's own name only. Check a few likely titles by hand against the Wikipedia API (title, lead image, coordinates) before filing a place under `no_article`; Cambodia gained three photos that way (Independence Monument, Phnom Chhnork, Wat Banan).
> Done when: Laos's coverage is reported with its new count, 10 sample cards are checked by eye at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: the other countries' photos; local names; citations; the "Free" price display.

Exchange M3 (owner actions first). The owner does these before the session; every key and password stays in a dashboard or a password manager, never in the repo or in chat:
1. Create the Supabase project (Free, Singapore) and turn on MFA for the Supabase account.
2. Create the Resend account. Verify mekonging.com with Resend's DNS records in Cloudflare. Enter the Resend SMTP details in Supabase Auth.
3. Create a Turnstile widget for www.mekonging.com in Cloudflare. Enter its secret in Supabase's captcha settings.
4. Apply the Auth settings and email templates in `docs/EXCHANGE.md` §5.
5. Send the project URL and the publishable key (both public) for `js/market-config.js`.
6. Run each migration and RLS test in the SQL editor as the slice delivers them; add the owner's own account to `private.admins` and `private.testers`.

> Read CLAUDE.md, docs/HANDOFF.md and docs/EXCHANGE.md §3 to §5, §16 and §17 (M3). Run /slice for slice M3: accounts and sign-in (closed beta). Confirm the owner actions above are done first; if the project URL and publishable key are missing, stop and ask.
> Scope: migration 001 (`profiles`, `cities` seeded, the `private` schema and helpers, `market_join`, `market_delete_account`, display-name filter terms); the `check-secrets` guard, `js/market-config.js` and `js/market-api.js` (with fixture mode); sign-in and account screens under `#market-signin` and `#market-me`; the CSP changes, Turnstile, and the CSP tightening in §16.
> Done when: the RLS test prints only PASS and the Security Advisor shows no errors; at 375 px the signed-out, code-entry, signed-in and offline states render; the owner signs in on an iPhone home-screen app by code and in Safari by link, then deletes a test account; `check-secrets` fails on a planted fake secret key and passes on the tree, including `docs/EXCHANGE.md`.
> Out of scope: listings, messages, alerts, moderation tooling, cash swap.
