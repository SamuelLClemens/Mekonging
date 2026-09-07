// Measure a real launch. Paste into the browser console on a loaded Mekonging page, or run it
// through any automation that can evaluate script in the page.
//
//   COLD   (nothing on the device):  await mkColdStart({ cold: true })
//   WARM   (service worker serving):  await mkColdStart()
//
// WHY THIS EXISTS. Every performance number in this repo has been inferred: 1,293 KB of eager
// modules, 50 preloads, 178 precache entries. None of that is a measurement. The launch budget
// has been argued in kilobytes while the figure that decides whether any of it matters — what a
// launch costs on a mid-range Android on a hotel connection, which is this app's actual
// deployment — has never been taken. A desktop reload and a real phone launch can differ by an
// order of magnitude, and the ranking of the remaining performance work (splitting main.js,
// adding a webfont, finishing the spacing conversion) inverts depending on which one is true.
//
// So: measure, on the device in question. The app marks its own boot (js/main.js bootMark),
// this reads those marks plus the browser's own navigation and resource timings, and Settings
// shows an abbreviated version of the same figures for anyone holding a phone rather than a
// console.
//
// WHAT `cold: true` DOES. Unregisters the service worker and deletes every app-shell cache,
// then reloads — the state of a first-ever visit. It deliberately does NOT delete mk-media-v1,
// mk-tiles-v1 or mk-tts-v1: those are the traveller's downloaded photos, maps and audio, they
// are not part of the launch path, and wiping 95 MB to time a launch would be rude on a real
// phone. Pass `{ cold: true, wipeMedia: true }` if you really want the true first-run state.
//
// HOW TO READ IT. `firstScreen` is the number that matters — the point at which the traveller
// has something to look at. `codeReady` is how much of that was parsing and evaluating
// JavaScript, which is the part a module split can move; the gap between the two is the app's
// own first render. On a phone `codeReady` is usually the dominant term and on a desktop it
// usually is not, which is precisely why the desktop figure has been misleading.
(function () {
  const ms = (v) => (v == null ? null : Math.round(v));

  function reportNow() {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const mark = (n) => {
      const e = performance.getEntriesByName(n);
      return e.length ? e[e.length - 1].startTime : null;
    };
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    const res = performance.getEntriesByType('resource');

    // By kind, because "1,293 KB of modules" and "how long the modules took" are different
    // questions and only the second one is a launch cost. transferSize is 0 for anything the
    // service worker served from cache, which is exactly how a warm launch is identified.
    const kinds = { js: /\.js(\?|$)/, css: /\.css(\?|$)/, img: /\.(jpe?g|png|webp|svg|ico)(\?|$)/, font: /\.woff2?(\?|$)/, audio: /\.mp3(\?|$)/ };
    const by = {};
    res.forEach((r) => {
      const k = Object.keys(kinds).find((k2) => kinds[k2].test(r.name)) || 'other';
      const b = (by[k] = by[k] || { n: 0, transferred: 0, decoded: 0, slowest: 0, slowestUrl: '' });
      b.n++;
      b.transferred += r.transferSize || 0;
      b.decoded += r.decodedBodySize || 0;
      if (r.duration > b.slowest) { b.slowest = r.duration; b.slowestUrl = r.name.split('/').slice(-1)[0]; }
    });
    Object.keys(by).forEach((k) => {
      by[k].transferredKB = Math.round(by[k].transferred / 1024);
      by[k].decodedKB = Math.round(by[k].decoded / 1024);
      by[k].slowestMs = ms(by[k].slowest);
      delete by[k].transferred; delete by[k].decoded; delete by[k].slowest;
    });

    const fromNetwork = res.filter((r) => (r.transferSize || 0) > 0).length;
    const c = navigator.connection || {};
    return {
      launch: {
        codeReady: ms(mark('mk-eval-done')),        // all eager modules parsed and evaluated
        firstScreen: ms(mark('mk-first-render')),   // the screen handed to the DOM
        firstContentfulPaint: fcp ? ms(fcp.startTime) : null,
        domContentLoaded: ms(nav.domContentLoadedEventEnd),
        loadEvent: ms(nav.loadEventEnd) || null,
      },
      served: {
        resources: res.length,
        fromNetwork,
        fromCache: res.length - fromNetwork,
        verdict: fromNetwork <= 2 ? 'WARM — the worker served this launch'
          : (fromNetwork > 40 ? 'COLD — this launch came off the network' : 'MIXED'),
      },
      byKind: by,
      device: {
        cpuCores: navigator.hardwareConcurrency || null,
        deviceMemoryGB: navigator.deviceMemory || null,
        effectiveType: c.effectiveType || '(not reported — Safari/Firefox)',
        downlinkMbps: c.downlink != null ? c.downlink : null,
        rttMs: c.rtt != null ? c.rtt : null,
        saveData: !!c.saveData,
        ua: navigator.userAgent,
      },
    };
  }

  window.mkColdStart = async function mkColdStart(opts = {}) {
    if (opts.cold) {
      // Stash the request so the measurement runs after the reload rather than before it.
      sessionStorage.setItem('mk-cold-probe', '1');
      for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      const keep = opts.wipeMedia ? [] : ['mk-media-v1', 'mk-tiles-v1', 'mk-tts-v1'];
      for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
      console.log('[cold-start] worker unregistered, app caches cleared%s. Reloading…',
        opts.wipeMedia ? ' (media too)' : ' (downloaded photos/maps/audio kept)');
      location.reload();
      return null;                                  // the reload takes it from here
    }
    const r = reportNow();
    console.log('%c[cold-start] ' + r.served.verdict, 'font-weight:bold');
    console.table(r.launch);
    console.table(r.byKind);
    console.log(r.device);
    return r;
  };

  // After a `{ cold: true }` reload, report automatically once the app has settled. The load
  // event is not enough — the marks this reads are set during module evaluation, which on a
  // cold launch is still running when load fires.
  if (sessionStorage.getItem('mk-cold-probe')) {
    sessionStorage.removeItem('mk-cold-probe');
    const go = () => setTimeout(() => window.mkColdStart(), 1500);
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go);
  }
})();
