# Handoff, 2026-11-13 (L2c-2b built, PR 159 open; L2c-3 is next)

Every open item lives in `docs/PROGRAM.md` section 4. The previous handoff (L2c-2) is `git show eefd544:docs/HANDOFF.md`.

## Shipped
- **L2c-2b**, Simplified and Traditional Chinese: branch `feat/l2c2b-zh`, [PR 159](https://github.com/SamuelLClemens/Mekonging/pull/159), `mk-v0.669.0` (CACHE_VERSION and manifest bumped, 337 files), cut from the merged tip of PR 158 (`eefd544`).
  - 1,631 interface keys, 374 safety-text keys and 271 safety-data keys in each of zh-CN and zh-TW, machine-made, register `source` core / safety-text / safety-data, **nobody has read them**. The harvest listed 975 English strings; the 277 keys it missed came from the ja key list; the 10 older `null` entries were filled by hand. Two safety-data keys the harvest key run did not list (the etiquette intro and "read this one") were added to the key file by hand, as in L2c-2.
  - zh-CN is written by hand (Simplified, mainland terms, 您). **zh-TW is derived from zh-CN, not written separately**: ICU `Simplified-Traditional` (a Swift filter) plus a Taiwan term map and corner quotes. The driver is `~/Library/Caches/mk-l2c2b/tools/mk.py` and `retw.py` (outside the repo, wiped on cache clean). Expect leftover mainland phrasing wherever the map has no entry.
  - Register: both are in `UI_STRING_MACHINE` and `SAFETY_LANGS`. Not precached.
  - Word order: "You are in" is "您在" (city follows), "You are near" is "您的位置：", the separate `in` / `near` nodes are "· 位于 ·" / "· 附近 ·".

## Verified
- **F5 check** (`lang-check`, headless Chrome, 375 px, 96 routes each, server from this worktree on 8793, `/js/main.js` showed `mk-v0.669.0`): `ui` 0, `over` 0, `tight` 0, `CLIPS` 0, `glyph` 0 in zh-CN and zh-TW; `clip` 28 in both = the 28 boxes that clip in English. `tpl` 441 and 647, `data` 4,708 and 4,794. Run in two parts (65 + 31 routes) because `lang-check.py` died on a lone surrogate at route 65; fixed in the tool (`ensure_ascii` fallback) and the records merged.
- **Screenshots** (375 x 812, DPR 2, `document.hidden` false, `scrollWidth` 375 = `clientWidth` on all 12): home, sos, phrasebook, settings, firstaid, danger in both, `~/Library/Caches/mk-l2c2b/shots`. Looked at `#sos` zh-CN and `#firstaid` zh-TW: Han glyphs draw, no missing-glyph boxes.
- **Blind back-translation**, 40 strings per language (24 safety): 38 same, 1 close, 1 differs (the read-back reversed "from Houayxay"; the Chinese was then reworded). Same model translated and read back, English in context: a consistency check only. The zh-TW sample reuses the zh-CN read-back.
- All guards in CLAUDE.md pass, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice` and `jsc -m scripts/validate-jsc.mjs`.

## Not done / known issues
- No native reader has seen either language (decision 6). Check first: first-aid doses and technique lines, species names (some are best-effort), Thai/Lao/Khmer place names, and zh-TW wording (rule-derived).
- Composed strings and some labels still show English ("In Thailand:" on Emergency). Not checked in WebKit.
- 9 languages still hold their `null` entries and this slice's keys, shown as English: cs id ms nl pl sv tl tr uk (L2c-3).

## Open decisions (need the user)
None open. Merging PR 159 is the owner's step once CI is green.

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2c-3: cs, id, ms, nl, pl, sv, tl, tr, uk, stacked on the merged tip of PR 159. Same method as L2c-2 and L2c-2b: harvest with `lang-check.py --strings` against a server started from the worktree (confirm its cwd and version), batches through `apply-strings.py` (`LC_HOST=...`; consider splitting the nine into two or three sessions, 975 strings per language is the cost driver), the missed keys from a host language's key list, `safety-text.py` (add the names to `NAMES`) and `--set data`, the 10 older `null` entries by hand, back-translation samples, 375 px screenshots, version bump.
> Done when: the F5 check shows 0 untranslated interface strings in each on every route, no clipping, overflow or missing glyphs, all guards pass. Out of scope: native review, local languages (L3, L4).
