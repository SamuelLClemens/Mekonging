# Handoff — 2026-10-12 (slice D3, Thailand)

## Shipped
- Slice D3 for Thailand (place photos): branch `data/d3-photos-th`, [PR #109](https://github.com/SamuelLClemens/Mekonging/pull/109), commit db0366c, `mk-v0.632.0`.
  - **Not merged yet.** The `guards` check passed on the PR.
- Thailand photo coverage went from 46 to **93 of 293** places. 200 places still have no photo, down from 247.
  - Each photo is the lead image of the place's own English Wikipedia article, with its licence checked on the Commons file.
  - Each image was looked at on contact sheets before it was kept.
  - The 47 new files total 3.0 MB: 66 KB on average, 102 KB at most, 506–800 px wide, with no EXIF data.
- Of the 247 places that had no photo:
  - **47** now have a photo.
  - **186** have no article of their own: stay clusters, practical cards, rentals, fuel, street-food runs, and sights en.wikipedia does not cover.
  - **14** have an article whose lead image cannot be used: two drawn maps, two satellite views, Hua Hin's new platform where the card is about the historic station, a district locator map, four with no lead image, and four that show another card's subject.
  - Each decision, with its reason, is in `scripts/place-photo-articles.json`.
- New tool: `scripts/fetch-place-photos.py`, with `--report`, `--suggest`, `--fetch`, `--sheet` and `--install`. It is documented in `scripts/README.md`.
  - Its licence check matches the whole licence name. The identify fetcher's start-anchored pattern would pass "CC BY-NC" as "CC BY".
  - `CREDIT_NOTES` turns an author field that is a usage note into the name the note gives.
- Two existing credits that the old fetcher cut at 60 characters are restored: Chiang Dao Cave and Koh Samet.
- `build-pack-sizes.py --write`: the places tier is now 27.6 MB.
- `CLAUDE.md` has a new convention line on place photos, and `docs/PLAN.md` has the D3 Thailand status.

## Verified
- All 16 guards pass. `check-cache-version` lists 4 code files, against base e62d890.
- `jsc -m scripts/validate-jsc.mjs`: 17,963 of 17,963 checks (574 photos), EXIT 0.
- An independent jsc count over `loadCountry('th')` gives 293 places with 200 lacking a photo, which matches `--report`.
- Headless Chrome over CDP at 375 px, Mekong Retro light, on 11 cards:
  - the 10 samples were Phanom Rung, Koh Kret, Phimai, Pha Sua, Mandarin Oriental, Thipsamai, Mae Ya, Doi Inthanon summit, Wat Benchamabophit and Koh Kood; Chiang Dao was added for its restored credit;
  - each photo loads and sits at 33–342 px in a document 375 px wide;
  - each caption equals the `photos.js` credit exactly and does not overflow;
  - there were 0 placeholders and 0 console errors, and every card was checked by eye.
- Desktop was not checked: the change is data only, and the photo CSS is unchanged.

## Not done / known issues
- Tall portraits render tall. `.id-photo img` has no height cap, so Phanom Rung (506 × 900) is 548 px high at 375 px wide. A CSS cap would bump the version; it is not done.
- Seven detailed images are 71–102 KB. To go lower, the resize step would have to drop below 720 px or JPEG quality 48.
- Coordinate gaps that are worth a look in D5: Mae Surin Waterfall is 24.7 km from its article's coordinates, Huai Nam Dang viewpoint 55.6 km and Pang Ung 22.2 km. Either side may be wrong; nothing was changed.
- Pai is deferred, and none of its places got a photo (none has an article of its own).
- Earlier items still open:
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - On the journey map at 375 px, the credits panel covers about a quarter of the map.
  - `js/main.js` is 7,784 lines.
  - Wat Nokor Bachey's blurb gives the wrong date (D5).

## Open decisions (need the user)
1. Draft PR #108 (M1, the board refactor) is open alongside #109. Neither has merged.
   - Recommended: merge #109 first, then rebase #108 onto it and bump it to `mk-v0.633.0`.
   - Both bump the version, so whichever merges second must rebase and take the next version.
2. Unchanged from D2: the owner actions in `docs/EXCHANGE.md` §15 come before exchange M3. The legal questions in §14 go to Omer Hanegbi or Omri Siri.

## Next session prompt
Start only after PR #109 has merged. The next releasing slice stacks on its version.
> Read CLAUDE.md, docs/HANDOFF.md and the D3 section of docs/PLAN.md. Run /slice for slice D3: place photos, Vietnam.
> Run `scripts/fetch-place-photos.py --country vi` with `--report`, `--suggest`, a review into `scripts/place-photo-articles.json`, `--fetch`, `--sheet` (look at every image), then `--install`. Run `build-pack-sizes.py --write` and bump the version.
> Done when: Vietnam's coverage is reported with its new count (202 places had none), 10 sample cards are checked by eye at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: Thailand, Cambodia and Laos photos; local names; citations; the "Free" price display.
