# Handoff, 2026-11-11 (L2c-1 built, PR open; L2c-2 is next)

The previous handoff (L2b) is `git show 38ecd96:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **L2c-1**, Bengali and Hindi: branch `feat/l2c1-bn-hi`, `mk-v0.667.0` (CACHE_VERSION and manifest bumped, 329 files), stacked on the merged tip of PR 156 (`38ecd96`). Owner ruling of 2026-11-10: L2c is three slices; **L2c-1** (bn hi) is this one; **L2c-2** is ja, ko, zh-CN, zh-TW; **L2c-3** is cs, id, ms, nl, pl, sv, tl, tr, uk.
  - 1,631 interface keys, 374 safety-text keys and 271 safety-data keys in each of bn and hi, machine-made, register `source` core / safety-text / safety-data, **nobody has read them**. The harvest listed 974 English strings; 278 more keys that the other host languages hold were not on any harvested route (months, weekdays, the `{0}` composed strings, the Emergency fragments) and were filled from the es key list.
  - Register: bn and hi are in `UI_STRING_MACHINE` (`js/data/ui-strings.js`) and in `SAFETY_LANGS` (`js/i18n.js`). Not precached (same as the other 14): offline use needs one online visit.
  - Address: formal throughout (bn "আপনি", hi "आप"). The existing glossary was kept: hi "वाक्यांश पुस्तिका" (phrasebook), "शब्दकोश" (dictionary), "यात्रा डायरी"; bn "বাক্যাংশ বই", "ভ্রমণ ডায়েরি". Skin names are translated, as in the other languages.
  - The 10 older `null` entries (11 with "Starting camera…", which the harvest listed) are filled in both. They sit outside the harvest block, so `apply-strings.py` skips them: edit them by hand and add their register entries.
  - **Word order.** `You are near ` / `You are in ` / `near` / `in` are separate text nodes in front of a city name (`js/screens/nearby.js`, `js/main.js` 2387). Bengali and Hindi put the postposition after the city, so those four use a label with a colon or a dot separator ("আপনি আছেন:", "· पास ·") rather than a word that would read backwards. A native reader should look at them.
  - `safety-text.py` gained the language names for bn and hi (`NAMES`); `apply-strings.py` needed no change.

## Verified
- **F5 check** (`lang-check`, headless Chrome, 375 px, 96 routes each, `~/Library/Caches/mk-l2c1/final2`): `ui` 0, `over` 0, `tight` 0, `CLIPS` 0, `glyph` 0 in both bn and hi; `clip` 29 in both, the same 29 boxes that clip in English (the Plans cards and the Home hero). `tpl` 648 and `data` 4,786 per language (L2b: 393 to 486 `tpl`).
- **Data screens** (`#danger`, `#crossings`, the four `#etiquette-*`): 111 strings still English in each, exactly the 111 kept on purpose (59 scientific names, 52 crossing names).
- **Screenshots** (375 x 812 at DPR 2, `document.hidden` false, `scrollWidth` 375 = `clientWidth` 375 on all 12): home, sos, phrasebook, settings, firstaid, danger in bn and hi. Bengali conjuncts and Devanagari matras draw correctly, no missing-glyph boxes. Looked at: `#sos` in both languages and `#firstaid` in bn. Driver `~/Library/Caches/mk-l2c1/tools/shots.py`, images `~/Library/Caches/mk-l2c1/shots/`.
- **Blind back-translation**, 40 strings per language (24 safety), recorded in the register: bn 39 same, 1 close; hi 37 same, 3 close, 0 differs. **The same model made the translations and read them back in one session, with the English still in context**: a consistency check, not an independent one.
- Every guard in the CLAUDE.md list passes, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice` and `jsc -m scripts/validate-jsc.mjs`.
- Caught and fixed before commit: a Hindi value pasted onto a Bengali one (a lost tab in a batch row), "Baci" transliterated as the Hindi word for "stale" (बासी, now बाची), and a Latin "NA" typed for "না".

## Not done / known issues
- No native reader has seen either language (decision 6 applies to first aid, the dose and technique lines above all). Bengali digits are used in many bn values and Latin digits in others; not unified.
- Composed strings and some service labels still show English ("In Thailand:" on Emergency). Not checked in WebKit. The back-translation sample is small (40 of 2,275 per language).
- **A stale dev server answered on port 8761** (started 2026-11-10 from another tree). The first harvest and the first full F5 run read that tree and reported `ui` 1,680; the final run used a server started from the worktree (`lsof -p <pid> | grep cwd`) on 8771. Before any check, confirm the server's working directory and that `curl .../js/main.js | grep APP_VERSION` shows the version you expect. The old 8761 server was not mine and is still running.
- The 13 L2c-2/3 languages still hold their `null` entries and every key from this slice, shown as English.

## Open decisions (need the user)
None open. (Merging the L2c-1 PR is the owner's step once CI is green.)

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2c-2: ja, ko, zh-CN, zh-TW, after the L2c-1 PR has merged (stack on its merged tip). Same method as L2c-1: harvest with `lang-check.py --strings` against a server you started from the worktree, batches through `tools/lang-check/apply-strings.py` (`LC_HOST=ja,ko,zh-CN,zh-TW`; then dump the keys the other host languages hold and the harvest missed, as in L2c-1), `safety-text.py` (add the four names to `NAMES`) and `--set data`, the 10 older `null` entries by hand, back-translation samples, 375 px screenshots with the CJK glyphs checked, version bump.
> Done when: the F5 check shows 0 untranslated interface strings in each of the four on every route, with no clipping, overflow or missing glyphs, and all guards pass. Out of scope: native review, local languages (L3, L4), L2c-3.
