# Handoff, 2026-10-28 (F5 built in part; F5b and F7b are next)

The previous handoff (F4) is `git show 1ca080a:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F5**, the language check and the host languages, branch `feat/f5-language-check`, [PR #144](https://github.com/SamuelLClemens/Mekonging/pull/144), `mk-v0.656.0` (store version unchanged, 17). Open, for the owner to merge. **Built in part**: the done criterion (0 fixed interface strings still English in th, vi, km and lo on every route) is not met; 631 are left in each (below).
  - `tools/lang-check/` (not shipped, no bump; README inside): `lang-check.py` loads every route (96: nav-groups, the sweep's extras, the hospital, first-aid, other-country SOS, scam, phrasebook and Market routes) in each of the 29 languages and prints a table per language and route: `ui` (a fixed string still English), `tpl` (one with a value in it), `data`, clipping, overflow, `tight`/`CLIPS` (line boxes too short for stacked marks, with the measured ink loss), missing glyphs, Thai/Lao/Khmer breaks inside a word or letter, RTL, and with `--mt` what the online pass changed. `webkit.swift` runs the same in-page script in a WKWebView (Safari's engine; no Xcode or Simulator here, Safari's Remote Automation is off). `apply-strings.py` and `backtranslate.py` are the harvest and review tools.
  - **The owner's Thai problem**: Thai tone marks cut off by line boxes of 1.1 to 1.22 em that hide their overflow (tab bar "สถานที่" read "สถานที", 2.3 px of ink lost in Chrome and 3.0 px in WebKit; the top-bar title; Khmer worse, 355 of 426 tab labels). One rule in `css/style.css` (the shared chrome gets S1's `--lh-script` and `--lh-vi`). Ink lost by more than 0.4 px: th 226, km 398, vi 81, lo 5 before; 0 after.
  - **Strings**: 405 keys in all 29 dictionaries (774 each now, in a marked "F5 harvest" block); th, vi, km, lo hold machine-made values (written by the session, no service), the other 25 hold `null`. Order of work: Emergency, medical, first aid, safety (139 keys), the hub and feature labels (46 + 77), Settings (105), Talk (30), the Emergency labels (8), the picker note. `scripts/ui-strings-review.json` holds 1,620 entries (language, key, machine-made, date, group) in review order and 200 back-translations (171 same, 29 close, 0 differing; the close ones name AED and EpiPen described rather than named in Khmer and Lao, and Lao "I need a hospital" read back as "I want to go to the hospital").
  - `js/data/ui-strings.js` rule 2 rewritten to the owner's 2026-10-24 ruling; `UI_STRING_MACHINE` lists the four; the picker (`languageSheet`) marks them "machine-translated, under review" and says so under the box in the chosen language. `check-ui-strings` counts nulls, checks the register against the dictionaries and takes `--assert-complete th,vi,km,lo`.
  - `sosScreen`: the heading and each number button are two text nodes now, so "Police", "Ambulance / medical" and "— call for help" translate and the digits are never touched (the old comment claimed the dictionary translated the labels; it could not). `i18n.js` `LEAD_EMOJI` also strips a leading tick or arrow (`\p{So}`, `← ↑ → ↓`): "✓ Avoid it:" and "↺ Back to the default four" were unmatchable.
  - OCR: `build-sw-manifest.py` hashes `.gz` (`grep -c traineddata sw.js`: 4). `reconcile()` deleted any cached entry absent from the manifest, so the fetch handler's copy of each 1 to 3.7 MB language file went at every release; tesseract's own IndexedDB copy was the only thing keeping offline OCR alive. Still not precached.

## Verified
Headless Chrome over CDP (fresh profile, 127.0.0.1, 375 x 812 at DPR 2, `document.hidden` false), plus WKWebView for WebKit. Drivers: `tools/lang-check/` and, not in the repo, `~/Library/Caches/mk-lang-check/` (`shot.py`, `picker_check.py`, `errors_check.py`, `talk-check.js`, `guards.py`).
- **Before and after, th, vi, km, lo, 96 routes** (before: 73): overflow 0, missing glyphs 0, breaks inside a word or letter 0 (676 Thai and 751 Khmer wraps read); ink lost 226, 81, 398, 5 then 0, 0, 0, 0. `tight` is 2 each, none clipping. Fixed interface strings still English, in occurrences: th 1,134 to 789, vi 1,112 to 789, km 1,148 to 807, lo 1,151 to 806; distinct: 631 in th (538 in the "screens" group F5 did not reach, 69 help and FAQ paragraphs and labels, 21 on Talk, 3 in the safety groups).
- **Render**: WebKit `#sos` in Thai before and after (screenshots in `~/Library/Caches/mk-lang-check/shots-wk-before` and `-after`): the tab bar's "สถานที่" and "หน้าแรก" whole after. Six Thai routes, 0 console errors, 0 CSP violations. The picker opened in Thai shows the four options and the note.
- **Talk** (WebKit, macOS, 2026-10-28, `talk-check.js`): translation en to th, vi, km, lo and back works (2 sentences each, back-translations match); read-aloud: th Kanya and vi Linh on device, km online only (`audioSupport` says `online`), **lo has none** (`can: false`, the app says to use the romanised pronunciation); `webkitSpeechRecognition` exists, per-language dictation untested (no microphone).
- **Guards**: every guard in CLAUDE.md, `place-fields`, `port-themes`, `derive-viz`, `cache-version` (against `origin/feat/scaffold-bangkok-slice`) and `jsc -m scripts/validate-jsc.mjs` pass. `check-ui-strings`: 29 languages, 774 keys, 1,620 register entries.
- **Not verified**: an iPhone (macOS fonts, not iOS's); OCR end to end across a release with the network cut; the Thai wording by anyone who reads Thai (all four are machine-made, hence the register).

## Owner checks
- [ ] **F5, iPhone Safari (or the Home Screen app), after the deploy:**
  1. Switch to Thai: the tab bar reads "สถานที่" with the tone mark over the last letter and `#sos`'s title "ฉุกเฉิน" is whole. Repeat in Vietnamese, Khmer and Lao.
  2. The language picker shows "machine-translated, under review" on the four, and the line under the box repeats it in the language you chose.
  3. `#sos` in Thai: "ประเทศไทย — ขอความช่วยเหลือ"; the number buttons start with a Thai label and end with the digits unchanged ("191"). Do not dial.
  4. First aid and the hospital screen in Thai: list anything that reads wrongly or still shows English.
  5. Talk: type "Where is the nearest hospital?", translate into Thai, tap the speaker (a Thai voice speaks). Repeat for Vietnamese, Khmer (needs a connection) and Lao (expect no voice).
  6. Talk, 🎤 Speak with the speaking language Thai, Vietnamese, Khmer and Lao: which listen, and what the app says when one cannot.
- Carried from F4/F7a/F3/M3b: the F4 recap on the iPhone, F7a's outside-region Emergency, the Xcode location usage description, the F3 location dialogs, and the M3b sign-in checks (see `git show 1ca080a:docs/HANDOFF.md`, "Owner checks").

## Not done / known issues
- **The harvest is not finished (F5b, `docs/PROGRAM.md` 4.1):** 631 fixed interface strings still English in each of th, vi, km and lo (`tools/lang-check/lang-check.py --lang th,vi,km,lo --strings`; do not include `he`, which lists every key); 3,134 composed strings and about 6,600 data strings per language. **The Emergency scenario guides and the first-aid steps are data** (166 strings on `#sos`, 216 on `#firstaid-th`, in `js/data`): they stay English with no signal in every language. That is the safety gap to close first, as a lazy per-language data module, never an eager global.
- Composed strings need a placeholder form in `js/i18n.js` (a key like `Sources ({0})`); not built, not decided.
- RTL is measured, not fixed: Hebrew has 208 elements pinned left (`text-align: left`), mostly the identify cards (L2).
- **Payload (open decision 30):** the 25 null-only languages each carry the 405 English keys: all 29 dictionaries 588 to 1,578 KB raw, 220 to 557 KB gzip, precached in the background; a traveller loads one file (th 8 to 32 KB gzip).
- Lao has no read-aloud voice and Khmer only an online one (L1); the "translate from" list still leaves out the phrasebook's own language (L1).
- Tooling: this session started in a Nomadic Almanac worktree; the Mekong worktree was made with `git worktree add` and entered with `EnterWorktree {path}`. Edit/Write stayed refused there (`worktree-switch-tool-staleness`), so files went in through the scratchpad and `cp`, and edits through Python scripts; a Python 3.9 script with a very long line of Thai or Khmer fails to parse ("Non-UTF-8 code"), so keep text in data files. The worktree `.claude/worktrees/f5-language-check` is spent when the PR merges; the main checkout `Mekong/` is at `2f65d17`, stale.

## Open decisions (need the user)
Closed on 2026-10-27: 25 (worktrees), 28 (rulings above), 29 (hold the pick). The numbers keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese. **Add (F5):** the 405 machine-made Thai, Vietnamese, Khmer and Lao entries in `scripts/ui-strings-review.json`, safety wording first; the Lao and Khmer first-aid text and the AED and EpiPen terms are the least sure.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` section 14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. (worktrees closed) The remote branches of merged work are still on origin: the 15 in `docs/PROGRAM.md` 4.6, plus `data/f1b-cambodia-villages`, `feat/f2-journey-world`, `feat/f3-location-first-open` and `feat/s1-tokens-machinery`, and the orphan screenshot branches. Recommended: remove them, one step per message, each checked against the tip first.
26. **Closed** (owner, 2026-10-27, [PR #142](https://github.com/SamuelLClemens/Mekonging/pull/142)): the journey map uses the Natural Earth 50m outline at 0.05 degrees (469.9 KB, 149.9 KB gzip), and F7b uses the same file. Numbers and the lookup test are in `docs/PROGRAM.md` 4.3. Nothing is built into the app yet; the download needs the owner's yes with file name, source and size when the slice that ships it starts.
28. **Closed** (owner, 2026-10-27): **F7b** (the worldwide table) goes right after F5, with decision 26's outline measurement run beforehand.
29. **Ruled** (owner, 2026-10-27): hold the pick. Slice F6 (4.1), unplaced. Not ruled: for how long (a time, a distance moved, until the traveller asks), and what makes the pick let go. Recommended placement: with the other location work, after F4.
30. **New (F5):** the 25 null-only dictionaries each carry the 405 English keys (+10 KB gzip per file, +337 KB precached overall). Recommended: keep it until L2 fills them (it ends the nulls), and do not add the next harvest's keys to the 25 files until L2 starts: let `check-ui-strings` treat a missing key in a language not yet in the harvest as a null. That relaxes the owner's rule of a key in all 29 files for the interval, so it needs a yes.

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~ ([PR #139](https://github.com/SamuelLClemens/Mekonging/pull/139), merged), ~~F7a~~ ([PR #140](https://github.com/SamuelLClemens/Mekonging/pull/140), merged), ~~F4~~ ([PR #143](https://github.com/SamuelLClemens/Mekonging/pull/143), merged), ~~F5~~ ([PR #144](https://github.com/SamuelLClemens/Mekonging/pull/144), built in part), ~~the decision 26 measurement~~ ([PR #142](https://github.com/SamuelLClemens/Mekonging/pull/142), merged), **F7b**, **F5b** (unplaced; recommended here), L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 is unplaced. F7b sits right after F5 (owner, 2026-10-27). Each releasing slice stacks on the merged tip of the one before. Q2, S0 and Q8 change no shipped file and can run alongside any of them.

**Next is F7b** (F5 must be merged first), then F5b.

### L1 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <L1 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> L1 and L5 end with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> L3 draws its charts with S1's `--viz-*` tokens (built: `css/refined.css`; slots in the fixed order brick, plum, gold, teal, blue, green, violet, rose, never cycled; lines, bars and stacks only, a scatter or a map takes the first three; the `dataviz` skill's rules apply). Their screens carry `data-refined` on the root to get the refined type scale; new text sizes use `--fs-*` (`check-font-sizes`), new icons `js/icons.js`. The check for L2 is `tools/lang-check/` (F5).

### F5b: the rest of the host-language harvest (unplaced; recommended right after F7b)
> Read CLAUDE.md, docs/HANDOFF.md, `tools/lang-check/README.md` and `docs/PROGRAM.md` (4.1 F5b, 4.4 "Language"). Run /slice for slice F5b.
> **Start.** `git fetch`; `gh pr list --state all`. F5 ([PR #144](https://github.com/SamuelLClemens/Mekonging/pull/144)) and F7b must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`; serve it with `python3 scripts/serve.py <port>` and drive headless Chrome (`--no-sandbox`, profile outside `/private/tmp`).
> **Scope.**
> 1. `lang-check.py --lang th,vi,km,lo --strings`, then translate the 631 fixed interface strings left, in the order the file gives, in batches of about 100 (`apply-strings.py --keys`), 50 per language back-translated (`backtranslate.py`), every entry in the register.
> 2. The Emergency scenario guides and first-aid steps (`js/data/emergency.js`, `js/data/firstaid.js`): machine-made text for the four languages in new lazy data modules (never an eager global), registered, safety first.
> 3. Ask the owner, in one form, whether to build the placeholder form for composed strings (a key like `Sources ({0})` in `js/i18n.js`) and whether to relax the 29-file key rule for the 25 null-only languages (open decision 30).
> **Done when:** the check shows 0 `ui` for th, vi, km and lo on every route; `#sos` and `#firstaid-*` show their scenario text in the four with no signal; every guard passes; the PR is open. Then run /handoff.
> **Out of scope:** the other 25 languages and right-to-left fixes (L2), Talk's conversation mode (L1).

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
