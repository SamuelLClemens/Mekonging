// Pinch/scroll zoom and drag-pan for the app's offline SVG region maps: Explore's country and
// zone choosers (js/screens/explore.js) and the Weather screen's city map (js/screens/weather.js).
// Deliberately NOT a switch to the live MapLibre map (js/map.js) — these stay pure SVG so region,
// zone and city browsing keeps working with no network and no tiles; this only adds the zoom/pan
// gesture layer a tile map gets for free.
//
// `container` must be position:relative + overflow:hidden (every .region-map/.regions-map
// already is) and `svg` the <svg> element inside it. A gesture that turns out to be a drag or
// pinch is suppressed before it reaches the shape's own click handler underneath, so this never
// breaks the existing tap-a-country / tap-a-city interaction those maps already have.
export function attachSvgPanZoom(container, svg, opts = {}) {
  const maxScale = opts.maxScale || 5;
  const minScale = 1;
  let scale = 1, tx = 0, ty = 0;
  const pointers = new Map();
  let pinchStartDist = 0, pinchStartScale = 1;
  let dragLast = null;
  let moved = false;

  svg.style.transformOrigin = '0 0';
  container.style.touchAction = 'none';

  function apply() { svg.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`; }

  // Keeps the map from being panned so far that it leaves nothing but blank space on screen;
  // a little slack past each edge feels natural rather than hitting a hard wall.
  function clamp() {
    const r = container.getBoundingClientRect();
    if (scale <= minScale + 0.001) { tx = 0; ty = 0; return; }
    const overflowX = r.width * (scale - 1), overflowY = r.height * (scale - 1);
    const slackX = r.width * 0.15, slackY = r.height * 0.15;
    tx = Math.min(slackX, Math.max(-overflowX - slackX, tx));
    ty = Math.min(slackY, Math.max(-overflowY - slackY, ty));
  }

  // Zooms so the content under (px, py) — container-relative — stays under it.
  function zoomAt(px, py, newScale) {
    newScale = Math.min(maxScale, Math.max(minScale, newScale));
    const ratio = newScale / scale;
    tx = px - (px - tx) * ratio;
    ty = py - (py - ty) * ratio;
    scale = newScale;
    clamp();
    apply();
  }

  function step(factor) {
    const r = container.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, scale * factor);
  }

  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = container.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2));
  }, { passive: false });

  // Pointer capture is NOT taken on every pointerdown — a tap that never moves must reach the
  // shape underneath (a country, a province, a city dot) exactly like before this file existed.
  // Capturing unconditionally was tried first and broke every tap: once a pointer is captured,
  // the browser retargets the resulting synthetic click to the CAPTURING element (this
  // container), never the shape, no matter what the click listener below does about it.
  // So capture is deferred until the gesture is unambiguous — a second touch (a pinch) or
  // real movement past the drag threshold (below) — at which point losing the tap is correct.
  container.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      pinchStartScale = scale;
      dragLast = null;
      for (const id of pointers.keys()) { try { container.setPointerCapture(id); } catch { /* noop */ } }
    } else if (pointers.size === 1) {
      dragLast = { x: e.clientX, y: e.clientY };
    }
  });

  container.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const r = container.getBoundingClientRect();
      zoomAt(mid.x - r.left, mid.y - r.top, pinchStartScale * (dist / pinchStartDist));
      moved = true;
    } else if (dragLast && scale > minScale) {
      const dx = e.clientX - dragLast.x, dy = e.clientY - dragLast.y;
      if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        moved = true;
        try { container.setPointerCapture(e.pointerId); } catch { /* noop */ }
      }
      tx += dx; ty += dy;
      dragLast = { x: e.clientX, y: e.clientY };
      clamp();
      apply();
    }
  });

  function release(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStartDist = 0;
    if (pointers.size === 0) dragLast = null;
  }
  container.addEventListener('pointerup', release);
  container.addEventListener('pointercancel', release);

  // A drag or pinch that just ended must not also register as a tap on whatever shape is
  // underneath (a country, a province, a city dot) — caught in the capture phase, ahead of
  // those shapes' own bubble-phase click listeners, so it never reaches them.
  container.addEventListener('click', (e) => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);

  container.addEventListener('dblclick', (e) => {
    const r = container.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, scale < (minScale + maxScale) / 2 ? maxScale : minScale);
  });

  const controls = document.createElement('div');
  controls.className = 'svg-zoom-ctrl';
  const mkBtn = (label, title, onClick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'svg-zoom-btn'; b.textContent = label; b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', onClick);
    return b;
  };
  controls.append(
    mkBtn('+', 'Zoom in', () => step(1.5)),
    mkBtn('−', 'Zoom out', () => step(1 / 1.5)),
  );
  container.append(controls);

  return { zoomIn: () => step(1.5), zoomOut: () => step(1 / 1.5), reset: () => { scale = 1; tx = 0; ty = 0; apply(); } };
}
