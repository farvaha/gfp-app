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
import { Ionicons } from '@expo/vector-icons';
import { Btn } from '../components/ui';
import { useAuth } from '../src/auth/AuthContext';
import { Api } from '../src/api/client';
import { computeTargetKcal, ACTIVITY, GOAL_MULT } from '../src/lib/builder';
import { macroTargets, type BuilderState } from '../src/lib/macros';
import { C, F, R } from '../constants/gfp';

type Unit = 'metric' | 'imperial';

const GOALS = [
  { key: 'lose', label: 'Lose fat', hint: 'Cut calories, keep muscle' },
  { key: 'maintain', label: 'Maintain', hint: 'Stay where you are, get fitter' },
  { key: 'gain', label: 'Build muscle', hint: 'Lean gain in a slight surplus' },
  { key: 'weight_gain', label: 'Gain weight', hint: 'Bigger surplus, size focus' },
];

const ACTIVITY_KEYS = Object.keys(ACTIVITY);

export default function Quiz() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [goal, setGoal] = useState('lose');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('');
  const [unit, setUnit] = useState<Unit>('metric');
  const [height, setHeight] = useState(''); // cm or inches
  const [weight, setWeight] = useState(''); // kg or lb
  const [activity, setActivity] = useState('moderate');
  const [days, setDays] = useState('4');
  const [meals, setMeals] = useState('4');

  const bs: BuilderState = useMemo(
    () => ({
      goal,
      sex,
      age,
      height,
      hUnit: unit === 'metric' ? 'cm' : 'in',
      weight,
      wUnit: unit === 'metric' ? 'kg' : 'lb',
      activity,
      days,
    }),
    [goal, sex, age, height, unit, weight, activity, days],
  );

  const kcal = useMemo(() => computeTargetKcal(bs), [bs]);
  const targets = useMemo(() => macroTargets(kcal, bs), [kcal, bs]);

  const STEPS = ['Goal', 'About you', 'Body', 'Activity', 'Training', 'Your plan'];
  const last = STEPS.length - 1;

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return !!goal;
      case 1:
        return !!age && Number(age) >= 13 && Number(age) <= 100;
      case 2:
        return !!height && !!weight && kcal > 0;
      case 3:
        return !!activity;
      case 4:
        return !!days && !!meals;
      default:
        return true;
    }
  }

  function next() {
    if (step === 2 && kcal <= 0) {
      Alert.alert('Check your details', 'Please enter a valid height, weight and age so we can size your plan.');
      return;
    }
    if (!canAdvance()) return;
    if (step < last) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
    else router.back();
  }

  async function savePlan() {
    if (!user) {
      Alert.alert(
        'Create a free account',
        'Make a free account to save this plan and start your 14-day Companion trial.',
        [
          { text: 'Not now' },
          { text: 'Continue', onPress: () => router.push('/login') },
        ],
      );
      return;
    }
    setSaving(true);
    try {
      await Api.createProtocol({
        builder_state: { ...bs, meals: Number(meals) },
        target_kcal: kcal,
        goal,
        training_days: Number(days),
        meals_count: Number(meals),
      });
      Alert.alert('Plan ready', 'Your plan is saved. Let’s get logging.');
      router.replace('/(tabs)/plan');
    } catch (e: any) {
      Alert.alert('Could not save your plan', String(e?.message || 'Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.bar}>
        <Pressable hitSlop={12} onPress={back} style={s.back}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Text style={s.barTitle}>{STEPS[step]}</Text>
        <View style={s.back} />
      </View>

      {/* progress */}
      <View style={s.progress}>
        {STEPS.map((_, i) => (
          <View key={i} style={[s.dot, i <= step && s.dotOn]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <Section title="What’s your main goal?">
              {GOALS.map((g) => (
                <Choice
                  key={g.key}
                  label={g.label}
                  hint={g.hint}
                  active={goal === g.key}
                  onPress={() => setGoal(g.key)}
                />
              ))}
            </Section>
          )}

          {step === 1 && (
            <Section title="Tell us about you">
              <Text style={s.label}>Sex</Text>
              <View style={s.rowGap}>
                <Choice label="Male" active={sex === 'male'} onPress={() => setSex('male')} inline />
                <Choice label="Female" active={sex === 'female'} onPress={() => setSex('female')} inline />
              </View>
              <Text style={s.label}>Age</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 28"
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                style={s.input}
              />
            </Section>
          )}

          {step === 2 && (
            <Section title="Your body">
              <View style={s.unitRow}>
                <Choice label="Metric (cm / kg)" active={unit === 'metric'} onPress={() => setUnit('metric')} inline />
                <Choice label="Imperial (in / lb)" active={unit === 'imperial'} onPress={() => setUnit('imperial')} inline />
              </View>
              <Text style={s.label}>Height ({unit === 'metric' ? 'cm' : 'inches'})</Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                placeholder={unit === 'metric' ? 'e.g. 178' : 'e.g. 70'}
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                style={s.input}
              />
              <Text style={s.label}>Weight ({unit === 'metric' ? 'kg' : 'lb'})</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder={unit === 'metric' ? 'e.g. 80' : 'e.g. 176'}
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                style={s.input}
              />
            </Section>
          )}

          {step === 3 && (
            <Section title="How active are you?">
              {ACTIVITY_KEYS.map((k) => (
                <Choice
                  key={k}
                  label={ACTIVITY[k].label}
                  active={activity === k}
                  onPress={() => setActivity(k)}
                />
              ))}
            </Section>
          )}

          {step === 4 && (
            <Section title="Training & meals">
              <Text style={s.label}>Training days per week</Text>
              <Stepper value={Number(days)} min={1} max={7} onChange={(v) => setDays(String(v))} />
              <Text style={[s.label, { marginTop: 18 }]}>Meals per day</Text>
              <Stepper value={Number(meals)} min={2} max={6} onChange={(v) => setMeals(String(v))} />
            </Section>
          )}

          {step === 5 && (
            <Section title="Your plan">
              <View style={s.planCard}>
                <Text style={s.kcal}>
                  {kcal}
                  <Text style={s.kcalUnit}> kcal / day</Text>
                </Text>
                <Text style={s.goalLine}>
                  {GOALS.find((g) => g.key === goal)?.label} ·{' '}
                  {Math.round((GOAL_MULT[goal] ?? 1) * 100)}% of maintenance
                </Text>

                <MacroRow label="Protein" value={targets.protein} unit="g" accent={C.mint} />
                <MacroRow label="Carbs" value={targets.carbs} unit="g" accent={C.orangeLight} />
                <MacroRow label="Fat" value={targets.fat} unit="g" accent={C.muted} />

                <Text style={s.meta}>
                  {days} training days · {meals} meals/day
                  {!targets.exact ? ' · add bodyweight for an exact protein target' : ''}
                </Text>
              </View>
              <Text style={s.disclaimer}>
                Calories are an estimate from your inputs. Your saved plan uses the server’s final
                numbers and you can update it anytime.
              </Text>
            </Section>
          )}
        </ScrollView>

        <View style={s.footer}>
          {step < last ? (
            <Btn label="Continue" onPress={next} disabled={!canAdvance()} />
          ) : (
            <Btn label={saving ? 'Saving…' : 'Save my plan'} onPress={savePlan} loading={saving} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={s.title}>{title}</Text>
      {children}
    </View>
  );
}

function Choice({
  label,
  hint,
  active,
  onPress,
  inline,
}: {
  label: string;
  hint?: string;
  active: boolean;
  onPress: () => void;
  inline?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.choice, inline && s.choiceInline, active && s.choiceOn]}
    >
      <Text style={[s.choiceLabel, active && s.choiceLabelOn]}>{label}</Text>
      {!!hint && <Text style={s.choiceHint}>{hint}</Text>}
    </Pressable>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={s.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[s.stepBtn, value <= min && s.stepBtnOff]}
      >
        <Text style={s.stepBtnTxt}>–</Text>
      </Pressable>
      <Text style={s.stepVal}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[s.stepBtn, value >= max && s.stepBtnOff]}
      >
        <Text style={s.stepBtnTxt}>+</Text>
      </Pressable>
    </View>
  );
}

function MacroRow({ label, value, unit, accent }: { label: string; value: number; unit: string; accent: string }) {
  return (
    <View style={s.macroRow}>
      <Text style={s.macroLabel}>{label}</Text>
      <Text style={[s.macroVal, { color: accent }]}>
        {value} {unit}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  bar: {
    height: 48, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, textAlign: 'center', color: C.ink, fontFamily: F.bodySemi, fontSize: 16 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.card2 },
  dotOn: { backgroundColor: C.orange },

  body: { padding: 18, paddingBottom: 24 },
  title: { color: C.ink, fontFamily: F.headingX, fontSize: 22, marginBottom: 16 },
  label: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13, marginBottom: 8, marginTop: 6 },

  choice: {
    backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
  },
  choiceInline: { flex: 1, marginBottom: 0, alignItems: 'center' },
  choiceOn: { borderColor: C.orange, backgroundColor: 'rgba(255,106,43,0.10)' },
  choiceLabel: { color: C.ink, fontFamily: F.bodySemi, fontSize: 15 },
  choiceLabelOn: { color: C.orangeLight },
  choiceHint: { color: C.muted, fontFamily: F.body, fontSize: 12, marginTop: 3 },

  rowGap: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  unitRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: {
    backgroundColor: C.card2, borderRadius: R.sm, color: C.ink, fontFamily: F.bodySemi,
    fontSize: 16, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: C.line,
  },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  stepBtn: {
    width: 48, height: 48, borderRadius: R.pill, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnOff: { opacity: 0.4 },
  stepBtnTxt: { color: C.ink, fontFamily: F.headingX, fontSize: 22 },
  stepVal: { color: C.ink, fontFamily: F.headingX, fontSize: 28, minWidth: 40, textAlign: 'center' },

  planCard: {
    backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 18,
  },
  kcal: { color: C.orange, fontFamily: F.headingX, fontSize: 40 },
  kcalUnit: { color: C.muted, fontFamily: F.heading, fontSize: 16 },
  goalLine: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13, marginTop: 4, marginBottom: 12, textTransform: 'capitalize' },
  macroRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line,
  },
  macroLabel: { color: C.ink, fontFamily: F.bodyMed, fontSize: 14 },
  macroVal: { fontFamily: F.bodySemi, fontSize: 15 },
  meta: { color: C.muted, fontFamily: F.body, fontSize: 12, marginTop: 12, lineHeight: 18 },
  disclaimer: { color: C.muted, fontFamily: F.body, fontSize: 11, lineHeight: 16, marginTop: 14 },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
});
