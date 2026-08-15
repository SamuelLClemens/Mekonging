// Places — the decide-now shortlist: living map, interest/budget/stay filters, distance
// tiers, compare tray, and the place-card/quick-row/save/trip-visit primitives several
// not-yet-extracted main.js screens (signature sights strip, saved, collections, trip) still
// reach back in for.
// Extracted from main.js (module split, task #205 step 4) — placesScreen() itself, plus every
// helper its own body or its row renderers call directly: the map/area/tools card builders,
// travelerChips/colorKeyCard/marketChip/beachChip (small cross-cutting chips also read by
// placeScreen, which is why they moved here rather than staying detail-only as first scoped —
// see the task's own note on trusting the verified call graph over stale classification),
// placeCard/placeQuickRow, and the saveSheet/collRow/tripVisitSheet action sheets.
// placeScreen() (the place-detail page) and its detail-only helper cluster (market/beach info
// cards, external ratings, orientation+access, transit, local secrets, photos) are a
// deliberately separate, higher-risk step (step 5) — see task #205's description for the full
// ordered sequence. resolveItem, formatMarketDays and jellyInSeason stay in main.js for now
// (their bigger detail-cluster callers haven't moved yet) and are reverse-imported below;
// they relocate here too once step 5 lands, and these three imports drop out then.
import {
  store, save, getPlaceData, getLastFix, setLastFix, getMyStay, setMyStay, clearMyStay,
  getSavedAreas, addSavedArea, removeSavedArea, addPlaceVisit, removePlaceVisit,
  toggleFavorite, isFavorite, createCollection, togglePlaceInCollection, collectionsForItem,
} from '../state.js';
import { getActiveCountry, setActiveCountry, setLiveCleanup } from '../app-state.js';
import { h, geolocate, bearing, compass, fmtDistance, titleCase, mapsUrl } from '../util.js';
import {
  haversineKm, distanceChip, withinNear, withinDayTrip, attrTag, starsStr, isMarket, isBeach,
  placeBucket, FAMILY_META, catColor, catTag, tierColor, swatch, citySlug, PRICE_TIER_LABEL,
  tierBadge, PLACE_BUCKETS, BUCKET_COLOR, bucketColor, marketOpenDays, personalScore,
  CATEGORY_FAMILIES,
} from '../render-utils.js';
import { collapsibleCard, openModal } from '../ui-widgets.js';
import { INTERESTS, COLLECTION_PRESETS, getCountry, allPlaces } from '../data/regions.js';
import {
  go, mount, topbar, render, focusSpot, setFocusSpot, spotForCity, oneTimeHint,
  travellingAsLine, countryChips, cityAboutCard, cityEssentials, placeFamily, placePhotoSrc,
  placePhotoKeys, priceLine, stopDateLabel, resolveItem, formatMarketDays, jellyInSeason,
  chipIcon,
} from '../main.js';

// Closes the tail this guide does not (yet) curate: a live Google Maps search centred on
// wherever Places is anchored right now, via the same mapsUrl() deep link every place-detail
// page already uses for "Open in Google Maps".
function placesMapsFallback(anchor, label) {
  return h('a', {
    class: 'btn ghost block', style: 'margin:10px 0 4px',
    href: mapsUrl({ coords: anchor }), target: '_blank', rel: 'noopener',
  }, `🗺 Not seeing it? Search near ${label} on Google Maps →`);
}

