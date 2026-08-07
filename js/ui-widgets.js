// Shared, generic UI primitives used across nearly every screen in main.js — form
// fields, collapsible cards, modal/confirm dialogs, the read-aloud bar, and the
// location/currency pickers. Extracted from main.js to shrink the file every future
// edit has to load. See the plan history for the extraction rationale.

import { h } from './util.js';
import { store, save } from './state.js';
import { speak, stop as stopSpeak } from './tts.js';
import { WEATHER_SPOTS, spotKey, spotsForCountry } from './weather.js';
import { COUNTRIES } from './data/regions.js';

// ---- Read-aloud reader ------------------------------------------------------
// Play/pause long-form text (history, guides, first aid) at a chosen speed. Speech is
// sentence-chunked and chained via the utterance onend, because the native pause/resume is
// unreliable across browsers; chunking gives dependable stop + speed changes. Device voice
// only — rate applies there — so the bar returns null when no device voice exists for the
// locale (never a control that cannot obey the chosen speed). Reads are cancelled on
// navigation via stopAllReaders() in render(). The chosen speed persists in prefs.readRate.
const READ_RATES = [1, 1.25, 1.5, 2];
let readerStops = [];
export function stopAllReaders() { const s = readerStops; readerStops = []; s.forEach((fn) => { try { fn(); } catch { /* noop */ } }); }
function splitSentences(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*(?:\s|$)/g) || [];
}
export function readAloudBar(getText, locale = 'en-US') {
  // Gate on the API existing, NOT on voices being loaded: Chromium returns an empty voice
  // list until 'voiceschanged' fires (often after this first render), so a hasVoiceFor()
  // gate here would wrongly hide the control on a fresh load. Voices are reliably present by
  // the time the user taps play; if a device genuinely lacks the voice, speak() returns false
  // and the reader simply resets (graceful no-op).
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  let rate = READ_RATES.includes(store.profile.prefs.readRate) ? store.profile.prefs.readRate : 1;
  let chunks = [], idx = 0, playing = false, gen = 0;
  const playBtn = h('button', { class: 'btn ghost read-play', 'aria-label': 'Read this aloud' }, '🔊 Read aloud');
  const rateBtn = h('button', { class: 'btn ghost read-rate', 'aria-label': 'Reading speed' }, `${rate}×`);
  const reset = () => { gen += 1; playing = false; idx = 0; stopSpeak(); playBtn.textContent = '🔊 Read aloud'; playBtn.classList.remove('playing'); };
  const next = () => {
    if (!playing) return;
    if (idx >= chunks.length) { reset(); return; }
    const myGen = gen;
    const ok = speak((chunks[idx] || '').trim(), locale, {
      rate,
      onend: () => { if (myGen === gen && playing) { idx += 1; next(); } },
      onerror: () => { if (myGen === gen) reset(); },
    });
    if (!ok) reset();
  };
  playBtn.onclick = () => {
    if (playing) { reset(); return; }
    chunks = splitSentences(getText());
    if (!chunks.length) return;
    idx = 0; playing = true; playBtn.textContent = '⏸ Stop'; playBtn.classList.add('playing');
    next();
  };
  rateBtn.onclick = () => {
    rate = READ_RATES[(READ_RATES.indexOf(rate) + 1) % READ_RATES.length];
    store.profile.prefs.readRate = rate; save();
    rateBtn.textContent = `${rate}×`;
    if (playing) { gen += 1; stopSpeak(); next(); } // re-speak the current sentence at the new speed
  };
  readerStops.push(reset);
  return h('div', { class: 'read-aloud' }, [playBtn, rateBtn]);
}

// Reusable collapsible: a <details>/<summary> pair with the body appended as direct children
// (no wrapper div, so existing CSS that targets the details keeps working). `body` may be a
// node, an array of nodes, or a function returning either (evaluated eagerly here). opts:
// { open } start expanded, { cls } override the default 'filters-collapse' class.
export function foldable(summary, body, opts = {}) {
  const det = h('details', { class: opts.cls || 'filters-collapse' });
  if (opts.open) det.setAttribute('open', '');
  det.append(h('summary', {}, summary));
  const content = typeof body === 'function' ? body() : body;
  (Array.isArray(content) ? content : [content]).forEach((n) => { if (n) det.append(n); });
  return det;
}

// Turn an existing .card node (whose FIRST child is its <h2> heading) into a collapsible card:
// the heading becomes the <summary> and the rest becomes the body, so any hub card can be
// minimised/expanded without rewriting its builder. Open/closed persists under prefs[key] once
// the traveller has actually toggled it; until then it falls back to `defaultOpen` (defaults to
// true, matching every existing caller). Pass `key: null` for a fold with no persistence at all
// (always just `defaultOpen`, e.g. Places' reference cards, which reset closed each visit by
// design). A node with no leading <h2> is returned unchanged.
export function collapsibleCard(node, key, defaultOpen = true) {
  if (!node) return null;
  const head = node.firstElementChild;
  if (!head || head.tagName !== 'H2') return node;
  const det = h('details', { class: (node.className || '') + ' foldcard' });
  const pref = key ? store.profile.prefs[key] : undefined;
  if (pref === undefined ? defaultOpen : pref) det.setAttribute('open', '');
  det.append(h('summary', { class: 'foldcard-sum' }, head.textContent));
  head.remove();
  while (node.firstChild) det.append(node.firstChild);
  if (key) det.addEventListener('toggle', () => { store.profile.prefs[key] = det.open; save(); });
  return det;
}

