// The remaining two "Know this country" screens (js/nav-groups.js) not already moved to
// js/screens/country-info.js in the prior split slice: "Just arrived" (arrivalScreen) and
// "Country guide" (infoScreen). Kept in a second, separate file rather than reopening that
// one — the two were roughly 950 lines apart in main.js, not physically adjacent like the
// six that already moved, so there was nothing to lose by keeping this a clean, independent
// slice. Extracted from main.js (module split, main.js size-reduction pass).
import { h, titleCase } from '../util.js';
import { getCountry } from '../data/regions.js';
import { getArrival } from '../data/arrival.js';
import { getEssentials } from '../data/essentials.js';
import { getVisa } from '../data/visa.js';
import { store } from '../state.js';
import { screenHint, netMode } from '../ui-widgets.js';
import { sourcesNote, citySlug } from '../render-utils.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { go, mount, topbar, focusSpot, countryChips, render } from '../main.js';

// The full "just arrived / first hour" assistant, keyed to where the traveller lands:
// airport→town transport for that gateway, cash without fees, a SIM/eSIM, safe water,
// and profile-aware links (baby, accessibility). Fully offline.
const GW_NAME = { bangkok: 'Bangkok', 'chiang-mai': 'Chiang Mai', phuket: 'Phuket', krabi: 'Krabi', 'koh-samui': 'Koh Samui', hanoi: 'Hanoi', hcmc: 'Ho Chi Minh City', 'da-nang': 'Da Nang', 'siem-reap': 'Siem Reap', 'phnom-penh': 'Phnom Penh', vientiane: 'Vientiane', 'luang-prabang': 'Luang Prabang' };
let arrivalPick = '';
function arrivalScreen(arg) {
  const fs = focusSpot(arg && getCountry(arg) ? arg : undefined);
  const spot = fs.spot;
  const cc = spot.country;
  const c = getCountry(cc);
  const prefs = store.profile.prefs;
  const GATEWAYS = { th: ['bangkok', 'chiang-mai', 'phuket', 'krabi', 'koh-samui'], vi: ['hanoi', 'hcmc', 'da-nang'], kh: ['siem-reap', 'phnom-penh'], la: ['vientiane', 'luang-prabang'] };
  const gws = GATEWAYS[cc] || [];
  if (arrivalPick && !gws.includes(arrivalPick)) arrivalPick = '';
  const focusSlug = citySlug(spot.city);
  const activeGw = arrivalPick || (gws.includes(focusSlug) ? focusSlug : (gws[0] || ''));
  const arr = getArrival(activeGw);

  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Just arrived', '#home'));
  wrap.append(screenHint(`Your first hour in ${c ? c.name : 'the country'} — cash, a SIM, and the cheapest safe way from the airport into town. It all works offline.`));
  wrap.append(countryChips((id) => { arrivalPick = ''; go(`#arrival-${id}`); }, cc));
  if (gws.length > 1) {
    const gwRow = h('div', { class: 'chips' });
    gws.forEach((s) => gwRow.append(h('button', { class: 'chip', 'aria-pressed': s === activeGw ? 'true' : 'false', onclick: () => { arrivalPick = s; render(); } }, `🛫 ${GW_NAME[s] || titleCase(s.replace(/-/g, ' '))}`)));
    wrap.append(gwRow);
  }

  if (arr) {
    const t = h('div', { class: 'card' }, [h('h2', {}, `🚕 ${arr.airport}`)]);
    arr.options.forEach((o) => t.append(h('div', { class: 'board-row' }, [
      h('strong', {}, o.mode),
      h('div', { class: 'tiny muted' }, `${o.detail}${o.fare ? ` · 💰 ${o.fare}` : ''}`),
      o.tip ? h('div', { class: 'list-note' }, o.tip) : null,
    ])));
    if (arr.scam) t.append(h('p', { class: 'disclaimer', style: 'margin-bottom: 0' }, `⚠️ ${arr.scam}`));
    wrap.append(t);
  }

  const ess = getEssentials(cc);
  const cash = ess && (ess.items || []).find((i) => /cash/i.test(i.item));
  const sim = ess && (ess.items || []).find((i) => /sim/i.test(i.item));

  const cashCard = h('div', { class: 'card' }, [h('h2', {}, '💵 Cash without the fees')]);
  cashCard.append(h('p', {}, cash ? cash.cheapest : 'Use a bank ATM rather than an airport counter, and withdraw a larger amount to spread the per-use fee.'));
  if (cash && cash.price && cash.price !== '—') cashCard.append(h('p', { class: 'tiny muted' }, `💰 ${cash.price}`));
  if (cash && cash.tip) cashCard.append(h('div', { class: 'list-note' }, cash.tip));
  cashCard.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#currency') }, 'Open the currency converter'));
  wrap.append(cashCard);

  const simCard = h('div', { class: 'card' }, [h('h2', {}, '📶 Get online (SIM / eSIM)')]);
  simCard.append(h('p', {}, sim ? sim.cheapest : 'Pick up a tourist SIM at a phone shop in town rather than the airport counter.'));
  if (sim && sim.price) simCard.append(h('p', { class: 'tiny muted' }, `💰 ${sim.price}`));
  simCard.append(h('div', { class: 'list-note' }, 'Want data the moment you land? Buy a travel eSIM (e.g. Airalo, Holafly) before you fly and activate on arrival — a local SIM in town is usually cheaper for a longer stay.'));
  simCard.append(h('div', { class: 'list-note' }, `You may not need much data: this whole app works offline once loaded. ${netMode() === 'online' ? 'You are set to use data.' : 'You are in offline mode — switch data on from Home when you want it.'}`));
  wrap.append(simCard);

  const foodCard = h('div', { class: 'card' }, [h('h2', {}, '🚰 Water & your first meal')]);
  foodCard.append(h('p', {}, prefs.withBaby
    ? 'Bottled or filtered water only, for everyone. The busiest stalls — food hot and cooked to order — are safest; for little ones start with plain rice and noodle dishes.'
    : 'Bottled or filtered water only. The busiest stalls with high turnover are usually safest: food is cooked to order, not left sitting.'));
  wrap.append(foodCard);

  // Six rows, four of them conditional, each previously carrying its own margin-top:6px
  // while the h2 above contributed 8px — two different small gaps in one card. stack-2 puts
  // every gap on the 8px step and lets an absent row take its gap with it.
  const doCard = h('div', { class: 'card stack-2' }, [h('h2', {}, '🧭 Settle in')]);
  doCard.append(h('button', { class: 'btn ghost block', onclick: () => go('#places') }, '🏠 Save where I am staying on the map'));
  if (c && c.lang) doCard.append(h('button', { class: 'btn ghost block', onclick: () => go(`#phrasebook-${c.lang}`) }, '💬 First words — hello, thanks, numbers'));
  doCard.append(h('button', { class: 'btn ghost block', onclick: () => go(`#sos-${cc}`) }, '🆘 Emergency numbers here'));
  doCard.append(h('button', { class: 'btn ghost block', onclick: () => go(`#scams-${cc}`) }, '⚠️ Common scams — and how to avoid them'));
  if (getVisa(cc)) doCard.append(h('button', { class: 'btn ghost block', onclick: () => go(`#visa-${cc}`) }, '🛂 Entry & visa rules'));
  doCard.append(h('button', { class: 'btn ghost block', onclick: () => go('#nearby') }, '📍 What’s near me right now'));
  wrap.append(doCard);

  if (prefs.withBaby || (prefs.access || []).length) {
    const you = h('div', { class: 'card' }, [h('h2', {}, 'For your trip')]);
    if (prefs.withBaby) you.append(h('button', { class: 'btn ghost block', onclick: () => go(`#baby-${cc}`) }, '🍼 Baby: nappies, formula & family help'));
    if ((prefs.access || []).length) you.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#access-${cc}`) }, '♿ Accessibility guidance here'));
    wrap.append(you);
  }

  mount(wrap, 'home');
}

