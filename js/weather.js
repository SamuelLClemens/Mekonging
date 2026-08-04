// Weather + 7-day forecast via Open-Meteo (free, no API key, CORS-enabled).
// Offline-first: the last successful fetch per city is cached in localStorage with
// a timestamp (shown as "last updated"); a refresh only happens when online. When
// offline the cached reading is returned so the screen still works.

import { haversineKm } from './util.js';

const PREFIX = 'mk.wx.';
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const MARINE_ENDPOINT = 'https://marine-api.open-meteo.com/v1/marine';
const MARINE_PREFIX = 'mk.sea.';
const AIR_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const AIR_PREFIX = 'mk.air.';

// Key cities per country with coordinates. The first entry for each country is its
// default (capital / main hub).
export const WEATHER_SPOTS = [
  // Thailand
  { country: 'th', city: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { country: 'th', city: 'Chiang Mai', lat: 18.7883, lng: 98.9853 },
  { country: 'th', city: 'Chiang Rai', lat: 19.9105, lng: 99.8406 },
  { country: 'th', city: 'Pai', lat: 19.3583, lng: 98.4406 },
  { country: 'th', city: 'Mae Hong Son', lat: 19.3020, lng: 97.9654 },
  { country: 'th', city: 'Mae Sariang', lat: 18.1637, lng: 97.9316 },
  { country: 'th', city: 'Phuket', lat: 7.8804, lng: 98.3923 },
  { country: 'th', city: 'Krabi', lat: 8.0863, lng: 98.9063 },
  { country: 'th', city: 'Koh Samui', lat: 9.5120, lng: 100.0136 },
  { country: 'th', city: 'Pattaya', lat: 12.9236, lng: 100.8825 },
  { country: 'th', city: 'Ayutthaya', lat: 14.3692, lng: 100.5877 },
  { country: 'th', city: 'Sukhothai', lat: 17.0061, lng: 99.8233 },
  { country: 'th', city: 'Kanchanaburi', lat: 14.0227, lng: 99.5328 },
  { country: 'th', city: 'Hua Hin', lat: 12.5684, lng: 99.9577 },
  { country: 'th', city: 'Udon Thani', lat: 17.4138, lng: 102.7870 },
  // Vietnam
  { country: 'vi', city: 'Hanoi', lat: 21.0278, lng: 105.8342 },
  { country: 'vi', city: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297 },
  { country: 'vi', city: 'Da Nang', lat: 16.0544, lng: 108.2022 },
  { country: 'vi', city: 'Hoi An', lat: 15.8801, lng: 108.3380 },
  { country: 'vi', city: 'Hue', lat: 16.4637, lng: 107.5909 },
  { country: 'vi', city: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
  { country: 'vi', city: 'Da Lat', lat: 11.9404, lng: 108.4583 },
  { country: 'vi', city: 'Sapa', lat: 22.3364, lng: 103.8438 },
  { country: 'vi', city: 'Ha Long', lat: 20.9101, lng: 107.1839 },
  { country: 'vi', city: 'Phu Quoc', lat: 10.2270, lng: 103.9670 },
  { country: 'vi', city: 'Can Tho', lat: 10.0452, lng: 105.7469 },
  // Cambodia
  { country: 'kh', city: 'Phnom Penh', lat: 11.5564, lng: 104.9282 },
  { country: 'kh', city: 'Siem Reap', lat: 13.3671, lng: 103.8448 },
  { country: 'kh', city: 'Sihanoukville', lat: 10.6270, lng: 103.5223 },
  { country: 'kh', city: 'Battambang', lat: 13.0957, lng: 103.1968 },
  { country: 'kh', city: 'Kampot', lat: 10.6104, lng: 104.1819 },
  { country: 'kh', city: 'Kep', lat: 10.4831, lng: 104.3169 },
  // Laos
  { country: 'la', city: 'Vientiane', lat: 17.9757, lng: 102.6331 },
  { country: 'la', city: 'Luang Prabang', lat: 19.8845, lng: 102.1348 },
  { country: 'la', city: 'Vang Vieng', lat: 18.9237, lng: 102.4470 },
  { country: 'la', city: 'Pakse', lat: 15.1202, lng: 105.7820 },
  { country: 'la', city: 'Savannakhet', lat: 16.5560, lng: 104.7520 },
  { country: 'la', city: 'Nong Khiaw', lat: 20.5667, lng: 102.6167 },
  { country: 'la', city: 'Phonsavan', lat: 19.4500, lng: 103.2000 },
];

// WMO weather interpretation codes → [label, emoji].
const WMO = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
  80: ['Light showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm, hail', '⛈️'], 99: ['Thunderstorm, hail', '⛈️'],
};
export function wmo(code) { return WMO[code] || ['—', '🌡️']; }

// True when the code implies meaningful rain/storms (used by day suggestions).
export function isWet(code) {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
}

export function spotKey(s) { return `${s.country}:${s.city}`; }
export function spotsForCountry(country) { return WEATHER_SPOTS.filter((s) => s.country === country); }
export function defaultSpot(country) { return spotsForCountry(country)[0] || WEATHER_SPOTS[0]; }

// Closest listed weather city to a place's coordinates, preferring cities in the
// place's own country. Weather in this app is REGIONAL — the nearest hub, not a
// pinpoint reading — so the UI labels the distance. Falls back to the country
// default when coords are missing or no spot is found.
export function nearestSpot(coords, country) {
  const pool = spotsForCountry(country);
  const spots = pool.length ? pool : WEATHER_SPOTS;
  if (!coords || coords.lat == null || coords.lng == null) return defaultSpot(country);
  let best = null; let bestKm = Infinity;
  for (const s of spots) {
    const km = haversineKm(coords, { lat: s.lat, lng: s.lng });
    if (km != null && km < bestKm) { bestKm = km; best = s; }
  }
  return best || defaultSpot(country);
}

export function getCachedWeather(key) {
  try { const c = JSON.parse(localStorage.getItem(PREFIX + key)); return c || null; } catch { return null; }
}

// Current conditions for MANY spots in one call — Open-Meteo accepts comma-separated
// coordinates and returns an array. Powers the forecast map. Cached as a map of
// spotKey -> { temp, code }.
const MANY_KEY = 'mk.wx.many';
export function getCachedMany() { try { return JSON.parse(localStorage.getItem(MANY_KEY)) || null; } catch { return null; } }
export async function refreshMany(spots) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getCachedMany();
  const lats = spots.map((s) => s.lat).join(',');
  const lngs = spots.map((s) => s.lng).join(',');
  const url = `${ENDPOINT}?latitude=${lats}&longitude=${lngs}&current=temperature_2m,weather_code&timezone=auto`;
  try {
    const res = await fetch(url);
    const d = await res.json();
    const arr = Array.isArray(d) ? d : [d];
    const data = {};
    spots.forEach((s, i) => { const c = arr[i] && arr[i].current; if (c) data[spotKey(s)] = { temp: c.temperature_2m, code: c.weather_code }; });
    const rec = { fetchedAt: Date.now(), data };
    try { localStorage.setItem(MANY_KEY, JSON.stringify(rec)); } catch { /* full */ }
    return rec;
  } catch { return getCachedMany(); }
}

