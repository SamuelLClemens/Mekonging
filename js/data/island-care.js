// ---- ISLANDS WITH NO HOSPITAL, RESEARCHED ONE AT A TIME -------------------------------------
// js/data/islands.js answers one question — is there water in the way? This file answers the
// question that follows, for the islands a traveller is actually likely to be standing on when
// they ask it: if there is no hospital here, what IS here, and how does a serious case really
// get off the island?
//
// WHY THIS EXISTS. On Koh Mak the app used to say "Koh Kood Hospital — 30 min to 1 h by road",
// a hospital on a different island with no road to it, while framing the island's own health
// centre — a real, 19-minute walk away, and the first and only stop before a boat is needed —
// as "closer, but not for an emergency". Both halves of that were wrong: the distance had no
// water in it, and the framing punished the one place actually there.
//
// THE CONTRACT — the same one js/data/medical.js sets, and stricter, because this file is
// written for exactly the moment that contract describes: no hospital near you, at all.
//   * NO TELEPHONE NUMBERS. Ever — same rule as js/data/medical.js, for the same reason: a
//     stale or single-sourced number is worse than none, and this app asserts only the
//     national emergency number and a live maps lookup as call/route paths. A capability
//     ("Bangkok Hospital Trat runs a 24-hour boat ambulance covering these islands") is
//     described in prose and reached by calling the emergency number or asking your
//     accommodation, never by printing a hospital or hotline's own switchboard digits.
//   * Every fact is sourced — `srcs` indexes into ISLAND_CARE_SOURCES below. A fact that could
//     not be confirmed by at least the sourcing bar noted inline does not go in this file: it
//     is left out rather than guessed. Where research found a claim repeated everywhere but
//     traced to one origin, or found it explicitly contradicted (a 2016 report of removal
//     after a 2012 installation), it is likewise left out or stated as unresolved, never
//     asserted as current fact.
//   * An island gets an entry here only once it has been researched to this standard. Every
//     OTHER island simply has no key in ISLAND_CARE, and js/screens/medical.js falls back to
//     an honest, generic message that invents nothing about it.
//
// Keyed by the OSM key from js/data/islands.geo.js (e.g. 'way/26690559'), so a hit from
// islandAt() finds its entry with no name-matching.
export const ISLAND_CARE = {
  // Koh Mak (เกาะหมาก), Ko Kut District, Trat — researched 2026-09-27/28.
  'way/26690559': {
    name: 'Koh Mak',
    noHospital: true,
    noHospitalNote: 'There is no hospital on Koh Mak — the whole island. ExploreKohChang’s own FAQ, OpenStreetMap’s tagging of the one facility here, and the title of its Ministry of Public Health registry entry all agree on this.',
    srcs: [1, 2, 3],
    // The real first stop, reframed: not "closer, but not for an emergency" — it is the ONLY
    // stop before a boat, and going there first is the right call for almost everything.
    clinic: {
      name: 'Koh Mak Sub-district Health Promoting Hospital',
      local: 'สถานีอนามัยตำบลเกาะหมาก',
      lat: 11.8115, lng: 102.4813,
      note: 'A nurse-led health centre at Ban Ao Nid, on the road down to Ao Nid Pier. It handles everyday injuries and illness — cuts, fever, first aid — and stabilises and arranges the boat transfer for anything more serious. It is not a hospital and has no doctor or emergency room of its own.',
      srcs: [1, 4, 5],
    },
    evac: [
      { t: 'Call 1669 first', d: 'Thailand’s free national medical emergency number, dispatched by the National Institute for Emergency Medicine. Say “Koh Mak” and name your resort or the nearest pier.', srcs: [6] },
      { t: 'Bangkok Hospital Trat runs a 24-hour boat ambulance', d: 'It covers Koh Chang, Koh Mak and Koh Kood, coordinated with the Royal Thai Navy and the Marine Police. Ask your accommodation to help make contact, or raise it through the 1669 call.', srcs: [7] },
      { t: 'A private clinic on Koh Kood also covers Koh Mak by boat', d: 'Koh Kood Medical Link, based at Ao Salat, runs a medical boat with equipment on board and can teleconference with mainland doctors.', srcs: [1] },
      { t: 'The island also has real air and sea rescue behind it', d: 'Trat province has registered patient-transport boats and Sky Doctor helicopter landing zones serving its islands, and the Royal Thai Navy has stepped in directly before — see the sea-state warning below.', srcs: [8] },
    ],
    boatTimes: [
      { from: 'Laem Sok pier (mainland)', to: 'Koh Mak', mins: [30, 45], note: 'Speedboat operators run 30 minutes; the Boonsiri catamaran runs about 45.', srcs: [9] },
      { from: 'Laem Ngop pier (mainland)', to: 'Koh Mak', mins: [50, 60], srcs: [1] },
    ],
    hazards: [
      { t: 'Rough seas can stop every boat, without warning', d: 'In December 2017 the Royal Thai Navy evacuated 173 tourists stranded on Koh Mak after 1–2 metre waves grounded the regular speedboats, landing them at Laem Ngop. Sailings among Trat’s islands were cut again by storms as recently as September 2026. Check the sea state and the time of the last boat while daylight and options remain — do not wait until after dark to find out the crossing is off.', srcs: [10, 11] },
      { t: 'Box jellyfish are a real, documented hazard here', d: 'Thailand’s Department of Marine and Coastal Resources has recorded box jellyfish at Koh Mak, Koh Wai, Koh Kood and Koh Chang, and a tourist was stung at a Koh Mak beach in 2018. If it happens: leave the water, pour vinegar on the sting for at least 30 seconds if any is at hand, and treat it as the jellyfish entry in this guide describes — do not assume a vinegar station is on the beach; a 2012 installation was reported removed by 2016 and no current source confirms one is there today.', srcs: [12, 13] },
    ],
    note: 'No malaria has been reported on Koh Mak in the past 15–20 years, and anti-malarials are not considered necessary for the island itself — dengue, present islandwide and year-round across the region, is the real mosquito-borne risk here.',
    srcs: [14],
  },
};

