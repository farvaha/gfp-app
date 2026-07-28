import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../../constants/gfp';
import { Admin } from '../../src/api';

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={st.stat}>
      <Text style={[st.statVal, accent && { color: C.mint }]}>{String(value)}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await Admin.stats());
      setErr('');
    } catch (e: any) {
      setErr(String(e?.message || 'Could not load stats.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const d = data || {};
  const money = (v: any) => '$' + Number(v || 0).toFixed(2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={st.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.muted} />}
      >
        <Text style={st.h1}>getfitplans.com</Text>
        <Text style={st.sub}>Pull down to refresh</Text>
        {!!err && <Text style={st.err}>{err}</Text>}

        <Text style={st.section}>Today</Text>
        <View style={st.grid}>
          <Stat label="Revenue" value={money(d.revenue_today)} accent />
          <Stat label="Orders" value={d.orders_today ?? '-'} />
          <Stat label="New signups" value={d.users_today ?? '-'} />
        </View>

        <Text style={st.section}>Last 7 days</Text>
        <View style={st.grid}>
          <Stat label="Revenue" value={money(d.revenue_week)} accent />
          <Stat label="Orders" value={d.orders_week ?? '-'} />
          <Stat label="Signups" value={d.users_week ?? '-'} />
        </View>

        <Text style={st.section}>Business</Text>
        <View style={st.grid}>
          <Stat label="Active trials" value={d.trials_active ?? '-'} />
          <Stat label="Paying members" value={d.paid_active ?? '-'} accent />
          <Stat label="Total users" value={d.users_total ?? '-'} />
        </View>

        <Text style={st.section}>App</Text>
        <View style={st.grid}>
          <Stat label="Live version" value={d.app_version || '-'} />
          <Stat label="Downloads (new flow)" value={d.redirect_downloads ?? '-'} />
          <Stat label="Feedback items" value={d.feedback_count ?? '-'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  h1: { color: C.ink, fontFamily: F.headingX, fontSize: 22 },
  sub: { color: C.muted, fontFamily: F.body, fontSize: 12, marginBottom: 6 },
  err: { color: C.orange, fontFamily: F.bodyMed, fontSize: 13, marginVertical: 8 },
  section: { color: C.muted, fontFamily: F.bodySemi, fontSize: 12, marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1, backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line,
    paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center',
  },
  statVal: { color: C.ink, fontFamily: F.headingX, fontSize: 17 },
  statLabel: { color: C.muted, fontFamily: F.body, fontSize: 10, marginTop: 4, textAlign: 'center' },
});
