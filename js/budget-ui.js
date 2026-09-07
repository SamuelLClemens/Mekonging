// Expense UI shared between the (lazily loaded) expenses screen and the modules that stay in
// the launch graph — js/screens/home.js reads budgetTarget and tripSpanDays for the Home spend
// card, and main.js renders expense rows and the add-card away from #expenses.
//
// Same split as js/place-ui.js: js/screens/budget.js sat in the launch graph only because
// main.js and home.js imported six helpers from it. The route handler itself (expensesScreen)
// is 1.6 KB and nothing but the router calls it, so the screen loads on demand now.
//
// The closure was computed, not guessed: those six pull in nine more plus the category tables,
// and stop — expensesScreen is not reachable from any of them.

import { h } from './util.js';
import { dateLocale } from './i18n.js';
import { confirmAction, currencySelect, field, selectEl } from './ui-widgets.js';
import { approxHome, render, todayISO } from './main.js';
import {
  addBudgetItem, deleteBudgetItem, save, store, todayKey, updateBudgetItem,
} from './state.js';

export const EXP_CATS = [
  { id: 'food', label: 'Food', emoji: '🍜', color: '#E0A100' },
  { id: 'stay', label: 'Stay', emoji: '🛏', color: '#9C5780' },
  { id: 'transit', label: 'Transit', emoji: '🚌', color: '#3E7CB1' },
  { id: 'gear', label: 'Gear', emoji: '🎒', color: '#5E9A52' },
  { id: 'other', label: 'Other', emoji: '•', color: '#8A8A8A' },
];

export const EXP_CAT = Object.fromEntries(EXP_CATS.map((c) => [c.id, c]));

export const EXP_CUSTOM_MAX = 6;

export const EXP_CUSTOM_PALETTE = ['#B15C2E', '#4E7A51', '#7A5CB1', '#2E7AB1', '#B15C8E', '#6B7A2E'];

export function customExpCats() { const p = store.profile.prefs; return Array.isArray(p.customExpCats) ? p.customExpCats : []; }

export function expCatsAll() { return [...EXP_CATS, ...customExpCats()]; }

export function expCatLookup(id) { return expCatsAll().find((c) => c.id === id) || EXP_CAT.other; }

export function expCatOf(b) { return (b && b.category && expCatsAll().some((c) => c.id === b.category)) ? b.category : 'other'; }

export function addCustomExpCat(label) {
  const name = String(label || '').trim().slice(0, 20);
  if (!name) return null;
  const cats = customExpCats();
  if (cats.length >= EXP_CUSTOM_MAX) return null;
  const existing = new Set(expCatsAll().map((c) => c.id));
  const base = 'c_' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '').slice(0, 24) || 'custom');
  let id = base, n = 2; while (existing.has(id)) id = `${base}-${n++}`;
  const cat = { id, label: name, emoji: '🏷', color: EXP_CUSTOM_PALETTE[cats.length % EXP_CUSTOM_PALETTE.length] };
  cats.push(cat); store.profile.prefs.customExpCats = cats; save();
  return cat;
}

export function removeCustomExpCat(id) {
  store.profile.prefs.customExpCats = customExpCats().filter((c) => c.id !== id);
  (store.trip.budgetLog || []).forEach((b) => { if (b.category === id) b.category = 'other'; });
  save();
}

