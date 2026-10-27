# Handoff — 2026-10-26 (F1b: every village in Cambodia)

The previous handoff (F2) is `git show 563c1d5:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F1b**, branch `data/f1b-cambodia-villages`, [PR #137](https://github.com/SamuelLClemens/Mekonging/pull/137), `mk-v0.651.0` (store version unchanged, 17). Waits for the owner's merge; F3 stacks on it.
  - `EVERY_VILLAGE = {'LA', 'KH'}` in `scripts/build-gazetteer.py`. Cambodia goes from 2,192 to 12,128 places (10,596 villages added), 44.5 KB to 212.9 KB gzip (cap 250). Thailand, Vietnam and Laos are byte for byte unchanged. The four lists now total 36,131 places.
  - 660 communes are now dropped, each as the duplicate of a village with the same name within 5 km (all 660 checked with the build's own key, which strips `khum` and `sangkat`). Their label changes from "Commune" to "Village" and their position by up to 5 km. A picked place is stored with its coordinates, so saved data does not depend on the dropped rows.
  - `js/place-search.js`: two cheaper checks in `rankNames` (one joined string for the "contains" test, a bitmask for the first-letter gate), with identical answers: 7,229 queries at two limits each (14,458 comparisons, and the curated-city search for each), 0 differences.
  - Owner rulings of 2026-10-26: decision 27 is closed (keep hand-added stops in the share-journey route); decision 26 starts with a measurement (see Open decisions).

## Verified
- A rebuild with the script unchanged first reproduced all four committed gazetteer files, so the GeoNames snapshot is the one that built them. It is now kept in `~/Library/Caches/mk-geonames/` (the eight zips, 20 MB; pass that folder to `build-gazetteer.py`).
- Keystroke cost, renderer CPU time per call (`Performance.getMetrics` `ThreadTime`) times 6 as the 6x-slowdown estimate, cheapest of 3 batches of 20, 39 queries:

  | | Base data, old matcher | Cambodia added, old matcher | Cambodia added, tuned |
  |---|---|---|---|
  | Worst query | 58.9 ms (battambang) | 93.9 ms (preah) | 80.9 ms (kompong) |
  | Sum of 39 | 1,582 ms | 2,408 ms | 1,813 ms |

  - Wall-clock runs were unusable: the load average was 70 to 124, and the worst median moved from 64 to 132 ms between runs of the same code. The plan's 73 ms came from another query set and method.
  - First-use load of the list (main thread): about 0.36 to 0.42 s unthrottled, 2.1 to 2.5 s at the 6x estimate. The data growth is not separable from noise; the new index fields add about 35 ms.
- Headless Chrome over CDP, fresh profiles on 127.0.0.1, 375 x 812 at DPR 2, `document.hidden` false on every load. Villages absent before: Anlong Chambak (Siem Reap), Phum Prêk Smăch (Kampot), Kŏk Lak Nhai (Ratanakiri).
  - Before: 0 of 15 lookups found one (five pickers by three villages). After: 15 of 15, 0 overflow, 0 picker controls under 44 px.
  - Each picked in the Places sheet: coordinates equal the data's, a 16-day forecast named after the place, the pin inside the map, 0 overflow and 0 errors on `#weather` and `#map`. Two screenshots were looked at.
  - Offline: five list files cached and the service worker in control; with the server stopped (`curl` HTTP 000), the location sheet and the Places sheet both found all three villages, 0 errors.
  - 1 console error in the 15 picker loads: the known `getSource` race from `js/map.js` (Q7).
- All 16 CI guards (including secrets, market-sql and offline-boot), place-fields, port-themes and cache-version against `origin/feat/scaffold-bangkok-slice` (0.650.0 to 0.651.0) pass; `jsc -m scripts/validate-jsc.mjs` exits 0. The manifest moved three hashes.
- Sizes (before to after): `gazetteer.kh.js` 132.0 to 717.0 KB raw, 44.5 to 212.9 KB gzip; `PRECACHE` 221 files, 13,101 to 13,687 KB raw, 3,834 to 4,002 KB gzip; manifest 269 files, 21,594 to 22,179 KB raw, 6,958 to 7,126 KB gzip.
- Not checked: CI on the PR (one check was pending when this was written), and an iPhone.

## Owner checks for M3b (carried; the first two are done)
- [x] Migration 001 run, repaired by 001b; `001_rls.sql` 65 of 65 PASS. Security Advisor after 001: 0 errors.
- [ ] The owner signs in on the iPhone Home Screen app by code. Then their user id goes into `private.admins` and `private.testers`.
- [ ] The owner signs in by link in Safari, then deletes a test account there.
- [ ] From the first real email: whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has.

