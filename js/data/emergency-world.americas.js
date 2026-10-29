// National emergency numbers, americas (slice F7b, owner decision 28). Lazy: js/emergency-world.js loads it with the other regions.
// Keyed by the world outline's lowercase ISO 3166-1 alpha-2 id (js/data/world-outline.js; `vi` is the US Virgin Islands,
// Vietnam is `vn`). Every entry cites a real government page in `src`; a second page that states numbers of the entry goes in `src2`.
// A number is here because a government page states it for that service (Government of Canada travel advice, the UK FCDO's travel
// advice, or a page of the country itself). Where the two pages give different numbers for the same specific service, that service
// is left out. A country with no checkable source has no entry: the screen then gives 112 and the coordinates, never a guess.
// Generated from reviewed decisions; scripts/check-emergency-world.py reads this file.
export const EMERGENCY_WORLD = {
  ag: { // Antigua and Barbuda
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/antigua-and-barbuda',
    src2: 'https://www.gov.uk/foreign-travel-advice/antigua-and-barbuda/getting-help'
  },
  ai: { // Anguilla
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/anguilla',
    src2: 'https://www.gov.uk/foreign-travel-advice/anguilla/getting-help'
  },
  ar: { // Argentina
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Police', number: '101' },
      { label: 'Ambulance / medical', number: '107' },
      { label: 'Fire', number: '100' },
    ],
    src: 'https://travel.gc.ca/destinations/argentina',
    src2: 'https://www.gov.uk/foreign-travel-advice/argentina/health'
  },
  aw: { // Aruba
    numbers: [
      { label: 'Police', number: '100' },
      { label: 'Ambulance / medical', number: '911' },
      { label: 'Fire', number: '911' },
      { label: 'Coast guard', number: '913' },
    ],
    src: 'https://travel.gc.ca/destinations/aruba',
    src2: 'https://www.gov.uk/foreign-travel-advice/aruba/getting-help'
  },
  bb: { // Barbados
    numbers: [
      { label: 'Police', number: '211' },
      { label: 'Ambulance / medical', number: '511' },
      { label: 'Fire', number: '311' },
    ],
    src: 'https://travel.gc.ca/destinations/barbados',
    src2: 'https://www.gov.uk/foreign-travel-advice/barbados/getting-help'
  },
  bl: { // Saint-Barthélemy
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/saint-barthelemy'
  },
  bm: { // Bermuda
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/bermuda',
    src2: 'https://www.gov.uk/foreign-travel-advice/bermuda/getting-help'
  },
  bo: { // Bolivia
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Fire', number: '119' },
    ],
    src: 'https://travel.gc.ca/destinations/bolivia',
    src2: 'https://www.gov.uk/foreign-travel-advice/bolivia/getting-help'
  },
  br: { // Brazil
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Police', number: '190' },
      { label: 'Ambulance / medical', number: '192' },
      { label: 'Fire', number: '193' },
    ],
    src: 'https://travel.gc.ca/destinations/brazil',
    src2: 'https://www.gov.uk/foreign-travel-advice/brazil/getting-help'
  },
  bs: { // Bahamas
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Emergency (all services)', number: '919' },
    ],
    src: 'https://travel.gc.ca/destinations/bahamas',
    src2: 'https://www.gov.uk/foreign-travel-advice/bahamas/getting-help'
  },
  bz: { // Belize
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/belize',
    src2: 'https://www.gov.uk/foreign-travel-advice/belize/getting-help'
  },
  ca: { // Canada
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/canada/getting-help'
  },
  cl: { // Chile
    numbers: [
      { label: 'Police', number: '133' },
      { label: 'Ambulance / medical', number: '131' },
      { label: 'Fire', number: '132' },
    ],
    src: 'https://travel.gc.ca/destinations/chile',
    src2: 'https://www.gov.uk/foreign-travel-advice/chile/getting-help'
  },
  co: { // Colombia
    numbers: [
      { label: 'Emergency (all services)', number: '123' },
      { label: 'Fire', number: '119' },
    ],
    src: 'https://travel.gc.ca/destinations/colombia',
    src2: 'https://www.gov.uk/foreign-travel-advice/colombia/getting-help'
  },
  cr: { // Costa Rica
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/costa-rica',
    src2: 'https://www.gov.uk/foreign-travel-advice/costa-rica/getting-help'
  },
  cu: { // Cuba
    numbers: [
      { label: 'Police', number: '106' },
      { label: 'Ambulance / medical', number: '104' },
      { label: 'Fire', number: '105' },
    ],
    src: 'https://travel.gc.ca/destinations/cuba',
    src2: 'https://www.gov.uk/foreign-travel-advice/cuba/getting-help'
  },
  cw: { // Curaçao
    numbers: [
      { label: 'Police', number: '911' },
      { label: 'Ambulance / medical', number: '912' },
      { label: 'Fire', number: '911' },
      { label: 'Coast guard', number: '913' },
    ],
    src: 'https://travel.gc.ca/destinations/curacao',
    src2: 'https://www.gov.uk/foreign-travel-advice/curacao/getting-help'
  },
  dm: { // Dominica
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/dominica',
    src2: 'https://www.gov.uk/foreign-travel-advice/dominica/getting-help'
  },
  do: { // Dominican Republic
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/dominican-republic',
    src2: 'https://www.gov.uk/foreign-travel-advice/dominican-republic/getting-help'
  },
  ec: { // Ecuador
    numbers: [
      { label: 'Ambulance / medical', number: '911' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/ecuador/health'
  },
  fk: { // Falkland Islands / Malvinas
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/falkland-islands',
    src2: 'https://www.gov.uk/foreign-travel-advice/falkland-islands/getting-help'
  },
  gd: { // Grenada
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/grenada',
    src2: 'https://www.gov.uk/foreign-travel-advice/grenada/getting-help'
  },
  gl: { // Greenland
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/greenland'
  },
  gt: { // Guatemala
    numbers: [
      { label: 'Police', number: '110' },
      { label: 'Police', number: '120' },
      { label: 'Ambulance / medical', number: '122' },
      { label: 'Ambulance / medical', number: '123' },
      { label: 'Fire', number: '122' },
      { label: 'Fire', number: '123' },
    ],
    src: 'https://travel.gc.ca/destinations/guatemala',
    src2: 'https://www.gov.uk/foreign-travel-advice/guatemala/health'
  },
  gy: { // Guyana
    numbers: [
      { label: 'Police', number: '911' },
      { label: 'Ambulance / medical', number: '913' },
      { label: 'Fire', number: '912' },
    ],
    src: 'https://travel.gc.ca/destinations/guyana',
    src2: 'https://www.gov.uk/foreign-travel-advice/guyana/getting-help'
  },
  hn: { // Honduras
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/honduras',
    src2: 'https://www.gov.uk/foreign-travel-advice/honduras/getting-help'
  },
  ht: { // Haiti
    numbers: [
      { label: 'Police', number: '122' },
      { label: 'Ambulance / medical', number: '116' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/haiti/getting-help'
  },
  jm: { // Jamaica
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Police', number: '119' },
      { label: 'Ambulance / medical', number: '110' },
      { label: 'Fire', number: '110' },
    ],
    src: 'https://travel.gc.ca/destinations/jamaica',
    src2: 'https://www.gov.uk/foreign-travel-advice/jamaica/getting-help'
  },
  kn: { // Saint Kitts and Nevis
    numbers: [
      { label: 'Police', number: '911' },
      { label: 'Ambulance / medical', number: '911' },
      { label: 'Fire', number: '333' },
    ],
    src: 'https://travel.gc.ca/destinations/saint-kitts-and-nevis',
    src2: 'https://www.gov.uk/foreign-travel-advice/st-kitts-and-nevis/getting-help'
  },
  ky: { // Cayman Islands
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/cayman-islands',
    src2: 'https://www.gov.uk/foreign-travel-advice/cayman-islands/getting-help'
  },
  lc: { // Saint Lucia
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '911' },
      { label: 'Fire', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/saint-lucia',
    src2: 'https://www.gov.uk/foreign-travel-advice/st-lucia/getting-help'
  },
  mf: { // Saint-Martin
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/saint-martin'
  },
  ms: { // Montserrat
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/montserrat',
    src2: 'https://www.gov.uk/foreign-travel-advice/montserrat/getting-help'
  },
  mx: { // Mexico
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/mexico',
    src2: 'https://www.gov.uk/foreign-travel-advice/mexico/getting-help'
  },
  ni: { // Nicaragua
    numbers: [
      { label: 'Police', number: '118' },
      { label: 'Ambulance / medical', number: '128' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://travel.gc.ca/destinations/nicaragua'
  },
  pa: { // Panama
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Police', number: '104' },
      { label: 'Ambulance / medical', number: '103' },
      { label: 'Fire', number: '103' },
    ],
    src: 'https://travel.gc.ca/destinations/panama',
    src2: 'https://www.gov.uk/foreign-travel-advice/panama/getting-help'
  },
  pe: { // Peru
    numbers: [
      { label: 'Police', number: '105' },
      { label: 'Fire', number: '116' },
    ],
    src: 'https://travel.gc.ca/destinations/peru',
    src2: 'https://www.gov.uk/foreign-travel-advice/peru/getting-help'
  },
  pm: { // Saint Pierre and Miquelon
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/saint-pierre-et-miquelon',
    src2: 'https://www.gov.uk/foreign-travel-advice/st-pierre-and-miquelon/getting-help'
  },
  pr: { // Puerto Rico
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/puerto-rico'
  },
  py: { // Paraguay
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Ambulance / medical', number: '141' },
      { label: 'Fire', number: '132' },
    ],
    src: 'https://travel.gc.ca/destinations/paraguay',
    src2: 'https://www.gov.uk/foreign-travel-advice/paraguay/getting-help'
  },
  sr: { // Suriname
    numbers: [
      { label: 'Police', number: '115' },
      { label: 'Ambulance / medical', number: '113' },
      { label: 'Fire', number: '110' },
    ],
    src: 'https://travel.gc.ca/destinations/suriname',
    src2: 'https://www.gov.uk/foreign-travel-advice/suriname/getting-help'
  },
  sv: { // El Salvador
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/el-salvador',
    src2: 'https://www.gov.uk/foreign-travel-advice/el-salvador/getting-help'
  },
  sx: { // Sint Maarten
    numbers: [
      { label: 'Ambulance / medical', number: '912' },
      { label: 'Fire', number: '919' },
    ],
    src: 'https://travel.gc.ca/destinations/sint-maarten'
  },
  tc: { // Turks and Caicos Islands
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/turks-and-caicos-islands',
    src2: 'https://www.gov.uk/foreign-travel-advice/turks-and-caicos-islands/getting-help'
  },
  tt: { // Trinidad and Tobago
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '811' },
      { label: 'Fire', number: '990' },
    ],
    src: 'https://travel.gc.ca/destinations/trinidad-and-tobago',
    src2: 'https://www.gov.uk/foreign-travel-advice/trinidad-and-tobago/getting-help'
  },
  us: { // United States
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/united-states',
    src2: 'https://www.gov.uk/foreign-travel-advice/usa/getting-help'
  },
  uy: { // Uruguay
    numbers: [
      { label: 'Police', number: '911' },
      { label: 'Ambulance / medical', number: '105' },
      { label: 'Fire', number: '104' },
    ],
    src: 'https://travel.gc.ca/destinations/uruguay',
    src2: 'https://www.gov.uk/foreign-travel-advice/uruguay/getting-help'
  },
  vc: { // Saint Vincent and the Grenadines
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/saint-vincent-the-grenadines',
    src2: 'https://www.gov.uk/foreign-travel-advice/st-vincent-and-the-grenadines/getting-help'
  },
  ve: { // Venezuela
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/venezuela',
    src2: 'https://www.gov.uk/foreign-travel-advice/venezuela/getting-help'
  },
  vg: { // British Virgin Islands
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/british-virgin-islands',
    src2: 'https://www.gov.uk/foreign-travel-advice/british-virgin-islands/getting-help'
  },
  vi: { // United States Virgin Islands
    numbers: [
      { label: 'Emergency (all services)', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/virgin-islands-u-s'
  },
};