// The expense category picker. This used to render one chip per category — every built-in
// plus every custom one, plus an "＋ Add" chip — which on a phone wrapped to three or four
// rows inside a card whose whole job is a two-field form. Categories are a single-select, and
// a single-select of a dozen options is what a <select> is for: one row, every option still
// reachable, and the native picker is a better touch target than a 60px pill. Part of the
// site-wide pass replacing walls of individual filter/option buttons with compact controls.
//
// The two things a chip row gave that a bare <select> does not — adding a custom category and
// removing one — are kept as a single trailing action row rather than N inline ✕ buttons:
// "＋ New" is always offered (up to EXP_CUSTOM_MAX), and "✕ Remove" appears only while a
// custom category is the one selected, which is exactly when it is meaningful.
export function expCatPicker(current) {
  let val = expCatsAll().some((c) => c.id === current) ? current : 'other';
  let adding = false;
  const row = h('div', { class: 'exp-cat-pick' });
  function build() {
    row.replaceChildren();
    const customIds = new Set(customExpCats().map((c) => c.id));
    row.append(selectEl(
      expCatsAll().map((c) => [c.id, `${c.emoji} ${c.label}`]), val,
      (v) => { val = v; build(); }, 'Category',
    ));
    if (adding) {
      const input = h('input', { type: 'text', class: 'exp-cat-new', placeholder: 'New category name', maxlength: '20', 'aria-label': 'New category name' });
      const commit = () => { const cat = addCustomExpCat(input.value); adding = false; if (cat) val = cat.id; build(); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { adding = false; build(); } });
      row.append(h('div', { class: 'exp-cat-actions' }, [
        input,
        h('button', { type: 'button', class: 'chip', 'aria-label': 'Add this category', onclick: commit }, '✓'),
        h('button', { type: 'button', class: 'chip ghost', 'aria-label': 'Cancel adding a category', onclick: () => { adding = false; build(); } }, '✕'),
      ]));
      setTimeout(() => input.focus(), 0);
    } else {
      const actions = [];
      if (customExpCats().length < EXP_CUSTOM_MAX) {
        actions.push(h('button', { type: 'button', class: 'chip ghost', onclick: () => { adding = true; build(); } }, '＋ New category'));
      }
      // Removing is confirmed first — a stray tap while logging an expense must never
      // silently delete a category the traveller has been filing things under.
      if (customIds.has(val)) {
        const c = expCatsAll().find((x) => x.id === val);
        actions.push(h('button', {
          type: 'button', class: 'chip ghost', 'aria-label': `Remove category ${c ? c.label : ''}`,
          onclick: () => {
            confirmAction({ title: `Remove “${c ? c.label : ''}”?`, body: 'Any expenses already logged under it move to Other.', confirmLabel: 'Remove', danger: true })
              .then((ok) => { if (ok) { removeCustomExpCat(val); val = 'other'; build(); } });
          },
        }, '✕ Remove this one'));
      }
      if (actions.length) row.append(h('div', { class: 'exp-cat-actions' }, actions));
    }
  }
  build();
  row.get = () => val;
  row.set = (id) => { if (expCatsAll().some((c) => c.id === id)) { val = id; build(); } };
  return row;
}

// Every distinct thing the traveller has logged before, most-used first (ties broken by most
// recent), each carrying the category it is most often filed under so picking it fills both
// fields in one go.
//
// Two thresholds changed when the chip row became a dropdown, and both changes are the point
// rather than incidental:
//   * n >= 1, not n >= 2. "When something is added to the list it should go in the dropdown"
//     is about a single log, not a repeat — under the old rule the first beer you logged was
//     invisible and the second one materialised a button.
//   * 40 entries, not 6. Six was a chip-row budget: a seventh chip wrapped the row to a third
//     line. A dropdown is the same height whether it holds three entries or thirty, which is
//     exactly why this control belongs in one.
export function frequentExpenseTitles() {
  const counts = new Map();   // key: lowercased title -> { title, n, last, cats: Map<category,count> }
  (store.trip.budgetLog || []).forEach((b, i) => {
    const t = (b.note || '').trim();
    if (!t) return;
    const key = t.toLowerCase();
    const rec = counts.get(key) || { title: t, n: 0, last: -1, cats: new Map() };
    rec.n++;
    rec.last = i;
    rec.title = t;              // keep the most recent spelling/casing the traveller used
    const cat = expCatOf(b);
    rec.cats.set(cat, (rec.cats.get(cat) || 0) + 1);
    counts.set(key, rec);
  });
  return [...counts.values()]
    .sort((a, b) => (b.n - a.n) || (b.last - a.last))
    .slice(0, 40)
    .map((r) => ({ title: r.title, n: r.n, category: [...r.cats.entries()].sort((a, b) => b[1] - a[1])[0][0] }));
}