// Everything ISLAND_CARE cites, numbered to match the `srcs` arrays above.
export const ISLAND_CARE_SOURCES = [
  { n: 1, org: 'ExploreKohChang — Koh Mak FAQs (medical, transport)', url: 'https://explorekohchang.com/koh-mak/faqs/' },
  { n: 2, org: 'OpenStreetMap contributors — facility tagging at 11.8115, 102.4813', url: 'https://www.openstreetmap.org/copyright' },
  { n: 3, org: 'Thailand Ministry of Public Health — facility registry (hcode)', url: 'https://hcode.moph.go.th/code/11549/' },
  { n: 4, org: 'OpenStreetMap / Nominatim reverse geocode of the health-centre coordinate', url: 'https://nominatim.openstreetmap.org/ui/about.html' },
  { n: 5, org: 'Royal Thai Navy, Naval Area Command 1 (referral case account)', url: 'https://www.navy.mi.th/e7c1582216d271bd57d7ff8479f09bca' },
  { n: 6, org: 'National Institute for Emergency Medicine (NIEMS) — 1669', url: 'https://www2.niems.go.th/' },
  { n: 7, org: 'Bangkok Hospital Trat — boat ambulance', url: 'https://www.bangkokhospital.com/en/trat/content/boat-ambulance-bth' },
  { n: 8, org: 'MGR Online — Trat helicopter landing zones & registered boats (2023)', url: 'https://mgronline.com/qol/detail/9660000020467' },
  { n: 9, org: 'ExploreKohChang — Koh Mak ferry & speedboat timetable', url: 'https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/koh-mak-ferry-speedboat-island-hopping/' },
  { n: 10, org: 'Thairath — Navy evacuation of 173 tourists from Koh Mak (Dec 2017)', url: 'https://www.thairath.co.th/news/local/east/1159382' },
  { n: 11, org: 'The Thaiger — Trat-island sailings cut by storms (Sep 2026)', url: 'https://thethaiger.com/hot-news/transport/koh-sichang-ferry-halted-and-koh-chang-sailings-cut-by-storms' },
  { n: 12, org: 'Department of Marine and Coastal Resources — box jellyfish species recorded at Koh Mak', url: 'https://km.dmcr.go.th/c_1/s_365/d_15246' },
  { n: 13, org: 'Thai PBS — box jellyfish sting at a Koh Mak resort beach (2018)', url: 'https://www.thaipbs.or.th/news/content/271209' },
  { n: 14, org: 'KohMakGuide — malaria & health notes for Koh Mak', url: 'https://www.kohmakguide.com/travel-tips-thailand/' },
];

// The curated entry for the island a fix resolves to, or null. Callers already hold the
// island object from islandAt() — this just does the one lookup, so js/screens/medical.js
// never has to know the shape of the key.
export function islandCareFor(island) {
  return (island && ISLAND_CARE[island.key]) || null;
}
