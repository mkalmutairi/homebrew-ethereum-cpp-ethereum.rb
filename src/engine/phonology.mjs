// Phonology: converts Nabati (Najdi/Gulf dialect) Arabic text into a sequence of
// "units". Every unit is one pronounced letter with the set of prosodic weights
// it may carry:  '/' = متحرك (consonant + short vowel),  'o' = ساكن (closes the
// syllable, also used for long vowels),  '' = silent (dropped in pronunciation).
// Each option carries a small cost so that the matcher prefers the most natural
// dialect reading when several readings fit the same meter.

export const FATHA = 'َ';
export const DAMMA = 'ُ';
export const KASRA = 'ِ';
export const SHADDA = 'ّ';
export const SUKUN = 'ْ';
export const DAGGER_ALIF = 'ٰ';
export const TANWIN = new Set(['ً', 'ٌ', 'ٍ']);
const SHORT_VOWELS = new Set([FATHA, DAMMA, KASRA]);

const SUN_LETTERS = new Set('تثدذرزسشصضطظلن');
const LONG_VOWEL_LETTERS = new Set('اىوي');
const HAMZA_LETTERS = new Set('أإؤئء');

// Words that begin with "ال" but where it is NOT the definite article.
const NOT_ARTICLE = new Set([
  'الى', 'الي', 'اليك', 'اليه', 'اليها', 'اليهم', 'اليكم', 'الين', 'الينا',
  'الا', 'الف', 'الفين', 'الم', 'اله', 'الهي', 'الهك', 'الهم',
]);

// Words whose initial alif is همزة وصل (dropped when linked to the previous word).
const WASL_PREFIXES = ['ابن', 'ابنة', 'است', 'اثن', 'اسم', 'امر', 'اضرب'];

// Words written with a "dagger alif" or other unwritten long vowel.
const SPELLING = {
  'الله': 'اللاه', 'اللهم': 'اللاهم', 'لله': 'لللاه', 'ولله': 'ولللاه', 'فلله': 'فلللاه',
  'هذا': 'هاذا', 'هذه': 'هاذه', 'هذي': 'هاذي', 'هذاك': 'هاذاك', 'هذيك': 'هاذيك',
  'هذول': 'هاذول', 'هذولا': 'هاذولا', 'هذيلا': 'هاذيلا', 'هذاكم': 'هاذاكم',
  'ذلك': 'ذالك', 'ذلكم': 'ذالكم', 'لكن': 'لاكن', 'لكنه': 'لاكنه', 'لكنها': 'لاكنها',
  'هؤلاء': 'هاؤلاء', 'الرحمن': 'الرحمان', 'اله': 'الاه', 'الاله': 'الالاه',
  'طه': 'طاها', 'السموات': 'السماوات', 'سموات': 'سماوات', 'داود': 'داوود',
  'اولئك': 'اولائك', 'يس': 'ياسين', 'الرحمان': 'الرحمان',
};

const ARABIC_CHAR = /[ء-غف-يٱًٰ-ْ]/;

