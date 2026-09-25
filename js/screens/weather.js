// Weather screens: full forecast, and the Home/place-card watch-face widget (wxVizCard).
// Extracted from main.js (module-split, see MASTER_BUILD_PROMPT.md) — the DATA/fetch layer
// stays in js/weather.js; this is the RENDERING layer only. The selected city (weatherKey)
// lives in js/weather-ui.js so that main.js's nearby-weather card and js/screens/places.js can
// seed it via seedWeatherKey() without loading this screen; weatherSeededHash below stays
// module-private here because only this screen uses it.
import { store, save, getLastFix, setLastFix } from '../state.js';
import { h, esc, compass, haversineKm } from '../util.js';
import {
  wxTempU, wxWindU, wxLenU, wxPresU, fmtTemp, fmtWind, fmtPrecip, fmtSnow, fmtHeight, fmtDist, fmtPres,
  waveDesc, airBlock, uvLineNode,
} from '../render-utils.js';
import { field, online, screenHint } from '../ui-widgets.js';
import {
  WEATHER_SPOTS, wmo, spotKey, spotsForCountry, defaultSpot, getCachedWeather, getCachedMany, getCachedMarine,
  maybeRefreshWeather, maybeRefreshMany, maybeRefreshMarine,
} from '../weather.js';
import { COUNTRIES, getCountry } from '../data/regions.js';
import { REGION_PATHS, REGION_VIEWBOX, REGION_PROJ } from '../data/geo.js';
// Circular import back into main.js — same accepted pattern js/screens/home.js already uses
// (see home.js's own header comment): every one of these is only read inside a function body,
// never at module-evaluation time, so the cycle is safe.
import { topbar, mount, focusSpot, fmtClock, spotForCity, render } from '../main.js';
import { dateLocale, retranslate } from '../i18n.js';

// Shared with the modules that stay in the launch graph; see js/weather-ui.js. These moved out so
// this file could leave it — the router imports it on demand now.
import {
  seedWeatherKey, currentWeatherKey, wxVizCard, cityNowIso,
} from '../weather-ui.js';
// ---- WEATHER + FORECAST -----------------------------------------------------
// weatherKey itself now lives in weather-ui.js (see the note there) — a module's `let` cannot
// be assigned across an import, which is what broke seedWeatherKey.
let weatherSeededHash = null;   // route we last seeded weatherKey for (so city clicks stick)
function wxAgo(ts) {
  if (!ts) return 'never';
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const hr = Math.round(m / 60);
  if (hr < 24) return `${hr} h ago`;
  return `${Math.round(hr / 24)} d ago`;
}
function wxDay(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short' }); } catch { return d; } }
function wxDayDate(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } }
function wxTime(iso) { try { return new Date(iso).toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' }); } catch { return iso ? iso.slice(11, 16) : 'N/A'; } }
// Project lng/lat onto the same map as the landing-page country outlines.
function projLL(lng, lat) { const P = REGION_PROJ; return [P.pad + (lng - P.minlng) * P.kx * P.scale, P.pad + (P.maxlat - lat) * P.scale]; }
function wxTempVal(c) { return wxTempU() === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c); }

// ---- TAP A UNIT TO SWITCH IT --------------------------------------------------
// Every unit printed on this screen is its own switch: tap °C for °F, km/h for mph, mm or m for
// inches or feet, hPa for inHg, and tap again to go back. It replaced a row of four unit chips
// that spent a line of screen on something the numbers themselves can carry.
//
// The screen's text is built as template strings in a dozen places, so rather than rewrite each
// one as DOM, the finished text is scanned: every number followed by a known unit gets that unit
// wrapped in a small button. A MutationObserver re-runs the scan on whatever is added later — the
// background-refresh repaint, a city switch, an hour pinned on the ring — so one call covers every
// paint path, including ones written after this.
//
// Temperature takes no space ("31°C"); every other unit needs exactly one ("12 km/h"), which is
// what the formatters print. That rule is what keeps "21m" and "PM2.5" out of it.
const UNIT_RE = /(\d)(°[CF])|(\d)[  ](km\/h|mph|inHg|hPa|mm|cm|km|mi|ft|in|m)(?![A-Za-z0-9/²³])/g;
const UNIT_FAMILY = {
  '°C': 'temp', '°F': 'temp', 'km/h': 'wind', mph: 'wind', hPa: 'pres', inHg: 'pres',
  mm: 'len', cm: 'len', in: 'len', m: 'len', ft: 'len', km: 'len', mi: 'len',
};
function unitTarget(fam) {
  if (fam === 'temp') return wxTempU() === 'F' ? '°C' : '°F';
  if (fam === 'wind') return wxWindU() === 'mph' ? 'km/h' : 'mph';
  if (fam === 'pres') return wxPresU() === 'inHg' ? 'hPa' : 'inHg';
  return wxLenU() === 'imp' ? 'metric' : 'imperial';
}
function unitSkip(n) {
  const p = n.parentElement;
  if (!p || !/\d/.test(n.nodeValue || '')) return true;
  return !!p.closest('svg, .u-tap, textarea, input, select, option, script, style, [data-no-units]');
}
function splitUnits(n) {
  if (unitSkip(n)) return;
  const s = n.nodeValue;
  const frag = document.createDocumentFragment();
  let last = 0;
  UNIT_RE.lastIndex = 0;
  for (let m = UNIT_RE.exec(s); m; m = UNIT_RE.exec(s)) {
    const unit = m[2] || m[4];
    const fam = UNIT_FAMILY[unit];
    const at = m.index + m[0].length - unit.length;
    const target = unitTarget(fam);
    frag.append(s.slice(last, at), h('span', {
      class: 'u-tap', role: 'button', tabindex: '0', 'data-u': fam, 'data-no-i18n': '',
      title: `Switch to ${target}`, 'aria-label': `${unit}, switch to ${target}`,
    }, unit));
    last = at + unit.length;
  }
  if (!last) return;
  frag.append(s.slice(last));
  n.replaceWith(frag);
}
function wrapUnits(node) {
  if (node.nodeType === 3) { splitUnits(node); return; }
  if (node.nodeType !== 1) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const texts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);
  texts.forEach(splitUnits);
}
function tapUnits(root, onToggle) {
  wrapUnits(root);
  new MutationObserver((muts) => {
    muts.forEach((m) => {
      if (m.type === 'characterData') splitUnits(m.target);
      else m.addedNodes.forEach(wrapUnits);
    });
  }).observe(root, { childList: true, characterData: true, subtree: true });
  // Capture phase, so a unit inside something that is itself tappable — a 7-day row, a trip
  // city's summary — switches the unit without also opening or closing that row.
  const act = (e) => {
    const t = e.target && e.target.closest ? e.target.closest('.u-tap') : null;
    if (!t || !root.contains(t)) return;
    e.preventDefault();
    e.stopPropagation();
    onToggle(t.getAttribute('data-u'));
  };
  root.addEventListener('click', act, true);
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') act(e); }, true);
}
// unitsManual: once the traveller picks a scale themselves, changing the interface language must
// never move it back (see applyLocaleDefaults in js/i18n.js).
let pendingScrollY = null;
function toggleUnit(fam) {
  const p = store.profile;
  if (fam === 'temp') p.wxTempUnit = wxTempU() === 'F' ? 'C' : 'F';
  else if (fam === 'wind') p.wxWindUnit = wxWindU() === 'mph' ? 'kmh' : 'mph';
  else if (fam === 'pres') p.wxPresUnit = wxPresU() === 'inHg' ? 'hPa' : 'inHg';
  else if (fam === 'len') p.wxLenUnit = wxLenU() === 'imp' ? 'met' : 'imp';
  else return;
  p.unitsManual = true;
  save();
  // One whole-screen render converts every number at once, but mount() scrolls to the top. The
  // traveller tapped a unit somewhere down the page and should stay looking at it.
  pendingScrollY = window.scrollY;
  render();
}
// The 7-day rows the traveller has opened, so a unit tap or a background refresh — both of which
// repaint the list — does not snap them shut again.
const wxOpenDays = new Set();

