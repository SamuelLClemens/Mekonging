// Travel REGIONS — the browse layer Explore is built on.
//
// NAMING: the UI calls these "regions". Internally they are ZONES, because this codebase
// already uses "region" for ADM1 provinces (js/data/regions.th|vi|kh|la.js hold the province
// polygons; regionsMap()/regionScreen()/#region-… in main.js drive them). A zone is a GROUP
// of those provinces — 4 to 6 per country, 19 in total — and that is what a traveller
// actually navigates by.
//
// WHY: the app holds ~574 places across ~132 towns, but 184 provinces. Browsing by province
// means most taps land on an empty one. Grouping them puts every region at roughly 25–40
// places, which is a real browsable unit, and it needs no new geometry: a zone is drawn as
// the union of its provinces' existing polygons, and its places/towns are derived at runtime
// from placesInProvince(), so nothing here can go stale as places are added.
//
// Each zone carries dense, scannable FACTS rather than prose — including `notFor`, the
// honest counterweight a guidebook will not print. Region-level claims only (seasons,
// transport modes, realistic durations); anything specific enough to change — prices,
// schedules, opening hours — belongs on the individual place record with its own source.
//
// Province code lists are exhaustive: every province of every country belongs to exactly one
// zone (77+64+25+18 = 184 accounted for). See the assertion helper at the foot of this file.

