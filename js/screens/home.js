// Home — "What now?" The present moment: adapts to trip phase (planning / arrived /
// traveling / post), shows today rather than everything. See OVERHAUL.md section 3.
//
// Rebuilt per the Home interview (OVERHAUL.md section 11, 2026-08-06). Three status
// surfaces were requested (a slim identity bar, a right-now situation line, a whole-trip
// status row) and are kept from duplicating each other by giving each a distinct time
// horizon — see the section's "Decisions" table. No placeholder chip ever renders: a status
// cell either carries a real value or is simply absent (rank-collapse-never-remove — nothing
// is deleted from navigation, an empty cell just does not draw until it has something to say).
//
// This is also the Great Split's proof case (OVERHAUL.md section 9, F2): most of Home's own
// helpers (phaseSwitchRow, homeStageBlock, ensureHomeWeather, budgetSummaryCard, topbar,
// cityAboutCard, etc.) still live in main.js — exported from there and imported back here via
// a circular import, safe because every one is only read inside a function body, never at
// module-evaluation time. New Home-specific logic introduced by this rebuild (the trip status
// row, the situation line, the next-stop card) is written directly in this file instead,
// since it belongs to Home alone.

import { store, save, unreadInboxCount } from '../state.js';
import { h } from '../util.js';
import { getCountry, loadCountry, isCountryLoaded, loadAllCountries } from '../data/regions.js';
import { getActiveCountry } from '../app-state.js';
import { getCachedWeather, spotKey, wmo } from '../weather.js';
import { fmtTemp } from '../render-utils.js';
import { convert } from '../currency.js';
import { planRoutes, isRouteNode } from '../journey.js';
import {
  go, mount, topbar, ICON, contextNow, setupRecapCard, maybeOfferTour,
  inferPhase, focusSpot, phaseSwitchRow, homeStatusBand, homeStageBlock,
  ensureHomeWeather, budgetSummaryCard, idPinCount, sectionTile,
  citySlug, cityAboutCard, todayISO, addDaysISO, daysUntilISO, budgetTarget, tripSpanDays, homeCurrency,
} from '../main.js';

const PHASE_META = {
  planning: { emoji: '🗺️', label: 'Planning' },
  arrived: { emoji: '🛬', label: 'Arrived' },
  traveling: { emoji: '🧭', label: 'Travelling' },
  post: { emoji: '📖', label: 'Post' },
};

