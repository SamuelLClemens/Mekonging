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
import { confirmAction, currencySelect, field } from './ui-widgets.js';
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

export function expCatPicker(current) {
  let val = expCatsAll().some((c) => c.id === current) ? current : 'other';
  let adding = false;
  const row = h('div', { class: 'chips exp-cat-pick' });
  function build() {
    row.replaceChildren();
    const customIds = new Set(customExpCats().map((c) => c.id));
    expCatsAll().forEach((c) => {
      if (!customIds.has(c.id)) {
        row.append(h('button', {
          type: 'button', class: 'chip' + (c.id === val ? ' on' : ''), 'aria-pressed': c.id === val ? 'true' : 'false',
          onclick: () => { val = c.id; build(); },
        }, `${c.emoji} ${c.label}`));
        return;
      }
      // A custom category: the same pill, but split into a select area and a small ✕ that
      // removes it on the spot (confirmed first — a stray tap while logging an expense must
      // never silently delete one). Two sibling buttons, never a button nested in a button.
      row.append(h('span', { class: 'chip exp-cat-chip-custom' + (c.id === val ? ' on' : '') }, [
        h('button', {
          type: 'button', class: 'exp-cat-sel', 'aria-pressed': c.id === val ? 'true' : 'false',
          onclick: () => { val = c.id; build(); },
        }, `${c.emoji} ${c.label}`),
        h('button', {
          type: 'button', class: 'exp-cat-rm', 'aria-label': `Remove category ${c.label}`,
          onclick: () => {
            confirmAction({ title: `Remove “${c.label}”?`, body: 'Any expenses already logged under it move to Other.', confirmLabel: 'Remove', danger: true })
              .then((ok) => { if (ok) { removeCustomExpCat(c.id); if (val === c.id) val = 'other'; build(); } });
          },
        }, '✕'),
      ]));
    });
    if (customExpCats().length < EXP_CUSTOM_MAX) {
      if (adding) {
        const input = h('input', { type: 'text', class: 'exp-cat-new', placeholder: 'Category name', maxlength: '20', 'aria-label': 'New category name' });
        const commit = () => { const cat = addCustomExpCat(input.value); adding = false; if (cat) val = cat.id; build(); };
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { adding = false; build(); } });
        row.append(input, h('button', { type: 'button', class: 'chip', 'aria-label': 'Add this category', onclick: commit }, '✓'));
        setTimeout(() => input.focus(), 0);
      } else {
        row.append(h('button', { type: 'button', class: 'chip ghost', onclick: () => { adding = true; build(); } }, '＋ Add'));
      }
    }
  }
  build();
  row.get = () => val;
  row.set = (id) => { if (expCatsAll().some((c) => c.id === id)) { val = id; build(); } };
  return row;
}

export function frequentExpenseTitles() {
  const counts = new Map();   // key: lowercased title -> { title, n, cats: Map<category,count> }
  (store.trip.budgetLog || []).forEach((b) => {
    const t = (b.note || '').trim();
    if (!t) return;
    const key = t.toLowerCase();
    const rec = counts.get(key) || { title: t, n: 0, cats: new Map() };
    rec.n++;
    const cat = expCatOf(b);
    rec.cats.set(cat, (rec.cats.get(cat) || 0) + 1);
    counts.set(key, rec);
  });
  return [...counts.values()]
    .filter((r) => r.n >= 2)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((r) => ({ title: r.title, category: [...r.cats.entries()].sort((a, b) => b[1] - a[1])[0][0] }));
}

export function expTitleChips(noteEl, catPicker) {
  const freq = frequentExpenseTitles();
  if (!freq.length) return null;
  return h('div', { class: 'chips exp-title-chips' }, freq.map((f) =>
    h('button', { type: 'button', class: 'chip ghost', onclick: () => { noteEl.value = f.title; if (catPicker) catPicker.set(f.category); } }, f.title)));
}

export function expenseAddCard(opts = {}) {
  const bAmt = h('input', { 'aria-label': 'Amount', type: 'number', inputmode: 'decimal', placeholder: 'Amount' });
  const bCur = currencySelect(opts.currency || 'THB');
  const bDate = h('input', { 'aria-label': 'Date', type: 'date', value: todayISO() });
  const bNote = h('input', { 'aria-label': 'What the expense was on', type: 'text', placeholder: 'On what? (e.g. lunch, taxi, room)' });
  const bCat = expCatPicker('other');
  const bChips = expTitleChips(bNote, bCat);
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
    const item = addBudgetItem({ amount: bAmt.value, currency: bCur.value, note: bNote.value.trim(), category: bCat.get(), date, monthly });
    if (opts.afterAdd) opts.afterAdd(item);
  };
  return h('div', { class: 'card exp-add-card' + (opts.compact ? ' exp-add-compact' : '') }, [
    h('h2', {}, 'Log an expense'),
    h('div', { style: 'display:flex;gap:10px' }, [field('Amount', bAmt), field('Currency', bCur)]),
    field('On what?', bNote), bChips, field('Category', bCat), monthlyToggle, dateField,
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
    const note = h('input', { type: 'text', value: b.note || '', placeholder: 'On what?' });
    const cat = expCatPicker(expCatOf(b));
    const chips = expTitleChips(note, cat);
    return h('div', { class: 'card', style: 'margin:6px 0' }, [
      h('div', { style: 'display:flex;gap:10px' }, [field('Amount', amt), field('Currency', cur)]),
      field('On what?', note), chips, field('Category', cat), field('Date', dt),
      h('div', { class: 'row-between', style: 'margin-top:6px' }, [
        h('button', { class: 'btn ghost', onclick: () => { editExpenseId = null; render(); } }, 'Cancel'),
        h('button', { class: 'btn', onclick: () => { updateBudgetItem(b.id, { amount: amt.value, currency: cur.value, note: note.value.trim(), category: cat.get(), date: dt.value || b.date }); editExpenseId = null; render(); } }, 'Save'),
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