// ---- COUNTRY INFO -----------------------------------------------------------
function infoScreen(countryId) {
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  const country = getCountry(getActiveCountry());
  wrap.append(topbar(country ? `${country.name} guide` : 'Country guide', country ? `#country-${getActiveCountry()}` : '#home'));
  wrap.append(countryChips((id) => go(`#info-${id}`)));

  const info = country && country.info;
  if (!info) {
    wrap.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} guide is coming soon.`));
    mount(wrap, '#home'); return;
  }
  // emergency numbers
  const em = h('div', { class: 'card' }, [h('h2', {}, 'Emergency numbers')]);
  info.emergency.forEach((e) => em.append(h('div', { class: 'row-between' }, [h('span', {}, e.label), h('strong', {}, e.number)])));
  wrap.append(em);

  // sections accordion
  const acc = h('div', { class: 'card' });
  info.sections.forEach((s) => {
    const det = h('details', { class: 'acc' }, [h('summary', {}, s.title)]);
    s.body.forEach((para) => det.append(h('p', {}, para)));
    if (s.verifyAt) det.append(h('p', { class: 'muted' }, [
      'Verify at: ', h('a', { href: s.verifyAt.url, target: '_blank', rel: 'noopener' }, s.verifyAt.org),
    ]));
    acc.append(det);
  });
  // deep history (from the side-car guide module, when present)
  const g = country.guide;
  if (g && Array.isArray(g.history) && g.history.length) {
    const hist = h('details', { class: 'acc' }, [h('summary', {}, `History of ${country.name}`)]);
    g.history.forEach((par) => hist.append(h('p', {}, par)));
    acc.append(hist);
  }
  wrap.append(acc);
  // laws & safety the traveller must know (current-year facts)
  if (g && Array.isArray(g.laws) && g.laws.length) {
    const laws = h('div', { class: 'card' }, [h('h2', {}, 'Laws & safety you must know')]);
    g.laws.forEach((l) => laws.append(h('div', { class: 'warn-note' }, typeof l === 'string' ? l : `${l.title}: ${l.body}`)));
    wrap.append(laws);
  }
  const allSources = (g && Array.isArray(g.sources) && g.sources.length) ? g.sources : info.sources;
  wrap.append(sourcesNote(allSources, info.verified));
  mount(wrap, '#home');
}

export { arrivalScreen, infoScreen };