// Fetch + cache. Returns the fresh record, or the cached one when offline/blocked.
// Always fetched in metric (°C, km/h, mm); the UI converts for display so the unit
// toggle never needs a re-fetch. Hourly data lets the UI break each day into
// morning / afternoon / evening / night.
export async function refreshWeather(spot) {
  const key = spotKey(spot);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getCachedWeather(key);
  const url = `${ENDPOINT}?latitude=${spot.lat}&longitude=${spot.lng}`
    + '&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,is_day'
    + '&hourly=temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m,relative_humidity_2m,apparent_temperature'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,'
    + 'precipitation_probability_max,precipitation_sum,uv_index_max,wind_speed_10m_max,sunrise,sunset'
    + '&timezone=auto&forecast_days=7';
  try {
    const res = await fetch(url);
    const d = await res.json();
    if (d && d.current && d.daily && d.hourly) {
      const H = d.hourly;
      const rec = {
        city: spot.city, country: spot.country, fetchedAt: Date.now(),
        current: {
          temp: d.current.temperature_2m, apparent: d.current.apparent_temperature, code: d.current.weather_code,
          humidity: d.current.relative_humidity_2m, wind: d.current.wind_speed_10m,
          precip: d.current.precipitation, isDay: d.current.is_day,
        },
        daily: d.daily.time.map((t, i) => ({
          date: t, code: d.daily.weather_code[i],
          tmax: d.daily.temperature_2m_max[i], tmin: d.daily.temperature_2m_min[i],
          appMax: d.daily.apparent_temperature_max[i], appMin: d.daily.apparent_temperature_min[i],
          rainProb: d.daily.precipitation_probability_max[i], precip: d.daily.precipitation_sum[i],
          uv: d.daily.uv_index_max[i], windMax: d.daily.wind_speed_10m_max[i],
          sunrise: d.daily.sunrise[i], sunset: d.daily.sunset[i],
        })),
        hourly: H.time.map((t, i) => ({
          t, temp: H.temperature_2m[i], code: H.weather_code[i],
          pp: H.precipitation_probability[i], precip: H.precipitation[i],
          wind: H.wind_speed_10m[i], hum: H.relative_humidity_2m[i], app: H.apparent_temperature[i],
        })),
      };
      try { localStorage.setItem(PREFIX + key, JSON.stringify(rec)); } catch { /* storage full */ }
      return rec;
    }
  } catch { /* offline or blocked — fall through to cache */ }
  return getCachedWeather(key);
}

