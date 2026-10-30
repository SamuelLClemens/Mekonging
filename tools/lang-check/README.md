# tools/lang-check: the language check (F5)

Loads every route in each of the 29 interface languages and measures what a traveller would meet. It is a developer tool: nothing here ships
(no version bump). `docs/PROGRAM.md` 4.4 and `docs/PLAN.md` (F5) say why it exists; L2 and L4 use it to drive their own `null` counts to 0.

```bash
python3 scripts/serve.py 8751 &                                   # serve the tree (no-cache)
python3 tools/lang-check/lang-check.py --base http://127.0.0.1:8751                       # all 29 languages, every route
python3 tools/lang-check/lang-check.py --lang th,km --route '#sos,#home' --strings        # a slice, and the list of strings to translate
python3 tools/lang-check/lang-check.py --report ~/Library/Caches/mk-lang-check/run-...    # tables for an earlier run
```

One command prints, per language, a table with a row per route, then one summary row per language.

| Column | What it counts |
|---|---|
| `ui` | Fixed interface strings still in English: the screen shows exactly what the English render of that route shows, and the text is a string literal in the app's code (`js/`, not `js/data/`). **This is the number F5 and L2 drive to 0.** |
| `tpl` | Interface strings with a value in them (`6 nights · 4 stops`, `Speak: <phrase>`): they match a template literal in the code, so an exact-match dictionary key cannot hold them. Reported, not counted in the done criterion; a later slice needs a placeholder form for them. |
| `data` | Everything else still in English: place names, editorial text, phrases from `js/data/`. The online pass (`autoTranslateTree`) is what covers these. |
| `clip` | Boxes that hide text they hold (overflow hidden or clamped lines) and have more inside than they show. |
| `over` | Boxes that leave the viewport (375 px; a map's markers and an SVG's clipped outline are skipped). |
| `tight` / `CLIPS` | Thai, Lao, Khmer, Vietnamese: text in a line box too short for stacked marks (1.3 em for Thai and Lao, 1.4 for Khmer, 1.2 for Vietnamese). `CLIPS` = the box also hides its overflow and the measured ink (a zero-size inline-block gives the baseline, `measureText` the extents) falls outside it by more than 0.4 px. |
| `glyph` | Characters the browser draws as the missing-glyph box. Headless Chrome's fonts, not an iPhone's. |
| `wordbrk` / `letbrk` | Thai, Lao, Khmer: lines that break inside a word / inside a letter (`Intl.Segmenter` is the judge). |
| `rtl` | Hebrew, Arabic, Persian, Urdu: text not set right to left, text pinned left (`text-align: left`), tab bar or back button on the wrong side. |
| `mt` | With `--mt`: strings the online machine-translation pass changed on that route (needs a connection). |

Strings that carry a `lang` attribute (native phrase text) or `data-no-i18n` / `data-no-mt` are left out, the same rule `js/i18n.js` applies.

## Rules the numbers depend on
- The page must not be `document.hidden`; the driver refuses a run that is, and keeps the display awake with `caffeinate -d`.
- Every host except `127.0.0.1` is unresolvable (and the two translation hosts with `--mt`), so a result never depends on the network.
- A fresh profile per run: Home, no trip logged, no journal. States that need data (a logged trip, a full journal) are not covered.
- `--checks tight,clip,over` is the fast set (about a third of the time); the `break` and `glyph` checks walk every character.

