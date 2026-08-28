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
    "th-ratchaburi": {
      "name": "Ratchaburi",
      "blurb": "A largely agricultural province southwest of Bangkok, Ratchaburi is best known to travellers as the home of Damnoen Saduak, Thailand's most famous floating market, where vendors sell fruit, noodles and souvenirs from paddleboats along a network of canals dug in the 1860s.",
      "knownFor": [
        "Damnoen Saduak Floating Market",
        "canal-boat vendors",
        "day trip from Bangkok"
      ],
      "bestTime": "November to February, Thailand's cool, dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-samut-songkhram": {
      "name": "Samut Songkhram",
      "blurb": "Thailand's smallest province by area, on the Gulf coast southwest of Bangkok, Samut Songkhram is best known for the Maeklong Railway Market, nicknamed \"Talad Rom Hup\" (the umbrella-pulldown market): stallholders fold back their awnings and produce several times a day as a train rolls directly through the middle of the market along the platform.",
      "knownFor": [
        "Maeklong Railway Market",
        "market stalls that fold back for the train",
        "Mae Klong River"
      ],
      "bestTime": "November to February, Thailand's cool, dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-amphawa": {
      "name": "Amphawa",
      "blurb": "A canal-side town in Samut Songkhram province, Amphawa is best known for its weekend floating market, busiest on Friday, Saturday and Sunday evenings, and for long-tail boat tours after dark to watch fireflies light up the mangroves along the Mae Klong River.",
      "knownFor": [
        "Amphawa Floating Market",
        "weekend evening market",
        "firefly boat tours"
      ],
      "bestTime": "November to February, Thailand's cool, dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-nakhon-ratchasima": {
      "name": "Nakhon Ratchasima",
      "blurb": "Known locally as Khorat, Thailand's second-largest province is a gateway to Isan (the northeast) and home to Phimai Historical Park, the largest ancient Khmer temple complex in Thailand, parts of which predate Angkor Wat. Every November the Phimai Festival fills the site with long-boat races on the Mun River and an evening sound-and-light show.",
      "knownFor": [
        "Phimai Historical Park",
        "Khmer temple ruins",
        "Phimai Festival (November)",
        "gateway to Isan",
        "Khao Yai National Park (partly in this province)"
      ],
      "bestTime": "Cool season aside, the Phimai Festival in early-to-mid November is the single best time to come, with long-boat races and an evening sound-and-light show at the temple.",
      "bestM": [11], "avoidM": []
    },
    "th-loei": {
      "name": "Loei",
      "blurb": "A mountainous, relatively cool province in Thailand's far north-east near the Laos border, Loei is best known for Phu Kradueng National Park, a table-top mountain reached by a steep half-day trek to a plateau of pine forest, cliffs and campsites.",
      "knownFor": [
        "Phu Kradueng National Park",
        "mountain trekking and camping",
        "cool-season temperatures"
      ],
      "bestTime": "Phu Kradueng is open only October to May; the park closes completely June to September each year, both for the rainy season and to let the plateau recover.",
      "bestM": [10, 11, 12, 1, 2, 3, 4, 5], "avoidM": [6, 7, 8, 9]
    },
    "th-phetchaburi": {
      "name": "Phetchaburi",
      "blurb": "An old royal town on the Gulf coast south of Bangkok, Phetchaburi is known for hilltop and cave temples and as the gateway to Kaeng Krachan National Park, Thailand's largest national park, where a \"sea of mist\" spreads below the Phanoen Thung viewpoint on cool-season mornings.",
      "knownFor": [
        "Kaeng Krachan National Park",
        "Phanoen Thung sea-of-mist viewpoint",
        "hilltop and cave temples",
        "birdwatching"
      ],
      "bestTime": "November to February for the sea-of-mist views at Phanoen Thung; the upper park (Ban Krang and Phanoen Thung) closes to overnight visitors from August to October each year for the wet season.",
      "bestM": [11, 12, 1, 2], "avoidM": [8, 9, 10]
    },
    "th-surat-thani": {
      "name": "Surat Thani",
      "blurb": "A transport hub on Thailand's Gulf coast, Surat Thani town itself draws few visitors but is the main gateway by rail, road and ferry to Koh Samui, Koh Phangan and Koh Tao, and to the rainforest and lake of Khao Sok National Park inland.",
      "knownFor": [
        "ferry gateway to the Gulf islands",
        "train and bus hub",
        "Khao Sok National Park (inland)"
      ]
    },
    "th-satun": {
      "name": "Satun",
      "blurb": "Thailand's southwesternmost province, on the Andaman coast near the Malaysian border, Satun is the gateway to Koh Lipe, a small coral-fringed island inside Tarutao National Marine Park known for clear water and reef snorkelling.",
      "knownFor": [
        "Koh Lipe",
        "Tarutao National Marine Park",
        "coral reefs and snorkelling",
        "Malaysia border crossing"
      ],
      "bestTime": "November to April, when the sea is calm; most resorts and the ferry to Koh Lipe close for the monsoon, roughly mid-May to mid-October, and Tarutao National Park's own closure runs to mid-November.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": [5, 6, 7, 8, 9, 10]
    },
    "th-phang-nga-bay": {
      "name": "Phang Nga Bay",
      "blurb": "A bay of limestone karst islands and mangrove channels between Phuket and Krabi, Phang Nga Bay is known for Ko Tapu (\"James Bond Island\") and long-tail boat and sea-canoe trips through its hongs (hidden lagoons). Koh Yao Noi, a quiet, largely undeveloped island inside the bay, is a base for slower island-hopping and cycling away from Phuket's crowds.",
      "knownFor": [
        "James Bond Island (Ko Tapu)",
        "limestone karsts",
        "hong sea-canoe tours",
        "Koh Yao Noi"
      ],
      "bestTime": "November to April, driest and calmest for boat trips; some trips are cancelled in the roughest weather, September and October.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": [9, 10]
    },
    "th-rayong": {
      "name": "Rayong",
      "blurb": "An industrial and agricultural province on the eastern Gulf coast, Rayong is best known to travellers as the mainland departure point for Koh Samet, a small national-park island with some of the closest white-sand beaches to Bangkok.",
      "knownFor": [
        "Koh Samet",
        "Ban Phe ferry pier",
        "durian and seafood"
      ],
      "bestTime": "November to February, when it's driest and coolest; rain is heaviest from July to October.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-koh-samui": {
      "name": "Koh Samui",
      "blurb": "Long known as \"Coconut Island\" for its plantations, Koh Samui is Thailand's third-largest island, settled for centuries by Malay and Chinese fishing communities in the Gulf of Thailand. Backpackers began arriving by boat in the 1970s, and the island's own airport, opened in 1989, brought mass and luxury tourism that has since overtaken coconuts and fishing as the main economy. Today it offers resort beaches along Chaweng and Bophut, temples and waterfalls inland, and boat access to the limestone islands of Ang Thong Marine National Park.",
      "knownFor": [
        "Chaweng Beach",
        "Fisherman's Village, Bophut",
        "Big Buddha (Wat Phra Yai)",
        "Ang Thong Marine National Park",
        "Na Muang Waterfalls",
        "Beach resorts and nightlife"
      ],
      "bestTime": "Roughly January to September; like nearby Koh Tao and Koh Phangan, Samui's monsoon runs opposite the mainland's, and the Northeast Monsoon's heaviest rain and roughest seas from October to December are best avoided for beach time.",
      "bestM": [1, 2, 3, 4, 5, 6, 7, 8, 9], "avoidM": [10, 11, 12]
    },
    "th-soppong": {
      "name": "Soppong",
      "blurb": "Soppong is a small Shan village in Pang Mapha district, Mae Hong Son province, roughly midway between Pai and Mae Hong Son on the mountain loop road. The district holds one of Thailand's densest concentrations of caves, most famously Tham Lod, where the Nam Lang River runs through a limestone passage that visitors cross by bamboo raft past wooden coffins left by an Iron Age culture. Soppong and the long-running Cave Lodge serve as the base for caving, trekking to Lahu and other hill-tribe villages, and exploring the district's many undeveloped caves.",
      "knownFor": [
        "Tham Lod Cave (Nam Lang River)",
        "Cave Lodge",
        "Iron Age log coffins",
        "Lahu and hill-tribe treks",
        "Wild caves of Pang Mapha",
        "Mae Hong Son Loop stopover"
      ],
      "bestTime": "November to February, the cool dry season; like the rest of Mae Hong Son province, avoid March-April for burning-season haze.",
      "bestM": [11, 12, 1, 2], "avoidM": [3, 4]
    },
    "th-pattaya": {
      "name": "Pattaya",
      "blurb": "Pattaya's name comes from Thap Phraya (\"army of the Phraya\"), after an 18th-century military encounter involving the general who became King Taksin. The fishing village stayed largely undeveloped until American servicemen began arriving for rest and recreation in 1959, a role that expanded through the Vietnam War and turned Pattaya, chartered as a city in 1978, into one of Thailand's largest beach resorts. It is known equally for nightlife along Walking Street and for family-oriented attractions such as the wooden Sanctuary of Truth, the hilltop Big Buddha, and Nong Nooch Tropical Garden, with quieter Jomtien Beach just to the south.",
      "knownFor": [
        "Walking Street nightlife",
        "Sanctuary of Truth",
        "Big Buddha Hill (Wat Phra Yai)",
        "Nong Nooch Tropical Garden",
        "Jomtien Beach",
        "Thepprasit Night Market"
      ],
      "bestTime": "November to February, Thailand's cool, dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-hua-hin": {
      "name": "Hua Hin",
      "blurb": "Hua Hin grew from a small fishing settlement into Thailand's original royal seaside resort after the railway reached town in 1911 and Prince Purachatra built the Railway Hotel in 1922. King Rama VII cemented its royal status by completing the Klai Kangwon (\"Far from Worries\") summer palace in 1929, drawing Bangkok's elite to build holiday homes along the coast. It retains that heritage today in its restored railway station and seafront hotels, alongside the temple and viewpoint at Khao Takiab (\"Monkey Mountain\") and the large Luang Pu Thuat statue at Wat Huay Mongkol.",
      "knownFor": [
        "Royal seaside resort heritage",
        "Hua Hin Railway Station",
        "Khao Takiab (Monkey Mountain)",
        "Wat Huay Mongkol",
        "Seafront hotels",
        "Chatchai Market and night market"
      ],
      "bestTime": "November to February, Thailand's cool, dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-khun-yuam": {
      "name": "Khun Yuam",
      "blurb": "Khun Yuam is a small district town on the Mae Hong Son Loop, in a valley between Mae Hong Son and Mae Sariang. During the Second World War it served as a Japanese army staging post and hospital on the supply route into Burma, a history documented in its Thai-Japan Friendship Memorial Hall, which holds artifacts left by the soldiers who passed through. Above the town, the hills of Doi Mae U-Kho turn gold each November and December when wild Mexican sunflowers (Thung Bua Tong) bloom across the ridgelines, and nearby Mae Surin Waterfall and Wat To Phae are further draws.",
      "knownFor": [
        "Thung Bua Tong sunflower fields (Doi Mae U-Kho)",
        "Khun Yuam WWII Museum",
        "Mae Surin Waterfall",
        "Wat To Phae",
        "Mae Hong Son Loop stopover"
      ],
      "bestTime": "The Thung Bua Tong sunflower fields usually peak in mid-November and last into December; as elsewhere in Mae Hong Son province, avoid March-April for burning-season haze.",
      "bestM": [11, 12], "avoidM": [3, 4]
    },
    "th-mae-sariang": {
      "name": "Mae Sariang",
      "blurb": "Mae Sariang is a quiet district town on the Yuam River in Mae Hong Son province, with a Shan (Tai Yai) heritage reflected in its older teak buildings and Burmese-style temples. It is a stop on the Mae Hong Son Loop and a base for river trips on the Salween, which forms the Myanmar border nearby at Mae Sam Laep, as well as for hill-tribe villages in the surrounding hills.",
      "knownFor": [
        "Salween River and Mae Sam Laep",
        "Shan (Tai Yai) old town and temples",
        "Yuam River",
        "Night market",
        "Mae Hong Son Loop stopover"
      ],
      "bestTime": "November to February, the cool dry season; like the rest of Mae Hong Son province, avoid March-April for burning-season haze.",
      "bestM": [11, 12, 1, 2], "avoidM": [3, 4]
    },
    "th-mae-chaem": {
      "name": "Mae Chaem",
      "blurb": "Mae Chaem is a remote district town of Chiang Mai province, in a valley of the Mae Chaem River on the back route between the Mae Hong Son Loop and Doi Inthanon. Home to Tai Yuan, Karen, Lua, Hmong, and Lisu communities, it is known for traditional weaving, older temples such as Wat Pa Daet, and nearby Ob Luang National Park, where the river cuts a narrow granite gorge.",
      "knownFor": [
        "Ob Luang Gorge",
        "Wat Pa Daet",
        "Traditional weaving",
        "Village homestays",
        "Route to Doi Inthanon"
      ],
      "bestTime": "November to February, the cool dry season; like Chiang Mai province generally, avoid March-April for burning-season haze.",
      "bestM": [11, 12, 1, 2], "avoidM": [3, 4]
    },
    "th-khao-sok": {
      "name": "Khao Sok",
      "blurb": "Khao Sok National Park, established in 1980 in Surat Thani province, protects one of Thailand's oldest surviving stretches of rainforest alongside limestone karst peaks. Its centerpiece is Cheow Lan Lake, a reservoir where limestone islands rise from the water and floating raft-house bungalows let visitors stay overnight on the lake. The park is also home to wild elephants, gibbons, hornbills, and other wildlife, with a village near the park entrance offering jungle guesthouses and lodges for those exploring on land.",
      "knownFor": [
        "Cheow Lan Lake",
        "Floating raft-house bungalows",
        "Limestone karst",
        "Rainforest wildlife (elephants, gibbons, hornbills)",
        "Jungle trekking",
        "Jungle guesthouses and lodges"
      ],
      "bestTime": "December to April, the region's dry season, when trails and lake access are easiest; rainfall picks up from May.",
      "bestM": [12, 1, 2, 3, 4], "avoidM": []
    },
    "th-khao-yai": {
      "name": "Khao Yai",
      "blurb": "Khao Yai National Park, established in 1962, was Thailand's first national park and remains one of its most visited, covering forested hills and grassland northeast of Bangkok. It forms part of the Dong Phayayen-Khao Yai Forest Complex, a UNESCO World Heritage Site since 2005, and supports wild elephants, gibbons, hornbills, and other wildlife alongside waterfalls and hiking trails; dry, hot conditions in the pre-monsoon months can concentrate animals around waterholes. Within a few hours of Bangkok, it is a popular weekend trip, including camping at the park's own campsites at Pha Kluai Mai and Lam Takhong.",
      "knownFor": [
        "Wild elephants and gibbons",
        "Haew Suwat and Haew Narok waterfalls",
        "Hornbills",
        "Pha Kluai Mai and Lam Takhong campsites",
        "Hiking trails",
        "Dong Phayayen-Khao Yai UNESCO forest complex"
      ],
      "bestTime": "November to February, for cool weather and the most comfortable hiking conditions.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "th-trat": {
      "name": "Trat",
      "blurb": "Trat is a small provincial capital in far eastern Thailand, briefly occupied by France from 1904 to 1907 as leverage in a border dispute before being returned to Siam under the Franco-Siamese treaty of 1907, an event still marked by the town's Independence Day celebrations each March. Its old shophouse streets and markets see relatively few visitors, since most travellers pass straight through en route to the ferry piers at Laem Ngop and Laem Sok for the offshore islands of Koh Chang, Koh Mak, and Koh Kood, or onward to the Cambodian border crossing at Hat Lek.",
      "knownFor": [
        "Gateway to Koh Chang, Koh Mak and Koh Kood",
        "Old shophouse streets",
        "Hat Lek border crossing to Cambodia",
        "Wat Buppharam",
        "Local markets"
      ],
      "bestTime": "November to April, when seas are calmest and ferries to the outer islands run full schedules; sailings to Koh Mak and Koh Kood thin out considerably from May to October.",
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
    "vi-an-giang": {
      "name": "An Giang",
      "blurb": "A Mekong Delta province on the Cambodian border, An Giang is best known to travellers for Tra Su Cajuput Forest, a flooded melaleuca wetland where small boats glide beneath a green canopy past nesting-bird colonies, alongside Cham and Khmer communities and the sacred Sam Mountain pilgrimage site near Chau Doc.",
      "knownFor": [
        "Tra Su Cajuput Forest",
        "Mekong Delta flooded wetlands",
        "Chau Doc and Sam Mountain",
        "Cham and Khmer communities"
      ],
      "bestTime": "September to November, during the Mekong Delta flood season, when water levels rise, duckweed carpets the canals and bird numbers peak.",
      "bestM": [9, 10, 11], "avoidM": []
    },
    "vi-lang-co": {
      "name": "Lang Co",
      "blurb": "A fishing village and lagoon on Vietnam's central coast, between Hue and Da Nang at the foot of the Hai Van Pass, Lang Co is known for a long white-sand beach backed by a calm lagoon and green hills, and as a scenic rest stop on one of Vietnam's most dramatic stretches of coastal road and railway.",
      "knownFor": [
        "Lang Co Beach",
        "Lang Co Lagoon",
        "Hai Van Pass",
        "coastal railway views"
      ],
      "bestTime": "February to May, the same dry window as nearby Da Nang.",
      "bestM": [2, 3, 4, 5], "avoidM": []
    },
    "vi-cao-bang": {
      "name": "Cao Bang",
      "blurb": "A mountainous province on the Chinese border in Vietnam's far north, Cao Bang is best known for Ban Gioc, Vietnam's largest and most famous waterfall, which straddles the border with China (known there as Detian Falls) amid limestone karst scenery.",
      "knownFor": [
        "Ban Gioc Waterfall",
        "karst mountain scenery",
        "China border region",
        "Nguom Ngao Cave"
      ],
      "bestTime": "September and October, when the water is highest but starting to clear after the wet season; March is a quieter alternative with clearer, if lower, water.",
      "bestM": [9, 10, 3], "avoidM": []
    },
    "vi-thanh-hoa": {
      "name": "Thanh Hoa",
      "blurb": "A large coastal and mountainous province south of Hanoi, Thanh Hoa is best known to travellers for Pu Luong Nature Reserve, a valley of terraced rice fields, limestone hills and Thai ethnic-minority stilt-house villages, popular for trekking and homestays.",
      "knownFor": [
        "Pu Luong Nature Reserve",
        "rice terraces",
        "Thai stilt-house villages",
        "trekking and homestays"
      ],
      "bestTime": "May to June for vivid green young rice, or September to October for the golden harvest — Pu Luong's two rice-terrace seasons.",
      "bestM": [5, 6, 9, 10], "avoidM": []
    },
    "vi-hoa-binh": {
      "name": "Hoa Binh",
      "blurb": "A provincial capital on the Da (Black) River southwest of Hanoi, Hoa Binh is best known for its dam — from 1994 to 2012 the largest hydroelectric power plant in Vietnam, built with Soviet assistance between 1979 and 1994 and still one of the largest in Southeast Asia. It is also the usual gateway by road into the province's Mai Chau Valley.",
      "knownFor": [
        "Hoa Binh Dam",
        "Da (Black) River",
        "Muong ethnic-minority culture",
        "gateway to Mai Chau"
      ],
      "bestTime": "October to April, cooler and drier, the same window as Hanoi.",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-ba-ria-vung-tau": {
      "name": "Ba Ria-Vung Tau",
      "blurb": "The southeastern coastal province that administers both the mainland beach city of Vung Tau and, far offshore, the Con Dao archipelago. Con Dao is reached by direct flight from Ho Chi Minh City or by a slower ferry that also runs from Vung Tau itself.",
      "knownFor": [
        "Con Dao Islands (administered from here)",
        "Vung Tau city",
        "Mekong Delta shipping lanes"
      ]
    },
    "vi-lao-cai": {
      "name": "Lao Cai",
      "blurb": "A provincial capital on the Chinese border at the terminus of the Hanoi-Lao Cai railway, Lao Cai city itself is mainly a transit gateway to Sapa. The wider province's best-known traveller draw is Bac Ha, whose Sunday market is one of the largest and most colourful ethnic-minority markets in the northwest, filled with Flower Hmong traders.",
      "knownFor": [
        "gateway to Sapa",
        "Bac Ha Sunday Market",
        "China border crossing",
        "Flower Hmong communities"
      ]
    },
    "vi-mai-chau": {
      "name": "Mai Chau",
      "blurb": "A valley in Hoa Binh province southwest of Hanoi, Mai Chau is known for White Thai and Black Thai stilt-house villages set among rice paddies, a popular one- or two-night homestay trip from Hanoi for cycling and gentle valley walks.",
      "knownFor": [
        "stilt-house homestays",
        "rice-paddy valley",
        "White Thai and Black Thai culture",
        "cycling"
      ],
      "bestTime": "October to April, cooler and drier, the same window as Hanoi.",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-duy-phu": {
      "name": "Duy Phu (My Son)",
      "blurb": "A rural district in Quang Nam province inland from Hoi An, Duy Phu is home to My Son Sanctuary, a cluster of Hindu temple towers built by the Champa kingdom from roughly the 4th to the 14th centuries and now a UNESCO World Heritage Site.",
      "knownFor": [
        "My Son Sanctuary",
        "Champa kingdom ruins",
        "Hindu temple towers",
        "UNESCO heritage"
      ],
      "bestTime": "February to May, dry season; like nearby Hoi An and Da Nang, the area is prone to flooding October-November.",
      "bestM": [2, 3, 4, 5], "avoidM": [10, 11]
    },
    "vi-phan-thiet": {
      "name": "Phan Thiet",
      "blurb": "A fishing city on Vietnam's south-central coast, Phan Thiet is the gateway to Mui Ne, a beach town famous for red and white sand dunes and among Southeast Asia's best kitesurfing and windsurfing conditions.",
      "knownFor": [
        "Mui Ne Beach",
        "sand dunes",
        "kitesurfing and windsurfing",
        "fishing harbour"
      ],
      "bestTime": "November to April, dry and sunny, and the best wind for kitesurfing, strongest from December to February.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "vi-vung-tau": {
      "name": "Vung Tau",
      "blurb": "A beach city on a peninsula southeast of Ho Chi Minh City, Vung Tau has been a seaside getaway since the French colonial era and remains a popular weekend escape from Saigon. It is known for the Christ of Vung Tau, a 32-metre statue on Tao Phung Mountain completed in 1994 and reached by around 800 steps, and for Back Beach (Bai Sau), its main stretch of sand.",
      "knownFor": [
        "Christ of Vung Tau statue",
        "Back Beach (Bai Sau)",
        "seafood",
        "weekend trip from Ho Chi Minh City"
      ],
      "bestTime": "December to April, the dry season; expect heat and humidity year-round, as in nearby Ho Chi Minh City.",
      "bestM": [12, 1, 2, 3, 4], "avoidM": []
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
    "kh-koh-kong": {
      "name": "Koh Kong",
      "blurb": "A riverside border town in Cambodia's remote southwest, Koh Kong sits near the Thai crossing at Cham Yeam and serves as the main gateway to the Cardamom Mountains: community-based ecotourism at Chi Phat, kayaking and waterfalls on the Tatai River, and the mangrove boardwalks of Peam Krasop Wildlife Sanctuary.",
      "knownFor": [
        "gateway to the Cardamom Mountains",
        "Tatai River",
        "Peam Krasop mangroves",
        "Thailand border crossing"
      ],
      "bestTime": "November to April, the dry season, for easier travel on the Cardamoms' unpaved roads.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-cardamom-mountains": {
      "name": "Cardamom Mountains",
      "blurb": "A vast, sparsely populated range of rainforest in southwestern Cambodia, the Cardamom Mountains are one of Southeast Asia's largest remaining wilderness areas. Community-based ecotourism, centred on villages such as Chi Phat, lets visitors trek and boat through the forest while directly supporting local conservation.",
      "knownFor": [
        "community-based ecotourism",
        "rainforest wildlife",
        "Chi Phat village",
        "trekking and river trips"
      ],
      "bestTime": "November to April, the dry season, when forest trails are easier going.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-koh-rong-sanloem": {
      "name": "Koh Rong Sanloem",
      "blurb": "The quieter of the two main islands off Sihanoukville, Koh Rong Sanloem is smaller and less developed than Koh Rong, known for calmer beaches such as Lazy Beach and Saracen Bay, snorkelling, and a slower pace geared toward relaxation over nightlife.",
      "knownFor": [
        "Lazy Beach",
        "Saracen Bay",
        "snorkelling",
        "quieter than Koh Rong"
      ],
      "bestTime": "November to April, the dry season, for calm seas and clear water.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-preah-vihear": {
      "name": "Preah Vihear",
      "blurb": "A remote northern province on the Thai border, Preah Vihear is named for the clifftop Khmer temple of the same name, dramatically sited atop the Dangrek escarpment and a UNESCO World Heritage Site. The province is also home to Koh Ker, a 10th-century former capital of the Khmer Empire, and Preah Khan of Kompong Svay, one of Angkor's largest temple enclosures.",
      "knownFor": [
        "Preah Vihear Temple",
        "Koh Ker temple complex",
        "Preah Khan of Kompong Svay",
        "Dangrek Mountains"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-kampong-cham": {
      "name": "Kampong Cham",
      "blurb": "A Mekong riverside city northeast of Phnom Penh, Kampong Cham is known for the Khmer-era temple of Wat Nokor, which encloses a working Buddhist pagoda within its sandstone ruins, and for the Koh Paen bamboo bridge, rebuilt by hand each December once the river drops low enough, and taken down again before the rains raise the water in the middle of the year.",
      "knownFor": [
        "Koh Paen Bamboo Bridge",
        "Wat Nokor Bachey",
        "Mekong riverside",
        "rebuilt annually each dry season"
      ],
      "bestTime": "December to April, when the Koh Paen bamboo bridge is standing.",
      "bestM": [12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-koh-sdach": {
      "name": "Koh Sdach",
      "blurb": "Koh Sdach (\"King Island\") is a small fishing island off Cambodia's southwest coast, between the mainland and Koh Kong, with a working fishing-village harbour rather than a resort scene. It is a stepping-stone for boat trips to quieter nearby islands such as Koh Totang.",
      "knownFor": [
        "fishing village",
        "boat hub to nearby islands",
        "Koh Totang",
        "off-the-beaten-path"
      ],
      "bestTime": "November to April, the dry season, for calmer boat crossings.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-takeo": {
      "name": "Takeo",
      "blurb": "A province south of Phnom Penh toward the Vietnamese border, Takeo is best known to travellers for the Phnom Tamao Wildlife Rescue Centre, Cambodia's largest wildlife rescue and rehabilitation facility, home to rescued elephants, tigers, bears and other animals confiscated from illegal trade.",
      "knownFor": [
        "Phnom Tamao Wildlife Rescue Centre",
        "rescued elephants and bears",
        "Mekong Delta scenery"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-kampong-thom": {
      "name": "Kampong Thom",
      "blurb": "A provincial capital midway between Phnom Penh and Siem Reap, Kampong Thom is the gateway to Sambor Prei Kuk, a group of brick temple towers dating mostly from the early 7th century under the pre-Angkorian Chenla kingdom, among the oldest surviving temple architecture in Cambodia and a UNESCO World Heritage Site.",
      "knownFor": [
        "Sambor Prei Kuk Temple Group",
        "pre-Angkorian Chenla ruins",
        "UNESCO heritage",
        "roadside stop between Phnom Penh and Siem Reap"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-skun": {
      "name": "Skun",
      "blurb": "A small roadside town on National Road 6 between Phnom Penh and Kampong Cham, Skun is known nationwide as \"Spider Town\" for its market stalls selling deep-fried tarantulas, a local delicacy and a popular photo stop for travellers passing through.",
      "knownFor": [
        "fried tarantula market",
        "roadside stop",
        "National Road 6"
      ]
    },
    "kh-oudong": {
      "name": "Oudong",
      "blurb": "Oudong served as the royal capital of Cambodia for roughly two centuries, from 1618 until Phnom Penh took over in 1866. Its hilltop is crowned by a row of royal stupas, including those of several former kings, making Phnom Oudong a popular day trip and pilgrimage site from Phnom Penh.",
      "knownFor": [
        "Phnom Oudong royal stupas",
        "former royal capital",
        "day trip from Phnom Penh",
        "pilgrimage site"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-angkor-borei": {
      "name": "Angkor Borei",
      "blurb": "A small town in Takeo province near the Vietnamese border, Angkor Borei is one of Cambodia's oldest urban sites, linked to the pre-Angkorian kingdom of Funan from around the 1st to 6th centuries CE. Nearby Phnom Da holds an early Khmer hilltop temple with river-plain views over the surrounding countryside.",
      "knownFor": [
        "Funan-era archaeology",
        "Phnom Da temple",
        "one of Cambodia's oldest settlements",
        "Mekong Delta borderlands"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-tonle-bati": {
      "name": "Tonle Bati",
      "blurb": "Tonle Bati is a small lake in Takeo province about 30 kilometres south of Phnom Penh, a popular weekend and day-trip spot for locals, with bamboo pavilions built out over the water for picnicking. On its bank stand two temples built under Jayavarman VII in the late 12th century, the same era as Angkor Thom and the Bayon: Ta Prohm, with well-preserved carvings in its inner sanctuary, and the smaller Yeay Peau.",
      "knownFor": [
        "Ta Prohm temple (Tonle Bati)",
        "Yeay Peau temple",
        "lakeside picnic pavilions",
        "day trip from Phnom Penh",
        "12th-century Khmer carvings"
      ],
      "bestTime": "November to February for cooler, drier weather, best for a day trip from Phnom Penh.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-kampong-speu": {
      "name": "Kampong Speu",
      "blurb": "Kampong Speu is a provincial capital west of Phnom Penh, known chiefly as the gateway to Kirirom National Park, a pine-forested plateau in the eastern Cardamom Mountains that became Cambodia's first designated national park in 1993. King Norodom Sihanouk developed Kirirom as a royal hill-station retreat in the 1950s and 60s; its villas fell into ruin during the civil war and Khmer Rouge period, and the area was cleared of landmines and reopened to visitors in the 1990s. The province is also home to Phnom Aural, Cambodia's highest peak, and is well known nationally for its palm sugar.",
      "knownFor": [
        "Kirirom National Park",
        "former royal hill station",
        "Phnom Aural, Cambodia's highest peak",
        "palm sugar"
      ],
      "bestTime": "November to February, the cool dry season, for the most comfortable hiking conditions at Kirirom.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-kampong-chhnang": {
      "name": "Kampong Chhnang",
      "blurb": "Kampong Chhnang is a provincial capital on the Tonle Sap River north of Phnom Penh, best known for the nearby pottery village of Andong Russey, where around 300 artisan families continue a hand-thrown pottery tradition whose kilns have been dated back some 1,500 years. The town is also a base for visiting Tonle Sap floating villages, home mainly to ethnic Vietnamese communities, and for the abandoned Kampong Chhnang Airport, a vast unfinished military airfield built by the Khmer Rouge between 1976 and 1979 using forced labour, at great cost of life, with Chinese technical support.",
      "knownFor": [
        "Andong Russey pottery village",
        "Tonle Sap floating villages",
        "abandoned Khmer Rouge airfield",
        "provincial riverside town"
      ],
      "bestTime": "November to February for cooler, drier weather.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-preah-rumkel": {
      "name": "Preah Rumkel (Stung Treng)",
      "blurb": "Preah Rumkel is a small Mekong-side village in Stung Treng province, close to the Laos border, built around a community-based ecotourism project that arranges homestays with local Khmer and Lao families. It is the access point for Sopheakmit Waterfall, where the Mekong drops around 26 metres over a wide, multi-channel stretch of rapids, and for birdwatching and kayaking in the surrounding Ramsar-listed wetlands and flooded forest. The Irrawaddy dolphins once advertised here, at the nearby Anlong Cheuteal pool shared with Laos, are no longer a reliable sighting: the last dolphin in that transboundary pool was found dead in February 2022, and the subpopulation is now considered extinct.",
      "knownFor": [
        "Sopheakmit Waterfall (Mekong rapids)",
        "community-based ecotourism",
        "Ramsar wetlands and flooded forest",
        "village near the Laos border"
      ],
      "bestTime": "November to April, the dry season, when falling river levels expose Sopheakmit's rocks and flooded forest; conditions are often described as best in December, before the water drops further.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-stung-treng": {
      "name": "Stung Treng",
      "blurb": "Stung Treng is the capital of its namesake province in Cambodia's northeast, sitting close to where the Sekong and Sesan rivers join the Mekong, about 50 kilometres south of the Laos border. It functions mainly as a quiet regional hub and a common stop for travellers crossing overland between Laos and Cambodia, as well as the starting point for boat trips upriver toward Preah Rumkel and the border wetlands. The town is also home to Mekong Blue, a fair-trade silk-weaving social enterprise run by the Stung Treng Women's Development Center that trains and employs local women in traditional Khmer weaving.",
      "knownFor": [
        "Mekong Blue silk weaving",
        "confluence of the Sekong, Sesan and Mekong rivers",
        "gateway to the Laos border",
        "quiet river-trade hub"
      ],
      "bestTime": "November to April, the dry season, best for river travel toward the Laos border.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-voen-sai": {
      "name": "Voen Sai (Ratanakiri)",
      "blurb": "Voen Sai is a river town on the Tonle San (Sesan) River in Ratanakiri province, in Cambodia's northeastern highlands. Its north bank holds a Chinese settlement roughly two centuries old, alongside Lao and indigenous Kreung and Tampuan villages, reflecting the ethnic mix typical of the region. Boat trips upriver reach Kachon, a Tampuan village with a traditional forest cemetery where the dead are honoured with carved wooden effigies, and a ranger post in Voen Sai can arrange guided treks toward Virachey National Park.",
      "knownFor": [
        "Sesan River villages",
        "historic Chinese settlement",
        "Lao and Kreung/Tampuan communities",
        "Kachon's Tampuan cemetery",
        "access to Virachey National Park"
      ],
      "bestTime": "November to February, before rural roads and river access become difficult in the wet season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-sambor": {
      "name": "Sambor (Kratie)",
      "blurb": "Sambor is a small Mekong-side town in Kratie province, roughly 38 kilometres north of Kratie town, on the site of Sambhupura, a polity linked to early Chenla-period rulers such as Bhavavarman I in the 6th and 7th centuries before it faded from prominence by around the 9th century. Its main landmark today is Wat Sasar Muoy Roy, the \"100-Column Pagoda,\" an unusually north-south-facing temple that was destroyed during the Khmer Rouge period and rebuilt in 1997. The town lies within the same Mekong stretch, between Kratie and the Laos border, that holds Cambodia's recovering population of Irrawaddy dolphins, though the main viewing site, Kampi, is closer to Kratie town itself.",
      "knownFor": [
        "Wat Sasar Muoy Roy (100-Column Pagoda)",
        "Sambhupura, a pre-Angkorian capital",
        "Mekong riverside",
        "within Cambodia's dolphin habitat zone"
      ],
      "bestTime": "November to April, the dry season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-anlong-veng": {
      "name": "Anlong Veng",
      "blurb": "Anlong Veng, in Oddar Meanchey province near the Thai border, was the Khmer Rouge's last stronghold, held by forces under commander Ta Mok until the remaining units surrendered in December 1998. Pol Pot died in custody nearby in April 1998; his cremation site close to his former home can still be visited today, along with Ta Mok's own lakeside house at the foot of the Dangrek escarpment. The town has since been developed for memorial and heritage tourism, and serves as a stop on the road between Siem Reap and the temple of Preah Vihear.",
      "knownFor": [
        "Ta Mok's House",
        "Pol Pot's cremation site",
        "Khmer Rouge's last stronghold",
        "Dangrek Mountains",
        "route to Preah Vihear temple"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "kh-botum-sakor": {
      "name": "Botum Sakor",
      "blurb": "Botum Sakor National Park, on a peninsula in Koh Kong province facing the Gulf of Thailand, is Cambodia's largest national park at over 1,800 square kilometres, combining rainforest, mangroves, and wetlands that shelter Asian elephants, clouded leopards, and hundreds of bird species. Established in 1993, much of the park has since been affected by a large tourism concession granted in 2008, which has cleared substantial areas of forest and mangrove for development. Remaining wilderness is reached by road or boat, with boat trips offering access to flooded forest, mangroves, and more remote stretches of coastline.",
      "knownFor": [
        "Cambodia's largest national park",
        "rainforest, mangroves and wetlands",
        "Asian elephants and clouded leopards",
        "boat access to remote coastline"
      ],
      "bestTime": "November to April, the dry season, for easier travel on the park's unpaved roads.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "kh-kampong-trach": {
      "name": "Kampong Trach",
      "blurb": "Kampong Trach is a small town in Kampot province near the Vietnamese border, built around Phnom Kampong Trach, a limestone karst outcrop honeycombed with more than 100 caves. Wat Kiri Sela, the temple at its base, leads through an underground passage into an open-air, cliff-walled hollow housing a large reclining Buddha and smaller shrines regarded as sacred by local Buddhists.",
      "knownFor": [
        "Wat Kiri Sela",
        "Phnom Kampong Trach caves",
        "limestone karst caverns",
        "reclining Buddha shrine"
      ],
      "bestTime": "November to April, the dry season.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
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
    "la-paksong": {
      "name": "Paksong",
      "blurb": "Paksong is a small market town on the Bolaven Plateau in Champasak province, sitting at around 1,300 metres elevation and serving as the unofficial capital of Laos's coffee-growing highlands. Volcanic soil and a cooler, damper climate than the lowlands support extensive Arabica and Robusta plantations sold along the roadside and in local cafes. The plateau's rivers also drop over a dense cluster of waterfalls nearby, led by the twin, roughly 120-metre cascade of Tad Fane, and the town is the usual base for riding the multi-day Bolaven Loop past them.",
      "knownFor": [
        "Bolaven Plateau coffee",
        "Tad Fane Waterfall",
        "Tad Yuang Waterfall",
        "cool highland climate",
        "Bolaven Loop motorbike route",
        "highland guesthouses"
      ],
      "bestTime": "November to February for the coolest, driest weather on the plateau, though at around 1,300 metres nights can turn cold and misty; the waterfalls carry the most water during and just after the rainy season, roughly May to October.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-kiet-ngong": {
      "name": "Kiet Ngong",
      "blurb": "Kiet Ngong is a small village on the edge of the Xe Pian National Protected Area in Champasak province, built around the Beung Kiat Ngong wetland, a Ramsar-designated marsh (since 2010) that is an important habitat for waterbirds and freshwater turtles. The village keeps a herd of domesticated elephants used for treks out to Phou Asa, a hilltop ruin of roughly 100 stone pillars whose age and original purpose are disputed among historians. Trails around the wetland also make for gentle dry-season birdwatching walks.",
      "knownFor": [
        "Beung Kiat Ngong Wetland",
        "Phou Asa ruins",
        "elephant trekking",
        "Xe Pian National Protected Area",
        "birdwatching"
      ],
      "bestTime": "October to April, the wetland's dry season, when trails are firm underfoot for wetland walks and elephant treks out to Phou Asa.",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-sekong": {
      "name": "Sekong",
      "blurb": "Sekong is a provincial capital on the Xe Kong river in the far south of Laos, established in 1984 after unexploded ordnance left from the Second Indochina War made the previous provincial seat uninhabitable. Sekong province is among the least-explored in the country, and the town today serves mainly as a base for reaching Tad Faek and Tad Hua Khon, two waterfalls in the surrounding forest.",
      "knownFor": [
        "Tad Faek Waterfall",
        "Tad Hua Khon Waterfall",
        "Xe Kong riverfront",
        "remote, little-visited province",
        "multi-ethnic communities"
      ],
      "bestTime": "November to February, the cool dry season, when roads out to the surrounding waterfalls are easiest to travel.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-salavan": {
      "name": "Salavan",
      "blurb": "Salavan is a quiet provincial capital in southern Laos with a frontier feel, surrounded by forest and indigenous villages rather than other towns. Its main draw is the morning market, where women from outlying communities sell foraged goods such as mushrooms, bamboo shoots, and wild produce; the waterfall village of Tad Lo lies about 30 km away.",
      "knownFor": [
        "provincial market",
        "frontier-town atmosphere",
        "indigenous villages",
        "gateway to Tad Lo"
      ],
      "bestTime": "November to February, for the coolest and driest travelling weather.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-huay-xai": {
      "name": "Huay Xai",
      "blurb": "Huay Xai is the capital of Bokeo province, sitting on the Mekong across from Chiang Khong, Thailand, and linked to it by the Fourth Thai-Lao Friendship Bridge. For most travellers it functions as a gateway rather than a destination in itself: the starting point for the two-day slow boat down the Mekong to Luang Prabang, and the base for the Gibbon Experience, a treehouse-and-zipline operation in the Bokeo Nature Reserve built around protecting the endangered black-crested gibbon.",
      "knownFor": [
        "Gibbon Experience zipline trek",
        "Bokeo Nature Reserve",
        "Mekong slow boat to Luang Prabang",
        "Thai border crossing",
        "Mekong riverfront"
      ],
      "bestTime": "November to April is the dry season recommended for the Gibbon Experience's jungle trails, before they turn muddy with the rains; the Mekong slow boat runs year-round.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-don-det": {
      "name": "Don Det",
      "blurb": "Don Det is the busiest of the inhabited islands in Si Phan Don, long established as the backpacker hub of the Four Thousand Islands. It has the densest cluster of cheap guesthouses, riverside bars, and hammock-strung porches facing the sunset, with an economy built on tourism rather than the rice and fishing of neighbouring islands. Visitors cycle its roughly 7-km loop road, kayak the surrounding channels, and cross an old French colonial railway bridge to the quieter island of Don Khon.",
      "knownFor": [
        "riverside bungalows",
        "backpacker bars",
        "hammock lounging",
        "cycling the island loop",
        "kayaking",
        "French railway bridge to Don Khon"
      ],
      "bestTime": "November to February, the cool dry season, for comfortable days cycling and relaxing along the river.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-attapeu": {
      "name": "Attapeu",
      "blurb": "Attapeu, officially Muang Samakhi Xay, is the southernmost of Laos's provincial capitals, built on a bend of the Xe Kong river, with a history said to reach back to the 16th-century Lan Xang kingdom. It is a quiet riverfront administrative town, used mainly as the gateway to Nong Fa, a volcanic crater lake roughly 70 km away that requires a 4WD drive and a two-to-three-hour trek to reach.",
      "knownFor": [
        "Nong Fa Crater Lake",
        "Xe Kong riverfront",
        "remote southern gateway",
        "Ho Chi Minh Trail history"
      ],
      "bestTime": "November to April, the dry season when the rough road and trek out to Nong Fa Lake are passable; heavy rain across the province from May to October makes the route much harder.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-vieng-xai": {
      "name": "Vieng Xai",
      "blurb": "Vieng Xai is a small town in Houaphanh province built into a valley of limestone karst that sheltered the Pathet Lao leadership throughout the Second Indochina War. Some 480 caves here were fitted out as a self-contained underground city, complete with a hospital, school, workshops, and a theatre, housing an estimated 23,000 people at the war's height and serving as the movement's headquarters until it took power in 1975. A number of the caves, including one used by longtime leader Kaysone Phomvihane, are now open on guided tours.",
      "knownFor": [
        "Pathet Lao wartime caves",
        "Kaysone Phomvihane's cave",
        "cave city museum tours",
        "limestone karst scenery",
        "Second Indochina War history"
      ],
      "bestTime": "November to February, when the cool dry season keeps the walks between caves comfortable.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-phongsali": {
      "name": "Phongsali",
      "blurb": "Phongsali is the capital of Laos's northernmost province and, at around 1,400 metres, the highest town in the country, built just below the Phou Fa viewpoint that overlooks it. The wider province is home to numerous ethnic groups, including the Akha and Phunoy, and to tea plantations at some of the highest elevations in Southeast Asia, with trees said to be around 400 years old.",
      "knownFor": [
        "Phou Fa viewpoint",
        "highest town in Laos",
        "ancient tea trees",
        "ethnic diversity",
        "remote northern frontier"
      ],
      "bestTime": "November to February, though as Laos's highest town, nights here can turn especially cold.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-oudomxai": {
      "name": "Oudomxai (Muang Xai)",
      "blurb": "Oudomxai, or Muang Xai, is the largest town in northern Laos and a crossroads on routes linking China, Vietnam, and the rest of the country, with a visibly Chinese-influenced market street. Around town, Phou Sebey hill offers a morning viewpoint over the rooftops near the rebuilt 14th-century Phu That stupa, while the main draw further out is Chom Ong, a cave system of more than 16 km that ranks as the longest in northern Laos.",
      "knownFor": [
        "Chom Ong Cave",
        "northern transport hub",
        "Phou Sebey viewpoint",
        "Phu That Stupa",
        "multi-ethnic markets"
      ],
      "bestTime": "November to April, the dry season when the dirt road out to Chom Ong Cave is passable by motorbike or car; it turns muddy once the rains begin in May.",
      "bestM": [11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-muang-sing": {
      "name": "Muang Sing",
      "blurb": "Muang Sing is a small district town in Luang Namtha province, close to the border with China, where the French once ran a weigh station for the regional opium trade. Today it is a centre for Akha, Tai Lue, and other hill-tribe communities, most visible at its early-morning market, and it serves as a trekking base for the Nam Ha National Protected Area.",
      "knownFor": [
        "Muang Sing Morning Market",
        "Akha and Tai Lue hill-tribe communities",
        "former opium-trade post",
        "Nam Ha NPA trekking"
      ],
      "bestTime": "October to April, during the region's drier season.",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-sainyabuli": {
      "name": "Sainyabuli (Xayaboury)",
      "blurb": "Sainyabuli is the capital of the only Lao province lying entirely west of the Mekong, a mountainous, forested area bordering Thailand. Its main draw is the Elephant Conservation Center on the Nam Tien reservoir, home to the country's only elephant hospital, and the province hosts an annual Elephant Festival each February.",
      "knownFor": [
        "Elephant Conservation Center",
        "Elephant Festival (February)",
        "only Lao province west of the Mekong",
        "Nam Phouy protected area"
      ],
      "bestTime": "November to February, the cool dry season; the province's Elephant Festival is usually held in February.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-pak-beng": {
      "name": "Pak Beng",
      "blurb": "Pak Beng is a small Mekong-side town in Oudomxay province that exists mainly as the overnight stop on the two-day slow-boat route between Huay Xai and Luang Prabang. Guesthouses line the single street above the boat landing, and the hillside Wat Sin Jong Jaeng, a temple dating to the French colonial era, is a short walk up from the river for sunset.",
      "knownFor": [
        "Mekong slow-boat overnight stop",
        "Wat Sin Jong Jaeng",
        "Mekong sunset views",
        "Huay Xai-Luang Prabang route"
      ],
      "bestTime": "November to February for the most comfortable weather, though the slow-boat schedule runs the same year-round.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-muang-ngoi": {
      "name": "Muang Ngoi",
      "blurb": "Muang Ngoi (Muang Ngoi Neua) is a small, car-free village on the Nam Ou River in Luang Prabang province, hemmed in by karst peaks, that had no road access at all until a rough track arrived around 2013 — most visitors still arrive by boat from Nong Khiaw. Travellers come to climb to the Phanoi viewpoint above the village and visit nearby caves that sheltered residents during wartime bombing.",
      "knownFor": [
        "car-free village",
        "Phanoi Viewpoint",
        "Nam Ou River",
        "karst scenery",
        "boat access only"
      ],
      "bestTime": "October to April, during the dry season.",
      "bestM": [10, 11, 12, 1, 2, 3, 4], "avoidM": []
    },
    "la-muang-khoun": {
      "name": "Muang Khoun",
      "blurb": "Muang Khoun, or Old Xieng Khuang, was the capital of the Phuan kingdom and later the French provincial capital, until American bombing during the Second Indochina War destroyed most of the town and the provincial seat moved to Phonsavan. What survives — the roofless Wat Phia Wat, its brick Buddha image open to the sky, and the ruined That Foun stupa — sits about 35 km southeast of Phonsavan and is usually visited on the same loop as the Plain of Jars.",
      "knownFor": [
        "Old Xieng Khuang",
        "Wat Phia Wat ruins",
        "That Foun stupa",
        "former Phuan kingdom capital",
        "war-damaged history"
      ],
      "bestTime": "November to February, though like nearby Phonsavan its highland nights can be cold.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-muang-kham": {
      "name": "Muang Kham",
      "blurb": "Muang Kham is a small district town in Xieng Khouang province on Route 7, east of Phonsavan toward the Vietnamese border. Nearby is Tham Piu, a cave where Lao villagers sheltering from wartime bombing were killed in a US airstrike on 24 November 1968 and which is now a national memorial, along with a set of hot springs a short drive further out.",
      "knownFor": [
        "Tham Piu Cave War Memorial",
        "Muang Kham hot springs",
        "Route 7 waypoint",
        "Xieng Khouang province"
      ],
      "bestTime": "November to February for cooler, drier travel.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-viengthong": {
      "name": "Viengthong (Muang Hiam)",
      "blurb": "Viengthong, formerly known as Muang Hiam, is a remote district town in Houaphanh province reached by a long mountain road, and serves as headquarters for the Nam Et-Phou Louey National Protected Area. Its main draw is the Nam Nern Night Safari, a community-run ecotour in which former hunters guide visitors upriver by boat before floating back after dark to spotlight wildlife.",
      "knownFor": [
        "Nam Nern Night Safari",
        "Nam Et-Phou Louey NPA headquarters",
        "community-run ecotourism",
        "remote mountain access"
      ],
      "bestTime": "November to March, the driest months for the park's river-based Night Safari.",
      "bestM": [11, 12, 1, 2, 3], "avoidM": []
    },
    "la-houameuang": {
      "name": "Houameuang (near Sam Neua)",
      "blurb": "Houameuang is a small, remote district of Houaphanh province, known mainly as the access point for the Hintang Archaeological Park, a scattering of roughly 1,500 upright stone menhirs and stone discs across dozens of sites on a forested ridge, first surveyed by French archaeologist Madeleine Colani in 1931. English-language information on the district itself, beyond this site, is limited.",
      "knownFor": [
        "Hintang Archaeological Park (Standing Stones)",
        "ancient megaliths",
        "remote access from Sam Neua"
      ],
      "bestTime": "November to March, the dry season, when the rough access road from Sam Neua is most passable.",
      "bestM": [11, 12, 1, 2, 3], "avoidM": []
    },
    "la-sam-neua": {
      "name": "Sam Neua",
      "blurb": "Sam Neua (Xam Neua) is the capital of Houaphanh province, a cool highland town that was a centre of Pathet Lao activity during the Laotian civil war. It is the usual base for visiting the nearby Vieng Xai caves, the movement's former underground wartime headquarters, and its own morning market is a major outlet for Tai Daeng and other locally handwoven textiles.",
      "knownFor": [
        "Sam Neua Morning Market",
        "gateway to Vieng Xai caves",
        "Houaphanh provincial capital",
        "handwoven textiles",
        "cool highland climate"
      ],
      "bestTime": "November to February, when Houaphanh's highland nights turn cold.",
      "bestM": [11, 12, 1, 2], "avoidM": []
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
    },
    "la-muang-sui": {
      "name": "Muang Sui",
      "blurb": "Muang Sui, also known as Nong Tang, is a small town on Route 7 in Xieng Khouang province, about 48 kilometres from Phonsavan. During the Laotian Civil War — the CIA's so-called \"Secret War\" — it was the site of Lima Site 108, a Royal Lao/CIA-backed airstrip fiercely contested by government and Pathet Lao forces; little physical evidence of the fighting remains today. Its main present-day draw is Nong Tang Lake, a scenic lake ringed by limestone cliffs used for picnicking and simple lakeside meals.",
      "knownFor": [
        "Nong Tang Lake",
        "limestone cliffs",
        "former Lima Site 108 airstrip",
        "Secret War history",
        "picnicking"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-boualapha": {
      "name": "Boualapha",
      "blurb": "Boualapha is a district town in Khammouane province, reached from Thakhek by a multi-hour drive on partly unpaved roads. It is the gateway to Xe Bang Fai Cave (Tham Khoun Xe), a several-kilometre river cave that boats can travel through, and to the surrounding Hin Nam No National Park, inscribed as Laos's fourth UNESCO World Heritage Site in 2025.",
      "knownFor": [
        "Xe Bang Fai Cave (Tham Khoun Xe)",
        "Hin Nam No National Park",
        "river-cave boat trips",
        "karst caving",
        "community-guided ecotourism"
      ],
      "bestTime": "Cave boat trips run from November to May; they are suspended from June to October, when the river floods and currents turn dangerous.",
      "bestM": [11, 12, 1, 2, 3, 4, 5], "avoidM": [6, 7, 8, 9, 10]
    },
    "la-pakkading": {
      "name": "Pakkading",
      "blurb": "Pakkading is a small town in Bolikhamxay province where the Nam Kading river meets the Mekong, and a district capital on Route 13. It is a well-known lunch stop for travellers and truckers, with a cluster of riverside fish restaurants, and the main gateway to the Nam Kading National Protected Area, a 1,690-square-kilometre forest reserve upriver that shelters saola, elephants, and several species of gibbon.",
      "knownFor": [
        "Nam Kading National Protected Area",
        "Route 13 waypoint",
        "riverside fish restaurants",
        "Nam Kading-Mekong confluence"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-nakai": {
      "name": "Nakai",
      "blurb": "Nakai is a district town on the Nakai Plateau in Khammouane province, beside the Nam Theun 2 Reservoir, a roughly 490-square-kilometre lake built for Laos's largest hydropower project, completed in 2010. Its creation required resettling about 6,300 people into new villages on the plateau, many of whom now depend on reservoir fishing for their livelihood.",
      "knownFor": [
        "Nam Theun 2 Reservoir",
        "Nakai Plateau",
        "Nakai-Nam Theun National Park",
        "hydropower",
        "resettled villages",
        "reservoir fishing"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-paksan": {
      "name": "Paksan",
      "blurb": "Paksan is the capital of Bolikhamxay province, on the Mekong at the mouth of the Nam Xan river, from which it takes its name (\"mouth of the Xan\"). The town predates the 1890s, when the Siamese withdrew from the Mekong's left bank and French missionaries occupied it and built a church there; it has since developed into a trade and transport hub on Route 13.",
      "knownFor": [
        "Mekong riverfront",
        "provincial capital",
        "Nam Xan river confluence",
        "Route 13 hub",
        "market town"
      ],
      "bestTime": "November to February, the cool dry season.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-thaphabat": {
      "name": "Thaphabat",
      "blurb": "Thaphabat is a district of Bolikhamxay province on Highway 13 South, about 83 kilometres from Vientiane. Its main landmark is Wat Phabat Phonsan, a temple local tradition traces back many centuries and that was rebuilt around a large Buddha footprint discovered in 1993; it was declared a national heritage site in 2024. The temple hosts the annual Boun Phabath Phonsan festival each January.",
      "knownFor": [
        "Wat Phabat Phonsan",
        "Buddha footprint relic",
        "Boun Phabath Phonsan festival",
        "national heritage temple"
      ],
      "bestTime": "Late January, around the Boun Phabath Phonsan festival (22–25 January).",
      "bestM": [1], "avoidM": []
    },
    "la-tad-lo": {
      "name": "Tad Lo",
      "blurb": "Tad Lo is a small village on the Bolaven Plateau in Salavan province, built around a cluster of waterfalls: Tad Hang, Tad Lo, and Tad Soung. It is a popular overnight stop on the Bolaven Plateau loop, with riverside guesthouses, homestays, and easy access to a nearby Katu ethnic-minority village; elephants kept by local operators are sometimes seen bathing in the river above the falls.",
      "knownFor": [
        "Tad Lo, Tad Hang and Tad Soung waterfalls",
        "Katu village",
        "riverside guesthouses",
        "elephant bathing",
        "Bolaven loop stop"
      ],
      "bestTime": "November to February for comfortable travel; the falls are fullest at the end of the wet season, around October.",
      "bestM": [11, 12, 1, 2, 10], "avoidM": []
    },
    "la-don-khon": {
      "name": "Don Khon",
      "blurb": "Don Khon is the quieter of the two main linked islands in Si Phan Don, joined to livelier Don Det by an old French railway bridge. Its village, Ban Khon, is the largest settlement in the area and keeps more colonial-era buildings than its neighbour, including a rusting locomotive left from the 7-kilometre Don Det-Don Khon portage railway and an old French cemetery. The island's western side has the Somphamit (Li Phi) rapids, and near Ban Hang Khon at its southern tip is Anlong Cheuteal, a deep Mekong pool long promoted for its Irrawaddy dolphins; conservation groups now consider the population on the Lao side functionally extinct, with the last known individual dying in 2022.",
      "knownFor": [
        "French railway relic",
        "Ban Khon colonial architecture",
        "Somphamit (Li Phi) Falls",
        "Anlong Cheuteal pool",
        "quieter than Don Det"
      ],
      "bestTime": "November to February, the same comfortable dry season as the rest of Si Phan Don.",
      "bestM": [11, 12, 1, 2], "avoidM": []
    },
    "la-nakasang": {
      "name": "Nakasang",
      "blurb": "Nakasang is a small mainland town in Champasak province on Route 13, serving as the main boat pier for reaching Don Det and Don Khon in Si Phan Don. Most travellers pass through only briefly, using its ATM, market, and bus connections to Pakse or the Cambodian border before or after crossing to the islands by longtail boat.",
      "knownFor": [
        "boat pier to Si Phan Don",
        "gateway to Don Det/Don Khon",
        "riverside market",
        "bus and border connections"
      ]
    }
  }
};
