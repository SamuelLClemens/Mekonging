# Handoff, 2026-11-13 (L2c-3a built; L2c-3b is next)

Every open item lives in `docs/PROGRAM.md` section 4. The previous handoff (L2c-2b) is `git show c4eb957:docs/HANDOFF.md`.

## Shipped
- **L2c-3a**, Indonesian (`id`) and Malay (`ms`): branch `feat/l2c3a-languages`, `mk-v0.670.0` (CACHE_VERSION and manifest bumped, 341 files), cut from the merged tip of PR 159 (`c4eb957`).
  - Size check: nine languages is about 1,907 entries each (1,262 interface keys, 374 safety-text, 271 safety-data), roughly 17,000 translations. That is more than one session can verify, so L2c-3 is split into stacked sub-slices. This is the first.
  - id and ms each hold 1,262 new interface values (975 harvested, 277 missed keys from the ja key list, 10 older `null` entries by hand), 374 safety-text and 271 safety-data, all machine-made and registered (`source` core / safety-text / safety-data). **Nobody has read them.** Both are in `UI_STRING_MACHINE` and `SAFETY_LANGS`. Not precached.
  - Written by hand in one pass, id and ms side by side (ms is its own text, not derived from id). Species names, some place names and the skin names are best effort.
  - Key lists and drivers are in `~/Library/Caches/mk-l2c3a` (outside the repo, wiped on cache clean): `harvest/` (reused from L2c-2b), `b/*.txt` (the id/ms source text), `conv.py` (`n||prefix||id||ms` to TSV).
  - `NAMES` in `safety-text.py` now holds all nine L2c-3 languages.
  - Identical-to-English safety-data values (country pairs such as Thailand to Laos, and `Gaur`) were reworded (`Thailand–Laos`, `Gaur (sapi liar)`) because the guard refuses an identical value.
  - After the first F5 run, topbar and tab labels that clipped at 375 px were shortened (id: Bantu tawar, Bertahan hidup, Bagikan rute, Daftar periksa, Perhentian berikutnya; ms: Utama for Home, Bantu tawar, Kenali alam, Angkutan, Akses, Kongsi laluan, Senarai semak, Perhentian seterusnya).

## Verified
- **F5 check** (`lang-check`, headless Chrome, 375 px, 96 routes each, `document.hidden` false on all, server from this worktree on 8796, `/js/main.js` showed `mk-v0.670.0`): `over` 0, `tight` 0, `CLIPS` 0, `glyph` 0, `clip` 29 = the 29 boxes that clip in English (compared by selector and offset, 0 extra) in both id and ms. `ui` is 1 in each: `Nice this evening` on `#today-th`. That string only renders in the evening and has no key in any of the 29 languages, so it was left alone rather than add a key to every table; a later slice should add it everywhere. `tpl` 514 (id) and 449 (ms), `data` 4,736 and 4,694.
- **Blind back-translation**, 40 strings per language (24 safety): 40 same in each. Same model translated and read back: a consistency check only.
- All guards in CLAUDE.md pass, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice`, `jsc -m` on each edited JS file and `scripts/validate-jsc.mjs`.

## Not done / known issues
- No native reader has seen either language (decision 6). Check first: first-aid doses and technique lines, species names, ms terms that differ from Indonesian, and the shortened labels (`Utama`, `Angkutan`, `Akses`).
- Malay `Home` was `Laman utama` before and clipped in the tab bar on every route; it is now `Utama`.
- Composed strings and some labels still show English. Not checked in WebKit.
- 7 languages still hold their `null` entries and this slice's keys, shown as English: cs nl pl sv tl tr uk.

## Remaining L2c-3 sub-slices (stacked, one per session)
- L2c-3b: cs, pl
- L2c-3c: nl, sv
- L2c-3d: tr, uk
- L2c-3e: tl

## Open decisions (need the user)
None open. Merging this PR is the owner's step once CI is green.

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2c-3b: cs and pl, stacked on the merged tip of the L2c-3a PR (fetch `origin/feat/scaffold-bangkok-slice` first). Same method as L2c-3a: key lists from the ja key list plus `lang-check.py --strings`; batches of about 200 through `apply-strings.py` (`LC_HOST=cs,pl`, the prefix proves the number), `safety-text.py` (`--set data` too; names are already in `NAMES`), the 10 older `null` entries by hand, back-translation sample, register in `UI_STRING_MACHINE` and `SAFETY_LANGS`, version bump, then the F5 run on a server started from the worktree.
> Done when: F5 shows 0 untranslated interface strings (bar the time-of-day string), no clipping beyond English's 29, no overflow or missing glyphs on 96 routes, all guards pass. Shorten any label that clips at 375 px (topbar titles get about 102 px). Out of scope: native review, local languages (L3, L4).
