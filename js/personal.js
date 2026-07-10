// Private personal calendar for travellers — cycle/period, mood, symptoms, intimacy &
// partner logging, and a descriptive pregnancy tracker. Ported from the Gardenoosh
// personal-calendar model and adapted to Mekonging's store.
//
// PRIVACY & FRAMING (deliberate — do not weaken):
//   - Everything lives in store.personal on THIS device only. Nothing is uploaded, and it
//     is carried through updates + the app backup like the rest of the traveller's data.
//   - It is DESCRIPTIVE and OPTIONAL. It reflects what the user chooses to note. It never
//     scores, judges, sets targets, or offers medical/contraception advice. The pregnancy
//     and cycle read-outs are informational estimates from the user's own data, with clear
//     "not medical advice / follow your clinician" framing shown in the UI.
//   - A PIN hides the section from a casual glance. It is NOT encryption — the data is plain
//     on-device JSON like the journal. That honest framing is surfaced to the user. For
//     documents that must be encrypted, the vault exists.
// For anyone, any body, any relationship, any orientation.

import { store, save } from './state.js';

// ---- shape + normalization --------------------------------------------------
function blank() {
  return { enabled: false, pinHash: null, partners: [], defaultPartnerId: null,
    showCycle: true, days: {}, layers: {}, pregnancy: null };
}
function p() {
  let x = store.personal;
  if (!x || typeof x !== 'object' || Array.isArray(x)) { x = blank(); store.personal = x; return x; }
  if (typeof x.enabled !== 'boolean') x.enabled = false;
  if (!('pinHash' in x)) x.pinHash = null;
  if (!Array.isArray(x.partners)) x.partners = [];
  if (!('defaultPartnerId' in x)) x.defaultPartnerId = null;
  if (typeof x.showCycle !== 'boolean') x.showCycle = true;
  if (!x.days || typeof x.days !== 'object' || Array.isArray(x.days)) x.days = {};
  if (!x.layers || typeof x.layers !== 'object' || Array.isArray(x.layers)) x.layers = {};
  if (!('pregnancy' in x)) x.pregnancy = null;
  return x;
}

// ---- ids + dates ------------------------------------------------------------
let _seq = 0;
function uid(pre) {
  _seq += 1;
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return (pre || 'x') + '-' + crypto.randomUUID().slice(0, 8); } catch { /* noop */ }
  const t = (typeof performance !== 'undefined' && performance.now) ? Math.floor(performance.now()) : _seq;
  return `${pre || 'x'}-${t}-${_seq}`;
}
function ymd(dt) {
  const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, '0'); const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function todayStr() { try { return ymd(new Date()); } catch { return ''; } }
function parseDay(s) { return new Date(s + 'T00:00:00'); }
function daysBetween(a, b) { return Math.round((parseDay(b) - parseDay(a)) / 86400000); }

// ---- enable / disable -------------------------------------------------------
export function isEnabled() { return !!p().enabled; }
export function setEnabled(on) { p().enabled = !!on; save(); }

// ---- PIN lock (privacy from a casual glance; NOT encryption) ----------------
let _unlocked = false;
async function sha256(s) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 5381; const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return 'fnv' + h.toString(16);
  }
}
export function hasPin() { return !!p().pinHash; }
export function isUnlocked() { return !hasPin() || _unlocked; }
export function lock() { _unlocked = false; }
export async function setPin(pin) {
  const s = String(pin || '').trim();
  if (!/^\d{4,8}$/.test(s)) return false;
  p().pinHash = await sha256(s); _unlocked = true; save(); return true;
}
export async function verifyPin(pin) {
  const h = p().pinHash;
  if (!h) { _unlocked = true; return true; }
  const ok = (await sha256(String(pin || '').trim())) === h;
  if (ok) _unlocked = true;
  return ok;
}
export function clearPin() { p().pinHash = null; _unlocked = true; save(); }

// ---- partners ---------------------------------------------------------------
export function listPartners() { return p().partners.slice(); }
export function addPartner(name) {
  const nm = String(name || '').trim().slice(0, 40);
  if (!nm) return null;
  const existing = p().partners.find((x) => x.name.toLowerCase() === nm.toLowerCase());
  if (existing) return existing;
  const rec = { id: uid('p'), name: nm };
  p().partners.push(rec); save(); return rec;
}
export function removePartner(id) {
  const a = p().partners; const i = a.findIndex((x) => x.id === id);
  if (i >= 0) { a.splice(i, 1); if (p().defaultPartnerId === id) p().defaultPartnerId = null; save(); }
}
export function partnerName(id) { const x = p().partners.find((y) => y.id === id); return x ? x.name : ''; }

