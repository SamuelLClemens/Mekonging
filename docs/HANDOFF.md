# Handoff, 2026-11-13 (L2c-2 built, PR open; L2c-2b is next)

The previous handoff (L2c-1) is `git show b74943a:docs/HANDOFF.md`. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **L2c-2**, Japanese and Korean: branch `feat/l2c2-ja-ko`, `mk-v0.668.0` (CACHE_VERSION and manifest bumped, 333 files), stacked on the merged tip of PR 157 (`b74943a`). zh-CN and zh-TW split off as **L2c-2b**; L2c-3 (cs id ms nl pl sv tl tr uk) is unchanged.
  - 1,631 interface keys, 374 safety-text keys and 271 safety-data keys in each of ja and ko, machine-made, register `source` core / safety-text / safety-data, **nobody has read them**. The harvest listed 974 English strings; the 278 keys it missed (months, weekdays, `{0}` strings, Emergency fragments) came from the es key list, and the 10 older `null` entries were filled by hand.
  - Register: ja and ko are in `UI_STRING_MACHINE` (`js/data/ui-strings.js`) and `SAFETY_LANGS` (`js/i18n.js`). Not precached, like the other 16.
  - Address: polite (ja です/ます, ko 해요/합쇼 mix of -세요 and -습니다). Glossary kept from the harvest: フレーズ集 / 회화집, 辞書 / 사전, 旅日記 / 여행 일지.
  - **Word order.** `You are near ` / `You are in ` / `near` / `in` are separate nodes before a city name, and both languages put the particle after the city, so they use a label with a colon or dot ("現在地:", "· 近く ·", "현재 위치:", "· 근처 ·"), as bn and hi did. A native reader should look at them.
  - `safety-text.py` knows the names Japanese and Korean (`NAMES`). Two safety-data keys that the L2c-1 key run did not list (the etiquette intro and "read this one") were added to the key file by hand; they are in every other language already.

## Verified
- **F5 check** (`lang-check`, headless Chrome, 375 px, 96 routes each, server started from this worktree on 8782, `/js/main.js` showed `mk-v0.668.0`, `~/Library/Caches/mk-l2c2/final`): `ui` 0, `over` 0, `tight` 0, `CLIPS` 0, `glyph` 0 in ja and ko; `clip` 29 in both, the same 29 boxes that clip in English. `tpl` 648 (ja) and 661 (ko), `data` 4,785 and 5,062.
- **Screenshots** (375 x 812 at DPR 2, `document.hidden` false, `scrollWidth` 375 = `clientWidth` on all 12): home, sos, phrasebook, settings, firstaid, danger in ja and ko, driver `~/Library/Caches/mk-l2c2/tools/shots.py`. Looked at `#sos` in ja and `#firstaid` in ko: kana, kanji and hangul draw, no missing-glyph boxes.
- **Blind back-translation**, 40 strings per language (24 safety), recorded in the register: ja 37 same, 3 close; ko 37 same, 3 close; 0 differ. **The same model made the translations and read them back in one session, with the English in context**: a consistency check, not an independent one.
- All guards in CLAUDE.md pass, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice` and `jsc -m scripts/validate-jsc.mjs`.

## Not done / known issues
- No native reader has seen either language (decision 6 applies to first aid, the dose and technique lines above all). Japanese species names and some Korean ones (for example the mushrooms) are best-effort and should be checked first.
- Composed strings and some labels still show English ("In Thailand:" on Emergency), as in L2c-1. Not checked in WebKit.
- 11 languages still hold their `null` entries and the keys from this slice, shown as English: zh-CN, zh-TW (L2c-2b) and cs id ms nl pl sv tl tr uk (L2c-3).

## Open decisions (need the user)
None open. Merging the L2c-2 PR is the owner's step once CI is green.

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2c-2b: zh-CN and zh-TW, stacked on the merged tip of the L2c-2 PR. Same method as L2c-2: harvest with `lang-check.py --strings` against a server started from the worktree (confirm its cwd and the version), batches through `tools/lang-check/apply-strings.py` (`LC_HOST=zh-CN,zh-TW`), the keys the harvest missed from a host language's key list, `safety-text.py` (add the two names to `NAMES`) and `--set data`, the 10 older `null` entries by hand, back-translation samples, 375 px screenshots with the CJK glyphs checked, version bump.
> Done when: the F5 check shows 0 untranslated interface strings in each on every route, with no clipping, overflow or missing glyphs, and all guards pass. Out of scope: native review, local languages (L3, L4), L2c-3.
