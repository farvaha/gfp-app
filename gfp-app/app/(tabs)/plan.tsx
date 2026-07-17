import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, H2, Muted, Btn, Chip } from '../../components/ui';
import { PlanBody } from '../../components/PlanBody';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { EP } from '../../src/api/endpoints';
import { C, F } from '../../constants/gfp';

export default function PlanScreen() {
  const router = useRouter();
  const prot = useCached<any>('active-protocol', EP.activeProtocol);
  const plan = useCached<any>('plan-full', EP.plan);
  const c = prot.data?.computed;

  const [showFull, setShowFull] = useState(false);
  const planText: string =
    (plan.data && (plan.data.plan ?? plan.data.html ?? plan.data.text)) || '';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader title="My plan" />
      <ScrollView
        contentContainerStyle={st.body}
        refreshControl={
          <RefreshControl
            refreshing={prot.refreshing || plan.refreshing}
            onRefresh={() => {
              prot.refresh();
              plan.refresh();
            }}
            tintColor={C.muted}
          />
        }
      >
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
            onPress={() => router.push('/quiz')}
            style={{ marginTop: 16 }}
          />
          {!!c && (
            <Btn
              label={showFull ? 'Hide full plan' : 'View full plan'}
              kind="ghost"
              onPress={() => setShowFull((v) => !v)}
              style={{ marginTop: 8 }}
            />
          )}
        </Card>

        {showFull && (
          <Card>
            <H2>Full plan</H2>
            {plan.refreshing && !planText ? (
              <Muted>Loading your plan…</Muted>
            ) : planText ? (
              <PlanBody text={planText} />
            ) : (
              <Muted>
                {plan.error
                  ? 'Could not load your full plan. Pull to refresh to try again.'
                  : 'Your full plan will appear here once it’s built.'}
              </Muted>
            )}
          </Card>
        )}

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
