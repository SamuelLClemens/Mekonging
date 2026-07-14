// Transport hubs across Thailand, Vietnam, Cambodia and Laos — airports, main train
// stations, major intercity bus terminals and passenger ferry piers. Each hub is used
// two ways: (1) the per-place "Getting here & away" card finds the nearest hub of each
// type by great-circle distance from a place's coordinates, and (2) the map link resolves
// the hub by NAME so the door-to-door directions stay accurate even where the coordinate
// below is only an approximate city marker.
//
// `type`: airport | train | bus | ferry. `code` is the IATA code for airports.
// `into` is a short "into town" note (mainly for airports and gateway hubs).
// Figures and services change with season, operator and policy — treat as guidance and
// confirm on the day. Border CROSSINGS live in borders.js and are surfaced alongside these.
export const TRANSPORT_HUBS = [
  // ============================ THAILAND — AIRPORTS ============================
  { id: 'h-th-bkk', cc: 'th', city: 'Bangkok', type: 'airport', code: 'BKK', name: 'Suvarnabhumi Airport', coords: { lat: 13.690, lng: 100.750 },
    into: 'Airport Rail Link to Phaya Thai (~30 min, ~45 THB) links to the BTS/MRT; or take a metered taxi from the public rank on Level 1 (meter + 50 THB airport fee + tolls). Ignore drivers touting a flat fare inside the terminal.' },
  { id: 'h-th-dmk', cc: 'th', city: 'Bangkok', type: 'airport', code: 'DMK', name: 'Don Mueang Airport', coords: { lat: 13.912, lng: 100.607 },
    into: 'SRT Red Line train or A1/A2 bus to Mo Chit (BTS/MRT); or a metered taxi from the rank. Allow extra time for the cross-city transfer if connecting with BKK.' },
  { id: 'h-th-cnx', cc: 'th', city: 'Chiang Mai', type: 'airport', code: 'CNX', name: 'Chiang Mai Airport', coords: { lat: 18.767, lng: 98.963 },
    into: '~10–15 min to the Old City by airport taxi or Grab (~150–200 THB).' },
  { id: 'h-th-hkt', cc: 'th', city: 'Phuket', type: 'airport', code: 'HKT', name: 'Phuket Airport', coords: { lat: 8.113, lng: 98.317 },
    into: 'Airport bus, shared minibus or metered taxi/Grab; 45–90 min to the main beaches. Agree the fare or use the meter.' },
  { id: 'h-th-kbv', cc: 'th', city: 'Krabi', type: 'airport', code: 'KBV', name: 'Krabi Airport', coords: { lat: 8.099, lng: 98.986 },
    into: 'Shared van or airport bus to Krabi Town and Ao Nang; ~30–45 min.' },
  { id: 'h-th-usm', cc: 'th', city: 'Koh Samui', type: 'airport', code: 'USM', name: 'Samui Airport', coords: { lat: 9.548, lng: 100.062 },
    into: 'The airport is on the island; short taxi/minibus to the beaches.' },
  { id: 'h-th-cei', cc: 'th', city: 'Chiang Rai', type: 'airport', code: 'CEI', name: 'Chiang Rai Airport', coords: { lat: 19.952, lng: 99.883 },
    into: 'Airport taxi or Grab; ~15 min to the centre.' },
  { id: 'h-th-hdy', cc: 'th', city: 'Hat Yai', type: 'airport', code: 'HDY', name: 'Hat Yai Airport', coords: { lat: 6.933, lng: 100.393 },
    into: 'Shared van to the town centre; gateway to the far south and the Malaysia border.' },
  { id: 'h-th-urt', cc: 'th', city: 'Surat Thani', type: 'airport', code: 'URT', name: 'Surat Thani Airport', coords: { lat: 9.133, lng: 99.136 },
    into: 'Bus/van transfers connect with the Donsak ferry piers for Koh Samui, Koh Phangan and Koh Tao.' },
  { id: 'h-th-uth', cc: 'th', city: 'Udon Thani', type: 'airport', code: 'UTH', name: 'Udon Thani Airport', coords: { lat: 17.386, lng: 102.788 },
    into: 'Main air gateway to the northeast; buses/vans run on to Nong Khai and the Friendship Bridge for Vientiane (Laos).' },
  { id: 'h-th-ubp', cc: 'th', city: 'Ubon Ratchathani', type: 'airport', code: 'UBP', name: 'Ubon Ratchathani Airport', coords: { lat: 15.251, lng: 104.870 },
    into: 'Gateway to the lower northeast and the Chong Mek crossing for Pakse (Laos).' },
  { id: 'h-th-kkc', cc: 'th', city: 'Khon Kaen', type: 'airport', code: 'KKC', name: 'Khon Kaen Airport', coords: { lat: 16.466, lng: 102.783 },
    into: 'Central Isaan hub; airport taxi/Grab into town.' },

  // ============================ THAILAND — TRAINS ============================
  { id: 't-th-krungthep', cc: 'th', city: 'Bangkok', type: 'train', name: 'Krung Thep Aphiwat Central Terminal (Bang Sue)', coords: { lat: 13.803, lng: 100.539 },
    note: 'Bangkok’s main long-distance terminal since 2023 — northern, northeastern, southern and eastern lines all start here. On the MRT Blue Line (Bang Sue) and SRT Red Line.' },
  { id: 't-th-hualamphong', cc: 'th', city: 'Bangkok', type: 'train', name: 'Hua Lamphong Station', coords: { lat: 13.737, lng: 100.517 }, secondary: true,
    note: 'Now handles mainly commuter and some ordinary services; MRT Hua Lamphong. Most long-distance trains have moved to Krung Thep Aphiwat.' },
  { id: 't-th-cnx', cc: 'th', city: 'Chiang Mai', type: 'train', name: 'Chiang Mai Railway Station', coords: { lat: 18.786, lng: 99.016 },
    note: 'Northern-line terminus; overnight sleepers to/from Bangkok.' },
  { id: 't-th-ayutthaya', cc: 'th', city: 'Ayutthaya', type: 'train', name: 'Ayutthaya Railway Station', coords: { lat: 14.360, lng: 100.586 },
    note: 'Frequent trains from Bangkok; a short ferry hop to the historic island.' },
  { id: 't-th-korat', cc: 'th', city: 'Nakhon Ratchasima', type: 'train', name: 'Nakhon Ratchasima (Korat) Station', coords: { lat: 14.980, lng: 102.098 },
    note: 'Northeastern-line hub toward Nong Khai and Ubon Ratchathani.' },
  { id: 't-th-phunphin', cc: 'th', city: 'Surat Thani', type: 'train', name: 'Surat Thani (Phunphin) Station', coords: { lat: 9.121, lng: 99.213 },
    note: 'Southern-line stop ~13 km west of town; bus/van links to the Samui/Phangan/Tao ferries.' },
  { id: 't-th-hatyai', cc: 'th', city: 'Hat Yai', type: 'train', name: 'Hat Yai Junction', coords: { lat: 7.007, lng: 100.470 },
    note: 'Southern rail junction; connections toward the Malaysia border (Padang Besar).' },
  { id: 't-th-nongkhai', cc: 'th', city: 'Nong Khai', type: 'train', name: 'Nong Khai Railway Station', coords: { lat: 17.881, lng: 102.744 },
    note: 'End of the northeastern line; a shuttle train crosses the Friendship Bridge to Thanaleng (Vientiane, Laos).' },

  // ============================ THAILAND — BUS ============================
  { id: 'b-th-mochit', cc: 'th', city: 'Bangkok', type: 'bus', name: 'Mo Chit Northern Bus Terminal (Chatuchak)', coords: { lat: 13.813, lng: 100.549 },
    note: 'Buses to the north and northeast (Chiang Mai, Isaan). Near BTS Mo Chit / MRT Chatuchak.' },
  { id: 'b-th-ekkamai', cc: 'th', city: 'Bangkok', type: 'bus', name: 'Ekkamai Eastern Bus Terminal', coords: { lat: 13.719, lng: 100.585 },
    note: 'Buses to the eastern seaboard (Pattaya, Rayong, Trat/Koh Chang). On BTS Ekkamai.' },
  { id: 'b-th-saitai', cc: 'th', city: 'Bangkok', type: 'bus', name: 'Sai Tai Mai Southern Bus Terminal', coords: { lat: 13.777, lng: 100.410 },
    note: 'Buses to the south and west (Hua Hin, Surat Thani, Phuket, Krabi, Kanchanaburi).' },
  { id: 'b-th-cnx', cc: 'th', city: 'Chiang Mai', type: 'bus', name: 'Arcade Bus Terminal (Chiang Mai)', coords: { lat: 18.799, lng: 99.019 },
    note: 'Chiang Mai’s main intercity terminal for Bangkok, Pai, Chiang Rai and the north.' },
  { id: 'b-th-phuket', cc: 'th', city: 'Phuket', type: 'bus', name: 'Phuket Bus Terminal 2', coords: { lat: 7.925, lng: 98.395 },
    note: 'Long-distance buses to Bangkok, Krabi, Surat Thani and the south.' },

  // ============================ THAILAND — FERRY ============================
  { id: 'f-th-donsak', cc: 'th', city: 'Surat Thani', type: 'ferry', name: 'Donsak Ferry Piers', coords: { lat: 9.316, lng: 99.690 },
    note: 'Car and passenger ferries (Raja, Seatran, Lomprayah) to Koh Samui and Koh Phangan.' },
  { id: 'f-th-chumphon', cc: 'th', city: 'Chumphon', type: 'ferry', name: 'Chumphon Piers (for Koh Tao)', coords: { lat: 10.499, lng: 99.222 },
    note: 'Lomprayah/Songserm catamarans to Koh Tao, Koh Phangan and Koh Samui.' },
  { id: 'f-th-rassada', cc: 'th', city: 'Phuket', type: 'ferry', name: 'Rassada Pier (Phuket)', coords: { lat: 7.850, lng: 98.410 },
    note: 'Boats to Phi Phi, Krabi, Koh Lanta and the Andaman islands.' },
  { id: 'f-th-krabi', cc: 'th', city: 'Krabi', type: 'ferry', name: 'Klong Jilad Pier (Krabi)', coords: { lat: 8.062, lng: 98.905 },
    note: 'Ferries to Phi Phi, Koh Lanta and longtails to Railay.' },
  { id: 'f-th-kohchang', cc: 'th', city: 'Trat', type: 'ferry', name: 'Koh Chang Ferry (Ao Thammachat / Center Point)', coords: { lat: 12.150, lng: 102.390 },
    note: 'Vehicle ferries from the Trat mainland to Koh Chang.' },

  // ============================ VIETNAM — AIRPORTS ============================
  { id: 'h-vi-han', cc: 'vi', city: 'Hanoi', type: 'airport', code: 'HAN', name: 'Noi Bai International Airport', coords: { lat: 21.221, lng: 105.807 },
    into: 'Airport bus 86 to the Old Quarter/Hanoi station (~45 min), or a metered/Grab car. Use the official taxi rank; agree app fares in advance.' },
  { id: 'h-vi-sgn', cc: 'vi', city: 'Ho Chi Minh City', type: 'airport', code: 'SGN', name: 'Tan Son Nhat International Airport', coords: { lat: 10.819, lng: 106.652 },
    into: 'Bus 109/152 or Grab/Vinasun taxi; ~20–40 min to District 1 depending on traffic. Only ~7 km from the centre.' },
  { id: 'h-vi-dad', cc: 'vi', city: 'Da Nang', type: 'airport', code: 'DAD', name: 'Da Nang International Airport', coords: { lat: 16.044, lng: 108.199 },
    into: 'Almost in the city — ~10 min to the river or My Khe beach by Grab/taxi. Hoi An is ~45 min south.' },
  { id: 'h-vi-cxr', cc: 'vi', city: 'Nha Trang', type: 'airport', code: 'CXR', name: 'Cam Ranh International Airport', coords: { lat: 11.998, lng: 109.219 },
    into: '~35–45 km south of Nha Trang; airport shuttle bus or Grab (~45 min).' },
  { id: 'h-vi-hph', cc: 'vi', city: 'Hai Phong', type: 'airport', code: 'HPH', name: 'Cat Bi International Airport', coords: { lat: 20.819, lng: 106.725 },
    into: 'Gateway to Hai Phong and Cat Ba Island; taxi/Grab into town.' },
  { id: 'h-vi-hui', cc: 'vi', city: 'Hue', type: 'airport', code: 'HUI', name: 'Phu Bai International Airport', coords: { lat: 16.401, lng: 107.703 },
    into: '~15 km south of Hue; airport shuttle or taxi.' },
  { id: 'h-vi-vdh', cc: 'vi', city: 'Dong Hoi', type: 'airport', code: 'VDH', name: 'Dong Hoi Airport', coords: { lat: 17.515, lng: 106.590 },
    into: 'Nearest airport for Phong Nha-Ke Bang caves; van/taxi ~45 min to Phong Nha.' },
  { id: 'h-vi-dli', cc: 'vi', city: 'Da Lat', type: 'airport', code: 'DLI', name: 'Lien Khuong Airport', coords: { lat: 11.750, lng: 108.367 },
    into: '~30 km south of Da Lat; airport shuttle bus or taxi.' },
  { id: 'h-vi-pqc', cc: 'vi', city: 'Phu Quoc', type: 'airport', code: 'PQC', name: 'Phu Quoc International Airport', coords: { lat: 10.170, lng: 103.991 },
    into: 'On the island; taxi/Grab to Duong Dong and the beaches.' },
  { id: 'h-vi-vca', cc: 'vi', city: 'Can Tho', type: 'airport', code: 'VCA', name: 'Can Tho International Airport', coords: { lat: 10.085, lng: 105.712 },
    into: 'Main Mekong Delta gateway; taxi/Grab into Can Tho.' },
  { id: 'h-vi-vii', cc: 'vi', city: 'Vinh', type: 'airport', code: 'VII', name: 'Vinh International Airport', coords: { lat: 18.737, lng: 105.671 },
    into: 'North-central gateway; taxi into town.' },

  // ============================ VIETNAM — TRAINS (Reunification line) ============================
  { id: 't-vi-hanoi', cc: 'vi', city: 'Hanoi', type: 'train', name: 'Hanoi Railway Station (Ga Ha Noi)', coords: { lat: 21.024, lng: 105.841 },
    note: 'Northern terminus of the Reunification Express to Saigon, and lines toward Lao Cai (Sapa) and Hai Phong.' },
  { id: 't-vi-saigon', cc: 'vi', city: 'Ho Chi Minh City', type: 'train', name: 'Saigon Railway Station (Ga Sai Gon)', coords: { lat: 10.782, lng: 106.677 },
    note: 'Southern terminus of the Reunification Express; in District 3.' },
  { id: 't-vi-danang', cc: 'vi', city: 'Da Nang', type: 'train', name: 'Da Nang Railway Station', coords: { lat: 16.071, lng: 108.209 },
    note: 'The Hai Van Pass leg to/from Hue is one of the most scenic rail rides in Asia.' },
  { id: 't-vi-hue', cc: 'vi', city: 'Hue', type: 'train', name: 'Hue Railway Station', coords: { lat: 16.459, lng: 107.582 },
    note: 'On the Reunification line; scenic coastal run south to Da Nang.' },
  { id: 't-vi-nhatrang', cc: 'vi', city: 'Nha Trang', type: 'train', name: 'Nha Trang Railway Station', coords: { lat: 12.246, lng: 109.183 },
    note: 'Central-coast stop on the Reunification Express.' },
  { id: 't-vi-ninhbinh', cc: 'vi', city: 'Ninh Binh', type: 'train', name: 'Ninh Binh Railway Station', coords: { lat: 20.253, lng: 105.975 },
    note: 'Short hop south of Hanoi; gateway to Tam Coc and Trang An.' },

  // ============================ VIETNAM — BUS ============================
  { id: 'b-vi-mydinh', cc: 'vi', city: 'Hanoi', type: 'bus', name: 'My Dinh Bus Station (Hanoi)', coords: { lat: 21.028, lng: 105.778 },
    note: 'Buses to the north and northwest (Sapa, Ha Giang, Cao Bang).' },
  { id: 'b-vi-giapbat', cc: 'vi', city: 'Hanoi', type: 'bus', name: 'Giap Bat Bus Station (Hanoi)', coords: { lat: 20.978, lng: 105.841 },
    note: 'Buses heading south (Ninh Binh, Thanh Hoa and beyond).' },
  { id: 'b-vi-mien-dong', cc: 'vi', city: 'Ho Chi Minh City', type: 'bus', name: 'Mien Dong Bus Station (Eastern)', coords: { lat: 10.815, lng: 106.711 },
    note: 'Buses east and north (Da Lat, Nha Trang, central and northern Vietnam). A newer terminal (Mien Dong Moi) has opened further out in Thu Duc — check which your operator uses.' },
  { id: 'b-vi-mien-tay', cc: 'vi', city: 'Ho Chi Minh City', type: 'bus', name: 'Mien Tay Bus Station (Western)', coords: { lat: 10.740, lng: 106.618 },
    note: 'Buses to the Mekong Delta (Can Tho, Chau Doc, Ca Mau).' },
  { id: 'b-vi-danang', cc: 'vi', city: 'Da Nang', type: 'bus', name: 'Da Nang Central Bus Station', coords: { lat: 16.062, lng: 108.171 },
    note: 'Intercity buses; frequent shuttle vans run to Hoi An and Hue.' },

  // ============================ VIETNAM — FERRY ============================
  { id: 'f-vi-catba', cc: 'vi', city: 'Hai Phong', type: 'ferry', name: 'Got Pier / Cat Ba Ferries', coords: { lat: 20.760, lng: 106.870 },
    note: 'Ferries and speedboats from the Hai Phong area to Cat Ba Island (Lan Ha / Ha Long Bay).' },
  { id: 'f-vi-rachgia', cc: 'vi', city: 'Rach Gia', type: 'ferry', name: 'Rach Gia Ferry Port (for Phu Quoc)', coords: { lat: 10.010, lng: 105.080 },
    note: 'Superdong fast ferries to Phu Quoc; also served from Ha Tien.' },
  { id: 'f-vi-hatien', cc: 'vi', city: 'Ha Tien', type: 'ferry', name: 'Ha Tien Ferry Port (for Phu Quoc)', coords: { lat: 10.383, lng: 104.487 },
    note: 'Shortest ferry crossing to Phu Quoc; near the Cambodia (Prek Chak) border.' },
  { id: 'f-vi-hoian', cc: 'vi', city: 'Hoi An', type: 'ferry', name: 'Cua Dai / Cham Island Boats', coords: { lat: 15.880, lng: 108.380 },
    note: 'Speedboats and wooden boats to the Cham Islands (weather permitting).' },

  // ============================ CAMBODIA — AIRPORTS ============================
  { id: 'h-kh-pnh', cc: 'kh', city: 'Phnom Penh', type: 'airport', code: 'PNH', name: 'Phnom Penh International Airport', coords: { lat: 11.546, lng: 104.844 },
    into: '~30–45 min to the riverside; airport shuttle bus, Grab/PassApp or a fixed-fare taxi. A new Techo airport further south is being phased in — check your ticket.' },
  { id: 'h-kh-sai', cc: 'kh', city: 'Siem Reap', type: 'airport', code: 'SAI', name: 'Siem Reap–Angkor International Airport', coords: { lat: 13.500, lng: 104.400 },
    into: 'The new airport (opened 2023) is ~40–50 km east of town — allow 45–60 min by fixed-fare airport taxi/van or hotel pickup. The old in-town airport (REP) is closed.' },
  { id: 'h-kh-kos', cc: 'kh', city: 'Sihanoukville', type: 'airport', code: 'KOS', name: 'Sihanoukville International Airport', coords: { lat: 10.579, lng: 103.637 },
    into: 'Gateway to the southern coast and islands; taxi/tuk-tuk into town and to the ferry piers.' },

  // ============================ CAMBODIA — TRAINS ============================
  { id: 't-kh-pnh', cc: 'kh', city: 'Phnom Penh', type: 'train', name: 'Phnom Penh Royal Railway Station', coords: { lat: 11.573, lng: 104.918 },
    note: 'Royal Railway runs limited services to Sihanoukville (via Takeo/Kampot) and toward Poipet — schedules are sparse, so confirm before relying on it.' },
  { id: 't-kh-shv', cc: 'kh', city: 'Sihanoukville', type: 'train', name: 'Sihanoukville Railway Station', coords: { lat: 10.632, lng: 103.522 },
    note: 'Southern terminus of the Phnom Penh line; a scenic but slow ride.' },

  // ============================ CAMBODIA — BUS ============================
  { id: 'b-kh-pnh', cc: 'kh', city: 'Phnom Penh', type: 'bus', name: 'Phnom Penh Bus Operators (Central)', coords: { lat: 11.568, lng: 104.918 },
    note: 'Phnom Penh has no single station — Giant Ibis, Mekong Express, Virak Buntham and others depart from their own offices near the riverside/central market. Book with a reputable operator.' },
  { id: 'b-kh-siemreap', cc: 'kh', city: 'Siem Reap', type: 'bus', name: 'Siem Reap Bus Operators', coords: { lat: 13.362, lng: 103.860 },
    note: 'Buses to Phnom Penh, Battambang and the Thai border (Poipet). Operators run from their own offices; Giant Ibis and Mekong Express are reliable.' },

  // ============================ CAMBODIA — FERRY ============================
  { id: 'f-kh-shv', cc: 'kh', city: 'Sihanoukville', type: 'ferry', name: 'Sihanoukville Ferry Piers', coords: { lat: 10.615, lng: 103.522 },
    note: 'Speedboats to Koh Rong and Koh Rong Sanloem (Buva Sea, Speed Ferry Cambodia and others).' },

  // ============================ LAOS — AIRPORTS ============================
  { id: 'h-la-vte', cc: 'la', city: 'Vientiane', type: 'airport', code: 'VTE', name: 'Wattay International Airport', coords: { lat: 17.988, lng: 102.563 },
    into: '~4 km / 15 min to the centre; airport taxi (fixed fare) or Grab/Loca ride-hail.' },
  { id: 'h-la-lpq', cc: 'la', city: 'Luang Prabang', type: 'airport', code: 'LPQ', name: 'Luang Prabang International Airport', coords: { lat: 19.897, lng: 102.161 },
    into: '~4 km / 10 min to the peninsula; airport minivan or taxi.' },
  { id: 'h-la-pkz', cc: 'la', city: 'Pakse', type: 'airport', code: 'PKZ', name: 'Pakse International Airport', coords: { lat: 15.132, lng: 105.781 },
    into: 'Gateway to southern Laos and the Bolaven Plateau; taxi/tuk-tuk into town.' },
  { id: 'h-la-lxg', cc: 'la', city: 'Luang Namtha', type: 'airport', code: 'LXG', name: 'Luang Namtha Airport', coords: { lat: 20.967, lng: 101.400 },
    into: 'Small airport serving the far north and the Nam Ha protected area.' },
  { id: 'h-la-zvk', cc: 'la', city: 'Savannakhet', type: 'airport', code: 'ZVK', name: 'Savannakhet Airport', coords: { lat: 16.556, lng: 104.760 },
    into: 'Central Laos, near the Friendship Bridge II to Mukdahan (Thailand).' },

  // ============================ LAOS — TRAINS (Laos–China Railway) ============================
  { id: 't-la-vientiane', cc: 'la', city: 'Vientiane', type: 'train', name: 'Vientiane (Khamsavath) Station', coords: { lat: 18.010, lng: 102.720 },
    note: 'Laos–China Railway high-speed hub ~10 km northeast of the centre. Book ahead — seats sell out. (A separate Thanaleng station handles the short shuttle to Nong Khai, Thailand.)' },
  { id: 't-la-vangvieng', cc: 'la', city: 'Vang Vieng', type: 'train', name: 'Vang Vieng Station', coords: { lat: 18.878, lng: 102.470 },
    note: 'Laos–China Railway; ~5 km from town. Vientiane–Vang Vieng takes about 1 hour.' },
  { id: 't-la-luangprabang', cc: 'la', city: 'Luang Prabang', type: 'train', name: 'Luang Prabang Station', coords: { lat: 19.958, lng: 102.199 },
    note: 'Laos–China Railway; ~10 km from the peninsula. Vientiane–Luang Prabang is ~2 hours by fast train.' },
  { id: 't-la-oudomxay', cc: 'la', city: 'Oudomxay', type: 'train', name: 'Muang Xay (Oudomxay) Station', coords: { lat: 20.667, lng: 101.983 },
    note: 'Northern junction on the Laos–China Railway.' },
  { id: 't-la-nateuy', cc: 'la', city: 'Luang Namtha', type: 'train', name: 'Nateuy Station (for Luang Namtha)', coords: { lat: 20.917, lng: 101.500 },
    note: 'Railway stop serving Luang Namtha; onward transport into town by van.' },
  { id: 't-la-boten', cc: 'la', city: 'Boten', type: 'train', name: 'Boten Station (China border)', coords: { lat: 21.180, lng: 101.690 },
    note: 'Northern terminus at the China border; connects to the Chinese railway network at Mohan.' },

  // ============================ LAOS — BUS ============================
  { id: 'b-la-vte-southern', cc: 'la', city: 'Vientiane', type: 'bus', name: 'Vientiane Southern Bus Station', coords: { lat: 17.947, lng: 102.678 },
    note: 'Buses south to Pakse, Savannakhet and Thakhek, and international coaches to Vietnam.' },
  { id: 'b-la-vte-northern', cc: 'la', city: 'Vientiane', type: 'bus', name: 'Vientiane Northern Bus Station', coords: { lat: 18.010, lng: 102.660 },
    note: 'Buses north to Luang Prabang, Vang Vieng and beyond.' },
  { id: 'b-la-lpq', cc: 'la', city: 'Luang Prabang', type: 'bus', name: 'Luang Prabang Bus Terminals', coords: { lat: 19.900, lng: 102.170 },
    note: 'Northern and southern terminals serve different directions; minivans are common for the winding mountain roads.' },
  { id: 'b-la-pakse', cc: 'la', city: 'Pakse', type: 'bus', name: 'Pakse Bus Terminals', coords: { lat: 15.120, lng: 105.800 },
    note: 'Buses and songthaews to the Bolaven Plateau, Si Phan Don (4000 Islands) and the Thai/Cambodia borders.' },

  // ============================ LAOS — FERRY / MEKONG BOATS ============================
  { id: 'f-la-houayxay', cc: 'la', city: 'Houayxay', type: 'ferry', name: 'Houayxay Slow-Boat Pier', coords: { lat: 20.279, lng: 100.437 },
    note: 'Start of the two-day Mekong slow boat to Luang Prabang via Pakbeng. Buy tickets at the pier, not from touts.' },
  { id: 'f-la-luangprabang', cc: 'la', city: 'Luang Prabang', type: 'ferry', name: 'Luang Prabang Boat Landing', coords: { lat: 19.894, lng: 102.135 },
    note: 'Arrival/departure for the Mekong slow boats and short cruises to the Pak Ou caves.' },
  { id: 'f-la-nakasang', cc: 'la', city: 'Si Phan Don', type: 'ferry', name: 'Nakasang Pier (for 4000 Islands)', coords: { lat: 14.030, lng: 105.860 },
    note: 'Longtail boats to Don Det and Don Khon in the Si Phan Don archipelago.' },

  // ============ TOWN-LEVEL TERMINALS & STATIONS ============
  // Added so a place in a smaller destination finds its own town's bus terminal or station
  // rather than the next city's. Coordinates are approximate town markers; the map link
  // resolves each by name.
  // --- Thailand ---
  { id: 'b-th-krabi', cc: 'th', city: 'Krabi', type: 'bus', name: 'Krabi Bus Terminal (Talat Kao)', coords: { lat: 8.090, lng: 98.912 },
    note: 'Buses to Bangkok, Phuket, Surat Thani and the south; songthaews to Ao Nang and the piers.' },
  { id: 'b-th-chiangrai', cc: 'th', city: 'Chiang Rai', type: 'bus', name: 'Chiang Rai Bus Terminal 2', coords: { lat: 19.909, lng: 99.831 },
    note: 'Buses to Chiang Mai, the Golden Triangle and the Chiang Khong border for Laos.' },
  { id: 'b-th-pai', cc: 'th', city: 'Pai', type: 'bus', name: 'Pai Bus Station', coords: { lat: 19.359, lng: 98.439 },
    note: 'Minivans over the 762 curves to Chiang Mai and on to Mae Hong Son.' },
  { id: 'b-th-ayutthaya', cc: 'th', city: 'Ayutthaya', type: 'bus', name: 'Ayutthaya Bus Terminal', coords: { lat: 14.353, lng: 100.567 },
    note: 'Buses and minivans to Bangkok (Mo Chit) and the north.' },
  { id: 'b-th-kanchanaburi', cc: 'th', city: 'Kanchanaburi', type: 'bus', name: 'Kanchanaburi Bus Terminal', coords: { lat: 14.020, lng: 99.531 },
    note: 'Buses to Bangkok; minivans to Erawan Falls and Hellfire Pass.' },
  { id: 'b-th-huahin', cc: 'th', city: 'Hua Hin', type: 'bus', name: 'Hua Hin Bus Terminal', coords: { lat: 12.568, lng: 99.958 },
    note: 'Buses to Bangkok and south down the peninsula.' },
  { id: 'b-th-sukhothai', cc: 'th', city: 'Sukhothai', type: 'bus', name: 'Sukhothai Bus Terminal', coords: { lat: 17.008, lng: 99.822 },
    note: 'Buses to Bangkok, Chiang Mai and Phitsanulok; songthaew to the Old City.' },
  { id: 'b-th-trat', cc: 'th', city: 'Trat', type: 'bus', name: 'Trat Bus Terminal', coords: { lat: 12.243, lng: 102.514 },
    note: 'Buses from Bangkok; minivans on to the Koh Chang ferry piers.' },
  { id: 't-th-kanchanaburi', cc: 'th', city: 'Kanchanaburi', type: 'train', name: 'Kanchanaburi Railway Station', coords: { lat: 14.020, lng: 99.530 },
    note: 'On the historic Death Railway to the River Kwai bridge and Nam Tok.' },
  { id: 't-th-huahin', cc: 'th', city: 'Hua Hin', type: 'train', name: 'Hua Hin Railway Station', coords: { lat: 12.568, lng: 99.959 },
    note: 'One of Thailand’s prettiest heritage stations, on the southern line.' },
  // --- Vietnam ---
  { id: 'b-vi-hue', cc: 'vi', city: 'Hue', type: 'bus', name: 'Hue Southern Bus Station', coords: { lat: 16.447, lng: 107.599 },
    note: 'Intercity buses; open-tour buses and shuttle vans to Hoi An and Da Nang.' },
  { id: 'b-vi-nhatrang', cc: 'vi', city: 'Nha Trang', type: 'bus', name: 'Nha Trang (Phia Nam) Bus Station', coords: { lat: 12.235, lng: 109.176 },
    note: 'Buses along the coast and up to Da Lat and the highlands.' },
  { id: 'b-vi-dalat', cc: 'vi', city: 'Da Lat', type: 'bus', name: 'Da Lat Bus Station', coords: { lat: 11.926, lng: 108.443 },
    note: 'Buses to Nha Trang, Ho Chi Minh City and Mui Ne.' },
  { id: 'b-vi-cantho', cc: 'vi', city: 'Can Tho', type: 'bus', name: 'Can Tho Bus Station', coords: { lat: 10.036, lng: 105.770 },
    note: 'Buses across the Mekong Delta and to HCMC (Mien Tay).' },
  { id: 'b-vi-chaudoc', cc: 'vi', city: 'Chau Doc', type: 'bus', name: 'Chau Doc Bus Station', coords: { lat: 10.702, lng: 105.118 },
    note: 'Buses to HCMC and Can Tho; boats and buses to Phnom Penh via the river border.' },
  { id: 'b-vi-ninhbinh', cc: 'vi', city: 'Ninh Binh', type: 'bus', name: 'Ninh Binh Bus Station', coords: { lat: 20.253, lng: 105.974 },
    note: 'Buses to Hanoi and the north-central coast; beside the railway station.' },
  { id: 'b-vi-donghoi', cc: 'vi', city: 'Dong Hoi', type: 'bus', name: 'Dong Hoi Bus Station', coords: { lat: 17.478, lng: 106.599 },
    note: 'Buses along Highway 1; shuttles to the Phong Nha caves.' },
  { id: 't-vi-laocai', cc: 'vi', city: 'Lao Cai', type: 'train', name: 'Lao Cai Railway Station (for Sapa)', coords: { lat: 22.485, lng: 103.972 },
    note: 'Overnight trains from Hanoi; buses climb ~1 hour to Sapa.' },
  { id: 't-vi-donghoi', cc: 'vi', city: 'Dong Hoi', type: 'train', name: 'Dong Hoi Railway Station', coords: { lat: 17.480, lng: 106.601 },
    note: 'Reunification-line stop and the rail gateway to Phong Nha.' },
  // --- Cambodia ---
  { id: 'b-kh-battambang', cc: 'kh', city: 'Battambang', type: 'bus', name: 'Battambang Bus Operators', coords: { lat: 13.095, lng: 103.203 },
    note: 'Giant Ibis / Mekong Express to Phnom Penh and Siem Reap; a scenic wet-season boat also runs to Siem Reap.' },
  { id: 'b-kh-kampot', cc: 'kh', city: 'Kampot', type: 'bus', name: 'Kampot Bus / Van Stop', coords: { lat: 10.610, lng: 104.181 },
    note: 'Buses and vans to Phnom Penh, Sihanoukville and Kep.' },
  { id: 'b-kh-sihanoukville', cc: 'kh', city: 'Sihanoukville', type: 'bus', name: 'Sihanoukville Bus Operators', coords: { lat: 10.627, lng: 103.512 },
    note: 'Buses to Phnom Penh and Kampot; near the islands ferry piers.' },
  // --- Laos ---
  { id: 'b-la-vangvieng', cc: 'la', city: 'Vang Vieng', type: 'bus', name: 'Vang Vieng Bus Terminal', coords: { lat: 18.923, lng: 102.448 },
    note: 'Minivans and buses to Vientiane and Luang Prabang; the railway is faster.' },
  { id: 'b-la-thakhek', cc: 'la', city: 'Thakhek', type: 'bus', name: 'Thakhek Bus Station', coords: { lat: 17.411, lng: 104.812 },
    note: 'Buses to Vientiane, Savannakhet and Pakse; start of the Thakhek Loop.' },
];

