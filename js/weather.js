// Weather + 10-day forecast via Open-Meteo (free, no API key, CORS-enabled).
// Offline-first: the last successful fetch per city is cached in localStorage with
// a timestamp (shown as "last updated"); a refresh only happens when online. When
// offline the cached reading is returned so the screen still works.
//
// The daily and hourly forecast are each averaged across several independent national
// forecast models (see WX_MODELS below) rather than read from a single source — see the
// comment above ensembleAt() for how and why. Current conditions are Open-Meteo's own
// best-available nowcast, which the API does not split by model at all (confirmed against
// the live endpoint: `current=` comes back identical and unsuffixed whether `models=` is
// omitted or names four), so there is nothing there to average.
//
// Every day/hour record also carries `bySource`, each model's own unaveraged numbers, for a
// traveller who would rather trust one named forecast centre than the blend — sourceDay() and
// sourceHour() below switch a record to read from it (or fall back to the average where that
// model has no data yet). The Weather screen and the map's weather-pin popup both expose this
// as a picker (wxSourceSeg, js/weather-ui.js) so it is a visible choice, not a hidden setting.

import { haversineKm, fetchTimeout } from './util.js';

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
// Every hub, across all four countries — the real map's weather layer draws one dot per
// hub region-wide, unlike spotsForCountry() which scopes to a single country.
export function allHubSpots() { return WEATHER_SPOTS.filter((s) => s.hub); }

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
    const res = await fetchTimeout(url);
    const d = await res.json();
    const arr = Array.isArray(d) ? d : [d];
    // Merge into whatever is already cached rather than replacing it outright — this cache is
    // shared between per-country callers (Weather screen: ~11 hubs) and the region-wide map
    // weather layer (all 46 hubs); overwriting would let whichever call ran last silently erase
    // every other country's dots.
    const prev = getCachedMany();
    const data = (prev && prev.data) ? { ...prev.data } : {};
    spots.forEach((s, i) => { const c = arr[i] && arr[i].current; if (c) data[spotKey(s)] = { temp: c.temperature_2m, code: c.weather_code }; });
    const rec = { fetchedAt: Date.now(), data };
    try { localStorage.setItem(MANY_KEY, JSON.stringify(rec)); } catch { /* full */ }
    return rec;
  } catch { return getCachedMany(); }
}

// --- Multi-model ensemble averaging (daily + hourly forecast only — see the header note) ---
// Four independently-run national/international forecast centres, not four flavours of the
// same underlying model: ECMWF (Europe), NOAA's GFS (US), DWD's ICON (Germany), and the UK
// Met Office. Requesting `models=` on a `daily=`/`hourly=` field makes Open-Meteo return one
// column PER MODEL instead of one blended column — confirmed against the live endpoint,
// e.g. `temperature_2m_max` becomes `temperature_2m_max_ecmwf_ifs025`,
// `temperature_2m_max_gfs_seamless`, and so on — so averaging those columns ourselves is what
// actually delivers "more than one source," rather than trusting whichever single model
// Open-Meteo's own auto-selected "best_match" would have picked.
//
// Not every model reaches every day this app shows: ICON and UKMO's free tier stops at 7 days
// while ECMWF and GFS reach 16 (measured directly — by day 8 only two of the four still have
// values). A day/hour's average silently thins to however many models actually answered for
// it rather than erroring, and that count rides along as `.models` so the screen can say so.
export const WX_MODELS = ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'ukmo_seamless'];
export const WX_MODEL_LABELS = {
  ecmwf_ifs025: 'ECMWF', gfs_seamless: 'NOAA GFS', icon_seamless: 'DWD ICON', ukmo_seamless: 'UK Met Office',
};
const WX_MODELS_PARAM = WX_MODELS.join(',');

