# Handoff, 2026-10-27 (F4 built; F5 is next)

The previous handoff (F7a) is `git show 139d885:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F4**, the post-trip recap with charts, branch `feat/f4-trip-recap`, [PR #143](https://github.com/SamuelLClemens/Mekonging/pull/143), `mk-v0.655.0` (store version unchanged, 17). Open, for the owner to merge.
  - `#recap` (`js/screens/trip-recap.js`, lazy, `SCREEN_LOADERS.triprecap`, `ROUTE_SCREENS.recap`, `NEEDS_ALL_COUNTRIES`, under "My stuff" in `js/nav-groups.js` as "Trip recap"). Sections, each left out when nothing was logged: header tiles (nights and dates, countries, stops, km between stops, spent and per day, journal entries and photos), nights per country, the route, what was spent (by category, by country, by day, week or month), journal and photos, places (rating spread, top 5), getting around (legs by mode, chosen against worked out), and the share buttons. An empty traveller gets "Nothing logged yet" with three ways to start.
  - `js/recap-data.js` (lazy): `tripRecap()` is the one object every figure comes from. `js/recap-spend.js` (eager, a leaf): `spendTotal()`, used by Home and by the recap, so the two totals cannot differ. `js/recap-charts.js` (lazy): bars, the stacked-column chart, the route map.
  - Home's post-trip card moved out of `main.js` (`returnRecapCard` to `recapSummaryCard` in `js/screens/home.js`) with a new primary "See your whole trip" to `#recap`; the dead `journeyCompanionCard` is deleted. `main.js` 7,660 to 7,617 lines.
  - **The shared journey code moved to a new `js/journey-stops.js`** (`journeyStops`, `journeyLegs`, `jkm`, the mode tables, `legKey`), imported back by `journal.js`: a new file, not new exports on an existing lazy module, and neither Home nor `#recap` loads the 1,022-line journal screen. The text moved is identical (checked against `HEAD`) except `export` keywords and `set: true` on a leg whose mode the traveller chose. `journal.js` 1,188 to 1,022 lines.
  - Charts use S1's `--viz-1` to `--viz-8` by slot (food 1, stay 2, transit 3, gear 4, the traveller's own categories 5 to 8; "Other" and any ninth grey, `--viz-axis`). The screen root carries `data-refined`. The CSS block is in `css/refined.css` before the generated viz block.
  - Registered for offline use: `index.html` preload block (`recap-spend.js`), `sw.js` PRECACHE (five files), manifest rebuilt, `scripts/build-icon-sprite.py` `NAV_ICONS` gains the new emoji.

## Verified
Headless Chrome over CDP, fresh profile per persona on 127.0.0.1, 375 x 812 at DPR 2 (1280 x 900 once), `document.hidden` false for every page, every host except 127.0.0.1 unresolvable. Drivers: `~/Library/Caches/mk-f4/{lib.py,persona.js,before.py,after.py,edge.py,moved.py}` (not in the repo).
- **Before (measured by the first F4 session):** Home's post card was one text card with 0 chart SVGs; `#recap` did not exist.
- **After, 4 personas at 375 px:** 0 console errors, 0 body controls under 44 px (the shared fold summary and the info icon are lifted to 44 px on this screen only), no "undefined" or "NaN".
  - Overflow: 0 non-SVG elements past 375 px; the sparse persona's map reports 5 outline paths past 375 px that the map's own crop clips (the SVG box itself is inside the viewport).
  - Full persona (5 stops, 3 countries, 38 budget rows): all six sections; light, dark and Night Market all 0 errors, 0 overflow, 0 small controls; 1280 px the same.
  - Sparse (3 entries, 2 stops, no spend): no spend section. Spend only (no stops): no country or map section, the unconverted currency flagged once. Empty: the empty state.
