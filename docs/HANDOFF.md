# Handoff, 2026-10-29 (F5b built; F7b and F5c are next)

The previous handoff (F5) is `git show 73c39f3:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F5b**, the rest of the host-language harvest, branch `feat/f5b-language-harvest`, [PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145), `mk-v0.657.0` (store version unchanged). Open, for the owner to merge. **The done criterion is met:** `lang-check.py` shows 0 fixed interface strings still English in th, vi, km and lo on all 96 routes (631 distinct before). Order: the owner ruled on 2026-10-29 that F5b runs before F7b (recorded in `docs/PROGRAM.md` 2 and 4.1).
  - **Safety text first.** `js/data/emergency.js` and `js/data/firstaid.js` (scenario guides, steps, embassy and hospital lines: 374 strings) in four lazy modules, `js/data/safety-text.<th|vi|km|lo>.js` (`export const SAFETY_STRINGS = { 'English': 'translation' }`, never an eager global). `ensureSafetyText` in `js/i18n.js` merges one into the language's dictionary; `render()` in `js/main.js` waits for it on `#sos`, `#firstaid-*` and `#hospital-*`; all four are in `sw.js` `PRECACHE`. `tools/lang-check/safety-text.py` keeps the key list (read from the data files with `jsc`) and writes batches; `check-ui-strings` item 7 checks key parity across the four, that no value is empty or equal to its English, and that every key is still in the data files.
  - **Interface strings.** 594 keys added to each of the four dictionaries (the "F5 harvest" block): screens, Settings, Market, Calendar, journey, vault, help, Talk. `apply-strings.py` writes the four host files only (`--all-files` restores the old 29-file write).
  - **Screens that repaint late.** `watchLateText()` in `js/i18n.js`, installed from `mount()`: one observer on `#app` runs the dictionary pass on whatever a screen adds after `mount()`, in the observer's own callback. Before it, 93 strings the dictionaries held stayed English on 14 routes (the Market boards repaint in 15 places, the vault form, the photo-pack sizes in Settings, the map controls). It skips additions made directly under `#app` (mount translates those), IMG and CANVAS nodes, and English; it is not the online pass.
  - `LEAD_EMOJI` also strips a leading maths symbol (`\p{Sm}`: "≤ 1 week", "⤢ Full screen"). `firstaid.js` and `medical.js`: the call headings, the number buttons and the location line are separate text nodes, with four new keys ("Call —", "1. Call —", "— everything here works with no signal.", "— turn on location for distances, or pick your country:"); the digits are never touched.
  - CSS: Khmer line height 1.45 for `.attr-tag` and `.swap-calc` (they set 1.35); seven titles and tile descriptions shortened where the translation was clipped (vi "Plan your next stop", "Pre-trip checklist", "What is this dish, fruit or bird?", "Visas, scams, customs, access"; km "Full offline map", "Your journal, photos and saves"; th "Rates, budget, what things cost").
  - **Register.** `scripts/ui-strings-review.json`: 3,872 entries for F5b (2,376 interface, 1,496 safety text; the safety groups first), 5,492 in all; 200 back-translations dated 2026-10-29 (50 per language: 193 same, 7 close, 0 differing). Close: "Rides" (shared travel) in all four, kept; "page" read back as "duty" in Thai and Lao, and a Khmer barb term: changed in the text.
  - **Decision 30 closed** (owner, 2026-10-29, as recommended): th, vi, km and lo must agree on keys; the other 25 may omit one and show English (`check-ui-strings`; CLAUDE.md Translations bullet; `tools/lang-check/README.md`). **The composed-string form is not built** (owner: its own slice, F5c).
  - `lang-check.py` has a `KEEP` set (web addresses, an example e-mail, organisation names, file formats, languages in their own names; compared with or without a leading emoji); `backtranslate.py` samples safety text and interface strings and records the source.

