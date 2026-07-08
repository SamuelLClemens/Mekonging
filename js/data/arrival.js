// Airport → town transport for the region's main arrival points. The cheapest reliable
// option first, then convenient ones, each with a rough fare (guidance — fares drift) and
// the scam to sidestep. Keyed by the app's city slug so the arrival assistant can match
// wherever the traveller lands. Fares are local currency unless noted.
export const ARRIVAL = {
  bangkok: {
    airport: 'Suvarnabhumi (BKK) & Don Muang (DMK)',
    options: [
      { mode: '🚆 Airport Rail Link (BKK)', detail: 'Suvarnabhumi basement to Phaya Thai (BTS) / Makkasan (MRT), ~30 min into the city.', fare: '~15–45 THB', tip: 'Cheapest and beats rush-hour traffic; then hop on the BTS/MRT.' },
      { mode: '🚕 Public taxi queue', detail: 'Both airports: take a ticket at the official taxi rank on the arrivals level below.', fare: 'Meter + 50 THB airport surcharge + tolls (~250–400 THB to the centre)', tip: 'Insist on the meter. From Don Muang the A1/A2 bus runs to BTS Mo Chit for ~30 THB.' },
      { mode: '📱 Grab / Bolt', detail: 'Fixed up-front price; meet your driver at the ride-hail pickup point.', fare: '~300–500 THB', tip: 'Handy at night or with luggage/kids.' },
    ],
    scam: 'Ignore touts inside the terminal offering a “fixed” 800–1,000 THB ride — walk down to the public taxi queue or the train.',
  },
  'chiang-mai': {
    airport: 'Chiang Mai (CNX) — ~4 km from the Old City',
    options: [
      { mode: '🚕 Airport taxi desk', detail: 'Fixed-fare desk in arrivals; short hop into town.', fare: '~150–200 THB', tip: 'Very close — do not overpay for the distance.' },
      { mode: '📱 Grab / Bolt', detail: 'Often cheaper than the desk; pick up outside.', fare: '~120–180 THB', tip: 'Good value into Nimman or the Old City.' },
    ],
    scam: 'Songthaew (red truck) drivers may quote high — agree the price first or use an app.',
  },
  phuket: {
    airport: 'Phuket (HKT) — 30–45 km from the main beaches',
    options: [
      { mode: '🚌 Airport bus', detail: 'Airport Bus Express / smart bus toward Phuket Town and Patong.', fare: '~100–170 THB', tip: 'Cheapest; slower, but avoids the taxi mark-up.' },
      { mode: '📱 Grab', detail: 'Fixed price to your resort; meet at the ride-hail point.', fare: '~500–800 THB to the west beaches', tip: 'Usually far cheaper than the airport taxi counter.' },
      { mode: '🚕 Metered/airport taxi', detail: 'Official counter in arrivals.', fare: '~600–1,000 THB', tip: 'Confirm it is metered or a fixed official fare, not a tout.' },
    ],
    scam: 'Skip the minibus/limousine touts quoting one price then adding “extras”; use the official counter or Grab.',
  },
  krabi: {
    airport: 'Krabi (KBV) — ~15 km from Krabi Town, ~30 km to Ao Nang',
    options: [
      { mode: '🚐 Shared van / bus', detail: 'Airport shuttle vans to Krabi Town and Ao Nang.', fare: '~90–200 THB', tip: 'The budget option; waits to fill.' },
      { mode: '🚕 Airport taxi', detail: 'Fixed-fare counter in arrivals.', fare: '~350–600 THB to Ao Nang', tip: 'Grab coverage is patchy here — the counter is reliable.' },
    ],
    scam: 'Agree the fare and destination before loading bags into any van.',
  },
  'koh-samui': {
    airport: 'Koh Samui (USM) — small private airport',
    options: [
      { mode: '🚕 Fixed-fare taxi', detail: 'The island runs on agreed fares, not meters.', fare: '~300–600 THB depending on beach', tip: 'Ask your hotel for the going rate first, then agree it with the driver.' },
      { mode: '🏨 Hotel transfer', detail: 'Many stays include or sell a pickup.', fare: 'Varies', tip: 'Often the easiest with luggage; confirm when booking.' },
    ],
    scam: 'There are no metered taxis on Samui — always agree the price before you get in.',
  },
  hanoi: {
    airport: 'Hanoi — Noi Bai (HAN), ~30 km north',
    options: [
      { mode: '🚌 Bus 86', detail: 'Express bus to the Old Quarter / Hanoi station.', fare: '~45,000 VND', tip: 'Cheapest and reliable; runs roughly every 25 min.' },
      { mode: '📱 Grab / Be', detail: 'Fixed app price; use the designated pickup area.', fare: '~250,000–350,000 VND', tip: 'Removes the fare argument entirely.' },
      { mode: '🚕 Metered taxi', detail: 'Stick to Mai Linh or Taxi Group from the rank.', fare: '~350,000–450,000 VND', tip: 'Agree it is on the meter.' },
    ],
    scam: 'Avoid unmarked “taxis” touting inside arrivals; overcharging and rigged meters are common — use bus 86 or Grab.',
  },
  hcmc: {
    airport: 'Ho Chi Minh City — Tan Son Nhat (SGN), ~7 km',
    options: [
      { mode: '🚌 Bus 109 / 152', detail: 'Air-conditioned bus to the city centre / Ben Thanh.', fare: '~8,000–20,000 VND', tip: 'Very cheap for a short hop.' },
      { mode: '📱 Grab / Be', detail: 'Fixed price; walk to the ride-hail zone (often the multi-storey car park).', fare: '~90,000–160,000 VND', tip: 'Cheapest door-to-door and no haggling.' },
      { mode: '🚕 Vinasun / Mai Linh', detail: 'Reputable metered taxi brands from the rank.', fare: '~120,000–200,000 VND', tip: 'Use these two names to avoid clones.' },
    ],
    scam: 'Beware look-alike taxi liveries and “broken meter” lines — use Grab or a Vinasun/Mai Linh from the official rank.',
  },
  'da-nang': {
    airport: 'Da Nang (DAD) — ~3 km, almost in town',
    options: [
      { mode: '📱 Grab', detail: 'Cheapest and easiest for the short ride into the city or to My Khe beach.', fare: '~60,000–120,000 VND', tip: 'To Hoi An expect ~350,000–450,000 VND by car.' },
      { mode: '🚕 Metered taxi', detail: 'Mai Linh / Vinasun from the rank.', fare: '~80,000–150,000 VND', tip: 'Confirm the meter is running.' },
    ],
    scam: 'For Hoi An, agree the full car price up front — some drivers renegotiate on arrival.',
  },
  'siem-reap': {
    airport: 'Siem Reap–Angkor (SAI) — ~40 km from town',
    options: [
      { mode: '🛺 Airport tuk-tuk / taxi', detail: 'Official transport desk in arrivals; the new airport is far out.', fare: 'Tuk-tuk ~US$15–20, car ~US$25–30', tip: 'Factor the distance — this leg is longer than travellers expect.' },
      { mode: '📱 Grab / PassApp', detail: 'App cars/tuk-tuks; coverage is decent.', fare: '~US$15–25', tip: 'Fixes the price and avoids negotiation.' },
    ],
    scam: 'Confirm whether a quoted price is per person or per vehicle before you agree.',
  },
  'phnom-penh': {
    airport: 'Phnom Penh (PNH)',
    options: [
      { mode: '📱 PassApp / Grab', detail: 'App tuk-tuks (rickshaw) and cars — the local default.', fare: 'Tuk-tuk ~US$3–7, car ~US$9–13', tip: 'Cheapest and no haggling; metered taxis are rare.' },
      { mode: '🛺 Airport tuk-tuk', detail: 'From the rank if you prefer to walk out.', fare: '~US$9–12', tip: 'Agree the fare first.' },
    ],
    scam: 'Agree the fare before setting off; keep small, clean US dollar notes for change.',
  },
  vientiane: {
    airport: 'Vientiane — Wattay (VTE), ~4 km',
    options: [
      { mode: '🚕 Airport taxi', detail: 'Fixed-price coupon desk just outside arrivals.', fare: '~57,000–70,000 LAK', tip: 'Buy the coupon at the desk rather than negotiating outside.' },
      { mode: '📱 Loca (app)', detail: 'Laos’s local ride-hail app, where available.', fare: 'Similar or a little less', tip: 'Install it before you land if you can.' },
    ],
    scam: 'Use the official coupon desk; freelance drivers outside quote more.',
  },
  'luang-prabang': {
    airport: 'Luang Prabang (LPQ) — ~4 km from the peninsula',
    options: [
      { mode: '🚕 Airport minivan / taxi', detail: 'Fixed-fare desk in arrivals; short ride into town.', fare: '~50,000 LAK', tip: 'Shared vans are cheapest per person.' },
    ],
    scam: 'Fares are fixed at the desk — pay there, not to a tout.',
  },
};

export function getArrival(citySlug) { return ARRIVAL[citySlug] || null; }
