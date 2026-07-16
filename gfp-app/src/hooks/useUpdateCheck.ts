import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const KEY = 'gfp_last_update_check';
const SIX_HOURS = 6 * 60 * 60 * 1000;

type Release = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  notes?: string;
};

export function useUpdateCheck() {
  useEffect(() => {
    (async () => {
      try {
        const last = Number(await AsyncStorage.getItem(KEY)) || 0;
        if (Date.now() - last < SIX_HOURS) return;
        await AsyncStorage.setItem(KEY, String(Date.now()));
        const info = await api<Release>('/gfp/v1/app-version', { timeoutMs: 12000 });
        const mine = Number(Constants.expoConfig?.android?.versionCode) || 1;
        if (info && Number(info.versionCode) > mine && info.apkUrl) {
          Alert.alert(
            `Update available — v${info.versionName}`,
            info.notes || 'A new version of GetFitPlans is ready.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Update now', onPress: () => Linking.openURL(info.apkUrl) },
            ]
          );
        }
      } catch {
        // Silent — update check must never block the app.
      }
    })();
  }, []);
}
