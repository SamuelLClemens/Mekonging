// ---- MEDICAL & EMERGENCY CARE ----------------------------------------------
// Everything a traveller needs to REACH CARE, wherever they are in the four countries.
//
// THE CONTRACT FOR THIS FILE — read before adding a row:
//   * No telephone numbers. Ever. A stale hospital switchboard number is worse than no
//     number: it burns minutes in the only situation where minutes matter. The national
//     emergency number (country data, js/data/info.*.js) and a live maps lookup are the
//     only call/route paths this app asserts.
//   * Names and coordinates are CHECKABLE FACTS. A coordinate is a city/district-centre
//     point good enough to order a list and seed a map query — it is never a claim of a
//     precise door. `tier` and `tags` describe capability, not quality ranking.
//   * Coverage is deliberately uneven because reality is uneven. Where no facility is
//     listed for a district, the app falls back to PROVINCE_CARE below, which states what
//     the country's health system structurally guarantees at that administrative level.
//     That fallback is the reason the app can answer "how do I reach a hospital" from a
//     village it has never heard of, without inventing a hospital that may not exist.
//   * Nothing here is a diagnosis or a treatment decision.
// NOTE: HOSP_TAG, EMERGENCIES and EMBASSY moved to js/data/emergency.js, and HOSPITALS to
// js/data/hospitals.curated.js (which stays eager — it is the offline SOS fallback), both
// in mk-v0.490.0.
// js/main.js needs only those three, and importing them from here pulled this whole
// dataset into the eager graph. Import them from emergency.js, not from here.

// Capability tags, shown as chips.
export const TIER_META = {
  intl: { label: 'International', dot: '🟢', blurb: 'International-standard private hospital. English spoken, insurance and cards normally accepted, and used to treating foreign patients.' },
  private: { label: 'Private', dot: '🔵', blurb: 'Private hospital. Usually faster than a public one and often has some English, but payment is normally expected up front.' },
  public: { label: 'Government', dot: '🟡', blurb: 'Government provincial or regional hospital. This is the ER that must accept an emergency. Capable, often crowded, and English can be limited.' },
  district: { label: 'District', dot: '🟠', blurb: 'District hospital or health centre. Staffed for first aid, stabilisation and common illness — a serious case is stabilised here and referred onward.' },
  clinic: { label: 'Clinic', dot: '⚪', blurb: 'Clinic only — no surgery and usually no overnight beds. Good for minor injury and illness; anything major means transfer.' },
};
export const TIER_ORDER = ['intl', 'private', 'public', 'district', 'clinic'];

