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
  { id: 't-th-hualamphong', cc: 'th', city: 'Bangkok', type: 'train', name: 'Hua Lamphong Station', coords: { lat: 13.737, lng: 100.517 },
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
