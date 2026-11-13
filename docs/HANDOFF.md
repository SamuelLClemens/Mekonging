# Handoff, 2026-11-13 (L2c-3b built; L2c-3c is next)

Every open item lives in `docs/PROGRAM.md` section 4. The previous handoff (L2c-3a) is `git show e319451:docs/HANDOFF.md`.

## Shipped
- **L2c-3b**, Czech (`cs`) and Polish (`pl`): branch `feat/l2c3b-languages`, `mk-v0.671.0` (CACHE_VERSION and manifest bumped, 345 files), cut from the merged tip of PR 160 (`aec4225`).
  - cs and pl each hold 1,262 new interface values (975 harvested, 277 keys the harvest missed, 10 older `null` entries), 374 safety-text and 271 safety-data, all machine-made and registered (`source` core / safety-text / safety-data). **Nobody has read them.** Both are in `UI_STRING_MACHINE` and `SAFETY_LANGS`. Not precached.
  - Written by hand in one pass, cs and pl side by side. Species names, place names and the skin names are best effort. Polish uses the "you" form; Czech the formal imperative.
  - Slotted strings avoid declension: a country or language name goes after a colon (`Nemocnice: {0}`) and singular/plural pairs share one number-neutral wording (`Za {0} dn.`).
  - One identical-to-English safety-data value was reworded: cs `Laos – Vietnam`.
  - Labels shortened after the F5 run clipped them at 375 px. cs: `Další zastávka`, `Zpětná vazba`. pl: `Następny przystanek`, `Groźne gatunki`, `Groźne` (was `Niebezpieczne`), `Niemowlę` (was `Z niemowlęciem`).
  - Key lists and batches are in `~/Library/Caches/mk-l2c3b` (outside the repo): `keys/` (the L2c-3a key lists, reused), `b/*.txt` (the cs/pl source text), `conv.py` (`n||cs||pl` to TSV, prefix taken from the key).

## Verified
- **F5 check** (`lang-check`, headless Chrome, 375 px, 96 routes each, `document.hidden` false on all, server from this worktree on 8797, `/js/main.js` showed `mk-v0.671.0`): `over` 0, `tight` 0, `CLIPS` 0, `glyph` 0 in cs and pl. `clip`: en 29, cs 28, pl 29 on the full run. In that run pl `#danger` still clipped `Niebezpieczne`; it was shortened and `#danger` re-measured alone: 0 (en 0). By selector and offset, no box clips that English does not, in either language. `ui` 1 in each: `Nice this evening` on `#today-th` (evening-only, no key in any language; still open). `tpl` 520, `data` 5,010 in each.
- **Blind back-translation**, 40 strings per language (24 safety): cs 36 same, 4 close; pl 37 same, 3 close. The same model translated and read back: a consistency check only.
- All guards in CLAUDE.md pass, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice`, `jsc -m` on each edited JS file and `scripts/validate-jsc.mjs`. The full F5 run was not repeated after the last label edit (`Dangerous`, one word); only `#danger` was re-measured.
- The first two F5 runs crashed with `socket.timeout`: other sessions' Chrome processes held `profile-run-0` and `profile-run-3` in `~/Library/Caches/mk-lang-check`, the same names `lang-check.py` uses. A copy of the driver with `CACHE` pointed at its own folder worked. Worth making `CACHE` an environment variable.

## Not done / known issues
- No native reader has seen either language (decision 6). Check first: first-aid doses and technique lines, species names, Polish phrasing (some lines use the masculine), and the shortened labels.
- Composed strings and some labels still show English. Not checked in WebKit.
- 5 languages still hold their `null` entries and this slice's keys, shown as English: nl sv tl tr uk.

## Remaining L2c-3 sub-slices (stacked, one per session)
- L2c-3c: nl, sv
- L2c-3d: tr, uk
- L2c-3e: tl

## Open decisions (need the user)
None open. Merging this PR is the owner's step once CI is green.

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2c-3c: nl and sv, stacked on the merged tip of the L2c-3b PR (fetch `origin/feat/scaffold-bangkok-slice` first). Same method as L2c-3b: reuse the key lists in `~/Library/Caches/mk-l2c3b/keys` and the English lists in `b/*.en.tsv` and `safety/`; `apply-strings.py` and `safety-text.py` with `LC_HOST=nl,sv`; the 10 older `null` entries by hand; back-translation sample; register in `UI_STRING_MACHINE` and `SAFETY_LANGS`; version bump; F5 run on a server started from the worktree, with the driver's Chrome profile folder not shared with other sessions.
> Done when: F5 shows 0 untranslated interface strings (bar the time-of-day string), no clipping beyond English's 29, no overflow or missing glyphs on 96 routes, all guards pass. Out of scope: native review, local languages (L3, L4).
