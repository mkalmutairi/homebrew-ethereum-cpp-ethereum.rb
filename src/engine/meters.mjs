// Meter library. Every meter is described per hemistich (شطر) as a list of
// feet; every foot is a list of allowed variants (the first one is the base
// form, the rest are زحافات / ضروب). Weights: '/' متحرك, 'o' ساكن.

export const FEET = {
  'فعولن': '//o/o',
  'فعول': '//o/',
  'فعل': '//o',
  'فعْلن': '/o/o',
  'فعِلن': '///o',
  'فاعلن': '/o//o',
  'فاعلاتن': '/o//o/o',
  'فاعلات': '/o//o/',
  'فعلاتن': '///o/o',
  'مفاعيلن': '//o/o/o',
  'مفاعلن': '//o//o',
  'مفاعيل': '//o/o/',
  'مفاعلتن': '//o///o',
  'مستفعلن': '/o/o//o',
  'متفعلن': '//o//o',
  'مفتعلن': '/o///o',
  'متفاعلن': '///o//o',
  'مفعولات': '/o/o/o/',
  'مفعولن': '/o/o/o',
  'مستفعلاتن': '/o/o//o/o',
};

// Helper for a foot with base + variants.
const F = (...names) => names;

export const METERS = [
  {
    id: 'hilali',
    name: 'الهلالي',
    classical: 'الطويل',
    note: 'أشهر بحور الشعر النبطي وأكثرها استعمالًا.',
    feet: [F('فعولن', 'فعول'), F('مفاعيلن', 'مفاعلن'), F('فعولن', 'فعول'), F('مفاعيلن', 'مفاعلن')],
  },
  {
    id: 'mashub',
    name: 'المسحوب',
    classical: 'قريب من الرجز',
    note: 'ثاني أشهر البحور النبطية، وهو بحر القلطة والمحاورة.',
    feet: [F('مستفعلن', 'متفعلن', 'مفتعلن'), F('مستفعلن', 'متفعلن', 'مفتعلن'), F('مستفعلن', 'متفعلن', 'مفتعلن'), F('فاعلن', 'فعْلن', 'فاعلاتن')],
  },
  {
    id: 'hijaini',
    name: 'الهجيني',
    classical: 'السريع',
    note: 'بحر خفيف يُغنّى على ظهور الهجن، ويسمّيه بعضهم المسحوب القصير.',
    feet: [F('مستفعلن', 'متفعلن', 'مفتعلن'), F('مستفعلن', 'متفعلن', 'مفتعلن'), F('فاعلاتن', 'فاعلن', 'فعْلن')],
  },
  {
    id: 'rajad',
    name: 'الرجد',
    classical: 'الرجز',
    note: 'بحر العرضة والحماسة، سريع الإيقاع.',
    feet: [F('مستفعلن', 'متفعلن', 'مفتعلن'), F('مستفعلن', 'متفعلن', 'مفتعلن'), F('مستفعلن', 'متفعلن', 'مفتعلن', 'مفعولن')],
  },
  {
    id: 'rajad2',
    name: 'الرجد القصير (العرضة)',
    classical: 'مجزوء الرجز',
    note: 'شطر من تفعيلتين، يكثر في العرضة والأهازيج.',
    feet: [F('مستفعلن', 'متفعلن', 'مفتعلن'), F('مستفعلن', 'متفعلن', 'مفتعلن', 'مفعولن')],
  },
  {
    id: 'sakhri',
    name: 'الصخري',
    classical: 'الهزج',
    note: 'بحر شجيّ ينسب إلى الشاعر الصخري، يكثر في الغزل والحنين.',
    feet: [F('مفاعيلن', 'مفاعلن'), F('مفاعيلن', 'مفاعلن'), F('مفاعيلن', 'مفاعلن', 'مفاعيل')],
  },
  {
    id: 'sakhri2',
    name: 'الصخري القصير',
    classical: 'مجزوء الهزج',
    note: 'شطر من تفعيلتين.',
    feet: [F('مفاعيلن', 'مفاعلن'), F('مفاعيلن', 'مفاعلن', 'مفاعيل')],
  },
  {
    id: 'samri',
    name: 'السامري',
    classical: 'الرمل',
    note: 'بحر السامري والهجيني الطويل، يغنّى في السمرات.',
    feet: [F('فاعلاتن', 'فعلاتن'), F('فاعلاتن', 'فعلاتن'), F('فاعلاتن', 'فاعلن', 'فعْلن', 'فاعلات')],
  },
  {
    id: 'samri2',
    name: 'السامري القصير',
    classical: 'مجزوء الرمل',
    note: 'شطر من تفعيلتين، يكثر في الأهازيج والهجيني.',
    feet: [F('فاعلاتن', 'فعلاتن'), F('فاعلاتن', 'فاعلن', 'فعْلن')],
  },
  {
    id: 'marbou',
    name: 'المروبع',
    classical: 'الوافر',
    note: 'يأتي غالبًا معصوبًا: مفاعيلن مفاعيلن فعولن.',
    feet: [F('مفاعلتن', 'مفاعيلن'), F('مفاعلتن', 'مفاعيلن'), F('فعولن', 'فعول')],
  },
  {
    id: 'zuhairi',
    name: 'الزهيري',
    classical: 'البسيط',
    note: 'بحر الزهيري والموّال في الخليج والعراق.',
    feet: [F('مستفعلن', 'متفعلن', 'مفتعلن'), F('فاعلن', 'فعْلن'), F('مستفعلن', 'متفعلن', 'مفتعلن'), F('فاعلن', 'فعْلن', 'فعِلن')],
  },
  {
    id: 'zuhairi2',
    name: 'الزهيري القصير',
    classical: 'مجزوء البسيط',
    note: 'شطر من ثلاث تفعيلات.',
    feet: [F('مستفعلن', 'متفعلن'), F('فاعلن', 'فعْلن'), F('مستفعلن', 'متفعلن', 'مفعولن')],
  },
  {
    id: 'hida',
    name: 'الحداء',
    classical: 'المتقارب',
    note: 'بحر الحداء وحدو الإبل، متوازن الإيقاع.',
    feet: [F('فعولن', 'فعول'), F('فعولن', 'فعول'), F('فعولن', 'فعول'), F('فعولن', 'فعول', 'فعل', 'فعْلن')],
  },
  {
    id: 'hida2',
    name: 'الحداء القصير',
    classical: 'مجزوء المتقارب',
    note: 'شطر من ثلاث تفعيلات.',
    feet: [F('فعولن', 'فعول'), F('فعولن', 'فعول'), F('فعولن', 'فعول', 'فعل', 'فعْلن')],
  },
  {
    id: 'kamil',
    name: 'الكامل',
    classical: 'الكامل',
    note: 'قليل في النبطي، ويأتي غالبًا مضمرًا فيشبه الرجد.',
    feet: [F('متفاعلن', 'مستفعلن'), F('متفاعلن', 'مستفعلن'), F('متفاعلن', 'مستفعلن', 'فعِلن', 'فعْلن')],
  },
  {
    id: 'khafif',
    name: 'الخفيف',
    classical: 'الخفيف',
    note: 'فاعلاتن مستفعلن فاعلاتن.',
    feet: [F('فاعلاتن', 'فعلاتن'), F('مستفعلن', 'متفعلن'), F('فاعلاتن', 'فعلاتن', 'فاعلن')],
  },
  {
    id: 'mujtath',
    name: 'الشيباني',
    classical: 'المجتث المضاعف',
    note: 'مستفعلن فاعلاتن مكررة في الشطر.',
    feet: [F('مستفعلن', 'متفعلن'), F('فاعلاتن', 'فعلاتن'), F('مستفعلن', 'متفعلن'), F('فاعلاتن', 'فعلاتن', 'فاعلن')],
  },
  {
    id: 'mujtath2',
    name: 'المجتث',
    classical: 'المجتث',
    note: 'مستفعلن فاعلاتن.',
    feet: [F('مستفعلن', 'متفعلن'), F('فاعلاتن', 'فعلاتن', 'فاعلن')],
  },
  {
    id: 'madid',
    name: 'المديد',
    classical: 'المديد',
    note: 'فاعلاتن فاعلن فاعلاتن.',
    feet: [F('فاعلاتن', 'فعلاتن'), F('فاعلن', 'فعِلن'), F('فاعلاتن', 'فاعلن', 'فعِلن', 'فعْلن')],
  },
  {
    id: 'munsarih',
    name: 'المنسرح',
    classical: 'المنسرح',
    note: 'مستفعلن مفعولاتُ مفتعلن.',
    feet: [F('مستفعلن', 'متفعلن'), F('مفعولات'), F('مفتعلن', 'مستفعلن')],
  },
  {
    id: 'mudari',
    name: 'المضارع',
    classical: 'المضارع',
    note: 'مفاعيلن فاعلاتن، نادر.',
    feet: [F('مفاعيلن', 'مفاعيل'), F('فاعلاتن', 'فاعلن')],
  },
  {
    id: 'muqtadab',
    name: 'المقتضب',
    classical: 'المقتضب',
    note: 'مفعولاتُ مفتعلن، نادر.',
    feet: [F('مفعولات'), F('مفتعلن', 'مستفعلن')],
  },
  {
    id: 'mutadarik',
    name: 'الخبب',
    classical: 'المتدارك',
    note: 'فاعلن أربع مرات، ويأتي كثيرًا على فعْلن (الخبب).',
    feet: [F('فاعلن', 'فعْلن', 'فعِلن'), F('فاعلن', 'فعْلن', 'فعِلن'), F('فاعلن', 'فعْلن', 'فعِلن'), F('فاعلن', 'فعْلن', 'فعِلن')],
  },
  {
    id: 'mutadarik2',
    name: 'الخبب القصير',
    classical: 'مجزوء المتدارك',
    note: 'فاعلن ثلاث مرات.',
    feet: [F('فاعلن', 'فعْلن', 'فعِلن'), F('فاعلن', 'فعْلن', 'فعِلن'), F('فاعلن', 'فعْلن', 'فعِلن')],
  },
];

