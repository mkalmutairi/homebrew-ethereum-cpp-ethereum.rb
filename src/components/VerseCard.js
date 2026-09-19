import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme';

/** Overall verdict for the full verse (البيت). */
export default function VerseCard({ verse }) {
  if (!verse) return null;
  const pending = verse.h1.empty || verse.h2.empty;
  const bg = pending ? colors.warnBg : verse.ok ? colors.okBg : colors.badBg;
  const fg = pending ? colors.warn : verse.ok ? colors.ok : colors.bad;
  const icon = pending ? '…' : verse.ok ? '✓' : '✗';
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: fg }]}>
      <Text style={[styles.title, { color: fg }]}>{icon} حكم البيت</Text>
      <Text style={[styles.message, { color: fg }]}>{verse.message}</Text>
      {verse.ok && verse.meter && (
        <Text style={styles.feet}>{verse.r1.feet.map((f) => f.name).join(' ')}  ✦  {verse.r2.feet.map((f) => f.name).join(' ')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  title: {
    fontSize: font.body,
    fontWeight: '800',
    textAlign: 'right',
  },
  message: {
    fontSize: font.body,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 6,
    lineHeight: 26,
  },
  feet: {
    color: colors.muted,
    fontSize: font.small,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 6,
  },
});
