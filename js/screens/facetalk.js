// Face to face (#facetalk, slice L1): two people who share no language talk on one phone.
//
// The screen is split in two. The far half is turned 180 degrees for the person opposite; each
// half has its own language, a microphone and a text box. A turn is translated into the other
// half's language and shown there, and read aloud when the traveller has chosen that. The
// transcript stays on this phone (store.profile.prefs.faceTalk) and can be cleared.
//
// It needs a connection: translate() answers only from its cache when offline. Where the phone
// has no speech recognition for a language, that half is typing only and says so.
import { store, save } from '../state.js';
import { h } from '../util.js';
import { confirmAction, online, screenHint } from '../ui-widgets.js';
import { translate, TranslateAborted } from '../translate.js';
import { startTask, stopTask, stopPlayback } from '../audio-control.js';
import { say, canSay } from '../tts.js';
import { LANGS, LANG_BY_CODE, uiLang, transCode } from '../i18n.js';
import { createDictation, speechCtor, MIC_ERRORS } from '../speech-input.js';
import { go, mount, topbar } from '../main.js';

const LOG_MAX = 100;   // turns kept on the phone; the oldest go first

function prefs() {
  const p = store.profile.prefs;
  return p.faceTalk || (p.faceTalk = { a: '', b: '', speak: false, log: [] });
}

// The two languages, never equal and always known. `far` is the language of the person opposite:
// the one passed in the route (the phrasebook the traveller came from), else the last used.
function pickLanguages(far) {
  const ft = prefs();
  const known = (c) => !!(c && LANG_BY_CODE[c]);
  let a = known(ft.a) ? ft.a : uiLang();
  let b = known(far) ? far : (known(ft.b) ? ft.b : 'th');
  if (a === b) a = (b === 'en') ? 'th' : 'en';
  ft.a = a; ft.b = b;
  return { a, b };
}

