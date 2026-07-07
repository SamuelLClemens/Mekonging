// Cambodia — LOCAL NOTICEBOARDS (see local.th.js for the shape). Guidance only.

export const LOCAL_KH = [
  {
    slug: "phnom-penh", city: "Phnom Penh", country: "kh", verified: "2026-07",
    intro: "Phnom Penh's markets each have a personality: Central for the building, Russian for the finds, and the neighbourhood phsars for real prices.",
    markets: [
      { name: "Phsar Thmei (Central Market)", when: "Daily ~07:00–18:00", where: "Art-deco dome, city centre", what: "Jewellery, electronics, flowers, food hall", tip: "The food aisles do a cheap, good Khmer lunch." },
      { name: "Phsar Toul Tom Poung (Russian Market)", when: "Daily ~07:00–18:00", where: "South of centre", what: "Souvenirs, fabric, coffee stalls, motor parts", tip: "The iced-coffee stalls inside are a rite of passage." },
      { name: "Phsar Kandal", when: "Daily, best 06:00–09:00", where: "Near the riverside", what: "A working wet market: produce, fish, flowers at local prices", tip: "This is where the riverside restaurants actually buy." },
    ],
    shopLocal: [
      { what: "Fruit & veg", where: "Any neighbourhood phsar before 09:00", tip: "Prices are soft — friendly counting beats hard haggling." },
      { what: "Staples", where: "Lucky / Aeon supermarkets for fixed prices; Makro for bulk", tip: "Aeon malls are also the air-con escape with kids." },
    ],
    family: [
      { item: "Nappies / diapers", where: "Aeon, Lucky, or Chip Mong supermarkets; minimarts for singles", price: "USD-priced; big packs at supermarkets are the value", tip: "Pharmacies (Pharmacie de la Gare et al.) stock trusted formula brands." },
    ],
    cheapEats: [
      { name: "Market food halls", dish: "Bai sach chrouk (pork & rice), num banh chok", price: "1.50–3 USD", where: "Phsar Thmei / any phsar, mornings", tip: "Breakfast is Cambodia's best-value meal." },
      { name: "Riverside-back streets", dish: "Khmer curry, lok lak", price: "2.50–4 USD", where: "One block off Sisowath Quay", tip: "One street back halves the price." },
    ],
    streetFood: [
      { name: "Night stalls at Phsar Kandal / riverside", dish: "Grilled skewers, noodle stir-fries, fruit shakes", price: "1–3 USD", when: "~16:00–22:00", where: "Riverside blocks", tip: "Busy stall + high turnover = safe and fresh." },
    ],
    sources: [{ org: "Ministry of Tourism Cambodia", url: "https://www.tourismcambodia.org" }],
  },
  {
    slug: "siem-reap", city: "Siem Reap", country: "kh", verified: "2026-07",
    intro: "Siem Reap is more than the temple crowds around Pub Street: locals shop, eat and unwind a couple of kilometres out, around Phsar Leu and Road 60. Prices below are guidance in USD, which circulates alongside the riel, so carry small notes of both.",
    markets: [
      { name: "Phsar Leu Thom Thmey", when: "Daily, ~5:30-17:00; produce is freshest before ~9:00", where: "National Road 6, ~2 km east of the town centre", what: "The main locals market: fruit, vegetables, meat, fish, dry goods, gold shops and household stalls", tip: "Go before ~8:00 with small riel notes and you will pay close to local prices without hard haggling." },
      { name: "Phsar Chas (Old Market)", when: "Daily, ~6:30-18:00; fresh-food section busiest before ~9:00", where: "Riverside, between Pub Street and the Siem Reap River", what: "Souvenir stalls around the edges, but the inner wet-market section still sells produce, fish and spices to locals", tip: "Skip the souvenir aisles and head to the middle wet market, where prices drop noticeably if you buy a few things together." },
      { name: "Road 60 Night Market (Phsar Road 60)", when: "Daily, ~16:00-22:00; liveliest on weekend evenings", where: "Along Road 60 near the Angkor ticket-office road, north-east of town", what: "A genuinely local evening fairground: grilled meats, fruit shakes, straw mats, kids' rides and bric-a-brac stalls", tip: "Do as the local families do: claim a mat, point at skewers and a grilled chicken, and pay as you go." },
    ],
    shopLocal: [
      { what: "Fruit and vegetables at local prices", where: "Phsar Leu Thom Thmey, National Road 6", tip: "Prices are per kilo and rarely posted, so watch what locals pay first and round in riel rather than dollars." },
      { what: "Supermarket staples, dairy, snacks and imported goods", where: "Angkor Market, Sivatha Boulevard", tip: "It is air-conditioned and fixed-price, handy for anything you would rather not bargain for." },
      { what: "Bigger supermarket run: frozen goods, toiletries, baby items", where: "Lucky Supermarket, Lucky Mall on Sivatha Boulevard", tip: "Do one big stock-up here; prices are labelled in USD and cards are accepted." },
    ],
    family: [
      { item: "Nappies/diapers (Pampers, Huggies and Japanese brands)", where: "Lucky Supermarket and Angkor Market on Sivatha Boulevard; larger pharmacies such as U-Care near the Old Market", price: "~7-14 USD per pack", tip: "Common sizes are easy to find but the range is thinner than Phnom Penh or Bangkok, so stock up in a bigger city first if your child needs a specific brand or size." },
      { item: "Infant formula and baby food", where: "Angkor Market and Lucky Supermarket; pharmacies carry a smaller range", price: "~10-25 USD per tin", tip: "Check the seal and expiry date on every tin, and bring any specialist formula from home because niche brands are hard to find here." },
    ],
    cheapEats: [
      { name: "Num banh chok breakfast rows", dish: "Num banh chok — fresh rice noodles with green fish-curry gravy and a pile of herbs", price: "0.50-1 USD", where: "Morning street sellers around Phsar Leu and neighbourhood roadsides; usually sold out by ~9:00", tip: "Sit down wherever the seller has a crowd of locals and just point — one bowl plus a fried banana makes a full breakfast." },
      { name: "Bay sach chrouk corner shops", dish: "Bay sach chrouk — charcoal-grilled pork over rice with pickles and a clear soup", price: "1-1.50 USD", where: "Morning-only shophouses and carts near Phsar Leu and along Wat Bo Road", tip: "Go before ~8:30 because the pork runs out, and the busiest grill is usually a safe bet." },
      { name: "Market kuy teav stalls", dish: "Kuy teav — pork or beef rice-noodle soup", price: "1-1.75 USD", where: "Inside Phsar Leu and at the wet-market end of Phsar Chas, mornings to early afternoon", tip: "Add the lime, chilli and sugar yourself at the table, the way everyone around you does." },
    ],
    streetFood: [
      { name: "Road 60 night grills", dish: "Charcoal skewers, grilled half chickens and whole fish, with fruit shakes on the side", price: "0.25-0.50 USD per skewer, 2-4 USD for a plate or half chicken", when: "Daily, ~16:00-22:00", where: "Road 60 Night Market, north-east of town near the Angkor ticket-office road", tip: "Grab a straw mat, order in rounds and keep small notes handy because nothing here carries a price tag." },
      { name: "Lort cha carts", dish: "Lort cha — short fat rice noodles stir-fried with beef, greens and a fried egg on top", price: "1-1.50 USD", when: "Late afternoon into the evening, ~15:00-21:00", where: "Carts around the markets and on side streets off Sivatha Boulevard", tip: "Ask for the fried egg on top and eat it straight off the wok while it is still smoky." },
      { name: "Num pang baguette carts", dish: "Num pang — crusty baguette stuffed with pate, pork, pickled papaya and chilli", price: "1-1.50 USD", when: "Mornings ~6:00-10:00, and again in the evening", where: "Carts near the markets and school gates around central Siem Reap", tip: "Ask for it toasted, and only say yes to extra chilli if you mean it." },
    ],
    sources: [{ org: "Ministry of Tourism Cambodia", url: "https://www.tourismcambodia.org" }, { org: "Lonely Planet — Siem Reap", url: "https://www.lonelyplanet.com/cambodia/siem-reap" }],
  },
  {
    slug: "kampot", city: "Kampot", country: "kh", verified: "2026-07",
    intro: "Kampot is a slow riverside town in southern Cambodia, famous for its pepper farms and the giant durian statue on the main roundabout. Local life runs on Phsar Samaki market by day and the riverfront and night-market stalls after dark.",
    markets: [
      { name: "Phsar Samaki (Kampot Central Market)", when: "Daily, ~6:00-17:00; busiest and freshest before ~9:00", where: "Town centre, a few blocks inland from the riverfront", what: "The main local market: fruit and veg, fresh fish, meat, rice, spices, dry goods, cheap clothes and household items", tip: "Go before 9am for the freshest fruit and fish, and carry small riel notes because stallholders rarely have change for big bills." },
      { name: "Kampot Night Market", when: "Daily, ~16:00-22:00", where: "Town centre, a short walk from the riverfront near the Durian Roundabout", what: "Rows of street-food stalls with grilled skewers, fried noodles, desserts and drinks, plus cheap clothes and toys", tip: "Eat where the local families are clustered and just point at what you want; most plates cost well under 2 USD." },
      { name: "Kep Crab Market (Phsar Kdam)", when: "Daily, ~7:00-19:00; crab is freshest in the morning", where: "On the seafront in Kep, ~25 km / ~40 minutes from Kampot by tuk-tuk or moto (a day trip, not in Kampot itself)", what: "Live crab, prawns and squid pulled straight from the traps and cooked on the spot, classically fried with green Kampot pepper", tip: "Agree the price per kilo in USD or riel before your crab goes in the pot, and go in the morning when the catch comes in." },
    ],
    shopLocal: [
      { what: "Fresh fruit and vegetables", where: "Produce aisles at Phsar Samaki; seasonal fruit stalls also appear around the Durian Roundabout", tip: "Buy whatever is in season by the kilo - durian, mango, mangosteen or rambutan - and let the seller pick ripe ones for you." },
      { what: "Kampot pepper (fresh green, black, red, white)", where: "Farm-gate shops at the pepper farms out toward Secret Lake, such as La Plantation, or dry-goods stalls in Phsar Samaki", tip: "Farm shops let you taste before you buy and label the harvest, which is worth the tuk-tuk ride over buying blind at a souvenir stand." },
      { what: "Everyday groceries, snacks, toiletries and drinking water", where: "Small minimarts scattered around the town centre and riverfront streets", tip: "Prices are usually marked in USD but change comes back in riel, so know the rough 4,000-riel-per-dollar rate before you pay." },
    ],
    family: [
      { item: "Nappies/diapers", where: "Pharmacies and larger minimarts around Phsar Samaki and the town centre", price: "4-7 USD per small pack", tip: "Kampot shops carry only a few brands and sizes, so stock up at a big supermarket in Phnom Penh before you travel and treat local stock as a top-up." },
      { item: "Baby formula", where: "Pharmacies in the town centre, especially those near the central market", price: "10-20 USD per tin", tip: "Buy sealed tins from a proper pharmacy rather than open market shelves, and check the seal and expiry date before paying." },
    ],
    cheapEats: [
      { name: "Bai sach chrouk breakfast stalls", dish: "Charcoal-grilled pork over broken rice with pickles and clear soup", price: "1-1.50 USD", where: "Morning stalls around Phsar Samaki and along the streets of the town centre", tip: "It sells out by mid-morning, so treat it as breakfast, not lunch." },
      { name: "Kuy teav noodle soup stalls", dish: "Rice-noodle soup with pork or beef, herbs and lime", price: "1-2 USD", where: "Inside and around Phsar Samaki in the mornings", tip: "Add the herbs, bean sprouts and lime from the table basket yourself - that is how locals finish the bowl." },
      { name: "Night market rice and noodle plates", dish: "Fried rice, lort cha (fried short noodles) and stir-fries cooked to order", price: "1.50-3 USD", where: "Kampot Night Market stalls near the Durian Roundabout", tip: "Pick the stall with the longest local queue; a fried egg on top costs only a little extra." },
    ],
    streetFood: [
      { name: "Night market grill stalls", dish: "Grilled chicken and pork skewers with dipping sauce, plus lort cha off the flat-top", price: "0.50-2 USD", when: "Daily evenings, ~17:00-22:00", where: "Kampot Night Market, town centre near the Durian Roundabout", tip: "Skewers are grilled in batches, so take the ones coming straight off the coals rather than the tray that has been sitting." },
      { name: "Num pang baguette carts", dish: "Khmer baguette sandwich with pate, pickled vegetables, chilli and herbs", price: "1-1.50 USD", when: "Mornings ~6:00-10:00 and again late afternoon", where: "Carts around the central market and along the main streets of the town centre", tip: "Say no chilli if you are buying for kids, because the default spread has real heat." },
      { name: "Riverfront fruit-shake carts", dish: "Tuk kalok fruit shakes - mango, banana or mixed fruit blended with ice and condensed milk", price: "0.75-1.25 USD", when: "Daily, ~16:00-21:00", where: "Along the riverside promenade in the town centre", tip: "Ask for less sugar and less condensed milk unless you like it very sweet." },
    ],
    sources: [{ org: "Ministry of Tourism Cambodia", url: "https://www.mot.gov.kh" }, { org: "Lonely Planet - Cambodia", url: "https://www.lonelyplanet.com/cambodia" }],
  },
  {
    slug: "battambang", city: "Battambang", country: "kh", verified: "2026-07",
    intro: "Battambang is a low-rise riverside city on the Sangker River, and daily life still revolves around the 1930s art-deco Psar Nat market in the dead centre of town. Some of the cheapest and most local food is at market stalls at breakfast time and at the riverside stalls after dark, all within walking distance of the Street 1-3 grid.",
    markets: [
      { name: "Psar Nat (Phsar Nat)", when: "Daily, ~5:30-17:00; produce is freshest before ~9:00", where: "Town centre, the art-deco building with the clock tower between Street 1 and Street 3", what: "Fruit, vegetables, meat, fish, rice, spices, flowers, plus gold shops, clothing and household goods around the edges", tip: "Go before ~8:00 with small riel notes, because that is when locals shop and the fish and greens are freshest." },
      { name: "Phsar Boeung Chhouk", when: "Daily, ~5:00-17:00; busiest in the early morning", where: "West side of town, about 10 minutes by tuk-tuk from Psar Nat", what: "A big everyday market where locals buy produce, prahok, dried fish and bulk goods at lower prices than the centre", tip: "Prices here are what Battambang families actually pay, so it is a good place to learn real fruit prices before you bargain anywhere else." },
      { name: "Riverside evening stalls and night market", when: "Daily, ~16:00-21:30", where: "Along the Sangker River promenade near Psar Nat and the old bridge", what: "Grilled skewers, fried noodles, desserts, fruit shakes and snacks, with families eating on plastic stools", tip: "Come around sunset when the stalls are in full swing and pick whichever grill has the longest local queue." },
    ],
    shopLocal: [
      { what: "Battambang oranges and seasonal fruit by the kilo (~1-2 USD/kg)", where: "Fruit stalls on the outer ring of Psar Nat and roadside sellers on the main roads out of town", tip: "Ask for the green-skinned Battambang oranges, which are sweet despite the colour, and buy by the kilo rather than by the piece." },
      { what: "Fresh rice paper straight from the family workshops that dry it on bamboo racks", where: "Rice-paper making villages on the road north towards Wat Ek Phnom (around Peam Ek)", tip: "Stop where you see the drying racks by the road, watch a sheet being made, and a small purchase is a welcome thank-you." },
      { what: "Prahok (fermented fish paste) and kroeung curry paste, scooped to order", where: "The fermented-fish and paste sections inside Phsar Boeung Chhouk and Psar Nat", tip: "Have the seller double-bag it, because the smell is strong and it will fill a tuk-tuk in minutes." },
    ],
    family: [
      { item: "Nappies (diapers) and baby wipes", where: "Pharmacies and minimarts around Psar Nat and along Street 3, plus baby-goods stalls inside the market", price: "~5-10 USD per ~30-pack", tip: "Selection is thin and sizes run small, so stock up at a big supermarket in Phnom Penh or Siem Reap before you arrive and treat Battambang as top-up only." },
      { item: "Infant formula and baby food", where: "Pharmacies near Psar Nat and the larger minimarts in the town centre", price: "~10-25 USD per tin", tip: "Check the seal and expiry date before paying, and bring enough of your usual brand from a bigger city because familiar international brands are hit-and-miss here." },
    ],
    cheapEats: [
      { name: "Psar Nat breakfast stalls", dish: "Bay sach chrouk (grilled pork over rice) or kuy teav noodle soup", price: "~1-1.75 USD", where: "Food stalls in and around Psar Nat, ~5:30-9:00", tip: "Sit at whichever stall the moto drivers are eating at and point at what your neighbour has." },
      { name: "Chinese Noodle Dumpling (Lan Chou)", dish: "Hand-pulled noodles and fried pork dumplings", price: "~1-2 USD per plate", where: "Small family-run shop near Psar Nat in the Street 2 area", tip: "Order one plate of noodles and one of fried dumplings to share, and watch the noodles being pulled by hand at the front." },
      { name: "Nom banh chok morning vendors", dish: "Khmer rice noodles with fish-based green curry gravy and fresh herbs", price: "~0.50-1 USD", where: "Morning vendors with baskets around the markets and residential streets", tip: "This is a breakfast dish, so look for it before mid-morning because the vendors sell out and go home." },
    ],
    streetFood: [
      { name: "Sangker riverside grill stalls", dish: "Grilled chicken and pork skewers, fried noodles, papaya salad", price: "~0.50-2 USD", when: "Daily, ~16:00-21:00", where: "East bank riverside promenade opposite the town centre, near the bridges", tip: "Skewers are grilled to order, so hand yours over and grab a plastic stool while you wait." },
      { name: "Tuk kalok fruit-shake carts", dish: "Blended fruit shakes with condensed milk (mango, dragon fruit, banana)", price: "~0.75-1 USD", when: "Daily, mostly ~15:00-21:00", where: "Carts near Psar Nat and along the riverside", tip: "Ask for less sugar and no extra condensed milk if you want the fruit to do the talking." },
      { name: "Num kachay griddle carts", dish: "Fried chive cakes with sweet-sour fish-sauce dip", price: "~0.25-0.50 USD each", when: "Afternoons into the evening, ~14:00-19:00", where: "Street carts around the markets and school gates", tip: "They are at their tastiest straight off the griddle, so eat them hot on the spot rather than taking a bag away." },
    ],
    sources: [{ org: "Ministry of Tourism Cambodia", url: "https://www.tourismcambodia.org" }, { org: "Lonely Planet - Battambang", url: "https://www.lonelyplanet.com/cambodia/battambang" }],
  },
];
