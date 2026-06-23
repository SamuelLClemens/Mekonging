// Festivals and public holidays for Cambodia — 2026 dates, with cited sources.
// `lunar: true` marks movable dates that shift each year (see `rule`). Dates are
// guidance: confirm movable festivals locally before relying on them.
export const EVENTS_KH = {
  country: "KH", label: "Cambodia",
  events: [
    {
      "id": "kh-new-year",
      "name": "International New Year's Day",
      "localName": "ទិវាចូលឆ្នាំសាកល",
      "type": "holiday",
      "start": "2026-01-01", "end": "2026-01-01", "lunar": false,
      "rule": "1 January every year (fixed Gregorian public holiday).",
      "regions": ["Nationwide"],
      "blurb": "The Gregorian New Year is an official public holiday, separate from the traditional Khmer New Year in April.",
      "impact": "Government offices and banks close. Siem Reap and beach areas see a tourist peak around the New Year period; book accommodation ahead.",
      "sources": ["National Bank of Cambodia (official holiday list)", "TimeAndDate"]
    },
    {
      "id": "kh-choul-chnam-thmey",
      "name": "Khmer New Year (Choul Chnam Thmey)",
      "localName": "បុណ្យចូលឆ្នាំថ្មី",
      "type": "festival",
      "start": "2026-04-14", "end": "2026-04-16", "lunar": false,
      "rule": "Solar new year set by the traditional Khmer calendar; 14–16 April in 2026.",
      "regions": ["Nationwide", "Siem Reap (Angkor Sankranta)"],
      "blurb": "Cambodia's most important festival, marking the end of the harvest season. Families clean homes, visit pagodas, play traditional games and pour water in blessing; Angkor Wat hosts the large Sankranta celebration.",
      "impact": "Major public-holiday block: most businesses, banks and many restaurants close as people travel to home villages. Phnom Penh empties while Siem Reap and provincial towns fill up. Expect water and powder play in the streets, and book transport early.",
      "sources": ["National Bank of Cambodia (official holiday list)", "Cambodia Ministry of Tourism"]
    },
    {
      "id": "kh-royal-ploughing",
      "name": "Royal Ploughing Ceremony",
      "localName": "ព្រះរាជពិធីបុណ្យច្រត់ព្រះនង្គ័ល",
      "type": "holiday",
      "start": "2026-05-05", "end": "2026-05-05", "lunar": true,
      "rule": "Set by the Buddhist lunar calendar in early May; moves yearly. 5 May in 2026.",
      "regions": ["Phnom Penh", "Nationwide (observed)"],
      "blurb": "An ancient royal rite marking the start of the rice-growing season. Sacred oxen plough a ceremonial furrow and are then offered foods whose choice is read as a prediction for the year's harvest.",
      "impact": "Public holiday: government offices and banks close. The main ceremony is held in Phnom Penh and draws spectators; otherwise limited disruption for travellers.",
      "sources": ["National Bank of Cambodia (official holiday list)", "TimeAndDate"]
    },
    {
      "id": "kh-king-birthday",
      "name": "King Norodom Sihamoni's Birthday",
      "localName": "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម",
      "type": "holiday",
      "start": "2026-05-14", "end": "2026-05-14", "lunar": false,
      "rule": "14 May every year (fixed); birthday of King Norodom Sihamoni.",
      "regions": ["Nationwide", "Phnom Penh"],
      "blurb": "Celebrates the birthday of the reigning monarch, King Norodom Sihamoni, with official ceremonies and decorations, especially around the Royal Palace in Phnom Penh.",
      "impact": "Public holiday: government offices and banks close. Some road closures and heightened security occur near the Royal Palace; show respect toward royal symbols and imagery.",
      "sources": ["National Bank of Cambodia (official holiday list)", "TimeAndDate"]
    },
    {
      "id": "kh-visak-bochea",
      "name": "Visak Bochea Day",
      "localName": "ពិធីបុណ្យវិសាខបូជា",
      "type": "holiday",
      "start": "2026-05-22", "end": "2026-05-22", "lunar": true,
      "rule": "Full moon of the sixth lunar month; moves yearly. 22 May in 2026.",
      "regions": ["Nationwide"],
      "blurb": "The holiest Buddhist day, commemorating the birth, enlightenment and passing of the Buddha. Devotees gather at pagodas for candlelit processions and merit-making.",
      "impact": "Public holiday: government offices and banks close. Pagodas are busy with worshippers; dress modestly when visiting temples. Limited disruption beyond closures.",
      "sources": ["National Bank of Cambodia (official holiday list)", "TimeAndDate"]
    },
    {
      "id": "kh-pchum-ben",
      "name": "Pchum Ben (Ancestors' Day)",
      "localName": "បុណ្យភ្ជុំបិណ្ឌ",
      "type": "festival",
      "start": "2026-10-10", "end": "2026-10-12", "lunar": true,
      "rule": "Culminates on the fifteenth day of the waning moon of the tenth lunar month; moves yearly. The public-holiday block is 10–12 October in 2026.",
      "regions": ["Nationwide"],
      "blurb": "A deeply important religious festival when Cambodians honour deceased ancestors by bringing food offerings to pagodas for monks to dedicate to wandering spirits. The 15-day Kan Ben period culminates in Ben Thom.",
      "impact": "Three-day public holiday: many businesses close and city residents travel to ancestral pagodas, so Phnom Penh quietens while provincial transport is busy. Pagodas are crowded in the early mornings.",
      "sources": ["National Bank of Cambodia (official holiday list)", "TimeAndDate"]
    },
    {
      "id": "kh-independence-day",
      "name": "Independence Day",
      "localName": "ពិធីបុណ្យឯករាជ្យជាតិ",
      "type": "holiday",
      "start": "2026-11-09", "end": "2026-11-09", "lunar": false,
      "rule": "9 November every year (fixed); marks independence from France in 1953.",
      "regions": ["Nationwide", "Phnom Penh (Independence Monument)"],
      "blurb": "Commemorates Cambodia's independence from French colonial rule in 1953, marked by ceremonies, a flame-lighting at the Independence Monument and parades in Phnom Penh.",
      "impact": "Public holiday: government offices and banks close. Road closures and crowds occur around the Independence Monument in Phnom Penh during official ceremonies.",
      "sources": ["National Bank of Cambodia (official holiday list)", "TimeAndDate"]
    },
    {
      "id": "kh-bon-om-touk",
      "name": "Bon Om Touk (Water Festival)",
      "localName": "បុណ្យអុំទូក",
      "type": "festival",
      "start": "2026-11-23", "end": "2026-11-25", "lunar": true,
      "rule": "Full moon of the twelfth lunar month; moves yearly. 23–25 November in 2026.",
      "regions": ["Phnom Penh (Tonle Sap/Riverside)", "Siem Reap", "Nationwide"],
      "blurb": "Cambodia's exuberant Water Festival celebrates the reversal of the Tonle Sap River's flow and a historic naval victory. It features long-boat races, illuminated floats, fireworks and the full-moon salutation.",
      "impact": "Three-day public holiday drawing huge crowds to the Phnom Penh riverside; expect dense crowds, road closures, packed hotels and surge pricing. Pickpocketing rises in the crush, so guard valuables.",
      "sources": ["National Bank of Cambodia (official holiday list)", "Cambodia Ministry of Tourism"]
    }
  ]
};
