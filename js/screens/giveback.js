// Give back — donating to causes that work in the region the traveller is actually in, with a
// calculator that starts from what they have already logged spending rather than an abstract
// figure.
//
// Established non-profits, each verified to an official site (2026-07). The app never
// processes money — every entry is a plain outbound link to the organisation's own site,
// exactly like the booking deep links. People-focused, spanning all four countries.
//
// Extracted from main.js as a lazy, route-scoped screen (#donate). The three loading and
// unavailable screens that used to sit under this same banner did NOT come with it: they are
// router infrastructure that happened to be appended here, and countryLoadingScreen,
// screenLoadingScreen and screenUnavailableScreen are all called by render() itself. Moving
// them would have made the router depend on a lazily-loaded module in order to show the
// loading state for a lazily-loaded module.
import { store, save } from '../state.js';
import { h, money } from '../util.js';
import { field, screenHint } from '../ui-widgets.js';
import { sourcesNote } from '../render-utils.js';
import { convert } from '../currency.js';
import { mount, topbar, homeCurrency } from '../main.js';

const DONATE_ORGS = [
  { scope: 'Across the region', flag: '🌏', items: [
    { name: 'MAG (Mines Advisory Group)', what: 'Finds and clears landmines and unexploded bombs left by war in Cambodia, Laos and Vietnam, so families can farm and children can play safely.', url: 'https://www.maginternational.org/' },
    { name: 'Friends-International', what: 'Protects urban children and marginalised young people and trains them for work, across Cambodia, Laos and Thailand.', url: 'https://friends-international.org/' },
  ] },
  { scope: 'Thailand', flag: '🇹🇭', items: [
    { name: 'The Mercy Centre (HDF)', what: 'Kindergartens, shelter and daily care for children of Bangkok’s Klong Toey community, serving the city’s poorest families since 1972.', url: 'https://mercycentre.org/' },
  ] },
  { scope: 'Vietnam', flag: '🇻🇳', items: [
    { name: 'Blue Dragon Children’s Foundation', what: 'Rescues children from trafficking and slavery and helps street kids rebuild their lives, based in Hanoi.', url: 'https://www.bluedragon.org/donate/' },
  ] },
  { scope: 'Cambodia', flag: '🇰🇭', items: [
    { name: 'Cambodian Children’s Fund', what: 'Education, healthcare, childcare and family support in one of Phnom Penh’s poorest areas, Steung Meanchey.', url: 'https://www.cambodianchildrensfund.org/donate' },
  ] },
  { scope: 'Laos', flag: '🇱🇦', items: [
    { name: 'COPE', what: 'Free prosthetic limbs and rehabilitation for survivors of unexploded bombs, run from the visitor centre in Vientiane.', url: 'https://copelaos.org/' },
    { name: 'Big Brother Mouse', what: 'A Lao-owned literacy project publishing books and running reading parties for village children, from Luang Prabang.', url: 'https://www.bigbrothermouse.com/' },
  ] },
];

// Recognised giving-effectiveness references, cited in-app for the "how much to give"
// tool. Not financial advice — a suggestion the traveller is free to ignore.
const GIVING_SOURCES = [
  { org: 'Giving What We Can (10% pledge)', url: 'https://www.givingwhatwecan.org/' },
  { org: 'The Life You Can Save', url: 'https://www.thelifeyoucansave.org/' },
];

// Total logged trip spend converted to the home currency, or null if nothing is logged
// or a rate is unknown — lets the giving tool prefill "% of trip spend" from real data.
function loggedTripSpendHome() {
  const home = homeCurrency();
  let sum = 0, known = true;
  (store.trip.budgetLog || []).forEach((b) => {
    const cur = b.currency || home;
    const amt = parseFloat(b.amount) || 0;
    if (cur === home) { sum += amt; return; }
    const c = convert(amt, cur, home);
    if (c == null || isNaN(c)) known = false; else sum += c;
  });
  return known && sum > 0 ? Math.round(sum) : null;
}

