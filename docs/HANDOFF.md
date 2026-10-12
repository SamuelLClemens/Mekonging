# Handoff — 2026-10-12 (slice D2)

## Shipped
- Slice D2 (city gaps): branch `data/d2-city-gaps`, [PR #106](https://github.com/SamuelLClemens/Mekonging/pull/106), merged as 20cf542, live as `mk-v0.631.0`. On 20cf542, both `guards` and the Pages deploy succeeded.
  - 18 `WEATHER_SPOTS` anchors. Each city has one record, so its anchor (the medoid) is that record's coordinates.
  - 24 city history entries across `js/data/history.cities.<cc>.js`, in the layout the guard parses.
  - Duy Phu needed nothing: `citySlug()` strips "(My Son)", so `vi-duy-phu` already resolved.
  - Ponhea Krek was a mislabel. `kh-ext-banteay-prey-nokor` duplicated `kh-ext-wat-nokor-bachey`: same temple, same coordinates, 2 km from Kampong Cham city (Wikipedia).
    - The owner chose to merge it. `place-merges.js` maps the old id to the surviving record.
    - `check-place-fields` now pins 882 places and 765 `scamWarnings`.
  - The anchor counts in the `weather.js` comments were stale and are re-measured.
- Merged earlier today: M0 (PRs #104 and #105, documents only) and D1 (PR #103, `mk-v0.630.0`).

## Verified
- jsc over `loadAllCountries()`:
  - before: 19 cities had no spot and 25 had no history (not 26, because of Duy Phu);
  - after: 0 and 0, across 164 cities with 165 spots and 166 history entries.
- All 16 guards pass. `check-cache-version` lists 9 code files and passes against the new base 1fac8f2.
- `jsc -m scripts/validate-jsc.mjs`: 17,916 of 17,916 checks, EXIT 0.
- `check-month-arrays` parsed all 24 new records. A planted fault was caught and then reverted.
- The old id `kh-ext-banteay-prey-nokor` resolves to Wat Nokor Bachey through `getPlace()`.
- Headless Chrome over CDP at 375 px, Mekong Retro light:
  - `#places-th-lampang`: Nearby showed 19 Chiang Mai venues before. It now shows 1, Wat Phra That Lampang Luang.
  - `#places-vi-dien-bien-phu`: Nearby showed 27 Sapa items before. It now shows 1, the Victory Museum and A1 Hill.
  - `#places-kh-kampong-cham`: Wat Nokor Bachey now appears once.
  - On all three, "About <city>" renders inside 16–359 px, the document is 375 px wide, and there are 0 console errors.
  - Desktop was not checked: the change is data only.

## Not done / known issues
- Wat Nokor Bachey's blurb dates the temple to the 11th century; Wikipedia dates it to late in Jayavarman VII's reign. Left for D5 (citations).
- Tbong Khmum province has no place record now that the duplicate is gone. Hello Angkor's Banteay Prei Nokor citadel in Ponhea Kraek is a candidate, but it has a single source.
- History facts were checked against each place record's sources and Wikipedia introductions; no URL is stored per entry, which matches the existing city records.
- Free places print "฿0 (≈ $0)" instead of "Free" (D1 raised a follow-up chip; it bumps the version).
- On the journey map at 375 px, the map credits panel opens expanded and covers about a quarter of the map.
- `js/main.js` is 7,784 lines; the ceiling is ~1,500.

## Open decisions (need the user)
1. Before exchange M3: the owner actions in `docs/EXCHANGE.md` §15 (Supabase, Resend, Turnstile, DNS, Auth settings).
2. Take the questions in `docs/EXCHANGE.md` §14 to Omer Hanegbi or Omri Siri. M9 (launch) and M10 (cash swap) wait on them.

## Next session prompt
The owner chose D3 next; PR #106 has merged, so it can start now. M1 follows D3, because both bump the version.
> Read CLAUDE.md, docs/HANDOFF.md and the D3 section of docs/PLAN.md. Run /slice for slice D3: place photos, Thailand.
> Fetch the Wikipedia lead image of each Thai place's own article (openly licensed only, credit verbatim), look at every image, resize to about 800 px and about 60 KB, and add them to `js/data/photos.js`. Extend `scripts/fetch-identify-photos.py` or add a sibling script, and commit it. Run `build-pack-sizes.py --write`.
> Done when: Thailand's photo coverage is reported with its new count (247 places had none), 10 sample cards are checked by eye at 375 px in headless Chrome, and all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: Vietnam, Cambodia and Laos photos; local names; citations; the "Free" price display.