// Label/value pairs as a two-column grid, which stays scannable where one dot-separated sentence
// stopped being readable past four facts. A pair with no value is left out, so a forecast cached
// before a field existed shows fewer cells rather than a row of "N/A".
function statGrid(pairs, cls) {
  const grid = h('div', { class: `wx-stats${cls ? ` ${cls}` : ''}` });
  pairs.forEach((p) => {
    if (!p || p[1] == null || p[1] === '') return;
    grid.append(h('div', { class: 'wx-stat' }, [
      h('span', { class: 'wx-stat-lbl' }, p[0]),
      h('span', { class: 'wx-stat-val' }, p[1]),
    ]));
  });
  return grid;
}

// ---- SUN AND MOON --------------------------------------------------------------
function fmtDaylight(sec) {
  if (sec == null) return '';
  const mins = Math.round(sec / 60);
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}
// Moon phase from the date alone, so it works offline: the new- and full-moon series from Meeus,
// Astronomical Algorithms ch. 49, with its fifteen largest terms. Checked against the eclipses of
// 7 Sep 2025, 3 Mar 2026 and 12 Aug 2026, it lands within two minutes. The mean-month shortcut can
// be half a day out, which is enough to name the wrong night for Koh Phangan's full-moon party,
// and spring tides follow new and full moon too.
function lunarJDE(k, full) {
  const T = k / 1236.85;
  const r = Math.PI / 180;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T) * r;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T * T * T) * r;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T * T * T) * r;
  const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * r;
  const [a, b, c, d, e2, f2, g] = full
    ? [-0.40614, 0.17302, 0.01614, 0.01043, 0.00734, -0.00515, 0.00209]
    : [-0.4072, 0.17241, 0.01608, 0.01039, 0.00739, -0.00514, 0.00208];
  const corr = a * Math.sin(Mp) + b * E * Math.sin(M) + c * Math.sin(2 * Mp) + d * Math.sin(2 * F)
    + e2 * E * Math.sin(Mp - M) + f2 * E * Math.sin(Mp + M) + g * E * E * Math.sin(2 * M)
    - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M)
    - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F)
    - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(O);
  return 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T * T * T + corr;
}
function moonNow(ms) {
  const jd = ms / 86400000 + 2440587.5;
  let k = Math.floor((jd - 2451550.09766) / 29.530588861);
  if (lunarJDE(k, false) > jd) k -= 1;
  else if (lunarJDE(k + 1, false) <= jd) k += 1;
  const n0 = lunarJDE(k, false);
  const n1 = lunarJDE(k + 1, false);
  const fullJ = lunarJDE(k + 0.5, true);
  // 0 new, 0.5 full, 1 new again. Piecewise, so 0.5 lands on the computed full moon itself: the
  // orbit is eccentric enough that full is rarely the midpoint between two new moons.
  const f = jd < fullJ ? (0.5 * (jd - n0)) / (fullJ - n0) : 0.5 + (0.5 * (jd - fullJ)) / (n1 - fullJ);
  const nextFullJ = fullJ > jd ? fullJ : lunarJDE(k + 1.5, true);
  const W = 1 / 29.53;   // about a day either side of an exact phase is "that" night
  let ph;
  if (f < W || f > 1 - W) ph = ['New moon', '🌑'];
  else if (Math.abs(jd - fullJ) < 1) ph = ['Full moon', '🌕'];
  else if (Math.abs(f - 0.25) < W) ph = ['First quarter', '🌓'];
  else if (Math.abs(f - 0.75) < W) ph = ['Last quarter', '🌗'];
  else if (f < 0.25) ph = ['Waxing crescent', '🌒'];
  else if (f < 0.5) ph = ['Waxing gibbous', '🌔'];
  else if (f < 0.75) ph = ['Waning gibbous', '🌖'];
  else ph = ['Waning crescent', '🌘'];
  return {
    name: ph[0], emoji: ph[1],
    lit: Math.round(((1 - Math.cos(2 * Math.PI * f)) / 2) * 100),
    nextFull: new Date((nextFullJ - 2440587.5) * 86400000),
  };
}
function sunMoonNode(day) {
  const box = h('div', { class: 'wx-sun' });
  if (day && day.sunrise && day.sunset) {
    box.append(h('p', { class: 'wx-sun-line' }, [
      `🌅 Sunrise ${wxTime(day.sunrise)} · 🌇 Sunset ${wxTime(day.sunset)}`,
      day.daylight ? h('span', { class: 'muted' }, ` · ${fmtDaylight(day.daylight)} of daylight`) : null,
    ]));
  }
  const moon = moonNow(Date.now());
  let full = '';
  if (moon.name !== 'Full moon') {
    try { full = ` · full moon ${moon.nextFull.toLocaleDateString(dateLocale(), { weekday: 'short', day: 'numeric', month: 'short' })}`; } catch { full = ''; }
  }
  box.append(h('p', { class: 'muted wx-moon-line' }, `${moon.emoji} ${moon.name} · ${moon.lit}% lit${full}`));
  return box;
}