export function homeScreen() {
  // "Right now" picks below need this country's place data; Home itself must never block
  // on it — the router's lazy-load gate (render()) deliberately excludes 'home' so first
  // paint stays instant even before any country has loaded. Kick the load off here in the
  // background instead, and quietly repaint Home in place (scroll position preserved) once
  // it lands, so the picks correct themselves rather than reading empty all session.
  if (!isCountryLoaded(getActiveCountry())) {
    const cc = getActiveCountry();
    loadCountry(cc).then(() => {
      const headRoute = (location.hash || '#home').slice(1).split('-')[0];
      if ((headRoute === '' || headRoute === 'home') && isCountryLoaded(cc)) {
        const y = window.scrollY;
        homeScreen();
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }).catch(() => { /* offline with nothing cached yet — leave today's honest fallback tip up */ });
  }

  const wrap = h('div', { class: 'screen' });

  // The four journey buttons sit inside the collapsed Trip status row below, with the active
  // stage highlighted, so a traveller sets or switches their phase in one tap. Home no longer
  // hides the picker once a phase is chosen, and the country map lives on the Explore tab.
  const storedPhase = store.profile.prefs.phase || '';
  const phase = storedPhase || inferPhase();   // infer a sensible stage until they choose one
  const focus = focusSpot();
  const leadCC = focus.spot.country;
  const onGround = (phase === 'arrived' || phase === 'traveling');

  // H1 — slim identity + safety bar, replaces the old collapsing hero. Reusing topbar() (no
  // backHash — Home is a root tab) brings the 🆘 emergency button, Saved and Settings icons for
  // free: Home was previously the only screen without 🆘, since the hero displaced the top bar.
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  wrap.append(topbar(`📍 ${focus.spot.city || 'Your trip'} · ${dateLabel}`, null));

  // NAV-1: one-shot "here is what I set up for you" recap, right after finishing the
  // value-first first run — proof that the few taps already personalised the app.
  if (store.profile.prefs.showSetupRecap) wrap.append(setupRecapCard());

  // H2 — Trip status: the whole-trip view (stage, dates, next plan, total spend, offline),
  // collapsed by default so it never competes with today's content. Collapsing removes
  // nothing from navigation — every value here still has its own full screen — an individual
  // chip simply does not render until it has a real value (see homeStatusBand in main.js).
  wrap.append(tripStatusRow(phase, storedPhase, leadCC));

  // H3 — situation line: right-now weather, spend TODAY (not the trip total — that is the
  // status row's job), and a next-stop nudge. Ground phases only; a traveller still planning
  // or looking back has no "right now" to report.
  const ctx = contextNow();
  if (onGround) {
    const line = situationLine(ctx, leadCC);
    if (line) wrap.append(line);
  }

  // One stage-appropriate situational block. Planning gets a forward-looking outlook +
  // countdown + checklist hub (no near-me); arrived/travelling get the live, forecast-aware
  // near-me card; post gets the return recap. This is what makes Home fit the traveller's
  // actual stage instead of showing "what's near you" to someone still at home or already back.
  wrap.append(homeStageBlock(phase, leadCC));

  // H4 — next-stop card: real transport options between where you are and your next planned
  // stop. Background-loads all four countries' route data (journey.js's route graph memoises
  // across all of them on first build, so it must never run before that finishes) and quietly
  // fills in or omits itself entirely if no bundled route exists — never a dead-end card.
  if (onGround) {
    const card = nextStopCard(ctx);
    if (card) wrap.append(card);
  }

  // H5 — "Where you are": real, sourced city history and context, collapsed by default.
  if (onGround) {
    const about = whereYouAreCard(leadCC, ctx.near ? ctx.near.spot.city : focus.spot.city);
    if (about) wrap.append(about);
  }

  // On the first online visit, pull the relevant city's forecast once (respects offline &
  // consent, de-duplicated) so the outlook and the "right now" forecast line populate.
  {
    const phaseSpot = onGround
      ? (ctx.near ? ctx.near.spot : focus.spot)
      : focusSpot(getCountry(leadCC) ? leadCC : undefined).spot;
    ensureHomeWeather(phaseSpot);
  }

  // Budget at a glance, right on Home: the by-category pie against the total the traveller
  // sets, plus spend-vs-budget and a one-tap "set a budget". Returns null until there is a
  // spend or a target, so a fresh Home stays uncluttered; tapping through opens the full log.
  {
    const bc = budgetSummaryCard();
    if (bc) {
      bc.style.marginTop = '10px';
      bc.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#expenses') },
        store.trip.budgetLog.length ? 'Log expense & see all →' : 'Log your first expense →'));
      wrap.append(bc);
    }
  }

  // Search everything.
  wrap.append(h('button', { class: 'btn ghost block home-search', style: 'margin:10px 0 2px', onclick: () => go('#search') }, '🔎 Search everything'));

  wrap.append(h('h2', { class: 'home-section' }, 'Plan & tools'));

  // Home now carries only TRIP-WIDE tools (planning, memories, money, admin). Everything
  // tied to a place — food, transport, weather, pools, kids, visa, nature… — lives on the
  // focused country's hub (the "Explore" button above), so there is one menu per context
  // instead of Home and the hub duplicating each other.
  const groups = [
    { label: 'Plan your trip', items: [
      { ic: ICON.route, t: 'Trip plans', d: 'Routes that fit you', hash: '#plans' },
      { ic: ICON.target, t: 'For you', d: 'Your personalised picks', hash: '#foryou' },
      { ic: ICON.suitcase, t: 'My trip', d: 'Itinerary + budget log', hash: '#trip' },
      { ic: ICON.checklist, t: 'Pre-trip checklist', d: 'Visa, health, packing', hash: '#checklist' },
      { ic: ICON.book, t: 'Travel journal', d: 'Stamped entries + map', hash: '#journal' },
      { ic: ICON.trophy, t: 'Trip scrapbook', d: 'Photo album of your trip', hash: '#scrapbook' },
      { ic: ICON.calendar, t: 'Travel calendar', d: 'Stays, meals & ratings', hash: '#calendar' },
      { ic: ICON.star, t: 'Saved & collections', d: 'Organise by theme', hash: '#saved' },
    ] },
    { label: 'Money & tools', items: [
      { ic: ICON.coins, t: 'Currency converter', d: 'Live rates, works offline', hash: '#currency' },
      { ic: ICON.suitcase, t: 'Log expenses', d: 'Track spend vs your budget', hash: '#expenses' },
      { ic: ICON.tag, t: 'Bargain helper', d: 'Counter-offers + cheapest essentials', hash: '#bargain' },
      { ic: ICON.users, t: 'Travel circle', d: 'Share, connect & message', hash: '#circle', badge: unreadInboxCount() },
      { ic: ICON.tag, t: 'Traveller board', d: 'Swap cash, rides, rooms & gear', hash: '#exchange' },
      { ic: ICON.lock, t: 'Secure documents', d: 'Encrypted on-device', hash: '#vault' },
      { ic: ICON.help, t: 'Help & FAQ', d: 'Offline vs online, how to use', hash: '#help' },
    ] },
  ];
  const tileBtn = sectionTile;
  // Decks open by RELEVANCE to the current phase rather than all-or-nothing: before/after the
  // trip a traveller plans and remembers, so the trip-planning deck (index 0) leads; on the
  // ground the recognition tools lead (see the Identify deck below). This keeps exactly one
  // deck open per phase instead of ~16 equal tiles or a mismatched default.
  const planDeckOpen = (phase === 'planning' || phase === 'post');
  groups.forEach((g, gi) => {
    wrap.append(h('details', { class: 'home-group-d', open: (gi === 0 && planDeckOpen) ? '' : null }, [
      h('summary', { class: 'home-group' }, g.label),
      h('div', { class: 'grid' }, g.items.map(tileBtn)),
    ]));
  });

  // Identify what's around you — the recognition tools (food, produce, wildlife, sounds,
  // dangerous animals) plus the traveller's own saved finds. Placed below the trip-planning
  // decks: valuable once in-country, but not the first thing a planning traveller needs.
  // Identify what's around you — a minimise/maximise disclosure (same pattern as the decks
  // above) so a traveller can fold it away once done exploring. The open/closed choice persists
  // on-device via a self-defaulting pref (no store bump) and opens by default.
  const identifyOpen = onGround;
  wrap.append(h('details', { class: 'home-group-d', open: identifyOpen ? '' : null }, [
    h('summary', {}, h('span', { class: 'home-section', style: 'margin:0' }, '🔎 Identify what’s around you')),
    h('div', { class: 'grid' }, [
      { ic: ICON.bowl, t: 'Food', d: 'Name a street dish', hash: '#food' },
      { ic: ICON.fruit, t: 'Produce', d: 'Fruit, veg & herbs', hash: '#produce' },
      { ic: ICON.leaf, t: 'Nature', d: 'Birds, fish, plants', hash: '#nature' },
      { ic: ICON.volume, t: 'Sounds', d: 'What made that call?', hash: '#sounds' },
      { ic: ICON.alert, t: 'Dangerous', d: 'Know the risks', hash: '#danger' },
      { ic: ICON.star, t: 'My identifier', d: idPinCount() ? `${idPinCount()} saved` : 'Your saved finds', hash: '#identified' },
    ].map(sectionTile)),
  ]));

  // Give back — a calm, opt-in prompt to support the people of the region you are visiting.
  wrap.append(h('div', { class: 'card give-back', style: 'margin-top:10px' }, [
    h('strong', {}, '❤️ Give back to the region'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Support trusted non-profits helping people across Thailand, Vietnam, Cambodia and Laos. The app handles no money — you give directly on each charity’s own site.'),
    h('button', { class: 'btn block', onclick: () => go('#donate') }, 'See causes to support'),
  ]));

  wrap.append(h('p', { class: 'disclaimer' },
    'Works offline. Everything stays on your device — no accounts, no tracking. Prices and rules are guidance with sources; verify locally.'));
  mount(wrap, '#home');
  maybeOfferTour();   // first-run only: a quick walk-me tour once the traveller reaches Home
}

