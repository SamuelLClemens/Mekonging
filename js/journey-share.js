// Builds a shareable "journey" — ONE self-contained HTML page a traveller hands to family
// and friends: a real map of where they went, their photos, and whatever else they chose to
// include. No server, no account, nothing uploaded.
//
// WHY A FILE AND NOT A LINK. The app's existing share transport packs payloads into the URL
// hash and caps at 8000 characters (js/social.js), so photos can never travel that way; and
// the CSP is a <meta> tag inside index.html, so the app can only reach origins baked in at
// build time — a visitor to the live site cannot point it at a server of their own. A
// self-contained file has neither problem: opened from WhatsApp, AirDrop or email it renders
// as a full page in the recipient's browser, offline, forever.
//
// PRIVACY — READ BEFORE ADDING ANYTHING HERE. Two stores are deliberately unreachable from
// this module and must stay that way: the document vault (js/vault.js, passports and visas)
// and the private calendar (store.personal — cycle, mood, pregnancy). They are not
// default-off checkboxes; there is no code path to them, and this module must never import
// vault.js nor read store.personal. Everything else is opt-in per journey.
//
// Scope is baked into the artifact, not enforced by a login: anyone holding the file sees
// everything inside it. The builder screen says so plainly, and so should any future caller.

import { esc } from './util.js';
import { store, journalEntries } from './state.js';
import { REGION_PATHS, REGION_RIVER, REGION_VIEWBOX, REGION_PROJ } from './data/geo.js';
import { COUNTRIES, getCountry, getPlace } from './data/regions.js';
import { WEATHER_SPOTS } from './weather.js';
import { getBlob } from './idb.js';
import { myVisits } from './visits.js';

// What a journey can contain. Everything defaults ON except spending, which people rarely
// mean to hand to a wider circle even when they are happy to share the trip itself.
export const DEFAULT_INCLUDE = {
  map: true, stops: true, journal: true, photos: true, reviews: true, spending: false,
};

// Photos are re-encoded before they go in. Left at full size a 100-photo journey lands around
// 274 MB once base64 inflates it by a third, which is past what email or a chat app will
// carry; at 1200 px / q0.75 the same journey is 15–20 MB and still looks right on a phone.
const PHOTO_MAX_PX = 1200;
const PHOTO_QUALITY = 0.75;

// ---- projection -------------------------------------------------------------
// Same maths as scripts/build_geo.py and js/screens/weather.js — the country outlines in
// REGION_PATHS are already projected this way, so a point placed with it lands correctly on
// them. Kept local rather than exported from one of those, to leave this module importable
// without dragging a screen in.
function projLL(lng, lat) {
  const P = REGION_PROJ;
  return [P.pad + (lng - P.minlng) * P.kx * P.scale, P.pad + (P.maxlat - lat) * P.scale];
}

// A journal entry's photo keys — multi-photo photoKeys[] if present, else the legacy single
// photoKey. (Mirrors entryPhotoKeys() in main.js; inlined so this module stays free of it.)
function photoKeysOf(e) {
  if (!e) return [];
  if (Array.isArray(e.photoKeys) && e.photoKeys.length) return e.photoKeys.filter(Boolean);
  return e.photoKey ? [e.photoKey] : [];
}

// A trip stop carries a free-text title and no coordinates, so it can only reach the map if
// its title names a city the app knows. Unmatched stops still appear in the written list —
// they are simply absent from the line, which is honest rather than invented.
function stopCoords(stop) {
  const t = String((stop && stop.title) || '').trim().toLowerCase();
  if (!t) return null;
  const hit = WEATHER_SPOTS.find((s) => s.city.toLowerCase() === t)
    || WEATHER_SPOTS.find((s) => t.includes(s.city.toLowerCase()));
  return hit ? { lat: hit.lat, lng: hit.lng } : null;
}

function stopDates(s) {
  if (!s) return '';
  const from = s.date || '';
  const to = (s.endDate && s.endDate >= from) ? s.endDate : '';
  return (from && to && to !== from) ? `${from} → ${to}` : (from || to || '');
}

