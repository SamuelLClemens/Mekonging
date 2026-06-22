// Mandarin Chinese phrasebook. Offline. script = Simplified Chinese characters,
// roman = Hanyu Pinyin (the transliteration a non-speaker can attempt).
export const PHRASEBOOK_ZH = {
  lang: 'zh', label: 'Chinese (Mandarin)', locale: 'zh-CN',
  politenessNote: 'Tones matter in Mandarin; the pinyin marks show them. Add 请 (qǐng, please) to soften requests.',
  categories: [
    { id: 'basics', name: 'Greetings & basics', phrases: [
      { en: 'Hello', script: '你好', roman: 'nǐ hǎo' },
      { en: 'Thank you', script: '谢谢', roman: 'xiè xie' },
      { en: 'Yes / Correct', script: '是', roman: 'shì' },
      { en: 'No / Not correct', script: '不是', roman: 'bú shì' },
      { en: 'Excuse me / Sorry', script: '对不起', roman: 'duì bu qǐ' },
      { en: 'I do not understand', script: '我不明白', roman: 'wǒ bù míng bai' },
      { en: 'Do you speak English?', script: '你会说英语吗？', roman: 'nǐ huì shuō yīng yǔ ma' },
    ]},
    { id: 'directions', name: 'Taxi & directions', phrases: [
      { en: 'Stop here, please', script: '在这里停', roman: 'zài zhè lǐ tíng' },
      { en: 'Turn left', script: '左转', roman: 'zuǒ zhuǎn' },
      { en: 'Turn right', script: '右转', roman: 'yòu zhuǎn' },
      { en: 'Where is...?', script: '...在哪里？', roman: '... zài nǎ lǐ' },
      { en: 'Where is the toilet?', script: '厕所在哪里？', roman: 'cè suǒ zài nǎ lǐ' },
    ]},
    { id: 'food', name: 'Food & ordering', phrases: [
      { en: 'Delicious', script: '好吃', roman: 'hǎo chī' },
      { en: 'Not spicy', script: '不要辣', roman: 'bú yào là' },
      { en: 'I am vegetarian', script: '我吃素', roman: 'wǒ chī sù' },
      { en: 'Water', script: '水', roman: 'shuǐ' },
      { en: 'The bill, please', script: '买单', roman: 'mǎi dān' },
    ]},
    { id: 'market', name: 'Market & haggling', phrases: [
      { en: 'How much?', script: '多少钱？', roman: 'duō shǎo qián' },
      { en: 'Too expensive', script: '太贵了', roman: 'tài guì le' },
      { en: 'A little cheaper?', script: '便宜一点？', roman: 'pián yi yì diǎn' },
      { en: 'I will take it', script: '我要这个', roman: 'wǒ yào zhè ge' },
    ]},
    { id: 'numbers', name: 'Numbers', phrases: [
      { en: 'One', script: '一', roman: 'yī' },
      { en: 'Two', script: '二', roman: 'èr' },
      { en: 'Three', script: '三', roman: 'sān' },
      { en: 'Five', script: '五', roman: 'wǔ' },
      { en: 'Ten', script: '十', roman: 'shí' },
      { en: 'One hundred', script: '一百', roman: 'yì bǎi' },
    ]},
    { id: 'emergency', name: 'Emergency & health', phrases: [
      { en: 'Help!', script: '救命！', roman: 'jiù mìng' },
      { en: 'Call the police', script: '叫警察', roman: 'jiào jǐng chá' },
      { en: 'I need a doctor', script: '我需要医生', roman: 'wǒ xū yào yī shēng' },
      { en: 'Hospital', script: '医院', roman: 'yī yuàn' },
    ]},
  ],
};
