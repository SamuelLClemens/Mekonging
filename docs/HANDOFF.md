# Handoff — 2026-10-27 (F3: location known from the first open)

The previous handoff (F1b) is `git show 9bc9166:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F3**, branch `feat/f3-location-first-open`, [PR #138](https://github.com/SamuelLClemens/Mekonging/pull/138), `mk-v0.652.0` (store version unchanged, 17). Waits for the owner's merge; S1 stacks on it.
  - Welcome: the filled "Use my location" is step one's main action; Next is a ghost until location is on, and still works. The browser dialog is raised only by a tap.
  - Home (`js/location-ask.js`, new): one card for a traveller who was never asked, one dismissible banner for one who refused or swiped the dialog away.
  - `js/fix-place.js` (new): a live fix more than 15 km from a curated city is named by the nearest place-list entry (within 25 km). It reaches Home, the right-now card, Weather, Places, Nearby, Emergency (through `whereAmI`'s new `list` source) and the trail. A fix more than 250 km from every curated city no longer names a far city.
  - Both F1b leftovers looked at: Anlong Chambak's pairing is by distance, not a fault (Pursat 56.1 km, Siem Reap 58.5 km); the Singapore trail naming is closed.
  - Details and measurements: `docs/PLAN.md` (the F3 entry) and the PR body.

## Verified
Headless Chrome over CDP, fresh profiles on 127.0.0.1, 375 x 812 at DPR 2, `document.hidden` false, driver `~/Library/Caches/mk-f3/drive.py` (not in the repo): 25 of 25 checks.
- Before the change, at `acbc7a3`: the welcome step made 0 calls and Skip set `geoAsked` true; Home offered no location control to an earlier traveller; a denied profile showed no banner; Koh Chang already read "Koh Chang" (it is an anchor, so the criterion passed before any change); Koh Mak read "Trat", Anlong Chambak "Pursat", and Singapore "Songkhla" (751 km), filed in the trail as `th`.
- After: first open 0 calls on load and exactly 1 `getCurrentPosition` after the tap; the card and banner show once and stay dismissed after a reload; a denied profile makes 0 calls on load and on reload; Anlong Chambak (56.1 km from its anchor) and Don Không, Laos (16.9 km) read their own names on Home and Weather, with their own forecast; Singapore's trail pin is `{city: '', cc: ''}`. 0 overflow and 0 controls under 44 px on the welcome step, the card and the banner. Four screenshots were looked at.
- Cost, renderer CPU time (`Performance.getMetrics` `ThreadTime`): 21 to 24 ms per resolution with the lists in memory, 84 ms cold (about 130 to 145 ms and 500 ms at 6x). A first version cost 65 to 75 ms.
- All 16 CI guards, place-fields, port-themes, cache-version (against `origin/feat/scaffold-bangkok-slice`) and `jsc -m scripts/validate-jsc.mjs` pass; `jsc -m` parses every edited file. The preload block was regenerated for the two new eager modules; the manifest has 271 files.
- Not verified: an iPhone; offline (the place is read from the store and the lists are precached, but it was not run with the server stopped); CI on the PR (one check was pending when this was written).

## Owner checks
- [ ] **Xcode (read only, F3 edited nothing).** The live Xcode project is not in the repo: `project.pbxproj` was removed from git in `4f06543` (2026-07-17), and no `Info.plist`, entitlements or `.xcconfig` is tracked, so the current tree declares no location usage description. The last committed project file declared `INFOPLIST_KEY_NSLocationWhenInUseUsageDescription` ("Mekonging uses your location to show places near you and to stamp journal entries."). Confirm your local project still has it; without it the iOS wrapper never shows the dialog.
- [ ] **iPhone, Safari and the Home Screen app, fresh install:** the welcome step's button raises the dialog once; allow, and Home names the place with no tap; on a second install refuse, and the banner shows once with no dialog on reload.
- Carried from M3b: [ ] sign in on the iPhone Home Screen app by code, then the user id goes into `private.admins` and `private.testers`; [ ] sign in by link in Safari, then delete a test account; [ ] from the first real email, whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has.

## Not done / known issues
- Everything open is in `docs/PROGRAM.md` section 4. New in F3 (4.4):
  - **Safety, decision 28:** an outside-region fix still reaches Emergency as a region country. `countryOfFix` (`js/main.js:6320`) falls back to the nearest anchor's country, so Singapore would show Thailand's numbers ("Showing Thailand ... from your location"). Read from the code, not rendered. F3 guarded only `focusSpot`, `contextNow`, `refreshLocation`, the watch and Nearby; the other direct `nearestSpotGlobal` callers are `js/main.js` 2817, 3709, 6320 and 6880, `country-info.js:280`, `journal.js:349` and `places.js:999`.
  - A second mislocated anchor: Ba Ria-Vung Tau is at 8.69, 106.61, which is Côn Sơn island (the city is near 10.35, 107.08), like Trat on Ko Mak. A fix on either island reads the anchor, so F3's list place never takes over there. G1 (Trat) and G3.
  - `prefs.geoAsked` is now read by nothing (Skip and every Home button set it); `geoPrompted` is the working flag.
  - The first-launch stall: in 1 of 8 fresh-profile runs the four list imports sat unrequested for 9 s. `js/fix-place.js` now times out and retries; the stall itself was not seen again, so the retry is shown to recover from a failed load, not from the original stall.
  - Penang (165 km) and Yangon (238 km) still read their nearest anchor: the cap is a distance, not a border.
  - Today, Transport and Explore's "Places in X" still read the anchor (by design); the new strings are English only until L2.
- Carried (see `docs/PROGRAM.md` 4.4): the offline map outside the region (decision 26); the map credits plate opens expanded and covers part of the journey map (Q7); the `getSource` race (not seen in the F3 position runs, which collected console errors); the list is parsed on the main thread on first use (T3 and T13 would grow it).
- Tooling:
  - `preview_start` reads the PARENT folder's `.claude/launch.json`, not the worktree's. F3 added `mekong-f3` (port 8963) there, uncommitted like the others. `CLAUDE.md` now says so.
  - A local branch `f3-base` appeared at `acbc7a3` beside the worktree; tooling created it. It is spent with the worktree.
  - The F3 driver and screenshots are in `~/Library/Caches/mk-f3/` (`drive.py before|after`, `cdp.py`, `shots-before/`, `shots-after/`); the probes were in the session scratchpad and are gone. The driver warms the service worker's cache before a place-list test; do that in any fresh profile.
  - Machine load swung between 13 and 210 during this session (another project's Python and the window server). Time code by CPU time, not wall-clock, and give every wait a generous bound.

## Open decisions (need the user)
The numbers below keep their old values. Closed on 2026-10-26: 23, 27.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` §14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. Remove the spent worktrees and branches in `docs/PROGRAM.md` 4.6: now also f1b and f2 (merged), `f3` and `f3-base` once PR #138 merges. Recommended: yes. One step per message, each branch checked against the tip first.
26. A coarse world outline for the journey map offline. Owner, 2026-10-26: measure first. Not done.
28. **New.** What should Emergency show for a fix outside the four countries? Recommended: say "outside these four countries", show the browsed country's numbers labelled as such, and never "from your location". It needs a ruling before a slice.
29. **New.** Should a place picked by hand hold over a live fix for a while? Today the fix always wins. Recommended: no change.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~ ([PR #138](https://github.com/SamuelLClemens/Mekonging/pull/138), built), **S1** (the style foundation), F4, F5, L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15. Each releasing slice stacks on the merged tip of the one before. Q2, S0, Q8 and the decision 26 measurement change no shipped file and can run alongside any of them.

**Next is S1.** PR #138 must be merged first.

### F4 and F5, then L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <F4, F5, L1 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> F5, L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> F4 and L3 draw their charts with S1's `--viz-*` tokens. F5 checks the OCR language files against the service-worker manifest (`docs/PROGRAM.md` 4.4). Machine-fill strings added by F1 and F3 in L2.

### S1: the style foundation (after F3, before F4)
> Read CLAUDE.md, docs/HANDOFF.md, DESIGN_SYSTEM.md and section 5 of docs/PROGRAM.md (with S0's answers, if S0 has run). Run /slice for slice S1: tokens and machinery.
> **Scope.** Section 5.3, items 1 to 10, as tokens and components, plus the guards: `check-contrast` reads the `--viz-*` tokens, and a ratchet holds the literal font-size count. Load the `dataviz` skill before the palette.
> **Done when.** A computed-style digest shows that nothing outside the new components moved, on 8 screens and 3 themes at 375 px; every guard passes; the register is updated; the PR is open. Then run /handoff.
> **Out of scope.** Applying the tokens to existing screens (R1 to R3); the tap-target and contrast fixes (Q3 to Q7).

### Q3 to Q7, then T1 and T2 (after L4)
> Read CLAUDE.md, docs/HANDOFF.md, docs/AUDIT_375.md ("Proposed fix slices") and docs/PROGRAM.md (sections 4.4, 5.4 and 6). Run /slice for the next of Q3, Q4, Q5, Q6, Q7, T1 or T2, in that order. Re-measure with Q2's driver first. Decision 10 (topbar spacing) is asked after Q5.

### M4b-2: the marketplace redesign, post side
> Read CLAUDE.md, docs/HANDOFF.md, DESIGN_SYSTEM.md, and docs/EXCHANGE.md §3, §8, §9, §16 and §17 (M4, M4b-1 built, and M4b-2). Run /slice for slice M4b-2: the marketplace screens, post side.
> **Start.** `git fetch`; `gh pr list --state all`. T2 must be merged (owner, 2026-10-25: the traveller fixes, the language work, S1, Q3 to Q7, T1 and T2 come first), and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice` on `feat/m4b2-market-post`.
> **Where M4b-1 left the hooks.** The Post button (`.mxh-post` in `js/screens/market-home.js`) opens `postSoonSheet` from `js/screens/market-parts.js`: replace it with the forms. Reuse `listingCard` and `artNode` (`js/market-art.js`) for the live preview, `signInSheet('post', hash)` for a signed-out poster (it returns after sign-in), and `KIND_META`, `CATEGORY_LABEL`, `citySelect` and `CURRENCY_FOR` from `market-parts.js`. Styles go in `css/market.css`. The listing page's ⋯ menu says "My listings, coming in the next update" on the traveller's own listing: link it.
> **Scope.**
> 1. Post forms (`#market-new-<kind>`), reached from the home's Post button:
>    - a short stepper per kind (item, meetup, room, ride), with a live card preview built from M4b-1's card and artwork;
>    - client checks that mirror the server's: the kind and intent pairs, the window caps, prices, seats, cities, and the contact-detail rule. Server errors map through `listingErrorText`;
>    - the posting contract: `postListing` picks the id, inserts with `return=minimal` and reads the row back.
> 2. My listings (`#market-mine`): status chips (open, closed, "under review" for hidden, ended), and close and delete through `confirmAction`.
> 3. The live check needs the carried M3b owner checks first, walked through one small step per message:
>    - the owner signs in on the iPhone Home Screen app;
>    - their user id goes into `private.admins` and `private.testers`;
>    - a second tester is available (EXCHANGE §16, from M4).
> **Pitfalls.** Headless Chrome needs `--no-sandbox` and a profile outside `/private/tmp` (CLAUDE.md). M4b-1's driver, `~/Library/Caches/mk-m4b1/drive.py` with `cdp.py` beside it (not in the repo), measures every state at 375 and 1280 px on three themes; copy its pattern. The router renders twice at start-up: after every await, check `isConnected`.
> **Done when:**
> - The post form for each kind, and My listings, render at 375 px and at 1280 px, in light and dark, on the default skin and one dark skin.
>   - Each has 0 overflow, 0 console errors, 0 CSP violations and 0 body controls under 44 px.
> - A fixture post of each kind round-trips into search and into My listings.
> - On production, the owner and a tester each post one listing and see each other's.
> - Every guard and the validator pass, and the PR is open. Then run /handoff.
> **Out of scope:** photos (M4c), messages and block (M5), matching (M6).

### M4c: listing photos
> Read CLAUDE.md, docs/HANDOFF.md, and docs/EXCHANGE.md §2 (photos), §10, §13, §14 (item 8) and §17 (M4c). Run /slice for slice M4c: listing photos.
> **Start.** `git fetch`; `gh pr list --state all`. M4b-2 must be merged. Install `pglast` first (decision 19, owner 2026-10-25) and add a parse step to `scripts/check-market-sql.py`, in CI too. Read the current Supabase Free limits for Storage size and egress from supabase.com/pricing, and cap photos per account to fit them. Worktree on `feat/m4c-photos`.
> **Scope.**
> 1. Migration 003 (renumber the later slices' migrations in §17):
>    - a private bucket;
>    - `storage.objects` rules: upload only under `<uid>/<listing id>/` by the listing's owner while it is open; read by anyone who can see the listing, visitors included (owner ruling 2026-10-19); delete by the owner;
>    - at most 3 photos per listing, purged with the listing;
>    - a reported listing's photos hidden with it.
> 2. Client:
>    - pick from the camera or the library;
>    - resize on a canvas to at most 1280 px on the long side and re-encode at about 300 KB, which drops the metadata, GPS included;
>    - upload progress, and required alt text;
>    - show photos by an authenticated fetch into a `blob:` URL (`img-src` already allows `blob:`), held in memory only, never stored (§2);
>    - the first photo replaces the artwork on the card, and the listing page shows a gallery.
> 3. A test in the 001 pattern for the storage rules.
> **Pitfalls.**
> - There is no automated image scanning on the Free tier. Say so in the PR, and keep the report path one tap away.
> - Before the market opens to everyone, §14 item 8 must be answered (M9).
> **Done when:**
> - The SQL test shows a stranger cannot upload into another person's folder or read the photos of a hidden or ended listing.
> - A test JPEG carrying GPS metadata arrives on the server with none (read the stored bytes back).
> - The gallery renders at 375 px in light and dark, with 0 overflow and 0 errors.
> - The owner uploads from the iPhone, and a tester sees the photo.
> - Every guard passes, and the PR is open. Then run /handoff.

### M5: messages, block and live alerts (right after M4c)
> Read CLAUDE.md, docs/HANDOFF.md, and docs/EXCHANGE.md §2 (Realtime), §3 (threads, messages, blocks, notifications), §4, §8 (messages), §9, §13 and §17 (M5). Run /slice for slice M5.
> **Start.** `git fetch`; `gh pr list --state all`. M4c must be merged. Worktree on `feat/m5-messages`.
> **Scope.**
> - The next migration: `threads`, `messages`, `blocks` and `notifications` (added to the `supabase_realtime` publication), `market_start_thread`, `market_block_owner`, and the message triggers. Messages reject URLs and allow phone numbers, with the safety line.
> - `js/market-realtime.js`: a small Phoenix WebSocket client with a polling fallback. Add `wss://xnruspjauhmcrqxmjmxg.supabase.co` to `connect-src`, which M3b deliberately left out.
> - The inbox, conversation and blocked-people screens in M4b's design language, "Message" switched on in the listing page, and the tab badge (§11).
> **Pitfalls.** The same as M4a (draft PR until the owner's SQL passes; no local Postgres; the escape quirk), and the double render at start-up for live screens.
> **Done when:**
> - The RLS tests show a non-participant reads nothing and a blocked pair cannot message.
> - A tester's message reaches the owner's open app in under 5 seconds without a reload, with the tab badge showing 1 at 375 px.
> - After a block, neither side can send, and the conversation shows as closed.
> - Every guard passes, and the PR is ready. Then run /handoff.

### D5 tidy (after L5)
> Read CLAUDE.md, docs/HANDOFF.md and the Release order and D5 sections of docs/PLAN.md. Run /slice for slice D5 tidy.
> - Relabel the 50 entries in 6 data files that cite tourismcambodia.com or tourismcambodia.org as "Ministry of Tourism" to "Tourism Cambodia". Change no URL; treat tourism.gov.kh as the ministry.
> - Relabel the 45 "Lao National Tourism Administration" entries and the 4 "Ministry of Information, Culture and Tourism" entries on tourismlaos.org to "Tourism Laos" (decision 13, yes on 2026-10-25; counts re-measured that day).
> - Also: the 2 Thai records whose source has no URL, and `hours` for `la-ext-rental-vang-vieng` (`docs/PROGRAM.md` 4.4 and 4.5).
> - Compare the coordinates of Long Beach (Sok San) and Long Set Beach (4K Beach) with Wikivoyage's Koh Rong section and the island's map. If they are one beach, merge them with a `js/data/place-merges.js` line in the same commit, and give the merged card a citation.
> - Done when: no "Ministry of Tourism" label remains on either Cambodian host; the beach decision is recorded with its evidence; the affected cards show correctly at 375 px in headless Chrome; all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> - Out of scope: other citations, photos, Bangkok.

### G1 to G4: coordinates checks (after D5 tidy), then R1 to R3: the style roll-out
> Read CLAUDE.md, docs/HANDOFF.md and docs/PROGRAM.md (4.5 and section 5). Run /slice for the next of G1 (Laos's remote sites and the Trat anchor, decision 22), G2 Cambodia, G3 Vietnam, G4 Thailand, then R1, R2, R3.
> - G: flag every record more than 2 km from its OSM object (Nominatim by name works here; Overpass does not). Fix only with a second source, and record each decision with its evidence. A moved anchor changes "Nearby": check the records filed under its city first.
> - R: apply S1's tokens, icons, card anatomy, artwork and photo treatment to one screen group per slice (5.4), proven by a computed-style digest.

### Bangkok B1, Old City and Rattanakosin (then B2 to B8 in the same shape; after R3)
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" section of docs/PLAN.md. Run /slice for slice B1: Old City and Rattanakosin.
> - Count Bangkok's records by category first (40 of 293 Thai places). Run `check-place-dupes.py` before adding: a name collision silently deletes travellers' saved data.
> - Add the district's records in a new file, `js/data/places.th.bkk.rattanakosin.js`, with one loader line in `js/data/regions.js` next to `PLACES_TH` and `PLACES_TH_EXT`. Ids are `th-bkk-<slug>`.
> - Cover every category in the plan that fits the district, the practical ones included (health, errands, daily shopping, visa and living).
> - Each record ships complete: a Thai-script `localName`, page-level `sources` (the venue's own page or its Wikipedia article first), `hours`, a price tier, `coords` and `tips`. A photo comes only from the place's own Wikipedia article. Hold dispensaries out.
> - Done when: Bangkok records for the district are counted by category before and after; every new record passes `check-place-fields.py --assert`; 10 sample cards show correctly at 375 px in headless Chrome over CDP; all guards and `jsc -m scripts/validate-jsc.mjs` pass; the pack size is reported before and after if photos were added; the PR is open into `feat/scaffold-bangkok-slice`.
> - Out of scope: the other districts, dispensaries, D6 fields beyond the `afterDark` contract.
>
> For B2 to B8, swap the district, the file name (`places.th.bkk.<district>.js`) and the slice number. The district order is in docs/PLAN.md: B2 Chinatown and Yaowarat, B3 Siam, Pratunam and Ratchathewi, B4 Sukhumvit, B5 Silom, Sathorn and Bang Rak, B6 Riverside and Thonburi, B7 north and the outskirts, B8 a gap sweep and the 300 reassessment. B2 onward adds only a file and a loader line.

### City depth C1, Chiang Mai (then C2 onward in the same shape)
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" and "City depth" sections of docs/PLAN.md. Run /slice for slice C1: Chiang Mai.
> - Count Chiang Mai's 33 records by category, and run `check-place-dupes.py` first.
> - Add new records in `js/data/places.th.chiangmai.js`, with one loader line in `js/data/regions.js`, and ids `th-chiangmai-<slug>`. Existing records stay where they are.
> - Apply the Bangkok rules: every category, complete at creation, page-level sources, photos only from the place's own Wikipedia article, no dispensaries, and adult nightlife as factual area entries only.
> - Target: double the city's records in the first pass, and record what is still missing.
> - Done when: the same done-when as a B slice, for Chiang Mai.

### Q2: commit the audit driver (tools only, no version bump, can run alongside any slice)
> Read CLAUDE.md, docs/HANDOFF.md and docs/AUDIT_375.md (Method and limits; Proposed fix slices). Run /slice for slice Q2: add the driver under `tools/audit-375/`.
> - The files are in `/Users/zim/Library/Application Support/Claude/side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/q1-audit-driver/`. The M3b CDP client (`m3b-cdp/cdp.py`, stdlib only) is in the same folder and may replace the driver's own client.
> - Make one command print the headline table and the per-route tables for both themes. It must refuse a load where `document.hidden` is true, and it must keep the display awake (`caffeinate -d`).
> - Commit one shared stdlib CDP client under `tools/cdp/` for later drivers. Also fix two tooling defects: `fetch-place-photos.py` exits 0 when lookups fail, and `scripts/route-sweep.js` has no `#market` in `EXTRA` (`docs/PROGRAM.md` 4.4).
> - Done when: a clean worktree reproduces the headline numbers in `docs/AUDIT_375.md` and the script is documented.
> - Out of scope: fixing what the audit finds.

### S0: the style gate (documents and tools only, alongside)
> Read CLAUDE.md, docs/HANDOFF.md, DESIGN_SYSTEM.md and section 5 of docs/PROGRAM.md. Load the artifact-design skill.
> - Build a private gallery artifact. It covers Home, Places, a place card without a photo, Explore, Talk, Weather, the journey map and the Market home at 375 px. Show the current and proposed versions in Mekong Retro light, Mekong Retro dark and Night Market (48 captures in headless Chrome over CDP, with `document.hidden` false). Draw the proposed versions from section 5.3 without changing shipped files.
> - Ask the owner one `AskUserQuestion` form and record the answers in `DESIGN_SYSTEM.md` and `docs/PROGRAM.md`.
> - Out of scope: any shipped file (S1 builds the tokens).

### Decision 26: measure a coarse world outline for the offline journey map (documents only, alongside)
> Read CLAUDE.md, docs/HANDOFF.md and `docs/PROGRAM.md` 4.4 (the offline journey map). This slice changes no shipped file.
> - Ask the owner before downloading anything: state the file name, source and size. Natural Earth's land polygons (public domain, naturalearthdata.com) at 1:110m and 1:50m are the candidates.
> - Simplify each to a coarse outline and report its size in KB raw and gzip, and what it draws at zoom 1 to 4 on the journey map at 375 px (headless Chrome over CDP, `document.hidden` false).
> - Done when: the two numbers and one screenshot per level are in `docs/PROGRAM.md` 4.4, with a recommendation. Out of scope: shipping the file (it would be a new data file and a version bump, a slice of its own after the owner rules).
