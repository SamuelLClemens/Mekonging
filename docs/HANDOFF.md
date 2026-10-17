# Handoff — 2026-10-17 (slice D4, local names)

## Shipped
- Slice D4: branch `data/d4-local-names`, [PR #116](https://github.com/SamuelLClemens/Mekonging/pull/116), `mk-v0.639.0`, commit e003010. Open: its `guards` check was running on e003010, and the docs commit that follows re-runs it.
  - 59 `localName` values, so 370 of 882 places have one (was 311): th 129 to 140, vi 97 to 116, kh 56 to 71, la 29 to 43.
  - Each name is the local-language Wikipedia title, or the Wikidata label where there is no local page, of the place's reviewed English article. It is in native script only, with no romanisation. The source URL of every name is in `scripts/local-names.json`, with 37 refused candidates and the reason for each.
  - New tool `scripts/fetch-local-names.py` (`--report`, `--suggest`, `--install`), documented in `scripts/README.md`. `--suggest` exits 1 when a lookup fails; `--install` copies each record's own key style.
- D3 is closed and merged: PR #115 (`mk-v0.638.0`, merged as 7080ac5). 262 of 882 places have a photo.
- Docs PR #114 (merged as 691c167): legal cleared question 7 of `docs/EXCHANGE.md` §14, and §16 records the owner rulings (sign-in sender on the root domain, an iPhone for the M3 test, a second person as tester from M4).

## Verified
Headless Chrome over CDP at 375 x 812, fresh profile on `127.0.0.1`, served from the worktree. The page theme was seeded light.
- All 59 `#place-<id>` routes show the name exactly as stored, under "Find it". The `lang` attribute is `th`, `vi`, `km` or `lo` by country, the name box is 309 px wide and 28 to 55 px high (the tallest is a Vietnamese name wrapping to two lines), the page has no horizontal overflow and there were 0 page errors.
- Ten cards were checked by eye: Lumphini Park, Similan Islands, Hải Vân Pass, Phong Nha, Cát Bà, Pre Rup, Le Royal, Bokor, Kong Lor and Wat Ong Teu. All four scripts render with real glyphs and no boxes.
- `fetch-local-names.py --report` after install: th 140 of 293, vi 116 of 241, kh 71 of 163, la 43 of 185. `check-place-fields.py` reports `localName` 370 of 882. The suggestion passes had 0 failed lookups.
- The Wikipedia and Wikidata lane was measured before building: of 571 gaps, 68 had an English article reviewed in D3 and 71 more were never reviewed (they had a photo before D3). A person decided each candidate.
- Guards: js-syntax (240 files), imports, lazy-data, preloads, ui-strings, month-arrays, contrast, skins, spacing, place-dupes, undefined, net-gates, sources, place-fields, port-themes and cache-version (manifest matches 246 files; pack sizes match; places pack 32.3 MB) all pass. `jsc -m scripts/validate-jsc.mjs`: 18,097 of 18,097 checks, EXIT 0 (59 more than before, one per name). `jsc -m` on `js/main.js` and `sw.js` reports only the expected `navigator` and `self` ReferenceErrors, so both parsed.

## Not done / known issues
- New in this slice:
  - 512 places still have no `localName` (th 153, vi 125, kh 92, la 142). Most are stay clusters, food runs, rentals and practical cards, which have no single native-script name.
  - No OpenStreetMap lane. The main Overpass endpoint times out from this machine, a mirror returned HTTP 500 on 10 of 12 queries, and Nominatim found a native-script name for 1 of 12 sight-like places. The gotcha is in `CLAUDE.md`.
  - The new names are native script only. About three quarters of the older values read "native · romanisation", so cards now mix the two formats. The owner chose native only.
  - Six cards carry the name of the venue where an activity happens: the Gibbon Experience (`la-ext-bokeo-gibbon`), two Nam Ha trek cards, the Cái Răng breakfast boats, the Central Market food stalls and the Cam Thanh coconut village. The Ho Chi Minh Mausoleum Complex card carries the mausoleum's name.
  - The Phong Nha – Kẻ Bàng name uses Wikipedia's en dash; Wikidata writes a hyphen.
  - `fetch-place-photos.py` still exits 0 when lookups fail (the new tool does not). That fix is not done.
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
  - The Cambodian Skuon photo shows a smiling vendor, and the Lao Muang Sing market photo shows vendors' faces. The Tonle Bati photo shows the lake, but the card is "Ta Prohm Temple & Tonle Bati Lake". The article for "Phare Circus" exists but was not fetched; the card is the Battambang school's circus.
  - Tall portrait photos render tall, because `.id-photo img` has no height cap (Phanom Rung is 548 px at 375 px wide).
  - Coordinate gaps to check in D5: Mae Surin Waterfall, Huai Nam Dang viewpoint, Pang Ung, and the articles for That Sikhottabong (10.5 km from the card) and Nong Fa Lake (28.4 km).
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - On the journey map at 375 px, the credits panel covers about a quarter of the map.
  - Wat Nokor Bachey's blurb gives the wrong date (D5).
  - `js/main.js` is 7,558 lines; the ceiling is ~1,500.
  - The main checkout is at 5dc10b4, behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #116 once the `guards` check on the docs commit passes. Recommended: yes.
2. Close D4? The 512 remaining places need a source this machine cannot reach reliably. A retry from a GitHub Actions run (where Overpass may answer) would be a new, uncertain slice. Recommended: close D4 and move to D5.
3. Leave the older "native · romanisation" values as they are? Recommended: yes.
4. Translation review of "Market", by a native speaker if one is available. Least sure: Korean "마켓" (alternative "장터"), Polish "Targ" (alternative "Rynek"), Turkish "Pazar" (also means Sunday), Filipino "Palengke" (a wet market; alternative "Pamilihan"), Chinese "市场" and "市場" (alternative "市集"), Japanese "マーケット" (alternative "市場").
5. Is a Meetups-free Market acceptable until M4? Recommended: yes.
6. Exchange M3 waits on the owner. As of 2026-10-17 none of the actions below is done, and legal item 7 is cleared. The other legal questions in `docs/EXCHANGE.md` §14 go to Omer Hanegbi or Omri Siri.

## Next session prompts
Start only after PR #116 has merged. The next releasing slice stacks on `mk-v0.639.0`.

D5, citations (the next slice in the owner's order; no owner action needed):
> Read CLAUDE.md, docs/HANDOFF.md and the D5 section of docs/PLAN.md. Run /slice for slice D5: citations. Measure first with `python3 scripts/check-sources.py` and the `check-place-fields.py` report, then propose a split by country (as D3 did) if one session is too much.
> Replace the homepage-only place citations (247 at the last count) with the specific page, and add `sources` to the 37 unsourced routes. Lower the baselines in `check-sources.py` to lock in the gain. Fix the coordinate gaps listed in HANDOFF and the Wat Nokor Bachey date while in those records.
> Done when: the new counts are reported against the baselines, 10 sample cards show their citations at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: photos, local names, the "Free" price display.

Q1, the 375 px audit (documents only, so it does not stack and can run alongside D5):
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
