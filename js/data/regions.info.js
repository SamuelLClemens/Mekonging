// Authored, web-verified per-province write-ups shown on the region/province screen.
// Keyed by the ISO 3166-2 province code used in regions.<cc>.js (codes are unique across
// the four countries, so a single flat map is unambiguous).
//
// Shape mirrors the country HISTORY model (js/data/history.js):
//   { blurb, knownFor:[...], cultureTip?, sources:[...], verified? }
// - blurb:      2–3 sentence description of the province (English).
// - knownFor:   short tag chips (3–5).
// - cultureTip: optional single respectful-travel note (rendered with a 🙏 prefix).
// - sources:    free-text citations (organisation name and/or URL), rendered "Sources: …".
// - verified:   optional YYYY-MM freshness stamp (used where a UNESCO fact is cited).
//
// Content rule: describe only well-established, verifiable facts — never fabricate prices,
// hours or obscure claims. First batch = the marquee, most-visited provinces across all four
// countries. Further batches extend coverage toward all 184 provinces.
//
// Note on Vietnam: boundaries in regions.vi.js pre-date the 2025 provincial reorganisation,
// so these entries describe the enduring geography of each pre-reform province; the region
// screen already carries a standing note about the 2025 changes.

export const PROVINCE_INFO = {
  // ===================== THAILAND =====================
  'TH-10': {
    blurb: "Thailand's capital and largest city sprawls along the Chao Phraya River, pairing gilded royal temples with frenetic markets, canal neighbourhoods and one of Asia's great street-food scenes. It is the country's political, commercial and cultural heart, and the arrival point for most visitors.",
    knownFor: ['Grand Palace & Wat Phra Kaew', 'Wat Pho & Wat Arun', 'Chatuchak Weekend Market', 'Street food', 'Chao Phraya river life'],
    cultureTip: 'Dress modestly for temples — cover shoulders and knees — and never point your feet toward a Buddha image.',
    sources: ['Tourism Authority of Thailand (tourismthailand.org)', 'Encyclopædia Britannica — Bangkok'],
  },
  'TH-50': {
    blurb: 'The cultural capital of northern Thailand, Chiang Mai grew from the 13th-century Lanna kingdom and keeps a moated old town packed with historic temples. Cool hills, craft villages and Doi Suthep rise around it, making it the base for trekking and mountain trips.',
    knownFor: ['Old-city Lanna temples', 'Doi Suthep', 'Night bazaars', 'Trekking & hill villages', 'Sunday Walking Street'],
    cultureTip: 'Chiang Mai hosts the November Yi Peng lantern festival; a soft voice and a wai are the local currency of good manners.',
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Chiang Mai'],
  },
  'TH-83': {
    blurb: "Thailand's largest island and a province in its own right, Phuket lines the Andaman Sea with resort beaches, a Sino-Portuguese old town and a busy nightlife strip at Patong. It is the main gateway to the surrounding islands and the Andaman coast.",
    knownFor: ['Andaman beaches', 'Phuket Old Town', 'Big Buddha', 'Island-hopping (Phi Phi, Phang Nga Bay)', 'Patong nightlife'],
    cultureTip: 'Swim between the red-and-white flags — the Andaman surf brings dangerous rip currents in the May–October monsoon.',
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Phuket'],
  },
  'TH-81': {
    blurb: 'Krabi province fronts the Andaman Sea with towering limestone karsts, the rock-climbing beaches of Railay and the resort bay of Ao Nang. Its piers are the springboard for the Phi Phi and Hong islands and dozens more.',
    knownFor: ['Railay Beach & rock climbing', 'Ao Nang', 'Limestone karst scenery', 'Island-hopping', 'Emerald Pool & hot springs'],
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Krabi'],
  },
  'TH-84': {
    blurb: 'A large southern province on the Gulf of Thailand, Surat Thani is best known as the gateway to the islands of Koh Samui, Koh Phangan and Koh Tao. Inland, it adds the lakes and jungle limestone of Khao Sok National Park.',
    knownFor: ['Koh Samui', 'Koh Phangan (Full Moon Party)', 'Koh Tao diving', 'Khao Sok National Park', 'Gulf ferries'],
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Surat Thani'],
  },
  'TH-20': {
    blurb: 'On the upper Gulf coast an easy drive from Bangkok, Chon Buri is dominated by Pattaya, a high-energy beach resort city, alongside quieter family beaches and the islands off its shore. It is one of Thailand’s most-visited seaside provinces.',
    knownFor: ['Pattaya', 'Beaches & nightlife', 'Koh Larn', 'Sanctuary of Truth', 'Weekend escape from Bangkok'],
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Pattaya'],
  },
  'TH-14': {
    blurb: 'Ayutthaya was the second capital of the Siamese kingdom, founded in 1350 and a great cosmopolitan trading city until the Burmese sacked it in 1767. Its ruined prangs and monasteries form a UNESCO World Heritage historical park about an hour north of Bangkok.',
    knownFor: ['UNESCO Historic City', 'Wat Mahathat', 'Buddha head in tree roots', 'Day trip from Bangkok', 'Riverside ruins'],
    cultureTip: 'The Buddha head entwined in fig roots at Wat Mahathat is sacred — crouch low so your head is never above it for a photo.',
    sources: ['UNESCO World Heritage Centre (whc.unesco.org/en/list/576)', 'Tourism Authority of Thailand'],
    verified: '2026-07',
  },
  'TH-57': {
    blurb: "Thailand's northernmost province reaches to the Golden Triangle where the country meets Laos and Myanmar across the Mekong. Beyond the contemporary White Temple (Wat Rong Khun) lie tea hills, hill-tribe villages and cooler mountain air.",
    knownFor: ['White Temple (Wat Rong Khun)', 'Golden Triangle', 'Blue Temple', 'Hill-tribe villages', 'Mekong border scenery'],
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Chiang Rai'],
  },
  'TH-77': {
    blurb: "This long, narrow Gulf-coast province is home to Hua Hin, Thailand's original royal beach resort and still a relaxed weekend destination for Bangkok families. Fishing towns, night markets and national parks line the shore south of the capital.",
    knownFor: ['Hua Hin', 'Royal beach resort', 'Night markets', 'Sam Roi Yot National Park', 'Golf & seafood'],
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Hua Hin'],
  },
  'TH-71': {
    blurb: "West of Bangkok on the Burmese frontier, Kanchanaburi is Thailand's third-largest province, known for the Bridge over the River Kwai and the WWII Death Railway built by prisoners of war. Waterfalls, caves and Erawan National Park fill its forested interior.",
    knownFor: ['Bridge over the River Kwai', 'Death Railway & war cemeteries', 'Erawan Falls', 'National parks', 'Riverside guesthouses'],
    cultureTip: 'The Allied war cemeteries and museums are places of mourning; visit them quietly and respectfully.',
    sources: ['Tourism Authority of Thailand', 'Encyclopædia Britannica — Kanchanaburi'],
  },

  // ===================== VIETNAM =====================
  'VN-HN': {
    blurb: "Vietnam's capital blends a thousand years of history with tree-lined French-colonial boulevards and the tangled lanes of its Old Quarter. Lakes, street-food stalls and the political monuments of the modern state all cluster in and around the centre.",
    knownFor: ['Old Quarter', 'Hoan Kiem Lake', 'Ho Chi Minh Mausoleum', 'Temple of Literature', 'Egg coffee & street food'],
    cultureTip: 'At the Ho Chi Minh Mausoleum, dress modestly and stay silent — it is a solemn national shrine.',
    sources: ['Vietnam National Administration of Tourism (vietnam.travel)', 'Encyclopædia Britannica — Hanoi'],
  },
  'VN-SG': {
    blurb: 'Ho Chi Minh City — long known as Saigon — is Vietnam’s largest city and commercial engine, a fast, motorbike-filled metropolis in the south. French landmarks, war museums and the Cu Chi tunnels sit beside skyscrapers and buzzing markets.',
    knownFor: ['War Remnants Museum', 'Ben Thanh Market', 'Notre-Dame & Central Post Office', 'Cu Chi Tunnels', 'Rooftop bars & nightlife'],
    sources: ['Vietnam National Administration of Tourism', 'Encyclopædia Britannica — Ho Chi Minh City'],
  },
  'VN-DN': {
    blurb: "Da Nang is central Vietnam's biggest city and beach hub, spread along the coast between the Marble Mountains and the Hai Van Pass. Long sandy beaches, a lively riverfront and the Ba Na Hills' Golden Bridge draw a growing crowd.",
    knownFor: ['My Khe Beach', 'Marble Mountains', 'Golden Bridge (Ba Na Hills)', 'Dragon Bridge', 'Gateway to Hoi An & Hue'],
    sources: ['Vietnam National Administration of Tourism', 'Encyclopædia Britannica — Da Nang'],
  },
  'VN-27': {
    blurb: 'Quảng Nam province holds two UNESCO World Heritage sites: Hoi An, an exquisitely preserved 15th–19th-century trading port, and My Son, the brick tower-temples of the ancient Champa kingdom. Lantern-lit streets, tailor shops and gentle river life define the coast.',
    knownFor: ['Hoi An Ancient Town', 'My Son Sanctuary', 'Silk lanterns', 'Tailors & silk', 'An Bang Beach'],
    cultureTip: 'Hoi An glows with silk lanterns after dark, especially at the monthly full-moon festival when the old town closes to motor traffic.',
    sources: ['UNESCO World Heritage Centre (whc.unesco.org/en/list/948 and /949)', 'Vietnam National Administration of Tourism'],
    verified: '2026-07',
  },
  'VN-34': {
    blurb: 'Khánh Hòa province centres on Nha Trang, a beach resort city fringing a long island-dotted bay. Diving, seafood and mineral mud baths mix with Cham-era towers overlooking the river mouth.',
    knownFor: ['Nha Trang beach & bay', 'Island snorkelling & diving', 'Po Nagar Cham Towers', 'Mud baths', 'Seafood'],
    sources: ['Vietnam National Administration of Tourism', 'Encyclopædia Britannica — Nha Trang'],
  },
  'VN-02': {
    blurb: 'This mountainous northern province rises to Fansipan (3,147 m), the highest peak in Indochina, above the hill town of Sapa. Cascading rice terraces carved over generations by Hmong, Dao and Tày communities make it one of Vietnam’s most photographed landscapes.',
    knownFor: ['Sapa', 'Fansipan (roof of Indochina)', 'Terraced rice fields', 'Hmong & Dao villages', 'Trekking'],
    cultureTip: 'In the villages, ask before photographing people, and buy handicrafts directly from the women who weave them.',
    sources: ['Vietnam National Administration of Tourism', 'Encyclopædia Britannica — Fan Si Pan'],
  },
  'VN-26': {
    blurb: 'Huế was the seat of the Nguyễn emperors and Vietnam’s imperial capital from 1802 to 1945. Its walled Citadel, royal tombs and pagodas along the Perfume River make up the UNESCO-listed Complex of Huế Monuments.',
    knownFor: ['Imperial Citadel', 'Royal tombs', 'Perfume River', 'Thien Mu Pagoda', 'Refined imperial cuisine'],
    sources: ['UNESCO World Heritage Centre — Viet Nam (whc.unesco.org/en/statesparties/vn)', 'Vietnam National Administration of Tourism'],
    verified: '2026-07',
  },
  'VN-47': {
    blurb: "Kiên Giang province stretches along the Gulf of Thailand and includes Phú Quốc, Vietnam's largest island and now a major beach and resort destination. The mainland Mekong-delta towns add fish sauce, seafood and border trade with Cambodia.",
    knownFor: ['Phu Quoc island', 'Beaches & resorts', 'Fish sauce', 'Sunsets & seafood', 'Mekong-delta gateway'],
    sources: ['Vietnam National Administration of Tourism', 'Encyclopædia Britannica — Phu Quoc'],
  },
  'VN-35': {
    blurb: 'In the central highlands, Lâm Đồng is defined by Đà Lạt, a cool hill station the French built as an escape from the lowland heat. Pine forests, flower farms, waterfalls and pastel colonial villas give it a distinctly temperate feel.',
    knownFor: ['Đà Lạt', 'Cool highland climate', 'French-era villas', 'Flower & vegetable farms', 'Waterfalls & lakes'],
    sources: ['Vietnam National Administration of Tourism', 'Encyclopædia Britannica — Da Lat'],
  },
  'VN-13': {
    blurb: 'Quảng Ninh province in the northeast is home to Hạ Long Bay, the UNESCO-listed seascape of more than 1,600 limestone islands and islets rising from emerald water. Overnight cruises and the port of Hạ Long are the usual base.',
    knownFor: ['Ha Long Bay', 'Limestone karst islands', 'Overnight cruises', 'Sea caves', 'Bai Tu Long Bay'],
    cultureTip: 'Choose a licensed cruise operator and follow the crew’s safety briefing — weather can close the bay at short notice.',
    sources: ['UNESCO World Heritage Centre (whc.unesco.org/en/list/672)', 'Vietnam National Administration of Tourism'],
    verified: '2026-07',
  },

  // ===================== CAMBODIA =====================
  'KH-17': {
    blurb: 'Siem Reap is the gateway to Angkor, the vast temple city of the Khmer Empire and Cambodia’s greatest treasure. The towers of Angkor Wat, the stone faces of the Bayon and the jungle-wrapped Ta Prohm sit just north of a town built around welcoming visitors.',
    knownFor: ['Angkor Wat', 'Angkor Archaeological Park', 'Bayon & Ta Prohm', 'Temple sunrise', 'Pub Street & markets'],
    cultureTip: 'The temples are active sacred sites — cover shoulders and knees, especially to climb to the upper level of Angkor Wat.',
    sources: ['UNESCO World Heritage Centre — Cambodia (whc.unesco.org/en/statesparties/kh)', 'Encyclopædia Britannica — Angkor'],
    verified: '2026-07',
  },
  'KH-12': {
    blurb: "Cambodia's riverfront capital sits where the Mekong, Tonlé Sap and Bassac rivers meet. The gleaming Royal Palace and Silver Pagoda stand near the sobering Khmer Rouge memorials at Tuol Sleng and the Choeung Ek killing fields.",
    knownFor: ['Royal Palace & Silver Pagoda', 'Tuol Sleng (S-21)', 'Choeung Ek', 'National Museum', 'Riverside promenade'],
    cultureTip: 'Tuol Sleng and Choeung Ek are genocide memorials — visit in silence, dress modestly, and do not pose for cheerful photos.',
    sources: ['Encyclopædia Britannica — Phnom Penh', 'Ministry of Tourism, Kingdom of Cambodia'],
  },
  'KH-18': {
    blurb: 'Preah Sihanouk province on the Gulf of Thailand centres on the port city of Sihanoukville and, more appealingly for most travellers, the offshore islands of Koh Rong and Koh Rong Sanloem with their white-sand beaches and clear water.',
    knownFor: ['Koh Rong & Koh Rong Sanloem', 'Beaches & islands', 'Snorkelling', 'Ream National Park', 'Island ferries'],
    sources: ['Encyclopædia Britannica — Sihanoukville', 'Ministry of Tourism, Kingdom of Cambodia'],
  },
  'KH-2': {
    blurb: "Cambodia's second city, Battambang, keeps some of the country's best-preserved French-colonial shophouses and a laid-back riverside pace. The surrounding countryside offers hilltop temples, the bamboo train and rural village life.",
    knownFor: ['French colonial architecture', 'Bamboo train', 'Phnom Sampeau & bat caves', 'Art & café scene', 'Rice-country day trips'],
    sources: ['Encyclopædia Britannica — Battambang', 'Ministry of Tourism, Kingdom of Cambodia'],
  },
  'KH-7': {
    blurb: 'Kampot is a mellow riverside province in the south, famous for the Kampot pepper grown on its plantations and for the faded colonial town on the Praek Tuek Chhu River. The old French hill station of Bokor rises in the national park behind it.',
    knownFor: ['Kampot pepper', 'Riverside colonial town', 'Bokor National Park', 'Salt fields & caves', 'Kep crab nearby'],
    sources: ['Encyclopædia Britannica — Kampot', 'Ministry of Tourism, Kingdom of Cambodia'],
  },

  // ===================== LAOS =====================
  'LA-LP': {
    blurb: 'The former royal capital of Laos sits on a peninsula where the Nam Khan meets the Mekong. Its UNESCO-listed old town blends gilded Buddhist temples with French-colonial shophouses, and dawn brings the quiet almsgiving procession of saffron-robed monks.',
    knownFor: ['UNESCO old town', 'Morning alms-giving', 'Kuang Si Falls', 'Mount Phousi', 'Night market & Mekong sunsets'],
    cultureTip: 'If you watch the dawn alms-giving, keep your distance, stay silent and never use flash — it is a devotion, not a show.',
    sources: ['UNESCO World Heritage Centre (whc.unesco.org/en/list/479)', 'Encyclopædia Britannica — Louangphrabang'],
    verified: '2026-07',
  },
  'LA-VT': {
    blurb: "Laos's small, low-rise capital sits on a bend of the Mekong facing Thailand. Its landmarks — the golden That Luang stupa, the Patuxai victory monument and riverside temples — reflect a relaxed pace unusual for a national capital.",
    knownFor: ['Pha That Luang', 'Patuxai', 'Riverside night market', 'Buddha Park', 'Wat Sisaket'],
    sources: ['Encyclopædia Britannica — Vientiane', 'Lao National Tourism Administration (tourismlaos.org)'],
  },
  'LA-VI': {
    blurb: 'Vientiane Province wraps around the capital and rises into limestone country to the north. Its star is Vang Vieng, a riverside town beneath dramatic karst peaks that has become Laos’s hub for tubing, kayaking, caving and hot-air ballooning.',
    knownFor: ['Vang Vieng', 'Karst mountain scenery', 'Nam Song tubing & kayaking', 'Blue lagoons & caves', 'Hot-air balloons'],
    cultureTip: 'Water activities are safest in the dry season, when the Nam Song runs calm and clear.',
    sources: ['Lao National Tourism Administration', 'Encyclopædia Britannica — Vientiane (province)'],
  },
  'LA-CH': {
    blurb: "Champasak province in the far south holds Vat Phou, a pre-Angkorian Khmer temple set in a UNESCO-listed cultural landscape, and Si Phan Don — the 'Four Thousand Islands' — where the Mekong braids into channels and waterfalls. Pakse is the hub and gateway to the Bolaven Plateau's coffee farms.",
    knownFor: ['Vat Phou (UNESCO)', 'Si Phan Don (4000 Islands)', 'Bolaven Plateau coffee', 'Khone Phapheng Falls', 'Pakse'],
    sources: ['UNESCO World Heritage Centre (whc.unesco.org/en/list/481)', 'Lao National Tourism Administration'],
    verified: '2026-07',
  },
  'LA-XI': {
    blurb: 'Xiangkhouang province, on a high plateau in the northeast, is famous for the Plain of Jars — thousands of Iron Age stone jars scattered across the landscape, now a UNESCO World Heritage site. The region was also among the most heavily bombed on earth during the Indochina wars.',
    knownFor: ['Plain of Jars (UNESCO)', 'Iron Age megaliths', 'Phonsavan', 'UXO history & museums', 'Highland scenery'],
    cultureTip: 'Unexploded ordnance still lies in the countryside — stay on marked paths and inside the cleared markers at the jar sites.',
    sources: ['UNESCO World Heritage Centre (whc.unesco.org/en/list/1587)', 'Lao National Tourism Administration'],
    verified: '2026-07',
  },
};

// Look up a province write-up by its ISO code (e.g. "TH-10"). Returns null when none exists,
// so the region screen can fall back gracefully to its derived content.
export function provinceInfo(code) {
  return (code && PROVINCE_INFO[code]) || null;
}