export function placesScreen(arg) {
  // arg is "<cc>" or "<cc>-<citySlug>" (e.g. "th" or "th-chiang-mai").
  const parts = String(arg || '').split('-');
  const cc = parts.shift() || getActiveCountry();
  const scopeSlug = parts.join('-');
  if (cc) setActiveCountry(cc);
  const wrap = h('div', { class: 'screen' });
  // Resolve the scoped city's display name from the data (fall back to the slug).
  const scopeCity = scopeSlug
    ? (allPlaces({ country: getActiveCountry() }).map((p) => p.city).find((c) => citySlug(c) === scopeSlug) || titleCase(scopeSlug.replace(/-/g, ' ')))
    : '';
  wrap.append(topbar(scopeCity ? `Places in ${scopeCity}` : 'Places for you'));
  wrap.append(countryChips((id) => go(`#places-${id}`)));
  { const t = oneTimeHint('places-living-map', 'Your decide-now shortlist — nearest and best-matched first. Tap a category chip to filter; map and list stay in sync. Want to browse a whole region? That is what Explore is for.'); if (t) wrap.append(t); }
  // Who these results are being ranked and tagged for (one line, also the edit control).
  wrap.append(travellingAsLine());
  // Places anchors on where the traveller actually is, and never offers a "browse all of the
  // country" mode any more — that whole-country, grouped-by-category browsing now lives on
  // Explore. An explicit city scope (tapped from Explore, or a "Places in X" link) always wins
  // over GPS — that is a "show me near THIS city" request, not a "where am I" one. Otherwise a
  // live GPS fix wins, falling back to the same focus-spot/capital chain "Things to do" and
  // weather already use, so every screen agrees on "here" even with no location at all.
  let cSpot = null;
  if (scopeCity) {
    // Browsing a city makes it the traveller's focus, so weather + "today" + "right now"
    // follow this city (not the capital) until GPS or another city overrides it.
    cSpot = spotForCity(getActiveCountry(), scopeCity);
    if (cSpot) setFocusSpot(cSpot);
    // Reference material, not results — collapsed by default so the map above stays the
    // focus; rank-collapse-never-remove: both stay one tap away, just no longer in the way.
    const ac = cityAboutCard(getActiveCountry(), scopeSlug);
    if (ac) wrap.append(collapsibleCard(ac, null, false));
    wrap.append(h('details', { class: 'filters-collapse' }, [
      h('summary', {}, '🕒 Right now'),
      cityEssentials(getActiveCountry(), scopeCity, scopeSlug),
    ]));
  }
  let anchor, anchorLabel, usingGps = false;
  if (scopeCity && cSpot) {
    anchor = { lat: cSpot.lat, lng: cSpot.lng };
    anchorLabel = scopeCity;
  } else {
    const fsAnchor = focusSpot(getActiveCountry());
    const gpsFix = getLastFix();
    usingGps = !!gpsFix && fsAnchor.source === 'gps';
    anchor = usingGps ? gpsFix : { lat: fsAnchor.spot.lat, lng: fsAnchor.spot.lng };
    anchorLabel = scopeCity || fsAnchor.spot.city;
  }

  // The living map sits at the very top of the section (below any city context) and is the
  // one thing on this whole screen that never collapses — Places is a map-first browse, so it
  // stays always visible and draws bigger (see .places-map-section .places-map in style.css).
  // Its mode bar and category-layer chips populate below. Both the map and the list are
  // FILLED by renderList() once the filtered results and their shared numbering are known, so a
  // list row and its map pin always carry the same number. Placeholders are appended now to
  // lock DOM order.
  const mapSection = h('div', { class: 'places-map-section' });
  const modeBar = h('div', { class: 'places-mode-bar' });
  const layerChipsRow = h('div', { class: 'layer-chips' });
  const mapWrap = h('div', {});
  const cap = h('p', { class: 'muted', style: 'margin:2px 2px 8px' }, '');
  mapSection.append(
    h('div', { class: 'places-map-head' }, '🗺 Map'),
    modeBar, layerChipsRow, mapWrap, cap,
  );
  wrap.append(mapSection);

  // Declared here (rather than down by the map-boot code, where it used to live) because
  // the My-accommodation/Saved-areas cards immediately below read it synchronously at
  // render time (to decide whether to show their map-dependent controls yet); the map.js
  // controller itself still only actually resolves later, via the async import near the
  // end of this function, same as before.
  let placesCtrl = null;

  // ---- My accommodation + saved offline areas ------------------------------------
  // Task #196 Phase 2 slice 1: now that map.js's "way back" line, my-accommodation marker
  // and offline-area tile helpers are mode-independent (see map.js), Places' own embedded
  // map can offer the same things #map does, without leaving this screen. placesCtrl (below)
  // only resolves a moment after this runs (async import), so every action here checks it is
  // set before touching it — harmless no-ops (or a hidden button) until then.
  // A details/summary wrapper matching collapsibleCard's visual output (card+foldcard classes,
  // foldcard-sum summary) but — unlike collapsibleCard, which MOVES a card's children into the
  // new <details> once and discards the now-empty original node — keeps `bodyEl` itself as the
  // live child. Needed here because both cards below re-render their own content repeatedly
  // (once placesCtrl resolves, on stay/area changes, live GPS updates); collapsibleCard's
  // one-shot child-extraction would silently orphan every later re-render from the visible DOM.
  function foldedCard(title, bodyEl, key, defaultOpen) {
    const det = h('details', { class: 'card foldcard' });
    const pref = key ? store.profile.prefs[key] : undefined;
    if (pref === undefined ? defaultOpen : pref) det.setAttribute('open', '');
    det.append(h('summary', { class: 'foldcard-sum' }, title), bodyEl);
    if (key) det.addEventListener('toggle', () => { store.profile.prefs[key] = det.open; save(); });
    return det;
  }
  const stayBannerP = h('p', { style: 'margin:4px 0;font-weight:700' }, '');
  const stayCard = h('div', { class: 'card' });
  let stayFixP = null;
  function updateStayBannerP() {
    const stay = getMyStay();
    if (!stay || !stay.coords) return;
    stayBannerP.textContent = stayFixP
      ? `${fmtDistance(haversineKm(stayFixP, stay.coords))} · ${compass(bearing(stayFixP, stay.coords))} to your stay`
      : 'Tap the ⊕ locate button on the map to see distance and direction back.';
  }
  async function setStayHereP() {
    stayBannerP.textContent = 'Getting your location…';
    try {
      const pos = await geolocate();
      const s = setMyStay({ name: (getMyStay() || {}).name || 'My stay', coords: { lat: pos.lat, lng: pos.lng } });
      if (placesCtrl) { placesCtrl.setMyStay(s.coords); if (stayFixP) placesCtrl.setWayback(stayFixP, s.coords); }
      renderStayCard();
    } catch (err) { stayBannerP.textContent = 'Could not get your location: ' + err.message; }
  }
  function renderStayCard() {
    stayCard.textContent = '';
    const stay = getMyStay();
    if (stay && stay.coords) {
      stayCard.append(
        h('p', {}, [h('strong', {}, stay.name || 'My stay'), h('span', { class: 'muted' }, ` · ${stay.coords.lat.toFixed(4)}, ${stay.coords.lng.toFixed(4)}`)]),
        stayBannerP,
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;margin-top:6px' }, [
          h('button', { class: 'btn', onclick: () => {
            if (placesCtrl && stayFixP) { placesCtrl.setWayback(stayFixP, stay.coords); placesCtrl.frameBoth(stayFixP, stay.coords); }
            else if (placesCtrl) { placesCtrl.goToStay(stay.coords); }
          } }, '🧭 Show the way back'),
          h('a', { class: 'btn ghost', href: `https://www.google.com/maps/dir/?api=1&destination=${stay.coords.lat},${stay.coords.lng}`, target: '_blank', rel: 'noopener' }, 'Open in Maps ↗'),
          h('button', { class: 'btn ghost', onclick: () => { if (placesCtrl) placesCtrl.goToStay(stay.coords); } }, 'Show on map'),
          h('button', { class: 'btn ghost', onclick: setStayHereP }, 'Move to here'),
          h('button', { class: 'btn ghost', onclick: () => { clearMyStay(); if (placesCtrl) { placesCtrl.setMyStay(null); placesCtrl.setWayback(null, null); } renderStayCard(); } }, 'Clear'),
        ]),
      );
      updateStayBannerP();
    } else {
      stayCard.append(
        h('p', { class: 'muted' }, 'Save where you are staying and the map will always show the distance and direction back to it — even offline.'),
        h('button', { class: 'btn block', onclick: setStayHereP }, '📍 Set my stay to my current location'),
      );
    }
  }
  renderStayCard();
  wrap.append(foldedCard('🏠 My accommodation', stayCard, 'placesStayOpen', false));

  const areasStatusP = h('p', { class: 'muted', style: 'margin:4px 0;font-size:13px' }, '');
  const areasCard = h('div', { class: 'card' });
  const swAvailableP = ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller;
  function estimateAreaP() {
    if (!placesCtrl) { areasStatusP.textContent = 'The map is still loading — try again in a moment.'; return; }
    const urls = placesCtrl.getDownloadTiles(1000);
    if (!urls.length) { areasStatusP.textContent = 'Nothing to save at this view — zoom in to an area first.'; return; }
    const viewInfo = placesCtrl.getViewInfo();
    const mbNum = urls.length * 0.018;
    const mb = mbNum < 10 ? mbNum.toFixed(1) : String(Math.round(mbNum));
    areasStatusP.textContent = '';
    areasStatusP.append(
      `This view is about ${urls.length} satellite tiles (~${mb} MB). `,
      h('button', { class: 'linklike', onclick: () => downloadAreaP(urls, viewInfo) }, 'Download now'),
      ' · ',
      h('button', { class: 'linklike', onclick: () => { areasStatusP.textContent = ''; } }, 'Cancel'),
    );
  }
  async function downloadAreaP(urls, viewInfo) {
    areasStatusP.textContent = `Saving ${urls.length} map tiles for offline…`;
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === 'PREFETCH_PROGRESS') { areasStatusP.textContent = `Saving map tiles… ${d.done}/${d.total}`; return; }
      if (d.type !== 'PREFETCH_DONE') return;
      navigator.serviceWorker.removeEventListener('message', onMsg);
      if (d.quotaHit) { areasStatusP.textContent = `Storage is full — saved ${d.ok} tiles before stopping. Remove a saved area below, then try a smaller view.`; return; }
      if (d.ok > 0 && viewInfo) {
        const def = (placesCtrl && placesCtrl.nearestCityName && placesCtrl.nearestCityName()) || 'Saved area';
        const name = (prompt('Name this offline area:', def) || def).trim() || def;
        addSavedArea({ name, center: viewInfo.center, bounds: viewInfo.bounds, z: Math.floor(viewInfo.zoom), count: d.ok });
      }
      areasStatusP.textContent = '';
      renderAreasCard();
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    let protect = [];
    try { protect = getSavedAreas().flatMap((a) => (placesCtrl && placesCtrl.tileUrlsForArea) ? placesCtrl.tileUrlsForArea(a.bounds, a.z) : []); } catch { /* best-effort */ }
    navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TILES', urls, protect });
  }
  function deleteAreaP(a) {
    removeSavedArea(a.id); renderAreasCard();
    if (placesCtrl && swAvailableP && a.bounds && navigator.serviceWorker.controller) {
      const urls = placesCtrl.tileUrlsForArea(a.bounds, a.z || 12, 1000);
      const onMsg = (e) => { if ((e.data || {}).type === 'DELETE_DONE') { navigator.serviceWorker.removeEventListener('message', onMsg); renderAreasCard(); } };
      navigator.serviceWorker.addEventListener('message', onMsg);
      navigator.serviceWorker.controller.postMessage({ type: 'DELETE_TILES', urls });
    }
  }
  function renderAreasCard() {
    areasCard.textContent = '';
    const dlBtn = h('button', { class: 'btn ghost', onclick: estimateAreaP }, '⬇ Save this map view for offline');
    if (!swAvailableP || !placesCtrl) dlBtn.style.display = 'none';
    areasCard.append(dlBtn, areasStatusP);
    const areas = getSavedAreas();
    if (!areas.length) {
      areasCard.append(h('p', { class: 'muted' }, 'Save the view above to use the satellite map with no signal. Each area you save is listed here and can be removed on its own.'));
      return;
    }
    areas.forEach((a) => {
      const mbNum = (a.count || 0) * 0.018;
      const mb = mbNum < 10 ? mbNum.toFixed(1) : String(Math.round(mbNum));
      areasCard.append(h('div', { class: 'row-between price-item' }, [
        h('div', {}, [h('strong', {}, a.name), h('div', { class: 'muted', style: 'font-size:12px' }, `${a.count || 0} tiles · ~${mb} MB · saved ${a.savedAt}`)]),
        h('div', { class: 'cats' }, [
          h('button', { class: 'chip', title: 'Show on map', 'aria-label': `Show ${a.name} on map`, onclick: () => { if (placesCtrl && a.center) placesCtrl.flyTo(a.center.lng, a.center.lat, a.z || 12); } }, '◎'),
          h('button', { class: 'chip', 'aria-label': `Delete ${a.name}`, onclick: () => deleteAreaP(a) }, '✕'),
        ]),
      ]));
    });
  }
  renderAreasCard();
  wrap.append(foldedCard('🗂️ Saved offline areas', areasCard, 'placesAreasOpen', false));

  // ---- Map search: always visible, never buried ----------------------------------
  // Reported bug: the map used to only ever show wherever GPS/last-focused-city resolved
  // to (see the focusSpot() fix, main.js), with no way to look anywhere else short of
  // leaving Places for Explore. This search is the fix for that half of the report — it is
  // global (placesCtrl.search() indexes CITY_COORDS + allPlaces() + POOLS + pins across all
  // four countries, not just the active one, see map.js searchIndex) — so it used to sit
  // hidden inside the collapsed "More map tools" card below, where nobody browsing near
  // themselves would ever find it. Promoted here, directly under the map, so "see any place
  // in any country" is one always-visible search box away rather than a buried toggle.
  const mapSearchResultsP = h('div', { class: 'map-search-results' });
  const MAP_SEARCH_ICON = { City: '🏙️', Place: '📍', Pool: '🏊', Pin: '📌' };
  function runMapSearchP() {
    mapSearchResultsP.textContent = '';
    const q = mapSearchInputP.value.trim();
    if (!placesCtrl || q.length < 2) return;
    const matches = placesCtrl.search(q);
    if (!matches.length) { mapSearchResultsP.append(h('p', { class: 'muted', style: 'padding:6px 4px;font-size:13px' }, 'No matches in the offline data.')); return; }
    matches.forEach((m) => mapSearchResultsP.append(
      h('button', { class: 'btn ghost block', style: 'justify-content:flex-start;margin-top:4px', onclick: () => {
        placesCtrl.flyTo(m.lng, m.lat, m.z);
        mapSearchResultsP.textContent = ''; mapSearchInputP.value = '';
      } }, `${MAP_SEARCH_ICON[m.type] || '•'}  ${m.name}  ·  ${m.type}`)));
  }
  const mapSearchInputP = h('input', { type: 'search', class: 'map-search', placeholder: 'Search any city or place, in any country…', 'aria-label': 'Search the map', autocomplete: 'off', oninput: runMapSearchP });
  // Appended into mapSection (not toolsCard) — lands right after the map/caption, still
  // above every collapsed card, so it never depends on placesCtrl having resolved yet to be
  // visible (runMapSearchP itself already no-ops safely until it has).
  mapSection.append(h('div', { class: 'map-search-wrap', style: 'margin:8px 0 2px' }, [mapSearchInputP, mapSearchResultsP]));

  // ---- More map tools: measure, borders -------------------------------------------
  // Task #196 Phase 2 slice 2: the same tools #map's standalone screen has always offered
  // are now available on every controller (map.js's shared-scope hoist, Phase 2 slice 1) —
  // this builds the Places-side UI for them, reusing #map's own copy and behaviour verbatim
  // so the two screens read as one feature, not two implementations. Search used to live
  // here too; it is now always-visible above (see comment there) — only the two tools a
  // traveller reaches for far less often stay tucked behind this collapsed card.
  let measuringP = false;
  const measureOutP = h('p', { class: 'map-hint', style: 'margin:8px 0 0;display:none' }, '');
  function fmtKmP(km) { return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 2 : 1)} km`; }
  function toggleMeasureP() {
    if (!placesCtrl) return;
    measuringP = !measuringP;
    if (measuringP) {
      measureBtnP.textContent = '📏 Measuring — tap the map'; measureBtnP.classList.add('toggle-on');
      measureOutP.style.display = ''; measureOutP.textContent = 'Tap two or more points on the map to measure the distance.';
      placesCtrl.toggleMeasure(true, (km, n) => {
        measureOutP.textContent = n < 2 ? 'Tap another point to measure…'
          : `Distance: ${fmtKmP(km)} over ${n} points. Tap to extend, or tap “Measure” again to finish.`;
      });
    } else {
      measureBtnP.textContent = '📏 Measure'; measureBtnP.classList.remove('toggle-on');
      measureOutP.style.display = 'none';
      placesCtrl.toggleMeasure(false);
    }
  }
  const measureBtnP = h('button', { class: 'btn ghost', onclick: toggleMeasureP }, '📏 Measure');

  // Same store.profile.prefs.mapLayers object #map itself reads/writes, so the borders
  // choice is one shared setting rather than a second, independent Places-only toggle.
  const mapLayersPrefsP = store.profile.prefs.mapLayers || (store.profile.prefs.mapLayers = { borders: true });
  const bordersCheckP = h('input', { type: 'checkbox', checked: mapLayersPrefsP.borders !== false ? '' : null,
    onchange: (e) => { mapLayersPrefsP.borders = e.target.checked; save(); if (placesCtrl) placesCtrl.setBorders(e.target.checked); } });

  const toolsCard = h('div', {}, [
    h('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap:10px' }, [
      measureBtnP,
      h('label', { style: 'display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer' }, [bordersCheckP, h('span', {}, '🗺️ Country borders')]),
    ]),
    measureOutP,
  ]);
  wrap.append(foldedCard('🛠 More map tools', toolsCard, 'placesToolsOpen', false));

  // interest filters (seeded from saved prefs the first time)
  const prefs = store.profile.prefs;
  const selInterests = new Set(prefs.interests || []);
  let selBudget = prefs.budget || 'flexible';
  let selKids = !!prefs.kids;
  let selStayType = prefs.stayType || 'any';
  let selStayDur = prefs.stayDuration || 'any';
  // Finding one named place is a "which one?" job in its own right — a momentary act, not a
  // standing preference, so (unlike every filter above) this is never persisted to prefs.
  let searchTerm = '';

  const interestChips = h('div', { class: 'chips' }, INTERESTS.map((it) =>
    h('button', {
      class: 'chip', 'aria-pressed': selInterests.has(it.id) ? 'true' : 'false', dataset: { it: it.id },
      onclick: (e) => {
        if (selInterests.has(it.id)) selInterests.delete(it.id); else selInterests.add(it.id);
        e.currentTarget.setAttribute('aria-pressed', selInterests.has(it.id) ? 'true' : 'false');
        prefs.interests = [...selInterests]; save();
        renderList();
      },
    }, [swatch(catColor(it.id)), ` ${it.emoji} ${it.label}`])));

  const budgets = [['flexible', PRICE_TIER_LABEL.flexible], ['low', PRICE_TIER_LABEL.low], ['mid', PRICE_TIER_LABEL.mid], ['high', PRICE_TIER_LABEL.high]];
  const budgetChips = h('div', { class: 'chips' }, budgets.map(([id, lbl]) =>
    h('button', {
      class: 'chip', 'aria-pressed': selBudget === id ? 'true' : 'false', dataset: { b: id },
      onclick: (e) => {
        selBudget = id;
        budgetChips.querySelectorAll('.chip').forEach((c) =>
          c.setAttribute('aria-pressed', c.dataset.b === id ? 'true' : 'false'));
        prefs.budget = id; save();
        renderList();
      },
    }, [swatch(tierColor(id)), ` ${lbl}`])));

  // Good-for-kids toggle (remembered in prefs).
  const kidsChip = h('button', {
    class: 'chip', 'aria-pressed': selKids ? 'true' : 'false',
    onclick: (e) => { selKids = !selKids; e.currentTarget.setAttribute('aria-pressed', selKids ? 'true' : 'false'); prefs.kids = selKids; save(); renderList(); },
  }, '👨‍👩‍👧 Good for kids');

  // Step-free filter appears when the traveller has a mobility need or the country has any
  // place tagged step-free — so the option is there for those who need it, unobtrusive otherwise.
  let selStepFree = false;
  const showStepFree = (store.profile.prefs.access || []).includes('mobility') || allPlaces({ country: getActiveCountry() }).some((p) => p.access && p.access.stepFree);
  const stepFreeChip = showStepFree ? h('button', {
    class: 'chip', 'aria-pressed': 'false',
    onclick: (e) => { selStepFree = !selStepFree; e.currentTarget.setAttribute('aria-pressed', selStepFree ? 'true' : 'false'); renderList(); },
  }, '♿ Step-free') : null;

  const filterCard = h('div', {}, [
    h('div', { class: 'muted' }, 'Interests'), interestChips,
    h('div', { class: 'muted' }, 'Price'), budgetChips,
    h('div', { class: 'muted' }, 'Travelling with'), h('div', { class: 'chips' }, [kidsChip, stepFreeChip]),
  ]);

  // Stay filters appear only when this country has accommodation tagged, so the UI
  // stays clean until stays exist for a country (remembered in prefs).
  const hasStays = allPlaces({ country: getActiveCountry() }).some((p) => p.stayType);
  // Declared outside the `if` so the active-filter pills below (built once, regardless of
  // whether this country has stays) can still look up their labels and "clear" targets.
  const stayTypes = [['any', 'Any'], ['tent', '⛺ Camp'], ['hostel', 'Hostel'], ['guesthouse', 'Guesthouse'], ['homestay', 'Homestay'], ['hotel', 'Hotel'], ['resort', 'Resort'], ['apartment', 'Apartment']];
  const stayDurs = [['any', 'Any length'], ['short', 'Short stay'], ['long', 'Long stay']];
  let stayTypeChips = null, stayDurChips = null;
  if (hasStays) {
    stayTypeChips = h('div', { class: 'chips' }, stayTypes.map(([id, lbl]) =>
      h('button', { class: 'chip', 'aria-pressed': selStayType === id ? 'true' : 'false', dataset: { s: id },
        onclick: (e) => { selStayType = id; stayTypeChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.s === id ? 'true' : 'false')); prefs.stayType = id; save(); renderList(); } }, lbl)));
    stayDurChips = h('div', { class: 'chips' }, stayDurs.map(([id, lbl]) =>
      h('button', { class: 'chip', 'aria-pressed': selStayDur === id ? 'true' : 'false', dataset: { d: id },
        onclick: (e) => { selStayDur = id; stayDurChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.d === id ? 'true' : 'false')); prefs.stayDuration = id; save(); renderList(); } }, lbl)));
    filterCard.append(h('div', { class: 'muted' }, 'Where to stay'), stayTypeChips, stayDurChips);
  }

  // Category LAYERS — pick any combination of place types to show on the map AND the list.
  // An empty selection means "all layers". Persisted so a chosen set survives navigation.
  const selLayers = new Set(Array.isArray(prefs.placesLayers) ? prefs.placesLayers : []);
  const presentBuckets = new Set(allPlaces({ country: getActiveCountry() }).map((p) => placeBucket(p)));
  function buildLayerChips() {
    layerChipsRow.innerHTML = '';
    const allOn = selLayers.size === 0;
    layerChipsRow.append(h('button', {
      class: 'layer-chip', 'aria-pressed': allOn ? 'true' : 'false',
      style: allOn ? 'background:var(--ink);border-color:transparent;color:var(--card)' : '',
      onclick: () => { selLayers.clear(); prefs.placesLayers = []; save(); buildLayerChips(); renderList(); },
    }, 'All'));
    PLACE_BUCKETS.forEach(([key, label]) => {
      if (!presentBuckets.has(key)) return;
      const on = selLayers.has(key);
      const color = BUCKET_COLOR[key] || BUCKET_COLOR.other;
      layerChipsRow.append(h('button', {
        class: 'layer-chip', 'aria-pressed': on ? 'true' : 'false', dataset: { layer: key },
        style: on ? `background:${color};border-color:transparent` : '',
        onclick: () => { if (selLayers.has(key)) selLayers.delete(key); else selLayers.add(key); prefs.placesLayers = [...selLayers]; save(); buildLayerChips(); renderList(); },
      }, [h('span', { class: 'layer-dot', style: `background:${color}` }), label.replace(/^\S+\s/, '')]));
    });
  }
  buildLayerChips();

  // Mode bar: a plain STATUS label (where "near" is centred) on the left, and — since a scoped
  // city already has its own "↩" escape hatch below, this only ever needs ONE further action —
  // either "drop the city scope, use my location" or "get a precise GPS fix" on the right.
  modeBar.append(h('span', { class: 'mode-state' }, `📍 Near ${anchorLabel}`));
  modeBar.append(h('span', { style: 'flex:1' }));
  if (scopeSlug) {
    modeBar.append(h('button', { class: 'chip', onclick: () => go(`#places-${getActiveCountry()}`) }, '↩ Use my location instead'));
  } else if (!usingGps && typeof navigator !== 'undefined' && navigator.geolocation) {
    const locBtn = h('button', { class: 'chip' }, '📍 Use my location');
    locBtn.onclick = async () => {
      locBtn.textContent = 'Locating…';
      try { setLastFix(await geolocate()); render(); }
      catch { locBtn.textContent = '📍 Location unavailable'; setTimeout(() => { locBtn.textContent = '📍 Use my location'; }, 1800); }
    };
    modeBar.append(locBtn);
  }

  // Results-first: the filter rows collapse into one tap so places show immediately
  // instead of being pushed below ~5 rows of chips. The summary shows how many filters
  // are active, so a returning traveller still sees their choices are applied. Category
  // LAYERS count here too — before this, an active layer filter (set via the chips above
  // the map) was invisible everywhere near the results, and silently followed navigation
  // into a scoped city view.
  // Filters live in a spring-up bottom sheet so the results stay on top and the controls are
  // one tap away, rather than pushing the list down. The count on the button re-reads live.
  const countFilters = () => selLayers.size + selInterests.size + (selBudget !== 'flexible' ? 1 : 0)
    + (selKids ? 1 : 0) + (selStepFree ? 1 : 0)
    + (selStayType !== 'any' ? 1 : 0) + (selStayDur !== 'any' ? 1 : 0);
  const filterLabel = () => (countFilters() ? `⚙ Filters · ${countFilters()} on` : '⚙ Filters');
  const filterBtn = h('button', { class: 'btn ghost block', style: 'margin:4px 0' }, filterLabel());
  filterBtn.onclick = () => {
    const backdrop = h('div', { class: 'sheet-backdrop' });
    const sheet = h('div', { class: 'sheet filter-sheet', role: 'dialog', 'aria-label': 'Filters' });
    // openModal appends to <body> itself and gives this sheet Escape-to-close, a focus trap,
    // and (via closeAllModals in the hashchange listener) auto-close on navigation — the same
    // behaviour every other sheet in the app gets, instead of a hand-rolled backdrop click only.
    let close;
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    sheet.append(h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }));
    sheet.append(h('h3', {}, 'Filters'));
    sheet.append(filterCard);
    sheet.append(h('button', { class: 'btn block', style: 'margin-top:12px', onclick: () => close() }, 'Show results'));
    backdrop.append(sheet);
    close = openModal(backdrop, () => { filterBtn.textContent = filterLabel(); });
  };

  // Active-filter pills sit directly above the results — every filter clears from here,
  // by triggering the exact control it mirrors (same click handler, no duplicated logic),
  // so state can never drift between a pill and its source chip.
  const pillsRow = h('div', { class: 'chips', style: 'margin:2px 0 4px' });
  function renderActivePills() {
    pillsRow.innerHTML = '';
    const pill = (label, onClear) => h('button', { class: 'chip', 'aria-pressed': 'true', onclick: onClear }, [label, ' ✕']);
    if (searchTerm.trim()) pillsRow.append(pill(`🔎 “${searchTerm.trim()}”`, () => { searchTerm = ''; searchBox.value = ''; renderList(); }));
    selLayers.forEach((key) => {
      const b = PLACE_BUCKETS.find((x) => x[0] === key);
      if (b) pillsRow.append(pill(b[1].replace(/^\S+\s/, ''), () => layerChipsRow.querySelector(`[data-layer="${key}"]`)?.click()));
    });
    selInterests.forEach((id) => {
      const it = INTERESTS.find((x) => x.id === id);
      if (it) pillsRow.append(pill(`${it.emoji} ${it.label}`, () => interestChips.querySelector(`[data-it="${id}"]`)?.click()));
    });
    if (selBudget !== 'flexible') {
      const b = budgets.find(([id]) => id === selBudget);
      pillsRow.append(pill(b ? b[1] : selBudget, () => budgetChips.querySelector('[data-b="flexible"]')?.click()));
    }
    if (selKids) pillsRow.append(pill('👨‍👩‍👧 Kids OK', () => kidsChip.click()));
    if (selStepFree) pillsRow.append(pill('♿ Step-free', () => stepFreeChip && stepFreeChip.click()));
    if (selStayType !== 'any') {
      const s = stayTypes.find(([id]) => id === selStayType);
      pillsRow.append(pill(s ? s[1] : selStayType, () => stayTypeChips && stayTypeChips.querySelector('[data-s="any"]')?.click()));
    }
    if (selStayDur !== 'any') {
      const d = stayDurs.find(([id]) => id === selStayDur);
      pillsRow.append(pill(d ? d[1] : selStayDur, () => stayDurChips && stayDurChips.querySelector('[data-d="any"]')?.click()));
    }
    pillsRow.style.display = pillsRow.children.length ? '' : 'none';
  }
  // Scoped to whatever's already on screen (country, or city once drilled down) via the same
  // computeResults() every other control feeds — a momentary act, so never persisted.
  const searchBox = h('input', {
    type: 'search', class: 'search', 'aria-label': 'Search places',
    placeholder: `🔎 Search places${scopeCity ? ` in ${scopeCity}` : ''}…`,
    oninput: (e) => { searchTerm = e.target.value; renderList(); },
  });
  wrap.append(searchBox);
  wrap.append(pillsRow);
  wrap.append(filterBtn);

  const listEl = h('div', {});
  wrap.append(listEl);

  // Everything below here is reference material, not results — rank/collapse/never-remove:
  // still one tap away, just no longer standing between the traveller and a real place.
  // Browsing a whole city or country by name lives on Explore now, not here.

  // Your own places live alongside the curated ones: add a location, then rate, review and
  // photograph it from its page. Kept on-device; a collapsible list keeps the screen tidy.
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin:4px 0', onclick: () => go('#addpin') }, '➕ Add a place of your own'));
  if ((store.pins || []).length) {
    const yp = h('details', { class: 'filters-collapse' }, [h('summary', {}, `📌 Your places · ${store.pins.length}`)]);
    store.pins.forEach((pin) => {
      const pd = getPlaceData(pin.id);
      const kind = (pin.tags && pin.tags[0]) ? titleCase(pin.tags[0]) : 'Place';
      const meta = [kind, pd.rating ? starsStr(pd.rating) : null, (placePhotoKeys(pin.id).length ? `📷 ${placePhotoKeys(pin.id).length}` : null)].filter(Boolean).join(' · ');
      yp.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px; justify-content:flex-start', onclick: () => go(`#place-${pin.id}`) },
        `📌 ${pin.name} — ${meta}`));
    });
    wrap.append(yp);
  }
  wrap.append(h('details', { class: 'filters-collapse' }, [
    h('summary', {}, '🎨 Colour key'),
    colorKeyCard(),
  ]));
  // A link to the full offline map (GPS, extra layers, measure — My accommodation and
  // saved offline areas now live right here too, see above).
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin:8px 0 2px', onclick: () => go('#map') },
    [chipIcon('map'), ' Full map — extra layers & measure tool']));

  let currentResults = [];
  // Places is map-first now — the map is the only section that never collapses. The distance
  // tiers below it default to open for "Right here"/"Nearby" (the immediately actionable ones)
  // and folded for "Worth a day trip"/"Further afield" — this set holds only the tiers the
  // traveller has explicitly flipped AWAY from that default, for this visit only (renderList()
  // rebuilds these <details> on every filter/search change, so without this a keystroke would
  // undo whatever the traveller just toggled).
  const tierToggled = new Set();

  // Compare tray — per-visit only (never persisted, never carried between countries/cities):
  // a traveller comparing 2-3 places is mid-decision right now, not setting a standing
  // preference. Docked with position:fixed as a CHILD of `wrap`, so mount()'s app.innerHTML
  // reset on the next screen removes it for free — no explicit teardown needed.
  const compareSet = new Set();
  const compareCap = 3;
  const compareCtl = { has: (id) => compareSet.has(id), toggle: (id) => toggleCompare(id) };
  const compareTray = h('div', { class: 'compare-tray' });
  wrap.append(compareTray);
  function compareLabel(p) { return p.name.length > 20 ? `${p.name.slice(0, 19)}…` : p.name; }
  function renderCompareTray() {
    compareTray.innerHTML = '';
    if (!compareSet.size) { compareTray.style.display = 'none'; return; }
    compareTray.style.display = '';
    const row = h('div', { class: 'chips', style: 'margin-bottom:6px' });
    [...compareSet].forEach((id) => {
      const p = resolveItem(id);
      if (!p) { compareSet.delete(id); return; }
      row.append(h('button', { class: 'chip', 'aria-pressed': 'true', onclick: () => toggleCompare(id) }, [compareLabel(p), ' ✕']));
    });
    compareTray.append(row);
    compareTray.append(h('div', { class: 'row-between' }, [
      h('button', { class: 'btn ghost', onclick: () => { compareSet.clear(); renderCompareTray(); renderList(); } }, 'Clear'),
      h('button', {
        class: 'btn', disabled: compareSet.size < 2 ? '' : null,
        onclick: () => openCompareSheet(),
      }, `Compare (${compareSet.size})`),
    ]));
  }
  function toggleCompare(id) {
    if (compareSet.has(id)) { compareSet.delete(id); }
    else { if (compareSet.size >= compareCap) return; compareSet.add(id); }
    renderCompareTray();
    renderList(); // refreshes each row's tick state
  }
  function openCompareSheet() {
    if (compareSet.size < 2) return;
    const places = [...compareSet].map((id) => resolveItem(id)).filter(Boolean);
    const fields = [
      ['City', (p) => p.city || '—'],
      // Distance from the same anchor the map and tiers use — always set now, so this is
      // never blank the way it was when it only showed a real GPS fix.
      ['Distance', (p) => p.coords ? `${haversineKm(anchor, p.coords).toFixed(1)} km` : '—'],
      ['Rating', (p) => (p.rating ? `★ ${Number(p.rating).toFixed(1)}` : '—')],
      ['Price', (p) => {
        const hasPrice = p.priceRange && p.priceRange.currency;
        return hasPrice ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '—';
      }],
      ['Price tier', (p) => (p.budgetTier ? (PRICE_TIER_LABEL[p.budgetTier] || titleCase(p.budgetTier)) : '—')],
      ['Kids OK', (p) => (p.kidFriendly === true ? '✅ Yes' : (p.kidFriendly === false ? '— No' : '? Unknown'))],
      ['Step-free', (p) => (p.access && p.access.stepFree ? titleCase(String(p.access.stepFree)) : '—')],
    ];
    const backdrop = h('div', { class: 'sheet-backdrop' });
    const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Compare places' });
    // Routed through openModal (see filterBtn above) for the same Escape/focus-trap/
    // close-on-navigate behaviour, instead of a hand-rolled backdrop-click-only close.
    let close;
    sheet.append(h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }));
    sheet.append(h('h3', {}, 'Compare'));
    const table = h('div', { class: 'compare-table' });
    table.append(h('div', { class: 'compare-row compare-head' }, [
      h('div', { class: 'compare-label' }, ''),
      ...places.map((p) => h('div', { class: 'compare-cell' }, [h('strong', {}, compareLabel(p))])),
    ]));
    fields.forEach(([label, fn]) => {
      table.append(h('div', { class: 'compare-row' }, [
        h('div', { class: 'compare-label muted' }, label),
        ...places.map((p) => h('div', { class: 'compare-cell' }, fn(p))),
      ]));
    });
    sheet.append(table);
    const openRow = h('div', { class: 'chips', style: 'margin-top:10px' });
    places.forEach((p) => openRow.append(h('button', { class: 'btn ghost', onclick: () => { close(); go(`#place-${p.id}`); } }, `Open ${compareLabel(p)}`)));
    sheet.append(openRow);
    sheet.append(h('button', { class: 'btn block', style: 'margin-top:10px', onclick: () => close() }, 'Close'));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    backdrop.append(sheet);
    close = openModal(backdrop);
  }
  renderCompareTray();

  // The map shows the filtered curated results PLUS the traveller's own places that have
  // coordinates, so contributions appear spatially alongside the guide — like a map app.
  const userMapPins = () => (store.pins || []).filter((p) => p.coords).map((p) => resolveItem(p.id)).filter(Boolean);
  const mapPlaces = () => currentResults.concat(userMapPins()).filter((p) => p.coords);

  // Filtered + sorted results, or null when this country has no places yet. No hard city
  // filter even when scoped: scoping a city moves the ANCHOR there (see the top of this
  // function), and distance tiering at render time does the rest — a place just outside the
  // city's own tag boundary but genuinely walkable should never be lost to a tag mismatch.
  function computeResults() {
    const country = getCountry(getActiveCountry());
    if (!country || !Array.isArray(country.places)) return null;
    let results = allPlaces({ country: getActiveCountry(), interests: [...selInterests], budget: selBudget });
    if (selLayers.size) results = results.filter((p) => selLayers.has(placeBucket(p)));  // category layers
    if (selKids) results = results.filter((p) => p.kidFriendly === true);
    if (selStayType !== 'any') results = results.filter((p) => p.stayType === selStayType);
    if (selStayDur !== 'any') results = results.filter((p) => p.stayDuration === selStayDur || p.stayDuration === 'both');
    if (selStepFree) results = results.filter((p) => p.access && (p.access.stepFree === 'yes' || p.access.stepFree === 'partial'));
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      results = results.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q));
    }
    // Best-for-you leads; personalScore degrades to a plain rating-first order with no profile
    // set, so this is always a sensible default, not just a post-profile upgrade. Distance
    // tiering (walk/near/day-trip/further) is applied at render time from the same `anchor`.
    results = results.slice().sort((a, b) => personalScore(b) - personalScore(a));
    return results;
  }

  // Distance tiers, reusing the exact "near"/"day trip" thresholds (withinNear/withinDayTrip)
  // and vocabulary "Things to do" already uses, so the two surfaces never disagree about what
  // "near" means. Nothing is ever hidden for being far — rank/collapse/never-remove, same
  // principle as everywhere else in this app — the Google Maps link at the foot covers
  // whatever this guide does not (yet) curate at all.
  const PLACE_TIERS = [
    ['walk', '🚶 Right here', true],
    ['near', '📍 Nearby', true],
    ['trip', '🚌 Worth a day trip', false],
    ['far', '🗺 Further afield', false],
  ];
  function tierOf(p) {
    if (!p.coords) return 'near';
    const km = haversineKm(anchor, p.coords);
    return km <= 2.5 ? 'walk' : withinNear(km) ? 'near' : withinDayTrip(km) ? 'trip' : 'far';
  }

  function renderList() {
    const country = getCountry(getActiveCountry());
    const computed = computeResults();
    currentResults = computed || [];
    // Shared numbering: number every MAPPED place by its position in the displayed order, so a
    // list row and the map pin carry the SAME number and colour. Numbers live in a local
    // id->num lookup, never written onto the shared, cached place objects (allPlaces() hands
    // back the same singleton records every screen reads — writing a view-local number
    // straight onto one would leak this screen's numbering into whatever reads that object
    // next). map.js still reads its pin badge off p._num, so map places get their own shallow
    // copy carrying that one field; the underlying cached place is untouched.
    const rawMl = mapPlaces();
    const numById = new Map(rawMl.map((p, i) => [p.id, i + 1]));
    const ml = rawMl.map((p) => ({ ...p, _num: numById.get(p.id) }));
    const numFor = (id) => numById.get(id) || null;
    const mine = userMapPins().length;
    // Honest about what the list actually contains: each tier caps at 6 rows behind a
    // "Show all" expander, so the count below is real places matched — not a claim that all
    // of them are already on screen as rows. The shared numbering IS exact, so that much
    // stands: the same number always means the same place on both the map and the list.
    cap.textContent = ml.length
      ? `${ml.length} place${ml.length === 1 ? '' : 's'} match${mine ? ` (incl. ${mine} of yours)` : ''} — same numbers on the map and in the list`
      : '';
    filterBtn.textContent = filterLabel();
    renderActivePills();
    if (placesCtrl) placesCtrl.setPlaces(ml);

    listEl.innerHTML = '';
    if (computed === null) {
      listEl.append(h('p', { class: 'empty' }, `${country ? country.name : 'This country'} places are coming soon. Thailand is fully covered in this build.`));
      return;
    }
    if (!currentResults.length) {
      listEl.append(h('p', { class: 'empty' }, searchTerm.trim()
        ? `Nothing matches “${searchTerm.trim()}” with these filters. Try a different search, or widen the filters.`
        : 'No places match these filters and layers. Try widening them.'));
      listEl.append(placesMapsFallback(anchor, anchorLabel));
      return;
    }
    // "Show more" expander: reveal the rest inline (no full re-render) to cut scrolling.
    const expander = (rest, label) => {
      if (!rest.length) return null;
      const btn = h('button', { class: 'btn ghost block', style: 'margin:2px 0 10px' }, label);
      btn.onclick = () => { rest.forEach((p) => btn.before(placeQuickRow(p, numFor(p.id), compareCtl))); btn.remove(); };
      return btn;
    };
    {
      const CAP = 6;
      PLACE_TIERS.forEach(([key, label, openByDefault]) => {
        const arr = currentResults.filter((p) => tierOf(p) === key);
        if (!arr.length) return;
        const body = h('div', { class: 'place-cat-body' });
        arr.slice(0, CAP).forEach((p) => body.append(placeQuickRow(p, numFor(p.id), compareCtl)));
        const more = expander(arr.slice(CAP), `Show all ${arr.length} · ${label.replace(/^\S+\s/, '')}`);
        if (more) body.append(more);
        const key2 = key;
        const isOpen = tierToggled.has(key2) ? !openByDefault : openByDefault;
        const det = h('details', { class: 'place-cat-group', open: isOpen ? '' : null, style: '--cat:#0F9D8C' }, [
          h('summary', { class: 'place-cat-summary' }, `${label} · ${arr.length}`),
          body,
        ]);
        det.addEventListener('toggle', () => {
          if (det.open === openByDefault) tierToggled.delete(key2); else tierToggled.add(key2);
        });
        listEl.append(det);
      });
      listEl.append(placesMapsFallback(anchor, anchorLabel));
    }
  }

  renderList();
  mount(wrap, '#places');

  // Boot the embedded MapLibre map into the always-present map section, numbered + coloured to
  // match the list. setPlaces() (called by renderList on any filter/layer change) redraws the
  // markers with no WebGL rebuild; leaving the screen disposes it via liveCleanup.
  const canvas = h('div', { class: 'places-map' });
  mapWrap.append(canvas);
  const mapList0 = mapPlaces();
  if (!mapList0.length) {
    mapWrap.append(h('p', { class: 'muted', style: 'padding:10px 12px' }, 'No mapped places for these filters/layers yet — widen them, or add a place of your own.'));
  } else {
    import('../map.js').then((m) => m.initMap(canvas, {
      places: mapList0,
      onOpen: (id) => go(`#place-${id}`),
      onLocate: (fix) => setLastFix(fix),
      numbered: true,
      cluster: true,
      markerColor: (p) => bucketColor(p),
      // Satellite imagery by default (works offline for viewed areas via the tile cache), with an
      // on-map Map/Satellite toggle whose choice persists per traveller (self-defaulting pref).
      satellite: store.profile.prefs.placesMapSat !== false,
      styleToggle: true,
      onStyleChange: (on) => { store.profile.prefs.placesMapSat = on; save(); },
    })).then((c) => {
      placesCtrl = c;
      setLiveCleanup(() => { try { c.dispose(); } catch { /* noop */ } });
      // Reconcile the borders layer with whatever was last saved (it defaults to visible
      // at construction regardless of a stored "off" pref from an earlier #map session).
      c.setBorders(mapLayersPrefsP.borders !== false);
      // The map is constructed inside a <details>, so its container can still be settling its
      // real (340px) height when the controller first resolves. Drawing markers then leaves
      // map.project() with a zero-size viewport and the pins never position. Resize to the laid-out
      // dimensions and redraw on the next frame(s) so the numbered pins appear on first paint
      // rather than only after the traveller touches a filter. setPlaces is idempotent.
      const paint = () => { try { c.map.resize(); c.setPlaces(mapPlaces()); } catch { /* noop */ } };
      paint();
      requestAnimationFrame(paint);
      setTimeout(paint, 250);
      // Always centre on the anchor (GPS fix, scoped city, or the focus-spot/capital fallback) —
      // Places has no more un-anchored "browsing the whole country" state to leave uncentred.
      setTimeout(() => { try { c.map.flyTo({ center: [anchor.lng, anchor.lat], zoom: 12, duration: 500 }); } catch { /* noop */ } }, 350);
      // My-accommodation/saved-areas controls only work once the controller exists — show
      // them now (a no-op if the traveller already opened the cards and saw them hidden).
      renderAreasCard();
      // A second, independent geolocate listener (map.js supports many) so the way-back
      // line and distance banner update live here too, exactly like the standalone map.
      c.onLocate((fix) => {
        stayFixP = fix; updateStayBannerP();
        const st = getMyStay();
        if (st && st.coords) c.setWayback(fix, st.coords);
      });
    }).catch(() => { mapWrap.append(h('p', { class: 'muted', style: 'padding:10px 12px' }, 'The map could not start here — the list below still works offline.')); });
  }
}

