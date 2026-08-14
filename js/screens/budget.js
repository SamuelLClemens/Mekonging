// Budget & Expenses — categories, budget target, donut chart, spend trend, cash withdrawals,
// and the "Log an expense" card shared by this screen, My Trip, and Home's quick-spend.
// Extracted from main.js (module split, see MASTER_BUILD_PROMPT.md / OVERHAUL.md) — a fully
// contiguous 666-line block with exactly five outside call-in points, none of which touch
// map/GPS/live-teardown infra, unlike the far more entangled Places screen (deferred).
import { store, save, addBudgetItem, updateBudgetItem, deleteBudgetItem, addWithdrawal, updateWithdrawal, deleteWithdrawal, todayKey } from '../state.js';
import { h, esc } from '../util.js';
import { field, selectEl, currencySelect, confirmAction, collapsibleCard, infoTip } from '../ui-widgets.js';
import { convert } from '../currency.js';
import { getCountry } from '../data/regions.js';
import { getActiveCountry } from '../app-state.js';
import {
  go, mount, topbar, render, homeCurrency, focusSpot, todayISO, fxConverterControl, approxHome,
} from '../main.js';

// A budget-log row that flips to an inline editor — used on both Expenses and My Trip so
// every logged spend can be corrected (amount, currency, note), not only deleted.
let editExpenseId = null;
// Same idea for a logged cash withdrawal — see withdrawalRow.
let editWithdrawalId = null;
// ---- expenses: categories, budget target, donut chart, projection ----------
// The 5 built-ins are fixed; the traveller can add their own on top of them, stored in prefs
// so they persist and survive backup/restore. A custom category is never a second, separate
// list — expCatsAll() is what every picker, sum, and label actually iterates, so a custom
// category is exactly as first-class as Food or Stay everywhere one appears. (This is the fix
// for the "categories don't join" report: there was no way to add one before, so whatever
// prompted that report had nowhere to go but silently fold into Other.)
const EXP_CATS = [
  { id: 'food', label: 'Food', emoji: '🍜', color: '#E0A100' },
  { id: 'stay', label: 'Stay', emoji: '🛏', color: '#9C5780' },
  { id: 'transit', label: 'Transit', emoji: '🚌', color: '#3E7CB1' },
  { id: 'gear', label: 'Gear', emoji: '🎒', color: '#5E9A52' },
  { id: 'other', label: 'Other', emoji: '•', color: '#8A8A8A' },
];
const EXP_CAT = Object.fromEntries(EXP_CATS.map((c) => [c.id, c]));
const EXP_CUSTOM_MAX = 6;
const EXP_CUSTOM_PALETTE = ['#B15C2E', '#4E7A51', '#7A5CB1', '#2E7AB1', '#B15C8E', '#6B7A2E'];
function customExpCats() { const p = store.profile.prefs; return Array.isArray(p.customExpCats) ? p.customExpCats : []; }
export function expCatsAll() { return [...EXP_CATS, ...customExpCats()]; }
export function expCatLookup(id) { return expCatsAll().find((c) => c.id === id) || EXP_CAT.other; }
export function expCatOf(b) { return (b && b.category && expCatsAll().some((c) => c.id === b.category)) ? b.category : 'other'; }
// Adds a custom category (name only; colour auto-assigned from a fixed palette so it stays
// distinct from the 5 built-ins and from other custom ones) and returns it, or null if the
// name is empty or the cap is already reached.
function addCustomExpCat(label) {
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
// Removes a custom category; any expense already logged under it folds back to Other rather
// than pointing at a category that no longer exists (mirrors idPruneMeta's tidy-up-after-self).
function removeCustomExpCat(id) {
  store.profile.prefs.customExpCats = customExpCats().filter((c) => c.id !== id);
  (store.trip.budgetLog || []).forEach((b) => { if (b.category === id) b.category = 'other'; });
  save();
}

// Segmented category picker: the fixed 5 plus any the traveller has added, in one row — a
// custom category is never a second list, and (per direct report — a "Manage your categories"
// fold elsewhere on the screen still read as a second, separate categories list) neither is
// removing one: a custom chip carries its own small inline ✕ right here, so there is exactly
// one place categories live, full stop. The trailing "+ Add" opens a one-line name field in
// place (Enter to commit), mirroring the identifier screen's own tag-add idiom rather than a
// native prompt(). Rebuilds itself locally (never the global render()) so it stays safe to use
// mid-form, before the rest of the expense has been saved. Reflects the choice in place and
// exposes .get()/.set().
function expCatPicker(current) {
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

// Titles ("On what?") the traveller has typed two or more times before, most-used first —
// offered as one-tap chips so a repeat expense (the daily coffee, the nightly room) never
// needs retyping. Each remembers the category most often paired with that exact title, so
// tapping the chip fills in both the name and the right bucket in one go.
function frequentExpenseTitles() {
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
// A row of quick-pick chips for frequent expense titles; filling `noteEl` (and, when given,
// selecting the matching bucket on `catPicker`) in one tap. Returns null if nothing qualifies.
function expTitleChips(noteEl, catPicker) {
  const freq = frequentExpenseTitles();
  if (!freq.length) return null;
  return h('div', { class: 'chips exp-title-chips' }, freq.map((f) =>
    h('button', { type: 'button', class: 'chip ghost', onclick: () => { noteEl.value = f.title; if (catPicker) catPicker.set(f.category); } }, f.title)));
}

// The one "Log an expense" card, used everywhere a spend can be logged — Budget & Expenses
// (#expenses) is the master; My Trip's budget log and Home's one-tap spend (quickSpendRow)
// both reuse this exact function now instead of their own, slightly different inline forms,
// so logging an expense looks and works identically no matter where you tap in from.
// `opts.currency` seeds the currency picker (falls back to THB); `opts.afterAdd(item)` runs
// after a successful add — typically a re-render/navigation back to the calling screen.
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
    h('h2', { style: 'margin-top:0' }, 'Log an expense'),
    h('div', { style: 'display:flex;gap:10px' }, [field('Amount', bAmt), field('Currency', bCur)]),
    field('On what?', bNote), bChips, field('Category', bCat), monthlyToggle, dateField,
    h('button', { class: 'btn block', style: 'margin-top:8px', onclick: add }, '＋ Add expense'),
  ]);
}

