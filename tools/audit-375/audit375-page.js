(async () => {
  // In-page measurement for the Q1 audit. Evaluated through CDP Runtime.evaluate (not subject to the page CSP).
  // Returns plain JSON. Reads the current route as rendered at 375 x 812.
  const W = 375;
  const TAP = 44;
  const TOL = 0.5; // sub-pixel tolerance on the 44 px floor
  const yt = () => new Promise((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  const doc = document.documentElement;
  const app = document.getElementById('app');
  const q = (s, r) => [...(r || document).querySelectorAll(s)];
  const cls = (el) => ((el.getAttribute && el.getAttribute('class')) || '').split(/\s+/).filter(Boolean);
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id && !/\d{3,}/.test(el.id)) s += '#' + el.id;
    const c = cls(el).slice(0, 3);
    if (c.length) s += '.' + c.join('.');
    return s;
  };
  const sel2 = (el) => {
    const p = el.parentElement;
    return (p && p !== document.body && p.id !== 'app' ? sel(p) + ' > ' : '') + sel(el);
  };
  const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const accName = (el) => clip(el.getAttribute('aria-label') || el.title || el.textContent || (el.querySelector && (el.querySelector('img[alt]') || {}).alt) || el.value || el.placeholder || '', 40);
  const visible = (el) => (el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true);
  const csCache = new Map();
  const style = (el) => { let s = csCache.get(el); if (!s) { s = getComputedStyle(el); csCache.set(el, s); } return s; };
  const inShell = (el) => !!el.closest('.topbar, .tabbar');
  // Entrance motion (`riseIn` 380 ms with a stagger, `pageIn`, a screen that mounts twice) leaves text at a fraction of its opacity and
  // boxes a few pixels off, for up to half a second after a card first renders; that read as contrast 1.0 to 1.3 and as shifted hit
  // areas. Contrast and hit areas are read as a traveller sees them a moment after the screen arrives: every finite animation is jumped
  // to its end state before each scan. A looping shimmer or spinner has no end state and is left alone.
  const finishAnimations = () => {
    let n = 0;
    for (const a of document.getAnimations()) {
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (!t || !isFinite(t.endTime)) continue;
      try { a.finish(); n++; } catch (e) { /* a paused or reversed animation cannot be finished */ }
    }
    return n;
  };

  // ---------- colour maths ----------
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  const colCache = new Map();
  function parseColor(str) {
    if (colCache.has(str)) return colCache.get(str);
    let out;
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(str);
    if (m) {
      let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
      out = [+m[1], +m[2], +m[3], a];
    } else {
      cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = str; cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      const a = d[3] / 255;
      out = a === 0 ? [0, 0, 0, 0] : [Math.min(255, Math.round(d[0] * 255 / d[3])), Math.min(255, Math.round(d[1] * 255 / d[3])), Math.min(255, Math.round(d[2] * 255 / d[3])), a];
    }
    colCache.set(str, out);
    return out;
  }
  const over = (fg, bg) => { // fg rgba over opaque bg rgb
    const a = fg[3];
    return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)];
  };
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const GRAD_STOP = /rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|hsla?\([^)]*\)|#[0-9a-fA-F]{3,8}\b/g;

  const splitTop = (str) => {
    const out = []; let depth = 0; let cur = '';
    for (const ch of String(str)) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };
  // Where image layer j of element a paints, and does it overlap the text box tr?
  function layerOverlaps(a, cs, j, tr) {
    const r = a.getBoundingClientRect();
    const sizes = splitTop(cs.backgroundSize); const poss = splitTop(cs.backgroundPosition); const reps = splitTop(cs.backgroundRepeat);
    const size = (sizes[j % sizes.length] || 'auto').split(/\s+/);
    const dim = (v, total) => (!v || v === 'auto' || v === 'cover' || v === 'contain') ? total : (v.endsWith('%') ? parseFloat(v) / 100 * total : parseFloat(v));
    const w = dim(size[0], r.width); const hh = dim(size[1] === undefined ? size[0] : size[1], r.height);
    const pos = (poss[j % poss.length] || '0% 0%').split(/\s+/);
    const place = (v, free) => (v || '50%').endsWith('%') ? free * parseFloat(v) / 100 : parseFloat(v);
    const x = place(pos[0], r.width - w); const y = place(pos[1], r.height - hh);
    const rep = reps[j % reps.length] || 'repeat';
    const toks = rep.split(/\s+/);
    const repX = rep === 'repeat' || rep === 'repeat-x' || toks[0] === 'repeat' || toks[0] === 'space' || toks[0] === 'round';
    const repY = rep === 'repeat' || rep === 'repeat-y' || toks[1] === 'repeat' || toks[1] === 'space' || toks[1] === 'round';
    const left = r.left + (repX ? 0 : x); const width = repX ? r.width : w;
    const top = r.top + (repY ? 0 : y); const height = repY ? r.height : hh;
    return !(tr.right <= left || tr.left >= left + width || tr.bottom <= top || tr.top >= top + height);
  }

  // Effective backdrops of el: candidate rgb list (worst case wins), or kind 'image' when a photo sits behind the text.
  function backdrops(el) {
    const tr = el.getBoundingClientRect();
    const chain = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) chain.push(e);
    const cum = [];
    let op = 1;
    for (let i = chain.length - 1; i >= 0; i--) { op *= parseFloat(style(chain[i]).opacity); cum[i] = op; }
    // stack is built top-down (el first), each entry painted ABOVE the next one
    const stack = [];
    for (let i = 0; i < chain.length; i++) {
      const a = chain[i]; const cs = style(a); const k = cum[i];
      const imgs = splitTop(cs.backgroundImage);
      imgs.forEach((img, j) => {
        if (img === 'none') return;
        if (!layerOverlaps(a, cs, j, tr)) return;
        if (/url\(/.test(img)) stack.push({ kind: 'image' });
        else if (/gradient\(/.test(img)) {
          const stops = (img.match(GRAD_STOP) || []).map(parseColor).map((c) => [c[0], c[1], c[2], c[3] * k]);
          stack.push({ kind: 'grad', stops: stops.length ? stops : [[0, 0, 0, 0]] });
        }
      });
      const bgc = parseColor(cs.backgroundColor);
      if (bgc[3] > 0) stack.push({ kind: 'solid', c: [bgc[0], bgc[1], bgc[2], bgc[3] * k] });
      if (bgc[3] * k >= 0.999) break;
    }
    // anything beneath an opaque solid or an all-opaque gradient is hidden
    let cut = stack.length;
    for (let i = 0; i < stack.length; i++) {
      const L = stack[i];
      if ((L.kind === 'solid' && L.c[3] >= 0.999) || (L.kind === 'grad' && L.stops.every((s) => s[3] >= 0.999))) { cut = i + 1; break; }
    }
    const used = stack.slice(0, cut).reverse(); // bottom-up
    if (used.some((L) => L.kind === 'image')) return { kind: 'image', list: null };
    let cands = [[255, 255, 255]];
    for (const L of used) {
      if (L.kind === 'solid') cands = cands.map((b) => over(L.c, b));
      else {
        const next = []; const seen = new Set();
        for (const b of cands) for (const sc of L.stops) { const c = over(sc, b); const hk = hex(c); if (!seen.has(hk)) { seen.add(hk); next.push(c); } }
        cands = next.slice(0, 24);
      }
    }
    return { kind: used.some((L) => L.kind === 'grad') ? 'gradient' : 'solid', list: cands, cumOpacity: cum[0] };
  }

  // ---------- helpers ----------
  async function preScroll() {
    // content-visibility: auto skips off-screen sections; walk the page so everything has laid out once.
    const h = () => Math.max(doc.scrollHeight, document.body.scrollHeight);
    for (let y = 0; y < h() + 1; y += 600) { window.scrollTo(0, y); await yt(); finishAnimations(); }
    window.scrollTo(0, 0); await yt(); finishAnimations();
  }

  async function overflowReport() {
    const body = document.body;
    const rep = {
      clientW: doc.clientWidth,
      docOver: doc.scrollWidth - doc.clientWidth,
      bodyOver: body.scrollWidth - body.clientWidth,
      appOver: app ? app.scrollWidth - app.clientWidth : 0,
      htmlOverflowX: getComputedStyle(doc).overflowX,
      bodyOverflowX: getComputedStyle(body).overflowX,
    };
    // culprits: boxes past an edge that nothing clips and nothing scrolls. Scanned at every scroll step,
    // because content-visibility: auto leaves off-screen sections without boxes (rect 0) until they are near the viewport.
    const found = new Map();
    const scan = () => {
      for (const e of q('body *')) {
        if (found.has(e)) continue;
        if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
        const r = e.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2) continue;
        if (r.right <= W + 0.5 && r.left >= -0.5) continue;
        const cs = style(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        let skip = false;
        for (let p = e; p && p !== document.body && p !== doc; p = p.parentElement) {
          const ps = style(p);
          if (ps.position === 'fixed') { skip = true; break; }
          if (p !== e && /(auto|scroll|hidden|clip)/.test(ps.overflowX)) { skip = true; break; }
        }
        if (skip) continue;
        found.set(e, { sel: sel2(e), label: accName(e), left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10, w: Math.round(r.width * 10) / 10 });
      }
    };
    const hh = () => Math.max(doc.scrollHeight, body.scrollHeight);
    for (let y = 0; y < hh() + 1; y += 500) { window.scrollTo(0, y); await yt(); finishAnimations(); scan(); }
    window.scrollTo(0, 0); await yt();
    const culprits = [...found.values()];
    culprits.sort((x, y) => y.right - x.right);
    const seen = new Set();
    rep.culprits = culprits.filter((c) => { if (seen.has(c.sel)) return false; seen.add(c.sel); return true; }).slice(0, 6);
    rep.pastRight = culprits.length ? Math.max(0, Math.round((Math.max(...culprits.map((c) => c.right)) - W) * 10) / 10) : 0;
    rep.pastLeft = culprits.length ? Math.max(0, Math.round(-Math.min(...culprits.map((c) => c.left)) * 10) / 10) : 0;
    rep.culpritCount = culprits.length;
    return rep;
  }

  const CTRL = 'a[href], button, [role="button"], [role="tab"], [role="link"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"], [role="option"], input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
  const own = (el, h) => !!h && (el === h || el.contains(h) || (el.labels && [...el.labels].some((l) => l.contains(h))));

  function isInlineLink(el) {
    if (el.tagName !== 'A') return false;
    if (style(el).display !== 'inline') return false;
    const p = el.parentElement;
    if (!p) return false;
    return (p.textContent || '').replace(/\s+/g, ' ').trim().length > (el.textContent || '').replace(/\s+/g, ' ').trim().length + 8;
  }

  // Tap targets + overlay coverage, one pass: scroll each control to the middle of the viewport, hit-test it.
  function coverAndTargets() {
    const out = { total: 0, small: [], inline: 0, covered: [], pinOverlap: 0, pinOverlapList: [], zero: 0, zeroList: [], offscreen: 0, capped: false, checked: 0, skipped: {} };
    const skip = (k) => { out.skipped[k] = (out.skipped[k] || 0) + 1; };
    const els = q(CTRL).filter((e) => visible(e));
    out.total = els.length;
    const MAXC = 1600;
    let n = 0;
    for (const el of els) {
      let r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) { el.scrollIntoView({ block: 'center', inline: 'nearest' }); finishAnimations(); r = el.getBoundingClientRect(); }
      if (r.width < 1 || r.height < 1) { out.zero += 1; if (out.zeroList.length < 8) out.zeroList.push({ sel: sel2(el), label: accName(el) }); continue; }
      if (r.width <= 2 || r.height <= 2) { skip('tiny'); continue; } // visually hidden helper (skip link, sr-only)
      if (el.tagName === 'CANVAS') { skip('canvas'); continue; } // the map canvas holds keyboard focus; markers over it are by design
      if (r.right < -1000 || r.left > 5000 || r.top > 60000) { skip('off-view'); continue; }
      if (el.type === 'file') { skip('file'); continue; }
      if (style(el).pointerEvents === 'none') { skip('pointer-events-none'); continue; }
      const shell = inShell(el);
      const inl = isInlineLink(el);
      if (inl) { out.inline += 1; }
      n += 1;
      if (n > MAXC) { out.capped = true; break; }
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      finishAnimations();
      r = el.getBoundingClientRect();
      // a link that wraps onto two lines has a bounding box that spans text that is not the link: test its biggest line box
      const frags = [...el.getClientRects()].filter((f) => f.width > 1 && f.height > 1);
      if (frags.length > 1) r = frags.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
      // a map marker outside the visible map is not on screen, whatever the DOM says
      const mapEl = el.closest('.maplibregl-map');
      if (el.closest('.maplibregl-marker') && mapEl) {
        const mr = mapEl.getBoundingClientRect();
        const cxm = r.left + r.width / 2; const cym = r.top + r.height / 2;
        if (cxm < mr.left || cxm > mr.right || cym < mr.top || cym > mr.bottom) { skip('off-map marker'); continue; }
      }
      // 3 x 3 grid inside the box: how much of it does something else sit on top of?
      const pts = [];
      for (const fy of [0.2, 0.5, 0.8]) for (const fx of [0.2, 0.5, 0.8]) pts.push([r.left + r.width * fx, r.top + r.height * fy]);
      let inView = 0; let blocked = 0; let byEl = null;
      const inSvg = !!el.closest('svg'); // an irregular SVG shape's bounding box holds other shapes: a grid cannot judge it
      for (const [x, y] of (inSvg ? [] : pts)) {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        inView += 1;
        const h = document.elementFromPoint(x, y);
        if (!own(el, h)) { blocked += 1; if (!byEl) byEl = h; }
      }
      out.checked += 1;
      if (inView === 0 && !inSvg) { out.offscreen += 1; continue; }
      if (blocked > 0 && byEl && el.closest('.maplibregl-marker') && byEl.closest('.maplibregl-marker')) {
        out.pinOverlap += 1;
        if (out.pinOverlapList.length < 6) out.pinOverlapList.push({ label: accName(el), by: accName(byEl.closest('.maplibregl-marker')), blocked, inView });
      } else if (blocked > 0) {
        const bs = byEl ? style(byEl) : null;
        let anc = byEl; let fixedAnc = null;
        for (let p = byEl; p && p !== document.body; p = p.parentElement) { const ps = style(p); if (ps.position === 'fixed' || ps.position === 'sticky' || ps.position === 'absolute') { fixedAnc = p; if (ps.position !== 'absolute') break; } }
        out.covered.push({ sel: sel2(el), label: accName(el), shell, blocked, inView, by: byEl ? sel2(byEl) : '?', byPos: fixedAnc ? style(fixedAnc).position : (bs ? bs.position : ''), byRoot: fixedAnc ? sel2(fixedAnc) : '' });
      }
      if (inl) continue;
      // effective hit area: visual box widened by whatever ::before/::after belongs to the control
      let w = r.width; let hgt = r.height;
      if (w < TAP - TOL || hgt < TAP - TOL) {
        const cxp = r.left + r.width / 2; const cyp = r.top + r.height / 2;
        const ray = (dx, dy) => {
          let c = 0;
          for (let s = 1; s <= 40; s++) {
            const x = cxp + dx * s; const y = cyp + dy * s;
            if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) break;
            if (!own(el, document.elementFromPoint(x, y))) break;
            c = s;
          }
          return c;
        };
        if (own(el, document.elementFromPoint(cxp, cyp))) {
          w = Math.max(w, ray(-1, 0) + ray(1, 0) + 1);
          hgt = Math.max(hgt, ray(0, -1) + ray(0, 1) + 1);
        }
      }
      if (w < TAP - TOL || hgt < TAP - TOL) {
        out.small.push({
          sel: sel2(el), label: accName(el), shell,
          vis: [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10],
          hit: [Math.round(w * 10) / 10, Math.round(hgt * 10) / 10],
        });
      }
    }
    window.scrollTo(0, 0);
    return out;
  }

  function contrastReport() {
    const out = { checked: 0, fails: [], unmeasured: 0, unmeasuredList: [], gradient: 0, disabledSkipped: 0 };
    const seenText = new Set();
    const all = q('body *');
    for (const el of all) {
      const tag = el.tagName.toLowerCase();
      if (/^(script|style|noscript|svg|path|canvas|option|optgroup|template|head|meta|link|title)$/.test(tag)) continue;
      if (el.closest('svg')) continue;
      let text = '';
      let kind = 'text';
      if (tag === 'input' || tag === 'textarea') {
        if (/^(hidden|file|checkbox|radio|range|color|image|submit|button|reset)$/.test(el.type || '')) continue;
        text = el.value ? el.value : '';
      } else if (tag === 'select') {
        continue;
      } else {
        for (const n of el.childNodes) if (n.nodeType === 3) text += n.nodeValue;
      }
      text = text.trim();
      let ph = false;
      if (!text && (tag === 'input' || tag === 'textarea') && el.placeholder) { text = el.placeholder; ph = true; kind = 'placeholder'; }
      if (!text || !/[\p{L}\p{N}]/u.test(text)) continue;
      if (!visible(el)) continue;
      let r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) { el.scrollIntoView({ block: 'center' }); finishAnimations(); r = el.getBoundingClientRect(); }
      if (r.width <= 2 && r.height <= 2) continue;
      const cs = style(el);
      if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' || cs.color === 'rgba(0, 0, 0, 0)') { out.gradient += 1; continue; }
      if (el.disabled || el.closest('[aria-disabled="true"], [disabled]')) { out.disabledSkipped += 1; continue; }
      const fs = parseFloat(cs.fontSize);
      const fw = parseInt(cs.fontWeight, 10) || 400;
      const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
      const need = large ? 3 : 4.5;
      const key = [sel(el), cs.color, cs.backgroundColor, cs.opacity, fs, fw].join('|');
      let fgStr = ph ? getComputedStyle(el, '::placeholder').color : cs.color;
      const fg = parseColor(fgStr);
      // cumulative opacity from el up
      let op = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) op *= parseFloat(style(e).opacity);
      const bd = backdrops(el);
      out.checked += 1;
      if (!bd.list) { out.unmeasured += 1; if (out.unmeasuredList.length < 12) out.unmeasuredList.push({ sel: sel2(el), text: clip(text, 30) }); continue; }
      let worst = null;
      for (const b of bd.list) {
        const fgc = over([fg[0], fg[1], fg[2], fg[3] * op], b);
        const rt = ratio(fgc, b);
        if (!worst || rt < worst.rt) worst = { rt, fgc, b };
      }
      if (bd.kind === 'gradient') out.gradient += 1;
      if (worst.rt < need - 0.005) {
        const id = key + '|' + clip(text, 20);
        if (seenText.has(id)) continue;
        seenText.add(id);
        out.fails.push({ sel: sel2(el), text: clip(text, 40), fg: hex(worst.fgc), bg: hex(worst.b), ratio: Math.round(worst.rt * 100) / 100, need, size: Math.round(fs * 10) / 10, weight: fw, bgKind: bd.kind, shell: inShell(el), kind });
      }
    }
    return out;
  }

  // The MapLibre attribution ("credits") panel: state as loaded, then what it covers once the traveller taps the (i).
  async function mapCreditsReport() {
    const out = [];
    const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    for (const d of q('details.maplibregl-ctrl-attrib')) {
      const map = d.closest('.maplibregl-map');
      if (!map) continue;
      map.scrollIntoView({ block: 'center' }); await yt();
      const mr = map.getBoundingClientRect();
      const mapArea = mr.width * mr.height;
      const panel = () => { const inner = d.querySelector('.maplibregl-ctrl-attrib-inner'); return inner ? inner.getBoundingClientRect() : d.getBoundingClientRect(); };
      const pins = () => q('.maplibregl-marker').filter((m) => { const r = m.getBoundingClientRect(); return r.width > 0 && inter(r, panel()) > 0 && d.open; }).map((m) => accName(m));
      const state = () => { const r = panel(); return { open: d.open, compactShow: d.classList.contains('maplibregl-compact-show'), w: Math.round(r.width), h: Math.round(r.height), areaPct: mapArea ? Math.round(inter(r, mr) / mapArea * 1000) / 10 : null }; };
      const rec = { map: [Math.round(mr.width), Math.round(mr.height)], asLoaded: state() };
      const was = d.open;
      d.open = true; await yt(); await yt();
      rec.whenOpened = state();
      rec.whenOpened.pinsUnder = pins();
      d.open = was; await yt();
      out.push(rec);
    }
    window.scrollTo(0, 0);
    return out;
  }

  // ---------- run ----------
  const res = { hash: location.hash, href: location.pathname + location.search + location.hash };
  const topbar = document.querySelector('.topbar h1');
  res.title = topbar ? (topbar.textContent || '').trim() : '(no topbar)';
  res.chars = ((app && app.textContent) || '').trim().length;
  res.viewport = { inner: [innerWidth, innerHeight], client: doc.clientWidth, vv: window.visualViewport ? Math.round(window.visualViewport.width * 10) / 10 : null, dpr: devicePixelRatio, hidden: document.hidden, state: document.visibilityState };
  res.dataset = { theme: doc.getAttribute('data-theme'), skin: doc.getAttribute('data-skin') };
  await document.fonts.ready;
  await preScroll();
  res.mapCredits = await mapCreditsReport();
  res.shut = q('details:not([open]):not(.maplibregl-ctrl-attrib)').length;
  res.overflowAsLoaded = await overflowReport();
  // open every fold (route-sweep does the same) so every control and string is measurable
  q('details:not([open]):not(.maplibregl-ctrl-attrib)').forEach((d) => { d.open = true; });
  for (let i = 0; i < 40; i++) await yt();
  await preScroll();
  res.overflowFoldsOpen = await overflowReport();
  finishAnimations();
  res.contrast = contrastReport();
  finishAnimations();
  res.controls = coverAndTargets();
  window.scrollTo(0, 0);
  // sanity: app root and doc height
  res.docHeight = doc.scrollHeight;
  res.theme = { colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' };
  return res;
})()
