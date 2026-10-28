// Turns a wells sheet (CSV, Arabic or English headers) into well records.
// Pure JavaScript so it can be tested from the command line.

/** Parse CSV text (RFC 4180: quoted fields, "" escapes, CRLF) into rows. */
export function parseCsv(text) {
  const src = String(text || '').replace(/^﻿/, '');
  // Sheets exported from Excel in Arabic locales often use ';' or tab.
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const delim = [',', ';', '\t']
    .map((d) => [d, firstLine.split(d).length])
    .sort((a, b) => b[1] - a[1])[0][0];

  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

// Header aliases, compared after normalizing (lowercase, no spaces/punctuation,
// unified alef/ya/ta marbuta).
const COLUMNS = {
  name: ['well', 'wellname', 'wellid', 'wellno', 'wellnumber', 'name', 'بئر', 'البئر', 'اسمالبئر', 'رقمالبئر', 'الاسم', 'اسم'],
  field: ['field', 'fieldname', 'reservoirfield', 'حقل', 'الحقل', 'اسمالحقل'],
  area: ['area', 'region', 'directorate', 'asset', 'منطقه', 'المنطقه', 'المديريه', 'القطاع'],
  status: ['status', 'wellstatus', 'state', 'حاله', 'الحاله', 'حالهالبئر', 'الوضع'],
  oil: ['oil', 'oilrate', 'bopd', 'oilbopd', 'netoil', 'oilproduction', 'production', 'انتاج', 'الانتاج', 'انتاجالنفط', 'النفط', 'برميليوم', 'برميل'],
  water: ['watercut', 'wc', 'wcut', 'bsw', 'نسبهالماء', 'الماء', 'نسبهالمياه', 'المياه'],
  gas: ['gas', 'gasrate', 'mmscfd', 'gasmmscfd', 'الغاز', 'غاز', 'انتاجالغاز'],
  gor: ['gor', 'gasoilratio', 'نسبهالغازالىالنفط'],
  thp: ['thp', 'whp', 'fthp', 'pressure', 'tubingpressure', 'wellheadpressure', 'الضغط', 'ضغط', 'ضغطراسالبئر'],
  choke: ['choke', 'chokesize', 'بيان', 'الخانق', 'فتحهالخانق'],
  reservoir: ['reservoir', 'formation', 'zone', 'المكمن', 'الطبقه', 'التكوين'],
  date: ['date', 'testdate', 'reportdate', 'updated', 'lastupdate', 'تاريخ', 'التاريخ', 'تاريخالتحديث', 'اخرتحديث'],
  lat: ['lat', 'latitude', 'خطالعرض'],
  lon: ['lon', 'lng', 'long', 'longitude', 'خطالطول'],
  notes: ['notes', 'note', 'remarks', 'comment', 'comments', 'ملاحظات', 'ملاحظه'],
};
const NUMERIC = new Set(['oil', 'water', 'gas', 'gor', 'thp', 'lat', 'lon']);

export function normalizeKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, (m) => m.replace(/[()]/g, '')) // "Oil (BOPD)" -> "oil bopd"
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[ً-ْـ]/g, '') // tashkeel, tatweel
    .replace(/[^a-z0-9؀-ۿ]/g, '');
}

function columnFor(header) {
  const k = normalizeKey(header);
  for (const [col, aliases] of Object.entries(COLUMNS)) if (aliases.includes(k)) return col;
  if (k.includes('date') || k.includes('تاريخ')) return 'date';
  // "Oil Rate (BOPD)", "Water Cut %" and similar. The well name is only
  // matched exactly, so "Well Type" does not take the name column.
  for (const [col, aliases] of Object.entries(COLUMNS)) {
    if (col !== 'name' && aliases.some((a) => a.length >= 3 && k.startsWith(a))) return col;
  }
  return null;
}

// Status buckets. Order matters: the first matching bucket wins.
export const STATUSES = [
  { id: 'shutin', label: 'مغلق', match: ['shutin', 'shut', 'closed', 'si', 'offline', 'down', 'inactive', 'notflowing', 'مغلق', 'متوقف', 'مقفل', 'غيرنشط', 'لايعمل'] },
  { id: 'producing', label: 'منتج', match: ['producing', 'flowing', 'online', 'active', 'open', 'esp', 'gaslift', 'منتج', 'يعمل', 'مفتوح', 'نشط'] },
  { id: 'workover', label: 'صيانة / إعادة تأهيل', match: ['workover', 'wo', 'maintenance', 'rig', 'repair', 'صيانه', 'تاهيل', 'حفاره', 'اصلاح'] },
  { id: 'testing', label: 'تحت الاختبار', match: ['test', 'testing', 'اختبار', 'فحص'] },
  { id: 'injector', label: 'حقن', match: ['inject', 'injector', 'injection', 'wi', 'حقن'] },
  { id: 'drilling', label: 'تحت الحفر', match: ['drilling', 'drill', 'new', 'حفر', 'جديد'] },
  { id: 'abandoned', label: 'مهجور', match: ['abandon', 'pa', 'suspended', 'مهجور', 'معلق', 'مهمل'] },
];
export const UNKNOWN_STATUS = { id: 'other', label: 'غير محدد' };