export const ZONES = {
  th: [
    {
      id: 'north', name: 'The North', emoji: '⛰️',
      tagline: 'Lanna mountains, hill towns and cool-season air.',
      suits: 'Slow travel, motorbike loops, trekking, temples without Bangkok heat.',
      notFor: 'Beaches, and anyone visiting Mar–Apr, when crop burning drops air quality hard.',
      bestMonths: 'Nov–Feb (cool, clear). Jul–Oct is green and wet but quiet.',
      avoidMonths: 'Mar–Apr — smoke season.',
      howLong: '5–10 days; the Mae Hong Son loop alone wants 4–5.',
      gettingAround: 'Buses and minivans between towns; scooter or rented car for the loops. Chiang Mai has the region\'s only busy airport.',
      gateway: 'Chiang Mai',
      provinces: ['TH-50', 'TH-51', 'TH-52', 'TH-53', 'TH-54', 'TH-55', 'TH-56', 'TH-57', 'TH-58'],
    },
    {
      id: 'isaan', name: 'Isaan · The Northeast', emoji: '🌾',
      tagline: 'Thailand\'s rice-farming heartland — Khmer ruins, Mekong towns, almost no tourists.',
      suits: 'Travellers who want everyday Thailand, big food, and low prices.',
      notFor: 'Anyone on a short trip chasing highlights — distances are long and sights are spread thin.',
      bestMonths: 'Nov–Feb (dry, cooler). Green season Jun–Oct suits the rice terraces.',
      avoidMonths: 'Apr — the hottest place in the country.',
      howLong: '4–7 days, usually as a Mekong-side run rather than a full sweep.',
      gettingAround: 'Overnight trains and buses from Bangkok; sparse local transport once there, so a car helps.',
      gateway: 'Nakhon Ratchasima (Korat) or Udon Thani',
      provinces: ['TH-30', 'TH-31', 'TH-32', 'TH-33', 'TH-34', 'TH-35', 'TH-36', 'TH-37', 'TH-38', 'TH-39', 'TH-40', 'TH-41', 'TH-42', 'TH-43', 'TH-44', 'TH-45', 'TH-46', 'TH-47', 'TH-48', 'TH-49'],
    },
    {
      id: 'central', name: 'Central & Bangkok', emoji: '🏙',
      tagline: 'The capital, the old capitals, and the plains between them.',
      suits: 'First arrivals, history, food, and anyone connecting onward — everything routes through here.',
      notFor: 'Quiet. Bangkok is relentless and the plains are flat farmland.',
      bestMonths: 'Nov–Feb (dry, least humid).',
      avoidMonths: 'Apr–May heat; Sep–Oct is the wettest.',
      howLong: '3–5 days for Bangkok, plus a day each for Ayutthaya and Sukhothai.',
      gettingAround: 'The best transport in the country: BTS/MRT in the city, frequent trains and buses out of it.',
      gateway: 'Bangkok',
      provinces: ['TH-10', 'TH-11', 'TH-12', 'TH-13', 'TH-14', 'TH-15', 'TH-16', 'TH-17', 'TH-18', 'TH-19', 'TH-60', 'TH-61', 'TH-62', 'TH-63', 'TH-64', 'TH-65', 'TH-66', 'TH-67', 'TH-72', 'TH-73', 'TH-74'],
    },
    {
      id: 'east', name: 'The East Coast', emoji: '🏖',
      tagline: 'Bangkok\'s weekend sea — plus the quieter islands near the Cambodian border.',
      suits: 'Short beach breaks from the capital, and the overland run into Cambodia.',
      notFor: 'Anyone picturing postcard Thailand — Pattaya is a city, not a beach idyll.',
      bestMonths: 'Nov–Apr. Koh Chang largely shuts down in the heaviest rains.',
      avoidMonths: 'Jun–Sep on the islands.',
      howLong: '2–5 days.',
      gettingAround: 'Buses and minivans from Bangkok in 2–5 hours; ferries to the islands.',
      gateway: 'Pattaya or Trat (for Koh Chang)',
      provinces: ['TH-20', 'TH-21', 'TH-22', 'TH-23', 'TH-24', 'TH-25', 'TH-26', 'TH-27'],
    },
    {
      id: 'west', name: 'The West', emoji: '🌊',
      tagline: 'River-and-jungle country inland, long calm gulf beaches on the coast.',
      suits: 'WWII history at Kanchanaburi, national parks, and family-friendly seaside.',
      notFor: 'Nightlife or island-hopping.',
      bestMonths: 'Nov–Feb. Hua Hin stays usable most of the year.',
      avoidMonths: 'Apr heat inland.',
      howLong: '2–4 days.',
      gettingAround: 'Easy day-trip distance from Bangkok by train, bus or minivan.',
      gateway: 'Kanchanaburi or Hua Hin',
      provinces: ['TH-70', 'TH-71', 'TH-75', 'TH-76', 'TH-77'],
    },
    {
      id: 'south', name: 'The South & Islands', emoji: '🏝',
      tagline: 'Two coasts with opposite weather — Andaman limestone west, Gulf islands east.',
      suits: 'Diving, island-hopping, and beaches worth the flight.',
      notFor: 'Budget travel in high season, or anyone wanting both coasts at their best at once.',
      bestMonths: 'Andaman (Phuket, Krabi, Lanta): Nov–Apr. Gulf (Samui, Phangan, Tao): Jan–Aug.',
      avoidMonths: 'Andaman May–Oct; the Gulf peaks in rain Oct–Dec.',
      howLong: '7–14 days; pick one coast per trip.',
      gettingAround: 'Fly into Phuket, Krabi or Surat Thani, then ferries. Overland from Bangkok is a long night.',
      gateway: 'Phuket, Krabi or Surat Thani',
      provinces: ['TH-80', 'TH-81', 'TH-82', 'TH-83', 'TH-84', 'TH-85', 'TH-86', 'TH-90', 'TH-91', 'TH-92', 'TH-93', 'TH-94', 'TH-95', 'TH-96'],
    },
  ],

  vi: [
    {
      id: 'north-highlands', name: 'The Northern Highlands', emoji: '🏔',
      tagline: 'Rice terraces, limestone passes and hill-tribe markets on the Chinese border.',
      suits: 'Motorbike loops (Ha Giang), trekking, and the best scenery in the country.',
      notFor: 'Anyone short on time or uneasy on a bike — the roads are the attraction.',
      bestMonths: 'Sep–Oct (terraces golden) and Mar–May. Dec–Feb is genuinely cold.',
      avoidMonths: 'Jun–Aug — landslide season on mountain roads.',
      howLong: '4–8 days; the Ha Giang loop is 3–4 on its own.',
      gettingAround: 'Sleeper buses and the night train from Hanoi; rented bikes or easy-riders once there.',
      gateway: 'Hanoi, then Sapa or Ha Giang',
      provinces: ['VN-01', 'VN-02', 'VN-03', 'VN-04', 'VN-05', 'VN-06', 'VN-07', 'VN-09', 'VN-14', 'VN-53', 'VN-68', 'VN-69', 'VN-71'],
    },
    {
      id: 'red-river', name: 'Hanoi & the Red River Delta', emoji: '🏛',
      tagline: 'The capital, Ha Long Bay, and the inland karsts of Ninh Binh.',
      suits: 'Old-quarter street food, the country\'s best museums, and the classic bay cruise.',
      notFor: 'Escaping crowds — this is the most-visited corner of Vietnam.',
      bestMonths: 'Oct–Dec and Mar–Apr.',
      avoidMonths: 'Jul–Aug (hot, wet, and peak domestic travel); Feb–Mar drizzle greys out the bay.',
      howLong: '4–7 days.',
      gettingAround: 'Vietnam\'s densest transport hub — trains, buses and flights everywhere. Ninh Binh is 2 hours by train.',
      gateway: 'Hanoi',
      provinces: ['VN-HN', 'VN-HP', 'VN-13', 'VN-18', 'VN-20', 'VN-54', 'VN-56', 'VN-61', 'VN-63', 'VN-66', 'VN-67', 'VN-70'],
    },
    {
      id: 'north-central', name: 'The North Central Coast', emoji: '🕯',
      tagline: 'Imperial Hue, the DMZ, and the world\'s largest caves at Phong Nha.',
      suits: 'History, and caving that has no real equal anywhere.',
      notFor: 'Beach time — the coast here is working, not resort.',
      bestMonths: 'Feb–Aug. Caves and the Phong Nha park close in flood season.',
      avoidMonths: 'Sep–Nov — this stretch takes the worst typhoons and flooding in Vietnam.',
      howLong: '3–5 days.',
      gettingAround: 'The Reunification Express north–south; buses to Phong Nha from Hue or Dong Hoi.',
      gateway: 'Hue or Dong Hoi',
      provinces: ['VN-21', 'VN-22', 'VN-23', 'VN-24', 'VN-25', 'VN-26'],
    },
    {
      id: 'central', name: 'The Central Coast & Highlands', emoji: '🏮',
      tagline: 'Hoi An\'s lanterns and Da Nang\'s beaches, with cool coffee country behind them.',
      suits: 'Tailoring, food, easy beach days, and Da Lat\'s cooler air when the coast is too hot.',
      notFor: 'Solitude in Hoi An, which is small and very busy.',
      bestMonths: 'Coast Feb–Aug; the highlands (Da Lat) are pleasant year-round.',
      avoidMonths: 'Sep–Dec on the coast — typhoons and flooding reach Hoi An\'s old town.',
      howLong: '5–8 days.',
      gettingAround: 'Da Nang airport serves the whole area; Hoi An is 45 min by taxi. Buses climb to Da Lat overnight.',
      gateway: 'Da Nang',
      provinces: ['VN-DN', 'VN-27', 'VN-28', 'VN-29', 'VN-30', 'VN-31', 'VN-32', 'VN-33', 'VN-34', 'VN-35', 'VN-36', 'VN-40', 'VN-72'],
    },
    {
      id: 'south', name: 'Ho Chi Minh City & the Mekong Delta', emoji: '🛶',
      tagline: 'The commercial capital, the war\'s heaviest history, and the delta\'s floating markets.',
      suits: 'Nightlife, coffee culture, day trips to the tunnels and the delta, and Phu Quoc\'s beaches.',
      notFor: 'Cool weather — it is hot and humid here every month of the year.',
      bestMonths: 'Dec–Apr (dry).',
      avoidMonths: 'Jun–Sep, when afternoon downpours are near-daily.',
      howLong: '4–7 days including the delta.',
      gettingAround: 'Vietnam\'s busiest airport; buses to the delta take 2–4 hours; boats within it.',
      gateway: 'Ho Chi Minh City',
      provinces: ['VN-SG', 'VN-37', 'VN-39', 'VN-41', 'VN-43', 'VN-43-1', 'VN-44', 'VN-45', 'VN-46', 'VN-47', 'VN-49', 'VN-50', 'VN-51', 'VN-52', 'VN-55', 'VN-57', 'VN-58', 'VN-59', 'VN-73', 'VN-CT'],
    },
  ],

  kh: [
    {
      id: 'angkor-nw', name: 'Angkor & the Northwest', emoji: '🛕',
      tagline: 'The temples that define the country, plus Battambang\'s quieter colonial streets.',
      suits: 'Anyone visiting Cambodia at all — Angkor is the reason most people come.',
      notFor: 'Travellers hoping to see Angkor alone; sunrise at Angkor Wat draws crowds daily.',
      bestMonths: 'Nov–Feb (dry, cooler). Jun–Oct greens the moats and thins the crowds.',
      avoidMonths: 'Mar–May — punishing heat on unshaded stone.',
      howLong: '3–5 days: two on the temples minimum, plus Battambang.',
      gettingAround: 'Siem Reap has an international airport; tuk-tuk by the day around the park.',
      gateway: 'Siem Reap',
      provinces: ['KH-17', 'KH-2', 'KH-1', 'KH-15', 'KH-22', 'KH-24', 'KH-13'],
    },
    {
      id: 'central', name: 'Phnom Penh & the Central Plains', emoji: '🏙',
      tagline: 'The capital, the Khmer Rouge memorials, and the farmland along the Mekong.',
      suits: 'Modern Cambodian history — hard, essential, and best understood here.',
      notFor: 'Light sightseeing. Tuol Sleng and Choeung Ek are distressing by design.',
      bestMonths: 'Nov–Feb.',
      avoidMonths: 'Mar–May heat.',
      howLong: '2–3 days.',
      gettingAround: 'The country\'s road hub — buses radiate to every other region; a fast expressway now runs to the coast.',
      gateway: 'Phnom Penh',
      provinces: ['KH-12', 'KH-8', 'KH-3', 'KH-25', 'KH-4', 'KH-5', 'KH-6', 'KH-14', 'KH-20', 'KH-21'],
    },
    {
      id: 'coast', name: 'The Coast & Islands', emoji: '🏝',
      tagline: 'Pepper farms and river towns at Kampot and Kep, white sand out on Koh Rong.',
      suits: 'Slowing down: kayaking, seafood, and islands that still feel unfinished.',
      notFor: 'Anyone expecting Thailand\'s infrastructure — Sihanoukville\'s casino build-out changed it sharply.',
      bestMonths: 'Nov–Apr.',
      avoidMonths: 'Jun–Oct, when boats to the islands get cancelled in rough seas.',
      howLong: '4–7 days.',
      gettingAround: 'Buses from Phnom Penh in 3–5 hours; ferries out to the islands from Sihanoukville.',
      gateway: 'Kampot or Sihanoukville',
      provinces: ['KH-18', 'KH-7', 'KH-23', 'KH-9'],
    },
    {
      id: 'northeast', name: 'The Northeast & Upper Mekong', emoji: '🐬',
      tagline: 'Red-earth hill country, waterfalls, elephant sanctuaries and rare river dolphins.',
      suits: 'Travellers going where almost nobody goes, and anyone crossing overland into Laos.',
      notFor: 'Tight schedules — roads are slow and services are thin.',
      bestMonths: 'Nov–Feb.',
      avoidMonths: 'Jun–Oct, when unsealed roads to Ratanakiri and Mondulkiri turn to mud.',
      howLong: '4–6 days.',
      gettingAround: 'Long bus days from Phnom Penh (6–10 hours); a bike or hired driver once you arrive.',
      gateway: 'Kratie or Banlung',
      provinces: ['KH-10', 'KH-19', 'KH-16', 'KH-11'],
    },
  ],

  la: [
    {
      id: 'far-north', name: 'The Far North', emoji: '🌿',
      tagline: 'Dense forest, ethnic-minority villages and the slow boat down from the Thai border.',
      suits: 'Trekking, homestays, and arriving in Laos the memorable way — two days on the Mekong.',
      notFor: 'Comfort. Roads are winding, buses are old, and villages are genuinely basic.',
      bestMonths: 'Nov–Feb (dry, cool).',
      avoidMonths: 'Mar–Apr, when agricultural burning fills the valleys with smoke.',
      howLong: '4–7 days.',
      gettingAround: 'The Huay Xai slow boat to Luang Prabang takes 2 days; buses elsewhere are slow mountain runs.',
      gateway: 'Huay Xai or Luang Namtha',
      provinces: ['LA-LM', 'LA-BK', 'LA-PH', 'LA-OU', 'LA-XA'],
    },
    {
      id: 'luang-prabang', name: 'Luang Prabang & the Nam Ou', emoji: '🧡',
      tagline: 'A UNESCO river town of temples and French shophouses, with karst villages upstream.',
      suits: 'Almost everyone — the alms round, the waterfalls, and Nong Khiaw\'s viewpoints.',
      notFor: 'Late nights; a nationwide curfew closes things early, and the town is strictly quiet.',
      bestMonths: 'Nov–Mar.',
      avoidMonths: 'Mar–Apr burning season hazes the famous river views.',
      howLong: '3–6 days, plus 2–3 upriver at Nong Khiaw or Muang Ngoi.',
      gettingAround: 'The China–Laos railway put Vientiane within 2 hours; boats and buses run north up the Nam Ou.',
      gateway: 'Luang Prabang',
      provinces: ['LA-LP', 'LA-HO'],
    },
    {
      id: 'centre', name: 'Vientiane & the Centre', emoji: '🛵',
      tagline: 'The low-key capital, Vang Vieng\'s karst valley, and the Thakhek caves loop.',
      suits: 'Motorbike loops, caving, kayaking, and the easiest border hop to Thailand.',
      notFor: 'Grand sightseeing — Vientiane is the quietest capital in the region.',
      bestMonths: 'Nov–Feb.',
      avoidMonths: 'Jun–Sep, when the Konglor cave loop floods.',
      howLong: '4–7 days.',
      gettingAround: 'The railway links Vientiane to Vang Vieng and Luang Prabang fast; buses south are long.',
      gateway: 'Vientiane',
      provinces: ['LA-VT', 'LA-VI', 'LA-XI', 'LA-XN', 'LA-BL', 'LA-KH'],
    },
    {
      id: 'south', name: 'The South', emoji: '☕',
      tagline: 'Coffee plantations on the Bolaven Plateau and 4,000 islands where the Mekong braids apart.',
      suits: 'The Bolaven loop, Khmer ruins at Wat Phou, and hammock time on Don Det.',
      notFor: 'Anyone in a hurry — the whole point of Si Phan Don is that nothing happens.',
      bestMonths: 'Nov–Feb. Waterfalls are at their most dramatic Aug–Oct.',
      avoidMonths: 'Mar–May heat on the lowlands.',
      howLong: '5–8 days.',
      gettingAround: 'Pakse is the hub — buses from Vientiane are an overnight haul; boats out to the islands.',
      gateway: 'Pakse',
      provinces: ['LA-CH', 'LA-SV', 'LA-SL', 'LA-XE', 'LA-AT'],
    },
  ],
};