// Cost of choosing a non-base variant of a foot (زحاف): keeps base readings preferred.
const VARIANT_COST = 0.5;

/** Expand every meter into all concrete hemistich patterns. */
export function expandMeter(meter) {
  let combos = [{ pattern: '', feet: [], cost: 0 }];
  meter.feet.forEach((variants) => {
    const next = [];
    combos.forEach((c) => {
      variants.forEach((name, vi) => {
        const w = FEET[name];
        if (!w) throw new Error('Unknown foot ' + name);
        next.push({
          pattern: c.pattern + w,
          feet: [...c.feet, { name, pattern: w }],
          cost: c.cost + (vi === 0 ? 0 : VARIANT_COST),
        });
      });
    });
    combos = next;
  });
  // de-duplicate identical patterns, keeping the cheapest description
  const byPattern = new Map();
  combos.forEach((c) => {
    const prev = byPattern.get(c.pattern);
    if (!prev || prev.cost > c.cost) byPattern.set(c.pattern, c);
  });
  return [...byPattern.values()];
}

export const EXPANDED = METERS.map((m) => ({ meter: m, patterns: expandMeter(m) }));

export function meterById(id) {
  return METERS.find((m) => m.id === id);
}

export function baseFeetString(meter) {
  return meter.feet.map((v) => v[0]).join(' ');
}