export function statusOf(raw) {
  const k = normalizeKey(raw);
  if (!k) return UNKNOWN_STATUS;
  for (const s of STATUSES) if (s.match.some((m) => k === m || (m.length >= 4 && k.includes(m)))) return s;
  return { id: 'other', label: String(raw).trim() };
}

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
const westernDigits = (s) => String(s).replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) - 0x0660) % 0x90));

export function toNumber(v) {
  if (v === null || v === undefined) return null;
  const s = westernDigits(v).replace(/٫/g, '.').replace(/[٬,\s%]/g, '');
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Parse a date cell (ISO, d/m/y as used in Kuwait, or a Sheets serial) to "YYYY-MM-DD". */
export function toIsoDate(v) {
  const s = westernDigits(v || '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    // Day first unless that is impossible (e.g. 10/28/2026).
    return +m[1] > 12 || +m[2] <= 12 ? iso(y, +m[2], +m[1]) : iso(y, +m[1], +m[2]);
  }
  if (/^\d{5}(\.\d+)?$/.test(s)) { // spreadsheet serial day number
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 86400000);
    return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
function iso(y, mo, d) {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Build wells from CSV text. A sheet may hold one row per well, or one row per
 * well per day (a daily log); rows are grouped by well name and the latest
 * dated row becomes the well's current reading, the rest its history.
 */
export function wellsFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('الملف لا يحتوي على بيانات (يلزم صف عناوين وصف واحد على الأقل).');
  const headers = rows[0].map((h) => h.trim());
  // Each known column is taken by the first header that maps to it; repeats
  // are kept as extra columns.
  const used = new Set();
  const cols = headers.map((h) => {
    const c = columnFor(h);
    if (!c || used.has(c)) return null;
    used.add(c);
    return c;
  });
  let nameIdx = cols.indexOf('name');
  if (nameIdx < 0) nameIdx = 0; // fall back to the first column
  cols[nameIdx] = 'name';
  const allRecs = [];

  const byName = new Map();
  for (const r of rows.slice(1)) {
    const name = (r[nameIdx] || '').trim();
    if (!name) continue;
    const rec = { name, extra: {} };
    headers.forEach((h, i) => {
      const val = (r[i] ?? '').trim();
      const col = cols[i];
      if (col === 'name') return;
      if (!col) { if (val) rec.extra[h] = val; return; }
      if (NUMERIC.has(col)) rec[col] = toNumber(val);
      else if (col === 'date') rec.date = toIsoDate(val);
      else rec[col] = val;
    });
    allRecs.push(rec);
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(rec);
  }

  // Water cut given as a fraction (0.35) rather than a percentage (35).
  const wcs = allRecs.map((x) => x.water).filter((x) => x !== null && x !== undefined);
  if (wcs.length && wcs.every((x) => x >= 0 && x <= 1) && wcs.some((x) => x > 0 && x < 1)) {
    for (const x of allRecs) if (x.water !== null && x.water !== undefined) x.water = Math.round(x.water * 1000) / 10;
  }

  const wells = [];
  for (const [name, recs] of byName) {
    recs.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const cur = recs[recs.length - 1];
    // Fill fields that are blank on the latest row from earlier rows.
    const merged = { ...cur, extra: { ...cur.extra } };
    for (let i = recs.length - 2; i >= 0; i--) {
      for (const k of ['field', 'area', 'reservoir', 'lat', 'lon']) {
        if ((merged[k] === undefined || merged[k] === null || merged[k] === '') && recs[i][k]) merged[k] = recs[i][k];
      }
    }
    wells.push({
      ...merged,
      id: name,
      status: statusOf(merged.status),
      rawStatus: merged.status || '',
      history: recs.filter((x) => x.date).map((x) => ({ date: x.date, oil: x.oil ?? null, water: x.water ?? null, thp: x.thp ?? null })),
    });
  }
  wells.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
  return { wells, columns: headers, unmapped: headers.filter((h, i) => !cols[i]) };
}

/** Totals for the dashboard. */
export function summarize(wells) {
  const byStatus = {};
  let oil = 0, gas = 0, waterSum = 0, waterN = 0, latest = null;
  for (const w of wells) {
    byStatus[w.status.id] = (byStatus[w.status.id] || 0) + 1;
    if (w.oil) oil += w.oil;
    if (w.gas) gas += w.gas;
    if (w.water !== null && w.water !== undefined) { waterSum += w.water; waterN++; }
    if (w.date && (!latest || w.date > latest)) latest = w.date;
  }
  const fields = [...new Set(wells.map((w) => w.field).filter(Boolean))].sort();
  return {
    total: wells.length, byStatus, oil, gas, avgWater: waterN ? waterSum / waterN : null, latest, fields,
    hasOil: wells.some((w) => w.oil !== undefined), hasWater: wells.some((w) => w.water !== undefined),
  };
}

/** Free-text + field + status filter. */
export function filterWells(wells, { query = '', field = null, status = null } = {}) {
  const q = normalizeKey(query);
  return wells.filter((w) => {
    if (field && w.field !== field) return false;
    if (status && w.status.id !== status) return false;
    if (!q) return true;
    return [w.name, w.field, w.area, w.reservoir, w.rawStatus, w.notes].some((v) => normalizeKey(v).includes(q));
  });
}
