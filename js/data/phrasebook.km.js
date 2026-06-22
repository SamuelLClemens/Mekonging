// Khmer (Cambodia) phrasebook — essentials. Offline. script = Khmer script,
// roman = approximate pronunciation. NOTE: most phones lack a Khmer device voice,
// so tap-to-speak is usually unavailable; the script + romanisation always show.
export const PHRASEBOOK_KM = {
  lang: 'km', label: 'Khmer', locale: 'km-KH',
  politenessNote: 'Men end with បាទ (baat); women with ចាស (chaa) to say "yes" politely.',
  categories: [
    { id: 'basics', name: 'Greetings & basics', phrases: [
      { en: 'Hello', script: 'សួស្តី', roman: 'suo-sdei' },
      { en: 'Thank you', script: 'អរគុណ', roman: 'aw-kun' },
      { en: 'Yes', script: 'បាទ / ចាស', roman: 'baat (m) / chaa (f)' },
      { en: 'No', script: 'ទេ', roman: 'te' },
      { en: 'Sorry / Excuse me', script: 'សុំទោស', roman: 'som-toh' },
      { en: 'I do not understand', script: 'ខ្ញុំមិនយល់ទេ', roman: 'knhom min yol te' },
    ]},
    { id: 'market', name: 'Market & taxi', phrases: [
      { en: 'How much?', script: 'ថ្លៃប៉ុន្មាន?', roman: 'thlay pon-maan' },
      { en: 'Too expensive', script: 'ថ្លៃណាស់', roman: 'thlay nah' },
      { en: 'Lower the price?', script: 'ចុះថ្លៃបានទេ?', roman: 'choh thlay baan te' },
      { en: 'Stop here', script: 'ឈប់ទីនេះ', roman: 'chhup ti nih' },
    ]},
    { id: 'essentials', name: 'Food, water & help', phrases: [
      { en: 'Water', script: 'ទឹក', roman: 'tuk' },
      { en: 'Delicious', script: 'ឆ្ងាញ់', roman: 'chnganh' },
      { en: 'Where is the toilet?', script: 'បង្គន់នៅឯណា?', roman: 'bangkon nov ena' },
      { en: 'Help!', script: 'ជួយផង!', roman: 'chuoy phong' },
      { en: 'Hospital', script: 'មន្ទីរពេទ្យ', roman: 'montir pet' },
    ]},
  ],
};
