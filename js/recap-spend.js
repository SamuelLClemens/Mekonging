// What the traveller spent, in their home currency: the ONE conversion both Home's short summary (js/screens/home.js) and the
// trip recap (js/recap-data.js) read, so the two totals cannot disagree. A leaf on purpose: it imports no screen, so Home (eager)
// can use it without loading anything else. An amount at or below zero is ignored; an entry in a currency with no rate is not
// added to the total but is reported (`left`), never converted by guess.
import { store } from './state.js';
import { convert } from './currency.js';
import { homeCurrency } from './main.js';

export const amountOf = (b) => { const n = parseFloat(b && b.amount); return Number.isFinite(n) && n > 0 ? n : 0; };

// The amount in `home`, or null when no rate is held for `cur` (an entry with no currency counts as unknown).
export function inHome(v, cur, home) {
  if (cur === home) return v;
  const c = cur ? convert(v, cur, home) : null;
  return c == null || !Number.isFinite(c) ? null : c;
}

// { home, total, any, allKnown }: the converted total, whether anything was logged, and whether every entry had a rate.
export function spendTotal() {
  const home = homeCurrency();
  let total = 0, any = false, allKnown = true;
  (store.trip.budgetLog || []).forEach((b) => {
    const v = amountOf(b);
    if (!v) return;
    any = true;
    const c = inHome(v, b.currency || '', home);
    if (c == null) allKnown = false; else total += c;
  });
  return { home, total, any, allKnown };
}
