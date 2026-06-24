// Thailand transport routes — intercity plus outbound cross-border. Each option
// lists a guidance price range, journey time, frequency, comfort note and how to book.
// Figures change with season and operator, so confirm before travel.
export const ROUTES_TH = [
  {
    "id": "th-bangkok-chiangmai",
    "from": "Bangkok",
    "to": "Chiang Mai",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper train",
        "durationHrs": [
          11,
          14
        ],
        "price": {
          "low": 600,
          "high": 1500,
          "currency": "THB"
        },
        "freq": "Several daily, best departures early evening",
        "comfort": "Modern Special Express No. 9/13 carriages with air-conditioned second-class berths and private first-class cabins; the most relaxed overnight option.",
        "bookVia": "State Railway of Thailand (dticket.railway.co.th) or 12Go",
        "recommended": true,
        "notes": "Book several weeks ahead as sleeper berths sell out; advance booking is now capped at 90 days. Lower berths cost more but are roomier."
      },
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          9,
          11
        ],
        "price": {
          "low": 650,
          "high": 1100,
          "currency": "THB"
        },
        "freq": "Frequent evening departures from Mo Chit (Northern Terminal)",
        "comfort": "VIP 24-seat coaches recline deeply with air-conditioning, onboard toilet, blanket and a meal stop; faster than the train but less restful.",
        "bookVia": "Sombat Tour, Nakhonchai Air, or 12Go",
        "recommended": false,
        "notes": "Often slightly cheaper and quicker than the train. Choose reputable operators departing Mo Chit rather than Khao San tout buses."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1.2,
          1.5
        ],
        "price": {
          "low": 900,
          "high": 2500,
          "currency": "THB"
        },
        "freq": "Many daily from both BKK and DMK",
        "comfort": "Quickest option by far; add roughly one hour each end for airport transfers and check-in.",
        "bookVia": "Thai AirAsia, Thai Vietjet, Thai Lion Air, Nok Air",
        "recommended": false,
        "notes": "Book early for sub-1000 THB fares. DMK (Don Muang) hosts most budget carriers; factor baggage fees."
      }
    ]
  },
  {
    "id": "th-bangkok-chiangrai",
    "from": "Bangkok",
    "to": "Chiang Rai",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          10,
          12
        ],
        "price": {
          "low": 650,
          "high": 1200,
          "currency": "THB"
        },
        "freq": "Multiple evening departures from Mo Chit",
        "comfort": "VIP coaches recline with air-conditioning, toilet, blanket and a supper stop; budget services (Cherdchai) are tighter than premium Sombat Tour.",
        "bookVia": "Sombat Tour, Greenbus, or 12Go",
        "recommended": false,
        "notes": "No rail line reaches Chiang Rai, so overnight bus is the main surface route. Departs evening, arrives at dawn."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1.3,
          1.5
        ],
        "price": {
          "low": 900,
          "high": 3000,
          "currency": "THB"
        },
        "freq": "Several daily to Chiang Rai (CEI)",
        "comfort": "Fastest option; spares an overnight journey and a hotel night is not consumed in transit.",
        "bookVia": "Thai AirAsia, Thai Vietjet, Nok Air",
        "recommended": true,
        "notes": "Given there is no train and the bus is a full overnight haul, flying is the most efficient choice; advance fares can match a VIP bus seat."
      }
    ]
  },
  {
    "id": "th-bangkok-ayutthaya",
    "from": "Bangkok",
    "to": "Ayutthaya",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Train",
        "durationHrs": [
          1.5,
          2.5
        ],
        "price": {
          "low": 15,
          "high": 350,
          "currency": "THB"
        },
        "freq": "Very frequent throughout the day",
        "comfort": "Ranges from cheap fan-cooled third class to air-conditioned express; the classic scenic and authentic way to reach the old capital.",
        "bookVia": "State Railway of Thailand at the station or dticket.railway.co.th",
        "recommended": true,
        "notes": "Departs Krung Thep Aphiwat Central Terminal. Cheap ordinary trains can be bought on the day; the historic park is a short tuk-tuk from the station."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          1,
          2
        ],
        "price": {
          "low": 70,
          "high": 100,
          "currency": "THB"
        },
        "freq": "Throughout the day from Mo Chit",
        "comfort": "Air-conditioned shared vans are quick but cramped; can be faster than the train outside rush hour.",
        "bookVia": "Mo Chit van counters or 12Go",
        "recommended": false,
        "notes": "Vans depart when full. Good for a day trip if the train timetable does not suit."
      }
    ]
  },
  {
    "id": "th-bangkok-sukhothai",
    "from": "Bangkok",
    "to": "Sukhothai",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          6.5,
          8
        ],
        "price": {
          "low": 360,
          "high": 550,
          "currency": "THB"
        },
        "freq": "Roughly 20+ daily connections, day and overnight",
        "comfort": "Win Tour runs direct air-conditioned coaches straight to New Sukhothai; reclining seats with a rest stop, the simplest single-leg option.",
        "bookVia": "Win Tour (Sukhothai Thani) or 12Go",
        "recommended": true,
        "notes": "There is no train to Sukhothai itself. Direct Win Tour coaches from Mo Chit are the most comfortable surface route."
      },
      {
        "mode": "Train + bus via Phitsanulok",
        "durationHrs": [
          7,
          9
        ],
        "price": {
          "low": 300,
          "high": 900,
          "currency": "THB"
        },
        "freq": "Several northern-line trains daily, then frequent local buses",
        "comfort": "Take a northern train to Phitsanulok then a one-hour bus; more comfortable rail seating but requires a transfer.",
        "bookVia": "State Railway of Thailand plus local bus at Phitsanulok",
        "recommended": false,
        "notes": "Useful if combining with other northern-line stops. The Phitsanulok-Sukhothai bus runs roughly hourly."
      },
      {
        "mode": "Flight + transfer",
        "durationHrs": [
          1.5,
          2.5
        ],
        "price": {
          "low": 1500,
          "high": 3500,
          "currency": "THB"
        },
        "freq": "Limited daily Bangkok Airways service to Sukhothai (THS)",
        "comfort": "Bangkok Airways serves its own small Sukhothai airport; quick but the priciest option and schedules are limited.",
        "bookVia": "Bangkok Airways",
        "recommended": false,
        "notes": "Sukhothai airport is privately operated by Bangkok Airways, so fares run higher than typical domestic routes."
      }
    ]
  },
  {
    "id": "th-bangkok-kanchanaburi",
    "from": "Bangkok",
    "to": "Kanchanaburi",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Train",
        "durationHrs": [
          3,
          3.5
        ],
        "price": {
          "low": 100,
          "high": 100,
          "currency": "THB"
        },
        "freq": "Two departures daily on the Death Railway line",
        "comfort": "Historic third-class line crossing the River Kwai bridge; basic fan carriages but the scenery and heritage are the draw, foreigner fare fixed at 100 THB.",
        "bookVia": "State Railway of Thailand at the station",
        "recommended": false,
        "notes": "Departs from Thonburi (Bangkok Noi), not the central terminal. Only two trains a day, so check the timetable carefully."
      },
      {
        "mode": "Bus",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 130,
          "high": 200,
          "currency": "THB"
        },
        "freq": "Roughly every 1-2 hours",
        "comfort": "Air-conditioned coaches from Sai Tai Mai (Southern Terminal) are faster and more frequent than the train.",
        "bookVia": "Sai Tai Mai terminal or 12Go",
        "recommended": true,
        "notes": "The most flexible option for reaching Kanchanaburi town; ride the heritage train as a day excursion once there."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          2,
          3
        ],
        "price": {
          "low": 150,
          "high": 250,
          "currency": "THB"
        },
        "freq": "Frequent through the day",
        "comfort": "Air-conditioned shared vans are quick but cramped on the two-hour run.",
        "bookVia": "Sai Tai Mai or Mo Chit van counters",
        "recommended": false,
        "notes": "Vans drop near the bus terminal; confirm whether the town centre or guesthouse area is included."
      }
    ]
  },
  {
    "id": "th-bangkok-huahin",
    "from": "Bangkok",
    "to": "Hua Hin",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 200,
          "high": 450,
          "currency": "THB"
        },
        "freq": "Frequent through the day from Sai Tai Mai",
        "comfort": "Air-conditioned coaches and VIP services with reclining seats; the most comfortable surface option for the short southern run.",
        "bookVia": "Roong Reuang Coach, or 12Go",
        "recommended": true,
        "notes": "Roong Reuang runs convenient services from Suvarnabhumi and Don Muang airports straight to Hua Hin, handy for arrivals."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          3,
          3.5
        ],
        "price": {
          "low": 180,
          "high": 250,
          "currency": "THB"
        },
        "freq": "Throughout the day",
        "comfort": "Shared air-conditioned vans are cheap and quick but tight on legroom.",
        "bookVia": "Sai Tai Mai van counters or 12Go",
        "recommended": false,
        "notes": "Good budget choice; vans leave when full and drop in central Hua Hin."
      },
      {
        "mode": "Train",
        "durationHrs": [
          4,
          5
        ],
        "price": {
          "low": 100,
          "high": 500,
          "currency": "THB"
        },
        "freq": "Several southern-line trains daily",
        "comfort": "Scenic southern line into Hua Hin's pretty heritage station; slower than the bus but characterful.",
        "bookVia": "State Railway of Thailand or dticket.railway.co.th",
        "recommended": false,
        "notes": "Departs Krung Thep Aphiwat Central Terminal. Choose for the experience rather than speed."
      }
    ]
  },
  {
    "id": "th-bangkok-pattaya",
    "from": "Bangkok",
    "to": "Pattaya",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          2,
          3
        ],
        "price": {
          "low": 130,
          "high": 300,
          "currency": "THB"
        },
        "freq": "Roughly every 30-60 minutes from Ekkamai",
        "comfort": "Air-conditioned coaches from Ekkamai (Eastern Terminal) are the cheapest and most frequent way to the coast.",
        "bookVia": "Ekkamai terminal, Roong Reuang Coach (airport route), or 12Go",
        "recommended": true,
        "notes": "Roong Reuang also runs direct buses from Suvarnabhumi airport to Pattaya, convenient for fly-and-beach arrivals."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          2,
          3
        ],
        "price": {
          "low": 180,
          "high": 300,
          "currency": "THB"
        },
        "freq": "Frequent through the day",
        "comfort": "Shared vans are quick door-to-area but cramped; some offer hotel drop-offs.",
        "bookVia": "Mo Chit or Ekkamai van counters, or 12Go",
        "recommended": false,
        "notes": "Confirm drop-off point (Central Pattaya vs Jomtien) before booking."
      }
    ]
  },
  {
    "id": "th-bangkok-phuket",
    "from": "Bangkok",
    "to": "Phuket",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1.3,
          1.6
        ],
        "price": {
          "low": 1000,
          "high": 3500,
          "currency": "THB"
        },
        "freq": "Very frequent from both BKK and DMK",
        "comfort": "Far quicker than the 12+ hour bus; one of Thailand's busiest and most competitive domestic routes.",
        "bookVia": "Thai AirAsia, Thai Vietjet, Thai Lion Air, Nok Air, Bangkok Airways",
        "recommended": true,
        "notes": "With buses taking 12+ hours over roughly 850 km, flying is overwhelmingly the sensible choice; advance fares are often near bus prices."
      },
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          11,
          13
        ],
        "price": {
          "low": 700,
          "high": 1200,
          "currency": "THB"
        },
        "freq": "Several evening departures from Sai Tai Mai",
        "comfort": "VIP coaches with 1-2 seating, deep recline, blanket, water and a meal stop; an overnight haul of around 12 hours.",
        "bookVia": "Phuket Travel, Bus Express, or 12Go",
        "recommended": false,
        "notes": "Overnight buses depart late afternoon/evening. Pick a VIP single seat for sleeping; budget choice for those avoiding flights."
      }
    ]
  },
  {
    "id": "th-bangkok-krabi",
    "from": "Bangkok",
    "to": "Krabi",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1.3,
          1.6
        ],
        "price": {
          "low": 1100,
          "high": 4000,
          "currency": "THB"
        },
        "freq": "Multiple daily from BKK and DMK",
        "comfort": "Lands you near the Andaman beaches by midday; vastly quicker than the long overnight bus.",
        "bookVia": "Thai AirAsia, Thai Vietjet, Thai Lion Air, Bangkok Airways",
        "recommended": true,
        "notes": "Krabi airport (KBV) connects easily to Ao Nang and the piers; book ahead for the lowest fares."
      },
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          11,
          14
        ],
        "price": {
          "low": 800,
          "high": 1300,
          "currency": "THB"
        },
        "freq": "Evening departures from Sai Tai Mai",
        "comfort": "VIP coaches recline deeply with toilet, blanket and a meal stop; a long overnight haul to the south.",
        "bookVia": "Lignite Tour, Krabi-bound operators, or 12Go",
        "recommended": false,
        "notes": "Journey runs 11-14 hours depending on traffic and stops. Suited to budget travellers avoiding flights."
      }
    ]
  },
  {
    "id": "th-bangkok-suratthani",
    "from": "Bangkok",
    "to": "Surat Thani",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper train",
        "durationHrs": [
          11,
          13
        ],
        "price": {
          "low": 600,
          "high": 1800,
          "currency": "THB"
        },
        "freq": "Several southern-line trains daily, best are evening sleepers",
        "comfort": "Express No. 85 and similar overnight sleepers have air-conditioned second-class berths and first-class cabins, well-timed for morning ferries to Koh Samui, Koh Phangan and Koh Tao.",
        "bookVia": "State Railway of Thailand (dticket.railway.co.th) or 12Go",
        "recommended": true,
        "notes": "Combined train+bus+ferry tickets exist, but seat61 advises buying train and ferry separately to avoid poorly timed packages from resellers."
      },
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          9,
          11
        ],
        "price": {
          "low": 600,
          "high": 1000,
          "currency": "THB"
        },
        "freq": "Frequent evening departures from Sai Tai Mai",
        "comfort": "VIP coaches recline with air-conditioning and a meal stop; faster than the train but less restful for sleeping.",
        "bookVia": "Sai Tai Mai operators or 12Go",
        "recommended": false,
        "notes": "Surat Thani is the gateway to the Samui archipelago; aim to arrive in time for the morning Donsak/Lomprayah ferries."
      },
      {
        "mode": "Flight + transfer",
        "durationHrs": [
          1.3,
          2
        ],
        "price": {
          "low": 900,
          "high": 2500,
          "currency": "THB"
        },
        "freq": "Several daily to Surat Thani (URT)",
        "comfort": "Quick if you then take a bus-and-ferry combo from the airport; cheaper than flying direct to Koh Samui airport.",
        "bookVia": "Thai AirAsia, Thai Lion Air, Nok Air",
        "recommended": false,
        "notes": "Flying into Surat Thani then ferrying out is often cheaper than the premium Koh Samui (USM) airport served by Bangkok Airways."
      }
    ]
  },
  {
    "id": "th-bangkok-udonthani",
    "from": "Bangkok",
    "to": "Udon Thani",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper train",
        "durationHrs": [
          8,
          10
        ],
        "price": {
          "low": 500,
          "high": 1500,
          "currency": "THB"
        },
        "freq": "Three daily including premium overnight service",
        "comfort": "Northeastern-line sleepers with air-conditioned berths; the premium overnight service continues toward Nong Khai for the Laos border.",
        "bookVia": "State Railway of Thailand (dticket.railway.co.th) or 12Go",
        "recommended": true,
        "notes": "Many travellers ride through to Nong Khai for the Friendship Bridge to Vientiane; book sleeper berths ahead."
      },
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          7,
          9
        ],
        "price": {
          "low": 500,
          "high": 1000,
          "currency": "THB"
        },
        "freq": "Many daily, day and overnight, from Mo Chit",
        "comfort": "VIP and VIP24 coaches recline with air-conditioning, toilet and meal stop; quicker than the train.",
        "bookVia": "Nakhonchai Air, Tara Tour, or 12Go",
        "recommended": false,
        "notes": "Nakhonchai Air runs frequent premium coaches on the Isan corridor. Onward local buses reach Nong Khai in about an hour."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.3
        ],
        "price": {
          "low": 800,
          "high": 2500,
          "currency": "THB"
        },
        "freq": "Frequent daily to Udon Thani (UTH)",
        "comfort": "Quickest option; popular with travellers heading onward to Laos via Nong Khai.",
        "bookVia": "Thai AirAsia, Thai Vietjet, Thai Lion Air, Nok Air",
        "recommended": false,
        "notes": "From Udon Thani airport, frequent shuttles and buses reach Nong Khai and the Friendship Bridge."
      }
    ]
  },
  {
    "id": "th-bangkok-ubonratchathani",
    "from": "Bangkok",
    "to": "Ubon Ratchathani",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper train",
        "durationHrs": [
          9,
          11
        ],
        "price": {
          "low": 500,
          "high": 1500,
          "currency": "THB"
        },
        "freq": "Several daily including overnight sleepers",
        "comfort": "Eastern-line overnight trains with air-conditioned second-class berths (around 1000 THB) and first-class cabins (around 1500 THB); a comfortable Isan run.",
        "bookVia": "State Railway of Thailand (dticket.railway.co.th) or 12Go",
        "recommended": true,
        "notes": "Ubon is a common springboard for the Chong Mek border to Pakse, Laos. Book overnight berths in advance."
      },
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          8,
          10
        ],
        "price": {
          "low": 450,
          "high": 900,
          "currency": "THB"
        },
        "freq": "Frequent day and overnight from Mo Chit",
        "comfort": "Express, VIP and VIP24 coaches with recline, air-conditioning and a meal stop.",
        "bookVia": "Nakhonchai Air or 12Go",
        "recommended": false,
        "notes": "Reliable overnight option; Nakhonchai Air is the dominant premium operator on Isan routes."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.3
        ],
        "price": {
          "low": 800,
          "high": 2500,
          "currency": "THB"
        },
        "freq": "Several daily to Ubon Ratchathani (UBP)",
        "comfort": "Fastest option, saving an overnight journey.",
        "bookVia": "Thai AirAsia, Thai Vietjet, Thai Lion Air, Nok Air",
        "recommended": false,
        "notes": "Useful if continuing to southern Laos; arrange onward transport to the Chong Mek border from Ubon."
      }
    ]
  },
  {
    "id": "th-chiangmai-pai",
    "from": "Chiang Mai",
    "to": "Pai",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 150,
          "high": 260,
          "currency": "THB"
        },
        "freq": "Roughly hourly from Arcade Bus Station, around 06:30 to 17:30",
        "comfort": "Air-conditioned shared vans on Route 1095 with its famous 762 curves; quick but the winding road causes motion sickness for many.",
        "bookVia": "Aya Service or 12Go",
        "recommended": true,
        "notes": "Aya Service is the dominant operator and books out in high season. Sit at the front and bring motion-sickness tablets for the bends."
      },
      {
        "mode": "Private car / transfer",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 1800,
          "high": 3000,
          "currency": "THB"
        },
        "freq": "On demand",
        "comfort": "A private car lets you stop at viewpoints and waterfalls and is gentler on the winding road than a packed van.",
        "bookVia": "Local agencies or 12Go private transfer",
        "recommended": false,
        "notes": "Worth it for groups or anyone prone to car sickness. Price is per vehicle, so split among passengers."
      }
    ]
  },
  {
    "id": "th-chiangmai-chiangrai",
    "from": "Chiang Mai",
    "to": "Chiang Rai",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 170,
          "high": 350,
          "currency": "THB"
        },
        "freq": "Roughly hourly from Arcade Bus Station",
        "comfort": "Greenbus runs comfortable air-conditioned coaches, including X-class and V-class with extra legroom; the easiest direct link.",
        "bookVia": "Greenbus (greenbusthailand.com) or 12Go",
        "recommended": true,
        "notes": "Greenbus is the go-to operator; the express V-class is fastest at around 3 hours. Book ahead in peak season."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          3,
          3.5
        ],
        "price": {
          "low": 200,
          "high": 300,
          "currency": "THB"
        },
        "freq": "Frequent through the day",
        "comfort": "Shared vans are quick but cramped; fine for the short hop if buses do not suit your timing.",
        "bookVia": "Arcade Bus Station van counters or 12Go",
        "recommended": false,
        "notes": "Comparable price to the bus but tighter seating; the bus is usually the more comfortable pick."
      }
    ]
  },
  {
    "id": "th-chiangmai-sukhothai",
    "from": "Chiang Mai",
    "to": "Sukhothai",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          5,
          6
        ],
        "price": {
          "low": 230,
          "high": 400,
          "currency": "THB"
        },
        "freq": "Several daily from Arcade Bus Station",
        "comfort": "Win Tour runs direct air-conditioned coaches to New Sukhothai with reclining seats and a rest stop; the simplest single-leg link.",
        "bookVia": "Win Tour (Sukhothai Thani) or 12Go",
        "recommended": true,
        "notes": "Direct coaches avoid a transfer at Phitsanulok. Confirm whether the bus terminates at New Sukhothai or the historical park side."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          4.5,
          6
        ],
        "price": {
          "low": 230,
          "high": 400,
          "currency": "THB"
        },
        "freq": "A few daily",
        "comfort": "Shared vans with hotel pick-up and drop-off; slightly faster but cramped over five hours.",
        "bookVia": "Local agencies or 12Go",
        "recommended": false,
        "notes": "Good if you want door-to-door service, but legroom is limited on the long run."
      }
    ]
  },
  {
    "id": "th-krabi-kohlanta",
    "from": "Krabi",
    "to": "Koh Lanta",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          2,
          4
        ],
        "price": {
          "low": 350,
          "high": 450,
          "currency": "THB"
        },
        "freq": "Multiple daily, year round",
        "comfort": "Air-conditioned shared vans run year round, including the short vehicle ferry from Koh Klang across to Koh Lanta Noi; the only reliable wet-season option.",
        "bookVia": "Local agencies, smartenplus, or 12Go",
        "recommended": true,
        "notes": "Fare includes the car-ferry crossing. New bridges are progressively replacing some ferries, occasionally changing routing and timing."
      },
      {
        "mode": "Ferry",
        "durationHrs": [
          2,
          2.5
        ],
        "price": {
          "low": 400,
          "high": 500,
          "currency": "THB"
        },
        "freq": "1-2 daily, high season only (roughly Oct-Apr)",
        "comfort": "Passenger ferry from Krabi's Klong Jilad pier, often stopping at Koh Jum en route to Saladan; scenic but seasonal.",
        "bookVia": "Krabi pier operators, aonangtravel, or ferryscanner",
        "recommended": false,
        "notes": "Runs only in the dry high season; off-season you must take the minivan. Departures are limited so plan around them."
      }
    ]
  },
  {
    "id": "th-suratthani-kohsamui",
    "from": "Surat Thani",
    "to": "Koh Samui",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Ferry",
        "durationHrs": [
          1.5,
          2.5
        ],
        "price": {
          "low": 300,
          "high": 600,
          "currency": "THB"
        },
        "freq": "Many daily from Donsak pier, roughly 09:30 onward",
        "comfort": "Seatran and Raja car ferries from Donsak are stable and comfortable; the standard crossing to Koh Samui's Nathon pier.",
        "bookVia": "Seatran Ferry, Raja Ferry, or 12Go",
        "recommended": true,
        "notes": "Combined bus+ferry tickets connect Surat Thani town and airport to Donsak pier. Around 11 daily departures in high season."
      },
      {
        "mode": "High-speed catamaran",
        "durationHrs": [
          1,
          1.5
        ],
        "price": {
          "low": 500,
          "high": 900,
          "currency": "THB"
        },
        "freq": "Several daily",
        "comfort": "Lomprayah high-speed catamaran is the quickest crossing and links onward to Koh Phangan and Koh Tao.",
        "bookVia": "Lomprayah or 12Go",
        "recommended": false,
        "notes": "Best for island-hopping toward Koh Phangan and Koh Tao on the same operator; pricier than the car ferry."
      }
    ]
  },
  {
    "id": "th-phuket-krabi",
    "from": "Phuket",
    "to": "Krabi",
    "country": "th",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Bus",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 150,
          "high": 300,
          "currency": "THB"
        },
        "freq": "Several daily",
        "comfort": "Air-conditioned coaches run overland via the Sarasin bridge; cheap and reliable year round.",
        "bookVia": "Phuket Bus Terminal 2 or 12Go",
        "recommended": true,
        "notes": "Overland is faster and cheaper than the seasonal ferry and runs all year. Confirm Krabi town versus Ao Nang drop-off."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          2,
          3
        ],
        "price": {
          "low": 200,
          "high": 400,
          "currency": "THB"
        },
        "freq": "Frequent through the day",
        "comfort": "Shared vans with hotel pick-up are convenient door-to-door but cramped.",
        "bookVia": "Local agencies or 12Go",
        "recommended": false,
        "notes": "Slightly quicker than the big bus; handy for hotel-to-hotel transfers."
      },
      {
        "mode": "Ferry",
        "durationHrs": [
          2,
          3.5
        ],
        "price": {
          "low": 600,
          "high": 1000,
          "currency": "THB"
        },
        "freq": "Seasonal high-season departures, often via Koh Yao",
        "comfort": "High-season speedboats and ferries cross the bay, sometimes stopping at the Koh Yao islands; scenic but weather-dependent.",
        "bookVia": "Phuket pier operators or 12Go",
        "recommended": false,
        "notes": "Runs mainly in the dry season and costs more than the bus; choose for the islands and scenery, not for budget."
      }
    ]
  },
  {
    "id": "th-bangkok-siemreap",
    "from": "Bangkok",
    "to": "Siem Reap",
    "country": "th",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Aranyaprathet (Thailand) / Poipet (Cambodia)",
    "visa": {
      "note": "Land border closed in 2026 (see notes). When open, Cambodia offers visa on arrival (about USD 30, bring crisp US dollars and a passport photo) or an official e-visa via evisa.gov.kh. Most nationalities receive 30 days."
    },
    "scamWarnings": [
      "As of 2026 the Thailand-Cambodia land border is closed following the 2025 conflict and a fragile ceasefire; the Aranyaprathet-Poipet crossing is not open to tourists, so flying is currently the only way. Verify the latest status before planning any overland trip.",
      "When the border is open, Poipet is notorious for scams: touts push fake 'visa offices' before official immigration and overcharge in baht. The Cambodian e-visa/visa-on-arrival is a fixed fee paid only at the official counter in US dollars.",
      "Avoid cheap Khao San 'direct' buses that engineer delays and commission-paying guesthouse drop-offs; use a reputable operator that escorts you through immigration."
    ],
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1.2,
          1.5
        ],
        "price": {
          "low": 60,
          "high": 200,
          "currency": "USD"
        },
        "freq": "Several daily",
        "comfort": "With land borders closed in 2026, flying is the only viable option and the simplest under any conditions; lands at Siem Reap-Angkor (SAI).",
        "bookVia": "AirAsia, Cambodia Angkor Air, Bangkok Airways, Vietjet",
        "recommended": true,
        "notes": "Currently the sole option given the border closure. Even in normal times it avoids the lengthy Poipet overland ordeal."
      },
      {
        "mode": "Direct cross-border bus",
        "durationHrs": [
          8,
          10
        ],
        "price": {
          "low": 25,
          "high": 40,
          "currency": "USD"
        },
        "freq": "Historically daily (suspended while border is closed)",
        "comfort": "When running, Giant Ibis and Nattakan operate direct air-conditioned coaches that escort passengers through immigration; the most hassle-free overland route.",
        "bookVia": "Giant Ibis or Nattakan / Transport Co.",
        "recommended": false,
        "notes": "Suspended during the 2026 border closure. When reopened, Giant Ibis assists with paperwork at Poipet for a small fee; book direct, not via touts."
      }
    ]
  },
  {
    "id": "th-bangkok-phnompenh",
    "from": "Bangkok",
    "to": "Phnom Penh",
    "country": "th",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Aranyaprathet (Thailand) / Poipet (Cambodia)",
    "visa": {
      "note": "Land border closed in 2026 (see notes). When open, Cambodia grants visa on arrival (about USD 30, bring US dollars and a passport photo) or an official e-visa via evisa.gov.kh, valid 30 days for most nationalities."
    },
    "scamWarnings": [
      "As of 2026 the Thailand-Cambodia land border remains closed after the 2025 conflict, so the overland route via Poipet is suspended and flying is the only option; check current status before booking.",
      "When open, ignore anyone collecting 'extra' fees at Poipet; Cambodian visa fees are fixed and paid only at the official immigration window in US dollars.",
      "Some budget operators force a vehicle change at the border to fill commission-paying onward buses; book a single reputable through-service."
    ],
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1.2,
          1.5
        ],
        "price": {
          "low": 70,
          "high": 220,
          "currency": "USD"
        },
        "freq": "Multiple daily",
        "comfort": "With borders closed in 2026, flying is the only practical option and lands directly at Phnom Penh (PNH); far quicker than the 12+ hour overland alternative.",
        "bookVia": "AirAsia, Cambodia Angkor Air, Bangkok Airways, Vietjet",
        "recommended": true,
        "notes": "Currently the sole viable route. Phnom Penh is well served from Bangkok by full-service and budget carriers."
      },
      {
        "mode": "Direct cross-border bus",
        "durationHrs": [
          12,
          15
        ],
        "price": {
          "low": 30,
          "high": 50,
          "currency": "USD"
        },
        "freq": "Historically daily (suspended while border is closed)",
        "comfort": "When operating, Giant Ibis runs a through-coach via Poipet; a very long day but the most comfortable overland option with attendant assistance.",
        "bookVia": "Giant Ibis or Virak Buntham",
        "recommended": false,
        "notes": "Suspended during the 2026 closure. Even normally this is a 12+ hour journey, so most travellers fly; book direct with the operator."
      }
    ]
  },
  {
    "id": "th-bangkok-vientiane",
    "from": "Bangkok",
    "to": "Vientiane",
    "country": "th",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Nong Khai (Thailand) / Thanaleng via the First Thai-Lao Friendship Bridge",
    "visa": {
      "note": "Laos offers a 30-day visa on arrival at the Friendship Bridge (about USD 35 or 1,500 THB, bring a passport photo) or a pre-arranged e-visa via laoevisa.gov.la. Bridge crossing point operates roughly 06:00-22:00."
    },
    "scamWarnings": [
      "At the bridge, decline 'express' or 'stamp service' touts who add fees to the fixed visa-on-arrival cost; pay only at the official Lao counter.",
      "Paying the visa fee in baht rather than US dollars usually costs more due to a poor fixed exchange rate; carry crisp US dollars."
    ],
    "options": [
      {
        "mode": "Sleeper train + shuttle",
        "durationHrs": [
          11,
          14
        ],
        "price": {
          "low": 600,
          "high": 1500,
          "currency": "THB"
        },
        "freq": "Overnight train to Nong Khai daily, plus cross-bridge trains/shuttles",
        "comfort": "Overnight sleeper to Nong Khai then a short cross-border train or shuttle bus over the bridge to Vientiane; the most restful way north.",
        "bookVia": "State Railway of Thailand (dticket.railway.co.th) for the sleeper; shuttle bus or cross-border train at the bridge",
        "recommended": true,
        "notes": "A through cross-border train runs Nong Khai to Khamsavath/Vientiane; otherwise the shuttle bus over the bridge costs around 30-40 THB."
      },
      {
        "mode": "VIP / overnight bus",
        "durationHrs": [
          10,
          12
        ],
        "price": {
          "low": 600,
          "high": 1100,
          "currency": "THB"
        },
        "freq": "Daily direct cross-border coaches plus frequent buses to Nong Khai",
        "comfort": "Direct international coaches from Mo Chit handle the bridge formalities; reclining VIP seats with air-conditioning.",
        "bookVia": "Cross-border operators at Mo Chit or 12Go",
        "recommended": false,
        "notes": "Alternatively bus to Udon Thani/Nong Khai then the 20-minute shuttle bus across the bridge to Vientiane."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1.2,
          1.5
        ],
        "price": {
          "low": 2500,
          "high": 6000,
          "currency": "THB"
        },
        "freq": "Several daily to Vientiane (VTE)",
        "comfort": "Fastest option, avoiding the overland border process; lands at Wattay airport.",
        "bookVia": "Thai Airways, Lao Airlines, AirAsia",
        "recommended": false,
        "notes": "International fares run higher than domestic equivalents; you still complete Lao immigration on arrival at the airport."
      }
    ]
  },
  {
    "id": "th-chiangkhong-luangprabang",
    "from": "Chiang Khong",
    "to": "Luang Prabang",
    "country": "th",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Chiang Khong (Thailand) / Huay Xai (Laos) via the Fourth Thai-Lao Friendship Bridge",
    "visa": {
      "note": "Cross by land at the Fourth Friendship Bridge, then board the slow boat in Huay Xai. Laos visa on arrival is about USD 40 (payable in USD, THB, kip or euro, cash); an ATM is available near the border. E-visa is also accepted at this crossing."
    },
    "scamWarnings": [
      "You can no longer cross the river by boat; you must use the Friendship Bridge by shuttle, so ignore anyone offering a 'direct river crossing'.",
      "Buy the slow-boat ticket at the official Huay Xai pier rather than from Thai-side agents who add commission; confirm whether your ticket covers Pakbeng-only or all the way to Luang Prabang."
    ],
    "options": [
      {
        "mode": "Slow boat (2 days)",
        "durationHrs": [
          14,
          18
        ],
        "price": {
          "low": 30,
          "high": 45,
          "currency": "USD"
        },
        "freq": "Daily departure from Huay Xai, usually late morning",
        "comfort": "Two relaxed days down the Mekong with an overnight stop in Pakbeng; wooden long-boats with simple bench/airline-style seating, the classic scenic route.",
        "bookVia": "Official Huay Xai slow-boat pier ticket office",
        "recommended": true,
        "notes": "Price excludes meals and the Pakbeng guesthouse (dorms from about USD 10). Bring snacks, water and a cushion for comfort."
      },
      {
        "mode": "Speedboat",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 40,
          "high": 60,
          "currency": "USD"
        },
        "freq": "Daily in season, departs Huay Xai morning",
        "comfort": "Small high-powered boats reach Luang Prabang in a single day but are loud, cramped and have a poor safety reputation; helmets/life jackets advised.",
        "bookVia": "Huay Xai speedboat pier",
        "recommended": false,
        "notes": "Much faster but uncomfortable and considered risky; most travellers prefer the slow boat unless very time-pressed."
      },
      {
        "mode": "Bus / minivan",
        "durationHrs": [
          12,
          15
        ],
        "price": {
          "low": 25,
          "high": 40,
          "currency": "USD"
        },
        "freq": "Daily, often overnight",
        "comfort": "Overland buses and vans from Huay Xai wind through mountainous roads; cheaper and weather-independent but tiring and curvy.",
        "bookVia": "Huay Xai bus station or local agencies",
        "recommended": false,
        "notes": "An all-weather alternative to the boat; the mountain road is very winding, so bring motion-sickness remedies."
      }
    ]
  },
  {
    "id": "th-ubonratchathani-pakse",
    "from": "Ubon Ratchathani",
    "to": "Pakse",
    "country": "th",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Chong Mek (Thailand) / Vang Tao (Laos)",
    "visa": {
      "note": "Laos visa on arrival is issued at Chong Mek-Vang Tao (about USD 30-40 plus a small overtime/weekend fee, bring a passport photo). Important: this crossing does NOT accept the Lao e-visa, so obtain the visa on arrival here."
    },
    "scamWarnings": [
      "Officials at Chong Mek sometimes add small unofficial 'stamp' or weekend surcharges; keep small US dollar notes and ask for a receipt.",
      "Do not rely on a pre-purchased Lao e-visa at this border as it is not accepted here; travellers have been turned back or forced to buy a second visa."
    ],
    "options": [
      {
        "mode": "Direct cross-border bus",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 200,
          "high": 350,
          "currency": "THB"
        },
        "freq": "A few daily",
        "comfort": "Direct international buses from Ubon to Pakse handle the Chong Mek formalities and continue to the Lao side; the simplest single-ticket option.",
        "bookVia": "Ubon Ratchathani bus terminal or local agencies",
        "recommended": true,
        "notes": "Saves arranging separate transport on each side of the border; you still disembark to clear immigration in person."
      },
      {
        "mode": "Local bus / minivan via border",
        "durationHrs": [
          3.5,
          5
        ],
        "price": {
          "low": 150,
          "high": 300,
          "currency": "THB"
        },
        "freq": "Frequent to Chong Mek, then onward Lao transport",
        "comfort": "Local bus or van to Chong Mek (1-1.5 hours), cross on foot, then a Lao songthaew or van to Pakse; cheapest but involves piecing together legs.",
        "bookVia": "Ubon bus terminal, then transport on the Lao side at Vang Tao",
        "recommended": false,
        "notes": "Flexible and cheap but you arrange the Lao-side leg yourself; agree fares before boarding to avoid overcharging."
      }
    ]
  },
  {
    "id": "th-hatyai-kualalumpur",
    "from": "Hat Yai",
    "to": "Kuala Lumpur",
    "country": "th",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Padang Besar (Thailand/Malaysia rail border) or Sadao-Bukit Kayu Hitam (road border)",
    "visa": {
      "note": "Malaysia grants most Western and ASEAN nationalities visa-free entry (commonly 30-90 days). Complete the Malaysia Digital Arrival Card (MDAC) online within three days before crossing. Thai entry/exit stamps are handled at Padang Besar."
    },
    "scamWarnings": [
      "On road crossings, some minibus operators imply a fee is needed to 'process' your passport; immigration stamps are free, so handle your own documents.",
      "Confirm whether a bus ticket is truly direct or requires a change at the border, as some budget services drop you to transfer onto a commission-paying onward bus."
    ],
    "options": [
      {
        "mode": "Train via Padang Besar",
        "durationHrs": [
          9,
          12
        ],
        "price": {
          "low": 50,
          "high": 130,
          "currency": "USD"
        },
        "freq": "Daily; KTM also runs seasonal direct KL-Hat Yai charters",
        "comfort": "Cross at Padang Besar (clear both immigrations in the station), then ride KTM's modern air-conditioned ETS electric trains south to KL Sentral; smooth and scenic.",
        "bookVia": "KTMB (ktmb.com.my) for the Malaysian leg; State Railway of Thailand for the Hat Yai-Padang Besar hop",
        "recommended": true,
        "notes": "KTM launched a seasonal direct KL Sentral-Hat Yai overnight service (around 11 hours, from about RM95). Otherwise change at Padang Besar onto a frequent ETS."
      },
      {
        "mode": "Cross-border bus",
        "durationHrs": [
          9,
          12
        ],
        "price": {
          "low": 25,
          "high": 45,
          "currency": "USD"
        },
        "freq": "Several daily",
        "comfort": "Direct coaches via the Sadao-Bukit Kayu Hitam road border run day and overnight; reclining seats but immigration stops add time.",
        "bookVia": "12Go or Hat Yai bus operators",
        "recommended": false,
        "notes": "Door-to-door to KL without a train transfer, but the road border can be slow at peak times. Have your MDAC ready."
      }
    ]
  },
  {
    "id": "th-hatyai-penang",
    "from": "Hat Yai",
    "to": "Penang",
    "country": "th",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Sadao-Bukit Kayu Hitam (road) or Padang Besar (rail)",
    "visa": {
      "note": "Malaysia is visa-free for most nationalities (commonly 30-90 days). Fill in the Malaysia Digital Arrival Card (MDAC) online before crossing. Penang (George Town) is a short run south of the border."
    },
    "scamWarnings": [
      "Shared minivans to Penang are convenient but drivers occasionally demand a 'border fee'; passport stamping is free.",
      "Agree the exact drop-off point in George Town before departure, as some vans terminate at the Sungai Nibong terminal rather than the centre."
    ],
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          4,
          5
        ],
        "price": {
          "low": 15,
          "high": 25,
          "currency": "USD"
        },
        "freq": "Several daily",
        "comfort": "Shared air-conditioned vans are the most popular and direct option, crossing at Sadao and dropping in George Town; quick but cramped.",
        "bookVia": "Hat Yai travel agencies or 12Go",
        "recommended": true,
        "notes": "The fastest and most common way; vans wait while passengers clear both immigrations at the road border."
      },
      {
        "mode": "Train + transfer via Padang Besar / Butterworth",
        "durationHrs": [
          4.5,
          6
        ],
        "price": {
          "low": 15,
          "high": 40,
          "currency": "USD"
        },
        "freq": "A few connections daily",
        "comfort": "Train to Padang Besar then a KTM ETS to Butterworth, where the ferry crosses to George Town; comfortable but requires transfers.",
        "bookVia": "State Railway of Thailand and KTMB, then the Penang ferry",
        "recommended": false,
        "notes": "Scenic and relaxed but slower than the direct van due to changes at Padang Besar and Butterworth."
      }
    ]
  }
];