// One value from a model-suffixed hourly/daily block (`O`), reduced across whichever models
// actually answered at index `i`. `kind` picks how: default is a plain mean (temperature,
// rain, wind speed, ...); 'mode' is for a WMO weather code, a category rather than a
// quantity — the plurality reading, ties going to the first model with that value (ECMWF,
// first in WX_MODELS); 'circular' is for a compass bearing, where a naive mean of 350° and
// 10° would wrongly come out as 180° instead of 0°.
function ensembleAt(O, field, i, kind) {
  const vals = [];
  for (const m of WX_MODELS) { const arr = O[`${field}_${m}`]; const v = arr ? arr[i] : null; if (v != null) vals.push(v); }
  if (!vals.length) return { v: null, n: 0 };
  if (kind === 'mode') {
    const counts = new Map();
    vals.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    let best = vals[0]; let bestN = 0;
    for (const v of vals) { const n = counts.get(v); if (n > bestN) { bestN = n; best = v; } }
    return { v: best, n: vals.length };
  }
  if (kind === 'circular') {
    let sx = 0; let sy = 0;
    vals.forEach((deg) => { const r = (deg * Math.PI) / 180; sx += Math.cos(r); sy += Math.sin(r); });
    return { v: (Math.atan2(sy, sx) * 180 / Math.PI + 360) % 360, n: vals.length };
  }
  return { v: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
}
// Sunrise/sunset off a model-suffixed block: an astronomical fact every model computes within
// seconds of the others, so the first model to answer is taken rather than "averaging"
// timestamps.
function firstAt(O, field, i) {
  for (const m of WX_MODELS) { const arr = O[`${field}_${m}`]; if (arr && arr[i] != null) return arr[i]; }
  return null;
}
// One model's own (unaveraged) value, for the traveller who would rather trust a single
// forecast centre than the ensemble — see bySource below and sourceDay/sourceHour further down.
function modelAt(O, field, i, model) {
  const arr = O[`${field}_${model}`];
  const v = arr ? arr[i] : null;
  return v == null ? null : v;
}
// Every field a day/hour record carries, keyed by model id, for callers that want one named
// source instead of the average — see sourceDay/sourceHour. Built alongside the ensemble in the
// same pass rather than re-fetched, since the raw per-model columns are already in `O`. Sunrise
// and daylight are deliberately left out: those come from firstAt, not ensembleAt, because every
// model computes them within seconds of the others, so there is nothing to pick between.
function bySourceDaily(D, i) {
  const out = {};
  WX_MODELS.forEach((m) => {
    out[m] = {
      code: modelAt(D, 'weather_code', i, m),
      tmax: modelAt(D, 'temperature_2m_max', i, m), tmin: modelAt(D, 'temperature_2m_min', i, m),
      appMax: modelAt(D, 'apparent_temperature_max', i, m), appMin: modelAt(D, 'apparent_temperature_min', i, m),
      rainProb: modelAt(D, 'precipitation_probability_max', i, m), precip: modelAt(D, 'precipitation_sum', i, m),
      snow: modelAt(D, 'snowfall_sum', i, m),
      uv: modelAt(D, 'uv_index_max', i, m), windMax: modelAt(D, 'wind_speed_10m_max', i, m),
      gustMax: modelAt(D, 'wind_gusts_10m_max', i, m), windDir: modelAt(D, 'wind_direction_10m_dominant', i, m),
    };
  });
  return out;
}
function bySourceHourly(H, i) {
  const out = {};
  WX_MODELS.forEach((m) => {
    out[m] = {
      code: modelAt(H, 'weather_code', i, m), temp: modelAt(H, 'temperature_2m', i, m),
      pp: modelAt(H, 'precipitation_probability', i, m), precip: modelAt(H, 'precipitation', i, m), snow: modelAt(H, 'snowfall', i, m),
      wind: modelAt(H, 'wind_speed_10m', i, m), hum: modelAt(H, 'relative_humidity_2m', i, m), app: modelAt(H, 'apparent_temperature', i, m),
      uv: modelAt(H, 'uv_index', i, m),
      wdir: modelAt(H, 'wind_direction_10m', i, m), gust: modelAt(H, 'wind_gusts_10m', i, m),
      cloud: modelAt(H, 'cloud_cover', i, m), vis: modelAt(H, 'visibility', i, m),
    };
  });
  return out;
}
// A day/hour record filtered to one named model instead of the ensemble average — `source` is
// 'average' (returns the record unchanged) or one of WX_MODELS. A model that has not reached
// this far out yet (ICON/UKMO's 7-day free-tier limit, vs. ECMWF/GFS's 16) has no code for that
// day/hour; rather than hand back a blank row, this falls back to the already-computed ensemble
// fields with `.fallback` set, so a picked source never loses data, it just says whose number is
// actually showing. Sunrise/sunset/daylight are left as-is regardless of source (see
// bySourceDaily above).
export function sourceDay(day, source) {
  if (!day || !source || source === 'average') return day;
  const m = day.bySource && day.bySource[source];
  if (!m || m.code == null) return { ...day, source, fallback: true };
  return { ...day, ...m, source, fallback: false };
}
export function sourceHour(hour, source) {
  if (!hour || !source || source === 'average') return hour;
  const m = hour.bySource && hour.bySource[source];
  if (!m || m.code == null) return { ...hour, source, fallback: true };
  return { ...hour, ...m, source, fallback: false };
}

// Fetch + cache. Returns the fresh record, or the cached one when offline/blocked.
// Always fetched in metric (°C, km/h, mm); the UI converts for display so the unit
// toggle never needs a re-fetch. Hourly data lets the UI break each day into
// morning / afternoon / evening / night.
async function refreshWeather(spot) {
  const key = spotKey(spot);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return getCachedWeather(key);
  // Wind direction and gusts, cloud, visibility, pressure and dew point ride along in the same
  // request: they cost a few kilobytes and no extra round trip, and a traveller planning a boat
  // day, a mountain road or a sunrise viewpoint needs them as much as the temperature.
  const url = `${ENDPOINT}?latitude=${spot.lat}&longitude=${spot.lng}`
    + '&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,snowfall,is_day,'
    + 'wind_direction_10m,wind_gusts_10m,cloud_cover,pressure_msl,visibility,dew_point_2m'
    + '&hourly=temperature_2m,weather_code,precipitation_probability,precipitation,snowfall,wind_speed_10m,relative_humidity_2m,apparent_temperature,uv_index,'
    + 'wind_direction_10m,wind_gusts_10m,cloud_cover,visibility'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,'
    + 'precipitation_probability_max,precipitation_sum,snowfall_sum,uv_index_max,wind_speed_10m_max,sunrise,sunset,'
    + 'wind_gusts_10m_max,wind_direction_10m_dominant,daylight_duration'
    + `&timezone=auto&forecast_days=16&models=${WX_MODELS_PARAM}`;
  try {
    const res = await fetchTimeout(url);
    const d = await res.json();
    if (d && d.current && d.daily && d.hourly) {
      const H = d.hourly;
      const D = d.daily;
      const C = d.current;
      const rec = {
        city: spot.city, country: spot.country, fetchedAt: Date.now(),
        // Every time below is the city's own wall clock (timezone=auto). The offset is what lets
        // "now" be the city's now too, for a traveller whose phone is still on another timezone.
        utcOffset: d.utc_offset_seconds,
        current: {
          temp: C.temperature_2m, apparent: C.apparent_temperature, code: C.weather_code,
          humidity: C.relative_humidity_2m, wind: C.wind_speed_10m,
          precip: C.precipitation, snow: C.snowfall, isDay: C.is_day,
          windDir: C.wind_direction_10m, gust: C.wind_gusts_10m, cloud: C.cloud_cover,
          pressure: C.pressure_msl, vis: C.visibility, dew: C.dew_point_2m,
        },
        daily: D.time.map((t, i) => {
          const code = ensembleAt(D, 'weather_code', i, 'mode');
          return {
            date: t, code: code.v, models: code.n,
            tmax: ensembleAt(D, 'temperature_2m_max', i).v, tmin: ensembleAt(D, 'temperature_2m_min', i).v,
            appMax: ensembleAt(D, 'apparent_temperature_max', i).v, appMin: ensembleAt(D, 'apparent_temperature_min', i).v,
            rainProb: ensembleAt(D, 'precipitation_probability_max', i).v, precip: ensembleAt(D, 'precipitation_sum', i).v,
            snow: ensembleAt(D, 'snowfall_sum', i).v,
            uv: ensembleAt(D, 'uv_index_max', i).v, windMax: ensembleAt(D, 'wind_speed_10m_max', i).v,
            sunrise: firstAt(D, 'sunrise', i), sunset: firstAt(D, 'sunset', i),
            gustMax: ensembleAt(D, 'wind_gusts_10m_max', i).v, windDir: ensembleAt(D, 'wind_direction_10m_dominant', i, 'circular').v,
            daylight: ensembleAt(D, 'daylight_duration', i).v,
            bySource: bySourceDaily(D, i),
          };
        }),
        hourly: H.time.map((t, i) => {
          const code = ensembleAt(H, 'weather_code', i, 'mode');
          return {
            t, temp: ensembleAt(H, 'temperature_2m', i).v, code: code.v, models: code.n,
            pp: ensembleAt(H, 'precipitation_probability', i).v, precip: ensembleAt(H, 'precipitation', i).v, snow: ensembleAt(H, 'snowfall', i).v,
            wind: ensembleAt(H, 'wind_speed_10m', i).v, hum: ensembleAt(H, 'relative_humidity_2m', i).v, app: ensembleAt(H, 'apparent_temperature', i).v,
            uv: ensembleAt(H, 'uv_index', i).v,
            wdir: ensembleAt(H, 'wind_direction_10m', i, 'circular').v, gust: ensembleAt(H, 'wind_gusts_10m', i).v,
            cloud: ensembleAt(H, 'cloud_cover', i).v, vis: ensembleAt(H, 'visibility', i).v,
            bySource: bySourceHourly(H, i),
          };
        }),
      };
      try { localStorage.setItem(PREFIX + key, JSON.stringify(rec)); } catch { /* storage full */ }
      return rec;
    }
  } catch { /* offline or blocked — fall through to cache */ }
  return getCachedWeather(key);
}

// --- Marine / swimming conditions -------------------------------------------
// Sea state via Open-Meteo's Marine API (free, no key): waves, swell, water temperature and
// the modelled sea level that tides are read from. Coordinate-specific (a beach, or a weather
// city's own point), cached per rounded lat/lng so it works offline. Never throws.
//
// An inland point is a real answer, not a failure: the API returns the nearest grid cell with
// every value null (measured for Bangkok, Chiang Mai, Phnom Penh and Vientiane, while Phuket,
// Pattaya, Kampot and Da Nang all return data). That answer is cached as { none: true } so the
// weather screen can leave the sea card out for an inland city without asking again on every
// visit. Readers test `waveHeight != null`, which a none-record correctly fails.
//
// `cell` is the grid point the model actually used. It can sit well offshore (about 20 km for
// Da Nang), so the screen says how far away it is rather than presenting it as the beach.
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
    + '&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,'
    + 'sea_surface_temperature,sea_level_height_msl'
    + '&hourly=wave_height,sea_level_height_msl'
    + '&daily=wave_height_max,wave_direction_dominant,wave_period_max,swell_wave_height_max'
    + '&timezone=auto&forecast_days=7';
  try {
    const res = await fetchTimeout(url);
    const d = await res.json();
    const c = d && d.current;
    const col = (o, k, i) => (o && o[k] ? o[k][i] : null);
    if (c && c.wave_height != null) {
      const H = d.hourly || {};
      const D = d.daily || {};
      const rec = {
        fetchedAt: Date.now(), utcOffset: d.utc_offset_seconds,
        waveHeight: c.wave_height, wavePeriod: c.wave_period, waveDir: c.wave_direction,
        swellHeight: c.swell_wave_height, swellPeriod: c.swell_wave_period, swellDir: c.swell_wave_direction,
        seaTemp: c.sea_surface_temperature, seaLevel: c.sea_level_height_msl,
        cell: (d.latitude != null && d.longitude != null) ? { lat: d.latitude, lng: d.longitude } : null,
        hourly: (H.time || []).map((t, i) => ({ t, wh: col(H, 'wave_height', i), sl: col(H, 'sea_level_height_msl', i) })),
        daily: (D.time || []).map((date, i) => ({
          date, whMax: col(D, 'wave_height_max', i), wdDom: col(D, 'wave_direction_dominant', i),
          wpMax: col(D, 'wave_period_max', i), swMax: col(D, 'swell_wave_height_max', i),
        })),
      };
      try { localStorage.setItem(key, JSON.stringify(rec)); } catch { /* full */ }
      return rec;
    }
    // A well-formed answer with no sea values is an inland point (see above). An error body
    // has no `current`, so it falls through to the cache instead of being mistaken for one.
    if (c && d.error == null) {
      const rec = { fetchedAt: Date.now(), none: true };
      try { localStorage.setItem(key, JSON.stringify(rec)); } catch { /* full */ }
      return rec;
    }
  } catch { /* offline or blocked — fall through to cache */ }
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
    const res = await fetchTimeout(url);
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
const NO_SEA_TTL_MS = 24 * 60 * 60 * 1000;   // an inland answer; the coastline does not move
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
  const cached = getCachedMarine(coords);
  const ttl = (cached && cached.none) ? NO_SEA_TTL_MS : SEA_TTL_MS;
  return guarded(key, force || ageOf(cached) >= ttl, () => refreshMarine(coords));
}

export function maybeRefreshAir(spot, force = false) {
  if (!spot) return Promise.resolve(null);
  const key = `air:${spotKey(spot)}`;
  if (force) { delete _lastAttempt[key]; }
  return guarded(key, force || ageOf(getCachedAir(spotKey(spot))) >= AIR_TTL_MS, () => refreshAir(spot));
}
