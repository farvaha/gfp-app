import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { C, F } from '../constants/gfp';
import { getCredentials, unlock } from '../src/store';

/**
 * Owner app gate:
 * - no saved credentials  -> /login
 * - saved credentials     -> biometric unlock, then straight to the tabs
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const router = useRouter();
  const segments = useSegments();
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');

  async function boot() {
    const creds = await getCredentials();
    if (!creds) {
      setState('open');
      router.replace('/login');
      return;
    }
    const ok = await unlock();
    if (ok) {
      setState('open');
      if (segments[0] !== '(tabs)') router.replace('/(tabs)');
    } else {
      setState('locked');
    }
  }

  useEffect(() => {
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  }

  if (state === 'locked') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ color: C.ink, fontFamily: F.headingX, fontSize: 20 }}>GFP Admin locked</Text>
        <Pressable
          onPress={boot}
          style={{ backgroundColor: C.mint, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
        >
          <Text style={{ color: '#04211c', fontFamily: F.bodySemi, fontSize: 15 }}>Unlock</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
    </>
  );
}
