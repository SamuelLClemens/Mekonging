// The parts of the phrasebook that the rest of the app needs WITHOUT the phrasebook.
//
// js/screens/phrasebook.js is 57 KB, almost all of it language data, and it was eager for
// three small reasons: main.js wanted scriptLang and showBigPhrase, and js/screens/places.js
// wanted phraseSlug and scriptLang. Four helpers, none of which touch a phrase book, were
// holding 57 KB in the launch graph.
//
// showBigPhrase is the interesting one. It grows Pin and Hide buttons when it is given a
// phrase's code and category, and pinning propagates across every language, which needs the
// language data. That is the coupling that made this look unextractable. But both callers
// outside the phrasebook — main.js's "I need a hospital" card and the medical screen's
// emergency phrases — pass no options at all, so they never reach that branch. So the pin
// behaviour is INJECTED: phrasebook.js hands its own handlers in through opts.pins when it
// calls this, and nobody else does. No hidden registration, no back-import, and the data
// stays where it belongs.
import { h } from './util.js';
import { openModal } from './ui-widgets.js';
import { say, canSay } from './tts.js';

// Map a place/dish/event country to the BCP-47 lang subtag of its script, so screen readers
// announce native text in the right voice instead of the page's English default.
const SCRIPT_LANG = { th: 'th', vi: 'vi', kh: 'km', la: 'lo' };
export function scriptLang(country) { return SCRIPT_LANG[country] || null; }

// Phrases carry no id, so derive a stable key from lang + category + english text.
export function phraseSlug(en) { return String(en).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
export function phraseKey(code, catId, p) { return `${code}|${catId}|${phraseSlug(p.en)}`; }

// Copy text to the clipboard with graceful fallback; flashes a tick on the button.
export function copyText(text, btn) {
  const flash = () => { if (btn) { btn.textContent = '✓'; setTimeout(() => { btn.textContent = '⧉'; }, 1200); } };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(flash, () => {}); return; }
  try { const ta = h('textarea', {}); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); flash(); } catch { /* noop */ }
}

// Full-screen, very large native script to point at a taxi driver / pharmacist / local.
// opts (all optional): { code, catId, onChange, noHide, pins }. `pins` is the injected
// { isPinned, togglePin, toggleHide } trio described above; without it — and without a code
// and catId to build a key from — the overlay is simply Speak / Copy / Close, which is
// exactly what the hospital and emergency-phrase callers want.
export function showBigPhrase(p, locale, opts) {
  opts = opts || {};
  const { code, catId, onChange, noHide, pins } = opts;
  const key = (code && catId) ? phraseKey(code, catId, p) : null;
  const able = canSay(locale);
  const overlay = h('div', { class: 'bigphrase', role: 'dialog', 'aria-label': 'Show to a local' });
  let close = () => overlay.remove();
  overlay.addEventListener('click', () => close());
  const actions = [
    able ? h('button', { class: 'btn', onclick: (e) => { e.stopPropagation(); say(p.script, locale); } }, '🔊 Speak') : null,
    h('button', { class: 'btn ghost', onclick: (e) => { e.stopPropagation(); copyText(p.script); } }, '⧉ Copy'),
  ];
  if (key && pins) {
    const pinned = pins.isPinned(code, key);
    actions.push(h('button', { class: 'btn ghost', onclick: (e) => { e.stopPropagation(); pins.togglePin(code, key); if (onChange) onChange(); close(); } }, pinned ? '📌 Unpin' : '📌 Pin'));
    if (!noHide) {
      actions.push(h('button', { class: 'btn ghost', onclick: (e) => { e.stopPropagation(); pins.toggleHide(code, key); if (onChange) onChange(); close(); } }, '✕ Hide'));
    }
  }
  actions.push(h('button', { class: 'btn ghost', onclick: () => close() }, 'Close'));
  const inner = h('div', { class: 'bigphrase-inner' }, [
    h('div', { class: 'bp-en' }, p.en),
    h('div', { class: 'bp-script', lang: locale }, p.script),
    // Custom live-translated phrases carry no romanisation (the translate service returns
    // script text only) — omit the line rather than show "say:" with nothing after it.
    p.roman ? h('div', { class: 'bp-roman' }, p.roman) : null,
    p.note ? h('div', { class: 'bp-note' }, p.note) : null,
    h('div', { class: 'bp-actions' }, actions),
    h('p', { class: 'muted bp-hint' }, 'Show this screen to a local · tap anywhere to close'),
  ]);
  inner.addEventListener('click', (e) => e.stopPropagation());
  overlay.append(inner);
  close = openModal(overlay);
}
