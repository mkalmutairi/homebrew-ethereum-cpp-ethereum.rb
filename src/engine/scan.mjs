// Matcher: aligns the ambiguous unit sequence of a hemistich against every
// meter pattern using dynamic programming. Each unit picks one of its allowed
// weights; the produced weight string must not contain two consecutive سواكن
// (except at the very end of the hemistich, where an extra ساكن is tolerated).
// Insertions / deletions / substitutions of syllables are allowed at a large
// penalty so that an unmetered line still gets its closest meter and a list of
// the positions where it breaks.

import { textToUnits } from './phonology.mjs';
import { EXPANDED, METERS } from './meters.mjs';

const EDIT = 1000; // one prosodic error
const INF = Number.POSITIVE_INFINITY;

// Actions
const A_MATCH = 1, A_SUB = 2, A_EXTRA = 3, A_MISSING = 4, A_DROP = 5, A_COLLAPSE = 6;

function align(units, pattern) {
  const n = units.length;
  const m = pattern.length;
  const W = m + 1;
  const idx = (i, j, l) => ((i * W) + j) * 2 + l;
  const size = (n + 1) * W * 2;
  const score = new Float64Array(size).fill(INF);
  const backState = new Int32Array(size).fill(-1);
  const backAct = new Int8Array(size).fill(0);
  const backSym = new Int8Array(size).fill(0); // 0 none, 1 '/', 2 'o'

  let lastReal = n - 1;
  while (lastReal >= 0 && units[lastReal].optional) lastReal--;

  const relax = (from, i, j, l, s, act, sym) => {
    const to = idx(i, j, l);
    if (s < score[to]) {
      score[to] = s;
      backState[to] = from;
      backAct[to] = act;
      backSym[to] = sym;
    }
  };

  score[idx(0, 0, 1)] = 0; // l=1 forbids a leading ساكن
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      for (let l = 0; l < 2; l++) {
        const from = idx(i, j, l);
        const s = score[from];
        if (s === INF) continue;
        if (j < m) relax(from, i, j + 1, l, s + EDIT, A_MISSING, 0);
        if (i >= n) continue;
        const u = units[i];
        for (let k = 0; k < u.opts.length; k++) {
          const w = u.opts[k][0];
          const c = u.opts[k][1];
          if (w === '') {
            relax(from, i + 1, j, l, s + c, A_DROP, 0);
          } else if (w === 'o') {
            if (l === 1) {
              if (i >= lastReal) relax(from, i + 1, j, 1, s + c, A_COLLAPSE, 2);
              continue;
            }
            if (j < m && pattern[j] === 'o') relax(from, i + 1, j + 1, 1, s + c, A_MATCH, 2);
            if (j < m && pattern[j] === '/') relax(from, i + 1, j + 1, 1, s + c + EDIT, A_SUB, 2);
            relax(from, i + 1, j, 1, s + c + EDIT, A_EXTRA, 2);
          } else {
            if (j < m && pattern[j] === '/') relax(from, i + 1, j + 1, 0, s + c, A_MATCH, 1);
            if (j < m && pattern[j] === 'o') relax(from, i + 1, j + 1, 0, s + c + EDIT, A_SUB, 1);
            relax(from, i + 1, j, 0, s + c + EDIT, A_EXTRA, 1);
          }
        }
      }
    }
  }

  let end = idx(n, m, 1);
  let total = score[end];
  let endPenalty = 0;
  if (score[idx(n, m, 0)] + EDIT < total) {
    end = idx(n, m, 0);
    total = score[end];
    endPenalty = 1; // line ends on a متحرك
  }
  if (total === INF) return null;

  // backtrace
  const steps = [];
  let cur = end;
  while (cur !== idx(0, 0, 1) && backState[cur] >= 0) {
    const prev = backState[cur];
    const act = backAct[cur];
    const sym = backSym[cur] === 1 ? '/' : backSym[cur] === 2 ? 'o' : '';
    const pi = Math.floor(prev / (2 * W));
    const pj = Math.floor(prev / 2) % W;
    steps.push({ act, unit: act === A_MISSING ? -1 : pi, pat: (act === A_MATCH || act === A_SUB || act === A_MISSING) ? pj : -1, sym });
    cur = prev;
  }
  steps.reverse();
  const edits = Math.round(total / EDIT) + endPenalty;
  const cost = total - Math.round(total / EDIT) * EDIT;
  return { edits: Math.floor(total / EDIT) + endPenalty, cost, steps, endPenalty };
}

