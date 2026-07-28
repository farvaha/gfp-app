import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../../constants/gfp';
import { Admin } from '../../src/api';

export default function Feedback() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await Admin.feedback();
      setRows(Array.isArray(r) ? r : []);
      setErr('');
    } catch (e: any) {
      setErr(String(e?.message || 'Could not load feedback.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Text style={st.h1}>App feedback</Text>
      {!!err && <Text style={st.err}>{err}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.muted} />}
        ListEmptyComponent={<Text style={st.empty}>No feedback yet. When app users send suggestions, they appear here.</Text>}
        renderItem={({ item: f }) => (
          <View style={st.row}>
            <Text style={st.from}>{f.title}</Text>
            <Text style={st.msg}>{f.message}</Text>
            <Text style={st.date}>{f.date}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  h1: { color: C.ink, fontFamily: F.headingX, fontSize: 22, paddingHorizontal: 16, paddingTop: 8 },
  err: { color: C.orange, fontFamily: F.bodyMed, fontSize: 13, paddingHorizontal: 16, paddingTop: 8 },
  empty: { color: C.muted, fontFamily: F.body, fontSize: 13, textAlign: 'center', marginTop: 40, paddingHorizontal: 24, lineHeight: 20 },
  row: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 10 },
  from: { color: C.mint, fontFamily: F.bodySemi, fontSize: 12 },
  msg: { color: C.ink, fontFamily: F.body, fontSize: 14, lineHeight: 20, marginTop: 6 },
  date: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 8 },
});
