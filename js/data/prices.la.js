export const PRICES_LA = {
  country: "la", currency: "LAK",
  disclaimer: "Guidance only. Prices vary by season, area, and bargaining. Verify locally. USD reference uses roughly 1 USD = 21,600-22,000 LAK as of mid-2026.",
  verified: "2026-06",
  sources: [
    { org: "Tourism Laos (Lao National Tourism Administration)", url: "https://www.tourismlaos.org" },
    { org: "Laos-China Railway / LCR tickets", url: "https://www.laostraintickets.com" },
    { org: "Unitel Laos", url: "https://www.unitel.com.la" }
  ],
  items: [
    { id: "taxi-airport-city", label: "Wattay Airport (Vientiane) to city centre", fair: { low: 60000, typical: 90000, high: 120000 }, unit: "one way, per car",
      notes: "Roughly 4 km. Official airport taxi desk uses fixed fares; pay inside, not to touts at the kerb.",
      scamNote: "Drivers quoting a flat 200,000-300,000 LAK or pricing per person rather than per car.",
      betterOption: "Use the airport taxi counter for the posted fixed price, or pre-book a hotel pickup." },

    { id: "ride-hail-city", label: "City ride-hail / metered taxi (short hop)", fair: { low: 30000, typical: 60000, high: 110000 }, unit: "per trip in town",
      notes: "Loca and inDrive operate in Vientiane and Luang Prabang. Metered street taxis are scarce; most cars are app- or negotiation-based.",
      scamNote: "Unmetered cars naming 150,000+ LAK for a 2 km ride, or claiming the app is broken to negotiate cash.",
      betterOption: "Book through the Loca or inDrive app so the fare is fixed before you board." },

    { id: "tuktuk-jumbo", label: "Tuk-tuk / jumbo (in-town ride)", fair: { low: 20000, typical: 40000, high: 80000 }, unit: "per ride, agree first",
      notes: "Share jumbos run fixed routes; private hire is negotiable. Always settle the total price before departing.",
      scamNote: "Tourist-pricing a 1-2 km hop at 100,000+ LAK, or quoting per person when you expected a per-vehicle fare.",
      betterOption: "Agree the full price up front, or compare against a Loca/inDrive quote on your phone." },

    { id: "water-bottle", label: "Bottled water (1.5 L)", fair: { low: 5000, typical: 8000, high: 15000 }, unit: "per bottle, shop price",
      notes: "Minimart and roadside-shop price. Hotels, attractions, and the slow boat charge a premium.",
      scamNote: "Boat or waterfall kiosks asking 25,000-40,000 LAK for a single bottle.",
      betterOption: "Buy from a minimart or market and carry a refillable bottle." },

    { id: "street-meal", label: "Street / market meal (noodle soup, baguette, foe)", fair: { low: 15000, typical: 30000, high: 55000 }, unit: "per dish",
      notes: "Khao piak, foe, and filled baguettes at markets and street stalls. Night-market buffet plates sit at the low end.",
      scamNote: "No posted price then charging tourists double; vendors quoting in USD at a poor rate.",
      betterOption: "Eat where prices are posted or where locals queue; pay in kip." },

    { id: "restaurant-meal", label: "Sit-down restaurant main course", fair: { low: 40000, typical: 80000, high: 160000 }, unit: "per main dish",
      notes: "Mid-range tourist restaurant in Vientiane or Luang Prabang. Riverside and hotel venues run higher.",
      scamNote: "Bills padded with items not ordered, or a service charge plus separately solicited tip.",
      betterOption: "Check the printed menu prices, confirm any service charge, and review the itemised bill." },

    { id: "local-beer", label: "Local beer (Beerlao, 640 ml large bottle)", fair: { low: 12000, typical: 20000, high: 40000 }, unit: "per large bottle",
      notes: "Shop price for Beerlao Lager. Bars and riverside venues charge 30,000-60,000 LAK.",
      scamNote: "Beachside or boat vendors asking 50,000+ LAK per bottle, or charging chilled-storage surcharges.",
      betterOption: "Buy from a minimart for sundowners; reserve bar prices for the atmosphere." },

    { id: "sim-data", label: "Tourist SIM with data (Unitel)", fair: { low: 50000, typical: 120000, high: 250000 }, unit: "SIM plus a tourist data bundle",
      notes: "A blank Unitel SIM is around 10,000 LAK; the cost is the data bundle. Unitel has the broadest coverage. Bring your passport to register.",
      scamNote: "Airport or hotel desks reselling a registered SIM for 300,000-500,000 LAK with little credit.",
      betterOption: "Buy at an official Unitel shop, or an eSIM before arrival, and confirm the bundle is loaded before paying." },

    { id: "kuang-si-falls", label: "Kuang Si Falls entry (Luang Prabang)", fair: { low: 50000, typical: 60000, high: 70000 }, unit: "per foreign visitor",
      notes: "2026 foreign-visitor ticket is about 60,000 LAK; includes the in-park electric cart and the bear-rescue sanctuary. Motorbike parking around 5,000 LAK.",
      scamNote: "Tour sellers bundling a vastly inflated entry fee into a day trip, or charging extra for the included shuttle cart.",
      betterOption: "Pay the posted entry fee at the gate; arrange shared transport rather than an overpriced private package." },

    { id: "train-vte-lpb", label: "High-speed train Vientiane to Luang Prabang (Laos-China Railway)", fair: { low: 340000, typical: 360000, high: 400000 }, unit: "second class, one way",
      notes: "About 2 hours. Second class about 360,000 LAK; first class about 520,000–570,000 LAK (fares rose ~9% on 1 April 2026). Official sales open about 3 days ahead; an agent or app fee of around 20,000 LAK applies off-station.",
      scamNote: "Agents reselling seats at double face value, or claiming the only seats left are first/business class.",
      betterOption: "Buy at the station ticket office or via the official LCR channel; book early as seats sell out." },

    { id: "slowboat-huayxai-lpb", label: "Mekong slow boat Huay Xai to Luang Prabang", fair: { low: 220000, typical: 400000, high: 550000 }, unit: "per person, 2-day trip seat only",
      notes: "Two days with an overnight stop in Pakbeng. Seat only; food, drinks, Pakbeng lodging, and the final pier transfer are extra.",
      scamNote: "Guesthouse middlemen adding heavy commission, or upselling a cramped speedboat as the only option.",
      betterOption: "Buy directly at the Huay Xai boat-ticket office; budget separately for Pakbeng accommodation and meals." },

    { id: "scooter-rental", label: "Motorbike / scooter rental (per day)", fair: { low: 60000, typical: 110000, high: 200000 }, unit: "per day, semi-automatic",
      notes: "Semi-auto 110 cc in Vientiane or the south. Confirm fuel level, brakes, and existing damage; helmet should be included.",
      scamNote: "Demanding your passport as deposit, then alleging pre-existing scratches to charge damage fees.",
      betterOption: "Leave a cash deposit instead of your passport, photograph the bike before riding, and keep a signed agreement." }
  ]
};
