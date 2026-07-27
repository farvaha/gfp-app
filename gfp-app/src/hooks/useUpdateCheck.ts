import { useEffect, useRef } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

// Update prompt. This used to only look once every six hours, which meant a
// freshly published build could sit unseen for most of a day. It now checks
// every time the app starts and every time it comes back to the foreground.
// A version you dismissed is remembered, so you are asked once per release -
// never nagged, never left behind.

const SKIP_KEY = 'gfp_update_skipped_code';

type Release = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  notes?: string;
};

export function useUpdateCheck() {
  const busy = useRef(false);

  useEffect(() => {
    let alive = true;

    async function check() {
      if (busy.current) return;
      busy.current = true;
      try {
        const info = await api<Release>('/gfp/v1/app-version', { timeoutMs: 12000 });
        if (!alive || !info || !info.apkUrl) return;

        const mine = Number(Constants.expoConfig?.android?.versionCode) || 1;
        const latest = Number(info.versionCode) || 0;
        if (latest <= mine) return;

        const skipped = Number(await AsyncStorage.getItem(SKIP_KEY)) || 0;
        if (skipped === latest) return; // already said 'later' for this one

        Alert.alert(
          `Update available - v${info.versionName}`,
          info.notes || 'A new version of GetFitPlans is ready.',
          [
            {
              text: 'Later',
              style: 'cancel',
              onPress: () => {
                AsyncStorage.setItem(SKIP_KEY, String(latest)).catch(() => {});
              },
            },
            { text: 'Update now', onPress: () => Linking.openURL(info.apkUrl) },
          ]
        );
      } catch {
        // Silent - an update check must never block the app.
      } finally {
        busy.current = false;
      }
    }

    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
}
