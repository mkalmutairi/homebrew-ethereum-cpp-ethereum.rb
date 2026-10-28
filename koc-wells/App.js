import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView, View, Text, TextInput, StyleSheet, Pressable, FlatList,
  RefreshControl, ActivityIndicator, AppState,
} from 'react-native';
import { summarize, filterWells } from './src/data/wells.mjs';
import { loadCached, sync, getUrl, setUrl } from './src/data/store';
import Summary from './src/components/Summary';
import WellRow from './src/components/WellRow';
import WellDetail from './src/components/WellDetail';
import SettingsSheet from './src/components/SettingsSheet';
import { REFRESH_AFTER_MS } from './src/config';
import { colors, font, rtl } from './src/theme';
import { dateLabel, daysAgo, timeLabel } from './src/format';

export default function App() {
  const [data, setData] = useState(null);
  const [url, setUrlState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [field, setField] = useState(null);
  const [status, setStatus] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const lastSync = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await sync();
      setData(fresh);
      setError(null);
      lastSync.current = Date.now();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Show the saved copy at once, then fetch today's sheet.
  useEffect(() => {
    (async () => {
      setUrlState(await getUrl());
      const cached = await loadCached();
      if (cached) setData(cached);
      refresh();
    })();
  }, [refresh]);

  // Pick up the day's update when the app is brought back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && Date.now() - lastSync.current > REFRESH_AFTER_MS) refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const saveUrl = async (u) => {
    await setUrl(u);
    setUrlState(u.trim());
    setShowSettings(false);
    setData(null);
    setField(null);
    setStatus(null);
    refresh();
  };

  const wells = data ? data.wells : [];
  const summary = useMemo(() => summarize(wells), [wells]);
  const shown = useMemo(() => filterWells(wells, { query, field, status }), [wells, query, field, status]);
  const age = daysAgo(summary.latest);

  const header = (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => setShowSettings(true)} hitSlop={10} style={styles.gear}>
          <Text style={styles.gearText}>الإعدادات</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>آبار نفط الكويت</Text>
          <Text style={styles.subtitle}>
            {summary.latest ? `بيانات يوم ${dateLabel(summary.latest)}` : 'التقرير اليومي للآبار'}
            {data && data.syncedAt ? ` · آخر مزامنة ${timeLabel(data.syncedAt)}` : ''}
          </Text>
        </View>
      </View>

      {data && data.source === 'sample' ? (
        <Pressable style={[styles.banner, { backgroundColor: colors.warnBg }]} onPress={() => setShowSettings(true)}>
          <Text style={[styles.bannerText, { color: colors.warn }]}>
            بيانات تجريبية للعرض فقط. اضغط هنا لربط جدول الآبار الحقيقي.
          </Text>
        </Pressable>
      ) : null}
      {error ? (
        <View style={[styles.banner, { backgroundColor: colors.badBg }]}>
          <Text style={[styles.bannerText, { color: colors.bad }]}>{error}</Text>
        </View>
      ) : null}
      {data && data.source !== 'sample' && age !== null && age > 1 ? (
        <View style={[styles.banner, { backgroundColor: colors.warnBg }]}>
          <Text style={[styles.bannerText, { color: colors.warn }]}>آخر قراءة في الجدول قبل {age} أيام — لم يُحدَّث الجدول بعد.</Text>
        </View>
      ) : null}

      {data ? <Summary summary={summary} status={status} onStatus={setStatus} /> : null}

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="ابحث باسم البئر أو الحقل…"
        placeholderTextColor={colors.muted}
        clearButtonMode="while-editing"
      />
      {summary.fields.length > 1 ? (
        <View style={styles.fields}>
          {[null, ...summary.fields].map((f) => (
            <Pressable key={f || 'all'} onPress={() => setField(f)} style={[styles.field, field === f && styles.fieldOn]}>
              <Text style={[styles.fieldText, field === f && { color: '#fff' }]}>{f || 'كل الحقول'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={styles.count}>{shown.length} من {wells.length} بئر</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {!data && loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /><Text style={styles.subtitle}>جارٍ تحميل بيانات الآبار…</Text></View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => <WellRow well={item} onPress={() => setSelected(item)} />}
          ListHeaderComponent={header}
          ListEmptyComponent={data ? <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 30 }]}>لا توجد آبار مطابقة.</Text> : null}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <WellDetail well={selected} onClose={() => setSelected(null)} />
      <SettingsSheet visible={showSettings} url={url} data={data} onSave={saveUrl} onClose={() => setShowSettings(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  title: { fontSize: font.title, fontWeight: '800', color: colors.ink, ...rtl },
  subtitle: { fontSize: font.small, color: colors.muted, marginTop: 4, ...rtl },
  gear: { backgroundColor: colors.accentBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  gearText: { color: colors.accent, fontWeight: '700', fontSize: font.small },
  banner: { borderRadius: 10, padding: 10, marginBottom: 10 },
  bannerText: { fontSize: font.small, fontWeight: '600', ...rtl },
  search: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, fontSize: font.body, color: colors.ink, marginTop: 12, ...rtl },
  fields: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, paddingTop: 10, paddingBottom: 4 },
  field: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  fieldOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  fieldText: { fontSize: font.small, color: colors.ink, fontWeight: '600' },
  count: { fontSize: font.small, color: colors.muted, marginVertical: 6, ...rtl },
});
