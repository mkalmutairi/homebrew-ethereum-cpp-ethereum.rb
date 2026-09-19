import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme';

/** Shows the scansion of a hemistich foot by foot (right-to-left). */
export default function FeetView({ feet }) {
  if (!feet || !feet.length) return null;
  return (
    <View style={styles.row}>
      {feet.map((f, i) => (
        <View key={i} style={[styles.foot, !f.ok && styles.footBad]}>
          <Text style={[styles.name, !f.ok && styles.textBad]}>{f.name}</Text>
          <Text style={styles.text}>{f.text || '—'}</Text>
          <Text style={[styles.weights, !f.ok && styles.textBad]}>{f.weights}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  foot: {
    backgroundColor: colors.chip,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 6,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 78,
  },
  footBad: {
    backgroundColor: colors.badBg,
    borderColor: colors.bad,
  },
  name: {
    fontSize: font.small,
    color: colors.accent,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  text: {
    fontSize: font.body,
    color: colors.ink,
    writingDirection: 'rtl',
    marginTop: 2,
  },
  weights: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: 2,
    letterSpacing: 1,
    writingDirection: 'ltr',
  },
  textBad: {
    color: colors.bad,
  },
});
