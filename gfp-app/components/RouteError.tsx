import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, R } from '../constants/gfp';

/**
 * Friendly fallback shown when a screen throws while rendering.
 *
 * Expo Router calls the `ErrorBoundary` a route/layout exports with
 * `{ error, retry }`. Wiring this into the tabs layout means a single bad
 * field from the server can no longer take the whole app down — the user
 * sees a card and a "Try again" button instead of the app closing.
 */
export function RouteError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          <Text style={s.title}>This screen hit a snag</Text>
          <Text style={s.msg}>
            Something didn’t load right. Your data is safe — this just stops one screen from
            crashing the whole app.
          </Text>
          {!!error?.message && (
            <Text style={s.detail} numberOfLines={4}>
              {String(error.message)}
            </Text>
          )}
          <Pressable onPress={retry} style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}>
            <Text style={s.btnTxt}>Try again</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  body: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 20,
  },
  title: { color: C.ink, fontFamily: F.headingX, fontSize: 20, marginBottom: 8 },
  msg: { color: C.muted, fontFamily: F.body, fontSize: 14, lineHeight: 21 },
  detail: {
    color: C.muted, fontFamily: F.body, fontSize: 11, lineHeight: 16, marginTop: 12,
    backgroundColor: C.card2, padding: 10, borderRadius: R.sm,
  },
  btn: {
    backgroundColor: C.orange, borderRadius: R.md, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  btnTxt: { color: '#fff', fontFamily: F.bodySemi, fontSize: 15 },
});
