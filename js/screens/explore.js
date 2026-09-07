// Explore — the country hub, its regions, and the "when to go" machinery behind both.
//
// Extracted from js/main.js (screen split, mk-v0.539.0): 710 lines, the largest single
// cluster in that file, and none of it needed at launch. Kept together because it is one
// feature rather than three screens — exploreScreen renders the region picker, the picker
// renders the month verdicts, and the verdicts need the zone/region geometry.
//
// exploreScreen and whereNextSection call each other (whereNextSection's default `rerender`
// re-renders Explore). That mutual recursion used to be main.js talking to itself; it is now
// internal to this module, which is strictly better — and js/screens/nextstop.js imports
// whereNextSection from HERE rather than from main.js, so the itinerary builder no longer
// reaches into the launch graph for it.
//
// What stayed in main.js, deliberately: regionSetFor, zoneAssignment, placesInZone and
// townsInZone. Those are read by whereAmI and findProvince — core "where is the traveller"
// plumbing that every screen depends on — so moving them would only have pulled this module
// straight back into the eager graph.
import { h, debounce, titleCase, esc } from '../util.js';
import { store, save } from '../state.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import {
  getCountry, allPlaces, COUNTRIES, isCountryLoaded, loadCountry, getLanguage,
} from '../data/regions.js';
import { screenHint, infoTip, collapsibleCard, selectEl } from '../ui-widgets.js';
import { citySlug } from '../render-utils.js';
import { verdictFor, VERDICT_RANK } from '../data/month-verdict.js';
import { PLACE_MONTHS } from '../data/place-months.js';
import { zonesFor, getZone } from '../lazy-data.js';
import { foldable } from '../ui-widgets.js';
import { REGION_PATHS, REGION_RIVER, REGION_LABELS, REGION_VIEWBOX } from '../data/geo.js';
import { isRouteNode, planRoutes, routeNodes } from '../journey.js';
import { addStop } from '../state.js';
import { placeCard } from '../place-ui.js';
import { dateLocale } from '../i18n.js';
import { zoneForProvince, monthVerdict } from '../lazy-data.js';
import {
  go, mount, topbar, render, screenMod, focusSpot, groupDoors, chipIcon,
  ensureRouteGraph, routeGraphReady,
  regionSetFor, zoneAssignment, placesInZone, townsInZone,
  provincePathD, provinceCentroids, pointInProvince, youAreHereMark,
  loadRegionSet, isRegionSetLoaded, anchorCountry, cityHistory, countryHistory,
  cityPickGrid, knownForRow, signatureSightsStrip, whereAmICard, accessCard, visaCard,
  seasonalFitSection, fitsYourTripSection, mightNotKnowSection,
  REGION_COLORS, REGION_PALETTE,
} from '../main.js';

// ---- Where-next chain state -------------------------------------------------
// Module state, not a store pref: it survives this section re-rendering as the traveller
// keeps tapping and resets when the anchor city changes, but it is a browsing selection and
// not worth persisting. It lives HERE rather than in main.js because a module's `let` cannot
// be assigned from another module — the section that mutates the chain and the chain itself
// must be in the same file.
let _nextChain = [];
let _nextChainFrom = '';

// The month multi-select behind the region verdicts. Empty means nothing chosen, and that
// state means something: no verdict is shown until the traveller names a month, because a
// verdict against today's date that they never asked for is a claim about a trip they may not
// be taking. Session-only.
const zoneMonths = new Set();

// Binary floating-point noise (e.g. 1.2 + 1.2 = 2.4000000000000004) surfaces the moment two
// legs' hour ranges are summed — harmless as a number, but an unrounded string this long has
// no natural break point and forces its grid track wider than the card, overflowing the
// viewport. Round to one decimal at display time everywhere a summed range is shown.
function round1(n) { return Math.round(n * 10) / 10; }

function computeWhereNext(fromCity, exclude) {
  if (!isRouteNode(fromCity)) return [];
  const skip = new Set([fromCity, ...(exclude || [])]);
  const scored = routeNodes().filter((n) => !skip.has(n)).map((n) => {
    const plans = planRoutes(fromCity, n);
    return plans.length ? { name: n, hrs: [round1(plans[0].totalHrs[0]), round1(plans[0].totalHrs[1])], changes: plans[0].changes } : null;
  }).filter(Boolean);
  scored.sort((a, b) => (a.hrs[0] || 99) - (b.hrs[0] || 99));
  return scored.slice(0, 5);
}

// Which loaded country actually has a place tagged with this city — needed to hand addStop()
// the right country when a chained mini-itinerary crosses a border.
function countryForCityName(name) {
  const slug = citySlug(name);
  for (const x of COUNTRIES) {
    if (isCountryLoaded(x.id) && allPlaces({ country: x.id }).some((p) => citySlug(p.city || '') === slug)) return x.id;
  }
  return '';
}

// Read-only accessor for whichever screen wants to know "what has the traveller picked in
// the Where-next builder for this city" without reaching into its private chain array — used
// by #nextstop (screens/nextstop.js) to key its Getting there / What is there / Commit
// sections off the same selection whereNextSection itself renders.
export function nextChainTail(fromCity) {
  if (_nextChainFrom !== fromCity || !_nextChain.length) return null;
  const name = _nextChain[_nextChain.length - 1];
  // The immediately preceding city on this chain — the original fromCity for a single hop,
  // the second-to-last chained city once the traveller has chained more than one. #nextstop's
  // Getting there section routes from here, not from fromCity, so a 2-3 hop chain shows the
  // actual last leg rather than a direct-from-origin route that ignores the stops between.
  const from = _nextChain.length > 1 ? _nextChain[_nextChain.length - 2] : fromCity;
  return { name, country: countryForCityName(name), from };
}

