// ---- MEDICAL & EMERGENCY CARE ----------------------------------------------
// Everything a traveller needs to REACH CARE, wherever they are in the four countries.
//
// THE CONTRACT FOR THIS FILE — read before adding a row:
//   * No telephone numbers. Ever. A stale hospital switchboard number is worse than no
//     number: it burns minutes in the only situation where minutes matter. The national
//     emergency number (country data, js/data/info.*.js) and a live maps lookup are the
//     only call/route paths this app asserts.
//   * Names and coordinates are CHECKABLE FACTS. A coordinate is a city/district-centre
//     point good enough to order a list and seed a map query — it is never a claim of a
//     precise door. `tier` and `tags` describe capability, not quality ranking.
//   * Coverage is deliberately uneven because reality is uneven. Where no facility is
//     listed for a district, the app falls back to PROVINCE_CARE below, which states what
//     the country's health system structurally guarantees at that administrative level.
//     That fallback is the reason the app can answer "how do I reach a hospital" from a
//     village it has never heard of, without inventing a hospital that may not exist.
//   * Nothing here is a diagnosis or a treatment decision.

// Capability tags, shown as chips.
export const HOSP_TAG = {
  er: '🚑 24h emergency',
  peds: '🧒 Children',
  maternity: '🤰 Maternity',
  intl: '🌐 English / international',
  trauma: '🩸 Major trauma & surgery',
  hyperbaric: '🤿 Hyperbaric (dive) chamber',
  evac: '✈️ Arranges medical evacuation',
};

// What each tier actually means on the ground. Shown verbatim so a traveller can judge
// whether the nearest listed option is the RIGHT option for what has happened.
export const TIER_META = {
  intl: { label: 'International', dot: '🟢', blurb: 'International-standard private hospital. English spoken, insurance and cards normally accepted, and used to treating foreign patients.' },
  private: { label: 'Private', dot: '🔵', blurb: 'Private hospital. Usually faster than a public one and often has some English, but payment is normally expected up front.' },
  public: { label: 'Government', dot: '🟡', blurb: 'Government provincial or regional hospital. This is the ER that must accept an emergency. Capable, often crowded, and English can be limited.' },
  district: { label: 'District', dot: '🟠', blurb: 'District hospital or health centre. Staffed for first aid, stabilisation and common illness — a serious case is stabilised here and referred onward.' },
  clinic: { label: 'Clinic', dot: '⚪', blurb: 'Clinic only — no surgery and usually no overnight beds. Good for minor injury and illness; anything major means transfer.' },
};
export const TIER_ORDER = ['intl', 'private', 'public', 'district', 'clinic'];