## WebKit (Safari and every iPhone browser)
Headless Chrome is not WebKit. This machine has Safari 18.6 but no Xcode, no Simulator, and Remote Automation is off (the owner's setting),
so `webkit.swift` is a small Cocoa program around a `WKWebView` that runs the same in-page script and prints the same JSON:

```bash
swiftc -O tools/lang-check/webkit.swift -o ~/Library/Caches/mk-lang-check/webkit-check
~/Library/Caches/mk-lang-check/webkit-check http://127.0.0.1:8751 th '#sos,#home' --checks tight,clip --shots /tmp/wk
```

It uses macOS's fonts, not iOS's, so it shows WebKit's layout and line breaking, not an iPhone's glyph shapes. Measured on the first run
(`#sos`, Thai, before the F5 fix): WebKit cut the tab label "สถานที่" by 3.0 px above and four other labels by 1.0 px; Chrome cut it by 2.3 px.

## Harvesting strings (how F5 filled th, vi, km and lo; L2 and F5b do the same)
1. `lang-check.py --lang th,vi,km,lo --strings` writes `<out>/strings.json`: every fixed interface string still English, keyed the way the dictionaries are
   (a leading emoji or symbol left off; `js/i18n.js` puts it back), in review order: emergency, medical, firstaid, safety, core, talk, then the rest.
   Run it on the languages being filled, not on all 29: a language that still holds only nulls lists every key.
2. `apply-strings.py --keys <out>/strings.json --show 0:60` prints numbered keys. Write a batch as TSV (`n`, the key's first characters, then th, vi, km, lo;
   the prefix proves the number) and run `apply-strings.py BATCH.tsv --keys <out>/strings.json`. It gives each key a value or `null` in all 29 files (a marked
   "F5 harvest" block), writes the machine-made entries into `scripts/ui-strings-review.json` in review order, and `check-ui-strings.py` keeps parity.
3. `backtranslate.py sample LANG` draws 50 strings with the English withheld; translate them back blind into `bt-LANG.back.txt`, run `pairs` to compare, list
   the exceptions in `bt-LANG.verdict.txt` (`n<TAB>close|differs<TAB>note`; the rest count as `same`) and `record`. F5: 200 sampled, 171 same, 29 close, 0 differing.
4. Rerun the check on the routes touched: the string must leave the `ui` column. A string that does not leave has a key that differs from what the screen renders
   (a symbol the app does not strip, or text built from pieces); fix the code or the key, not the check.

## The safety text (F5b)
The Emergency situation guides, the embassy lists, the hospital tags and the first-aid topics are data (`js/data/emergency.js`, `firstaid.js`), about
7,000 words, so they cannot sit in the dictionaries. `safety-text.py` makes their keys (`keys`, in review order: Emergency, then first aid), writes a
batch of `n<TAB>prefix<TAB>th<TAB>vi<TAB>km<TAB>lo` rows into one lazy module per host language, `js/data/safety-text.<code>.js` (`apply`), and the
register (`source: safety-text`). `js/i18n.js` `ensureSafetyText()` loads the file when `#sos`, `#firstaid` or `#hospital` opens in that language
and merges it into the active dictionary. Add a string to either data file and the check in `scripts/check-ui-strings.py` fails until the four
modules hold it (it also fails on a key the data no longer has). `backtranslate.py` samples both kinds (`BT_SINCE=<date>` limits it to new entries).

## Composed strings (F5c)
A string the app builds from parts ("6 nights · 4 stops", "Sources (3)") cannot be an exact key. A dictionary key may hold numbered slots, `{0}`, `{1}`
(`'Sources ({0})': 'แหล่งที่มา ({0})'`); `js/i18n.js` tries the patterns after an exact key fails, carries what a slot caught into the value (a slot that is
itself a key, "Thailand" or "🇹🇭 Thai", is translated), and reads a line joined with " · " part by part. A pattern that opens with a symbol or two fixed words applies to
any text; every other one ("Copy {0}", "Hide {0}") to `aria-label` only, so prose that happens to start the same way is left alone. `check-ui-strings` holds the rules.
- `tpl-list.py ROOT RUN_DIR en` lists, from a run, the composed strings (class `tpl`) with the code template each one came from (several minutes). Many `tpl` strings
  are data that merely fits a loose template (`Explore Koh Chang gives 600 THB`): the list is where to look, not the list of keys to write.
- Keys go in through `apply-strings.py` like any other (`{0}` is part of the key), so they land in the register for review.
- The check cannot see a state it does not set up. F5c found that Emergency and the hospital screen with a GPS fix still showed English the check had called clean;
  `drive-fix.py <base-url> <out-dir> <tree>` sets a fix through `setLastFix` and reads each screen with the in-page `__lc` measurer (env `LANGS`, `ONLY`, `ROUTES`, `SHOT`, `CLASSIFY`).

## Strings that must not change
`KEEP` in `lang-check.py` lists strings every language shows as they are (web addresses, an example e-mail, brand and organisation names, file formats,
a language written in its own name). They are not counted in `ui`.

## What the check cannot say
- It reads English strings, not wrong translations: `ui` = 0 does not mean the wording is right, only that something replaced the English.
- Composed strings (`tpl`) and data text need a different mechanism; see `docs/PROGRAM.md` 4.4 "Language".

## Not covered
Right-to-left layout is measured, not fixed (L2). Screens that need seeded data. Safari on an iPhone (the owner's checklist in `docs/HANDOFF.md`).
