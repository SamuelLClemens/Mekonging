// Travel essentials: the cheapest reliable way to buy the things every traveller needs
// day to day — drinking water, a cold beer, snacks/staples, a data SIM and cash — plus
// the local rule of thumb that saves money. Prices are GUIDANCE in local currency and
// move with inflation and season; the point is the *relative* cheapest option, which is
// stable. Country-level because the retail landscape (7-Eleven density, bia hoi, USD in
// Cambodia, Beerlao) is consistent nationwide; city boards may add local specifics.
export const ESSENTIALS = {
  th: {
    currency: 'THB',
    note: 'Thailand runs on 7-Eleven, but supermarkets and fresh markets are far cheaper for anything you buy more than once. Alcohol is only sold 11:00–14:00 and 17:00–24:00 by law.',
    items: [
      { icon: '💧', item: 'Drinking water', cheapest: 'Refill your bottle at blue coin machines on most streets, or buy 1.5 L at 7-Eleven / Lotus’s / Big C — not single small bottles at tourist stalls.', price: '≈1 THB/L refill · 600 ml ≈7–15 THB · 1.5 L ≈14–20 THB', tip: 'Tap water is not for drinking; bottled or filtered only.' },
      { icon: '🍺', item: 'Beer', cheapest: 'A large bottle of Chang / Leo / Singha from a 7-Eleven or supermarket, or a local shop (ร้านขายของชำ). Bars charge 2–4× more.', price: 'Large bottle ≈55–75 THB in shops', tip: 'Remember the 14:00–17:00 sales ban — buy before the afternoon gap.' },
      { icon: '🛒', item: 'Snacks & staples', cheapest: 'Makro, Big C and Lotus’s beat convenience stores by 20–40%; fresh markets are cheapest for fruit and veg.', price: '—', tip: 'Buy multipacks of water/snacks at a supercentre for a beach or island trip.' },
      { icon: '📶', item: 'SIM / data', cheapest: 'AIS, TrueMove H or dtac tourist SIMs — cheaper at in-town shops and 7-Eleven than at the airport counter.', price: 'Tourist data SIM ≈100–350 THB', tip: 'Bring your passport; staff register the SIM for you.', esim: 'eSIM: a travel eSIM (Airalo, Holafly and similar) gives data the moment you land; AIS and TrueMove also sell local eSIMs in-app. Needs an eSIM-capable, carrier-unlocked phone — a physical tourist SIM is usually cheaper for a longer stay.' },
      { icon: '💵', item: 'Cash', cheapest: 'ATMs charge a fixed ≈220 THB foreign-card fee per withdrawal, so take out the maximum each time. SuperRich / Vasu give the best exchange rates.', price: 'ATM fee ≈220 THB/withdrawal', tip: 'Some travel debit cards refund this fee — worth it here.' },
    ],
  },
  vi: {
    currency: 'VND',
    note: 'Vietnam’s cheapest options are local: neighbourhood minimarts (Bách Hóa Xanh, WinMart+) and street markets undercut tourist shops, and bia hơi is the cheapest cold beer in the world.',
    items: [
      { icon: '💧', item: 'Drinking water', cheapest: 'Buy from a local minimart or market, not a hotel fridge; big bottles are far cheaper per litre.', price: '500 ml ≈5,000–10,000 VND · 1.5 L ≈10,000–15,000 VND', tip: 'Tap water is not safe to drink; stick to bottled or filtered.' },
      { icon: '🍺', item: 'Beer', cheapest: 'Bia hơi — fresh draught poured on street corners in the north — is astonishingly cheap. Canned Saigon / 333 / Hà Nội from a minimart are next.', price: 'Bia hơi ≈8,000–20,000 VND/glass · can ≈12,000–22,000 VND', tip: 'Bia hơi is freshest early evening when the keg is new.' },
      { icon: '🛒', item: 'Snacks & staples', cheapest: 'Bách Hóa Xanh, Co.opmart and WinMart+ for packaged goods; wet markets for produce.', price: '—', tip: 'Prices at markets are often unmarked — a friendly “bao nhiêu?” and paying like a local is normal.' },
      { icon: '📶', item: 'SIM / data', cheapest: 'Viettel has the widest coverage; Vinaphone and Mobifone are fine in towns. Buy from an official shop, not a street reseller.', price: 'Tourist data SIM ≈100,000–250,000 VND', tip: 'Passport needed to register; keep the receipt.', esim: 'eSIM: a travel eSIM (Airalo, Holafly and similar) works on arrival; Viettel also offers a local eSIM. Needs an eSIM-capable, carrier-unlocked phone — a local SIM in town is usually cheaper for a longer stay.' },
      { icon: '💵', item: 'Cash', cheapest: 'ATM fees run ≈22,000–66,000 VND; some banks (e.g. TPBank) are fee-free. Withdraw large amounts to spread the fee.', price: 'ATM fee ≈22,000–66,000 VND', tip: 'Break big notes early — small shops rarely have change for 500,000 VND.' },
    ],
  },
  kh: {
    currency: 'USD/KHR',
    note: 'Cambodia runs on US dollars for anything over a dollar and on riel for small change. Markets (Psar) and minimarts are cheapest; keep small, clean USD notes.',
    items: [
      { icon: '💧', item: 'Drinking water', cheapest: 'Buy from a minimart or market rather than a bar; local brands are cheap and fine.', price: 'Small bottle ≈1,500–2,500 KHR (≈US$0.40–0.60)', tip: 'Tap water is not for drinking; bottled or filtered only.' },
      { icon: '🍺', item: 'Beer', cheapest: 'Draught Angkor or Cambodia beer during the near-universal happy hour is the cheapest cold beer around; cans from a minimart otherwise.', price: 'Draught ≈US$0.50–1 · can ≈US$0.60–1', tip: 'Almost every riverside bar runs $0.50 draught happy hours — look for the chalkboards.' },
      { icon: '🛒', item: 'Snacks & staples', cheapest: 'Local markets (Psar Chas, Psar Leu) for produce; minimarts for packaged goods.', price: '—', tip: 'Agree a price before handing over money at markets.' },
      { icon: '📶', item: 'SIM / data', cheapest: 'Cellcard, Smart or Metfone — cheap, plentiful data. Buy from an official booth in town.', price: 'Tourist SIM ≈US$1–5', tip: 'Passport registration is required.', esim: 'eSIM: a travel eSIM (Airalo, Holafly and similar) covers Cambodia on arrival. Needs an eSIM-capable, carrier-unlocked phone — a local booth SIM is so cheap here that it usually still wins for a longer stay.' },
      { icon: '💵', item: 'Cash', cheapest: 'ATMs dispense USD with a ≈US$4–6 fee, so withdraw larger amounts. Change under a dollar comes back in riel.', price: 'ATM fee ≈US$4–6', tip: 'Refuse torn or heavily marked USD notes — they are often rejected.' },
    ],
  },
  la: {
    currency: 'LAK',
    note: 'Laos is cash-first with limited, low-limit ATMs. Morning markets and minimarts are cheapest, and Beerlao is the national staple almost everywhere.',
    items: [
      { icon: '💧', item: 'Drinking water', cheapest: 'Minimarts and markets; large bottles are the best value.', price: 'Small bottle ≈3,000–5,000 LAK · 1.5 L cheaper per litre', tip: 'Tap water is not for drinking; bottled or filtered only.' },
      { icon: '🍺', item: 'Beer', cheapest: 'Beerlao — a large bottle from a shop is far cheaper than a bar, and refundable-deposit bottles are cheaper still.', price: 'Large bottle ≈12,000–18,000 LAK in shops', tip: 'Return the empties to the shop for your deposit back.' },
      { icon: '🛒', item: 'Snacks & staples', cheapest: 'Morning markets for fresh food; minimarts for packaged goods.', price: '—', tip: 'Buy fruit and snacks before long, remote bus rides — few stops sell them.' },
      { icon: '📶', item: 'SIM / data', cheapest: 'Unitel has the best coverage; Lao Telecom and ETL also work. Buy in town.', price: 'Tourist SIM ≈20,000–60,000 LAK', tip: 'Passport needed to register.', esim: 'eSIM: a travel eSIM (Airalo, Holafly and similar) works on arrival and saves queuing. Needs an eSIM-capable, carrier-unlocked phone — a local Unitel SIM is usually cheaper for a longer stay, and coverage is thin in remote areas either way.' },
      { icon: '💵', item: 'Cash', cheapest: 'ATMs have low per-withdrawal limits and fees; carry enough kip between towns. USD and Thai baht are sometimes accepted near borders.', price: 'Low ATM limits + fees', tip: 'Draw cash in bigger towns; small towns and islands may have no working ATM.' },
    ],
  },
};

export function getEssentials(cc) { return ESSENTIALS[cc] || null; }