// ---- the route --------------------------------------------------------------
// Ordered points for the map line. Journal entries lead because they are both dated and
// precisely located; dated stops fill in legs that were never journalled. Visit cells are
// added as loose marks rather than line points — they record "the app was opened here", at
// 55 km resolution and at most once a day, so threading a route through them would draw a
// journey the traveller never actually took.
export function journeyPoints(include = DEFAULT_INCLUDE, journalIds = null) {
  const pts = [];
  if (include.journal !== false) {
    journalEntries().forEach((e) => {
      if (!e.coords || typeof e.coords.lat !== 'number') return;
      if (journalIds && !journalIds.includes(e.id)) return;
      pts.push({ lat: e.coords.lat, lng: e.coords.lng, label: e.place || e.title || '', date: e.date || '', kind: 'journal' });
    });
  }
  if (include.stops !== false) {
    (store.trip.stops || []).forEach((s) => {
      const c = stopCoords(s);
      if (c) pts.push({ lat: c.lat, lng: c.lng, label: s.title || '', date: s.date || '', kind: 'stop' });
    });
  }
  pts.sort((a, b) => (a.date || '') < (b.date || '') ? -1 : (a.date || '') > (b.date || '') ? 1 : 0);
  // Collapse consecutive points at effectively the same spot, so a week of journalling in one
  // town reads as one dot rather than a knot of overlapping circles.
  const out = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.lat - p.lat) < 0.05 && Math.abs(last.lng - p.lng) < 0.05) continue;
    out.push(p);
  }
  return out;
}

function visitMarks() {
  try { return (myVisits() || []).map((c) => ({ lat: c.lat, lng: c.lng })); } catch { return []; }
}

// ---- the map ----------------------------------------------------------------
// Real geography rather than the abstract bounding-box line drawn on #journey: the same
// country outlines and Mekong the app shows everywhere else, with the route on top. The
// viewBox is cropped to the route so a trip inside one country is not lost in a map of four.
export function journeyMapSVG(points, marks = []) {
  const all = points.concat(marks);
  if (!all.length) return '';
  const proj = all.map((p) => projLL(p.lng, p.lat));
  const routePts = points.map((p) => projLL(p.lng, p.lat));

  const xs = proj.map((p) => p[0]), ys = proj.map((p) => p[1]);
  let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  // Pad generously, then grow the smaller axis so the crop keeps a readable portrait-ish
  // shape instead of a letterbox when every point sits on one line.
  const padX = Math.max(70, (maxX - minX) * 0.28), padY = Math.max(70, (maxY - minY) * 0.28);
  minX -= padX; maxX += padX; minY -= padY; maxY += padY;
  let w = maxX - minX, hgt = maxY - minY;
  const targetRatio = 0.82;                       // width ÷ height
  if (w / hgt > targetRatio) { const need = w / targetRatio - hgt; minY -= need / 2; hgt += need; }
  else { const need = hgt * targetRatio - w; minX -= need / 2; w += need; }
  const vb = `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${hgt.toFixed(1)}`;

  // Every mark is sized against the crop, not in absolute units. The viewBox is as wide as
  // the trip demands — four countries or one province — so a fixed radius would render as a
  // blob on a short trip and an invisible speck on a long one.
  const u = w / 100;
  const f = (n) => +n.toFixed(1);

  const land = COUNTRIES.map((c) => (REGION_PATHS[c.id]
    ? `<path d="${REGION_PATHS[c.id]}" fill="#EADFC4" stroke="#D3BE95" stroke-width="${f(u * 0.35)}" fill-rule="evenodd"/>` : '')).join('');
  const river = REGION_RIVER
    ? `<path d="${REGION_RIVER}" fill="none" stroke="#7FA8C4" stroke-width="${f(u * 0.7)}" stroke-linecap="round" opacity="0.75"/>` : '';
  const visited = marks.map((m) => {
    const [x, y] = projLL(m.lng, m.lat);
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(u * 1.3)}" fill="#C0431A" opacity="0.22"/>`;
  }).join('');

  let route = '';
  if (routePts.length > 1) {
    const d = 'M' + routePts.map((c) => `${f(c[0])},${f(c[1])}`).join(' L');
    route = `<path d="${d}" fill="none" stroke="#C0431A" stroke-width="${f(u * 0.8)}" stroke-dasharray="${f(u * 2.8)} ${f(u * 2)}" stroke-linecap="round"/>`;
  }
  const dotR = u * 2.4, numFs = u * 2.7;
  const dots = routePts.map((c, i) => `<g><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(dotR)}" fill="#E8632A" stroke="#FFF6E2" stroke-width="${f(u * 0.6)}"/>`
    + `<text x="${f(c[0])}" y="${f(c[1] + numFs * 0.35)}" font-size="${f(numFs)}" font-weight="700" fill="#FFF6E2" text-anchor="middle" font-family="sans-serif">${i + 1}</text></g>`).join('');

  return `<svg viewBox="${vb}" class="jr-map" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of the journey">
  <rect x="${minX.toFixed(1)}" y="${minY.toFixed(1)}" width="${w.toFixed(1)}" height="${hgt.toFixed(1)}" fill="#CFE3EC"/>
  ${land}${river}${visited}${route}${dots}
</svg>`;
}

