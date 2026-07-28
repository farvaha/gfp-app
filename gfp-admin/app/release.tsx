import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C, F, R } from '../constants/gfp';
import { Admin } from '../src/api';

/** See the live release and the latest CI build; publish it in one tap. */
export default function Release() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await Admin.release();
      setData(r);
      const inc = r?.incoming;
      if (inc && inc.apkUrl) {
        setUrl(String(inc.apkUrl));
        if (inc.versionCode) setCode(String(inc.versionCode));
      }
    } catch (e: any) {
      Alert.alert('Could not load', String(e?.message || ''));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function publish() {
    if (!name.trim() || !code.trim() || !url.trim()) {
      Alert.alert('Missing fields', 'Version name, version code and APK URL are required.');
      return;
    }
    Alert.alert('Publish update?', `v${name} (code ${code}) goes live for every user.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: async () => {
          setBusy(true);
          try {
            await Admin.publish({ versionName: name.trim(), versionCode: Number(code), apkUrl: url.trim(), notes: notes.trim() });
            Alert.alert('Published', 'Installed apps will prompt on next launch.');
            load();
          } catch (e: any) {
            Alert.alert('Failed', String(e?.message || ''));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  const cur = data?.current || {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={st.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={C.muted} />}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={st.back}>{'\u2190'} Back</Text>
        </Pressable>
        <Text style={st.h1}>App releases</Text>

        <View style={st.card}>
          <Text style={st.cardTitle}>Live now</Text>
          <Text style={st.big}>v{cur.versionName || '?'} (code {cur.versionCode || '?'})</Text>
          <Text style={st.meta} numberOfLines={2}>{cur.apkUrl || ''}</Text>
        </View>

        <View style={st.card}>
          <Text style={st.cardTitle}>Publish an update</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Version name e.g. 1.7.0" placeholderTextColor={C.muted} style={st.input} />
          <TextInput value={code} onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))} placeholder="Version code e.g. 80" placeholderTextColor={C.muted} keyboardType="number-pad" style={st.input} />
          <TextInput value={url} onChangeText={setUrl} placeholder="APK URL (https://getfitplans.com/...)" placeholderTextColor={C.muted} autoCapitalize="none" style={st.input} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Release notes" placeholderTextColor={C.muted} multiline style={[st.input, { minHeight: 90, textAlignVertical: 'top' }]} />
          <Pressable onPress={publish} disabled={busy} style={({ pressed }) => [st.btn, (pressed || busy) && { opacity: 0.7 }]}>
            <Text style={st.btnTxt}>{busy ? 'Publishing\u2026' : 'Publish update'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  body: { padding: 16, paddingBottom: 40 },
  back: { color: C.muted, fontFamily: F.bodyMed, fontSize: 14, marginBottom: 8 },
  h1: { color: C.ink, fontFamily: F.headingX, fontSize: 22, marginBottom: 12 },
  card: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, marginBottom: 14 },
  cardTitle: { color: C.muted, fontFamily: F.bodySemi, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  big: { color: C.mint, fontFamily: F.headingX, fontSize: 20 },
  meta: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 6 },
  input: {
    backgroundColor: C.card2, borderRadius: R.sm, color: C.ink, fontFamily: F.bodyMed,
    fontSize: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: C.line, marginBottom: 10,
  },
  btn: { backgroundColor: C.mint, borderRadius: R.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnTxt: { color: '#04211c', fontFamily: F.bodySemi, fontSize: 15 },
});
