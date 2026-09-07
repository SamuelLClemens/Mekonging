// The secure document vault — passports and other documents, encrypted on-device against the
// traveller's own passcode (js/vault.js holds the crypto; this file is only its screen). The
// UI re-renders into `body` after every state change so it always reflects the vault.
//
// Extracted from main.js as a lazy, route-scoped screen. Two reasons, and the second is the
// one that matters:
//
//   1. 314 lines and the whole js/vault.js import surface — 23 names — left the eagerly
//      parsed cold-start graph. Nobody's first screen is their passport locker.
//   2. It makes the privacy contract STRUCTURAL rather than a rule someone has to remember.
//      The vault must remain unreachable from any export or share path. Until now that was
//      true only because no line of main.js happened to call across; main.js imported all 23
//      vault operations into the same module scope as the exporters, the share sheet and the
//      Travel Circle, so nothing but care stood between them. Those 23 imports now live here,
//      in a module the export and share code has no reference to and cannot import without
//      that appearing in a diff.
//
// Verified isolated before the move rather than assumed: no name from js/vault.js was used
// anywhere else in main.js, and of the thirteen functions defined here only vaultScreen was
// referenced outside the section — once, by the router.
import { store, save } from '../state.js';
import { h } from '../util.js';
import { field, confirmAction } from '../ui-widgets.js';
import {
  available as vaultAvailable, isInitialised as vaultInitialised, isUnlocked as vaultUnlocked,
  lock as vaultLock, setup as vaultSetup, unlock as vaultUnlock, addDocument as vaultAdd,
  listDocuments as vaultList, getDocument as vaultGet, deleteDocument as vaultDelete, wipeVault as vaultWipe,
  addSecureNote as vaultAddNote, getNoteText as vaultGetNote, exportVault, importVault,
  changePasscode as vaultChangePasscode, getHint as vaultGetHint, setHint as vaultSetHint,
  hasRecoveryCode as vaultHasRecovery, createRecoveryCode as vaultCreateRecovery,
  removeRecoveryCode as vaultRemoveRecovery,
  unlockWithRecovery as vaultUnlockRecovery, resetPasscodeWithRecovery as vaultResetWithRecovery,
} from '../vault.js';
import { mount, ownTitle, topbar } from '../main.js';