// Budget target in home currency, per whole trip or per day. Stored in prefs so it
// self-persists; null means "no target set yet".
export function budgetTarget() { const t = store.profile.prefs.budgetCap; return (t && +t.amount > 0) ? { amount: +t.amount, per: t.per === 'day' ? 'day' : 'trip' } : null; }
function setBudgetTarget(amount, per) { store.profile.prefs.budgetCap = { amount: +amount || 0, per: per === 'day' ? 'day' : 'trip' }; save(); }

// Trip span in whole days. A start/end set directly in Budget (prefs.tripDates — see
// budgetSetupEditor) wins when present, so a traveller gets budget/withdrawal stats without
// ever having to plan stop-by-stop in My Trip; otherwise falls back to whatever the stops +
// logged spends imply, as before. elapsed = start→today; total = start→end, or null if no end
// is known yet (including an explicitly "undecided" end — see budgetSetupEditor). Returns null
// only if no start date exists anywhere.
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

// Inline donut chart from [{value,color}]; radius makes the circumference 100 so each
// segment length equals its percentage. Centre shows a headline + sub-label.
function donutSVG(segs, centerTop, centerSub) {
  const total = segs.reduce((s, x) => s + (x.value > 0 ? x.value : 0), 0);
  let acc = 0;
  const ring = total > 0 ? segs.filter((s) => s.value > 0).map((s) => {
    const pct = s.value / total * 100;
    const el = `<circle cx="21" cy="21" r="15.91549" fill="none" stroke="${s.color}" stroke-width="5.5" stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}" stroke-dashoffset="${(25 - acc).toFixed(2)}"/>`;
    acc += pct; return el;
  }).join('') : '<circle cx="21" cy="21" r="15.91549" fill="none" stroke="var(--line)" stroke-width="5.5"/>';
  return `<svg class="donut" viewBox="0 0 42 42" role="img" aria-label="Spending by category">${ring}<text x="21" y="20.3" class="donut-top" text-anchor="middle">${esc(String(centerTop || ''))}</text><text x="21" y="25.6" class="donut-sub" text-anchor="middle">${esc(String(centerSub || ''))}</text></svg>`;
}

