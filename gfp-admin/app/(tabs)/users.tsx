import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../../constants/gfp';
import { Admin } from '../../src/api';

export default function Users() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (q?: string) => {
    setRefreshing(true);
    try {
      const r = await Admin.users(q);
      setRows(Array.isArray(r) ? r : []);
      setErr('');
    } catch (e: any) {
      setErr(String(e?.message || 'Could not load users.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleBan(u: any) {
    if (u.admin) return;
    Alert.alert(
      u.banned ? 'Unban this user?' : 'Ban this user?',
      u.email + (u.banned ? '\nThey will be able to log in again, and their strikes reset.' : '\nThey will be blocked from logging in and from every API call.'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: u.banned ? 'Unban' : 'Ban',
          style: u.banned ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await Admin.ban(u.id, !u.banned);
              load(search || undefined);
            } catch (e: any) {
              Alert.alert('Failed', String(e?.message || ''));
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Text style={st.h1}>Users</Text>
      <View style={st.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or email\u2026"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          style={st.search}
          onSubmitEditing={() => load(search || undefined)}
          returnKeyType="search"
        />
        <Pressable onPress={() => load(search || undefined)} style={st.go}><Text style={st.goTxt}>Go</Text></Pressable>
      </View>
      {!!err && <Text style={st.err}>{err}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(u) => String(u.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(search || undefined)} tintColor={C.muted} />}
        renderItem={({ item: u }) => (
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{u.name || u.email}{u.admin ? '  \u2605 admin' : ''}</Text>
              <Text style={st.meta}>{u.email}</Text>
              <Text style={st.meta}>
                plan: {u.plan || 'free'} \u00b7 strikes: {u.strikes}
                {u.banned ? ' \u00b7 BANNED' : ''}
              </Text>
            </View>
            {!u.admin && (
              <Pressable onPress={() => toggleBan(u)} style={[st.banBtn, u.banned && { backgroundColor: 'rgba(21,194,165,0.15)', borderColor: C.mint }]}>
                <Text style={[st.banTxt, u.banned && { color: C.mint }]}>{u.banned ? 'Unban' : 'Ban'}</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  h1: { color: C.ink, fontFamily: F.headingX, fontSize: 22, paddingHorizontal: 16, paddingTop: 8 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  search: {
    flex: 1, backgroundColor: C.card2, borderRadius: R.sm, color: C.ink, fontFamily: F.bodyMed,
    fontSize: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.line,
  },
  go: { backgroundColor: C.card, borderRadius: R.sm, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, justifyContent: 'center' },
  goTxt: { color: C.ink, fontFamily: F.bodyMed, fontSize: 13 },
  err: { color: C.orange, fontFamily: F.bodyMed, fontSize: 13, paddingHorizontal: 16, paddingTop: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line,
    padding: 14, marginBottom: 10,
  },
  name: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14 },
  meta: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 2 },
  banBtn: { borderRadius: R.sm, borderWidth: 1, borderColor: C.orange, paddingHorizontal: 14, paddingVertical: 8 },
  banTxt: { color: C.orange, fontFamily: F.bodySemi, fontSize: 12 },
});
