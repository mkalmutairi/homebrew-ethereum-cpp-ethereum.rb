export const num = (n, digits = 0) =>
  n === null || n === undefined ? '—' : Number(n).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });

// Left-to-right marks keep "35.5%" from flipping to "%35.5" inside Arabic text.
export const pct = (n) => (n === null || n === undefined ? '—' : `\u200E${num(n, 1)}%\u200E`);

export function dateLabel(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${+d}/${+m}/${y}`;
}

/** Whole days between an ISO date and today (local time). */
export function daysAgo(iso, now = new Date()) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

export function timeLabel(ms) {
  if (!ms) return '—';
  const t = new Date(ms);
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  return `${t.getDate()}/${t.getMonth() + 1} ${hh}:${mm}`;
}
