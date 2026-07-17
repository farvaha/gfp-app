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
  // Native email + password sign-in. Establishes the cookie session in the
  // shared native jar and returns the signed-in user (throws on failure).
  login: (email: string, password: string) => Promise<Me>;
  // Native account creation, then sign-in.
  register: (payload: { email: string; password: string; name?: string }) => Promise<Me>;
  // Trigger a password-reset email.
  forgot: (email: string) => Promise<void>;
  // Called by the WebView layer once a login/signup completes and a nonce is captured.
  onWebAuth: (nonce: string | null) => Promise<void>;
  // Re-validate the current cookie session; returns the user or null.
  refresh: () => Promise<Me | null>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  ready: false,
  user: null,
  login: async () => { throw new Error('not ready'); },
  register: async () => { throw new Error('not ready'); },
  forgot: async () => {},
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

  const login = useCallback(async (email: string, password: string): Promise<Me> => {
    // POST /auth/login sets the session cookie in the shared native jar and
    // returns the user (and, on most WP setups, a fresh nonce header).
    const res = await Api.login(email.trim(), password);
    // Prefer the user object the login response returns; otherwise confirm via /me.
    const me: Me | null =
      (res && res.user) ? res.user :
      (res && res.id && res.email) ? res :
      await Api.me();
    if (!me || !me.id) throw new Error('Sign-in did not return an account.');
    await persist(me);
    return me;
  }, [persist]);

  const register = useCallback(
    async (payload: { email: string; password: string; name?: string }): Promise<Me> => {
      const res = await Api.register({
        email: payload.email.trim(),
        password: payload.password,
        name: payload.name?.trim(),
      });
      // If register logs the user straight in, a session cookie is now set.
      let me: Me | null =
        (res && res.user) ? res.user :
        (res && res.id && res.email) ? res : null;
      if (!me) {
        // Otherwise establish the session explicitly with the same credentials.
        me = await login(payload.email, payload.password);
      } else {
        await persist(me);
      }
      return me;
    },
    [login, persist]
  );

  const forgot = useCallback(async (email: string) => {
    await Api.forgot(email.trim());
  }, []);

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
    () => ({ ready, user, login, register, forgot, onWebAuth, refresh, logout }),
    [ready, user, login, register, forgot, onWebAuth, refresh, logout]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