function describeSteps(steps, units, patternInfo, words) {
  // Group aligned steps into feet.
  const feet = patternInfo.feet.map((f) => ({ name: f.name, pattern: f.pattern, text: '', weights: '', ok: true, wordIds: new Set(), textUnits: [] }));
  const bounds = [];
  let acc = 0;
  patternInfo.feet.forEach((f) => { acc += f.pattern.length; bounds.push(acc); });
  const footOf = (pat) => { for (let k = 0; k < bounds.length; k++) if (pat < bounds[k]) return k; return bounds.length - 1; };

  const errors = [];
  let lastPat = 0;
  let curFoot = 0;
  let produced = ''; // full weight string produced by the text
  steps.forEach((st) => {
    if (st.pat >= 0) { lastPat = st.pat; curFoot = footOf(st.pat); }
    const foot = feet[Math.min(curFoot, feet.length - 1)];
    if (st.unit >= 0) {
      const u = units[st.unit];
      foot.textUnits.push({ ch: u.ch, wi: u.wi, sym: st.sym, act: st.act, synthetic: !!u.synthetic });
      foot.wordIds.add(u.wi);
      if (st.sym) produced += st.sym;
    }
    if (st.act === A_SUB || st.act === A_EXTRA || st.act === A_MISSING) {
      foot.ok = false;
      const wi = st.unit >= 0 ? units[st.unit].wi : (foot.textUnits.length ? foot.textUnits[foot.textUnits.length - 1].wi : -1);
      const word = wi >= 0 && words[wi] ? words[wi] : '';
      let msg;
      if (st.act === A_EXTRA) msg = `مقطع زائد${word ? ` في كلمة «${word}»` : ''}`;
      else if (st.act === A_MISSING) msg = `ينقص مقطع${word ? ` بعد كلمة «${word}»` : ' في الشطر'}`;
      else msg = `مقطع مخالف${word ? ` في كلمة «${word}»` : ''} (${st.sym === 'o' ? 'جاء ساكنًا والمطلوب متحرك' : 'جاء متحركًا والمطلوب ساكن'})`;
      errors.push({ wi, word, type: st.act === A_EXTRA ? 'extra' : st.act === A_MISSING ? 'missing' : 'sub', message: msg, foot: curFoot });
    }
  });

  feet.forEach((f) => {
    // Build a readable chunk: letters grouped per word, silent letters shown in brackets.
    let text = '';
    let lastWi = -1;
    f.textUnits.forEach((tu) => {
      if (tu.wi !== lastWi && text) text += ' ';
      lastWi = tu.wi;
      if (tu.synthetic && !tu.sym) return; // dropped optional tanwin: hide
      if (tu.act === A_DROP) text += ''; // silent letter, hide
      else if (tu.synthetic) text += tu.ch === 'ن' ? 'ـن' : tu.ch;
      else text += tu.ch;
    });
    f.text = text.replace(/\s+/g, ' ').trim();
    f.weights = f.textUnits.map((tu) => tu.sym).join('');
    f.words = [...f.wordIds];
    delete f.wordIds;
    delete f.textUnits;
  });
  return { feet, errors, produced };
}

const cache = new Map();

/**
 * Analyse one hemistich. Returns per-meter results sorted by (errors, cost).
 */
export function analyzeHemistich(text) {
  const key = (text || '').trim();
  if (cache.has(key)) return cache.get(key);
  const { words, units } = textToUnits(key);
  const result = { text: key, empty: units.length === 0, words, results: [], best: null, ok: false, alternatives: [] };
  if (result.empty) { cache.set(key, result); return result; }

  EXPANDED.forEach(({ meter, patterns }) => {
    let bestForMeter = null;
    patterns.forEach((p) => {
      // A pattern far longer than the text can never win: skip it.
      if (p.pattern.length - units.length > 6) return;
      const a = align(units, p.pattern);
      if (!a) return;
      const total = a.edits * EDIT + a.cost + p.cost;
      if (!bestForMeter || total < bestForMeter.total) {
        bestForMeter = { meter, patternInfo: p, alignment: a, total, edits: a.edits, cost: a.cost + p.cost };
      }
    });
    if (bestForMeter) result.results.push(bestForMeter);
  });
  result.results.sort((a, b) => a.total - b.total);
  result.results.forEach((r) => {
    const d = describeSteps(r.alignment.steps, units, r.patternInfo, words);
    r.feet = d.feet;
    r.errors = d.errors;
    r.produced = d.produced;
    if (r.alignment.endPenalty) r.errors.push({ wi: words.length - 1, word: words[words.length - 1], type: 'end', message: 'الشطر ينتهي بمتحرك، والمفترض أن ينتهي بساكن', foot: r.feet.length - 1 });
    delete r.alignment;
  });
  result.best = result.results[0] || null;
  result.ok = !!result.best && result.best.edits === 0;
  // Only show alternative meters whose reading is nearly as natural as the best one.
  result.alternatives = result.results
    .filter((r) => r.edits === 0 && r !== result.best && r.cost - result.best.cost <= 1.0)
    .slice(0, 2);
  if (cache.size > 200) cache.clear();
  cache.set(key, result);
  return result;
}

/**
 * Analyse a full verse (بيت) of two hemistichs. Both must scan on the same meter.
 */
export function analyzeVerse(first, second) {
  const h1 = analyzeHemistich(first);
  const h2 = analyzeHemistich(second);
  const verse = { h1, h2, ok: false, meter: null, edits: 0, message: '', r1: null, r2: null };
  if (h1.empty || h2.empty) {
    verse.message = 'أدخل الشطرين لتقييم البيت كاملًا.';
    return verse;
  }
  let best = null;
  METERS.forEach((m) => {
    const r1 = h1.results.find((r) => r.meter.id === m.id);
    const r2 = h2.results.find((r) => r.meter.id === m.id);
    if (!r1 || !r2) return;
    const total = r1.total + r2.total;
    if (!best || total < best.total) best = { meter: m, r1, r2, total, edits: r1.edits + r2.edits };
  });
  if (!best) { verse.message = 'تعذّر تحليل البيت.'; return verse; }
  verse.meter = best.meter;
  verse.r1 = best.r1;
  verse.r2 = best.r2;
  verse.edits = best.edits;
  verse.ok = best.edits === 0;
  if (verse.ok) {
    verse.message = `البيت موزون على بحر ${best.meter.name} (${best.meter.classical}).`;
  } else if (h1.ok && h2.ok) {
    verse.message = `كل شطر موزون على حدة، لكن الشطرين على بحرين مختلفين: الأول على ${h1.best.meter.name} والثاني على ${h2.best.meter.name}، فالبيت غير موزون.`;
  } else {
    const broken = [];
    if (!h1.ok) broken.push('الشطر الأول');
    if (!h2.ok) broken.push('الشطر الثاني');
    verse.message = `البيت غير موزون: الخلل في ${broken.join(' و')}. أقرب بحر له ${best.meter.name} (${best.meter.classical}).`;
  }
  return verse;
}

export { METERS };
