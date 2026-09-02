// City-level history & orientation for Laos — the `cities` half of js/data/history.js,
// split out per country so it is not parsed on every launch.
//
// WHY THIS FILE EXISTS. history.js was exempted from the lazy-data split in js/lazy-data.js
// for a good, measured reason: Home reads one city's entry through
// whereYouAreCard -> cityAboutCard -> cityHistory, and gating Home would add a blocking round
// trip to the one route that must be instant. That reasoning was recorded when the file was
// 50 KB. It is 122 KB now — 99 KB of it these city records — and the eager cost had grown 2.4x
// without the decision being revisited. Worse, whereYouAreCard only renders when the traveller
// is ON THE GROUND, so for anyone still planning (which inferPhase() reports until a trip has
// dates or GPS puts them in the region) all of it was parsed on every launch and never read.
//
// The split keeps the original justification intact rather than overriding it: these records
// now ride loadCountry(cc) in js/data/regions.js, alongside that country's places, food,
// prices and events. Home already kicks that load off in the background and repaints in place
// when it lands, so a city card fills in with the same repaint that already fills in the
// "right now" picks — no new gate, no blocking fetch, and only the country the traveller is
// actually in is ever parsed.
//
// Records are VERBATIM from history.js, formatting included, because
// scripts/check-month-arrays.py parses this shape to check every bestM/avoidM claim against
// the record's own bestTime prose. Keep the layout if you edit by hand.
export const HISTORY_CITIES_LA = {
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
};
