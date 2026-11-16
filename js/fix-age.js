// F8, the stale stored location (owner report 2026-10-30, owner rulings 2026-11-16).
//
// A stored fix (`prefs.lastFix`) used to stand for "where you are" however old it was: a phone that had flown from Bangkok to Israel
// still printed Thailand's emergency numbers and "near Bangkok" with full confidence. This module says how old a fix is, in words,
// and draws the notes that carry it: Emergency, the hospital screen, the survival guide's coordinates, the screen for a fix outside
// the region, Home and the Settings readout. The limit (one hour) and the pure age tests sit beside the fix in js/state.js
// (`FIX_MAX_AGE_MS`, `fixAgeMs`, `isFixOld`); the position read when the app returns to the foreground is js/fix-refresh.js.
//
// Words. A phrase with a number is a dictionary key with slots, `{0} days` (js/i18n.js, F5c). `t()` answers an exact key with its
// translated template, so `tf` translates the template first and fills its slots after, with pieces that are already in the reader's
// language: a slot that was itself a pattern ("3 days ago" inside a sentence) would come back in English from the dictionary pass.
//
// The one rule about the iPhone's permission dialog (owner, 2026-10-24, restated 2026-11-16): it is raised by a tap and never on its
// own. "Update my location" is such a tap; nothing in this file or in js/fix-refresh.js asks without one.
import { h } from './util.js';
import { t, dateLocale } from './i18n.js';
import { getLastFix, fixAgeMs, isFixOld } from './state.js';

const tf = (key, ...v) => t(key).replace(/\{(\d)\}/g, (_, n) => (v[+n] === undefined ? '' : v[+n]));