// Explore E1 (OVERHAUL.md section 11): Explore and the country hub were the same section
// split across two screens — the old bare #explore was a thin chooser (73 lines, no
// photography, no curated content) while everything a traveller actually wants (hero photo,
// signature sights, regions, cities, the full toolkit) lived one tap deeper, only reachable
// via #country-<cc>. Merged into one renderer. #explore and #country-<cc> BOTH route here —
// 21 existing links point at #country-<cc> and must keep working unchanged.
//
// argCc: an explicit country id from #country-<cc> (always wins), 'all' from #explore-all
// (forces the four-country view even when anchored), or undefined from a bare #explore
// (falls through to anchorCountry() — E2's landing logic).
//
// Root-tab note: unlike the old countryHubScreen, this never shows a "‹ Back" button —
// Explore is a bottom-tab screen like Home/Places, not a sub-screen you navigate into, and
// the four-country view is one tap away via the "🌏 All" chip in the switcher below,
// consistent with rank-collapse-never-remove.
export function exploreScreen(argCc) {
  const forceAll = argCc === 'all';
  const cc = (!forceAll && argCc && getCountry(argCc)) ? argCc : (forceAll ? null : anchorCountry());
  const c = cc ? getCountry(cc) : null;

  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(c ? `${c.flag} ${c.name}` : 'Explore'));

  // Country select — a single dropdown covering every country plus "All". The one
  // consistent way to pick a country from Explore now, in both branches below —
  // replaces the old scoped-only chip switcher and the unscoped grid-of-cards as two
  // parallel, inconsistent pickers (and, before that, a horizontally-scrolling chip row).
  const countrySelect = selectEl(
    [['all', '🌏 All countries']].concat(COUNTRIES.map((x) => [x.id, `${x.flag} ${x.name}`])),
    cc || 'all',
    (v) => { if (v === 'all') { go('#explore-all'); } else { setActiveCountry(v); go(`#country-${v}`); } },
    'Country',
  );
  wrap.append(h('div', { class: 'country-select-row' }, [countrySelect]));

  if (!c) {
    // No explicit country and no real anchor — the four-country comparison view. Reached by
    // tapping the Explore tab with nothing yet to land on, or explicitly via #explore-all.
    // Lead with the map: plain and always visible (no anchor to default to yet, so "choose
    // on the map" IS the default view here) — not a collapsible fold, the map is the focus.
    wrap.append(h('div', { class: 'home-section', style: 'margin: var(--sp-2) 0 var(--sp-1)' }, '🗺 Choose on the map'));
    wrap.append(regionPicker());

    // "At a glance": each country's real figures (mapped-place count, language, currency) and
    // its top sourced "known for" tags — a comparison that helps a traveller CHOOSE. Explore
    // itself must never block on all four countries loading (that would defeat lazy loading
    // for the common case of one country); a country not yet loaded briefly reads 0 here, so
    // kick each missing one off in the background and quietly repaint in place as each lands.
    const unloaded = COUNTRIES.filter((x) => !isCountryLoaded(x.id));
    if (unloaded.length) {
      unloaded.forEach((x) => {
        loadCountry(x.id).then(() => {
          const headRoute = (location.hash || '').slice(1).split('-')[0];
          if (headRoute === 'explore' && isCountryLoaded(x.id)) {
            const y = window.scrollY;
            exploreScreen(argCc);
            requestAnimationFrame(() => window.scrollTo(0, y));
          }
        }).catch(() => { /* offline with nothing cached yet — leave today's 0 up */ });
      });
    }
    const grid = h('div', { class: 'explore-grid' });
    COUNTRIES.forEach((x) => {
      const n = allPlaces({ country: x.id }).length;
      const lang = getLanguage(x.lang);
      const tags = ((countryHistory(x.id) || {}).knownFor || []).slice(0, 3);
      grid.append(h('button', {
        class: 'explore-card', style: `--ec:${REGION_COLORS[x.id] || 'var(--teal)'}`,
        onclick: () => { setActiveCountry(x.id); go(`#country-${x.id}`); },
        'aria-label': `Explore ${x.name}`,
      }, [
        h('span', { class: 'explore-flag' }, x.flag),
        h('span', { class: 'explore-name' }, x.name),
        h('span', { class: 'explore-facts' }, `${n} place${n === 1 ? '' : 's'} · ${lang ? lang.label : x.lang} · ${x.currency}`),
        tags.length ? h('span', { class: 'explore-tags' }, tags.map((t) => h('span', { class: 'explore-tag' }, t))) : null,
      ]));
    });
    const glanceFold = foldable(h('span', { class: 'home-section', style: 'margin: 0' }, '🌏 Four countries at a glance'),
      grid, { open: store.profile.prefs.exploreGlanceOpen !== false, cls: 'home-group-d' });
    glanceFold.addEventListener('toggle', () => { store.profile.prefs.exploreGlanceOpen = glanceFold.open; save(); });
    wrap.append(glanceFold);

    mount(wrap, '#explore');
    return;
  }

  // Scoped to a country — an explicit choice (#country-<cc>, a switcher tap, a flag on the
  // map/glance view above) or a real anchor from anchorCountry(). Either way this is now the
  // traveller's active country.
  setActiveCountry(cc);

  // Bare #explore / anchor-driven landing is NOT gated by the router (only #country-<cc> is —
  // see NEEDS_COUNTRY_DATA in render()), so an anchor pointing at a country nothing has loaded
  // yet (e.g. a dated stop set for a country never opened this session) would otherwise render
  // sparse forever. Background-load + quietly repaint, same idiom as the chooser above and as
  // Home's own country-load block — never block first paint, never silently stay empty.
  // Same non-blocking "load then quietly repaint if still here" idiom, run once per loader
  // so either landing independently of the other — the region set gates only the "by
  // region" map further down, not the whole screen.
  const repaintExploreIfStillHere = () => {
    const headRoute = (location.hash || '').slice(1).split('-')[0];
    if (headRoute === 'explore' || headRoute === 'country') {
      const y = window.scrollY;
      exploreScreen(argCc);
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  };
  if (!isCountryLoaded(cc)) {
    loadCountry(cc).then(repaintExploreIfStillHere)
      .catch(() => { /* offline with nothing cached yet — sparse view stays up */ });
  }
  if (!isRegionSetLoaded(cc)) {
    loadRegionSet(cc).then(repaintExploreIfStillHere)
      .catch(() => { /* offline with nothing cached yet — region map stays hidden */ });
  }

  // Lead with the map: this country's regions, right after country select — plain and
  // always visible, not a collapsible fold, the same "map is the focus" treatment as the
  // unscoped branch above (and as Places' own living map). Country defaulting is already
  // handled above (cc = the traveller's anchored country, or null → the "All" branch), so
  // this alone satisfies "default to the country the traveller is in, or all if not yet in
  // one." The old hero photo and the phrasebook/currency/places/map/emergency quick-link
  // row that used to sit here are gone — every one of those destinations is still reachable
  // via its own bottom tab or another existing link, never removed, just no longer a
  // redundant row competing with the map for the lead position.
  // Explore's spine: 4-6 travel REGIONS, not 184 provinces. Each row carries what the
  // region is and how much is actually mapped there, so a traveller can judge where the
  // depth is before tapping. The map and the list drive the same route — the map for people
  // who think geographically, the list for people who read.
  if (zonesFor(cc).length) {
    wrap.append(h('div', { class: 'home-section', style: 'margin: var(--sp-2) 0 var(--sp-1)' }, `🗺 ${c.name} by region`));
    const zm = zonesMap(cc, { onPick: (zid) => go(`#region-${cc}-${zid}`) });
    if (zm) wrap.append(zm);
    const zl = zonePickList(cc);
    if (zl) wrap.append(zl);
  }

  // Lead with WHERE THE TRAVELLER IS: if their location or focus resolves to a city in
  // this country, surface that city first and let them widen to the whole country. Only
  // when it is a real signal (GPS or a chosen focus), never the capital default.
  const fs = focusSpot(cc);
  const fcity = (fs && (fs.source === 'gps' || fs.source === 'focus') && fs.spot) ? fs.spot.city : null;
  const fslug = fcity ? citySlug(fcity) : null;
  if (fcity) {
    const here = allPlaces({ country: cc }).filter((p) => citySlug(p.city || '') === fslug).length;
    wrap.append(h('div', { class: 'card access-focus' }, [
      h('h2', {}, `📍 You’re around ${fcity}`),
      h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' },
        here ? `${here} place${here > 1 ? 's' : ''} here — start local, then widen out when you want.` : 'Start with what’s around you, then widen out.'),
      here ? h('button', { class: 'btn block', onclick: () => go(`#places-${cc}-${fslug}`) }, `Places in ${fcity}`) : null,
      // Weather dropped from this row — it duplicated the "Get oriented" deck's own Weather
      // tile just below, same label, same destination, both visible on this screen at once
      // (found in the sitewide duplicate-chip audit). "Get oriented" is the fuller reference
      // list, so it keeps Weather; this row stays focused on the two truly location-specific
      // actions (what's near THIS spot, is this even the right city).
      h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [
        h('button', { class: 'chip', onclick: () => go('#nearby') }, [chipIcon('pin'), 'Near me now']),
        h('button', { class: 'chip', onclick: () => go(`#setcity-${cc}`) }, [chipIcon('pin'), 'Not here? Change city']),
      ]),
    ]));
  } else {
    // No location signal (offline / GPS off): let them SET where they are so distances,
    // weather and "near me" all match. Fully offline — no GPS required.
    wrap.append(whereAmICard(cc));
  }

  // "More for {country}" — the same six feature sections a traveller meets on Home, minus
  // the two that are not about a country (My stuff, Settings & help). This was four
  // hand-written decks holding twenty-five chips, and it was the third copy of the same
  // destination list: Home had its own names for these, You had a third set, #everything a
  // fourth. It now renders from js/nav-groups.js like every other surface, so "Money &
  // prices" and "Fair prices" are one thing with one name, and a country-scoped feature
  // still lands on THIS country — resolveHash() takes the country being viewed.
  //
  // Two destinations lead separately above the doors because they are bottom TABS rather
  // than features, and so are deliberately absent from the taxonomy: this country's own
  // place list, and its language.
  const lang = getLanguage(c.lang);
  wrap.append(h('h2', { class: 'home-section', style: 'margin-top: var(--sp-4)' }, `More for ${c.name}`));
  wrap.append(h('div', { class: 'chips', style: 'margin-bottom: var(--sp-3)' }, [
    h('button', { class: 'status-chip', onclick: () => go(`#places-${cc}`), 'aria-label': `Places in ${c.name}. For your taste and price` },
      [h('span', { class: 'status-ic' }, '📍'), h('span', { class: 'status-lbl' }, `Places in ${c.name}`)]),
    h('button', { class: 'status-chip', onclick: () => go(`#phrasebook-${c.lang}`), 'aria-label': `Phrasebook. ${lang ? lang.label : 'Language'}` },
      [h('span', { class: 'status-ic' }, '💬'), h('span', { class: 'status-lbl' }, lang ? lang.label : 'Phrasebook')]),
  ]));
  wrap.append(groupDoors(['mine', 'admin']));

  // Explore E4–E7: discovery leads, then the reference/admin cards — Signature sights leads
  // ("What's here"), then Where next ("What's after this"), then the more occasional reads
  // (Fits your trip / seasonal / You might not know / solo note / Explore by city), then
  // History & culture last of the discovery run before the reference cards. Each section
  // independently omits itself when it has nothing real to show.
  const hubSights = signatureSightsStrip(cc);
  if (hubSights) wrap.append(hubSights);
  const whereNext = whereNextSection(argCc, fcity); if (whereNext) wrap.append(whereNext);
  const fits = fitsYourTripSection(cc); if (fits) wrap.append(fits);
  const seasonal = seasonalFitSection(cc, fcity, fslug); if (seasonal) wrap.append(seasonal);
  const notKnow = mightNotKnowSection(cc); if (notKnow) wrap.append(notKnow);
  if (store.profile.prefs.soloFemale || store.profile.prefs.party === 'solo') {
    wrap.append(h('div', { class: 'card', style: 'border:1px solid var(--magenta)' }, [
      h('strong', {}, '🧭 Travelling solo'),
      h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, 'Practical, non-alarmist safety notes for solo and women travellers here.'),
      h('button', { class: 'btn block', onclick: () => go(`#sos-${cc}`) }, 'See solo & women’s safety'),
    ]));
  }

  // The flat "Explore {country} by city" fold used to sit here: a 12-city grid plus a link
  // to the Places map. Both jobs moved — towns are now reached through the region that
  // contains them (above), which gives each one context instead of a bare name, and the
  // same city grid was already being rendered a second time by Places' own city picker.
  // History & culture is collapsed by default (minimise/maximise) with an in-depth read —
  // it is not something a traveller reads every day, so it should not be the first thing.
  const hi = countryHistory(cc);
  if (hi && hi.blurb) {
    wrap.append(foldable('History & culture', h('div', {}, [
      h('p', {}, hi.blurb),
      knownForRow(hi.knownFor),
      hi.cultureTip ? h('p', { class: 'culture-tip' }, `🙏 ${hi.cultureTip}`) : null,
      h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#history-${cc}`) }, '📖 In-depth history & culture'),
    ])));
  }
  // Accessibility / Entry & visa / Travelling with kids default MINIMISED (defaultOpen=false)
  // per direct request — reference material a traveller dips into, not something to read
  // every visit; still one tap away, never removed.
  const acc = accessCard(cc); if (acc) wrap.append(collapsibleCard(acc, 'hubAccessOpen', false));
  const vc = visaCard(cc); if (vc) wrap.append(collapsibleCard(vc, 'hubVisaOpen', false));
  // The family module is requested for 'explore'/'country' in ROUTE_SCREENS, so it is loaded
  // by the time this runs; the guard is for any future caller that is not route-gated.
  const famMod = screenMod('family');
  const famc = famMod ? famMod.familyCard(cc) : null;
  if (famc) wrap.append(collapsibleCard(famc, 'hubFamilyOpen', false));

  mount(wrap, '#explore');
}

