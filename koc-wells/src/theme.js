export const colors = {
  bg: '#F4F6F8',
  card: '#FFFFFF',
  ink: '#14212B',
  muted: '#5F6E7A',
  line: '#DDE3E8',
  accent: '#0B5C7A',
  accentBg: '#E3F0F5',
  ok: '#1F7A4D',
  okBg: '#E6F4EC',
  bad: '#B3261E',
  badBg: '#FBE9E7',
  warn: '#9A6B00',
  warnBg: '#FFF4D6',
  chip: '#EAEFF3',
};

export const font = {
  title: 24,
  body: 16,
  small: 13,
  big: 22,
};

// Colour per status bucket (see STATUSES in data/wells.mjs).
export const statusColors = {
  producing: { fg: colors.ok, bg: colors.okBg },
  shutin: { fg: colors.bad, bg: colors.badBg },
  workover: { fg: colors.warn, bg: colors.warnBg },
  testing: { fg: '#5B3FA8', bg: '#EEE9FA' },
  injector: { fg: colors.accent, bg: colors.accentBg },
  drilling: { fg: '#7A4A12', bg: '#F6ECE0' },
  abandoned: { fg: colors.muted, bg: colors.chip },
  other: { fg: colors.muted, bg: colors.chip },
};

export const rtl = { textAlign: 'right', writingDirection: 'rtl' };
