import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, font, statusColors, rtl } from '../theme';
import { num, pct } from '../format';

export function StatusBadge({ status }) {
  const c = statusColors[status.id] || statusColors.other;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{status.label}</Text>
    </View>
  );
}

/** Trend of oil rate against the previous day, as a small arrow. */
function trend(well) {
  const h = well.history;
  if (h.length < 2 || h[h.length - 1].oil === null || !h[h.length - 2].oil) return null;
  const change = ((h[h.length - 1].oil - h[h.length - 2].oil) / h[h.length - 2].oil) * 100;
  if (Math.abs(change) < 1) return null;
  return { up: change > 0, text: `${change > 0 ? '▲' : '▼'} ${num(Math.abs(change), 0)}%` };
}

export default function WellRow({ well, onPress }) {
  const t = trend(well);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={styles.top}>
        <Text style={styles.name}>{well.name}</Text>
        <StatusBadge status={well.status} />
      </View>
      {(well.field || well.area) ? (
        <Text style={styles.sub}>{[well.field, well.area].filter(Boolean).join(' · ')}</Text>
      ) : null}
      {(well.oil !== undefined || well.water !== undefined) ? (
        <View style={styles.stats}>
          <Text style={styles.stat}>النفط: <Text style={styles.statVal}>{num(well.oil)}</Text> ب/ي</Text>
          {t ? <Text style={[styles.stat, { color: t.up ? colors.ok : colors.bad }]}>{t.text}</Text> : null}
          {well.water !== undefined ? <Text style={styles.stat}>الماء: <Text style={styles.statVal}>{pct(well.water)}</Text></Text> : null}
          {well.thp !== undefined ? <Text style={styles.stat}>الضغط: <Text style={styles.statVal}>{num(well.thp)}</Text></Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  top: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: font.body + 1, fontWeight: '700', color: colors.ink },
  sub: { fontSize: font.small, color: colors.muted, marginTop: 4, ...rtl },
  stats: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  stat: { fontSize: font.small, color: colors.muted, ...rtl },
  statVal: { color: colors.ink, fontWeight: '600' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: font.small, fontWeight: '600' },
});
