// Offline-capable vector map: MapLibre GL JS + PMTiles, lazy-loaded. Geometry-first
// basemap (no glyph/sprite dependency). Curated places + user pins as markers, GPS
// via the geolocate control, tap-to-drop-a-pin. Offline works through the service
// worker, which caches the tile source's byte-range responses (see sw.js): once an
// area is downloaded or viewed, it renders with no connection.
//
// The libraries are vendored under lib/ so the strict CSP (script-src 'self') holds.
// The tile source is the Protomaps planet PMTiles (range requests). It is the one
// external origin, allowlisted in connect-src, and degrades gracefully offline.

import { store } from './state.js';
import { allPlaces, COUNTRIES } from './data/regions.js';

const DEFAULT_TILES = 'https://demo-bucket.protomaps.com/v4.pmtiles';
function tilesUrl() { return (store.profile && store.profile.mapTilesUrl) || DEFAULT_TILES; }

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
  // pmtiles first (smaller), then maplibre; both are classic UMD globals.
  libsPromise = loadScript('lib/pmtiles.js').then(() => loadScript('lib/maplibre-gl.js'));
  return libsPromise;
}

// Warm, geometry-first style over the Protomaps v4 schema. No text layers, so no
// glyphs are fetched. Missing source-layers simply do not draw.
function basemapStyle(url) {
  // No "glyphs" key: this style has no text layers, so MapLibre needs no glyphs.
  // (Including glyphs:undefined fails style validation, so it must be omitted.)
  return {
    version: 8,
    sources: { pm: { type: 'vector', url: 'pmtiles://' + url, attribution: '© OpenStreetMap · Protomaps' } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#F3E7CE' } },
      { id: 'earth', source: 'pm', 'source-layer': 'earth', type: 'fill', paint: { 'fill-color': '#EFE2C6' } },
      { id: 'landuse', source: 'pm', 'source-layer': 'landuse', type: 'fill',
        paint: { 'fill-color': '#CBD49A', 'fill-opacity': 0.5 } },
      { id: 'natural', source: 'pm', 'source-layer': 'natural', type: 'fill',
        paint: { 'fill-color': '#C2CF94', 'fill-opacity': 0.4 } },
      { id: 'water', source: 'pm', 'source-layer': 'water', type: 'fill', paint: { 'fill-color': '#8FC9C4' } },
      { id: 'roads-casing', source: 'pm', 'source-layer': 'roads', type: 'line',
        paint: { 'line-color': '#E8A85B',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 5, 18, 14] } },
      { id: 'roads', source: 'pm', 'source-layer': 'roads', type: 'line',
        paint: { 'line-color': '#FFFBF0',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.2, 14, 3, 18, 10] } },
      { id: 'buildings', source: 'pm', 'source-layer': 'buildings', type: 'fill',
        minzoom: 14, paint: { 'fill-color': '#E2CDA0', 'fill-opacity': 0.7 } },
      { id: 'boundaries', source: 'pm', 'source-layer': 'boundaries', type: 'line',
        paint: { 'line-color': '#B58AA0', 'line-dasharray': [2, 2], 'line-width': 1 } },
    ],
  };
}

// slippy-tile math for area download
function lon2x(lon, z) { return Math.floor((lon + 180) / 360 * Math.pow(2, z)); }
function lat2y(lat, z) {
  const r = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
}

// Initialise the map into containerEl. Returns a controller with helpers for the
// toolbar. Rejects if the libraries cannot load (caller shows a fallback).
export async function initMap(containerEl, opts = {}) {
  await loadLibs();
  const maplibregl = window.maplibregl;
  const pmtiles = window.pmtiles;
  if (!maplibregl || !pmtiles) throw new Error('map libraries unavailable');

  const url = tilesUrl();
  const protocol = new pmtiles.Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);

  const start = opts.center || { lng: 100.5018, lat: 13.7563 }; // Bangkok
  const map = new maplibregl.Map({
    container: containerEl,
    style: basemapStyle(url),
    center: [start.lng, start.lat],
    zoom: opts.zoom || 11,
    attributionControl: true,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  const geo = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserLocation: true,
  });
  map.addControl(geo, 'top-right');

  // markers: curated places coloured by EFFECTIVE rating (your own rating wins);
  // user pins in grape so they stand apart.
  function addMarkers() {
    for (const p of allPlaces()) {
      if (!p.coords) continue;
      const m = new maplibregl.Marker({ color: ratingColor(effectiveRating(p.id, p.rating)) }).setLngLat([p.coords.lng, p.coords.lat]).addTo(map);
      m.getElement().style.cursor = 'pointer';
      m.getElement().addEventListener('click', (ev) => { ev.stopPropagation(); if (opts.onOpen) opts.onOpen(p.id); });
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

  // download the visible area for offline use: warm the tile byte-ranges (the SW
  // caches them). Caps the tile count to keep it sane on the planet source.
  async function downloadVisibleArea(onProgress) {
    const p = new pmtiles.PMTiles(url);
    const b = map.getBounds();
    const z0 = Math.max(8, Math.floor(map.getZoom()));
    const zMax = Math.min(14, z0 + 2);
    const jobs = [];
    for (let z = z0; z <= zMax; z++) {
      const xMin = lon2x(b.getWest(), z), xMax = lon2x(b.getEast(), z);
      const yMin = lat2y(b.getNorth(), z), yMax = lat2y(b.getSouth(), z);
      for (let x = xMin; x <= xMax; x++) for (let y = yMin; y <= yMax; y++) jobs.push([z, x, y]);
    }
    const capped = jobs.slice(0, 2000);
    let done = 0;
    for (const [z, x, y] of capped) {
      try { await p.getZxy(z, x, y); } catch { /* tile may not exist; ignore */ }
      done++; if (onProgress && done % 25 === 0) onProgress(done, capped.length);
    }
    if (onProgress) onProgress(capped.length, capped.length);
    return { tiles: capped.length, capped: jobs.length > capped.length };
  }

  return {
    map,
    flyTo: (lng, lat, z = 14) => map.flyTo({ center: [lng, lat], zoom: z }),
    downloadVisibleArea,
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
