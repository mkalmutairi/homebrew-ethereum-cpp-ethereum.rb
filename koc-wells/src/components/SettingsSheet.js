import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { colors, font, rtl } from '../theme';

/** Where the wells come from: a link to a Google Sheet or any CSV file. */
export default function SettingsSheet({ visible, url, onSave, onClose, data }) {
  const [value, setValue] = useState(url);
  useEffect(() => { if (visible) setValue(url); }, [visible, url]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}><Text style={styles.close}>إغلاق</Text></Pressable>
          <Text style={styles.title}>مصدر البيانات</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>رابط جدول الآبار (Google Sheets أو ملف CSV)</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={() => onSave(value)}>
              <Text style={styles.btnText}>حفظ وتحديث</Text>
            </Pressable>
            {url ? (
              <Pressable style={[styles.btn, styles.ghost]} onPress={() => onSave('')}>
                <Text style={[styles.btnText, { color: colors.bad }]}>الرجوع للبيانات التجريبية</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.h}>كيف يتحدّث التطبيق يوميًا؟</Text>
          <Text style={styles.p}>
            التطبيق يقرأ الجدول من الرابط في كل مرة تفتحه، وعند سحب القائمة للأسفل، وعند الرجوع إليه بعد نصف ساعة.
            فيكفي أن يُحدَّث الجدول نفسه كل يوم (يدويًا أو بالتصدير من نظام الإنتاج) لتظهر الأرقام الجديدة في التطبيق مباشرة.
            وإذا لم يتوفر إنترنت تُعرض آخر بيانات محفوظة.
          </Text>

          <Text style={styles.h}>شكل الجدول</Text>
          <Text style={styles.p}>
            صف العناوين أولًا، ثم صف لكل بئر، أو صف لكل بئر في كل يوم (سجل يومي) فيظهر للبئر رسم لإنتاجه.
            العناوين المعروفة بالعربي أو الإنجليزي:
          </Text>
          <Text style={styles.code}>
            اسم البئر · الحقل · المنطقة · الحالة · إنتاج النفط · نسبة الماء · الغاز · الضغط · الخانق · المكمن · التاريخ · ملاحظات{'\n'}
            Well · Field · Area · Status · Oil (BOPD) · Water Cut · Gas · THP · Choke · Reservoir · Date · Notes
          </Text>
          <Text style={styles.p}>أي عمود آخر يظهر كما هو في تفاصيل البئر. ويكفي عمود الاسم وحده إن لم تتوفر بقية البيانات.</Text>

          <Text style={styles.h}>ربط Google Sheet</Text>
          <Text style={styles.p}>
            1. افتح الجدول ← مشاركة ← "أي شخص لديه الرابط" (عارض).{'\n'}
            أو: ملف ← مشاركة ← نشر على الويب ← اختر الورقة وصيغة CSV.{'\n'}
            2. انسخ الرابط والصقه هنا.
          </Text>
          <Text style={[styles.p, { color: colors.warn }]}>
            تنبيه: أي شخص لديه الرابط يستطيع قراءة الجدول. لا تضع فيه بيانات سرية إلا بموافقة الشركة.
          </Text>

          {data ? (
            <>
              <Text style={styles.h}>الأعمدة المقروءة حاليًا</Text>
              <Text style={styles.code}>{data.columns.join(' · ')}</Text>
              {data.unmapped.length ? <Text style={styles.p}>تظهر كتفاصيل إضافية: {data.unmapped.join('، ')}</Text> : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  title: { fontSize: font.title - 4, fontWeight: '700', color: colors.ink },
  close: { fontSize: font.body, color: colors.accent, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: font.body, fontWeight: '600', color: colors.ink, marginBottom: 8, ...rtl },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, fontSize: font.body, color: colors.ink, textAlign: 'left' },
  actions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  btn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  ghost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  btnText: { color: '#fff', fontWeight: '700', fontSize: font.body - 1 },
  h: { fontSize: font.body + 1, fontWeight: '700', color: colors.ink, marginTop: 22, marginBottom: 6, ...rtl },
  p: { fontSize: font.body - 1, color: colors.muted, lineHeight: 24, ...rtl },
  code: { fontSize: font.small, color: colors.ink, backgroundColor: colors.chip, borderRadius: 8, padding: 10, lineHeight: 22, marginVertical: 6, ...rtl },
});
