// Artwork for a place with no photo (docs/PROGRAM.md 5.3 item 7; 620 of 882 curated places have none, and stays and
// food are 41.6% of those gaps). Eleven motifs, one per family of the Places screen, drawn as inline SVG on the pattern
// of js/market-art.js, so a card without a photo reads as deliberate rather than broken.
//
// WHY INLINE. An SVG loaded through <img> cannot read the page's CSS variables and would paint one palette on all
// eleven skins. Inline, every shape carries a class instead of a colour and css/refined.css maps the classes to theme
// tokens (.pla-*), so each skin, light or dark, repaints the drawing. Nothing is fetched: the drawings are the strings below.
//
// HOUSE STYLE (DESIGN_SYSTEM.md, Mekong Retro). A quiet tinted ground, one sun on the right, the four-stripe band as the
// ground line, and flat objects with an ink outline. The classes, all mapped in css/refined.css:
//   b ground tint   s sun   p a w  object fills (family colour, accent, paper)   i ink fill
//   o ink outline (no fill unless a fill class is also given)   k a thick stroke in the family colour   g1..g4 the stripe band
//
// ACCESSIBILITY. The drawing says what it is, "Artwork: a bed", never "photo of ...": it is an illustration standing in for
// a picture, and a screen reader must not be told otherwise. A card captions it with nothing.
//
// The motifs are keyed by what a traveller looks for: stay, food, culture (temple and heritage), market, nature
// (waterfall and park), beach (island and water), viewpoint, transport (rental and getting around), practical (health,
// money, errands), nightlife, and `other` for anything else (wellness included).
import { placeFamilyKey } from './render-utils.js';

const GROUND = '<rect class="b" width="160" height="120"/>'
  + '<rect class="g1" y="102" width="160" height="3"/><rect class="g2" y="105" width="160" height="3"/>'
  + '<rect class="g3" y="108" width="160" height="3"/><rect class="g4" y="111" width="160" height="3"/>';

const ART = {
  // a bed with a window: guesthouse, hostel, homestay, hotel
  stay: '<circle class="s" cx="130" cy="28" r="16"/>'
    + '<rect class="w o" x="52" y="18" width="32" height="26" rx="2"/><path class="o" d="M68 18 V44 M52 31 H84"/>'
    + '<rect class="a o" x="30" y="46" width="12" height="54" rx="3"/>'
    + '<rect class="p o" x="38" y="64" width="86" height="22" rx="4"/>'
    + '<rect class="w o" x="46" y="55" width="24" height="12" rx="6"/>'
    + '<path class="a o" d="M76 64 H122 V86 H76 Z"/><path class="o" d="M38 86 V98 M120 86 V98"/>',
  // a bowl with steam and chopsticks: restaurants, cafes, street food
  food: '<circle class="s" cx="132" cy="26" r="15"/>'
    + '<path class="o" d="M62 50 Q56 42 62 34 M80 50 Q74 42 80 32 M98 50 Q92 42 98 34"/>'
    + '<path class="p o" d="M42 64 H118 Q116 98 80 100 Q44 98 42 64 Z"/>'
    + '<ellipse class="a o" cx="80" cy="64" rx="38" ry="8"/>'
    + '<path class="o" d="M58 66 Q70 72 82 66 T106 66"/>'
    + '<path class="o" d="M96 44 L124 78 M106 40 L134 74"/>',
  // a temple with a tiered roof: temples, museums, heritage
  culture: '<circle class="s" cx="132" cy="26" r="15"/>'
    + '<rect class="w o" x="48" y="74" width="64" height="26"/>'
    + '<path class="i" d="M74 100 V86 Q80 79 86 86 V100 Z"/>'
    + '<path class="p o" d="M38 74 L80 52 L122 74 Z"/><path class="a o" d="M52 56 L80 38 L108 56 Z"/>'
    + '<path class="o" d="M80 38 V22"/><circle class="s o" cx="80" cy="20" r="3.5"/>',
  // a stall with an awning and fruit on the counter: markets and shopping
  market: '<circle class="s" cx="134" cy="26" r="14"/>'
    + '<path class="o" d="M42 54 V100 M118 54 V100"/>'
    + '<path class="p o" d="M32 54 H128 L118 32 H42 Z"/>'
    + '<path class="a" d="M54 32 L50 54 H70 L70 32 Z M86 32 L90 54 H110 L106 32 Z"/>'
    + '<rect class="w o" x="36" y="78" width="88" height="22"/>'
    + '<circle class="a o" cx="58" cy="71" r="7"/><circle class="p o" cx="78" cy="69" r="9"/><circle class="s o" cx="100" cy="71" r="7"/>',
  // a waterfall between two hills and a tree: waterfalls, parks, hikes
  nature: '<circle class="s" cx="128" cy="26" r="15"/>'
    + '<path class="a o" d="M72 100 L108 56 L148 100 Z"/>'
    + '<path class="p o" d="M12 100 L52 46 L96 100 Z"/>'
    + '<path class="w o" d="M52 62 Q58 78 52 100 H68 Q62 78 66 66 Z"/>'
    + '<path class="o" d="M112 100 V88"/><path class="p o" d="M103 90 L112 72 L121 90 Z"/>',
  // a palm over the water: beaches, islands, diving
  beach: '<circle class="s" cx="132" cy="30" r="16"/>'
    + '<path class="a o" d="M62 100 Q64 72 76 44 L85 47 Q75 74 73 100 Z"/>'
    + '<path class="p o" d="M80 42 Q58 30 40 46 Q62 42 80 42 Z"/>'
    + '<path class="p o" d="M80 42 Q98 28 118 42 Q98 40 80 42 Z"/>'
    + '<path class="p o" d="M80 42 Q68 24 52 20 Q70 28 80 42 Z"/>'
    + '<circle class="a o" cx="80" cy="46" r="4"/>'
    + '<path class="a o" d="M14 94 Q32 86 50 94 T86 94 T122 94 T158 94"/>',
  // a ridge with a railing and a pennant: viewpoints and sunsets
  viewpoint: '<circle class="s" cx="42" cy="34" r="16"/>'
    + '<path class="p o" d="M16 100 L52 66 L74 84 L108 50 L146 100 Z"/>'
    + '<path class="o" d="M108 50 V32"/><path class="a o" d="M108 32 L124 37 L108 43 Z"/>'
    + '<path class="a o" d="M16 100 L38 84 L62 100 Z"/>'
    + '<path class="o" d="M70 92 H116 M74 92 V82 M90 92 V82 M106 92 V82"/>',
  // a scooter: rental, getting around
  transport: '<circle class="s" cx="132" cy="26" r="15"/>'
    + '<path class="o" d="M16 62 H34 M20 72 H36 M14 82 H32"/>'
    + '<path class="p o" d="M46 88 L66 62 H94 L116 88 H98 L90 76 H68 L62 88 Z"/>'
    + '<rect class="i" x="54" y="54" width="28" height="8" rx="3"/>'
    + '<path class="o" d="M96 62 L104 46 H116"/><circle class="s o" cx="116" cy="50" r="4"/>'
    + '<circle class="i" cx="46" cy="90" r="11"/><circle class="w" cx="46" cy="90" r="4"/>'
    + '<circle class="i" cx="116" cy="90" r="11"/><circle class="w" cx="116" cy="90" r="4"/>',
  // a bag with a cross: health, money, errands
  practical: '<circle class="s" cx="132" cy="26" r="15"/>'
    + '<path class="o" d="M66 48 V38 Q66 34 70 34 H90 Q94 34 94 38 V48"/>'
    + '<rect class="p o" x="42" y="46" width="76" height="54" rx="8"/>'
    + '<path class="w o" d="M75 58 H85 V68 H95 V78 H85 V88 H75 V78 H65 V68 H75 Z"/>',
  // a skyline under the sun-moon: bars, music, night markets
  nightlife: '<circle class="s" cx="128" cy="26" r="15"/>'
    + '<path class="p o" d="M20 100 V72 H42 V54 H62 V78 H78 V44 H100 V68 H118 V84 H140 V100 Z"/>'
    + '<rect class="s" x="48" y="62" width="6" height="6"/><rect class="s" x="48" y="76" width="6" height="6"/>'
    + '<rect class="s" x="84" y="54" width="6" height="6"/><rect class="s" x="84" y="68" width="6" height="6"/><rect class="s" x="84" y="82" width="6" height="6"/>'
    + '<rect class="s" x="124" y="92" width="6" height="5"/>',
  // a map pin: anything else, wellness included
  other: '<circle class="s" cx="130" cy="28" r="16"/>'
    + '<path class="a o" d="M52 100 H108"/>'
    + '<path class="p o" d="M80 96 C60 72 54 62 54 50 A26 26 0 0 1 106 50 C106 62 100 72 80 96 Z"/>'
    + '<circle class="w o" cx="80" cy="50" r="10"/>',
};

