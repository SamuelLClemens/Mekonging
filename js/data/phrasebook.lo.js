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
      { en: 'No', script: 'ບໍ່', roman: 'baw' },
      { en: 'Sorry / Excuse me', script: 'ຂໍໂທດ', roman: 'kho-thot' },
      { en: 'I do not understand', script: 'ບໍ່ເຂົ້າໃຈ', roman: 'baw khao-jai' },
    ]},
    { id: 'market', name: 'Market & taxi', phrases: [
      { en: 'How much?', script: 'ເທົ່າໃດ', roman: 'thao-dai' },
      { en: 'Too expensive', script: 'ແພງເກີນໄປ', roman: 'phaeng kern pai' },
      { en: 'Lower the price?', script: 'ຫຼຸດໄດ້ບໍ່?', roman: 'lut dai baw' },
      { en: 'Stop here', script: 'ຈອດບ່ອນນີ້', roman: 'jot bon nii' },
    ]},
    { id: 'essentials', name: 'Food, water & help', phrases: [
      { en: 'Water', script: 'ນ້ຳ', roman: 'nam' },
      { en: 'Delicious', script: 'ແຊບ', roman: 'saep' },
      { en: 'Where is the toilet?', script: 'ຫ້ອງນ້ຳຢູ່ໃສ?', roman: 'hong-nam yu sai' },
      { en: 'Help!', script: 'ຊ່ວຍແດ່!', roman: 'suay dae' },
      { en: 'Hospital', script: 'ໂຮງໝໍ', roman: 'hong mor' },
    ]},
    { id: "numbers", name: "Numbers", phrases: [
      { en: "One", script: "ໜຶ່ງ", roman: "neung" },
      { en: "Two", script: "ສອງ", roman: "sawng" },
      { en: "Three", script: "ສາມ", roman: "saam" },
      { en: "Four", script: "ສີ່", roman: "sii" },
      { en: "Five", script: "ຫ້າ", roman: "haa" },
      { en: "Six", script: "ຫົກ", roman: "hok" },
      { en: "Seven", script: "ເຈັດ", roman: "jet" },
      { en: "Eight", script: "ແປດ", roman: "paet" },
      { en: "Nine", script: "ເກົ້າ", roman: "kao" },
      { en: "Ten", script: "ສິບ", roman: "sip" },
      { en: "Hundred", script: "ຮ້ອຍ", roman: "hoi", note: "One hundred is ໜຶ່ງຮ້ອຍ (neung hoi); ຮ້ອຍ alone is the unit 'hundred'. Verified against Omniglot Lao numbers." },
      { en: "Thousand", script: "ພັນ", roman: "phan", note: "One thousand is ໜຶ່ງພັນ (neung phan); ພັນ alone is the unit 'thousand'. Verified against Omniglot Lao numbers." },
    ] },
    { id: "directions", name: "Directions", phrases: [
      { en: "Turn left", script: "ລ້ຽວຊ້າຍ", roman: "liao saai" },
      { en: "Turn right", script: "ລ້ຽວຂວາ", roman: "liao khwaa" },
      { en: "Go straight", script: "ໄປຊື່", roman: "pai seu" },
      { en: "Stop here please", script: "ຈອດຢູ່ນີ້ແດ່", roman: "jawt yuu nii dae", note: "ຈອດຢູ່ນີ້ (jawt yuu nii) = pull over / stop here, used to tell a driver to stop (attested on Ling). ແດ່ (dae) softens it politely. A plain 'stop' is ຢຸດ (yut)." },
      { en: "Where is the toilet", script: "ຫ້ອງນ້ຳຢູ່ໃສ", roman: "hawng nam yuu sai" },
      { en: "How much", script: "ເທົ່າໃດ", roman: "thao dai", note: "Often said as ອັນນີ້ເທົ່າໃດ (an nii thao dai) = 'how much is this?'." },
      { en: "Too expensive", script: "ແພງຫຼາຍ", roman: "phaeng laai", note: "For greater emphasis Lao speakers may double it: ແພງຫຼາຍໆ (phaeng laai laai)." },
    ] },
    { id: "emergency", name: "Emergency", phrases: [
      { en: "Help", script: "ຊ່ວຍດ້ວຍ", roman: "suay duay", note: "This is the urgent shout for danger ('Help!'), confirmed as the emphatic call for immediate assistance. The softer 'please help me' is ຊ່ອຍແດ່ (suay dae); use ຊ່ວຍດ້ວຍ when in real danger." },
      { en: "Call the police", script: "ໂທຫາຕຳຫຼວດ", roman: "tho haa tam-luat", note: "ໂທຫາ (tho haa) = phone/call; ຕຳຫຼວດ (tam-luat) = police. Laos police emergency number is 191 (1191 from mobiles)." },
      { en: "Call an ambulance", script: "ໂທຫາລົດໂຮງໝໍ", roman: "tho haa lot hong mor", note: "Romanization corrected: ລົດ is 'lot' (Lao has no 'r' here), not 'rot'. ລົດໂຮງໝໍ (lot hong mor, literally 'hospital vehicle') is a valid compound for ambulance but was not directly attested in a phrasebook; the attested alternative is ລົດສຸກເສີນ (lot suk-soen, 'emergency vehicle'). The verb ໂທຫາ is confirmed. Ambulance number is 195 (1195); in Vientiane the volunteer Rescue line is 1623." },
      { en: "I need a doctor", script: "ຂ້ອຍຕ້ອງການໝໍ", roman: "khoy tong-kan mor", note: "Confirmed against Ling Lao emergency phrases (ຂ້ອຍຕ້ອງການໝໍ)." },
      { en: "Where is the hospital", script: "ໂຮງໝໍຢູ່ໃສ", roman: "hong mor yuu sai", note: "ໂຮງໝໍ (hong mor) = hospital, confirmed; ຢູ່ໃສ = 'where is'." },
      { en: "I am lost", script: "ຂ້ອຍຫຼົງທາງ", roman: "khoy long thaang", note: "Confirmed against Ling Lao emergency phrases (ຂ້ອຍຫລົງທາງ)." },
      { en: "I am allergic", script: "ຂ້ອຍແພ້", roman: "khoy phae", note: "ແພ້ (phae) is the verb 'to be allergic'. Lao normally states what you are allergic to, e.g. ຂ້ອຍແພ້ຢາ (khoy phae yaa) = 'I am allergic to medicine'. The bare sentence was NOT directly attested in any phrasebook source checked, so confirm the specific allergen locally before relying on this in an emergency." },
    ] },
  ],
};
