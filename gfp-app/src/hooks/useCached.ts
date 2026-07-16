import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

// Cache-first fetch: render cached data instantly, refresh from network in background.
export function useCached<T>(key: string, path: string) {
  const [data, setData] = useState<T | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = useRef(true);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const fresh = await api<T>(path);
      if (!live.current) return;
      setData(fresh);
      AsyncStorage.setItem(`cache:${key}`, JSON.stringify(fresh)).catch(() => {});
    } catch (e: any) {
      if (live.current) setError(e?.message || 'Failed to refresh.');
    } finally {
      if (live.current) setRefreshing(false);
    }
  }, [key, path]);

  useEffect(() => {
    live.current = true;
    AsyncStorage.getItem(`cache:${key}`)
      .then((v) => {
        if (live.current && v && data === null) setData(JSON.parse(v));
      })
      .catch(() => {});
    refresh();
    return () => {
      live.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, setData, refreshing, refresh, error };
}

export async function clearAllCache() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('cache:')));
}
