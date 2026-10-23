// Category artwork for the shared Market (docs/EXCHANGE.md §2 and §17, slice M4b-1): one
// illustration per kind (item, meetup, room, ride) and per item category (ITEM_CATEGORIES), 14 in
// all, drawn here as inline SVG. Photos arrive with M4c; until then every card and listing page
// leads with one of these.
//
// WHY INLINE. An SVG loaded through <img> cannot read the page's CSS variables, so it would paint
// one palette on all eleven skins. Inline, every shape carries a class instead of a colour and
// css/market.css maps the classes to theme tokens (.mxa-*), so each skin, light or dark, repaints
// the art in its own colours. Nothing is fetched: the drawings are the strings below.
//
// HOUSE STYLE (DESIGN_SYSTEM.md, Mekong Retro). A quiet tinted ground, one sun, the four-stripe
// band as the ground line, and flat objects with an ink outline. The stripe band reads the retro
// theme's --stripe-1..4 and falls back to the skin's own accents elsewhere. The sun always sits on
// the right, so the kind label a card lays over the top-left corner never covers it.
//
// The classes, all mapped in css/market.css:
//   b  ground tint    s  sun     p a w  object fills (kind colour, accent, paper)
//   i  ink fill       o  ink outline (no fill unless a fill class is also given)
//   k  a thick stroke in the kind colour (frames, straps)
//   g1..g4  the stripe band
// Every drawing is decorative: the SVG is aria-hidden and the card or page names the listing.

const GROUND = '<rect class="b" width="160" height="120"/>'
  + '<rect class="g1" y="102" width="160" height="3"/><rect class="g2" y="105" width="160" height="3"/>'
  + '<rect class="g3" y="108" width="160" height="3"/><rect class="g4" y="111" width="160" height="3"/>';