// Traveller-fit chips (kid-friendly, stay type, stay length) shown on cards + detail — read by
// placeCard/placeQuickRow below AND (once step 5 lands) by placeScreen, which is exactly why
// this stayed a genuinely shared helper rather than list-only.
const STAY_LABEL = { tent: '⛺ Camping', hostel: '🛏️ Hostel', guesthouse: '🏠 Guesthouse', homestay: '🏡 Homestay', hotel: '🏨 Hotel', resort: '🌴 Resort', apartment: '🏢 Apartment' };
export function travelerChips(p) {
  const chips = [];
  if (p.kidFriendly === true) chips.push(attrTag('👨‍👩‍👧 Kids OK'));
  if (p.stayType) chips.push(attrTag(STAY_LABEL[p.stayType] || p.stayType));
  if (p.stayDuration === 'long') chips.push(attrTag('Long stay'));
  else if (p.stayDuration === 'short') chips.push(attrTag('Short stay'));
  else if (p.stayDuration === 'both') chips.push(attrTag('Short or long stay'));
  return chips.length ? h('div', { class: 'cats', style: 'margin-top:4px' }, chips) : null;
}

// The site-wide colour key: what each category colour and budget colour means. Shown
// (collapsed) on Places and the Map so the colour language is always explained. (Verified via
// the call graph, not the original scoping pass's label, to have exactly one caller —
// placesScreen above — so it moved here in step 4 rather than waiting on step 5.)
function colorKeyCard() {
  const wrap = h('div', { class: 'color-key' });
  wrap.append(h('div', { class: 'muted', style: 'margin:2px 0 4px' }, 'Category colours'));
  wrap.append(h('div', { class: 'cats' }, CATEGORY_FAMILIES.filter((f) => f.key !== 'other').map((f) =>
    h('span', { class: 'cat-tag', style: `background:${f.color}`, title: f.label }, `${f.emoji} ${f.label}`))));
  wrap.append(h('div', { class: 'muted', style: 'margin:10px 0 4px' }, 'Price'));
  wrap.append(h('div', { class: 'cats' }, [['low', PRICE_TIER_LABEL.low], ['mid', PRICE_TIER_LABEL.mid], ['high', PRICE_TIER_LABEL.high], ['any', PRICE_TIER_LABEL.any]].map(([t, l]) =>
    h('span', { class: `tier ${t}` }, l))));
  return wrap;
}

