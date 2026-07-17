import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
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
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { RouteError } from '../components/RouteError';
import { C } from '../constants/gfp';

// Expo Router renders this if anything below the root throws while rendering,
// so a bad screen shows a recoverable card instead of closing the app.
export function ErrorBoundary(props: { error: Error; retry: () => void }) {
  return <RouteError {...props} />;
}

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { ready, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inTabs = segments[0] === '(tabs)';
    const inPreiva = segments[0] === 'preiva';
    const onWeb = segments[0] === 'web';
    // Logged out and trying to view tabs -> send to landing.
    if (!user && (inTabs || inPreiva)) router.replace('/login');
    // Logged in but stranded on the landing -> go to tabs.
    // (Do not auto-bounce off /web: the WebView handles its own redirect on login.)
    if (user && segments[0] === 'login' && !onWeb) router.replace('/(tabs)');
  }, [ready, user, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Gate />
    </AuthProvider>
  );
}