export function normalize(text) {
  return (text || '')
    .replace(/[ـ]/g, '')          // tatweel
    .replace(/ٱ/g, 'ا')           // alif wasla
    .replace(/[یى]/g, (c) => (c === 'ی' ? 'ي' : 'ى'))
    .replace(/ک/g, 'ك')
    .replace(/ہ/g, 'ه')
    .replace(/آ/g, 'أا')
    .replace(/[^ء-غف-يًٰ-ْ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripDiacritics(word) {
  return word.replace(/[ً-ْٰ]/g, '');
}

// Parse a word into letters with their attached diacritics.
function parseLetters(word) {
  const letters = [];
  for (const ch of word) {
    if (SHORT_VOWELS.has(ch) || ch === SUKUN || ch === SHADDA || TANWIN.has(ch) || ch === DAGGER_ALIF) {
      const last = letters[letters.length - 1];
      if (!last) continue;
      if (SHORT_VOWELS.has(ch)) last.vowel = true;
      else if (ch === SUKUN) last.sukun = true;
      else if (ch === SHADDA) last.shadda = true;
      else if (TANWIN.has(ch)) last.tanwin = true;
      else if (ch === DAGGER_ALIF) last.dagger = true;
    } else if (ARABIC_CHAR.test(ch)) {
      letters.push({ ch, vowel: false, sukun: false, shadda: false, tanwin: false, dagger: false });
    }
  }
  return letters;
}

function applySpelling(word) {
  const bare = stripDiacritics(word);
  if (SPELLING[bare]) return SPELLING[bare];
  // allow one or two prefix letters (و، ف، ب، ك، ل، ت) before the special word
  for (let n = 1; n <= 2 && n < bare.length; n++) {
    const pre = bare.slice(0, n);
    const core = bare.slice(n);
    if (/^[وفبكلت]+$/.test(pre) && SPELLING[core]) {
      let fixed = SPELLING[core];
      // "لله" / "ولله": lam + article without alif
      if (pre.endsWith('ل') && fixed.startsWith('ال')) fixed = 'ل' + fixed.slice(1);
      return pre + fixed;
    }
  }
  return word;
}

/**
 * Split a word into {prefix, articleAlif, stem} when it carries the definite
 * article. Returns null when the word has no article.
 */
function detectArticle(letters) {
  const bare = letters.map((l) => l.ch).join('');
  let i = 0;
  // conjunction
  if ((bare[i] === 'و' || bare[i] === 'ف') && bare.length - i > 3) {
    const rest = bare.slice(i + 1);
    if (/^(ال|[بكهعت]ال|لل)/.test(rest)) i += 1;
  }
  // preposition / demonstrative prefix
  if ('بكهعت'.includes(bare[i]) && bare.slice(i + 1, i + 3) === 'ال' && bare.length - i > 4) {
    return { prefixEnd: i + 1, alifIndex: i + 1, stemStart: i + 3 };
  }
  if (bare[i] === 'ل' && bare[i + 1] === 'ل' && bare.length - i > 3) {
    return { prefixEnd: i + 1, alifIndex: -1, stemStart: i + 2 };
  }
  if (bare.slice(i, i + 2) === 'ال' && bare.length - i > 3) {
    const word = bare.slice(i);
    if (NOT_ARTICLE.has(word)) return null;
    return { prefixEnd: i, alifIndex: i, stemStart: i + 2 };
  }
  return null;
}

function wordStartsWithArticleAlif(word) {
  const letters = parseLetters(applySpelling(word));
  const art = detectArticle(letters);
  return !!(art && art.alifIndex >= 0);
}

/**
 * Convert one hemistich into units.
 * Each unit: { ch, wi (word index), word, opts: [[weight, cost], ...], synthetic }
 */
export function textToUnits(rawText) {
  const text = normalize(rawText);
  if (!text) return { words: [], units: [] };
  const words = text.split(' ');
  const units = [];

  words.forEach((word, wi) => {
    const fixed = applySpelling(word);
    const letters = parseLetters(fixed);
    if (!letters.length) return;
    const isFirstWord = units.length === 0;
    const isLastWord = wi === words.length - 1;
    const nextHasArticle = !isLastWord && wordStartsWithArticleAlif(words[wi + 1]);
    const art = detectArticle(letters);
    const bare = letters.map((l) => l.ch).join('');
    const isWasl = WASL_PREFIXES.some((p) => bare.startsWith(p));

    const push = (letter, opts, extra = {}) => {
      units.push({ ch: letter.ch, wi, word, opts, ...extra });
    };

    // Applies written diacritics on top of the default options.
    const withDiacritics = (letter, opts, k) => {
      let o = opts;
      if (letter.vowel) o = [['/', 0]];
      else if (letter.sukun) o = [['o', 0]];
      if (letter.shadda) {
        push(letter, [['o', 0]], { shadda: true });
        o = letter.sukun ? [['o', 0]] : [['/', 0]];
      }
      if (letter.tanwin) o = [['/', 0]];
      push(letter, o);
      if (letter.dagger) push({ ch: 'ا' }, [['o', 0]], { synthetic: true });
      if (letter.tanwin) push({ ch: 'ن' }, [['o', 0]], { synthetic: true, tanwin: true });
    };

    const defaultOpts = (letter, k, n) => {
      const ch = letter.ch;
      const isFinal = k === n - 1;
      const isInitial = k === 0;
      if (ch === 'ا') {
        if (isInitial) {
          if (isFirstWord) return [['/', 0]];
          return isWasl ? [['', 0], ['/', 0.5]] : [['/', 0], ['', 0.5]];
        }
        const opts = [['o', 0]];
        if (isFinal && letters[k - 1] && letters[k - 1].ch === 'و' && n >= 3) opts.push(['', 0]);
        else if (isFinal && nextHasArticle) opts.push(['', 0]);
        return opts;
      }
      if (ch === 'ى') {
        const opts = [['o', 0]];
        if (isFinal && nextHasArticle) opts.push(['', 0]);
        return opts;
      }
      if (ch === 'و' || ch === 'ي') {
        if (isInitial && n === 1) return [['/', 0], ['o', 0.2]];
        if (isInitial) return [['/', 0], ['o', 0.3]];
        const opts = [['o', 0], ['/', 0.3]];
        if (isFinal && nextHasArticle) opts.push(['', 0]);
        return opts;
      }
      if (HAMZA_LETTERS.has(ch)) {
        if (isInitial) return isFirstWord ? [['/', 0]] : [['/', 0], ['', 0.5]];
        if (isFinal) return [['o', 0], ['/', 0.3]];
        return [['/', 0], ['o', 0]];
      }
      // ordinary consonant
      if (isInitial && isFinal) return [['/', 0], ['o', 0.3]];
      if (isInitial) return [['/', 0], ['o', 0.5]];
      if (isFinal) return [['o', 0], ['/', 0.3]];
      return [['/', 0], ['o', 0]];
    };

    const n = letters.length;
    let k = 0;
    if (art) {
      // prefix letters before the article (و، ف، ب، ك، ل، ه، ع)
      for (; k < art.prefixEnd; k++) {
        const letter = letters[k];
        const opts = (letter.ch === 'و' || letter.ch === 'ف') && k === 0 && !isFirstWord
          ? [['/', 0], ['o', 0.3]]
          : [['/', 0]];
        withDiacritics(letter, opts, k);
      }
      if (art.alifIndex >= 0) {
        const alif = letters[art.alifIndex];
        const opts = units.length === 0 ? [['/', 0]] : [['', 0], ['/', 1]];
        push(alif, opts, { article: true });
      }
      const stemFirst = letters[art.stemStart];
      if (stemFirst && SUN_LETTERS.has(stemFirst.ch)) {
        // sun letter: the lam assimilates, the stem letter is doubled
        push(stemFirst, [['o', 0]], { article: true });
        withDiacritics({ ...stemFirst, shadda: false, sukun: false }, [['/', 0]], art.stemStart);
      } else {
        push(letters[art.stemStart - 1], [['o', 0]], { article: true });
        if (stemFirst) withDiacritics(stemFirst, n - 1 === art.stemStart ? [['o', 0], ['/', 0.3]] : [['/', 0]], art.stemStart);
      }
      k = art.stemStart + 1;
    }
    for (; k < n; k++) {
      withDiacritics(letters[k], defaultOpts(letters[k], k, n), k);
    }

    // Optional unwritten tanwin (very common in Nabati: راكبٍ، قلبٍ، مشتاقةٍ)
    const last = letters[n - 1];
    const eligible = !art && !isLastWord && n >= 3 && last && !last.tanwin &&
      !LONG_VOWEL_LETTERS.has(last.ch) && !HAMZA_LETTERS.has(last.ch);
    if (eligible) {
      units.push({ ch: 'ن', wi, word, opts: [['', 0], ['o', 0.6]], synthetic: true, tanwin: true, optional: true });
    }
  });

  return { words, units };
}
