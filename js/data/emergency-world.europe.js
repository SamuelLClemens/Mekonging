// National emergency numbers, europe (slice F7b, owner decision 28). Lazy: js/emergency-world.js loads it with the other regions.
// Keyed by the world outline's lowercase ISO 3166-1 alpha-2 id (js/data/world-outline.js; `vi` is the US Virgin Islands,
// Vietnam is `vn`). Every entry cites a real government page in `src`; a second page that states numbers of the entry goes in `src2`.
// A number is here because a government page states it for that service (Government of Canada travel advice, the UK FCDO's travel
// advice, or a page of the country itself). Where the two pages give different numbers for the same specific service, that service
// is left out. A country with no checkable source has no entry: the screen then gives 112 and the coordinates, never a guess.
// Generated from reviewed decisions; scripts/check-emergency-world.py reads this file.
export const EMERGENCY_WORLD = {
  ad: { // Andorra
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '116' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/andorra',
    src2: 'https://www.gov.uk/foreign-travel-advice/andorra/getting-help'
  },
  al: { // Albania
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '129' },
      { label: 'Ambulance / medical', number: '127' },
      { label: 'Fire', number: '128' },
    ],
    src: 'https://travel.gc.ca/destinations/albania',
    src2: 'https://www.gov.uk/foreign-travel-advice/albania/getting-help'
  },
  at: { // Austria
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '133' },
      { label: 'Ambulance / medical', number: '144' },
      { label: 'Fire', number: '122' },
    ],
    src: 'https://travel.gc.ca/destinations/austria',
    src2: 'https://www.gov.uk/foreign-travel-advice/austria/health'
  },
  ba: { // Bosnia and Herzegovina
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '122' },
      { label: 'Ambulance / medical', number: '124' },
      { label: 'Fire', number: '123' },
    ],
    src: 'https://travel.gc.ca/destinations/bosnia-and-herzegovina',
    src2: 'https://www.gov.uk/foreign-travel-advice/bosnia-and-herzegovina/getting-help'
  },
  be: { // Belgium
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/belgium',
    src2: 'https://www.gov.uk/foreign-travel-advice/belgium/health'
  },
  bg: { // Bulgaria
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/bulgaria',
    src2: 'https://www.gov.uk/foreign-travel-advice/bulgaria/getting-help'
  },
  by: { // Belarus
    numbers: [
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/belarus',
    src2: 'https://www.gov.uk/foreign-travel-advice/belarus/getting-help'
  },
  ch: { // Switzerland
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '117' },
      { label: 'Ambulance / medical', number: '144' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/switzerland',
    src2: 'https://www.gov.uk/foreign-travel-advice/switzerland/getting-help'
  },
  cz: { // Czech Republic
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/czechia',
    src2: 'https://www.gov.uk/foreign-travel-advice/czechia/getting-help'
  },
  de: { // Germany
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '112' },
      { label: 'Fire', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/germany',
    src2: 'https://www.gov.uk/foreign-travel-advice/germany/getting-help'
  },
  dk: { // Denmark
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/denmark',
    src2: 'https://www.gov.uk/foreign-travel-advice/denmark/getting-help'
  },
  ee: { // Estonia
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/estonia',
    src2: 'https://www.gov.uk/foreign-travel-advice/estonia/getting-help'
  },
  es: { // Spain
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/spain',
    src2: 'https://www.gov.uk/foreign-travel-advice/spain/health'
  },
  fi: { // Finland
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/finland',
    src2: 'https://www.gov.uk/foreign-travel-advice/finland/getting-help'
  },
  fr: { // France
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '15' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/france',
    src2: 'https://www.gov.uk/foreign-travel-advice/france/getting-help'
  },
  gb: { // United Kingdom
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/united-kingdom'
  },
  gr: { // Greece
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '100' },
      { label: 'Tourist police', number: '1571' },
    ],
    src: 'https://travel.gc.ca/destinations/greece',
    src2: 'https://www.gov.uk/foreign-travel-advice/greece/getting-help'
  },
  hr: { // Croatia
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/croatia',
    src2: 'https://www.gov.uk/foreign-travel-advice/croatia/getting-help'
  },
  hu: { // Hungary
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '107' },
      { label: 'Ambulance / medical', number: '104' },
      { label: 'Fire', number: '105' },
    ],
    src: 'https://travel.gc.ca/destinations/hungary',
    src2: 'https://www.gov.uk/foreign-travel-advice/hungary/getting-help'
  },
  ie: { // Ireland
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/ireland',
    src2: 'https://www.gov.uk/foreign-travel-advice/ireland/getting-help'
  },
  is: { // Iceland
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/iceland',
    src2: 'https://www.gov.uk/foreign-travel-advice/iceland/getting-help'
  },
  it: { // Italy
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Ambulance / medical', number: '118' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://travel.gc.ca/destinations/italy',
    src2: 'https://www.gov.uk/foreign-travel-advice/italy/getting-help'
  },
  li: { // Liechtenstein
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '117' },
      { label: 'Ambulance / medical', number: '144' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/liechtenstein',
    src2: 'https://www.gov.uk/foreign-travel-advice/liechtenstein/getting-help'
  },
  lt: { // Lithuania
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/lithuania',
    src2: 'https://www.gov.uk/foreign-travel-advice/lithuania/getting-help'
  },
  lu: { // Luxembourg
    numbers: [
      { label: 'Police', number: '113' },
      { label: 'Ambulance / medical', number: '112' },
      { label: 'Fire', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/luxembourg',
    src2: 'https://www.gov.uk/foreign-travel-advice/luxembourg/getting-help'
  },
  lv: { // Latvia
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '113' },
    ],
    src: 'https://travel.gc.ca/destinations/latvia',
    src2: 'https://www.gov.uk/foreign-travel-advice/latvia/getting-help'
  },
  mc: { // Monaco
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/monaco',
    src2: 'https://www.gov.uk/foreign-travel-advice/monaco/getting-help'
  },
  md: { // Moldova
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/moldova',
    src2: 'https://www.gov.uk/foreign-travel-advice/moldova/getting-help'
  },
  me: { // Montenegro
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '122' },
      { label: 'Ambulance / medical', number: '124' },
      { label: 'Fire', number: '123' },
    ],
    src: 'https://travel.gc.ca/destinations/montenegro',
    src2: 'https://www.gov.uk/foreign-travel-advice/montenegro/getting-help'
  },
  mk: { // North Macedonia
    numbers: [
      { label: 'Police', number: '192' },
      { label: 'Ambulance / medical', number: '194' },
      { label: 'Fire', number: '193' },
    ],
    src: 'https://travel.gc.ca/destinations/north-macedonia',
    src2: 'https://www.gov.uk/foreign-travel-advice/north-macedonia/getting-help'
  },
  mt: { // Malta
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/malta',
    src2: 'https://www.gov.uk/foreign-travel-advice/malta/getting-help'
  },
  nl: { // Netherlands
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/netherlands',
    src2: 'https://www.gov.uk/foreign-travel-advice/netherlands/getting-help'
  },
  no: { // Norway
    numbers: [
      { label: 'Police', number: '112' },
      { label: 'Ambulance / medical', number: '113' },
      { label: 'Fire', number: '110' },
    ],
    src: 'https://travel.gc.ca/destinations/norway',
    src2: 'https://www.gov.uk/foreign-travel-advice/norway/getting-help'
  },
  pl: { // Poland
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/poland',
    src2: 'https://www.gov.uk/foreign-travel-advice/poland/health'
  },
  pt: { // Portugal
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/portugal',
    src2: 'https://www.gov.uk/foreign-travel-advice/portugal/getting-help'
  },
  ro: { // Romania
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/romania',
    src2: 'https://www.gov.uk/foreign-travel-advice/romania/getting-help'
  },
  rs: { // Serbia
    numbers: [
      { label: 'Police', number: '192' },
      { label: 'Ambulance / medical', number: '194' },
      { label: 'Fire', number: '193' },
    ],
    src: 'https://travel.gc.ca/destinations/serbia',
    src2: 'https://www.gov.uk/foreign-travel-advice/serbia/getting-help'
  },
  ru: { // Russian Federation
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/russia',
    src2: 'https://www.gov.uk/foreign-travel-advice/russia/getting-help'
  },
  se: { // Sweden
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/sweden',
    src2: 'https://www.gov.uk/foreign-travel-advice/sweden/getting-help'
  },
  si: { // Slovenia
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/slovenia',
    src2: 'https://www.gov.uk/foreign-travel-advice/slovenia/getting-help'
  },
  sk: { // Slovakia
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '158' },
      { label: 'Ambulance / medical', number: '155' },
      { label: 'Fire', number: '150' },
    ],
    src: 'https://travel.gc.ca/destinations/slovakia',
    src2: 'https://www.gov.uk/foreign-travel-advice/slovakia/getting-help'
  },
  sm: { // San Marino
    numbers: [
      { label: 'Police', number: '112' },
      { label: 'Police', number: '113' },
      { label: 'Ambulance / medical', number: '118' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://travel.gc.ca/destinations/san-marino',
    src2: 'https://www.gov.uk/foreign-travel-advice/san-marino/getting-help'
  },
  ua: { // Ukraine
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '102' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '101' },
    ],
    src: 'https://travel.gc.ca/destinations/ukraine',
    src2: 'https://www.gov.uk/foreign-travel-advice/ukraine/getting-help'
  },
  xk: { // Kosovo
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '192' },
      { label: 'Ambulance / medical', number: '194' },
      { label: 'Fire', number: '193' },
    ],
    src: 'https://travel.gc.ca/destinations/kosovo',
    src2: 'https://www.gov.uk/foreign-travel-advice/kosovo/getting-help'
  },
};
