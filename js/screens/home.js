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
// Chip consolidation pass: the old situation line (weather · spend today · next stop, ground
// phases only) and the separate budget donut card are both gone. Follow-up merge: Trip status
// and Quick access — two separate collapsibles, both just full of chips about the trip — are
// now one collapsible, quickAccessRow() below. It carries the phase switcher plus Calendar
// (bare label pre-trip, a running day count once the trip starts, next-plan-item folded into
// its sub) / Budget (percentage-of-budget + a green/yellow/red pace ring once a target and
// spend both exist, plain spent total otherwise) / Weather (or Scrapbook, post phase) /
// Journal — every phase, one box, nothing duplicated. Online/offline used to be a fifth chip
// here too; it now lives in the shared topbar() (main.js) instead, next to Saved/Settings/
// Emergency, reachable from every screen rather than one tap into Home's own collapsible.
//
// This is also the Great Split's proof case (OVERHAUL.md section 9, F2): most of Home's own
// helpers (phaseSwitchRow, homeStageBlock, ensureHomeWeather, topbar, cityAboutCard, etc.)
// still live in main.js — exported from there and imported back here via a circular import,
// safe because every one is only read inside a function body, never at module-evaluation
// time. New Home-specific logic introduced by this rebuild (the trip status row, the quick
// access row, the next-stop card) is written directly in this file instead, since it belongs
// to Home alone.

