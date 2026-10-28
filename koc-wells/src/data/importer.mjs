// Turns an imported file (Excel .xlsx or CSV) into sheet rows.

import { strFromU8 } from 'fflate';
import { readXlsx } from './xlsx.mjs';
import { parseCsv, sheetScore } from './wells.mjs';

function isUtf8(u8) {
  for (let i = 0; i < u8.length; i++) {
    const b = u8[i];
    if (b < 0x80) continue;
    const n = b >= 0xf0 && b < 0xf8 ? 3 : b >= 0xe0 ? 2 : b >= 0xc2 && b < 0xe0 ? 1 : -1;
    if (n < 0 || n > 3) return false;
    for (let k = 1; k <= n; k++) if ((u8[i + k] & 0xc0) !== 0x80) return false;
    i += n;
  }
  return true;
}

/**
 * Read a file's bytes into { rows, sheet }. For a workbook, the sheet that
 * looks most like a wells table is used (so a cover or notes sheet is skipped).
 */
export function rowsFromFile(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (u8[0] === 0x50 && u8[1] === 0x4b) { // "PK": a zip, i.e. .xlsx
    const sheets = readXlsx(u8).filter((s) => s.rows.length);
    if (!sheets.length) throw new Error('ملف Excel فارغ.');
    const visible = sheets.filter((s) => !s.hidden);
    const pool = visible.length ? visible : sheets;
    let best = pool[0];
    let bestScore = -1;
    for (const s of pool) {
      const sc = sheetScore(s.rows);
      if (sc > bestScore || (sc === bestScore && s.rows.length > best.rows.length)) { best = s; bestScore = sc; }
    }
    return { rows: best.rows, sheet: best.name };
  }
  if (u8[0] === 0xd0 && u8[1] === 0xcf && u8[2] === 0x11 && u8[3] === 0xe0) {
    throw new Error('هذا ملف Excel قديم (.xls). افتحه في Excel واحفظه باسم ← "مصنف Excel (.xlsx)" ثم استورده.');
  }
  if (!isUtf8(u8)) {
    throw new Error('ترميز الملف غير مدعوم. احفظه من Excel بصيغة "مصنف Excel (.xlsx)" أو "CSV UTF-8".');
  }
  return { rows: parseCsv(strFromU8(u8)), sheet: null };
}
