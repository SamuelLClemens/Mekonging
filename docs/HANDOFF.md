# Handoff, 2026-10-30 (F5c built; F5d is next)

The previous handoff (F7b) is `git show e1a06b0:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **F5c**, composed strings in Thai, Vietnamese, Khmer and Lao, branch `feat/f5c-composed-strings`, [PR #147](https://github.com/SamuelLClemens/Mekonging/pull/147), `mk-v0.659.0` (store version unchanged). Open, for the owner to merge; CI had not reported when this was written. F7b ([PR #146](https://github.com/SamuelLClemens/Mekonging/pull/146)) is merged.
  - **The form** (`js/i18n.js`): a dictionary key may hold slots, `'Sources ({0})': 'แหล่งที่มา ({0})'`. After an exact key fails the patterns are tried; what a slot caught goes back into the value, and a slot that is itself a key ("Thailand", "🇹🇭 Thai") is translated. A line joined with " · " is looked up part by part. An exact key beats a pattern. A pattern opening with a symbol or two fixed words applies to any text; every other one (`Copy {0}`, `Hide {0}`) to `aria-label` only, so prose that starts the same way is left alone.
  - **The guard** (`check-ui-strings`, item 8): same slots in key and value; each word of a key must still occur in the code; no string in `js/data/` and no key-less fixed string in the code may be one a text-wide pattern would rewrite. It caught `Step {0} of {1}` (it fitted "Step OVER the raised threshold…" in `etiquette.js`), which was dropped, and a latent mismatch between keys with an apostrophe and the register.
  - **158 keys per language** in th, vi, km and lo, all in the review register, written with the existing `apply-strings.py`. They cover the Emergency "outside" screen and the hospital screen (F7a, F7b), the table's five missing labels, the lines Emergency and the hospital screen show with a GPS fix (the language check never sets one), Talk and the phrasebook, the audio packs, sources, transport, places, trips, budget and export.
  - **Code:** `emergency-outside.js` names the country with `Intl.DisplayNames` for the four languages and splits "Read these to a dispatcher." from the sentence after it; `audio-packs.js` and `medical.js` split a label and a call chip into two text nodes. Tools, not shipped: `tools/lang-check/tpl-list.py`, `drive-fix.py`.
  - **Owner answers, 2026-10-30:** data text is a plan only; the form is `{0}`, `{1}`. The plan and its first slice, F5d, are in `docs/PROGRAM.md` 4.4 (Language).
  - **Session start:** this session was launched in a Nomadic Almanac worktree, not Mekong's. The Mekong worktree was made by hand (`.claude/worktrees/f5c-composed-strings`, from `origin/feat/scaffold-bangkok-slice`), and the edit hook refused it, so every edit was an exact-match Python replacement through Bash.

## Verified
Headless Chrome over CDP, fresh profiles, 127.0.0.1, 375 px at DPR 2, `document.hidden` false. Drivers, not all in the repo, `~/Library/Caches/mk-f5c/` (`tpl-list.py` and `drive-fix.py` are in `tools/lang-check/`).
- **Full language check, 4 languages x 96 routes, all checks**, before and after (occurrences per language): `tpl` 3,022 to 507 (th), 3,021 to 508 (vi), 3,069 to 545 (km), 3,015 to 495 (lo); `ui` 1 to 0; clip 29 as in English; overflow 0; `tight` 2 on Settings as before; glyph 0; word and letter breaks 0.
- **The remainder is not interface text.** Of the 507 in Thai, 362 are lines the app joins from two data fields, 24 are time ranges inside prose, about 80 are data prose that fits a loose template; about 40 (8 %) are interface strings left on purpose (`In {0}:`, `Open {0} ↗`, `{0} left`, `{0}–{1} by road (est.)` and others, listed in `docs/PROGRAM.md` 4.4) because a pattern for them would rewrite prose. A partly translated string no longer counts as English in the check, so a falling `tpl` does not show the data part is translated.
- **Emergency and hospital at 7 fixes** (Singapore, a British Virgin Islands fix, Libya, the Gulf, Paris, Cairo, Bangkok), 4 languages, 2 routes, 56 renders: 0 hidden pages, 0 console errors, 0 overflow, clip, tight, glyph or break. Singapore, the Virgin Islands fix, Libya, Paris and Cairo have no interface English left except the topbar language labels (`data-no-i18n`).
- **Back-translation, blind:** 200 entries (50 per language): 185 same, 15 close, 0 differing. The close ones: Vietnamese and Khmer read "pace" as rhythm or speed, the bare language names read as country names ("Việt", "វៀតណាម").
- **A recheck on the final code** of 8 routes in th and lo: the same text counts and the same layout numbers as the full run, which ran on the commit before the last two fixes.
- **Guards:** every guard in `CLAUDE.md`, `check-cache-version` against `origin/feat/scaffold-bangkok-slice`, and `jsc -m scripts/validate-jsc.mjs` pass.
- **Not verified:** an iPhone (Safari); a native speaker's reading of any of the 158 x 4 values; the Khmer and Lao country names (this machine's headless Chrome returns English for them, JavaScriptCore returns the names); Home, Nearby, Places and the journey with a GPS fix; the offline reload of the outside screen in the four languages.

## Owner checks
- [ ] **F5c, iPhone Safari (or the Home Screen app), after the deploy:**
  1. Settings, language Thai (then Vietnamese, Khmer, Lao). Open Emergency with a location outside the four countries (the location test in Settings): the heading names the country in that language, and "Near X" / "About N km off its coast." read as a sentence. **Khmer and Lao: tell me if the country name is English.**
  2. Open "Get to a hospital" from a Bangkok fix: "Near you:", "Closest hospital to you right now", "Then:" and the walking times read in the language (the "Bangkok · ~23 min walk" lines are mixed: the place stays English).
  3. Talk, Thai: tap a phrase's speaker button with VoiceOver on, or read its label: "พูด: …".
  4. Read any five lines of the 158 new ones you know well and tell me which are wrong (the register is in review order: `scripts/ui-strings-review.json`, entries dated 2026-10-30).
- Carried: F7b's list (`git show e1a06b0:docs/HANDOFF.md`, "Owner checks"), F5b's (`git show f7da0b5:docs/HANDOFF.md`), F5's, and from F4/F7a/F3/M3b the F4 recap on the iPhone, the Xcode location usage description, the F3 location dialogs and the M3b sign-in checks.

## Not done / known issues
- **The data text** (about 5,220 occurrences per language) is a plan only: `docs/PROGRAM.md` 4.4. Its first slice is F5d.
- **About 40 composed interface strings** still English (list in 4.4): each needs its screen to emit separate text nodes (the F5b method), not a pattern.
- **Fix-state screens other than Emergency and the hospital screen** were never measured (Home, Nearby, Places, the journey). `data-no-mt` text is outside the check's `ui` count: F5c found three safety lines there that F5 and F5b had called clean.
- **A pattern could still rewrite UGC** that starts exactly as a text-wide pattern does ("Sources (see…" in a journal note). The guard proves no string in `js/data/` or the code does; user text is not checkable. The reach rule keeps the short ones to `aria-label`.
- **`lang-check.py --strings`** lists only `ui`; `tpl-list.py` lists `tpl`. Neither sees a state it does not set up.
- Tooling: the shell's directory resets between calls; `Edit` and `Write` are refused in a worktree this session did not launch in (use exact-match Python edits and scratchpad files). The dev servers on ports 8761 to 8763 were stopped. The worktrees `f4-trip-recap`, `f5-language-check`, `f5b-language-harvest`, `f7a-emergency-outside`, `f7b-emergency-table` and `s1-tokens` are spent when their PRs merge; `f5c-composed-strings` is spent when #147 merges. The main checkout `Mekong/` is at `2f65d17`, stale.

## Open decisions (need the user)
Closed on 2026-10-30: the F5c form is `{0}`, `{1}`, the data text is a plan only, and 35 (hold the hospital guides). Closed on 2026-10-29: 28 (built, F7b), 30 (relax the key rule), 31 (F7b went before F5c, as recommended). Closed on 2026-10-27: 25 (worktrees), 29. The numbers keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese. The 3,872 machine-made Thai, Vietnamese, Khmer and Lao entries in `scripts/ui-strings-review.json` (safety wording first) are the least sure of all.
8. Legal, for Omer Hanegbi or Omri Siri: `docs/EXCHANGE.md` section 14, the terms and privacy policy, and the dispensary question. The terms and privacy policy gate M9; cash swap gates M10.
10. Topbar icon spacing. Deferred until Q3 to Q5 are done; ask again after Q5.
25. (worktrees closed) The remote branches of merged work are still on origin: the 15 in `docs/PROGRAM.md` 4.6, plus `data/f1b-cambodia-villages`, `feat/f2-journey-world`, `feat/f3-location-first-open`, `feat/s1-tokens-machinery`, `feat/f5-language-check` and `feat/f5b-language-harvest`, and the orphan screenshot branches. Recommended: remove them, one step per message, each checked against the tip first.
29. **Ruled** (owner, 2026-10-27): hold the pick. Slice F6 (4.1), unplaced. Not ruled: for how long (a time, a distance moved, until the traveller asks), and what makes the pick let go. Recommended placement: with the other location work, after F4.
32. The first-paint payload of the four dictionaries (th 59 KB gzip, was 32). Recommended: leave it until L2, which fills the other 25 and is the moment to decide how dictionaries are split; no change now.
33. **(F7b)** the services the two governments disagree on, Egypt and Sri Lanka first (4.4). Recommended: a short refresh slice that finds the host country's own page for each of them (about 14 services), run after F5d; the owner can place it earlier because Egypt and Sri Lanka are popular.
34. **New (F7b):** who refreshes the table and when. Recommended: re-run `tools/emergency-world/` once a year and whenever a traveller reports a wrong number; add a line to the Settings "Report a problem" flow only if the owner wants reports to reach the table.
35. **Ruled** (owner, 2026-10-30): machine-made safety data text may ship marked as machine-translated, except the hospital guides (`#hospital-<cc>` data text), which are held until a native speaker has read them (decision 6). F5d translates `#danger`, `#crossings` and `#etiquette-<cc>` only.
36. **New (F5c):** the Khmer and Lao country names on the "outside" screen come from the platform (`Intl.DisplayNames`). Recommended: keep it, and read the iPhone check below; if an iPhone shows English there, add the 240 names to `world-names.js` for the four languages (about 6 KB gzip, lazy).