export function whereNextSection(argCc, fromCity, onChange) {
  if (!fromCity) return null;
  if (_nextChainFrom !== fromCity) { _nextChainFrom = fromCity; _nextChain = []; }
  // A caller may supply its own re-render (#nextstop re-rendering itself instead of
  // Explore) — defaults to the original Explore-scroll-preserving behaviour, unchanged.
  const rerender = onChange || (() => {
    const y = window.scrollY;
    exploreScreen(argCc);
    requestAnimationFrame(() => window.scrollTo(0, y));
  });
  if (!routeGraphReady()) {
    ensureRouteGraph(() => {
      const headRoute = (location.hash || '').slice(1).split('-')[0];
      if (headRoute === 'explore' || headRoute === 'country' || headRoute === 'nextstop') rerender();
    });
    return null;   // nothing to show until the graph above resolves — never a placeholder
  }
  if (!isRouteNode(fromCity)) return null;

  const tail = _nextChain.length ? _nextChain[_nextChain.length - 1] : fromCity;
  // Exclude the trip's own starting point too, not just the chain built so far — otherwise
  // once you've chained one hop away, "back to where you started" reappears as a "next stop".
  const candidates = computeWhereNext(tail, [fromCity, ..._nextChain]);
  if (!candidates.length && !_nextChain.length) return null;   // nothing reachable at all

  const body = h('div', {});

  if (_nextChain.length) {
    let totLo = 0, totHi = 0, changes = 0, prev = fromCity;
    for (const city of _nextChain) {
      const p = planRoutes(prev, city)[0];
      if (p) { totLo += p.totalHrs[0] || 0; totHi += p.totalHrs[1] || p.totalHrs[0] || 0; changes += p.changes; }
      prev = city;
    }
    body.append(h('p', { style: 'margin: 0 0 var(--sp-1)' }, `${fromCity} → ${_nextChain.join(' → ')}`));
    body.append(h('p', { class: 'muted tiny', style: 'margin: 0 0 var(--sp-2)' },
      `~${round1(totLo)}–${round1(totHi)}h of travel across ${_nextChain.length} stop${_nextChain.length > 1 ? 's' : ''} · ${changes} change${changes === 1 ? '' : 's'}`));
    body.append(h('div', { class: 'chips', style: 'margin-bottom: var(--sp-2)' }, [
      h('button', { class: 'chip', onclick: () => { _nextChain.pop(); rerender(); } }, '↶ Remove last'),
      h('button', { class: 'chip', onclick: () => { _nextChain = []; rerender(); } }, 'Clear'),
    ]));
  }

  if (_nextChain.length < 3 && candidates.length) {
    body.append(h('p', { class: 'muted', style: 'margin: var(--sp-0h) 0 var(--sp-1h)' },
      _nextChain.length ? `Next, from ${tail}:` : 'Tap a city to start building your next few stops:'));
    body.append(h('div', { class: 'grid' }, candidates.map((r) => h('button', {
      class: 'card', style: 'text-align:left', onclick: () => { _nextChain.push(r.name); rerender(); },
    }, [
      h('strong', {}, r.name),
      h('p', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 0' },
        `${r.hrs[1] ? `~${r.hrs[0]}–${r.hrs[1]}h` : ''} · ${r.changes === 0 ? 'Direct' : `${r.changes} change${r.changes > 1 ? 's' : ''}`}`),
    ]))));
  }

  if (_nextChain.length) {
    const tripName = (store.profile.name || '').trim();
    const tripLabel = tripName ? `${tripName}’s trip` : 'My Trip';
    body.append(h('button', {
      class: 'btn block', style: 'margin-top: var(--sp-1)',
      onclick: (e) => {
        _nextChain.forEach((city) => addStop({ title: city, country: countryForCityName(city) }));
        e.currentTarget.textContent = `✓ Added — open ${tripLabel} to edit`;
        e.currentTarget.disabled = true;
        e.currentTarget.onclick = null;
      },
    }, `＋ Add ${_nextChain.length === 1 ? 'this stop' : `these ${_nextChain.length} stops`} to ${tripLabel}`));
  }

  body.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#route') }, 'Full journey planner →'));

  return h('section', {}, [h('h2', { class: 'home-section' }, `🚌 Where next, from ${fromCity}`), body]);
}