// --- Marine / swimming conditions -------------------------------------------
// Live sea state for a specific beach via Open-Meteo's Marine API (free, no key).
// Coordinate-specific (not the regional hub), cached per rounded lat/lng so it works
// offline. Returns null when offline with no cache, or when the point has no marine
// data (inland / lake). Never throws.
function marineKey(coords) { return `${MARINE_PREFIX}${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`; }
export function getCachedMarine(coords) {
  if (!coords || coords.lat == null || coords.lng == null) return null;
  try { return JSON.parse(localStorage.getItem(marineKey(coords))) || null; } catch { return null; }
}
export async function refreshMarine(coords) {
  if (!coords || coords.lat == null || coords.lng == null) return null;
  const key = marineKey(coords);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getCachedMarine(coords);
  const url = `${MARINE_ENDPOINT}?latitude=${coords.lat}&longitude=${coords.lng}`
    + '&current=wave_height,wave_period,sea_surface_temperature&timezone=auto';
  try {
    const res = await fetch(url);
    const d = await res.json();
    const c = d && d.current;
    if (c && c.wave_height != null) {
      const rec = { fetchedAt: Date.now(), waveHeight: c.wave_height, wavePeriod: c.wave_period, seaTemp: c.sea_surface_temperature };
      try { localStorage.setItem(key, JSON.stringify(rec)); } catch { /* full */ }
      return rec;
    }
  } catch { /* offline or no marine data — fall through to cache */ }
  return getCachedMarine(coords);
}

// --- Air quality -------------------------------------------------------------
// US AQI + PM2.5 for a city via Open-Meteo's Air Quality API (free, no key). Cached
// per spot so it works offline. Relevant across the region, and especially during the
// February-April crop-burning haze in the north. Never throws.
export function getCachedAir(key) {
  try { return JSON.parse(localStorage.getItem(AIR_PREFIX + key)) || null; } catch { return null; }
}
export async function refreshAir(spot) {
  const key = spotKey(spot);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getCachedAir(key);
  const url = `${AIR_ENDPOINT}?latitude=${spot.lat}&longitude=${spot.lng}&current=us_aqi,pm2_5&timezone=auto`;
  try {
    const res = await fetch(url);
    const d = await res.json();
    const c = d && d.current;
    if (c && c.us_aqi != null) {
      const rec = { fetchedAt: Date.now(), aqi: c.us_aqi, pm25: c.pm2_5 };
      try { localStorage.setItem(AIR_PREFIX + key, JSON.stringify(rec)); } catch { /* full */ }
      return rec;
    }
  } catch { /* offline or blocked — fall through to cache */ }
  return getCachedAir(key);
}
