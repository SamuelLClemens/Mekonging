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
      'Many nationalities receive a visa exemption for tourism (length varies and rules change).',
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
  ],
  sources: [
    { org: 'Tourism Authority of Thailand', url: 'https://www.tourismthailand.org' },
    { org: 'Thai Immigration Bureau', url: 'https://www.immigration.go.th' },
  ],
};
