// City-level history & orientation for Cambodia — the `cities` half of js/data/history.js,
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
export const HISTORY_CITIES_KH = {
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
    }
};
