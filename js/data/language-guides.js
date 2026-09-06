// A short, honest primer on each phrasebook language — what it sounds like, where it comes
// from, how its sentences are built, the handful of rules that actually change how a
// traveller is understood, and a first lesson they can use the same afternoon.
//
// WHY THIS EXISTS. The phrasebook gives a traveller sentences to point at. It does not give
// them any idea what they are looking at — why Thai has no spaces, why "ph" is not an "f",
// why a Vietnamese speaker asks their age before choosing a word for "you", or why Burmese
// puts the verb at the end. Fifteen minutes of that turns memorised strings into something a
// person can actually build on, and it is the difference between reading a phrase aloud and
// being understood.
//
// SCOPE AND HONESTY. These are orientation notes, not a course, and they say so. Where a
// language varies by region (Vietnamese tones, Lao dialects, Hmong varieties) that is stated
// rather than flattened. Speaker counts are rounded and marked approximate. Romanisation is
// written the way a traveller will hear it, not in IPA, with the app's own phrasebook
// spelling used wherever the two would disagree.
//
// Loaded on demand from js/screens/phrasebook.js when the traveller opens the section, so it
// costs nothing to anyone who does not.

export const LANGUAGE_GUIDES = {
  th: {
    name: 'Thai',
    native: 'ภาษาไทย',
    oneLine: 'Five tones, no spaces between words, and no verb endings to learn at all.',
    sections: [
      {
        id: 'sounds', ic: '🔊', title: 'Sounds and tones',
        body: [
          'Thai has five tones — mid, low, falling, high and rising. The tone is part of the word, not the mood: the same syllable said five ways is five different words. The classic example is “mai”, which depending on tone can mean new, burn, wood, not, or turn a sentence into a question.',
          'The trap that catches most English speakers is not the tones, though — it is aspiration. Thai distinguishes a puff of air where English does not. “ph” is a hard P with a puff, never the “f” of “phone”: Phuket is “Poo-ket”. The same goes for “th” (a T, not the sound in “think”) and “kh” (a K).',
          'Final consonants are held rather than released. A word ending in -p, -t or -k stops the sound in your mouth without the little burst English adds.',
        ],
        tips: [
          'Say a falling tone like you are saying “No!” — firm, from high to low.',
          'A rising tone is the “Huh?” of a genuine question.',
          'If a tone escapes you, get the vowel length right instead. Long and short vowels change meaning just as reliably, and travellers under-rate them.',
        ],
      },
      {
        id: 'history', ic: '📜', title: 'Where it comes from',
        body: [
          'Thai belongs to the Tai-Kadai family, whose homeland was probably in what is now southern China; the Tai peoples moved south over many centuries. It is not related to Chinese, despite both being tonal, and it is not related to Vietnamese or Khmer either.',
          'Most of its formal, religious and royal vocabulary is borrowed — from Sanskrit and Pali through Buddhism, and from Khmer through the centuries when the Khmer empire was the regional power. That is why the polite word for “eat” differs from the everyday one, and why the country’s ceremonial name is enormous.',
          'The alphabet is traditionally credited to King Ramkhamhaeng of Sukhothai in 1283 and derives, like Khmer and Burmese, from an Indian script. It is an abugida: consonants carry an inherent vowel, and vowel signs attach above, below, before or after the consonant — sometimes several at once.',
        ],
      },
      {
        id: 'structure', ic: '🧱', title: 'How a sentence is built',
        body: [
          'Subject–verb–object, like English. The good news is what is missing: no verb conjugation, no plurals, no articles, no grammatical gender, no cases. A verb is the same word whoever is doing it and whenever they did it.',
          'Time is carried by separate words rather than by the verb. “Already” (láew) makes it past, “will” (jà) makes it future, and very often context alone is enough.',
          'Counting needs a classifier — a word that says what kind of thing you are counting, a bit like “two sheets of paper”. Bottles, people, animals and vehicles each take their own. Travellers get a long way with “an” for small things and by pointing.',
          'Thai is written without spaces between words. Spaces mark the end of a clause or sentence, roughly where English uses a comma or full stop.',
        ],
      },
      {
        id: 'rules', ic: '📏', title: 'The rules that actually matter',
        body: [
          'End your sentences with a politeness particle. A male speaker says “khráp”, a female speaker says “khâ” — and this is chosen by who is speaking, not who is listening. It is the single cheapest thing you can do to sound courteous, and leaving it off sounds blunt rather than neutral.',
          '“Mâi pen rai” — never mind, no worries, it is nothing — does an enormous amount of social work. It accepts an apology, waves away thanks and defuses a small problem.',
          'The polite way to disagree is rarely a flat no. Softening, changing the subject or a vague “maybe” often means no; pushing for a direct refusal usually only causes discomfort.',
          'Do not touch someone’s head, do not point your feet at a person or an image of the Buddha, and take your shoes off where you see others have.',
        ],
      },
      {
        id: 'lesson', ic: '🎓', title: 'Your first five minutes',
        lesson: [
          { say: 'sà-wàt-dii khráp / khâ', native: 'สวัสดี', means: 'Hello (and goodbye)', note: 'khráp if you are male, khâ if you are female.' },
          { say: 'khɔ̀ɔp-khun khráp / khâ', native: 'ขอบคุณ', means: 'Thank you' },
          { say: 'mâi pen rai', native: 'ไม่เป็นไร', means: 'No worries / never mind / you are welcome' },
          { say: 'thâo-rai', native: 'เท่าไร', means: 'How much?', note: 'Add khráp/khâ to soften it.' },
          { say: 'mâi ao khráp / khâ', native: 'ไม่เอา', means: 'I do not want it', note: 'Polite and clear when someone is selling hard.' },
          { say: 'hɔ̂ng náam yùu thîi-nǎi', native: 'ห้องน้ำอยู่ที่ไหน', means: 'Where is the toilet?' },
          { say: 'aròi mâak', native: 'อร่อยมาก', means: 'Very tasty', note: 'Say this to a cook and watch what happens.' },
        ],
      },
    ],
  },

  vi: {
    name: 'Vietnamese',
    native: 'Tiếng Việt',
    oneLine: 'Written in the Latin alphabet, which flatters you — then six tones, which do not.',
    sections: [
      {
        id: 'sounds', ic: '🔊', title: 'Sounds and tones',
        body: [
          'Northern (Hanoi) Vietnamese has six tones, marked by the accents you can see on the page: level, falling, rising, dipping-rising, creaky-rising and heavy. Most southern speech uses five, merging two of them, and a southerner will understand you either way.',
          'The tone marks are a gift. Unlike Thai or Khmer, you can see the tone written on every single word, which means the spelling tells you how to say it once you learn the six shapes.',
          'The consonants are where travellers actually come unstuck. Northern and southern pronunciation differ sharply — “d”, “gi” and “r” are all a “z” sound in Hanoi and a “y” or English “r” in Saigon. Final consonants are unreleased, and a final “nh” or “ng” changes the vowel before it.',
        ],
        tips: [
          'Learn the six tone marks as shapes before you learn any words. Everything else gets easier.',
          'Vietnamese words are almost all one syllable. What looks like a long word is usually two words with a space.',
        ],
      },
      {
        id: 'history', ic: '📜', title: 'Where it comes from',
        body: [
          'Vietnamese is Austroasiatic — the same family as Khmer, and not related to Chinese, although a very large share of its formal vocabulary was borrowed from Chinese over a thousand years of contact and rule.',
          'It has been written three ways. Chinese characters came first, then chữ Nôm, a home-grown character script for Vietnamese words. The Latin alphabet was developed by Portuguese, Italian and French missionaries in the 1600s — Alexandre de Rhodes’ dictionary of 1651 is the usual landmark — and became the standard script in the 20th century.',
          'That is why the tone marks exist at all: they were invented to write a tonal language in an alphabet that had never needed them.',
        ],
      },
      {
        id: 'structure', ic: '🧱', title: 'How a sentence is built',
        body: [
          'Subject–verb–object. No conjugation, no plurals, no articles, no gender. Adjectives follow the noun rather than preceding it, so it is “coffee milk ice”, not “iced milk coffee”.',
          'Tense is three small words placed before the verb — đã for the past, đang for right now, sẽ for the future — and they are dropped whenever context makes them unnecessary.',
          'Counting takes a classifier, as in Thai: cái for objects, con for animals, người for people.',
        ],
      },
      {
        id: 'rules', ic: '📏', title: 'The rules that actually matter',
        body: [
          'There is no neutral word for “you”. You choose one based on the other person’s age and relationship to you: anh for a slightly older man, chị for a slightly older woman, em for someone younger, cô or chú for someone of your parents’ generation, bà or ông for the elderly. This is the single most important thing in the language socially, and getting it roughly right matters more than getting the tone right.',
          'Because of that, being asked your age early in a conversation is not nosiness. It is a grammatical necessity.',
          'Add “ạ” to the end of a sentence to make it respectful — the quickest polite upgrade available.',
          '“Không” means no, and also turns a statement into a yes/no question when it ends the sentence.',
        ],
      },
      {
        id: 'lesson', ic: '🎓', title: 'Your first five minutes',
        lesson: [
          { say: 'xin chào', native: 'Xin chào', means: 'Hello', note: 'Universally understood, though locals often just use the pronoun: “chào anh”, “chào chị”.' },
          { say: 'cảm ơn', native: 'Cảm ơn', means: 'Thank you' },
          { say: 'bao nhiêu tiền?', native: 'Bao nhiêu tiền?', means: 'How much?' },
          { say: 'không, cảm ơn', native: 'Không, cảm ơn', means: 'No, thank you' },
          { say: 'nhà vệ sinh ở đâu?', native: 'Nhà vệ sinh ở đâu?', means: 'Where is the toilet?' },
          { say: 'ngon quá!', native: 'Ngon quá!', means: 'Delicious!' },
          { say: 'tôi không hiểu', native: 'Tôi không hiểu', means: 'I do not understand' },
        ],
      },
    ],
  },

  km: {
    name: 'Khmer',
    native: 'ភាសាខ្មែរ',
    oneLine: 'No tones at all — but the largest alphabet in the world, and vowels that shift under you.',
    sections: [
      {
        id: 'sounds', ic: '🔊', title: 'Sounds and tones',
        body: [
          'Khmer is not tonal. After Thai or Vietnamese this is a genuine relief: say the syllable, and the meaning stays put.',
          'The difficulty moves to the vowels instead. Khmer has a large inventory of them, and consonants come in two series which change how the following vowel sign is read — the same vowel symbol has two different values depending on which series its consonant belongs to.',
          'There are also consonant clusters English does not use, and a lot of words end in sounds that are held rather than released.',
        ],
        tips: [
          'Listen for vowel length and quality rather than pitch. That is where the meaning is.',
          'Khmer is spoken without the sing-song of its neighbours. A flat, even delivery is correct, not rude.',
        ],
      },
      {
        id: 'history', ic: '📜', title: 'Where it comes from',
        body: [
          'Khmer is Austroasiatic, the same family as Vietnamese, and it is the language of the Angkor empire whose temples still stand across the region.',
          'The script descends from the Pallava script of southern India, and the oldest securely dated Khmer inscription is from 611 CE — the earliest dated writing in any Southeast Asian language. Thai and Lao writing both ultimately descend from it.',
          'Its Guinness-listed distinction is size: with its consonants, subscript consonant forms, dependent and independent vowels and diacritics, Khmer has the largest alphabet in the world.',
          'Sanskrit and Pali supplied the religious, royal and formal vocabulary, which is why there are separate words for everyday, polite, clerical and royal registers.',
        ],
      },
      {
        id: 'structure', ic: '🧱', title: 'How a sentence is built',
        body: [
          'Subject–verb–object, isolating, no conjugation and no plurals. Adjectives follow the noun.',
          'Like its neighbours, Khmer counts with classifiers, and marks time with separate words rather than verb endings.',
          'Written Khmer, like Thai, does not put spaces between every word — spaces separate phrases.',
        ],
      },
      {
        id: 'rules', ic: '📏', title: 'The rules that actually matter',
        body: [
          'Add “bâat” (if you are male) or “jaa” (if you are female) to mean a polite yes, and to soften a sentence. As in Thai, the choice follows the speaker, not the listener.',
          'The sampeah — palms together, a slight bow — is the greeting, and the height of your hands rises with the respect due. Returning it at chest height is right for almost every situation a traveller meets.',
          'Age and seniority shape address here too, though less rigidly than in Vietnamese.',
        ],
      },
      {
        id: 'lesson', ic: '🎓', title: 'Your first five minutes',
        lesson: [
          { say: 'suŏsdei', native: 'សួស្តី', means: 'Hello' },
          { say: 'ârkun', native: 'អរគុណ', means: 'Thank you', note: '“Ârkun chraen” is thank you very much.' },
          { say: 'bâat / jaa', native: 'បាទ / ចាស', means: 'Yes (polite)', note: 'bâat if you are male, jaa if you are female.' },
          { say: 'ot te', native: 'ទេ', means: 'No' },
          { say: 'tlai ponmaan?', native: 'ថ្លៃប៉ុន្មាន', means: 'How much?' },
          { say: 'bantup tɨk nɨv aenaa?', native: 'បន្ទប់ទឹកនៅឯណា', means: 'Where is the toilet?' },
          { say: 'chnganh nas', native: 'ឆ្ងាញ់ណាស់', means: 'Very delicious' },
        ],
      },
    ],
  },

  lo: {
    name: 'Lao',
    native: 'ພາສາລາວ',
    oneLine: 'Thai’s close cousin — so close that most Lao speakers understand Thai television.',
    sections: [
      {
        id: 'sounds', ic: '🔊', title: 'Sounds and tones',
        body: [
          'Lao is tonal. Vientiane Lao is usually described as having six tones, but the count and the shapes genuinely vary between regions, more so than in Thai.',
          'The consonants behave like Thai’s: aspirated and unaspirated pairs matter, and final consonants are unreleased.',
          'Lao and Thai are close relatives and share a great deal of vocabulary. Lao speakers commonly understand Thai from exposure to Thai media; the reverse is much less true, so do not assume it works both ways.',
        ],
        tips: [
          'If you have any Thai, use it here — much of it will land, and the effort is appreciated.',
          'Lao spelling is largely phonetic, which makes the script easier to sound out than Thai once you know the letters.',
        ],
      },
      {
        id: 'history', ic: '📜', title: 'Where it comes from',
        body: [
          'Lao is Tai-Kadai, the same family as Thai, and the two split relatively recently in linguistic terms.',
          'The script comes from the same Indian-derived ancestor as Thai, by way of old Khmer, but was simplified in the 20th century — obsolete letters were dropped and spelling was made to follow pronunciation, so the Lao alphabet is noticeably smaller than the Thai one.',
          'Pali supplies the Buddhist and formal vocabulary, as it does across the region.',
        ],
      },
      {
        id: 'structure', ic: '🧱', title: 'How a sentence is built',
        body: [
          'Subject–verb–object, isolating, no conjugation, no plurals, no articles. Adjectives follow the noun.',
          'Classifiers are used for counting, and time is marked with separate words.',
          'Written Lao, like Thai, does not space every word.',
        ],
      },
      {
        id: 'rules', ic: '📏', title: 'The rules that actually matter',
        body: [
          '“Bò pen nyang” is the Lao “mâi pen rai” — never mind, no problem, it is nothing — and it is used constantly.',
          'The pace of conversation is slower and more indirect than in Thailand. Raising your voice or showing visible frustration loses you standing rather than winning the point.',
          'The nop, palms together, is the greeting, as in Cambodia and Thailand.',
        ],
      },
      {
        id: 'lesson', ic: '🎓', title: 'Your first five minutes',
        lesson: [
          { say: 'sabaai-dii', native: 'ສະບາຍດີ', means: 'Hello' },
          { say: 'khɔ̀ɔp-jai', native: 'ຂອບໃຈ', means: 'Thank you', note: '“Khɔ̀ɔp-jai lǎai-lǎai” is thank you very much.' },
          { say: 'bò pen nyǎng', native: 'ບໍ່ເປັນຫຍັງ', means: 'No worries / you are welcome' },
          { say: 'thao dai', native: 'ເທົ່າໃດ', means: 'How much?' },
          { say: 'bò ao', native: 'ບໍ່ເອົາ', means: 'I do not want it' },
          { say: 'hɔ̂ng nâm yuu sǎi', native: 'ຫ້ອງນ້ຳຢູ່ໃສ', means: 'Where is the toilet?' },
          { say: 'saep lǎai', native: 'ແຊບຫລາຍ', means: 'Very tasty' },
        ],
      },
    ],
  },

  my: {
    name: 'Burmese',
    native: 'မြန်မာဘာသာ',
    oneLine: 'The odd one out: the verb goes at the END, and the letters are round because of palm leaves.',
    sections: [
      {
        id: 'sounds', ic: '🔊', title: 'Sounds and tones',
        body: [
          'Burmese has four tones, usually described as low, high, creaky and checked. Creaky and checked are not pitches so much as ways of ending the syllable — one tightens the throat, the other stops it short.',
          'Aspiration matters, as it does across the region, and there are consonants written with a “h” before them that English has no equivalent for.',
          'Romanisation of Burmese is unusually inconsistent, so the same word can appear spelled several ways. Trust the sound you hear over the spelling you read.',
        ],
      },
      {
        id: 'history', ic: '📜', title: 'Where it comes from',
        body: [
          'Burmese is Sino-Tibetan — the same broad family as Chinese and Tibetan, and unrelated to Thai, Lao, Khmer or Vietnamese.',
          'The script is an abugida descended, like the others in the region, from an Indian source by way of Mon. Its distinctive circular letters are a practical adaptation: it was written by scratching on palm leaves with a stylus, and straight lines split the leaf along the grain.',
          'Pali supplies the Buddhist vocabulary, and there is a marked difference between literary and spoken Burmese — they use different words for many everyday things.',
        ],
      },
      {
        id: 'structure', ic: '🧱', title: 'How a sentence is built',
        body: [
          'Subject–object–VERB. This is the big structural difference from every other language in this app: the verb arrives last, so “I rice eat” rather than “I eat rice”.',
          'Burmese uses postpositions rather than prepositions — the marker comes after the noun, not before it.',
          'It is still isolating in spirit: no conjugation for person or number, and particles do the work that endings do in European languages.',
        ],
      },
      {
        id: 'rules', ic: '📏', title: 'The rules that actually matter',
        body: [
          'Sentences take a politeness particle: “khin-bya” if you are male, “shin” if you are female. Again, it follows the speaker.',
          '“Ba” inserted into a request is the softener that turns an instruction into a polite ask.',
          'Address people by name plus an honorific — U for an older man, Daw for an older woman, Ko and Ma for peers — rather than by name alone.',
        ],
      },
      {
        id: 'lesson', ic: '🎓', title: 'Your first five minutes',
        lesson: [
          { say: 'mingalaba', native: 'မင်္ဂလာပါ', means: 'Hello', note: 'Formal and always safe; a literal “auspiciousness to you”.' },
          { say: 'kyay-zu tin-ba-de', native: 'ကျေးဇူးတင်ပါတယ်', means: 'Thank you' },
          { say: 'be-lauq le?', native: 'ဘယ်လောက်လဲ', means: 'How much?' },
          { say: 'ma-lo-bu', native: 'မလိုဘူး', means: 'I do not need it' },
          { say: 'ein-tha be-hma le?', native: 'အိမ်သာဘယ်မှာလဲ', means: 'Where is the toilet?' },
          { say: 'kaung-de', native: 'ကောင်းတယ်', means: 'It is good' },
        ],
      },
    ],
  },

  zh: {
    name: 'Chinese (Mandarin)',
    native: '普通话',
    oneLine: 'Four tones, no alphabet — and a grammar that is far simpler than its reputation.',
    sections: [
      {
        id: 'sounds', ic: '🔊', title: 'Sounds and tones',
        body: [
          'Mandarin has four tones plus a neutral one: high and flat, rising, dipping then rising, and sharply falling. Pinyin writes them as accent marks over the vowel, so like Vietnamese you can see the tone on the page.',
          'The sounds that catch English speakers are the pairs that sound alike but are not: zh/j, ch/q, sh/x, and the vowel written “ü”. The difference is where the tongue sits, and native speakers hear it clearly even when you cannot.',
          'When two third tones meet, the first becomes a second tone. “Nǐ hǎo” is actually said “ní hǎo”.',
        ],
      },
      {
        id: 'history', ic: '📜', title: 'Where it comes from',
        body: [
          'Mandarin is Sinitic, within the Sino-Tibetan family, and is the most widely spoken first language on earth by a large margin.',
          'The writing system is not an alphabet: characters represent meaningful units rather than sounds, which is why speakers of mutually unintelligible Chinese languages can read the same text. Mainland China simplified many characters in the 1950s and 60s; Taiwan, Hong Kong and Macau kept the traditional forms.',
          'Pinyin, the romanisation used here and almost everywhere, was adopted in 1958 and is a teaching and input tool rather than a script.',
          'You will meet Mandarin across this region in Chinese-Thai and Chinese-Vietnamese communities, in older Chinatowns, and increasingly with visitors and traders.',
        ],
      },
      {
        id: 'structure', ic: '🧱', title: 'How a sentence is built',
        body: [
          'Subject–verb–object. No conjugation, no plurals, no articles, no gender, no cases — the grammar is genuinely light.',
          'There is no tense. Aspect particles say whether something is completed, ongoing or experienced, and time words say when.',
          'Measure words are required when counting, and they are chosen by the shape or kind of thing. “Ge” will get you understood almost anywhere while you learn the others.',
        ],
      },
      {
        id: 'rules', ic: '📏', title: 'The rules that actually matter',
        body: [
          'Turn any statement into a question by adding “ma” to the end. This one trick unlocks a great deal.',
          '“Bù” negates, except before a fourth tone, where it changes to “bú”.',
          'Thanking people profusely for small services can read as distancing rather than warm among people who know each other well; a brief “xièxie” is the norm.',
        ],
      },
      {
        id: 'lesson', ic: '🎓', title: 'Your first five minutes',
        lesson: [
          { say: 'nǐ hǎo', native: '你好', means: 'Hello' },
          { say: 'xièxie', native: '谢谢', means: 'Thank you' },
          { say: 'duōshao qián?', native: '多少钱？', means: 'How much?' },
          { say: 'bú yào, xièxie', native: '不要，谢谢', means: 'I do not want it, thank you' },
          { say: 'cèsuǒ zài nǎr?', native: '厕所在哪儿？', means: 'Where is the toilet?' },
          { say: 'hěn hǎochī', native: '很好吃', means: 'Very tasty' },
          { say: 'wǒ tīng bu dǒng', native: '我听不懂', means: 'I do not understand' },
        ],
      },
    ],
  },

  hmn: {
    name: 'Hmong',
    native: 'Hmoob',
    oneLine: 'The consonant at the end of a written word is not a sound — it is the tone.',
    sections: [
      {
        id: 'sounds', ic: '🔊', title: 'Sounds and tones',
        body: [
          'Hmong has seven to eight tones depending on the variety, and the writing system handles them in a way nothing else in this app does: the final letter of a written syllable is a tone marker, not a consonant to be pronounced.',
          'So in “nyob zoo”, the “b” and the second “o” are instructions about pitch. A word written “pob” is said “paw” with a high tone, not “pob”.',
          'The two main varieties are White Hmong (Hmoob Dawb) and Green or Blue Hmong (Hmoob Ntsuab or Moob Leeg). They are close but not identical, and White Hmong is what most written material uses.',
        ],
        tips: [
          'Read the final letter as a tone, then stop before you say it. This single habit makes the whole script readable.',
          'You will meet Hmong in the highlands of northern Vietnam and Laos, and in northern Thailand — not as a national language but as a living one in the villages travellers pass through.',
        ],
      },
      {
        id: 'history', ic: '📜', title: 'Where it comes from',
        body: [
          'Hmong belongs to the Hmong-Mien family, which is not related to Chinese, Thai or Vietnamese. Hmong communities originate in southern China and moved south into Vietnam, Laos, Thailand and Myanmar over the last few centuries.',
          'The Romanized Popular Alphabet used today was developed in Laos in the 1950s by missionary linguists working with Hmong speakers. Before that, Hmong was largely unwritten, with its history, law and poetry carried orally and in embroidery.',
          'Large Hmong communities now live in the United States, France and Australia as a result of displacement after the wars in Laos and Vietnam.',
        ],
      },
      {
        id: 'structure', ic: '🧱', title: 'How a sentence is built',
        body: [
          'Subject–verb–object, isolating, no conjugation and no plurals — structurally familiar if you have looked at any of the others here.',
          'Classifiers are used for counting, and are also used where English would use “the”.',
          'Compound words and serial verbs do a lot of work: several verbs in a row describe one connected action.',
        ],
      },
      {
        id: 'rules', ic: '📏', title: 'The rules that actually matter',
        body: [
          'Hmong is a minority language in every country in this app. Speaking a few words is received warmly, but assume Vietnamese, Lao or Thai is also spoken and is often the language of officialdom.',
          'Kinship terms are used constantly in address, as across the region.',
          'Ask before photographing people, clothing or ceremonies. Hmong textiles carry family and clan meaning and are not a backdrop.',
        ],
      },
      {
        id: 'lesson', ic: '🎓', title: 'Your first five minutes',
        lesson: [
          { say: 'nyob zoo', native: 'Nyob zoo', means: 'Hello', note: 'Sounds roughly like “nyaw zhong”. Remember the final letters are tones.' },
          { say: 'ua tsaug', native: 'Ua tsaug', means: 'Thank you' },
          { say: 'pes tsawg?', native: 'Pes tsawg?', means: 'How much?' },
          { say: 'tsis ua li', native: 'Tsis ua li', means: 'No / never mind' },
          { say: 'qhov chaw da dej nyob qhov twg?', native: 'Qhov chaw da dej nyob qhov twg?', means: 'Where is the washroom?' },
          { say: 'qab heev', native: 'Qab heev', means: 'Very tasty' },
        ],
      },
    ],
  },
};

// Where the linguistic claims above come from. These are orientation notes drawn from
// standard reference material rather than original research, and this is what a traveller
// should read next if any of it caught their interest.
export const GUIDE_SOURCES = [
  { label: 'Ethnologue — language families and speaker estimates', url: 'https://www.ethnologue.com/' },
  { label: 'Omniglot — scripts, alphabets and writing systems', url: 'https://www.omniglot.com/' },
  { label: 'SEAlang Library — Southeast Asian language dictionaries and corpora', url: 'https://sealang.net/' },
];

export function languageGuide(code) { return LANGUAGE_GUIDES[code] || null; }
