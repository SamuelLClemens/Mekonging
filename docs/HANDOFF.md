# Handoff — 2026-10-12 (slice D1)

## Shipped
- Slice D1 — `data/d1-place-text` — [PR #103](https://github.com/SamuelLClemens/Mekonging/pull/103), commit 1347238, `mk-v0.630.0`. Open; CI had not reported when this was written.
  - `whyItFits`, `tips` and `mapQuery` for the 35 Thai stay-area cards. `tips` for the 4 beaches in `docs/PLAN.md`.
  - 8 Lao places: the "low above high" was in fact missing `low`/`high`. Four take the range their own note states; four are free entry and use `0/0`.
  - Dish `th-pad-pak-bung`: category `veg` became `street`, as for `kh-cha-kreoung`.
  - Routes: the 2 errors were "from US$68" flights with `high: null`. `validate.mjs` now accepts an explicit `high: null`, with a number `low` ("from") or `low: null` (quoted on request). This also covers 2 on-request options that had passed only because `null <= null` is true in JavaScript.
  - `guards.yml` runs `node scripts/validate.mjs`; `guard()` now takes the interpreter as its first argument.
  - `scripts/validate-jsc.mjs` runs the validator locally under jsc, because this machine has no Node.

## Verified
- Validator under jsc: 46 errors before, 0 after, across 17,927 checks.
- Negative test: 4 planted faults were all caught. They were a route inversion, a missing `low`, a missing `high`, and a place with `high` deleted.
- All 16 guards pass locally. `check-cache-version` lists the 6 shipped files plus `sw.js`.
- Headless Chrome over CDP at 375 px, Mekong Retro light, all folds opened, all 39 places:
  - 148 of 148 new strings rendered and visible;
  - all inside the viewport, with document width 375 and 0 console errors.
  - Fold titles match untouched places, with "Why it fits you" first.

## Not done / known issues
- CI result for PR #103 is not yet confirmed, so D1's done criterion is not yet confirmed. Node runs the validator in CI for the first time there. Check the `guards` check before merging.
- Free places print "฿0 (≈ $0)" instead of "Free". This is the 0/0 convention across the dataset, and the 4 free Lao places now share it. A follow-up task chip was raised: start it after #103 merges, because it also bumps the version.
- Pai: D1 wrote text for 2 existing Pai cards, which the plan listed. CLAUDE.md says Pai is deferred; no new Pai data was added.
- On the journey map at 375 px, the map credits panel opens expanded and covers about a quarter of the map. `initMap` does not collapse it.
- `js/main.js` is 7,784 lines; the ceiling is ~1,500.

## Open decisions (need the user)
- None for the data slices.
- The exchange still needs three owner actions before M1; they are not needed for M0. The full list is in `docs/PLAN.md`:
  - create the free Supabase project and the free Resend account;
  - add Resend's DNS records for mekonging.com in Cloudflare;
  - take the legal questions to Omer Hanegbi or Omri Siri.
- M0 is running in another worktree, `docs/exchange-m0`.

## Next session prompt
Start only after PR #103 has merged, because D2 also bumps the version.
> Read CLAUDE.md, docs/HANDOFF.md and the D2 section of docs/PLAN.md. Run /slice for slice D2: city gaps.
> Add `WEATHER_SPOTS` anchors in js/weather.js for the 19 cities listed. Add city history entries in `js/data/history.cities.<cc>.js` for the 26 cities listed, keeping the layout that `check-month-arrays.py` parses. Check Duy Phu against "Duy Phu (My Son)" first.
> Done when: every city that has places has a weather spot and a history entry, measured with jsc over `loadAllCountries()`; all guards and `jsc -m scripts/validate-jsc.mjs` pass; and two of the new cities show the right "Nearby" places and history at 375 px in headless Chrome.
> Out of scope: photos, local names, citations, the "Free" price display.
