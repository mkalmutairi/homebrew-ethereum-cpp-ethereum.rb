import AsyncStorage from '@react-native-async-storage/async-storage';
import { wellsFromCsv } from './wells.mjs';
import { sampleCsv } from './sample.mjs';
import { DEFAULT_DATA_URL } from '../config';

const KEY_URL = 'koc-wells:url';
const KEY_CACHE = 'koc-wells:cache';

/** Turn a normal Google Sheets link into its CSV export link. */
export function csvUrl(url) {
  const u = String(url || '').trim();
  const m = u.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  if (!m || /\/pub\b|output=csv|format=csv/.test(u)) return u;
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

function build(csv, source, syncedAt) {
  return { ...wellsFromCsv(csv), source, syncedAt };
}

/** Last data the device saw, so the app opens instantly and works offline. */
export async function loadCached() {
  try {
    const raw = await AsyncStorage.getItem(KEY_CACHE);
    if (!raw) return null;
    const { csv, url, syncedAt } = JSON.parse(raw);
    if (url !== (await getUrl())) return null;
    return build(csv, 'cache', syncedAt);
  } catch {
    return null;
  }
}

/**
 * Download the sheet and cache it. With no link set, returns the sample data.
 * Throws a readable Arabic message on failure; callers keep showing the cache.
 */
export async function sync() {
  const url = await getUrl();
  if (!url) return build(sampleCsv(), 'sample', Date.now());
  let res;
  try {
    res = await fetch(csvUrl(url), { headers: { 'Cache-Control': 'no-cache' } });
  } catch {
    throw new Error('تعذّر الاتصال بالإنترنت. تُعرض آخر بيانات محفوظة.');
  }
  if (!res.ok) throw new Error(`تعذّر تحميل الملف (رمز ${res.status}). تأكد أن الرابط مشارك للعرض.`);
  const csv = await res.text();
  if (/^\s*<(!doctype|html)/i.test(csv)) {
    throw new Error('الرابط يفتح صفحة وليس ملف بيانات. في Google Sheets اختر: مشاركة ← "أي شخص لديه الرابط" أو نشر على الويب بصيغة CSV.');
  }
  const data = build(csv, 'live', Date.now());
  await AsyncStorage.setItem(KEY_CACHE, JSON.stringify({ csv, url, syncedAt: data.syncedAt })).catch(() => {});
  return data;
}