- **Every figure against the store (full persona, computed independently in the page):** total $729 on Home, in the header tile and in the model; 37 entries counted, 1 (25,000 MMK, no rate) named and left out; 19 nights; Thailand 8, Vietnam 7, Cambodia 4 (the dates give 8, 7, 4); 2,886 km (independent haversine 2,886); 9 entries, 13 photos; 10 rated, 7 loved; categories sum to $729.
- **Chart:** tap and arrow keys move the readout (`Home`, `End`, `ArrowRight`; a tap at mid-plot read Mar 10, $78); the plot is 131 px tall; the table twin has 19 rows and three columns, so it never scrolls sideways.
- **Edge cases:** week columns (120 days), month columns (400 days), one day of spend (a sentence, no chart), a home currency of THB, 50 stops (50 listed), trip stops that name no known city, a country left unset ("Country not set"), and hostile HTML in a stop name and a category name (shown as text; no element created, `window.__xss` unset).
- **The move is a no-op:** `#journey`, `#journal`, `#scrapbook`, `#sharejourney` and Home render with 0 code errors (the only console errors on `#journey` and `#journal` are MapLibre fetches to hosts the driver cannot resolve); the journey screen lists the same 5 stops and 4 leg glyphs.
- **Guards:** every guard in CLAUDE.md, `place-fields`, `port-themes`, `derive-viz`, `cache-version` (against `origin/feat/scaffold-bangkok-slice`) and `jsc -m scripts/validate-jsc.mjs` pass. `check-preloads` failed once on the new eager module and was fixed with `--fix`.
- Screenshots looked at: full persona at 375 px light (top to bottom), Night Market chart, 1280 px top; the month chart; the empty state. Not verified: an iPhone (touch on the chart); VoiceOver reading of the slider-style plot.

## Owner checks
- [ ] **F4, iPhone:** with a trip logged, Home (post phase) shows "See your whole trip"; `#recap` opens, the "By day" chart answers a tap with that day's figures, and "Show as a table" opens a table that fits the screen.
- [ ] **F7a, iPhone:** with the phone's location set outside the region (Xcode simulated location, or travelling), `#sos` shows "Outside Thailand, Vietnam, Cambodia and Laos", the coordinates, and the 112 button opens the dialer. Do not dial it.
- [ ] **Xcode (read only).** The live Xcode project is not in the repo, so the tree declares no location usage description. Confirm your local project still has `INFOPLIST_KEY_NSLocationWhenInUseUsageDescription`; without it the iOS wrapper never shows the dialog. Carried from F3.
- [ ] **iPhone, Safari and the Home Screen app, fresh install:** the welcome step's button raises the dialog once; allow, and Home names the place with no tap; on a second install refuse, and the banner shows once with no dialog on reload. Carried from F3.
- Carried from M3b: [ ] sign in on the iPhone Home Screen app by code, then the user id goes into `private.admins` and `private.testers`; [ ] sign in by link in Safari, then delete a test account; [ ] from the first real email, whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has.

## Not done / known issues
- Everything open is in `docs/PROGRAM.md` section 4. New in F4 (4.4, "Trip recap"):
  - Nights per country follow the date each stop was reached; a place merges into one stop, so a return to an earlier city is not a second stay.
  - Distance is the straight line between stops. A leg's mode is the traveller's choice, else the route graph's, else a guess from distance and days, and the screen says which.
  - Monthly costs and spending dated outside the stops' dates are in the total and categories but in no country and on no day. An entry in a currency with no rate is named and left out of every sum.
  - The strings F4 added are English only (L2). The route on `#recap` is a static drawing from the app's own outlines (the live map is one tap away on `#journey`); there is no photo grid.
  - The shared fold summary (30 px) and the info icon (24 px) are under 44 px on every other screen; F4 lifts them on `#recap` only (Q3 to Q5).
- Carried (`docs/PROGRAM.md` 4.4): the offline map outside the region, the map credits plate (Q7), the `getSource` race, the list parsed on the main thread on first use, a second mislocated anchor (Ba Ria-Vung Tau); F7a's: F7b is not built, a neighbour just over a border reads as the region country, `getLastFix` never expires, F7a's strings are English only.
- Tooling:
  - `preview_start` reads the PARENT folder's `.claude/launch.json`; F4 served the worktree with `python3 scripts/serve.py 8975` from Bash and drove Chrome directly. The server is stopped. Overflow checks must skip elements inside an `<svg>` whose own box is inside the viewport (a clipped map outline still reports its unclipped box).
  - The worktree `.claude/worktrees/f4-trip-recap` is spent when the PR merges. The main checkout `Mekong/` is at `2f65d17` and stale: read `CLAUDE.md` and the docs from a worktree.
  - `lib.py`'s `appearance()` set `prefs.theme` and `prefs.skin`; the real keys are `profile.theme` and `profile.skin` (fixed in the F4 driver).

