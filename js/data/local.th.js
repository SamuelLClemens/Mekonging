// Thailand — LOCAL NOTICEBOARDS: per-city local knowledge that guidebooks skim.
// Where locals actually shop for fruit/veg, market schedules, family supplies
// (nappies/formula), the cheapest genuinely-local food and street-food areas.
// All prices/hours are GUIDANCE — markets shift; verify locally. Each board cites
// sources. Keyed by slug; merged in regions.js (LOCAL_BOARDS).

export const LOCAL_TH = [
  {
    slug: "bangkok", city: "Bangkok", country: "th", verified: "2026-07",
    intro: "Skip the tourist food courts: Bangkok's real bargains are its wet markets, its 24-hour flower market and the street-food lanes locals queue at.",
    markets: [
      { name: "Khlong Toei Market", when: "Daily, best 05:00–10:00", where: "Rama IV Rd, Khlong Toei", what: "Bangkok's biggest fresh market — fruit, veg, meat, fish at true local prices", tip: "Go early, watch your step, bring small notes." },
      { name: "Or Tor Kor Market", when: "Daily ~08:00–18:00", where: "Next to Chatuchak (MRT Kamphaeng Phet)", what: "Premium produce and prepared food — pricier but spotless; the mango sticky rice benchmark", tip: "Pair with Chatuchak on weekends." },
      { name: "Pak Khlong Talat (flower market)", when: "24h, liveliest after midnight–dawn", where: "Chak Phet Rd, by Memorial Bridge", what: "Wholesale flowers, garlands, some produce", tip: "Magical at 04:00; daytime is calmer." },
    ],
    shopLocal: [
      { what: "Everyday fruit & veg", where: "Any neighbourhood 'talat sod' (fresh market) or morning street stalls", tip: "Prices are per kilo and usually marked; no need to haggle hard." },
      { what: "Pantry staples & snacks", where: "Big C / Lotus's supercentres; 7-Eleven for top-ups", tip: "Supercentres beat convenience stores by 20–40% on most staples." },
    ],
    family: [
      { item: "Nappies / diapers", where: "Big C, Lotus's or Makro supercentres (house brands + MamyPoko)", price: "Large packs run far cheaper per piece than 7-Eleven singles", tip: "Pharmacies (Boots, Watsons) stock them too but cost more; supermarkets deliver via Grab." },
      { item: "Baby formula & food", where: "Big C / Lotus's baby aisle; Villa Market for imported brands", price: "Local brands are well regulated and much cheaper", tip: "Bring your brand from home if your child is fussy — imported tins are pricey." },
    ],
    cheapEats: [
      { name: "Khao gaeng (curry-rice) shops", dish: "Rice + 1–2 curries", price: "40–70 THB", where: "Everywhere at lunch; look for steel trays", tip: "Point at what looks good; busiest = freshest." },
      { name: "Street noodle carts", dish: "Kuay teow (noodle soup)", price: "40–60 THB", where: "Any soi at lunch/dinner", tip: "Say 'phet nit noi' for mild spice." },
    ],
    streetFood: [
      { name: "Yaowarat (Chinatown) evening stalls", dish: "Seafood, kuay jab, chestnuts, toasted buns", price: "50–200 THB", when: "~18:00–24:00, closed some Mondays", where: "Yaowarat Rd", tip: "Queues move fast — join the longest one." },
      { name: "Wang Lang Market", dish: "Southern curries, grilled things, desserts", price: "30–80 THB", when: "Daily ~08:00–18:00", where: "Opposite Siriraj Hospital, Thonburi side", tip: "Locals' lunch spot — go before 13:00." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "Bangkok Metropolitan Administration", url: "https://www.bangkok.go.th" }],
  },
  {
    slug: "chiang-mai", city: "Chiang Mai", country: "th", verified: "2026-07",
    intro: "Chiang Mai eats best at its markets: dawn produce at Muang Mai, khao soi at lunch, and the gate markets after dark.",
    markets: [
      { name: "Muang Mai Market", when: "Daily, best 05:00–11:00", where: "Riverside, north of the Old City", what: "The city's wholesale fruit/veg hub — mangoes and longan by the kilo at local prices", tip: "Buy fruit here, not on Nimman." },
      { name: "Warorot Market (Kad Luang)", when: "Daily ~05:00–18:00", where: "Chang Moi, near the river", what: "Northern specialities: sai ua (herb sausage), kaep moo (pork crackling), dried chillies", tip: "Basement + street stalls are the cheap part." },
      { name: "Chiang Mai Gate night market", when: "Daily ~17:00–24:00", where: "South moat gate", what: "Locals' dinner stalls — khao kha moo, som tam, smoothies", tip: "The famous 'cowboy-hat lady' braised-pork-leg stall is here." },
    ],
    shopLocal: [
      { what: "Fruit & veg", where: "Muang Mai for bulk; Ton Payom Market near the university for neighbourhood prices", tip: "University-area markets are cheap and unfussy." },
      { what: "Staples", where: "Big C Extra / Lotus's; Rimping for imported (pricier)", tip: "Rimping is the expat treat stop, not the budget one." },
    ],
    family: [
      { item: "Nappies / diapers", where: "Big C Extra (Superhighway) or Lotus's; Makro for bulk", price: "Big packs ~40–60% cheaper per piece than corner shops", tip: "Most guesthouses can point you to the nearest supercentre; Grab delivers." },
    ],
    cheapEats: [
      { name: "Khao soi shops (Faham Rd cluster)", dish: "Khao soi gai", price: "50–80 THB", where: "Faham Rd, riverside", tip: "Lunch only at many classics — go before 14:00." },
      { name: "University-area canteens", dish: "Stir-fries over rice", price: "35–55 THB", where: "Around CMU / Ton Payom", tip: "Student prices, big portions." },
    ],
    streetFood: [
      { name: "Chiang Mai Gate morning stalls", dish: "Jok (rice porridge), patongko, soy milk", price: "20–50 THB", when: "~05:00–09:00", where: "South moat gate", tip: "Breakfast like a local before temple rounds." },
      { name: "Saturday/Sunday Walking Streets", dish: "Everything northern in snack form", price: "20–100 THB", when: "Sat (Wua Lai Rd) / Sun (Ratchadamnoen Rd), ~16:00–22:30", where: "Old City", tip: "Eat dinner from the stalls at the temple courtyards." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
  {
    slug: "pai", city: "Pai", country: "th", verified: "2026-07",
    intro: "Pai is small enough to learn in a day: one morning market for produce, one walking street for dinner, and everything else on a scooter.",
    markets: [
      { name: "Pai Morning Market (Talat Sod)", when: "Daily ~05:30–10:00", where: "Town centre, near the bus station", what: "Fruit, veg, warm soy milk, fried breakfast bites — where the town shops", tip: "Best strawberries in the cool season; it winds down by 10." },
      { name: "Pai Walking Street", when: "Daily ~17:00–22:30 (busiest in high season)", where: "Chai Songkhram Rd through the centre", what: "The evening food-stall run: sushi rolls to khao soi to banana rotee", tip: "Arrive hungry at 18:00; some stalls sell out by 21:00." },
      { name: "Saengthongaram Market (evening fresh market)", when: "Daily ~15:00–19:00", where: "South side of town", what: "Locals' afternoon produce + cooked-food boxes", tip: "Cheapest cooked dinner in town if you're self-catering." },
    ],
    shopLocal: [
      { what: "Fruit & veg", where: "Morning market; roadside stalls on the Mae Hong Son road for seasonal fruit", tip: "Cool-season strawberries and avocados are a Pai thing — buy from growers' stalls." },
      { what: "Staples & sundries", where: "Lotus's go fresh / sundry shops on the main road; 7-Elevens for basics", tip: "Pai has no hypermarket — stock up in Chiang Mai if you need bulk." },
    ],
    family: [
      { item: "Nappies / diapers", where: "The town's minimarts and Lotus's go fresh carry small packs", price: "Notably pricier per piece than Chiang Mai supercentres", tip: "Travelling with a baby: buy the big pack in Chiang Mai before the 762-curve road." },
    ],
    cheapEats: [
      { name: "Morning-market breakfast stalls", dish: "Jok, soy milk + patongko", price: "20–40 THB", where: "Talat Sod", tip: "Eat where the market vendors eat." },
      { name: "Local khao soi / noodle shopfronts", dish: "Khao soi, nam ngiao", price: "40–60 THB", where: "Side streets off the walking street", tip: "Lunchtime is the local sitting; evenings are tourist-priced." },
    ],
    streetFood: [
      { name: "Walking Street stalls", dish: "Banana rotee, grilled skewers, kanom jeen", price: "20–80 THB", when: "Evenings", where: "Chai Songkhram Rd", tip: "The rotee queue at the crossroads is worth it." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }],
  },
];
