import React, { useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { analyzeHemistich, analyzeVerse } from './src/engine/scan.mjs';
import HemistichCard from './src/components/HemistichCard';
import VerseCard from './src/components/VerseCard';
import MetersSheet from './src/components/MetersSheet';
import { colors, font } from './src/theme';

const SEPARATOR = /\s*(?:\*+|\|+|\/\/+|\/|…|\.\.\.)\s*/;

const EXAMPLE = ['سلامٍ على اللي في غلاهم قصايدي', 'وشوقي لهم ما زال في القلب ساكني'];

export default function App() {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [showMeters, setShowMeters] = useState(false);
  const secondRef = useRef(null);

  // If a whole verse is pasted into the first box ("شطر * شطر"), split it.
  const onFirstChange = (t) => {
    const parts = t.split(SEPARATOR).filter(Boolean);
    if (parts.length >= 2) {
      setFirst(parts[0].trim());
      setSecond(parts.slice(1).join(' ').trim());
    } else {
      setFirst(t);
    }
  };

  const r1 = useMemo(() => analyzeHemistich(first), [first]);
  const r2 = useMemo(() => analyzeHemistich(second), [second]);
  const verse = useMemo(() => analyzeVerse(first, second), [first, second]);
  // Judge each hemistich against the verse's meter when there is one, else
  // against the other hemistich's meter.
  const ctx1 = verse.ok ? verse.meter.id : (r2.ok ? r2.best.meter.id : null);
  const ctx2 = verse.ok ? verse.meter.id : (r1.ok ? r1.best.meter.id : null);

  const clear = () => { setFirst(''); setSecond(''); };
  const fillExample = () => { setFirst(EXAMPLE[0]); setSecond(EXAMPLE[1]); };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>ميزان النبطي</Text>
            <Text style={styles.subtitle}>أدخل الشطر الأول ثم الثاني، ويخبرك التطبيق فورًا هل هو موزون وعلى أي بحر.</Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={() => setShowMeters(true)}>
              <Text style={styles.btnText}>البحور</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={fillExample}>
              <Text style={styles.btnText}>مثال</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={clear}>
              <Text style={[styles.btnText, { color: colors.bad }]}>مسح</Text>
            </Pressable>
          </View>

          <HemistichCard
            label="الشطر الأول (الصدر)"
            value={first}
            onChangeText={onFirstChange}
            result={r1}
            contextMeterId={ctx1}
            placeholder="اكتب الشطر الأول هنا…"
            onSubmitEditing={() => secondRef.current && secondRef.current.focus()}
          />
          <HemistichCard
            label="الشطر الثاني (العجز)"
            value={second}
            onChangeText={setSecond}
            result={r2}
            contextMeterId={ctx2}
            placeholder="اكتب الشطر الثاني هنا…"
            inputRef={secondRef}
            returnKeyType="done"
          />

          <VerseCard verse={verse} />

          <Text style={styles.footer}>
            يُقطَّع الشطر على نطق اللهجة: الحرف الأخير من الكلمة ساكن غالبًا، والتنوين يُنطق نونًا، وألف الوصل تسقط. إن اختلف نطقك عن القراءة المعروضة فاكتب الحركات (الشدّة والسكون والتنوين) لتقييد القراءة.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <MetersSheet visible={showMeters} onClose={() => setShowMeters(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  header: { marginBottom: 12, marginTop: Platform.OS === 'android' ? 24 : 4 },
  title: {
    fontSize: font.title,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: font.small,
    color: colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row-reverse',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.bad,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: font.small },
  footer: {
    color: colors.muted,
    fontSize: font.small,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
    marginTop: 4,
  },
});
