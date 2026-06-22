// "Best way to the next place" from Bangkok (slice). Each route lists options with
// a guidance price range, journey time, frequency, comfort note and how to book.
// Cross-border entries flag the border and visa note. Confirm times/prices locally.
export const ROUTES_TH = [
  {
    id: 'th-bkk-cnx', from: 'Bangkok', to: 'Chiang Mai', country: 'th', verified: '2026-06',
    options: [
      { mode: 'Sleeper train', durationHrs: [12, 14], price: { low: 600, high: 1400, currency: 'THB' },
        freq: 'several daily', comfort: '2nd-class A/C berth is the sweet spot; book ahead in high season.',
        bookVia: 'State Railway of Thailand or 12Go', recommended: true,
        notes: 'Atmospheric overnight option that saves a night’s accommodation.' },
      { mode: 'Flight', durationHrs: [1.2, 1.5], price: { low: 900, high: 2500, currency: 'THB' },
        freq: 'very frequent', comfort: 'Fastest; budget carriers from DMK and BKK.',
        bookVia: 'low-cost carriers', recommended: false,
        notes: 'Cheapest if booked early; add airport transfer time.' },
      { mode: 'VIP bus', durationHrs: [9, 11], price: { low: 600, high: 900, currency: 'THB' },
        freq: 'daily, mostly overnight', comfort: 'Reclining VIP seats from Mo Chit terminal.',
        bookVia: '12Go or the bus terminal', recommended: false,
        notes: 'Cheaper than the train but less comfortable for sleeping.' },
    ],
  },
  {
    id: 'th-bkk-hkt', from: 'Bangkok', to: 'Phuket', country: 'th', verified: '2026-06',
    options: [
      { mode: 'Flight', durationHrs: [1.4, 1.6], price: { low: 900, high: 2800, currency: 'THB' },
        freq: 'very frequent', comfort: 'By far the most sensible option.',
        bookVia: 'low-cost carriers', recommended: true,
        notes: 'Overland is 12+ hours by bus; fly unless you want stops along the way.' },
      { mode: 'Bus + ferry', durationHrs: [12, 14], price: { low: 700, high: 1200, currency: 'THB' },
        freq: 'daily overnight', comfort: 'Long; for budget travellers chaining southern stops.',
        bookVia: '12Go', recommended: false, notes: 'Consider breaking the trip in Surat Thani for the islands.' },
    ],
  },
  {
    id: 'th-bkk-rep', from: 'Bangkok', to: 'Siem Reap (Cambodia)', country: 'th', verified: '2026-06',
    crossBorder: true, border: 'Aranyaprathet–Poipet',
    visa: { note: 'Most nationalities get a Cambodian e-Visa or visa on arrival (~30 USD). Get the e-Visa in advance to skip touts. Verify your nationality’s rules with the Cambodian embassy.' },
    scamWarnings: [
      'Ignore "Cambodian consulate" offices before the border that charge extra for visas — use the official e-Visa site or the border counter.',
      'Decline overpriced "VIP" border transport; the government bus from Poipet to Siem Reap is cheap.',
    ],
    options: [
      { mode: 'Flight', durationHrs: [1, 1.3], price: { low: 1500, high: 4000, currency: 'THB' },
        freq: 'daily', comfort: 'Fastest and avoids the border hassle entirely.',
        bookVia: 'regional carriers', recommended: true, notes: 'Worth it to skip the Poipet crossing.' },
      { mode: 'Bus (cross-border)', durationHrs: [8, 10], price: { low: 700, high: 1500, currency: 'THB' },
        freq: 'daily', comfort: 'Direct tourist buses handle the border stop.',
        bookVia: '12Go', recommended: false, notes: 'Budget option; expect queues and touts at Poipet.' },
    ],
  },
  {
    id: 'th-bkk-vte', from: 'Bangkok', to: 'Vientiane (Laos)', country: 'th', verified: '2026-06',
    crossBorder: true, border: 'Nong Khai–Thanaleng (Friendship Bridge)',
    visa: { note: 'Laos offers visa on arrival for many nationalities (~30–45 USD, bring USD cash and a passport photo) or an e-Visa. Verify your nationality’s rules.' },
    scamWarnings: ['At the bridge, use the official shuttle bus across; ignore private "fixers".'],
    options: [
      { mode: 'Sleeper train to Nong Khai + crossing', durationHrs: [11, 13], price: { low: 600, high: 1300, currency: 'THB' },
        freq: 'daily overnight', comfort: 'Train to Nong Khai, then a short shuttle over the Friendship Bridge.',
        bookVia: 'State Railway of Thailand', recommended: true,
        notes: 'A through train to Vientiane (Kham Savath) also runs; check current schedules.' },
      { mode: 'Flight', durationHrs: [1.1, 1.3], price: { low: 1800, high: 4500, currency: 'THB' },
        freq: 'daily', comfort: 'Direct to Vientiane; quickest.',
        bookVia: 'regional carriers', recommended: false, notes: 'Pricier but saves a full day.' },
    ],
  },
];