// Small chip for cards/lists: green "On today" when open now, else the day pattern. Its
// formatMarketDays/marketOpenDays dependency stays in main.js for now, alongside the bigger
// marketInfoCard detail card that hasn't moved yet (see the reverse-import above).
function marketChip(p) {
  if (!isMarket(p)) return null;
  const d = marketOpenDays(p);
  if (!d) return h('span', { class: 'mkt-chip daily' }, `🛍️ ${p.marketType || 'Market'} · daily`);
  const on = d.includes(new Date().getDay());
  return h('span', { class: `mkt-chip ${on ? 'on' : 'off'}`, title: `Runs ${formatMarketDays(p)}` },
    on ? '🛍️ On today' : `🛍️ ${formatMarketDays(p)}`);
}

// Small card/list chip: warns first about jellyfish season, else shows lifeguard status.
// Returns null for a bare beach with no structured info and no active warning (no clutter).
// jellyInSeason stays in main.js for now, alongside the bigger beach detail cluster.
function beachChip(p) {
  if (!isBeach(p)) return null;
  const nowM = new Date().getMonth() + 1;
  if (jellyInSeason(p, nowM)) return h('span', { class: 'beach-chip jelly', title: 'Elevated jellyfish season — check the flags' }, '🪼 Jellyfish season');
  if (p.lifeguard === 'yes') return h('span', { class: 'beach-chip on' }, '🏖️ Lifeguards');
  if (p.lifeguard === 'no') return h('span', { class: 'beach-chip off' }, '🏖️ No lifeguards');
  return null;
}

