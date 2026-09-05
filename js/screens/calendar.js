// Calendar — travel calendar (holidays/festivals/journal/plans, month-grid view), the
// editable calendar-entry form, and the private personal-calendar cards (cycle/mood/
// symptoms/intimacy/pregnancy, PIN-gated, all backed by js/personal.js). One screen because
// the private cards render inline on the same day-detail panel as the traveller's own plans.
// Extracted from main.js (module split, task #211 slice 3 — the third of six screens
// identified as still inline, after familyScreen and settingsScreen). The router is
// calendarDispatch's only external caller, confirmed by a fresh grep rather than trusted
// from the prior scoping pass alone.
// CAL_ICON and calItems both stay in main.js instead of moving here, for two different
// reasons caught by grepping every call site rather than assuming from physical proximity:
// CAL_ICON has a second reader (the You-hub "Coming up" reminders card) and is now exported
// for this file to reverse-import; calItems has exactly one caller, nextPlanItem(), which
// already lives in main.js itself (exported there for home.js) — so calItems simply stays
// put, untouched, rather than moving here just because it sits next to calendarDispatch in
// the original file.
// addEventToCalendar is the same story in reverse, at a distance: its definition sits far
// away from this region (main.js's festival/events cluster), but it has two callers there
// (eventCard and a second events screen) alongside calendarScreen's own call here — so it
// stays in main.js, now exported, rather than being assumed local just because this file is
// its only caller *within this region*. Fan-in is a call-site property, not a proximity one.
import {
  store, save, addCalendarItem, updateCalendarItem, deleteCalendarItem,
} from '../state.js';
import { getActiveCountry } from '../app-state.js';
import { h } from '../util.js';
import { starsStr } from '../render-utils.js';
import { field, selectEl, infoTip, confirmAction } from '../ui-widgets.js';
import { getCountry, getEvents, COUNTRIES } from '../data/regions.js';
import * as personal from '../personal.js';
import * as reminders from '../reminders.js';
import { dateLocale } from '../i18n.js';
import {
  go, mount, topbar, render, focusSpot, setBlobThumb, CAL_ICON, addEventToCalendar,
} from '../main.js';

export function calendarDispatch(arg) {
  if (arg === 'add') return calendarFormScreen();
  if (arg && arg.startsWith('edit-')) return calendarFormScreen(arg.slice(5));
  // #calendar-add-YYYY-MM-DD or #calendar-add-YYYY-MM-DD-<type> — open the editable form
  // prefilled to that day (and type, e.g. laundry / appointment) from the quick-add row.
  if (arg && arg.startsWith('add-')) {
    const r = arg.slice(4);
    const date = /^\d{4}-\d{2}-\d{2}/.test(r) ? r.slice(0, 10) : '';
    const type = r.length > 11 ? r.slice(11) : '';
    return calendarFormScreen(null, { date, type });
  }
  return calendarScreen();
}

function calDateLabel(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return d; }
}

