// National emergency numbers, oceania (slice F7b, owner decision 28). Lazy: js/emergency-world.js loads it with the other regions.
// Keyed by the world outline's lowercase ISO 3166-1 alpha-2 id (js/data/world-outline.js; `vi` is the US Virgin Islands,
// Vietnam is `vn`). Every entry cites a real government page in `src`; a second page that states numbers of the entry goes in `src2`.
// A number is here because a government page states it for that service (Government of Canada travel advice, the UK FCDO's travel
// advice, or a page of the country itself). Where the two pages give different numbers for the same specific service, that service
// is left out. A country with no checkable source has no entry: the screen then gives 112 and the coordinates, never a guess.
// Generated from reviewed decisions; scripts/check-emergency-world.py reads this file.
export const EMERGENCY_WORLD = {
  as: { // American Samoa
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/american-samoa'
  },
  au: { // Australia
    numbers: [
      { label: 'Emergency (all services)', number: '000' },
    ],
    src: 'https://travel.gc.ca/destinations/australia',
    src2: 'https://www.gov.uk/foreign-travel-advice/australia/getting-help'
  },
  ck: { // Cook Islands
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '998' },
      { label: 'Fire', number: '996' },
    ],
    src: 'https://travel.gc.ca/destinations/cook-islands'
  },
  fj: { // Fiji
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Police', number: '917' },
      { label: 'Fire', number: '910' },
    ],
    src: 'https://travel.gc.ca/destinations/fiji',
    src2: 'https://www.gov.uk/foreign-travel-advice/fiji/getting-help'
  },
  fm: { // Federated States of Micronesia
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/micronesia-fsm',
    src2: 'https://www.gov.uk/foreign-travel-advice/federated-states-of-micronesia/getting-help'
  },
  gu: { // Guam
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/guam'
  },
  ki: { // Kiribati
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
      { label: 'Ambulance / medical', number: '994' },
    ],
    src: 'https://travel.gc.ca/destinations/kiribati',
    src2: 'https://www.gov.uk/foreign-travel-advice/kiribati/getting-help'
  },
  mh: { // Marshall Islands
    numbers: [
      { label: 'Police', number: '625 8666' },
      { label: 'Ambulance / medical', number: '625 4142' },
    ],
    src: 'https://travel.gc.ca/destinations/marshall-islands',
    src2: 'https://www.gov.uk/foreign-travel-advice/marshall-islands/getting-help'
  },
  mp: { // Northern Mariana Islands
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/northern-marianas'
  },
  nc: { // New Caledonia
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '15' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/new-caledonia',
    src2: 'https://www.gov.uk/foreign-travel-advice/new-caledonia/getting-help'
  },
  nr: { // Nauru
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Ambulance / medical', number: '111' },
      { label: 'Fire', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/nauru',
    src2: 'https://www.gov.uk/foreign-travel-advice/nauru/getting-help'
  },
  nu: { // Niue
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/niue'
  },
  nz: { // New Zealand
    numbers: [
      { label: 'Emergency (all services)', number: '111' },
    ],
    src: 'https://travel.gc.ca/destinations/new-zealand',
    src2: 'https://www.gov.uk/foreign-travel-advice/new-zealand/getting-help'
  },
  pf: { // French Polynesia
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '15' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/french-polynesia',
    src2: 'https://www.gov.uk/foreign-travel-advice/french-polynesia/getting-help'
  },
  pg: { // Papua New Guinea
    numbers: [
      { label: 'Police', number: '112' },
      { label: 'Ambulance / medical', number: '111' },
      { label: 'Fire', number: '110' },
    ],
    src: 'https://travel.gc.ca/destinations/papua-new-guinea',
    src2: 'https://www.gov.uk/foreign-travel-advice/papua-new-guinea/getting-help'
  },
  pw: { // Palau
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/palau',
    src2: 'https://www.gov.uk/foreign-travel-advice/palau/getting-help'
  },
  sb: { // Solomon Islands
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Fire', number: '988' },
      { label: 'Search and rescue', number: '977' },
    ],
    src: 'https://travel.gc.ca/destinations/solomon-islands',
    src2: 'https://www.gov.uk/foreign-travel-advice/solomon-islands/getting-help'
  },
  to: { // Tonga
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/tonga',
    src2: 'https://www.gov.uk/foreign-travel-advice/tonga/getting-help'
  },
  tv: { // Tuvalu
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/tuvalu',
    src2: 'https://www.gov.uk/foreign-travel-advice/tuvalu/getting-help'
  },
  vu: { // Vanuatu
    numbers: [
      { label: 'Police', number: '111' },
      { label: 'Police', number: '22222' },
      { label: 'Ambulance / medical', number: '115' },
      { label: 'Fire', number: '113' },
    ],
    src: 'https://travel.gc.ca/destinations/vanuatu',
    src2: 'https://www.gov.uk/foreign-travel-advice/vanuatu/getting-help'
  },
  wf: { // Wallis and Futuna Islands
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '15' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/wallis-and-futuna/getting-help'
  },
  ws: { // Samoa
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/samoa',
    src2: 'https://www.gov.uk/foreign-travel-advice/samoa/getting-help'
  },
};
