import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../../constants/gfp';
import { Admin } from '../../src/api';

const STATUS_COLOR: Record<string, string> = {
  completed: C.mint, processing: '#60A5FA', 'on-hold': C.orange,
  pending: C.muted, cancelled: C.orange, refunded: C.orange, failed: C.orange,
};

export default function Orders() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await Admin.orders();
      setRows(Array.isArray(r) ? r : []);
      setErr('');
    } catch (e: any) {
      setErr(String(e?.message || 'Could not load orders.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function actions(o: any) {
    // Status changes only - refunds and money movement stay in wp-admin.
    Alert.alert(
      'Order #' + o.id,
      (o.customer || '') + '\n' + (o.items || ''),
      [
        { text: 'Mark completed', onPress: () => setStatus(o.id, 'completed') },
        { text: 'Mark processing', onPress: () => setStatus(o.id, 'processing') },
        { text: 'Put on hold', onPress: () => setStatus(o.id, 'on-hold') },
        { text: 'Close', style: 'cancel' },
      ]
    );
  }

  async function setStatus(id: number, status: string) {
    try {
      await Admin.setOrderStatus(id, status);
      load();
    } catch (e: any) {
      Alert.alert('Could not update', String(e?.message || ''));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Text style={st.h1}>Orders</Text>
      {!!err && <Text style={st.err}>{err}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.muted} />}
        ListEmptyComponent={<Text style={st.empty}>No orders yet.</Text>}
        renderItem={({ item: o }) => (
          <Pressable onPress={() => actions(o)} style={({ pressed }) => [st.row, pressed && { opacity: 0.8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={st.title}>#{o.id} \u00b7 {o.customer || 'Guest'}</Text>
              <Text style={st.meta}>{o.date} \u00b7 {o.items}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={st.total}>{o.currency} {Number(o.total).toFixed(2)}</Text>
              <Text style={[st.status, { color: STATUS_COLOR[o.status] || C.muted }]}>{o.status}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  h1: { color: C.ink, fontFamily: F.headingX, fontSize: 22, paddingHorizontal: 16, paddingTop: 8 },
  err: { color: C.orange, fontFamily: F.bodyMed, fontSize: 13, paddingHorizontal: 16, paddingTop: 8 },
  empty: { color: C.muted, fontFamily: F.body, fontSize: 13, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line,
    padding: 14, marginBottom: 10,
  },
  title: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14 },
  meta: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 3 },
  total: { color: C.ink, fontFamily: F.headingX, fontSize: 15 },
  status: { fontFamily: F.bodyMed, fontSize: 11 },
});
