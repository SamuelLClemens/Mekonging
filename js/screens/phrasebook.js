// Phrasebook + Dictionary — extracted from js/main.js as the sixth and final slice of
// task #211's module split (the other five: family, settings, calendar, journal/scrapbook/
// journey, and this one). Deliberately last: this is effectively "Places 2" — the largest
// remaining slice (~800 lines) and the highest fan-in of the six, so it got the same
// verify-every-call-site treatment as the original Places extraction rather than a quick pass.
//
// Exports and why each is exported:
// - phrasebookScreen / dictionaryScreen — the two #phrasebook / #dictionary router targets
//   in main.js's own dispatch switch.
// - scriptLang — called from main.js's dishScreen/eventCard/eventScreen (native-script lang
//   attribute for screen readers), which remain resident in main.js.
// - showBigPhrase — called from main.js's sosScreen ("Show 'I need a hospital' to a local").
// - phraseSlug — reverse-imported by js/screens/places.js (already-shipped; this is the one
//   screen module needing an import-line edit on this extraction, exactly as task #211 flagged).
//
// Fan-in lesson extended once more (see calendar/journal's notes for the earlier two
// directions): allergyPhrasesForProfile's OWN DEFINITION sat ~780 lines after this region
// (in main.js's food/dish-identifier section), yet it moved in here anyway — a full grep
// turned up exactly one caller, essentialsCard below, and that caller is the only one that
// exists anywhere in the app. A helper's proximity to an unrelated section never overrides
// what its call sites actually say. langForCountry (also physically distant, ~3700 lines
// before this region) stayed behind instead, for the opposite reason: it has a third caller
// outside this region (main.js's own dish-identifier code) alongside the two calls in here.
//
// Live-resource note: nothing in this slice owns a media stream, GPS watch, or timer that
// needs setLiveCleanup — the audio-pack download uses the service worker's own message
// channel, not a resource this screen must tear down on navigation. Verified anyway (see the
// shipping commit) since "no cleanup needed" is itself a claim worth confirming, not assuming.

import { store, save, getAudioPacks, hasAudioPack, addAudioPack } from '../state.js';
import { h, debounce } from '../util.js';
// scriptLang, phraseSlug, phraseKey, copyText and the big-phrase overlay live in
// js/phrase-ui.js so that main.js and js/screens/places.js can use them without dragging
// this file's 57 KB of language data into the launch graph. See that file's header.
import { scriptLang, phraseSlug, phraseKey, copyText, showBigPhrase } from '../phrase-ui.js';
import { field, selectEl, openModal, confirmAction, online, netMode, setNetMode, collapsibleCard, screenHint } from '../ui-widgets.js';
import { hasVoiceFor, say, canSay, ttsUrl, setSavedPacks } from '../tts.js';
import { translate } from '../translate.js';
import { LANGS, LANG_BY_CODE, uiLang, transCode, langFlag } from '../i18n.js';
import { LANGUAGES, getLanguage } from '../data/regions.js';
import { ALLERGENS } from '../data/allergens.js';
// Namespace import kept (rather than named imports for every piece) so the moved code below —
// essentialsCard's Diet.PHRASE_PENDING_ALLERGENS and allergyPhrasesForProfile's Diet.PHRASE_KEYS/
// Diet.PHRASE_RX — reads identically to how it read inside main.js; only DIET_LABEL/joinList get
// destructured to bare names, since the moved code references those two without the prefix too
// (main.js does the same destructure locally — see its own `const { ... } = Diet;` line).
import * as Diet from '../data/diet.js';
const { DIET_LABEL, joinList } = Diet;
// Reverse-imports: helpers that stay resident in main.js because they have callers outside
// this file (langForCountry, in main.js's own dish-identifier code; contextNow/
// inferPhase, already reverse-imported the same way by home.js and places.js; focusSpot, the
// same GPS-first/focus-second/activeCountry-last resolver places.js's map uses to pick a
// city — reused here so "what language/country am I in" agrees with "what city is my map on"
// instead of reading the (possibly stale, pre-GPS) activeCountry state directly).
import { go, mount, topbar, langForCountry, contextNow, inferPhase, focusSpot, render, dictionaryName, dictionaryTitle } from '../main.js';

// Re-exported for the modules that historically imported them from here; new callers
// should import from ../phrase-ui.js directly.
export { scriptLang, phraseSlug };

