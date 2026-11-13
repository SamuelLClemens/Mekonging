# Handoff, 2026-11-13 (L2c-3c built; L2c-3d is next)

Every open item lives in `docs/PROGRAM.md` section 4. The previous handoff (L2c-3b) is `git show c650fa8:docs/HANDOFF.md`.

## Shipped
- **L2c-3c**, Dutch (`nl`) and Swedish (`sv`): branch `feat/l2c3c-languages`, `mk-v0.672.0` (CACHE_VERSION and manifest bumped, 349 files), cut from the merged tip of PR 161 (`c650fa8`).
  - nl and sv each hold 1,262 new interface values (975 harvested, 277 keys the harvest missed, 10 older `null` entries), 374 safety-text and 271 safety-data, all machine-made and registered (`source` core / safety-text / safety-data). **Nobody has read them.** Both are in `UI_STRING_MACHINE` and `SAFETY_LANGS`. Not precached.
  - Written by hand in one pass, nl and sv side by side, from the L2c-3b key lists. Both use the informal "you" (`je`, `du`). Existing tab names were kept (nl Start/Praten/Jij/Plekken/Verkennen, sv Hem/Prata/JAG/Platser/Utforska). Singular and plural keys have their own wording. Species and skin names are best effort.
  - Identical-to-English safety values reworded: nl `Shocktoestand`, `Cashewboom`, `Gaur (wilde rund)`; sv `Cashewträd`, `Gaur (vildoxe)`; the `Laos ↔ X` crossing titles use an en dash.
  - Labels shortened after the F5 run clipped them at 375 px. nl: `Afdingen`, `Fruit & groente`, `Marktwaren`, `Volgende stop`, `Rittijden`, `Oplichting`, `Toegankelijk`, `Overleven`, `Dagboek, foto's, bewaard`. sv: `Pruta`, `Frukt och grönt`, `Torgvaror`, `Reseplan` (an older value), `Överlevnad`, `Vilken rätt, frukt eller fågel?`, `Inställningar, backup, hjälp`, `Dagbok, foton, sparade platser`. nl `entry` was `ingang` (a door) and is now `inreispunt`.
  - Tooling: `tools/lang-check/lang-check.py` reads `LC_CACHE` (a folder of its own, so two sessions never share a Chrome profile). Batches are in `~/Library/Caches/mk-l2c3c` (outside the repo): `b/*.txt` (`n||nl||sv`), `conv_all.py` (to TSV), `fill_old.py`, `shorten.py`, `bt/`.

## Verified
- **F5 check** (`lang-check`, headless Chrome, 375 px, 96 routes each for en, nl, sv; `document.hidden` false on all; server started from this worktree on 8798, `/js/main.js` showed `mk-v0.672.0`): `ui` 0, `over` 0, `tight` 0, `CLIPS` 0, `glyph` 0 in nl and sv. `clip` on the full run: en 29, nl 43, sv 42; the extra boxes in nl and sv were headings or one-line descriptions (listed above). After shortening, those 17 routes re-measured alone: clip 0 for en, nl and sv. No box clips that English does not. `tpl` 453 nl / 518 sv, `data` about 4,700 each.
- **Blind back-translation**, 40 strings per language (24 safety): nl 36 same, 4 close; sv 39 same, 1 close. The same model translated and read back: a consistency check only.
- All guards in CLAUDE.md pass, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice`, `jsc -m` on each edited JS file and `scripts/validate-jsc.mjs`. The shortened labels were re-measured on the affected routes only; the full F5 run was not repeated.

## Not done / known issues
- No native reader has seen either language (decision 6). Check first: first-aid doses and technique lines, species names, and the shortened labels.
- Composed strings and some labels still show English. Not checked in WebKit.
- 3 languages still hold their `null` entries and these keys, shown as English: tl tr uk.

## Remaining L2c-3 sub-slices (stacked, one per session)
- L2c-3d: tr, uk (different scripts and morphology: check glyphs and expansion at 375 px)
- L2c-3e: tl

## Open decisions (need the user)
None open. Merging this PR is the owner's step once CI is green.

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2c-3d: tr and uk, stacked on the merged tip of the L2c-3c PR (fetch `origin/feat/scaffold-bangkok-slice` first). Same method as L2c-3c: reuse the key lists in `~/Library/Caches/mk-l2c3b/keys` and the English lists in `b/*.en.tsv` and `safety/`; `apply-strings.py` and `safety-text.py` with `LC_HOST=tr,uk` and `LC_WORK` (names are already in `NAMES`); the 10 older `null` entries by hand (`fill_old.py` in `~/Library/Caches/mk-l2c3c`); back-translation sample; register in `UI_STRING_MACHINE` and `SAFETY_LANGS`; version bump; F5 run on a server started from the worktree with `LC_CACHE` set to a folder of its own.
> Done when: F5 shows 0 untranslated interface strings, no clipping beyond English's 29, no overflow or missing glyphs on 96 routes, all guards pass. Out of scope: native review, local languages (L3, L4).
