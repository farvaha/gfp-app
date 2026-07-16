import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../constants/gfp';
import { WEB } from '../src/api/endpoints';

// Draft B: branded landing. First screen of the app.
// Primary CTA -> Build My Plan quiz (web). Secondary -> Log in (web).
export default function Landing() {
  const router = useRouter();

  const go = (url: string) =>
    router.push({ pathname: '/web', params: { url, mode: 'auth' } });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
        <Text style={styles.tagline}>Built for you in 2 minutes.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          onPress={() => go(WEB.quiz)}
        >
          <Text style={styles.primaryText}>Build my plan — free</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          onPress={() => go(WEB.companion)}
        >
          <Text style={styles.secondaryText}>Log in</Text>
        </Pressable>

        <Text style={styles.trial}>14-day free Companion trial after your plan</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: {
    width: 88, height: 88, borderRadius: 24, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    borderWidth: 1, borderColor: C.line,
  },
  logo: { width: 64, height: 64 },
  brand: { color: C.ink, fontFamily: F.headingX, fontSize: 26, marginBottom: 8 },
  tagline: { color: C.muted, fontFamily: F.body, fontSize: 15, lineHeight: 22 },
  actions: { paddingBottom: 20 },
  primary: {
    backgroundColor: C.orange, borderRadius: R.md, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  primaryText: { color: '#fff', fontFamily: F.bodySemi, fontSize: 16 },
  secondary: {
    backgroundColor: C.card, borderRadius: R.md, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: C.line, marginBottom: 16,
  },
  secondaryText: { color: C.ink, fontFamily: F.bodyMed, fontSize: 15 },
  pressed: { opacity: 0.85 },
  trial: { color: C.muted, fontFamily: F.body, fontSize: 12, textAlign: 'center' },
});
