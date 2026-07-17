# MEKONGING — Build Status and Handoff

Last updated: 2026-07-17. Branch: `feat/deep-content`. Current version: `mk-v0.243.0`.

Staged commit messages in the scratchpad: `commitmsg_mk238.txt` (drive-time near-me),
`commitmsg_mk239.txt` (P2P swap + gear), `commitmsg_mk240.txt` (unified Traveller Board),
`commitmsg_mk241.txt` (Local Secrets), `commitmsg_mk242.txt` (board chip polish),
`commitmsg_mk243.txt` (onboarding top-skip). A single consolidated message is in
`commitmsg_session.txt`, and `deploy_when_git_works.sh` will commit + merge to the deploy
branch in one run once git is restored.
Preview now served on port **8799** (fresh origin) via `serve.rb` (no-store). Clear the SW +
caches before each verification — the app re-registers a SW on load and will serve stale modules.

This file is the resume point for the next session. It records the environment blocker,
what shipped, what is staged but uncommitted, and the sequential work that remains.

---

## 0. CRITICAL ENVIRONMENT BLOCKER — read first

- **Git, `python3`, and `node` are all non-functional in this machine's current state.**
  Each resolves only to an Xcode Command Line Tools shim (`/usr/bin/*`), and the CLT are not
  installed (`xcode-select -p` fails with "unable to get active developer directory").
- **Consequence:** code can be edited and verified in the browser, but nothing can be
  committed, merged, or pushed — therefore **nothing deploys to GitHub Pages** until git works.
- **Fix (must be done by the user, outside the agent):** install the Command Line Tools, e.g.
  run `xcode-select --install` in Terminal and complete the GUI installer, or point
  `xcode-select` at a full Xcode. The agent will not run the system installer or use `sudo`.
- **Verification path that DOES work this session:** a Ruby WEBrick static server
  (`/usr/bin/ruby` 2.6.10 is a real binary) serves `/tmp/mekong_preview` on port 8746 with
  correct JS-module MIME types. The in-app browser loads it for parse checks and UI testing.

## 1. Deploy procedure (once git is restored)

1. Confirm on `feat/deep-content`.
2. `git add -A && git commit -F /path/to/commit-message.txt`
   (commit message staged in the session scratchpad; see section 5).
3. `git checkout feat/scaffold-bangkok-slice` (the only auto-deploying branch — never `main`).
4. `git merge --no-ff feat/deep-content`
5. `git push`
6. `git checkout feat/deep-content`
7. Confirm the live version string shows `mk-v0.238.0`.

## 2. Shipped and verified this session (uncommitted on `feat/deep-content`)

- **Drive-time "Near me" (`mk-v0.238.0`).** Replaced the straight-line 60 km cap with an
  estimated **road-drive-time** ceiling of about an hour give or take. New helpers in
  `js/main.js` (`ROAD_FACTOR`, `DRIVE_KMH`, `NEAR_MAX_MIN`, `DAYTRIP_MAX_MIN`, `estDriveMin`,
  `withinNear`, `withinDayTrip`, `driveLabel`).
  - Propagated to every "near me" surface: `scoreForNow` (Home right-now), `nearbyScreen`
    ("Closest to you"), `daySuggestScreen` tiers and fallback, `todoDistLabel`, `distanceChip`
    (every place card), and the arrival-hub "nearest beach" pointer.
  - Every row now shows an estimated **walk time** (under 2.5 km) or **drive time** (rounded to
    5 minutes), e.g. "26 km · ~40 min drive · W".
  - New collapsed **"Further afield · next destinations"** tier in `nearbyScreen` for real
    day-trip options (beyond ~1 hour, up to ~3 hours). CSS `.near-afield` added.
  - **Verified in-browser** anchored at Pai: Chiang Mai (86 km / ~2h 15m) is excluded from
    "near me" and correctly demoted to "Further afield" / "Worth a day trip". Zero console
    errors. `js/main.js` parses cleanly.