const LABEL = {
  stay: 'a bed', food: 'a bowl of noodles', culture: 'a temple', market: 'a market stall', nature: 'a waterfall',
  beach: 'a palm tree by the sea', viewpoint: 'a viewpoint', transport: 'a scooter', practical: 'a first-aid bag',
  nightlife: 'a city skyline at night', other: 'a map pin',
};

// Every key with a drawing.
export const PLACE_ART_KEYS = Object.keys(ART);

// The motif for a place: its family (stay, food, culture, ...), with `viewpoint` told apart from the rest of nature.
export function placeArtKey(p) {
  const fam = placeFamilyKey(p);
  const cats = (p && p.categories) || [];
  if (fam === 'nature' && (cats.includes('viewpoint') || cats.includes('sunset'))) return 'viewpoint';
  return ART[fam] ? fam : 'other';
}

// The SVG markup for one key, named for a screen reader as artwork. `crop` fills a box by trimming the sides (every
// drawing keeps its subject inside the middle 120 units for exactly this).
export function placeArtSVG(key, crop) {
  const k = ART[key] ? key : 'other';
  return '<svg class="pla" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid ' + (crop ? 'slice' : 'meet') + '"'
    + ' role="img" aria-label="Artwork: ' + LABEL[k] + '" xmlns="http://www.w3.org/2000/svg">' + GROUND + ART[k] + '</svg>';
}

// The artwork as a node (the frame colours it by `data-art`). The strings are the app's own, so innerHTML is safe here.
export function placeArtNode(key, cls) {
  const k = ART[key] ? key : 'other';
  const el = document.createElement('span');
  el.className = 'pla-frame' + (cls ? ' ' + cls : '');
  el.dataset.art = k;
  el.innerHTML = placeArtSVG(k, true);
  return el;
}

// Bytes of every drawing, for the PR's size line.
export function placeArtBytes() {
  const enc = (s) => (typeof TextEncoder === 'function' ? new TextEncoder().encode(s).length : s.length);
  return PLACE_ART_KEYS.reduce((n, k) => n + enc(ART[k]), enc(GROUND));
}
