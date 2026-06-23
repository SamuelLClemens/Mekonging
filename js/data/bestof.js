// Curated "best of" recommendation lists per country — best for families, family
// neighbourhoods, best experiences, budget eats and more.
//
// IMPORTANT: nothing here is scraped or copied. These are SYNTHESISED shortlists of
// well-known, stable destinations, written from general public knowledge, with each
// item deep-linking to live maps so the traveller can read current reviews and hours
// themselves. Ratings are indicative syntheses, not figures taken from any one site.
// The named source organisations indicate the kind of public coverage a place has,
// not a quotation from them. Always verify hours, prices and access locally.
//
// Shape per country code (th | vi | kh | la):
//   [{ id, title, category, forWho, blurb,
//      items:[{ name, city, why, mapQuery, rating, sources:[{org}] }] }]

const LP = { org: 'Lonely Planet' };
const TA = { org: 'TripAdvisor' };
const UN = { org: 'UNESCO' };
const MI = { org: 'Michelin Guide' };
const TAT = { org: 'Tourism Authority of Thailand' };
const VNAT = { org: 'Vietnam National Administration of Tourism' };
const TCAM = { org: 'Tourism Cambodia' };
const TLAO = { org: 'Tourism Laos' };

export const BESTOF = {
  th: [
    {
      id: 'th-experiences', title: 'Best experiences in Thailand', category: 'experiences', forWho: 'firsttimers',
      blurb: 'The landmarks first-time visitors should not miss, from royal Bangkok to the ancient capital and the southern coast.',
      items: [
        { name: 'The Grand Palace & Wat Phra Kaew', city: 'Bangkok', rating: 4.6, sources: [LP, TA],
          why: 'Thailand’s most revered royal and temple complex. Dress modestly (shoulders and knees covered) and go early to beat the heat and crowds.', mapQuery: 'Grand Palace Bangkok' },
        { name: 'Wat Pho (Reclining Buddha)', city: 'Bangkok', rating: 4.6, sources: [LP, TA],
          why: 'A 46-metre gilded reclining Buddha and the home of traditional Thai massage. Quieter and cheaper than the Grand Palace next door.', mapQuery: 'Wat Pho Bangkok' },
        { name: 'Ayutthaya Historical Park', city: 'Ayutthaya', rating: 4.6, sources: [UN, LP],
          why: 'The UNESCO-listed ruins of Siam’s former capital, an easy day trip from Bangkok by train. Hire a bicycle to ride between the temples.', mapQuery: 'Ayutthaya Historical Park' },
        { name: 'Wat Phra Singh & the Old City', city: 'Chiang Mai', rating: 4.5, sources: [LP, TA],
          why: 'The walkable moated old town is dense with Lanna-era temples; Wat Phra Singh is the most graceful. Pair with the Sunday Walking Street market.', mapQuery: 'Wat Phra Singh Chiang Mai' },
        { name: 'Railay Beach', city: 'Krabi', rating: 4.6, sources: [LP, TA],
          why: 'Limestone karsts, calm swimming bays and world-class rock climbing, reachable only by longtail boat. A taste of the south at its best.', mapQuery: 'Railay Beach Krabi' },
      ],
    },
    {
      id: 'th-families', title: 'Best for families', category: 'families', forWho: 'families',
      blurb: 'Attractions that reliably work with children, balancing animals, water and space to run.',
      items: [
        { name: 'Safari World', city: 'Bangkok', rating: 4.3, sources: [TA, TAT],
          why: 'Drive-through open zoo plus a marine park with shows. A full day; bring sun protection and go on a weekday.', mapQuery: 'Safari World Bangkok' },
        { name: 'SEA LIFE Bangkok Ocean World', city: 'Bangkok', rating: 4.3, sources: [TA],
          why: 'Large aquarium beneath Siam Paragon — a cool, easy refuge from the midday heat for younger children.', mapQuery: 'Sea Life Bangkok Ocean World' },
        { name: 'Elephant Nature Park', city: 'Chiang Mai', rating: 4.8, sources: [LP, TA],
          why: 'An ethical sanctuary that observes and feeds rescued elephants rather than riding them. Book well ahead; choose no-riding operators only.', mapQuery: 'Elephant Nature Park Chiang Mai' },
        { name: 'Chiang Mai Night Safari', city: 'Chiang Mai', rating: 4.1, sources: [TA, TAT],
          why: 'Evening tram safari past nocturnal animals — a novelty that keeps older children engaged after dark.', mapQuery: 'Chiang Mai Night Safari' },
      ],
    },
    {
      id: 'th-family-areas', title: 'Best neighbourhoods for families', category: 'neighbourhoods', forWho: 'families',
      blurb: 'Where to base a family: walkable, well-connected and close to parks, malls and clinics.',
      items: [
        { name: 'Phrom Phong / Thong Lor (Sukhumvit)', city: 'Bangkok', rating: 4.4, sources: [LP],
          why: 'On the BTS Skytrain with malls, playgrounds, Benjasiri Park and family clinics; the easiest Bangkok base with young children.', mapQuery: 'Phrom Phong Bangkok' },
        { name: 'Nimmanhaemin', city: 'Chiang Mai', rating: 4.4, sources: [LP, TA],
          why: 'Leafy, walkable café district near the university — calm, with apartments, co-working and easy day trips into the hills.', mapQuery: 'Nimmanhaemin Road Chiang Mai' },
        { name: 'Karon Beach', city: 'Phuket', rating: 4.3, sources: [TA, TAT],
          why: 'A long, gently shelving beach that is calmer and more relaxed than nearby Patong, with family resorts set back from the sand.', mapQuery: 'Karon Beach Phuket' },
      ],
    },
  ],

  vi: [
    {
      id: 'vi-experiences', title: 'Best experiences in Vietnam', category: 'experiences', forWho: 'firsttimers',
      blurb: 'The classic north-to-south highlights, from limestone seascapes to lantern-lit old towns.',
      items: [
        { name: 'Ha Long Bay cruise', city: 'Quang Ninh', rating: 4.6, sources: [UN, LP],
          why: 'Thousands of limestone islets rising from emerald water; an overnight cruise (or quieter Lan Ha Bay) is the way to see it.', mapQuery: 'Ha Long Bay Vietnam' },
        { name: 'Hoi An Ancient Town', city: 'Hoi An', rating: 4.7, sources: [UN, TA],
          why: 'A perfectly preserved trading port lit by silk lanterns each evening; tailors, riverside cafés and bicycles. Walkable and traffic-light.', mapQuery: 'Hoi An Ancient Town' },
        { name: 'Imperial City (Hue Citadel)', city: 'Hue', rating: 4.4, sources: [UN, LP],
          why: 'The walled Nguyen-dynasty capital with palaces, gates and tombs along the Perfume River. Rent a bicycle or take a dragon-boat.', mapQuery: 'Imperial City Hue' },
        { name: 'Hoan Kiem Lake & the Old Quarter', city: 'Hanoi', rating: 4.5, sources: [LP, TA],
          why: 'The heart of Hanoi — a lake ringed by a weekend walking street, with the Old Quarter’s 36 trade streets and street food just behind.', mapQuery: 'Hoan Kiem Lake Hanoi' },
        { name: 'Mekong Delta day trip', city: 'Can Tho', rating: 4.3, sources: [LP, TA],
          why: 'Floating markets, fruit orchards and narrow canals by sampan. Cai Rang market near Can Tho is best reached at dawn.', mapQuery: 'Cai Rang Floating Market Can Tho' },
      ],
    },
    {
      id: 'vi-families', title: 'Best for families', category: 'families', forWho: 'families',
      blurb: 'Big-hitter parks and gentle old towns that keep all ages happy.',
      items: [
        { name: 'Ba Na Hills & the Golden Bridge', city: 'Da Nang', rating: 4.3, sources: [TA],
          why: 'A cable-car mountain resort with the famous “giant hands” bridge, gardens and a fun fair — a full, cooler-climate day out.', mapQuery: 'Ba Na Hills Da Nang' },
        { name: 'VinWonders Nha Trang', city: 'Nha Trang', rating: 4.4, sources: [TA],
          why: 'Island theme park reached by cable car over the bay, with water rides and an aquarium. Reliable rainy-day backup.', mapQuery: 'VinWonders Nha Trang' },
        { name: 'My Khe Beach', city: 'Da Nang', rating: 4.5, sources: [LP, TA],
          why: 'A long, clean city beach with gentle surf and easy facilities — an ideal base between Hoi An and the Hai Van Pass.', mapQuery: 'My Khe Beach Da Nang' },
      ],
    },
    {
      id: 'vi-budget-eats', title: 'Best budget eats', category: 'food', forWho: 'budget',
      blurb: 'Legendary cheap meals worth crossing a city for. Tap through for the latest hours and queues.',
      items: [
        { name: 'Bánh Mì Phượng', city: 'Hoi An', rating: 4.6, sources: [TA, MI],
          why: 'Among the most famous banh mi in Vietnam — crisp baguette, pâté and herbs. Expect a queue; it moves fast.', mapQuery: 'Banh Mi Phuong Hoi An' },
        { name: 'Bún Chả Hương Liên', city: 'Hanoi', rating: 4.2, sources: [TA],
          why: 'Grilled pork and noodles in the city that invented the dish, made famous by a presidential visit. Order the combo set.', mapQuery: 'Bun Cha Huong Lien Hanoi' },
        { name: 'Phở Gia Truyền (Bát Đàn)', city: 'Hanoi', rating: 4.4, sources: [TA, LP],
          why: 'A no-frills institution for beef phở; you queue, pay, carry your own bowl. Mornings only, and worth the early start.', mapQuery: 'Pho Gia Truyen Bat Dan Hanoi' },
      ],
    },
  ],

  kh: [
    {
      id: 'kh-experiences', title: 'Best experiences in Cambodia', category: 'experiences', forWho: 'firsttimers',
      blurb: 'The Angkor temples and the living lake that define a first visit.',
      items: [
        { name: 'Angkor Wat', city: 'Siem Reap', rating: 4.8, sources: [UN, LP],
          why: 'The largest religious monument on earth and Cambodia’s soul. Sunrise over the reflecting pools is the classic, if busy, view.', mapQuery: 'Angkor Wat' },
        { name: 'Bayon & Angkor Thom', city: 'Siem Reap', rating: 4.7, sources: [UN, TA],
          why: 'The serene stone faces of Bayon at the centre of the walled royal city — a highlight of any Angkor circuit.', mapQuery: 'Bayon Temple Angkor Thom' },
        { name: 'Ta Prohm', city: 'Siem Reap', rating: 4.6, sources: [UN, TA],
          why: 'The “jungle temple” where strangler figs grip the ruins. Atmospheric early in the day before tour groups arrive.', mapQuery: 'Ta Prohm Temple' },
        { name: 'Royal Palace & Silver Pagoda', city: 'Phnom Penh', rating: 4.4, sources: [LP, TA],
          why: 'The gilded riverside seat of the monarchy, with a pagoda floored in silver tiles. Dress modestly to enter.', mapQuery: 'Royal Palace Phnom Penh' },
        { name: 'Tonlé Sap floating villages', city: 'Siem Reap', rating: 4.0, sources: [LP],
          why: 'Stilt and floating communities on Southeast Asia’s great lake. Choose a community-based tour (e.g. Kampong Phluk) over the tourist-trap routes.', mapQuery: 'Kampong Phluk Tonle Sap' },
      ],
    },
    {
      id: 'kh-families', title: 'Best for families', category: 'families', forWho: 'families',
      blurb: 'Lighter, hands-on options to balance the temples and the heat.',
      items: [
        { name: 'Phare, the Cambodian Circus', city: 'Siem Reap', rating: 4.8, sources: [TA, LP],
          why: 'A modern circus of acrobatics and storytelling by young Cambodian artists — the best evening out for families in Siem Reap.', mapQuery: 'Phare The Cambodian Circus Siem Reap' },
        { name: 'Angkor National Museum', city: 'Siem Reap', rating: 4.2, sources: [TA],
          why: 'Air-conditioned context for the temples, with a hall of a thousand Buddhas. Good to visit before, not after, a long temple day.', mapQuery: 'Angkor National Museum Siem Reap' },
        { name: 'Kep crab market & beaches', city: 'Kep', rating: 4.3, sources: [LP, TA],
          why: 'Sleepy seaside town where you eat just-caught crab with Kampot pepper. Gentle pace, easy with children.', mapQuery: 'Kep Crab Market' },
      ],
    },
    {
      id: 'kh-history', title: 'Understanding recent history', category: 'history', forWho: 'everyone',
      blurb: 'Sobering but important memorials to the Khmer Rouge era. They are sombre places; consider carefully before bringing young children.',
      items: [
        { name: 'Tuol Sleng Genocide Museum (S-21)', city: 'Phnom Penh', rating: 4.7, sources: [LP, TA],
          why: 'A former school turned prison, now a memorial. The audio guide is excellent and respectful. Allow time and emotional space.', mapQuery: 'Tuol Sleng Genocide Museum Phnom Penh' },
        { name: 'Choeung Ek Memorial (Killing Fields)', city: 'Phnom Penh', rating: 4.7, sources: [LP, TA],
          why: 'The memorial stupa and grounds outside the city. Visit with the audio guide; dress and behave respectfully.', mapQuery: 'Choeung Ek Genocidal Center' },
      ],
    },
  ],

  la: [
    {
      id: 'la-experiences', title: 'Best experiences in Laos', category: 'experiences', forWho: 'firsttimers',
      blurb: 'Slow, scenic Laos — a UNESCO town, waterfalls and the great river islands.',
      items: [
        { name: 'Luang Prabang Old Town', city: 'Luang Prabang', rating: 4.8, sources: [UN, LP],
          why: 'A UNESCO peninsula of gilded temples, French-Lao villas and night markets. If you watch the dawn alms-giving, do so quietly and from a distance.', mapQuery: 'Luang Prabang Old Town' },
        { name: 'Kuang Si Falls', city: 'Luang Prabang', rating: 4.7, sources: [LP, TA],
          why: 'Tiered turquoise pools you can swim in, plus a bear rescue centre on site. Go early or late to enjoy it quietly.', mapQuery: 'Kuang Si Falls Luang Prabang' },
        { name: 'Pak Ou Caves', city: 'Luang Prabang', rating: 4.1, sources: [LP, TA],
          why: 'Riverside caves crammed with thousands of Buddha images, reached by a scenic Mekong boat trip from town.', mapQuery: 'Pak Ou Caves' },
        { name: 'Vat Phou', city: 'Champasak', rating: 4.4, sources: [UN, LP],
          why: 'A pre-Angkorian Khmer temple complex on a hillside in the south, far quieter than Angkor and UNESCO-listed.', mapQuery: 'Vat Phou Champasak' },
        { name: 'Si Phan Don (4000 Islands)', city: 'Champasak', rating: 4.4, sources: [LP, TA],
          why: 'Hammock-and-bicycle river islands near the Cambodian border, with waterfalls and rare Irrawaddy dolphins.', mapQuery: 'Si Phan Don 4000 Islands Laos' },
      ],
    },
    {
      id: 'la-families', title: 'Best for families & nature', category: 'families', forWho: 'families',
      blurb: 'Gentle, hands-on stops that suit children and slow travellers alike.',
      items: [
        { name: 'Tat Kuang Si Bear Rescue Centre', city: 'Luang Prabang', rating: 4.6, sources: [TA],
          why: 'At the foot of Kuang Si Falls — rescued moon bears in forest enclosures, an easy and meaningful add-on to a swim.', mapQuery: 'Tat Kuang Si Bear Rescue Centre' },
        { name: 'Laos Buffalo Dairy', city: 'Luang Prabang', rating: 4.7, sources: [TA, LP],
          why: 'A social-enterprise farm where children can feed buffalo and taste fresh ice cream and cheese. Reliably fun for all ages.', mapQuery: 'Laos Buffalo Dairy Luang Prabang' },
        { name: 'Blue Lagoon & caves', city: 'Vang Vieng', rating: 4.1, sources: [LP, TA],
          why: 'Swim, zip-line and tube around karst lagoons; Vang Vieng has reinvented itself around gentler outdoor days and hot-air balloons.', mapQuery: 'Blue Lagoon Vang Vieng' },
      ],
    },
  ],
};

export function bestForCountry(code) { return BESTOF[code] || []; }
export function getBestList(id) {
  for (const c of Object.keys(BESTOF)) {
    const l = (BESTOF[c] || []).find((x) => x.id === id);
    if (l) return { ...l, country: c };
  }
  return null;
}
