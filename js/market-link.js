// The sign-in link from the Market's email (docs/EXCHANGE.md §5):
//   https://www.mekonging.com/?signin=<token_hash>
//
// main.js calls takeSigninLink() once, before the first render. It takes the token out of the
// address with history.replaceState and lands on #market-signin, which spends it with a POST.
// Nothing else spends it: a mail scanner that pre-fetches the link loads the page without
// running the app, so the token is still good when the traveller opens it.
//
// The token is held in memory only and given out once. It never reaches storage, the Back stack
// or a shared link. The query is not part of the route (the router reads the hash), and sw.js
// matches navigations with ignoreSearch, so the cached app still answers offline.

let pending = '';

export function takeSigninLink() {
  try {
    const search = location.search || '';
    const m = /(?:^\?|&)signin=([^&#]*)/.exec(search);
    if (!m) return false;
    const rest = search.replace(/(?:^\?|&)signin=[^&#]*/, '').replace(/^&/, '?');
    history.replaceState(null, '', location.pathname + rest + '#market-signin');
    const token = decodeURIComponent(m[1]);
    if (/^[A-Za-z0-9_-]{6,200}$/.test(token)) pending = token;
    return true;
  } catch {
    return false;
  }
}

// The token, once; '' when there is none or it was already taken.
export function spendSigninLink() {
  const token = pending;
  pending = '';
  return token;
}