function vaultWarning() {
  return h('div', { class: 'banner' },
    'Documents are encrypted with your passcode and stored only on this device — never uploaded. Save your recovery code and an encrypted backup, and a forgotten passcode need never lock you out.');
}
function docKind(type) {
  if (!type) return 'File';
  if (type === 'note') return 'Secure note';
  if (type.startsWith('image/')) return 'Image';
  if (type === 'application/pdf') return 'PDF';
  return type;
}
export function vaultScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(ownTitle('documents', 'Documents'), '#home'));
  const body = h('div', {});
  wrap.append(body);
  mount(wrap, '#home');
  if (!vaultAvailable()) {
    body.append(h('div', { class: 'card' }, [
      h('h2', {}, 'Secure storage unavailable'),
      h('p', { class: 'muted' }, 'This browser does not expose the Web Crypto API in the current context. Open the app over HTTPS (or localhost) to use the encrypted vault.'),
    ]));
    return;
  }
  renderVault(body);
}
async function renderVault(body) {
  body.innerHTML = '';
  let inited = false;
  try { inited = await vaultInitialised(); } catch { /* treat as not initialised */ }
  if (!inited) { body.append(vaultSetupCard(body)); return; }
  if (!vaultUnlocked()) { let hint = ''; try { hint = await vaultGetHint(); } catch { /* none */ } body.append(vaultUnlockCard(body, hint)); return; }

  body.append(vaultWarning());

  // Fetch the item list once (reused for the nudge and the list below).
  let docs = [];
  try { docs = await vaultList(); } catch (e) { body.append(h('div', { class: 'card' }, [h('p', { class: 'muted' }, e.message)])); return; }

  // One-time nudge: once there is something worth protecting, encourage an encrypted backup.
  if (docs.length && !store.profile.prefs.vaultBackupDone) {
    body.append(h('div', { class: 'card', style: 'border:1px solid var(--orange)' }, [
      h('strong', {}, '⬇️ Keep a backup of your vault'),
      h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'Protects these from an update, reset, or lost phone.'),
      h('div', { class: 'row-between' }, [
        h('button', { class: 'btn', onclick: async () => { await vaultDownload(); renderVault(body); } }, 'Download backup'),
        h('button', { class: 'btn ghost', onclick: () => { store.profile.prefs.vaultBackupDone = true; save(); renderVault(body); } }, 'Dismiss'),
      ]),
    ]));
  }

  const fileInput = h('input', { type: 'file', accept: 'image/*,application/pdf' });
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Add a document'),
    h('p', { class: 'muted' }, 'Photograph your passport, ID, visa, insurance or vaccination records.'),
    field('File', fileInput),
    h('button', { class: 'btn block', onclick: async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) { alert('Choose a file first.'); return; }
      try { await vaultAdd(f); renderVault(body); } catch (e) { alert(e.message); }
    } }, 'Encrypt & save'),
  ]));

  // Secure typed notes — for card numbers, PINs, booking references, anything you would
  // never put in plain notes. Encrypted exactly like a document.
  const noteTitle = h('input', { type: 'text', placeholder: 'Label (e.g. Visa card, Travel insurance)' });
  const noteText = h('textarea', { rows: '3', placeholder: 'The number, PIN or details — encrypted before it is saved', style: 'width:100%' });
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Add a secure note'),
    h('p', { class: 'muted' }, 'For card numbers, PINs or booking references.'),
    field('Label', noteTitle), field('Details', noteText),
    h('button', { class: 'btn block', onclick: async () => {
      if (!noteText.value.trim()) { alert('Enter something to save.'); return; }
      try { await vaultAddNote(noteTitle.value.trim(), noteText.value); renderVault(body); } catch (e) { alert(e.message); }
    } }, 'Encrypt & save'),
  ]));

  const listCard = h('div', { class: 'card' }, [h('h2', {}, 'Your documents & notes')]);
  body.append(listCard);
  if (!docs.length) listCard.append(h('p', { class: 'muted' }, 'Nothing saved yet — add a document or a secure note above.'));
  docs.forEach((d) => {
    const row = h('div', { class: 'row-between price-item', style: 'flex-wrap:wrap' });
    const reveal = h('div', { style: 'flex-basis:100%;margin-top:6px;display:none' });
    const openBtn = d.type === 'note'
      ? h('button', { class: 'chip', onclick: async () => {
          if (reveal.style.display !== 'none') { reveal.style.display = 'none'; reveal.innerHTML = ''; return; }
          try {
            const text = await vaultGetNote(d.id);
            reveal.innerHTML = '';
            const box = h('div', { class: 'card', style: 'margin:0' }, [
              h('pre', { style: 'white-space:pre-wrap;word-break:break-word;margin:0;font:inherit' }, text),
              h('button', { class: 'chip', style: 'margin-top:6px', onclick: () => { try { navigator.clipboard.writeText(text); } catch { /* no clipboard */ } } }, 'Copy'),
            ]);
            reveal.append(box); reveal.style.display = '';
          } catch (e) { alert(e.message); }
        } }, 'Reveal')
      : h('button', { class: 'chip', onclick: async () => {
          try { const doc = await vaultGet(d.id); const u = URL.createObjectURL(doc.blob); window.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000); }
          catch (e) { alert(e.message); }
        } }, 'View');
    row.append(
      h('div', { class: 'grow' }, [h('strong', {}, d.name || 'Document'), h('div', { class: 'muted' }, `${docKind(d.type)} · added ${d.createdAt}`)]),
      h('div', { class: 'cats' }, [
        openBtn,
        h('button', { class: 'chip', 'aria-label': `Delete ${d.name || 'document'} from the vault`, onclick: async () => { if (await confirmAction({ title: 'Delete document?', body: `Delete “${d.name}” from the vault?`, confirmLabel: 'Delete', danger: true })) { await vaultDelete(d.id); renderVault(body); } } }, '✕'),
      ]),
      reveal,
    );
    listCard.append(row);
  });

  // Encrypted backup — so passports, cards and notes are never lost to an update, a reset,
  // or a new phone. The file holds only ciphertext + salt, so it stays private: useless
  // without the passcode.
  body.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Backup'),
    h('p', { class: 'muted' }, 'Protects these from an update, reset, or new device.'),
    vaultDownloadBtn(body),
    vaultShareBtn(),
    vaultRestoreControl(body),
  ]));

  // Recovery code — the primary way back in if the passcode is ever forgotten. Every new
  // vault mints one at setup; this lets the user check it is set or mint a fresh one.
  let hasRec = false; try { hasRec = await vaultHasRecovery(); } catch { /* treat as none */ }
  body.append(h('div', { class: 'card', style: hasRec ? '' : 'border:1px solid var(--orange)' }, [
    h('h2', {}, '🔑 Recovery code'),
    hasRec
      ? h('p', { class: 'muted' }, 'Set. Keep it somewhere safe and private, apart from your phone.')
      : h('p', { class: 'muted' }, 'Not set — create one so a forgotten passcode can’t lock you out for good.'),
    h('button', { class: 'btn ghost block', onclick: async () => {
      if (hasRec && !(await confirmAction({ title: 'Generate a new recovery code?', body: 'Your current recovery code will stop working immediately.', confirmLabel: 'Replace code', danger: true }))) return;
      try { const code = await vaultCreateRecovery(); body.innerHTML = ''; body.append(recoveryCodeCard(body, code)); }
      catch (e) { alert(e.message); }
    } }, hasRec ? 'Replace recovery code' : 'Create a recovery code'),
    // A recovery code is a second key to the vault: anyone holding it can open it without
    // the passcode. That is worth revoking if the written copy is lost, or if the traveller
    // deliberately wants exactly one way in while crossing a border. The confirmation says
    // plainly what it costs, because after this the ONLY routes back are the passcode and
    // an encrypted backup file.
    hasRec ? h('button', { class: 'btn ghost block danger-outline vault-rec-remove', onclick: async () => {
      const ok = await confirmAction({
        title: 'Remove the recovery code?',
        body: 'Your current code stops working immediately. After this, the only ways into the vault are your passcode and an encrypted backup file — forget both and the documents are gone for good.',
        confirmLabel: 'Remove code', danger: true,
      });
      if (!ok) return;
      try { await vaultRemoveRecovery(); renderVault(body); }
      catch (e) { alert(e.message); }
    } }, 'Remove recovery code') : null,
  ]));

  // Change passcode + reminder. An instant re-wrap of the master key — documents are untouched.
  let curHint = ''; try { curHint = await vaultGetHint(); } catch { /* none */ }
  const np1 = h('input', { type: 'password', placeholder: 'New passcode (min 4)' });
  const np2 = h('input', { type: 'password', placeholder: 'Confirm new passcode' });
  const hintIn = h('input', { type: 'text', value: curHint, placeholder: 'e.g. my usual PIN + birth year' });
  body.append(h('details', { class: 'filters-collapse' }, [
    h('summary', {}, 'Change passcode / reminder'),
    h('div', {}, [
      field('New passcode', np1), field('Confirm', np2),
      h('button', { class: 'btn block', onclick: async () => {
        if (!np1.value) { alert('Enter a new passcode.'); return; }
        if (np1.value !== np2.value) { alert('The new passcodes do not match.'); return; }
        try { await vaultChangePasscode(np1.value); await vaultSetHint(hintIn.value.trim()); alert('Passcode changed. Your recovery code still works.'); renderVault(body); }
        catch (e) { alert(e.message); }
      } }, 'Change passcode'),
      field('Passcode reminder (optional)', hintIn),
      h('button', { class: 'btn ghost block', onclick: async () => { try { await vaultSetHint(hintIn.value.trim()); alert('Reminder saved.'); } catch (e) { alert(e.message); } } }, 'Save reminder only'),
      h('p', { class: 'disclaimer' }, 'No server or email reset. Use your recovery code or restore a backup to get back in — never gone for good.'),
    ]),
  ]));

  body.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => { vaultLock(); renderVault(body); } }, '🔒 Lock vault'),
    h('button', { class: 'btn ghost block btn-spaced', style: 'color:var(--warn); border-color:var(--warn)',
      onclick: async () => { if (await confirmAction({ title: 'Erase the entire vault?', body: 'This permanently deletes every document in it and cannot be undone. Download a backup first if you want to keep them.', confirmLabel: 'Erase vault', danger: true })) { try { await vaultWipe(); } catch { /* ignore */ } renderVault(body); } } }, 'Erase vault'),
  ]));
}
function vaultStamp() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
// Shown exactly ONCE, right after a code is minted (setup / replace / reset). The code is
// never stored where it can be read, so this is the only chance to save it.
function recoveryCodeCard(body, code, opts) {
  opts = opts || {};
  const download = () => {
    const txt = `Mekonging — vault recovery code\n\nKeep this somewhere safe and private, apart from your phone.\nIt can unlock your vault and reset a forgotten passcode.\n\n    ${code}\n\nAnyone who has this code can open your vault, so store it like a password.\nThis code is shown only once and is not saved anywhere it can be read.\n`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `mekonging-recovery-code-${vaultStamp()}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  return h('div', { class: 'card', style: 'border:2px solid var(--orange)' }, [
    h('h2', {}, '🔑 Save your recovery code'),
    h('p', {}, opts.isReset
      ? 'Your passcode has been reset. Here is a NEW recovery code — your old one no longer works. Save this one now.'
      : 'This is the one way back in if you ever forget your passcode. Save it somewhere safe and private now — it is shown only once and is never stored where it can be read.'),
    h('div', { style: 'margin:10px 0;padding:14px;text-align:center;font-size:1.15rem;letter-spacing:1px;font-family:monospace;user-select:all;word-break:break-all;background:var(--card-2, rgba(0,0,0,.06));border-radius:10px' }, code),
    h('div', { class: 'row-between' }, [
      h('button', { class: 'btn', onclick: () => { try { navigator.clipboard.writeText(code); } catch { /* no clipboard */ } } }, 'Copy'),
      h('button', { class: 'btn', onclick: download }, 'Download as file'),
    ]),
    h('p', { class: 'disclaimer', style: 'margin-top:10px' }, 'Keep it private and separate from your device — a password manager, a note at home, or written down. Anyone with this code can open your vault.'),
    h('button', { class: 'btn block btn-spaced', onclick: () => renderVault(body) }, 'I have saved it — continue'),
  ]);
}
async function vaultDownload() {
  const json = await exportVault();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `mekonging-vault-${vaultStamp()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  store.profile.prefs.vaultBackupDone = true; save();
}
function vaultDownloadBtn(body) {
  return h('button', { class: 'btn ghost block', onclick: async () => {
    try { await vaultDownload(); if (body) renderVault(body); } catch (e) { alert(e.message); }
  } }, '⬇️ Download encrypted backup');
}
// The safe "email for recovery": share the ENCRYPTED backup file to your own inbox / cloud.
// It is ciphertext, so it stays private; you restore it later and unlock with your passcode.
function vaultShareBtn() {
  return h('button', { class: 'btn ghost block btn-spaced', onclick: async () => {
    try {
      const json = await exportVault();
      const file = new File([json], `mekonging-vault-${vaultStamp()}.json`, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mekonging vault backup', text: 'Encrypted vault backup — needs your passcode to open.' });
        store.profile.prefs.vaultBackupDone = true; save();
      } else {
        alert('Sharing files is not supported on this device. Use “Download encrypted backup”, then email that file to yourself — it is encrypted and safe to store.');
      }
    } catch (e) { if (e && e.name !== 'AbortError') alert(e.message || 'Could not share the backup.'); }
  } }, '📧 Email / share encrypted backup');
}
function vaultRestoreControl(body) {
  const inp = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none', onchange: (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (!(await confirmAction({ title: 'Restore this vault backup?', body: 'It replaces any vault currently on this device, and you unlock it with the backup’s passcode.', confirmLabel: 'Restore', danger: true }))) return;
      try { const res = await importVault(String(reader.result || '')); alert(`Restored ${res.docs} item${res.docs === 1 ? '' : 's'}. Unlock with your passcode.`); renderVault(body); }
      catch (e) { alert(e.message); }
    };
    reader.readAsText(f);
  } });
  return h('div', {}, [inp, h('button', { class: 'btn ghost block btn-spaced', onclick: () => inp.click() }, '⬆️ Restore from a backup file')]);
}
function vaultSetupCard(body) {
  const p1 = h('input', { type: 'password', placeholder: 'Choose a passcode (min 4 characters)' });
  const p2 = h('input', { type: 'password', placeholder: 'Confirm passcode' });
  const hint = h('input', { type: 'text', placeholder: 'e.g. my usual PIN + birth year' });
  return h('div', { class: 'card' }, [
    h('h2', {}, 'Set up your vault'),
    vaultWarning(),
    field('Passcode', p1), field('Confirm', p2),
    field('Passcode reminder (optional)', hint),
    h('p', { class: 'disclaimer', style: 'margin-top:0' }, 'You’ll get a one-time recovery code next — save it. The reminder below is just a hint, not your passcode.'),
    h('button', { class: 'btn block', onclick: async () => {
      if (p1.value !== p2.value) { alert('The passcodes do not match.'); return; }
      try { const { recoveryCode } = await vaultSetup(p1.value, hint.value.trim()); body.innerHTML = ''; body.append(recoveryCodeCard(body, recoveryCode)); }
      catch (e) { alert(e.message); }
    } }, 'Create vault'),
    h('p', { class: 'muted', style: 'margin:12px 0 4px' }, 'Moving from another device? Restore your encrypted backup, then unlock it with the same passcode.'),
    vaultRestoreControl(body),
  ]);
}
function vaultUnlockCard(body, hintText) {
  const pin = h('input', { type: 'password', placeholder: 'Passcode' });
  const err = h('p', { class: 'warn-note', style: 'display:none' });
  const submit = async () => {
    try { await vaultUnlock(pin.value); renderVault(body); }
    catch (e) { err.textContent = e.message; err.style.display = ''; }
  };
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  return h('div', { class: 'card' }, [
    h('h2', {}, 'Unlock your vault'),
    h('p', { class: 'muted' }, 'Enter your passcode to decrypt your documents on this device.'),
    field('Passcode', pin), err,
    hintText ? h('p', { class: 'muted', style: 'margin:4px 0 0' }, `💡 Reminder: ${hintText}`) : null,
    h('button', { class: 'btn block btn-spaced', onclick: submit }, 'Unlock'),
    forgottenPasscodeDetails(body),
  ]);
}
// The recovery paths, in order: recovery code (resets the passcode), then an encrypted
// backup. There is deliberately no server/email reset — that is what keeps the vault private.
function forgottenPasscodeDetails(body) {
  const rc = h('input', { type: 'text', placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', autocapitalize: 'characters', spellcheck: 'false' });
  const rnp1 = h('input', { type: 'password', placeholder: 'New passcode (min 4)' });
  const rnp2 = h('input', { type: 'password', placeholder: 'Confirm new passcode' });
  const rerr = h('p', { class: 'warn-note', style: 'display:none' });
  return h('details', { class: 'filters-collapse', style: 'margin-top:10px' }, [
    h('summary', {}, 'Forgotten your passcode?'),
    h('div', {}, [
      h('p', { class: 'muted' }, 'Have your recovery code? Enter it with a new passcode to get back in.'),
      field('Recovery code', rc), field('New passcode', rnp1), field('Confirm', rnp2), rerr,
      h('button', { class: 'btn block', onclick: async () => {
        rerr.style.display = 'none';
        if (!rc.value.trim()) { rerr.textContent = 'Enter your recovery code.'; rerr.style.display = ''; return; }
        if (!rnp1.value || rnp1.value !== rnp2.value) { rerr.textContent = 'Enter a new passcode in both fields — they must match.'; rerr.style.display = ''; return; }
        try {
          const { recoveryCode } = await vaultResetWithRecovery(rc.value.trim(), rnp1.value);
          body.innerHTML = ''; body.append(recoveryCodeCard(body, recoveryCode, { isReset: true }));
        } catch (e) { rerr.textContent = e.message; rerr.style.display = ''; }
      } }, 'Reset passcode with recovery code'),
      h('p', { class: 'muted', style: 'margin-top:14px' }, 'No recovery code? If you saved an encrypted backup, restore it and unlock with that backup’s passcode.'),
      vaultRestoreControl(body),
      h('p', { class: 'disclaimer' }, 'For your privacy there is no server or email reset. Without your passcode, your recovery code, or an encrypted backup, the contents cannot be recovered.'),
    ]),
  ]);
}