// ---- photos -----------------------------------------------------------------
// Resolve to null rather than hang forever. Every await in the build path needs one of these
// or a single stalled encode strands the whole journey with the button stuck on "Building…".
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((res) => setTimeout(() => res(null), ms))]);
}

// Re-encode a stored photo smaller. Any failure returns the original rather than dropping the
// picture: a large journey still beats a journey with holes in it.
//
// OffscreenCanvas is preferred because convertToBlob() encodes off the rendering path and so
// still completes while the tab is in the background. canvas.toBlob() does NOT — a hidden tab
// can throttle it until it never fires, and "tap Build, switch apps to reply to someone" is
// exactly what a traveller does on a phone. The plain-canvas path is kept for older browsers
// and is time-boxed for the same reason.
export async function downscalePhoto(blob, maxPx = PHOTO_MAX_PX, quality = PHOTO_QUALITY) {
  let bmp = null;
  try {
    bmp = await withTimeout(createImageBitmap(blob), 8000);
    if (!bmp) return blob;
    const scale = Math.min(1, maxPx / Math.max(bmp.width, bmp.height));
    if (scale >= 1 && blob.size < 400000) return blob;
    const w = Math.max(1, Math.round(bmp.width * scale)), hh = Math.max(1, Math.round(bmp.height * scale));
    let out = null;
    if (typeof OffscreenCanvas === 'function') {
      const oc = new OffscreenCanvas(w, hh);
      oc.getContext('2d').drawImage(bmp, 0, 0, w, hh);
      out = await withTimeout(oc.convertToBlob({ type: 'image/jpeg', quality }), 8000);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = hh;
      canvas.getContext('2d').drawImage(bmp, 0, 0, w, hh);
      out = await withTimeout(new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality)), 8000);
    }
    return (out && out.size < blob.size) ? out : blob;
  } catch { return blob; }
  finally { if (bmp && bmp.close) { try { bmp.close(); } catch { /* already released */ } } }
}

