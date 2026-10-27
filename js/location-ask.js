// Home's one surface for location (traveller fix F3, 2026-10-27).
//
// Owner ruling, 2026-10-24: ask once; after a yes, track silently on every launch; a refused or
// dismissed request never raises the browser's dialog again, and one banner offers it once more.
// So the browser's dialog is only ever raised by a tap (refreshLocation() in js/main.js), never on
// load, and this module draws what surrounds that tap:
//   * a card for a traveller who was never asked (permission unanswered, dialog never raised);
//   * a banner for one who refused, or swiped the dialog away (permission still unanswered but the
//     app did raise it), offering the manual city picker, whose own button can ask again.
// Neither shows once a fix exists, once permission is granted, or once it has been dismissed.
import { store, save, getLastFix } from './state.js';
import { h } from './util.js';
import { geoPermission, refreshLocation, locationSheet, render } from './main.js';

export function locationAsk() {
  const prefs = store.profile.prefs;
  if (prefs.geoNudgeOff || getLastFix() || typeof navigator === 'undefined' || !navigator.geolocation) return null;
  const perm = geoPermission();
  // 'unknown' is "not read yet" where the Permissions API exists (main.js redraws Home once it is
  // read), and "never answered" where it does not (older Safari).
  if (perm === 'granted' || (perm === 'unknown' && navigator.permissions && navigator.permissions.query)) return null;
  const dismiss = () => { prefs.geoNudgeOff = true; save(); render(); };

  if (perm === 'denied' || prefs.geoPrompted) {
    return h('div', { class: 'just-arrived-chip loc-banner' }, [
      h('button', { class: 'ja-main', onclick: () => locationSheet() }, [
        h('span', { class: 'status-ic' }, '📍'),
        h('span', { class: 'status-lbl' }, 'Location is off. Tap to set your city'),
      ]),
      h('button', { class: 'ja-x', 'aria-label': 'Dismiss the location banner', onclick: dismiss }, '✕'),
    ]);
  }

  const ask = h('button', { class: 'btn block' }, '📍 Use my location');
  ask.onclick = async () => {
    ask.textContent = 'Locating…'; ask.disabled = true;
    try { await refreshLocation(); } catch { /* refused or unavailable: the banner takes over */ }
    render();
  };
  // data-nofold: mount()'s automatic section folding would give a one-time ask a collapse chevron.
  return h('div', { class: 'card loc-ask', 'data-nofold': '' }, [
    h('h3', {}, '📍 Where are you?'),
    h('p', { class: 'muted' }, 'One tap, and weather, near-me and the closest help follow you. It stays on your device.'),
    ask,
    h('button', { class: 'btn ghost block btn-spaced', onclick: dismiss }, 'Not now'),
  ]);
}
