import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale } from '../../src/i18n/locale';
import { fmt, trGoal } from '../../src/i18n/food';
import { SwipeTabs } from '../../components/SwipeTabs';
import { Card, H2, Muted, Btn, Chip } from '../../components/ui';
import { PlanBody } from '../../components/PlanBody';
import { PlanDetail } from '../../components/PlanDetail';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { EP } from '../../src/api/endpoints';
import { C, F } from '../../constants/gfp';

export default function PlanScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const prot = useCached<any>('active-protocol', EP.activeProtocol);
  const plan = useCached<any>('plan-full', EP.plan);
  const c = prot.data?.computed;

  const [showFull, setShowFull] = useState(false);
  const planText: string =
    (plan.data && (plan.data.plan ?? plan.data.html ?? plan.data.text)) || '';
  // The server's /plan text is often just a tier label; only surface the
  // 'full plan' card when it carries real content worth reading.
  const hasRichPlanText = planText.trim().length > 40;

  return (
    <SwipeTabs style={{ backgroundColor: C.bg }}>
      <AppHeader title={t('tab.plan')} />
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
          <H2>{c ? t('plan.currentPlan') : t('plan.noPlanYet')}</H2>
          {c ? (
            <>
              <Text style={st.kcal}>
                {c.target_kcal}
                <Text style={st.unit}> {t('plan.kcalPerDay')}</Text>
              </Text>
              <View style={st.chips}>
                <Chip label={trGoal(String(c.goal || ''))} />
                <Chip label={fmt(t('plan.mealsChip'), { n: c.meals_count })} />
                <Chip label={fmt(t('plan.trainingDaysChip'), { n: c.training_days })} />
              </View>
            </>
          ) : (
            <Muted>{t('plan.quizHint')}</Muted>
          )}

          <Btn
            label={c ? t('plan.updatePlan') : t('plan.buildFree')}
            onPress={() => router.push('/quiz')}
            style={{ marginTop: 16 }}
          />
        </Card>

        {/* Full protocol detail - macros, split, nutrition - drawn natively. */}
        {!!c && <PlanDetail protocol={prot.data} />}

        {/* Server-rendered plan document, only when it has real content. */}
        {!!c && hasRichPlanText && (
          <Card>
            <View style={st.rowBetween}>
              <H2>{t('plan.fullNotes')}</H2>
              <Btn
                label={showFull ? t('common.hide') : t('common.show')}
                kind="ghost"
                onPress={() => setShowFull((v) => !v)}
              />
            </View>
            {showFull && <PlanBody text={planText} />}
          </Card>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SwipeTabs>
  );
}

const st = StyleSheet.create({
  body: { padding: 14, gap: 12 },
  kcal: { color: C.orange, fontFamily: F.headingX, fontSize: 34, marginTop: 8 },
  unit: { color: C.muted, fontFamily: F.heading, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
