import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, Linking } from 'react-native';
import { StatusBadge } from './WellRow';
import { colors, font, rtl } from '../theme';
import { num, pct, dateLabel } from '../format';

const FIELDS = [
  ['field', 'الحقل'], ['area', 'المنطقة'], ['reservoir', 'المكمن'],
  ['oil', 'إنتاج النفط (برميل/يوم)', (v) => num(v)],
  ['water', 'نسبة الماء', pct],
  ['gas', 'الغاز (مليون قدم³/يوم)', (v) => num(v, 2)],
  ['gor', 'نسبة الغاز للنفط', (v) => num(v)],
  ['thp', 'ضغط رأس البئر (psi)', (v) => num(v)],
  ['choke', 'فتحة الخانق'],
  ['date', 'تاريخ القراءة', dateLabel],
  ['notes', 'ملاحظات'],
];

export default function WellDetail({ well, onClose }) {
  if (!well) return null;
  const rows = FIELDS.filter(([k]) => well[k] !== undefined && well[k] !== '');
  const history = well.history.slice(-14);
  const max = Math.max(1, ...history.map((h) => h.oil || 0));
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}><Text style={styles.close}>إغلاق</Text></Pressable>
          <Text style={styles.title}>{well.name}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={{ alignItems: 'flex-end', marginBottom: 12 }}><StatusBadge status={well.status} /></View>

          <View style={styles.card}>
            {rows.map(([k, label, fmt]) => (
              <View key={k} style={styles.kv}>
                <Text style={styles.k}>{label}</Text>
                <Text style={styles.v}>{fmt ? fmt(well[k]) : String(well[k])}</Text>
              </View>
            ))}
            {Object.entries(well.extra).map(([k, v]) => (
              <View key={k} style={styles.kv}>
                <Text style={styles.k}>{k}</Text>
                <Text style={styles.v}>{v}</Text>
              </View>
            ))}
            {well.lat && well.lon ? (
              <Pressable onPress={() => Linking.openURL(`https://maps.google.com/?q=${well.lat},${well.lon}`)}>
                <Text style={styles.link}>عرض الموقع على الخريطة</Text>
              </Pressable>
            ) : null}
          </View>

          {history.length > 1 && history.some((h) => h.oil !== null) ? (
            <View style={styles.card}>
              <Text style={styles.section}>إنتاج النفط — آخر {history.length} يوم</Text>
              <View style={styles.chart}>
                {history.map((h) => (
                  <View key={h.date} style={styles.barCol}>
                    <Text style={styles.barVal}>{h.oil ? num(h.oil / 1000, 1) : '0'}</Text>
                    <View style={[styles.bar, { height: Math.max(2, ((h.oil || 0) / max) * 110) }]} />
                    <Text style={styles.barDate}>{h.date.slice(8)}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.hint}>الأرقام بالألف برميل/يوم، وتحت كل عمود يوم الشهر.</Text>

              <View style={[styles.kv, { marginTop: 12 }]}>
                <Text style={[styles.k, styles.th]}>التاريخ</Text>
                <Text style={[styles.v, styles.th]}>النفط · الماء · الضغط</Text>
              </View>
              {[...history].reverse().map((h) => (
                <View key={h.date} style={styles.kv}>
                  <Text style={styles.k}>{dateLabel(h.date)}</Text>
                  <Text style={styles.v}>{num(h.oil)} · {pct(h.water)} · {num(h.thp)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  title: { fontSize: font.title - 2, fontWeight: '700', color: colors.ink },
  close: { fontSize: font.body, color: colors.accent, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  kv: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line, gap: 12 },
  k: { fontSize: font.body - 1, color: colors.muted, ...rtl },
  v: { fontSize: font.body - 1, color: colors.ink, fontWeight: '600', flexShrink: 1, textAlign: 'left' },
  th: { fontWeight: '700', color: colors.ink },
  section: { fontSize: font.body, fontWeight: '700', color: colors.ink, marginBottom: 10, ...rtl },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 150 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '60%', backgroundColor: colors.accent, borderRadius: 3 },
  barVal: { fontSize: 9, color: colors.muted, marginBottom: 2 },
  barDate: { fontSize: 10, color: colors.muted, marginTop: 4 },
  hint: { fontSize: font.small - 1, color: colors.muted, marginTop: 6, ...rtl },
  link: { color: colors.accent, fontWeight: '600', marginTop: 10, ...rtl },
});
