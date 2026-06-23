// Cambodia intercity + cross-border transport reference.
// Guidance only. Prices are RANGES and shift with season, fuel, and operator promotions.
// US dollars circulate everywhere alongside Cambodian riel (KHR); small change is often given in riel.
// Verify border status and visa rules with official sources before travelling.
export const ROUTES_KH = [
  {
    id: "kh-pnh-rep-bus",
    from: "Phnom Penh",
    to: "Siem Reap",
    country: "kh",
    verified: "2026-06",
    sources: [
      { org: "Giant Ibis Transport", url: "https://www.giantibis.com/" },
      { org: "Cambodia Ministry of Tourism", url: "https://www.tourismcambodia.org/" }
    ],
    options: [
      {
        mode: "Express bus",
        durationHrs: [5, 7],
        price: { low: 50000, high: 145000, currency: "KHR" },
        freq: "several daily, morning through overnight",
        comfort: "Reputable lines (Giant Ibis, Mekong Express) have air-conditioning, assigned seats, Wi-Fi and a rest stop; tourist and VIP classes cost more.",
        bookVia: "Operator website (giantibis.com) or aggregators such as BookMeBus, Camboticket or 12Go",
        recommended: true,
        notes: "Roughly 10 to 35 US dollars depending on class. The best value for the Phnom Penh to Siem Reap corridor; book a day ahead in high season."
      },
      {
        mode: "Domestic flight",
        durationHrs: [1, 1.5],
        price: { low: 200000, high: 460000, currency: "KHR" },
        freq: "a few daily",
        comfort: "Fastest option but add airport transfer time at both ends; baggage allowance is limited.",
        bookVia: "Cambodia Angkor Air or Air Cambodia via airline site or an OTA",
        recommended: false,
        notes: "About 50 to 110 US dollars. Door-to-door time savings are modest given short driving distance; worth it only when time is tight."
      },
      {
        mode: "Private taxi / minivan",
        durationHrs: [4.5, 6],
        price: { low: 240000, high: 360000, currency: "KHR" },
        freq: "on demand",
        comfort: "Door to door and flexible, but shared minivans can be cramped and drive fast.",
        bookVia: "Hotel desk, PassApp, or pre-arranged private car",
        recommended: false,
        notes: "Around 60 to 90 US dollars for a private car split among passengers."
      }
    ]
  },
  {
    id: "kh-pnh-sihanoukville-bus",
    from: "Phnom Penh",
    to: "Sihanoukville",
    country: "kh",
    verified: "2026-06",
    sources: [
      { org: "Giant Ibis Transport", url: "https://www.giantibis.com/" },
      { org: "Cambodia Ministry of Tourism", url: "https://www.tourismcambodia.org/" }
    ],
    options: [
      {
        mode: "Express bus",
        durationHrs: [4, 5.5],
        price: { low: 40000, high: 120000, currency: "KHR" },
        freq: "several daily",
        comfort: "Air-conditioned coaches on the expressway; standard for reaching the southern coast and ferries to Koh Rong.",
        bookVia: "Operator site or BookMeBus / Camboticket",
        recommended: true,
        notes: "Roughly 10 to 28 US dollars. The expressway has cut journey time; depart early to catch afternoon island ferries."
      },
      {
        mode: "Shared minivan",
        durationHrs: [3.5, 5],
        price: { low: 48000, high: 90000, currency: "KHR" },
        freq: "frequent",
        comfort: "Faster but tighter seating and brisker driving than full-size buses.",
        bookVia: "Hotel desk or 12Go",
        recommended: false,
        notes: "Around 12 to 22 US dollars."
      }
    ]
  },
  {
    id: "kh-rep-battambang-boat",
    from: "Siem Reap",
    to: "Battambang",
    country: "kh",
    verified: "2026-06",
    sources: [
      { org: "Cambodia Ministry of Tourism", url: "https://www.tourismcambodia.org/" }
    ],
    options: [
      {
        mode: "Scenic river boat",
        durationHrs: [6, 9],
        price: { low: 80000, high: 130000, currency: "KHR" },
        freq: "daily in season, water-level dependent",
        comfort: "A slow, memorable passage along the Sangkae River and Tonle Sap floating villages; basic boats with no toilet on some craft. Service shrinks or stops in the dry season when water is low.",
        bookVia: "Hotel or guesthouse desk in Siem Reap",
        recommended: false,
        notes: "About 20 to 32 US dollars. Choose this for the experience, not for speed or reliability; confirm it is running before relying on it."
      },
      {
        mode: "Express bus / minivan",
        durationHrs: [3, 4],
        price: { low: 28000, high: 80000, currency: "KHR" },
        freq: "several daily",
        comfort: "Quick and inexpensive road option; the practical default for this leg.",
        bookVia: "BookMeBus, Camboticket or hotel desk",
        recommended: true,
        notes: "Roughly 7 to 20 US dollars. Far more dependable than the boat year-round."
      }
    ]
  },
  {
    id: "kh-cross-bavet-hcmc",
    from: "Phnom Penh",
    to: "Ho Chi Minh City (Vietnam)",
    country: "kh",
    verified: "2026-06",
    crossBorder: true,
    border: "Bavet (Cambodia) / Moc Bai (Vietnam)",
    visa: {
      note: "Most nationalities need a Vietnam visa or e-visa arranged BEFORE travel; Vietnam visa-on-arrival is generally not available at the Moc Bai land crossing, so apply via the official e-visa portal in advance. A Cambodian e-visa or visa-on-arrival covers the Cambodian side. Verify current rules with the relevant embassy."
    },
    scamWarnings: [
      "Touts or fixers at the border may demand an extra processing or stamp fee in cash; legitimate Cambodian and Vietnamese immigration fees are posted and you should not pay informal surcharges.",
      "Do not hand your passport to a stranger who is not a uniformed immigration officer; keep it with you through both checkpoints."
    ],
    sources: [
      { org: "Vietnam National Authority of Tourism", url: "https://vietnam.travel/" },
      { org: "Vietnam Immigration (official e-visa portal)", url: "https://evisa.gov.vn/" },
      { org: "Giant Ibis Transport", url: "https://www.giantibis.com/" }
    ],
    options: [
      {
        mode: "Cross-border bus",
        durationHrs: [6, 8],
        price: { low: 48000, high: 165000, currency: "KHR" },
        freq: "several daily",
        comfort: "Direct coaches (Giant Ibis, Kumho Samco, Sapaco, Virak Buntham) run through to Ho Chi Minh City; staff help shepherd passengers through Bavet/Moc Bai formalities. The crossing is open and operating normally, typically daytime hours.",
        bookVia: "Operator site, 12Go or Baolau",
        recommended: true,
        notes: "Roughly 12 to 40 US dollars. The standard and reliable way between the two capitals of the region; carry your Vietnam e-visa printout."
      },
      {
        mode: "Flight",
        durationHrs: [1, 1.5],
        price: { low: 240000, high: 600000, currency: "KHR" },
        freq: "multiple daily",
        comfort: "Fastest and avoids the land border entirely; add airport time.",
        bookVia: "Vietnam Airlines, Vietjet or Cambodia Angkor Air via airline site or OTA",
        recommended: false,
        notes: "About 60 to 145 US dollars depending on how far ahead you book."
      }
    ]
  },
  {
    id: "kh-cross-bkk-air",
    from: "Phnom Penh",
    to: "Bangkok (Thailand)",
    country: "kh",
    verified: "2026-06",
    crossBorder: true,
    border: "Poipet (Cambodia) / Aranyaprathet (Thailand) land crossing — reported CLOSED in 2026; air is the working route",
    visa: {
      note: "Many Western passports receive Thailand visa-exemption entry on arrival by air; Cambodian e-visa or visa-on-arrival applies on the Cambodian side. The Poipet/Aranyaprathet land border has been closed since mid-2025 following border tensions, with no confirmed full reopening in 2026 — confirm current status and visa rules with the embassy before travel."
    },
    scamWarnings: [
      "If land crossing is attempted when reopened, beware the long-standing Poipet visa overcharge scam where touts collect inflated visa fees at fake or unofficial counters; only pay at the official Cambodian immigration window.",
      "Do not rely on rumours that the land border has reopened; check official Thai and Cambodian government advisories first."
    ],
    sources: [
      { org: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org/" },
      { org: "Cambodia Ministry of Tourism", url: "https://www.tourismcambodia.org/" }
    ],
    options: [
      {
        mode: "Flight",
        durationHrs: [1, 1.5],
        price: { low: 240000, high: 720000, currency: "KHR" },
        freq: "multiple daily",
        comfort: "With the Poipet land border closed, flying is the practical and recommended way between Phnom Penh and Bangkok; Siem Reap also has direct flights.",
        bookVia: "Thai Airways, Vietjet, AirAsia or Cambodia Angkor Air via airline site or OTA",
        recommended: true,
        notes: "About 60 to 175 US dollars. Land buses via Poipet are not running reliably in 2026; treat any overland offer with caution and verify the border is open."
      }
    ]
  }
];
