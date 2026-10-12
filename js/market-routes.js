// Legacy routes of the Traveller board and its Money-hub shortcuts, and where each one lives now
// (docs/EXCHANGE.md §11). Pure data and one pure function, so main.js can read it without a cycle
// and a link that was shared before the Market tab existed still opens the right screen.
//
// Before the Market tab the board answered to three route heads: #exchange (with a board
// category), #swap (cash swap) and #market (gear). All of them now live under the head `market`,
// with the kind in the route (#market-rides). render() calls marketRedirect() first and swaps
// the hash in place, so the address bar, the Back stack and the active tab all see the new route.
//
// A shared board link (#in-...) is a different head and is untouched: it keeps importing into the
// on-phone board.

// The board's old category → the Market kind that now holds it.
const KIND_FOR_CATEGORY = {
  swap: 'cash',
  ride: 'rides',
  house: 'rooms',
  kids: 'items',
  gear: 'items',
  other: 'items',
};

// The new route for a legacy hash, or null when the hash is not a legacy route.
export function marketRedirect(hash) {
  const [head, ...rest] = String(hash || '').replace(/^#/, '').split('-');
  const arg = rest.join('-');
  if (head === 'swap') return '#market-cash';
  if (head === 'exchange') {
    const kind = KIND_FOR_CATEGORY[arg];
    return kind ? `#market-${kind}` : '#market';
  }
  // #market-gear was the old gear market; every other #market-<arg> is already a Market route.
  if (head === 'market' && arg === 'gear') return '#market-items';
  return null;
}
