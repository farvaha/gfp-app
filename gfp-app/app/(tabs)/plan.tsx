import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, H2, Muted, Btn, Chip } from '../../components/ui';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { EP, WEB } from '../../src/api/endpoints';
import { useLocale } from '../../src/i18n/locale';
import { C, F } from '../../constants/gfp';

export default function PlanScreen() {
  const router = useRouter();
  const { withLang } = useLocale();
  const prot = useCached<any>('active-protocol', EP.activeProtocol);
  const c = prot.data?.computed;

  const open = (url: string) =>
    router.push({ pathname: '/web', params: { url: withLang(url), mode: 'page' } });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader title="My plan" />
      <ScrollView contentContainerStyle={st.body}>
        <Card>
          <H2>{c ? 'Your current plan' : 'No plan yet'}</H2>
          {c ? (
            <>
              <Text style={st.kcal}>
                {c.target_kcal}
                <Text style={st.unit}> kcal / day</Text>
              </Text>
              <View style={st.chips}>
                <Chip label={c.goal} />
                <Chip label={`${c.meals_count} meals`} />
                <Chip label={`${c.training_days} training days`} />
              </View>
            </>
          ) : (
            <Muted>Take the 2-minute quiz and get calories, macros, meals and a split.</Muted>
          )}

          <Btn
            label={c ? 'Update my plan' : 'Build my plan — free'}
            onPress={() => open(WEB.quiz)}
            style={{ marginTop: 16 }}
          />
          {!!c && (
            <Btn
              label="View full plan"
              kind="ghost"
              onPress={() => open(WEB.companion)}
              style={{ marginTop: 8 }}
            />
          )}
        </Card>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  body: { padding: 14, gap: 12 },
  kcal: { color: C.orange, fontFamily: F.headingX, fontSize: 34, marginTop: 8 },
  unit: { color: C.muted, fontFamily: F.heading, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
});
