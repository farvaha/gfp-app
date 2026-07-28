import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import { useAuth } from '../src/auth/AuthContext';
import { C, F, R } from '../constants/gfp';

type Mode = 'login' | 'register';

// Mirrors the website register form - same options, same values.
const SPORTS = [
  'Gym / Bodybuilding',
  'Calisthenics / Yoga',
  'Soccer / Football',
  'Basketball',
  'Cricket',
  'Tennis',
  'Running',
  'Cycling',
  'Swimming',
  'Boxing / MMA',
];

function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.checkRow} hitSlop={6}>
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkmark}>{'\u2713'}</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{children}</Text>
    </Pressable>
  );
}

// Native landing + auth. First screen of the app when signed out.
// Everything happens in the app - no WebView, no PWA hand-off.
export default function Landing() {
  const router = useRouter();
  const { login, register, forgot } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [sport, setSport] = useState(SPORTS[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age18, setAge18] = useState(false);
  const [terms, setTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  // The server rejects passwords under 10 characters - validate the same
  // way here so nobody fills the whole form and then hits a server error.
  const pwOk = password.length >= 10;
  const registerOk = name.trim().length > 0 && age18 && terms;
  const canSubmit = emailOk && pwOk && (mode === 'login' || registerOk) && !busy;

  // Tell the user exactly what is missing instead of a silent dead button.
  function missingWhat(): string | null {
    if (!emailOk) return 'Enter a valid email address.';
    if (!pwOk) return 'Password must be at least 10 characters.';
    if (mode === 'register') {
      if (!name.trim()) return 'Enter your name.';
      if (!age18) return 'Please confirm you are 18 or older.';
      if (!terms) return 'Please accept the Terms and Privacy Policy.';
    }
    return null;
  }

  async function submit() {
    const missing = missingWhat();
    if (missing) {
      Alert.alert(mode === 'login' ? 'Almost there' : 'Almost there', missing);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          name,
          sport,
          age_confirmed: 1,
          terms_accepted: 1,
        });
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
      Alert.alert('Enter your email', 'Type your account email first, then tap "Forgot password".');
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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
                placeholder={mode === 'register' ? 'Password (min 10 characters)' : 'Password'}
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
            {mode === 'register' && password.length > 0 && !pwOk && (
              <Text style={styles.pwHint}>
                {10 - password.length} more character{10 - password.length === 1 ? '' : 's'} needed
              </Text>
            )}

            {mode === 'register' && (
              <>
                <Text style={styles.sportLabel}>Your sport</Text>
                <View style={styles.sportWrap}>
                  {SPORTS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setSport(s)}
                      style={[styles.sportChip, sport === s && styles.sportChipOn]}
                    >
                      <Text style={[styles.sportTxt, sport === s && styles.sportTxtOn]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>

                <CheckRow checked={age18} onToggle={() => setAge18((v) => !v)}>
                  I am 18 or older.
                </CheckRow>
                <CheckRow checked={terms} onToggle={() => setTerms((v) => !v)}>
                  I accept the Terms and Privacy Policy.
                </CheckRow>
              </>
            )}

            <Pressable
              onPress={submit}
              style={({ pressed }) => [
                styles.primary,
                (!canSubmit || pressed) && styles.pressed,
              ]}
            >
              <Text style={styles.primaryText}>
                {busy ? 'Please wait\u2026' : mode === 'login' ? 'Log in' : 'Create account'}
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
            <Text style={styles.secondaryText}>Build my plan \u2014 free</Text>
          </Pressable>
          <Text style={styles.trial}>14-day free Companion trial after your plan</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: 'center' },
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
  pwHint: { color: C.orange, fontFamily: F.body, fontSize: 12, marginTop: 4, marginBottom: 2 },

  sportLabel: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12, marginTop: 12, marginBottom: 8 },
  sportWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sportChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.pill,
    backgroundColor: C.card2, borderWidth: 1, borderColor: C.line,
  },
  sportChipOn: { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: C.orange },
  sportTxt: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12 },
  sportTxtOn: { color: C.orange, fontFamily: F.bodySemi },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.line,
    backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.orange, borderColor: C.orange },
  checkmark: { color: '#fff', fontSize: 14, fontFamily: F.bodySemi },
  checkLabel: { color: C.ink, fontFamily: F.bodyMed, fontSize: 13, flex: 1 },

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
