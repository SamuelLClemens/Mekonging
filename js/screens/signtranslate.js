// Point-camera-and-translate signage (#signtranslate, Slice G / item 11.2).
//
// Built as "online-required" per the owner's explicit call after seeing the WORK_ORDER.md
// feasibility research: neither Safari nor mobile Chrome expose an on-device translation API,
// so translating always needs the network — this screen says so plainly rather than pretending
// otherwise. It never sends the photo anywhere; only the extracted (and traveller-editable)
// text string is ever handed to translate(), the same live-translate function phrasebook.js's
// Talk screen already uses.
//
// Measured accuracy spike (2026-09-15, 9 real photographs of Thai and Lao signage, Tesseract.js
// v5's "fast" traineddata — see WORK_ORDER.md Slice G): only 2 of 9 produced a genuinely usable
// reading, and both were signs that filled the frame edge to edge with no surrounding scene; a
// bustling market or street view with the sign as one small element among many produced noise
// or nothing. The common factor was framing, not the language pair — so the capture step below
// asks for a tight crop of just the sign rather than a full scene, and the extracted text is
// always shown as editable, never sent onward without a chance to fix it.
import { getActiveCountry } from '../app-state.js';
import { getCountry } from '../data/regions.js';
import { translate } from '../translate.js';
import { LANGS, LANG_BY_CODE, uiLang } from '../i18n.js';
import { h } from '../util.js';
import { field, screenHint, selectEl } from '../ui-widgets.js';
import { mount, topbar } from '../main.js';

const TESS_LANG = { th: 'tha', vi: 'vie', km: 'khm', lo: 'lao' };

// Tesseract.js and each language's traineddata are fetched from a CDN on first use only. This
// screen is already online-required for the translation step, so that is not a new constraint,
// and nothing else in the app depends on this load succeeding — the site-wide rule against a
// CDN dependency (CLAUDE.md) names exactly this kind of exception: a feature whose own failure
// path is self-contained (an error message here, nothing else in the app affected).
const TESSERACT_CDN = 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js';
let _tesseractLoad = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (_tesseractLoad) return _tesseractLoad;
  _tesseractLoad = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TESSERACT_CDN;
    s.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error('Text recognition did not load — check your connection.')));
    s.onerror = () => reject(new Error('Could not load text recognition — check your connection.'));
    document.head.append(s);
  });
  return _tesseractLoad;
}

export function signTranslateScreen(lang) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Point & translate', '#phrasebook'));
  wrap.append(screenHint('Crop tightly to just the sign — a shot that also frames the street around it reads far worse. This needs the internet for both steps, and the extracted text is always yours to fix before translating; nothing here is a wall of small print, just a starting point.'));

  // The language to recognise: whatever the caller named (opened from a specific phrasebook
  // page, e.g. #signtranslate-lo) when it is one of the four this screen actually supports,
  // else the traveller's active country — never a silent fallback to whichever the phrasebook
  // page underneath happened to leave selected.
  const c = getCountry(getActiveCountry());
  const localCode = TESS_LANG[lang] ? lang : ((c && c.lang) || 'th');
  const tessLang = TESS_LANG[localCode] || 'tha';
  const localName = (LANG_BY_CODE[localCode] || {}).name || 'the local language';

  const video = h('video', { autoplay: '', playsinline: '', muted: '', style: 'width:100%;border-radius:var(--radius-2);background:#000;display:block' });
  const canvas = h('canvas', { style: 'display:none' });
  const shot = h('img', { alt: 'Captured sign', style: 'display:none;width:100%;border-radius:var(--radius-2)' });
  const status = h('p', { class: 'muted tiny' }, 'Starting camera…');
  const captureBtn = h('button', { class: 'btn block' }, '📸 Capture');
  const retakeBtn = h('button', { class: 'btn ghost block', style: 'display:none' }, '🔄 Retake');
  const textArea = h('textarea', { class: 'ta', rows: '4', placeholder: 'Extracted text appears here — check it against the sign and fix anything wrong before translating' });
  const targetSel = selectEl(LANGS.filter((l) => l.ui).map((l) => [l.code, `${l.flag} ${l.native}`]), uiLang(), () => {}, 'Translate into');
  const translateBtn = h('button', { class: 'btn block' }, '🌐 Translate');
  const out = h('div', {});

  let stream = null;
  function stopCamera() { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
  // A live camera stream must not outlive this screen. There is no unmount hook in this
  // router, so the same "clean up a global side effect on navigation" pattern the router
  // already uses for stopSpeak() is applied locally here instead of reaching into main.js for
  // one screen's camera — a single one-shot listener, disarmed the moment it fires.
  window.addEventListener('hashchange', stopCamera, { once: true });

  async function startCamera() {
    status.textContent = 'Starting camera…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      status.textContent = `Crop to just the sign — recognising ${localName}.`;
    } catch {
      status.textContent = 'Camera unavailable — allow camera access in your browser, or type the text in below yourself.';
      video.style.display = 'none';
      captureBtn.style.display = 'none';
    }
  }

  async function capture() {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    shot.src = canvas.toDataURL('image/jpeg', 0.9);
    shot.style.display = ''; video.style.display = 'none';
    captureBtn.style.display = 'none'; retakeBtn.style.display = '';
    stopCamera();
    status.textContent = 'Reading the text…';
    textArea.value = '';
    try {
      const Tesseract = await loadTesseract();
      const { data } = await Tesseract.recognize(canvas, tessLang);
      textArea.value = (data.text || '').trim();
      status.textContent = textArea.value
        ? 'Check the text below against the sign and fix anything wrong, then translate.'
        : 'Could not read any text — try again with just the sign filling the frame, or type it in yourself.';
    } catch (e) {
      status.textContent = e.message || 'Text recognition failed — type the text in yourself instead.';
    }
  }

  captureBtn.onclick = capture;
  retakeBtn.onclick = () => {
    shot.style.display = 'none'; video.style.display = 'block';
    captureBtn.style.display = ''; retakeBtn.style.display = 'none';
    out.innerHTML = '';
    startCamera();
  };
  translateBtn.onclick = async () => {
    const text = textArea.value.trim();
    if (!text) return;
    out.innerHTML = ''; out.append(h('p', { class: 'muted' }, 'Translating…'));
    try {
      const res = await translate(text, targetSel.value, localCode);
      out.innerHTML = '';
      out.append(h('div', { class: 'native', style: 'font-size:20px;line-height:1.35' }, res));
    } catch (e) {
      out.innerHTML = '';
      out.append(h('p', { class: 'warn-note' }, e.message || 'Could not translate that.'));
    }
  };

  wrap.append(
    h('div', { class: 'card' }, [video, shot, canvas, status, h('div', { class: 'stack-2' }, [captureBtn, retakeBtn])]),
    h('div', { class: 'card' }, [
      h('h2', {}, 'Extracted text'),
      textArea,
      field('Translate into', targetSel),
      translateBtn,
      out,
    ]),
    h('p', { class: 'disclaimer' }, 'Text recognition and translation both run through third-party services and need a connection. Only the text you see above is ever sent — the photo itself never leaves this device.'),
  );
  startCamera();
  mount(wrap, '#home');
  return wrap;
}
