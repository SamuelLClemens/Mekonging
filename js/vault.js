// Secure, on-device document vault for passports, visas, insurance and tickets.
//
// Security model (the whole point of this module):
//   - Every document is encrypted with AES-GCM (256-bit) before it touches disk.
//   - The key is derived from the user's passcode with PBKDF2-SHA-256 (250k iters)
//     and a per-vault random salt. The key is held in memory only while unlocked
//     and is NEVER written to storage. Locking simply discards it.
//   - Ciphertext lives in this browser's IndexedDB ('mk-vault'). Nothing is ever
//     transmitted off the device, and nothing here is ever committed to source.
//   - There is no recovery path: if the passcode is forgotten the data is gone.
//     That is by design — there is no backdoor key escrow anywhere.
//
// Web Crypto requires a secure context (HTTPS or localhost). available() reports
// whether the environment can support the vault so the UI can degrade gracefully.

const DB_NAME = 'mk-vault';
const STORE = 'vault';
const CONFIG_ID = '__config__';
const PBKDF2_ITERS = 250000;
const VERIFIER_TEXT = 'mekonging-vault-v1';

const enc = new TextEncoder();
const dec = new TextDecoder();
let cryptoKey = null; // in-memory AES-GCM key; null when locked. Never persisted.

function subtle() {
  const c = (typeof crypto !== 'undefined') ? crypto : null;
  if (!c || !c.subtle) throw new Error('Secure storage is unavailable in this browser context. Open the app over HTTPS or localhost.');
  return c.subtle;
}
function randBytes(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
function randHex(n) { return [...randBytes(n)].map((b) => b.toString(16).padStart(2, '0')).join(''); }

// ---- IndexedDB helpers (one object store, keyed by id) ----------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}
async function idbPut(rec) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDel(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

// ---- crypto primitives ------------------------------------------------------
async function deriveKey(passcode, salt) {
  const material = await subtle().importKey('raw', enc.encode(passcode), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERS, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function aesEncrypt(key, bytes) {
  const iv = randBytes(12);
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { iv, ct };
}
function aesDecrypt(key, iv, ct) { return subtle().decrypt({ name: 'AES-GCM', iv }, key, ct); }

// ---- public API -------------------------------------------------------------
export function available() {
  return !!(typeof crypto !== 'undefined' && crypto.subtle && typeof indexedDB !== 'undefined');
}
export async function isInitialised() { try { return !!(await idbGet(CONFIG_ID)); } catch { return false; } }
export function isUnlocked() { return !!cryptoKey; }
export function lock() { cryptoKey = null; }

export async function setup(passcode, hint) {
  if (!passcode || passcode.length < 4) throw new Error('Choose a passcode of at least 4 characters.');
  if (await isInitialised()) throw new Error('The vault is already set up. Unlock it instead.');
  const salt = randBytes(16);
  const key = await deriveKey(passcode, salt);
  const verifier = await aesEncrypt(key, enc.encode(VERIFIER_TEXT));
  await idbPut({ id: CONFIG_ID, salt, iters: PBKDF2_ITERS, verifierIv: verifier.iv, verifierCt: verifier.ct, hint: String(hint || '').slice(0, 120) });
  cryptoKey = key;
}

// Optional passcode HINT — a reminder the user writes (never the passcode). Stored on the
// config record on this device and shown on the unlock screen. getHint needs no key.
export async function getHint() { try { const c = await idbGet(CONFIG_ID); return (c && c.hint) || ''; } catch { return ''; } }
export async function setHint(text) {
  const c = await idbGet(CONFIG_ID);
  if (!c) throw new Error('Set up the vault first.');
  c.hint = String(text || '').slice(0, 120);
  await idbPut(c);
}

// Change the passcode without a server: unlock re-derives, then EVERY doc/note is decrypted
// with the old key and re-encrypted under a fresh key + salt. Zero-knowledge preserved.
export async function changePasscode(newPasscode) {
  if (!cryptoKey) throw new Error('Unlock the vault first.');
  if (!newPasscode || newPasscode.length < 4) throw new Error('Choose a new passcode of at least 4 characters.');
  const cfg = await idbGet(CONFIG_ID);
  const newSalt = randBytes(16);
  const newKey = await deriveKey(newPasscode, newSalt);
  const items = (await idbAll()).filter((r) => r.id !== CONFIG_ID);
  for (const r of items) {
    const metaPlain = await aesDecrypt(cryptoKey, r.metaIv, r.metaCt);
    const blobPlain = await aesDecrypt(cryptoKey, r.blobIv, r.blobCt);
    const m = await aesEncrypt(newKey, metaPlain);
    const b = await aesEncrypt(newKey, blobPlain);
    await idbPut({ ...r, metaIv: m.iv, metaCt: m.ct, blobIv: b.iv, blobCt: b.ct });
  }
  const verifier = await aesEncrypt(newKey, enc.encode(VERIFIER_TEXT));
  await idbPut({ id: CONFIG_ID, salt: newSalt, iters: PBKDF2_ITERS, verifierIv: verifier.iv, verifierCt: verifier.ct, hint: (cfg && cfg.hint) || '' });
  cryptoKey = newKey;
}

export async function unlock(passcode) {
  const cfg = await idbGet(CONFIG_ID);
  if (!cfg) throw new Error('The vault has not been set up yet.');
  const key = await deriveKey(passcode, cfg.salt);
  try {
    const plain = await aesDecrypt(key, cfg.verifierIv, cfg.verifierCt);
    if (dec.decode(plain) !== VERIFIER_TEXT) throw new Error('bad');
  } catch { throw new Error('Incorrect passcode.'); }
  cryptoKey = key;
}

export async function addDocument(file) {
  if (!cryptoKey) throw new Error('Unlock the vault first.');
  if (!file) throw new Error('Choose a file to add.');
  const bytes = await file.arrayBuffer();
  // Filename + type are sensitive too, so they are encrypted in a small metadata blob.
  const meta = await aesEncrypt(cryptoKey, enc.encode(JSON.stringify({
    name: file.name || 'Document', type: file.type || 'application/octet-stream', size: file.size || bytes.byteLength,
  })));
  const blob = await aesEncrypt(cryptoKey, bytes);
  const id = 'doc-' + randHex(8);
  await idbPut({ id, createdAt: new Date().toISOString().slice(0, 10), metaIv: meta.iv, metaCt: meta.ct, blobIv: blob.iv, blobCt: blob.ct });
  return id;
}

export async function listDocuments() {
  if (!cryptoKey) throw new Error('Unlock the vault first.');
  const all = (await idbAll()).filter((r) => r.id !== CONFIG_ID);
  const out = [];
  for (const r of all) {
    let meta = { name: 'Document', type: '' };
    try { meta = JSON.parse(dec.decode(await aesDecrypt(cryptoKey, r.metaIv, r.metaCt))); } catch { /* skip undecryptable */ }
    out.push({ id: r.id, createdAt: r.createdAt, name: meta.name, type: meta.type, size: meta.size });
  }
  out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return out;
}

export async function getDocument(id) {
  if (!cryptoKey) throw new Error('Unlock the vault first.');
  const r = await idbGet(id);
  if (!r) throw new Error('Document not found.');
  const meta = JSON.parse(dec.decode(await aesDecrypt(cryptoKey, r.metaIv, r.metaCt)));
  const bytes = await aesDecrypt(cryptoKey, r.blobIv, r.blobCt);
  return { id, name: meta.name, type: meta.type, blob: new Blob([bytes], { type: meta.type || 'application/octet-stream' }) };
}

export async function deleteDocument(id) { await idbDel(id); }

// ---- secure typed notes (card numbers, PINs, booking refs, anything text) ---
// Stored exactly like a document (AES-GCM), but the payload is text and the metadata
// marks it type 'note' so the UI can reveal + copy it instead of opening a file.
export async function addSecureNote(title, text) {
  if (!cryptoKey) throw new Error('Unlock the vault first.');
  const body = enc.encode(String(text || ''));
  const meta = await aesEncrypt(cryptoKey, enc.encode(JSON.stringify({ name: title || 'Secure note', type: 'note', size: body.byteLength })));
  const blob = await aesEncrypt(cryptoKey, body);
  const id = 'note-' + randHex(8);
  await idbPut({ id, createdAt: new Date().toISOString().slice(0, 10), metaIv: meta.iv, metaCt: meta.ct, blobIv: blob.iv, blobCt: blob.ct });
  return id;
}
export async function getNoteText(id) {
  const doc = await getDocument(id);   // requires unlock; decrypts in memory
  return await doc.blob.text();
}

// ---- encrypted backup file (private by construction) ------------------------
// Exports the RAW encrypted records (salt + ciphertext only — never the key or any
// plaintext), so the backup file is useless without the passcode. Restoring replaces the
// whole vault with the snapshot and re-locks it, so a new device unlocks with the same code.
function b64(buf) {
  const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function unb64(str) {
  const s = atob(str); const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
}
const BIN_FIELDS = ['salt', 'verifierIv', 'verifierCt', 'metaIv', 'metaCt', 'blobIv', 'blobCt'];

export async function exportVault() {
  const all = await idbAll();
  if (!all.length) throw new Error('The vault is empty — nothing to back up yet.');
  const records = all.map((r) => {
    const o = { id: r.id, createdAt: r.createdAt || null };
    if (r.iters != null) o.iters = r.iters;
    if (r.hint) o.hint = r.hint;   // plain reminder text (never the passcode)
    BIN_FIELDS.forEach((k) => { if (r[k] != null) o[k] = b64(r[k]); });
    return o;
  });
  return JSON.stringify({ format: 'mekonging-vault-backup', v: 1, exportedAt: new Date().toISOString().slice(0, 10), records });
}

export async function importVault(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('That file is not a valid vault backup.'); }
  if (!parsed || parsed.format !== 'mekonging-vault-backup' || !Array.isArray(parsed.records)) throw new Error('That file is not a Mekonging vault backup.');
  if (!parsed.records.some((r) => r.id === CONFIG_ID)) throw new Error('This backup is missing its passcode configuration and cannot be restored.');
  // Replace the whole vault with this complete snapshot, then lock (unlock with its passcode).
  const existing = await idbAll();
  for (const r of existing) await idbDel(r.id);
  for (const rec of parsed.records) {
    const out = { id: rec.id, createdAt: rec.createdAt || new Date().toISOString().slice(0, 10) };
    if (rec.iters != null) out.iters = rec.iters;
    if (rec.hint) out.hint = rec.hint;
    BIN_FIELDS.forEach((k) => { if (rec[k] != null) out[k] = unb64(rec[k]); });
    await idbPut(out);
  }
  cryptoKey = null;
  return { docs: parsed.records.filter((r) => r.id !== CONFIG_ID).length };
}

export async function wipeVault() {
  cryptoKey = null;
  const all = await idbAll();
  for (const r of all) await idbDel(r.id);
}
