// Burmese phrasebook — essentials. Offline. script = Burmese script,
// roman = approximate transliteration. NOTE: most phones lack a Burmese device
// voice, so tap-to-speak is usually unavailable; the script + transliteration show.
export const PHRASEBOOK_MY = {
  lang: 'my', label: 'Burmese', locale: 'my-MM',
  politenessNote: 'Add ပါ (ba) to soften and add politeness to most phrases.',
  categories: [
    { id: 'basics', name: 'Greetings & basics', phrases: [
      { en: 'Hello', script: 'မင်္ဂလာပါ', roman: 'min-ga-la-ba' },
      { en: 'Thank you', script: 'ကျေးဇူးတင်ပါတယ်', roman: 'kyay-zu-tin-ba-deh' },
      { en: 'Yes', script: 'ဟုတ်ကဲ့', roman: 'hote-keh' },
      { en: 'No', script: 'မဟုတ်ဘူး', roman: 'ma-hote-bu' },
      { en: 'Sorry / Excuse me', script: 'တောင်းပန်ပါတယ်', roman: 'taung-pan-ba-deh' },
      { en: 'I do not understand', script: 'နားမလည်ဘူး', roman: 'na-ma-leh-bu' },
    ]},
    { id: 'market', name: 'Market & taxi', phrases: [
      { en: 'How much?', script: 'ဘယ်လောက်လဲ', roman: 'beh-lauk-leh' },
      { en: 'Too expensive', script: 'ဈေးကြီးတယ်', roman: 'zay-kyi-deh' },
      { en: 'Stop here', script: 'ဒီမှာရပ်ပါ', roman: 'di-hma-yat-ba' },
    ]},
    { id: 'essentials', name: 'Food, water & help', phrases: [
      { en: 'Water', script: 'ရေ', roman: 'yay' },
      { en: 'Delicious', script: 'စားလို့ကောင်းတယ်', roman: 'sa-lo-kaung-deh' },
      { en: 'Where is the toilet?', script: 'အိမ်သာ ဘယ်မှာလဲ', roman: 'ein-tha beh-hma-leh' },
      { en: 'Help!', script: 'ကူညီပါ', roman: 'ku-nyi-ba' },
      { en: 'Hospital', script: 'ဆေးရုံ', roman: 'say-yon' },
    ]},
  ],
};
