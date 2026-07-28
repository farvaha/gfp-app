import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRINGS, StringKey } from './strings';

/**
 * App-wide language layer, mirroring the website's 14 locales.
 * - `t(key)` returns the string for the active language (English fallback).
 * - `withLang(url)` carries the language into any website URL we open.
 * - Preference is stored on the device and applies instantly, no restart.
 */
export type Locale =
  | 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ar'
  | 'zh' | 'ja' | 'ko' | 'bn' | 'ta' | 'te' | 'mr';

export const LOCALES: { code: Locale; site: string; label: string; native: string }[] = [
  { code: 'en', site: 'en', label: 'EN', native: 'English' },
  { code: 'hi', site: 'hi', label: 'HI', native: '\u0939\u093f\u0928\u094d\u0926\u0940' },
  { code: 'es', site: 'es', label: 'ES', native: 'Espa\u00f1ol' },
  { code: 'fr', site: 'fr', label: 'FR', native: 'Fran\u00e7ais' },
  { code: 'de', site: 'de', label: 'DE', native: 'Deutsch' },
  { code: 'pt', site: 'pt', label: 'PT', native: 'Portugu\u00eas' },
  { code: 'ar', site: 'ar', label: 'AR', native: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'zh', site: 'zh-CN', label: 'ZH', native: '\u4e2d\u6587' },
  { code: 'ja', site: 'ja', label: 'JA', native: '\u65e5\u672c\u8a9e' },
  { code: 'ko', site: 'ko', label: 'KO', native: '\ud55c\uad6d\uc5b4' },
  { code: 'bn', site: 'bn', label: 'BN', native: '\u09ac\u09be\u0982\u09b2\u09be' },
  { code: 'ta', site: 'ta', label: 'TA', native: '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd' },
  { code: 'te', site: 'te', label: 'TE', native: '\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41' },
  { code: 'mr', site: 'mr', label: 'MR', native: '\u092e\u0930\u093e\u0920\u0940' },
];

const KEY = 'gfp_locale';
const CODES = LOCALES.map((l) => l.code);

// module-level so every mounted screen stays in sync without a provider
let current: Locale = 'en';
const listeners = new Set<(l: Locale) => void>();

export function setLocale(l: Locale) {
  if (!CODES.includes(l)) return;
  current = l;
  AsyncStorage.setItem(KEY, l).catch(() => {});
  listeners.forEach((fn) => fn(l));
}

export function translate(key: StringKey, locale?: Locale): string {
  const l = locale || current;
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[l] || entry.en || key;
}

export function useLocale() {
  const [locale, setL] = useState<Locale>(current);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (alive && v && CODES.includes(v as Locale) && v !== current) {
          current = v as Locale;
          setL(current);
          listeners.forEach((fn) => fn(current));
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

  const withLang = useCallback(
    (url: string) => {
      if (locale === 'en') return url;
      const site = (LOCALES.find((x) => x.code === locale) || LOCALES[0]).site;
      return url + (url.includes('?') ? '&' : '?') + 'lang=' + site;
    },
    [locale],
  );

  const t = useCallback((key: StringKey) => translate(key, locale), [locale]);

  const meta = LOCALES.find((x) => x.code === locale) || LOCALES[0];

  return {
    locale,
    setLocale,
    t,
    label: meta.label,
    native: meta.native,
    /** append to a website URL so browser hand-offs open in the same language */
    qs: locale === 'en' ? '' : '?lang=' + meta.site,
    withLang,
  };
}

export function getLocale(): Locale {
  return current;
}
