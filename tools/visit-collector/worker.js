// A visitor-pin collector for Mekonging's "Where people are" map.
//
// READ THIS FIRST. Mekonging ships with NO collector and no default endpoint, deliberately:
// a static travel app that quietly gathers its users' locations is exactly what the project
// declines to be. This file exists so that someone who WANTS the shared map can run it
// themselves, own the data, and paste their own URL into the app's Settings. Nothing here is
// deployed by the project, and the app works fully without it.
//
// WHAT IT STORES, AND WHAT IT CANNOT. One record per 0.5-degree grid cell — about 55 km — with
// a count and an ISO country code. That is all the app sends and all this accepts. A 55 km cell
// cannot identify a house, a hotel or a street, which is the whole point of the rounding. There
// is no identifier of any kind: no IP address, no user agent, no cookie, no timestamp finer
// than a day, nothing that could link two visits to one person or one device. A cell's count is
// the only thing that grows, so the store cannot be turned into a history of anybody's travel.
//
// DEPLOY (about five minutes, free tier is ample):
//   1. npm install -g wrangler && wrangler login
//   2. wrangler kv namespace create VISITS
//   3. put the returned id into wrangler.toml next to this file
//   4. wrangler deploy
//   5. paste the resulting https://<name>.<subdomain>.workers.dev/visits URL into the app:
//      Settings -> Where people are -> Shared pin feed URL
//   6. add that origin to index.html's Content-Security-Policy connect-src, or the browser
//      will block the request and the map will simply show your own pins.
//
// GET  /visits -> { points: [ { lat, lng, n, cc } ] }
// POST /visits    body { lat, lng, cc } -> increments that cell. Rejects anything else.

const GRID = 0.5;
const MAX_CELLS = 20000;     // a runaway guard, not a product limit
const CORS = {
  'Access-Control-Allow-Origin': '*',            // the response is public aggregate data
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function snap(lat, lng) {
  const la = Math.round(lat / GRID) * GRID;
  const ln = Math.round(lng / GRID) * GRID;
  const nlng = ((ln + 180) % 360 + 360) % 360 - 180;
  return { lat: la + 0, lng: nlng + 0, key: `${(la + 0).toFixed(1)},${(nlng + 0).toFixed(1)}` };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (!url.pathname.endsWith('/visits')) return json({ error: 'not found' }, 404);

    if (request.method === 'GET') {
      // KV list + get per key is fine at this scale; a single aggregate blob would be faster
      // but makes concurrent increments lossy, and losing a pin matters more than 50 ms here.
      const out = [];
      let cursor;
      do {
        const page = await env.VISITS.list({ prefix: 'c:', cursor, limit: 1000 });
        for (const k of page.keys) {
          const v = await env.VISITS.get(k.name, 'json');
          if (v && Number.isFinite(v.lat) && Number.isFinite(v.lng)) out.push(v);
        }
        cursor = page.list_complete ? null : page.cursor;
      } while (cursor && out.length < MAX_CELLS);
      return json({ points: out });
    }

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
      const lat = Number(body && body.lat);
      const lng = Number(body && body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ error: 'lat/lng required' }, 400);
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return json({ error: 'out of range' }, 400);
      // Only ever these three fields are read. Anything else in the body is ignored, so a
      // future client that sends more cannot accidentally have it stored.
      const cc = typeof body.cc === 'string' ? body.cc.slice(0, 4).replace(/[^A-Za-z-]/g, '') : '';
      const cell = snap(lat, lng);
      const k = 'c:' + cell.key;
      const prev = await env.VISITS.get(k, 'json');
      if (!prev) {
        const { keys } = await env.VISITS.list({ prefix: 'c:', limit: MAX_CELLS });
        if (keys.length >= MAX_CELLS) return json({ ok: true, capped: true });
      }
      await env.VISITS.put(k, JSON.stringify({
        lat: cell.lat, lng: cell.lng, n: ((prev && prev.n) || 0) + 1, cc: cc || (prev && prev.cc) || '',
      }));
      return json({ ok: true });
    }

    return json({ error: 'method not allowed' }, 405);
  },
};