// Facilities travellers, expats and embassies actually use, grouped by country and then
// roughly by traveller region. `prov` matches the ADM1 name in js/data/regions.<cc>.js so a
// GPS fix that resolves to a province can pull that province's own options even when the
// traveller is far from any listed city.
export const CARE_SYSTEM = {
  th: {
    hospitalWord: { script: 'โรงพยาบาล', roman: 'rohng pá-yaa-baan' },
    erWord: { script: 'ห้องฉุกเฉิน', roman: 'hông chùk-chěrn' },
    levels: [
      'Every one of Thailand’s 77 provinces has a government provincial hospital in its capital district, and most run a 24-hour emergency room.',
      'Every district (amphoe) has a community hospital — typically 30–120 beds, with a doctor on call day and night.',
      'Every sub-district has a health-promoting hospital: a nurse-led clinic for first aid, wound care and common illness, which arranges onward transfer.',
    ],
    ambulance: 'Thailand has the region’s strongest emergency medical service. The national number reaches a dispatcher who sends the nearest ambulance, and in Bangkok charitable foundation ambulances respond as well. Response is quick in cities and on main highways, slower on mountain and island roads.',
    payment: 'A government hospital will treat an emergency first and bill afterwards, usually at modest cost. Private and international hospitals normally want a card, cash or an insurer’s guarantee of payment before non-urgent treatment.',
    pharmacy: 'Pharmacies are everywhere and pharmacists are well trained. Many medicines that need a prescription at home are sold over the counter, and a pharmacist is a sensible first stop for a minor problem.',
  },
  vi: {
    hospitalWord: { script: 'bệnh viện', roman: 'benh vee-en' },
    erWord: { script: 'cấp cứu', roman: 'cap kuu' },
    levels: [
      'Every province and centrally governed city has a provincial general hospital (bệnh viện đa khoa tỉnh) with a 24-hour emergency department.',
      'Every district has a district hospital or medical centre able to stabilise and refer.',
      'Every commune has a health station for first aid and common illness.',
    ],
    ambulance: 'A national ambulance number exists, but response times vary widely and city traffic often defeats it. In Hanoi, Ho Chi Minh City and Da Nang the international hospitals and clinics run their own ambulances and are frequently faster — and in dense traffic a taxi or ride-hailing car can beat both.',
    payment: 'Public hospitals charge foreigners directly, usually in cash and usually far less than a private hospital. International hospitals expect a card or an insurer’s guarantee of payment, and may ask for a deposit before admission.',
    pharmacy: 'Pharmacies (nhà thuốc) are common and cheap. Bring the generic name of anything you take regularly, because brand names differ.',
  },
  kh: {
    hospitalWord: { script: 'មន្ទីរពេទ្យ', roman: 'mon-tii pet' },
    erWord: { script: 'សង្គ្រោះបន្ទាន់', roman: 'sang-kruoh bon-toan' },
    levels: [
      'Every province has a provincial referral hospital in its capital, and the larger ones run a 24-hour emergency service.',
      'Districts have referral hospitals or health centres of varying capability — some perform surgery, many do not.',
      'Commune health centres handle first aid, common illness and maternity, and refer anything else.',
    ],
    ambulance: 'Ambulance cover outside Phnom Penh is thin and can be slow or absent. In practice most people reach hospital by car, tuk-tuk or private ambulance arranged by a hotel or clinic. If someone can be moved safely, going to the hospital is usually faster than waiting for one to come.',
    payment: 'Cambodia is largely a cash-first health system. Private and international hospitals ask for payment or an insurer’s guarantee up front, and card acceptance is not guaranteed. Carry enough cash to start treatment.',
    pharmacy: 'Stick to established pharmacy chains in the cities. Counterfeit and poorly stored medicine is a genuine problem in small shops, particularly for antibiotics and antimalarials.',
  },
  la: {
    hospitalWord: { script: 'ໂຮງໝໍ', roman: 'hohng mŏr' },
    erWord: { script: 'ຫ້ອງສຸກເສີນ', roman: 'hông sùk-sěrn' },
    levels: [
      'Every province has a provincial hospital in its capital; five of them are designated regional hospitals with wider capability.',
      'Districts have district hospitals, many of them small and without a surgeon on site.',
      'Village health centres provide first aid and basic medicine only.',
    ],
    ambulance: 'Laos has the most limited emergency medical service in the region. Vientiane has an ambulance service; most provinces effectively do not. Assume you will need a private vehicle, and ask your accommodation to arrange one rather than waiting.',
    payment: 'Cash, in kip or Thai baht, is the working assumption everywhere. Even the international centre in Vientiane will want payment or a written guarantee from your insurer before major treatment.',
    pharmacy: 'Pharmacy stock is limited outside Vientiane and Luang Prabang, and quality is inconsistent. Bring a full supply of anything you depend on, in its original packaging with the prescription.',
  },
};