// H2 — collapsed by default ("▸ Trip status · 🛬 Arrived"); expands to the stage picker plus
// whichever status chips currently hold a real value. A self-defaulting pref remembers the
// traveller's own open/closed choice per device, same pattern as the tool decks below.
function tripStatusRow(phase, stored, cc) {
  const meta = PHASE_META[phase] || PHASE_META.planning;
  const open = !!store.profile.prefs.tripStatusOpen;
  const details = h('details', { class: 'home-group-d trip-status', open: open ? '' : null });
  details.addEventListener('toggle', () => { store.profile.prefs.tripStatusOpen = details.open; save(); });
  details.append(h('summary', { class: 'home-group' }, `${meta.emoji} Trip status · ${meta.label}`));
  const body = h('div', { style: 'padding-top:8px' });
  body.append(phaseSwitchRow(phase, stored, false));   // the segmented control only — no repeated caption
  const chips = homeStatusBand(phase, cc);
  chips.style.marginTop = '8px';
  body.append(chips);
  details.append(body);
  return details;
}

// H3 — right-now weather (not a forecast — what it is doing now, and whether rain is likely
// today), spend TODAY against today's daily allowance (derived from a per-day cap, or a
// per-trip cap divided across the known trip length), and a plain-text next-stop nudge that
// needs no route data (the fuller H4 card below adds real transport options when they exist).
// Each cell renders only with a real value; the whole line is omitted if nothing applies.
function situationLine(ctx, cc) {
  const cells = [weatherCell(ctx), spendTodayCell(), nextStopCell()].filter(Boolean);
  if (!cells.length) return null;
  return h('div', { class: 'card home-status situation-line', role: 'group', 'aria-label': 'Right now' },
    cells.map((c) => h('button', { class: 'status-chip', onclick: c.onclick },
      [h('span', { class: 'status-ic' }, c.ic), h('span', { class: 'status-lbl' }, c.label)])));
}

