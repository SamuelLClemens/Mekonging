// Cambodia transport routes — intercity plus outbound cross-border. Each option
// lists a guidance price range, journey time, frequency, comfort note and how to book.
// Figures change with season and operator, so confirm before travel.
export const ROUTES_KH = [
  {
    "id": "kh-phnompenh-siemreap",
    "from": "Phnom Penh",
    "to": "Siem Reap",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP bus",
        "durationHrs": [
          5.5,
          6.5
        ],
        "price": {
          "low": 17,
          "high": 35,
          "currency": "USD"
        },
        "freq": "several daily, morning, noon and overnight",
        "comfort": "Reclining seats, air-con, Wi-Fi, charging points, onboard snacks and a rest stop; the most reliable operator class on the route.",
        "bookVia": "Giant Ibis direct, or BookMeBus / 12Go",
        "recommended": true,
        "notes": "National Road 6 is fully paved; Giant Ibis and Mekong Express are the safest-driving operators. Sleeper-class overnight services exist but the daytime VIP is the comfortable default."
      },
      {
        "mode": "Standard tourist bus",
        "durationHrs": [
          6,
          7.5
        ],
        "price": {
          "low": 10,
          "high": 16,
          "currency": "USD"
        },
        "freq": "very frequent throughout the day",
        "comfort": "Air-con coaches with more stops; quality varies widely between budget operators.",
        "bookVia": "BookMeBus, 12Go or redBus",
        "recommended": false,
        "notes": "Cheaper local operators may overload seats and stop often. Stick to named brands for predictable timing."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          5,
          6
        ],
        "price": {
          "low": 13,
          "high": 18,
          "currency": "USD"
        },
        "freq": "multiple daily departures",
        "comfort": "Faster than big buses but cramped; drivers can be aggressive. Suited to those prioritising speed over space.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "There is no scheduled passenger train on this corridor; the choice is road or air."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          0.7,
          1
        ],
        "price": {
          "low": 70,
          "high": 160,
          "currency": "USD"
        },
        "freq": "several daily",
        "comfort": "40-minute hop; total door-to-door time saving is modest once airport transfers are added.",
        "bookVia": "Cambodia Angkor Air / Air Cambodia, AirAsia Cambodia",
        "recommended": false,
        "notes": "Only worth it if you value time over money; the bus is the standard tourist choice."
      }
    ]
  },
  {
    "id": "kh-phnompenh-battambang",
    "from": "Phnom Penh",
    "to": "Battambang",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP bus",
        "durationHrs": [
          5,
          6.5
        ],
        "price": {
          "low": 12,
          "high": 22,
          "currency": "USD"
        },
        "freq": "several daily",
        "comfort": "Air-con coach with reclining seats and a mid-route rest stop; comfortable and predictable with Giant Ibis or Mekong Express.",
        "bookVia": "Giant Ibis direct, BookMeBus or 12Go",
        "recommended": true,
        "notes": "Around 290 km via National Roads 5/6. Daytime departures give river-and-rice-field scenery."
      },
      {
        "mode": "Standard bus",
        "durationHrs": [
          5.5,
          8
        ],
        "price": {
          "low": 7,
          "high": 12,
          "currency": "USD"
        },
        "freq": "frequent",
        "comfort": "Budget coaches with frequent stops; basic but adequate.",
        "bookVia": "redBus or CheckMyBus",
        "recommended": false,
        "notes": "Cambolink21 and Airbus run this route alongside the premium brands."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          4.5,
          5.5
        ],
        "price": {
          "low": 9,
          "high": 13,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "Quicker with fewer stops but tight legroom; Larryta Express is a common operator.",
        "bookVia": "Bookaway or 12Go",
        "recommended": false,
        "notes": "Best for travellers wanting the fastest road option."
      },
      {
        "mode": "Train",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 8,
          "high": 8,
          "currency": "USD"
        },
        "freq": "Northern Line, roughly daily, schedule varies",
        "comfort": "Slow but scenic and stable Royal Railway service; a relaxed novelty rather than a fast option.",
        "bookVia": "Royal Railway (royal-railway.com.kh) or at the station",
        "recommended": false,
        "notes": "Confirm the Northern Line timetable locally, as departures are limited and subject to change."
      }
    ]
  },
  {
    "id": "kh-phnompenh-sihanoukville",
    "from": "Phnom Penh",
    "to": "Sihanoukville",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP bus (expressway)",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 12,
          "high": 25,
          "currency": "USD"
        },
        "freq": "very frequent throughout the day",
        "comfort": "Modern coaches running the Phnom Penh-Sihanoukville Expressway, cutting the trip to roughly three hours; the fastest and smoothest road option.",
        "bookVia": "Giant Ibis, Vireak Buntham or BookMeBus / 12Go",
        "recommended": true,
        "notes": "Confirm the bus actually uses the expressway; older National Road 4 services take longer. Sihanoukville is heavily developed with casinos, so most travellers use it only as a ferry gateway to the islands."
      },
      {
        "mode": "Standard bus",
        "durationHrs": [
          4,
          5
        ],
        "price": {
          "low": 10,
          "high": 15,
          "currency": "USD"
        },
        "freq": "very frequent",
        "comfort": "Air-con coaches on National Road 4 with stops; serviceable budget choice.",
        "bookVia": "redBus or CheckMyBus",
        "recommended": false,
        "notes": "Larryta and VET Air Bus among many operators."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 11,
          "high": 16,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "Fast but cramped; door-to-door pickup sometimes offered.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Useful if departure timing matters more than space."
      },
      {
        "mode": "Train",
        "durationHrs": [
          5.5,
          6
        ],
        "price": {
          "low": 10,
          "high": 12,
          "currency": "USD"
        },
        "freq": "Southern Line, limited days, check schedule",
        "comfort": "Royal Railway service via Takeo, Kampot and Kep; scenic and stable but much slower than the expressway bus.",
        "bookVia": "Royal Railway or at the station",
        "recommended": false,
        "notes": "Departures are limited; verify the current Southern Line timetable before relying on it."
      }
    ]
  },
  {
    "id": "kh-phnompenh-kampot",
    "from": "Phnom Penh",
    "to": "Kampot",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 8,
          "high": 12,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "The quickest road option with fewer stops; tight but acceptable for the short run.",
        "bookVia": "12Go or Bookaway",
        "recommended": true,
        "notes": "Around 148 km. Kampot is a relaxed riverside town; minivans are the locals' default for this distance."
      },
      {
        "mode": "VIP bus",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 8,
          "high": 13,
          "currency": "USD"
        },
        "freq": "several daily",
        "comfort": "Giant Ibis and similar offer comfortable air-con coaches; more space than a minivan.",
        "bookVia": "Giant Ibis or BookMeBus",
        "recommended": false,
        "notes": "Slightly slower than the minivan but more comfortable for nervous passengers."
      },
      {
        "mode": "Standard bus",
        "durationHrs": [
          3.5,
          4.5
        ],
        "price": {
          "low": 6,
          "high": 10,
          "currency": "USD"
        },
        "freq": "frequent",
        "comfort": "Budget coach with stops; cheapest way down.",
        "bookVia": "redBus or CheckMyBus",
        "recommended": false,
        "notes": "Some services continue to Kep or Sihanoukville."
      }
    ]
  },
  {
    "id": "kh-phnompenh-kep",
    "from": "Phnom Penh",
    "to": "Kep",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          3,
          3.5
        ],
        "price": {
          "low": 9,
          "high": 13,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "Fastest direct option; many services run Phnom Penh-Kampot-Kep so Kep can be the second stop.",
        "bookVia": "12Go or Bookaway",
        "recommended": true,
        "notes": "Around 170 km. Confirm whether your service is direct to Kep or requires a change in Kampot."
      },
      {
        "mode": "Bus",
        "durationHrs": [
          3.5,
          4.5
        ],
        "price": {
          "low": 8,
          "high": 13,
          "currency": "USD"
        },
        "freq": "several daily",
        "comfort": "Air-con coaches; comfortable but with more stops along National Road 3.",
        "bookVia": "Giant Ibis, BookMeBus or redBus",
        "recommended": false,
        "notes": "Kep is small and quiet, known for its crab market and seafood; many travellers pair it with Kampot."
      }
    ]
  },
  {
    "id": "kh-kampot-kep",
    "from": "Kampot",
    "to": "Kep",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          0.4,
          0.8
        ],
        "price": {
          "low": 3,
          "high": 6,
          "currency": "USD"
        },
        "freq": "frequent throughout the day",
        "comfort": "Quick 25 km shared hop; basic but fine for the short distance.",
        "bookVia": "Guesthouse desks, 12Go or on the spot",
        "recommended": true,
        "notes": "The cheapest and most frequent link between the two towns."
      },
      {
        "mode": "Tuk-tuk / private car",
        "durationHrs": [
          0.5,
          0.9
        ],
        "price": {
          "low": 10,
          "high": 20,
          "currency": "USD"
        },
        "freq": "on demand",
        "comfort": "Door-to-door and flexible; a remork (large tuk-tuk) is comfortable for two with luggage.",
        "bookVia": "Hail locally or via your guesthouse",
        "recommended": false,
        "notes": "Price is for the whole vehicle and is negotiable; agree the fare before departing."
      }
    ]
  },
  {
    "id": "kh-kampot-sihanoukville",
    "from": "Kampot",
    "to": "Sihanoukville",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          2,
          3
        ],
        "price": {
          "low": 8,
          "high": 12,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "Most common option for this 100 km run; cramped but direct.",
        "bookVia": "12Go or Bookaway",
        "recommended": true,
        "notes": "Useful as a stepping stone to the Koh Rong ferries. Confirm pickup point, as some services use the bus station outside town."
      },
      {
        "mode": "Bus",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 6,
          "high": 10,
          "currency": "USD"
        },
        "freq": "several daily",
        "comfort": "Air-con coaches; more legroom than a minivan but fewer departures.",
        "bookVia": "BookMeBus or redBus",
        "recommended": false,
        "notes": "VIP buses tend to be quicker than economy services."
      },
      {
        "mode": "Private taxi",
        "durationHrs": [
          1.5,
          2.5
        ],
        "price": {
          "low": 40,
          "high": 50,
          "currency": "USD"
        },
        "freq": "on demand",
        "comfort": "Fastest and most flexible; door-to-door with luggage space.",
        "bookVia": "Guesthouse or local taxi operators",
        "recommended": false,
        "notes": "Worth splitting among a group; agree the price in advance."
      }
    ]
  },
  {
    "id": "kh-siemreap-battambang",
    "from": "Siem Reap",
    "to": "Battambang",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 6,
          "high": 12,
          "currency": "USD"
        },
        "freq": "several daily including 1-2 night services",
        "comfort": "Air-con coaches on a straightforward paved route; Giant Ibis and Mekong Express are the comfortable choices.",
        "bookVia": "Giant Ibis, BookMeBus or 12Go",
        "recommended": true,
        "notes": "The fast, reliable, year-round option between the two towns."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          3,
          3.5
        ],
        "price": {
          "low": 6,
          "high": 10,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "Direct and quick but cramped.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Similar timing to the bus at a slightly lower fare."
      },
      {
        "mode": "Slow boat",
        "durationHrs": [
          6,
          8
        ],
        "price": {
          "low": 25,
          "high": 30,
          "currency": "USD"
        },
        "freq": "wet season only, roughly daily when running",
        "comfort": "Memorable scenic journey through floating villages and waterways, but long, exposed and weather-dependent.",
        "bookVia": "Angkor Express Boat or guesthouse desks",
        "recommended": false,
        "notes": "Service is typically suspended in the dry season (around March to June/July) when water levels drop. Confirm it is running before counting on it; foreigners pay more than locals."
      }
    ]
  },
  {
    "id": "kh-phnompenh-kratie",
    "from": "Phnom Penh",
    "to": "Kratie",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          5,
          6.5
        ],
        "price": {
          "low": 8,
          "high": 15,
          "currency": "USD"
        },
        "freq": "several daily",
        "comfort": "Air-con coaches up National Road 7; the most comfortable way to reach the Irrawaddy-dolphin town.",
        "bookVia": "BookMeBus, redBus or 12Go",
        "recommended": true,
        "notes": "Around 340 km. Operators include Virak Buntham and SRL Transport."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          4.5,
          5.5
        ],
        "price": {
          "low": 10,
          "high": 14,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "Faster but cramped; common for onward connections to Stung Treng and Banlung.",
        "bookVia": "Bookaway or 12Go",
        "recommended": false,
        "notes": "Good if you intend to continue north the same day."
      }
    ]
  },
  {
    "id": "kh-kratie-banlung",
    "from": "Kratie",
    "to": "Banlung",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          3.5,
          5
        ],
        "price": {
          "low": 8,
          "high": 12,
          "currency": "USD"
        },
        "freq": "morning departures, limited daily",
        "comfort": "The standard way into Ratanakiri province; basic shared van, often full, frequently routed via Stung Treng.",
        "bookVia": "Guesthouse desks, Bookaway or 12Go",
        "recommended": true,
        "notes": "Around 240 km. Departures cluster in the morning; book the day before. Some travellers split the trip with a change in Stung Treng (Kratie-Stung Treng about USD 6, Stung Treng-Banlung about USD 7)."
      },
      {
        "mode": "Bus",
        "durationHrs": [
          4.5,
          6
        ],
        "price": {
          "low": 8,
          "high": 13,
          "currency": "USD"
        },
        "freq": "limited, often via Stung Treng",
        "comfort": "Larger coaches run on parts of the route but timings into Banlung are sparse; minivans dominate.",
        "bookVia": "BookMeBus or local operators",
        "recommended": false,
        "notes": "Direct big-bus service is irregular; confirm whether a transfer is needed."
      }
    ]
  },
  {
    "id": "kh-sihanoukville-kohrong",
    "from": "Sihanoukville",
    "to": "Koh Rong",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Speed ferry",
        "durationHrs": [
          0.5,
          1.1
        ],
        "price": {
          "low": 11,
          "high": 25,
          "currency": "USD"
        },
        "freq": "roughly hourly, around 7 daily, approx 08:00-17:00",
        "comfort": "Fast enclosed catamarans (around 30-45 minutes); the standard and most comfortable crossing. Tickets are usually open-return and valid for several days.",
        "bookVia": "Buva Sea or Speed Ferry Cambodia, direct or via 12Go",
        "recommended": true,
        "notes": "Departs from the Serendipity / Ochheuteal pier area. A return ticket is typically only a little more than one-way, so buy the round trip. Specify Koh Rong (Koh Touch) versus Koh Rong Sanloem when booking."
      },
      {
        "mode": "Slow boat",
        "durationHrs": [
          1.5,
          2.5
        ],
        "price": {
          "low": 5,
          "high": 10,
          "currency": "USD"
        },
        "freq": "limited, roughly daily",
        "comfort": "Cheap local wooden boats; slow, exposed and far less frequent, mainly used for cargo and budget travel.",
        "bookVia": "At the pier",
        "recommended": false,
        "notes": "Crossings can be rough in poor weather; the speed ferry is safer and more reliable."
      }
    ]
  },
  {
    "id": "kh-phnompenh-kohkong",
    "from": "Phnom Penh",
    "to": "Koh Kong",
    "country": "kh",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          5,
          6
        ],
        "price": {
          "low": 12,
          "high": 18,
          "currency": "USD"
        },
        "freq": "several daily, first around 06:15, last late evening",
        "comfort": "Air-con coaches via National Road 4 then the coastal highway; the comfortable mainstream option toward the Thai border region and Koh Kong's Cardamom ecotourism.",
        "bookVia": "Virak Buntham, VET Air Bus or BookMeBus / redBus",
        "recommended": true,
        "notes": "Around 270 km. Many travellers used this en route to Thailand, but note the Cham Yeam-Hat Lek land border to Thailand is closed in 2026 (see cross-border routes)."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          4.5,
          5.5
        ],
        "price": {
          "low": 12,
          "high": 16,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "Faster but cramped; door-to-door pickup sometimes offered.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Useful for reaching Koh Kong town and onward to Koh Kong island or Tatai."
      }
    ]
  },
  {
    "id": "kh-siemreap-bangkok",
    "from": "Siem Reap",
    "to": "Bangkok",
    "country": "kh",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Poipet-Aranyaprathet (CLOSED in 2026)",
    "visa": {
      "note": "Thailand grants visa-exempt entry to many Western passports (30-60 days) and offers an eVisa/visa-on-arrival for others. HOWEVER the Poipet-Aranyaprathet land crossing is closed for tourist travel in 2026 due to the Thailand-Cambodia border conflict, so the overland bus is not operating. Arrival is by air; standard Thai entry rules apply at Bangkok airports."
    },
    "scamWarnings": [
      "Even before the closure, Poipet was notorious for fake visa offices and inflated e-Arrival or 'border fee' charges; the Thai eVisa or visa-exemption is free or fixed-price and should only be arranged through official channels.",
      "Beware any agent in Siem Reap selling a 'direct bus to Bangkok' in 2026 despite the border being closed; such tickets may strand you at the frontier or be outright fraudulent."
    ],
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1.1,
          1.4
        ],
        "price": {
          "low": 100,
          "high": 250,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "About 1h15 nonstop; the only practical way to combine Siem Reap and Bangkok while the land border is shut.",
        "bookVia": "Bangkok Airways, Thai AirAsia or Thai Airways via airline sites or aggregators",
        "recommended": true,
        "notes": "As of 2026 the Poipet land border is closed to tourists, so the formerly popular direct bus (Nattakan/Transport Co, about USD 28, roughly 9-12 hours) is suspended. Verify the current border status before any overland attempt."
      },
      {
        "mode": "Direct bus (SUSPENDED)",
        "durationHrs": [
          9,
          13
        ],
        "price": {
          "low": 25,
          "high": 35,
          "currency": "USD"
        },
        "freq": "not operating in 2026",
        "comfort": "Pre-conflict, a single through-bus crossed at Poipet with no minivan transfer; convenient when running.",
        "bookVia": "Previously Nattakan / 12Go (currently unavailable)",
        "recommended": false,
        "notes": "Listed for reference only. This service does not run while the Poipet-Aranyaprathet border is closed; do not book overland Bangkok-Siem Reap travel in 2026 without confirming reopening through official advisories."
      }
    ]
  },
  {
    "id": "kh-phnompenh-hochiminhcity",
    "from": "Phnom Penh",
    "to": "Ho Chi Minh City",
    "country": "kh",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Bavet-Moc Bai",
    "visa": {
      "note": "Most travellers need a Vietnam e-visa (around USD 25, single or multiple entry, up to 90 days) arranged online before travel; visa-on-arrival is NOT available at the Moc Bai land border. Select 'Moc Bai landport' as your entry point on the e-visa or you may be refused entry. Some nationalities enjoy short visa-free stays. Cambodia is exited at Bavet with no visa needed to leave."
    },
    "scamWarnings": [
      "At Bavet-Moc Bai some bus staff or fixers ask for a small 'stamp fee' or 'processing fee' to speed your passport through; entry and exit stamps are free, so politely decline.",
      "Do not let anyone keep your passport longer than the actual stamping; collect it back at the window yourself and confirm your e-visa entry port reads Moc Bai before boarding."
    ],
    "options": [
      {
        "mode": "VIP bus",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 25,
          "high": 35,
          "currency": "USD"
        },
        "freq": "several daily, mainly morning",
        "comfort": "Through coach over roughly 240 km with Wi-Fi, air-con and free Phnom Penh hotel pickup; staff shepherd passengers through both immigration posts.",
        "bookVia": "Giant Ibis direct, or 12Go / Baolau",
        "recommended": true,
        "notes": "Giant Ibis is the most reliable operator; departures around 08:00 and 09:45. The border stop adds roughly 30-45 minutes."
      },
      {
        "mode": "Standard cross-border bus",
        "durationHrs": [
          6.5,
          8
        ],
        "price": {
          "low": 15,
          "high": 25,
          "currency": "USD"
        },
        "freq": "frequent throughout the day",
        "comfort": "Budget operators (Kumho, Khai Nam, Sapaco and others) run the same route more cheaply with more stops and variable comfort.",
        "bookVia": "12Go, Baolau or redBus",
        "recommended": false,
        "notes": "Fine for budget travellers; choose a named operator and keep your passport and e-visa printout handy at the border."
      }
    ]
  },
  {
    "id": "kh-phnompenh-bangkok",
    "from": "Phnom Penh",
    "to": "Bangkok",
    "country": "kh",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Poipet-Aranyaprathet (CLOSED in 2026)",
    "visa": {
      "note": "Thailand offers visa exemption (30-60 days) to many Western passports and an eVisa for others, with standard rules at Bangkok airports. The land borders with Cambodia, including Poipet-Aranyaprathet, are closed to tourist crossings in 2026 because of the border conflict, so direct buses are suspended and entry is by air."
    },
    "scamWarnings": [
      "Ignore agents who claim to sell a working overland Phnom Penh-Bangkok bus in 2026; the border is closed and such tickets risk leaving you stranded at the frontier.",
      "For flights, book through the airline or a reputable aggregator rather than unverified street agents offering 'discount' international tickets."
    ],
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.3
        ],
        "price": {
          "low": 60,
          "high": 200,
          "currency": "USD"
        },
        "freq": "multiple daily",
        "comfort": "About 1h nonstop; the only practical option while the land border is closed.",
        "bookVia": "Thai Vietjet, Cambodia Airways, Air Cambodia, Bangkok Airways or Thai AirAsia",
        "recommended": true,
        "notes": "Budget carriers can be very cheap if booked ahead; June is typically among the cheapest months."
      },
      {
        "mode": "Direct bus via Poipet (SUSPENDED)",
        "durationHrs": [
          12,
          15
        ],
        "price": {
          "low": 30,
          "high": 45,
          "currency": "USD"
        },
        "freq": "not operating in 2026",
        "comfort": "Pre-conflict long-haul coach via Poipet; a long but cheap overland slog.",
        "bookVia": "Previously Giant Ibis / Virak Buntham / 12Go (currently unavailable)",
        "recommended": false,
        "notes": "Reference only. The overland route does not run while the border is closed; the Poipet-Phnom Penh passenger rail link is also suspended. Confirm reopening through official advisories before any overland plan."
      }
    ]
  },
  {
    "id": "kh-siemreap-pakse",
    "from": "Siem Reap",
    "to": "Pakse",
    "country": "kh",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Trapeang Kriel-Nong Nok Khiene (Dom Kralor)",
    "visa": {
      "note": "Laos issues a visa-on-arrival at the Trapeang Kriel-Nong Nok Khiene land border (around USD 30-42 depending on nationality) and also offers an eVisa; carry USD cash and a passport photo. Officials on both sides routinely collect small unofficial 'stamp', 'overtime' or 'health' fees of USD 1-3 that are not official. Exiting Cambodia is free."
    },
    "scamWarnings": [
      "At Trapeang Kriel-Nong Nok Khiene, Lao and Cambodian officials commonly demand small 'processing', 'stamp' or 'overtime' fees beyond the official visa cost; these are unofficial. Have small USD bills ready and accept a modest overcharge is normal here, but you can politely query large requests.",
      "Confirm your through-ticket actually includes onward transport on the Lao side; some agents drop passengers at the border expecting them to find a separate, overpriced van to Pakse."
    ],
    "options": [
      {
        "mode": "Minivan / bus (through ticket)",
        "durationHrs": [
          8,
          11
        ],
        "price": {
          "low": 40,
          "high": 50,
          "currency": "USD"
        },
        "freq": "around 1 daily, typically morning departure",
        "comfort": "Long combined journey, usually with a vehicle change near Stung Treng; cramped and slow but the only single through option. Expect a lunch stop and the border formalities mid-route.",
        "bookVia": "Bookaway, 12Go or guesthouse desks in Siem Reap",
        "recommended": true,
        "notes": "Roughly an 8-10 hour day; departs Siem Reap early and reaches Pakse in the evening. Add-on tickets continue to the 4000 Islands (Don Det/Don Khon) via Nong Nok Khiene and Nakasang."
      },
      {
        "mode": "Via Stung Treng (self-connect)",
        "durationHrs": [
          9,
          12
        ],
        "price": {
          "low": 30,
          "high": 45,
          "currency": "USD"
        },
        "freq": "daily segments",
        "comfort": "Break the trip in Stung Treng, then take the Stung Treng-Pakse cross-border van; more flexible but requires its own arrangements.",
        "bookVia": "Local operators in Stung Treng, or 12Go",
        "recommended": false,
        "notes": "Stung Treng-Pakse alone runs around USD 22 and 4-5 hours. Good if you want to overnight in Stung Treng or visit Kratie/Banlung en route."
      }
    ]
  },
  {
    "id": "kh-stungtreng-fourthousandislands",
    "from": "Stung Treng",
    "to": "4000 Islands (Si Phan Don)",
    "country": "kh",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Trapeang Kriel-Nong Nok Khiene (Dom Kralor)",
    "visa": {
      "note": "Laos visa-on-arrival is available at Nong Nok Khiene (around USD 30-42 by nationality) plus an eVisa option; bring USD cash and a passport photo. Small unofficial border fees (USD 1-3) are routinely collected on both sides. The 4000 Islands (Don Det / Don Khon) are reached by a short ferry from Nakasang after the border."
    },
    "scamWarnings": [
      "Expect unofficial 'stamp' and 'overtime' surcharges of a dollar or two on each side at Trapeang Kriel-Nong Nok Khiene; keep small USD notes ready and do not hand over more than asked.",
      "Boatmen and minivan touts at the Nakasang pier may quote inflated island-ferry prices to those without a combo ticket; confirm the standard local fare before paying."
    ],
    "options": [
      {
        "mode": "Minivan + boat (combo ticket)",
        "durationHrs": [
          3,
          5
        ],
        "price": {
          "low": 18,
          "high": 30,
          "currency": "USD"
        },
        "freq": "around 1 daily, morning",
        "comfort": "Short combined run: van from Stung Treng across the border to Nakasang, then a local ferry to Don Det or Don Khon. The simplest way onto the islands from northeast Cambodia.",
        "bookVia": "Guesthouse desks in Stung Treng, Bookaway or 12Go",
        "recommended": true,
        "notes": "The Lao ferry segment from Nakasang to the islands is cheap (often quoted around LAK 60,000-150,000). Buy the combo so you are not haggling for a boat at the pier."
      },
      {
        "mode": "Private taxi to border + onward",
        "durationHrs": [
          2.5,
          4
        ],
        "price": {
          "low": 35,
          "high": 55,
          "currency": "USD"
        },
        "freq": "on demand",
        "comfort": "Door-to-border car, then arrange Lao-side transport and the ferry yourself; faster and more flexible but more legwork.",
        "bookVia": "Local taxi operators in Stung Treng",
        "recommended": false,
        "notes": "Best for small groups or those wanting to control timing; you still cross on foot and pick up Lao transport at Nong Nok Khiene."
      }
    ]
  },
  {
    "id": "kh-kampot-hatien",
    "from": "Kampot",
    "to": "Ha Tien",
    "country": "kh",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Prek Chak-Xa Xia (Ha Tien)",
    "visa": {
      "note": "A Vietnam e-visa (around USD 25, valid up to 90 days) must be arranged online BEFORE travel; visa-on-arrival is NOT offered at the Prek Chak-Xa Xia land border. Confirm the e-visa lists this land crossing as your entry point. Leaving Cambodia at Prek Chak is free of charge."
    },
    "scamWarnings": [
      "Agents have been known to demand a small 'stamp' or 'border' fee at Prek Chak-Xa Xia; Cambodian exit and Vietnamese entry stamps are free for valid e-visa holders, so decline extra charges.",
      "Do not arrive without a pre-arranged Vietnam e-visa expecting visa-on-arrival; it is unavailable here and you will be turned back. Verify the e-visa entry port matches this crossing."
    ],
    "options": [
      {
        "mode": "Minivan / bus (through ticket)",
        "durationHrs": [
          2,
          3.5
        ],
        "price": {
          "low": 12,
          "high": 20,
          "currency": "USD"
        },
        "freq": "around 1-2 daily",
        "comfort": "Through service or minivan from Kampot (and Kep) to Ha Tien with staff assisting at the border; a manageable half-day trip for the short distance.",
        "bookVia": "Kampot/Kep guesthouse desks, 12Go or Bookaway",
        "recommended": true,
        "notes": "Prek Chak is the southernmost Cambodia-Vietnam crossing. Tickets are widely sold by agencies in Kampot and Kep; many travellers continue from Ha Tien to Phu Quoc by ferry."
      },
      {
        "mode": "Private taxi to border + local transport",
        "durationHrs": [
          1.5,
          3
        ],
        "price": {
          "low": 25,
          "high": 40,
          "currency": "USD"
        },
        "freq": "on demand",
        "comfort": "Car to Prek Chak, cross on foot, then pick up Vietnamese transport to Ha Tien town; faster but more self-managed.",
        "bookVia": "Local taxi operators in Kampot or Kep",
        "recommended": false,
        "notes": "From Kep a moto runs around USD 7 and a tuk-tuk around USD 12 to the border. Good for those who want to control timing or have already crossed independently."
      }
    ]
  }
];
