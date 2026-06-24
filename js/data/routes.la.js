// Laos transport routes — intercity plus outbound cross-border. Each option
// lists a guidance price range, journey time, frequency, comfort note and how to book.
// Figures change with season and operator, so confirm before travel.
export const ROUTES_LA = [
  {
    "id": "la-vientiane-vangvieng",
    "from": "Vientiane",
    "to": "Vang Vieng",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "High-speed train (Laos-China Railway)",
        "durationHrs": [
          0.8,
          1.2
        ],
        "price": {
          "low": 90000,
          "high": 160000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Modern air-conditioned EMU, assigned seats, very smooth ride; the standout option on this corridor.",
        "bookVia": "Official LCR Ticket app, or agents/12Go; counter at Vientiane Center in town",
        "recommended": true,
        "notes": "Vientiane (Khamsavath) station sits roughly 30-45 min outside the centre and Vang Vieng station about 10-15 min from town, so budget tuk-tuk time at both ends. Seats open 7 days ahead and sell fast in dry season."
      },
      {
        "mode": "Minivan (expressway)",
        "durationHrs": [
          1.5,
          2.5
        ],
        "price": {
          "low": 130000,
          "high": 230000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Door-to-door convenience with hotel pickup; cramped but quick now that the China-Laos Expressway is used.",
        "bookVia": "Guesthouses, 12Go, Bookaway (RG Adventure, Naluang, Family Service)",
        "recommended": false,
        "notes": "Drops in central Vientiane and central Vang Vieng, avoiding the out-of-town train station. Good for travellers who value city-centre to city-centre transfer."
      },
      {
        "mode": "Tourist bus",
        "durationHrs": [
          2.5,
          3.5
        ],
        "price": {
          "low": 130000,
          "high": 200000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Standard coach; cheapest seated option but slower than van or train.",
        "bookVia": "12Go, Bookaway, Soutchai Travel",
        "recommended": false,
        "notes": "Fine for budget travellers, but the time penalty over the minivan or train is hard to justify on such a short hop."
      }
    ]
  },
  {
    "id": "la-vangvieng-luangprabang",
    "from": "Vang Vieng",
    "to": "Luang Prabang",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "High-speed train (Laos-China Railway)",
        "durationHrs": [
          0.85,
          1.2
        ],
        "price": {
          "low": 117000,
          "high": 200000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Glides through tunnels under the mountains in around an hour; vastly more comfortable than the winding road.",
        "bookVia": "Official LCR Ticket app, agents, or 12Go",
        "recommended": true,
        "notes": "The road version of this leg is one of the most nausea-inducing in Laos, so the train is a major upgrade. Book early; second class sells out in peak months."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          5,
          6.5
        ],
        "price": {
          "low": 350000,
          "high": 450000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Tightly packed; air-con can be unreliable and the constant mountain curves trigger motion sickness for many.",
        "bookVia": "Guesthouses, 12Go, Bookaway",
        "recommended": false,
        "notes": "Only worth it if trains are sold out. Sit near the front, carry sickness tablets and water."
      },
      {
        "mode": "VIP/express bus",
        "durationHrs": [
          5,
          6.5
        ],
        "price": {
          "low": 350000,
          "high": 500000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "More legroom than a minivan but the same twisting road and journey time.",
        "bookVia": "12Go, Bookaway, bus station",
        "recommended": false,
        "notes": "For only a few dollars more than a VIP bus the train is faster and far more comfortable, so most travellers now skip the bus."
      }
    ]
  },
  {
    "id": "la-vientiane-luangprabang",
    "from": "Vientiane",
    "to": "Luang Prabang",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "High-speed train (Laos-China Railway)",
        "durationHrs": [
          1.75,
          2.7
        ],
        "price": {
          "low": 320000,
          "high": 480000,
          "currency": "LAK"
        },
        "freq": "several daily (5+)",
        "comfort": "Cuts the old 10-hour road slog to under two hours in a clean, quiet EMU; second class is ample, first class adds legroom.",
        "bookVia": "Official LCR Ticket app, agents, 12Go; ticket counters in both city centres",
        "recommended": true,
        "notes": "Easily the best way to link the two cities. The flagship LCR corridor. Both stations are well outside their respective centres, so add transfer time. Reserve days ahead in dry season."
      },
      {
        "mode": "VIP sleeper / express bus",
        "durationHrs": [
          9,
          11
        ],
        "price": {
          "low": 220000,
          "high": 360000,
          "currency": "LAK"
        },
        "freq": "daily (incl. overnight)",
        "comfort": "Reclining or bunk-style seats; overnight services save a hotel night but the mountain road is rough.",
        "bookVia": "12Go, Bookaway, Northern Bus Station",
        "recommended": false,
        "notes": "Now mostly chosen only when trains are sold out or for the overnight time-saving. Roughly USD 25-40 depending on class."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          7,
          9
        ],
        "price": {
          "low": 450000,
          "high": 550000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Faster than the big bus but cramped and very winding; frequent comfort stops.",
        "bookVia": "Guesthouses, 12Go, Bookaway",
        "recommended": false,
        "notes": "Around 540,000 LAK; offers central drop-offs but the road remains tiring compared with the train."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          0.7,
          1
        ],
        "price": {
          "low": 70,
          "high": 130,
          "currency": "USD"
        },
        "freq": "several daily",
        "comfort": "Quickest point-to-point but airport transfers and check-in erode the time saving versus the train.",
        "bookVia": "Lao Airlines, Lao Skyway, online travel agents",
        "recommended": false,
        "notes": "Useful if continuing internationally, but for the city pair the train usually wins on cost, convenience and scenery."
      }
    ]
  },
  {
    "id": "la-luangprabang-nongkhiaw",
    "from": "Luang Prabang",
    "to": "Nong Khiaw",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          3.5,
          4.5
        ],
        "price": {
          "low": 110000,
          "high": 290000,
          "currency": "LAK"
        },
        "freq": "daily (typically morning)",
        "comfort": "Air-conditioned with cushioned seats; stops on request for toilets and snacks. The standard tourist choice.",
        "bookVia": "Guesthouses, 12Go, Bookaway (Nong Khiaw Nature Tour and others)",
        "recommended": true,
        "notes": "Around USD 12-13. Roughly 140 km on a winding road; departures are limited so book a day ahead. There is no rail link on this leg."
      },
      {
        "mode": "Local/express bus",
        "durationHrs": [
          4,
          5
        ],
        "price": {
          "low": 90000,
          "high": 200000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Cheaper and slower than the van, with more stops; basic but serviceable.",
        "bookVia": "Northern bus station, 12Go, Bookaway",
        "recommended": false,
        "notes": "From about USD 9. Suits budget travellers who do not mind a longer ride."
      },
      {
        "mode": "Private taxi / car",
        "durationHrs": [
          3,
          3.5
        ],
        "price": {
          "low": 120,
          "high": 160,
          "currency": "USD"
        },
        "freq": "on demand",
        "comfort": "Fastest and most flexible; direct door-to-door with no shared stops.",
        "bookVia": "Guesthouses, local agents",
        "recommended": false,
        "notes": "Worth splitting among a group. The former passenger boat down the Nam Ou no longer runs as a scheduled service."
      }
    ]
  },
  {
    "id": "la-luangprabang-luangnamtha",
    "from": "Luang Prabang",
    "to": "Luang Namtha",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Train (LCR) to Nateuy + minivan transfer",
        "durationHrs": [
          2.3,
          3
        ],
        "price": {
          "low": 130000,
          "high": 350000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Fast 1h15-1h45 rail leg to Nateuy (Boten Junction), then a roughly 1-hour van or taxi onward to town.",
        "bookVia": "LCR Ticket app for the train; minivans/taxis wait at Nateuy on arrival",
        "recommended": true,
        "notes": "There is NO station in Luang Namtha town itself; the railway stops at Nateuy, about 30 km away. Vans meet trains; taxis ran around 100,000 LAK and may need negotiating. The combined trip beats the all-day bus."
      },
      {
        "mode": "Direct bus / minivan",
        "durationHrs": [
          8,
          9
        ],
        "price": {
          "low": 180000,
          "high": 460000,
          "currency": "LAK"
        },
        "freq": "daily (early departures)",
        "comfort": "Long mountain haul of 8-9 hours; minivans are quicker than the local bus but cramped.",
        "bookVia": "Northern bus station, 12Go, Bookaway (Chit Prasong)",
        "recommended": false,
        "notes": "The cheapest local night/morning bus runs from about 90,000 LAK but takes the full day; the train-plus-transfer combination is far quicker for similar money."
      }
    ]
  },
  {
    "id": "la-vientiane-phonsavan",
    "from": "Vientiane",
    "to": "Phonsavan",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP sleeper bus",
        "durationHrs": [
          10,
          13
        ],
        "price": {
          "low": 150000,
          "high": 250000,
          "currency": "LAK"
        },
        "freq": "around 3 daily (incl. overnight)",
        "comfort": "Long, winding mountain road to the Plain of Jars; overnight sleeper saves a day but sleep is patchy.",
        "bookVia": "12Go, Bookaway, Southern Bus Station",
        "recommended": true,
        "notes": "About 427 km. 'Family Service' style options pick up at Vientiane hotels by minivan then transfer to the sleeper. No rail link reaches Phonsavan."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          10,
          12
        ],
        "price": {
          "low": 180000,
          "high": 300000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Slightly faster than the big bus but very tight and curvy; motion sickness common.",
        "bookVia": "12Go, Bookaway, guesthouses",
        "recommended": false,
        "notes": "Roughly USD 15-21. Combined van-plus-bus tickets are common. Sit forward and carry sickness remedies."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          0.5,
          0.7
        ],
        "price": {
          "low": 60,
          "high": 110,
          "currency": "USD"
        },
        "freq": "limited (a few weekly)",
        "comfort": "By far the fastest, sparing you the mountain road, but schedules are thin and can change.",
        "bookVia": "Lao Airlines, Lao Skyway",
        "recommended": false,
        "notes": "Check current frequency before relying on it; flights to Xieng Khouang are intermittent."
      }
    ]
  },
  {
    "id": "la-vientiane-thakhek",
    "from": "Vientiane",
    "to": "Thakhek",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP/express bus",
        "durationHrs": [
          6,
          8
        ],
        "price": {
          "low": 80000,
          "high": 150000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Air-conditioned coach down Route 13 along the Mekong; the VIP is about an hour faster than the local bus.",
        "bookVia": "12Go, Bookaway (Sarah Transport, Chit Prasong, Family Service)",
        "recommended": true,
        "notes": "About 336 km. Around 13 daily bus/van departures are bookable online. VIP fares roughly 80,000 LAK and up; good base for the Thakhek motorbike loop."
      },
      {
        "mode": "Local bus",
        "durationHrs": [
          7,
          9
        ],
        "price": {
          "low": 70000,
          "high": 110000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Basic fan/older AC bus with many stops; cheapest but slowest.",
        "bookVia": "Southern Bus Station, 12Go",
        "recommended": false,
        "notes": "Departures cluster early morning and midday (around 05:00-13:00). Fine for budget travellers with time to spare."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          5.5,
          7
        ],
        "price": {
          "low": 130000,
          "high": 230000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Quicker than the bus with hotel pickup, but cramped on the long run.",
        "bookVia": "12Go, Bookaway, guesthouses",
        "recommended": false,
        "notes": "From about 287,500 LAK on booking sites. Good if you want central drop-off near the riverfront."
      }
    ]
  },
  {
    "id": "la-vientiane-savannakhet",
    "from": "Vientiane",
    "to": "Savannakhet",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP sleeper bus",
        "durationHrs": [
          9,
          12
        ],
        "price": {
          "low": 130000,
          "high": 280000,
          "currency": "LAK"
        },
        "freq": "daily (overnight)",
        "comfort": "Overnight sleeper with reclining berths, AC, water and sometimes blankets; saves a hotel night.",
        "bookVia": "12Go, Bookaway (Soutchai Travel, Chitprasong), Southern Bus Station",
        "recommended": true,
        "notes": "Roughly USD 18-29 depending on class. Long Route 13 run along the Mekong; the overnight option is the most efficient use of time."
      },
      {
        "mode": "Minivan / day bus",
        "durationHrs": [
          8,
          10.5
        ],
        "price": {
          "low": 160000,
          "high": 300000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Daytime services let you see the river scenery but are tiring over 8-10 hours.",
        "bookVia": "12Go, Bookaway",
        "recommended": false,
        "notes": "From about 362,500 LAK on booking platforms. Earliest departures can leave very early (around 01:00)."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          0.8,
          1
        ],
        "price": {
          "low": 60,
          "high": 120,
          "currency": "USD"
        },
        "freq": "several weekly",
        "comfort": "Quick hop with Lao Airlines; best if your schedule is tight.",
        "bookVia": "Lao Airlines, online travel agents",
        "recommended": false,
        "notes": "Frequencies vary seasonally; confirm before depending on it."
      }
    ]
  },
  {
    "id": "la-vientiane-pakse",
    "from": "Vientiane",
    "to": "Pakse",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "VIP sleeper bus",
        "durationHrs": [
          10,
          13
        ],
        "price": {
          "low": 180000,
          "high": 320000,
          "currency": "LAK"
        },
        "freq": "daily (overnight)",
        "comfort": "Overnight flatbed/bunk sleepers; the most comfortable land option, with water and snacks on some services.",
        "bookVia": "12Go, Bookaway, Southern Bus Station",
        "recommended": true,
        "notes": "About 670 km. Sleeper fares roughly USD 23-31. Departs evening, arrives in Pakse around dawn, saving a hotel night. No passenger rail reaches Pakse yet."
      },
      {
        "mode": "Day bus / minivan",
        "durationHrs": [
          11,
          13
        ],
        "price": {
          "low": 150000,
          "high": 300000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Daytime run down Route 13; long but lets you watch the Mekong valley pass by.",
        "bookVia": "12Go, Bookaway",
        "recommended": false,
        "notes": "From about USD 17-33 depending on vehicle and class."
      },
      {
        "mode": "Flight",
        "durationHrs": [
          1.1,
          1.3
        ],
        "price": {
          "low": 75,
          "high": 150,
          "currency": "USD"
        },
        "freq": "daily",
        "comfort": "Lao Airlines jet/turboprop; roughly 1h15 in the air, the only way to avoid the all-night journey.",
        "bookVia": "Lao Airlines, online travel agents",
        "recommended": false,
        "notes": "Worth it if you value time over money; fares start around USD 105 one way."
      }
    ]
  },
  {
    "id": "la-pakse-savannakhet",
    "from": "Pakse",
    "to": "Savannakhet",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan",
        "durationHrs": [
          4.5,
          5.5
        ],
        "price": {
          "low": 150000,
          "high": 320000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "Quickest link up Route 13; cramped but direct, with hotel pickup on many services.",
        "bookVia": "12Go, Bookaway, guesthouses",
        "recommended": true,
        "notes": "About 197 km. From around USD 22. The fastest way between the two southern hubs."
      },
      {
        "mode": "Local/express bus",
        "durationHrs": [
          5,
          6.5
        ],
        "price": {
          "low": 120000,
          "high": 250000,
          "currency": "LAK"
        },
        "freq": "several daily",
        "comfort": "More room than the van but slower with extra stops along the highway.",
        "bookVia": "Southern Bus Station, 12Go, Bookaway",
        "recommended": false,
        "notes": "Note Savannakhet town sits slightly off Route 13, so some services drop on the highway and require an onward transfer."
      }
    ]
  },
  {
    "id": "la-pakse-thakhek",
    "from": "Pakse",
    "to": "Thakhek",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Express bus",
        "durationHrs": [
          6,
          7.5
        ],
        "price": {
          "low": 150000,
          "high": 300000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Standard coach up Route 13 through Savannakhet; long but straightforward.",
        "bookVia": "12Go, Bookaway, Southern Bus Station",
        "recommended": true,
        "notes": "From about USD 24. Often the same buses continuing toward Vientiane, so confirm your drop-off point in Thakhek."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          5.5,
          7
        ],
        "price": {
          "low": 180000,
          "high": 330000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Faster than the bus but tightly packed over a long stretch.",
        "bookVia": "12Go, Bookaway, guesthouses",
        "recommended": false,
        "notes": "Useful for reaching the Thakhek loop without backtracking through Vientiane."
      }
    ]
  },
  {
    "id": "la-pakse-4000islands",
    "from": "Pakse",
    "to": "4000 Islands (Si Phan Don)",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Minivan + ferry to Don Det/Don Khon",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 180000,
          "high": 380000,
          "currency": "LAK"
        },
        "freq": "several daily (morning to mid-afternoon)",
        "comfort": "Van to Nakasang pier then a short longtail crossing; the standard, hassle-free tourist combo.",
        "bookVia": "12Go, Bookaway, Pakse agents (Green Paradise, RG Adventure, Nakasang Paradise, Sanga, Sarah Transport)",
        "recommended": true,
        "notes": "Combined van-plus-ferry around 232,000 LAK; van tickets alone roughly USD 9-18. Boats to Don Det run all day; expect to pay about USD 1.5-3 per person, more for solo or late crossings."
      },
      {
        "mode": "Local bus + ferry",
        "durationHrs": [
          3.5,
          5
        ],
        "price": {
          "low": 100000,
          "high": 250000,
          "currency": "LAK"
        },
        "freq": "hourly from Pakse Southern Terminal (approx. 07:00-15:00)",
        "comfort": "Cheaper local bus to Nakasang then the same ferry; slower and less polished than the tourist van.",
        "bookVia": "Pakse Southern Bus Terminal; ferry office at Nakasang pier",
        "recommended": false,
        "notes": "Bus to Nakasang from around USD 5. Buy the boat ticket at the small riverside office in Nakasang to avoid being overcharged."
      }
    ]
  },
  {
    "id": "la-huayxai-luangprabang",
    "from": "Huay Xai",
    "to": "Luang Prabang",
    "country": "la",
    "verified": "2026-06",
    "options": [
      {
        "mode": "Mekong slow boat (2 days via Pak Beng)",
        "durationHrs": [
          14,
          16
        ],
        "price": {
          "low": 400000,
          "high": 500000,
          "currency": "LAK"
        },
        "freq": "daily departure (morning)",
        "comfort": "Classic two-day downriver journey with a forced overnight in Pak Beng; wooden benches or reclaimed van seats, basic but scenic.",
        "bookVia": "Boat ticket office at Huay Xai pier, guesthouses, 12Go (public boat); Nong Khiaw not on this route",
        "recommended": true,
        "notes": "Around USD 35-50 per person for the public boat, often including the tuk-tuk to the pier. The bucket-list way to arrive in Luang Prabang. Accommodation in Pak Beng is separate. Many boats pause at the Pak Ou Caves before Luang Prabang."
      },
      {
        "mode": "Luxury Mekong cruise (2 days)",
        "durationHrs": [
          14,
          16
        ],
        "price": {
          "low": 140,
          "high": 400,
          "currency": "USD"
        },
        "freq": "scheduled departures",
        "comfort": "Spacious padded seating, guided stops and quality meals; overnight in a partner lodge or hotel.",
        "bookVia": "Operators such as Shompoo Cruise, Luang Say, Mekong Lover, Le Grand",
        "recommended": false,
        "notes": "Same river, far more comfort. Prices commonly run USD 140-400 per person depending on operator and cabin/lodge tier."
      },
      {
        "mode": "Speedboat",
        "durationHrs": [
          6,
          7
        ],
        "price": {
          "low": 400000,
          "high": 700000,
          "currency": "LAK"
        },
        "freq": "daily (demand dependent)",
        "comfort": "Tiny, extremely loud and notoriously dangerous high-speed craft; helmets and life jackets are essential.",
        "bookVia": "Speedboat pier at Huay Xai",
        "recommended": false,
        "notes": "Cuts the trip to one day but with a real safety risk; most travellers avoid it in favour of the slow boat."
      }
    ]
  },
  {
    "id": "la-vientiane-bangkok",
    "from": "Vientiane",
    "to": "Bangkok",
    "country": "la",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Thai-Lao Friendship Bridge 1 (Thanaleng/Vientiane - Nong Khai)",
    "visa": {
      "note": "Most Western nationalities enter Thailand visa-exempt for short stays; check your allowance. Returning to Laos later requires the Lao eVisa or visa on arrival. Carry your passport for the Thanaleng and Nong Khai immigration stops."
    },
    "options": [
      {
        "mode": "Direct sleeper train (via Friendship Bridge)",
        "durationHrs": [
          11,
          13
        ],
        "price": {
          "low": 574,
          "high": 900,
          "currency": "THB"
        },
        "freq": "daily overnight",
        "comfort": "Through service from Vientiane (Khamsavath) to Bangkok Krung Thep Aphiwat; AC sleeper berths are comfortable and you sleep through the border formalities region.",
        "bookVia": "State Railway of Thailand (SRT) online/stations; Lao end at Khamsavath/Vientiane-Tai station",
        "recommended": true,
        "notes": "A direct Vientiane-Bangkok sleeper has run since mid-2024. Sleeper berths roughly 784-874 THB; 2nd-class AC seat around 574 THB. Vientiane-Tai station is about 7 km from the centre."
      },
      {
        "mode": "Shuttle train/bus to Nong Khai + Thai train",
        "durationHrs": [
          12,
          14
        ],
        "price": {
          "low": 300,
          "high": 900,
          "currency": "THB"
        },
        "freq": "daily",
        "comfort": "Cross the bridge by 20 THB shuttle train (15 min) or ~30 THB shuttle bus, then connect to Thai rail services at Nong Khai.",
        "bookVia": "SRT for Thai trains; cross-bridge shuttle paid locally",
        "recommended": false,
        "notes": "The border is open roughly 06:00-22:00. Nong Khai-Vientiane train/shuttle fares are tiny (around 20-120 THB). Flexible but involves more changes than the through sleeper."
      },
      {
        "mode": "Direct VIP bus",
        "durationHrs": [
          11,
          13
        ],
        "price": {
          "low": 600,
          "high": 1000,
          "currency": "THB"
        },
        "freq": "daily overnight",
        "comfort": "Cross-border coach handling the bridge formalities for you; reclining seats, AC, overnight.",
        "bookVia": "12Go, Bookaway, Vientiane/Nong Khai bus terminals",
        "recommended": false,
        "notes": "Convenient single ticket but you still disembark for immigration on both sides of the bridge."
      }
    ]
  },
  {
    "id": "la-huayxai-chiangkhong",
    "from": "Huay Xai",
    "to": "Chiang Khong",
    "country": "la",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Fourth Thai-Lao Friendship Bridge (Huay Xai - Chiang Khong)",
    "visa": {
      "note": "Lao exit is straightforward. Entering Thailand, most Western passports are visa-exempt for short stays. Travelling the other way into Laos, visa on arrival is available (about USD 35 for many nationalities; bring USD cash and a passport photo), or arrange a Lao eVisa beforehand."
    },
    "scamWarnings": [
      "At the Lao bridge post, officials sometimes ask for small extra 'stamp', 'overtime' or weekend surcharges on top of the official visa fee; these are unofficial. Stay polite, ask for a receipt and pay only the posted amount.",
      "Tuk-tuk drivers on the Lao side may quote inflated fares to the slow-boat pier or town and claim the official price is higher; agree the fare before getting in and use the kip price where possible."
    ],
    "options": [
      {
        "mode": "Shuttle bus across Friendship Bridge 4",
        "durationHrs": [
          0.75,
          1.5
        ],
        "price": {
          "low": 20,
          "high": 25,
          "currency": "THB"
        },
        "freq": "frequent throughout the day",
        "comfort": "Compulsory short shuttle bus between the two immigration posts; you cannot walk across the bridge.",
        "bookVia": "Pay at the bridge bus counter on either side",
        "recommended": true,
        "notes": "Bridge fare about 20-25 THB. Whole crossing takes around an hour. There is an ATM on the Lao side but rates are poor; change money in Huay Xai or Chiang Khong town instead."
      },
      {
        "mode": "Tuk-tuk/taxi + bridge shuttle (to/from town)",
        "durationHrs": [
          1,
          2
        ],
        "price": {
          "low": 100,
          "high": 300,
          "currency": "THB"
        },
        "freq": "on demand",
        "comfort": "Local tuk-tuk links the bridge posts with Huay Xai pier/town and Chiang Khong centre, bracketing the mandatory shuttle.",
        "bookVia": "Local tuk-tuk/songthaew at each terminal",
        "recommended": false,
        "notes": "The bridge sits several km from both town centres, so factor a tuk-tuk at each end. Slow-boat travellers usually go straight from Chiang Khong to the Huay Xai pier."
      }
    ]
  },
  {
    "id": "la-pakse-ubon",
    "from": "Pakse",
    "to": "Ubon Ratchathani",
    "country": "la",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Vang Tao (Laos) - Chong Mek (Thailand)",
    "visa": {
      "note": "Lao exit at Vang Tao is simple. Most Western nationalities enter Thailand at Chong Mek visa-exempt for short stays. Coming the other way into Laos, visa on arrival is available at Vang Tao (around USD 35; USD cash and a photo help). The border runs roughly 05:00/06:00-20:00."
    },
    "scamWarnings": [
      "On the Lao side, immigration sometimes adds an informal 'processing' or 'overtime' fee of a dollar or two; this is unofficial. Pay the posted visa amount and request a receipt.",
      "Money-changers and touts at Chong Mek/Vang Tao offer poor rates and occasionally short-change travellers; change only what you need at the border and use town ATMs afterwards."
    ],
    "options": [
      {
        "mode": "International bus (Route 999)",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 200,
          "high": 350,
          "currency": "THB"
        },
        "freq": "around 2 daily",
        "comfort": "Direct cross-border coach that waits while passengers clear both posts; the simplest option.",
        "bookVia": "Pakse VIP bus terminal / Ubon bus terminal (Route 999 service)",
        "recommended": true,
        "notes": "About 200 THB and roughly 3 hours including the border. Chong Mek/Vang Tao is only about 40-45 km from Pakse. From Ubon you can continue to Bangkok by train, bus or air."
      },
      {
        "mode": "Minivan",
        "durationHrs": [
          3,
          4
        ],
        "price": {
          "low": 250,
          "high": 450,
          "currency": "THB"
        },
        "freq": "several daily",
        "comfort": "Door-to-door vans; quicker boarding but you walk across the border yourself between vehicles on some services.",
        "bookVia": "12Go, Bookaway, guesthouses",
        "recommended": false,
        "notes": "From about USD 9-14 on the Lao side. Confirm whether the same van continues past the border or whether you change vehicles."
      },
      {
        "mode": "Through bus Pakse-Bangkok",
        "durationHrs": [
          13,
          16
        ],
        "price": {
          "low": 700,
          "high": 1100,
          "currency": "THB"
        },
        "freq": "daily overnight",
        "comfort": "Long-haul coach all the way to Bangkok via Chong Mek and Ubon; overnight sleeper-style seating.",
        "bookVia": "12Go, Bookaway, Pakse VIP terminal",
        "recommended": false,
        "notes": "Saves changing in Ubon but is a very long ride; many travellers prefer to break the journey or fly onward from Ubon."
      }
    ]
  },
  {
    "id": "la-savannakhet-hue",
    "from": "Savannakhet",
    "to": "Hue",
    "country": "la",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Dansavanh (Laos) - Lao Bao (Vietnam)",
    "visa": {
      "note": "Entering Vietnam, most travellers need a Vietnam eVisa arranged online in advance (Lao Bao does not reliably offer visa on arrival), though some nationalities are visa-exempt for short stays. Returning to Laos at Dansavanh, visa on arrival is available (around USD 30-40). Carry USD cash for any small border fees."
    },
    "scamWarnings": [
      "Bus crews at Dansavanh/Lao Bao sometimes collect passports and ask for a 'stamp fee' well above the small official charge; pay only a dollar or two and ask what it covers.",
      "Arrive with a pre-approved Vietnam eVisa; travellers turning up expecting visa on arrival at Lao Bao have been turned back or pressured into overpriced 'fixer' arrangements."
    ],
    "options": [
      {
        "mode": "Direct international bus (Savannakhet - Hue/Da Nang)",
        "durationHrs": [
          10,
          13
        ],
        "price": {
          "low": 30,
          "high": 45,
          "currency": "USD"
        },
        "freq": "daily / several weekly",
        "comfort": "Cross-border coach over the Annamite range via Lao Bao; staff guide passengers through both checkpoints. Long but the only direct option.",
        "bookVia": "Savannakhet bus station, Lao-Viet Bus, 12Go, Baolau",
        "recommended": true,
        "notes": "Roughly 10-13 hours and USD 30-45 (some operators quote around 1,000,000 VND from the Vietnam side). Buses run from Savannakhet through to Dong Ha, Hue and Da Nang."
      },
      {
        "mode": "Local bus to border + Vietnamese onward transport",
        "durationHrs": [
          12,
          15
        ],
        "price": {
          "low": 25,
          "high": 45,
          "currency": "USD"
        },
        "freq": "daily",
        "comfort": "Piece-together option: Lao bus/shared taxi to Dansavanh (5-6 hours), cross on foot, then a Vietnamese bus from Lao Bao to Dong Ha and Hue.",
        "bookVia": "Savannakhet bus station; Vietnamese buses at Lao Bao",
        "recommended": false,
        "notes": "More flexible but slower and more hassle than the through bus; useful if direct departures do not align with your schedule."
      }
    ]
  },
  {
    "id": "la-vientiane-hanoi",
    "from": "Vientiane",
    "to": "Hanoi",
    "country": "la",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Nam Phao (Laos) - Cau Treo (Vietnam)",
    "visa": {
      "note": "Entering Vietnam, arrange a Vietnam eVisa online before travelling (Cau Treo does not reliably offer visa on arrival); some nationalities are visa-exempt for short stays. Returning to Laos at Nam Phao, visa on arrival is available. Expect a small (about USD 1) fee on each side."
    },
    "scamWarnings": [
      "At Nam Phao/Cau Treo, bus staff sometimes ask passengers for extra 'stamp' or 'weekend' fees beyond the genuine small charge; keep small USD notes and pay only what is posted.",
      "Long delays at this remote crossing are common, and some drivers pressure passengers to hand over passports plus cash to 'speed things up' - keep your passport and pay official counters directly where you can."
    ],
    "options": [
      {
        "mode": "Direct sleeper bus (via Nam Phao/Cau Treo)",
        "durationHrs": [
          20,
          24
        ],
        "price": {
          "low": 30,
          "high": 42,
          "currency": "USD"
        },
        "freq": "daily",
        "comfort": "Long overnight-plus sleeper with reclining bunks, AC and an onboard toilet; the border crossing high in the mountains adds time.",
        "bookVia": "Lao-Viet Bus, 12Go, Bookaway; departs Vientiane Southern Bus Station (Dong Dok)",
        "recommended": true,
        "notes": "Roughly USD 30-42 and a punishing 20-24 hours, so steel yourself. The Southern Bus Station is about 30 minutes from central Vientiane."
      },
      {
        "mode": "Flight (Vientiane - Hanoi)",
        "durationHrs": [
          1,
          1.3
        ],
        "price": {
          "low": 90,
          "high": 200,
          "currency": "USD"
        },
        "freq": "daily",
        "comfort": "About one hour in the air with Lao Airlines or Vietnam Airlines; immeasurably easier than the marathon bus.",
        "bookVia": "Lao Airlines, Vietnam Airlines, online travel agents",
        "recommended": false,
        "notes": "Strongly worth considering given the bus takes the best part of a full day. You still need your Vietnam eVisa sorted in advance."
      }
    ]
  },
  {
    "id": "la-vientiane-kunming",
    "from": "Vientiane",
    "to": "Kunming",
    "country": "la",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Boten (Laos) - Mohan (China)",
    "visa": {
      "note": "A valid Chinese visa is mandatory and MUST be obtained in advance - neither Boten nor Mohan railway ports offer visa on arrival. The through train pauses about 60 minutes at Boten/Mohan for immigration and customs; you stay on the same train afterward."
    },
    "scamWarnings": [
      "Do not travel expecting any visa facility at Boten or Mohan - travellers without a pre-issued Chinese visa are refused entry and lose the fare.",
      "Around Boten, unofficial 'agents' offer to arrange tickets or transfers for inflated fees; book trains only through the official 12306 and LCR apps or a reputable agency."
    ],
    "options": [
      {
        "mode": "International high-speed train D887/D888 (Laos-China Railway)",
        "durationHrs": [
          9,
          10.5
        ],
        "price": {
          "low": 542,
          "high": 864,
          "currency": "USD"
        },
        "freq": "daily",
        "comfort": "Single daily through service Vientiane-Kunming on modern EMU stock; 2nd class is comfortable, 1st class adds space. Border checks handled at Boten/Mohan.",
        "bookVia": "China Railway 12306 app/site and the Lao LCR Ticket app; agents such as Brother Tours",
        "recommended": true,
        "notes": "Fares quoted in CNY: about 542 CNY (2nd class) and 864 CNY (1st class) for the full international run. Departs Vientiane around 10:30, into Kunming early evening. The headline cross-border rail link from Laos to China."
      },
      {
        "mode": "Domestic LCR to Boten + onward China connection",
        "durationHrs": [
          10,
          13
        ],
        "price": {
          "low": 200000,
          "high": 350000,
          "currency": "LAK"
        },
        "freq": "daily",
        "comfort": "Take a Lao domestic train to Boten, cross at Mohan, then board a separate Chinese train onward; more legwork than the through service.",
        "bookVia": "LCR Ticket app to Boten; China Railway 12306 for the Chinese leg",
        "recommended": false,
        "notes": "Only sensible if the through D887 is sold out. You still need the China visa in hand before reaching Boten."
      }
    ]
  },
  {
    "id": "la-4000islands-stungtreng",
    "from": "4000 Islands (Don Det)",
    "to": "Stung Treng",
    "country": "la",
    "verified": "2026-06",
    "crossBorder": true,
    "border": "Nong Nok Khiene (Laos) - Trapeang Kriel (Cambodia)",
    "visa": {
      "note": "Cambodia issues visa on arrival at Trapeang Kriel (about USD 35-40 plus a small stamp surcharge), or arrange a Cambodian eVisa online in advance. Returning into Laos, visa on arrival is available at Nong Nok Khiene. Both sides commonly levy small unofficial 'stamp' fees. Bring USD cash and a passport photo."
    },
    "scamWarnings": [
      "Both immigration posts routinely demand small extra 'stamp', 'processing' or 'medical/quarantine' fees of USD 1-3 on top of the visa; these are unofficial but near-universal here - keep small notes and pay calmly.",
      "Drivers sometimes claim onward Cambodian connections from the border that do not materialise, leaving you to pay again; buy a clearly defined through-ticket from a known operator (AVT or Vet/Air Bus) and confirm exactly where it terminates."
    ],
    "options": [
      {
        "mode": "Through bus/minivan (Don Det - Stung Treng and beyond)",
        "durationHrs": [
          3,
          5
        ],
        "price": {
          "low": 20,
          "high": 28,
          "currency": "USD"
        },
        "freq": "daily (morning departures)",
        "comfort": "Ferry off the island to Nakasang, then a tourist minivan/bus to and across the border; staff shepherd passengers through both posts.",
        "bookVia": "Don Det agents; Cambodian operators AVT (Asia Van Transfer) and Vet/Air Bus, 12Go",
        "recommended": true,
        "notes": "Departures usually leave the island around 09:00. Stung Treng around USD 20; many travellers continue the same day to Kratie (~USD 28), Kampong Cham or onward to Siem Reap/Phnom Penh (USD 35-40 through-ticket)."
      },
      {
        "mode": "Local transport + cross on foot",
        "durationHrs": [
          4,
          6
        ],
        "price": {
          "low": 15,
          "high": 30,
          "currency": "USD"
        },
        "freq": "daily",
        "comfort": "Boat to Nakasang, local transfer to the border (around USD 4), walk across, then arrange a Cambodian share-taxi/van to Stung Treng.",
        "bookVia": "Nakasang transport stand; Cambodian taxis at Trapeang Kriel",
        "recommended": false,
        "notes": "Cheaper in theory but the remote border has little onward transport, so most travellers take the through-ticket to avoid being stranded."
      }
    ]
  }
];
