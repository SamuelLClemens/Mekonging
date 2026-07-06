// Suggested trip plans ("route templates"). Curated from the classic, well-trodden
// routes for each country, tagged by trip length, party and budget so the app can
// match a plan to the traveller's profile (see #plans / suggestPlans below).
// Nights are GUIDANCE — travellers stretch or compress freely. Sources are the
// official tourism boards; routes themselves are common knowledge.
//
// days: rough total. party/budget: which profiles the plan suits ([] = anyone).
// pace: 'relaxed' | 'steady' | 'fast'.

export const ITINERARIES = [
  // ---------------- Thailand ----------------
  {
    id: "it-th-north-week", country: "th", title: "Northern culture loop", days: 7, pace: "steady",
    party: ["solo", "couple", "family"], budget: ["low", "mid"],
    summary: "Bangkok's highlights, then the cool north: old-city temples and food in Chiang Mai and the mountain village vibe of Pai.",
    stops: [
      { title: "Bangkok", nights: 2, why: "Grand Palace + Wat Pho, Chinatown street food" },
      { title: "Chiang Mai", nights: 3, why: "Old-city temples, night markets, cooking class" },
      { title: "Pai", nights: 2, why: "Mountain valley, hot springs, walking street" },
    ],
    tips: ["Take the sleeper train or a short flight to Chiang Mai.", "The Chiang Mai–Pai minivan is 3 hours of hairpins — sit front if prone to motion sickness."],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    id: "it-th-classic-two-weeks", country: "th", title: "Classic north + islands", days: 14, pace: "steady",
    party: ["solo", "couple"], budget: ["low", "mid"],
    summary: "The backpacker classic: Bangkok, the northern loop, then south for Andaman beaches and limestone bays.",
    stops: [
      { title: "Bangkok", nights: 3, why: "Temples, markets, canal boats" },
      { title: "Chiang Mai", nights: 3, why: "Temples, food, elephants (ethical parks)" },
      { title: "Pai", nights: 2, why: "Valley views, waterfalls, canyon sunset" },
      { title: "Krabi / Ao Nang", nights: 3, why: "Railay cliffs, island-hopping" },
      { title: "Koh Lanta", nights: 3, why: "Long quiet beaches, slow pace" },
    ],
    tips: ["Fly Chiang Mai → Krabi to save a long day of travel.", "November–April is the Andaman dry season."],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    id: "it-th-family-ten-days", country: "th", title: "Thailand with kids", days: 10, pace: "relaxed",
    party: ["family"], budget: ["mid", "high"],
    summary: "A gentle pace: two bases only — Bangkok sights the kids will love, then a beach resort week with day trips.",
    stops: [
      { title: "Bangkok", nights: 3, why: "Canal boat, Grand Palace early, big malls for the heat" },
      { title: "Krabi / Ao Nang", nights: 6, why: "Resort pool, calm beaches, easy island day trips" },
    ],
    tips: ["Two bases beat five — kids melt down on travel days.", "Book a resort with a kids' club and a pool; use mornings for outings."],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    id: "it-th-slow-month", country: "th", title: "A slow month up north", days: 30, pace: "relaxed",
    party: ["solo", "couple"], budget: ["low", "mid"],
    summary: "Base yourself in Chiang Mai on a monthly rate, day-trip the region, and take an unhurried Pai + Chiang Rai loop.",
    stops: [
      { title: "Chiang Mai (base)", nights: 20, why: "Nimman cafés + coworking, monthly apartment rates" },
      { title: "Pai", nights: 4, why: "Slow valley days, hot springs" },
      { title: "Chiang Rai", nights: 3, why: "White Temple, Golden Triangle" },
      { title: "Bangkok", nights: 3, why: "Bookend the trip" },
    ],
    tips: ["Monthly apartment rates run far below nightly.", "Avoid the smoky burning season (roughly Feb–Apr) if sensitive."],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },

  // ---------------- Vietnam ----------------
  {
    id: "it-vi-north-week", country: "vi", title: "Northern Vietnam essentials", days: 7, pace: "steady",
    party: ["solo", "couple", "family"], budget: ["low", "mid"],
    summary: "Hanoi's Old Quarter, a night afloat in Ha Long / Lan Ha Bay, and the karst-and-rice-field scenery of Ninh Binh.",
    stops: [
      { title: "Hanoi", nights: 3, why: "Old Quarter food, lakes, museums" },
      { title: "Ha Long Bay (cruise)", nights: 1, why: "Overnight among the karsts" },
      { title: "Ninh Binh (Tam Coc)", nights: 2, why: "Rowboat caves, Hang Mua viewpoint, cycling" },
    ],
    tips: ["Pick a Lan Ha Bay route for fewer boats.", "Ninh Binh guesthouses lend bicycles — the lanes are flat and quiet."],
    sources: [{ org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel" }],
  },
  {
    id: "it-vi-classic-two-weeks", country: "vi", title: "The full length of Vietnam", days: 15, pace: "fast",
    party: ["solo", "couple"], budget: ["low", "mid"],
    summary: "The classic top-to-bottom run: Hanoi and the bay, imperial Hue, lantern-lit Hoi An, then Saigon and the Mekong Delta.",
    stops: [
      { title: "Hanoi", nights: 3, why: "Old Quarter, street food crawl" },
      { title: "Ha Long Bay (cruise)", nights: 1, why: "Overnight cruise" },
      { title: "Hue", nights: 2, why: "Imperial citadel, royal tombs" },
      { title: "Hoi An", nights: 3, why: "Old town, tailors, cooking class" },
      { title: "Ho Chi Minh City", nights: 3, why: "War museum, rooftop bars" },
      { title: "Mekong Delta (Can Tho)", nights: 2, why: "Floating market at dawn" },
    ],
    tips: ["Fly Hue or Da Nang → HCMC to keep the pace sane.", "Book the north for October–April; the far south is warm year-round."],
    sources: [{ org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel" }],
  },
  {
    id: "it-vi-family-beach", country: "vi", title: "Vietnam with kids (centre + beach)", days: 10, pace: "relaxed",
    party: ["family"], budget: ["mid", "high"],
    summary: "Hanoi tasters, then settle on the central coast: Hoi An's old town with Da Nang's beach — one hotel, easy day trips.",
    stops: [
      { title: "Hanoi", nights: 3, why: "Water-puppet show, Old Quarter by cyclo" },
      { title: "Hoi An / Da Nang", nights: 6, why: "Beach + pool base, lantern old town, basket boats" },
    ],
    tips: ["Hoi An's basket-boat rides and lantern-making are kid magnets.", "My Khe beach has gentle mornings; swim before noon heat."],
    sources: [{ org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel" }],
  },
  {
    id: "it-vi-hagiang-adventure", country: "vi", title: "Ha Giang loop adventure", days: 8, pace: "fast",
    party: ["solo", "couple"], budget: ["low"],
    summary: "Hanoi, then the famous 3–4 day Ha Giang karst-plateau loop by motorbike (or with an easy-rider driver), homestays included.",
    stops: [
      { title: "Hanoi", nights: 2, why: "Gear up, night bus north" },
      { title: "Ha Giang loop", nights: 4, why: "Ma Pi Leng pass, Dong Van, homestay nights" },
      { title: "Hanoi", nights: 1, why: "Recover + food crawl" },
    ],
    tips: ["No motorbike experience? Ride pillion with an easy-rider — the views are the point.", "Bring layers: the plateau is genuinely cold in winter."],
    sources: [{ org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel" }],
  },

  // ---------------- Cambodia ----------------
  {
    id: "it-kh-week", country: "kh", title: "Temples + capital + coast", days: 8, pace: "steady",
    party: ["solo", "couple", "family"], budget: ["low", "mid"],
    summary: "Angkor's temples from Siem Reap, Phnom Penh's history, then the relaxed riverside of Kampot and Kep's crab shacks.",
    stops: [
      { title: "Siem Reap", nights: 3, why: "Angkor sunrise, floating villages" },
      { title: "Phnom Penh", nights: 2, why: "Royal Palace, genocide museum (teens+)" },
      { title: "Kampot & Kep", nights: 2, why: "River sunsets, pepper farms, crab market" },
    ],
    tips: ["Buy the Angkor pass the evening before for a bonus sunset.", "Kampot–Kep is an easy tuk-tuk day loop."],
    sources: [{ org: "Ministry of Tourism Cambodia", url: "https://www.tourismcambodia.org" }],
  },
  {
    id: "it-kh-two-weeks", country: "kh", title: "Cambodia unhurried", days: 14, pace: "relaxed",
    party: ["solo", "couple"], budget: ["low", "mid"],
    summary: "The week-one classics plus time for an island (Koh Rong Sanloem) and the wild east (Mondulkiri's elephants).",
    stops: [
      { title: "Siem Reap", nights: 4, why: "Angkor over two days, cooking class" },
      { title: "Battambang", nights: 2, why: "Bamboo train, colonial streets, bat caves" },
      { title: "Phnom Penh", nights: 2, why: "History + riverside" },
      { title: "Koh Rong Sanloem", nights: 3, why: "White sand, bioluminescence" },
      { title: "Kampot", nights: 2, why: "River town wind-down" },
    ],
    tips: ["Ferries to the islands are weather-dependent — keep a buffer day.", "Mondulkiri swaps in well for the island if you prefer forests."],
    sources: [{ org: "Ministry of Tourism Cambodia", url: "https://www.tourismcambodia.org" }],
  },

  // ---------------- Laos ----------------
  {
    id: "it-la-week", country: "la", title: "Laos essentials", days: 7, pace: "steady",
    party: ["solo", "couple", "family"], budget: ["low", "mid"],
    summary: "Luang Prabang's temples and waterfalls, Vang Vieng's karst country, and a Vientiane wind-down.",
    stops: [
      { title: "Luang Prabang", nights: 3, why: "Old town, Kuang Si Falls, night market" },
      { title: "Vang Vieng", nights: 2, why: "Blue lagoons, viewpoints, kayaking" },
      { title: "Vientiane", nights: 2, why: "That Luang, riverside sunset" },
    ],
    tips: ["The Laos–China railway links all three in comfort — book seats a day or two ahead.", "Kuang Si is best early, before the tour buses."],
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }],
  },
  {
    id: "it-la-slow-two-weeks", country: "la", title: "Slow boat & islands", days: 14, pace: "relaxed",
    party: ["solo", "couple"], budget: ["low"],
    summary: "Enter by the two-day Mekong slow boat, linger in Luang Prabang and Nong Khiaw, then drift south to the 4000 Islands.",
    stops: [
      { title: "Huay Xai → Pakbeng → Luang Prabang (slow boat)", nights: 2, why: "The Mekong rite of passage" },
      { title: "Luang Prabang", nights: 3, why: "Temples, falls, café mornings" },
      { title: "Nong Khiaw", nights: 3, why: "Karst viewpoints, village treks" },
      { title: "Vientiane", nights: 1, why: "Transit + riverside" },
      { title: "Si Phan Don (Don Det)", nights: 4, why: "Hammocks, dolphins, waterfalls" },
    ],
    tips: ["Take the boat, not the 'speedboat'.", "Budget cash — ATMs are sparse outside the big towns."],
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }],
  },
  {
    id: "it-th-maehongson-loop", country: "th", title: "Mae Hong Son Loop", days: 7, pace: "steady",
    party: ["solo", "couple"], budget: ["low", "mid"],
    summary: "The classic 600 km mountain circuit from Chiang Mai through Pai, Mae Hong Son and Mae Sariang — 1,864 curves of misty ridgelines, hot springs, Shan temples and quiet border-country towns, done clockwise or counter-clockwise by motorbike or minivan.",
    stops: [
      { title: "Chiang Mai", nights: 1, why: "Stage the loop: sort a reliable bike or minivan tickets, then warm up with old-city temples and the night market." },
      { title: "Pai", nights: 2, why: "The 762-curve descent lands you in a laid-back valley of hot springs, Pai Canyon sunsets and a lively walking street." },
      { title: "Mae Hong Son", nights: 2, why: "Burmese-style temples ring Jong Kham lake, with Wat Phra That Doi Kong Mu above town and a day trip to the tea village of Ban Rak Thai." },
      { title: "Mae Sariang", nights: 1, why: "A quiet riverside town on the loop's southern leg that breaks up the long final ride back to Chiang Mai." },
    ],
    tips: ["Rent a well-maintained 125cc or larger bike and check brakes before leaving Chiang Mai; the route has 1,864 curves, so pack motion-sickness tablets if travelling by minivan.", "Ride mornings only in the rainy season (June-October); afternoon downpours make the mountain switchbacks slippery.", "Book Pai accommodation ahead in high season (November-February); the town fills up fast on weekends."],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    id: "it-th-lanna-slow-culture", country: "th", title: "Lanna Slow-Culture Trail", days: 9, pace: "relaxed",
    party: ["solo", "couple"], budget: ["low", "mid"],
    summary: "An unhurried journey down the old northern kingdoms: Chiang Mai's living Lanna heritage, Lampang's horse-carriage streets and teak temples, then the UNESCO-listed ruins of Sukhothai, cradle of the first Thai kingdom.",
    stops: [
      { title: "Chiang Mai", nights: 3, why: "Base yourself inside the moat for Wat Phra Singh and Wat Chedi Luang, craft villages, khao soi and a Doi Suthep sunrise." },
      { title: "Lampang", nights: 2, why: "A slower Lanna town of horse-drawn carriages, riverside teak houses and Wat Phra That Lampang Luang, one of Thailand's finest wooden temples." },
      { title: "Sukhothai", nights: 3, why: "Cycle the UNESCO Historical Park at dawn among lotus ponds and Buddha figures, with a day trip to the quieter ruins of Si Satchanalai." },
    ],
    tips: ["Travel Chiang Mai to Lampang by train for the scenery; Sukhothai has no railway station, so continue by bus (direct services run, or change at Phitsanulok).", "Rent a bicycle at Sukhothai Historical Park and start at opening time; the light is best and the heat mildest before 9 am.", "Wat Phra That Lampang Luang sits about 20 km from Lampang town — arrange a songthaew or taxi for the half-day visit."],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    id: "it-vi-hagiang-ninhbinh", country: "vi", title: "Ha Giang Loop and Northern Karsts", days: 9, pace: "steady",
    party: ["solo", "couple"], budget: ["low"],
    summary: "Vietnam's great northern adventure on a backpacker budget: Hanoi's Old Quarter, the legendary Ha Giang loop through the Dong Van Karst Plateau and Ma Pi Leng Pass, then the river-and-limestone landscapes of Ninh Binh on the way back.",
    stops: [
      { title: "Hanoi", nights: 2, why: "Old Quarter street food and Hoan Kiem lake while you arrange the loop — self-ride or easy-rider — and the night bus north." },
      { title: "Ha Giang loop (Yen Minh - Dong Van - Meo Vac - Du Gia)", nights: 4, why: "The classic 3-4 day circuit across the Dong Van Karst Plateau Geopark, cresting Ma Pi Leng Pass above the Nho Que river with homestay nights in minority villages." },
      { title: "Ninh Binh (Tam Coc / Trang An)", nights: 2, why: "Decompress after the mountains with a rowed Trang An boat ride through caves and the 500-step Hang Mua viewpoint over the rice paddies." },
    ],
    tips: ["Foreigners need a border-area permit for the Ha Giang loop; homestays and rental shops in Ha Giang city arrange it cheaply on the spot.", "If you have limited motorbike experience, book an easy-rider (you ride pillion) — the passes are spectacular but unforgiving.", "Use night buses Hanoi-Ha Giang and a limousine van Hanoi-Ninh Binh to keep transport cheap and save daylight for riding."],
    sources: [{ org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel" }],
  },
  {
    id: "it-vi-north-family-sampler", country: "vi", title: "Northern Vietnam Family Sampler", days: 9, pace: "relaxed",
    party: ["family"], budget: ["mid"],
    summary: "A gentle family-paced sweep of the north: Hanoi's puppets and street life, easy valley cycling and a stilt-house stay in Mai Chau, boat rides beneath Ninh Binh's karsts, and an overnight cruise on Ha Long Bay.",
    stops: [
      { title: "Hanoi", nights: 3, why: "Water puppet theatre, Hoan Kiem lake strolls, the Museum of Ethnology and kid-approved street food ease everyone into Vietnam." },
      { title: "Mai Chau", nights: 2, why: "A flat, quiet valley of rice paddies perfect for family cycling, with friendly White Thai stilt-house lodges and weaving villages." },
      { title: "Ninh Binh (Trang An)", nights: 2, why: "Sampan boat rides through caves at Trang An or Tam Coc delight all ages, plus bicycles among the karsts and the Bai Dinh pagoda complex." },
      { title: "Ha Long Bay", nights: 1, why: "An overnight cruise among the limestone islands — cabins, kayaking and cave visits make it the trip's grand finale." },
    ],
    tips: ["Book a family-friendly Ha Long cruise with connecting cabins and included Hanoi transfers; one night on the water is enough with children.", "Use private cars or limousine vans between stops — distances are short (3-4 hours) and door-to-door transfers are far easier with kids than public buses.", "In Ninh Binh choose Trang An over Tam Coc for boat trips with young children; boats are steadier and the circuit is well managed."],
    sources: [{ org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel" }],
  },
];

// Match plans to a traveller profile. Everything is optional — with no profile the
// list simply ranks by a neutral fit.
const LEN_BAND = { short: [1, 8], medium: [8, 21], long: [21, 120] };
export function suggestPlans({ country, tripLength = '', party = '', budget = '' } = {}) {
  let list = ITINERARIES.filter((it) => !country || it.country === country);
  const scored = list.map((it) => {
    let s = 0;
    if (tripLength && LEN_BAND[tripLength]) {
      const [lo, hi] = LEN_BAND[tripLength];
      if (it.days >= lo && it.days <= hi) s += 3; else s -= Math.min(2, Math.abs(it.days - (lo + hi) / 2) / 7);
    }
    if (party && it.party.includes(party)) s += 2;
    if (budget && budget !== 'flexible' && it.budget.includes(budget)) s += 1;
    return { it, s };
  });
  scored.sort((a, b) => b.s - a.s || a.it.days - b.it.days);
  return scored.map((x) => x.it);
}
export function getItinerary(id) { return ITINERARIES.find((x) => x.id === id) || null; }