// ---- Month-grid calendar with toggleable layers ----------------------------
let calView = null;      // { y, m } month being viewed
let calSelDate = null;   // 'YYYY-MM-DD' selected day
const CAL_LAYERS = [
  { key: 'holidays', label: 'Holidays & festivals', color: '#E0A526' },
  { key: 'religious', label: 'Religious', color: '#8A5CC0' },
  { key: 'other', label: 'Other countries', color: '#2C7DA0' },
  { key: 'journal', label: 'Journal & photos', color: '#2E8B57' },
  { key: 'mine', label: 'My plans', color: '#C25E3A' },
];
function calLayerState() {
  return { holidays: true, religious: true, other: false, journal: true, mine: true, ...(store.profile.prefs.calLayers || {}) };
}
function isReligiousEvent(e) {
  const s = `${e.name || ''} ${e.blurb || ''} ${e.localName || ''}`.toLowerCase();
  return /buddh|monk|temple|vesak|visakh|makha|asalha|asanha|lent|phansa|christmas|easter|eid|ramadan|hari raya|diwali|hindu|catholic|christ|islam|muslim|vu lan|pchum ben|kathin|\bboun\b/.test(s);
}
function calYmd(dt) { return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
function calEachDate(start, end, fn) {
  const s = new Date(start + 'T00:00:00'); const e = new Date((end || start) + 'T00:00:00');
  if (isNaN(s.getTime())) return;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) fn(calYmd(d));
}
function calDot(color) { return h('span', { class: 'cal-dot-inline', style: `background:${color}` }); }
function calMonthGrid(y, m, byDate, sel, onSelect) {
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7;   // Monday = 0
  const days = new Date(y, m + 1, 0).getDate();
  const today = calYmd(new Date());
  // Weekday headers from the platform's own locale data rather than a hard-coded English
  // array, so all 29 interface languages get correct short names with no dictionary entries to
  // author or keep in parity. 2024-01-01 was a Monday, which is the column order this grid
  // uses (startDow above puts Monday at 0).
  const wkFmt = new Intl.DateTimeFormat(dateLocale(), { weekday: 'short' });
  const cells = Array.from({ length: 7 }, (_, i) => {
    let label;
    try { label = wkFmt.format(new Date(2024, 0, 1 + i)); }
    catch { label = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]; }
    return h('div', { class: 'cal-wk' }, label);
  });
  for (let i = 0; i < startDow; i++) cells.push(h('div', { class: 'cal-cell cal-empty' }));
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const marks = byDate[ds] || [];
    const colors = [...new Set(marks.map((mk) => mk.color))].slice(0, 4);
    cells.push(h('button', {
      class: 'cal-cell' + (ds === today ? ' cal-today' : '') + (ds === sel ? ' cal-sel' : '') + (marks.length ? ' cal-has' : ''),
      onclick: () => onSelect(ds),
    }, [
      h('span', { class: 'cal-day' }, String(d)),
      h('div', { class: 'cal-dots' }, colors.map((c) => h('span', { class: 'cal-dot', style: `background:${c}` }))),
    ]));
  }
  return h('div', { class: 'cal-grid' }, cells);
}