// ---- TIDES ---------------------------------------------------------------------
// High and low water, read from the marine model's hourly sea level. Each turning point is refined
// with a parabola through it and its two neighbours, which recovers the time to within a few
// minutes of the curve the model drew; the model itself is the real limit, hence the card's
// footnote. Times are the city's own wall clock, like every other time on this screen.
function wxShiftIso(iso, minutes) {
  const d = new Date(iso.length === 16 ? `${iso}:00Z` : `${iso}Z`);
  if (isNaN(d)) return iso;
  d.setTime(d.getTime() + Math.round(minutes) * 60000);
  return d.toISOString().slice(0, 16);
}
function tideTurns(hourly) {
  const pts = (hourly || []).filter((x) => x && x.t && x.sl != null);
  const out = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1].sl, b = pts[i].sl, c = pts[i + 1].sl;
    const high = b > a && b >= c;
    if (!high && !(b < a && b <= c)) continue;
    const den = a - 2 * b + c;
    const off = den ? Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / den)) : 0;   // hours from pts[i]
    out.push({ type: high ? 'high' : 'low', t: wxShiftIso(pts[i].t, off * 60), h: b - 0.25 * (a - c) * off });
  }
  // A few centimetres of wobble around slack water is not a real high and low; drop such pairs.
  for (let i = 0; i < out.length - 1;) {
    if (Math.abs(out[i].h - out[i + 1].h) < 0.05) out.splice(i, 2);
    else i += 1;
  }
  return out;
}
// 'YYYY-MM-DDTHH:MM' now, on the city's clock when the record carries its offset (see cityNowIso),
// otherwise on the phone's.
function wxNowIso(rec) {
  const city = cityNowIso(rec && rec.utcOffset);
  if (city) return city;
  const n = new Date();
  const p2 = (v) => String(v).padStart(2, '0');
  return `${n.getFullYear()}-${p2(n.getMonth() + 1)}-${p2(n.getDate())}T${p2(n.getHours())}:${p2(n.getMinutes())}`;
}
function tideWhen(iso, nowIso) {
  return iso.slice(0, 10) === nowIso.slice(0, 10) ? wxTime(iso) : `${wxDay(iso.slice(0, 10))} ${wxTime(iso)}`;
}

// ---- SEA AND TIDES CARD --------------------------------------------------------
// Only for a city the marine model has water for. An inland city gets no card at all rather than
// an empty one; refreshMarine in js/weather.js is where that is decided.
function seaCard(rec, spot) {
  const card = h('div', { class: 'card wx-sea' }, [h('h3', { class: 'wx-sea-h' }, '🌊 Sea & tides')]);
  const wd = waveDesc(rec.waveHeight);
  const wdir = compass(rec.waveDir);
  card.append(h('p', { class: `wx-sea-line ${wd ? wd[1] : ''}` },
    `Waves ${fmtHeight(rec.waveHeight)}${wdir ? ` from ${wdir}` : ''}${rec.wavePeriod != null ? `, every ${Math.round(rec.wavePeriod)} s` : ''}${wd ? ` — ${wd[0]}` : ''}`));
  const sub = [];
  if (rec.swellHeight != null) {
    const sdir = compass(rec.swellDir);
    sub.push(`Swell ${fmtHeight(rec.swellHeight)}${sdir ? ` from ${sdir}` : ''}${rec.swellPeriod != null ? `, ${Math.round(rec.swellPeriod)} s` : ''}`);
  }
  if (rec.seaTemp != null) sub.push(`Water ${fmtTemp(rec.seaTemp)}`);
  if (sub.length) card.append(h('p', { class: 'muted wx-sea-sub' }, sub.join(' · ')));

  const nowIso = wxNowIso(rec);
  const next = tideTurns(rec.hourly).filter((x) => x.t > nowIso).slice(0, 4);
  if (next.length) {
    const up = next[0].type === 'high';
    card.append(h('div', { class: 'wx-now-div' }));
    card.append(h('p', { class: 'wx-tide-now' }, `Tide ${up ? 'rising' : 'falling'} · ${up ? 'high' : 'low'} water ${tideWhen(next[0].t, nowIso)}`));
    card.append(h('div', { class: 'wx-tides' }, next.map((x) => h('div', { class: `wx-tide ${x.type}` }, [
      h('span', { class: 'wx-tide-ic', 'aria-hidden': 'true' }, x.type === 'high' ? '▲' : '▼'),
      h('span', { class: 'wx-tide-lbl' }, x.type === 'high' ? 'High' : 'Low'),
      h('span', { class: 'wx-tide-t' }, tideWhen(x.t, nowIso)),
      h('span', { class: 'wx-tide-h' }, fmtHeight(x.h)),
    ]))));
  }

  const days = (rec.daily || []).filter((d) => d.whMax != null).slice(0, 7);
  if (days.length > 1) {
    card.append(h('div', { class: 'wx-now-div' }));
    card.append(h('div', { class: 'wx-sea-days-h' }, 'Highest waves by day'));
    card.append(h('div', { class: 'wx-sea-days' }, days.map((d) => {
      const dd = waveDesc(d.whMax);
      return h('div', { class: `wx-sea-day ${dd ? dd[1] : ''}` }, [
        h('span', { class: 'wx-sea-day-d' }, wxDay(d.date)),
        h('span', { class: 'wx-sea-day-v' }, fmtHeight(d.whMax)),
      ]);
    })));
  }

  // The model's grid point can sit well offshore (about 20 km for Da Nang), and its tides are a
  // global model's — close, but not a harbour table. Both are said, not implied.
  const foot = [];
  const km = rec.cell ? haversineKm({ lat: spot.lat, lng: spot.lng }, rec.cell) : null;
  if (km != null && km >= 3) foot.push(`Sea model point ~${fmtDist(km * 1000)} offshore`);
  if (next.length) foot.push('tides are modelled, not for navigation');
  foot.push(`updated ${wxAgo(rec.fetchedAt)}`);
  const line = foot.join(' · ');
  card.append(h('p', { class: 'muted small wx-sea-foot' }, line.charAt(0).toUpperCase() + line.slice(1)));
  return card;
}

