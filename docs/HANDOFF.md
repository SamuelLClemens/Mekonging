# L2a in progress (2026-11-10), branch `feat/l2-languages`, NOT shippable yet: `check-ui-strings` fails until he, ar, fa, ur hold all 1,620 keys

Owner rulings this session: L2 is split. **L2a** = Hebrew, Arabic, Persian, Urdu (this branch); **L2b** = es, fr, de, pt, it, ru, in that order. Decision 32 closed as "lazy per language": it already is (`js/i18n.js` `ensureUiStrings` imports one `ui-strings.<code>.js`), so no loader change was needed.
- Update (session 3, 2026-11-10): the 273-key gap is filled in he, ar, fa, ur (c1 = gap keys 0 to 139, c2 = 140 to 272; key list `~/Library/Caches/mk-l2/gap-keys.json`, batches `c1.tsv`, `c2.tsv`). Both passed `apply-strings.py --dry`, a placeholder-parity check and `jsc -m`; nobody has read them. `check-ui-strings` now shows 7 problems: the th, vi, km, lo 8-key gap (`Sources (3)` reports for all four) and the `SIM / e-SIM` warning in he, ar, ur. Still to do: those 8 keys, `safety-text.py` (374 keys) and `--set data` (271 keys) for the four languages, `backtranslate.py` samples, RTL fixes, 375 px screenshots, version bump, PR.
- Done: `LC_HOST=he,ar,fa,ur` makes `apply-strings.py` and `safety-text.py` write those four columns (default stays th,vi,km,lo); `SAFETY_LANGS` in `js/i18n.js` and `UI_STRING_MACHINE` list the four; harvest run `~/Library/Caches/mk-l2/run1/strings.json` (976 distinct interface strings, in review order); batches 0 to 975 applied (safety screens, first aid, medical, Emergency card, Home/Explore/You/Settings/Phrasebook labels, then Talk, Places, Calendar, Social, Money, Giving, Etiquette, Budget, Maps, Market; 3,000 register entries). Batch files `~/Library/Caches/mk-l2/b01.tsv` to `b05.tsv` (b04 = 450 to 599, commit `73bd055`; b05 = 600 to 749, commit `cac7d45`). All batches were checked only by `apply-strings.py --dry` (prefix match) and `jsc -m` on the four files (parses); nobody has read them. Persian rows use the Latin full stop, Urdu the Urdu one.
- Update (end of session 2, 2026-11-10): keys 750 to 975 applied, so all 976 harvested strings are in he, ar, fa, ur (b06 = 750 to 899, commit `be89089`; b07 = 900 to 975, commit `4debaf0`). Both batches passed `apply-strings.py --dry` and `jsc -m` on the four files; nobody has read them. **fa digit style settled:** Persian digits (۰-۹) in fa prose, Western digits in he, ar, ur; Latin brand names, units and licence codes stay Latin. One earlier fa line (key 548, score list) was corrected to Persian digits. jsc lives at `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc` (not on PATH).
- `check-ui-strings` now: he, ar, fa still short of the host keys no route showed; ur missing 273 keys; **th, vi, km, lo each miss 8 keys that the harvest found and the four old languages lack:** `Good tonight`, `Near Bangkok`, `clubs`, `hostel`, `live-music`, `read this one`, `Sources (3)`, and the long Etiquette intro ("What is rude, what is polite..."). These need th, vi, km, lo values (or null) for parity; not caused by wrong data, the harvest simply reached them first. Also a warning: `SIM / e-SIM` identical to English in he, ar, ur (a brand term; allow it or add it to the guard's exceptions).
- To do next (L2a part 3): fill the 273 ur gap and the equivalent he, ar, fa gaps (the keys the host files hold that no route showed; get the list from `python3 scripts/check-ui-strings.py`); the 8 th, vi, km, lo keys above; `safety-text.py` keys (374) and `--set data` keys (271) for the four languages, which need `js/data/safety-text.<code>.js` and `safety-data.<code>.js` for each; `backtranslate.py` samples; RTL fixes from the `rtl` column (rerun `lang-check.py --lang he,ar,fa,ur`); 375 px screenshots; version bump (`APP_VERSION`, `CACHE_VERSION`, manifest) and every guard; PR.
- Batch format: `n<TAB>first characters of the key<TAB>he<TAB>ar<TAB>fa<TAB>ur`, written to a file and run with `LC_HOST=he,ar,fa,ur`. Each batch of 150 is about 35k tokens of output: finish the interface strings in one more session of two batches. Hebrew and Arabic address the reader in the plural ("שלכם", "كم"); Persian and Urdu use the polite plural; arrows "→" become "←"; digits stay Western in he, ar, ur and Persian digits in fa when the string is prose (b05 mixed: check and settle). `check-ui-strings` now reports ur missing 782 keys (the other three similar); th and vi each report 1 missing key, `Sources (3)`, which this branch did not cause (not yet traced).

# Handoff, 2026-11-10 (L1 built; L2 is next)

The previous handoff (F5e) is `git show 9b5b6ef:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **L1**, branch `feat/l1-talk-face-to-face`, [PR #152](https://github.com/SamuelLClemens/Mekonging/pull/152), `mk-v0.662.0` (store version unchanged). Open, for the owner to merge; CI had not reported when this was written. F5e ([PR #151](https://github.com/SamuelLClemens/Mekonging/pull/151)) is merged.
  - **`#facetalk`** (`js/screens/facetalk.js`, lazy; button "Face to face on this phone" under the Talk box). The screen splits in two, the far half turned 180 degrees (`.ft-far`, CSS `rotate(180deg)`). Each half: a language select (the other half's language is left out), a transcript, a text box, Speak and Send. A turn goes through `translate()` into the other half's language and shows there; the sender's half shows what they said.
  - **Read aloud** is a toggle in the middle strip, off by default, kept in `prefs.faceTalk.speak`. It runs through `say()`, so every sound registers with `audio-control`. Each incoming turn has its own replay button, because iOS may refuse speech started after an `await`.
  - **Transcript** in `prefs.faceTalk.log` (last 100 turns, on the phone only, no store version change), cleared by the Clear button after `confirmAction`.
  - **Gates.** Offline at mount: the screen says so and opens the phrasebook. A half is typing only, with a note, when the phone has no recognition object, the language has no `speech` locale, or the engine answered `language-not-supported` (remembered for the session).
  - **`js/speech-input.js`** (new): `joinSpeechResults` moved out of `phrasebook.js`, plus `createDictation`, `speechCtor`, `MIC_ERRORS`. Talk's single box still has its own copy of the dictation state machine; folding it onto `createDictation` is a later tidy.
  - **Strings:** 20 new keys in th, vi, km, lo (machine-made, register `source: core`, dated 2026-11-10). `phrasebook.js` is now 1,372 lines.

## Verified
Headless Chrome over CDP, fresh profile, 375 x 812 at DPR 2, `document.hidden` false. Driver in `~/Library/Caches/mk-l1/drive.py` (not in the repo; modes `main`, `voice`, `nosr`, `pb`).
- **Four-turn English and Thai exchange by typing**, live translation services: en to th and th to en both correct, 4 of 4 turns on both halves. The log held 4 turns; Clear left 0. 0 console errors.
- **Layout:** far half `matrix(-1,0,0,-1,0,0)`; 0 boxes outside 375 px; 0 controls under 44 px; the stage runs y 108 to 742, above the tab bar (first build ended at 917 and was compacted: log 8vh, 60 px minimum, shorter toggle labels).
- **Voice, with a fake recognition engine:** Thai starts with `th-TH`, text reaches the box, Done stops it. Lao answers `language-not-supported` and that half becomes typing only with its note. With no recognition object, both halves are typing only.
- **Talk's single box** still takes dictation after `joinSpeechResults` moved; the new button routes to `#facetalk-th`.
- **`lang-check`** on `#facetalk-th` and `#phrasebook-th`, th, vi, km, lo: `ui` 0, clip 0, over 0, tight 0, CLIPS 0, glyph 0 (`tpl` 12 and `data` 379 on `#phrasebook-th` are as before).
- **Guards:** every guard in `CLAUDE.md`, place-fields, port-themes, derive-viz, `check-cache-version` against `origin/feat/scaffold-bangkok-slice` (`mk-v0.661.0` to `mk-v0.662.0`, 304 manifest files) and `jsc -m scripts/validate-jsc.mjs` pass.
- **Not verified:** Safari and any iPhone; real speech recognition in any browser (fake engine only); read-aloud audio; the dark skins and the far half's look on a real phone held flat; a native speaker's reading of the 20 new strings (80 register entries); CI on the PR.

## Owner checks
- [ ] **L1, iPhone Safari (or the Home Screen app), after the deploy, with a connection.** Open Talk, tap "Face to face on this phone".
  1. The top half is upside down and the bottom half reads normally; both fit with the tab bar showing.
  2. Set the bottom to English and the top to Thai. Type "Where is the bus station?" in the bottom half and tap Send: the Thai appears in the top half, upside down, and your own words show dashed in the bottom half.
  3. Type a Thai reply in the top half and Send: the English appears in the bottom half. Do two more turns, four in all.
  4. Tap Speak in the bottom half, say a sentence, tap Done, read the text, Send. Tell me if the microphone asks permission, whether it hears you, and whether it stops when you tap Done.
  5. Switch the top to Khmer or Lao: does the top half's Speak button disappear with a "Typing only" note, or does it listen? Tell me which languages listen.
  6. Turn Voice on and send a turn: does the translation speak aloud by itself? If not, does the speaker button on the turn work? (Lao and Khmer may have no voice offline.)
  7. Turn on airplane mode and reopen Face to face: it should say it needs a connection and offer the phrasebook. Tap Clear: the transcript goes after you confirm.
- Carried: F5e's list (`git show 9b5b6ef:docs/HANDOFF.md`), F5d's, F5c's, F7b's, F5b's, F5's and the F4, F7a, F3, M3b checks.

## Not done / known issues
- **Speech recognition language support is unmeasured on Safari.** The engine's own error is the only signal, and it may arrive only after the first tap; the first tap on an unsupported language shows "Listening" briefly before the note appears. The owner's check 5 measures it.
- **Translation errors** (the service's own English sentences from `translate.js`) still show in English in every language, as in the single Talk box.
- **Folding Talk's single box onto `createDictation`** (about 80 duplicated lines in `phrasebook.js`) is not done: it was out of scope and untested on a phone.
- **No conversation language pair is remembered per phrasebook:** the far language comes from the route, else the last used (`prefs.faceTalk.b`), and the near language is the last used.
- **Carried from F5e:** the remainder list (data text, `unit · note` price lines, "Step 1 of 3"), the 55 null species names, nothing read by a native speaker, short exact keys applied app-wide, English units in drive times.
- Tooling: `git switch -c ... origin/...` sets the integration branch as upstream (`git branch --unset-upstream`); `git push -u` creates no local remote-tracking ref in this clone, so check a push with `git ls-remote --heads origin <branch>`. Headless Chrome exposes its own `SpeechRecognition` as well as `webkitSpeechRecognition`: a fake must override both. The worktrees `Mekong-f5e` and `Mekong-l1` (after its PR merges), `f8-location-staleness`, `docs-em-dashes` and `s1-tokens` are spent when their PRs merge.

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
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~, ~~F7a~~, ~~F4~~, ~~F5~~, ~~the decision 26 measurement~~, ~~F5b~~, ~~F7b~~ ([PR #146](https://github.com/SamuelLClemens/Mekonging/pull/146), merged), ~~F5c~~ ([PR #147](https://github.com/SamuelLClemens/Mekonging/pull/147), merged), ~~F5d~~ ([PR #150](https://github.com/SamuelLClemens/Mekonging/pull/150), merged), ~~F5e~~ ([PR #151](https://github.com/SamuelLClemens/Mekonging/pull/151), merged), ~~L1~~ ([PR #152](https://github.com/SamuelLClemens/Mekonging/pull/152), built), **L2** (next), L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 is unplaced. Each releasing slice stacks on the merged tip of the one before. Q2, S0 and Q8 change no shipped file and can run alongside any of them.

**Next is L2** (L1 must be merged first).

### L1 (built)
> See "Shipped" above and `docs/PROGRAM.md` 4.1. Open: the owner's iPhone check, and what Safari reports for speech recognition in each language.

### L2 to L4 (and L5 after M5)
> Read CLAUDE.md, docs/HANDOFF.md and the "Traveller fixes and language work" section of docs/PLAN.md. Run /slice for slice <L2 to L4 or L5>, as written there.
> **Start.** `git fetch`; `gh pr list --state all`. The slice before it must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`. Reproduce the problem on a rendered screen before changing code. `preview_start` needs an entry in the PARENT folder's `.claude/launch.json` (CLAUDE.md).
> L5 ends with a check by the owner on their iPhone in Safari, from a short checklist the slice writes. L5 starts only after M5 has merged.
> L3 draws its charts with S1's `--viz-*` tokens (built: `css/refined.css`; slots in the fixed order brick, plum, gold, teal, blue, green, violet, rose, never cycled; lines, bars and stacks only, a scatter or a map takes the first three; the `dataviz` skill's rules apply). Their screens carry `data-refined` on the root to get the refined type scale; new text sizes use `--fs-*` (`check-font-sizes`), new icons `js/icons.js`. The check for L2 is `tools/lang-check/` (F5); L1 added 20 keys in th, vi, km, lo, so `check-ui-strings` counts 1,620 keys in the host languages.

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
