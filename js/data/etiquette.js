// Culture & etiquette — what is rude, what is polite, and what is actually against the law.
//
// WHY THIS IS ITS OWN MODULE. The app already carried four lines of etiquette per country,
// buried inside the country-info screen under "Etiquette & temples", where nobody looking for
// it would find it and nobody not looking for it would ever read it. The single most useful
// fact in that list — that showing the soles of your feet to a person is an insult across all
// four countries — was one clause in one sentence. This is the same subject given the space a
// traveller needs BEFORE they do the thing, which is the only time it helps.
//
// `level` is the part that matters most, because these are not all the same kind of mistake:
//   'law'    — a criminal offence with real consequences. Thailand's lèse-majesté law carries
//              multi-year prison sentences and has been applied to foreigners. Treating this
//              as "a bit rude" is how a trip ends badly.
//   'never'  — deeply offensive. You will not be arrested; you will lose the room.
//   'avoid'  — rude, and noticed. The ordinary run of it.
//   'do'     — the positive form: what a polite visitor actually does.
// The screen orders 'law' first and never folds it away.
//
// `why` earns its place: a rule you understand you remember, and several of these are
// counter-intuitive without it (chopsticks upright in rice is a funeral offering; a white
// Baci thread must stay on for days; sticky rice bought from a tout is both unsafe and an
// insult to the monks receiving it).
//
// Sources are the four countries' own tourism authorities, embassy travel advice and the
// standard published guides; nothing here is contested. Where a practice varies by region or
// by generation the entry says so rather than flattening it.

export const ETIQUETTE_GROUPS = [
  { id: 'body', label: 'Head, hands and feet', emoji: '🙏' },
  { id: 'temple', label: 'Temples, monks and images', emoji: '🛕' },
  { id: 'greeting', label: 'Greetings and names', emoji: '👋' },
  { id: 'eating', label: 'Eating and drinking', emoji: '🍽' },
  { id: 'dress', label: 'What to wear', emoji: '👕' },
  { id: 'money', label: 'Money, tipping and bargaining', emoji: '💰' },
  { id: 'photos', label: 'Photographs', emoji: '📷' },
  { id: 'talk', label: 'What not to bring up', emoji: '🤐' },
  { id: 'public', label: 'In public', emoji: '🚶' },
];

export const LEVELS = {
  law: { label: 'Against the law', emoji: '⚖️', color: '#C0392B' },
  never: { label: 'Never', emoji: '🚫', color: '#E0663A' },
  avoid: { label: 'Rude', emoji: '⚠️', color: '#C89B2A' },
  do: { label: 'Do this', emoji: '✓', color: '#2F8F5B' },
};

