// Weather screens: full forecast, and the Home/place-card watch-face widget (wxVizCard).
// Extracted from main.js (module-split, see MASTER_BUILD_PROMPT.md) — the DATA/fetch layer
// stays in js/weather.js; this is the RENDERING layer only. weatherKey/weatherSeededHash are
// module-private city-selection state; weatherNearbyCard (main.js, a place-detail widget)
// seeds which city the full forecast opens to via the exported seedWeatherKey() rather than
// writing the module-private binding directly.
import { store, save, getLastFix, setLastFix } from '../state.js';
import { h, esc } from '../util.js';
import { wxTempU, wxWindU, fmtTemp, fmtWind, fmtPrecip, airBlock, uvLineNode } from '../render-utils.js';
import { field, online } from '../ui-widgets.js';
import {
  WEATHER_SPOTS, wmo, spotKey, spotsForCountry, defaultSpot,
  getCachedWeather, refreshWeather, refreshMany, getCachedMany,
} from '../weather.js';
import { COUNTRIES, getCountry } from '../data/regions.js';
import { REGION_PATHS, REGION_VIEWBOX, REGION_PROJ } from '../data/geo.js';
// Circular import back into main.js — same accepted pattern js/screens/home.js already uses
// (see home.js's own header comment): every one of these is only read inside a function body,
// never at module-evaluation time, so the cycle is safe.
import { topbar, mount, focusSpot, fmtClock, spotForCity } from '../main.js';

// ---- WEATHER + FORECAST -----------------------------------------------------
let weatherKey = '';   // remembered city selection across renders
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
function wxDay(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }); } catch { return d; } }
function wxDayDate(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); } catch { return d; } }
function wxTime(iso) { try { return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); } catch { return iso ? iso.slice(11, 16) : 'N/A'; } }
// Project lng/lat onto the same map as the landing-page country outlines.
function projLL(lng, lat) { const P = REGION_PROJ; return [P.pad + (lng - P.minlng) * P.kx * P.scale, P.pad + (P.maxlat - lat) * P.scale]; }
function wxTempVal(c) { return wxTempU() === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c); }

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
      tmin: Math.min(...inSeg.map((h) => h.temp)),
      tmax: Math.max(...inSeg.map((h) => h.temp)),
      hum: hums.length ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : null,
    };
  }).filter(Boolean);
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
export function wxDiffDays(a, b) { return Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000); }
function wxDayShort(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch { return d; } }
function wxWeekdayNum(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }); } catch { return d; } }

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
    if (unresolved.length) wrap.append(h('p', { class: 'muted', style: 'margin:4px 2px' },
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
        bodyBox.append(h('p', { class: 'muted', style: 'margin:8px 0' },
          'Connect once and tap Refresh below to download this city’s forecast for offline use.'));
        return;
      }
      bodyBox.append(h('div', { class: 'muted', style: 'margin:8px 0 4px' },
        `${clabel} · Feels ${fmtTemp(cur.apparent)} · Humidity ${cur.humidity}% · Wind ${fmtWind(cur.wind)}`));
      (rec.daily || []).slice(0, 7).forEach((d) => {
        const de = wmo(d.code)[1];
        const dl = wmo(d.code)[0];
        const segs = daySegments(rec.hourly, d.date);
        const hums = segs.map((s) => s.hum).filter((v) => v != null);
        const dayHum = hums.length ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length) : null;
        bodyBox.append(h('div', { class: 'row-between wx-city-day' }, [
          h('span', { style: 'min-width:92px;font-weight:600' }, wxDayDate(d.date)),
          h('span', { style: 'font-size:18px' }, de),
          h('span', { class: 'muted grow', style: 'margin:0 8px' },
            `${dl}${d.rainProb != null ? ` · 💧${d.rainProb}%` : ''}${dayHum != null ? ` · Hum ${dayHum}%` : ''}`),
          h('span', { style: 'font-weight:700;white-space:nowrap' }, `${fmtTemp(d.tmin)} / ${fmtTemp(d.tmax)}`),
        ]));
      });
      if (rec.fetchedAt) bodyBox.append(h('div', { class: 'muted', style: 'text-align:right;font-size:12px;margin-top:6px' }, `Updated ${wxAgo(rec.fetchedAt)}`));
    };
    paintCity(getCachedWeather(c.key));
    // Background refresh only if the traveller has opted online; repaint if still here.
    if (online()) refreshWeather(c.spot).then((r) => { if (r && (location.hash || '').startsWith('#weather')) paintCity(r); });
    wrap.append(det);
  });
  if (unresolved.length) wrap.append(h('p', { class: 'muted', style: 'margin:6px 2px 0;font-size:12px' },
    `Also on your calendar (no forecast station matched): ${unresolved.map((s) => s.title).slice(0, 6).join(', ')}.`));
  return wrap;
}

