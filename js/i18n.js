// Site-wide interface language.
//
// WHY THIS SHAPE. Mekonging is ~22k lines of hand-written vanilla DOM code in which every
// label is a literal English string at its call site. Retrofitting a `t('key')` call around
// each of those thousands of literals would be an enormous, high-risk edit for zero user
// benefit over what this module does instead: translate the finished DOM.
//
// Every screen in the app is built and handed to `mount()` (js/main.js), which is the single
// choke point through which all rendering passes. After the tree is in place we walk it once
// and swap any text node or user-visible attribute whose EXACT English text is a key in the
// active language's dictionary. Consequences worth stating plainly:
//
//   * Coverage grows by adding dictionary rows — never by editing render code. A screen this
//     module has never heard of still gets translated the moment its strings are added.
//   * User-generated content is safe BY CONSTRUCTION: a journal entry or a place note will
//     never exactly match a UI dictionary key, so it is never touched.
//   * Native-script content is protected by the `lang` attribute the app already sets on
//     phrase text (`lang="th-TH"` and friends) — see inForeignScript() below.
//
// Dictionaries are BUNDLED (js/data/ui-strings.js), not fetched. This is the offline-first
// contract the rest of the app keeps, and it obeys the project rule that anything the UI
// needs in order to be usable must be self-hosted rather than pulled from a CDN.

import { store, save } from './state.js';
import { UI_STRINGS } from './data/ui-strings.js';

