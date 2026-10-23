// Market accounts, closed beta: #market-signin and #market-me (docs/EXCHANGE.md §5 and §11,
// slice M3b), plus the one state line at the top of #market (marketStatusLine).
//
// Every state renders something, including each gate (check-net-gates):
//   * inside the iOS wrapper (mekong://) or on another host: where sign-in does work;
//   * data switched off, or no connection: one line, and the way back to the board on the phone;
//   * signed out: email, name, 18+ and terms, the robot check, "Email me a code";
//   * code sent: the code field, and a new code after 60 seconds;
//   * signed in without a profile (a link opened in another browser): "Finish joining";
//   * signed in: the account, its state while the market is closed, sign out, delete.
//
// Personal values (email, display name) are marked data-no-i18n and data-no-mt, so the
// interface translation never rewrites them and machine translation never sends them anywhere.

import { h } from '../util.js';
import { store } from '../state.js';
import { confirmAction, netMode, setNetMode, online } from '../ui-widgets.js';
import { go, mount, topbar, render } from '../main.js';
import { TURNSTILE_SITE_KEY, TURNSTILE_TEST_SITE_KEY, TERMS_VERSION, MARKET_HOST } from '../market-config.js';
import {
  marketSession, requestCode, verifyCode, verifyLink, marketMe, marketJoin, signOut, deleteAccount,
  marketErrorText, currentSignInPlace, fixtureMode,
} from '../market-api.js';
import { spendSigninLink } from '../market-link.js';

const RESEND_WAIT_MS = 60 * 1000;   // Supabase sends one code per address a minute (§5)

// What the sign-in form gathered, kept for the life of this page so the code step can join at
// once. Never stored.
let pendingJoin = null;   // { name, avatar }
let sentTo = '';
let sentAt = 0;
let linkFlight = null;    // the sign-in link's exchange while it runs (see paint)

// ---- small parts --------------------------------------------------------------------------------
const personal = (text) => h('span', { class: 'mka-personal', 'data-no-i18n': '', 'data-no-mt': '' }, text);
const errLine = (text) => h('p', { class: 'mka-err', role: 'alert' }, text || '');
const card = (kids) => h('div', { class: 'card mka-card', 'data-nofold': '' }, kids);
const busy = (text) => card([h('p', { class: 'mka-busy', 'aria-busy': 'true' }, text)]);
const backToBoard = () => h('button', { class: 'btn ghost block', type: 'button', onclick: () => go('#market') }, '‹ Back to the board on this phone');

function show(body, node) {
  body.replaceChildren(node);
  pruneWidgets();
}

// The traveller card's emoji, if it is one emoji the server will accept (no letters, digits or
// spaces, at most 16 bytes); otherwise none.
function cardAvatar() {
  const a = String((store.social && store.social.me && store.social.me.avatar) || '').trim();
  return a && new TextEncoder().encode(a).length <= 16 && !/[\p{L}\p{N}\s]/u.test(a) ? a : null;
}

function memberSince(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' });
}

function tickRow(text, onchange) {
  const box = h('input', { type: 'checkbox', onchange });
  return { box, row: h('label', { class: 'mka-tick' }, [box, h('span', {}, text)]) };
}

function termsNote() {
  return h('details', { class: 'mka-terms' }, [
    h('summary', {}, 'Closed-beta terms'),
    h('ul', {}, [
      h('li', {}, 'This is a test of the shared market for invited testers. It is not open to everyone yet.'),
      h('li', {}, 'Your email is used to sign you in and is never shown to other travellers.'),
      h('li', {}, 'Your account (your name, when you joined, your 18+ confirmation and these terms) is stored with Supabase in Singapore.'),
      h('li', {}, 'Delete your account at any time under Market, then Account. That removes it from the server.'),
      h('li', {}, 'Full terms and a privacy policy come before the market opens to everyone.'),
    ]),
    h('p', { class: 'tiny muted' }, `Version ${TERMS_VERSION}`),
  ]);
}