// Split a day's hourly readings into parts of the day so the forecast can say, e.g.,
// "rain in the afternoon". Code = the most significant (max WMO) hour in the window.
const WX_SEGMENTS = [
  { label: 'Morning', from: 6, to: 12 },
  { label: 'Afternoon', from: 12, to: 18 },
  { label: 'Evening', from: 18, to: 24 },
  { label: 'Night', from: 0, to: 6 },
];
function daySegments(hourly, date) {
  if (!Array.isArray(hourly)) return [];
  const hrs = hourly.filter((h) => (h.t || '').slice(0, 10) === date);
  return WX_SEGMENTS.map((seg) => {
    const inSeg = hrs.filter((h) => { const hr = +(h.t || '').slice(11, 13); return hr >= seg.from && hr < seg.to; });
    if (!inSeg.length) return null;
    const hums = inSeg.map((h) => h.hum).filter((v) => v != null);
    return {
      label: seg.label,
      code: Math.max(...inSeg.map((h) => h.code || 0)),
      pp: Math.max(...inSeg.map((h) => (h.pp == null ? 0 : h.pp))),
      precip: inSeg.reduce((a, h) => a + (h.precip || 0), 0),
      snow: inSeg.reduce((a, h) => a + (h.snow || 0), 0),
      tmin: Math.min(...inSeg.map((h) => h.temp)),
      tmax: Math.max(...inSeg.map((h) => h.temp)),
      hum: hums.length ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : null,
    };
  }).filter(Boolean);
}

// Rain always reads as probability + amount together, in that order — a bare "70%" doesn't
// say whether to expect a light shower or a downpour. Snow only ever renders when the
// forecast genuinely has some (the far-northern mountains — Sapa, Ha Giang, Phongsali — in a
// cold winter snap; everywhere else this app covers is always 0), so it is gated on a
// non-zero amount rather than padding every row with "❄️0 cm".
function rainLine(prob, mm, snowCm) {
  const parts = [];
  if (prob != null) parts.push(`💧${prob}%${mm > 0 ? ` (${fmtPrecip(mm)})` : ''}`);
  if (snowCm > 0) parts.push(`❄️${fmtSnow(snowCm)}`);
  return parts.length ? ` · ${parts.join(' · ')}` : '';
}

// ---- PLAN-AWARE WEATHER: multi-city forecasts + a trip calendar --------------
// A "plan" is store.trip.stops — an ordered list of { id, title, country, date }.
// Each stop resolves to a weather spot via spotForCity(); several stops may share a
// spot. When a plan exists the weather section shows every plan city as its own
// collapsible forecast (first city open, the rest closed, and each city's choice is
// then remembered), plus a day-by-day calendar mapping each planned date to the city
// the traveller will be in with that day's forecast where it is within the coming week.
const WX_CC_ALL = ['th', 'vi', 'kh', 'la'];
function stopSpot(stop) {
  if (!stop || !stop.title) return null;
  if (stop.country) { const s = spotForCity(stop.country, stop.title); if (s) return s; }
  // A stop with no country (quick-add / shared import): try every country.
  for (const cc of WX_CC_ALL) { const s = spotForCity(cc, stop.title); if (s) return s; }
  return null;
}
function wxIsISO(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ''); }
// Date math is done entirely in UTC so slicing toISOString() cannot shift a day in
// positive-offset timezones. (Weekday/short labels below stay local for display.)
function wxAddDays(iso, n) { const dt = new Date(iso + 'T00:00:00Z'); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10); }
function wxDayShort(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' }); } catch { return d; } }
function wxWeekdayNum(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(dateLocale(), { weekday: 'short', day: 'numeric' }); } catch { return d; } }

// Distinct plan cities in itinerary order (deduped by weather spot), each carrying the
// stop dates that map to it, plus any stops whose title matched no weather station.
function planCities() {
  const stops = (store.trip && store.trip.stops) || [];
  const seen = new Map();
  const unresolved = [];
  stops.forEach((st) => {
    const spot = stopSpot(st);
    if (!spot) { if (st && st.title) unresolved.push(st); return; }
    const key = spotKey(spot);
    if (!seen.has(key)) seen.set(key, { key, spot, title: st.title, dates: [] });
    if (wxIsISO(st.date)) seen.get(key).dates.push(st.date);
    if (wxIsISO(st.endDate)) seen.get(key).dates.push(st.endDate);
  });
  return { cities: [...seen.values()], unresolved };
}

