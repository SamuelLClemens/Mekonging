/* In-page half of the language check (tools/lang-check/lang-check.py).
 *
 * The driver evaluates this file once per page through the DevTools protocol (the page's CSP forbids eval, but
 * Runtime.evaluate is not subject to it), then calls `window.__lc`. Nothing here is shipped to travellers.
 *
 *   __lc.routes()            every route the sweep knows (nav-groups.js plus the extras)
 *   __lc.setLang(code, mt)   switch the interface language; mt = also switch the online pass on
 *   __lc.visit(hash)         go to a route, open every fold, wait for the DOM to go quiet
 *   __lc.texts()             every visible string a traveller could read, with where it sits
 *   __lc.layout(code)        clipping, overflow, tight line boxes, missing glyphs, line breaking, RTL
 *   __lc.mtPass()            run the online pass on the current screen and say what it changed
 *
 * Layout numbers need layout: the driver refuses a page whose `document.hidden` is true.
 */
(() => {
  const APP = () => document.getElementById('app');
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'SVG', 'svg', 'NOSCRIPT']);
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'aria-placeholder'];
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  const yieldToTask = () => new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => resolve();
    ch.port2.postMessage(0);
  });

  async function settle(o) {
    const quietTicks = (o && o.quietTicks) || 40;
    const minMs = (o && o.minMs) || 350;
    const maxMs = (o && o.maxMs) || 6000;
    const root = APP();
    let mutations = 0, since = 0;
    const obs = new MutationObserver(() => { mutations += 1; since = 0; });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    const t0 = performance.now();
    while (performance.now() - t0 < maxMs) {
      await yieldToTask();
      since += 1;
      const opening = /Opening…|One moment\./.test(root.textContent || '');
      if (mutations && !opening && since >= quietTicks && performance.now() - t0 >= minMs) break;
    }
    obs.disconnect();
  }

  // Text the interface language machinery leaves alone on purpose: native phrase text carries a `lang`
  // attribute, and `data-no-i18n` / `data-no-mt` are the app's own opt-outs. This is js/i18n.js's rule.
  function blocked(el) {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (n.hasAttribute && (n.hasAttribute('lang') || n.hasAttribute('data-no-i18n') || n.hasAttribute('data-no-mt'))) return true;
    }
    return false;
  }

  function textNodes(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const out = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n);
    return out;
  }

  const api = {};

  // Routes the nav manifest does not list but a traveller reaches: the hospital and first-aid guides (from Emergency), the other
  // countries' Emergency screens and scam guides, the phrasebook page of a host language, the sign reader, and the Market.
  const EXTRA = ['#hospital-th', '#hospital-vi', '#hospital-kh', '#hospital-la', '#firstaid-th', '#firstaid-vi', '#firstaid-kh', '#firstaid-la',
    '#sos-vi', '#sos-kh', '#sos-la', '#scams-vi', '#scams-kh', '#scams-la', '#phrasebook-vi', '#phrasebook-km', '#phrasebook-lo',
    '#signtranslate-th', '#market', '#market-items', '#market-rooms', '#market-rides', '#market-cash'];

  api.routes = async () => {
    const m = await import('/scripts/route-sweep.js');
    const nav = (await m.routeSweepRoutes()).map((r) => r.hash);
    return [...nav, ...EXTRA.filter((h) => !nav.includes(h))];
  };

  api.setLang = async (code, mt) => {
    const i = await import('/js/i18n.js');
    i.setUiLang(code);
    i.setMtEnabled(!!mt);
    await i.ensureUiStrings(code);
    return { lang: document.documentElement.lang, dir: document.documentElement.dir };
  };

  api.visit = async (hash) => {
    if (location.hash === hash) { location.hash = '#lc-blank'; await yieldToTask(); }
    location.hash = hash;
    await settle();
    // the first visit to a lazy screen can end its quiet spell before the module has filled it in: look again while it is still nearly empty
    for (let i = 0; i < 2 && (!document.querySelector('.topbar h1') || (APP().textContent || '').trim().length < 120); i++) await settle({ minMs: 600 });
    const shut = [...APP().querySelectorAll('details:not([open])')];
    shut.forEach((d) => { d.open = true; });
    if (shut.length) await settle({ quietTicks: 20, minMs: 200, maxMs: 2500 });
    // the router may have sent the hash somewhere else (an unknown route falls through to Home)
    return { hash: location.hash, hidden: document.hidden, title: norm((document.querySelector('.topbar h1') || {}).textContent) };
  };

  // Every string a traveller could read on this screen: text nodes and the attributes a screen reader reads.
  // `b` is 1 when every place the string sits is one the interface language leaves alone on purpose.
  api.texts = () => {
    const root = APP();
    const seen = new Map();
    const add = (s, kind, el) => {
      s = norm(s);
      if (!s) return;
      const rec = seen.get(s) || { s, n: 0, kinds: new Set(), blocked: true };
      rec.n += 1;
      rec.kinds.add(kind);
      if (!blocked(el)) rec.blocked = false;
      seen.set(s, rec);
    };
    for (const n of textNodes(root)) add(n.nodeValue, 'text', n.parentElement);
    for (const el of root.querySelectorAll('[placeholder],[aria-label],[title],[alt],[aria-placeholder]')) {
      for (const a of ATTRS) { const v = el.getAttribute(a); if (v) add(v, a, el); }
    }
    return [...seen.values()].map((r) => ({ s: r.s, n: r.n, k: [...r.kinds].join(','), b: r.blocked ? 1 : 0 }));
  };

  // ---- layout ---------------------------------------------------------------------------------------------
  const scriptRe = { th: /[฀-๿]/, lo: /[຀-໿]/, km: /[ក-៿]/ };
  const rtlRe = /[֐-ۿݐ-ݿ]/;
  const hasInk = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // A glyph is missing when the browser draws the same box it draws for a code point nobody has assigned.
  let _ctx = null;
  function glyphMissing(ch, font) {
    if (!_ctx) { const c = document.createElement('canvas'); c.width = 64; c.height = 64; _ctx = c.getContext('2d', { willReadFrequently: true }); }
    const draw = (s) => {
      _ctx.clearRect(0, 0, 64, 64); _ctx.font = font; _ctx.fillStyle = '#000'; _ctx.textBaseline = 'alphabetic';
      _ctx.fillText(s, 6, 44);
      const d = _ctx.getImageData(0, 0, 64, 64).data;
      let h = 0; for (let i = 3; i < d.length; i += 4) h = (h * 31 + d[i]) | 0;
      return h;
    };
    return draw(ch) === draw('\u{10FFFF}');
  }

  // How many CSS pixels of a one-line text's ink fall outside the box that clips it. The baseline comes from a zero-size
  // inline-block put in front of the text (exact, whatever font the browser fell back to); the ink extents come from
  // measureText on the same string and font.
  function inkClip(el, node, cs) {
    try {
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
      const content = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (content / lh > 1.6) return '';
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      node.parentNode.insertBefore(probe, node);
      const base = probe.getBoundingClientRect().bottom;
      probe.remove();
      if (!_ctx) { const c = document.createElement('canvas'); c.width = 64; c.height = 64; _ctx = c.getContext('2d', { willReadFrequently: true }); }
      _ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      const m = _ctx.measureText(node.nodeValue.trim());
      const box = el.getBoundingClientRect();
      const top = box.top + parseFloat(cs.borderTopWidth), bot = box.bottom - parseFloat(cs.borderBottomWidth);
      const above = Math.max(0, top - (base - m.actualBoundingBoxAscent));
      const below = Math.max(0, (base + m.actualBoundingBoxDescent) - bot);
      return ' ink ' + above.toFixed(1) + 'px above, ' + below.toFixed(1) + 'px below';
    } catch (e) { return ''; }
  }

  api.layout = (code, only) => {
    const want = (k) => !only || only.includes(k);
    const root = APP();
    const W = window.innerWidth;
    const out = { w: W, hidden: document.hidden, overflow: [], clipped: [], tight: [], glyphs: [], breaks: null, rtl: null, chars: 0 };
    const label = (el) => (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''));
    const snip = (s) => norm(s).slice(0, 48);
    const script = scriptRe[code] || null;

    // 1. overflow: a box that leaves the viewport (an SVG's own clipped outline, or a map's markers, is not a finding)
    if (want('over')) for (const el of root.querySelectorAll('*')) {
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
      if (el.closest('.sheet-backdrop, [hidden], .maplibregl-map')) continue;
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      if (b.right > W + 0.5 || b.left < -0.5) {
        const txt = snip(el.textContent);
        if (txt || el.tagName === 'IMG') out.overflow.push(label(el) + ':' + Math.round(b.left) + '..' + Math.round(b.right) + ' ' + txt);
      }
    }

    // 2. text cut off: a box that hides its overflow, or clamps lines, and holds more than it shows
    if (want('clip')) for (const el of root.querySelectorAll('*')) {
      if (el.closest('svg, .maplibregl-map')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const hidesX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
      const hidesY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
      if (!hidesX && !hidesY) continue;
      if (!hasInk(el) || !norm(el.textContent)) continue;
      // a 1 px box with clipped overflow is the visually-hidden pattern (a screen-reader label), and a content-visibility card is sized
      // by the browser before it is painted: neither is text a traveller loses
      const bx = el.getBoundingClientRect();
      if (bx.width <= 2 || bx.height <= 2 || (cs.contentVisibility && cs.contentVisibility !== 'visible')) continue;
      const dx = hidesX ? el.scrollWidth - el.clientWidth : 0;
      const dy = hidesY ? el.scrollHeight - el.clientHeight : 0;
      if (dx > 1.5 || dy > 1.5) {
        const ell = cs.textOverflow === 'ellipsis' && dx > 1.5;
        out.clipped.push(label(el) + ' dx=' + Math.round(dx) + ' dy=' + Math.round(dy) + (ell ? ' ellipsis' : '') + ' ' + snip(el.textContent));
      }
    }

    // 3. tight line boxes: stacked Thai, Lao and Khmer marks and Vietnamese tone marks need room above and below
    const need = { th: 1.3, lo: 1.3, km: 1.4, vi: 1.2 }[code];
    const tightRe = code === 'vi' ? /[\u1EA0-\u1EF9]/ : script;   // Vietnamese: only letters that carry a stacked mark
    if (need && want('tight')) {
      const seen = new Set();
      for (const n of textNodes(root)) {
        const p = n.parentElement;
        if (blocked(p) || !hasInk(p)) continue;
        if (tightRe && !tightRe.test(n.nodeValue)) continue;
        const cs = getComputedStyle(p);
        const fs = parseFloat(cs.fontSize);
        // `normal` takes its height from the fonts in use, marks included, so it is never the cause
        if (cs.lineHeight === 'normal') continue;
        const lh = parseFloat(cs.lineHeight);
        if (!(fs > 0) || !(lh > 0)) continue;
        const ratio = lh / fs;
        const hides = cs.overflowY !== 'visible' || cs.overflowX !== 'visible' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none');
        if (ratio < need && !seen.has(p)) {
          seen.add(p);
          const ink = hides ? inkClip(p, n, cs) : '';
          const lost = /ink ([\d.]+)px above, ([\d.]+)px below/.exec(ink);
          const clips = hides && (lost ? (parseFloat(lost[1]) > 0.4 || parseFloat(lost[2]) > 0.4) : true);
          out.tight.push((clips ? 'CLIPS ' : '') + label(p) + ' lh/fs=' + ratio.toFixed(2) + ink + ' ' + snip(n.nodeValue));
        }
      }
    }

    // 4. missing glyphs: every distinct non-ASCII character on the screen, drawn in the font it is shown in
    if (want('glyph')) {
      const byFont = new Map();
      for (const n of textNodes(root)) {
        const p = n.parentElement;
        if (!p || blocked(p) || !hasInk(p)) continue;
        out.chars += n.nodeValue.length;
        const cs = getComputedStyle(p);
        const font = cs.fontStyle + ' ' + cs.fontWeight + ' 28px ' + cs.fontFamily;
        let set = byFont.get(font); if (!set) byFont.set(font, set = new Set());
        for (const ch of n.nodeValue) if (ch.codePointAt(0) > 0x7f && !/\s/.test(ch)) set.add(ch);
      }
      const bad = new Set();
      for (const [font, set] of byFont) for (const ch of set) {
        if (ch === '�') { bad.add('U+FFFD'); continue; }
        // marks and joiners draw nothing by themselves; emoji are the platform's
        if (/\p{M}|​|‌|‍|️/u.test(ch)) continue;
        if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(ch)) continue;
        if (glyphMissing(ch, font)) bad.add('U+' + ch.codePointAt(0).toString(16).toUpperCase());
      }
      out.glyphs = [...bad];
    }

    // 5. line breaking in the scripts that have no spaces: a break inside a word, or inside a letter
    if (script && want('break') && typeof Intl !== 'undefined' && Intl.Segmenter) {
      const wseg = new Intl.Segmenter(code, { granularity: 'word' });
      const gseg = new Intl.Segmenter(code, { granularity: 'grapheme' });
      let lines = 0, midWord = 0, midLetter = 0;
      const ex = [];
      for (const n of textNodes(root)) {
        const p = n.parentElement;
        const v = n.nodeValue;
        if (blocked(p) || !hasInk(p) || v.length < 10 || !script.test(v)) continue;
        const wb = new Set([v.length]);
        for (const s of wseg.segment(v)) wb.add(s.index);
        const gb = new Set();
        for (const s of gseg.segment(v)) gb.add(s.index);
        const r = document.createRange();
        let prevTop = null;
        for (let i = 0; i < v.length; i++) {
          r.setStart(n, i); r.setEnd(n, i + 1);
          const rs = r.getClientRects();
          if (!rs.length) continue;
          const top = Math.round(rs[0].top);
          if (prevTop !== null && top > prevTop + 3 && v[i] !== ' ' && v[i - 1] !== ' ') {
            lines += 1;
            if (!gb.has(i)) { midLetter += 1; if (ex.length < 4) ex.push('LETTER ' + v.slice(Math.max(0, i - 6), i) + '|' + v.slice(i, i + 6)); }
            else if (!wb.has(i)) { midWord += 1; if (ex.length < 4) ex.push('WORD ' + v.slice(Math.max(0, i - 6), i) + '|' + v.slice(i, i + 6)); }
          }
          prevTop = top;
        }
      }
      out.breaks = { lines, midWord, midLetter, ex };
    }

    // 6. right to left: text that is not set right to left, text pinned left, and the order of the two shells
    if (want('rtl') && document.documentElement.dir === 'rtl') {
      let pinned = 0, wrongDir = 0; const ex = [];
      for (const n of textNodes(root)) {
        const p = n.parentElement;
        if (blocked(p) || !hasInk(p) || !rtlRe.test(n.nodeValue)) continue;
        const cs = getComputedStyle(p);
        if (cs.direction !== 'rtl') { wrongDir += 1; if (ex.length < 4) ex.push('dir ' + label(p)); }
        if (cs.textAlign === 'left') { pinned += 1; if (ex.length < 4) ex.push('left ' + label(p) + ' ' + snip(n.nodeValue)); }
      }
      const bar = document.querySelector('.tabbar');
      const kids = bar ? [...bar.children].filter(hasInk) : [];
      const tabOrder = kids.length > 1 ? (kids[0].getBoundingClientRect().left > kids[kids.length - 1].getBoundingClientRect().left ? 'rtl' : 'ltr') : '';
      const back = document.querySelector('.topbar button, .topbar a');
      out.rtl = { pinnedLeft: pinned, wrongDir, tabOrder, backSide: back ? (back.getBoundingClientRect().left > W / 2 ? 'right' : 'left') : '', ex };
    }
    return out;
  };

  // What the online pass changes on this screen (needs a connection and the language's MT switch on).
  api.mtPass = async () => {
    const i = await import('/js/i18n.js');
    const before = new Set(api.texts().map((r) => r.s));
    const t0 = performance.now();
    let n = 0;
    try { n = await i.autoTranslateTree(APP()); } catch { n = -1; }
    const changed = api.texts().filter((r) => !before.has(r.s) && !r.b).map((r) => r.s);
    return { calls: n, changed: changed.length, ms: Math.round(performance.now() - t0), sample: changed.slice(0, 3) };
  };

  window.__lc = api;
  return true;
})();
