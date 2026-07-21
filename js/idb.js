// Tiny IndexedDB blob store for on-device media (journal photos). Offline, private.
const DB = 'mk-media';
const STORE = 'blobs';

// One cached connection shared by every operation — opening a fresh IndexedDB connection per
// call is wasteful and can serialise behind version transactions. The promise is cleared on
// error (so a later call can retry) and when the connection closes or is version-changed out.
let _dbPromise = null;
function open() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => {
      const db = r.result;
      db.onclose = () => { _dbPromise = null; };
      db.onversionchange = () => { try { db.close(); } catch { /* noop */ } _dbPromise = null; };
      res(db);
    };
    r.onerror = () => { _dbPromise = null; rej(r.error); };
  });
  return _dbPromise;
}

export async function putBlob(key, blob) {
  const db = await open();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => res(key);
    tx.onerror = () => rej(tx.error);
  });
}

// Small key/value slots in the same object store for non-blob metadata — used to keep a
// redundant mirror of the whole app store in IndexedDB, so a localStorage wipe (which loses
// both the primary and its .bak) can still be recovered from a separate storage bucket.
// Reserved keys are prefixed and excluded from the photo backup enumeration below.
const META_PREFIX = '__mk_meta__';
export async function putMeta(name, value) { return putBlob(META_PREFIX + name, value); }
export async function getMeta(name) { try { return await getBlob(META_PREFIX + name); } catch { return null; } }

export async function getBlob(key) {
  const db = await open();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const rq = tx.objectStore(STORE).get(key);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => rej(rq.error);
  });
}

export async function delBlob(key) {
  const db = await open();
  return new Promise((res) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}

// Every stored blob with its key — used to bundle photos into a full on-device backup.
// Returns [{ key, blob }]; resolves to [] on any error so a backup never fails on media.
export async function getAllBlobs() {
  try {
    const db = await open();
    return await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const os = tx.objectStore(STORE);
      const keysReq = os.getAllKeys();
      const valsReq = os.getAll();
      tx.oncomplete = () => {
        const keys = keysReq.result || [];
        const vals = valsReq.result || [];
        res(keys.map((k, i) => ({ key: k, blob: vals[i] }))
          .filter((x) => !(typeof x.key === 'string' && x.key.startsWith(META_PREFIX))));
      };
      tx.onerror = () => rej(tx.error);
    });
  } catch { return []; }
}