function weatherCell(ctx) {
  if (!ctx.wx || ctx.wx.temp == null) return null;
  const temp = fmtTemp(ctx.wx.temp);
  if (!temp) return null;
  let rainNote = '';
  const spot = ctx.near ? ctx.near.spot : null;
  if (spot) {
    const rec = getCachedWeather(spotKey(spot));
    const today = rec && Array.isArray(rec.daily) ? rec.daily[0] : null;
    if (today && today.rainProb != null && today.rainProb >= 40) rainNote = ` · ☔ ${today.rainProb}%`;
  }
  const emoji = (wmo(ctx.wx.code) || [])[1] || '🌤';
  return { ic: emoji, label: `${temp}${rainNote}`, onclick: () => go('#weather') };
}

function spendTodayCell() {
  const home = homeCurrency();
  const t = todayISO();
  let sum = 0, any = false, allKnown = true;
  (store.trip.budgetLog || []).forEach((b) => {
    if (b.date !== t) return;
    const amt = parseFloat(b.amount) || 0; if (!amt) return;
    any = true;
    const cc = b.currency || home;
    if (cc === home) { sum += amt; return; }
    const conv = convert(amt, cc, home);
    if (conv == null || isNaN(conv)) allKnown = false; else sum += conv;
  });
  if (!any) return null;
  const target = budgetTarget();
  let allowance = null;
  if (target) {
    if (target.per === 'day') allowance = target.amount;
    else { const span = tripSpanDays(); if (span && span.total) allowance = target.amount / span.total; }
  }
  const label = allowance
    ? `${Math.round(sum).toLocaleString()}/${Math.round(allowance).toLocaleString()} ${home} today`
    : `${Math.round(sum).toLocaleString()} ${home}${allKnown ? '' : '+'} today`;
  return { ic: '💸', label, onclick: () => go('#expenses') };
}

