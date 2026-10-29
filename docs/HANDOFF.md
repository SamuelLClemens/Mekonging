# Handoff, 2026-10-29 (F7b built; F5c is next)

The previous handoff (F5b) is `git show f7da0b5:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F7b**, Emergency wherever the traveller is in the world, branch `feat/f7b-emergency-table`, [PR #146](https://github.com/SamuelLClemens/Mekonging/pull/146), `mk-v0.658.0` (store version unchanged). Open, for the owner to merge. F5b ([PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145)) is merged. **The done criterion is met:** F7a's 15 fixes plus the Mae Sot border pair, and 17 more, show the right country's numbers (34 fixes in all); 0 console errors; 0 overflow at 375 px; every guard passes.
  - **What a traveller sees outside the four countries** (`js/screens/emergency-outside.js`): the country the fix is in, the coordinates, one tap-to-call button per number (`a.btn.block.sos-num`, `tel:`, label and digits in two nodes like the four countries'), then 112 and the source page ("Source: travel.gc.ca"). A table with 112 in it gets no second 112 button. A country the table does not hold says so and gives 112 and the coordinates; an answer more than 20 km off the coast reads "Near X, about N km off its coast".
  - **Lookup** (`js/emergency-world.js`, eager, 8.3 KB, 3.5 KB gzip): `ensureWorld()` imports the lazy files (`js/data/world-outline.js` 470 KB, 150 KB gzip; `world-names.js` 2 KB gzip; five `emergency-world.<region>.js`, 6.3 KB gzip together), all in `sw.js` `PRECACHE`. `render()` in `js/main.js` waits for it only on a fix-driven `#sos` or `#hospital` whose fix is more than 10 km from the four countries' outlines; a fix inside the region never loads the 470 KB. It never rejects: a failed load renders F7a's screen. `worldCountryOf` is point in polygon (the smallest polygon wins) then the nearest edge within 100 km; 0 to 3 ms.
  - **The rule** (`worldDecides`): inside a polygon the outline decides; off it, only where no city of the four countries is within 100 km. `fixSureness` and `countryOfFix` share it. Why: the 0.05 degree outline drops small islands. Measured on all 36,131 list places (`gazetteer-check.mjs`): of the 681 more than 10 km from the four countries' outlines, 43 are decided by the world outline (all agree with the place's own country) and 638 keep F7a's logic; **0 wrong**. The first version, without the 100 km test, would have put the Thai Surin Islands (88 km from Khao Lak) in Myanmar and Ko Hantu (66 km from Satun) in Malaysia.
  - **The table** (`js/data/emergency-world.<region>.js`): 214 of 240 countries and territories (Asia 47, Europe 44, Africa 50, the Americas 51, Oceania 22); the four countries keep `js/data/emergency-numbers.js`. Every number is stated by the Government of Canada's travel advice (`travel.gc.ca`) or the UK FCDO's (`gov.uk`), cited in `src` and `src2`; the builder refuses a number that is not in the cited page's text. **Conflict rule:** two different numbers for one specific service, the service is left out; a general number the other page contradicts, or a page that denies a central number, leaves the country a gap. 22 gaps and the left-out services are listed in `docs/PROGRAM.md` 4.4.
  - **Guard and tools:** `scripts/check-emergency-world.py` (new; CI, `CLAUDE.md`, `scripts/README.md`): ids, numbers, https sources, no aggregator, nothing for the four countries, the files precached. `tools/world-outline/build.py` rebuilds the outline and names (its geometry is byte-identical to decision 26's measured file). `tools/emergency-world/` (`harvest.py`, `draft.py`, `build_region.py`, `decisions/`, a README) refreshes the table and **regenerates all five shipped files byte for byte** (checked).
  - Owner answers, 2026-10-29: the whole table in this slice with a check-in after each region (done after Asia); Canada's and the UK's travel advice are the accepted sources, with the conflict rule. Decision 26's file was reused from `~/Library/Caches/mk-d26-ne-50m`: no new download.

## Verified
Headless Chrome over CDP (fresh profile, 127.0.0.1, 375 x 812 at DPR 2, `document.hidden` false). Drivers, not in the repo, `~/Library/Caches/mk-f7b/`: `drive.py` (F7a's driver, patched: 34 points, `tel` and source-link capture, `BLOCK` and `ONLY` options), `lookup-test.mjs`, `gazetteer-check.mjs` (both `jsc`).
- **Before** (current code, 17 fixes): Singapore, Kuala Lumpur and Kunming showed only 112; Yangon, Mawlamyine, the Gulf mid-sea fix and 30 km into Myanmar showed Thailand's numbers with the `far` card.
- **After, 34 fixes**: Singapore, Malaysia (Kuala Lumpur, Penang), Myanmar (Yangon, Mawlamyine, 30 km from Mae Sot), China, Sri Lanka, India, Japan, France, Egypt, Australia, the United States, Kenya, Brazil and the United Kingdom each show their own country's numbers; every one of the 130 buttons is a `tel:` link; every country with numbers shows its source; Libya, Antarctica and the open Atlantic show 112 and the coordinates (Libya names itself). The 11 fixes in the four countries are unchanged (Bangkok, Hanoi, Don Det and the rest). The Surin Islands, Ko Hantu and the Gulf mid-sea fix keep F7a's `far` card with Thai numbers. **0 console errors, 0 overflow elements, 0 hidden pages.** St. Thomas reads "Near British Virgin Islands" (limit, below).
- **Failure path:** `world-outline.js` blocked (`BLOCK`): Singapore and Paris show F7a's screen (112 and the coordinates), Yangon F7a's `far` card, Bangkok is unchanged; 0 errors.
- **Lookup under `jsc`:** 45 places across the world, 45 match (the Vatican's Natural Earth polygon is a symbol 1.5 km west of the real one; St. Thomas is a known limit).
- **Guards:** every guard in `CLAUDE.md`, `check-emergency-world` (214 entries), `place-fields`, `port-themes`, `derive-viz`, `cache-version` (against `origin/feat/scaffold-bangkok-slice`) and `jsc -m scripts/validate-jsc.mjs` pass. CI had not reported when this was written.
- **Not verified:** an iPhone (the `tel:` hand-off to the dialler, Safari); the numbers themselves against the host countries' own pages (each is stated by two governments' advice or one, and the builder checked it against that page's text, but nobody has dialled any); the offline reload of an outside fix with the network cut (the files are in the precache and `check-offline-boot` passes); WebKit.

## Owner checks
- [ ] **F7b, iPhone Safari (or the Home Screen app), after the deploy:**
  1. Settings, the location test (or any way to set a fix outside the four countries): open Emergency. The country, the coordinates and the numbers show. Tap one: the dialler opens with that number. **Do not complete the call.**
  2. Open "Get to a hospital" from the same fix: the same numbers show on the first card.
  3. Aeroplane mode, then reload: the same screen (the outline and the table are in the offline cache).
  4. Pick a country you know and tell me any number that is wrong. Egypt (police 122, tourist police 126 only) and Sri Lanka (police only) are thin on purpose (4.4).
- Carried: F5b's iPhone list (`git show f7da0b5:docs/HANDOFF.md`, "Owner checks"), F5's, and from F4/F7a/F3/M3b the F4 recap on the iPhone, the Xcode location usage description, the F3 location dialogs and the M3b sign-in checks.

## Not done / known issues
- **Limits of the outline** (`docs/PROGRAM.md` 4.4, Location): within 10 km of a border of the four countries the four countries' own outline still decides (5 km into Myanmar reads Thailand); small islands the 0.05 degree outline dropped read a neighbour ("Near British Virgin Islands, about 22 km off its coast" for St. Thomas); three Vietnamese islands near Ha Tien already read Cambodia (Kep is the nearest anchor).
- **Left out for a conflict:** Egypt and Sri Lanka (the busiest), and a dozen smaller services; 22 gaps. A third government source, the host country's own page, would settle each (`tools/emergency-world/README.md`).
- **The new strings are English only** ("call for help" headings, "Near", "Source:", the gap sentence, the table's labels where they are not already dictionary keys): F5c for th, vi, km and lo, L2 for the rest. The labels `Police`, `Fire` and `Ambulance / medical` are already keys.
- **The table goes stale.** Nothing prompts a refresh.
- Fixed a trap, not a bug: the outline's `vi` is the US Virgin Islands and Vietnam is `vn`, while the app's own id for Vietnam is `vi` (`WORLD_TO_APP`; the guard refuses a table entry for the four countries).
- Tooling: `Edit` and `Write` worked in the worktree this session. The shell's directory resets between calls, so every command used the worktree's absolute path. `timeout` does not exist on macOS (use Python for a bounded wait). The two government sites answered curl at about 3 s a page; `smartraveller.gov.au` did not answer at all. The main checkout `Mekong/` is at `2f65d17`, 18 commits stale. The worktrees `f4-trip-recap`, `f5-language-check`, `f5b-language-harvest`, `s1-tokens` and `f7a-emergency-outside` are spent when their PRs merge. The dev server for this session (port 8751) is stopped.

## Open decisions (need the user)
Closed on 2026-10-29: 28 (built, F7b), 30 (relax the key rule), 31 (F7b went before F5c, as recommended). Closed on 2026-10-27: 25 (worktrees), 29. The numbers keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese. The 3,872 machine-made Thai, Vietnamese, Khmer and Lao entries in `scripts/ui-strings-review.json` (safety wording first) are the least sure of all.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` section 14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. (worktrees closed) The remote branches of merged work are still on origin: the 15 in `docs/PROGRAM.md` 4.6, plus `data/f1b-cambodia-villages`, `feat/f2-journey-world`, `feat/f3-location-first-open`, `feat/s1-tokens-machinery`, `feat/f5-language-check` and `feat/f5b-language-harvest`, and the orphan screenshot branches. Recommended: remove them, one step per message, each checked against the tip first.
29. **Ruled** (owner, 2026-10-27): hold the pick. Slice F6 (4.1), unplaced. Not ruled: for how long (a time, a distance moved, until the traveller asks), and what makes the pick let go. Recommended placement: with the other location work, after F4.
32. The first-paint payload of the four dictionaries (th 59 KB gzip, was 32). Recommended: leave it until L2, which fills the other 25 and is the moment to decide how dictionaries are split; no change now.
33. **New (F7b):** the services the two governments disagree on, Egypt and Sri Lanka first (4.4). Recommended: a short refresh slice that finds the host country's own page for each of them (about 14 services), run after F5c; the owner can place it earlier because Egypt and Sri Lanka are popular.
34. **New (F7b):** who refreshes the table and when. Recommended: re-run `tools/emergency-world/` once a year and whenever a traveller reports a wrong number; add a line to the Settings "Report a problem" flow only if the owner wants reports to reach the table.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~ ([PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139), merged), ~~F7a~~ ([PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140), merged), ~~F4~~ ([PR #143](https://github.com/SamuelLClemens/Mekonging/pull/143), merged), ~~F5~~ ([PR #144](https://github.com/SamuelLClemens/Mekonging/pull/144), merged), ~~the decision 26 measurement~~ ([PR #142](https://github.com/SamuelLClemens/Mekonging/pull/142), merged), ~~F5b~~ ([PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145), merged), ~~F7b~~ ([PR #146](https://github.com/SamuelLClemens/Mekonging/pull/146), built), **F5c** (unplaced; next), L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 is unplaced. Each releasing slice stacks on the merged tip of the one before. Q2, S0 and Q8 change no shipped file and can run alongside any of them.

**Next is F5c** (F7b must be merged first).

### L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <L1 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> L3 draws its charts with S1's `--viz-*` tokens (built: `css/refined.css`; slots in the fixed order brick, plum, gold, teal, blue, green, violet, rose, never cycled; lines, bars and stacks only, a scatter or a map takes the first three; the `dataviz` skill's rules apply). Their screens carry `data-refined` on the root to get the refined type scale; new text sizes use `--fs-*` (`check-font-sizes`), new icons `js/icons.js`. The check for L2 is `tools/lang-check/` (F5).

### F5c: composed strings in the four host languages (unplaced; next)
> Read CLAUDE.md, docs/HANDOFF.md, `tools/lang-check/README.md` and `docs/PROGRAM.md` (4.1 F5c, 4.4 "Language"). Run /slice for slice F5c.
> **Start.** `git fetch`; `gh pr list --state all`. F5b ([PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145)) and F7b ([PR #146](https://github.com/SamuelLClemens/Mekonging/pull/146)) must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`; serve it with `python3 scripts/serve.py <port>` and drive headless Chrome (`--no-sandbox`, profile outside `/private/tmp`, `document.hidden` false). A four-language `lang-check.py` run takes about 15 minutes: run it in the background and do not edit served files while it runs.
> **Ask the owner first (one form):** the placeholder syntax (`Sources ({0})` is the proposal; says whether a plural needs its own form) and whether the data text (place names and editorial prose, about 4,950 strings per language) is in this slice or a plan only.
> **Scope.**
> 1. `js/i18n.js`: a placeholder form. After an exact match fails, `translateTree` (and `watchLateText`) try a pattern key; the digits, names and emoji in the value are carried over untouched.
> 2. Convert the composed strings screen group by screen group (`lang-check.py --lang th,vi,km,lo --strings` lists them as `tpl`), safety groups first: "6 nights · 4 stops", "Speak <phrase>", the Emergency and hospital lines. th, vi, km and lo only (decision 30). Record every entry in `scripts/ui-strings-review.json` and back-translate 50 per language.
> 3. A plan for the data text, with the first slice named.
> **Done when:** `lang-check.py` shows 0 `tpl` for th, vi, km and lo on every route (or a measured remainder with each reason); no clipping, overflow or missing glyphs at 375 px; every guard passes; the PR is open. If it does not fit one session, split by screen group and say where it stopped. Then run /handoff.
> **Out of scope:** the other 25 languages (L2), right-to-left (L2), Talk's conversation mode (L1), the read-aloud bar's language (L1).

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
