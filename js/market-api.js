// The shared Market's client: Supabase Auth and PostgREST over plain fetch, with no client
// library (docs/EXCHANGE.md §2 and §5). No DOM here; the screens live in
// js/screens/market-account.js.
//
// SESSION. { access_token, refresh_token, expires_at (epoch seconds), user_id, email }, under
// AUTH_KEY in localStorage and outside js/state.js. A backup, an export or a Travel circle share
// serialises the store, never this key. Sign-out revokes the session on the server and then
// forgets it; "Reset everything" in Settings does the same (forgetMarketSession).
//
// REFRESH. Before every signed-in call when under 60 seconds remain (which also covers a resume
// after hours in the background), and once more after a 401. One refresh runs at a time, because
// Supabase rotates refresh tokens and two racing refreshes would spend one token twice. A refresh
// the server refuses signs the device out; a refresh that cannot reach the server keeps the session.
//
// ERRORS. Every failure is a MarketError whose `code` is a key of ERROR_TEXT. Screens print
// marketErrorText(err), never a server message.
//
// FIXTURE MODE. On 127.0.0.1 and localhost only, `?market=fixture` answers every call from
// js/market-fixture.js, so the signed-in screens can be measured at 375 px without a real
// account (§5). fixtureAllowed() is the whole gate, and scripts/validate.mjs proves that every
// other host refuses it.

import { SUPABASE_URL, SUPABASE_KEY, AUTH_KEY, TERMS_VERSION, MARKET_HOST } from './market-config.js';

const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

// Pure, so the validator can run it without a browser.
export function fixtureAllowed(hostname, search) {
  return LOCAL_HOSTS.includes(String(hostname || '')) && /(?:^\?|&)market=fixture(?:&|$)/.test(String(search || ''));
}
export function fixtureMode() {
  return typeof location !== 'undefined' && fixtureAllowed(location.hostname, location.search);
}

// Where this page can sign in (pure, for the same reason):
//   'web'     www.mekonging.com, the only origin Supabase and Turnstile accept;
//   'local'   127.0.0.1 or localhost: fixture mode, or Turnstile's test key, which cannot sign in;
//   'wrapper' the iOS app's mekong:// scheme, which neither Turnstile nor the sign-in link can match;
//   'other'   any other web host.
export function signInPlace(protocol, hostname) {
  if (protocol !== 'https:' && protocol !== 'http:') return 'wrapper';
  if (hostname === MARKET_HOST) return 'web';
  if (LOCAL_HOSTS.includes(hostname)) return 'local';
  return 'other';
}
export function currentSignInPlace() {
  return typeof location === 'undefined' ? 'other' : signInPlace(location.protocol, location.hostname);
}

export class MarketError extends Error {
  constructor(code, status) {
    super(code);
    this.name = 'MarketError';
    this.code = code;
    this.status = status || 0;
  }
}

const ERROR_TEXT = {
  offline: 'No connection right now. Try again when you are back online.',
  network: 'Could not reach the market. Check your connection and try again.',
  too_soon: 'A code was sent less than a minute ago. Wait a minute, then ask again.',
  email_quota: 'Sign-in emails have run out for now. Try again in an hour.',
  email_failed: 'The sign-in email could not be sent. Sign-in emails may have run out for today: try again tomorrow.',
  busy: 'Too many tries from this connection. Wait a few minutes.',
  captcha_failed: 'The robot check did not pass. Try it again.',
  captcha_missing: 'Finish the robot check first.',
  email_invalid: 'Check the email address.',
  code_wrong: 'That code is wrong or has expired. Check it, or ask for a new one.',
  link_spent: 'That sign-in link has expired or was already used. Ask for a new code.',
  signed_out: 'You are signed out. Sign in again.',
  name_rejected: 'This breaks the market rules.',
  name_length: 'Use 1 to 40 characters for your name.',
  avatar_invalid: 'Pick one emoji.',
  adult_required: 'The shared market is for adults (18 or older).',
  terms_outdated: 'The terms have changed. Reload the app, then accept them again.',
  delete_unconfirmed: 'The account may not be deleted. Try again, or write to us through Feedback.',
  server: 'The market is having trouble. Try again in a few minutes.',
  failed: 'That did not work. Try again.',
};
export function marketErrorText(err) {
  const code = err && err.code;
  return ERROR_TEXT[code] || ERROR_TEXT.failed;
}

// Codes the database raises on purpose (supabase/migrations/001_accounts.sql).
const RAISED = ['adult_required', 'terms_outdated', 'name_length', 'name_rejected', 'avatar_invalid'];

function errorCode(status, data, path) {
  const ec = String((data && (data.error_code || data.error)) || '');
  const msg = String((data && (data.msg || data.message || data.error_description)) || '');
  if (RAISED.includes(msg)) return msg;
  if (msg === 'not_signed_in') return 'signed_out';
  if (ec === 'over_email_send_rate_limit') return /after \d+ seconds?/i.test(msg) ? 'too_soon' : 'email_quota';
  if (status === 429) return /after \d+ seconds?/i.test(msg) ? 'too_soon' : 'busy';
  if (ec === 'captcha_failed' || /captcha/i.test(msg)) return 'captcha_failed';
  if (path.startsWith('/auth/v1/verify') && (status === 403 || status === 400 || ec === 'otp_expired')) return 'code_wrong';
  if (path === '/auth/v1/otp' && (ec === 'email_address_invalid' || ec === 'validation_failed' || status === 400)) return 'email_invalid';
  if (path === '/auth/v1/otp' && status >= 500) return 'email_failed';
  if (path.startsWith('/auth/v1/token')) return status >= 500 ? 'server' : 'signed_out';
  if (path.startsWith('/rest/') && status === 401) return 'expired';
  if (status >= 500) return 'server';
  return 'failed';
}

