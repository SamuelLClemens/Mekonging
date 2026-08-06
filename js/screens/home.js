// Home — "What now?" The present moment: adapts to trip phase (planning / arrived /
// traveling / post), shows today rather than everything. See OVERHAUL.md section 3.
//
// This is the Great Split's proof case (OVERHAUL.md section 9, F2): the first screen
// function physically moved out of main.js into its own module. Its own helpers
// (phaseSwitchRow, homeStageBlock, ensureHomeWeather, etc.) stay in main.js for now —
// exported from there and imported back here — rather than being untangled and moved too.
// That deeper decomposition is deliberately deferred to Home's own UX-pass session, where
// the screen gets rebuilt anyway; duplicating that effort here would just be moved again.
// The one thing this file DOES prove out is the mechanism every later section module reuses:
// a screen living outside main.js, reaching into main.js circularly for shared helpers,
// with only truly cross-cutting state (activeCountry, liveMapCtrl/liveCleanup) pulled out to
// a neutral js/app-state.js so neither side needs the other at module-evaluation time.

import { store } from '../state.js';
import { h } from '../util.js';
import { getCountry, loadCountry, isCountryLoaded } from '../data/regions.js';
import { unreadInboxCount } from '../state.js';
import { getActiveCountry } from '../app-state.js';
import {
  go, mount, ICON, toggleHero, logoSVG, setupHeroScroll, maybeOfferTour, setupRecapCard,
  inferPhase, focusSpot, phaseSwitchRow, homeStatusBand, homeStageBlock, contextNow,
  ensureHomeWeather, budgetSummaryCard, idPinCount, sectionTile,
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
  wrap.append(h('section', { class: 'hero is-collapsed', onclick: (e) => { if (e.currentTarget.classList.contains('is-collapsed')) toggleHero(); } }, [
    h('button', { class: 'hero-toggle', type: 'button', 'aria-label': 'Collapse the header', 'aria-expanded': 'true', onclick: toggleHero },
      [h('span', { class: 'chev', 'aria-hidden': 'true' }, '⌄')]),
    h('div', { class: 'logo-wrap', html: logoSVG() }),
    h('p', {}, 'Travel Thailand, Vietnam, Cambodia & Laos like an expert.'),
    h('div', { class: 'hero-badges' }, [
      h('span', { class: 'hero-badge' }, '✓ Works offline'),
      h('span', { class: 'hero-badge' }, '✓ No account'),
      h('span', { class: 'hero-badge' }, '✓ Free & private'),
    ]),
  ]));

  // NAV-1: one-shot "here is what I set up for you" recap, right after finishing the
  // value-first first run — proof that the few taps already personalised the app.
  if (store.profile.prefs.showSetupRecap) wrap.append(setupRecapCard());

  // The four journey buttons sit at the very top with the active stage highlighted, so a
  // traveller sets or switches their phase in one tap. Home no longer hides the picker once
  // a phase is chosen, and the country map now lives on the Explore tab rather than here.
  const storedPhase = store.profile.prefs.phase || '';
  const phase = storedPhase || inferPhase();   // infer a sensible stage until they choose one
  const leadCC = focusSpot().spot.country;

  // Compact one-line phase switcher — replaces the tall 2×2 selector, the persistent tip banner
  // and the "Not right?" correction line, so status and actions lead the screen.
  wrap.append(phaseSwitchRow(phase, storedPhase));

  // At-a-glance status band: trip countdown/day · next plan · spend · offline, each a one-tap chip.
  wrap.append(homeStatusBand(phase, leadCC));

  // One stage-appropriate situational block. Planning gets a forward-looking outlook +
  // countdown + checklist hub (no near-me); arrived/travelling get the live, forecast-aware
  // near-me card; post gets the return recap. This is what makes Home fit the traveller's
  // actual stage instead of showing "what's near you" to someone still at home or already back.
  wrap.append(homeStageBlock(phase, leadCC));
  // On the first online visit, pull the relevant city's forecast once (respects offline &
  // consent, de-duplicated) so the outlook and the "right now" forecast line populate.
  {
    const ctx0 = contextNow();
    const phaseSpot = (phase === 'arrived' || phase === 'traveling')
      ? (ctx0.near ? ctx0.near.spot : focusSpot().spot)
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
  const identifyOpen = (phase === 'arrived' || phase === 'traveling');
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
  setupHeroScroll();  // collapse the hero to a slim sticky bar once the traveller scrolls
  maybeOfferTour();   // first-run only: a quick walk-me tour once the traveller reaches Home
}
