# Handoff, 2026-11-11 (L2b built, PR open; L2c is next)

The previous handoff (L2a) is `git show 0d52f36:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **L2b**, Spanish, French, German, Portuguese, Italian, Russian: branch `feat/l2b-languages`, `mk-v0.666.0` (CACHE_VERSION and manifest bumped), stacked on the merged tip of PR 155 (`0d52f36`). Owner ruling of 2026-11-10: L2 is split; **L2a** (he ar fa ur) is merged; **L2b** is this slice; the 15 languages left (bn cs hi id ja ko ms nl pl sv tl tr uk zh-CN zh-TW) are **L2c**.
  - 1,631 interface keys, 374 safety-text keys and 271 safety-data keys in each of the six, machine-made, register `source` core / safety-text / safety-data, **nobody has read them**. Gzip per language: interface 61 to 73 KB, safety text 35 to 42 KB, safety data 20 to 24 KB (ru is the largest).
  - Register: es, fr, de, pt, it, ru are in `UI_STRING_MACHINE` (`js/data/ui-strings.js`) and in `SAFETY_LANGS` (`js/i18n.js`), so the picker marks them machine-translated and the two lazy modules load on the safety screens. They are not precached (same as he, ar, fa, ur): offline use needs one online visit.
  - Address: es "tú", de "du", it "tu" (the dictionaries already used them); fr and ru formal; pt formal, European spelling. Kept throughout.
  - **Tools fixed.** `apply-strings.py` and `safety-text.py` read a fixed four columns; they now read as many as `LC_HOST` names (six here). `safety-text.py` also knows the six language names.
  - About 40 existing entries across the six were reworded to fit a 102 px topbar title or a two-line card description (es "Próxima parada", de "Überleben", ru "Выживание" and the like). The 11 `null` entries left in each of the six (Children, Starting camera…, the Emergency service labels, the machine-translation banner) are filled.
  - The Camera-unavailable message (a key the L2a languages did not hold) was added to th, vi, km, lo, he, ar, fa, ur as well, so every host language holds all 1,631 keys.

## Verified
- `lang-check` on es, fr, de, pt, it, ru, 96 routes each (headless Chrome, 375 px, runs in `~/Library/Caches/mk-l2b/final3`): `ui` 0, `over` 0, `tight` 0, `CLIPS` 0, `glyph` 0 in all six; `clip` 29 in es, fr, pt (English: 29), ru 30 and de, it 33 before the last three titles were shortened (those routes then read 0 clip, `chk-de`, `chk-it`, `chk-ru`). The 29 are the Plans cards and the Home hero, clipped in English too.
- Data screens (`#danger`, `#crossings`, the four `#etiquette-*`): 111 strings still English in each of the six, exactly the 111 kept on purpose (59 scientific names, 52 crossing names).
- Blind back-translation, 40 strings per language (24 safety), recorded in the register: 237 same, 3 close, 0 differs. Two weak spots fixed afterwards: ru "содержанием" (read as upkeep, not treatment) and it "Conus". **The same model made the translations and read them back**, and every language got the same 40 keys, so this is a consistency check, not an independent one.
- Headless Chrome over CDP, 375 x 812 at DPR 2, `document.hidden` false, 24 screens (home, sos, phrasebook, settings x 6 languages): `scrollWidth` 375 = `clientWidth` 375 on all. Driver `~/Library/Caches/mk-l2b/tools/shots.py`, images `~/Library/Caches/mk-l2b/shots/`. Home, Emergency (de, ru) and Settings (fr) were looked at.
- Every guard in the CLAUDE.md list passes on the final tree, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice` and `jsc -m scripts/validate-jsc.mjs` (19,297 of 19,297).

## Not done / known issues
- No native reader has seen any of the six languages (decision 6 applies to first aid, the dose and technique lines above all).
- Composed strings and some service labels still show English where lang-check counts them as `tpl` or `data`: "Thai phrase audio" on Settings, "In Thailand:" on Emergency. 393 to 486 `tpl` and about 4,650 `data` per language across the routes (place names and editorial text; the online pass covers them).
- Not checked in WebKit for this slice. The sample for the back-translation is small (40 of 2,275 per language).
- The 15 L2c languages still hold 11 `null` entries plus every key from this slice, shown as English.

## Open decisions (need the user)
None open. (Merging the L2b PR is the owner's step once CI is green.)

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2c: bn, cs, hi, id, ja, ko, ms, nl, pl, sv, tl, tr, uk, zh-CN, zh-TW, after the L2b PR has merged (stack on its merged tip). Same method as L2b: harvest with `lang-check.py --strings`, batches through `tools/lang-check/apply-strings.py` (set `LC_HOST`; check the 11 `null` entries and the keys the harvest does not list, as in L2b), `safety-text.py` and `--set data`, back-translation samples, 375 px screenshots, version bump. Split by script if one session cannot finish (bn and hi; ja, ko, zh-CN, zh-TW need their glyphs checked).
> Done when: the F5 check shows 0 untranslated interface strings in each language on every route, with no clipping, overflow or missing glyphs, and all guards pass. Out of scope: native review, local languages (L3, L4).