// ---- layers (toggle each health/personal overlay on the calendar) -----------
// Off by default — these are private, so nothing shows on the calendar until the user
// opts a layer in. Persisted in store.personal.layers.
export const PERSONAL_LAYERS = [
  { key: 'period', label: 'Period & cycle', emoji: '🩸', color: '#C0405B' },
  { key: 'intimacy', label: 'Intimacy', emoji: '💞', color: '#D6336C' },
  { key: 'mood', label: 'Mood & symptoms', emoji: '🙂', color: '#3AA0A0' },
  { key: 'pregnancy', label: 'Pregnancy', emoji: '🤰', color: '#B5179E' },
];
export function getLayers() {
  const x = p();
  PERSONAL_LAYERS.forEach((l) => { if (typeof x.layers[l.key] !== 'boolean') x.layers[l.key] = false; });
  return x.layers;
}
export function setLayer(k, on) { const L = getLayers(); if (PERSONAL_LAYERS.some((l) => l.key === k)) { L[k] = !!on; save(); } }

// ---- day model --------------------------------------------------------------
function ensureDay(date) {
  const d = p().days;
  if (!d[date]) d[date] = { desire: null, note: '', encounters: [] };
  if (!Array.isArray(d[date].encounters)) d[date].encounters = [];
  return d[date];
}
export function getDay(date) { return p().days[date] || { desire: null, note: '', encounters: [] }; }
function pruneDay(date) {
  const d = p().days[date];
  if (d && (!d.encounters || !d.encounters.length) && d.desire == null && !d.note && !d.period
    && d.mood == null && d.energy == null && (!d.symptoms || !d.symptoms.length)) delete p().days[date];
}

// ---- period / cycle (DESCRIPTIVE — never a fertility/medical claim) ----------
export function isPeriodDay(date) { const d = p().days[date]; return !!(d && d.period); }
export function setPeriod(date, on) { const d = ensureDay(date); d.period = !!on; pruneDay(date); save(); }
function periodClusters() {
  const days = p().days;
  const keys = Object.keys(days).filter((k) => days[k].period).sort();
  const clusters = [];
  keys.forEach((k) => {
    const last = clusters[clusters.length - 1];
    if (last && daysBetween(last[last.length - 1], k) === 1) { last.push(k); return; }
    clusters.push([k]);
  });
  return clusters;
}
export function cycleStats() {
  const cl = periodClusters();
  if (!cl.length) return null;
  const starts = cl.map((c) => c[0]);
  const gaps = [];
  for (let i = 1; i < starts.length; i++) { const g = daysBetween(starts[i - 1], starts[i]); if (g > 10 && g < 90) gaps.push(g); }
  const avgLen = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
  const avgPeriod = Math.round(cl.reduce((a, c) => a + c.length, 0) / cl.length);
  const lastStart = starts[starts.length - 1];
  let daysSince = null; try { daysSince = daysBetween(lastStart, todayStr()); } catch { daysSince = null; }
  // A gentle, clearly-labelled estimate of the NEXT period start from the user's own average
  // cycle length. This is arithmetic on their logged data — not a medical or fertility claim,
  // and never an ovulation/fertile-window prediction.
  let nextEstimate = null, nextInDays = null;
  if (avgLen && lastStart) {
    try {
      const n = new Date(parseDay(lastStart)); n.setDate(n.getDate() + avgLen);
      nextEstimate = ymd(n); nextInDays = daysBetween(todayStr(), nextEstimate);
    } catch { nextEstimate = null; }
  }
  return {
    avgLen, avgPeriod, lastStart, daysSince, periodCount: cl.length, nextEstimate, nextInDays,
    recent: cl.slice(-6).reverse().map((c) => ({ start: c[0], end: c[c.length - 1], days: c.length })),
  };
}