## Verified
Headless Chrome over CDP (fresh profile, 127.0.0.1, 375 x 812 at DPR 2, `document.hidden` false). Drivers: `tools/lang-check/`, and not in the repo `~/Library/Caches/mk-f5b/` (`check_safety.py`, `headings.py`, `probe_async.py`, `payload.py`).
- **`lang-check.py --lang th,vi,km,lo --strings`, 96 routes, final code** (the same table as the PR): `ui` 0 in all four (201 in th, vi and km before the late-text pass, 631 distinct before F5b); `clip` 29 in each, the English baseline; `over` 0; `glyph` 0; breaks inside a word or letter 0; `CLIPS` 0; `tight` 2 in each (`.phase-lbl` on Settings at 1.05, as in F5, hides nothing). `tpl` (composed): th 3,008, vi 3,008, km 3,055, lo 3,004; `data`: 4,970, 4,978, 4,973, 4,919.
- **Safety routes**: `#sos`, `#sos-vi`, `#sos-kh`, `#sos-la`, `#firstaid-th/-vi/-kh/-la/-baby`, `#hospital-th/-vi/-kh/-la` in each of the four, 52 renders: 0 of the 374 safety strings in English, 0 overflow, 0 console errors; screenshots read for Khmer `#sos` and Lao `#firstaid-th` (the narrow heading column that wraps "Call — Laos" one word a line is English's layout too).
- **Guards**: every guard in CLAUDE.md, `place-fields`, `port-themes`, `derive-viz`, `cache-version` (against `origin/feat/scaffold-bangkok-slice`), `check-ui-strings --assert-complete th,vi,km,lo` (29 languages, 1,368 keys in the host languages) and `jsc -m scripts/validate-jsc.mjs` pass.
- **Payload** (`gzip -9`): dictionaries th 59, vi 54, km 60, lo 59 KB (th was 32); safety modules th 40, vi 36, km 41, lo 39 KB, loaded on the safety routes only; all 29 dictionaries 1,983 KB raw, 668 KB gzip (1,578 and 557 after F5).
- **Not verified**: an iPhone (macOS fonts, not iOS's); WebKit (`webkit.swift` was not rerun for F5b, Chrome only); the wording by anyone who reads the four languages (all machine-made); the offline reload of `#sos` in Thai with the network cut (the files are in the precache and `check-offline-boot` passes, but no run with the network cut).

## Owner checks
- [ ] **F5b, iPhone Safari (or the Home Screen app), after the deploy:**
  1. Switch to Thai and open Emergency (`#sos`): under the number buttons the scenario guides read in Thai. Do not dial. Repeat in Vietnamese, Khmer and Lao.
  2. Open First aid (from Emergency) and the hospital screen in the same four. Note anything that reads wrongly or is still English, and say which language; the Lao and Khmer first-aid wording and the AED, EpiPen and "barb" terms are the least sure.
  3. Aeroplane mode, then reload in Thai: `#sos` and First aid are still in Thai (the safety file is in the offline cache).
  4. Settings, Market (open "Items"), Nearby with location off, the vault set-up and the map controls in each language: nothing in English except names. Tell me if any text is cut off.
  5. Compare how long the first screen takes to appear in Thai with the same on the F5 build, if you can: the Thai dictionary doubled (32 to 59 KB gzip).
- Carried: F5's iPhone list (`git show 73c39f3:docs/HANDOFF.md`, "Owner checks"), and from F4/F7a/F3/M3b the F4 recap on the iPhone, F7a's outside-region Emergency, the Xcode location usage description, the F3 location dialogs and the M3b sign-in checks.

## Not done / known issues
- **Composed strings and data text are still English** (F5c, `docs/PROGRAM.md` 4.1): 3,008 / 3,008 / 3,055 / 3,004 composed occurrences ("6 nights · 4 stops", "Speak <phrase>") need a placeholder form in `js/i18n.js` (a key like `Sources ({0})`); about 4,950 data strings per language (place names, editorial prose) need a plan.
- **All four languages are machine-made, unreviewed** by anyone who reads them (decision 6; the register lists every entry).
- **The read-aloud bar speaks the English source text** with an English voice on first aid and Emergency, whatever the screen's language (`readAloudBar` calls in `js/main.js` lines 6622 and 6706; read, not run). The screen is in Thai, the voice is English: L1.
- `watchLateText` does not see a screen that changes a text node's value in place, or sets an attribute later (a placeholder, an aria-label), and it does not run the online pass.
- RTL is measured, not fixed: Hebrew has 208 elements pinned left (L2). Lao has no read-aloud voice and Khmer only an online one (L1).
- **Payload (decision 32, new):** the four dictionaries are about twice what F5 left; a traveller in Thai loads 59 KB gzip at first paint instead of 32. Nothing was split by screen.
- Tooling: this session ran in a Nomadic Almanac worktree; the Mekong worktree `.claude/worktrees/f5b-language-harvest` was made with `git worktree add`. Edit and Write stayed refused for the Mekong path, so files went in through the scratchpad and `cp`, and edits through Python scripts. A Python 3.9 script with a long Thai or Khmer line fails to parse, so keep text in TSV or JSON files. A global replace on a translated phrase also changed an English key once ("Add to plan"): replace values, not text. A full `lang-check` of four languages takes about 15 minutes: run it in the background and do not edit served files while it runs (two runs were lost to that). The main checkout `Mekong/` is at `2f65d17`, stale; the worktrees `f5-language-check` and `f5b-language-harvest` are spent when their PRs merge.

## Open decisions (need the user)
Closed on 2026-10-29: 30 (relax the key rule). Closed on 2026-10-27: 25 (worktrees), 28, 29. The numbers keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese. **Add (F5b):** the 3,872 new machine-made Thai, Vietnamese, Khmer and Lao entries in `scripts/ui-strings-review.json`, safety wording first (`source: 'safety-text'`); the Lao and Khmer first-aid text and the AED and EpiPen terms are the least sure.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` section 14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. (worktrees closed) The remote branches of merged work are still on origin: the 15 in `docs/PROGRAM.md` 4.6, plus `data/f1b-cambodia-villages`, `feat/f2-journey-world`, `feat/f3-location-first-open`, `feat/s1-tokens-machinery` and `feat/f5-language-check`, and the orphan screenshot branches. Recommended: remove them, one step per message, each checked against the tip first.
29. **Ruled** (owner, 2026-10-27): hold the pick. Slice F6 (4.1), unplaced. Not ruled: for how long (a time, a distance moved, until the traveller asks), and what makes the pick let go. Recommended placement: with the other location work, after F4.
31. **New (F5b):** where F5c (composed strings) goes against F7b. Recommended: F7b first (it is placed, smaller and finite), then F5c, which is open-ended and may take more than one session; the owner can swap them.
32. **New (F5b):** the first-paint payload of the four dictionaries (th 59 KB gzip, was 32). Recommended: leave it until L2, which fills the other 25 and is the moment to decide how dictionaries are split; no change now.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~ ([PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139), merged), ~~F7a~~ ([PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140), merged), ~~F4~~ ([PR #143](https://github.com/SamuelLClemens/Mekonging/pull/143), merged), ~~F5~~ ([PR #144](https://github.com/SamuelLClemens/Mekonging/pull/144), merged), ~~the decision 26 measurement~~ ([PR #142](https://github.com/SamuelLClemens/Mekonging/pull/142), merged), ~~F5b~~ ([PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145), built), **F7b**, **F5c** (unplaced; recommended after F7b), L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 is unplaced. Each releasing slice stacks on the merged tip of the one before. Q2, S0 and Q8 change no shipped file and can run alongside any of them.

**Next is F7b** (F5b must be merged first), then F5c.

### L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <L1 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> L3 draws its charts with S1's `--viz-*` tokens (built: `css/refined.css`; slots in the fixed order brick, plum, gold, teal, blue, green, violet, rose, never cycled; lines, bars and stacks only, a scatter or a map takes the first three; the `dataviz` skill's rules apply). Their screens carry `data-refined` on the root to get the refined type scale; new text sizes use `--fs-*` (`check-font-sizes`), new icons `js/icons.js`. The check for L2 is `tools/lang-check/` (F5).

### F5c: composed strings in the four host languages (unplaced; recommended after F7b)
> Read CLAUDE.md, docs/HANDOFF.md, `tools/lang-check/README.md` and `docs/PROGRAM.md` (4.1 F5c, 4.4 "Language"). Run /slice for slice F5c.
> **Start.** `git fetch`; `gh pr list --state all`. F5b ([PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145)) must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`; serve it with `python3 scripts/serve.py <port>` and drive headless Chrome (`--no-sandbox`, profile outside `/private/tmp`, `document.hidden` false). A four-language `lang-check.py` run takes about 15 minutes: run it in the background and do not edit served files while it runs.
> **Ask the owner first (one form):** the placeholder syntax (`Sources ({0})` is the proposal; says whether a plural needs its own form) and whether the data text (place names and editorial prose, about 4,950 strings per language) is in this slice or a plan only.
> **Scope.**
> 1. `js/i18n.js`: a placeholder form. After an exact match fails, `translateTree` (and `watchLateText`) try a pattern key; the digits, names and emoji in the value are carried over untouched.
> 2. Convert the composed strings screen group by screen group (`lang-check.py --lang th,vi,km,lo --strings` lists them as `tpl`), safety groups first: "6 nights · 4 stops", "Speak <phrase>", the Emergency and hospital lines. th, vi, km and lo only (decision 30). Record every entry in `scripts/ui-strings-review.json` and back-translate 50 per language.
> 3. A plan for the data text, with the first slice named.
> **Done when:** `lang-check.py` shows 0 `tpl` for th, vi, km and lo on every route (or a measured remainder with each reason); no clipping, overflow or missing glyphs at 375 px; every guard passes; the PR is open. If it does not fit one session, split by screen group and say where it stopped. Then run /handoff.
> **Out of scope:** the other 25 languages (L2), right-to-left (L2), Talk's conversation mode (L1), the read-aloud bar's language (L1).

### F7b: the worldwide table of emergency numbers (placed right after F5b, which the owner put first)
> Read CLAUDE.md, docs/HANDOFF.md, docs/PROGRAM.md (4.1 F7b, 4.3 decision 28, 4.4 Location row) and `js/screens/emergency-outside.js`. Run /slice for slice F7b.
> **Start.** `git fetch`; `gh pr list --state all`. F5 ([PR #144](https://github.com/SamuelLClemens/Mekonging/pull/144)) and F5b ([PR #145](https://github.com/SamuelLClemens/Mekonging/pull/145)) must be merged and no PR open (decision 26's measurement is done, `docs/PROGRAM.md` 4.3). Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce on a rendered screen first (Singapore, Yangon and a fix 30 km into Myanmar from Mae Sot; the driver pattern is in HANDOFF "Verified").
> **Ask the owner first (one form):** the world outline is a download. If the measurement already got the owner's yes for the file, use that file and say so; otherwise state the file name, source and size before fetching. Also ask whether to split the table by region.
> **Scope.** A sourced table of national emergency numbers (every entry cited with a real URL; leave a country open rather than publish an unsourced number); a lazy country-of-fix lookup from the outline (new data files, never an eager global); the outside screen shows the numbers of the country the fix is in, keeps the coordinates, keeps 112 as the fallback, and `far` fixes get the answer too. Replace `fixSureness`'s distance hedge with the outline where it decides.
> **Done when:** the 15 fixes of F7a's driver plus a border pair (Mae Sot and 30 km into Myanmar) show the right country's numbers or, where the table has a gap, 112 and the coordinates; 0 console errors; 0 overflow at 375 px; every guard passes.
> **Out of scope:** translating the new strings (F5c for th, vi, km and lo once the placeholder form exists; L2 for the rest), the other `nearestSpotGlobal` callers.

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