// The day-by-day trip-itinerary calendar (planCalendar/planCalendarCard) that used to lead
// the Weather screen was removed — the weather "Upcoming forecast" calendar (wxVizCard,
// below) is now this screen's one calendar. planCities()/planCityPanels() (still used for
// "Weather in your trip cities") are unaffected.
function planCityPanels() {
  const { cities, unresolved } = planCities();
  const wrap = h('div', { class: 'wx-cities' });
  if (!cities.length) {
    if (unresolved.length) wrap.append(h('p', { class: 'muted', style: 'margin: var(--sp-1) var(--sp-0h)' },
      `No forecast station matched your stops (${unresolved.map((s) => s.title).slice(0, 6).join(', ')}). Rename a stop to a nearby city to see its weather.`));
    return wrap;
  }
  if (!store.profile.prefs.wxCityOpen || typeof store.profile.prefs.wxCityOpen !== 'object') store.profile.prefs.wxCityOpen = {};
  const openMap = store.profile.prefs.wxCityOpen;
  cities.forEach((c, i) => {
    const det = h('details', { class: 'wx-city' });
    // First plan city opens by default; the rest start closed. Once the traveller
    // toggles a city, that explicit choice is remembered and wins on every return.
    const open = (c.key in openMap) ? !!openMap[c.key] : (i === 0);
    if (open) det.setAttribute('open', '');
    det.addEventListener('toggle', () => { openMap[c.key] = det.open; save(); });
    const sum = h('summary', { class: 'wx-city-sum' });
    const bodyBox = h('div', { class: 'wx-city-body' });
    det.append(sum, bodyBox);
    const cc = getCountry(c.spot.country);
    const ds = c.dates.slice().sort();
    const dateLabel = ds.length ? (ds.length > 1 ? `${wxDayShort(ds[0])}–${wxDayShort(ds[ds.length - 1])}` : wxDayShort(ds[0])) : '';
    const paintCity = (rec) => {
      const cur = rec && rec.current;
      const cemoji = cur ? wmo(cur.code)[1] : '🌡️';
      const clabel = cur ? wmo(cur.code)[0] : '';
      sum.innerHTML = '';
      sum.append(
        h('span', { class: 'wx-city-emoji' }, cemoji),
        h('span', { class: 'wx-city-name' }, `${cc ? cc.flag + ' ' : ''}${c.title}`),
        dateLabel ? h('span', { class: 'wx-city-dates muted' }, dateLabel) : null,
        h('span', { class: 'wx-city-now' }, cur ? `${fmtTemp(cur.temp)} · 💧${cur.humidity}%` : 'No forecast'),
      );
      bodyBox.innerHTML = '';
      if (!cur) {
        bodyBox.append(h('p', { class: 'muted', style: 'margin: var(--sp-2) 0' },
          'Connect once and tap Refresh below to download this city’s forecast for offline use.'));
        return;
      }
      bodyBox.append(h('div', { class: 'muted', style: 'margin: var(--sp-2) 0 var(--sp-1)' },
        `${clabel} · Feels ${fmtTemp(cur.apparent)} · Humidity ${cur.humidity}% · Wind ${fmtWind(cur.wind)}${compass(cur.windDir) ? ` from ${compass(cur.windDir)}` : ''}`
        + `${cur.precip > 0 ? ` · 💧${fmtPrecip(cur.precip)} now` : ''}${cur.snow > 0 ? ` · ❄️${fmtSnow(cur.snow)} now` : ''}`));
      (rec.daily || []).slice(0, 7).forEach((d) => {
        const de = wmo(d.code)[1];
        const dl = wmo(d.code)[0];
        const segs = daySegments(rec.hourly, d.date);
        const hums = segs.map((s) => s.hum).filter((v) => v != null);
        const dayHum = hums.length ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : null;
        bodyBox.append(h('div', { class: 'row-between wx-city-day' }, [
          h('span', { style: 'min-width:92px;font-weight:600' }, wxDayDate(d.date)),
          h('span', { style: 'font-size:18px' }, de),
          h('span', { class: 'muted grow', style: 'margin: 0 var(--sp-2)' },
            `${dl}${rainLine(d.rainProb, d.precip, d.snow)}${dayHum != null ? ` · Hum ${dayHum}%` : ''}`),
          h('span', { style: 'font-weight:700;white-space:nowrap' }, `${fmtTemp(d.tmin)} / ${fmtTemp(d.tmax)}`),
        ]));
      });
      if (rec.fetchedAt) bodyBox.append(h('div', { class: 'muted', style: 'text-align:right;font-size:12px;margin-top: var(--sp-1h)' }, `Updated ${wxAgo(rec.fetchedAt)}`));
    };
    paintCity(getCachedWeather(c.key));
    // Background refresh only if the traveller has opted online; repaint if still here.
    if (online()) maybeRefreshWeather(c.spot).then((r) => { if (r && (location.hash || '').startsWith('#weather')) paintCity(r); });
    wrap.append(det);
  });
  if (unresolved.length) wrap.append(h('p', { class: 'muted', style: 'margin: var(--sp-1h) var(--sp-0h) 0;font-size:12px' },
    `Also on your calendar (no forecast station matched): ${unresolved.map((s) => s.title).slice(0, 6).join(', ')}.`));
  return wrap;
}

