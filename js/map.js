// Fully offline vector map: MapLibre GL JS (vendored) renders a SELF-HOSTED GeoJSON
// basemap of the four countries — no external tiles, so it works with no connection
// from first launch (the old Protomaps demo bucket was retired and returned 404).
// GPS via the geolocate control, curated places + user pins as rating-coloured
// markers, inter-city routes and the Mekong drawn on top, tap-to-drop-a-pin. Street
// detail is intentionally omitted so the whole region ships in ~26 KB and never breaks.

import { store, getMyStay } from './state.js';
import { allPlaces, COUNTRIES } from './data/regions.js';
import { BASEMAP } from './data/basemap.js';
import { CROSSINGS } from './data/borders.js';
import { BORDER_LINES } from './data/borders_lines.js';
import { POOLS } from './data/pools.js';

// The Mekong main stem as lat/lng (same trace as the landing-map river).
const MEKONG_LL = [
  [100.08, 20.36], [100.60, 20.27], [101.15, 20.05], [101.65, 19.60], [102.10, 19.88],
  [102.00, 19.25], [101.60, 18.70], [101.90, 18.00], [102.60, 17.97], [103.25, 17.60],
  [104.05, 17.40], [104.74, 16.90], [105.00, 16.00], [105.45, 15.40], [105.80, 15.12],
  [105.95, 14.50], [106.00, 13.95], [106.02, 13.52], [105.95, 12.70], [105.46, 12.00],
  [104.93, 11.56], [105.25, 11.00], [105.46, 10.40], [105.78, 10.03], [106.20, 9.90],
  [106.60, 9.65], [106.78, 9.50],
];
const MEKONG_FC = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: MEKONG_LL } }] };

// Optional satellite basemap (Esri World Imagery) — streamed when online and
// runtime-cached by the service worker so viewed areas persist offline. It sits
// OVER the self-hosted vector basemap, which remains the always-offline fallback
// (uncached tiles simply fail to paint and the vector layers show through). This
// reuses the same source/attribution as the Nomadic Almanac map.
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Imagery © Esri — Source: Esri, Maxar, Earthstar Geographics, USGS, NOAA';

// Build the list of satellite-tile URLs covering `bounds` from the current zoom down a
// few levels (capped) so the service worker can pre-cache the area for offline use.
function tileUrlsForBounds(bounds, z0, extraZoom = 2, cap = 600) {
  const lon2tile = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
  const lat2tile = (lat, z) => {
    const r = lat * Math.PI / 180;
    return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z);
  };
  const clampTile = (t, z) => Math.max(0, Math.min(2 ** z - 1, t));
  const urls = [];
  const zStart = Math.max(1, Math.floor(z0));
  const zEnd = Math.min(zStart + extraZoom, 17);
  for (let z = zStart; z <= zEnd; z++) {
    const x0 = clampTile(lon2tile(bounds.getWest(), z), z), x1 = clampTile(lon2tile(bounds.getEast(), z), z);
    const y0 = clampTile(lat2tile(bounds.getNorth(), z), z), y1 = clampTile(lat2tile(bounds.getSouth(), z), z);
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
        urls.push(SATELLITE_TILES.replace('{z}', z).replace('{x}', x).replace('{y}', y));
        if (urls.length >= cap) return urls;
      }
    }
  }
  return urls;
}

// Pin colour by rating. The traveller's OWN rating (placeData) wins over the
// curated/synthesised score, so once you rate a place its pin reflects YOUR view.
export function effectiveRating(id, curated) {
  const own = (store.placeData && store.placeData[id] && store.placeData[id].rating) || 0;
  return own > 0 ? own : (curated || 0);
}
export const RATING_BANDS = [
  { min: 4.5, color: '#1E9E5A', label: 'Excellent (4.5+)' },
  { min: 4.0, color: '#7DB23A', label: 'Great (4.0+)' },
  { min: 3.0, color: '#F2A93B', label: 'Good (3.0+)' },
  { min: 2.0, color: '#E8632A', label: 'Mixed (2.0+)' },
  { min: 0.1, color: '#D6336C', label: 'Poor (<2.0)' },
  { min: 0, color: '#8A8F98', label: 'Unrated' },
];
export function ratingColor(r) { return (RATING_BANDS.find((b) => r >= b.min) || RATING_BANDS[RATING_BANDS.length - 1]).color; }

