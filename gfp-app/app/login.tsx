import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { C, F, R } from '../constants/gfp';

type Mode = 'login' | 'register';

// Native landing + auth. First screen of the app when signed out.
// Everything happens in the app — no WebView, no PWA hand-off.
export default function Landing() {
  const router = useRouter();
  const { login, register, forgot } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const canSubmit =
    emailOk && password.length >= 6 && (mode === 'login' || name.trim().length > 0) && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name });
      }
      // The root Gate redirects to the tabs once `user` is set.
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = String(e?.message || 'Something went wrong. Please try again.');
      Alert.alert(mode === 'login' ? 'Could not sign in' : 'Could not create account', msg);
    } finally {
      setBusy(false);
    }
  }

  async function onForgot() {
    if (!emailOk) {
      Alert.alert('Enter your email', 'Type your account email first, then tap “Forgot password”.');
      return;
    }
    try {
      await forgot(email);
      Alert.alert('Check your email', 'If that address has an account, a reset link is on its way.');
    } catch (e: any) {
      Alert.alert('Could not send reset', String(e?.message || 'Please try again.'));
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brand}>GetFitPlans</Text>
            <Text style={styles.tagline}>Your plan. Your coach.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.segment}>
              <Pressable
                onPress={() => setMode('login')}
                style={[styles.segBtn, mode === 'login' && styles.segBtnOn]}
              >
                <Text style={[styles.segTxt, mode === 'login' && styles.segTxtOn]}>Log in</Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('register')}
                style={[styles.segBtn, mode === 'register' && styles.segBtnOn]}
              >
                <Text style={[styles.segTxt, mode === 'register' && styles.segTxtOn]}>
                  Create account
                </Text>
              </Pressable>
            </View>

            {mode === 'register' && (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={C.muted}
                autoCapitalize="words"
                style={styles.input}
              />
            )}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={C.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.input}
            />

            <View style={styles.pwRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPw}
                textContentType="password"
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                onSubmitEditing={submit}
              />
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} style={styles.showBtn}>
                <Text style={styles.showTxt}>{showPw ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.primary,
                (!canSubmit || pressed) && styles.pressed,
              ]}
            >
              <Text style={styles.primaryText}>
                {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
              </Text>
            </Pressable>

            {mode === 'login' && (
              <Pressable onPress={onForgot} hitSlop={8} style={styles.forgot}>
                <Text style={styles.forgotTxt}>Forgot password?</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            onPress={() => router.push('/quiz')}
          >
            <Text style={styles.secondaryText}>Build my plan — free</Text>
          </Pressable>
          <Text style={styles.trial}>14-day free Companion trial after your plan</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  logoWrap: {
    width: 84, height: 84, borderRadius: 24, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: C.line,
  },
  logo: { width: 60, height: 60 },
  brand: { color: C.ink, fontFamily: F.headingX, fontSize: 26, marginBottom: 6 },
  tagline: { color: C.muted, fontFamily: F.body, fontSize: 14, lineHeight: 20 },

  card: {
    backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line,
    padding: 16, marginTop: 8,
  },
  segment: {
    flexDirection: 'row', backgroundColor: C.card2, borderRadius: R.md, padding: 4, marginBottom: 14,
  },
  segBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: R.sm },
  segBtnOn: { backgroundColor: C.card },
  segTxt: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13 },
  segTxtOn: { color: C.ink, fontFamily: F.bodySemi },

  input: {
    backgroundColor: C.card2, borderRadius: R.sm, color: C.ink,
    fontFamily: F.bodyMed, fontSize: 15, paddingHorizontal: 14, paddingVertical: 13,
    marginBottom: 10, borderWidth: 1, borderColor: C.line,
  },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  showBtn: { paddingHorizontal: 10, paddingVertical: 12 },
  showTxt: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13 },

  primary: {
    backgroundColor: C.orange, borderRadius: R.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 14,
  },
  primaryText: { color: '#fff', fontFamily: F.bodySemi, fontSize: 16 },
  forgot: { alignItems: 'center', marginTop: 12 },
  forgotTxt: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13 },

  secondary: {
    backgroundColor: 'transparent', borderRadius: R.md, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: C.line, marginTop: 18,
  },
  secondaryText: { color: C.ink, fontFamily: F.bodyMed, fontSize: 15 },
  pressed: { opacity: 0.85 },
  trial: { color: C.muted, fontFamily: F.body, fontSize: 12, textAlign: 'center', marginTop: 12 },
});
