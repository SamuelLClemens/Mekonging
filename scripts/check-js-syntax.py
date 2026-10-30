#!/usr/bin/env python3
"""Parse every tracked JavaScript file, so a syntax error fails here instead of in a browser.

    python3 scripts/check-js-syntax.py

WHY THIS EXISTS. No other guard parses JavaScript. They read it with regular expressions, so a
missing brace or a stray token passes every one of them, and the module simply never loads. In
an eagerly imported module that blanks the whole app; in a lazy one it is a screen that spins.

The parser is `node --check` where Node is installed (CI), else the JavaScriptCore shell that
ships with macOS (`checkModuleSyntax` / `checkScriptSyntax`), which parses without running
anything. With neither, the guard fails rather than pass without checking. Before it reads any
project file it proves the parser rejects a broken module and a broken script, so a parser that
accepts everything cannot turn this into a silent pass.

A file with a top-level `import` or `export` statement is parsed as a module; anything else as a
classic script (sw.js, js/theme-boot.js). lib/ (vendored, minified) and Mekonging Xcode/ (a synced
copy of the web app) are skipped.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
SKIP = ('lib/', 'Mekonging Xcode/')
MODULE_RX = re.compile(r'''^[ \t]*(?:import[\s{*'"]|export[\s{*])''', re.M)

# (label, source, is_module, should_parse)
SELF_TEST = [
    ('good module', 'export const a = 1;\n', True, True),
    ('bad module', 'export const a = ;\n', True, False),
    ('good script', 'var a = 1;\n', False, True),
    ('bad script', 'var a = (1;\n', False, False),
]


def tracked():
    out = subprocess.run(['git', 'ls-files', '-z', '--', '*.js', '*.mjs'], cwd=ROOT,
                         capture_output=True, check=True).stdout.decode('utf-8')
    return sorted(f for f in out.split('\0') if f and not f.startswith(SKIP))


def parse_node(node, items):
    """items: [(label, path, is_module)] -> {label: error or None}. Each file is copied to .mjs
    or .cjs so Node picks the right goal regardless of package.json's "type"."""
    errs = {}
    with tempfile.TemporaryDirectory() as tmp:
        for i, (label, path, is_module) in enumerate(items):
            copy = os.path.join(tmp, f'{i}.mjs' if is_module else f'{i}.cjs')
            shutil.copyfile(path, copy)
            r = subprocess.run([node, '--check', copy], capture_output=True, text=True)
            if r.returncode == 0:
                errs[label] = None
                continue
            lines = [l for l in r.stderr.splitlines() if l.strip()]
            where = next((l.replace(copy, label) for l in lines if l.startswith(copy + ':')), label)
            what = next((l for l in lines if 'Error' in l), lines[-1] if lines else 'exit %d' % r.returncode)
            errs[label] = f'{where}: {what.strip()}'
    return errs


def parse_jsc(items):
    """One jsc process for every file; checkModuleSyntax/checkScriptSyntax only parse."""
    with tempfile.TemporaryDirectory() as tmp:
        listing = os.path.join(tmp, 'files.json')
        json.dump([[label, path, is_module] for label, path, is_module in items], open(listing, 'w'))
        driver = os.path.join(tmp, 'driver.js')
        open(driver, 'w').write(
            'const out = {};\n'
            f'for (const [label, path, mod] of JSON.parse(read({json.dumps(listing)}))) {{\n'
            '  try { (mod ? checkModuleSyntax : checkScriptSyntax)(read(path)); out[label] = null; }\n'
            '  catch (e) { out[label] = String(e); }\n'
            '}\n'
            'print(JSON.stringify(out));\n')
        r = subprocess.run([JSC, driver], capture_output=True, text=True)
        if r.returncode != 0 or not r.stdout.strip():
            raise SystemExit(f'FAIL: the JavaScriptCore shell did not run: {r.stderr.strip()[:300]}')
        out = json.loads(r.stdout.strip().splitlines()[-1])
        return {label: (f'{label}: {e}' if e else None) for label, e in out.items()}


def main():
    node = shutil.which('node')
    if node:
        name = 'node ' + subprocess.run([node, '--version'], capture_output=True, text=True).stdout.strip()
        parse = lambda items: parse_node(node, items)
    elif os.path.exists(JSC):
        name = 'JavaScriptCore'
        parse = parse_jsc
    else:
        raise SystemExit('FAIL: no JavaScript parser: install Node, or run on macOS (JavaScriptCore)')

    with tempfile.TemporaryDirectory() as tmp:
        items = []
        for i, (label, src, is_module, _) in enumerate(SELF_TEST):
            p = os.path.join(tmp, f'self{i}.js')
            open(p, 'w').write(src)
            items.append((label, p, is_module))
        got = parse(items)
    wrong = [label for label, _, _, ok in SELF_TEST if (got[label] is None) != ok]
    if wrong:
        raise SystemExit(f'FAIL: {name} did not behave as a parser on its self-test: {", ".join(wrong)}')

    files = tracked()
    items = []
    for f in files:
        path = os.path.join(ROOT, f)
        items.append((f, path, bool(MODULE_RX.search(open(path, encoding='utf-8').read()))))
    errs = {label: e for label, e in parse(items).items() if e}
    modules = sum(1 for _, _, m in items if m)
    if errs:
        for label in sorted(errs):
            print('  ' + errs[label])
        print(f'FAIL: {len(errs)} of {len(files)} JavaScript files do not parse ({name})')
        sys.exit(1)
    print(f'PASS: {len(files)} JavaScript files parse ({modules} modules, {len(files) - modules} scripts; {name})')


if __name__ == '__main__':
    main()