// The "On what?" field. A dropdown of everything logged before plus free text for anything
// new — NOT a row of one-tap chips, which is what this was and what had to go: a logged
// expense must land in the dropdown and must never spawn a button of its own, and logging
// the same thing twice must not produce a second control (direct request, made repeatedly).
//
// Free text stays reachable at all times rather than hiding behind the dropdown's "something
// new" option, because the first expense of a trip is always new and a picker offering one
// option and an escape hatch is worse than a plain field. The dropdown simply does not render
// until there is something remembered to put in it.
//
// Returns the wrapper with `.get()` for the typed-or-picked title. Direct node references
// throughout: mount()'s automatic folding re-parents a card's children, so anything looked up
// through the wrapper from a later handler would come back null.
export function expTitlePicker(catPicker, opts = {}) {
  const seen = frequentExpenseTitles();
  const input = h('input', {
    type: 'text', 'aria-label': 'What the expense was on',
    placeholder: seen.length ? 'Or type something new' : 'On what? (e.g. lunch, taxi, room)',
    value: opts.value || '',
  });
  const wrap = h('div', { class: 'exp-title-pick' });
  if (seen.length) {
    const sel = selectEl(
      [['', `Pick from your ${seen.length} logged…`], ...seen.map((f) => [f.title, f.n > 1 ? `${f.title} (${f.n}×)` : f.title])],
      '',
      (v) => {
        if (!v) return;
        const f = seen.find((x) => x.title === v);
        input.value = v;
        if (f && catPicker) catPicker.set(f.category);
        sel.value = '';           // reset so re-picking the same entry works a second time
      },
      'Pick something you have logged before',
    );
    wrap.append(sel);
  }
  wrap.append(input);
  wrap.get = () => input.value.trim();
  wrap.set = (v) => { input.value = v; };
  return wrap;
}

export function expenseAddCard(opts = {}) {
  const bAmt = h('input', { 'aria-label': 'Amount', type: 'number', inputmode: 'decimal', placeholder: 'Amount' });
  const bCur = currencySelect(opts.currency || 'THB');
  const bDate = h('input', { 'aria-label': 'Date', type: 'date', value: todayISO() });
  const bCat = expCatPicker('other');
  const bNote = expTitlePicker(bCat);
  const dateField = field('Date', bDate);
  // A rent payment or a month-long SIM plan does not belong to one day — checking this swaps
  // the day picker for a month picker (native <input type=month>) and the logged date
  // normalises to that month's 1st, tagged monthly:true so the log/exports can label it
  // "August 2026" instead of a single day (see fmtLogDateFor).
  const bMonthly = h('input', { type: 'checkbox' });
  bMonthly.addEventListener('change', () => {
    const monthly = bMonthly.checked;
    bDate.type = monthly ? 'month' : 'date';
    bDate.value = monthly ? todayISO().slice(0, 7) : todayISO();
    dateField.firstElementChild.textContent = monthly ? 'Month' : 'Date';
  });
  const monthlyToggle = h('label', { class: 'exp-monthly-toggle' }, [bMonthly, ' 🗓 Monthly expense (rent, SIM plan…)']);
  const add = () => {
    if (!bAmt.value || !bDate.value) return;
    const monthly = bMonthly.checked;
    const date = monthly ? `${bDate.value}-01` : bDate.value;
    const item = addBudgetItem({ amount: bAmt.value, currency: bCur.value, note: bNote.get(), category: bCat.get(), date, monthly });
    if (opts.afterAdd) opts.afterAdd(item);
  };
  return h('div', { class: 'card exp-add-card' + (opts.compact ? ' exp-add-compact' : '') }, [
    h('h2', {}, 'Log an expense'),
    h('div', { style: 'display:flex;gap: var(--sp-3)' }, [field('Amount', bAmt), field('Currency', bCur)]),
    field('On what?', bNote), field('Category', bCat), monthlyToggle, dateField,
    h('button', { class: 'btn block btn-spaced', onclick: add }, '＋ Add expense'),
  ]);
}

export function budgetTarget() { const t = store.profile.prefs.budgetCap; return (t && +t.amount > 0) ? { amount: +t.amount, per: t.per === 'day' ? 'day' : 'trip' } : null; }

export function tripSpanDays() {
  const parse = (d) => { const p = String(d).split('-').map(Number); return Date.UTC(p[0], (p[1] || 1) - 1, p[2] || 1); };
  const manual = store.profile.prefs.tripDates;
  let start, end;
  if (manual && manual.start) {
    start = manual.start;
    end = manual.end || null;
  } else {
    const stops = (store.trip.stops || []);
    const dates = [];
    stops.forEach((s) => { if (s.date) dates.push(s.date); if (s.endDate) dates.push(s.endDate); });
    (store.trip.budgetLog || []).forEach((b) => { if (b.date) dates.push(b.date); });
    if (!dates.length) return null;
    start = dates.slice().sort()[0];
    const ends = stops.map((s) => s.endDate || s.date).filter(Boolean).sort();
    end = ends.length ? ends[ends.length - 1] : null;
  }
  const today = todayKey();
  const dayMs = 86400000;
  const elapsed = Math.max(1, Math.round((parse(today) - parse(start)) / dayMs) + 1);
  const total = end ? Math.max(elapsed, Math.round((parse(end) - parse(start)) / dayMs) + 1) : null;
  return { elapsed, total, start, end };
}

