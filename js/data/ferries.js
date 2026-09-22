// Passenger ferry and speedboat legs for the offline map's "Ferries" layer.
//
// Pier coordinates are OpenStreetMap objects (ids in the comments), read September 2026. A leg
// is drawn as a straight line between its two piers: it shows WHICH piers connect, not the
// boat's actual course, and the popup says so. Legs are only drawn where both piers are known —
// Koh Kood's Klong Mad pier is not in OpenStreetMap, so the Klong Mad boats appear in the
// Koh Mak → Koh Kood route card but have no line here.
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
};

// fare: adult one-way THB. mins: crossing time, or null where no source gives one. kids: the child rule for THIS leg's operators. season: when it runs.
export const FERRY_LEGS = [
  {
    id: 'aothammachat-aosapparot', a: 'aothammachat', b: 'aosapparot', routeId: 'th-bangkok-kohchang', ops: ['ferrykohchang'],
    fare: 80, mins: null, season: 'Year-round, hourly at 45 minutes past the hour, 06:30–18:30 both ways. Cars 100 THB.',
    kids: 'Children 30 THB (no age or height limit published — ask at the window).',
  },
  {
    id: 'laemngop-aonid', a: 'laemngop', b: 'aonid', routeId: 'th-bangkok-kohmak', ops: ['kohmakferry'],
    fare: 550, mins: [50, 60], season: 'Year-round: 11:30 from Laem Ngop, 08:30 from Koh Mak.',
    kids: 'Under 100 cm free on a lap; 100–130 cm 350 THB.',
  },
  {
    id: 'laemngop-aosuanyai', a: 'laemngop', b: 'aosuanyai', routeId: 'th-bangkok-kohmak', ops: ['panan'],
    fare: 550, mins: [50, 60], season: '16:00 year-round, plus 12:30 from 1 Oct. Back 10:00, plus 13:30 from 1 Oct.',
    kids: 'Under 100 cm free on a lap; 100–130 cm 350 THB.',
  },
  {
    id: 'laemngop-makathanee', a: 'laemngop', b: 'makathanee', routeId: 'th-bangkok-kohmak', ops: ['leelawadee'],
    fare: 550, mins: [50, 60], season: '14:00 from Laem Ngop, 11:30 back — did not run Jun–Sep 2026 and the restart is unconfirmed. Call first.',
    kids: 'Under 100 cm free on a lap; under 130 cm 300 THB (operator site).',
  },
  {
    id: 'laemsok-aonid', a: 'laemsok', b: 'aonid', routeId: 'th-bangkok-kohmak', ops: ['boonsiri', 'kohkutexpress', 'chonratee'],
    fare: '500–550', mins: [30, 45], season: 'Boonsiri year-round (10:30 and 15:30 from 1 Oct; 11:00 until 30 Sep). Koh Kut Express and Chonratee from 1 Oct.',
    kids: 'By age: Koh Kut Express only under-4s free, on a lap; Boonsiri full fare from age 5.',
  },
  {
    id: 'bangbao-aonid', a: 'bangbao', b: 'aonid', routeId: 'th-kohchang-kohmak', ops: ['boonsiri', 'kohchangexpress'],
    fare: 600, mins: [30, 60], season: 'Boonsiri year-round (09:00 and 13:00; 13:00 only Jun–Sep). Koh Chang Express Oct–May, calling at Koh Wai.',
    kids: 'Boonsiri full fare from age 5, under-4s free. Koh Chang Express: ask.',
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
];
