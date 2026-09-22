// Passenger ferry and speedboat legs for the offline map's "Ferries" layer.
//
// Pier coordinates are OpenStreetMap objects (ids in the comments), read September 2026. A leg
// is drawn as a straight line between its two piers: it shows WHICH piers connect, not the
// boat's actual course, and the popup says so. Legs are only drawn where both piers are known —
// Koh Kood's Klong Mad pier, Chonratee's Ban Laem Son and Sea Far piers, and Koh Wai's pier are
// not in OpenStreetMap, so those boats appear on their route cards but have no line here.
//
// Operator contacts come from js/data/operators.js by key; the full timetables and journey
// options are on the matching route card (routeId), in js/data/routes.th.js.
export const FERRIES_CHECKED = '2026-09';

export const PIERS = {
  laemngop: { name: 'Krom Luang Chumphon pier (Laem Ngop)', lat: 12.1753583, lng: 102.3868607 }, // node 2223926452
  laemsok: { name: 'Laem Sok pier', lat: 12.0362894, lng: 102.5881279 },                         // node 9137422924
  aonid: { name: 'Ao Nid pier, Koh Mak', lat: 11.8040548, lng: 102.4871921 },                     // way 105841952
  aosuanyai: { name: 'Ao Suan Yai pier (Koh Mak Resort), Koh Mak', lat: 11.8253264, lng: 102.4696556 }, // way 105841946
  makathanee: { name: 'Makathanee Resort pier, Koh Mak', lat: 11.8132562, lng: 102.4624262 },     // way 196946261
  bangbao: { name: 'Bang Bao pier, Koh Chang', lat: 11.96967, lng: 102.31415 },                   // way 83672699
  kaibae: { name: 'Kai Bae pier, Koh Chang', lat: 12.0280018, lng: 102.2897154 },                 // node 2384404974
  aosalad: { name: 'Ao Salad pier, Koh Kood', lat: 11.7073508, lng: 102.5707545 },                // node 776288678
  aothammachat: { name: 'Ao Thammachat car ferry pier', lat: 12.1871329, lng: 102.3013974 },     // node 325802036
  aosapparot: { name: 'Ao Sapparot pier, Koh Chang', lat: 12.1415548, lng: 102.2804378 },         // node 2507757433
  // Gulf of Thailand. Read through Nominatim (Overpass was timing out), September 2026. Raja
  // Ferry's Donsak terminal is not in OpenStreetMap, so the Raja crossings have no line here.
  chumphon: { name: 'Lomprayah pier, Thung Makham Noi (Chumphon)', lat: 10.3569297, lng: 99.2671757 }, // way 104109227
  maehaad: { name: 'Mae Haad pier (Lomprayah), Koh Tao', lat: 10.0842147, lng: 99.8236459 },      // node 1207365518
  thongsala: { name: 'Thong Sala pier, Koh Phangan', lat: 9.7090017, lng: 99.9841891 },            // way 171750819
  pralarn: { name: 'Pralarn pier (Lomprayah), Koh Samui', lat: 9.5844377, lng: 99.9851674 },       // node 1587252583
  nathon: { name: 'Nathon pier (Lomprayah), Koh Samui', lat: 9.5364262, lng: 99.9320403 },         // node 4775993796
  donsak: { name: 'Lomprayah pier, Donsak (Surat Thani)', lat: 9.3381945, lng: 99.6800576 },       // way 101156136
};

