// On-device export toolkit — turns the traveller's own data into human-viewable files
// (HTML documents, a photo ZIP, an Excel workbook, a CSV) entirely in the browser. No
// server, no libraries, nothing uploaded. Everything here is format-only; the caller in
// main.js supplies the data and the file contents.

const enc = new TextEncoder();
export function strToU8(s) { return enc.encode(s); }

// --- CRC-32 (needed by both ZIP and XLSX, which is itself a ZIP) --------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// --- Minimal STORE-only ZIP (no compression) ----------------------------------
// files: [{ name: string, bytes: Uint8Array }] -> Blob (application/zip). Store method
// keeps this tiny and dependency-free; JPEGs are already compressed, so size is fine.
export function zipStore(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const DOS_DATE = 0x0021; // 1980-01-01, the minimum valid DOS date
  const put = (arr) => { chunks.push(arr); offset += arr.length; };
  const hdr = (extra) => new Uint8Array(extra);
  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = f.bytes;
    const crc = crc32(data);
    const size = data.length;
    // local file header (30 bytes + name)
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);        // version needed
    lh.setUint16(6, 0x0800, true);    // UTF-8 filename flag
    lh.setUint16(8, 0, true);         // store (no compression)
    lh.setUint16(10, 0, true);        // mod time
    lh.setUint16(12, DOS_DATE, true); // mod date
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);     // compressed size
    lh.setUint32(22, size, true);     // uncompressed size
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);        // extra length
    const localOffset = offset;
    put(new Uint8Array(lh.buffer)); put(nameBytes); put(data);
    // central directory record (46 bytes + name)
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);        // version made by
    cd.setUint16(6, 20, true);        // version needed
    cd.setUint16(8, 0x0800, true);    // UTF-8
    cd.setUint16(10, 0, true);        // store
    cd.setUint16(12, 0, true);
    cd.setUint16(14, DOS_DATE, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, size, true);
    cd.setUint32(24, size, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint16(30, 0, true);        // extra
    cd.setUint16(32, 0, true);        // comment
    cd.setUint16(34, 0, true);        // disk number
    cd.setUint16(36, 0, true);        // internal attrs
    cd.setUint32(38, 0, true);        // external attrs
    cd.setUint32(42, localOffset, true);
    central.push(new Uint8Array(cd.buffer)); central.push(nameBytes);
  }
  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) { put(c); cdSize += c.length; }
  // end of central directory
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(4, 0, true);
  eo.setUint16(6, 0, true);
  eo.setUint16(8, files.length, true);
  eo.setUint16(10, files.length, true);
  eo.setUint32(12, cdSize, true);
  eo.setUint32(16, cdStart, true);
  eo.setUint16(20, 0, true);
  put(new Uint8Array(eo.buffer));
  return new Blob(chunks, { type: 'application/zip' });
}

// --- CSV -----------------------------------------------------------------------
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
// headers: string[]; rows: (string|number)[][] -> CSV string (with a UTF-8 BOM so Excel
// opens accented text correctly).
export function toCsv(headers, rows) {
  const lines = [headers.map(csvCell).join(',')];
  for (const r of rows) lines.push(r.map(csvCell).join(','));
  return '﻿' + lines.join('\r\n');
}

// --- XLSX (a ZIP of XML; inline strings, so no shared-strings table) -----------
function xmlEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function colLetter(n) { let s = ''; n += 1; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
// headers: string[]; rows: array of arrays; a cell may be a number or a string.
export function buildXlsx(headers, rows, sheetName = 'Sheet1') {
  const all = [headers.map((h) => ({ v: h, t: 's' }))].concat(
    rows.map((r) => r.map((c) => (typeof c === 'number' && isFinite(c)) ? { v: c, t: 'n' } : { v: c == null ? '' : String(c), t: 's' })));
  const rowsXml = all.map((cells, ri) => {
    const cellsXml = cells.map((c, ci) => {
      const ref = colLetter(ci) + (ri + 1);
      return c.t === 'n'
        ? `<c r="${ref}"><v>${c.v}</v></c>`
        : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(c.v)}</t></is></c>`;
    }).join('');
    return `<row r="${ri + 1}">${cellsXml}</row>`;
  }).join('');
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEsc(sheetName).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const zip = zipStore([
    { name: '[Content_Types].xml', bytes: enc.encode(contentTypes) },
    { name: '_rels/.rels', bytes: enc.encode(rootRels) },
    { name: 'xl/workbook.xml', bytes: enc.encode(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', bytes: enc.encode(workbookRels) },
    { name: 'xl/worksheets/sheet1.xml', bytes: enc.encode(sheet) },
  ]);
  return zip; // a Blob; the .xlsx MIME is close enough — Excel opens by extension
}

// --- download / share ----------------------------------------------------------
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Share one or more files via the device share sheet when possible; otherwise download
// them. Returns 'shared' | 'downloaded'. files: [{ blob, name }].
export async function shareOrDownload(files, title) {
  try {
    if (navigator.canShare && navigator.share) {
      const fileObjs = files.map((f) => new File([f.blob], f.name, { type: f.blob.type || 'application/octet-stream' }));
      if (navigator.canShare({ files: fileObjs })) {
        await navigator.share({ files: fileObjs, title: title || 'My Mekonging export' });
        return 'shared';
      }
    }
  } catch { /* user cancelled or unsupported — fall through to download */ }
  files.forEach((f) => downloadBlob(f.blob, f.name));
  return 'downloaded';
}