// Where a serious case actually goes when the local hospital cannot treat it. These are
// the referral and evacuation chains embassies, insurers and expat clinics really use —
// and for Laos and rural Cambodia, the chain crosses a border. Knowing the destination
// before you need it is what turns a panicked afternoon into a phone call.
export const EVAC = {
  th: [
    { from: 'Anywhere in Thailand', to: 'Bangkok', how: 'Road, or a domestic flight from any provincial airport. Thailand can treat almost anything domestically — leaving the country is rarely necessary.' },
    { from: 'The gulf islands (Samui, Phangan, Tao)', to: 'Koh Samui, then Bangkok', how: 'Boat or air transfer. Sea state and the last ferry govern the timetable, so start the conversation early rather than at nightfall.' },
    { from: 'Andaman islands (Phi Phi, Lanta, Lipe)', to: 'Krabi or Phuket', how: 'Speedboat, then road. Phuket has the region’s best trauma and hyperbaric care.' },
    { from: 'The far north (Pai, Mae Hong Son)', to: 'Chiang Mai', how: 'Road, roughly 3–6 hours of mountain driving, or the short Mae Hong Son–Chiang Mai flight.' },
  ],
  vi: [
    { from: 'Anywhere in Vietnam', to: 'Hanoi or Ho Chi Minh City', how: 'Domestic flight or road. Both cities have international hospitals that accept transfers.' },
    { from: 'Central Vietnam (Hoi An, Hue, the highlands)', to: 'Da Nang', how: 'Road. Da Nang has the region’s largest emergency department and an international hospital.' },
    { from: 'The far north (Sapa, Ha Giang)', to: 'Lao Cai, then Hanoi', how: 'Road down the mountain, then the expressway — allow the better part of a day from the Ha Giang passes.' },
    { from: 'Islands (Phu Quoc, Con Dao, Cat Ba)', to: 'The mainland', how: 'Flight or boat. Weather closes both; a serious case may need an air ambulance to Ho Chi Minh City or Bangkok.' },
  ],
  kh: [
    { from: 'Anywhere in Cambodia', to: 'Phnom Penh', how: 'Road or domestic flight. Complex cases are then flown onward.' },
    { from: 'Phnom Penh or Siem Reap', to: 'Bangkok or Singapore', how: 'Commercial flight with an escort, or an air ambulance arranged by your insurer. This is the standard path for major trauma, cardiac events and anything needing intensive care — Bangkok is roughly an hour in the air.' },
    { from: 'The islands (Koh Rong, Koh Rong Sanloem)', to: 'Sihanoukville', how: 'Ferry or a chartered speedboat. Boats stop after dark and in rough seas, which is the real constraint.' },
  ],
  la: [
    { from: 'Vientiane', to: 'Udon Thani, Thailand', how: 'Road across the Friendship Bridge, about an hour to Aek Udon International Hospital. This is the standard evacuation route and the reason to keep your passport reachable. Insurers arrange it routinely.' },
    { from: 'Savannakhet', to: 'Mukdahan, Thailand', how: 'Across the second Friendship Bridge — minutes, not hours.' },
    { from: 'Thakhek', to: 'Nakhon Phanom, Thailand', how: 'Across the third Friendship Bridge.' },
    { from: 'Pakse and the south', to: 'Ubon Ratchathani, Thailand', how: 'Road via the Chong Mek crossing, roughly 2–3 hours.' },
    { from: 'Huay Xai and the north-west', to: 'Chiang Rai, Thailand', how: 'Across the fourth Friendship Bridge, then about 2 hours by road.' },
    { from: 'Luang Prabang and the north', to: 'Vientiane, then Thailand or Bangkok', how: 'Domestic flight, then onward. Overland from the northern provinces is slow and mountainous — a flight is usually the right call.' },
  ],
};