// ---- the session ------------------------------------------------------------------------------
// `live` keeps a session usable for this page even where storage refuses writes (some private
// browsing modes); it is lost on reload there, which is the honest outcome.
let live = null;

function validSession(s) {
  return !!s && typeof s.access_token === 'string' && typeof s.refresh_token === 'string' && typeof s.user_id === 'string' && !!s.user_id;
}

export function marketSession() {
  if (validSession(live)) return live;
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    if (validSession(s)) { live = s; return s; }
  } catch { /* unreadable: treat as signed out */ }
  return null;
}

function keepSession(data) {
  const now = Math.floor(Date.now() / 1000);
  const user = (data && data.user) || {};
  const s = {
    access_token: String(data.access_token || ''),
    refresh_token: String(data.refresh_token || ''),
    expires_at: Number(data.expires_at) || now + (Number(data.expires_in) || 3600),
    user_id: String(user.id || (live && live.user_id) || ''),
    email: String(user.email || (live && live.email) || ''),
  };
  if (!validSession(s)) throw new MarketError('server');
  live = s;
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(s)); } catch { /* storage refused: `live` holds it */ }
  return s;
}

// Forget this device's session without asking the server. Used when the server already refused
// it, after an account is deleted, and by "Reset everything" in Settings.
export function forgetMarketSession() {
  live = null;
  try { localStorage.removeItem(AUTH_KEY); } catch { /* nothing to remove */ }
}

// ---- transport --------------------------------------------------------------------------------
async function call(path, { method = 'POST', body, token } = {}) {
  if (fixtureMode()) {
    const { fixtureCall } = await import('./market-fixture.js');
    try { return await fixtureCall(path, body, token); }
    catch (e) { throw e instanceof MarketError ? e : new MarketError((e && e.code) || 'failed', e && e.status); }
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new MarketError('offline');
  const headers = { apikey: SUPABASE_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), 20000) : 0;
  let res;
  try {
    res = await fetch(SUPABASE_URL + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl ? ctl.signal : undefined, credentials: 'omit', cache: 'no-store',
    });
  } catch {
    throw new MarketError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'network');
  } finally {
    if (timer) clearTimeout(timer);
  }
  let data = null;
  try { const text = await res.text(); data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) throw new MarketError(errorCode(res.status, data, path), res.status);
  return data;
}

let refreshing = null;
function refresh(s) {
  if (!refreshing) {
    refreshing = call('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: s.refresh_token } })
      .then((d) => keepSession(d))
      .catch((e) => {
        if (e.code === 'signed_out') forgetMarketSession();
        throw e;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

async function freshToken() {
  const s = marketSession();
  if (!s) throw new MarketError('signed_out');
  if (s.expires_at - Date.now() / 1000 > 60) return s.access_token;
  return (await refresh(s)).access_token;
}

// A signed-in call: a fresh token first, and one refresh and retry after a 401.
async function authed(path, opts = {}) {
  const token = await freshToken();
  try {
    return await call(path, { ...opts, token });
  } catch (e) {
    if (e.code !== 'expired') throw e;
    const s = marketSession();
    if (!s) throw new MarketError('signed_out');
    const again = await refresh(s);
    return call(path, { ...opts, token: again.access_token });
  }
}

// ---- sign-in (§5) -----------------------------------------------------------------------------
export function requestCode(email, captchaToken) {
  if (!captchaToken) return Promise.reject(new MarketError('captcha_missing'));
  return call('/auth/v1/otp', {
    body: { email, create_user: true, gotrue_meta_security: { captcha_token: captchaToken } },
  });
}

export async function verifyCode(email, code) {
  return keepSession(await call('/auth/v1/verify', { body: { type: 'email', email, token: code } }));
}

export async function verifyLink(tokenHash) {
  try {
    return keepSession(await call('/auth/v1/verify', { body: { type: 'email', token_hash: tokenHash } }));
  } catch (e) {
    throw e.code === 'code_wrong' ? new MarketError('link_spent', e.status) : e;
  }
}

// Revoke this device's session on the server (scope=local leaves the account's other devices
// signed in), then forget it. Offline, or with a session the server already dropped, it only forgets.
export async function signOut() {
  try {
    if (marketSession()) await authed('/auth/v1/logout?scope=local', {});
  } catch { /* forget it anyway */ }
  forgetMarketSession();
}

// ---- the account (RPCs in supabase/migrations/001_accounts.sql) --------------------------------
// { profile: {display_name, avatar, status, suspended_until, created_at, terms_version} | null,
//   member, open, terms_version }
export function marketMe() {
  return authed('/rest/v1/rpc/market_me', { body: {} });
}

export function marketJoin(name, avatar) {
  return authed('/rest/v1/rpc/market_join', {
    body: { display_name: name, avatar: avatar || null, terms_version: TERMS_VERSION, adult: true },
  });
}

// Deletes the account, then asks Auth for the user with the old token. Auth refuses a token whose
// user is gone (401, 403 or 404), which confirms the deletion; a 200 means it did not happen. A
// check that cannot reach the server leaves `confirmed` false, and the device forgets the session
// either way, because the delete itself succeeded.
export async function deleteAccount() {
  const token = await freshToken();
  await call('/rest/v1/rpc/market_delete_account', { body: {}, token });
  let status = 0;
  try { await call('/auth/v1/user', { method: 'GET', token }); status = 200; } catch (e) { status = e.status || 0; }
  if (status === 200) throw new MarketError('delete_unconfirmed');
  forgetMarketSession();
  return { confirmed: status === 401 || status === 403 || status === 404 };
}
