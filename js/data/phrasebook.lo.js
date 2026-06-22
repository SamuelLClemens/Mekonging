// Lao phrasebook — essentials. Offline. script = Lao script, roman = approximate
// pronunciation. NOTE: most phones lack a Lao device voice, so tap-to-speak is
// usually unavailable; the script + romanisation always show. Lao and Thai are
// close, so Thai phrases are often understood in Laos.
export const PHRASEBOOK_LO = {
  lang: 'lo', label: 'Lao', locale: 'lo-LA',
  politenessNote: 'Lao is closely related to Thai; many Thai phrases are understood.',
  categories: [
    { id: 'basics', name: 'Greetings & basics', phrases: [
      { en: 'Hello', script: 'ສະບາຍດີ', roman: 'sa-bai-dee' },
      { en: 'Thank you', script: 'ຂອບໃຈ', roman: 'khop-jai' },
      { en: 'Yes', script: 'ແມ່ນ', roman: 'maen' },
      { en: 'No', script: 'ບໍ່', roman: 'bor' },
      { en: 'Sorry / Excuse me', script: 'ຂໍໂທດ', roman: 'kho-thot' },
      { en: 'I do not understand', script: 'ບໍ່ເຂົ້າໃຈ', roman: 'bor khao-jai' },
    ]},
    { id: 'market', name: 'Market & taxi', phrases: [
      { en: 'How much?', script: 'ເທົ່າໃດ', roman: 'thao-dai' },
      { en: 'Too expensive', script: 'ແພງເກີນໄປ', roman: 'phaeng kern pai' },
      { en: 'Lower the price?', script: 'ຫຼຸດໄດ້ບໍ່?', roman: 'lut dai bor' },
      { en: 'Stop here', script: 'ຈອດບ່ອນນີ້', roman: 'jot bon nii' },
    ]},
    { id: 'essentials', name: 'Food, water & help', phrases: [
      { en: 'Water', script: 'ນ້ຳ', roman: 'nam' },
      { en: 'Delicious', script: 'ແຊບ', roman: 'saep' },
      { en: 'Where is the toilet?', script: 'ຫ້ອງນ້ຳຢູ່ໃສ?', roman: 'hong-nam yu sai' },
      { en: 'Help!', script: 'ຊ່ວຍແດ່!', roman: 'suay dae' },
      { en: 'Hospital', script: 'ໂຮງໝໍ', roman: 'hong mor' },
    ]},
  ],
};
