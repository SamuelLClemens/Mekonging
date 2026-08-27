// Place-tier "when to go" — the finest of the app's three month tiers, layered on top of the
// city tier (js/data/history.js) by `placeWhen()` in render-utils.js, which itself falls back
// to the region tier (js/data/zones.js) where a caller has one. See MEKONGING_REFACTOR_TODO.md
// Priority 10.1 for why this tier exists and how it was scoped.
//
// Deliberately small and hand-picked, not derived in bulk: of the app's 808 place records,
// 179 carry an explicit month range in a when-to-visit-ish field, and most of those name a
// harvest, a hotel's peak rate, or a park's flood closure — real facts, but not a visiting
// recommendation. An entry belongs here ONLY when the place's own record already states, in
// its own words, that some months are genuinely better (or worse) TO VISIT than others; the
// 52 entries below are what survived that filter, curated 2026-08-27. No entry here may assert
// a month its own cited field does not name — enforced by scripts/check-month-arrays.py under
// the identical asymmetric rule the region and city tiers already use: every month in
// `bestM`/`avoidM` must be named by `why`; the reverse is not required. `avoidM` is reserved
// for EXPLICIT warning language (closed/dangerous/unsafe/treacherous/potentially fatal/
// removed/cancel) — a merely comparative note ("lower flow", "can be a trickle") is real
// information but not a warning, and is left out, matching the restraint the region and city
// tiers already apply to hedged months.
//
// PLACE_MONTHS[placeId] = { bestM: number[], avoidM: number[], why: string }
// `why` is a direct quote (or a trimmed one) of a sentence that already exists on that same
// place's own record — never a new claim written for this file.
export const PLACE_MONTHS = {
  // ---- Thailand ----
  'th-ext-pam-bok': { bestM: [6, 7, 8, 9, 10, 11], avoidM: [], why: 'Flow is strongest in and just after the rainy season (roughly June–November).' },
  'th-ext-khlong-chak': { bestM: [5, 6, 7, 8, 9, 10, 11], avoidM: [3, 4], why: 'Flow strongest May–November; best in the green season when the falls actually run. The falls can be dry in March–April.' },
  'th-ext-phu-pha-man': { bestM: [7, 8, 9, 10, 11], avoidM: [], why: 'Waterfalls run hardest July–November; expect low flow in the hot, dry months.' },
  'th-ext-similan-islands': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [6, 7, 8, 9], why: 'Open roughly mid-October to mid-May; CLOSED in the low season (about May-October) for reef recovery.' },
  'th-ext-nai-harn': { bestM: [], avoidM: [5, 6, 7, 8, 9, 10], why: 'Heed red flags in the May-October monsoon, when rips are strong.' },
  'th-ext-sam-phan-bok': { bestM: [1, 2, 3, 4], avoidM: [], why: 'Best January-April; daylight hours only. Avoid the wet season when it floods.' },
  'th-ext-phu-kradueng-national-park': { bestM: [10, 11, 12, 1, 2, 3, 4, 5], avoidM: [6, 7, 8, 9], why: 'Open roughly October-May; closed in the rainy season (about June-Sept) for recovery.' },
  'th-ext-kaeng-krachan-national-park': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [], why: 'Best November-April.' },
  'th-ext-khao-sok-national-park': { bestM: [12, 1, 2, 3, 4], avoidM: [], why: 'Drier and best roughly December-April, though it is rainforest year-round.' },
  'th-ext-ang-thong-marine-national-park': { bestM: [], avoidM: [11, 12], why: 'Typically closed part of the low/monsoon season (around Nov-Dec) for safety.' },
  'th-ext-koh-lipe': { bestM: [11, 12, 1, 2, 3, 4, 5], avoidM: [], why: 'Access by boat mainly in the dry season (Oct/Nov-May); many services shut in the monsoon.' },
  'th-ext-pha-sua-waterfall': { bestM: [7, 8, 9, 10], avoidM: [], why: 'Daylight hours. Fullest and most dramatic Jul-Oct.' },
  'th-ext-chaweng-beach': { bestM: [], avoidM: [7, 8, 9, 10], why: 'Potentially fatal box jellyfish (Chironex) appear mainly in the July–October wet season and after rain.' },
  'th-ext-mork-fa-waterfall': { bestM: [6, 7, 8, 9, 10, 11], avoidM: [], why: 'Most powerful Jun–Nov.' },
  'th-ext-mae-surin-waterfall': { bestM: [6, 7, 8, 9, 10, 11], avoidM: [], why: 'Most powerful Jun–Nov.' },
  'th-ext-kew-mae-pan-trail': { bestM: [11, 12, 1, 2, 3, 4, 5], avoidM: [6, 7, 8, 9, 10], why: 'Daylight, cool season only (closed roughly June–October); closed June to end of October for reforestation, so plan for Nov–May.' },
  'th-ext-udonthani-red-lotus-sea': { bestM: [11, 12, 1, 2], avoidM: [], why: 'This is a genuinely seasonal sight — check bloom season (roughly Nov-Feb, peak Dec-early Jan) before planning a special trip out.' },

  // ---- Vietnam ----
  'vi-ext-nho-que-tu-san': { bestM: [9, 10, 11, 12, 1, 2, 3, 4], avoidM: [], why: 'Go in the dry season (September-April) for calm water and the strongest green colour.' },
  'vi-ext-pu-luong': { bestM: [6, 9, 10], avoidM: [], why: 'Rice terraces are greenest around June and gold near September-October.' },
  'vi-ext-con-dao-diving': { bestM: [3, 4, 5, 6, 7, 8, 9], avoidM: [], why: 'Dive season strongest March to September.' },
  'vi-ext-mui-ne-beach': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [], why: 'Steady afternoon winds from November to April make this a legendary kite- and windsurfing beach.' },
  'vi-ext-vung-tau-back-beach': { bestM: [], avoidM: [12, 1, 2, 3], why: 'Dangerous rip currents — strongest in the December–March northeast monsoon — cause drownings every year.' },
  'vi-ext-tra-su': { bestM: [9, 10, 11], avoidM: [], why: 'The flooded-forest season (roughly September-November) is the most striking.' },
  'vi-ext-ho-chi-minh-mausoleum-complex': { bestM: [], avoidM: [6, 7, 8], why: 'Closed Monday and Friday, plus an annual multi-week closure (usually Jun-Aug) for maintenance.' },
  'vi-ext-halong-bai-chay-stays': { bestM: [10, 11, 12, 1, 2, 3, 4], avoidM: [7, 8, 9], why: 'October to April is the clear-weather window, and July to September carries typhoon risk that can cancel cruises outright.' },
  'vi-ext-dray-nur-waterfall': { bestM: [6, 7, 8, 9, 10, 11], avoidM: [], why: 'Flow is strongest and most dramatic in the rainy season, roughly June to November.' },
  'vi-ext-sapa-silver-love-waterfalls': { bestM: [6, 7, 8, 9], avoidM: [], why: 'Fullest and loudest in and just after the rains (roughly June-September).' },
  'vi-ext-con-dao': { bestM: [6, 7, 8, 9], avoidM: [], why: 'Turtle-nesting trips (roughly June-September) must be arranged through the national park.' },
  'vi-ext-ban-gioc': { bestM: [9, 10], avoidM: [], why: 'The fullest flow is in the September-October rainy tail.' },

  // ---- Cambodia ----
  'kh-ext-kirirom-national-park': { bestM: [7, 8, 9, 10, 11], avoidM: [], why: 'Waterfalls are fullest in and just after the rainy season (roughly July–November).' },
  'kh-ext-kep-beach': { bestM: [], avoidM: [5, 6, 7, 8, 9, 10], why: 'Box jellyfish occur along Cambodia\'s coast and can be dangerous; risk is highest in the May–October wet season.' },
  'kh-ext-tatai-waterfall': { bestM: [6, 7, 8, 9, 10, 11], avoidM: [], why: 'Fullest and best for swimming in and just after the June-November rains.' },
  'kh-ext-kachang-waterfall': { bestM: [10, 11, 12], avoidM: [], why: 'Flow is strongest just after the rains, roughly October to December.' },
  'kh-ext-sopheakmit-waterfall': { bestM: [11, 12, 1, 2, 3, 4, 5], avoidM: [], why: 'Best in the dry season (Nov–May) when the viewing rocks are exposed and the access roads are firm.' },
  'kh-ext-kompong-cham-bamboo-bridge': { bestM: [12, 1, 2, 3, 4, 5], avoidM: [], why: 'The bridge stands only in the dry season, roughly December to May; it is removed when the Mekong rises.' },
  'kh-ext-phnom-da-angkor-borei': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [], why: 'Best November–April (dry season) when the road is passable and heat is milder.' },

  // ---- Laos ----
  'la-ext-xe-bang-fai-cave': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [], why: 'Dry season only (roughly November-April); the river is dangerous when high.' },
  'la-ext-tham-pha-chan': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [], why: 'The river passage is passable mainly in the dry season (roughly November-April).' },
  'la-ext-tad-faek': { bestM: [11, 12, 1, 2], avoidM: [7, 8, 9], why: 'Best flow and swimming are in the cooler dry months (roughly November-February); the river runs high and muddy in the July-September rains.' },
  'la-ext-tad-hua-khon': { bestM: [8, 9, 10, 11], avoidM: [], why: 'The falls are widest just after the rains (roughly August-November).' },
  'la-ext-tad-soung': { bestM: [7, 8, 9, 10, 11], avoidM: [], why: 'Go in or shortly after the rainy season (roughly July-November) for the fullest flow.' },
  'la-ext-tad-tayicseua': { bestM: [11, 12, 1, 2, 3], avoidM: [], why: 'Come in the dry season (roughly November-March); the trails get treacherous in the rains.' },
  'la-ext-kaeng-nyui-waterfall': { bestM: [8, 9, 10, 11], avoidM: [], why: 'Flow is strong in and just after the rainy season (Aug-Nov).' },
  'la-ext-plain-of-jars-site-3': { bestM: [10, 11, 12, 1, 2], avoidM: [], why: 'Best October-February when the plateau is dry and cool.' },
  'la-ext-nam-nern-night-safari': { bestM: [11, 12, 1, 2, 3], avoidM: [], why: 'Drier months (November-March) are best.' },
  'la-ext-tham-nam-water-cave': { bestM: [], avoidM: [8, 9], why: 'In peak wet season (Aug-Sep) high water can make the cave unsafe or closed.' },
  'la-ext-ban-kiet-ngong-wetland': { bestM: [6, 7, 8, 9, 10], avoidM: [], why: 'The wetland is fullest during and after the rains (Jun-Oct).' },
  'la-ext-xe-pian-npa': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [], why: 'Dry season (Nov-Apr) is best for the trails.' },
  'la-ext-hintang-standing-stones': { bestM: [11, 12, 1, 2, 3], avoidM: [], why: 'Go in the dry season (November-March) - the spur road is treacherous when wet.' },
  'la-ext-khone-phapheng': { bestM: [6, 7, 8, 9, 10], avoidM: [], why: 'Wet-season flow (around June-October) is at its most thunderous.' },
  'la-ext-tha-falang': { bestM: [11, 12, 1, 2, 3, 4], avoidM: [], why: 'Clearest water in the dry season (roughly November-April).' },
  'la-ext-nam-dee-waterfall-luang-namtha': { bestM: [6, 7, 8, 9, 10], avoidM: [], why: 'Strongest flow in the wet season (June-October).' },
};
