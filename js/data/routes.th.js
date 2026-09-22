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
  },
  {
    "id": "th-bangkok-kohchang",
    "from": "Bangkok",
    "to": "Koh Chang",
    "country": "th",
    "verified": "2026-09",
    "summary": "Koh Chang is reached by car ferry from Trat province, a crossing that runs all day. Ferries from Ao Thammachat pier land at Ao Sapparot on the island; songthaews wait there for the beaches.",
    "options": [
      {
        "mode": "Bus + car ferry",
        "tag": "cheapest",
        "durationHrs": [
          6,
          8
        ],
        "price": {
          "low": 340,
          "high": 410,
          "currency": "THB"
        },
        "freq": "Morning buses; ferries hourly 06:30–18:30",
        "comfort": "Coach from Ekkamai, then the car ferry as a foot passenger. The ferry fare is 80 THB for adults and 30 THB for children.",
        "operators": [
          "bus999",
          "cherdchai",
          "ferrykohchang"
        ],
        "legs": [
          "999 government bus from Ekkamai 07:45 and 08:45, ending at Ao Thammachat pier; 261–329 THB (two sources differ).",
          "Ferry Koh Chang, Ao Thammachat → Ao Sapparot: hourly at 45 minutes past the hour, 06:30–18:30 both ways."
        ],
        "recommended": true,
        "notes": "The 999 bus ends at the ferry pier, so there is no extra transfer. Cherdchai buses go to Trat town instead, and from there you need a songthaew to the pier."
      },
      {
        "mode": "Direct bus from Suvarnabhumi Airport (ferry included)",
        "tag": "simplest",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 650,
          "high": 650,
          "currency": "THB"
        },
        "freq": "Twice daily",
        "comfort": "Suvarnabhumi Burapha Bus from Entrance 8, Level 1 at 07:00 and 10:00, with the ferry included. Back from its White Sand Beach office at 10:00 and 13:00.",
        "recommended": false,
        "notes": "Only one published source lists this service, so confirm it is running before you rely on it."
      },
      {
        "mode": "Flight to Trat + ferry",
        "tag": "fastest",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 1580,
          "high": 4080,
          "currency": "THB"
        },
        "freq": "Bangkok Airways from Suvarnabhumi",
        "comfort": "Flight 1,500–4,000 THB plus the 80 THB ferry. Getting from the airport to the pier is extra.",
        "operators": [
          "bangkokair"
        ],
        "recommended": false,
        "notes": "Check the current timetable with Bangkok Airways; schedules change between summer and winter."
      }
    ],
    "kids": [
      "Ferry Koh Chang: children pay 30 THB, adults 80 THB. The source gives no age or height limit, so ask at the ticket window.",
      "Bangkok Airways: babies from 7 days to 24 months fly on an adult’s lap, and each needs an accompanying adult aged 16 or over.",
      "Buses: no published child-fare rule. A child who takes a seat needs a ticket — confirm at the counter."
    ],
    "sources": [
      {
        "org": "I Am Koh Chang — bus, boat & plane (updated 21 Sep 2026)",
        "url": "https://iamkohchang.com/getting-here/bus-boat-timetables.html"
      },
      {
        "org": "I Am Koh Chang — 999 bus from Bangkok",
        "url": "https://iamkohchang.com/getting-here/999-bus-bangkok-kohchang.html"
      },
      {
        "org": "Cherdchai Tour — timetables",
        "url": "https://www.cherdchaitour.com/en-us/timetables"
      },
      {
        "org": "Explore Koh Chang — How to get to Koh Mak (updated 19 Aug 2026)",
        "url": "https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/"
      },
      {
        "org": "Bangkok Airways — travelling with infants",
        "url": "https://www.bangkokair.com/young-travelers/travel-with-infant"
      }
    ]
  },
  {
    "id": "th-bangkok-kohmak",
    "from": "Bangkok",
    "to": "Koh Mak",
    "country": "th",
    "verified": "2026-09",
    "summary": "No train serves Trat. Every way in ends on a boat from one of two mainland piers: Krom Luang Chumphon pier at Laem Ngop (about 20 km from Trat town) or Laem Sok pier (40–45 min from Trat). Most boats run late morning to afternoon, so a same-day trip means leaving Bangkok early.",
    "options": [
      {
        "mode": "Bus + songthaew + speedboat",
        "tag": "cheapest",
        "durationHrs": [
          8,
          10
        ],
        "price": {
          "low": 890,
          "high": 1000,
          "currency": "THB"
        },
        "freq": "Buses all day; boats late morning–afternoon",
        "comfort": "Air-conditioned coach to Trat, a shared songthaew to the pier, then a 50–60 min speedboat. Three separate tickets.",
        "operators": [
          "bus999",
          "cherdchai",
          "panan",
          "kohmakferry",
          "leelawadee"
        ],
        "legs": [
          "Bus, Ekkamai → Trat: 999 government bus 07:45 and 08:45 (stops at Ao Thammachat pier), 261–329 THB; Cherdchai Tour from Ekkamai 11:30, 15:30, 17:30, 19:30, 23:30 and from Mo Chit 09:30, 19:45, about 280–315 THB; minivans from Ekkamai about 290 THB.",
          "Songthaew from Saen Tung junction to Krom Luang Chumphon pier (Laem Ngop): about 80 THB.",
          "Speedboat Laem Ngop → Koh Mak, 550 THB, 50–60 min."
        ],
        "timetable": [
          "Until 30 Sep 2026: Koh Mak Ferry 11:30 (back 08:30), Panan 16:00 (back 10:00).",
          "From 1 Oct 2026: Koh Mak Ferry 11:30 (back 08:30); Panan 12:30 and 16:00 (back 10:00 and 13:30).",
          "Leelawadee 14:00 (back 11:30) did not run June–September 2026 and its return was not confirmed — call before relying on it."
        ],
        "recommended": false,
        "notes": "Take a morning bus: the last speedboat leaves Laem Ngop at 16:00, and missing it means a night in Trat. The two sources for the 999 fare disagree (261 vs 329 THB) — budget for the higher one."
      },
      {
        "mode": "Combined bus + boat ticket",
        "tag": "simplest",
        "durationHrs": [
          7,
          8
        ],
        "price": {
          "low": 1000,
          "high": 1300,
          "currency": "THB"
        },
        "freq": "Early-morning departures daily",
        "comfort": "One ticket: a coach from central Bangkok or Suvarnabhumi to Laem Sok pier, timed to meet the boat. Arrives on Koh Mak around midday.",
        "operators": [
          "boonsiri",
          "kohkutexpress",
          "cherdchai"
        ],
        "legs": [
          "Boonsiri: 05:00 and 08:00 from its office on Tani Road, beside Khao San Road; about 1,100 THB (Boonsiri’s own older page says 900 THB — confirm when booking).",
          "Koh Kut Express: 05:00 or 06:00 from the Khao San area, 06:00 or 07:00 from Suvarnabhumi Airport; about 1,000–1,100 THB.",
          "Cherdchai Tour runs Ekkamai → Trat → Koh Kood/Koh Mak at 05:00 and 07:00; the fare is not published online — ask the call centre."
        ],
        "recommended": true,
        "notes": "Be at the office 30 minutes before departure. The boat may call at Koh Kood before Koh Mak, which adds time."
      },
      {
        "mode": "Flight to Trat + transfer + speedboat",
        "tag": "fastest",
        "durationHrs": [
          3,
          4.5
        ],
        "price": {
          "low": 2050,
          "high": 4550,
          "currency": "THB"
        },
        "freq": "Bangkok Airways, 3 flights daily from Suvarnabhumi",
        "comfort": "Under an hour in the air from Suvarnabhumi (BKK), then by road to Laem Ngop and the boat. The price covers the flight (1,500–4,000 THB) and the boat (550 THB); the pier transfer is extra.",
        "operators": [
          "bangkokair",
          "panan",
          "kohmakferry"
        ],
        "legs": [
          "PG301 lands about 09:10 — connects with the 11:30 boat.",
          "PG305 lands 12:40 (summer schedule) or 13:45 (winter schedule) — connects with the 16:00 boat.",
          "PG307 lands 17:15, after the last boat — plan a night in Trat.",
          "Trat Airport → Laem Ngop pier by private car about 975 THB; → Laem Sok pier about 1,500 THB. Shared taxis also meet flights."
        ],
        "recommended": false,
        "notes": "Flights to Trat leave from Suvarnabhumi (BKK)."
      },
      {
        "mode": "Private car to the pier + speedboat",
        "durationHrs": [
          5.5,
          6.5
        ],
        "price": {
          "low": 4200,
          "high": 5200,
          "currency": "THB"
        },
        "freq": "Any time, booked ahead",
        "comfort": "Door-to-pier from a Bangkok hotel, Suvarnabhumi, Don Mueang or Pattaya in 4.5–5 hours. The price is per vehicle: 4,200 THB for an SUV, 5,200 THB for a 10-seat minibus. Boat fares are extra.",
        "operators": [
          "ekctransfer"
        ],
        "recommended": false,
        "notes": "Child seats can be added for 200 THB each — ask when booking. Worth it for a family or group, and when the timing has to meet a boat."
      }
    ],
    "kids": [
      "Laem Ngop speedboats (Panan, Koh Mak Ferry, Leelawadee): under 100 cm free on a lap; 100–130 cm child fare (350 THB per Explore Koh Chang; Leelawadee’s own site says 300 THB); taller pays adult.",
      "Laem Sok boats (Boonsiri, Koh Kut Express, Chonratee): age-based, not height — Koh Kut Express carries only under-4s free, on a lap; Boonsiri charges full fare from age 5. Ask Boonsiri about a 4-year-old before you travel.",
      "Bangkok Airways: babies from 7 days to 24 months fly on an adult’s lap, and each needs an accompanying adult aged 16 or over. From age 2 a child needs their own seat.",
      "Buses: neither Cherdchai nor the 999 bus publishes a child-fare rule. A child who takes a seat needs a ticket — confirm the price at the counter before you board.",
      "Private transfers: child seats cost 200 THB each and must be requested when you book."
    ],
    "sources": [
      {
        "org": "Explore Koh Chang — How to get to Koh Mak (updated 19 Aug 2026)",
        "url": "https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/"
      },
      {
        "org": "Explore Koh Chang — Koh Mak boats (updated 19 Aug 2026)",
        "url": "https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/koh-mak-ferry-speedboat-island-hopping/"
      },
      {
        "org": "Koh Mak News — boat timetables (updated 17 Sep 2026)",
        "url": "https://kohmaknews.com/boats-timetable-from-and-to-koh-mak/"
      },
      {
        "org": "I Am Koh Chang — bus, boat & plane (updated 21 Sep 2026)",
        "url": "https://iamkohchang.com/getting-here/bus-boat-timetables.html"
      },
      {
        "org": "Cherdchai Tour — timetables",
        "url": "https://www.cherdchaitour.com/en-us/timetables"
      },
      {
        "org": "Boonsiri — How to get to Koh Mak",
        "url": "https://boonsiriferry.com/en/island-detail/How%20to%20get%20to%20Koh%20Mak%20(Complete%20version)"
      },
      {
        "org": "Leelawadee Speedboat (operator site)",
        "url": "https://www.kohmakboat.com/"
      },
      {
        "org": "Ko Kut Express (operator site)",
        "url": "https://www.kokutexpress.in.th/"
      },
      {
        "org": "Bangkok Airways — travelling with infants",
        "url": "https://www.bangkokair.com/young-travelers/travel-with-infant"
      }
    ]
  },
  {
    "id": "th-kohchang-kohmak",
    "from": "Koh Chang",
    "to": "Koh Mak",
    "country": "th",
    "verified": "2026-09",
    "summary": "Island-hopping boats run mainly November to May. Some call at Koh Wai on the way.",
    "options": [
      {
        "mode": "Catamaran (Boonsiri)",
        "tag": "cheapest",
        "durationHrs": [
          1,
          1
        ],
        "price": {
          "low": 600,
          "high": 600,
          "currency": "THB"
        },
        "freq": "Twice daily, once daily Jun–Sep",
        "comfort": "Bang Bao pier → Ao Nid pier. A catamaran, steadier than a speedboat, with a free resort shuttle on both islands (Koh Chang pickup around 07:30).",
        "operators": [
          "boonsiri"
        ],
        "timetable": [
          "From Koh Chang 09:00 and 13:00 (13:00 only, 1 Jun–30 Sep 2026); arrives 10:00 and 14:00.",
          "From Koh Mak 11:30 and 15:00."
        ],
        "recommended": true,
        "notes": "The only year-round service on this crossing."
      },
      {
        "mode": "Speedboat (Koh Chang Express)",
        "durationHrs": [
          0.5,
          0.75
        ],
        "price": {
          "low": 600,
          "high": 600,
          "currency": "THB"
        },
        "freq": "Twice daily, Oct–May",
        "comfort": "Bang Bao → Ao Nid, calling at Koh Wai (10:15, 13:15). Free shuttle to Koh Chang resorts.",
        "operators": [
          "kohchangexpress"
        ],
        "timetable": [
          "From Koh Chang 10:00 and 13:00; arrives 10:30 and 13:30.",
          "From Koh Mak 12:00 and 15:00.",
          "Suspended 1 Jun–30 Sep 2026."
        ],
        "recommended": false
      },
      {
        "mode": "Speedboat (Kai Bae Hut)",
        "tag": "fastest",
        "durationHrs": [
          1,
          1
        ],
        "price": {
          "low": 800,
          "high": 800,
          "currency": "THB"
        },
        "freq": "Once daily, Nov–Apr",
        "comfort": "Kai Bae beach → Makathanee Resort pier, calling at Koh Wai (09:30).",
        "operators": [
          "kaibaehut"
        ],
        "timetable": [
          "From Koh Chang 09:00; arrives 10:00.",
          "Suspended 1 May–31 Oct 2026."
        ],
        "recommended": false
      }
    ],
    "kids": [
      "Boonsiri charges full fare from age 5; under-4s ride free. Ask about a 4-year-old when booking.",
      "Koh Chang Express and Kai Bae Hut do not publish a child fare — ask when booking."
    ],
    "sources": [
      {
        "org": "Explore Koh Chang — Koh Mak boats (updated 19 Aug 2026)",
        "url": "https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/koh-mak-ferry-speedboat-island-hopping/"
      },
      {
        "org": "koh-mak.com — boat timetables",
        "url": "https://www.koh-mak.com/boat-timetables/"
      }
    ]
  },
  {
    "id": "th-kohmak-kohkood",
    "from": "Koh Mak",
    "to": "Koh Kood",
    "country": "th",
    "verified": "2026-09",
    "summary": "A short hop of about 30 minutes. Only Boonsiri runs through the rainy season.",
    "options": [
      {
        "mode": "Catamaran (Boonsiri)",
        "tag": "cheapest",
        "durationHrs": [
          0.5,
          0.75
        ],
        "price": {
          "low": 400,
          "high": 400,
          "currency": "THB"
        },
        "freq": "Twice daily, reduced Jun–Sep",
        "comfort": "Ao Nid pier → Ao Salad pier, Koh Kood, with a free shuttle to resorts.",
        "operators": [
          "boonsiri"
        ],
        "timetable": [
          "From Koh Mak 10:00 and 14:00 (reduced 1 Jun–30 Sep 2026)."
        ],
        "recommended": true,
        "notes": "The only service that runs year-round."
      },
      {
        "mode": "Speedboat (Koh Kut Express / Koh Chang Express)",
        "durationHrs": [
          0.5,
          0.5
        ],
        "price": {
          "low": 500,
          "high": 500,
          "currency": "THB"
        },
        "freq": "Twice daily each, Oct–May",
        "comfort": "Ao Nid pier → Klong Mad pier, Koh Kood, with a free shuttle to resorts.",
        "operators": [
          "kohkutexpress",
          "kohchangexpress"
        ],
        "timetable": [
          "Koh Chang Express from Koh Mak 10:30 and 13:30.",
          "Koh Kut Express from Koh Kood 09:00 and 14:00 (arrives Koh Mak 09:30 and 14:30).",
          "Both suspended 1 Jun–30 Sep 2026."
        ],
        "recommended": false
      },
      {
        "mode": "Speedboat (Kai Bae Hut)",
        "durationHrs": [
          0.75,
          1
        ],
        "price": {
          "low": 600,
          "high": 600,
          "currency": "THB"
        },
        "freq": "Once daily, Nov–Apr",
        "comfort": "Makathanee Resort pier → Siam Beach Resort, Koh Kood. No shuttle at the Koh Kood end.",
        "operators": [
          "kaibaehut"
        ],
        "timetable": [
          "Suspended 1 May–31 Oct 2026."
        ],
        "recommended": false
      }
    ],
    "kids": [
      "Koh Kut Express: only under-4s ride free, and only on a parent’s lap. Boonsiri charges full fare from age 5.",
      "Koh Chang Express and Kai Bae Hut do not publish a child fare — ask when booking."
    ],
    "sources": [
      {
        "org": "Explore Koh Chang — Koh Mak boats (updated 19 Aug 2026)",
        "url": "https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/koh-mak-ferry-speedboat-island-hopping/"
      },
      {
        "org": "Ko Kut Express (operator site)",
        "url": "https://www.kokutexpress.in.th/"
      }
    ]
  },
  {
    "id": "th-bangkok-kohsamui",
    "from": "Bangkok",
    "to": "Koh Samui",
    "country": "th",
    "verified": "2026-09",
    "summary": "Fly direct, or go overland by bus or train to the coast and take a boat. Overland, Lomprayah sells one ticket from Bangkok all the way to the island.",
    "options": [
      {
        "mode": "Overnight bus + ferry via Koh Tao",
        "tag": "cheapest",
        "durationHrs": [
          13.75,
          14.25
        ],
        "price": {
          "low": 1250,
          "high": 1400,
          "currency": "THB"
        },
        "freq": "Nightly",
        "comfort": "Lomprayah bus to Chumphon, then a ferry that changes onto a catamaran at Koh Tao and lands at Bangrak pier.",
        "operators": [
          "lomprayah"
        ],
        "timetable": [
          "Khao San 21:30 → Bangrak 11:15, 1,250 THB (12:15 and 1,400 THB with drop-off at your hotel).",
          "Pinklao 21:00 → Bangrak 11:15, same fares."
        ],
        "recommended": false,
        "notes": "The longest way, but the cheapest through ticket. The change at Koh Tao is part of the ticket."
      },
      {
        "mode": "Bus + catamaran (one ticket)",
        "tag": "simplest",
        "durationHrs": [
          11.5,
          13.5
        ],
        "price": {
          "low": 1450,
          "high": 1900,
          "currency": "THB"
        },
        "freq": "Morning and overnight, daily",
        "comfort": "Lomprayah coach to Chumphon, then its catamaran to Pralarn pier on Koh Samui. VIP coach seats recline further.",
        "operators": [
          "lomprayah"
        ],
        "timetable": [
          "Khao San 06:00 → Pralarn 17:30; Khao San 22:00 → Pralarn 11:30. Bus 1,450 THB, VIP bus 1,750 THB.",
          "Pinklao 21:30 → Pralarn 11:30, same fares.",
          "Drop-off at your hotel adds an hour and costs 1,600 (bus) or 1,900 THB (VIP)."
        ],
        "recommended": true,
        "notes": "Tickets are non-refundable; one free date change if asked at least 2 days before."
      },
      {
        "mode": "Sleeper train + ferry",
        "durationHrs": null,
        "price": {
          "low": 810,
          "high": 2010,
          "currency": "THB"
        },
        "freq": "Evening sleepers daily",
        "comfort": "Overnight train to Surat Thani (Phun Phin station), then to Donsak pier and a Raja car ferry (210 THB) or Lomprayah catamaran (450 THB). The train fare is the 600–1,800 THB range on the Bangkok → Surat Thani card, checked June 2026.",
        "operators": [
          "srt",
          "rajaferry",
          "lomprayah"
        ],
        "recommended": false,
        "notes": "Raja ferries leave Donsak every hour from 05:00 to 19:00, so any morning train connects."
      },
      {
        "mode": "Flight",
        "tag": "fastest",
        "durationHrs": [
          1,
          1.5
        ],
        "price": {
          "low": 68,
          "high": null,
          "currency": "USD"
        },
        "freq": "Several daily from Suvarnabhumi",
        "comfort": "Bangkok Airways flies direct to Koh Samui airport. Fares vary widely; the lowest one-way listed in September 2026 was about US$68.",
        "operators": [
          "bangkokair"
        ],
        "recommended": false,
        "notes": "Flying to Surat Thani and taking the ferry is usually cheaper — see the Bangkok → Surat Thani card."
      }
    ],
    "kids": [
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s.",
      "Trains: under 100 cm and aged 0–3 free, sharing the adult’s seat or berth; aged 4–11 and under 150 cm reduced fare; 12 and over, or over 150 cm, full fare.",
      "Raja Ferry: its online fare table does not list a child rule for the Koh Samui or Koh Phangan crossings — ask at the ticket window.",
      "Bangkok Airways: babies from 7 days to 24 months fly on an adult’s lap, with an accompanying adult aged 16 or over. From age 2 a child needs their own seat."
    ],
    "sources": [
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      },
      {
        "org": "Raja Ferry Port — sailing schedule",
        "url": "https://www.rajaferryport.com/sailing-schedule"
      },
      {
        "org": "Raja Ferry Port — fares",
        "url": "https://www.rajaferryport.com/"
      },
      {
        "org": "Seat61 — Train travel in Thailand (updated 8 Jul 2026)",
        "url": "https://www.seat61.com/Thailand.htm"
      },
      {
        "org": "Skyscanner — Bangkok to Koh Samui (Sep 2026)",
        "url": "https://www.skyscanner.com/routes/bkk/usm/bangkok-suvarnabhumi-to-samui-international.html"
      },
      {
        "org": "Bangkok Airways — travelling with infants",
        "url": "https://www.bangkokair.com/young-travelers/travel-with-infant"
      }
    ]
  },
  {
    "id": "th-bangkok-kohphangan",
    "from": "Bangkok",
    "to": "Koh Phangan",
    "country": "th",
    "verified": "2026-09",
    "summary": "No airport on Koh Phangan. Go overland on a through ticket, or fly to Koh Samui and cross by boat.",
    "options": [
      {
        "mode": "Overnight bus + ferry via Koh Tao",
        "tag": "cheapest",
        "durationHrs": [
          13,
          13.5
        ],
        "price": {
          "low": 1150,
          "high": 1350,
          "currency": "THB"
        },
        "freq": "Nightly",
        "comfort": "Lomprayah bus to Chumphon, ferry to Koh Tao, then a catamaran to Thong Sala pier.",
        "operators": [
          "lomprayah"
        ],
        "timetable": [
          "Khao San 21:30 → Thong Sala 10:30, 1,150 THB (11:30 and 1,350 THB with hotel drop-off).",
          "Pinklao 21:00 → Thong Sala 10:30, same fares."
        ],
        "recommended": false
      },
      {
        "mode": "Bus + catamaran (one ticket)",
        "tag": "simplest",
        "durationHrs": [
          10.75,
          12.5
        ],
        "price": {
          "low": 1350,
          "high": 1850,
          "currency": "THB"
        },
        "freq": "Morning and overnight, daily",
        "comfort": "Lomprayah coach to Chumphon, then its catamaran direct to Thong Sala.",
        "operators": [
          "lomprayah"
        ],
        "timetable": [
          "Khao San 06:00 → Thong Sala 16:45; Khao San 22:00 → Thong Sala 10:30. Bus 1,350 THB, VIP bus 1,650 THB.",
          "Pinklao 21:30 → Thong Sala 10:30, same fares.",
          "Hotel drop-off adds an hour: 1,550 (bus) or 1,850 THB (VIP)."
        ],
        "recommended": true,
        "notes": "Tickets are non-refundable; one free date change if asked at least 2 days before."
      },
      {
        "mode": "Sleeper train + boat",
        "durationHrs": null,
        "price": {
          "low": 880,
          "high": 2350,
          "currency": "THB"
        },
        "freq": "Evening sleepers daily",
        "comfort": "Train to Chumphon then Lomprayah from the station (1,250 THB), or train to Surat Thani then Raja from Donsak (280 THB, 2 h 30 min) or Lomprayah (550 THB). Train fare: see the Bangkok → Surat Thani card.",
        "operators": [
          "srt",
          "lomprayah",
          "rajaferry"
        ],
        "legs": [
          "Chumphon station → Thong Sala with Lomprayah: 06:00 → 10:30 or 12:00 → 16:45, 1,250 THB.",
          "Donsak → Thong Sala with Lomprayah: 11:00 → 12:45 or 15:00 → 16:30, 550 THB."
        ],
        "recommended": false
      },
      {
        "mode": "Flight to Koh Samui + boat",
        "tag": "fastest",
        "durationHrs": [
          4,
          5
        ],
        "price": {
          "low": 68,
          "high": null,
          "currency": "USD"
        },
        "freq": "Several flights daily",
        "comfort": "Bangkok Airways to Koh Samui (from about US$68 one way), then Lomprayah from Samui to Thong Sala: 500 THB with hotel pickup on Samui.",
        "operators": [
          "bangkokair",
          "lomprayah"
        ],
        "recommended": false
      }
    ],
    "kids": [
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s.",
      "Trains: under 100 cm and aged 0–3 free, sharing the adult’s seat or berth; aged 4–11 and under 150 cm reduced fare; 12 and over, or over 150 cm, full fare.",
      "Raja Ferry: its online fare table does not list a child rule for the Koh Samui or Koh Phangan crossings — ask at the ticket window.",
      "Bangkok Airways: babies from 7 days to 24 months fly on an adult’s lap, with an accompanying adult aged 16 or over. From age 2 a child needs their own seat."
    ],
    "sources": [
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      },
      {
        "org": "Raja Ferry Port — sailing schedule",
        "url": "https://www.rajaferryport.com/sailing-schedule"
      },
      {
        "org": "Raja Ferry Port — fares",
        "url": "https://www.rajaferryport.com/"
      },
      {
        "org": "Seat61 — Train travel in Thailand (updated 8 Jul 2026)",
        "url": "https://www.seat61.com/Thailand.htm"
      },
      {
        "org": "Skyscanner — Bangkok to Koh Samui (Sep 2026)",
        "url": "https://www.skyscanner.com/routes/bkk/usm/bangkok-suvarnabhumi-to-samui-international.html"
      },
      {
        "org": "Bangkok Airways — travelling with infants",
        "url": "https://www.bangkokair.com/young-travelers/travel-with-infant"
      }
    ]
  },
  {
    "id": "th-bangkok-kohtao",
    "from": "Bangkok",
    "to": "Koh Tao",
    "country": "th",
    "verified": "2026-09",
    "summary": "Koh Tao is closest to Chumphon, so every overland route goes through it. No airport on the island.",
    "options": [
      {
        "mode": "Overnight bus + ferry",
        "tag": "cheapest",
        "durationHrs": [
          10.75,
          11.25
        ],
        "price": {
          "low": 850,
          "high": 850,
          "currency": "THB"
        },
        "freq": "Nightly",
        "comfort": "Lomprayah bus to Chumphon and the early slow ferry to Mae Haad pier.",
        "operators": [
          "lomprayah"
        ],
        "timetable": [
          "Khao San 21:30 → Mae Haad 08:15.",
          "Pinklao 21:00 → Mae Haad 08:15."
        ],
        "recommended": false
      },
      {
        "mode": "Bus + catamaran (one ticket)",
        "tag": "simplest",
        "durationHrs": [
          9,
          11
        ],
        "price": {
          "low": 1250,
          "high": 1550,
          "currency": "THB"
        },
        "freq": "Morning and overnight, daily",
        "comfort": "Lomprayah coach to Chumphon, then its catamaran. VIP coach 1,550 THB.",
        "operators": [
          "lomprayah"
        ],
        "timetable": [
          "Khao San 06:00 → Mae Haad 15:00; Khao San 22:00 → Mae Haad 08:45.",
          "Pinklao 21:30 → Mae Haad 08:30."
        ],
        "recommended": true
      },
      {
        "mode": "Sleeper train + catamaran",
        "durationHrs": null,
        "price": {
          "low": 900,
          "high": 900,
          "currency": "THB"
        },
        "freq": "Evening sleepers daily",
        "comfort": "Overnight train to Chumphon, then Lomprayah’s bus from the station to the pier and the catamaran (900 THB for both). The train fare is extra — ask State Railway or check dticket.railway.co.th.",
        "operators": [
          "srt",
          "lomprayah"
        ],
        "legs": [
          "Chumphon station → Mae Haad: 06:00 → 08:30 or 12:00 → 15:00, 900 THB including the transfer."
        ],
        "recommended": false,
        "notes": "The price shown is the boat and transfer only."
      }
    ],
    "kids": [
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s.",
      "Trains: under 100 cm and aged 0–3 free, sharing the adult’s seat or berth; aged 4–11 and under 150 cm reduced fare; 12 and over, or over 150 cm, full fare."
    ],
    "sources": [
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      },
      {
        "org": "Seat61 — Train travel in Thailand (updated 8 Jul 2026)",
        "url": "https://www.seat61.com/Thailand.htm"
      }
    ]
  },
  {
    "id": "th-chumphon-kohtao",
    "planner": false,
    "from": "Chumphon",
    "to": "Koh Tao",
    "country": "th",
    "verified": "2026-09",
    "summary": "Lomprayah sails from Thung Makham Noi pier, south of Chumphon town.",
    "options": [
      {
        "mode": "Slow ferry",
        "tag": "cheapest",
        "durationHrs": [
          2.5,
          2.5
        ],
        "price": {
          "low": 450,
          "high": 450,
          "currency": "THB"
        },
        "freq": "Once daily",
        "comfort": "05:45 from the pier, arriving Mae Haad 08:15.",
        "operators": [
          "lomprayah"
        ],
        "recommended": false
      },
      {
        "mode": "Catamaran",
        "tag": "fastest",
        "durationHrs": [
          1.75,
          1.75
        ],
        "price": {
          "low": 750,
          "high": 750,
          "currency": "THB"
        },
        "freq": "Twice daily",
        "comfort": "07:00 → 08:45 and 13:15 → 15:00.",
        "operators": [
          "lomprayah"
        ],
        "recommended": true
      },
      {
        "mode": "Bus from town or station + catamaran",
        "durationHrs": [
          2.5,
          6
        ],
        "price": {
          "low": 900,
          "high": 1000,
          "currency": "THB"
        },
        "freq": "Twice daily",
        "comfort": "Lomprayah picks up from Chumphon hotels (05:45, 11:45) or the train station (06:00, 12:00) for 900 THB, or from Chumphon airport at 09:00 for 1,000 THB.",
        "operators": [
          "lomprayah"
        ],
        "recommended": false,
        "notes": "A transfer alone costs 150 THB between pier and station, 250–300 THB between pier and airport."
      }
    ],
    "kids": [
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s."
    ],
    "sources": [
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      }
    ]
  },
  {
    "id": "th-suratthani-kohsamui",
    "from": "Surat Thani",
    "to": "Koh Samui",
    "country": "th",
    "verified": "2026-09",
    "summary": "Boats leave from Donsak, about an hour east of Surat Thani town. Raja’s car ferry runs every hour; Lomprayah is faster but twice a day.",
    "options": [
      {
        "mode": "Raja car ferry",
        "tag": "cheapest",
        "durationHrs": [
          1.5,
          1.5
        ],
        "price": {
          "low": 210,
          "high": 210,
          "currency": "THB"
        },
        "freq": "Hourly, 05:00–19:00, both ways",
        "comfort": "Donsak → Lipa Noi pier on Koh Samui. Large and steady; you can take a car or motorbike.",
        "operators": [
          "rajaferry"
        ],
        "legs": [
          "From Surat Thani airport to Lipa Noi on Raja’s bus and ferry ticket: 540 THB."
        ],
        "recommended": true,
        "notes": "05:00–06:00 and 12:00–16:00 are the busiest; Raja adds boats when one fills."
      },
      {
        "mode": "Lomprayah catamaran",
        "tag": "fastest",
        "durationHrs": [
          0.75,
          0.75
        ],
        "price": {
          "low": 450,
          "high": 600,
          "currency": "THB"
        },
        "freq": "Twice daily",
        "comfort": "Donsak → Nathon pier 11:00 → 11:45 and 15:00 → 15:45, 450 THB (600 THB with hotel drop-off on Samui).",
        "operators": [
          "lomprayah"
        ],
        "legs": [
          "From Tapee pier in Surat Thani town, bus and catamaran: 10:00 → 11:45 or 13:00 → 15:45, 600 THB."
        ],
        "recommended": false
      }
    ],
    "kids": [
      "Raja Ferry: its online fare table does not list a child rule for the Koh Samui or Koh Phangan crossings — ask at the ticket window.",
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s."
    ],
    "sources": [
      {
        "org": "Raja Ferry Port — sailing schedule",
        "url": "https://www.rajaferryport.com/sailing-schedule"
      },
      {
        "org": "Raja Ferry Port — fares",
        "url": "https://www.rajaferryport.com/"
      },
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      }
    ]
  },
  {
    "id": "th-suratthani-kohphangan",
    "from": "Surat Thani",
    "to": "Koh Phangan",
    "country": "th",
    "verified": "2026-09",
    "summary": "Direct boats from Donsak to Thong Sala, or bus-and-boat tickets from Surat Thani town.",
    "options": [
      {
        "mode": "Raja car ferry",
        "tag": "cheapest",
        "durationHrs": [
          2.5,
          2.5
        ],
        "price": {
          "low": 280,
          "high": 280,
          "currency": "THB"
        },
        "freq": "Several daily",
        "comfort": "Donsak → Thong Sala. Raja’s Koh Phangan timetable is not published as text on its site — call or check at the pier.",
        "operators": [
          "rajaferry"
        ],
        "legs": [
          "From Surat Thani airport on Raja’s bus and ferry ticket: 590 THB."
        ],
        "recommended": false
      },
      {
        "mode": "Lomprayah catamaran",
        "tag": "fastest",
        "durationHrs": [
          1.5,
          1.75
        ],
        "price": {
          "low": 550,
          "high": 750,
          "currency": "THB"
        },
        "freq": "Twice daily",
        "comfort": "Donsak → Thong Sala 11:00 → 12:45 and 15:00 → 16:30, 550 THB (750 THB with hotel drop-off).",
        "operators": [
          "lomprayah"
        ],
        "legs": [
          "From Tapee pier in town: catamaran 10:00 or 13:00 (700 THB), speedboat 12:00 → 14:50 (800 THB)."
        ],
        "recommended": true
      }
    ],
    "kids": [
      "Raja Ferry: its online fare table does not list a child rule for the Koh Samui or Koh Phangan crossings — ask at the ticket window.",
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s."
    ],
    "sources": [
      {
        "org": "Raja Ferry Port — sailing schedule",
        "url": "https://www.rajaferryport.com/sailing-schedule"
      },
      {
        "org": "Raja Ferry Port — fares",
        "url": "https://www.rajaferryport.com/"
      },
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      }
    ]
  },
  {
    "id": "th-kohsamui-kohphangan",
    "from": "Koh Samui",
    "to": "Koh Phangan",
    "country": "th",
    "verified": "2026-09",
    "summary": "A short crossing with many boats. Lomprayah fares include a pickup from your Samui hotel.",
    "options": [
      {
        "mode": "Lomprayah ferry",
        "tag": "cheapest",
        "durationHrs": [
          2.25,
          2.25
        ],
        "price": {
          "low": 400,
          "high": 600,
          "currency": "THB"
        },
        "freq": "Once daily",
        "comfort": "Hotel pickup 09:15, arriving Thong Sala 11:30, 400 THB (600 THB with drop-off at your Phangan hotel).",
        "operators": [
          "lomprayah"
        ],
        "recommended": false
      },
      {
        "mode": "Lomprayah catamaran",
        "tag": "fastest",
        "durationHrs": [
          2,
          2.5
        ],
        "price": {
          "low": 500,
          "high": 700,
          "currency": "THB"
        },
        "freq": "Twice daily",
        "comfort": "Hotel pickup 06:30 → Thong Sala 08:30, and 10:30 → 13:00; 500 THB, or 700 THB with drop-off.",
        "operators": [
          "lomprayah"
        ],
        "recommended": true,
        "notes": "Coming back from Phangan the fare is 550 THB (700 with drop-off), with departures through the day to Nathon, Bangrak and Pralarn piers."
      }
    ],
    "kids": [
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s.",
      "Seatran Discovery and Raja also cross; neither publishes a child fare online — ask when booking."
    ],
    "sources": [
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      },
      {
        "org": "Seatran Discovery (operator site)",
        "url": "https://www.seatrandiscovery.com/"
      }
    ]
  },
  {
    "id": "th-kohsamui-kohtao",
    "from": "Koh Samui",
    "to": "Koh Tao",
    "country": "th",
    "verified": "2026-09",
    "summary": "Lomprayah boats call at Koh Phangan on the way. Fares include a pickup from your Samui hotel.",
    "options": [
      {
        "mode": "Lomprayah ferry",
        "tag": "cheapest",
        "durationHrs": [
          4.25,
          4.25
        ],
        "price": {
          "low": 700,
          "high": 700,
          "currency": "THB"
        },
        "freq": "Once daily",
        "comfort": "Hotel pickup 09:15, arriving Mae Haad 13:30.",
        "operators": [
          "lomprayah"
        ],
        "recommended": false
      },
      {
        "mode": "Lomprayah catamaran",
        "tag": "fastest",
        "durationHrs": [
          3,
          3.75
        ],
        "price": {
          "low": 850,
          "high": 850,
          "currency": "THB"
        },
        "freq": "Twice daily",
        "comfort": "Hotel pickup 06:30 → Mae Haad 09:30, and 10:30 → 14:15.",
        "operators": [
          "lomprayah"
        ],
        "recommended": true
      }
    ],
    "kids": [
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s.",
      "Seatran Discovery also runs this route; it does not publish a child fare online — ask when booking."
    ],
    "sources": [
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      },
      {
        "org": "Seatran Discovery (operator site)",
        "url": "https://www.seatrandiscovery.com/"
      }
    ]
  },
  {
    "id": "th-kohphangan-kohtao",
    "from": "Koh Phangan",
    "to": "Koh Tao",
    "country": "th",
    "verified": "2026-09",
    "summary": "The shortest island hop in the group. Lomprayah fares include a pickup from your Phangan hotel (not Thong Nai Pan).",
    "options": [
      {
        "mode": "Lomprayah catamaran or speedboat",
        "tag": "simplest",
        "durationHrs": [
          2,
          2.35
        ],
        "price": {
          "low": 800,
          "high": 800,
          "currency": "THB"
        },
        "freq": "Five a day",
        "comfort": "Hotel pickup 07:30 → Mae Haad 09:30 (catamaran), 07:45 → 10:05 (speedboat), 12:00 → 14:15, 12:05 → 14:05 (direct) and 15:45 → 17:45.",
        "operators": [
          "lomprayah"
        ],
        "recommended": true
      }
    ],
    "kids": [
      "Lomprayah: under 2 free on the boat (a seat on its bus or van is charged); ages 2–11 half price; 11 and over pay the adult fare. Book the child ticket with the adult’s.",
      "Seatran Discovery also runs this route; it does not publish a child fare online — ask when booking."
    ],
    "sources": [
      {
        "org": "Lomprayah — Timetable 2026",
        "url": "https://lomprayah.com/time-table"
      },
      {
        "org": "Lomprayah — Terms of service (child fares)",
        "url": "https://lomprayah.com/terms"
      },
      {
        "org": "Seatran Discovery (operator site)",
        "url": "https://www.seatrandiscovery.com/"
      }
    ]
  }
];