// Sources behind the transport-hub guidance. As with the rest of the app, these are a
// starting point — operators, times and prices change, so confirm before you travel.
export const TRANSIT_SOURCES = [
  { org: 'The Man in Seat 61 (rail)', url: 'https://www.seat61.com' },
  { org: 'State Railway of Thailand', url: 'https://www.railway.co.th' },
  { org: 'Vietnam Railways', url: 'https://dsvn.vn' },
  { org: 'Laos–China Railway (LCR)', url: 'https://www.laostraintickets.com' },
  { org: '12Go Asia', url: 'https://12go.asia' },
  { org: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
];

// ============================================================================
// GETTING AROUND — rent & ride, buy tickets, and where to find live schedules.
// ----------------------------------------------------------------------------
// This is deliberately LINK-FIRST for anything that changes: we never bundle fabricated
// timetables or prices. Instead each country carries (1) stable, verified guidance
// (which side of the road, licence/helmet law, common scams) and (2) outbound links to
// the authoritative booking and schedule sources, which are always current. Everything
// opens in the browser; the guidance text itself works offline. Confirm on the day —
// operators, routes and fares move constantly. Sources: official operator/rail sites,
// The Man in Seat 61, 12Go Asia, and each country's civil-aviation carriers (2026-07).
export const GET_AROUND = {
  th: {
    name: 'Thailand', drivesOn: 'left',
    rentalPrices: {
      note: 'Approximate daily rates, mid-2026 — islands, airports and peak season run higher. Weekly and monthly hire is much cheaper per day. Always confirm before renting.',
      rows: [
        { city: 'Bangkok', scooter: '250–350 THB', car: '1,200–1,800 THB' },
        { city: 'Chiang Mai', scooter: '150–250 THB', car: '900–1,400 THB' },
        { city: 'Phuket', scooter: '200–300 THB', car: '1,000–1,600 THB' },
        { city: 'Koh Samui & islands', scooter: '200–300 THB', car: '1,200–1,800 THB' },
      ],
    },
    cityTransit: [
      { city: 'Bangkok', lines: ['BTS Sukhumvit Line', 'BTS Silom Line', 'BTS Gold Line', 'MRT Blue Line', 'MRT Purple Line', 'MRT Yellow Line', 'MRT Pink Line', 'Airport Rail Link', 'SRT Red Line'], note: 'Fares are by distance. Tap through with a Rabbit card (BTS) or an MRT stored-value card; single-journey tokens also work.' },
      { city: 'Chiang Mai', lines: [], note: 'No rail — red songthaews (shared pickup trucks, flag one down), plus Grab and Bolt.' },
      { city: 'Phuket', lines: [], note: 'No rail — local songthaews, Grab/Bolt, and the Airport Express bus into Phuket Town.' },
    ],
    hail: [
      { name: 'Grab', what: 'Cars, taxis, bikes & food — the main app nationwide.' },
      { name: 'Bolt', what: 'Often cheaper than Grab in Bangkok and larger cities.' },
      { name: 'InDrive', what: 'Name-your-price rides in many towns.' },
    ],
    scooter: {
      note: 'Scooters (110–160cc) are the easiest way around towns and islands; rent from local shops from roughly 200–300 THB/day, less by the week.',
      tips: [
        'Legally you need an International Driving Permit (with the motorcycle category) plus your home licence — without them you are uninsured and can be fined at checkpoints.',
        'Helmets are mandatory and police do stop riders, especially on islands and in tourist towns.',
        'Never hand over your passport as a deposit — leave a photocopy and a cash deposit instead.',
        'Photograph every existing scratch before you ride off, and check the brakes, lights and tyres.',
      ],
      book: [{ name: 'BikesBooking (scooter rental)', url: 'https://www.bikesbooking.com/' }, { name: 'Local shops via Klook', url: 'https://www.klook.com/' }],
    },
    car: {
      note: 'Cars are simple to hire at airports and in cities; Thailand drives on the LEFT. An International Driving Permit is required. Automatic transmission is standard.',
      book: [{ name: 'Rentalcars.com', url: 'https://www.rentalcars.com/' }, { name: 'Localrent', url: 'https://localrent.com/en/thailand/' }],
    },
    tickets: {
      bus: [{ name: '12Go Asia', url: 'https://12go.asia/' }, { name: 'Bookaway', url: 'https://www.bookaway.com/' }],
      train: [{ name: 'SRT official e-tickets', url: 'https://www.dticket.railway.co.th/' }, { name: '12Go (trains)', url: 'https://12go.asia/' }],
      ferry: [{ name: '12Go Asia', url: 'https://12go.asia/' }, { name: 'Bookaway', url: 'https://www.bookaway.com/' }],
      flight: [{ name: 'Skyscanner', url: 'https://www.skyscanner.net/' }, { name: 'Google Flights', url: 'https://www.google.com/travel/flights' }, { name: 'AirAsia', url: 'https://www.airasia.com/' }, { name: 'Bangkok Airways', url: 'https://www.bangkokair.com/' }],
    },
    schedules: [
      { what: 'Trains', org: 'State Railway of Thailand', url: 'https://www.railway.co.th/', note: 'Official routes & timetables; buy on dticket.railway.co.th.' },
      { what: 'Trains (plain-English guide)', org: 'The Man in Seat 61', url: 'https://www.seat61.com/Thailand.htm', note: 'The clearest schedule & fare explainer for Thai trains.' },
      { what: 'Bangkok BTS / MRT / Airport Rail', org: 'Transit apps', url: 'https://www.bts.co.th/eng/', note: 'Live times in the “BTS SkyTrain” and “Bangkok MRT” apps; a Rabbit card taps you through the BTS.' },
      { what: 'Flights (live boards)', org: 'Airports of Thailand', url: 'https://www.airportthai.co.th/en/', note: 'Departure/arrival boards for Suvarnabhumi, Don Mueang, Phuket, Chiang Mai and more.' },
    ],
  },
  vi: {
    name: 'Vietnam', drivesOn: 'right',
    rentalPrices: {
      note: 'Approximate daily rates, mid-2026. Cars are usually hired WITH a driver in Vietnam, so the car figure is the car-and-driver day rate. Confirm before hiring.',
      rows: [
        { city: 'Hanoi', scooter: '120,000–200,000 VND', car: '1.2–1.8M VND (with driver)' },
        { city: 'Ho Chi Minh City', scooter: '120,000–180,000 VND', car: '1.2–1.8M VND (with driver)' },
        { city: 'Hoi An & Da Nang', scooter: '120,000–150,000 VND', car: '1.0–1.6M VND (with driver)' },
        { city: 'Da Lat / Ha Giang loops', scooter: '150,000–250,000 VND', car: '—' },
      ],
    },
    cityTransit: [
      { city: 'Hanoi', lines: ['Metro Line 2A (Cat Linh–Ha Dong)', 'Metro Line 3 (Nhon–Cau Giay, partial)', 'City bus network'], note: 'Metro and buses are very cheap; pay cash or by card at the gate.' },
      { city: 'Ho Chi Minh City', lines: ['Metro Line 1 (Ben Thanh–Suoi Tien, opened Dec 2024)', 'City bus network'], note: 'Metro Line 1 links the centre to the eastern suburbs; buses cover the rest.' },
      { city: 'Elsewhere', lines: [], note: 'No metro — Grab, Xanh SM electric taxis, Be, and local buses.' },
    ],
    hail: [
      { name: 'Grab', what: 'Cars, bikes & food nationwide — the default app.' },
      { name: 'Xanh SM', what: 'All-electric taxis and bikes; clean, metered, widely available.' },
      { name: 'Be', what: 'Popular Vietnamese ride app; often competitive on price.' },
    ],
    scooter: {
      note: 'The motorbike is Vietnam’s heartbeat; rentals run ~120,000–200,000 VND/day. Traffic is intense — ride cautiously and only if experienced.',
      tips: [
        'To ride legally you need a licence Vietnam recognises: a 1968-Convention International Driving Permit (with motorcycle class) plus your home licence. A 1949 (Geneva) IDP is not valid here, and riding unlicensed voids any insurance.',
        'Helmets are compulsory by law for rider and passenger.',
        'Leave a cash deposit and a passport photocopy — not your actual passport.',
        'Check brakes, horn and lights, and photograph existing damage before leaving.',
      ],
      book: [{ name: 'BikesBooking', url: 'https://www.bikesbooking.com/' }, { name: 'Local shops via Klook', url: 'https://www.klook.com/' }],
    },
    car: {
      note: 'Foreigners rarely self-drive in Vietnam; hiring a car WITH a driver is normal, affordable and far less stressful. Vietnam drives on the RIGHT.',
      book: [{ name: 'Car + driver via Klook', url: 'https://www.klook.com/' }, { name: '12Go private transfers', url: 'https://12go.asia/' }],
    },
    tickets: {
      bus: [{ name: '12Go Asia', url: 'https://12go.asia/' }, { name: 'Baolau', url: 'https://www.baolau.com/' }, { name: 'Vexere', url: 'https://vexere.com/' }],
      train: [{ name: 'Vietnam Railways (official)', url: 'https://dsvn.vn/' }, { name: 'Baolau', url: 'https://www.baolau.com/' }],
      ferry: [{ name: '12Go Asia', url: 'https://12go.asia/' }, { name: 'Baolau', url: 'https://www.baolau.com/' }],
      flight: [{ name: 'Skyscanner', url: 'https://www.skyscanner.net/' }, { name: 'Vietnam Airlines', url: 'https://www.vietnamairlines.com/' }, { name: 'VietJet Air', url: 'https://www.vietjetair.com/' }, { name: 'Bamboo Airways', url: 'https://www.bambooairways.com/' }],
    },
    schedules: [
      { what: 'Trains (Reunification Express)', org: 'Vietnam Railways', url: 'https://dsvn.vn/', note: 'Official timetable & booking, Hanoi–Ho Chi Minh City and branches.' },
      { what: 'Trains (plain-English guide)', org: 'The Man in Seat 61', url: 'https://www.seat61.com/Vietnam.htm', note: 'Best explainer of Vietnamese train classes, times and fares.' },
      { what: 'Metros', org: 'Hanoi & HCMC metro', url: 'https://www.seat61.com/Vietnam.htm', note: 'Hanoi has the Cat Linh–Ha Dong line; Ho Chi Minh City opened Metro Line 1 (Ben Thanh–Suoi Tien) in Dec 2024.' },
      { what: 'Flights (live boards)', org: 'Airports (ACV)', url: 'https://www.vietnamairport.vn/en', note: 'Noi Bai (Hanoi), Tan Son Nhat (HCMC), Da Nang and more.' },
    ],
  },
  kh: {
    name: 'Cambodia', drivesOn: 'right',
    rentalPrices: {
      note: 'Approximate daily rates, mid-2026 in US dollars (widely used alongside riel). Confirm before hiring. Remember: motorbikes may not be driven by tourists in Siem Reap town.',
      rows: [
        { city: 'Phnom Penh', scooter: '$5–8', car: '$35–50 (with driver)' },
        { city: 'Siem Reap', scooter: 'bicycle/e-bike $2–8', car: 'tuk-tuk day hire $15–25' },
        { city: 'Battambang & Kampot', scooter: '$5–8', car: '$30–45 (with driver)' },
      ],
    },
    cityTransit: [
      { city: 'Phnom Penh', lines: ['Smart City Bus network (~13 routes)'], note: 'Flat 1,500 riel fare; otherwise metered tuk-tuks via PassApp or Grab.' },
      { city: 'Siem Reap', lines: [], note: 'No city transit — tuk-tuks (remorques) via PassApp/Grab, or a bicycle.' },
    ],
    hail: [
      { name: 'Grab', what: 'Cars, tuk-tuks & bikes in Phnom Penh, Siem Reap and beyond.' },
      { name: 'PassApp', what: 'The local favourite for metered tuk-tuks (remorques) and cars.' },
    ],
    scooter: {
      note: 'Scooters rent for ~$5–8/day in Siem Reap and Phnom Penh. Note: driving a motorbike is banned for tourists in Siem Reap town — use a tuk-tuk or PassApp there.',
      tips: [
        'Cambodia officially requires a Cambodian licence; carry an International Driving Permit and your home licence, and expect police to sometimes stop foreigners.',
        'Helmets are legally required for the driver (and sensible for everyone).',
        'Leave a cash deposit and a passport copy — keep your passport.',
        'Roads and lighting are poor outside towns; avoid riding after dark.',
      ],
      book: [{ name: 'Local shops via Klook', url: 'https://www.klook.com/' }, { name: 'BikesBooking', url: 'https://www.bikesbooking.com/' }],
    },
    car: {
      note: 'Hiring a car WITH a driver is the norm and is inexpensive; self-drive is uncommon. Cambodia drives on the RIGHT.',
      book: [{ name: 'Car + driver via Klook', url: 'https://www.klook.com/' }, { name: '12Go private transfers', url: 'https://12go.asia/' }],
    },
    tickets: {
      bus: [{ name: '12Go Asia', url: 'https://12go.asia/' }, { name: 'CamboTicket', url: 'https://www.camboticket.com/' }, { name: 'Bookaway', url: 'https://www.bookaway.com/' }],
      train: [{ name: 'Royal Railway Cambodia', url: 'https://royal-railway.com/' }, { name: '12Go (trains)', url: 'https://12go.asia/' }],
      ferry: [{ name: '12Go Asia', url: 'https://12go.asia/' }, { name: 'CamboTicket', url: 'https://www.camboticket.com/' }],
      flight: [{ name: 'Skyscanner', url: 'https://www.skyscanner.net/' }, { name: 'Cambodia Angkor Air', url: 'https://www.cambodiaangkorair.com/' }, { name: 'Cambodia Airways', url: 'https://www.cambodia-airways.com/' }],
    },
    schedules: [
      { what: 'Trains', org: 'Royal Railway', url: 'https://royal-railway.com/', note: 'Phnom Penh–Sihanoukville and Phnom Penh–Poipet (for the Thai border); weekend-heavy timetable.' },
      { what: 'Trains (plain-English guide)', org: 'The Man in Seat 61', url: 'https://www.seat61.com/Cambodia.htm', note: 'Current explainer of Cambodia’s two passenger lines.' },
      { what: 'Buses & boats', org: '12Go Asia', url: 'https://12go.asia/', note: 'Live times, operators and prices for intercity buses and the Siem Reap–Battambang boat.' },
      { what: 'Flights (live boards)', org: 'Cambodia airports', url: 'https://www.cambodia-airports.aero/', note: 'Phnom Penh, Siem Reap–Angkor (new airport) and Sihanoukville.' },
    ],
  },
  la: {
    name: 'Laos', drivesOn: 'right',
    rentalPrices: {
      note: 'Approximate daily rates, mid-2026. Bicycles are the cheapest way around the small towns. Confirm before hiring; fuel up in town before rural loops.',
      rows: [
        { city: 'Luang Prabang', scooter: '50,000–100,000 LAK', car: 'bicycle 20,000–30,000 LAK' },
        { city: 'Vang Vieng', scooter: '60,000–100,000 LAK', car: '—' },
        { city: 'Pakse (Bolaven loop)', scooter: '60,000–120,000 LAK', car: '—' },
        { city: 'Vientiane', scooter: '50,000–100,000 LAK', car: 'from ~400,000 LAK (with driver)' },
      ],
    },
    cityTransit: [
      { city: 'Vientiane', lines: ['Central Bus Station city routes (limited)'], note: 'City buses are sparse — the LOCA app and tuk-tuks are the usual way around.' },
      { city: 'Luang Prabang', lines: [], note: 'The old town is walkable; tuk-tuks reach the airport and the waterfalls.' },
    ],
    hail: [
      { name: 'LOCA', what: 'The main Lao ride-hailing app (cars & taxis) in Vientiane, Luang Prabang and Vang Vieng. Grab does not operate in Laos.' },
    ],
    scooter: {
      note: 'Scooters (~50,000–100,000 LAK/day) and bicycles are the easy way around Luang Prabang, Vang Vieng and Pakse.',
      tips: [
        'Carry an International Driving Permit plus your home licence; police checks happen and unlicensed riding voids insurance.',
        'Helmets are required by law and strongly advised — hospitals are limited outside the capital.',
        'Leave a cash deposit and a passport copy, never the passport itself.',
        'Fuel up in town before rural rides; stations are sparse, and ride only in daylight.',
      ],
      book: [{ name: 'Local guesthouses & shops (walk-in)', url: 'https://www.laos-guide-999.com/' }, { name: 'Bikes via Klook', url: 'https://www.klook.com/' }],
    },
    car: {
      note: 'A car with a driver, or a minivan, is the usual way to cover distances; roads are winding and mountainous. Laos drives on the RIGHT.',
      book: [{ name: 'Car + driver via Klook', url: 'https://www.klook.com/' }, { name: '12Go private transfers', url: 'https://12go.asia/' }],
    },
    tickets: {
      bus: [{ name: '12Go Asia', url: 'https://12go.asia/' }, { name: 'Bookaway', url: 'https://www.bookaway.com/' }],
      train: [{ name: 'Laos–China Railway tickets', url: 'https://www.laostraintickets.com/' }, { name: '12Go (LCR trains)', url: 'https://12go.asia/' }],
      ferry: [{ name: '12Go Asia (slow boats)', url: 'https://12go.asia/' }, { name: 'Bookaway', url: 'https://www.bookaway.com/' }],
      flight: [{ name: 'Skyscanner', url: 'https://www.skyscanner.net/' }, { name: 'Lao Airlines', url: 'https://www.laoairlines.com/' }, { name: 'Lao Skyway', url: 'https://www.laoskyway.com/' }],
    },
    schedules: [
      { what: 'Laos–China Railway (fast train)', org: 'Seat61 / LCR', url: 'https://www.seat61.com/trains-and-routes/vientiane-to-luang-prabang-and-boten.htm', note: 'Vientiane–Vang Vieng–Luang Prabang–Boten in hours; seats sell out — book 1–2 days ahead.' },
      { what: 'Buses & minivans', org: '12Go Asia', url: 'https://12go.asia/', note: 'Live times and operators; the LCR train has replaced many long bus routes.' },
      { what: 'Mekong slow boat', org: 'The Man in Seat 61', url: 'https://www.seat61.com/Laos.htm', note: 'Huay Xai–Pakbeng–Luang Prabang two-day slow boat, plus rail and bus guidance.' },
      { what: 'Flights (live boards)', org: 'Lao airports', url: 'https://www.vientianeairport.com/', note: 'Wattay (Vientiane), Luang Prabang and Pakse.' },
    ],
  },
};
