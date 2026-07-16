// Laos — EXTENDED places: lesser-known nature, hot/cool springs, waterfalls,
// viewpoints, national parks/protected areas, quiet river islands and standout
// local food/markets that the popular guides under-cover. Same object shape as
// PLACES_LA. Prices are GUIDANCE ranges; confirm locally (entry fees, boat
// charters and karst-park tolls change yearly and are often cash-only in kip).
// `rating` is a fair consensus synthesised from the cited reviewSources — NOT a
// verbatim copy of any single site. categories: food | culture | nature |
// nightlife | viewpoint | hotspring | waterfall | beach | market | hike | park.
export const PLACES_LA_EXT = [
  {
    id: "la-ext-nam-xay", name: "Nam Xay Viewpoint", city: "Vang Vieng", country: "la",
    recognition: 'A steep karst peak southeast of town whose bare summit rock holds a much-photographed old motorbike prop, looking out over the Nam Song valley and its dawn hot-air balloons.',
    categories: ["viewpoint", "hike", "nature"], budgetTier: "low",
    blurb: "A short but steep karst climb that opens onto the photo most people picture when they think of Vang Vieng: jagged limestone peaks above the Nam Song valley, often with a hot-air balloon drifting past at dawn or dusk. A motorbike sits at the summit as a much-photographed prop.",
    whyItFits: "Suits photographers and active travellers who want the iconic vista without the river-tubing party scene. The climb takes roughly 30-45 minutes and rewards far beyond its effort.",
    priceRange: { low: 20000, typical: 20000, high: 40000, currency: "LAK", note: "Around 20,000 LAK to climb; budget extra for the scooter ride or a tuk-tuk out of town." },
    hours: "Roughly 09:00-17:30 daily; go for sunrise or late afternoon",
    tips: ["Wear grippy shoes — the rock is sharp and gets slick after rain.", "Sunrise overlaps with the balloon launches for the classic shot.", "Bring water and small kip notes for the entrance booth; cards are not accepted."],
    scamWarnings: ["Agree any tuk-tuk fare to the trailhead before setting off, as return pricing is sometimes renegotiated."],
    rating: 4.6, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Nam Xay Viewpoint Vang Vieng", coords: { lat: 18.9636, lng: 102.4769 },
    bookHint: "No booking; ride or walk to the base and pay at the booth.", verified: "2026-06",
    sources: [{ org: "Tripadvisor", url: "https://www.tripadvisor.com" }, { org: "RooWanders", url: "https://www.roowanders.com/nam-xay-viewpoint/" }],
  },
  {
    id: "la-ext-blue-lagoon-3", name: "Blue Lagoon 3", city: "Vang Vieng", country: "la",
    categories: ["nature", "hotspring"], budgetTier: "low",
    blurb: "A round, turquoise spring-fed pool ringed by jungle about 20 km out of town, with bamboo rafts, a rope swing, a horizontal tree-walk over the water and a zip-line. Far quieter than the heavily touristed Blue Lagoon 1.",
    whyItFits: "For travellers who want the cool clear-water swim that Vang Vieng is famous for, minus the day-tripper crowds. The longer drive through rice country is part of the appeal.",
    priceRange: { low: 20000, typical: 40000, high: 80000, currency: "LAK", note: "Around 20,000 LAK entry plus a ~20,000 LAK toll bridge over the Nam Song; small extra for the zip-line." },
    hours: "08:00-18:00 daily",
    tips: ["The rough road takes about an hour by scooter; ride carefully in the wet season.", "Water is genuinely cold — best swum in the heat of the day.", "Combine it with a Nam Xay sunrise for a full Vang Vieng day."],
    scamWarnings: [],
    rating: 4.3, reviewSources: ["Tripadvisor", "Google Maps consensus", "Backpackers Wanderlust"],
    mapQuery: "Blue Lagoon 3 Vang Vieng", coords: { lat: 18.8869, lng: 102.4036 },
    bookHint: "No booking; pay at the gate. Most riders go independently by scooter.", verified: "2026-06",
    sources: [{ org: "Tripadvisor", url: "https://www.tripadvisor.com" }, { org: "Backpackers Wanderlust", url: "https://www.backpackerswanderlust.com/blue-lagoon-three-vang-vieng/" }],
  },
  {
    id: "la-ext-pha-daeng-peak", name: "Pha Daeng Peak Viewpoint", city: "Nong Khiaw", country: "la",
    recognition: 'A steep rope-assisted climb from the roadside just southwest of Nong Khiaw village, topping out at a bare rock ledge overlooking the Nam Ou, the village bridge and encircling karst peaks.',
    categories: ["viewpoint", "hike", "nature"], budgetTier: "low",
    blurb: "The most scenic of Nong Khiaw's limestone climbs, delivering a sweeping panorama over the Nam Ou river, the village bridge and an amphitheatre of karst peaks. A steep, root-and-rock trail with rope-assisted sections near the top.",
    whyItFits: "For hikers who want northern Laos at its most cinematic. The roughly 1.5-hour climb is demanding but the summit is one of the finest viewpoints in the country.",
    priceRange: { low: 50000, typical: 50000, high: 50000, currency: "LAK", note: "Around 50,000 LAK trail/entrance fee, collected at the base." },
    hours: "Daylight hours; start before 05:00 for sunrise above the mist",
    tips: ["Carry a head-torch if attempting the pre-dawn sunrise start.", "The trail is genuinely steep — bring water and proper footwear.", "Low river mist in the early morning is the signature Nong Khiaw scene."],
    scamWarnings: [],
    rating: 4.7, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Pha Daeng Peak Viewpoint Nong Khiaw", coords: { lat: 20.5667, lng: 102.6167 },
    bookHint: "No booking; pay the fee at the trailhead booth and climb independently.", verified: "2026-06",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/northern-laos/nong-khiaw" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-100-waterfalls", name: "100 Waterfalls Trek", city: "Nong Khiaw", country: "la",
    categories: ["waterfall", "hike", "nature"], budgetTier: "mid",
    blurb: "A guided full-day adventure that starts with a boat ride up the Nam Ou, then wades and scrambles directly up a chain of cascades — clambering over rocks beside (and sometimes through) dozens of small falls rather than merely viewing them.",
    whyItFits: "For adventurous walkers who want a hands-on jungle day and a glimpse of remote Khmu village life. A local guide is required, which also supports the host community of Ban Sop Khan.",
    priceRange: { low: 150000, typical: 300000, high: 450000, currency: "LAK", note: "Group day-tour price per person including boat, local guide and lunch; varies with group size." },
    hours: "Full-day guided departures, typically from around 08:30",
    tips: ["Wear shoes you can soak — you will be wading and scrambling on wet rock.", "Book a day ahead through a Nong Khiaw operator so the boat and guide are arranged.", "Best flow is in and just after the wet season; dry-season levels are gentler."],
    scamWarnings: ["Use a licensed local operator; the route genuinely needs a guide and unguided attempts are discouraged."],
    rating: 4.6, reviewSources: ["Tripadvisor", "Google Maps consensus", "Discover Laos"],
    mapQuery: "100 Waterfalls Trek Nong Khiaw Ban Sop Khan", coords: { lat: 20.6000, lng: 102.6500 },
    bookHint: "Book the day before at a Nong Khiaw trekking agency; the boat departs from the village pier.", verified: "2026-06",
    sources: [{ org: "Discover Laos Today", url: "https://discoverlaos.today/nong-khiaw/thing-to-do/100-waterfalls-trek" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-kong-lor", name: "Kong Lor Cave", city: "Thakhek", country: "la",
    access: { stepFree: "no", note: "Entry is boat-only across a footbridge, and the 7km river-cave passage requires disembarking into shallow water to walk a lit rocky stretch while the boat is hauled up rapids." },
    externalRatings: [
      { site: "Tripadvisor", score: 4.5, scale: 5, count: 352, url: "https://www.tripadvisor.com/Attraction_Review-g10138992-d2306807-Reviews-Kong_Lor_Cave-Phoun_Hin_Boun_Khammouane_Province.html", asOf: "2026-07" },
    ],
    recognition: 'A cave mouth at the end of Ban Kong Lor village where longtail boats enter a 7.5 km river tunnel bored by the Nam Hin Bun through a limestone mountain.',
    categories: ["nature", "park"], budgetTier: "mid",
    blurb: "A 7.5 km river cave on the Thakhek Loop where a longtail boat motors you through a vast pitch-black limestone tunnel carved by the Nam Hin Bun, emerging into daylight at the far end. The cathedral-scale chambers and underground river are among Southeast Asia's most extraordinary cave experiences.",
    whyItFits: "The natural highlight of the Thakhek Loop and worth the detour for anyone in central Laos, even without a motorbike. Set within the Phou Hin Boun protected area.",
    priceRange: { low: 130000, typical: 200000, high: 320000, currency: "LAK", note: "Boat charter (shared up to three passengers) plus entrance and a small headlamp/life-jacket charge; price is per boat, so split it." },
    hours: "Roughly 08:00-16:00 daily; last boats leave well before dusk",
    tips: ["Bring a dry bag and a torch — the boat can ship water over rapids in places.", "Going early avoids midday tour buses and gives the best water level.", "Stay overnight in Ban Kong Lor village to ride out at opening time."],
    scamWarnings: ["Confirm whether your fare is round-trip; some boatmen quote a one-way price and charge again for the return."],
    rating: 4.7, reviewSources: ["Lonely Planet", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Kong Lor Cave Khammouane Laos", coords: { lat: 17.9333, lng: 104.8167 },
    bookHint: "Arrange the boat on arrival at the Ban Kong Lor cave entrance; no advance booking needed.", verified: "2026-06",
    sources: [{ org: "Green Discovery Laos", url: "https://greendiscoverylaos.com/thakhek/" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-tha-falang", name: "Tha Falang (Cool Spring)", city: "Thakhek", country: "la",
    categories: ["nature", "viewpoint"], budgetTier: "low",
    blurb: "A serene bend in a spring-fed river on the Thakhek Loop, where exceptionally clear water turns emerald-blue in the dry season beneath towering grey karst cliffs. A historic colonial-era picnic spot now favoured as a quiet swimming and cool-off stop.",
    whyItFits: "For loop riders and nature lovers who want a tranquil, free swim away from any crowd. The limestone-and-jungle setting is one of the most photogenic on the whole circuit.",
    priceRange: { low: 0, typical: 0, high: 20000, currency: "LAK", note: "Generally free; a small parking or local fee may apply in season." },
    hours: "Daylight hours; clearest water in the dry season (roughly November-April)",
    tips: ["Dry season delivers the vivid blue colour; the wet season turns it muddy and fast.", "Bring everything you need — there are few or no facilities on site.", "Pair it with the nearby caves on the first leg out of Thakhek."],
    scamWarnings: [],
    rating: 4.4, reviewSources: ["Tripadvisor", "Google Maps consensus", "The Roaming Compass"],
    mapQuery: "Tha Falang Thakhek Loop Khammouane", coords: { lat: 17.4667, lng: 104.9500 },
    bookHint: "No booking; ride in on the loop and park at the riverside.", verified: "2026-06",
    sources: [{ org: "The Roaming Compass", url: "https://theroamingcompass.com/laos/riding-the-thakhek-loop-in-laos-your-complete-guide/" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-tad-fane", name: "Tad Fane Waterfall", city: "Paksong", country: "la",
    access: { stepFree: "no", note: "Even the main viewpoint, about 100 m from the car park, is reached by a short staircase, and the better gorge and falls overlooks are on short unpaved dirt-and-rock trails that turn muddy and slippery after rain; no paved or step-free route is documented." },
    recognition: 'On the Bolaven Plateau near Paksong, twin side-by-side jets plunge about 120 m into a forested gorge, viewed from a clifftop platform beside a small resort cafe.',
    categories: ["waterfall", "viewpoint", "nature", "park"], budgetTier: "low",
    blurb: "A dramatic twin cascade plunging around 120 m off the Bolaven Plateau escarpment into a forested gorge, framed by a viewpoint within the Dong Hua Sao protected area. On windy days the spray throws up rainbows across the canyon.",
    whyItFits: "The most striking single waterfall on the Bolaven Plateau and an easy stop on the coffee-country loop out of Pakse. A short walk reaches the main viewpoint; longer trails and a zip-line cater to the more adventurous.",
    priceRange: { low: 10000, typical: 20000, high: 30000, currency: "LAK", note: "Small viewpoint entry; zip-line and guided gorge trails cost extra and are booked on site." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["Combine it with a Paksong coffee-plantation visit; the plateau is the coffee heartland of Laos.", "The wet season gives the fullest flow but more cloud; dry season offers clearer views.", "Stay for a coffee at the viewpoint cafe overlooking the falls."],
    scamWarnings: [],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus", "Discover Laos"],
    mapQuery: "Tad Fane Waterfall Paksong Bolaven Plateau", coords: { lat: 15.1903, lng: 106.1186 },
    bookHint: "No booking for the viewpoint; arrange zip-line or trekking at the on-site resort.", verified: "2026-06",
    sources: [{ org: "Discover Laos Today", url: "https://discoverlaos.today/paksong-bolaven-plateau/thing-to-do/tad-fane-fane-waterfall" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-tad-lo", name: "Tad Lo Waterfalls & Village", city: "Salavan", country: "la",
    categories: ["waterfall", "nature", "food"], budgetTier: "low",
    blurb: "A laid-back river village on the eastern edge of the Bolaven Plateau, gathered around three falls: the wide Tad Hang beside the guesthouses, Tad Lo just upstream, and the towering ~90 m Tad Soung a few kilometres up the road. Ethnic-minority villages dot the surrounding hills.",
    whyItFits: "For slow travellers who want a hammock-and-waterfall base with genuine local life rather than a tour-bus stop. Riverside guesthouses serve cheap home-cooked Lao food and there is little to do but swim and wander — which is the point.",
    priceRange: { low: 0, typical: 20000, high: 60000, currency: "LAK", note: "Tad Hang and Tad Lo are free to reach; a small fee may apply at Tad Soung. Meals at village guesthouses are inexpensive." },
    hours: "Open access; daylight for the falls",
    tips: ["Ride or hitch the 10 km up to Tad Soung for the most dramatic drop.", "Swim below Tad Hang in the dry season when the current eases.", "Eat at the riverside guesthouse kitchens — simple, fresh Lao cooking at low prices."],
    scamWarnings: [],
    rating: 4.4, reviewSources: ["Travelfish", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Tad Lo Waterfall Salavan Bolaven Plateau", coords: { lat: 15.4333, lng: 106.2333 },
    bookHint: "No booking needed; turn up and choose a riverside guesthouse in Tad Lo village.", verified: "2026-06",
    sources: [{ org: "Travelfish", url: "https://www.travelfish.org/location/laos/southern_laos/salavan/tad_lo" }, { org: "Discover Laos Today", url: "https://discoverlaos.today/salavan-province/thing-to-do/tad-lo-and-tad-hang" }],
  },
  {
    id: "la-ext-don-khon", name: "Don Khon Island & Li Phi Falls", city: "Si Phan Don", country: "la",
    categories: ["nature", "waterfall", "beach"], budgetTier: "low",
    blurb: "The quieter, larger half of the Don Det / Don Khon pair in the 4000 Islands, linked by an old French railway bridge. Bicycle past colonial-era ruins to the thundering Tat Somphamit (Li Phi) falls and out to sandy river spits that serve as the area's makeshift beaches.",
    whyItFits: "For travellers who want the Mekong-island slow life and natural drama without Don Det's backpacker bars. Flat, easy cycling links the bridge, the falls and the southern beaches.",
    priceRange: { low: 35000, typical: 55000, high: 90000, currency: "LAK", note: "Combined bridge-and-Li-Phi-falls island access fee for foreigners; bicycle hire is a few thousand kip extra per day." },
    hours: "Falls accessible during daylight; bridge crossing any time",
    tips: ["Hire a bicycle on Don Det and cross the bridge — the islands are best explored on two wheels.", "Note that the Irrawaddy dolphins are gone from the Lao stretch of the Mekong; treat any 'dolphin tour' claim sceptically.", "Sunset from the Don Khon riverbank or a southern sand spit is the highlight of the day."],
    scamWarnings: ["The Mekong Irrawaddy dolphins were declared locally extinct in Laos in 2022; reject tours promising sightings here."],
    rating: 4.4, reviewSources: ["Lonely Planet", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Don Khon Li Phi Falls Si Phan Don 4000 Islands", coords: { lat: 13.9333, lng: 105.9667 },
    bookHint: "Pay the island fee at the bridge; no advance booking for cycling or the falls.", verified: "2026-06",
    sources: [{ org: "Southeast Asia Backpacker", url: "https://southeastasiabackpacker.com/destinations/laos-2/four-thousand-islands/" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-khone-phapheng", name: "Khone Phapheng Falls", city: "Si Phan Don", country: "la",
    externalRatings: [
      { site: "Tripadvisor", score: 4.3, scale: 5, count: 256, url: "https://www.tripadvisor.com/Attraction_Review-g1015968-d7653889-Reviews-Khone_Phapheng_Falls-Don_Khong_Champasak_Province.html", asOf: "2026-07" },
    ],
    recognition: 'Near the Cambodian border, a broad thundering wall of Mekong rapids and cascades viewed from riverside platforms in a fenced park reached from Ban Nakasang.',
    categories: ["waterfall", "nature", "viewpoint"], budgetTier: "low",
    blurb: "The most powerful waterfall on the Mekong and, by volume, the largest in Southeast Asia: a vast set of rapids and cascades crashing across the river near the Cambodian border. Viewing platforms and a riverside park let you feel the sheer force up close.",
    whyItFits: "For anyone in the 4000 Islands who wants raw natural spectacle. It is a short trip from Nakasang or the islands and pairs naturally with a Don Khon cycling day.",
    priceRange: { low: 55000, typical: 75000, high: 120000, currency: "LAK", note: "Foreigner park entry; reaching it from the islands adds a boat-and-transfer cost." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["Wet-season flow (around June-October) is at its most thunderous.", "Use the upper and lower platforms for different perspectives on the rapids.", "Combine with the islands rather than visiting as a standalone trip from Pakse."],
    scamWarnings: ["Agree the full transfer price (boat plus road) before leaving the islands, as add-on fees are common."],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus", "Renown Travel"],
    mapQuery: "Khone Phapheng Falls Champasak Laos", coords: { lat: 13.9500, lng: 106.0167 },
    bookHint: "Join a half-day tour from the islands or hire a tuk-tuk from Nakasang; pay park entry at the gate.", verified: "2026-06",
    sources: [{ org: "Renown Travel", url: "https://www.renown-travel.com/laos/pakse/si-phan-don.html" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-plain-of-jars-1", name: "Plain of Jars — Site 1 (Thong Hai Hin)", city: "Phonsavan", country: "la",
    access: { stepFree: "no", note: "The most-developed jar site, but the jar clusters sit on a hillside reached by unpaved, sloping dirt-and-grass paths from the car park; visitors must stay on MAG-cleared tracks." },
    externalRatings: [
      { site: "Tripadvisor", score: 4.5, scale: 5, count: 669, url: "https://www.tripadvisor.com/Attraction_Review-g612364-d325753-Reviews-The_Plain_Of_Jars-Phonsavan_Xiangkhouang_Province.html", asOf: "2026-07" },
    ],
    recognition: 'About 10 km from Phonsavan, grassy hillsides scattered with hundreds of giant Iron Age stone jars, flagged walking paths threading between the jars and old bomb craters.',
    categories: ["culture", "nature", "park"], budgetTier: "low",
    blurb: "The largest and most accessible cluster of the UNESCO-listed Plain of Jars: hundreds of giant Iron Age stone jars, some over two metres tall, scattered across rolling grassland. Cleared walking paths thread between the jars and old wartime bomb craters mark the same fields.",
    whyItFits: "For history-minded travellers who want one of Southeast Asia's great archaeological mysteries plus sobering context on the Secret War. Site 1 is a ten-minute drive from Phonsavan and the easiest introduction.",
    priceRange: { low: 15000, typical: 17000, high: 25000, currency: "LAK", note: "Around 15,000 LAK site entry plus a ~2,000 LAK parking fee; other jar sites charge separately." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["Stay strictly on the cleared, marker-flagged paths — surrounding ground may still hold unexploded ordnance.", "Visit the local MAG/UXO information centre in Phonsavan first for essential context.", "Hire a guide or join a Phonsavan tour to link Site 1 with the quieter Sites 2 and 3."],
    scamWarnings: [],
    rating: 4.4, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Plain of Jars Site 1 Thong Hai Hin Phonsavan", coords: { lat: 19.4308, lng: 103.1503 },
    bookHint: "Pay at the Site 1 ticket booth; arrange a half-day multi-site tour through Phonsavan agencies.", verified: "2026-06",
    sources: [{ org: "Wikivoyage — Plain of Jars", url: "https://en.wikivoyage.org/wiki/Plain_of_Jars" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
{
    id: "la-ext-pak-ou-caves", name: "Pak Ou Caves", city: "Luang Prabang", country: "la",
    access: { stepFree: "no", note: "Reached only by boat onto a floating bamboo dock, then a flight of steps up to the lower cave and 200-plus steep, uneven stone steps to the upper cave; no wheelchair access anywhere on site." },
    recognition: 'Two limestone caves in a cliff facing the Mekong at its junction with the Nam Ou, packed with thousands of small Buddha statues, reached by boat and a stairway from the water.',
    categories: ["culture", "nature"], budgetTier: "low",
    blurb: "Two riverside limestone caves above the confluence of the Mekong and Nam Ou, crammed with thousands of old Buddha statues left by pilgrims over centuries. Reached by a scenic slow-boat trip upriver from Luang Prabang.",
    whyItFits: "For travellers wanting a half-day on the Mekong combined with an atmospheric cave shrine; boats often stop at a whisky-making village en route.",
    priceRange: { low: 20000, typical: 30000, high: 40000, currency: "LAK", note: "Cave entry around 20,000-30,000 LAK; the shared slow boat from Luang Prabang is the larger, separate cost." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["Take the river boat rather than the road for the scenery; allow most of a morning.", "Bring a torch for the dim upper cave (Tham Theung).", "Combine with the Ban Xang Hai whisky village stop most boats include."],
    scamWarnings: ["Agree the round-trip boat price and stops with the boatman before departing the Luang Prabang pier."],
    rating: 4.3, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Pak Ou Caves Luang Prabang", coords: { lat: 20.0500, lng: 102.2167 },
    bookHint: "Arrange a shared or private boat at the Luang Prabang riverfront; pay cave entry on arrival.", verified: "2026-06",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/around-luang-prabang/pak-ou-caves" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-wat-phou", name: "Wat Phou (Vat Phou)", city: "Champasak", country: "la",
    access: { stepFree: "no", note: "The lower causeway and baray are flat, but reaching the hillside sanctuary means climbing a long flight of steep, uneven, jagged ancient stone steps with no ramp or alternative route." },
    externalRatings: [
      { site: "Tripadvisor", score: 4.4, scale: 5, count: 812, url: "https://www.tripadvisor.com/Attraction_Review-g1015988-d2011694-Reviews-Wat_Phu-Champasak_Town_Champasak_Province.html", asOf: "2026-07" },
    ],
    recognition: 'A pre-Angkorian Khmer temple stepping up the slope of Phou Kao mountain above the Mekong plain south of Pakse, approached along a causeway past two ruined stone barays.',
    localName: 'ວັດພູ · Wat Phou',
    categories: ["culture", "park", "viewpoint"], budgetTier: "low",
    blurb: "A UNESCO-listed pre-Angkorian Khmer temple complex stepping up a sacred mountainside above the Mekong plain, with a sanctuary, ancient causeways, frangipani-shaded terraces and a sweeping view from the upper shrine.",
    whyItFits: "For history lovers wanting major Khmer architecture without Angkor's crowds, on a quiet day trip from Pakse or Champasak town.",
    priceRange: { low: 50000, typical: 110000, high: 110000, currency: "LAK", note: "Foreigner entry around 50,000-110,000 LAK including the electric shuttle to the lower terraces." },
    hours: "Roughly 08:00-18:00 daily; site museum closes earlier",
    tips: ["Climb to the upper sanctuary early before the heat for the best light and views.", "Wear sturdy shoes; the upper stairs are steep and uneven.", "Visit during the Wat Phou Festival (around the February full moon) for the living pilgrimage."],
    scamWarnings: [],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Wat Phou Champasak Laos", coords: { lat: 14.8483, lng: 105.8217 },
    bookHint: "No booking; pay at the gate. Reachable by tuk-tuk or hire car from Pakse/Champasak.", verified: "2026-06",
    sources: [{ org: "UNESCO World Heritage", url: "https://whc.unesco.org/en/list/481" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-tad-yuang", name: "Tad Yuang Waterfall", city: "Paksong", country: "la",
    recognition: 'On the Bolaven coffee loop near Paksong, a broad roughly 40 m curtain of water with a viewpoint platform and a path leading down to the pool and behind the falls.',
    categories: ["waterfall", "nature"], budgetTier: "low",
    blurb: "A broad, photogenic 40 m waterfall on the Bolaven Plateau, framed by coffee-country forest, with a viewpoint platform and a path leading down to the splash pool and behind the curtain of water.",
    whyItFits: "One of the easiest and prettiest stops on the Bolaven coffee loop, less developed than nearby Tad Fane and good for a short walk and a swim.",
    priceRange: { low: 10000, typical: 15000, high: 20000, currency: "LAK", note: "Small entry/parking fee collected at the gate; bring cash in kip." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["Walk the loop trail down to the base and behind the falls when water levels allow.", "Pair it with Tad Fane and a Paksong coffee farm on the same loop.", "Footing is slippery near the pool; wear grippy shoes."],
    scamWarnings: [],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus", "Discover Laos"],
    mapQuery: "Tad Yuang Waterfall Paksong Bolaven", coords: { lat: 15.1900, lng: 106.1300 },
    bookHint: "No booking; ride or drive in on the Bolaven loop and pay at the gate.", verified: "2026-06",
    sources: [{ org: "Discover Laos Today", url: "https://discoverlaos.today" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-vieng-xai-caves", name: "Vieng Xai Caves", city: "Vieng Xai", country: "la",
    access: { stepFree: "no", note: "Downgraded from partial: every cave chamber (the actual attraction) is entered by staircase over dim, uneven natural rock, and the caves are spread far apart requiring vehicle or bicycle transport rather than being genuinely rollable between; not step-free." },
    categories: ["culture", "nature"], budgetTier: "low",
    blurb: "A network of limestone caves in remote Houaphanh that sheltered the Pathet Lao leadership and thousands of villagers from heavy bombing during the Secret War. An excellent audio-guided tour walks through the hidden hospital, theatre and homes.",
    whyItFits: "For history-minded travellers wanting a powerful, well-presented account of the war years, away from the usual tourist trail.",
    priceRange: { low: 60000, typical: 60000, high: 100000, currency: "LAK", note: "Guided tour with audio guide; morning and afternoon tour times are fixed, so arrive ahead." },
    hours: "Guided tours at set times, typically around 09:00 and 13:00",
    tips: ["Arrive before the scheduled tour start; entry is by guided tour only.", "Bring a light jacket for the cool cave interiors.", "The town is a long haul from Sam Neua; allow a full day or an overnight."],
    scamWarnings: [],
    rating: 4.6, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Vieng Xai Caves Houaphanh Laos", coords: { lat: 20.4167, lng: 104.2167 },
    bookHint: "Turn up at the Vieng Xai caves visitor centre ahead of a scheduled tour slot.", verified: "2026-06",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/northeastern-laos/vieng-xai" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-bokeo-gibbon", name: "The Gibbon Experience (Bokeo Nature Reserve)", city: "Huay Xai", country: "la",
    access: { stepFree: "no", note: "The multi-day activity is a steep, muddy jungle trek on earth-cut steps plus zipline platforms reached only on foot; the operator advises good fitness, making it unfeasible for wheelchair users." },
    categories: ["nature", "hike", "park"], budgetTier: "high",
    blurb: "A multi-day conservation adventure in the Bokeo Nature Reserve where you trek through forest, zip-line between giant trees and sleep in the world's highest tree-houses, listening for the dawn calls of wild black-crested gibbons.",
    whyItFits: "For active travellers wanting a once-in-a-trip jungle experience that directly funds gibbon and forest protection. Two- and three-day options exist.",
    priceRange: { low: 4000000, typical: 5500000, high: 6500000, currency: "LAK", note: "Per-person package (roughly 190-310 USD) including guides, zip-lines, tree-house stay and meals; book well in advance." },
    hours: "Fixed multi-day departures from the Huay Xai office; not a day visit",
    tips: ["Book ahead online; places are limited and sell out in peak season.", "Pack light into a day bag; heavy luggage is stored at the office.", "A reasonable level of fitness is needed for the treks and zip-lines."],
    scamWarnings: ["Book only through the official Gibbon Experience office in Huay Xai; imitators do not access the same reserve."],
    rating: 4.7, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Gibbon Experience Huay Xai Bokeo Laos", coords: { lat: 20.3300, lng: 100.7000 },
    bookHint: "Reserve online in advance via the official Gibbon Experience; check in at the Huay Xai office.", verified: "2026-06",
    sources: [{ org: "The Gibbon Experience (official)", url: "https://www.gibbonexperience.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-muang-ngoy", name: "Muang Ngoi Neua", city: "Nong Khiaw", country: "la",
    categories: ["nature", "viewpoint", "hike"], budgetTier: "low",
    blurb: "A tiny car-free riverside village reached by boat up the Nam Ou from Nong Khiaw, ringed by karst peaks, with hammock guesthouses, a viewpoint climb and walks out to caves and farming hamlets.",
    whyItFits: "For travellers wanting deep slow-travel calm with no traffic, just the river, the mountains and village life.",
    priceRange: { low: 25000, typical: 40000, high: 60000, currency: "LAK", note: "Shared boat fare from Nong Khiaw per person; cheaper guesthouses and meals are very inexpensive once there." },
    hours: "Boats from Nong Khiaw run mostly mid-morning; confirm the daily departure time",
    tips: ["Check the boat schedule both ways; departures can be limited to once or twice a day.", "Climb the village viewpoint at sunrise for the karst panorama.", "Bring enough cash; there is no ATM in the village."],
    scamWarnings: [],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Muang Ngoi Neua Laos", coords: { lat: 20.7000, lng: 102.6833 },
    bookHint: "Buy a boat ticket at the Nong Khiaw pier; choose a riverside guesthouse on arrival.", verified: "2026-06",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/northern-laos/muang-ngoi-neua" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
{
    id: "la-ext-nam-ha-ecotrek", name: "Nam Ha Protected Area Eco-Trek", city: "Luang Namtha", country: "la",
    access: { stepFree: "no", note: "A 10-15km guided jungle trek with steep climbs, muddy riverbanks and rocky ridges on unbuilt forest paths; there is no made-up trail, so it is not navigable by wheelchair." },
    categories: ["nature", "hike", "park"], budgetTier: "mid",
    blurb: "A pioneering community-based trekking programme in the Nam Ha protected area of the far north, where licensed local guides lead one to three day hikes through forest to Akha, Khmu and Lanten villages, with overnights in community lodges.",
    whyItFits: "For travellers who want responsible jungle trekking and genuine hill-village encounters, with fees shared among the host communities.",
    priceRange: { low: 400000, typical: 700000, high: 1400000, currency: "LAK", note: "Per person for a 1 to 3 day guided trek including guide, village homestay and meals; cheaper per head in a group." },
    hours: "Treks booked through Luang Namtha tour offices; multi-day departures",
    tips: ["Book through a licensed Luang Namtha operator that works with the protected-area programme.", "Bring sturdy shoes and a light pack; trails can be muddy in the wet season.", "Group bookings lower the per-person price considerably."],
    scamWarnings: ["Use only licensed operators tied to the Nam Ha community programme so fees reach the villages."],
    rating: 4.6, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Nam Ha National Protected Area Luang Namtha", coords: { lat: 20.9500, lng: 101.4000 },
    bookHint: "Book at a licensed trekking office in Luang Namtha town a day or two ahead.", verified: "2026-06",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/northern-laos/luang-namtha" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-katamtok", name: "Tad Katamtok Waterfall", city: "Paksong", country: "la",
    categories: ["waterfall", "nature", "viewpoint"], budgetTier: "low",
    blurb: "A remote and rarely visited waterfall on the Bolaven Plateau, plunging around 100 m in a single dramatic drop into a forested gorge, viewed from a quiet clifftop platform reached by rough back-roads.",
    whyItFits: "For adventurous travellers exploring the Bolaven loop who want a spectacular fall almost entirely to themselves, away from the busier cascades.",
    priceRange: { low: 0, typical: 10000, high: 20000, currency: "LAK", note: "Generally free or a small parking fee; the cost is the rough ride to reach it." },
    hours: "Daylight hours; clearest views in the dry season",
    tips: ["The access track is rough, so ride carefully or take a sturdy vehicle.", "There are few facilities, so bring water and snacks.", "Pair it with Tad Yuang and Tad Fane on a fuller Bolaven day."],
    scamWarnings: [],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus", "Discover Laos"],
    mapQuery: "Tad Katamtok Waterfall Bolaven Plateau Laos", coords: { lat: 15.0700, lng: 106.3000 },
    bookHint: "No booking; reach it by motorbike or hire car on the Bolaven loop.", verified: "2026-06",
    sources: [{ org: "Discover Laos Today", url: "https://discoverlaos.today" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-dong-natad", name: "Dong Natad Community Forest", city: "Savannakhet", country: "la",
    access: { stepFree: "no", note: "Visited on guided 10-14 km jungle treks over unpaved forest trails, rocky outcrops and bamboo groves; requires moderate fitness and cannot be navigated by wheelchair." },
    categories: ["nature", "culture"], budgetTier: "low",
    blurb: "A sacred old-growth forest and lake near Savannakhet where village-led half- and full-day tours show how locals harvest honey, mushrooms, insects and resin, ending with a home-cooked lunch by the water. A gentle window into rural Lao life.",
    whyItFits: "For travellers wanting easy, low-key community ecotourism and an authentic taste of southern Lao village livelihoods close to a town.",
    priceRange: { low: 100000, typical: 180000, high: 280000, currency: "LAK", note: "Per person for a guided community walk with lunch; lower per head in a small group." },
    hours: "Half- and full-day tours arranged through the Savannakhet eco-guide unit",
    tips: ["Book through the Savannakhet provincial tourism / eco-guide office.", "Combine it with the nearby That Ing Hang stupa.", "Bring insect repellent and water for the forest walk."],
    scamWarnings: [],
    rating: 4.3, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Dong Natad Savannakhet Laos", coords: { lat: 16.6200, lng: 104.8000 },
    bookHint: "Book through the Savannakhet eco-guide / provincial tourism office.", verified: "2026-06",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/southern-laos/savannakhet" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
{
    id: "la-ext-talat-sao", name: "Talat Sao Morning Market", city: "Vientiane", country: "la",
    recognition: 'Vientiane central market, a large multi-storey complex with an adjoining modern mall wing at the Lane Xang and Khu Vieng junction near the bus station.',
    localName: 'ຕະຫຼາດເຊົ້າ · Talat Sao',
    categories: ["market", "culture"], budgetTier: "low",
    blurb: "Vientiane main market, a sprawling complex selling textiles, silver, gold, handicrafts and electronics alongside a modern mall wing and a busy food court.",
    whyItFits: "For travellers wanting Lao textiles and silverware plus a cheap, varied lunch in the capital.",
    priceRange: { low: 0, typical: 0, high: 0, currency: "LAK", note: "Free to enter; bargain on handicrafts and bring kip for the food court." },
    hours: "Roughly 07:00-17:00 daily",
    tips: ["The food court is excellent value for a quick Lao lunch.", "Compare prices across stalls before buying textiles or silver."],
    scamWarnings: [],
    rating: 4.0, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Talat Sao Morning Market Vientiane", coords: { lat: 17.965, lng: 102.614 },
    bookHint: "No booking; central and walkable.", verified: "2026-06",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-phosy-market", name: "Phosy Market (Talat Phosy)", city: "Luang Prabang", country: "la",
    access: { stepFree: "partial", note: "A ground-level market (part covered hall for dry goods and cooked food, part open-air produce under umbrellas) with no stairs, but aisles are narrow and crowded and the wet-market sections have uneven, wet, slippery floors." },
    categories: ["market", "food"], budgetTier: "low",
    blurb: "The largest fresh market in Luang Prabang, where locals shop for produce, herbs, river fish, grilled snacks and Lao coffee well away from the tourist night market.",
    whyItFits: "For travellers wanting an authentic, non-touristy fresh market and a genuine taste of daily Lao life.",
    priceRange: { low: 0, typical: 0, high: 0, currency: "LAK", note: "Free to wander; bring small kip notes for snacks and coffee." },
    hours: "Best in the early morning, daily",
    tips: ["Go early for the freshest produce and the morning food stalls.", "It is a few kilometres from the centre, so take a tuk-tuk or bicycle."],
    scamWarnings: [],
    rating: 4.1, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Phosy Market Luang Prabang", coords: { lat: 19.886, lng: 102.143 },
    bookHint: "No booking; tuk-tuk or bicycle from the old town.", verified: "2026-06",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },

  // --- Phase 5 content batch 4: where to stay + signature experiences (Laos) ---
  {
    id: "la-ext-nongkhiaw-homestay", name: "Nong Khiaw & Muang Ngoi riverside homestay", city: "Nong Khiaw", country: "la",
    categories: ["stay", "nature", "culture"], budgetTier: "low",
    kidFriendly: true, stayType: "homestay", stayDuration: "short",
    activities: ["homestay", "trekking", "kayaking", "viewpoints", "village-life"],
    amenities: ["home-cooked-meals", "shared-bathroom", "river-views"],
    blurb: "Karst peaks rear straight out of the Nam Ou river at Nong Khiaw, and an hour upriver by boat lies road-free Muang Ngoi. Village families host guests for treks to hill-tribe villages, caves and the famous viewpoints.",
    whyItFits: "Northern Laos at its most beautiful and unhurried — for trekkers and families who want river life, viewpoints and a homestay over a hotel.",
    priceRange: { low: 100000, typical: 200000, high: 400000, currency: "LAK", note: "Per person per night; simple homestays and river bungalows. Guided treks and boats are booked separately in the village." },
    hours: "Arrive by boat or bus and check in during the afternoon",
    tips: ["Climb to the Nong Khiaw (Pha Daeng) viewpoint at dawn before it heats up.", "Take the Nam Ou boat to Muang Ngoi for the road-free village experience.", "Carry cash; ATMs are limited and often out of service."],
    scamWarnings: [],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Nong Khiaw homestay Nam Ou river", coords: { lat: 20.5667, lng: 102.6167 },
    bookHint: "Book a village homestay + trek on arrival, or a day or two ahead online.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-luangprabang-hostels", name: "Luang Prabang hostels", city: "Luang Prabang", country: "la",
    categories: ["stay", "hostel"], budgetTier: "low",
    kidFriendly: false, stayType: "hostel", stayDuration: "short",
    amenities: ["wifi", "air-con", "lockers", "common-area", "breakfast", "bicycles"],
    blurb: "The UNESCO old town and the streets just across the river hold friendly, good-value hostels — a cheap base for the dawn alms-giving, the night market and day trips to Kuang Si Falls.",
    whyItFits: "The most affordable, social short-stay base in Laos's loveliest town, walkable or a short bike ride from the temples and the river.",
    priceRange: { low: 80000, typical: 150000, high: 350000, currency: "LAK", note: "Per night for a dorm bed; privates run higher. Many rent bicycles and lend gear for the falls." },
    hours: "Check-in typically from 14:00",
    tips: ["Rent a bicycle — the old town is flat and pedestrian-friendly.", "If you watch the dawn alms-giving, stay back and quiet; do not buy sticky rice from touts to offer.", "Book ahead over Lao New Year (Pi Mai, April) when the town fills."],
    scamWarnings: [],
    rating: 4.4, reviewSources: ["Hostelworld", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Luang Prabang hostel old town", coords: { lat: 19.8845, lng: 102.1348 },
    bookHint: "Compare dorms on Hostelworld or Booking; walk-ins are easy outside Pi Mai.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-dondet-bungalows", name: "Si Phan Don (4000 Islands) river bungalows", city: "Don Det", country: "la",
    categories: ["stay", "nature", "beach"], budgetTier: "low",
    kidFriendly: true, stayType: "guesthouse", stayDuration: "both",
    activities: ["hammock", "kayaking", "cycling", "dolphin-watching", "waterfalls"],
    amenities: ["river-views", "hammocks", "restaurant", "bicycles"],
    blurb: "Where the Mekong braids into thousands of islets at the Cambodian border, Don Det and Don Khon offer the ultimate slow-down: riverside bungalows with a hammock, sunset over the water, and bikes to the falls and old French railway.",
    whyItFits: "The classic Laos chill-out — dirt-cheap river bungalows for backpackers, plus quieter Don Khon for families; easy to linger for days.",
    priceRange: { low: 80000, typical: 180000, high: 400000, currency: "LAK", note: "Per night; basic fan bungalows are cheapest, riverfront and air-con cost more." },
    hours: "Check-in afternoon; reached by boat from Nakasang",
    tips: ["Don Det's 'sunrise side' is quieter than the party 'sunset side'.", "Cycle to the Li Phi and Khone Phapheng falls and look for rare Irrawaddy dolphins off Don Khon.", "Electricity and wifi can be patchy; bring a power bank."],
    scamWarnings: [],
    rating: 4.3, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Don Det 4000 Islands bungalow Laos", coords: { lat: 13.9226, lng: 105.9403 },
    bookHint: "Many bungalows are walk-in; boats leave from Nakasang pier. Book ahead only in peak season.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-vientiane-longstay", name: "Vientiane long-stay (serviced apartments)", city: "Vientiane", country: "la",
    categories: ["stay", "apartment"], budgetTier: "mid",
    kidFriendly: true, stayType: "apartment", stayDuration: "long",
    activities: ["long-stay", "cafes", "cycling"],
    amenities: ["wifi", "kitchen", "pool", "laundry"],
    blurb: "Laos's low-key riverside capital has the country's best long-stay options: serviced apartments and small condos near the Mekong promenade, cafés and NGOs, with Thailand a short hop across the Friendship Bridge.",
    whyItFits: "The practical base for a month or more in Laos — quiet, walkable and cheap, with easy visa runs to Nong Khai in Thailand.",
    priceRange: { low: 5000000, typical: 8000000, high: 14000000, currency: "LAK", note: "Per MONTH on a longer lease (roughly 250–650 USD); nightly rates are far higher. Utilities usually extra." },
    hours: "Viewings by appointment",
    tips: ["Negotiate monthly rates directly with the building or a local agent.", "The riverfront and Chao Anouvong areas are the most walkable.", "Wifi is decent in the city but slower than Thailand/Vietnam — check speeds before committing to remote work."],
    scamWarnings: ["View the actual unit and read the lease before paying a deposit."],
    rating: 4.2, reviewSources: ["Google Maps consensus", "Expat community reports"],
    mapQuery: "Vientiane serviced apartment riverside", coords: { lat: 17.9757, lng: 102.6331 },
    bookHint: "Compare monthly listings with local agents; nightly OTAs are poor value for long stays.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }],
  },
  {
    id: "la-ext-vangvieng-outdoors", name: "Vang Vieng outdoor adventures", city: "Vang Vieng", country: "la",
    categories: ["nature", "hike", "beach"], budgetTier: "mid",
    kidFriendly: true,
    activities: ["kayaking", "tubing", "caving", "lagoons", "hot-air-balloon", "cycling"],
    blurb: "Once infamous for river-tubing party excess, Vang Vieng has reinvented itself as an outdoor playground amid dreamlike karst: kayak and tube the Nam Song, swim the blue lagoons, explore caves, and drift over it all in a dawn hot-air balloon.",
    whyItFits: "The most action-packed stop in Laos, now family-friendly by day — lagoons and caves for kids, balloons and viewpoints for everyone.",
    priceRange: { low: 50000, typical: 200000, high: 600000, currency: "LAK", note: "Tubing/kayak/lagoon entries are cheap (tens of thousands of LAK); balloon and zip-line rides are the pricey splurge." },
    hours: "Activities run daylight hours; balloons at sunrise and sunset",
    tips: ["Do the blue lagoons early — Lagoon 1 is closest and busiest; the further ones are quieter.", "Tubing is tamer and safer now, but wear a life jacket and skip it in high water.", "A sunrise hot-air balloon over the karsts is the signature splurge."],
    scamWarnings: ["Rent scooters from a reputable shop and photograph any existing damage to avoid deposit disputes."],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Vang Vieng blue lagoon Nam Song", coords: { lat: 18.9237, lng: 102.447 },
    bookHint: "Book activities in town on the day; balloons and zip-lines a day ahead in peak season.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-mekong-slowboat", name: "Mekong slow boat to Luang Prabang", city: "Huay Xai", country: "la",
    access: { stepFree: "no", note: "Boarding means descending a steep dirt riverbank and crossing narrow planks onto a low wooden long-boat fitted with fixed bench/car seats; there is no level boarding and no accessible facilities aboard." },
    categories: ["nature", "culture"], budgetTier: "mid",
    kidFriendly: true, stayDuration: "short",
    activities: ["boat", "mekong", "scenic", "villages"],
    blurb: "From Huay Xai on the Thai border, the two-day public slow boat drifts down the Mekong to Luang Prabang, overnighting in the river town of Pakbeng. It is a Southeast Asia rite of passage: riverbank villages, forested gorges and no hurry at all.",
    whyItFits: "A journey that is the destination — the classic, scenic way to arrive in Luang Prabang, and a memorable (if long) day for families who bring snacks and games.",
    priceRange: { low: 500000, typical: 800000, high: 1300000, currency: "LAK", note: "Public two-day slow boat, one way, excluding the Pakbeng guesthouse. Avoid the noisy, unsafe 'speedboats'." },
    hours: "Departs Huay Xai mid-morning; two days with a night in Pakbeng",
    tips: ["Bring a cushion, snacks and water — benches are hard and the day is long.", "Book the boat, not the fast 'speedboat' (loud and dangerous).", "Arrange your Pakbeng guesthouse on arrival; there are plenty."],
    scamWarnings: ["Buy the boat ticket at the pier office or a reputable agent, not from touts quoting inflated 'VIP' fares."],
    rating: 4.4, reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Huay Xai slow boat pier to Luang Prabang", coords: { lat: 20.276, lng: 100.4128 },
    bookHint: "Buy at the Huay Xai boat pier or via a guesthouse; combine with the Thai border crossing at Chiang Khong.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-namha-trek", name: "Nam Ha NPA trek & jungle camp (Luang Namtha)", city: "Luang Namtha", country: "la",
    categories: ["stay", "camping", "nature"], budgetTier: "mid",
    kidFriendly: true, stayType: "tent", stayDuration: "short",
    activities: ["trekking", "jungle", "camping", "kayaking", "wildlife", "village-visit"],
    amenities: ["guides", "meals-included", "tent", "homestay-nights"],
    blurb: "The Nam Ha National Protected Area is Laos's pioneering community ecotourism zone: guided one- to three-day treks through rainforest to overnight in simple jungle camps or ethnic-minority villages, with kayaking on the Nam Tha river and fees returning to the guides' communities.",
    whyItFits: "The tent-and-trek end of Laos, done responsibly — an authentic, low-cost wilderness experience. Gentle one-day and river options suit families; multi-day jungle camps suit hardier trekkers.",
    priceRange: { low: 350000, typical: 700000, high: 1500000, currency: "LAK", note: "Guidance, per person. One- to two-day community treks incl. guide, food and a camp or homestay night; longer trips cost more. A larger group lowers the per-person rate." },
    hours: "Trips depart Luang Namtha mornings; book a day ahead",
    tips: ["Book through a licensed Luang Namtha operator or the provincial tourism office, not touts.", "A larger group sharply cuts the per-person price — ask to join an existing departure.", "Go in the November–March dry season; bring a torch, long sleeves and cash."],
    scamWarnings: ["Use only licensed operators — they hold the NPA permits and share fees with the villages."],
    rating: 4.6, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Nam Ha NPA trekking Luang Namtha", coords: { lat: 20.9490, lng: 101.4025 },
    bookHint: "Book at a licensed Luang Namtha trekking office; join a group to lower the per-person cost.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-luangprabang-resort", name: "Luang Prabang riverside resort", city: "Luang Prabang", country: "la",
    categories: ["stay", "resort"], budgetTier: "high",
    kidFriendly: true, stayType: "resort", stayDuration: "short",
    activities: ["pool", "spa", "cycling", "temples", "boat", "waterfall"],
    amenities: ["pool", "spa", "restaurant", "river-view", "wifi", "bicycles", "airport-transfer"],
    blurb: "UNESCO-listed Luang Prabang wears its with-money tier beautifully: boutique resorts in restored French-Lao villas along the Mekong and Nam Khan, with gardens, pools, spas and river views, a short stroll from the night market and the dawn almsgiving.",
    whyItFits: "The luxury end of Laos, in its most enchanting town — a pool and spa to return to after Kuang Si Falls and temple mornings. Family suites and a gentle pace make it easy with children.",
    priceRange: { low: 900000, typical: 2000000, high: 6000000, currency: "LAK", note: "Guidance, per night. Low end is a smart 3★ with a pool; the high end is 5★ heritage resorts. Peak season (November–February) and festivals push rates up." },
    hours: "Check-in from early afternoon",
    tips: ["Stay on the Nam Khan (quieter) or Mekong (sunset) side, both walkable to the centre.", "Ask the resort to arrange the Kuang Si Falls trip and a sunset Mekong cruise.", "The old-town peninsula is a protected zone — watch the dawn almsgiving respectfully, from a distance."],
    scamWarnings: ["Book directly or via a reputable OTA; confirm airport pickup, as tuk-tuks overcharge from the airport."],
    rating: 4.7, reviewSources: ["Booking.com", "Agoda", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Luang Prabang riverside boutique resort", coords: { lat: 19.8867, lng: 102.1350 },
    bookHint: "Compare Booking/Agoda for the same villa resort; book river-view rooms and transfers ahead in peak season.", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-vientiane-herbal-sauna", name: "Traditional Lao Herbal Sauna at Wat Sok Pa Luang", city: "Vientiane", country: "la",
    access: { stepFree: "no", note: "Confirmed as a two-storey wooden building raised on tall stilts at the end of a garden path in the grove, with massage on bamboo beds in an open wooden hut; wooden steps up to the deck are unavoidable and there is no level access." },
    recognition: 'A raised wooden herbal-steam hut in the forested grounds of Wat Sok Pa Luang monastery on the southern edge of the city, with shaded rest decks around it.',
    localName: 'ວັດໂສກປາຫຼວງ · Wat Sok Pa Luang',
    categories: ["wellness", "culture"], budgetTier: "low",
    kidFriendly: false,
    activities: ["spa", "massage"],
    blurb: "A long-running temple-run herbal steam sauna in a leafy forest monastery on the edge of Vientiane, where steam is infused with lemongrass, kaffir lime and medicinal herbs. Visitors alternate steam sessions with rest on shaded wooden decks and can add a traditional Lao massage.",
    whyItFits: "It is a distinctive wellness and herbal-sauna experience, an activity not yet represented among the covered cities.",
    priceRange: { low: 15000, typical: 40000, high: 120000, currency: "LAK", note: "Guidance only: covers sauna entry per person; a traditional massage add-on is charged separately per hour per person." },
    hours: "Daily afternoons approximately 13:00 to 19:00",
    tips: ["Bring or rent a sarong and a towel, as you change before entering the steam room", "Drink plenty of water and rest between cycles, as the herbal steam is intense", "Arrive mid-afternoon on a weekday for a quieter, more meditative session"],
    scamWarnings: [],
    rating: 4.4, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Wat Sok Pa Luang herbal sauna, Vientiane, Laos", coords: { lat: 17.94, lng: 102.62 },
    bookHint: "Walk in; no reservation is needed for the sauna, though massages are first come first served", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-pakse-bolaven-coffee-tour", name: "Bolaven Plateau Coffee Farm Day Tour from Pakse", city: "Pakse", country: "la",
    categories: ["food", "nature", "culture"], budgetTier: "mid",
    kidFriendly: true,
    activities: ["coffee", "waterfall"],
    blurb: "A guided day loop from Pakse up onto the cool Bolaven Plateau to visit smallholder Arabica and Robusta farms, learn the harvest-to-roast process and taste freshly brewed Lao coffee. Most itineraries pair the farm with a stop at one of the plateau's roadside waterfalls.",
    whyItFits: "It is a signature coffee experience anchored in Pakse, a gateway city thinly covered in the current guide.",
    priceRange: { low: 250000, typical: 400000, high: 700000, currency: "LAK", note: "Guidance only: covers a shared small-group day tour per person including transport, guide and farm coffee tasting; lunch may be extra." },
    hours: "Full-day tours typically depart 08:30 and return late afternoon",
    tips: ["Bring a light layer, as the plateau is noticeably cooler and wetter than Pakse", "Buy roasted beans directly from the farm for the freshest and fairest-priced coffee", "Confirm whether lunch and waterfall entry fees are included when booking"],
    scamWarnings: ["Compare a couple of operators in Pakse, as some rebrand identical loops at inflated prices"],
    rating: 4.5, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Bolaven Plateau coffee farm, Pakse, Champasak, Laos", coords: { lat: 15.12, lng: 105.8 },
    bookHint: "Book through a Pakse guesthouse or tour agency the day before; private car options available", verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-vientiane-khao-piak-sen-shops", name: "Vientiane khao piak sen noodle shops", city: "Vientiane", country: "la",
    categories: ["food"], budgetTier: "low",
    isLocal: true,
    kidFriendly: true,
    blurb: "Morning-only shophouses across central Vientiane ladle out khao piak sen, the Lao comfort classic of hand-cut chewy rice-tapioca noodles in a gingery chicken or pork broth, finished at the table with crispy garlic, herbs, lime and chilli. Look for the busiest doorways around Ban Anou and the old quarter.",
    whyItFits: "Khao piak sen is the breakfast every Vientiane local swears by and it never appears on tourist menus done properly; hitting a morning noodle shop is the fastest way to eat like a resident.",
    priceRange: { low: 20000, typical: 30000, high: 50000, currency: "LAK", note: "Guidance per bowl; a standard bowl runs about 25,000-35,000 LAK, extra meat or a fried breadstick (patongko) for dunking adds 10,000-15,000 LAK." },
    hours: "Daily roughly 06:00-13:00; the best-known shops sell out of noodles by late morning",
    tips: ["Go before 09:00; the broth is richest and the hand-cut noodles freshest early", "Order a patongko fried doughstick to dip in the broth, the classic local move", "Season your own bowl from the caddy: crispy garlic oil, chilli, lime and fish sauce", "Pick whichever shop has the most motorbikes parked outside; locals vote with their wheels"],
    scamWarnings: ["Prices are honest at noodle shops; just confirm the note denominations when paying, as LAK bills have many zeroes"],
    rating: 4.6, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "khao piak sen Vientiane", coords: { lat: 17.97, lng: 102.61 },
    bookHint: "No booking; arrive early, share tables at busy shops", verified: "2026-07",
    sources: [{ org: "Tourism Laos (Ministry of Information, Culture and Tourism)", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-vientiane-ban-anou-night-market", name: "Ban Anou night food market", city: "Vientiane", country: "la",
    categories: ["food"], budgetTier: "low",
    isLocal: true,
    kidFriendly: true,
    blurb: "Every evening a short street in the Ban Anou quarter turns into Vientiane's favourite takeaway kitchen: charcoal grills of ping kai (grilled chicken) and Lao sausage, tubs of jeow dips, papaya salad pounded to order, crispy rice salad (nam khao), steamed sticky rice and coconut sweets, all sold by long-standing family stalls.",
    whyItFits: "It is the most concentrated, most local street-food cluster in the capital, ideal for assembling a classic Lao grazing dinner of sticky rice, grilled meat and tam mak hoong in one lane.",
    priceRange: { low: 10000, typical: 30000, high: 60000, currency: "LAK", note: "Guidance per item; skewers and sweets from about 10,000-20,000 LAK, a grilled chicken half or nam khao portion around 35,000-60,000 LAK." },
    hours: "Daily roughly 17:00-22:00; best selection between 18:00 and 20:00",
    tips: ["Ask for tam mak hoong pounded mild (bo pet) unless you genuinely want Lao-level chilli", "Buy sticky rice in a woven basket and eat with your fingers, pinch and dip style", "Most stalls are takeaway; carry your haul two blocks to the Mekong riverfront to eat", "Bring small LAK notes; stalls struggle to change 100,000 bills at peak time"],
    scamWarnings: ["Prices are posted or standard for locals; simply double-check the total when several items are bagged together"],
    rating: 4.4, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Ban Anou night market Vientiane", coords: { lat: 17.97, lng: 102.61 },
    bookHint: "No booking; takeaway stalls, come with an appetite and small notes", verified: "2026-07",
    sources: [{ org: "Tourism Laos (Ministry of Information, Culture and Tourism)", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-luang-prabang-belmond-phou-vao",
    recognition: 'A hilltop resort on Phou Vao just outside the old town, its lotus-pond spa and infinity pool looking across the temple roofs toward Mount Phousi.',
    name: "Belmond La Residence Phou Vao",
    city: "Luang Prabang",
    country: "la",
    categories: ["stay", "resort"],
    budgetTier: "high",
    stayType: "resort",
    stayDuration: "short",
    kidFriendly: true,
    isLocal: false,
    blurb: "A hilltop resort on Phou Vao, the 'hill of kites', overlooking Luang Prabang's temple roofs and Mount Phousi, known for its frangipani gardens, rosewood-and-cotton Lao interiors and an infinity pool facing the mountains. It has long been the town's flagship luxury address under the Belmond (formerly Orient-Express) group.",
    whyItFits: "A short, high-budget Luang Prabang stay with space and silence above the old town: sunset pool views toward Phousi, spa pavilions on a lotus pond and a free shuttle down to the night market and temples.",
    activities: [
      "infinity-pool",
      "spa-on-lotus-pond",
      "lao-cooking-class",
      "alms-giving-etiquette-briefing",
      "mount-phousi-views",
      "old-town-shuttle",
    ],
    amenities: [
      "infinity-pool",
      "spa",
      "restaurant",
      "bar",
      "gardens",
      "free-town-shuttle",
      "concierge",
      "airport-transfer",
      "free-wifi",
    ],
    priceRange: {
      low: 7000000,
      typical: 9500000,
      high: 14000000,
      currency: "LAK",
      note: "Guidance for a base Garden Junior Suite per night; pricing is effectively USD-linked (roughly USD 320-650), so LAK figures move with the exchange rate.",
    },
    hours: "Check-in ~14:00, check-out ~12:00",
    tips: [
      "The resort sits on a hill about ten minutes from the old town; use the complimentary shuttle rather than walking in the heat.",
      "Book a sunset table by the infinity pool for the view across to Mount Phousi.",
      "November to February is the cool, dry peak; book well ahead as the property is small.",
      "If you attend the dawn alms-giving, follow the etiquette briefing and keep a respectful distance from the monks.",
    ],
    scamWarnings: [
      "Arrange airport pickup through the resort; unlicensed drivers at Luang Prabang airport may overcharge for the short transfer.",
      "Buy alms-giving offerings only from reputable sources arranged by your hotel; street vendors near the route sell overpriced or spoiled rice to tourists.",
    ],
    rating: 4.7,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    externalRatings: [{ site: "Tripadvisor", score: 4, scale: 5, count: 1027, url: "https://www.tripadvisor.com/Hotel_Review-g295415-d505986-Reviews-Belmond_La_Residence_Phou_Vao-Luang_Prabang_Luang_Prabang_Province.html", asOf: "2026-07" }],
    mapQuery: "Belmond La Residence Phou Vao Luang Prabang",
    coords: { lat: 19.8765, lng: 102.1345 },
    bookHint: "Book directly with Belmond three or more months ahead for November-February, since the resort has few rooms and holiday weeks sell out early.",
    verified: "2026-07",
    sources: [
      { org: "Tourism Laos", url: "https://www.tourismlaos.org" },
      { org: "Tripadvisor", url: "https://www.tripadvisor.com" },
    ],
  },
  {
    id: "la-ext-vientiane-settha-palace",
    recognition: 'A restored 1932 French-colonial hotel on Pang Kham Street near the Nam Phou fountain, with a cream facade, shuttered windows and a palm-lined garden pool.',
    name: "Settha Palace Hotel",
    city: "Vientiane",
    country: "la",
    categories: ["stay", "hotel"],
    budgetTier: "high",
    stayType: "hotel",
    stayDuration: "short",
    kidFriendly: true,
    isLocal: false,
    activities: ["colonial-architecture", "poolside-relaxing", "riverfront-strolls", "temple-visits"],
    amenities: ["outdoor-pool", "garden", "restaurant", "bar", "air-con", "wifi"],
    blurb: "Built in 1932 during the French colonial period, the Settha Palace served as one of Vientiane's grand hotels before decades of other uses; it was restored and reopened as a hotel in the late 1990s. Period architecture, antique-styled rooms, a palm-lined pool and a small room count give it an old-world scale that is now rare in the city.",
    whyItFits: "The classic splurge night in Vientiane - colonial-era atmosphere, a quiet garden pool and a walkable position near the city centre fountain and riverfront.",
    priceRange: {
      low: 1800000,
      typical: 2600000,
      high: 3800000,
      currency: "LAK",
      note: "Guidance nightly rates converted from the USD prices the hotel typically quotes; kip figures shift with the exchange rate, so confirm at booking.",
    },
    hours: "Check-in ~14:00, check-out ~12:00",
    tips: [
      "The pool and garden are the quiet heart of the hotel, so build in a lazy afternoon.",
      "La Belle Epoque, the hotel restaurant, serves French and Lao menus in a period dining room.",
      "Pang Kham Street is walkable to the Nam Phou fountain area and the riverfront night market.",
    ],
    scamWarnings: [
      "Tuk-tuks waiting near upscale hotels open with inflated fares; negotiate down and agree the price before boarding.",
      "Rates are commonly quoted in USD; check the day's exchange rate before choosing to pay in kip or by card.",
    ],
    rating: 4.5,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    externalRatings: [{ site: "Tripadvisor", score: 4, scale: 5, count: 520, url: "https://www.tripadvisor.com/Hotel_Review-g293950-d307702-Reviews-Settha_Palace_Hotel-Vientiane_Vientiane_Prefecture.html", asOf: "2026-07" }],
    mapQuery: "Settha Palace Hotel Pang Kham Street Vientiane",
    coords: { lat: 17.968, lng: 102.604 },
    bookHint: "Book via the hotel's official website or a major booking platform a few weeks ahead for the November-February peak; the small room count means it fills early.",
    verified: "2026-07",
    sources: [
      {
        org: "Lao National Tourism, Ministry of Information, Culture and Tourism",
        url: "https://www.tourismlaos.org",
      },
      { org: "Tripadvisor", url: "https://www.tripadvisor.com" },
    ],
  },
  {
    id: "la-ext-si-phan-don-don-det-sunset-strip-kitchens",
    name: "Don Det sunset-strip Lao kitchens",
    city: "Si Phan Don",
    country: "la",
    categories: ["food"],
    isLocal: true,
    kidFriendly: true,
    budgetTier: "low",
    blurb: "Riverside Lao kitchens along the western sunset lane of Don Det in Si Phan Don, the 4000 Islands. Family restaurants on stilts over the Mekong serve laap, sticky rice, grilled river fish, papaya salad and fruit shakes as the sun drops behind the islands.",
    whyItFits: "The sunset strip is a recognised stretch of many small kitchens rather than one venue, so travellers can stroll until a menu and a hammock-side table appeal. It is the definitive slow-Laos island eating experience.",
    priceRange: {
      low: 30000,
      typical: 60000,
      high: 120000,
      currency: "LAK",
      note: "Guidance per dish; kip prices shift with the exchange rate, so treat menus as approximate",
    },
    hours: "Daily ~08:00-22:00; sunset dinner tables fill from ~17:30",
    tips: [
      "Arrive before sunset to claim a river-facing deck table",
      "Kitchens are one-family operations — order early and settle into island pace",
      "Carry a mix of kip denominations; change for large notes runs out in the evening",
    ],
    scamWarnings: [
      "Count change carefully — large kip denominations make short-changing easy to miss",
      "Avoid any 'happy' menu items; they contain illegal substances and penalties in Laos are severe",
      "Confirm whether prices are in kip or dollars when a menu shows both",
    ],
    rating: 4.3,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Don Det sunset side restaurants Si Phan Don",
    coords: { lat: 13.985, lng: 105.915 },
    bookHint: "No booking — walk the strip and sit down; cash (kip) only, and the nearest reliable ATMs are on the mainland at Nakasang or Pakse",
    verified: "2026-07",
    sources: [
      { org: "Lao National Tourism Administration (Tourism Laos)", url: "https://www.tourismlaos.org" },
      { org: "Tripadvisor", url: "https://www.tripadvisor.com" },
    ],
  },
  {
    id: "la-ext-wat-xieng-thong",
    access: { stepFree: "partial", note: "Entered at grade from the southern street gate and the compound grounds are broadly rollable, but the temple buildings sit on low stepped plinths with raised sills and the northern river approach is a long steep staircase, so no building interiors are step-free." },
    name: "Wat Xieng Thong",
    city: "Luang Prabang",
    country: "la",
    recognition: "At the northern tip of the peninsula, a temple with dramatically low sweeping roofs almost touching the ground and a coloured-glass tree-of-life mosaic covering the rear wall of the main hall.",
    localName: "ວັດຊຽງທອງ · Wat Xieng Thong",
    categories: ["temple", "culture"],
    budgetTier: "low",
    blurb: "The most revered temple in Luang Prabang, built in 1560 near the tip of the peninsula where the Nam Khan meets the Mekong. Its sweeping low-eaved roofs, gilded facades and a famous tree-of-life glass mosaic on the rear wall make it the finest example of classic Lao temple architecture.",
    whyItFits: "Suits culture-minded travellers who want the single most important temple in the old town, an easy walk from the night market.",
    priceRange: { low: 20000, typical: 30000, high: 30000, currency: "LAK", note: "Small foreigner entry fee collected at the gate; bring kip." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["Dress modestly with shoulders and knees covered, as it is an active temple.", "Visit late afternoon when tour groups thin and the light on the gilding is warmest.", "Look for the tree-of-life mosaic on the back exterior wall of the sim."],
    scamWarnings: [],
    rating: 4.6,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Wat Xieng Thong Luang Prabang",
    coords: { lat: 19.8955, lng: 102.1409 },
    bookHint: "No booking; pay at the gate and enter on foot.",
    verified: "2026-07",
    sources: [{ org: "UNESCO World Heritage", url: "https://whc.unesco.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-mount-phousi",
    access: { stepFree: "no", note: "The sacred hilltop is reached only by long stairways (328 steps on the Royal Palace side, 355 on the Nam Khan side) with no ramp or lift, so it is not wheelchair accessible." },
    name: "Mount Phousi",
    city: "Luang Prabang",
    country: "la",
    recognition: "A steep central hill crowned by a slim golden stupa (That Chomsi), reached by long stone staircases that start opposite the Royal Palace Museum.",
    localName: "ພູສີ · Phou Si",
    categories: ["viewpoint", "temple", "hike"],
    budgetTier: "low",
    blurb: "A steep 100 m forested hill rising in the middle of the old town, topped by the gilded That Chomsi stupa and reached by around 300 steps that pass small shrines and Buddha images. It is the classic sunset viewpoint over the Mekong, the Nam Khan and the surrounding karst hills.",
    whyItFits: "Suits everyone who wants the definitive Luang Prabang panorama; the short climb sits right in the centre of the peninsula.",
    priceRange: { low: 20000, typical: 20000, high: 30000, currency: "LAK", note: "Small summit entry fee near the top; the climb itself is otherwise free." },
    hours: "Roughly 06:00-18:00 daily; busiest at sunset",
    tips: ["Go up well before sunset to claim a spot, as the small summit fills quickly.", "Climb from the Nam Khan side and descend the palace side to see both staircases.", "Carry water; the steps are steep in the heat."],
    scamWarnings: [],
    rating: 4.3,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Mount Phousi Luang Prabang",
    coords: { lat: 19.8895, lng: 102.1375 },
    bookHint: "No booking; pay the small fee near the summit.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-royal-palace-museum-lpb",
    access: { stepFree: "no", note: "The palace (Haw Kham) is entered up a grand staircase with no documented ramp or lift; shoes must be removed and the galleries sit above ground level, so the building interior is not step-free." },
    name: "Royal Palace Museum (Haw Kham)",
    city: "Luang Prabang",
    country: "la",
    recognition: "A low cream-and-gold palace set behind a formal driveway and palms on Sisavangvong Road, facing the staircase up Mount Phousi.",
    localName: "ຫໍຄຳ · Haw Kham",
    categories: ["museum", "culture"],
    budgetTier: "low",
    blurb: "The former royal palace of the Lao monarchy, built in the early 1900s and now a museum of the kingdom, displaying throne rooms, royal regalia and diplomatic gifts. In an adjacent ornate hall sits the Phra Bang, the sacred gold Buddha image that gives the town its name.",
    whyItFits: "Suits history-minded visitors wanting the story of the Lao kings; it anchors the foot of Mount Phousi at the heart of the old town.",
    priceRange: { low: 30000, typical: 50000, high: 50000, currency: "LAK", note: "Foreigner entry fee; a small extra charge may apply for the vintage car pavilion." },
    hours: "Roughly 08:00-11:30 and 13:30-16:00; often closed Tuesday",
    tips: ["Dress modestly; shoes must be removed and bags left in lockers before entering the palace.", "Photography is not allowed inside the palace interior.", "Combine it with the Mount Phousi climb directly opposite."],
    scamWarnings: [],
    rating: 4.3,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Royal Palace Museum Luang Prabang",
    coords: { lat: 19.8886, lng: 102.1356 },
    bookHint: "No booking; buy a ticket at the gate and observe the dress and locker rules.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-patuxai",
    access: { stepFree: "partial", note: "Ramps reach the lower observation deck and surrounding plaza, but the climb to the very top of the monument is via a steep internal staircase." },
    name: "Patuxai Monument",
    city: "Vientiane",
    country: "la",
    recognition: "A large ochre concrete victory arch straddling the wide Lane Xang Avenue, with four towers, ornate Lao carvings and a musical fountain in the park in front.",
    localName: "ປະຕູໄຊ · Patuxai",
    categories: ["culture", "viewpoint"],
    budgetTier: "low",
    blurb: "Vientiane's war-memorial arch, completed in the late 1960s and often likened to a Lao take on the Arc de Triomphe, decorated with Buddhist and mythological motifs. Visitors can climb its internal stairs to a rooftop terrace overlooking the ceremonial Lane Xang Avenue.",
    whyItFits: "Suits first-time visitors wanting the capital's signature monument and a central rooftop view, an easy stroll from Talat Sao.",
    priceRange: { low: 5000, typical: 15000, high: 15000, currency: "LAK", note: "Small fee to climb to the upper terrace; the surrounding park is free." },
    hours: "Roughly 08:00-17:00 daily for the climb; the park is open longer",
    tips: ["Climb to the top terrace for the view straight down Lane Xang Avenue to the Presidential Palace.", "The fountains in the surrounding park run in the cool of the evening.", "It is walkable from Talat Sao and Pha That Luang for a combined loop."],
    scamWarnings: [],
    rating: 4.2,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Patuxai Monument Vientiane",
    coords: { lat: 17.9691, lng: 102.6169 },
    bookHint: "No booking; pay the small climb fee inside the arch.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-wat-sisaket",
    access: { stepFree: "partial", note: "The flat courtyard is broadly navigable but its surface is gravel/paved and can be uneven; the surrounding cloister of Buddha niches and the raised ordination hall (sim) are entered via steps with no ramp." },
    name: "Wat Sisaket",
    city: "Vientiane",
    country: "la",
    recognition: "A walled temple compound on the corner of Lane Xang and Setthathirath, its inner cloister lined with hundreds of tiny Buddha figures set into the walls.",
    localName: "ວັດສີສະເກດ · Wat Sisaket",
    categories: ["temple", "culture"],
    budgetTier: "low",
    blurb: "The oldest surviving temple in Vientiane, built in 1818 in a Siamese style that helped it escape destruction in the 1828 sacking of the city. Its cloister walls hold thousands of small niche Buddha images alongside rows of larger seated statues.",
    whyItFits: "Suits culture travellers wanting the capital's most atmospheric historic temple, across the road from the Ho Phra Keo museum.",
    priceRange: { low: 10000, typical: 30000, high: 30000, currency: "LAK", note: "Small foreigner entry fee; cash in kip." },
    hours: "Roughly 08:00-12:00 and 13:00-16:00 daily",
    tips: ["Walk the shaded cloister to see the thousands of miniature Buddha niches.", "It faces the Ho Phra Keo museum, so visit both together.", "Dress modestly as it remains an active temple."],
    scamWarnings: [],
    rating: 4.4,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Wat Sisaket Vientiane",
    coords: { lat: 17.9642, lng: 102.6098 },
    bookHint: "No booking; pay at the entrance.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-coffee-bolaven-tad-champee",
    name: "Tad Champee Waterfall",
    city: "Paksong",
    country: "la",
    recognition: "A wide low waterfall on the Bolaven Plateau feeding a broad, calm swimming pool reached by a short forest path from the roadside parking, near KM38 on the Pakse-Paksong road opposite Tad Fane.",
    categories: ["waterfall", "nature"],
    budgetTier: "low",
    blurb: "A quieter Bolaven Plateau waterfall near Paksong where a broad curtain of water drops into a wide swimming pool set among coffee-country forest. A short walk from the parking area reaches the pool, which is calm enough to swim in the dry season.",
    whyItFits: "Suits Bolaven loop riders who want a swimmable, less-crowded fall to pair with the bigger Tad Fane and Tad Yuang.",
    priceRange: { low: 10000, typical: 15000, high: 20000, currency: "LAK", note: "Small entry or parking fee collected at the gate; bring kip." },
    hours: "Daylight hours; best water clarity in the dry season",
    tips: ["The pool is one of the more swimmable on the plateau in the dry months.", "Combine it with Tad Fane and Tad Yuang on a single Bolaven loop day.", "Facilities are basic, so carry water and small kip notes."],
    scamWarnings: [],
    rating: 4.2,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Tad Champee Waterfall Paksong Bolaven",
    coords: { lat: 15.192, lng: 106.128 },
    bookHint: "No booking; ride in on the loop and pay at the gate.",
    verified: "2026-07",
    sources: [{ org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-savannakhet-dinosaur-museum",
    name: "Savannakhet Dinosaur Museum",
    city: "Savannakhet",
    country: "la",
    recognition: "A modest single-storey museum on Khanthabouli Road in central Savannakhet, its frontage marked with dinosaur imagery and fossil displays inside.",
    categories: ["museum", "culture"],
    budgetTier: "low",
    blurb: "A small provincial museum in downtown Savannakhet displaying fossils and dinosaur bones excavated from sites across the surrounding province, one of Laos's richest fossil regions. Exhibits are presented with the help of French palaeontologists who have long worked the local digs.",
    whyItFits: "Suits curious travellers and families passing through Savannakhet who want an offbeat, low-cost stop the guidebooks under-cover.",
    priceRange: { low: 5000, typical: 15000, high: 20000, currency: "LAK", note: "Small entry fee; cash in kip." },
    hours: "Roughly 08:00-12:00 and 13:00-16:00; often closed Sunday",
    tips: ["Staff can explain the provincial dig sites; a small guide donation is appreciated.", "It is walkable within the old French quarter grid.", "Combine it with a wander of Savannakhet's colonial streets and riverfront."],
    scamWarnings: [],
    rating: 3.9,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Savannakhet Dinosaur Museum Laos",
    coords: { lat: 16.5636, lng: 104.7503 },
    bookHint: "No booking; pay at the door during opening hours.",
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-that-ing-hang",
    access: { stepFree: "partial", note: "The stupa stands on three stepped terrace bases that cannot be rolled onto, but the surrounding compound courtyard is broadly flat, so a wheelchair user can approach and circle it at ground level. Expect a raised threshold at the entrance and shoe removal near the shrine." },
    name: "That Ing Hang Stupa",
    city: "Savannakhet",
    country: "la",
    recognition: "A tapering white-and-gold stupa richly decorated with stucco reliefs, standing in a walled compound in rice country northeast of Savannakhet.",
    localName: "ທາດອິງຮັງ · That Ing Hang",
    categories: ["temple", "culture"],
    budgetTier: "low",
    blurb: "A revered gold-tipped stupa about 13 km northeast of Savannakhet town, one of the holiest religious monuments in southern Laos. Its ornate stucco-decorated tower dates in its present form to the sixteenth century and draws a major pilgrimage festival each dry season.",
    whyItFits: "Suits culture travellers wanting the south's most important stupa on a short trip out of Savannakhet, well off the northern tourist trail.",
    priceRange: { low: 0, typical: 10000, high: 20000, currency: "LAK", note: "Generally free or a small donation; transport from town is the main cost." },
    hours: "Daylight hours daily",
    tips: ["Dress modestly; women are traditionally asked not to enter the inner enclosure.", "The annual festival falls around the December-January full moon and is the liveliest time to visit.", "Hire a tuk-tuk from Savannakhet and agree the round trip and waiting time."],
    scamWarnings: [],
    rating: 4.2,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "That Ing Hang Stupa Savannakhet",
    coords: { lat: 16.6333, lng: 104.8333 },
    bookHint: "No booking; arrange a return tuk-tuk from Savannakhet town.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-tham-chang-cave",
    name: "Tham Chang Cave",
    city: "Vang Vieng",
    country: "la",
    recognition: "A cave reached by a blue footbridge across the Nam Song and a long concrete staircase up the cliff, with a railed viewpoint terrace at the entrance.",
    localName: "ຖ້ຳຈັງ · Tham Chang",
    categories: ["nature", "viewpoint"],
    budgetTier: "low",
    blurb: "An illuminated limestone cave in the cliff behind the Vang Vieng Resort, reached by a footbridge over the Nam Song and a steep staircase. A viewing platform at the cave mouth looks out over the river and karst valley, and a cold spring at the base is popular for a swim.",
    whyItFits: "Suits families and casual visitors wanting an easy, central cave and viewpoint without a long hike or rough drive.",
    priceRange: { low: 15000, typical: 25000, high: 40000, currency: "LAK", note: "Cave entry plus a small bridge toll; the spring swim may be a separate small fee." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["The staircase is steep but short; the viewpoint at the mouth is the main reward.", "The cold spring pool at the foot of the cliff is refreshing on a hot day.", "It is within walking or short cycling distance of central Vang Vieng."],
    scamWarnings: [],
    rating: 4,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Tham Chang Cave Vang Vieng",
    coords: { lat: 18.9153, lng: 102.4436 },
    bookHint: "No booking; pay at the bridge and cave entrance.",
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-blue-lagoon-1",
    name: "Blue Lagoon 1 (Tham Poukham)",
    city: "Vang Vieng",
    country: "la",
    recognition: "A vivid turquoise pool at the base of a cliff with a big tree overhanging the water, wooden platforms and a rope swing, below the mouth of the Tham Poukham cave.",
    categories: ["nature", "viewpoint"],
    budgetTier: "low",
    blurb: "The original and most famous Vang Vieng swimming spot, a bright blue-green spring-fed pool about 7 km west of town at the foot of a karst cliff. Above it a short but steep climb reaches Tham Poukham, a cave holding a reclining golden Buddha.",
    whyItFits: "Suits swimmers and day-trippers wanting the classic lagoon with a tree rope-swing plus a cave to explore, on an easy scooter ride from town.",
    priceRange: { low: 10000, typical: 20000, high: 40000, currency: "LAK", note: "Small lagoon entry; a torch rental or guide for the cave costs a little extra." },
    hours: "Roughly 08:00-18:00 daily",
    tips: ["Go early or late in the day to avoid the busiest crowds at this most-visited lagoon.", "Climb up to Tham Poukham cave for the reclining Buddha and a valley view.", "Bring a torch or head-torch for the cave and grippy shoes for the climb."],
    scamWarnings: ["Confirm which of the numbered blue lagoons your driver is heading to, as touts sometimes substitute a different one."],
    rating: 4.1,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Blue Lagoon 1 Tham Poukham Vang Vieng",
    coords: { lat: 18.9231, lng: 102.3789 },
    bookHint: "No booking; ride out by scooter and pay at the gate.",
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-buddha-cave-thakhek",
    access: { stepFree: "no", note: "The cave sits high on a cliff and is reached only by a steep concrete/bamboo staircase, and the entrance is a tiny hole you must duck and squeeze through \u2014 impossible for a wheelchair user." },
    name: "Buddha Cave (Tham Pa Fa)",
    city: "Thakhek",
    country: "la",
    recognition: "A cave high in a limestone cliff northeast of Thakhek off Route 12, reached by a steep concrete staircase, holding rows of small bronze Buddha figures behind a rail.",
    localName: "ຖ້ຳພະ · Tham Pha",
    categories: ["culture", "nature", "temple"],
    budgetTier: "low",
    blurb: "A cliff-side cave near Thakhek discovered in 2004 when a villager found scores of centuries-old bronze Buddha images stored inside, reached by a steep staircase up the limestone face. It has since become an active pilgrimage shrine and an easy first stop on the Thakhek Loop.",
    whyItFits: "Suits loop riders and culture travellers wanting a short, atmospheric cave shrine close to Thakhek town.",
    priceRange: { low: 5000, typical: 15000, high: 20000, currency: "LAK", note: "Small entry and parking fee; a sarong may be required and can be rented." },
    hours: "Daylight hours; can flood in the peak wet season",
    tips: ["Dress modestly; the cave is an active shrine and a sarong may be required.", "The access road can flood after heavy rain, so check conditions in the wet season.", "It sits near the start of the Thakhek Loop, so combine it with the first-day caves."],
    scamWarnings: [],
    rating: 4,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Buddha Cave Tham Pa Fa Thakhek Khammouane",
    coords: { lat: 17.42, lng: 104.95 },
    bookHint: "No booking; pay the small fee at the base of the staircase.",
    verified: "2026-07",
    sources: [{ org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-plain-of-jars-2",
    access: { stepFree: "no", note: "The jars sit on top of two low hills split by the access road, reached by stone steps up from an uneven, rocky path; the ground turns muddy and slippery when wet. Not passable for a wheelchair." },
    name: "Plain of Jars — Site 2 (Hai Hin Phu Salato)",
    city: "Phonsavan",
    country: "la",
    recognition: "Two low tree-covered hills reached by a short walk from a rural car park, with big stone jars scattered under the shade and flagged safe paths between them.",
    categories: ["culture", "nature", "hike"],
    budgetTier: "low",
    blurb: "A quieter cluster of the UNESCO Plain of Jars set on two wooded hillocks about 25 km south of Phonsavan, where dozens of large Iron Age stone jars sit among trees. Its forested, elevated setting makes it more atmospheric and far less crowded than Site 1.",
    whyItFits: "Suits history travellers who want the jars without tour buses; it pairs naturally with the nearby Site 3 on a half-day loop.",
    priceRange: { low: 10000, typical: 15000, high: 20000, currency: "LAK", note: "Site entry plus a small parking fee; charged separately from Site 1." },
    hours: "Roughly 08:00-17:00 daily",
    tips: ["Stay strictly on the marked, cleared paths, as unexploded ordnance can remain off-trail.", "Combine Site 2 with the nearby Site 3 on a single trip from Phonsavan.", "A guide or Phonsavan tour links the sites and adds war-era context."],
    scamWarnings: [],
    rating: 4.3,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Plain of Jars Site 2 Phu Salato Phonsavan",
    coords: { lat: 19.3833, lng: 103.1667 },
    bookHint: "Pay at the site booth; arrange a multi-site tour or driver in Phonsavan.",
    verified: "2026-07",
    sources: [{ org: "Wikivoyage — Plain of Jars", url: "https://en.wikivoyage.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-don-khong-island",
    name: "Don Khong Island",
    city: "Si Phan Don",
    country: "la",
    recognition: "A broad flat Mekong island with two main villages (Muang Khong and Muang Saen), a riverfront lined with older shophouses and a modern bridge linking it to the mainland.",
    categories: ["nature", "stay", "culture"],
    budgetTier: "low",
    blurb: "The largest island in the 4000 Islands and the most laid-back, with sleepy riverside villages, old French-era buildings and quiet lanes ideal for cycling between rice paddies and temples. It offers a calmer, more local alternative to backpacker-heavy Don Det and Don Khon.",
    whyItFits: "Suits slow travellers who want Mekong-island life at its most peaceful, with easy flat cycling and genuine village calm.",
    priceRange: { low: 60000, typical: 150000, high: 350000, currency: "LAK", note: "Per-night guidance for a simple guesthouse room; bicycle hire is a few thousand kip a day." },
    hours: "Open access; guesthouses check in during the afternoon",
    tips: ["Rent a bicycle to loop the quiet lanes between rice fields and village temples.", "Muang Khong on the east side has the main cluster of guesthouses and river views.", "Bring enough cash, as banking on the island is limited."],
    scamWarnings: [],
    rating: 4.2,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Don Khong Island Muang Khong Si Phan Don",
    coords: { lat: 14.1167, lng: 105.85 },
    bookHint: "Reach it by road bridge or boat; choose a guesthouse in Muang Khong on arrival.",
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-wat-phou-champasak-town",
    name: "Champasak Town Riverside",
    city: "Champasak",
    country: "la",
    recognition: "A single sleepy road along the Mekong with a small roundabout fountain, low colonial-era shophouses and guesthouse verandas facing the river.",
    categories: ["culture", "stay", "food"],
    budgetTier: "low",
    blurb: "A quiet one-street town strung along the west bank of the Mekong, lined with faded French-colonial and traditional Lao wooden houses and a scattering of guesthouses. It is the natural base for visiting Wat Phou, a short ride to the south.",
    whyItFits: "Suits travellers who want to overnight near Wat Phou in a sleepy riverside village rather than day-tripping from Pakse.",
    priceRange: { low: 60000, typical: 150000, high: 350000, currency: "LAK", note: "Per-night guidance for a riverside guesthouse; simple room, meals extra and inexpensive." },
    hours: "Open access; guesthouses and riverside cafes keep daytime and evening hours",
    tips: ["Base here overnight to reach Wat Phou early before the day-trippers arrive from Pakse.", "Rent a bicycle to explore the colonial-era street and riverbank.", "Sunset drinks on a riverside veranda are the town's main evening event."],
    scamWarnings: [],
    rating: 4.1,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Champasak town riverside Laos",
    coords: { lat: 14.8933, lng: 105.8722 },
    bookHint: "No booking needed off-peak; reachable by bus, boat or tuk-tuk from Pakse.",
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-taec-lpb",
    access: { stepFree: "no", note: "Housed in a raised 1920s former French judge's villa at the foot of Phousi Hill, reached up a steep drive; multiple independent sources confirm several steps to enter and exhibition levels sit above ground with no documented lift or ramp." },
    name: "Traditional Arts and Ethnology Centre (TAEC)",
    city: "Luang Prabang",
    country: "la",
    recognition: "A restored two-storey villa on a lane below Mount Phousi, marked as the TAEC, with an artisan fair-trade shop and small cafe attached.",
    categories: ["museum", "culture"],
    budgetTier: "low",
    blurb: "A well-curated independent museum in the old town dedicated to the diverse ethnic groups of Laos, displaying textiles, costumes, tools and household objects with clear English explanations. A fair-trade shop and cafe support the artisan communities represented in the collection.",
    whyItFits: "Suits travellers wanting real context on Laos's ethnic diversity beyond temples, in a compact, air-conditioned old-town museum.",
    priceRange: { low: 25000, typical: 40000, high: 50000, currency: "LAK", note: "Foreigner entry fee; the shop and cafe are separate." },
    hours: "Roughly 09:00-18:00; often closed Monday",
    tips: ["Allow an hour for the well-labelled ethnic textile and costume displays.", "The shop sells fairly traded handicrafts direct from the featured communities.", "It is a short walk uphill from the Royal Palace Museum and night market."],
    scamWarnings: [],
    rating: 4.5,
    reviewSources: ["Tripadvisor", "Google Maps consensus", "Lonely Planet"],
    mapQuery: "Traditional Arts and Ethnology Centre Luang Prabang",
    coords: { lat: 19.8869, lng: 102.1361 },
    bookHint: "No booking; pay entry at the door during opening hours.",
    verified: "2026-07",
    sources: [{ org: "Traditional Arts and Ethnology Centre", url: "https://www.taeclaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-that-dam-vientiane",
    access: { stepFree: "yes", note: "The Black Stupa sits on a traffic roundabout viewable from level paved pathways; the approach is accessible and there is no climbing involved." },
    name: "That Dam (Black Stupa)",
    city: "Vientiane",
    country: "la",
    recognition: "A tall, dark, bell-shaped brick stupa stripped of its gilding, standing alone on a small roundabout amid cafes near the US embassy area.",
    localName: "ທາດດຳ · That Dam",
    categories: ["culture"],
    budgetTier: "low",
    blurb: "A large weathered brick stupa standing on a roundabout in central Vientiane, its darkened, moss-flecked surface giving it the name Black Stupa. Local legend holds that a protective seven-headed naga once dwelt within to guard the city.",
    whyItFits: "Suits city walkers wanting a quick, free landmark with a legend attached, ringed by cafes in the diplomatic quarter.",
    priceRange: { low: 0, typical: 0, high: 0, currency: "LAK", note: "Free to view from the surrounding roundabout at any time." },
    hours: "Open at all times; viewed from the exterior",
    tips: ["There is nothing to enter; it is a quick photo stop viewed from the roundabout.", "Surrounding cafes make it an easy break on a central walking loop.", "Pair it with nearby Wat Sisaket and the riverfront."],
    scamWarnings: [],
    rating: 3.8,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "That Dam Black Stupa Vientiane",
    coords: { lat: 17.9672, lng: 102.6083 },
    bookHint: "No booking; it stands on a public roundabout.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-vangvieng-riverside-guesthouses",
    name: "Riverside guesthouses, Vang Vieng",
    city: "Vang Vieng",
    country: "la",
    categories: ["stay", "guesthouse", "nature"],
    stayType: "guesthouse",
    stayDuration: "short",
    kidFriendly: true,
    amenities: ["river-views", "wifi", "restaurant", "balcony", "bicycles"],
    budgetTier: "low",
    blurb: "A dense cluster of family-run guesthouses and small bungalow places lines the Nam Song riverbank on the western edge of Vang Vieng town, most with balconies or decks facing the limestone karsts. They sit a block or two off the busy main street, walkable to tour agencies, cafes and the toll bridge to the lagoons.",
    whyItFits: "The most convenient and best-value short-stay base in Vang Vieng, with karst-and-river views yet a short stroll to activities. Choosing the riverbank row rather than a single named property keeps the recommendation stable as businesses change hands.",
    priceRange: { low: 100000, typical: 250000, high: 600000, currency: "LAK", note: "Per night; a simple fan or air-con double at a riverbank guesthouse. Riverfront rooms and newer builds cost more; dorms and back rooms are cheaper." },
    hours: "Check-in typically from 14:00",
    tips: ["Ask for a river-facing room for the karst-and-sunset view, which is the whole point of staying on this side.", "The riverbank blocks are quieter than the main bar street a short walk inland.", "Book ahead over Lao New Year (Pi Mai, April) and the cool-season peak when the town fills."],
    scamWarnings: ["Rent scooters from a reputable shop and photograph any existing damage to avoid deposit disputes on return."],
    rating: 4.2,
    reviewSources: ["Booking.com", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Vang Vieng riverside guesthouse Nam Song",
    coords: { lat: 18.9235, lng: 102.4455 },
    bookHint: "Compare riverbank guesthouses on Booking or Agoda; walk-ins are easy outside the April and cool-season peaks.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Travelfish", url: "https://www.travelfish.org" }],
  },
  {
    id: "la-ext-vangvieng-riverside-food",
    access: { stepFree: "partial", note: "Food and souvenir stalls line a flat central-town street with some outdoor seating, browsable on the level, but the surface is mixed paved/dirt and getting down toward the riverside means curbs and uneven ground." },
    name: "Vang Vieng riverside & night-market food stalls",
    city: "Vang Vieng",
    country: "la",
    categories: ["food", "market", "streetfood"],
    isLocal: true,
    kidFriendly: true,
    budgetTier: "low",
    blurb: "In the evening the lanes near the old market and the Nam Song riverbank in central Vang Vieng fill with charcoal grills and food stalls: ping kai grilled chicken, Lao sausage, papaya salad pounded to order, sticky rice, fruit shakes and cheap noodle soups. It is where locals and budget travellers assemble a grazing dinner away from the pricier tourist restaurants.",
    whyItFits: "The cheapest, most local way to eat in Vang Vieng, and a stable cluster of many stalls rather than one venue, so travellers can wander until a grill appeals. It fills the town's gap for genuine street food over sit-down cafes.",
    priceRange: { low: 10000, typical: 35000, high: 70000, currency: "LAK", note: "Guidance per item; skewers and sticky rice from about 10,000-20,000 LAK, a grilled chicken half or a papaya-salad-and-rice plate around 30,000-60,000 LAK." },
    hours: "Daily roughly 17:00-22:00; best selection between 18:00 and 20:00",
    tips: ["Ask for tam mak hoong (papaya salad) pounded mild unless you genuinely want Lao-level chilli.", "Buy sticky rice in its woven basket and eat with your fingers, pinch-and-dip style.", "Carry small kip notes; stalls struggle to change large bills at peak time."],
    scamWarnings: ["Agree the price before ordering at unmarked stalls, as a higher rate is sometimes quoted to foreigners."],
    rating: 4.1,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Vang Vieng night market food stalls Nam Song",
    coords: { lat: 18.9243, lng: 102.4462 },
    bookHint: "No booking; walk the market lanes and riverbank after dusk with small notes and an appetite.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-pakse-town-guesthouses",
    name: "Guesthouses around the town centre, Pakse",
    city: "Pakse",
    country: "la",
    categories: ["stay", "guesthouse"],
    stayType: "guesthouse",
    stayDuration: "short",
    kidFriendly: true,
    amenities: ["wifi", "air-con", "restaurant", "tour-desk", "airport-transfer"],
    budgetTier: "low",
    blurb: "Pakse, the gateway to southern Laos, has a compact grid of budget and mid-range guesthouses in the town centre between Route 13 and the Sedone and Mekong rivers, many run by families who also rent motorbikes for the Bolaven Loop. They cluster within easy walking distance of Daoheuang Market, tour desks and the riverfront.",
    whyItFits: "The practical base for the Bolaven Plateau, Wat Phou and the 4000 Islands, with cheap central rooms and loop-ready motorbike hire. A town-centre cluster keeps the recommendation stable as individual guesthouses open and close.",
    priceRange: { low: 90000, typical: 200000, high: 450000, currency: "LAK", note: "Per night; a simple fan or air-con double at a central guesthouse. Newer mid-range rooms and river-view hotels cost more." },
    hours: "Check-in typically from 14:00",
    tips: ["Many guesthouses rent the motorbikes people use for the two- or three-day Bolaven Loop; check the bike over before signing.", "Stay near the centre to walk to Daoheuang Market, tour agencies and the bus links.", "Confirm whether onward bus or minivan tickets booked through your guesthouse include the town transfer."],
    scamWarnings: ["Inspect any rental motorbike and photograph existing damage before the Bolaven Loop to avoid deposit disputes on return.", "Agree tuk-tuk fares from the bus terminals into town in advance, as arrival pricing is often inflated."],
    rating: 4.1,
    reviewSources: ["Booking.com", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Pakse town centre guesthouse Champasak Laos",
    coords: { lat: 15.1198, lng: 105.7987 },
    bookHint: "Compare central guesthouses on Booking or Agoda; walk-ins are straightforward outside peak season.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Travelfish", url: "https://www.travelfish.org" }],
  },
  {
    id: "la-ext-pakse-daoheuang-food",
    access: { stepFree: "partial", note: "A large sprawling covered market zoned by product with a food court, all on one broadly flat concrete level (no stairs), but aisles are narrow and crowded and entrances may carry low thresholds or curbs." },
    name: "Daoheuang Market food court, Pakse",
    city: "Pakse",
    country: "la",
    localName: "ຕະຫຼາດດາວເຮືອງ · Talat Dao Heuang",
    categories: ["food", "market", "streetfood"],
    isLocal: true,
    kidFriendly: true,
    budgetTier: "low",
    blurb: "Daoheuang Market (also called the New Pakse Market) is the largest market in southern Laos, and along one edge runs a busy food court with a barbecue section of grilled meats, skewers and sticky rice plus rows of stir-fry and noodle stalls. It is an all-day place to eat cheaply among locals shopping for produce, coffee and regional specialities.",
    whyItFits: "The single best spot in Pakse to eat like a resident, with a huge range of Lao dishes at market prices in one covered area. As a long-standing landmark market it is a stable, easy-to-find anchor for street food.",
    priceRange: { low: 10000, typical: 35000, high: 70000, currency: "LAK", note: "Guidance per dish; a bowl of noodles or a rice plate runs about 20,000-40,000 LAK, grilled meats and a spread of sides a little more." },
    hours: "Roughly 07:00-18:00 daily; food court busiest at lunchtime",
    tips: ["Head to the barbecue and grill section for ping kai, skewers and sticky rice.", "Buy a bag of freshly roasted Bolaven coffee here at fair market prices.", "Bring small kip notes; stalls are cash-only and change for big bills is limited."],
    scamWarnings: ["Prices are generally standard for locals; simply confirm the total when several items are bagged together."],
    rating: 4,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Daoheuang Market Pakse Champasak",
    coords: { lat: 15.1058, lng: 105.8067 },
    bookHint: "No booking; go for lunch with small notes and an empty stomach.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-pakse-ban-tong-night-market",
    access: { stepFree: "partial", note: "Food stalls line a flat riverfront promenade you can browse on the level, but there are no tables or chairs \u2014 to sit and eat you must move onto the riverbank via steps or slopes down toward the Mekong." },
    name: "Pakse riverside night market food stalls",
    city: "Pakse",
    country: "la",
    categories: ["food", "market", "streetfood"],
    isLocal: true,
    kidFriendly: true,
    budgetTier: "low",
    blurb: "In the evening a riverside night market sets up near the Sedone in central Pakse, with food stalls where you can watch light meals, grilled snacks, papaya salad and sweets prepared in front of you. There is no table service, so most people graze while strolling the riverfront.",
    whyItFits: "A relaxed, local evening-eating cluster that complements the daytime Daoheuang food court, ideal for a cheap riverside dinner. A stall-lined riverfront market is a stable anchor rather than a single vendor.",
    priceRange: { low: 10000, typical: 30000, high: 60000, currency: "LAK", note: "Guidance per item; skewers and sweets from about 10,000-20,000 LAK, a grilled snack or salad plate around 30,000-50,000 LAK." },
    hours: "Daily roughly 17:00-22:00; best around 18:00-20:00",
    tips: ["Most stalls are takeaway, so buy a spread and eat looking over the river.", "Pair grilled meat and sticky rice with a pounded papaya salad for the classic Lao trio.", "Carry small kip notes, as change for large bills runs out at peak time."],
    scamWarnings: ["Confirm the total when several items are bundled together, as tallies are done by eye."],
    rating: 4,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Pakse riverside night market food Sedone",
    coords: { lat: 15.1183, lng: 105.7936 },
    bookHint: "No booking; walk the riverfront in the early evening with small notes.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-paksong-plateau-lodges",
    name: "Bolaven Plateau lodges & homestays, Paksong",
    city: "Paksong",
    country: "la",
    categories: ["stay", "homestay", "nature"],
    stayType: "homestay",
    stayDuration: "short",
    kidFriendly: true,
    amenities: ["home-cooked-meals", "coffee", "garden", "waterfall-access", "shared-bathroom"],
    budgetTier: "low",
    blurb: "Around Paksong, the cool coffee-growing heart of the Bolaven Plateau, smallholder families and simple eco-lodges offer farm homestays and cabins amid Arabica and Robusta plots and near the plateau's waterfalls. Hosts typically walk guests through the harvest-to-roast process and cook home-style Lao meals.",
    whyItFits: "The only way to overnight up on the plateau itself rather than day-tripping from Pakse, waking to cool mountain air, coffee farms and falls like Tad Fane and Tad Yuang nearby. A cluster of farmstays and lodges is a stable recommendation as individual operators change.",
    priceRange: { low: 80000, typical: 180000, high: 400000, currency: "LAK", note: "Per person per night at a farm homestay or simple lodge; meals are often included or very cheap. Newer eco-cabins cost more." },
    hours: "Arrive by afternoon; the plateau is cool and can be misty",
    tips: ["Bring a warm layer, as Paksong is markedly cooler and wetter than Pakse below.", "Ask your host to arrange a coffee-farm walk and buy roasted beans direct at the fairest price.", "A hire motorbike or car lets you link Tad Fane, Tad Yuang and Tad Champee from your base."],
    scamWarnings: [],
    rating: 4.3,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Paksong Bolaven Plateau homestay coffee farm Laos",
    coords: { lat: 15.1712, lng: 106.2154 },
    bookHint: "Arrange a farmstay through a Pakse tour desk or on arrival in Paksong; some eco-lodges take online bookings.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-paksong-market-food",
    name: "Paksong market morning food stalls",
    city: "Paksong",
    country: "la",
    categories: ["food", "market", "streetfood"],
    isLocal: true,
    kidFriendly: true,
    budgetTier: "low",
    blurb: "The morning market in Paksong town is the plateau's everyday kitchen, with stalls ladling hot noodle soups and khao piak, grilling skewers and selling sticky rice, fresh produce and just-roasted local coffee. It is a genuinely local spot where Bolaven farmers shop and eat before the mist lifts.",
    whyItFits: "A cheap, authentic breakfast-and-coffee stop for anyone riding the Bolaven Loop, and the town's most reliable eating cluster. A market rather than a named cafe keeps the recommendation stable.",
    priceRange: { low: 10000, typical: 30000, high: 55000, currency: "LAK", note: "Guidance per item; a bowl of noodle soup or khao piak runs about 20,000-35,000 LAK, skewers and coffee a little extra." },
    hours: "Best in the early morning, daily; quieter by early afternoon",
    tips: ["Go early for the freshest noodles and the morning grill; the plateau chill makes a hot bowl welcome.", "Buy a bag of freshly roasted Paksong coffee direct from a market seller.", "Bring small kip notes, as stalls are cash-only."],
    scamWarnings: [],
    rating: 4,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Paksong market food Bolaven Plateau Laos",
    coords: { lat: 15.1789, lng: 106.2148 },
    bookHint: "No booking; arrive early with small notes for breakfast on the loop.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-thakhek-square-guesthouses",
    name: "Guesthouses around the Fountain Square, Thakhek",
    city: "Thakhek",
    country: "la",
    categories: ["stay", "guesthouse"],
    stayType: "guesthouse",
    stayDuration: "short",
    kidFriendly: true,
    amenities: ["wifi", "air-con", "restaurant", "motorbike-hire", "river-views"],
    budgetTier: "low",
    blurb: "Thakhek's old town clusters around the Fountain Square a few steps back from the Mekong, and the surrounding blocks hold most of the town's budget and mid-range guesthouses, several of which run the motorbike hire and maps used for the Thakhek Loop. The square and riverside promenade, with sunset views across to Thailand, are right on the doorstep.",
    whyItFits: "The obvious launch pad for the Thakhek Loop and Kong Lor Cave, with cheap central rooms, loop bikes and the night market and river a short walk away. A square-and-old-town cluster stays accurate as individual guesthouses change hands.",
    priceRange: { low: 80000, typical: 180000, high: 400000, currency: "LAK", note: "Per night; a simple fan or air-con double near the square. Riverfront and newer rooms cost more; dorm beds are cheaper." },
    hours: "Check-in typically from 14:00",
    tips: ["Several square-side guesthouses rent the motorbikes and hold the log-books used to plan the Thakhek Loop.", "Rooms near the Mekong promenade catch the sunset over Thailand.", "The night market and riverside food are within a short walk of the square."],
    scamWarnings: ["Check any Loop motorbike over and photograph existing damage before setting off to avoid deposit disputes on return."],
    rating: 4.1,
    reviewSources: ["Booking.com", "Tripadvisor", "Google Maps consensus"],
    mapQuery: "Thakhek Fountain Square guesthouse Khammouane Laos",
    coords: { lat: 17.4045, lng: 104.8046 },
    bookHint: "Compare town-centre guesthouses on Booking or Agoda; walk-ins are easy outside peak season.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Travelfish", url: "https://www.travelfish.org" }],
  },
  {
    id: "la-ext-thakhek-night-market-food",
    name: "Thakhek riverside night market food stalls",
    city: "Thakhek",
    country: "la",
    categories: ["food", "market", "streetfood"],
    isLocal: true,
    kidFriendly: true,
    budgetTier: "low",
    blurb: "Steps from the town-centre square and the Mekong, Thakhek's evening night market sets up food stalls of grilled meats, Lao sausage, papaya salad, sticky rice, noodle soups and fruit shakes. Many travellers and locals buy a spread and carry it to the riverside promenade to eat as the sun sets over Thailand.",
    whyItFits: "The town's most concentrated and cheapest local eating, right beside the square where visitors are already based, and a natural pre-Loop dinner. A riverside market cluster is a stable anchor rather than one stall.",
    priceRange: { low: 10000, typical: 30000, high: 60000, currency: "LAK", note: "Guidance per item; skewers and sweets from about 10,000-20,000 LAK, a grilled portion or noodle bowl around 30,000-55,000 LAK." },
    hours: "Daily roughly 17:00-22:00; best around 18:00-20:00",
    tips: ["Buy grilled chicken and sticky rice and eat it on the Mekong promenade for the sunset.", "Ask for papaya salad pounded mild unless you want serious chilli.", "Carry small kip notes; change for large bills is limited in the evening."],
    scamWarnings: ["Confirm the total when several items are bagged together, as tallies are done by eye."],
    rating: 4,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Thakhek night market riverside food Khammouane",
    coords: { lat: 17.4038, lng: 104.8032 },
    bookHint: "No booking; walk from the square to the riverside in the early evening with small notes.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com" }],
  },
  {
    id: "la-ext-nongkhiaw-bridge-food",
    name: "Nong Khiaw bridge evening food stalls",
    city: "Nong Khiaw",
    country: "la",
    categories: ["food", "streetfood"],
    isLocal: true,
    kidFriendly: true,
    budgetTier: "low",
    blurb: "At dusk a short strip of food stalls and simple terrace kitchens sets up near the Nam Ou bridge in Nong Khiaw, the smell of grilling river fish and fresh herbs drifting over the road. Alongside the stalls, tiny family eateries serve or lam stew, laap, sticky rice and noodle soups to trekkers coming off the viewpoints.",
    whyItFits: "The most local and affordable way to eat in a village where sit-down restaurants are few, and a stable cluster around the bridge rather than one venue. It fills Nong Khiaw's street-food gap for travellers already based on the riverbank.",
    priceRange: { low: 15000, typical: 40000, high: 80000, currency: "LAK", note: "Guidance per item; a skewer or sticky-rice snack from about 15,000-25,000 LAK, a bowl of or lam or laap with rice around 40,000-70,000 LAK." },
    hours: "Daily roughly 17:00-21:30; grills fire up around dusk",
    tips: ["Try or lam, the northern Lao stew of buffalo, herbs and mushrooms, at a bridge-side kitchen.", "Grilled Nam Ou river fish with sticky rice is the signature snack.", "Bring cash in small notes; the village has limited banking."],
    scamWarnings: [],
    rating: 4.2,
    reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Nong Khiaw bridge food stalls Nam Ou",
    coords: { lat: 20.5668, lng: 102.6172 },
    bookHint: "No booking; walk to the bridge strip at dusk with small kip notes.",
    verified: "2026-07",
    sources: [{ org: "Lao National Tourism Administration", url: "https://www.tourismlaos.org" }, { org: "Travelfish", url: "https://www.travelfish.org" }],
  },
  {
    id: "la-ext-nam-song-riverside-bars",
    name: "Nam Song riverside bars",
    city: "Vang Vieng",
    country: "la",
    recognition: "Bamboo-and-timber bar decks stepping down to a shallow river with dramatic limestone peaks behind, beanbags and hammocks facing west for the sunset.",
    localName: "ແມ່ນ້ຳຊອງ · Nam Song",
    categories: ["nightlife", "bars", "riverside", "backpacker", "sunset"],
    budgetTier: "low",
    kidFriendly: false,
    blurb: "Vang Vieng's nightlife has grown up around the Nam Song riverfront and the town centre — sunset bars over the water with karst-mountain views, chilled riverside decks and a handful of late traveller bars.",
    whyItFits: "The reliable heart of a night out in this backpacker town, a cluster of riverside and town bars that has survived the wild-tubing era into a tamer, scenic drinking scene.",
    priceRange: { low: 100000, typical: 350000, high: 700000, currency: "LAK", note: "Beerlao ~15,000-25,000 LAK, cocktails 40,000-70,000, buckets more. Note: many bars quote in Thai baht or US dollars too; carry small kip." },
    hours: "Riverside bars from afternoon into evening; a town-wide curfew means most close around 23:00-23:30.",
    tips: ["Claim a riverside deck for the sunset over the karsts — the main event here is the view, not late clubbing.", "The curfew is real; plan for an early-ish night.", "Carry small kip notes; card payment is rare."],
    scamWarnings: ["Ignore 'happy' / 'special' menus offering drugs (opium, mushrooms, weed): illegal, dangerous and a known cause of traveller hospitalisations and arrests here.", "River activities have a history of serious injuries and drownings — do not tube, swim or cliff-jump while drinking, and check water levels.", "Confirm prices, as some bars quote in baht or USD and give poor change."],
    mapQuery: "Nam Song riverside bars Vang Vieng",
    coords: { lat: 18.9235, lng: 102.448 },
    bookHint: "Walk-in; no booking needed.",
    verified: "2026-07",
    sources: [{ org: "Travelfish" }, { org: "Lonely Planet Laos" }],
  },
  {
    id: "la-ext-utopia-bar-the-late-bowling-alley-scene",
    name: "Utopia bar & the late bowling-alley scene",
    city: "Luang Prabang",
    country: "la",
    recognition: "Utopia: a hidden riverside garden bar of low cushions and wooden decks above the Nam Khan. The after-hours spot: a plain roadside bowling alley outside town, packed with travellers and cheap Beerlao late at night.",
    localName: "ຢູໂທເປຍ · Utopia",
    categories: ["nightlife", "bars", "riverside", "backpacker", "after-hours"],
    budgetTier: "low",
    kidFriendly: false,
    blurb: "Luang Prabang has a strict late curfew, so its evening scene centres on the riverside Utopia bar (cushions, volleyball, Nam Khan views) until the town closes, after which everyone piles into the out-of-town bowling alley — the only legal late spot.",
    whyItFits: "The definitive Luang Prabang night out and a well-known institution: a chilled riverside bar followed by the famously surreal after-curfew bowling alley, both durable fixtures of the town's nightlife.",
    priceRange: { low: 100000, typical: 350000, high: 600000, currency: "LAK", note: "Beerlao ~15,000-20,000 LAK, cocktails 40,000-70,000; bowling ~a few dollars a game plus drinks. A cheap night unless you keep buying rounds after the curfew rush." },
    hours: "Utopia and town bars close for the ~23:30 curfew; the bowling alley (a short tuk-tuk out of town) runs to ~01:00-02:00.",
    tips: ["Head to Utopia for sunset over the Nam Khan before the curfew empties the centre.", "For the after-party, share a tuk-tuk to the bowling alley — everyone goes to the same place, so you will find a group.", "Respect the curfew and keep noise down; this is a UNESCO heritage town."],
    scamWarnings: ["Drugs are illegal and enforced; avoid anyone offering them, especially around the late scene.", "Tuk-tuks overcharge for the bowling-alley run — agree a per-person fare and share the ride.", "Watch your drink and belongings in the late-night crush at the alley."],
    mapQuery: "Utopia bar & the late bowling-alley scene Luang Prabang",
    coords: { lat: 19.8842, lng: 102.1378 },
    bookHint: "Walk-in; no booking. Just show up at Utopia and follow the crowd afterwards.",
    verified: "2026-07",
    sources: [{ org: "Lonely Planet Laos" }, { org: "Travelfish" }],
  },
  {
    id: "la-ext-bor-pen-nyang-riverfront-bar-strip",
    name: "Bor Pen Nyang riverfront bar strip",
    city: "Vientiane",
    country: "la",
    recognition: "A tall bar building rising above the low Fa Ngum Road shophouses near the riverside park, with a breezy open rooftop full of drinkers facing the wide Mekong and the sunset.",
    localName: "ບໍ່ເປັນຫຍັງ · Bor Pen Nyang",
    categories: ["nightlife", "bars", "rooftop", "riverside", "live-sport"],
    budgetTier: "low",
    kidFriendly: false,
    blurb: "Anchored by the multi-storey Bor Pen Nyang bar (rooftop views over the Mekong to Thailand), this stretch of Fa Ngum Road behind the riverside park is Vientiane's main after-dark cluster of bars, pool tables and live-sport screens.",
    whyItFits: "Vientiane's best-known going-out anchor and a stable bar zone distinct from the riverside night market, giving a relaxed capital-city evening with a rooftop Mekong sunset.",
    priceRange: { low: 100000, typical: 350000, high: 650000, currency: "LAK", note: "Beerlao ~15,000-25,000 LAK, cocktails 40,000-70,000, food cheap. Rooftop drinks are barely pricier than street level." },
    hours: "From late afternoon to around midnight (Vientiane has a curfew, so most bars wind down by ~23:30).",
    tips: ["Go up to the Bor Pen Nyang rooftop for sunset over the Mekong with Thailand on the far bank.", "The name means 'no worries' in Lao — the pace matches it, so do not expect a late club.", "Pair it with a stroll along the adjacent riverside park and its food stalls first."],
    scamWarnings: ["Low-hassle, but still check your tab and count change.", "Respect the curfew; do not push staff to stay open.", "Agree tuk-tuk fares before riding back after dark."],
    mapQuery: "Bor Pen Nyang riverfront bar strip Vientiane",
    coords: { lat: 17.962, lng: 102.6065 },
    bookHint: "Walk-in; no booking needed.",
    verified: "2026-07",
    sources: [{ org: "Lonely Planet Laos" }, { org: "Travelfish" }],
  },
  {
    id: "la-ext-phou-fa-viewpoint-phongsali",
    name: "Phou Fa Mountain Viewpoint",
    city: "Phongsali",
    country: "la",
    recognition: "You know you have arrived at the long tree-shaded stone staircase on the edge of town; near the top a ticket booth sits before the final section, and the gold stupa and white Buddha mark the summit.",
    localName: "ພູຟ້າ (Phou Fa / Phu Fa)",
    categories: ["viewpoint", "hike"],
    budgetTier: "low",
    blurb: "A 1,625 m stupa-topped peak reached by a shaded staircase of over 400 steps, crowning the remote mountain town of Phongsali. The summit holds a golden stupa and a white Buddha with sweeping views over the town and surrounding ranges.",
    whyItFits: "For active travellers based in far-north Phongsali who want the definitive town viewpoint; the trailhead is in town and the climb takes about 40-45 minutes.",
    priceRange: { low: 10000, typical: 20000, high: 30000, currency: "LAK", note: "Small summit-section entry fee; extra charge to drive up by car or motorbike. Fees change." },
    hours: "Daylight hours; best at sunrise or late afternoon",
    tips: ["Climb early morning or about an hour before sunset to avoid the midday heat and catch the best light.", "Bring water and small kip notes for the ticket collected near the top.", "An alternative path descends to the Hat Sa road near a tea factory 2 km east of town if you want a loop."],
    scamWarnings: ["Confirm whether the fee is per person or covers the drive-up road before paying, and expect the price to change."],
    rating: 4.4,
    reviewSources: ["Lonely Planet", "Google Maps consensus"],
    mapQuery: "Phou Fa mountain, Phongsali, Laos",
    coords: { lat: 21.6875, lng: 102.1075 },
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/phongsali/attractions/phu-fa/a/poi-sig/1432818/1314801" }, { org: "Tourism Laos (official)", url: "https://www.tourismlaos.org/northern-provinces/phongsali-province/" }],
  },
  {
    id: "la-ext-chom-ong-cave-oudomxai",
    name: "Chom Ong Cave",
    city: "Oudomxai (Muang Xai)",
    country: "la",
    recognition: "You have arrived at the Khmu village of Ban Chom Ong, where a community guide meets you; it is roughly a 45-minute walk to the dark cliff-foot entrance where the passage opens into vast echoing galleries.",
    localName: "ຖ້ຳຈອມອອງ (Tham Chom Ong)",
    categories: ["nature", "hike"],
    budgetTier: "mid",
    blurb: "The longest cave system in northern Laos, with over 16 km of surveyed river and fossil passages up to 30 m high, set beside the Khmu village of Ban Chom Ong. Guided walks explore headlamp-lit chambers and an underground river.",
    whyItFits: "For adventurous travellers from Muang Xai wanting a half- or full-day nature trip; the cave lies about 45 km from town, reached by rough road plus a short walk from Ban Chom Ong.",
    priceRange: { low: 50000, typical: 100000, high: 250000, currency: "LAK", note: "Community guide, entry and lamp; transfer from Muang Xai is extra. Prices change — arrange via the Oudomxai tourism office." },
    hours: "Guided visits by arrangement, daytime; dry-season access is easiest",
    tips: ["Arrange a guide and transport through the Oudomxai Provincial Tourism Office in Muang Xai — the road is rough and best in the dry season.", "Wear sturdy shoes and bring a headtorch; passages are muddy and unlit.", "Budget most of a day for the round trip from Muang Xai."],
    scamWarnings: ["Use the official provincial tourism office or a licensed operator rather than an unvetted roadside offer, and confirm exactly what the guide fee covers."],
    rating: 4.3,
    reviewSources: ["Tripadvisor", "Travelfish"],
    mapQuery: "Chom Ong Cave, Oudomxai, Laos",
    coords: { lat: 20.682, lng: 101.865 },
    verified: "2026-07",
    sources: [{ org: "Wikipedia", url: "https://en.wikipedia.org/wiki/Chom_Ong" }, { org: "Travelfish", url: "https://www.travelfish.org/sight_profile/laos/northern_laos/udomxai/udomxai/4098" }],
  },
  {
    id: "la-ext-muang-sing-morning-market",
    name: "Muang Sing Morning Market",
    city: "Muang Sing",
    country: "la",
    recognition: "You have arrived at the covered market stalls in the town centre, filled before dawn with hill-tribe women in silver-coined Akha headdresses and embroidered Tai Dam dress ladling noodles and laying out greens.",
    localName: "ຕະຫຼາດເຊົ້າ ເມືອງສິງ (Talat Sao Muang Sing)",
    categories: ["market", "food"],
    budgetTier: "low",
    blurb: "A dawn produce-and-food market where Akha, Tai Dam, Tai Lue and Yao traders from surrounding hill villages gather in traditional dress. Come for fresh produce, forest foods and a bowl of khao soi, the northern Lao noodle soup.",
    whyItFits: "For culturally curious, early-rising travellers in remote Muang Sing near the China border; it is in the town centre and best from about 6 to 8 am.",
    priceRange: { low: 10000, typical: 25000, high: 50000, currency: "LAK", note: "A bowl of noodles or a snack costs little; bring small kip notes. Prices change." },
    hours: "Daily, roughly 06:00-08:00 (busiest at dawn)",
    tips: ["Arrive by about 06:30 for the fullest market and the best noodle stalls before they pack up.", "Always ask before photographing people; many hill-tribe traders prefer not to be photographed.", "Bring small change — there are no card payments."],
    scamWarnings: ["Agree handicraft prices before buying and expect gentle bargaining; do not pay to photograph anyone who has not clearly agreed."],
    rating: 4.2,
    reviewSources: ["Lonely Planet", "Google Maps consensus"],
    mapQuery: "Muang Sing morning market, Luang Namtha, Laos",
    coords: { lat: 21.1836, lng: 101.154 },
    verified: "2026-07",
    sources: [{ org: "Wikipedia", url: "https://en.wikipedia.org/wiki/Muang_Sing" }, { org: "EcotourismLaos (official)", url: "https://www.ecotourismlaos.com/index.php/eco-attractions/handicrafts/222-muang-sing-handicraft-market" }],
  },
  {
    id: "la-ext-nam-dee-waterfall-luang-namtha",
    name: "Nam Dee Waterfall",
    city: "Luang Namtha",
    country: "la",
    recognition: "You have arrived at Ban Nam Dee, a Lanten village of women in black indigo cloth trimmed with pink; a visitor gate and short forest path lead in about 5 minutes to a bridge facing the cascade.",
    localName: "ນ້ຳຕົກຕາດນ້ຳດີ (Tad Nam Dee)",
    categories: ["waterfall", "nature"],
    budgetTier: "low",
    blurb: "A tiered forest waterfall about 6 km northeast of Luang Namtha, reached through the Lanten village of Ban Nam Dee ('good water'), known for indigo dyeing and bamboo paper-making. A short walk and swing-bridge loop climb above the falls.",
    whyItFits: "For travellers based in Luang Namtha wanting an easy half-day of nature plus a village cultural stop; a short bicycle or tuk-tuk ride out of town.",
    priceRange: { low: 10000, typical: 20000, high: 30000, currency: "LAK", note: "Small village entry fee; bike or tuk-tuk hire is extra. Prices change." },
    hours: "Daylight hours; strongest flow in the wet season (June-October)",
    tips: ["Visit in or just after the rainy season — the falls can dry up between November and May.", "Combine it with the Lanten village to see indigo dyeing and bamboo paper-making.", "Take the roughly 1-hour swing-bridge loop above the falls if the trail is open and dry."],
    scamWarnings: ["Agree the tuk-tuk fare and whether it includes the wait before setting off, and expect the small gate fee to change."],
    rating: 4.1,
    reviewSources: ["Tripadvisor", "Luang Namtha tourism office"],
    mapQuery: "Nam Dee Waterfall, Luang Namtha, Laos",
    coords: { lat: 20.995, lng: 101.443 },
    verified: "2026-07",
    sources: [{ org: "Luang Namtha Tourism (official)", url: "https://luangnamthatourism.org/nam-dee-community-forest-waterfall/" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com/Attraction_Review-g424933-d9858507-Reviews-Nam_Dee_Waterfall-Luang_Namtha_Luang_Namtha_Province.html" }],
  },
  {
    id: "la-ext-tham-pha-tok-nong-khiaw",
    name: "Tham Pha Tok (Pha Tok Caves)",
    city: "Nong Khiaw",
    country: "la",
    recognition: "You know you have arrived at the roadside ticket hut past the paddy fields; a wooden stairway climbs the cliff to a cave mouth about 30 m up, with old bomb-crater dips near the base.",
    localName: "ຖ້ຳຜາຕົກ (Tham Pha Tok)",
    categories: ["culture", "nature"],
    budgetTier: "low",
    blurb: "A limestone cliff riddled with caves where villagers and Pathet Lao forces sheltered for years from bombing during the Indochina war, divided into former hospital, military and administrative sections. Reached across rice paddies about 2.5 km east of Nong Khiaw.",
    whyItFits: "For history-minded travellers in Nong Khiaw wanting a short, meaningful walk; a flat 2.5 km stroll from the bridge, doable on foot or by bicycle.",
    priceRange: { low: 10000, typical: 15000, high: 20000, currency: "LAK", note: "Small entry fee collected at the hut. Fees change." },
    hours: "Daylight hours; best accessed in the dry season",
    tips: ["Bring your own torch — rental lamps at the entrance are weak.", "Wear shoes with grip; the wooden stairs and cave floors are steep and can be slippery.", "Go in the dry season, as the paddy approach floods and the caves are hard to reach when wet."],
    scamWarnings: ["Buy the ticket at the official hut; be wary of anyone collecting a separate 'guide fee' along the path that you did not agree to."],
    rating: 4,
    reviewSources: ["Lonely Planet", "Tripadvisor"],
    mapQuery: "Tham Pha Tok cave, Nong Khiaw, Laos",
    coords: { lat: 20.572, lng: 102.64 },
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/northern-laos/nong-khiaw/attractions/tham-pha-thok/a/poi-sig/1350416/356929" }, { org: "Discover Laos Today", url: "https://discoverlaos.today/nong-khiaw/thing-to-do/tham-phatok-phatok-cave" }],
  },
  {
    id: "la-ext-elephant-conservation-center-sayaboury",
    name: "Elephant Conservation Center (Sayaboury)",
    city: "Sainyabuli (Xayaboury)",
    country: "la",
    recognition: "You have arrived when the road ends at the lakeshore reception on the Nam Tien reservoir and you cross the water by boat to the forested camp and elephant hospital.",
    localName: "ສູນອະນຸລັກຊ້າງ ໄຊຍະບູລີ (Sun Anulak Sang, Sayaboury)",
    categories: ["nature", "park"],
    budgetTier: "high",
    blurb: "A no-riding conservation sanctuary on the Nam Tien reservoir, home to the country's only elephant hospital and a herd of rescued elephants across hundreds of hectares of forest, running a program that rewilds elephants into protected areas. Visits are multi-day, ethical, observation-based stays.",
    whyItFits: "For travellers who want a responsible, no-riding elephant experience; it sits about 30 km from Sainyabuli town, roughly a 2 to 3 hour drive southwest of Luang Prabang, and must be pre-booked.",
    priceRange: { low: 200, typical: 350, high: 600, currency: "USD", note: "All-inclusive 2-3 day packages covering transfer, lodging, meals and guides. Prices change — book directly in advance." },
    hours: "By reservation only; multi-day packages, typically 2-3 days",
    tips: ["Book well ahead directly with the centre — it does not take casual walk-ins, and packages include the transfer from Luang Prabang.", "Choose it precisely because it is no-riding: expect observation, forest walks and bathing, not elephant rides.", "Bring insect repellent, a rain layer and closed shoes for the forest and lake setting."],
    scamWarnings: ["Book only through the official Elephant Conservation Center; avoid any third party advertising 'elephant rides' here, as it is a no-riding facility."],
    rating: 4.6,
    reviewSources: ["Tripadvisor", "Official site"],
    mapQuery: "Elephant Conservation Center, Nam Tien lake, Sayaboury, Laos",
    coords: { lat: 19.297, lng: 101.785 },
    bookHint: "Reserve multi-day packages in advance via elephantconservationcenter.com; transfer from Luang Prabang is included.",
    verified: "2026-07",
    sources: [{ org: "Elephant Conservation Center (official)", url: "https://www.elephantconservationcenter.com/" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com/Attraction_Review-g2642380-d2624675-Reviews-Elephant_Conservation_Center-Sayaboury_Sainyabuli_Province.html" }],
  },
  {
    id: "la-ext-wat-sin-jong-jaeng-pak-beng",
    name: "Wat Sin Jong Jaeng",
    city: "Pak Beng",
    country: "la",
    recognition: "You have arrived at a modest temple above the main road with a weathered, repainted facade; look for the faded mural of a moustached man holding an umbrella near the entrance.",
    localName: "ວັດສິນຈົງແຈ້ງ (Wat Sin Jong Jaeng)",
    categories: ["temple", "culture"],
    budgetTier: "low",
    blurb: "Pak Beng's hillside temple dating from the French colonial era, its faded murals still showing a moustached, umbrella-carrying figure thought to depict an early French visitor. A quiet spot to stretch your legs and watch the sun set over the Mekong during the slow-boat overnight stop.",
    whyItFits: "For slow-boat travellers overnighting in Pak Beng between Huay Xai and Luang Prabang who want a short, free cultural walk; it is a brief uphill stroll from the main street.",
    priceRange: { low: 0, typical: 0, high: 0, currency: "LAK", note: "Entry is free; a small donation is appreciated." },
    hours: "Daylight hours; sunset (around 17:00) is the local favourite",
    tips: ["Come around 17:00 for sunset over the Mekong once the boat has docked for the night.", "Dress modestly, covering shoulders and knees, and remove shoes before entering the hall.", "Monks here often welcome a chat to practise English; be respectful and unhurried."],
    scamWarnings: ["The temple itself is free; ignore anyone demanding an 'entry fee' at the gate."],
    rating: 4,
    reviewSources: ["Lonely Planet", "Google Maps consensus"],
    mapQuery: "Wat Sin Jong Jaeng, Pak Beng, Laos",
    coords: { lat: 19.8865, lng: 101.129 },
    verified: "2026-07",
    sources: [{ org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/pak-beng/attractions/wat-sin-jong-jaeng/a/poi-sig/1353950/1303266" }, { org: "The Crazy Tourist", url: "https://www.thecrazytourist.com/15-best-things-to-do-in-pak-beng-laos/" }],
  },
  {
    id: "la-ext-phanoi-viewpoint-muang-ngoi",
    name: "Phanoi Viewpoint",
    city: "Muang Ngoi",
    country: "la",
    recognition: "You have arrived at the marked trail entrance and ticket point at the north edge of the village; bamboo handrails guide the steep rocky climb, and a wooden bench shelter marks the summit.",
    localName: "ຈຸດຊົມວິວຜານ້ອຍ (Pha Noi Viewpoint)",
    categories: ["viewpoint", "hike"],
    budgetTier: "low",
    blurb: "A steep 30-minute jungle scramble to a two-level lookout above car-free Muang Ngoi, giving a panorama over the village and a bend of the Nam Ou River hemmed by karst peaks. A shaded bench shelter waits at the top.",
    whyItFits: "For active travellers in tiny, road-free Muang Ngoi, reached by boat up the Nam Ou, who want the village's best sunrise or sunset view; the trailhead is at the north end of town.",
    priceRange: { low: 20000, typical: 20000, high: 30000, currency: "LAK", note: "Around 20,000 kip entry collected at the trailhead. Fees change." },
    hours: "Daylight hours; popular for both sunrise and sunset",
    tips: ["Allow about 30 minutes up over steep, rooty ground; wear proper shoes and carry water.", "Go for sunrise to beat the heat, or late afternoon for sunset, and bring a torch for the descent if you stay late.", "Two lookouts exist; climb to the higher one for the full Nam Ou panorama."],
    scamWarnings: ["Pay the posted fee at the trailhead only; there is no guide requirement for this short, marked walk."],
    rating: 4.4,
    reviewSources: ["Tripadvisor", "AllTrails"],
    mapQuery: "Phanoi Viewpoint, Muang Ngoi, Laos",
    coords: { lat: 20.7195, lng: 102.641 },
    verified: "2026-07",
    sources: [{ org: "AllTrails", url: "https://www.alltrails.com/trail/laos/luang-prabang/phanoi-viewpoint" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com/Attraction_Review-g1732900-d13494304-Reviews-Muang_Ngoi_Neua_Viewpoint-Muang_Ngoi_Neua_Luang_Prabang_Province.html" }],
  },
  {
    "id": "la-ext-plain-of-jars-site-3",
    "name": "Plain of Jars - Site 3 (Hai Hin Lat Khai)",
    "city": "Phonsavan",
    "country": "la",
    "recognition": "The quietest of the jar fields: after a 10-15 minute walk over rice paddies and a couple of bamboo footbridges, a shady hillock above Lat Khai village holds roughly 150 moss-flecked stone jars, MAG red-and-white cleared-path markers running between them.",
    "categories": [
      "archaeology",
      "history",
      "nature",
      "hike"
    ],
    "budgetTier": "low",
    "blurb": "The third of the visitable Plain of Jars clusters and the least crowded, reached on foot from a small ticket booth through working rice fields and up a wooded rise. Around 150 Iron-Age sandstone jars (roughly 2,000 years old) sit among the trees; a local family runs a simple noodle-soup stall by the entrance. Part of the wider Plain of Jars UNESCO World Heritage inscription (2019). The area was heavily bombed in the Secret War, so cleared paths matter here.",
    "whyItFits": "For travellers who want the jars without the day-tripper crowds of Site 1, plus a short scenic walk and a village setting.",
    "priceRange": {
      "low": 10000,
      "typical": 15000,
      "high": 20000,
      "currency": "LAK",
      "note": "~10,000-15,000 LAK site entry; tuk-tuk or a Plain of Jars tour is the real cost."
    },
    "hours": "Roughly 08:00-17:00 daily; best October-February when the plateau is dry and cool",
    "tips": [
      "Combine with Site 2 (Hai Hin Phu Salato) nearby on one loop.",
      "Stay strictly between the MAG red-and-white markers; the ground off-path is not guaranteed UXO-cleared.",
      "Wear shoes that cope with mud after rain; the paddy path gets slick.",
      "Carry small kip for entry and the village noodle stall; no cards."
    ],
    "scamWarnings": [
      "Agree your tuk-tuk or driver's total price (and wait time) before leaving Phonsavan."
    ],
    "rating": 4.3,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet",
      "Tourism Laos"
    ],
    "mapQuery": "Plain of Jars Site 3 Hai Hin Lat Khai Phonsavan",
    "coords": {
      "lat": 19.3639,
      "lng": 103.1719
    },
    "bookHint": "No advance booking; pay at the booth, or join a half-/full-day jars tour from Phonsavan.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "UNESCO World Heritage Centre",
        "url": "https://whc.unesco.org/en/list/1587/"
      },
      {
        "org": "Tourism Laos (official)",
        "url": "https://www.tourismlaos.org/northern-provinces/xiangkhouang-province/"
      },
      {
        "org": "The Roaming Compass",
        "url": "https://theroamingcompass.com/laos/how-to-visit-the-plain-of-jars-in-laos-an-essential-guide/"
      }
    ]
  },
  {
    "id": "la-ext-muang-khoun-ruins",
    "name": "Muang Khoun (Old Xieng Khuang) Ruins",
    "city": "Muang Khoun",
    "country": "la",
    "recognition": "A sleepy town 35 km southeast of Phonsavan where the giant seated Buddha of roofless Wat Phia Wat sits open to the sky, and the brick-and-stucco stub of the 1576 That Foun stupa rises from a hilltop - both scarred survivors of wartime bombing.",
    "categories": [
      "history",
      "culture",
      "ruins",
      "temple"
    ],
    "budgetTier": "low",
    "blurb": "Muang Khoun was the royal capital of the Phuan kingdom and, later, the French provincial seat, until US bombing during the Second Indochina War flattened it and the capital moved to Phonsavan. What remains is quietly moving: the exposed brick Buddha and columns of Wat Phia Wat, the plundered 16th-century That Foun stupa, and fragments of colonial buildings. It pairs naturally with the jar sites on a Phonsavan day loop.",
    "whyItFits": "History-minded travellers get the human backstory behind the Plain of Jars region in an unhurried, low-key setting.",
    "priceRange": {
      "low": 10000,
      "typical": 15000,
      "high": 20000,
      "currency": "LAK",
      "note": "Small entry at the temple sites (~10,000-20,000 LAK); transport from Phonsavan is the main expense."
    },
    "hours": "Daylight hours daily; ~1 hour drive each way from Phonsavan",
    "tips": [
      "Best combined with Plain of Jars Site 1 on the way back to Phonsavan.",
      "Dress modestly at Wat Phia Wat - it is still an active place of respect.",
      "Do not wander into brush or fields around the ruins; the district was heavily bombed."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Rough Guides",
      "Tripadvisor",
      "Travelfish"
    ],
    "mapQuery": "Muang Khoun Wat Phia Wat Xieng Khouang",
    "coords": {
      "lat": 19.335,
      "lng": 103.3711
    },
    "bookHint": "No booking; hire a tuk-tuk/driver or add it to a jars tour.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Rough Guides",
        "url": "https://www.roughguides.com/laos/northeast/muang-khoun-old-xieng-khuang/"
      },
      {
        "org": "Xieng Khouang Tourism (official)",
        "url": "https://xiengkhouangtourism.org/ancient-ruins-of-the-phuan-kingdom/"
      }
    ]
  },
  {
    "id": "la-ext-tham-piu-cave",
    "name": "Tham Piu Cave War Memorial",
    "city": "Muang Kham",
    "country": "la",
    "recognition": "A hillside cave above Muang Kham reached by a stone stairway past a memorial temple whose statue shows a grieving man cradling a limp child - inside, a bare rock chamber marks where a 1968 airstrike killed hundreds of civilians sheltering below.",
    "categories": [
      "history",
      "memorial",
      "cave"
    ],
    "budgetTier": "low",
    "blurb": "On 24 November 1968 a rocket fired from a US jet struck this cave, killing the villagers who had turned it into an underground refuge - a village, school, clinic and all. Declared a national memorial in 2001, it is now a place of quiet remembrance rather than a polished museum: a climb to the blackened cave mouth, a small display, and the memorial temple at the base. It sits on the Phonsavan-Sam Neua road, often combined with the Muang Kham hot springs.",
    "whyItFits": "Gives sober, first-hand context to the Secret War for travellers heading northeast toward Vieng Xai and Sam Neua.",
    "priceRange": {
      "low": 0,
      "typical": 10000,
      "high": 15000,
      "currency": "LAK",
      "note": "Small entry or donation (~10,000 LAK); transport is the main cost."
    },
    "hours": "Daylight hours daily; about 60-70 km east of Phonsavan near Muang Kham",
    "tips": [
      "Treat it as a memorial: keep voices low and photography respectful.",
      "The stairway is steep; bring water in the hot months.",
      "Easy to pair with the Muang Kham hot springs on the same run.",
      "Stay on the built path - the surrounding hills are UXO-affected."
    ],
    "rating": 4.4,
    "reviewSources": [
      "Lonely Planet",
      "Tripadvisor"
    ],
    "mapQuery": "Tham Piu Cave memorial Muang Kham Xieng Khouang",
    "coords": {
      "lat": 19.5806,
      "lng": 103.4972
    },
    "bookHint": "No booking; visit independently by hired vehicle or on a northeast route tour.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/northern-laos/xieng-khuang-province/attractions/tham-piu/a/poi-sig/1351141/1334268"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g3312575-d7702313-Reviews-Tham_Piu_Cave-Xieng_Khouang_Xiangkhouang_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-mag-uxo-centre-phonsavan",
    "name": "MAG UXO Visitor Information Centre",
    "city": "Phonsavan",
    "country": "la",
    "recognition": "A small storefront on Route 7 near central Phonsavan, its window and shelves lined with defused cluster-bomb casings and bomblets, with survivor stories on the walls and nightly documentary screenings.",
    "categories": [
      "history",
      "museum",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "Run by the Mines Advisory Group, this free centre explains why Xieng Khouang is among the most UXO-contaminated places on earth - more than half a million bombing missions were flown over Laos in 1964-1973 and a large share of the cluster munitions failed to explode. Displays, survivor testimony and evening documentary screenings put the whole region in context, and the shop sells crafts that fund clearance work. The essential first stop before heading out to the jars.",
    "whyItFits": "Frames every other Xieng Khouang sight; understanding the UXO risk here is genuinely useful before rural walks.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free entry; donations fund clearance work."
    },
    "hours": "Daily, roughly 10:00-20:00; documentary screenings most evenings",
    "tips": [
      "Come before your jars trip so the cleared-path markers make sense.",
      "Time your visit for an evening documentary screening.",
      "The shop's silk bags and purses support UXO survivors - a fair place to buy gifts.",
      "Bring a little cash for a donation; card facilities are unreliable."
    ],
    "rating": 4.6,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet"
    ],
    "mapQuery": "MAG UXO Visitor Information Centre Phonsavan",
    "coords": {
      "lat": 19.4494,
      "lng": 103.214
    },
    "bookHint": "No booking; walk in during opening hours.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "MAG International (official)",
        "url": "https://www.maginternational.org/laos-visitor-centres/"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/northern-laos/phonsavan/attractions/uxo-information-centre-mag/a/poi-sig/1350292/356935"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g612364-d7349432-Reviews-MAG_UXO_Visitor_Information_Centre-Phonsavan_Xiangkhouang_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-nam-nern-night-safari",
    "name": "Nam Nern Night Safari (Nam Et-Phou Louey NPA)",
    "city": "Viengthong (Muang Hiam)",
    "country": "la",
    "recognition": "An award-winning community ecotour that starts at the Nam Et-Phou Louey visitor centre in Viengthong: a long-tail boat carries you upriver to a bamboo ranger camp, then drifts back after dark with a spotlight to scan the banks for wildlife.",
    "categories": [
      "wildlife",
      "nature",
      "ecotourism",
      "boat"
    ],
    "budgetTier": "high",
    "blurb": "Inside one of Laos's largest protected areas, this Wildlife Conservation Society-linked project pays local villagers - many former hunters - to guide, boat and cook, with bonuses tied to the wildlife guests actually see, which funds conservation. Expect a river journey, a bonfire barbecue, a night in a simple hut with mosquito nets, and a slow spotlit float back. Be realistic: you may see sambar deer, civets and abundant birdlife, but big cats and other rare species are very seldom seen. Getting to Viengthong is a long haul on mountain roads.",
    "whyItFits": "The region's standout responsible-wildlife experience for travellers who value genuine community conservation over guaranteed sightings.",
    "priceRange": {
      "low": 95,
      "typical": 160,
      "high": 260,
      "currency": "USD",
      "note": "Per-person cost falls sharply with group size (roughly US$95-260 for the 1-night safari); includes boat, guide, meals and camp."
    },
    "hours": "Scheduled 1-night / 24-hour departures; drier months (November-March) are best; book ahead",
    "tips": [
      "Manage expectations - sightings vary hugely and the value is the conservation model, not a zoo-like guarantee.",
      "Book through the official Nam Et-Phou Louey ecotourism unit; it is the only legitimate access to the core zone.",
      "Budget a full day of travel each way to reach Viengthong (Muang Hiam).",
      "Bring a head torch, insect repellent, and clothes that can get wet and muddy."
    ],
    "scamWarnings": [
      "Book only via the official park ecotourism office - do not pay strangers claiming to arrange 'the same' trip."
    ],
    "rating": 4.6,
    "reviewSources": [
      "Audley Travel",
      "Tripadvisor",
      "Nam Et-Phou Louey (official)"
    ],
    "mapQuery": "Nam Et-Phou Louey visitor centre Viengthong Houaphanh",
    "coords": {
      "lat": 20.32,
      "lng": 103.63
    },
    "bookHint": "Reserve in advance through namet.org / the Viengthong ecotourism office.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Nam Et-Phou Louey National Park (official)",
        "url": "https://www.namet.org/wildlife-tours/"
      },
      {
        "org": "Audley Travel",
        "url": "https://www.audleytravel.com/us/laos/things-to-do/nam-nern-night-safari"
      }
    ]
  },
  {
    "id": "la-ext-hintang-standing-stones",
    "name": "Hintang Archaeological Park (Standing Stones)",
    "city": "Houameuang (near Sam Neua)",
    "country": "la",
    "recognition": "A remote forest ridge reached down a rough spur off Route 6, where blade-like slabs of schist stand upright in clusters among flat stone discs - the main, easiest-reached group is San Kong Phan (Suan Hin, the 'stone garden').",
    "categories": [
      "archaeology",
      "history",
      "nature",
      "hike"
    ],
    "budgetTier": "low",
    "blurb": "Over 1,500 menhirs and around 150 stone discs, scattered in some 70 groups along a mountain ridge, mark Iron/Bronze-Age burial sites first surveyed by Madeleine Colani in 1931. Atmospheric and almost empty of visitors, but genuinely off the beaten track: the access road is steep, rough and often impassable in heavy rain, and the site is a long, winding drive from Sam Neua.",
    "whyItFits": "A true adventurer's payoff - one of Southeast Asia's great megalith fields, seen without crowds, en route between the Plain of Jars and Sam Neua.",
    "priceRange": {
      "low": 0,
      "typical": 10000,
      "high": 20000,
      "currency": "LAK",
      "note": "Little or no entry fee; a 4WD or capable motorbike and the access road are the real cost."
    },
    "hours": "Daylight hours; go in the dry season (November-March) - the spur road is treacherous when wet",
    "tips": [
      "Attempt the access track only in dry conditions and ideally with 4WD or an experienced rider.",
      "San Kong Phan is the most accessible cluster; others need a real hike along the ridge.",
      "Set out early - it is a long, slow mountain drive from Sam Neua.",
      "Stay on visible paths between stone groups.",
      "Bring water and snacks; there are no facilities at the stones."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Lonely Planet",
      "Travelfish",
      "Laotian Times"
    ],
    "mapQuery": "Hintang Archaeological Park San Kong Phan Houaphanh",
    "coords": {
      "lat": 20.145,
      "lng": 103.63
    },
    "bookHint": "No booking; arrange a driver/4WD in Sam Neua or ride Route 6 yourself.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/northern-laos/sam-neua/attractions/hintang-archaeological-park/a/poi-sig/1351127/356921"
      },
      {
        "org": "Travelfish",
        "url": "https://www.travelfish.org/sight_profile/laos/northern_laos/hua_phan/sam_neua/341"
      }
    ]
  },
  {
    "id": "la-ext-sam-neua-morning-market",
    "name": "Sam Neua Morning Market",
    "city": "Sam Neua",
    "country": "la",
    "recognition": "A green-netted covered market in the centre of Sam Neua where highland shoppers carry tall woven bamboo baskets, produce and banana flowers spread on ground tarps, and stalls of Tai Daeng and Hmong supplementary-weft textiles line the edges.",
    "categories": [
      "market",
      "culture",
      "craft",
      "food"
    ],
    "budgetTier": "low",
    "blurb": "Houaphanh's main trading hub and one of northern Laos's most rewarding markets to wander. It mixes fresh highland produce and foraged forest goods with the province's real draw - handwoven textiles from Tai Daeng and other communities famous for the discontinuous supplementary-weft technique. Come early for the food stalls and the fullest textile selection. A natural base stop before or after Vieng Xai and Hintang.",
    "whyItFits": "The best place in the northeast to see everyday highland life and buy authentic, locally woven Houaphanh silk directly.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free to browse; bring kip for textiles (prices vary widely) and market food."
    },
    "hours": "Busiest early morning, roughly 06:00-10:00; quieter through midday",
    "tips": [
      "Arrive by 07:00 for the liveliest trade and best-stocked textile stalls.",
      "Bargain politely; ask whether a piece is handwoven and naturally dyed.",
      "Try the market food stalls for a cheap local breakfast.",
      "Carry small kip notes - vendors rarely change large bills and cards are not accepted."
    ],
    "scamWarnings": [
      "'Antique' or 'hand-dyed' textiles are sometimes machine-made or chemically dyed - inspect the reverse and weave before paying premium prices."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Audley Travel",
      "Travel Dojo"
    ],
    "mapQuery": "Sam Neua morning market Houaphanh",
    "coords": {
      "lat": 20.4178,
      "lng": 104.0489
    },
    "bookHint": "No booking; walk in.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Audley Travel",
        "url": "https://www.audleytravel.com/laos/places-to-go/sam-neau"
      },
      {
        "org": "Travel Dojo",
        "url": "https://www.traveldojo.com/sam-neua/"
      }
    ]
  },
  {
    "id": "la-ext-ban-napia-spoon-village",
    "name": "Ban Napia Spoon Village",
    "city": "Phonsavan",
    "country": "la",
    "recognition": "A stilt-house village in a farming valley outside Phonsavan where families melt down war scrap in simple backyard kilns and pour it into wooden moulds - you will see spoons, bracelets and bottle-openers cooling on the ground and offered for sale.",
    "categories": [
      "culture",
      "craft",
      "history"
    ],
    "budgetTier": "low",
    "blurb": "In Ban Napia, villagers turn the aluminium of downed aircraft and (historically) bomb scrap into spoons and trinkets - a striking, sobering example of life continuing atop the Secret War's debris. Visitors can watch a pour and buy directly from makers. Be aware of the ethical weight: handling war scrap has killed and maimed collectors, so buy from established makers rather than encouraging risky scavenging, and never handle unidentified metal yourself.",
    "whyItFits": "A short, high-impact add-on to a jars day that puts a human, hopeful face on the region's UXO legacy.",
    "priceRange": {
      "low": 0,
      "typical": 20000,
      "high": 50000,
      "currency": "LAK",
      "note": "No fixed fee; buy a spoon/bracelet (~10,000-30,000 LAK) directly from a maker to support the village."
    },
    "hours": "Roughly daylight hours; casual - it is a working village, not a fixed attraction",
    "tips": [
      "Easily combined with Plain of Jars Site 1 on the same loop.",
      "Buy from the makers themselves so income stays in the village.",
      "Ask before photographing people or their kilns.",
      "Never touch or pick up loose metal scrap yourself."
    ],
    "scamWarnings": [
      "Souvenirs sold as 'made from real bombs' may be ordinary aluminium; buy for the craft and the cause, not the war-relic label."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Atlas Obscura",
      "Tripadvisor"
    ],
    "mapQuery": "Ban Napia spoon village Phonsavan",
    "coords": {
      "lat": 19.4028,
      "lng": 103.1583
    },
    "bookHint": "No booking; visit independently or as a stop on a Plain of Jars tour.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Atlas Obscura",
        "url": "https://www.atlasobscura.com/places/ban-napia-unexploded-bomb-spoons-village"
      },
      {
        "org": "The Star",
        "url": "https://www.thestar.com.my/lifestyle/living/2024/07/01/transforming-bombs-into-spoons"
      }
    ]
  },
  {
    "id": "la-ext-mulberries-silk-farm",
    "name": "Mulberries Organic Silk Farm",
    "city": "Phonsavan",
    "country": "la",
    "recognition": "A green farm just outside Phonsavan with rows of mulberry trees, silkworm-rearing huts, natural-dye vats bubbling with indigo and jackfruit, and weavers at looms - all explained on a free guided tour.",
    "categories": [
      "craft",
      "culture",
      "silk"
    ],
    "budgetTier": "low",
    "blurb": "A fair-trade, non-profit silk enterprise founded in 1993 that walks visitors through the whole chain - silkworms and cocoons, reeling, natural plant dyeing, and hand-weaving - while creating income for local women. The free tour is genuinely informative and low-pressure, ending at a shop of scarves, bags and runners. A relaxed, ethical half-hour to an hour near town.",
    "whyItFits": "A wholesome, socially responsible stop that shows how the region's famous textiles are actually made.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free guided tour; silk scarves and bags for sale in the shop."
    },
    "hours": "Monday-Saturday, roughly 08:00-16:00; guided tours during the working day",
    "tips": [
      "Tours run through the working day; late afternoon may catch fewer active stages.",
      "Buying from the shop directly supports the weavers and the fair-trade model.",
      "Ask which natural dye plant made each colour - the staff enjoy explaining.",
      "It is a short tuk-tuk ride from central Phonsavan."
    ],
    "rating": 4.4,
    "reviewSources": [
      "Tripadvisor",
      "Mulberries (official)"
    ],
    "mapQuery": "Mulberries Organic Silk Farm Phonsavan",
    "coords": {
      "lat": 19.4419,
      "lng": 103.2033
    },
    "bookHint": "No booking needed for the standard tour; groups can contact the farm ahead.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Mulberries (official)",
        "url": "https://mulberries.org/mulberries-organic-silk-farm/"
      },
      {
        "org": "Just Gone Wandering",
        "url": "https://justgonewandering.com/visiting-mulberries-organic-silk-farm-in-phonsavan-laos/"
      }
    ]
  },
  {
    "id": "la-ext-nong-tang-lake",
    "name": "Nong Tang Lake (Muang Sui)",
    "city": "Muang Sui",
    "country": "la",
    "recognition": "A calm natural lake ringed by grey limestone karsts on Route 7 west of Phonsavan, at the edge of the old town of Muang Sui, with a Buddha-image cave (Tham Pha) and temple ruins nearby.",
    "categories": [
      "nature",
      "lake",
      "viewpoint"
    ],
    "budgetTier": "low",
    "blurb": "A scenic, low-key stop about 48 km west of Phonsavan where soaring karst cliffs meet a quiet lake used by local fishers and picnickers. The old town of Muang Sui around it carries war-era history and temple ruins, and the nearby Tham Pha cave holds a cluster of Buddha images. A pleasant leg-stretch and photo stop for anyone travelling the Phonsavan-Luang Prabang road or exploring west of the jars.",
    "whyItFits": "A restful natural counterpoint to the region's heavier war-history sights, with almost no crowds.",
    "priceRange": {
      "low": 0,
      "typical": 10000,
      "high": 20000,
      "currency": "LAK",
      "note": "Little or no entry; any boat or local guide is extra."
    },
    "hours": "Daylight hours; calmest and clearest in the dry season",
    "tips": [
      "Combine with the drive toward Muang Sui / west of Phonsavan rather than a special trip.",
      "Bring a picnic - facilities are minimal.",
      "Ask locally before scrambling around ruins or into Tham Pha cave, and keep to trodden ground.",
      "Morning light is best on the karsts for photos."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Tripadvisor",
      "Tourism Laos"
    ],
    "mapQuery": "Nong Tang Lake Muang Sui Xieng Khouang",
    "coords": {
      "lat": 19.49,
      "lng": 102.885
    },
    "bookHint": "No booking; visit independently by hired vehicle or motorbike.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g3312575-d13531880-Reviews-Nong_Tang_Lake-Xieng_Khouang_Xiangkhouang_Province.html"
      },
      {
        "org": "Tourism Laos (official)",
        "url": "https://www.tourismlaos.org/northern-provinces/xiangkhouang-province/"
      }
    ]
  },
  {
    "id": "la-ext-phonsavan-guesthouses",
    "name": "Guesthouses & small hotels around central Phonsavan",
    "city": "Phonsavan",
    "country": "la",
    "recognition": "The cluster of family-run guesthouses and modest hotels along and just off Route 7 (the main tourist strip), within a short walk of the market, ATMs and jars-tour agencies.",
    "categories": [
      "stay"
    ],
    "budgetTier": "low",
    "stayType": "guesthouse",
    "blurb": "Phonsavan's accommodation is concentrated on the central Route 7 strip and the side road toward the market - practical, walkable and close to tour operators, the MAG centre and restaurants. Expect clean, simple budget rooms with a handful of mid-range hotels; travellers typically use them as a one- or two-night base for the Plain of Jars. Nothing luxurious, but reliable and central. Note the plateau gets genuinely cold on winter nights, so check for blankets/heating.",
    "whyItFits": "A stable, sensible base for exploring the jars and northeast without hunting a specific business.",
    "priceRange": {
      "low": 12,
      "typical": 22,
      "high": 45,
      "currency": "USD",
      "note": "Budget guesthouses ~US$12-18; mid-range hotels ~US$25-45; quoted in USD on booking sites."
    },
    "hours": "N/A - accommodation",
    "tips": [
      "Base yourself on or just off Route 7 to walk to tours, the market and the MAG centre.",
      "Ask for extra blankets or heating from November-February; nights on the plateau are cold.",
      "Book ahead only in peak season; otherwise arrive and compare rooms in person.",
      "Confirm whether jars-tour pickup is included when you book."
    ],
    "scamWarnings": [
      "Confirm the room rate and what a bundled 'jars tour' actually includes before paying, to avoid surprise add-ons."
    ],
    "rating": 3.9,
    "reviewSources": [
      "Travelfish",
      "Tripadvisor",
      "Booking.com"
    ],
    "mapQuery": "Phonsavan guesthouses Route 7 town centre",
    "coords": {
      "lat": 19.455,
      "lng": 103.211
    },
    "bookHint": "Walk-in comparison works off-season; book online in peak months.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Travelfish",
        "url": "https://www.travelfish.org/accommodation/laos/northern_laos/xieng_khuang/phonsavan/all"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Hotels-g612364-Phonsavan_Xiangkhouang_Province-Hotels.html"
      }
    ]
  },
  {
    "id": "la-ext-phonsavan-restaurant-scene",
    "name": "Phonsavan restaurant & bar scene (Route 7)",
    "city": "Phonsavan",
    "country": "la",
    "recognition": "The travellers' eating strip along Route 7 - most famously Craters Bar & Restaurant, decked out with genuine defused bomb casings, plus bamboo-lined Bamboozle and the Indian kitchen Nisha nearby.",
    "categories": [
      "food",
      "nightlife"
    ],
    "budgetTier": "low",
    "blurb": "Phonsavan's compact dining strip is where jars-day travellers regroup over Lao and Western plates and cold Beerlao. Craters is the landmark, its walls hung with war-era shell casings; Bamboozle does hearty Lao-Western comfort food in a bamboo interior; Nisha covers well-priced Indian and vegetarian dishes. Portions are generous, prices low, and it is the easiest place in town to swap route notes for Sam Neua, Vieng Xai and Hintang.",
    "whyItFits": "A reliable, budget-friendly cluster to eat well and meet other travellers between the region's long drives.",
    "priceRange": {
      "low": 18000,
      "typical": 45000,
      "high": 90000,
      "currency": "LAK",
      "note": "Mains roughly 18,000-50,000 LAK; a meal with a Beerlao stays well under 100,000 LAK."
    },
    "hours": "Most open late morning through evening daily; individual hours vary",
    "tips": [
      "Craters is the meet-up landmark for trip-swapping and tour tips.",
      "Nisha is the pick for vegetarians and cheap curries with fresh naan.",
      "Bring cash; card acceptance is patchy across the strip.",
      "Evenings can be chilly in winter - some rooms are unheated, so bring a layer."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Travelfish",
      "Tripadvisor"
    ],
    "mapQuery": "Craters Restaurant Phonsavan Route 7",
    "coords": {
      "lat": 19.4525,
      "lng": 103.216
    },
    "bookHint": "No booking; walk in.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Travelfish",
        "url": "https://www.travelfish.org/eatandmeet/laos/northern_laos/xieng_khuang/phonsavan/eat"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Restaurants-g612364-Phonsavan_Xiangkhouang_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-xe-bang-fai-cave",
    "name": "Xe Bang Fai Cave (Tham Khoun Xe)",
    "city": "Boualapha",
    "country": "la",
    "recognition": "You board a longtail at a remote jungle river mouth and glide into a black cavern so vast the beam of a headtorch cannot reach the ceiling — a river tunnel over 100 m high in the Hin Nam No karst.",
    "categories": [
      "cave",
      "adventure",
      "boat",
      "nature",
      "river"
    ],
    "budgetTier": "high",
    "blurb": "One of the largest active river caves on earth: the Xe Bang Fai river runs for roughly 7 km through a pitch-black limestone tunnel with chambers up to 200 m wide, now inside the UNESCO-listed Hin Nam No National Park (inscribed July 2025). Reaching it is a genuine expedition — a long drive to Boualapha, a boat and a licensed guide — and it is only safe in the dry season when the river is low. This is a committing, weather-dependent adventure rather than a roadside stop.",
    "whyItFits": "For adventurous, fit travellers with time and budget who want a world-class wild-cave expedition well off the standard trail.",
    "priceRange": {
      "low": 800000,
      "typical": 2000000,
      "high": 4500000,
      "currency": "LAK",
      "note": "Guided trip only, dry season; cost swings sharply with group size and operator (roughly from 800,000 LAK per person in a full group up to several million solo). Confirm current rates and inclusions with a Thakhek operator or the Hin Nam No ecotourism office."
    },
    "hours": "Dry season only (roughly November-April); multi-day guided trips depart by arrangement, not on demand.",
    "tips": [
      "Go only in the dry season (roughly November-April); the river is dangerous when high.",
      "Book through a reputable Thakhek operator or the Hin Nam No office and confirm guide, boat and safety gear.",
      "It is a long trip out to Boualapha - allow 2-3 days and expect basic village conditions.",
      "Bring a strong headtorch, dry-bags and sturdy sandals."
    ],
    "scamWarnings": [
      "Confirm exactly what the quoted price covers (transport, boat, guide, food, park fees) before paying.",
      "Do not attempt to reach or enter the cave without a licensed guide."
    ],
    "rating": 4.6,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet",
      "Hin Nam No National Park"
    ],
    "mapQuery": "Tham Khoun Xe Xe Bang Fai Cave Boualapha Laos",
    "coords": {
      "lat": 17.3733,
      "lng": 105.8372
    },
    "bookHint": "Book ahead through a Thakhek operator (e.g. Green Discovery) or the Hin Nam No ecotourism office; not a walk-up.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Xe_Bang_Fai_River"
      },
      {
        "org": "Laos Insider",
        "url": "https://laosinsider.com/laos-travel-guide/xe-bang-fai-cave/"
      }
    ]
  },
  {
    "id": "la-ext-that-sikhottabong",
    "name": "That Sikhottabong",
    "city": "Thakhek",
    "country": "la",
    "recognition": "A gleaming white-and-gold lotus-bud stupa standing alone on the Mekong bank about 6 km south of Thakhek, its four-sided base ringed by a walled temple compound.",
    "categories": [
      "temple",
      "culture",
      "landmark",
      "riverfront"
    ],
    "budgetTier": "low",
    "blurb": "Khammouane's most revered stupa: a gilded lotus-bud tower on the Mekong, founded by tradition in the early Sikhottabong kingdom and remodelled by later Lao kings. It is an easy short trip from Thakhek and comes alive during the full-moon festival of the third lunar month (usually February).",
    "whyItFits": "For culture-minded visitors and anyone basing in Thakhek who wants the province's key sacred site in a short outing.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free entry; donations welcome."
    },
    "hours": "Daily, roughly 08:00-18:00; busiest during the February full-moon festival.",
    "tips": [
      "Dress modestly - shoulders and knees covered - as it is an active place of worship.",
      "Visit near sunset for the light on the Mekong.",
      "Time your visit for the February full-moon festival for the full atmosphere, but expect crowds."
    ],
    "scamWarnings": [
      "Agree any tuk-tuk fare from town before setting off."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "That Sikhottabong Thakhek Laos",
    "coords": {
      "lat": 17.3547,
      "lng": 104.7905
    },
    "bookHint": "No booking; just arrive.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/That_Sikhottabong"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g7741494-d12161422-Reviews-That_Sikhottabong-Thakhek_Khammouane_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-tham-nang-aen",
    "name": "Tham Nang Aen Cave",
    "city": "Thakhek",
    "country": "la",
    "recognition": "A wide cave mouth entered through a ceremonial wooden gateway, its chambers washed in coloured neon with a small boat waiting on an underground pool.",
    "categories": [
      "cave",
      "nature",
      "family"
    ],
    "budgetTier": "low",
    "blurb": "A big, easy show-cave 18 km northeast of Thakhek on Route 12, fitted with concrete walkways, coloured lighting and a small underground lake you can tour by boat. Some travellers find the neon kitschy, but it is a low-effort first cave and a popular half-day trip from town; carry a torch as the lights can fail during power cuts.",
    "whyItFits": "For families and first-time cavers wanting an easy, well-lit cave with a fun boat ride close to town.",
    "priceRange": {
      "low": 10000,
      "typical": 20000,
      "high": 100000,
      "currency": "LAK",
      "note": "Roughly 10,000-20,000 LAK entry; the underground boat ride costs extra (around 50,000-100,000 LAK per boat)."
    },
    "hours": "Daily, roughly 08:00-17:00.",
    "tips": [
      "Carry a backup torch - the internal lighting sometimes cuts out.",
      "The boat ride on the underground pool costs extra and is worth it.",
      "Combine it with Tham Xang and Tha Falang on a Route 12 half-day."
    ],
    "scamWarnings": [
      "Confirm the boat price per boat, not per person, before boarding."
    ],
    "rating": 3.9,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "Tham Nang Aen Cave Thakhek Laos",
    "coords": {
      "lat": 17.44,
      "lng": 104.955
    },
    "bookHint": "No booking; pay at the gate.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g7741494-d9785961-Reviews-Tham_Nang_Aen_Cave-Thakhek_Khammouane_Province.html"
      },
      {
        "org": "Love Laos",
        "url": "https://love-laos.com/tham-nang-aen-cave/"
      }
    ]
  },
  {
    "id": "la-ext-tham-xang-elephant-cave",
    "name": "Tham Xang (Elephant Cave, Thakhek)",
    "city": "Thakhek",
    "country": "la",
    "recognition": "A working temple-cave east of Thakhek where, down a passage behind a large golden Buddha, a stalagmite has formed the unmistakable head and trunk of an elephant.",
    "categories": [
      "cave",
      "temple",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "A small pilgrimage cave-temple east of Thakhek on Route 12, named for a stalagmite behind the main Buddha shrine that has grown into the shape of an elephant's head and trunk. It is quick and free to visit and pairs naturally with the other Route 12 caves. Note this is the Khammouane Tham Xang - not the similarly named cave near Vang Vieng - and the 'elephant' is a rock formation, not a live-animal attraction.",
    "whyItFits": "For travellers on the Route 12 cave circuit who like quick, free, spiritually significant stops.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free; a small donation at the shrine is customary."
    },
    "hours": "Daily, daylight hours.",
    "tips": [
      "Look behind the main golden Buddha for the elephant-shaped stalagmite.",
      "Remove shoes at the shrine and dress respectfully.",
      "A very quick stop - pair it with the other Route 12 caves."
    ],
    "rating": 3.8,
    "reviewSources": [
      "Lonely Planet",
      "Google Maps consensus"
    ],
    "mapQuery": "Tham Xang Elephant Cave Thakhek Khammouane Laos",
    "coords": {
      "lat": 17.402,
      "lng": 104.845
    },
    "bookHint": "No booking.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Travelfish",
        "url": "https://www.travelfish.org/sight_profile/laos/southern_laos/khammuan/tha_khaek/640"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/tha-khaek"
      }
    ]
  },
  {
    "id": "la-ext-thakhek-loop",
    "name": "The Thakhek Loop",
    "city": "Thakhek",
    "country": "la",
    "recognition": "Signposted from Thakhek's centre, the Route 12/8/13 motorbike circuit past towering grey karst walls, rice plains and cave turn-offs - you will pass other riders on rented semi-autos with roll-bags strapped on.",
    "categories": [
      "road-trip",
      "adventure",
      "nature",
      "motorbike"
    ],
    "budgetTier": "low",
    "blurb": "The classic central-Laos motorbike circuit - roughly 450-476 km over 3-4 days on Routes 12, 8 and 13 - linking Thakhek, the karst caves, the Nam Theun 2 reservoir, Lak Sao and Kong Lor. It is the region's signature experience for confident riders, but it involves long days, variable road surfaces, roadworks and sparse fuel and repair stops, so plan the route and check your bike carefully.",
    "whyItFits": "For confident motorbikers and road-trippers wanting a multi-day karst adventure at their own pace.",
    "priceRange": {
      "low": 100000,
      "typical": 150000,
      "high": 250000,
      "currency": "LAK",
      "note": "Bike hire from Thakhek roughly 100,000-200,000 LAK/day for a semi-auto plus fuel; total cost also depends on 3-4 nights of budget guesthouses along the way."
    },
    "hours": "Rideable year-round; best in the November-March dry season. Ride in daylight only.",
    "tips": [
      "Check brakes, tyres and lights before renting, and photograph any existing damage.",
      "Carry cash - ATMs are scarce once you leave Thakhek and Lak Sao.",
      "Ride in daylight only; livestock, potholes and roadworks are common.",
      "Pack a light layer - the Nakai plateau turns cool and wet."
    ],
    "scamWarnings": [
      "Agree the rental terms, deposit and damage policy in writing; some shops overcharge for scratches.",
      "Leave a cash deposit rather than your passport if the shop allows it."
    ],
    "rating": 4.7,
    "reviewSources": [
      "Lonely Planet",
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "Thakhek Loop start Thakhek Laos",
    "coords": {
      "lat": 17.4085,
      "lng": 104.8007
    },
    "bookHint": "No booking for the route; reserve a bike a day ahead in high season.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Novo-Monde",
        "url": "https://www.novo-monde.com/en/thakhek-loop-konglor-cave/"
      },
      {
        "org": "360nomad",
        "url": "https://360nomad.org/thakhek-loop-the-complete-guide/"
      }
    ]
  },
  {
    "id": "la-ext-tham-pha-chan",
    "name": "Tham Pha Chan",
    "city": "Thakhek",
    "country": "la",
    "recognition": "A colossal cave portal about 60 m high with a shallow river running straight through the mountain, a small Buddha image set high on the far wall.",
    "categories": [
      "cave",
      "nature",
      "swimming",
      "adventure"
    ],
    "budgetTier": "low",
    "blurb": "A cathedral-scale cave arch north of Thakhek where a river flows about 600 m clean through the mountain beneath a small hillside Buddha image, with the swimmable Nam Don resurgence lagoon nearby. It sits at the end of a rough track off Route 13, so most people arrive with a guide or a capable bike, and the walk-through is reliable only in the dry season.",
    "whyItFits": "For active loop riders and cave lovers happy to tackle a rough track for a dramatic, uncrowded cave and a swim.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "No fixed entry fee; your cost is transport or a guide - arrange a tuk-tuk or guide at the Thakhek Tourist Information Centre."
    },
    "hours": "Daylight only; the river passage is passable mainly in the dry season (roughly November-April).",
    "tips": [
      "Best in the dry season when you can walk the river passage.",
      "The final track is rough - come by capable bike, tuk-tuk or with a guide from the Thakhek Tourist Information Centre.",
      "Bring water shoes and a torch; the Nam Don lagoon nearby is good for a swim."
    ],
    "scamWarnings": [
      "Fix the tuk-tuk or guide round-trip fare in advance, including waiting time."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Lonely Planet",
      "Google Maps consensus"
    ],
    "mapQuery": "Tham Pha Chan cave Khammouane Laos",
    "coords": {
      "lat": 17.65,
      "lng": 104.85
    },
    "bookHint": "Arrange transport or a guide at the Thakhek Tourist Information Centre.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/tha-khaek"
      },
      {
        "org": "Novo-Monde",
        "url": "https://www.novo-monde.com/en/thakhek-loop-konglor-cave/"
      }
    ]
  },
  {
    "id": "la-ext-nam-kading-npa",
    "name": "Nam Kading NPA",
    "city": "Pakkading",
    "country": "la",
    "recognition": "Steep forested limestone gorges closing in on the jade-green Nam Kading river where it meets the Mekong at Pakkading, crossed by the Route 13 bridge.",
    "categories": [
      "nature",
      "wildlife",
      "river",
      "protected-area"
    ],
    "budgetTier": "mid",
    "blurb": "A rugged protected area of steep forested karst around the Nam Kading river in Bolikhamsai, rich in hornbills, gibbons and other wildlife but with almost no visitor infrastructure. There is no ticketed entry or marked trail system; access is essentially by private boat and local guide from Pakkading, and off-path travel carries UXO risk. It suits self-reliant naturalists rather than casual sightseers.",
    "whyItFits": "For serious birders and wilderness travellers comfortable arranging their own boat and guide with no facilities.",
    "priceRange": {
      "low": 200000,
      "typical": 500000,
      "high": 1200000,
      "currency": "LAK",
      "note": "No formal entry fee or tourism set-up; your cost is a privately negotiated boat and guide from Pakkading, which varies widely by group and duration."
    },
    "hours": "No set hours; day access by boat only, safest in the dry season.",
    "tips": [
      "There is no visitor centre or ticket office - arrange a boat and guide in Pakkading.",
      "Go with a local guide and stay on established routes; central Laos still has unexploded ordnance (UXO) off-trail.",
      "Best wildlife chances are early morning from the water.",
      "Bring everything you need; there are no shops or facilities inside."
    ],
    "scamWarnings": [
      "Negotiate the full boat and guide price clearly before departing."
    ],
    "reviewSources": [
      "Lonely Planet",
      "Wikipedia",
      "Ecotourism Laos"
    ],
    "mapQuery": "Nam Kading National Protected Area Pakkading Laos",
    "coords": {
      "lat": 18.3,
      "lng": 104.1
    },
    "bookHint": "Arrange a boat and guide locally in Pakkading; no formal booking exists.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Nam_Kading_National_Protected_Area"
      },
      {
        "org": "Ecotourism Laos",
        "url": "https://www.ecotourismlaos.com/namkading"
      }
    ]
  },
  {
    "id": "la-ext-nakai-nam-theun-reservoir",
    "name": "Nakai Plateau & Nam Theun 2 Reservoir",
    "city": "Nakai",
    "country": "la",
    "recognition": "A vast pale-blue lake on the Nakai plateau bristling with thousands of bleached dead tree trunks reflected in still water.",
    "categories": [
      "nature",
      "viewpoint",
      "boat",
      "landscape"
    ],
    "budgetTier": "low",
    "blurb": "A haunting, man-made landscape on the Nakai plateau: the Nam Theun 2 hydropower reservoir flooded a forest in 2008, leaving thousands of bleached dead trees standing in pale water. Guesthouses in Nakai can arrange boat rides, and short hikes and the Song Sou waterfall lie nearby. Be aware the lake displaced more than 6,000 villagers - a history worth understanding before you photograph the 'ghost forest'.",
    "whyItFits": "For photographers and slow travellers drawn to eerie, off-beat landscapes and willing to reflect on the dam's human cost.",
    "priceRange": {
      "low": 5000,
      "typical": 100000,
      "high": 400000,
      "currency": "LAK",
      "note": "Reservoir viewpoints are free; boat rides are arranged (and negotiated) via Nakai guesthouses; the nearby Song Sou waterfall charges around 5,000 LAK parking."
    },
    "hours": "Daytime; the visitor centre keeps roughly business hours.",
    "tips": [
      "Dawn and dusk give the best reflections on the dead-tree 'ghost forest'.",
      "Arrange boat rides through Nakai guesthouses and agree the price first.",
      "The plateau is cooler and wetter than the lowlands - bring a layer and rain cover.",
      "Stay on roads and paths; UXO remains a risk off established ground."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Atlas Obscura",
      "Google Maps consensus"
    ],
    "mapQuery": "Nam Theun 2 reservoir Nakai Laos flooded forest",
    "coords": {
      "lat": 17.66,
      "lng": 105.1
    },
    "bookHint": "Arrange boat rides via Nakai guesthouses; no central booking.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Atlas Obscura",
        "url": "https://www.atlasobscura.com/places/flooded-trees-nam-theun-ii-laos"
      },
      {
        "org": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Nam_Theun_2_Dam"
      }
    ]
  },
  {
    "id": "la-ext-paksan-riverfront",
    "name": "Paksan Mekong Riverfront",
    "city": "Paksan",
    "country": "la",
    "recognition": "A sleepy Mekong esplanade at the mouth of the Nam San, looking straight across to Bueng Kan in Thailand, with a gilded temple or two along the bank.",
    "categories": [
      "riverfront",
      "town",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "The low-key capital of Bolikhamsai, a Mekong town at the mouth of the Nam San facing Bueng Kan in Thailand. There is little to 'do' beyond a quiet riverside stroll, a couple of temples and a border crossing, but it is a pleasant, tout-free pause on Route 13 or the start of the Route 8 road toward the Vietnam border.",
    "whyItFits": "For overlanders and slow travellers wanting a genuine, unpolished Mekong town and border stop.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free; a low-key riverfront town with no admission."
    },
    "hours": "Riverfront always open; liveliest around sunset.",
    "tips": [
      "Come at sunset for the best of the Mekong and the Thai lights opposite.",
      "This is a transit town - keep expectations modest and enjoy the calm.",
      "It is the jumping-off point for Route 8 to the Vietnam border at Nam Phao."
    ],
    "rating": 3.5,
    "reviewSources": [
      "Google Maps consensus",
      "Tourism Laos"
    ],
    "mapQuery": "Paksan riverfront Bolikhamsai Laos",
    "coords": {
      "lat": 18.3841,
      "lng": 103.6577
    },
    "bookHint": "No booking.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tourism Laos",
        "url": "https://www.tourismlaos.org/central-provinces/bolikhamsai-province/"
      },
      {
        "org": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Bolikhamxai_Province"
      }
    ]
  },
  {
    "id": "la-ext-thakhek-french-quarter",
    "name": "Thakhek French Colonial Quarter",
    "city": "Thakhek",
    "country": "la",
    "recognition": "Faded French-era shophouses and shuttered villas around the central fountain circle and the old Mekong customs frontage, a block back from the river.",
    "categories": [
      "culture",
      "heritage",
      "architecture",
      "town",
      "riverfront"
    ],
    "budgetTier": "low",
    "blurb": "The old riverside heart of Thakhek keeps a cluster of faded French-colonial shophouses, shuttered villas and the former customs frontage around the central fountain circle. It is a short, atmospheric wander - best in soft morning or evening light - rather than a formal attraction, and rewards travellers who enjoy decaying-colonial character and a riverside coffee stop.",
    "whyItFits": "For travellers who enjoy colonial architecture, photography and unhurried town wandering.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free to wander; a self-guided stroll."
    },
    "hours": "Always open; pleasant in early morning or at sunset.",
    "tips": [
      "Wander early morning or at golden hour for photos of the colonial facades.",
      "Grab a coffee at a fountain-square cafe and watch the town wake up.",
      "Many buildings are private or derelict - admire them from the street."
    ],
    "rating": 3.8,
    "reviewSources": [
      "Lonely Planet",
      "Google Maps consensus"
    ],
    "mapQuery": "Thakhek fountain square old town Laos",
    "coords": {
      "lat": 17.4046,
      "lng": 104.801
    },
    "bookHint": "No booking.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Thakhek"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/tha-khaek"
      }
    ]
  },
  {
    "id": "la-ext-wat-phabat-phonsan",
    "name": "Wat Phabat Phonsan",
    "city": "Thaphabat",
    "country": "la",
    "recognition": "A hilltop temple off Route 13 sheltering a large gold-leafed 'Buddha footprint' pressed into the rock, busy with Lao pilgrims travelling between Vientiane and Paksan.",
    "categories": [
      "temple",
      "culture",
      "landmark",
      "pilgrimage"
    ],
    "budgetTier": "low",
    "blurb": "A popular roadside pilgrimage temple in Bolikhamsai, roughly 80 km south of Vientiane on Route 13, built around a large 'Buddha footprint' impression in the rock that pilgrims cover in gold leaf. Lao travellers routinely stop here for a safe-journey blessing, and the January full-moon festival draws big crowds; it is an easy, free cultural break between Vientiane and Paksan.",
    "whyItFits": "For culturally curious road-trippers wanting an authentic Lao pilgrimage stop on the Vientiane-Paksan highway.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 0,
      "currency": "LAK",
      "note": "Free; a small offering is customary if you wish to pay respects."
    },
    "hours": "Daily, roughly 08:00-17:00; major festival on the January full moon.",
    "tips": [
      "Dress modestly and remove shoes before entering the footprint shrine.",
      "A small offering of flowers or incense is customary if you wish to pay respects.",
      "Easy to fold into the drive between Vientiane and Paksan."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Tourism Laos",
      "Google Maps consensus"
    ],
    "mapQuery": "Wat Phabat Phonsan Bolikhamsai Laos",
    "coords": {
      "lat": 18.33,
      "lng": 103.13
    },
    "bookHint": "No booking.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tourism Laos",
        "url": "https://www.tourismlaos.org/central-provinces/bolikhamsai-province/"
      },
      {
        "org": "Hidden Land Travel",
        "url": "https://hiddenlandtravel.com/wat-phabat/"
      }
    ]
  },
  {
    "id": "la-ext-tad-faek",
    "name": "Tad Faek Waterfall",
    "city": "Sekong",
    "country": "la",
    "recognition": "A wide, low rock ledge where the Xe Nam Noy-side river drops only about 5 metres into a broad swimming pool, edged by simple bamboo-and-thatch salas and a small local eatery, roughly 14 km south of Sekong town.",
    "categories": [
      "waterfall",
      "swimming",
      "nature"
    ],
    "budgetTier": "low",
    "blurb": "Tad Faek is a broad, gentle cascade on the eastern edge of the Bolaven Plateau, popular with Lao families for picnicking and swimming rather than for height. The wide upper pool is calm enough for a dip; the lower boulder pool is locally said to hold sharp-toothed pa pao (puffer) fish, so people mostly swim in the upper basin. Rustic bamboo shelters and a small restaurant sit at the water's edge, with staff typically leaving by around 17:00.",
    "whyItFits": "Suits Bolaven-loop riders and families wanting an easy, uncrowded roadside swim spot in under-visited Sekong Province.",
    "priceRange": {
      "low": 5000,
      "typical": 10000,
      "high": 20000,
      "currency": "LAK",
      "note": "Small nominal entry/parking fee; tube rental extra. Cash (kip) only."
    },
    "hours": "Daylight hours; food and staff usually gone by around 17:00",
    "tips": [
      "Best flow and swimming are in the cooler dry months (roughly November-February); the river runs high and muddy in the July-September rains.",
      "Bring your own snacks and water in case the small restaurant has closed for the day.",
      "Stick to the upper pool for swimming; the lower pool is rocky and reportedly holds biting puffer fish.",
      "Fuel up in Sekong town first, as there are no reliable pumps at the falls."
    ],
    "scamWarnings": [
      "Agree any tuk-tuk or share-taxi fare from Sekong before setting off; there is little onward transport once you are dropped."
    ],
    "rating": 3.9,
    "reviewSources": [
      "Wearelao",
      "limited traveller reports"
    ],
    "mapQuery": "Tad Faek Waterfall Sekong Laos",
    "coords": {
      "lat": 15.2451,
      "lng": 106.7513
    },
    "bookHint": "No booking; pay the small fee at the site. Bamboo shelters are first-come.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Wearelao (Sekong Waterfalls)",
        "url": "https://wearelao.com/standard-page/sekong-waterfalls/"
      }
    ]
  },
  {
    "id": "la-ext-tad-hua-khon",
    "name": "Tad Hua Khon Waterfall",
    "city": "Sekong",
    "country": "la",
    "recognition": "A wide sheet of the Xe Nam Noy river spilling over a broad ledge, reached by a short forest path past picnic salas, a few kilometres beyond Tad Faek south of Sekong.",
    "categories": [
      "waterfall",
      "swimming",
      "nature"
    ],
    "budgetTier": "low",
    "blurb": "Tad Hua Khon is the more striking of Sekong's roadside falls, a wide curtain of water on the plateau's eastern rim with swimming holes and a short path through the trees. Local accounts link its name to a wartime tragedy, so it carries some solemnity for nearby communities. It is a common stop on the 'big loop' between Paksong, Sekong and Attapeu.",
    "whyItFits": "Gives loop riders a genuinely scenic, swimmable waterfall in a province most travellers skip entirely.",
    "priceRange": {
      "low": 5000,
      "typical": 10000,
      "high": 20000,
      "currency": "LAK",
      "note": "Small entry/parking fee, cash only. No card facilities."
    },
    "hours": "Daylight hours; quietest early morning",
    "tips": [
      "The falls are widest just after the rains (roughly August-November); flow drops noticeably by March-April.",
      "Wear grippy sandals for the wet rocks around the swimming holes.",
      "Combine it with Tad Faek nearby for an easy half-day from Sekong town.",
      "Carry small kip for the entry booth and any drinks."
    ],
    "scamWarnings": [
      "If hiring a driver from Sekong, fix the round-trip price and waiting time in advance."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Wearelao",
      "limited traveller reports"
    ],
    "mapQuery": "Tad Hua Khon Waterfall Sekong Laos",
    "coords": {
      "lat": 15.205,
      "lng": 106.77
    },
    "bookHint": "No booking; pay at the booth on arrival.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Wearelao (Sekong Waterfalls)",
        "url": "https://wearelao.com/standard-page/sekong-waterfalls/"
      }
    ]
  },
  {
    "id": "la-ext-nong-fa-lake",
    "name": "Nong Fa Crater Lake",
    "city": "Attapeu",
    "country": "la",
    "recognition": "A near-circular, startlingly sky-blue crater lake ringed by forest high in the Dong Ampham conservation area of far north-east Attapeu, close to the Vietnamese border.",
    "categories": [
      "lake",
      "nature",
      "viewpoint",
      "remote"
    ],
    "budgetTier": "mid",
    "blurb": "Nong Fa ('Blue Lake') is a remote highland lake whose vivid blue water and reputed great depth have made it a minor legend; American pilots operating near the Ho Chi Minh Trail are said to have called it 'Dollar Lake' for its round shape. Locals traditionally avoid bathing here, tied to a guardian-spirit belief. Reaching it is a genuine expedition deep into a protected forest, not a casual day trip.",
    "whyItFits": "A bucket-list reward for hardy overlanders and 4WD/adventure-motorbike travellers who want the wildest corner of the deep south-east.",
    "priceRange": {
      "currency": "LAK",
      "note": "No fixed entry fee, but expect significant cost for a 4WD or dirt-bike and a local guide/permit arrangement; budget for a full-day charter from Attapeu town. Cash only."
    },
    "hours": "Daytime only; access is weather-dependent",
    "tips": [
      "Attempt only in the dry season (roughly December-April); rains turn the forest tracks to impassable mud.",
      "Arrange a local guide and check current access/permit rules in Attapeu town first, as this is a sensitive border and conservation zone.",
      "This region was heavily bombed and remains UXO-affected; never leave established tracks or dig, and follow your guide exactly.",
      "Go self-sufficient: carry fuel, water, food and a basic repair kit, as there are no services near the lake."
    ],
    "scamWarnings": [
      "Confirm the guide/driver's total price, fuel and what the fee covers before departing Attapeu; there is no way to renegotiate once out in the forest.",
      "Be wary of anyone promising easy access in the wet season."
    ],
    "rating": 4.2,
    "reviewSources": [
      "GT-Rider motorcycle forum",
      "limited traveller reports (remote site)"
    ],
    "mapQuery": "Nong Fa Lake Attapeu Laos",
    "coords": {
      "lat": 15.11,
      "lng": 107.16
    },
    "bookHint": "No online booking; arrange transport, guide and any permit through operators or the tourism office in Attapeu town.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "GT-Rider",
        "url": "https://www.gt-rider.com/se-asia-motorcycling/"
      },
      {
        "org": "Tourism Laos (Attapeu Province)",
        "url": "https://www.tourismlaos.org/southern-provinces/attapeu-province/"
      }
    ]
  },
  {
    "id": "la-ext-beung-kiat-ngong",
    "name": "Beung Kiat Ngong Wetland & Kiet Ngong Village",
    "city": "Kiet Ngong",
    "country": "la",
    "recognition": "A broad reed-and-marsh wetland at the foot of Phou Asa hill beside the stilted village of Ban Kiet Ngong, gateway to the Xe Pian protected area about 56 km south of Pakse, where domesticated elephants have long worked the fields.",
    "categories": [
      "wildlife",
      "nature",
      "village",
      "wetland",
      "birdwatching"
    ],
    "budgetTier": "low",
    "blurb": "Beung Kiat Ngong is Laos's first Ramsar-listed wetland and the community jump-off point for the Xe Pian NPA, one of the country's most important protected areas for birds and large mammals. Ban Kiet Ngong is a traditional village long associated with working elephants, and community-run walks, canoe trips and birdwatching are the ethical draw. Historic elephant-back rides raise welfare concerns; where possible choose observation, walking or community-managed elephant projects over riding.",
    "whyItFits": "For nature-minded travellers who want low-impact, community-based wildlife and wetland experiences away from the Pakse day-tripper crowds.",
    "priceRange": {
      "low": 20000,
      "typical": 100000,
      "high": 400000,
      "currency": "LAK",
      "note": "Small village/wetland entry; guided walks, canoe trips and multi-day treks are priced per group and are the main cost. Cash only."
    },
    "hours": "Village accessible any time; guided activities and birdwatching best at dawn",
    "tips": [
      "Arrange guides through the village or the Pakse tourism information office; all Xe Pian treks should use a local guide.",
      "Prefer walking, canoeing or observing elephants over riding them, for the animals' welfare.",
      "Dawn is best for birdlife over the wetland; bring binoculars and mosquito repellent.",
      "Stay overnight in a village homestay or nearby ecolodge to catch morning and evening wildlife activity."
    ],
    "scamWarnings": [
      "Agree the guide, activity and price clearly before starting; freelance touts sometimes overquote.",
      "Decline any offer involving wildlife handling or feeding beyond sanctioned community elephant activities."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Ecotourism Laos",
      "Tripadvisor"
    ],
    "mapQuery": "Ban Kiet Ngong Xe Pian Laos",
    "coords": {
      "lat": 14.135,
      "lng": 106.183
    },
    "bookHint": "Book guides/homestays on arrival in the village or via the Pakse Provincial Tourism office; no reliable online booking.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Ecotourism Laos",
        "url": "https://www.ecotourismlaos.com/"
      },
      {
        "org": "Wikipedia (Beung Kiat Ngong Wetlands)",
        "url": "https://en.wikipedia.org/wiki/Beung_Kiat_Ngong_Wetlands"
      }
    ]
  },
  {
    "id": "la-ext-phou-asa",
    "name": "Phou Asa Mountain Ruins",
    "city": "Kiet Ngong",
    "country": "la",
    "recognition": "A flat-topped hill above Ban Kiet Ngong crowned by a ring of roughly 100 stubby stone pillars, each capped with a flat slab, encircling a ruined shrine with sweeping views over the Xe Pian wetlands.",
    "categories": [
      "history",
      "hike",
      "viewpoint",
      "ruins"
    ],
    "budgetTier": "low",
    "blurb": "Phou Asa is an enigmatic hilltop ruin above Kiet Ngong: a rough ring of over a hundred plate-topped stone columns whose purpose (temple or 19th-century rebel stronghold) is still debated. The short climb rewards you with a panorama across the wetlands, forest and the Bolaven Plateau's edge. It is usually visited together with the village and wetland below.",
    "whyItFits": "A mysterious, low-effort archaeological viewpoint that pairs perfectly with the Kiet Ngong wetland for history-minded travellers.",
    "priceRange": {
      "low": 20000,
      "typical": 50000,
      "high": 100000,
      "currency": "LAK",
      "note": "Nominal site/guide fee arranged in the village; cash only. Elephant-ride ascents may be offered but are best declined on welfare grounds."
    },
    "hours": "Daylight; go early morning or late afternoon to avoid midday heat",
    "tips": [
      "It is a short but exposed climb, roughly 20-40 minutes on foot; wear a hat and carry water.",
      "Take a village guide, both for the path and to hear the competing legends about the ruins.",
      "Late afternoon light is best for photos over the wetland.",
      "Skip the elephant-back ascent and walk instead, for the animals' sake."
    ],
    "scamWarnings": [
      "Fix the guide fee before climbing; confirm whether it is per person or per group."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Tripadvisor",
      "Discover Laos"
    ],
    "mapQuery": "Phou Asa Wat Phou Asa Kiet Ngong Laos",
    "coords": {
      "lat": 14.14,
      "lng": 106.19
    },
    "bookHint": "No booking; arrange a guide at Ban Kiet Ngong.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g670161-d1219397-Reviews-Phou_Asa_Mountain-Pakse_Champasak_Province.html"
      },
      {
        "org": "Discover Laos",
        "url": "https://discoverlaos.today/"
      }
    ]
  },
  {
    "id": "la-ext-tad-soung",
    "name": "Tad Soung Waterfall",
    "city": "Tad Lo",
    "country": "la",
    "recognition": "The tall upstream member of the Tad Lo cluster: the Xe Set river plunging off a high cliff, reached by a short walk to a rock viewpoint above the valley, distinct from the low, swimmable main Tad Lo/Tad Hang falls.",
    "categories": [
      "waterfall",
      "viewpoint",
      "hike",
      "nature"
    ],
    "budgetTier": "low",
    "blurb": "Tad Soung is the highest of the waterfalls around Tad Lo village, a dramatic near-vertical drop of the Xe Set best seen from the clifftop viewpoint above. In the dry season the flow thins to threads, but in and after the rains it becomes genuinely spectacular. Scrambling to the base is rough and only for the sure-footed; most visitors enjoy it from the top.",
    "whyItFits": "Gives Tad Lo visitors a big-drop, big-view waterfall beyond the well-trodden village pools, without a long journey.",
    "priceRange": {
      "low": 0,
      "typical": 10000,
      "high": 20000,
      "currency": "LAK",
      "note": "Little or no fixed fee; a small parking/access charge at times. Cash only."
    },
    "hours": "Daylight; morning light favours the viewpoint",
    "tips": [
      "Go in or shortly after the rainy season (roughly July-November) for the fullest flow; it is a trickle by March-April.",
      "The clifftop viewpoint is an easy short walk; descending toward the base is a rough scramble, not recommended alone or in the wet.",
      "Reach it by rented bike or a guide from Tad Lo village.",
      "Combine with the main Tad Lo and Tad Hang falls for a full waterfall day."
    ],
    "scamWarnings": [
      "If hiring a guide or moto-taxi from Tad Lo, agree the fare and waiting time first."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Discover Laos",
      "Travelfish"
    ],
    "mapQuery": "Tad Soung Waterfall Tad Lo Salavan Laos",
    "coords": {
      "lat": 15.43,
      "lng": 106.412
    },
    "bookHint": "No booking; ride or walk up from Tad Lo village.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Travelfish (Tad Lo)",
        "url": "https://www.travelfish.org/location/laos/southern_laos/salavan/tad_lo"
      },
      {
        "org": "Discover Laos",
        "url": "https://discoverlaos.today/"
      }
    ]
  },
  {
    "id": "la-ext-attapeu-riverfront",
    "name": "Attapeu Town Riverfront",
    "city": "Attapeu",
    "country": "la",
    "recognition": "A sleepy, tree-lined provincial capital (Samakhixay) set in a wide green valley near the meeting of the Xe Kong, Xe Kaman and Xe Xou rivers, with a busy early-morning market and low-key riverside lanes.",
    "categories": [
      "town",
      "riverfront",
      "market",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "Attapeu, officially Muang Samakhixay, is a relaxed and rarely visited town in Laos's far south-east, ringed by mountains where several rivers meet. The main draws are the atmosphere and the dawn market, where traders from several ethnic groups buy and sell. It works best as a friendly base for the surrounding rivers, temples and the long approach toward Nong Fa.",
    "whyItFits": "A genuinely off-the-map provincial town for slow travellers who want everyday Lao life rather than sights ticked off a list.",
    "priceRange": {
      "currency": "LAK",
      "note": "Wandering the riverfront and market is free; you only pay for food, drinks and any boat hire. Cash only."
    },
    "hours": "Market busiest around 06:00-08:00; riverfront pleasant at dusk",
    "tips": [
      "Visit the market at first light for the widest range of produce and the best people-watching.",
      "Bring cash from Pakse; ATMs and card acceptance are limited this far south-east.",
      "Use the town as a staging post for Nong Fa and Xe Pian access rather than expecting big-ticket sights.",
      "Nong Lom, a small lake a few kilometres out, is a popular local picnic spot."
    ],
    "scamWarnings": [
      "Agree any river-boat or tuk-tuk charter price and route before boarding."
    ],
    "rating": 3.8,
    "reviewSources": [
      "Tourism Laos",
      "limited traveller reports"
    ],
    "mapQuery": "Attapeu town Samakhixay Laos",
    "coords": {
      "lat": 14.808,
      "lng": 106.834
    },
    "bookHint": "No booking needed; guesthouses in town are walk-in.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tourism Laos",
        "url": "https://www.tourismlaos.org/southern-provinces/attapeu-province/"
      }
    ]
  },
  {
    "id": "la-ext-salavan-town",
    "name": "Salavan Town & Markets",
    "city": "Salavan",
    "country": "la",
    "recognition": "A quiet provincial capital on the northern rim of the Bolaven Plateau whose daytime morning market is the main pulse of town, framed by highland farms and minority villages.",
    "categories": [
      "town",
      "market",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "Salavan is a low-key provincial town that most travellers only pass through, useful as a base for Tad Lo, the Xe Set and surrounding ethnic-minority villages. The lively morning market is the main draw, alongside easygoing riverside walks and access to Bolaven coffee country. It rewards travellers who value atmosphere and local life over headline attractions.",
    "whyItFits": "A practical, authentic highland base for reaching Tad Lo, Tad Soung and Bolaven villages without any tourist gloss.",
    "priceRange": {
      "currency": "LAK",
      "note": "Markets and town walks are free; pay only for food, transport and lodging. Cash only."
    },
    "hours": "Morning market from around 06:00",
    "tips": [
      "Rent a motorbike here to reach Tad Lo and nearby villages, but carry plenty of kip for fuel.",
      "Stock up on cash in Pakse or Salavan town, as smaller towns beyond have few ATMs.",
      "Ask locally before venturing off-road; parts of the province remain UXO-affected.",
      "Expect a functional town rather than a scenic destination in its own right."
    ],
    "scamWarnings": [
      "Fix motorbike-rental condition and fuel level at pickup and photograph any existing damage."
    ],
    "rating": 3.6,
    "reviewSources": [
      "Tourism Laos",
      "Travelfish"
    ],
    "mapQuery": "Salavan town Laos",
    "coords": {
      "lat": 15.717,
      "lng": 106.417
    },
    "bookHint": "No booking needed; town guesthouses are walk-in.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Travelfish",
        "url": "https://www.travelfish.org/location/laos/southern_laos/salavan/salavan"
      },
      {
        "org": "Tourism Laos",
        "url": "https://www.tourismlaos.org/"
      }
    ]
  },
  {
    "id": "la-ext-tad-tayicseua",
    "name": "Tad Tayicseua Waterfall Valley",
    "city": "Paksong",
    "country": "la",
    "recognition": "A remote forested valley on the far eastern Bolaven holding a chain of several waterfalls linked by jungle trails, reached down a rough dirt track past coffee plantations, with a simple viewpoint guesthouse at the trailhead.",
    "categories": [
      "waterfall",
      "hike",
      "nature",
      "adventure"
    ],
    "budgetTier": "low",
    "blurb": "Tad Tayicseua is a cluster of waterfalls (often described as seven) in a deep, forested valley on the little-visited eastern edge of the Bolaven Plateau. A network of trails links the falls through dense jungle and coffee farms, and a rustic guesthouse at the rim makes a memorable overnight. The final approach is a rough dirt road, so it stays quiet.",
    "whyItFits": "For active travellers who want to trade the standard loop viewpoints for a full day of jungle waterfall hiking well off the beaten track.",
    "priceRange": {
      "low": 10000,
      "typical": 20000,
      "high": 40000,
      "currency": "LAK",
      "note": "Small entry/parking fee at the trailhead; guide and simple room extra. Cash only."
    },
    "hours": "Daylight hours; allow several hours to hike the full trail circuit",
    "tips": [
      "Come in the dry season (roughly November-March); the last dirt kilometres and the trails get treacherous in the rains, when a dirt bike or 4WD is needed.",
      "Wear proper shoes and start early, as the full circuit is a real half-day hike.",
      "Consider a local guide for the trails, which are steep, slippery and easy to lose.",
      "Fuel and food are scarce nearby, so arrive topped up and carry water and snacks."
    ],
    "scamWarnings": [
      "Confirm the entry fee and any guide charge at the trailhead before starting the hike."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Tripadvisor",
      "traveller blogs"
    ],
    "mapQuery": "Tad Tayicseua waterfall Bolaven Plateau Laos",
    "coords": {
      "lat": 15.13,
      "lng": 106.4
    },
    "bookHint": "Rooms/guides arranged on arrival; there is a basic trailhead guesthouse.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g3680578-d13436034-Reviews-Tad_Tayicseua-Paksong_Champasak_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-sekong-riverfront",
    "name": "Sekong Town & Xe Kong Riverfront",
    "city": "Sekong",
    "country": "la",
    "recognition": "A small, ethnically diverse provincial capital on the wide Xe Kong river below the plateau, with a produce market, riverside eateries and longtail boats that can be hired for scenic runs.",
    "categories": [
      "town",
      "riverfront",
      "market",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "Sekong (Xekong) is one of Laos's most ethnically diverse provinces, and its riverside capital is the natural base for the Tad Faek and Tad Hua Khon falls and the big Bolaven loop toward Attapeu. The town itself is modest; its pleasures are the market, riverside food stalls, and the chance to arrange a longtail boat along the Xe Kong. It suits travellers who enjoy quiet, workaday towns over attractions.",
    "whyItFits": "A convenient, authentic launch point for eastern-Bolaven waterfalls and river trips that almost no foreign travellers reach.",
    "priceRange": {
      "low": 0,
      "typical": 100000,
      "high": 400000,
      "currency": "LAK",
      "note": "Town and market are free; a hired longtail boat is negotiated per trip. Cash only."
    },
    "hours": "Market from early morning; riverfront pleasant late afternoon",
    "tips": [
      "Use Sekong as your base for Tad Faek and Tad Hua Khon, both a short ride south.",
      "Negotiate longtail-boat trips at the river; agree the route, duration and price up front.",
      "Bring enough cash from Pakse, as banking options are limited.",
      "The dry season (November-February) gives the most comfortable weather and river conditions."
    ],
    "scamWarnings": [
      "Fix any boat-charter price and turnaround time clearly before departure to avoid disputes on the water."
    ],
    "rating": 3.7,
    "reviewSources": [
      "Tourism Laos",
      "limited traveller reports"
    ],
    "mapQuery": "Sekong town Xe Kong river Laos",
    "coords": {
      "lat": 15.348,
      "lng": 106.729
    },
    "bookHint": "No booking; guesthouses are walk-in, boats arranged at the riverside.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tourism Laos",
        "url": "https://www.tourismlaos.org/southern-provinces/xekong-province/"
      }
    ]
  },
  {
    "id": "la-ext-don-daeng-island",
    "name": "Don Daeng Island",
    "city": "Champasak",
    "country": "la",
    "recognition": "A long, car-free Mekong island facing Champasak town, ringed by a sandy track past stilt houses, an old brick stupa and rice fields, with Wat Phou's sacred mountain (Phou Kao) on the western skyline.",
    "categories": [
      "island",
      "nature",
      "culture",
      "cycling"
    ],
    "budgetTier": "low",
    "blurb": "A quiet river island inside the Wat Phou UNESCO buffer zone, with no cars, community homestays and the upscale La Folie Lodge. Cycle the ~8 km ring track past temples and paddies, and watch the sunset over the Mekong. Genuinely peaceful, but facilities are minimal.",
    "whyItFits": "Suits slow travellers and cyclists who want authentic river-island life beside the UNESCO site without the day-tripper crowds.",
    "priceRange": {
      "low": 20000,
      "typical": 80000,
      "high": 150000,
      "currency": "LAK",
      "note": "Short boat crossing ~20,000-30,000 LAK; village homestays ~50,000-100,000 LAK; La Folie Lodge is a separate upscale property quoted in USD."
    },
    "hours": "Island access year-round; boats run in daylight, roughly 07:00-18:00.",
    "tips": [
      "Bring cash; there are no ATMs on the island.",
      "Rent a bicycle from your homestay to circle the island.",
      "Dry season (Nov-Feb) is best; tracks get muddy in the rains.",
      "Arrange crossings from Champasak's Wat Muang Kang pier."
    ],
    "scamWarnings": [
      "Agree the boat fare per person or per boat before departing."
    ],
    "rating": 4.3,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet",
      "Google Maps consensus"
    ],
    "mapQuery": "Don Daeng Island Champasak",
    "coords": {
      "lat": 14.85,
      "lng": 105.885
    },
    "bookHint": "Homestays arranged on arrival or via Champasak guesthouses; La Folie Lodge books online.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet (Southern Laos)",
        "url": "https://www.lonelyplanet.com/laos/southern-laos"
      },
      {
        "org": "Tripadvisor (La Folie Lodge)",
        "url": "https://www.tripadvisor.com/Hotel_Review-g12363855-d1047965-Reviews-La_Folie_Lodge-Don_Daeng_Island_Champasak_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-uo-moung-tomo-temple",
    "name": "Uo Moung (Tomo Temple)",
    "city": "Champasak",
    "country": "la",
    "recognition": "Moss-covered sandstone Khmer ruins in forest on the Mekong's east bank, reached by a short boat hop and a path, with carved lintels and a sacred spring — far quieter than Wat Phou across the water.",
    "categories": [
      "ruins",
      "temple",
      "history",
      "nature"
    ],
    "budgetTier": "low",
    "blurb": "A ninth-century pre-Angkorian Khmer sanctuary (also spelled Oup Moung/Tomo), historically linked to Wat Phou. Scattered laterite and sandstone blocks and a few carved lintels sit among the trees. Atmospheric and little-visited, with no real facilities.",
    "whyItFits": "For history-minded travellers who have done Wat Phou and want its overgrown, crowd-free companion site.",
    "priceRange": {
      "low": 10000,
      "typical": 20000,
      "currency": "LAK",
      "note": "Small site donation/fee ~10,000-20,000 LAK; boat charter across the Mekong is extra and negotiable."
    },
    "hours": "Daylight hours; no fixed schedule — go with a boatman.",
    "tips": [
      "Combine it with Wat Phou by boat in a single trip.",
      "Wear covered shoes; ground is uneven and there can be snakes.",
      "Dry-season access is easier; the path can flood in the rains.",
      "Bring water — there is little shade and no shop."
    ],
    "scamWarnings": [
      "Fix the return boat fare and wait time in advance so you are not stranded."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet"
    ],
    "mapQuery": "Oup Moung Tomo Temple Champasak",
    "coords": {
      "lat": 14.795,
      "lng": 105.856
    },
    "bookHint": "No booking; charter a boat from Champasak or the Wat Phou area.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet (Southern Laos)",
        "url": "https://www.lonelyplanet.com/laos/southern-laos"
      }
    ]
  },
  {
    "id": "la-ext-ban-kiet-ngong-wetland",
    "name": "Ban Kiet Ngong & Beung Kiat Ngong Wetland",
    "city": "Kiet Ngong",
    "country": "la",
    "recognition": "A stilted village beside Laos's largest Ramsar wetland, with dugout channels and reed beds at the edge of Xe Pian, buffalo in the marsh and the community's small elephant herd.",
    "categories": [
      "wetland",
      "nature",
      "wildlife",
      "village"
    ],
    "budgetTier": "low",
    "blurb": "The Ramsar-listed Beung Kiat Ngong wetland fronts a community-based-tourism village that is the gateway to Phou Asa and Xe Pian. Expect birdlife, buffalo and a few working village elephants. Kingfisher Ecolodge is here. It is a working landscape, not a manicured park.",
    "whyItFits": "For nature and slow travellers who want genuine community ecotourism and wildlife over more temples.",
    "priceRange": {
      "low": 20000,
      "typical": 100000,
      "high": 300000,
      "currency": "LAK",
      "note": "Community fees and guided wetland walks from ~20,000 LAK; longer treks and elephant programmes cost more."
    },
    "hours": "Village accessible year-round; the wetland is fullest during and after the rains (Jun-Oct); birdlife is best in the cooler months.",
    "tips": [
      "Base at or eat at Kingfisher Ecolodge and book guides through the village CBT office.",
      "Ethics note: elephant riding is increasingly discouraged — ask for walking-with or observation options.",
      "Bring mosquito repellent for the wetland.",
      "Confirm exactly what a trek or activity includes before you set off."
    ],
    "scamWarnings": [
      "Confirm what a trek or elephant activity includes, and its price, before paying."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet",
      "Travelfish"
    ],
    "mapQuery": "Ban Kiet Ngong wetland Champasak",
    "coords": {
      "lat": 14.6167,
      "lng": 106.2333
    },
    "bookHint": "Arrange on arrival via the village CBT office or Kingfisher Ecolodge.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Kingfisher Ecolodge",
        "url": "https://kingfisherecolodge.com/"
      },
      {
        "org": "Discover Laos Today",
        "url": "https://discoverlaos.today/post/xe-pian-national-protected-area-wetlands-and-elephants"
      }
    ]
  },
  {
    "id": "la-ext-xe-pian-npa",
    "name": "Xe Pian National Protected Area",
    "city": "Kiet Ngong",
    "country": "la",
    "recognition": "A vast lowland forest-and-wetland reserve southeast of Pakse, entered via Kiet Ngong or Ban Phapho, with guided walking trails, dry dipterocarp forest and dawn birdsong.",
    "categories": [
      "nature",
      "wildlife",
      "hike",
      "reserve"
    ],
    "budgetTier": "mid",
    "blurb": "One of Laos's most important protected areas, home to hornbills, gibbons and lowland forest, visited on guided day treks or overnights from Kiet Ngong. Be realistic: hunting pressure means large-mammal sightings are rare, and the appeal is the forest and birdlife, not a safari.",
    "whyItFits": "For adventurous nature travellers who want real NPA trekking rather than a manicured park.",
    "priceRange": {
      "low": 150000,
      "typical": 400000,
      "currency": "LAK",
      "note": "Guided treks typically ~150,000-500,000+ LAK depending on length and group size; a guide and permit are required."
    },
    "hours": "Guided trips depart in the morning; overnight camps available; dry season (Nov-Apr) is best for the trails.",
    "tips": [
      "Always go with an authorised local guide — for navigation, community benefit and UXO safety.",
      "Do not stray off marked paths; southern Laos has residual UXO.",
      "Manage expectations — large mammals are scarce due to poaching.",
      "The cooler dry months are the most comfortable for walking."
    ],
    "scamWarnings": [
      "Book through the village CBT or a reputable Pakse operator, not roadside touts."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Lonely Planet",
      "Tripadvisor",
      "Travelfish"
    ],
    "mapQuery": "Xe Pian National Protected Area Laos",
    "coords": {
      "lat": 14.4,
      "lng": 106.35
    },
    "bookHint": "Book via the Kiet Ngong CBT office, Kingfisher Ecolodge, or a licensed Pakse agency.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Discover Laos Today",
        "url": "https://discoverlaos.today/post/xe-pian-national-protected-area-wetlands-and-elephants"
      },
      {
        "org": "Lonely Planet (Southern Laos)",
        "url": "https://www.lonelyplanet.com/laos/southern-laos"
      }
    ]
  },
  {
    "id": "la-ext-dong-hua-sao-npa",
    "name": "Dong Hua Sao NPA (Tree Top Explorer)",
    "city": "Pakse",
    "country": "la",
    "recognition": "Waterfall-cut forest on the Bolaven Plateau's southwest escarpment, experienced on Green Discovery's multi-day circuit of canopy ziplines, a via ferrata by a falls, and forest treehouses.",
    "categories": [
      "nature",
      "adventure",
      "zipline",
      "reserve"
    ],
    "budgetTier": "high",
    "blurb": "A national protected area on the southwest edge of the Bolaven Plateau. The established way in is Green Discovery's 2-3 day Tree Top Explorer, combining ziplines, canopy walks, via ferrata and treehouse stays with village involvement. It is physically demanding and weather-dependent.",
    "whyItFits": "For adventure travellers wanting an immersive multi-day canopy experience with genuine conservation credentials.",
    "priceRange": {
      "low": 200,
      "typical": 250,
      "high": 320,
      "currency": "USD",
      "note": "Green Discovery quotes in USD; roughly USD 200-320 for the 2-3 day tour including guides, meals and gear."
    },
    "hours": "Scheduled multi-day departures from Pakse, subject to minimum numbers; run mainly in the drier months.",
    "tips": [
      "Book ahead through Green Discovery's Pakse office.",
      "You need reasonable fitness — long walks and exposure to heights.",
      "Departures can be cancelled if too few sign up or in heavy rain.",
      "Bring quick-dry clothing and sturdy footwear."
    ],
    "scamWarnings": [
      "Book directly with Green Discovery or a bonded agent to avoid overpriced resellers."
    ],
    "rating": 4.3,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet"
    ],
    "mapQuery": "Dong Hua Sao NPA Tree Top Explorer Laos",
    "coords": {
      "lat": 15.05,
      "lng": 106.15
    },
    "bookHint": "Reserve through Green Discovery's Pakse office in advance.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Southern Laos (official tourism)",
        "url": "https://www.southern-laos.com/travel-directory/tree-top-explorer/"
      },
      {
        "org": "Discover Laos Today",
        "url": "https://discoverlaos.today/paksong-bolaven-plateau/thing-to-do/tree-top-explorer"
      }
    ]
  },
  {
    "id": "la-ext-kayaking-si-phan-don",
    "name": "Kayaking Don Det & Don Khon",
    "city": "Don Det",
    "country": "la",
    "recognition": "Guided paddling trips launching from Don Det/Don Khon guesthouses, threading braided Mekong channels and islets, usually finishing near the Li Phi rapids and the border dolphin pool.",
    "categories": [
      "kayaking",
      "boat",
      "nature",
      "adventure"
    ],
    "budgetTier": "mid",
    "blurb": "A popular 4000 Islands activity: guided kayak day tours weave between islands, past rapids and bamboo fishing traps, often combined with a walk to Li Phi falls and a boat out to the border pool. Operator safety and skill vary, so choose carefully.",
    "whyItFits": "For active travellers who want to see Si Phan Don from the water rather than from a hammock.",
    "priceRange": {
      "low": 250000,
      "typical": 400000,
      "high": 500000,
      "currency": "LAK",
      "note": "Day tours roughly 250,000-500,000 LAK (about USD 12-25), usually including guide, kayak and lunch/transfers."
    },
    "hours": "Morning departures; a full day is ~6-8 hrs; high-water months (Aug-Oct) bring stronger currents.",
    "tips": [
      "Choose an operator who provides life jackets and a sober, attentive guide.",
      "The Mekong is powerful — avoid cheap trips near the falls in high water.",
      "Dry season is calmer and safer for paddling.",
      "Bring a dry bag, sun protection and water.",
      "The 'dolphin' leg is scenery only — resident Irrawaddy dolphins are effectively gone on the Lao side."
    ],
    "scamWarnings": [
      "Confirm the itinerary and whether the dolphin-pool boat and any entry fee are included before paying."
    ],
    "rating": 4.3,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet",
      "Google Maps consensus"
    ],
    "mapQuery": "kayaking Don Det Don Khon 4000 Islands",
    "coords": {
      "lat": 13.955,
      "lng": 105.941
    },
    "bookHint": "Book at guesthouses or tour desks on Don Det or Don Khon a day ahead.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet (Si Phan Don)",
        "url": "https://www.lonelyplanet.com/laos/southern-laos/si-phan-don"
      }
    ]
  },
  {
    "id": "la-ext-anlong-cheuteal-dolphin-pool",
    "name": "Anlong Cheuteal Dolphin Pool (Mekong Border)",
    "city": "Don Khon",
    "country": "la",
    "recognition": "A deep-water pool at the Lao-Cambodian border off Don Khon's southern tip, reached by boat from Ban Hang Khon — historically the northernmost home of the Mekong's Irrawaddy dolphins.",
    "categories": [
      "wildlife",
      "boat",
      "nature"
    ],
    "budgetTier": "low",
    "blurb": "Be honest with yourself before going: this trans-boundary pool was long the last place to glimpse Irrawaddy dolphins in Lao waters, but the resident dolphins are gone — the last one at Anlong Chheuteal died in 2022 and the species is effectively extinct on the Lao side. Boats still run at sunset, but sightings are now extremely unlikely; the remaining fewer-than-100 Mekong dolphins live downstream around Kratie in Cambodia. Go for the river scenery and the conservation story, not a guaranteed dolphin.",
    "whyItFits": "For travellers who want an honest, low-key border boat trip and to understand the dolphins' plight — not a wildlife guarantee.",
    "priceRange": {
      "low": 60000,
      "typical": 100000,
      "currency": "LAK",
      "note": "Shared boat ~60,000-100,000 LAK per person depending on group size; agree the price before boarding."
    },
    "hours": "Late-afternoon/sunset trips from Ban Hang Khon; the low-water dry season (Dec-May) was historically when dolphins were most visible.",
    "tips": [
      "Be realistic: Lao-side dolphins are effectively gone (the last died in 2022).",
      "To actually see Irrawaddy dolphins, visit Kampi near Kratie in Cambodia instead.",
      "Insist the boat keeps its distance and cuts the engine near any animal — engines and gill nets are what killed them.",
      "Bring binoculars and manage expectations."
    ],
    "scamWarnings": [
      "Some operators still market 'guaranteed dolphins' — this is misleading.",
      "Confirm the price per person, not a vague per-boat figure."
    ],
    "rating": 3.6,
    "reviewSources": [
      "Tripadvisor",
      "WWF",
      "IUCN Cetacean Specialist Group"
    ],
    "mapQuery": "Anlong Cheuteal dolphin pool Ban Hang Khon Don Khon",
    "coords": {
      "lat": 13.912,
      "lng": 105.972
    },
    "bookHint": "Arrange the boat at Ban Hang Khon on Don Khon; no advance booking needed.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "IUCN Cetacean Specialist Group",
        "url": "https://iucn-csg.org/mekong-dolphins/"
      },
      {
        "org": "Cambodianess (last Anlong Chheuteal dolphin)",
        "url": "https://cambodianess.com/article/last-irrawaddy-dolphin-in-anlong-chheuteal-section-of-mekong-river-dies"
      }
    ]
  },
  {
    "id": "la-ext-ban-saphai-don-kho",
    "name": "Ban Saphai & Don Kho Weaving Village",
    "city": "Pakse",
    "country": "la",
    "recognition": "A riverside weaving village about 15 km north of Pakse and its facing island Don Kho, where you hear looms clacking under stilt houses and can watch silk and cotton being handwoven.",
    "categories": [
      "culture",
      "village",
      "handicraft",
      "island"
    ],
    "budgetTier": "low",
    "blurb": "A cluster of Mekong villages known for traditional Lao silk and cotton weaving. A short boat hop reaches Don Kho island, with an old temple, homestays and weaving demonstrations. A calm half-day escape from Pakse.",
    "whyItFits": "For culture travellers and textile shoppers who want authentic handwoven cloth bought directly from the weavers.",
    "priceRange": {
      "low": 10000,
      "typical": 30000,
      "currency": "LAK",
      "note": "Boat to Don Kho ~10,000-30,000 LAK return; textiles are priced individually and buying supports the weavers."
    },
    "hours": "Daytime; weavers work mainly in the mornings; boats run in daylight hours.",
    "tips": [
      "Buy directly from weavers for fair prices and to support the community.",
      "Combine the visit with a Mekong sunset.",
      "Bring cash; card payment is not available.",
      "Dry season makes the boat crossing easier."
    ],
    "scamWarnings": [
      "Agree the return boat fare before crossing to Don Kho."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Tripadvisor",
      "Lonely Planet",
      "Travelfish"
    ],
    "mapQuery": "Ban Saphai Don Kho weaving village Pakse",
    "coords": {
      "lat": 15.22,
      "lng": 105.81
    },
    "bookHint": "No booking; hire a tuk-tuk from Pakse and a boat at the Ban Saphai pier.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet (Southern Laos)",
        "url": "https://www.lonelyplanet.com/laos/southern-laos"
      }
    ]
  },
  {
    "id": "la-ext-wat-phou-salao",
    "name": "Wat Phou Salao (Golden Buddha, Pakse)",
    "city": "Pakse",
    "country": "la",
    "recognition": "A large golden seated Buddha on a hill across the Mekong from Pakse, reached by a long stairway or a road, giving the best overview of the town and river — especially at sunset.",
    "categories": [
      "temple",
      "viewpoint",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "A hilltop temple with a big modern golden Buddha overlooking Pakse and the confluence of the Mekong and Xe Don. Free to visit and popular for sunset. Reach it by a stair climb or drive to the top.",
    "whyItFits": "For travellers wanting a free, easy sunset viewpoint and a living local temple close to Pakse.",
    "priceRange": {
      "currency": "LAK",
      "note": "Free to enter; donations welcome. Budget a small tuk-tuk fare from central Pakse."
    },
    "hours": "Daily, roughly dawn to dusk; go in the late afternoon for sunset.",
    "tips": [
      "Dress modestly (cover shoulders and knees) — it is an active temple.",
      "Come for sunset but arrange your tuk-tuk return in advance.",
      "Climb the stairway for the view, or take the road to the top.",
      "Bring water; the climb is hot in the afternoon."
    ],
    "scamWarnings": [
      "Agree the tuk-tuk round-trip fare, including waiting time, before setting off."
    ],
    "rating": 4.2,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "Wat Phou Salao Pakse golden Buddha",
    "coords": {
      "lat": 15.1,
      "lng": 105.79
    },
    "bookHint": "No booking; walk, cycle or take a tuk-tuk.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet (Pakse)",
        "url": "https://www.lonelyplanet.com/laos/southern-laos/pakse"
      }
    ]
  },
  {
    "id": "la-ext-don-som-island",
    "name": "Don Som Island",
    "city": "Nakasang",
    "country": "la",
    "recognition": "A large, largely un-touristed island in the 4000 Islands between Don Khong and Don Det, with dirt tracks through rice fields and stilt villages and only simple riverside bungalows.",
    "categories": [
      "island",
      "nature",
      "village",
      "cycling"
    ],
    "budgetTier": "low",
    "stayType": "guesthouse",
    "blurb": "A quieter alternative to Don Det and Don Khon, with basic homestays and bungalows, cycling on rough tracks, and farming-and-fishing daily life. Restaurants are few and electricity can be limited or solar-only in places — this is for travellers who genuinely want the quiet.",
    "whyItFits": "For independent travellers wanting Si Phan Don without the party scene or the crowds.",
    "priceRange": {
      "low": 50000,
      "typical": 100000,
      "high": 120000,
      "currency": "LAK",
      "note": "Simple bungalows ~50,000-120,000 LAK; boat transfer from Nakasang or neighbouring islands is extra."
    },
    "hours": "Boats run in daylight only; bring what you need, as shops are minimal.",
    "tips": [
      "Bring cash and a torch — power can be limited or solar.",
      "Stock up on snacks and water before crossing.",
      "Dry season is best for cycling the dirt tracks.",
      "Arrange your onward boat in advance, as services are infrequent."
    ],
    "scamWarnings": [
      "Confirm boat fares and pickup times, as ad-hoc transfers can be overpriced."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Tripadvisor",
      "Travelfish",
      "Google Maps consensus"
    ],
    "mapQuery": "Don Som Island Si Phan Don",
    "coords": {
      "lat": 14.05,
      "lng": 105.94
    },
    "bookHint": "Bungalows arranged on arrival; boats from Nakasang or nearby islands.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Travelfish (Si Phan Don)",
        "url": "https://www.travelfish.org/location/laos/southern_laos/si_phan_don"
      },
      {
        "org": "Lonely Planet (Si Phan Don)",
        "url": "https://www.lonelyplanet.com/laos/southern-laos/si-phan-don"
      }
    ]
  },
  {
    "id": "la-ext-wat-si-muang",
    "name": "Wat Si Muang",
    "city": "Vientiane",
    "country": "la",
    "recognition": "A busy, living temple at the east end of Setthathirath Road, marked by a gilded seated Buddha out front and a constant stream of locals bringing marigolds, incense and offerings to the city's guardian pillar inside.",
    "categories": [
      "temple",
      "culture",
      "spiritual"
    ],
    "budgetTier": "low",
    "blurb": "Vientiane's most actively worshipped temple, built around the lak muang (city pillar) that is believed to house the capital's guardian spirit. Unlike the museum-like Sisaket, this is a working temple where you will see genuine daily merit-making, blessings and offerings. Respectful visitors are welcome inside the ordination hall.",
    "whyItFits": "Gives travellers a real, living-faith counterpoint to the historic monuments nearby, and it sits within easy reach of Sisaket and Haw Pha Kaeo for a central-Vientiane temple loop.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 20000,
      "currency": "LAK",
      "note": "No entry fee; a small donation (5,000-20,000 LAK) is customary if you receive a blessing or buy an offering tray."
    },
    "hours": "Roughly 06:00-19:00 daily; mornings and early evening are the most active for worship",
    "tips": [
      "Cover shoulders and knees and remove shoes before entering the hall.",
      "This is an active place of worship, not a tourist site; keep voices low and ask before photographing people praying.",
      "Monks or lay attendants may tie a white blessing string on your wrist for a small donation."
    ],
    "scamWarnings": [
      "Agree the fare with any tuk-tuk before boarding; drivers waiting outside temples often quote inflated tourist prices."
    ],
    "rating": 4.3,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus",
      "Lonely Planet"
    ],
    "mapQuery": "Wat Si Muang Vientiane",
    "coords": {
      "lat": 17.9575,
      "lng": 102.6206
    },
    "bookHint": "No booking; simply walk in during opening hours.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g293950-Wat_Si_Muang-Vientiane_Vientiane_Prefecture.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/vientiane"
      }
    ]
  },
  {
    "id": "la-ext-haw-pha-kaeo",
    "name": "Haw Pha Kaeo (Ho Phra Keo)",
    "city": "Vientiane",
    "country": "la",
    "recognition": "A single ornate former royal temple raised on a terraced stone platform in a walled garden, its outer gallery lined with bronze Buddha images, standing directly across Setthathirath Road from Wat Sisaket.",
    "categories": [
      "temple",
      "museum",
      "culture"
    ],
    "budgetTier": "low",
    "blurb": "Originally built in the 16th century to house the Emerald Buddha (now in Bangkok), Haw Pha Kaeo was destroyed and rebuilt and today serves as a museum of Lao religious art. The exterior gallery of bronze Buddhas and the calm garden are the highlight; interior displays are modest. It pairs naturally with a visit to Wat Sisaket opposite.",
    "whyItFits": "Adds historical and art-lover depth to central Vientiane without duplicating Sisaket, and the shaded garden is a genuine respite from the midday heat.",
    "priceRange": {
      "low": 30000,
      "typical": 30000,
      "high": 30000,
      "currency": "LAK",
      "note": "Around 30,000 LAK entry; cash only, small notes preferred."
    },
    "hours": "Roughly 08:00-12:00 and 13:00-16:00; closed over the lunch break and on some public holidays",
    "tips": [
      "Photography inside the hall is often restricted; ask or check signage first.",
      "Combine with Wat Sisaket across the road on a single morning walk.",
      "Interior labelling is limited; a guidebook or guide adds a lot of context."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "Haw Pha Kaeo Vientiane",
    "coords": {
      "lat": 17.9626,
      "lng": 102.6108
    },
    "bookHint": "No booking; pay at the gate.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g293950-Haw_Pha_Kaew-Vientiane_Vientiane_Prefecture.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/vientiane"
      }
    ]
  },
  {
    "id": "la-ext-lao-national-museum",
    "name": "Lao National Museum",
    "city": "Vientiane",
    "country": "la",
    "recognition": "A state history museum whose galleries move from prehistoric and Khmer-era artefacts through French colonial rule to the revolutionary period, heavy on photographs, dioramas and captioned displays.",
    "categories": [
      "museum",
      "culture",
      "history"
    ],
    "budgetTier": "low",
    "blurb": "The national collection covers Lao history from ancient times through the colonial era and the revolutionary struggle. Displays are earnest and text-led rather than slick, but it is one of the few places in Vientiane to get a chronological overview of the country. Note that the collection has been relocating from its long-running Samsenthai Road building to a large new national museum complex, so confirm the current site locally before setting out.",
    "whyItFits": "Fills the history-context gap for travellers who want more than temples, and works well on a hot afternoon.",
    "priceRange": {
      "low": 30000,
      "typical": 30000,
      "high": 30000,
      "currency": "LAK",
      "note": "Around 30,000 LAK; cash only."
    },
    "hours": "Typically 08:00-12:00 and 13:00-16:00, but hours are irregular during the relocation; confirm on the day",
    "tips": [
      "Confirm the current building and opening hours at your guesthouse before travelling; the museum has been moving premises.",
      "English labelling is patchy and the tone is state-narrative; treat it as one perspective.",
      "Allow about an hour; it is compact."
    ],
    "reviewSources": [
      "Google Maps consensus",
      "Tripadvisor"
    ],
    "mapQuery": "Lao National Museum Vientiane",
    "coords": {
      "lat": 17.9662,
      "lng": 102.6069
    },
    "bookHint": "No booking; pay at the entrance.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g293950-Lao_National_Museum-Vientiane_Vientiane_Prefecture.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/vientiane"
      }
    ]
  },
  {
    "id": "la-ext-wat-ong-teu",
    "name": "Wat Ong Teu Mahawihan",
    "city": "Vientiane",
    "country": "la",
    "recognition": "A large working monastery on Setthathirath Road, named for the heavy bronze 'weighty Buddha' inside its hall, and home to one of the country's main Buddhist teaching centres with young monks often studying in the grounds.",
    "categories": [
      "temple",
      "culture",
      "spiritual"
    ],
    "budgetTier": "low",
    "blurb": "One of Vientiane's most important monasteries and a seat of Buddhist learning, centred on a large 16th-century bronze Buddha. It is a genuinely active study temple, so you will often see novices and monks around the grounds. Quieter and less touristed than Sisaket, it rewards a respectful wander.",
    "whyItFits": "Rounds out a central temple walk with a living monastic community rather than a museum piece, and it is free.",
    "priceRange": {
      "low": 0,
      "typical": 0,
      "high": 10000,
      "currency": "LAK",
      "note": "Free; a small donation is welcome."
    },
    "hours": "Roughly 06:00-18:00 daily",
    "tips": [
      "Dress modestly and remove shoes before entering the hall.",
      "It sits beside Wat Inpeng, so you can see both in one short stop.",
      "Do not disturb monks who are studying or chanting."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Google Maps consensus",
      "Tripadvisor"
    ],
    "mapQuery": "Wat Ong Teu Mahawihan Vientiane",
    "coords": {
      "lat": 17.9648,
      "lng": 102.6088
    },
    "bookHint": "No booking; walk in during daylight hours.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g293950-Wat_Ong_Teu-Vientiane_Vientiane_Prefecture.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/vientiane"
      }
    ]
  },
  {
    "id": "la-ext-nam-phu-guesthouses",
    "name": "Mid-range guesthouses around Nam Phu (Fountain Square), Vientiane",
    "city": "Vientiane",
    "country": "la",
    "recognition": "A cluster of small hotels and guesthouses on the lanes radiating from the round fountain plaza of Nam Phu, ringed by cafes and restaurants a couple of blocks back from the Mekong.",
    "categories": [
      "stay",
      "guesthouse"
    ],
    "budgetTier": "mid",
    "stayType": "guesthouse",
    "blurb": "The Nam Phu (Fountain Square) area is central Vientiane's most convenient mid-range base: a walkable knot of guesthouses and small hotels surrounded by restaurants, cafes and bars, a short stroll from the river, the night market and the main temples. Rooms here are generally clean air-conditioned doubles rather than backpacker dorms.",
    "whyItFits": "Gives a stable, walkable mid-range lodging cluster in the capital as an area recommendation rather than a single fragile business, filling a stay gap for Vientiane.",
    "priceRange": {
      "low": 250000,
      "typical": 450000,
      "high": 900000,
      "currency": "LAK",
      "note": "Roughly USD 20-45 (approx 250,000-900,000 LAK) for a mid-range double; book direct for better rates."
    },
    "hours": "Reception hours vary by property; most offer 24h or late check-in on request",
    "tips": [
      "Being central, this area can get street noise at night; ask for a room away from bars.",
      "Walkable to the riverside night market, Nam Phu restaurants and the central temples.",
      "Confirm whether breakfast and airport transfer are included when you book."
    ],
    "scamWarnings": [
      "Book direct or via a reputable platform; ignore touts at the bus station steering you to a specific place for a commission."
    ],
    "reviewSources": [
      "Booking.com",
      "Google Maps consensus",
      "Tripadvisor"
    ],
    "mapQuery": "Nam Phu Fountain Square Vientiane",
    "coords": {
      "lat": 17.9642,
      "lng": 102.61
    },
    "bookHint": "Book individual guesthouses via Booking.com/Agoda or by contacting them directly.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/vientiane"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Hotels-g293950-Vientiane_Vientiane_Prefecture-Hotels.html"
      }
    ]
  },
  {
    "id": "la-ext-wat-mai-suwannaphumaham",
    "name": "Wat Mai Suwannaphumaham",
    "city": "Luang Prabang",
    "country": "la",
    "recognition": "A five-tiered red-and-gold roofed temple on Sisavangvong Road right beside the Royal Palace Museum, its front veranda covered in gilded relief panels depicting the Ramayana and village life.",
    "categories": [
      "temple",
      "culture",
      "spiritual"
    ],
    "budgetTier": "low",
    "blurb": "One of Luang Prabang's largest and most richly decorated temples, distinguished by its sweeping multi-tiered roof and the ornate gilt-relief facade of its sim. Historically the residence of the head of Lao Buddhism, it sits immediately next to the Royal Palace, making it an easy add-on. During Pi Mai (Lao New Year) the Prabang Buddha is displayed here.",
    "whyItFits": "A standout peninsula temple not yet in the app, right on the main street and pairable with the Royal Palace and Mount Phousi.",
    "priceRange": {
      "low": 20000,
      "typical": 20000,
      "high": 30000,
      "currency": "LAK",
      "note": "Around 20,000-30,000 LAK entry; cash only."
    },
    "hours": "Roughly 08:00-17:00 daily",
    "tips": [
      "The gilded front veranda is best photographed in soft morning or late-afternoon light.",
      "Cover shoulders and knees; a scarf or sarong helps.",
      "Combine with the Royal Palace Museum next door and the night market that sets up on this street at dusk."
    ],
    "rating": 4.3,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus",
      "Lonely Planet"
    ],
    "mapQuery": "Wat Mai Suwannaphumaham Luang Prabang",
    "coords": {
      "lat": 19.8895,
      "lng": 102.1355
    },
    "bookHint": "No booking; pay at the entrance.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g295415-Wat_Mai-Luang_Prabang_Luang_Prabang_Province.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/luang-prabang"
      }
    ]
  },
  {
    "id": "la-ext-wat-wisunarat",
    "name": "Wat Wisunarat (Wat Visoun) & That Makmo",
    "city": "Luang Prabang",
    "country": "la",
    "recognition": "The oldest operating temple in Luang Prabang, recognisable by the rounded, melon-shaped 'watermelon stupa' (That Makmo) standing in front of a broad hall on the southeast side of the peninsula.",
    "categories": [
      "temple",
      "culture",
      "history"
    ],
    "budgetTier": "low",
    "blurb": "Founded in the early 16th century, Wat Wisunarat is Luang Prabang's oldest temple still in use. Its signature is That Makmo, the distinctive hemispherical 'watermelon stupa', alongside a hall that once displayed a collection of Buddha images and ordination markers. It is quieter than the peninsula-tip temples and rounds out the town's heritage circuit.",
    "whyItFits": "Adds a genuinely historic, less-crowded temple to Luang Prabang and an unusual stupa form travellers will not see elsewhere in town.",
    "priceRange": {
      "low": 20000,
      "typical": 20000,
      "high": 20000,
      "currency": "LAK",
      "note": "Around 20,000 LAK entry; cash only."
    },
    "hours": "Roughly 08:00-17:00 daily",
    "tips": [
      "It sits at the base of Mount Phousi's south side, so it is easy to combine with a Phousi climb.",
      "Modest dress and shoes-off inside the hall as at every temple here.",
      "Early morning is quietest and coolest."
    ],
    "rating": 4.1,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus",
      "Lonely Planet"
    ],
    "mapQuery": "Wat Wisunarat That Makmo Luang Prabang",
    "coords": {
      "lat": 19.8863,
      "lng": 102.1399
    },
    "bookHint": "No booking; pay at the gate.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g295415-Wat_Wisunarat-Luang_Prabang_Luang_Prabang_Province.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/luang-prabang"
      }
    ]
  },
  {
    "id": "la-ext-ock-pop-tok",
    "name": "Ock Pop Tok Living Crafts Centre",
    "city": "Luang Prabang",
    "country": "la",
    "recognition": "A riverside weaving and natural-dye workshop set in leafy gardens on the Mekong south of the centre, where you can watch artisans at floor looms and dye vats and see finished silk in the shop and cafe.",
    "categories": [
      "culture",
      "workshop",
      "shopping"
    ],
    "budgetTier": "low",
    "blurb": "A well-run social enterprise dedicated to Lao textiles, natural dyeing and traditional weaving. Visiting the garden centre, watching the weavers and browsing the fair-trade shop is free, and a free tuk-tuk shuttles from town; hands-on half- and full-day classes (weaving, natural dye, batik) are the paid draw. Nearby Ban Xang Khong village is a traditional weaving and saa (mulberry) paper-making hamlet worth pairing on the same trip.",
    "whyItFits": "A meaningful, ethical craft experience beyond temples and waterfalls, suited to travellers who want to make something and support local artisans.",
    "priceRange": {
      "low": 0,
      "typical": 55,
      "high": 130,
      "currency": "USD",
      "note": "Visiting the centre is free (free tuk-tuk from town); half-day classes from roughly USD 39, full-day from around USD 65-130. Operator quotes USD."
    },
    "hours": "Centre roughly 08:00-18:00 daily; classes run on set morning/afternoon schedules — book ahead",
    "tips": [
      "Book classes a day or more in advance, especially in peak season (Nov-Feb).",
      "Use the free tuk-tuk shuttle from the Ock Pop Tok office in town rather than paying a private driver.",
      "The riverside cafe is a pleasant lunch stop even if you only visit; pair with Ban Xang Khong village nearby."
    ],
    "scamWarnings": [
      "Book through the official Ock Pop Tok office or website; some drivers push unaffiliated 'weaving village' stops for commission."
    ],
    "rating": 4.6,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus",
      "Lonely Planet"
    ],
    "mapQuery": "Ock Pop Tok Living Crafts Centre Luang Prabang",
    "coords": {
      "lat": 19.8735,
      "lng": 102.1262
    },
    "bookHint": "Book classes via ockpoptok.com or at their in-town office; catch the free shuttle from there.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Ock Pop Tok",
        "url": "https://www.ockpoptok.com"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g295415-Ock_Pop_Tok-Luang_Prabang_Luang_Prabang_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-living-land-farm",
    "name": "Living Land Farm",
    "city": "Luang Prabang",
    "country": "la",
    "recognition": "A community organic rice farm in the paddies a few kilometres outside town, where guests wade into flooded fields with a water buffalo named Rambo and work through the traditional stages of rice growing.",
    "categories": [
      "culture",
      "workshop",
      "nature",
      "food"
    ],
    "budgetTier": "mid",
    "blurb": "A hands-on community farm where the signature 'Rice Experience' walks you through the traditional steps of Lao rice cultivation — ploughing with the buffalo, planting, threshing, milling and tasting — in a genuinely fun, muddy, educational half-day. It is consistently one of Luang Prabang's top-rated experiences and supports local farming families and scholarships.",
    "whyItFits": "A standout active, family-friendly and ethical experience that gets travellers out of town and into rural Lao life; a strong non-temple option.",
    "priceRange": {
      "low": 25,
      "typical": 66,
      "high": 66,
      "currency": "USD",
      "note": "The full Rice Experience is around USD 66; shorter/child rates are lower. Operator quotes USD; includes hotel pickup on some bookings."
    },
    "hours": "Morning and afternoon sessions daily; the full rice experience runs about 3-4 hours — book ahead",
    "tips": [
      "Book in advance; sessions are capped and sell out in high season.",
      "Wear clothes and sandals you do not mind getting muddy; you will be in the paddy.",
      "Confirm whether hotel pickup is included or you need your own tuk-tuk to the farm."
    ],
    "scamWarnings": [
      "Book through the official Living Land operator; unrelated 'rice farm tours' of variable quality are sold around town."
    ],
    "rating": 4.8,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "Living Land Farm Luang Prabang",
    "coords": {
      "lat": 19.8848,
      "lng": 102.1048
    },
    "bookHint": "Book via livinglandlao.org or a reputable Luang Prabang tour desk.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Living Land",
        "url": "https://www.livinglandlao.org"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g295415-Living_Land_Company-Luang_Prabang_Luang_Prabang_Province.html"
      }
    ]
  },
  {
    "id": "la-ext-sakkaline-guesthouses",
    "name": "Heritage guesthouses along Sakkaline & Sisavangvong Road, Luang Prabang",
    "city": "Luang Prabang",
    "country": "la",
    "recognition": "Restored teak-and-shophouse guesthouses lining the main peninsula street between the Royal Palace and Wat Xieng Thong, most with wooden shutters, small verandas and courtyard gardens inside the UNESCO-protected old town.",
    "categories": [
      "stay",
      "guesthouse"
    ],
    "budgetTier": "mid",
    "stayType": "guesthouse",
    "blurb": "The peninsula's main axis (Sisavangvong becoming Sakkaline as it runs northeast toward Wat Xieng Thong) is lined with converted heritage houses offering mid-range rooms inside the UNESCO World Heritage zone. Staying here puts the night market, temples, cafes and the Mekong all within a short walk, in atmospheric restored buildings rather than modern blocks.",
    "whyItFits": "Provides a stable mid-range heritage stay cluster in the old town as an area recommendation, distinct from hostels and riverside resorts, filling a Luang Prabang lodging gap.",
    "priceRange": {
      "low": 300000,
      "typical": 650000,
      "high": 1500000,
      "currency": "LAK",
      "note": "Roughly USD 25-75 (approx 300,000-1,500,000 LAK) for a mid-range heritage double; rates rise sharply in peak season (Nov-Feb) and over Pi Mai."
    },
    "hours": "Reception hours vary by property; many are small and appreciate advance notice of late arrival",
    "tips": [
      "Rooms facing the street can catch night-market and early alms-round noise; ask for a quieter rear or courtyard room.",
      "Book well ahead for December-February and Lao New Year (mid-April); the peninsula fills up.",
      "Everything is walkable, but note the peninsula has a nightly quiet curfew, so plan late arrivals."
    ],
    "scamWarnings": [
      "Reserve directly or via a reputable platform; ignore tuk-tuk touts at the bus station or airport steering you to a specific guesthouse for commission."
    ],
    "reviewSources": [
      "Booking.com",
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "Sakkaline Road guesthouses Luang Prabang",
    "coords": {
      "lat": 19.8925,
      "lng": 102.1408
    },
    "bookHint": "Book individual heritage guesthouses via Booking.com/Agoda or contact them directly.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/luang-prabang"
      },
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Hotels-g295415-Luang_Prabang_Luang_Prabang_Province-Hotels.html"
      }
    ]
  },
  {
    "id": "la-ext-tham-nam-water-cave",
    "name": "Tham Nam (Water Cave)",
    "city": "Vang Vieng",
    "country": "la",
    "recognition": "A low, water-filled cave mouth in the karst west of the Nam Song, entered by floating in on an inner tube and pulling yourself along a fixed rope with a headlamp, usually as part of the local 'cave tubing' loop.",
    "categories": [
      "cave",
      "adventure",
      "nature"
    ],
    "budgetTier": "low",
    "blurb": "One of Vang Vieng's classic outdoor experiences: you lie on an inner tube and haul yourself into a flooded cave along a rope, headlamp on, through cool underground passages. It is often sold combined with kayaking, ziplining or the Blue Lagoon, but can be done as a standalone with the local guides at the entrance. Physical, a little cramped, and great fun in the right conditions.",
    "whyItFits": "A distinctive adventure not in the app, giving active travellers an underground counterpart to the town's viewpoints and lagoons.",
    "priceRange": {
      "low": 50000,
      "typical": 80000,
      "high": 150000,
      "currency": "LAK",
      "note": "Roughly 50,000-150,000 LAK for entry plus tube/headlamp hire; often bundled into combo tours."
    },
    "hours": "Daylight hours only, roughly 09:00-16:30; access depends on water levels",
    "tips": [
      "Water is cold and the passage narrow; not ideal if you are claustrophobic or a weak swimmer, though life jackets are provided.",
      "In peak wet season (Aug-Sep) high water can make the cave unsafe or closed, and in the dry months levels drop — ask locally about conditions.",
      "Leave valuables at your guesthouse or in a dry bag; phones get wet."
    ],
    "scamWarnings": [
      "Agree the total price (entry + tube + headlamp) with the guides at the mouth before starting, and confirm what any 'combo' ticket actually includes."
    ],
    "rating": 4.0,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus",
      "Lonely Planet"
    ],
    "mapQuery": "Tham Nam Water Cave Vang Vieng",
    "coords": {
      "lat": 18.9218,
      "lng": 102.4135
    },
    "bookHint": "Book via a Vang Vieng tour agency for a combo, or pay the guides at the cave entrance.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g303901-Water_Cave-Vang_Vieng_Vientiane_Province.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/vang-vieng"
      }
    ]
  },
  {
    "id": "la-ext-kaeng-nyui-waterfall",
    "name": "Kaeng Nyui Waterfall",
    "city": "Vang Vieng",
    "country": "la",
    "recognition": "A modest multi-tier jungle waterfall reached by a short forest walk a few kilometres east of town, past a small ticket booth and picnic shelters, with a shallow plunge pool at the base.",
    "categories": [
      "waterfall",
      "nature",
      "hike"
    ],
    "budgetTier": "low",
    "blurb": "A low-key alternative to the busy lagoons: a small waterfall east of Vang Vieng set in forest, reached via a short, easy walk from the car park. It is more about the leafy setting and a cooling dip than a dramatic cascade, and it is far quieter than the Blue Lagoons. Best after rain, when the flow is strongest.",
    "whyItFits": "A quiet, cheap nature stop for travellers wanting greenery away from the tubing and lagoon crowds, and it is close enough for a half-day.",
    "priceRange": {
      "low": 10000,
      "typical": 15000,
      "high": 20000,
      "currency": "LAK",
      "note": "Around 10,000-20,000 LAK entry, plus a small parking fee; cash only."
    },
    "hours": "Daylight hours, roughly 08:00-17:00",
    "tips": [
      "Flow is strong in and just after the rainy season (Aug-Nov) and can be a trickle in the dry months (Feb-Apr) — set expectations accordingly.",
      "The access road is rough dirt; a scooter or hired tuk-tuk is easiest and can get slippery when wet.",
      "Wear grippy shoes for the short forest path and bring water; there are few facilities."
    ],
    "scamWarnings": [
      "Fix the tuk-tuk fare to the trailhead and back before setting off, as it is not walkable from town."
    ],
    "rating": 3.9,
    "reviewSources": [
      "Tripadvisor",
      "Google Maps consensus"
    ],
    "mapQuery": "Kaeng Nyui Waterfall Vang Vieng",
    "coords": {
      "lat": 18.9305,
      "lng": 102.498
    },
    "bookHint": "No booking; pay at the booth on arrival.",
    "verified": "2026-06",
    "sources": [
      {
        "org": "Tripadvisor",
        "url": "https://www.tripadvisor.com/Attraction_Review-g303901-Kaeng_Nyui_Waterfall-Vang_Vieng_Vientiane_Province.html"
      },
      {
        "org": "Lonely Planet",
        "url": "https://www.lonelyplanet.com/laos/vang-vieng"
      }
    ]
  },

  {
    id: "la-ext-luang-prabang-night-market-food", name: "Luang Prabang night market food alley", city: "Luang Prabang", country: "la",
    categories: ["food", "market"], budgetTier: "low",
    isLocal: true, kidFriendly: true,
    blurb: "Every evening a lane off the handicraft night market on Sisavangvong Road (running down toward the Mekong) fills with charcoal grills and food stalls. Look for ping kai (marinated grilled chicken), ping pa (grilled river fish) and Lao sausage eaten with sticky rice and jeow chilli dips, plus Luang Prabang khao soi (rice noodles under a savoury pork-and-tomato sauce), kanom krok coconut pancakes and French-influenced baguette sandwiches.",
    whyItFits: "It is the easiest, cheapest way to eat properly Lao food in Luang Prabang, and the famous pile-your-plate vegetarian buffet stalls make it a rare street-food spot where vegans and vegetarians eat well for a few dollars.",
    priceRange: { low: 15000, typical: 40000, high: 80000, currency: "LAK", note: "Guidance per person: the vegetarian buffet plate runs about 15,000-25,000 LAK, a grilled-meat-and-sticky-rice plate 30,000-60,000 LAK. Kip prices move with inflation, so confirm locally." },
    hours: "Daily roughly 17:30-22:30; grills are busiest and freshest from about 18:30",
    tips: ["The vegetarian buffet is one fixed price for a heaped plate, but it is not reheated to order, so go when a stall looks freshly stocked", "Ping kai and Lao sausage are cooked to order, so expect a short wait at the grill", "Carry small kip notes; most stalls cannot change large bills", "Eat where the queue is Lao, not only tourists, for the better grills"],
    scamWarnings: ["Agree the price before a grilled item is weighed or bagged, as a few stalls quote higher to obvious tourists", "Fruit-shake stalls occasionally use sweetened syrup and ice of unknown source; ask for no syrup and bottled-water ice if you are cautious"],
    rating: 4.4, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Luang Prabang night market food alley", coords: { lat: 19.889, lng: 102.135 },
    bookHint: "No booking; walk in and order at the grill", verified: "2026-07",
    sources: [{ org: "Tourism Luang Prabang (official)", url: "https://tourismluangprabang.org/things-to-do/arts-and-shopping/night-market/" }, { org: "Tripadvisor", url: "https://www.tripadvisor.com/Attraction_Review-g295415-d1727836-Reviews-Luang_Prabang_Night_Market-Luang_Prabang_Luang_Prabang_Province.html" }],
  },
  {
    id: "la-ext-phonsavan-fresh-market-food", name: "Phonsavan fresh market and night-market eats", city: "Phonsavan", country: "la",
    categories: ["food", "market"], budgetTier: "low",
    isLocal: true, kidFriendly: true,
    blurb: "Phonsavan, the base for the Plain of Jars, eats at two markets. The Phoukam Garden fresh market (best in the morning) is ringed by sit-down diners ladling noodle soups (feu and khao poon) and barbecue stalls, alongside cooked curries, salads and spring rolls. After dark a small night market sells grilled meats, sticky rice and fruit shakes. Local specialities lean to laap (minced-meat salad) and hearty Xieng Khuang noodle soups.",
    whyItFits: "Xieng Khuang is a highland province with its own cool-climate produce, so eating at the town markets is both the cheapest option and the most genuinely local meal between Plain of Jars sites.",
    priceRange: { low: 15000, typical: 35000, high: 70000, currency: "LAK", note: "Guidance per person: a bowl of noodle soup about 25,000-40,000 LAK, a barbecue-and-sticky-rice plate 35,000-60,000 LAK. Confirm locally; kip prices shift with inflation." },
    hours: "Fresh market daily about 06:00-18:00 (best before 09:00); night market from roughly 17:30",
    tips: ["Come to the fresh market early; the soup and barbecue stalls around its edge are at their best in the morning", "This is highland Laos, so evenings are cold in the cool season; a hot noodle soup is the local move", "Some regional delicacies at the market are very unusual (fermented and foraged items); point at cooked, recognisable dishes if you prefer to play it safe"],
    scamWarnings: ["Prices at the markets are generally honest; simply confirm the note denominations when paying, as kip bills carry many zeroes"],
    rating: 4.1, reviewSources: ["Travelfish", "Google Maps consensus"],
    mapQuery: "Phoukam Garden market Phonsavan", coords: { lat: 19.457, lng: 103.218 },
    bookHint: "No booking; arrive and order at the stalls", verified: "2026-07",
    sources: [{ org: "Travelfish", url: "https://www.travelfish.org/eatandmeet/laos/northern_laos/xieng_khuang/phonsavan/eat" }, { org: "Lonely Planet", url: "https://www.lonelyplanet.com/laos/northern-laos/phonsavan/attractions/fresh-food-market/a/poi-sig/480140/356935" }],
  },
  {
    id: "la-ext-luang-namtha-night-market-food", name: "Luang Namtha night market food stalls", city: "Luang Namtha", country: "la",
    categories: ["food", "market"], budgetTier: "low",
    isLocal: true, kidFriendly: true,
    blurb: "The night market in the centre of Luang Namtha has two halves: a front row of grilled chicken, papaya salad and fruit smoothies aimed at visitors, and a back section of Lao small plates, sausages and soups where locals eat. Try northern khao soi (rice noodles in a rich, slightly tart pork-and-tomato sauce), sindad cook-your-own barbecue hotpot, grilled pork and chicken with sticky rice, and forest-gathered ingredients you will not see further south.",
    whyItFits: "Luang Namtha is the launch point for Nam Ha trekking, and the night market is where trekkers refuel cheaply on genuinely northern Lao food; the back stalls in particular are as local as it gets in town.",
    priceRange: { low: 15000, typical: 40000, high: 80000, currency: "LAK", note: "Guidance per person: a bowl or small plate about 25,000-45,000 LAK, a shared sindad barbecue 60,000-100,000 LAK for two. Kip prices move with inflation; confirm locally." },
    hours: "Daily roughly 17:00-22:00",
    tips: ["Walk past the first tourist-facing row to the back stalls for the more authentic Lao small plates and soups", "Sindad barbecue is designed to share; order one grill between two or more people", "Some stalls sell adventurous items (insects, foraged forest food); nothing obliges you to try them, so order what appeals"],
    scamWarnings: ["Prices are usually fair; confirm the total before handing over a large kip note, as change can be slow"],
    rating: 4.0, reviewSources: ["Tripadvisor", "Google Maps consensus"],
    mapQuery: "Luang Namtha night market", coords: { lat: 20.948, lng: 101.404 },
    bookHint: "No booking; walk in and order at the stalls", verified: "2026-07",
    sources: [{ org: "Tripadvisor", url: "https://www.tripadvisor.com/Restaurant_Review-g424933-d2031506-Reviews-Night_Market-Luang_Namtha_Luang_Namtha_Province.html" }, { org: "Ethnic Travel Laos", url: "https://ethnictravellaos.com/luangnamtha-where-to-eat/" }],
  },
  {
    id: "la-ext-rental-vientiane", name: "Scooter & bicycle rental, Vientiane", city: "Vientiane", country: "la",
    categories: ["rental", "transport"], budgetTier: "low",
    blurb: "The laid-back capital is flat and easy for a hired bicycle or small scooter along the Mekong riverfront and out to the Buddha Park.",
    whyItFits: "For covering Vientiane's spread-out riverside sights without relying on tuk-tuks.",
    priceRange: { low: 60000, typical: 110000, high: 200000, currency: "LAK", note: "Per day for a scooter; bicycles cheaper." },
    tips: ["Wear the helmet - it is the law across the region and it saves lives; insist on one that fits and fasten it.", "Photograph the bike from every side before you ride off and point out existing scratches to the shop, so you are not billed for old damage.", "Check the brakes, tyres, lights and horn before leaving, and refuse any bike that feels wrong.", "Do not leave your passport as a deposit - offer a cash deposit or a photocopy instead; passport-for-deposit disputes are a common, costly scam.", "Carry the licence your travel insurance requires - most policies pay out only if you hold the correct category, often an International Driving Permit; ride within your experience."],
    coords: { lat: 17.966, lng: 102.611 }, mapQuery: "scooter rental Vientiane",
    verified: "2026-07",
    sources: [{ org: "Tourism Laos", url: "https://www.tourismlaos.org/" }, { org: "Travelfish", url: "https://www.travelfish.org/" }],
  },
  {
    id: "la-ext-rental-vang-vieng", name: "Scooter & buggy rental, Vang Vieng", city: "Vang Vieng", country: "la",
    categories: ["rental", "transport"], budgetTier: "low",
    blurb: "Scooters, bicycles and side-by-side buggies are hired all over the centre for the lagoons, caves and viewpoints ringing the karst valley.",
    whyItFits: "For reaching the blue lagoons and caves scattered around the countryside.",
    priceRange: { low: 60000, typical: 120000, high: 250000, currency: "LAK", note: "Per day; scooters from ~60,000 LAK, side-by-side buggies much more." },
    tips: ["The buggies are fun but the dirt tracks get treacherous in the rains - go slowly and never ride the river roads after dark.", "Wear the helmet - it is the law across the region and it saves lives; insist on one that fits and fasten it.", "Photograph the bike from every side before you ride off and point out existing scratches to the shop, so you are not billed for old damage.", "Check the brakes, tyres, lights and horn before leaving, and refuse any bike that feels wrong.", "Do not leave your passport as a deposit - offer a cash deposit or a photocopy instead; passport-for-deposit disputes are a common, costly scam.", "Carry the licence your travel insurance requires - most policies pay out only if you hold the correct category, often an International Driving Permit; ride within your experience."],
    coords: { lat: 18.9237, lng: 102.447 }, mapQuery: "scooter rental Vang Vieng",
    verified: "2026-07",
    sources: [{ org: "Tourism Laos", url: "https://www.tourismlaos.org/" }, { org: "Travelfish", url: "https://www.travelfish.org/" }],
  },
  {
    id: "la-ext-rental-pakse", name: "Motorbike rental, Pakse (Bolaven loop)", city: "Pakse", country: "la",
    categories: ["rental", "transport"], budgetTier: "low",
    blurb: "The gateway to the Bolaven Plateau loop, where shops hire semi-automatic and manual motorbikes robust enough for the waterfalls, coffee farms and cool highland roads.",
    whyItFits: "For riding the multi-day Bolaven loop, one of Laos's best road trips.",
    priceRange: { low: 90000, typical: 150000, high: 250000, currency: "LAK", note: "Per day for a semi-automatic; loop-ready bikes a little more." },
    tips: ["Hire a bike with good tyres and brakes, budget two to three days, and carry cash - ATMs are scarce on the plateau.", "Wear the helmet - it is the law across the region and it saves lives; insist on one that fits and fasten it.", "Photograph the bike from every side before you ride off and point out existing scratches to the shop, so you are not billed for old damage.", "Check the brakes, tyres, lights and horn before leaving, and refuse any bike that feels wrong.", "Do not leave your passport as a deposit - offer a cash deposit or a photocopy instead; passport-for-deposit disputes are a common, costly scam.", "Carry the licence your travel insurance requires - most policies pay out only if you hold the correct category, often an International Driving Permit; ride within your experience."],
    coords: { lat: 15.1202, lng: 105.782 }, mapQuery: "scooter rental Pakse",
    verified: "2026-07",
    sources: [{ org: "Tourism Laos", url: "https://www.tourismlaos.org/" }, { org: "Travelfish", url: "https://www.travelfish.org/" }],
  },
];
