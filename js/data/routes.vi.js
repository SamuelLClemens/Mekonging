// Vietnam intercity + cross-border transport reference ("best way to the next place").
// Guidance only. Prices are RANGES and fluctuate by season, demand, and operator.
// Always verify fares, schedules, and visa rules at time of travel.
export const ROUTES_VI = [
  {
    id: "vi-hanoi-danang", from: "Hanoi", to: "Da Nang", country: "vi", verified: "2026-06",
    options: [
      { mode: "Sleeper train", durationHrs: [15, 17], price: { low: 600000, high: 2200000, currency: "VND" },
        freq: "several daily (SE/TN services)", comfort: "4-berth soft sleeper is the sweet spot; the SE19 departs Hanoi in the evening and reaches the Hai Van coast around sunrise.",
        bookVia: "Vietnam Railways (dsvn.vn) or a reseller such as 12Go or Baolau", recommended: true,
        notes: "The Reunification Express hugs the coast; book sleeper berths roughly a month ahead in peak season. Hard seat is cheapest but rough overnight." },
      { mode: "Flight", durationHrs: [1, 2], price: { low: 700000, high: 2500000, currency: "VND" },
        freq: "many daily", comfort: "Fastest door-to-door; budget carriers (VietJet, Bamboo) plus Vietnam Airlines. Add airport transfer time.",
        bookVia: "airline sites or an aggregator", recommended: false,
        notes: "Often similar in price to a sleeper berth if booked early, but you miss the Hai Van Pass scenery." },
      { mode: "Sleeper bus", durationHrs: [16, 18], price: { low: 400000, high: 700000, currency: "VND" },
        freq: "daily", comfort: "Cheapest; reclining berth coaches. Long and tiring versus the train.",
        bookVia: "12Go or the bus operator", recommended: false, notes: "Acceptable on a tight budget; the train is more comfortable for the same overnight." }
    ]
  },
  {
    id: "vi-danang-hoian", from: "Da Nang", to: "Hoi An", country: "vi", verified: "2026-06",
    options: [
      { mode: "Grab car / taxi", durationHrs: [0.5, 1], price: { low: 250000, high: 450000, currency: "VND" },
        freq: "on demand", comfort: "Door-to-door, air-conditioned, metered fare shown up front in the Grab app. Easiest option for the short 30 km hop.",
        bookVia: "Grab app", recommended: true,
        notes: "Grab is widely used across Vietnam; agreeing the in-app price avoids haggling. A private transfer car costs a little more." },
      { mode: "Local bus (Route 1)", durationHrs: [1, 1.5], price: { low: 20000, high: 50000, currency: "VND" },
        freq: "frequent daytime", comfort: "Very cheap public yellow bus; slow, crowded, and conductors sometimes overcharge foreigners.",
        bookVia: "pay the conductor on board", recommended: false, notes: "Confirm the fare before boarding to avoid being overcharged." },
      { mode: "Private transfer / shuttle", durationHrs: [0.5, 1], price: { low: 300000, high: 600000, currency: "VND" },
        freq: "on demand", comfort: "Pre-booked car or hotel shuttle; good with luggage or groups.",
        bookVia: "your hotel or 12Go", recommended: false, notes: "Convenient but usually pricier than a Grab for one or two people." }
    ]
  },
  {
    id: "vi-hanoi-hcmc", from: "Hanoi", to: "Ho Chi Minh City", country: "vi", verified: "2026-06",
    options: [
      { mode: "Flight", durationHrs: [2, 2.5], price: { low: 900000, high: 3500000, currency: "VND" },
        freq: "very frequent (one of Asia's busiest air corridors)", comfort: "Only sensible fast option for the ~1700 km length of the country.",
        bookVia: "airline sites (Vietnam Airlines, VietJet, Bamboo) or an aggregator", recommended: true,
        notes: "Book early for the lowest fares; the route is heavily served so last-minute seats exist but cost more." },
      { mode: "Sleeper train", durationHrs: [30, 35], price: { low: 1000000, high: 3500000, currency: "VND" },
        freq: "several daily", comfort: "A scenic two-night journey on the Reunification Express; an experience in itself rather than a quick transfer.",
        bookVia: "Vietnam Railways (dsvn.vn) or 12Go / Baolau", recommended: false,
        notes: "Most travellers break the trip into coastal segments (e.g. via Da Nang/Hue) rather than riding it end to end." }
    ]
  },
  {
    id: "vi-hcmc-hoian", from: "Ho Chi Minh City", to: "Hoi An", country: "vi", verified: "2026-06",
    options: [
      { mode: "Flight to Da Nang + Grab", durationHrs: [2.5, 4], price: { low: 800000, high: 3000000, currency: "VND" },
        freq: "many daily flights", comfort: "Fly to Da Nang (the nearest airport, ~30 km from Hoi An), then a short Grab or transfer car. Fastest overall.",
        bookVia: "airline sites or an aggregator for the flight; Grab app for the final leg", recommended: true,
        notes: "Hoi An has no airport or station of its own; Da Nang is the gateway for both flights and trains." },
      { mode: "Sleeper train to Da Nang + Grab", durationHrs: [17, 20], price: { low: 800000, high: 2500000, currency: "VND" },
        freq: "several daily", comfort: "Overnight coastal train to Da Nang, then a Grab to Hoi An; slower but scenic and saves a hotel night.",
        bookVia: "Vietnam Railways (dsvn.vn) or 12Go for the train; Grab app for the transfer", recommended: false,
        notes: "Good for travellers who want the Reunification Express scenery without an internal flight." }
    ]
  },
  {
    id: "vi-cross-hcmc-phnompenh", from: "Ho Chi Minh City", to: "Phnom Penh (Cambodia)", country: "vi", verified: "2026-06",
    crossBorder: true, border: "Moc Bai (Vietnam) - Bavet (Cambodia)",
    visa: { note: "Most nationalities need a Cambodian visa: an e-Visa via the official Cambodian government portal, or a visa-on-arrival at Bavet (carry USD cash and a passport photo). Some ASEAN passport holders are exempt. Vietnam re-entry needs a valid Vietnamese visa or e-visa. Verify current rules with the Cambodian embassy and Vietnam Immigration before travel." },
    scamWarnings: [
      "At Bavet, agents/bus staff may demand an extra 'stamping' or 'processing' fee on top of the official visa cost; the visa-on-arrival fee is fixed and you should ask for a receipt.",
      "Touts may insist your bus will leave without you so you pay them to 'speed up' immigration; the bus waits for all passengers.",
      "Avoid unofficial 'helpers' offering to handle your passport; complete the crossing yourself at the official counter."
    ],
    options: [
      { mode: "Direct cross-border bus", durationHrs: [6, 8], price: { low: 375000, high: 1000000, currency: "VND" },
        freq: "several daily", comfort: "Air-conditioned coaches (Giant Ibis, Mekong Express, Virak Buntham); staff help shepherd passengers through the Moc Bai-Bavet formalities. The crossing itself adds 30-60 minutes.",
        bookVia: "12Go, the operator's website, or a guesthouse", recommended: true,
        notes: "Border open daily (Vietnam side roughly 07:00-22:00). Giant Ibis is a reliable premium pick; budget lines are cheaper but slower." },
      { mode: "Flight", durationHrs: [1, 1.5], price: { low: 1500000, high: 4000000, currency: "VND" },
        freq: "daily", comfort: "Tan Son Nhat to Phnom Penh; fastest but you still arrange the Cambodian visa (e-Visa or visa-on-arrival at the airport).",
        bookVia: "airline sites or an aggregator", recommended: false,
        notes: "Worth it if time matters; otherwise the bus is far cheaper and the overland scenery is part of the trip." }
    ]
  }
];