export function placeCard(p, num) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const priceStr = hasPrice ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
  const colls = collectionsForItem(p.id);
  const dchip = distanceChip(p);
  const accent = bucketColor(p);
  const fam = placeFamily(p);
  const src = placePhotoSrc(p);
  // A recognition thumbnail on the left: a self-hosted photo when one exists (offline,
  // lazy-loaded), else a calm family-emoji placeholder. The category colour still reads
  // from the left accent bar and the coloured tags, so the placeholder stays quiet.
  const thumb = src
    ? h('img', { class: 'pc-thumb', src, alt: '', loading: 'lazy', decoding: 'async' })
    : h('span', { class: 'pc-thumb ph' }, (FAMILY_META[fam] || FAMILY_META.other).emoji);
  const card = h('div', { class: 'card place-card' + (num != null ? ' has-num' : ''), style: `--cat:${accent}` }, [
    h('div', { class: 'pc-row' }, [
      thumb,
      h('div', { class: 'pc-body' }, [
        h('div', { class: 'place-head' }, [
          h('h2', {}, `${p.isPin ? '📌 ' : ''}${p.name}`),
          h('button', {
            class: 'save-star', 'aria-label': 'Quick save to favourites', title: 'Quick save',
            onclick: (e) => { const on = toggleFavorite(p.id); e.currentTarget.textContent = on ? '★' : '☆'; },
          }, isFavorite(p.id) ? '★' : '☆'),
        ]),
        (cats.length || (p.budgetTier && !p.isPin)) ? h('div', { class: 'row-between' }, [
          h('div', { class: 'cats' }, cats.map((c) => catTag(c))),
          (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
        ]) : null,
        travelerChips(p),
        isMarket(p) ? h('div', { style: 'margin:2px 0' }, marketChip(p)) : null,
        (() => { const bc = beachChip(p); return bc ? h('div', { style: 'margin:2px 0' }, bc) : null; })(),
        p.blurb ? h('p', {}, p.blurb) : null,
        h('p', { class: 'muted' }, [p.city, priceStr].filter(Boolean).join(' · ')),
        dchip ? h('div', { style: 'margin:2px 0' }, dchip) : null,
        p.rating ? h('div', { class: 'stars-static' }, `${starsStr(p.rating)} ${Number(p.rating).toFixed(1)}`) : null,
        colls.length ? h('div', { class: 'cats' }, colls.map((c) =>
          h('span', { class: 'cat-tag', style: 'background:var(--grape)' }, `${c.emoji} ${c.name}`))) : null,
      ]),
    ]),
    h('div', { class: 'row-between', style: 'flex-wrap:wrap' }, [
      h('button', { class: 'btn ghost', onclick: () => go(`#place-${p.id}`) }, 'Details'),
      h('button', { class: 'btn ghost', onclick: () => saveSheet(p.id) }, '＋ Save'),
      h('button', { class: 'btn ghost', onclick: () => tripVisitSheet(p.id) }, '🧭 Trip'),
    ]),
  ]);
  // A number badge matching the map pin, when the caller supplies a number.
  if (num != null) card.prepend(h('span', { class: 'pc-num', 'aria-hidden': 'true', style: `background:${accent}` }, String(num)));
  return card;
}