// ---- the robot check (Cloudflare Turnstile) ------------------------------------------------------
// Loaded on demand from challenges.cloudflare.com (allowed in the CSP's script-src and frame-src).
// The real site key works on www.mekonging.com only; local pages use Cloudflare's test key.
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let turnstileLoading = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileLoading) {
    turnstileLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TURNSTILE_SRC;
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
      s.onerror = () => { turnstileLoading = null; s.remove(); reject(new Error('turnstile')); };
      document.head.append(s);
    });
  }
  return turnstileLoading;
}

// Widgets rendered by this page. A form that leaves the page (the next step, a re-render, another
// screen) takes its widget's container with it, and Turnstile then warns about a widget it cannot
// find. So a widget is removed as soon as its container is detached: after every step change here,
// and after every navigation.
let widgets = [];
function pruneWidgets() {
  const ts = typeof window !== 'undefined' && window.turnstile;
  if (!ts) return;
  widgets = widgets.filter((w) => {
    if (w.box.isConnected) return true;
    try { ts.remove(w.id); } catch { /* already gone */ }
    return false;
  });
}
if (typeof window !== 'undefined') window.addEventListener('hashchange', pruneWidgets);

function captchaBox(onToken) {
  const box = h('div', { class: 'mka-captcha' });
  const key = currentSignInPlace() === 'web' ? TURNSTILE_SITE_KEY : TURNSTILE_TEST_SITE_KEY;
  const ctl = { reset() {} };
  loadTurnstile().then((ts) => {
    pruneWidgets();
    if (!box.isConnected) return;
    const id = ts.render(box, {
      sitekey: key, action: 'signin', size: 'flexible',
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(''),
      'error-callback': () => onToken(''),
    });
    widgets.push({ id, box });
    ctl.reset = () => { onToken(''); try { ts.reset(id); } catch { /* widget gone */ } };
  }).catch(() => {
    if (fixtureMode()) { onToken('fixture'); box.replaceChildren(h('p', { class: 'tiny muted' }, 'Robot check skipped (fixture mode).')); return; }
    box.replaceChildren(errLine('The robot check could not load. Check your connection, then reload.'));
  });
  return { box, ctl };
}

// ---- gates ---------------------------------------------------------------------------------------
function placeCard(place) {
  const kids = [h('h2', {}, 'Shared market')];
  if (place === 'wrapper') {
    kids.push(h('p', {}, `Market accounts work in the browser. Open ${MARKET_HOST} in Safari, or add it to your Home Screen, and sign in there.`));
  } else {
    kids.push(h('p', {}, `Sign-in works only at ${MARKET_HOST}.`));
    kids.push(h('a', { class: 'btn block', href: `https://${MARKET_HOST}/#market-signin`, rel: 'noopener' }, `Open ${MARKET_HOST}`));
  }
  kids.push(h('p', { class: 'muted' }, 'The board on this phone works here as before.'), backToBoard());
  return card(kids);
}

function dataOffCard() {
  return card([
    h('h2', {}, 'Shared market'),
    h('p', {}, 'You have data switched off, so the shared market cannot load. The board on this phone still works.'),
    h('button', { class: 'btn block', type: 'button', onclick: () => { setNetMode('online'); render(); } }, '📶 Turn data back on'),
    backToBoard(),
  ]);
}

function noConnectionCard() {
  return card([
    h('h2', {}, 'Shared market'),
    h('p', {}, 'The shared market needs internet. No connection right now.'),
    h('button', { class: 'btn block', type: 'button', onclick: () => render() }, 'Try again'),
    backToBoard(),
  ]);
}

function signedOutCard() {
  return card([
    h('h2', {}, 'Not signed in'),
    h('p', {}, 'Sign in to join the shared market (closed beta).'),
    h('button', { class: 'btn block', type: 'button', onclick: () => go('#market-signin') }, 'Sign in'),
    backToBoard(),
  ]);
}

function retryCard(err, retry) {
  return card([errLine(marketErrorText(err)), h('button', { class: 'btn block', type: 'button', onclick: retry }, 'Try again'), backToBoard()]);
}