// ---- mood / energy / symptoms ----------------------------------------------
export const MOODS = ['', '😞', '😕', '😐', '🙂', '😄']; // 1..5
export function moodFor(v) { return v == null ? '' : (MOODS[Math.max(1, Math.min(5, Math.round(v)))] || ''); }
export const SYMPTOMS = [
  { id: 'cramps', label: 'Cramps' }, { id: 'headache', label: 'Headache' }, { id: 'bloating', label: 'Bloating' },
  { id: 'tender', label: 'Tender breasts' }, { id: 'fatigue', label: 'Fatigue' }, { id: 'nausea', label: 'Nausea' },
  { id: 'backache', label: 'Backache' }, { id: 'acne', label: 'Acne' }, { id: 'cravings', label: 'Cravings' },
  { id: 'poorsleep', label: 'Poor sleep' }, { id: 'headspin', label: 'Dizziness' }, { id: 'dehydrated', label: 'Dehydrated' },
];
const SYMPTOM_LABEL = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s.label]));
export function symptomLabel(id) { return SYMPTOM_LABEL[id] || id; }
function clamp1to5(v) { const n = Math.round(Number(v)); return isFinite(n) ? Math.max(1, Math.min(5, n)) : null; }
export function setMood(date, v) { const d = ensureDay(date); d.mood = (v === '' || v == null) ? null : clamp1to5(v); pruneDay(date); save(); }
export function setEnergy(date, v) { const d = ensureDay(date); d.energy = (v === '' || v == null) ? null : clamp1to5(v); pruneDay(date); save(); }
export function setDesire(date, v) { const d = ensureDay(date); d.desire = (v === '' || v == null) ? null : Math.max(0, Math.min(5, Math.round(Number(v)))); pruneDay(date); save(); }
export function setDayNote(date, note) { const d = ensureDay(date); d.note = String(note || '').slice(0, 280); pruneDay(date); save(); }
export function toggleSymptom(date, id) {
  const d = ensureDay(date);
  if (!Array.isArray(d.symptoms)) d.symptoms = [];
  const i = d.symptoms.indexOf(id);
  if (i >= 0) d.symptoms.splice(i, 1); else d.symptoms.push(id);
  pruneDay(date); save();
}
export function hasSymptom(date, id) { const d = p().days[date]; return !!(d && Array.isArray(d.symptoms) && d.symptoms.includes(id)); }

// ---- intimacy encounters ----------------------------------------------------
export function addEncounter(date, f = {}) {
  const d = ensureDay(date);
  const e = {
    id: uid('e'), time: String(f.time || '').slice(0, 5), solo: !!f.solo,
    partnerId: f.solo ? null : (f.partnerId || null),
    orgasms: Math.max(0, Math.min(99, Math.round(Number(f.orgasms) || 0))),
    satisfaction: (f.satisfaction == null || f.satisfaction === '') ? null : Math.max(1, Math.min(5, Math.round(Number(f.satisfaction)))),
    protection: (f.protection == null) ? null : !!f.protection,
    note: String(f.note || '').slice(0, 200),
  };
  d.encounters.push(e); save(); return e;
}
export function removeEncounter(date, encId) {
  const d = p().days[date]; if (!d) return;
  const i = d.encounters.findIndex((e) => e.id === encId);
  if (i >= 0) { d.encounters.splice(i, 1); pruneDay(date); save(); }
}

// ---- calendar-cell glyphs ---------------------------------------------------
const FACES = ['', '😞', '😐', '🙂', '😊', '😍'];
function faceFor(v) { return v == null ? '' : (FACES[Math.max(1, Math.min(5, Math.round(v)))] || ''); }
export function dayGlyphs(date) {
  const d = p().days[date];
  if (!d) return { period: false, encounters: 0, mood: null, symptomCount: 0 };
  return {
    period: !!d.period,
    encounters: (d.encounters || []).length,
    mood: d.mood != null ? d.mood : null,
    moodFace: faceFor(d.mood),
    symptomCount: (d.symptoms || []).length,
  };
}

// ---- pregnancy tracker (descriptive; informational, not medical advice) -----
// EDD via Naegele's rule (LMP + 280 days). If the user has an EDD from a scan/clinician,
// they enter that directly and it wins. Gestational age = days since the LMP-equivalent.
// Sources: ACOG "Methods for Estimating the Due Date"; NHS "You and your baby at ... weeks".
const PREG_MS = [
  { upto: 4, text: 'Very early — a positive test is typical around now. Confirm with a clinic.' },
  { upto: 8, text: 'Major organs are forming. Morning sickness and fatigue are common.' },
  { upto: 12, text: 'End of the 1st trimester nears; first scan often falls around 11–14 weeks.' },
  { upto: 16, text: 'Energy often improves. Some feel the first movements later this stretch.' },
  { upto: 20, text: 'The mid-pregnancy anomaly scan is usually offered around 18–21 weeks.' },
  { upto: 24, text: 'Movements grow stronger. "Viability" is often cited around 24 weeks.' },
  { upto: 28, text: 'Start of the 3rd trimester. Glucose screening is common around now.' },
  { upto: 32, text: 'Growth checks step up. Plan travel carefully and carry your notes.' },
  { upto: 36, text: 'Many airlines restrict flying from ~28–36 weeks — check the airline’s policy.' },
  { upto: 40, text: 'Full term (37–42 weeks). Baby could arrive any time around the due date.' },
  { upto: 45, text: 'Past the due date. Your clinician will advise on monitoring.' },
];
function pregMilestone(weeks) { const m = PREG_MS.find((x) => weeks < x.upto) || PREG_MS[PREG_MS.length - 1]; return m ? m.text : ''; }

