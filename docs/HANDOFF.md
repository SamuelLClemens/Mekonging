# Handoff, 2026-11-10 (F5e built; L1 is next)

The previous handoff (F5d) is `git show 0acbce9:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F5e**, branch `feat/f5e-composed-fix-sweep`, [PR #151](https://github.com/SamuelLClemens/Mekonging/pull/151), `mk-v0.661.0` (store version unchanged). Open, for the owner to merge; CI had not reported when this was written. F5d ([PR #150](https://github.com/SamuelLClemens/Mekonging/pull/150)) is merged.
  - **Crossings:** the four "<country> entry" buttons are three text nodes; the freshness line's nouns are keys. `#crossings` shows 0 `ui` and 0 `tpl` in th, vi, km, lo.
  - **Fix-state sweep** (Home, Nearby, Places, journey with a GPS fix): 43 fixed strings and 18 composed ones (keys and `{0}` patterns, `source: core` in the register, dated 2026-11-10). Fixed in code: Home time-of-day title, Nearby status line and beach button (nodes), hub tiles' accessible names, language button title, journey marker labels (`t()`).
  - **Layout:** a translated drive-time chip left the screen (`.near-open .dist-chip` now shrinks): Nearby overflow 16 to 0.
  - **Rule change:** a pattern's fixed text is "distinctive" at 14 characters and three words (was 20) in `js/i18n.js` and `scripts/check-ui-strings.py`.
  - **Not done:** the 55 species-name nulls (no source named; item 3 of the brief).

## Verified
Headless Chrome over CDP, fresh profiles, 127.0.0.1, 375 px at DPR 2, `document.hidden` false on all 60 sweep rows. Drivers and results in `~/Library/Caches/mk-f5e/` (not in the repo).
- **Sweep** (`drive-fix.py`, three fixes, four screens, four languages, each string compared with the English render of the same point and route): `ui` 0 in th and vi, 3 in km and lo ("Oct"); overflow 0; glyph 0; `undefined` 0. `tight` Home 3 and Places 1 are unchanged from before (Home phase labels, one place-name row; no clipped ink).
- **`lang-check.py`** on `#crossings,#schedules-th,#prices-th,#home`: `ui` 0 and `tpl` 0 on `#crossings` in all four; `#home` 0 `ui`.
- **The full 96-route four-language run** was made on the pre-change tree: `tpl` 495 (th), 496 (vi), 533 (km), 484 (lo); 37 templates, most of them data that merely fits a loose template.
- **Guards:** every guard in `CLAUDE.md`, `check-cache-version` against `origin/feat/scaffold-bangkok-slice` and `jsc -m scripts/validate-jsc.mjs` pass.
- **Not verified:** an iPhone (Safari); any native speaker's reading; a blind back-translation of the new values; the full 96 routes on the final code; the offline reload; the live site; CI.

## Owner checks
- [ ] **F5e, iPhone Safari (or the Home Screen app), after the deploy**, in Thai, Vietnamese, Khmer, Lao, with location on:
  1. Border crossings: the four buttons under the freshness line read "<country name> + entry" and fit.
  2. Nearby (Places, near me): the line under the title, the "Nearest beach" button and the grey distance pills read in your language and stay on screen.
  3. **Khmer and Lao: the date on Home ("Tue, Nov 10") and month names on Places; tell me if they show in English.** Chrome here had no km or lo date data, so this is unmeasured on Safari.
  4. Read any five of the new lines you know well and tell me which are wrong (register entries dated 2026-11-10, `source: core`).
- Carried: F5d's list (`git show 0acbce9:docs/HANDOFF.md`), F5c's, F7b's, F5b's, F5's and the F4, F7a, F3, M3b checks.