// ---- signed out: email, name, consent, robot check ------------------------------------------------
function signInForm(body, message) {
  let token = '';
  const email = h('input', { type: 'email', name: 'email', autocomplete: 'email', inputmode: 'email', maxlength: '254', required: '', value: sentTo });
  const meName = (store.social && store.social.me && store.social.me.name) || '';
  const name = h('input', { type: 'text', name: 'nickname', autocomplete: 'nickname', maxlength: '40', required: '', value: (pendingJoin && pendingJoin.name) || meName });
  const err = errLine(message);
  const submit = h('button', { class: 'btn block', type: 'submit' }, 'Email me a code');
  const adult = tickRow('I am 18 or older');
  const terms = tickRow('I accept the closed-beta terms');
  const captcha = captchaBox((t) => { token = t; });

  const form = h('form', {
    class: 'mka-form', novalidate: '',
    onsubmit: (e) => {
      e.preventDefault();
      const addr = email.value.trim();
      const nm = name.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) { err.textContent = marketErrorText({ code: 'email_invalid' }); email.focus(); return; }
      if (nm.length < 1 || nm.length > 40) { err.textContent = marketErrorText({ code: 'name_length' }); name.focus(); return; }
      if (!adult.box.checked) { err.textContent = marketErrorText({ code: 'adult_required' }); return; }
      if (!terms.box.checked) { err.textContent = 'Accept the closed-beta terms to join.'; return; }
      if (!token) { err.textContent = marketErrorText({ code: 'captcha_missing' }); return; }
      err.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Sending…';
      requestCode(addr, token).then(() => {
        sentTo = addr;
        sentAt = Date.now();
        pendingJoin = { name: nm, avatar: cardAvatar() };
        show(body, codeForm(body));
      }, (e2) => {
        err.textContent = marketErrorText(e2);
        submit.disabled = false;
        submit.textContent = 'Email me a code';
        captcha.ctl.reset();   // a Turnstile token works once
      });
    },
  }, [
    h('h2', {}, 'Join the shared market'),
    h('p', { class: 'muted' }, 'Closed beta. We email you a code; there is no password.'),
    h('div', { class: 'field' }, [h('label', {}, ['Email', email])]),
    h('div', { class: 'field' }, [h('label', {}, ['Name other travellers see', name])]),
    adult.row, terms.row, termsNote(),
    captcha.box, err, submit,
  ]);
  return card([form]);
}

// ---- code sent ------------------------------------------------------------------------------------
function codeForm(body, message) {
  const code = h('input', {
    type: 'text', name: 'code', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: '[0-9]*',
    maxlength: '10', required: '', 'aria-label': 'Sign-in code',
  });
  const err = errLine(message);
  const submit = h('button', { class: 'btn block', type: 'submit' }, 'Sign in');
  const again = h('button', { class: 'btn ghost block', type: 'button', onclick: () => show(body, signInForm(body)) }, 'Send a new code');
  // Supabase refuses a second code within a minute, so the button waits and says how long.
  const tick = () => {
    const left = Math.ceil((sentAt + RESEND_WAIT_MS - Date.now()) / 1000);
    again.disabled = left > 0;
    again.textContent = left > 0 ? `Send a new code (${left} s)` : 'Send a new code';
    return left > 0;
  };
  if (tick()) {
    const timer = setInterval(() => { if (!again.isConnected || !tick()) clearInterval(timer); }, 1000);
  }
  const form = h('form', {
    class: 'mka-form', novalidate: '',
    onsubmit: (e) => {
      e.preventDefault();
      const digits = code.value.replace(/\D/g, '');
      // Supabase's code length is set per project (6 to 10 digits); the email shows it.
      if (digits.length < 6 || digits.length > 10) { err.textContent = marketErrorText({ code: 'code_wrong' }); code.focus(); return; }
      err.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      verifyCode(sentTo, digits).then(() => afterSignIn(body), (e2) => {
        err.textContent = marketErrorText(e2);
        submit.disabled = false;
        submit.textContent = 'Sign in';
      });
    },
  }, [
    h('h2', {}, 'Check your email'),
    h('p', {}, ['We sent a code to ', personal(sentTo), '.']),
    h('p', { class: 'muted' }, 'It can take a minute; check spam too. Or open the link in that email on this device.'),
    h('div', { class: 'field' }, [h('label', {}, ['Code', code])]),
    err, submit, again,
  ]);
  return card([form]);
}

