// National emergency numbers, asia (slice F7b, owner decision 28). Lazy: js/emergency-world.js loads it with the other regions.
// Keyed by the world outline's lowercase ISO 3166-1 alpha-2 id (js/data/world-outline.js; `vi` is the US Virgin Islands,
// Vietnam is `vn`). Every entry cites a real government page in `src`; a second page that states numbers of the entry goes in `src2`.
// A number is here because a government page states it for that service (Government of Canada travel advice, the UK FCDO's travel
// advice, or a page of the country itself). Where the two pages give different numbers for the same specific service, that service
// is left out. A country with no checkable source has no entry: the screen then gives 112 and the coordinates, never a guess.
// Generated from reviewed decisions; scripts/check-emergency-world.py reads this file.
export const EMERGENCY_WORLD = {
  ae: { // United Arab Emirates
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '998' },
      { label: 'Fire', number: '997' },
    ],
    src: 'https://travel.gc.ca/destinations/united-arab-emirates',
    src2: 'https://www.gov.uk/foreign-travel-advice/united-arab-emirates/getting-help'
  },
  af: { // Afghanistan
    numbers: [
      { label: 'Police', number: '119' },
      { label: 'Ambulance / medical', number: '102' },
      { label: 'Fire', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/afghanistan',
    src2: 'https://www.gov.uk/foreign-travel-advice/afghanistan/getting-help'
  },
  am: { // Armenia
    numbers: [
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/armenia'
  },
  az: { // Azerbaijan
    numbers: [
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/azerbaijan',
    src2: 'https://www.gov.uk/foreign-travel-advice/azerbaijan/getting-help'
  },
  bd: { // Bangladesh
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/bangladesh',
    src2: 'https://www.gov.uk/foreign-travel-advice/bangladesh/getting-help'
  },
  bh: { // Bahrain
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/bahrain',
    src2: 'https://www.gov.uk/foreign-travel-advice/bahrain/getting-help'
  },
  bn: { // Brunei Darussalam
    numbers: [
      { label: 'Police', number: '993' },
      { label: 'Ambulance / medical', number: '991' },
      { label: 'Fire', number: '995' },
      { label: 'Search and rescue', number: '998' },
    ],
    src: 'https://travel.gc.ca/destinations/brunei',
    src2: 'https://www.gov.uk/foreign-travel-advice/brunei/getting-help'
  },
  bt: { // Bhutan
    numbers: [
      { label: 'Police', number: '113' },
      { label: 'Ambulance / medical', number: '112' },
      { label: 'Fire', number: '110' },
    ],
    src: 'https://travel.gc.ca/destinations/bhutan',
    src2: 'https://www.gov.uk/foreign-travel-advice/bhutan/getting-help'
  },
  cn: { // China
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '120' },
      { label: 'Fire', number: '119' },
      { label: 'Traffic police', number: '122' },
    ],
    src: 'https://travel.gc.ca/destinations/china',
    src2: 'https://www.gov.uk/foreign-travel-advice/china/getting-help'
  },
  cy: { // Cyprus
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '199' },
    ],
    src: 'https://travel.gc.ca/destinations/cyprus',
    src2: 'https://www.gov.uk/foreign-travel-advice/cyprus/getting-help'
  },
  cyn: { // Northern Cyprus
    numbers: [
      { label: 'Police', number: '155' },
    ],
    src: 'https://travel.gc.ca/destinations/cyprus'
  },
  ge: { // Georgia
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/georgia',
    src2: 'https://www.gov.uk/foreign-travel-advice/georgia/getting-help'
  },
  hk: { // Hong Kong
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/hong-kong',
    src2: 'https://www.gov.uk/foreign-travel-advice/hong-kong/getting-help'
  },
  id: { // Indonesia
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '118' },
      { label: 'Fire', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/indonesia',
    src2: 'https://www.gov.uk/foreign-travel-advice/indonesia/getting-help'
  },
  il: { // Israel
    numbers: [
      { label: 'Police', number: '100' },
      { label: 'Ambulance / medical', number: '101' },
      { label: 'Fire', number: '102' },
    ],
    src: 'https://travel.gc.ca/destinations/israel-and-palestine',
    src2: 'https://www.gov.uk/foreign-travel-advice/israel/getting-help'
  },
  in: { // India
    numbers: [
      { label: 'Police', number: '100' },
      { label: 'Ambulance / medical', number: '102' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/india'
  },
  iq: { // Iraq
    numbers: [
      { label: 'Police', number: '911' },
      { label: 'Ambulance / medical', number: '122' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/iraq/getting-help'
  },
  ir: { // Iran
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '115' },
      { label: 'Fire', number: '125' },
    ],
    src: 'https://travel.gc.ca/destinations/iran',
    src2: 'https://www.gov.uk/foreign-travel-advice/iran/getting-help'
  },
  jo: { // Jordan
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/jordan',
    src2: 'https://www.gov.uk/foreign-travel-advice/jordan/getting-help'
  },
  jp: { // Japan
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '119' },
      { label: 'Fire', number: '119' },
    ],
    src: 'https://travel.gc.ca/destinations/japan',
    src2: 'https://www.gov.uk/foreign-travel-advice/japan/getting-help'
  },
  kg: { // Kyrgyzstan
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/kyrgyzstan',
    src2: 'https://www.gov.uk/foreign-travel-advice/kyrgyzstan/health'
  },
  kr: { // Republic of Korea
    numbers: [
      { label: 'Police', number: '112' },
      { label: 'Ambulance / medical', number: '119' },
      { label: 'Fire', number: '119' },
    ],
    src: 'https://travel.gc.ca/destinations/south-korea',
    src2: 'https://www.gov.uk/foreign-travel-advice/south-korea/health'
  },
  kw: { // Kuwait
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/kuwait',
    src2: 'https://www.gov.uk/foreign-travel-advice/kuwait/getting-help'
  },
  kz: { // Kazakhstan
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/kazakhstan',
    src2: 'https://www.gov.uk/foreign-travel-advice/kazakhstan/getting-help'
  },
  lb: { // Lebanon
    numbers: [
      { label: 'Police', number: '112' },
      { label: 'Ambulance / medical', number: '140' },
      { label: 'Fire', number: '175' },
    ],
    src: 'https://travel.gc.ca/destinations/lebanon',
    src2: 'https://www.gov.uk/foreign-travel-advice/lebanon/getting-help'
  },
  lk: { // Sri Lanka
    numbers: [
      { label: 'Police', number: '119' },
      { label: 'Police', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/sri-lanka',
    src2: 'https://www.gov.uk/foreign-travel-advice/sri-lanka/getting-help'
  },
  mm: { // Myanmar
    numbers: [
      { label: 'Police', number: '199' },
      { label: 'Ambulance / medical', number: '192' },
      { label: 'Fire', number: '191' },
    ],
    src: 'https://travel.gc.ca/destinations/myanmar',
    src2: 'https://www.gov.uk/foreign-travel-advice/myanmar/getting-help'
  },
  mn: { // Mongolia
    numbers: [
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/mongolia',
    src2: 'https://www.gov.uk/foreign-travel-advice/mongolia/getting-help'
  },
  mo: { // Macao
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/macao/getting-help'
  },
  mv: { // Maldives
    numbers: [
      { label: 'Police', number: '119' },
      { label: 'Ambulance / medical', number: '102' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/maldives',
    src2: 'https://www.gov.uk/foreign-travel-advice/maldives/getting-help'
  },
  my: { // Malaysia
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '999' },
      { label: 'Fire', number: '994' },
    ],
    src: 'https://travel.gc.ca/destinations/malaysia',
    src2: 'https://www.gov.uk/foreign-travel-advice/malaysia/getting-help'
  },
  np: { // Nepal
    numbers: [
      { label: 'Police', number: '100' },
      { label: 'Ambulance / medical', number: '102' },
      { label: 'Fire', number: '101' },
      { label: 'Tourist police', number: '1144' },
    ],
    src: 'https://travel.gc.ca/destinations/nepal',
    src2: 'https://www.gov.uk/foreign-travel-advice/nepal/getting-help'
  },
  om: { // Oman
    numbers: [
      { label: 'Emergency (all services)', number: '9999' },
    ],
    src: 'https://travel.gc.ca/destinations/oman',
    src2: 'https://www.gov.uk/foreign-travel-advice/oman/getting-help'
  },
  ph: { // Philippines
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/philippines',
    src2: 'https://www.gov.uk/foreign-travel-advice/philippines/getting-help'
  },
  pk: { // Pakistan
    numbers: [
      { label: 'Police', number: '15' },
      { label: 'Ambulance / medical', number: '115' },
      { label: 'Ambulance / medical', number: '1122' },
      { label: 'Fire', number: '16' },
    ],
    src: 'https://travel.gc.ca/destinations/pakistan'
  },
  ps: { // Palestine
    numbers: [
      { label: 'Police', number: '100' },
      { label: 'Ambulance / medical', number: '101' },
      { label: 'Fire', number: '102' },
    ],
    src: 'https://travel.gc.ca/destinations/israel-and-palestine',
    src2: 'https://www.gov.uk/foreign-travel-advice/palestine/getting-help'
  },
  qa: { // Qatar
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/qatar',
    src2: 'https://www.gov.uk/foreign-travel-advice/qatar/getting-help'
  },
  sa: { // Saudi Arabia
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '997' },
      { label: 'Fire', number: '998' },
    ],
    src: 'https://travel.gc.ca/destinations/saudi-arabia',
    src2: 'https://www.gov.uk/foreign-travel-advice/saudi-arabia/getting-help'
  },
  sg: { // Singapore
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '995' },
      { label: 'Fire', number: '995' },
    ],
    src: 'https://travel.gc.ca/destinations/singapore',
    src2: 'https://www.gov.uk/foreign-travel-advice/singapore/getting-help'
  },
  sy: { // Syria
    numbers: [
      { label: 'Police', number: '112' },
      { label: 'Ambulance / medical', number: '110' },
      { label: 'Fire', number: '113' },
    ],
    src: 'https://travel.gc.ca/destinations/syria'
  },
  tj: { // Tajikistan
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/tajikistan',
    src2: 'https://www.gov.uk/foreign-travel-advice/tajikistan/getting-help'
  },
  tl: { // Timor-Leste
    numbers: [
      { label: 'Police', number: '112' },
      { label: 'Ambulance / medical', number: '110' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://travel.gc.ca/destinations/timor-leste-east-timor',
    src2: 'https://www.gov.uk/foreign-travel-advice/timor-leste/getting-help'
  },
  tm: { // Turkmenistan
    numbers: [
      { label: 'Police', number: '002' },
      { label: 'Ambulance / medical', number: '003' },
      { label: 'Fire', number: '001' },
    ],
    src: 'https://travel.gc.ca/destinations/turkmenistan',
    src2: 'https://www.gov.uk/foreign-travel-advice/turkmenistan/getting-help'
  },
  tr: { // Turkey
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/turkiye',
    src2: 'https://www.gov.uk/foreign-travel-advice/turkey/getting-help'
  },
  tw: { // Taiwan
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '119' },
      { label: 'Fire', number: '119' },
      { label: 'Coast guard', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/taiwan',
    src2: 'https://www.gov.uk/foreign-travel-advice/taiwan/getting-help'
  },
  uz: { // Uzbekistan
    numbers: [
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/uzbekistan',
    src2: 'https://www.gov.uk/foreign-travel-advice/uzbekistan/health'
  },
  ye: { // Yemen
    numbers: [
      { label: 'Police', number: '199' },
      { label: 'Ambulance / medical', number: '191' },
      { label: 'Fire', number: '191' },
    ],
    src: 'https://travel.gc.ca/destinations/yemen',
    src2: 'https://www.gov.uk/foreign-travel-advice/yemen/getting-help'
  },
};