// Region detail: arg is "<cc>-<CODE>" (the ISO code itself contains a hyphen, e.g.
// "th-TH-50"), so split on the FIRST hyphen only. Lists the region's cities and mapped
// places, keeps the province map one tap from its neighbours, and links up to the country.
export function regionScreen(arg) {
  const raw = String(arg || '');
  const dash = raw.indexOf('-');
  const cc = dash >= 0 ? raw.slice(0, dash) : (raw || getActiveCountry());
  let id = dash >= 0 ? raw.slice(dash + 1) : '';
  const c = getCountry(cc);
  // Back-compatibility: links minted before regions replaced provinces carry an ISO province
  // code (e.g. "#region-th-TH-50"). Resolve those to the region that now contains them so an
  // old bookmark, a saved link or a stale cache still lands somewhere true.
  if (c && id && !getZone(cc, id)) {
    const owner = zoneForProvince(cc, id);
    if (owner) id = owner.id;
  }
  const z = getZone(cc, id);
  const wrap = h('div', { class: 'screen' });
  if (!c || !z) {
    wrap.append(topbar('Region', `#country-${cc}`));
    wrap.append(h('p', { class: 'empty' }, 'That region could not be found.'));
    mount(wrap, '#explore');
    return;
  }
  setActiveCountry(cc);
  wrap.append(topbar(z.name, `#country-${cc}`));

  // Facts first — what this region is, who it suits, who it does not, when to come. Every
  // row is one line; the whole orientation is meant to be read in a glance, not studied.
  wrap.append(zoneFactsCard(z, cc));

  const mini = zonesMap(cc, { activeId: z.id, onPick: (nid) => go(`#region-${cc}-${nid}`) });
  if (mini) {
    const mapFold = foldable(h('span', { class: 'home-section', style: 'margin: 0' }, `🗺 ${c.name} by region`),
      h('div', { style: 'padding: var(--sp-1h) 0 0' }, [mini]), { open: store.profile.prefs.regionMapOpen !== false, cls: 'home-group-d' });
    mapFold.addEventListener('toggle', () => { store.profile.prefs.regionMapOpen = mapFold.open; save(); });
    wrap.append(mapFold);
  }

  const inZone = placesInZone(cc, z.id);
  const towns = townsInZone(cc, z.id);
  if (towns.length) {
    const counts = {}; towns.forEach((t) => { counts[t.city] = t.n; });
    const cityCard = h('div', { class: 'card' }, [h('h2', {}, `🏙 ${towns.length} town${towns.length === 1 ? '' : 's'} in ${z.name}`)]);
    cityCard.append(cityPickGrid(cc, towns.map((t) => t.city), counts));
    wrap.append(collapsibleCard(cityCard, 'regionCitiesOpen'));
  }

  if (inZone.length) {
    const pc = h('div', { class: 'card' }, [h('h2', {}, `📍 ${inZone.length} place${inZone.length > 1 ? 's' : ''} in ${z.name}`)]);
    inZone.slice(0, 40).forEach((pl) => pc.append(placeCard(pl)));
    if (inZone.length > 40) {
      pc.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#places-${cc}`) }, `See all ${inZone.length} on the map →`));
    }
    wrap.append(collapsibleCard(pc, 'regionPlacesOpen', false));
  } else {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted', style: 'margin: 0' }, `No places are mapped in ${z.name} yet. Tap another region on the map above, or browse all of ${c.name}.`),
      h('button', { class: 'btn block btn-spaced', onclick: () => go(`#places-${cc}`) }, `All places in ${c.name}`),
    ]));
  }

  if (cc === 'vi') {
    wrap.append(h('p', { class: 'muted tiny', style: 'margin: var(--sp-0h) var(--sp-0h) var(--sp-3)' },
      'Note: Vietnam reorganised its provinces in 2025. The region outlines reflect the earlier boundaries until open map data is updated.'));
  }

  wrap.append(h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [
    h('button', { class: 'chip', onclick: () => go(`#country-${cc}`) }, [chipIcon('compass'), `About ${c.name}`]),
    h('button', { class: 'chip', onclick: () => go(`#history-${cc}`) }, [chipIcon('book'), 'History & culture']),
    h('button', { class: 'chip', onclick: () => go(`#info-${cc}`) }, [chipIcon('compass'), 'Country guide']),
  ]));
  mount(wrap, '#explore');
}

