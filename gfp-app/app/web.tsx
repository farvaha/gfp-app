import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebFlow from '../src/web/WebFlow';
import { useAuth } from '../src/auth/AuthContext';
import { C, F } from '../constants/gfp';
import { WEB } from '../src/api/endpoints';

// Hosts a getfitplans.com flow inside the app.
// mode="auth"  -> after login is detected, capture nonce and jump to native tabs.
// mode="page"  -> plain in-app browser (pricing, PDF view, etc.), no redirect.
export default function WebScreen() {
  const params = useLocalSearchParams<{ url?: string; uri?: string; mode?: string; title?: string }>();
  const router = useRouter();
  const { onWebAuth } = useAuth();
  const jumped = useRef(false);

  // Screens pass `url`; the landing historically passed `uri`. Accept both so
  // no caller can silently fall through to the Companion page.
  const uri = (params.url as string) || (params.uri as string) || WEB.companion;
  const mode = (params.mode as string) || 'page';

  const handleAuth = useCallback(
    async (p: { nonce: string | null; loggedIn: boolean; url: string }) => {
      if (mode !== 'auth' || jumped.current) return;
      if (p.loggedIn) {
        jumped.current = true;
        await onWebAuth(p.nonce);
        router.replace('/(tabs)');
      }
    },
    [mode, onWebAuth, router]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.bar}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {params.title || (mode === 'auth' ? 'GetFitPlans' : 'GetFitPlans')}
        </Text>
        <View style={styles.back} />
      </View>
      <WebFlow uri={uri} onAuth={handleAuth} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  bar: {
    height: 48, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: C.ink, fontFamily: F.bodySemi, fontSize: 16 },
});
