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
    phones: ['094 923 8883', '094 724 4555', '061 689 9222'],
    phoneNote: '094 923 8883 is Boonsiri’s Koh Mak line; 094 724 4555 its Bangkok office.',
    url: 'https://boonsiriferry.com/',
    sources: [{ org: 'Boonsiri — How to get to Koh Mak', url: 'https://boonsiriferry.com/en/island-detail/How%20to%20get%20to%20Koh%20Mak%20(Complete%20version)' }, EKC_KOHMAK],
  },
  kohkutexpress: {
    name: 'Koh Kut Express', mode: 'Speedboat',
    phones: ['080 070 0764', '087 749 0030'],
    url: 'https://www.kokutexpress.in.th/', email: 'info@kokutexpress.in.th',
    sources: [{ org: 'Ko Kut Express (operator site)', url: 'https://www.kokutexpress.in.th/' }, EKC_KOHMAK],
  },
  chonratee: {
    name: 'Chonratee Speedboat', mode: 'Speedboat',
    phones: ['084 265 3649'],
    sources: [EKC_KOHMAK],
  },
  kohchangexpress: {
    name: 'Koh Chang Express', mode: 'Speedboat',
    phones: [],
    phoneNote: 'No direct number published — book through your resort or at Bang Bao pier.',
    sources: [EKC_KOHMAK],
  },
  kaibaehut: {
    name: 'Kai Bae Hut (Nor Nou) Speedboat', mode: 'Speedboat',
    phones: [],
    phoneNote: 'Book through Kai Bae Hut on Koh Chang, or Makathanee Resort on Koh Mak.',
    url: 'https://www.kaibaehut.com/',
    sources: [EKC_KOHMAK, { org: 'koh-mak.com — boat timetables', url: 'https://www.koh-mak.com/boat-timetables/' }],
  },
  ferrykohchang: {
    name: 'Ferry Koh Chang (Ao Thammachat)', mode: 'Car ferry',
    phones: [],
    phoneNote: 'No phone number published.',
    sources: [{ org: 'I Am Koh Chang — bus, boat & plane (updated 21 Sep 2026)', url: 'https://iamkohchang.com/getting-here/bus-boat-timetables.html' }],
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
  cherdchai: {
    name: 'Cherdchai Tour', mode: 'Bus',
    phones: ['061 023 9292', '084 982 7410'],
    url: 'https://booking.cherdchaitour.com/',
    sources: [{ org: 'Cherdchai Tour — timetables', url: 'https://www.cherdchaitour.com/en-us/timetables' }],
  },
  bus999: {
    name: '999 government bus (Transport Co.)', mode: 'Bus',
    phones: [],
    phoneNote: 'Buy at the counter inside Ekkamai (Eastern) Bus Terminal, open from 06:30, or online.',
    url: 'https://www.busonlineticket.co.th/bus/bus-999/',
    sources: [{ org: 'I Am Koh Chang — 999 bus from Bangkok', url: 'https://iamkohchang.com/getting-here/999-bus-bangkok-kohchang.html' }],
  },
  bangkokair: {
    name: 'Bangkok Airways', mode: 'Flight',
    phones: ['1771', '02 270 6699'],
    url: 'https://www.bangkokair.com/',
    sources: [{ org: 'Bangkok Airways — travelling with infants', url: 'https://www.bangkokair.com/young-travelers/travel-with-infant' }],
  },
  ekctransfer: {
    name: 'Explore Koh Chang private transfers', mode: 'Private car',
    phones: [],
    url: 'https://explorekohchang.com/contact-us/',
    sources: [{ org: 'Explore Koh Chang — How to get to Koh Mak (updated 19 Aug 2026)', url: 'https://explorekohchang.com/koh-mak/how-to-get-to-koh-mak/' }],
  },
};

// '065 964 5626' -> 'tel:+66659645626'; Thai short codes ('1771') dial as-is.
export function telHref(p) {
  const d = String(p).replace(/\D/g, '');
  if (d.length <= 5) return `tel:${d}`;
  return `tel:+66${d.replace(/^0/, '')}`;
}