// ---- the language registry --------------------------------------------------
// `code`   BCP-47-ish tag used as our own key, in `<html lang>`, and (unless `trans`
//          overrides it) as the translation-service language code.
// `native` the language's name IN that language — the only label a speaker who cannot read
//          English can actually use to find their own row in the picker.
// `dir`    'rtl' for right-to-left scripts; drives `<html dir>` and the RTL CSS block.
// `speech` BCP-47 locale for SpeechRecognition (Talk's 🎤 input) and speechSynthesis.
// `ui`     true once a bundled interface dictionary exists for it. Languages without one
//          still work as a Talk *source* language (the translation service does that work),
//          they simply cannot repaint the interface yet.
//
// The list is ordered by how many Mekong-region travellers it actually serves: the four host
// languages first (a local helping a traveller read the screen is the single highest-value
// case), then the largest inbound visitor markets for Thailand/Vietnam/Cambodia/Laos, then
// the remaining world languages by number of speakers.
export const LANGS = [
  { code: 'en',    name: 'English',               native: 'English',           flag: '🇬🇧', dir: 'ltr', speech: 'en-US', ui: true },

  // --- the four host countries -------------------------------------------------
  { code: 'th',    name: 'Thai',                  native: 'ไทย',                flag: '🇹🇭', dir: 'ltr', speech: 'th-TH', ui: true },
  { code: 'vi',    name: 'Vietnamese',            native: 'Tiếng Việt',         flag: '🇻🇳', dir: 'ltr', speech: 'vi-VN', ui: true },
  { code: 'km',    name: 'Khmer',                 native: 'ភាសាខ្មែរ',            flag: '🇰🇭', dir: 'ltr', speech: 'km-KH', ui: true },
  { code: 'lo',    name: 'Lao',                   native: 'ພາສາລາວ',            flag: '🇱🇦', dir: 'ltr', speech: 'lo-LA', ui: true },

  // --- largest inbound visitor markets for the region --------------------------
  { code: 'zh-CN', name: 'Chinese (Simplified)',  native: '简体中文',            flag: '🇨🇳', dir: 'ltr', speech: 'zh-CN', ui: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文',            flag: '🇹🇼', dir: 'ltr', speech: 'zh-TW', ui: true },
  { code: 'ms',    name: 'Malay',                 native: 'Bahasa Melayu',      flag: '🇲🇾', dir: 'ltr', speech: 'ms-MY', ui: true },
  { code: 'id',    name: 'Indonesian',            native: 'Bahasa Indonesia',   flag: '🇮🇩', dir: 'ltr', speech: 'id-ID', ui: true },
  { code: 'ko',    name: 'Korean',                native: '한국어',              flag: '🇰🇷', dir: 'ltr', speech: 'ko-KR', ui: true },
  { code: 'ja',    name: 'Japanese',              native: '日本語',              flag: '🇯🇵', dir: 'ltr', speech: 'ja-JP', ui: true },
  { code: 'hi',    name: 'Hindi',                 native: 'हिन्दी',               flag: '🇮🇳', dir: 'ltr', speech: 'hi-IN', ui: true },
  { code: 'ru',    name: 'Russian',               native: 'Русский',            flag: '🇷🇺', dir: 'ltr', speech: 'ru-RU', ui: true },

  // --- explicitly requested European languages ---------------------------------
  { code: 'fr',    name: 'French',                native: 'Français',           flag: '🇫🇷', dir: 'ltr', speech: 'fr-FR', ui: true },
  { code: 'es',    name: 'Spanish',               native: 'Español',            flag: '🇪🇸', dir: 'ltr', speech: 'es-ES', ui: true },
  { code: 'de',    name: 'German',                native: 'Deutsch',            flag: '🇩🇪', dir: 'ltr', speech: 'de-DE', ui: true },

  // --- right-to-left ------------------------------------------------------------
  { code: 'he',    name: 'Hebrew',                native: 'עברית',              flag: '🇮🇱', dir: 'rtl', speech: 'he-IL', ui: true },
  { code: 'ar',    name: 'Arabic',                native: 'العربية',             flag: '🇸🇦', dir: 'rtl', speech: 'ar-SA', ui: true },
  { code: 'fa',    name: 'Persian',               native: 'فارسی',              flag: '🇮🇷', dir: 'rtl', speech: 'fa-IR', ui: true },
  { code: 'ur',    name: 'Urdu',                  native: 'اردو',               flag: '🇵🇰', dir: 'rtl', speech: 'ur-PK', ui: true },

  // --- remaining world languages by speakers ------------------------------------
  { code: 'pt',    name: 'Portuguese',            native: 'Português',          flag: '🇵🇹', dir: 'ltr', speech: 'pt-PT', ui: true },
  { code: 'it',    name: 'Italian',               native: 'Italiano',           flag: '🇮🇹', dir: 'ltr', speech: 'it-IT', ui: true },
  { code: 'nl',    name: 'Dutch',                 native: 'Nederlands',         flag: '🇳🇱', dir: 'ltr', speech: 'nl-NL', ui: true },
  { code: 'pl',    name: 'Polish',                native: 'Polski',             flag: '🇵🇱', dir: 'ltr', speech: 'pl-PL', ui: true },
  { code: 'tr',    name: 'Turkish',               native: 'Türkçe',             flag: '🇹🇷', dir: 'ltr', speech: 'tr-TR', ui: true },
  { code: 'uk',    name: 'Ukrainian',             native: 'Українська',         flag: '🇺🇦', dir: 'ltr', speech: 'uk-UA', ui: true },
  { code: 'cs',    name: 'Czech',                 native: 'Čeština',            flag: '🇨🇿', dir: 'ltr', speech: 'cs-CZ', ui: true },
  { code: 'sv',    name: 'Swedish',               native: 'Svenska',            flag: '🇸🇪', dir: 'ltr', speech: 'sv-SE', ui: true },
  { code: 'bn',    name: 'Bengali',               native: 'বাংলা',              flag: '🇧🇩', dir: 'ltr', speech: 'bn-BD', ui: true },
  { code: 'tl',    name: 'Filipino',              native: 'Filipino',           flag: '🇵🇭', dir: 'ltr', speech: 'fil-PH', ui: true },
];

export const LANG_BY_CODE = Object.fromEntries(LANGS.map((l) => [l.code, l]));

// The code to hand the translation service. Identical to `code` for every language we carry
// today; kept as a seam so a service that spells one of them differently needs a one-line
// registry change rather than edits at the call sites.
export function transCode(code) {
  const l = LANG_BY_CODE[code];
  return (l && l.trans) || code;
}

// Languages that can repaint the interface (a bundled dictionary exists).
export function uiLangs() { return LANGS.filter((l) => l.ui); }

// ---- the active interface language ------------------------------------------
const FALLBACK = 'en';

// First-run guess from the browser's own language preferences, so a Spanish phone opens in
// Spanish without the traveller having to find the flag first. Matches the most specific tag
// we carry ('zh-TW' before 'zh'), and only ever returns a language we can actually paint.
export function detectPreferredLang() {
  const prefs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (const raw of prefs) {
    if (!raw) continue;
    const tag = String(raw);
    const exact = LANG_BY_CODE[tag];
    if (exact && exact.ui) return exact.code;
    // 'zh-Hant-TW' / 'zh-TW' → Traditional; any other Chinese → Simplified.
    if (/^zh/i.test(tag)) return /hant|tw|hk|mo/i.test(tag) ? 'zh-TW' : 'zh-CN';
    const base = tag.split('-')[0].toLowerCase();
    const hit = LANGS.find((l) => l.ui && l.code === base);
    if (hit) return hit.code;
  }
  return FALLBACK;
}

export function uiLang() {
  const c = store.profile && store.profile.prefs && store.profile.prefs.uiLang;
  return (c && LANG_BY_CODE[c]) ? c : FALLBACK;
}

export function uiLangMeta() { return LANG_BY_CODE[uiLang()] || LANG_BY_CODE[FALLBACK]; }
export function isRTL() { return uiLangMeta().dir === 'rtl'; }

// Persist a choice. Callers re-render afterwards; this deliberately does NOT render itself so
// it stays usable from Settings, the topbar picker, and first-run onboarding alike.
export function setUiLang(code) {
  if (!LANG_BY_CODE[code]) return false;
  store.profile.prefs.uiLang = code;
  save();
  applyDocLang();
  return true;
}

// Mirror the active language onto <html>, which is what makes screen readers pick the right
// voice, lets the RTL CSS block engage, and gives the browser correct hyphenation.
export function applyDocLang() {
  if (typeof document === 'undefined') return;
  const l = uiLangMeta();
  const root = document.documentElement;
  root.setAttribute('lang', l.code);
  root.setAttribute('dir', l.dir);
}

// ---- dates, times and numbers -----------------------------------------------
// Locales whose DEFAULT numbering system is not Latin digits. Month and weekday names should
// absolutely localise, but the digits should not: a traveller reads a date or a fare in order
// to match it against what is printed on a ticket, a timetable or a price board, and Arabic-
// Indic or Devanagari digits make that comparison harder rather than easier. The `-u-nu-latn`
// extension keeps the names localised and the numerals Latin.
const NON_LATIN_DIGITS = new Set(['ar', 'fa', 'ur', 'bn', 'hi']);

// The locale to hand toLocaleDateString / toLocaleTimeString / Intl.NumberFormat.
//
// These were all called with `undefined`, which means the BROWSER's locale — so a traveller
// who set the app to Japanese still read English weekday names, because their phone was bought
// in London. Passing the chosen interface language instead is what makes "Tue, 25 Aug" follow
// the flag along with everything else, and it costs no dictionary entries: the platform
// already carries every month and weekday name for all 29 languages.
export function dateLocale() {
  const c = uiLang();
  return NON_LATIN_DIGITS.has(c) ? `${c}-u-nu-latn` : c;
}

// ---- string lookup ----------------------------------------------------------
function dict() {
  const c = uiLang();
  return c === FALLBACK ? null : (UI_STRINGS[c] || null);
}

// Translate one English UI string. Returns the English unchanged when the active language has
// no entry for it — a missing translation must degrade to readable English, never to a blank
// or a raw key.
export function t(en) {
  const d = dict();
  if (!d) return en;
  return d[en] || en;
}

// ---- the DOM pass -----------------------------------------------------------
// Elements whose text is markup, code, or a control's own value rather than prose.
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'SVG', 'svg']);

