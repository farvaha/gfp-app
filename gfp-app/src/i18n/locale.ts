import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Language switcher for the app header.
 * The website already ships a Hindi/English switcher; the native shell keeps its
 * own preference so WebView flows can be opened in the chosen language too.
 */
export type Locale = 'en' | 'hi';

const KEY = 'gfp_locale';

// module-level so every mounted header stays in sync without a provider
let current: Locale = 'en';
const listeners = new Set<(l: Locale) => void>();

function setLocale(l: Locale) {
  current = l;
  AsyncStorage.setItem(KEY, l).catch(() => {});
  listeners.forEach((fn) => fn(l));
}

export function useLocale() {
  const [locale, setL] = useState<Locale>(current);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (alive && (v === 'en' || v === 'hi') && v !== current) {
          current = v;
          setL(v);
          listeners.forEach((fn) => fn(v));
        }
      })
      .catch(() => {});

    const fn = (l: Locale) => setL(l);
    listeners.add(fn);
    return () => {
      alive = false;
      listeners.delete(fn);
    };
  }, []);

  const toggle = useCallback(() => {
    setLocale(current === 'en' ? 'hi' : 'en');
  }, []);

  const withLang = useCallback(
    (url: string) => {
      if (locale !== 'hi') return url;
      return url + (url.includes('?') ? '&' : '?') + 'lang=hi';
    },
    [locale],
  );

  return {
    locale,
    toggle,
    label: locale === 'en' ? 'EN' : 'हि',
    /** append to a website URL so WebView flows open in the same language */
    qs: locale === 'hi' ? '?lang=hi' : '',
    /** query-aware variant — safe for URLs that already carry parameters */
    withLang,
  };
}

export function getLocale(): Locale {
  return current;
}
