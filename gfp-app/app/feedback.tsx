import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Api } from '../src/api/client';
import { useAuth } from '../src/auth/AuthContext';
import { isAbusive } from '../src/lib/abuse';
import { C, F, R } from '../constants/gfp';

// Suggestion box for the developer. Abusive submissions are warned once,
// and a second attempt blocks the account - the server enforces the same
// rule independently, so this is not just a client-side gate.
export default function FeedbackScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [warned, setWarned] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const message = text.trim();
    if (message.length < 3) {
      Alert.alert('Write a little more', 'Tell us what to improve or build next.');
      return;
    }

    if (isAbusive(message)) {
      if (!warned) {
        setWarned(true);
        Alert.alert(
          'Please keep it respectful',
          'Using abusive language can get you banned from the platform. Edit your message and try again.'
        );
        return;
      }
      // Second attempt with abusive content: report the strike. The server
      // blocks the account and every later request is rejected.
      setBusy(true);
      try {
        const res: any = await Api.sendFeedback({ message, flagged_client: true });
        if (res?.banned) {
          Alert.alert(
            'Account blocked',
            'Your account has been blocked for repeated abusive language.',
            [{ text: 'OK', onPress: () => logout() }]
          );
          return;
        }
        Alert.alert(
          'Message not sent',
          'Your message was rejected for abusive language. This is your final warning.'
        );
      } catch (e: any) {
        const msg = String(e?.message || '');
        if (/blocked|banned/i.test(msg)) {
          Alert.alert('Account blocked', msg, [{ text: 'OK', onPress: () => logout() }]);
        } else {
          Alert.alert('Could not send', msg || 'Please try again.');
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const res: any = await Api.sendFeedback({ message });
      if (res?.banned) {
        Alert.alert(
          'Account blocked',
          'Your account has been blocked for repeated abusive language.',
          [{ text: 'OK', onPress: () => logout() }]
        );
        return;
      }
      if (res?.warning) {
        setWarned(true);
        Alert.alert(
          'Please keep it respectful',
          'Using abusive language can get you banned from the platform.'
        );
        return;
      }
      setSent(true);
      setText('');
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (/blocked|banned/i.test(msg)) {
        Alert.alert('Account blocked', msg, [{ text: 'OK', onPress: () => logout() }]);
      } else {
        Alert.alert('Could not send', msg || 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={st.back}>{'\u2190'} Back</Text>
          </Pressable>
          <Text style={st.title}>Suggest to the developer</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled">
          {sent ? (
            <View style={st.thanks}>
              <Text style={st.thanksTitle}>Thank you!</Text>
              <Text style={st.thanksTxt}>
                Your suggestion reached the developer. Every idea gets read.
              </Text>
              <Pressable onPress={() => setSent(false)} style={st.again}>
                <Text style={st.againTxt}>Send another</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={st.hint}>
                Found a bug? Want a feature? Tell us. Feedback goes straight to the developer.
              </Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Your suggestion or feedback\u2026"
                placeholderTextColor={C.muted}
                multiline
                textAlignVertical="top"
                style={st.input}
              />
              <Text style={st.rules}>
                Be constructive. Abusive language in any language leads to a warning, then a
                permanent block.
              </Text>
              <Pressable
                onPress={submit}
                disabled={busy}
                style={({ pressed }) => [st.send, (pressed || busy) && { opacity: 0.7 }]}
              >
                <Text style={st.sendTxt}>{busy ? 'Sending\u2026' : 'Send feedback'}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  back: { color: C.muted, fontFamily: F.bodyMed, fontSize: 14 },
  title: { color: C.ink, fontFamily: F.headingX, fontSize: 16 },
  body: { padding: 16, gap: 12 },
  hint: { color: C.muted, fontFamily: F.body, fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 140, backgroundColor: C.card2, borderRadius: R.md, color: C.ink,
    fontFamily: F.bodyMed, fontSize: 15, padding: 14,
    borderWidth: 1, borderColor: C.line,
  },
  rules: { color: C.muted, fontFamily: F.body, fontSize: 11, lineHeight: 16 },
  send: {
    backgroundColor: C.orange, borderRadius: R.md, paddingVertical: 15, alignItems: 'center',
  },
  sendTxt: { color: '#fff', fontFamily: F.bodySemi, fontSize: 15 },
  thanks: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  thanksTitle: { color: C.ink, fontFamily: F.headingX, fontSize: 20 },
  thanksTxt: { color: C.muted, fontFamily: F.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  again: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 10 },
  againTxt: { color: C.mint, fontFamily: F.bodyMed, fontSize: 14 },
});