export function weatherScreen(country) {
  const wrap = h('div', { class: 'screen' });
  // "Weather" alone matches every chip that links here (Home, the country-scoped chip) — the
  // old title was the only place adding "& forecast", and it 3-line-wrapped on mobile besides.
  wrap.append(topbar('Weather', getCountry(country) ? `#country-${country}` : '#home'));
  // Seed the city from the country arg ONLY when first arriving at this route — otherwise
  // every render (e.g. a city-chip click, which calls render()) would overwrite the user's
  // choice back to the focus city. That was the "weather buttons do nothing" bug.
  const curHash = location.hash || '#weather';
  if (country && weatherSeededHash !== curHash) { weatherKey = spotKey(focusSpot(country).spot); weatherSeededHash = curHash; }
  if (!weatherKey) weatherKey = spotKey(focusSpot().spot);
  let spot = WEATHER_SPOTS.find((s) => spotKey(s) === weatherKey) || defaultSpot('th');

  // Unit toggles (°C/°F, km/h/mph) — persist in the profile and re-render.
  const setTemp = (u) => { store.profile.wxTempUnit = u; save(); render(); };
  const setWind = (u) => { store.profile.wxWindUnit = u; save(); render(); };
  const unitChip = (label, active, onclick) => h('button', { class: 'chip', 'aria-pressed': active ? 'true' : 'false', onclick }, label);
  wrap.append(h('div', { class: 'chips wx-units', style: 'margin-bottom:6px' }, [
    h('span', { class: 'wx-units-label' }, 'Units'),
    unitChip('°C', wxTempU() === 'C', () => setTemp('C')),
    unitChip('°F', wxTempU() === 'F', () => setTemp('F')),
    unitChip('km/h', wxWindU() === 'kmh', () => setWind('kmh')),
    unitChip('mph', wxWindU() === 'mph', () => setWind('mph')),
  ]));

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
      const [clabel, cemoji] = wmo(rec.current.code);
      const rightNow = h('div', { class: 'card wx-now' }, [
        h('div', { class: 'row-between' }, [
          h('span', { style: 'font-size:44px;line-height:1' }, cemoji),
          h('div', { style: 'text-align:right' }, [
            h('div', { style: 'font-size:34px;font-weight:800' }, fmtTemp(rec.current.temp)),
            h('div', { class: 'muted' }, clabel),
          ]),
        ]),
        h('div', { class: 'muted', style: 'margin-top:8px' },
          `${spot.city}${rec.daily && rec.daily[0] ? ' · ' + wxDayDate(rec.daily[0].date) : ''} · Feels ${fmtTemp(rec.current.apparent)} · Humidity ${rec.current.humidity}% · Wind ${fmtWind(rec.current.wind)}`),
      ]);
      rightNow.append(h('div', { class: 'wx-now-div' }), airBlock(spot));
      if (rec.daily && rec.daily[0]) {
        const uvn = uvLineNode(rec.daily[0].uv, { advice: true });
        if (uvn) rightNow.append(h('div', { class: 'wx-now-div' }), uvn);
      }
      body.append(rightNow);
      if (rec.hourly && rec.hourly.length) body.append(wxVizCard(rec, spot));
      const fc = h('div', { class: 'card' }, [
        h('h3', { style: 'margin-top:0' }, '7-day forecast'),
        h('p', { class: 'muted', style: 'margin:0 0 4px' }, 'Tap a day for the morning / afternoon / evening / night breakdown.'),
      ]);
      rec.daily.slice(0, 7).forEach((d) => {
        const [dl, de] = wmo(d.code);
        const detail = h('div', { style: 'display:none;margin-top:6px' });
        const segs = daySegments(rec.hourly, d.date);
        const dayHums = segs.map((s) => s.hum).filter((v) => v != null);
        const dayHum = dayHums.length ? Math.round(dayHums.reduce((a, b) => a + b, 0) / dayHums.length) : null;
        detail.append(h('div', { class: 'muted', style: 'margin:4px 0 6px' },
          `Feels ${fmtTemp(d.appMin)}–${fmtTemp(d.appMax)} · Rain ${d.precip != null ? fmtPrecip(d.precip) : 'N/A'}${dayHum != null ? ` · Humidity ${dayHum}%` : ''} · UV ${d.uv != null ? Math.round(d.uv) : 'N/A'} · Wind to ${fmtWind(d.windMax)} · ☀ ${wxTime(d.sunrise)}–${wxTime(d.sunset)}`));
        if (segs.length) {
          segs.forEach((s) => {
            const [sl, se] = wmo(s.code);
            detail.append(h('div', { class: 'row-between', style: 'padding:5px 0;border-top:1px solid rgba(0,0,0,0.06)' }, [
              h('span', { style: 'min-width:78px;font-weight:600' }, s.label),
              h('span', { style: 'font-size:18px' }, se),
              h('span', { class: 'muted grow', style: 'margin:0 8px;text-align:left' }, `${sl} · 💧${s.pp}%${s.hum != null ? ` · Humidity ${s.hum}%` : ''}`),
              h('span', {}, `${fmtTemp(s.tmin)}/${fmtTemp(s.tmax)}`),
            ]));
          });
        } else {
          detail.append(h('p', { class: 'muted' }, 'Hourly breakdown unavailable — tap Refresh while online.'));
        }
        const head = h('button', {
          style: 'display:block;width:100%;background:none;border:none;padding:6px 0;text-align:left;cursor:pointer;font:inherit;color:inherit;border-top:1px solid rgba(0,0,0,0.07)',
          onclick: () => { detail.style.display = detail.style.display === 'none' ? 'block' : 'none'; },
        }, [
          h('div', { class: 'row-between' }, [
            h('span', { style: 'min-width:104px;font-weight:700' }, wxDayDate(d.date)),
            h('span', { style: 'font-size:20px' }, de),
            h('span', { class: 'muted grow', style: 'margin:0 8px' }, `${dl}${d.rainProb != null ? ` · 💧${d.rainProb}%` : ''}${dayHum != null ? ` · Hum ${dayHum}%` : ''}`),
            h('span', { style: 'font-weight:700' }, `${fmtTemp(d.tmin)} / ${fmtTemp(d.tmax)}`),
            h('span', { class: 'muted', style: 'margin-left:6px' }, '⌄'),
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
      const r = await refreshWeather(spot); paint(r, false);
    });
    body.append(refreshBtn);
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
    const cached = getCachedWeather(weatherKey);
    paint(cached, !cached && online());
    if (online()) {
      refreshWeather(spot).then((r) => {
        if ((location.hash || '').startsWith('#weather') && spotKey(spot) === weatherKey && r) paint(r, false);
      });
    }
  }
  function switchSpot(key) {
    if (!key || key === weatherKey) return;
    const y = window.scrollY;
    weatherKey = key;
    spot = WEATHER_SPOTS.find((s) => spotKey(s) === weatherKey) || spot;
    // Switching (unlike the map's own country) can jump to a city in a different country —
    // the map must then redraw for THAT country, and its cities' current temps need their
    // own fetch (the cached "many" batch was fetched for the old country's cities).
    const countryChanged = spot.country !== curCountry;
    if (countryChanged) curCountry = spot.country;
    renderMap(getCachedMany() && getCachedMany().data);
    if (countryChanged && online()) refreshMany(spotsForCountry(curCountry)).then((r) => { if (r && spot.country === curCountry) renderMap(r.data); });
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
    const cities = spotsForCountry(curCountry);
    const paths = COUNTRIES.map((c) => REGION_PATHS[c.id]
      ? `<path d="${REGION_PATHS[c.id]}" fill="${c.id === curCountry ? '#F1E3C6' : '#E9DCC2'}" stroke="#D8C39A" stroke-width="1.5" opacity="${c.id === curCountry ? 1 : 0.45}"/>` : '').join('');
    const dots = cities.map((s) => {
      const [x, y] = projLL(s.lng, s.lat);
      const w = many && many[spotKey(s)];
      const sel = spotKey(s) === weatherKey;
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
  if (online()) refreshMany(spotsForCountry(curCountry)).then((r) => { if (r && (location.hash || '').startsWith('#weather')) renderMap(r.data); });

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
}

// ---- Weather visualisation: hourly watch-face ring + month calendar ----------
// Reads the already-cached hourly/daily records (no extra network). One metric at a
// time — temperature, rain chance, humidity, feels-like or wind — shown around a
// 24-hour clock-face ring and across a month calendar. wxMetric persists for the session.
let wxMetric = 'temp';
const WX_METRICS = {
  temp:  { label: '🌡 Temp',     hourly: (x) => x.temp, daily: (d) => d.tmax,     fmt: (v) => (v == null ? 'N/A' : fmtTemp(v)) },
  rain:  { label: '💧 Rain',     hourly: (x) => x.pp,   daily: (d) => d.rainProb, fmt: (v) => (v == null ? 'N/A' : Math.round(v) + '%'), min: 0, max: 100 },
  hum:   { label: '💦 Humidity', hourly: (x) => x.hum,  daily: null,              fmt: (v) => (v == null ? 'N/A' : Math.round(v) + '%'), min: 0, max: 100 },
  uv:    { label: '☀ UV',       hourly: (x) => x.uv,   daily: (d) => d.uv,       fmt: (v) => (v == null ? 'N/A' : String(Math.round(v))), min: 0, max: 12 },
  feels: { label: '🥵 Feels',    hourly: (x) => x.app,  daily: (d) => d.appMax,   fmt: (v) => (v == null ? 'N/A' : fmtTemp(v)) },
  wind:  { label: '💨 Wind',     hourly: (x) => x.wind, daily: (d) => d.windMax,  fmt: (v) => (v == null ? 'N/A' : fmtWind(v)) },
};
// UV uses the internationally-recognised index bands (green/yellow/orange/red/purple),
// not a smooth gradient — a UV reading is meaningful in absolute terms, not relative to
// that single day's own min/max, so it ignores the passed lo/hi range entirely.
function wxUvColor(v) {
  if (v <= 2) return '#4CAF50';
  if (v <= 5) return '#FBC02D';
  if (v <= 7) return '#FB8C00';
  if (v <= 10) return '#E53935';
  return '#8E24AA';
}
function wxMetricColor(metric, v, lo, hi) {
  if (v == null) return 'rgba(140,140,150,0.20)';
  if (metric === 'uv') return wxUvColor(v);
  const t = hi > lo ? Math.max(0, Math.min(1, (v - lo) / (hi - lo))) : 0.5;
  if (metric === 'rain' || metric === 'hum') return `hsl(205, ${35 + t * 55}%, ${90 - t * 48}%)`;
  if (metric === 'wind') return `hsl(${140 - t * 110}, 62%, ${68 - t * 20}%)`;
  return `hsl(${(1 - t) * 214}, 72%, ${61 - t * 7}%)`;   // temp / feels: blue → red
}
function wxArcWedge(cx, cy, rIn, rOut, a0, a1) {
  const P = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [xo0, yo0] = P(rOut, a0), [xo1, yo1] = P(rOut, a1), [xi1, yi1] = P(rIn, a1), [xi0, yi0] = P(rIn, a0);
  const large = (a1 - a0) > Math.PI ? 1 : 0;
  return `M${xo0.toFixed(1)},${yo0.toFixed(1)} A${rOut},${rOut} 0 ${large} 1 ${xo1.toFixed(1)},${yo1.toFixed(1)} L${xi1.toFixed(1)},${yi1.toFixed(1)} A${rIn},${rIn} 0 ${large} 0 ${xi0.toFixed(1)},${yi0.toFixed(1)} Z`;
}
// The next 24 hourly records from "now" (floored to the current hour) — shared by the ring
// and its click-to-inspect detail panel so both always index the exact same window.
function wxNext24h(rec) {
  const hrs = Array.isArray(rec.hourly) ? rec.hourly : [];
  const now = new Date();
  const nowFloor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
  let start = hrs.findIndex((x) => { const d = new Date(x.t); return !isNaN(d) && d >= nowFloor; });
  if (start < 0) start = 0;
  return hrs.slice(start, start + 24);
}
// `selectedIdx` (0-23, or null) highlights that one wedge with an accent outline and swaps the
// centre readout from "now" to that hour — tapping a wedge (see wxVizCard) is how it gets set.
function wxHourlyRingSvg(win, metric, city, selectedIdx) {
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
// All-layers detail for one tapped hour — the ring is deliberately one metric's colour at a
// time; this answers "what about every OTHER layer at that same hour" in one glance, right
// under the ring rather than a navigation away from it.
function wxHourDetailCard(x) {
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
function wxDayHumAvg(rec, date) {
  const hs = (rec.hourly || []).filter((x) => String(x.t).slice(0, 10) === date && x.hum != null);
  return hs.length ? Math.round(hs.reduce((a, b) => a + b.hum, 0) / hs.length) : null;
}
// A genuinely detailed hour-by-hour strip: time, icon, temp, rain chance and wind for each
// of the next 24 hours, scrollable, ALL metrics at once. The ring above is deliberately one
// metric at a time (that is what makes it readable as a shape); this is its "as detailed as
// possible" companion so nothing about the next 24 hours needs a metric switch to see.
function wxHourlyListNode(rec) {
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
// A rolling "upcoming days" grid — every cell holds a REAL forecast day, no calendar-month
// padding. It used to lay out a full calendar month, which meant every day before today AND
// every day past the ~16-day forecast horizon rendered as a bare "N/A" cell — often more N/A
// cells than real ones. Only the leading blank cells needed to line the first real day up
// under its actual weekday remain, and those are empty, not labelled "N/A".
function wxMonthCalendarNode(rec, metric) {
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
// `onChange`, when given, is called after a metric switch instead of the global render() —
// letting the caller repaint just this card in place so switching Temp/Rain/Humidity/UV/
// Feels/Wind never jumps the page back to the top (mount() always scrolls to 0,0).
// Fully self-contained: switching metric (Temp/Rain/Humidity/UV/Feels/Wind) only ever
// repaints the small ring+calendar slots below, never the card's own chip row and never
// the enclosing screen — so it can never trigger the "whole body cleared, then rebuilt"
// scroll jump that a wider repaint (or the old wxMetric=m;render()) caused.
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

  Object.keys(WX_METRICS).forEach((m) => {
    chipsRow.append(h('button', {
      class: 'chip', 'aria-pressed': wxMetric === m ? 'true' : 'false',
      onclick: () => {
        wxMetric = m;
        chipsRow.querySelectorAll('.chip').forEach((c, i) => {
          const on = Object.keys(WX_METRICS)[i] === m;
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        paintMetric();
      },
    }, WX_METRICS[m].label));
  });

  card.append(h('h3', { class: 'wx-cal-h', style: 'margin:0 0 6px' }, 'Next 24 hours'), chipsRow, ringSlot, detailSlot);
  const hourly = wxHourlyListNode(rec);
  if (hourly) card.append(hourly);
  card.append(h('h3', { class: 'wx-cal-h', style: 'margin:14px 0 6px' }, 'Upcoming forecast'), calSlot);
  paintMetric();
  return card;
}

// Exported setter for weatherKey (module-private above) — weatherNearbyCard (main.js) uses
// this to seed which city "See full forecast" opens to, instead of writing the binding
// directly (which a plain module import cannot do to another module's `let`).
export function seedWeatherKey(key) { weatherKey = key; }