// Route corridors are drawn as straight lines between known city centres, coloured
// by the recommended travel mode. Endpoints not in this table are skipped.
const PIN_USER = '#6A4C93';
const CITY_COORDS = {
  'Bangkok': [100.5018, 13.7563], 'Chiang Mai': [98.9853, 18.7883], 'Phuket': [98.3923, 7.8804],
  'Krabi': [98.9063, 8.0863], 'Pai': [98.4406, 19.3583], 'Koh Lanta': [99.0853, 7.6286],
  'Surat Thani': [99.3329, 9.1399], 'Nong Khai': [102.7460, 17.8782], 'Ayutthaya': [100.5870, 14.3692],
  'Hanoi': [105.8342, 21.0278], 'Ho Chi Minh City': [106.6297, 10.8231], 'Hoi An': [108.3380, 15.8801],
  'Da Nang': [108.2022, 16.0544], 'Hue': [107.5909, 16.4637], 'Nha Trang': [109.1967, 12.2388], 'Sapa': [103.8440, 22.3364],
  'Phnom Penh': [104.9282, 11.5564], 'Siem Reap': [103.8448, 13.3671], 'Sihanoukville': [103.5223, 10.6270],
  'Battambang': [103.1968, 13.0957], 'Kampot': [104.1819, 10.6104],
  'Vientiane': [102.6331, 17.9757], 'Luang Prabang': [102.1348, 19.8845], 'Vang Vieng': [102.4470, 18.9237], 'Pakse': [105.7820, 15.1202],
};
function normCity(name) { return String(name || '').replace(/\s*\(.*\)\s*/g, '').trim(); }
// Classify a transport mode into one of five route keys. modeColor()/modeKey() must
// agree; the default 'other' is a neutral grey that never collides with a rating pin.
export function modeKey(mode) {
  const m = (mode || '').toLowerCase();
  if (m.includes('train')) return 'train';
  if (m.includes('flight') || m.includes('fly') || m.includes('air')) return 'flight';
  if (m.includes('ferry') || m.includes('boat') || m.includes('catamaran') || m.includes('cruise')) return 'ferry';
  if (m.includes('bus') || m.includes('van') || m.includes('minibus') || m.includes('car') || m.includes('taxi') || m.includes('tuk-tuk')) return 'bus';
  return 'other';
}
// Route colours. Ferry darkened #16A39A -> #138C84 for legend contrast on the cream
// card; the old #E8632A default (which clashed with the 'Mixed' rating pin) is gone.
export const ROUTE_LEGEND = [
  { key: 'train', color: '#3B6FE0', label: 'Train', dash: [3, 1.5], swatchDash: '7 3' },
  { key: 'flight', color: '#6A4C93', label: 'Flight', dash: [1.5, 1.5], swatchDash: '3 3' },
  { key: 'bus', color: '#2E8B57', label: 'Bus', dash: [0.8, 1.4], swatchDash: '1.5 3' },
  { key: 'ferry', color: '#138C84', label: 'Ferry / boat', dash: [3, 1.2, 0.8, 1.2], swatchDash: '7 3 1.5 3' },
  { key: 'other', color: '#7A8089', label: 'Other / mixed', dash: [2, 1.2], swatchDash: '5 3' },
];
const ROUTE_COLOR = ROUTE_LEGEND.reduce((o, r) => { o[r.key] = r.color; return o; }, {});
export function modeColor(mode) { return ROUTE_COLOR[modeKey(mode)]; }
function routesGeoJSON() {
  const feats = [];
  for (const c of COUNTRIES) {
    for (const r of (c.routes || [])) {
      const a = CITY_COORDS[normCity(r.from)], b = CITY_COORDS[normCity(r.to)];
      if (!a || !b) continue;
      const opt = (r.options || []).find((o) => o.recommended) || (r.options || [])[0] || {};
      feats.push({ type: 'Feature', properties: { color: modeColor(opt.mode), mode: modeKey(opt.mode) }, geometry: { type: 'LineString', coordinates: [a, b] } });
    }
  }
  return { type: 'FeatureCollection', features: feats };
}

