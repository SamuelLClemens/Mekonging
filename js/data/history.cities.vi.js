// City-level history & orientation for Vietnam — the `cities` half of js/data/history.js,
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
export const HISTORY_CITIES_VI = {
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
    }
};