// User-visible attributes worth translating. `value` is deliberately absent: on a text input
// it is the traveller's own typed content, and rewriting it would destroy their input.
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'aria-placeholder'];

// True when this element sits inside something explicitly marked as "leave alone": either a
// `lang` attribute (the app tags native phrase text that way, e.g. lang="km-KH" — translating
// it would replace real Khmer with a translation OF the English gloss) or an opt-out hook.
// The scan stops at <html>, whose `lang` is the active UI language and must not disable
// everything beneath it.
function inForeignScript(el) {
  for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
    if (n.hasAttribute && (n.hasAttribute('lang') || n.hasAttribute('data-no-i18n'))) return true;
  }
  return false;
}

// Swap a text node's content while preserving the whitespace either side of it, so inline
// runs like `[' · ', span, ' · ']` keep their spacing after translation.
function swapText(node, translated) {
  const raw = node.nodeValue;
  const lead = raw.match(/^\s*/)[0];
  const tail = raw.match(/\s*$/)[0];
  node.nodeValue = lead + translated + tail;
}

// A great many labels in this app are written as "<emoji> <label>" — '🍜 Food & drink',
// '⚡ Quick access', '🇹🇭 Thailand'. Keying those verbatim would mean a second dictionary row
// for every icon variant of the same words, and — worse — it fails SILENTLY: 'Food & drink'
// translates, '🍜 Food & drink' does not, so one screen ends up half in the reader's language.
// So the emoji is split off, the words alone are looked up, and the emoji is put back. Emoji
// are language-neutral, which is exactly why this is safe to do generically.
//
// Deliberately anchored and single-run: only a LEADING pictographic run followed by
// whitespace. A string that merely contains an emoji is left alone, because the words either
// side of it are not necessarily a phrase the dictionary knows.
const LEAD_EMOJI = /^([\p{Extended_Pictographic}‍️⃣\p{Regional_Indicator}＋+]+)(\s+)(.+)$/u;

