// node src/data/__tests__/run.mjs            -> run the checks
// node src/data/__tests__/run.mjs file.csv   -> show how a sheet is read
import { readFileSync } from 'node:fs';
import { parseCsv, wellsFromCsv, statusOf, toNumber, toIsoDate, summarize, filterWells } from '../wells.mjs';
import { sampleCsv } from '../sample.mjs';

if (process.argv[2]) {
  const { wells, columns, unmapped } = wellsFromCsv(readFileSync(process.argv[2], 'utf8'));
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

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