function blobToDataURL(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

async function photoDataURLs(keys, onProgress) {
  const out = [];
  for (const k of keys) {
    try {
      const b = await withTimeout(getBlob(k), 8000);
      if (!b) continue;
      const url = await withTimeout(blobToDataURL(await downscalePhoto(b)), 10000);
      if (url) out.push(url);
      if (onProgress) onProgress();
    } catch { /* a missing or unreadable photo is skipped, never fatal */ }
  }
  return out;
}

// How many photos a scope will process — the builder screen uses this to show real progress
// rather than an indeterminate spinner on what can be a minute of work.
export function photoCount(include = DEFAULT_INCLUDE, journalIds = null) {
  if (!include.photos) return 0;
  let n = 0;
  journalEntries().forEach((e) => {
    if (include.journal === false) return;
    if (journalIds && !journalIds.includes(e.id)) return;
    n += photoKeysOf(e).length;
  });
  if (include.reviews) {
    Object.values(store.placeData || {}).forEach((d) => { n += ((d && d.photos) || []).length; });
  }
  n += ((store.album && store.album.photos) || []).length;
  return n;
}

// ---- the page ---------------------------------------------------------------
function page(title, subtitle, bodyHtml) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
 *{box-sizing:border-box}
 body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:780px;margin:0 auto;
      padding:20px 18px 40px;color:#20143a;background:#faf7f0;line-height:1.55}
 h1{font-size:1.9rem;margin:0 0 4px;line-height:1.2}
 .sub{color:#7a7264;margin:0 0 22px}
 h2{font-size:1.15rem;margin:0 0 6px}
 /* max-height keeps a tall crop (a long north-south trip) from filling a laptop screen and
    pushing the journal below the fold; the aspect ratio is preserved either way. */
 .jr-map{width:100%;max-height:78vh;height:auto;display:block;margin:0 auto 8px;
         border-radius:14px;border:1px solid #e3dccb;background:#CFE3EC}
 .cap{color:#7a7264;font-size:.85rem;text-align:center;margin:0 0 24px}
 section{margin:0 0 28px}
 .sec-h{font-size:1.35rem;margin:32px 0 10px;padding-bottom:6px;border-bottom:2px solid #E8632A}
 article{border:1px solid #e3dccb;border-radius:12px;padding:14px 16px;margin:0 0 14px;background:#fff}
 .meta{color:#7a7264;font-size:.85rem;margin:0 0 8px}
 .stars{color:#E0A21A;font-size:1.05rem;margin:2px 0}
 .note{color:#4a7a5a}
 img{max-width:100%;border-radius:8px;margin:8px 0 0;display:block}
 .shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-top:10px}
 .shots img{margin:0;height:100%;object-fit:cover;aspect-ratio:1/1}
 ol.stops{margin:0;padding-left:22px}
 ol.stops li{margin:0 0 6px}
 table{border-collapse:collapse;width:100%;margin:8px 0;font-size:.92rem}
 th,td{border:1px solid #e3dccb;padding:6px 9px;text-align:left}
 th{background:#f3ede0}
 tr.total td{font-weight:800;background:#faf3e6}
 .scroll{overflow-x:auto}
 footer{color:#9a927f;font-size:.8rem;margin-top:36px;text-align:center;border-top:1px solid #e3dccb;padding-top:14px}
 @media (prefers-color-scheme: dark){
   body{background:#171320;color:#ece6dc}
   article{background:#211b2c;border-color:#3a3145}
   th{background:#2a2335}th,td{border-color:#3a3145}
   tr.total td{background:#2a2335}
   .sub,.meta,.cap,footer{color:#a89e93}
   .jr-map{border-color:#3a3145}
 }
</style></head><body>
<h1>${esc(title)}</h1>
<p class="sub">${esc(subtitle)}</p>
${bodyHtml}
<footer>Made with Mekonging · this page holds everything it needs, so it works offline and never phones home.</footer>
</body></html>`;
}

function esand(list) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

// Build the whole page. `journey` is { name, include, journalIds }. onProgress fires once per
// photo embedded, so a caller can show real progress.
export async function buildJourneyHtml(journey, onProgress) {
  const include = Object.assign({}, DEFAULT_INCLUDE, (journey && journey.include) || {});
  const journalIds = (journey && journey.journalIds) || null;
  const who = (store.profile.name || '').trim();
  const title = (journey && journey.name && journey.name.trim())
    || (who ? `${who}’s journey` : 'My journey');
  const parts = [];

  const entries = journalEntries().filter((e) => !journalIds || journalIds.includes(e.id));
  const pts = journeyPoints(include, journalIds);

  // Subtitle: the countries and the span of dates, worked out from whatever is included.
  const ccs = new Set();
  (store.trip.stops || []).forEach((s) => { if (s.country) ccs.add(s.country); });
  try { (myVisits() || []).forEach((c) => { if (c.cc) ccs.add(c.cc); }); } catch { /* visit cells are optional */ }
  const names = [...ccs].map((c) => (getCountry(c) || {}).name).filter(Boolean);
  const dates = [];
  (store.trip.stops || []).forEach((s) => { if (s.date) dates.push(s.date); if (s.endDate) dates.push(s.endDate); });
  entries.forEach((e) => { if (e.date) dates.push(e.date); });
  dates.sort();
  const span = dates.length
    ? (dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} – ${dates[dates.length - 1]}`) : '';
  const subtitle = [names.length ? esand(names) : '', span].filter(Boolean).join(' · ') || 'A journey';

  // Map
  if (include.map && pts.length) {
    parts.push(`<section>${journeyMapSVG(pts, visitMarks())}
<p class="cap">${pts.length} place${pts.length === 1 ? '' : 's'} along the way${pts.length > 1 ? ', in order' : ''}</p></section>`);
  }

  // Stops
  if (include.stops && (store.trip.stops || []).length) {
    const items = store.trip.stops.map((s) => {
      const bits = [esc(s.title || 'Stop')];
      const cn = s.country ? (getCountry(s.country) || {}).name : '';
      if (cn) bits.push(esc(cn));
      const d = stopDates(s);
      if (d) bits.push(esc(d));
      return `<li>${bits.join(' · ')}</li>`;
    }).join('');
    parts.push(`<h2 class="sec-h">Where I went</h2><section><article><ol class="stops">${items}</ol></article></section>`);
  }

  // Journal (each entry with its own photos, if photos are included)
  if (include.journal && entries.length) {
    parts.push('<h2 class="sec-h">Journal</h2><section>');
    for (const e of entries) {
      const imgs = include.photos ? await photoDataURLs(photoKeysOf(e), onProgress) : [];
      const meta = [e.date || '', e.place || '', e.weather || ''].filter(Boolean).map(esc).join(' · ');
      parts.push(`<article><h2>${esc(e.title || 'Untitled')}</h2>
${meta ? `<p class="meta">${meta}</p>` : ''}
${e.text ? `<p>${esc(e.text).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.length ? `<div class="shots">${imgs.map((u) => `<img src="${u}" alt="" loading="lazy">`).join('')}</div>` : ''}</article>`);
    }
    parts.push('</section>');
  }

  // Ratings and reviews
  if (include.reviews) {
    const ids = Object.keys(store.placeData || {}).filter((id) => {
      const d = store.placeData[id];
      return d && (d.rating || d.review || (include.photos && (d.photos || []).length));
    });
    if (ids.length) {
      parts.push('<h2 class="sec-h">Places I rated</h2><section>');
      for (const id of ids) {
        const d = store.placeData[id];
        const pl = getPlace(id);
        const imgs = include.photos ? await photoDataURLs(d.photos || [], onProgress) : [];
        // Never fall back to the raw id: a recipient should not be shown 'vi-hn-buncha'
        // because a place was renamed or retired out of the bundled data since it was rated.
        parts.push(`<article><h2>${esc(pl ? pl.name : 'A place I rated')}</h2>
${d.rating ? `<p class="stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p>` : ''}
${d.review ? `<p>${esc(d.review).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.length ? `<div class="shots">${imgs.map((u) => `<img src="${u}" alt="" loading="lazy">`).join('')}</div>` : ''}</article>`);
      }
      parts.push('</section>');
    }
  }

  // The standalone album, when photos are in scope
  if (include.photos) {
    const album = (store.album && store.album.photos) || [];
    if (album.length) {
      const imgs = await photoDataURLs(album.map((p) => p.key).filter(Boolean), onProgress);
      if (imgs.length) {
        parts.push(`<h2 class="sec-h">Photos</h2><section><div class="shots">${imgs.map((u) => `<img src="${u}" alt="" loading="lazy">`).join('')}</div></section>`);
      }
    }
  }

  // Spending — off by default; only ever appears because someone ticked it for this journey.
  if (include.spending && (store.trip.budgetLog || []).length) {
    const log = store.trip.budgetLog.slice().sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);
    const rows = log.map((b) => `<tr><td>${esc(b.date || '')}</td><td>${esc(String(parseFloat(b.amount) || 0))}</td><td>${esc(b.currency || '')}</td><td>${esc(b.note || '')}</td></tr>`).join('');
    parts.push(`<h2 class="sec-h">Spending</h2><section><div class="scroll"><table>
<thead><tr><th>Date</th><th>Amount</th><th>Currency</th><th>On what</th></tr></thead>
<tbody>${rows}</tbody></table></div></section>`);
  }

  if (!parts.length) {
    parts.push('<section><article><p>This journey is empty so far. Add a journal entry, a trip stop or a photo and build it again.</p></article></section>');
  }
  return page(title, subtitle, parts.join('\n'));
}