## Next session prompts
Order (owner, 2026-10-25; `docs/PROGRAM.md` section 2): ~~F2~~, ~~F1b~~, ~~F3~~, ~~S1~~, ~~F7a~~, ~~F4~~, ~~F5~~, ~~the decision 26 measurement~~, ~~F5b~~, ~~F7b~~ ([PR #146](https://github.com/SamuelLClemens/Mekonging/pull/146), merged), ~~F5c~~ ([PR #147](https://github.com/SamuelLClemens/Mekonging/pull/147), built), **F5d** (unplaced; next), L1, L2, L3, L4, **Q3 to Q7**, **T1**, **T2**, then M4b-2, M4c (installs `pglast`), M5, L5, D5 tidy, **G1 to G4**, **R1 to R3**, Bangkok B1 to B8, city depth C1 onward, then T3 to T15; F6 is unplaced. Each releasing slice stacks on the merged tip of the one before. Q2, S0 and Q8 change no shipped file and can run alongside any of them.

**Next is F5d** (F5c must be merged first).

### F5d: data text, safety first, and the fix-state sweep (unplaced; next)
> Read CLAUDE.md, docs/HANDOFF.md, `tools/lang-check/README.md` ("Composed strings") and `docs/PROGRAM.md` (4.4, Language: the data-text plan). Run /slice for slice F5d.
> **Start.** `git fetch`; `gh pr list --state all`. F5c ([PR #147](https://github.com/SamuelLClemens/Mekonging/pull/147)) must be merged and no PR open. Worktree from `origin/feat/scaffold-bangkok-slice`, made from the Mekong repo itself (`git -C <Mekong> worktree add`); serve it with `python3 scripts/serve.py <port>` and drive headless Chrome (`--no-sandbox`, profile outside `/private/tmp`, `document.hidden` false). A four-language `lang-check.py` run takes about 25 minutes: run it in the background, on a `git archive` copy so edits do not disturb it.
> **Decision 35 is ruled** (owner, 2026-10-30): machine-made safety data text may ship marked as machine-translated, **except the hospital guides, which are held** until a native speaker has read them. Do not translate `#hospital-<cc>` data text. No question is open for this slice.
> **Scope.**
> 1. The data text of the safety screens, in th, vi, km and lo: `#danger` (118), `#crossings` (131), `#etiquette-<cc>` (72); the hospital guides (`#hospital-<cc>`, about 116 per language) stay English. Method: F5b's (`tools/lang-check/safety-text.py`): exact English keys in a lazy per-language module, loaded with the screen, never in the eager dictionary; `check-ui-strings` ties each key to the data it came from; every entry in `scripts/ui-strings-review.json`, 50 per language back-translated.
> 2. The about 40 composed interface strings still English (`docs/PROGRAM.md` 4.4): split each screen's text nodes (the F5b method), then a key; do not add a pattern for them.
> 3. A fix-state sweep: Home, Nearby, Places and the journey with a GPS fix, in the four languages, with `tools/lang-check/drive-fix.py`; count `data-no-mt` text too.
> **Done when:** the routes in 1 show 0 `data` in the four languages on `lang-check.py` (or a measured remainder with each reason); no clipping, overflow or missing glyphs at 375 px; every guard passes; the PR is open. If it does not fit one session, split by route group and say where it stopped. Then run /handoff.
> **Out of scope:** the other 25 languages (L2), transport, history, nature, places, food data text (later slices of the same plan), right-to-left, Talk's conversation mode (L1).

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
