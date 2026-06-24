// Fully offline vector map: MapLibre GL JS (vendored) renders a SELF-HOSTED GeoJSON
// basemap of the four countries — no external tiles, so it works with no connection
// from first launch (the old Protomaps demo bucket was retired and returned 404).
// GPS via the geolocate control, curated places + user pins as rating-coloured
// markers, inter-city routes and the Mekong drawn on top, tap-to-drop-a-pin. Street
// detail is intentionally omitted so the whole region ships in ~26 KB and never breaks.

import { store } from './state.js';
import { allPlaces, COUNTRIES } from './data/regions.js';
import { BASEMAP } from './data/basemap.js';

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
export function modeColor(mode) {
  const m = (mode || '').toLowerCase();
  if (m.includes('train')) return '#3B6FE0';
  if (m.includes('flight') || m.includes('fly') || m.includes('air')) return '#6A4C93';
  if (m.includes('ferry') || m.includes('boat')) return '#16A39A';
  if (m.includes('bus') || m.includes('van') || m.includes('minibus') || m.includes('car')) return '#2E8B57';
  return '#E8632A';
}
export const ROUTE_LEGEND = [
  { color: '#3B6FE0', label: 'Train' }, { color: '#6A4C93', label: 'Flight' },
  { color: '#2E8B57', label: 'Bus' }, { color: '#16A39A', label: 'Ferry / boat' },
];
function routesGeoJSON() {
  const feats = [];
  for (const c of COUNTRIES) {
    for (const r of (c.routes || [])) {
      const a = CITY_COORDS[normCity(r.from)], b = CITY_COORDS[normCity(r.to)];
      if (!a || !b) continue;
      const opt = (r.options || []).find((o) => o.recommended) || (r.options || [])[0] || {};
      feats.push({ type: 'Feature', properties: { color: modeColor(opt.mode) }, geometry: { type: 'LineString', coordinates: [a, b] } });
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
    },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': '#9FD3CE' } },
      { id: 'land', source: 'land', type: 'fill', paint: { 'fill-color': '#EFE2C6' } },
      { id: 'land-outline', source: 'land', type: 'line', paint: { 'line-color': '#C9A86A', 'line-width': 1.2 } },
      { id: 'satellite', source: 'satellite', type: 'raster', layout: { visibility: 'visible' } },
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
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  const geo = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserLocation: true,
  });
  map.addControl(geo, 'top-right');

  // markers: curated places coloured by EFFECTIVE rating (your own rating wins),
  // except markets, which use a distinct gold pin. Each marker is tagged with its
  // map layer (stay / eat / go / market) so the layer toggles can show or hide it.
  // User pins stay in grape and always show.
  const markersByLayer = { stay: [], eat: [], go: [], market: [] };
  const MARKET_PIN = '#E0A100';
  function layerForCats(cats) {
    cats = cats || [];
    if (cats.includes('market')) return 'market';
    if (cats.some((c) => ['hotel', 'stay', 'accommodation', 'guesthouse', 'resort', 'hostel'].includes(c))) return 'stay';
    if (cats.some((c) => ['food', 'restaurant'].includes(c))) return 'eat';
    return 'go';
  }
  function setLayerVisible(layer, on) {
    (markersByLayer[layer] || []).forEach((el) => { el.style.display = on ? '' : 'none'; });
  }
  function addMarkers() {
    for (const p of allPlaces()) {
      if (!p.coords) continue;
      const layer = layerForCats(p.categories);
      const color = layer === 'market' ? MARKET_PIN : ratingColor(effectiveRating(p.id, p.rating));
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
  }
  // Inter-city route corridors as colour-coded lines (drawn under the markers).
  function addRoutes() {
    const data = routesGeoJSON();
    if (!data.features.length || map.getSource('mk-routes')) return;
    map.addSource('mk-routes', { type: 'geojson', data });
    map.addLayer({ id: 'mk-routes-casing', type: 'line', source: 'mk-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFBF0', 'line-width': 6, 'line-opacity': 0.6 } });
    map.addLayer({ id: 'mk-routes-line', type: 'line', source: 'mk-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 3.4, 'line-dasharray': [2, 1.2] } });
  }
  // Add on style.load (fires when the inline style parses) so they appear even before
  // — or without — basemap tiles (which need the network on first load).
  map.on('style.load', () => { addRoutes(); addMarkers(); });
  try { window.__mkMap = map; } catch { /* dev aid */ }

  // tap empty map to drop a pin at that point
  map.on('click', (e) => { if (opts.onMapClick) opts.onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng }); });

  return {
    map,
    flyTo: (lng, lat, z = 11) => map.flyTo({ center: [lng, lat], zoom: z }),
    setLayer: setLayerVisible,
    layers: ['stay', 'eat', 'go', 'market'],
    setSatellite: (on) => { if (map.getLayer('satellite')) map.setLayoutProperty('satellite', 'visibility', on ? 'visible' : 'none'); },
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