// ---- PHRASEBOOK -------------------------------------------------------------
let phraseQuery = '';
// A "Save audio for offline" card for one phrasebook language. The service worker
// prefetches every phrase's online-TTS clip into a dedicated cache, so playback then
// works with no connection. Returns null when there is nothing to save (e.g. Hmong,
// which has no online voice) or when no SW is available (native wrapper / insecure ctx).
function audioPackControl(code, book) {
  const swOk = ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller;
  const allergy = (ALLERGENS[code] && ALLERGENS[code].length) ? ALLERGENS[code] : [];
  const phrases = book.categories.flatMap((c) => c.phrases).concat(allergy);
  const urls = [...new Set(phrases.map((p) => ttsUrl(p.script, book.locale)).filter(Boolean))];
  if (!urls.length) return null;
  const saved = hasAudioPack(code);
  const mb = (urls.length * 10 / 1024).toFixed(1); // clips average ~10 KB
  const card = h('div', { class: 'card' });
  card.append(h('h3', {}, '🔊 Offline audio'));
  const status = h('p', { class: 'tiny muted' }, saved
    ? `${book.label} pronunciations are saved on this device — 🔊 works with no signal.`
    : `Save ${book.label} pronunciations (${urls.length} clips, ~${mb} MB) so 🔊 works offline — best done on wifi.`);
  card.append(status);
  if (!swOk) {
    card.append(h('p', { class: 'tiny muted' }, 'Add this app to your home screen to save audio for offline use.'));
    return card;
  }
  const btn = h('button', { class: 'btn block btn-spaced' }, saved ? '↻ Re-download audio' : `⤓ Save ${book.label} audio`);
  btn.onclick = () => {
    if (!navigator.serviceWorker.controller) return;
    btn.disabled = true;
    status.textContent = `Downloading ${urls.length} clips…`;
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.lang !== code) return;
      if (d.type === 'TTS_PROGRESS') { status.textContent = `Downloading… ${d.done}/${d.total}`; }
      else if (d.type === 'TTS_DONE') {
        navigator.serviceWorker.removeEventListener('message', onMsg);
        btn.disabled = false;
        if (!d.ok) { status.textContent = 'Could not download audio — check your connection and try again.'; return; }
        addAudioPack(code); setSavedPacks(getAudioPacks());
        status.textContent = d.quotaHit
          ? `Saved ${d.ok} clips before hitting the storage limit — most phrases will play offline.`
          : `Saved ${d.ok} clips — ${book.label} audio now works offline.`;
        if (location.hash.replace(/^#/, '').startsWith('phrasebook')) go(`#phrasebook-${code}`);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TTS', urls, lang: code });
  };
  card.append(btn);
  return card;
}

// ---- personal phrasebook: derived keys + pin / hide -------------------------
// Phrases carry no id, so derive a stable key from lang + category + english text.
function phrasePinsFor(code) { const m = store.profile.prefs.phrasePins || (store.profile.prefs.phrasePins = {}); return m[code] || (m[code] = []); }
function phraseHiddenFor(code) { const m = store.profile.prefs.phraseHidden || (store.profile.prefs.phraseHidden = {}); return m[code] || (m[code] = []); }
function isPhrasePinned(code, key) { return phrasePinsFor(code).includes(key); }
function isPhraseHidden(code, key) { return phraseHiddenFor(code).includes(key); }
function togglePhrasePin(code, key) {
  const a = phrasePinsFor(code);
  const i = a.indexOf(key);
  if (i >= 0) { a.splice(i, 1); }               // unpinning is per-language only — never cascades
  else { a.push(key); propagatePinAcrossLanguages(code, key); }
  save();
}
// Talk redesign: pinning a phrase in one language auto-pins the SAME phrase in every OTHER
// language too, wherever a matching one exists — pin "Friend" in Thai and it is also pinned in
// Lao, Vietnamese, etc. Unpinning never cascades ("unless the user unpins it themselves" —
// see togglePhrasePin above), so each language's pins stay independently editable afterwards,
// and the dictionary keeps every language's saved phrases in its own section (state.js already
// stores phrasePins per language code; this only changes what gets ADDED on a pin).
// Matching is by the phrase's English text (phraseSlug — case/punctuation-insensitive),
// searched across the OTHER language's entire phrasebook regardless of category id: the 8
// phrasebooks do not share one taxonomy (e.g. Lao's "essentials" category covers ground Thai
// splits across "food" and "directions"), so restricting the search to the same category id
// would miss real matches. This is honest, not fabricated, coverage: a phrase worded
// differently across two books (Thai's "Excuse me / Sorry" vs Lao's "Sorry / Excuse me") will
// not cross-match until the wording is aligned — it only pins where the English text is
// genuinely the same phrase, never a guess.
function propagatePinAcrossLanguages(fromCode, key) {
  const parts = key.split('|');
  if (parts.length < 3) return;
  const slug = parts[2];
  for (const otherCode of Object.keys(LANGUAGES)) {
    if (otherCode === fromCode) continue;
    const book = LANGUAGES[otherCode];
    if (!book) continue;
    const allergyCat = (ALLERGENS[otherCode] && ALLERGENS[otherCode].length)
      ? { id: 'allergies', name: 'Allergies & dietary', phrases: ALLERGENS[otherCode] } : null;
    const cats = allergyCat ? book.categories.concat([allergyCat]) : book.categories;
    for (const cat of cats) {
      const match = cat.phrases.find((p) => phraseSlug(p.en) === slug);
      if (match) {
        const otherKey = phraseKey(otherCode, cat.id, match);
        const arr = phrasePinsFor(otherCode);
        if (!arr.includes(otherKey)) arr.push(otherKey);
        break;   // one matching phrase per language is enough
      }
    }
  }
}
// Auto-add-on-search: looking a phrase up yourself is already a strong signal of interest —
// it goes straight into the dictionary without a separate pin tap. Idempotent (never
// unpins) and returns whether it actually added anything new, so a caller can decide
// whether it is worth telling the traveller. Cross-language propagation still applies,
// same as a manual pin.
function ensurePhrasePinned(code, key) {
  const a = phrasePinsFor(code);
  if (a.includes(key)) return false;
  a.push(key);
  propagatePinAcrossLanguages(code, key);
  save();
  return true;
}

// The pin/hide behaviour showBigPhrase cannot own: pinning propagates across every language,
// which needs LANGUAGES and ALLERGENS. Injected here, so the overlay itself stays data-free.
const PHRASE_PINS = { isPinned: isPhrasePinned, togglePin: togglePhrasePin, toggleHide: togglePhraseHide };

// Hiding a phrase also drops it from the pins so the two lists never disagree.
function togglePhraseHide(code, key) {
  const a = phraseHiddenFor(code); const i = a.indexOf(key);
  if (i >= 0) { a.splice(i, 1); } else { a.push(key); const p = phrasePinsFor(code); const j = p.indexOf(key); if (j >= 0) p.splice(j, 1); }
  save();
}
// (Manual reorder — movePhrasePin — used to live here. Removed: the dictionary now sorts
// every saved phrase alphabetically instead of a hand-arranged order, per direct request,
// so a "move up/down" control would silently do nothing. See dictionaryScreen below.)

// --- custom phrases: saved from live translate ("Say it in X"), not the static phrasebook.
// A free-text translation has no category to derive a phraseKey from, so it gets its own
// per-language list (state.js) instead of phrasePins — same key SHAPE though (code|catId|slug,
// with a synthetic 'custom' catId no real category ever uses), so phraseNoteFor/setPhraseNote
// below (keyed by a plain string) work unchanged. Order is display order, oldest first — see
// the dictionary-sorts-alphabetically note above; this list's stored order now only matters
// as an iteration order before that sort, never shown directly.
function customPhrasesFor(code) { const m = store.profile.prefs.customPhrases || (store.profile.prefs.customPhrases = {}); return m[code] || (m[code] = []); }
// Translating something yourself is as strong a signal as searching the phrasebook — auto-
// saved with no separate tap, same spirit as ensurePhrasePinned above. Idempotent by the
// english text typed (re-translating an already-saved phrase never duplicates it); returns
// whether it actually added anything new, so the caller can decide whether to tell the traveller.
function addCustomPhrase(code, en, script) {
  const text = String(en || '').trim();
  if (!text || !script) return false;
  const key = `${code}|custom|${phraseSlug(text)}`;
  const a = customPhrasesFor(code);
  if (a.some((c) => c.key === key)) return false;
  a.push({ key, en: text, script, ts: Date.now() });
  save();
  return true;
}
function removeCustomPhrase(code, key) {
  const a = customPhrasesFor(code);
  const i = a.findIndex((c) => c.key === key);
  if (i >= 0) { a.splice(i, 1); save(); }
}
// --- "My translations": everything translated, whether or not the traveller kept it.
//
// Live translation used to write straight into the dictionary, every time, with no way to
// translate something without keeping it. That made the dictionary useless AS a dictionary — a
// one-off "where is the bus station" typed once at a station sat in it forever, next to the
// phrases the traveller actually chose. The two are now separate stores with separate intents:
//
//   My translations — automatic history. Everything translated lands here and stays readable
//                     OFFLINE, which is the real point: the phrase looked up on hotel wifi is
//                     still there in the market with no signal.
//   Your dictionary — deliberate. Only an explicit "save to my dictionary" tap puts a phrase
//                     there, and only from there does it reach the You section.
//
// ONE record per unique source text, holding EVERY language's script in a single object rather
// than a copy per language. That shape is what makes "save in all languages, show only one"
// cheap: propagateTranslation fills scripts{} in the background, the UI reads scripts[code],
// and promoting a record to the dictionary later costs no network at all, because every
// language's text is already sitting in the record.
const TRANSLATION_CAP = 60;   // bounded — this shares localStorage with the rest of the trip
function translationsList() { const p = store.profile.prefs; return p.translations || (p.translations = []); }
function recordTranslation(text, srcLang, code, script) {
  const en = String(text || '').trim();
  if (!en || !script) return null;
  const key = phraseSlug(en);
  const list = translationsList();
  let rec = list.find((t) => t.key === key);
  if (!rec) {
    rec = { key, en, src: srcLang, ts: Date.now(), scripts: {} };
    list.push(rec);
    // Oldest out first. Anything the traveller actually cared about is in the dictionary by
    // then, and this never touches the dictionary.
    while (list.length > TRANSLATION_CAP) list.shift();
  }
  rec.ts = Date.now();
  rec.scripts[code] = script;
  save();
  return rec;
}
function removeTranslation(key) {
  const list = translationsList();
  const i = list.findIndex((t) => t.key === key);
  if (i >= 0) { list.splice(i, 1); save(); }
}
// Fill in every other language for a record, in the background. Same best-effort contract as
// the pin propagation it replaces: Promise.allSettled, never awaited, so one unsupported
// or rate-limited pair never blocks the others or the translation already on screen. Skips any
// language already present, so re-translating a known phrase costs nothing.
async function propagateTranslation(rec, sourceLang) {
  const targets = Object.keys(LANGUAGES).filter((code) => !rec.scripts[code]);
  if (!targets.length) return;
  await Promise.allSettled(targets.map(async (code) => {
    const script = await translate(rec.en, code, sourceLang);
    if (script) rec.scripts[code] = script;
  }));
  save();
}
// The ONLY path from live translation into the dictionary, and it is always an explicit tap.
// Costs no network: every language's text is already in the record. Returns how many languages
// gained a new entry (addCustomPhrase is idempotent, so a re-save reports 0).
async function saveTranslationToDictionary(rec) {
  let n = 0;
  for (const code of Object.keys(rec.scripts)) {
    if (addCustomPhrase(code, rec.en, rec.scripts[code])) n += 1;
  }
  // Everything above is synchronous, so a caller that does not await this still gets the
  // languages already translated saved before its next line runs. The rest matters when the
  // background propagation has not finished — or the traveller translated, went offline, and
  // saved later: without this, "saved in every language" would quietly mean "saved in one".
  const missing = Object.keys(LANGUAGES).filter((c) => !rec.scripts[c]);
  if (missing.length) {
    await propagateTranslation(rec, rec.src);
    for (const code of Object.keys(rec.scripts)) addCustomPhrase(code, rec.en, rec.scripts[code]);
  }
  return n;
}
function inDictionary(code, text) {
  const key = `${code}|custom|${phraseSlug(text)}`;
  return customPhrasesFor(code).some((c) => c.key === key);
}

// Map every phrase (incl. the allergens category) to its derived key, so pinned/hidden
// keys can be resolved back to the phrase object regardless of which category it lives in.
function phraseIndexFor(categories, code) {
  const idx = new Map();
  for (const cat of categories) for (const p of cat.phrases) idx.set(phraseKey(code, cat.id, p), { p, catId: cat.id });
  return idx;
}
// Personal-dictionary notes: a free-text note the traveller attaches to a saved phrase,
// keyed by the same derived phrase key. Lazily initialised so it self-defaults on old saves.
function phraseNotesMap() { return store.profile.prefs.phraseNotes || (store.profile.prefs.phraseNotes = {}); }
function phraseNoteFor(key) { return phraseNotesMap()[key] || ''; }
function setPhraseNote(key, text) { const m = phraseNotesMap(); const t = String(text || '').trim(); if (t) m[key] = t; else delete m[key]; save(); }

// The compact "as many phrases on one line as possible" chip: same tap-to-show-large
// interaction as a full phraseRow, just dense — used by Essentials (a wall of full rows for
// Hello/Thank you/Friend/Sorry/How much/questions/numbers would be exactly the "overwhelming"
// the traveller asked to avoid). Pin/hide/copy move into the enlarged view (showBigPhrase)
// instead of living on the chip itself; a pinned phrase carries a small 📌 so it stands out
// without needing its own button.
function phraseChip(p, locale, opts) {
  opts = opts || {};
  const { code, catId } = opts;
  const key = (code && catId) ? phraseKey(code, catId, p) : null;
  const pinned = key ? isPhrasePinned(code, key) : false;
  return h('button', {
    class: 'chip phrase-chip' + (pinned ? ' pinned' : ''),
    title: 'Tap to show large' + (pinned ? ' · pinned' : ''),
    onclick: () => showBigPhrase(p, locale, { ...opts, pins: PHRASE_PINS }),
  }, [pinned ? h('span', { class: 'chip-pin-dot', 'aria-hidden': 'true' }, '📌') : null,
      h('b', {}, p.en), ' ', h('span', { lang: locale }, p.script)]);
}

// Map the saved profile to the EXISTING translated allergy phrases (never fabricate a
// safety-critical translation). Returns an ordered, de-duplicated phrase list for `code`,
// always led by the general "I have a food allergy" phrase.
// Relocated from main.js's food/dish-identifier section (~line 5595 pre-extraction) — its
// definition sat far from this region, but a fresh grep found exactly one caller anywhere in
// the app (essentialsCard, directly below), so it moves in rather than staying as a reverse-
// import. See this file's header comment for the fan-in lesson this confirms.
function allergyPhrasesForProfile(code, diet) {
  const list = (ALLERGENS[code] && ALLERGENS[code].length) ? ALLERGENS[code] : [];
  if (!list.length) return [];
  const wanted = ['general'];
  for (const id of (diet || store.profile.prefs.diet || [])) (Diet.PHRASE_KEYS[id] || []).forEach((k) => wanted.push(k));
  const out = []; const seen = new Set();
  for (const k of wanted) {
    const rx = Diet.PHRASE_RX[k]; if (!rx) continue;
    const found = list.find((p) => rx.test(p.en));
    if (found && !seen.has(found.en)) { seen.add(found.en); out.push(found); }
  }
  return out;
}

// The "Essentials" fold: the traveller's most-needed phrases, first — Hello, Thank you,
// Friend, Sorry, How much, question words and numbers, as compact wrapping chips (as many
// per line as the screen fits), plus their allergy/diet phrases automatically. A real
// <details> fold now, like every other category — first in the list, but closed by default
// like every other category too (the caller passes `open`, tracked per-language via
// talkCatOpen prefs so a traveller who opens it stays opened). Allergy phrases are the one
// exception to the compact layout: they are exactly what gets shown to a cook, so script +
// roman + note stay directly visible as full rows rather than one tap away, and they come
// from the ALLERGENS module (never fabricated), re-deriving from the saved profile every
// render. onChange() repaints after a pin/hide toggle.
function essentialsCard(code, book, onChange, open) {
  const cats = book.categories;
  const flat = cats.flatMap((c) => c.phrases.map((p) => ({ p, catId: c.id })));
  const find = (rx) => flat.find((x) => rx.test(x.p.en));

  const details = h('details', { class: 'phrase-cat-group essentials-cat', id: 'phrase-cat-essentials', open: open ? '' : null });
  details.append(h('summary', { class: 'phrase-cat-summary' }, '⭐ Essentials'));
  const body = h('div', { class: 'phrase-cat-body' });
  body.append(h('p', { class: 'tiny muted', style: 'margin:2px 0 8px' },
    'Your most-needed phrases, first. Tap one to show it large — pin, hide and copy from there.'));

  const chipsRow = h('div', { class: 'chips phrase-chips' });
  const addChip = (x) => {
    if (!x || isPhraseHidden(code, phraseKey(code, x.catId, x.p))) return;
    chipsRow.append(phraseChip(x.p, book.locale, { code, catId: x.catId, onChange }));
  };
  addChip(find(/^hello/i));
  addChip(find(/^thank you/i));
  addChip(find(/^friend$/i));
  addChip(find(/excuse me|^sorry/i));
  addChip(find(/how much/i));
  const qCat = cats.find((c) => c.id === 'questions');
  if (qCat) qCat.phrases.forEach((p) => { if (!isPhraseHidden(code, phraseKey(code, 'questions', p))) chipsRow.append(phraseChip(p, book.locale, { code, catId: 'questions', onChange })); });
  const nCat = cats.find((c) => c.id === 'numbers');
  if (nCat) nCat.phrases.forEach((p) => { if (!isPhraseHidden(code, phraseKey(code, 'numbers', p))) chipsRow.append(phraseChip(p, book.locale, { code, catId: 'numbers', onChange })); });
  body.append(chipsRow);

  // allergy / diet — automatic, safety-critical, kept as full rows (see header comment above)
  const diet = store.profile.prefs.diet || [];
  const allergy = allergyPhrasesForProfile(code);
  if (allergy.length) {
    body.append(h('p', { class: 'tiny', style: 'margin:8px 0 2px;font-weight:600' },
      '⚠️ ' + (diet.length ? 'Your allergies & diet — show the cook' : 'Food allergy — show the cook')));
    allergy.forEach((p) => body.append(phraseRow(p, book.locale, { code, catId: 'allergies', onChange, noHide: true, essential: true })));
    // Honest gap: some flagged allergens (currently sesame) have no verified phrase in ANY
    // language yet — we never fabricate a safety-critical translation. Say so plainly so the
    // general phrase above is not mistaken for full coverage. This line drops out on its own
    // once a sourced phrase removes the allergen from PHRASE_PENDING_ALLERGENS.
    const pending = diet.filter((id) => Diet.PHRASE_PENDING_ALLERGENS.includes(id))
      .map((id) => (DIET_LABEL[id] || {}).label || id);
    if (pending.length) body.append(h('p', { class: 'warn-note', role: 'note' },
      `No verified ${joinList(pending)} phrase yet — the phrases above do not name ${pending.length > 1 ? 'them' : 'it'}. Show the dish’s red warning, point to it on a menu, or write the word down.`));
    if (!diet.length) body.append(h('button', { class: 'btn ghost block', style: 'margin:4px 0 2px', onclick: () => go('#settings') }, '➕ Set my allergies & diet'));
  } else if (!diet.length) {
    body.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 2px' },
      'Have an allergy? Set it in Settings and your exact phrase appears here automatically.'));
  }

  details.append(body);
  return details;
}