function calendarScreen() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  wrap.append(topbar(name ? `${name}’s travel calendar` : 'Your travel calendar', '#me'));
  const L = calLayerState();
  const now = new Date();
  if (!calView) calView = { y: now.getFullYear(), m: now.getMonth() };
  const focusCC = focusSpot().spot.country;

  // Private personal layers (cycle/mood/intimacy/pregnancy) only merge onto the calendar
  // when the user has turned them on AND (if a PIN is set) unlocked — so nothing private
  // ever shows on a shared screen by default.
  const pOn = personal.isEnabled();
  const pUnlocked = pOn && personal.isUnlocked();
  const PL = pUnlocked ? personal.getLayers() : {};

  // Build day-markers from every enabled layer.
  const byDate = {};
  const push = (ds, mk) => { (byDate[ds] = byDate[ds] || []).push(mk); };
  const ccList = L.other ? COUNTRIES.map((c) => c.id) : [focusCC];
  ccList.forEach((cc) => (getEvents(cc) || []).forEach((e) => {
    if (!e.start) return;
    const other = cc !== focusCC;
    const rel = isReligiousEvent(e);
    let show, color;
    if (other) { show = L.other; color = '#2C7DA0'; }
    else if (rel) { show = L.religious; color = '#8A5CC0'; }
    else { show = L.holidays; color = '#E0A526'; }
    if (!show) return;
    calEachDate(e.start, e.end, (ds) => push(ds, { color, kind: 'event', ref: e, cc }));
  }));
  if (L.journal) (store.journal.entries || []).forEach((j) => { if (j.date) push(j.date, { color: '#2E8B57', kind: 'journal', ref: j }); });
  if (L.mine) (store.calendar.items || []).forEach((it) => { if (it.date) push(it.date, { color: '#C25E3A', kind: 'item', ref: it }); });
  // Private health dots (grid only — details/logging live in the private day card below).
  if (pUnlocked) {
    const y = calView.y, m = calView.m, dim = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const g = personal.dayGlyphs(ds);
      if (PL.period && g.period) push(ds, { color: '#C0405B', kind: 'health' });
      if (PL.intimacy && g.encounters) push(ds, { color: '#D6336C', kind: 'health' });
      if (PL.mood && g.mood != null) push(ds, { color: '#3AA0A0', kind: 'health' });
    }
    const preg = personal.getPregnancy();
    if (PL.pregnancy && preg && preg.active && preg.edd && preg.edd.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)) {
      push(preg.edd, { color: '#B5179E', kind: 'health' });
    }
  }

  // Pregnancy banner (private) — an at-a-glance week/trimester read-out.
  if (pUnlocked && PL.pregnancy) {
    const ps = personal.pregnancyStatus();
    if (ps) wrap.append(h('div', { class: 'card preg-banner' }, [
      h('strong', {}, `🤰 Week ${ps.weeks}${ps.days ? ' +' + ps.days + 'd' : ''} · trimester ${ps.trimester}`),
      h('p', { class: 'muted', style: 'margin:4px 0 0' }, `${ps.dueInDays != null && ps.dueInDays >= 0 ? `~${ps.dueInDays} day${ps.dueInDays === 1 ? '' : 's'} to your due date (${ps.edd}). ` : `Due date ${ps.edd}. `}${ps.milestone}`),
      h('p', { class: 'disclaimer', style: 'margin:6px 0 0' }, 'Informational estimate from your dates — not medical advice. Every pregnancy differs; follow your midwife or doctor.'),
    ]));
  }

  // Month header + navigation.
  const monthName = new Date(calView.y, calView.m, 1).toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' });
  const shift = (delta) => { let m = calView.m + delta, y = calView.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } calView = { y, m }; render(); };
  wrap.append(h('div', { class: 'cal-head' }, [
    h('button', { class: 'chip', 'aria-label': 'Previous month', onclick: () => shift(-1) }, '‹'),
    h('strong', {}, monthName),
    h('button', { class: 'chip', 'aria-label': 'Next month', onclick: () => shift(1) }, '›'),
    h('button', { class: 'chip', onclick: () => { calView = { y: now.getFullYear(), m: now.getMonth() }; calSelDate = calYmd(now); render(); } }, 'Today'),
  ]));

  // Keep the selected day within the viewed month.
  const monthPrefix = `${calView.y}-${String(calView.m + 1).padStart(2, '0')}`;
  if (!calSelDate || !calSelDate.startsWith(monthPrefix)) {
    calSelDate = (calView.y === now.getFullYear() && calView.m === now.getMonth()) ? calYmd(now) : `${monthPrefix}-01`;
  }
  wrap.append(calMonthGrid(calView.y, calView.m, byDate, calSelDate, (ds) => { calSelDate = ds; render(); }));

  // Quick-add row: the common entries in one tap (all open the editable form, prefilled to
  // the selected day + type, so every entry stays fully editable afterwards).
  wrap.append(h('div', { class: 'chips', style: 'margin:8px 0 2px' }, [
    h('button', { class: 'chip', onclick: () => go(`#calendar-add-${calSelDate}`) }, '＋ Plan / booking'),
    h('button', { class: 'chip', onclick: () => go(`#calendar-add-${calSelDate}-laundry`) }, '🧺 Laundry day'),
    h('button', { class: 'chip', onclick: () => go(`#calendar-add-${calSelDate}-appointment`) }, '📌 Appointment'),
  ]));

  // Selected day panel.
  wrap.append(h('h2', { class: 'cat-title', style: 'margin-top:14px' }, calDateLabel(calSelDate)));
  const dayMarks = (byDate[calSelDate] || []).filter((m) => ['event', 'journal', 'item'].includes(m.kind));
  if (!dayMarks.length) wrap.append(h('p', { class: 'muted' }, 'Nothing planned on this day. Use the quick-add above, or “Add” below.'));
  dayMarks.forEach((mk) => {
    if (mk.kind === 'event') {
      const e = mk.ref; const ec = getCountry(mk.cc);
      wrap.append(h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [h('strong', {}, [calDot(mk.color), ' ' + e.name]), ec ? h('span', { class: 'cat-tag' }, ec.flag) : null]),
        e.blurb ? h('p', { class: 'muted', style: 'margin:4px 0' }, e.blurb) : null,
        h('div', { class: 'row-between', style: 'margin-top:6px' }, [
          h('button', { class: 'btn ghost', onclick: () => go(`#event-${e.id}`) }, 'Details'),
          h('button', { class: 'btn ghost', onclick: (ev) => addEventToCalendar(e, ev.currentTarget) }, 'Add to my plans'),
        ]),
      ]));
    } else if (mk.kind === 'journal') {
      const j = mk.ref;
      const card = h('div', { class: 'card' }, [
        h('strong', {}, [calDot(mk.color), ` ${j.photoKey ? '📷 ' : ''}${j.title || 'Journal entry'}`]),
        j.text ? h('p', { class: 'muted', style: 'margin:4px 0' }, j.text.slice(0, 140) + (j.text.length > 140 ? '…' : '')) : null,
        h('button', { class: 'btn ghost', style: 'margin-top:4px', onclick: () => go(`#journal-entry-${j.id}`) }, 'Open entry'),
      ]);
      // Show the entry's photo inline, loaded from IndexedDB, so the day reads like a diary.
      if (j.photoKey) {
        const img = h('img', { class: 'cal-thumb', alt: '', loading: 'lazy', onclick: () => go(`#journal-entry-${j.id}`) });
        card.insertBefore(img, card.children[1]);
        setBlobThumb(img, j.photoKey);
      }
      wrap.append(card);
    } else {
      const it = mk.ref;
      wrap.append(h('div', { class: 'card' }, [
        h('div', { class: 'row-between' }, [
          h('strong', {}, [calDot(mk.color), ` ${it.time ? it.time + ' · ' : ''}${CAL_ICON[it.type] || '•'} ${it.title}`]),
          h('span', { class: 'fair' }, it.cost ? `${it.cost} ${it.currency}` : ''),
        ]),
        it.place ? h('p', { class: 'muted' }, it.place) : null,
        it.rating ? h('div', { class: 'stars-static' }, starsStr(it.rating)) : null,
        it.note ? h('p', {}, it.note) : null,
        h('div', { class: 'row-between', style: 'margin-top:8px' }, [
          h('button', { class: 'btn ghost', onclick: () => go(`#calendar-edit-${it.id}`) }, '✎ Edit'),
          h('button', { class: 'btn ghost', onclick: () => { confirmAction({ title: 'Delete this entry?', confirmLabel: 'Delete', danger: true }).then((ok) => { if (ok) { deleteCalendarItem(it.id); reminders.tick(); render(); } }); } }, 'Delete'),
        ]),
      ]));
    }
  });

  // Private day log (cycle/mood/symptoms/intimacy/pregnancy) — only when the personal
  // calendar is on; it renders its own locked state when a PIN is set.
  if (pOn) wrap.append(personalDayCard(calSelDate));

  // Full editable add form for the selected day.
  wrap.append(h('button', { class: 'btn block', style: 'margin-top:12px', onclick: () => go(`#calendar-add-${calSelDate}`) }, '＋ Add to this day'));

  // ===== Layer toggles — placed AFTER the calendar display, as requested. =====
  wrap.append(h('div', { class: 'row-between', style: 'margin-top:18px' }, [h('h3', { class: 'cat-title', style: 'margin:0' }, 'Show on the calendar'), infoTip('Your choices are remembered.')]));
  wrap.append(h('div', { class: 'chips' }, CAL_LAYERS.map((ly) =>
    h('button', { class: 'chip', 'aria-pressed': L[ly.key] ? 'true' : 'false',
      onclick: () => { const cur = calLayerState(); store.profile.prefs.calLayers = { ...cur, [ly.key]: !cur[ly.key] }; save(); render(); } },
      [calDot(ly.color), ' ' + ly.label]))));
  if (pUnlocked) {
    wrap.append(h('div', { class: 'chips', style: 'margin-top:6px' }, personal.PERSONAL_LAYERS.map((ly) =>
      h('button', { class: 'chip', 'aria-pressed': PL[ly.key] ? 'true' : 'false',
        onclick: () => { personal.setLayer(ly.key, !PL[ly.key]); render(); } },
        [calDot(ly.color), ` ${ly.emoji} ${ly.label}`]))));
  }

  // Private-calendar control card (enable / PIN / pregnancy / disclaimer + sources).
  wrap.append(personalControlCard());

  mount(wrap, '#home');
}

