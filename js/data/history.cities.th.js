// City-level history & orientation for Thailand — the `cities` half of js/data/history.js,
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
export const HISTORY_CITIES_TH = {
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
    }
};