// Talk T2: fold + rank the phrase categories by trip phase and time of day — same shape as
// Places' rankedPlaceBuckets (js/main.js, Places section). Unrecognised ids (e.g. the
// synthetic "allergies" category, or any category id a future book introduces) score 0, so
// the stable sort leaves them in their existing order rather than guessing at them. Emergency
// & health is pulled out and reinserted at a fixed, always-reachable slot — its position must
// never depend on the ranking, since it can be needed regardless of trip phase or time of day.
function rankedPhraseCats(categories, phase, part) {
  const fit = (id) => {
    let s = 0;
    if (phase === 'planning') { if (id === 'basics' || id === 'questions') s += 3; if (id === 'stay') s += 2; }
    // 'arrived' and 'traveling' used to be separate phases with separate boosts here; merged
    // into one 'traveling' boost set (union of both) since they are now one phase.
    else if (phase === 'traveling') { if (id === 'food' || id === 'directions') s += 3; if (id === 'stay' || id === 'tickets' || id === 'market' || id === 'essentials') s += 2; }
    if ((part === 'morning' || part === 'earlyMorning') && (id === 'food' || id === 'essentials' || id === 'tickets')) s += 2;
    if ((part === 'midday' || part === 'afternoon') && (id === 'market' || id === 'directions')) s += 2;
    if ((part === 'evening' || part === 'night') && (id === 'food' || id === 'essentials')) s += 2;
    return s;
  };
  const emergencyCat = categories.find((c) => c.id === 'emergency');
  const rest = categories.filter((c) => c.id !== 'emergency');
  const ranked = rest
    .map((c, i) => ({ c, i, s: fit(c.id) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.c);
  if (emergencyCat) ranked.splice(Math.min(1, ranked.length), 0, emergencyCat);
  return ranked;
}

export function phrasebookScreen(lang) {
  // Auto mode (no explicit lang, no pinned defaultLang) must reflect where the traveller
  // actually is RIGHT NOW, not whatever activeCountry last happened to be set to (which can
  // be stale — e.g. still the boot-time timezone guess if GPS hasn't resolved yet, or the
  // last country the traveller browsed rather than the one they're standing in). focusSpot()
  // already encodes the right priority for this (live GPS fix > last explicit focus city >
  // activeCountry default) — reuse it instead of reading getActiveCountry() directly, so the
  // phrasebook's language agrees with whatever city the map/home screen is showing.
  const code = lang || store.profile.defaultLang || langForCountry(focusSpot().spot.country);
  const book = getLanguage(code);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Phrasebook'));

  // Language + My Dictionary: a compact dropdown replaces the old row of 8 language chips
  // (a wall of buttons to save space on and not overwhelm with), paired with a direct route
  // to the cross-language dictionary — already reachable via You, but one tap closer from here.
  // Leading with the flag, exactly as the "translating from" picker below already does. That
  // one was flagged and this one was not, which is backwards: this is the language the whole
  // screen is about, and it is the one a traveller changes when they cross a border.
  const langSelect = selectEl(
    Object.values(LANGUAGES).map((b) => [b.lang, `${langFlag(b.lang)} ${b.label}`.trim()]), code,
    (val) => { phraseQuery = ''; go(`#phrasebook-${val}`); }, 'Language');
  wrap.append(h('div', { class: 'talk-top-row' }, [
    langSelect,
    h('button', { class: 'btn ghost', onclick: () => go('#dictionary') }, `📖 ${dictionaryTitle()}`),
  ]));

  if (!book) { wrap.append(h('p', { class: 'empty' }, 'Language not available.')); mount(wrap, '#phrasebook'); return; }

  // Repaints the whole screen (pin/hide/reorder all touch several cards at once — the
  // essentials list, "Your pins" and the row itself — so a full repaint is simplest) but
  // keeps the traveller's scroll position, since mount() itself always jumps to the top.
  const repaint = () => {
    const y = window.scrollY;
    phrasebookScreen(code);
    requestAnimationFrame(() => window.scrollTo(0, y));
  };

  // Full category set incl. the allergens-module category (used by the pin index + list).
  const allergyCat = (ALLERGENS[code] && ALLERGENS[code].length)
    ? { id: 'allergies', name: 'Allergies & dietary', phrases: ALLERGENS[code] } : null;
  const categories = allergyCat ? book.categories.concat([allergyCat]) : book.categories;
  const idx = phraseIndexFor(categories, code);

  wrap.append(screenHint('Pin a phrase (📌) to save it to your dictionary in the You section, or hide (✕) ones you do not need.', 'Pinning phrases'));

  // Say-it / live translate needs a live connection end to end — it calls an online
  // translation + speech service, and unlike the phrasebook itself there is no offline
  // fallback for arbitrary typed English. Showing a control that can only fail offline is
  // worse than no control at all, so it renders only when actually online — and, since it is
  // the one thing on this whole screen that truly cannot work without a connection, it leads
  // (right after the header row, before the always-usable search below).
  // A stable host so saving or removing a translation repaints just this card, in place,
  // instead of re-rendering the whole screen and losing the traveller's scroll position.
  const trHost = h('div', {});
  const paintTranslations = () => {
    trHost.innerHTML = '';
    const c = myTranslationsCard(code, book.label, book.locale, paintTranslations);
    if (c) trHost.append(c);
  };
  paintTranslations();
  // ALWAYS render something here. This used to be `if (online())`, which meant the entire
  // Say-it feature — the reason most travellers open Talk — simply was not on the screen for
  // anyone whose network question was unanswered: netMode defaulted to 'ask' and online()
  // read 'ask' as offline, so that was every new install, and the traveller saw a phrasebook
  // and concluded Talk was broken. The default is now on, so that particular cause is gone —
  // but the rule it taught still holds and this still renders unconditionally: a feature that
  // needs a connection must SAY so and offer the switch, never quietly not exist.
  wrap.append(online()
    ? liveTranslateBox(code, book.label, book.locale, paintTranslations)
    : offlineTranslateBox(code, book.label));
  wrap.append(trHost);

  // Talk T3: search box, above the fold, feeding the same renderPhrases()/phraseQuery this
  // always has. A jump-chip row sits right under it — one tap clears any active search and
  // scrolls straight to that category's fold, opening it. Essentials (below) is the "most-
  // needed phrases first" promise — always the first fold in the list (closed by default,
  // like every other category, until the traveller opens it).
  wrap.append(h('h2', { class: 'cat-title' }, 'All phrases'));
  const searchStatus = h('p', { class: 'tiny muted', style: 'margin:2px 0 0;min-height:1.2em' });
  const filterNow = debounce((e) => { phraseQuery = e.target.value; renderPhrases(); }, 120);
  // Searching for a phrase yourself is already a strong enough signal that it belongs in
  // your dictionary — added automatically, no separate pin tap required (the traveller's
  // own request). Debounced much longer than the live filter above: only once typing has
  // actually SETTLED, so pausing mid-word ("h", "he", "hel"…) never pins a wall of
  // one-letter matches — only the phrase(s) the finished query really matches. A bare
  // category-name match (typing "taxi" browses the whole Taxi category) does not count;
  // only phrases the query itself actually matches do.
  const autoPinSettled = debounce((raw) => {
    const q = raw.trim().toLowerCase();
    if (q.length < 2) return;
    let added = 0;
    categories.forEach((cat) => {
      cat.phrases.forEach((p) => {
        const key = phraseKey(code, cat.id, p);
        if (isPhraseHidden(code, key)) return;
        const hit = p.en.toLowerCase().includes(q) || (p.roman || '').toLowerCase().includes(q) || (p.script || '').includes(raw.trim());
        if (hit && ensurePhrasePinned(code, key)) added += 1;
      });
    });
    if (added) {
      searchStatus.textContent = `✓ Added ${added} ${added === 1 ? 'phrase' : 'phrases'} to your dictionary`;
      renderPhrases();
    }
  }, 900);
  const search = h('input', {
    class: 'search', type: 'search', 'aria-label': 'Search', placeholder: `Search ${book.label} phrases…`, value: phraseQuery,
    oninput: (e) => { searchStatus.textContent = ''; filterNow(e); autoPinSettled(e.target.value); },
  });
  wrap.append(search, searchStatus);

  // Every category fold (incl. Essentials) starts CLOSED — the traveller opens what they
  // want, and it stays open only because they opened it. Tracked per language + category so
  // it survives a search, a pin/hide repaint, and returning to this screen later; a category
  // matched by an active search still shows open (otherwise the results would be invisible),
  // but that does not by itself persist as "opened" — only an actual tap on the fold does.
  const catOpenKey = (catId) => `${code}|${catId}`;
  const isCatOpen = (catId) => !!(store.profile.prefs.talkCatOpen || {})[catOpenKey(catId)];
  const setCatOpen = (catId, val) => {
    const map = store.profile.prefs.talkCatOpen || (store.profile.prefs.talkCatOpen = {});
    if (val) map[catOpenKey(catId)] = true; else delete map[catOpenKey(catId)];
    save();
  };

  const phase = store.profile.prefs.phase || inferPhase();
  const part = contextNow().part;
  // A row of "jump to category" chips used to sit here, listing exactly the same eleven
  // categories, in exactly the same order, as the folds immediately below it. It cost 356px
  // at 375px — most of a phone screen — to save a scroll past folds that are all closed and
  // total 718px. Tapping a fold's own summary opens it in one tap, which is what the chip
  // did. Removed as duplication; the folds ARE the category list.

  const listEl = h('div', {});
  wrap.append(listEl);

  function renderPhrases() {
    listEl.innerHTML = '';
    const es = essentialsCard(code, book, repaint, isCatOpen('essentials'));
    // Tracked off the summary's click, not the details' toggle event: a search forcing a
    // fold open below sets the `open` attribute directly, which some browsers still fire a
    // toggle event for — that would wrongly persist a search-driven open as if the traveller
    // had tapped it themselves. A click on the summary only ever happens from a real tap.
    es.querySelector('summary').addEventListener('click', () => setCatOpen('essentials', !es.open));
    listEl.append(es);
    const q = phraseQuery.trim().toLowerCase();
    // Talk T2: folded groups, ranked by trip phase + time of day (rankedPhraseCats). A live
    // search opens every matching fold (so results are actually visible); with no search,
    // every fold starts CLOSED unless the traveller opened it themselves (isCatOpen) —
    // rank/collapse/never-remove applies to ORDER here, not to what exists: every phrase is
    // still one tap away via its fold.
    for (const cat of rankedPhraseCats(categories, phase, part)) {
      // A query matches the whole category when its name matches (so "taxi"
      // surfaces the Taxi & directions phrases), else it matches per phrase.
      const catNameMatch = !q || cat.name.toLowerCase().includes(q);
      const matches = cat.phrases.filter((p) => {
        if (isPhraseHidden(code, phraseKey(code, cat.id, p))) return false;
        return catNameMatch || p.en.toLowerCase().includes(q) || (p.roman || '').toLowerCase().includes(q) || (p.script || '').includes(phraseQuery);
      });
      if (!matches.length) continue;
      const isOpen = q ? true : isCatOpen(cat.id);
      const body = h('div', { class: 'phrase-cat-body' });
      for (const p of matches) body.append(phraseRow(p, book.locale, { code, catId: cat.id, onChange: repaint }));
      // Emergency & health is deliberately reachable regardless of trip phase or time of day
      // (see rankedPhraseCats). The jump row used to mark it with a 🆘 chip carrying class
      // chip-sos — which was styled with var(--coral), a token that is not defined anywhere
      // in the stylesheet, so the colour silently fell back to the ordinary ink and the
      // emphasis never actually shipped. The fold now carries the marker itself, using the
      // group's existing --cat left-border hook and --warn, which IS defined and is contrast
      // checked on every skin. The summary text stays --ink, so nothing here changes a
      // text-contrast ratio.
      const sos = cat.id === 'emergency';
      const det = h('details', {
        class: 'phrase-cat-group' + (sos ? ' phrase-cat-sos' : ''),
        id: `phrase-cat-${cat.id}`, open: isOpen ? '' : null,
      }, [
        h('summary', { class: 'phrase-cat-summary' }, `${sos ? '🆘 ' : ''}${cat.name} · ${matches.length}`),
        body,
      ]);
      // See the Essentials fold above for why this listens on the summary's click rather
      // than the details' toggle event (a search force-opening this fold must not itself
      // count as "the traveller opened it").
      det.querySelector('summary').addEventListener('click', () => setCatOpen(cat.id, !det.open));
      listEl.append(det);
    }
    if (!listEl.children.length) listEl.append(h('p', { class: 'empty' }, 'No phrases match your search.'));
    // Hidden phrases: a collapsible reveal so nothing is lost, only tucked away.
    const hiddenKeys = phraseHiddenFor(code).filter((k) => idx.has(k));
    if (hiddenKeys.length && !q) {
      const det = h('details', { class: 'hidden-reveal' });
      det.append(h('summary', {}, `Hidden phrases (${hiddenKeys.length})`));
      hiddenKeys.forEach((k) => {
        const { p, catId } = idx.get(k);
        const row = phraseRow(p, book.locale, { code, catId, onChange: repaint, noHide: true });
        const restore = h('button', { class: 'speak', 'aria-label': `Restore ${p.en}`, title: 'Restore', onclick: () => { togglePhraseHide(code, k); repaint(); } }, '↩');
        const ctrls = row.querySelector('.phrase-ctrls');
        if (ctrls) ctrls.prepend(restore);
        det.append(row);
      });
      listEl.append(det);
    }
  }
  renderPhrases();

  // --- below the list: offline audio, politeness note ---
  // (Talk T4 — nothing removed, only demoted; the "most-needed first" promise above still
  // covers what a traveller reaches for most, so these are welcome but no longer load-bearing.
  // Say-it/translate used to sit here too — moved above the list, see the top of this
  // function, since it now only ever renders when online. "Phrase of the day" used to sit
  // here too — removed at the traveller's request; every phrase it rotated through is still
  // reachable via Essentials or its own category.)

  // Offline audio pack: download every phrase's online pronunciation so 🔊 works with
  // no signal — essential for Khmer/Lao, which have no device voice on most phones.
  const audioCard = audioPackControl(code, book);
  if (audioCard) wrap.append(audioCard);

  if (book.politenessNote) wrap.append(h('div', { class: 'banner' }, book.politenessNote));
  const voiceOk = hasVoiceFor(book.locale);
  if (!voiceOk) {
    wrap.append(h('div', { class: 'banner' },
      `No ${book.label} voice is installed on this device — tap 🔊 to hear it spoken online (needs internet), or use the romanised pronunciation.`));
  }

  // Last on the screen and closed by default: the phrasebook above gives a traveller
  // sentences to point at, and this gives them some idea what they are looking at.
  wrap.append(languageGuideSection(book));

  mount(wrap, '#phrasebook');
}

// ---- LEARN THE LANGUAGE (closed by default, loaded on demand) ----------------
// A short primer on the language the phrasebook is currently showing: how it sounds, where it
// comes from, how its sentences are built, the handful of rules that change whether a
// traveller is understood, and a first lesson they can use the same afternoon.
//
// Closed by default and NEVER opened automatically. Someone who wants a phrase to point at in
// a market must not have to scroll past an essay to reach it — which is exactly why this sits
// at the very bottom rather than under the language picker.
//
// The content module (js/data/language-guides.js) is 30 KB and is imported only when the
// section is first opened, so it costs nothing to the travellers who never open it. That
// import goes through a retry-busting URL for the reason recorded in js/main.js's screen
// loader: a failed dynamic import is cached PERMANENTLY in the module map against its
// specifier, so a plain retry after a dropped connection would keep failing forever.
let _guideMod = null;
let _guideTries = 0;
async function loadGuides() {
  if (_guideMod) return _guideMod;
  _guideTries += 1;
  _guideMod = await import(`../data/language-guides.js${_guideTries > 1 ? `?retry=${_guideTries}` : ''}`)
    .catch((err) => { _guideMod = null; throw err; });
  return _guideMod;
}

function guideLessonRow(item, locale) {
  // canSay() takes the LOCALE, and returns false immediately when called without one. Calling
  // it bare — as this did — disabled every 🔊 in the lesson, on every language, silently.
  // Every other call site in the app passes it; this was the only one that did not.
  const able = canSay(locale) && !!item.native;
  // A language with no locale at all (Hmong: no device voice and no online voice either) gets
  // no button rather than a permanently dead one. The phrasebook says why in its own banner.
  const speak = locale ? h('button', {
    class: 'speak', 'aria-label': `Speak: ${item.say}`, title: 'Hear it',
    disabled: able ? null : '',
  }, '🔊') : null;
  if (speak) {
    // Same handling as every phrase row above: say() resolves to false when neither the
    // device voice nor the online one could pronounce it, and the button says so instead of
    // appearing to do nothing.
    speak.addEventListener('click', async () => {
      const ok = await say(item.native || item.say, locale);
      if (!ok) { speak.textContent = '🔇'; speak.title = 'Audio unavailable'; setTimeout(() => { speak.textContent = '🔊'; speak.title = 'Hear it'; }, 1500); }
    });
  }
  return h('div', { class: 'phrase lg-lesson' }, [
    h('div', { class: 'lg-lesson-txt' }, [
      h('div', { class: 'lg-say' }, item.say),
      item.native ? h('div', { class: 'lg-native', lang: scriptLang(locale) }, item.native) : null,
      h('div', { class: 'lg-means muted' }, item.means),
      item.note ? h('div', { class: 'lg-note muted' }, item.note) : null,
    ]),
    speak ? h('div', { class: 'phrase-ctrls' }, [speak]) : null,
  ]);
}

function renderGuide(body, guide, sources, locale) {
  body.innerHTML = '';
  body.append(h('p', { class: 'muted lg-intro' }, guide.oneLine));
  guide.sections.forEach((sec) => {
    const inner = h('div', { class: 'lg-body' });
    (sec.body || []).forEach((para) => inner.append(h('p', {}, para)));
    if (sec.tips && sec.tips.length) {
      inner.append(h('ul', { class: 'lg-tips' }, sec.tips.map((t) => h('li', {}, t))));
    }
    (sec.lesson || []).forEach((item) => inner.append(guideLessonRow(item, locale)));
    // data-nofold: these are already the fold. autoFoldSections() must not wrap them again.
    const det = h('details', { class: 'lg-sec', 'data-nofold': '' }, [
      h('summary', {}, [h('span', { 'aria-hidden': 'true' }, `${sec.ic} `), sec.title]),
      inner,
    ]);
    body.append(det);
  });
  // Not sourcesNote(): that helper is shaped for place records and signs off with "Guidance
  // only — verify locally", which is the wrong sentence for a language primer.
  body.append(h('p', { class: 'disclaimer lg-sources' }, [
    'Orientation notes, not a course. To go further: ',
    ...sources.flatMap((src, i) => [
      i ? ', ' : '',
      h('a', { class: 'src-link', href: src.url, target: '_blank', rel: 'noopener' }, src.label),
    ]),
    '.',
  ]));
}

function languageGuideSection(book) {
  const guide = h('details', { class: 'card lg-card', 'data-nofold': '' });
  const sum = h('summary', {}, [
    h('span', { 'aria-hidden': 'true' }, '📚 '),
    `Learn more about ${book.label}`,
  ]);
  const body = h('div', { class: 'lg-wrap' }, h('p', { class: 'muted' }, 'Opening…'));
  guide.append(sum, body);
  let loaded = false;
  guide.addEventListener('toggle', async () => {
    if (!guide.open || loaded) return;
    loaded = true;
    try {
      const mod = await loadGuides();
      const g = mod.languageGuide(book.lang);
      if (!g) {
        body.innerHTML = '';
        body.append(h('p', { class: 'muted' }, `No background notes for ${book.label} yet. The phrasebook above still works.`));
        return;
      }
      renderGuide(body, g, mod.GUIDE_SOURCES, book.locale);
    } catch {
      loaded = false;   // a failed load must be retryable, so let the next open try again
      body.innerHTML = '';
      body.append(h('p', { class: 'muted' }, 'Could not open the notes just now.'),
        h('button', { class: 'btn ghost', onclick: () => { guide.open = false; guide.open = true; } }, 'Try again'));
    }
  });
  return guide;
}

// ---- Personal Dictionary ("My phrases") ------------------------------------
// Every phrase the traveller saved, across all languages, gathered in one place. Built
// from the pins (tap 📌 on any phrase to add it). Each entry can carry a personal note,
// and removal is confirmed — the "add / delete with verification" the user asked for.
// Shared by both dictionary sections (book-pinned phrases and custom live translations):
// the 📝 note editor beneath a saved row, toggled by that row's own note button.
function attachDictNote(card, key, label, noteBtn, repaint) {
  const noteText = phraseNoteFor(key);
  const noteWrap = h('div', { class: 'dict-note-wrap' });
  const disp = h('div', { class: 'dict-note', hidden: noteText ? null : '' }, noteText ? `📝 ${noteText}` : '');
  const ta = h('textarea', { class: 'dict-note-edit', hidden: '', rows: '2', placeholder: 'Your note — e.g. “say it softly”, “use with elders”', 'aria-label': `Note for ${label}` });
  ta.value = noteText;
  const saveNote = h('button', { class: 'btn ghost dict-note-save', hidden: '', onclick: () => { setPhraseNote(key, ta.value); repaint(); } }, 'Save note');
  noteBtn.addEventListener('click', () => {
    const hidden = ta.hasAttribute('hidden');
    if (hidden) { ta.removeAttribute('hidden'); saveNote.removeAttribute('hidden'); ta.focus(); }
    else { ta.setAttribute('hidden', ''); saveNote.setAttribute('hidden', ''); }
  });
  noteWrap.append(disp, ta, saveNote);
  card.append(noteWrap);
}

// A saved live-translation ("Say it in X") row in the dictionary — same look as a book
// phraseRow (en / native script / speak / copy) but its own remove control, since it lives in
// customPhrases, not the book's pin/hide system phraseRow's controls are wired to. No roman
// line (the translate service returns script text only, never a transliteration). No
// reorder control — the dictionary is sorted alphabetically now, so entries never need one.
function customPhraseRow(code, entry, locale, repaint) {
  const able = canSay(locale);
  const grow = h('div', { class: 'grow tappable', role: 'button', tabindex: '0', 'aria-label': `Show large: ${entry.en}`, title: 'Tap to show large to a local' }, [
    h('div', { class: 'en' }, entry.en),
    h('div', { class: 'native', lang: locale }, entry.script),
  ]);
  const showLarge = () => showBigPhrase({ en: entry.en, script: entry.script }, locale, {});
  grow.addEventListener('click', showLarge);
  grow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showLarge(); } });
  const copyBtn = h('button', { class: 'speak', 'aria-label': `Copy ${entry.en}`, title: 'Copy the local text', onclick: () => copyText(entry.script, copyBtn) }, '⧉');
  const speakBtn = h('button', { class: 'speak', 'aria-label': `Speak: ${entry.en}`, disabled: able ? null : '' }, '🔊');
  speakBtn.addEventListener('click', async () => {
    const ok = await say(entry.script, locale);
    if (!ok) { speakBtn.textContent = '🔇'; speakBtn.title = 'Audio unavailable'; setTimeout(() => { speakBtn.textContent = '🔊'; }, 1500); }
  });
  const noteBtn = h('button', { class: 'speak', 'aria-label': `Note for ${entry.en}`, title: 'Add or edit a note' }, '📝');
  const rm = h('button', {
    class: 'speak hide', 'aria-label': `Remove ${entry.en}`, title: 'Remove from your phrases',
    onclick: () => {
      confirmAction({ title: 'Remove translation?', body: `Remove “${entry.en}” from your saved phrases?`, confirmLabel: 'Remove', danger: true })
        .then((ok) => { if (ok) { removeCustomPhrase(code, entry.key); repaint(); } });
    },
  }, '🗑');
  return { row: h('div', { class: 'phrase' }, [grow, h('div', { class: 'phrase-ctrls' }, [copyBtn, speakBtn, noteBtn, rm])]), noteBtn };
}

