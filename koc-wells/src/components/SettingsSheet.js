import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { colors, font, rtl } from '../theme';

/** Where the wells come from: an imported Excel file, or a link to a sheet. */
export default function SettingsSheet({ visible, url, onSave, onImport, onClear, onClose, data }) {
  const [value, setValue] = useState(url);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => { if (visible) { setValue(url); setConfirmClear(false); } }, [visible, url]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12}><Text style={styles.close}>إغلاق</Text></Pressable>
          <Text style={styles.title}>مصدر البيانات</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.h}>استيراد ملف Excel يوميًا</Text>
          <Text style={styles.p}>
            كل يوم اضغط "استيراد Excel" واختر ملف تقرير الآبار من الجهاز أو من الملفات المرسلة (البريد، واتساب، OneDrive…).
            يحفظ التطبيق قراءات كل يوم، فيظهر لكل بئر سجل إنتاجه ورسمه مع الأيام. استيراد ملف اليوم نفسه مرة ثانية يستبدل قراءاته.
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={onImport}>
              <Text style={styles.btnText}>استيراد Excel</Text>
            </Pressable>
            {data && data.source === 'import' ? (
              <Pressable style={[styles.btn, styles.ghost]} onPress={() => (confirmClear ? onClear() : setConfirmClear(true))}>
                <Text style={[styles.btnText, { color: colors.bad }]}>{confirmClear ? 'اضغط مرة ثانية للتأكيد' : 'حذف البيانات المستوردة'}</Text>
              </Pressable>
            ) : null}
          </View>
          {data && data.source === 'import' && data.fileName ? (
            <Text style={[styles.p, { marginTop: 8 }]}>آخر ملف: {data.fileName}{data.sheet ? ` (ورقة "${data.sheet}")` : ''}</Text>
          ) : null}

          <Text style={styles.h}>شكل الملف</Text>
          <Text style={styles.p}>
            جدول فيه صف عناوين ثم صف لكل بئر (لا بأس بوجود عنوان للتقرير فوق الجدول، أو أوراق أخرى في الملف — يختار التطبيق ورقة الآبار تلقائيًا).
            إذا لم يكن في الملف عمود تاريخ، تُسجَّل القراءات بتاريخ يوم الاستيراد. العناوين المعروفة بالعربي أو الإنجليزي:
          </Text>
          <Text style={styles.code}>
            اسم البئر · الحقل · المنطقة · الحالة · إنتاج النفط · نسبة الماء · الغاز · الضغط · الخانق · المكمن · التاريخ · ملاحظات{'\n'}
            Well · Field · Area · Status · Oil (BOPD) · Water Cut · Gas · THP · Choke · Reservoir · Date · Remarks
          </Text>
          <Text style={styles.p}>أي عمود آخر يظهر كما هو في تفاصيل البئر. الصيغ المدعومة: ‎.xlsx‎ و ‎.csv‎ (ملفات ‎.xls‎ القديمة تُحفظ أولًا بصيغة ‎.xlsx‎).</Text>

          {data ? (
            <>
              <Text style={styles.h}>الأعمدة المقروءة حاليًا</Text>
              <Text style={styles.code}>{data.columns.join(' · ')}</Text>
              {data.unmapped.length ? <Text style={styles.p}>تظهر كتفاصيل إضافية: {data.unmapped.join('، ')}</Text> : null}
            </>
          ) : null}

          <Text style={[styles.h, { marginTop: 32 }]}>بديل: رابط جدول مشترك</Text>
          <Text style={styles.p}>
            بدل الاستيراد اليدوي، يمكن ربط Google Sheet يحدّثه أحد يوميًا، فيقرؤه التطبيق تلقائيًا عند كل فتح.
            شارك الجدول بـ "أي شخص لديه الرابط" (عارض) والصق رابطه هنا. استيراد ملف لاحقًا يلغي الربط.
          </Text>
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
            <Pressable style={[styles.btn, styles.ghost]} onPress={() => onSave(value)}>
              <Text style={[styles.btnText, { color: colors.accent }]}>حفظ الرابط وتحديث</Text>
            </Pressable>
            {url ? (
              <Pressable style={[styles.btn, styles.ghost]} onPress={() => onSave('')}>
                <Text style={[styles.btnText, { color: colors.bad }]}>إلغاء الربط</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={[styles.p, { color: colors.warn, marginTop: 8 }]}>
            تنبيه: أي شخص لديه الرابط يستطيع قراءة الجدول. لا تضع فيه بيانات سرية إلا بموافقة الشركة.
          </Text>
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
  input: { marginTop: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, fontSize: font.body, color: colors.ink, textAlign: 'left' },
  actions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  btn: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  ghost: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  btnText: { color: '#fff', fontWeight: '700', fontSize: font.body - 1 },
  h: { fontSize: font.body + 1, fontWeight: '700', color: colors.ink, marginTop: 18, marginBottom: 6, ...rtl },
  p: { fontSize: font.body - 1, color: colors.muted, lineHeight: 24, ...rtl },
  code: { fontSize: font.small, color: colors.ink, backgroundColor: colors.chip, borderRadius: 8, padding: 10, lineHeight: 22, marginVertical: 6, ...rtl },
});