// The budget picture: donut + legend, remaining vs a target, and a spend-trend projection.
export function budgetSummaryCard() {
  const log = store.trip.budgetLog || [];
  const target = budgetTarget();
  const dates = store.profile.prefs.tripDates;
  if (!log.length && !target && !(dates && dates.start)) {
    // Nothing to summarise yet — still surface the one place to set a budget and trip dates,
    // rather than making the traveller log an expense first just to find it.
    const card = h('div', { class: 'card budget-card' });
    card.append(h('h2', { style: 'margin-top:0' }, '💰 Budget'));
    card.append(h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Log an expense below, or set a budget and your trip dates here to see stats before you do.'));
    card.append(budgetSetupEditor());
    return card;
  }
  const home = homeCurrency();
  const cats = expCatsAll();
  const sums = {}; cats.forEach((c) => { sums[c.id] = 0; });
  let spent = 0, unknown = false;
  log.forEach((b) => {
    const amt = parseFloat(b.amount) || 0; if (!amt) return;
    const cc = b.currency || home;
    const conv = cc === home ? amt : convert(amt, cc, home);
    if (conv == null || isNaN(conv)) { unknown = true; return; }
    sums[expCatOf(b)] += conv; spent += conv;
  });
  const segs = cats.map((c) => ({ value: sums[c.id], color: c.color }));
  const card = h('div', { class: 'card budget-card' });
  card.append(h('h2', { style: 'margin-top:0' }, '💰 Budget'));

  const donut = h('div', { class: 'budget-donut', html: donutSVG(segs, spent > 0 ? Math.round(spent).toLocaleString() : '—', home) });
  // Legend rows sort biggest-first and carry each category's share of total spend alongside
  // its amount — "what percentage of spending is on each category," the fun/informative
  // per-category stat requested for the budget section, right next to the donut it explains.
  // cats includes any custom categories the traveller has added — they show up here exactly
  // like the 5 built-ins, never in a separate list.
  const legend = h('div', { class: 'budget-legend' });
  cats.filter((c) => sums[c.id] > 0).sort((a, b) => sums[b.id] - sums[a.id]).forEach((c) => {
    const pct = spent > 0 ? Math.round(sums[c.id] / spent * 100) : 0;
    legend.append(h('div', { class: 'blg-row' }, [
      h('span', { class: 'blg-dot', style: `background:${c.color}` }),
      h('span', { class: 'blg-lbl' }, `${c.emoji} ${c.label}`),
      h('span', { class: 'blg-val' }, `${Math.round(sums[c.id]).toLocaleString()} ${home} · ${pct}%`),
    ]));
  });
  if (!segs.some((s) => s.value > 0)) legend.append(h('p', { class: 'muted tiny', style: 'margin:0' }, 'Log a few expenses to see the breakdown.'));
  card.append(h('div', { class: 'budget-head' }, [donut, legend]));

  if (target) {
    const span = tripSpanDays();
    const dailyRate = span && span.elapsed > 0 ? spent / span.elapsed : spent;
    if (target.per === 'trip') {
      const remaining = target.amount - spent;
      const pctSpent = Math.round(spent / target.amount * 100);
      card.append(h('div', { class: 'budget-bar' }, [h('span', { class: 'budget-bar-fill' + (remaining < 0 ? ' over' : ''), style: `width:${Math.min(100, Math.max(0, spent / target.amount * 100))}%` })]));
      card.append(h('p', { style: 'margin:6px 0 0' }, [
        h('strong', { style: remaining < 0 ? 'color:var(--magenta)' : '' }, remaining >= 0 ? `${Math.round(remaining).toLocaleString()} ${home} left` : `${Math.round(-remaining).toLocaleString()} ${home} over`),
        h('span', { class: 'muted' }, ` of ${target.amount.toLocaleString()} ${home} · ${pctSpent}% spent`),
      ]));
      if (span && span.total && spent > 0) {
        const projected = dailyRate * span.total; const diff = projected - target.amount;
        card.append(h('p', { class: 'budget-proj ' + (diff > 0 ? 'over' : 'under') }, `${diff > 0 ? '⚠️' : '✓'} At ~${Math.round(dailyRate).toLocaleString()} ${home}/day, you are on track to ${diff > 0 ? 'go over by ' + Math.round(diff).toLocaleString() : 'finish ' + Math.round(-diff).toLocaleString() + ' under'} ${home} across ${span.total} days.`));
      } else if (spent > 0) {
        card.append(h('p', { class: 'muted tiny', style: 'margin:4px 0 0' }, `Spending ~${Math.round(dailyRate).toLocaleString()} ${home}/day so far. Add trip dates in My trip for a full projection.`));
      }
    } else {
      const overUnder = dailyRate - target.amount;
      card.append(h('p', { style: 'margin:6px 0 0' }, [
        h('strong', { style: overUnder > 0 ? 'color:var(--magenta)' : '' }, `~${Math.round(dailyRate).toLocaleString()} ${home}/day`),
        h('span', { class: 'muted' }, ` vs ${target.amount.toLocaleString()} ${home}/day budget`),
      ]));
      if (spent > 0) card.append(h('p', { class: 'budget-proj ' + (overUnder > 0 ? 'over' : 'under') }, overUnder > 0 ? `⚠️ About ${Math.round(overUnder).toLocaleString()} ${home}/day over budget at this rate.` : `✓ About ${Math.round(-overUnder).toLocaleString()} ${home}/day under budget — nicely on track.`));
    }
  }
  if (unknown) card.append(h('p', { class: 'muted tiny', style: 'margin:4px 0 0' }, 'Some expenses use a currency with no cached rate — refresh in Currency to include them.'));
  card.append(budgetSetupEditor());
  return card;
}

// A compact currency-converter card for the Budget screen — same fxConverterControl() as the
// standalone Currency screen, backed by the exact same cached rates (convert()/getRates() from
// currency.js). Defaults mirror the standalone screen's own default direction (home currency →
// wherever focusSpot() says the traveller actually is). Sits right after the budget summary in
// Budget & Expenses (see expensesScreen), rendered plainly with no fold — nothing here needs
// hiding — per direct request to keep it "simple, lean and elegant."
function budgetFxCard() {
  const home = homeCurrency();
  const fc = focusSpot().spot.country || getActiveCountry();
  const c = getCountry(fc);
  const local = c ? c.currency : 'THB';
  return h('div', { class: 'card' }, [
    h('h2', { style: 'margin-top:0' }, '💱 Currency converter'),
    fxConverterControl(home, local),
    h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#currency') }, 'Full converter, quick guide & cash-swap →'),
  ]);
}

// A quick visual read on spending trend — one stacked bar per day for the last 14 days,
// segmented and colour-coded by category (the exact same colours as the donut/legend above,
// via expCatsAll()) so a glance shows not just how much but on what. Tallest day's total sets
// the scale. Purely a glance-and-go on top of the precise numbers in the legend above; gated
// on a handful of entries so a brand-new trip is not shown a meaningless flat chart. Monthly-
// flagged entries (see expenseAddCard) are excluded — a whole month's rent would otherwise
// dwarf the scale and flatten every real daily bar to nothing.
function budgetTrendCard() {
  const log = (store.trip.budgetLog || []).filter((b) => !b.monthly);
  if (log.length < 3) return null;
  const home = homeCurrency();
  const cats = expCatsAll();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  // Per day, per category — same shape budgetSummaryCard sums across the whole trip, just
  // sliced one day at a time so each bar can stack its own category segments.
  const byDay = Object.fromEntries(days.map((d) => [d, {}]));
  let any = false;
  log.forEach((b) => {
    if (!(b.date in byDay)) return;
    const amt = parseFloat(b.amount) || 0; if (!amt) return;
    const cc = b.currency || home;
    const conv = cc === home ? amt : convert(amt, cc, home);
    if (conv == null || isNaN(conv)) return;
    const cat = expCatOf(b);
    byDay[b.date][cat] = (byDay[b.date][cat] || 0) + conv; any = true;
  });
  if (!any) return null;
  const dayTotal = (sums) => Object.values(sums).reduce((s, v) => s + v, 0);
  const max = Math.max(...days.map((d) => dayTotal(byDay[d])), 1);
  const bars = days.map((d) => {
    const sums = byDay[d];
    const total = dayTotal(sums);
    const dObj = new Date(`${d}T00:00`);
    const dLbl = isNaN(dObj) ? d : dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    // Stacked bottom-up in a fixed category order (column-reverse in CSS) so the same
    // category always occupies the same band across every bar, day to day.
    const segs = cats.filter((c) => sums[c.id] > 0).map((c) => h('span', {
      style: `height:${Math.max(2, sums[c.id] / max * 100)}%;background:${c.color}`,
      title: `${dLbl} · ${c.emoji} ${c.label}: ${Math.round(sums[c.id]).toLocaleString()} ${home}`,
    }));
    return h('div', { class: 'spark-bar', 'aria-label': `${dLbl}: ${Math.round(total).toLocaleString()} ${home}` },
      segs.length ? segs : [h('span', { style: 'height:0;background:var(--line)' })]);
  });
  const card = h('div', { class: 'card' });
  card.append(h('div', { class: 'row-between' }, [h('h2', { style: 'margin:0' }, '📈 Daily spend, last 14 days'), infoTip('Colour-coded by category — same colours as the breakdown above.')]));
  card.append(h('div', { class: 'spark-row' }, bars));
  return card;
}

// Shared accent for anything to do with cash withdrawals — the donut segment, the row icon,
// the "Withdrawn" legend dot — so it reads as one consistent, distinct colour wherever it
// shows up, never confusable with a category colour from expCatsAll().
const WD_COLOR = '#B15C2E';

// Optional cash-withdrawal budget, independent of the whole-trip spending target above — a
// traveller who wants to say "I only plan to withdraw 1,500 USD in cash" without that number
// getting tangled up in total trip spending can set one here. Falls back to the whole-trip
// target (when it applies per-trip, not per-day) so nothing regresses for anyone who never
// touches this — the withdrawals wheel simply keeps working exactly as it did before.
function withdrawalTarget() {
  const custom = store.profile.prefs.withdrawalCap;
  if (custom && +custom.amount > 0) return { amount: +custom.amount, custom: true };
  const bt = budgetTarget();
  return (bt && bt.per === 'trip') ? { amount: bt.amount, custom: false } : null;
}
function setWithdrawalTarget(amount) { store.profile.prefs.withdrawalCap = amount ? { amount: +amount || 0 } : null; save(); }
function withdrawalTargetEditor() {
  const home = homeCurrency();
  const custom = store.profile.prefs.withdrawalCap;
  const det = h('details', { class: 'budget-set' });
  det.append(h('summary', {}, custom ? '✎ Change cash budget' : '＋ Set a separate cash budget'));
  const amt = h('input', { type: 'number', inputmode: 'decimal', placeholder: `Amount in ${home}`, value: custom ? custom.amount : '' });
  det.append(field(`Cash budget (${home})`, amt));
  det.append(h('div', { class: 'row-between', style: 'margin-top:6px' }, [
    custom ? h('button', { class: 'btn ghost', onclick: () => { setWithdrawalTarget(null); render(); } }, 'Clear') : h('span', {}, ''),
    h('button', { class: 'btn', onclick: () => { if (amt.value) { setWithdrawalTarget(amt.value); render(); } } }, 'Save'),
  ]));
  return det;
}

// A second, separate way to read "how much of my budget is gone" — cash withdrawn/drawn
// against the trip, tracked independently of the itemised per-category log above. Day-to-day
// spending usually comes out of exactly this cash, but logging every small purchase is
// unrealistic in practice while remembering "I took out 10,000 THB at that ATM" usually is not
// — so this is often the more honest number, and it is kept as its own wheel rather than folded
// into the category donut so neither reading masks the other. Deliberately not surfaced on
// Home — see budgetSummaryCard/quickSpendRow there — this lives only in the Budget screen.
function budgetWithdrawalsCard() {
  const home = homeCurrency();
  const wTarget = withdrawalTarget();
  const list = (store.trip.withdrawals || []).slice();
  let total = 0, unknown = false;
  list.forEach((w) => {
    const amt = parseFloat(w.amount) || 0; if (!amt) return;
    const cc = w.currency || home;
    const conv = cc === home ? amt : convert(amt, cc, home);
    if (conv == null || isNaN(conv)) { unknown = true; return; }
    total += conv;
  });
  const card = h('div', { class: 'card budget-card withdrawals-card' });
  card.append(h('h2', { style: 'margin-top:0' }, '🏧 Cash withdrawals'));
  card.append(h('p', { class: 'muted', style: 'margin:4px 0 10px' }, 'Cash pulled out, tracked separately from itemised spending.'));

  if (wTarget) {
    const remaining = Math.max(0, wTarget.amount - total);
    const segs = [{ value: total, color: WD_COLOR }, { value: remaining, color: 'var(--line)' }];
    const donut = h('div', { class: 'budget-donut', html: donutSVG(segs, total > 0 ? Math.round(total).toLocaleString() : '—', home) });
    const legend = h('div', { class: 'budget-legend' }, [
      h('div', { class: 'blg-row' }, [h('span', { class: 'blg-dot', style: `background:${WD_COLOR}` }), h('span', { class: 'blg-lbl' }, 'Withdrawn'), h('span', { class: 'blg-val' }, `${Math.round(total).toLocaleString()} ${home} · ${Math.round(total / wTarget.amount * 100)}%`)]),
      h('div', { class: 'blg-row' }, [h('span', { class: 'blg-dot', style: 'background:var(--line)' }), h('span', { class: 'blg-lbl' }, 'Left in budget'), h('span', { class: 'blg-val' }, `${Math.round(remaining).toLocaleString()} ${home}`)]),
    ]);
    card.append(h('div', { class: 'budget-head' }, [donut, legend]));
    if (!wTarget.custom) card.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 8px' }, 'Using your whole-trip budget — set a separate one below to track this on its own.'));

    // Pace: the same percentage read on two different clocks — how far through the trip vs.
    // how far through this budget's been withdrawn. "% of trip elapsed" needs a known trip
    // length (see tripSpanDays/budgetSetupEditor); with no end date, or an explicitly
    // "undecided" one, only the withdrawn share shows — a percentage of an unknown-length trip
    // is not a real number.
    const span = tripSpanDays();
    const withdrawnPct = Math.round(total / wTarget.amount * 100);
    if (span && span.total) {
      const elapsedPct = Math.min(100, Math.round(span.elapsed / span.total * 100));
      const diff = withdrawnPct - elapsedPct;
      card.append(h('div', { class: 'pace-row' }, [
        h('span', { class: 'pace-lbl' }, `${elapsedPct}% of trip elapsed`),
        h('div', { class: 'budget-bar pace-bar' }, [h('span', { class: 'budget-bar-fill pace-fill-trip', style: `width:${elapsedPct}%` })]),
      ]));
      card.append(h('div', { class: 'pace-row' }, [
        h('span', { class: 'pace-lbl' }, `${Math.min(999, withdrawnPct)}% of budget withdrawn`),
        h('div', { class: 'budget-bar pace-bar' }, [h('span', { class: 'budget-bar-fill pace-fill-wd' + (diff > 8 ? ' over' : ''), style: `width:${Math.min(100, withdrawnPct)}%` })]),
      ]));
      card.append(h('p', { class: 'budget-proj ' + (diff > 8 ? 'over' : 'under'), style: 'margin:4px 0 10px' },
        Math.abs(diff) <= 8 ? '✓ right on pace with the trip.' : diff > 8 ? `⚠️ withdrawing faster than the trip is passing (+${diff} pts).` : `✓ under pace — ${-diff} pts of runway to spare.`));
    } else {
      card.append(h('div', { class: 'pace-row', style: 'margin-bottom:8px' }, [
        h('span', { class: 'pace-lbl' }, `${Math.min(999, withdrawnPct)}% of budget withdrawn`),
        h('div', { class: 'budget-bar pace-bar' }, [h('span', { class: 'budget-bar-fill pace-fill-wd', style: `width:${Math.min(100, withdrawnPct)}%` })]),
      ]));
    }
  } else {
    card.append(h('p', { style: 'margin:0 0 10px' }, [
      h('strong', {}, `${total.toLocaleString()} ${home}`), h('span', { class: 'muted' }, ' withdrawn so far'),
    ]));
    card.append(h('p', { class: 'muted tiny', style: 'margin:-6px 0 10px' }, 'Set a budget below to see this as a share of a total.'));
  }
  if (unknown) card.append(h('p', { class: 'muted tiny', style: 'margin:0 0 8px' }, 'Some withdrawals use a currency with no cached rate — refresh in Currency to include them.'));
  card.append(withdrawalTargetEditor());

  const wAmt = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Amount', 'aria-label': 'Withdrawal amount' });
  const wCur = currencySelect(home);
  const wDate = h('input', { type: 'date', value: todayISO() });
  const wNote = h('input', { type: 'text', placeholder: 'e.g. Bangkok airport ATM', 'aria-label': 'Note' });
  const det = h('details', { class: 'budget-set' });
  det.append(h('summary', {}, '＋ Log a withdrawal'));
  det.append(
    h('div', { style: 'display:flex;gap:10px' }, [field('Amount', wAmt), field('Currency', wCur)]),
    field('Note (optional)', wNote), field('Date', wDate),
    h('button', { class: 'btn block', style: 'margin-top:6px', onclick: () => { if (!wAmt.value) return; addWithdrawal({ amount: wAmt.value, currency: wCur.value, date: wDate.value, note: wNote.value.trim() }); render(); } }, '＋ Add withdrawal'),
  );
  card.append(det);

  // Editable and minimizeable — same idiom as Recent expenses (collapsibleCard over an
  // h2-led block), just nested inside this card instead of standing alone.
  if (list.length) {
    const recent = h('div', {}, [h('h2', { style: 'margin:12px 0 4px' }, 'Recent withdrawals')]);
    list.slice().reverse().slice(0, 20).forEach((w) => recent.append(withdrawalRow(w)));
    card.append(collapsibleCard(recent, 'budgetRecentWithdrawalsOpen', false));
  }
  return card;
}

// A withdrawal row that flips to an inline editor — mirrors budgetLogRow so a mis-entered
// amount, currency, note, or date can be corrected, not only deleted.
function withdrawalRow(w) {
  if (editWithdrawalId === w.id) {
    const amt = h('input', { type: 'number', inputmode: 'decimal', value: w.amount });
    const cur = currencySelect(w.currency || homeCurrency());
    const dt = h('input', { type: 'date', value: w.date || todayISO() });
    const note = h('input', { type: 'text', value: w.note || '', placeholder: 'e.g. Bangkok airport ATM' });
    return h('div', { class: 'card', style: 'margin:6px 0' }, [
      h('div', { style: 'display:flex;gap:10px' }, [field('Amount', amt), field('Currency', cur)]),
      field('Note (optional)', note), field('Date', dt),
      h('div', { class: 'row-between', style: 'margin-top:6px' }, [
        h('button', { class: 'btn ghost', onclick: () => { editWithdrawalId = null; render(); } }, 'Cancel'),
        h('button', { class: 'btn', onclick: () => { updateWithdrawal(w.id, { amount: amt.value, currency: cur.value, note: note.value.trim(), date: dt.value || w.date }); editWithdrawalId = null; render(); } }, 'Save'),
      ]),
    ]);
  }
  const approx = approxHome(w.amount, w.currency);
  return h('div', { class: 'exp-row' }, [
    h('span', { class: 'exp-row-cat', style: `background:${WD_COLOR}22;color:${WD_COLOR}` }, '🏧'),
    h('div', { class: 'exp-row-mid' }, [
      h('div', { class: 'exp-row-note' }, w.note || 'Withdrawal'),
      h('div', { class: 'exp-row-date muted' }, fmtLogDate(w.date)),
    ]),
    h('div', { class: 'exp-row-amt' }, [
      h('strong', {}, `${w.amount} ${w.currency}`),
      approx ? h('span', { class: 'muted exp-row-approx' }, approx) : null,
    ]),
    h('div', { class: 'exp-row-actions' }, [
      h('button', { class: 'chip', 'aria-label': 'Edit this withdrawal', onclick: () => { editWithdrawalId = w.id; render(); } }, '✎'),
      h('button', { class: 'chip', 'aria-label': 'Delete this withdrawal', onclick: () => { confirmAction({ title: 'Delete this withdrawal?', confirmLabel: 'Delete', danger: true }).then((ok) => { if (ok) { deleteWithdrawal(w.id); render(); } }); } }, '✕'),
    ]),
  ]);
}

// Asks for both things the budget/withdrawals stats actually need — a spending target AND the
// trip's start/end dates — in one fold, since neither is much use without the other and a
// traveller should not have to plan stop-by-stop in My Trip just to see a spend projection.
// End date has its own "Undecided" checkbox: tripSpanDays() then knows the trip length is
// unknown rather than treating a blank end as "ends today," so pace stats correctly drop any
// "% of trip elapsed" reading instead of showing a meaningless one (see budgetWithdrawalsCard).
function budgetSetupEditor() {
  const home = homeCurrency();
  const t = budgetTarget();
  const dates = store.profile.prefs.tripDates || {};
  const det = h('details', { class: 'budget-set' });
  det.append(h('summary', {}, (t || dates.start) ? '✎ Change budget & dates' : '＋ Set your budget & trip dates'));
  const amt = h('input', { type: 'number', inputmode: 'decimal', placeholder: `Amount in ${home}`, value: t ? t.amount : '' });
  const per = selectEl(['Whole trip', 'Per day'], t && t.per === 'day' ? 'Per day' : 'Whole trip', () => {}, 'Budget applies to');
  const startEl = h('input', { type: 'date', value: dates.start || '' });
  const isUndecided = !!(dates.start && !dates.end);
  const endEl = h('input', { type: 'date', value: dates.end || '', disabled: isUndecided ? '' : null });
  const undecided = h('input', { type: 'checkbox', checked: isUndecided });
  undecided.addEventListener('change', () => { endEl.disabled = undecided.checked; if (undecided.checked) endEl.value = ''; });
  det.append(
    field(`Budget (${home})`, amt), field('Applies to', per),
    field('Trip start', startEl), field('Trip end', endEl),
    h('label', { class: 'exp-monthly-toggle' }, [undecided, ' End date undecided']),
  );
  det.append(h('div', { class: 'row-between', style: 'margin-top:6px' }, [
    (t || dates.start) ? h('button', { class: 'btn ghost', onclick: () => { confirmAction({ title: 'Clear budget & trip dates?', confirmLabel: 'Clear', danger: true }).then((ok) => { if (ok) { store.profile.prefs.budgetCap = null; store.profile.prefs.tripDates = null; save(); render(); } }); } }, 'Clear') : h('span', {}, ''),
    h('button', {
      class: 'btn',
      onclick: () => {
        if (amt.value) setBudgetTarget(amt.value, per.value === 'Per day' ? 'day' : 'trip');
        if (startEl.value) store.profile.prefs.tripDates = { start: startEl.value, end: undecided.checked ? null : (endEl.value || null) };
        save(); render();
      },
    }, 'Save'),
  ]));
  return det;
}

// A short, locale-aware date label for the expense list ("Today", "Yesterday", or a short date).
function fmtLogDate(iso) {
  if (!iso) return '';
  const t = todayISO();
  if (iso === t) return 'Today';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`) return 'Yesterday';
  const d = new Date(`${iso}T00:00`);
  return isNaN(d) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
// Same, but a monthly-flagged item (rent, a SIM plan — logged against the whole month rather
// than one day, see expenseAddCard's "monthly expense" toggle) reads as "August 2026", not the
// 1st of the month it is actually stored against.
function fmtLogDateFor(b) {
  if (b && b.monthly && b.date) {
    const d = new Date(`${b.date}T00:00`);
    if (!isNaN(d)) return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  return fmtLogDate(b ? b.date : '');
}
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

// Quick expense logger for money-on-the-road — shares the same budget log as My Trip, so
// spends logged here show up there and roll into the home-currency total.
export function expensesScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Budget', '#me'));
  const fc = focusSpot().spot.country || getActiveCountry();
  const c = getCountry(fc);

  // Budget section leads — donut, remaining/projection, and the spend trend right beneath it —
  // per direct request ("start with budget section then currency converter").
  const summary = budgetSummaryCard();
  if (summary) wrap.append(summary);
  const trend = budgetTrendCard(); if (trend) wrap.append(trend);

  // Currency converter next: its own separate, simple section — no fold, nothing to hide —
  // still useful before anything has ever been logged.
  wrap.append(budgetFxCard());

  wrap.append(expenseAddCard({ currency: c ? c.currency : 'THB', afterAdd: () => go('#expenses') }));

  const log = store.trip.budgetLog.slice().reverse();
  if (log.length) {
    const list = h('div', { class: 'card' }, [h('h2', {}, 'Recent expenses')]);
    log.slice(0, 50).forEach((b) => list.append(budgetLogRow(b)));
    wrap.append(collapsibleCard(list, 'budgetRecentOpen', false));
  } else {
    wrap.append(h('p', { class: 'empty' }, 'No expenses logged yet — add your first above.'));
  }

  // Cash withdrawals come after logging an expense, deliberately last — a second, separate
  // wheel and log, not the same card as the categorised summary above (see
  // budgetWithdrawalsCard for why).
  wrap.append(budgetWithdrawalsCard());

  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#trip') }, 'See full trip & budget'));
  mount(wrap, '#me');
}
