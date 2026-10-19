# Tesseract.js, self-hosted (M3a, docs/EXCHANGE.md §16)

Text recognition for Point & translate (`js/screens/signtranslate.js`). Everything the screen
loads is here, so recognition makes no third-party request and the CSP names no CDN.

| File | Source (npm tarball, integrity checked against the registry) |
|---|---|
| `tesseract.min.js`, `worker.min.js`, their `.LICENSE.txt`, `LICENSE.md` | `tesseract.js@5.1.1` `dist/` (Apache-2.0) |
| `core/tesseract-core-simd-lstm.wasm.js`, `core/tesseract-core-lstm.wasm.js`, `core/LICENSE` | `tesseract.js-core@5.1.1` (Apache-2.0) |
| `lang/{tha,vie,khm,lao}.traineddata.gz` | `@tesseract.js-data/<lang>@1.0.0`, `4.0.0_best_int/` (MIT package; the data is tesseract-ocr's tessdata_best, Apache-2.0) |

- These are the versions production loaded before M3a: unpkg resolved `tesseract.js@5` to 5.1.1,
  whose default core is 5.1.1 and default language path is jsdelivr's `4.0.0_best_int`. The
  language files are byte-for-byte the size jsdelivr served.
- Files are unmodified upstream bytes. The `sourceMappingURL` comments point at maps that are not
  shipped; that only matters with DevTools open.
- Only the two LSTM cores ship: `Tesseract.recognize()` runs `oem` 1 (LSTM only), and the worker
  picks the SIMD core when the device supports WebAssembly SIMD and the plain one otherwise.
- The worker stays a blob worker (tesseract's default). A blob worker inherits the page's CSP; a
  worker started from a URL would get the policy of its own response, and GitHub Pages sends none.
- `.traineddata.gz` is not in the service-worker manifest (`build-sw-manifest.py` hashes code
  only). The fetch handler caches it as a heavy `/lib/` asset, and tesseract keeps its own copy in
  IndexedDB under `./<lang>.traineddata`, the same key as before, so earlier downloads still count.

To update: download the new tarballs from registry.npmjs.org, check each against `dist.integrity`
in the registry metadata, replace these files, and prove OCR end to end in headless Chrome.