// The traveller's next planned stop from today onward (store.trip.stops), independent of
// whether route data exists for it — this cell needs nothing but a dated stop.
function nextStop() {
  const t = todayISO();
  return (store.trip.stops || [])
    .filter((s) => s.date && s.date >= t)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0] || null;
}

function nextStopCell() {
  const stop = nextStop();
  if (!stop) return null;
  const days = daysUntilISO(stop.date);
  const when = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days}d`;
  return { ic: '🚌', label: `Next: ${stop.title} ${when}`, onclick: () => go('#trip') };
}

// H4 — real transport options to the next stop. journey.js's route graph walks every
// country's routes and memoises PERMANENTLY on first build, so isRouteNode()/planRoutes()
// must never be called before all four countries have loaded — calling either one early (even
// just to check) would build the graph from whatever is loaded so far and freeze it incomplete
// for the rest of the session. So this card checks the cache only; the very first check for a
// given from/to pair always defers to loadAllCountries().then(), never inline. Background-load,
// then quietly appear or omit — never a "checking…" placeholder and never block Home.
const _routeCache = {};
function nextStopCard(ctx) {
  const stop = nextStop();
  const fromCity = ctx.near ? ctx.near.spot.city : null;
  if (!stop || !fromCity) return null;
  const key = `${fromCity}|${stop.title}`;
  if (key in _routeCache) {
    const plans = _routeCache[key];
    if (!plans.length) return null;   // looked, found nothing (or free-text stop title matched no hub) — omit rather than show a dead end
    const pl = plans[0];
    const changes = pl.changes === 0 ? 'Direct' : `${pl.changes} change${pl.changes > 1 ? 's' : ''}`;
    const timeStr = pl.totalHrs[1] ? `~${pl.totalHrs[0]}–${pl.totalHrs[1]}h moving` : '';
    return h('div', { class: 'card next-stop-card' }, [
      h('h2', { style: 'margin-top:0' }, `🚌 Getting to ${stop.title}`),
      h('p', { style: 'margin:2px 0 8px' }, [changes, timeStr].filter(Boolean).join(' · ')),
      h('button', { class: 'btn ghost block', onclick: () => go('#route') }, 'Full journey planner →'),
    ]);
  }
  loadAllCountries().then(() => {
    _routeCache[key] = (isRouteNode(fromCity) && isRouteNode(stop.title)) ? planRoutes(fromCity, stop.title) : [];
    const headRoute = (location.hash || '#home').slice(1).split('-')[0];
    if (headRoute === '' || headRoute === 'home') {
      const y = window.scrollY;
      homeScreen();
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }).catch(() => { /* offline with nothing cached yet — simply stays absent for this session */ });
  return null;   // nothing to show until the check above resolves — never a placeholder card
}

// H5 — real, sourced city context, collapsed by default so it does not compete with today's
// content. cityAboutCard() already returns null when there is no curated history for the
// city, so this naturally omits itself rather than showing an empty card.
function whereYouAreCard(cc, cityName) {
  if (!cityName) return null;
  const inner = cityAboutCard(cc, citySlug(cityName));
  if (!inner) return null;
  const open = !!store.profile.prefs.whereYouAreOpen;
  const details = h('details', { class: 'home-group-d', open: open ? '' : null });
  details.addEventListener('toggle', () => { store.profile.prefs.whereYouAreOpen = details.open; save(); });
  details.append(h('summary', { class: 'home-group' }, '📍 Where you are'));
  details.append(inner);
  return details;
}
