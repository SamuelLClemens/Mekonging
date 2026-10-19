// Fixture mode for the shared Market (docs/EXCHANGE.md §5): canned answers for every call
// js/market-api.js makes, so the sign-in and account screens can be driven and measured at
// 375 px without a real account or a real email.
//
// It is loaded only by market-api.js, and only when fixtureAllowed() is true: on 127.0.0.1 or
// localhost with `?market=fixture` in the address. A production host never loads this file.
//
// Behaviour worth knowing when driving it:
//   * the code 000000 is "wrong"; any other six digits sign in;
//   * the email bounce@example.com fails to send (the "emails have run out" path);
//   * the name "admin" is rejected, as the server's display-name check would;
//   * `&tester=1` in the address makes the account a closed-beta tester (a member while the
//     market is closed); without it the account is signed in but waits for the market to open.
// State lives in sessionStorage under FIX_KEY, so it survives a reload and dies with the tab.

const FIX_KEY = 'mk-market-fixture';
const USER_ID = '00000000-0000-4000-8000-000000000001';

function state() {
  try { return JSON.parse(sessionStorage.getItem(FIX_KEY) || 'null') || {}; } catch { return {}; }
}
function setState(s) {
  try { sessionStorage.setItem(FIX_KEY, JSON.stringify(s)); } catch { /* fixture only */ }
}
const fail = (code, status) => Promise.reject({ code, status });
const tester = () => /(?:^\?|&)tester=1(?:&|$)/.test(location.search || '');

function session(email) {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'fixture-access-' + now, refresh_token: 'fixture-refresh-' + now,
    expires_in: 3600, expires_at: now + 3600, token_type: 'bearer',
    user: { id: USER_ID, email: email || state().email || 'traveller@example.com' },
  };
}

function me() {
  const s = state();
  return {
    profile: s.profile || null,
    member: !!s.profile && tester(),
    open: false,
    terms_version: 'beta-2026-10',
  };
}

export function fixtureCall(path, body, token) {
  const s = state();
  return new Promise((r) => setTimeout(r, 250)).then(() => {
    if (path === '/auth/v1/otp') {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((body && body.email) || '')) return fail('email_invalid', 400);
      if (body.email === 'bounce@example.com') return fail('email_failed', 500);
      setState({ ...s, email: body.email });
      return {};
    }
    if (path === '/auth/v1/verify') {
      if (body && body.token === '000000') return fail('code_wrong', 403);
      // Signing in again after a delete makes a new, empty account, as Supabase would.
      if (s.deleted) setState({ email: (body && body.email) || s.email });
      return session(body && body.email);
    }
    if (path.startsWith('/auth/v1/token')) return s.deleted ? fail('signed_out', 400) : session();
    if (path.startsWith('/auth/v1/logout')) return null;
    if (path === '/auth/v1/user') return s.deleted ? fail('failed', 403) : { id: USER_ID, email: s.email };
    if (!token) return fail('signed_out', 401);
    if (path === '/rest/v1/rpc/market_me') return me();
    if (path === '/rest/v1/rpc/market_join') {
      const name = String((body && body.display_name) || '').trim();
      if (!body || body.adult !== true) return fail('adult_required', 400);
      if (name.length < 1 || name.length > 40) return fail('name_length', 400);
      if (/^admin$/i.test(name)) return fail('name_rejected', 400);
      if (!s.profile) {
        setState({ ...s, deleted: false, profile: {
          display_name: name, avatar: body.avatar || null, status: 'active', suspended_until: null,
          created_at: new Date().toISOString(), terms_version: body.terms_version,
        } });
      }
      return me();
    }
    if (path === '/rest/v1/rpc/market_delete_account') {
      setState({ deleted: true });
      return null;
    }
    return fail('failed', 404);
  });
}
