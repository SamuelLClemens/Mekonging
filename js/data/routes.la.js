// Laos intercity + cross-border transport reference. All prices are GUIDANCE ranges, not quotes.
// Verify current fares, schedules and visa rules before travel. Kip (LAK) figures move with inflation.
export const ROUTES_LA = [
  {
    id: "la-vte-lpq-train",
    from: "Vientiane",
    to: "Luang Prabang",
    country: "la",
    verified: "2026-06",
    options: [
      {
        mode: "High-speed train (Laos-China Railway EMU)",
        durationHrs: [1.8, 2.2],
        price: { low: 320000, high: 600000, currency: "LAK" },
        freq: "several daily",
        comfort: "Fast and smooth; modern second- and first-class EMU. Vientiane station is roughly 10 km outside the city, so budget extra time and a taxi/shuttle at both ends.",
        bookVia: "LCR ticket window (opens ~3 days ahead) or an online agent such as laostrain.com / 12Go",
        recommended: true,
        notes: "By far the best balance of speed, price and reliability. Seats sell out fast in peak season, so book a week ahead. Choose the red-and-blue EMU service, not the slow green ordinary train."
      },
      {
        mode: "Express bus / VIP coach",
        durationHrs: [9, 11],
        price: { low: 150000, high: 350000, currency: "LAK" },
        freq: "several daily",
        comfort: "Winding mountain road; cheaper but long. VIP coaches have reclining seats and a rest stop.",
        bookVia: "Northern Bus Terminal, guesthouse, or 12Go / Bookaway",
        recommended: false,
        notes: "Now mostly superseded by the train. Useful only if trains are sold out or you want the cheapest fare."
      }
    ]
  },
  {
    id: "la-vte-lpq-air",
    from: "Vientiane (VTE)",
    to: "Luang Prabang (LPQ)",
    country: "la",
    verified: "2026-06",
    options: [
      {
        mode: "Flight (Lao Airlines / Lao Skyway)",
        durationHrs: [0.7, 1],
        price: { low: 900000, high: 2000000, currency: "LAK" },
        freq: "daily (several flights weekly)",
        comfort: "Quickest door-airport-door option; short hop on turboprop or regional jet. Most expensive choice.",
        bookVia: "Lao Airlines official site (laoairlines.com) or an OTA",
        recommended: false,
        notes: "Worth it only if you are short on time and the train is full; the high-speed train usually wins on total cost and city-centre convenience."
      }
    ]
  },
  {
    id: "la-huayxai-lpq-boat",
    from: "Huay Xai",
    to: "Luang Prabang",
    country: "la",
    verified: "2026-06",
    options: [
      {
        mode: "Mekong slow boat (2 days, overnight in Pakbeng)",
        durationHrs: [12, 16],
        price: { low: 380000, high: 600000, currency: "LAK" },
        freq: "daily (departs Huay Xai morning)",
        comfort: "Scenic two-day river journey with a forced overnight stop in Pakbeng (accommodation extra). Wooden benches or salvaged car seats; bring cushion, water and snacks.",
        bookVia: "Huay Xai pier / boat office, or pre-book via a guesthouse or 12Go",
        recommended: true,
        notes: "The classic northern Laos experience and the recommended way to arrive at Luang Prabang from the Thai border. Avoid the noisy, dangerous speedboats. Confirm the price covers both legs and the pier transfer."
      }
    ]
  },
  {
    id: "la-vte-pakse-train-bus",
    from: "Vientiane",
    to: "Pakse",
    country: "la",
    verified: "2026-06",
    options: [
      {
        mode: "Sleeper / VIP overnight bus",
        durationHrs: [9, 11],
        price: { low: 170000, high: 350000, currency: "LAK" },
        freq: "daily (evening departures)",
        comfort: "Overnight VIP or sleeper bus south toward the 4000 Islands region; flat-bed or reclining berths on better coaches.",
        bookVia: "Southern Bus Terminal, guesthouse, or 12Go / Bookaway",
        recommended: true,
        notes: "The railway does not yet reach the deep south, so an overnight bus remains the practical link. Lao Airlines also flies VTE-Pakse if you prefer to skip the long ride."
      }
    ]
  },
  {
    id: "la-cross-vte-nongkhai",
    from: "Vientiane",
    to: "Nong Khai / Udon Thani (Thailand)",
    country: "la",
    verified: "2026-06",
    crossBorder: true,
    border: "First Thai-Lao Friendship Bridge (Vientiane - Nong Khai)",
    visa: {
      note: "Most Western nationalities receive a free 30- to 60-day visa exemption stamp entering Thailand; Laos issues visa-on-arrival or eVisa for many nationalities. Lao formalities are handled at the bridge, not in town. Verify current rules with the Thai and Lao immigration sites before travel."
    },
    scamWarnings: [
      "Tuk-tuk and travel-agent touts who offer to \"arrange\" your Lao or Thai visa for a fee, or claim the official desk is closed; you only need the official immigration counter at the bridge.",
      "Drivers who quote an inflated all-in fare or claim the cross-border shuttle bus is not running so they can sell a private ride; the public bus and the cross-bridge train are cheap and frequent."
    ],
    options: [
      {
        mode: "Cross-border shuttle bus + onward Thai bus/train",
        durationHrs: [1, 2],
        price: { low: 20000, high: 120000, currency: "LAK" },
        freq: "frequent throughout the day",
        comfort: "Cheap public shuttle crosses the bridge in 15-30 min; both immigration posts are quick outside peak hours. From Nong Khai connect to Thai trains or the bus to Udon Thani airport.",
        bookVia: "Buy the shuttle ticket at the bridge or Vientiane bus station; book onward Thai bus/train via 12Go or at the station",
        recommended: true,
        notes: "Simplest and cheapest way into Thailand. A twice-daily cross-border train also runs Thanaleng-Nong Khai if you prefer rail. Carry small Thai baht and Lao kip for fees."
      },
      {
        mode: "Direct international bus (Vientiane - Nong Khai/Udon Thani)",
        durationHrs: [1.5, 2.5],
        price: { low: 60000, high: 150000, currency: "LAK" },
        freq: "several daily",
        comfort: "Through-coach that waits for passengers at both immigration checks, so no need to organise your own connection at the bridge.",
        bookVia: "Vientiane Central / Talat Sao bus station, or 12Go",
        recommended: false,
        notes: "More convenient if you have luggage, but slightly pricier than doing the shuttle yourself."
      }
    ]
  }
];