function regionPicker() {
  // Z-order: country fills (clickable) → the Mekong → labels on top (so a name is
  // never hidden by the river).
  const shapes = COUNTRIES.map((c) => {
    if (!REGION_PATHS[c.id]) return '';
    return `<g class="ctry-group" data-country="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)}">
         <path class="ctry" fill-rule="evenodd" d="${REGION_PATHS[c.id]}" fill="${REGION_COLORS[c.id]}"/>
       </g>`;
  }).join('');
  const river = REGION_RIVER ? `<g class="mekong-group" aria-hidden="true">
         <path class="mekong-casing" d="${REGION_RIVER}"/>
         <path id="mk-river-path" class="mekong" d="${REGION_RIVER}"/>
         <text class="mekong-name" dy="-7"><textPath href="#mk-river-path" startOffset="38%">~ Mekong ~</textPath></text>
       </g>` : '';
  const labels = COUNTRIES.map((c) => {
    if (!REGION_PATHS[c.id]) return '';
    // REGION_LABELS is each country's pole of inaccessibility — its true visual centre.
    const [lx, ly] = REGION_LABELS[c.id];
    return `<g class="ctry-label" aria-hidden="true">
         <text class="ctry-flag" x="${lx}" y="${ly - 8}" text-anchor="middle">${c.flag}</text>
         <text class="ctry-name" x="${lx}" y="${ly + 26}" text-anchor="middle">${esc(c.name)}</text>
       </g>`;
  }).join('');
  const svg = `<svg viewBox="${REGION_VIEWBOX}" class="region-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of Thailand, Laos, Cambodia and Vietnam, with the Mekong River" xmlns="http://www.w3.org/2000/svg">
      ${shapes}${river}${labels}
    </svg>`;
  const box = h('div', { class: 'region-map', html: svg });
  box.querySelectorAll('.ctry-group').forEach((g) => {
    const id = g.getAttribute('data-country');
    const enter = () => { setActiveCountry(id); go(`#country-${id}`); };
    g.addEventListener('click', enter);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } });
  });
  box.append(h('span', { class: 'region-cap' }, 'Tap a country to explore · the Mekong runs through all four'));
  return box;
}

