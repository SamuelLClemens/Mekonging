// Malay phrasebook (useful in deep-south Thailand and onward to Malaysia). Offline.
// Malay uses the Latin alphabet, so "script" is the Malay spelling and "roman" is the
// say-it-like-this transliteration for an English speaker.
export const PHRASEBOOK_MS = {
  lang: 'ms', label: 'Malay', locale: 'ms-MY',
  politenessNote: 'Malay is written in the Latin alphabet, so the spelling and the pronunciation are both shown.',
  categories: [
    { id: 'basics', name: 'Greetings & basics', phrases: [
      { en: 'Hello', script: 'Helo', roman: 'heh-loh' },
      { en: 'Thank you', script: 'Terima kasih', roman: 'te-ree-ma ka-seh' },
      { en: 'Yes', script: 'Ya', roman: 'yah' },
      { en: 'No', script: 'Tidak', roman: 'tee-dak' },
      { en: 'Excuse me / Sorry', script: 'Maaf', roman: 'mah-af' },
      { en: 'I do not understand', script: 'Saya tidak faham', roman: 'sa-ya tee-dak fa-ham' },
    ]},
    { id: 'market', name: 'Market & taxi', phrases: [
      { en: 'How much?', script: 'Berapa harga?', roman: 'be-ra-pa har-ga' },
      { en: 'Too expensive', script: 'Terlalu mahal', roman: 'ter-la-lu ma-hal' },
      { en: 'Cheaper?', script: 'Boleh kurang?', roman: 'bo-leh ku-rang' },
      { en: 'Stop here', script: 'Berhenti di sini', roman: 'ber-hen-tee dee see-nee' },
    ]},
    { id: 'essentials', name: 'Food, water & help', phrases: [
      { en: 'Water', script: 'Air', roman: 'a-yer' },
      { en: 'Delicious', script: 'Sedap', roman: 'se-dap' },
      { en: 'Where is the toilet?', script: 'Di mana tandas?', roman: 'dee ma-na tan-das' },
      { en: 'Help!', script: 'Tolong!', roman: 'toh-long' },
      { en: 'Hospital', script: 'Hospital', roman: 'hos-pi-tal' },
    ]},
  ],
};