// Which language's dictionary is showing, when more than one has saved phrases — a plain
// module-level variable (same pattern as calSelDate for the calendar's selected day above)
// rather than a stored pref, since it is just a view choice, not trip data worth persisting
// across sessions. Reset to a valid code below whenever the current one no longer has any.
let dictLangSel = null;
export function dictionaryScreen() {
  const wrap = h('div', { class: 'screen' });
  // Named after the traveller once they have given a name, "My dictionary" before that. This
  // used to be the flat word 'Dictionary': the title column was 102px, and both the
  // personalised and the "Your dictionary" forms needed three lines in uppercase, so every
  // traveller read a truncated heading. The column is 120px now and the titles are mixed
  // case, so "Sam’s dictionary" sets on two lines breaking at the space, which is fine.
  wrap.append(topbar(dictionaryTitle(), '#me'));
  const repaint = () => dictionaryScreen();

  const pinsMap = store.profile.prefs.phrasePins || {};
  const langCodes = Object.keys(pinsMap).filter((c) => (pinsMap[c] || []).length);
  const pinTotal = langCodes.reduce((n, c) => n + pinsMap[c].length, 0);

  // Custom phrases: live translations ("Say it in X") the traveller typed and saved
  // themselves — a language can appear here even with zero book-pinned phrases, so the
  // language list below is the UNION of both, not just langCodes.
  const customMap = store.profile.prefs.customPhrases || {};
  const customCodes = Object.keys(customMap).filter((c) => (customMap[c] || []).length);
  const customTotal = customCodes.reduce((n, c) => n + customMap[c].length, 0);
  const allCodes = Array.from(new Set([...langCodes, ...customCodes]));
  const total = pinTotal + customTotal;

  // Translations are kept separately now and only reach this screen on an explicit save, so
  // anything translated and not kept would otherwise be un-findable — a traveller looks for it
  // here, because here is where saved things live. Shown only when there is something to find.
  const unsaved = translationsList().filter((t) => !Object.keys(t.scripts || {}).some((c) => inDictionary(c, t.en)));
  if (unsaved.length) {
    wrap.append(h('p', { class: 'tiny muted mytr-foot' }, [
      `🕘 ${unsaved.length} recent ${unsaved.length === 1 ? 'translation is' : 'translations are'} not saved here · `,
      h('button', { class: 'linklike', onclick: () => go('#phrasebook') }, 'My translations in Talk →'),
    ]));
  }

  if (!total) {
    wrap.append(h('div', { class: 'card', style: 'text-align:center' }, [
      h('div', { style: 'font-size:2.4rem;margin-bottom:6px' }, '📖'),
      h('h2', { style: 'margin:0 0 4px' }, 'No saved phrases yet'),
      h('p', { class: 'muted', style: 'margin:0 0 12px' }, `Open the phrasebook and tap 📌 on any phrase, or translate something in Talk and tap “Save to ${dictionaryName()}”. Build your own pocket dictionary of the words you actually use.`),
      h('button', { class: 'btn block', onclick: () => go('#phrasebook') }, '💬 Browse phrases'),
    ]));
    mount(wrap, '#me');
    return;
  }

  wrap.append(h('p', { class: 'tiny muted', style: 'margin:2px 0 10px' },
    `${total} saved ${total === 1 ? 'phrase' : 'phrases'} across ${allCodes.length} ${allCodes.length === 1 ? 'language' : 'languages'}. Sorted A–Z · tap a line to show it large · 📝 add a note · 🗑 remove.`));

  // More than one language in play: a dropdown picks which one to view, instead of every
  // language's list stacked one after another — per direct request. One language: skip the
  // dropdown entirely and just show it.
  // Default to wherever the traveller actually is (same "auto, overridable" logic the
  // phrasebook's own defaultLang uses), not just whichever language happened to be first in
  // Object.keys() iteration order — falls back to that only when the local language has no
  // saved phrases yet.
  if (!dictLangSel || !allCodes.includes(dictLangSel)) {
    // Same GPS-first resolution as phrasebookScreen's own auto-language, so "My Dictionary"
    // opens on the same language the phrasebook itself would default to right now.
    const hereCode = langForCountry(focusSpot().spot.country);
    dictLangSel = allCodes.includes(hereCode) ? hereCode : allCodes[0];
  }
  if (allCodes.length > 1) {
    wrap.append(field('Language', selectEl(
      allCodes.map((c) => [c, (getLanguage(c) || {}).label || c]),
      dictLangSel,
      (v) => { dictLangSel = v; repaint(); },
      'Choose a language',
    )));
  }
  const codesToShow = allCodes.length > 1 ? [dictLangSel] : allCodes;

  codesToShow.forEach((code) => {
    const book = getLanguage(code);
    if (!book) return;
    const allergyCat = (ALLERGENS[code] && ALLERGENS[code].length)
      ? { id: 'allergies', name: 'Allergies & dietary', phrases: ALLERGENS[code] } : null;
    const categories = allergyCat ? book.categories.concat([allergyCat]) : book.categories;
    const idx = phraseIndexFor(categories, code);
    const keys = phrasePinsFor(code).filter((k) => idx.has(k));
    const customEntries = customMap[code] || [];
    if (!keys.length && !customEntries.length) return;

    // One flat, alphabetical dictionary — book-pinned phrases and the traveller's own live
    // translations merged into a single list sorted by English text, not split into two
    // groups by where each phrase came from, per direct request.
    const merged = [
      ...keys.map((k) => ({ kind: 'book', key: k, ...idx.get(k) })),
      ...customEntries.map((entry) => ({ kind: 'custom', entry, en: entry.en })),
    ].sort((a, b) => (a.p ? a.p.en : a.en).localeCompare(b.p ? b.p.en : b.en, undefined, { sensitivity: 'base' }));

    // Collapsible per direct request — defaults open since it is this screen's whole point,
    // but folds away like every other card group in the app once a traveller wants it out
    // of the way (e.g. after switching languages via the dropdown above). Same nesting as
    // dangerScreen's first-aid entries: a plain .card wraps the pill-styled .filters-collapse
    // <details>, so the pill sits on the card surface rather than the bare page background.
    const dd = h('details', { class: 'filters-collapse dict-lang-d', open: '' }, [
      h('summary', {}, `${book.label} · ${merged.length} ${merged.length === 1 ? 'phrase' : 'phrases'}`),
    ]);
    const inner = h('div', { class: 'dict-lang-inner' });
    merged.forEach((m) => {
      if (m.kind === 'book') {
        const { p, catId, key } = m;
        const row = phraseRow(p, book.locale, { code, catId, onChange: repaint, noHide: true });
        const ctrls = row.querySelector('.phrase-ctrls');
        // In the dictionary the pin is implicit (everything here is saved); replace the
        // instant-unpin 📌 with a confirmed 🗑 remove, and add a note control.
        const pinBtn = ctrls && ctrls.querySelector('.pin');
        if (pinBtn) pinBtn.remove();
        const noteBtn = h('button', { class: 'speak', 'aria-label': `Note for ${p.en}`, title: 'Add or edit a note' }, '📝');
        const rm = h('button', { class: 'speak hide', 'aria-label': `Remove ${p.en}`, title: 'Remove from your phrases', onclick: () => { confirmAction({ title: 'Remove phrase?', body: `Remove “${p.en}” from your saved phrases?`, confirmLabel: 'Remove', danger: true }).then((ok) => { if (ok) { togglePhrasePin(code, key); repaint(); } }); } }, '🗑');
        if (ctrls) ctrls.append(noteBtn, rm);
        inner.append(row);
        attachDictNote(inner, key, p.en, noteBtn, repaint);
      } else {
        const { entry } = m;
        const { row, noteBtn } = customPhraseRow(code, entry, book.locale, repaint);
        inner.append(row);
        attachDictNote(inner, entry.key, entry.en, noteBtn, repaint);
      }
    });
    dd.append(inner);
    wrap.append(h('div', { class: 'card dict-card' }, [dd]));
  });

  wrap.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#phrasebook') }, '💬 Add more from the phrasebook'));
  mount(wrap, '#me');
}