// The region chooser used on Explore: one row per region with its own facts, live town and
// place counts, so a traveller can see where the depth actually is before tapping in.
//
// It also answers the question travellers actually ask first — not "when is the Northern
// Highlands good?" but "it is September, where should I go?". The month strip re-sorts the
// regions by that month's verdict (see monthVerdict() in js/data/zones.js) and prints the
// region's own season sentence under each one, so the ordering is always shown its working.
function zonePickList(cc) {
  const zones = zonesFor(cc);
  if (!zones.length) return null;
  const nowM = new Date().getMonth() + 1;
  const monthName = (n) => new Date(2020, n - 1, 1).toLocaleDateString(dateLocale(), { month: 'long' });
  const monthShort = (n) => new Date(2020, n - 1, 1).toLocaleDateString(dateLocale(), { month: 'short' });
  const picked = [...zoneMonths].sort((a, b) => a - b);
  const has = picked.length > 0;

  const wrap = h('div', { class: 'zone-when-wrap' });
  // The heading no longer asserts a month the traveller did not choose. Before, a fresh load
  // read "Where to go this month · September" and ranked every region against September —
  // a verdict about a trip nobody had said they were taking.
  wrap.append(h('h3', { class: 'zone-when-head' },
    has ? `Where to go in ${picked.map(monthShort).join(', ')}` : 'Where to go'));
  const strip = h('div', { class: 'chips month-strip', role: 'group', 'aria-label': 'Choose one or more months' });
  for (let i = 1; i <= 12; i++) {
    strip.append(h('button', {
      // aria-pressed carries BOTH the state and the styling here: .chip[aria-pressed="true"]
      // is the app's existing selected-chip rule, so there is no second visual convention.
      class: 'chip',
      'aria-pressed': String(zoneMonths.has(i)),
      onclick: () => { if (zoneMonths.has(i)) zoneMonths.delete(i); else zoneMonths.add(i); render(); },
    }, monthShort(i) + (i === nowM ? ' •' : '')));
  }
  const stripKids = [strip];
  if (has) {
    stripKids.push(h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [
      h('button', { class: 'chip ghost', onclick: () => { zoneMonths.clear(); render(); } }, '↺ Clear months'),
    ]));
  } else {
    stripKids.push(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) 0 0' },
      'Pick as many months as your trip covers — the regions re-sort and each one says whether it is a good time.'));
  }
  // The twelve-month strip sits behind a "By month" button rather than standing open: twelve
  // chips cost three rows of a phone screen. It opens automatically once months ARE chosen —
  // leaving it shut would strand a traveller on a June ordering with no visible reason for it.
  wrap.append(foldable(has ? `📅 By month · ${picked.map(monthShort).join(', ')}` : '📅 By month',
    stripKids, { open: has }));

  // With no month chosen the list keeps the manifest's own north-to-south order and shows no
  // verdict; with months chosen it re-sorts worst-last and every row carries its verdict.
  const ordered = has
    ? zones.map((z, i) => ({ zone: z, ...zoneVerdictAcross(z, zoneMonths), i }))
      .sort((a, b) => (VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict]) || (a.i - b.i))
    : zones.map((z, i) => ({ zone: z, verdict: null, byMonth: [], i }));

  const list = h('div', { class: 'zone-list' });
  ordered.forEach(({ zone: z, verdict, byMonth }) => {
    const n = placesInZone(cc, z.id).length;
    const towns = townsInZone(cc, z.id).length;
    const kids = [h('span', { class: 'zone-name' }, z.name)];
    if (verdict) {
      const when = zoneWhenAcross(z, verdict, byMonth, monthShort);
      kids.push(h('span', { class: `zone-when ${when.cls}` }, when.label));
      // The exceptions line: where somewhere INSIDE this region disagrees with it.
      const ex = zoneExceptions(cc, z, zoneMonths, verdict);
      if (ex.better.length) kids.push(h('span', { class: 'zone-exc is-best' }, `↑ Still good: ${ex.better.join(', ')}`));
      if (ex.worse.length) kids.push(h('span', { class: 'zone-exc is-avoid' }, `↓ Not then: ${ex.worse.join(', ')}`));
      kids.push(h('span', { class: 'zone-tag' }, z.tagline));
      if (when.why) kids.push(h('span', { class: 'zone-why muted' }, when.why));
    } else {
      kids.push(h('span', { class: 'zone-tag' }, z.tagline));
    }
    kids.push(h('span', { class: 'zone-count muted' }, `${towns} town${towns === 1 ? '' : 's'} · ${n} place${n === 1 ? '' : 's'}`));
    list.append(h('button', { class: 'zone-row', onclick: () => go(`#region-${cc}-${z.id}`) }, [
      h('span', { class: 'zone-emoji' }, z.emoji || '📍'),
      h('span', { class: 'zone-text' }, kids),
      h('span', { class: 'zone-go' }, '›'),
    ]));
  });
  wrap.append(list);
  return wrap;
}