// ---- Private personal calendar UI (cycle/mood/symptoms/intimacy/pregnancy) ---
// All on-device; see js/personal.js. Everything here is editable and removable.
function personalDayCard(date) {
  if (personal.hasPin() && !personal.isUnlocked()) {
    return h('div', { class: 'card' }, [h('p', { class: 'muted' }, '🔒 Locked. Enter your PIN in “Private calendar” below to unlock.')]);
  }
  const g = personal.dayGlyphs(date);
  const day = personal.getDay(date);
  const card = h('div', { class: 'card personal-card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, '🔒 Private log'),
      h('span', { class: 'muted', style: 'font-size:.8rem' }, 'On this device only'),
    ]),
  ]);
  card.append(h('button', { class: 'btn ghost block btn-spaced', 'aria-pressed': g.period ? 'true' : 'false',
    onclick: () => { personal.setPeriod(date, !personal.isPeriodDay(date)); render(); } },
    g.period ? '🩸 Period day ✓ (tap to clear)' : '🩸 Mark period day'));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:8px' }, 'Mood'));
  card.append(h('div', { class: 'chips' }, [1, 2, 3, 4, 5].map((n) =>
    h('button', { class: 'chip', 'aria-pressed': (day.mood === n) ? 'true' : 'false',
      onclick: () => { personal.setMood(date, day.mood === n ? '' : n); render(); } }, personal.MOODS[n]))));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:8px' }, 'Energy'));
  card.append(h('div', { class: 'chips' }, [1, 2, 3, 4, 5].map((n) =>
    h('button', { class: 'chip', 'aria-pressed': (day.energy === n) ? 'true' : 'false',
      onclick: () => { personal.setEnergy(date, day.energy === n ? '' : n); render(); } }, '▁▂▃▅▇'.charAt(n - 1) || String(n)))));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:8px' }, 'How you feel'));
  card.append(h('div', { class: 'chips' }, personal.SYMPTOMS.map((s) =>
    h('button', { class: 'chip', 'aria-pressed': personal.hasSymptom(date, s.id) ? 'true' : 'false',
      onclick: () => { personal.toggleSymptom(date, s.id); render(); } }, s.label))));
  card.append(h('div', { class: 'field-lbl', style: 'margin-top:10px' }, 'Intimacy (optional, private)'));
  (day.encounters || []).forEach((e) => {
    const who = e.solo ? '🌙 Solo' : (e.partnerId ? `💞 ${personal.partnerName(e.partnerId) || 'Partner'}` : '💞 Partnered');
    card.append(h('div', { class: 'row-between price-item' }, [
      h('div', { class: 'grow' }, [h('strong', {}, who), h('div', { class: 'muted', style: 'font-size:.82rem' },
        `${e.time ? e.time + ' · ' : ''}${e.orgasms ? e.orgasms + ' orgasm' + (e.orgasms === 1 ? '' : 's') : ''}${e.satisfaction ? ' · ' + personal.moodFor(e.satisfaction) : ''}${e.protection ? ' · protected' : ''}`)]),
      h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { personal.removeEncounter(date, e.id); render(); } }, '✕'),
    ]));
  });
  card.append(personalEncounterForm(date));
  const ps = personal.pregnancyStatus(date);
  if (ps) card.append(h('p', { class: 'muted', style: 'margin-top:10px' }, `🤰 On this day: week ${ps.weeks}${ps.days ? ' +' + ps.days + 'd' : ''} · trimester ${ps.trimester}.`));
  return card;
}

