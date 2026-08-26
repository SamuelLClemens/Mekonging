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
// cards, external ratings, orientation+access, transit, local secrets, photos) landed in step 5
// (task #205) — re-verified against a fresh call graph rather than trusting this file's own
// step-4 labels, per the task's own warning that earlier passes had already been wrong at least
// once. resolveItem, formatMarketDays, jellyInSeason and placePhotoKeys are now natively
// defined below rather than reverse-imported from main.js; formatMonths, SEV_LABEL,
// fmtReportDate, addPlaceSecret and placeScreen itself are now exported FROM here because
// main.js still has genuine external callers for each (mosquito-peak months, the Travel Circle
// inbox/share-detail screens, and the #place router case respectively) — see main.js's own
// reverse-import of this module for the full list.
import {
  store, save, getPlaceData, getLastFix, setLastFix, getMyStay, setMyStay, clearMyStay,
  getSavedAreas, addSavedArea, removeSavedArea, clearSavedAreas, addPlaceVisit, removePlaceVisit,
  toggleFavorite, isFavorite, createCollection, togglePlaceInCollection, collectionsForItem,
  setPlaceField, deletePin, ensureMe, getJellyReports, addJellyReport, getPin, todayKey,
} from '../state.js';
import { getActiveCountry, setActiveCountry, setLiveCleanup, getLiveCleanup } from '../app-state.js';
import {
  h, geolocate, bearing, compass, fmtDistance, titleCase, mapsUrl, mapsDirUrl, money,
} from '../util.js';
import {
  haversineKm, distanceChip, withinNear, withinDayTrip, attrTag, starsStr, isMarket, isBeach,
  placeBucket, FAMILY_META, catColor, catTag, tierColor, swatch, citySlug, PRICE_TIER_LABEL,
  tierBadge, PLACE_BUCKETS, BUCKET_COLOR, bucketColor, marketOpenDays, personalScore,
  CATEGORY_FAMILIES, photoBlock, seaAgo, airBlock, uvTodayBlock, extUrl, sourcesNote,
  fmtTemp, fmtWind,
} from '../render-utils.js';
import { collapsibleCard, openModal, readAloudBar, confirmAction, online, field, locationSelect, spotForKey } from '../ui-widgets.js';
import { INTERESTS, COLLECTION_PRESETS, getCountry, allPlaces, getPlace } from '../data/regions.js';
import { dateLocale, t } from '../i18n.js';
import { getAccessibility } from '../data/accessibility.js';
import { CROSSINGS } from '../data/borders.js';
import { TRANSPORT_HUBS, TRANSIT_SOURCES } from '../data/transit.js';
import { putBlob, delBlob } from '../idb.js';
import { shareOrDownload } from '../exporter.js';
import {
  nearestSpot, spotKey, wmo, getCachedWeather, refreshWeather, getCachedMarine, refreshMarine,
} from '../weather.js';
import { seedWeatherKey } from './weather.js';
import { shareUrl, encodeShare } from '../social.js';
import {
  go, mount, topbar, render, focusSpot, setFocusSpot, spotForCity, oneTimeHint,
  travellingAsLine, countryChips, cityAboutCard, cityEssentials, placeFamily, placePhotoSrc,
  priceLine, stopDateLabel, shareButton, profileFitCard, exportOnePlaceReviewHtml,
  setBlobThumb, mapsSearch, kmLabel, daysUntilISO, chipIcon, refreshLocation,
  nearestSpotGlobal,
} from '../main.js';
// phraseSlug/scriptLang moved from main.js to phrasebook.js (task #211's final module-split
// slice) — this is the one screen module that needed an import-line edit on that extraction.
import { phraseSlug, scriptLang } from './phrasebook.js';

// Closes the tail this guide does not (yet) curate: a live Google Maps search centred on
// wherever Places is anchored right now, via the same mapsUrl() deep link every place-detail
// page already uses for "Open in Google Maps".
function placesMapsFallback(anchor, label) {
  return h('a', {
    class: 'btn ghost block', style: 'margin:10px 0 4px',
    href: mapsUrl({ coords: anchor }), target: '_blank', rel: 'noopener',
  }, `🗺 Not seeing it? Search near ${label} on Google Maps →`);
}

