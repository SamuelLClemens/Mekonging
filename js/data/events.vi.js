// Festivals and public holidays for Vietnam — 2026 dates, with cited sources.
// `lunar: true` marks movable dates that shift each year (see `rule`). Dates are
// guidance: confirm movable festivals locally before relying on them.
export const EVENTS_VI = {
  country: "VI", label: "Vietnam",
  events: [
    {
      "id": "vi-new-year",
      "name": "International New Year's Day",
      "localName": "Tết Dương lịch",
      "type": "holiday",
      "start": "2026-01-01", "end": "2026-01-01", "lunar": false,
      "rule": "1 January every year (fixed Gregorian public holiday).",
      "regions": ["Nationwide"],
      "blurb": "The Gregorian New Year is a one-day public holiday, distinct from the far larger lunar Tet festival.",
      "impact": "Government offices and banks close for the day. Domestic tourist spots and transport are busy; otherwise impact is modest compared with Tet.",
      "sources": ["Vietnam Ministry of Home Affairs", "TimeAndDate"]
    },
    {
      "id": "vi-tet-eve",
      "name": "Lunar New Year's Eve (Tet Eve)",
      "localName": "Giao thừa / Tất niên",
      "type": "festival",
      "start": "2026-02-16", "end": "2026-02-16", "lunar": true,
      "rule": "Last day of the twelfth lunar month, eve of Tet; moves yearly. 16 February in 2026.",
      "regions": ["Nationwide"],
      "blurb": "The eve of the Lunar New Year, when families reunite for a year-end feast and await the midnight transition (Giao thua), often marked by fireworks and the first temple visit.",
      "impact": "Part of the official Tet holiday block. Shops, restaurants and services close progressively through the day; cities empty as residents return to home provinces. Pre-book all transport and lodging well in advance.",
      "sources": ["Vietnam Ministry of Home Affairs", "Vietnam Briefing"]
    },
    {
      "id": "vi-tet",
      "name": "Tet Nguyen Dan (Lunar New Year)",
      "localName": "Tết Nguyên Đán",
      "type": "holiday",
      "start": "2026-02-17", "end": "2026-02-22", "lunar": true,
      "rule": "First day of the lunar new year; moves yearly. Lunar New Year's Day is 17 February 2026 (Year of the Horse); the official public-holiday block runs 14–22 February.",
      "regions": ["Nationwide"],
      "blurb": "Vietnam's most important festival, ushering in the lunar new year with family reunions, ancestor worship, lucky money (li xi), flowering peach and apricot branches, and special foods such as banh chung.",
      "impact": "The longest public holiday of the year (a nine-day block in 2026, 14–22 February). Most shops, restaurants and businesses close for several days; domestic transport is fully booked and priced at a premium, while major cities quieten as people travel home. Plan and book everything far ahead.",
      "sources": ["Vietnam Ministry of Home Affairs", "Vietnam Briefing"]
    },
    {
      "id": "vi-perfume-pagoda",
      "name": "Perfume Pagoda Festival",
      "localName": "Lễ hội Chùa Hương",
      "type": "festival",
      "start": "2026-02-22", "end": "2026-05-11", "lunar": true,
      "rule": "Opens on the sixth day of the first lunar month and runs to the third lunar month; moves yearly. The 2026 festival opens 22 February and the official season runs to 11 May, peaking February–March.",
      "regions": ["My Duc District, Hanoi (Huong Son complex)"],
      "blurb": "Vietnam's largest and longest Buddhist pilgrimage festival, centred on the Huong Son cave-temple complex southwest of Hanoi. Pilgrims travel by boat along the Yen Stream and climb to the Huong Tich cave to pray for blessings.",
      "impact": "Enormous crowds in the opening weeks after Tet; boat queues, cable-car lines and inflated prices are common. Wear sturdy shoes for the climb and visit on weekdays to avoid the worst congestion.",
      "sources": ["Vietnam National Administration of Tourism (vietnam.travel)", "Mekong Tourism"]
    },
    {
      "id": "vi-hung-kings",
      "name": "Hung Kings' Commemoration Day",
      "localName": "Giỗ Tổ Hùng Vương",
      "type": "holiday",
      "start": "2026-04-26", "end": "2026-04-26", "lunar": true,
      "rule": "Tenth day of the third lunar month; moves yearly. 26 April in 2026 (with 27 April observed as a substitution day).",
      "regions": ["Nationwide", "Phu Tho Province (Hung Temple)"],
      "blurb": "A national holiday honouring the legendary Hung Kings, the founders of the Vietnamese nation. The principal ceremony, with incense offerings and processions, takes place at the Hung Temple in Phu Tho.",
      "impact": "Public holiday (with a Monday substitution in 2026) that abuts the Reunification/Labour holidays to extend the late-April break. Offices and banks close; the Hung Temple complex draws hundreds of thousands of visitors.",
      "sources": ["Vietnam Ministry of Home Affairs", "TimeAndDate"]
    },
    {
      "id": "vi-reunification-day",
      "name": "Reunification Day (Liberation Day)",
      "localName": "Ngày Giải phóng miền Nam",
      "type": "holiday",
      "start": "2026-04-30", "end": "2026-04-30", "lunar": false,
      "rule": "30 April every year (fixed); marks the 1975 fall of Saigon and national reunification.",
      "regions": ["Nationwide", "Ho Chi Minh City"],
      "blurb": "Commemorates the end of the Vietnam War in 1975, when North and South were reunified. Marked with flag displays, parades and patriotic events, especially in Ho Chi Minh City.",
      "impact": "Public holiday that combines with International Labour Day (1 May) to form a four-day break (30 April–3 May 2026). Offices and banks close; domestic travel and beach destinations are heavily booked with surge pricing.",
      "sources": ["Vietnam Ministry of Home Affairs", "Vietnam Briefing"]
    },
    {
      "id": "vi-labour-day",
      "name": "International Labour Day",
      "localName": "Ngày Quốc tế Lao động",
      "type": "holiday",
      "start": "2026-05-01", "end": "2026-05-01", "lunar": false,
      "rule": "1 May every year (fixed Gregorian public holiday).",
      "regions": ["Nationwide"],
      "blurb": "International Workers' Day, observed as a national public holiday directly after Reunification Day.",
      "impact": "Public holiday: offices and banks close. Combined with Reunification Day it creates a major travel weekend (30 April–3 May 2026), with crowded transport and full hotels.",
      "sources": ["Vietnam Ministry of Home Affairs", "TimeAndDate"]
    },
    {
      "id": "vi-national-day",
      "name": "National Day",
      "localName": "Quốc khánh",
      "type": "holiday",
      "start": "2026-09-02", "end": "2026-09-02", "lunar": false,
      "rule": "2 September every year (fixed); marks the 1945 Declaration of Independence. In 2026 the break runs 29 August–2 September.",
      "regions": ["Nationwide", "Hanoi (Ba Dinh Square)"],
      "blurb": "Vietnam's National Day commemorates Ho Chi Minh's 1945 declaration of independence. It features parades, fireworks and ceremonies, centred on Ba Dinh Square in Hanoi.",
      "impact": "Public holiday extended to a five-day break in 2026 (29 August–2 September). Offices and banks close; domestic transport and tourist sites are very busy. Central Hanoi sees road closures and tight security around official events.",
      "sources": ["Vietnam Ministry of Home Affairs", "Vietnam Briefing"]
    },
    {
      "id": "vi-mid-autumn",
      "name": "Mid-Autumn Festival",
      "localName": "Tết Trung Thu",
      "type": "festival",
      "start": "2026-09-25", "end": "2026-09-25", "lunar": true,
      "rule": "Fifteenth day of the eighth lunar month; moves yearly. 25 September in 2026.",
      "regions": ["Nationwide", "Hanoi (Old Quarter)", "Hoi An"],
      "blurb": "A harvest and children's festival celebrated under the full moon with mooncakes, colourful lanterns, lion dances and family gatherings. Hoi An and Hanoi's Old Quarter are especially atmospheric.",
      "impact": "Not a public holiday, so businesses stay open, but lantern markets and street processions draw big evening crowds. Mooncake prices rise and central districts become congested; book Hoi An lodging early.",
      "sources": ["Vietnam National Administration of Tourism (vietnam.travel)", "China Highlights"]
    }
  ]
};