// One phrasebook row: tap the text to show it LARGE to a local; copy and speak controls.
// opts (optional): { code, catId, onChange, noHide, essential } enable pin / hide controls.
function phraseRow(p, locale, opts) {
  opts = opts || {};
  const { code, catId, onChange, noHide, essential } = opts;
  const key = (code && catId) ? phraseKey(code, catId, p) : null;
  const able = canSay(locale);
  const grow = h('div', { class: 'grow tappable', role: 'button', tabindex: '0', 'aria-label': `Show large: ${p.en}`, title: 'Tap to show large to a local' }, [
    h('div', { class: 'en' }, p.en),
    h('div', { class: 'native', lang: locale }, p.script),
    h('div', { class: 'roman' }, [h('span', { class: 'lbl' }, 'say:'), p.roman]),
    p.note ? h('div', { class: 'note' }, p.note) : null,
  ]);
  grow.addEventListener('click', () => showBigPhrase(p, locale, { ...opts, pins: PHRASE_PINS }));
  grow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showBigPhrase(p, locale, { ...opts, pins: PHRASE_PINS }); } });
  const copyBtn = h('button', { class: 'speak', 'aria-label': `Copy ${p.en}`, title: 'Copy the local text', onclick: () => copyText(p.script, copyBtn) }, '⧉');
  const speakBtn = h('button', { class: 'speak', 'aria-label': `Speak: ${p.en}`, disabled: able ? null : '' }, '🔊');
  speakBtn.addEventListener('click', async () => {
    const ok = await say(p.script, locale);
    if (!ok) { speakBtn.textContent = '🔇'; speakBtn.title = 'Audio unavailable'; setTimeout(() => { speakBtn.textContent = '🔊'; }, 1500); }
  });
  const ctrls = [copyBtn, speakBtn];
  if (key) {
    const pinned = isPhrasePinned(code, key);
    const pinBtn = h('button', { class: 'speak pin' + (pinned ? ' on' : ''), 'aria-pressed': pinned ? 'true' : 'false', 'aria-label': (pinned ? 'Unpin ' : 'Pin ') + p.en, title: pinned ? 'Unpin' : 'Pin to top', onclick: () => { togglePhrasePin(code, key); if (onChange) onChange(); } }, '📌');
    ctrls.push(pinBtn);
    if (!noHide) {
      const hideBtn = h('button', { class: 'speak hide', 'aria-label': `Hide ${p.en}`, title: 'Hide from lists', onclick: () => { togglePhraseHide(code, key); if (onChange) onChange(); } }, '✕');
      ctrls.push(hideBtn);
    }
  }
  return h('div', { class: 'phrase' + (essential ? ' essential' : '') }, [grow, h('div', { class: 'phrase-ctrls' }, ctrls)]);
}





