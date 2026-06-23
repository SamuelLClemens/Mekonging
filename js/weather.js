// Weather + 7-day forecast via Open-Meteo (free, no API key, CORS-enabled).
// Offline-first: the last successful fetch per city is cached in localStorage with
// a timestamp (shown as "last updated"); a refresh only happens when online. When
// offline the cached reading is returned so the screen still works.

const PREFIX = 'mk.wx.';
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

// Key cities per country with coordinates. The first entry for each country is its
// default (capital / main hub).
export const WEATHER_SPOTS = [
  { country: 'th', city: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { country: 'th', city: 'Chiang Mai', lat: 18.7883, lng: 98.9853 },
  { country: 'th', city: 'Phuket', lat: 7.8804, lng: 98.3923 },
  { country: 'th', city: 'Krabi', lat: 8.0863, lng: 98.9063 },
  { country: 'vi', city: 'Hanoi', lat: 21.0278, lng: 105.8342 },
  { country: 'vi', city: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297 },
  { country: 'vi', city: 'Da Nang', lat: 16.0544, lng: 108.2022 },
  { country: 'vi', city: 'Hoi An', lat: 15.8801, lng: 108.3380 },
  { country: 'kh', city: 'Phnom Penh', lat: 11.5564, lng: 104.9282 },
  { country: 'kh', city: 'Siem Reap', lat: 13.3671, lng: 103.8448 },
  { country: 'la', city: 'Vientiane', lat: 17.9757, lng: 102.6331 },
  { country: 'la', city: 'Luang Prabang', lat: 19.8845, lng: 102.1348 },
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

export function getCachedWeather(key) {
  try { const c = JSON.parse(localStorage.getItem(PREFIX + key)); return c || null; } catch { return null; }
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
