# Handoff — 2026-10-12 (slice D3, Vietnam)

## Shipped
- Slice D3 for Vietnam, place photos: branch `data/d3-photos-vi`, [PR #110](https://github.com/SamuelLClemens/Mekonging/pull/110), `mk-v0.634.0`. It is not merged yet.
  - Vietnam now has photos for 76 of 241 places, up from 39. Of the 165 still without one, 159 have no article of their own and 6 have an article whose lead image is missing or not openly licensed.
  - 43 articles were chosen by hand from `--suggest`, using the coordinate distance. All 37 lead images were looked at on contact sheets before `--install`. Every decision is in `scripts/place-photo-articles.json` (`vi`, `no_article.vi`, `rejected`).
  - Pack sizes were regenerated: the places pack grows from 28,904,931 to 31,302,539 bytes (27.6 to 29.9 MB in the script's units).
- Merged before this: slice M1 as [PR #108](https://github.com/SamuelLClemens/Mekonging/pull/108) (4e03a98, `mk-v0.633.0`) and D3 for Thailand as [PR #109](https://github.com/SamuelLClemens/Mekonging/pull/109) (98ce014, `mk-v0.632.0`).

## Verified
- **Coverage:** `--report` before: 241 places, 39 with a photo, 202 without. After: 76 with a photo, 165 without (159 no article, 6 rejected, 0 unreviewed).
- **Images:** 37 files, 2,397,608 bytes in all (about 63 KB each). Smallest 29,460 bytes (Cu Lao Cham); largest 89,815 bytes (Tam Coc boat). Seven are between 70 and 89 KB: Crazy House, My Son, Hoan Kiem, Hoa Lo Prison, Tam Coc, the Japanese Bridge and Dong Ba Market.
- **Licences (all as the script wrote them):** public domain 9, CC BY-SA 4.0 9, CC BY-SA 3.0 7, CC BY 4.0 4, CC BY 2.0 3, CC BY 3.0 2, CC BY-SA 2.0 2, CC BY-SA 3.0 de 1. The licence filter in `fetch-place-photos.py` is unchanged.
- **Every image looked at:** five contact sheets, 37 images, none rejected on sight. The 6 rejections are articles with no openly licensed lead image (Hải Vân Pass, Trà Quế Vegetable Village, Bảy Mẫu Coconut Forest, Thanh Hà Pottery Village, Ti Tốp Island, An Bình Island).
- **Ten place cards by eye at 375 px:** headless Chrome over CDP, Mekong Retro light, 10 shots, none bad. In every one the photo fits the card (about 308 CSS px wide), the credit line is under it and nothing overflows.
  - North: `vi-ext-nho-que-tu-san` (the Nho Quế river in its canyon), `vi-ext-hoan-kiem-ngoc-son` (Turtle Tower through autumn branches), `vi-ext-fansipan-cable-car` (the summit marker in fog).
  - Centre: `vi-ext-thien-mu-pagoda` (portrait 608 × 810, about 409 px high), `vi-ext-po-nagar-cham-towers` (portrait 540 × 810, about 461 px high), `vi-ext-crazy-house-dalat` (portrait 608 × 810, about 409 px high), `vi-ext-dragon-bridge-fire-water-show` (the bridge by day).
  - South: `vi-ext-ho-chi-minh-hotel-continental` (the corner facade), `vi-ext-cantho-cairang-floating-breakfast` (sampans at the market), `vi-ext-ca-mau-cape` (mangrove and the boardwalk).
- **Guards:** all 16 pass, including `check-cache-version --base origin/feat/scaffold-bangkok-slice`: 4 code files (`photos.js`, `main.js`, `offline-pack.js`, `sw.js`), manifest matches (245 files), pack sizes match.
- `jsc -m scripts/validate-jsc.mjs`: 18,000 of 18,000 checks, EXIT 0 (611 photos).

## Not done / known issues
- New in this slice:
  - Two photos are archival black-and-white images of the place itself: the Museum of Cham Sculpture and the Hỏa Lò Prison. A current photograph would suit a traveller better; the Commons lead image is the only source this slice allows.
  - The Museum of Cham Sculpture credit reads "Unknown authorUnknown author": the script strips HTML between two adjacent author elements. It was left verbatim, as the brief required. A `CREDIT_NOTES` entry or a join fix in `fetch-place-photos.py` would correct it.
  - Eight cards are an activity at a landmark or market and carry the landmark's own lead image: Cai Rang breakfast boats, Dong Ba food stalls, Fansipan summit and cable car, Sun World Ha Long, the Dragon Bridge show, the Phong Nha Cave boat, the Nho Que boat trip and the Tam Coc boat ride.
  - Cát Bà National Park matched by name: its Wikipedia coordinate is 42.5 km east of the island, which is the article's error, not the card's.
  - Places with only a broader article (a district, a province, a diocese or a mountain town) were left without a photo: Bac Ha market, Mai Chau, Da Nang Cathedral, Moc Chau, Ta Phin, Cat Ba's Hospital Cave and the Ben Tre coconut village.
- Carried from D3 Thailand and earlier:
  - Tall portrait photos render tall, because `.id-photo img` has no height cap. Phanom Rung is 548 px high at 375 px wide; the tallest Vietnamese one is Po Nagar at about 461 px.
  - Coordinate gaps to check in D5: Mae Surin Waterfall, Huai Nam Dang viewpoint, Pang Ung.
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - On the journey map at 375 px, the credits panel covers about a quarter of the map.
  - Wat Nokor Bachey's blurb gives the wrong date (D5).
  - On `#exchange`, the bottom bar highlights the "You" tab (`TAB_FOR_HEAD`); M2 replaces it with the Market tab.
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #110 once its `guards` check passes.
2. Which releasing slice runs next: exchange M2, or D3 for Cambodia (131 gaps) or Laos (163)? All bump the version, so they run one at a time. Recommended: exchange M2, as the owner has already ruled on the backend.
3. Unchanged: the owner actions in `docs/EXCHANGE.md` §15 come before exchange M3. The legal questions in §14 go to Omer Hanegbi or Omri Siri.

## Next session prompts
Start only after PR #110 has merged. The next releasing slice stacks on `mk-v0.634.0`.

Exchange M2 (next):
> Read CLAUDE.md, docs/HANDOFF.md and docs/EXCHANGE.md §11 and §17 (M2). Run /slice for slice M2: the Market tab.
> Add the sixth bottom tab "Market" (`#market`) after Explore with a market-stall icon. Map `market`, `exchange` and `swap` to it in `TAB_FOR_HEAD`. Add the legacy redirects listed in §11. Remove "Traveller board" (People), "Cash swap" and "Gear market" (Money) from `js/nav-groups.js`. Point the currency button at `#market-cash`. `#market` shows the on-phone board from `js/screens/exchange.js` under the title "Market".
> Also correct docs/EXCHANGE.md §17 M1: only circle.js imports from js/screens/exchange.js; the currency screen links to #exchange-swap.
> Done when: at 375 px in headless Chrome the bar shows six tabs and the measured width of the "Market" label fits its slot; the Market tab is highlighted on `#market`, `#exchange-gear` and `#swap`; the Money and People hubs no longer list the three items; a route sweep shows every legacy route on its new tab; all guards pass.
> Out of scope: any Supabase work, any account or key handling, sign-in screens (M3).

D3, Cambodia or Laos (one session per country, after M2 or instead of it):
> Read CLAUDE.md, docs/HANDOFF.md and the D3 section of docs/PLAN.md. Run /slice for slice D3: place photos, Cambodia (`--country kh`, 131 gaps) or Laos (`--country la`, 163 gaps).
> Run `scripts/fetch-place-photos.py` with `--report`, `--suggest`, a review into `scripts/place-photo-articles.json`, `--fetch`, `--sheet` (look at every image), then `--install`. Run `build-pack-sizes.py --write` and bump the version.
> Done when: the country's coverage is reported with its new count, 10 sample cards are checked by eye at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: the other countries' photos; local names; citations; the "Free" price display.
