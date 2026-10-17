# Handoff — 2026-10-17 (slice D3, Laos)

## Shipped
- Slice D3 for Laos: branch `data/d3-photos-la`, [PR #115](https://github.com/SamuelLClemens/Mekonging/pull/115), `mk-v0.638.0`, commit 3b1845c. Open: its `guards` check passed on 3b1845c, and the docs commit that follows re-runs it.
  - 17 place photos from each place's own English Wikipedia article. Laos has 39 of 185 places with a photo (was 22).
  - The files total 1.1 MB, 50 to 67 KB each. The licences are CC0, public domain, CC BY and CC BY-SA, with the credit text verbatim.
  - Every decision is in `scripts/place-photo-articles.json`: 17 accepted, 10 rejected (seven articles with no lead image, three images looked at and refused) and 136 places under `no_article.la`.
- D3 is closed. All four countries are reviewed: 262 of 882 places have a photo (29.7%). Each of the 620 gaps is filed under `no_article` (582: th 186, vi 159, kh 101, la 136) or `rejected` (38: th 14, vi 6, kh 8, la 10).
- Docs PR #114 (`11153d4`, merged as 691c167): legal cleared question 7 of `docs/EXCHANGE.md` §14 (the self-confirmed 18+ check, reported by the owner on 2026-10-16), and §16 records the owner rulings (sign-in sender on the root domain, an iPhone for the M3 test, a second person as tester from M4).
- Branch housekeeping, 2026-10-17 (no commit): every merged branch and worktree was deleted, 181 local and 101 on GitHub. Only `feat/scaffold-bangkok-slice` remains locally. On GitHub, `fix/transport-leaving-reverse` stays: its one extra commit is an empty merge of PR #96 that git does not count as merged.

## Verified
Headless Chrome over CDP at 375 x 812, fresh profile on `127.0.0.1`, served from the worktree. The page theme was seeded light.
- All 17 `#place-<id>` routes show the photo with its credit. Each image decoded (natural width 606 to 800 px), rendered 309 px wide, and the page width equals the 375 px viewport, so there is no horizontal overflow. There were 0 page errors.
- Ten cards were checked by eye: Pha That Luang, That Dam, Tham Jang, Amantaka, Muang Sing market, Wat Xieng Thong, Mount Phou Si, Nong Fa Lake, Lao National Museum and Wat Mai.
- Rendered heights at 309 px wide: Pha That Luang 151 px (a 2.1:1 panorama, the thinnest), That Dam 412 px (the tallest, a portrait), Tham Jang 281 px; the rest are 175 to 232 px.
- Contact sheets of all 20 staged images were viewed. Three were refused: the Bokeo gibbon (a close-up on a plain background, not the reserve or the tour), the Nam Ha cave (the card is a trek and jungle camp) and Chom Ong (250 x 203 px, too small for a 309 px card). The 17 accepted were re-staged and installed.
- `fetch-place-photos.py --country la --report` after install: 185 places, 39 with a photo, 146 without; of those, 136 have no article of their own, 10 had their image rejected and 0 are unreviewed.
- A hand check of about 70 guessed Wikipedia titles found one more article (Nong Fa Lake). Most guesses, such as Tad Lo, Wat Visoun, That Ing Hang and the Gibbon Experience, are missing from English Wikipedia.
- Guards: js-syntax (240 files), imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, place-fields, port-themes and cache-version (manifest matches 246 files; pack sizes match; places pack 32.3 MB) all pass. `jsc -m scripts/validate-jsc.mjs`: 18,038 of 18,038 checks, EXIT 0. `jsc -m` on `js/main.js` and `sw.js` reports only the expected `navigator` and `self` ReferenceErrors, so both parsed.

## Not done / known issues
- New in this slice:
  - The first `--suggest` pass exited 0 but 68 of 163 lookups had failed on DNS (`Could not resolve host`). A rerun was clean. The gotcha is now in `CLAUDE.md`. The script should exit non-zero on a failed lookup; that fix is not done.
  - Coordinate gaps to check in D5: the That Sikhottabong article is 10.5 km from the card's coordinates, and the Nong Fa Lake article is 28.4 km from the card's.
  - The Muang Sing market photo is the town article's own lead image (CC BY-SA 4.0). It shows the market itself, with vendors' faces. Say so if you want a photo without a face.
  - The Mount Phou Si photo is the hill seen across the Mekong on an overcast day, not a view from the summit.
  - Amantaka is a hotel, shown on a card tagged nightlife and culture.
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
  - The Cambodian Skuon photo shows a smiling vendor holding a bowl of fried spiders. The Tonle Bati photo shows the lake, but the card is "Ta Prohm Temple & Tonle Bati Lake". The article for "Phare Circus" exists but was not fetched; the card is the Battambang school's circus.
  - Tall portrait photos render tall, because `.id-photo img` has no height cap (Phanom Rung is 548 px at 375 px wide).
  - Coordinate gaps to check in D5: Mae Surin Waterfall, Huai Nam Dang viewpoint, Pang Ung.
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - On the journey map at 375 px, the credits panel covers about a quarter of the map.
  - Wat Nokor Bachey's blurb gives the wrong date (D5).
  - `js/main.js` is 7,558 lines; the ceiling is ~1,500.
  - The main checkout is at 5dc10b4, behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #115 once the `guards` check on the docs commit passes. Recommended: yes.
2. Close D3? The Wikipedia lead-image route has no unreviewed places left: 582 of the 620 gaps have no article of their own. More photos would need another source, such as Commons photos found by coordinates, which risks the wrong subject and needs a look at every image. Recommended: close D3 and move to D4.
3. Translation review of "Market", by a native speaker if one is available. Least sure: Korean "마켓" (alternative "장터"), Polish "Targ" (alternative "Rynek"), Turkish "Pazar" (also means Sunday), Filipino "Palengke" (a wet market; alternative "Pamilihan"), Chinese "市场" and "市場" (alternative "市集"), Japanese "マーケット" (alternative "市場").
4. Is a Meetups-free Market acceptable until M4? Recommended: yes.
5. Exchange M3 waits on the owner. As of 2026-10-17 none of the actions below is done, and legal item 7 is cleared. The other legal questions in `docs/EXCHANGE.md` §14 go to Omer Hanegbi or Omri Siri.

## Next session prompts
Start only after PR #115 has merged. The next releasing slice stacks on `mk-v0.638.0`.

D4, local-script names (the next slice in the owner's order; no owner action needed):
> Read CLAUDE.md, docs/HANDOFF.md and the D4 section of docs/PLAN.md. Run /slice for slice D4: local-script names (about 572 gaps: th 164, vi 144, kh 108, la 156; the `check-place-fields.py` report gives exact counts).
> First find where `localName` is stored, validated and rendered, and follow the review-file pattern of `scripts/fetch-place-photos.py`. Take each name from the matching local-language Wikipedia title or the OpenStreetMap `name` tag, in native script, and leave the field unset when neither source has the place. After every network pass, grep the log for `Could not resolve host`.
> Done when: each country's `localName` coverage is reported with its new count, 10 sample cards are checked by eye at 375 px in headless Chrome (Thai, Khmer, Lao and Vietnamese scripts all render, none as boxes), and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: photos, citations, the "Free" price display, UI translations.

Q1, the 375 px audit (documents only, so it does not stack and can run alongside D4):
> Read CLAUDE.md, docs/HANDOFF.md and the Q1 section of docs/PLAN.md. Run /slice for slice Q1: load every route in `js/nav-groups.js` in headless Chrome at 375 px, in Mekong Retro light and dark, and record horizontal overflow, controls under 44 x 44 px, console errors, contrast failures and controls covered by overlays in `docs/AUDIT_375.md`.
> Out of scope: fixing what it finds.

Exchange M3 (owner actions first). The owner does these before the session; every key and password stays in a dashboard or a password manager, never in the repo or in chat:
1. Create the Supabase project (Free, Singapore) and turn on MFA for the Supabase account.
2. Create the Resend account. Verify mekonging.com with Resend's DNS records in Cloudflare. Enter the Resend SMTP details in Supabase Auth.
3. Create a Turnstile widget for www.mekonging.com in Cloudflare. Enter its secret in Supabase's captcha settings.
4. Apply the Auth settings and email templates in `docs/EXCHANGE.md` §5.
5. Send the project URL, the publishable key and the Turnstile site key (all public) for `js/market-config.js`.
6. Run each migration and RLS test in the SQL editor as the slice delivers them; add the owner's own account to `private.admins` and `private.testers`.

> Read CLAUDE.md, docs/HANDOFF.md and docs/EXCHANGE.md §3 to §5, §16 and §17 (M3). Run /slice for slice M3: accounts and sign-in (closed beta). Confirm the owner actions above are done first; if the project URL and publishable key are missing, stop and ask.
> Scope: migration 001 (`profiles`, `cities` seeded, the `private` schema and helpers, `market_join`, `market_delete_account`, display-name filter terms); the `check-secrets` guard, `js/market-config.js` and `js/market-api.js` (with fixture mode); sign-in and account screens under `#market-signin` and `#market-me`; the CSP changes, Turnstile, and the CSP tightening in §16.
> Done when: the RLS test prints only PASS and the Security Advisor shows no errors; at 375 px the signed-out, code-entry, signed-in and offline states render; the owner signs in on an iPhone home-screen app by code and in Safari by link, then deletes a test account; `check-secrets` fails on a planted fake secret key and passes on the tree, including `docs/EXCHANGE.md`.
> Out of scope: listings, messages, alerts, moderation tooling, cash swap.
