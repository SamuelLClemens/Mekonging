// Vietnam transport routes — intercity plus outbound cross-border. Each option
// lists a guidance price range, journey time, frequency, comfort note and how to book.
// Figures change with season and operator, so confirm before travel.
export const ROUTES_VI = [
  {
    "id": "vi-hanoi-sapa",
    "from": "Hanoi",
    "to": "Sapa",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          5.5,
          6.5
        ],
        "price": {
          "low": 280000,
          "high": 450000,
          "currency": "VND"
        },
        "freq": "Several daily, day and overnight",
        "comfort": "Reclining berth or VIP single cabin via the Noi Bai-Lao Cai expressway with one rest stop; drops directly in Sapa town.",
        "bookVia": "Sapa Express, Inter Bus Lines or 12Go",
        "recommended": true,
        "notes": "Now the most common option for foreign travellers; far quicker than the train as it goes straight to Sapa rather than Lao Cai. Limousine vans (9-11 seats) sit at the upper end of the range."
      },
      {
        "mode": "Sleeper train + shuttle",
        "durationHrs": [
          8,
          9
        ],
        "price": {
          "low": 600000,
          "high": 1800000,
          "currency": "VND"
        },
        "freq": "Nightly (SP3 out around 22:00, SP4 back around 21:30)",
        "comfort": "Soft-sleeper 4-berth or private 2-berth luxury cabins; nostalgic but slower, and ends at Lao Cai 35 km short of Sapa.",
        "bookVia": "Vietnam Railways, or private cabin operators such as Livitrans or Chapa Express",
        "recommended": false,
        "notes": "Train terminates at Lao Cai; budget roughly a further hour and a small fare for the connecting minibus up to Sapa town. Prices climb sharply for luxury cabins."
      },
      {
        "mode": "Limousine van",
        "durationHrs": [
          5.5,
          6
        ],
        "price": {
          "low": 320000,
          "high": 450000,
          "currency": "VND"
        },
        "freq": "Several daily",
        "comfort": "9-11 seat van with hotel pickup in the Old Quarter; most comfortable seated option, no lie-flat berth.",
        "bookVia": "Sapa Express or 12Go",
        "recommended": false,
        "notes": "Good daytime choice if you prefer to sit rather than lie down and want door-to-door service."
      }
    ]
  },
  {
    "id": "vi-hanoi-halong",
    "from": "Hanoi",
    "to": "Ha Long Bay",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Limousine van",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 250000,
          "high": 500000,
          "currency": "VND"
        },
        "freq": "Multiple morning and midday departures",
        "comfort": "7-12 seat van with Old Quarter hotel pickup, timed to reach the bay before noon cruise boarding.",
        "bookVia": "Klook, GetYourGuide or your cruise operator",
        "recommended": true,
        "notes": "The expressway has cut the journey to under three hours. Morning pickups around 08:00 align with cruise check-in; most travellers book the transfer bundled with the cruise."
      },
      {
        "mode": "Shuttle/coach bus",
        "durationHrs": [
          3,
          4.5
        ],
        "price": {
          "low": 120000,
          "high": 300000,
          "currency": "VND"
        },
        "freq": "Roughly hourly, around 05:00-19:00",
        "comfort": "Standard seated coach; cheapest option but stops more and is less direct.",
        "bookVia": "12Go or at My Dinh / Luong Yen bus areas",
        "recommended": false,
        "notes": "Public coaches drop at Bai Chay bus station, from which you may need a taxi to the marina or your hotel."
      }
    ]
  },
  {
    "id": "vi-hanoi-ninhbinh",
    "from": "Hanoi",
    "to": "Ninh Binh",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Limousine van",
        "durationHrs": [
          2,
          2.5
        ],
        "price": {
          "low": 180000,
          "high": 350000,
          "currency": "VND"
        },
        "freq": "Frequent throughout the day",
        "comfort": "9-seat van with Old Quarter pickup and drop near Tam Coc, Trang An or Hoa Lu; saves navigating to a bus station.",
        "bookVia": "Baolau or 12Go",
        "recommended": true,
        "notes": "Best balance of speed, comfort and price for a day trip or short stay; vans can drop you at the specific scenic site rather than the town centre."
      },
      {
        "mode": "Train",
        "durationHrs": [
          2,
          2.5
        ],
        "price": {
          "low": 70000,
          "high": 160000,
          "currency": "VND"
        },
        "freq": "Around 5-8 daily",
        "comfort": "Soft-seat carriages on the north-south line; cheap and scenic but Ninh Binh station is a short ride from the sights.",
        "bookVia": "Vietnam Railways or Baolau",
        "recommended": false,
        "notes": "Good value and reliable timings; add a short Grab or taxi hop from the station to Tam Coc or Trang An."
      },
      {
        "mode": "Seated/sleeper bus",
        "durationHrs": [
          2,
          2.5
        ],
        "price": {
          "low": 150000,
          "high": 330000,
          "currency": "VND"
        },
        "freq": "Very frequent, all day",
        "comfort": "Standard coaches and pass-through sleepers heading south; basic but plentiful.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Many south-bound sleepers will set you down at Ninh Binh en route; confirm the bus actually stops in town rather than on the highway."
      }
    ]
  },
  {
    "id": "vi-hanoi-hagiang",
    "from": "Hanoi",
    "to": "Ha Giang",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          6,
          8
        ],
        "price": {
          "low": 200000,
          "high": 350000,
          "currency": "VND"
        },
        "freq": "Several daily including overnight departures around 20:15-22:00",
        "comfort": "Reclining berths; overnight services arrive at dawn so you can start the loop the same morning.",
        "bookVia": "Vexere, 12Go or Cat Ba Express",
        "recommended": true,
        "notes": "Overnight sleeper is the classic loop-friendly choice, saving a hotel night. Direct booking at the station is cheapest; agencies add a markup."
      },
      {
        "mode": "Limousine van",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 280000,
          "high": 450000,
          "currency": "VND"
        },
        "freq": "Daily, daytime and some evening",
        "comfort": "9-18 seat van with extra legroom, Wi-Fi and pickup; more comfortable than a standard sleeper but seated.",
        "bookVia": "Vexere or 12Go",
        "recommended": false,
        "notes": "Better for daytime travel and those who dislike lie-flat berths; some private-cabin sleeper vans also run this route."
      }
    ]
  },
  {
    "id": "vi-hanoi-phongnha",
    "from": "Hanoi",
    "to": "Phong Nha",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          9,
          11
        ],
        "price": {
          "low": 400000,
          "high": 700000,
          "currency": "VND"
        },
        "freq": "Daily, mostly evening departures",
        "comfort": "Overnight berths; some VIP cabin buses run direct into Phong Nha rather than only Dong Hoi.",
        "bookVia": "A21 Tours, Hung Thanh or 12Go",
        "recommended": false,
        "notes": "Direct sleeper saves the Dong Hoi transfer but is a long, bumpy night; confirm the bus terminates in Phong Nha town."
      },
      {
        "mode": "Sleeper train + transfer",
        "durationHrs": [
          10,
          13
        ],
        "price": {
          "low": 500000,
          "high": 1600000,
          "currency": "VND"
        },
        "freq": "Several nightly on the north-south line to Dong Hoi",
        "comfort": "Soft-sleeper cabins on Reunification or tourist carriages (Lotus, Livitrans); more restful than the bus, then a road transfer to Phong Nha.",
        "bookVia": "Vietnam Railways or Baolau, plus a Dong Hoi-Phong Nha shuttle",
        "recommended": true,
        "notes": "The most comfortable overnight option: sleep to Dong Hoi, then a roughly 45-minute transfer to Phong Nha. Tourist sleeper carriages cost more but are notably nicer."
      }
    ]
  },
  {
    "id": "vi-hanoi-hue",
    "from": "Hanoi",
    "to": "Hue",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper train",
        "durationHrs": [
          12,
          14
        ],
        "price": {
          "low": 1000000,
          "high": 2100000,
          "currency": "VND"
        },
        "freq": "Several SE services daily, best taken overnight",
        "comfort": "Air-conditioned 4-berth soft sleeper or 6-berth hard sleeper; evening departure arrives around lunchtime.",
        "bookVia": "Vietnam Railways, Baolau or Vexere",
        "recommended": true,
        "notes": "The classic overnight run down the Reunification Express; soft sleeper is the comfort sweet spot and saves a hotel night."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1.25,
          1.5
        ],
        "price": {
          "low": 700000,
          "high": 1800000,
          "currency": "VND"
        },
        "freq": "Multiple daily to Phu Bai (HUI)",
        "comfort": "Short hop on Vietnam Airlines, VietJet or Bamboo; add airport transfers at both ends.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": false,
        "notes": "Fastest door-to-door for those short on time, though once you add transfers and check-in the time saving over the night train shrinks."
      },
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          12,
          14
        ],
        "price": {
          "low": 350000,
          "high": 600000,
          "currency": "VND"
        },
        "freq": "Daily overnight",
        "comfort": "Lie-flat berths; cheapest option but a long, less comfortable ride than the train.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Budget choice; stick to reputable operators (FUTA, The Sinh Tourist) for the overnight leg."
      }
    ]
  },
  {
    "id": "vi-hanoi-danang",
    "from": "Hanoi",
    "to": "Da Nang",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1.25,
          1.5
        ],
        "price": {
          "low": 599000,
          "high": 2000000,
          "currency": "VND"
        },
        "freq": "Many daily on Vietnam Airlines, VietJet and Bamboo",
        "comfort": "Quick hop to Da Nang International; by far the fastest option.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": true,
        "notes": "For most travellers the flight is the sensible choice on this 760 km corridor; book early for sub-600,000 VND VietJet fares but expect bag fees on top."
      },
      {
        "mode": "Sleeper train",
        "durationHrs": [
          15.5,
          17
        ],
        "price": {
          "low": 600000,
          "high": 2900000,
          "currency": "VND"
        },
        "freq": "Several SE services daily",
        "comfort": "Soft-sleeper cabins; SE1/SE19 timings catch the scenic Hai Van coast by day. Slow but characterful.",
        "bookVia": "Vietnam Railways or Baolau",
        "recommended": false,
        "notes": "Choose a train that runs the Hue-Da Nang coastal stretch in daylight for the views; a 4-berth soft sleeper is the comfort-value pick."
      },
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          15,
          18
        ],
        "price": {
          "low": 400000,
          "high": 700000,
          "currency": "VND"
        },
        "freq": "Daily overnight",
        "comfort": "Lie-flat berths; the cheapest through option but a very long haul.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Only worth it for tight budgets; the flight or train are far better uses of time on this distance."
      }
    ]
  },
  {
    "id": "vi-hanoi-hochiminhcity",
    "from": "Hanoi",
    "to": "Ho Chi Minh City",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          2,
          2.25
        ],
        "price": {
          "low": 900000,
          "high": 3500000,
          "currency": "VND"
        },
        "freq": "Very frequent all day on all major carriers",
        "comfort": "Two-hour hop between the country's two biggest airports; overwhelmingly the most practical option.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": true,
        "notes": "On a 1,700 km corridor the flight is the default; one of Asia's busiest air routes, so fares are competitive if booked ahead."
      },
      {
        "mode": "Sleeper train (Reunification Express)",
        "durationHrs": [
          32,
          36
        ],
        "price": {
          "low": 1100000,
          "high": 3500000,
          "currency": "VND"
        },
        "freq": "4-5 SE departures daily (SE1-SE8)",
        "comfort": "Air-conditioned soft and hard sleepers over two nights; an iconic but lengthy journey best done in segments.",
        "bookVia": "Vietnam Railways or Baolau",
        "recommended": false,
        "notes": "The full end-to-end run is a bucket-list experience but takes well over a day; most travellers ride it in stages (e.g. Hanoi-Hue, Da Nang-Nha Trang) rather than non-stop."
      }
    ]
  },
  {
    "id": "vi-hue-danang",
    "from": "Hue",
    "to": "Da Nang",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Train (Hai Van Pass)",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 100000,
          "high": 460000,
          "currency": "VND"
        },
        "freq": "Several daily incl. heritage tourist trains",
        "comfort": "The standout scenic ride over the Hai Van Pass; heritage HD trains add a Lang Co photo stop and onboard entertainment.",
        "bookVia": "Vietnam Railways or a heritage-train operator",
        "recommended": true,
        "notes": "The single best way to see the coastline; ordinary SE trains are cheap, while the dedicated heritage tourist trains cost more but are a highlight in themselves."
      },
      {
        "mode": "Private car (Hai Van route)",
        "durationHrs": [
          1.5,
          2.5
        ],
        "price": {
          "low": 800000,
          "high": 1300000,
          "currency": "VND"
        },
        "freq": "On demand",
        "comfort": "Door-to-door with the option to drive over the pass for views or take the faster tunnel; flexible stops.",
        "bookVia": "Hue private-car operators, Xanh SM or Viator",
        "recommended": false,
        "notes": "Good value split between 3-4 people and ideal if you want to stop at Lap An Lagoon or Marble Mountains en route."
      },
      {
        "mode": "Shuttle/seated bus",
        "durationHrs": [
          2.5,
          4
        ],
        "price": {
          "low": 120000,
          "high": 300000,
          "currency": "VND"
        },
        "freq": "Frequent daily",
        "comfort": "Seated coaches and limousine vans via the tunnel; functional, less scenic than the train.",
        "bookVia": "12Go, redBus or Bookaway",
        "recommended": false,
        "notes": "Cheapest direct option; most buses use the Hai Van tunnel rather than the pass, so you miss the view."
      }
    ]
  },
  {
    "id": "vi-danang-hoian",
    "from": "Da Nang",
    "to": "Hoi An",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Grab / private car",
        "durationHrs": [
          0.75,
          1
        ],
        "price": {
          "low": 250000,
          "high": 500000,
          "currency": "VND"
        },
        "freq": "On demand, 24/7",
        "comfort": "Air-conditioned door-to-door; the easiest option and reasonably priced split between travellers.",
        "bookVia": "Grab app or a hotel-arranged private car",
        "recommended": true,
        "notes": "GrabCar is the simplest reliable choice at roughly 250,000-400,000 VND; private transfers from the airport sit a little higher."
      },
      {
        "mode": "Shuttle bus",
        "durationHrs": [
          0.75,
          1
        ],
        "price": {
          "low": 120000,
          "high": 200000,
          "currency": "VND"
        },
        "freq": "Multiple daily",
        "comfort": "Tourist shuttle (e.g. Hoi An Express) with set pickup points; comfortable mid-range option.",
        "bookVia": "Klook, GetYourGuide or hotel reception",
        "recommended": false,
        "notes": "Predictable schedules and pickup points; good if you do not want to deal with apps or haggling."
      },
      {
        "mode": "Public bus (Route 1)",
        "durationHrs": [
          1,
          2
        ],
        "price": {
          "low": 30000,
          "high": 50000,
          "currency": "VND"
        },
        "freq": "Roughly every 30 min, ~05:30-18:00",
        "comfort": "Basic local yellow bus; very cheap but slow with many stops.",
        "bookVia": "Pay the conductor on board",
        "recommended": false,
        "notes": "The budget route; insist on the correct local fare as overcharging foreigners is common."
      }
    ]
  },
  {
    "id": "vi-hue-hoian",
    "from": "Hue",
    "to": "Hoi An",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Private car (Hai Van Pass)",
        "durationHrs": [
          2.5,
          4
        ],
        "price": {
          "low": 280000,
          "high": 1200000,
          "currency": "VND"
        },
        "freq": "On demand daily",
        "comfort": "Flexible door-to-door over the Hai Van Pass with optional stops at Lang Co, Marble Mountains and the Golden Bridge.",
        "bookVia": "Hue private-car operators, GetYourGuide or Culture Pham Travel",
        "recommended": true,
        "notes": "The most rewarding way to make the trip: a direct transfer is about 3 hours, or turn it into a half-day sightseeing run. Per-seat shared cars start low; private hire costs more."
      },
      {
        "mode": "Limousine van / shuttle",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 200000,
          "high": 300000,
          "currency": "VND"
        },
        "freq": "Several daily",
        "comfort": "Shared 9-seat limousine van with hotel pickup; comfortable and good value per seat.",
        "bookVia": "12Go or local agencies (Hai Van Limousine, HAV)",
        "recommended": false,
        "notes": "Reliable shared option; most run via the tunnel for speed rather than the pass."
      }
    ]
  },
  {
    "id": "vi-danang-nhatrang",
    "from": "Da Nang",
    "to": "Nha Trang",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper train",
        "durationHrs": [
          9,
          11
        ],
        "price": {
          "low": 350000,
          "high": 900000,
          "currency": "VND"
        },
        "freq": "Several SE services, mostly evening",
        "comfort": "Soft- or hard-sleeper cabins; evening departure arrives early morning, saving a hotel night.",
        "bookVia": "Vietnam Railways or Baolau",
        "recommended": true,
        "notes": "The comfortable overnight choice on a 530 km stretch; soft sleeper around 700,000 VND, hard sleeper noticeably cheaper."
      },
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          9,
          12
        ],
        "price": {
          "low": 380000,
          "high": 600000,
          "currency": "VND"
        },
        "freq": "Daily, mostly overnight 19:00-23:00",
        "comfort": "Lie-flat berths with FUTA, The Sinh Tourist and Hanh Cafe; similar timing to the train but bumpier.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Comparable price and time to the train; pick a reputable operator and verify the advertised amenities."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.25
        ],
        "price": {
          "low": 1000000,
          "high": 3700000,
          "currency": "VND"
        },
        "freq": "Several daily to Cam Ranh (CXR)",
        "comfort": "Quick hop; the fastest option but Cam Ranh airport is 25 km south of Nha Trang.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": false,
        "notes": "Best for those short on time; factor the airport transfer, which erodes the time saving over the night train."
      }
    ]
  },
  {
    "id": "vi-nhatrang-dalat",
    "from": "Nha Trang",
    "to": "Da Lat",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Limousine van",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 170000,
          "high": 290000,
          "currency": "VND"
        },
        "freq": "About 12 daily, roughly 05:30-16:30",
        "comfort": "9-seat van with hotel pickup over the scenic Highway 27C mountain pass; the smoothest seated option.",
        "bookVia": "12Go, redBus or operators like Lac Hong / Hoang Minh",
        "recommended": true,
        "notes": "Vans are quicker than full-size buses (about 3 hours) on this winding, beautiful route; ask for a front seat if you are prone to motion sickness."
      },
      {
        "mode": "Seated bus",
        "durationHrs": [
          3.5,
          4.5
        ],
        "price": {
          "low": 170000,
          "high": 249000,
          "currency": "VND"
        },
        "freq": "Frequent daily",
        "comfort": "Air-conditioned coaches (Phuong Trang, Cuc Tung); comfortable but a little slower than vans.",
        "bookVia": "FUTA/Phuong Trang or redBus",
        "recommended": false,
        "notes": "Plentiful and reliable; only marginally cheaper than a limousine van for a slightly slower ride."
      }
    ]
  },
  {
    "id": "vi-dalat-muine",
    "from": "Da Lat",
    "to": "Mui Ne",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper/seated bus",
        "durationHrs": [
          4,
          5.5
        ],
        "price": {
          "low": 200000,
          "high": 350000,
          "currency": "VND"
        },
        "freq": "Several daily",
        "comfort": "Lie-flat or reclining seats descending from the highlands to the coast; the standard budget-friendly option.",
        "bookVia": "12Go, Bookaway or Dalat Open Tours",
        "recommended": true,
        "notes": "The practical choice on this scenic descent; many travellers time it to arrive for a sunset sand-dune jeep tour."
      },
      {
        "mode": "Private car / minivan",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 1700000,
          "high": 2600000,
          "currency": "VND"
        },
        "freq": "On demand",
        "comfort": "Door-to-door with stops; fastest and most flexible, best value when split between a group.",
        "bookVia": "12Go or local agencies",
        "recommended": false,
        "notes": "Worth it for groups or those wanting to stop at viewpoints; the per-vehicle price covers up to several passengers."
      }
    ]
  },
  {
    "id": "vi-muine-hochiminhcity",
    "from": "Mui Ne",
    "to": "Ho Chi Minh City",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper/seated bus",
        "durationHrs": [
          4,
          5.5
        ],
        "price": {
          "low": 130000,
          "high": 350000,
          "currency": "VND"
        },
        "freq": "Many daily, roughly 05:40-22:30",
        "comfort": "Reclining or lie-flat berths direct from Mui Ne; the most convenient option with frequent departures.",
        "bookVia": "Klook, 12Go or FUTA",
        "recommended": true,
        "notes": "Direct, frequent and cheap; far simpler than the train since buses leave from Mui Ne itself rather than Phan Thiet."
      },
      {
        "mode": "Train (via Phan Thiet)",
        "durationHrs": [
          4,
          5
        ],
        "price": {
          "low": 132000,
          "high": 250000,
          "currency": "VND"
        },
        "freq": "Daily services to Saigon station",
        "comfort": "Soft seat or 4-berth sleeper from Phan Thiet to Saigon; comfortable but requires a transfer to reach Mui Ne.",
        "bookVia": "Vietnam Railways or Baolau",
        "recommended": false,
        "notes": "Pleasant ride but you must first get from Mui Ne to Phan Thiet station, adding about 30 minutes each way."
      }
    ]
  },
  {
    "id": "vi-hochiminhcity-dalat",
    "from": "Ho Chi Minh City",
    "to": "Da Lat",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper bus / limousine cabin",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 220000,
          "high": 400000,
          "currency": "VND"
        },
        "freq": "Very frequent, day and night",
        "comfort": "Modern lie-flat berths and private cabin limousines (Phuong Trang, An Anh, Phong Phu) with Wi-Fi and water.",
        "bookVia": "FUTA/Phuong Trang, Klook or 12Go",
        "recommended": true,
        "notes": "The default option on this 300 km route; overnight services save a hotel night, while premium cabin buses add real comfort for a modest premium."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          0.75,
          1
        ],
        "price": {
          "low": 800000,
          "high": 2500000,
          "currency": "VND"
        },
        "freq": "A few daily to Lien Khuong (DLI)",
        "comfort": "Short hop; Lien Khuong airport is about 30 km from Da Lat, so add a transfer.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": false,
        "notes": "Only a small time saving once airport transfers and check-in are counted; useful mainly when fares are low."
      }
    ]
  },
  {
    "id": "vi-hochiminhcity-cantho",
    "from": "Ho Chi Minh City",
    "to": "Can Tho",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Limousine bus",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 165000,
          "high": 400000,
          "currency": "VND"
        },
        "freq": "Very frequent all day (FUTA roughly every 30-60 min)",
        "comfort": "Phuong Trang limousine vans and coaches with free shuttle to/from their terminals; the dominant, dependable option.",
        "bookVia": "FUTA/Phuong Trang, redBus or 12Go",
        "recommended": true,
        "notes": "The expressway keeps this gateway-to-the-Mekong run under about 3.5 hours; FUTA's frequency and free shuttle make it the easy pick."
      },
      {
        "mode": "Private car",
        "durationHrs": [
          2.5,
          3
        ],
        "price": {
          "low": 1200000,
          "high": 2200000,
          "currency": "VND"
        },
        "freq": "On demand",
        "comfort": "Door-to-door with the flexibility to stop in the Mekong Delta en route; best for groups.",
        "bookVia": "12Go or hotel-arranged transfer",
        "recommended": false,
        "notes": "Cost-effective split among 3-4 people and convenient if you want to combine the transfer with delta sightseeing."
      }
    ]
  },
  {
    "id": "vi-hochiminhcity-phuquoc",
    "from": "Ho Chi Minh City",
    "to": "Phu Quoc",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.25
        ],
        "price": {
          "low": 750000,
          "high": 1800000,
          "currency": "VND"
        },
        "freq": "6-10 daily on Vietnam Airlines, VietJet and Bamboo",
        "comfort": "One-hour hop from Tan Son Nhat to Phu Quoc International; overwhelmingly the simplest way.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": true,
        "notes": "Given the alternative is a 9-12 hour bus-plus-ferry slog, flying is the clear choice for almost everyone; fares are often very reasonable."
      },
      {
        "mode": "Bus + high-speed ferry",
        "durationHrs": [
          9,
          12
        ],
        "price": {
          "low": 450000,
          "high": 750000,
          "currency": "VND"
        },
        "freq": "Daily, timed to ferry sailings",
        "comfort": "Coach to Rach Gia or Ha Tien (5.5-8.5 hrs) then a 1-2.5 hr Superdong/Phu Quoc Express fast boat; long but cheaper.",
        "bookVia": "Bus via FUTA/12Go; ferry via Superdong or Phu Quoc Express",
        "recommended": false,
        "notes": "The Ha Tien crossing is shorter on the water; only worth the time for budget travellers or those nervous about flying."
      }
    ]
  },
  {
    "id": "vi-hochiminhcity-nhatrang",
    "from": "Ho Chi Minh City",
    "to": "Nha Trang",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Sleeper train",
        "durationHrs": [
          7,
          9
        ],
        "price": {
          "low": 300000,
          "high": 900000,
          "currency": "VND"
        },
        "freq": "Several SE services nightly (depart ~19:30-22:30)",
        "comfort": "Soft- and hard-sleeper cabins arriving early morning; comfortable and saves a hotel night.",
        "bookVia": "Vietnam Railways or Baolau",
        "recommended": true,
        "notes": "The pick on this 400 km coastal corridor; an overnight soft sleeper lands you in Nha Trang for breakfast."
      },
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          5.5,
          9
        ],
        "price": {
          "low": 230000,
          "high": 750000,
          "currency": "VND"
        },
        "freq": "Frequent, day and overnight",
        "comfort": "Lie-flat berths with FUTA and others; the expressway can make it as quick as 5.5-6 hours.",
        "bookVia": "FUTA/Phuong Trang, redBus or 12Go",
        "recommended": false,
        "notes": "Often faster than the train via the new expressway and very cheap; choose a reputable operator for overnight runs."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.25
        ],
        "price": {
          "low": 1000000,
          "high": 2700000,
          "currency": "VND"
        },
        "freq": "Several daily to Cam Ranh (CXR)",
        "comfort": "Fastest by air, but Cam Ranh is 25 km from Nha Trang so add a transfer.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": false,
        "notes": "Time saving is modest once you account for airport transfers at both ends versus the overnight train."
      }
    ]
  },
  {
    "id": "vi-danang-dalat",
    "from": "Da Nang",
    "to": "Da Lat",
    "country": "vi",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.25
        ],
        "price": {
          "low": 800000,
          "high": 2500000,
          "currency": "VND"
        },
        "freq": "Daily to Lien Khuong (DLI)",
        "comfort": "Short hop avoiding a long mountain road; Lien Khuong is about 30 km from Da Lat.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": true,
        "notes": "Best value of time on this 470 km route, where the overland alternative is a long overnight sleeper; add an airport transfer into Da Lat."
      },
      {
        "mode": "Sleeper bus",
        "durationHrs": [
          11,
          14
        ],
        "price": {
          "low": 350000,
          "high": 600000,
          "currency": "VND"
        },
        "freq": "Daily overnight",
        "comfort": "Lie-flat berths on a long inland and mountain route; cheap but tiring.",
        "bookVia": "12Go or Bookaway",
        "recommended": false,
        "notes": "Only worth it for budget travellers; the winding final climb to Da Lat makes for a bumpy night."
      }
    ]
  },
  {
    "id": "vi-hochiminhcity-phnompenh",
    "from": "Ho Chi Minh City",
    "to": "Phnom Penh",
    "country": "vi",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Moc Bai (Vietnam) - Bavet (Cambodia)",
    "visa": {
      "note": "Most nationalities can get a Cambodian e-visa online before travel or a visa-on-arrival (around USD 30, USD cash) at Bavet; carry a passport photo and small US-dollar notes. Many travellers now prefer the e-visa to avoid border touts. Have your Vietnam exit details ready and keep a few USD for any small processing fees."
    },
    "scamWarnings": [
      "At the border, some staff or 'helpers' ask for an extra dollar or two as a processing or stamp fee; this is not official, though disputing it can cause delay.",
      "Avoid no-name cheap operators that hand your passport to a runner at the border; reputable lines (Giant Ibis) have English-speaking staff who guide you through immigration yourself."
    ],
    "options": [
      {
        "mode": "VIP/seater bus",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 25,
          "high": 35,
          "currency": "USD"
        },
        "freq": "Several daily (e.g. departures around 08:00, 09:45 and afternoon)",
        "comfort": "Reclining seats, A/C, Wi-Fi, power and snacks; staff assist with the Moc Bai-Bavet formalities (about 30-45 min at the border).",
        "bookVia": "Giant Ibis, Baolau or 12Go",
        "recommended": true,
        "notes": "Giant Ibis is the standout for safety and border handling on this run; the crossing is straightforward and the whole trip is about 6 hours."
      },
      {
        "mode": "Budget cross-border bus",
        "durationHrs": [
          6.5,
          8
        ],
        "price": {
          "low": 15,
          "high": 25,
          "currency": "USD"
        },
        "freq": "Multiple daily",
        "comfort": "Basic seated coaches (Kumho, Sapaco and others); cheaper but less legroom and more variable service.",
        "bookVia": "12Go, Bookaway or redBus",
        "recommended": false,
        "notes": "Fine for budget travellers; service quality at the border varies, so keep your own passport and watch for unofficial 'fees'."
      }
    ]
  },
  {
    "id": "vi-hochiminhcity-siemreap",
    "from": "Ho Chi Minh City",
    "to": "Siem Reap",
    "country": "vi",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Moc Bai (Vietnam) - Bavet (Cambodia)",
    "visa": {
      "note": "Get a Cambodian e-visa in advance or visa-on-arrival (around USD 30) at Bavet; the same Moc Bai-Bavet crossing as Phnom Penh applies. Note the international border closes overnight (roughly 20:00-05:00), so night buses may wait at the frontier until it reopens. Carry small US-dollar notes and a passport photo."
    },
    "scamWarnings": [
      "Direct services usually change buses in Phnom Penh; confirm whether your ticket is a true through fare or two legs so you are not stranded mid-journey.",
      "As at Phnom Penh, expect unofficial 'stamp fee' requests at Bavet; an e-visa obtained beforehand reduces hassle."
    ],
    "options": [
      {
        "mode": "Direct/connecting bus (via Phnom Penh)",
        "durationHrs": [
          11,
          16
        ],
        "price": {
          "low": 41,
          "high": 56,
          "currency": "USD"
        },
        "freq": "Several daily incl. night services",
        "comfort": "Reclining seats; most journeys transfer in Phnom Penh, with night buses sometimes pausing at the closed border.",
        "bookVia": "Giant Ibis, Virak Buntham, Baolau or 12Go",
        "recommended": true,
        "notes": "Plan a full day; Giant Ibis offers a respected through service while Virak Buntham runs faster night buses around 11 hours. Total time depends heavily on border timing and the Phnom Penh transfer."
      },
      {
        "mode": "Bus to Phnom Penh + flight",
        "durationHrs": [
          7.5,
          9
        ],
        "price": {
          "low": 70,
          "high": 130,
          "currency": "USD"
        },
        "freq": "Daily, subject to flight schedule",
        "comfort": "Bus to Phnom Penh then a short hop to Siem Reap; breaks up the journey and avoids a very long bus day.",
        "bookVia": "Giant Ibis for the bus; Cambodia Angkor Air or other carriers for the flight",
        "recommended": false,
        "notes": "A comfort upgrade over the full overland run, or fly the whole way from HCMC via Phnom Penh; useful if you value time over cost."
      }
    ]
  },
  {
    "id": "vi-hanoi-vientiane",
    "from": "Hanoi",
    "to": "Vientiane",
    "country": "vi",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Cau Treo (Vietnam) - Nam Phao (Laos)",
    "visa": {
      "note": "Many nationalities get a Lao visa-on-arrival at the Cau Treo/Nam Phao gate (around USD 30-42 depending on nationality, USD cash plus a passport photo); some are visa-exempt, and a Lao e-visa is available for this crossing. The bus reaches the border in the small hours and waits until it opens, so confirm visa eligibility before boarding."
    },
    "scamWarnings": [
      "Lao border officials at Cau Treo/Nam Phao are known for small 'overtime' or stamp surcharges (often a dollar or two each way); have exact small notes ready.",
      "Book through an established Hanoi-Laos operator rather than a curb-side agent; the 24-hour ride is grueling and dubious operators have left passengers stranded at the border."
    ],
    "options": [
      {
        "mode": "Sleeper bus (direct)",
        "durationHrs": [
          22,
          24
        ],
        "price": {
          "low": 800000,
          "high": 900000,
          "currency": "VND"
        },
        "freq": "Several weekly (often Tue/Thu/Sat), departing around 18:00",
        "comfort": "Lie-flat sleeper berths; VIP single-cabin buses cost a little more. A very long ride with an overnight border wait.",
        "bookVia": "VietcareTravel, Laoviet Bus or similar Hanoi-Laos operators",
        "recommended": true,
        "notes": "The only practical single-ticket overland route; expect roughly 24 hours door-to-door, reaching Vientiane late afternoon on day two. Direct flights exist if time matters more than budget."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1,
          1.5
        ],
        "price": {
          "low": 90,
          "high": 200,
          "currency": "USD"
        },
        "freq": "Daily on Vietnam Airlines / Lao Airlines",
        "comfort": "Quick hop avoiding the long bus and border wait; far less tiring.",
        "bookVia": "Airline sites or Traveloka",
        "recommended": false,
        "notes": "Listed for contrast: most travellers short on time fly, as the 24-hour bus is an endurance experience rather than a time-saver."
      }
    ]
  },
  {
    "id": "vi-hue-savannakhet",
    "from": "Hue / Dong Ha",
    "to": "Savannakhet",
    "country": "vi",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Lao Bao (Vietnam) - Dansavanh (Laos)",
    "visa": {
      "note": "Lao visa-on-arrival is available at the Dansavanh checkpoint for most nationalities (around USD 30-42, USD cash plus a passport photo); a Lao e-visa also covers this gate. Some nationalities are visa-exempt. Sort the Lao visa at the border or online before travel; Vietnam exit is straightforward at Lao Bao."
    },
    "scamWarnings": [
      "Expect small unofficial 'stamping' or 'overtime' fees at the Lao Bao/Dansavanh gate; keep change in small US-dollar or kip notes.",
      "If you do the trip in legs, drivers at Lao Bao and Dansavanh may quote inflated onward fares; agree the price for the songthaew/bus to Savannakhet before getting in."
    ],
    "options": [
      {
        "mode": "Direct cross-border bus",
        "durationHrs": [
          8,
          10
        ],
        "price": {
          "low": 250000,
          "high": 400000,
          "currency": "VND"
        },
        "freq": "Daily morning departure from Hue",
        "comfort": "Through bus over the Lao Bao-Dansavanh gate to Savannakhet; the simplest single-ticket option but a long day.",
        "bookVia": "VietcareTravel or Hue/Dong Ha cross-border operators",
        "recommended": true,
        "notes": "Hue departures run daily; from the border it is about 220 km (3-5 hrs) on to Savannakhet on the Mekong. The pricing is guidance and varies by operator."
      },
      {
        "mode": "Local legs (minibus + Lao bus)",
        "durationHrs": [
          9,
          12
        ],
        "price": {
          "low": 200000,
          "high": 350000,
          "currency": "VND"
        },
        "freq": "Frequent minibuses Dong Ha-Lao Bao (every ~15 min); onward Lao buses every 2-3 hrs until midday",
        "comfort": "Piece together a Dong Ha-Lao Bao minibus, walk the border, then a songthaew or bus to Savannakhet; flexible but more effort.",
        "bookVia": "Pay locally at Dong Ha bus station and the Dansavanh side",
        "recommended": false,
        "notes": "Cheaper and more flexible for independent travellers; note onward Lao transport thins out by midday, so cross early. Lao-side fares are paid in kip (LAK)."
      }
    ]
  }
];
