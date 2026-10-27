// The recap's charts (F4): inline SVG and CSS bars coloured from theme tokens, no chart library, so all 11 skins repaint them.
// Series colours are S1's --viz-1 to --viz-8 in their fixed slot order (css/refined.css); slot 0 is the neutral grey of "Other" and of
// anything the traveller did not choose. Rules from the dataviz skill: thin marks, 4 px rounded data ends square at the baseline, a 2 px
// surface gap between touching fills, a legend for two or more series, no number on every mark, a focusable readout (the same values as
// hover) and a table twin. Pure functions of plain data: nothing here reads the store, so every label arrives already formatted.
import { h, esc } from './util.js';
import { REGION_PATHS, REGION_RIVER } from './data/geo.js';
import { journeyMapParts } from './journey-share.js';

const NS = 'http://www.w3.org/2000/svg';
const slotClass = (slot) => `rc-k${slot >= 1 && slot <= 8 ? slot : 0}`;
const key = (slot) => h('span', { class: `rc-key ${slotClass(slot)}`, 'aria-hidden': 'true' });

// 0 to 999 as it is, then 1.2K, 12K, 1.2M: axis ticks carry no currency (the caption names it).
export function compact(n) {
  const a = Math.abs(n);
  if (a >= 1e6) return `${+(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `${+(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K`;
  return String(Math.round(n * 10) / 10);
}

// The next round number at or above `max` whose half is also round (1, 2, 3, 4, 5, 6, 8 or 10 times a power of ten): the top gridline
// and the middle one are both clean ticks, and the top is never far above the tallest column.
function niceMax(max) {
  if (!(max > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 3, 4, 5, 6, 8, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

// Horizontal bars, one row each: the name and the value on one line, the bar under it. A row's bar is one fill or several side by side
// (`segs: [{ value, slot }]`); the bar's length is its total against the longest row. Every number is in the row's text, so nothing is
// carried by length or colour alone. rows: [{ label, sub?, text, value, slot?, segs? }]
export function barList(rows) {
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  return h('ul', { class: 'rc-bars' }, rows.map((r) => {
    const segs = r.segs || [{ value: r.value, slot: r.slot == null ? 1 : r.slot }];
    return h('li', { class: 'rc-bar' }, [
      h('span', { class: 'rc-bar-name' }, r.label),
      h('b', { class: 'rc-bar-val' }, r.text),
      h('span', { class: 'rc-bar-track', 'aria-hidden': 'true' }, segs.filter((s) => s.value > 0).map((s) =>
        h('span', { class: `rc-bar-fill ${slotClass(s.slot)}`, style: `width:${(s.value / max * 100).toFixed(2)}%` }))),
      r.sub ? h('span', { class: 'rc-bar-sub' }, r.sub) : null,
    ]);
  }));
}

// A legend for two or more series: the colour mark, then the name in text colour (text never wears the series colour).
export function legend(items) {
  if (items.length < 2) return null;
  return h('ul', { class: 'rc-legend' }, items.map((i) => h('li', {}, [key(i.slot), i.label])));
}

function roundTop(x, y, w, hgt, r) {
  r = Math.max(0, Math.min(r, w / 2, hgt));
  return `M${x},${y + hgt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt}Z`;
}

// Stacked columns, one per period. buckets: [{ label, tick?, total, parts: [{ key, value }] }] in time order (tick is the shorter axis text); series: [{ key, label, slot }]
// in stack order (bottom first); fmt(value) writes a money amount; heading names the chart for the table and the readout.
// The plot is one focusable control: pointer or arrow keys move through the periods and the readout under it lists the period's total
// and every series (values first), with the highest period shown until the reader picks one.
export function stackedColumns({ buckets, series, fmt, heading, unitWord, note }) {
  const W = 320, H = 168, L = 38, R = 4, T = 8, B = 24;
  const pw = W - L - R, ph = H - T - B, n = buckets.length;
  const top = niceMax(Math.max(...buckets.map((b) => b.total)));
  const slotW = pw / n, bw = Math.max(2, Math.min(24, slotW - 2));
  const yOf = (v) => T + ph - v / top * ph;
  let g = '';
  [0, 0.5, 1].forEach((t) => {
    const y = yOf(top * t);
    g += `<line class="rc-grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="rc-tick" x="${L - 5}" y="${y + 4}" text-anchor="end">${compact(top * t)}</text>`;
  });
  let cols = '';
  buckets.forEach((b, i) => {
    const x = L + i * slotW + (slotW - bw) / 2;
    let base = T + ph;
    const live = series.filter((s) => (b.parts.find((p) => p.key === s.key) || {}).value > 0);
    live.forEach((s, j) => {
      const v = b.parts.find((p) => p.key === s.key).value, hgt = v / top * ph;
      base -= hgt;
      cols += (j === live.length - 1
        ? `<path class="rc-col ${slotClass(s.slot)}" d="${roundTop(+x.toFixed(2), +base.toFixed(2), +bw.toFixed(2), +hgt.toFixed(2), 4)}"/>`
        : `<rect class="rc-col ${slotClass(s.slot)}" x="${x.toFixed(2)}" y="${base.toFixed(2)}" width="${bw.toFixed(2)}" height="${hgt.toFixed(2)}"/>`);
    });
  });
  const at = [...new Set([0, Math.floor((n - 1) / 2), n - 1])];
  const xlab = at.map((i) => {
    const mid = L + i * slotW + slotW / 2;
    const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    return `<text class="rc-tick" x="${(anchor === 'start' ? L : anchor === 'end' ? W - R : mid).toFixed(1)}" y="${H - 6}" text-anchor="${anchor}">${esc(buckets[i].tick || buckets[i].label)}</text>`;
  }).join('');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'rc-svg');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', heading);
  svg.innerHTML = `<g aria-hidden="true">${g}<rect class="rc-sel" x="${L}" y="${T}" width="${slotW.toFixed(2)}" height="${ph}" visibility="hidden"/>${cols}${xlab}</g>`
    + `<rect class="rc-plot" x="${L}" y="${T}" width="${pw}" height="${ph}" tabindex="0" role="slider" aria-orientation="horizontal" aria-label="${esc(unitWord)}"/>`;
  const plot = svg.querySelector('.rc-plot'), sel = svg.querySelector('.rc-sel');

  const readout = h('div', { class: 'rc-readout', role: 'status', 'aria-live': 'polite' });
  const peak = buckets.reduce((a, b, i) => (b.total > buckets[a].total ? i : a), 0);
  let cur = peak;
  const show = (i, marked) => {
    cur = Math.max(0, Math.min(n - 1, i));
    const b = buckets[cur];
    sel.setAttribute('x', (L + cur * slotW).toFixed(2));
    sel.setAttribute('visibility', marked ? 'visible' : 'hidden');
    plot.setAttribute('aria-valuemin', '1'); plot.setAttribute('aria-valuemax', String(n)); plot.setAttribute('aria-valuenow', String(cur + 1));
    plot.setAttribute('aria-valuetext', `${b.label}, ${fmt(b.total)}`);
    readout.textContent = '';
    readout.append(h('div', { class: 'rc-ro-head' }, [h('b', {}, fmt(b.total)), ` ${b.label}`, !marked && n > 1 ? h('span', { class: 'rc-ro-tag' }, ' (highest)') : null]));
    readout.append(h('ul', { class: 'rc-ro-list' }, series.filter((s) => (b.parts.find((p) => p.key === s.key) || {}).value > 0).map((s) =>
      h('li', {}, [key(s.slot), h('b', {}, fmt(b.parts.find((p) => p.key === s.key).value)), ` ${s.label}`]))));
  };
  show(peak, false);
  const fromPointer = (e) => {
    const r = svg.getBoundingClientRect();
    show(Math.floor(((e.clientX - r.left) / r.width * W - L) / slotW), true);
  };
  plot.addEventListener('pointerdown', fromPointer);
  plot.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) fromPointer(e); });
  plot.addEventListener('focus', () => show(cur, true));
  plot.addEventListener('blur', () => show(peak, false));
  plot.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageUp: -7, PageDown: 7 }[e.key];
    if (step) show(cur + step, true);
    else if (e.key === 'Home') show(0, true);
    else if (e.key === 'End') show(n - 1, true);
    else return;
    e.preventDefault();
  });

  // The table twin has three columns however many series there are, so it fits a phone without sideways scrolling: the period, the
  // total, and the split as text.
  const table = h('details', { class: 'rc-table' }, [
    h('summary', {}, 'Show as a table'),
    h('div', { class: 'rc-table-wrap' }, h('table', {}, [
      h('thead', {}, h('tr', {}, [h('th', { scope: 'col' }, unitWord), h('th', { scope: 'col' }, 'Total'), h('th', { scope: 'col' }, 'Split')])),
      h('tbody', {}, buckets.map((b) => h('tr', {}, [h('th', { scope: 'row' }, b.label), h('td', {}, fmt(b.total)),
        h('td', { class: 'rc-split' }, series.map((s) => { const p = b.parts.find((x) => x.key === s.key); return p && p.value > 0 ? `${s.label} ${fmt(p.value)}` : ''; }).filter(Boolean).join(' · '))]))),
    ])),
  ]);
  return h('figure', { class: 'rc-fig' }, [svg, legend(series), readout, note ? h('figcaption', { class: 'rc-note' }, note) : null, table]);
}

