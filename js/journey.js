// Offline multi-hop journey planner.
//
// The app already bundles a rich graph of intercity + cross-border transport legs
// (routes.{th,vi,kh,la}.js). Each leg is written one direction (from -> to) but travel
// runs both ways, so we treat the graph as undirected. Given a start and destination this
// chains legs into a whole itinerary — e.g. Chiang Mai -> Bangkok -> Vientiane -> Luang
// Prabang — flagging each border with its visa/scam note. Pure client-side, fully offline,
// no new data.

import { COUNTRIES } from './data/regions.js';

function norm(s) { return (s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

// Lazily build an undirected adjacency map: node -> [{ to, edge, reversed }].
let _graph = null;
const _display = new Map();   // normalised name -> nicest display spelling
function graph() {
  if (_graph) return _graph;
  _graph = new Map();
  for (const c of COUNTRIES) {
    for (const r of (c.routes || [])) {
      if (!r.from || !r.to || !Array.isArray(r.options) || !r.options.length) continue;
      const a = norm(r.from), b = norm(r.to);
      if (a === b) continue;
      _display.set(a, r.from); _display.set(b, r.to);
      if (!_graph.has(a)) _graph.set(a, []);
      if (!_graph.has(b)) _graph.set(b, []);
      _graph.get(a).push({ to: b, edge: r, reversed: false });
      _graph.get(b).push({ to: a, edge: r, reversed: true });
    }
  }
  return _graph;
}

// Every city that appears in the route graph, nicest spelling, alphabetical.
export function routeNodes() {
  graph();
  return [..._display.values()].sort((x, y) => x.localeCompare(y));
}

export function isRouteNode(name) { return graph().has(norm(name)); }

function chosenOption(edge) { return edge.options.find((o) => o.recommended) || edge.options[0]; }
function bestHours(edge) {
  const o = chosenOption(edge);
  const d = o && o.durationHrs;
  if (Array.isArray(d)) return Number(d[0]) || 0;
  return Number(d) || 0;
}

// Turn a prev-map + endpoints into an ordered list of leg steps.
function reconstruct(prev, a, b) {
  const legs = [];
  let cur = b;
  while (cur !== a) {
    const p = prev.get(cur);
    if (!p) return null;
    legs.unshift({
      from: _display.get(p.node), to: _display.get(cur),
      edge: p.step.edge, reversed: p.step.reversed, option: chosenOption(p.step.edge),
    });
    cur = p.node;
  }
  return legs;
}

// Dijkstra weighted by best-case duration + a transfer penalty, so it prefers a sensible
// balance of fewest changes and least time. Node count is small, so a linear scan is fine.
function dijkstra(a, b) {
  const G = graph();
  const dist = new Map([[a, 0]]);
  const prev = new Map();
  const done = new Set();
  const TRANSFER_PENALTY = 1.5;
  while (true) {
    let u = null, best = Infinity;
    for (const [n, d] of dist) if (!done.has(n) && d < best) { best = d; u = n; }
    if (u === null || u === b) break;
    done.add(u);
    for (const step of G.get(u) || []) {
      if (done.has(step.to)) continue;
      const nd = best + bestHours(step.edge) + TRANSFER_PENALTY;
      if (nd < (dist.get(step.to) ?? Infinity)) { dist.set(step.to, nd); prev.set(step.to, { node: u, step }); }
    }
  }
  return prev.has(b) ? reconstruct(prev, a, b) : null;
}

// Breadth-first for the genuinely fewest-changes path (ties broken by earlier discovery).
function bfsHops(a, b) {
  const G = graph();
  const prev = new Map();
  const seen = new Set([a]);
  const q = [a];
  while (q.length) {
    const u = q.shift();
    if (u === b) break;
    for (const step of G.get(u) || []) {
      if (seen.has(step.to)) continue;
      seen.add(step.to); prev.set(step.to, { node: u, step }); q.push(step.to);
    }
  }
  return prev.has(b) ? reconstruct(prev, a, b) : null;
}

function legSig(legs) { return legs.map((l) => l.from + '>' + l.to).join('|'); }

function summarize(legs) {
  const priceByCcy = {};
  let hLo = 0, hHi = 0;
  const borders = [];
  for (const l of legs) {
    const o = l.option || {};
    const d = o.durationHrs;
    if (Array.isArray(d)) { hLo += Number(d[0]) || 0; hHi += Number(d[1]) || Number(d[0]) || 0; }
    else if (d) { hLo += Number(d); hHi += Number(d); }
    if (o.price && o.price.currency) {
      const c = o.price.currency;
      priceByCcy[c] = priceByCcy[c] || { low: 0, high: 0 };
      priceByCcy[c].low += Number(o.price.low) || 0;
      priceByCcy[c].high += Number(o.price.high) || 0;
    }
    if (l.edge.crossBorder) borders.push({ border: l.edge.border, visa: l.edge.visa, scamWarnings: l.edge.scamWarnings, from: l.from, to: l.to });
  }
  return { legs, totalHrs: [hLo, hHi], priceByCcy, changes: Math.max(0, legs.length - 1), borders };
}

// Plan a journey between two node names. Returns up to two labelled itineraries: a
// balanced "Suggested route" and, when it is genuinely different and involves fewer
// changes, a "Fewest changes" alternative. Empty array if unreachable.
export function planRoutes(fromName, toName) {
  const G = graph();
  const a = norm(fromName), b = norm(toName);
  if (!G.has(a) || !G.has(b) || a === b) return [];
  const dj = dijkstra(a, b);
  const bf = bfsHops(a, b);
  const plans = [];
  if (dj) plans.push({ label: 'Suggested route', ...summarize(dj) });
  if (bf && bf.length < (dj ? dj.length : Infinity) && (!dj || legSig(bf) !== legSig(dj))) {
    plans.push({ label: 'Fewest changes', ...summarize(bf) });
  }
  return plans;
}
