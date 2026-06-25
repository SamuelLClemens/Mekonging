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
    { id: "stay", name: "Accommodation & check-in", phrases: [
      { en: "Do you have a room available tonight?", script: "Ada bilik kosong malam ini?", roman: "Ada bilik kosong malam ini?", note: "'Bilik kosong' = vacant/available room; natural spoken form. Add 'tak?' at the end ('Ada bilik kosong malam ini tak?') for a softer, more polite question." },
      { en: "How much per night?", script: "Berapa harga satu malam?", roman: "Berapa harga satu malam?", note: "Corrected from 'semalam', which in standard Malay usually means 'yesterday' and is ambiguous. 'Satu malam' = one night, and is clear and natural." },
      { en: "Can I see the room first?", script: "Boleh saya tengok bilik dulu?", roman: "Boleh saya tengok bilik dulu?", note: "'Tengok' is the everyday spoken word for 'look/see'; 'dulu' = first. Polite and natural." },
      { en: "Is breakfast included?", script: "Termasuk sarapan?", roman: "Termasuk sarapan?", note: "Common short form. Clearer/fuller: 'Sarapan termasuk sekali?' or 'Ada sarapan sekali?'" },
      { en: "What time is check-out?", script: "Pukul berapa check-out?", roman: "Pukul berapa check-out?", note: "'Check-out' is widely used as a loanword in Malaysian hotels and understood. Formal Malay: 'Pukul berapa masa daftar keluar?'" },
      { en: "The wifi is not working", script: "Wifi tak berfungsi", roman: "Wifi tak berfungsi", note: "'Tak berfungsi' = not working. Very common spoken alternative: 'Wifi tak jalan'." },
      { en: "The air-conditioning is not working", script: "Penghawa dingin tak berfungsi", roman: "Penghawa dingin tak berfungsi", note: "'Penghawa dingin' is the proper term. Colloquially people say 'air-cond tak jalan' or 'aircond rosak' (rosak = broken)." },
      { en: "Can I leave my bags here?", script: "Boleh saya tinggalkan beg di sini?", roman: "Boleh saya tinggalkan beg di sini?", note: "'Beg' covers bags/luggage in everyday speech; 'tinggalkan' = leave (something). Polite." },
      { en: "Is there hot water?", script: "Ada air panas?", roman: "Ada air panas?", note: "Straightforward and natural; 'air panas' = hot water." },
    ] },
    { id: "health", name: "Health & pharmacy", phrases: [
      { en: "I need a doctor", script: "Saya perlukan doktor", roman: "Saya perlukan doktor", note: "Polite and clear. Spoken urgent form: 'Saya nak jumpa doktor' (I want to see a doctor)." },
      { en: "Where is the nearest pharmacy?", script: "Di mana farmasi terdekat?", roman: "Di mana farmasi terdekat?", note: "'Farmasi' is the standard word. 'Kedai ubat' (medicine shop) is also widely understood." },
      { en: "Where is the nearest hospital?", script: "Di mana hospital terdekat?", roman: "Di mana hospital terdekat?", note: "'Hospital' is the standard loanword; universally understood." },
      { en: "I have a fever", script: "Saya demam", roman: "Saya demam", note: "Natural; 'demam' = fever. No verb 'have' needed in Malay." },
      { en: "I have diarrhoea", script: "Saya cirit-birit", roman: "Saya cirit-birit", note: "'Cirit-birit' is the everyday word for diarrhoea; 'sakit perut' (stomach pain) is a milder/vaguer alternative." },
      { en: "It hurts here", script: "Sakit di sini", roman: "Sakit di sini", note: "Point as you say it; 'sakit' = pain/hurt, 'di sini' = here." },
      { en: "I am allergic to penicillin", script: "Saya alah kepada penisilin", roman: "Saya alah kepada penisilin", note: "'Alah' = allergic (verb). 'Alergi' is also commonly used: 'Saya alergi penisilin'. 'Penisilin' is the Malay-adapted spelling." },
      { en: "Please call an ambulance", script: "Tolong panggil ambulans", roman: "Tolong panggil ambulans", note: "'Tolong' = please (for requests/help); 'ambulans' is the standard spelling." },
      { en: "I need medicine for a stomach ache", script: "Saya perlukan ubat sakit perut", roman: "Saya perlukan ubat sakit perut", note: "'Ubat sakit perut' = stomach-ache medicine (a fixed natural phrase). Spoken: 'Nak ubat sakit perut'." },
    ] },
    { id: "tickets", name: "Transport & tickets", phrases: [
      { en: "One ticket to ..., please", script: "Satu tiket ke ..., tolong", roman: "Satu tiket ke ..., tolong", note: "Keeps the '...' placeholder for the destination. Putting 'tolong' first ('Tolong, satu tiket ke ...') also sounds natural and polite." },
      { en: "What time does it leave?", script: "Pukul berapa bertolak?", roman: "Pukul berapa bertolak?", note: "'Bertolak' = to depart (of vehicles). Also common: 'Pukul berapa berangkat?'" },
      { en: "Which platform or bay?", script: "Platform atau pelantar mana?", roman: "Platform atau pelantar mana?", note: "'Platform' is widely used for trains. For a bus bay, 'pelantar' is uncommon in speech; many say 'bay' or 'gate' or point. Consider 'Platform mana?' alone for trains." },
      { en: "How long does it take?", script: "Berapa lama perjalanan?", roman: "Berapa lama perjalanan?", note: "Literally 'how long the journey'. Spoken short form: 'Berapa lama?'" },
      { en: "Does this go to ...?", script: "Ini pergi ke ...?", roman: "Ini pergi ke ...?", note: "Keeps the '...' placeholder. Natural when pointing at a bus/train; 'pergi ke' = goes to." },
      { en: "Where is the bus station?", script: "Di mana stesen bas?", roman: "Di mana stesen bas?", note: "'Stesen bas' = bus station. A larger terminal is 'terminal bas'." },
      { en: "Where is the train station?", script: "Di mana stesen keretapi?", roman: "Di mana stesen keretapi?", note: "'Keretapi' (also spelt 'kereta api') = train. For urban rail, 'stesen LRT/MRT' is used by name." },
      { en: "Please take me to this address", script: "Tolong bawa saya ke alamat ini", roman: "Tolong bawa saya ke alamat ini", note: "Say this to a taxi/e-hailing driver while showing the address; 'bawa' = take/carry." },
      { en: "Is there a later one?", script: "Ada yang lewat sedikit?", roman: "Ada yang lewat sedikit?", note: "'Yang lewat' = a later one (departure); 'sedikit' softens it to 'a bit later'. Also natural: 'Ada yang lambat sikit?' (more colloquial)." },
    ] },
  ],
};