export function faceTalkScreen(arg) {
  const wrap = h('div', { class: 'screen ft-screen' });
  wrap.append(topbar('Face to face', '#phrasebook'));
  wrap.append(screenHint('Each person types or speaks in their own half. The other half shows the translation. Needs a connection. Nothing leaves this phone except the text being translated.', 'Face to face'));

  if (!online()) {
    // A gated feature still renders something when the gate is shut.
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'Face to face needs a connection'),
      h('p', { class: 'muted' }, 'There is no connection right now. The phrasebook works without one.'),
      h('button', { class: 'btn block', onclick: () => go(`#phrasebook-${arg || ''}`.replace(/-$/, '')) }, 'Open the phrasebook'),
    ]));
    mount(wrap, '#phrasebook');
    return;
  }

  const ft = prefs();
  const lang = pickLanguages(arg);
  const noVoice = new Set();                 // language codes this phone cannot listen to
  const halves = {};
  const other = (s) => (s === 'a' ? 'b' : 'a');
  const locale = (code) => (LANG_BY_CODE[code] || {}).speech || '';
  let busy = false;
  let micSide = '';

  const paintLog = (s) => {
    const el = halves[s].log;
    el.replaceChildren();
    const mine = ft.log.slice(-LOG_MAX);
    if (!mine.length) el.append(h('p', { class: 'muted ft-empty' }, 'Nothing said yet.'));
    for (const t of mine) {
      const own = t.side === s;
      const text = own ? t.src : t.out;
      const code = own ? t.from : t.to;
      const row = h('div', { class: 'ft-turn ' + (own ? 'ft-own' : 'ft-in') }, [
        h('div', { class: 'ft-text', lang: code, dir: (LANG_BY_CODE[code] || {}).dir || 'ltr', 'data-no-i18n': '' }, text),
      ]);
      const loc = locale(code);
      if (!own && loc && canSay(loc)) {
        row.append(h('button', { class: 'ft-replay', type: 'button', 'aria-label': 'Read aloud', onclick: () => { stopPlayback(); say(text, loc); } }, '🔊'));
      }
      el.append(row);
    }
    el.scrollTop = el.scrollHeight;
  };

  // Voice is offered only where the phone can listen in the half's language.
  const voiceOk = (s) => !!speechCtor() && !!locale(lang[s]) && !noVoice.has(lang[s]);
  const paintHalf = (s) => {
    const hf = halves[s];
    hf.mic.hidden = !voiceOk(s);
    hf.note.hidden = voiceOk(s);
    if (!voiceOk(s)) {
      hf.note.textContent = 'Typing only: this phone has no voice input for this language.';
    }
    hf.input.setAttribute('lang', lang[s]);
    hf.input.setAttribute('dir', (LANG_BY_CODE[lang[s]] || {}).dir || 'ltr');
    hf.input.setAttribute('aria-label', 'Type or speak here');
    hf.sel.replaceChildren(...LANGS.filter((l) => l.code !== lang[other(s)]).map((l) =>
      h('option', { value: l.code, selected: l.code === lang[s] ? '' : null }, `${l.flag} ${l.native}${l.native === l.name ? '' : ` · ${l.name}`}`)));
  };

  const stopMic = () => { for (const k of ['a', 'b']) if (halves[k] && halves[k].dict) halves[k].dict.abort(); };

  const sendTurn = async (s) => {
    const hf = halves[s];
    await hf.dict.finish();
    const text = hf.input.value.trim();
    if (!text || busy) return;
    busy = true;
    hf.send.disabled = true;
    hf.status.textContent = '';
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const finish = startTask(() => { if (ctrl) ctrl.abort(); });
    hf.status.replaceChildren('Translating… ', h('button', { class: 'linklike', type: 'button', onclick: () => stopTask() }, '⏹ Stop'));
    try {
      const from = lang[s]; const to = lang[other(s)];
      const out = await translate(text, transCode(to), transCode(from), ctrl ? ctrl.signal : null);
      ft.log.push({ side: s, from, to, src: text, out, t: Date.now() });
      if (ft.log.length > LOG_MAX) ft.log.splice(0, ft.log.length - LOG_MAX);
      save();
      hf.input.value = '';
      hf.status.textContent = '';
      paintLog('a'); paintLog('b');
      const loc = locale(to);
      // Best effort: iOS can refuse speech started after an await. The 🔊 on the turn still works.
      if (ft.speak && loc && canSay(loc)) { stopPlayback(); say(out, loc); }
    } catch (err) {
      hf.status.textContent = '';
      if (!(err instanceof TranslateAborted) && err.name !== 'TranslateAborted') hf.status.textContent = err.message;
    } finally {
      finish();
      busy = false;
      hf.send.disabled = false;
    }
  };

  const buildHalf = (s) => {
    const hf = { side: s };
    hf.sel = h('select', { class: 'ft-lang', 'data-no-i18n': '', 'aria-label': 'Language', onchange: (e) => {
      stopMic();
      lang[s] = e.target.value;
      ft[s] = e.target.value;
      save();
      paintHalf('a'); paintHalf('b');
    } });
    hf.input = h('textarea', { class: 'ta ft-input', rows: '2' });
    hf.note = h('p', { class: 'tiny muted ft-note', role: 'status' });
    hf.status = h('p', { class: 'tiny muted ft-status', role: 'status' });
    hf.log = h('div', { class: 'ft-log', 'aria-live': 'polite' });
    hf.mic = h('button', { class: 'btn ft-mic', type: 'button', 'aria-pressed': 'false' }, '🎤 Speak');
    hf.send = h('button', { class: 'btn', type: 'button', onclick: () => sendTurn(s) }, 'Send');
    hf.dict = createDictation({
      locale: () => locale(lang[s]),
      onText: (text) => { hf.input.value = text; },
      onState: (on) => {
        hf.mic.textContent = on ? '✓ Done' : '🎤 Speak';
        hf.mic.classList.toggle('is-listening', on);
        hf.mic.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (!on && micSide === s) micSide = '';
      },
      onError: (code) => {
        if (code === 'language-not-supported') { noVoice.add(lang[s]); paintHalf(s); return; }
        hf.status.textContent = MIC_ERRORS[code] || '';
      },
    });
    hf.mic.addEventListener('click', () => {
      if (hf.dict.listening) { hf.dict.finish(); return; }
      stopMic();
      stopPlayback();   // a phrase still playing would be transcribed as if it were said
      hf.status.textContent = '';
      micSide = s;
      hf.dict.start();
    });
    halves[s] = hf;
    const el = h('section', { class: 'ft-half ' + (s === 'b' ? 'ft-far' : 'ft-near'), 'aria-label': s === 'b' ? 'Far side' : 'Your side' }, [
      hf.sel, hf.log,
      h('div', { class: 'ft-compose' }, [hf.input, h('div', { class: 'ft-actions' }, [hf.mic, hf.send])]),
      hf.note, hf.status,
    ]);
    return el;
  };

  const speakBtn = h('button', { class: 'btn ghost ft-toggle', type: 'button', 'aria-pressed': ft.speak ? 'true' : 'false', onclick: (e) => {
    ft.speak = !ft.speak; save();
    e.currentTarget.setAttribute('aria-pressed', ft.speak ? 'true' : 'false');
    e.currentTarget.textContent = ft.speak ? '🔊 Voice on' : '🔇 Voice off';
    if (!ft.speak) stopPlayback();
  } }, ft.speak ? '🔊 Voice on' : '🔇 Voice off');
  const clearBtn = h('button', { class: 'btn ghost ft-toggle', type: 'button', onclick: async () => {
    if (!ft.log.length) return;
    const ok = await confirmAction({ title: 'Clear the conversation?', body: 'This removes the transcript from this phone.', confirmLabel: 'Clear', danger: true });
    if (!ok) return;
    ft.log = []; save(); paintLog('a'); paintLog('b');
  } }, 'Clear');

  const far = buildHalf('b');
  const near = buildHalf('a');
  wrap.append(h('div', { class: 'ft-stage' }, [
    far,
    h('div', { class: 'ft-mid' }, [speakBtn, clearBtn]),
    near,
  ]));
  paintHalf('a'); paintHalf('b'); paintLog('a'); paintLog('b');
  // Leaving the screen switches the microphone and any sound off.
  window.addEventListener('hashchange', () => { stopMic(); stopPlayback(); }, { once: true });
  mount(wrap, '#phrasebook');
}