const ART = {
  // ---- the kinds ----
  item: '<circle class="s" cx="122" cy="34" r="20"/>'
    + '<path class="o" d="M70 40 Q80 26 90 40"/>'
    + '<rect class="p o" x="56" y="38" width="48" height="62" rx="13"/>'
    + '<path class="a o" d="M58 54 Q80 40 102 54 V62 Q80 70 58 62 Z"/>'
    + '<rect class="w o" x="65" y="72" width="30" height="20" rx="6"/>'
    + '<path class="o" d="M70 80 H90"/>',
  meetup: '<circle class="s" cx="132" cy="26" r="15"/>'
    + '<rect class="w o" x="64" y="14" width="34" height="22" rx="9"/><path class="w o" d="M74 35 L70 44 L82 35"/>'
    + '<circle class="i" cx="73" cy="25" r="2.4"/><circle class="i" cx="81" cy="25" r="2.4"/><circle class="i" cx="89" cy="25" r="2.4"/>'
    + '<path class="p o" d="M40 100 Q40 70 58 70 Q76 70 76 100 Z"/><circle class="w o" cx="58" cy="56" r="11"/>'
    + '<path class="a o" d="M84 100 Q84 66 102 66 Q120 66 120 100 Z"/><circle class="w o" cx="102" cy="52" r="11"/>'
    + '<path class="o" d="M120 82 L132 66"/>',
  room: '<circle class="s" cx="126" cy="30" r="18"/>'
    + '<path class="o" d="M58 86 V102 M80 86 V102 M102 86 V102"/>'
    + '<rect class="w o" x="50" y="58" width="60" height="28"/>'
    + '<path class="p o" d="M42 61 L80 30 L118 61 Z"/><path class="o" d="M42 61 L37 53 M118 61 L123 53 M80 30 V22"/>'
    + '<rect class="a o" x="74" y="66" width="12" height="20" rx="2"/>'
    + '<rect class="s o" x="57" y="65" width="11" height="10"/><rect class="s o" x="92" y="65" width="11" height="10"/>',
  ride: '<circle class="s" cx="128" cy="28" r="16"/>'
    + '<path class="o" d="M20 66 H34 M16 76 H32 M22 86 H36"/>'
    + '<path class="p o" d="M42 48 Q42 38 52 38 H104 Q114 38 114 48 V52 H42 Z"/>'
    + '<path class="o" d="M48 52 V66 M88 52 V66"/>'
    + '<rect class="a o" x="44" y="62" width="48" height="26" rx="4"/>'
    + '<path class="a o" d="M92 52 H100 Q118 62 120 88 H92 Z"/><path class="w o" d="M96 56 H100 Q112 63 114 74 H96 Z"/>'
    + '<circle class="i" cx="60" cy="90" r="11"/><circle class="w" cx="60" cy="90" r="4"/>'
    + '<circle class="i" cx="108" cy="90" r="11"/><circle class="w" cx="108" cy="90" r="4"/>'
    + '<circle class="s o" cx="119" cy="76" r="3"/>',
  // ---- the item categories ----
  carseat: '<circle class="s" cx="126" cy="30" r="18"/>'
    + '<rect class="a o" x="54" y="88" width="52" height="12" rx="4"/>'
    + '<path class="p o" d="M62 90 L57 50 Q57 24 80 24 Q103 24 103 50 L98 90 Z"/>'
    + '<path class="p o" d="M58 46 Q46 44 49 60 L59 64 M102 46 Q114 44 111 60 L101 64"/>'
    + '<path class="w o" d="M67 90 L65 54 Q65 38 80 38 Q95 38 95 54 L93 90 Z"/>'
    + '<path class="o" d="M72 46 L78 74 M88 46 L82 74 M80 80 V90"/><circle class="s o" cx="80" cy="77" r="4"/>',
  stroller: '<circle class="s" cx="128" cy="28" r="16"/>'
    + '<path class="p o" d="M112 64 A30 30 0 0 0 82 34 V64 Z"/>'
    + '<path class="a o" d="M114 64 H50 Q50 86 72 88 H92 Q114 86 114 64 Z"/>'
    + '<path class="o" d="M50 64 L40 40 H30 M96 88 L102 96 M66 88 L58 96"/>'
    + '<circle class="i" cx="104" cy="98" r="8"/><circle class="w" cx="104" cy="98" r="3"/>'
    + '<circle class="i" cx="56" cy="98" r="8"/><circle class="w" cx="56" cy="98" r="3"/>',
  carrier: '<circle class="s" cx="128" cy="30" r="16"/>'
    + '<path class="p o" d="M58 26 H67 L71 60 H62 Z"/><path class="p o" d="M93 26 H102 L98 60 H89 Z"/>'
    + '<circle class="w o" cx="80" cy="46" r="12"/><path class="o" d="M75 36 Q80 31 85 36"/>'
    + '<path class="a o" d="M57 56 H103 Q105 86 92 96 H68 Q55 86 57 56 Z"/>'
    + '<path class="o" d="M66 68 H94"/><rect class="p o" x="48" y="92" width="64" height="9" rx="4"/>',
  toys: '<circle class="s" cx="128" cy="30" r="16"/>'
    + '<rect class="p o" x="40" y="72" width="28" height="28" rx="3"/><rect class="w o" x="48" y="80" width="12" height="12"/>'
    + '<rect class="a o" x="70" y="72" width="28" height="28" rx="3"/><circle class="w o" cx="84" cy="86" r="6"/>'
    + '<rect class="w o" x="54" y="44" width="28" height="28" rx="3"/><path class="p o" d="M60 66 L68 51 L76 66 Z"/>'
    + '<circle class="s o" cx="118" cy="88" r="12"/><path class="o" d="M106 88 Q118 80 130 88"/>',
  'kids-clothing': '<circle class="s" cx="128" cy="30" r="16"/>'
    + '<path class="p o" d="M60 34 L72 30 Q80 38 88 30 L100 34 L114 46 L106 56 L98 50 V82 Q98 92 90 96 L84 92 H76 L70 96 Q62 92 62 82 V50 L54 56 L46 46 Z"/>'
    + '<path class="o" d="M72 30 Q80 40 88 30"/>'
    + '<path class="s o" d="M80 52 L83 59 L90 59 L84 64 L86 71 L80 67 L74 71 L76 64 L70 59 L77 59 Z"/>'
    + '<circle class="i" cx="76" cy="88" r="2"/><circle class="i" cx="84" cy="88" r="2"/>',
  bicycle: '<circle class="s" cx="128" cy="28" r="16"/>'
    + '<circle class="w o" cx="50" cy="82" r="19"/><circle class="w o" cx="112" cy="82" r="19"/>'
    + '<path class="k" d="M50 82 L72 54 L80 82 Z M72 54 H102 L80 82 M102 54 L112 82"/>'
    + '<circle class="i" cx="50" cy="82" r="3"/><circle class="i" cx="112" cy="82" r="3"/>'
    + '<rect class="i" x="63" y="45" width="17" height="5" rx="2"/><path class="o" d="M102 54 L99 44 H110"/>'
    + '<circle class="s o" cx="80" cy="82" r="4"/>',
  camping: '<circle class="s" cx="128" cy="28" r="15"/>'
    + '<path class="p o" d="M34 100 L80 34 L126 100 Z"/>'
    + '<path class="i" d="M80 56 L69 100 H91 Z"/><path class="a o" d="M80 56 L91 100 H99 Z"/>'
    + '<path class="o" d="M80 34 V20"/><path class="s o" d="M80 20 L93 24 L80 29 Z"/>'
    + '<path class="o" d="M34 100 L26 102 M126 100 L134 102"/>',
  clothing: '<circle class="s" cx="128" cy="30" r="16"/>'
    + '<path class="o" d="M80 34 Q74 32 74 26 Q74 20 80 20 Q86 20 86 26 M80 34 L46 52 H114 Z"/>'
    + '<path class="p o" d="M54 50 L68 44 Q80 54 92 44 L106 50 L118 64 L108 72 L100 66 V100 H60 V66 L52 72 L42 64 Z"/>'
    + '<path class="w o" d="M68 44 L80 58 L92 44"/><rect class="a o" x="86" y="68" width="10" height="10"/>'
    + '<circle class="i" cx="80" cy="68" r="2"/><circle class="i" cx="80" cy="78" r="2"/><circle class="i" cx="80" cy="88" r="2"/>',
  books: '<circle class="s" cx="130" cy="26" r="15"/>'
    + '<rect class="p o" x="42" y="84" width="76" height="16" rx="2"/><path class="o" d="M50 84 V100"/>'
    + '<rect class="a o" x="48" y="68" width="66" height="16" rx="2"/><path class="o" d="M56 68 V84"/>'
    + '<g transform="rotate(-6 83 58)"><rect class="w o" x="54" y="50" width="60" height="16" rx="2"/><path class="o" d="M62 50 V66"/></g>'
    + '<path class="s o" d="M96 46 V36 L101 40 L106 36 V46"/>',
  other: '<circle class="s" cx="128" cy="28" r="16"/>'
    + '<path class="p o" d="M46 58 L80 70 V102 L46 90 Z"/><path class="a o" d="M80 70 L114 58 V90 L80 102 Z"/>'
    + '<path class="w o" d="M46 58 L80 46 L114 58 L80 70 Z"/><path class="s" d="M60 53 L94 65 L100 63 L66 51 Z"/>'
    + '<path class="s o" d="M114 66 L128 62 L132 70 L118 74 Z"/><circle class="i" cx="121" cy="68" r="1.8"/>',
};

