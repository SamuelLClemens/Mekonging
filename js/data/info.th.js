// Thailand essentials (slice). Practical, sourced, and framed as guidance. Visa and
// safety rules change — always verify with official sources before you travel.
export const INFO_TH = {
  country: 'th', name: 'Thailand', currency: 'THB', verified: '2026-06',
  emergency: [
    { label: 'Tourist Police (English)', number: '1155' },
    { label: 'Police', number: '191' },
    { label: 'Ambulance / medical', number: '1669' },
  ],
  sections: [
    { id: 'money', title: 'Money & ATMs', body: [
      'Currency is the Thai baht (THB). Cash is king for street food, markets and tuk-tuks.',
      'ATMs charge a fixed foreign-card fee (around 220 THB) per withdrawal — take out larger amounts less often.',
      'For exchanging cash, dedicated booths such as SuperRich beat airport and hotel counters.',
      'Cards work in malls, hotels and mid-range restaurants; carry cash elsewhere.',
    ]},
    { id: 'sim', title: 'SIM & connectivity', body: [
      'AIS, True and dtac all sell cheap tourist data packs (roughly 200–600 THB for 8–15 days).',
      'A pre-bought eSIM activates before you land and skips airport queues.',
      'Coverage is excellent in cities and good on the main islands.',
    ]},
    { id: 'visa', title: 'Visa basics', body: [
      'Many nationalities (including the US, UK, EU and Australia) get a visa exemption for tourism. As of mid-2026 this is 60 days at the border, but a Cabinet-approved cut to 30 days is pending and takes effect 15 days after publication in the Royal Gazette — check your current entitlement before you fly. Once in force, the 30-day stay is extendable once by 30 days (1,900 THB) at an immigration office.',
      'Always confirm your nationality’s current entitlement and any onward-ticket or funds requirement.',
      'Overstaying carries a daily fine — track your permitted-to date.',
    ], verifyAt: { org: 'Thai Immigration Bureau', url: 'https://www.immigration.go.th' } },
    { id: 'safety', title: 'Safety', body: [
      'Thailand is generally safe for travellers; the main risks are scams and road accidents.',
      'Motorbike crashes are the leading cause of tourist injury — wear a helmet and ride only if licensed.',
      'Use Grab/Bolt at night and keep valuables secure in crowds and on night buses.',
    ]},
    { id: 'water', title: 'Water & health', body: [
      'Do not drink tap water; bottled and filtered water are cheap and everywhere.',
      'Street food is generally safe — eat where it is busy and freshly cooked.',
      'Consider travel insurance and check recommended vaccinations before you go.',
    ]},
    { id: 'etiquette', title: 'Etiquette & temples', body: [
      'Dress modestly at temples: cover shoulders and knees, and remove shoes before entering.',
      'The head is sacred and feet are lowly — do not touch heads or point feet at people or Buddha images.',
      'Treat images of the monarchy and Buddha with respect; disrespect is a serious offence.',
      'A "wai" (palms together, slight bow) is a polite greeting; tipping is appreciated but not expected — round up.',
    ]},
    { id: 'when', title: 'Best time to visit', body: [
      'November–February is cool and dry — the most comfortable season (and busiest).',
      'March–May is very hot; June–October is the green, wetter season with afternoon downpours.',
    ]},
    { id: 'driving', title: 'Renting a car / driving', body: [
      'Thailand drives on the left. Foreign drivers need an International Driving Permit together with the home licence; Thailand accepts permits issued under either the 1949 Geneva or the 1968 Vienna Convention. Police run routine checkpoints and will ask for both documents.',
      'Car hire from Avis, Budget, Hertz or a reputable local firm usually needs a driver aged 21 or over and a credit-card deposit. Roads are well paved, though northern mountain routes are winding and the Bangkok expressways are tolled.',
      'Scooter hire is cheap and everywhere, but motorbike crashes are the leading cause of tourist death and injury. A helmet is the law, and most travel-insurance policies pay out only if you hold the correct motorcycle entitlement on your licence.',
      'Keep small notes for fuel; petrol stations are plentiful. Never hand over your passport as a deposit — leave a cash deposit or a photocopy instead.',
    ], verifyAt: { org: 'Department of Land Transport', url: 'https://www.dlt.go.th' } },
    { id: 'beach-safety', title: 'Beach & jellyfish safety', body: [
      'Rip currents are the main hazard on both the Andaman and Gulf coasts. Obey the flag system — a red flag means do not enter — and take particular care on Phuket beaches during the May to October monsoon, when drownings rise.',
      'Box jellyfish, including potentially fatal Chironex species, are present in Thai waters, most often in warmer, calmer months and after heavy rain. Stings have been recorded around Koh Samui, Koh Pha-ngan, Krabi and Phuket. No reliable real-time warning system exists, so ask lifeguards and locals about recent sightings.',
      'For a sting, douse the area liberally with vinegar for at least 30 seconds (many beaches keep a bottle for this), do not rub the skin or rinse with fresh water, and call 1669 for an ambulance. Treat any breathing difficulty as a medical emergency.',
      'Lesser hazards include sea urchins, stonefish and sharp coral, so water shoes help. Use reef-safe sunscreen and reapply after swimming.',
    ], verifyAt: { org: 'Tourism Authority of Thailand', url: 'https://www.tourismthailand.org' } },
    { id: 'value', title: 'Best value: cheapest for the best', body: [
      'Eat where locals queue: a plate of rice-and-curry (khao gaeng) or a bowl of noodles from a busy street stall costs a fraction of a restaurant meal and is often better.',
      'Use the markets — fresh fruit, snacks and cooked food are cheapest at day markets and street carts, not malls or tourist strips.',
      'For city travel, metered ride apps (Grab, Bolt) and the BTS/MRT beat tuk-tuks, which quote tourist rates; rent a scooter by the day only with the correct licence.',
      'Buy a local SIM data pack in town rather than at the airport, and change money at dedicated booths such as SuperRich rather than hotels.',
      'The cheapest cold beer is from a 7-Eleven or local shop; bars mark it up heavily.',
    ] }
  ],
  sources: [
    { org: 'Tourism Authority of Thailand', url: 'https://www.tourismthailand.org' },
    { org: 'Thai Immigration Bureau', url: 'https://www.immigration.go.th' },
  ],
};
