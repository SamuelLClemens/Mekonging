export const INFO_VI = {
  country: "vi", name: "Vietnam", currency: "VND", verified: "2026-06",
  emergency: [
    { label: "Police", number: "113" },
    { label: "Fire", number: "114" },
    { label: "Ambulance / Medical", number: "115" },
    { label: "Search & Rescue / Disasters", number: "112" }
  ],
  sections: [
    {
      id: "money",
      title: "Money & ATMs",
      body: [
        "The currency is the Vietnamese dong (VND); notes run into the hundreds of thousands, so double-check zeros before paying.",
        "ATMs are widespread in cities and tourist areas; per-withdrawal limits are often modest (roughly 2,000,000-5,000,000 VND) and most charge a foreign-card fee of around 22,000-55,000 VND.",
        "Vietnam is still largely cash-first for street food, markets and taxis; cards and QR wallets (MoMo, ZaloPay) work in many hotels, malls and chains.",
        "Carry small notes for change, and treat any quoted rate as guidance only since exchange rates and bank fees move daily."
      ]
    },
    {
      id: "sim",
      title: "SIM & connectivity",
      body: [
        "Local prepaid SIMs and eSIMs from Viettel, Vinaphone and Mobifone are cheap and offer strong 4G; tourist data packages commonly cost the equivalent of a few US dollars for generous data over a week or two.",
        "You can buy a SIM at the airport or official carrier shops; bring your passport, as registration is required by law.",
        "Coverage is excellent in cities and along the coast and weaker in remote mountains; free Wi-Fi is very common in cafes and hotels."
      ]
    },
    {
      id: "visa",
      title: "Visa basics",
      body: [
        "Many travellers use Vietnam\"s electronic visa (e-visa), which is generally issued for up to 90 days as single or multiple entry; apply only through the official government portal to avoid scam sites.",
        "Some nationalities enjoy short visa exemptions, and rules, fees and eligible entry points change frequently, so treat this as guidance and confirm your own nationality before travel.",
        "Keep a printed copy of an approved e-visa and ensure your passport has at least six months validity."
      ],
      verifyAt: { org: "Vietnam Immigration (National Electronic Visa Portal)", url: "https://evisa.gov.vn" }
    },
    {
      id: "safety",
      title: "Safety",
      body: [
        "Vietnam is generally safe for travellers; the most common issues are petty theft, bag-snatching from passing motorbikes, and overcharging or taxi scams.",
        "Keep phones and bags away from the roadside, use reputable ride apps such as Grab, and agree fares or use the meter in advance.",
        "Road traffic is the biggest practical risk; cross slowly and predictably, and wear a helmet if you ride a motorbike. Always check your government\"s current travel advice before and during your trip."
      ],
      verifyAt: { org: "U.S. Embassy & Consulate in Vietnam", url: "https://vn.usembassy.gov" }
    },
    {
      id: "water",
      title: "Water & health",
      body: [
        "Tap water is not considered safe to drink; use sealed bottled or properly filtered water, and be cautious with ice outside established venues.",
        "Travellers\" stomach upsets are common; favour busy, freshly cooked food stalls and peelable fruit.",
        "Consider travel insurance with medical evacuation; private international clinics in major cities are good but can be expensive, and check recommended vaccinations with a clinic before you go."
      ]
    },
    {
      id: "etiquette",
      title: "Etiquette",
      body: [
        "Dress modestly at temples and pagodas, covering shoulders and knees, and remove shoes where indicated.",
        "It is polite to use both hands when giving or receiving items, and to avoid public displays of anger, since composure is valued.",
        "Tipping is appreciated but not obligatory; rounding up or leaving small change is common in tourist areas."
      ]
    },
    {
      id: "besttime",
      title: "Best time to visit",
      body: [
        "Vietnam is long and spans several climates, so there is no single ideal season; broadly, spring (roughly March-April) and autumn (roughly September-November) are comfortable in many regions.",
        "The north (Hanoi, Sapa) is cool and misty in winter and hot, wet in summer; the centre (Hue, Da Nang, Hoi An) sees heavy rain and storm risk around October-November.",
        "The south (Ho Chi Minh City, Mekong Delta) is warm year-round with a dry season around December-April; expect crowds and higher prices around the Tet lunar new year."
      ]
    },
    { id: 'driving', title: 'Renting a car / driving', body: [
      'Vietnam drives on the right. It recognises International Driving Permits issued under the 1968 Vienna Convention; permits issued under the older 1949 Geneva Convention, which several Western countries still use, are not officially valid here, so confirm which permit your country issues.',
      'Because city traffic is dense, most visitors hire a car with a driver rather than self-driving; this is widely available and reasonably priced. Self-drive car hire exists but is uncommon.',
      'Renting a motorbike is popular but legally needs a Vietnamese licence or a valid 1968-style permit with the correct category. Police do stop and fine foreign riders, and riding without the correct licence can void medical insurance.',
      'Helmets are compulsory. Ride defensively, avoid rural night driving, and note that the central coast is exposed to typhoons from roughly September to November.',
    ], verifyAt: { org: 'Vietnam National Authority of Tourism', url: 'https://vietnam.travel' } },
    { id: 'beach-safety', title: 'Beach & jellyfish safety', body: [
      'Rip currents affect popular beaches such as those at Da Nang, Nha Trang and Mui Ne. Swim between the flags where lifeguards operate, and stay out of the sea during and after the September to November storm season on the central coast.',
      'Jellyfish blooms occur seasonally, most often in the hotter months; stings are usually painful rather than dangerous, though box jellyfish are present in the region. Douse a sting with vinegar, remove tentacles without bare hands, and seek help if symptoms spread.',
      'Sea urchins and stonefish live on rocky sections, so wear water shoes. Reef-safe sunscreen protects both you and the coral.',
    ], verifyAt: { org: 'Vietnam National Authority of Tourism', url: 'https://vietnam.travel' } },
    { id: 'value', title: 'Best value: cheapest for the best', body: [
      'The best pho, banh mi and bun cha come from pavement stalls with low plastic stools, not sit-down restaurants, for a fraction of the price.',
      'Buy fruit and snacks at wet markets and from street vendors; fixed-price stores (Circle K, WinMart) are pricier but handy for water and SIMs.',
      'For coffee, a street ca phe sua da costs a fraction of a cafe price, and egg coffee is the affordable Hanoi treat.',
      'Use Grab (bike or car) for fair, app-metered city rides, and agree any non-app fare first; sleeper buses and trains are cheap for long hops.',
      'Bargain at markets, starting around half the asking price, but not in fixed-price shops or for street food.',
    ] }
  ],
  sources: [
    { org: "Vietnam Immigration (National Electronic Visa Portal)", url: "https://evisa.gov.vn" },
    { org: "Vietnam National Administration of Tourism", url: "https://vietnamtourism.gov.vn" },
    { org: "U.S. Embassy & Consulate in Vietnam", url: "https://vn.usembassy.gov" },
    { org: "UK FCDO Travel Advice", url: "https://www.gov.uk/foreign-travel-advice/vietnam" },
    { org: "Grab", url: "https://www.grab.com" }
  ]
};