import { store, save, unreadInboxCount } from '../state.js';
import { h } from '../util.js';
import { getCountry, loadCountry, isCountryLoaded, loadAllCountries } from '../data/regions.js';
import { getActiveCountry } from '../app-state.js';
import { getCachedWeather, spotKey, wmo } from '../weather.js';
import { fmtTemp } from '../render-utils.js';
import { planRoutes, isRouteNode } from '../journey.js';
import { confirmAction } from '../ui-widgets.js';
import {
  go, mount, topbar, ICON, contextNow, setupRecapCard, render,
  inferPhase, focusSpot, phaseSwitchRow, homeStageBlock, homeWeatherRing,
  ensureHomeWeather, idPinCount, sectionTile, nextPlanItem, evShort, tripSpendHome,
  citySlug, cityAboutCard, todayISO, addDaysISO, tripStartISO, daysUntilISO,
  budgetTarget, tripSpanDays,
} from '../main.js';

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
  // 'arrived' used to be its own phase (separate from 'traveling'); merged into one
  // on-the-ground phase — see js/main.js PHASES. "Just arrived" now lives as its own
  // dismissible chip (justArrivedChip(), below) rather than a whole trip stage.
  const onGround = (phase === 'traveling');

  // H1 — slim identity + safety bar, replaces the old collapsing hero. Reusing topbar() (no
  // backHash — Home is a root tab) brings the 🆘 emergency button, Saved and Settings icons for
  // free: Home was previously the only screen without 🆘, since the hero displaced the top bar.
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  wrap.append(topbar(`📍 ${focus.spot.city || 'Your trip'} · ${dateLabel}`, null));

  // NAV-1: one-shot "here is what I set up for you" recap, right after finishing the
  // value-first first run — proof that the few taps already personalised the app.
  if (store.profile.prefs.showSetupRecap) wrap.append(setupRecapCard());

  // H2/H3 — Quick access: phase switcher + Calendar / Budget / Weather (Scrapbook, post) /
  // Journal / Online-offline, every phase — see quickAccessRow() below. One collapsible,
  // collapsed by default so it never competes with today's content. Collapsing removes
  // nothing from navigation — every value here still has its own full screen — an individual
  // chip simply does not render until it has a real value.
  const ctx = contextNow();
  wrap.append(quickAccessRow(phase, storedPhase, ctx));

  // "Just arrived" — a dismissible chip to the first-hour arrival guide. Only while on the
  // ground and not yet dismissed; X'd out with a confirm, then hidden until brought back
  // from Settings → Journey phase (settingsScreen, main.js) — never gone for good.
  if (onGround) {
    const ja = justArrivedChip(leadCC);
    if (ja) wrap.append(ja);
  }

  // Search everything — while travelling, this leads (moved up from its old spot just before
  // "Plan & tools") and the weather ring moves down to take its place instead, further below —
  // a straight placement swap per direct request. Other phases (no weather ring to swap with)
  // keep Search in its original trailing spot, appended near "Plan & tools" below.
  if (onGround) wrap.append(searchEverythingBtn());

  // One stage-appropriate situational block. Planning gets a forward-looking outlook +
  // countdown + checklist hub (no near-me); travelling gets the live, forecast-aware
  // near-me card; post gets the return recap. This is what makes Home fit the traveller's
  // actual stage instead of showing "what's near you" to someone still at home or already back.
  // Kept as a variable (rather than appended inline) because the planning phase needs to
  // insert Search everything into its middle, below — see that block's comment.
  const stageBlock = homeStageBlock(phase, leadCC);
  wrap.append(stageBlock);

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

  // The by-category budget donut used to render here too — dropped as a duplicated CARD (Home
  // chip consolidation): budget now shows exactly once on Home, as the Quick access row's
  // Budget chip above, still one tap from the full breakdown on #expenses.

  // Weather ring — while travelling, this now sits here (Search everything's old spot,
  // swapped up above) instead of nested at the top of the "Right now" card. Other phases never
  // had a ring, so they keep Search everything here as before.
  if (onGround) {
    const ring = homeWeatherRing();
    if (ring) wrap.append(h('div', { class: 'card home-wx-card' }, [ring]));
  } else if (phase === 'planning') {
    // Reorder per direct request: "I have arrived" (inside the countdown card, top of
    // stageBlock above) → Search everything → "Plan your trip"/"Tune 'For you'" — so Search
    // is inserted directly into stageBlock's own DOM, right before its trailing actions row,
    // rather than trailing the whole stage block as it does in every other phase. stageBlock
    // itself is built in main.js (planningStageBlock); Search everything lives only here, in
    // home.js, so DOM insertion is how the two meet without a cross-file rewrite.
    const actions = stageBlock.querySelector('.home-actions');
    if (actions) actions.before(searchEverythingBtn());
    else wrap.append(searchEverythingBtn());
  } else {
    wrap.append(searchEverythingBtn());
  }

  wrap.append(h('h2', { class: 'home-section' }, 'Plan & tools'));

  // Home now carries only TRIP-WIDE tools (planning, memories, money, admin). Everything
  // tied to a place — food, transport, weather, pools, kids, visa, nature… — lives on the
  // focused country's hub (the "Explore" button above), so there is one menu per context
  // instead of Home and the hub duplicating each other.
  //
  // Both groups render as chip rows now, not a tile grid, per direct request ("turn all the
  // things in home plan your trip and money and tools into chips") — the same .status-chip
  // look already used by quickAccessRow above and by You's own tile→chip conversion
  // (meHubScreen's chipGrp/flatChip, main.js): icon + label only (the tile descriptions are
  // dropped, same call as that earlier conversion), plus the same live " · N unread" sub and
  // red accent on Travel circle as meHubScreen's own copy of that chip.
  const chip = (ic, label, hash, badge) => h('button', {
    class: 'status-chip' + (badge ? ' budget-red' : ''), onclick: () => go(hash),
  }, [h('span', { class: 'status-ic' }, ic), h('span', { class: 'status-lbl' }, badge ? `${label} · ${badge} unread` : label)]);
  const groups = [
    { label: 'Plan your trip', items: [
      // Talk-section-style unify (You Y1): six destinations used to answer to two different
      // names depending on which tab you arrived from. The short name now matches meHubScreen
      // (js/main.js) on every one of these — see OVERHAUL.md's You section for the audit.
      chip('🧭', 'Trip plans', '#plans'),
      chip('🎯', 'For you', '#foryou'),
      chip('🧳', 'My trip', '#trip'),
      chip('✅', 'Pre-trip checklist', '#checklist'),
      chip('📔', 'Journal', '#journal'),
      chip('📸', 'Trip scrapbook', '#scrapbook'),
      chip('📅', 'Calendar', '#calendar'),
      chip('⭐', 'Saved places', '#saved'),
    ] },
    { label: 'Money & tools', items: [
      chip('💱', 'Currency converter', '#currency'),
      chip('💰', 'Money', '#expenses'),
      chip('🏷️', 'Bargain helper', '#bargain'),
      chip('👥', 'Travel circle', '#circle', unreadInboxCount()),
      chip('🤝', 'Buy or sell', '#exchange'),
      chip('🔒', 'Documents', '#vault'),
      chip('❓', 'Help & FAQ', '#help'),
    ] },
  ];
  // Decks open by RELEVANCE to the current phase rather than all-or-nothing: before/after the
  // trip a traveller plans and remembers, so the trip-planning deck (index 0) leads; on the
  // ground the recognition tools lead (see the Identify deck below). This keeps exactly one
  // deck open per phase instead of ~16 equal tiles or a mismatched default.
  const planDeckOpen = (phase === 'planning' || phase === 'post');
  groups.forEach((g, gi) => {
    wrap.append(h('details', { class: 'home-group-d', open: (gi === 0 && planDeckOpen) ? '' : null }, [
      h('summary', { class: 'home-group' }, g.label),
      h('div', { class: 'chips' }, g.items),
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
}

// "Just arrived" — a standalone dismissible chip (not one of quickAccessRow's grid chips,
// since it alone needs an X) leading to the first-hour arrival guide (arrivalScreen,
// main.js — already keyed to the traveller's actual gateway/city, so this one chip covers
// "arrival info for each place"). X-ing it out asks for confirmation (this hides a whole
// prompt, not a one-line tip — a plain tap-to-dismiss risks an accidental miss-tap losing
// it), then sets prefs.justArrivedHidden so it does not reappear on its own. It is never
// gone for good: Settings → Journey phase (settingsScreen, main.js) can always turn it back
// on, and the arrival guide itself stays reachable regardless via Explore's "Just arrived"
// tile and the near-me screen's own "Full arrival guide" button.
function justArrivedChip(cc) {
  if (store.profile.prefs.justArrivedHidden) return null;
  return h('div', { class: 'just-arrived-chip' }, [
    h('button', { class: 'ja-main', onclick: () => go(`#arrival-${cc}`) }, [
      h('span', { class: 'status-ic' }, '🛬'),
      h('span', { class: 'status-lbl' }, 'Just arrived — first-hour guide'),
    ]),
    h('button', {
      class: 'ja-x', 'aria-label': 'Hide the Just arrived chip',
      onclick: () => {
        confirmAction({
          title: 'Hide “Just arrived”?',
          body: 'It disappears from Home. Bring it back any time from Settings → Journey phase.',
          confirmLabel: 'Hide',
        }).then((ok) => { if (ok) { store.profile.prefs.justArrivedHidden = true; save(); render(); } });
      },
    }, '✕'),
  ]);
}

// Shared by both of the placements it can appear in (see the swap with the weather ring in
// homeScreen above) so the button itself is defined once regardless of where it lands.
function searchEverythingBtn() {
  return h('button', { class: 'btn ghost block home-search', style: 'margin:10px 0 2px', onclick: () => go('#search') }, '🔎 Search everything');
}

// H2/H3 merged — Quick access: one collapsible carrying the phase switcher plus every
// phase-appropriate status chip. Trip status and Quick access used to be two separate
// collapsibles; merging them recognises that both were just "chips about the trip," so
// splitting them was itself a kind of duplication. No chip is ever a placeholder — one with
// nothing to say just shows its bare label (rank-collapse-never-remove: nothing here is a
// distinct destination, every value still has its own full screen one tap away).
function quickAccessRow(phase, stored, ctx) {
  const chip = (ic, label, sub, onclick, extraClass) => h('button', {
    class: 'status-chip' + (extraClass ? ' ' + extraClass : ''), onclick,
  }, [h('span', { class: 'status-ic' }, ic), h('span', { class: 'status-lbl' }, sub ? `${label} · ${sub}` : label)]);

  // Calendar — bare label until the trip actually starts (tripStartISO); once it has, a
  // running day count (Day 1, Day 2…) replaces "Calendar" instead. The old Trip status
  // "X days to go" pre-trip countdown is dropped in favour of just naming the destination
  // screen — the day count is the one thing worth surfacing once a trip is actually under
  // way. The next plan item's own title + timing rides along as the sub-label, folded in from
  // the old, now-removed, standalone 📍 chip.
  const startISO = tripStartISO();
  let calLabel = 'Calendar';
  if (startISO && daysUntilISO(startISO) <= 0) calLabel = `Day ${1 - daysUntilISO(startISO)}`;
  const calItem = nextPlanItem();
  let calSub = null;
  if (calItem) {
    const t = todayISO();
    const when = calItem.date === t ? 'Today' : (calItem.date === addDaysISO(t, 1) ? 'Tomorrow' : evShort(calItem.date));
    calSub = `${(calItem.title || 'Planned').slice(0, 18)} · ${when}`;
  }

  // Budget — with no target set, the plain spent total (unchanged — "how much has been
  // spent" is the honest answer when there is nothing to grade against). Once a target
  // exists AND at least one expense is logged, the label promotes to a live
  // percentage-of-budget and the chip takes a colour ring: green on track to land under
  // budget, yellow if the current pace projects going over, red if already over.
  const sp = tripSpendHome();
  const target = budgetTarget();
  let budgetLabel = 'Budget';
  let budgetSub = (sp.any && sp.sum > 0) ? `${Math.round(sp.sum).toLocaleString()} ${sp.home}${sp.allKnown ? '' : '+'}` : null;
  let budgetClass = '';
  if (target && sp.sum > 0) {
    const span = tripSpanDays();
    const dailyRate = span && span.elapsed > 0 ? sp.sum / span.elapsed : sp.sum;
    if (target.per === 'trip') {
      const pct = Math.round(sp.sum / target.amount * 100);
      budgetLabel = `${pct}% spent`; budgetSub = null;
      if (sp.sum > target.amount) budgetClass = 'budget-red';
      else if (span && span.total) budgetClass = (dailyRate * span.total > target.amount) ? 'budget-yellow' : 'budget-green';
      else budgetClass = pct >= 90 ? 'budget-yellow' : 'budget-green';
    } else {
      const pct = Math.round(dailyRate / target.amount * 100);
      budgetLabel = `${pct}% of daily budget`; budgetSub = null;
      if (dailyRate > target.amount) budgetClass = 'budget-red';
      else budgetClass = dailyRate >= target.amount * 0.9 ? 'budget-yellow' : 'budget-green';
    }
  }

  // Journal — entry count.
  const jN = store.journal.entries.length;
  const journalSub = jN ? `${jN} ${jN === 1 ? 'entry' : 'entries'}` : null;

  const chips = [
    chip('📅', calLabel, calSub, () => go('#calendar')),
    chip('💰', budgetLabel, budgetSub, () => go('#expenses'), budgetClass),
  ];

  if (phase === 'post') {
    chips.push(chip('🏆', 'Scrapbook', null, () => go('#scrapbook')));
  } else {
    let wxIc = '🌤', wxSub = null;
    if (ctx.wx && ctx.wx.temp != null) {
      const temp = fmtTemp(ctx.wx.temp);
      if (temp) {
        wxIc = (wmo(ctx.wx.code) || [])[1] || '🌤';
        let rainNote = '';
        const spot = ctx.near ? ctx.near.spot : null;
        if (spot) {
          const rec = getCachedWeather(spotKey(spot));
          const today = rec && Array.isArray(rec.daily) ? rec.daily[0] : null;
          if (today && today.rainProb != null && today.rainProb >= 40) rainNote = ` · ☔ ${today.rainProb}%`;
        }
        wxSub = `${temp}${rainNote}`;
      }
    }
    chips.push(chip(wxIc, 'Weather', wxSub, () => go('#weather')));
  }

  chips.push(chip('📔', 'Journal', journalSub, () => go('#journal')));
  // Online/offline used to be a fifth chip here too — moved to the shared topbar() (main.js),
  // next to Saved/Settings/Emergency, so it is reachable from every screen, not just Home.

  // Open by default — it only ever collapses because the traveller closed it themselves
  // (prefs.quickAccessOpen explicitly false); an unset/undefined pref still means "open".
  const open = store.profile.prefs.quickAccessOpen !== false;
  const details = h('details', { class: 'home-group-d quick-access', open: open ? '' : null });
  details.addEventListener('toggle', () => { store.profile.prefs.quickAccessOpen = details.open; save(); });
  details.append(h('summary', { class: 'home-group' }, '⚡ Quick access'));
  const body = h('div', { style: 'padding-top:8px' });
  body.append(phaseSwitchRow(phase, stored, false));   // the segmented control only — no repeated caption
  body.append(h('div', { class: 'card home-status', style: 'margin-top:8px', role: 'group', 'aria-label': 'Quick access' }, chips));
  details.append(body);
  return details;
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
