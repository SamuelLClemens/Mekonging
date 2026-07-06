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
