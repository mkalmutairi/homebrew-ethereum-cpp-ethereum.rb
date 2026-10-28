// Placeholder data shown until a real wells sheet is connected. The numbers
// are made up; the app labels them "بيانات تجريبية" everywhere they appear.

const FIELDS = [
  ['برقان', 'جنوب وشرق الكويت', 'BG'],
  ['المقوع', 'جنوب وشرق الكويت', 'MG'],
  ['الأحمدي', 'جنوب وشرق الكويت', 'AH'],
  ['الروضتين', 'شمال الكويت', 'RA'],
  ['الصابرية', 'شمال الكويت', 'SA'],
  ['المناقيش', 'غرب الكويت', 'MN'],
  ['أم قدير', 'غرب الكويت', 'UG'],
];
const STATUS = ['Producing', 'Producing', 'Producing', 'Producing', 'Shut-in', 'Workover', 'Testing'];

// Deterministic pseudo-random numbers so the sample looks the same every time.
function rng(seed) {
  let x = seed;
  return () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
}

/** CSV text in the same daily-log shape a real sheet would have. */
export function sampleCsv(today = new Date()) {
  const r = rng(42);
  const lines = ['Well,Field,Area,Status,Oil (BOPD),Water Cut %,Gas (MMSCFD),THP (psi),Choke,Date,Notes'];
  const days = 7;
  FIELDS.forEach(([field, area, code], fi) => {
    for (let n = 0; n < 4; n++) {
      const name = `${code}-${String(100 + fi * 37 + n * 11).padStart(4, '0')}`;
      const status = STATUS[Math.floor(r() * STATUS.length)];
      const base = 600 + Math.round(r() * 2400);
      const wc = Math.round(r() * 450) / 10;
      for (let d = days - 1; d >= 0; d--) {
        const dt = new Date(today.getTime() - d * 86400000);
        const date = dt.toISOString().slice(0, 10);
        const on = status === 'Producing' || (status === 'Testing' && d < 3);
        const oil = on ? Math.round(base * (0.93 + r() * 0.12)) : 0;
        const gas = on ? (oil * (0.45 + r() * 0.2) / 1000).toFixed(2) : 0;
        const thp = on ? Math.round(180 + r() * 420) : Math.round(r() * 60);
        const note = d === 0 && status === 'Workover' ? 'بانتظار الحفارة' : '';
        lines.push([name, field, area, d === 0 ? status : (status === 'Testing' && d >= 3 ? 'Shut-in' : status),
          oil, on ? (wc + r()).toFixed(1) : '', gas, thp, on ? `${32 + Math.floor(r() * 32)}/64` : '', date, note].join(','));
      }
    }
  });
  return lines.join('\n');
}