// fare: adult one-way THB. mins: crossing time, or null where no source gives one. kids: the child rule for THIS leg's operators. season: when it runs.
export const FERRY_LEGS = [
  {
    id: 'chumphon-maehaad', a: 'chumphon', b: 'maehaad', routeId: 'th-chumphon-kohtao', ops: ['lomprayah'],
    fare: '450–750', mins: [105, 150], season: 'Daily: slow ferry 05:45 (450 THB); catamaran 07:00 and 13:15 (750 THB).',
    kids: 'Under 2 free on the boat; ages 2–11 half price.',
  },
  {
    id: 'maehaad-thongsala', a: 'maehaad', b: 'thongsala', routeId: 'th-kohphangan-kohtao', ops: ['lomprayah', 'seatrandiscovery'],
    fare: 800, mins: null, season: 'Lomprayah five a day from Koh Phangan (hotel pickup 07:30, 07:45, 12:00, 12:05, 15:45), 800 THB including the pickup.',
    kids: 'Lomprayah: under 2 free on the boat; ages 2–11 half price. Seatran Discovery: ask.',
  },
  {
    id: 'thongsala-pralarn', a: 'thongsala', b: 'pralarn', routeId: 'th-kohsamui-kohphangan', ops: ['lomprayah', 'seatrandiscovery'],
    fare: 500, mins: null, season: 'Lomprayah from Samui: hotel pickup 06:30 and 10:30 (catamaran, 500 THB), 09:15 (ferry, 400 THB). Back from Phangan 550 THB.',
    kids: 'Lomprayah: under 2 free on the boat; ages 2–11 half price. Seatran Discovery: ask.',
  },
  {
    id: 'maehaad-pralarn', a: 'maehaad', b: 'pralarn', routeId: 'th-kohsamui-kohtao', ops: ['lomprayah'],
    fare: 850, mins: null, season: 'From Samui: hotel pickup 06:30 and 10:30 (catamaran, 850 THB), 09:15 (ferry, 700 THB), calling at Koh Phangan.',
    kids: 'Under 2 free on the boat; ages 2–11 half price.',
  },
  {
    id: 'donsak-nathon', a: 'donsak', b: 'nathon', routeId: 'th-suratthani-kohsamui', ops: ['lomprayah'],
    fare: 450, mins: [45, 45], season: 'Daily 11:00 and 15:00 from Donsak. Raja’s hourly car ferry (210 THB) sails from its own terminal to Lipa Noi and is not drawn.',
    kids: 'Under 2 free on the boat; ages 2–11 half price.',
  },
  {
    id: 'donsak-thongsala', a: 'donsak', b: 'thongsala', routeId: 'th-suratthani-kohphangan', ops: ['lomprayah'],
    fare: 550, mins: [90, 105], season: 'Daily 11:00 and 15:00 from Donsak. Raja (280 THB, 2 h 30 min) sails from its own terminal and is not drawn.',
    kids: 'Under 2 free on the boat; ages 2–11 half price.',
  },
  {
    id: 'aothammachat-aosapparot', a: 'aothammachat', b: 'aosapparot', routeId: 'th-bangkok-kohchang', ops: ['ferrykohchang'],
    fare: 90, mins: [25, 40], season: 'Year-round, both ways: 06:30, then 07:45 to 17:45 at 45 minutes past the hour, and 18:30. Between the first and last boats a ferry may wait until it is full. Cars 200 THB, motorbikes 90 THB. The only ferry to Koh Chang — Centrepoint closed in 2024.',
    kids: 'Sources differ: under 110 cm free and 110–150 cm 40 THB (Explore Koh Chang, May 2026), or children at the adult 90 THB (Koh Chang Ferries, Sep 2026).',
  },
  {
    id: 'laemngop-aonid', a: 'laemngop', b: 'aonid', routeId: 'th-bangkok-kohmak', ops: ['kohmakferry'],
    fare: 550, mins: [50, 60], season: 'Year-round from Laem Ngop at 11:30 (Explore Koh Chang) or 12:30 (Koh Mak News, 17 Sep 2026) — call the day before. Back 08:30.',
    kids: 'Under 100 cm free on a lap; 100–130 cm 350 THB.',
  },
  {
    id: 'laemngop-aosuanyai', a: 'laemngop', b: 'aosuanyai', routeId: 'th-bangkok-kohmak', ops: ['panan'],
    fare: 550, mins: [50, 60], season: 'Afternoon boat year-round, at 16:00 (Explore Koh Chang) or 15:00 (Koh Mak News, 17 Sep 2026) — call the day before; plus 12:30 from 1 Oct. Back 10:00, plus 13:30 from 1 Oct.',
    kids: 'Under 100 cm free on a lap; 100–130 cm 350 THB.',
  },
  {
    id: 'laemngop-makathanee', a: 'laemngop', b: 'makathanee', routeId: 'th-bangkok-kohmak', ops: ['leelawadee'],
    fare: 549, mins: [50, 60], season: '14:00 from Laem Ngop, 11:30 back. Its own site says it runs all year (Ao Nid in low season); both guides say it is suspended. Call 090 506 0020 first.',
    kids: 'Under 100 cm free on a lap; under 130 cm 300 THB (operator site).',
  },
  {
    id: 'laemsok-aonid', a: 'laemsok', b: 'aonid', routeId: 'th-bangkok-kohmak', ops: ['boonsiri', 'kohkutexpress', 'chonratee'],
    fare: '500–550', mins: [30, 45], season: 'Boonsiri year-round (10:30 and 15:30 from 1 Oct; 11:00 until 30 Sep). Koh Kut Express 11:45 and 16:00 from mid-October; Chonratee 14:00 from its Ban Laem Son pier, Oct–May.',
    kids: 'By age: Koh Kut Express only under-4s free, on a lap; Boonsiri full fare from age 5.',
  },
  {
    id: 'bangbao-aonid', a: 'bangbao', b: 'aonid', routeId: 'th-kohchang-kohmak', ops: ['boonsiri', 'kohchangexpress'],
    fare: '500–600', mins: [30, 120], season: 'Boonsiri year-round (09:00 and 13:00; 13:00 only Jun–Sep). Koh Chang Express speedboat Oct–May, and Bang Bao Boat’s wooden boat (500 THB, 2 h) Nov–Apr, both calling at Koh Wai.',
    kids: 'Boonsiri: under-4s free. Bang Bao Boat: under 3 free, 4–6 half price.',
  },
  {
    id: 'kaibae-makathanee', a: 'kaibae', b: 'makathanee', routeId: 'th-kohchang-kohmak', ops: ['kaibaehut'],
    fare: 800, mins: [60, 60], season: 'Nov–Apr only: 09:00 from Kai Bae, calling at Koh Wai.',
    kids: 'No published child fare — ask.',
  },
  {
    id: 'aonid-aosalad', a: 'aonid', b: 'aosalad', routeId: 'th-kohmak-kohkood', ops: ['boonsiri'],
    fare: 400, mins: [30, 45], season: 'Year-round: 10:00 and 14:00 from Koh Mak, reduced Jun–Sep.',
    kids: 'Full fare from age 5, under-4s free.',
  },
  {
    id: 'laemsok-aosalad', a: 'laemsok', b: 'aosalad', routeId: 'th-bangkok-kohkood', ops: ['boonsiri', 'seudamgo', 'kohkutexpress'],
    fare: 600, mins: [60, 75], season: 'Boonsiri 10:45, 13:15, 15:00 and Seudamgo 12:00, 15:20 year-round (fewer Jun–Sep); Koh Kut Express express boat 14:00 year-round, its speedboats mid-Oct to Apr.',
    kids: 'Boonsiri and Seudamgo: 4 and under free, 5+ adult. Koh Kut Express: under-4s free on a lap.',
  },
  {
    id: 'bangbao-aosalad', a: 'bangbao', b: 'aosalad', routeId: 'th-kohchang-kohkood', ops: ['boonsiri'],
    fare: 900, mins: [90, 105], season: 'Boonsiri year-round via Koh Mak: 09:00 and about 13:00 from Bang Bao, one boat a day Jun–Sep. Speedboats (1,000–1,200 THB) run Oct–May.',
    kids: 'Under-4s free.',
  },
];
