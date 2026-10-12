// The Traveller Board — the backendless, link-based bulletin board (#exchange, #swap, #market).
// A listing lives on THIS device and reaches anyone else only inside a link its poster shares
// (js/social.js). Extracted from main.js as a lazy, route-scoped screen module (Exchange slice M1,
// docs/EXCHANGE.md §17) with no behaviour change. It stays as the offline fallback once the shared
// Market lands.
//
// EVERYTHING DECODED FROM A LINK IS UNTRUSTED and is rendered as text only (h() text children).
//
// bbCat/bbHeadline/bbSubline/swapCalcNodes are exported for js/screens/circle.js, which renders a
// preview of a shared listing with the same dictionary. The file is named for its route: the
// `board` screen key already belongs to the Local noticeboard (js/screens/board.js).
import { h, money } from '../util.js';
import { getLastFix, ensureMe, addListing, removeListing, getListings } from '../state.js';
import { field, confirmAction, currencySelect } from '../ui-widgets.js';
import { seaAgo } from '../render-utils.js';
import { getCountry } from '../data/regions.js';
import { getActiveCountry } from '../app-state.js';
import { getRates, convert } from '../currency.js';
import { shareUrl, encodeShare } from '../social.js';
import { go, mount, topbar, shareButton, homeCurrency, whereAmI } from '../main.js';

// ---- TRAVELLER BOARD (backendless bulletin board) ---------------------------
// One peer board that fits the app's no-server, no-PII model: swap leftover cash,
// split a ride, pass on a room, hand off a car seat / stroller / bike / camping
// kit / SIM, or post anything else. A listing lives on THIS device and travels
// only inside a link the user chooses to share (same mechanism as the travel
// circle — AirDrop / chat / etc). Cash-swap values use the offline mid-market
// rate table, so both sides agree on a fair number.

const BB_CATS = [
  { id: 'swap', emoji: '💱', label: 'Cash swap', color: '#16a34a', blurb: 'Swap leftover cash at the fair mid-market rate — no booth, no fees.' },
  { id: 'ride', emoji: '🚗', label: 'Ride share', color: '#2563eb', blurb: 'Share a car, taxi or minibus and split the cost.' },
  { id: 'house', emoji: '🏠', label: 'Stay share', color: '#4f46e5', blurb: 'A spare room, a place to crash, or split a rental.' },
  { id: 'kids', emoji: '🧸', label: 'Kids & baby', color: '#d97706', blurb: 'Car seats, strollers, carriers, toys, kids clothing.' },
  { id: 'gear', emoji: '🎒', label: 'Gear & bikes', color: '#0891b2', blurb: 'Motorbikes, bicycles, camping kit, a leftover SIM.' },
  { id: 'other', emoji: '📦', label: 'Other', color: '#6b7280', blurb: 'Free giveaways, wanted, or anything else.' },
];
export function bbCat(id) { return BB_CATS.find((c) => c.id === id) || { id: 'other', emoji: '📦', label: 'Listing', color: '#6b7280', blurb: '' }; }
// Sub-kind options per category (value + labelled option), for the item picker.
function bbSubKinds(cat) {
  if (cat === 'kids') return [['carseat', '🚼 Car seat'], ['stroller', '🍼 Stroller / pram'], ['carrier', '👶 Baby carrier'], ['toys', '🧸 Toys'], ['clothing', '🧥 Kids clothing'], ['other', '📦 Other kids item']];
  if (cat === 'gear') return [['motorbike', '🏍 Motorbike / scooter'], ['bicycle', '🚲 Bicycle'], ['camping', '⛺ Camping / trekking'], ['sim', '📶 SIM / e-SIM'], ['clothing', '🧥 Clothing / boots'], ['other', '🎒 Other gear']];
  return [['free', '🎁 Free / giveaway'], ['sale', '🏷 For sale'], ['wanted', '🙋 Wanted'], ['other', '📦 Other']];
}
const HOUSE_KIND = { room: 'Room / bed', place: 'Whole place', looking: 'Looking for a place' };
// fmtMoney now comes from js/currency.js — see the note there on why the private copy went.

