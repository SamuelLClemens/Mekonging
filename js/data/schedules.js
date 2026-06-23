// Reference transport timetables for popular corridors. There is no free, open,
// real-time schedule API across these four countries, so these are CURATED reference
// departures — guidance only, always reconfirmed with the operator. The app re-syncs
// this file when online (see the Schedules screen), so updated timetables shipped in
// a new release reach travellers on their next connection.
export const SCHEDULES_VERIFIED = '2026-06';
export const SCHEDULES = [
  {
    id: 'th-bkk-cnx', country: 'th', from: 'Bangkok (Krung Thep Aphiwat)', to: 'Chiang Mai',
    mode: 'Train', operator: 'State Railway of Thailand', durationHrs: [11, 13], verified: '2026-06',
    note: 'Express and special-express services, including overnight sleepers. Book at dticket.railway.co.th.',
    book: 'https://www.dticket.railway.co.th/',
    departures: ['08:30', '13:45', '18:40', '19:35', '20:05', '22:50'],
  },
  {
    id: 'th-bkk-ayu', country: 'th', from: 'Bangkok', to: 'Ayutthaya',
    mode: 'Train', operator: 'State Railway of Thailand', durationHrs: [1.3, 2], verified: '2026-06',
    note: 'Frequent ordinary and express trains; a cheap, easy day trip. Times are approximate — many daily.',
    book: 'https://www.dticket.railway.co.th/',
    departures: ['06:40', '08:20', '09:25', '11:40', '13:00', '15:30', '17:00', '18:10'],
  },
  {
    id: 'vn-han-sgn', country: 'vi', from: 'Hanoi', to: 'Ho Chi Minh City (Saigon)',
    mode: 'Train (Reunification Express)', operator: 'Vietnam Railways', durationHrs: [32, 35], verified: '2026-06',
    note: 'The SE-series north–south trains; ~1,726 km. Most travellers ride a single scenic segment (e.g. Hue–Da Nang).',
    book: 'https://dsvn.vn/',
    departures: ['06:00', '09:00', '13:10', '19:30', '22:00'],
  },
  {
    id: 'vn-han-lcs', country: 'vi', from: 'Hanoi', to: 'Lao Cai (for Sapa)',
    mode: 'Night train', operator: 'Vietnam Railways + private cars', durationHrs: [8, 8.5], verified: '2026-06',
    note: 'Overnight to Lao Cai, then a 1-hour bus/van up to Sapa. Private sleeper carriages cost more.',
    book: 'https://dsvn.vn/',
    departures: ['20:35', '21:35', '22:00'],
  },
  {
    id: 'kh-pnh-rep', country: 'kh', from: 'Phnom Penh', to: 'Siem Reap',
    mode: 'Express bus', operator: 'Giant Ibis / Mey Hong', durationHrs: [6, 7], verified: '2026-06',
    note: 'Reputable operators with assigned seats and wifi; book a day ahead in high season.',
    book: 'https://12go.asia/',
    departures: ['07:30', '08:45', '09:30', '12:30', '23:00'],
  },
  {
    id: 'kh-pnh-shv', country: 'kh', from: 'Phnom Penh', to: 'Sihanoukville',
    mode: 'Train', operator: 'Royal Railway', durationHrs: [6.5, 7.5], verified: '2026-06',
    note: 'A scenic line that runs mainly on weekends and holidays; confirm the current days before relying on it.',
    book: 'https://royal-railway.com/',
    departures: ['07:00'],
  },
  {
    id: 'la-vte-lpq', country: 'la', from: 'Vientiane', to: 'Luang Prabang',
    mode: 'High-speed train', operator: 'Laos–China Railway (LCR)', durationHrs: [1.7, 2.2], verified: '2026-06',
    note: 'The fast EMU services cut a full day of road travel to ~2 hours; seats sell out, so book early at the station or via an agent.',
    book: 'https://12go.asia/',
    departures: ['08:08', '09:55', '12:30', '15:25', '18:05'],
  },
  {
    id: 'la-lpq-vv', country: 'la', from: 'Luang Prabang', to: 'Vang Vieng',
    mode: 'High-speed train', operator: 'Laos–China Railway (LCR)', durationHrs: [0.8, 1.1], verified: '2026-06',
    note: 'A short hop on the LCR line; from Vang Vieng it is ~1 hour onward to Vientiane.',
    book: 'https://12go.asia/',
    departures: ['09:00', '10:45', '13:20', '16:15'],
  },
];

export function schedulesForCountry(id) { return SCHEDULES.filter((s) => s.country === id); }