// A collapsed QUICK-VIEW row for the places list: the summary shows just what a traveller
// scans for — name, distance from them, rating, price, a budget badge and the category —
// and expands IN PLACE (an accordion) to the photo, blurb, traveller fit and actions, so
// the list reads as a short menu instead of a wall of full cards. Full detail stays one tap
// further on the place page.
function placeQuickRow(p, num, compareCtl) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const priceStr = hasPrice ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
  const accent = bucketColor(p);
  const dchip = distanceChip(p);
  const meta = h('div', { class: 'pqr-meta' }, [
    dchip || null,
    p.rating ? h('span', { class: 'pqr-rating' }, `★ ${Number(p.rating).toFixed(1)}`) : null,
    priceStr ? h('span', { class: 'pqr-price' }, priceStr) : null,
    (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
    cats.length ? catTag(cats[0]) : null,
  ]);
  // Compare tick — optional: only Places' own grouped/near/closest rows pass a controller,
  // so every other caller of this row (Explore's serendipity cards, etc.) is unaffected.
  const compareTick = compareCtl ? h('button', {
    class: 'pqr-compare', 'aria-pressed': compareCtl.has(p.id) ? 'true' : 'false',
    'aria-label': compareCtl.has(p.id) ? `Remove ${p.name} from compare` : `Add ${p.name} to compare`,
    title: 'Compare',
    onclick: (e) => { e.preventDefault(); e.stopPropagation(); compareCtl.toggle(p.id); },
  }, compareCtl.has(p.id) ? '☑' : '☐') : null;
  const summary = h('summary', { class: 'pqr-summary' }, [
    compareTick,
    num != null ? h('span', { class: 'pqr-num', style: `background:${accent}` }, String(num)) : null,
    h('div', { class: 'pqr-main' }, [
      h('div', { class: 'pqr-name' }, `${p.isPin ? '📌 ' : ''}${p.name}`),
      meta,
    ]),
    h('button', {
      class: 'pqr-star', 'aria-label': 'Quick save', title: 'Quick save',
      onclick: (e) => { e.preventDefault(); e.stopPropagation(); const on = toggleFavorite(p.id); e.currentTarget.textContent = on ? '★' : '☆'; },
    }, isFavorite(p.id) ? '★' : '☆'),
    h('span', { class: 'pqr-chev', 'aria-hidden': 'true' }, '⌄'),
  ]);
  const src = placePhotoSrc(p);
  const body = h('div', { class: 'pqr-body' }, [
    src ? h('img', { class: 'pqr-photo', src, alt: '', loading: 'lazy', decoding: 'async' }) : null,
    cats.length ? h('div', { class: 'cats' }, cats.map((c) => catTag(c))) : null,
    travelerChips(p),
    p.blurb ? h('p', { style: 'margin:6px 0' }, p.blurb) : null,
    h('p', { class: 'muted', style: 'margin:2px 0' }, [p.city, priceStr].filter(Boolean).join(' · ')),
    h('div', { class: 'row-between', style: 'margin-top:6px;flex-wrap:wrap' }, [
      h('button', { class: 'btn ghost', onclick: (e) => { e.stopPropagation(); go(`#place-${p.id}`); } }, 'Full details'),
      h('button', { class: 'btn ghost', onclick: (e) => { e.stopPropagation(); saveSheet(p.id); } }, '＋ Save'),
      h('button', { class: 'btn ghost', onclick: (e) => { e.stopPropagation(); tripVisitSheet(p.id); } }, '🧭 Trip'),
    ]),
  ]);
  return h('details', { class: 'place-qrow', style: `--cat:${accent}` }, [summary, body]);
}

