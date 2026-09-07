// Weather UI shared between the (lazily loaded) weather screen and the modules that render a
// forecast without being on #weather — main.js embeds wxVizCard, and js/screens/places.js uses
// seedWeatherKey for its nearby-weather card.
//
// The two weather modules are different files and only one of them moves: js/weather.js is the
// data service (cache, refresh, WMO codes) and stays eager; js/screens/weather.js is the screen
// and no longer is.
//
// The closure was computed, not guessed: the three helpers main.js imports pull in nine more
// plus the WX_METRICS table, and stop — weatherScreen is not reachable from any of them.

import { esc, h } from './util.js';
import { wmo } from './weather.js';
import { fmtTemp, fmtWind } from './render-utils.js';
import { fmtClock } from './main.js';

export function wxDiffDays(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000); }

export const WX_METRICS = {
  temp:  { label: '🌡 Temp',     hourly: (x) => x.temp, daily: (d) => d.tmax,     fmt: (v) => (v == null ? 'N/A' : fmtTemp(v)) },
  rain:  { label: '💧 Rain',     hourly: (x) => x.pp,   daily: (d) => d.rainProb, fmt: (v) => (v == null ? 'N/A' : Math.round(v) + '%'), min: 0, max: 100 },
  hum:   { label: '💦 Humidity', hourly: (x) => x.hum,  daily: null,              fmt: (v) => (v == null ? 'N/A' : Math.round(v) + '%'), min: 0, max: 100 },
  uv:    { label: '☀ UV',       hourly: (x) => x.uv,   daily: (d) => d.uv,       fmt: (v) => (v == null ? 'N/A' : String(Math.round(v))), min: 0, max: 12 },
  feels: { label: '🥵 Feels',    hourly: (x) => x.app,  daily: (d) => d.appMax,   fmt: (v) => (v == null ? 'N/A' : fmtTemp(v)) },
  wind:  { label: '💨 Wind',     hourly: (x) => x.wind, daily: (d) => d.windMax,  fmt: (v) => (v == null ? 'N/A' : fmtWind(v)) },
};

// Which metric the ring + calendar below are currently coloured by. Module-level (not a
// wxVizCard-local closure, unlike selectedIdx there) so it persists across repeated opens of
// the weather screen within one session, matching this file's original design in
// js/screens/weather.js before the mk-v0.504.0 launch-graph split moved the code that reads
// and writes it here without moving the variable itself — the cause of a live
// ReferenceError (wxMetric undefined) on every ring/calendar render since that release.
let wxMetric = 'temp';

export function wxUvColor(v) {
  if (v <= 2) return '#4CAF50';
  if (v <= 5) return '#FBC02D';
  if (v <= 7) return '#FB8C00';
  if (v <= 10) return '#E53935';
  return '#8E24AA';
}

export function wxMetricColor(metric, v, lo, hi) {
  if (v == null) return 'rgba(140,140,150,0.20)';
  if (metric === 'uv') return wxUvColor(v);
  const t = hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5;
  if (metric === 'rain' || metric === 'hum') return `hsl(205, ${35 + t * 55}%, ${90 - t * 48}%)`;
  if (metric === 'wind') return `hsl(${140 - t * 110}, 62%, ${68 - t * 20}%)`;
  return `hsl(${(1 - t) * 214}, 72%, ${61 - t * 7}%)`;   // temp / feels: blue → red
}

export function wxArcWedge(cx, cy, rIn, rOut, a0, a1) {
  const P = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [xo0, yo0] = P(rOut, a0), [xo1, yo1] = P(rOut, a1), [xi1, yi1] = P(rIn, a1), [xi0, yi0] = P(rIn, a0);
  const large = (a1 - a0) > Math.PI ? 1 : 0;
  return `M${xo0.toFixed(1)},${yo0.toFixed(1)} A${rOut},${rOut} 0 ${large} 1 ${xo1.toFixed(1)},${yo1.toFixed(1)} L${xi1.toFixed(1)},${yi1.toFixed(1)} A${rIn},${rIn} 0 ${large} 0 ${xi0.toFixed(1)},${yi0.toFixed(1)} Z`;
}

export function wxNext24h(rec) {
  const hrs = Array.isArray(rec.hourly) ? rec.hourly : [];
  const now = new Date();
  const nowFloor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  let start = hrs.findIndex((x) => { const d = new Date(x.t); return !isNaN(d) && d >= nowFloor; });
  if (start < 0) start = 0;
  return hrs.slice(start, start + 24);
}

