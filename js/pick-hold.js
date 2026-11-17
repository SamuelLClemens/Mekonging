// F6: a place picked by hand holds for the session (decision 29).
//
// Owner rulings. 2026-10-27, "hold the pick": a place the traveller picks by hand outranks a live fix, which used to win at once (a
// traveller in one town who picked another still saw the town they were in). 2026-11-17, for how long: "when you close the app it
// should go back to using your location ... if they want to look at things from different places to plan, that works for the
// session, until then close the session or choose to go back themselves". So a hold ends in two ways and no other: the app is closed
// (a new session starts) or the traveller taps "Use my location". There is no clock and no distance. The same answer asked that a
// hold which ended by itself is said once on Home ("Your pick of Pai ended. Showing Chiang Mai.").
//
// A session is what sessionStorage calls one: it survives a reload and an iOS discard of a backgrounded page (the back stack in
// js/main.js relies on the same) and dies with the tab or the Home Screen app. The record lives in the on-device store
// (prefs.pickHold), tagged with the session that made it, so a later session can tell that the hold of an earlier one has ended and
// can name the place. Both prefs self-default through migrate() in js/state.js: no store-version bump.
//
// This module keeps the record and draws the two notes. What a held pick means for focusSpot() and contextNow() is decided in
// js/main.js, which also hands this file the names to print: nothing here knows about weather cities or fixes.
import { store, save } from './state.js';
import { h } from './util.js';
import { t } from './i18n.js';

// ---- the session -------------------------------------------------------------------------------------------------------------
const SESSION_KEY = 'mk-session';
let SID = null;
// One id per session, kept in sessionStorage so a reload keeps it. Where storage throws (private mode, blocked site data) the id lives
// in memory, which makes a reload the end of the session: a hold is never kept past what the page can prove.
export function pickSession() {
  if (SID) return SID;
  const fresh = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  try {
    SID = sessionStorage.getItem(SESSION_KEY);
    if (!SID) { SID = fresh; sessionStorage.setItem(SESSION_KEY, SID); }
  } catch { SID = SID || fresh; }
  return SID;
}

// ---- the record --------------------------------------------------------------------------------------------------------------
// prefs.pickHold  { sid, key, place, name, at }  the pick: key is the anchor's spotKey, place the list place beside it (or null),
//                                                name what the screens call it. Alive while sid is this session's.
// prefs.pickEnded { sid, name, at }               a hold of an earlier session that ended and changed what Home says; shown once,
//                                                in the session that found it.
export function heldPick() {
  const ph = store.profile.prefs.pickHold;
  return ph && ph.key && ph.sid === pickSession() ? ph : null;
}
export function startPickHold({ key, place, name }) {
  const prefs = store.profile.prefs;
  prefs.pickHold = { sid: pickSession(), key, place: place || null, name: name || '', at: Date.now() };
  prefs.pickEnded = null;
  save();
}
// Ends a hold (and the note that one ended). True when there was anything to end.
export function clearPickHold() {
  const prefs = store.profile.prefs;
  if (!prefs.pickHold && !prefs.pickEnded) return false;
  prefs.pickHold = null;
  prefs.pickEnded = null;
  save();
  return true;
}

// A hold from an earlier session has ended by itself. Settled once per page load, the first time a screen asks where the traveller is:
// forget the old record, and keep the end for this session when the live place differs from the pick (liveName, '' when there is
// no fix inside the region), because then Home is about to name a different place than it did.
let settled = false;
export function earlierHoldPending() {
  if (settled) return false;
  const p = store.profile.prefs, sid = pickSession();
  if ((p.pickHold && p.pickHold.sid !== sid) || (p.pickEnded && p.pickEnded.sid !== sid)) return true;
  settled = true;   // nothing from an earlier session: never look again
  return false;
}
export function settleEarlierHold(liveName) {
  settled = true;
  const prefs = store.profile.prefs, sid = pickSession();
  const ph = prefs.pickHold, ended = prefs.pickEnded;
  let changed = false;
  if (ended && ended.sid !== sid) { prefs.pickEnded = null; changed = true; }
  if (ph && ph.sid !== sid) {
    prefs.pickHold = null; changed = true;
    if (liveName && liveName !== ph.name) prefs.pickEnded = { sid, name: ph.name, at: Date.now() };
  }
  if (changed) save();
}
export function endedPick() {
  const e = store.profile.prefs.pickEnded;
  return e && e.sid === pickSession() ? e : null;
}
export function dismissEndedPick() {
  if (!store.profile.prefs.pickEnded) return;
  store.profile.prefs.pickEnded = null;
  save();
}

// ---- the notes ---------------------------------------------------------------------------------------------------------------
// t() answers an exact key with its translated template; the slots are filled afterwards with names, which are already in their own
// script and must not go through the dictionary pass (js/fix-age.js does the same).
const tf = (key, ...v) => t(key).replace(/\{(\d)\}/g, (_, n) => (v[+n] === undefined ? '' : v[+n]));

// The note under a screen's headline while a hold changes what the screen names:
//   Showing Pai, your pick.
//   You are near Chiang Mai.            (only while the stored fix is fresh: an old fix does not say where the traveller is, js/fix-age.js)
//   Holds until you close the app.
//   [Use my location]
// onBack() is the tap; it returns a promise, and the button reads "Locating..." until it settles. button: false leaves the button out
// where the screen already has the same control beside the place's name (Things to do).
export function holdNote({ name, live, onBack, button = true }) {
  const box = h('div', { class: 'pick-hold' });
  box.append(h('p', { class: 'hold-line', 'data-no-mt': '' }, tf('📍 Showing {0}, your pick.', name)));
  if (live) box.append(h('p', { class: 'hold-line hold-here', 'data-no-mt': '' }, tf('You are near {0}.', live)));
  box.append(h('p', { class: 'tiny hold-end' }, t('Holds until you close the app.')));
  if (button) {
    const btn = h('button', { class: 'btn ghost block hold-back' }, '📍 ' + t('Use my location'));
    btn.onclick = async () => {
      btn.disabled = true; btn.textContent = t('Locating…');
      try { await onBack(); } finally { if (btn.isConnected) { btn.disabled = false; btn.textContent = '📍 ' + t('Use my location'); } }
    };
    box.append(btn);
  }
  return box;
}

// Home, once, after a hold of an earlier session ended: "Your pick of Pai ended. Showing Chiang Mai." and a close button.
export function endedLine({ name, live, onClose }) {
  return h('div', { class: 'just-arrived-chip pick-ended', role: 'status' }, [
    h('div', { class: 'ja-main', 'data-no-mt': '' }, tf('Your pick of {0} ended. Showing {1}.', name, live)),
    h('button', { class: 'ja-x', 'aria-label': t('Close'), onclick: onClose }, '✕'),
  ]);
}

// Settings, Location status: what the page can prove about the pick. English technical lines, like the rest of that card. The session id
// is there because what an iPhone Home Screen app does with sessionStorage when it is swiped away is not known (this Mac has no iOS
// Simulator): the same id after a close and reopen means the session did not end.
export function pickStatusLines() {
  const ph = store.profile.prefs.pickHold, sid = pickSession();
  const state = !ph ? 'none'
    : ph.sid === sid ? ph.name + ', holding this session, picked ' + new Date(ph.at).toISOString()
      : ph.name + ', from an earlier session (ended, not yet settled)';
  return ['Picked place: ' + state, 'Session: ' + sid.slice(-6)];
}
