// Emergency contacts, embassy guidance and the hospital tag labels.
//
// Split out of js/data/medical.js in mk-v0.490.0 for one reason: js/main.js needs exactly
// these three exports — for the SOS screen and one hospital card — and importing them dragged
// the whole 61.6 KB medical dataset into the EAGER module graph, for every traveller, on every
// cold start. The 45 KB left behind (HOSPITALS, CARE_SYSTEM, EVAC, REACH_STEPS, REMOTE_PLAN,
// MED_SOURCES and the tier metadata) is read only by js/screens/medical.js, which is now
// lazily loaded with its route.
//
// Same technique as the mk-v0.482.0 history split, and the same rule applies: if main.js ever
// needs something else from the medical dataset, move that export HERE rather than widening
// the import, or the 45 KB comes straight back.

export const HOSP_TAG = {
  er: '🚑 24h emergency',
  peds: '🧒 Children',
  maternity: '🤰 Maternity',
  intl: '🌐 English / international',
  trauma: '🩸 Major trauma & surgery',
  hyperbaric: '🤿 Hyperbaric (dive) chamber',
  evac: '✈️ Arranges medical evacuation',
};

// What each tier actually means on the ground. Shown verbatim so a traveller can judge
// whether the nearest listed option is the RIGHT option for what has happened.

