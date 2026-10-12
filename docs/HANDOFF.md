# Handoff — 2026-10-12

## Shipped
- Weather map matches the Places map (basemap, Map/Satellite toggle sharing `placesMapSat`, compass, locate, scale); journey borders dotted red; route casing renders again — `fix/weather-map-basemap` — PR #100, merged as fddbf23, live as mk-v0.629.0
- `check-js-syntax` guard (sixteenth guard) and the repaired `scripts/validate.mjs` — `ci/js-syntax-check` — PR #101 (open, CI green)
- Branch protection on `feat/scaffold-bangkok-slice`: the `guards` check is required, admins included, force-push and deletion blocked (owner-approved; set with `gh api`)
- Ten worktrees on merged branches removed (all clean, 0 commits ahead); their branches are kept

## Verified
- PR #100: headless Chrome at 375 × 812, Mekong Retro light and dark, with three stops seeded (Bangkok, Siem Reap, Pakse). Weather, Places and Journey maps all show the toggle, compass, locate button and scale. Markers: 20, 293 and 5. Page width is 375 on all three. Console errors: 0 on each map; Places and Journey had 8 `mk-route-casing` errors each before the fix. Pressing "Map view" on Weather set `placesMapSat` to false, and Places then opened in Map view.
- Live site: `sw.js` and `js/main.js` serve mk-v0.629.0, and `js/map.js` contains the casing fix (curl, 2026-10-12).
- PR #101: the guard parses 237 files (234 modules, 3 scripts): 1.5 s with JavaScriptCore locally, node v22.23.3 in CI. Errors injected into `js/util.js` and `sw.js` failed with the right lines. All 16 guards passed in CI.

## Not done / known issues
- PR #101 is waiting for the owner to merge it.
- `scripts/validate.mjs` reports 62 data findings, so it is not in CI. The list is in scripts/README.md under "Content validator".
- On the journey map at 375 px, the map credits panel opens expanded and covers about a quarter of the map. `initMap` does not collapse it, unlike `initWeatherMap`. This predates PR #100.
- About 600 of roughly 1,900 place citations are homepage-only (tripadvisor.com 247, vietnam.travel 90, tourismthailand.org 89, Cambodian tourism sites 75, tourismlaos.org 46). `check-sources` stops the number growing but does not reduce it.
- `js/main.js` is 7,784 lines; the ceiling is ~1,500.
- The main checkout is still on the merged `fix/weather-map-and-journey-routes` (94243ba, now superseded by 5d80e00 in PR #100). Delete it once no session is using that checkout.

## Open decisions (need the user)
1. Validator findings: for each kind, is the data wrong or the rule? Recommended: treat the 10 low-above-high prices and the `veg` dish category as data bugs and fix them. Ask the owner whether `isLocal: false` (16 places) and stays without `blurb`/`whyItFits` (35) are allowed, then relax or keep each rule.

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Slice: rendered-screen audit at 375 px. Load every route in js/nav-groups.js in headless Chrome (reuse `launch`/`CDP` from tools/style-tiles/capture.py; Mekong Retro light and dark; seed the store as capture.py does) and record, per route: horizontal overflow, controls under 44 × 44 px, console errors, text contrast failures, and controls covered by overlays (the journey map's credits panel is a known case). Write a ranked findings table with measured values to docs/AUDIT_375.md, with screenshots in the scratchpad only.
> Done when: every route in js/nav-groups.js has a row with measured values in both themes, and the top five findings each have a proposed fix and a file:line. Out of scope: fixing anything beyond one-line obvious bugs, citation work, the main.js split, the validator findings.
