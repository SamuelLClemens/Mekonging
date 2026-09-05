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

// Every city this app can ANCHOR on, with coordinates. Two roles live in one list:
//
//   hub: true   A curated weather hub. These and only these are fetched in bulk for the
//               forecast map (refreshMany), drawn as dots on it, offered in the manual
//               location picker, and used by nearestSpot() — weather here is deliberately
//               REGIONAL, the nearest hub rather than a pinpoint reading. The first hub
//               for each country is that country's default (capital / main hub).
//
//   no hub      A city anchor: somewhere with place records but too minor to be a weather
//               hub. It exists so spotForCity() can find it by name. Without one,
//               spotForCity() fell through to nearestSpot() and silently resolved to the
//               nearest HUB — Ninh Binh had ten records and no entry, so "Places in Ninh
//               Binh" ranked Hanoi venues 90 km away as "Nearby" while printing "Near Ninh
//               Binh". 101 cities covering 245 records were in that state.
//
// Anchor coordinates are the MEDOID of that city's own place records — the real record
// minimising total distance to the rest, so one stray entry cannot drag the anchor and it
// always lands where the content actually is. Several of these "cities" are really
// provinces (Khao Lak, Satun, Khon Kaen), where the medoid correctly points at the
// attraction rather than the provincial capital. Regenerate by cross-referencing `city:`
// keys in js/data/places.*.js against this list.
//
// Adding places for a city NOT listed here means adding it here in the same commit.
export const WEATHER_SPOTS = [
  // Thailand
  { country: 'th', city: 'Bangkok', lat: 13.7563, lng: 100.5018, hub: true },
  { country: 'th', city: 'Chiang Mai', lat: 18.7883, lng: 98.9853, hub: true },
  { country: 'th', city: 'Chiang Rai', lat: 19.9105, lng: 99.8406, hub: true },
  { country: 'th', city: 'Pai', lat: 19.3583, lng: 98.4406, hub: true },
  { country: 'th', city: 'Mae Hong Son', lat: 19.3020, lng: 97.9654, hub: true },
  { country: 'th', city: 'Mae Sariang', lat: 18.1637, lng: 97.9316, hub: true },
  { country: 'th', city: 'Phuket', lat: 7.8804, lng: 98.3923, hub: true },
  { country: 'th', city: 'Krabi', lat: 8.0863, lng: 98.9063, hub: true },
  { country: 'th', city: 'Koh Samui', lat: 9.5120, lng: 100.0136, hub: true },
  { country: 'th', city: 'Pattaya', lat: 12.9236, lng: 100.8825, hub: true },
  { country: 'th', city: 'Ayutthaya', lat: 14.3692, lng: 100.5877, hub: true },
  { country: 'th', city: 'Sukhothai', lat: 17.0061, lng: 99.8233, hub: true },
  { country: 'th', city: 'Kanchanaburi', lat: 14.0227, lng: 99.5328, hub: true },
  { country: 'th', city: 'Hua Hin', lat: 12.5684, lng: 99.9577, hub: true },
  { country: 'th', city: 'Udon Thani', lat: 17.4138, lng: 102.7870, hub: true },
  // The islands within a day of Bangkok. Each one is a `city` in the place data, and a city
  // with records but no spot here silently anchors on the nearest listed one - Ninh Binh
  // ranked Hanoi venues as "Nearby" for exactly this reason. Koh Kret and Bang Krachao are
  // river islands inside greater Bangkok, so their weather is Bangkok's in practice; they
  // are listed anyway so the Places anchor and "You're around X" resolve to the right place.
  { country: 'th', city: 'Koh Kret', lat: 13.9089, lng: 100.4796, hub: true },
  { country: 'th', city: 'Bang Krachao', lat: 13.6954, lng: 100.5610, hub: true },
  { country: 'th', city: 'Koh Si Chang', lat: 13.1525, lng: 100.8094, hub: true },
  { country: 'th', city: 'Koh Larn', lat: 12.9175, lng: 100.7782, hub: true },
  { country: 'th', city: 'Koh Samet', lat: 12.5667, lng: 101.4500, hub: true },
  // Vietnam
  { country: 'vi', city: 'Hanoi', lat: 21.0278, lng: 105.8342, hub: true },
  { country: 'vi', city: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, hub: true },
  { country: 'vi', city: 'Da Nang', lat: 16.0544, lng: 108.2022, hub: true },
  { country: 'vi', city: 'Hoi An', lat: 15.8801, lng: 108.3380, hub: true },
  { country: 'vi', city: 'Hue', lat: 16.4637, lng: 107.5909, hub: true },
  { country: 'vi', city: 'Nha Trang', lat: 12.2388, lng: 109.1967, hub: true },
  { country: 'vi', city: 'Da Lat', lat: 11.9404, lng: 108.4583, hub: true },
  { country: 'vi', city: 'Sapa', lat: 22.3364, lng: 103.8438, hub: true },
  { country: 'vi', city: 'Ha Long', lat: 20.9101, lng: 107.1839, hub: true },
  // Without an entry here spotForCity() falls through to nearestSpot(), which for Ninh Binh
  // resolves to Hanoi 90 km away: scoping Places to Ninh Binh ranked Hanoi venues as
  // "Nearby" and its weather read the capital's. Coordinates are the city People's Committee
  // building - the town centre, not the karst valleys 8 km west, which stay a short hop.
  { country: 'vi', city: 'Ninh Binh', lat: 20.2580, lng: 105.9798, hub: true },
  { country: 'vi', city: 'Phu Quoc', lat: 10.2270, lng: 103.9670, hub: true },
  { country: 'vi', city: 'Can Tho', lat: 10.0452, lng: 105.7469, hub: true },
  // Cambodia
  { country: 'kh', city: 'Phnom Penh', lat: 11.5564, lng: 104.9282, hub: true },
  { country: 'kh', city: 'Siem Reap', lat: 13.3671, lng: 103.8448, hub: true },
  { country: 'kh', city: 'Sihanoukville', lat: 10.6270, lng: 103.5223, hub: true },
  { country: 'kh', city: 'Battambang', lat: 13.0957, lng: 103.1968, hub: true },
  { country: 'kh', city: 'Kampot', lat: 10.6104, lng: 104.1819, hub: true },
  { country: 'kh', city: 'Kep', lat: 10.4831, lng: 104.3169, hub: true },
  // Laos
  { country: 'la', city: 'Vientiane', lat: 17.9757, lng: 102.6331, hub: true },
  { country: 'la', city: 'Luang Prabang', lat: 19.8845, lng: 102.1348, hub: true },
  { country: 'la', city: 'Vang Vieng', lat: 18.9237, lng: 102.4470, hub: true },
  { country: 'la', city: 'Pakse', lat: 15.1202, lng: 105.7820, hub: true },
  { country: 'la', city: 'Savannakhet', lat: 16.5560, lng: 104.7520, hub: true },
  { country: 'la', city: 'Nong Khiaw', lat: 20.5667, lng: 102.6167, hub: true },
  { country: 'la', city: 'Phonsavan', lat: 19.4500, lng: 103.2000, hub: true },

  // ---- CITY ANCHORS (not weather hubs) — see the header above ----------------
  // Thailand — 27 cities, 60 records
  { country: 'th', city: 'Amphawa', lat: 13.4256, lng: 99.9553 },
  { country: 'th', city: 'Buriram', lat: 14.532, lng: 102.941 },
  { country: 'th', city: 'Khao Lak', lat: 8.65, lng: 97.64 },
  { country: 'th', city: 'Khao Sok', lat: 8.913, lng: 98.533 },
  { country: 'th', city: 'Khao Yai', lat: 14.4419, lng: 101.3717 },
  { country: 'th', city: 'Khon Kaen', lat: 16.7531, lng: 101.7861 },
  { country: 'th', city: 'Khun Yuam', lat: 18.82, lng: 97.99 },
  { country: 'th', city: 'Koh Chang', lat: 11.988, lng: 102.266 },
  { country: 'th', city: 'Koh Lanta', lat: 7.532, lng: 99.087 },
  { country: 'th', city: 'Koh Phangan', lat: 9.758, lng: 99.982 },
  { country: 'th', city: 'Koh Tao', lat: 10.0975, lng: 99.8355 },
  { country: 'th', city: 'Loei', lat: 16.872, lng: 101.719 },
  { country: 'th', city: 'Lopburi', lat: 14.8018, lng: 100.6117 },
  { country: 'th', city: 'Mae Chaem', lat: 18.5, lng: 98.363 },
  { country: 'th', city: 'Nakhon Ratchasima', lat: 15.2214, lng: 102.4947 },
  { country: 'th', city: 'Nan', lat: 18.78, lng: 100.77 },
  { country: 'th', city: 'Nong Khai', lat: 17.878, lng: 102.742 },
  { country: 'th', city: 'Phang Nga Bay', lat: 8.1167, lng: 98.5833 },
  { country: 'th', city: 'Phetchaburi', lat: 12.9, lng: 99.6167 },
  { country: 'th', city: 'Ratchaburi', lat: 13.521, lng: 99.957 },
  { country: 'th', city: 'Samut Songkhram', lat: 13.408, lng: 99.999 },
  { country: 'th', city: 'Satun', lat: 6.488, lng: 99.302 },
  { country: 'th', city: 'Soppong', lat: 19.517, lng: 98.283 },
  { country: 'th', city: 'Surat Thani', lat: 8.9167, lng: 98.5333 },
  { country: 'th', city: 'Trang', lat: 7.3, lng: 99.265 },
  { country: 'th', city: 'Trat', lat: 11.82, lng: 102.47 },
  { country: 'th', city: 'Ubon Ratchathani', lat: 15.7956, lng: 105.395 },
  // Vietnam — 17 cities, 40 records
  { country: 'vi', city: 'An Giang', lat: 10.5817, lng: 105.0231 },
  { country: 'vi', city: 'Ba Ria-Vung Tau', lat: 8.69, lng: 106.61 },
  { country: 'vi', city: 'Buon Ma Thuot', lat: 12.67, lng: 108.05 },
  { country: 'vi', city: 'Cao Bang', lat: 22.853, lng: 106.723 },
  { country: 'vi', city: 'Cat Ba', lat: 20.722, lng: 107.062 },
  { country: 'vi', city: 'Con Dao', lat: 8.69, lng: 106.61 },
  { country: 'vi', city: 'Duy Phu', lat: 15.7642, lng: 108.1244 },
  { country: 'vi', city: 'Ha Giang', lat: 23.2386, lng: 105.3553 },
  { country: 'vi', city: 'Hoa Binh', lat: 20.66, lng: 105.1 },
  { country: 'vi', city: 'Ly Son', lat: 15.3809, lng: 109.1175 },
  { country: 'vi', city: 'Lang Co', lat: 16.23, lng: 108.08 },
  { country: 'vi', city: 'Lao Cai', lat: 22.535, lng: 104.296 },
  { country: 'vi', city: 'Mai Chau', lat: 20.6597, lng: 105.09 },
  { country: 'vi', city: 'Phan Thiet', lat: 10.933, lng: 108.287 },
  { country: 'vi', city: 'Phong Nha', lat: 17.5989, lng: 106.2811 },
  { country: 'vi', city: 'Quy Nhon', lat: 13.66, lng: 109.27 },
  { country: 'vi', city: 'Thanh Hoa', lat: 20.48, lng: 105.16 },
  { country: 'vi', city: 'Vung Tau', lat: 10.3357, lng: 107.0876 },
  // Cambodia — 25 cities, 73 records
  { country: 'kh', city: 'Angkor Borei', lat: 10.9755, lng: 104.9905 },
  { country: 'kh', city: 'Anlong Veng', lat: 14.241, lng: 104.087 },
  { country: 'kh', city: 'Banlung', lat: 13.7398, lng: 106.9878 },
  { country: 'kh', city: 'Botum Sakor', lat: 11.1155, lng: 103.2497 },
  { country: 'kh', city: 'Cardamom Mountains', lat: 11.3197, lng: 103.3542 },
  { country: 'kh', city: 'Kampong Cham', lat: 11.992, lng: 105.464 },
  { country: 'kh', city: 'Kampong Chhnang', lat: 12.254, lng: 104.6352 },
  { country: 'kh', city: 'Kampong Speu', lat: 11.283, lng: 104.067 },
  { country: 'kh', city: 'Kampong Thom', lat: 12.867, lng: 105.0373 },
  { country: 'kh', city: 'Kampong Trach', lat: 10.5347, lng: 104.461 },
  { country: 'kh', city: 'Koh Kong', lat: 11.6144, lng: 102.9848 },
  { country: 'kh', city: 'Koh Rong', lat: 10.6125, lng: 103.277 },
  { country: 'kh', city: 'Koh Rong Sanloem', lat: 10.6086, lng: 103.3006 },
  { country: 'kh', city: 'Koh Sdach', lat: 10.933, lng: 103.067 },
  { country: 'kh', city: 'Kratie', lat: 12.488, lng: 106.018 },
  { country: 'kh', city: 'Oudong', lat: 11.8239, lng: 104.7425 },
  { country: 'kh', city: 'Preah Rumkel (Stung Treng)', lat: 13.97, lng: 105.94 },
  { country: 'kh', city: 'Preah Vihear', lat: 13.7872, lng: 104.54 },
  { country: 'kh', city: 'Sambor (Kratie)', lat: 12.78, lng: 105.965 },
  { country: 'kh', city: 'Sen Monorom', lat: 12.4522, lng: 107.1892 },
  { country: 'kh', city: 'Skun', lat: 12.059, lng: 105.0757 },
  { country: 'kh', city: 'Stung Treng', lat: 13.535, lng: 106.001 },
  { country: 'kh', city: 'Takeo', lat: 11.32, lng: 104.79 },
  { country: 'kh', city: 'Tonle Bati', lat: 11.336, lng: 104.851 },
  { country: 'kh', city: 'Voen Sai (Ratanakiri)', lat: 13.97, lng: 106.865 },
  // Laos — 32 cities, 72 records
  { country: 'la', city: 'Attapeu', lat: 15.11, lng: 107.16 },
  { country: 'la', city: 'Boualapha', lat: 17.3733, lng: 105.8372 },
  { country: 'la', city: 'Champasak', lat: 14.85, lng: 105.885 },
  { country: 'la', city: 'Don Det', lat: 13.9226, lng: 105.9403 },
  { country: 'la', city: 'Don Khon', lat: 13.912, lng: 105.972 },
  { country: 'la', city: 'Houameuang (near Sam Neua)', lat: 20.145, lng: 103.63 },
  { country: 'la', city: 'Huay Xai', lat: 20.33, lng: 100.7 },
  { country: 'la', city: 'Kiet Ngong', lat: 14.14, lng: 106.19 },
  { country: 'la', city: 'Luang Namtha', lat: 20.9491, lng: 101.4036 },
  { country: 'la', city: 'Muang Kham', lat: 19.5806, lng: 103.4972 },
  { country: 'la', city: 'Muang Khoun', lat: 19.335, lng: 103.3711 },
  { country: 'la', city: 'Muang Ngoi', lat: 20.7195, lng: 102.641 },
  { country: 'la', city: 'Muang Sing', lat: 21.1836, lng: 101.154 },
  { country: 'la', city: 'Muang Sui', lat: 19.49, lng: 102.885 },
  { country: 'la', city: 'Nakai', lat: 17.66, lng: 105.1 },
  { country: 'la', city: 'Nakasang', lat: 14.05, lng: 105.94 },
  { country: 'la', city: 'Oudomxai (Muang Xai)', lat: 20.682, lng: 101.865 },
  { country: 'la', city: 'Pak Beng', lat: 19.8865, lng: 101.129 },
  { country: 'la', city: 'Pakkading', lat: 18.3, lng: 104.1 },
  { country: 'la', city: 'Paksan', lat: 18.3841, lng: 103.6577 },
  { country: 'la', city: 'Paksong', lat: 15.1712, lng: 106.2154 },
  { country: 'la', city: 'Phongsali', lat: 21.6875, lng: 102.1075 },
  { country: 'la', city: 'Sainyabuli (Xayaboury)', lat: 19.297, lng: 101.785 },
  { country: 'la', city: 'Salavan', lat: 15.4333, lng: 106.2333 },
  { country: 'la', city: 'Sam Neua', lat: 20.4178, lng: 104.0489 },
  { country: 'la', city: 'Sekong', lat: 15.2451, lng: 106.7513 },
  { country: 'la', city: 'Si Phan Don', lat: 13.985, lng: 105.915 },
  { country: 'la', city: 'Tad Lo', lat: 15.43, lng: 106.412 },
  { country: 'la', city: 'Thakhek', lat: 17.411, lng: 104.851 },
  { country: 'la', city: 'Thaphabat', lat: 18.33, lng: 103.13 },
  { country: 'la', city: 'Vieng Xai', lat: 20.4167, lng: 104.2167 },
  { country: 'la', city: 'Viengthong (Muang Hiam)', lat: 20.32, lng: 103.63 },
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
// HUBS ONLY, deliberately. Every caller of this is a bulk or browse operation — the forecast
// map's dots, refreshMany's batched fetch, the manual location picker, nearestSpot() — and
// each one would degrade if it saw all 147 entries: 100+ overlapping labels on the map, a
// hundred-odd coordinates per weather fetch, an unusable select. Anchors are found by NAME
// via spotForCity(), never enumerated. Use allSpotsForCountry() if you genuinely need both.
export function spotsForCountry(country) { return WEATHER_SPOTS.filter((s) => s.country === country && s.hub); }
export function allSpotsForCountry(country) { return WEATHER_SPOTS.filter((s) => s.country === country); }
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
async function refreshMany(spots) {
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
async function refreshWeather(spot) {
  const key = spotKey(spot);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getCachedWeather(key);
  const url = `${ENDPOINT}?latitude=${spot.lat}&longitude=${spot.lng}`
    + '&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,is_day'
    + '&hourly=temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m,relative_humidity_2m,apparent_temperature,uv_index'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,'
    + 'precipitation_probability_max,precipitation_sum,uv_index_max,wind_speed_10m_max,sunrise,sunset'
    + '&timezone=auto&forecast_days=16';
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
          uv: H.uv_index ? H.uv_index[i] : null,
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
async function refreshMarine(coords) {
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
async function refreshAir(spot) {
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

// --- STALENESS AND AUTOMATIC REFRESH ----------------------------------------
// The four refresh* functions above are deliberately NOT exported. Every caller goes
// through a maybe* guard below, and an unexported implementation makes that structural
// rather than a convention somebody has to remember.
// Every refresh* above fetches unconditionally whenever it is called, and each was called
// only from the screen that displays it. That is wrong in both directions at once:
//
//   too rarely — nothing refreshed in the background, so an app left open on Home all day
//     showed the forecast it happened to fetch at breakfast, and a launch with no signal
//     meant no weather for the rest of the session however long the traveller was online
//     afterwards. This is an installed PWA people leave open, not a page they reload.
//
//   too often — opening the forecast five times fetched it five times, on a phone roaming
//     on a foreign SIM, for data that Open-Meteo only recomputes hourly.
//
// So staleness lives here, in the module that owns the cache, and the callers get maybe*
// entry points that are cheap to call as often as anything likes. Same shape as
// maybeRefreshRates() in js/currency.js: no-op unless genuinely due, a minimum gap between
// attempts, and in-flight de-duplication so concurrent callers share one request.
//
// TTLs follow what the upstream data actually does. Open-Meteo recomputes its forecast
// hourly and its current conditions about every fifteen minutes, so a 20-minute window on
// conditions is as fresh as the source can be; marine and air quality are hourly.
const WX_TTL_MS = 20 * 60 * 1000;
const SEA_TTL_MS = 60 * 60 * 1000;
const AIR_TTL_MS = 60 * 60 * 1000;
const MANY_TTL_MS = 30 * 60 * 1000;
const MIN_GAP_MS = 2 * 60 * 1000;    // never re-attempt the same key faster than this
const _lastAttempt = {};
const _inFlight = {};

function ageOf(rec) { return (rec && rec.fetchedAt) ? Date.now() - rec.fetchedAt : Infinity; }

// Shared guard. `key` scopes the gap and the in-flight slot, so two cities refresh
// independently while two callers asking for the same city share one fetch.
function guarded(key, stale, run) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve(null);
  if (!stale) return Promise.resolve(null);
  if (_inFlight[key]) return _inFlight[key];
  const now = Date.now();
  if ((now - (_lastAttempt[key] || 0)) < MIN_GAP_MS) return Promise.resolve(null);
  _lastAttempt[key] = now;
  _inFlight[key] = Promise.resolve()
    .then(run)
    .catch(() => null)
    .finally(() => { delete _inFlight[key]; });
  return _inFlight[key];
}

function weatherIsStale(spot, ttl = WX_TTL_MS) {
  return ageOf(getCachedWeather(spotKey(spot))) >= ttl;
}

// Resolves to the fresh record when it fetched, or null when it decided not to. A null is
// not a failure: it means "what you already have is current enough".
export function maybeRefreshWeather(spot, force = false) {
  if (!spot) return Promise.resolve(null);
  const key = spotKey(spot);
  if (force) { delete _lastAttempt[key]; }
  return guarded(`wx:${key}`, force || weatherIsStale(spot), () => refreshWeather(spot));
}

export function maybeRefreshMany(spots, force = false) {
  if (!spots || !spots.length) return Promise.resolve(null);
  const key = `many:${spots[0].country || ''}:${spots.length}`;
  if (force) { delete _lastAttempt[key]; }
  return guarded(key, force || ageOf(getCachedMany()) >= MANY_TTL_MS, () => refreshMany(spots));
}

export function maybeRefreshMarine(coords, force = false) {
  if (!coords || coords.lat == null || coords.lng == null) return Promise.resolve(null);
  const key = marineKey(coords);
  if (force) { delete _lastAttempt[key]; }
  return guarded(key, force || ageOf(getCachedMarine(coords)) >= SEA_TTL_MS, () => refreshMarine(coords));
}

export function maybeRefreshAir(spot, force = false) {
  if (!spot) return Promise.resolve(null);
  const key = `air:${spotKey(spot)}`;
  if (force) { delete _lastAttempt[key]; }
  return guarded(key, force || ageOf(getCachedAir(spotKey(spot))) >= AIR_TTL_MS, () => refreshAir(spot));
}
