// Regional field guide — identify plants, animals, fish, birds, reptiles, insects and
// dangerous species across Thailand/Vietnam/Cambodia/Laos. Description-based ID +
// photo-search link; no bundled photos. Data auto-assembled from the content workflow.

export const NATURE_GROUPS = [{"id": "bird", "label": "Birds", "emoji": "🐦"}, {"id": "mammal", "label": "Mammals", "emoji": "🐘"}, {"id": "fish", "label": "Fish & marine", "emoji": "🐠"}, {"id": "reptile", "label": "Reptiles & amphibians", "emoji": "🦎"}, {"id": "plant", "label": "Plants & trees", "emoji": "🌿"}, {"id": "fungus", "label": "Mushrooms & fungi", "emoji": "🍄"}, {"id": "insect", "label": "Insects", "emoji": "🦋"}, {"id": "danger", "label": "Dangerous", "emoji": "⚠️"}];

export const NATURE = [
  {
    "id": "nat-bird-white-throated-kingfisher",
    "group": "bird",
    "call": true,
    "commonName": "White-throated Kingfisher",
    "sciName": "Halcyon smyrnensis",
    "localNames": [],
    "blurb": "A large, brilliantly coloured kingfisher that is one of the most conspicuous birds across the region, often far from water.",
    "idTips": "Roughly 28 cm long with a chocolate-brown head and belly, a vivid turquoise-blue back and wings, and a bold white throat and breast patch. The heavy bill is bright coral-red, and flashing pale-blue wing patches show in flight. The call is a loud, descending, laughing trill.",
    "habitat": "Open country, farmland, gardens, roadside wires, paddies, ponds and forest edges; not tied to water.",
    "where": "Abundant and easily seen throughout Thailand, Vietnam, Cambodia and Laos, including towns and cities.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกกะเต็นอกขาว",
      "vi": "Sả đầu nâu",
      "km": "កដបទ្រូងស",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-common-kingfisher",
    "group": "bird",
    "call": true,
    "commonName": "Common Kingfisher",
    "sciName": "Alcedo atthis",
    "localNames": [],
    "blurb": "A tiny, jewel-bright kingfisher that streaks low over rivers and ponds as an electric-blue blur.",
    "idTips": "Only about 16 cm, with dazzling cobalt-blue and turquoise upperparts, orange-rufous underparts and cheeks, and a white throat. Sexes differ by bill: all-black in males, orange-based lower mandible in females. Usually first noticed as a high-pitched 'tsee' whistle and a fast, straight flight just above the water.",
    "habitat": "Clear streams, rivers, canals, ponds, lakes and mangroves with low perches.",
    "where": "Widespread, especially as a winter visitor, across all four countries near fresh and brackish water.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกกะเต็นน้อยธรรมดา",
      "vi": "Bồng chanh",
      "km": "ចចាតក្រឹម",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-oriental-pied-hornbill",
    "group": "bird",
    "call": true,
    "commonName": "Oriental Pied Hornbill",
    "sciName": "Anthracoceros albirostris",
    "localNames": [],
    "blurb": "The smallest and most approachable hornbill of the region, often the first hornbill a traveller sees.",
    "idTips": "About 55-70 cm of glossy black-and-white plumage, with a white belly and white wing-tips and tail-tips. The large pale-yellow bill carries a flattened casque ridged with black. Flight is heavy and undulating with audibly whooshing wingbeats; calls are loud cackles and squeals.",
    "habitat": "Lowland and foothill forest, forest edge, orchards and tree-lined village fringes.",
    "where": "Seen in southern and western Thai forests (e.g. Khao Yai), Cambodia, Laos and Vietnam, frequently in protected areas and forest parks.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกแก๊ก",
      "vi": "Cao cát bụng trắng",
      "km": "កេងកងតូចសខ្មៅ",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-great-hornbill",
    "group": "bird",
    "call": true,
    "commonName": "Great Hornbill",
    "sciName": "Buceros bicornis",
    "localNames": [],
    "blurb": "The spectacular giant hornbill of the region, an icon of intact rainforest.",
    "idTips": "A massive bird up to 120 cm long with black-and-white plumage, broad white wing-bars and a white tail with a black band. Crowned by a huge yellow-and-black bill topped with a large concave casque. Flight is loud and powerful, the wingbeats audible from far off; calls are deep, far-carrying barks and roars.",
    "habitat": "Tall undisturbed evergreen and semi-evergreen lowland and hill forest with large fruiting trees.",
    "where": "Best chances in Thailand's larger national parks (Khao Yai, Kaeng Krachan) and forested reserves of Laos, Cambodia and central Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกกก",
      "vi": "Hồng hoàng",
      "km": "កេងកងធំ",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-little-egret",
    "group": "bird",
    "call": true,
    "commonName": "Little Egret",
    "sciName": "Egretta garzetta",
    "localNames": [],
    "blurb": "A slender, all-white heron that is one of the commonest waterbirds of paddies and wetlands.",
    "idTips": "About 55-65 cm, pure white with a slim black bill, black legs and contrasting bright-yellow feet. In breeding plumage shows two long head plumes and fine back plumes. Feeds actively, often dashing and shuffling its yellow feet to stir up prey.",
    "habitat": "Rice paddies, marshes, riverbanks, lake edges, coastal mudflats and mangroves.",
    "where": "Extremely common and widespread across Thailand, Vietnam, Cambodia and Laos wherever there is shallow water.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกยางเปีย",
      "vi": "Cò trắng",
      "km": "កុកគ្រោងតូច",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-cattle-egret",
    "group": "bird",
    "call": true,
    "commonName": "Eastern Cattle Egret",
    "sciName": "Bubulcus coromandus",
    "localNames": [],
    "blurb": "A stocky little white egret famous for following grazing buffalo and cattle to catch flushed insects.",
    "idTips": "About 48 cm, compact and short-necked with a hunched posture and a short yellow bill. Non-breeding birds are all white; breeding birds develop rich orange-buff plumes on the head, breast and back. Almost always seen among livestock or following ploughs.",
    "habitat": "Pastures, paddies, dry fields, grassland and farmland, usually away from open water.",
    "where": "Common throughout the region, conspicuous around cattle and water buffalo in rural Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกยางควาย",
      "vi": "Cò ruồi",
      "km": "កុកគោ",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-common-myna",
    "group": "bird",
    "call": true,
    "commonName": "Common Myna",
    "sciName": "Acridotheres tristis",
    "localNames": [],
    "blurb": "A bold, noisy brown myna that thrives alongside people in towns and cities.",
    "idTips": "About 23 cm, chocolate-brown body with a glossy black head and bright-yellow bill, legs and a bare yellow patch of skin behind the eye. White wing patches and white tail-tips flash in flight. Walks confidently on the ground; gives a varied chattering, gurgling and whistling call.",
    "habitat": "Urban areas, gardens, markets, farmland, parks and roadsides.",
    "where": "Ubiquitous in towns and cities across all four countries.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกเอี้ยงสาลิกา",
      "vi": "Sáo nâu",
      "km": "សារិកាកែវគោ",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-common-hill-myna",
    "group": "bird",
    "call": true,
    "commonName": "Common Hill Myna",
    "sciName": "Gracula religiosa",
    "localNames": [],
    "blurb": "A glossy forest myna celebrated as one of the world's best mimics of the human voice.",
    "idTips": "About 28-30 cm, jet-black with a strong purple-green iridescent sheen, an orange-red bill, and distinctive bright-yellow fleshy wattles on the nape and behind the eye. A white wing patch shows in flight. The voice is an astonishing range of loud, clear, almost human-sounding whistles and squawks.",
    "habitat": "Canopy of evergreen and moist deciduous forest, forest edge and clearings.",
    "where": "Forested areas of Thailand, Laos, Cambodia and Vietnam, often detected by voice high in fruiting trees.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกขุนทอง",
      "vi": "Yểng",
      "km": "សារិកាឱឡុង",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-olive-backed-sunbird",
    "group": "bird",
    "call": true,
    "commonName": "Olive-backed Sunbird",
    "sciName": "Cinnyris jugularis",
    "localNames": [],
    "blurb": "A tiny, restless nectar-feeder of gardens, the region's most familiar sunbird.",
    "idTips": "Only about 11 cm with a slender, downcurved bill. The male has a bright-yellow belly, olive-green back and a glittering metallic blue-black throat and upper breast. The female lacks the dark throat and is plainer yellow below. Often hovers briefly at flowers and gives high, sharp twittering notes.",
    "habitat": "Gardens, hedgerows, mangroves, coastal scrub, plantations and forest edge.",
    "where": "Very common in gardens and lowlands across Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกกินปลีอกเหลือง",
      "vi": "Hút mật họng tím",
      "km": "ចាបកន្លង់",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-crimson-sunbird",
    "group": "bird",
    "call": true,
    "commonName": "Crimson Sunbird",
    "sciName": "Aethopyga siparaja",
    "localNames": [],
    "blurb": "A dazzling scarlet sunbird that is a favourite sight at flowering trees and forest edges.",
    "idTips": "About 11 cm, the male unmistakable with a brilliant crimson-red head, throat and breast, a metallic-green forehead and a long graduated tail with elongated central feathers. Females are dull olive-green. Has a thin downcurved bill and gives sharp, high chips while flitting among blossoms.",
    "habitat": "Forest edge, secondary growth, gardens and plantations with flowering trees.",
    "where": "Widespread in lowland and foothill habitats across the region, readily seen at flowering trees.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกกินปลีคอแดง",
      "vi": "Hút mật đỏ",
      "km": "ចាបកន្លង់ក្រហម",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-black-drongo",
    "group": "bird",
    "call": true,
    "commonName": "Black Drongo",
    "sciName": "Dicrurus macrocercus",
    "localNames": [],
    "blurb": "A glossy black, fork-tailed bird often perched conspicuously on wires and cattle, fiercely defending its territory.",
    "idTips": "About 28 cm including the long, deeply forked tail. Entirely glossy black with red eyes and a small white spot at the base of the bill (the 'rictal spot'). Sits upright and erect on exposed perches, sallies out to catch insects, and harasses much larger birds. Calls are harsh, metallic and varied.",
    "habitat": "Open farmland, paddies, grassland, roadsides and scattered trees.",
    "where": "Abundant in open countryside throughout Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกแซงแซวหางปลา",
      "vi": "Chèo bẻo",
      "km": "អន្ទេបខ្មៅ",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-greater-racket-tailed-drongo",
    "group": "bird",
    "call": true,
    "commonName": "Greater Racket-tailed Drongo",
    "sciName": "Dicrurus paradiseus",
    "localNames": [],
    "blurb": "A theatrical black forest drongo with two long tail streamers and a remarkable talent for mimicry.",
    "idTips": "Body about 33 cm but with two greatly elongated outer tail feathers ending in twisted 'rackets' that trail well behind in flight. Glossy black with a tufted crest on the forehead. Noisy and conspicuous, it mixes its own loud calls with accurate imitations of other birds.",
    "habitat": "Lowland and hill forest, forest edge, bamboo and well-wooded areas.",
    "where": "Common in forested parts of Thailand, Laos, Cambodia and Vietnam, often in mixed bird flocks.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกแซงแซวหางบ่วงใหญ่",
      "vi": "Chèo bẻo cờ đuôi chẻ",
      "km": "អន្ទេបទងកន្ត្រៃ",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-green-bee-eater",
    "group": "bird",
    "call": true,
    "commonName": "Asian Green Bee-eater",
    "sciName": "Merops orientalis",
    "localNames": [],
    "blurb": "A slim, bright-green bee-eater that hawks insects from low perches in open country.",
    "idTips": "About 16-18 cm of mostly bright grass-green plumage with a slender black downcurved bill, a narrow black throat band and elongated central tail feathers forming fine 'pins'. The crown and nape can show a coppery-golden wash. Gives a soft, rolling 'tree-tree-tree' trill in flight.",
    "habitat": "Open dry country, farmland, scrub, sandy areas and grassland.",
    "where": "Common in open lowlands across Thailand, Cambodia, Laos and Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกจาบคาเล็ก",
      "vi": "Trảu đầu hung",
      "km": "ត្រដេវតូច",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-blue-tailed-bee-eater",
    "group": "bird",
    "call": true,
    "commonName": "Blue-tailed Bee-eater",
    "sciName": "Merops philippinus",
    "localNames": [],
    "blurb": "An elegant, colourful bee-eater often seen in loose flocks gliding after insects over open ground and water.",
    "idTips": "About 23-26 cm with green upperparts, a blue tail and rump, a yellow-and-rufous throat separated by a black eye-stripe through the red eye, and long central tail streamers. The flight is graceful, alternating glides and flutters, with mellow rolling 'prrip' calls. Often perches on bare branches and wires near water.",
    "habitat": "Open areas near water, paddies, riverbanks, marsh edges and coastal lowlands.",
    "where": "Widespread, mainly as a breeding or non-breeding migrant, across Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกจาบคาหัวเขียว",
      "vi": "Trảu ngực nâu",
      "km": "ត្រដេវក្បាលបៃតង",
      "lo": ""
    }
  },
  {
    "id": "nat-danger-king-cobra",
    "group": "reptile",
    "commonName": "King Cobra",
    "sciName": "Ophiophagus hannah",
    "localNames": [
      "งูจงอาง (ngu chong-ang)",
      "rắn hổ chúa"
    ],
    "blurb": "The world's longest venomous snake, a snake-eating specialist of regional forests.",
    "idTips": "Very large (3-4 m, up to 5.5 m), uniform olive, tan or brownish above, often with faint pale chevron bands; slender for its length. Raises the front third of its body high off the ground and spreads a narrow hood when threatened, sometimes emitting a low growl-like hiss.",
    "habitat": "Lowland and hill forests, bamboo thickets, mangroves, plantations and the edges of streams and farmland.",
    "where": "Widespread but uncommon across Thailand, Vietnam, Cambodia and Laos; most often encountered in forested and rural areas.",
    "dangerous": true,
    "dangerNote": "Potent neurotoxic venom delivered in large volume can cause paralysis and respiratory failure; bites are medical emergencies. Back away slowly, do not provoke or corner it, immobilise the limb and seek antivenom at a hospital immediately.",
    "emoji": "🐍",
    "names": {
      "th": "งูจงอาง",
      "vi": "rắn hổ mang chúa",
      "km": "ពស់វែករនាម",
      "lo": "ງູຈົງອາງ"
    }
  },
  {
    "id": "nat-danger-monocled-cobra",
    "group": "reptile",
    "commonName": "Monocled Cobra",
    "sciName": "Naja kaouthia",
    "localNames": [
      "งูเห่าหม้อ (ngu hao mo)",
      "rắn hổ mang một mắt kính"
    ],
    "blurb": "A common medically important spitting-capable cobra of farmland and settlements.",
    "idTips": "Medium-large (1.2-2 m), grey, brown or blackish; when alarmed it rears and spreads a broad hood marked with a single round 'O'-shaped monocle pattern on the back of the hood. Hisses loudly when threatened.",
    "habitat": "Rice paddies, grassland, scrub, plantations and human-modified areas near water, often around villages and rodent populations.",
    "where": "Very common across central and northern Thailand, Vietnam, Cambodia and Laos, frequently near agricultural and residential areas.",
    "dangerous": true,
    "dangerNote": "Neurotoxic venom causes paralysis and local tissue damage; some individuals can spit venom toward the eyes, causing intense pain and possible blindness. Keep distance and eye protection; rinse eyes with water if sprayed; immobilise a bitten limb and reach antivenom urgently.",
    "emoji": "🐍",
    "names": {
      "th": "งูเห่าหม้อ",
      "vi": "rắn hổ mang một mắt kính",
      "km": "",
      "lo": "ງູເຫົ່າ"
    }
  },
  {
    "id": "nat-danger-banded-krait",
    "group": "reptile",
    "commonName": "Banded Krait",
    "sciName": "Bungarus fasciatus",
    "localNames": [
      "งูสามเหลี่ยม (ngu sam liam)",
      "rắn cạp nong"
    ],
    "blurb": "A highly venomous nocturnal krait recognised by its bold yellow-and-black bands.",
    "idTips": "Up to 1.5-2 m, with alternating broad glossy black and bright yellow rings that fully encircle the body; a distinctive raised, triangular spine-like ridge along the back gives a three-sided cross-section, and the tail ends bluntly.",
    "habitat": "Lowland forests, rice fields, marshes and grassland, usually near water; active at night and often sluggish by day.",
    "where": "Thailand, Vietnam, Cambodia and Laos in lowland rural and wetland areas; sometimes found near houses after dark.",
    "dangerous": true,
    "dangerNote": "Powerful neurotoxic venom can cause progressive paralysis and respiratory failure, often with little local pain or swelling, so bites are easily underestimated. Treat every bite as serious, immobilise the limb and get to a hospital with antivenom quickly.",
    "emoji": "🐍",
    "names": {
      "th": "งูสามเหลี่ยม",
      "vi": "rắn cạp nong",
      "km": "",
      "lo": "ງູສາມຫຼ່ຽມ"
    }
  },
  {
    "id": "nat-danger-malayan-krait",
    "group": "reptile",
    "commonName": "Malayan Krait (Blue Krait)",
    "sciName": "Bungarus candidus",
    "localNames": [
      "งูทับสมิงคลา (ngu thap saming khla)",
      "rắn cạp nia"
    ],
    "blurb": "An exceptionally venomous nocturnal snake responsible for many serious bites in the region.",
    "idTips": "Slender, 1-1.5 m, with sharply contrasting wide black or bluish-black crossbands separated by white or cream interspaces; the belly is white and the back has a slightly ridged appearance. Smooth, glossy scales.",
    "habitat": "Lowland forests, scrub, gardens, plantations and rice fields, often near water; hunts at night and may enter dwellings.",
    "where": "Thailand, Vietnam, Cambodia and Laos in lowland areas; bites frequently occur to sleepers on the ground at night.",
    "dangerous": true,
    "dangerNote": "Among the most lethal land snakes regionally; neurotoxic venom causes delayed paralysis and respiratory arrest with minimal bite-site signs. Avoid sleeping on the floor in rural settings, immobilise any bite and seek antivenom and respiratory support immediately.",
    "emoji": "🐍",
    "names": {
      "th": "งูทับสมิงคลา",
      "vi": "rắn cạp nia",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-danger-malayan-pit-viper",
    "group": "reptile",
    "commonName": "Malayan Pit Viper",
    "sciName": "Calloselasma rhodostoma",
    "localNames": [
      "งูกะปะ (ngu kapa)",
      "rắn chàm quạp"
    ],
    "blurb": "A short, well-camouflaged ground viper that causes frequent serious bites in plantations.",
    "idTips": "Stout, 0.7-1 m, pinkish-grey to reddish-brown with a row of large dark-edged triangular blotches along the back forming a banded pattern; a sharply pointed, upturned snout and a triangular head distinct from the neck. Lies still and relies on camouflage.",
    "habitat": "Rubber and fruit plantations, forest edges, bamboo and leaf litter in lowland areas; often stays motionless among dead leaves.",
    "where": "Common in Thailand (especially the south and east), Cambodia, southern Vietnam and Laos, frequently in plantations and farmland.",
    "dangerous": true,
    "dangerNote": "Haemotoxic venom causes severe pain, swelling, tissue necrosis and bleeding/clotting disorders. Watch your step in leaf litter, do not handle it, immobilise the limb without a tight tourniquet and obtain antivenom at a hospital.",
    "emoji": "🐍",
    "names": {
      "th": "งูกะปะ",
      "vi": "rắn chàm quạp",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-danger-white-lipped-pit-viper",
    "group": "reptile",
    "commonName": "White-lipped Pit Viper",
    "sciName": "Trimeresurus albolabris",
    "localNames": [
      "งูเขียวหางไหม้ (ngu khiao hang mai)",
      "rắn lục mép trắng"
    ],
    "blurb": "A bright-green arboreal pit viper commonly encountered in gardens and bushes.",
    "idTips": "Slim, 0.6-1 m, vivid leaf-green above with a white or yellowish stripe along the lower jaw and lip; males may show a thin white or reddish line on the lowest body scales. Broad triangular head, vertical pupils and a reddish prehensile tail tip.",
    "habitat": "Shrubs, bamboo, low trees, hedges and vegetation near water, including parks and rural gardens.",
    "where": "Thailand, Vietnam, Cambodia and Laos in lowland and hill areas; one of the snakes most often seen by travellers in greenery.",
    "dangerous": true,
    "dangerNote": "Haemotoxic venom causes intense pain, marked swelling and sometimes bleeding; bites are rarely fatal but require care. Do not grab vegetation blindly, keep clear of the snake, immobilise the limb and seek medical assessment and possible antivenom.",
    "emoji": "🐍",
    "names": {
      "th": "งูเขียวหางไหม้",
      "vi": "rắn lục đuôi đỏ",
      "km": "",
      "lo": "ງູຂຽວຫາງໄໝ້"
    }
  },
  {
    "id": "nat-danger-box-jellyfish",
    "group": "fish",
    "commonName": "Box Jellyfish",
    "sciName": "Chironex fleckeri",
    "localNames": [
      "แมงกะพรุนกล่อง (maeng kaphrun klong)",
      "sứa hộp"
    ],
    "blurb": "A nearly transparent, cube-shaped jellyfish with extremely potent venom (catalogued here with other marine hazards).",
    "idTips": "Pale blue, almost see-through, with a box-shaped bell up to about 20-30 cm across; clusters of long trailing tentacles (several metres) hang from the corners. Very hard to see in water, so look for tentacle threads and warning signs rather than the body.",
    "habitat": "Warm shallow coastal waters, especially calm sandy beaches and estuaries, more common in the warmer wet-season months.",
    "where": "Recorded along coasts and islands of Thailand, Vietnam and Cambodia; box jellyfish stings occur at several popular swimming beaches.",
    "dangerous": true,
    "dangerNote": "Stings cause excruciating pain, whip-like welts and can be life-threatening through cardiac and respiratory collapse. Get out of the water, douse the area liberally with vinegar (not fresh water), do not rub, remove tentacles carefully and call emergency services; be ready for CPR.",
    "emoji": "🪼",
    "names": {
      "th": "แมงกะพรุนกล่อง",
      "vi": "ong bắp cày biển",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-danger-reef-stonefish",
    "group": "fish",
    "commonName": "Reef Stonefish",
    "sciName": "Synanceia verrucosa",
    "localNames": [
      "ปลาหิน (pla hin)",
      "cá mặt quỷ"
    ],
    "blurb": "The world's most venomous fish, a master of camouflage that resembles an encrusted rock.",
    "idTips": "Up to about 30-40 cm, lumpy and warty with mottled grey, brown and reddish skin often covered in algae; large upturned mouth and eyes on top of the head. Thirteen stout dorsal spines stand erect when disturbed. Lies motionless on the bottom, almost indistinguishable from rock or coral rubble.",
    "habitat": "Shallow coral reefs, rocky bottoms, tidal pools and sandy or rubble flats, often in ankle-deep water.",
    "where": "Coastal and island reefs of Thailand, Vietnam and Cambodia; a hazard to waders and snorkellers on rocky shores.",
    "dangerous": true,
    "dangerNote": "Stepping on it drives venomous spines into the foot, causing immediate, extreme pain, swelling and possible collapse. Wear sturdy reef shoes, immerse the wound in hot (not scalding) water around 45 C to ease pain, and seek urgent medical care and antivenom.",
    "emoji": "🐟",
    "names": {
      "th": "ปลาหิน",
      "vi": "cá mặt quỷ",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-danger-lionfish",
    "group": "fish",
    "commonName": "Common Lionfish",
    "sciName": "Pterois volitans",
    "localNames": [
      "ปลาสิงโต (pla singto)",
      "cá sư tử"
    ],
    "blurb": "A striking reef fish whose ornamental fins conceal venomous spines.",
    "idTips": "About 30-38 cm, with bold reddish-brown and white vertical stripes and long, fan-like pectoral fins plus a crown of slender, separated dorsal spines resembling a mane. Hovers slowly and openly near reef structure rather than hiding.",
    "habitat": "Coral reefs, rocky ledges, wrecks and lagoons, often sheltering under overhangs by day.",
    "where": "Reefs and dive sites throughout the coasts and islands of Thailand, Vietnam and Cambodia.",
    "dangerous": true,
    "dangerNote": "Venomous dorsal, pelvic and anal spines inflict a sting with intense, throbbing pain and swelling if touched or accidentally brushed. Do not handle or corner it; if stung, immerse the area in hot water around 45 C and seek medical attention.",
    "emoji": "🐠",
    "names": {
      "th": "ปลาสิงโตปีก",
      "vi": "cá mao tiên",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-danger-giant-centipede",
    "group": "insect",
    "commonName": "Vietnamese Giant Centipede",
    "sciName": "Scolopendra subspinipes",
    "localNames": [
      "ตะขาบ (takhap)",
      "rết khổng lồ"
    ],
    "blurb": "A large, fast, aggressive centipede with a painful venomous bite (grouped here as an invertebrate; not a true insect).",
    "idTips": "Up to 20 cm long, with a flattened, segmented body that is reddish-brown to orange-red or dark, yellowish legs, and one pair of legs per segment. A pair of long antennae at the front and modified pincer-like venom claws (forcipules) behind the head; moves rapidly.",
    "habitat": "Under logs, stones, leaf litter, bark and in damp crevices; may enter houses, shoes and bedding in rural and forested areas.",
    "where": "Throughout Thailand, Vietnam, Cambodia and Laos, in gardens, forests and rural buildings.",
    "dangerNote": "The bite injects venom causing sharp, intense pain, redness and swelling, occasionally with fever or, rarely, more serious reactions. Shake out shoes and bedding, do not handle it, clean the wound and use cold compresses and pain relief; seek care if symptoms worsen or allergy develops.",
    "dangerous": true,
    "emoji": "🐛",
    "names": {
      "th": "ตะขาบ",
      "vi": "Rết Việt Nam",
      "km": "ក្អែប",
      "lo": "ເຂັບ"
    }
  },
  {
    "id": "nat-danger-asian-forest-scorpion",
    "group": "insect",
    "commonName": "Asian Forest Scorpion",
    "sciName": "Heterometrus laoticus",
    "localNames": [
      "แมงป่องช้าง (maeng pong chang)",
      "bọ cạp rừng"
    ],
    "blurb": "A large glossy-black scorpion of forest floors whose sting is painful but rarely dangerous (an arachnid, not a true insect).",
    "idTips": "Big and bulky (10-12 cm), shiny black or very dark with massive, robust pincers; the tail (metasoma) is relatively thick with a stinger at the tip. Heavy claws and large size distinguish it from the smaller, more dangerous slender-clawed species.",
    "habitat": "Burrows, leaf litter, under logs and bark in lowland and hill forests and plantations.",
    "where": "Thailand, Vietnam, Cambodia and Laos in forested and rural lowlands.",
    "dangerous": true,
    "dangerNote": "The sting causes local pain, redness and swelling similar to a bee sting and is seldom medically serious for healthy adults. Avoid handling, shake out footwear and gear, clean the site and use cold compresses; seek care if a severe allergic reaction or unusual symptoms occur.",
    "emoji": "🦂",
    "names": {
      "th": "แมงป่องช้าง",
      "vi": "Bọ cạp đen Việt Nam",
      "km": "ខ្ទួយ",
      "lo": "ແມງງອດ"
    }
  },
  {
    "id": "nat-danger-thai-black-scorpion",
    "group": "insect",
    "commonName": "Thai Black Scorpion",
    "sciName": "Heterometrus longimanus",
    "localNames": [
      "แมงป่อง (maeng pong)",
      "bọ cạp đen"
    ],
    "blurb": "A common large dark scorpion of the region, often seen at night by hikers and campers (an arachnid).",
    "idTips": "Around 8-12 cm, uniformly dark brown to black with long, heavy pincers and a thick segmented tail tipped by a stinger. May fluoresce greenish under ultraviolet light, which campers sometimes use to spot it after dark.",
    "habitat": "Damp forest floor, under rocks, logs, bark and within rotting wood; may shelter in tents, packs and footwear.",
    "where": "Thailand, Vietnam, Cambodia and Laos in forested, plantation and rural campsite areas.",
    "dangerous": true,
    "dangerNote": "Its sting produces localised burning pain and swelling that is usually not dangerous to healthy people but can be severe in those who are allergic. Inspect bedding, shoes and bags before use, do not handle it, and apply cold compresses with pain relief, seeking care for severe reactions.",
    "emoji": "🦂",
    "names": {
      "th": "แมงป่องช้างก้ามยาว",
      "vi": "",
      "km": "ខ្ទួយ",
      "lo": "ແມງງອດ"
    }
  },
  {
    "id": "nat-fish-mekong-giant-catfish",
    "group": "fish",
    "commonName": "Mekong Giant Catfish",
    "sciName": "Pangasianodon gigas",
    "localNames": [
      "Pla buek"
    ],
    "blurb": "One of the world's largest freshwater fish, a critically endangered giant of the Mekong River.",
    "idTips": "Enormous grey to silvery catfish reaching up to 3 m and 300 kg; nearly scaleless skin, broad flattened head, and reduced barbels (almost absent in adults) distinguish it from other Mekong catfish.",
    "habitat": "Deep pools and main channels of the lower Mekong River and its major tributaries.",
    "where": "Mekong River bordering Thailand and Laos, and through Cambodia; most reliably seen in aquariums or fish-park exhibits rather than the wild.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐟",
    "names": {
      "th": "ปลาบึก",
      "vi": "cá tra dầu",
      "km": "ត្រីរាជ",
      "lo": "ປາບຶກ"
    }
  },
  {
    "id": "nat-fish-giant-barb",
    "group": "fish",
    "commonName": "Giant Barb",
    "sciName": "Catlocarpio siamensis",
    "localNames": [
      "Pla kabok",
      "Trey kahor"
    ],
    "blurb": "The largest member of the carp family and the national fish of Cambodia.",
    "idTips": "Huge silvery-grey cyprinid up to 3 m with a very large head, no barbels, and conspicuously large scales; the disproportionately big head relative to body is a key sight cue.",
    "habitat": "Large rivers, floodplains, and lakes, moving into flooded forest during the wet season.",
    "where": "Mekong and Chao Phraya basins in Thailand, Cambodia (Tonle Sap), Laos, and Vietnam; commonly displayed in aquariums.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐟",
    "names": {
      "th": "ปลากระโห้",
      "vi": "cá hô",
      "km": "ត្រីគល់រាំង",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-giant-freshwater-stingray",
    "group": "fish",
    "commonName": "Giant Freshwater Stingray",
    "sciName": "Urogymnus polylepis",
    "localNames": [
      "Pla kraben"
    ],
    "blurb": "A colossal freshwater ray, among the largest of all river fish.",
    "idTips": "Broad oval-to-rounded disc up to 2 m wide, plain greyish-brown above and pale below, with a long whip-like tail bearing a serrated venomous spine near the base.",
    "habitat": "Deep sandy and muddy bottoms of large lowland rivers and estuaries.",
    "where": "Mekong and Chao Phraya rivers in Thailand, Cambodia, and Laos; occasionally entering brackish estuaries.",
    "dangerous": true,
    "dangerNote": "Tail bears a large venomous serrated spine that can inflict a deep, very painful wound; never handle and keep clear of the tail.",
    "emoji": "🐟",
    "names": {
      "th": "ปลากระเบนเจ้าพระยา",
      "vi": "cá đuối khổng lồ",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-blacktip-reef-shark",
    "group": "fish",
    "commonName": "Blacktip Reef Shark",
    "sciName": "Carcharhinus melanopterus",
    "blurb": "A small, shy reef shark often seen patrolling shallow coral flats and lagoons.",
    "idTips": "Slim shark to about 1.6 m, brownish-grey above and pale below, with unmistakable black tips on all fins (the first dorsal and lower tail-lobe tips are especially conspicuous).",
    "habitat": "Shallow coral reefs, lagoons, and reef flats, often in water barely deep enough to cover its back.",
    "where": "Andaman Sea reefs off Thailand (Similan and Surin Islands, Koh Lipe) and the Gulf of Thailand; reefs off southern Vietnam and Cambodian islands.",
    "dangerous": false,
    "dangerNote": "Generally timid and not considered a threat to swimmers; bites are rare and usually defensive in very shallow water.",
    "emoji": "🦈",
    "names": {
      "th": "ปลาฉลามครีบดำ",
      "vi": "cá mập vây đen",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-whitetip-reef-shark",
    "group": "fish",
    "commonName": "Whitetip Reef Shark",
    "sciName": "Triaenodon obesus",
    "blurb": "A slender, nocturnal reef shark frequently found resting on the seabed by day.",
    "idTips": "Grey shark to about 1.7 m with a short broad snout and distinctive white tips on the first dorsal fin and upper tail lobe; often seen lying motionless in caves or under ledges.",
    "habitat": "Coral reefs, ledges, and caves from shallow water to about 40 m.",
    "where": "Andaman Sea dive sites off Thailand (Similan, Richelieu Rock) and reefs off Vietnam and Cambodian islands.",
    "dangerous": false,
    "dangerNote": "Docile toward divers and rarely aggressive; avoid spearfishing nearby, which can trigger feeding behaviour.",
    "emoji": "🦈",
    "names": {
      "th": "ปลาฉลามครีบขาว",
      "vi": "cá mập vây trắng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-whale-shark",
    "group": "fish",
    "commonName": "Whale Shark",
    "sciName": "Rhincodon typus",
    "blurb": "The largest fish in the ocean, a gentle filter-feeding shark prized by divers.",
    "idTips": "Massive grey-blue shark up to 12 m with a broad flattened head, wide terminal mouth, and a unique pattern of pale spots and stripes resembling a checkerboard; moves slowly near the surface.",
    "habitat": "Open and coastal waters, often near plankton-rich upwellings and reef edges.",
    "where": "Andaman Sea off Thailand (Richelieu Rock, Koh Tao) and the Gulf of Thailand; seasonal sightings off Vietnam.",
    "dangerous": false,
    "dangerNote": "Completely harmless filter feeder; keep a respectful distance and do not touch.",
    "emoji": "🦈",
    "names": {
      "th": "ปลาฉลามวาฬ",
      "vi": "cá nhám voi",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-clownfish",
    "group": "fish",
    "commonName": "Clark's Anemonefish (Clownfish)",
    "sciName": "Amphiprion clarkii",
    "blurb": "A small reef fish that lives in symbiosis among the stinging tentacles of sea anemones.",
    "idTips": "Stocky fish about 10-15 cm, orange to dark brown with two or three bold white vertical bands and often a yellow tail; always found darting in and out of a host anemone.",
    "habitat": "Sheltered coral reefs and lagoons, tied to large sea anemones.",
    "where": "Andaman Sea and Gulf of Thailand reefs, and reefs off Vietnam and Cambodian islands.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐠",
    "names": {
      "th": "ปลาการ์ตูนลายปล้อง",
      "vi": "cá hề",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-parrotfish",
    "group": "fish",
    "commonName": "Bullethead Parrotfish",
    "sciName": "Chlorurus sordidus",
    "blurb": "A reef grazer that scrapes algae from coral with its fused beak-like teeth.",
    "idTips": "Robust fish to about 40 cm with a blunt rounded head and parrot-like beak; colours vary from drab brown-grey juveniles to vivid green-and-pink adults; you may hear it audibly crunching coral.",
    "habitat": "Coral reefs and reef flats from shallow water to moderate depth.",
    "where": "Andaman Sea and Gulf of Thailand reefs, and reefs off Vietnam and Cambodia.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐠",
    "names": {
      "th": "ปลานกแก้ว",
      "vi": "cá mó",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-moorish-idol",
    "group": "fish",
    "commonName": "Moorish Idol",
    "sciName": "Zanclus cornutus",
    "blurb": "An elegant, instantly recognisable reef fish with a long trailing dorsal filament.",
    "idTips": "Disc-shaped fish about 20 cm with bold black, white, and yellow vertical bands, a pointed snorkel-like snout, and a long whip-like white dorsal streamer.",
    "habitat": "Coral and rocky reefs from shallow lagoons to about 180 m.",
    "where": "Andaman Sea and Gulf of Thailand reefs, and reefs off Vietnam and Cambodian islands.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐠",
    "names": {
      "th": "ปลาโนรีเทวรูป",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-blue-spotted-stingray",
    "group": "fish",
    "commonName": "Bluespotted Ribbontail Ray",
    "sciName": "Taeniura lymma",
    "blurb": "A small, brightly marked ray commonly seen resting on sandy reef patches.",
    "idTips": "Oval disc up to about 35 cm, yellow-brown with vivid electric-blue spots and blue side-stripes along the tail; the tail carries one or two venomous spines.",
    "habitat": "Sandy patches, coral rubble, and reef edges, often partly buried.",
    "where": "Andaman Sea and Gulf of Thailand reefs, and reefs off Vietnam and Cambodian islands.",
    "dangerous": true,
    "dangerNote": "Tail bears venomous spines; a sting is intensely painful. Do not corner or attempt to handle it.",
    "emoji": "🐟",
    "names": {
      "th": "ปลากระเบนจุดฟ้า",
      "vi": "cá đuối chấm xanh",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-manta-ray",
    "group": "fish",
    "commonName": "Reef Manta Ray",
    "sciName": "Mobula alfredi",
    "blurb": "A huge, graceful filter-feeding ray that glides over reefs and cleaning stations.",
    "idTips": "Diamond-shaped ray with a wingspan up to 4-5 m, black above and white below with individually unique belly spots, and two paddle-like cephalic lobes flanking the mouth.",
    "habitat": "Reef slopes, cleaning stations, and plankton-rich coastal waters.",
    "where": "Andaman Sea off Thailand (Koh Bon, Hin Daeng) and the Gulf of Thailand; occasional sightings off Vietnam.",
    "dangerous": false,
    "dangerNote": "Harmless filter feeder with no sting; observe without touching.",
    "emoji": "🐟",
    "names": {
      "th": "ปลากระเบนราหู",
      "vi": "cá nạng hải",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-titan-triggerfish",
    "group": "fish",
    "commonName": "Titan Triggerfish",
    "sciName": "Balistoides viridescens",
    "blurb": "A large, robust reef fish notorious for aggressively defending its nest.",
    "idTips": "Stout oval fish up to 75 cm, greenish to grey with a dark cross-hatched pattern and a yellowish band across the cheek; strong beak-like teeth and a habit of facing intruders head-on.",
    "habitat": "Coral reefs and lagoons, especially around sandy nesting crater sites.",
    "where": "Andaman Sea and Gulf of Thailand reefs, and reefs off Vietnam and Cambodian islands.",
    "dangerous": true,
    "dangerNote": "Can bite divers and snorkellers who enter its cone-shaped territory above the nest during breeding; retreat horizontally out of the territory rather than swimming upward.",
    "emoji": "🐠",
    "names": {
      "th": "ปลาวัว",
      "vi": "cá bò",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-yellow-tang-surgeonfish",
    "group": "fish",
    "commonName": "Powder-Blue Surgeonfish",
    "sciName": "Acanthurus leucosternon",
    "blurb": "A striking reef fish named for the scalpel-like spines at the base of its tail.",
    "idTips": "Oval fish about 25 cm with a powder-blue body, black face, bright yellow dorsal fin, and white throat; a sharp spine sits on each side of the tail base.",
    "habitat": "Coral reefs and reef flats with strong water movement, often in grazing shoals.",
    "where": "Andaman Sea reefs off Thailand (Similan, Surin Islands, Koh Lipe).",
    "dangerous": false,
    "dangerNote": "The tail spines can cut if the fish is handled, but it poses no threat to observers.",
    "emoji": "🐠",
    "names": {
      "th": "ปลาขี้ตังเบ็ด",
      "vi": "cá đuôi gai",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-golden-birdwing",
    "group": "insect",
    "commonName": "Golden Birdwing",
    "sciName": "Troides aeacus",
    "localNames": [
      "Common Birdwing"
    ],
    "blurb": "One of the largest butterflies in the region, often gliding high over forest clearings.",
    "idTips": "Very large, with a wingspan of 13 to 16 cm. Forewings are velvety black; hindwings bear brilliant golden-yellow patches edged with black scalloping. Body is black with a red, furry thorax. Flight is slow and soaring.",
    "habitat": "Evergreen and deciduous forest edges, gardens, and flowering shrubs at low to mid elevations.",
    "where": "Widespread across northern and central Thailand, Laos, northern Vietnam, and forested Cambodia.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦋",
    "names": {
      "th": "ผีเสื้อถุงทองธรรมดา",
      "vi": "Bướm phượng cánh chim chấm rời",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-common-tiger",
    "group": "insect",
    "commonName": "Common Tiger",
    "sciName": "Danaus genutia",
    "localNames": [
      "Striped Tiger"
    ],
    "blurb": "A slow-flying orange-and-black butterfly common in open country and gardens.",
    "idTips": "Wingspan around 7 to 9 cm. Tawny-orange wings crossed by bold black veins, with a black border studded with white spots near the wingtips. Drifts lazily and is unpalatable to predators.",
    "habitat": "Open grassland, scrub, gardens, roadside verges, and forest clearings.",
    "where": "Abundant throughout Thailand, Vietnam, Cambodia, and Laos in lowland open areas.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦋",
    "names": {
      "th": "ผีเสื้อหนอนใบรักลายเสือ",
      "vi": "Bướm hổ vằn",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-paper-kite",
    "group": "insect",
    "commonName": "Paper Kite",
    "sciName": "Idea leuconoe",
    "localNames": [
      "Rice Paper Butterfly",
      "Tree Nymph"
    ],
    "blurb": "A large, ghostly white butterfly that floats through forest shade like drifting paper.",
    "idTips": "Wingspan 12 to 14 cm. Semi-translucent white to cream wings densely marked with black veins and rows of black spots. Flight is exceptionally slow and buoyant.",
    "habitat": "Mangroves, coastal forest, and humid woodland; a frequent resident of butterfly gardens.",
    "where": "Coastal and island Thailand and southern Vietnam; commonly seen in butterfly parks region-wide.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦋",
    "names": {
      "th": "ผีเสื้อว่าวกระดาษ",
      "vi": "Bướm đốm trắng lớn",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-common-mormon",
    "group": "insect",
    "commonName": "Common Mormon",
    "sciName": "Papilio polytes",
    "localNames": [],
    "blurb": "A widespread swallowtail of gardens and villages whose females mimic toxic species.",
    "idTips": "Wingspan 9 to 10 cm. Black wings; males have a band of white spots across the hindwing. Females are variable, some with red markings mimicking the Common Rose. Hindwings are tailed.",
    "habitat": "Gardens, citrus groves, villages, and forest edges in lowlands.",
    "where": "Extremely common across all four countries, especially around human settlements.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦋",
    "names": {
      "th": "ผีเสื้อหางติ่งธรรมดา",
      "vi": "Bướm phượng đen",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-southeast-asian-firefly",
    "group": "insect",
    "commonName": "Mangrove Firefly",
    "sciName": "Pteroptyx malaccae",
    "localNames": [
      "Hing hoi (Thai)"
    ],
    "blurb": "A small beetle famous for the synchronous flashing displays it produces in riverside mangroves.",
    "idTips": "Tiny, 6 to 9 mm, soft-bodied beetle, brown to dark with a pinkish-orange shield over the head. Identified mainly at night by greenish-yellow flashes that pulse in unison across whole trees.",
    "habitat": "Mangrove and riverside trees, especially Sonneratia, along tidal rivers and estuaries.",
    "where": "Famous displays along rivers in Thailand (Amphawa) and the Mekong Delta of Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "✨",
    "names": {
      "th": "หิ่งห้อย",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-black-mountain-cicada",
    "group": "insect",
    "call": true,
    "commonName": "Black Mountain Cicada",
    "sciName": "Cryptotympana aquila",
    "localNames": [],
    "blurb": "A large, glossy black cicada whose deafening chorus marks the hot season in lowland forests.",
    "idTips": "Body 4 to 5 cm long, robust and shiny black with clear wings. More often heard than seen: a continuous, piercing, electric drone from high in trees during daytime heat.",
    "habitat": "Deciduous and evergreen forest, plantations, and wooded parkland in the lowlands.",
    "where": "Widespread in Thailand, Cambodia, Laos, and Vietnam, loudest in the hot dry season.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦗",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-empress-cicada",
    "group": "insect",
    "call": true,
    "commonName": "Empress Cicada",
    "sciName": "Megapomponia imperatoria",
    "localNames": [],
    "blurb": "One of the world's largest cicadas, a giant of mainland Southeast Asian rainforests.",
    "idTips": "Enormous, with a body to 7 cm and a wingspan reaching 18 to 20 cm. Mottled greenish-brown and black body with broad, veined, partly opaque wings. Produces a loud, throbbing call at dusk.",
    "habitat": "Lowland and hill evergreen rainforest with tall trees.",
    "where": "Forested Thailand, Laos, and Vietnam; a prized sighting in protected forest reserves.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦗",
    "names": {
      "th": "จักจั่นยักษ์",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-common-flangetail",
    "group": "insect",
    "commonName": "Common Scarlet Skimmer",
    "sciName": "Crocothemis servilia",
    "localNames": [
      "Ruddy Marsh Skimmer"
    ],
    "blurb": "A vivid red dragonfly that perches conspicuously around ponds and rice paddies.",
    "idTips": "Length about 4 to 5 cm. Mature males are entirely bright blood-red, including the eyes, with a thin dark line down the abdomen. Females are yellow-brown. Wings are clear with a small amber base.",
    "habitat": "Still and slow water: ponds, ditches, marshes, and flooded rice fields in the lowlands.",
    "where": "Ubiquitous across Thailand, Vietnam, Cambodia, and Laos near any standing water.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🪰",
    "names": {
      "th": "แมลงปอบ้านบ่อ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-globe-skimmer",
    "group": "insect",
    "commonName": "Globe Skimmer",
    "sciName": "Pantala flavescens",
    "localNames": [
      "Wandering Glider"
    ],
    "blurb": "A migratory golden dragonfly that gathers in huge gliding swarms before the rains.",
    "idTips": "Length around 4.5 cm. Pale golden to amber-yellow body and broad-based hindwings built for gliding. Rarely perches, instead soaring continuously, often in large loose swarms.",
    "habitat": "Open skies over fields, towns, and coasts; breeds in temporary rain pools.",
    "where": "Everywhere across the region, swarming most visibly at the onset of the monsoon.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🪰",
    "names": {
      "th": "แมลงปอบ้านแผ่นปีกกว้าง",
      "vi": "Chuồn chuồn ngô",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-asian-weaver-ant",
    "group": "insect",
    "commonName": "Asian Weaver Ant",
    "sciName": "Oecophylla smaragdina",
    "localNames": [
      "Green Ant",
      "Mod daeng (Thai)",
      "Kien vang (Viet)"
    ],
    "blurb": "An aggressive orange ant that stitches living leaves into tree-top nests with larval silk.",
    "idTips": "Workers 8 to 10 mm, slender, rusty-orange to greenish, with a long abdomen and large jaws. Look for football-sized nests of green leaves bound together high in trees; ants form chains to pull leaves shut.",
    "habitat": "Tree canopies in orchards, mangroves, gardens, and forest, especially mango and citrus.",
    "where": "Abundant in lowland Thailand, Vietnam, Cambodia, and Laos; eggs are harvested as food.",
    "dangerous": false,
    "dangerNote": "Bites fiercely and sprays formic acid into the wound; painful and irritating but not medically serious.",
    "emoji": "🐜",
    "names": {
      "th": "มดแดง",
      "vi": "Kiến vàng",
      "km": "អង្ក្រង",
      "lo": "ມົດແດງ"
    }
  },
  {
    "id": "nat-insect-atlas-beetle",
    "group": "insect",
    "commonName": "Atlas Beetle",
    "sciName": "Chalcosoma atlas",
    "localNames": [],
    "blurb": "A massive horned rhinoceros beetle and one of the heaviest insects in the region.",
    "idTips": "Body 6 to 12 cm including horns. Glossy black to dark bronze. Males bear three long forward-curving horns (one from the head, two from the thorax); females are hornless and rough-surfaced.",
    "habitat": "Lowland and hill rainforest; attracted to lights at night and to fermenting fruit and sap.",
    "where": "Forested parts of Thailand, Laos, and Vietnam; often seen at night near forest lodges.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🪲",
    "names": {
      "th": "ด้วงกว่างแอตลัส",
      "vi": "Bọ hung ba sừng không mấu",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-three-horned-rhino-beetle",
    "group": "insect",
    "commonName": "Five-horned Rhinoceros Beetle",
    "sciName": "Eupatorus gracilicornis",
    "localNames": [],
    "blurb": "A spectacular forest beetle prized locally and bred for traditional beetle-fighting contests.",
    "idTips": "Length 4 to 8 cm. Black head and legs with a contrasting golden-yellow to olive forewing. Males carry one long upward head horn and four shorter thoracic horns arranged like a crown.",
    "habitat": "Hill and montane forest; comes to lights at night during the wet season.",
    "where": "Northern Thailand, Laos, and northern Vietnam in forested uplands.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🪲",
    "names": {
      "th": "ด้วงกว่างห้าเขา",
      "vi": "Bọ hung năm sừng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-jewel-beetle",
    "group": "insect",
    "commonName": "Jewel Beetle",
    "sciName": "Sternocera aequisignata",
    "localNames": [
      "Maeng tap (Thai)"
    ],
    "blurb": "A brilliant metallic-green beetle whose iridescent wing cases are used in traditional embroidery.",
    "idTips": "Length 3 to 4 cm, stout and oval. Body is glittering emerald to blue-green metallic, with the thorax often dusted in pale spots. Flies heavily on hot days around host trees.",
    "habitat": "Dry deciduous and dipterocarp forest, feeding on the leaves of Acacia and similar trees.",
    "where": "Northeastern and central Thailand, Laos, and Cambodia in the dry season.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🪲",
    "names": {
      "th": "แมลงทับกลมขาเขียว",
      "vi": "",
      "km": "កំភេម",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-great-mormon-blue-glassy-tiger",
    "group": "insect",
    "commonName": "Blue Glassy Tiger",
    "sciName": "Ideopsis vulgaris",
    "localNames": [],
    "blurb": "A semi-transparent pale-blue butterfly that drifts slowly through forest and gardens.",
    "idTips": "Wingspan 7 to 8 cm. Pale bluish-white, translucent wings veined and streaked in black, giving a glassy appearance. Flight is slow and floating, often in groups at flowers.",
    "habitat": "Forest edges, secondary growth, and flowering gardens in lowlands and hills.",
    "where": "Common across Thailand, Vietnam, Cambodia, and Laos, often in butterfly aggregations.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦋",
    "names": {
      "th": "ผีเสื้อลายเสือฟ้าสีคล้ำ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-long-tailed-macaque",
    "group": "mammal",
    "call": true,
    "commonName": "Long-tailed Macaque",
    "sciName": "Macaca fascicularis",
    "localNames": [
      "Crab-eating macaque",
      "Ling (Thai)"
    ],
    "blurb": "The most commonly seen monkey in the region, bold and abundant around temples, beaches and tourist sites.",
    "idTips": "Medium-sized grey-brown monkey with a tail as long as or longer than its body, a pale face with cheek whiskers, and a small crest of hair on the crown. Travels in noisy troops; loud whoops and screeches.",
    "habitat": "Mangroves, riverside and coastal forest, secondary forest, and human-dominated areas such as temples and parks.",
    "where": "Throughout Thailand, Vietnam, Cambodia and Laos; very common at temple complexes (e.g. Lopburi, Angkor) and coastal areas.",
    "dangerous": true,
    "dangerNote": "Habituated troops bite and scratch to steal food and bags; keep distance, do not feed, and secure belongings. Bites carry rabies and herpes-B risk.",
    "emoji": "🐒",
    "names": {
      "th": "ลิงแสม",
      "vi": "Khỉ đuôi dài",
      "km": "ស្វាក្ដាម",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-pig-tailed-macaque",
    "group": "mammal",
    "call": true,
    "commonName": "Northern Pig-tailed Macaque",
    "sciName": "Macaca leonina",
    "localNames": [],
    "blurb": "A heavy-set forest macaque named for its short, curled, pig-like tail.",
    "idTips": "Stocky olive-brown monkey, larger than the long-tailed macaque, with a short tail held in an upward curl and a dark stripe of hair running back from the crown.",
    "habitat": "Evergreen and semi-evergreen forest, often in hilly interior forest.",
    "where": "National parks across Thailand, Laos, Cambodia and Vietnam (e.g. Khao Yai, Cat Tien).",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐒",
    "names": {
      "th": "ลิงกังเหนือ",
      "vi": "Khỉ đuôi lợn phương bắc",
      "km": "ស្វាត្រោស",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-white-handed-gibbon",
    "group": "mammal",
    "call": true,
    "commonName": "White-handed (Lar) Gibbon",
    "sciName": "Hylobates lar",
    "localNames": [
      "Chani (Thai)"
    ],
    "blurb": "A small, tail-less ape famous for its loud whooping duets that carry across the forest canopy at dawn.",
    "idTips": "Slender ape with no tail, very long arms, and a black face ringed with white fur; coat is either pale buff or black, always with white hands and feet. Swings hand-over-hand (brachiates) through the treetops. Listen for rising, bubbling song.",
    "habitat": "Tall evergreen rainforest canopy.",
    "where": "Best seen and heard at Khao Yai and Kaeng Krachan in Thailand; also forests of Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🙊",
    "names": {
      "th": "ชะนีมือขาว",
      "vi": "Vượn tay trắng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-asian-elephant",
    "group": "mammal",
    "call": true,
    "commonName": "Asian Elephant",
    "sciName": "Elephas maximus",
    "localNames": [
      "Chang (Thai)",
      "Damri (Khmer)"
    ],
    "blurb": "The region's largest land animal, both a wild forest mammal and a revered cultural icon.",
    "idTips": "Huge grey mammal with smaller, rounded ears than the African elephant, a domed twin-bumped forehead, and a single finger-like tip on the trunk. Only some males carry tusks. Wild herds are usually females and young.",
    "habitat": "Forest, grassland and forest edge; comes to mineral licks and water.",
    "where": "Wild herds in Khao Yai and Kui Buri (Thailand), Cat Tien (Vietnam), and protected forests of Laos and Cambodia.",
    "dangerous": true,
    "dangerNote": "Wild elephants, especially cows with calves or musth bulls, are extremely dangerous and kill people every year. Never approach; give vehicles right of way and retreat slowly.",
    "emoji": "🐘",
    "names": {
      "th": "ช้างเอเชีย",
      "vi": "Voi châu Á",
      "km": "ដំរី",
      "lo": "ຊ້າງ"
    }
  },
  {
    "id": "nat-mammal-water-buffalo",
    "group": "mammal",
    "commonName": "Domestic Water Buffalo",
    "sciName": "Bubalus bubalis",
    "localNames": [
      "Khwai (Thai)",
      "Trau (Vietnamese)"
    ],
    "blurb": "The ubiquitous working bovine of rice-farming Southeast Asia, seen wallowing in paddies and ponds.",
    "idTips": "Large slate-grey to black bovine with a sparse coat, splayed hooves, and broad, backward-sweeping crescent-shaped horns. Frequently half-submerged in mud or water.",
    "habitat": "Rice paddies, wetlands, village ponds and farmland.",
    "where": "Rural countryside throughout Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "Domesticated and generally placid, but a startled or protective animal is very large; keep a respectful distance.",
    "emoji": "🐃",
    "names": {
      "th": "ควาย",
      "vi": "Trâu",
      "km": "ក្របី",
      "lo": "ຄວາຍ"
    }
  },
  {
    "id": "nat-mammal-sambar-deer",
    "group": "mammal",
    "call": true,
    "commonName": "Sambar Deer",
    "sciName": "Rusa unicolor",
    "localNames": [
      "Kwang (Thai)"
    ],
    "blurb": "The largest deer of the region, often seen grazing in forest clearings at dusk.",
    "idTips": "Big, dark brown deer with a shaggy coat, a mane on the neck of males, and large three-tined antlers on stags. Gives a loud, alarmed honking 'pook' bark when disturbed.",
    "habitat": "Forest, grassy clearings, and salt licks.",
    "where": "Common and tame at Khao Yai (Thailand); also Cat Tien (Vietnam) and forests of Laos and Cambodia.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦌",
    "names": {
      "th": "กวางป่า",
      "vi": "Nai",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-common-muntjac",
    "group": "mammal",
    "call": true,
    "commonName": "Northern Red Muntjac (Barking Deer)",
    "sciName": "Muntiacus vaginalis",
    "localNames": [
      "Barking deer",
      "Keng (Thai)"
    ],
    "blurb": "A small, solitary forest deer that gives a sharp dog-like bark when alarmed.",
    "idTips": "Small reddish-brown deer about knee height, with short single-spike antlers on a long bony pedicel in males and visible dark facial tear-mark ridges. Bounds away with tail raised, flashing a white underside.",
    "habitat": "Dense forest, scrub and forest edge.",
    "where": "Forests and national parks across Thailand, Laos, Cambodia and Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦌",
    "names": {
      "th": "เก้ง",
      "vi": "Mang Ấn Độ",
      "km": "ឈ្លូស",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-common-palm-civet",
    "group": "mammal",
    "commonName": "Common Palm Civet",
    "sciName": "Paradoxurus hermaphroditus",
    "localNames": [
      "Toddy cat",
      "Musang"
    ],
    "blurb": "A cat-sized nocturnal mammal famous as the animal behind kopi luwak coffee.",
    "idTips": "Greyish-buff body with dark blotchy stripes along the back, a dark mask across the face, a long tail and a pointed muzzle. Usually seen at night in headlights or torch beams, often in fruiting trees or on rooftops.",
    "habitat": "Forest, plantations, gardens and even town rooftops.",
    "where": "Widespread but nocturnal across Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐱",
    "names": {
      "th": "อีเห็นข้างลาย",
      "vi": "Cầy vòi hương",
      "km": "សំពោចក្រអូប",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-irrawaddy-dolphin",
    "group": "mammal",
    "commonName": "Irrawaddy Dolphin",
    "sciName": "Orcaella brevirostris",
    "localNames": [
      "Pha kha (Lao/Khmer)"
    ],
    "blurb": "A rare, rounded-headed freshwater dolphin clinging to survival in the Mekong River.",
    "idTips": "Pale grey dolphin with a blunt, rounded head and no beak, and a small, low, blunt dorsal fin set well back. Surfaces slowly and undramatically; lacks the leaping behaviour of marine dolphins.",
    "habitat": "Deep pools of large slow rivers and coastal brackish water.",
    "where": "Best seen on the Mekong at Kratie/Kampi (Cambodia) and at Si Phan Don (Four Thousand Islands), southern Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐬",
    "names": {
      "th": "โลมาอิรวดี",
      "vi": "Cá nước",
      "km": "ផ្សោតក្បាលត្រឡោក",
      "lo": "ປາຂ່າ"
    }
  },
  {
    "id": "nat-mammal-lyles-flying-fox",
    "group": "mammal",
    "commonName": "Lyle's Flying Fox",
    "sciName": "Pteropus lylei",
    "localNames": [
      "Fruit bat",
      "Kang khao mae kai (Thai)"
    ],
    "blurb": "A large fruit bat that roosts in spectacular noisy colonies in temple grounds and town trees.",
    "idTips": "Big bat with a fox-like face, large eyes, dark wings and a golden-brown mantle around the neck, with a wingspan up to about a metre. Hangs in dense daytime colonies in tall trees; squabbles and flaps constantly.",
    "habitat": "Tall roost trees, often in temple grounds and village squares, foraging in orchards at night.",
    "where": "Temple and town colonies in central Thailand and Cambodia (e.g. Wat Phai Lom, Angkor area).",
    "dangerous": false,
    "dangerNote": "Do not handle bats; fruit bats can carry zoonotic viruses, though they pose no threat if left undisturbed.",
    "emoji": "🦇",
    "names": {
      "th": "ค้างคาวแม่ไก่ภาคกลาง",
      "vi": "Dơi ngựa Thái Lan",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-finless-porpoise",
    "group": "mammal",
    "commonName": "Indo-Pacific Finless Porpoise",
    "sciName": "Neophocaena phocaenoides",
    "localNames": [],
    "blurb": "A small, shy, finless porpoise of shallow coastal waters.",
    "idTips": "Small pale grey cetacean with a rounded head, no dorsal fin (just a low ridge along the back), and a smooth rolling surfacing motion. Usually alone or in small groups and easily overlooked.",
    "habitat": "Shallow coastal seas, estuaries and the surf zone.",
    "where": "Coastal waters of the Gulf of Thailand and southern Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐬",
    "names": {
      "th": "โลมาหัวบาตรหลังเรียบ",
      "vi": "Cá heo không vây",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-wild-boar",
    "group": "mammal",
    "commonName": "Eurasian Wild Boar",
    "sciName": "Sus scrofa",
    "localNames": [
      "Mu pa (Thai)"
    ],
    "blurb": "The wild ancestor of the domestic pig, rooting through forest floors across the region.",
    "idTips": "Bristly grey-brown pig with a large head, a straight tasseled tail and an elongated snout; piglets are striped brown and cream. Often detected by churned-up soil and grunting.",
    "habitat": "Forest, grassland and forest edge near water.",
    "where": "Forests and national parks throughout Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": true,
    "dangerNote": "Boars are generally shy, but cornered animals or sows with piglets can charge and inflict deep wounds with their tusks; keep your distance.",
    "emoji": "🐗",
    "names": {
      "th": "หมูป่า",
      "vi": "Lợn rừng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-variable-squirrel",
    "group": "mammal",
    "call": true,
    "commonName": "Variable Squirrel",
    "sciName": "Callosciurus finlaysonii",
    "localNames": [
      "Finlayson's squirrel"
    ],
    "blurb": "A widespread tree squirrel whose coat colour varies wildly from all-white to red to near-black between regions.",
    "idTips": "Medium tree squirrel with a long bushy tail; colour is extremely variable (cream, buff, rufous, grey or black, sometimes two-tone). Active by day, dashing along branches and giving sharp chattering calls.",
    "habitat": "Forest, parks, gardens and temple grounds.",
    "where": "Common and easily seen in parks and temples across Thailand, Laos and Cambodia.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐿️",
    "names": {
      "th": "กระรอกหลากสี",
      "vi": "Sóc mun",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-dusky-leaf-monkey",
    "group": "mammal",
    "call": true,
    "commonName": "Dusky Leaf Monkey (Spectacled Langur)",
    "sciName": "Trachypithecus obscurus",
    "localNames": [
      "Spectacled langur"
    ],
    "blurb": "A gentle, leaf-eating monkey instantly recognised by the white rings around its eyes.",
    "idTips": "Slim dark-grey monkey with a long tail, pale rings of bare skin around the eyes and around the mouth, and bright orange-yellow infants. Sits quietly in the canopy feeding on leaves rather than raiding food.",
    "habitat": "Evergreen and coastal forest.",
    "where": "Southern and peninsular Thailand (e.g. Khao Sam Roi Yot, Krabi, Railay).",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐒",
    "names": {
      "th": "ค่างแว่นถิ่นใต้",
      "vi": "Voọc mắt kính",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-frangipani",
    "group": "plant",
    "commonName": "Frangipani",
    "sciName": "Plumeria rubra",
    "localNames": [
      "Lan Thom (Thai)",
      "Champa (Lao)"
    ],
    "blurb": "A small ornamental tree famous for fragrant five-petalled flowers, planted around temples across the region.",
    "idTips": "Small tree 3-8 m with thick, blunt, sparsely-branched grey limbs that ooze milky sap when broken; large leathery leaves clustered at branch tips; waxy pinwheel flowers in white, yellow, pink or red with a yellow centre and a strong sweet evening scent.",
    "habitat": "Temple grounds, gardens, parks and roadsides; tolerant of poor dry soils.",
    "where": "Throughout Thailand, Vietnam, Cambodia and Laos, especially at Buddhist temples (wats).",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌸",
    "names": {
      "th": "ลั่นทม",
      "vi": "Hoa đại",
      "km": "ចំប៉ី",
      "lo": "ດອກຈຳປາ"
    }
  },
  {
    "id": "nat-plant-lotus",
    "group": "plant",
    "commonName": "Sacred Lotus",
    "sciName": "Nelumbo nucifera",
    "localNames": [
      "Bua (Thai)",
      "Hoa sen (Vietnamese)"
    ],
    "blurb": "An aquatic plant of deep cultural and religious significance, grown for its flowers, seeds and edible rhizomes.",
    "idTips": "Large round blue-green leaves held high above the water on stiff stalks, with a water-repellent surface that beads droplets; solitary pink or white flowers on tall stems; distinctive flat-topped, perforated yellow seed pod resembling a showerhead.",
    "habitat": "Ponds, lakes, slow rivers, flooded fields and ornamental water gardens.",
    "where": "Ubiquitous in ponds and temple pools across all four countries; sold in markets as flowers and seed heads.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🪷",
    "names": {
      "th": "บัวหลวง",
      "vi": "Sen",
      "km": "ផ្កាឈូក",
      "lo": "ດອກບົວ"
    }
  },
  {
    "id": "nat-plant-banyan",
    "group": "plant",
    "commonName": "Banyan Fig",
    "sciName": "Ficus benghalensis",
    "localNames": [
      "Ton Sai (Thai)",
      "Cay da (Vietnamese)"
    ],
    "blurb": "A massive strangler fig revered as a spirit tree, often draped with offerings and shrines.",
    "idTips": "Enormous spreading crown with many woody aerial roots dropping from the branches to form secondary trunks; smooth grey bark; glossy oval leaves; tiny figs in pairs along the twigs; frequently wrapped in coloured cloth at its base.",
    "habitat": "Village centres, temple courtyards, roadsides and forest edges.",
    "where": "Common across Thailand, Cambodia, Laos and Vietnam, often as a single huge landmark tree in a village.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌳",
    "names": {
      "th": "นิโครธ",
      "vi": "Cây đa",
      "km": "ដើមជ្រៃ",
      "lo": "ຕົ້ນໄຮ"
    }
  },
  {
    "id": "nat-plant-rubber",
    "group": "plant",
    "commonName": "Para Rubber Tree",
    "sciName": "Hevea brasiliensis",
    "localNames": [
      "Yang phara (Thai)"
    ],
    "blurb": "A tall plantation tree tapped for natural latex, a major cash crop in the region.",
    "idTips": "Straight slim trunk to 20-30 m grown in dead-straight rows; smooth pale bark marked with diagonal tapping cuts that spiral down to a small cup; leaves in groups of three (trifoliate); milky white sap.",
    "habitat": "Managed plantations on hills and lowlands.",
    "where": "Vast plantations in southern Thailand, southern Vietnam, eastern Cambodia and southern Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌴",
    "names": {
      "th": "ยางพารา",
      "vi": "Cây cao su",
      "km": "ដើមកៅស៊ូ",
      "lo": "ຢາງພາລາ"
    }
  },
  {
    "id": "nat-plant-durian",
    "group": "plant",
    "commonName": "Durian",
    "sciName": "Durio zibethinus",
    "localNames": [
      "Thurian (Thai)",
      "Sau rieng (Vietnamese)"
    ],
    "blurb": "A large tropical tree producing the famously pungent spiked fruit known as the king of fruits.",
    "idTips": "Tall tree to 25-40 m; oblong leaves bronze-scaly underneath; the unmistakable fruit is football-sized, greenish-brown, covered in sharp pyramidal spines, with a powerful smell of onions, gas and sweetness; creamy yellow custard-like flesh inside.",
    "habitat": "Orchards and homestead gardens in the humid lowland tropics.",
    "where": "Orchards and markets across Thailand, Vietnam and Cambodia; eastern Thailand and the Mekong Delta are major growing areas.",
    "dangerous": false,
    "dangerNote": "Heavy spiked fruit can injure if it falls from a tall tree; the fruit is banned in many hotels and on transport due to the odour.",
    "emoji": "🴖",
    "names": {
      "th": "ทุเรียน",
      "vi": "Sầu riêng",
      "km": "ធូរេន",
      "lo": "ໝາກທຸລຽນ"
    }
  },
  {
    "id": "nat-plant-rice",
    "group": "plant",
    "commonName": "Asian Rice",
    "sciName": "Oryza sativa",
    "localNames": [
      "Khao (Thai)",
      "Lua / Gao (Vietnamese)"
    ],
    "blurb": "The staple cereal grass grown in flooded paddies that define the rural landscape.",
    "idTips": "Grass-like clumps about 0.6-1.2 m tall standing in shallow flooded fields; bright green when young, turning golden-yellow at harvest; arching seed heads of small grains droop over as they ripen.",
    "habitat": "Flooded paddy fields, river plains and terraced hillsides.",
    "where": "Everywhere rural across all four countries; iconic terraces in northern Vietnam (Sapa, Mu Cang Chai) and vast plains in Thailand's central region and the Mekong Delta.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌾",
    "names": {
      "th": "ข้าว",
      "vi": "Lúa",
      "km": "ស្រូវ",
      "lo": "ເຂົ້າ"
    }
  },
  {
    "id": "nat-plant-bamboo",
    "group": "plant",
    "commonName": "Bamboo",
    "sciName": "Bambusa spp.",
    "localNames": [
      "Mai phai (Thai)",
      "Tre (Vietnamese)"
    ],
    "blurb": "Fast-growing giant grasses used for building, scaffolding, food and craft throughout the region.",
    "idTips": "Tall woody hollow stems (culms) with clearly marked ringed joints (nodes); grows in dense clumps; slender lance-shaped leaves; stems range from finger-thin to over 15 cm thick and may be green, yellow or striped.",
    "habitat": "Forests, riverbanks, village edges and cultivated groves.",
    "where": "Abundant across Thailand, Vietnam, Cambodia and Laos in forests, gardens and as cut poles at markets.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🎋",
    "names": {
      "th": "ไผ่",
      "vi": "Tre",
      "km": "ឫស្សី",
      "lo": "ໄມ້ໄຜ່"
    }
  },
  {
    "id": "nat-plant-orchid",
    "group": "plant",
    "commonName": "Tropical Orchids",
    "sciName": "Dendrobium spp.",
    "localNames": [
      "Kluai mai (Thai)",
      "Hoa lan (Vietnamese)"
    ],
    "blurb": "A diverse family of often epiphytic flowering plants, cultivated commercially and found wild in forests.",
    "idTips": "Plants perched on tree branches or in pots with thick green pseudobulbs and strappy leaves; flower sprays with the characteristic orchid shape of three sepals, two petals and a distinct lip; commonest are purple-pink Dendrobium sprays sold everywhere.",
    "habitat": "Wild on tree trunks in moist forest; cultivated in nurseries, gardens and on hotel grounds.",
    "where": "Wild in forests of northern Thailand, Laos and Vietnam; commercial orchid farms near Bangkok and Chiang Mai; sold at flower markets across the region.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌺",
    "names": {
      "th": "กล้วยไม้สกุลหวาย",
      "vi": "Lan hoàng thảo",
      "km": "កេសរកូល",
      "lo": "ກ້ວຍໄມ້"
    }
  },
  {
    "id": "nat-plant-mangrove",
    "group": "plant",
    "commonName": "Red Mangrove",
    "sciName": "Rhizophora apiculata",
    "localNames": [
      "Kongkang (Thai)",
      "Duoc (Vietnamese)"
    ],
    "blurb": "A salt-tolerant coastal tree that forms dense tidal forests protecting shorelines.",
    "idTips": "Tangled tree standing on a cage of arching reddish prop roots that emerge from the trunk into the mud; glossy dark-green elliptic leaves; long pencil-like dangling propagule seedlings; grows half-submerged at the tide line.",
    "habitat": "Brackish tidal mudflats, estuaries, lagoons and sheltered coastlines.",
    "where": "Coastal areas of southern Thailand, the Mekong Delta and Ca Mau in Vietnam, and Cambodia's Koh Kong and southern coast.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌿",
    "names": {
      "th": "โกงกางใบเล็ก",
      "vi": "Đước đôi",
      "km": "កោងកាង",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-coconut-palm",
    "group": "plant",
    "commonName": "Coconut Palm",
    "sciName": "Cocos nucifera",
    "localNames": [
      "Maphrao (Thai)",
      "Dua (Vietnamese)"
    ],
    "blurb": "The classic tall tropical palm grown for its drinking nuts, oil and timber.",
    "idTips": "Slender curving grey trunk to 25-30 m, often leaning; crown of large feathery (pinnate) fronds; clusters of large green-then-brown husked nuts beneath the leaves; no branches.",
    "habitat": "Coasts, beaches, plantations, villages and roadsides in lowland tropics.",
    "where": "Throughout coastal and lowland Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "Falling coconuts from tall palms can cause serious injury; avoid sitting directly beneath fruiting trees.",
    "emoji": "🥥",
    "names": {
      "th": "มะพร้าว",
      "vi": "Dừa",
      "km": "ដូង",
      "lo": "ໝາກພ້າວ"
    }
  },
  {
    "id": "nat-plant-banana",
    "group": "plant",
    "commonName": "Banana Plant",
    "sciName": "Musa acuminata",
    "localNames": [
      "Kluai (Thai)",
      "Chuoi (Vietnamese)"
    ],
    "blurb": "A giant herb, not a true tree, grown everywhere for its fruit, leaves and flower.",
    "idTips": "Soft juicy trunk made of rolled leaf bases (a pseudostem) to 2-6 m; very large bright-green paddle-shaped leaves that tear into ribbons in the wind; a hanging purple-red flower bud below upward-pointing hands of fruit.",
    "habitat": "Gardens, smallholdings, forest clearings and roadside plots.",
    "where": "Ubiquitous across all four countries in villages, gardens and markets.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🍌",
    "names": {
      "th": "กล้วยป่า",
      "vi": "Chuối rừng",
      "km": "ចេក",
      "lo": "ໝາກກ້ວຍ"
    }
  },
  {
    "id": "nat-plant-teak",
    "group": "plant",
    "commonName": "Teak",
    "sciName": "Tectona grandis",
    "localNames": [
      "Mai sak (Thai)"
    ],
    "blurb": "A prized hardwood tree historically logged for durable timber used in temples and houses.",
    "idTips": "Tall tree to 30-40 m with a straight trunk and pale, fibrous, shallowly fissured bark; enormous rough oval leaves up to 30-50 cm long that feel sandpapery; airy clusters of small white flowers held above the foliage.",
    "habitat": "Deciduous monsoon forests and managed plantations.",
    "where": "Northern Thailand, northern and central Laos, and parts of northern Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌳",
    "names": {
      "th": "สัก",
      "vi": "Tếch",
      "km": "ម៉ៃសាក់",
      "lo": "ໄມ້ສັກ"
    }
  },
  {
    "id": "nat-plant-water-hyacinth",
    "group": "plant",
    "commonName": "Water Hyacinth",
    "sciName": "Eichhornia crassipes",
    "localNames": [
      "Phak top chawa (Thai)",
      "Beo tay (Vietnamese)"
    ],
    "blurb": "A free-floating invasive aquatic plant that forms dense mats on rivers and canals.",
    "idTips": "Floating rosettes of glossy round leaves on swollen, spongy air-filled stalks that keep it buoyant; trailing feathery purple-black roots beneath; showy spikes of pale lilac flowers each with a yellow blotch.",
    "habitat": "Slow rivers, canals, ponds, reservoirs and flooded ditches.",
    "where": "Choking waterways throughout Thailand, Vietnam, Cambodia and Laos, especially the Chao Phraya and Mekong systems.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "💜",
    "names": {
      "th": "ผักตบชวา",
      "vi": "Bèo tây",
      "km": "កំប្លោក",
      "lo": "ຜັກຕບ"
    }
  },
  {
    "id": "nat-reptile-tokay-gecko",
    "group": "reptile",
    "call": true,
    "commonName": "Tokay Gecko",
    "sciName": "Gekko gecko",
    "localNames": [
      "Tukkae",
      "Tac ke"
    ],
    "blurb": "A large, loud nocturnal gecko famous across the region for its barking call.",
    "idTips": "Big for a gecko, up to 30 cm including tail; bluish-grey skin covered with orange to red spots and pale tubercles; large unblinking eyes with vertical pupils; unmistakable loud call that sounds like 'to-kay, to-kay' repeated at night.",
    "habitat": "House walls, ceilings, tree trunks, rock crevices and temple ruins; thrives near human dwellings.",
    "where": "Common in homes and guesthouses across Thailand, Vietnam, Cambodia and Laos, especially in lowland towns and rural areas.",
    "dangerous": false,
    "dangerNote": "Not venomous, but the large jaws can deliver a firm bite if handled; otherwise harmless.",
    "emoji": "🦎",
    "names": {
      "th": "ตุ๊กแก",
      "vi": "tắc kè",
      "km": "តុកកែ",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-common-house-gecko",
    "group": "reptile",
    "call": true,
    "commonName": "Asian House Gecko",
    "sciName": "Hemidactylus frenatus",
    "localNames": [
      "Chingchok",
      "Thach sung"
    ],
    "blurb": "The small, pale gecko seen darting around lights and ceilings in nearly every building.",
    "idTips": "Small and slender, 8 to 12 cm; translucent pinkish-tan to grey skin that can lighten or darken; smooth body; soft chirping or clicking call of several rapid notes; often seen near lamps catching insects.",
    "habitat": "Walls, ceilings, around lights, in cracks of buildings and on garden plants.",
    "where": "Ubiquitous indoors and outdoors throughout Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦎",
    "names": {
      "th": "จิ้งจก",
      "vi": "thạch sùng",
      "km": "ជីងចក់",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-asian-water-monitor",
    "group": "reptile",
    "commonName": "Asian Water Monitor",
    "sciName": "Varanus salvator",
    "localNames": [
      "Hia",
      "Tua ngern tua thong",
      "Ky da"
    ],
    "blurb": "A huge semi-aquatic lizard, one of the largest reptiles a traveller will casually encounter.",
    "idTips": "Very large, commonly 1.5 to 2 m and occasionally longer; dark grey to blackish body with rows of pale yellowish spots; long forked tongue, powerful clawed limbs and a flattened keeled tail used for swimming; flicks tongue constantly while foraging.",
    "habitat": "Canals, rivers, mangroves, lakes, city park ponds and drainage channels.",
    "where": "Frequently seen in Bangkok parks and waterways, the Mekong region, and wetlands across all four countries.",
    "dangerous": false,
    "dangerNote": "Generally shy and will flee; large individuals can bite, scratch with claws or lash with the tail if cornered, and the mouth carries bacteria, so keep your distance.",
    "emoji": "🦎",
    "names": {
      "th": "ตัวเงินตัวทอง",
      "vi": "kỳ đà hoa",
      "km": "ត្រកួត",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-clouded-monitor",
    "group": "reptile",
    "commonName": "Clouded Monitor",
    "sciName": "Varanus nebulosus",
    "localNames": [
      "Lan",
      "Tako"
    ],
    "blurb": "A medium-sized, mostly terrestrial monitor of dry forest and farmland.",
    "idTips": "Up to about 1.2 m; grey-brown body patterned with clusters of small yellow spots forming a cloudy, marbled look; more upturned snout than the water monitor; usually found on land rather than in water.",
    "habitat": "Dry deciduous forest, scrub, plantations and forest edges.",
    "where": "Thailand, Cambodia and Laos in lowland forest and agricultural areas; less tied to water than the water monitor.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦎",
    "names": {
      "th": "ตะกวด",
      "vi": "kỳ đà vân",
      "km": "ត្រកួត",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-asian-box-turtle",
    "group": "reptile",
    "commonName": "Southeast Asian Box Turtle",
    "sciName": "Cuora amboinensis",
    "localNames": [
      "Tao haep",
      "Rua hop"
    ],
    "blurb": "A semi-aquatic freshwater turtle able to close its shell completely like a box.",
    "idTips": "Domed dark brown to black carapace up to about 20 cm; head black with bright yellow stripes running from the snout along the sides; hinged plastron (underside) that folds shut to seal the shell; short, blunt face.",
    "habitat": "Slow streams, marshes, rice paddies, ponds and ditches.",
    "where": "Wetlands and rice country across Thailand, Vietnam, Cambodia and Laos; sometimes seen in markets, where it is exploited.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐢",
    "names": {
      "th": "เต่าหับ",
      "vi": "rùa hộp Đông Nam Á",
      "km": "អណ្ដើក",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-chinese-softshell-turtle",
    "group": "reptile",
    "commonName": "Chinese Softshell Turtle",
    "sciName": "Pelodiscus sinensis",
    "localNames": [
      "Tao kradong",
      "Ba ba"
    ],
    "blurb": "A flat, leathery-shelled freshwater turtle widely farmed and eaten in the region.",
    "idTips": "Flattened, soft, leathery olive to greyish-brown shell up to about 30 cm with no hard plates; long neck and a distinctive tubular, snorkel-like snout; webbed feet; often buries itself in mud with only the nose showing.",
    "habitat": "Muddy-bottomed rivers, canals, ponds and rice paddies.",
    "where": "Lowland fresh waters across all four countries; very commonly seen in food markets and aquaculture ponds.",
    "dangerous": false,
    "dangerNote": "Can deliver a quick, painful bite with its sharp jaws and a flexible neck that reaches far back, so do not pick one up.",
    "emoji": "🐢",
    "names": {
      "th": "ตะพาบไต้หวัน",
      "vi": "ba ba trơn",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-reticulated-python",
    "group": "reptile",
    "commonName": "Reticulated Python",
    "sciName": "Malayopython reticulatus",
    "localNames": [
      "Ngu lueam",
      "Tran"
    ],
    "blurb": "The world's longest snake, a non-venomous constrictor sometimes found even in cities.",
    "idTips": "Very long and thick, commonly 3 to 6 m; tan to olive ground colour with a bold black net-like (reticulated) pattern of diamonds and a thin dark line running back from the eye; iridescent sheen in sunlight; no rattling, moves slowly when not striking.",
    "habitat": "Forest, riverbanks, marshes, plantations, drains and the edges of towns.",
    "where": "Throughout Thailand, Vietnam, Cambodia and Laos; occasionally removed from drains and gardens in cities like Bangkok.",
    "dangerous": true,
    "dangerNote": "Non-venomous, but a large individual is a powerful constrictor capable of inflicting a severe bite; do not approach or handle large pythons.",
    "emoji": "🐍",
    "names": {
      "th": "งูเหลือม",
      "vi": "trăn gấm",
      "km": "ពស់ថ្លាន់",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-oriental-whip-snake",
    "group": "reptile",
    "commonName": "Oriental Whip Snake",
    "sciName": "Ahaetulla prasina",
    "localNames": [
      "Ngu khiao hang mai",
      "Ran roi cha chiem"
    ],
    "blurb": "A slender, bright green tree snake often mistaken for a vine.",
    "idTips": "Extremely thin and long, up to about 1.8 m; vivid leaf-green (sometimes yellow or grey) body; pointed snout and unusual horizontal, keyhole-shaped pupils; moves gracefully through foliage and holds the front of its body out stiffly like a twig.",
    "habitat": "Shrubs, hedges, low trees, gardens and forest edge.",
    "where": "Common in gardens and parks across Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "Mildly venomous rear-fanged snake; bites are rare and effects on humans are minor, but it is best left undisturbed.",
    "emoji": "🐍",
    "names": {
      "th": "งูเขียวหัวจิ้งจก",
      "vi": "rắn roi thường",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-asian-common-toad",
    "group": "reptile",
    "call": true,
    "commonName": "Asian Common Toad",
    "sciName": "Duttaphrynus melanostictus",
    "localNames": [
      "Khang khok",
      "Con coc"
    ],
    "blurb": "The warty toad found in gardens and streets after rain throughout the region.",
    "idTips": "Stocky, 6 to 10 cm; dry, warty skin in shades of brown to brick-red; prominent bony ridges over the eyes and large kidney-shaped glands behind them; hops rather than leaps; males give a rapid chirping or croaking chorus near water.",
    "habitat": "Gardens, parks, drains, roadsides and around houses, breeding in pools and ditches.",
    "where": "Extremely common across Thailand, Vietnam, Cambodia and Laos, especially in the wet season.",
    "dangerous": false,
    "dangerNote": "Skin and gland secretions are toxic if ingested and can irritate the eyes; harmless if simply observed, but wash hands after any contact.",
    "emoji": "🐸",
    "names": {
      "th": "คางคก",
      "vi": "cóc nhà",
      "km": "គីង្គក់",
      "lo": "ຄັນຄາກ"
    }
  },
  {
    "id": "nat-reptile-banded-bullfrog",
    "group": "reptile",
    "call": true,
    "commonName": "Banded Bullfrog",
    "sciName": "Kaloula pulchra",
    "localNames": [
      "Op",
      "Ech uong"
    ],
    "blurb": "A round, chubby burrowing frog known for its loud bellowing call after rain.",
    "idTips": "Plump and balloon-shaped, about 5 to 8 cm; dark chocolate-brown back with two broad copper or salmon bands running down the sides; small head and short limbs; inflates its body when alarmed; deep, resonant mooing or bellowing call from temporary pools.",
    "habitat": "Gardens, leaf litter, rice fields and ponds; burrows into soil during dry spells.",
    "where": "Common across Thailand, Vietnam, Cambodia and Laos, especially noisy at the start of the rains.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐸",
    "names": {
      "th": "อึ่งอ่าง",
      "vi": "ễnh ương",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-common-green-tree-frog",
    "group": "reptile",
    "call": true,
    "commonName": "Common Tree Frog",
    "sciName": "Polypedates leucomystax",
    "localNames": [
      "Pad",
      "Chang"
    ],
    "blurb": "A slender pale tree frog often found on walls and plants near lights at night.",
    "idTips": "Slim, 5 to 8 cm; tan, cream or pale brown skin sometimes marked with four darker lengthwise stripes or spots; large round toe pads for climbing; pointed snout; a clattering or rattling call; makes foam nests over water.",
    "habitat": "Gardens, banana plants, bathrooms, walls and vegetation around ponds and paddies.",
    "where": "Widespread in Thailand, Vietnam, Cambodia and Laos, frequently seen around guesthouses at night.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐸",
    "names": {
      "th": "ปาดบ้าน",
      "vi": "ếch cây mép trắng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-asian-koel",
    "group": "bird",
    "commonName": "Asian Koel",
    "sciName": "Eudynamys scolopaceus",
    "localNames": [],
    "blurb": "A large cuckoo far more often heard than seen, famous for the male's loud, rising 'ko-EL' call repeated through the hot season.",
    "idTips": "About 40 cm and slender with a long tail and a pale greenish bill. Males are glossy blue-black; females and young are dark brown heavily spotted and barred with white. The eye is deep red. It is usually detected by its far-carrying, escalating call from dense foliage.",
    "habitat": "Wooded gardens, parks, plantations and forest edges, including in towns.",
    "where": "Common across Thailand, Vietnam, Cambodia and Laos, especially in the hot months.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-greater-coucal",
    "group": "bird",
    "commonName": "Greater Coucal",
    "sciName": "Centropus sinensis",
    "localNames": [],
    "blurb": "A big, heavy, crow-like bird of thickets, known for a deep, resonant 'coop-coop-coop' that carries a long way.",
    "idTips": "Around 48 cm, all glossy black except for rich chestnut wings; long, broad black tail; heavy black bill and a red eye. Clambers low through dense cover rather than flying far. The low, hollow, accelerating hoot is distinctive.",
    "habitat": "Dense scrub, tall grass, overgrown gardens, mangroves and forest edge.",
    "where": "Widespread and common across the region in lowland thickets.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-zebra-dove",
    "group": "bird",
    "commonName": "Zebra Dove",
    "sciName": "Geopelia striata",
    "localNames": [],
    "blurb": "A tiny, tame ground-dove whose soft, bubbling coo is one of the constant background sounds of towns and villages.",
    "idTips": "Small and slim, about 20-23 cm, pale grey-brown with fine black-and-white barring on the neck and sides and a long tail. Walks tamely on lawns and roadsides. The gentle, rapid cooing is prized by songbird keepers.",
    "habitat": "Gardens, parks, farmland, roadsides and open ground in towns.",
    "where": "Abundant across the region, especially in Thailand where it is also widely caged.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🕊️",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-spotted-dove",
    "group": "bird",
    "commonName": "Spotted Dove",
    "sciName": "Spilopelia chinensis",
    "localNames": [],
    "blurb": "A common medium dove recognised by the white-spotted black half-collar and a calm, repeated cooing.",
    "idTips": "About 30 cm, warm pinkish-brown with a broad black patch finely spotted white across the back of the neck. A long white-cornered tail shows in flight. The soft 'croo-croo-croo' is a familiar garden sound.",
    "habitat": "Gardens, farmland, scrub and open country, including towns.",
    "where": "Very common throughout Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🕊️",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-oriental-magpie-robin",
    "group": "bird",
    "commonName": "Oriental Magpie-Robin",
    "sciName": "Copsychus saularis",
    "localNames": [],
    "blurb": "A bold black-and-white garden songbird with a rich, varied, whistling song, often delivered from a high perch.",
    "idTips": "About 20 cm with a long tail often cocked upright. Males are glossy black above and on the breast with a white belly and a long white wing stripe; females are greyer. Sings a loud, musical, improvised song, especially at dawn.",
    "habitat": "Gardens, parks, villages, plantations and open woodland.",
    "where": "Common and widespread across the region, including in towns.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-red-whiskered-bulbul",
    "group": "bird",
    "commonName": "Red-whiskered Bulbul",
    "sciName": "Pycnonotus jocosus",
    "localNames": [],
    "blurb": "A perky crested bulbul with a red cheek-patch and a cheerful, chattering song, a favourite regional cage-bird.",
    "idTips": "About 20 cm, brown above and white below with a tall pointed black crest, a red patch behind the eye and red under the tail. Lively and social, giving bright, rollicking calls from bushes and wires.",
    "habitat": "Gardens, scrub, forest edge and cultivated land.",
    "where": "Common across the region; heavily trapped for song contests, especially in Thailand.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-coppersmith-barbet",
    "group": "bird",
    "commonName": "Coppersmith Barbet",
    "sciName": "Psilopogon haemacephalus",
    "localNames": [],
    "blurb": "A small green barbet named for its monotonous, metronomic 'tuk...tuk...tuk' call, like a coppersmith tapping metal.",
    "idTips": "About 17 cm, stocky and mostly green with a red forehead and breast patch, yellow face patches and a heavy bill. More often heard than seen among foliage. The steady, far-carrying single note repeats for minutes on end in the heat.",
    "habitat": "Gardens, parks, open woodland and fruiting trees, including in cities.",
    "where": "Common across the region wherever there are fruiting trees.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-common-tailorbird",
    "group": "bird",
    "commonName": "Common Tailorbird",
    "sciName": "Orthotomus sutorius",
    "localNames": [],
    "blurb": "A tiny, energetic warbler named for stitching leaves into a nest, with a surprisingly loud, ringing 'cheeup-cheeup' call.",
    "idTips": "About 12 cm, olive-green above and whitish below with a rufous crown and a long tail often held cocked. Skulks in low bushes but calls loudly and persistently. It sews leaves together with plant fibre to hide its nest.",
    "habitat": "Gardens, hedges, scrub and undergrowth, including in towns.",
    "where": "Very common across the region in gardens and low cover.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-collared-scops-owl",
    "group": "bird",
    "commonName": "Collared Scops Owl",
    "sciName": "Otus lettia",
    "localNames": [],
    "blurb": "A small, common night owl whose soft, single 'whoop' at regular intervals is a familiar after-dark sound of towns and gardens.",
    "idTips": "About 24 cm, greyish to warm brown with fine markings, small ear-tufts, a pale nuchal collar and dark eyes. Roosts hidden against bark by day. Detected mainly by the quiet, evenly spaced hoot after dusk.",
    "habitat": "Gardens, parks, groves and wooded edges, including in towns.",
    "where": "Common but nocturnal across the region.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦉",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-red-junglefowl",
    "group": "bird",
    "commonName": "Red Junglefowl",
    "sciName": "Gallus gallus",
    "localNames": [],
    "blurb": "The wild ancestor of the domestic chicken, whose ringing dawn crow rises from forest edges across the region.",
    "idTips": "The cockerel is spectacular with glossy golden-red neck hackles, dark green tail sickles, a red comb and grey legs; the hen is small and drab brown. It is shy in the wild, unlike village chickens. The crow is shorter and higher-pitched than a farmyard rooster's.",
    "habitat": "Forest edge, bamboo, scrub and clearings, often near villages.",
    "where": "Widespread across the region's forests and their margins.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐓",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-mammal-pileated-gibbon",
    "group": "mammal",
    "commonName": "Pileated Gibbon",
    "sciName": "Hylobates pileatus",
    "localNames": [],
    "blurb": "A tree-dwelling ape whose elaborate, whooping duet songs ring across the forest canopy at dawn.",
    "idTips": "Long-armed and tailless, swinging hand-over-hand through the canopy. Males are black with white hands, feet and a white face-ring; females are pale buff-grey with a black cap and chest. Pairs sing loud, rising, bubbling duets, mostly in the early morning.",
    "habitat": "Evergreen and semi-evergreen forest canopy.",
    "where": "Southeast Thailand, western Cambodia and southwest Laos; heard far more often than seen.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐒",
    "names": {"th": "", "vi": "", "km": "", "lo": ""},
    "call": true
  },
  {
    "id": "nat-bird-silver-eared-mesia",
    "group": "bird",
    "call": false,
    "commonName": "Silver-eared Mesia",
    "sciName": "Leiothrix argentauris",
    "localNames": [],
    "blurb": "A small, unmistakable babbler of cool highland forest — a genuinely Sapa-elevation species, not one a lowland Vietnam guide would cover.",
    "idTips": "About 15-17cm, with a black cap, a bold silvery-white ear patch, warm orange underparts, and a red-and-yellow wing panel. Travels in noisy, easy-to-spot mixed flocks, making it one of the more realistically spottable highland birds for a non-specialist.",
    "habitat": "Hill and submontane forest edges, roughly 1,000-2,500m — the same elevation band as Sapa town itself.",
    "where": "Documented in Hoang Lien National Park around Sapa and Fansipan; a highland species, not found in lowland tropical Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {"th": "", "vi": "", "km": "", "lo": ""}
  },
  {
    "id": "nat-plant-sinofalconer-rhododendron",
    "group": "plant",
    "call": false,
    "commonName": "Sinofalconer Rhododendron",
    "sciName": "Rhododendron sinofalconeri",
    "localNames": [],
    "blurb": "One of an estimated 30-40 rhododendron species native to the Hoang Lien Son range around Sapa and Fansipan — locally called the 'Kingdom of Rhododendron Flowers' — forming a dwarfed 'mini-forest' near the summit.",
    "idTips": "An evergreen tree to 6-8m with large leaves and pale-creamy-to-deep-yellow, many-flowered trusses carrying a small red basal blotch, blooming mid-spring.",
    "habitat": "High-altitude forest near the summit of Fansipan, roughly 1,600-2,500m.",
    "where": "Endemic to the Hoang Lien Son range around Sapa and Fansipan; not found in lowland tropical Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌸",
    "names": {"th": "", "vi": "", "km": "", "lo": ""}
  },
  {
    "id": "nat-insect-kaiser-i-hind",
    "group": "insect",
    "call": false,
    "commonName": "Kaiser-i-Hind",
    "sciName": "Teinopalpus imperialis",
    "localNames": [],
    "blurb": "A large, iridescent-green swallowtail documented specifically at Sapa and in Hoang Lien National Park — a highland species protected under CITES, never one to collect.",
    "idTips": "A large swallowtail with iridescent green wings; the male carries a chrome-yellow hindwing patch (grey in the female). Flies fast at tree-top level in morning sun, typically around 1,800-3,000m.",
    "habitat": "Highland forest, roughly 1,800-3,000m.",
    "where": "Rare and local; specifically documented at Sapa and within Hoang Lien National Park. Listed on CITES Appendix II.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦋",
    "names": {"th": "", "vi": "", "km": "", "lo": ""}
  },
  {
    "id": "nat-plant-fansipan-fir",
    "group": "plant",
    "call": false,
    "commonName": "Fansipan Fir",
    "sciName": "Abies delavayi subsp. fansipanensis",
    "localNames": [],
    "blurb": "A tall, critically endangered conifer found only in a narrow band high on Fansipan itself — genuinely rare, and honestly unlikely to be seen without a dedicated high-altitude trek beyond the cable car's upper station.",
    "idTips": "A tall emergent fir confined to roughly 2,600-2,800m on Fansipan's eastern flank. Fewer than about 400 mature trees are thought to remain, with no recorded regeneration in over 25 years.",
    "habitat": "A narrow high-altitude band on Fansipan itself.",
    "where": "Endemic to Fansipan — found nowhere else in the world.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌲",
    "names": {"th": "", "vi": "", "km": "", "lo": ""}
  },
  {
    "id": "nat-fungus-amanita-exitialis",
    "group": "fungus",
    "commonName": "Guangzhou Destroying Angel",
    "sciName": "Amanita exitialis",
    "localNames": [],
    "blurb": "One of the two mushrooms responsible for most fatal poisonings in Thailand. Small, plain and entirely white — it looks harmless.",
    "idTips": "A modest all-white mushroom: smooth white cap 4-7 cm, white gills, a white ring on the stem, and a cup-like sac (volva) at the base that is often buried and missed unless the whole base is dug up. There is no colour, smell or taste that warns you. Critically, laboratory work in Thailand has shown that deadly and edible Amanita species cannot be reliably separated by appearance alone — identification needs DNA analysis.",
    "habitat": "On the ground in broadleaf and oak forest, often near villages; fruits in the rainy season.",
    "where": "Northern and north-eastern Thailand and neighbouring uplands of Laos; the peak season is the May-September rains.",
    "dangerous": true,
    "dangerNote": "Deadly. Contains amatoxins that destroy the liver. Symptoms are delayed 6-24 hours — vomiting starts long after the poison is absorbed, then often eases, giving false reassurance while liver failure develops. Never eat any wild white mushroom with a ring and a cup at the base. If eaten, go to hospital immediately and say the word amatoxin; do not wait for symptoms.",
    "emoji": "☠️",
    "names": {
      "th": "เห็ดระโงกหิน",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-amanita-brunneitoxicaria",
    "group": "fungus",
    "commonName": "Brown Death Cap",
    "sciName": "Amanita brunneitoxicaria",
    "localNames": [],
    "blurb": "Named for its toxicity and described from Thailand — with A. exitialis, one of the main causes of fatal mushroom poisoning in the country.",
    "idTips": "A brown-capped Amanita with white gills, a white stem carrying a ring, and a sac-like volva at the buried base. The brown cap makes travellers assume it cannot be a 'death cap', which is exactly the error that kills. As with all Amanita, appearance alone is not a safe guide.",
    "habitat": "Forest floor in broadleaf and dipterocarp woodland during the wet season.",
    "where": "Thailand, with the same species group occurring across the wider Mekong uplands.",
    "dangerous": true,
    "dangerNote": "Deadly. Amatoxin poisoning with the same delayed 6-24 hour onset and the same deceptive recovery phase before liver failure. Assume any wild Amanita is lethal.",
    "emoji": "☠️",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-amanita-fuliginea",
    "group": "fungus",
    "commonName": "East Asian Death Cap",
    "sciName": "Amanita fuliginea",
    "localNames": [],
    "blurb": "A dark-capped amatoxin mushroom of East and Southeast Asia, recorded among the protoplasmic poisons behind deaths in the region.",
    "idTips": "Cap 3-7 cm, sooty grey to blackish-brown, often with a faintly radially-streaked surface; white gills; white stem with a ring; sac-like volva at the base. Small and unassuming.",
    "habitat": "Broadleaf forest floor, especially oak and chestnut, in the rainy season.",
    "where": "Recorded across southern China and mainland Southeast Asia including northern Thailand and Laos.",
    "dangerous": true,
    "dangerNote": "Deadly. Amatoxins, delayed onset, liver failure. There is no home test and no cooking method that makes it safe — boiling, drying and soaking do not destroy amatoxins.",
    "emoji": "☠️",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-chlorophyllum-molybdites",
    "group": "fungus",
    "commonName": "Green-spored Parasol",
    "sciName": "Chlorophyllum molybdites",
    "localNames": [],
    "blurb": "The single most common cause of mushroom poisoning worldwide, and a leading cause of gastrointestinal poisoning across all regions of Thailand. It grows on mown grass in towns.",
    "idTips": "A large, handsome parasol-shaped mushroom: cap 8-30 cm, white with coarse pale-brown scales, on a tall stem with a movable ring. The one reliable mark is the spore colour — mature gills turn a dull grey-green, and a spore print on white paper is green, never white. It often grows in rings or arcs on lawns after rain.",
    "habitat": "Lawns, parks, hotel grounds, playing fields, roadside verges and other mown grass — not deep forest.",
    "where": "Common throughout Thailand, Vietnam, Cambodia and Laos, including in cities, appearing within a day or two of heavy rain.",
    "dangerous": true,
    "dangerNote": "Not usually fatal but violently poisoning: severe vomiting and bloody diarrhoea for hours, occasionally needing a drip for dehydration. It is dangerous mainly because it looks exactly like the edible parasols people know from home. Children are most at risk because it grows where they play.",
    "emoji": "🍄",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-russula-subnigricans",
    "group": "fungus",
    "commonName": "Poison Blackening Russula",
    "sciName": "Russula subnigricans",
    "localNames": [],
    "blurb": "An innocuous-looking brittlegill that causes one of the nastiest poisonings in Asia — it breaks down muscle tissue.",
    "idTips": "A sturdy dull greyish-brown to sooty mushroom with a dry cap 5-12 cm, thick widely-spaced pale gills, and flesh that reddens when cut and then fails to blacken fully, unlike its harmless relatives. The distinction from edible blackening russulas is subtle and unreliable in the field.",
    "habitat": "Broadleaf and oak forest floor in the rainy season.",
    "where": "East and Southeast Asia, including northern Thailand, Laos and Vietnam.",
    "dangerous": true,
    "dangerNote": "Can be fatal. Causes rhabdomyolysis — muscle tissue breaks down and the released protein destroys the kidneys — often with chest pain and dark, tea-coloured urine several hours after eating. Requires hospital treatment. Do not eat wild russulas here.",
    "emoji": "☠️",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-psilocybe-cubensis",
    "group": "fungus",
    "commonName": "Magic Mushroom",
    "sciName": "Psilocybe cubensis",
    "localNames": [],
    "blurb": "The hallucinogenic mushroom sold openly in some backpacker areas as shakes or teas. It is illegal in all four countries, and openness of sale is not a sign of legality.",
    "idTips": "A medium mushroom with a golden to pale-tan cap that is often paler and more conical when young, purple-brown to blackish gills, a ring on the stem, and — the well-known field mark — bruising blue where handled or damaged. Grows directly on buffalo and cattle dung in pasture.",
    "habitat": "Cattle and buffalo pasture, growing straight out of dung, in the wet season.",
    "where": "Widespread in the region; associated with Koh Phangan and Vang Vieng in traveller lore, but present anywhere cattle graze.",
    "dangerous": true,
    "dangerNote": "Illegal in Thailand, Vietnam, Cambodia and Laos regardless of how openly it is offered; possession can mean arrest, a large fine, or a payment demanded to avoid one. Beyond the law: strength varies enormously between mushrooms, effects last 4-6 hours and cannot be stopped, and shakes bought from a bar are of unknown content and dose. Serious accidents in Vang Vieng have involved the river and the road, not the mushroom itself.",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดขี้ควาย",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-straw-mushroom",
    "group": "fungus",
    "commonName": "Straw Mushroom",
    "sciName": "Volvariella volvacea",
    "localNames": [],
    "blurb": "The small brown-grey mushroom in your tom yum. Grown on rice straw across the region and sold everywhere, usually still closed like little eggs.",
    "idTips": "Sold young as firm grey-brown ovals 3-5 cm, which is why it is called an egg mushroom; opened specimens have a grey-brown cap, a sac-like volva at the base, no ring on the stem, and — the key mark — pink gills and a pink spore print when mature.",
    "habitat": "Cultivated on beds of rice straw; also found wild on straw and compost heaps.",
    "where": "Sold fresh and canned in every market in Thailand, Vietnam, Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "Safe as sold and cooked — this caution is about wild collecting only. Young straw mushrooms and deadly Amanita 'eggs' look very alike: both are pale ovals with a sac at the base. Straw mushrooms have pink gills and a pink spore print; deadly Amanita have white gills, a white spore print and a ring on the stem. People have died overseas making exactly this substitution. Buy them, do not pick them.",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดฟาง",
      "vi": "nấm rơm",
      "km": "ផ្សិតចំបើង",
      "lo": "ເຫັດຟາງ"
    }
  },
  {
    "id": "nat-fungus-termite-mushroom",
    "group": "fungus",
    "commonName": "Termite Mushroom",
    "sciName": "Termitomyces spp.",
    "localNames": [],
    "blurb": "The most prized wild mushroom of the region — grown by termites in their nests and impossible to farm, so it appears only briefly and sells at a premium.",
    "idTips": "A pale grey-brown conical cap with a distinct sharp central point, white gills, and a remarkably long tapering root-like stem that runs deep into the ground to the termite nest. That deep pseudorhiza is the giveaway; sellers often leave it attached to prove authenticity.",
    "habitat": "Growing from underground termite nests in forest, orchards and field margins, after heavy rain.",
    "where": "Northeast Thailand, Laos, Cambodia and Vietnam; a highlight of wet-season markets and priced accordingly.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดโคน",
      "vi": "nấm mối",
      "km": "",
      "lo": "ເຫັດປວກ"
    }
  },
  {
    "id": "nat-fungus-astraeus",
    "group": "fungus",
    "commonName": "Barometer Earthstar",
    "sciName": "Astraeus asiaticus / A. odoratus",
    "localNames": [],
    "blurb": "A wet-season delicacy of Isan and Laos, sold as hard little brown balls by the bagful and eaten whole in soup — quite unlike any mushroom most visitors know.",
    "idTips": "Collected young as a firm brown sphere 2-4 cm, resembling a small potato and sold with soil still on it. Left to mature it splits open into a star of thick rays that flex open when damp and curl shut when dry, which is the origin of 'barometer'.",
    "habitat": "Sandy soil in dipterocarp forest, in partnership with the tree roots — which is why it cannot be cultivated.",
    "where": "Northeast and northern Thailand and across Laos in the May-October rains. It commands high prices, roughly 90-150 baht per kg in northern Thailand and 300-400 baht early in the season.",
    "dangerous": false,
    "dangerNote": "Buy it prepared or from a market seller. Only the young, solid white-fleshed interior is eaten; once the inside has turned powdery and brown it is past use.",
    "emoji": "🌰",
    "names": {
      "th": "เห็ดเผาะ",
      "vi": "",
      "km": "",
      "lo": "ເຫັດເຜາະ"
    }
  },
  {
    "id": "nat-fungus-split-gill",
    "group": "fungus",
    "commonName": "Split Gill",
    "sciName": "Schizophyllum commune",
    "localNames": [],
    "blurb": "Probably the most widespread mushroom on earth, and in Thailand and Laos a genuinely popular food — small, tough, fan-shaped and full of flavour.",
    "idTips": "Tiny fan or shell-shaped brackets 1-4 cm across, greyish-white and densely hairy on top, growing in overlapping tiers on dead wood. Underneath, the 'gills' are split lengthwise down their edges — visible with a close look and unique to this fungus. Dry specimens shrivel and revive after rain.",
    "habitat": "Dead and fallen hardwood, cut logs, rubber-tree stumps and firewood piles.",
    "where": "Everywhere in the region; sold in bundles in Thai and Lao markets, including Luang Prabang, and cooked in soups, omelettes and curries.",
    "dangerous": false,
    "dangerNote": "Eaten widely in Thailand, Laos and Vietnam and cultivated commercially. It is always cooked, never raw.",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดแครง",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-wood-ear",
    "group": "fungus",
    "commonName": "Wood Ear",
    "sciName": "Auricularia spp.",
    "localNames": [],
    "blurb": "The dark, rubbery, almost tasteless mushroom in noodle soups and spring rolls, valued for texture rather than flavour.",
    "idTips": "Thin, floppy, ear- or cup-shaped brackets 2-8 cm, translucent brown to near-black, gelatinous and springy when fresh, shrinking to hard black flakes when dried. No gills — the underside is smooth or faintly veined.",
    "habitat": "Dead hardwood logs and stumps, particularly in damp shade; widely farmed on sawdust blocks.",
    "where": "Sold fresh and dried across all four countries; a standard ingredient in Vietnamese spring rolls and Thai and Lao soups.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดหูหนู",
      "vi": "mộc nhĩ",
      "km": "",
      "lo": "ເຫັດຫູໜູ"
    }
  },
  {
    "id": "nat-fungus-oyster",
    "group": "fungus",
    "commonName": "Oyster Mushroom",
    "sciName": "Pleurotus spp.",
    "localNames": [],
    "blurb": "The soft, pale, fan-shaped mushroom stacked in bags at every fresh market — farmed, cheap and reliable.",
    "idTips": "Shell or fan-shaped caps 5-15 cm in white, pale grey or soft brown, growing in overlapping clusters. The gills run right down onto a short stem set to one side, rather than stopping at it. The flesh is soft and smells faintly sweet.",
    "habitat": "Cultivated on sawdust or straw blocks; wild relatives grow on dead hardwood.",
    "where": "Farmed and sold year-round throughout the region, often still attached to the growing bag.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดนางฟ้า",
      "vi": "nấm bào ngư",
      "km": "",
      "lo": "ເຫັດນາງຟ້າ"
    }
  },
  {
    "id": "nat-fungus-shiitake",
    "group": "fungus",
    "commonName": "Shiitake",
    "sciName": "Lentinula edodes",
    "localNames": [],
    "blurb": "The dense, meaty brown mushroom of upland farms, sold fresh in the cool north and dried everywhere else.",
    "idTips": "Domed tan to dark-brown cap 5-12 cm, often cracked into a pale pattern in dry weather, with crowded white gills and a fibrous, tough stem that is usually trimmed off before cooking. A strong savoury smell, especially when dried.",
    "habitat": "Cultivated on hardwood logs and sawdust blocks in cooler uplands.",
    "where": "Grown in northern Thailand, northern Vietnam and the Lao highlands; sold dried nationwide.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดหอม",
      "vi": "nấm hương",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-phlebopus",
    "group": "fungus",
    "commonName": "Thai Bolete",
    "sciName": "Phlebopus portentosus",
    "localNames": [],
    "blurb": "A large black-brown bolete that northern Thailand has managed to cultivate — unusual, since most boletes refuse to be farmed.",
    "idTips": "A heavy mushroom with a smooth, dry, olive- to black-brown cap 6-20 cm, and no gills at all: the underside is a sponge of fine yellow pores that bruise blue-green when pressed. The stem is thick and swollen.",
    "habitat": "Under trees in gardens, orchards and open forest; commercially cultivated in northern Thailand.",
    "where": "Northern and northeastern Thailand and Laos; a familiar sight in Chiang Mai wet-season markets.",
    "dangerous": false,
    "dangerNote": "This species is safe and sold commercially, but wild boletes generally are not a beginner's group — several regional look-alikes cause severe stomach upset.",
    "emoji": "🍄",
    "names": {
      "th": "เห็ดตับเต่า",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-lingzhi",
    "group": "fungus",
    "commonName": "Lingzhi (Reishi)",
    "sciName": "Ganoderma lingzhi",
    "localNames": [],
    "blurb": "The hard, glossy, fan-shaped bracket sold whole or sliced at herbal-medicine stalls and in tourist markets.",
    "idTips": "A woody, kidney- or fan-shaped bracket 5-25 cm with a lacquered, varnished-looking surface in deep red-brown shading to white at the growing edge, and a pale cream pore surface beneath. Hard and corky, not fleshy — it cannot be cut with a fingernail.",
    "habitat": "On the trunks and stumps of dead and dying hardwoods; also cultivated on logs and sawdust.",
    "where": "Sold across the region at medicine stalls and markets, usually dried whole or in slices for tea.",
    "dangerous": false,
    "dangerNote": "Traditionally taken as a bitter tea rather than eaten. It is not a food mushroom, and claimed medical benefits are not established; it can interact with blood-thinning medication.",
    "emoji": "🟤",
    "names": {
      "th": "เห็ดหลินจือ",
      "vi": "nấm linh chi",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fungus-ophiocordyceps",
    "group": "fungus",
    "commonName": "Zombie-Ant Fungus",
    "sciName": "Ophiocordyceps unilateralis",
    "localNames": [],
    "blurb": "Not food and not a danger — one of the strangest things you can spot on a rainforest walk: a fungus that takes over an ant's behaviour before killing it.",
    "idTips": "Look on the undersides of leaves about knee to waist height for a dead ant clamped by its jaws to a leaf vein, with a thin brown or orange stalk 1-3 cm growing out of the back of its head. Once you have seen one you will start finding them.",
    "habitat": "Humid closed-canopy rainforest, on leaves in the understorey.",
    "where": "Rainforest across the region — Khao Sok, Cat Tien, Bokor and the Bolaven Plateau are all good places to look.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐜",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-bodhi",
    "group": "plant",
    "commonName": "Sacred Fig (Bodhi Tree)",
    "sciName": "Ficus religiosa",
    "localNames": [],
    "blurb": "The tree the Buddha is said to have been sitting under when he reached enlightenment, and for that reason planted in the grounds of almost every temple in the region.",
    "idTips": "A big fig with a pale grey trunk and, unmistakably, heart-shaped leaves drawn out into a long slender tail-like tip that trembles in the lightest breeze. New leaves flush copper-pink. Often wrapped in saffron or striped cloth and standing on a built-up platform with offerings at its base.",
    "habitat": "Temple courtyards, monastery grounds and village shrines; occasionally self-seeded on walls and old buildings.",
    "where": "At Buddhist temples throughout Thailand, Cambodia and Laos, and at pagodas in Vietnam.",
    "dangerous": false,
    "dangerNote": "Cutting or damaging a bodhi tree at a temple causes real offence. Do not pull off leaves for a souvenir.",
    "emoji": "🌳",
    "names": {
      "th": "โพธิ์",
      "vi": "cây bồ đề",
      "km": "ដើមពោធិ៍",
      "lo": "ໂພ"
    }
  },
  {
    "id": "nat-plant-sugar-palm",
    "group": "plant",
    "commonName": "Sugar Palm",
    "sciName": "Borassus flabellifer",
    "localNames": [],
    "blurb": "Cambodia's national tree, and the shape that defines the Cambodian countryside — a lone straight trunk standing above flat green paddy.",
    "idTips": "A tall unbranched grey trunk to 30 m topped by a stiff crown of large fan-shaped (not feather-shaped) leaves. Female trees carry clusters of heavy brown fruit the size of a coconut. Look for bamboo ladders lashed up the trunks where climbers collect the sap.",
    "habitat": "Paddy field margins, village edges and dykes on the lowland plains.",
    "where": "Ubiquitous across Cambodia, and common in northeastern Thailand, southern Laos and southern Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌴",
    "names": {
      "th": "ตาล",
      "vi": "thốt nốt",
      "km": "ដើមត្នោត",
      "lo": "ຕານ"
    }
  },
  {
    "id": "nat-plant-jasmine",
    "group": "plant",
    "commonName": "Arabian Jasmine",
    "sciName": "Jasminum sambac",
    "localNames": [],
    "blurb": "The small white flower in the garlands sold at temple gates and traffic lights, and in Thailand the symbol of motherhood.",
    "idTips": "A scrambling shrub with glossy dark oval leaves and small waxy pure-white flowers, single or double, no more than 2-3 cm across, with an intense sweet scent that carries strongest after dark. The flowers yellow and bruise within a day of picking.",
    "habitat": "Gardens, pots, temple grounds and commercial flower farms.",
    "where": "Sold everywhere in the region as loose buds, strung garlands (phuang malai) and floating offerings.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🤍",
    "names": {
      "th": "มะลิ",
      "vi": "hoa nhài",
      "km": "ម្លិះ",
      "lo": "ມະລິ"
    }
  },
  {
    "id": "nat-plant-marigold",
    "group": "plant",
    "commonName": "Marigold",
    "sciName": "Tagetes erecta",
    "localNames": [],
    "blurb": "The dense orange pompom flower heaped in baskets outside every temple and shrine as an offering.",
    "idTips": "A knee-high annual with strongly-scented, finely divided dark-green leaves and tightly packed globular flower heads in saturated orange and yellow, 4-8 cm across. The smell of the crushed foliage is pungent and unmistakable.",
    "habitat": "Commercial flower fields, temple stalls, shrines and household gardens.",
    "where": "Grown and sold throughout the region for offerings, garlands and festivals.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🟠",
    "names": {
      "th": "ดาวเรือง",
      "vi": "cúc vạn thọ",
      "km": "ផ្កាម្លិះស្វាយ",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-areca",
    "group": "plant",
    "commonName": "Areca (Betel Nut) Palm",
    "sciName": "Areca catechu",
    "localNames": [],
    "blurb": "The slender palm whose nut, wrapped in a betel leaf with lime, is the region's oldest stimulant — and the reason for the deep red stains on pavements and older people's teeth.",
    "idTips": "A very slim, straight, ringed grey trunk 10-20 m with a small crown of feathery leaves — much more slender than a coconut palm. Clusters of egg-shaped fruit ripen from green to orange-yellow beneath the crown.",
    "habitat": "Village gardens, smallholdings and plantations, especially in wetter areas.",
    "where": "Grown across the region; chewing is now most common among older people and in rural and highland communities.",
    "dangerous": false,
    "dangerNote": "Chewing areca nut is strongly linked to mouth cancer and is classed as a carcinogen. It is offered to visitors as hospitality in some communities; declining politely is fine.",
    "emoji": "🌴",
    "names": {
      "th": "หมาก",
      "vi": "cây cau",
      "km": "ដើមស្លា",
      "lo": "ຫມາກ"
    }
  },
  {
    "id": "nat-plant-betel-pepper",
    "group": "plant",
    "commonName": "Betel Pepper",
    "sciName": "Piper betle",
    "localNames": [],
    "blurb": "The heart-shaped leaf that the areca nut is wrapped in — a climbing pepper vine, and nothing to do with the nut itself.",
    "idTips": "A climbing vine with glossy, slightly leathery heart-shaped leaves 8-15 cm long, alternating up a jointed green stem, with a peppery smell when torn. Trained up posts and trellises rather than allowed to sprawl.",
    "habitat": "Village gardens, trellises and market gardens in humid ground.",
    "where": "Cultivated throughout the region; the leaves are sold in bundles beside areca nut and slaked lime.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🍃",
    "names": {
      "th": "พลู",
      "vi": "trầu",
      "km": "ម្លូ",
      "lo": "ພູ"
    }
  },
  {
    "id": "nat-plant-golden-shower",
    "group": "plant",
    "commonName": "Golden Shower Tree",
    "sciName": "Cassia fistula",
    "localNames": [],
    "blurb": "Thailand's national tree and national flower, and one of the great sights of the hot season — bare branches hung with cascades of yellow.",
    "idTips": "A medium tree 8-15 m that drops much of its foliage and then flowers in long pendulous chains of bright yellow blossom 20-40 cm long. Later it carries distinctive slender cylindrical dark-brown pods up to 60 cm, like long thin sausages, which rattle when dry.",
    "habitat": "Roadsides, parks, temple grounds and open dry forest.",
    "where": "Throughout the region; flowers around March to May, peaking with Songkran.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "💛",
    "names": {
      "th": "ราชพฤกษ์",
      "vi": "muồng hoàng yến",
      "km": "ផ្ការាជព្រឹក្ស",
      "lo": "ດອກຄູນ"
    }
  },
  {
    "id": "nat-plant-flame-tree",
    "group": "plant",
    "commonName": "Flame Tree (Royal Poinciana)",
    "sciName": "Delonix regia",
    "localNames": [],
    "blurb": "The tree that turns whole streets scarlet at the start of the rains — in Vietnam, so bound up with the end of the school year that it has its own songs.",
    "idTips": "A wide, flat-topped, umbrella-shaped canopy of very fine twice-divided feathery leaflets, blazing with large scarlet-orange flowers 8-10 cm across. Afterwards it carries flat woody dark-brown pods up to 60 cm long that persist for months.",
    "habitat": "Avenues, schoolyards, parks and city streets.",
    "where": "Planted throughout the region; flowers roughly April to June. Hai Phong in Vietnam is nicknamed the red-flower city for it.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "❤️",
    "names": {
      "th": "หางนกยูง",
      "vi": "phượng vĩ",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-rain-tree",
    "group": "plant",
    "commonName": "Rain Tree",
    "sciName": "Samanea saman",
    "localNames": [],
    "blurb": "The enormous low-domed shade tree that whole markets, bus stops and temple courtyards are built underneath.",
    "idTips": "A short thick trunk carrying a vast spreading crown far wider than the tree is tall, of small feathery leaflets that fold shut at dusk and in rain — the origin of the name. Powderpuff flowers of fine pink stamens, and curved brown pods with sticky sweet pulp.",
    "habitat": "Village greens, roadsides, temple grounds, school yards and car parks.",
    "where": "Planted throughout the region as a shade tree, often reaching great size and age.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌳",
    "names": {
      "th": "ก้ามปู",
      "vi": "cây me tây",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-bougainvillea",
    "group": "plant",
    "commonName": "Bougainvillea",
    "sciName": "Bougainvillea spectabilis",
    "localNames": [],
    "blurb": "The blaze of magenta over guesthouse walls and hotel gates — and the colour is not from petals at all.",
    "idTips": "A vigorous thorny scrambler with papery, triangular, brightly coloured bracts in magenta, purple, orange, white or brick-red surrounding tiny inconspicuous cream tubular true flowers. Stems carry sharp curved spines.",
    "habitat": "Walls, fences, gates, roundabouts, pots and hotel gardens.",
    "where": "Planted everywhere in the region; flowers most heavily in the dry season.",
    "dangerous": false,
    "dangerNote": "The curved thorns are sharp and the sap can irritate skin. Watch children near clipped hedges.",
    "emoji": "💜",
    "names": {
      "th": "เฟื่องฟ้า",
      "vi": "hoa giấy",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-hibiscus",
    "group": "plant",
    "commonName": "Chinese Hibiscus",
    "sciName": "Hibiscus rosa-sinensis",
    "localNames": [],
    "blurb": "The big trumpet flower on hedges everywhere, with a long tongue of stamens sticking out of the middle.",
    "idTips": "A glossy-leaved shrub 1-4 m with flowers 8-15 cm across in red, pink, yellow, apricot or white, each with a prominent central column of fused stamens projecting well beyond the petals and tipped with five knobs. Individual flowers last only a day.",
    "habitat": "Hedges, gardens, hotel grounds and roadside plantings.",
    "where": "Planted throughout the region and flowering more or less year-round.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌺",
    "names": {
      "th": "ชบา",
      "vi": "hoa dâm bụt",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-tetrameles",
    "group": "plant",
    "commonName": "Thitpok",
    "sciName": "Tetrameles nudiflora",
    "localNames": [],
    "blurb": "The huge pale-trunked tree that grows out of the ruins at Ta Prohm — the one in every photograph of the temple.",
    "idTips": "A very large deciduous tree over 30 m with a smooth pale grey trunk and, most distinctively, enormous fan-shaped buttress roots that flare out and run along the ground for many metres. Leafless in the dry season. Note that sources genuinely disagree on which species the largest Ta Prohm trees are: thitpok and the silk-cotton tree (Ceiba pentandra) are both named, and the two are often confused in guidebooks.",
    "habitat": "Lowland semi-evergreen forest; at Angkor, rooted directly in and on the temple masonry.",
    "where": "Ta Prohm and Preah Khan at Angkor are the famous examples; the species occurs in forest across the region.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌳",
    "names": {
      "th": "สมพง",
      "vi": "cây thung",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-kapok",
    "group": "plant",
    "commonName": "Kapok (Silk-Cotton Tree)",
    "sciName": "Ceiba pentandra",
    "localNames": [],
    "blurb": "A giant with a spiny trunk whose pods burst into clouds of silky fluff that once stuffed every mattress and life jacket in the region.",
    "idTips": "A very tall tree to 40 m or more with a straight buttressed trunk, often studded with stout conical spines, and horizontal tiers of branches. Palmate leaves with 5-9 leaflets. Woody pods split to release masses of pale cotton-like fibre around small black seeds.",
    "habitat": "Villages, roadsides, temple grounds and open forest; often left standing when land is cleared.",
    "where": "Throughout the region; also one of the trees named among the great trees at Ta Prohm.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌳",
    "names": {
      "th": "นุ่น",
      "vi": "cây gòn",
      "km": "ដើមគ",
      "lo": "ງີ້ວ"
    }
  },
  {
    "id": "nat-plant-strangler-fig",
    "group": "plant",
    "commonName": "Strangler Fig",
    "sciName": "Ficus spp.",
    "localNames": [],
    "blurb": "Not a species but a strategy — a fig that starts life in the crown of another tree and lets gravity do the rest, ending as a hollow lattice around a host that has rotted away.",
    "idTips": "Look for a cage or basket of fused, flattened, snaking roots running down the trunk of another tree, sometimes with a hollow core where the host has died. Leaves are typically thick, glossy and oval; broken twigs and leaves bleed white latex. Small figs grow directly on the branches.",
    "habitat": "Rainforest and monsoon forest, and very commonly on temple ruins, old walls and bridges.",
    "where": "Region-wide; spectacular at Angkor, and often seen colonising buildings in towns.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌳",
    "names": {
      "th": "ไทร",
      "vi": "cây bóp cổ",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-yang-na",
    "group": "plant",
    "commonName": "Yang Na",
    "sciName": "Dipterocarpus alatus",
    "localNames": [],
    "blurb": "One of the towering dipterocarps that form the roof of the region's forests, with winged seeds that spin down like little helicopters.",
    "idTips": "A very tall straight-trunked tree to 40 m with a high clean bole and pale flaking bark. Large leathery leaves with prominent parallel veins and a concertina look when young. The fruit is a nut carrying two long strap-like red-brown wings that spin as it falls.",
    "habitat": "Evergreen and semi-evergreen forest, often along rivers; also planted along old roads and at temples.",
    "where": "Thailand, Laos, Cambodia and Vietnam; some enormous individuals are protected and cloth-wrapped as sacred trees.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌲",
    "names": {
      "th": "ยางนา",
      "vi": "dầu rái",
      "km": "",
      "lo": "ຢາງນາ"
    }
  },
  {
    "id": "nat-plant-sea-almond",
    "group": "plant",
    "commonName": "Sea Almond",
    "sciName": "Terminalia catappa",
    "localNames": [],
    "blurb": "The layered, pagoda-shaped shade tree on nearly every beach in the region — the one whose big leaves turn red before they fall.",
    "idTips": "Distinct horizontal tiers of branches giving a stepped, pagoda outline, with very large leathery obovate leaves clustered at the twig tips that turn yellow, then deep red, before dropping. Flattened almond-shaped fruit with a keel, green ripening to brown.",
    "habitat": "Sandy shores just above the tide line, coastal roads and beach resorts.",
    "where": "Coasts of Thailand, Vietnam and Cambodia, and planted inland for shade.",
    "dangerous": false,
    "dangerNote": "The fruit falls hard and heavy from a good height — do not pitch a tent or park directly underneath.",
    "emoji": "🌳",
    "names": {
      "th": "หูกวาง",
      "vi": "cây bàng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-casuarina",
    "group": "plant",
    "commonName": "Beach Sheoak",
    "sciName": "Casuarina equisetifolia",
    "localNames": [],
    "blurb": "The wispy, pine-looking tree in long windbreak rows behind the sand — not a pine at all.",
    "idTips": "Looks like a conifer from a distance, with drooping grey-green needle-like branchlets that are in fact jointed green twigs; the true leaves are microscopic scales at the joints. Small woody cone-like fruit about 1-2 cm. The ground beneath is deep in soft needle litter.",
    "habitat": "Sand dunes, beach ridges and planted coastal windbreaks and erosion barriers.",
    "where": "Beaches throughout Thailand, Vietnam and Cambodia.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌲",
    "names": {
      "th": "สนทะเล",
      "vi": "phi lao",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-nipa",
    "group": "plant",
    "commonName": "Nipa Palm",
    "sciName": "Nypa fruticans",
    "localNames": [],
    "blurb": "The trunkless palm that lines the creeks of the Mekong Delta, arching straight out of the mud — and thatches half the roofs you will see.",
    "idTips": "No visible trunk: huge upright feather leaves 5-9 m spring directly from a creeping underground stem in the mud. Fruit forms a hard woody brown ball the size of a football, made of tightly packed wedge-shaped segments.",
    "habitat": "Tidal, brackish creeks and estuaries, in soft mud.",
    "where": "The Mekong Delta and coastal Cambodia and southern Thailand; leaves are cut for thatch and walls, and the sap is tapped for sugar.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌴",
    "names": {
      "th": "จาก",
      "vi": "dừa nước",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-water-lily",
    "group": "plant",
    "commonName": "Water Lily",
    "sciName": "Nymphaea spp.",
    "localNames": [],
    "blurb": "Constantly confused with the lotus, and the difference is easy once you know it: water lilies float, lotuses stand up.",
    "idTips": "Leaves and flowers sit flat ON the water surface. Leaves are round with a distinct notch or slit cut from the edge to the centre, and have a waxy shine. Flowers are pointed-petalled, in white, pink, red, blue or purple, close in the afternoon. A lotus, by contrast, holds round unnotched leaves and flowers well clear of the water on stiff stalks.",
    "habitat": "Ponds, canals, moats, temple tanks and slow backwaters.",
    "where": "Everywhere in the region; the stalks (bua sai) are also eaten as a vegetable.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌸",
    "names": {
      "th": "บัวสาย",
      "vi": "hoa súng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-taro",
    "group": "plant",
    "commonName": "Taro (Elephant Ear)",
    "sciName": "Colocasia esculenta",
    "localNames": [],
    "blurb": "The huge arrow-shaped leaves crowding every ditch and wet margin, grown for the starchy corm beneath.",
    "idTips": "Clumps to 1.5 m of very large heart- to arrow-shaped leaves held on thick fleshy stalks, the leaf surface water-repellent so drops bead and run off. The leaf stalk joins the blade inside the notch, not at its edge.",
    "habitat": "Ditches, canal banks, paddy margins and wet garden plots.",
    "where": "Cultivated and wild throughout the region; corms and stalks are both eaten after cooking.",
    "dangerous": false,
    "dangerNote": "All parts contain needle-like calcium oxalate crystals and are intensely irritating raw — burning mouth and throat. Only ever eaten thoroughly cooked. Handling cut stems can itch.",
    "emoji": "🌿",
    "names": {
      "th": "บอน",
      "vi": "khoai nước",
      "km": "",
      "lo": "ເຜືອກ"
    }
  },
  {
    "id": "nat-plant-oil-palm",
    "group": "plant",
    "commonName": "Oil Palm",
    "sciName": "Elaeis guineensis",
    "localNames": [],
    "blurb": "The squat, shaggy palm in endless rows across southern Thailand — the source of the palm oil in almost everything.",
    "idTips": "A stout trunk to 20 m, usually still ragged with the stubs of old leaf bases, and a dense crown of large feather leaves with spiny stalks. Tight clusters of hard fruit at the crown ripen from black to orange-red and are cut out whole in heavy bunches.",
    "habitat": "Large plantations on lowland and former forest land.",
    "where": "Dominant in southern Thailand, with plantations also in Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌴",
    "names": {
      "th": "ปาล์มน้ำมัน",
      "vi": "cọ dầu",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-pandan",
    "group": "plant",
    "commonName": "Pandan",
    "sciName": "Pandanus amaryllifolius",
    "localNames": [],
    "blurb": "The long strap leaf tied in a knot and dropped into rice or coconut desserts — the green flavour and colour behind a lot of the region's sweets.",
    "idTips": "Long, narrow, bright-green strap-like leaves 40-80 cm in a fan-shaped clump, smooth-edged and without spines (unlike the big coastal screwpines), with a strong sweet grassy scent when bruised or torn.",
    "habitat": "Garden clumps, pots and market-garden beds in damp shade.",
    "where": "Grown throughout the region; sold in tied bundles at fresh markets.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🌿",
    "names": {
      "th": "ใบเตย",
      "vi": "lá dứa",
      "km": "",
      "lo": "ໃບຕຽຫອມ"
    }
  },
  {
    "id": "nat-plant-rattan",
    "group": "plant",
    "commonName": "Rattan",
    "sciName": "Calamus spp.",
    "localNames": [],
    "blurb": "The climbing palm behind every woven chair, basket and mat in the region — and the reason some jungle trails snag your clothing constantly.",
    "idTips": "A scrambling palm, not a tree: slender jointed canes carrying feather leaves whose stalks and long whip-like extensions are armed with backward-hooked spines that catch and hold. Cut cane is pale, solid and flexible.",
    "habitat": "Rainforest understorey and forest edge, climbing through other trees.",
    "where": "Forests across the region; young shoots of some species are eaten and the cane underpins the furniture trade.",
    "dangerous": false,
    "dangerNote": "The hooked spines tear skin and clothing and are the most common minor injury on off-trail forest walks. Never grab an unidentified vine for balance.",
    "emoji": "🪴",
    "names": {
      "th": "หวาย",
      "vi": "cây mây",
      "km": "",
      "lo": "ຫວາຍ"
    }
  },
  {
    "id": "nat-plant-mimosa",
    "group": "plant",
    "commonName": "Sensitive Plant",
    "sciName": "Mimosa pudica",
    "localNames": [],
    "blurb": "The weed that folds its leaves shut the instant you touch it — a guaranteed hit with children, and growing on almost every verge.",
    "idTips": "A low sprawling plant with fine twice-divided feathery leaflets that snap closed within a second of being touched and reopen after some minutes, and small pink spherical powderpuff flowers about 1 cm. The stems carry small sharp prickles.",
    "habitat": "Roadsides, lawns, waste ground and paths — anywhere disturbed and sunny.",
    "where": "Common throughout the region, an introduced weed.",
    "dangerous": false,
    "dangerNote": "The stems have fine prickles, so demonstrate it with a fingertip on a leaf rather than by grabbing the plant.",
    "emoji": "🌿",
    "names": {
      "th": "ไมยราบ",
      "vi": "cây trinh nữ",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-stinging-tree",
    "group": "plant",
    "commonName": "Stinging Tree",
    "sciName": "Dendrocnide spp.",
    "localNames": [],
    "blurb": "A relative of the nettle scaled up to a tree, with a sting far beyond anything a European nettle can manage — pain that can recur for weeks.",
    "idTips": "A shrub or small tree with large, soft, oval to heart-shaped leaves, often reddish-veined, held on stalks that join the blade well inside the edge. The whole plant — leaves, stalks and young stems — is covered in fine, almost invisible glassy hairs. Leaves often show insect holes, which is a clue that little else will eat them.",
    "habitat": "Rainforest edges, clearings, landslips and stream banks in the understorey.",
    "where": "The genus is native across Southeast Asia; the exact species and their distribution in Thailand and Laos are poorly documented, so treat any large soft-leaved understorey shrub with caution.",
    "dangerous": true,
    "dangerNote": "Do not touch. The silica-tipped hairs inject a toxin on the lightest contact, causing immediate severe burning that can last days and may flare again for weeks or months whenever the skin gets wet or cold. Do not rub the area — that drives the hairs in. Remove hairs by applying and peeling off adhesive tape (hair-removal wax strips work well), then use cold packs and painkillers, and seek medical help if the pain is severe or the reaction spreads.",
    "emoji": "⚠️",
    "names": {
      "th": "",
      "vi": "cây lá han",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-yellow-oleander",
    "group": "plant",
    "commonName": "Yellow Oleander",
    "sciName": "Cascabela thevetia",
    "localNames": [],
    "blurb": "A pretty yellow-flowered hedge shrub with some of the most dangerous seeds of any plant in the region — a handful of kernels can stop a heart.",
    "idTips": "A shrub 2-4 m with narrow, glossy, dark-green willow-like leaves arranged in spirals, and funnel-shaped bright-yellow (sometimes apricot) flowers 4-6 cm. The fruit is a distinctive flattened green globe that dries to black and splits into segments containing a few large pale kernels. Broken stems bleed sticky white latex.",
    "habitat": "Hedges, hotel and roadside plantings, car parks and gardens on poor dry soil.",
    "where": "Widely planted as an ornamental throughout the region.",
    "dangerous": true,
    "dangerNote": "All parts are poisonous, and the seed kernels intensely so — they contain cardiac glycosides that disturb the heart rhythm and are a well-known cause of fatal poisoning in South and Southeast Asia. Keep children away from the fallen fruit, never use the stems as skewers or cooking sticks, and do not burn the wood in a cooking fire. Any ingestion is a hospital matter.",
    "emoji": "☠️",
    "names": {
      "th": "รำเพย",
      "vi": "thông thiên",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-jatropha",
    "group": "plant",
    "commonName": "Physic Nut",
    "sciName": "Jatropha curcas",
    "localNames": [],
    "blurb": "A very common living-fence shrub whose seeds look and taste pleasantly nutty — which is precisely why children are poisoned by them.",
    "idTips": "A soft-wooded shrub 2-5 m with pale grey-green stems that bleed watery, sticky, staining sap when cut, and large three- to five-lobed maple-like leaves. Small green-yellow flowers, then green fruit in threes ripening to yellow-black, each holding three smooth dark seeds like small oval nuts.",
    "habitat": "Living fences and field boundaries, village edges, and biofuel plantings.",
    "where": "Planted throughout the region as a hedge that cattle will not eat.",
    "dangerous": true,
    "dangerNote": "The seeds are poisonous and, unusually, taste pleasant, so children eat several. Two or three can cause violent vomiting, cramping diarrhoea and dehydration. The sap stains skin and clothing and irritates eyes. Treat any ingestion by a child as urgent.",
    "emoji": "⚠️",
    "names": {
      "th": "สบู่ดำ",
      "vi": "cây cọc rào",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-castor",
    "group": "plant",
    "commonName": "Castor Bean",
    "sciName": "Ricinus communis",
    "localNames": [],
    "blurb": "A fast, weedy, handsome plant with mottled seeds that contain one of the most toxic natural substances known.",
    "idTips": "A coarse plant 1-4 m, often with red-purple stems and leaf stalks, carrying very large glossy palmate leaves with 7-11 pointed lobes. Spiny red-green seed capsules in upright clusters split to release glossy, beautifully mottled brown-and-grey beans about 1 cm — the mottling is unmistakable.",
    "habitat": "Waste ground, riverbanks, roadsides, rubbish tips and abandoned lots.",
    "where": "A common weed throughout the region.",
    "dangerous": true,
    "dangerNote": "The seeds contain ricin. Chewing even a very small number can be fatal, and children are drawn to the attractive mottled beans, which are also strung as beads. Swallowed whole and intact they may pass harmlessly, but chewed they are extremely dangerous. Never let a child collect them; any chewed seed is a medical emergency.",
    "emoji": "☠️",
    "names": {
      "th": "ละหุ่ง",
      "vi": "thầu dầu",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-brugmansia",
    "group": "plant",
    "commonName": "Angel's Trumpet",
    "sciName": "Brugmansia spp.",
    "localNames": [],
    "blurb": "A spectacular ornamental with huge hanging trumpet flowers, and a plant occasionally brewed deliberately as a drug — with disastrous results.",
    "idTips": "A soft-wooded shrub or small tree 2-5 m with large soft downy oval leaves and dramatic pendulous trumpet flowers 15-30 cm long in white, cream, peach or pink, strongly scented at night. Hanging downwards distinguishes Brugmansia from the related Datura, whose flowers point up.",
    "habitat": "Cool-climate gardens, guesthouse grounds and hill-town plantings; commonest in the northern uplands.",
    "where": "Planted as an ornamental, particularly in the cooler hills of northern Thailand, Vietnam and Laos.",
    "dangerous": true,
    "dangerNote": "Every part is strongly poisonous. It contains deliriant tropane alkaloids that cause frightening hallucinations with no insight, complete disorientation, racing heart, very high temperature and sometimes death; the dose is wildly unpredictable between plants. It is sometimes sold or suggested to travellers as a tea — do not drink any preparation of it. Ingestion needs immediate hospital care.",
    "emoji": "☠️",
    "names": {
      "th": "ลำโพง",
      "vi": "cà độc dược",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-rengas",
    "group": "plant",
    "commonName": "Rengas Tree",
    "sciName": "Gluta spp.",
    "localNames": [],
    "blurb": "A forest tree in the same family as poison ivy and the mango, whose black sap causes a severe, slow-blistering burn that people often do not connect to a tree they brushed past.",
    "idTips": "A tall forest tree with simple leathery leaves clustered towards the twig ends and, diagnostically, sap that runs milky then oxidises to a distinctive glossy black on the bark and on any cut. Freshly felled timber and sawdust are the worst hazard. Old wounds on the trunk are streaked black.",
    "habitat": "Lowland and hill evergreen forest; the timber is also worked locally.",
    "where": "Thailand, Laos, Cambodia and Vietnam. In Thailand the related rak yai has long been tapped for black lacquer, which is worked by skilled artisans who know how to handle it.",
    "dangerous": true,
    "dangerNote": "The sap causes a delayed contact dermatitis like a severe poison-ivy reaction — intense itching, redness, then weeping blisters appearing 12-48 hours after contact and lasting one to two weeks. Sensitivity worsens with repeat exposure. Wash the area with soap and plenty of water as soon as you suspect contact, do not scratch, and see a doctor for a widespread or facial reaction. Never handle fresh-cut timber or burn the wood — the smoke can affect eyes and airways.",
    "emoji": "⚠️",
    "names": {
      "th": "รักใหญ่",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-plant-cashew",
    "group": "plant",
    "commonName": "Cashew",
    "sciName": "Anacardium occidentale",
    "localNames": [],
    "blurb": "The source of the nut you are eating on the bus, growing in an arrangement no one expects — the nut hangs outside the fruit.",
    "idTips": "A low spreading tree 6-12 m with thick, rounded, blunt-tipped leathery leaves. Unmistakable in fruit: a fleshy pear-shaped red or yellow 'apple' with a single kidney-shaped grey-green nut hanging from its lower end.",
    "habitat": "Plantations and smallholdings on dry sandy soils; village gardens.",
    "where": "Grown widely in Vietnam — one of the world's largest producers — and in Cambodia and southern Thailand.",
    "dangerous": true,
    "dangerNote": "The nut shell contains a caustic oil closely related to the poison-ivy toxin, which blisters skin and lips; this is why cashews are always sold shelled and roasted and are never eaten raw from the tree. Do not try to crack a raw cashew from a plantation. The fleshy apple itself is harmless and is eaten and juiced locally.",
    "emoji": "⚠️",
    "names": {
      "th": "มะม่วงหิมพานต์",
      "vi": "cây điều",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-aedes-aegypti",
    "group": "insect",
    "commonName": "Dengue Mosquito",
    "sciName": "Aedes aegypti",
    "localNames": [],
    "blurb": "The most medically important animal in the region, and it bites in the daytime — which is why a bed net alone is not enough protection here.",
    "idTips": "A small dark mosquito with bright white markings: a lyre-shaped pattern of white lines on the back of the thorax and clear white bands ringing the legs, giving a striped appearance. It flies low, approaches from behind and below, and goes for ankles and elbows.",
    "habitat": "Cities and villages rather than jungle. It breeds in clean standing water in small containers — plant pots, tyres, buckets, roof gutters, the water tray under an air-conditioner, the dish under a potted plant.",
    "where": "Throughout Thailand, Vietnam, Cambodia and Laos, all of which are dengue-endemic, with the biggest surges in the monsoon months. Vietnam and Cambodia both reported rising case numbers through 2026.",
    "dangerous": true,
    "dangerNote": "Carries dengue, and also chikungunya and Zika. It bites by DAY, peaking early morning and late afternoon, so repellent during the day matters more than a net at night. Use a DEET or picaridin repellent on exposed skin, cover up at dawn and dusk, and tip out any standing water around where you are staying. Dengue is not preventable by tablets and there is no reliable traveller vaccine — bite avoidance is the whole defence. See a doctor for any fever within two weeks of being bitten, and do NOT take ibuprofen or aspirin for it (bleeding risk) — paracetamol only.",
    "emoji": "🦟",
    "names": {
      "th": "ยุงลาย",
      "vi": "muỗi vằn",
      "km": "",
      "lo": "ຍຸງລາຍ"
    }
  },
  {
    "id": "nat-insect-anopheles",
    "group": "insect",
    "commonName": "Malaria Mosquito",
    "sciName": "Anopheles spp.",
    "localNames": [],
    "blurb": "The night-biting mosquito behind malaria. Risk is now low in most places a traveller goes here, and concentrated in forested border areas.",
    "idTips": "Told from other mosquitoes by its posture: it rests with the body tilted at a steep angle, tail-up, rather than parallel to the surface. Wings often show blocks of pale and dark scales. It is quiet and bites mainly between dusk and dawn.",
    "habitat": "Breeds in clean, still or slow water — rice paddy edges, forest pools, stream margins. Rural and forested areas rather than city centres.",
    "where": "Malaria in the region is now largely confined to forested and hilly border zones — the Thai-Myanmar and Thai-Cambodian borders, parts of southern Laos and the Vietnamese central highlands. Bangkok, Hanoi, Ho Chi Minh City, Phnom Penh, Vientiane, Chiang Mai, Siem Reap and the main beach and island resorts are considered malaria-free.",
    "dangerous": true,
    "dangerNote": "Get current advice for your exact route from a travel clinic before you go — whether tablets are recommended depends on which areas you will enter, and the answer for a city-and-islands trip is usually no. Wherever you are: sleep under a net or in a screened room, cover up after dark, and use repellent. Any fever during or after a trip needs a malaria test even if you took tablets. Drug resistance is a known issue in the Greater Mekong, which is why the advice must come from a clinician and not an app.",
    "emoji": "🦟",
    "names": {
      "th": "ยุงก้นปล่อง",
      "vi": "muỗi sốt rét",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-asian-giant-hornet",
    "group": "insect",
    "commonName": "Asian Giant Hornet",
    "sciName": "Vespa mandarinia / V. soror",
    "localNames": [],
    "blurb": "The largest hornets in the world, and genuinely dangerous in numbers rather than as single insects.",
    "idTips": "Enormous — 3.5-5 cm with a wingspan to 7 cm — with a broad bright orange-yellow head that looks disproportionately large, dark brown thorax and a boldly banded orange-and-brown abdomen. The flight is loud and heavy enough to hear.",
    "habitat": "Forest and forest edge in hills and mountains; nests underground or in tree cavities.",
    "where": "Northern Thailand, northern Vietnam, northern Laos and the uplands generally.",
    "dangerous": true,
    "dangerNote": "A single sting is intensely painful; a mass attack near a disturbed nest is a medical emergency and has killed people. They defend a nest aggressively out to several metres. If one investigates you, stay still and let it leave — swatting and running provoke pursuit. Never poke into holes in banks or hollow trees. If stung many times, or if you have any breathing difficulty, swelling of the face or throat, or feel faint, get to a hospital immediately.",
    "emoji": "🐝",
    "names": {
      "th": "ต่อหัวเสือ",
      "vi": "ong bắp cày",
      "km": "",
      "lo": "ຕໍ່ຫົວເສືອ"
    }
  },
  {
    "id": "nat-insect-giant-honey-bee",
    "group": "insect",
    "commonName": "Giant Honey Bee",
    "sciName": "Apis dorsata",
    "localNames": [],
    "blurb": "Builds a single huge open comb hanging from a branch, cliff or building — and defends it in the thousands.",
    "idTips": "A large bee, around 2 cm, with a golden-brown abdomen banded in black. The real field mark is the nest: one enormous flat comb up to a metre across, hanging exposed with a living blanket of bees over it, often high on a tall tree, a cliff face, or under the eaves of a temple or water tower.",
    "habitat": "Tall trees, cliffs and tall buildings; combs are often clustered, with several on the same tree.",
    "where": "Widespread across all four countries; honey from these combs is collected and sold as wild honey.",
    "dangerous": true,
    "dangerNote": "Far more defensive than a domestic honeybee, and a disturbed colony pursues in numbers over long distances. Do not throw anything at a comb, and do not stand under one taking photographs with a flash. Mass stinging is a medical emergency regardless of allergy. If bees begin bumping into you, walk away immediately and get indoors or into a vehicle.",
    "emoji": "🐝",
    "names": {
      "th": "ผึ้งหลวง",
      "vi": "ong khoái",
      "km": "",
      "lo": "ເຜິ້ງຫຼວງ"
    }
  },
  {
    "id": "nat-insect-tiger-leech",
    "group": "insect",
    "commonName": "Tiger Leech",
    "sciName": "Haemadipsa picta",
    "localNames": [],
    "blurb": "The land leech that finds trekkers in wet forest — harmless, alarming, and best removed properly rather than pulled.",
    "idTips": "A small terrestrial leech 2-5 cm, olive-green to brown with distinct yellow-orange lengthwise stripes, waving the front of its body in the air from the tip of a leaf. Unlike aquatic leeches it moves fast, in a looping inchworm crawl, and it climbs.",
    "habitat": "Damp closed-canopy forest, especially after rain, on low vegetation beside trails.",
    "where": "Rainforest across the region — Khao Sok, Cat Tien, Bokor, the Bolaven Plateau and Sapa's wetter valleys.",
    "dangerous": false,
    "dangerNote": "Not dangerous and it carries no disease here, but the bite bleeds for a while because of the anticoagulant, and the tiger leech's bite is noticeably itchy. Do not pull, burn or salt it — that makes it regurgitate into the wound and raises the infection risk. Slide a fingernail or a card under the mouth to break the seal, then dress the bite and keep it clean. Leech socks or trousers tucked into boots are the real answer.",
    "emoji": "🪱",
    "names": {
      "th": "ทาก",
      "vi": "con đỉa",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-tropical-fire-ant",
    "group": "insect",
    "commonName": "Tropical Fire Ant",
    "sciName": "Solenopsis geminata",
    "localNames": [],
    "blurb": "A small reddish ant that swarms up a leg the instant you stand on its nest, then all sting at once.",
    "idTips": "Tiny, 3-6 mm, reddish-brown to orange with a darker abdomen, and workers in noticeably different sizes within one nest — the largest have a big square head. Nests are low untidy mounds of loose soil in sun, often at path edges and in lawns.",
    "habitat": "Open sunny ground: verges, lawns, beaches above the tide line, farmland, building sites.",
    "where": "Common throughout the region, including on beaches and in city parks.",
    "dangerous": true,
    "dangerNote": "The sting burns like a spark and leaves a small itchy pustule a day later that can last a week. The danger is numbers: brushing a nest brings dozens at once. Check before sitting or putting a bag down on sandy ground, and shake out shoes left outside. Multiple stings with any swelling beyond the site, or any difficulty breathing, needs urgent care.",
    "emoji": "🐜",
    "names": {
      "th": "มดคันไฟ",
      "vi": "kiến lửa",
      "km": "",
      "lo": "ມົດໄຟ"
    }
  },
  {
    "id": "nat-insect-giant-water-bug",
    "group": "insect",
    "commonName": "Giant Water Bug",
    "sciName": "Lethocerus indicus",
    "localNames": [],
    "blurb": "A huge flat brown bug that turns up under streetlights — and is sold at markets as one of the region's most prized flavours.",
    "idTips": "Very large and flat, 6-8 cm, oval, uniformly khaki-brown, with strongly hooked front legs for grabbing prey and a short sharp beak. Comes to lights at night in numbers during the rains.",
    "habitat": "Ponds, paddies and slow water; disperses by flying at night, which is when people catch them at lights.",
    "where": "Across the region; the male's scent gland gives Thai maeng da chilli paste and Lao and Isan dips their distinctive intense pear-and-apple aroma.",
    "dangerous": true,
    "dangerNote": "Handle with care rather than fear: it hunts by stabbing, and it will stab a finger that grips it. The bite is famously painful — the insect's nickname in some places is the toe-biter — but it is not venomous in a medical sense and does no lasting harm. As food it is entirely safe and highly regarded.",
    "emoji": "🪲",
    "names": {
      "th": "แมงดานา",
      "vi": "cà cuống",
      "km": "",
      "lo": "ແມງດານາ"
    }
  },
  {
    "id": "nat-insect-thai-tarantula",
    "group": "insect",
    "commonName": "Thai Zebra Tarantula",
    "sciName": "Cyriopagopus albostriatus",
    "localNames": [],
    "blurb": "The tarantula behind Cambodia's fried spiders — a ground-burrowing species, not a web-builder.",
    "idTips": "A stocky black tarantula with a leg span around 12 cm, marked with crisp white or cream stripes on the legs. Lives in a silk-lined burrow in the ground rather than in a web.",
    "habitat": "Burrows in dry forest, scrub, plantations and field banks.",
    "where": "Thailand, Cambodia and Laos. Fried tarantula is a well-known speciality of Skuon in Cambodia, on the road between Phnom Penh and Kampong Cham.",
    "dangerous": true,
    "dangerNote": "Defensive rather than aggressive, but it will bite if handled and this genus has a reputation for a bad temper. The venom is not dangerous to a healthy adult — the bite is mechanically painful, like deep puncture wounds, and can throb for a day. Do not handle wild tarantulas, and do not put a hand into a burrow. Clean the wound and watch for infection.",
    "emoji": "🕷️",
    "names": {
      "th": "บึ้ง",
      "vi": "",
      "km": "",
      "lo": "ບຶ້ງ"
    }
  },
  {
    "id": "nat-insect-golden-orb-weaver",
    "group": "insect",
    "commonName": "Golden Orb-weaver",
    "sciName": "Trichonephila spp.",
    "localNames": [],
    "blurb": "The big yellow-and-black spider sitting in an enormous, faintly golden web across a forest path.",
    "idTips": "Females are large and unmistakable — a body 3-5 cm on very long legs with dark and yellow bands and tufts of hair, hanging head-down in the middle. Males are tiny and sit at the web's edge. The silk has a genuine golden sheen in sunlight and the web can be over a metre across.",
    "habitat": "Forest edges, gardens, trail gaps and between buildings.",
    "where": "Common throughout the region; you will walk into one before you see it.",
    "dangerous": false,
    "dangerNote": "Harmless and worth stopping to look at. It bites only if squeezed, and the effect is no worse than a bee sting locally. Carry a stick held up in front of you on an overgrown trail rather than clearing webs with your face.",
    "emoji": "🕷️",
    "names": {
      "th": "แมงมุมใยทอง",
      "vi": "nhện vàng",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-lantern-bug",
    "group": "insect",
    "commonName": "Lantern Bug",
    "sciName": "Pyrops spp.",
    "localNames": [],
    "blurb": "One of the most beautiful insects in the region — a planthopper with a long upturned snout, sitting head-down on a tree trunk.",
    "idTips": "About 3-4 cm with a slender, upward-curving red-and-white snout longer than its head, brilliant green or red-brown wings spotted with white, and orange-yellow hindwings that flash when it hops. Sits vertically on the trunk of a longan or lychee tree in small groups.",
    "habitat": "Trunks of forest and orchard trees, especially longan, lychee and other fruit trees.",
    "where": "Northern Thailand, Vietnam, Laos and Cambodia; commonest in and around orchards.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦋",
    "names": {
      "th": "แมลงงวงช้าง",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-insect-mound-termite",
    "group": "insect",
    "commonName": "Mound-building Termite",
    "sciName": "Macrotermes spp.",
    "localNames": [],
    "blurb": "The builders of the hard earth towers you see in every dry forest — and the farmers of the region's most prized mushroom.",
    "idTips": "The insects themselves are pale and soft, with soldiers carrying oversized dark heads and jaws. What you actually see is the mound: a hard, wind-sculpted earth tower from knee-height to over two metres, rock-solid, often with a small tree growing out of it. After the first heavy rain, winged reproductives pour out in clouds at dusk.",
    "habitat": "Dry dipterocarp and deciduous forest, scrub and farmland.",
    "where": "Throughout the region. The termite mushroom (Termitomyces) grows only from these nests, which is why it cannot be farmed.",
    "dangerous": false,
    "dangerNote": "Harmless to people, though soldiers give a sharp pinch if you dig into a mound. The mounds themselves are habitat for a lot else — do not break them open. The winged swarmers that come to lights after the first rains are edible and are collected and fried.",
    "emoji": "🐜",
    "names": {
      "th": "ปลวก",
      "vi": "mối",
      "km": "",
      "lo": "ປວກ"
    }
  },
  {
    "id": "nat-insect-blister-beetle",
    "group": "insect",
    "commonName": "Blister Beetle",
    "sciName": "Mylabris / Epicauta spp.",
    "localNames": [],
    "blurb": "A pretty beetle that leaves a chemical burn if you brush it off your skin instead of blowing it away.",
    "idTips": "Slender, soft-bodied beetles 1-3 cm, often boldly patterned in black with orange, yellow or red bands or spots, with a narrow neck and a head wider than the thorax. Frequently found on flowers in numbers.",
    "habitat": "Flowering plants, field margins, gardens; comes to lights at night.",
    "where": "Throughout the region.",
    "dangerous": true,
    "dangerNote": "It does not bite or sting — the harm is chemical. Crushed or pressed against skin it releases cantharidin, which causes a painful blistering burn over the following hours, and is much worse if rubbed into an eye. Blow it off or flick it away with a piece of paper; never slap one on your skin. Wash the area with soap and water if one is crushed on you, and see a doctor for eye exposure or a large blister.",
    "emoji": "🪲",
    "names": {
      "th": "ด้วงน้ำมัน",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-indochinese-spitting-cobra",
    "group": "reptile",
    "commonName": "Indochinese Spitting Cobra",
    "sciName": "Naja siamensis",
    "localNames": [],
    "blurb": "The one cobra here that attacks your eyes from a distance rather than needing to reach you.",
    "idTips": "A medium, fairly slender cobra to about 1.5 m, hugely variable: the striking black-and-white speckled or striped phase is common in central Thailand, western animals are mostly black, and elsewhere plain brown. Hoods like any cobra. It can spray venom forward at a face from up to 2.5 metres.",
    "habitat": "Dry lowland forest, scrub, farmland, plantations and the edges of villages and towns.",
    "where": "Common and widespread in Thailand, and present in Cambodia, Laos and Vietnam.",
    "dangerous": true,
    "dangerNote": "Venomous, and uniquely a spitter: it causes the great majority of cobra spat-venom eye injuries in Thailand, though the monocled cobra is behind most actual cobra bites. Back away — do not crouch to photograph a hooding cobra. If venom reaches an eye, flush it immediately with lots of clean water or any bland fluid for 15 minutes and get to hospital; untreated it can scar the cornea and cost sight. A bite needs antivenom and a hospital, not a tourniquet.",
    "emoji": "🐍",
    "names": {
      "th": "งูเห่าพ่นพิษ",
      "vi": "hổ mang phun nọc",
      "km": "",
      "lo": "ງູເຫົ່າ"
    }
  },
  {
    "id": "nat-reptile-russells-viper",
    "group": "reptile",
    "commonName": "Russell's Viper",
    "sciName": "Daboia siamensis",
    "localNames": [],
    "blurb": "One of the most medically serious snakes in Asia — heavy-bodied, well camouflaged in farmland, and it does not move away.",
    "idTips": "A thick, stocky viper to about 1.2 m, pale to mid-brown with three rows of large dark chain-like or almond-shaped blotches ringed in black and white down the back. The head is broad and triangular with a blunt snout. It hisses very loudly when threatened.",
    "habitat": "Open country rather than forest: farmland, grassland, scrub, field bunds and the edges of villages.",
    "where": "Thailand, Cambodia and parts of Laos and Vietnam, usually in agricultural land.",
    "dangerous": true,
    "dangerNote": "Venomous and dangerous. The bite causes severe pain and swelling, widespread bleeding and clotting failure, and can lead to kidney failure — it needs antivenom and hospital care urgently. It relies on camouflage and often stays put rather than fleeing, so most bites happen to a foot or hand placed near one. Watch where you step in farmland at dusk, use a torch, and never put a hand into vegetation you cannot see into.",
    "emoji": "🐍",
    "names": {
      "th": "งูแมวเซา",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-wolf-snake",
    "group": "reptile",
    "commonName": "Common Wolf Snake",
    "sciName": "Lycodon spp.",
    "localNames": [],
    "blurb": "A completely harmless snake that looks so much like a deadly krait that it is the reason you must never rely on banding alone.",
    "idTips": "Small and slender, 40-70 cm, dark brown to black with pale cream or white crossbands. The bands are noticeably THINNER than a krait's and often break up or fade towards the tail, the head is flattened and slightly wider than the neck, and the eye is comparatively large. It is a common house snake and is often found indoors.",
    "habitat": "Around buildings, gardens, walls and rubbish, hunting geckos at night.",
    "where": "Common throughout the region, including inside houses and guesthouses.",
    "dangerous": false,
    "dangerNote": "Genuinely harmless — it may bite if grabbed and it barely breaks skin. The important point is the reverse direction: this snake is routinely mistaken for a Malayan krait, and the mistake also runs the other way, which is lethal. There is NO reliable field mark that separates them with certainty. Treat every banded snake as if it were a krait, do not handle it, and if you are bitten by any banded snake go to hospital and let them decide.",
    "emoji": "🐍",
    "names": {
      "th": "งูปล้องฉนวน",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-burmese-python",
    "group": "reptile",
    "commonName": "Burmese Python",
    "sciName": "Python bivittatus",
    "localNames": [],
    "blurb": "A giant, placid constrictor that turns up in city canals and temple grounds as often as in forest.",
    "idTips": "Very large and heavy — commonly 3-4 m — patterned in irregular dark brown saddles on tan, with a distinct pale arrowhead marking on top of the head. Shorter-headed and blunter than the reticulated python, and the pattern is browner and less geometric.",
    "habitat": "Marshes, canals, paddies, forest and scrub; frequently found in Bangkok's canals and drains.",
    "where": "Throughout the region, and remarkably tolerant of urban areas.",
    "dangerous": false,
    "dangerNote": "Not venomous and generally slow to react, but a large python's bite is a serious wound of dozens of backward-facing teeth, and a big animal can constrict. Never handle one, and never let anyone drape one over you for a photograph. In Thailand, call 199 and the fire service will remove a snake from a property — this is a routine, free call-out.",
    "emoji": "🐍",
    "names": {
      "th": "งูหลาม",
      "vi": "trăn đất",
      "km": "",
      "lo": "ງູຫຼວມ"
    }
  },
  {
    "id": "nat-reptile-golden-tree-snake",
    "group": "reptile",
    "commonName": "Golden Tree Snake",
    "sciName": "Chrysopelea ornata",
    "localNames": [],
    "blurb": "The flying snake — it flattens its body and glides between trees, and it lives happily in city gardens.",
    "idTips": "Slender and around a metre, bright green-yellow with a black network pattern, sometimes with orange-red flecks along the spine. Very fast and agile, climbing vertical walls and tree trunks with ease. In a glide it flattens its body into a ribbon and undulates through the air.",
    "habitat": "Gardens, parks, palms, roofs and forest edge; common in Bangkok and other cities.",
    "where": "Widespread across all four countries.",
    "dangerous": false,
    "dangerNote": "Mildly venomous but rear-fanged and of no real consequence to people — a bite causes local swelling at worst. It is one of the most common snakes in urban gardens here and is entirely harmless to have around.",
    "emoji": "🐍",
    "names": {
      "th": "งูเขียวดอกหมาก",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-siamese-crocodile",
    "group": "reptile",
    "commonName": "Siamese Crocodile",
    "sciName": "Crocodylus siamensis",
    "localNames": [],
    "blurb": "Critically endangered and effectively gone from the wild across most of its range — but very much present in farms and a few protected wetlands.",
    "idTips": "A medium crocodile, usually 2-3 m, olive to dark green with a relatively broad, smooth snout and a distinct raised bony crest between the eyes. Juveniles are yellow-green with black bands.",
    "habitat": "Slow rivers, lakes, marshes and oxbows.",
    "where": "Wild populations survive mainly in Cambodia's Cardamom Mountains and a few Lao and Vietnamese sites. The animals most visitors see are on Siem Reap and Tonle Sap crocodile farms.",
    "dangerous": true,
    "dangerNote": "Wild encounters are very unlikely, but crocodiles are dangerous at any size and farm enclosures are not always as secure as they look. Never dangle limbs over a farm enclosure rail, and heed local advice about swimming in Cambodian rivers and lakes. Around Tonle Sap and the Cardamoms, ask locally before entering the water.",
    "emoji": "🐊",
    "names": {
      "th": "จรเข้น้ำจืด",
      "vi": "cá sấu Xiêm",
      "km": "ក្រពើ",
      "lo": "ແຂ້"
    }
  },
  {
    "id": "nat-reptile-saltwater-crocodile",
    "group": "reptile",
    "commonName": "Saltwater Crocodile",
    "sciName": "Crocodylus porosus",
    "localNames": [],
    "blurb": "The largest living reptile. Very rare in this region now, but the one animal here where a mistake is unsurvivable.",
    "idTips": "Enormous — males can exceed 6 m — grey to dark brown with a heavy, broad snout, a wide head and no bony crest between the eyes. Juveniles pale tan with dark bars.",
    "habitat": "Estuaries, mangroves, coastal creeks and open sea; it genuinely travels between islands.",
    "where": "Effectively extinct in Thailand and Vietnam's wild and very rare in Cambodia, but individuals occasionally appear along coasts and in mangroves, and the species is farmed.",
    "dangerous": true,
    "dangerNote": "If you are ever anywhere one is reported, take local warning signs completely literally: do not swim, wade, clean fish or stand at the water's edge in estuaries and mangrove creeks, and do not assume a small creek is too small. Attacks are usually fatal. This is one where local knowledge beats any guide.",
    "emoji": "🐊",
    "names": {
      "th": "จรเข้น้ำเค็ม",
      "vi": "cá sấu hoa cà",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-green-sea-turtle",
    "group": "reptile",
    "commonName": "Green Sea Turtle",
    "sciName": "Chelonia mydas",
    "localNames": [],
    "blurb": "The sea turtle you are most likely to snorkel with, grazing on seagrass in the shallows.",
    "idTips": "A large turtle, shell 80-120 cm, smooth and rounded with olive-brown to dark shell plates that do not overlap, and a small blunt head with a single pair of scales between the eyes. Grazes head-down on seagrass beds.",
    "habitat": "Seagrass meadows, reef flats and shallow bays; nests on sandy beaches.",
    "where": "The Andaman coast and Gulf of Thailand, Vietnam's Con Dao and Nha Trang, and Cambodia's islands.",
    "dangerous": false,
    "dangerNote": "Protected everywhere in the region. Do not touch, chase, ride or feed a turtle, and never block one heading up to breathe — that is what actually harms them. Stay several metres back and let it come to you. Buying any turtle-shell product is illegal and drives the trade.",
    "emoji": "🐢",
    "names": {
      "th": "เต่าตนุ",
      "vi": "vích",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-hawksbill-turtle",
    "group": "reptile",
    "commonName": "Hawksbill Turtle",
    "sciName": "Eretmochelys imbricata",
    "localNames": [],
    "blurb": "The turtle whose beautiful shell nearly finished it — critically endangered, and the reason tortoiseshell souvenirs must never be bought.",
    "idTips": "Shell 60-90 cm with a strongly serrated rear edge and thick overlapping plates that give a tiled look, richly marbled amber, brown and black. The head is narrow with a sharply hooked, bird-like beak, which is the give-away.",
    "habitat": "Coral reefs, where it feeds on sponges; nests on small sandy beaches.",
    "where": "Reefs of the Andaman Sea, the Gulf of Thailand, Cambodia's islands and Con Dao in Vietnam.",
    "dangerous": false,
    "dangerNote": "Critically endangered and fully protected. Anything sold as tortoiseshell — combs, bracelets, sunglasses frames, inlay — is almost certainly this animal, is illegal to buy or take home, and is the single biggest reason it is disappearing. Watch it, keep your distance, buy nothing.",
    "emoji": "🐢",
    "names": {
      "th": "เต่ากระ",
      "vi": "đồi mồi",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-flying-lizard",
    "group": "reptile",
    "commonName": "Flying Lizard",
    "sciName": "Draco spp.",
    "localNames": [],
    "blurb": "A small lizard that glides between tree trunks on ribbed wings — easy to miss until one launches.",
    "idTips": "A slim lizard 20 cm including the whip tail, bark-coloured and almost invisible pressed to a trunk. In a glide it spreads bright orange, yellow or spotted flaps of skin between elongated ribs. Males flash a coloured throat flag when displaying.",
    "habitat": "Tree trunks in open forest, plantations, parks and gardens, especially rubber and coconut.",
    "where": "Throughout the region wherever there are trees, including in towns.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦎",
    "names": {
      "th": "กิ้งก่าบิน",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-reptile-sun-skink",
    "group": "reptile",
    "commonName": "Common Sun Skink",
    "sciName": "Eutropis multifasciata",
    "localNames": [],
    "blurb": "The glossy bronze lizard rustling through leaf litter beside every path — probably the reptile you will see most often.",
    "idTips": "A sturdy skink 20-30 cm, glossy bronze-brown above with a coppery sheen, often with an orange or reddish flush along the flanks (brightest in breeding males) and faint dark stripes. Short legs, smooth overlapping scales, and a fast rustling dash for cover.",
    "habitat": "Leaf litter, gardens, walls, plantation floors, roadsides and temple grounds.",
    "where": "Extremely common across all four countries.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦎",
    "names": {
      "th": "จิ้งเหลนบ้าน",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-sea-urchin",
    "group": "fish",
    "commonName": "Long-spined Sea Urchin",
    "sciName": "Diadema setosum",
    "localNames": [],
    "blurb": "The commonest painful injury on a reef holiday, and it is almost always caused by standing up in the wrong place.",
    "idTips": "A black globe 5-9 cm carrying very long, fine, needle-sharp black spines up to 30 cm, with a bright orange ring and five white dots on top of the body. Sits in crevices and on rubble, often in groups, and is easy to miss in shadow.",
    "habitat": "Reef flats, rubble, seagrass and rocky shallows — including exactly the depth you stand up in.",
    "where": "Reefs and rocky shores throughout Thailand, Vietnam and Cambodia.",
    "dangerous": true,
    "dangerNote": "The brittle spines puncture deeply and snap off in the wound, and they hurt for hours. Do not walk on a reef, and put fins on in deeper water rather than standing on rubble. If you are spined: soak the area in water as hot as you can tolerate for 30-45 minutes, remove any spine you can grip cleanly, and see a doctor for spines in a joint or the sole of a foot, or for any spreading redness — fragments left in cause infection. The black dye is harmless and fades.",
    "emoji": "🌑",
    "names": {
      "th": "หอยเม่น",
      "vi": "cầu gai",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-fire-coral",
    "group": "fish",
    "commonName": "Fire Coral",
    "sciName": "Millepora spp.",
    "localNames": [],
    "blurb": "Not a coral at all, and it burns on contact — the mustard-coloured growth people grab for balance.",
    "idTips": "Smooth, hard, mustard-yellow to tan branching or plate-like growths with pale, almost white tips, and a finely pitted surface without the obvious cups of a true coral. Often forms sheets over dead coral or encrusts gorgonians and ropes.",
    "habitat": "Shallow reef tops and edges in bright light, and on wrecks and mooring lines.",
    "where": "Reefs throughout the Andaman Sea, the Gulf of Thailand and Vietnamese and Cambodian waters.",
    "dangerous": true,
    "dangerNote": "Brushing it causes an immediate hot sting, then a red, itching, blistering welt that can last a week or more and may flare again later. Rinse with seawater — NOT fresh water, which fires more stinging cells — then douse with vinegar if available, and do not rub. Never grab a reef for balance, and wear a rash vest. See a doctor for a large area, a facial sting, or any breathing difficulty.",
    "emoji": "🔥",
    "names": {
      "th": "ปะการังไฟ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-blue-ringed-octopus",
    "group": "fish",
    "commonName": "Blue-ringed Octopus",
    "sciName": "Hapalochlaena spp.",
    "localNames": [],
    "blurb": "Tiny, beautiful and one of the most venomous animals in the sea. It is not aggressive; the danger is picking one up.",
    "idTips": "Very small — body the size of a golf ball, arms to about 10 cm. At rest it is drab beige-brown and easily mistaken for a stone. When alarmed it flashes brilliant iridescent blue rings or lines all over the body and arms. That display is the warning.",
    "habitat": "Shallow rubble, tide pools, seagrass and reef flats; hides in shells, bottles and cans.",
    "where": "Recorded in the shallow waters of Thailand, Vietnam and Cambodia; uncommon but present.",
    "dangerous": true,
    "dangerNote": "The venom is a powerful neurotoxin and there is no antivenom. The bite is often painless and can be missed. If someone is bitten: call for emergency help immediately, and if breathing weakens, rescue breathing must be started and CONTINUED until help arrives — the victim can stay conscious while paralysed, and people survive with nothing more than sustained artificial respiration. Never pick up a small octopus, and never reach into shells, bottles or cans on the seabed.",
    "emoji": "🐙",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-cone-snail",
    "group": "fish",
    "commonName": "Cone Snail",
    "sciName": "Conus spp.",
    "localNames": [],
    "blurb": "One of the prettiest shells on the beach, and among the few that can kill the person who pockets it.",
    "idTips": "A smooth, heavy, cone-shaped shell 3-15 cm with a narrow opening running most of its length, patterned in intricate browns, oranges and whites — often a tent-like or dotted marbling. A live animal extends a fleshy foot and a tube; an empty shell is safe.",
    "habitat": "Sand and rubble on reef flats and in shallow water; also washed up alive at the tide line.",
    "where": "Beaches and reefs throughout the region.",
    "dangerous": true,
    "dangerNote": "A live cone snail fires a harpoon-like tooth that can penetrate a glove or wetsuit, and the larger fish-eating species have killed people. It can strike any part of the shell, so there is no safe way to hold one. Never pick up a cone-shaped shell in the water or at the tide line, and do not put shells in a pocket. A sting is a medical emergency — get help immediately and monitor breathing.",
    "emoji": "🐚",
    "names": {
      "th": "หอยเต้าปูน",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-bluebottle",
    "group": "fish",
    "commonName": "Bluebottle (Portuguese Man o' War)",
    "sciName": "Physalia spp.",
    "localNames": [],
    "blurb": "Not a jellyfish but a colony, and it stings just as hard on the beach as in the water.",
    "idTips": "A translucent blue or blue-purple gas-filled float 3-10 cm sitting on the surface like a small inflated bag, trailing long blue tentacles that may extend metres. Blown ashore in numbers on a windy day.",
    "habitat": "The open sea surface, driven onshore by wind; strands along the tide line.",
    "where": "Both Thai coasts, and Vietnamese and Cambodian shores, most often in the windy months.",
    "dangerous": true,
    "dangerNote": "A painful linear sting with red weals, occasionally with nausea and cramps. Stranded animals sting for days — do not touch one on the sand, and keep children away. Treatment: pick off tentacles with a gloved hand or stick, rinse with SEAWATER (fresh water fires more stinging cells), then immerse in hot water for 20 minutes; do not rub with sand. Vinegar is NOT recommended for this one. Seek help for a very large sting, a sting to the face, or breathing trouble. Note this is a different animal from the box jellyfish, which is far more dangerous — check for local warning signs and vinegar stations.",
    "emoji": "🪼",
    "names": {
      "th": "แมงกะพรุนไฟ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-crown-of-thorns",
    "group": "fish",
    "commonName": "Crown-of-Thorns Starfish",
    "sciName": "Acanthaster planci",
    "localNames": [],
    "blurb": "A big spiny starfish that eats living coral, and injures anyone who stands on one.",
    "idTips": "Large, 25-50 cm, with 10-20 arms covered in stout, sharp venomous spines 2-5 cm long, in mottled purple-grey, red-brown, or green. Often sitting on a patch of coral it has bleached white while feeding.",
    "habitat": "Coral reefs, sometimes in destructive outbreaks.",
    "where": "Reefs across the Andaman Sea, the Gulf of Thailand and Vietnamese and Cambodian waters.",
    "dangerous": true,
    "dangerNote": "The spines are venomous and brittle, causing immediate intense pain, swelling and lingering aching, and they break off in the wound. Never handle one and never stand on a reef. Treat by soaking in hot water and get medical help to remove fragments — retained spines commonly cause persistent infection and can involve a joint.",
    "emoji": "⭐",
    "names": {
      "th": "ดาวมงกุฎหนาม",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-yellow-lipped-sea-krait",
    "group": "fish",
    "commonName": "Yellow-lipped Sea Krait",
    "sciName": "Laticauda colubrina",
    "localNames": [],
    "blurb": "Highly venomous, remarkably docile, and often seen coming ashore — which is where people get into trouble with it.",
    "idTips": "A banded sea snake 1-1.4 m, pale silvery-blue to grey with clean black rings all along the body, a yellow snout and upper lip, and a flattened paddle-like tail. Unlike true sea snakes it comes onto land to rest and digest.",
    "habitat": "Coral reefs, rocky shallows and adjacent beaches and rock crevices.",
    "where": "Both Thai coasts, Vietnamese and Cambodian islands and reefs.",
    "dangerous": true,
    "dangerNote": "The venom is far stronger than a cobra's, but the animal is famously placid and bites are very rare — divers regularly swim beside them. Almost every bite involves someone picking one up, usually on a beach where it looks helpless. Do not touch it, on land or in the water, and warn children. A bite may be nearly painless and needs immediate hospital care regardless; effects can be delayed by hours.",
    "emoji": "🐍",
    "names": {
      "th": "งูสมิงทะเล",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-moray-eel",
    "group": "fish",
    "commonName": "Giant Moray",
    "sciName": "Gymnothorax javanicus",
    "localNames": [],
    "blurb": "The face in the hole. Not a threat unless a hand goes in after it — and then a serious wound.",
    "idTips": "A very large eel, commonly 1.5-2.5 m, mottled dark brown and pale in a leopard pattern with a dark blotch around the gill opening. No pectoral fins; the dorsal fin runs the length of the body. Sits with the head out of a crevice, mouth opening and closing to breathe — which is not aggression.",
    "habitat": "Reef crevices, caves and wrecks by day.",
    "where": "Reefs throughout the Andaman Sea, the Gulf of Thailand and Vietnamese waters.",
    "dangerous": true,
    "dangerNote": "It bites only defensively or when a hand is mistaken for food, but the teeth are long and backward-curving, the jaws do not release easily, and the wounds get infected readily. Never put a hand into a hole, never feed one, and never let a guide hand-feed for a photograph — that is exactly what teaches an eel to approach hands. Any moray bite needs cleaning and a doctor.",
    "emoji": "🐟",
    "names": {
      "th": "ปลาไหลมอเรย์",
      "vi": "cá chình",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-snakehead",
    "group": "fish",
    "commonName": "Striped Snakehead",
    "sciName": "Channa striata",
    "localNames": [],
    "blurb": "The dark, blunt-headed fish alive in a shallow tray at every fresh market — it breathes air, so it is sold living.",
    "idTips": "Long and cylindrical, 20-60 cm, dark grey-brown above with pale chevron bars along the flanks, a flattened snake-like head with large scales, and long dorsal and anal fins running most of the body. Kept alive out of water in a damp tray.",
    "habitat": "Paddies, canals, swamps and ponds; can breathe air and cross wet ground.",
    "where": "Farmed and wild-caught across all four countries; a staple of grilled fish, sour soups and Isan and Lao larb pla.",
    "dangerous": false,
    "dangerNote": "Handle with respect at the market: it thrashes hard and has sharp teeth and gill covers. As with all freshwater fish here, eat it cooked — raw or fermented freshwater fish carries liver fluke, a serious regional health problem.",
    "emoji": "🐟",
    "names": {
      "th": "ปลาช่อน",
      "vi": "cá lóc",
      "km": "ត្រីរ៉ស់",
      "lo": "ປາຄໍ່"
    }
  },
  {
    "id": "nat-fish-pangasius",
    "group": "fish",
    "commonName": "Mekong Catfish (Pangasius)",
    "sciName": "Pangasius spp.",
    "localNames": [],
    "blurb": "The silvery river catfish behind most of the region's farmed fish, and the fillets exported worldwide as basa.",
    "idTips": "A smooth, scaleless, silvery-grey catfish with a slightly forked tail, a large eye set low on the head, and two short barbels. Farmed fish are commonly 40-70 cm; wild river species grow far larger.",
    "habitat": "The Mekong and its tributaries, and enormous floating cage farms — especially in the Vietnamese delta.",
    "where": "Farmed at huge scale in the Mekong Delta and sold fresh throughout the region.",
    "dangerous": false,
    "dangerNote": "Not to be confused with the Mekong giant catfish, which is critically endangered and must not be eaten — if a restaurant offers giant catfish, decline. Cook thoroughly, like all freshwater fish here.",
    "emoji": "🐟",
    "names": {
      "th": "ปลาสวาย",
      "vi": "cá basa",
      "km": "ត្រីប្រា",
      "lo": "ປາສະວາຍ"
    }
  },
  {
    "id": "nat-fish-mudskipper",
    "group": "fish",
    "commonName": "Mudskipper",
    "sciName": "Periophthalmodon / Boleophthalmus spp.",
    "localNames": [],
    "blurb": "A fish that walks, climbs and defends a territory on the mud — the best entertainment in any mangrove.",
    "idTips": "5-25 cm, brown-grey and often blue-speckled, with bulging periscope eyes on top of the head, and stubby muscular pectoral fins used as crutches to haul across mud. Males flash a raised dorsal fin and leap in territorial displays.",
    "habitat": "Mangrove mudflats and tidal creeks at low tide.",
    "where": "Mangrove coasts across Thailand, Vietnam and Cambodia.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐟",
    "names": {
      "th": "ปลาตีน",
      "vi": "cá thòi lòi",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-fish-siamese-fighting-fish",
    "group": "fish",
    "commonName": "Siamese Fighting Fish",
    "sciName": "Betta splendens",
    "localNames": [],
    "blurb": "Thailand's national aquatic animal — and the wild version looks nothing like the ones in shops.",
    "idTips": "Wild fish are drab greenish-brown, 5-6 cm, with short fins and red flashes on the gill covers, brightening dramatically when displaying. The long-finned scarlet, blue and white fish sold in jars are centuries of selective breeding, not wild animals.",
    "habitat": "Shallow, still, vegetated water: paddies, ditches, marshes and roadside pools.",
    "where": "Native to the central Thai plains and the Mekong basin; wild populations are declining as habitat is drained.",
    "dangerous": false,
    "dangerNote": "Males fight, which is why they are sold one to a jar. The wild form is now assessed as vulnerable, so admire wild fish in the ditch and buy captive-bred if you buy at all.",
    "emoji": "🐠",
    "names": {
      "th": "ปลากัด",
      "vi": "cá xiêm",
      "km": "",
      "lo": "ປາກັດ"
    }
  },
  {
    "id": "nat-bird-giant-ibis",
    "group": "bird",
    "commonName": "Giant Ibis",
    "sciName": "Thaumatibis gigantea",
    "localNames": [],
    "blurb": "Cambodia's national bird, the largest ibis in the world, and critically endangered — perhaps only a few hundred remain.",
    "idTips": "Enormous for an ibis at over a metre tall, dark grey-brown with a bare dark grey head, pale banding on the wing coverts, red eyes and reddish legs, and a long down-curved bill. Usually in pairs or small family groups, and remarkably wary.",
    "habitat": "Open dry dipterocarp forest with seasonal pools and wet grassy clearings.",
    "where": "Northern and eastern Cambodia — the Northern Plains and Western Siem Pang — with tiny numbers in southern Laos. Tmatboey in Preah Vihear is the place people go to see it.",
    "dangerous": false,
    "dangerNote": "Critically endangered. If you go looking, use the community-based ecotourism operations at Tmatboey and Western Siem Pang: the fees are what makes protecting the nests worth more to villages than the alternatives.",
    "emoji": "🐦",
    "names": {
      "th": "",
      "vi": "",
      "km": "ត្រយងយក្ស",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-sarus-crane",
    "group": "bird",
    "call": true,
    "commonName": "Sarus Crane",
    "sciName": "Antigone antigone",
    "localNames": [],
    "blurb": "The tallest flying bird in the world, and a genuine spectacle over the Mekong floodplains.",
    "idTips": "Up to 1.8 m tall, uniform pale grey with a bare red head and upper neck, a small grey crown patch, and long pale pink legs. Pairs are inseparable and duet loudly with heads thrown back — a far-carrying trumpeting.",
    "habitat": "Seasonally flooded grassland, wet paddies, marshes and shallow wetlands.",
    "where": "The Cambodia-Vietnam border wetlands, notably Tram Chim in the Mekong Delta and Ang Trapeang Thmor in Cambodia; small numbers in Laos.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกกระเรียนไทย",
      "vi": "sếu đầu đỏ",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-green-peafowl",
    "group": "bird",
    "call": true,
    "commonName": "Green Peafowl",
    "sciName": "Pavo muticus",
    "localNames": [],
    "blurb": "The wild peafowl of Southeast Asia — endangered, far shyer than the Indian bird, and stunning.",
    "idTips": "Male over 2 m including the train, glossy metallic green and blue with a tall upright tuft-like crest and blue-and-yellow bare facial skin. Females similar but without the train. Its loud, ringing 'ki-wao' carries a long way at dawn.",
    "habitat": "Riverine and dry deciduous forest with open ground and water.",
    "where": "Best in northern Thailand's Huai Kha Khaeng and around Mae Ping, plus parts of Cambodia, Laos and Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦚",
    "names": {
      "th": "นกยูงไทย",
      "vi": "công",
      "km": "",
      "lo": "ນົກຍູງ"
    }
  },
  {
    "id": "nat-bird-asian-openbill",
    "group": "bird",
    "commonName": "Asian Openbill",
    "sciName": "Anastomus oscitans",
    "localNames": [],
    "blurb": "A common stork with a bill that does not close — and it is built that way on purpose.",
    "idTips": "About 80 cm, dull white with glossy black wings and tail, on long pinkish legs. The heavy pale bill has a permanent gap between the mandibles even when shut, used for gripping and extracting apple snails. Soars in flocks on thermals.",
    "habitat": "Paddies, marshes, canals and irrigation reservoirs.",
    "where": "Abundant across the lowlands of Thailand, Cambodia and Vietnam — often the commonest large bird over paddy fields.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกปากห่าง",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-painted-stork",
    "group": "bird",
    "commonName": "Painted Stork",
    "sciName": "Mycteria leucocephala",
    "localNames": [],
    "blurb": "A big, beautiful stork you can watch easily even in city parks and zoos-turned-wetlands.",
    "idTips": "About 1 m, white with fine dark barring across the breast, glossy dark flight feathers, and a striking rose-pink flush on the lower back and tail. Bare orange-yellow face and a long, slightly down-curved yellow bill.",
    "habitat": "Freshwater marshes, paddies, reservoirs and lakes; nests colonially in trees.",
    "where": "Central Thailand and Cambodia especially; a familiar sight at Wat Phai Lom and around Bangkok's wetlands.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกกาบบัว",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-brahminy-kite",
    "group": "bird",
    "commonName": "Brahminy Kite",
    "sciName": "Haliastur indus",
    "localNames": [],
    "blurb": "The chestnut-and-white raptor circling every harbour, river mouth and fishing pier.",
    "idTips": "Medium raptor with a pure white head, neck and breast contrasting sharply with rich chestnut wings, back and belly, and a rounded tail. Juveniles are streaky brown. Glides low over water on slightly bowed wings.",
    "habitat": "Coasts, estuaries, harbours, rivers, canals and fish farms.",
    "where": "Common along coasts and major rivers throughout the region, including in cities.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦅",
    "names": {
      "th": "เหยี่ยวแดง",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-crested-serpent-eagle",
    "group": "bird",
    "call": true,
    "commonName": "Crested Serpent Eagle",
    "sciName": "Spilornis cheela",
    "localNames": [],
    "blurb": "The forest raptor you hear before you see — a piercing whistle from high overhead on a hot afternoon.",
    "idTips": "A dark brown eagle with a short black-and-white crest raised when perched, white spotting below, and bare bright yellow face and legs. In flight the broad wings and tail show a bold black-and-white banded pattern from beneath. The call is a loud, rising 'kluee-wip'.",
    "habitat": "Forest and forest edge, plantations and wooded farmland.",
    "where": "Widespread across all four countries.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦅",
    "names": {
      "th": "เหยี่ยวรุ้ง",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-germains-swiftlet",
    "group": "bird",
    "commonName": "Germain's Swiftlet",
    "sciName": "Aerodramus germani",
    "localNames": [],
    "blurb": "The bird behind bird's-nest soup — and behind the strange windowless concrete towers you will see in delta towns.",
    "idTips": "A small, uniformly sooty-brown swift about 12 cm with a slightly notched tail, in constant fast fluttering flight, never perching in the open. It navigates dark caves by echolocating with sharp audible clicks.",
    "habitat": "Sea caves and limestone caves; now heavily farmed in purpose-built 'bird houses' — tall breeze-block buildings that broadcast recorded calls.",
    "where": "Coastal Thailand, southern Vietnam and Cambodia; the nest trade is a major industry in the Mekong Delta.",
    "dangerous": false,
    "dangerNote": "The nests are made of the bird's own hardened saliva. Harvesting is legal and farmed nests are the bulk of supply, but cave harvesting can be destructive and dangerous, and the trade is a target for fraud. Nothing about the soup is a health necessity.",
    "emoji": "🐦",
    "names": {
      "th": "นกแอ่นกินรัง",
      "vi": "chim yến",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-black-naped-oriole",
    "group": "bird",
    "call": true,
    "commonName": "Black-naped Oriole",
    "sciName": "Oriolus chinensis",
    "localNames": [],
    "blurb": "A brilliant golden-yellow bird with a black mask, common in city parks and easy to spot once you know the call.",
    "idTips": "About 26 cm, vivid golden-yellow with black wings, a broad black band running through the eye and around the nape, and a pinkish-red bill. The song is a rich, liquid, fluting whistle.",
    "habitat": "Open woodland, parks, gardens, temple grounds and roadside trees.",
    "where": "Widespread across the region, including in Bangkok, Hanoi and Phnom Penh parks.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกขมิ้นท้ายทอยดำ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-scarlet-minivet",
    "group": "bird",
    "commonName": "Scarlet Minivet",
    "sciName": "Pericrocotus flammeus",
    "localNames": [],
    "blurb": "Flocks of tiny scarlet and yellow birds working through the canopy together — one of the region's great forest sights.",
    "idTips": "About 20 cm. Males are glossy black on the head and back with brilliant scarlet underparts, rump and wing patches; females replace every red with bright yellow. They move through the canopy in loose, restless parties.",
    "habitat": "Broadleaf forest, forest edge and well-wooded hill country.",
    "where": "Hill and montane forest across all four countries — Doi Inthanon, Cat Ba, Bokor and the Bolaven Plateau are all reliable.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกพญาไฟใหญ่",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-spotted-owlet",
    "group": "bird",
    "call": true,
    "commonName": "Spotted Owlet",
    "sciName": "Athene brama",
    "localNames": [],
    "blurb": "A small, cross-looking owl that is active at dusk in the middle of cities — often on a temple roof or a wire.",
    "idTips": "Only about 21 cm, grey-brown liberally spotted with white, with a pale face, bold white eyebrows and staring lemon-yellow eyes. Often in pairs, bobbing and glaring. The call is a harsh chattering squabble at dusk.",
    "habitat": "Temple grounds, old buildings, palm trees, parks and farmland — very tolerant of people.",
    "where": "Common throughout the lowlands of all four countries, including in city centres.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦉",
    "names": {
      "th": "นกเค้าจุด",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-streak-eared-bulbul",
    "group": "bird",
    "call": true,
    "commonName": "Streak-eared Bulbul",
    "sciName": "Pycnonotus conradi",
    "localNames": [],
    "blurb": "If you are in a Thai city and a nondescript brown bird is singing in the garden, this is very likely it.",
    "idTips": "About 20 cm, plain grey-brown with a paler belly, a whitish eye, and fine pale streaks on the ear coverts that give it its name — a genuinely unremarkable bird, which is itself the identification. Noisy and constantly active.",
    "habitat": "Gardens, parks, scrub, plantations and city streets.",
    "where": "Abundant across Thailand, Cambodia and Laos in nearly any inhabited landscape.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกปรอดสวน",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-bird-blue-whistling-thrush",
    "group": "bird",
    "call": true,
    "commonName": "Blue Whistling Thrush",
    "sciName": "Myophonus caeruleus",
    "localNames": [],
    "blurb": "A big dark thrush by a hill stream whose song is one of the finest sounds in the mountains here.",
    "idTips": "About 32 cm, appearing black in shade but resolving in good light into deep midnight blue spangled with fine pale spots, with a bright yellow bill and dark legs. Bounds along wet rocks flicking a fanned tail. The song is a loud, rich, human-sounding whistle.",
    "habitat": "Rocky streams, waterfalls, damp ravines and hill-station gardens.",
    "where": "Hills and mountains of northern Thailand, northern Vietnam, northern Laos and Cambodia's Cardamoms.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐦",
    "names": {
      "th": "นกเอี้ยงถ้ำ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-slow-loris",
    "group": "mammal",
    "commonName": "Sunda Slow Loris",
    "sciName": "Nycticebus coucang",
    "localNames": [],
    "blurb": "The wide-eyed nocturnal primate offered for photographs on tourist streets — and every one of those animals is a victim.",
    "idTips": "Small and round, 27-38 cm with no visible tail, dense woolly grey-brown fur, a dark stripe down the back and dark rings around enormous forward-facing eyes. Moves slowly and deliberately, hand over hand, and is silent.",
    "habitat": "Rainforest, bamboo and plantations, strictly at night, high in vegetation.",
    "where": "Southern Thailand, Vietnam, Cambodia and Laos. The ones travellers actually meet are on the streets of Bangkok, Phuket and Patong.",
    "dangerous": true,
    "dangerNote": "Never pay for a photograph with one. They are protected; the animals are taken from the wild, their teeth are usually cut out with nail clippers so they cannot bite, and most die within weeks — paying is what keeps the supply moving. They are also one of the very few venomous primates: a bite mixes saliva with a toxin from a gland in the elbow and can cause a severe reaction. If you see one being touted, do not engage, and report it to the tourist police (1155 in Thailand).",
    "emoji": "🐒",
    "names": {
      "th": "นางอาย",
      "vi": "khỉ gió",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-sun-bear",
    "group": "mammal",
    "commonName": "Sun Bear",
    "sciName": "Helarctos malayanus",
    "localNames": [],
    "blurb": "The smallest bear in the world, and the one most likely to be encountered on a forest trail here.",
    "idTips": "1.2-1.5 m long, sleek short black fur, a pale orange-yellow crescent on the chest, a grey-brown muzzle, very long curved claws and an absurdly long tongue. Much smaller and lighter-built than a black bear.",
    "habitat": "Lowland and hill rainforest; an excellent climber that often feeds and rests in trees.",
    "where": "Thailand, Cambodia, Laos and Vietnam, though numbers are much reduced.",
    "dangerous": true,
    "dangerNote": "Small but powerful and, by reputation, quick to defend itself, particularly a female with cubs. On foot in bear country make noise on blind corners, never approach one, and never get between a bear and a cub. If you meet one: do not run, back away slowly while facing it, and make yourself look large. Do not leave food in a tent.",
    "emoji": "🐻",
    "names": {
      "th": "หมีหมา",
      "vi": "gấu chó",
      "km": "ឆ្កែឃ្មុំ",
      "lo": "ໝີ"
    }
  },
  {
    "id": "nat-mammal-asiatic-black-bear",
    "group": "mammal",
    "commonName": "Asiatic Black Bear",
    "sciName": "Ursus thibetanus",
    "localNames": [],
    "blurb": "The moon bear — bigger than a sun bear, and the animal behind most serious bear injuries in the region.",
    "idTips": "1.2-1.9 m, glossy black with a broad white or cream V on the chest, a distinctly rounded head, large flared ears and a shaggy ruff around the neck.",
    "habitat": "Hill and montane broadleaf forest, generally higher and cooler than sun bear country.",
    "where": "Northern Thailand, northern and central Vietnam, Laos and Cambodia's mountains.",
    "dangerous": true,
    "dangerNote": "The species responsible for most bear attacks in Asia; injuries are typically to the head and face and encounters are usually sudden and at close range. Same rules: noise on the trail, no approach, never between mother and cub, back away facing the animal, do not run or climb. If a bear charges and contact is unavoidable, fight back and protect your head and neck — do not play dead with this species.",
    "emoji": "🐻",
    "names": {
      "th": "หมีควาย",
      "vi": "gấu ngựa",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-indochinese-tiger",
    "group": "mammal",
    "commonName": "Indochinese Tiger",
    "sciName": "Panthera tigris corbetti",
    "localNames": [],
    "blurb": "Still here, just — a few hundred at most across the whole region, and the odds of seeing one are effectively nil.",
    "idTips": "A tiger, and unmistakable: 2.5-2.8 m including tail, orange with narrow black stripes, paler and more slender than a Bengal tiger. In practice you will find pugmarks, scrapes or a scent-marked tree, not the animal.",
    "habitat": "Large blocks of dry and evergreen forest with wild prey and little human pressure.",
    "where": "Realistically only Thailand's Western Forest Complex (Huai Kha Khaeng and Thap Lan) holds a breeding population; Cambodia's wild tigers are considered functionally extinct and Vietnam's and Laos's nearly so.",
    "dangerous": true,
    "dangerNote": "A genuine wild encounter is vanishingly unlikely, and this entry is here mostly so you know that: any 'tiger experience', tiger temple, cub-petting or walk-with-tigers attraction is a captive operation, not conservation, and paying for one supports breeding for entertainment. In the improbable event of meeting a wild tiger, do not run — back away slowly, facing it, and stay in a group.",
    "emoji": "🐅",
    "names": {
      "th": "เสือโคร่ง",
      "vi": "hổ",
      "km": "ខ្លា",
      "lo": "ເສືອ"
    }
  },
  {
    "id": "nat-mammal-indochinese-leopard",
    "group": "mammal",
    "commonName": "Indochinese Leopard",
    "sciName": "Panthera pardus delacouri",
    "localNames": [],
    "blurb": "Critically reduced and now rarer in this region than the tiger in some places — a genuine ghost of the forest.",
    "idTips": "1.6-2.1 m including tail, tawny with dense rosettes; a high proportion of animals here are black (melanistic 'black panthers'), in which the rosettes are still visible in raking light. Much smaller and lower-slung than a tiger.",
    "habitat": "Dry and evergreen forest, and more tolerant of degraded habitat than a tiger.",
    "where": "Peninsular Thailand and eastern Cambodia hold the last significant populations; the black form is notably frequent in southern Thailand.",
    "dangerous": true,
    "dangerNote": "Very rarely a threat to people and almost never seen. The same rules apply as for any big cat: no running, back away facing it, keep children close and stay grouped after dark in forest.",
    "emoji": "🐆",
    "names": {
      "th": "เสือดาว",
      "vi": "báo hoa mai",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-gaur",
    "group": "mammal",
    "commonName": "Gaur",
    "sciName": "Bos gaurus",
    "localNames": [],
    "blurb": "The largest wild cattle on earth — a bull can top a tonne, and this is one of the more genuinely dangerous animals you might meet on foot.",
    "idTips": "Massive and unmistakable: 1.7-2.2 m at the shoulder, glossy blackish-brown with striking white 'stockings' on all four legs, a high muscular ridge along the shoulders and a pronounced grey dorsal ridge between the horns.",
    "habitat": "Evergreen and deciduous forest with grassy clearings and salt licks.",
    "where": "Thailand's Western Forest Complex and Khao Yai, eastern Cambodia, and parts of Laos and Vietnam.",
    "dangerous": true,
    "dangerNote": "Usually shy, but bulls and cows with calves will charge with very little warning, and an animal this size is lethal. Keep a very wide berth, never approach for a photograph, stay in a vehicle where one is available, and back off immediately if an animal turns to face you or lowers its head. Never get between a herd and cover.",
    "emoji": "🐃",
    "names": {
      "th": "กระทิง",
      "vi": "bò tót",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-dhole",
    "group": "mammal",
    "call": true,
    "commonName": "Dhole",
    "sciName": "Cuon alpinus",
    "localNames": [],
    "blurb": "The Asiatic wild dog — a russet, whistling pack hunter, and one of the best sightings in a Thai national park.",
    "idTips": "The size of a border collie, 12-20 kg, rich rusty-red with a paler belly and a full bushy black-tipped tail. The muzzle is short and the ears large and rounded. Packs communicate with an eerie whistling rather than barking.",
    "habitat": "Deciduous and evergreen forest with open ground; often seen on park roads early and late.",
    "where": "Khao Yai and the Western Forest Complex in Thailand, plus parts of Cambodia and Laos.",
    "dangerous": false,
    "dangerNote": "No real risk to people. Never feed them — habituated dholes on park roads get killed by vehicles, which is the main threat to the ones you are most likely to see.",
    "emoji": "🐕",
    "names": {
      "th": "หมาใน",
      "vi": "sói đỏ",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-sunda-pangolin",
    "group": "mammal",
    "commonName": "Sunda Pangolin",
    "sciName": "Manis javanica",
    "localNames": [],
    "blurb": "The most trafficked wild mammal in the world, and the reason you may see scales for sale in a medicine shop.",
    "idTips": "65-100 cm including a long prehensile tail, entirely armoured in overlapping olive-brown keratin scales, with a small conical head, no teeth, and a long sticky tongue. Rolls into a tight ball when threatened. Strictly nocturnal.",
    "habitat": "Forest, plantations and scrub; digs for ants and termites and shelters in burrows and hollow trees.",
    "where": "All four countries, though it is now critically endangered and rarely seen.",
    "dangerous": false,
    "dangerNote": "Critically endangered and driven there almost entirely by trafficking for scales and meat. Do not buy pangolin scales or anything containing them — the claimed medicinal properties have no evidence behind them (the scales are keratin, the same material as fingernails) — and report anything offered for sale.",
    "emoji": "🦔",
    "names": {
      "th": "ลิ่น",
      "vi": "tê tê",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-red-shanked-douc",
    "group": "mammal",
    "commonName": "Red-shanked Douc Langur",
    "sciName": "Pygathrix nemaeus",
    "localNames": [],
    "blurb": "Arguably the most spectacularly coloured primate in Asia, and Vietnam's flagship monkey.",
    "idTips": "About 60-75 cm plus a long white tail, with grey body, deep maroon-red lower legs, black hands and feet, white forearms, and a golden face fringed with long white cheek whiskers and a chestnut band across the throat.",
    "habitat": "Tall primary and secondary forest canopy, in noisy troops.",
    "where": "Central Vietnam and adjacent Laos — Son Tra peninsula above Da Nang is the reliable place to see them, plus Bach Ma and Pu Mat.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐒",
    "names": {
      "th": "",
      "vi": "chà vá chân nâu",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-saola",
    "group": "mammal",
    "commonName": "Saola",
    "sciName": "Pseudoryx nghetinhensis",
    "localNames": [],
    "blurb": "The 'Asian unicorn' — found only in the Annamite mountains, never seen alive by a scientist in the wild, and possibly already gone.",
    "idTips": "A dark brown forest bovid about 80-90 cm at the shoulder with two long, nearly straight, parallel horns up to 50 cm, and vivid white facial markings — spots above the eyes, stripes on the cheeks and chin.",
    "habitat": "Wet evergreen forest in the Annamite range, with steep terrain and streams.",
    "where": "The Vietnam-Laos border mountains only. Discovered in 1992; the last confirmed record was a camera-trap photograph in 2013.",
    "dangerous": false,
    "dangerNote": "Included because it matters, not because you might see it. The threat is snaring: indiscriminate wire snares set for any animal blanket these forests. If you trek in the Annamites, use operators that fund snare-removal patrols, and report any snare line you come across to your guide.",
    "emoji": "🦌",
    "names": {
      "th": "",
      "vi": "sao la",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-smooth-coated-otter",
    "group": "mammal",
    "call": true,
    "commonName": "Smooth-coated Otter",
    "sciName": "Lutrogale perspicillata",
    "localNames": [],
    "blurb": "Family groups fishing noisily along a river or through a flooded forest — one of the region's most enjoyable sightings.",
    "idTips": "0.7-1.3 m including a flattened tail, with short, sleek, glossy dark brown fur that looks almost velvet when wet, a paler throat and belly, and a broad flat muzzle. Travels and hunts in extended family parties, whistling and chirruping constantly.",
    "habitat": "Large rivers, lakes, canals, mangroves and flooded forest.",
    "where": "The Mekong and Tonle Sap systems, Thai rivers and reservoirs, and Vietnamese delta channels.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🦦",
    "names": {
      "th": "นากใหญ่ขนเรียบ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-malayan-porcupine",
    "group": "mammal",
    "commonName": "Malayan Porcupine",
    "sciName": "Hystrix brachyura",
    "localNames": [],
    "blurb": "A big nocturnal rodent that announces itself by rattling — you will find dropped quills on trails long before you see one.",
    "idTips": "60-75 cm and heavily built, dark brown to blackish, covered in long black-and-white banded quills that lie flat until raised. A white band runs across the throat. Rattles hollow tail quills loudly when alarmed.",
    "habitat": "Forest, plantations and scrub, sheltering in burrows and rock crevices by day.",
    "where": "Common across all four countries, including close to villages.",
    "dangerous": true,
    "dangerNote": "Not aggressive and it cannot shoot its quills, but a cornered porcupine reverses hard into a threat and the quills drive in deeply and detach, which is a nasty and easily infected wound. Give one room, keep dogs away, and do not corner one on a trail at night.",
    "emoji": "🦔",
    "names": {
      "th": "เม่นใหญ่",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-colugo",
    "group": "mammal",
    "commonName": "Sunda Colugo",
    "sciName": "Galeopterus variegatus",
    "localNames": [],
    "blurb": "The 'flying lemur' — neither flying nor a lemur, but the most capable gliding mammal there is.",
    "idTips": "About 35-40 cm, mottled grey-brown and lichen-patterned for perfect bark camouflage, with a membrane joining neck, all four limbs and tail into a single kite. Clings flat and motionless to a trunk by day; glides over 100 m between trees at dusk.",
    "habitat": "Lowland and hill rainforest and plantations.",
    "where": "Southern Thailand and parts of Cambodia, Laos and Vietnam.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐿️",
    "names": {
      "th": "",
      "vi": "",
      "km": "",
      "lo": ""
    }
  },
  {
    "id": "nat-mammal-black-giant-squirrel",
    "group": "mammal",
    "call": true,
    "commonName": "Black Giant Squirrel",
    "sciName": "Ratufa bicolor",
    "localNames": [],
    "blurb": "An enormous squirrel — nearly a metre long including tail — crashing about high in the canopy.",
    "idTips": "Head and body 35-40 cm with a tail of similar length. Glossy blue-black above and rich buff-orange below, with pale tufted ears. Moves in long, heavy leaps with a loud rustle, often the first sign of it.",
    "habitat": "Tall evergreen and semi-evergreen forest canopy.",
    "where": "Hill forest across all four countries — Khao Yai, Doi Inthanon, Cat Tien and Bokor.",
    "dangerous": false,
    "dangerNote": "",
    "emoji": "🐿️",
    "names": {
      "th": "พญากระรอกดำ",
      "vi": "",
      "km": "",
      "lo": ""
    }
  }
];

export function allSpecies(filter = {}) {
  let out = NATURE.slice();
  if (filter.group) out = out.filter((s) => s.group === filter.group || (filter.group === 'danger' && s.dangerous));
  if (filter.q) {
    const q = filter.q.toLowerCase();
    out = out.filter((s) => [s.commonName, s.sciName, (s.localNames || []).join(' '), s.blurb]
      .join(' ').toLowerCase().includes(q));
  }
  return out;
}
export function getSpecies(id) { return NATURE.find((s) => s.id === id) || null; }
