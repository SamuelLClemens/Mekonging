# Handoff — 2026-10-12

## Shipped
- Weather map matches the Places map; journey borders are dotted red; route casing renders again. `fix/weather-map-basemap`, PR #100, merged as fddbf23, live as mk-v0.629.0.
- `check-js-syntax` guard (the sixteenth) and the repaired `scripts/validate.mjs`. `ci/js-syntax-check`, PR #101, merged as fc4c9dc. Post-merge guards and the Pages deploy succeeded.
- Branch protection on `feat/scaffold-bangkok-slice`: the `guards` check is required, admins included, and force-push and deletion are blocked.
- `docs/PLAN.md`, written on `data/gap-inventory` (documents only). It holds:
  - the measured data inventory;
  - data slices D1–D6 in the owner's order, plus the queued 375 px audit (Q1);
  - the traveller-exchange decisions and the M0 planning brief.

## Verified
- Data inventory at fc4c9dc: jsc over `loadAllCountries()`, `check-place-fields.py` and `check-sources.py`.
  - Of 883 places, 743 have no photo, 572 have no `localName`, 35 have no `whyItFits`, 39 have no `tips` and 39 have no `mapQuery`.
  - 19 cities have places but no weather spot, and 26 have places but no city history entry.
  - 247 place records cite only a homepage, and 37 routes have no source.
  - The figures per country are in `docs/PLAN.md`.
- Free-tier limits for Supabase, Resend and Firebase come from the providers' own pricing and limits pages, read on 2026-10-12. They are cited in `docs/PLAN.md`.

## Not done / known issues
- `scripts/validate.mjs` reports 46 findings, so it is not in CI. Slice D1 fixes them.
  - An earlier note described the 35 as missing a "blurb". In fact they all have a blurb and lack `whyItFits`, `tips` and `mapQuery`.
- On the journey map at 375 px, the map credits panel opens expanded and covers about a quarter of the map. `initMap` does not collapse it. This predates PR #100.
- `js/main.js` is 7,784 lines; the ceiling is ~1,500.
- The main checkout is still on the merged `fix/weather-map-and-journey-routes`. Switch it to `feat/scaffold-bangkok-slice` and delete that branch once no session is using that checkout.

## Open decisions (need the user)
- None for the data slices.
- The exchange needs three owner actions before M1. They are not needed for M0. The full list is in `docs/PLAN.md`:
  - create the free Supabase project and the free Resend account;
  - add Resend's DNS records for mekonging.com in Cloudflare;
  - take the legal questions to Omer Hanegbi or Omri Siri.

## Next session prompts
Data, run in sequence:
> Read CLAUDE.md, docs/HANDOFF.md and docs/PLAN.md. Slice D1: place text and the validator in CI.
> Write `whyItFits`, `tips` and `mapQuery` for the 35 Thai stay-area cards, and `tips` for the 4 beaches named in the plan. Fix the 10 low-above-high prices and the `veg` dish category. Add `validate.mjs` to guards.yml.
> Done when: `validate.mjs` reports 0 errors in CI, and the edited places show their new text at 375 px in headless Chrome.
> Out of scope: photos, local names, citations, city gaps.

Exchange planning, can run in parallel (documents only):
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller exchange" section of docs/PLAN.md. Slice M0: write docs/EXCHANGE.md to the brief there, using Opus.
> Read js/screens/circle.js, js/social.js and the bulletin board in js/main.js (`bulletinScreen`, `buildBBForm`, `BB_CATS`) for the current design.
> Done when: docs/EXCHANGE.md covers every item in the M0 brief and ends with M1…Mn slices, each with a done-when line.
> Out of scope: any code, any account creation, any key handling.
