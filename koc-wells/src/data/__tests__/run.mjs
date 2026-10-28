// node src/data/__tests__/run.mjs            -> run the checks
// node src/data/__tests__/run.mjs file.xlsx  -> show how a file is read (.xlsx or .csv)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseCsv, wellsFromCsv, wellsFromRows, wellsFromRecords, mergeRecords, statusOf, toNumber, toIsoDate, summarize, filterWells } from '../wells.mjs';
import { rowsFromFile } from '../importer.mjs';
import { sampleCsv } from '../sample.mjs';

const fixture = (f) => readFileSync(fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url)));

if (process.argv[2]) {
  const { rows, sheet } = rowsFromFile(readFileSync(process.argv[2]));
  const { wells, columns, unmapped } = wellsFromRows(rows, { defaultDate: new Date().toISOString().slice(0, 10) });
  if (sheet !== null) console.log('Sheet:', sheet);
  console.log('Columns:', columns.join(' | '));
  console.log('Not recognised (shown as extra details):', unmapped.join(' | ') || '—');
  console.log(`${wells.length} wells`);
  for (const w of wells.slice(0, 15)) console.log(`  ${w.name}\t${w.field || ''}\t${w.status.label}\toil=${w.oil ?? ''}\twc=${w.water ?? ''}\t${w.date || ''}\t${w.history.length} days`);
  console.log(summarize(wells));
  process.exit(0);
}

let failed = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.log(`✗ ${name}\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(want)}`); }
  else console.log(`✓ ${name}`);
};

eq('csv quotes and CRLF', parseCsv('a,b\r\n"x, y","he said ""hi"""\r\n'), [['a', 'b'], ['x, y', 'he said "hi"']]);
eq('semicolon delimiter', parseCsv('a;b\n1;2'), [['a', 'b'], ['1', '2']]);
eq('arabic digits', toNumber('١٬٢٣٤٫٥'), 1234.5);
eq('percent', toNumber('35%'), 35);
eq('blank number', toNumber(''), null);
eq('iso date', toIsoDate('2026-10-28'), '2026-10-28');
eq('day-first date', toIsoDate('05/10/2026'), '2026-10-05');
eq('month-first when day > 12', toIsoDate('10/28/2026'), '2026-10-28');
eq('sheets serial date', toIsoDate('46323'), '2026-10-28');
eq('status shut-in', statusOf('Shut-in').id, 'shutin');
eq('status inactive is not producing', statusOf('Inactive').id, 'shutin');
eq('status arabic', statusOf('منتج').id, 'producing');
eq('status workover', statusOf('W/O').id, 'workover');
eq('status unknown keeps text', statusOf('Observation').label, 'Observation');

const ar = wellsFromCsv('اسم البئر,الحقل,الحالة,إنتاج النفط,نسبة الماء,التاريخ,المقاول\nBG-0001,برقان,منتج,1500,0.25,2026-10-27,ABC\nBG-0001,برقان,منتج,1600,0.30,2026-10-28,ABC\nMG-0002,المقوع,مغلق,,,2026-10-28,\n');
eq('arabic headers group daily rows', ar.wells.map((w) => [w.name, w.oil, w.water, w.history.length]), [['BG-0001', 1600, 30, 2], ['MG-0002', null, null, 1]]);
eq('unknown column kept', ar.wells[0].extra, { 'المقاول': 'ABC' });

const en = wellsFromCsv('Well Name,Well Type,Field,Oil Rate (BOPD),Production Date\nRA-10,Producer,Raudhatain,2100,28/10/2026\n');
eq('english headers, well type not the name', [en.wells[0].name, en.wells[0].oil, en.wells[0].date, en.wells[0].extra], ['RA-10', 2100, '2026-10-28', { 'Well Type': 'Producer' }]);

const names = wellsFromCsv('Wells\nA-1\nA-2\n');
eq('a bare list of names works', names.wells.map((w) => w.name), ['A-1', 'A-2']);

const sample = wellsFromCsv(sampleCsv(new Date('2026-10-28T08:00:00Z')));
const s = summarize(sample.wells);
eq('sample has 28 wells, 7 fields, latest today', [s.total, s.fields.length, s.latest], [28, 7, '2026-10-28']);
eq('filter by field', filterWells(sample.wells, { field: 'برقان' }).length, 4);
eq('search by name', filterWells(sample.wells, { query: 'bg-0100' }).map((w) => w.name), ['BG-0100']);

// Excel files: a report with a title above the table, on its second sheet.
for (const f of ['daily-report.xlsx', 'daily-report-libreoffice.xlsx']) {
  const { rows, sheet } = rowsFromFile(fixture(f));
  const x = wellsFromRows(rows, { defaultDate: '2026-10-01' });
  eq(`${f}: picks the wells sheet`, sheet, 'Daily Report');
  eq(`${f}: reads wells, skips title and total`, x.wells.map((w) => [w.name, w.field, w.status.id, w.oil, w.water, w.thp, w.date]), [
    ['BG-0012', 'برقان', 'producing', 1520, 25, 310, '2026-10-28'],
    ['BG-0013', 'برقان', 'shutin', 0, null, 45, '2026-10-27'],
    ['MG-0201', 'المقوع', 'producing', 2875.5, 3.1, 420, '2026-10-28'],
  ]);
  eq(`${f}: remarks read as notes, & decoded`, x.wells[1].notes, 'بانتظار الحفارة & الصيانة');
}
let xlsErr = '';
try { rowsFromFile(fixture('daily-report.xls')); } catch (e) { xlsErr = e.message; }
eq('old .xls asks to save as .xlsx', xlsErr.includes('.xlsx'), true);
eq('csv bytes are read too', rowsFromFile(new TextEncoder().encode('البئر,الحالة\nA-1,منتج')).rows, [['البئر', 'الحالة'], ['A-1', 'منتج']]);

// Daily imports without a date column build up history.
const day = (d, oil) => wellsFromRows([['Well', 'Oil'], ['A-1', String(oil)], ['A-2', '10']], { defaultDate: d }).records;
let log = mergeRecords([], day('2026-10-27', 100));
log = mergeRecords(log, day('2026-10-28', 120));
log = mergeRecords(log, day('2026-10-28', 130)); // re-import of the same day replaces it
const a1 = wellsFromRecords(log).find((w) => w.name === 'A-1');
eq('daily imports add up to history', [a1.oil, a1.date, a1.history.map((h) => h.oil)], [130, '2026-10-28', [100, 130]]);
eq('old days are pruned', mergeRecords(day('2026-01-01', 1), day('2026-10-28', 2)).map((r) => r.date), ['2026-10-28', '2026-10-28']);

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