export function fmtLogDate(iso) {
  if (!iso) return '';
  const t = todayISO();
  if (iso === t) return 'Today';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`) return 'Yesterday';
  const d = new Date(`${iso}T00:00`);
  return isNaN(d) ? iso : d.toLocaleDateString(dateLocale(), { month: 'short', day: 'numeric' });
}

export function fmtLogDateFor(b) {
  if (b && b.monthly && b.date) {
    const d = new Date(`${b.date}T00:00`);
    if (!isNaN(d)) return d.toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' });
  }
  return fmtLogDate(b ? b.date : '');
}

// Which log row is currently flipped open into its inline editor, or null. All four reads and
// writes are in this file, and this is where the declaration has to live: it used to sit in
// js/screens/budget.js, one module away, and a module's `let` CANNOT be written — or read —
// from another module. ES modules are strict mode, so `editExpenseId` here was a plain
// ReferenceError, not an implicit global. The ✎ Edit control on every budget-log row, on both
// Expenses and My Trip, threw the moment it was tapped.
//
// This is the third time this exact shape has shipped (see also wxMetric and weatherKey). It
// was found by scripts/check-undefined.py only after that guard stopped treating `if (x) {` as
// a declaration of x — which is what had been hiding it.
let editExpenseId = null;

export function budgetLogRow(b) {
  if (editExpenseId === b.id) {
    const amt = h('input', { type: 'number', inputmode: 'decimal', value: b.amount });
    const cur = currencySelect(b.currency || 'THB');
    const dt = h('input', { type: 'date', value: b.date || todayISO() });
    const cat = expCatPicker(expCatOf(b));
    const note = expTitlePicker(cat, { value: b.note || '' });
    return h('div', { class: 'card', style: 'margin: var(--sp-1h) 0' }, [
      h('div', { style: 'display:flex;gap: var(--sp-3)' }, [field('Amount', amt), field('Currency', cur)]),
      field('On what?', note), field('Category', cat), field('Date', dt),
      h('div', { class: 'row-between', style: 'margin-top: var(--sp-1h)' }, [
        h('button', { class: 'btn ghost', onclick: () => { editExpenseId = null; render(); } }, 'Cancel'),
        h('button', { class: 'btn', onclick: () => { updateBudgetItem(b.id, { amount: amt.value, currency: cur.value, note: note.get(), category: cat.get(), date: dt.value || b.date }); editExpenseId = null; render(); } }, 'Save'),
      ]),
    ]);
  }
  const approx = approxHome(b.amount, b.currency);
  const cat = expCatLookup(expCatOf(b));
  return h('div', { class: 'exp-row' }, [
    h('span', { class: 'exp-row-cat', style: `background:${cat.color}22;color:${cat.color}`, title: cat.label }, cat.emoji),
    h('div', { class: 'exp-row-mid' }, [
      h('div', { class: 'exp-row-note' }, b.note || cat.label),
      h('div', { class: 'exp-row-date muted' }, fmtLogDateFor(b)),
    ]),
    h('div', { class: 'exp-row-amt' }, [
      h('strong', {}, `${b.amount} ${b.currency}`),
      approx ? h('span', { class: 'muted exp-row-approx' }, approx) : null,
    ]),
    h('div', { class: 'exp-row-actions' }, [
      h('button', { class: 'chip', 'aria-label': 'Edit', onclick: () => { editExpenseId = b.id; render(); } }, '✎'),
      h('button', { class: 'chip', 'aria-label': 'Delete', onclick: () => { confirmAction({ title: 'Delete this expense?', confirmLabel: 'Delete', danger: true }).then((ok) => { if (ok) { deleteBudgetItem(b.id); render(); } }); } }, '✕'),
    ]),
  ]);
}
