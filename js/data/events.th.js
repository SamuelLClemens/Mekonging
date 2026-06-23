// Festivals and public holidays for Thailand — 2026 dates, with cited sources.
// `lunar: true` marks movable dates that shift each year (see `rule`). Dates are
// guidance: confirm movable festivals locally before relying on them.
export const EVENTS_TH = {
  country: "TH", label: "Thailand",
  events: [
    {
      "id": "th-new-year",
      "name": "International New Year's Day",
      "localName": "วันขึ้นปีใหม่",
      "type": "holiday",
      "start": "2026-01-01", "end": "2026-01-01", "lunar": false,
      "rule": "1 January every year (fixed Gregorian public holiday).",
      "regions": ["Nationwide"],
      "blurb": "The Gregorian New Year is a national public holiday widely celebrated alongside the traditional Thai New Year (Songkran).",
      "impact": "Government offices, banks and many businesses close. Domestic transport and beach/island destinations are heavily booked over the long weekend; expect crowds and higher hotel rates.",
      "sources": ["Tourism Authority of Thailand", "TimeAndDate"]
    },
    {
      "id": "th-chinese-new-year",
      "name": "Chinese New Year",
      "localName": "ตรุษจีน",
      "type": "festival",
      "start": "2026-02-17", "end": "2026-02-17", "lunar": true,
      "rule": "First day of the lunar new year; moves yearly. 17 February in 2026 (Year of the Horse).",
      "regions": ["Bangkok (Yaowarat/Chinatown)", "Phuket", "Nakhon Sawan", "Nationwide Chinese-Thai communities"],
      "blurb": "Thailand's large Thai-Chinese community marks the Lunar New Year with lion dances, red lanterns, family feasts and temple offerings, most visibly in Bangkok's Yaowarat district.",
      "impact": "Not an official public holiday, so government offices stay open, but many Chinese-owned shops close for one to three days. Yaowarat and Phuket Old Town become extremely crowded; book accommodation early.",
      "sources": ["Tourism Authority of Thailand", "TimeAndDate"]
    },
    {
      "id": "th-makha-bucha",
      "name": "Makha Bucha Day",
      "localName": "วันมาฆบูชา",
      "type": "holiday",
      "start": "2026-03-03", "end": "2026-03-03", "lunar": true,
      "rule": "Full moon of the third lunar month; moves yearly. 3 March in 2026.",
      "regions": ["Nationwide"],
      "blurb": "A Buddhist public holiday commemorating the spontaneous gathering of 1,250 enlightened monks to hear the Buddha preach. Devotees perform candlelit processions (wian thian) around temples.",
      "impact": "Public holiday: government offices and banks close. A nationwide ban on alcohol sales applies (bars and shops do not sell alcohol). Temples are busy in the evening; dress modestly when visiting.",
      "sources": ["Tourism Authority of Thailand", "TimeAndDate"]
    },
    {
      "id": "th-songkran",
      "name": "Songkran (Thai New Year)",
      "localName": "สงกรานต์",
      "type": "festival",
      "start": "2026-04-13", "end": "2026-04-15", "lunar": false,
      "rule": "13–15 April every year (fixed public-holiday period).",
      "regions": ["Nationwide", "Chiang Mai", "Bangkok (Khao San/Silom)", "Phuket"],
      "blurb": "The traditional Thai New Year, famous for nationwide water fights symbolising cleansing and renewal, alongside temple visits and the pouring of scented water over Buddha images and elders.",
      "impact": "Multi-day public holiday: offices and banks close and many shops shut. The busiest travel period of the year, with sold-out transport, surge pricing and packed roads. Expect to get soaked in public; protect phones and valuables. Road-accident rates spike sharply.",
      "sources": ["Tourism Authority of Thailand", "TimeAndDate"]
    },
    {
      "id": "th-visakha-bucha",
      "name": "Visakha Bucha Day",
      "localName": "วันวิสาขบูชา",
      "type": "holiday",
      "start": "2026-05-31", "end": "2026-05-31", "lunar": true,
      "rule": "Full moon of the sixth lunar month; moves yearly. 31 May in 2026, with Monday 1 June observed as a substitution holiday.",
      "regions": ["Nationwide"],
      "blurb": "The most sacred Buddhist holiday, marking the Buddha's birth, enlightenment and death, all believed to have occurred on the same full-moon day. Devotees make merit and join candlelit processions.",
      "impact": "Public holiday with a Monday substitution day in 2026: offices and banks close, creating a long weekend. Nationwide alcohol sales ban applies. Temples are crowded; dress respectfully.",
      "sources": ["Tourism Authority of Thailand", "TimeAndDate"]
    },
    {
      "id": "th-king-birthday",
      "name": "King Vajiralongkorn's Birthday",
      "localName": "วันเฉลิมพระชนมพรรษา รัชกาลที่ ๑๐",
      "type": "holiday",
      "start": "2026-07-28", "end": "2026-07-28", "lunar": false,
      "rule": "28 July every year (fixed); birthday of King Maha Vajiralongkorn (Rama X).",
      "regions": ["Nationwide"],
      "blurb": "A national holiday honouring the reigning monarch, King Rama X. Buildings are decorated in yellow and public merit-making and ceremonies are held.",
      "impact": "Public holiday: government offices and banks close. Some venues restrict alcohol service. Lese-majeste laws are strictly enforced; visitors should be respectful when discussing or photographing royal subjects.",
      "sources": ["Tourism Authority of Thailand", "PublicHolidays.asia"]
    },
    {
      "id": "th-asalha-bucha",
      "name": "Asalha Bucha Day",
      "localName": "วันอาสาฬหบูชา",
      "type": "holiday",
      "start": "2026-07-29", "end": "2026-07-29", "lunar": true,
      "rule": "Full moon of the eighth lunar month; moves yearly. 29 July in 2026, immediately followed by Khao Phansa.",
      "regions": ["Nationwide"],
      "blurb": "Commemorates the Buddha's first sermon after his enlightenment and the founding of the monastic community. It directly precedes Khao Phansa, the start of Buddhist Lent (the rains retreat).",
      "impact": "Public holiday paired with Khao Phansa, often creating a long weekend. Nationwide alcohol sales ban applies on both days. Temples and candle-procession festivals (notably Ubon Ratchathani) draw crowds.",
      "sources": ["Tourism Authority of Thailand", "TimeAndDate"]
    },
    {
      "id": "th-khao-phansa",
      "name": "Khao Phansa (Start of Buddhist Lent)",
      "localName": "วันเข้าพรรษา",
      "type": "holiday",
      "start": "2026-07-30", "end": "2026-07-30", "lunar": true,
      "rule": "First day of the waning moon of the eighth lunar month; the day after Asalha Bucha. 30 July in 2026.",
      "regions": ["Nationwide", "Ubon Ratchathani (Candle Festival)"],
      "blurb": "Marks the beginning of the three-month rains retreat (Buddhist Lent), during which monks remain in their temples. Ubon Ratchathani holds a famous carved-candle parade.",
      "impact": "Public holiday: offices and banks close. Alcohol sales are restricted. Some Thais abstain from alcohol for the full Lent period. Ubon Ratchathani is very busy during its candle festival.",
      "sources": ["Tourism Authority of Thailand", "TimeAndDate"]
    },
    {
      "id": "th-loy-krathong-yi-peng",
      "name": "Loy Krathong & Yi Peng (Lantern Festival)",
      "localName": "ลอยกระทง / ยี่เป็ง",
      "type": "festival",
      "start": "2026-11-24", "end": "2026-11-25", "lunar": true,
      "rule": "Full moon of the twelfth lunar month; moves yearly. 24–25 November in 2026.",
      "regions": ["Nationwide", "Chiang Mai (Yi Peng)", "Sukhothai", "Bangkok"],
      "blurb": "Loy Krathong sees decorated floats (krathong) released onto rivers and lakes to honour the water goddess and let go of misfortune. In northern Thailand it coincides with Yi Peng, when thousands of sky lanterns are launched, most spectacularly in Chiang Mai.",
      "impact": "Not a public holiday, but Chiang Mai is fully booked weeks ahead with surging hotel and flight prices. Sky-lantern releases are banned inside Chiang Mai city limits and permitted only at authorised venues; flight schedules are adjusted for lantern safety. Arrive two to three days early to avoid transport delays.",
      "sources": ["Tourism Authority of Thailand", "Yi Peng Chiang Mai Lantern Festival (official)"]
    }
  ]
};
