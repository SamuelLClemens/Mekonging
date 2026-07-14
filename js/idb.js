// Tiny IndexedDB blob store for on-device media (journal photos). Offline, private.
const DB = 'mk-media';
const STORE = 'blobs';

function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
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