// "5 min", "1 hour", "3 days": a length of time in the largest whole unit, because "3 days" says all a traveller needs.
export function durationText(ms) {
  const min = Math.floor(ms / 60000);
  if (min < 60) return tf('{0} min', Math.max(1, min));
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr === 1 ? t('1 hour') : tf('{0} hours', hr);
  const d = Math.floor(hr / 24);
  return d === 1 ? t('1 day') : tf('{0} days', d);
}
export function agoText(ms) { return ms < 60000 ? t('just now') : tf('{0} ago', durationText(ms)); }
// When the fix was taken, on this phone's own clock and in the language of the screen: "Fri, Nov 13, 2:05 PM".
export function takenText(fix) {
  if (!fix || typeof fix.at !== 'number') return '';
  try {
    return new Date(fix.at).toLocaleString(dateLocale(), { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

// ---- why the last attempt failed --------------------------------------------------------------------------------------------
// The watch's error callback used to be empty, so a phone that could not read its position looked the same as one that had.
// This keeps the last failure for the session (memory only: it is a fact about now, not data to keep). A failure is only SHOWN
// beside an old fix: a stationary phone times out every few seconds without anything being wrong, and a fresh fix needs no excuse.
let _err = null;
export function classifyLocationError(err) {
  const c = err && err.code;   // GeolocationPositionError: 1 permission denied, 2 position unavailable, 3 timeout
  return c === 1 ? 'denied' : c === 3 ? 'timeout' : 'unavailable';
}
// Returns true when what a screen would say has changed, so the caller redraws once and not on every repeat of the same error.
export function noteLocationError(err) {
  const kind = classifyLocationError(err);
  const changed = !_err || _err.kind !== kind;
  _err = { kind, at: Date.now() };
  return changed;
}
export function noteLocationOk() { const had = !!_err; _err = null; return had; }
export function lastLocationError() { return _err; }
export function errorText(kind) {
  return kind === 'denied' ? t('Could not update: location is turned off for this app.')
    : kind === 'timeout' ? t('Could not update: it took too long. Try again in the open.')
      : t('Could not update: your phone could not find your position.');
}

// ---- the notes --------------------------------------------------------------------------------------------------------------
function oldLine(fix) {
  const age = fixAgeMs(fix);
  return age == null ? t('📍 Old location, time not known.') : tf('📍 Old location, from {0} ({1}).', agoText(age), takenText(fix));
}

// The button under an old location. A tap asks the phone for a position (the iPhone's permission dialog may appear: a tap raised it).
// `after` redraws the screen once a fresh fix is stored. Returns [button, a slot that holds the reason when the attempt fails].
function updateControls(after) {
  const btn = h('button', { class: 'btn block btn-spaced fix-update' }, 'Update my location');
  const slot = h('p', { class: 'tiny fix-fail', role: 'status' });
  btn.onclick = async () => {
    btn.disabled = true; btn.textContent = t('Locating…'); slot.textContent = '';
    try {
      const m = await import('./main.js');
      await m.refreshLocation();
      noteLocationOk();
      if (after) after();
    } catch (e) {
      noteLocationError(e);
      slot.textContent = errorText(classifyLocationError(e));
      btn.disabled = false; btn.textContent = t('Update my location');
    }
  };
  return [btn, slot];
}
function failureLine() {
  const e = lastLocationError();
  return e ? h('p', { class: 'tiny fix-fail', role: 'status' }, errorText(e.kind)) : null;
}

// Emergency's location block: what the screen names the traveller's country from, and how old that is.
//   a fix inside the limit:  Showing Thailand, near Bangkok, from your location 4 min ago.
//   an old fix:              Old location, from 3 days ago (Fri, Nov 13, 2:05 PM). / Showing Thailand, near Bangkok, from it. / [Update my location]
// then, when the fix is near another country, "Within 40 km of Laos.", then the prompt for the country chips under it.
export function emergencyLocationNote({ fix, country, place, nearNames, bandKm, after }) {
  const old = isFixOld(fix);
  const box = h('div', { class: old ? 'sos-loc fix-old' : 'sos-loc' });
  const name = t(country);
  const age = fixAgeMs(fix);
  if (old) {
    box.append(h('p', { class: 'fix-line' }, oldLine(fix)));
    box.append(h('p', { class: 'fix-line' }, place ? tf('Showing {0}, near {1}, from it.', name, place) : tf('Showing {0}, from it.', name)));
  } else {
    box.append(h('p', { class: 'fix-line' }, place
      ? tf('📍 Showing {0}, near {1}, from your location {2}.', name, place, agoText(age))
      : tf('📍 Showing {0}, from your location {1}.', name, agoText(age))));
  }
  if (nearNames && nearNames.length) box.append(h('p', { class: 'fix-line' }, tf('Within {0} km of {1}.', bandKm, nearNames.map((n) => t(n)).join(', '))));
  if (old) {
    const f = failureLine();
    if (f) box.append(f);
    box.append(...updateControls(after));
  }
  box.append(h('p', { class: 'fix-line' }, 'Wrong country? Pick yours:'));
  return box;
}

// The same warning for the screens that do not name a country from the fix but still use it: the hospital screen (distances), the
// screen for a fix outside the region, the survival guide's coordinates. Null when the fix is inside the limit or there is none.
export function oldFixNote({ fix, after }) {
  if (!isFixOld(fix)) return null;
  const box = h('div', { class: 'sos-loc fix-old' });
  box.append(h('p', { class: 'fix-line' }, oldLine(fix)));
  const f = failureLine();
  if (f) box.append(f);
  box.append(...updateControls(after));
  return box;
}
// "Old coordinates, from 3 days ago:" in place of "Your coordinates:" when the fix is old; null otherwise (the caller keeps its own label).
export function oldCoordsLabel(fix) {
  const age = fixAgeMs(fix);
  return isFixOld(fix) && age != null ? tf('Old coordinates, from {0}:', agoText(age)) : null;
}

// Home: one line under the headline while on the road, in place of the card or hint that used to say nothing about an old fix.
// Tapping it asks the phone for a position; if that fails the reason shows under it and the manual city sheet opens.
export function homeFixLine(fix, after) {
  if (!isFixOld(fix)) return null;
  const age = fixAgeMs(fix);
  const text = age == null ? t('📍 Your location is old. Tap to update.')
    : tf('📍 Your location is {0} old ({1}). Tap to update.', durationText(age), takenText(fix));
  const btn = h('button', { class: 'btn ghost block location-stale-hint fix-old-home' }, text);
  const slot = h('p', { class: 'tiny fix-fail', role: 'status' });
  const f = lastLocationError();
  if (f) slot.textContent = errorText(f.kind);
  btn.onclick = async () => {
    btn.disabled = true; slot.textContent = '';
    try {
      const m = await import('./main.js');
      await m.refreshLocation();
      noteLocationOk();
      if (after) after();
    } catch (e) {
      noteLocationError(e);
      slot.textContent = errorText(classifyLocationError(e));
      btn.disabled = false;
      try { (await import('./main.js')).locationSheet(); } catch { /* the line above already says why */ }
    }
  };
  return h('div', { class: 'fix-home' }, [btn, slot]);
}

// ---- Settings: what the phone reports ---------------------------------------------------------------------------------------
// A readout, not prose: English technical lines under `data-no-mt`, like a version line. It exists because what the Permissions
// API answers on an iPhone Home Screen install is not known, and the owner's phone is the only place to find out. `info` carries
// what only main.js knows: { permission (the app's cached state), watching (a function), standalone, version }.
export function locationStatusCard(info) {
  const pre = h('pre', { class: 'tiny loc-status', 'data-no-mt': '' });
  const paint = async () => {
    let live = 'none (no Geolocation API)';
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      live = 'unknown (no Permissions API)';
      if (navigator.permissions && navigator.permissions.query) {
        try { live = (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { live = 'unknown (the query threw)'; }
      }
    }
    const fix = getLastFix();
    const age = fixAgeMs(fix);
    const e = lastLocationError();
    pre.textContent = [
      `Permission now: ${live}`,
      `Permission cached by the app: ${info.permission}`,
      `Home Screen app: ${info.standalone ? 'yes' : 'no'}`,
      `Position watch running: ${info.watching() ? 'yes' : 'no'}`,
      `Stored location: ${fix ? `${age == null ? 'age unknown' : `${Math.round(age / 60000)} min old`}, ${isFixOld(fix) ? 'old' : 'inside the limit'}${typeof fix.at === 'number' ? `, taken ${new Date(fix.at).toISOString()}` : ''}` : 'none'}`,
      `Last failure: ${e ? `${e.kind}, ${Math.round((Date.now() - e.at) / 1000)} s ago` : 'none'}`,
      `Release: ${info.version}`,
    ].join('\n');
  };
  const again = h('button', { class: 'btn ghost block' }, 'Check again');
  again.onclick = async () => {
    again.disabled = true;
    try { const m = await import('./fix-refresh.js'); await m.freshen('check', true); } catch { /* the readout shows what happened */ }
    await paint();
    again.disabled = false;
  };
  paint();
  return h('div', { class: 'card', 'data-nofold': '' }, [
    h('h2', {}, 'Location status'),
    pre,
    again,
  ]);
}
