// Secure, on-device document vault for passports, visas, insurance and tickets.
//
// Security model (the whole point of this module):
//   - A random 256-bit master key (the DEK) encrypts every document and note with
//     AES-GCM. The DEK never leaves memory and is never stored in the clear.
//   - The DEK is WRAPPED (encrypted) twice, so there are two independent ways in:
//       1. the user's PASSCODE  — PBKDF2-SHA-256 (250k iters) + random salt, and
//       2. an optional one-time RECOVERY CODE — same derivation, its own salt.
//     Either wrap can be unwrapped to recover the same DEK; losing the passcode is
//     survivable if the recovery code was saved. There is still NO server, NO key
//     escrow and NO backdoor — the recovery code is generated on-device, shown once,
//     and only its wrapped copy of the DEK is stored (useless without the code).
//   - Changing the passcode simply re-wraps the DEK, so it is instant and never
//     touches the documents themselves.
//   - Ciphertext lives in this browser's IndexedDB ('mk-vault'). Nothing is ever
//     transmitted off the device, and nothing here is ever committed to source.
//   - If BOTH the passcode and the recovery code are lost, the data is unrecoverable.
//     That is by design.
//
// Web Crypto requires a secure context (HTTPS or localhost). available() reports
// whether the environment can support the vault so the UI can degrade gracefully.

const DB_NAME = 'mk-vault';
const STORE = 'vault';
const CONFIG_ID = '__config__';
const PBKDF2_ITERS = 250000;
const VERIFIER_TEXT = 'mekonging-vault-v1';
const CONFIG_VERSION = 2; // 2 = envelope (DEK wrapped by passcode + optional recovery code)

