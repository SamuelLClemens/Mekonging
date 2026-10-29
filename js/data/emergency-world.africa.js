// National emergency numbers, africa (slice F7b, owner decision 28). Lazy: js/emergency-world.js loads it with the other regions.
// Keyed by the world outline's lowercase ISO 3166-1 alpha-2 id (js/data/world-outline.js; `vi` is the US Virgin Islands,
// Vietnam is `vn`). Every entry cites a real government page in `src`; a second page that states numbers of the entry goes in `src2`.
// A number is here because a government page states it for that service (Government of Canada travel advice, the UK FCDO's travel
// advice, or a page of the country itself). Where the two pages give different numbers for the same specific service, that service
// is left out. A country with no checkable source has no entry: the screen then gives 112 and the coordinates, never a guess.
// Generated from reviewed decisions; scripts/check-emergency-world.py reads this file.
export const EMERGENCY_WORLD = {
  ao: { // Angola
    numbers: [
      { label: 'Ambulance / medical', number: '116' },
      { label: 'Ambulance / medical', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/angola',
    src2: 'https://www.gov.uk/foreign-travel-advice/angola/getting-help'
  },
  bf: { // Burkina Faso
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '18' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/burkina-faso',
    src2: 'https://www.gov.uk/foreign-travel-advice/burkina-faso/getting-help'
  },
  bi: { // Burundi
    numbers: [
      { label: 'Police', number: '113' },
      { label: 'Ambulance / medical', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/burundi',
    src2: 'https://www.gov.uk/foreign-travel-advice/burundi/getting-help'
  },
  bj: { // Benin
    numbers: [
      { label: 'Police', number: '117' },
      { label: 'Ambulance / medical', number: '118' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/benin',
    src2: 'https://www.gov.uk/foreign-travel-advice/benin/getting-help'
  },
  bw: { // Botswana
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '997' },
      { label: 'Fire', number: '998' },
    ],
    src: 'https://travel.gc.ca/destinations/botswana',
    src2: 'https://www.gov.uk/foreign-travel-advice/botswana/getting-help'
  },
  cf: { // Central African Republic
    numbers: [
      { label: 'Police', number: '117' },
      { label: 'Ambulance / medical', number: '114' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/central-african-republic'
  },
  cg: { // Republic of the Congo
    numbers: [
      { label: 'Police', number: '117' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/congo-brazzaville'
  },
  ci: { // Côte d'Ivoire
    numbers: [
      { label: 'Police', number: '170' },
      { label: 'Police', number: '110' },
      { label: 'Police', number: '111' },
      { label: 'Ambulance / medical', number: '185' },
      { label: 'Fire', number: '180' },
    ],
    src: 'https://travel.gc.ca/destinations/cote-d-ivoire-ivory-coast',
    src2: 'https://www.gov.uk/foreign-travel-advice/cote-d-ivoire/getting-help'
  },
  cm: { // Cameroon
    numbers: [
      { label: 'Police', number: '117' },
      { label: 'Ambulance / medical', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/cameroon',
    src2: 'https://www.gov.uk/foreign-travel-advice/cameroon/getting-help'
  },
  cv: { // Republic of Cabo Verde
    numbers: [
      { label: 'Police', number: '132' },
      { label: 'Ambulance / medical', number: '130' },
      { label: 'Fire', number: '131' },
    ],
    src: 'https://travel.gc.ca/destinations/cabo-verde',
    src2: 'https://www.gov.uk/foreign-travel-advice/cape-verde/getting-help'
  },
  dj: { // Djibouti
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/djibouti',
    src2: 'https://www.gov.uk/foreign-travel-advice/djibouti/getting-help'
  },
  dz: { // Algeria
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '1021' },
      { label: 'Fire', number: '14' },
      { label: 'Tourist police', number: '1548' },
    ],
    src: 'https://travel.gc.ca/destinations/algeria',
    src2: 'https://www.gov.uk/foreign-travel-advice/algeria/getting-help'
  },
  eg: { // Egypt
    numbers: [
      { label: 'Police', number: '122' },
      { label: 'Tourist police', number: '126' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/egypt/getting-help'
  },
  eh: { // Western Sahara
    numbers: [
      { label: 'Emergency (all services)', number: '150' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/western-sahara/getting-help'
  },
  er: { // Eritrea
    numbers: [
      { label: 'Police', number: '113' },
      { label: 'Fire', number: '116' },
    ],
    src: 'https://travel.gc.ca/destinations/eritrea',
    src2: 'https://www.gov.uk/foreign-travel-advice/eritrea/getting-help'
  },
  et: { // Ethiopia
    numbers: [
      { label: 'Ambulance / medical', number: '907' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/ethiopia/getting-help'
  },
  ga: { // Gabon
    numbers: [
      { label: 'Police', number: '177' },
      { label: 'Ambulance / medical', number: '1300' },
    ],
    src: 'https://travel.gc.ca/destinations/gabon'
  },
  gh: { // Ghana
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Emergency (all services)', number: '999' },
      { label: 'Ambulance / medical', number: '193' },
    ],
    src: 'https://travel.gc.ca/destinations/ghana',
    src2: 'https://www.gov.uk/foreign-travel-advice/ghana/getting-help'
  },
  gm: { // The Gambia
    numbers: [
      { label: 'Police', number: '117' },
      { label: 'Ambulance / medical', number: '116' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/gambia-the'
  },
  gn: { // Guinea
    numbers: [
      { label: 'Police', number: '122' },
      { label: 'Fire', number: '1717' },
    ],
    src: 'https://travel.gc.ca/destinations/guinea'
  },
  gq: { // Equatorial Guinea
    numbers: [
      { label: 'Police', number: '113' },
      { label: 'Ambulance / medical', number: '3101' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://travel.gc.ca/destinations/equatorial-guinea',
    src2: 'https://www.gov.uk/foreign-travel-advice/equatorial-guinea/getting-help'
  },
  gw: { // Guinea-Bissau
    numbers: [
      { label: 'Police', number: '117' },
    ],
    src: 'https://travel.gc.ca/destinations/guinea-bissau',
    src2: 'https://www.gov.uk/foreign-travel-advice/guinea-bissau/getting-help'
  },
  ke: { // Kenya
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/kenya',
    src2: 'https://www.gov.uk/foreign-travel-advice/kenya/getting-help'
  },
  lr: { // Liberia
    numbers: [
      { label: 'Police', number: '911' },
    ],
    src: 'https://travel.gc.ca/destinations/liberia'
  },
  ls: { // Lesotho
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/lesotho/getting-help'
  },
  ma: { // Morocco
    numbers: [
      { label: 'Police', number: '190' },
      { label: 'Ambulance / medical', number: '150' },
      { label: 'Fire', number: '150' },
    ],
    src: 'https://travel.gc.ca/destinations/morocco',
    src2: 'https://www.gov.uk/foreign-travel-advice/morocco/getting-help'
  },
  mg: { // Madagascar
    numbers: [
      { label: 'Emergency (all services)', number: '117' },
    ],
    src: 'https://travel.gc.ca/destinations/madagascar',
    src2: 'https://www.gov.uk/foreign-travel-advice/madagascar/getting-help'
  },
  ml: { // Mali
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '15' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/mali',
    src2: 'https://www.gov.uk/foreign-travel-advice/mali/getting-help'
  },
  mr: { // Mauritania
    numbers: [
      { label: 'Ambulance / medical', number: '101' },
    ],
    src: 'https://www.gov.uk/foreign-travel-advice/mauritania/getting-help'
  },
  mu: { // Mauritius
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Police', number: '112' },
      { label: 'Ambulance / medical', number: '114' },
      { label: 'Fire', number: '115' },
    ],
    src: 'https://travel.gc.ca/destinations/mauritius',
    src2: 'https://www.gov.uk/foreign-travel-advice/mauritius/getting-help'
  },
  mw: { // Malawi
    numbers: [
      { label: 'Police', number: '997' },
      { label: 'Police', number: '990' },
      { label: 'Ambulance / medical', number: '998' },
      { label: 'Fire', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/malawi',
    src2: 'https://www.gov.uk/foreign-travel-advice/malawi/getting-help'
  },
  mz: { // Mozambique
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Ambulance / medical', number: '848888' },
      { label: 'Ambulance / medical', number: '823388' },
      { label: 'Fire', number: '198' },
    ],
    src: 'https://travel.gc.ca/destinations/mozambique',
    src2: 'https://www.gov.uk/foreign-travel-advice/mozambique/getting-help'
  },
  na: { // Namibia
    numbers: [
      { label: 'Police', number: '10111' },
      { label: 'Ambulance / medical', number: '10177' },
      { label: 'Fire', number: '998' },
    ],
    src: 'https://travel.gc.ca/destinations/namibia',
    src2: 'https://www.gov.uk/foreign-travel-advice/namibia/getting-help'
  },
  ne: { // Niger
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '15' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/niger',
    src2: 'https://www.gov.uk/foreign-travel-advice/niger/getting-help'
  },
  ng: { // Nigeria
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Emergency (all services)', number: '199' },
    ],
    src: 'https://travel.gc.ca/destinations/nigeria',
    src2: 'https://www.gov.uk/foreign-travel-advice/nigeria/getting-help'
  },
  rw: { // Rwanda
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Ambulance / medical', number: '912' },
      { label: 'Fire', number: '111' },
    ],
    src: 'https://travel.gc.ca/destinations/rwanda',
    src2: 'https://www.gov.uk/foreign-travel-advice/rwanda/getting-help'
  },
  sc: { // Seychelles
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
      { label: 'Ambulance / medical', number: '151' },
    ],
    src: 'https://travel.gc.ca/destinations/seychelles',
    src2: 'https://www.gov.uk/foreign-travel-advice/seychelles/getting-help'
  },
  sd: { // Sudan
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '333' },
      { label: 'Fire', number: '777' },
    ],
    src: 'https://travel.gc.ca/destinations/sudan',
    src2: 'https://www.gov.uk/foreign-travel-advice/sudan/getting-help'
  },
  sn: { // Senegal
    numbers: [
      { label: 'Police', number: '17' },
      { label: 'Ambulance / medical', number: '15' },
      { label: 'Fire', number: '18' },
    ],
    src: 'https://travel.gc.ca/destinations/senegal',
    src2: 'https://www.gov.uk/foreign-travel-advice/senegal/getting-help'
  },
  so: { // Somalia
    numbers: [
      { label: 'Police', number: '888' },
      { label: 'Ambulance / medical', number: '999' },
      { label: 'Ambulance / medical', number: '446' },
      { label: 'Fire', number: '555' },
    ],
    src: 'https://travel.gc.ca/destinations/somalia',
    src2: 'https://www.gov.uk/foreign-travel-advice/somalia/getting-help'
  },
  st: { // São Tomé and Principe
    numbers: [
      { label: 'Police', number: '113' },
      { label: 'Ambulance / medical', number: '222 22 22' },
      { label: 'Fire', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/sao-tome-and-principe',
    src2: 'https://www.gov.uk/foreign-travel-advice/sao-tome-and-principe/getting-help'
  },
  sz: { // Kingdom of eSwatini
    numbers: [
      { label: 'Police', number: '999' },
      { label: 'Ambulance / medical', number: '977' },
      { label: 'Fire', number: '933' },
    ],
    src: 'https://travel.gc.ca/destinations/eswatini',
    src2: 'https://www.gov.uk/foreign-travel-advice/eswatini/getting-help'
  },
  td: { // Chad
    numbers: [
      { label: 'Police', number: '2020' },
      { label: 'Ambulance / medical', number: '1212' },
      { label: 'Fire', number: '1212' },
    ],
    src: 'https://travel.gc.ca/destinations/chad',
    src2: 'https://www.gov.uk/foreign-travel-advice/chad/getting-help'
  },
  tg: { // Togo
    numbers: [
      { label: 'Police', number: '117' },
      { label: 'Ambulance / medical', number: '8200' },
      { label: 'Fire', number: '118' },
    ],
    src: 'https://travel.gc.ca/destinations/togo',
    src2: 'https://www.gov.uk/foreign-travel-advice/togo/getting-help'
  },
  tn: { // Tunisia
    numbers: [
      { label: 'Police', number: '197' },
      { label: 'Police', number: '193' },
      { label: 'Ambulance / medical', number: '190' },
      { label: 'Fire', number: '198' },
    ],
    src: 'https://travel.gc.ca/destinations/tunisia',
    src2: 'https://www.gov.uk/foreign-travel-advice/tunisia/getting-help'
  },
  tz: { // Tanzania
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
    ],
    src: 'https://travel.gc.ca/destinations/tanzania',
    src2: 'https://www.gov.uk/foreign-travel-advice/tanzania/getting-help'
  },
  ug: { // Uganda
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/uganda',
    src2: 'https://www.gov.uk/foreign-travel-advice/uganda/getting-help'
  },
  za: { // South Africa
    numbers: [
      { label: 'Emergency (all services)', number: '112' },
      { label: 'Police', number: '10111' },
      { label: 'Ambulance / medical', number: '10177' },
      { label: 'Fire', number: '10111' },
    ],
    src: 'https://travel.gc.ca/destinations/south-africa',
    src2: 'https://www.gov.uk/foreign-travel-advice/south-africa/health'
  },
  zm: { // Zambia
    numbers: [
      { label: 'Police', number: '991' },
      { label: 'Fire', number: '993' },
    ],
    src: 'https://travel.gc.ca/destinations/zambia',
    src2: 'https://www.gov.uk/foreign-travel-advice/zambia/getting-help'
  },
  zw: { // Zimbabwe
    numbers: [
      { label: 'Emergency (all services)', number: '999' },
    ],
    src: 'https://travel.gc.ca/destinations/zimbabwe'
  },
};