// The route on the same outlines the app draws everywhere else, cropped to the trip, repainted from tokens (water, land, river and the
// route's own colour are classes, not the literals journey-share.js uses for the file it hands out). Only the first and last stop are
// named on the map; the stop list under it carries the rest. stops: [{ lat, lng, label }]
export function routeMap(stops) {
  const parts = journeyMapParts(stops);
  if (!parts) return null;
  const { vb, minX, minY, w, hgt, u, f, routePts } = parts;
  const land = Object.keys(REGION_PATHS).map((id) => `<path class="rc-land" d="${REGION_PATHS[id]}" stroke-width="${f(u * 0.35)}" fill-rule="evenodd"/>`).join('');
  const river = REGION_RIVER ? `<path class="rc-river" d="${REGION_RIVER}" stroke-width="${f(u * 0.7)}"/>` : '';
  const route = routePts.length > 1
    ? `<path class="rc-route" d="M${routePts.map((c) => `${f(c[0])},${f(c[1])}`).join(' L')}" stroke-width="${f(u * 0.8)}"/>` : '';
  const dots = routePts.map((c) => `<circle class="rc-dot" cx="${f(c[0])}" cy="${f(c[1])}" r="${f(u * 1.6)}" stroke-width="${f(u * 0.6)}"/>`).join('');
  const label = (i) => {
    const s = stops[i], c = routePts[i];
    if (!s.label) return '';
    const right = c[0] < minX + w * 0.58;
    return `<text class="rc-map-label" x="${f(c[0] + (right ? 1 : -1) * u * 2.8)}" y="${f(c[1] + u * 1.3)}" font-size="${f(u * 4)}" text-anchor="${right ? 'start' : 'end'}" stroke-width="${f(u * 1.1)}">${esc(s.label)}</text>`;
  };
  const named = stops.length > 1 && stops[0].label !== stops[stops.length - 1].label ? label(0) + label(stops.length - 1) : label(0);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', vb);
  svg.setAttribute('class', 'rc-map-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Map of your route through ${stops.length} stop${stops.length === 1 ? '' : 's'}`);
  svg.innerHTML = `<rect class="rc-water" x="${minX.toFixed(1)}" y="${minY.toFixed(1)}" width="${w.toFixed(1)}" height="${hgt.toFixed(1)}"/>${land}${river}${route}${dots}${named}`;
  return svg;
}
