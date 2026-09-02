// Traveller-facing history & orientation for every notable country and city.
// countries[cc] = { blurb, knownFor[], cultureTip?, sources[] }
// cities["<cc>-<citySlug>"] = { name, blurb, knownFor[], bestTime?, bestM?, avoidM? }
// Curated and fact-checked (concise, hedged where dates are uncertain).
//
// ---- bestM / avoidM: the CITY tier of "when to go" ----------------------------------------
// `bestTime` has always been prose — the right form for a human reading one city's card, and
// it already covers all 62 cities here. What it could not do is let the app SORT or FILTER by
// month, which matters because 653 of the app's 808 place records (81%) sit in one of these
// cities: structuring bestTime the same way js/data/zones.js structures `bestMonths` turns 19
// region-level answers into 62 city-level ones, without writing a single new fact — see
// js/data/month-verdict.js for the shared verdict function and scripts/check-month-arrays.py
// for the build-time guard, which checks THIS file under the identical rule zones.js uses:
//
//   - `bestM` holds only months `bestTime` RECOMMENDS outright. A caveat that sits INSIDE the
//     recommended window ("November to February; nights can be cold in the valley") does not
//     disqualify those months — the whole clause IS the recommendation. A genuine alternative
//     window joined by "or"/"and" counts too (Ninh Binh's golden-rice May–July alongside its
//     cool Oct–Dec) — these are not hedges, both halves are actively recommended.
//   - `avoidM` holds only months named as a WARNING, e.g. Hoi An's "avoid the October-November
//     flood season". A vaguer aside — "rainy season", "summer storms" — is real information in
//     the prose but is deliberately left OUT of avoidM when it names no specific month, the
//     same restraint the region tier already applies to hedged months.
//   - Every month in either array must be named by this city's OWN `bestTime` sentence; the
//     reverse is not required (a festival date or a side fact can name a month that supports
//     neither array). A month in both arrays reads as "mixed", exactly as at region level — it
//     does not happen to occur anywhere in this file today (checked, not assumed), because
//     every `bestTime` sentence here was written as one coherent window rather than the kind
//     of two-coast split some region-level prose describes.
export const HISTORY = {
  "countries": {
    "th": {
      "blurb": "Thailand's early history was shaped by Mon, Khmer, and Tai peoples, with the kingdoms of Sukhothai (from around the 13th century) and Ayutthaya (roughly the 14th to 18th centuries) forming the core of a distinct Thai civilization rooted in Theravada Buddhism. After Ayutthaya fell to Burmese forces in 1767, the capital moved south and the Chakri dynasty founded Bangkok in 1782, which remains the royal seat today. Unlike its neighbors, Thailand (known as Siam until 1939) was never formally colonized by a European power, a fact central to national identity. A 1932 revolution replaced absolute monarchy with a constitutional system, though the military and monarchy have remained powerful. Today Thailand blends deep Buddhist tradition, a revered monarchy, and a fast-modernizing economy driven by tourism, agriculture, and manufacturing.",
      "knownFor": [
        "Theravada Buddhism",
        "Never colonized",
        "Thai monarchy",
        "Street food",
        "Temples (wat)",
        "Beaches and islands",
        "Muay Thai"
      ],
      "cultureTip": "Show respect for images of the Buddha and the monarchy; remove your shoes before entering temples and homes, dress modestly at religious sites, and avoid touching people's heads or pointing your feet at others or at Buddha images.",
      "sources": [
        "General reference: Britannica \"Thailand\", \"Ayutthaya\", \"Mangrai\"",
        "UNESCO World Heritage listings (Sukhothai, Ayutthaya, Ban Chiang)",
        "Lonely Planet Thailand guides"
      ],
      "crowds": { "text": "High season runs November to February nationwide — Tourism Authority of Thailand figures for 2025 show January as the single busiest month, with arrivals declining through the year to a May-September low. Christmas, New Year and the Chinese New Year weeks that follow are the busiest of all — book well ahead.", "sources": [{ "org": "Khaosod English, citing Tourism Authority of Thailand", "url": "https://www.khaosodenglish.com/tourism/2025/12/14/thailand-tourist-arrivals-fall-to-32m-amid-challenging-2025/" }, { "org": "Wikivoyage — Thailand", "url": "https://en.wikivoyage.org/wiki/Thailand" }] },
      "prices": { "text": "Hotel and flight prices follow the same curve: highest across December-February and hardest to book around Christmas, New Year and Chinese New Year, easing once the rains arrive from May.", "sources": [{ "org": "Wikivoyage — Thailand", "url": "https://en.wikivoyage.org/wiki/Thailand" }] }
    },
    "vi": {
      "blurb": "Vietnam's civilization grew along the Red River delta and later expanded south down the coast, absorbing about a millennium of Chinese rule (roughly the 2nd century BCE to the 10th century CE) that shaped its writing, cuisine, and Confucian traditions, followed by centuries of independent dynasties such as the Ly, Tran, Le, and Nguyen. French colonization from the mid-19th century added Catholic churches, coffee culture, and boulevard architecture, before the long wars of the 20th century led to reunification under a communist government in the mid-1970s. The 1986 Doi Moi reforms opened the economy, and today Vietnam is a fast-developing, densely populated country that blends deep-rooted tradition with rapid urban change. Regional identities remain strong, and the influence of the former Champa kingdom and Khmer settlement is still visible in the center and south. Visitors encounter a nation defined by resilience, family life, street food, and a striking mix of Asian and European heritage.",
      "knownFor": [
        "street food and pho",
        "coffee culture",
        "war history",
        "motorbike traffic",
        "coastline and beaches",
        "French-colonial architecture",
        "rice-terrace landscapes"
      ],
      "cultureTip": "Dress modestly at temples and pagodas, covering shoulders and knees, and remove your shoes where signs or locals indicate.",
      "sources": [
        "General reference knowledge (encyclopedic history of Vietnam)",
        "Standard travel-guide orientation (Lonely Planet-style regional overviews)"
      ],
      "crowds": { "text": "Tet (Lunar New Year, usually late January or February) is Vietnam's single biggest travel event: tens of millions of Vietnamese travel to be with family, transport is jammed in the days beforehand, and most shops, restaurants and small businesses close for several days over the holiday itself. The south's own dry season, December to February, is otherwise the steadiest high season.", "sources": [{ "org": "Wikivoyage — Vietnam", "url": "https://en.wikivoyage.org/wiki/Vietnam" }] },
      "prices": { "text": "Flights and hotels around Tet can run two to three times normal rates, and accommodation at the beach or in Da Lat is hard to find around the country's other big holidays (30 April, 1 May, 2 September) too — book those windows well ahead.", "sources": [{ "org": "Wikivoyage — Vietnam", "url": "https://en.wikivoyage.org/wiki/Vietnam" }, { "org": "Vietcetera", "url": "https://vietcetera.com/en/flight-prices-surge-for-vietnams-lunar-new-year-2026-how-to-plan-ahead" }] }
    },
    "kh": {
      "blurb": "Cambodia's identity is rooted in the Khmer Empire, which from roughly the 9th to the 15th century ruled much of mainland Southeast Asia from its capital at Angkor and left behind the temple complexes that define the country's heritage. The culture absorbed Indian influences early, shifting from Hinduism to the Theravada Buddhism that predominates today. After centuries of decline and regional rivalry, Cambodia became a French protectorate in 1863 and gained full independence in 1953. The country endured devastating upheaval under the Khmer Rouge regime (1975-1979), whose genocide is estimated to have killed on the order of 1.7 to 2 million people, followed by years of conflict before stabilising in the 1990s. Today Cambodia is a constitutional monarchy that blends deep pride in its Angkorian past, a resilient Buddhist culture, and a young, fast-changing society.",
      "knownFor": [
        "Angkor temples",
        "Khmer Empire heritage",
        "Theravada Buddhism",
        "Mekong River",
        "Khmer Rouge history",
        "rice and fishing culture",
        "warm hospitality"
      ],
      "cultureTip": "Dress modestly at temples (cover shoulders and knees), remove your shoes and hat before entering, and greet people with the traditional 'sampeah' (palms pressed together with a slight bow) rather than a handshake, especially with elders and monks.",
      "sources": [
        "General reference knowledge (encyclopedic history of Cambodia and the Khmer Empire)",
        "Widely established travel and cultural guidance for Cambodia"
      ],
      "crowds": { "text": "November to March is high season nationwide — cooler, drier, and when Angkor draws by far its largest crowds; Chinese New Year (Jan/Feb) brings a further, sharp local surge in visitors. The wet season, roughly June to October, is quiet almost everywhere.", "sources": [{ "org": "Wikivoyage — Cambodia", "url": "https://en.wikivoyage.org/wiki/Cambodia" }] },
      "prices": { "text": "Lodging books up and even bus fares rise during the Chinese New Year window in particular, as visitors from across the region travel at the same time as Cambodians themselves.", "sources": [{ "org": "Wikivoyage — Cambodia", "url": "https://en.wikivoyage.org/wiki/Cambodia" }] }
    },
    "la": {
      "blurb": "Laos, a landlocked country on the Mekong River, traces its national identity to the Kingdom of Lan Xang (\"Land of a Million Elephants\"), founded in the mid-14th century (1353) and long a centre of Theravada Buddhism and Tai-Lao culture. In 1707 the realm fragmented into the rival kingdoms of Luang Prabang, Vientiane, and Champasak, which later fell under Siamese influence and then became a French protectorate within Indochina from the 1890s. Laos gained full independence in 1953, endured heavy bombing during the Second Indochina War, and in 1975 the monarchy was abolished when the Pathet Lao established the Lao People's Democratic Republic, a one-party socialist state that endures today. Modern Laos is defined by a gentle, unhurried pace, deep Buddhist tradition, considerable ethnic diversity, and mountainous, river-laced landscapes. Its cities blend gilded temples, French colonial streetscapes, and Mekong life.",
      "knownFor": [
        "Theravada Buddhism",
        "Mekong River",
        "Lan Xang heritage",
        "French colonial legacy",
        "mountains and karst",
        "ethnic diversity",
        "unhurried pace"
      ],
      "cultureTip": "Dress modestly at temples by covering shoulders and knees, remove your shoes before entering temple buildings and homes, and avoid touching anyone's head or pointing your feet toward people or Buddha images.",
      "sources": [
        "UNESCO World Heritage Centre",
        "Encyclopaedia Britannica",
        "Lonely Planet Laos"
      ],
      "crowds": { "text": "November to February is high season nationwide, when the weather is coolest and driest; December and January are the peak weeks almost everywhere.", "sources": [{ "org": "Wikivoyage — Laos", "url": "https://en.wikivoyage.org/wiki/Laos" }] }
    }
  },
  // Filled per country by loadCountry(cc) from js/data/history.cities.<cc>.js — 99 KB of
  // city records that used to be parsed on every launch whether or not the traveller was on
  // the ground to see them. Mutated in place rather than reassigned, so every existing
  // `HISTORY.cities[key]` read picks up the entries with no call-site change (the same live
  // -binding technique js/lazy-data.js documents). Reads before the country lands get
  // undefined, which is exactly what an unknown city already returned.
  "cities": {}
};