// Modal sheet: add an item to collections (and toggle favourite / create new).
export function saveSheet(itemId) {
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Save to collections' });
  let close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  const body = h('div', {});
  function rebuild() {
    body.innerHTML = '';
    body.append(h('h3', {}, 'Save to'));
    // favourite quick toggle
    body.append(collRow('⭐', 'Favourites', store.favorites.includes(itemId),
      () => { toggleFavorite(itemId); rebuild(); }));
    // existing collections
    for (const c of store.collections) {
      body.append(collRow(c.emoji, `${c.name} (${c.itemIds.length})`, c.itemIds.includes(itemId),
        () => { togglePlaceInCollection(c.id, itemId); rebuild(); }));
    }
    // create new
    const input = h('input', { class: 'search', type: 'text', 'aria-label': 'Search', placeholder: 'New collection name…', style: 'margin-top:8px' });
    const add = h('button', { class: 'btn', onclick: () => {
      if (!input.value.trim()) return;
      const c = createCollection(input.value.trim(), '⭐');
      togglePlaceInCollection(c.id, itemId);
      rebuild();
    } }, 'Create & add');
    body.append(input, add);
    // preset quick-create
    body.append(h('p', { class: 'muted', style: 'margin:12px 0 4px' }, 'Quick themes'));
    body.append(h('div', { class: 'chips presets' }, COLLECTION_PRESETS
      .filter((pr) => !store.collections.some((c) => c.name.toLowerCase() === pr.name.toLowerCase()))
      .map((pr) => h('button', { class: 'chip', onclick: () => {
        const c = createCollection(pr.name, pr.emoji);
        togglePlaceInCollection(c.id, itemId);
        rebuild();
      } }, `${pr.emoji} ${pr.name}`))));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top:12px', onclick: close }, 'Done'));
  }
  rebuild();
  sheet.append(body);
  backdrop.append(sheet);
  close = openModal(backdrop);
}