// WHERE THE REGION'S VERDICT IS WRONG FOR SOMEWHERE INSIDE IT (direct request).
//
// "It isn't good to go to the Northern Highlands in June, July, August, but it is good in Sapa
// and Ta Van" — a region-level verdict flattens a region, and the app already holds the finer
// data to unflatten it: js/data/history.js carries bestM/avoidM per CITY and
// js/data/place-months.js carries them per PLACE, both under the same editorial rule as the
// region tier (every month claimed must be named by that record's own prose — enforced by
// scripts/check-month-arrays.py).
//
// So: for the months in hand, find the towns and places inside this region whose verdict
// disagrees with the region's, in the direction that matters. A poor region with somewhere
// good in it is a trip saved; a good region with somewhere closed in it is a wasted day.
// Returns { better: string[], worse: string[] } — names only, capped for a phone row.
function zoneExceptions(cc, z, months, regionVerdict) {
  const list = [...months];
  if (!list.length) return { better: [], worse: [] };
  const anyIs = (obj, want) => obj && list.some((m) => verdictFor(obj, m) === want);

  // MEMBERSHIP HAS TO BE REAL, or the line states something false. Zone membership is
  // geometric (point-in-province over simplified outlines — see zoneAssignment), so a single
  // place can drift over a border: one of Ninh Binh's 22 records, Cuc Phuong National Park,
  // sits on the Hoa Binh line and lands in the Northern Highlands. That was enough for
  // townsInZone to call Ninh Binh a town of the Northern Highlands, and for this line to
  // read "Northern Highlands — still good: Ninh Binh", which is simply not where it is.
  // So a town qualifies only when MOST of its places are in this zone.
  const byPlace = zoneAssignment(cc);
  const totals = {};
  const here = {};
  allPlaces({ country: cc }).forEach((pl) => {
    if (!pl.city) return;
    totals[pl.city] = (totals[pl.city] || 0) + 1;
    if (byPlace.get(pl.id) === z.id) here[pl.city] = (here[pl.city] || 0) + 1;
  });
  const belongs = (city) => (here[city] || 0) * 2 >= (totals[city] || 0);

  // A guide-style record is not a place a traveller avoids in a month. These read as
  // sentences ("Where to stay in Ha Long: the Bai Chay side") and only ever made the line
  // longer and less believable.
  const isArticle = (name) => /^(where|how|what|getting|when)\b/i.test(name) || name.includes(': ');
  const better = new Map();      // display name -> normalised key, so near-duplicates collapse
  const worse = new Map();
  const norm = (x) => x.toLowerCase().replace(/\b(islands?|national park|complex|province|city)\b/g, '').replace(/[^a-z]/g, '');
  // SHORTEN a long name rather than drop it. A first pass rejected anything over 32
  // characters and so lost the very exception this feature exists to surface: "Silver
  // Waterfall (Thac Bac) & Love Waterfall (Thac Tinh Yeu)" is 60 characters, is in Sapa, and
  // is at its best in exactly the June-to-August window the Northern Highlands is poor in.
  // Two records joined by "&" become the first of them, and a parenthetical local name comes
  // off — both are already shown in full on the place's own page.
  const shorten = (name) => {
    let out = String(name).split(/\s+[&\/]\s+/)[0];
    out = out.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return out;
  };
  const add = (map, raw) => {
    const name = shorten(raw);
    if (!name || isArticle(name) || name.length > 32) return;
    const k = norm(name);
    if (!k) return;
    // Keep the SHORTER of two names for the same thing: "Con Dao" over "Con Dao Islands".
    const existing = [...map.entries()].find(([, kk]) => kk === k);
    if (existing) { if (name.length < existing[0].length) { map.delete(existing[0]); map.set(name, k); } return; }
    map.set(name, k);
  };

  // City tier first: a town name is what a traveller recognises and can act on.
  townsInZone(cc, z.id).forEach(({ city }) => {
    if (!belongs(city)) return;
    const hi = cityHistory(cc, citySlug(city));
    if (!hi) return;
    if (regionVerdict !== 'best' && anyIs(hi, 'best')) add(better, city);
    if (regionVerdict !== 'avoid' && anyIs(hi, 'avoid')) add(worse, city);
  });
  // Place tier: only where the city tier said nothing about that city, so a row never names
  // both "Sapa" and three waterfalls in Sapa. PLACE_MONTHS is 52 hand-curated entries, so
  // this adds a handful of genuinely specific exceptions rather than noise.
  placesInZone(cc, z.id).forEach((pl) => {
    const pm = PLACE_MONTHS[pl.id];
    if (!pm || !pl.city || !belongs(pl.city)) return;
    if (better.has(pl.city) || worse.has(pl.city)) return;
    if (regionVerdict !== 'best' && anyIs(pm, 'best')) add(better, pl.name);
    if (regionVerdict !== 'avoid' && anyIs(pm, 'avoid')) add(worse, pl.name);
  });
  // Three names is what a phone row holds and what a reader takes in.
  return { better: [...better.keys()].slice(0, 3), worse: [...worse.keys()].slice(0, 3) };
}

// The region's facts as a compact definition grid — deliberately terse rows, not prose, so
// the whole orientation reads in one glance. `notFor` is the honest counterweight: what this
// region is NOT good for, which is usually the fastest way to rule a place in or out.
function zoneFactsCard(z, cc) {
  const rows = [
    ['Good for', z.suits],
    ['Not for', z.notFor],
    ['Best months', z.bestMonths],
    ['Avoid', z.avoidMonths],
    ['How long', z.howLong],
    ['Getting around', z.gettingAround],
    ['Arrive at', z.gateway],
  ].filter(([, v]) => v);
  const card = h('div', { class: 'card zone-facts' }, [h('h2', {}, `${z.emoji || '📍'} ${z.name}`)]);
  card.append(h('p', { class: 'zone-lead' }, z.tagline));
  // Lead with the verdict for the months the traveller chose on the region chooser — the same
  // set, so planning October and November does not have to be re-picked on every region page.
  // With none chosen there is no verdict here either: the "Best months" and "Avoid" rows of
  // the grid below carry the region's own sentences, which is the honest answer to "when",
  // and a badge asserting today's month is not.
  if (zoneMonths.size) {
    const monthShort = (n) => new Date(2020, n - 1, 1).toLocaleDateString(dateLocale(), { month: 'short' });
    const { verdict, byMonth } = zoneVerdictAcross(z, zoneMonths);
    const vLine = zoneWhenAcross(z, verdict, byMonth, monthShort);
    card.append(h('p', { class: `zone-when ${vLine.cls}` }, vLine.label));
    // And the same within-region exceptions the chooser shows, because this is the page a
    // traveller lands on after reading "✗ Poor in Jun, Jul" and wanting to know if any of it
    // is still worth the trip.
    const ex = cc ? zoneExceptions(cc, z, zoneMonths, verdict) : { better: [], worse: [] };
    if (ex.better.length) card.append(h('p', { class: 'zone-exc is-best' }, `↑ Still good then: ${ex.better.join(', ')}`));
    if (ex.worse.length) card.append(h('p', { class: 'zone-exc is-avoid' }, `↓ Not then: ${ex.worse.join(', ')}`));
  }
  const dl = h('dl', { class: 'zone-dl' });
  rows.forEach(([k, v]) => { dl.append(h('dt', {}, k), h('dd', {}, v)); });
  card.append(dl);
  return card;
}

