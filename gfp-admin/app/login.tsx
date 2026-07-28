import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C, F, R } from '../constants/gfp';
import { saveCredentials, clearCredentials } from '../src/store';
import { Admin } from '../src/api';

/**
 * One-time connect screen. Sign in with your WordPress username and an
 * APPLICATION PASSWORD (not your real password):
 * wp-admin -> Users -> Profile -> Application Passwords -> add "GFP Admin".
 * The token can be revoked there at any time, which kills this app instantly.
 */
export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function connect() {
    const u = username.trim();
    const p = appPassword.trim();
    if (!u || !p) {
      Alert.alert('Missing details', 'Enter your WordPress username and an application password.');
      return;
    }
    setBusy(true);
    try {
      await saveCredentials(u, p);
      await Admin.test(); // proves the credentials + admin capability
      router.replace('/(tabs)');
    } catch (e: any) {
      await clearCredentials();
      Alert.alert(
        'Could not connect',
        String(e?.message || '') +
          '\n\nCheck: username is right, the application password was copied with its spaces, and the account is an administrator.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
          <Text style={st.brand}>GFP Admin</Text>
          <Text style={st.sub}>Owner controls for getfitplans.com</Text>

          <View style={st.card}>
            <Text style={st.label}>WordPress username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="farvaha"
              placeholderTextColor={C.muted}
              style={st.input}
            />
            <Text style={st.label}>Application password</Text>
            <TextInput
              value={appPassword}
              onChangeText={setAppPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              placeholderTextColor={C.muted}
              style={st.input}
            />
            <Text style={st.help}>
              Create one in wp-admin: Users {'\u2192'} Profile {'\u2192'} Application
              Passwords {'\u2192'} name it "GFP Admin" {'\u2192'} Add. Paste the generated
              code here. Your real password is never stored, and you can revoke this
              token any time.
            </Text>
            <Pressable onPress={connect} disabled={busy} style={({ pressed }) => [st.btn, (pressed || busy) && { opacity: 0.7 }]}>
              <Text style={st.btnTxt}>{busy ? 'Connecting\u2026' : 'Connect'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  body: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brand: { color: C.ink, fontFamily: F.headingX, fontSize: 28, textAlign: 'center' },
  sub: { color: C.muted, fontFamily: F.body, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  card: { backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 18 },
  label: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: C.card2, borderRadius: R.sm, color: C.ink, fontFamily: F.bodyMed,
    fontSize: 15, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: C.line,
  },
  help: { color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 18, marginTop: 12 },
  btn: { backgroundColor: C.mint, borderRadius: R.md, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  btnTxt: { color: '#04211c', fontFamily: F.bodySemi, fontSize: 15 },
});
