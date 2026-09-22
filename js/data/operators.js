// Transport operators — one contact record per company, shared by the route cards
// (js/screens/transport.js, via `operators: [key]` on a route option) and the offline ferry
// layer (js/data/ferries.js, via `ops: [key]` on a leg), so a phone number lives in exactly one
// place and cannot drift between the two screens.
//
// Every record carries its own `sources`. Where two published sources disagreed on a number,
// the operator's own website wins and the other number is kept only if a second, independent
// source agreed with it — see the per-record comments. `checked` is when the record was last
// read against those sources; fares and timetables live on the route/leg, not here.
export const OPERATORS_CHECKED = '2026-09';

const EKC_KOHMAK = { org: 'Explore Koh Chang — Koh Mak boats (updated 19 Aug 2026)', url: 'https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/koh-mak-ferry-speedboat-island-hopping/' };
const KMN = { org: 'Koh Mak News — boat timetables (updated 17 Sep 2026)', url: 'https://kohmaknews.com/boats-timetable-from-and-to-koh-mak/' };

export const OPERATORS = {
  // Two sources give different numbers; both are listed because each was published in the last
  // six weeks (Explore Koh Chang 19 Aug 2026, Koh Mak News 17 Sep 2026).
  panan: {
    name: 'Panan Speedboat', mode: 'Speedboat',
    phones: ['065 964 5626', '087 580 5275', '092 545 9355'],
    sources: [EKC_KOHMAK, KMN],
  },
  kohmakferry: {
    name: 'Koh Mak Ferry', mode: 'Speedboat',
    phones: ['092 669 4946'],
    sources: [EKC_KOHMAK, KMN],
  },
  // The operator's own site lists 090 506 0020; one guide prints 090 506 2020. The own-site
  // number is also the second contact on Koh Kut Express's site, so that is the one kept.
  leelawadee: {
    name: 'Leelawadee Speedboat', mode: 'Speedboat',
    phones: ['090 506 0020', '087 785 7695'],
    url: 'https://www.kohmakboat.com/', email: 'info@kohmakboat.com',
    sources: [{ org: 'Leelawadee Speedboat (operator site)', url: 'https://www.kohmakboat.com/' }, EKC_KOHMAK],
  },
  boonsiri: {
    name: 'Boonsiri High Speed Catamaran', mode: 'Catamaran',
    phones: ['094 724 4555', '061 689 9222', '086 333 8560', '094 923 8883'],
    phoneNote: '094 724 4555 and 061 689 9222 are the Bangkok lines, 086 333 8560 the Trat office (all from Boonsiri’s own site); 094 923 8883 is its Koh Mak line.',
    url: 'https://boonsiriferry.com/',
    sources: [{ org: 'Boonsiri — How to get to Koh Mak', url: 'https://boonsiriferry.com/en/island-detail/How%20to%20get%20to%20Koh%20Mak%20(Complete%20version)' }, { org: 'Boonsiri — Bus + ferry Bangkok to Koh Kood', url: 'https://boonsiriferry.com/en/news/koh-kood' }, EKC_KOHMAK],
  },
  kohkutexpress: {
    name: 'Koh Kut Express', mode: 'Speedboat',
    phones: ['080 070 0764', '090 506 0020', '087 749 0030'],
    phoneNote: 'The first two are on Ko Kut Express’s own contact page; 087 749 0030 is from Explore Koh Chang.',
    url: 'https://www.kokutexpress.in.th/', email: 'info@kokutexpress.in.th',
    sources: [{ org: 'Ko Kut Express — contact', url: 'https://www.kokutexpress.in.th/contact.php' }, EKC_KOHMAK],
  },
  chonratee: {
    name: 'Chonratee Speedboat', mode: 'Speedboat',
    phones: ['084 265 3649'],
    phoneNote: 'Sails from its own pier at Ban Laem Son, just behind Laem Sok pier, to Sea Far Resort (Ao Tapao) on Koh Kood.',
    url: 'https://kohkoodchonratee.com/en-us',
    sources: [{ org: 'Koh Kood Chonratee Speed Boat — timetable', url: 'https://kohkoodchonratee.com/en-us/timetables' }, EKC_KOHMAK],
  },
  // Seudamgo's own site returned HTTP 502 every time it was checked (Sep 2026), and the only
  // phone numbers found were on resellers' pages, so none is listed.
  seudamgo: {
    name: 'Seudamgo Catamaran', mode: 'Catamaran',
    phones: [],
    phoneNote: 'No phone number could be confirmed from the operator. Book on its website or through its bus office.',
    url: 'https://seudamgo.com/',
    sources: [{ org: 'Explore Koh Chang — Koh Kood boats (updated 19 Aug 2026)', url: 'https://explorekohchang.com/koh-kood/how-to-get-to-koh-kood/koh-kood-ferry-speedboat-island-hopping/' }],
  },
  kohchangexpress: {
    name: 'Koh Chang Express (Bang Bao Boat)', mode: 'Speedboat',
    phones: [],
    phoneNote: 'Formerly Bang Bao Boat. No direct number published — book through your resort, a Koh Chang tour desk or at Bang Bao pier.',
    sources: [EKC_KOHMAK, { org: 'Koh Chang Ferries — boats to Koh Mak & Koh Kood (updated 22 Sep 2026)', url: 'https://kohchangferries.com/boats-koh-mak-koh-kood/' }],
  },
  kaibaehut: {
    name: 'Kai Bae Hut (Nor Nou) Speedboat', mode: 'Speedboat',
    phones: [],
    phoneNote: 'Book through Kai Bae Hut on Koh Chang, or Makathanee Resort on Koh Mak.',
    url: 'https://www.kaibaehut.com/',
    sources: [EKC_KOHMAK, { org: 'koh-mak.com — boat timetables', url: 'https://www.koh-mak.com/boat-timetables/' }],
  },
  // The only ferry to Koh Chang since Trat Ferry (Centrepoint) stopped in mid-2024.
  ferrykohchang: {
    name: 'Ferry Koh Chang (Ao Thammachat)', mode: 'Car ferry',
    phones: ['081 943 5872', '081 814 4137', '039 555 188'],
    sources: [{ org: 'Explore Koh Chang — Koh Chang ferries (updated 25 May 2026)', url: 'https://explorekohchang.com/koh-chang/how-to-get-to-koh-chang/koh-chang-ferries/' }, { org: 'Koh Chang Ferries — Ferry Koh Chang (updated Sep 2026)', url: 'https://kohchangferries.com/ferry-koh-chang/' }],
  },
  // Gulf of Thailand (Samui, Phangan, Tao). Lomprayah's numbers are from the contact page of its
  // own 2026 timetable (lomprayah.com/time-table); branch lines are listed so a traveller can ring
  // the pier they are actually standing at.
  lomprayah: {
    name: 'Lomprayah High Speed Catamaran', mode: 'Catamaran',
    phones: ['065 350 9040', '089 873 0008', '093 576 6565'],
    branches: [
      ['Bangkok (Khao San)', '061 175 8007'], ['Bangkok (Pinklao)', '02 629 2569'],
      ['Chumphon pier', '077 558 212'], ['Koh Tao', '077 456 176'], ['Koh Phangan', '061 172 4037'],
      ['Koh Samui (Pralarn)', '077 950 700'], ['Koh Samui (Nathon)', '077 420 121'],
      ['Koh Samui (Bangrak)', '077 430 081'], ['Surat Thani (Donsak)', '065 350 3562'],
      ['Surat Thani (Tapee pier)', '065 350 3561'], ['Surat Thani Airport', '065 350 3560'],
    ],
    url: 'https://lomprayah.com/',
    sources: [{ org: 'Lomprayah — Timetable 2026', url: 'https://lomprayah.com/time-table' }, { org: 'Lomprayah — Terms of service', url: 'https://lomprayah.com/terms' }],
  },
  rajaferry: {
    name: 'Raja Ferry', mode: 'Car ferry',
    phones: ['077 372 800', '02 277 4488'],
    phoneNote: '077 372 800 is the Donsak head office; 02 277 4488 the Bangkok office.',
    url: 'https://www.rajaferryport.com/',
    sources: [{ org: 'Raja Ferry Port — sailing schedule', url: 'https://www.rajaferryport.com/sailing-schedule' }, { org: 'Raja Ferry Port — fares', url: 'https://www.rajaferryport.com/' }],
  },
  seatrandiscovery: {
    name: 'Seatran Discovery', mode: 'Catamaran',
    phones: ['086 476 4825'],
    phoneNote: 'Fares and times are not published on its site — ask by phone, LINE or email.',
    url: 'https://www.seatrandiscovery.com/', email: 'ebooking@seatrandiscovery.com',
    sources: [{ org: 'Seatran Discovery (operator site)', url: 'https://www.seatrandiscovery.com/' }],
  },
  srt: {
    name: 'State Railway of Thailand', mode: 'Train',
    phones: [],
    phoneNote: 'Book up to 90 days ahead online or at any station.',
    url: 'https://www.dticket.railway.co.th/',
    sources: [{ org: 'Seat61 — Train travel in Thailand (updated 8 Jul 2026)', url: 'https://www.seat61.com/Thailand.htm' }],
  },
  // Thanatavee Transport, trading as Kohchang Bangkok Transport — the minivans from Ekkamai and Mo Chit.
  thanatavee: {
    name: 'Kohchang Bangkok Transport (Thanatavee)', mode: 'Minivan',
    phones: ['080 668 8556', '080 668 8557', '090 818 1855'],
    phoneNote: 'Also on LINE through its website.',
    url: 'https://minibustrat.com/',
    sources: [{ org: 'Kohchang Bangkok Transport (operator site)', url: 'https://minibustrat.com/' }, { org: 'Explore Koh Chang — Koh Kood bus and minibus (updated 19 Aug 2026)', url: 'https://explorekohchang.com/koh-kood/how-to-get-to-koh-kood/minibus-bus/' }],
  },
  swb: {
    name: 'Suvarnabhumi Burapa (airport microbus)', mode: 'Microbus',
    phones: ['092 939 9426', '083 794 2122', '081 660 5926', '080 357 1251'],
    phoneNote: 'The first two are the Bangkok lines, the last two Koh Chang. Seats are non-refundable if your flight is late.',
    url: 'https://www.busonlineticket.co.th/',
    sources: [{ org: 'Explore Koh Chang — Suvarnabhumi to Koh Chang (updated Jun 2026)', url: 'https://explorekohchang.com/features/travel/suvarnabhumi-airport-to-koh-chang/' }],
  },
  cherdchai: {
    name: 'Cherdchai Tour', mode: 'Bus',
    phones: ['061 023 9292', '084 982 7410'],
    url: 'https://booking.cherdchaitour.com/',
    sources: [{ org: 'Cherdchai Tour — timetables', url: 'https://www.cherdchaitour.com/en-us/timetables' }],
  },
  bus999: {
    name: '999 government bus (Transport Co.)', mode: 'Bus',
    phones: ['02 936 2852'],
    phoneNote: 'Transport Co. head office (lines 02 936 2852–66). Buy at the counter inside Ekkamai (Eastern) Bus Terminal, open from 06:30, or online. At Ao Thammachat pier an agent has charged 350 THB for the return ticket — buy it at the bus instead.',
    url: 'https://tcl99web.transport.co.th/Home',
    sources: [{ org: 'I Am Koh Chang — 999 bus from Bangkok', url: 'https://iamkohchang.com/getting-here/999-bus-bangkok-kohchang.html' }, { org: 'Explore Koh Chang — minibus and bus to Koh Chang', url: 'https://explorekohchang.com/koh-chang/how-to-get-to-koh-chang/minibus-bus/' }, { org: 'BusOnlineTicket — Bus 999', url: 'https://www.busonlineticket.co.th/bus/bus-999/' }],
  },
  bangkokair: {
    name: 'Bangkok Airways', mode: 'Flight',
    phones: ['1771', '02 270 6699'],
    branches: [['Trat Airport', '039 551 654']],
    url: 'https://www.bangkokair.com/',
    sources: [{ org: 'Bangkok Airways — travelling with infants', url: 'https://www.bangkokair.com/young-travelers/travel-with-infant' }],
  },
  ekctransfer: {
    name: 'Explore Koh Chang private transfers', mode: 'Private car',
    phones: [],
    url: 'https://explorekohchang.com/contact-us/',
    sources: [{ org: 'Explore Koh Chang — How to get to Koh Mak (updated 19 Aug 2026)', url: 'https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/' }, { org: 'Explore Koh Chang — private transfers to Koh Chang (updated Jun 2026)', url: 'https://explorekohchang.com/koh-chang/how-to-get-to-koh-chang/private-transfers-prices-booking/' }],
  },
};

// '065 964 5626' -> 'tel:+66659645626'; Thai short codes ('1771') dial as-is.
export function telHref(p) {
  const d = String(p).replace(/\D/g, '');
  if (d.length <= 5) return `tel:${d}`;
  return `tel:+66${d.replace(/^0/, '')}`;
}