## Not done / known issues
- Everything open is in `docs/PROGRAM.md` section 4. New in F1b:
  - The list is parsed on the main thread on first use (about 2.1 to 2.5 s at the 6x estimate). Nothing was tuned there. T3 (landmarks) and T13 (Vietnam) would grow the list again; measure the load before them.
  - The `getSource` race was seen once in 15 picker loads (Q7's count is now 1 of 4 (F1), 1 of 3 (Q1), 1 of 15 (F1b)).
  - Anlong Chambak (Siem Reap) was paired with the Pursat anchor when picked. The pairing is by distance, not province, and the distances were not measured; F3's "nearest place" work should look at it.
  - Khmer-script names: 4,296 of 12,128 Cambodian rows carry one (about 3,300 of the added villages); the rest have none in GeoNames.
  - Screenshots and the drivers are not in the repo. They are in `~/Library/Caches/mk-f1b/` (`drive_kh.py` the picker, forecast, pin and offline driver, built on `~/Library/Caches/mk-f1/drive.py`; `measure3.py` the CPU-time keystroke harness; `measure4.py` the load-time harness; `diff.py` the old-against-new matcher comparison, which needs the old `place-search.js` copied to `js/_ps_ref.js` in the served worktree, and removed afterwards; `shots-kh/` the screenshots).
- Carried from F2:
  - the automatic trail names a far-off place for a fix outside the region (Singapore recorded as "Songkhla, th"): `logTrail` accepts an approximate `whereAmI` name; for F3;
  - the offline map outside the region (decision 26);
  - the map credits plate opens expanded and covers part of the journey map (Q7, already in the register).
- Tooling:
  - This session was launched in the parent folder's repository (Nomadic Almanac) and moved to Mekong. The work ran in `Mekong/.claude/worktrees/f1b`, which is spent once PR #137 merges.
  - Machine load: another project's build ran during this session. Time code by CPU time (`Performance.getMetrics` `ThreadTime`), not wall-clock.
  - A headless Chrome run cannot go offline through `Network.emulateNetworkConditions`: the service worker's own requests ignore it. Stop the server, or block the hosts (`--host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"`). The offline driver's "server up" line is the service worker answering its own fetch; use `curl` to show the server is down.
  - A granted emulated position makes the app record an automatic pin on load: grant it after the page has loaded when the test must not have one.

## Open decisions (need the user)
The numbers below keep their old values. Closed on 2026-10-25: 13, 14, 19, 22 and 24. Closed on 2026-10-26: 23 (done in F2) and 27 (keep).
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` §14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred by the owner until Q3 to Q5 are done; ask again after Q5.
25. Remove the spent worktrees and branches listed in `docs/PROGRAM.md` 4.6: 7 worktrees, 15 merged or spent remote branches, 3 orphan screenshot branches, and the stale `mekong*` preview entries in the parent folder's `.claude/launch.json`. The F2 and F1b worktrees (`Mekong/.claude/worktrees/f2` and `f1b`) and their branches join the list once their PRs merge. Recommended: yes (#135 is merged). The removal is one step per message, and each branch is checked against the tip first.
26. A coarse world outline for the journey map offline (`docs/PROGRAM.md` 4.4). **Owner, 2026-10-26: measure first.** Not done. Measure a simplified Natural Earth land outline (size in KB and gzip, at two simplification levels) and bring the number; it would be a new data file. Downloading it needs the owner's yes, with the file name, source and size stated first.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~ (merged, [PR #136](https://github.com/SamuelLClemens/Mekonging/pull/136)), ~~F1b~~ (built, [PR #137](https://github.com/SamuelLClemens/Mekonging/pull/137)), **F3**, **S1** (the style foundation), F4, F5, L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4** (coordinates checks), **R1 to R3** (the style roll-out), Bangkok B1 to B8, city depth C1 onward, then T3 to T15. Each releasing slice stacks on the merged tip of the one before. Q2, S0 (the style gate), Q8 and the decision 26 measurement change no shipped file and can run alongside any of them. The F and L slices are in `docs/PLAN.md`; S, Q, T, G and R are in `docs/PROGRAM.md`.

**Next is F3.** PR #137 must be merged first.

### F3 to F5, then L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <F3 to F5 or L1 to L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code.
> F5, L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> F3 also reports whether `Mekonging Xcode/` declares a location usage description (read only). F4 and L3 draw their charts with S1's `--viz-*` tokens. F5 checks the OCR language files against the service-worker manifest (`docs/PROGRAM.md` 4.4).

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