function collRow(emoji, label, checked, onToggle) {
  return h('label', { class: 'coll-row' }, [
    h('input', { type: 'checkbox', checked: checked ? '' : null, onchange: onToggle }),
    h('span', {}, `${emoji} ${label}`),
  ]);
}

// Modal sheet: tag a place to a trip leg (S4). A stop and a place are not 1:1, so this just
// toggles membership in store.trip.placeVisits — same reused pattern as saveSheet above.
// With no matching leg yet (or no stops at all) "Not scheduled yet" is always available —
// nothing blocks adding a place before its city has a stop.
export function tripVisitSheet(placeId) {
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Add to my trip' });
  let close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  const body = h('div', {});
  function rebuild() {
    body.innerHTML = '';
    body.append(h('h3', {}, 'Add to my trip'));
    const mine = store.trip.placeVisits.filter((v) => v.placeId === placeId);
    if (store.trip.stops.length) {
      body.append(h('p', { class: 'muted' }, 'Which stop is this for?'));
      store.trip.stops.forEach((s) => {
        const tagged = mine.find((v) => v.stopId === s.id);
        const label = s.title + (stopDateLabel(s) ? ` — ${stopDateLabel(s)}` : '');
        body.append(collRow('📍', label, !!tagged,
          () => { if (tagged) removePlaceVisit(tagged.id); else addPlaceVisit({ placeId, stopId: s.id }); rebuild(); }));
      });
    } else {
      body.append(h('p', { class: 'muted' }, 'No trip stops yet — this will sit unscheduled until you add one.'));
    }
    const unsched = mine.find((v) => !v.stopId);
    body.append(collRow('🗒️', 'Not scheduled yet', !!unsched,
      () => { if (unsched) removePlaceVisit(unsched.id); else addPlaceVisit({ placeId, stopId: null }); rebuild(); }));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top:12px', onclick: close }, 'Done'));
  }
  rebuild();
  sheet.append(body);
  backdrop.append(sheet);
  close = openModal(backdrop);
}
