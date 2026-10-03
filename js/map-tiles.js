// Offline map tiles: the raster sources, and the one function that turns an area into the list
// of tile URLs to save. Shared by the map (js/map.js), the saved-areas card and the "Before you
// lose signal" card (js/offline-ready.js), because a saved area is deleted by recomputing the
// list it was saved with; two copies of this would leave tiles behind.
// Kept out of js/map.js so sizing an area does not load the map and its data.

export const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const STREET_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

// Size of one tile URL, for estimates. Measured 2026-10-03 at z13-15, both styles: towns run
// about 11 KB (Don Det, Stung Treng and Kratie saved whole: 10.1-11.4 KB; Luang Prabang sample
// 10.9 KB), central Bangkok about 31 KB. 18 KB is wrong by the same factor either way (~1.7x).
export const TILE_BYTES = 18000;

// Build the list of tile URLs covering `bounds` from the current zoom down a few levels
// (capped) so the service worker can pre-cache the area for offline use.
//
// Bug fix: this used to hard-code SATELLITE_TILES only, so a traveller who downloaded an
// area while viewing in street mode had zero usable offline raster imagery for that view once
// offline — silently, since the vector basemap still shows through as a fallback and nothing
// says imagery is missing. Now emits one URL per requested style for every tile coordinate.
// `cap` bounds tile COORDINATES, not raw URLs, so a saved area's geographic footprint does not
// silently shrink when a second style is added — the honest trade-off is ~2x storage per area,
// not a smaller area.
export function tileUrlsForBounds(bounds, z0, extraZoom = 2, cap = 600, styles = [SATELLITE_TILES, STREET_TILES]) {
  const lon2tile = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
  const lat2tile = (lat, z) => {
    const r = lat * Math.PI / 180;
    return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z);
  };
  const clampTile = (t, z) => Math.max(0, Math.min(2 ** z - 1, t));
  const urls = [];
  let coordCount = 0;
  const zStart = Math.max(1, Math.floor(z0));
  const zEnd = Math.min(zStart + extraZoom, 17);
  for (let z = zStart; z <= zEnd; z++) {
    const x0 = clampTile(lon2tile(bounds.getWest(), z), z), x1 = clampTile(lon2tile(bounds.getEast(), z), z);
    const y0 = clampTile(lat2tile(bounds.getNorth(), z), z), y1 = clampTile(lat2tile(bounds.getSouth(), z), z);
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
        for (const tpl of styles) urls.push(tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y));
        coordCount++;
        if (coordCount >= cap) return urls;
      }
    }
  }
  return urls;
}

// A saved area's tiles from its stored record ({ w, s, e, n } and z), with the cap every saved
// area uses, so a save and its later delete name the same tiles.
export function tileUrlsForArea(b, z, cap = 1000) {
  return tileUrlsForBounds({ getWest: () => b.w, getEast: () => b.e, getNorth: () => b.n, getSouth: () => b.s }, z, 2, cap);
}