// The traveller's own translation history, for the language currently on screen.
//
// Deliberately shows ONE language — the one this screen is set to, which itself follows GPS
// unless the traveller picked one — while every record underneath holds all of them. Printing
// every script for every phrase would be a wall of alphabets nobody on this screen can read;
// the point of translating into all of them is that crossing a border makes the right one
// appear, not that they are all visible at once.
//
// Renders whether or not there is a connection, unlike the translate box above it. That is the
// entire value: the phrase looked up on hotel wifi is the phrase needed in the market with no
// signal, and until now it was only ever reachable online.
function myTranslationsCard(code, label, locale, onChange) {
  const recs = translationsList().filter((t) => t.scripts && t.scripts[code]).sort((a, b) => b.ts - a.ts);
  if (!recs.length) return null;   // nothing to show yet, and Talk is a screen worth keeping short
  const card = h('div', { class: 'card' }, [
    h('h2', {}, `🕘 My translations (${recs.length})`),
    h('p', { class: 'tiny muted mytr-note' },
      `Kept on this device in all ${Object.keys(LANGUAGES).length} languages · showing ${langFlag(code)} ${label}`.replace('  ', ' ')),
  ]);
  const able = canSay(locale);
  for (const t of recs) {
    const script = t.scripts[code];
    const grow = h('div', { class: 'grow tappable', role: 'button', tabindex: '0', 'aria-label': `Show large: ${t.en}`, title: 'Tap to show large to a local' }, [
      h('div', { class: 'en' }, t.en),
      h('div', { class: 'native', lang: locale }, script),
    ]);
    const big = () => showBigPhrase({ en: t.en, script }, locale, {});
    grow.addEventListener('click', big);
    grow.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); big(); } });
    const speakBtn = h('button', { class: 'speak', 'aria-label': `Speak: ${t.en}`, disabled: able ? null : '', onclick: () => say(script, locale) }, '🔊');
    const keepBtn = inDictionary(code, t.en)
      ? h('button', { class: 'speak', disabled: '', title: 'Already in your dictionary', 'aria-label': `${t.en} is already in your dictionary` }, '✓')
      : h('button', { class: 'speak', title: `Save to ${dictionaryName()}`, 'aria-label': `Save ${t.en} to ${dictionaryName()}`, onclick: () => { saveTranslationToDictionary(t); onChange(); } }, '📖');
    const rm = h('button', { class: 'speak hide', title: 'Remove from My translations', 'aria-label': `Remove ${t.en} from My translations`, onclick: () => { removeTranslation(t.key); onChange(); } }, '✕');
    card.append(h('div', { class: 'phrase' }, [grow, h('div', { class: 'phrase-ctrls' }, [speakBtn, keepBtn, rm])]));
  }
  card.append(h('p', { class: 'tiny muted mytr-foot' }, [
    '📖 keeps a phrase for good · ',
    h('button', { class: 'linklike', onclick: () => go('#dictionary') }, 'Open your dictionary →'),
  ]));
  return collapsibleCard(card, 'talkTranslationsOpen', true);
}