// Look a string up directly, then — failing that — as "<emoji> <label>".
function lookup(d, s) {
  const direct = d[s];
  if (direct) return direct;
  const m = LEAD_EMOJI.exec(s);
  if (!m) return null;
  const inner = d[m[3]];
  return inner ? m[1] + m[2] + inner : null;
}

// Translate every known string inside `root`. Cheap enough to run on every render: a single
// TreeWalker plus a Map hit per node. Safe to call twice on the same tree — a translated
// string is no longer a dictionary key, so the second pass is a no-op.
export function translateTree(root) {
  const d = dict();
  if (!d || !root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (inForeignScript(p)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const texts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);
  for (const n of texts) {
    const hit = lookup(d, n.nodeValue.trim());
    if (hit) swapText(n, hit);
  }

  // Attributes: a screen reader reads aria-label, and a placeholder is the only instruction
  // on some inputs, so leaving these in English would strand exactly the users who most need
  // the translation.
  const els = root.querySelectorAll('[placeholder],[aria-label],[title],[alt],[aria-placeholder]');
  for (const el of els) {
    if (inForeignScript(el.parentElement || el)) continue;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const hit = lookup(d, v.trim());
      if (hit) el.setAttribute(a, hit);
    }
  }
}

// ---- optional machine-translation fill --------------------------------------
// The bundled dictionary covers the app's chrome — navigation, controls, headings, safety
// labels. It does not cover every line of long-form editorial prose, and hand-authoring that
// in 20+ languages is not something this project can honestly claim to have verified.
//
// So: an OPT-IN second pass that sends still-untranslated strings to the same translation
// service Talk already uses, caches every result locally forever, and is always labelled to
// the user as machine translation. It is bounded per render, skips anything marked
// `data-no-mt` (verified facts — emergency numbers, prices, visa rules — where a mistrans-
// lation could actively mislead), and does nothing at all when switched off or offline.

const MT_CAP = 40;             // strings translated per render — a hard ceiling on service load
const MT_KEY = 'mk_mt_v1_';    // one localStorage bucket per language
const MT_MAX_ENTRIES = 4000;   // per language, so the cache cannot grow without bound

export function mtEnabled() {
  return !!(store.profile && store.profile.prefs && store.profile.prefs.uiAutoTranslate);
}
export function setMtEnabled(on) {
  store.profile.prefs.uiAutoTranslate = !!on;
  save();
}

function mtLoad(lang) {
  try { return JSON.parse(localStorage.getItem(MT_KEY + lang) || '{}') || {}; }
  catch { return {}; }
}
function mtSave(lang, cache) {
  try {
    const keys = Object.keys(cache);
    if (keys.length > MT_MAX_ENTRIES) {
      // Oldest-first is not knowable from a plain object, so drop the overflow from the front
      // of the current key order. The cache is a convenience, not a source of truth.
      const trimmed = {};
      for (const k of keys.slice(keys.length - MT_MAX_ENTRIES)) trimmed[k] = cache[k];
      cache = trimmed;
    }
    localStorage.setItem(MT_KEY + lang, JSON.stringify(cache));
  } catch { /* quota or private mode — the pass simply stops caching */ }
}

