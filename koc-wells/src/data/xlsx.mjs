// Minimal reader for Excel .xlsx files: returns each sheet's cells as text.
// An .xlsx is a zip of XML parts; we unzip with fflate and read the few parts
// that hold values (shared strings, sheets, and number formats for dates).

import { unzipSync, strFromU8 } from 'fflate';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
};

// Text of a string item, joining rich-text runs and skipping phonetic hints.
function itemText(xml) {
  const body = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  for (const m of body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)) out += m[1] ? decode(m[1]) : '';
  return out;
}

function colIndex(ref) {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

// Built-in number formats that display dates (ECMA-376 §18.8.30).
const DATE_FORMAT_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57]);
function isDateFormat(code) {
  // Drop quoted text, [colour]/[locale] tags and escapes before looking for d/m/y.
  const c = code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '');
  return /[dmy]/i.test(c) && !/^[#0.,%\s]*$/.test(c);
}

function serialToIso(serial, date1904) {
  const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  const d = new Date(base + Math.round(serial * 86400000));
  return d.toISOString().slice(0, 10);
}

/** Read an .xlsx file into [{ name, rows }], rows being arrays of cell text. */
export function readXlsx(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const files = unzipSync(u8, { filter: (f) => /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|styles\.xml|worksheets\/[^/]+\.xml)$/.test(f.name) });
  const text = (name) => (files[name] ? strFromU8(files[name]) : '');

  const workbook = text('xl/workbook.xml');
  if (!workbook) throw new Error('الملف ليس ملف Excel صالحًا.');
  const date1904 = /<workbookPr\b[^>]*\bdate1904="(1|true)"/.test(workbook);

  const shared = [...text('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>|<si\/>/g)].map((m) => (m[1] ? itemText(m[1]) : ''));

  // Which cell styles (by index) show a date.
  const styles = text('xl/styles.xml');
  const customDates = new Set();
  for (const m of styles.matchAll(/<numFmt\b[^>]*>/g)) {
    if (isDateFormat(attr(m[0], 'formatCode') || '')) customDates.add(+attr(m[0], 'numFmtId'));
  }
  const xfs = (styles.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/) || [])[1] || '';
  const dateStyles = [...xfs.matchAll(/<xf\b[^>]*>/g)].map((m) => {
    const id = +(attr(m[0], 'numFmtId') || 0);
    return DATE_FORMAT_IDS.has(id) || customDates.has(id);
  });

  const rels = {};
  for (const m of text('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)) {
    rels[attr(m[0], 'Id')] = attr(m[0], 'Target');
  }

  const sheets = [];
  for (const m of workbook.matchAll(/<sheet\b[^>]*>/g)) {
    const target = rels[attr(m[0], 'r:id')];
    if (!target) continue;
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
    const xml = text(path);
    if (!xml) continue;
    sheets.push({ name: attr(m[0], 'name') || '', hidden: /state="(hidden|veryHidden)"/.test(m[0]), rows: readSheet(xml, shared, dateStyles, date1904) });
  }
  return sheets;
}

function readSheet(xml, shared, dateStyles, date1904) {
  const rows = [];
  let nextRow = 0;
  const data = (xml.match(/<sheetData\b[^>]*>([\s\S]*?)<\/sheetData>/) || [])[1] || '';
  for (const rm of data.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const r = attr(rm[1], 'r');
    const ri = r ? +r - 1 : nextRow;
    nextRow = ri + 1;
    const row = [];
    let nextCol = 0;
    for (const cm of (rm[2] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(cm[1], 'r');
      const ci = ref ? colIndex(ref) : nextCol;
      nextCol = ci + 1;
      const body = cm[2] || '';
      const t = attr(cm[1], 't');
      const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      let val = '';
      if (t === 's') val = shared[+v] ?? '';
      else if (t === 'inlineStr') val = itemText((body.match(/<is>([\s\S]*?)<\/is>/) || [])[1] || '');
      else if (t === 'b') val = v === '1' ? 'TRUE' : 'FALSE';
      else if (t === 'e') val = '';
      else if (t === 'str' || t === 'd') val = v === undefined ? '' : decode(v);
      else if (v !== undefined) {
        const n = Number(v);
        val = dateStyles[+(attr(cm[1], 's') || 0)] && Number.isFinite(n) ? serialToIso(n, date1904) : String(+n.toPrecision(12));
      }
      row[ci] = val;
    }
    rows[ri] = Array.from(row, (x) => x ?? '');
  }
  return Array.from(rows, (x) => x ?? []);
}
