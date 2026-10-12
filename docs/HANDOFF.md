# Handoff — 2026-10-12 (slice M2, the Market tab)

## Shipped
- Slice M2 of the traveller exchange: branch `feat/m2-market-tab`, [PR #111](https://github.com/SamuelLClemens/Mekonging/pull/111), `mk-v0.635.0`. Merged as 8393397 and live; the post-merge `guards` and Pages deploy succeeded.
  - A sixth bottom tab, "Market" (`#market`), after Explore, with a market-stall icon in the same style as the other tab icons. `TAB_FOR_HEAD` maps `market`, `exchange` and `swap` to it.
  - `js/market-routes.js` (new, eager, pure): the legacy routes redirect in place. `render()` rewrites the hash before it reads it, so the address bar, the Back stack and the active tab all see the Market route.
  - The on-phone board is now `marketScreen` in `js/screens/exchange.js`, titled "Market". Kind chips: All, Items, Rooms, Rides, Cash. Items keeps the three old post forms (kids, gear, other) behind a second chip row. Every saved listing and shared `#in-` link works as before.
  - "Traveller board" (People), "Cash swap" and "Gear market" (Money) are gone from `js/nav-groups.js`. The currency screen's swap button opens `#market-cash`; the circle and nearby links open Market routes directly.
  - "Market" is translated in all 29 UI string tables.
  - `.tabbar button` lost its 2 px side padding, so German "Entdecken" and Dutch "Verkennen" still fit six slots.
  - `docs/EXCHANGE.md` §17 M1 is corrected (only `circle.js` imports from `exchange.js`), and its M2 scope notes that Meetups have no chip until M4.
- After M2: three weak Vietnam place photos replaced, branch `data/vi-photo-swaps`, `mk-v0.636.0`. Museum of Cham Sculpture (archival black-and-white, now a current gallery view, CC0), Hỏa Lò Prison (archival aerial, now the Maison Centrale gate, CC BY 2.0) and Sun World Hạ Long (lens flare and no cable car, now the Queen Cable Car, CC BY-SA 4.0). New files are named `-v2` because the media cache keys photos by URL across releases. The swaps are recorded under `replaced` in `scripts/place-photo-articles.json`.
- Merged before this: slice D3 for Vietnam as [PR #110](https://github.com/SamuelLClemens/Mekonging/pull/110) (`mk-v0.634.0`), M1 as PR #108 (`mk-v0.633.0`) and D3 for Thailand as PR #109 (`mk-v0.632.0`).

## Verified
Headless Chrome over CDP at 375 x 812, Mekong Retro, fresh profile on `127.0.0.1`. The tip before this slice is 0b4228e.
- **Six tabs and label fit.** The bar is 375 x 66 px with 6 buttons of 62.5 px. English label text widths (the widest of the active and inactive states): Home 33.7, Talk 23.9, YOU 25.3, Places 38.3, Explore 43.8, Market 40.6. None is truncated.
- **Market label in all 29 languages:** the widest is Japanese "マーケット" at 55.7 px, then Filipino "Palengke" at 52.9 and Swedish "Marknad" at 50.8; none is truncated. Every Market label fits the 62.5 px slot.
- **Other labels, six tabs.** Before the padding change German "Entdecken" (59.8 px) and Dutch "Verkennen" (60.4 px) overflowed the 59 px inside a slot. After it, with each tab active: German 61.1 and Dutch 61.8 of 62.5. Malay "Laman utama" (77.6 px) is truncated in the six-tab bar and was already truncated in the five-tab bar at the tip (77.6 px in a 71 px inside).
- **Active tab.** On `#market`, `#exchange-gear` and `#swap`, only `tab-market` carries `aria-current`, and `data-tab` is `market`.
- **Legacy routes (each from `#home`; the redirect replaces the legacy history entry, and Back from a redirected route returned to `#home`):**

| From | Landed on | Active tab |
|---|---|---|
| `#exchange` | `#market` | Market |
| `#exchange-swap`, `#swap`, `#swap-x` | `#market-cash` | Market |
| `#exchange-ride` | `#market-rides` | Market |
| `#exchange-house` | `#market-rooms` | Market |
| `#exchange-kids`, `#exchange-gear`, `#exchange-other`, `#market-gear` | `#market-items` | Market |
| `#exchange-bogus` | `#market` | Market |

- **Other routes.** `#market-meetups` and `#market-new-items` are not yet kinds: they stay on their hash and show the All view. A shared `#in-` ride link still opens "Shared with you" with its own preview.
- **Hubs.** Money lists Currency converter, Budget, Fair prices and Bargain helper. People lists Travel circle, Local noticeboard, Shared with you and Give back. Checked in the planning, travelling and post-trip phases; `navItems()` has no `#swap`, `#market` or `#exchange` entry.
- **Route sweep** (`scripts/route-sweep.js`, 72 routes from `nav-groups.js` plus the tab bar and extras): 0 fell through to Home. 63 clean on the first pass. The 9 flagged were 7 that the same sweep flags at the tip (Weather's 170 zero-size unit buttons, three short empty states on Near me, Journal and Shared with you, Settings' disabled "Download selected", Phrasebook's never-settled plus disabled button, Welcome's missing topbar) and 2 timing flakes (`#saved`, `#me` NEVER SETTLED); `#saved`, `#me` and `#history-th` were clean twice on a re-sweep.
- **Board by hand.** Posting an item under Items (Kids and baby), a ride and a cash swap each stayed on its Market route and raised its count; All counted 2 after the first two; the Rides chip showed only the ride; removing the ride returned to `#market-rides` at 0.
- **Currency button.** It landed on `#market-cash` with the Cash chip pressed.
- **Screenshots (375 px, 2x, Mekong Retro light and dark).** On `#home` the Home tab is orange with its indicator pip and Market is grey; on `#market` the pip and the orange (light) or bright orange (dark) icon and label move to Market. The stall icon is an awning with a scalloped edge over two posts and a counter, the same 2 px round-capped stroke as the map and compass icons.
- **Guards:** js-syntax 239 files, imports, lazy-data (37 routes), preloads, ui-strings (29 languages, 369 keys), month-arrays, contrast, skins, spacing, place-dupes, undefined (235 files), net-gates (20), sources, place-fields, port-themes and cache-version (38 code files; manifest matches 246 files; pack sizes match) all pass.
- `jsc -m scripts/validate-jsc.mjs`: 18,000 of 18,000 checks, EXIT 0. `jsc -m` parses every edited JS file. `js/main.js` grew by 6 lines (7,552 to 7,558).

## Not done / known issues
- The top ~3 px of the tab bar (at 746 px of 812) show the content scrolled beneath it under the retro stripe, e.g. Home's weather segment control. Measured identical before and after M2, so it predates it.
- New in this slice:
  - Meetups have no chip: there is no on-phone Meetups category. The chip and `#market-meetups` arrive with M4; until then `#market-meetups` shows the All view.
  - The tab badge for unseen notifications (`docs/EXCHANGE.md` §11) waits for M5.
  - The new chip labels (Items, Rooms, Rides, Cash) are not in the UI string tables, like the board's other labels; they show in English. Only the tab label "Market" is translated.
  - On `#market-items` the second chip row (Kids and baby, Gear and bikes, Other) looks like the kind chips, so two chips show as pressed.
  - The "Traveller board" name remains on the Travel circle card and the Near me chip. Neither is in `nav-groups.js`.
  - The search screen's "Market" example chip now shows the translated word but still searches the English one.
  - No `--tab-market` colour token was added: the `--tab-*` tokens are read only by the style-tile preview, not the app.
  - Malay "Laman utama" (Home) is truncated in the tab bar, before and after this slice.
- Carried from D3 and earlier:
  - Two Vietnamese photos are archival black-and-white images (Museum of Cham Sculpture, Hỏa Lò Prison). The Museum of Cham Sculpture credit reads "Unknown authorUnknown author" (`fetch-place-photos.py` joins two author elements without a space).
  - Eight Vietnamese cards are an activity at a landmark and carry the landmark's own lead image. Cát Bà National Park matched by name (its Wikipedia coordinate is 42.5 km east of the island).
  - Places with only a broader article (Bac Ha market, Mai Chau, Da Nang Cathedral, Moc Chau, Ta Phin, Cat Ba's Hospital Cave, the Ben Tre coconut village) have no photo.
  - Tall portrait photos render tall, because `.id-photo img` has no height cap (Phanom Rung is 548 px at 375 px wide).
  - Coordinate gaps to check in D5: Mae Surin Waterfall, Huai Nam Dang viewpoint, Pang Ung.
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - On the journey map at 375 px, the credits panel covers about a quarter of the map.
  - Wat Nokor Bachey's blurb gives the wrong date (D5).
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #111 once its `guards` check passes.
2. Translation review of "Market", by a native speaker if one is available. Least sure: Korean "마켓" (alternative "장터"), Polish "Targ" (alternative "Rynek"), Turkish "Pazar" (also means Sunday), Filipino "Palengke" (a wet market; alternative "Pamilihan"), Chinese "市场" and "市場" (alternative "市集"), Japanese "マーケット" (alternative "市場"). The tables prefer an omitted entry to a wrong one, but `check-ui-strings` requires all 29 keys.
3. Is a Meetups-free Market acceptable until M4? Recommended: yes.
4. Unchanged: the owner actions in `docs/EXCHANGE.md` §15 come before exchange M3. The legal questions in §14 go to Omer Hanegbi or Omri Siri.

## Next session prompts
Start only after PR #111 has merged. The next releasing slice stacks on `mk-v0.635.0`.

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

D3, Cambodia or Laos (one session per country, after M3 or instead of it):
> Read CLAUDE.md, docs/HANDOFF.md and the D3 section of docs/PLAN.md. Run /slice for slice D3: place photos, Cambodia (`--country kh`, 131 gaps) or Laos (`--country la`, 163 gaps).
> Run `scripts/fetch-place-photos.py` with `--report`, `--suggest`, a review into `scripts/place-photo-articles.json`, `--fetch`, `--sheet` (look at every image), then `--install`. Run `build-pack-sizes.py --write` and bump the version.
> Done when: the country's coverage is reported with its new count, 10 sample cards are checked by eye at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: the other countries' photos; local names; citations; the "Free" price display.