export function wxHourlyRingSvg(win, metric, city, selectedIdx) {
  const cfg = WX_METRICS[metric];
  if (!win.length) return '';
  const vals = win.map(cfg.hourly).filter((v) => v != null);
  if (!vals.length) return '';
  const lo = cfg.min != null ? cfg.min : Math.min(...vals);
  const hi = cfg.max != null ? cfg.max : Math.max(...vals);
  // cx/cy sit at the centre of a 280x280 box (not 240x240 — the ring geometry itself,
  // rIn/rOut, is unchanged) so the outer hour labels have real margin to the edge: at the
  // old 240x240 size, the label radius (rOut+13) put the south label's baseline PAST the
  // bottom edge (120+119+4 = 243 > 240) and the east/west labels' text (anchor=middle) hung
  // half off the left/right edges — obstructed/clipped exactly as reported. The extra 20px
  // of padding on every side is enough for any 4-character label at this font size to sit
  // fully inside the box on all 8 sides.
  const cx = 140, cy = 140, rOut = 106, rIn = 66, gap = 0.010, step = (2 * Math.PI) / 24;
  let wedges = '';
  win.forEach((x, i) => {
    const a0 = i * step - Math.PI / 2 + gap;
    const a1 = (i + 1) * step - Math.PI / 2 - gap;
    const sel = i === selectedIdx ? ' wx-wedge-sel' : '';
    wedges += `<path d="${wxArcWedge(cx, cy, rIn, rOut, a0, a1)}" fill="${wxMetricColor(metric, cfg.hourly(x), lo, hi)}" class="wx-wedge${sel}" data-i="${i}"><title>${fmtClock(new Date(x.t).getHours())}: ${cfg.fmt(cfg.hourly(x))}</title></path>`;
  });
  // Hour labels — every 3 hours (8 around the ring) rather than every 6 (4), plus a short
  // tick connecting each label to its wedge, so it reads clearly which segment is which hour
  // at a glance instead of needing to interpolate between four widely-spaced labels. The
  // "now" label (the very first wedge, always at the top) gets its own accent class to anchor
  // the reading, matching the separate "now" dot/centre text already drawn below.
  let labels = '';
  [0, 3, 6, 9, 12, 15, 18, 21].forEach((i) => {
    if (i >= win.length) return;
    const a = i * step - Math.PI / 2;
    const t0x = cx + (rOut + 2) * Math.cos(a), t0y = cy + (rOut + 2) * Math.sin(a);
    const t1x = cx + (rOut + 7) * Math.cos(a), t1y = cy + (rOut + 7) * Math.sin(a);
    labels += `<line x1="${t0x.toFixed(1)}" y1="${t0y.toFixed(1)}" x2="${t1x.toFixed(1)}" y2="${t1y.toFixed(1)}" class="wx-ring-tick"/>`;
    const lr = rOut + 13;
    const lx = cx + lr * Math.cos(a), ly = cy + lr * Math.sin(a) + 4;
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" class="wx-ring-lbl${i === 0 ? ' wx-ring-lbl-now' : ''}">${fmtClock(new Date(win[i].t).getHours())}</text>`;
  });
  const nowMark = `<circle cx="${cx}" cy="${(cy - rOut - 3).toFixed(1)}" r="3.4" class="wx-ring-now"/>`;
  // Centre readout follows the selection: a tapped wedge takes over from "now" until cleared
  // (tap it again) or another wedge is tapped.
  const focusIdx = selectedIdx != null ? selectedIdx : 0;
  const focusX = win[focusIdx];
  const center = `<text x="${cx}" y="${cy - 6}" text-anchor="middle" class="wx-ring-val">${cfg.fmt(cfg.hourly(focusX))}</text>`
    + `<text x="${cx}" y="${cy + 15}" text-anchor="middle" class="wx-ring-sub">${esc(city)}</text>`
    + `<text x="${cx}" y="${cy + 32}" text-anchor="middle" class="wx-ring-sub2">${selectedIdx != null ? esc(fmtClock(new Date(focusX.t).getHours())) : 'now'}</text>`;
  return `<svg viewBox="0 0 280 280" class="wx-ring" role="img" aria-label="Next 24 hours ${metric}" xmlns="http://www.w3.org/2000/svg">${wedges}${labels}${nowMark}${center}</svg>`;
}