function personalEncounterForm(date) {
  const det = h('details', { class: 'filters-collapse', style: 'margin-top:6px' });
  det.append(h('summary', {}, '＋ Add intimacy'));
  const solo = h('input', { type: 'checkbox' });
  const partners = personal.listPartners();
  const partnerSel = selectEl([['', 'Partner (optional)']].concat(partners.map((p) => [p.id, p.name])), '', () => {});
  const newPartner = h('input', { type: 'text', placeholder: 'Or a new partner name' });
  const time = h('input', { type: 'time' });
  const orgasms = h('input', { type: 'number', min: '0', max: '99', inputmode: 'numeric', placeholder: 'Orgasms' });
  const sat = selectEl([['', 'Satisfaction'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']], '', () => {});
  const prot = h('input', { type: 'checkbox' });
  const note = h('input', { type: 'text', placeholder: 'Note (optional)' });
  det.append(h('div', {}, [
    field('Solo', solo), field('Time', time), field('Partner', partnerSel), field('New partner', newPartner),
    field('Orgasms', orgasms), field('Satisfaction', sat), field('Protection used', prot), field('Note', note),
    h('button', { class: 'btn block', onclick: () => {
      let partnerId = partnerSel.value || null;
      if (!solo.checked && newPartner.value.trim()) { const npar = personal.addPartner(newPartner.value.trim()); partnerId = npar ? npar.id : partnerId; }
      personal.addEncounter(date, { solo: solo.checked, partnerId, time: time.value, orgasms: orgasms.value, satisfaction: sat.value, protection: prot.checked, note: note.value });
      render();
    } }, 'Save'),
  ]));
  return det;
}

function personalControlCard() {
  const card = h('div', { class: 'card', style: 'margin-top:14px' });
  if (!personal.isEnabled()) {
    card.append(
      h('h3', {}, '🔒 Private calendar (optional)'),
      h('p', { class: 'muted' }, 'Tracks your cycle, mood, symptoms, intimacy and pregnancy — private to this device, never uploaded, never judged, and lockable with a PIN.'),
      h('button', { class: 'btn block', onclick: () => { personal.setEnabled(true); render(); } }, 'Turn on private calendar'),
    );
    return card;
  }
  if (personal.hasPin() && !personal.isUnlocked()) {
    const pin = h('input', { type: 'password', inputmode: 'numeric', placeholder: 'PIN' });
    const err = h('p', { class: 'warn-note', style: 'display:none' });
    const submit = async () => { if (await personal.verifyPin(pin.value)) render(); else { err.textContent = 'Incorrect PIN.'; err.style.display = ''; } };
    pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    card.append(h('h3', {}, '🔒 Private calendar'), h('p', { class: 'muted' }, 'Enter your PIN to unlock.'), field('PIN', pin), err,
      h('button', { class: 'btn block', onclick: submit }, 'Unlock'));
    return card;
  }
  card.append(h('h3', {}, '🔒 Private calendar'));
  const preg = personal.getPregnancy();
  if (preg && preg.active) {
    const ps = personal.pregnancyStatus();
    card.append(h('p', { class: 'muted' }, `🤰 Pregnancy on: week ${ps ? ps.weeks : '–'} · due ${preg.edd}.`));
    card.append(h('div', { class: 'row-between' }, [
      h('button', { class: 'btn ghost', onclick: () => { confirmAction({ title: 'Turn off the pregnancy tracker?', body: 'Your dates are kept.', confirmLabel: 'Turn off' }).then((ok) => { if (ok) { personal.endPregnancy(); render(); } }); } }, 'Turn off'),
      h('button', { class: 'btn ghost', onclick: () => { confirmAction({ title: 'Clear the pregnancy dates?', confirmLabel: 'Clear', danger: true }).then((ok) => { if (ok) { personal.clearPregnancy(); render(); } }); } }, 'Clear dates'),
    ]));
  } else {
    const det = h('details', { class: 'filters-collapse' });
    det.append(h('summary', {}, '🤰 Add a pregnancy'));
    const mode = selectEl([['edd', 'I know my due date'], ['lmp', 'First day of my last period']], 'edd', () => {});
    const dateIn = h('input', { type: 'date' });
    det.append(h('div', {}, [
      field('Based on', mode), field('Date', dateIn),
      h('button', { class: 'btn block', onclick: () => { if (!dateIn.value) { alert('Pick a date.'); return; } personal.setPregnancy({ mode: mode.value, value: dateIn.value }); render(); } }, 'Start tracking'),
      h('p', { class: 'disclaimer' }, 'Estimates use the standard 40-week (280-day) convention (Naegele’s rule). Informational only — not medical advice.'),
    ]));
    card.append(det);
  }
  // Partners accumulate silently: the intimacy form mints one from a free-text field the
  // first time a name is typed, and nothing ever removed one, so a name entered by mistake
  // — or a person the traveller would simply rather not keep a record of — stayed in the
  // dropdown for good. On a screen whose whole premise is that it is private and lockable,
  // being unable to delete a name is the wrong default. Removing a partner clears the name
  // only; the encounters themselves stay, and show as an unnamed entry.
  const partners = personal.listPartners();
  if (partners.length) {
    const parDet = h('details', { class: 'filters-collapse' });
    parDet.append(h('summary', {}, `Partners (${partners.length})`));
    const list = h('div', {});
    partners.forEach((par) => {
      list.append(h('div', { class: 'row-between price-item' }, [
        h('span', { class: 'grow' }, par.name),
        h('div', { class: 'chips' }, [
          h('button', { class: 'chip', 'aria-label': `Remove ${par.name}`, onclick: () => {
            confirmAction({ title: `Remove ${par.name}?`, body: 'The name is removed from this device. Entries recorded with them are kept, and show without a name.', confirmLabel: 'Remove', danger: true })
              .then((ok) => { if (ok) { personal.removePartner(par.id); render(); } });
          } }, '✕'),
        ]),
      ]));
    });
    parDet.append(list);
    card.append(parDet);
  }
  const pinDet = h('details', { class: 'filters-collapse' });
  pinDet.append(h('summary', {}, personal.hasPin() ? 'Change or remove PIN' : 'Add a PIN lock'));
  const np = h('input', { type: 'password', inputmode: 'numeric', placeholder: '4–8 digit PIN' });
  pinDet.append(h('div', {}, [
    field('PIN', np),
    h('button', { class: 'btn block', onclick: async () => { if (await personal.setPin(np.value)) { alert('PIN set.'); render(); } else alert('Use 4–8 digits.'); } }, 'Set PIN'),
    personal.hasPin() ? h('button', { class: 'btn ghost block btn-spaced', onclick: () => { personal.clearPin(); render(); } }, 'Remove PIN') : null,
    h('p', { class: 'disclaimer' }, 'A PIN hides this section from a casual glance. It is not encryption — the data is stored on this device like your journal. For documents you need encrypted, use the vault.'),
  ]));
  card.append(pinDet);
  card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => { confirmAction({ title: 'Turn off the private calendar?', body: 'Your entries are kept and return when you turn it back on.', confirmLabel: 'Turn off' }).then((ok) => { if (ok) { personal.setEnabled(false); personal.lock(); render(); } }); } }, 'Turn off private calendar'));
  card.append(h('p', { class: 'disclaimer', style: 'margin-top:8px' }, 'This calendar is descriptive and informational, not medical advice or contraception guidance. In this region, pregnant and trying-to-conceive travellers should note dengue and Zika risk and discuss travel, vaccines and insurance with a health professional. Sources: ACOG, NHS, WHO, US CDC Travelers’ Health.'));
  return card;
}