// A compact "choose your location" bottom sheet — always available regardless of GPS
// support or scope state (direct request: the map/list anchor must always be manually
// choosable, not only whatever GPS/last-focused-city happened to resolve to). Reuses the
// exact locationSelect()+setFocusSpot() pairing whereAmICard already uses INLINE elsewhere
// (main.js) rather than the full-screen #setcity flow, which navigates to Explore's country
// hub on selection — the wrong destination for something opened from Places. Selecting a
// city applies immediately and closes; no separate "confirm" tap, matching that inline feel.
function openLocationPicker() {
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Choose your location' });
  let close;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  sheet.append(h('div', { class: 'sheet-grip', 'aria-hidden': 'true' }));
  sheet.append(h('h3', {}, '📍 Choose your location'));
  sheet.append(h('p', { class: 'muted', style: 'margin:0 0 8px' }, 'Sets where the map, distances and “near me” match — works offline, no GPS needed.'));
  const cur = focusSpot(getActiveCountry()).spot;
  sheet.append(field('Your location', locationSelect(spotKey(cur), (key) => {
    const s = spotForKey(key);
    if (s) { close(); setFocusSpot(s); render(); }
  })));
  backdrop.append(sheet);
  close = openModal(backdrop);
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
  const storageLineP = h('p', { class: 'muted', style: 'margin:2px 0 8px;font-size:12px' }, '');
  const areasCard = h('div', { class: 'card' });
  const swAvailableP = ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller;
  // Reported gap: nothing here ever showed how much offline map data actually exists, or
  // gave a way to clear it in one action (only one area at a time). navigator.storage.estimate()
  // covers the whole origin (precached app shell + IndexedDB photos/audio too, not just map
  // tiles), so the line is worded as total offline storage rather than implying tiles-only.
  async function renderStorageLine() {
    storageLineP.textContent = '';
    const mapMod = await import('../map.js');
    const est = await mapMod.storageEstimate();
    if (!est) return; // navigator.storage.estimate unsupported — say nothing rather than guess
    const used = est.usageMB < 1 ? est.usageMB.toFixed(1) : String(Math.round(est.usageMB));
    storageLineP.textContent = `~${used} MB stored offline on this device (maps, photos, audio).`;
  }
  function estimateAreaP() {
    if (!placesCtrl) { areasStatusP.textContent = 'The map is still loading — try again in a moment.'; return; }
    const urls = placesCtrl.getDownloadTiles(1000);
    if (!urls.length) { areasStatusP.textContent = 'Nothing to save at this view — zoom in to an area first.'; return; }
    const viewInfo = placesCtrl.getViewInfo();
    const mbNum = urls.length * 0.018;
    const mb = mbNum < 10 ? mbNum.toFixed(1) : String(Math.round(mbNum));
    areasStatusP.textContent = '';
    // Reported gap: no signal anywhere that connectivity affects this feature — a traveller
    // offline right now would only find out by trying. Non-blocking (a view already fully
    // cached from a previous save still completes fine with no connection), just upfront.
    const offlineNote = online() ? '' : ' You appear to be offline right now — this will only work for tiles you already have saved.';
    areasStatusP.append(
      `This view is about ${urls.length} satellite tiles (~${mb} MB).${offlineNote} `,
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
        // Found live: some embedded/restricted browser contexts (confirmed here) don't support
        // window.prompt() at all — it THROWS rather than just being uncallable or cancellable.
        // Uncaught, that exception would skip addSavedArea() entirely: the tiles are genuinely
        // cached (d.ok > 0) but the traveller never sees a saved area, and the status text stays
        // stuck on "Saving…" forever with no error. Falls back to the same default name a
        // cancelled prompt already uses, so the save still completes either way.
        let name = def;
        try { name = (prompt('Name this offline area:', def) || def).trim() || def; } catch { /* prompt unsupported here — keep def */ }
        addSavedArea({ name, center: viewInfo.center, bounds: viewInfo.bounds, z: Math.floor(viewInfo.zoom), count: d.ok });
        areasStatusP.textContent = '';
      } else if (d.ok === 0) {
        // Reported gap: this used to go silently blank on total failure — from the traveller's
        // point of view, identical to the "saved fine" case above. Now it says plainly why
        // nothing is available offline, and distinguishes "you're offline" from "you're online
        // but the tile service itself didn't respond" instead of guessing which applies.
        areasStatusP.textContent = online()
          ? 'Nothing could be saved — the map service did not respond. Try again in a moment.'
          : 'Nothing could be saved — you need a connection to download new tiles. Reconnect and try again.';
      } else {
        areasStatusP.textContent = '';
      }
      renderAreasCard();
      renderStorageLine();
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    let protect = [];
    try { protect = getSavedAreas().flatMap((a) => (placesCtrl && placesCtrl.tileUrlsForArea) ? placesCtrl.tileUrlsForArea(a.bounds, a.z) : []); } catch { /* best-effort */ }
    navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TILES', urls, protect });
  }
  function deleteAreaP(a) {
    removeSavedArea(a.id); renderAreasCard(); renderStorageLine();
    if (placesCtrl && swAvailableP && a.bounds && navigator.serviceWorker.controller) {
      const urls = placesCtrl.tileUrlsForArea(a.bounds, a.z || 12, 1000);
      const onMsg = (e) => { if ((e.data || {}).type === 'DELETE_DONE') { navigator.serviceWorker.removeEventListener('message', onMsg); renderAreasCard(); renderStorageLine(); } };
      navigator.serviceWorker.addEventListener('message', onMsg);
      navigator.serviceWorker.controller.postMessage({ type: 'DELETE_TILES', urls });
    }
  }
  // Reported gap: clearing offline map data meant removing areas one at a time — no single
  // "start over" action. Clears both sides that need to stay in sync: the actual cached tiles
  // (js/map.js's clearTileCache(), the mk-tiles* Cache Storage entries) and the saved-area
  // RECORDS (state.js's clearSavedAreas()) — clearing only one would leave either orphaned
  // tiles with no listing, or listed areas pointing at tiles that no longer exist.
  function clearAllAreasP() {
    confirmAction({
      title: 'Clear all offline map data?',
      body: 'This removes every saved area and its downloaded tiles from this device. You can save areas again any time you have a connection.',
      confirmLabel: 'Clear all', danger: true,
    }).then(async (ok) => {
      if (!ok) return;
      const mapMod = await import('../map.js');
      await mapMod.clearTileCache();
      clearSavedAreas();
      areasStatusP.textContent = '';
      renderAreasCard();
      renderStorageLine();
    });
  }
  function renderAreasCard() {
    areasCard.textContent = '';
    const dlBtn = h('button', { class: 'btn ghost', onclick: estimateAreaP }, '⬇ Save this map view for offline');
    if (!swAvailableP || !placesCtrl) dlBtn.style.display = 'none';
    areasCard.append(dlBtn, areasStatusP);
    const areas = getSavedAreas();
    if (!areas.length) {
      areasCard.append(h('p', { class: 'muted' }, 'Save the view above to use the satellite map with no signal. Each area you save is listed here and can be removed on its own.'));
      areasCard.append(storageLineP);
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
    areasCard.append(storageLineP, h('button', { class: 'btn ghost', style: 'margin-top:6px', onclick: clearAllAreasP }, '🗑 Clear all offline map data'));
  }
  renderAreasCard();
  renderStorageLine();
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

  // Keep-screen-awake while navigating on foot (Screen Wake Lock API) — the one #map
  // feature task #196's own functional-parity check found genuinely missing here, ported
  // verbatim from mapScreen()'s own implementation. The OS releases the lock when the app
  // is backgrounded, so re-acquire it when we return to foreground. Chained (not
  // overwritten) with this screen's own map-dispose cleanup below, since both share the
  // one liveCleanup slot.
  let wakeLockP = null, wantWakeP = false;
  const wakeBtnP = h('button', { class: 'btn ghost', onclick: toggleWakeP }, '🔆 Keep screen on');
  if (!('wakeLock' in navigator)) wakeBtnP.style.display = 'none';
  async function acquireWakeP() {
    wakeLockP = await navigator.wakeLock.request('screen');
    wakeLockP.addEventListener('release', () => { wakeLockP = null; });
  }
  async function toggleWakeP() {
    if (wantWakeP) {
      wantWakeP = false;
      try { if (wakeLockP) await wakeLockP.release(); } catch { /* already gone */ }
      wakeLockP = null; wakeBtnP.textContent = '🔆 Keep screen on'; wakeBtnP.classList.remove('toggle-on');
    } else {
      try { await acquireWakeP(); wantWakeP = true; wakeBtnP.textContent = '🔆 Screen stays on'; wakeBtnP.classList.add('toggle-on'); }
      catch { /* denied — leave the button in its off state */ }
    }
  }
  const onVisP = () => { if (wantWakeP && wakeLockP === null && document.visibilityState === 'visible') acquireWakeP().catch(() => { /* denied */ }); };
  document.addEventListener('visibilitychange', onVisP);
  { const prev = getLiveCleanup(); setLiveCleanup(() => { try { if (prev) prev(); } catch { /* noop */ } wantWakeP = false; document.removeEventListener('visibilitychange', onVisP); if (wakeLockP) { try { wakeLockP.release(); } catch { /* noop */ } wakeLockP = null; } }); }

  const toolsCard = h('div', {}, [
    h('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap:10px' }, [
      measureBtnP,
      h('label', { style: 'display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer' }, [bordersCheckP, h('span', {}, '🗺️ Country borders')]),
      wakeBtnP,
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

  // Mode bar: a plain STATUS label (where "near" is centred) on the left, and up to two
  // actions on the right. "Choose location" is unconditional — direct request: the map/list
  // anchor must always have a manual override, not only whatever GPS/last-focused-city
  // happened to resolve to (previously the only way to do this was to leave Places for
  // Explore's per-city "Where are you?" card). The scoped-city escape hatch or GPS-refresh
  // chip is the one further, situational action alongside it.
  modeBar.append(h('span', { class: 'mode-state' }, `📍 Near ${anchorLabel}`));
  modeBar.append(h('span', { style: 'flex:1' }));
  modeBar.append(h('button', { class: 'chip', onclick: openLocationPicker }, '✎ Choose location'));
  if (scopeSlug) {
    modeBar.append(h('button', { class: 'chip', onclick: () => go(`#places-${getActiveCountry()}`) }, '↩ Use my location instead'));
  } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
    // Bug fix: this used to disappear once `usingGps` first became true, so a traveller
    // who had ever gotten one fix had no way to ask for a fresh one after actually moving —
    // exactly when a re-locate matters most. Now it stays, relabelled, so "find my location"
    // is always available rather than a one-time-only invite.
    const label = usingGps ? '🔄 Refresh location' : '📍 Use my location';
    const locBtn = h('button', { class: 'chip' }, label);
    locBtn.onclick = async () => {
      locBtn.textContent = 'Locating…';
      try { await refreshLocation(); render(); }
      catch { locBtn.textContent = '📍 Location unavailable'; setTimeout(() => { locBtn.textContent = label; }, 1800); }
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

  let currentResults = [];
  // Places is map-first now — the map is the only section that never collapses. The distance
  // tiers below it default to open for "Nearby" (the immediately actionable one — an easy walk
  // through about an hour's drive, all one bucket; see PLACE_TIERS/tierOf below for why "Right
  // here" was folded into it rather than kept a separate tier) and folded for "Worth a day
  // trip"/"Further afield" — this set holds only the tiers the traveller has explicitly flipped
  // AWAY from that default, for this visit only (renderList() rebuilds these <details> on every
  // filter/search change, so without this a keystroke would undo whatever the traveller just
  // toggled).
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
  //
  // "Right here" (an easy walk, <=2.5 km) used to be its own tier ahead of "Nearby" — per direct
  // request ("in places there is right here and nearby and they should get merged"), it is now
  // folded into "Nearby": every walkable place already satisfies withinNear() too (2.5 km is a
  // ~4-minute estimated drive, nowhere near the 75-minute ceiling), so this is a pure grouping
  // merge — it changes nothing about which places show or how they are ranked within the tier.
  // The walk-vs-drive distinction is not lost: every row's own distanceChip (render-utils.js)
  // already states "X min walk" or "X min by road (est.)" per place, the finer-grained signal
  // a whole separate section heading was only duplicating.
  const PLACE_TIERS = [
    ['near', '📍 Nearby', true],
    ['trip', '🚌 Worth a day trip', false],
    ['far', '🗺 Further afield', false],
  ];
  function tierOf(p) {
    if (!p.coords) return 'near';
    const km = haversineKm(anchor, p.coords);
    return withinNear(km, p.country) ? 'near' : withinDayTrip(km, p.country) ? 'trip' : 'far';
  }

  // Shared numbering: number every MAPPED place by its position in the displayed order, so a
  // list row and the map pin carry the SAME number and colour. Numbers live in a local
  // id->num lookup, never written onto the shared, cached place objects (allPlaces() hands
  // back the same singleton records every screen reads — writing a view-local number
  // straight onto one would leak this screen's numbering into whatever reads that object
  // next). map.js still reads its pin badge off p._num, so map places get their own shallow
  // copy carrying that one field; the underlying cached place is untouched. Hoisted out of
  // renderList() so every caller that seeds or redraws the map (the initial mapList0 below,
  // and the post-load paint() repaints) numbers pins the same way renderList() does — those
  // used to call the raw, un-numbered mapPlaces() directly, so every pin fell back to map.js's
  // '•' placeholder until the first filter tap forced a renumbered renderList() pass.
  function numberedMapPlaces() {
    const rawMl = mapPlaces();
    const numById = new Map(rawMl.map((p, i) => [p.id, i + 1]));
    return { numById, ml: rawMl.map((p) => ({ ...p, _num: numById.get(p.id) })) };
  }

  function renderList() {
    const country = getCountry(getActiveCountry());
    const computed = computeResults();
    currentResults = computed || [];
    const { numById, ml } = numberedMapPlaces();
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
  const mapList0 = numberedMapPlaces().ml;
  if (!mapList0.length) {
    mapWrap.append(h('p', { class: 'muted', style: 'padding:10px 12px' }, 'No mapped places for these filters/layers yet — widen them, or add a place of your own.'));
  } else {
    import('../map.js').then((m) => m.initMap(canvas, {
      places: mapList0,
      onOpen: (id) => go(`#place-${id}`),
      // Bug fix: this used to only cache the raw coordinate — the map's own native locate
      // control (trackUserLocation: true, so this can fire repeatedly while tracking is on)
      // could report a fix in an entirely different country and the screen would just keep
      // showing the old one, because nothing re-derived activeCountry from it. A same-country
      // move needs nothing extra here — focusSpot() already prefers a live GPS fix over a
      // stale focus city on its own next render (that was task #206's fix). Only a genuine
      // country change needs to force things: applying the new country/focus and re-rendering
      // on every routine position tick would rebuild this whole map dozens of times while
      // tracking is active, for no visible benefit.
      onLocate: (fix) => {
        setLastFix(fix);
        const nb = nearestSpotGlobal(fix);
        if (nb && nb.spot.country !== getActiveCountry()) { setFocusSpot(nb.spot); render(); }
      },
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
      const prevCleanup = getLiveCleanup();
      setLiveCleanup(() => { try { if (prevCleanup) prevCleanup(); } catch { /* noop */ } try { c.dispose(); } catch { /* noop */ } });
      // Reconcile the borders layer with whatever was last saved (it defaults to visible
      // at construction regardless of a stored "off" pref from an earlier #map session).
      c.setBorders(mapLayersPrefsP.borders !== false);
      // The map is constructed inside a <details>, so its container can still be settling its
      // real (340px) height when the controller first resolves. Drawing markers then leaves
      // map.project() with a zero-size viewport and the pins never position. Resize to the laid-out
      // dimensions and redraw on the next frame(s) so the numbered pins appear on first paint
      // rather than only after the traveller touches a filter. setPlaces is idempotent.
      const paint = () => { try { c.map.resize(); c.setPlaces(numberedMapPlaces().ml); } catch { /* noop */ } };
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

// Small chip for cards/lists: green "On today" when open now, else the day pattern. Reads the
// same formatMarketDays/marketOpenDays as the bigger marketInfoCard detail card further below
// (step 5) — both now module-native, so the two can never drift out of sync.
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
// jellyInSeason is module-native (step 5), same as the bigger beach detail cluster below.
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

// ============================================================================
// Step 5 (task #205): placeScreen() — the place-detail page — and its detail-only
// helper cluster (market/beach info, external ratings, orientation+access, transit,
// local secrets, photos). Moved verbatim from main.js, re-verified against a fresh
// call graph rather than the earlier scoping pass's labels (several of which had
// already drifted — see this file's own header note). placeScreen, resolveItem,
// formatMarketDays, jellyInSeason and placePhotoKeys were already exported (main.js
// reverse-imported some of them); formatMonths, SEV_LABEL, fmtReportDate and
// addPlaceSecret gained a first-time export here because main.js has real external
// callers for each (mosquito-peak months on the danger screen; the Travel Circle
// share-detail + inbox screens for jelly/secret previews) confirmed via a fresh grep,
// not by trusting this cluster's original "detail-only" classification.
// ============================================================================

function ratingBlock(p) {
  return h('div', { class: 'rating-block' }, [
    h('span', { class: 'stars-static' }, starsStr(p.rating)),
    h('span', { class: 'muted' }, ` ${Number(p.rating).toFixed(1)} · editorial estimate from ${(p.reviewSources || []).join(', ') || 'multiple public sources'}, not a live score`),
    h('a', { class: 'rev-link', href: mapsUrl(p), target: '_blank', rel: 'noopener' }, 'See live reviews'),
  ]);
}

// Resolve a saved item id to a renderable place-like object: a curated place, or a
// user pin normalised into the same shape.
export function resolveItem(id) {
  if (typeof id === 'string' && id.startsWith('pin-')) {
    const pin = getPin(id);
    if (!pin) return null;
    return {
      id: pin.id, name: pin.name, city: 'Your pin', country: '', isPin: true,
      categories: pin.tags || [], budgetTier: 'any', blurb: pin.note || 'A place you marked.',
      priceRange: { low: null, high: null, currency: '' }, coords: pin.coords || null, mapQuery: pin.name,
    };
  }
  return getPlace(id);
}

// ---- MARKETS: day-of-week awareness -----------------------------------------
// Many markets run only on certain days (weekend walking streets, Fri–Sun floating
// markets). marketDays is an array of weekday indices (0=Sun … 6=Sat); absent/empty
// means daily. These helpers drive the "on today?" line, card chip and ranking so a
// Sunday-only market is not surfaced as "near you now" on a Tuesday.
// Short weekday names come from the platform's own locale data for the chosen interface
// language, exactly as the calendar grid does (js/screens/calendar.js) — 2024-01-07 was a
// Sunday, which is index 0 here. Deriving them beats hand-authoring 7 dictionary rows in 29
// languages: no parity to maintain, correct plural/casing conventions per locale, and a
// market that runs "Fri–Sun" reads properly in Thai or Hebrew for free. Falls back to English
// if Intl rejects the locale tag, so a bad tag can never blank a market's opening days.
const DOW_FALLBACK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function dowShort(i) {
  try {
    return new Intl.DateTimeFormat(dateLocale(), { weekday: 'short' }).format(new Date(2024, 0, 7 + i));
  } catch { return DOW_FALLBACK[i]; }
}
export function formatMarketDays(p) {
  const d = marketOpenDays(p);
  // t() rather than a bare literal: these two are assembled at runtime around locale-derived
  // weekday names, so translateTree's exact-string match can never see them as a whole.
  if (!d) return t('Daily');
  if (d.length === 2 && d.includes(0) && d.includes(6)) return `${t('Weekends')} (${dowShort(6)} & ${dowShort(0)})`;
  if (d.join(',') === '0,5,6') return `${dowShort(5)}–${dowShort(0)}`;   // Fri, Sat, Sun (Sun wraps to index 0)
  let contig = true;
  for (let i = 1; i < d.length; i++) if (d[i] !== d[i - 1] + 1) contig = false;
  if (contig && d.length > 2) return `${dowShort(d[0])}–${dowShort(d[d.length - 1])}`;
  return d.map((n) => dowShort(n)).join(d.length > 2 ? ', ' : ' & ');
}
// Human "next open" hint from today: 'tomorrow' or the weekday name; null when daily.
function nextMarketDay(p, dow) {
  const d = marketOpenDays(p);
  if (!d) return null;
  for (let i = 1; i <= 7; i++) { const nd = (dow + i) % 7; if (d.includes(nd)) return i === 1 ? 'tomorrow' : dowShort(nd); }
  return null;
}
// Detail-screen block: market type, what they sell, the days/hours and a live on-today line.
function marketInfoCard(p) {
  if (!isMarket(p)) return null;
  const card = h('div', { class: 'card market-info' }, [h('h2', {}, '🛍️ Market')]);
  if (p.marketType) card.append(h('p', { class: 'market-type' }, h('strong', {}, p.marketType)));
  if (p.sells) card.append(h('p', {}, [h('strong', {}, 'What they sell: '), h('span', {}, p.sells)]));
  card.append(h('p', {}, [h('strong', {}, 'Runs: '), h('span', {}, formatMarketDays(p) + (p.hours ? ` · ${p.hours}` : ''))]));
  const d = marketOpenDays(p);
  if (!d) { card.append(h('p', { class: 'mkt-status on' }, '✅ Open daily')); return card; }
  const on = d.includes(new Date().getDay());
  const nxt = nextMarketDay(p, new Date().getDay());
  card.append(h('p', { class: `mkt-status ${on ? 'on' : 'off'}` },
    on ? '✅ On today' : `⏳ Not on today${nxt ? ` — next on ${titleCase(nxt)}` : ''}`));
  return card;
}

// --- Beaches, lifeguards & jellyfish safety ----------------------------------
// Beaches are ordinary map places (editable review, save, share) that additionally
// carry optional safety fields: lifeguard status, a swimming-conditions note, and a
// seasonal jellyfish window. No real-time jellyfish feed exists for the region, so the
// month window is HONEST SEASONAL GUIDANCE — the card says so and points to the flags.
const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Sorted unique 1-12 month list of elevated jellyfish risk, or null when none is set.
function jellyMonths(p) {
  const m = Array.isArray(p.jellyfishMonths) ? p.jellyfishMonths.filter((n) => Number.isInteger(n) && n >= 1 && n <= 12) : [];
  return m.length ? [...new Set(m)].sort((a, b) => a - b) : null;
}
export function jellyInSeason(p, month) { const m = jellyMonths(p); return !!(m && m.includes(month)); }
// Compact "Jul–Oct" / "Apr, Jun & Aug" from a sorted month array. Also reused by the danger
// screen's mosquito-peak card in main.js (reverse-imported from there), not just beaches.
export function formatMonths(m) {
  if (!m || !m.length) return '';
  let contig = true;
  for (let i = 1; i < m.length; i++) if (m[i] !== m[i - 1] + 1) contig = false;
  if (contig && m.length > 2) return `${MONTH_SHORT[m[0]]}–${MONTH_SHORT[m[m.length - 1]]}`;
  return m.map((n) => MONTH_SHORT[n]).join(m.length > 2 ? ', ' : ' & ');
}
const LIFEGUARD_LABEL = {
  yes: ['✅', 'Lifeguards patrol this beach', 'on'],
  seasonal: ['⚠️', 'Lifeguards / flags in season — check for a red flag before you swim', 'off'],
  no: ['❌', 'No lifeguards — swim with extra care and never alone', 'off'],
  unknown: ['ℹ️', 'No patrol information — treat as unpatrolled', 'muted'],
};
// Wave-height descriptor for swimming: [label, severity class].
function waveDesc(m) {
  if (m == null) return null;
  if (m < 0.3) return ['glassy calm', 'on'];
  if (m < 0.6) return ['calm', 'on'];
  if (m < 1.25) return ['moderate — take care', 'off'];
  if (m < 2.5) return ['rough — strong swimmers only', 'off'];
  return ['very rough — stay out of the water', 'off'];
}
// Live sea-state sub-block for a beach: significant wave height + water temperature from
// the Open-Meteo Marine API, painted from cache immediately and refreshed when online.
// Honest offline fallback so the beach card never blocks on the network.
function beachSeaBlock(coords) {
  const box = h('div', { class: 'beach-sea' });
  function paint(rec, loading) {
    box.innerHTML = '';
    if (rec && rec.waveHeight != null) {
      const wd = waveDesc(rec.waveHeight);
      const bits = [`🌊 Sea now: waves ${rec.waveHeight.toFixed(1)} m`];
      if (wd) bits.push(`(${wd[0]})`);
      if (rec.seaTemp != null) bits.push(`· water ${Math.round(rec.seaTemp)}°C`);
      box.append(h('p', { class: `beach-sea-line ${wd ? wd[1] : ''}` }, bits.join(' ')));
      box.append(h('p', { class: 'muted small' }, `Live sea state · updated ${seaAgo(rec.fetchedAt)}${online() ? '' : ' · offline'}`));
    } else {
      box.append(h('p', { class: 'muted small' }, loading ? '🌊 Checking sea conditions…' : '🌊 Live sea conditions load when you are online.'));
    }
  }
  const cached = getCachedMarine(coords);
  paint(cached, !cached && online());
  if (online()) {
    refreshMarine(coords).then((r) => { if ((location.hash || '').startsWith('#place') && r) paint(r, false); });
  }
  return box;
}
// Community jellyfish sightings — the honest "updated on wifi" layer: no real-time feed
// exists, but travellers can record and SHARE sightings through the backendless Travel
// Circle, and received ones pin to the beach. Reports live on placeData[id].jellyReports.
// Exported: the Travel Circle share-detail and inbox screens (main.js) render a jelly-sighting
// preview with this same dictionary, reverse-imported from here.
export const SEV_LABEL = { seen: 'Jellyfish seen', lots: 'Lots of jellyfish', stung: 'Someone was stung' };
function daysSinceISO(iso) { const n = -daysUntilISO(iso); return Number.isFinite(n) ? n : 9999; }
// Exported for the same Travel Circle share-detail/inbox reason as SEV_LABEL above.
export function fmtReportDate(iso) {
  const ds = daysSinceISO(iso);
  if (ds <= 0) return 'today';
  if (ds === 1) return 'yesterday';
  if (ds < 30) return `${ds} days ago`;
  return iso;
}
function jellyReportsBlock(p) {
  const wrap = h('div', { class: 'jelly-reports' });
  const list = h('div', {});
  wrap.append(list);
  function render() {
    list.innerHTML = '';
    const reps = getJellyReports(p.id);
    const recent = reps.filter((r) => daysSinceISO(r.d) <= 60).sort((a, b) => daysSinceISO(a.d) - daysSinceISO(b.d));
    if (recent.length) {
      list.append(h('p', { class: 'jelly-head' }, `🪼 Traveller sightings — ${recent.length} in the last 60 days`));
      recent.slice(0, 4).forEach((r) => {
        const who = r.by === 'You' ? 'you' : (r.by || 'a traveller');
        const when = fmtReportDate(r.d);
        list.append(h('div', { class: 'list-note' },
          `${when.charAt(0).toUpperCase()}${when.slice(1)} · ${SEV_LABEL[r.sev] || SEV_LABEL.seen}${r.note ? ` — ${r.note}` : ''} · ${who}`));
      });
    } else {
      list.append(h('p', { class: 'muted small' }, reps.length
        ? 'No sightings in the last 60 days (older reports are kept in your records).'
        : 'No traveller sightings reported here yet. If you see jellyfish, add a report to warn others.'));
    }
    let sev = 'seen';
    const note = h('input', { type: 'text', maxlength: '160', class: 'jelly-note-input', placeholder: 'Optional: where / how many (e.g. north end, small stingers)' });
    const sevRow = h('div', { class: 'sev-row' });
    [['seen', 'Seen'], ['lots', 'Lots'], ['stung', 'Stung']].forEach(([k, lbl]) => {
      sevRow.append(h('button', {
        class: 'chip', dataset: { k }, 'aria-pressed': k === sev ? 'true' : 'false',
        onclick: () => { sev = k; sevRow.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.k === sev ? 'true' : 'false')); },
      }, lbl));
    });
    list.append(h('details', { class: 'jelly-form' }, [
      h('summary', {}, '＋ Report a jellyfish sighting'),
      h('p', { class: 'muted small' }, 'Saved on your device and dated today. Share it below so other travellers see it — nothing is sent to any server.'),
      sevRow, note,
      h('button', { class: 'btn block', style: 'margin-top:8px', onclick: () => {
        addJellyReport(p.id, { d: todayKey(), sev, note: (note.value || '').trim().slice(0, 160), by: 'You' });
        render();
      } }, 'Save sighting'),
    ]));
    if (reps.length) {
      list.append(shareButton('📤 Share the latest sighting', `Jellyfish sighting — ${p.name}`,
        () => { const r = getJellyReports(p.id).slice().sort((a, b) => daysSinceISO(a.d) - daysSinceISO(b.d))[0]; return shareUrl('in', encodeShare('jelly', { id: p.id, n: p.name, d: r.d, sev: r.sev, note: r.note }, ensureMe())); }));
    }
  }
  render();
  return wrap;
}

// One-line "can I swim here today?" synthesis from everything the app knows: seasonal
// jellyfish risk, recent traveller sightings, lifeguard status and the cached sea state.
// A summary only — the detailed blocks below (and the live sea state) always carry the
// full picture. Red = take real care; amber = caution; green = no specific warning now.
function swimVerdict(p) {
  if (!isBeach(p)) return null;
  const nowM = new Date().getMonth() + 1;
  const reasons = [];
  let sev = 0;
  if (jellyInSeason(p, nowM)) { reasons.push('jellyfish season'); sev = Math.max(sev, 1); }
  const reps = getJellyReports(p.id) || [];
  if (reps.some((r) => r.sev === 'stung' && daysSinceISO(r.d) <= 14)) { reasons.push('a sting reported in the last two weeks'); sev = 2; }
  else if (reps.some((r) => daysSinceISO(r.d) <= 14)) { reasons.push('recent traveller sightings'); sev = Math.max(sev, 1); }
  if (p.lifeguard === 'no') { reasons.push('no lifeguards'); sev = Math.max(sev, 1); }
  const sea = p.coords ? getCachedMarine(p.coords) : null;
  if (sea && sea.waveHeight != null) {
    if (sea.waveHeight >= 2.5) { reasons.push('very rough water now'); sev = 2; }
    else if (sea.waveHeight >= 1.25) { reasons.push('choppy water now'); sev = Math.max(sev, 1); }
  }
  const label = sev === 2 ? ['🔴', 'Take real care in the water today', 'off']
    : sev === 1 ? ['🟠', 'Swim with caution today', 'off']
    : ['🟢', 'No specific warnings right now — always obey the beach flags', 'on'];
  const box = h('div', {});
  box.append(h('p', { class: `swim-verdict ${label[2]}` }, `${label[0]} ${label[1]}`));
  if (reasons.length) box.append(h('p', { class: 'muted small' }, `Because: ${reasons.join('; ')}.`));
  return box;
}

// Detail-screen block: lifeguard status, swimming conditions, live sea state (waves /
// water temperature), seasonal jellyfish risk ("in season this month?"), and first aid.
function beachInfoCard(p) {
  if (!isBeach(p)) return null;
  const card = h('div', { class: 'card beach-info' }, [h('h2', {}, '🏖️ Beach & swimming')]);
  const sv = swimVerdict(p); if (sv) card.append(sv);
  if (p.lifeguard) {
    const lg = LIFEGUARD_LABEL[p.lifeguard] || LIFEGUARD_LABEL.unknown;
    card.append(h('p', { class: `beach-lg ${lg[2]}` }, `${lg[0]} ${lg[1]}`));
  } else {
    card.append(h('p', { class: 'muted' }, 'Check on arrival for a lifeguard flag system.'));
  }
  if (p.swim) card.append(h('p', {}, [h('strong', {}, 'Conditions: '), h('span', {}, p.swim)]));
  if (p.coords && p.coords.lat != null && p.coords.lng != null) card.append(beachSeaBlock(p.coords));
  const m = jellyMonths(p);
  if (m) {
    const on = m.includes(new Date().getMonth() + 1);
    card.append(h('p', { class: `beach-jelly ${on ? 'on' : 'off'}` },
      on ? `🪼 Jellyfish: elevated risk this month (peak season ${formatMonths(m)})`
         : `🪼 Jellyfish: lower risk now — peak season is ${formatMonths(m)}`));
  }
  if (p.jellyfish) card.append(h('p', { class: 'muted' }, p.jellyfish));
  card.append(jellyReportsBlock(p));
  card.append(h('p', { class: 'muted small' }, 'No real-time jellyfish warning exists anywhere in the region. Always obey the beach flags — a red flag means do not swim — and ask lifeguards or locals about recent sightings.'));
  card.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go('#danger') }, '🩹 Sting & marine first aid'));
  return card;
}

// Ratings + prices from across the web. Snapshots are curated (each stamped with the
// month it was checked) so they work offline; every row and the compare buttons
// deep-link out to the live site. No reviews are scraped.
function extStars(score, scale) { const s = (Number(score) / (Number(scale) || 5)) * 5; return isNaN(s) ? NaN : Math.round(s * 10) / 10; }
function extRow(label, right, href) {
  return h('div', { class: 'row-between', style: 'padding:5px 0;border-top:1px solid rgba(0,0,0,0.06)' }, [
    h('span', { style: 'font-weight:600' }, label),
    href ? h('a', { class: 'rev-link', href, target: '_blank', rel: 'noopener' }, right) : h('span', { class: 'muted' }, right),
  ]);
}
function externalRatingsCard(p) {
  const ext = Array.isArray(p.externalRatings) ? p.externalRatings : [];
  const prices = Array.isArray(p.externalPrices) ? p.externalPrices : [];
  const own = (getPlaceData(p.id).rating) || 0;
  const isStay = !!p.stayType;
  if (!ext.length && !prices.length && !isStay) return null;

  const card = h('div', { class: 'card' }, [h('h2', {}, 'Across the web')]);

  if (ext.length || own > 0) {
    // Blend the sites' scores weighted by review volume, so a site with 50,000 reviews
    // outweighs one with 86; fall back to a simple mean when no counts are present.
    const scored = ext.map((e) => ({ star: extStars(e.score, e.scale), w: Number(e.count) || 0 })).filter((x) => !isNaN(x.star));
    const totalW = scored.reduce((a, x) => a + x.w, 0);
    const blended = !scored.length ? 0
      : totalW > 0
        ? scored.reduce((a, x) => a + x.star * (x.w || 1), 0) / scored.reduce((a, x) => a + (x.w || 1), 0)
        : scored.reduce((a, x) => a + x.star, 0) / scored.length;
    const overall = own > 0 ? own : blended;
    if (overall > 0) {
      const how = own > 0 ? ' · your rating counts first'
        : scored.length > 1 ? (totalW > 0 ? ' · weighted by review volume' : ' · averaged across sites') : '';
      card.append(h('div', { class: 'rating-block' }, [
        h('span', { class: 'stars-static' }, starsStr(overall)),
        h('span', { class: 'muted' }, ` ${overall.toFixed(1)} overall${how}`),
      ]));
    }
    if (own > 0) card.append(extRow('You', `${starsStr(own)} ${own.toFixed(1)}`));
    ext.forEach((e) => {
      const st = extStars(e.score, e.scale);
      const cnt = e.count ? ` · ${Number(e.count).toLocaleString()} reviews` : '';
      const as = e.asOf ? ` · ${e.asOf}` : '';
      card.append(extRow(e.site, `${e.score}/${e.scale || 5}${isNaN(st) ? '' : ` (${st.toFixed(1)}★)`}${cnt}${as} ›`, extUrl(e, p)));
    });
  }

  if (prices.length) {
    card.append(h('h3', {}, 'Prices'));
    prices.forEach((pr) => {
      const from = pr.from != null ? `from ${money(pr.from, pr.currency) || (pr.from + ' ' + (pr.currency || ''))}` : 'Check price';
      card.append(extRow(pr.site, `${from}${pr.asOf ? ` · ${pr.asOf}` : ''} ›`, extUrl(pr, p)));
    });
  }

  const sites = isStay ? ['Booking', 'Agoda', 'Trip.com', 'Google'] : ['TripAdvisor', 'Google'];
  card.append(h('h3', {}, isStay ? 'Compare & book' : 'Compare live'));
  card.append(h('div', { class: 'chips' }, sites.map((site) =>
    h('a', { class: 'chip', href: extUrl({ site }, p), target: '_blank', rel: 'noopener' }, site))));
  card.append(h('p', { class: 'disclaimer' }, 'Scores and prices are snapshots from the dates shown — tap a site for live numbers and to book. Aggregated from public sources; no reviews are scraped.'));
  return card;
}

// Compact current-conditions card for a place, read from the NEAREST listed weather
// city (weather here is regional, not pinpoint — the distance is shown). Cached-first
// so it works offline; refreshes once in the background when online.
function weatherNearbyCard(p) {
  if (!p.coords || p.coords.lat == null || p.coords.lng == null) return null;
  const spot = nearestSpot(p.coords, p.country);
  if (!spot) return null;
  const km = haversineKm(p.coords, { lat: spot.lat, lng: spot.lng });
  const key = spotKey(spot);

  const card = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Weather nearby')]);
  const body = h('div', {});
  card.append(body);

  function paintWx(rec, loading) {
    body.innerHTML = '';
    if (rec && rec.current) {
      const [clabel, cemoji] = wmo(rec.current.code);
      body.append(h('div', { class: 'row-between' }, [
        h('span', { style: 'font-size:34px;line-height:1' }, cemoji),
        h('div', { style: 'text-align:right' }, [
          h('div', { style: 'font-size:26px;font-weight:800' }, fmtTemp(rec.current.temp)),
          h('div', { class: 'muted' }, clabel),
        ]),
      ]));
      body.append(h('div', { class: 'muted', style: 'margin-top:6px' },
        `Feels ${fmtTemp(rec.current.apparent)} · Humidity ${rec.current.humidity}% · Wind ${fmtWind(rec.current.wind)}`));
    } else {
      body.append(h('p', { class: 'muted', style: 'margin:0' },
        loading ? 'Fetching the latest forecast…' : 'No saved forecast yet — tap below, then Refresh while online.'));
    }
  }

  const cached = getCachedWeather(key);
  paintWx(cached, !cached && online());
  if (!cached && online()) {
    refreshWeather(spot).then((r) => { if ((location.hash || '').startsWith('#place') && r) paintWx(r, false); });
  }

  card.append(airBlock(spot, { compact: true }));
  card.append(uvTodayBlock(p.coords, p.country));
  card.append(
    h('p', { class: 'muted', style: 'margin:6px 0 0' },
      `Nearest listed city: ${spot.city}${km != null ? ` · ${fmtDistance(km)} away` : ''} · regional guide, not pinpoint.`),
    h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => { seedWeatherKey(key); go('#weather'); } }, 'See full forecast'),
  );
  return card;
}

// "Find it" orientation block for place detail — the fix for "a name alone does not tell
// me I am in the right place." Shows the local name/script, a one-line "how you will know
// you are there" recognition cue, distance + direction from the traveller, and an inline
// offline mini-map with the pin (tap the ⊕ to see yourself relative to it), plus a direct
// "directions" hand-off. Every part is optional and appears only when data exists.
function orientationCard(p) {
  if (!p || (!p.coords && !p.recognition && !p.localName)) return null;
  const card = h('div', { class: 'card' }, [h('h2', {}, '📍 Find it')]);
  if (p.localName) card.append(h('p', { class: 'local-name', lang: scriptLang(p.country) }, p.localName));
  if (p.recognition) card.append(h('div', { class: 'recognition' }, [
    h('strong', {}, 'How you will know you are there — '), h('span', {}, p.recognition),
  ]));
  const areaBits = [p.city ? `In ${p.city}` : null].filter(Boolean);
  if (areaBits.length) card.append(h('p', { class: 'muted', style: 'margin:6px 0 2px' }, areaBits.join(' · ')));
  const dchip = distanceChip(p);
  if (dchip) card.append(h('div', { style: 'margin:2px 0 8px' }, dchip));
  if (p.coords) {
    const mini = h('div', { class: 'mini-map', style: 'height:210px;border-radius:14px;overflow:hidden;position:relative' });
    card.append(mini);
    import('../map.js').then((m) => m.initMap(mini, {
      places: [p],
      onOpen: () => { /* already on this place */ },
      onLocate: (f) => setLastFix(f),
    })).then((c) => {
      // dispose the mini-map when leaving the screen (chain with any existing cleanup).
      const prev = getLiveCleanup();
      setLiveCleanup(() => { try { if (prev) prev(); } catch { /* noop */ } try { c.dispose(); } catch { /* noop */ } });
    }).catch(() => { mini.remove(); });
    card.append(h('a', { class: 'btn ghost block', style: 'margin-top:8px', href: mapsDirUrl(p), target: '_blank', rel: 'noopener' }, 'Get directions in Maps ↗'));
  }
  return card;
}

// Per-place accessibility: shows the recorded step-free/toilet tag if present; otherwise,
// for a traveller with a mobility need, points honestly to the country guide.
function placeAccessBlock(p) {
  const a = p.access;
  if (a && (a.stepFree || a.note)) {
    const LBL = { yes: '♿ Step-free access', partial: '♿ Partly step-free', no: '⚠️ Not step-free' };
    const box = h('div', { class: 'card access-focus' });
    box.append(h('h3', { style: 'margin-top:0' }, LBL[a.stepFree] || '♿ Accessibility'));
    if (a.note) box.append(h('p', { class: 'muted', style: 'margin:4px 0' }, a.note));
    if (a.toilet) box.append(h('div', { class: 'list-note' }, 'Accessible toilet reported on site.'));
    box.append(h('p', { class: 'tiny muted', style: 'margin-bottom:0' }, 'Reported accessibility — always verify on the day.'));
    return box;
  }
  const needMobility = (store.profile.prefs.access || []).includes('mobility');
  if (needMobility && !p.isPin) {
    const cc = p.country || (p.id || '').split('-')[0];
    if (getAccessibility(cc)) {
      const box = h('div', { class: 'card' });
      box.append(h('p', { class: 'tiny muted', style: 'margin:0 0 6px' }, 'Step-free access here is not recorded yet.'));
      box.append(h('button', { class: 'btn ghost block', onclick: () => go(`#access-${cc}`) }, '♿ See the country accessibility guide'));
      return box;
    }
  }
  return null;
}

// ---- TRANSPORT: getting to & from a place ----------------------------------
// Per-place connections computed from coordinates: the nearest airport, train, bus and
// ferry hub (from TRANSPORT_HUBS) plus the nearest cross-border crossing (from CROSSINGS).
// Distances are great-circle from the place; the map links resolve each hub by NAME, so
// door-to-door directions stay accurate even where a hub coordinate is only approximate.
const HUB_TYPES = [
  { type: 'airport', emoji: '🛫', label: 'airport', max: Infinity },
  { type: 'train', emoji: '🚆', label: 'train station', max: 130 },
  { type: 'bus', emoji: '🚌', label: 'bus terminal', max: 90 },
  { type: 'ferry', emoji: '⛴️', label: 'pier / ferry', max: 110 },
];

function nearestHub(coords, type, cc) {
  let best = null, bestSec = null;
  for (const hub of TRANSPORT_HUBS) {
    if (hub.type !== type || !hub.coords) continue;
    if (cc && hub.cc !== cc) continue;
    const km = haversineKm(coords, hub.coords);
    if (hub.secondary) { if (!bestSec || km < bestSec.km) bestSec = { hub, km }; }
    else if (!best || km < best.km) best = { hub, km };
  }
  // Prefer a primary (long-distance) hub. Only fall back to a secondary/commuter one when
  // it is substantially closer (>20 km) — so a central place shows the main terminal, not
  // a nearer commuter stop, but a remote place still gets whatever is actually near.
  if (best && bestSec) return (best.km <= bestSec.km + 20) ? best : bestSec;
  return best || bestSec;
}

function nearestCrossing(coords, maxKm) {
  let best = null;
  for (const x of CROSSINGS) {
    if (!x.coords) continue;
    const km = haversineKm(coords, x.coords);
    if (!best || km < best.km) best = { x, km };
  }
  return best && best.km <= maxKm ? best : null;
}

// Google Maps directions from a place to a named hub. Origin is the place's coordinates;
// destination is the hub NAME + city (resolved by Maps), so it stays accurate regardless
// of the stored hub coordinate. Opening needs internet; the distances above work offline.
function hubDirUrl(from, hub) {
  const dest = encodeURIComponent(`${hub.name}, ${hub.city}`);
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${dest}`;
}

function transitCard(p) {
  if (!p || !p.coords || p.isPin) return null;
  const cc = p.country || (p.id || '').split('-')[0];
  const card = h('div', { class: 'card' }, [
    h('h2', {}, '🚉 Getting here & away'),
    h('p', { class: 'muted tiny', style: 'margin:2px 0 8px' },
      'Nearest airport, train, bus and boat connections. Distances are straight-line from this spot; tap for door-to-door directions (needs internet).'),
  ]);
  HUB_TYPES.forEach((t) => {
    const found = nearestHub(p.coords, t.type, cc);
    if (!found || found.km > t.max) return;
    const { hub, km } = found;
    const dir = compass(bearing(p.coords, hub.coords));
    card.append(h('div', { class: 'transit-row' }, [
      h('div', { class: 'row-between' }, [
        h('strong', {}, `${t.emoji} ${hub.name}${hub.code ? ` (${hub.code})` : ''}`),
        h('span', { class: 'fair' }, `${kmLabel(km)} · ${dir}`),
      ]),
      h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, (hub.city && hub.city !== p.city) ? `${titleCase(t.label)} · ${hub.city}` : titleCase(t.label)),
      hub.into ? h('div', { class: 'list-note' }, hub.into) : null,
      hub.note ? h('div', { class: 'muted tiny' }, hub.note) : null,
      h('a', { class: 'btn ghost block', style: 'margin-top:4px', href: hubDirUrl(p.coords, hub), target: '_blank', rel: 'noopener' }, 'Directions ↗'),
    ]));
  });
  // Nearest open cross-border crossing (from the borders dataset) — useful when a place
  // sits near a frontier and the traveller is continuing into the next country.
  const bx = nearestCrossing(p.coords, 100);
  if (bx) {
    card.append(h('div', { class: 'transit-row' }, [
      h('div', { class: 'row-between' }, [
        h('strong', {}, `🛂 ${bx.x.name}`),
        h('span', { class: 'fair' }, kmLabel(bx.km)),
      ]),
      h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' }, `Border crossing · ${bx.x.pair}`),
      h('button', { class: 'btn ghost block', onclick: () => go('#crossings') }, 'Crossing details, hours & visa ↗'),
    ]));
  }
  // Always-on helpers: a live "transport near here" search, the country's intercity routes
  // and its arrival guide (airport → town, cash, SIM). These keep every place useful even
  // where no listed hub sits within range.
  card.append(h('div', { class: 'chips', style: 'margin-top:8px' }, [
    h('a', { class: 'chip', href: mapsSearch(`bus station OR train station near ${p.coords.lat},${p.coords.lng}`), target: '_blank', rel: 'noopener' }, '🔎 Transport near here ↗'),
    h('button', { class: 'chip', onclick: () => go(`#transport-${cc}`) }, '🧭 Routes, rentals & tickets'),
    h('button', { class: 'chip', onclick: () => go(`#arrival-${cc}`) }, '🛬 Arrival guide'),
  ]));
  card.append(sourcesNote(TRANSIT_SOURCES, 'July 2026'));
  return card;
}

// ---- LOCAL SECRETS (per-place crowdsourced tips; on-device, shared by link) --
// Insider tips for a place: curated guide tips + the user's own secrets + secrets
// other travellers shared with a link. Stored in placeData[id].secrets (rides along
// in the backup). A progressive-disclosure drawer keeps the place page calm.
function getPlaceSecrets(id) { const s = getPlaceData(id).secrets; return Array.isArray(s) ? s : []; }
// Exported: the Travel Circle share-detail screen (main.js) saves an incoming shared secret
// straight onto the matching place via this, reverse-imported from here.
export function addPlaceSecret(id, { text, by }) {
  const list = getPlaceSecrets(id).slice();
  list.unshift({ text: String(text || '').slice(0, 400), by: String(by || '').slice(0, 40), at: todayKey() });
  setPlaceField(id, 'secrets', list);
}
function removePlaceSecret(id, idx) { const list = getPlaceSecrets(id).slice(); list.splice(idx, 1); setPlaceField(id, 'secrets', list); }

function localSecretsCard(p) {
  if (p.isPin) return null;
  const guideTips = Array.isArray(p.tips) ? p.tips : [];
  const card = h('details', { class: 'card local-secrets' });
  const summary = h('summary', {}, '');
  card.append(summary);
  card.append(h('p', { class: 'muted small', style: 'margin:2px 0 8px' }, 'Insider tips for this place — from the guide, from you, and from travellers who shared a link. Kept on your device.'));
  if (guideTips.length) {
    card.append(h('h3', { style: 'margin:6px 0 2px' }, '📖 From the guide'));
    guideTips.forEach((t) => card.append(h('div', { class: 'list-note' }, t)));
  }
  const listEl = h('div', {});
  card.append(listEl);
  function drawSecrets() {
    listEl.innerHTML = '';
    const s = getPlaceSecrets(p.id);
    summary.textContent = `🔑 Local secrets & tips${s.length ? ` (${s.length})` : ''}`;
    if (s.length) listEl.append(h('h3', { style: 'margin:10px 0 2px' }, '🔑 Traveller secrets'));
    s.forEach((sec, i) => {
      listEl.append(h('div', { class: 'secret-item' }, [
        h('p', { style: 'margin:0' }, sec.text),
        h('div', { class: 'tiny muted' }, [sec.by, sec.at].filter(Boolean).join(' · ')),
        h('div', { class: 'listing-actions' }, [
          shareButton('🔗 Share', `A tip for ${p.name}`, () => shareUrl('in', encodeShare('secret', { id: p.id, n: p.name, text: sec.text, by: sec.by || (ensureMe().name || '') }, ensureMe())), 'btn ghost'),
          h('button', { class: 'btn ghost', 'aria-label': 'Remove this secret', onclick: () => { removePlaceSecret(p.id, i); drawSecrets(); } }, '🗑'),
        ]),
      ]));
    });
  }
  drawSecrets();
  const ta = h('textarea', { class: 'ta', rows: '2', maxlength: '400', placeholder: 'A hidden gem, a shortcut, a heads-up…' });
  card.append(h('div', { class: 'secret-add' }, [
    h('label', { class: 'secret-cta' }, '✨ Spotted something new? Add to the collective wisdom'),
    ta,
    h('button', { class: 'btn block', style: 'margin-top:6px', onclick: () => {
      const t = ta.value.trim(); if (!t) { ta.focus(); return; }
      addPlaceSecret(p.id, { text: t, by: ensureMe().name || '' });
      ta.value = ''; drawSecrets();
    } }, '＋ Add this secret'),
    h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: () => go(`#feedback-${p.id}`) }, '✍️ Suggest a bigger correction to the guide'),
  ]));
  return card;
}