// All zones for one country, or [] for an unknown code.
export function zonesFor(cc) { return ZONES[cc] || []; }

// One zone by country + id.
export function getZone(cc, id) { return zonesFor(cc).find((z) => z.id === id) || null; }

// Which zone owns a province code, e.g. 'TH-58' -> the North zone. Null if unmapped.
export function zoneForProvince(cc, code) {
  return zonesFor(cc).find((z) => z.provinces.includes(code)) || null;
}

// Every province code covered by a country's zones — used by the map renderer to shade a
// zone as the union of its provinces, and by the coverage self-check below.
export function zoneProvinceCodes(cc) {
  return zonesFor(cc).flatMap((z) => z.provinces);
}

// Self-check: every province belongs to exactly one zone. Returns { missing, duplicated }
// against a list of the country's real province codes; both empty means the mapping is
// complete. Called by the dev-only assertion in main.js, never in a user path.
export function zoneCoverageGaps(cc, allProvinceCodes) {
  const mapped = zoneProvinceCodes(cc);
  const seen = new Set();
  const duplicated = [];
  mapped.forEach((c) => { if (seen.has(c)) duplicated.push(c); seen.add(c); });
  const missing = allProvinceCodes.filter((c) => !seen.has(c));
  return { missing, duplicated };
}