let libsPromise = null;
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = resolve; s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.append(s);
  });
}
function loadCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.append(l);
}
function loadLibs() {
  if (libsPromise) return libsPromise;
  loadCss('lib/maplibre-gl.css');
  libsPromise = loadScript('lib/maplibre-gl.js');
  return libsPromise;
}

// Self-hosted geometry style: sea background, the four country fills with a coastline
// outline, and the Mekong. No glyphs/sprites/text layers, so nothing is fetched.
function basemapStyle() {
  return {
    version: 8,
    sources: {
      land: { type: 'geojson', data: BASEMAP, attribution: '© OpenStreetMap · Natural Earth' },
      mekong: { type: 'geojson', data: MEKONG_FC },
      satellite: { type: 'raster', tiles: [SATELLITE_TILES], tileSize: 256, maxzoom: 19, attribution: SATELLITE_ATTR },
      borderlines: { type: 'geojson', data: BORDER_LINES },
    },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': '#9FD3CE' } },
      { id: 'land', source: 'land', type: 'fill', paint: { 'fill-color': '#EFE2C6' } },
      { id: 'land-outline', source: 'land', type: 'line', paint: { 'line-color': '#C9A86A', 'line-width': 1.2 } },
      { id: 'satellite', source: 'satellite', type: 'raster', layout: { visibility: 'visible' } },
      { id: 'borders', source: 'borderlines', type: 'line', layout: { visibility: 'visible' },
        paint: { 'line-color': '#FF3B30', 'line-width': 2, 'line-dasharray': [2, 1.5], 'line-opacity': 0.95 } },
      { id: 'mekong-line', source: 'mekong', type: 'line', layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2C7DA0', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.2, 8, 3, 12, 6] } },
    ],
  };
}

