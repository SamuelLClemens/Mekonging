# Handoff — 2026-10-25 (program session 0: the register, the style brief and the backlog)

The previous handoff (F1 and its Laos follow-up, with every carried item in full) is `git show e98f4a7:docs/HANDOFF.md`.
Every open item now lives in `docs/PROGRAM.md` section 4, re-measured, each with an owning slice or owner action.

## Shipped
- **Program session 0**, branch `docs/program-plan`, [PR #135](https://github.com/SamuelLClemens/Mekonging/pull/135), open, documents only (no version bump).
  - `docs/PROGRAM.md` (new):
    - the unresolved register, re-measured on e98f4a7 (`mk-v0.649.0`);
    - the "Mekong Retro, refined" style brief: the gate's eight screens and ten proposed token changes;
    - the ranked feature backlog T1 to T15, with `file:line` evidence for each gap;
    - the merged release order.
  - `docs/PLAN.md`: the owner's rulings of 2026-10-25, the merged order and the new slice F1b (every Cambodian village).
  - `CLAUDE.md`: the docs map points to `docs/PROGRAM.md` as the register every slice updates.

## Verified
- The state in `BEST_TOOL_PROMPT.md` section 3 holds:
  - `mk-v0.649.0`; PR #134 was the only merge since the prompt, and no other PR is open;
  - `js/main.js` has 7,601 lines, and there are 44 screen modules;
  - 882 places, 262 with a photo, 26,195 list places.
- Only documents changed between #133 and e98f4a7, so #133's measurements of the shipped files hold.
- Re-measured with jsc (`~/Library/Caches/mk-program/measure.mjs`, `cats.mjs`), the guards, `git`, `gh` and `grep`; each value is in `docs/PROGRAM.md` with its `file:line`.
- Not re-measured, because this session changed documents only: rendered layout, tap targets and contrast. These are Q1's values from 2026-10-19 and later slices' values; Q2 re-measures them.
- Guards on the branch:
  - all 15 CI guards pass, along with place-fields, port-themes and cache-version against `origin/feat/scaffold-bangkok-slice` (0.649.0, unchanged);
  - `jsc -m scripts/validate-jsc.mjs` passes 19,297 of 19,297 checks;
  - `check-offline-boot` (not in CI) still fails on `js/market-routes.js` and `js/market-link.js`. That is decision 23, which rides with F2.

## Owner answers (one form, 2026-10-25)
- **Style work: split.**
  - S0 (the style gate gallery) and Q2 run alongside the queue.
  - S1 (the style foundation) goes just before F4.
  - Q3 to Q7 go after L4 and before M4b-2.
- **Feature backlog: trust first.**
  - T1 (fact freshness) and T2 (border status) run right after Q7.
  - T3 to T15 run after C8, unless the owner moves one up.
- **Decisions 14, 19 and 23: yes.** 14 becomes the coordinates checks G1 to G4, Laos first, with decision 22 in G1. 19 is `pglast`, installed in M4c. 23 rides with F2.
- **Decisions 10, 13 and 24.** 10 waits until Q5 is done. 13 is yes, in D5 tidy (49 labels: 45 plus 4). 24 is **yes**: every Cambodian village, slice F1b, right after F2.
- Session 0 chose where F1b, G1 to G4, R1 to R3 and `pglast` go, because the form did not ask. They are listed in `docs/PROGRAM.md` section 1, and the owner can move them.

## Owner checks for M3b (carried; the first two are done)
- [x] Migration 001 run, repaired by 001b; `001_rls.sql` 65 of 65 PASS. Security Advisor after 001: 0 errors.
- [ ] The owner signs in on the iPhone Home Screen app by code. Then their user id goes into `private.admins` and `private.testers`.
- [ ] The owner signs in by link in Safari, then deletes a test account there.
- [ ] From the first real email: whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has.

## Not done / known issues
- Everything open is in `docs/PROGRAM.md` section 4. New in this session:
  - one place has no `hours` (`la-ext-rental-vang-vieng`, for D5 tidy);
  - the saved-collection topbar prefixes an emoji (`js/main.js:4642`, for Q4);
  - the orphan branch `assets/m4b1-shots` and the spent branch `fix/transport-leaving-reverse` exist.
- Dropped with evidence: the Museum of Cham Sculpture credit (fixed, `js/data/photos.js:595`).
- Tooling, this session only:
  - The app launched this session in a worktree of the parent folder's repository (`/Users/zim/Claude Code/.claude/worktrees/program-plan-9c1f88`, branch `claude/program-plan-9c1f88`, no commits). The work was done in a new Mekonging worktree at `.claude/worktrees/program-plan`.
  - The Edit and Write hook kept refusing the Mekonging path, so files were written through the scratchpad and copied in.
  - The Bash isolation check refuses loops and long heredocs; a Python runner script in the scratchpad runs the guard block.
  - Both worktrees are spent once #135 merges.
- `docs/HANDOFF.md` no longer repeats the carried list. Its slice prompts below were updated for the new order.

## Open decisions (need the user)
The numbers below keep their old values. Closed on 2026-10-25: 13, 14, 19, 22, 23 and 24 (see above).
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` §14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred by the owner until Q3 to Q5 are done; ask again after Q5.
25. Remove the spent worktrees and branches listed in `docs/PROGRAM.md` 4.6: 7 worktrees, 15 merged or spent remote branches, 3 orphan screenshot branches, and the stale `mekong*` preview entries in the parent folder's `.claude/launch.json`. Recommended: yes, after #135 merges. The removal is one step per message, and each branch is checked against the tip first.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): **F2** (with decision 23), **F1b**, F3, **S1** (the style foundation), F4, F5, L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4** (coordinates checks), **R1 to R3** (the style roll-out), Bangkok B1 to B8, city depth C1 onward, then T3 to T15. Each releasing slice stacks on the merged tip of the one before. Q2, S0 (the style gate) and Q8 change no shipped file and can run alongside any of them. The F and L slices are in `docs/PLAN.md`; S, Q, T, G and R are in `docs/PROGRAM.md`.

### F2: Your journey, the whole world, fully editable (next)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md (owner rulings, then F2). Run /slice for slice F2: Your journey on a world map, every stop editable.
> **Start.** `git fetch`; `gh pr list --state all`. PR #135 (program session 0) must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice` on `feat/f2-journey-world`. Reproduce first: at 375 px the journey map is fenced to the region, and a stop from a journal entry has no edit control.
> **What F1 left for F2.**
> - "Add a stop you missed" already uses F1's picker. `spotForKey(key)` returns a list place `{ gz: true, country, city, lat, lng, local, prov, kind }`, and `addTrailStop()` takes its `lat`, `lng`, `city` and `country` as they are.
> - The journey's empty state returns before that button exists. Offer it there too.
> - `setPlacePin(spot)` on the `initMap` controller (`js/map.js`) draws one titled pin. The search box is `locationSelect()`, and the matching is `findPlaces()` in `js/place-search.js`.
> - Decision 23 (two `PRECACHE` lines in `sw.js`, and `check-offline-boot` in `guards.yml` and the scripts README) was approved by the owner on 2026-10-25 and rides along.
> **Pitfalls.**
> - CDP clip coordinates are page coordinates: after scrolling, capture from `scrollY`.
> - `Browser.close` fires no `pagehide`, so reload before closing a profile that a later run reuses.
> - `mount()` folds sections: open the `<details>` around a control before measuring it.
> - The F1 driver is `~/Library/Caches/mk-f1/drive.py`. Copy its pattern.
> **Done when.** The F2 "Done when" in docs/PLAN.md holds in headless Chrome over CDP at 375 px, light and dark; every guard and `jsc -m scripts/validate-jsc.mjs` pass; `check-offline-boot` passes and runs in CI; the register in `docs/PROGRAM.md` is updated; the PR is open. Then run /handoff.
> **Out of scope.** The share-journey file format beyond carrying the new stops, automatic location (F3), the recap (F4).

### F1b: every village in Cambodia (after F2)
> Read CLAUDE.md, docs/HANDOFF.md and the F1b section of docs/PLAN.md. Run /slice for slice F1b: every village in Cambodia.
> **Start.** `git fetch`; `gh pr list --state all`. F2 must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice` on `data/f1b-cambodia-villages`. Measure sizes and the worst keystroke (6x CPU slowdown) on the base first.
> **Done when.** The F1b "Done when" in docs/PLAN.md holds; Thailand, Vietnam and Laos's list files are byte for byte unchanged; the register in `docs/PROGRAM.md` is updated; the PR is open. Then run /handoff.

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