// Shared modal behaviour for overlay dialogs: close on Escape, keep Tab focus inside the
// dialog, and restore focus to whatever was focused before it opened. `rootEl` is the
// backdrop appended to <body>; the element carrying role="dialog" (rootEl itself or a
// descendant) gets aria-modal and receives initial focus. Returns an idempotent close().
export function openModal(rootEl, onClose) {
  const dialog = rootEl.matches('[role="dialog"]') ? rootEl : (rootEl.querySelector('[role="dialog"]') || rootEl);
  dialog.setAttribute('aria-modal', 'true');
  if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  const prev = document.activeElement;
  const focusables = () => [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
  let closed = false;
  function close() {
    if (closed) return; closed = true;
    document.removeEventListener('keydown', onKey, true);
    rootEl.remove();
    try { if (prev && prev.focus) prev.focus(); } catch { /* noop */ }
    if (onClose) onClose();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) { e.preventDefault(); dialog.focus(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.addEventListener('keydown', onKey, true);
  document.body.append(rootEl);
  setTimeout(() => { const f = focusables(); (f[0] || dialog).focus(); }, 0);
  return close;
}

// Promise-based confirmation built on openModal — the styled, focus-trapped, in-app
// replacement for the native blocking window.confirm. Resolves true on confirm and false on
// cancel / Escape / backdrop tap. opts: { title, body, confirmLabel, cancelLabel, danger }.
export function confirmAction(opts = {}) {
  const { title = 'Are you sure?', body = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = opts;
  return new Promise((resolve) => {
    let close = null, settled = false;
    const done = (val) => { if (settled) return; settled = true; resolve(val); if (close) close(); };
    const backdrop = h('div', { class: 'sheet-backdrop center' });
    const dialog = h('div', { class: 'sheet confirm-card', role: 'dialog', 'aria-label': title }, [
      h('h3', {}, title),
      body ? h('p', { style: 'margin:0 0 14px' }, body) : null,
      h('div', { class: 'confirm-actions' }, [
        h('button', { class: 'btn ghost', onclick: () => done(false) }, cancelLabel),
        h('button', { class: 'btn' + (danger ? ' danger' : ''), onclick: () => done(true) }, confirmLabel),
      ]),
    ]);
    backdrop.append(dialog);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) done(false); });
    close = openModal(backdrop, () => done(false));
  });
}

export function currencySelect(current) {
  return selectEl(['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'CNY', 'MYR', 'ILS', 'THB', 'VND', 'KHR', 'LAK'], current, () => {}, 'Currency');
}

let _fieldSeq = 0;
export function field(labelText, control) {
  // Associate the <label> with its control (programmatic label for screen readers):
  // give the labelable element an id and point the label's `for` at it.
  const target = control && (/^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName || '')
    ? control
    : (control.querySelector && control.querySelector('input, select, textarea')));
  if (target && !target.id) target.id = 'fld-' + (++_fieldSeq);
  return h('div', { class: 'field' }, [h('label', target && target.id ? { for: target.id } : {}, labelText), control]);
}
export function selectEl(options, current, onchange, ariaLabel) {
  const opts = options.map((o) => Array.isArray(o) ? o : [o, o]);
  const attrs = { onchange: (e) => onchange(e.target.value) };
  if (ariaLabel) attrs['aria-label'] = ariaLabel;
  return h('select', attrs,
    opts.map(([val, lbl]) => h('option', { value: val, selected: val === current ? '' : null }, lbl)));
}

export function spotForKey(key) { return WEATHER_SPOTS.find((s) => spotKey(s) === key) || null; }

// A single location dropdown (cities grouped by country) that defaults to the given
// spotKey — used everywhere a traveller picks "where they are" instead of a wall of
// chips. Pass the resolved focus/weather key so it always opens on the current location.
export function locationSelect(currentKey, onChange) {
  const sel = h('select', { class: 'loc-select', 'aria-label': 'Choose your location', onchange: (e) => onChange(e.target.value) });
  COUNTRIES.forEach((c) => {
    const spots = spotsForCountry(c.id);
    if (!spots.length) return;
    sel.append(h('optgroup', { label: `${c.flag} ${c.name}` },
      spots.map((s) => h('option', { value: spotKey(s), selected: spotKey(s) === currentKey ? '' : null }, s.city))));
  });
  return sel;
}

// ---- NETWORK CONSENT -------------------------------------------------------
// The app must never touch mobile data or Wi-Fi without the traveller choosing to.
// online() is the SINGLE gate for every AUTOMATIC fetch (weather, exchange rates); a
// user-initiated action (tapping "refresh", "play a call", a deep link) is its own
// consent and is allowed regardless. 'ask' means we have not asked yet — treat as
// offline until the traveller decides in onboarding or the Home toggle.
export function netMode() { return store.profile.prefs.netMode || 'ask'; }
export function setNetMode(m) { store.profile.prefs.netMode = m; save(); }
export function online() { return netMode() === 'online' && (typeof navigator === 'undefined' || navigator.onLine !== false); }