export function wxHourDetailCard(x) {
  const [label, emo] = wmo(x.code);
  const rows = Object.values(WX_METRICS).map((cfg) => h('div', { class: 'wx-detail-row' }, [
    h('span', { class: 'wx-detail-lbl' }, cfg.label),
    h('span', { class: 'wx-detail-val' }, cfg.fmt(cfg.hourly(x))),
  ]));
  return h('div', { class: 'wx-hour-detail' }, [
    h('div', { class: 'wx-detail-head' }, [h('strong', {}, fmtClock(new Date(x.t).getHours())), ` · ${emo} ${label}`]),
    ...rows,
  ]);
}

export function wxDayHumAvg(rec, date) {
  const hs = (rec.hourly || []).filter((x) => String(x.t).slice(0, 10) === date && x.hum != null);
  return hs.length ? Math.round(hs.reduce((a, b) => a + b.hum, 0) / hs.length) : null;
}

export function wxHourlyListNode(rec) {
  const hrs = Array.isArray(rec.hourly) ? rec.hourly : [];
  const now = new Date();
  const nowFloor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  let start = hrs.findIndex((x) => { const d = new Date(x.t); return !isNaN(d) && d >= nowFloor; });
  if (start < 0) start = 0;
  const win = hrs.slice(start, start + 24);
  if (!win.length) return null;
  const row = h('div', { class: 'wx-hourly-row' });
  win.forEach((x, i) => {
    const [label, emo] = wmo(x.code);
    row.append(h('div', { class: 'wx-hourly-cell' }, [
      h('div', { class: 'wx-hourly-t' }, i === 0 ? 'Now' : fmtClock(new Date(x.t).getHours())),
      h('div', { class: 'wx-hourly-emo', title: label }, emo),
      h('div', { class: 'wx-hourly-temp' }, fmtTemp(x.temp)),
      x.pp != null ? h('div', { class: 'wx-hourly-pp' }, `💧${Math.round(x.pp)}%`) : null,
      x.wind != null ? h('div', { class: 'wx-hourly-wind' }, fmtWind(x.wind)) : null,
    ]));
  });
  return h('div', { class: 'wx-hourly-scroll' }, [row]);
}

export function wxMonthCalendarNode(rec, metric) {
  const cfg = WX_METRICS[metric];
  const daily = Array.isArray(rec.daily) ? rec.daily : [];
  if (!daily.length) return h('p', { class: 'muted small' }, 'Connect once to load the forecast.');
  const valOf = (d) => (metric === 'hum' ? wxDayHumAvg(rec, d.date) : (cfg.daily ? cfg.daily(d) : null));
  const vals = daily.map(valOf).filter((v) => v != null);
  const lo = cfg.min != null ? cfg.min : (vals.length ? Math.min(...vals) : 0);
  const hi = cfg.max != null ? cfg.max : (vals.length ? Math.max(...vals) : 1);
  const grid = h('div', { class: 'wx-cal' });
  ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d) => grid.append(h('div', { class: 'wx-cal-dow' }, d)));
  const startDow = (new Date(daily[0].date + 'T00:00').getDay() + 6) % 7;   // Monday-first
  for (let i = 0; i < startDow; i++) grid.append(h('div', { class: 'wx-cal-cell empty' }));
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  daily.forEach((d) => {
    const v = valOf(d);
    const cell = h('div', { class: 'wx-cal-cell' + (d.date === todayStr ? ' today' : '') });
    if (v != null) cell.style.background = wxMetricColor(metric, v, lo, hi);
    cell.append(h('div', { class: 'wx-cal-num' }, String(Number(d.date.slice(8, 10)))));
    cell.append(h('div', { class: 'wx-cal-emo' }, wmo(d.code)[1]));
    cell.append(h('div', { class: 'wx-cal-v' }, cfg.fmt(v)));
    grid.append(cell);
  });
  return h('div', {}, [
    grid,
    h('p', { class: 'muted small', style: 'margin:6px 2px 0' }, `Forecast covers the next ${daily.length} day${daily.length === 1 ? '' : 's'}; later days fill in as the forecast extends.`),
  ]);
}