// The place-detail page itself. Exported: main.js's #place router case reverse-imports this.
export function placeScreen(id) {
  const p = resolveItem(id);
  const backHash = p && p.isPin ? '#saved' : '#places';
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(p ? p.name : 'Place', backHash));
  if (!p) { wrap.append(h('p', { class: 'empty' }, 'Place not found.')); mount(wrap, backHash); return; }

  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const card = h('div', { class: 'card' }, [
    (cats.length || (p.budgetTier && !p.isPin)) ? h('div', { class: 'row-between' }, [
      h('div', { class: 'cats' }, cats.map((c) => catTag(c))),
      (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
    ]) : null,
    travelerChips(p),
    photoBlock(p, p.name),
    p.blurb ? h('p', {}, p.blurb) : null,
  ]);
  // Show the synthesised rating only when there is no real external-ratings snapshot; when
  // externalRatings exists it is the single source of truth (rendered lower down), so the two
  // can no longer sit side by side showing slightly different numbers.
  if (p.rating && !(Array.isArray(p.externalRatings) && p.externalRatings.length)) card.append(ratingBlock(p));
  if (p.history) { card.append(h('h3', {}, 'A little history'), h('p', {}, p.history)); { const rd = readAloudBar(() => [p.blurb, p.history].filter(Boolean).join('. ')); if (rd) card.append(rd); } }
  if (p.whyItFits) { card.append(h('h3', {}, 'Why it fits you'), h('p', {}, p.whyItFits)); }
  if (hasPrice) {
    card.append(h('h3', {}, 'Price'));
    card.append(h('p', {}, `${priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free'}${p.priceRange.note ? ' · ' + p.priceRange.note : ''}`));
  }
  if (p.hours && !isMarket(p)) card.append(h('p', { class: 'muted' }, `Hours: ${p.hours}`));
  if (p.bookHint) card.append(h('p', { class: 'muted' }, `Booking: ${p.bookHint}`));
  if (p.scamWarnings && p.scamWarnings.length) { card.append(h('h3', {}, 'Watch out')); p.scamWarnings.forEach((t) => card.append(h('div', { class: 'warn-note' }, t))); }
  if (p.activities && p.activities.length) { card.append(h('h3', {}, 'Things to do here')); card.append(h('div', { class: 'cats' }, p.activities.map((a) => h('span', { class: 'cat-tag' }, titleCase(a))))); }
  if (p.amenities && p.amenities.length) { card.append(h('h3', {}, 'Amenities')); card.append(h('div', { class: 'cats' }, p.amenities.map((a) => h('span', { class: 'cat-tag' }, titleCase(a))))); }

  const colls = collectionsForItem(p.id);
  const collStrip = colls.length
    ? h('div', { class: 'cats', style: 'margin-top:8px' }, colls.map((c) => h('span', { class: 'cat-tag', style: 'background:var(--grape)' }, `${c.emoji} ${c.name}`)))
    : null;

  const actions = h('div', { class: 'card' }, [
    (p.coords || p.mapQuery) ? h('a', { class: 'btn block', href: mapsUrl(p), target: '_blank', rel: 'noopener' }, 'Open in Maps') : null,
    h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => saveSheet(p.id) }, '＋ Save to collections'),
    h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => tripVisitSheet(p.id) }, '🧭 Add to my trip'),
    !p.isPin ? shareButton('📤 Recommend to a friend', `Check out ${p.name}`, () => shareUrl('in', encodeShare('place', { id: p.id, n: p.name }, ensureMe()))) : null,
    !p.isPin ? h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#feedback-${p.id}`) }, '✍️ Suggest an edit') : null,
    collStrip,
    p.isPin ? h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#addpin-${p.id}`) }, '✎ Edit this place') : null,
    p.isPin ? h('button', {
      class: 'btn ghost block', style: 'margin-top:8px; color:var(--warn); border-color:var(--warn)',
      onclick: () => { confirmAction({ title: 'Delete this pin?', confirmLabel: 'Delete', danger: true }).then((ok) => { if (ok) { deletePin(p.id); go('#saved'); } }); },
    }, 'Delete pin') : null,
  ]);

  wrap.append(card);
  const accBlock = placeAccessBlock(p);
  if (accBlock) wrap.append(accBlock);
  // What this place means for who the traveller IS — including, stated plainly, what nobody
  // has recorded yet. Sits right after accessibility so the two read as one honest block.
  const fitCard = profileFitCard(p);
  if (fitCard) wrap.append(fitCard);
  const mkt = marketInfoCard(p);
  if (mkt) wrap.append(mkt);
  const beach = beachInfoCard(p);
  if (beach) wrap.append(beach);
  const orient = orientationCard(p);
  if (orient) {
    { const t = oneTimeHint('place-orient', 'Below, "Find it" gives the local name and how to recognise this spot on the ground — useful for a taxi or asking directions.'); if (t) wrap.append(t); }
    wrap.append(orient);
  }
  const transit = transitCard(p);
  if (transit) wrap.append(transit);
  const extCard = externalRatingsCard(p);
  if (extCard) wrap.append(extCard);
  const wxCard = weatherNearbyCard(p);
  if (wxCard) wrap.append(wxCard);
  const secretsCard = localSecretsCard(p);
  if (secretsCard) wrap.append(secretsCard);
  wrap.append(actions, yourLayer(p));
  if (p.sources && p.sources.length) wrap.append(sourcesNote(p.sources, p.verified, p));
  mount(wrap, backHash);
}

