import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../src/i18n/locale';
import { Card, H2, Muted } from './ui';
import { buildMealPlan, MacroSet } from '../src/lib/meals';
import { trMealName, trMealTime, trMealNote, trFoodLine, trMealSummary } from '../src/i18n/food';
import { C, F, R } from '../constants/gfp';

// Shows the full eating plan: how many meals, when to eat them, the macro
// split of each, and what to actually put on the plate. Used on the quiz
// summary, My Plan and (compact) on Today.
export function MealPlanCard({
  targets,
  meals,
  diet,
  title,
  compact,
}: {
  targets: MacroSet;
  meals: number;
  diet?: string;
  title?: string;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const mealName = (n: string) => trMealName(n);
  const plan = buildMealPlan(targets, meals, { diet });
  if (!plan.length) return null;

  return (
    <Card>
      <H2>{title || t('plan.yourMeals')}</H2>
      <Muted>{trMealSummary(plan.length, Math.round((targets.kcal || 0) / plan.length), Math.round((targets.protein || 0) / plan.length))}</Muted>
      {plan.map((m, i) => (
        <View key={i} style={s.meal}>
          <View style={s.head}>
            <Text style={s.name}>{mealName(m.name)}</Text>
            <Text style={s.time}>{trMealTime(m.time)}</Text>
          </View>
          <Text style={s.macros}>
            {m.kcal} kcal - {m.protein} g {t('macro.protein').toLowerCase()} - {m.carbs} g {t('macro.carbs').toLowerCase()} - {m.fat} g {t('macro.fat').toLowerCase()}
          </Text>
          {!compact && (
            <>
              {m.foods.map((f, j) => (
                <Text key={j} style={s.food}>- {trFoodLine(f)}</Text>
              ))}
              <Text style={s.note}>{trMealNote(m.note)}</Text>
            </>
          )}
        </View>
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  meal: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
    paddingTop: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14 },
  time: { color: C.orange, fontFamily: F.bodyMed, fontSize: 11 },
  macros: { color: C.mint, fontFamily: F.bodyMed, fontSize: 12, marginTop: 3 },
  food: { color: C.ink, fontFamily: F.body, fontSize: 12, lineHeight: 19, marginTop: 3 },
  note: { color: C.muted, fontFamily: F.body, fontSize: 11, lineHeight: 17, marginTop: 6 },
});