// True in all four countries. Shown on every country's screen so a traveller crossing a
// border does not have to re-read the same rules under a different flag — and so the
// per-country lists below hold only what is actually specific to that country.
export const ETIQUETTE_REGION = [
  { group: 'body', level: 'never', text: 'Do not show the soles of your feet to a person, and never point your feet at someone, at a Buddha image or at a photograph of a person.',
    why: 'The body is ranked head-to-toe: the head is the most sacred part and the feet the lowest and dirtiest. Feet aimed at a person say, very clearly, what you think of them. Sitting cross-legged with a sole facing someone counts — tuck your feet behind you or point them away.' },
  { group: 'body', level: 'never', text: 'Do not touch an adult’s head — or a child’s, however affectionate you mean it.',
    why: 'The head is the seat of the spirit. Ruffling a child’s hair is a warm gesture in much of the world and an intrusion here; parents will be too polite to say so.' },
  { group: 'body', level: 'avoid', text: 'Do not beckon with your palm up and a curled finger, and do not point at people with one finger.',
    why: 'Palm-up beckoning is how you call an animal. Beckon with the palm DOWN and a scooping motion of the whole hand; indicate a person with an open hand.' },
  { group: 'body', level: 'do', text: 'Give and receive with your right hand, or with both — supporting your right forearm with your left hand is the respectful form.',
    why: 'The left hand is traditionally the one used for washing. Handing money, a business card or a gift with the left alone reads as careless at best.' },
  { group: 'body', level: 'avoid', text: 'Do not step over a person sitting or lying on the floor, or over food laid out on a mat.',
    why: 'Passing your lower body over someone or over food inverts the head-to-feet order. Walk around, or ask them to shift.' },
  { group: 'temple', level: 'do', text: 'Take your shoes off before entering a temple building, a home, and any shop with a step up and a pile of shoes at the door.',
    why: 'Shoes carry the street inside. The pile of sandals outside is the instruction; if you are unsure, look down.' },
  { group: 'temple', level: 'never', text: 'Do not climb on, sit on, or lean against a Buddha image, a stupa or a carving — and do not turn your back on a Buddha image to take a photograph of yourself.',
    why: 'These are objects of worship, not scenery. Sitting on a temple wall for a photo is the single most common thing visitors are asked to stop doing.' },
  { group: 'temple', level: 'never', text: 'If you are a woman, do not touch a monk or hand anything directly to one. Put the item down within his reach, or pass it through a man.',
    why: 'A monk’s vows forbid contact with women, including an accidental brush on a bus. He cannot decline politely mid-gesture, so the responsibility sits with you.' },
  { group: 'temple', level: 'do', text: 'When sitting in a temple, tuck your feet behind you and keep your head lower than any monk or image present.',
    why: 'The kneeling-sideways position (feet tucked back, weight on one hip) is what everyone around you will be doing. Copying the room is always safe.' },
  { group: 'dress', level: 'do', text: 'Cover shoulders and knees at every religious site — men included. Carry a light scarf or a sarong.',
    why: 'Some sites lend a wrap; many do not, and a few will simply turn you away after you have travelled to get there. Vest tops, short shorts and see-through fabric are all refused.' },
  { group: 'dress', level: 'avoid', text: 'Topless sunbathing, and walking through a town in swimwear or with no shirt.',
    why: 'The beach is one thing and the street is another. Local women swim fully dressed. Even in resort towns, shops and restaurants expect you to put something on.' },
  { group: 'public', level: 'never', text: 'Do not raise your voice, argue in public, or let an argument escalate — even when you are in the right.',
    why: 'Losing your temper loses you the room and, in a dispute over a bill or a fare, loses you the argument. Calm and a smile are not politeness here so much as technique.' },
  { group: 'public', level: 'avoid', text: 'Kissing and prolonged embracing in public.',
    why: 'Holding hands is unremarkable in the cities; anything more is not, and rather less so outside them. Same-sex couples are generally safe in the big cities and should read the room in rural areas.' },
  { group: 'public', level: 'avoid', text: 'Putting your bag or your feet on a seat someone else will sit on.',
    why: 'It is the feet rule again, and it applies to buses, waiting rooms and restaurant benches.' },
  { group: 'photos', level: 'do', text: 'Ask before photographing a person, a monk, a child, or the inside of anyone’s home or shrine.',
    why: 'A raised camera is a question; a nod is the answer. Hill-tribe villages in particular have been photographed relentlessly, and a request costs you nothing.' },
  { group: 'photos', level: 'avoid', text: 'Do not pay to photograph a chained, drugged or costumed animal, and do not photograph a slow loris held out for tourists.',
    why: 'Every loris on a beach was taken from the forest with its teeth cut out and will not survive long. Paying for the photograph funds the next one.' },
  { group: 'money', level: 'do', text: 'Tipping is not expected but is genuinely welcome. Round the fare up, leave the coins, and tip a guide or a driver you were pleased with.',
    why: 'Wages are low and service charges rarely reach staff. Nobody will chase you for a tip; nobody will forget one either.' },
  { group: 'money', level: 'do', text: 'Bargain in markets, never where a price is printed, and stop when you get to a price you are happy with.',
    why: 'Haggling is a normal, good-humoured exchange over a few coins, not a contest. Grinding a stallholder down over the equivalent of a dollar reads exactly as it sounds.' },
  { group: 'greeting', level: 'do', text: 'Learn hello and thank you in the local language and use them constantly.',
    why: 'Two words, badly pronounced, change every interaction of your day. This app’s phrasebook has both, offline, in all four languages.' },
];