## Open decisions (need the user)
Closed on 2026-10-27: 25 (worktrees), 28 (rulings above), 29 (hold the pick). The numbers keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` section 14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. (worktrees closed) The remote branches of merged work are still on origin: the 15 in `docs/PROGRAM.md` 4.6, plus `data/f1b-cambodia-villages`, `feat/f2-journey-world`, `feat/f3-location-first-open` and `feat/s1-tokens-machinery`, and the orphan screenshot branches. Recommended: remove them, one step per message, each checked against the tip first.
26. **Closed** (owner, 2026-10-27, [PR #142](https://github.com/SamuelLClemens/Mekonging/pull/142)): the journey map uses the Natural Earth 50m outline at 0.05 degrees (469.9 KB, 149.9 KB gzip), and F7b uses the same file. Numbers and the lookup test are in `docs/PROGRAM.md` 4.3. Nothing is built into the app yet; the download needs the owner's yes with file name, source and size when the slice that ships it starts.
28. **Closed** (owner, 2026-10-27): **F7b** (the worldwide table) goes right after F5, with decision 26's outline measurement run beforehand.
29. **Ruled** (owner, 2026-10-27): hold the pick. Slice F6 (4.1), unplaced. Not ruled: for how long (a time, a distance moved, until the traveller asks), and what makes the pick let go. Recommended placement: with the other location work, after F4.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~ ([PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139), merged), ~~F7a~~ ([PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140), merged), ~~F4~~ ([PR #143](https://github.com/SamuelLClemens/Mekonging/pull/143), built), **F5**, ~~the decision 26 measurement~~ ([PR #142](https://github.com/SamuelLClemens/Mekonging/pull/142), merged), **F7b**, L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 is unplaced. F7b sits right after F5 (owner, 2026-10-27). Each releasing slice stacks on the merged tip of the one before. Q2, S0 and Q8 change no shipped file and can run alongside any of them.

**Next is F5.** [PR #143](https://github.com/SamuelLClemens/Mekonging/pull/143) (F4) must be merged first; then F5 starts from the tip of `origin/feat/scaffold-bangkok-slice`.

### F5, then L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <F5, L1 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> F5, L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> L3 draws its charts with S1's `--viz-*` tokens (built: `css/refined.css`; slots in the fixed order brick, plum, gold, teal, blue, green, violet, rose, never cycled; lines, bars and stacks only, a scatter or a map takes the first three; the `dataviz` skill's rules apply). Their screens carry `data-refined` on the root to get the refined type scale; new text sizes use `--fs-*` (`check-font-sizes`), new icons `js/icons.js`. F5 checks the OCR language files against the service-worker manifest (`docs/PROGRAM.md` 4.4). Machine-fill strings added by F1 and F3 in L2.

### F7b: the worldwide table of emergency numbers (placed right after F5)
> Read CLAUDE.md, docs/HANDOFF.md, docs/PROGRAM.md (4.1 F7b, 4.3 decision 28, 4.4 Location row) and `js/screens/emergency-outside.js`. Run /slice for slice F7b.
> **Start.** `git fetch`; `gh pr list --state all`. F5 must be merged and no PR open (decision 26's measurement is done, `docs/PROGRAM.md` 4.3). Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce on a rendered screen first (Singapore, Yangon and a fix 30 km into Myanmar from Mae Sot; the driver pattern is in HANDOFF "Verified").
> **Ask the owner first (one form):** the world outline is a download. If the measurement already got the owner's yes for the file, use that file and say so; otherwise state the file name, source and size before fetching. Also ask whether to split the table by region.
> **Scope.** A sourced table of national emergency numbers (every entry cited with a real URL; leave a country open rather than publish an unsourced number); a lazy country-of-fix lookup from the outline (new data files, never an eager global); the outside screen shows the numbers of the country the fix is in, keeps the coordinates, keeps 112 as the fallback, and `far` fixes get the answer too. Replace `fixSureness`'s distance hedge with the outline where it decides.
> **Done when:** the 15 fixes of F7a's driver plus a border pair (Mae Sot and 30 km into Myanmar) show the right country's numbers or, where the table has a gap, 112 and the coordinates; 0 console errors; 0 overflow at 375 px; every guard passes.
> **Out of scope:** translating the new strings (L2), the other `nearestSpotGlobal` callers.

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