// The sequence that works from anywhere, with or without a signal, in the order it should
// actually be done. Rendered as the spine of the "get to a hospital" screen.
export const REACH_STEPS = [
  { ic: '📞', t: 'Call the national emergency number', d: 'It is free from any phone, works with no credit and usually with no SIM at all. Say your country, town and what has happened. If nobody answers in English, keep the line open and hand the phone to a local — a hotel receptionist, a shopkeeper, a driver.' },
  { ic: '🪧', t: 'If you cannot speak the language, show it', d: 'Open the emergency phrase card below and hold the screen up. It works with no signal and no battery-hungry translation. One sentence in the local script gets you a driver, a hospital or an ambulance.' },
  { ic: '🚗', t: 'Do not wait for an ambulance if you can move safely', d: 'Outside Thailand’s cities an ambulance may be slow or unavailable. If the person can be moved without making things worse, a taxi, a ride-hailing car, a hotel car or a tuk-tuk is usually faster. Do not move anyone with a suspected neck or back injury.' },
  { ic: '🏥', t: 'Go to the biggest hospital you can reach, not the closest', d: 'For a serious injury, a heart attack or a stroke, a provincial or international hospital thirty minutes away beats a village clinic five minutes away. For anything minor, the opposite is true.' },
  { ic: '📄', t: 'Bring your passport, insurance details and cash', d: 'Private hospitals ask for payment or an insurer’s guarantee before treatment. Show a passport copy rather than surrendering the original. Fill in the medical card on this screen now, while nothing is wrong.' },
  { ic: '☎️', t: 'Ring your insurer’s assistance line early', d: 'Ideally before admission. They can send a guarantee of payment straight to the hospital, approve a transfer, and tell you which hospital they will actually cover. Calling afterwards can turn a covered claim into a disputed one.' },
];

// What to do when the honest answer is "there is no hospital near you".
export const REMOTE_PLAN = [
  'Work out where you are precisely — a screenshot of the map with your pin, or the coordinates from this app — before you make any call. It is the first thing a dispatcher asks and the hardest thing to describe on a mountain road.',
  'Ask your accommodation, guide or driver to make the call. They know the local road, the local hospital and the person who owns a vehicle, and they can speak to a dispatcher who may not speak English.',
  'Send someone to the nearest village health centre even if it is small. Staff there can give first aid, oxygen in some places, and — crucially — can arrange the referral and telephone ahead.',
  'Treat time as the resource. In the highlands of Laos, the Ha Giang loop, Mondulkiri or Mae Hong Son, the journey to real care is measured in hours. Start moving toward it while you are still deciding.',
  'If you are on an island, check the last boat and the sea state immediately. A crossing that is routine at noon may be impossible at ten at night, and that single fact often decides whether to leave now.',
  'If diving is involved, say so on the first call and ask for the nearest recompression chamber. Do not go to the nearest hospital by default — the right destination may be further away.',
];

export const MED_SOURCES = [
  { org: 'OpenStreetMap contributors (every mapped hospital and clinic, ODbL)', url: 'https://www.openstreetmap.org/copyright' },
  { org: 'World Health Organization — country health system profiles', url: 'https://www.who.int/countries' },
  { org: 'Joint Commission International (hospital accreditation)', url: 'https://www.jointcommissioninternational.org' },
  { org: 'Thailand National Institute for Emergency Medicine', url: 'https://www.niems.go.th' },
  { org: 'UK Foreign, Commonwealth & Development Office — travel advice, health', url: 'https://www.gov.uk/foreign-travel-advice' },
  { org: 'US State Department — country information, medical facilities', url: 'https://travel.state.gov' },
  { org: 'Divers Alert Network Asia-Pacific (recompression chambers)', url: 'https://www.danap.org' },
];

// ---- WHAT TO DO WHEN IT IS NOT A MEDICAL EMERGENCY --------------------------
// The SOS screen used to cover exactly one kind of trouble: something bit you. These are
// the rest — ranked, roughly, by how often they actually happen to travellers here, which
// is not the order people expect. Road traffic injury is the leading cause of death for
// foreign travellers in this region by a wide margin; snakes are nowhere near the top.
//
// Each entry is written to be read in a hurry: `now` is the next sixty seconds, `then` is
// the next few hours, `avoid` is the thing people reliably get wrong. Nothing here is legal
// or medical advice, and nothing replaces the national emergency number.
