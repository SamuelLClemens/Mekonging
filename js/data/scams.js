// Common tourist scams per country — the ones travellers report most, written so a newcomer
// can recognise the setup and sidestep it. These are overwhelmingly about MONEY, not danger:
// a calm "no, thank you" and agreeing prices in advance defuses almost all of them.
//
// Web-verified July 2026 against reputable travel-safety and official sources (US Embassy
// Thailand "Common Scams to Avoid", World Nomads, and established travel-safety guides);
// per-item sources are listed on each country. Guidance only — situations vary; when in doubt,
// walk away. Keyed by the app's country id (th/vi/kh/la) so scamsScreen() can look them up.
export const SCAMS = {
  th: {
    hotline: { label: 'Tourist Police (English, 24h)', number: '1155' },
    top: [
      {
        title: 'Gem / jewellery “government sale”',
        how: 'A driver or friendly stranger says there is a one-day government- or royal-sponsored gem sale where you can buy jewels to resell for profit. The stones are near-worthless glass or synthetic.',
        avoid: 'Thailand’s government and royal family run no gem or jewellery shops — ignore the claim entirely. Never buy gems to “resell back home”.',
      },
      {
        title: '“It’s closed today” tuk-tuk detour',
        how: 'A tuk-tuk driver says your temple or palace is shut for a holiday or renovation and offers a cheap city tour that ends at commission shops (gems, tailors, travel agents).',
        avoid: 'Check opening hours yourself — the Grand Palace and major temples open daily. Agree the fare first or use Grab/Bolt, and decline shop stops.',
      },
      {
        title: 'Jet-ski / motorbike damage deposit',
        how: 'On return, the renter points out “new” scratches that were already there and demands a large repair fee, sometimes holding your passport until you pay.',
        avoid: 'Film the vehicle from every angle before you take it. Never leave your passport as a deposit — offer a photocopy or a cash deposit instead.',
      },
      {
        title: '“Meter broken” taxi',
        how: 'The driver refuses the meter and quotes a flat fare two to five times higher than the metered price.',
        avoid: 'Say “meter, please” before getting in; if refused, take the next taxi or use Grab/Bolt. A metered ride across central Bangkok is usually 80–150 THB.',
      },
      {
        title: 'Fake police / passport “fine”',
        how: 'Someone posing as police asks to inspect your passport, then demands an on-the-spot “fine” for an alleged vaping, littering or visa offence.',
        avoid: 'Ask for ID, stay calm, and offer to settle any genuine matter at a police station. Call the Tourist Police on 1155.',
      },
      {
        title: 'Fake visa / arrival-card websites',
        how: 'Look-alike sites charge inflated fees for the visa or the Thailand Digital Arrival Card and harvest your personal data.',
        avoid: 'Use only the official sites: thaievisa.go.th for visas and tdac.immigration.go.th for the arrival card.',
      },
    ],
    sources: [
      { org: 'U.S. Embassy Thailand — Common Scams to Avoid', url: 'https://th.usembassy.gov/common-scams-to-avoid/' },
      { org: 'Thailand Insider Guide — Scams in Thailand (2026)', url: 'https://thailandinsiderguide.com/en/travel-essentials/scams-in-thailand/' },
      { org: 'Hotels.com Go Guides — Phuket Best-Known Scams', url: 'https://www.hotels.com/go/thailand/phuket-best-known-scams' },
    ],
    asOf: '2026-07-21',
  },
  vi: {
    top: [
      {
        title: 'Rigged meter / look-alike taxi',
        how: 'A taxi meter runs fast, or a car painted to mimic a trusted brand overcharges — most often on the ride from the airport.',
        avoid: 'Use Grab, Be or Green SM (the price shows up front), or stick to green Mai Linh / white Vinasun taxis. Agree the fare before moving.',
      },
      {
        title: 'Fake “I’m your driver” at the airport',
        how: 'A driver approaches inside arrivals claiming to be your booked ride-hail or hotel car, then charges a large fixed fee.',
        avoid: 'Book in the real Grab/Be app yourself and match the driver’s name and plate. Never get into a car that approached you — only the one you called.',
      },
      {
        title: 'Money-switch / short-change',
        how: 'A driver or vendor swaps the 500,000₫ note you handed over for a similar-looking blue 20,000₫ note and says you still owe them.',
        avoid: 'Pay with small notes or the exact amount, and count aloud as you hand money over. The 500k and 20k notes are both blue — check carefully.',
      },
      {
        title: 'Motorbike-rental damage claim',
        how: 'On return the shop says you caused scratches and demands repair money — common in Hanoi, Ho Chi Minh City, Hoi An and Da Lat.',
        avoid: 'Photograph and film every existing scratch at pickup. Never surrender your passport as a deposit; offer a cash deposit or copy.',
      },
      {
        title: 'Cyclo / xe om “price changed”',
        how: 'A cyclo or motorbike-taxi quotes one price, then demands far more at the end, sometimes claiming it was “per person”.',
        avoid: 'Agree the full price and the currency before setting off, and confirm it is for the whole trip. Use an app where you can.',
      },
    ],
    sources: [
      { org: 'World-travel safety guides — Scams in Vietnam (2026)', url: 'https://www.backpackerswanderlust.com/scams-in-vietnam/' },
      { org: 'Digit — Tourist Scams in Vietnam', url: 'https://www.godigit.com/international-travel-insurance/tourist-scams/tourist-scams-in-vietnam' },
      { org: 'Asia Tour Advisor — Scams in Vietnam', url: 'https://www.asiatouradvisor.com/get-inspired/vietnam/scams-in-vietnam/' },
    ],
    asOf: '2026-07-21',
  },
  kh: {
    top: [
      {
        title: 'Tuk-tuk “your guesthouse is closed”',
        how: 'Drivers earn commission by claiming your booked stay is full, closed or “moved”, then steering you to another guesthouse or to gem, silk and tailor shops.',
        avoid: 'Book your stay directly and confirm by phone. Use Grab or PassApp; for Angkor, agree a day rate up front (about USD 15–20).',
      },
      {
        title: 'Angkor touts & fake guides',
        how: 'Around Angkor: unofficial “guides”, overpriced guidebooks and incense, and claims that there is no food or water inside so you must buy now.',
        avoid: 'Buy the official Angkor pass, hire only licensed guides, and carry your own water. Politely ignore touts.',
      },
      {
        title: 'Fake monks',
        how: 'People dressed as monks approach tourists selling “blessed” bracelets or charms; the cash goes to organised gangs, not a temple.',
        avoid: 'Genuine monks do not solicit tourists for money — decline politely and walk on.',
      },
      {
        title: 'ATM “help with fees” / skimming',
        how: 'A stranger offers to help you “avoid bank fees” at the machine, then skims your card and watches your PIN.',
        avoid: 'Use ATMs inside a bank, let no one stand near you, and cover the keypad as you type your PIN.',
      },
      {
        title: 'Ride-by bag snatching',
        how: 'Thieves on motorbikes pull alongside tuk-tuks or pavements and grab bags and phones, then speed off.',
        avoid: 'Keep bags inside the tuk-tuk and on the side away from traffic. Do not walk with a phone or bag on the road side.',
      },
      {
        title: 'Poipet border overcharge',
        how: 'At the Thailand–Cambodia land crossing, touts or officials demand payment in Thai baht or add a fake “stamp fee” above the official visa price.',
        avoid: 'Get an e-visa at evisa.gov.kh beforehand, or pay only the posted fee at the official counter — not at “pre-border visa offices”.',
      },
    ],
    sources: [
      { org: 'World Nomads — Avoiding Rip-offs and Scams in Cambodia', url: 'https://www.worldnomads.com/travel-safety/southeast-asia/cambodia/avoiding-rip-offs-and-scams-in-cambodia' },
      { org: 'Hotels.com Go Guides — Common Scams in Cambodia', url: 'https://sg.hotels.com/go/cambodia/cambodia-common-scams' },
      { org: 'Travel Sense Asia — Typical Travel Scams in Cambodia', url: 'https://travelsense.asia/10-typical-travel-scams-cambodia-avoid/' },
    ],
    asOf: '2026-07-21',
  },
  la: {
    top: [
      {
        title: 'Tuk-tuk overcharge / mid-ride stop',
        how: 'Drivers quote many times the fair price in tourist areas, or stop halfway and refuse to continue until you pay more.',
        avoid: 'Agree a fixed price and route (“direct, no stops”) before you get in, carry small kip notes, and watch your GPS on the way.',
      },
      {
        title: 'Commission-shop detours',
        how: 'A driver adds unrequested stops at gem or tailor shops where they earn a commission, adding time and “extra” fees.',
        avoid: 'State “direct only” at the start and decline every added stop.',
      },
      {
        title: 'Overpriced / fake bus tickets',
        how: 'Agents at guesthouses or stations sell counterfeit or inflated tickets — for example Vientiane–Luang Prabang at 200,000 kip versus the usual ~150,000.',
        avoid: 'Buy at the official station or a trusted operator, check for the government stamp, and compare against local prices.',
      },
      {
        title: 'Boat “fuel / permit” surcharge',
        how: 'Mekong boat operators demand extra mid-trip for “fuel” or “permits”, or claim the next village has no rooms so you must pay in advance.',
        avoid: 'Book at the main pier with a written total in kip, and agree every stop and cost before you depart.',
      },
      {
        title: 'Short-change / withheld change',
        how: 'A clerk waits for you to ask for your change, or exploits the confusing kip notes to short-change you.',
        avoid: 'Count your change every time and say the amount aloud as you hand money over.',
      },
      {
        title: 'Overvalued “Lao gemstones”',
        how: 'High-pressure vendors sell glass or fake stones as rare Lao sapphires or rubies at many times their value.',
        avoid: 'Treat street gem “bargains” as fake and never buy stones to resell.',
      },
    ],
    sources: [
      { org: 'Girls Wanderlust — Most Common Laos Tourist Scams', url: 'https://girlswanderlust.com/how-to-avoid-the-most-common-laos-tourist-scams/' },
      { org: 'Vivu Travel — Scams and Tourist Traps in Laos', url: 'https://www.vivutravel.com/laos-travel-guide/scams-and-tourist-traps-in-laos-and-how-to-avoid' },
      { org: 'Backpackers Wanderlust — Scams in Laos (2026)', url: 'https://www.backpackerswanderlust.com/scams-in-laos/' },
    ],
    asOf: '2026-07-21',
  },
};

export function scamsFor(cc) {
  return SCAMS[cc] || null;
}
