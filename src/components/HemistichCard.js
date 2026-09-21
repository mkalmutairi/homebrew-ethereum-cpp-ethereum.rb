import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { colors, font } from '../theme';
import FeetView from './FeetView';

/**
 * One hemistich (شطر): input box, verdict line, and expandable scansion.
 */
export default function HemistichCard({ label, value, onChangeText, result, contextMeterId, placeholder, autoFocus, onSubmitEditing, inputRef, returnKeyType }) {
  const [open, setOpen] = useState(true);
  // When the other hemistich is already metered, judge this one against that
  // same meter so the errors shown are relative to the verse's meter.
  let best = result && result.best;
  let contextual = false;
  if (result && !result.empty && contextMeterId && best && best.meter.id !== contextMeterId) {
    const ctx = result.results.find((r) => r.meter.id === contextMeterId);
    // Show the reading on the verse's meter when it fits without errors, or
    // when this hemistich is broken (so the errors relate to that meter).
    if (ctx && (ctx.edits === 0 || !result.ok)) { best = ctx; contextual = true; }
  }
  const badWords = new Set(best ? best.errors.map((e) => e.wi) : []);
  const countText = (n) => (n === 1 ? 'خلل واحد' : n === 2 ? 'خللان' : `${n} أخطاء`);

  let verdict = null;
  if (result && !result.empty && best) {
    if (result.ok && contextual) {
      verdict = { ok: true, text: `✓ موزون على بحر ${best.meter.name} — ${best.meter.classical} (بحر البيت)` };
    } else if (result.ok) {
      const alt = result.alternatives.length ? ` (وقد يُقرأ على ${result.alternatives.map((a) => a.meter.name).join(' أو ')})` : '';
      verdict = { ok: true, text: `✓ موزون على بحر ${best.meter.name} — ${best.meter.classical}${alt}` };
    } else if (contextual) {
      const closest = result.best.meter.id !== contextMeterId ? ` — وأقرب بحر له وحده: ${result.best.meter.name}` : '';
      verdict = { ok: false, text: `✗ غير موزون على بحر ${best.meter.name} (بحر الشطر الآخر): ${countText(best.errors.length)}${closest}` };
    } else {
      verdict = { ok: false, text: `✗ غير موزون — أقرب بحر: ${best.meter.name} (${countText(best.errors.length)})` };
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType={returnKeyType || 'next'}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={false}
        textAlign="right"
      />
      {verdict ? (
        <View style={[styles.verdict, verdict.ok ? styles.verdictOk : styles.verdictBad]}>
          <Text style={[styles.verdictText, { color: verdict.ok ? colors.ok : colors.bad }]}>{verdict.text}</Text>
        </View>
      ) : (
        <Text style={styles.hint}>اكتب الشطر وسيظهر الحكم هنا مباشرة.</Text>
      )}

      {best && !result.ok && best.errors.length > 0 && (
        <View style={styles.words}>
          {result.words.map((w, i) => (
            <Text key={i} style={[styles.word, badWords.has(i) && styles.wordBad]}>{w}</Text>
          ))}
        </View>
      )}

      {best && !result.ok && (
        <View style={styles.errors}>
          {best.errors.map((e, i) => (
            <Text key={i} style={styles.errorLine}>• {e.message}</Text>
          ))}
        </View>
      )}

      {best && (
        <Pressable onPress={() => setOpen((o) => !o)} style={styles.toggle} hitSlop={8}>
          <Text style={styles.toggleText}>{open ? 'إخفاء التقطيع ▴' : 'عرض التقطيع ▾'}</Text>
        </Pressable>
      )}
      {best && open && (
        <View>
          <Text style={styles.feetTitle}>{best.feet.map((f) => f.name).join(' ')}</Text>
          <FeetView feet={best.feet} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: font.small,
    color: colors.muted,
    textAlign: 'right',
    marginBottom: 6,
    fontWeight: '700',
  },
  input: {
    fontSize: font.input,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bg,
    writingDirection: 'rtl',
  },
  hint: {
    color: colors.muted,
    fontSize: font.small,
    textAlign: 'right',
    marginTop: 8,
  },
  verdict: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  verdictOk: { backgroundColor: colors.okBg },
  verdictBad: { backgroundColor: colors.badBg },
  verdictText: {
    fontSize: font.body,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  words: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  word: {
    fontSize: font.body,
    color: colors.ink,
    marginLeft: 8,
    marginBottom: 4,
  },
  wordBad: {
    color: colors.bad,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  errors: { marginTop: 6 },
  errorLine: {
    color: colors.bad,
    fontSize: font.small,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  toggle: { marginTop: 10, alignSelf: 'flex-end' },
  toggleText: { color: colors.accent, fontSize: font.small, fontWeight: '700' },
  feetTitle: {
    color: colors.muted,
    fontSize: font.small,
    textAlign: 'right',
    marginTop: 8,
    writingDirection: 'rtl',
  },
});