// A listing's one-line headline and a short subline, shared by the card + import views.
export function bbHeadline(cat, d) {
  if (cat === 'swap') return `${money((d.have && d.have.a) || 0, (d.have && d.have.c) || '?')} → ${(d.want && d.want.c) || '?'}`;
  if (cat === 'ride') return `${d.from || '?'} → ${d.to || '?'}`;
  if (cat === 'house') return d.title || HOUSE_KIND[d.g] || 'Stay share';
  return d.title || 'Item';
}
export function bbSubline(cat, d) {
  if (cat === 'ride') return [d.when, d.seats ? `${d.seats} seat${d.seats === 1 ? '' : 's'}` : '', (d.price && d.price.a) ? `${money(d.price.a, d.price.c)} share` : ''].filter(Boolean).join(' · ');
  if (cat === 'house') return [HOUSE_KIND[d.g] || '', d.when, (d.price && d.price.a) ? money(d.price.a, d.price.c) : ''].filter(Boolean).join(' · ');
  if (cat !== 'swap' && d.price && d.price.a) return money(d.price.a, d.price.c);
  return '';
}
// A category-appropriate safety line (shown under each post form).
function bbSafety(cat) {
  if (cat === 'swap') return 'Never type card or bank details; exchange cash in person in a safe, public place.';
  if (cat === 'ride') return 'Agree the cost up front and share your live location with a friend. You travel at your own risk.';
  if (cat === 'house') return 'See the place before you pay. Never wire a deposit to someone you have not met.';
  if (cat === 'kids') return 'Check safety items — car seats, helmets, carriers — for damage and expiry before use.';
  return 'Meet in a safe, public place. For a motorbike, check the papers and never leave your passport as a deposit.';
}

// Fair mid-market value + an honest "what a booth would keep" range, as text nodes.
export function swapCalcNodes(a, have, want) {
  if (have === want) return [document.createTextNode('Pick two different currencies.')];
  if (!a) return [document.createTextNode('Enter an amount to see the fair mid-market value.')];
  const got = convert(a, have, want);
  if (got == null) return [document.createTextNode('No offline rate for this pair yet — open Currency with internet once to refresh.')];
  return [
    h('strong', { class: 'fair' }, `${money(a, have)} ≈ ${money(got, want)}`),
    document.createTextNode(` at mid-market. A money changer usually keeps ~3–7%, so roughly ${money(got * 0.03, want)}–${money(got * 0.07, want)} stays between you two.`),
  ];
}

// Best-effort nearest town name (for pre-filling a listing's "where"), else the country.
function guessCityName() {
  const fix = getLastFix();
  if (fix) { try { const w = whereAmI(fix); if (w && w.name) return w.name; } catch { /* noop */ } }
  const c = getCountry(getActiveCountry()); return c ? c.name : '';
}

