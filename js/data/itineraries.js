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
  {
    id: "it-th-andaman-islands", country: "th", title: "Andaman Islands Week", days: 9, pace: "relaxed",
    party: ["solo", "couple", "family"], budget: ["mid"],
    summary: "A classic Bangkok-to-Andaman route pairing two capital days with a week of limestone karst, longtail boats and slow island beaches. Works equally well as a couples escape or an easy family trip with short transfers.",
    stops: [
      { title: "Bangkok", nights: 2, why: "Land, recover and see the essentials: the Grand Palace, Wat Pho and a Chao Phraya river boat ride, plus street food in Chinatown before flying south." },
      { title: "Krabi / Ao Nang", nights: 3, why: "The mainland Andaman base. Longtail day trips to Railay's beaches and cliffs, the Four Islands tour (Poda, Chicken Island, Tup), Emerald Pool and Krabi Town's night market." },
      { title: "Koh Lanta", nights: 4, why: "Two hours by ferry or van-and-ferry from Krabi. Long quiet beaches (Klong Dao is calm and shallow, ideal for kids), Lanta Old Town stilt houses, and snorkeling trips to Koh Rok. The relaxed finale of the trip." },
    ],
    tips: ["Fly Bangkok to Krabi (about 1 hour 20 minutes) rather than taking the overnight bus; domestic fares are cheap and it saves a full day.", "Railay is reachable only by longtail boat from Ao Nang or Krabi Town; swap the Koh Lanta stay for 2-3 nights on Railay if you prefer climbing and dramatic scenery over long beaches.", "High season on the Andaman coast is November to April. In the green season (May to October) the direct Krabi-Koh Lanta passenger boats generally stop running entirely (travel is then by minivan plus the short vehicle ferry, which runs year-round), Koh Rok snorkeling trips are suspended and some island resorts close, so re-check connections before booking."],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    id: "it-vi-central-heritage", country: "vi", title: "Central Vietnam Heritage", days: 7, pace: "steady",
    party: ["solo", "couple", "family"], budget: ["low", "mid"],
    summary: "The compact heritage corridor of central Vietnam: beach city Da Nang, the lantern-lit UNESCO old town of Hoi An with a My Son side trip, and the imperial citadel and tombs of Hue, linked by the scenic Hai Van Pass.",
    stops: [
      { title: "Da Nang", nights: 2, why: "Fly in, unwind on My Khe beach, climb the Marble Mountains cave pagodas and watch the Dragon Bridge breathe fire on weekend nights. The region's transport hub." },
      { title: "Hoi An", nights: 3, why: "UNESCO-listed Ancient Town of merchant houses, the Japanese Covered Bridge and nightly lanterns. Use one morning for the My Son Sanctuary Cham temple ruins (about an hour away), plus tailor shops, cooking classes and An Bang beach." },
      { title: "Hue", nights: 2, why: "Vietnam's former imperial capital: the Citadel and Imperial City, the royal tombs of Tu Duc and Khai Dinh, Thien Mu Pagoda and a Perfume River boat trip, with a distinct royal cuisine." },
    ],
    tips: ["To actually cross the Hai Van Pass, book the Hoi An/Da Nang to Hue transfer as a private sightseeing car, jeep or motorbike-guide ride; most regular open-tour buses take the Hai Van road tunnel and skip the views. The Hue-Da Nang train is a scenic alternative, hugging the coastline below the pass.", "Visit My Son at opening time (early morning) to beat both the heat and the tour groups arriving from Da Nang.", "Central Vietnam's driest window is roughly February to August; October and November bring typhoon-season rain and occasional flooding in Hoi An's old town."],
    sources: [{ org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel" }],
  },
  {
    id: "it-kh-coast-capital", country: "kh", title: "Cambodia Coast and Capital", days: 9, pace: "steady",
    party: ["solo", "couple"], budget: ["low", "mid"],
    summary: "The standard southern Cambodia circuit: Phnom Penh's history and riverside energy, the laid-back Kampot river scene with pepper farms and Bokor, sleepy seafood town Kep, and a barefoot island finish on Koh Rong Sanloem.",
    stops: [
      { title: "Phnom Penh", nights: 3, why: "The Royal Palace and Silver Pagoda, the National Museum's Khmer sculpture, and the essential but heavy history of Tuol Sleng and Choeung Ek, balanced by riverside cafes and a lively food scene." },
      { title: "Kampot", nights: 3, why: "A slow riverside town of French-era shophouses. Day trips to Bokor National Park's misty hill station, La Plantation and other Kampot pepper farms, and the cave temple of Phnom Chhngok, plus sunset river cruises." },
      { title: "Kep", nights: 1, why: "Thirty minutes from Kampot: blue crab with Kampot pepper at the Crab Market, the jungle loop trail in Kep National Park, and an optional boat hop to Koh Tonsay (Rabbit Island)." },
      { title: "Koh Rong Sanloem", nights: 2, why: "Backtrack west past Kampot to Sihanoukville (about 2.5-3 hours by road from Kep), then speed ferry to Saracen Bay's white sand. Snorkeling, jungle walks across to Lazy Beach for sunset, and bioluminescent plankton after dark. The quieter sibling of Koh Rong." },
    ],
    tips: ["Withdraw cash before the island: Koh Rong Sanloem has few or no reliable ATMs and many bungalows add card surcharges.", "Book the Sihanoukville to Koh Rong Sanloem speed ferry and your onward bus in advance in high season (November to April), which is also the best window for calm seas; in the wet season crossings still run but can be rough or delayed.", "Kep works as either an overnight or a day trip from Kampot; if you prefer fewer hotel changes, base 4 nights in Kampot and visit Kep by tuk-tuk or scooter."],
    sources: [{ org: "Ministry of Tourism, Cambodia", url: "https://www.tourismcambodia.org" }],
  },
  {
    id: "it-la-thakhek-south", country: "la", title: "Thakhek Loop and the Deep South", days: 11, pace: "steady",
    party: ["solo", "couple"], budget: ["low"],
    summary: "Laos's best-known backpacker combination: the 3-4 day Thakhek motorbike loop through karst country to the 7-kilometre Kong Lor river cave, then south to Pakse for the Bolaven Plateau's waterfalls and coffee farms, ending in the hammocks of the 4000 Islands.",
    stops: [
      { title: "Thakhek and the Loop", nights: 4, why: "Rent a semi-automatic bike and ride the classic loop: limestone karst, swimming caves near Thakhek, the flooded forest at Thalang, an overnight in Ban Nahin, and the unmissable boat trip through Kong Lor cave before closing the circuit." },
      { title: "Pakse", nights: 2, why: "The southern hub on the Mekong, about 5-6 hours south of Thakhek by bus (there is no railway in southern Laos). Use it to regroup and make the half-day trip to Wat Phou, the UNESCO-listed pre-Angkorian Khmer temple complex at Champasak." },
      { title: "Bolaven Plateau", nights: 2, why: "Cool highlands of coffee plantations and big waterfalls: Tad Fane's twin drop, swimmable Tad Yuang and Tad Lo village. Ride the small Bolaven loop by motorbike from Pakse or join a shared tour." },
      { title: "Si Phan Don (4000 Islands)", nights: 3, why: "Boat across to Don Det or Don Khon: cycle between the two islands over the old French railway bridge, see Khone Phapheng and Li Phi falls, look for Irrawaddy dolphins at dusk, and end the trip in a riverside hammock." },
    ],
    tips: ["Carry enough kip in cash for the whole Thakhek loop; ATMs are scarce outside Thakhek town and guesthouses on the route rarely take cards.", "Inspect your rental bike carefully (brakes, tyres, lights), photograph existing damage and wear a helmet; the loop's road surface is mostly sealed now but has rough patches near Thalang.", "November to February is the ideal dry and cool window; from Si Phan Don you can continue overland to Cambodia, so check current border and visa arrangements before relying on that exit."],
    sources: [{ org: "Ministry of Information, Culture and Tourism, Laos (Tourism Laos)", url: "https://www.tourismlaos.org" }],
  },
  {
    id: "it-th-gulf-islands-hop",
    country: "th",
    title: "Gulf Islands Hop",
    days: 11,
    pace: "steady",
    party: ["solo", "couple", "family"],
    budget: ["low", "mid"],
    summary: "The classic Gulf of Thailand run: a night in Bangkok, then the overnight train or bus to Chumphon and the morning ferry out to Koh Tao for diving and snorkelling, island-hopping south through Koh Phangan's quiet north coast to Koh Samui, where you fly or ferry onward.",
    stops: [
      {
        title: "Bangkok",
        nights: 1,
        why: "Land, settle in, and see a temple or the riverside before boarding the overnight train or bus south. Combined rail-and-catamaran tickets via Chumphon put you on Koh Tao by mid-morning.",
      },
      {
        title: "Koh Tao",
        nights: 3,
        why: "One of the cheapest places anywhere to learn to dive, with dozens of schools and easy fun dives. Non-divers snorkel Shark Bay and Aow Leuk, day-trip to Koh Nang Yuan, or hike to the viewpoints.",
      },
      {
        title: "Koh Phangan",
        nights: 3,
        why: "A short ferry hop for the mellow north coast: Chaloklum village, Haad Salad, and boat-or-hike-only Bottle Beach. Shallow, calm bays suit families, and waterfall walks fill the afternoons, far from the party strip.",
      },
      {
        title: "Koh Samui",
        nights: 2,
        why: "Finish with easy comforts on Maenam or Lamai beach, the Big Buddha, and night markets. Samui's airport connects to Bangkok and beyond, or take the ferry-bus combination back to Surat Thani.",
      },
    ],
    tips: [
      "Book the Bangkok to Chumphon sleeper train and the connecting catamaran as one combined ticket; second-class berths sell out days ahead in high season.",
      "Run the islands in this order (Tao, Phangan, Samui) so each boat hop is short and you end at an airport; ferries can be cancelled in rough seas, so keep a buffer day before any onward flight.",
      "Full Moon weeks push room prices up across Koh Phangan, not just at Haad Rin; check the dates and base yourself on the north coast if you want quiet and better value.",
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    id: "it-la-siphandon-slow-week",
    country: "la",
    title: "Si Phan Don Slow Week",
    days: 7,
    pace: "relaxed",
    party: ["solo", "couple", "family"],
    budget: ["low"],
    summary: "Southern Laos at river speed: Pakse as the gateway, the UNESCO Khmer temple of Wat Phou at sleepy Champasak, then three unhurried days cycling Don Det and Don Khon among the Four Thousand Islands, with Khone Phapheng falls at the end of the line.",
    stops: [
      {
        title: "Pakse",
        nights: 1,
        why: "Southern Laos's transport hub, reached by plane or bus. Withdraw kip, pick up supplies, and eat along the Mekong before heading downriver; everything south of here is cash-first and slower.",
      },
      {
        title: "Champasak",
        nights: 2,
        why: "A quiet riverside town beneath UNESCO-listed Wat Phou. Climb the temple terraces early for shade and Mekong views, then spend the rest of the day cycling the flat lanes between rice paddies and old shophouses.",
      },
      {
        title: "Don Det and Don Khon",
        nights: 3,
        why: "Near car-free islands linked by the old French railway bridge. Cycle to Tat Somphamit (Li Phi) falls, take a trip to thundering Khone Phapheng, the largest waterfall in Southeast Asia by volume, and walk to the quiet river viewpoint at Don Khon's southern tip near Hang Khon.",
      },
    ],
    tips: [
      "Carry enough cash for the whole island stay; ATMs on Don Det are unreliable and card payments are rare, so withdraw in Pakse.",
      "Songthaew-and-boat combinations link Pakse, Champasak and Nakasang pier daily; travel in the morning, as afternoon boats to the islands thin out quickly.",
    ],
    sources: [
      {
        org: "Lao Ministry of Information, Culture and Tourism (Tourism Laos)",
        url: "https://www.tourismlaos.org",
      },
    ],
  }
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