// How many strings are already cached for this language (Settings shows this so the user can
// see the feature has actually banked something, and can clear it).
export function mtCacheSize(lang) { return Object.keys(mtLoad(lang || uiLang())).length; }
export function mtClear(lang) {
  try { localStorage.removeItem(MT_KEY + (lang || uiLang())); } catch { /* noop */ }
}

// Collect the still-English strings in `root`, together with where they came from so a result
// can be written back without re-walking.
function collectUntranslated(root, d, cache) {
  const pending = new Map();   // english -> [{node} | {el, attr}]
  const add = (text, site) => {
    if (!text) return;
    const s = text.trim();
    // Skip anything already handled, anything that is not prose (pure punctuation, digits,
    // a lone emoji), and very long blocks the service would truncate anyway.
    if (!s || s.length > 400) return;
    if (d[s] || cache[s] !== undefined) return;
    if (!/[A-Za-z]{2}/.test(s)) return;
    if (!pending.has(s)) pending.set(s, []);
    pending.get(s).push(site);
  };
  const blocked = (el) => !el || inForeignScript(el) || (el.closest && el.closest('[data-no-mt]'));

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || SKIP_TAGS.has(p.tagName) || blocked(p)) return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) add(n.nodeValue, { node: n });

  for (const el of root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')) {
    if (blocked(el)) continue;
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v) add(v, { el, attr: a });
    }
  }
  return pending;
}

function applyMt(sites, text) {
  for (const s of sites) {
    if (s.node) swapText(s.node, text);
    else if (s.el) s.el.setAttribute(s.attr, text);
  }
}

// Fill in what the bundled dictionary missed. Resolves to the number of strings translated.
// Never throws: a translation service that is rate-limited, blocked, or offline must leave
// the traveller with an English page, not a broken one.
export async function autoTranslateTree(root) {
  if (!mtEnabled() || !root) return 0;
  const lang = uiLang();
  if (lang === FALLBACK) return 0;
  const d = dict() || {};
  const cache = mtLoad(lang);

  const pending = collectUntranslated(root, d, cache);

  // Anything already banked from an earlier visit paints immediately, with no network at all —
  // which is what makes this usable on a Lao SIM with no signal.
  let painted = 0;
  const cachedWalk = (r) => {
    const walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || SKIP_TAGS.has(p.tagName) || inForeignScript(p)) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const hits = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const s = n.nodeValue.trim();
      if (!d[s] && cache[s]) hits.push([n, cache[s]]);
    }
    for (const [n, txt] of hits) { swapText(n, txt); painted += 1; }
    for (const el of r.querySelectorAll('[placeholder],[aria-label],[title],[alt]')) {
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v && !d[v.trim()] && cache[v.trim()]) { el.setAttribute(a, cache[v.trim()]); painted += 1; }
      }
    }
  };
  cachedWalk(root);

  if (!pending.size) return painted;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return painted;

  // Dynamic import so a user who never turns this on never pays for the module.
  let translate;
  try { ({ translate } = await import('./translate.js')); }
  catch { return painted; }

  const jobs = [...pending.entries()].slice(0, MT_CAP);
  let wrote = 0, failures = 0;
  // Three at a time: enough to feel responsive, gentle enough not to trip the free tier's
  // rate limiter (which would poison the whole page rather than one string).
  const queue = jobs.slice();
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      if (failures >= 3) return;   // service is clearly refusing — stop hammering it
      const [en, sites] = queue.shift();
      try {
        const out = await translate(en, transCode(lang), 'en');
        if (out && out.trim() && out.trim() !== en) {
          cache[en] = out.trim();
          applyMt(sites, out.trim());
          wrote += 1;
        }
      } catch { failures += 1; }
    }
  });
  await Promise.all(workers);
  if (wrote) mtSave(lang, cache);
  return painted + wrote;
}
