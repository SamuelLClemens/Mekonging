// Interface translations, keyed by the EXACT English string as it appears at its call site.
//
// HOW THIS IS USED. js/i18n.js walks each rendered screen and swaps any text node or
// user-visible attribute whose trimmed text is a key below. There is no key-naming scheme to
// learn and no render code to touch: to translate a new label, add its English text here.
//
// TWO RULES THAT MATTER MORE THAN COVERAGE
//
//  1. A key must match the source literal CHARACTER FOR CHARACTER, including any leading
//     icon or chevron. The Back button's label is the string '‹ Back', not 'Back', so that
//     is the key. When in doubt, grep for the literal rather than guessing at it.
//
//  2. A GAP MAY BE FILLED BY MACHINE TRANSLATION, BUT IS NEVER PASSED OFF AS CHECKED. (Owner ruling,
//     2026-10-24; this replaces the earlier rule that "an omitted entry is a feature".) Every key
//     exists in all 29 files. A value of `null` means "not translated yet, show English": js/i18n.js
//     treats it exactly like a missing key, so the optional online pass can still fill it. The
//     session that fills a gap may write the translation itself (no new service, key or cost), on
//     two conditions. Each machine-made entry is recorded in scripts/ui-strings-review.json
//     (language, key, machine-made, date) for a later native review, and a language that has any
//     is listed in UI_STRING_MACHINE below, which is what the language picker reads to say
//     "machine-translated, under review". The risk has not changed: a WRONG entry falls back to
//     nothing, it silently misinforms a traveller who cannot check it. So the safety screens
//     (Emergency, first aid, medical) are filled first, a sample of every batch is translated
//     back into English before it ships, and a string that cannot be translated back to the
//     same meaning stays `null`.
//
// PARITY IS CHECKED, NOT ASSUMED. Every language here carries the full key set (a `null` counts as
// carrying it, and check-ui-strings counts the nulls per language). Drift is the
// quiet failure mode of this design — add a key to English and to fifteen blocks but not the
// sixteenth and nothing breaks, it just falls back, so one English word appears mid-sentence
// on a Korean screen and no error is raised anywhere. Run `python3 scripts/check-ui-strings.py`
// after editing this file: it enforces key parity, catches duplicate keys (a JS object literal
// silently keeps only the last one), and flags values left identical to their English key.
//
// Long-form editorial prose (place write-ups, history, scam explainers) is NOT here and is
// not meant to be — hand-translating it into twenty languages is not something this project
// can claim to have verified. The optional machine-translation pass in js/i18n.js covers it
// on demand, cached locally, and always labelled to the user as machine translation.

// ---- WHY THIS FILE NO LONGER HOLDS THE STRINGS ------------------------------
// All 29 dictionaries used to live here in one object, statically imported by
// js/i18n.js — so every traveller downloaded and parsed 162 KB covering 29
// languages in order to read the app in one of them, before the first screen could
// paint. They now live one-per-file in ui-strings.<code>.js and js/i18n.js imports
// only the active language (~5 KB), before the first render so nothing flashes in
// English first. This file keeps the documentation above and the manifest below.
//
// A code listed here MUST have a matching ui-strings.<code>.js, must be marked
// `ui: true` in the LANGS registry in js/i18n.js, and must be listed in sw.js so it
// is available offline. scripts/check-ui-strings.py enforces the first two.
export const UI_STRING_LANGS = [
  'th',
  'vi',
  'km',
  'lo',
  'zh-CN',
  'zh-TW',
  'ms',
  'id',
  'ko',
  'ja',
  'hi',
  'ru',
  'fr',
  'es',
  'de',
  'he',
  'ar',
  'pt',
  'it',
  'nl',
  'fa',
  'ur',
  'pl',
  'tr',
  'uk',
  'cs',
  'sv',
  'bn',
  'tl',
];

// Languages with machine-made entries still waiting for a native review (see rule 2 above). The language
// picker marks each one "machine-translated, under review". scripts/ui-strings-review.json is the register
// behind it, and scripts/check-ui-strings.py fails when the two disagree.
export const UI_STRING_MACHINE = [
  'th',
  'vi',
  'km',
  'lo',
];
