import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { STATUSES } from '../data/wells.mjs';
import { colors, font, statusColors, rtl } from '../theme';
import { num, pct } from '../format';

/** Totals row plus one tappable count per status (tapping filters the list). */
export default function Summary({ summary, status, onStatus }) {
  const statuses = STATUSES.filter((s) => summary.byStatus[s.id]);
  if (summary.byStatus.other) statuses.push({ id: 'other', label: 'أخرى' });
  return (
    <View>
      <View style={styles.tiles}>
        <Tile label="عدد الآبار" value={num(summary.total)} />
        {summary.hasOil ? <Tile label="إنتاج النفط (برميل/يوم)" value={num(summary.oil)} /> : null}
        {summary.hasWater ? <Tile label="متوسط نسبة الماء" value={pct(summary.avgWater)} /> : null}
      </View>
      <View style={styles.chips}>
        {statuses.map((s) => {
          const c = statusColors[s.id] || statusColors.other;
          const on = status === s.id;
          return (
            <Pressable key={s.id} onPress={() => onStatus(on ? null : s.id)}
              style={[styles.chip, { backgroundColor: on ? c.fg : c.bg }]}>
              <Text style={[styles.chipText, { color: on ? '#fff' : c.fg }]}>{s.label} {summary.byStatus[s.id]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Tile({ label, value }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row-reverse', gap: 8 },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.line },
  tileValue: { fontSize: font.big, fontWeight: '700', color: colors.ink, ...rtl },
  tileLabel: { fontSize: font.small, color: colors.muted, marginTop: 2, ...rtl },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: font.small, fontWeight: '600' },
});