export function wxVizCard(rec, spot) {
  const card = h('div', { class: 'card wx-viz' });
  const chipsRow = h('div', { class: 'chips wx-metric-row' });
  const ringSlot = h('div', {});
  const detailSlot = h('div', {});
  const calSlot = h('div', {});
  const win = wxNext24h(rec);
  let selectedIdx = null;

  // Ring + detail panel only — cheap, so a wedge tap never has to also rebuild the calendar.
  function paintRing() {
    ringSlot.innerHTML = '';
    const ring = wxHourlyRingSvg(win, wxMetric, spot.city, selectedIdx);
    if (ring) ringSlot.append(h('div', { class: 'wx-ring-wrap', html: ring }));
    detailSlot.innerHTML = '';
    if (selectedIdx != null && win[selectedIdx]) detailSlot.append(wxHourDetailCard(win[selectedIdx]));
  }
  function paintMetric() {
    paintRing();
    calSlot.innerHTML = '';
    calSlot.append(wxMonthCalendarNode(rec, wxMetric));
  }
  // Tap a wedge to pin that hour: highlights it on the ring and lists every layer's value for
  // that exact hour in detailSlot, not just whichever single metric the ring is coloured by.
  // Tapping the same wedge again clears the selection back to "now". One delegated listener
  // survives every ringSlot.innerHTML repaint, so it is attached once, outside paintRing.
  ringSlot.addEventListener('click', (e) => {
    const path = e.target.closest('path[data-i]');
    if (!path) return;
    const i = Number(path.dataset.i);
    selectedIdx = selectedIdx === i ? null : i;
    paintRing();
  });

  // A segmented control, not a <select> and not six wrapping pills. The six measurements are
  // mutually exclusive — the ring is coloured by exactly one — so a single-select is right,
  // but a dropdown hides which options exist and costs two taps to compare two of them, and
  // the traveller comparing "is it the heat or the humidity" flips between exactly two
  // repeatedly. Six equal segments carrying the emoji over an abbreviated label fit one 40px
  // row at 375px, which is less height than the select-plus-caption it replaces, and every
  // option is visible and one tap away. `aria-label` carries the unabbreviated name.
  const METRIC_SHORT = { temp: 'Temp', rain: 'Rain', hum: 'Humid', uv: 'UV', feels: 'Feels', wind: 'Wind' };
  const segs = Object.keys(WX_METRICS).map((m) => {
    const [ic, ...rest] = WX_METRICS[m].label.split(' ');
    const b = h('button', {
      type: 'button', class: 'wx-seg', 'data-m': m,
      'aria-pressed': m === wxMetric ? 'true' : 'false',
      'aria-label': `Colour the forecast by ${rest.join(' ') || m}`,
      onclick: () => {
        wxMetric = m;
        segs.forEach((x) => x.setAttribute('aria-pressed', x.dataset.m === m ? 'true' : 'false'));
        paintMetric();
      },
    }, [h('span', { class: 'wx-seg-ic' }, ic), h('span', { class: 'wx-seg-lbl' }, METRIC_SHORT[m] || m)]);
    return b;
  });
  chipsRow.append(h('div', { class: 'wx-metric-seg', role: 'group', 'aria-label': 'Which measurement to colour the forecast by' }, segs));

  card.append(h('h3', { class: 'wx-cal-h', style: 'margin:0 0 6px' }, 'Next 24 hours'), chipsRow, ringSlot, detailSlot);
  const hourly = wxHourlyListNode(rec);
  if (hourly) card.append(hourly);
  // "Upcoming forecast" is the month calendar — the tallest thing in this card by some
  // margin, and it is a look-ahead rather than a look-at-now. Folded and CLOSED by default so
  // the card opens on the next 24 hours (which is what "right now" means) and the traveller
  // chooses to look further. data-nofold keeps mount()'s automatic section folding from
  // wrapping this a second time; the <details> here already is the fold.
  const calDet = h('details', { class: 'wx-cal-fold', 'data-nofold': '' }, [
    h('summary', { class: 'wx-cal-h' }, 'Upcoming forecast'),
    calSlot,
  ]);
  card.append(calDet);
  paintMetric();
  return card;
}

// Which city the full forecast opens to. This binding lives HERE, not in js/screens/weather.js,
// because the two modules that seed it — main.js's nearby-weather card and js/screens/places.js's
// "See full forecast" — must be able to do so without pulling in the whole (lazily loaded)
// weather screen. It was previously declared in the screen and assigned from here, which in a
// module (always strict mode) is a ReferenceError, not an implicit global: every tap on "See
// full forecast" threw, and the forecast opened at the wrong city. Same failure as wxMetric two
// comments above it in that file, missed in the same refactor.
let weatherKey = '';
export function seedWeatherKey(key) { weatherKey = key; }
export function currentWeatherKey() { return weatherKey; }
