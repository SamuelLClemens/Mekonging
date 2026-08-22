// TRAVELLING WITH KIDS — per-country guidance for family travellers: international /
// bilingual schools (for families staying a term or relocating), daycare & childcare
// (drop-in and enrolment), and "what to do with the kids" (real, currently-operating
// family venues). Produced by a research + adversarial-verify workflow (WebSearch):
// every school, childcare centre and venue was confirmed to genuinely exist and operate,
// unverifiable entries and invented links were dropped, and welfare-problem animal
// attractions were excluded. EVERYTHING here is orientation only — schools, childcare and
// venues change their fees, hours and enrolment; families must confirm directly.
//
// Entry shapes:
//   intlSchools:   { name, city, curriculum?, ages?, feesNote?, url? }
//   childcare:     { name, city, kind, ages?, note, url? }
//   kidActivities: { name, city, kind, ages?, note, url? }
//   tips:          [ string ]
//   sources:       [ { org, url } ]

export const FAMILY = {
  "th": {
    "intro": "Thailand is one of the easiest places in the region to travel with children — well-stocked cities, strong international schools and pediatric hospitals, and plenty for kids to do.",
    "intlSchools": [
      {
        "name": "Bangkok Patana School",
        "city": "Bangkok",
        "curriculum": "British (English National Curriculum) + IB Diploma",
        "ages": "2-18",
        "feesNote": "Rough band THB 400k-850k per year; Thailand's oldest British international school (founded 1957), purpose-built Bang Na campus, over 2,300 pupils.",
        "url": "https://www.patana.ac.th/"
      },
      {
        "name": "St Andrews International School Sukhumvit 107",
        "city": "Bangkok",
        "curriculum": "British (English National Curriculum) + IB Diploma",
        "ages": "2-18",
        "feesNote": "Cognita-group British international school; sister St Andrews campuses at Sathorn (primary, ages 2-11) and Green Valley, Rayong. Rough band THB 400k-750k per year.",
        "url": "https://www.standrewssukhumvit.com/"
      },
      {
        "name": "Regent's International School Bangkok",
        "city": "Bangkok",
        "curriculum": "British + IB Diploma",
        "ages": "2-18",
        "feesNote": "Rough band THB 335k-635k per year; day and boarding (boarding from Year 4) on the Rama 9 campus; students from 50+ nationalities.",
        "url": "https://regents.ac.th/"
      },
      {
        "name": "Prem Tinsulanonda International School",
        "city": "Chiang Mai",
        "curriculum": "IB (PYP, MYP, DP and Career-related)",
        "ages": "3-19",
        "feesNote": "The only school in Thailand offering all four IB programmes; 100-acre day and boarding campus north of the city, roughly 500 pupils.",
        "url": "https://ptis.ac.th/"
      },
      {
        "name": "Grace International School",
        "city": "Chiang Mai",
        "curriculum": "American (faith-based, college-preparatory, with AP)",
        "ages": "5-18 (K-12)",
        "feesNote": "Large faith-based school (founded 1999) of 600+ pupils on a 37-acre campus; ACSI/WASC accredited.",
        "url": "https://gisthailand.org/"
      },
      {
        "name": "Panyaden International School",
        "city": "Chiang Mai",
        "curriculum": "Bilingual English-Thai; British framework + IB Diploma, Buddhist values",
        "ages": "2-18",
        "feesNote": "Sustainability-focused bilingual day school in Hang Dong (founded 2011); bamboo-and-earth campus, preschool through secondary.",
        "url": "https://www.panyaden.ac.th/"
      },
      {
        "name": "British International School Phuket (BISP)",
        "city": "Phuket",
        "curriculum": "British (IGCSE) + IB Diploma; day and boarding",
        "ages": "3-18",
        "feesNote": "Rough tuition band THB 550k-780k per year plus boarding; 44-acre Kathu campus, ~1,150 pupils from 60+ nationalities.",
        "url": "https://www.bisphuket.ac.th/"
      },
      {
        "name": "UWC Thailand",
        "city": "Phuket",
        "curriculum": "IB continuum (Early Years to Diploma), mindfulness programme",
        "ages": "2-18",
        "feesNote": "Non-profit IB continuum school with day and boarding; strong mindfulness and outdoor-education focus.",
        "url": "https://www.uwcthailand.ac.th/"
      },
      {
        "name": "Regents International School Pattaya",
        "city": "Pattaya",
        "curriculum": "British (A-Level) + IB Diploma in Sixth Form",
        "ages": "2-18",
        "feesNote": "Nord Anglia group (founded 1994); the only Eastern Seaboard school offering both A-Level and IBDP. Roughly 1,100 pupils from 50+ nationalities; boarding from age 8.",
        "url": "https://www.nordangliaeducation.com/risp-pattaya"
      },
      {
        "name": "Hua Hin International School (HHIS)",
        "city": "Hua Hin",
        "curriculum": "British (Cambridge IGCSE) + IB Diploma",
        "ages": "3-18",
        "feesNote": "Opened 2015; small class sizes, typically around 15 and capped near 20; authorised IB World School.",
        "url": "https://www.hhis.ac.th/"
      },
      {
        "name": "International School of Samui (ISS)",
        "city": "Koh Samui",
        "curriculum": "British (Cambridge IGCSE and A-Level)",
        "ages": "3-18",
        "feesNote": "Founded 2007 in Bophut; the island's established British-curriculum option, ~300 pupils from 35+ countries.",
        "url": "https://www.iss.ac.th/"
      }
    ],
    "childcare": [
      {
        "name": "Noddy by Elizabeth",
        "city": "Bangkok",
        "kind": "preschool",
        "ages": "18 months-6 years",
        "note": "British EYFS preschool in a quiet Sathorn (Yen Akat) cul-de-sac; offers dedicated short-term (3-6 month) enrolment, so it suits families in town for weeks or months rather than years.",
        "url": "https://www.noddybyelizabeth.com/"
      },
      {
        "name": "Sprouts International Kindergarten",
        "city": "Bangkok",
        "kind": "preschool",
        "ages": "1.5-5 years",
        "note": "Small bilingual kindergarten (German-kindergarten inspired, free-play model) on Sala Daeng Soi 1 near Lumpini Park, a short walk from BTS Sala Daeng and MRT Silom.",
        "url": "https://sprouts.co.th/"
      },
      {
        "name": "St Andrews International School Sathorn - Nursery",
        "city": "Bangkok",
        "kind": "nursery",
        "ages": "Toddler to early years",
        "note": "Well-regarded expat nursery in the Sathorn area running the British EYFS early-years curriculum; part of the St Andrews (Cognita) group.",
        "url": "https://www.standrewssathorn.com/british-international-nursery-sathorn-bangkok/"
      },
      {
        "name": "Storytime Preschool and Kindergarten",
        "city": "Bangkok",
        "kind": "preschool",
        "ages": "12 months-6 years",
        "note": "Long-running play-based preschool (over two decades) on Sukhumvit Soi 4 with a diverse international community; part-time and rolling enrolment available.",
        "url": "https://www.storytimepreschool.com/"
      },
      {
        "name": "Kids Kingdom International Kindergarten",
        "city": "Bangkok",
        "kind": "preschool",
        "ages": "18 months-6 years",
        "note": "Multicultural kindergarten on Sukhumvit Soi 47 (IPC curriculum); a 10-15 minute walk from BTS Phrom Phong or Thong Lor.",
        "url": "https://kidskingdom.ac.th/"
      },
      {
        "name": "Resort and hotel kids' clubs plus in-room babysitting",
        "city": "Phuket, Koh Samui, Hua Hin and Pattaya",
        "kind": "babysitting",
        "note": "In the beach resorts the practical short-stay option is the property's own supervised kids' club plus a vetted in-room nanny service (typically booked a day ahead via the concierge); rates are modest and staff are used to young children."
      }
    ],
    "kidActivities": [
      {
        "name": "SEA LIFE Bangkok Ocean World",
        "city": "Bangkok",
        "kind": "aquarium",
        "ages": "0-12",
        "note": "Large aquarium in the basement of Siam Paragon with a 270-degree glass ocean tunnel; sharks and rays glide overhead. Step straight off BTS Siam; stroller-friendly with ramps and lifts.",
        "url": "https://www.visitsealife.com/bangkok/"
      },
      {
        "name": "Children's Discovery Museum",
        "city": "Bangkok",
        "kind": "children's museum",
        "ages": "1-12",
        "note": "Free, hands-on discovery museum in Queen Sirikit Park by Chatuchak with age-zoned play; open Tue-Sun 10:00-16:00, bring photo ID. A short walk from BTS Mo Chit and MRT Chatuchak.",
        "url": "https://www.cdm-bangkok.com/"
      },
      {
        "name": "Dream World",
        "city": "Bangkok",
        "kind": "amusement park",
        "ages": "3-12",
        "note": "Classic rides, fairy-tale zones and an indoor Snow Town where children sledge on real snow, on the northern outskirts near Rangsit (about 45 minutes from central Bangkok)."
      },
      {
        "name": "HarborLand Indoor Playground",
        "city": "Bangkok, Chiang Mai and Phuket (major malls)",
        "kind": "playcentre",
        "ages": "1-12",
        "note": "Large air-conditioned indoor-playground chain (30+ locations nationwide, inside malls such as ICONSIAM, EmQuartier, Mega Bangna and Central branches): ball pits, giant slides and soft play, ideal for burning off energy during the midday heat."
      },
      {
        "name": "Elephant Nature Park",
        "city": "Chiang Mai",
        "kind": "ethical animal sanctuary",
        "ages": "4-12",
        "note": "Flagship no-riding, no-bathing, no-selfie rescue sanctuary (founded 1995) in the Mae Taeng valley where families prepare food and watch 75+ free-roaming rescued elephants; the gold standard for ethical elephant experiences.",
        "url": "https://www.elephantnaturepark.org/"
      },
      {
        "name": "Chiang Mai Night Safari",
        "city": "Chiang Mai",
        "kind": "night zoo",
        "ages": "3-12",
        "note": "Evening tram rides past deer, zebras and giraffes with a herbivore-feeding zone; a cooler after-dark alternative to a daytime zoo (open daily to 22:00)."
      },
      {
        "name": "Splash Jungle Water Park",
        "city": "Phuket",
        "kind": "water park",
        "ages": "0-12",
        "note": "Family water park at Mai Khao minutes from the airport with a wave pool, lazy river and dedicated toddler play zone.",
        "url": "https://www.splashjungle.com/"
      },
      {
        "name": "Andamanda Phuket",
        "city": "Phuket",
        "kind": "water park",
        "ages": "0-12",
        "note": "Large, modern Thai-mythology-themed water park in Kathu (9+ hectares, 25 attractions) with gentle kids' lagoons alongside bigger slides for the brave.",
        "url": "https://www.andamandaphuket.com/"
      },
      {
        "name": "Aquaria Phuket",
        "city": "Phuket",
        "kind": "aquarium",
        "ages": "0-12",
        "note": "Thailand's largest aquarium (opened 2019), inside Central Phuket Floresta, with a walk-through ocean tunnel and touch pools; a reliable rainy-day option.",
        "url": "https://www.aquaria-phuket.com/"
      },
      {
        "name": "Columbia Pictures Aquaverse (formerly Cartoon Network Amazone)",
        "city": "Pattaya",
        "kind": "water park",
        "ages": "3-12",
        "note": "Movie-IP-themed water park at Na Jomtien with the enormous Cartoonival splash playground for little ones; rebranded from Cartoon Network Amazone in 2022. Closed Wednesdays."
      },
      {
        "name": "Nong Nooch Tropical Garden",
        "city": "Pattaya",
        "kind": "botanical garden",
        "ages": "0-12",
        "note": "Sprawling landscaped gardens with a life-size Dinosaur Valley, topiary and a buggy tour; the garden and dino trails delight kids (skip the elephant/animal shows if ethics matter to you)."
      },
      {
        "name": "Underwater World Pattaya",
        "city": "Pattaya",
        "kind": "aquarium",
        "ages": "0-12",
        "note": "Walk-through 105-metre tunnel aquarium (Thailand's first modern aquarium, 2003) with sharks, giant freshwater stingrays and turtles; easy for short attention spans."
      },
      {
        "name": "Vana Nava Water Jungle",
        "city": "Hua Hin",
        "kind": "water park",
        "ages": "0-12",
        "note": "Jungle-themed water park with a shaded Kiddie Cove of interactive fountains and mini-slides for the smallest swimmers, plus bigger slides and a long lazy river.",
        "url": "https://www.vananavahuahin.com/"
      },
      {
        "name": "Paradise Park Farm",
        "city": "Koh Samui",
        "kind": "animal farm and park",
        "ages": "0-12",
        "note": "Mountain-top farm park in Taling Ngam with feedable goats, deer, ponies and other farm animals, a pool, playground and sweeping island views; free entry for children under 90cm."
      }
    ],
    "tips": [
      "Beat the heat: April and May are punishing (35C-plus with high humidity), so schedule outdoor activities for early morning or late afternoon, retreat to air-conditioned malls or the hotel around midday, and offer little ones water constantly. December to March is the most comfortable window for travelling with a baby.",
      "Car seats are legally required: a 2022 amendment to the Road Traffic Act mandates child restraints for young children (roughly under six) in private cars, with fines up to THB 2,000, yet metered taxis and most Grab cars do not provide one. Bring your own or a packable travel booster, request Grab's car-seat option where available, and always seat children in the rear.",
      "Strollers versus pavements: Bangkok and older-town footpaths are uneven, crowded and interrupted by high curbs and vendors, so a lightweight folding stroller or a baby carrier is far more practical than a bulky travel system. Malls and the BTS/MRT are stroller-friendly and major stations have lifts, though not every station does.",
      "Know your hospitals: for anything serious head to a private international hospital. In Bangkok, Samitivej Sukhumvit has a dedicated Children's Hospital with a 24-hour paediatric emergency unit, and Bumrungrad International is equally strong; regional options include Bangkok Hospital branches in Phuket, Chiang Mai, Hua Hin and Samui. Standards are high but payment or an insurance guarantee is usually needed upfront, so travel with family medical cover.",
      "Breastfeeding and changing: nursing in public is culturally accepted when done discreetly. Reliable nursing and baby-changing rooms cluster in the big malls (Siam Paragon, EmQuartier, Emporium, Central), while smaller venues rarely have them, so plan feeds and changes around mall stops and carry a cover if you prefer privacy.",
      "Family transport: the BTS Skytrain and MRT are clean, cheap, air-conditioned and skip the notorious traffic, with young children riding free below a height threshold. Use the Grab app for fixed-price private cars, avoid road journeys at rush hour, and skip tuk-tuks and motorbike taxis with small children as they carry no restraints.",
      "Night markets with kids: arrive early, around 5 to 7pm, before the crowds and heat peak. A carrier beats a stroller in tight lanes, and street food is a highlight if you choose busy high-turnover stalls, ask for 'mai phet' (not spicy), and carry wet wipes and hand gel. Watch for uneven ground and passing scooters.",
      "Tummy and bite safety: give children bottled water for drinking (and brushing if they are sensitive), stick to peeled fruit and busy stalls, and pack oral rehydration salts and a thermometer. Use child-safe insect repellent, since dengue is present, plus reef-safe sunscreen and hats.",
      "Beaches: favour calmer, patrolled bays and heed red-flag warnings. Rip currents are a real danger on Phuket's west coast during the May-to-October monsoon, and shade is limited, so bring a pop-up tent or umbrella and reapply sunscreen often.",
      "Taxis and Grab rarely have child car seats; if you need one, bring a travel seat or a wearable carrier for little ones.",
      "Malls are a parent’s friend: air-conditioning, clean changing rooms, play areas and familiar food when you need a reset."
    ],
    "sources": [
      {
        "org": "patana.ac.th",
        "url": "https://www.patana.ac.th/"
      },
      {
        "org": "en.wikipedia.org",
        "url": "https://en.wikipedia.org/wiki/Bangkok_Patana_School"
      },
      {
        "org": "standrewssukhumvit.com",
        "url": "https://www.standrewssukhumvit.com/"
      },
      {
        "org": "cognita.com",
        "url": "https://www.cognita.com/school/st-andrews-international-school-sukhumvit-107/"
      },
      {
        "org": "regents.ac.th",
        "url": "https://regents.ac.th/"
      },
      {
        "org": "ptis.ac.th",
        "url": "https://ptis.ac.th/"
      },
      {
        "org": "gisthailand.org",
        "url": "https://gisthailand.org/"
      },
      {
        "org": "panyaden.ac.th",
        "url": "https://www.panyaden.ac.th/"
      },
      {
        "org": "bisphuket.ac.th",
        "url": "https://www.bisphuket.ac.th/"
      },
      {
        "org": "uwcthailand.ac.th",
        "url": "https://www.uwcthailand.ac.th/"
      },
      {
        "org": "nordangliaeducation.com",
        "url": "https://www.nordangliaeducation.com/risp-pattaya"
      },
      {
        "org": "hhis.ac.th",
        "url": "https://www.hhis.ac.th/"
      }
    ],
    "asOf": "2026-07"
  },
  "vi": {
    "intro": "Vietnam’s big cities have strong international schools and huge theme and water parks; smaller towns are more limited, so stock up and plan pediatric care around Hanoi, Da Nang and Ho Chi Minh City.",
    "intlSchools": [
      {
        "name": "International School Ho Chi Minh City (ISHCMC)",
        "city": "Ho Chi Minh City",
        "curriculum": "IB (all three programmes: PYP, MYP, DP)",
        "ages": "2-18",
        "feesNote": "High-tier; publicly cited annual tuition roughly US$20,000-33,000 depending on grade",
        "url": "https://www.ishcmc.com"
      },
      {
        "name": "British International School Ho Chi Minh City (BIS HCMC)",
        "city": "Ho Chi Minh City",
        "curriculum": "British (English National Curriculum) leading to IGCSE and IB Diploma; Nord Anglia",
        "ages": "2-18",
        "feesNote": "High-tier; roughly US$18,000-32,000 per year by age band. One of the largest international schools in Vietnam; Thao Dien (District 2) campuses",
        "url": "https://www.nordangliaeducation.com/bis-hcmc"
      },
      {
        "name": "Saigon South International School (SSIS)",
        "city": "Ho Chi Minh City",
        "curriculum": "American, with Advanced Placement and IB Diploma in high school",
        "ages": "5-18 (K-12)",
        "feesNote": "High-tier; roughly US$20,000-33,000 per year. Not-for-profit; Phu My Hung (District 7)",
        "url": "https://www.ssis.edu.vn"
      },
      {
        "name": "Renaissance International School Saigon",
        "city": "Ho Chi Minh City",
        "curriculum": "British curriculum blended with IB, leading to IGCSE (Years 10-11) then IB Diploma (Years 12-13); IB World School",
        "ages": "2-18 (Early Years to Year 13)",
        "feesNote": "High-tier; roughly US$15,000-30,000 per year. District 7. CIS-accredited, FOBISIA member",
        "url": "https://renaissance.edu.vn"
      },
      {
        "name": "Australian International School (AIS)",
        "city": "Ho Chi Minh City",
        "curriculum": "IB PYP transitioning to Cambridge Lower Secondary and IGCSE, culminating in the IB Diploma",
        "ages": "1.5-18",
        "feesNote": "Mid-to-high tier. Three campuses across District 2 / Thu Duc: the Thu Thiem all-through school (with boarding for Years 7-13), a Thao Dien primary school, and Xi Kindergarten",
        "url": "https://www.aisvietnam.com"
      },
      {
        "name": "La Petite Ecole Ho Chi Minh",
        "city": "Ho Chi Minh City",
        "curriculum": "French, bilingual (French/English) programme; AEFE-partnered, French Ministry of Education accredited",
        "ages": "1-11 (nursery through primary)",
        "feesNote": "Mid-tier; French-system fees, typically below the big British/IB schools. Established 2017 in Thao Dien (District 2)",
        "url": "https://www.lpehochiminh.com"
      },
      {
        "name": "United Nations International School of Hanoi (UNIS Hanoi)",
        "city": "Hanoi",
        "curriculum": "IB (all three programmes)",
        "ages": "3-18",
        "feesNote": "High-tier; roughly US$20,000-33,000 per year. Not-for-profit, students from 60+ countries",
        "url": "https://www.unishanoi.org"
      },
      {
        "name": "British International School Hanoi (BIS Hanoi)",
        "city": "Hanoi",
        "curriculum": "British (EYFS + National Curriculum) leading to IGCSE and IB Diploma; Nord Anglia",
        "ages": "2-18",
        "feesNote": "High-tier; cited fees roughly VND 218M-810M (about US$9,000-32,000) by age. Vinhomes Riverside, Long Bien District",
        "url": "https://www.nordangliaeducation.com/bis-hanoi"
      },
      {
        "name": "Hoi An International School (HAIS)",
        "city": "Hoi An",
        "curriculum": "Cambridge (EYFS/Primary through IGCSE and A-Level), with a bilingual stream referencing the Vietnamese National Curriculum",
        "ages": "2-18",
        "feesNote": "Mid-tier bilingual/international fees. Small, close-knit community serving the Hoi An / Da Nang area",
        "url": "https://hais.edu.vn"
      },
      {
        "name": "Singapore International School @ Da Nang (SIS)",
        "city": "Da Nang",
        "curriculum": "International programme blending Singapore and Cambridge curricula (IGCSE / AS-A Level), plus an Integrated Vietnamese-international track",
        "ages": "1.5-18",
        "feesNote": "Mid-tier; separate International and Integrated fee levels. Phu My An, Ngu Hanh Son, Da Nang. Cambridge- and WASC-accredited",
        "url": "https://danang.sis.edu.vn"
      },
      {
        "name": "AVE Academy International School",
        "city": "Nha Trang",
        "curriculum": "Cambridge, English-immersion (Early Years through IGCSE); affiliated Kid Castle kindergarten",
        "ages": "2-18",
        "feesNote": "Mid-tier. Three campuses in the An Vien area, south of the city centre. Founded 2014",
        "url": "https://ave.edu.vn"
      }
    ],
    "childcare": [
      {
        "name": "Montessori International School of Vietnam (MIS)",
        "city": "Ho Chi Minh City",
        "kind": "preschool",
        "ages": "6 months - 6 years (lower elementary also available)",
        "note": "Vietnam's first and oldest Montessori school (est. 2007), American Montessori Society member, in Thao Dien (District 2); takes infants from 6 months (Nido class). Enrolment-based rather than drop-in",
        "url": "https://montessori.edu.vn"
      },
      {
        "name": "SmartKids International Kindergarten",
        "city": "Ho Chi Minh City",
        "kind": "preschool",
        "ages": "18 months - 6 years",
        "note": "Thao Dien (District 2) preschool blending Montessori, Steiner and Reggio Emilia approaches; child-centred, play-based, flexible part- or full-day programmes. A second campus (Tran Ngoc Dien) also operates in HCMC"
      },
      {
        "name": "Saigon Kids Early Learning Centre",
        "city": "Ho Chi Minh City",
        "kind": "preschool",
        "ages": "18 months - 6 years",
        "note": "One of HCMC's first international preschools (est. 1996), now in District 2; small, homely play-and-learn setting with up to ~35 nationalities. A gentler alternative to the large campus schools"
      },
      {
        "name": "ACACIA Hanoi (Tay Ho)",
        "city": "Hanoi",
        "kind": "nursery",
        "ages": "18 months - 6 years",
        "note": "AEFE-accredited, plurilingual (French/English/Vietnamese) nursery and preschool on To Ngoc Van Street in the expat-heavy Tay Ho district",
        "url": "https://acacia-education.com"
      },
      {
        "name": "Morning Star International School & Kindergarten (Tay Ho)",
        "city": "Hanoi",
        "kind": "preschool",
        "ages": "roughly 1.5 - 6 years (kindergarten; elementary also offered)",
        "note": "Long-established bilingual/international kindergarten and elementary school at Building C, 98 To Ngoc Van, Tay Ho; convenient for families around West Lake"
      },
      {
        "name": "Tao Babysitting Service (Nanny Da Nang)",
        "city": "Da Nang",
        "kind": "babysitting",
        "ages": "0 - 12 years",
        "note": "CPR/first-aid-certified, English-speaking sitters bookable 24/7 across Da Nang and Hoi An (also Hanoi); well suited to short-stay families needing an evening or day sitter",
        "url": "https://en.nannydanang.com"
      },
      {
        "name": "GiupChaMe (nanny / babysitter platform)",
        "city": "Hanoi",
        "kind": "babysitting",
        "ages": "0 - 12 years",
        "note": "Local booking platform for nannies and babysitters in Hanoi and HCMC, searchable by rate/experience/reviews; useful when you lack a community referral. Local-nanny rates are low (often only a couple of US dollars per hour); vet candidates yourself",
        "url": "https://giupchame.vn"
      }
    ],
    "kidActivities": [
      {
        "name": "Saigon Zoo and Botanical Gardens",
        "city": "Ho Chi Minh City",
        "kind": "zoo",
        "ages": "0-12",
        "note": "One of the world's oldest zoos (est. 1864) set in shady, stroller-friendly botanical gardens; an established public institution, not a tourist animal-selfie venue"
      },
      {
        "name": "Suoi Tien Theme Park",
        "city": "Ho Chi Minh City",
        "kind": "theme-park",
        "ages": "3-12",
        "note": "Boldly themed Buddhist-mythology fantasy park with dragon statues, a crocodile lake and a big splash zone; a full day out"
      },
      {
        "name": "Dam Sen Water Park",
        "city": "Ho Chi Minh City",
        "kind": "water-park",
        "ages": "2-12",
        "note": "Wave pool, lazy river and a dedicated shallow toddler splash area with mini slides for the little ones"
      },
      {
        "name": "tiNiWorld",
        "city": "Ho Chi Minh City",
        "kind": "indoor-play-centre",
        "ages": "0-10",
        "note": "Air-conditioned mall play centres with ball pits, soft play and rides; a reliable hot- or rainy-day reset. Note: many branches (all former Vincom-mall sites) have closed, so check the current location list (Aeon, Lotte, Thiso, Giga malls) before setting out"
      },
      {
        "name": "VinKE & Vinpearl Aquarium Times City",
        "city": "Hanoi",
        "kind": "aquarium",
        "ages": "0-12",
        "note": "One of Vietnam's largest aquariums (30,000+ creatures and a 90m shark/marine tunnel) on B1 of Times City, paired with the VinKE career role-play zone kids adore"
      },
      {
        "name": "Thu Le Park & Zoo",
        "city": "Hanoi",
        "kind": "zoo",
        "ages": "0-10",
        "note": "Central lakeside park and city zoo with pedal boats and shady paths; an easy, low-cost half-day with small children"
      },
      {
        "name": "Jump Arena (Hanoi)",
        "city": "Hanoi",
        "kind": "indoor-play-centre",
        "ages": "4-12",
        "note": "Indoor trampoline park with foam pits, dodgeball, climbing and a separate younger-children area to burn off energy; several branches in Hanoi"
      },
      {
        "name": "KizCiti Hanoi",
        "city": "Hanoi",
        "kind": "edutainment",
        "ages": "3-11",
        "note": "Role-play 'mini city' (Vincom Royal City) where children try grown-up jobs - pilot, firefighter, doctor, chef and more - earning play currency. Fun concept, though some areas look worn"
      },
      {
        "name": "Sun World Ba Na Hills",
        "city": "Da Nang",
        "kind": "theme-park",
        "ages": "4-12",
        "note": "Cable car to a cool mountaintop French village, the hand-held Golden Bridge and a large indoor Fantasy Park of rides and arcades"
      },
      {
        "name": "My Khe Beach",
        "city": "Da Nang",
        "kind": "beach",
        "ages": "0-12",
        "note": "Long stretch of soft sand with generally gentle waves and lifeguards, backed by cafes; the classic Da Nang family beach day"
      },
      {
        "name": "Helio Center",
        "city": "Da Nang",
        "kind": "indoor-play-centre",
        "ages": "2-12",
        "note": "Large indoor entertainment centre (Helio Kids/Play) with arcade games, bowling and a kids' zone, alongside a lively weekend night market and food court"
      },
      {
        "name": "VinWonders Nam Hoi An",
        "city": "Hoi An",
        "kind": "theme-park",
        "ages": "2-12",
        "note": "Water World slides, a boat-borne River Safari and a folk-culture village; free shuttle buses run from Hoi An and Da Nang"
      },
      {
        "name": "Hoi An lantern & craft workshops",
        "city": "Hoi An",
        "kind": "craft-workshop",
        "ages": "4-12",
        "note": "Hands-on lantern-making, pottery and floating a lantern on the river in the Old Town; gentle culture for small hands"
      },
      {
        "name": "VinWonders Nha Trang",
        "city": "Nha Trang",
        "kind": "theme-park",
        "ages": "2-12",
        "note": "Reached by a long over-water cable car to an island of water slides, an aquarium and family rides"
      }
    ],
    "tips": [
      "Heat and hydration: Vietnam is hot and humid with fierce midday UV. Keep infants out of the 11:00-15:00 sun, offer water constantly, apply high-SPF sunscreen, use hats, and schedule outdoor activities for early morning or late afternoon. Flushing and irritability are early heat-stress signs in little ones.",
      "Car seats are rarely provided in taxis or Grab cars, and traffic is dense and unpredictable. Bring your own seat or a travel booster, or pre-book a family transfer company that fits proper restraints. Do not assume a seat will be available on arrival.",
      "Strollers versus pavement: footpaths are uneven, high-curbed and frequently blocked by parked motorbikes and stalls, and many attractions are not step-free. A soft baby carrier, or at most a rugged umbrella stroller, is far more practical than a large travel system.",
      "Pediatric and international hospitals: for English-speaking care use Family Medical Practice (clinics in HCMC, Hanoi and Da Nang) and, in HCMC, JCI-accredited FV Hospital in District 7 with a pediatric department. Vinmec hospitals operate in HCMC, Hanoi, Da Nang, Nha Trang and elsewhere. Carry travel insurance that includes medical evacuation.",
      "Breastfeeding and changing facilities: Vietnam is very child-friendly and public breastfeeding is common, though a light cover is culturally appreciated. Dedicated baby-changing tables are scarce outside large malls and international hospitals, so carry a portable changing mat and hand sanitiser.",
      "Family-friendly transport: book Grab cars for fixed fares and air conditioning rather than hailing street taxis, and avoid putting small children on motorbike taxis. Domestic flights between HCMC, Da Nang and Hanoi spare young children long overnight journeys, though a daytime train segment can be a fun, spacious ride.",
      "Night markets with kids: arrive early (around 18:00) before the crowds, keep tiny children in a carrier above the crush, agree a meeting point with older kids, and be cautious introducing very spicy or unfamiliar street food to sensitive stomachs.",
      "Food and water safety: tap water is not potable, so use bottled or boiled water even for brushing infants' teeth. Favour busy stalls with high turnover serving freshly cooked hot food, pack oral rehydration salts, and keep reliable fussy-eater staples (rice, noodle soup, fruit, baguettes) in mind.",
      "Nannies and babysitting are normal and affordable in Vietnam. Local-nanny platform rates can be only a couple of US dollars an hour, while English-speaking, expat-oriented sitters cost more (commonly around 100,000 VND/hour and up). Expat families source trusted sitters through community Facebook groups and local agencies; a Tet (Lunar New Year) bonus of about one month's pay is customary for regular help.",
      "School enrolment timing: popular international schools keep waiting lists, so apply 6-12 months ahead. Most cluster in HCMC's District 2 (Thao Dien) and District 7, and in Hanoi's Tay Ho, Ciputra and Long Bien areas, which are also where expat families tend to live.",
      "Child car seats are rare in taxis and ride-hailing; bring your own if your child needs one."
    ],
    "sources": [
      {
        "org": "ishcmc.com",
        "url": "https://www.ishcmc.com"
      },
      {
        "org": "nordangliaeducation.com",
        "url": "https://www.nordangliaeducation.com/bis-hcmc"
      },
      {
        "org": "ssis.edu.vn",
        "url": "https://www.ssis.edu.vn"
      },
      {
        "org": "renaissance.edu.vn",
        "url": "https://renaissance.edu.vn"
      },
      {
        "org": "en.wikipedia.org",
        "url": "https://en.wikipedia.org/wiki/Renaissance_International_School_Saigon"
      },
      {
        "org": "aisvietnam.com",
        "url": "https://www.aisvietnam.com"
      },
      {
        "org": "lpehochiminh.com",
        "url": "https://www.lpehochiminh.com/en/"
      },
      {
        "org": "unishanoi.org",
        "url": "https://www.unishanoi.org"
      },
      {
        "org": "hais.edu.vn",
        "url": "https://hais.edu.vn/"
      },
      {
        "org": "danang.sis.edu.vn",
        "url": "https://danang.sis.edu.vn/"
      },
      {
        "org": "ave.edu.vn",
        "url": "https://ave.edu.vn/"
      },
      {
        "org": "montessori.edu.vn",
        "url": "https://montessori.edu.vn/"
      }
    ],
    "asOf": "2026-07"
  },
  "kh": {
    "intro": "Cambodia’s international schools and pediatric care concentrate in Phnom Penh and Siem Reap; travel with children is rewarding but rural facilities are basic, so plan medical cover and supplies around the two main cities.",
    "intlSchools": [
      {
        "name": "International School of Phnom Penh (ISPP)",
        "city": "Phnom Penh",
        "curriculum": "IB (PYP, MYP, Diploma); WASC & CIS accredited",
        "ages": "3 to 18 (Grade 12)",
        "feesNote": "Premium tier; annual tuition roughly USD 12,000-25,000 depending on grade (early years lower). Confirm current fees on the school site.",
        "url": "https://www.ispp.edu.kh/"
      },
      {
        "name": "Northbridge International School Cambodia (NISC)",
        "city": "Phnom Penh",
        "curriculum": "Full IB continuum (PYP/MYP/DP); Nord Anglia Education",
        "ages": "2 to 18",
        "feesNote": "Premium tier; indicatively ~USD 15,000-28,000/yr for upper grades, less for early years. Verify on site.",
        "url": "https://www.nordangliaeducation.com/nisc-cambodia"
      },
      {
        "name": "Shrewsbury International School Phnom Penh",
        "city": "Phnom Penh",
        "curriculum": "British (English National Curriculum)",
        "ages": "Early Years and Primary now; expands to Secondary (through Year 10 in the first cohort) at the new Sen Sok campus from September 2026",
        "feesNote": "Premium British-school tier; roughly USD 10,000-25,000/yr by stage. Newer school expanding to a large purpose-built Sen Sok campus (launched May 2026). Confirm on site.",
        "url": "https://shrewsbury.edu.kh/"
      },
      {
        "name": "Bromsgrove International School Cambodia (BISC)",
        "city": "Phnom Penh",
        "curriculum": "British (English National Curriculum, IGCSE, A-level / IB Diploma post-16)",
        "ages": "2 to 18",
        "feesNote": "Premium tier; purpose-built Sen Sok campus, part of the Bromsgrove UK family; welcomed its first students September 2025. Fees published on site; broadly ~USD 8,000-20,000/yr.",
        "url": "https://bisc.edu.kh/en/"
      },
      {
        "name": "Canadian International School of Phnom Penh (CIS)",
        "city": "Phnom Penh",
        "curriculum": "Alberta (Canadian) + IB (PYP & DP); bilingual French/Mandarin options",
        "ages": "Nursery to Grade 12",
        "feesNote": "Upper-mid tier; main campus on Koh Pich (Diamond Island) with early-years campuses at Bassac Garden and Olympia City. Alberta-accredited IB World School. Confirm fees on site.",
        "url": "https://www.cisp.edu.kh/"
      },
      {
        "name": "iCAN British International School",
        "city": "Phnom Penh",
        "curriculum": "British (International Primary Curriculum / National Curriculum for England)",
        "ages": "~1.5 to 14 (preschool through Year 9)",
        "feesNote": "Mid tier; smaller British school in Tonle Bassac with roughly 350 pupils and small class sizes. Primary/lower-secondary focused with no high school. Fees published on site.",
        "url": "https://www.ican.edu.kh/home"
      },
      {
        "name": "East-West International School (EWIS)",
        "city": "Phnom Penh",
        "curriculum": "Bilingual Khmer/English + Cambridge IGCSE, AS & A-level; WASC accredited",
        "ages": "Nursery to Grade 12",
        "feesNote": "Positioned as Phnom Penh's affordable bilingual international school (BKK3); established 2006 and among the lower-cost options (broadly ~USD 2,000-6,000/yr). Confirm on site.",
        "url": "https://ewiscambodia.edu.kh/"
      },
      {
        "name": "International School of Siem Reap (ISSR)",
        "city": "Siem Reap",
        "curriculum": "British / Cambridge (English National Curriculum, then IGCSE and A-level); optional Khmer dual track",
        "ages": "2 to 18 (300+ students, 20+ nationalities)",
        "feesNote": "Mid tier and the main established through-school in Siem Reap; book several months ahead. Fees on site.",
        "url": "https://issr.edu.kh/"
      },
      {
        "name": "Treehouse International School",
        "city": "Siem Reap",
        "curriculum": "British (EYFS then English National Curriculum)",
        "ages": "6 months (daycare) to 16",
        "feesNote": "Mid tier; small British-curriculum school across three central Siem Reap campuses that also runs daycare from 6 months, useful for younger expat families. Early-years fees roughly USD 1,700-3,000/yr; confirm on site.",
        "url": "https://siemreaptreehouse.com/"
      }
    ],
    "childcare": [
      {
        "name": "Kinderland Cambodia",
        "city": "Phnom Penh",
        "kind": "preschool",
        "ages": "12 months to 6 years",
        "note": "Singapore preschool brand (Crestar/Kinderland), two Phnom Penh centres in Toul Tom Poung and Toul Kork (the latter a new 2024 campus). Bilingual English/Mandarin with a strong music focus; playgroup through kindergarten. Structured, well-run and popular with expat families.",
        "url": "https://kinderlandcambodia.com/"
      },
      {
        "name": "Acacia Phnom Penh (Acacia Education)",
        "city": "Phnom Penh",
        "kind": "nursery",
        "ages": "18 months to 6 years",
        "note": "French/English/Khmer multilingual nursery and preschool a short walk from Independence Monument; secured AEFE accreditation for its French bilingual kindergarten in 2024. Good fit for francophone families or those wanting a multilingual early-years start.",
        "url": "https://acacia-education.com/phnom-penh-international-nursery-preschool/"
      },
      {
        "name": "Sambo's Tots Playhouse & Playschool",
        "city": "Phnom Penh",
        "kind": "playcentre",
        "ages": "3 months to 6 years",
        "note": "Combined indoor playhouse and playschool, licensed in Cambodia. Runs a parent-accompanied playgroup for the youngest (3 months-3 yrs) plus a drop-off preschool - handy for short-stay families wanting a play-based, low-commitment option. Open Mon-Fri and Saturday morning.",
        "url": "https://sambostots.net/"
      },
      {
        "name": "Treehouse International School (daycare)",
        "city": "Siem Reap",
        "kind": "daycare",
        "ages": "from 6 months",
        "note": "One of the few Siem Reap centres taking babies from 6 months; British EYFS-informed care that flows into their school, so useful for both short- and long-stay families in Siem Reap.",
        "url": "https://siemreaptreehouse.com/"
      }
    ],
    "kidActivities": [
      {
        "name": "Garden City Water Park",
        "city": "Phnom Penh",
        "kind": "waterpark",
        "ages": "0-12 (toddler splash to big slides)",
        "note": "One of the region's largest water parks (~40 min north of the city): a huge wave pool, lazy river, dedicated toddler play areas and 38+ WhiteWater/Polin slides - the go-to escape from Phnom Penh's heat.",
        "url": "https://gardencitywaterpark.com/"
      },
      {
        "name": "Kids City",
        "city": "Phnom Penh",
        "kind": "indoor-play",
        "ages": "1-15",
        "note": "Multi-storey indoor fun palace at 162A Preah Sihanouk Blvd: play zones for younger kids, a hands-on Science Discovery floor, plus a real-ice skating rink (ages 5+), laser tag, go-karts and climbing for bigger kids. Perfect for a hot or rainy afternoon."
      },
      {
        "name": "Kids Park (Aeon Malls)",
        "city": "Phnom Penh",
        "kind": "playcentre",
        "ages": "1-12",
        "note": "Air-conditioned soft-play centres inside Aeon Mall Phnom Penh and Aeon Sen Sok - ball pits, trampolines, slides, ziplines and climbing structures right by the food court and toilets. Socks required; open daily. Easy, safe, mall-based downtime."
      },
      {
        "name": "Phnom Tamao Wildlife Rescue Center",
        "city": "Phnom Penh",
        "kind": "animal-ethical",
        "ages": "3-12",
        "note": "Ethical rescue centre (~1 hr south) for confiscated sun bears, elephants, tigers and gibbons in large forest enclosures - run with Wildlife Alliance and partners like Free the Bears. Book the Behind-the-Scenes tour, whose profits directly fund the rescue work."
      },
      {
        "name": "Phare, The Cambodian Circus",
        "city": "Siem Reap",
        "kind": "circus-show",
        "ages": "all ages",
        "note": "Nightly hour-long show (8pm) where young Cambodian performers weave acrobatics, live music and storytelling - joyful, not scary, and kids can meet the artists afterwards. A cultural highlight the whole family remembers.",
        "url": "https://pharecircus.org/"
      },
      {
        "name": "Angkor Wildlife & Aquarium",
        "city": "Siem Reap",
        "kind": "aquarium",
        "ages": "0-12",
        "note": "A modern freshwater-and-saltwater aquarium plus wildlife park (~30-40 min from town) caring for rescued animals including Indochinese tigers, otters and endangered Siamese crocodiles, with air-conditioned conservation exhibits - a genuinely kid-pitched indoor day out beyond the temples.",
        "url": "https://angkorwildlife.com/"
      },
      {
        "name": "The Happy Ranch Horse Farm",
        "city": "Siem Reap",
        "kind": "farm-riding",
        "ages": "3-12",
        "note": "Gentle pony and horse trail rides (little ones led on a rope) through rice fields, villages and quiet countryside; horse-cart rides too, free for under-5s. Established 2002, calm and well-run - a lovely break from temple days.",
        "url": "https://www.thehappyranch.com/"
      },
      {
        "name": "Angkor National Museum",
        "city": "Siem Reap",
        "kind": "museum",
        "ages": "5-12",
        "note": "Cool, air-conditioned galleries (including a hall of 1,000 Buddhas) that give kids context before the temples - a smart heat-of-the-day stop to keep sightseeing from melting down."
      },
      {
        "name": "Kampong Phluk Floating Village (Tonle Sap)",
        "city": "Siem Reap",
        "kind": "boat-nature",
        "ages": "4-12",
        "note": "Boat cruise out to towering stilt houses and a paddle through the flooded forest - kids are wide-eyed at children rowing to school. Eye-opening, gentle adventure (bring life jackets for little ones)."
      },
      {
        "name": "Ta Prohm & Bayon temples (Angkor)",
        "city": "Siem Reap",
        "kind": "temple-culture",
        "ages": "all ages",
        "note": "The most kid-magnetic temples: Ta Prohm's jungle-swallowed 'Tomb Raider' ruins and Bayon's giant smiling stone faces. Go at opening to beat heat and crowds, and keep it to a half-day."
      },
      {
        "name": "Otres Beach",
        "city": "Sihanoukville",
        "kind": "beach",
        "ages": "0-12",
        "note": "The most family-friendly stretch near town - soft sand, gentle shallow water for little swimmers and shaded spots for parents, plus laid-back cafes for lunch. Calmer than the built-up centre."
      },
      {
        "name": "Splash Party Waterpark",
        "city": "Sihanoukville",
        "kind": "waterpark",
        "ages": "4-12 (with life jackets)",
        "note": "Floating inflatable aqua park just off Otres Beach 1 - trampolines, blobs, slides and zip lines, with life jackets included and staff on safety watch. Cheap (a few dollars) and easily an afternoon's fun."
      },
      {
        "name": "Ream National Park",
        "city": "Sihanoukville",
        "kind": "nature-park",
        "ages": "5-12",
        "note": "Easy day trip of mangrove-river boat rides, short jungle walks and a quiet beach lunch, with 150+ bird species in the park - a nature counterpoint to beach days. Go with a reputable operator."
      },
      {
        "name": "Koh Rong Sanloem (Saracen Bay)",
        "city": "Sihanoukville",
        "kind": "island-beach",
        "ages": "0-12",
        "note": "A short boat hop to calm, clear, shallow turquoise water and powder-white sand - about as safe and idyllic as paddling gets for young children. Day trip or overnight."
      },
      {
        "name": "Phare Ponleu Selpak circus",
        "city": "Battambang",
        "kind": "circus-show",
        "ages": "all ages",
        "note": "The original NGO circus and arts school that Siem Reap's Phare grew from - daytime campus tours show kids the art classes and rehearsals, and evening shows (Mon/Thu/Sat, 7pm) are world-class and heartfelt.",
        "url": "https://phareps.org/"
      },
      {
        "name": "Bamboo Train (norry) & Phnom Sampeau bat cave",
        "city": "Battambang",
        "kind": "outdoor-experience",
        "ages": "4-12",
        "note": "Ride the quirky improvised bamboo rail platform through rice fields, then at dusk watch a seemingly endless river of bats stream out of the Phnom Sampeau cave - a memorable, low-cost double bill."
      }
    ],
    "tips": [
      "Heat and hydration: Cambodia is hot and humid year-round and brutal in the March-May hot season (35C+). Give little ones plenty of water, schedule temples and outdoor activities for early morning or late afternoon, keep midday for the pool or air-conditioned malls, and pack high-SPF sunscreen, hats and oral rehydration sachets.",
      "Car seats and taxis: Car seats are effectively unavailable in taxis, tuk-tuks and most rentals - bring your own if you want one. The Grab and PassApp ride-hailing apps work well in Phnom Penh and Siem Reap for air-conditioned cars, and hiring a private car with driver is the safest, coolest way to do day trips.",
      "Strollers vs pavement: Footpaths are uneven, frequently blocked or missing, with high curbs and traffic - a stroller is a struggle outside malls and hotels. A baby carrier or sling is far more practical day to day; save the buggy for Aeon Mall, the airport and hotel grounds.",
      "Best hospitals for children: For serious care the strongest options are Royal Phnom Penh Hospital (Bangkok Hospital group) in the capital, Royal Angkor International Hospital in Siem Reap, and the respected non-profit Angkor Hospital for Children in Siem Reap. For anything major, medical evacuation to Bangkok is the regional norm - make sure travel insurance covers evacuation.",
      "Breastfeeding and changing: Breastfeeding in public is culturally accepted; a light nursing cover is respectful, especially at temples. Dedicated baby-changing tables are scarce outside modern malls (Aeon), international hotels and Western-style cafes, so carry a portable changing mat.",
      "Night markets with kids: Phnom Penh Night Market, Siem Reap's Angkor Night Market and the Pub Street area are fun - go early (around 6-7pm) before it gets crowded and loud, keep toddlers in a carrier, watch for uneven ground and scooters, and choose freshly-cooked, piping-hot street food.",
      "Food and water safety: Drink only bottled or filtered water (also for brushing teeth), skip ice from unknown sources, and favour busy stalls cooking to order. Travellers' tummy is common, so pack child rehydration salts and a basic first-aid kit.",
      "Mosquitoes and sun: Dengue is present, so use child-safe repellent, cover arms and legs at dusk, and use nets where provided. The tropical sun is strong even through cloud - reapply sunscreen and seek shade.",
      "Finding activities and sitters: CamboKidz (cambokidz.com) is a useful local directory of kids' activities, schools and events, and the Move to Cambodia guides are practical for Phnom Penh and Siem Reap. Larger international hotels can usually arrange vetted babysitting - book a day ahead.",
      "Tuk-tuks are the everyday family ride — fun and breezy, but there are no seatbelts, so hold young children securely.",
      "Bring nappies, formula and any specific medicines from a city supermarket before heading to rural provinces, where choice is limited."
    ],
    "sources": [
      {
        "org": "ispp.edu.kh",
        "url": "https://www.ispp.edu.kh/"
      },
      {
        "org": "nordangliaeducation.com",
        "url": "https://www.nordangliaeducation.com/nisc-cambodia"
      },
      {
        "org": "shrewsbury.edu.kh",
        "url": "https://shrewsbury.edu.kh/"
      },
      {
        "org": "bisc.edu.kh",
        "url": "https://bisc.edu.kh/en/"
      },
      {
        "org": "cisp.edu.kh",
        "url": "https://www.cisp.edu.kh/"
      },
      {
        "org": "ican.edu.kh",
        "url": "https://www.ican.edu.kh/home"
      },
      {
        "org": "ewiscambodia.edu.kh",
        "url": "https://ewiscambodia.edu.kh/"
      },
      {
        "org": "issr.edu.kh",
        "url": "https://issr.edu.kh/"
      },
      {
        "org": "siemreaptreehouse.com",
        "url": "https://siemreaptreehouse.com/"
      },
      {
        "org": "kinderlandcambodia.com",
        "url": "https://kinderlandcambodia.com/"
      },
      {
        "org": "acacia-education.com",
        "url": "https://acacia-education.com/phnom-penh-international-nursery-preschool/"
      },
      {
        "org": "sambostots.net",
        "url": "https://sambostots.net/"
      }
    ],
    "asOf": "2026-07"
  },
  "la": {
    "intro": "Laos is gentle and unhurried with children, but facilities are the most limited of the four countries — international schooling and pediatric care mean Vientiane, and you should stock up in the cities before remote travel.",
    "intlSchools": [
      {
        "name": "Vientiane International School (VIS)",
        "city": "Vientiane",
        "curriculum": "IB (English) — full PYP, MYP and Diploma; the only all-three IB World School in Laos",
        "ages": "3-18 (Early Years to Grade 12)",
        "feesNote": "Highest-fee school in Laos; roughly US$8,600-$20,400/yr, rising by grade. Established 1991; the only school in Laos accredited by WASC, CIS and the IB; roughly 480 students from about 37 nationalities.",
        "url": "https://www.vislao.com/"
      },
      {
        "name": "Lycee Francais International de Vientiane Josue-Hoffet (LFIV)",
        "city": "Vientiane",
        "curriculum": "French national curriculum (AEFE network), plus certified English, Lao, Spanish and Mandarin",
        "ages": "3-18 (maternelle through lycee)",
        "feesNote": "AEFE-network fees; generally well below VIS. Established 1986. Best fit for French-track or Francophone families. Secondary is on the Hadxaykhao campus, primary at Thadeua.",
        "url": "https://www.lyceehoffet.org/"
      },
      {
        "name": "Panyathip British International School (PBIS)",
        "city": "Vientiane",
        "curriculum": "British — Cambridge Primary/Checkpoint/IGCSE and the International Primary Curriculum (IPC); registered Cambridge exam centre",
        "ages": "~1.5-18 (Early Years, Primary, Secondary across several campuses)",
        "feesNote": "Mid-range British-stream fees, notably below VIS. The first school in Laos accredited for the Cambridge curriculum and the first to run the IPC; COBIS accredited.",
        "url": "https://www.pbis.edu.la/"
      },
      {
        "name": "Australian International School Laos (AIS)",
        "city": "Vientiane",
        "curriculum": "Australian NSW curriculum in Primary; Cambridge International in Secondary; Lao as an additional language",
        "ages": "~2-18 (Nursery/Kindergarten to Year 12)",
        "feesNote": "One of the more affordable international options in Vientiane; founded 2011.",
        "url": "https://www.aisedulaos.com/"
      },
      {
        "name": "Kiettisack International School (KIS)",
        "city": "Vientiane and Luang Prabang",
        "curriculum": "English-medium British stream (Cambridge, IGCSE / A-level) run in parallel with the Lao national curriculum",
        "ages": "2-18 (Nursery to Secondary)",
        "feesNote": "Affordable bilingual fees; among the lower-cost international choices. Founded 1992; the Luang Prabang campus (opened 2012) is a rare full international option outside the capital.",
        "url": "https://kiettisackinternational.com/"
      },
      {
        "name": "Ecole Francophone de Luang Prabang (EFLP)",
        "city": "Luang Prabang",
        "curriculum": "French national curriculum (French Ministry-approved kindergarten to CM2, plus lower-secondary/college to 3e), with Cambridge English/maths/arts and Lao language, geography and history",
        "ages": "~3-15 (maternelle to college)",
        "feesNote": "Founded 2014; the main Western-curriculum option in Luang Prabang for a term or relocation. Small, with families from about 10 nationalities.",
        "url": "https://www.ef-lp.org/"
      },
      {
        "name": "Phou Panya International School",
        "city": "Luang Prabang",
        "curriculum": "English-Lao bilingual",
        "ages": "~3-11 (Kindergarten to Year 6)",
        "feesNote": "Small local bilingual school (founded 2013) at Ban Sangkhalok; primary-only, so not for older children. Confirm current details via its Facebook page or phoupanyais.com before enrolling."
      },
      {
        "name": "International School of Laos (formerly Eastern Star Bilingual School)",
        "city": "Vientiane",
        "curriculum": "English-Lao bilingual; Cambridge International member",
        "ages": "~2-18 (Kindergarten to Secondary)",
        "feesNote": "Local private bilingual school founded 2006 as Eastern Star Bilingual School and renamed International School of Laos in 2016; budget-friendly and more Lao-integrated than the international schools above, with campuses in Vientiane (Nongbone) and Pakse. Verify current details directly before enrolling.",
        "url": "https://www.isl.edu.la/"
      }
    ],
    "childcare": [
      {
        "name": "Tukata Vientiane (Holistic Nursery & Kindergarten)",
        "city": "Vientiane",
        "kind": "nursery",
        "ages": "6 months to ~5 years",
        "note": "Nature-based, holistic nursery and kindergarten with lots of outdoor garden time, offering English, French and Lao. Takes infants from 6 months, unusually young for Laos; open Mon-Fri roughly 7:30am-5pm, full or half day. Good for long-stay families needing genuine early care, not just preschool.",
        "url": "https://www.tukata.org/"
      },
      {
        "name": "Santisouk Montessori Preschool",
        "city": "Vientiane",
        "kind": "preschool",
        "ages": "2-6 years",
        "note": "Oldest Montessori school in Laos (established 1993); small (~65 children), multicultural, non-profit, child-centred Montessori setting with music, dance, swimming and excursions. Full or half days, English with Lao. Enrolment-based rather than drop-in.",
        "url": "https://www.santisouk.org/"
      },
      {
        "name": "Kiettisack International School - Early Years / Nursery",
        "city": "Vientiane and Luang Prabang",
        "kind": "nursery",
        "ages": "from 2 years",
        "note": "The Early Years section of Kiettisack takes children from age 2 on both its Vientiane and Luang Prabang campuses - one of the few structured nursery options in Luang Prabang. Term enrolment, English with Lao.",
        "url": "https://kiettisackinternational.com/"
      },
      {
        "name": "In-home nanny / hotel-arranged babysitting (norms)",
        "city": "Vientiane, Luang Prabang, Vang Vieng",
        "kind": "babysitting",
        "note": "Formal drop-in daycare and creches are scarce outside Vientiane. The norm for short-stay families is a nanny (mae liang dek) arranged through your hotel/guesthouse or an expat word-of-mouth network; mid- and upper-range hotels and resorts in all three cities can usually arrange in-room babysitting on a day's notice. Agree hours and rate in advance and prefer someone the property vouches for."
      }
    ],
    "kidActivities": [
      {
        "name": "Ocean Park Vientiane (ITECC)",
        "city": "Vientiane",
        "kind": "water-park",
        "ages": "~3-12",
        "note": "Vientiane's proper water park - slides, wave pool, lazy river and a shallow kids' pool - the go-to midday heat-beater; cheap entry (about US$6 adult, US$2.50 child). Closed Tuesdays.",
        "url": "https://www.facebook.com/IteccOceanPark/"
      },
      {
        "name": "Buddha Park (Xieng Khuan)",
        "city": "Vientiane",
        "kind": "sculpture-park",
        "ages": "all ages",
        "note": "Surreal riverside field of 200+ giant Buddhist and Hindu statues, including a climbable pumpkin dome and a huge reclining Buddha - endless room for kids to run and explore."
      },
      {
        "name": "COPE Visitor Centre",
        "city": "Vientiane",
        "kind": "childrens-museum",
        "ages": "6-12",
        "note": "Free, genuinely hands-on museum where kids can handle prosthetic limbs and mobility aids while learning the UXO story of Laos; open daily ~8:30am-4pm, air-conditioned and moving, best for school-age children.",
        "url": "https://copelaos.org/visit-us/"
      },
      {
        "name": "Mekong Riverfront promenade & Night Market",
        "city": "Vientiane",
        "kind": "park",
        "ages": "all ages",
        "note": "Wide sunset promenade with playgrounds and free outdoor exercise gear where local families gather, rolling straight into the riverside night market and its food stalls."
      },
      {
        "name": "Patuxai Monument & park",
        "city": "Vientiane",
        "kind": "landmark",
        "ages": "all ages",
        "note": "Laos' 'Arc de Triomphe' with fountains and lawns below and a cheap climb to a breezy rooftop view over the city - a quick, easy win with kids."
      },
      {
        "name": "Kuang Si Falls",
        "city": "Luang Prabang",
        "kind": "waterfall-swimming",
        "ages": "all ages (supervise)",
        "note": "Tiered turquoise pools in the jungle with shallow spots for splashing and shady boardwalks - families happily lose a whole afternoon here."
      },
      {
        "name": "Free the Bears - Tat Kuang Si Bear Rescue Centre",
        "city": "Luang Prabang",
        "kind": "animal-sanctuary",
        "ages": "all ages",
        "note": "Rescued sun and moon bears (saved from bile farms and the wildlife trade) in forest enclosures right by the Kuang Si falls, included with the falls ticket; an optional pre-booked Bear Care Tour (min ~US$50 donation) lets you help prep food and enrichment.",
        "url": "https://freethebears.org/pages/bear-care-tour-laos"
      },
      {
        "name": "MandaLao Elephant Conservation",
        "city": "Luang Prabang",
        "kind": "ethical-animal-experience",
        "ages": "~4+",
        "note": "Luang Prabang's first strictly no-riding sanctuary (opened 2016), working with World Animal Protection - you walk alongside rescued elephants in small groups, no chains or hooks; the shorter afternoon tour suits children best.",
        "url": "https://mandalao.org/"
      },
      {
        "name": "The Living Land Farm",
        "city": "Luang Prabang",
        "kind": "kid-friendly-farm",
        "ages": "all ages",
        "note": "Community organic rice farm where kids plough with the water buffalo, plant, thresh and winnow rice across a 14-step tour, then eat what they helped make - hands-on and photogenic; half-day, pickup included.",
        "url": "https://livinglandlao.org/"
      },
      {
        "name": "Ock Pop Tok Living Crafts Centre",
        "city": "Luang Prabang",
        "kind": "craft-workshop",
        "ages": "5-12",
        "note": "Riverside textile centre with a family Textile Treasure Hunt plus short weaving, natural-dye, batik and bamboo classes; a free bright-pink tuk-tuk shuttles you from town and there is a free short tour of the weavers.",
        "url": "https://www.ockpoptok.com/"
      },
      {
        "name": "Traditional Arts & Ethnology Centre (TAEC)",
        "city": "Luang Prabang",
        "kind": "childrens-museum",
        "ages": "4-12",
        "note": "Small, well-labelled museum of Laos' ethnic cultures (open since 2006) with free entry for under-12s, a colouring/treasure-hunt activity and dress-up costumes, a short walk from the night market.",
        "url": "https://www.taeclaos.org/"
      },
      {
        "name": "Luang Prabang Night Market",
        "city": "Luang Prabang",
        "kind": "night-market",
        "ages": "all ages",
        "note": "Calm, handicraft-focused market (about 5-10pm) with a cheap food alley - go early with little ones for mild noodle and baguette options before the crowds."
      },
      {
        "name": "Mount Phousi",
        "city": "Luang Prabang",
        "kind": "viewpoint",
        "ages": "5-12",
        "note": "About 300 shaded temple steps to a hilltop sunset panorama over the Mekong and old town - a manageable adventure for school-age kids."
      },
      {
        "name": "Blue Lagoon 1 & Tham Phu Kham Cave",
        "city": "Vang Vieng",
        "kind": "swimming-hole",
        "ages": "~4-12",
        "note": "Bright-turquoise swimming spot about 7km from town with rope swings, shallow edges and shady picnic decks; a big Buddha cave (Tham Phu Kham) sits up a steep ~120m stairway above - the classic family day out in Vang Vieng. Bring/insist on life jackets for weaker swimmers."
      },
      {
        "name": "Above Laos - Vang Vieng hot-air balloon",
        "city": "Vang Vieng",
        "kind": "scenic-flight",
        "ages": "older kids/teens",
        "note": "A safety-focused Lao-French operator (since 2019; internationally certified pilots, maintained French balloons) drifting over karst peaks and rice fields; takes off away from town for a longer flight. A memorable splurge for confident older children.",
        "url": "https://abovelaos.com/en/"
      },
      {
        "name": "Nam Song River kayaking & tubing",
        "city": "Vang Vieng",
        "kind": "river-activity",
        "ages": "~6-12",
        "note": "Gentle guided kayaking or family tubing on the scenic Nam Song - insist on life jackets, a reputable operator and low-water season, and skip the old party-bar stretch."
      }
    ],
    "tips": [
      "Heat & hydration: the lowland cities (Vientiane, Vang Vieng) hit 35-40C+ in the March-May hot season. Do outdoor sights (Buddha Park, Kuang Si, temples) early morning or late afternoon and save midday for the water park, pools or air-conditioned museums (COPE, TAEC). Carry oral-rehydration-salt sachets (any pharmacy) and only give bottled/filtered water - tap water is not safe to drink.",
      "The train is your friend: the fast, air-conditioned Laos-China Railway links Vientiane, Vang Vieng and Luang Prabang in about an hour or two each and avoids the long, winding mountain roads that make kids car-sick. Book seats a few days ahead in peak season; it is by far the most family-comfortable intercity option.",
      "Car seats & strollers: taxis, tuk-tuks, songthaews, buses and the train do not provide child car seats - bring your own if you want one, and use a private car-with-driver for road transfers. Pavements are uneven, high-curbed and often blocked by stalls, so a sturdy baby carrier or all-terrain buggy works far better than a city stroller (Luang Prabang's flat old town is the exception).",
      "Best paediatric/international care is in Vientiane: Kasemrad International Hospital (modern, with a paediatric clinic) plus expat-trusted clinics such as the French Medical Centre (on the French Embassy grounds) and the Alliance International Medical Centre. Luang Prabang and Vang Vieng have only basic provincial facilities. For serious emergencies many expats cross to Aek Udon International Hospital in Udon Thani, Thailand (~1.5-2 hrs via the Friendship Bridge) - so travel with insurance that covers medical evacuation.",
      "Breastfeeding & changing: Laos is very family-oriented and discreet breastfeeding in public is generally accepted. Formal baby-changing tables are rare outside upmarket hotels and Vientiane malls (Vientiane Center, ITECC), so pack a portable changing mat. Nappies, wipes and formula are easy to buy in Vientiane supermarkets and pharmacies but selection thins out fast in Vang Vieng and rural areas - stock up before you leave the capital.",
      "Food that suits kids: stick to busy, freshly-cooked stalls and restaurants, peel fruit yourself, and skip ice from unknown roadside vendors. Reliable kid-pleasers are sticky rice, grilled chicken (ping gai), French-legacy baguettes and fresh fruit shakes; night-market food alleys have mild noodle options.",
      "Night markets with kids: arrive early (about 5:30-7pm) before the crush, bring a carrier for tired toddlers and keep a firm hand in narrow aisles. Luang Prabang's market is calm and handicraft-focused with a food alley; Vientiane's riverside market pairs neatly with the promenade playgrounds.",
      "Sun, mosquitoes & UXO: UV is intense - hats, high-SPF sunscreen and rash vests for water days. Use mosquito repellent (dengue is present; malaria risk is mainly rural and border areas - check current advice) at dusk. In rural provinces, unexploded ordnance remains a real hazard, so keep children on marked paths and cleared areas; the COPE centre explains this well for older kids.",
      "Pace it slowly: distances look short on a map but mountain roads are long and twisty, and Lao life runs at a gentle pace. Build in downtime, don't over-schedule, and lean on pools, riverfronts and easy walks between the bigger outings - Laos rewards a slow family rhythm.",
      "Medical facilities are limited; for anything beyond minor illness, families often cross to Udon Thani in Thailand (about an hour from Vientiane) — carry good evacuation insurance.",
      "Stock up on nappies, formula and children’s medicine in Vientiane or Luang Prabang before heading to smaller towns."
    ],
    "sources": [
      {
        "org": "vislao.com",
        "url": "https://www.vislao.com/"
      },
      {
        "org": "state.gov",
        "url": "https://www.state.gov/vientiane-international-school-fact-sheet"
      },
      {
        "org": "lyceehoffet.org",
        "url": "https://www.lyceehoffet.org/en/home/"
      },
      {
        "org": "aefe.gouv.fr",
        "url": "https://aefe.gouv.fr/fr/etablissements/lycee-francais-international-de-vientiane-josue-hoffet"
      },
      {
        "org": "pbis.edu.la",
        "url": "https://www.pbis.edu.la/"
      },
      {
        "org": "aisedulaos.com",
        "url": "https://www.aisedulaos.com/"
      },
      {
        "org": "kiettisackinternational.com",
        "url": "https://kiettisackinternational.com/"
      },
      {
        "org": "ef-lp.org",
        "url": "https://www.ef-lp.org/"
      },
      {
        "org": "phoupanyais.com",
        "url": "https://phoupanyais.com/"
      },
      {
        "org": "isl.edu.la",
        "url": "https://www.isl.edu.la/"
      },
      {
        "org": "en.wikipedia.org",
        "url": "https://en.wikipedia.org/wiki/Eastern_Star_Schools"
      },
      {
        "org": "tukata.org",
        "url": "https://www.tukata.org/"
      }
    ],
    "asOf": "2026-07"
  }
};

export function getFamily(cc) { return FAMILY[cc] || null; }
