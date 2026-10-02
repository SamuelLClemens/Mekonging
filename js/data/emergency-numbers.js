// The four countries' national emergency numbers, in the eager graph; js/data/info.<cc>.js
// re-exports them. They used to exist only in info.<cc>.js, which loads with its country —
// and the emergency screens take their country from GPS, so in Hanoi after browsing Thailand
// the card read "Emergency numbers are being added for this country".
//
// A file of its own, not an export added to js/data/emergency.js: an app left open across a
// deploy keeps the old emergency.js in memory, and a new info.<cc>.js importing a new export
// from it would fail to link — which the country-data gate in render() retries forever. A new
// URL is never in the old module map, so it always loads from the new release.
export const EMERGENCY_NUMBERS = {
  th: [
    { label: 'Tourist Police (English)', number: '1155' },
    { label: 'Police', number: '191' },
    { label: 'Ambulance / medical', number: '1669' },
  ],
  vi: [
    { label: 'Police', number: '113' },
    { label: 'Fire', number: '114' },
    { label: 'Ambulance / Medical', number: '115' },
    { label: 'Search & Rescue / Disasters', number: '112' },
  ],
  kh: [
    { label: 'Police', number: '117' },
    { label: 'Fire', number: '118' },
    { label: 'Ambulance / Rescue', number: '119' },
    { label: 'Tourist Police (Phnom Penh)', number: '+855 12 942 484' },
  ],
  la: [
    { label: 'Police', number: '1191' },
    { label: 'Ambulance', number: '1195' },
    { label: 'Fire', number: '1190' },
    { label: 'Tourist Police (Vientiane)', number: '021 251 128' },
  ],
};
