// Hmong phrasebook (White Hmong, hill-tribe areas of northern Thailand, Laos and
// Vietnam). Offline. Hmong uses the RPA Latin orthography, where final consonants
// mark tones and are not pronounced. "script" is the RPA spelling; "roman" is an
// approximate say-it-like-this transliteration. No device voice exists, so
// tap-to-speak is always unavailable here — the spelling + transliteration show.
export const PHRASEBOOK_HMN = {
  lang: 'hmn', label: 'Hmong', locale: '', noVoice: true,
  politenessNote: 'Hmong is tonal; final letters in the spelling indicate tone and are silent. The transliteration is approximate.',
  categories: [
    { id: 'basics', name: 'Greetings & basics', phrases: [
      { en: 'Hello', script: 'Nyob zoo', roman: 'nyong jong' },
      { en: 'Thank you', script: 'Ua tsaug', roman: 'oo-a chaow' },
      { en: 'Yes', script: 'Yog', roman: 'yawg' },
      { en: 'No', script: 'Tsis yog', roman: 'tsee yawg' },
      { en: 'I do not understand', script: 'Kuv tsis to taub', roman: 'koo tsee taw taob' },
    ]},
    { id: 'essentials', name: 'Market, food & help', phrases: [
      { en: 'How much?', script: 'Pes tsawg nyiaj?', roman: 'peh tsaw nyia' },
      { en: 'Too expensive', script: 'Kim heev', roman: 'kee hen' },
      { en: 'Water', script: 'Dej', roman: 'deh' },
      { en: 'Delicious', script: 'Qab', roman: 'kah' },
      { en: 'Help me!', script: 'Pab kuv!', roman: 'pah koo' },
    ]},
  ],
};
