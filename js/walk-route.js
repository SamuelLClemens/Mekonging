// Offline walking directions. A* over a pedestrian graph extracted from OpenStreetMap by
// scripts/build_walk_graph.py, with no network access at route time.
//
// Deliberately not Valhalla: that engine's WebAssembly build is 10.0 MB before any map data,
// and its graph tiles need a Docker build host to generate. For walking inside one city core
// a plain graph plus A* is small, instant, and works entirely offline.

import { WALK_INDEX } from './data/walk-index.js';

export const WALK_AREAS = WALK_INDEX;

// Average city walking pace including crossings and waiting. Deliberately not the 1.4 m/s
// used for open ground - a quoted arrival time that ignores traffic lights reads as precise
// and is wrong.
const WALK_SPEED_MS = 1.15;

const LOADERS = {
  bangkok: () => import('./data/walk.bangkok.js'),
};

const cache = new Map();

function undelta(list) {
  const out = new Int32Array(list.length);
  let acc = 0;
  for (let i = 0; i < list.length; i++) {
    acc += list[i];
    out[i] = acc;
  }
  return out;
}

export function areaFor(lat, lng) {
  for (const a of WALK_INDEX) {
    const [s, w, n, e] = a.bbox;
    if (lat >= s && lat <= n && lng >= w && lng <= e) return a;
  }
  return null;
}

export async function loadArea(key) {
  if (cache.has(key)) return cache.get(key);
  const loader = LOADERS[key];
  if (!loader) return null;

  const p = loader().then((mod) => {
    const vlat = undelta(mod.WALK_VLAT);
    const vlon = undelta(mod.WALK_VLON);
    const glat = undelta(mod.WALK_GLAT);
    const glon = undelta(mod.WALK_GLON);
    const flat = mod.WALK_EDGES;

    const n = vlat.length;
    const head = new Int32Array(n).fill(-1);
    const count = flat.length / 7;
    // Adjacency as a linked list in typed arrays: two directed entries per undirected edge.
    const next = new Int32Array(count * 2).fill(-1);
    const to = new Int32Array(count * 2);
    const eid = new Int32Array(count * 2);

    let slot = 0;
    for (let i = 0; i < count; i++) {
      const a = flat[i * 7];
      const b = flat[i * 7 + 1];
      to[slot] = b; eid[slot] = i; next[slot] = head[a]; head[a] = slot; slot++;
      to[slot] = a; eid[slot] = i; next[slot] = head[b]; head[b] = slot; slot++;
    }

    return {
      key, area: mod.WALK_AREA, names: mod.WALK_NAMES,
      vlat, vlon, glat, glon, edges: flat,
      head, next, to, eid, vertexCount: n,
    };
  });

  cache.set(key, p);
  return p;
}

function metres(aLat, aLon, bLat, bLon) {
  const R = 6371000;
  const p1 = aLat * Math.PI / 180;
  const p2 = bLat * Math.PI / 180;
  const dp = (bLat - aLat) * Math.PI / 180;
  const dl = (bLon - aLon) * Math.PI / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearestVertex(g, lat, lng) {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < g.vertexCount; i++) {
    const d = metres(lat, lng, g.vlat[i] / 1e5, g.vlon[i] / 1e5);
    if (d < bestD) { bestD = d; best = i; }
  }
  return { index: best, distance: bestD };
}

// Binary heap keyed on f-score. Small enough that a pairing heap would be overkill.
function makeHeap() {
  const keys = [];
  const vals = [];
  return {
    size: () => vals.length,
    push(k, v) {
      keys.push(k); vals.push(v);
      let i = vals.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (keys[p] <= keys[i]) break;
        [keys[p], keys[i]] = [keys[i], keys[p]];
        [vals[p], vals[i]] = [vals[i], vals[p]];
        i = p;
      }
    },
    pop() {
      const top = vals[0];
      const lastK = keys.pop();
      const lastV = vals.pop();
      if (vals.length) {
        keys[0] = lastK; vals[0] = lastV;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1;
          const r = l + 1;
          let m = i;
          if (l < vals.length && keys[l] < keys[m]) m = l;
          if (r < vals.length && keys[r] < keys[m]) m = r;
          if (m === i) break;
          [keys[m], keys[i]] = [keys[i], keys[m]];
          [vals[m], vals[i]] = [vals[i], vals[m]];
          i = m;
        }
      }
      return top;
    },
  };
}

function search(g, start, goal) {
  const n = g.vertexCount;
  const dist = new Float64Array(n).fill(Infinity);
  const prevV = new Int32Array(n).fill(-1);
  const prevE = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);

  const gLat = g.vlat[goal] / 1e5;
  const gLon = g.vlon[goal] / 1e5;
  const heap = makeHeap();

  dist[start] = 0;
  heap.push(metres(g.vlat[start] / 1e5, g.vlon[start] / 1e5, gLat, gLon), start);

  while (heap.size()) {
    const u = heap.pop();
    if (done[u]) continue;
    done[u] = 1;
    if (u === goal) break;

    for (let s = g.head[u]; s !== -1; s = g.next[s]) {
      const v = g.to[s];
      if (done[v]) continue;
      const i = g.eid[s];
      const w = g.edges[i * 7 + 2];
      const nd = dist[u] + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        prevV[v] = u;
        prevE[v] = i;
        heap.push(nd + metres(g.vlat[v] / 1e5, g.vlon[v] / 1e5, gLat, gLon), v);
      }
    }
  }

  if (!isFinite(dist[goal])) return null;

  const seq = [];
  for (let cur = goal; cur !== start; cur = prevV[cur]) {
    seq.push({ vertex: cur, from: prevV[cur], edge: prevE[cur] });
  }
  seq.reverse();
  return { metres: dist[goal], seq };
}