## Not done / known issues
- **Remainder after F5e, each with a reason** (`docs/PROGRAM.md` 4.1): place and city names, guide titles and editorial text (data text); `unit · note` price lines on `#prices-th` and the railway lines on `#schedules-th` (data); "Step 1 of 3" (a `Step {0} of {1}` pattern would rewrite 5 strings in `js/data/`: split the welcome screen's nodes instead); `h`/`m`/`min` units inside a drive time and compass letters.
- **The species page and the rest of the wildlife library** are still English (the next data-text group is `nature`); so are transport, history, places and food data text. The hospital guides stay English (decision 35).
- **55 species names are null** (km 36, lo 19): English shows. No source named.
- **Nothing has been read by a native speaker** (decision 6).
- **Short keys apply app-wide** once loaded: F5e added "near", "in", "About", "Eat", "Hotel", "beach", "hotel" as exact keys. Same meaning where measured; not scanned for collisions the way F5d's 93 were.
- **Drive-time text** shows English units inside the translated phrase ("1h 45m-3h 45m").
- Tooling: `git switch -c ... origin/...` sets the integration branch as upstream: `git branch --unset-upstream`. `apply-strings.py` keeps a key it already wrote: to remove a key, edit the four dictionaries and the register by hand and keep the register's one-line-per-entry layout (`json.dumps(indent=...)` rewrites the whole file). A scratch script named `grp.py` shadows the standard module and breaks `drive-fix.py`. The worktree `Mekong-f5e` is spent when the PR merges, with `f8-location-staleness`, `docs-em-dashes` and `s1-tokens`. A dev server on port 8782 (and 8781) served the trees and may still run.

## Open decisions (need the user)
Closed on 2026-10-30: the F5c form is `{0}`, `{1}`, the data text is a plan only, and 35 (hold the hospital guides; applied in F5d, 2026-11-10). Closed on 2026-10-29: 28 (built, F7b), 30 (relax the key rule), 31 (F7b went before F5c, as recommended). Closed on 2026-10-27: 25 (worktrees), 29. The numbers keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese. The 3,872 machine-made Thai, Vietnamese, Khmer and Lao entries in `scripts/ui-strings-review.json` (safety wording first) are the least sure of all.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` section 14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. (worktrees closed) The remote branches of merged work are still on origin: the 15 in `docs/PROGRAM.md` 4.6, plus `data/f1b-cambodia-villages`, `feat/f2-journey-world`, `feat/f3-location-first-open`, `feat/s1-tokens-machinery`, `feat/f5-language-check` and `feat/f5b-language-harvest`, and the orphan screenshot branches. Recommended: remove them, one step per message, each checked against the tip first.
29. **Ruled** (owner, 2026-10-27): hold the pick. Slice F6 (4.1), unplaced. Not ruled: for how long (a time, a distance moved, until the traveller asks), and what makes the pick let go. Recommended placement: with the other location work, after F4.
32. The first-paint payload of the four dictionaries (th 59 KB gzip, was 32). Recommended: leave it until L2, which fills the other 25 and is the moment to decide how dictionaries are split; no change now.
33. **(F7b)** the services the two governments disagree on, Egypt and Sri Lanka first (4.4). Recommended: a short refresh slice that finds the host country's own page for each of them (about 14 services), run after F5d; the owner can place it earlier because Egypt and Sri Lanka are popular.
34. **New (F7b):** who refreshes the table and when. Recommended: re-run `tools/emergency-world/` once a year and whenever a traveller reports a wrong number; add a line to the Settings "Report a problem" flow only if the owner wants reports to reach the table.
35. **Ruled** (owner, 2026-10-30): machine-made safety data text may ship marked as machine-translated, except the hospital guides (`#hospital-<cc>` data text), which are held until a native speaker has read them (decision 6). F5d translated `#danger`, `#crossings` and `#etiquette-<cc>` only, and left the hospital guides alone; the picker's "machine-translated, under review" label is the marking.
36. **New (F5c):** the Khmer and Lao country names on the "outside" screen come from the platform (`Intl.DisplayNames`). Recommended: keep it, and read the iPhone check below; if an iPhone shows English there, add the 240 names to `world-names.js` for the four languages (about 6 KB gzip, lazy).
37. **New (F5d):** the 55 species names left null (km 36, lo 19) and the 122 names taken from `js/data/nature.js` (no native speaker has read them). Recommended: leave the nulls until a native speaker or a named source supplies the names (English and the Latin name show meanwhile); put the 122 and the 907 machine-made values in front of a native reader with decision 6's list.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~, ~~F7a~~, ~~F4~~, ~~F5~~, ~~the decision 26 measurement~~, ~~F5b~~, ~~F7b~~ ([PR #146](https://github.com/SamuelLClemens/Mekonging/pull/146), merged), ~~F5c~~ ([PR #147](https://github.com/SamuelLClemens/Mekonging/pull/147), merged), ~~F5d~~ ([PR #150](https://github.com/SamuelLClemens/Mekonging/pull/150), merged), ~~F5e~~ ([PR #151](https://github.com/SamuelLClemens/Mekonging/pull/151), built), **L1** (next), L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 is unplaced. Each releasing slice stacks on the merged tip of the one before. Q2, S0 and Q8 change no shipped file and can run alongside any of them.

**Next is L1** (F5e must be merged first).

### F5e (built)
> See "Shipped" above and `docs/PROGRAM.md` 4.1. The species-name nulls and the remainder list are the only open pieces; neither blocks L1.

### L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <L1 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> L3 draws its charts with S1's `--viz-*` tokens (built: `css/refined.css`; slots in the fixed order brick, plum, gold, teal, blue, green, violet, rose, never cycled; lines, bars and stacks only, a scatter or a map takes the first three; the `dataviz` skill's rules apply). Their screens carry `data-refined` on the root to get the refined type scale; new text sizes use `--fs-*` (`check-font-sizes`), new icons `js/icons.js`. The check for L2 is `tools/lang-check/` (F5).

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