// A private, opt-in "how much to give?" calculator. Three framings (a % of trip spend,
// a per-day amount over the length of stay, or a % of income). Everything typed stays on
// the device and is NEVER saved or sent — only the non-sensitive preset (method + %) is
// remembered. The app processes no money; the amount is a suggestion to give on the
// charity's own site.
function givingCalculator() {
  const home = homeCurrency();
  const g = store.profile.prefs.giving = store.profile.prefs.giving || { method: 'trip', pct: 1, perDay: 2, incPct: 1, days: '' };
  const card = h('div', { class: 'card give-back' }, [h('h2', {}, '🧮 How much to give?')]);
  card.append(h('p', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 var(--sp-2)' }, 'Giving is personal and entirely optional. Pick an amount whichever way suits you. Anything you type stays on this device and is never saved or sent — only the amount you choose to give, on the charity’s own site.'));

  const methods = [['trip', '💸 % of trip spend'], ['day', '📅 Per day here'], ['income', '💰 % of income']];
  const methodRow = h('div', { class: 'chips' });
  const body = h('div', {});
  const result = h('p', { style: 'font-weight:800;font-size:1.25rem;margin: var(--sp-3) 0 var(--sp-0h)' });
  const note = h('p', { class: 'tiny muted', style: 'margin: 0' });
  const fmt = (v) => money(Math.max(0, Math.round(v || 0)), home);
  const setResult = (v, sub) => { result.textContent = `Suggested: ${fmt(v)}`; note.textContent = sub || ''; };
  const press = (row, el) => { row.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false')); el.setAttribute('aria-pressed', 'true'); };

  function renderBody() {
    body.innerHTML = '';
    if (g.method === 'trip') {
      const logged = loggedTripSpendHome();
      const amt = h('input', { type: 'number', inputmode: 'decimal', min: '0', placeholder: `Your trip spend in ${home}`, value: logged != null ? logged : '' });
      body.append(field(`Trip spend (${home})${logged != null ? ' — from your logged budget' : ''}`, amt));
      const pctRow = h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [0.5, 1, 2, 5].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.pct === p ? 'true' : 'false', onclick: (e) => { g.pct = p; save(); press(pctRow, e.currentTarget); calc(); } }, `${p}%`)));
      body.append(pctRow);
      const calc = () => { const n = parseFloat(amt.value) || 0; setResult(n * (g.pct / 100), `${g.pct}% of ${fmt(n)}. Many travellers give around 1% of their trip budget to local causes.`); };
      amt.addEventListener('input', calc); calc();
    } else if (g.method === 'day') {
      const days = h('input', { type: 'number', inputmode: 'numeric', min: '0', placeholder: 'Days in the region', value: g.days || '' });
      body.append(field('Days in the region', days));
      const perRow = h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [1, 2, 5, 10].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.perDay === p ? 'true' : 'false', onclick: (e) => { g.perDay = p; save(); press(perRow, e.currentTarget); calc(); } }, `${money(p, home)}/day`)));
      body.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 var(--sp-0h)' }, 'Amount per day'), perRow);
      const calc = () => { const d = parseFloat(days.value) || 0; g.days = days.value; setResult(d * g.perDay, `${money(g.perDay, home)} × ${d || 0} day${d === 1 ? '' : 's'}. A small daily amount adds up over a trip.`); };
      days.addEventListener('input', () => { save(); calc(); }); calc();
    } else {
      const inc = h('input', { type: 'number', inputmode: 'decimal', min: '0', placeholder: `Your monthly income in ${home}` });
      body.append(field(`Monthly income (${home}) — not saved`, inc));
      const pctRow = h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [0.5, 1, 2].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.incPct === p ? 'true' : 'false', onclick: (e) => { g.incPct = p; save(); press(pctRow, e.currentTarget); calc(); } }, `${p}% of a month`)));
      body.append(pctRow);
      body.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, 'Giving What We Can suggests pledging 10% of annual income to effective charities — a trip gift can be a first step.'));
      const calc = () => { const n = parseFloat(inc.value) || 0; const pct = g.incPct || 1; setResult(n * (pct / 100), `${pct}% of one month’s income (${fmt(n)}).`); };
      inc.addEventListener('input', calc); calc();
    }
  }
  methods.forEach(([id, label]) => methodRow.append(h('button', { class: 'chip', 'aria-pressed': g.method === id ? 'true' : 'false',
    onclick: (e) => { g.method = id; save(); press(methodRow, e.currentTarget); renderBody(); } }, label)));
  card.append(methodRow, body, result, note);
  card.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, 'A suggestion, not a rule — give what feels right, or give your time instead. Choose a cause below to give on its official site.'));
  card.append(sourcesNote(GIVING_SOURCES, '2026-07'));
  renderBody();
  return card;
}

export function donateScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Give back', '#home'));
  wrap.append(screenHint('Established non-profits working directly with people across Thailand, Vietnam, Cambodia and Laos. Each opens the organisation’s own official website, where you donate directly and securely.'));
  wrap.append(h('div', { class: 'banner' }, 'Mekonging takes no money and no cut, and never processes a payment. These links open external sites and need internet. Please do your own checks before giving.'));
  wrap.append(givingCalculator());
  DONATE_ORGS.forEach((grp) => {
    wrap.append(h('h2', { class: 'cat-title' }, `${grp.flag} ${grp.scope}`));
    grp.items.forEach((o) => wrap.append(h('div', { class: 'card donate-card' }, [
      h('strong', {}, o.name),
      h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, o.what),
      h('a', { class: 'btn ghost block', href: o.url, target: '_blank', rel: 'noopener noreferrer' }, 'Visit official site ↗'),
    ])));
  });
  wrap.append(h('p', { class: 'muted', style: 'margin-top: var(--sp-3)' }, 'Prefer to help in person? Eating at their training restaurants, buying their books, or volunteering supports the same work — ask at each organisation’s visitor centre.'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Mekonging is not affiliated with these organisations and receives nothing from them. This is a starting point, not vetting or financial advice — confirm each charity independently before donating.'));
  mount(wrap, '#home');
}