// A "paste a shared link" importer: opens the payload exactly as tapping the link would.
function pasteLinkBox(hint) {
  // aria-label, not just the placeholder: a placeholder is announced as a value and vanishes
  // as soon as the field has content, leaving the box unnamed.
  const label = hint || 'Paste a link a traveller sent you';
  const inp = h('input', { type: 'text', placeholder: label, 'aria-label': label, style: 'width:100%' });
  return h('div', { class: 'card' }, [
    // h2, not h3: this is a card heading and the card beside it on the same screen uses h2, so
    // an h3 here skipped a level in the outline for no reason.
    h('h2', {}, '📥 Got a link?'),
    inp,
    h('button', { class: 'btn ghost block btn-spaced', onclick: () => {
      const m = String(inp.value || '').match(/#(.+)$/);
      if (m && m[1]) location.hash = '#' + m[1].trim();
    } }, 'Open the link'),
  ]);
}

// A listing's "posted N ago" line. Time-sensitive categories (a shared ride, a cash
// swap) are flagged "may be past" once they age, so a board that lives on a device and
// travels by link over days or weeks stays honest instead of accumulating dead posts.
const BB_STALE_DAYS = { ride: 3, swap: 7 };
function listingIsStale(it) {
  const lim = BB_STALE_DAYS[it && it.cat];
  return !!(lim && it && it.ts && (Date.now() - it.ts) > lim * 86400000);
}

// One listing card (any category) with a share link and a remove control.
function listingCard(it) {
  const d = it.data || {};
  const cat = it.cat || 'other';
  const meta = bbCat(cat);
  const card = h('div', { class: 'card listing-card', style: `--cat:${meta.color}` });
  card.append(h('h3', {}, `${meta.emoji} ${bbHeadline(cat, d)}`));
  if (cat === 'swap') {
    card.append(h('p', { class: 'muted small' }, swapCalcNodes((d.have && d.have.a) || 0, d.have && d.have.c, d.want && d.want.c)));
  } else {
    const sub = bbSubline(cat, d);
    if (sub) card.append(h('p', { class: 'small', style: 'font-weight:700' }, sub));
  }
  const metaLine = [meta.label, d.city, it.mine ? 'Your post' : (it.from ? `From ${it.from.name}` : 'Saved')].filter(Boolean).join(' · ');
  if (metaLine) card.append(h('p', { class: 'tiny muted' }, metaLine));
  if (it.ts) {
    const stale = listingIsStale(it);
    card.append(h('p', { class: stale ? 'tiny listing-stale' : 'tiny muted' }, `Posted ${seaAgo(it.ts)}${stale ? ' · may be past' : ''}`));
  }
  if (d.note) card.append(h('p', {}, d.note));
  if (d.contact) card.append(h('p', { class: 'small' }, `Reach: ${d.contact}`));
  card.append(h('div', { class: 'listing-actions' }, [
    shareButton('🔗 Share this', meta.label, () => shareUrl('in', encodeShare('bb', Object.assign({ cat }, d), ensureMe(), '')), 'btn ghost'),
    h('button', { class: 'btn ghost', onclick: () => { confirmAction({ title: 'Remove this listing?', confirmLabel: 'Remove', danger: true }).then((ok) => { if (ok) { removeListing(it.id); go('#exchange-' + cat); } }); } }, '🗑 Remove'),
  ]));
  return card;
}

// A category-adaptive "post to the board" form. Re-created when the category changes.
function buildBBForm(cat) {
  const c = getCountry(getActiveCountry());
  const meta = bbCat(cat);
  const card = h('div', { class: 'card' });
  card.append(h('h2', {}, `${meta.emoji} Post: ${meta.label}`));

  const cityIn = h('input', { type: 'text', value: guessCityName(), placeholder: 'Where (town / area)', maxLength: 40 });
  const noteIn = h('input', { type: 'text', placeholder: 'Notes (optional)', maxLength: 400 });
  const contactIn = h('input', { type: 'text', placeholder: 'How to reach you — your choice', maxLength: 80 });

  let collect, valid, firstEl;
  if (cat === 'swap') {
    const haveSel = currencySelect(c ? c.currency : 'THB');
    const haveAmt = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Amount', min: '0' });
    const wantSel = currencySelect(homeCurrency());
    const calc = h('p', { class: 'muted small swap-calc' });
    const upd = () => calc.replaceChildren(...swapCalcNodes(parseFloat(haveAmt.value) || 0, haveSel.value, wantSel.value));
    haveAmt.addEventListener('input', upd); haveSel.addEventListener('change', upd); wantSel.addEventListener('change', upd);
    card.append(field('I have', haveSel), field('Amount', haveAmt), field('I want', wantSel), calc);
    upd(); firstEl = haveAmt;
    valid = () => (parseFloat(haveAmt.value) || 0) > 0;
    collect = () => ({ have: { c: haveSel.value, a: parseFloat(haveAmt.value) || 0 }, want: { c: wantSel.value } });
  } else if (cat === 'ride') {
    const fromIn = h('input', { type: 'text', value: guessCityName(), placeholder: 'From (e.g. Pai)', maxLength: 40 });
    const toIn = h('input', { type: 'text', placeholder: 'To (e.g. Chiang Mai)', maxLength: 40 });
    const whenIn = h('input', { type: 'text', placeholder: 'When (e.g. Sat 9am)', maxLength: 40 });
    const seatsIn = h('input', { type: 'number', placeholder: 'Seats', min: '0' });
    const priceAmt = h('input', { type: 'number', placeholder: 'Cost share (optional)', min: '0' });
    const priceCur = currencySelect(c ? c.currency : 'THB');
    card.append(field('From', fromIn), field('To', toIn), field('When', whenIn), field('Seats', seatsIn), field('Cost share', priceAmt), field('Currency', priceCur));
    firstEl = toIn;
    valid = () => fromIn.value.trim() && toIn.value.trim();
    collect = () => ({ from: fromIn.value.trim(), to: toIn.value.trim(), when: whenIn.value.trim(), seats: parseFloat(seatsIn.value) || 0, price: { a: parseFloat(priceAmt.value) || 0, c: priceCur.value } });
  } else if (cat === 'house') {
    const kindSel = h('select', { 'aria-label': 'Kind' }, Object.entries(HOUSE_KIND).map(([v, l]) => h('option', { value: v }, l)));
    const titleIn = h('input', { type: 'text', placeholder: 'Short title (e.g. Spare room, 2 nights)', maxLength: 80 });
    const whenIn = h('input', { type: 'text', placeholder: 'Dates (optional)', maxLength: 40 });
    const priceAmt = h('input', { type: 'number', placeholder: 'Price / split (optional)', min: '0' });
    const priceCur = currencySelect(c ? c.currency : 'THB');
    card.append(field('Type', kindSel), field('Title', titleIn), field('Dates', whenIn), field('Price', priceAmt), field('Currency', priceCur));
    firstEl = titleIn;
    valid = () => titleIn.value.trim();
    collect = () => ({ g: kindSel.value, title: titleIn.value.trim(), when: whenIn.value.trim(), price: { a: parseFloat(priceAmt.value) || 0, c: priceCur.value } });
  } else {
    const subSel = h('select', { 'aria-label': 'What is it' }, bbSubKinds(cat).map(([v, l]) => h('option', { value: v }, l)));
    const titleIn = h('input', { type: 'text', placeholder: 'What is it', maxLength: 80 });
    const priceAmt = h('input', { type: 'number', inputmode: 'decimal', placeholder: 'Price (blank = free / offers)', min: '0' });
    const priceCur = currencySelect(c ? c.currency : 'THB');
    card.append(field('Item', subSel), field('Title', titleIn), field('Price', priceAmt), field('Currency', priceCur));
    firstEl = titleIn;
    valid = () => titleIn.value.trim();
    collect = () => ({ g: subSel.value, title: titleIn.value.trim(), price: { a: parseFloat(priceAmt.value) || 0, c: priceCur.value } });
  }

  card.append(field('Where', cityIn), field('Note', noteIn), field('Contact', contactIn));
  card.append(h('button', { class: 'btn block', onclick: () => {
    if (valid && !valid()) { if (firstEl) firstEl.focus(); return; }
    const data = Object.assign(collect(), { city: cityIn.value.trim(), note: noteIn.value.trim(), contact: contactIn.value.trim() });
    addListing({ cat, mine: true, data });
    go('#exchange-' + cat);
  } }, '＋ Post to the board'));
  card.append(h('p', { class: 'tiny muted' }, `Stays on your device until you share its link. ${bbSafety(cat)}`));
  return card;
}

// The Traveller Board: a backendless bulletin board with category tabs. Cash swap,
// ride share, stay/room share, kids & baby gear, bikes & gear, and a general bucket.
export function bulletinScreen(arg) {
  let cat = BB_CATS.some((c) => c.id === arg) ? arg : 'all';
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Traveller board', '#home'));
  wrap.append(h('p', { class: 'lead' }, 'Swap cash, split a ride, pass on a room, hand off a car seat, a bike or camping kit — post it, share the link, meet in person. No account, no server; nothing leaves your phone on its own.'));
  const rates = getRates();
  if (!rates.live) wrap.append(h('p', { class: 'tiny muted' }, 'Cash-swap values use offline baseline rates. Open Currency with internet once to refresh them.'));

  // Invite a fellow traveller so the board actually has two sides. Shares the app link to
  // the board itself — no server, no account; they open it and can post their own listings.
  wrap.append(shareButton('📣 Invite a traveller to this board', 'Mekonging Traveller Board', () => `${location.origin}${location.pathname}#exchange`, 'btn ghost block'));

  const chips = h('div', { class: 'chips bb-chips' });
  const formWrap = h('div', {});
  const listWrap = h('div', {});
  wrap.append(chips, formWrap, pasteLinkBox('Paste a board link a traveller sent'), listWrap);

  function repaint() {
    chips.innerHTML = '';
    const mk = (id, label, color) => h('button', { class: 'chip bb-chip', dataset: { c: id }, style: color ? `--chip:${color}` : '', 'aria-pressed': cat === id ? 'true' : 'false', onclick: () => { cat = id; repaint(); } }, label);
    chips.append(mk('all', '📋 All'));
    BB_CATS.forEach((c) => chips.append(mk(c.id, `${c.emoji} ${c.label}`, c.color)));

    formWrap.innerHTML = '';
    if (cat === 'all') {
      formWrap.append(h('p', { class: 'muted small', style: 'margin: var(--sp-0h) var(--sp-0h) var(--sp-2)' }, 'Pick a category above to post, or browse everything below.'));
    } else {
      formWrap.append(h('p', { class: 'muted small', style: 'margin: var(--sp-0h) var(--sp-0h) var(--sp-1h)' }, bbCat(cat).blurb));
      formWrap.append(buildBBForm(cat));
    }

    listWrap.innerHTML = '';
    const all = getListings();
    const items = cat === 'all' ? all : all.filter((x) => x.cat === cat);
    listWrap.append(h('h2', { class: 'home-section' }, `${cat === 'all' ? 'On your board' : bbCat(cat).label} · ${items.length}`));
    if (!items.length) listWrap.append(h('p', { class: 'empty' }, 'Nothing here yet. Pick a category to post, or open a link a traveller sends you.'));
    // Let the traveller sweep away their own long-past posts in one tap (backendless tidy).
    const old = items.filter((x) => x.mine && x.ts && (Date.now() - x.ts) > 14 * 86400000);
    if (old.length) {
      listWrap.append(h('button', { class: 'btn ghost block tiny', onclick: () => { confirmAction({ title: `Clear ${old.length} old post${old.length > 1 ? 's' : ''}?`, confirmLabel: 'Clear', danger: true }).then((ok) => { if (ok) { old.forEach((s) => removeListing(s.id)); repaint(); } }); } },
        `🧹 Clear ${old.length} old post${old.length > 1 ? 's' : ''} of yours (over 2 weeks)`));
    }
    items.forEach((it) => listWrap.append(listingCard(it)));
  }
  repaint();
  mount(wrap, '#home');
}