export function getPregnancy() { return p().pregnancy; }
export function isPregnancyActive() { const pr = p().pregnancy; return !!(pr && pr.active); }
// mode: 'edd' (value = due date) or 'lmp' (value = first day of last period).
export function setPregnancy({ mode, value, note } = {}) {
  if (!mode || !value) return null;
  const x = p();
  x.pregnancy = { active: true, mode: mode === 'lmp' ? 'lmp' : 'edd', edd: null, lmp: null, note: String(note || '').slice(0, 200) };
  if (x.pregnancy.mode === 'lmp') { x.pregnancy.lmp = value; const d = parseDay(value); d.setDate(d.getDate() + 280); x.pregnancy.edd = ymd(d); }
  else { x.pregnancy.edd = value; const d = parseDay(value); d.setDate(d.getDate() - 280); x.pregnancy.lmp = ymd(d); }
  save(); return x.pregnancy;
}
export function endPregnancy() { const x = p(); if (x.pregnancy) x.pregnancy.active = false; save(); }
export function clearPregnancy() { p().pregnancy = null; save(); }
// Status for a given day (defaults to today). Returns null if no active pregnancy.
export function pregnancyStatus(onDate) {
  const pr = p().pregnancy;
  if (!pr || !pr.active || !pr.lmp || !pr.edd) return null;
  const ref = onDate || todayStr();
  let ga; try { ga = daysBetween(pr.lmp, ref); } catch { return null; }
  if (ga < 0) ga = 0;
  const weeks = Math.floor(ga / 7); const days = ga % 7;
  const trimester = weeks < 14 ? 1 : (weeks < 28 ? 2 : 3);
  let dueInDays = null; try { dueInDays = daysBetween(ref, pr.edd); } catch { dueInDays = null; }
  return { weeks, days, trimester, edd: pr.edd, lmp: pr.lmp, dueInDays, milestone: pregMilestone(weeks), note: pr.note || '' };
}

// ---- lean descriptive insights ---------------------------------------------
export function insights() {
  const days = p().days; const keys = Object.keys(days).sort();
  const r1 = (n) => Math.round(n * 10) / 10;
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const lines = [];
  const cs = cycleStats();
  if (cs) {
    if (cs.daysSince != null) lines.push(`Last period started <strong>${cs.daysSince}</strong> day${cs.daysSince === 1 ? '' : 's'} ago.`);
    if (cs.avgLen != null) lines.push(`Your cycles average about <strong>${cs.avgLen}</strong> days (from your own logs — an estimate, not a prediction).`);
    if (cs.nextEstimate && cs.nextInDays != null && cs.nextInDays >= 0) lines.push(`Next period estimated around <strong>${cs.nextEstimate}</strong> (~${cs.nextInDays} day${cs.nextInDays === 1 ? '' : 's'}).`);
  }
  let enc = 0; const sat = []; const moodP = []; const moodN = []; const sym = {};
  keys.forEach((k) => {
    const d = days[k]; const isP = !!d.period;
    enc += (d.encounters || []).length;
    (d.encounters || []).forEach((e) => { if (e.satisfaction != null) sat.push(e.satisfaction); });
    if (d.mood != null) (isP ? moodP : moodN).push(d.mood);
    (d.symptoms || []).forEach((s) => { sym[s] = (sym[s] || 0) + 1; });
  });
  if (enc) { const sa = avg(sat); lines.push(`<strong>${enc}</strong> intimate log${enc === 1 ? '' : 's'}${sa != null ? `, satisfaction ${r1(sa)}/5` : ''}.`); }
  const mp = avg(moodP), mn = avg(moodN);
  if (mp != null && mn != null) lines.push(`Mood averaged <strong>${moodFor(mp)} ${r1(mp)}/5</strong> on period days vs <strong>${moodFor(mn)} ${r1(mn)}/5</strong> on other days.`);
  const topSym = Object.entries(sym).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topSym.length) lines.push(`Most-logged: ${topSym.map(([id, n]) => `${symptomLabel(id)} (${n})`).join(', ')}.`);
  return { enough: lines.length > 0, lines };
}