// What "Say it in X" looks like without a working connection. Same card, same heading, so the
// feature is visibly THERE and its absence is never mistaken for a broken app.
//
// Two genuinely different reasons land here and they need different words, because only one of
// them has a fix the traveller can apply in this moment: they have switched data off (one tap
// undoes it), or there is no signal where they are standing (nothing to tap; the phrasebook
// below is the answer). The old version could not tell these apart — its condition was
// `netMode() !== 'offline'`, which was written to detect a third state that no longer exists.
function offlineTranslateBox(code, label) {
  const dataOff = netMode() === 'offline';
  const box = h('div', { class: 'card translate-card' }, [
    h('h2', {}, `Say it in ${langFlag(code)} ${label}`.replace('  ', ' ')),
    h('p', { class: 'muted mytr-note' }, dataOff
      ? `You have data switched off, so live translation is off with it. The ${label} phrasebook below works with no connection at all.`
      : `Translating anything you type needs a connection, and there is none right now. The ${label} phrasebook below works without one.`),
    dataOff
      ? h('button', { class: 'btn block', onclick: () => { setNetMode('online'); render(); } }, '📶 Turn data on and translate')
      : null,
    h('p', { class: 'tiny muted mytr-foot' }, `Everything below — the ${label} phrasebook, your dictionary and My translations — works offline either way.`),
  ]);
  return box;
}

