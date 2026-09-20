// The place/species photo registry (js/data/photos.js, 69 KB), loaded off the launch path.
//
// It lives in its own module rather than in main.js because three separate files read it —
// main.js (rnThumb), render-utils.js (photoBlock) and offline-pack.js (the media manifest) —
// and render-utils cannot import from main.js without a cycle. Any one of those three keeping
// a static `import { PHOTOS }` puts the whole registry back on the critical path, which is
// exactly how it stayed eager after main.js's own copy was made lazy.
//
// Callers read photoEntry(id), which returns null until the module lands. Every existing call
// site already treats a missing entry as "no photo" and falls back to the item's own `photo`
// field or a placeholder, so the pre-load state is a shape they already handle.

let _photos = null;
let _load = null;

export function isPhotosLoaded() { return !!_photos; }

export function loadPhotos() {
  if (_photos) return Promise.resolve(_photos);
  if (_load) return _load;
  _load = import('./data/photos.js')
    .then((mod) => { _photos = mod.PHOTOS; return _photos; })
    .catch((err) => { _load = null; throw err; });
  return _load;
}

export function photoEntry(id) {
  return (id && _photos && _photos[id]) || null;
}