export function weatherScreen(country) {
  const wrap = h('div', { class: 'screen wx-screen' });
  // "Weather" alone matches every chip that links here (Home, the country-scoped chip) — the
  // old title was the only place adding "& forecast", and it 3-line-wrapped on mobile besides.
  wrap.append(topbar('Weather', getCountry(country) ? `#country-${country}` : '#home'));
  // Seed the city from the country arg ONLY when first arriving at this route — otherwise
  // every render (e.g. a city-chip click, which calls render()) would overwrite the user's
  // choice back to the focus city. That was the "weather buttons do nothing" bug.
  const curHash = location.hash || '#weather';
  if (country && weatherSeededHash !== curHash) { seedWeatherKey(spotKey(focusSpot(country).spot)); weatherSeededHash = curHash; }
  if (!currentWeatherKey()) seedWeatherKey(spotKey(focusSpot().spot));
  let spot = WEATHER_SPOTS.find((s) => spotKey(s) === currentWeatherKey()) || defaultSpot('th');

  // Units switch where they are printed — tap °C, km/h, mm, m or hPa anywhere below (tapUnits,
  // above). How to use the screen lives behind the ⓘ, not in front of the forecast.
  wrap.append(screenHint('Tap any unit, like °C, km/h, mm or m, to switch it. Tap a day in the 7-day forecast for its morning, afternoon, evening and night.', 'About this screen'));
  tapUnits(wrap, toggleUnit);

  let curCountry = spot.country;

  // Current city detail leads the screen: Right now, then Next 24 hours + Upcoming
  // forecast calendar (wxVizCard, in that order), then the 7-day list and Refresh.
  // This is now the screen's own top "calendar" — the old day-by-day TRIP-itinerary
  // calendar that used to occupy this spot is gone (see below).
  const body = h('div', {});
  wrap.append(body);

  function paint(rec, loading) {
    body.innerHTML = '';
    if (!rec) {
      body.append(h('div', { class: 'card' }, [
        h('p', {}, loading ? 'Fetching the latest forecast…' : 'No saved forecast yet for this city.'),
        h('p', { class: 'muted' }, 'Connect to the internet once and tap Refresh to download it. The forecast is then stored on your device for offline viewing.'),
      ]));
    } else {
      // "Right now" — temp, air quality and UV used to be three separate stacked cards
      // saying the same thing ("this is the current situation") in three different boxes.
      // One card, thin dividers between the three lines, reads as one answer instead of three.
      const c = rec.current;
      const today = rec.daily && rec.daily[0];
      const [clabel, cemoji] = wmo(c.code);
      const cdir = compass(c.windDir);
      const rightNow = h('div', { class: 'card wx-now' }, [
        h('div', { class: 'row-between' }, [
          h('span', { style: 'font-size:44px;line-height:1' }, cemoji),
          h('div', { style: 'text-align:right' }, [
            h('div', { style: 'font-size:34px;font-weight:800' }, fmtTemp(c.temp)),
            h('div', { class: 'muted' }, clabel),
          ]),
        ]),
        h('div', { class: 'muted', style: 'margin-top: var(--sp-2)' }, `${spot.city}${today ? ' · ' + wxDayDate(today.date) : ''}`),
        statGrid([
          ['Feels like', fmtTemp(c.apparent)],
          ['Humidity', c.humidity != null ? `${c.humidity}%` : null],
          // How muggy it actually feels: above ~24°C is oppressive whatever the humidity says.
          ['Dew point', c.dew != null ? fmtTemp(c.dew) : null],
          ['Wind', `${fmtWind(c.wind)}${cdir ? ` from ${cdir}` : ''}`],
          ['Gusts', c.gust != null ? fmtWind(c.gust) : null],
          ['Rain today', today && today.rainProb != null ? `${today.rainProb}%${today.precip > 0 ? ` · ${fmtPrecip(today.precip)}` : ''}` : null],
          ['Cloud cover', c.cloud != null ? `${c.cloud}%` : null],
          ['Visibility', c.vis != null ? fmtDist(c.vis) : null],
          ['Pressure', c.pressure != null ? fmtPres(c.pressure) : null],
          ['Rain now', c.precip > 0 ? fmtPrecip(c.precip) : null],
          ['Snow now', c.snow > 0 ? fmtSnow(c.snow) : null],
        ]),
      ]);
      rightNow.append(h('div', { class: 'wx-now-div' }), sunMoonNode(today));
      rightNow.append(h('div', { class: 'wx-now-div' }), airBlock(spot));
      if (today) {
        const uvn = uvLineNode(today.uv, { advice: true });
        if (uvn) rightNow.append(h('div', { class: 'wx-now-div' }), uvn);
      }
      body.append(rightNow);
      // Waves, swell, water temperature and tides for a coastal city; nothing at all inland.
      const seaSlot = h('div', {});
      body.append(seaSlot);
      fillSea(seaSlot);
      if (rec.hourly && rec.hourly.length) body.append(wxVizCard(rec, spot, { keepState: true }));
      const fc = h('div', { class: 'card' }, [h('h3', {}, '7-day forecast')]);
      // The day's highest waves ride along for a coastal city, from whatever sea state is cached.
      const sea = getCachedMarine({ lat: spot.lat, lng: spot.lng });
      const seaDay = new Map(((sea && sea.daily) || []).map((x) => [x.date, x]));
      rec.daily.slice(0, 7).forEach((d) => {
        const [dl, de] = wmo(d.code);
        const openKey = `${spotKey(spot)}|${d.date}`;
        const isOpen = wxOpenDays.has(openKey);
        const detail = h('div', { style: `display:${isOpen ? 'block' : 'none'};margin-top: var(--sp-1h)` });
        const segs = daySegments(rec.hourly, d.date);
        const dayHums = segs.map((s) => s.hum).filter((v) => v != null);
        const dayHum = dayHums.length ? Math.round(dayHums.reduce((a, b) => a + b, 0) / dayHums.length) : null;
        const ddir = compass(d.windDir);
        const sd = seaDay.get(d.date);
        detail.append(statGrid([
          ['Feels like', `${fmtTemp(d.appMin)} – ${fmtTemp(d.appMax)}`],
          ['Rain', d.precip != null ? fmtPrecip(d.precip) : null],
          ['Snow', d.snow > 0 ? fmtSnow(d.snow) : null],
          ['Humidity', dayHum != null ? `${dayHum}%` : null],
          ['UV', d.uv != null ? String(Math.round(d.uv)) : null],
          ['Wind', d.windMax != null ? `up to ${fmtWind(d.windMax)}${ddir ? ` from ${ddir}` : ''}` : null],
          ['Gusts', d.gustMax != null ? `up to ${fmtWind(d.gustMax)}` : null],
          ['Waves', sd && sd.whMax != null ? `up to ${fmtHeight(sd.whMax)}` : null],
          ['Sunrise', d.sunrise ? wxTime(d.sunrise) : null],
          ['Sunset', d.sunset ? `${wxTime(d.sunset)}${d.daylight ? ` · ${fmtDaylight(d.daylight)}` : ''}` : null],
        ], 'wx-day-stats'));
        if (segs.length) {
          segs.forEach((s) => {
            const [sl, se] = wmo(s.code);
            detail.append(h('div', { class: 'row-between', style: 'padding: var(--sp-1) 0;border-top:1px solid rgba(0,0,0,0.06)' }, [
              h('span', { style: 'min-width:78px;font-weight:600' }, s.label),
              h('span', { style: 'font-size:18px' }, se),
              h('span', { class: 'muted grow', style: 'margin: 0 var(--sp-2);text-align:left' }, `${sl}${rainLine(s.pp, s.precip, s.snow)}${s.hum != null ? ` · Humidity ${s.hum}%` : ''}`),
              h('span', {}, `${fmtTemp(s.tmin)}/${fmtTemp(s.tmax)}`),
            ]));
          });
        } else {
          detail.append(h('p', { class: 'muted' }, 'Hourly breakdown unavailable — tap Refresh while online.'));
        }
        const head = h('button', {
          style: 'display:block;width:100%;background:none;border:none;padding: var(--sp-1h) 0;text-align:left;cursor:pointer;font:inherit;color:inherit;border-top:1px solid rgba(0,0,0,0.07)',
          'aria-expanded': isOpen ? 'true' : 'false',
          onclick: () => {
            const open = detail.style.display === 'none';
            detail.style.display = open ? 'block' : 'none';
            head.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) wxOpenDays.add(openKey); else wxOpenDays.delete(openKey);
          },
        }, [
          h('div', { class: 'row-between' }, [
            h('span', { style: 'min-width:104px;font-weight:700' }, wxDayDate(d.date)),
            h('span', { style: 'font-size:20px' }, de),
            h('span', { class: 'muted grow', style: 'margin: 0 var(--sp-2)' }, `${dl}${rainLine(d.rainProb, d.precip, d.snow)}${dayHum != null ? ` · Hum ${dayHum}%` : ''}`),
            h('span', { style: 'font-weight:700' }, `${fmtTemp(d.tmin)} / ${fmtTemp(d.tmax)}`),
            h('span', { class: 'muted', style: 'margin-left: var(--sp-1h)' }, '⌄'),
          ]),
        ]);
        fc.append(head, detail);
      });
      body.append(fc);
      body.append(h('p', { class: 'muted', style: 'text-align:center' }, `Last updated ${wxAgo(rec.fetchedAt)}${navigator.onLine ? '' : ' · offline'}`));
    }
    const refreshBtn = h('button', { class: 'btn block' }, 'Refresh (needs internet)');
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.textContent = 'Refreshing…'; refreshBtn.disabled = true;
      // Forced: the traveller asked. Falls back to the cache so an offline tap still repaints
      // with what is held rather than blanking the card.
      const r = (await maybeRefreshWeather(spot, true)) || getCachedWeather(spotKey(spot));
      paint(r, false);
    });
    body.append(refreshBtn);
    retranslate(body);
  }

  // The sea card paints from cache at once and refreshes in the background, repainting only
  // itself. Offline with nothing cached it stays empty: for a city never looked up, there is no
  // way to know whether it is coastal, and a "sea loads when online" card on Chiang Mai is noise.
  function fillSea(slot) {
    const coords = { lat: spot.lat, lng: spot.lng };
    const draw = (m) => {
      slot.innerHTML = '';
      if (m && m.waveHeight != null) slot.append(seaCard(m, spot));
      retranslate(slot);
    };
    draw(getCachedMarine(coords));
    if (online()) maybeRefreshMarine(coords).then((r) => { if (r && slot.isConnected) draw(r); });
  }

  // Loads the cached reading for the CURRENT spot, paints it, then refreshes in the
  // background if online. The background refresh's own repaint is left exactly as it
  // always was — a quiet in-place update of `body`, no scroll handling — since a same-city
  // refresh rarely changes the page's height enough to move the scroll position, and this
  // path already ran on every visit without complaint. switchSpot() (below) is the one
  // that needs to guard scroll: it never calls the global render() (which would jump the
  // page to the top via mount()'s window.scrollTo(0,0)), but it does deliberately swap in a
  // whole new city's cards, so it restores the traveller's scroll position afterwards.
  function loadAndPaint() {
    const cached = getCachedWeather(currentWeatherKey());
    paint(cached, !cached && online());
    if (online()) {
      maybeRefreshWeather(spot).then((r) => {
        if ((location.hash || '').startsWith('#weather') && spotKey(spot) === currentWeatherKey() && r) paint(r, false);
      });
    }
  }
  function switchSpot(key) {
    if (!key || key === currentWeatherKey()) return;
    const y = window.scrollY;
    seedWeatherKey(key);
    spot = WEATHER_SPOTS.find((s) => spotKey(s) === currentWeatherKey()) || spot;
    // Switching (unlike the map's own country) can jump to a city in a different country —
    // the map must then redraw for THAT country, and its cities' current temps need their
    // own fetch (the cached "many" batch was fetched for the old country's cities).
    const countryChanged = spot.country !== curCountry;
    if (countryChanged) curCountry = spot.country;
    renderMap(getCachedMany() && getCachedMany().data);
    // Forced, not guarded: the cached batch was fetched for the country being left, so it is
    // fresh by age and wrong by content. Staleness cannot see that; the caller can.
    if (countryChanged && online()) maybeRefreshMany(spotsForCountry(curCountry), true).then((r) => { if (r && spot.country === curCountry) renderMap(r.data); });
    loadAndPaint();
    requestAnimationFrame(() => window.scrollTo(0, y));
  }
  loadAndPaint();

  // Weather in your trip cities — every dated stop's own collapsible forecast. No leading
  // itinerary calendar here any more (that "Trip calendar" used to sit at the very top of
  // this whole screen; the weather calendar above is now this screen's one calendar).
  const planStops = (store.trip && store.trip.stops) || [];
  const pc = planCities();
  if (planStops.length && (pc.cities.length || pc.unresolved.length)) {
    wrap.append(h('h3', { class: 'wx-plan-h' }, 'Weather in your trip cities'));
    wrap.append(planCityPanels());
  }

  // Look up another city — tap the map, or type/pick any city across all four countries.
  wrap.append(h('h3', { class: 'wx-plan-h' }, 'Look up another city'));

  // Forecast map: the region with this country's cities plotted, each showing its
  // current temperature (one batched fetch), tappable to switch city.
  const mapBox = h('div', {});
  wrap.append(mapBox);
  function renderMap(many) {
    // Hubs, plus the selected city when it is an anchor rather than a hub — otherwise
    // choosing e.g. Koh Lanta from the search box left the map with no dot highlighted at
    // all. Only the one selected anchor is added; drawing all 101 would bury the map.
    const hubs = spotsForCountry(curCountry);
    const sel = WEATHER_SPOTS.find((s) => spotKey(s) === currentWeatherKey());
    const cities = (sel && sel.country === curCountry && !sel.hub) ? hubs.concat([sel]) : hubs;
    const paths = COUNTRIES.map((c) => REGION_PATHS[c.id]
      ? `<path d="${REGION_PATHS[c.id]}" fill="${c.id === curCountry ? '#F1E3C6' : '#E9DCC2'}" stroke="#D8C39A" stroke-width="1.5" opacity="${c.id === curCountry ? 1 : 0.45}"/>` : '').join('');
    const dots = cities.map((s) => {
      const [x, y] = projLL(s.lng, s.lat);
      const w = many && many[spotKey(s)];
      const sel = spotKey(s) === currentWeatherKey();
      const temp = w ? `${wxTempVal(w.temp)}°` : '';
      const emo = w ? wmo(w.code)[1] : '';
      return `<g class="wx-dot" data-key="${spotKey(s)}" style="cursor:pointer">
          <text x="${x}" y="${y - 14}" text-anchor="middle" style="font-size:24px">${emo}</text>
          <circle cx="${x}" cy="${y}" r="${sel ? 9 : 6}" fill="${sel ? '#C0431A' : '#2C7DA0'}" stroke="#FFFDF5" stroke-width="2.5"/>
          <text x="${x}" y="${y + 26}" text-anchor="middle" style="font-size:21px;font-weight:800;fill:#2A2118;paint-order:stroke;stroke:rgba(255,253,245,0.9);stroke-width:5px">${esc(s.city)} ${temp}</text>
        </g>`;
    }).join('');
    const svg = `<svg viewBox="${REGION_VIEWBOX}" class="region-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Weather map" xmlns="http://www.w3.org/2000/svg">${paths}${dots}</svg>`;
    mapBox.innerHTML = '';
    const box = h('div', { class: 'region-map', html: svg });
    box.querySelectorAll('.wx-dot').forEach((g) => g.addEventListener('click', () => switchSpot(g.getAttribute('data-key'))));
    box.append(h('span', { class: 'region-cap' }, many ? 'Tap a city for its full forecast' : 'Connect once to load city temperatures'));
    mapBox.append(box);
  }
  renderMap(getCachedMany() && getCachedMany().data);
  if (online()) maybeRefreshMany(spotsForCountry(curCountry)).then((r) => { if (r && (location.hash || '').startsWith('#weather')) renderMap(r.data); });

  // Free-text search across every city in all four countries — a native datalist (offline,
  // no extra library) types ahead as the traveller types and jumps straight to that city's
  // forecast on an exact match, exactly like tapping it on the map above.
  const cityDatalistId = 'wx-city-list';
  const citySearchInput = h('input', {
    type: 'text', class: 'search', list: cityDatalistId, placeholder: '🔎 Search any city…',
    onchange: (e) => {
      const val = e.target.value.trim().toLowerCase();
      const hit = WEATHER_SPOTS.find((s) => `${s.city}, ${(getCountry(s.country) || {}).name || s.country}`.toLowerCase() === val || s.city.toLowerCase() === val);
      if (hit) switchSpot(spotKey(hit));
    },
  });
  const cityDatalist = h('datalist', { id: cityDatalistId },
    WEATHER_SPOTS.map((s) => h('option', { value: `${s.city}, ${(getCountry(s.country) || {}).name || s.country}` })));
  wrap.append(h('div', { class: 'card' }, [field('Search any city', citySearchInput), cityDatalist]));

  mount(wrap, '#home');
  if (pendingScrollY != null) { const y = pendingScrollY; pendingScrollY = null; window.scrollTo(0, y); }
}

// The hourly watch-face ring + month calendar (wxVizCard and everything under it — the
// selected-hour ring, the all-layers detail panel, the hourly strip, the upcoming-days grid)
// moved to js/weather-ui.js in mk-v0.504.0's launch-graph split (js/weather.js stays eager;
// this screen no longer does). This whole section was that code's documentation, left behind
// pointing at nothing — along with a `let wxMetric = 'temp';` that wxVizCard's own functions
// went on referencing as if it were still in scope, which a plain module import cannot do
// across files. It silently threw ReferenceError: Can't find variable: wxMetric the moment
// anyone actually opened the ring (mk-v0.508.0's live-testing never happened to). Fixed at
// the source: wxMetric now lives in weather-ui.js, next to the code that actually uses it.