// Speak/type-in-English → local-language text + spoken audio. Works with no setup
// (free online service); the offline phrasebook below covers the essentials.
function liveTranslateBox(code, label, locale, onChange) {
  const box = h('div', { class: 'card translate-card' }, [
    h('h2', {}, `Say it in ${langFlag(code)} ${label}`.replace('  ', ' ')),
    h('p', { class: 'muted', style: 'margin-top:0' }, `Type or speak in your language; get the ${label} text and hear it spoken. Needs internet.`),
  ]);
  // The language the traveller is speaking FROM. This used to offer English and Hebrew only,
  // which quietly excluded every other visitor to the region — and they are the majority.
  //
  // Each option leads with the country flag and then the language's OWN name, so the closed
  // control shows a recognisable flag and a speaker who reads no English can still find their
  // row. The default is whatever the app's interface is set to (a phone running in Korean
  // should not make its owner re-pick Korean here), and the choice is remembered separately
  // from the interface language so changing one never silently moves the other.
  const remembered = store.profile.prefs.talkSrcLang;
  const srcDefault = (remembered && LANG_BY_CODE[remembered]) ? remembered : uiLang();
  const srcSel = selectEl(
    LANGS.map((l) => [l.code, `${l.flag} ${l.native}${l.native === l.name ? '' : ` · ${l.name}`}`]),
    srcDefault,
    // syncSrc is declared below; the handler only ever runs on a user interaction, long after
    // this whole function body has finished evaluating.
    (v) => { store.profile.prefs.talkSrcLang = v; save(); syncSrc(); },
  );
  srcSel.setAttribute('aria-label', 'Language you are translating from');
  srcSel.setAttribute('data-no-i18n', '');   // option labels are already in their own language
  // Talk T3: its own class distinct from the phrase-filter '.search' input below it on this
  // same screen — the two were previously visually identical, which caused real confusion
  // during the UX interview (typing a test query into the wrong box).
  const input = h('input', { class: 'search translate-input', type: 'text', placeholder: 'e.g. Where is the bus station?' });
  const out = h('div', { class: 'tr-out', style: 'margin-top:10px' });
  // The input's accessible name has to name the ACTUAL source language, not a hard-coded
  // "English" — a screen-reader user who picked Japanese was previously told they were typing
  // English. Re-run whenever the picker changes.
  const syncSrc = () => {
    const l = LANG_BY_CODE[srcSel.value];
    input.setAttribute('aria-label', l ? `Translate from ${l.name}` : 'Translate from English');
  };
  syncSrc();

  // `alsoSave` is the difference between the two buttons below: both translate and both are
  // remembered in My translations, but only the second one puts the phrase in the dictionary.
  const doTranslate = async (alsoSave) => {
    const text = input.value.trim();
    if (!text) return;
    out.innerHTML = ''; out.append(h('p', { class: 'muted' }, 'Translating…'));
    try {
      const srcLang = transCode(srcSel.value);
      const res = await translate(text, code, srcLang);
      out.innerHTML = '';
      out.append(h('div', { class: 'native', lang: locale, style: 'font-size:23px;line-height:1.35' }, res));
      const able = canSay(locale);
      const speakBtn = h('button', { class: 'btn', disabled: able ? null : '', onclick: () => say(res, locale) },
        able ? '🔊 Hear it' : '🔇 Voice needs internet');
      out.append(speakBtn);
      if (!able) out.append(h('p', { class: 'muted', style: 'margin-bottom:0' }, `No ${label} voice on this device and you are offline — the text above is correct to show.`));
      else say(res, locale);   // best-effort auto-play; the button always works (direct tap)
      // Remembered either way — a local write, nothing leaves the device and nothing reaches
      // the dictionary without the explicit tap.
      const rec = recordTranslation(text, srcLang, code, res);
      // Fire-and-forget: translate it into every OTHER language too, so the phrase is already
      // waiting in whichever country the traveller crosses into next. Not awaited — the
      // translation they asked for is on screen already and must never wait on 12 more calls.
      if (rec) propagateTranslation(rec, srcLang);

      const status = h('p', { class: 'tiny muted mytr-foot' });
      const keep = () => {
        saveTranslationToDictionary(rec);
        status.innerHTML = '';
        status.append('✓ Saved to your dictionary · ',
          h('button', { class: 'linklike', onclick: () => go('#dictionary') }, 'View →'));
        if (onChange) onChange();
      };
      if (rec && alsoSave) keep();
      else if (rec && inDictionary(code, text)) status.textContent = '📖 Already in your dictionary';
      else if (rec) {
        // Translated but not kept. Offer the dictionary anyway — changing your mind after
        // seeing the result should not mean typing it again.
        status.append(h('button', { class: 'linklike', onclick: keep }, `📖 Save to ${dictionaryName()}`),
          ' · kept in My translations below either way');
      }
      out.append(status);
      if (onChange) onChange();
    } catch (err) { out.innerHTML = ''; out.append(h('p', { class: 'muted', style: 'margin-bottom:0' }, err.message)); }
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doTranslate(false); } });

  // Two buttons, because they are two different intentions. Translate is the common one and
  // leads; keeping a phrase forever is the deliberate one and says so in full.
  // All three actions carry the SAME primary style. They used to be a filled Translate, an
  // outlined Speak and an outlined Save, which read as one real button and two secondary
  // ones — but a traveller standing in a market wants whichever of the three fits the moment,
  // and none of them is a lesser action. `.btn` is the sun gradient, which is the inviting one.
  const btn = h('button', { class: 'btn', onclick: () => doTranslate(false) }, 'Translate');
  const saveBtn = h('button', { class: 'btn talk-save', onclick: () => doTranslate(true) }, `📖 Translate & save to ${dictionaryName()}`);
  // Optional voice input via the Web Speech API (Chrome/Edge; hidden where absent).
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let micBtn = null;
  if (SR) {
    micBtn = h('button', { class: 'btn', title: 'Speak instead of typing', 'aria-pressed': 'false' }, '🎤 Speak');
    // A toggle, not a one-way trip. This used to disable itself the moment it started
    // listening, so a traveller who tapped it by accident, or changed their mind, or was
    // standing somewhere too loud to be heard, had no way back — the button sat there saying
    // "Listening…" until the engine timed out on its own. Tapping again now stops it.
    let rec = null;
    const resetMic = () => {
      rec = null;
      micBtn.textContent = '🎤 Speak';
      micBtn.classList.remove('is-listening');
      micBtn.setAttribute('aria-pressed', 'false');
      micBtn.title = 'Speak instead of typing';
    };
    micBtn.addEventListener('click', () => {
      if (rec) { try { rec.stop(); } catch { /* already stopped */ } resetMic(); return; }
      try {
        rec = new SR();
        // Speech recognition needs the full BCP-47 locale of whatever the traveller is
        // actually speaking — taken from the language registry rather than the old
        // Hebrew-or-English guess, which mis-transcribed every other language on the list.
        rec.lang = (LANG_BY_CODE[srcSel.value] || {}).speech || 'en-US';
        rec.interimResults = false; rec.maxAlternatives = 1;
        micBtn.textContent = '🎙 Listening…';
        micBtn.classList.add('is-listening');
        micBtn.setAttribute('aria-pressed', 'true');
        micBtn.title = 'Listening — tap again to stop';
        rec.onresult = (e) => { input.value = e.results[0][0].transcript; doTranslate(false); };
        rec.onerror = resetMic;
        rec.onend = resetMic;
        rec.start();
      } catch { resetMic(); }
    });
  }
  // One grid rather than a row plus a separate block: Translate and Speak share the top line
  // as equal columns, the save button spans both below them, and every gap is the same token.
  // The old layout used `row-between`, which pushed the two apart to the card edges with a
  // hole between them, and then a differently-spaced wrapper for the third — three buttons at
  // three widths with two different gaps.
  const actions = h('div', { class: 'talk-actions' + (micBtn ? '' : ' one-up') },
    [btn, micBtn, saveBtn].filter(Boolean));
  box.append(srcSel, input, actions, out);
  return box;
}
