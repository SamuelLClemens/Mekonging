# Handoff, 2026-10-27 (S1: the style foundation, tokens and machinery)

The previous handoff (F3) is `git show b7dd04a:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4; what S1 built, with its measurements, is 5.5.

## Shipped
- **S1**, branch `feat/s1-tokens-machinery`, [PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139), `mk-v0.653.0` (store version unchanged, 17). Waits for the owner's merge; F4 stacks on it. Items 1 to 10 of `docs/PROGRAM.md` 5.3 as tokens and components. **No existing screen uses any of it.**
  - **The opt-in mechanism.** The refined `--fs-*` scale, the line heights and the reduced-motion rule are declared on `[data-refined]`, not at `:root`, because 241 places read the `--fs-*` tokens and the done criterion forbids moving them. R1 to R3 add `data-refined` to a screen group's root. The new place card carries it itself.
  - `css/refined.css` (new, linked after `style.css`, precached): tokens (`--lh-*`, `--icon-*`, `--card-media-*`, `--dur-1/2`, `--hit`, `--viz-*`, `--skel-*`), `.num`, `.icon`, the place card (`.rf-*`), the artwork classes (`.pla-*`), `.rf-empty`, `[data-refined] .skeleton`. The `--viz-*` block at its end is generated.
  - **Chart colours.** `--viz-1` to `--viz-8` for 16 surfaces. `tools/style-tiles/derive-viz.py` derives them into `round2.json`; `port-themes.py` writes them; `check-contrast.py` holds 3:1; `derive-viz.py --check` holds the dataviz checks. Fixed order: brick, plum, gold, teal, blue, green, violet, rose.
  - **Icons.** `icons/ui.svg` (51 Lucide glyphs; ISC and MIT texts in `icons/LICENSE-lucide.txt`), `js/icons.js` (`iconNode(id)`, `iconSVG(id)`), an `icon:` id beside every `ic:` in `js/nav-groups.js`, `scripts/build-icon-sprite.py` (needs an unpacked `lucide-static` package), `scripts/check-icons.py`.
  - **Place card and artwork** (lazy, not yet imported by any screen): `js/place-card.js` `placeCardRF(place, options)` and `js/place-art.js` (11 motifs, `placeArtKey(place)`).
  - **Guards (3 new).** `check-font-sizes` (a ratchet, baseline `scripts/font-size-baseline.json`: 138 CSS declarations, 74 in JS strings), `check-icons`, `derive-viz.py --check`. All in `scripts/README.md`, `.github/workflows/guards.yml` and `CLAUDE.md`.
  - **Proof tools** (committed, `tools/style-digest/`): `digest.py <before-url> <after-url>` (a computed-style digest of two running copies, per screen and theme, with `--allow` for R slices) and `components.py <url>` (mounts and measures the new components). Both need headless Chrome and a display kept awake.
- **Housekeeping, recorded in `docs/PROGRAM.md` 4.2, 4.3 and 4.6.** Decision 25: the f1b, f2 and f3 worktrees and the `f3-base` branch are removed (2026-10-27). Decisions 28 and 29 are ruled (below), which adds slices F6 and F7 to 4.1.

## Verified
Headless Chrome over CDP, fresh profiles on 127.0.0.1, 375 x 812 at DPR 2, `document.hidden` false for every page, every host except 127.0.0.1 unresolvable.
- **Nothing outside the new components moved.** `tools/style-digest/digest.py` against `origin/feat/scaffold-bangkok-slice` at `b7dd04a`: 8 screens (Home, Places, a place card without a photo, Explore, Talk, Weather, the journey map, the Market home) by 3 themes (Mekong Retro light and dark, Night Market) = 24 pairs, 10,923 elements, each hashed over every computed property and its box (and `::before`, `::after`). 0 added, 0 removed, 0 changed; 0 existing custom properties changed value, 26 new ones appeared. A second load of the baseline flags 18 noisy elements (the Weather map's city chips); with them counted, three repeats showed 0 differences. One error kind on both sides (`Failed to fetch`, offline map tiles).
- **The components work.** `components.py`: 24 checks per theme, 72 of 72 pass: 14 cards with 0 overflow, media 232.7 px at most (a 506 x 900 portrait is capped), name link 44 px, 11 motifs named "Artwork: ...", 51 icons drawn and every `<use>` resolved under the CSP, type scale and line heights as designed (the longest th, lo, km and vi strings clear their ink at 27.2 and 25.6 px; `line-height: 1` gives 16 px). Screenshots were looked at (photo card, tall portrait, archival label, artwork, icon grid, empty state, swatches); they are not committed, `components.py --out <dir>` makes them.
- **Palette.** 160 chart colours at 3:1 or better on their card across 16 surfaces; worst neighbouring pair under colour-vision deficiency 16.4 (target 8); the `dataviz` skill's own `validate_palette.py` passes retro light and dark, Night Market and Flags.
- **Guards fail when they should.** A planted literal font size, a misspelt icon id and a pale chart colour each failed their guard; files restored by hash.
- All CI guards, place-fields, port-themes, derive-viz, cache-version (against `origin/feat/scaffold-bangkok-slice`; 8 code files changed, `mk-v0.652.0` to `mk-v0.653.0`) and `jsc -m scripts/validate-jsc.mjs` (19,297 of 19,297) pass. `jsc -m` parses every edited file. The manifest has 276 files.
- Not verified: an iPhone; CI on the PR (pending when this was written); the card and artwork on a real screen of the app (nothing uses them yet).

## Owner checks
- [ ] **Xcode (read only).** The live Xcode project is not in the repo (`project.pbxproj` was removed in `4f06543`), so the tree declares no location usage description. Confirm your local project still has `INFOPLIST_KEY_NSLocationWhenInUseUsageDescription`; without it the iOS wrapper never shows the dialog. Carried from F3.
- [ ] **iPhone, Safari and the Home Screen app, fresh install:** the welcome step's button raises the dialog once; allow, and Home names the place with no tap; on a second install refuse, and the banner shows once with no dialog on reload. Carried from F3.
- Carried from M3b: [ ] sign in on the iPhone Home Screen app by code, then the user id goes into `private.admins` and `private.testers`; [ ] sign in by link in Safari, then delete a test account; [ ] from the first real email, whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has.
- S1 changed nothing a traveller can see, so it has no owner check of its own.

## Not done / known issues
- Everything open is in `docs/PROGRAM.md` section 4. New in S1:
  - **Deviations from 5.3, each on the record in `DESIGN_SYSTEM.md`.** The type scale, line heights and reduced-motion rule are scoped to `[data-refined]` (not global); the one easing token is the existing `--ease`, not a new one; the sprite has 51 glyphs (about 40 was the estimate); the literal font-size counts are 138 CSS declarations (50 distinct) against the register's "49 distinct".
  - Which two Vietnamese photos are archival is not in the data; the label exists (`photo.archival`), R1 marks them. The five tab icons and chrome glyphs are in the sprite and not wired (R2, R3).
  - The strings S1 added are English only (L2).
  - Offline, the maps log `Failed to fetch` for every tile request (42 to 102 errors a load on Places and the journey map): 4.4, Map.
  - `css/refined.css` is eager: about 8 KB gzip more on the first visit with the sprite; it is there so R1 does not flash unstyled.
- Carried (see `docs/PROGRAM.md` 4.4): decision 28's code (`countryOfFix` and the other `nearestSpotGlobal` callers), the offline map outside the region (decision 26), the map credits plate (Q7), the `getSource` race, the list parsed on the main thread on first use, a second mislocated anchor (Ba Ria-Vung Tau).
- Tooling:
  - `preview_start` reads the PARENT folder's `.claude/launch.json`. S1 added no entry there: it served both trees with `python3 scripts/serve.py <port>` from Bash (8964 for `s1-before`, 8965 for the branch) and drove Chrome directly.
  - The digest stalled once in 25 loads on Places (a navigation timeout); `digest.py` restarts Chrome and retries. Do not run another Chrome at the same time as a digest. Load both trees together and capture at the same age: a first version that captured one side later read a time-dependent status card as a change.
  - `main` here is `feat/scaffold-bangkok-slice`; the main checkout `Mekong/` is at `ddf57b9` and stale. Read `CLAUDE.md` and the docs from a worktree, not from it.
  - Worktrees `s1-tokens` and `s1-before` (detached at `b7dd04a`) are spent when the PR merges; the two servers on 8964 and 8965 can be stopped.

## Open decisions (need the user)
Closed on 2026-10-27: 25 (worktrees), 28, 29. The numbers keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` §14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. (worktrees closed) The remote branches of merged work are still on origin: the 15 in `docs/PROGRAM.md` 4.6, plus `data/f1b-cambodia-villages`, `feat/f2-journey-world` and `feat/f3-location-first-open`, and the orphan screenshot branches. Recommended: remove them, one step per message, each checked against the tip first.
26. A coarse world outline for the journey map offline. Owner, 2026-10-26: measure first. Not done.
28. **Ruled (owner, 2026-10-27):** "no matter where you are in the world it should give you the emergency info". Slice F7 (4.1). Two things are not ruled and F7's first step is to ask them in one form: which numbers Emergency shows outside the four countries (the browsed country's, or the international ones), and whether it still says where the fix is.
29. **Ruled (owner, 2026-10-27):** hold the pick. Slice F6 (4.1). Not ruled: for how long (a time, a distance moved, until the traveller asks), and what makes the pick let go.
- **Placement of F6 and F7** (not asked yet): recommended F7 before F4, because it is safety; F6 with the other location work, after F4. The owner may move either.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~ ([PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139), built), **F4**, F5, L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 and F7 are unplaced. Each releasing slice stacks on the merged tip of the one before. Q2, S0, Q8 and the decision 26 measurement change no shipped file and can run alongside any of them.

**Next is F4.** [PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139) must be merged first.

### F4 and F5, then L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <F4, F5, L1 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> F5, L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> F4 and L3 draw their charts with S1's `--viz-*` tokens (built: `css/refined.css`; slots in the fixed order brick, plum, gold, teal, blue, green, violet, rose, never cycled; lines, bars and stacks only, a scatter or a map takes the first three; the `dataviz` skill's rules apply). Their screens carry `data-refined` on the root to get the refined type scale; new text sizes use `--fs-*` (`check-font-sizes`), new icons `js/icons.js`. F5 checks the OCR language files against the service-worker manifest (`docs/PROGRAM.md` 4.4). Machine-fill strings added by F1 and F3 in L2.

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