// Facilities travellers, expats and embassies actually use, grouped by country and then
// roughly by traveller region. `prov` matches the ADM1 name in js/data/regions.<cc>.js so a
// GPS fix that resolves to a province can pull that province's own options even when the
// traveller is far from any listed city.
export const HOSPITALS = [
  // ---- THAILAND — Bangkok & central ----------------------------------------
  { cc: 'th', prov: 'Bangkok', city: 'Bangkok', lat: 13.7437, lng: 100.5548, name: 'Bumrungrad International Hospital', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'trauma', 'evac'] },
  { cc: 'th', prov: 'Bangkok', city: 'Bangkok', lat: 13.7305, lng: 100.5690, name: 'Samitivej Sukhumvit Hospital', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'evac'], note: 'Has a separate children’s hospital on the same campus.' },
  { cc: 'th', prov: 'Bangkok', city: 'Bangkok', lat: 13.7247, lng: 100.5389, name: 'BNH Hospital', tier: 'intl', tags: ['er', 'maternity', 'intl'] },
  { cc: 'th', prov: 'Bangkok', city: 'Bangkok', lat: 13.7480, lng: 100.5830, name: 'Bangkok Hospital (Soi Soonvijai)', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'trauma', 'evac'], note: 'Flagship of the largest private hospital group in the region.' },
  { cc: 'th', prov: 'Bangkok', city: 'Bangkok', lat: 13.7590, lng: 100.4850, name: 'Siriraj Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'Thailand’s oldest and largest public teaching hospital, on the Thonburi bank.' },
  { cc: 'th', prov: 'Bangkok', city: 'Bangkok', lat: 13.7330, lng: 100.5360, name: 'King Chulalongkorn Memorial Hospital (Thai Red Cross)', tier: 'public', tags: ['er', 'peds', 'trauma'], note: 'Also the national snake-antivenom centre — the Queen Saovabha Institute is on the same site.' },
  { cc: 'th', prov: 'Bangkok', city: 'Bangkok', lat: 13.7660, lng: 100.5270, name: 'Ramathibodi Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'] },
  { cc: 'th', prov: 'Phra Nakhon Si Ayutthaya', city: 'Ayutthaya', lat: 14.3530, lng: 100.5680, name: 'Phra Nakhon Si Ayutthaya Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },
  { cc: 'th', prov: 'Kanchanaburi', city: 'Kanchanaburi', lat: 14.0230, lng: 99.5320, name: 'Phaholpolpayuhasena Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'], note: 'The provincial hospital for the Erawan / Death Railway area.' },
  { cc: 'th', prov: 'Nakhon Sawan', city: 'Nakhon Sawan', lat: 15.7050, lng: 100.1370, name: 'Sawanpracharak Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'] },
  { cc: 'th', prov: 'Lopburi', city: 'Lopburi', lat: 14.7990, lng: 100.6530, name: 'King Narai Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },

  // ---- THAILAND — north ----------------------------------------------------
  { cc: 'th', prov: 'Chiang Mai', city: 'Chiang Mai', lat: 18.7965, lng: 98.9720, name: 'Chiang Mai Ram Hospital', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'evac'] },
  { cc: 'th', prov: 'Chiang Mai', city: 'Chiang Mai', lat: 18.7890, lng: 98.9740, name: 'Maharaj Nakorn Chiang Mai Hospital (Suan Dok)', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The north’s main university and referral hospital — the destination for major trauma.' },
  { cc: 'th', prov: 'Chiang Mai', city: 'Chiang Mai', lat: 18.8080, lng: 98.9860, name: 'Bangkok Hospital Chiang Mai', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'evac'] },
  { cc: 'th', prov: 'Chiang Mai', city: 'Chiang Mai', lat: 18.7860, lng: 99.0040, name: 'McCormick Hospital', tier: 'private', tags: ['er', 'maternity', 'intl'] },
  { cc: 'th', prov: 'Chiang Rai', city: 'Chiang Rai', lat: 19.9050, lng: 99.8290, name: 'Chiang Rai Prachanukroh Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The regional referral hospital for the far north and the Laos/Myanmar border crossings.' },
  { cc: 'th', prov: 'Chiang Rai', city: 'Chiang Rai', lat: 19.9080, lng: 99.8330, name: 'Overbrook Hospital', tier: 'private', tags: ['er', 'intl'] },
  { cc: 'th', prov: 'Mae Hong Son', city: 'Mae Hong Son', lat: 19.3010, lng: 97.9680, name: 'Sri Sangwan Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The only provincial hospital in Thailand’s most mountainous province — serious cases go to Chiang Mai.' },
  { cc: 'th', prov: 'Mae Hong Son', city: 'Pai', lat: 19.3590, lng: 98.4410, name: 'Pai Hospital', tier: 'district', tags: ['er'], note: 'Small district hospital. It treats the town’s many scooter injuries and refers anything serious to Chiang Mai, about 3 hours by road.' },
  { cc: 'th', prov: 'Lampang', city: 'Lampang', lat: 18.2880, lng: 99.4900, name: 'Lampang Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },
  { cc: 'th', prov: 'Nan', city: 'Nan', lat: 18.7830, lng: 100.7790, name: 'Nan Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Phrae', city: 'Phrae', lat: 18.1440, lng: 100.1400, name: 'Phrae Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Phitsanulok', city: 'Phitsanulok', lat: 16.8210, lng: 100.2640, name: 'Buddhachinaraj Phitsanulok Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'One of the largest hospitals in the lower north; the referral point for Sukhothai and Phetchabun.' },
  { cc: 'th', prov: 'Sukhothai', city: 'Sukhothai', lat: 17.0080, lng: 99.8250, name: 'Sukhothai Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Tak', city: 'Mae Sot', lat: 16.7160, lng: 98.5730, name: 'Mae Sot Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'], note: 'The border hospital for the Myanmar crossing; also treats a large cross-border caseload.' },

  // ---- THAILAND — Isan (north-east) ----------------------------------------
  { cc: 'th', prov: 'Khon Kaen', city: 'Khon Kaen', lat: 16.4670, lng: 102.8240, name: 'Srinagarind Hospital (Khon Kaen University)', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The main tertiary referral hospital for the whole north-east.' },
  { cc: 'th', prov: 'Khon Kaen', city: 'Khon Kaen', lat: 16.4320, lng: 102.8320, name: 'Khon Kaen Ram Hospital', tier: 'private', tags: ['er', 'peds', 'intl'] },
  { cc: 'th', prov: 'Udon Thani', city: 'Udon Thani', lat: 17.4110, lng: 102.7870, name: 'Aek Udon International Hospital', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'evac'], note: 'The standard evacuation destination for Vientiane, Laos — about an hour from the Friendship Bridge.' },
  { cc: 'th', prov: 'Udon Thani', city: 'Udon Thani', lat: 17.4130, lng: 102.7940, name: 'Udon Thani Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'] },
  { cc: 'th', prov: 'Nong Khai', city: 'Nong Khai', lat: 17.8780, lng: 102.7420, name: 'Nong Khai Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'First Thai hospital across the Friendship Bridge from Vientiane.' },
  { cc: 'th', prov: 'Nakhon Ratchasima', city: 'Nakhon Ratchasima (Korat)', lat: 14.9740, lng: 102.0980, name: 'Maharat Nakhon Ratchasima Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'One of Thailand’s biggest hospitals; the referral centre for the lower north-east.' },
  { cc: 'th', prov: 'Ubon Ratchathani', city: 'Ubon Ratchathani', lat: 15.2280, lng: 104.8570, name: 'Sappasitthiprasong Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The referral hospital for the Lao border at Chong Mek and for Pakse, Laos.' },
  { cc: 'th', prov: 'Buri Ram', city: 'Buriram', lat: 14.9930, lng: 103.1030, name: 'Buriram Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },
  { cc: 'th', prov: 'Surin', city: 'Surin', lat: 14.8820, lng: 103.4930, name: 'Surin Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },
  { cc: 'th', prov: 'Mukdahan', city: 'Mukdahan', lat: 16.5450, lng: 104.7230, name: 'Mukdahan Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'Across the second Friendship Bridge from Savannakhet, Laos.' },
  { cc: 'th', prov: 'Nakhon Phanom', city: 'Nakhon Phanom', lat: 17.4080, lng: 104.7790, name: 'Nakhon Phanom Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'Across the third Friendship Bridge from Thakhek, Laos.' },
  { cc: 'th', prov: 'Loei', city: 'Loei', lat: 17.4880, lng: 101.7270, name: 'Loei Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Sakon Nakhon', city: 'Sakon Nakhon', lat: 17.1620, lng: 104.1470, name: 'Sakon Nakhon Hospital', tier: 'public', tags: ['er', 'maternity'] },

  // ---- THAILAND — east & the gulf ------------------------------------------
  { cc: 'th', prov: 'Chon Buri', city: 'Pattaya', lat: 12.9250, lng: 100.8890, name: 'Bangkok Hospital Pattaya', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'trauma', 'evac'] },
  { cc: 'th', prov: 'Chon Buri', city: 'Chonburi', lat: 13.3610, lng: 100.9840, name: 'Chonburi Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'] },
  { cc: 'th', prov: 'Rayong', city: 'Rayong', lat: 12.6800, lng: 101.2570, name: 'Bangkok Hospital Rayong', tier: 'intl', tags: ['er', 'peds', 'intl'] },
  { cc: 'th', prov: 'Trat', city: 'Trat', lat: 12.2430, lng: 102.5150, name: 'Trat Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The mainland hospital for Koh Chang and Koh Kood — the ferry crossing is part of the journey, so allow for it.' },
  { cc: 'th', prov: 'Trat', city: 'Koh Chang', lat: 12.0470, lng: 102.3220, name: 'Koh Chang International Hospital', tier: 'private', tags: ['er', 'intl'], note: 'The island’s only hospital-level care. Anything major crosses to Trat or Bangkok.' },
  { cc: 'th', prov: 'Prachuap Khiri Khan', city: 'Hua Hin', lat: 12.5670, lng: 99.9560, name: 'Bangkok Hospital Hua Hin', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'th', prov: 'Prachuap Khiri Khan', city: 'Hua Hin', lat: 12.5710, lng: 99.9600, name: 'Hua Hin Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Phetchaburi', city: 'Phetchaburi', lat: 13.1110, lng: 99.9430, name: 'Phrachomklao Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Chumphon', city: 'Chumphon', lat: 10.4930, lng: 99.1800, name: 'Chumphon Khet Udomsak Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Ranong', city: 'Ranong', lat: 9.9660, lng: 98.6350, name: 'Ranong Hospital', tier: 'public', tags: ['er', 'maternity'] },

  // ---- THAILAND — the south & the islands ----------------------------------
  { cc: 'th', prov: 'Surat Thani', city: 'Surat Thani', lat: 9.1380, lng: 99.3210, name: 'Suratthani Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The mainland referral hospital for Samui, Phangan and Tao.' },
  { cc: 'th', prov: 'Surat Thani', city: 'Koh Samui', lat: 9.5350, lng: 100.0620, name: 'Bangkok Hospital Samui', tier: 'intl', tags: ['er', 'peds', 'intl', 'evac'], note: 'The island’s main international hospital; arranges air transfer to Bangkok when needed.' },
  { cc: 'th', prov: 'Surat Thani', city: 'Koh Samui', lat: 9.5580, lng: 100.0630, name: 'Thai International Hospital Samui', tier: 'private', tags: ['er', 'intl', 'hyperbaric'], note: 'Runs a recompression chamber for diving injuries.' },
  { cc: 'th', prov: 'Surat Thani', city: 'Koh Samui', lat: 9.5120, lng: 100.0450, name: 'Koh Samui Hospital (Nathon)', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'th', prov: 'Surat Thani', city: 'Koh Phangan', lat: 9.7080, lng: 100.0060, name: 'Koh Phangan Hospital', tier: 'district', tags: ['er'], note: 'The island’s government hospital. Serious cases go by boat or air to Samui or Surat Thani, so weather and the last ferry matter.' },
  { cc: 'th', prov: 'Surat Thani', city: 'Koh Tao', lat: 10.0980, lng: 99.8380, name: 'Koh Tao Health Centre & dive-medicine clinics', tier: 'clinic', tags: [], note: 'Clinic-level only, plus dive-medicine services. There is a recompression chamber on the island, but anything major means a boat to Koh Samui or Chumphon — check the sea state early.' },
  { cc: 'th', prov: 'Phuket', city: 'Phuket', lat: 7.8927, lng: 98.3699, name: 'Bangkok Hospital Phuket', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'trauma', 'evac'] },
  { cc: 'th', prov: 'Phuket', city: 'Phuket', lat: 7.8830, lng: 98.3900, name: 'Vachira Phuket Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The island’s government referral hospital and the destination for major trauma.' },
  { cc: 'th', prov: 'Phuket', city: 'Phuket', lat: 7.8880, lng: 98.3810, name: 'Phuket International Hospital', tier: 'intl', tags: ['er', 'intl', 'hyperbaric', 'evac'], note: 'Has a hyperbaric chamber for diving injuries.' },
  { cc: 'th', prov: 'Phuket', city: 'Patong', lat: 7.8930, lng: 98.3020, name: 'Patong Hospital', tier: 'public', tags: ['er'], note: 'Closest ER to the beach and the nightlife strip.' },
  { cc: 'th', prov: 'Phangnga', city: 'Khao Lak', lat: 8.6410, lng: 98.2460, name: 'Takua Pa Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The nearest government hospital to Khao Lak; Phuket is about 90 minutes south.' },
  { cc: 'th', prov: 'Krabi', city: 'Krabi', lat: 8.0800, lng: 98.9060, name: 'Krabi Nakharin International Hospital', tier: 'intl', tags: ['er', 'peds', 'intl', 'evac'] },
  { cc: 'th', prov: 'Krabi', city: 'Krabi', lat: 8.0670, lng: 98.9180, name: 'Krabi Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },
  { cc: 'th', prov: 'Krabi', city: 'Koh Lanta', lat: 7.6280, lng: 99.0480, name: 'Koh Lanta Hospital', tier: 'district', tags: ['er'], note: 'District hospital. Krabi town is roughly two hours away including the vehicle ferry.' },
  { cc: 'th', prov: 'Krabi', city: 'Koh Phi Phi', lat: 7.7400, lng: 98.7700, name: 'Phi Phi clinics (Ton Sai)', tier: 'clinic', tags: [], note: 'Private clinics only, no hospital. Serious cases go by speedboat to Krabi or Phuket — about 45–90 minutes in good weather.' },
  { cc: 'th', prov: 'Trang', city: 'Trang', lat: 7.5590, lng: 99.6120, name: 'Trang Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },
  { cc: 'th', prov: 'Nakhon Si Thammarat', city: 'Nakhon Si Thammarat', lat: 8.4320, lng: 99.9620, name: 'Maharaj Nakhon Si Thammarat Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'] },
  { cc: 'th', prov: 'Songkhla', city: 'Hat Yai', lat: 7.0080, lng: 100.4760, name: 'Hat Yai Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'] },
  { cc: 'th', prov: 'Songkhla', city: 'Hat Yai', lat: 7.0060, lng: 100.4980, name: 'Songklanagarind Hospital (Prince of Songkla University)', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The deep south’s tertiary referral hospital.' },
  { cc: 'th', prov: 'Satun', city: 'Satun', lat: 6.6230, lng: 100.0670, name: 'Satun Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'Nearest to the Langkawi ferry and the Tarutao islands.' },

  // ---- VIETNAM — north -----------------------------------------------------
  { cc: 'vi', prov: 'Hà Nội', city: 'Hanoi', lat: 20.9950, lng: 105.8680, name: 'Vinmec International Hospital (Times City)', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'trauma', 'evac'] },
  { cc: 'vi', prov: 'Hà Nội', city: 'Hanoi', lat: 21.0180, lng: 105.8480, name: 'Hanoi French Hospital (Bệnh viện Việt Pháp)', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'evac'] },
  { cc: 'vi', prov: 'Hà Nội', city: 'Hanoi', lat: 21.0300, lng: 105.8130, name: 'Family Medical Practice Hanoi', tier: 'intl', tags: ['intl', 'evac'], note: 'International clinic with 24-hour on-call and evacuation support — not a full hospital.' },
  { cc: 'vi', prov: 'Hà Nội', city: 'Hanoi', lat: 21.0000, lng: 105.8410, name: 'Bach Mai Hospital', tier: 'public', tags: ['er', 'peds', 'trauma'], note: 'Vietnam’s largest public hospital and the north’s poisoning-treatment centre.' },
  { cc: 'vi', prov: 'Hà Nội', city: 'Hanoi', lat: 21.0270, lng: 105.8420, name: 'Viet Duc University Hospital', tier: 'public', tags: ['er', 'trauma'], note: 'The north’s national trauma and surgical centre — the destination for a serious road accident.' },
  { cc: 'vi', prov: 'Hà Nội', city: 'Hanoi', lat: 21.0230, lng: 105.8060, name: 'Vietnam National Children’s Hospital', tier: 'public', tags: ['er', 'peds'] },
  { cc: 'vi', prov: 'Quảng Ninh', city: 'Ha Long', lat: 20.9530, lng: 107.0680, name: 'Vinmec Ha Long International Hospital', tier: 'intl', tags: ['er', 'peds', 'intl'] },
  { cc: 'vi', prov: 'Quảng Ninh', city: 'Ha Long', lat: 20.9600, lng: 107.0410, name: 'Bai Chay Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The hospital an evacuation from a Ha Long or Lan Ha Bay cruise heads to.' },
  { cc: 'vi', prov: 'Hải Phòng', city: 'Hai Phong', lat: 20.8580, lng: 106.6830, name: 'Viet Tiep Friendship Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The mainland referral hospital for Cat Ba island.' },
  { cc: 'vi', prov: 'Lào Cai', city: 'Lao Cai', lat: 22.4860, lng: 103.9750, name: 'Lao Cai General Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The provincial hospital for Sapa — about an hour down the mountain.' },
  { cc: 'vi', prov: 'Lào Cai', city: 'Sapa', lat: 22.3360, lng: 103.8440, name: 'Sa Pa Health Centre', tier: 'district', tags: ['er'], note: 'District level. Trekking injuries are stabilised here and sent to Lao Cai or Hanoi.' },
  { cc: 'vi', prov: 'Hà Giang', city: 'Ha Giang', lat: 22.8230, lng: 104.9840, name: 'Ha Giang General Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The only province-level hospital on the Ha Giang Loop. Plan for long transfer times from the passes.' },
  { cc: 'vi', prov: 'Ninh Bình', city: 'Ninh Binh', lat: 20.2540, lng: 105.9750, name: 'Ninh Binh General Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'vi', prov: 'Quảng Bình', city: 'Dong Hoi', lat: 17.4680, lng: 106.6220, name: 'Quang Binh General Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The hospital for Phong Nha–Ke Bang and its caves.' },

  // ---- VIETNAM — centre ----------------------------------------------------
  { cc: 'vi', prov: 'Thừa Thiên Huế', city: 'Hue', lat: 16.4620, lng: 107.5820, name: 'Hue Central Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'A national-level hospital and central Vietnam’s main referral centre.' },
  { cc: 'vi', prov: 'Đà Nẵng', city: 'Da Nang', lat: 16.0600, lng: 108.2200, name: 'Vinmec Da Nang International Hospital', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'evac'] },
  { cc: 'vi', prov: 'Đà Nẵng', city: 'Da Nang', lat: 16.0690, lng: 108.2140, name: 'Da Nang General Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The region’s largest ER and the destination for major trauma from Hoi An and the Hai Van Pass.' },
  { cc: 'vi', prov: 'Đà Nẵng', city: 'Da Nang', lat: 16.0470, lng: 108.2200, name: 'Family Medical Practice Da Nang', tier: 'intl', tags: ['intl', 'evac'], note: 'International clinic with evacuation support — not a full hospital.' },
  { cc: 'vi', prov: 'Quảng Nam', city: 'Hoi An', lat: 15.8800, lng: 108.3350, name: 'Hoi An Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'Fine for scooter grazes and illness; anything serious is 45 minutes to Da Nang.' },
  { cc: 'vi', prov: 'Khánh Hòa', city: 'Nha Trang', lat: 12.2450, lng: 109.1920, name: 'Khanh Hoa General Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'] },
  { cc: 'vi', prov: 'Khánh Hòa', city: 'Nha Trang', lat: 12.2160, lng: 109.1960, name: 'Vinmec Nha Trang International Hospital', tier: 'intl', tags: ['er', 'peds', 'intl'] },
  { cc: 'vi', prov: 'Lâm Đồng', city: 'Da Lat', lat: 11.9420, lng: 108.4380, name: 'Lam Dong General Hospital', tier: 'public', tags: ['er', 'peds', 'maternity'] },
  { cc: 'vi', prov: 'Bình Định', city: 'Quy Nhon', lat: 13.7690, lng: 109.2210, name: 'Binh Dinh General Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'vi', prov: 'Bình Thuận', city: 'Phan Thiet / Mui Ne', lat: 10.9330, lng: 108.1000, name: 'Binh Thuan General Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'vi', prov: 'Đắk Lắk', city: 'Buon Ma Thuot', lat: 12.6800, lng: 108.0500, name: 'Dak Lak General Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The main hospital for the central highlands.' },
  { cc: 'vi', prov: 'Gia Lai', city: 'Pleiku', lat: 13.9830, lng: 108.0000, name: 'Gia Lai General Hospital', tier: 'public', tags: ['er', 'maternity'] },

  // ---- VIETNAM — south -----------------------------------------------------
  { cc: 'vi', prov: 'Ho Chi Minh', city: 'Ho Chi Minh City', lat: 10.7290, lng: 106.7220, name: 'FV Hospital (Franco-Vietnamese)', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'trauma', 'evac'] },
  { cc: 'vi', prov: 'Ho Chi Minh', city: 'Ho Chi Minh City', lat: 10.7846, lng: 106.6960, name: 'Family Medical Practice HCMC', tier: 'intl', tags: ['er', 'intl', 'evac'], note: '24/7 international clinic; the usual first call for evacuation from the south.' },
  { cc: 'vi', prov: 'Ho Chi Minh', city: 'Ho Chi Minh City', lat: 10.7930, lng: 106.7210, name: 'Vinmec Central Park International Hospital', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl'] },
  { cc: 'vi', prov: 'Ho Chi Minh', city: 'Ho Chi Minh City', lat: 10.7560, lng: 106.6610, name: 'Cho Ray Hospital', tier: 'public', tags: ['er', 'trauma'], note: 'The south’s largest public hospital and its main trauma and poisoning centre.' },
  { cc: 'vi', prov: 'Ho Chi Minh', city: 'Ho Chi Minh City', lat: 10.7680, lng: 106.6710, name: 'Children’s Hospital 1', tier: 'public', tags: ['er', 'peds'] },
  { cc: 'vi', prov: 'Cần Thơ', city: 'Can Tho', lat: 10.0350, lng: 105.7830, name: 'Can Tho General Hospital', tier: 'public', tags: ['er', 'peds', 'maternity', 'trauma'], note: 'The Mekong Delta’s main referral hospital.' },
  { cc: 'vi', prov: 'Kiên Giang', city: 'Phu Quoc', lat: 10.2170, lng: 103.9640, name: 'Vinmec Phu Quoc International Hospital', tier: 'intl', tags: ['er', 'peds', 'intl'], note: 'The island’s international option; complex cases fly to Ho Chi Minh City.' },
  { cc: 'vi', prov: 'Kiên Giang', city: 'Phu Quoc', lat: 10.2260, lng: 103.9600, name: 'Phu Quoc Medical Centre', tier: 'district', tags: ['er'] },
  { cc: 'vi', prov: 'Bà Rịa–Vũng Tàu', city: 'Vung Tau', lat: 10.3460, lng: 107.0840, name: 'Le Loi Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'vi', prov: 'Côn Đảo', city: 'Con Dao', lat: 8.6900, lng: 106.6070, name: 'Con Dao Military–Civilian Hospital', tier: 'district', tags: ['er'], note: 'The only facility on the archipelago. Anything major is a flight or a long boat to the mainland — weather can close both.' },

  // ---- CAMBODIA ------------------------------------------------------------
  { cc: 'kh', prov: 'Phnom Penh', city: 'Phnom Penh', lat: 11.5800, lng: 104.8990, name: 'Royal Phnom Penh Hospital', tier: 'intl', tags: ['er', 'peds', 'maternity', 'intl', 'evac'] },
  { cc: 'kh', prov: 'Phnom Penh', city: 'Phnom Penh', lat: 11.5560, lng: 104.9280, name: 'Raffles Medical Phnom Penh', tier: 'intl', tags: ['er', 'intl', 'evac'], note: 'Widely used by embassies; arranges air evacuation to Bangkok or Singapore.' },
  { cc: 'kh', prov: 'Phnom Penh', city: 'Phnom Penh', lat: 11.5350, lng: 104.9270, name: 'Sunrise Japan Hospital', tier: 'intl', tags: ['er', 'intl'], note: 'Japanese-run; a strong option for stroke and neurological emergencies.' },
  { cc: 'kh', prov: 'Phnom Penh', city: 'Phnom Penh', lat: 11.5720, lng: 104.9160, name: 'Calmette Hospital', tier: 'public', tags: ['er', 'trauma'], note: 'The country’s main public referral and trauma hospital.' },
  { cc: 'kh', prov: 'Phnom Penh', city: 'Phnom Penh', lat: 11.5730, lng: 104.9070, name: 'Kantha Bopha Children’s Hospital', tier: 'public', tags: ['er', 'peds'], note: 'Charitable children’s hospital; free care for Cambodian children.' },
  { cc: 'kh', prov: 'Siem Reap', city: 'Siem Reap', lat: 13.3670, lng: 103.8560, name: 'Royal Angkor International Hospital', tier: 'intl', tags: ['er', 'intl', 'evac'], note: 'The usual first stop for a traveller taken ill at the temples.' },
  { cc: 'kh', prov: 'Siem Reap', city: 'Siem Reap', lat: 13.3560, lng: 103.8590, name: 'Angkor Hospital for Children', tier: 'public', tags: ['er', 'peds'], note: 'Renowned charitable children’s hospital.' },
  { cc: 'kh', prov: 'Siem Reap', city: 'Siem Reap', lat: 13.3610, lng: 103.8600, name: 'Siem Reap Provincial Referral Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'kh', prov: 'Preah Sihanouk', city: 'Sihanoukville', lat: 10.6270, lng: 103.5220, name: 'Preah Sihanouk Provincial Referral Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The mainland hospital for Koh Rong and Koh Rong Sanloem — the boat crossing is part of the journey.' },
  { cc: 'kh', prov: 'Battambang', city: 'Battambang', lat: 13.0950, lng: 103.2020, name: 'Battambang Provincial Referral Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'kh', prov: 'Kampot', city: 'Kampot', lat: 10.6100, lng: 104.1810, name: 'Sonja Kill Memorial Hospital', tier: 'private', tags: ['er', 'peds', 'maternity'], note: 'A well-equipped charitable hospital serving Kampot and Kep.' },
  { cc: 'kh', prov: 'Kampot', city: 'Kampot', lat: 10.5940, lng: 104.1770, name: 'Kampot Provincial Referral Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'kh', prov: 'Kep', city: 'Kep', lat: 10.4830, lng: 104.3160, name: 'Kep Referral Hospital', tier: 'district', tags: ['er'], note: 'Small. Kampot, 25 km away, is the realistic destination for anything serious.' },
  { cc: 'kh', prov: 'Kampong Cham', city: 'Kampong Cham', lat: 11.9920, lng: 105.4640, name: 'Kampong Cham Provincial Referral Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'kh', prov: 'Kratie', city: 'Kratie', lat: 12.4880, lng: 106.0180, name: 'Kratie Provincial Referral Hospital', tier: 'public', tags: ['er'], note: 'The hospital for the Irrawaddy dolphin stretch of the Mekong.' },
  { cc: 'kh', prov: 'Ratanakiri', city: 'Banlung', lat: 13.7370, lng: 106.9870, name: 'Ratanakiri Provincial Referral Hospital', tier: 'public', tags: ['er'], note: 'Remote north-east. Serious cases go to Phnom Penh — a long road, so call for advice early.' },
  { cc: 'kh', prov: 'Mondulkiri', city: 'Sen Monorom', lat: 12.4570, lng: 107.1880, name: 'Mondulkiri Provincial Referral Hospital', tier: 'public', tags: ['er'], note: 'Remote highlands; expect a long transfer for anything major.' },
  { cc: 'kh', prov: 'Bantey Meanchey', city: 'Poipet', lat: 13.6580, lng: 102.5640, name: 'Mongkol Borei Referral Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'The hospital for the Poipet–Aranyaprathet border crossing.' },

  // ---- LAOS ----------------------------------------------------------------
  { cc: 'la', prov: 'Vientiane Capital', city: 'Vientiane', lat: 17.9660, lng: 102.6110, name: 'Alliance International Medical Centre', tier: 'intl', tags: ['er', 'intl', 'evac'], note: 'The best-equipped option in Laos and the usual first call for a foreign traveller.' },
  { cc: 'la', prov: 'Vientiane Capital', city: 'Vientiane', lat: 17.9610, lng: 102.6030, name: 'Mahosot Hospital', tier: 'public', tags: ['er'], note: 'The main public hospital. Serious cases are stabilised and evacuated to Thailand.' },
  { cc: 'la', prov: 'Vientiane Capital', city: 'Vientiane', lat: 17.9880, lng: 102.6420, name: 'Setthathirath Hospital', tier: 'public', tags: ['er', 'maternity'] },
  { cc: 'la', prov: 'Vientiane Capital', city: 'Vientiane', lat: 17.9750, lng: 102.6810, name: 'Mittaphab (Friendship) Hospital', tier: 'public', tags: ['er', 'trauma'], note: 'The capital’s trauma hospital — where road-accident cases are taken.' },
  { cc: 'la', prov: 'Luang Prabang', city: 'Luang Prabang', lat: 19.8790, lng: 102.1470, name: 'Luang Prabang Provincial Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'Basic care. Serious cases go to Vientiane or across to Thailand.' },
  { cc: 'la', prov: 'Vientiane', city: 'Vang Vieng', lat: 18.9230, lng: 102.4470, name: 'Vang Vieng District Hospital', tier: 'district', tags: ['er'], note: 'The hospital for the town’s tubing, caving and climbing injuries. Anything major is about 4 hours to Vientiane by road.' },
  { cc: 'la', prov: 'Savannakhet', city: 'Savannakhet', lat: 16.5560, lng: 104.7530, name: 'Savannakhet Provincial Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'Mukdahan in Thailand is across the bridge and is often the better destination.' },
  { cc: 'la', prov: 'Champasak', city: 'Pakse', lat: 15.1200, lng: 105.7990, name: 'Champasak Provincial Hospital', tier: 'public', tags: ['er', 'maternity'], note: 'Serves Pakse, the Bolaven Plateau and the 4000 Islands. Ubon Ratchathani in Thailand is the usual onward referral.' },
  { cc: 'la', prov: 'Khammouane', city: 'Thakhek', lat: 17.4100, lng: 104.8180, name: 'Khammouane Provincial Hospital', tier: 'public', tags: ['er'], note: 'The hospital for the Thakhek Loop. Nakhon Phanom in Thailand is across the bridge.' },
  { cc: 'la', prov: 'Luang Namtha', city: 'Luang Namtha', lat: 20.9490, lng: 101.4090, name: 'Luang Namtha Provincial Hospital', tier: 'public', tags: ['er'], note: 'The far north-west. Trekking injuries are stabilised here; anything major is a long transfer.' },
  { cc: 'la', prov: 'Bokeo', city: 'Huay Xai', lat: 20.2790, lng: 100.4130, name: 'Bokeo Provincial Hospital', tier: 'public', tags: ['er'], note: 'At the slow-boat start and the Thai border — Chiang Rai is close on the Thai side.' },
  { cc: 'la', prov: 'Oudomxay', city: 'Muang Xay', lat: 20.6920, lng: 101.9840, name: 'Oudomxay Provincial Hospital', tier: 'public', tags: ['er'] },
  { cc: 'la', prov: 'Xiangkhouang', city: 'Phonsavan', lat: 19.4530, lng: 103.1900, name: 'Xiangkhouang Provincial Hospital', tier: 'public', tags: ['er'], note: 'The hospital for the Plain of Jars.' },
  { cc: 'la', prov: 'Attapeu', city: 'Attapeu', lat: 14.8130, lng: 106.8320, name: 'Attapeu Provincial Hospital', tier: 'public', tags: ['er'] },
];

// ---- REACHING CARE FROM ANYWHERE -------------------------------------------
// The listed hospitals above cover the places travellers actually go. This block covers
// everywhere else — the village, the pass, the island, the bus. It states what each
// country's health system structurally provides at each administrative level (a fact
// about how the system is organised, not a claim about a specific building), the local
// word to say or to type into a map, and the honest reality of getting an ambulance.
export const CARE_SYSTEM = {
  th: {
    hospitalWord: { script: 'โรงพยาบาล', roman: 'rohng pá-yaa-baan' },
    erWord: { script: 'ห้องฉุกเฉิน', roman: 'hông chùk-chěrn' },
    levels: [
      'Every one of Thailand’s 77 provinces has a government provincial hospital in its capital district, and most run a 24-hour emergency room.',
      'Every district (amphoe) has a community hospital — typically 30–120 beds, with a doctor on call day and night.',
      'Every sub-district has a health-promoting hospital: a nurse-led clinic for first aid, wound care and common illness, which arranges onward transfer.',
    ],
    ambulance: 'Thailand has the region’s strongest emergency medical service. The national number reaches a dispatcher who sends the nearest ambulance, and in Bangkok charitable foundation ambulances respond as well. Response is quick in cities and on main highways, slower on mountain and island roads.',
    payment: 'A government hospital will treat an emergency first and bill afterwards, usually at modest cost. Private and international hospitals normally want a card, cash or an insurer’s guarantee of payment before non-urgent treatment.',
    pharmacy: 'Pharmacies are everywhere and pharmacists are well trained. Many medicines that need a prescription at home are sold over the counter, and a pharmacist is a sensible first stop for a minor problem.',
  },
  vi: {
    hospitalWord: { script: 'bệnh viện', roman: 'benh vee-en' },
    erWord: { script: 'cấp cứu', roman: 'cap kuu' },
    levels: [
      'Every province and centrally governed city has a provincial general hospital (bệnh viện đa khoa tỉnh) with a 24-hour emergency department.',
      'Every district has a district hospital or medical centre able to stabilise and refer.',
      'Every commune has a health station for first aid and common illness.',
    ],
    ambulance: 'A national ambulance number exists, but response times vary widely and city traffic often defeats it. In Hanoi, Ho Chi Minh City and Da Nang the international hospitals and clinics run their own ambulances and are frequently faster — and in dense traffic a taxi or ride-hailing car can beat both.',
    payment: 'Public hospitals charge foreigners directly, usually in cash and usually far less than a private hospital. International hospitals expect a card or an insurer’s guarantee of payment, and may ask for a deposit before admission.',
    pharmacy: 'Pharmacies (nhà thuốc) are common and cheap. Bring the generic name of anything you take regularly, because brand names differ.',
  },
  kh: {
    hospitalWord: { script: 'មន្ទីរពេទ្យ', roman: 'mon-tii pet' },
    erWord: { script: 'សង្គ្រោះបន្ទាន់', roman: 'sang-kruoh bon-toan' },
    levels: [
      'Every province has a provincial referral hospital in its capital, and the larger ones run a 24-hour emergency service.',
      'Districts have referral hospitals or health centres of varying capability — some perform surgery, many do not.',
      'Commune health centres handle first aid, common illness and maternity, and refer anything else.',
    ],
    ambulance: 'Ambulance cover outside Phnom Penh is thin and can be slow or absent. In practice most people reach hospital by car, tuk-tuk or private ambulance arranged by a hotel or clinic. If someone can be moved safely, going to the hospital is usually faster than waiting for one to come.',
    payment: 'Cambodia is largely a cash-first health system. Private and international hospitals ask for payment or an insurer’s guarantee up front, and card acceptance is not guaranteed. Carry enough cash to start treatment.',
    pharmacy: 'Stick to established pharmacy chains in the cities. Counterfeit and poorly stored medicine is a genuine problem in small shops, particularly for antibiotics and antimalarials.',
  },
  la: {
    hospitalWord: { script: 'ໂຮງໝໍ', roman: 'hohng mŏr' },
    erWord: { script: 'ຫ້ອງສຸກເສີນ', roman: 'hông sùk-sěrn' },
    levels: [
      'Every province has a provincial hospital in its capital; five of them are designated regional hospitals with wider capability.',
      'Districts have district hospitals, many of them small and without a surgeon on site.',
      'Village health centres provide first aid and basic medicine only.',
    ],
    ambulance: 'Laos has the most limited emergency medical service in the region. Vientiane has an ambulance service; most provinces effectively do not. Assume you will need a private vehicle, and ask your accommodation to arrange one rather than waiting.',
    payment: 'Cash, in kip or Thai baht, is the working assumption everywhere. Even the international centre in Vientiane will want payment or a written guarantee from your insurer before major treatment.',
    pharmacy: 'Pharmacy stock is limited outside Vientiane and Luang Prabang, and quality is inconsistent. Bring a full supply of anything you depend on, in its original packaging with the prescription.',
  },
};

// Where a serious case actually goes when the local hospital cannot treat it. These are
// the referral and evacuation chains embassies, insurers and expat clinics really use —
// and for Laos and rural Cambodia, the chain crosses a border. Knowing the destination
// before you need it is what turns a panicked afternoon into a phone call.
export const EVAC = {
  th: [
    { from: 'Anywhere in Thailand', to: 'Bangkok', how: 'Road, or a domestic flight from any provincial airport. Thailand can treat almost anything domestically — leaving the country is rarely necessary.' },
    { from: 'The gulf islands (Samui, Phangan, Tao)', to: 'Koh Samui, then Bangkok', how: 'Boat or air transfer. Sea state and the last ferry govern the timetable, so start the conversation early rather than at nightfall.' },
    { from: 'Andaman islands (Phi Phi, Lanta, Lipe)', to: 'Krabi or Phuket', how: 'Speedboat, then road. Phuket has the region’s best trauma and hyperbaric care.' },
    { from: 'The far north (Pai, Mae Hong Son)', to: 'Chiang Mai', how: 'Road, roughly 3–6 hours of mountain driving, or the short Mae Hong Son–Chiang Mai flight.' },
  ],
  vi: [
    { from: 'Anywhere in Vietnam', to: 'Hanoi or Ho Chi Minh City', how: 'Domestic flight or road. Both cities have international hospitals that accept transfers.' },
    { from: 'Central Vietnam (Hoi An, Hue, the highlands)', to: 'Da Nang', how: 'Road. Da Nang has the region’s largest emergency department and an international hospital.' },
    { from: 'The far north (Sapa, Ha Giang)', to: 'Lao Cai, then Hanoi', how: 'Road down the mountain, then the expressway — allow the better part of a day from the Ha Giang passes.' },
    { from: 'Islands (Phu Quoc, Con Dao, Cat Ba)', to: 'The mainland', how: 'Flight or boat. Weather closes both; a serious case may need an air ambulance to Ho Chi Minh City or Bangkok.' },
  ],
  kh: [
    { from: 'Anywhere in Cambodia', to: 'Phnom Penh', how: 'Road or domestic flight. Complex cases are then flown onward.' },
    { from: 'Phnom Penh or Siem Reap', to: 'Bangkok or Singapore', how: 'Commercial flight with an escort, or an air ambulance arranged by your insurer. This is the standard path for major trauma, cardiac events and anything needing intensive care — Bangkok is roughly an hour in the air.' },
    { from: 'The islands (Koh Rong, Koh Rong Sanloem)', to: 'Sihanoukville', how: 'Ferry or a chartered speedboat. Boats stop after dark and in rough seas, which is the real constraint.' },
  ],
  la: [
    { from: 'Vientiane', to: 'Udon Thani, Thailand', how: 'Road across the Friendship Bridge, about an hour to Aek Udon International Hospital. This is the standard evacuation route and the reason to keep your passport reachable. Insurers arrange it routinely.' },
    { from: 'Savannakhet', to: 'Mukdahan, Thailand', how: 'Across the second Friendship Bridge — minutes, not hours.' },
    { from: 'Thakhek', to: 'Nakhon Phanom, Thailand', how: 'Across the third Friendship Bridge.' },
    { from: 'Pakse and the south', to: 'Ubon Ratchathani, Thailand', how: 'Road via the Chong Mek crossing, roughly 2–3 hours.' },
    { from: 'Huay Xai and the north-west', to: 'Chiang Rai, Thailand', how: 'Across the fourth Friendship Bridge, then about 2 hours by road.' },
    { from: 'Luang Prabang and the north', to: 'Vientiane, then Thailand or Bangkok', how: 'Domestic flight, then onward. Overland from the northern provinces is slow and mountainous — a flight is usually the right call.' },
  ],
};

// The sequence that works from anywhere, with or without a signal, in the order it should
// actually be done. Rendered as the spine of the "get to a hospital" screen.
export const REACH_STEPS = [
  { ic: '📞', t: 'Call the national emergency number', d: 'It is free from any phone, works with no credit and usually with no SIM at all. Say your country, town and what has happened. If nobody answers in English, keep the line open and hand the phone to a local — a hotel receptionist, a shopkeeper, a driver.' },
  { ic: '🪧', t: 'If you cannot speak the language, show it', d: 'Open the emergency phrase card below and hold the screen up. It works with no signal and no battery-hungry translation. One sentence in the local script gets you a driver, a hospital or an ambulance.' },
  { ic: '🚗', t: 'Do not wait for an ambulance if you can move safely', d: 'Outside Thailand’s cities an ambulance may be slow or unavailable. If the person can be moved without making things worse, a taxi, a ride-hailing car, a hotel car or a tuk-tuk is usually faster. Do not move anyone with a suspected neck or back injury.' },
  { ic: '🏥', t: 'Go to the biggest hospital you can reach, not the closest', d: 'For a serious injury, a heart attack or a stroke, a provincial or international hospital thirty minutes away beats a village clinic five minutes away. For anything minor, the opposite is true.' },
  { ic: '📄', t: 'Bring your passport, insurance details and cash', d: 'Private hospitals ask for payment or an insurer’s guarantee before treatment. Show a passport copy rather than surrendering the original. Fill in the medical card on this screen now, while nothing is wrong.' },
  { ic: '☎️', t: 'Ring your insurer’s assistance line early', d: 'Ideally before admission. They can send a guarantee of payment straight to the hospital, approve a transfer, and tell you which hospital they will actually cover. Calling afterwards can turn a covered claim into a disputed one.' },
];

// What to do when the honest answer is "there is no hospital near you".
export const REMOTE_PLAN = [
  'Work out where you are precisely — a screenshot of the map with your pin, or the coordinates from this app — before you make any call. It is the first thing a dispatcher asks and the hardest thing to describe on a mountain road.',
  'Ask your accommodation, guide or driver to make the call. They know the local road, the local hospital and the person who owns a vehicle, and they can speak to a dispatcher who may not speak English.',
  'Send someone to the nearest village health centre even if it is small. Staff there can give first aid, oxygen in some places, and — crucially — can arrange the referral and telephone ahead.',
  'Treat time as the resource. In the highlands of Laos, the Ha Giang loop, Mondulkiri or Mae Hong Son, the journey to real care is measured in hours. Start moving toward it while you are still deciding.',
  'If you are on an island, check the last boat and the sea state immediately. A crossing that is routine at noon may be impossible at ten at night, and that single fact often decides whether to leave now.',
  'If diving is involved, say so on the first call and ask for the nearest recompression chamber. Do not go to the nearest hospital by default — the right destination may be further away.',
];

export const MED_SOURCES = [
  { org: 'OpenStreetMap contributors (every mapped hospital and clinic, ODbL)', url: 'https://www.openstreetmap.org/copyright' },
  { org: 'World Health Organization — country health system profiles', url: 'https://www.who.int/countries' },
  { org: 'Joint Commission International (hospital accreditation)', url: 'https://www.jointcommissioninternational.org' },
  { org: 'Thailand National Institute for Emergency Medicine', url: 'https://www.niems.go.th' },
  { org: 'UK Foreign, Commonwealth & Development Office — travel advice, health', url: 'https://www.gov.uk/foreign-travel-advice' },
  { org: 'US State Department — country information, medical facilities', url: 'https://travel.state.gov' },
  { org: 'Divers Alert Network Asia-Pacific (recompression chambers)', url: 'https://www.danap.org' },
];

// ---- WHAT TO DO WHEN IT IS NOT A MEDICAL EMERGENCY --------------------------
// The SOS screen used to cover exactly one kind of trouble: something bit you. These are
// the rest — ranked, roughly, by how often they actually happen to travellers here, which
// is not the order people expect. Road traffic injury is the leading cause of death for
// foreign travellers in this region by a wide margin; snakes are nowhere near the top.
//
// Each entry is written to be read in a hurry: `now` is the next sixty seconds, `then` is
// the next few hours, `avoid` is the thing people reliably get wrong. Nothing here is legal
// or medical advice, and nothing replaces the national emergency number.
export const EMERGENCIES = [
  {
    id: 'crash', ic: '🛵', t: 'Road or scooter accident',
    lead: 'By far the most likely serious emergency a traveller faces in this region.',
    now: [
      'Get out of the traffic lane before anything else. Being hit a second time is a real risk on a fast road, and it is what turns a survivable crash into a fatal one.',
      'Call the national emergency number. Say the road, the direction of travel and the nearest landmark or kilometre marker — a screenshot of your map pin is the fastest way to answer "where are you?".',
      'Do not move anyone who has hit their head or complains of neck or back pain, unless leaving them is more dangerous than moving them.',
      'Control heavy bleeding with firm, continuous pressure through whatever cloth you have. Keep pressing; do not lift to check.',
    ],
    then: [
      'Go to hospital even if you feel fine. Head injuries and internal bleeding declare themselves hours later, and road rash here infects fast in the heat.',
      'Get a police report. Without one, most travel insurance and every vehicle claim is disputed. Ask for the report number before you leave.',
      'Photograph everything at the scene: both vehicles, the road, the position, any licence and registration, and the other rider. Photographs settle later arguments that memory cannot.',
      'Tell your insurer the same day. Many policies exclude motorcycle injury unless you hold a licence valid for that engine size and were wearing a helmet — know which before you rent, not after you crash.',
    ],
    avoid: [
      'Do not hand over your passport as security to a rental shop, a hospital or anyone at the scene. Offer a photocopy or a deposit instead — a withheld passport is the standard lever in a rental dispute.',
      'Do not agree a cash settlement at the roadside before you know the extent of your own injuries.',
    ],
  },
  {
    id: 'spiking', ic: '🥃', t: 'Drink spiking & methanol poisoning',
    lead: 'Rare but not hypothetical — and methanol poisoning is survivable only if it is recognised early.',
    now: [
      'Treat sudden severe drunkenness that does not match how much was drunk as an emergency, especially after free shots, mixed spirits or home-made liquor.',
      'Methanol poisoning classically appears 6–30 hours after drinking, not immediately: blurred or snowy vision, severe stomach pain, breathlessness, confusion. Any vision change after drinking spirits is a hospital emergency that night, not in the morning.',
      'Get the person to the largest hospital you can reach and say the words "possible methanol poisoning". Treatment exists and works; delay is what kills.',
      'If someone is unconscious but breathing, put them on their side so they cannot choke, and stay with them.',
    ],
    then: [
      'Keep the bottle, the glass or the receipt if you safely can — it helps the hospital and any investigation.',
      'Report it to the tourist police and to your embassy. Clusters are how these venues get shut.',
    ],
    avoid: [
      'Do not let anyone "sleep it off" alone in a room. Almost every death in a spiking or methanol cluster involves someone left to sleep.',
      'Do not accept drinks from a shared jug or a bucket you did not watch being poured, and do not leave a drink unattended.',
    ],
  },
  {
    id: 'passport', ic: '🛂', t: 'Lost or stolen passport',
    lead: 'Recoverable, but the order of the steps decides whether it takes two days or two weeks.',
    now: [
      'Report it to the local police and get a written report with a reference number. Every embassy asks for it, and so does your insurer.',
      'Contact your embassy or consulate — the nearest one is usually in Bangkok, Hanoi, Ho Chi Minh City or Phnom Penh, and many countries have none at all in Laos.',
      'If your visa or entry stamp was in it, immigration will need to reissue the record before you can leave the country. Start that on the same day.',
    ],
    then: [
      'Ask for an emergency travel document if you have a flight soon; a full replacement passport takes longer and may have to be issued from a regional hub.',
      'Cancel and replace any cards that went with it, and change the passwords for anything that was unlocked on a stolen phone.',
    ],
    avoid: [
      'Do not leave the country by land while the entry record is unresolved — an unmatched entry stamp turns a lost passport into an immigration problem.',
      'Do not rely on the photocopy alone. Keep a photograph of the data page and the entry stamp somewhere you can reach without your phone.',
    ],
  },
  {
    id: 'theft', ic: '🎒', t: 'Robbery, theft or assault',
    lead: 'Snatch theft from a moving motorbike is the common version, and it injures people because they hold on.',
    now: [
      'Let it go. A bag is replaceable; being dragged along a road is how snatch theft causes serious injury and death.',
      'If you are hurt, treat that first and go to hospital — the report can be made afterwards.',
      'Report it to the tourist police where there is a tourist police unit; they usually have English speakers and handle traveller cases directly.',
    ],
    then: [
      'Freeze cards immediately and check for transactions — card cloning at ATMs is common in this region.',
      'Get the written police report for your insurer; a verbal report is not enough for a claim.',
      'Tell your embassy if a passport, a visa or your safety is involved.',
    ],
    avoid: [
      'Do not chase anyone, and do not confront a group.',
      'Do not carry your only card, your only phone and your passport in the same bag.',
    ],
  },
  {
    id: 'arrest', ic: '⚖️', t: 'Arrested or detained',
    lead: 'Drug offences carry severe penalties across all four countries, including sentences travellers do not expect.',
    now: [
      'Ask immediately, clearly and repeatedly to contact your embassy. You are entitled to consular access; the request is what triggers it.',
      'Do not sign anything you cannot read, and say so plainly. Ask for a translated copy and for a lawyer.',
      'Stay calm and polite. Argument and raised voices make everything that follows harder.',
    ],
    then: [
      'The embassy can supply a list of local lawyers, contact your family and monitor your treatment.',
      'Arrange money through family or your insurer rather than through anyone who approaches you at the station.',
    ],
    avoid: [
      'Do not offer money to a police officer. In a genuine arrest it converts a bad situation into a far worse one.',
      'Do not assume a substance is legal because it is sold openly to tourists — cannabis law in Thailand has changed more than once and differs completely in the other three countries.',
    ],
  },
  {
    id: 'water', ic: '🌊', t: 'In trouble in the water',
    lead: 'Drowning is the second leading cause of traveller death here, and rip currents cause most of it.',
    now: [
      'Caught in a rip: do not swim against it. Float, signal, and swim parallel to the beach until the pull stops, then come in at an angle.',
      'Helping someone else: throw them something that floats and call for help. Swimming out to a panicking person is how one drowning becomes two.',
      'Out of the water and not breathing: start chest compressions immediately — hard and fast in the centre of the chest, about twice a second — and send someone for an ambulance.',
    ],
    then: [
      'Anyone who has been under the water needs hospital assessment even if they seem fine afterwards.',
      'For a jellyfish sting, flood the area with vinegar for at least thirty seconds and treat any breathing difficulty as an emergency. Box jellyfish are present in the Gulf of Thailand and around the Cambodian coast.',
    ],
    avoid: [
      'Do not swim where a red flag is flying, and do not judge a beach by how calm it looks — rips are strongest where the water appears flattest.',
      'Do not drink and swim, and do not swim alone at night.',
    ],
  },
  {
    id: 'fever', ic: '🌡', t: 'High fever',
    lead: 'Dengue is the biggest infectious risk to travellers in this region, and it is seasonal rather than rare.',
    now: [
      'Any fever above 38 °C that lasts more than 24 hours needs a doctor and a blood test. Dengue, malaria and typhoid all start looking like flu.',
      'Take paracetamol for fever and pain — nothing else.',
      'Drink steadily. Dehydration is what turns a manageable dengue into an admission.',
    ],
    then: [
      'Warning signs that mean hospital now, not tomorrow: severe stomach pain, repeated vomiting, bleeding gums or nose, black stools, breathlessness, or a sudden drop in temperature with cold clammy skin.',
      'Malaria is a risk in forested border areas rather than the cities. Tell the doctor exactly where you have been in the last month.',
    ],
    avoid: [
      'Do not take ibuprofen, aspirin or any other anti-inflammatory until dengue has been ruled out — they increase bleeding risk.',
      'Do not buy antimalarials or antibiotics from a small shop; counterfeit medicine is a genuine problem outside established pharmacies.',
    ],
  },
  {
    id: 'gut', ic: '🚻', t: 'Severe stomach illness',
    lead: 'Common, usually self-limiting, and occasionally the thing that puts a traveller on a drip.',
    now: [
      'Rehydrate with oral rehydration salts, sold in every pharmacy in the region. Water alone does not replace what is being lost.',
      'Small sips, often, are better tolerated than a glass at a time.',
    ],
    then: [
      'See a doctor if there is blood in the stool, a fever above 38.5 °C, vomiting that stops you keeping fluids down, or symptoms lasting more than three days.',
      'A young child, an older traveller or anyone pregnant should be seen much sooner than that.',
    ],
    avoid: [
      'Do not take a stop-the-symptoms antidiarrhoeal if there is blood or a high fever — it can make the underlying infection worse.',
    ],
  },
  {
    id: 'hazard', ic: '⛈', t: 'Flood, storm, earthquake or tsunami',
    lead: 'The regional hazards are seasonal flooding, tropical storms, and — on the Andaman coast — tsunami.',
    now: [
      'Feel a strong earthquake on the coast, or see the sea suddenly draw back? Move inland and uphill immediately and do not wait for an official warning. On the Andaman coast, follow the blue tsunami evacuation signs.',
      'Flooding: never walk or drive through moving water. Thirty centimetres will float a car and knee-deep flow will take an adult off their feet. Flash floods in the northern gorges rise in minutes.',
      'Storm: get indoors and away from windows, trees and hoardings. Boat services stop for a reason — do not press a captain to sail.',
    ],
    then: [
      'Assume the water is contaminated after any flood, and treat every cut and graze that touched it.',
      'Register with your embassy’s travel service if one is available, so you can be contacted during a large event.',
    ],
    avoid: [
      'Do not rely on mobile coverage during a major event; agree a meeting point with anyone you are travelling with in advance.',
    ],
  },
  {
    id: 'fire', ic: '🔥', t: 'Fire in a hotel or hostel',
    lead: 'Older guesthouses across the region often have one staircase, barred windows and no working alarm.',
    now: [
      'Get out and stay out. Do not stop for luggage.',
      'Stay low under smoke, and feel a door with the back of your hand before opening it.',
      'If you cannot get out, close the door, block the gap with wet cloth, get to a window and make yourself visible.',
    ],
    then: [
      'Account for everyone you are travelling with at a point away from the building.',
    ],
    avoid: [
      'Do not use a lift. Check where the stairs are on the night you arrive — it takes ten seconds and it is the whole of fire safety in a strange building.',
    ],
  },
  {
    id: 'missing', ic: '🔍', t: 'Someone you are travelling with is missing',
    now: [
      'Report it to the police immediately. There is no waiting period, and the first hours matter most.',
      'Contact your embassy at the same time — they can press a case that a local station may otherwise treat as routine.',
      'Check the hospitals in the area as well as the police; someone brought in unconscious and without documents may not be identified for a while.',
    ],
    then: [
      'Gather a recent photograph, what they were wearing, their phone number and any location-sharing they had switched on.',
      'Ask their accommodation, their last known driver or boat operator, and the last place they were seen. Local businesses often know more than a station does.',
    ],
    avoid: [
      'Do not delay to "give it another day". The advice from every consular service is to report early and stand it down later if it was nothing.',
    ],
  },
  {
    id: 'mind', ic: '🫂', t: 'A mental health crisis',
    lead: 'Long trips, isolation, heat, drink and sleeplessness make this more common on the road than at home.',
    now: [
      'If someone is at immediate risk of harming themselves, do not leave them alone, and call the national emergency number.',
      'Get to a hospital emergency department; the larger private hospitals in Bangkok, Ho Chi Minh City, Hanoi and Phnom Penh have psychiatric services, most public provincial hospitals do not.',
      'Remove the immediate means of harm if you can do so safely.',
    ],
    then: [
      'Your travel insurer’s assistance line can arrange a psychiatric referral and, where needed, a medically escorted flight home.',
      'Your embassy can contact family and help with practical arrangements.',
      'Local mental health services are limited in Cambodia and Laos in particular; getting to a major city, or home, is often the realistic plan.',
    ],
    avoid: [
      'Do not treat "they have been drinking" as an explanation that makes it less urgent.',
    ],
  },
  {
    id: 'death', ic: '🕯', t: 'If a traveller dies',
    lead: 'The hardest page here, written down so nobody has to work it out while grieving.',
    now: [
      'Contact your embassy or consulate first. Repatriation, local registration of the death and the paperwork all run through them, and they will explain the order of it.',
      'Contact the travel insurer. Repatriation of remains is expensive and is the single most valuable thing a policy covers.',
    ],
    then: [
      'A local death certificate is issued by the authorities where the death occurred; the embassy can advise on getting it recognised at home.',
      'Do not agree to a cremation or a burial before speaking to the embassy and the family — in some countries it cannot be undone or reversed.',
    ],
    avoid: [],
  },
];

// What an embassy will and will not do. Travellers routinely expect the wrong things from
// consular services, which wastes the hours when the embassy could genuinely have helped.
export const EMBASSY = {
  can: [
    'Issue an emergency travel document or a replacement passport.',
    'Contact your family and help you get money sent to you.',
    'Visit you and monitor your treatment if you are arrested or detained.',
    'Give you a list of local lawyers, translators and doctors.',
    'Help in a death, a serious accident, or a large-scale emergency.',
    'Give you the current official travel and health advice for where you are.',
  ],
  cannot: [
    'Get you out of prison, or interfere in a local investigation or court case.',
    'Pay your medical bills, your legal costs or your fare home.',
    'Investigate a crime, or make the police act faster than local law allows.',
    'Give you legal or medical advice of its own.',
  ],
  note: 'Many countries have an embassy in Bangkok, Hanoi and Phnom Penh but none at all in Vientiane — in Laos your nearest consular help is often in Bangkok. Find yours, and save the address and the emergency line, before you need it.',
};