// The verdict label for a set of months. When the months disagree it names WHICH are good and
// which are not, rather than collapsing to "mixed" and leaving the traveller to guess — that
// split is the whole reason multi-month selection is useful.
function zoneWhenAcross(z, verdict, byMonth, monthShort) {
  const names = (want) => byMonth.filter((x) => x.v === want).map((x) => monthShort(x.m));
  const all = byMonth.map((x) => monthShort(x.m)).join(', ');
  if (verdict === 'best') return { label: `✓ Good in ${all}`, cls: 'is-best', why: z.bestMonths };
  if (verdict === 'avoid') return { label: `✗ Poor in ${all}`, cls: 'is-avoid', why: z.avoidMonths };
  if (verdict === 'shoulder') return { label: `· Shoulder in ${all}`, cls: 'is-shoulder', why: `Best months: ${z.bestMonths}` };
  const good = names('best');
  const bad = names('avoid');
  const parts = [good.length ? `✓ ${good.join(', ')}` : '', bad.length ? `✗ ${bad.join(', ')}` : ''].filter(Boolean);
  return {
    label: parts.length ? parts.join(' · ') : `± Depends in ${all}`,
    cls: 'is-mixed',
    why: [z.bestMonths, z.avoidMonths ? `Avoid: ${z.avoidMonths}` : ''].filter(Boolean).join(' · '),
  };
}

// A region's verdict across a SET of months, plus the split when the months disagree.
//
// The combining rule is deliberately not "worst wins". A traveller choosing June, July and
// August wants to know that the first two are poor and the third is fine, not that the block
// is "poor" — that is the difference between ruling a region out and moving the trip by a
// fortnight. So the verdict is 'best' or 'avoid' only when EVERY chosen month agrees, and
// otherwise it is 'mixed' with the months named.
function zoneVerdictAcross(z, months) {
  const list = [...months].sort((a, b) => a - b);
  const byMonth = list.map((m) => ({ m, v: monthVerdict(z, m) }));
  const kinds = new Set(byMonth.map((x) => x.v));
  if (kinds.size === 1) return { verdict: [...kinds][0], byMonth };
  if (kinds.has('best') || kinds.has('avoid') || kinds.has('mixed')) return { verdict: 'mixed', byMonth };
  return { verdict: 'shoulder', byMonth };
}

// A clickable, coloured SVG map of one country's provinces. opts.activeCode highlights one;
// opts.onPick(code) fires on tap/Enter. Pure SVG + offline — no tiles, no network.
function regionsMap(cc, opts = {}) {
  const set = regionSetFor(cc);
  if (!set) return null;
  const proj = set.proj;
  const shapes = set.provinces.map((p, i) => {
    const active = opts.activeCode && p.code === opts.activeCode;
    // When one province is highlighted, the rest go a muted slate so the active one — in
    // its own bright colour — clearly pops while neighbours stay visible and tappable.
    const fill = active ? REGION_PALETTE[i % REGION_PALETTE.length]
      : (opts.activeCode ? '#8A94A6' : REGION_PALETTE[i % REGION_PALETTE.length]);
    const op = active ? 0.98 : (opts.activeCode ? 0.55 : 0.62);
    return `<g class="prov-group${active ? ' active' : ''}" data-code="${esc(p.code)}" role="button" tabindex="0" aria-label="${esc(p.name)}">`
      + `<path class="prov" d="${provincePathD(p, proj)}" fill="${fill}" fill-opacity="${op}"/></g>`;
  }).join('');
  const cName = (getCountry(cc) || {}).name || '';
  const svg = `<svg viewBox="${set.viewBox}" class="regions-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Provinces of ${esc(cName)}" xmlns="http://www.w3.org/2000/svg">${shapes}${youAreHereMark(proj, set.viewBox)}</svg>`;
  const box = h('div', { class: 'regions-map', html: svg });
  box.querySelectorAll('.prov-group').forEach((g) => {
    const code = g.getAttribute('data-code');
    const pick = () => { if (opts.onPick) opts.onPick(code); };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  return box;
}

// The zone map: same SVG projection and province paths as regionsMap, but every province of
// a zone shares one fill and one hit target, so the country reads as 4-6 tappable areas.
// opts.activeId highlights one; opts.onPick(zoneId) fires on tap/Enter.
function zonesMap(cc, opts = {}) {
  const set = regionSetFor(cc);
  const zones = zonesFor(cc);
  if (!set || !zones.length) return null;
  const proj = set.proj;
  const byCode = {};
  set.provinces.forEach((pr) => { byCode[pr.code] = pr; });
  const shapes = zones.map((z, i) => {
    const active = opts.activeId && z.id === opts.activeId;
    const fill = (opts.activeId && !active) ? '#8A94A6' : REGION_PALETTE[i % REGION_PALETTE.length];
    const op = active ? 0.98 : (opts.activeId ? 0.5 : 0.68);
    const d = z.provinces.map((code) => (byCode[code] ? provincePathD(byCode[code], proj) : '')).filter(Boolean).join(' ');
    if (!d) return '';
    return `<g class="zone-group${active ? ' active' : ''}" data-zone="${esc(z.id)}" role="button" tabindex="0" aria-label="${esc(z.name)}">`
      + `<path class="zone" d="${d}" fill="${fill}" fill-opacity="${op}"/></g>`;
  }).join('');
  const cName = (getCountry(cc) || {}).name || '';
  const svg = `<svg viewBox="${set.viewBox}" class="regions-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Regions of ${esc(cName)}" xmlns="http://www.w3.org/2000/svg">${shapes}${youAreHereMark(proj, set.viewBox)}</svg>`;
  const box = h('div', { class: 'regions-map', html: svg });
  box.querySelectorAll('.zone-group').forEach((g) => {
    const id = g.getAttribute('data-zone');
    const pick = () => { if (opts.onPick) opts.onPick(id); };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  return box;
}
