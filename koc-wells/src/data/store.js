import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File as FsFile, Paths } from 'expo-file-system';
import { recordsFromRows, mergeRecords, wellsFromRecords, wellsFromCsv } from './wells.mjs';
import { rowsFromFile } from './importer.mjs';
import { sampleCsv } from './sample.mjs';
import { DEFAULT_DATA_URL } from '../config';

const KEY_URL = 'koc-wells:url';
const KEY_LINK_CACHE = 'koc-wells:link-cache';
const KEY_LOG = 'koc-wells:log';

// The imported log can grow to a few MB, beyond what AsyncStorage holds
// comfortably on Android, so on phones it is kept in a file.
const logFile = () => new FsFile(Paths.document, 'wells-log.json');
async function readLog() {
  try {
    if (Platform.OS === 'web') {
      const raw = await AsyncStorage.getItem(KEY_LOG);
      return raw ? JSON.parse(raw) : null;
    }
    const f = logFile();
    return f.exists ? JSON.parse(await f.text()) : null;
  } catch {
    return null;
  }
}
async function writeLog(log) {
  const json = JSON.stringify(log);
  if (Platform.OS === 'web') await AsyncStorage.setItem(KEY_LOG, json);
  else logFile().write(json);
}

export async function clearImported() {
  if (Platform.OS === 'web') await AsyncStorage.removeItem(KEY_LOG);
  else if (logFile().exists) logFile().delete();
}

/** Today's date on the device, as "YYYY-MM-DD". */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Turn a normal Google Sheets link into its CSV export link. */
export function csvUrl(url) {
  const u = String(url || '').trim();
  const m = u.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  if (!m || /\/pub\b|output=|format=/.test(u)) return u;
  const gid = (u.match(/[#?&]gid=(\d+)/) || [])[1] || '0';
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}

export async function getUrl() {
  const saved = await AsyncStorage.getItem(KEY_URL).catch(() => null);
  return saved !== null ? saved : DEFAULT_DATA_URL;
}

export async function setUrl(url) {
  await AsyncStorage.setItem(KEY_URL, String(url || '').trim());
}

function build(log, source) {
  return { ...log, wells: wellsFromRecords(log.records), source };
}

function sample() {
  return { ...wellsFromCsv(sampleCsv()), source: 'sample', syncedAt: Date.now() };
}

/** What the app shows at launch, before any network: saved link data or imported files. */
export async function loadSaved() {
  const url = await getUrl();
  if (url) {
    try {
      const cache = JSON.parse(await AsyncStorage.getItem(KEY_LINK_CACHE));
      return cache && cache.url === url ? build(cache, 'cache') : null;
    } catch {
      return null;
    }
  }
  const log = await readLog();
  return log && log.records.length ? build(log, 'import') : null;
}

/**
 * Refresh: download the linked sheet if there is a link, otherwise show the
 * imported files (or sample data before the first import). Throws a readable
 * Arabic message on failure; callers keep showing what they have.
 */
export async function sync() {
  const url = await getUrl();
  if (!url) {
    const log = await readLog();
    return log && log.records.length ? build(log, 'import') : sample();
  }
  let res;
  try {
    res = await fetch(csvUrl(url), { headers: { 'Cache-Control': 'no-cache' } });
  } catch {
    throw new Error('تعذّر الاتصال بالإنترنت. تُعرض آخر بيانات محفوظة.');
  }
  if (!res.ok) throw new Error(`تعذّر تحميل الملف (رمز ${res.status}). تأكد أن الرابط مشارك للعرض.`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (/^\s*<(!doctype|html)/i.test(String.fromCharCode(...bytes.slice(0, 64)))) {
    throw new Error('الرابط يفتح صفحة وليس ملف بيانات. في Google Sheets اختر: مشاركة ← "أي شخص لديه الرابط" أو نشر على الويب بصيغة CSV.');
  }
  const { rows, sheet } = rowsFromFile(bytes);
  const cache = { ...recordsFromRows(rows, { defaultDate: today() }), url, sheet, syncedAt: Date.now() };
  await AsyncStorage.setItem(KEY_LINK_CACHE, JSON.stringify(cache)).catch(() => {});
  return build(cache, 'live');
}

/** Bytes of a file chosen with expo-document-picker. */
async function readPicked(asset) {
  if (asset.file) return new Uint8Array(await asset.file.arrayBuffer()); // web
  return new FsFile(asset.uri).bytes();
}

/**
 * Add a picked Excel/CSV file to the saved wells. Each well's reading is filed
 * under the file's date column, or today if the file has none, so importing
 * the daily report every day builds up each well's history.
 */
export async function importFile(asset) {
  const { rows, sheet } = rowsFromFile(await readPicked(asset));
  const parsed = recordsFromRows(rows, { defaultDate: today() });
  const old = await readLog();
  const log = {
    records: mergeRecords(old ? old.records : [], parsed.records),
    columns: parsed.columns,
    unmapped: parsed.unmapped,
    fileName: asset.name || '',
    sheet,
    syncedAt: Date.now(),
  };
  await writeLog(log);
  await setUrl(''); // importing switches the app to imported files
  const dates = parsed.records.map((r) => r.date).filter(Boolean).sort();
  return { data: build(log, 'import'), count: new Set(parsed.records.map((r) => r.name)).size, date: dates[dates.length - 1] || null };
}