// Initialise the map into containerEl. Returns a controller with helpers for the
// toolbar. Rejects if the libraries cannot load (caller shows a fallback).
export async function initMap(containerEl, opts = {}) {
  await loadLibs();
  const maplibregl = window.maplibregl;
  if (!maplibregl) throw new Error('map library unavailable');

  const start = opts.center || { lng: 104.5, lat: 13.5 }; // centre on the region
  const map = new maplibregl.Map({
    container: containerEl,
    style: basemapStyle(),
    center: [start.lng, start.lat],
    zoom: opts.zoom || 5.4,
    attributionControl: true,
  });
  // Compass enabled so the map can be rotated and reset to north for orientation;
  // a metric scale bar so distances can be judged offline (both glyph-free, no fetch).
  map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: false }), 'top-right');
  const geo = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true }, trackUserLocation: true,
    showUserLocation: true, showUserHeading: true,
  });
  map.addControl(geo, 'top-right');
  try { map.addControl(new maplibregl.ScaleControl({ maxWidth: 130, unit: 'metric' }), 'top-left'); } catch { /* older build */ }
  // "Key" button on the map itself: opens + scrolls to the legend so it is reachable
  // while looking at the map (HTML control, not a GL text layer — glyph-free is unaffected).
  if (opts.onShowKey) {
    const keyCtrl = {
      onAdd() {
        const d = document.createElement('div');
        d.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        const b = document.createElement('button');
        b.type = 'button'; b.title = 'Map key'; b.setAttribute('aria-label', 'Open the map key');
        b.textContent = '🔑'; b.style.fontSize = '15px';
        b.addEventListener('click', () => { try { opts.onShowKey(); } catch { /* noop */ } });
        d.appendChild(b); this._c = d; return d;
      },
      onRemove() { if (this._c && this._c.parentNode) this._c.parentNode.removeChild(this._c); },
    };
    map.addControl(keyCtrl, 'top-right');
  }

  // markers: curated places coloured by EFFECTIVE rating (your own rating wins),
  // except markets, which use a distinct gold pin. Each marker is tagged with its
  // map layer (stay / eat / go / market) so the layer toggles can show or hide it.
  // User pins stay in grape and always show.
  const markersByLayer = { stay: [], eat: [], localeat: [], go: [], market: [], pools: [], crossing: [] };
  const CROSSING_PIN = '#3B5BDB';
  const MARKET_PIN = '#E0A100';
  const POOL_PIN = '#0EA5C4';     // watery cyan for swimming pools
  const LOCAL_PIN = '#D62828';    // local (non-tourist) eateries — a distinct "eat local" red
  let stayMarker = null;          // the user's accommodation home marker (set live)
  function layerForCats(cats, isLocal) {
    cats = cats || [];
    if (cats.includes('market')) return 'market';
    if (cats.some((c) => ['hotel', 'stay', 'accommodation', 'guesthouse', 'homestay', 'resort', 'hostel', 'apartment'].includes(c))) return 'stay';
    if (cats.some((c) => ['food', 'restaurant'].includes(c))) return isLocal ? 'localeat' : 'eat';
    return 'go';
  }
  const layerOn = { stay: true, eat: true, localeat: true, go: true, market: true, pools: true, crossing: true };
  const CITY_ZOOM = 8.5;        // below this, show city count-bubbles instead of pins
  const cityMarkers = [];       // { el, name, count }
  // Assign a place/pool to its nearest known city centre (within ~0.8°), else none.
  function nearestCity(coords) {
    let best = null, bestD = Infinity;
    for (const name in CITY_COORDS) {
      const d = (coords.lng - CITY_COORDS[name][0]) ** 2 + (coords.lat - CITY_COORDS[name][1]) ** 2;
      if (d < bestD) { bestD = d; best = name; }
    }
    return bestD <= 0.64 ? best : null;
  }
  // Clustering, glyph-free: at region zoom show ONE count bubble per city
  // ("Bangkok 9") instead of ~200 overlapping pins; the bubbles become small place-name
  // labels and the individual pins appear as you zoom in. (User pins + home always show.)
  function refreshMarkers() {
    const cityMode = map.getZoom() < CITY_ZOOM;
    for (const layer of Object.keys(markersByLayer)) {
      const on = !cityMode && layerOn[layer] !== false;
      markersByLayer[layer].forEach((el) => { el.style.display = on ? '' : 'none'; });
    }
    for (const c of cityMarkers) {
      c.el.className = 'mk-city ' + (cityMode ? 'bubble' : 'label');
      c.el.textContent = cityMode ? `${c.name}  ${c.count}` : c.name;
    }
  }
  function setLayerVisible(layer, on) { layerOn[layer] = on; refreshMarkers(); }
  // One HTML marker per city: a count bubble (low zoom) / name label (high zoom).
  function addCityMarkers() {
    const counts = {};
    const tally = (coords) => { if (!coords) return; const c = nearestCity(coords); if (c) counts[c] = (counts[c] || 0) + 1; };
    for (const p of allPlaces()) tally(p.coords);
    for (const p of POOLS) tally(p.coords);
    for (const name in CITY_COORDS) {
      const count = counts[name] || 0;
      if (!count) continue;                 // skip cities with no curated places
      const el = document.createElement('div');
      el.className = 'mk-city bubble';
      el.style.cursor = 'pointer';
      el.addEventListener('click', (ev) => { ev.stopPropagation(); map.flyTo({ center: CITY_COORDS[name], zoom: 12 }); });
      new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(CITY_COORDS[name]).addTo(map);
      cityMarkers.push({ el, name, count });
    }
  }
  function addMarkers() {
    for (const p of allPlaces()) {
      if (!p.coords) continue;
      const layer = layerForCats(p.categories, p.isLocal);
      const color = layer === 'market' ? MARKET_PIN : layer === 'localeat' ? LOCAL_PIN : ratingColor(effectiveRating(p.id, p.rating));
      const m = new maplibregl.Marker({ color }).setLngLat([p.coords.lng, p.coords.lat]).addTo(map);
      const el = m.getElement();
      el.style.cursor = 'pointer';
      el.dataset.mkLayer = layer;
      el.addEventListener('click', (ev) => { ev.stopPropagation(); if (opts.onOpen) opts.onOpen(p.id); });
      markersByLayer[layer].push(el);
    }
    for (const pin of store.pins) {
      if (!pin.coords) continue;
      const m = new maplibregl.Marker({ color: PIN_USER }).setLngLat([pin.coords.lng, pin.coords.lat]).addTo(map);
      m.getElement().style.cursor = 'pointer';
      m.getElement().addEventListener('click', (ev) => { ev.stopPropagation(); if (opts.onOpen) opts.onOpen(pin.id); });
    }
    // border crossings as a distinct blue layer; click opens the crossings list
    for (const x of CROSSINGS) {
      if (!x.coords) continue;
      const m = new maplibregl.Marker({ color: CROSSING_PIN }).setLngLat([x.coords.lng, x.coords.lat]).addTo(map);
      const el = m.getElement();
      el.style.cursor = 'pointer';
      el.dataset.mkLayer = 'crossing';
      el.addEventListener('click', (ev) => { ev.stopPropagation(); if (opts.onOpenCrossing) opts.onOpenCrossing(x.id); });
      markersByLayer.crossing.push(el);
    }
    // public / day-pass / water-park pools as a distinct cyan layer
    for (const p of POOLS) {
      if (!p.coords) continue;
      const m = new maplibregl.Marker({ color: POOL_PIN }).setLngLat([p.coords.lng, p.coords.lat]).addTo(map);
      const el = m.getElement();
      el.style.cursor = 'pointer';
      el.dataset.mkLayer = 'pools';
      el.addEventListener('click', (ev) => { ev.stopPropagation(); if (opts.onOpenPool) opts.onOpenPool(p); });
      markersByLayer.pools.push(el);
    }
    // the user's accommodation, if set — a distinct home marker, always visible
    const stay = getMyStay();
    if (stay && stay.coords) placeStayMarker(stay.coords);
  }

  // Build a custom home-pin element (a 🏠 on a white disc) and (re)position it.
  function placeStayMarker(coords) {
    if (!coords) { if (stayMarker) { stayMarker.remove(); stayMarker = null; } return; }
    if (stayMarker) { stayMarker.setLngLat([coords.lng, coords.lat]); return; }
    const el = document.createElement('div');
    el.textContent = '🏠';
    el.title = 'Your accommodation';
    el.style.cssText = 'font-size:18px;width:30px;height:30px;line-height:30px;text-align:center;background:#FFF6E2;border:2px solid #C0431A;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer';
    stayMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([coords.lng, coords.lat]).addTo(map);
  }
  // Inter-city route corridors as colour-coded lines (drawn under the markers).
  function addRoutes() {
    const data = routesGeoJSON();
    if (!data.features.length || map.getSource('mk-routes')) return;
    map.addSource('mk-routes', { type: 'geojson', data });
    map.addLayer({ id: 'mk-routes-casing', type: 'line', source: 'mk-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFBF0', 'line-width': 6, 'line-opacity': 0.6 } });
    // One line layer per mode: line-dasharray is not data-driven, so each transport
    // mode gets its own static dash — a colour-blind-safe cue layered on top of colour.
    for (const m of ROUTE_LEGEND) {
      map.addLayer({ id: 'mk-routes-' + m.key, type: 'line', source: 'mk-routes',
        filter: ['==', ['get', 'mode'], m.key],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 3.4, 'line-dasharray': m.dash } });
    }
  }
  // "Way back" guide line: a direct dashed line from the live GPS dot to the saved
  // accommodation, redrawn as you move. Not turn-by-turn (no offline routing engine),
  // but a reliable heading + a casing so it reads over satellite — fully offline.
  function addWayback() {
    if (map.getSource('mk-wayback')) return;
    map.addSource('mk-wayback', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'mk-wayback-casing', type: 'line', source: 'mk-wayback',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': 7, 'line-opacity': 0.75 } });
    map.addLayer({ id: 'mk-wayback-line', type: 'line', source: 'mk-wayback',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#D6336C', 'line-width': 4, 'line-dasharray': [1.4, 1] } });
  }
  function setWayback(from, to) {
    const src = map.getSource('mk-wayback');
    if (!src) return;
    const empty = { type: 'FeatureCollection', features: [] };
    if (!from || !to) { src.setData(empty); return; }
    src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'LineString', coordinates: [[from.lng, from.lat], [to.lng, to.lat]] } }] });
  }

  // Measure tool: tap points to lay a multi-segment line; the running total distance
  // is reported back to the toolbar. Fully offline (great-circle maths, no service).
  function haversineKmLL(a, b) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  let measuring = false, measurePts = [], measureCb = null;
  function addMeasureLayers() {
    if (map.getSource('mk-measure')) return;
    map.addSource('mk-measure', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'mk-measure-line', type: 'line', source: 'mk-measure',
      layout: { 'line-cap': 'round', 'line-join': 'round' }, filter: ['==', '$type', 'LineString'],
      paint: { 'line-color': '#1E1E1E', 'line-width': 3, 'line-dasharray': [1.5, 1] } });
    map.addLayer({ id: 'mk-measure-pts', type: 'circle', source: 'mk-measure', filter: ['==', '$type', 'Point'],
      paint: { 'circle-radius': 5, 'circle-color': '#FFFFFF', 'circle-stroke-color': '#1E1E1E', 'circle-stroke-width': 2 } });
  }
  function renderMeasure() {
    const src = map.getSource('mk-measure'); if (!src) return;
    const feats = measurePts.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] } }));
    if (measurePts.length >= 2) feats.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: measurePts.map((p) => [p.lng, p.lat]) } });
    src.setData({ type: 'FeatureCollection', features: feats });
    let km = 0;
    for (let i = 1; i < measurePts.length; i++) km += haversineKmLL(measurePts[i - 1], measurePts[i]);
    if (measureCb) measureCb(km, measurePts.length);
  }

  // Offline search index over the curated data + the user's own pins. No geocoder /
  // network: a simple case-insensitive name match across cities, places, pools and pins.
  function searchIndex(q) {
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const out = [];
    for (const name in CITY_COORDS) {
      if (name.toLowerCase().includes(q)) out.push({ name, type: 'City', lng: CITY_COORDS[name][0], lat: CITY_COORDS[name][1], z: 12 });
    }
    for (const p of allPlaces()) {
      if (p.coords && (p.name || '').toLowerCase().includes(q)) out.push({ name: p.name, type: 'Place', id: p.id, lng: p.coords.lng, lat: p.coords.lat, z: 15 });
    }
    for (const p of POOLS) {
      if (p.coords && (p.name || '').toLowerCase().includes(q)) out.push({ name: p.name, type: 'Pool', lng: p.coords.lng, lat: p.coords.lat, z: 15 });
    }
    for (const pin of store.pins) {
      if (pin.coords && (pin.name || '').toLowerCase().includes(q)) out.push({ name: pin.name, type: 'Pin', id: pin.id, lng: pin.coords.lng, lat: pin.coords.lat, z: 15 });
    }
    // exact / prefix matches first, then by name length (shorter = closer match)
    out.sort((a, b) => {
      const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1, bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return ap - bp || a.name.length - b.name.length;
    });
    return out.slice(0, 12);
  }

  // Add on style.load (fires when the inline style parses) so they appear even before
  // — or without — basemap tiles (which need the network on first load).
  map.on('style.load', () => { addRoutes(); addWayback(); addMeasureLayers(); addMarkers(); addCityMarkers(); refreshMarkers(); });
  map.on('zoomend', refreshMarkers);
  try { window.__mkMap = map; } catch { /* dev aid */ }

  // tap empty map to drop a pin — or, in measure mode, to add a measurement point
  map.on('click', (e) => {
    if (measuring) { measurePts.push({ lat: e.lngLat.lat, lng: e.lngLat.lng }); renderMeasure(); return; }
    if (opts.onMapClick) opts.onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  });

  return {
    map,
    flyTo: (lng, lat, z = 11) => map.flyTo({ center: [lng, lat], zoom: z }),
    setLayer: setLayerVisible,
    layers: ['stay', 'eat', 'localeat', 'go', 'market', 'pools', 'crossing'],
    setSatellite: (on) => { if (map.getLayer('satellite')) map.setLayoutProperty('satellite', 'visibility', on ? 'visible' : 'none'); },
    setBorders: (on) => { if (map.getLayer('borders')) map.setLayoutProperty('borders', 'visibility', on ? 'visible' : 'none'); },
    // GPS: reuse the single built-in GeolocateControl (one watcher, one blue dot).
    triggerLocate: () => { try { geo.trigger(); } catch { /* not ready / denied */ } },
    onLocate: (cb) => geo.on('geolocate', (e) => cb({ lat: e.coords.latitude, lng: e.coords.longitude, accuracy: e.coords.accuracy })),
    // My-stay home marker: set/move/clear live, and centre on it.
    setMyStay: (coords) => placeStayMarker(coords),
    goToStay: (coords, z = 15) => { if (coords) map.flyTo({ center: [coords.lng, coords.lat], zoom: z }); },
    // Draw / clear the "way back" guide line from `from` to `to` (pass nulls to clear).
    setWayback: (from, to) => setWayback(from, to),
    // Offline name search across cities, curated places, pools and the user's pins.
    search: (q) => searchIndex(q),
    // Fit the view to both points so the whole way-back line is visible.
    frameBoth: (a, b, pad = 64) => {
      if (!a || !b) return;
      try {
        const bounds = new maplibregl.LngLatBounds([a.lng, a.lat], [a.lng, a.lat]);
        bounds.extend([b.lng, b.lat]);
        map.fitBounds(bounds, { padding: pad, maxZoom: 16, duration: 600 });
      } catch { /* noop */ }
    },
    // Offline area download: the satellite tiles covering the current view.
    getDownloadTiles: (cap = 600) => tileUrlsForBounds(map.getBounds(), map.getZoom(), 2, cap),
    // Snapshot of the current view, recorded with a saved area so it can be sized,
    // re-shown and (tile-by-tile) deleted later.
    getViewInfo: () => {
      const b = map.getBounds(), c = map.getCenter();
      return { center: { lng: c.lng, lat: c.lat }, bounds: { w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() }, zoom: map.getZoom() };
    },
    // Recompute a saved area's tile URLs (same params as the original save) so the
    // service worker can delete exactly that pack.
    tileUrlsForArea: (bounds, z, cap = 1000) =>
      tileUrlsForBounds({ getWest: () => bounds.w, getEast: () => bounds.e, getNorth: () => bounds.n, getSouth: () => bounds.s }, z, 2, cap),
    // Nearest known city to the current centre (for a default saved-area name), or null.
    nearestCityName: () => { const c = map.getCenter(); return nearestCity({ lng: c.lng, lat: c.lat }); },
    // Measure tool: toggle on with a callback (km, pointCount); off clears the line.
    toggleMeasure: (on, cb) => { measuring = on; measureCb = cb || null; if (!on) { measurePts = []; renderMeasure(); } },
    measureReset: () => { measurePts = []; renderMeasure(); },
    // Tear down the map, its WebGL context and the GPS watcher — call when leaving the
    // map screen. Without this, each visit leaks a context and the map dies after ~8-16.
    dispose: () => { try { map.remove(); } catch { /* already gone */ } if (window.__mkMap === map) { try { window.__mkMap = null; } catch { /* noop */ } } },
  };
}

export async function storageEstimate() {
  if (!navigator.storage || !navigator.storage.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usageMB: e.usage ? (e.usage / 1048576) : 0, quotaMB: e.quota ? (e.quota / 1048576) : 0 };
}

export async function clearTileCache() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith('mk-tiles')).map((k) => caches.delete(k)));
}