// ---- signed in ------------------------------------------------------------------------------------
// Where a sign-in sheet on an action (js/screens/market-parts.js, setReturn) asked to come back to:
// a Market route, once. sessionStorage, so it dies with the tab; anything else is ignored.
function takeReturn() {
  try {
    const r = sessionStorage.getItem('mk-market-return') || '';
    sessionStorage.removeItem('mk-market-return');
    return /^#market(-[a-z0-9-]+)?$/.test(r) && !/^#market-(signin|me)$/.test(r) ? r : '';
  } catch { return ''; }
}

async function afterSignIn(body) {
  show(body, busy('Signing you in…'));
  let me;
  try {
    me = await marketMe();
    if (!me.profile && pendingJoin) {
      me = await marketJoin(pendingJoin.name, pendingJoin.avatar);
      pendingJoin = null;
    }
  } catch (e) {
    if (!body.isConnected) return;
    if (e.code === 'signed_out') { show(body, signInForm(body, marketErrorText(e))); return; }
    if (me && !me.profile) { show(body, joinForm(body, marketErrorText(e))); return; }
    show(body, retryCard(e, () => afterSignIn(body)));
    return;
  }
  if (!body.isConnected) return;   // a newer render owns the screen
  if (!me.profile) { show(body, joinForm(body)); return; }
  // Back to what the traveller was doing; replace() keeps the spent sign-in screen off the Back stack.
  const back = takeReturn();
  if (back) { location.replace(back); return; }
  showAccount(body, me);
}

// Signed in on #market-signin: the account takes the screen's place. The address becomes
// #market-me through replaceState, which fires no hashchange, so the spent sign-in screen never
// lands on the Back stack (a redirect would push it, and Back would bounce between the two).
function showAccount(body, me) {
  if (location.hash !== '#market-me') history.replaceState(null, '', '#market-me');
  const title = body.parentElement && body.parentElement.querySelector('.topbar h1');
  if (title) title.textContent = 'Account';
  show(body, accountCard(body, me));
}

// Signed in, but this account has no profile yet: the link was opened in a browser that never saw
// the form (Safari, after the form was filled in the Home Screen app), or the name was refused.
function joinForm(body, message) {
  const s = marketSession();
  const meName = (store.social && store.social.me && store.social.me.name) || '';
  const name = h('input', { type: 'text', name: 'nickname', autocomplete: 'nickname', maxlength: '40', required: '', value: (pendingJoin && pendingJoin.name) || meName });
  const adult = tickRow('I am 18 or older');
  const terms = tickRow('I accept the closed-beta terms');
  const err = errLine(message);
  const submit = h('button', { class: 'btn block', type: 'submit' }, 'Join');
  const form = h('form', {
    class: 'mka-form', novalidate: '',
    onsubmit: (e) => {
      e.preventDefault();
      const nm = name.value.trim();
      if (nm.length < 1 || nm.length > 40) { err.textContent = marketErrorText({ code: 'name_length' }); name.focus(); return; }
      if (!adult.box.checked) { err.textContent = marketErrorText({ code: 'adult_required' }); return; }
      if (!terms.box.checked) { err.textContent = 'Accept the closed-beta terms to join.'; return; }
      submit.disabled = true;
      pendingJoin = { name: nm, avatar: cardAvatar() };
      afterSignIn(body);
    },
  }, [
    h('h2', {}, 'Finish joining'),
    h('p', {}, ['Signed in as ', personal((s && s.email) || 'you'), '. Choose the name other travellers see.']),
    h('div', { class: 'field' }, [h('label', {}, ['Name other travellers see', name])]),
    adult.row, terms.row, termsNote(), err, submit,
    h('button', { class: 'btn ghost block', type: 'button', onclick: () => signOut().then(() => go('#market')) }, 'Sign out'),
  ]);
  return card([form]);
}

function stateLine(me) {
  const p = me.profile;
  const held = p.status === 'review' || (p.status === 'suspended' && !(p.suspended_until && new Date(p.suspended_until) <= new Date()));
  if (held) return 'Your account is under review.';
  if (me.member) return 'You are in the closed beta. Posting opens in a later update.';
  return 'The shared market opens soon. Your account is ready.';
}