export const EMERGENCIES = [
  {
    id: 'crash', ic: '🛵', t: 'Road or scooter accident',
    lead: 'By far the most likely serious emergency a traveller faces in this region.',
    now: [
      'Get out of the traffic lane before anything else. Being hit a second time is a real risk on a fast road, and it is what turns a survivable crash into a fatal one.',
      'Call the national emergency number. Say the road, the direction of travel and the nearest landmark or kilometre marker — a screenshot of your map pin is the fastest way to answer "where are you?".',
      'Do not move anyone who has hit their head or complains of neck or back pain, unless leaving them is more dangerous than moving them.',
      'Control heavy bleeding with firm, continuous pressure through whatever cloth you have. Keep pressing; do not lift to check.',
    ],
    then: [
      'Go to hospital even if you feel fine. Head injuries and internal bleeding declare themselves hours later, and road rash here infects fast in the heat.',
      'Get a police report. Without one, most travel insurance and every vehicle claim is disputed. Ask for the report number before you leave.',
      'Photograph everything at the scene: both vehicles, the road, the position, any licence and registration, and the other rider. Photographs settle later arguments that memory cannot.',
      'Tell your insurer the same day. Many policies exclude motorcycle injury unless you hold a licence valid for that engine size and were wearing a helmet — know which before you rent, not after you crash.',
    ],
    avoid: [
      'Do not hand over your passport as security to a rental shop, a hospital or anyone at the scene. Offer a photocopy or a deposit instead — a withheld passport is the standard lever in a rental dispute.',
      'Do not agree a cash settlement at the roadside before you know the extent of your own injuries.',
    ],
  },
  {
    id: 'spiking', ic: '🥃', t: 'Drink spiking & methanol poisoning',
    lead: 'Rare but not hypothetical — and methanol poisoning is survivable only if it is recognised early.',
    now: [
      'Treat sudden severe drunkenness that does not match how much was drunk as an emergency, especially after free shots, mixed spirits or home-made liquor.',
      'Methanol poisoning classically appears 6–30 hours after drinking, not immediately: blurred or snowy vision, severe stomach pain, breathlessness, confusion. Any vision change after drinking spirits is a hospital emergency that night, not in the morning.',
      'Get the person to the largest hospital you can reach and say the words "possible methanol poisoning". Treatment exists and works; delay is what kills.',
      'If someone is unconscious but breathing, put them on their side so they cannot choke, and stay with them.',
    ],
    then: [
      'Keep the bottle, the glass or the receipt if you safely can — it helps the hospital and any investigation.',
      'Report it to the tourist police and to your embassy. Clusters are how these venues get shut.',
    ],
    avoid: [
      'Do not let anyone "sleep it off" alone in a room. Almost every death in a spiking or methanol cluster involves someone left to sleep.',
      'Do not accept drinks from a shared jug or a bucket you did not watch being poured, and do not leave a drink unattended.',
    ],
  },
  {
    id: 'passport', ic: '🛂', t: 'Lost or stolen passport',
    lead: 'Recoverable, but the order of the steps decides whether it takes two days or two weeks.',
    now: [
      'Report it to the local police and get a written report with a reference number. Every embassy asks for it, and so does your insurer.',
      'Contact your embassy or consulate — the nearest one is usually in Bangkok, Hanoi, Ho Chi Minh City or Phnom Penh, and many countries have none at all in Laos.',
      'If your visa or entry stamp was in it, immigration will need to reissue the record before you can leave the country. Start that on the same day.',
    ],
    then: [
      'Ask for an emergency travel document if you have a flight soon; a full replacement passport takes longer and may have to be issued from a regional hub.',
      'Cancel and replace any cards that went with it, and change the passwords for anything that was unlocked on a stolen phone.',
    ],
    avoid: [
      'Do not leave the country by land while the entry record is unresolved — an unmatched entry stamp turns a lost passport into an immigration problem.',
      'Do not rely on the photocopy alone. Keep a photograph of the data page and the entry stamp somewhere you can reach without your phone.',
    ],
  },
  {
    id: 'theft', ic: '🎒', t: 'Robbery, theft or assault',
    lead: 'Snatch theft from a moving motorbike is the common version, and it injures people because they hold on.',
    now: [
      'Let it go. A bag is replaceable; being dragged along a road is how snatch theft causes serious injury and death.',
      'If you are hurt, treat that first and go to hospital — the report can be made afterwards.',
      'Report it to the tourist police where there is a tourist police unit; they usually have English speakers and handle traveller cases directly.',
    ],
    then: [
      'Freeze cards immediately and check for transactions — card cloning at ATMs is common in this region.',
      'Get the written police report for your insurer; a verbal report is not enough for a claim.',
      'Tell your embassy if a passport, a visa or your safety is involved.',
    ],
    avoid: [
      'Do not chase anyone, and do not confront a group.',
      'Do not carry your only card, your only phone and your passport in the same bag.',
    ],
  },
  {
    id: 'arrest', ic: '⚖️', t: 'Arrested or detained',
    lead: 'Drug offences carry severe penalties across all four countries, including sentences travellers do not expect.',
    now: [
      'Ask immediately, clearly and repeatedly to contact your embassy. You are entitled to consular access; the request is what triggers it.',
      'Do not sign anything you cannot read, and say so plainly. Ask for a translated copy and for a lawyer.',
      'Stay calm and polite. Argument and raised voices make everything that follows harder.',
    ],
    then: [
      'The embassy can supply a list of local lawyers, contact your family and monitor your treatment.',
      'Arrange money through family or your insurer rather than through anyone who approaches you at the station.',
    ],
    avoid: [
      'Do not offer money to a police officer. In a genuine arrest it converts a bad situation into a far worse one.',
      'Do not assume a substance is legal because it is sold openly to tourists — cannabis law in Thailand has changed more than once and differs completely in the other three countries.',
    ],
  },
  {
    id: 'water', ic: '🌊', t: 'In trouble in the water',
    lead: 'Drowning is the second leading cause of traveller death here, and rip currents cause most of it.',
    now: [
      'Caught in a rip: do not swim against it. Float, signal, and swim parallel to the beach until the pull stops, then come in at an angle.',
      'Helping someone else: throw them something that floats and call for help. Swimming out to a panicking person is how one drowning becomes two.',
      'Out of the water and not breathing: start chest compressions immediately — hard and fast in the centre of the chest, about twice a second — and send someone for an ambulance.',
    ],
    then: [
      'Anyone who has been under the water needs hospital assessment even if they seem fine afterwards.',
      'For a jellyfish sting, flood the area with vinegar for at least thirty seconds and treat any breathing difficulty as an emergency. Box jellyfish are present in the Gulf of Thailand and around the Cambodian coast.',
    ],
    avoid: [
      'Do not swim where a red flag is flying, and do not judge a beach by how calm it looks — rips are strongest where the water appears flattest.',
      'Do not drink and swim, and do not swim alone at night.',
    ],
  },
  {
    id: 'fever', ic: '🌡', t: 'High fever',
    lead: 'Dengue is the biggest infectious risk to travellers in this region, and it is seasonal rather than rare.',
    now: [
      'Any fever above 38 °C that lasts more than 24 hours needs a doctor and a blood test. Dengue, malaria and typhoid all start looking like flu.',
      'Take paracetamol for fever and pain — nothing else.',
      'Drink steadily. Dehydration is what turns a manageable dengue into an admission.',
    ],
    then: [
      'Warning signs that mean hospital now, not tomorrow: severe stomach pain, repeated vomiting, bleeding gums or nose, black stools, breathlessness, or a sudden drop in temperature with cold clammy skin.',
      'Malaria is a risk in forested border areas rather than the cities. Tell the doctor exactly where you have been in the last month.',
    ],
    avoid: [
      'Do not take ibuprofen, aspirin or any other anti-inflammatory until dengue has been ruled out — they increase bleeding risk.',
      'Do not buy antimalarials or antibiotics from a small shop; counterfeit medicine is a genuine problem outside established pharmacies.',
    ],
  },
  {
    id: 'gut', ic: '🚻', t: 'Severe stomach illness',
    lead: 'Common, usually self-limiting, and occasionally the thing that puts a traveller on a drip.',
    now: [
      'Rehydrate with oral rehydration salts, sold in every pharmacy in the region. Water alone does not replace what is being lost.',
      'Small sips, often, are better tolerated than a glass at a time.',
    ],
    then: [
      'See a doctor if there is blood in the stool, a fever above 38.5 °C, vomiting that stops you keeping fluids down, or symptoms lasting more than three days.',
      'A young child, an older traveller or anyone pregnant should be seen much sooner than that.',
    ],
    avoid: [
      'Do not take a stop-the-symptoms antidiarrhoeal if there is blood or a high fever — it can make the underlying infection worse.',
    ],
  },
  {
    id: 'hazard', ic: '⛈', t: 'Flood, storm, earthquake or tsunami',
    lead: 'The regional hazards are seasonal flooding, tropical storms, and — on the Andaman coast — tsunami.',
    now: [
      'Feel a strong earthquake on the coast, or see the sea suddenly draw back? Move inland and uphill immediately and do not wait for an official warning. On the Andaman coast, follow the blue tsunami evacuation signs.',
      'Flooding: never walk or drive through moving water. Thirty centimetres will float a car and knee-deep flow will take an adult off their feet. Flash floods in the northern gorges rise in minutes.',
      'Storm: get indoors and away from windows, trees and hoardings. Boat services stop for a reason — do not press a captain to sail.',
    ],
    then: [
      'Assume the water is contaminated after any flood, and treat every cut and graze that touched it.',
      'Register with your embassy’s travel service if one is available, so you can be contacted during a large event.',
    ],
    avoid: [
      'Do not rely on mobile coverage during a major event; agree a meeting point with anyone you are travelling with in advance.',
    ],
  },
  {
    id: 'fire', ic: '🔥', t: 'Fire in a hotel or hostel',
    lead: 'Older guesthouses across the region often have one staircase, barred windows and no working alarm.',
    now: [
      'Get out and stay out. Do not stop for luggage.',
      'Stay low under smoke, and feel a door with the back of your hand before opening it.',
      'If you cannot get out, close the door, block the gap with wet cloth, get to a window and make yourself visible.',
    ],
    then: [
      'Account for everyone you are travelling with at a point away from the building.',
    ],
    avoid: [
      'Do not use a lift. Check where the stairs are on the night you arrive — it takes ten seconds and it is the whole of fire safety in a strange building.',
    ],
  },
  {
    id: 'missing', ic: '🔍', t: 'Someone you are travelling with is missing',
    now: [
      'Report it to the police immediately. There is no waiting period, and the first hours matter most.',
      'Contact your embassy at the same time — they can press a case that a local station may otherwise treat as routine.',
      'Check the hospitals in the area as well as the police; someone brought in unconscious and without documents may not be identified for a while.',
    ],
    then: [
      'Gather a recent photograph, what they were wearing, their phone number and any location-sharing they had switched on.',
      'Ask their accommodation, their last known driver or boat operator, and the last place they were seen. Local businesses often know more than a station does.',
    ],
    avoid: [
      'Do not delay to "give it another day". The advice from every consular service is to report early and stand it down later if it was nothing.',
    ],
  },
  {
    id: 'mind', ic: '🫂', t: 'A mental health crisis',
    lead: 'Long trips, isolation, heat, drink and sleeplessness make this more common on the road than at home.',
    now: [
      'If someone is at immediate risk of harming themselves, do not leave them alone, and call the national emergency number.',
      'Get to a hospital emergency department; the larger private hospitals in Bangkok, Ho Chi Minh City, Hanoi and Phnom Penh have psychiatric services, most public provincial hospitals do not.',
      'Remove the immediate means of harm if you can do so safely.',
    ],
    then: [
      'Your travel insurer’s assistance line can arrange a psychiatric referral and, where needed, a medically escorted flight home.',
      'Your embassy can contact family and help with practical arrangements.',
      'Local mental health services are limited in Cambodia and Laos in particular; getting to a major city, or home, is often the realistic plan.',
    ],
    avoid: [
      'Do not treat "they have been drinking" as an explanation that makes it less urgent.',
    ],
  },
  {
    id: 'death', ic: '🕯', t: 'If a traveller dies',
    lead: 'The hardest page here, written down so nobody has to work it out while grieving.',
    now: [
      'Contact your embassy or consulate first. Repatriation, local registration of the death and the paperwork all run through them, and they will explain the order of it.',
      'Contact the travel insurer. Repatriation of remains is expensive and is the single most valuable thing a policy covers.',
    ],
    then: [
      'A local death certificate is issued by the authorities where the death occurred; the embassy can advise on getting it recognised at home.',
      'Do not agree to a cremation or a burial before speaking to the embassy and the family — in some countries it cannot be undone or reversed.',
    ],
    avoid: [],
  },
];

// What an embassy will and will not do. Travellers routinely expect the wrong things from
// consular services, which wastes the hours when the embassy could genuinely have helped.

export const EMBASSY = {
  can: [
    'Issue an emergency travel document or a replacement passport.',
    'Contact your family and help you get money sent to you.',
    'Visit you and monitor your treatment if you are arrested or detained.',
    'Give you a list of local lawyers, translators and doctors.',
    'Help in a death, a serious accident, or a large-scale emergency.',
    'Give you the current official travel and health advice for where you are.',
  ],
  cannot: [
    'Get you out of prison, or interfere in a local investigation or court case.',
    'Pay your medical bills, your legal costs or your fare home.',
    'Investigate a crime, or make the police act faster than local law allows.',
    'Give you legal or medical advice of its own.',
  ],
  note: 'Many countries have an embassy in Bangkok, Hanoi and Phnom Penh but none at all in Vientiane — in Laos your nearest consular help is often in Bangkok. Find yours, and save the address and the emergency line, before you need it.',
};
