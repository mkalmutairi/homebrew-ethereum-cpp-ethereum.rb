import { analyzeHemistich, analyzeVerse } from '../scan.mjs';
import { textToUnits } from '../phonology.mjs';

const args = process.argv.slice(2);

function show(text) {
  const r = analyzeHemistich(text);
  console.log('\n=== ' + text);
  if (r.empty) { console.log('(empty)'); return r; }
  r.results.slice(0, 4).forEach((m, i) => {
    console.log(`${i === 0 ? '>' : ' '} ${m.meter.name} (${m.meter.classical}) errors=${m.edits} cost=${m.cost.toFixed(2)}  ${m.feet.map((f) => f.name).join(' ')}`);
    console.log('   ' + m.feet.map((f) => `[${f.text} ${f.weights}${f.ok ? '' : ' ✗'}]`).join(' '));
    if (m.errors.length) console.log('   errors: ' + m.errors.map((e) => e.message).join(' | '));
  });
  return r;
}

if (args.length) {
  args.forEach(show);
} else {
  const cases = [
    // [text, expected meter id or null for "unmetered"]
    ['سلامٍ على اللي في غلاهم قصايدي', 'hilali'],
    ['وشوقي لهم ما زال في القلب ساكني', 'hilali'],
    ['الأماكن كلها مشتاقة لك', 'samri'],
    ['يا مرحبا يا مرحبا يا مرحبا يا ولد', 'mashub'],
    ['يا مرحبا يا مرحبا يا مرحبا', 'rajad'],
    ['يا الله يا اللي ما تخيب رجاي', 'hijaini'],
    ['يا صاحبي وش لون أصبّر خفوقي', 'hijaini'],
  ];
  let fails = 0;
  cases.forEach(([text, expected]) => {
    const r = show(text);
    const got = r.ok ? r.best.meter.id : null;
    const pass = got === expected || (expected && r.results.some((m) => m.edits === 0 && m.meter.id === expected));
    if (!pass) fails++;
    console.log(pass ? '   PASS' : `   FAIL expected ${expected} got ${got}`);
  });
  const v = analyzeVerse(cases[0][0], cases[1][0]);
  console.log('\nVERSE: ' + v.message);
  if (!v.ok) fails++;
  const v2 = analyzeVerse(cases[0][0], cases[2][0]);
  console.log('VERSE(mixed): ' + v2.message);
  if (v2.ok) fails++;
  const bad = show('سلامٍ على اللي في غلاهم قصايدي كثير');
  if (bad.ok) fails++;
  console.log(fails ? `\n${fails} FAILURES` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
}
