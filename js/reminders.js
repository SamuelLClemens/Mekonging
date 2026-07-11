// Reminders — Google-Calendar-style, but SERVER-FREE (no push backend, no account).
// Each calendar entry can carry a per-item lead time; a daily journaling nudge is optional.
// Delivery is best-effort and honest about its limits:
//   - Everything shows IN-APP on the "Coming up" card, which always works offline.
//   - If the traveller grants notification permission, reminders due during an open
//     session are scheduled with setTimeout, and any that came due while the app was
//     closed fire once on the next open. True background push (app fully closed) needs a
//     server and is intentionally not used; the in-app card is the reliable path.

import { store, save, todayKey } from './state.js';

export const LEADS = [
  [-1, 'No reminder'], [0, 'At the time'], [10, '10 minutes before'], [30, '30 minutes before'],
  [60, '1 hour before'], [180, '3 hours before'], [1440, '1 day before'], [2880, '2 days before'],
];
export function leadLabel(mins) { const f = LEADS.find((l) => l[0] === Number(mins)); return f ? f[1] : 'No reminder'; }

function rem() {
  const p = store.profile.prefs;
  if (!p.reminders || typeof p.reminders !== 'object') p.reminders = {};
  const r = p.reminders;
  if (typeof r.notify !== 'boolean') r.notify = false;
  if (r.defaultLead == null) r.defaultLead = 60;
  if (typeof r.journalDaily !== 'boolean') r.journalDaily = false;
  if (!r.journalTime) r.journalTime = '19:00';
  if (!r.fired || typeof r.fired !== 'object') r.fired = {};
  return r;
}
export function settings() { return rem(); }
export function defaultLead() { return rem().defaultLead; }
export function setDefaultLead(m) { rem().defaultLead = Number(m); save(); }
export function setJournalDaily(on) { rem().journalDaily = !!on; save(); }
export function setJournalTime(t) { rem().journalTime = t || '19:00'; save(); }

// ---- notification permission -------------------------------------------------
export function notifySupported() { return typeof window !== 'undefined' && 'Notification' in window; }
export function notifyGranted() { return notifySupported() && Notification.permission === 'granted'; }
export function canNotify() { return notifyGranted() && rem().notify; }
export async function requestNotify() {
  if (!notifySupported()) return false;
  let perm = Notification.permission;
  if (perm !== 'granted' && perm !== 'denied') { try { perm = await Notification.requestPermission(); } catch { perm = 'denied'; } }
  rem().notify = (perm === 'granted'); save();
  return rem().notify;
}
export function setNotify(on) { rem().notify = !!on && notifyGranted(); save(); }

function fire(title, body, tag) {
  if (!canNotify()) return;
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.showNotification) reg.showNotification(title, { body, tag, icon: 'icons/apple-touch-icon.png' });
        else new Notification(title, { body, tag });
      }).catch(() => { try { new Notification(title, { body, tag }); } catch { /* ignore */ } });
    } else { new Notification(title, { body, tag }); }
  } catch { /* notifications unavailable */ }
}

// ---- timing helpers ----------------------------------------------------------
function itemDateTime(it) {
  if (!it || !it.date) return null;
  const t = (typeof it.time === 'string' && /^\d{2}:\d{2}$/.test(it.time)) ? it.time : '09:00';
  const d = new Date(`${it.date}T${t}:00`);
  return isNaN(d.getTime()) ? null : d;
}
// When the reminder should fire (event time minus the lead). null if no reminder set.
export function itemDueAt(it) {
  if (!it || it.remind == null || Number(it.remind) < 0) return null;
  const dt = itemDateTime(it);
  if (!dt) return null;
  return new Date(dt.getTime() - Number(it.remind) * 60000);
}

// Upcoming reminder-bearing entries whose event is within the next `days` (and not long
// past), for the in-app "Coming up" card. Works with no notification permission.
export function upcoming(days = 7) {
  const now = Date.now();
  const horizon = now + days * 86400000;
  const out = [];
  (store.calendar.items || []).forEach((it) => {
    if (it.remind == null || Number(it.remind) < 0) return;
    const evt = itemDateTime(it);
    if (!evt) return;
    if (evt.getTime() < now - 3 * 3600000) return; // drop entries well past
    if (evt.getTime() > horizon) return;
    out.push({ item: it, eventAt: evt, dueAt: itemDueAt(it) });
  });
  out.sort((a, b) => a.eventAt - b.eventAt);
  return out;
}

function bodyFor(it) {
  const when = it.time ? `${it.date} ${it.time}` : it.date;
  return `${it.place ? it.place + ' · ' : ''}${when}`;
}

// ---- the tick: fire due reminders + (re)schedule near-future ones ------------
// Safe to call repeatedly (clears its own timers first), so callers can invoke it on
// boot and whenever calendar/reminder data changes.
let timers = [];
export function tick() {
  timers.forEach((t) => clearTimeout(t)); timers = [];
  const r = rem();
  const now = Date.now();
  (store.calendar.items || []).forEach((it) => {
    const due = itemDueAt(it);
    if (!due) return;
    const evt = itemDateTime(it);
    if (!evt || evt.getTime() < now - 12 * 3600000) return; // ignore old events
    const key = `${it.id}@${it.remind}`;
    if (r.fired[key]) return;
    const dueMs = due.getTime();
    if (dueMs <= now) { fire(`⏰ ${it.title || 'Reminder'}`, bodyFor(it), key); r.fired[key] = true; }
    else if (dueMs <= now + 6 * 3600000) {
      timers.push(setTimeout(() => { const rr = rem(); if (!rr.fired[key]) { fire(`⏰ ${it.title || 'Reminder'}`, bodyFor(it), key); rr.fired[key] = true; save(); } }, dueMs - now));
    }
  });
  // daily journaling nudge (opt-in) — encourages capturing the day while travelling
  if (r.journalDaily) {
    const today = todayKey();
    const [hh, mm] = String(r.journalTime || '19:00').split(':').map(Number);
    const when = new Date(); when.setHours(hh || 19, mm || 0, 0, 0);
    if (r.journalLastDate !== today) {
      if (now >= when.getTime()) { fire('📔 Journal time', 'Capture today — add a note and photos to your travel journal.', `journal-${today}`); r.journalLastDate = today; }
      else timers.push(setTimeout(() => { const rr = rem(); if (rr.journalLastDate !== today) { fire('📔 Journal time', 'Capture today — add a note and photos to your travel journal.', `journal-${today}`); rr.journalLastDate = today; save(); } }, when.getTime() - now));
    }
  }
  // prune fired keys for events more than ~45 days old to keep the map small
  const cutoff = now - 45 * 86400000;
  Object.keys(r.fired).forEach((k) => {
    if (k.startsWith('journal-')) { const d = new Date(k.slice(8) + 'T00:00:00'); if (!isNaN(d) && d.getTime() < cutoff) delete r.fired[k]; }
  });
  save();
}
