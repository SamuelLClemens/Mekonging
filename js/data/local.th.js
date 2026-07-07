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
      { name: "Chiang Mai Gate night market", when: "Daily ~17:00–24:00", where: "South moat gate", what: "Locals' dinner stalls — khao kha moo, som tam, smoothies", tip: "Good khao kha moo here too — but the famous 'cowboy-hat lady' stall (Khao Kha Moo Chang Phueak) is at Chang Phueak Gate, the NORTH moat gate." },
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
  {
    slug: "chiang-rai", city: "Chiang Rai", country: "th", verified: "2026-07",
    intro: "Chiang Rai is a compact, easygoing northern capital where daily life still revolves around the morning fresh markets near the clock tower and the weekend walking streets. Everything below is walkable or a short songthaew ride from the city centre.",
    markets: [
      { name: "Chiang Rai Municipal Market (Kad Luang)", when: "Daily ~04:00-17:00 (freshest produce before ~09:00)", where: "City centre, off Uttarakit Rd near Wat Ming Mueang, a short walk from the clock tower", what: "The main locals' fresh market: fruit, vegetables, northern sausages (sai ua), curry pastes, cooked-food stalls and cheap breakfast noodles", tip: "Go before 09:00 with small notes, and follow the office workers to whichever cooked-food stall has the longest local queue." },
      { name: "Saturday Walking Street (Thanalai Rd)", when: "Sat ~16:00-22:00", where: "Thanalai Rd, running through the old town centre", what: "Big weekly street market: northern street food, handicrafts, hill-tribe textiles, live music and communal circle dancing near the middle", tip: "Eat your way down one side first before committing; much of the good-value food clusters near the crowded midpoint." },
      { name: "Sunday Walking Street (Sankhongnoi Rd)", when: "Sun ~16:00-21:00", where: "Sankhongnoi Rd, southwest of the centre", what: "Smaller, more residential sister of the Saturday market, with a higher share of locals and home-cooked northern dishes", tip: "This one winds down earlier than Saturday's, so arrive by 18:00 while the food stalls are still in full swing." },
      { name: "Chiang Rai Night Bazaar", when: "Daily ~18:00-23:00", where: "Off Phaholyothin Rd, next to the old bus terminal (Terminal 1) in the city centre", what: "Tourist-leaning souvenir stalls wrapped around two open-air food courts with cheap northern and Thai standards plus nightly stage shows", tip: "Treat it as a food court rather than a shopping stop: skip the souvenirs, grab a beer and share several 40-80 THB plates." },
    ],
    shopLocal: [
      { what: "Fruit and vegetables the way locals buy them: by the kilo, early morning", where: "Municipal Market (Kad Luang) and the surrounding street stalls on Uttarakit Rd", tip: "Prices are usually marked per kilo, so there is little haggling; just ask for half a kilo (khrueng kilo) if a whole one is too much." },
      { what: "Nanglae pineapple, the small honey-sweet variety Chiang Rai is known for", where: "Roadside stalls along the superhighway north of town toward Mae Fah Luang University, and in the morning markets in season", tip: "Ask for it peeled and bagged on the spot, and expect it to be noticeably sweeter and smaller than the pineapple you know." },
      { what: "Sai ua (northern herb sausage), nam prik num and sticky rice for a picnic", where: "Cooked-food section of the Municipal Market and the Saturday Walking Street", tip: "Buy sai ua by weight (100-200 g is plenty for two) and have them grill or reheat it while you wait." },
    ],
    family: [
      { item: "Nappies/diapers, formula, wipes and baby food", where: "Big C Supercenter on Phaholyothin Rd (superhighway) and Central Plaza Chiang Rai, both a short drive from the centre; Lotus's also carries the full range", price: "Nappies ~250-450 THB per mid-size pack; formula ~350-800 THB per tin depending on brand", tip: "Chiang Rai city is well stocked so there is no need to haul supplies from Bangkok, but do stock up here before heading to Mae Salong, Phu Chi Fa or other hill areas where only small shops exist." },
      { item: "Emergency top-ups: small nappy packs, UHT milk, snacks, rehydration salts", where: "Any 7-Eleven (they are on nearly every block in the city centre)", price: "Small nappy packs ~60-120 THB", tip: "7-Eleven small packs cost roughly double per nappy versus Big C, so use them only to bridge a gap." },
    ],
    cheapEats: [
      { name: "Khao Soi Phor Jai", dish: "Khao soi (curried egg noodles with chicken or beef)", price: "50-70 THB", where: "Jetyod Rd area, city centre", tip: "It is a daytime place, so go before ~15:00 and add the pickled mustard greens and lime from the tray on the table." },
      { name: "Municipal Market cooked-food stalls", dish: "Khanom jeen nam ngiao (rice noodles in pork-and-tomato broth), rice-and-curry plates", price: "30-50 THB", where: "Inside and around Kad Luang, off Uttarakit Rd", tip: "Among the cheapest genuinely local meals in town; point at what looks good and eat at the shared metal tables like everyone else." },
      { name: "Night Bazaar food courts", dish: "Northern Thai standards, grilled fish, pad thai, som tam", price: "40-80 THB per plate", where: "Chiang Rai Night Bazaar, next to the old bus terminal", tip: "Order from several different stalls to one table; with the free nightly stage show it makes a very good-value dinner-with-entertainment." },
    ],
    streetFood: [
      { name: "Saturday Walking Street grill stalls", dish: "Moo ping (grilled pork skewers) with sticky rice, sai ua by the piece", price: "10-20 THB per skewer", when: "Sat ~16:00-22:00", where: "Thanalai Rd, old town centre", tip: "Pick a stall with a long local queue and a smoky grill; skewers straight off the coals are far better than the pre-grilled pile." },
      { name: "Kad Luang nam ngiao stalls", dish: "Khanom jeen nam ngiao, the signature Chiang Rai noodle bowl", price: "30-50 THB", when: "Daily ~06:00-13:00", where: "Cooked-food zone of the Municipal Market", tip: "Load up on the free bean sprouts, pickled greens and crackling from the side table to turn one cheap bowl into a full breakfast." },
      { name: "Evening roti carts", dish: "Roti with banana, egg or condensed milk", price: "20-40 THB", when: "Daily ~17:00-22:00, plus walking street nights", where: "Around the Night Bazaar entrance and along the weekend walking streets", tip: "Ask for less condensed milk (sai nom noi) unless you want it properly Thai-sweet." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "MICHELIN Guide Thailand", url: "https://guide.michelin.com/th/en" }],
  },
  {
    slug: "mae-hong-son", city: "Mae Hong Son", country: "th", verified: "2026-07",
    intro: "Mae Hong Son is a small, Shan (Tai Yai) flavoured provincial capital ringed by mountains near the Myanmar border, and almost everything on this board sits within a ten-minute walk of Nong Jong Kham lake. Local life starts at the morning market before dawn and winds down at the lakeside food stalls after dark.",
    markets: [
      { name: "Morning Market (Talat Sao) by Wat Hua Wiang", when: "Daily ~05:00-09:00, busiest before ~07:30", where: "Town centre, beside Wat Hua Wiang off Phanit Wattana Road", what: "Fresh fruit and vegetables, hill-tribe produce, and Shan breakfast stalls including warm tofu porridge, noodles and fried snacks", tip: "Go before 07:00 with small notes and eat breakfast at the stalls while you shop, because popular Shan snacks sell out early." },
      { name: "Jong Kham Lake Walking Street", when: "High season ~Oct-Feb, nightly ~17:00-21:30", where: "Lakeside promenade in front of Wat Jong Klang and Wat Jong Kham", what: "Street food, Shan sweets, hill-tribe handicrafts and souvenirs with the illuminated temples as a backdrop", tip: "Graze the food stalls rather than sitting down to one dinner, and check locally outside high season because vendors thin out to a handful." },
    ],
    shopLocal: [
      { what: "Fruit and vegetables", where: "Morning market by Wat Hua Wiang", tip: "Buy whatever the hill-tribe growers laid out that morning rather than hunting for a fixed shopping list, since stock is strictly seasonal." },
      { what: "Water, snacks and daily basics", where: "Family-run shophouses and 7-Elevens along Khunlumprapas Road, the main street", tip: "The shophouses are often a few baht cheaper than 7-Eleven and the owners will point you to anything they do not stock themselves." },
    ],
    family: [
      { item: "Nappies (diapers)", where: "Lotus's supermarket (formerly Tesco Lotus) on the main road and larger minimarts; 7-Eleven for small emergency packs", price: "~200-400 THB per pack, small packs ~60-120 THB", tip: "Stock up in Chiang Mai before the mountain drive, because Mae Hong Son mostly carries basic MamyPoko and BabyLove lines and specific sizes can be out of stock." },
      { item: "Infant formula and baby medicines", where: "Pharmacies along Khunlumprapas Road and the supermarket; Srisangwan Hospital in town for anything urgent", price: "~300-600 THB per tin of formula", tip: "Bring enough of your usual formula brand from a bigger city, as local shelves carry only a couple of Thai brands and the pharmacist can suggest the closest match." },
    ],
    cheapEats: [
      { name: "Morning market breakfast stalls", dish: "Warm Shan tofu porridge with rice noodles", price: "~20-40 THB", where: "Inside the morning market by Wat Hua Wiang", tip: "Point at what the person next to you is eating and squeeze onto the bench, because everything is made that morning and turnover is fast." },
      { name: "Khao soi shophouses in the town centre", dish: "Khao soi (northern Thai curry noodles) with chicken", price: "~40-60 THB", where: "Simple open-front shops around Khunlumprapas Road and near the lake", tip: "Any shop full of uniformed office workers at midday is a safe choice, and most khao soi pots are empty by early afternoon." },
      { name: "Salween River Restaurant", dish: "Shan and Burmese plates such as tea leaf salad and Shan noodles", price: "~60-150 THB", where: "Near the post office on Singhanat Bamrung Road, a short walk from the lake", tip: "Order the Burmese tea leaf salad alongside a Shan curry to taste what makes this border town different from the rest of Thailand, and confirm it is open on arrival as small-town hours shift." },
    ],
    streetFood: [
      { name: "Jong Kham Lake walking street stalls", dish: "Grilled skewers, Shan sweets and fried snacks", price: "~10-40 THB per item", when: "High season ~Oct-Feb, nightly ~17:00-21:30", where: "Lakeside in front of Wat Jong Klang", tip: "Go on a weekend evening when the row of vendors is longest and eat facing the lit-up temples reflected in the lake." },
      { name: "Fried Shan tofu vendors at the morning market", dish: "Fried chickpea-flour Shan tofu fritters", price: "~5-20 THB", when: "Daily ~05:30-09:00", where: "Morning market by Wat Hua Wiang", tip: "Ask for a bag fried to order so it is still hot and crisp, and take the dipping sauce they offer with it." },
      { name: "Evening grill and noodle stalls on the main street", dish: "Grilled chicken with sticky rice and noodle soups", price: "~30-60 THB", when: "Nightly ~17:00-21:00, year-round", where: "Along Khunlumprapas Road between the town centre and the lake", tip: "This is where locals pick up dinner outside tourist season, so it is a reliable year-round fallback when the walking street is not running." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "Wikivoyage", url: "https://en.wikivoyage.org/wiki/Mae_Hong_Son" }],
  },
  {
    slug: "nan", city: "Nan", country: "th", verified: "2026-07",
    intro: "Nan is a quiet provincial capital in a river valley near the Lao border, and its old-town grid around Wat Phumin is compact enough to cover on foot or by bicycle. Daily life still revolves around the morning fresh market, with the weekend walking street on Pha Kong Road as a social highlight.",
    markets: [
      { name: "Nan Municipal Fresh Market (Talat Sot Thetsaban)", when: "Daily ~05:00-12:00, busiest before ~08:00", where: "Old-town centre, a few minutes' walk from Wat Phumin", what: "Fruit and veg, sai ua (northern herb sausage), chilli dips like nam phrik ong, bagged curries, sticky rice, and makhwaen (Nan's prickly-ash pepper)", tip: "Come hungry before 08:00 and build a breakfast from the cooked-food stalls - it is one of the cheapest and most local meals you will find in town." },
      { name: "Nan Walking Street (Kad Khuang Mueang Nan)", when: "Fri-Sun ~17:00-21:30", where: "Pha Kong Road, in front of Wat Phumin", what: "Northern street food, khantoke-style mat seating, handwoven Nan textiles, crafts, and live music", tip: "Buy food from several stalls and eat it seated on the communal mats facing Wat Phumin - that is how locals do it." },
      { name: "Nan night food stalls", when: "Daily ~17:00-21:30", where: "Old-town centre close to Wat Phumin and the municipal market area", what: "A small daily cluster of cooked-food vendors: noodle soups, grilled meats, fried chicken, som tam, and takeaway rice dishes", tip: "This is the weekday fallback when the walking street is not on - modest in size, so arrive before ~20:00 while stalls are still fully stocked." },
    ],
    shopLocal: [
      { what: "Fruit and vegetables", where: "Nan Municipal Fresh Market in the old-town centre", tip: "Seasonal fruit is cheapest early in the morning, and in the cool season look for golden oranges (som si thong), a Nan speciality grown in Thung Chang district." },
      { what: "Groceries, toiletries, and bulk household supplies", where: "Big C or Lotus's hypermarket on the highway edge of town, roughly a 10-minute drive from the old town", tip: "Everything routine is cheaper here than in the small shops, so do one big run by car or songthaew rather than daily 7-Eleven trips." },
      { what: "Edible souvenirs: makhwaen pepper and vacuum-packed sai ua", where: "Spice and sausage vendors at the municipal fresh market", tip: "Dried makhwaen keeps for months and weighs almost nothing, making it a genuinely local gift that is easy to carry home." },
    ],
    family: [
      { item: "Nappies / diapers (Mamy Poko, Huggies, BabyLove)", where: "Big C or Lotus's hypermarket on the edge of town for jumbo packs; 7-Eleven branches in the centre stock small emergency packs", price: "~250-450 THB per jumbo pack (~4-9 THB per nappy)", tip: "Standard Thai brands are reliably stocked here so you do not need to haul packs from Bangkok, but if your child needs a specific premium brand, stock up in Bangkok or Chiang Mai first because selection in Nan is mainstream only." },
      { item: "Infant formula (Enfalac, S-26, Dumex, Nestle lines)", where: "The same hypermarkets, plus pharmacies in the old-town centre", price: "~350-700 THB per 550-600 g tin", tip: "Specialty formulas (hypoallergenic, goat, European organic) are effectively unavailable in Nan, so carry your full supply of those from home or a big city." },
    ],
    cheapEats: [
      { name: "Old-town khao soi shophouses", dish: "Khao soi kai - curried egg noodles with chicken and crispy noodle topping", price: "~40-60 THB", where: "Family-run shophouses scattered through the old-town grid and near the morning market", tip: "The good khao soi places sell out by early afternoon, so treat it as a lunch dish, not a dinner one." },
      { name: "Municipal market curry-rice stalls", dish: "Khao rat kaeng - rice topped with one or two northern curries such as kaeng ho", price: "~30-50 THB", where: "Inside and around the Nan Municipal Fresh Market", tip: "Just point at whatever pot looks good - the vendors are used to it and portions are generous." },
      { name: "Khanom jeen nam ngiao vendors", dish: "Fresh rice noodles in a tomato-pork nam ngiao broth, a northern staple", price: "~30-45 THB", where: "Morning stalls at and around the municipal fresh market", tip: "Load up on the free raw vegetables and pickled greens served alongside - that is part of the dish." },
    ],
    streetFood: [
      { name: "Walking-street sai ua grills", dish: "Sai ua - northern herb sausage grilled over coals, packed with lemongrass and makhwaen", price: "~30-60 THB per piece", when: "Fri-Sun ~17:00-21:30", where: "Pha Kong Road walking street, in front of Wat Phumin", tip: "Pick the grill with the longest local queue and eat it hot on the mats with sticky rice." },
      { name: "Morning-market moo ping stands", dish: "Moo ping - grilled marinated pork skewers with sticky rice", price: "~10-15 THB per skewer, ~10 THB for sticky rice", when: "Daily ~06:00-09:00", where: "Entrances to the Nan Municipal Fresh Market", tip: "Two skewers and a bag of sticky rice makes a classic local breakfast for around 40 THB - grab it before the commuter rush clears the grills." },
      { name: "Night-stall fried chicken with makhwaen", dish: "Kai thot - crispy fried chicken dusted with makhwaen, the prickly-ash pepper closely associated with Nan", price: "~20-50 THB per piece", when: "Daily evenings ~17:00-21:00", where: "Cooked-food stalls in the old-town centre near Wat Phumin", tip: "The tingling citrusy hit of makhwaen is a distinctly Nan flavour - if a stall offers it, that is the one to queue for." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "Wikivoyage - Nan", url: "https://en.wikivoyage.org/wiki/Nan" }],
  },
  {
    slug: "sukhothai", city: "Sukhothai", country: "th", verified: "2026-07",
    intro: "Sukhothai is really two towns: New Sukhothai (Sukhothai Thani), the everyday market town on the Yom River where locals actually shop and eat, and Old Sukhothai (Mueang Kao) about 12 km west beside the Historical Park. Base your eating and shopping in the new town and treat the Old City as the sightseeing trip.",
    markets: [
      { name: "Sukhothai Municipal Fresh Market (Talat Thetsaban)", when: "Daily ~05:00-12:00, busiest before 09:00", where: "Central New Sukhothai, just off Jarod Withithong Road near the Yom River", what: "The main local fresh market: fruit and vegetables by the kilo, pork, fish, herbs, curry pastes, plus khao gaeng and takeaway breakfast stalls around the edges", tip: "Go before ~08:00, before the produce is picked over, and eat breakfast at the stalls while you are there - it is one of the cheapest meals in town." },
      { name: "New Sukhothai Night Food Market", when: "Daily ~17:00-22:00", where: "New Sukhothai town centre, near the municipal market area off Jarod Withithong Road", what: "Rows of cooked-food stalls: grilled meats, som tam, noodle carts, fried snacks and Thai desserts, mostly takeaway with a few shared tables", tip: "This is where much of the town eats dinner, so arrive hungry around ~18:30 when everything is freshly cooked and nothing has sold out yet." },
      { name: "Old Sukhothai Saturday Walking Street", when: "Sat ~16:00-21:00, most reliable in the Nov-Feb high season", where: "Old Sukhothai (Mueang Kao) village street near the Historical Park entrance", what: "A small weekly evening market with local snacks, grilled food, handicrafts and produce from surrounding villages", tip: "Combine it with a late-afternoon temple loop, then eat your way down the street as the ruins light up nearby." },
    ],
    shopLocal: [
      { what: "Seasonal fruit by the kilo (mango, rambutan, longan, bananas depending on month)", where: "Sukhothai Municipal Fresh Market and roadside pickup-truck vendors along Highway 12 towards the Historical Park", tip: "Buy whatever the truck vendors are piled high with - that is what is in season locally, and it is usually cheaper and riper than supermarket fruit." },
      { what: "Supermarket staples: snacks for bus rides, sunscreen, toiletries, drinking water in bulk", where: "Lotus's (formerly Tesco Lotus) hypermarket in New Sukhothai", tip: "Do one big supermarket run in New Sukhothai before heading to the Old City, where shops are limited to minimarts." },
      { what: "Everyday top-ups: cold drinks, UHT milk, instant noodles, mosquito repellent", where: "7-Eleven branches throughout New Sukhothai and around the Old City", tip: "7-Eleven prices are fixed and fair, so use them freely for small stuff and save bargaining energy for the markets." },
    ],
    family: [
      { item: "Nappies (MamyPoko, Huggies and similar) and infant formula in full-size packs", where: "Lotus's hypermarket in New Sukhothai", price: "Jumbo nappy pack ~250-450 THB; formula tin ~350-700 THB", tip: "If you are staying out by the Historical Park, stock up here first - Old Sukhothai only has minimarts with small, pricier packs, and if you are coming from Bangkok or Chiang Mai it is worth arriving already supplied." },
      { item: "Emergency small packs: nappies, baby wipes, UHT milk and basic baby food pouches", where: "Any 7-Eleven in New Sukhothai or near the Old City park entrance", price: "Small nappy pack ~60-120 THB", tip: "Fine to cover one night if you run out, but the per-nappy price is roughly double the supermarket, so do not rely on it for a whole stay." },
    ],
    cheapEats: [
      { name: "Municipal market khao gaeng stalls", dish: "Curry and stir-fries ladled over rice, one or two toppings", price: "~35-50 THB", where: "In and around the Sukhothai Municipal Fresh Market, mornings until the trays run out", tip: "Just point at whatever trays look freshest - two toppings over rice is the standard local order." },
      { name: "Neighbourhood kuay teow Sukhothai shops", dish: "Sukhothai-style noodles: thin rice noodles, pork, green beans, peanuts and a slightly sweet broth", price: "~40-60 THB", where: "Simple shophouse noodle joints all over New Sukhothai, mostly open morning to mid-afternoon", tip: "The broth leans sweet by design, so season it yourself with the fish sauce and chilli caddy on the table rather than judging the first spoonful." },
      { name: "Night market rice-and-noodle carts", dish: "Pad thai, som tam with sticky rice, khao man gai and similar one-plate dinners", price: "~40-60 THB", where: "New Sukhothai Night Food Market, evenings", tip: "A full family dinner here often costs less than a single restaurant main, so order from several carts and share at the communal tables." },
    ],
    streetFood: [
      { name: "Jayhae (Jay Hae) Sukhothai Noodles", dish: "Kuay teow Sukhothai - the town's signature noodle bowl with pork, green beans, peanuts and lime", price: "~40-60 THB", when: "Daily ~08:00-15:00, often sells out early on busy days", where: "Jarod Withithong Road, New Sukhothai", tip: "Order it 'haeng' (dry, no broth) at least once - locals reckon the dry version shows off the sweet-sour-peanut balance best." },
      { name: "Ta Pui Sukhothai Noodles", dish: "Sukhothai noodles, a popular Old City bowl after temple-touring", price: "~40-50 THB", when: "Daily ~09:00-15:00", where: "Old Sukhothai (Mueang Kao), on the main road near the Historical Park", tip: "Time it as your lunch stop between the morning temple loop and the afternoon heat - the queue of locals moves fast." },
      { name: "Night market moo ping stalls", dish: "Charcoal-grilled pork skewers with a bag of sticky rice", price: "~10-15 THB per skewer, sticky rice ~10 THB", when: "Daily ~17:00-21:30", where: "New Sukhothai Night Food Market", tip: "Pick the stall with a long local queue and plenty of charcoal smoke - three skewers and sticky rice is a classic ~50 THB dinner." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "UNESCO World Heritage Centre (Sukhothai and Associated Historic Towns)", url: "https://whc.unesco.org" }],
  },
  {
    slug: "krabi", city: "Krabi", country: "th", verified: "2026-07",
    intro: "Krabi Town is where residents actually live and shop, while Ao Nang is the resort strip with resort prices. Base your market runs and big shops on Krabi Town and you will pay local rates.",
    markets: [
      { name: "Maharaj Market (Talat Maharaj)", when: "Daily, ~05:00-12:00, busiest before ~09:00", where: "Off Maharaj Road, central Krabi Town", what: "The main fresh market for Krabi Town residents: fruit, vegetables, fresh fish, meat, curry pastes and ready-cooked food.", tip: "Go before 9 in the morning for the widest choice and have breakfast at the cooked-food stalls while you are there." },
      { name: "Chao Fah Night Market", when: "Daily, ~17:00-22:00", where: "Riverfront near Chao Fah pier, Krabi Town", what: "Evening food stalls with grilled meats, noodles, som tam and Thai desserts; local families eat dinner here.", tip: "Take a table by the river and order from several different stalls — the vendors are used to it." },
      { name: "Krabi Walking Street", when: "Fri-Sun, ~17:00-22:00", where: "Soi Maharaj 8, Krabi Town", what: "Weekend night market with a big street-food court, local crafts and live music; a mixed local and traveller crowd.", tip: "Come hungry and treat the food court as your dinner — portions are small so you can try several things." },
    ],
    shopLocal: [
      { what: "Fresh fruit and vegetables by the kilo", where: "Maharaj Market, plus fruit vendor pickup trucks parked around Krabi Town", tip: "Prices are usually marked per kilo, so buy by weight rather than per piece and you will pay what locals pay." },
      { what: "Everyday groceries, toiletries and household staples", where: "Big C Supercenter and Lotus's on the edge of Krabi Town", tip: "Do one proper shop here before heading to Ao Nang, where minimarts charge noticeably more for the same items." },
    ],
    family: [
      { item: "Nappies (diapers) and infant formula", where: "Big C Supercenter and Lotus's, Krabi Town outskirts", price: "Nappies ~250-450 THB per mid-size pack; formula ~350-700 THB per tin", tip: "Familiar brands such as MamyPoko and Huggies are easy to find here, but if your baby needs a specific imported formula, stock up in Bangkok or Phuket before you arrive." },
      { item: "Emergency nappy packs, wipes and baby snacks", where: "7-Eleven branches in Ao Nang and Krabi Town", price: "Small packs ~80-150 THB", tip: "Convenience-store packs are fine for a night or two, but the per-nappy price is much higher, so do the main shop at Big C or Lotus's." },
    ],
    cheapEats: [
      { name: "Khao rat kaeng (rice-and-curry) shops around Maharaj Market", dish: "Rice with one or two curries ladled from the trays", price: "40-70 THB", where: "Streets around Maharaj Market, Krabi Town", tip: "Just point at the trays — two toppings over rice is the standard local order." },
      { name: "Muslim roti and southern curry shops", dish: "Roti with dhal or curry sauce, often with sweet tea", price: "20-50 THB", where: "Around Krabi Town, reflecting the province's large Muslim community", tip: "These open early, so they make a cheap and filling breakfast before a boat or bus." },
      { name: "Noodle soup shops in Krabi Town", dish: "Kuay teow noodle soup with pork or chicken", price: "40-60 THB", where: "Small shophouse restaurants around central Krabi Town", tip: "A bowl is a light portion by design, so do as locals do and order a second round or add extras." },
    ],
    streetFood: [
      { name: "Grill stalls at Chao Fah Night Market", dish: "Kai yang (grilled chicken) with sticky rice and som tam", price: "40-80 THB", when: "Daily evenings, ~17:00-22:00", where: "Riverfront near Chao Fah pier, Krabi Town", tip: "Queue at whichever grill has locals waiting — turnover means the chicken comes off the coals fresh." },
      { name: "Krabi Walking Street food court", dish: "Hoy thod (crispy mussel pancake) and grilled seafood skewers", price: "30-80 THB", when: "Fri-Sun evenings, ~17:00-22:00", where: "Soi Maharaj 8, Krabi Town", tip: "Buy from a few different stalls and share at the communal tables in the middle." },
      { name: "Morning stalls near Maharaj Market", dish: "Patongko (fried dough sticks) with hot soy milk", price: "10-30 THB", when: "Daily, ~06:00-09:00", where: "Around Maharaj Market, Krabi Town", tip: "Order a bag of hot sweetened soy milk to dip the patongko in, like everyone else at the stall." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "Wikivoyage — Krabi", url: "https://en.wikivoyage.org/wiki/Krabi" }],
  },
  {
    slug: "phuket", city: "Phuket", country: "th", verified: "2026-07",
    intro: "Locals live, shop and eat around Phuket Town, not the west-coast beaches, so prices drop sharply once you head inland toward the old town. The island has full big-city retail (Central, Big C, Lotus's), which makes it one of the easiest places in southern Thailand to travel with kids.",
    markets: [
      { name: "Downtown Fresh Market (Talat Sod, Ranong Rd)", when: "Daily, busiest ~04:00-10:00, some stalls into the afternoon", where: "Ranong Road, central Phuket Town, near the bus terminal area", what: "The main locals' wet market: tropical fruit, vegetables, fresh seafood, meat, curry pastes and southern Thai staples", tip: "Go before 09:00 while the produce selection is at its peak, and bring small notes, as stallholders rarely have change for a 1,000." },
      { name: "Sunday Walking Street (Lard Yai)", when: "Sundays only, ~16:00-22:00", where: "Thalang Road, Old Phuket Town", what: "Street food, Phuket-Chinese snacks, o-aew dessert, crafts and live music along the Sino-Portuguese shophouses", tip: "Arrive around 17:00 before the crowds peak and eat your way down one side of the street first." },
      { name: "Naka Weekend Market", when: "Saturdays and Sundays, ~16:00-22:00", where: "Off Chao Fah West Road, near Central Festival, Phuket Town outskirts", what: "Huge local weekend market: cheap street food, clothes, secondhand goods and household bits, mostly Thai shoppers", tip: "Eat dinner from the food stalls here rather than paying beach-road prices, but expect it to be hot and packed." },
      { name: "Chillva Market", when: "~Mon-Sat evenings, roughly 17:00-22:30, busiest Thu-Sat", where: "Yaowarat Road, north side of Phuket Town", what: "Container-and-stall night market popular with Thai students: snacks, grilled skewers, desserts and cheap clothes", tip: "It is more of a hangout than a grocery run, so come hungry in the evening and treat it as dinner plus a wander." },
    ],
    shopLocal: [
      { what: "Everyday fruit and vegetables at local prices", where: "Downtown Fresh Market on Ranong Road, or the small morning markets (talat sod) in each district such as Kathu and Chalong", tip: "Fruit sold by the kilo at the wet market is roughly half the price of the pre-cut packs near the beaches." },
      { what: "Big grocery runs, drinking water and household staples", where: "Big C Supercenter and Lotus's hypermarkets (several across the island), plus Tops in Central Festival and Central Floresta", tip: "Do one big supermarket run by taxi or rental car early in your stay, because minimart prices near the beaches add up fast." },
      { what: "Southern Thai snacks and edible souvenirs", where: "Old town shophouses around Thalang and Dibuk Roads, and the dried-goods stalls beside the Ranong Road market", tip: "Locally made cashews and Phuket pineapple make better take-home gifts than anything from the airport shops." },
    ],
    family: [
      { item: "Nappies/diapers (MamyPoko, Huggies, Merries and Thai brands)", where: "Big C, Lotus's, Tops, Boots and Watsons across the island; 7-Elevens carry small emergency packs", price: "~250-450 THB per standard pack, small 7-Eleven packs ~60-120 THB", tip: "No need to stock up in Bangkok first, since Phuket's hypermarkets carry the full range in all sizes, though pick some up in town because beach-area minimarts only stock small overpriced packs." },
      { item: "Infant formula and baby food", where: "Big C, Lotus's and Tops baby aisles; pharmacies in Phuket Town for specific medical formulas", price: "~300-900 THB per tin depending on brand, size and stage", tip: "International brands are widely available, but if your baby needs one specific formula bring enough for the trip rather than gambling on exact stock." },
    ],
    cheapEats: [
      { name: "Mee Ton Poe", dish: "Phuket-style Hokkien fried noodles (mee hokkien)", price: "~50-90 THB", where: "Near the Surin Circle clock tower area, Phuket Town", tip: "Order the wet-fried version like the locals do and add a squeeze of lime over the top." },
      { name: "Lock Tien Food Court", dish: "Old-school Phuket hawker plates: Hokkien mee, loba, popiah, o-tao", price: "~40-80 THB per dish", where: "Corner of Dibuk and Yaowarat Roads, Old Phuket Town", tip: "Order two or three small dishes from different counters to sample the Phuket-Chinese classics in one sitting." },
      { name: "Old town shophouse rice restaurants", dish: "Moo hong (Phuket braised pork belly) over rice", price: "~60-120 THB", where: "Family-run shophouse restaurants around Thalang, Dibuk and Phang Nga Roads, Phuket Town", tip: "If the menu lists moo hong, that is the local heritage dish to order, and lunchtime portions are cheaper than dinner." },
    ],
    streetFood: [
      { name: "Lard Yai Sunday stalls", dish: "O-aew jelly dessert with ice, grilled squid, Phuket spring rolls", price: "~20-60 THB per item", when: "Sundays, ~16:00-22:00", where: "Thalang Road Walking Street, Old Phuket Town", tip: "Finish with a bowl of o-aew, the shaved-ice jelly dessert that is rarely found outside Phuket." },
      { name: "Phuket Town morning dim sum shops", dish: "Steamed dim sum baskets with tea, a Phuket-Chinese breakfast tradition", price: "~15-35 THB per basket", when: "Early mornings, ~06:00-10:00", where: "Shophouse dim sum joints scattered around Phuket Town, especially near the old town and Ranong Road", tip: "Just point at the baskets you want as they come past and they count the empty steamers at the end to tally your bill." },
      { name: "Naka Market food rows", dish: "Moo ping skewers, oyster omelette, mango sticky rice", price: "~20-100 THB per item", when: "Saturdays and Sundays, ~16:00-22:00", where: "Naka Weekend Market, near Central Festival, Phuket Town", tip: "Follow whichever stall has the longest Thai queue, since locals here are picky about their skewers." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "Lonely Planet", url: "https://www.lonelyplanet.com/thailand/phuket" }],
  },
  {
    slug: "kanchanaburi", city: "Kanchanaburi", country: "th", verified: "2026-07",
    intro: "Kanchanaburi is a relaxed riverside provincial capital two to three hours west of Bangkok and the usual base for Erawan Falls and the Death Railway. Everyday local life runs along Saengchuto Road between the bus station and the railway station, a short walk inland from the riverside guesthouse strip.",
    markets: [
      { name: "City Fresh Market (municipal market)", when: "~Daily, roughly 04:00-12:00, busiest before 09:00", where: "Off Saengchuto Road, a short walk from the main bus station", what: "Fruit, vegetables, river fish, pork, curry pastes, flowers and cooked-food stalls where market workers eat breakfast", tip: "Go before 9am while the produce is at its freshest and grab a bag of cut fruit for the ride out to Erawan Falls." },
      { name: "JJ Night Market", when: "~Daily evenings, about 18:00-22:00", where: "Beside the Kanchanaburi railway station on Saengchuto Road", what: "Rows of cooked street food, desserts, cheap clothes and phone accessories, drawing more local families than tourists", tip: "Buy a few dishes in takeaway boxes and eat at the shared tables in the middle the way local families do." },
    ],
    shopLocal: [
      { what: "Everyday fruit and vegetables", where: "City Fresh Market near the bus station", tip: "Prices are per kilo and the same for everyone, so there is no need to bargain." },
      { what: "Supermarket staples, sunscreen, toiletries and baby goods", where: "Big C and Lotus's superstores on Saengchuto Road at the highway end of town", tip: "Both sit on the main road served by songthaews, so combine the shop with a trip to or from the bus station." },
      { what: "Water, snacks, SIM top-ups and small emergency items", where: "7-Eleven branches along Mae Nam Kwai Road and Saengchuto Road", tip: "You can pay small bills and top up mobile data at the counter while you are there." },
    ],
    family: [
      { item: "Nappies/diapers and baby wipes (MamyPoko, Huggies and Thai brands)", where: "Big C or Lotus's on Saengchuto Road; small emergency packs at 7-Eleven", price: "~200-400 THB per mid-size pack", tip: "Kanchanaburi town has full-size superstores so you do not need to stock up in Bangkok first, but buy enough before day trips to Erawan or Sangkhlaburi where shops are small." },
      { item: "Infant formula and baby food pouches", where: "Big C, Lotus's and pharmacies along Saengchuto Road", price: "~300-600 THB per tin", tip: "Thai and Nestle lines are easy to find here, but if your baby is on a specific European formula bring a supply from home or Bangkok." },
    ],
    cheapEats: [
      { name: "Khao kaeng (rice-and-curry) shops by the fresh market", dish: "Rice with one or two ladled curries or stir-fries", price: "40-60 THB", where: "Around the City Fresh Market near the bus station", tip: "Point at two toppings over rice and add a fried egg for about 10 THB more." },
      { name: "Noodle shophouses on Saengchuto Road", dish: "Kuay teow moo (pork noodle soup)", price: "40-60 THB", where: "Between the bus station and the railway station; look for a lunchtime crowd of office workers", tip: "Season the bowl yourself from the four-jar caddy on the table, since locals rarely eat it as served." },
      { name: "JJ Night Market food rows", dish: "Pad krapow, som tam and grilled chicken plates", price: "40-80 THB", where: "Next to the railway station on Saengchuto Road", tip: "Portions are local-sized, so order a couple of dishes and share." },
    ],
    streetFood: [
      { name: "Moo ping grills at JJ Night Market", dish: "Grilled pork skewers with sticky rice", price: "10-15 THB per skewer, sticky rice ~10 THB", when: "~Evenings from about 18:00", where: "Railway station end of Saengchuto Road", tip: "Join the stall with the local queue; the skewers come off the grill to order and the short wait is part of the deal." },
      { name: "Morning market breakfast stalls", dish: "Patongo (fried dough sticks) with hot soy milk, or jok rice porridge", price: "20-40 THB", when: "~Daily, about 05:00-09:00", where: "City Fresh Market near the bus station", tip: "Eat early alongside the market workers, because the stalls sell out well before mid-morning." },
      { name: "Banana roti carts on Mae Nam Kwai Road", dish: "Roti with banana and condensed milk", price: "20-40 THB", when: "~Evenings, roughly 17:00-22:00", where: "Along the guesthouse strip near the river", tip: "Ask for less condensed milk if you do not want it very sweet." },
    ],
    sources: [{ org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" }, { org: "Wikivoyage - Kanchanaburi", url: "https://en.wikivoyage.org/wiki/Kanchanaburi" }],
  },
  {
    slug: "koh-lanta",
    city: "Koh Lanta",
    country: "th",
    verified: "2026-07",
    intro: "Koh Lanta is a laid-back, Muslim-majority island where nearly all supplies funnel through Ban Saladan pier village in the north. Locals shop the island's rotating fresh market and small village shops, while the quieter east-coast Old Town keeps the island's older trading character.",
    markets: [
      {
        name: "Saladan rotating fresh market",
        when: "~Saturdays from early afternoon, roughly 13:00-19:00; the island's fresh market rotates to a different village each day, and hours shift year to year",
        where: "Ban Saladan; on ~Wednesdays a similar market sets up near the bridge to Lanta Noi just outside Saladan",
        what: "Fruit, vegetables, fresh fish, halal meat and cooked-food stalls",
        tip: "Confirm the day and hours with your guesthouse before making the trip, since the rotation changes from season to season.",
      },
      {
        name: "Lanta Old Town Sunday morning market",
        when: "~Sunday mornings, roughly 08:00-11:00",
        where: "Main street, Lanta Old Town, east coast",
        what: "Local snacks, produce, clothes and crafts along the old wooden shophouses",
        tip: "Come early and bring cash; stalls wind down before midday, and the local sweet-potato snacks sell out first.",
      },
    ],
    shopLocal: [
      {
        what: "Minimarts, 7-Elevens and pharmacies",
        where: "Ban Saladan pier village",
        tip: "Saladan is the island's supply hub, so if you cannot find it here you will not find it elsewhere on Lanta.",
      },
      {
        what: "Roadside fruit stalls and pickup-truck vendors",
        where: "Along the main west-coast road between Klong Dao and Klong Nin",
        tip: "Prices are per kilo and generally fair; ask them to pick you a ripe one and they will.",
      },
      {
        what: "Small family-run village grocery shops",
        where: "Inland roads and villages across the island",
        tip: "Village shops beat the beach-road minimarts on price for water, eggs and snacks.",
      },
    ],
    family: [
      {
        item: "Nappies (diapers) and formula",
        where: "Stock up at Big C or Lotus's in Krabi Town before the ferry or van; on the island, Saladan pharmacies and 7-Elevens carry small packs",
        price: "Small packs ~150-300 THB on the island; large mainland packs are noticeably cheaper per nappy",
        tip: "Buy the big pack on the mainland, because island shops stock only small sizes and can run out in high season.",
      },
      {
        item: "Baby basics (wipes, kids' sunscreen, paracetamol syrup)",
        where: "Pharmacies in Ban Saladan pier village",
        price: "~50-300 THB per item",
        tip: "Saladan pharmacists generally speak enough English to help with dosing for little ones.",
      },
    ],
    cheapEats: [
      {
        name: "Khao gaeng (rice-and-curry) shopfronts",
        dish: "Two southern curries ladled over rice",
        price: "40-70 THB",
        where: "Ban Saladan and along the main inland road",
        tip: "Just point at the trays; massaman and southern-style fish curry are safe first pointers.",
      },
      {
        name: "Local noodle shops",
        dish: "Chicken noodle soup (many shops are halal, so chicken and beef dominate over pork)",
        price: "40-60 THB",
        where: "Side streets of Saladan and the inland villages, away from the beachfront",
        tip: "A shop full of locals at lunchtime is the only recommendation you need.",
      },
      {
        name: "Lanta Old Town shophouse kitchens",
        dish: "Simple rice plates and seafood over rice",
        price: "50-90 THB",
        where: "Main street, Lanta Old Town, east coast",
        tip: "Eat in the small shopfronts where the fishing families do, not the stilted waterfront restaurants.",
      },
    ],
    streetFood: [
      {
        name: "Rotating fresh-market food stalls",
        dish: "Southern-style fried chicken (gai tod) with sticky rice",
        price: "20-50 THB",
        when: "~Saturday afternoons in Saladan from about 13:00; the market rotates around the island on other days",
        where: "Fresh-market pitch, Ban Saladan",
        tip: "Arrive when the market opens, while the chicken is still coming out of the wok.",
      },
      {
        name: "Roadside roti carts",
        dish: "Banana or egg roti with condensed milk",
        price: "20-50 THB",
        when: "~Evenings from about 17:00",
        where: "Along the west-coast beach road and in Saladan",
        tip: "Lanta is Muslim-majority, so roti here is a genuine local staple rather than a tourist invention.",
      },
      {
        name: "Evening grill stalls",
        dish: "Chicken skewers and grilled fish",
        price: "10-20 THB per skewer",
        when: "~16:00-20:00",
        where: "Saladan and pull-in spots along the main west-coast road",
        tip: "Pick the stall where songthaew drivers and shop staff are queueing on their way home.",
      },
    ],
    sources: [
      { org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" },
      { org: "Lonely Planet", url: "https://www.lonelyplanet.com" },
    ],
  },
  {
    slug: "koh-phangan",
    city: "Koh Phangan",
    country: "th",
    verified: "2026-07",
    intro: "Thong Sala, the ferry-pier town, is where Koh Phangan actually shops and eats; the beach villages and the Haad Rin full-moon strip charge tourist prices for everything. Do your market runs and supply stocking in Thong Sala before heading out to the coasts.",
    markets: [
      {
        name: "Thong Sala Fresh Market (day market)",
        when: "~Daily, roughly 05:00-12:00, best selection before 09:00",
        where: "Central Thong Sala, a short walk inland from the pier",
        what: "Fruit, vegetables, fresh seafood, curry pastes, cooked-to-order breakfast stalls",
        tip: "Go early with the locals for first pick of the seafood and fruit, then eat a ~40 THB bowl of noodles at the stalls before the heat kicks in.",
      },
      {
        name: "Phantip Night Food Market",
        when: "~Daily, roughly 15:00-22:00",
        where: "Thong Sala centre, just off the main pier road",
        what: "Dozens of cooked-food stalls: Thai staples, grilled skewers, smoothies, roti, desserts",
        tip: "This is where island workers eat dinner, so follow the longest Thai queue rather than the stall with the biggest English sign.",
      },
      {
        name: "Thong Sala Walking Street",
        when: "~Saturdays, roughly 17:00-22:00",
        where: "Old Chinese quarter streets near the Thong Sala pier",
        what: "Weekly street market with food stalls, snacks, crafts, and clothes",
        tip: "Come hungry and graze your way down the street, because portions are snack-sized and cheap enough to try five things.",
      },
    ],
    shopLocal: [
      {
        what: "Everyday groceries, toiletries, sunscreen, and basics",
        where: "Big C Mini and Lotus's branches in and around Thong Sala",
        tip: "Prices here are close to mainland supermarket prices, while the minimarts in beach villages can charge half as much again for the same items.",
      },
      {
        what: "Bulk groceries and drinks for long stays or villa self-catering",
        where: "Makro Food Service on the edge of Thong Sala",
        tip: "If your group is staying a week or more, one Makro run for water, snacks, and breakfast supplies beats daily 7-Eleven trips.",
      },
      {
        what: "Fruit for your room or the beach",
        where: "Thong Sala Fresh Market and roadside fruit stalls on the Thong Sala-Baan Tai road",
        tip: "Buy whole fruit at the market by weight instead of pre-cut tourist trays, which cost two to three times more.",
      },
    ],
    family: [
      {
        item: "Nappies/diapers (Thai brands like MamyPoko and BabyLove)",
        where: "Big C Mini, Lotus's, and Makro in Thong Sala",
        price: "~200-450 THB per pack",
        tip: "The island selection of sizes and brands is limited, so if your baby needs a specific brand stock up in Surat Thani or on Koh Samui before the ferry, and always buy in Thong Sala rather than a beach-village minimart.",
      },
      {
        item: "Infant formula and baby food pouches",
        where: "Big C Mini and Lotus's in Thong Sala, plus pharmacies on the main road",
        price: "~350-600 THB per formula tin",
        tip: "Thai and international formula brands are available but turnover is slow, so check the expiry date and buy a spare tin when you see your brand.",
      },
    ],
    cheapEats: [
      {
        name: "Thong Sala day market breakfast stalls",
        dish: "Noodle soup or khao man gai (chicken rice)",
        price: "~40-60 THB",
        where: "Inside and around the Thong Sala Fresh Market, mornings",
        tip: "One of the cheapest genuinely local meals on the island, and it is gone by lunchtime.",
      },
      {
        name: "Khao rat kaeng (curry-and-rice) shops",
        dish: "Rice with one or two pre-cooked curries or stir-fries from the tray display",
        price: "~50-80 THB",
        where: "Along the main road in Thong Sala and the Thong Sala-Baan Tai stretch",
        tip: "Point at what looks good in the trays and eat where the songthaew drivers eat, not on the beach strip.",
      },
      {
        name: "Phantip Night Food Market plates",
        dish: "Pad krapow, fried rice, or pad thai cooked to order",
        price: "~50-90 THB",
        where: "Phantip market, central Thong Sala, from late afternoon",
        tip: "A full dinner plus a fruit smoothie here typically costs less than a single main course in Haad Rin during full-moon week.",
      },
    ],
    streetFood: [
      {
        name: "Phantip grilled-skewer stalls",
        dish: "Moo ping (grilled pork skewers) with sticky rice",
        price: "~10-20 THB per skewer, ~40-60 THB for a meal",
        when: "~Daily 15:00-22:00",
        where: "Phantip Night Food Market, Thong Sala",
        tip: "Grab three skewers and a bag of sticky rice, and skip any stall where the meat is not turning over quickly.",
      },
      {
        name: "Thong Sala roti carts",
        dish: "Roti (Thai-style pancake) with banana and egg",
        price: "~30-60 THB",
        when: "~Evenings, busiest on Saturday Walking Street nights",
        where: "Phantip market and the Saturday Walking Street, Thong Sala",
        tip: "Order it with banana and egg but ask for less condensed milk if you do not want it dessert-sweet.",
      },
      {
        name: "Morning market grilled chicken stalls",
        dish: "Kai yang (grilled chicken) with som tam and sticky rice",
        price: "~60-100 THB for a set",
        when: "~Mornings until early afternoon",
        where: "Around the Thong Sala Fresh Market",
        tip: "Buy a half chicken and som tam to take to the beach, since it travels well and costs a fraction of beachfront prices.",
      },
    ],
    sources: [
      { org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" },
      { org: "Wikivoyage - Ko Pha Ngan", url: "https://en.wikivoyage.org/wiki/Ko_Pha_Ngan" },
    ],
  },
  {
    slug: "koh-tao",
    city: "Koh Tao",
    country: "th",
    verified: "2026-07",
    intro: "Koh Tao is a small dive island with no big supermarket: Mae Haad around the pier is where locals actually shop and eat, while the Sairee beach strip is mostly geared to divers. Everything arrives by boat, so prices run higher than the mainland and stock can simply run out.",
    markets: [
      {
        name: "Mae Haad fresh market",
        when: "~daily mornings, roughly 06:00-13:00 (busiest early)",
        where: "Back streets of Mae Haad village, a short walk inland from the main pier",
        what: "A small local market with fruit, vegetables, fish, eggs and a handful of cooked-food and curry stalls where island workers eat - do not expect a big mainland-style market",
        tip: "Produce and fish come over on the morning boats, so go before ~09:00 for the widest pick and the liveliest local crowd.",
      },
    ],
    shopLocal: [
      {
        what: "Fruit and vegetables",
        where: "Mae Haad fresh market, plus pickup-truck and roadside fruit vendors along the Mae Haad-Sairee road",
        tip: "The fruit trucks parked along the main road are often cheaper than shopfronts, and they will slice a pineapple or papaya for you on the spot.",
      },
      {
        what: "Drinking water and everyday staples",
        where: "Family-run minimarts on the inland roads rather than the beachfront 7-Elevens in Sairee and Mae Haad",
        tip: "Refill bottles at the coin-operated water machines outside many minimarts for a few baht instead of buying new plastic every day.",
      },
    ],
    family: [
      {
        item: "Nappies (diapers) and formula - stock up BEFORE the ferry",
        where: "Big C, Lotus's or Makro on Koh Samui, or the supermarkets in Surat Thani or Chumphon town before you board the boat",
        price: "Full-size packs ~300-600 THB on the mainland; island packs cost noticeably more",
        tip: "There is no big-box store on Koh Tao, so buy a full trip's worth of nappies and formula on the mainland or Samui and treat island shops as backup only.",
      },
      {
        item: "Emergency nappies, wipes and small formula tins on the island",
        where: "7-Elevens in Sairee and Mae Haad, and the pharmacies near Mae Haad pier",
        price: "Small packs ~150-300 THB",
        tip: "Island shops mostly carry small packs in limited sizes, so if you see your size, buy it rather than hoping the next shop has it.",
      },
    ],
    cheapEats: [
      {
        name: "995 Roasted Duck",
        dish: "Roast duck over rice or duck noodle soup",
        price: "60-120 THB",
        where: "Mae Haad, on the road up from the pier",
        tip: "This is where dive staff and islanders eat between boats, and the duck often sells out well before evening.",
      },
      {
        name: "Pranee's Kitchen",
        dish: "Thai curries, stir-fries and som tam",
        price: "70-150 THB",
        where: "Mae Haad, on the seafront a short walk from the pier",
        tip: "A long-running Mae Haad Thai kitchen, so order the curries rather than the western menu.",
      },
      {
        name: "Cooked-food stalls at Mae Haad market",
        dish: "Khao gaeng (rice with pre-cooked curries) and noodle soups",
        price: "40-80 THB",
        where: "Inside and around the Mae Haad fresh market",
        tip: "Point at two curries over rice like the locals do and you will eat well for the price of a smoothie on the beach.",
      },
    ],
    streetFood: [
      {
        name: "Sairee roti carts",
        dish: "Banana roti (Thai pancake), plain or with egg and condensed milk",
        price: "40-80 THB",
        when: "~evenings, 17:00-23:00",
        where: "Along the Sairee village walking strip",
        tip: "Go for the simple banana-and-egg version, which is cooked fresh in front of you and travels well back to the beach.",
      },
      {
        name: "Grilled chicken and som tam stalls",
        dish: "Gai yang (grilled chicken) with sticky rice and papaya salad",
        price: "50-100 THB",
        when: "~late morning to early evening",
        where: "Roadside along the main Mae Haad-Sairee road",
        tip: "Ask for the som tam 'pet nit noi' (a little spicy) unless you genuinely want the local heat level.",
      },
      {
        name: "Morning skewer stalls at Mae Haad market",
        dish: "Moo ping (grilled pork skewers) with sticky rice",
        price: "10-15 THB per skewer",
        when: "~mornings, 06:00-10:00",
        where: "Around the Mae Haad fresh market and pier road",
        tip: "Grab a bag of skewers and sticky rice before an early ferry or dive boat, which is exactly what the boat crews do.",
      },
    ],
    sources: [
      { org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" },
      {
        org: "Lomprayah High Speed Ferries (mainland-island connections for stocking up)",
        url: "https://www.lomprayah.com",
      },
    ],
  },
  {
    slug: "koh-chang",
    city: "Koh Chang",
    country: "th",
    verified: "2026-07",
    intro: "Koh Chang is a big forested island in Trat province: tourist life runs down the west-coast strip from White Sand Beach through Klong Prao and Kai Bae to Lonely Beach, while everyday local life sits in Klong Son and Dan Mai villages and the Bang Bao fishing pier in the south. There is no full-size supermarket on the island - shops are mostly 7-Elevens and small minimarts - so locals and long-stayers do their serious shopping in Trat town on the mainland before crossing from Laem Ngop.",
    markets: [
      {
        name: "Klong Son village fresh market",
        when: "~Daily, roughly 06:00-09:00 (morning market)",
        where: "Klong Son village, in the island's north between the ferry piers and White Sand Beach",
        what: "Small village morning market: fruit and vegetables, fresh fish, ready-made curries, grilled chicken and sticky rice, Thai sweets",
        tip: "Go before 8am with small notes - this is where island families actually buy their food, and the ready-cooked bags of curry make a very cheap breakfast or lunch.",
      },
      {
        name: "Trat town markets (mainland, pre-ferry)",
        when: "~Daily; day market from early morning, night market roughly 17:00-21:00",
        where: "Central Trat town, about 20-30 minutes from the Laem Ngop ferry piers",
        what: "Full-size fresh market plus an evening food market; Trat province fruit like rambutan, mangosteen and durian in season, and proper grocery shopping nearby",
        tip: "Do your big shop here before you board the ferry - everything on the island costs more and comes in smaller sizes.",
      },
    ],
    shopLocal: [
      {
        what: "Roadside fruit stalls and pickup-truck vendors",
        where: "Along the west-coast road, especially around Klong Prao and Kai Bae, and in Klong Son village",
        tip: "Trat is a famous fruit province, so in season (roughly May-July) rambutan and mangosteen from these trucks are usually fresher and cheaper than shop fruit.",
      },
      {
        what: "Fresh seafood straight from the fishing village",
        where: "Bang Bao pier, at the island's southern end",
        tip: "Walk past the first restaurants on the pier and buy where you see locals buying - ask the day's price per kilo before pointing at anything.",
      },
      {
        what: "7-Eleven and small minimarts for daily basics",
        where: "Dotted all along the strip from White Sand Beach to Lonely Beach",
        tip: "Fine for water, snacks and toiletries, but treat them as top-ups - island minimart prices run noticeably above mainland prices.",
      },
    ],
    family: [
      {
        item: "Nappies (diapers) and baby wipes",
        where: "Stock up FIRST at the big supermarkets in Trat town before the Laem Ngop ferry; on the island, 7-Elevens and minimarts along the west coast carry small emergency packs only",
        price: "Small island packs ~150-300 THB; large mainland packs work out far cheaper per nappy",
        tip: "Buy a full-size pack in Trat town on your way in, because on the island you will mostly find small packs in limited sizes at tourist prices.",
      },
      {
        item: "Formula, baby food and children's medicines",
        where: "Pharmacies and minimarts around White Sand Beach and Klong Prao carry common Thai brands; anything specific should come with you from the mainland",
        price: "Formula tins ~350-600 THB depending on brand and size",
        tip: "If your child needs a particular formula or medicine, bring it across yourself - island pharmacies are small and cannot order things in quickly.",
      },
    ],
    cheapEats: [
      {
        name: "Klong Son village noodle and rice shops",
        dish: "Noodle soup, khao man gai (chicken rice), rice-and-curry plates",
        price: "~50-80 THB",
        where: "Klong Son village, along the main road near the market",
        tip: "Eating where the village eats is among the cheapest proper meals on the island - point at what looks good and it will be fine.",
      },
      {
        name: "Back-road Thai eateries behind the beach strip",
        dish: "Stir-fries, pad krapao with fried egg, fried rice",
        price: "~60-100 THB",
        where: "One street back from the main road in Klong Prao and Kai Bae, where staff from the resorts eat",
        tip: "If the menu is handwritten in Thai and the tables are plastic, you have found the local price - the beachfront version of the same dish often costs double.",
      },
      {
        name: "Morning market food stalls",
        dish: "Bags of ready-made curry, grilled chicken with sticky rice, Thai sweets",
        price: "~20-50 THB per item",
        where: "Klong Son fresh market, mornings only",
        tip: "Grab a few curry bags and a bag of rice and you have fed the whole family for the price of one beach-bar smoothie.",
      },
    ],
    streetFood: [
      {
        name: "Bang Bao pier seafood grills",
        dish: "Grilled fish, prawn and squid skewers from the fishing village",
        price: "~60-150 THB per skewer or small portion",
        when: "~Late morning to evening; freshest when the boats have just come in",
        where: "Along the wooden pier at Bang Bao, southern Koh Chang",
        tip: "Skewers from the small stalls partway down the pier are a cheap way to taste the catch without committing to a full restaurant bill.",
      },
      {
        name: "Banana roti carts",
        dish: "Roti pancake with banana, egg or chocolate",
        price: "~40-70 THB",
        when: "~Evenings, roughly 17:00 until late",
        where: "Along the strip at White Sand Beach, Kai Bae and Lonely Beach",
        tip: "Watch for the cart with a queue of Thai staff after their shift - that one is worth waiting for.",
      },
      {
        name: "Som tam and grilled chicken stalls",
        dish: "Som tam (papaya salad), gai yang (grilled chicken), sticky rice",
        price: "~40-90 THB",
        when: "~Lunchtime through late afternoon",
        where: "Roadside stalls around Klong Prao and Klong Son",
        tip: "Say 'phet nit noi' for only a little chilli - the local default heat level is serious.",
      },
    ],
    sources: [
      { org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" },
      { org: "Lonely Planet", url: "https://www.lonelyplanet.com" },
    ],
  },
  {
    slug: "koh-samui",
    city: "Koh Samui",
    country: "th",
    verified: "2026-07",
    intro: "Unlike the smaller islands, Koh Samui has full supermarkets, so stocking up is easy; the catch is that beach-road minimarts charge a premium. Nathon town on the west coast is where islanders actually shop and eat.",
    markets: [
      {
        name: "Nathon day market (Talat Nathon)",
        when: "Daily ~06:00-17:00, best before 10:00",
        where: "Nathon town, west coast near the pier",
        what: "Fresh produce, fish, cooked curries and Thai sweets at local prices",
        tip: "This is the islanders' market, so it is cheaper and less touristy than anything in Chaweng.",
      },
      {
        name: "Fisherman's Village Walking Street",
        when: "~Fridays from about 16:00",
        where: "Bophut, north coast",
        what: "Seafood grills, snacks, crafts and clothes along the old shophouses",
        tip: "Come early and hungry, because it gets packed and the best seafood stalls sell out.",
      },
      {
        name: "Lamai and Chaweng night food stalls",
        when: "~Daily evenings from about 17:00",
        where: "Side sois off the main beach roads",
        what: "Grilled skewers, som tam, noodles and roti",
        tip: "Walk one street back from the beachfront and prices roughly halve.",
      },
    ],
    shopLocal: [
      {
        what: "Everyday groceries and toiletries",
        where: "Big C, Lotus's and Makro around Chaweng and Bophut",
        tip: "Prices here are close to mainland levels, unlike the beach-village minimarts.",
      },
      {
        what: "Fruit for your room or the beach",
        where: "Roadside fruit trucks along the ring road and Nathon market",
        tip: "Buy whole fruit by the kilo rather than pre-cut tourist trays.",
      },
    ],
    family: [
      {
        item: "Nappies (diapers) and formula",
        where: "Big C, Lotus's and Makro near Chaweng and Bophut",
        price: "Packs ~300-600 THB",
        tip: "Samui has full supermarkets so you can buy on the island, but bring your specific brand from the mainland if your baby needs one.",
      },
      {
        item: "Baby basics (wipes, kids' sunscreen, paracetamol syrup)",
        where: "Pharmacies in Chaweng and Lamai",
        price: "~50-300 THB per item",
        tip: "Pharmacists here speak enough English to help with children's dosing.",
      },
    ],
    cheapEats: [
      {
        name: "Nathon rice-and-curry shops",
        dish: "Two curries over rice (khao gaeng)",
        price: "50-80 THB",
        where: "Nathon town, off the pier road",
        tip: "Point at two trays like the locals do for a full meal at smoothie prices.",
      },
      {
        name: "Local noodle shops",
        dish: "Chicken or pork noodle soup",
        price: "50-70 THB",
        where: "Inland roads and Maenam village",
        tip: "A shop full of Thai diners at lunch is the only recommendation you need.",
      },
    ],
    streetFood: [
      {
        name: "Fisherman's Village seafood stalls",
        dish: "Grilled prawns and fish",
        price: "100-300 THB",
        when: "~Friday evenings",
        where: "Bophut walking street",
        tip: "Confirm the price per 100 grams before it goes on the grill.",
      },
      {
        name: "Roti and moo ping carts",
        dish: "Banana roti; grilled pork skewers with sticky rice",
        price: "10-60 THB",
        when: "~Evenings from 17:00",
        where: "Chaweng and Lamai beach roads",
        tip: "The moo ping carts by the 7-Elevens are a cheap, reliable dinner.",
      },
    ],
    sources: [
      { org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" },
      { org: "Lonely Planet - Ko Samui", url: "https://www.lonelyplanet.com/thailand/ko-samui" },
    ],
  },
  {
    slug: "hua-hin",
    city: "Hua Hin",
    country: "th",
    verified: "2026-07",
    intro: "Hua Hin is a royal seaside town with a strong Thai domestic-tourism food scene, so local eating is easy and good value away from the seafront. The central Chatchai market and the night markets are the heart of it.",
    markets: [
      {
        name: "Chatchai Market",
        when: "Daily, best ~06:00-11:00",
        where: "Central Hua Hin, off Phetkasem Road",
        what: "Fresh produce, fish, cooked food and Thai desserts",
        tip: "Go in the morning for breakfast stalls and the widest pick before the heat.",
      },
      {
        name: "Hua Hin Night Market",
        when: "~Daily from about 17:00 to 23:00",
        where: "Dechanuchit Road, town centre",
        what: "Seafood grills, Thai dishes, snacks and souvenirs",
        tip: "The seafood is good but check the price per 100 grams before ordering.",
      },
      {
        name: "Cicada Market",
        when: "~Friday to Sunday evenings",
        where: "Near Khao Takiab, south of town",
        what: "Arts, crafts, live music and a food zone",
        tip: "More of an evening out than a cheap eat, but the food court is fair value.",
      },
    ],
    shopLocal: [
      {
        what: "Groceries and packaged goods",
        where: "Tops and Big C in the Market Village and BluPort malls",
        tip: "Air-conditioned and fixed-price, handy on a hot afternoon.",
      },
      {
        what: "Fish and produce",
        where: "Chatchai Market and the fishing pier area",
        tip: "Buy seafood near the pier where it lands, not on the tourist strip.",
      },
    ],
    family: [
      {
        item: "Nappies (diapers) and formula",
        where: "Tops and Big C in the Market Village and BluPort malls",
        price: "Packs ~300-600 THB",
        tip: "Hua Hin has full supermarkets, so there is no need to stock up elsewhere first.",
      },
      {
        item: "Baby basics and children's medicine",
        where: "Pharmacies along Phetkasem and Naresdamri Roads",
        price: "~50-300 THB per item",
        tip: "Boots and local pharmacies both stock common infant brands.",
      },
    ],
    cheapEats: [
      {
        name: "Chatchai Market food stalls",
        dish: "Noodle soup and rice-and-curry",
        price: "40-70 THB",
        where: "Inside and around Chatchai Market",
        tip: "The cheapest genuinely local breakfast in town.",
      },
      {
        name: "Soi rice-and-curry shops",
        dish: "Rice with pre-cooked Thai dishes",
        price: "50-90 THB",
        where: "Sois off Phetkasem Road",
        tip: "Eat where the office workers queue at noon.",
      },
    ],
    streetFood: [
      {
        name: "Hua Hin Night Market grills",
        dish: "Grilled seafood and satay",
        price: "60-250 THB",
        when: "~Evenings 17:00-23:00",
        where: "Dechanuchit Road",
        tip: "Agree the weight and price first; portions are sold by the 100 grams.",
      },
      {
        name: "Morning stalls",
        dish: "Pa-tong-go with warm soy milk",
        price: "20-40 THB",
        when: "~Mornings",
        where: "Around Chatchai Market",
        tip: "A cheap Thai breakfast the locals grab on the way to work.",
      },
    ],
    sources: [
      { org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org" },
      { org: "Wikivoyage - Hua Hin", url: "https://en.wikivoyage.org/wiki/Hua_Hin" },
    ],
  }
];
