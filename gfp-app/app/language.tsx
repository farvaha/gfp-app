import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LOCALES, useLocale, setLocale } from '../src/i18n/locale';
import { C, F, R } from '../constants/gfp';

// Language picker - mirrors the website's 14 locales. Selection applies
// instantly across the app and is remembered on the device.
export default function LanguageScreen() {
  const router = useRouter();
  const { locale, t } = useLocale();

  return (
    <SafeAreaView style={st.safe} edges={['top', 'bottom']}>
      <View style={st.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={st.back}>{'\u2190'} {t('common.back')}</Text>
        </Pressable>
        <Text style={st.title}>{t('lang.title')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={st.body}>
        <Text style={st.hint}>{t('lang.choose')}</Text>
        {LOCALES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => setLocale(l.code)}
            style={({ pressed }) => [st.row, locale === l.code && st.rowOn, pressed && { opacity: 0.8 }]}
          >
            <Text style={[st.native, locale === l.code && st.nativeOn]}>{l.native}</Text>
            <Text style={st.code}>{l.label}</Text>
            {locale === l.code && <Ionicons name="checkmark-circle" size={20} color={C.mint} />}
          </Pressable>
        ))}
        <Text style={st.note}>{t('lang.note')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  back: { color: C.muted, fontFamily: F.bodyMed, fontSize: 14 },
  title: { color: C.ink, fontFamily: F.headingX, fontSize: 17 },
  body: { padding: 16, gap: 8, paddingBottom: 32 },
  hint: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13, marginBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  rowOn: { borderColor: C.mint, backgroundColor: 'rgba(21,194,165,0.08)' },
  native: { color: C.ink, fontFamily: F.bodySemi, fontSize: 15, flex: 1 },
  nativeOn: { color: C.mint },
  code: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12, marginRight: 6 },
  note: { color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 18, marginTop: 10 },
});
