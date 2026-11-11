# Handoff, 2026-11-11 (L2a built, PR open; L2b is next)

The previous handoff (L1) is `git show 12ac176^2:docs/HANDOFF.md`-era; history lives in git. Every open item lives in `docs/PROGRAM.md` section 4.

## Shipped
- **L2a**, Hebrew, Arabic, Persian, Urdu: branch `feat/l2-languages`, [PR #155](https://github.com/SamuelLClemens/Mekonging/pull/155), `mk-v0.665.0` (CACHE_VERSION and manifest bumped). Open, mergeable, CI had not reported when this was written. Owner rulings of 2026-11-10: L2 is split; **L2a** = he, ar, fa, ur; **L2b** = es, fr, de, pt, it, ru in that order; decision 32 closed as "lazy per language" (it already is).
  - 1,630 interface keys, 374 safety-text keys, 271 safety-data keys in each of the four. Machine-made, register `source` core / safety-text / safety-data, **nobody has read them**.
  - `text-align: left` became `start` in 41 CSS rules and 7 inline styles (`you`, `medical`, `weather`, `explore`, `journal`); LTR is unchanged. The `html[dir="rtl"]` block in `css/style.css` is deliberate.
  - Merged `origin/feat/scaffold-bangkok-slice` (0.664.0) into the branch: the th, vi, km, lo conflicts kept both sides; he, ar, fa, ur got the two new Talk strings (`Refresh to use face to face`, `Updating…`).
  - `tools/lang-check/page.js`: the back-button probe now reads `.topbar .back` (it had picked the language flag).

## Verified
- `lang-check` on he, ar, fa, ur, 96 routes each: `ui` 0, `over` 0, `glyph` 0, `tight` 0, `CLIPS` 0; `clip` 29, 31, 29, 30 against 29 in English (ar +2 and ur +1 not diagnosed); `rtl` 597 before, 0 after (rerun with `--checks rtl,clip,over`; runs in `~/Library/Caches/mk-l2/run-s5*`).
- Blind back-translation, 40 strings per language (24 safety): 153 same, 7 close, 0 differs, recorded in the register. One slip fixed (ar first-aid line lacked "and").
- Headless Chrome over CDP, 375 x 812 at DPR 2, `document.hidden` false, 16 screens (home, sos, phrasebook, settings x 4 languages): `dir` rtl, scrollWidth 375 = clientWidth 375. Driver `~/Library/Caches/mk-l2/tools/shots.py`, images `~/Library/Caches/mk-l2/shots/`.
- Every guard in the CLAUDE.md list passes on the final tree, including `check-cache-version` against `origin/feat/scaffold-bangkok-slice`.

## Not done / known issues
- No native reader has seen any of the four languages (decision 6 applies to first aid).
- Place and service labels from `js/data/` stay English where lang-check counts them as `data` (Urdu Emergency still shows "Tourist Police (English): 1155", "Ambulance / medical: 1669", "In Thailand:"); the online pass covers them.
- fa dates from `Intl` show Western digits while fa prose uses Persian digits.
- The extra `clip` in ar (+2) and ur (+1) is not looked at. Not checked in WebKit for this slice.

## Open decisions (need the user)
None open. (Merging PR #155 is the owner's step once CI is green.)

## Next session prompt
> Read CLAUDE.md and docs/HANDOFF.md. Run /slice for L2b: es, fr, de, pt, it, ru, in that order, after PR #155 has merged (stack on its merged tip). Same method as L2a: harvest with `lang-check.py --strings`, batches through `tools/lang-check/apply-strings.py` (set `LC_HOST`), `safety-text.py` and `--set data`, back-translation samples, 375 px screenshots, version bump.
> Done when: the F5 check shows 0 untranslated interface strings in each of the six on every route, with no clipping, overflow or missing glyphs, and all guards pass. Out of scope: native review, local languages (L3, L4).
