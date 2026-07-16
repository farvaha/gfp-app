import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { Api, setNonce, loadNonce, setUnauthorizedHandler } from '../api/client';
import { SITE } from '../api/endpoints';
import type { Me } from '../api/endpoints';
import { clearAllCache } from '../hooks/useCached';

const USER_KEY = 'gfp_me';

type AuthState = {
  ready: boolean;
  user: Me | null;
  // Called by the WebView layer once a login/signup completes and a nonce is captured.
  onWebAuth: (nonce: string | null) => Promise<void>;
  // Re-validate the current cookie session; returns the user or null.
  refresh: () => Promise<Me | null>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  ready: false,
  user: null,
  onWebAuth: async () => {},
  refresh: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<Me | null>(null);

  const persist = useCallback(async (me: Me | null) => {
    setUser(me);
    if (me) await AsyncStorage.setItem(USER_KEY, JSON.stringify(me));
    else await AsyncStorage.removeItem(USER_KEY);
  }, []);

  const refresh = useCallback(async (): Promise<Me | null> => {
    try {
      const me = await Api.me();
      await persist(me);
      return me;
    } catch {
      await persist(null);
      return null;
    }
  }, [persist]);

  const logout = useCallback(async () => {
    try { await Api.logout(); } catch {}
    try { await CookieManager.clearAll(true); } catch {}
    try { await CookieManager.clearAll(false); } catch {}
    await setNonce(null);
    await clearAllCache();
    await persist(null);
  }, [persist]);

  const onWebAuth = useCallback(async (n: string | null) => {
    if (n) await setNonce(n);
    // Cookie is already in the shared jar via the WebView; confirm the session.
    await refresh();
  }, [refresh]);

  useEffect(() => {
    setUnauthorizedHandler(() => { persist(null); });
    (async () => {
      await loadNonce();
      // Optimistic: show cached user immediately, then validate in background.
      const cached = await AsyncStorage.getItem(USER_KEY);
      if (cached) { try { setUser(JSON.parse(cached)); } catch {} }
      await refresh();
      setReady(true);
    })();
    return () => setUnauthorizedHandler(null);
  }, [persist, refresh]);

  const value = useMemo(
    () => ({ ready, user, onWebAuth, refresh, logout }),
    [ready, user, onWebAuth, refresh, logout]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