// Photos the traveller attached to a place, stored on-device: blobs in IndexedDB keyed by
// the place, with the ordered key list kept in placeData[id].photos (so they ride along in
// the full backup). Autosaves immediately, like the rating/note/review on the same card.
export function placePhotoKeys(id) { const d = getPlaceData(id); return Array.isArray(d.photos) ? d.photos : []; }
async function addPlacePhotos(id, files) {
  const keys = placePhotoKeys(id).slice();
  let n = 0;
  for (const f of files) {
    const nk = `placephoto-${id}-${Date.now()}-${n++}-${Math.floor(Math.random() * 1e6)}`;
    try { await putBlob(nk, f); keys.push(nk); } catch { /* skip a photo that will not store */ }
  }
  setPlaceField(id, 'photos', keys);
  return keys;
}
function removePlacePhoto(id, key) {
  setPlaceField(id, 'photos', placePhotoKeys(id).filter((k) => k !== key));
  delBlob(key);
}
// A reusable "add photos" block (camera + library) that writes straight to a place and
// repaints the given thumbs container. Shared by the place card and the pin editor.
function placePhotoControls(id, thumbs, renderThumbs) {
  const camIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
  const libIn = h('input', { type: 'file', accept: 'image/*', multiple: '', style: 'display:none' });
  const onPick = async (inp) => {
    const files = inp.files ? [...inp.files] : []; inp.value = '';
    if (files.length) { await addPlacePhotos(id, files); renderThumbs(); }
  };
  camIn.onchange = () => onPick(camIn);
  libIn.onchange = () => onPick(libIn);
  return h('div', {}, [
    thumbs,
    h('div', { class: 'chips' }, [
      h('button', { class: 'chip', onclick: () => camIn.click() }, '📷 Take a photo'),
      h('button', { class: 'chip', onclick: () => libIn.click() }, '🖼 Add pictures'),
    ]),
    camIn, libIn,
  ]);
}
function placePhotoThumbs(id) {
  const thumbs = h('div', { class: 'photo-thumbs' });
  const renderThumbs = () => {
    thumbs.innerHTML = '';
    const keys = placePhotoKeys(id);
    if (!keys.length) { thumbs.append(h('p', { class: 'muted', style: 'margin:0' }, 'No photos yet — add your own.')); return; }
    keys.forEach((k) => {
      const img = h('img', { alt: 'Your photo of this place', loading: 'lazy' });
      setBlobThumb(img, k);
      thumbs.append(h('div', { class: 'photo-thumb' }, [
        img,
        h('button', { class: 'photo-thumb-x', 'aria-label': 'Remove photo', onclick: () => { removePlacePhoto(id, k); renderThumbs(); } }, '✕'),
      ]));
    });
  };
  renderThumbs();
  return { thumbs, renderThumbs };
}

