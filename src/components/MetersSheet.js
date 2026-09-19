import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { METERS, baseFeetString } from '../engine/meters.mjs';
import { colors, font } from '../theme';

/** Reference list of all supported meters. */
export default function MetersSheet({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}><Text style={styles.close}>إغلاق</Text></Pressable>
          <Text style={styles.title}>بحور الشعر النبطي</Text>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.intro}>
            يقطّع التطبيق الشطر على نطق اللهجة (بلا حركات إعراب)، ثم يقارنه بكل البحور التالية ويختار الأقرب. التفعيلات مكتوبة لشطر واحد، ويُقبل في كل بحر زحافاته وضروبه المعروفة.
          </Text>
          {METERS.map((m) => (
            <View key={m.id} style={styles.item}>
              <Text style={styles.name}>{m.name} <Text style={styles.classical}>({m.classical})</Text></Text>
              <Text style={styles.feet}>{baseFeetString(m)}</Text>
              {m.note ? <Text style={styles.note}>{m.note}</Text> : null}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { fontSize: font.title - 4, fontWeight: '800', color: colors.ink },
  close: { color: colors.accent, fontSize: font.body, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 40 },
  intro: {
    color: colors.muted,
    fontSize: font.small,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
    marginBottom: 12,
  },
  item: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontSize: font.body, fontWeight: '800', color: colors.ink, textAlign: 'right', writingDirection: 'rtl' },
  classical: { color: colors.muted, fontWeight: '400', fontSize: font.small },
  feet: { color: colors.accent, fontSize: font.body, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
  note: { color: colors.muted, fontSize: font.small, textAlign: 'right', writingDirection: 'rtl', marginTop: 4, lineHeight: 20 },
});