function edgeCoords(g, edgeIndex, fromVertex) {
  const base = edgeIndex * 7;
  const a = g.edges[base];
  const b = g.edges[base + 1];
  const off = g.edges[base + 5];
  const len = g.edges[base + 6];

  const mid = [];
  for (let i = off; i < off + len; i++) mid.push([g.glat[i] / 1e5, g.glon[i] / 1e5]);

  const startV = fromVertex === a ? a : b;
  const endV = startV === a ? b : a;
  const pts = [[g.vlat[startV] / 1e5, g.vlon[startV] / 1e5]];
  if (startV === a) pts.push(...mid);
  else pts.push(...mid.reverse());
  pts.push([g.vlat[endV] / 1e5, g.vlon[endV] / 1e5]);
  return pts;
}

function bearing(a, b) {
  const p1 = a[0] * Math.PI / 180;
  const p2 = b[0] * Math.PI / 180;
  const dl = (b[1] - a[1]) * Math.PI / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function turnWord(delta) {
  const d = ((delta + 540) % 360) - 180;
  if (Math.abs(d) < 20) return 'Continue';
  if (Math.abs(d) > 150) return 'Turn around';
  if (d > 0) return Math.abs(d) < 55 ? 'Bear right' : 'Turn right';
  return Math.abs(d) < 55 ? 'Bear left' : 'Turn left';
}

export async function routeWalk(from, to) {
  const area = areaFor(from.lat, from.lng);
  if (!area) return { ok: false, reason: 'no-coverage' };
  if (!areaFor(to.lat, to.lng)) return { ok: false, reason: 'destination-outside' };

  const g = await loadArea(area.key);
  if (!g) return { ok: false, reason: 'no-coverage' };

  const a = nearestVertex(g, from.lat, from.lng);
  const b = nearestVertex(g, to.lat, to.lng);
  const found = search(g, a.index, b.index);
  if (!found) return { ok: false, reason: 'no-path' };

  const coords = [];
  const legs = [];
  for (const step of found.seq) {
    const pts = edgeCoords(g, step.edge, step.from);
    if (coords.length) pts.shift();
    coords.push(...pts);
    legs.push({
      name: g.edges[step.edge * 7 + 3] >= 0 ? g.names[g.edges[step.edge * 7 + 3]] : '',
      metres: g.edges[step.edge * 7 + 2],
      steps: g.edges[step.edge * 7 + 4] === 1,
      start: pts[0] || coords[coords.length - 1],
      end: pts[pts.length - 1],
    });
  }

  // Merge consecutive legs that share a name so directions read as streets, not segments.
  const grouped = [];
  for (const leg of legs) {
    const last = grouped[grouped.length - 1];
    if (last && last.name === leg.name && last.steps === leg.steps) {
      last.metres += leg.metres;
      last.end = leg.end;
    } else {
      grouped.push({ ...leg });
    }
  }

  const instructions = [];
  let prevBearing = null;
  for (let i = 0; i < grouped.length; i++) {
    const leg = grouped[i];
    const br = bearing(leg.start, leg.end);
    let verb;
    if (i === 0) verb = 'Head off';
    else verb = turnWord(br - prevBearing);
    prevBearing = br;

    let text;
    if (leg.steps) {
      text = verb === 'Head off' ? 'Take the stairs' : `${verb} onto the stairs`;
    } else if (leg.name) {
      const join = verb === 'Continue' ? ' on' : i === 0 ? ' along' : ' onto';
      text = `${verb}${join} ${leg.name}`;
    } else if (i === 0) {
      text = 'Head off along the path';
    } else if (verb === 'Continue') {
      text = 'Continue along the path';
    } else {
      // Most footways carry no name in OSM. Say the turn and stop, rather than padding it
      // with "onto the path" - the traveller can see the path; inventing a name would be worse.
      text = verb;
    }

    instructions.push({ text, metres: Math.round(leg.metres) });
  }
  instructions.push({ text: 'Arrive', metres: 0 });

  return {
    ok: true,
    areaLabel: area.label,
    metres: Math.round(found.metres),
    seconds: Math.round(found.metres / WALK_SPEED_MS),
    // How far the traveller must walk to reach the mapped network at each end. Surfaced
    // rather than hidden: a 200 m snap means the route genuinely does not start at the door.
    snapStart: Math.round(a.distance),
    snapEnd: Math.round(b.distance),
    coords,
    instructions,
  };
}