// New OR edit a calendar item. editId set => editing (prefilled, saved back). `prefill`
// (from the quick-add row) seeds the date + type of a NEW entry; it stays fully editable.
function calendarFormScreen(editId, prefill) {
  const existing = editId ? store.calendar.items.find((x) => x.id === editId) : null;
  const editing = !!existing;
  const pf = prefill || {};
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(editing ? 'Edit calendar entry' : 'Add to calendar', '#calendar'));
  if (editId && !existing) { wrap.append(h('p', { class: 'empty' }, 'Entry not found.')); mount(wrap, '#home'); return; }
  const c = getCountry(getActiveCountry());
  const st = { rating: existing ? (existing.rating || 0) : 0 };
  const date = h('input', { 'aria-label': 'Date', type: 'date', value: existing ? existing.date : (pf.date || '') });
  const time = h('input', { 'aria-label': 'Time', type: 'time', value: existing ? (existing.time || '') : '' });
  const TYPES = [['plan', '🗓 Day plan'], ['stay', '🛏 Accommodation'], ['meal', '🍽 Meal'], ['activity', '🎟 Activity'], ['laundry', '🧺 Laundry day'], ['appointment', '📌 Appointment']];
  // Some entry types carry a sensible default title so the traveller can log them in one tap; the
  // title stays fully editable — it can be cleared and retyped, and switching type refills it only
  // when it is still empty so a typed title is never overwritten.
  const CAL_DEFAULT_TITLE = { laundry: 'Laundry day', appointment: 'Appointment' };
  const type = selectEl(TYPES, existing ? existing.type : (pf.type || 'plan'), (val) => { if (!title.value.trim() && CAL_DEFAULT_TITLE[val]) title.value = CAL_DEFAULT_TITLE[val]; }, 'Entry type');
  const title = h('input', { 'aria-label': 'Title', type: 'text', placeholder: 'e.g. Grand Palace visit / Bun cha lunch', value: existing ? existing.title : (CAL_DEFAULT_TITLE[pf.type] || '') });
  const place = h('input', { 'aria-label': 'Where', type: 'text', placeholder: 'Where', value: existing ? (existing.place || '') : '' });
  const cost = h('input', { 'aria-label': 'Cost', type: 'number', inputmode: 'decimal', placeholder: 'Cost', value: existing ? (existing.cost || '') : '' });
  const cur = selectEl(['THB', 'VND', 'KHR', 'LAK', 'USD', 'EUR', 'GBP', 'ILS'], existing ? (existing.currency || (c ? c.currency : 'THB')) : (c ? c.currency : 'THB'), () => {}, 'Currency');
  const note = h('textarea', { 'aria-label': 'Details', class: 'ta', placeholder: 'Plan details, or a review once you have been' });
  if (existing) note.value = existing.note || '';
  // Reminder: a per-entry lead time (defaults to the user's chosen default for new entries).
  const remindDefault = existing ? (existing.remind == null ? -1 : existing.remind) : reminders.defaultLead();
  const remind = selectEl(reminders.LEADS.map((l) => [String(l[0]), l[1]]), String(remindDefault), () => {});
  const stars = h('div', { class: 'stars' });
  const paint = (n) => [...stars.children].forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; });
  for (let i = 1; i <= 5; i++) stars.append(h('button', { class: 'star', 'aria-label': `${i} star${i > 1 ? 's' : ''}`, onclick: () => { st.rating = st.rating === i ? 0 : i; paint(st.rating); } }, '☆'));
  paint(st.rating);
  wrap.append(h('div', { class: 'card' }, [
    field('Date', date), field('Time (optional)', time), field('Type', type), field('Title', title), field('Place', place),
    field('Cost (optional)', h('div', { class: 'row-between' }, [cost, cur])),
    field('Reminder', remind),
    field('Rating (optional)', stars), field('Plan / review', note),
  ]));
  wrap.append(h('button', { class: 'btn block', onclick: () => {
    if (!date.value) { alert('Pick a date.'); return; }
    const finalTitle = title.value.trim() || CAL_DEFAULT_TITLE[type.value] || '';
    if (!finalTitle) { alert('Add a title.'); return; }
    const fields = { date: date.value, time: time.value, type: type.value, title: finalTitle, place: place.value.trim(), cost: cost.value, currency: cur.value, rating: st.rating, note: note.value.trim(), remind: Number(remind.value) };
    if (editing) updateCalendarItem(editId, fields); else addCalendarItem(fields);
    reminders.tick();
    go('#calendar');
  } }, editing ? 'Save changes' : 'Save'));
  wrap.append(h('p', { class: 'disclaimer', style: 'margin-top:8px' }, 'Shows on the “Coming up” card on Home. Device alerts need notifications allowed and the app open — not fully closed, so Home is the reliable one.'));
  mount(wrap, '#home');
}
