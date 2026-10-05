// First paint. A classic script (not a module), loaded from <head> before the stylesheet is used, so
// data-skin and data-theme are on <html> before the first frame and a dark-mode phone never flashes a
// cream page. It repeats js/theme.js's table and js/main.js classicMode() on purpose: a module cannot
// run this early. scripts/check-skins.py fails if an id named here is not in js/theme.js.
// 'classic' is DEFAULT_SKIN; a stored id it does not know renders as the default, like applyTheme().
(function () {
  var FIXED = { night: 'dark', psychnight: 'dark', expedition: 'dark', silk: 'light', tropical: 'light', psych: 'light' };
  var AUTO = { classic: 1, retro: 1, river: 1, flags: 1, temples: 1 };
  var root = document.documentElement;
  var skin = 'classic';
  var pref = 'auto';
  try {
    var p = (JSON.parse(localStorage.getItem('mk.store')) || {}).profile || {};
    if (typeof p.skin === 'string' && (AUTO[p.skin] || FIXED[p.skin])) skin = p.skin;
    if (p.theme === 'light' || p.theme === 'dark') pref = p.theme;
  } catch (e) { /* no store yet, or unreadable: the default skin and the device's setting */ }
  var mode = FIXED[skin];
  if (!mode) {
    if (pref !== 'auto') mode = pref;
    else {
      var dark = false;
      try { dark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) { /* ignore */ }
      var hr = new Date().getHours();
      mode = dark || !(hr >= 6 && hr < 18) ? 'dark' : 'light';
    }
  }
  root.setAttribute('data-skin', skin);
  root.setAttribute('data-theme', mode);
})();
