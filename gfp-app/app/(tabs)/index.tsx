import React, { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Card, H2, Muted, Btn, MacroBar, Chip } from '../../components/ui';
import { PhotoMealSheet, PhotoEstimate } from '../../components/PhotoMealSheet';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { Api } from '../../src/api/client';
import { EP, WEB } from '../../src/api/endpoints';
import { macroTargets } from '../../src/lib/macros';
import { C, F, R } from '../../constants/gfp';

export default function TodayScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimate, setEstimate] = useState<PhotoEstimate | null>(null);

  const prot = useCached<any>('active-protocol', EP.activeProtocol);
  const meals = useCached<any>('meals-today', EP.meals);
  const adh = useCached<any>('adherence-today', EP.adherenceToday);
  const review = useCached<any>('weekly-review', EP.weeklyReview);

  const refreshing = prot.refreshing || meals.refreshing;
  const refreshAll = () => {
    prot.refresh();
    meals.refresh();
    adh.refresh();
    review.refresh();
  };

  // ---- Today vs your plan -------------------------------------------------
  // Calories come from the server (authoritative). Protein/carbs/fat are
  // recomputed from builder_state because the site never persists them.
  const targets = useMemo(() => {
    const kcal = prot.data?.computed?.target_kcal ?? 0;
    return macroTargets(kcal, prot.data?.builder_state);
  }, [prot.data]);

  const totals = meals.data?.totals ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const proteinLeft = Math.max(0, targets.protein - Math.round(totals.protein || 0));
  const mealsLogged = meals.data?.meals?.length ?? 0;
  const mealsTarget = prot.data?.computed?.meals_count ?? adh.data?.meals_target ?? 0;

  async function photoMeal() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to log a meal by picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
    });
    if (res.canceled || !res.assets?.[0]?.base64) return;

    setBusy(true);
    try {
      // Step 1 — AI estimate. Step 2 (user corrects + saves) happens in the sheet.
      const est = await Api.analyzePhoto(res.assets[0].base64);
      setEstimate(est);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('403') || /upgrade|premium/i.test(msg)) {
        Alert.alert('Premium feature', 'Photo meal logging is part of Companion.', [
          { text: 'Not now' },
          {
            text: 'See plans',
            onPress: () =>
              router.push({ pathname: '/web', params: { url: WEB.companion, mode: 'page' } }),
          },
        ]);
      } else {
        Alert.alert('Could not read that photo', msg || 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function savePhoto(v: any) {
    setSaving(true);
    try {
      await Api.savePhotoMeal(v);
      setEstimate(null);
      meals.refresh();
      adh.refresh();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const ai = review.data?.ai_review;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader title="Today" subtitle={prot.data?.computed?.goal ?? undefined} />

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={C.muted} />}
      >
        {/* ---------------- Today vs your plan ---------------- */}
        <Card>
          <View style={styles.rowBetween}>
            <H2>Today vs your plan</H2>
            {adh.data?.score_pct != null && (
              <View style={styles.scorePill}>
                <Text style={styles.scoreTxt}>{adh.data.score_pct}%</Text>
              </View>
            )}
          </View>

          {targets.kcal > 0 ? (
            <>
              <View style={styles.proteinHero}>
                <Text style={styles.proteinNum}>
                  {Math.round(totals.protein || 0)}
                  <Text style={styles.proteinOf}> / {targets.protein} g</Text>
                </Text>
                <Text style={styles.proteinLabel}>
                  {proteinLeft > 0 ? `${proteinLeft} g protein to go` : 'Protein target hit 💪'}
                </Text>
              </View>

              <MacroBar label="Protein" value={totals.protein || 0} target={targets.protein} color={C.mint} />
              <MacroBar label="Calories" value={totals.kcal || 0} target={targets.kcal} color={C.orange} />
              <MacroBar label="Carbs" value={totals.carbs || 0} target={targets.carbs} color={C.orangeLight} />
              <MacroBar label="Fat" value={totals.fat || 0} target={targets.fat} color={C.muted} />

              {!targets.exact && (
                <Muted>Add your bodyweight in Build My Plan for an exact protein target.</Muted>
              )}
            </>
          ) : (
            <>
              <Muted>No plan yet — build one to see your targets.</Muted>
              <Btn label="Build my plan" onPress={() => router.push('/(tabs)/plan')} style={{ marginTop: 12 }} />
            </>
          )}
        </Card>

        {/* ---------------- Meals ---------------- */}
        <Card>
          <View style={styles.rowBetween}>
            <H2>Meals</H2>
            <Chip label={`${mealsLogged}${mealsTarget ? ` / ${mealsTarget}` : ''}`} />
          </View>

          {mealsLogged === 0 ? (
            <Muted>Nothing logged yet today.</Muted>
          ) : (
            meals.data.meals.map((m: any, i: number) => (
              <View key={m.id ?? i} style={styles.mealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mealName} numberOfLines={1}>
                    {m.slot || m.title || m.items || 'Meal'}
                  </Text>
                  <Text style={styles.mealMeta}>
                    {Math.round(m.kcal || 0)} kcal · {Math.round(m.protein || 0)}g protein
                  </Text>
                </View>
                <Btn
                  label="✕"
                  kind="ghost"
                  onPress={() =>
                    Alert.alert('Remove meal?', 'This will delete the entry.', [
                      { text: 'Cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await Api.deleteMeal(m.id);
                            meals.refresh();
                            adh.refresh();
                          } catch (e: any) {
                            Alert.alert('Could not delete', e?.message || '');
                          }
                        },
                      },
                    ])
                  }
                />
              </View>
            ))
          )}

          <Btn
            label={busy ? 'Reading photo…' : '📷 Log meal by photo'}
            onPress={photoMeal}
            loading={busy}
            style={{ marginTop: 12 }}
          />
          <Btn
            label="Log meal manually"
            kind="ghost"
            onPress={() => router.push({ pathname: '/web', params: { url: WEB.companion, mode: 'page' } })}
            style={{ marginTop: 8 }}
          />
        </Card>

        {/* ---------------- Weekly coach review ---------------- */}
        <Card>
          <View style={styles.rowBetween}>
            <H2>Weekly coach review</H2>
            <Chip label="Premium" />
          </View>
          {ai ? (
            <Text style={styles.reviewTxt}>{typeof ai === 'string' ? ai : JSON.stringify(ai)}</Text>
          ) : (
            <Muted>
              {review.data?.week_start
                ? 'Not enough logged this week yet — keep logging and your review appears here.'
                : 'Your weekly review will appear here.'}
            </Muted>
          )}
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>

      <PhotoMealSheet
        visible={!!estimate}
        estimate={estimate}
        saving={saving}
        onCancel={() => setEstimate(null)}
        onSave={savePhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 14, gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  scorePill: {
    backgroundColor: 'rgba(21,194,165,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
  },
  scoreTxt: { color: C.mint, fontFamily: F.bodySemi, fontSize: 12 },
  proteinHero: { marginBottom: 14 },
  proteinNum: { color: C.mint, fontFamily: F.headingX, fontSize: 34 },
  proteinOf: { color: C.muted, fontFamily: F.heading, fontSize: 18 },
  proteinLabel: { color: C.muted, fontFamily: F.body, fontSize: 12, marginTop: 2 },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  mealName: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13 },
  mealMeta: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 2 },
  reviewTxt: { color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 20 },
});