function accountCard(body, me) {
  const s = marketSession();
  const p = me.profile;
  const err = errLine('');
  const del = h('button', {
    class: 'btn ghost block danger-outline', type: 'button',
    onclick: () => confirmAction({
      title: 'Delete your Market account?',
      body: 'This removes your name and account from the server for good. The board on this phone is not touched.',
      confirmLabel: 'Delete account', danger: true,
    }).then((ok) => {
      if (!ok) return;
      del.disabled = true;
      del.textContent = 'Deleting…';
      deleteAccount().then((r) => show(body, card([
        h('h2', {}, 'Account deleted'),
        h('p', {}, r.confirmed ? 'Your Market account is deleted, and the server confirms it is gone.'
          : 'Your Market account is deleted. The double-check could not reach the server.'),
        backToBoard(),
      ])), (e) => {
        err.textContent = marketErrorText(e);
        del.disabled = false;
        del.textContent = 'Delete my account';
      });
    }),
  }, 'Delete my account');
  return card([
    h('div', { class: 'mka-who' }, [
      h('span', { class: 'mka-avatar', 'aria-hidden': 'true' }, p.avatar || '🧭'),
      h('div', {}, [
        h('p', { class: 'mka-name' }, personal(p.display_name)),
        h('p', { class: 'tiny muted' }, `Member since ${memberSince(p.created_at)}`),
      ]),
    ]),
    h('p', { class: 'mka-state' }, stateLine(me)),
    h('p', { class: 'small muted' }, ['Signed in as ', personal((s && s.email) || '')]),
    h('p', { class: 'tiny muted' }, `Accepted the closed-beta terms (${p.terms_version}).`),
    err,
    h('button', { class: 'btn ghost block', type: 'button', onclick: () => signOut().then(() => go('#market')) }, 'Sign out'),
    del,
  ]);
}

// ---- the screen -----------------------------------------------------------------------------------
async function paint(body, arg) {
  const place = currentSignInPlace();
  if (place === 'wrapper' || place === 'other') { show(body, placeCard(place)); return; }
  if (netMode() === 'offline') { show(body, dataOffCard()); return; }
  if (!online()) { show(body, noConnectionCard()); return; }

  // The link's token is spent once, by whichever render sees it first. The app can render this
  // route twice while it starts, so a later render waits on the same exchange and finishes the
  // sign-in on the screen that is actually showing. Without this, the second render drew the
  // signed-out form while the first one signed in underneath it.
  const link = arg === 'signin' ? spendSigninLink() : '';
  if (link) linkFlight = verifyLink(link);
  if (linkFlight) {
    const flight = linkFlight;
    show(body, busy('Signing you in…'));
    try { await flight; } catch (e) {
      if (linkFlight === flight) linkFlight = null;
      if (body.isConnected) show(body, signInForm(body, marketErrorText(e)));
      return;
    }
    if (linkFlight === flight) linkFlight = null;
    if (body.isConnected) afterSignIn(body);
    return;
  }

  if (!marketSession()) { show(body, arg === 'me' ? signedOutCard() : signInForm(body)); return; }

  show(body, busy('Loading your account…'));
  let me;
  try { me = await marketMe(); } catch (e) {
    if (!body.isConnected) return;
    if (e.code === 'signed_out') { show(body, signedOutCard()); return; }
    show(body, retryCard(e, () => paint(body, arg)));
    return;
  }
  if (!body.isConnected) return;   // a newer render owns the screen
  if (me.profile) showAccount(body, me);
  else show(body, joinForm(body));
}

export function marketAccountScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(arg === 'me' ? 'Account' : 'Sign in', '#market'));
  const body = h('div', { class: 'mka-body', 'aria-live': 'polite' });
  wrap.append(body);
  mount(wrap, '#market');
  paint(body, arg === 'me' ? 'me' : 'signin');
}

// The state line at the top of #market (§11, item 2). It reads only this device's session, so it
// costs no request and renders the same offline.
export function marketStatusLine() {
  const signedIn = !!marketSession();
  return h('div', { class: 'mka-line' }, [
    h('p', {}, signedIn ? 'Shared market (closed beta): signed in.' : 'Shared market (closed beta).'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => go(signedIn ? '#market-me' : '#market-signin') }, signedIn ? 'Account' : 'Sign in'),
  ]);
}
