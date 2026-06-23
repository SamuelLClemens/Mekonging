export const INFO_KH = {
  country: "kh", name: "Cambodia", currency: "KHR", verified: "2026-06",
  emergency: [
    { label: "Police", number: "117" },
    { label: "Fire", number: "118" },
    { label: "Ambulance / Rescue", number: "119" },
    { label: "Tourist Police (Phnom Penh)", number: "+855 12 942 484" }
  ],
  sections: [
    {
      id: "money",
      title: "Money & ATMs",
      body: [
        "Cambodia runs on two currencies at once: the US dollar is used for most everyday transactions and the Cambodian riel (KHR) mainly serves as change for amounts under one dollar, so carry clean, untorn dollar notes.",
        "Exchange rates hover around 4,000-4,100 KHR to the US dollar; treat that as guidance only and confirm the rate of the day before changing money.",
        "ATMs are widespread in Phnom Penh, Siem Reap and other towns and typically dispense US dollars, often with a withdrawal fee in the range of 4-6 USD per transaction, so larger, less frequent withdrawals reduce cost.",
        "Cards are accepted at hotels, larger restaurants and tourist shops, but markets, tuk-tuks and rural areas remain cash-first; the local KHQR scan-to-pay system is also common."
      ]
    },
    {
      id: "sim",
      title: "SIM & connectivity",
      body: [
        "Prepaid tourist SIM cards from operators such as Cellcard, Smart and Metfone are cheap and easy to buy; data-focused packages commonly fall in the 5-15 USD range depending on data volume and validity.",
        "Bring your passport, as SIM registration is required at the point of sale.",
        "4G coverage is good across cities and main tourist areas and reasonable on major routes; expect weaker signal in remote provinces.",
        "eSIM options are available from several international and local providers if your phone supports them."
      ]
    },
    {
      id: "visa",
      title: "Visa basics",
      body: [
        "Most visitors need a tourist visa; a 30-day tourist visa is typically obtainable via the official e-Visa portal before travel, on arrival at major airports and some land borders, or at a Cambodian embassy.",
        "Indicative costs are around 30 USD for the visa itself, with the online e-Visa carrying a small processing surcharge (roughly 36 USD total); visa-on-arrival is usually paid in US dollars cash and a passport photo is helpful.",
        "Air arrivals are generally required to complete the free Cambodia e-Arrival (CeA) digital form shortly before arrival.",
        "Rules, fees and eligible entry points change; confirm requirements for your nationality on the official sources before you travel."
      ],
      verifyAt: { org: "Royal Government of Cambodia e-Visa", url: "https://www.evisa.gov.kh/" }
    },
    {
      id: "safety",
      title: "Safety",
      body: [
        "Cambodia is generally welcoming to visitors, but petty crime such as bag-snatching and phone theft from moving motorbikes occurs in Phnom Penh and other towns, so keep bags on the inside of the pavement and avoid displaying valuables.",
        "Use reputable transport, agree fares in advance, and be cautious of scams and overcharging around busy tourist sites.",
        "Never stray off marked paths in rural or border areas: unexploded ordnance and landmines remain a risk in some regions.",
        "Check your government travel advisory before and during your trip, as guidance can change."
      ],
      verifyAt: { org: "UK FCDO Travel Advice", url: "https://www.gov.uk/foreign-travel-advice/cambodia" }
    },
    {
      id: "water",
      title: "Water & health",
      body: [
        "Do not drink tap water; stick to sealed bottled or properly filtered water and be cautious with ice from unknown sources.",
        "Mosquito-borne illnesses including dengue are present, so use repellent and cover up at dawn and dusk; malaria risk exists mainly in forested and border areas.",
        "Consult a travel clinic well before departure about routine and recommended vaccinations such as hepatitis A and typhoid.",
        "Quality private hospitals and clinics exist in Phnom Penh and Siem Reap, but serious cases may require evacuation to Bangkok, so comprehensive travel insurance with medical evacuation cover is strongly advised."
      ]
    },
    {
      id: "etiquette",
      title: "Etiquette",
      body: [
        "The traditional greeting is the sampeah, a slight bow with palms pressed together; a friendly version is appreciated, especially with older people.",
        "Dress modestly at temples and the Royal Palace, covering shoulders and knees, and remove shoes and hats where required.",
        "Avoid touching anyone on the head and do not point your feet at people or Buddha images, as both are considered disrespectful.",
        "Public displays of anger or causing someone to lose face are frowned upon; a calm, smiling manner goes a long way."
      ]
    },
    {
      id: "best-time",
      title: "Best time to visit",
      body: [
        "The cool, dry season from roughly November to February offers the most comfortable weather and is the peak time to visit Angkor and the coast.",
        "March to May is the hot season, with temperatures often climbing well above the mid-30s Celsius.",
        "The wet season from around June to October brings heavy afternoon downpours but lush green landscapes, fuller waterfalls and fewer crowds.",
        "Treat these as general patterns, as timing and intensity vary year to year."
      ]
    }
  ],
  sources: [
    { org: "Royal Government of Cambodia e-Visa", url: "https://www.evisa.gov.kh/" },
    { org: "Cambodia e-Arrival", url: "https://arrival.gov.kh/" },
    { org: "Telecommunication Regulator of Cambodia", url: "https://www.trc.gov.kh/" },
    { org: "Tourism Cambodia", url: "https://www.tourismcambodia.com/" },
    { org: "UK FCDO Travel Advice", url: "https://www.gov.uk/foreign-travel-advice/cambodia" }
  ]
};
