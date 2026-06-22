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
import { allPlaces } from './data/regions.js';

const DEFAULT_TILES = 'https://demo-bucket.protomaps.com/v4.pmtiles';
function tilesUrl() { return (store.profile && store.profile.mapTilesUrl) || DEFAULT_TILES; }

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

  // markers: curated places (teal) + user pins (orange)
  function addMarkers() {
    for (const p of allPlaces()) {
      if (!p.coords) continue;
      const m = new maplibregl.Marker({ color: '#16A39A' }).setLngLat([p.coords.lng, p.coords.lat]).addTo(map);
      m.getElement().style.cursor = 'pointer';
      m.getElement().addEventListener('click', (ev) => { ev.stopPropagation(); if (opts.onOpen) opts.onOpen(p.id); });
    }
    for (const pin of store.pins) {
      if (!pin.coords) continue;
      const m = new maplibregl.Marker({ color: '#E8632A' }).setLngLat([pin.coords.lng, pin.coords.lat]).addTo(map);
      m.getElement().style.cursor = 'pointer';
      m.getElement().addEventListener('click', (ev) => { ev.stopPropagation(); if (opts.onOpen) opts.onOpen(pin.id); });
    }
  }
  // Add markers on style.load (fires when the inline style parses) so they appear
  // even before — or without — basemap tiles (which need the network on first load).
  map.on('style.load', addMarkers);
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
