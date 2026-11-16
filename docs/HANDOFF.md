# Handoff, 2026-11-17 (F8 built, PR 163 to be marked ready; F6 is next)

Every open item lives in `docs/PROGRAM.md` section 4. The previous handoff (L2c-3c) is `git show d4132dd:docs/HANDOFF.md`; its L2c-3d prompt still stands after F6.

## Shipped
- **F8**, the stale stored location: branch `feat/f8-stale-fix`, [PR 163](https://github.com/SamuelLClemens/Mekonging/pull/163), `mk-v0.673.0` (CACHE_VERSION and manifest bumped, 351 files), cut from the tip `d4132dd`. Commits `8b390c5` (code, 25 interface keys), `21da95d` (docs), `02b3333` (handoff), then a docs commit that records the owner's answers of 2026-11-17. Opened as a draft; the owner chose on 2026-11-17 to mark it ready, and the planning session runs `gh pr ready 163` after the last push. Merging is the owner's.
  - Owner rulings of 2026-11-16: a stored location is old after one hour; the wording "Old location"; the iPhone dialog only on a tap. The PR also records the owner's other rulings (the order, T16, F9, Q2, the removed branches) in `docs/PROGRAM.md` and `docs/PLAN.md`.
  - Past an hour, Emergency, the hospital screen, the survival guide, the outside-the-region screen and Home say the location is old and when it was taken, with an `Update my location` button. `js/fix-refresh.js` reads a position on return to the foreground and when those screens open, only where the Permissions API says `granted`. The watch's error callback records why. Settings, `Location status`, prints what the browser reports.
  - Tools outside the repo, in `~/Library/Caches/mk-f8/`: `repro.py` (the defect), `verify.py` (the checks; its `Driver` seeds state and opens routes), `guards.sh`, `ed.py` (exact-match edits: Edit and Write are refused for Mekong paths from a Nomadic Almanac launch worktree), `f8-strings.tsv`.

## Verified
- Headless Chrome at 375 px, `document.hidden` false on every row: 178 checks, 0 failed, 0 console errors, 0 elements past the viewport edges, 44 px tap targets. Before the change a Bangkok fix 3 and 40 days old at permission `prompt` made Emergency read "Showing Thailand, near Bangkok" and Home read "Bangkok", with no hint.
- Covered: 59 minutes inside the limit, 61 past it; an unknown age; a fix outside the region (Singapore); a border fix; en, th, vi, km, lo with no slot unfilled; a refused tap; a held permission replacing a 3-day-old fix with no tap on cold start and on a return to the foreground (the watch stubbed out, so only the return can ask); the Settings readout.
- Every guard in `CLAUDE.md` passes, including `check-undefined` (329 files) and `check-cache-version` against `origin/feat/scaffold-bangkok-slice`.
- The docs-only commit of 2026-11-17 changes no shipped file, so the version stays `mk-v0.673.0` and `check-cache-version` still passes. The remote branches were re-read on 2026-11-17: the production branch, the three `assets/*-shots` branches and this PR's branch.

## Answered by the owner (2026-11-17, relayed by the planning session)
1. Mark PR 163 ready: yes. Only the production branch is served over HTTPS, so the iPhone check below runs on the live site after the merge; anything it finds goes in a follow-up PR.
2. Remove `feat/s1-tokens-machinery` and `fix/transport-leaving-reverse`: done on 2026-11-17 by the planning session, after checking that PR 148's em-dash work is in the tip (55 files, identical em-dash counts) and that the second branch holds only a merge commit. Names and SHAs: `~/Library/Caches/mk-housekeeping/removed-2026-11-17.tsv`.
3. The translation top-up is slice **L2d**, right after L2c-3e. The order is F6, L2c-3d, L2c-3e, L2d, L3.

## Not done / known issues
- **Unknown:** what the Permissions API answers on an iPhone Home Screen install (this Mac has no iOS Simulator). The owner reads it on the phone (steps below). If an install reports `prompt` at every launch, one tap per launch refreshes the location, by the owner's ruling; any other rule needs the owner.
- Screens that only measure a distance from the stored fix (Nearby, Places, Search, Food, Exchange, Weather, Today, the walk bar, the map, the journal, `inferPhase`) still use an old fix without saying so: `docs/PROGRAM.md` 4.4, new row. Home's line shows on the road only (phase `traveling`), as the old hint did.
- The 22 other machine languages show English for the 25 new keys (`null`) until L2d. Since L2 `check-ui-strings` wants a new key in every language but tl, tr and uk (now in `CLAUDE.md`). L2c-3d and L2c-3e must regenerate their key lists: 1,656 keys, not 1,631.
- Not run in WebKit or on an iPhone: the date format and `visibilitychange` on a Home Screen app. The th, vi, km and lo strings are machine-made and unread.

## Open decisions (need the user)
1. F6's first step is a question to the owner, asked by the F6 session: how long a hand-picked place holds (a time, until the traveller moves a distance, until they ask). Nothing else is open.

## The owner's iPhone check (once the release is live; one small step per message, each verified by the session; never ask for pasted text)
1. Open the Home Screen app, then You, Settings, `Location status`. Read `Release:` (it must say mk-v0.673.0) and `Permission now:`.
2. Close the app completely, reopen it, open the card again: does `Permission now` change?
3. Tap `Check again`. Does a dialog appear? Does `Stored location` become a few minutes old?
4. More than an hour after the last location, open Home or Emergency: the old-location line shows. Tap `Update my location`.

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. `git fetch origin`. F6 stacks on the merged tip of PR 163 (it edits `focusSpot` and Home beside F8 and bumps the same version line), so if 163 is not merged, ask the owner. Run /slice for F6: a place picked by hand holds over a live fix (decision 29, ruled 2026-10-27: hold the pick). First step: one AskUserQuestion form to the owner on how long a pick holds (a time, until the traveller moves a distance, until they ask), with a recommendation.
> Done when: with a picked place and a live fix in another town, Home, Weather, Today and Places name the picked place until the owner's rule ends it, and the end of the hold is visible; 375 px, 0 console errors, every guard passes; version, cache and manifest bumped. Out of scope: F8's old-location notes, the other `nearestSpotGlobal` callers (4.4), L2c-3d, L2d. After F6 the order is L2c-3d, L2c-3e, L2d, L3.
