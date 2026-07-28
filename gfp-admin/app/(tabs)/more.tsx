import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R } from '../../constants/gfp';
import { clearCredentials } from '../../src/store';

function Row({ icon, label, note, onPress, danger }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.row, pressed && { opacity: 0.8 }]}>
      <Ionicons name={icon} size={20} color={danger ? C.orange : C.mint} />
      <Text style={[st.label, danger && { color: C.orange }]}>{label}</Text>
      {!!note && <Text style={st.note}>{note}</Text>}
      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </Pressable>
  );
}

export default function More() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={st.body}>
        <Text style={st.h1}>More</Text>

        <Text style={st.section}>App</Text>
        <Row icon="rocket" label="App releases" note="publish APK" onPress={() => router.push('/release')} />

        <Text style={st.section}>Full control</Text>
        <Row icon="settings" label="WordPress admin" note="everything" onPress={() => router.push('/wpadmin')} />

        <Text style={st.section}>Session</Text>
        <Row
          icon="log-out"
          label="Disconnect this app"
          danger
          onPress={() =>
            Alert.alert('Disconnect?', 'Removes the stored token from this phone. Also revoke it in wp-admin > Users > Profile > Application Passwords.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Disconnect', style: 'destructive', onPress: async () => { await clearCredentials(); router.replace('/login'); } },
            ])
          }
        />
        <Text style={st.tip}>
          Tip: if this phone is ever lost, revoke the "GFP Admin" application password
          in wp-admin (Users {'\u2192'} Profile) and this app is dead instantly.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  h1: { color: C.ink, fontFamily: F.headingX, fontSize: 22 },
  section: { color: C.muted, fontFamily: F.bodySemi, fontSize: 12, marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line,
    padding: 15, marginBottom: 8,
  },
  label: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14, flex: 1 },
  note: { color: C.muted, fontFamily: F.body, fontSize: 11 },
  tip: { color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 18, marginTop: 14 },
});
