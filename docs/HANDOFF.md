# Handoff — 2026-10-12 (slice M1, exchange)

## Shipped
- Slice M1, the board moved out of `main.js`: branch `refactor/m1-board`, [PR #108](https://github.com/SamuelLClemens/Mekonging/pull/108), `mk-v0.633.0`. It is rebased onto the D3 merge (98ce014) and is not merged yet.
  - `bulletinScreen`, `buildBBForm`, `listingCard`, `BB_CATS` and their helpers moved by name into `js/screens/exchange.js` (258 lines). It is a lazy screen module loaded for `#exchange`, `#swap` and `#market`.
  - `circle.js` imports `bbCat`, `bbHeadline`, `bbSubline` and `swapCalcNodes` from it. `main.js` dropped four imports that only the board used.
  - The file is named for its route, because the `board` screen key and `js/screens/board.js` already belong to the Local noticeboard. `docs/EXCHANGE.md` says so.
- Slice D3 for Thailand merged before this as [PR #109](https://github.com/SamuelLClemens/Mekonging/pull/109) (98ce014, `mk-v0.632.0`). On 98ce014 both `guards` and the Pages deploy succeeded. Thailand now has photos for 93 of 293 places; the details are in the PR and in `docs/PLAN.md`.

## Verified
- **`js/main.js` is 232 lines shorter:** 7,784 lines down to 7,552.
- **Computed-style digest identical before and after:**
  - Method: headless Chrome over CDP at 375 px, Mekong Retro light, all folds open. Service worker bypassed, and every non-local request blocked, so rates and weather cannot differ. The same four on-device listings were seeded on both sides.
  - Per element it records a hash of every computed property (sorted, because Chrome lists custom properties in a different order on each run), plus the attributes, the element's own text and its box.
  - Result after the rebase, base 98ce014 against the branch: 8 routes, 0 page errors, document width 375 on both sides. The routes are `#exchange` (173 elements), `#exchange-swap` (196), `#exchange-kids` (192), an `#in-` board link (136), `#swap` (196), `#market` (190), `#inbox` (128) and `#currency` (180).
  - Negative control: a planted class change in `listingCard` was caught on exactly the 4 listing cards it touched, in style and attributes. The file was then restored byte for byte.
- All 16 guards pass, including `check-cache-version`: 3 code files plus `sw.js`, manifest regenerated, 245 files.
- `jsc -m scripts/validate-jsc.mjs`: 17,963 of 17,963 checks, EXIT 0.
- Desktop was not checked: the move changes no CSS and no markup, which the digest proves at 375 px.

## Not done / known issues
- On `#exchange`, the bottom bar highlights the "You" tab. This predates M1 (`TAB_FOR_HEAD`), and M2 replaces it with the Market tab.
- Carried from D3 and earlier:
  - Tall portrait photos render tall, because `.id-photo img` has no height cap. Phanom Rung is 548 px high at 375 px wide.
  - Seven detailed photos are 71–102 KB.
  - Coordinate gaps to check in D5: Mae Surin Waterfall, Huai Nam Dang viewpoint, Pang Ung.
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - On the journey map at 375 px, the credits panel covers about a quarter of the map.
  - Wat Nokor Bachey's blurb gives the wrong date (D5).
  - Pai stays deferred.

## Open decisions (need the user)
1. Merge PR #108 once its `guards` check passes.
2. Which releasing slice runs next: D3 for Vietnam, as the D3 handoff planned, or exchange M2? Both bump the version, so they run one at a time. Recommended: D3 Vietnam, which keeps the owner's data order.
3. Unchanged: the owner actions in `docs/EXCHANGE.md` §15 come before exchange M3. The legal questions in §14 go to Omer Hanegbi or Omri Siri.

## Next session prompts
Start only after PR #108 has merged. The next releasing slice stacks on `mk-v0.633.0`.

D3, Vietnam (recommended next):
> Read CLAUDE.md, docs/HANDOFF.md and the D3 section of docs/PLAN.md. Run /slice for slice D3: place photos, Vietnam.
> Run `scripts/fetch-place-photos.py --country vi` with `--report`, `--suggest`, a review into `scripts/place-photo-articles.json`, `--fetch`, `--sheet` (look at every image), then `--install`. Run `build-pack-sizes.py --write` and bump the version.
> Done when: Vietnam's coverage is reported with its new count (202 places had none), 10 sample cards are checked by eye at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: Thailand, Cambodia and Laos photos; local names; citations; the "Free" price display.

Exchange M2, after that:
> Read CLAUDE.md, docs/HANDOFF.md and docs/EXCHANGE.md §11 and §17 (M2). Run /slice for slice M2: the Market tab.
> Add the sixth bottom tab "Market" (`#market`) after Explore with a market-stall icon. Map `market`, `exchange` and `swap` to it in `TAB_FOR_HEAD`. Add the legacy redirects listed in §11. Remove "Traveller board" (People), "Cash swap" and "Gear market" (Money) from `js/nav-groups.js`. Point the currency button at `#market-cash`. `#market` shows the on-phone board from `js/screens/exchange.js` under the title "Market".
> Done when: at 375 px in headless Chrome the bar shows six tabs and the measured width of the "Market" label fits its slot; the Market tab is highlighted on `#market`, `#exchange-gear` and `#swap`; the Money and People hubs no longer list the three items; a route sweep shows every legacy route on its new tab; all guards pass.
> Out of scope: any Supabase work, any account or key handling, sign-in screens (M3).
