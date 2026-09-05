// The CURATED hospital list — ~136 facilities chosen by hand, with the things no open dataset
// carries: capability tier, English-speaking staff, evacuation arrangements, and an honest note
// on what a place can and cannot treat.
//
// THIS MODULE IS DELIBERATELY EAGER. It is the offline fallback for the SOS hospital panel:
// js/main.js calls loadHospitals() for the full OpenStreetMap layer and catches a failure with
// "curated view stands" — so when a traveller is offline, or the lazy fetch fails, THIS list is
// what is left on an emergency screen. Making it load on demand would mean the one screen that
// has to work with no signal showing nothing at all.
//
// Split out of js/data/medical.js in mk-v0.490.0 so that the rest of that file — CARE_SYSTEM,
// EVAC, REACH_STEPS, REMOTE_PLAN, MED_SOURCES and the tier metadata, read only by
// js/screens/medical.js — could go lazy with its screen without dragging this along.
// If you are here to shrink the eager graph: this 30 KB is not the place. The measurement
// that matters is on an emergency screen with no connection.

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