export const ETIQUETTE = {
  th: [
    { group: 'talk', level: 'law', text: 'Do not criticise, mock or insult the King or the royal family — in speech, in writing, or in a social-media post made while you are in the country.',
      why: 'Thailand’s lèse-majesté law (Criminal Code Article 112) carries three to fifteen years in prison PER COUNT, and it has been applied to foreigners. Third parties can and do file the complaint. This is not a matter of manners.' },
    { group: 'money', level: 'law', text: 'Never step on a banknote or a coin to stop it blowing away, and do not deface currency.',
      why: 'Thai money carries the King’s image, so putting your foot on it combines the feet taboo with lèse-majesté. Pick it up with your hand.' },
    { group: 'greeting', level: 'do', text: 'The wai: palms together, a slight bow. Return one from someone of your own age or older with your fingertips at your chin; return a child’s or a server’s with a smile and a nod.',
      why: 'Height signals respect, so wai-ing everyone at maximum height is not extra-polite, it is confusing. You do not wai staff who wai you as part of their job.' },
    { group: 'public', level: 'do', text: 'Keep a “cool heart” — jai yen. Whatever has gone wrong, deal with it quietly.',
      why: 'Jai yen versus jai rorn (a hot heart) is a real and widely-used distinction. Whoever loses their temper first has lost.' },
    { group: 'temple', level: 'avoid', text: 'Do not get a Buddha tattoo, and think twice about buying a Buddha image to take home.',
      why: 'The Ministry of Culture has run campaigns against Buddha tattoos on foreigners specifically. Exporting an antique image legally requires a permit from the Fine Arts Department.' },
    { group: 'public', level: 'do', text: 'Stand for the royal anthem — it plays in cinemas before the film and in some public spaces at 08:00 and 18:00.',
      why: 'Everyone around you will stop where they are. Carrying on walking is conspicuous.' },
    { group: 'public', level: 'avoid', text: 'During Songkran, do not be annoyed at being soaked — but do not throw water at monks, at elderly people, or at anyone on a motorbike.',
      why: 'Water on a rider causes crashes, and every year it does. The festival is genuinely for everyone otherwise, foreigners very much included.' },
    { group: 'eating', level: 'do', text: 'Eat with a spoon in your right hand and a fork in your left; chopsticks are for noodle soups. Sticky rice is eaten with your fingers.',
      why: 'A fork is not brought to the mouth in Thailand — it pushes food onto the spoon. Nobody will correct you, but the spoon is why the food is cut small.' },
    { group: 'eating', level: 'do', text: 'Dishes are shared and put in the middle. Take a little at a time onto your own plate of rice.',
      why: 'Loading your plate at the start reads as though you do not expect to share. The rice is the meal; the dishes are what goes on it.' },
    { group: 'body', level: 'avoid', text: 'Do not put an arm around a Thai person’s shoulders for a photo unless you know them well.',
      why: 'It is close to the head, and it is more familiar than it looks.' },
  ],
  vi: [
    { group: 'talk', level: 'law', text: 'Do not criticise the Communist Party, the government or the state in public, online, or in a conversation a local could be held responsible for.',
      why: 'Articles 117 and 331 of the Penal Code are used against speech, and the person who bears the consequences is usually the Vietnamese citizen in the conversation rather than the visitor. Let them raise politics if they want to; do not put them in that position.' },
    { group: 'talk', level: 'avoid', text: 'Do not open with the war. If your host raises it, follow; otherwise leave it.',
      why: 'It is called the American War here, more than half the population was born after it, and most people would rather talk about anything else with a visitor. The war museums are the place for it.' },
    { group: 'temple', level: 'never', text: 'Do not touch, lean on or photograph a family’s ancestor altar without being invited to.',
      why: 'Nearly every home and many shops have one, often at eye level near the door with fruit and incense on it. It is not a decorative shelf; it is where the family’s dead are present.' },
    { group: 'eating', level: 'never', text: 'Never stand your chopsticks upright in a bowl of rice.',
      why: 'That is how rice is offered to the dead — incense sticks in an urn. It stops a table cold. Rest them across the bowl or on the holder.' },
    { group: 'eating', level: 'do', text: 'Wait for the eldest person to be served and to start, and offer them food first. Use both hands to pass a dish to someone older.',
      why: 'Seniority organises a Vietnamese table. Serving yourself first is the clearest way to look badly raised.' },
    { group: 'greeting', level: 'do', text: 'Address people by title plus their GIVEN name — Mr. Nam, not Mr. Nguyen — and use both hands with a slight bow of the head when giving a card or a gift.',
      why: 'Vietnamese names run family name first, and about 40% of the country is a Nguyen. The given name is the last one written.' },
    { group: 'temple', level: 'do', text: 'At the Ho Chi Minh Mausoleum: no shorts, no vest tops, no photographs, no talking, hands out of pockets, and keep moving.',
      why: 'The guards enforce all of it and will pull you out of the line. Bags and cameras are checked in beforehand.' },
    { group: 'body', level: 'do', text: 'Take your shoes off entering a home, a temple, many small guesthouses and some shops.',
      why: 'Look for the shoe rack or the pile. In the north it is close to universal.' },
    { group: 'money', level: 'do', text: 'Bargain at markets and with cyclo and xe om drivers, and agree the price before you get in.',
      why: 'An unagreed ride is a negotiation you will lose at the destination. Fixed-price shops and supermarkets do not haggle.' },
    { group: 'public', level: 'avoid', text: 'Do not show anger at a driver, a vendor or an official.',
      why: 'Losing face publicly is a real cost here and shouting imposes it on both of you. A calm, smiling repetition of what you want works far better.' },
  ],
  km: [
    { group: 'talk', level: 'never', text: 'Do not ask a Cambodian whether they lost family to the Khmer Rouge, and do not raise the period casually.',
      why: 'Around a quarter of the population died between 1975 and 1979. Almost everyone you meet over fifty lived it and almost everyone under fifty grew up with it. The genocide museums and the memorials are where you go with that; a tuk-tuk is not.' },
    { group: 'talk', level: 'avoid', text: 'Do not criticise the King, and be careful about politics in public.',
      why: 'The monarchy is genuinely respected across the political spectrum, and there are lèse-majesté provisions. Political criticism carries risk for the local in the conversation, not for you.' },
    { group: 'greeting', level: 'do', text: 'The sampeah: palms together, a small bow. Fingertips at the chest for a peer, at the chin for someone older or senior, at the nose for a monk or the King.',
      why: 'As with the Thai wai, the height carries the meaning. A nod and a smile are perfectly acceptable from a visitor who is unsure.' },
    { group: 'temple', level: 'do', text: 'At Angkor, remember it is an active place of worship: shoulders and knees covered, no climbing on carvings, no touching bas-reliefs, and no photographs of yourself posing in front of Buddha images.',
      why: 'The Apsara Authority turns visitors away for dress and has published rules after a run of nude-photo incidents. Skin oil damages sandstone reliefs that have survived eight centuries.' },
    { group: 'money', level: 'do', text: 'Carry small US dollar notes AND riel. Prices under a dollar come back in riel; a torn or heavily marked dollar bill will be refused.',
      why: 'The two currencies circulate together at roughly 4,000 riel to the dollar. Nobody will take a dollar with a tear in it, and ATMs dispense large notes that small vendors cannot break.' },
    { group: 'money', level: 'do', text: 'Tip. Wages here are among the lowest in the region and a small tip is a materially different amount of money than it is at home.',
      why: 'A dollar or two on a restaurant bill, or a few for a full-day tuk-tuk driver, is normal and noticed.' },
    { group: 'money', level: 'never', text: 'Do not give money to children who are begging or selling, and do not visit or donate to an orphanage as a tourist.',
      why: 'Both fund the trade that keeps children out of school and, in the orphanage case, separated from living parents. UNICEF and the Cambodian government have both campaigned against orphanage tourism. Give to a registered organisation instead.' },
    { group: 'body', level: 'do', text: 'Take off your shoes AND your hat before entering a pagoda or a home.',
      why: 'The hat is the part visitors forget. Sunglasses too, if you are speaking to a monk.' },
    { group: 'eating', level: 'do', text: 'Wait to be seated and to be invited to start; the oldest person eats first.',
      why: 'A Khmer meal is shared from the middle over individual bowls of rice, and the order matters more than the manner.' },
    { group: 'public', level: 'avoid', text: 'Do not photograph or make light of the memorials at Tuol Sleng and Choeung Ek — no smiling selfies.',
      why: 'They are the sites of mass murder and the staff have to ask visitors about this every day. Photography of the exhibits is allowed; posing with them is not the same thing.' },
  ],
  lo: [
    { group: 'talk', level: 'law', text: 'Do not criticise the Lao People’s Revolutionary Party or the government in public or online while in the country.',
      why: 'Laos is a single-party state with criminal provisions covering criticism of the state, and internet activity is monitored. As elsewhere, the risk falls hardest on the Lao person you are talking to.' },
    { group: 'temple', level: 'never', text: 'At the dawn alms-giving in Luang Prabang: if you are not taking part, stand well back, no flash, no blocking the procession, and do not buy sticky rice from the touts on the roadside to hand out.',
      why: 'The tak bat is a daily religious observance, not a performance. The rice sold to tourists is often old or unsafe and monks have fallen ill from it; some have stopped the procession entirely because of visitor behaviour. If you do want to participate, buy from a market at dawn, cover your shoulders, kneel, and do not make eye contact.' },
    { group: 'temple', level: 'never', text: 'If you are a woman, never touch a monk or pass anything into his hands — place it down or hand it to a man.',
      why: 'Strictly observed in Laos. On a crowded songthaew, move rather than risk it.' },
    { group: 'public', level: 'do', text: 'Accept “bo pen nyang” — never mind, no problem — and do not push. Hurrying people here does not work.',
      why: 'It is the country’s governing phrase. A bus that leaves when it is full leaves when it is full, and visible impatience only makes you the problem in the room.' },
    { group: 'greeting', level: 'do', text: 'The nop: palms together at chest height with a small bow. Lao people generally do not shake hands with each other.',
      why: 'A returned nop from a visitor is warmly received. Wait to see if a hand is offered before extending yours.' },
    { group: 'public', level: 'do', text: 'If you are given white cotton threads at a Baci ceremony, keep them on your wrist for at least three days and then untie rather than cut them.',
      why: 'The threads carry the blessing that the ceremony called into you. Taking them off in the car afterwards is exactly as it would look.' },
    { group: 'dress', level: 'do', text: 'Dress modestly and cover your shoulders and knees, in temples and generally. Lao women wear the sinh, an ankle-length wrap skirt.',
      why: 'Laos is the most conservative of the four on dress, and Luang Prabang has posted signs about it. A sinh bought locally is comfortable, cheap and quietly appreciated.' },
    { group: 'temple', level: 'do', text: 'Step OVER the raised threshold of a temple building, never on it.',
      why: 'The threshold is where the guardian spirit of the building rests.' },
    { group: 'body', level: 'avoid', text: 'Do not touch a Lao person’s head, and do not sit higher than a monk or an elder.',
      why: 'The head rule is observed strictly here. If everyone else is on the floor, get on the floor.' },
    { group: 'money', level: 'do', text: 'Prices are usually fixed in shops and negotiable in markets; agree a tuk-tuk fare before setting off.',
      why: 'Bargaining in Laos is gentler and quieter than in Thailand or Vietnam — a soft counter-offer, not a performance.' },
  ],
};

export function etiquetteFor(cc) {
  const own = ETIQUETTE[cc] || [];
  return { own, region: ETIQUETTE_REGION };
}

// A count for the door/hub row, so a traveller can see the section has substance before
// opening it.
export function etiquetteCount(cc) { return (ETIQUETTE[cc] || []).length + ETIQUETTE_REGION.length; }