// The user's own layer on a place: rating, private note, and their own review kept
// alongside the guidebook original (colour-coded). All on-device.
function yourLayer(p) {
  const d = getPlaceData(p.id);
  const card = h('div', { class: 'card' }, [h('h2', {}, 'Your notes & review')]);

  const stars = h('div', { class: 'stars' });
  const paint = (n) => [...stars.children].forEach((s, i) => { s.textContent = i < n ? '★' : '☆'; });
  for (let i = 1; i <= 5; i++) {
    stars.append(h('button', { class: 'star', 'aria-label': `${i} star${i > 1 ? 's' : ''}`, onclick: () => {
      const nv = getPlaceData(p.id).rating === i ? 0 : i; setPlaceField(p.id, 'rating', nv); paint(nv);
    } }, '☆'));
  }
  paint(d.rating || 0);
  card.append(h('div', { class: 'field' }, [h('label', {}, 'Your rating'), stars]));

  // Your photos — take or add pictures of this place (kept on-device, in the backup).
  const { thumbs, renderThumbs } = placePhotoThumbs(p.id);
  card.append(h('div', { class: 'field' }, [h('label', {}, 'Your photos'), placePhotoControls(p.id, thumbs, renderThumbs)]));

  const note = h('textarea', { class: 'ta', placeholder: 'Private notes — directions, what to order, who you met…' });
  note.value = d.note || '';
  note.addEventListener('change', () => setPlaceField(p.id, 'note', note.value));
  card.append(h('div', { class: 'field' }, [h('label', {}, 'Private note'), note]));

  if (!p.isPin && (p.blurb || p.whyItFits)) {
    card.append(h('div', { class: 'review-orig' }, [
      h('span', { class: 'rlabel' }, 'Guidebook'),
      h('p', {}, [p.blurb, p.whyItFits].filter(Boolean).join(' ')),
    ]));
  }
  const yourRev = h('textarea', { class: 'ta', placeholder: 'Your own take — kept separately from the guidebook…' });
  yourRev.value = d.review || '';
  yourRev.addEventListener('change', () => setPlaceField(p.id, 'review', yourRev.value));
  card.append(h('div', { class: 'review-yours' }, [h('span', { class: 'rlabel' }, 'Your take'), yourRev]));

  // Share just this place's review — your stars, words and photos — as a small web page.
  const shareBtn = h('button', { class: 'btn ghost block', style: 'margin-top:10px' }, '📤 Share my review');
  shareBtn.onclick = async () => {
    const dd = getPlaceData(p.id);
    if (!(dd.rating || (dd.review || '').trim() || (dd.note || '').trim() || (dd.photos || []).length)) {
      alert('Add a star rating, a review or a photo first, then share.'); return;
    }
    const lbl = shareBtn.textContent; shareBtn.disabled = true; shareBtn.textContent = 'Preparing…';
    try {
      const html = await exportOnePlaceReviewHtml(p.id, p.name);
      await shareOrDownload([{ blob: new Blob([html], { type: 'text/html' }), name: `my-review-${phraseSlug(p.name || 'place')}.html` }], `My review of ${p.name || 'this place'}`);
    } catch { alert('Could not build the review to share.'); }
    shareBtn.disabled = false; shareBtn.textContent = lbl;
  };
  card.append(shareBtn);

  return card;
}
