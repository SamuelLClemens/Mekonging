// Runs scripts/validate.mjs on a machine with no Node, under the macOS JavaScriptCore shell:
//
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -m scripts/validate-jsc.mjs
//
// It supplies the two Node globals the validator uses (console, process.exit) and prints
// "EXIT <code>" last, because jsc's own exit status does not carry the validator's. CI runs the
// validator with real Node (.github/workflows/guards.yml); this is the local pre-push check.

export {}; // marks this file as a module for check-js-syntax (it needs top-level await)

const out = (...a) => print(a.map(String).join(' '));
globalThis.console = { log: out, info: out, warn: out, error: out };
globalThis.process = { env: {}, exit(code) { throw Object.assign(new Error('exit'), { exitCode: code }); } };

try {
  await import('./validate.mjs');
  print('EXIT 0');
} catch (e) {
  if (e && e.exitCode != null) print('EXIT ' + e.exitCode);
  else { print('EXIT 1 (threw: ' + e + ')'); if (e && e.stack) print(e.stack); }
}