const enc = new TextEncoder();
const dec = new TextDecoder();
let cryptoKey = null; // in-memory AES-GCM master key (DEK); null when locked. Never persisted.

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
// A KEK (key-encryption key) is derived from a secret (passcode or recovery code) and
// only ever used to wrap/unwrap the DEK. The DEK is a random AES-GCM key that encrypts
// the actual documents. Two KEKs wrapping one DEK = two independent ways to unlock.
async function deriveBits(secret, salt, iters) {
  const material = await subtle().importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  return subtle().deriveBits({ name: 'PBKDF2', salt, iterations: iters || PBKDF2_ITERS, hash: 'SHA-256' }, material, 256);
}
async function kekFrom(secret, salt, iters) {
  const bits = await deriveBits(secret, salt, iters);
  return subtle().importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
// The DEK is made extractable so we can re-wrap it (change passcode / add recovery code)
// entirely in memory. It is never exported to storage — only its wrapped forms are stored.
async function importDek(rawBits) {
  return subtle().importKey('raw', rawBits, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
async function exportDekRaw() { return new Uint8Array(await subtle().exportKey('raw', cryptoKey)); }

async function aesEncrypt(key, bytes) {
  const iv = randBytes(12);
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, key, bytes);
  return { iv, ct };
}
function aesDecrypt(key, iv, ct) { return subtle().decrypt({ name: 'AES-GCM', iv }, key, ct); }

// ---- recovery code ----------------------------------------------------------
// Crockford base32 without the ambiguous I, L, O, U. 25 symbols = ~116 bits of entropy,
// shown grouped as XXXXX-XXXXX-XXXXX-XXXXX-XXXXX for legibility.
const RC_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function newRecoveryCode() {
  const b = randBytes(25);
  let out = '';
  for (let i = 0; i < 25; i++) {
    out += RC_ALPHA[b[i] & 31];
    if (i % 5 === 4 && i !== 24) out += '-';
  }
  return out;
}
// Accept loose user typing: uppercase, strip anything not in the alphabet, and fold the
// ambiguous look-alikes back to their canonical symbol before deriving the key.
function normalizeRecovery(input) {
  return String(input || '').toUpperCase()
    .replace(/[IL]/g, '1').replace(/O/g, '0').replace(/U/g, 'V')
    .replace(/[^0-9A-Z]/g, '');
}

// ---- public API -------------------------------------------------------------
export function available() {
  return !!(typeof crypto !== 'undefined' && crypto.subtle && typeof indexedDB !== 'undefined');
}
export async function isInitialised() { try { return !!(await idbGet(CONFIG_ID)); } catch { return false; } }
export function isUnlocked() { return !!cryptoKey; }
export function lock() { cryptoKey = null; }

// Set up a brand-new vault. Generates a random DEK, wraps it with the passcode, and
// immediately mints a recovery code (wrapped separately). The recovery code is RETURNED
// so the UI can show it exactly once — it is never stored in the clear.
export async function setup(passcode, hint) {
  if (!passcode || passcode.length < 4) throw new Error('Choose a passcode of at least 4 characters.');
  if (await isInitialised()) throw new Error('The vault is already set up. Unlock it instead.');
  const dekRaw = randBytes(32);
  cryptoKey = await importDek(dekRaw);
  const passSalt = randBytes(16);
  const kek = await kekFrom(passcode, passSalt, PBKDF2_ITERS);
  const wrap = await aesEncrypt(kek, dekRaw);
  const verifier = await aesEncrypt(cryptoKey, enc.encode(VERIFIER_TEXT));
  await idbPut({
    id: CONFIG_ID, version: CONFIG_VERSION,
    passSalt, passIters: PBKDF2_ITERS, passWrapIv: wrap.iv, passWrapCt: wrap.ct,
    verifierIv: verifier.iv, verifierCt: verifier.ct,
    hint: String(hint || '').slice(0, 120),
  });
  const recoveryCode = await createRecoveryCode();
  return { recoveryCode };
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

// ---- recovery code management ----------------------------------------------
export async function hasRecoveryCode() { try { const c = await idbGet(CONFIG_ID); return !!(c && c.recWrapCt); } catch { return false; } }

// Mint (or replace) the recovery code. Requires the vault to be unlocked so we can wrap
// the live DEK. Returns the plaintext code ONCE for the user to save; only the wrapped
// copy is persisted. Any previous recovery code stops working immediately.
export async function createRecoveryCode() {
  if (!cryptoKey) throw new Error('Unlock the vault first.');
  const dekRaw = await exportDekRaw();
  const code = newRecoveryCode();
  const recSalt = randBytes(16);
  const kek = await kekFrom(normalizeRecovery(code), recSalt, PBKDF2_ITERS);
  const wrap = await aesEncrypt(kek, dekRaw);
  const c = await idbGet(CONFIG_ID);
  if (!c) throw new Error('Set up the vault first.');
  c.recSalt = recSalt; c.recIters = PBKDF2_ITERS; c.recWrapIv = wrap.iv; c.recWrapCt = wrap.ct;
  await idbPut(c);
  return code;
}
export async function removeRecoveryCode() {
  const c = await idbGet(CONFIG_ID);
  if (!c) return;
  delete c.recSalt; delete c.recIters; delete c.recWrapIv; delete c.recWrapCt;
  await idbPut(c);
}

// Change the passcode: instant re-wrap of the DEK under a fresh passcode-derived key.
// Documents are untouched. Zero-knowledge preserved. The recovery code still works.
export async function changePasscode(newPasscode) {
  if (!cryptoKey) throw new Error('Unlock the vault first.');
  if (!newPasscode || newPasscode.length < 4) throw new Error('Choose a new passcode of at least 4 characters.');
  await rewrapPasscode(newPasscode);
}
async function rewrapPasscode(newPasscode) {
  const dekRaw = await exportDekRaw();
  const passSalt = randBytes(16);
  const kek = await kekFrom(newPasscode, passSalt, PBKDF2_ITERS);
  const wrap = await aesEncrypt(kek, dekRaw);
  const c = (await idbGet(CONFIG_ID)) || { id: CONFIG_ID };
  c.version = CONFIG_VERSION; c.passSalt = passSalt; c.passIters = PBKDF2_ITERS;
  c.passWrapIv = wrap.iv; c.passWrapCt = wrap.ct;
  delete c.salt; delete c.iters; // clear any legacy v1 fields
  await idbPut(c);
}

export async function unlock(passcode) {
  const cfg = await idbGet(CONFIG_ID);
  if (!cfg) throw new Error('The vault has not been set up yet.');
  if (cfg.passWrapCt) { // v2 envelope
    const kek = await kekFrom(passcode, cfg.passSalt, cfg.passIters);
    let dekRaw;
    try { dekRaw = await aesDecrypt(kek, cfg.passWrapIv, cfg.passWrapCt); } catch { throw new Error('Incorrect passcode.'); }
    const dek = await importDek(dekRaw);
    try { if (dec.decode(await aesDecrypt(dek, cfg.verifierIv, cfg.verifierCt)) !== VERIFIER_TEXT) throw 0; } catch { throw new Error('Incorrect passcode.'); }
    cryptoKey = dek;
    return;
  }
  await unlockLegacyAndUpgrade(passcode, cfg); // v1 vaults: verify, adopt, upgrade in place
}

// Legacy (v1) vaults encrypted every record directly with PBKDF2(passcode). Those exact
// derived bits become the new DEK, so upgrading to the envelope model needs NO document
// re-encryption — we just verify, adopt the bits as the DEK, and store a passcode wrap +
// a fresh recovery code. Fast and lossless.
async function unlockLegacyAndUpgrade(passcode, cfg) {
  const bits = await deriveBits(passcode, cfg.salt, cfg.iters || PBKDF2_ITERS);
  const dek = await importDek(bits);
  try { if (dec.decode(await aesDecrypt(dek, cfg.verifierIv, cfg.verifierCt)) !== VERIFIER_TEXT) throw 0; } catch { throw new Error('Incorrect passcode.'); }
  cryptoKey = dek;
  try {
    await rewrapPasscode(passcode);            // adds v2 passcode wrap, clears legacy salt/iters
    if (!(await hasRecoveryCode())) await createRecoveryCode().catch(() => {});
  } catch { /* upgrade is best-effort; the vault is already unlocked and usable */ }
}

// Unlock using the recovery code instead of the passcode.
export async function unlockWithRecovery(code) {
  const cfg = await idbGet(CONFIG_ID);
  if (!cfg) throw new Error('The vault has not been set up yet.');
  if (!cfg.recWrapCt) throw new Error('No recovery code was saved for this vault.');
  const kek = await kekFrom(normalizeRecovery(code), cfg.recSalt, cfg.recIters);
  let dekRaw;
  try { dekRaw = await aesDecrypt(kek, cfg.recWrapIv, cfg.recWrapCt); } catch { throw new Error('That recovery code is not correct.'); }
  const dek = await importDek(dekRaw);
  try { if (dec.decode(await aesDecrypt(dek, cfg.verifierIv, cfg.verifierCt)) !== VERIFIER_TEXT) throw 0; } catch { throw new Error('That recovery code is not correct.'); }
  cryptoKey = dek;
}

// Forgot the passcode: unlock with the recovery code, then set a brand-new passcode.
// Returns a fresh recovery code so the old (now-shared) one can be retired.
export async function resetPasscodeWithRecovery(code, newPasscode) {
  await unlockWithRecovery(code);
  if (!newPasscode || newPasscode.length < 4) throw new Error('Choose a new passcode of at least 4 characters.');
  await rewrapPasscode(newPasscode);
  const recoveryCode = await createRecoveryCode();
  return { recoveryCode };
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
// Exports the RAW encrypted records (salts + ciphertext only — never the DEK, never any
// plaintext), so the backup file is useless without the passcode OR the recovery code.
// Restoring replaces the whole vault with the snapshot and re-locks it, so a new device
// unlocks with the same code — this is the second, portable recovery path.
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
const BIN_FIELDS = ['salt', 'verifierIv', 'verifierCt', 'metaIv', 'metaCt', 'blobIv', 'blobCt',
  'passSalt', 'passWrapIv', 'passWrapCt', 'recSalt', 'recWrapIv', 'recWrapCt'];
const SCALAR_FIELDS = ['version', 'iters', 'passIters', 'recIters', 'hint', 'createdAt'];

export async function exportVault() {
  const all = await idbAll();
  if (!all.length) throw new Error('The vault is empty — nothing to back up yet.');
  const records = all.map((r) => {
    const o = { id: r.id };
    SCALAR_FIELDS.forEach((k) => { if (r[k] != null) o[k] = r[k]; });
    BIN_FIELDS.forEach((k) => { if (r[k] != null) o[k] = b64(r[k]); });
    return o;
  });
  return JSON.stringify({ format: 'mekonging-vault-backup', v: 2, exportedAt: new Date().toISOString().slice(0, 10), records });
}

export async function importVault(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('That file is not a valid vault backup.'); }
  if (!parsed || parsed.format !== 'mekonging-vault-backup' || !Array.isArray(parsed.records)) throw new Error('That file is not a Mekonging vault backup.');
  if (!parsed.records.some((r) => r.id === CONFIG_ID)) throw new Error('This backup is missing its passcode configuration and cannot be restored.');
  // Replace the whole vault with this complete snapshot, then lock (unlock with its passcode
  // or recovery code). Older v1 backups restore fine and upgrade on the next unlock.
  const existing = await idbAll();
  for (const r of existing) await idbDel(r.id);
  for (const rec of parsed.records) {
    const out = { id: rec.id };
    SCALAR_FIELDS.forEach((k) => { if (rec[k] != null) out[k] = rec[k]; });
    if (rec.id !== CONFIG_ID && out.createdAt == null) out.createdAt = new Date().toISOString().slice(0, 10);
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