## 3. Also present but UNCOMMITTED from prior sessions (verify these ship together)

These were applied in earlier sessions and are still uncommitted on `feat/deep-content`:

- Colour-coded attribute/status chips (`attrClass`, `attrTag`) across `travelerChips`, todo
  reasons, right-now tags, and near-me tags; CSS `.attr-tag` palette.
- Open-by-default logic: known-closed places excluded from Home right-now; sunk and tagged
  "🔒 Closed now" in today/nearby lists (`openStateNow`).
- Fit-first ordering with "⚠️ may not suit you" tags for kids/mobility (`placeFitReason`).
- "Your first hour" as a collapsed dropdown except in the "arrived" phase
  (`arrivalEssentials(country, featured)`).
- Diet-aware "Where you can eat" (`dietEatCard`, `VEG_SPOTS`) — kosher Chabad + web-verified
  vegetarian/vegan venues, honest about untagged eateries and the Laos gap.
- Photo coverage batch (curated exact-Wikipedia lead images; `img/places/` + `PHOTOS`
  registry). Coverage roughly 35 percent.

## 4. Remaining roadmap (master-prompt items, adapted to the real architecture)

The app is a **vanilla ES6-module PWA with no backend and a deliberate no-server, no-PII
design**. The master prompt's React/TypeScript hooks, Framer Motion, and "sync to the Mekonging
DB" do not fit and would break the privacy model. Each item below is the native equivalent.

Priority order (each is one independently shippable, browser-verified wave):

1. **DONE (mk-v0.239.0) — P2P currency swap, backendless.** `#swap`: local "have X, want Y,
   near here" listings, fair mid-market value from `convert()` plus an honest "a booth keeps
   ~3–7%, so this stays between you" range; shared via `shareUrl('in', encodeShare('swap', …))`.
2. **DONE (mk-v0.239.0) — gear/motorbike marketplace, backendless.** `#market`: local listings
   (motorbike / bicycle / camping / SIM) with price + safety copy; same share model. State:
   `social.listings` + `getListings`/`addListing`/`removeListing`; import via `importShareScreen`.
3. **DONE (mk-v0.241.0) — Local Secrets.** Per-place `<details>` drawer (localSecretsCard):
   guide tips + on-device traveller secrets + a "Spotted something new?" contribution box +
   a "suggest a bigger correction" link into the existing feedback flow. New `secret` share
   kind; `placeData[id].secrets`.
4. **DONE (mk-v0.243.0) — onboarding + polish.** A one-tap "Skip setup — just explore" at the
   top of first-run (mk-v0.243.0); scoped visual polish — category-coloured board chips + card
   accents (mk-v0.242.0). The app already boots into content, so no ground-up onboarding
   rebuild was warranted.

Deferred (needs user sign-off / bigger budget):
- A bolder "Kinetic Cinema" visual re-skin — only if the user wants it; the current dark theme
  is intentional and a full re-skin is high-risk on a mature app.

Deferred (needs Workflow-scale budget, currently blocked by the org spend limit):

- Structured opening-hours backfill so "open now" is reliable across all places.
- More photo batches toward ~50 percent coverage; optional central credits page.
- Expand `VEG_SPOTS` to more cities and add a verified Laos vegetarian venue.
- Per-venue diet tags on ordinary eateries (requires per-venue web verification).

## 5. Notes for the next session

- Commit message for `mk-v0.238.0` is staged in the session scratchpad as
  `commitmsg_mk238.txt`.
- Preview: `rsync -a --delete --exclude .git "<repo>/" /tmp/mekong_preview/` then
  `ruby <scratchpad>/serve.rb /tmp/mekong_preview 8746`. Clear the service worker and caches,
  then hard-reload with a `?fresh=N` query — the SW re-registers on load and will otherwise
  serve stale modules.
- Never commit secrets, tokens, or PII. Never push to `main`.
