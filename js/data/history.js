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
  "cities": {
    "th-bangkok": {
      "name": "Bangkok",
      "blurb": "Founded as Thailand's capital in 1782 when King Rama I established the Chakri dynasty on the east bank of the Chao Phraya River, Bangkok grew from a riverside trading settlement into the country's political, economic, and cultural heart. Visitors encounter a dense, energetic metropolis where gilded temples and the Grand Palace sit alongside skyscrapers, sprawling markets, canal boats, and one of the world's great street-food scenes. It is the main international gateway and the natural starting point for most trips.",
      "knownFor": [
        "Grand Palace",
        "Wat Pho and Wat Arun",
        "Street food",
        "Chatuchak market",
        "Chao Phraya River",
        "Nightlife"
      ],
      "bestTime": "November to February, during the cool, dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": [],
      "prices": { "text": "Songkran (13–15 April) is a second demand spike on top of the winter high season. It has historically been the priciest week of the year for a room here, though demand — and how much hotels charge — varies year to year.", "sources": [{ "org": "Bangkok Post", "url": "https://www.bangkokpost.com/business/general/3222939/hotels-slash-rates-to-lure-songkran-market" }] }
    },
    "th-chiang-mai": {
      "name": "Chiang Mai",
      "blurb": "Founded around 1296 as the capital of the Lanna kingdom by King Mangrai, Chiang Mai retains a moated old town packed with historic temples reflecting its northern Lanna heritage. Today it is Thailand's laid-back cultural capital of the north, popular for temple-hopping, cooking classes, night markets, mountain scenery, and ethical elephant sanctuaries in the surrounding hills.",
      "knownFor": [
        "Lanna culture",
        "Old city temples",
        "Doi Suthep",
        "Night bazaar",
        "Cooking classes",
        "Yi Peng lantern festival"
      ],
      "bestTime": "November to February; avoid the March-April burning season for haze.",
      "bestM": [11, 12, 1, 2], "avoidM": [3, 4],
      "prices": { "text": "Songkran (13–15 April) is a second demand spike on top of the winter high season. It has historically been the priciest week of the year for a room here, though demand — and how much hotels charge — varies year to year.", "sources": [{ "org": "Bangkok Post", "url": "https://www.bangkokpost.com/business/general/3222939/hotels-slash-rates-to-lure-songkran-market" }] }
    },
    "th-chiang-rai": {
      "name": "Chiang Rai",
      "blurb": "The northernmost major city, Chiang Rai was founded in the 13th century by King Mangrai and served as the first capital of the Lanna kingdom before Chiang Mai eclipsed it. It is quieter than Chiang Mai and known as a base for exploring the Golden Triangle, hill-tribe communities, and striking contemporary temples such as the White Temple (Wat Rong Khun).",
      "knownFor": [
        "White Temple",
        "Blue Temple",
        "Golden Triangle",
        "Hill-tribe villages",
        "Mountain scenery"
      ],
      "bestTime": "November to February, cool and dry.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-pai": {
      "name": "Pai",
      "blurb": "A small mountain town in Mae Hong Son province set in a scenic river valley, Pai grew from a quiet farming settlement into a popular traveler hub. Reached by a famously winding road from Chiang Mai, it draws visitors for its relaxed atmosphere, hot springs, waterfalls, viewpoints, and backpacker-oriented cafes and nightlife.",
      "knownFor": [
        "Mountain scenery",
        "Backpacker scene",
        "Hot springs",
        "Waterfalls",
        "Relaxed vibe"
      ],
      "bestTime": "November to February; nights can be cold in the valley.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-mae-hong-son": {
      "name": "Mae Hong Son",
      "blurb": "Tucked in a remote, mountainous northwest corner near the Myanmar border, Mae Hong Son developed with strong Shan (Tai Yai) and Burmese influence visible in its temple architecture. It is a tranquil destination for travelers seeking misty valleys, hill-tribe culture, and the scenic loop road that connects it with Pai and Chiang Mai.",
      "knownFor": [
        "Shan and Burmese architecture",
        "Misty mountains",
        "Mae Hong Son loop",
        "Hill-tribe culture",
        "Wat Jong Kham"
      ],
      "bestTime": "November to February for cool weather and morning mists.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-nan": {
      "name": "Nan",
      "blurb": "A historic and long-isolated town in the far north, Nan was once a semi-independent principality with its own distinctive art and Lao-influenced culture. Increasingly popular yet still uncrowded, it appeals to visitors for its old temples, notably the murals of Wat Phumin, its riverside setting, and the surrounding mountains.",
      "knownFor": [
        "Wat Phumin murals",
        "Old kingdom heritage",
        "Mountain scenery",
        "Quiet atmosphere",
        "National park trekking"
      ],
      "bestTime": "November to February, cool and dry.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-sukhothai": {
      "name": "Sukhothai",
      "blurb": "Dating from around the 13th century, Sukhothai was the center of an early Thai kingdom often regarded as a formative period for Thai culture, script, and art. Its centerpiece today is the Sukhothai Historical Park, a UNESCO World Heritage Site whose ruined temples and serene Buddha images can be explored on foot or by bicycle.",
      "knownFor": [
        "Historical park (UNESCO)",
        "Early Thai kingdom",
        "Temple ruins",
        "Cycling the ruins",
        "Loy Krathong festival"
      ],
      "bestTime": "November to February; the historical park is atmospheric at Loy Krathong (usually November).",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-ayutthaya": {
      "name": "Ayutthaya",
      "blurb": "Founded around 1350, Ayutthaya was the capital of a powerful and cosmopolitan Siamese kingdom for over four centuries until its destruction by Burmese forces in 1767. Now a UNESCO World Heritage Site an easy day trip north of Bangkok, its extensive brick temple ruins and the iconic Buddha head entwined in tree roots draw history-minded visitors.",
      "knownFor": [
        "Historical park (UNESCO)",
        "Former Siamese capital",
        "Temple ruins",
        "Buddha head in tree roots",
        "Day trip from Bangkok"
      ],
      "bestTime": "November to February for cooler sightseeing weather.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-kanchanaburi": {
      "name": "Kanchanaburi",
      "blurb": "West of Bangkok on the River Kwai, Kanchanaburi is best known for the WWII-era Death Railway and its bridge, built with forced and prisoner-of-war labor, commemorated at war cemeteries and museums. Beyond its somber history, the area offers waterfalls, national parks, and river scenery that make it a popular nature and history escape.",
      "knownFor": [
        "Bridge over the River Kwai",
        "Death Railway",
        "WWII history",
        "Erawan waterfalls",
        "National parks"
      ],
      "bestTime": "November to February, dry and comfortable.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-krabi": {
      "name": "Krabi",
      "blurb": "A coastal province and town on the Andaman Sea, Krabi is renowned for dramatic limestone karst cliffs, mangroves, and turquoise waters. It serves as a gateway to Railay Beach, Ao Nang, and nearby islands, and is a major base for rock climbing, island-hopping, and beach holidays.",
      "knownFor": [
        "Limestone karsts",
        "Railay Beach",
        "Rock climbing",
        "Island-hopping",
        "Andaman beaches",
        "Ao Nang"
      ],
      "bestTime": "November to April, the Andaman dry season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "th-phuket": {
      "name": "Phuket",
      "blurb": "Thailand's largest island, historically a tin-mining and trading center with a Sino-Portuguese old town, Phuket is now the country's premier beach-resort destination. It offers a wide range of beaches, nightlife around Patong, diving and island trips, and a walkable old town reflecting its multicultural heritage.",
      "knownFor": [
        "Beach resorts",
        "Patong nightlife",
        "Sino-Portuguese old town",
        "Diving and island trips",
        "Big Buddha"
      ],
      "bestTime": "November to April, dry season on the Andaman coast.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "th-koh-lanta": {
      "name": "Koh Lanta",
      "blurb": "A long, relatively laid-back island off Krabi, Koh Lanta is home to a mix of Thai-Muslim and sea-gypsy (Urak Lawoi) communities alongside its old town. It appeals to travelers wanting quieter beaches, easygoing island life, snorkeling and diving day trips, and a slower pace than Phuket.",
      "knownFor": [
        "Quiet beaches",
        "Relaxed atmosphere",
        "Diving and snorkeling",
        "Lanta Old Town",
        "Sunsets"
      ],
      "bestTime": "November to April; many businesses close in the low season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "th-koh-tao": {
      "name": "Koh Tao",
      "blurb": "A small island in the Gulf of Thailand, Koh Tao (\"Turtle Island\") transformed from a sparsely inhabited outpost into one of the world's most popular and affordable places to learn scuba diving. Visitors come chiefly for dive courses, snorkeling, and its warm, clear waters, with a compact and social village scene onshore.",
      "knownFor": [
        "Scuba diving",
        "Dive certification",
        "Snorkeling",
        "Clear waters",
        "Affordable diving"
      ],
      "bestTime": "Roughly March to September; the Gulf's rainiest spell is often October-December.",
      "bestM": [3, 4, 5, 6, 7, 8, 9], "avoidM": [10, 11, 12]
    },
    "th-koh-phangan": {
      "name": "Koh Phangan",
      "blurb": "An island in the Gulf of Thailand near Koh Samui, Koh Phangan is world-famous for its Full Moon Party on Haad Rin beach. Beyond the parties, much of the island remains quieter, with jungle interiors, wellness and yoga retreats, and secluded beaches.",
      "knownFor": [
        "Full Moon Party",
        "Beaches",
        "Yoga and wellness retreats",
        "Nightlife",
        "Jungle interior"
      ],
      "bestTime": "Roughly January to September; heaviest rains typically October-December.",
      "bestM": [1, 2, 3, 4, 5, 6, 7, 8, 9], "avoidM": [10, 11, 12]
    },
    "th-koh-chang": {
      "name": "Koh Chang",
      "blurb": "One of Thailand's largest islands, in the far southeast near Cambodia, Koh Chang (\"Elephant Island\") is largely mountainous and forested, with much of it protected as a national park. It offers a mix of beaches, waterfalls, and jungle, drawing visitors who want nature and beaches within reach of Bangkok.",
      "knownFor": [
        "Forested mountains",
        "Beaches",
        "Waterfalls",
        "National park",
        "Snorkeling"
      ],
      "bestTime": "November to April; much quiets down in the rainy season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "th-trang": {
      "name": "Trang",
      "blurb": "A southern province and town on the Andaman coast, Trang is known for its food culture, including dim sum and roast pork, and for less-crowded beaches and islands. It serves as a gateway to quieter Andaman islands such as Koh Mook, home to the Emerald Cave.",
      "knownFor": [
        "Local food and dim sum",
        "Uncrowded islands",
        "Emerald Cave",
        "Beaches",
        "Authentic southern culture"
      ],
      "bestTime": "November to April, Andaman dry season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "th-nong-khai": {
      "name": "Nong Khai",
      "blurb": "A riverside town in the northeast (Isaan) on the Mekong, Nong Khai sits opposite Laos and is linked to Vientiane by the First Thai-Lao Friendship Bridge, the first bridge across the lower Mekong. Visitors enjoy its relaxed riverfront, the surreal sculptures of Sala Kaew Ku park, and its role as a border crossing into Laos.",
      "knownFor": [
        "Mekong riverfront",
        "Sala Kaew Ku sculpture park",
        "Laos border crossing",
        "Isaan culture",
        "Naga fireballs festival"
      ],
      "bestTime": "November to February; the Naga fireballs event usually falls in October.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-khon-kaen": {
      "name": "Khon Kaen",
      "blurb": "A major city and educational hub in the heart of Isaan (northeastern Thailand), Khon Kaen grew into a regional center of commerce and learning. It offers travelers an authentic look at northeastern Thai life, lively markets, a large lake, and access to nearby dinosaur fossil sites.",
      "knownFor": [
        "Isaan culture",
        "University city",
        "Silk weaving",
        "Bueng Kaen Nakhon lake",
        "Dinosaur fossils nearby"
      ],
      "bestTime": "November to February, cooler and drier.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-buriram": {
      "name": "Buriram",
      "blurb": "A province in southern Isaan near the Cambodian border, Buriram is known for its well-preserved Khmer temple of Phanom Rung, dramatically set on the rim of an extinct volcano. In recent years the city has also become a sports destination, home to a major football stadium and an international motor racing circuit.",
      "knownFor": [
        "Phanom Rung Khmer temple",
        "Football (Buriram United)",
        "Motor racing circuit",
        "Khmer heritage",
        "Isaan culture"
      ],
      "bestTime": "November to February; Phanom Rung's solar alignments draw crowds around April.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-ubon-ratchathani": {
      "name": "Ubon Ratchathani",
      "blurb": "A large city in Thailand's far east on the Mun River, Ubon Ratchathani has deep Lao-Isaan roots and Buddhist heritage. It is most famous for its annual Candle Festival, and serves as a base for exploring national parks, Mekong scenery, and prehistoric rock art nearby.",
      "knownFor": [
        "Candle Festival",
        "Isaan-Lao culture",
        "Buddhist temples",
        "Pha Taem rock art",
        "National parks"
      ],
      "bestTime": "November to February; the Candle Festival usually falls in July.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-udon-thani": {
      "name": "Udon Thani",
      "blurb": "A northeastern city that expanded significantly during the Vietnam War era as a U.S. air base, Udon Thani is a commercial hub of upper Isaan. It is best known as the gateway to Ban Chiang, a UNESCO World Heritage archaeological site, and to the seasonal Red Lotus Sea lake.",
      "knownFor": [
        "Ban Chiang (UNESCO)",
        "Red Lotus Sea",
        "Isaan culture",
        "Regional transport hub",
        "Markets"
      ],
      "bestTime": "November to February; the Red Lotus Sea blooms roughly December to February.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-lopburi": {
      "name": "Lopburi",
      "blurb": "One of Thailand's oldest towns, Lopburi has roots in the Dvaravati and Khmer eras and later served as a secondary royal capital under Ayutthaya's King Narai in the 17th century. Today it is famous for its Khmer-style ruins and the troops of macaque monkeys that roam its old town and temples.",
      "knownFor": [
        "Monkeys",
        "Khmer ruins",
        "King Narai's palace",
        "Ancient history",
        "Prang Sam Yot"
      ],
      "bestTime": "November to February; the annual Monkey Buffet festival is usually in November.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-khao-lak": {
      "name": "Khao Lak",
      "blurb": "A stretch of coastline north of Phuket in Phang Nga province, Khao Lak developed into a relaxed beach-resort area known for long sandy beaches and a quieter, family-friendly atmosphere. It is a leading departure point for liveaboard diving trips to the Similan Islands, and it carries memories of the 2004 tsunami, marked by local memorials.",
      "knownFor": [
        "Quiet beaches",
        "Similan Islands diving",
        "Family-friendly resorts",
        "National parks",
        "2004 tsunami memorials"
      ],
      "bestTime": "November to April; the Similan Islands are typically open mid-October to mid-May.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-hanoi": {
      "name": "Hanoi",
      "blurb": "Vietnam's capital traces its founding as Thang Long to around 1010, when the Ly dynasty moved the capital there, making it one of Southeast Asia's oldest continuously inhabited capitals. It became the political and cultural heart of the north and later a major French colonial administrative center, layers that remain visible today. Visitors experience a dense Old Quarter of narrow trading streets, lakes and pagodas, tree-lined colonial boulevards, and a famously vibrant street-food scene.",
      "knownFor": [
        "Old Quarter",
        "Hoan Kiem Lake",
        "street food",
        "French-colonial architecture",
        "Ho Chi Minh Mausoleum",
        "egg coffee"
      ],
      "bestTime": "October to April, when the weather is cooler and drier; autumn (October-November) is especially pleasant.",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-ho-chi-minh-city": {
      "name": "Ho Chi Minh City",
      "blurb": "Vietnam's largest city and commercial hub, long known as Saigon, grew from an earlier settlement into a Vietnamese and then French colonial port from the 19th century, and was officially renamed after reunification in 1976. It remains the country's economic engine, energetic and fast-paced. Visitors find colonial landmarks, war-history museums, endless markets and rooftop bars, and dense motorbike traffic that defines daily life.",
      "knownFor": [
        "Ben Thanh Market",
        "War Remnants Museum",
        "colonial landmarks",
        "nightlife",
        "motorbike traffic",
        "street food"
      ],
      "bestTime": "December to April, the dry season; expect heat and humidity year-round.",
      "bestM": [12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-hoi-an": {
      "name": "Hoi An",
      "blurb": "A former trading port that flourished roughly from the 15th to the 18th centuries, Hoi An drew Chinese, Japanese, and European merchants, whose influence shaped its remarkably preserved old town. As the port declined, much of the historic architecture survived intact, and the Ancient Town is a UNESCO World Heritage Site. Visitors come for lantern-lit streets, tailor shops, riverside dining, and nearby beaches.",
      "knownFor": [
        "Ancient Town",
        "silk lanterns",
        "tailors and custom clothing",
        "Japanese Covered Bridge",
        "riverside dining",
        "UNESCO heritage"
      ],
      "bestTime": "February to May, dry and mild; avoid the October-November flood season.",
      "bestM": [2, 3, 4, 5], "avoidM": [10, 11]
    },
    "vi-da-nang": {
      "name": "Da Nang",
      "blurb": "A major central coastal city and port, Da Nang grew significantly under French rule and during the 20th-century wars as a strategic base, and has since become one of Vietnam's most rapidly modernizing cities. Today it is known for long sandy beaches, bridges, and a growing skyline. Visitors use it as a comfortable coastal base with easy access to Hoi An, Hue, and the Marble Mountains.",
      "knownFor": [
        "My Khe Beach",
        "Dragon Bridge",
        "Marble Mountains",
        "Ba Na Hills and Golden Bridge",
        "modern coastal city",
        "seafood"
      ],
      "bestTime": "February to May, before the summer heat and the autumn rains.",
      "bestM": [2, 3, 4, 5], "avoidM": []
    },
    "vi-hue": {
      "name": "Hue",
      "blurb": "Hue served as Vietnam's imperial capital under the Nguyen dynasty from 1802 until 1945, and its Citadel and royal tombs make it the country's foremost site of imperial heritage. The Complex of Hue Monuments is a UNESCO World Heritage Site. Visitors explore the walled Imperial City, riverside tombs along the Perfume River, and a refined regional cuisine.",
      "knownFor": [
        "Imperial Citadel",
        "Nguyen dynasty tombs",
        "Perfume River",
        "UNESCO heritage",
        "imperial cuisine",
        "Thien Mu Pagoda"
      ],
      "bestTime": "February to April; Hue is prone to heavy rain later in the year.",
      "bestM": [2, 3, 4], "avoidM": []
    },
    "vi-da-lat": {
      "name": "Da Lat",
      "blurb": "Founded as a French hill station in the 1890s (credited to the bacteriologist Alexandre Yersin) and developed through the early 20th century, Da Lat sits in the Central Highlands at cool elevation and grew as a retreat from the lowland heat. Its temperate climate made it a center for flowers, vegetables, and coffee. Visitors enjoy pine forests, lakes, waterfalls, colonial-era villas, and a springlike climate year-round.",
      "knownFor": [
        "cool highland climate",
        "flower gardens",
        "coffee farms",
        "French hill-station villas",
        "lakes and waterfalls",
        "pine forests"
      ],
      "bestTime": "December to March, the drier months; pleasantly cool all year.",
      "bestM": [12, 1, 2, 3], "avoidM": []
    },
    "vi-ninh-binh": {
      "name": "Ninh Binh",
      "blurb": "This northern province centers on a dramatic karst landscape of limestone peaks, rivers, and caves, sometimes called an inland Ha Long Bay. The area around Hoa Lu was Vietnam's capital from roughly 968 to 1010 under the Dinh and Early Le dynasties. Visitors take rowboat tours through cave-pierced valleys, cycle among rice paddies, and visit the Trang An scenic complex, a UNESCO World Heritage Site.",
      "knownFor": [
        "limestone karst scenery",
        "Trang An boat tours",
        "Tam Coc",
        "Hoa Lu ancient capital",
        "rice paddies",
        "UNESCO heritage"
      ],
      "bestTime": "Late May to early July for golden rice, or the dry cool months of October to December.",
      "bestM": [5, 6, 7, 10, 11, 12], "avoidM": []
    },
    "vi-phong-nha": {
      "name": "Phong Nha",
      "blurb": "Phong Nha-Ke Bang National Park protects one of the world's most important karst cave systems, including Son Doong, widely regarded as the largest cave on Earth by volume. The park is a UNESCO World Heritage Site recognized for its geology and biodiversity. Visitors come to tour illuminated show caves, take river-boat trips, and join guided expeditions into the surrounding jungle and cave country.",
      "knownFor": [
        "Phong Nha Cave",
        "Paradise Cave",
        "Son Doong (guided expeditions)",
        "national park",
        "caving and adventure",
        "UNESCO heritage"
      ],
      "bestTime": "February to August, the dry season; caves may close during autumn floods.",
      "bestM": [2, 3, 4, 5, 6, 7, 8], "avoidM": []
    },
    "vi-nha-trang": {
      "name": "Nha Trang",
      "blurb": "A coastal city on the south-central coast, Nha Trang developed into a resort destination through the 20th century and remains one of Vietnam's best-known beach cities. The area also preserves Cham towers dating to the Champa kingdom, notably Po Nagar. Visitors come for its long city beach, offshore islands, diving and snorkeling, and lively seaside nightlife.",
      "knownFor": [
        "city beach",
        "island-hopping",
        "diving and snorkeling",
        "Po Nagar Cham towers",
        "seafood",
        "beach nightlife"
      ],
      "bestTime": "January to August, especially the dry months before the autumn rains.",
      "bestM": [1, 2, 3, 4, 5, 6, 7, 8], "avoidM": []
    },
    "vi-ha-giang": {
      "name": "Ha Giang",
      "blurb": "Vietnam's northernmost province, bordering China, is a remote and mountainous region long home to diverse ethnic-minority communities. Its rugged terrain kept it isolated, preserving traditional villages and markets. Visitors ride the famous Ha Giang Loop through the Dong Van Karst Plateau Geopark, passing dramatic mountain passes, terraced fields, and hill-tribe villages.",
      "knownFor": [
        "Ha Giang Loop",
        "mountain scenery",
        "ethnic-minority villages",
        "Dong Van Karst Plateau",
        "motorbike touring",
        "terraced fields"
      ],
      "bestTime": "September to November for clear skies and harvest, or spring (March-April) for flowers.",
      "bestM": [9, 10, 11, 3, 4], "avoidM": []
    },
    "vi-sapa": {
      "name": "Sapa",
      "blurb": "A former French hill station established in the early 20th century (around 1922), Sapa sits high in the northwestern mountains near Fansipan, Vietnam's highest peak and the roof of Indochina. It is a gateway to terraced rice valleys and villages of Hmong, Dao, and other ethnic-minority groups. Visitors come for trekking, homestays, colorful markets, and cable-car or hiking access to the summit.",
      "knownFor": [
        "rice terraces",
        "trekking",
        "ethnic-minority markets",
        "Fansipan peak",
        "hill-station origins",
        "mountain homestays"
      ],
      "bestTime": "September to November and March to May; winters are cold and can be foggy.",
      "bestM": [9, 10, 11, 3, 4, 5], "avoidM": []
    },
    "vi-can-tho": {
      "name": "Can Tho",
      "blurb": "The largest city of the Mekong Delta, Can Tho grew as a river trading and agricultural hub in Vietnam's rice-growing heartland. It is the main base for exploring delta life. Visitors take early-morning boat trips to floating markets, cruise canals lined with orchards and stilt houses, and sample delta fruit and river fish.",
      "knownFor": [
        "Cai Rang floating market",
        "Mekong Delta",
        "river cruises",
        "canals and orchards",
        "rice country",
        "fresh fruit"
      ],
      "bestTime": "December to April, the dry season; floating markets are best at dawn.",
      "bestM": [12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-phu-quoc": {
      "name": "Phu Quoc",
      "blurb": "Vietnam's largest island, in the Gulf of Thailand off the southwest coast, was historically known for fishing, fish sauce, and pepper farming before rapid tourism development in recent decades. It now ranges from big resorts to quieter beaches. Visitors come for white-sand beaches, snorkeling, night markets, and its famous fish sauce and pepper.",
      "knownFor": [
        "beaches",
        "resorts",
        "fish sauce",
        "snorkeling and diving",
        "night market",
        "pepper farms"
      ],
      "bestTime": "November to April, the dry season with calm seas.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-ha-long": {
      "name": "Ha Long",
      "blurb": "Ha Long Bay, off the northeast coast, is famed for thousands of limestone karst islands and islets rising from emerald water, and is a UNESCO World Heritage Site. Ha Long City serves as the main mainland gateway and cruise departure point. Visitors experience the bay by overnight junk cruise or day boat, exploring caves, floating villages, and quiet lagoons.",
      "knownFor": [
        "limestone karst islands",
        "overnight cruises",
        "caves",
        "kayaking",
        "UNESCO heritage",
        "floating villages"
      ],
      "bestTime": "October to April for cooler, clearer conditions; avoid summer storm season.",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-cat-ba": {
      "name": "Cat Ba",
      "blurb": "The largest island near Ha Long Bay, Cat Ba borders the quieter Lan Ha Bay and holds a national park and biosphere reserve; since 2023 it forms part of the extended Ha Long Bay-Cat Ba Archipelago UNESCO World Heritage Site. It offers a more laid-back, adventure-focused alternative to Ha Long's cruise scene. Visitors come for kayaking, rock climbing, hiking, boat trips through Lan Ha Bay, and beaches.",
      "knownFor": [
        "Lan Ha Bay",
        "national park",
        "rock climbing",
        "kayaking",
        "hiking",
        "UNESCO heritage"
      ],
      "bestTime": "April to October for beach weather; late spring and early autumn are most comfortable.",
      "bestM": [4, 5, 6, 7, 8, 9, 10], "avoidM": []
    },
    "vi-quy-nhon": {
      "name": "Quy Nhon",
      "blurb": "A south-central coastal city and port, Quy Nhon lies in a region that was once a heartland of the Champa kingdom, whose capital Vijaya stood nearby, and Cham towers survive in the area. Long a working fishing and port city, it has become known as a lower-key beach destination. Visitors enjoy clean beaches, fresh seafood, coastal scenery, and nearby Cham ruins without the crowds of larger resorts.",
      "knownFor": [
        "quiet beaches",
        "seafood",
        "Cham towers",
        "fishing port",
        "coastal scenery",
        "off-the-beaten-path feel"
      ],
      "bestTime": "February to August, the drier and calmer months.",
      "bestM": [2, 3, 4, 5, 6, 7, 8], "avoidM": []
    },
    "vi-con-dao": {
      "name": "Con Dao",
      "blurb": "An archipelago off the southern coast, Con Dao is best known for its former prison complex, built by the French in the 19th century and used under later administrations, now preserved as memorial sites, and for its protected marine and national park environment. It combines somber history with pristine nature. Visitors come for quiet beaches, diving, sea-turtle nesting, forest walks, and reflective visits to the historic prisons.",
      "knownFor": [
        "national park",
        "historic prisons",
        "diving and snorkeling",
        "sea turtles",
        "quiet beaches",
        "nature reserve"
      ],
      "bestTime": "March to September for calm seas and diving; turtle nesting peaks in summer.",
      "bestM": [3, 4, 5, 6, 7, 8, 9], "avoidM": []
    },
    "vi-buon-ma-thuot": {
      "name": "Buon Ma Thuot",
      "blurb": "The largest city of the Central Highlands, Buon Ma Thuot is widely regarded as the center of Vietnam's coffee industry and lies in a region home to several ethnic-minority communities. It grew as an agricultural and administrative hub around coffee cultivation. Visitors use it as a base to explore coffee plantations, waterfalls, ethnic-minority villages, and nearby national parks.",
      "knownFor": [
        "coffee capital",
        "Central Highlands",
        "ethnic-minority culture",
        "waterfalls",
        "coffee plantations",
        "national parks"
      ],
      "bestTime": "November to April, the dry season; the coffee harvest runs late in the year.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-siem-reap": {
      "name": "Siem Reap",
      "blurb": "Siem Reap is the gateway town to the Angkor Archaeological Park, the sprawling complex of temples built by the Khmer Empire between roughly the 9th and 13th centuries, including the iconic Angkor Wat. Once a modest settlement, it grew into Cambodia's main tourism hub as visitors flocked to the ruins. Today travellers use it as a base for temple exploration by day and enjoy a lively scene of restaurants, markets, and Khmer cultural shows by night.",
      "knownFor": [
        "Angkor Wat",
        "Angkor temples",
        "Ta Prohm",
        "Pub Street nightlife",
        "night markets",
        "floating villages"
      ],
      "bestTime": "November to February, the cool dry season, for the most comfortable temple visits.",
      "bestM": [11, 12, 1, 2], "avoidM": [],
      "crowds": { "text": "Angkor Enterprise's own ticket-sales figures for 2025 show the shape of the year clearly: around 133,000 foreign visitors a month in January-March, falling through the wet season to a directly-reported September low of 35,650, then climbing again into the December-January peak, when Cambodia's dry season overlaps school holidays across Europe, North America and Australia.", "sources": [{ "org": "Phnom Penh Post", "url": "https://phnompenhpost.com/business/angkor-ticket-sales-climb-by-almost-a-third/" }, { "org": "Cambodianess, citing Angkor Enterprise", "url": "https://cambodianess.com/article/foreign-tourists-visiting-angkor-surpass-700000-in-first-nine-months-of-2025" }, { "org": "Khmer Times, citing Angkor Enterprise", "url": "https://www.khmertimeskh.com/501730845/cambodias-angkor-makes-28-6-mln-from-ticket-sales-during-jan-july-period/" }] }
    },
    "kh-phnom-penh": {
      "name": "Phnom Penh",
      "blurb": "Phnom Penh, the capital, sits at the confluence of the Mekong and Tonle Sap rivers and takes its name from a legendary 14th-century hill shrine associated with a woman named Penh. It became the royal capital in the 15th century (around 1434, after the decline of Angkor) and was later a key administrative centre under French rule, giving it a blend of Khmer and colonial-era architecture. Visitors come to see the Royal Palace and Silver Pagoda, riverside promenades, and sobering memorials to the Khmer Rouge period such as Tuol Sleng and the Choeung Ek Killing Fields.",
      "knownFor": [
        "Royal Palace",
        "Tuol Sleng genocide museum",
        "Killing Fields",
        "riverside promenade",
        "Central Market",
        "French colonial architecture"
      ],
      "bestTime": "November to February for cooler, drier weather.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-kampot": {
      "name": "Kampot",
      "blurb": "Kampot is a riverside town in southern Cambodia known for its faded French colonial shophouses and relaxed pace. Historically it was an important trading port and is famous for Kampot pepper, a prized regional crop. Today visitors enjoy river cruises, cafes, and it serves as a base for trips to nearby Bokor Mountain and its national park.",
      "knownFor": [
        "Kampot pepper",
        "colonial architecture",
        "riverside cafes",
        "Bokor National Park",
        "laid-back atmosphere"
      ],
      "bestTime": "November to April, the dry season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-kep": {
      "name": "Kep",
      "blurb": "Kep is a small seaside town founded as a French colonial resort in 1908, and the ruined villas from that era still dot the hillsides. It later declined during the country's years of conflict and has since been revived as a quiet coastal retreat. Visitors come mainly for its famous crab market, fresh seafood, and access to nearby Kep National Park and Rabbit Island.",
      "knownFor": [
        "crab market",
        "fresh seafood",
        "colonial villa ruins",
        "Kep National Park",
        "Rabbit Island"
      ],
      "bestTime": "November to April, the dry season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-battambang": {
      "name": "Battambang",
      "blurb": "Battambang is one of Cambodia's largest cities and long regarded as its second city, at the heart of a fertile rice-growing region in the northwest, with a history tied to periods of Thai and Khmer rule. It is well known for its preserved French colonial architecture and a growing arts scene. Visitors explore the old town, nearby hilltop temples and caves, and the region's countryside.",
      "knownFor": [
        "French colonial architecture",
        "arts scene",
        "rice country",
        "bamboo railway",
        "Phnom Sampeau caves"
      ],
      "bestTime": "November to February for cooler, drier conditions.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-kratie": {
      "name": "Kratie",
      "blurb": "Kratie is a quiet town on the banks of the Mekong River in northeastern Cambodia, retaining a stretch of old colonial-era shophouses. It is best known as one of the most reliable places to see the rare Irrawaddy dolphins that live in the river nearby. Visitors enjoy its slow riverside pace, sunsets over the Mekong, and trips to nearby islands.",
      "knownFor": [
        "Irrawaddy dolphins",
        "Mekong River",
        "riverside sunsets",
        "colonial shophouses",
        "Koh Trong island"
      ],
      "bestTime": "November to April, the dry season, when river levels aid dolphin viewing.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-sihanoukville": {
      "name": "Sihanoukville",
      "blurb": "Sihanoukville is Cambodia's main coastal port city, developed in the 1950s around the country's first deep-water port and named after King Norodom Sihanouk. Long a beach destination, it has undergone rapid and controversial development in recent years, driven heavily by casino and resort construction. It mainly serves today as the departure point for ferries to the offshore islands, and its beaches vary widely in character.",
      "knownFor": [
        "port city",
        "island ferry hub",
        "beaches",
        "casinos and resorts",
        "rapid development"
      ],
      "bestTime": "November to April, the dry season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-koh-rong": {
      "name": "Koh Rong",
      "blurb": "Koh Rong is Cambodia's second-largest island, lying off the coast near Sihanoukville and reached by ferry. Once largely undeveloped, it has grown into a popular island getaway known for white-sand beaches and clear water. Visitors come for swimming, snorkelling, and the chance to see bioluminescent plankton at night, with a range of budget to upmarket stays; its quieter neighbour Koh Rong Sanloem offers a calmer alternative.",
      "knownFor": [
        "white-sand beaches",
        "snorkelling and diving",
        "bioluminescent plankton",
        "island nightlife",
        "clear waters"
      ],
      "bestTime": "November to April, the dry season, for calm seas and clear water.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-banlung": {
      "name": "Banlung",
      "blurb": "Banlung is the capital of remote Ratanakiri province in Cambodia's northeast, a region of red-earth roads, forests, and ethnic minority communities. It developed as a modest provincial hub and remains a base for nature-focused travel. Visitors come to swim in the crater lake of Yeak Laom, visit waterfalls, and explore surrounding jungle and villages.",
      "knownFor": [
        "Yeak Laom crater lake",
        "waterfalls",
        "jungle trekking",
        "ethnic minority villages",
        "remote highlands"
      ],
      "bestTime": "November to February, before roads become difficult in the wet season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-sen-monorom": {
      "name": "Sen Monorom",
      "blurb": "Sen Monorom is the small capital of Mondulkiri, Cambodia's easternmost and least densely populated province, set in cool, rolling highlands. The area is home to Bunong ethnic communities and was historically a frontier region. It is best known today as a centre for ethical elephant sanctuaries and nature trips to nearby waterfalls and forests.",
      "knownFor": [
        "elephant sanctuaries",
        "rolling highlands",
        "cooler climate",
        "waterfalls",
        "Bunong culture",
        "forest treks"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-luang-prabang": {
      "name": "Luang Prabang",
      "blurb": "Set at the confluence of the Mekong and Nam Khan rivers, Luang Prabang rose to prominence from around the 14th century as the royal capital of Lan Xang and remained a spiritual and cultural heart of the region. Its exceptionally well-preserved townscape, blending gilded Buddhist temples with French-Lao colonial architecture, earned UNESCO World Heritage status in 1995. Visitors today experience the dawn alms-giving procession of monks, hillside views from Mount Phousi, a lively night market, and nearby waterfalls at Kuang Si.",
      "knownFor": [
        "UNESCO World Heritage",
        "Buddhist temples",
        "morning alms-giving",
        "French-Lao architecture",
        "Kuang Si Falls",
        "night market"
      ],
      "bestTime": "November to February, when the weather is cool and dry",
      "bestM": [11, 12, 1, 2], "avoidM": [],
      "crowds": { "text": "The country's most-visited town by far: over 1.7 million visitors in the first ten months of 2024 alone, already past its own full-year target, with the trend continuing into the traditional December-January peak.", "sources": [{ "org": "tourismlaos.org", "url": "https://www.tourismlaos.org/2024/12/18/luang-prabang-smashes-2024-tourism-goal-over-1-7-million-visitors-expecting-surge-in-peak-season/" }] }
    },
    "la-vientiane": {
      "name": "Vientiane",
      "blurb": "Vientiane, the national capital, sits on a bend of the Mekong facing Thailand and grew into a major seat of power under Lan Xang before becoming a kingdom in its own right in the 18th century. Largely destroyed by a Siamese invasion in 1827, it was later rebuilt and developed as the administrative centre of French Laos. It remains one of Southeast Asia's most low-key capitals, offering the golden stupa of Pha That Luang, the Patuxai monument, a riverside promenade, and the eclectic Buddha Park just outside the city.",
      "knownFor": [
        "Pha That Luang",
        "Patuxai monument",
        "Mekong riverfront",
        "Buddha Park",
        "relaxed capital",
        "colonial buildings"
      ],
      "bestTime": "November to February for cooler, drier days",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-vang-vieng": {
      "name": "Vang Vieng",
      "blurb": "Vang Vieng is a small town on the Nam Song river framed by dramatic karst limestone peaks. It grew rapidly as a backpacker destination and was once known for a raucous river-tubing party scene, but in recent years it has repositioned itself around outdoor adventure and ecotourism. Today visitors come for tubing and kayaking, caves and blue lagoons, hot-air balloon rides, and viewpoints over the surrounding mountains.",
      "knownFor": [
        "karst scenery",
        "tubing and kayaking",
        "hot-air balloons",
        "caves",
        "blue lagoons",
        "outdoor adventure"
      ],
      "bestTime": "November to March, avoiding the heaviest rains",
      "bestM": [11, 12, 1, 2, 3], "avoidM": []
    },
    "la-nong-khiaw": {
      "name": "Nong Khiaw",
      "blurb": "Nong Khiaw is a small riverside town on the Nam Ou in northern Laos, hemmed in by steep limestone cliffs. It serves as a laid-back base for exploring rural upland Laos and reaching the roadless village of Muang Ngoi upriver. Travellers come for trekking to panoramic viewpoints, kayaking, and visiting caves that sheltered residents during the war.",
      "knownFor": [
        "Nam Ou river",
        "limestone cliffs",
        "trekking and viewpoints",
        "kayaking",
        "caves",
        "slow rural pace"
      ],
      "bestTime": "October to April, during the dry season",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-thakhek": {
      "name": "Thakhek",
      "blurb": "Thakhek is a quiet Mekong-side town and the capital of Khammouane province, with roots as a French colonial trading post reflected in its faded riverfront architecture. It is best known as the starting point of the Thakhek Loop, a popular multi-day motorbike route through karst country. The area's headline attraction is Konglor Cave, a river cave roughly seven kilometres long that boats pass through.",
      "knownFor": [
        "Thakhek Loop",
        "Konglor Cave",
        "limestone karst",
        "Mekong riverfront",
        "colonial roots",
        "motorbike touring"
      ],
      "bestTime": "November to February, when caves and roads are at their most accessible",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-pakse": {
      "name": "Pakse",
      "blurb": "Pakse is the largest town in southern Laos and the capital of Champasak province, sitting where the Xe Don river meets the Mekong. It was established by the French around 1905 as an administrative centre, and traces of that era remain in its older buildings. Chiefly a transport and trade hub, it is the main gateway to the coffee-growing Bolaven Plateau, the Wat Phou temple complex, and the Four Thousand Islands.",
      "knownFor": [
        "Bolaven Plateau coffee",
        "gateway to the south",
        "Mekong confluence",
        "French colonial buildings",
        "transport hub",
        "waterfalls"
      ],
      "bestTime": "November to February for cooler, drier conditions",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-champasak": {
      "name": "Champasak",
      "blurb": "Champasak is a sleepy riverside town that was once associated with the seat of an independent southern Lao kingdom. Its main draw is nearby Vat Phou (Wat Phou), a UNESCO-listed Khmer Hindu temple complex whose surviving structures date largely from around the 11th to 13th centuries, overlapping the great Angkorian era. Visitors experience a tranquil Mekong setting and atmospheric ancient ruins set against a sacred mountain.",
      "knownFor": [
        "Vat Phou (Wat Phou)",
        "Khmer ruins",
        "UNESCO World Heritage",
        "former royal seat",
        "Mekong tranquillity"
      ],
      "bestTime": "November to February, and around the Wat Phou festival in the cool season",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-savannakhet": {
      "name": "Savannakhet",
      "blurb": "Savannakhet is a Mekong town and provincial capital that faces Mukdahan in Thailand across the river, long an important point on regional trade routes. Its old quarter preserves a notable ensemble of French colonial and shophouse architecture. Attractions include the revered That Ing Hang stupa, a Catholic church, and a small provincial dinosaur museum reflecting local fossil finds.",
      "knownFor": [
        "colonial old town",
        "That Ing Hang stupa",
        "Mekong border crossing",
        "dinosaur museum",
        "trade route heritage"
      ],
      "bestTime": "November to February for the driest, coolest weather",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-phonsavan": {
      "name": "Phonsavan",
      "blurb": "Phonsavan is the main town of Xieng Khouang province, largely rebuilt after the area was heavily bombed during the Second Indochina War. It is the gateway to the Plain of Jars, a landscape of mysterious Iron Age stone jars inscribed as a UNESCO World Heritage Site in 2019. Visits here are often paired with sobering exhibits on unexploded ordnance and ongoing clearance work.",
      "knownFor": [
        "Plain of Jars",
        "UNESCO World Heritage",
        "war history",
        "UXO awareness",
        "highland scenery"
      ],
      "bestTime": "November to February, though highland nights can be cold",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-luang-namtha": {
      "name": "Luang Namtha",
      "blurb": "Luang Namtha is a provincial town in far northern Laos, close to the Chinese border and set amid forested hills. It is a leading centre for community-based ecotourism, serving as the gateway to the Nam Ha National Protected Area. Travellers come for guided treks and kayaking and to visit villages of ethnic groups such as the Akha, Hmong, and Khmu.",
      "knownFor": [
        "Nam Ha protected area",
        "community trekking",
        "ethnic minority villages",
        "biodiversity",
        "kayaking",
        "ecotourism"
      ],
      "bestTime": "October to April, during the drier trekking season",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-si-phan-don": {
      "name": "Si Phan Don",
      "blurb": "Si Phan Don, or the \"Four Thousand Islands,\" is a braided stretch of the Mekong in far southern Laos near the Cambodian border, where the river fans out into countless islets. The main inhabited islands of Don Khong, Don Det, and Don Khon offer a famously slow, hammock-paced way of life alongside remnants of a French-era railway. The area is also home to Khone Phapheng, the largest waterfall by volume in Southeast Asia.",
      "knownFor": [
        "Four Thousand Islands",
        "Mekong island life",
        "Khone Phapheng Falls",
        "French railway remnants",
        "cycling and hammocks"
      ],
      "bestTime": "November to February for comfortable travel; waterfalls are fullest late in the wet season",
      "bestM": [11, 12, 1, 2], "avoidM": []
    }
  }
};
