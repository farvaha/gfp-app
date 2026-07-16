import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R } from '../constants/gfp';
import { useLocale } from '../src/i18n/locale';

/**
 * Top bar used on every tab.
 * Left  — Preiva (AI coach)
 * Right — language switcher (EN / HI)
 */
export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { locale, toggle, label } = useLocale();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => router.push('/preiva')}
        style={({ pressed }) => [styles.iconBtn, styles.preiva, pressed && styles.pressed]}
        accessibilityLabel="Open Preiva coach"
        hitSlop={8}
      >
        <Ionicons name="chatbubble-ellipses" size={17} color={C.mint} />
        <Text style={styles.preivaTxt}>Preiva</Text>
      </Pressable>

      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.iconBtn, styles.lang, pressed && styles.pressed]}
        accessibilityLabel={`Switch language, currently ${locale}`}
        hitSlop={8}
      >
        <Ionicons name="language" size={17} color={C.ink} />
        <Text style={styles.langTxt}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: C.bg,
    gap: 8,
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { color: C.ink, fontFamily: F.heading, fontSize: 15 },
  sub: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 1 },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: R.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  preiva: { backgroundColor: 'rgba(21,194,165,0.10)' },
  preivaTxt: { color: C.mint, fontFamily: F.bodySemi, fontSize: 12 },
  lang: { backgroundColor: C.card },
  langTxt: { color: C.ink, fontFamily: F.bodySemi, fontSize: 12 },
  pressed: { opacity: 0.65 },
});