// Every key with a drawing: the four kinds, then the ten item categories.
export const ART_KEYS = Object.keys(ART);

// The drawing a listing leads with: an item's own category where it has one, else its kind.
export function artKey(listing) {
  const l = listing || {};
  if (l.kind === 'item' && l.category && ART[l.category]) return l.category;
  return ART[l.kind] ? l.kind : 'item';
}

// The SVG markup for one key. `crop` fills a square tile by trimming the sides (the drawings keep
// their subject inside the middle 120 units for exactly this).
export function artSVG(key, crop) {
  const body = ART[key] || ART.item;
  return '<svg class="mxa" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid ' + (crop ? 'slice' : 'meet') + '"'
    + ' aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">' + GROUND + body + '</svg>';
}

// The artwork as a node. `kind` sets the colour family (css/market.css, [data-kind]); the
// strings are the app's own, never another traveller's text, so innerHTML is safe here.
export function artNode(key, kind, cls) {
  const el = document.createElement('span');
  el.className = 'mxa-frame' + (cls ? ' ' + cls : '');
  el.dataset.kind = kind || 'item';
  el.innerHTML = artSVG(key, !!(cls && /\bmxa-crop\b/.test(cls)));
  return el;
}

// Bytes of every drawing, for the PR's size line (the validator prints it).
export function artBytes() {
  const enc = (s) => (typeof TextEncoder === 'function' ? new TextEncoder().encode(s).length : s.length);
  return ART_KEYS.reduce((n, k) => n + enc(ART[k]), enc(GROUND));
}
