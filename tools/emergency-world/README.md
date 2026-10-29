# The worldwide emergency-number table (slice F7b)

`js/data/emergency-world.<region>.js` holds the national emergency numbers for the countries outside Thailand, Vietnam,
Cambodia and Laos. These scripts built it and are how to refresh it. Numbers change: re-run this when a country's number
changes, when a traveller reports a wrong one, or once a year. Nothing here is shipped, so none of it bumps the version.

## The rule the table follows
- A number is in the table because a **government page states it for that service**: the Government of Canada's travel
  advice (`travel.gc.ca/destinations/<country>`, its "Emergency services" block) or the UK FCDO's
  (`gov.uk/foreign-travel-advice/<country>/getting-help` and `/health`). Each entry cites the pages it used (`src`, `src2`).
  Never cite Wikipedia or a directory: it is a lead, not a source (`scripts/check-emergency-world.py` fails on one).
- Where the two pages give **different numbers for one specific service**, the service is left out (a unified number such as
  112, 911 or 999 never conflicts with a specific one). Where one page states a general number the other contradicts,
  or a page says there is no central number, the country is a gap: the screen gives 112 and the coordinates.
- The numbers are the national ones a traveller dials. City-only numbers and long landline numbers are not published.

## Refresh
All scripts are standard-library Python 3 and run as `python3 -I tools/emergency-world/<script>.py`. Caches (about 50 MB of
HTML) live outside the repo, in `$EMERGENCY_WORLD_CACHE` (default `~/Library/Caches/mk-emergency-world`).

1. `harvest.py ca` and `harvest.py uk` fetch the two sources for every destination (3 s a page, resumable; run them in
   the background, in parallel). They write `ca.json` and `uk.json`: the raw text of each emergency block.
2. `draft.py <region>` writes `decisions/<region>.draft.txt` for the unambiguous countries (Canada's block fully
   structured, or one general number, and the UK page agrees or is silent) and prints the **raw evidence of every other
   country**. Read it. The drafter decides nothing about a conflict.
3. Edit `decisions/<region>.txt`: one line per country, `<id> <label>:<number>:<c|u|cu> ...`, where `c` means Canada's page
   states it and `u` the UK's. Label codes are at the top of `build_region.py` (G general, P police, A ambulance, F fire,
   T traffic police, S search and rescue, K coast guard, U tourist police). A comment line says why a service was left out.
4. `build_region.py <region> <repo-root>` writes the region file. **It refuses a decision whose number is not in the cited
   page's harvested text**, so a typo cannot ship, and it allows two source pages per entry at most.
5. `scripts/check-emergency-world.py`, then the guards in `CLAUDE.md`, then a rendered check: F7a's driver pattern (a fake fix
   in headless Chrome, `#sos` and `#hospital` at 375 px) on a fix in each region you touched.

`review.py match` lists the outline ids and pages that did not pair by name (`ALIAS` and the `cam.update` lines in
`build_region.py` hold the pairs made by hand). The country ids are the world outline's, not this app's: `vi` is the US
Virgin Islands, Vietnam is `vn`, and `th`, `vn`, `kh` and `la` are never in the table (`js/data/emergency-numbers.js`).

## What the first build left open (2026-10-29)
See `docs/PROGRAM.md` 4.4, row "Location". In short: 22 gaps; Egypt, Sri Lanka and about a dozen smaller services left out
for a conflict that a third government source could settle (the host country's own page where one exists).
