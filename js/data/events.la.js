// Festivals and public holidays for Laos — 2026 dates, with cited sources.
// `lunar: true` marks movable dates that shift each year (see `rule`). Dates are
// guidance: confirm movable festivals locally before relying on them.
export const EVENTS_LA = {
  country: "LA", label: "Laos",
  events: [
    {
      "id": "la-new-year",
      "name": "International New Year's Day",
      "localName": "ປີໃໝ່ສາກົນ",
      "type": "holiday",
      "start": "2026-01-01", "end": "2026-01-01", "lunar": false,
      "rule": "1 January every year (fixed Gregorian public holiday).",
      "regions": ["Nationwide"],
      "blurb": "The Gregorian New Year is an official public holiday, separate from the traditional Lao New Year (Pi Mai) in April.",
      "impact": "Government offices and banks close. Vientiane and Luang Prabang see a tourist peak; otherwise modest disruption.",
      "sources": ["Tourism Laos (tourismlaos.org)", "TimeAndDate"]
    },
    {
      "id": "la-pi-mai",
      "name": "Lao New Year (Boun Pi Mai)",
      "localName": "ບຸນປີໃໝ່ລາວ",
      "type": "festival",
      "start": "2026-04-14", "end": "2026-04-16", "lunar": false,
      "rule": "Solar new year set by the traditional Lao calendar; 14–16 April in 2026.",
      "regions": ["Nationwide", "Luang Prabang"],
      "blurb": "Laos's most important festival, welcoming the new year with water pouring for cleansing and blessing, sand stupas, Buddha-image bathing and processions. Luang Prabang hosts the most elaborate celebrations.",
      "impact": "Major public-holiday block: most businesses and banks close and many Lao travel home, so transport is fully booked. Expect nationwide water play in the streets; Luang Prabang is extremely crowded and lodging sells out far ahead.",
      "sources": ["Tourism Laos (tourismlaos.org)", "Tourism Luang Prabang (official)"]
    },
    {
      "id": "la-boun-bang-fai",
      "name": "Boun Bang Fai (Rocket Festival)",
      "localName": "ບຸນບັ້ງໄຟ",
      "type": "festival",
      "start": "2026-05-09", "end": "2026-05-11", "lunar": true,
      "rule": "Held around the sixth lunar month before the rains; dates vary by village. Main celebrations around 9–11 May in 2026.",
      "regions": ["Vientiane area", "Vang Vieng", "Rural villages nationwide"],
      "blurb": "A pre-monsoon fertility festival in which villagers launch large homemade bamboo rockets to prompt the sky god to send rain. It is accompanied by music, dancing and bawdy revelry.",
      "impact": "Not a fixed national public holiday; dates and locations vary by village across May and June. Celebrations are lively and crowded with significant alcohol consumption; confirm the exact local date and venue before travelling.",
      "sources": ["Tourism Laos (tourismlaos.org)", "PublicHolidays.asia"]
    },
    {
      "id": "la-boun-khao-phansa",
      "name": "Boun Khao Phansa (Start of Buddhist Lent)",
      "localName": "ບຸນເຂົ້າພັນສາ",
      "type": "festival",
      "start": "2026-07-13", "end": "2026-07-13", "lunar": true,
      "rule": "Full moon of the eighth lunar month; moves yearly. 13 July in 2026.",
      "regions": ["Nationwide"],
      "blurb": "Marks the start of the three-month Buddhist Lent (rains retreat), when monks remain in their monasteries. Laypeople make merit, offer candles and robes, and many abstain from alcohol for the period.",
      "impact": "Temples are busy with merit-making, especially at dawn. Limited disruption for travellers, though some Lao reduce festivities and drinking during Lent.",
      "sources": ["Tourism Laos (tourismlaos.org)", "PublicHolidays.asia"]
    },
    {
      "id": "la-boun-awk-phansa",
      "name": "Boun Awk Phansa (End of Buddhist Lent)",
      "localName": "ບຸນອອກພັນສາ",
      "type": "festival",
      "start": "2026-10-05", "end": "2026-10-05", "lunar": true,
      "rule": "Full moon of the eleventh lunar month; moves yearly. 5 October in 2026.",
      "regions": ["Nationwide", "Vientiane", "Luang Prabang"],
      "blurb": "Celebrates the end of Buddhist Lent with dawn alms-giving and, in the evening, the floating of small candle-lit offerings (lai heua fai) on rivers to honour the naga water spirits.",
      "impact": "Riverbanks in Vientiane and Luang Prabang fill with people releasing candle floats; expect evening crowds along the Mekong. It directly precedes the boat-racing festival, so the period is busy.",
      "sources": ["Tourism Laos (tourismlaos.org)", "PublicHolidays.asia"]
    },
    {
      "id": "la-boun-suang-heua",
      "name": "Boun Suang Heua (Boat Racing Festival)",
      "localName": "ບຸນຊ່ວງເຮືອ",
      "type": "festival",
      "start": "2026-10-06", "end": "2026-10-06", "lunar": true,
      "rule": "Held the day after Awk Phansa, on the first day of the waning moon of the eleventh month; moves yearly. 6 October in 2026 in Vientiane.",
      "regions": ["Vientiane (Mekong/Fa Ngum Road)", "Luang Prabang", "Provincial river towns"],
      "blurb": "Long-boat races along the Mekong honour the river nagas and mark the end of the rainy season. The Vientiane races are the largest, drawing teams from across the country.",
      "impact": "Riverside roads such as Fa Ngum Road close for the races and draw large crowds with street-food stalls and festivities. Expect congestion near the riverfront; dates can vary slightly by province.",
      "sources": ["Tourism Laos (tourismlaos.org)", "Discover Laos Today"]
    },
    {
      "id": "la-boun-that-luang",
      "name": "That Luang Festival (Boun That Luang)",
      "localName": "ບຸນທາດຫຼວງ",
      "type": "festival",
      "start": "2026-11-24", "end": "2026-11-24", "lunar": true,
      "rule": "Full moon of the twelfth lunar month; moves yearly. Main day 24 November in 2026, with several days of surrounding events.",
      "regions": ["Vientiane (Pha That Luang)"],
      "blurb": "Laos's most important Buddhist festival, centred on the gilded Pha That Luang stupa in Vientiane. It combines candlelit processions, wax-castle offerings, mass alms-giving and a large trade fair.",
      "impact": "Vientiane sees major crowds, road closures around Pha That Luang and a fairground atmosphere. Hotels fill up, so book ahead; dress modestly for the religious ceremonies.",
      "sources": ["Tourism Laos (tourismlaos.org)", "Office Holidays"]
    }
  ]
};
