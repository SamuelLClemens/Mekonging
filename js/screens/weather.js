// Weather screens: full forecast, and the Home/place-card watch-face widget (wxVizCard).
// Extracted from main.js (module-split, see MASTER_BUILD_PROMPT.md) — the DATA/fetch layer
// stays in js/weather.js; this is the RENDERING layer only. The selected city (weatherKey)
// lives in js/weather-ui.js so that main.js's nearby-weather card and js/screens/places.js can
// seed it via seedWeatherKey() without loading this screen; weatherSeededHash below stays
// module-private here because only this screen uses it.
import { store, save, getLastFix, setLastFix } from '../state.js';
import { h, esc } from '../util.js';
import { wxTempU, wxWindU, fmtTemp, fmtWind, fmtPrecip, airBlock, uvLineNode } from '../render-utils.js';
import { field, online } from '../ui-widgets.js';
import { WEATHER_SPOTS, wmo, spotKey, spotsForCountry, defaultSpot, getCachedWeather, getCachedMany, maybeRefreshWeather, maybeRefreshMany } from '../weather.js';
import { COUNTRIES, getCountry } from '../data/regions.js';
import { REGION_PATHS, REGION_VIEWBOX, REGION_PROJ } from '../data/geo.js';
// Circular import back into main.js — same accepted pattern js/screens/home.js already uses
// (see home.js's own header comment): every one of these is only read inside a function body,
// never at module-evaluation time, so the cycle is safe.
import { topbar, mount, focusSpot, fmtClock, spotForCity, render } from '../main.js';
import { dateLocale } from '../i18n.js';

// Shared with the modules that stay in the launch graph; see js/weather-ui.js. These moved out so
// this file could leave it — the router imports it on demand now.
import {
  seedWeatherKey, currentWeatherKey, wxVizCard,
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
    if (online()) maybeRefreshWeather(c.spot).then((r) => { if (r && (location.hash || '').startsWith('#weather')) paintCity(r); });
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
  if (country && weatherSeededHash !== curHash) { seedWeatherKey(spotKey(focusSpot(country).spot)); weatherSeededHash = curHash; }
  if (!currentWeatherKey()) seedWeatherKey(spotKey(focusSpot().spot));
  let spot = WEATHER_SPOTS.find((s) => spotKey(s) === currentWeatherKey()) || defaultSpot('th');

  // Unit toggles (°C/°F, km/h/mph) — persist in the profile and re-render.
  // unitsManual: once the traveller picks a scale themselves, changing the interface language
  // must never move it back (see applyLocaleDefaults in js/i18n.js).
  const setTemp = (u) => { store.profile.wxTempUnit = u; store.profile.unitsManual = true; save(); render(); };
  const setWind = (u) => { store.profile.wxWindUnit = u; store.profile.unitsManual = true; save(); render(); };
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
        h('h3', {}, '7-day forecast'),
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
      // Forced: the traveller asked. Falls back to the cache so an offline tap still repaints
      // with what is held rather than blanking the card.
      const r = (await maybeRefreshWeather(spot, true)) || getCachedWeather(spotKey(spot));
      paint(r, false);
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

