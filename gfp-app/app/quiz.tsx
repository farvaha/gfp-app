import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, H2, Muted, Btn, Chip } from '../components/ui';
import { Api } from '../src/api/client';
import { computeTargetKcal } from '../src/lib/builder';
import { macroTargets } from '../src/lib/macros';
import { buildCaliSplit, buildSplit, mealsFor, perMeal } from '../src/lib/splits';
import { C, F, R } from '../constants/gfp';

// Native Build My Plan - mirrors the website builder: protocol (including
// competition prep), body stats, activity, training style and nutrition,
// then saves builder_state PLUS the computed plan. The old version posted
// flat fields without `computed`, which the server rejects with 400 -
// that was the 'Could not save your plan' bug.

const STEPS = ['Protocol', 'Goal', 'Body', 'Activity', 'Training', 'Nutrition', 'Your plan'];

function Opts({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <View style={s.optWrap}>
      {options.map(([v, label]) => (
        <Pressable key={v} onPress={() => onChange(v)} style={[s.opt, value === v && s.optOn]}>
          <Text style={[s.optTxt, value === v && s.optTxtOn]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Num({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit?: string }) {
  return (
    <View style={s.numRow}>
      <Text style={s.numLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TextInput value={value} onChangeText={onChange} keyboardType="numeric" style={s.numInput} placeholderTextColor={C.muted} />
        {!!unit && <Text style={s.numUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

export default function Quiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [protocol, setProtocol] = useState('general');
  const [caliFocus, setCaliFocus] = useState('skills');
  const [goal, setGoal] = useState('gain');
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [activity, setActivity] = useState('1.55');
  const [days, setDays] = useState('4');
  const [splitStyle, setSplitStyle] = useState('ppl');
  const [equip, setEquip] = useState('gym');
  const [diet, setDiet] = useState('none');
  const [allergies, setAllergies] = useState('');

  const bs = useMemo(
    () => ({
      protocol,
      caliFocus: protocol === 'calisthenics' ? caliFocus : undefined,
      goal,
      sex,
      age: Number(age) || 0,
      height: Number(height) || 0,
      weight: Number(weight) || 0,
      hUnit: 'cm',
      wUnit: 'kg',
      activity: Number(activity) || 1.4,
      days: Number(days) || 3,
      splitStyle,
      equip,
      diet,
      allergies,
      eduConsent: true,
    }),
    [protocol, caliFocus, goal, sex, age, height, weight, activity, days, splitStyle, equip, diet, allergies]
  );

  const kcal = useMemo(() => computeTargetKcal(bs as any), [bs]);
  const macros = useMemo(() => macroTargets(kcal, bs as any), [kcal, bs]);
  const split = useMemo(
    () => (protocol === 'calisthenics' ? buildCaliSplit(Number(days) || 3, caliFocus) : buildSplit(splitStyle, Number(days) || 3, goal)),
    [protocol, caliFocus, splitStyle, days, goal]
  );
  const meals = useMemo(() => mealsFor(goal, kcal), [goal, kcal]);

  async function save() {
    setSaving(true);
    try {
      await Api.createProtocol({
        builder_state: bs,
        computed: {
          target_kcal: kcal,
          goal,
          meals_count: meals,
          training_days: Number(days) || 3,
          split,
        },
      });
      Alert.alert('Plan saved', 'Your new plan is live.');
      router.replace('/(tabs)/plan');
    } catch (e: any) {
      Alert.alert('Could not save your plan', String(e?.message || 'Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  const canNext = step < STEPS.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <View style={s.bar}>
        <Text onPress={() => (step === 0 ? router.back() : setStep(step - 1))} style={s.back}>
          {step === 0 ? 'Close' : 'Back'}
        </Text>
        <Text style={s.barTitle}>{STEPS[step]}</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={s.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[s.dot, i <= step && s.dotOn]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <Card>
              <H2>Choose your protocol</H2>
              <Muted>Same three tracks as the website.</Muted>
              <Opts
                value={protocol}
                onChange={setProtocol}
                options={[
                  ['general', 'General fitness'],
                  ['calisthenics', 'Calisthenics & Aesthetics'],
                  ['comp', 'Competition prep'],
                ]}
              />
              {protocol === 'calisthenics' && (
                <>
                  <Text style={s.sub}>Focus</Text>
                  <Opts
                    value={caliFocus}
                    onChange={setCaliFocus}
                    options={[
                      ['skills', 'Skills'],
                      ['aesthetics', 'Aesthetics'],
                      ['both', 'Both'],
                    ]}
                  />
                </>
              )}
              {protocol === 'comp' && (
                <Muted>Prep protocols run higher protein and tighter check-ins.</Muted>
              )}
            </Card>
          )}

          {step === 1 && (
            <Card>
              <H2>Your goal</H2>
              <Opts
                value={goal}
                onChange={setGoal}
                options={[
                  ['lose', 'Lose fat'],
                  ['maintain', 'Maintain'],
                  ['gain', 'Build muscle'],
                  ['weight_gain', 'Gain weight'],
                ]}
              />
            </Card>
          )}

          {step === 2 && (
            <Card>
              <H2>About you</H2>
              <Opts value={sex} onChange={setSex} options={[['male', 'Male'], ['female', 'Female']]} />
              <Num label="Age" value={age} onChange={setAge} unit="yrs" />
              <Num label="Height" value={height} onChange={setHeight} unit="cm" />
              <Num label="Weight" value={weight} onChange={setWeight} unit="kg" />
            </Card>
          )}

          {step === 3 && (
            <Card>
              <H2>Daily activity</H2>
              <Opts
                value={activity}
                onChange={setActivity}
                options={[
                  ['1.2', 'Mostly sitting'],
                  ['1.375', 'Lightly active'],
                  ['1.55', 'Active'],
                  ['1.725', 'Very active'],
                ]}
              />
            </Card>
          )}

          {step === 4 && (
            <Card>
              <H2>Training</H2>
              <Text style={s.sub}>Days per week</Text>
              <Opts value={days} onChange={setDays} options={[['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']]} />
              {protocol === 'calisthenics' ? (
                <Muted>Calisthenics track: your days are built from skills, push, pull and legs bodyweight work - no gym split needed.</Muted>
              ) : (
                <>
              <Text style={s.sub}>Split style</Text>
              <Opts
                value={splitStyle}
                onChange={setSplitStyle}
                options={[
                  ['ppl', 'Push / Pull / Legs'],
                  ['upper_lower', 'Upper / Lower'],
                  ['full_body', 'Full body'],
                  ['bro', 'Body-part split'],
                ]}
              />
              <Text style={s.sub}>Equipment</Text>
              <Opts value={equip} onChange={setEquip} options={[['gym', 'Gym'], ['home', 'Home'], ['bodyweight', 'Bodyweight']]} />
                </>
              )}
              {protocol === 'comp' && (
                <Muted>Competition prep: higher protein and tighter set schemes are applied automatically.</Muted>
              )}
            </Card>
          )}

          {step === 5 && (
            <Card>
              <H2>Nutrition</H2>
              <Text style={s.sub}>Diet</Text>
              <Opts
                value={diet}
                onChange={setDiet}
                options={[
                  ['none', 'No restriction'],
                  ['veg', 'Vegetarian'],
                  ['vegan', 'Vegan'],
                  ['halal', 'Halal'],
                ]}
              />
              <Text style={s.sub}>Allergies (optional)</Text>
              <TextInput
                value={allergies}
                onChangeText={setAllergies}
                placeholder="e.g. peanuts, lactose"
                placeholderTextColor={C.muted}
                style={s.input}
              />
            </Card>
          )}

          {step === 6 && (
            <>
              <Card>
                <H2>Your plan</H2>
                <Text style={s.kcal}>
                  {kcal}
                  <Text style={s.kcalUnit}> kcal / day</Text>
                </Text>
                <View style={s.chips}>
                  <Chip label={`${macros.protein}g protein`} />
                  <Chip label={`${macros.carbs}g carbs`} />
                  <Chip label={`${macros.fat}g fat`} />
                </View>
              </Card>
              <Card>
                <H2>Meals</H2>
                <Muted>{`${meals} meals a day, about ${perMeal(kcal, meals)} kcal each.`}</Muted>
              </Card>
              <Card>
                <H2>Training split</H2>
                {split.map((d, i) => (
                  <View key={i} style={s.dayBlock}>
                    <Text style={s.dayName}>{d.name}</Text>
                    {d.ex.map((e, j) => (
                      <View key={j} style={s.exRow}>
                        <Text style={s.exName}>{e.n}</Text>
                        <Text style={s.exScheme}>{e.s}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </Card>
              <Btn label={saving ? 'Saving...' : 'Save my plan'} loading={saving} onPress={save} />
            </>
          )}

          {canNext && <Btn label="Continue" onPress={() => setStep(step + 1)} style={{ marginTop: 4 }} />}
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  back: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13, width: 44 },
  barTitle: { color: C.ink, fontFamily: F.heading, fontSize: 15 },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, marginBottom: 6 },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: C.card2 },
  dotOn: { backgroundColor: C.orange },
  body: { padding: 14, gap: 12 },
  sub: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13, marginTop: 12, marginBottom: 4 },
  optWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  opt: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: R.md,
    backgroundColor: C.card2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
  },
  optOn: { backgroundColor: C.orange, borderColor: C.orange },
  optTxt: { color: C.ink, fontFamily: F.bodyMed, fontSize: 13 },
  optTxtOn: { color: '#fff', fontFamily: F.bodySemi },
  numRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  numLabel: { color: C.ink, fontFamily: F.bodyMed, fontSize: 14 },
  numInput: {
    color: C.ink,
    fontFamily: F.bodySemi,
    fontSize: 16,
    backgroundColor: C.card2,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 88,
    textAlign: 'right',
  },
  numUnit: { color: C.muted, fontFamily: F.body, fontSize: 12, width: 28 },
  input: {
    color: C.ink,
    fontFamily: F.bodyMed,
    fontSize: 14,
    backgroundColor: C.card2,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.line,
  },
  kcal: { color: C.orange, fontFamily: F.headingX, fontSize: 34, marginTop: 8 },
  kcalUnit: { color: C.muted, fontFamily: F.heading, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  dayBlock: { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, paddingTop: 8 },
  dayName: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13, marginBottom: 4 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  exName: { flex: 1, color: C.ink, fontFamily: F.body, fontSize: 13 },
  exScheme: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12, marginLeft: 10 },
});
