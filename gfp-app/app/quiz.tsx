import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLocale } from '../src/i18n/locale';
import { Card, H2, Muted, Btn, Chip } from '../components/ui';
import { Api } from '../src/api/client';
import { fmt, trMealName, trMealTime, trDayName } from '../src/i18n/food';
import { sharePlanPdf } from '../src/lib/pdf';
import { C, F, R } from '../constants/gfp';

// Build My Plan v2 - one clean pass, no repeated questions.
// Screens: 0 path+goal, 1 about you, 2 activity, 3 training, 4 food,
// 5 review, 6 result. All computation happens on the server engine
// (POST /companion/plan-build) so the app and website share one brain.
// Comp divisions imply sex, so About You never asks it again on that path.

const DIVISION_SEX: Record<string, 'male' | 'female'> = {
  mens_physique: 'male', classic: 'male', open: 'male', bikini: 'female', wellness: 'female',
};

function Opt({ on, title, sub, onPress }: { on: boolean; title: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.opt, on && s.optOn]}>
      <Text style={[s.optTitle, on && s.optTitleOn]}>{title}</Text>
      {!!sub && <Text style={s.optSub}>{sub}</Text>}
    </Pressable>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={s.row}>{children}</View>;
}

function Pill({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.pill, on && s.pillOn]}>
      <Text style={[s.pillTxt, on && s.pillTxtOn]}>{label}</Text>
    </Pressable>
  );
}

function Num({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <View style={s.numRow}>
      <Text style={s.numLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TextInput value={value} onChangeText={onChange} keyboardType="numeric" style={s.numInput} placeholderTextColor={C.muted} />
        <Text style={s.numUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function Quiz() {
  const { t } = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const [protocol, setProtocol] = useState('general');
  const [goal, setGoal] = useState('gain');
  const [caliLevel, setCaliLevel] = useState('beginner');
  const [caliFocus, setCaliFocus] = useState('both');
  const [division, setDivision] = useState('mens_physique');
  const [weeksOut, setWeeksOut] = useState('12');
  const [sex, setSex] = useState('male');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [activity, setActivity] = useState('1.55');
  const [days, setDays] = useState('4');
  const [splitStyle, setSplitStyle] = useState('balanced');
  const [equip, setEquip] = useState('gym');
  const [diet, setDiet] = useState('nonveg');
  const [avoid, setAvoid] = useState<string[]>([]);

  const compSex = protocol === 'comp' ? DIVISION_SEX[division] : null;

  const STEPS = [
    t('q2.pathGoal'), t('q2.aboutYou'), t('q2.activity'),
    t('q2.training'), t('q2.food'), t('q2.review'), t('q2.result'),
  ];

  const answers = useMemo(() => ({
    protocol,
    goal: protocol === 'comp' ? 'lose' : goal,
    caliLevel, caliFocus,
    compDivision: protocol === 'comp' ? division : undefined,
    weeksOut: Number(weeksOut) || 12,
    sex: compSex ?? sex,
    age: Number(age) || 25,
    height_cm: Number(height) || 175,
    weight_kg: Number(weight) || 70,
    activity,
    days: Number(days) || 4,
    splitStyle, equip, diet, avoid,
  }), [protocol, goal, caliLevel, caliFocus, division, weeksOut, compSex, sex, age, height, weight, activity, days, splitStyle, equip, diet, avoid]);

  function toggleAvoid(k: string) {
    setAvoid((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  function validStep(): boolean {
    if (step === 1) {
      const a = Number(age), h = Number(height), w = Number(weight);
      if (!(a >= 14 && a <= 90)) { Alert.alert(t('q2.checkAge')); return false; }
      if (!(h >= 120 && h <= 230)) { Alert.alert(t('q2.checkHeight')); return false; }
      if (!(w >= 30 && w <= 250)) { Alert.alert(t('q2.checkWeight')); return false; }
    }
    return true;
  }

  async function build() {
    setBusy(true);
    try {
      const p = await Api.buildPlan(answers);
      setPlan(p);
      setStep(6);
    } catch (e: any) {
      Alert.alert(t('quiz.saveFail'), String(e?.message || ''));
    } finally {
      setBusy(false);
    }
  }

  const c = plan?.computed;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom']}>
      <View style={s.bar}>
        <Text onPress={() => (step === 0 ? router.back() : setStep(Math.max(0, step - 1)))} style={s.back}>
          {step === 0 ? t('common.cancel') : t('common.back')}
        </Text>
        <Text style={s.barTitle}>{STEPS[Math.min(step, STEPS.length - 1)]}</Text>
        <Text style={s.stepNum}>{Math.min(step + 1, 7)}/7</Text>
      </View>
      <View style={s.progressWrap}>
        <View style={[s.progress, { width: `${((step + 1) / 7) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={'padding'}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <>
              <Card>
                <H2>{t('q2.pathTitle')}</H2>
                <Muted>{t('q2.pathHint')}</Muted>
                <Opt on={protocol === 'general'} title={t('quiz.general')} sub={t('q2.generalSub')} onPress={() => setProtocol('general')} />
                <Opt on={protocol === 'cali'} title={t('quiz.calisthenics')} sub={t('q2.caliSub')} onPress={() => setProtocol('cali')} />
                <Opt on={protocol === 'comp'} title={t('quiz.comp')} sub={t('q2.compSub')} onPress={() => setProtocol('comp')} />
              </Card>
              {protocol === 'general' && (
                <Card>
                  <H2>{t('q2.goalTitle')}</H2>
                  <Opt on={goal === 'lose'} title={t('quiz.loseFat')} sub={t('q2.loseSub')} onPress={() => setGoal('lose')} />
                  <Opt on={goal === 'gain'} title={t('quiz.buildMuscle')} sub={t('q2.gainSub')} onPress={() => setGoal('gain')} />
                  <Opt on={goal === 'weight_gain'} title={t('quiz.gainWeight')} sub={t('q2.weightGainSub')} onPress={() => setGoal('weight_gain')} />
                  <Opt on={goal === 'maintain'} title={t('quiz.maintain')} sub={t('q2.maintainSub')} onPress={() => setGoal('maintain')} />
                  <Opt on={goal === 'wellness'} title={t('q2.wellness')} sub={t('q2.wellnessSub')} onPress={() => setGoal('wellness')} />
                </Card>
              )}
              {protocol === 'cali' && (
                <Card>
                  <H2>{t('q2.caliSetup')}</H2>
                  <Text style={s.sub}>{t('q2.caliLevel')}</Text>
                  <Row>
                    <Pill on={caliLevel === 'beginner'} label={t('q2.beginner')} onPress={() => setCaliLevel('beginner')} />
                    <Pill on={caliLevel === 'intermediate'} label={t('q2.intermediate')} onPress={() => setCaliLevel('intermediate')} />
                    <Pill on={caliLevel === 'advanced'} label={t('q2.advanced')} onPress={() => setCaliLevel('advanced')} />
                  </Row>
                  <Text style={s.sub}>{t('q2.caliFocusLbl')}</Text>
                  <Row>
                    <Pill on={caliFocus === 'skills'} label={t('quiz.skills')} onPress={() => setCaliFocus('skills')} />
                    <Pill on={caliFocus === 'aesthetics'} label={t('quiz.aesthetics')} onPress={() => setCaliFocus('aesthetics')} />
                    <Pill on={caliFocus === 'both'} label={t('quiz.both')} onPress={() => setCaliFocus('both')} />
                  </Row>
                </Card>
              )}
              {protocol === 'comp' && (
                <Card>
                  <H2>{t('q2.divisionTitle')}</H2>
                  <Muted>{t('q2.divisionHint')}</Muted>
                  <Opt on={division === 'mens_physique'} title={t('q2.divMp')} sub={t('q2.divMpSub')} onPress={() => setDivision('mens_physique')} />
                  <Opt on={division === 'classic'} title={t('q2.divClassic')} sub={t('q2.divClassicSub')} onPress={() => setDivision('classic')} />
                  <Opt on={division === 'open'} title={t('q2.divOpen')} sub={t('q2.divOpenSub')} onPress={() => setDivision('open')} />
                  <Opt on={division === 'bikini'} title={t('q2.divBikini')} sub={t('q2.divBikiniSub')} onPress={() => setDivision('bikini')} />
                  <Opt on={division === 'wellness'} title={t('q2.divWellness')} sub={t('q2.divWellnessSub')} onPress={() => setDivision('wellness')} />
                  <Text style={s.sub}>{t('q2.weeksOut')}</Text>
                  <Row>
                    {['20', '16', '12', '8'].map((wv) => (
                      <Pill key={wv} on={weeksOut === wv} label={wv} onPress={() => setWeeksOut(wv)} />
                    ))}
                  </Row>
                  <Muted>{t('q2.naturalNote')}</Muted>
                </Card>
              )}
            </>
          )}

          {step === 1 && (
            <Card>
              <H2>{t('q2.statsTitle')}</H2>
              <Muted>{t('q2.statsHint')}</Muted>
              {compSex ? (
                <Muted>{fmt(t('q2.sexFromDivision'), { sex: compSex === 'male' ? t('quiz.male') : t('quiz.female') })}</Muted>
              ) : (
                <Row>
                  <Pill on={sex === 'male'} label={t('quiz.male')} onPress={() => setSex('male')} />
                  <Pill on={sex === 'female'} label={t('quiz.female')} onPress={() => setSex('female')} />
                </Row>
              )}
              <Num label={t('quiz.age')} value={age} onChange={setAge} unit={t('q2.yrs')} />
              <Num label={t('quiz.height')} value={height} onChange={setHeight} unit="cm" />
              <Num label={t('quiz.weight')} value={weight} onChange={setWeight} unit="kg" />
            </Card>
          )}

          {step === 2 && (
            <Card>
              <H2>{t('q2.activityTitle')}</H2>
              <Muted>{t('q2.activityHint')}</Muted>
              <Opt on={activity === '1.2'} title={t('quiz.sitting')} sub={t('q2.sittingSub')} onPress={() => setActivity('1.2')} />
              <Opt on={activity === '1.375'} title={t('quiz.light')} sub={t('q2.lightSub')} onPress={() => setActivity('1.375')} />
              <Opt on={activity === '1.55'} title={t('quiz.active')} sub={t('q2.activeSub')} onPress={() => setActivity('1.55')} />
              <Opt on={activity === '1.725'} title={t('quiz.veryActive')} sub={t('q2.veryActiveSub')} onPress={() => setActivity('1.725')} />
              <Opt on={activity === '1.9'} title={t('q2.athlete')} sub={t('q2.athleteSub')} onPress={() => setActivity('1.9')} />
            </Card>
          )}

          {step === 3 && (
            <Card>
              <H2>{t('q2.trainingTitle')}</H2>
              <Text style={s.sub}>{t('q2.daysPerWeek')}</Text>
              <Row>
                {['2', '3', '4', '5', '6'].map((d) => (
                  <Pill key={d} on={days === d} label={d} onPress={() => setDays(d)} />
                ))}
              </Row>
              {protocol !== 'cali' && (
                <>
                  <Text style={s.sub}>{t('q2.splitStyle')}</Text>
                  <Opt on={splitStyle === 'balanced'} title={t('q2.balanced')} sub={t('q2.balancedSub')} onPress={() => setSplitStyle('balanced')} />
                  <Opt on={splitStyle === 'muscle'} title={t('q2.muscleFocus')} sub={t('q2.muscleFocusSub')} onPress={() => setSplitStyle('muscle')} />
                  <Text style={s.sub}>{t('q2.equipment')}</Text>
                  <Opt on={equip === 'gym'} title={t('q2.fullGym')} sub={t('q2.fullGymSub')} onPress={() => setEquip('gym')} />
                  <Opt on={equip === 'home'} title={t('q2.homeDb')} sub={t('q2.homeDbSub')} onPress={() => setEquip('home')} />
                  <Opt on={equip === 'bodyweight'} title={t('quiz.bodyweight')} sub={t('q2.bodyweightSub')} onPress={() => setEquip('bodyweight')} />
                </>
              )}
              {protocol === 'cali' && <Muted>{t('q2.caliDaysNote')}</Muted>}
            </Card>
          )}

          {step === 4 && (
            <Card>
              <H2>{t('q2.foodTitle')}</H2>
              <Text style={s.sub}>{t('q2.dietType')}</Text>
              <Opt on={diet === 'nonveg'} title={t('q2.nonveg')} sub={t('q2.nonvegSub')} onPress={() => setDiet('nonveg')} />
              <Opt on={diet === 'egg'} title={t('q2.eggetarian')} sub={t('q2.eggetarianSub')} onPress={() => setDiet('egg')} />
              <Opt on={diet === 'veg'} title={t('quiz.veg')} sub={t('q2.vegSub')} onPress={() => setDiet('veg')} />
              <Opt on={diet === 'vegan'} title={t('quiz.vegan')} sub={t('q2.veganSub')} onPress={() => setDiet('vegan')} />
              <Text style={s.sub}>{t('q2.avoidTitle')}</Text>
              <Row>
                <Pill on={avoid.includes('dairy')} label={t('q2.dairy')} onPress={() => toggleAvoid('dairy')} />
                <Pill on={avoid.includes('nuts')} label={t('q2.nuts')} onPress={() => toggleAvoid('nuts')} />
                <Pill on={avoid.includes('gluten')} label={t('q2.gluten')} onPress={() => toggleAvoid('gluten')} />
                <Pill on={avoid.includes('soy')} label={t('q2.soy')} onPress={() => toggleAvoid('soy')} />
              </Row>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <H2>{t('q2.reviewTitle')}</H2>
              <Muted>{t('q2.reviewHint')}</Muted>
              {[
                [t('q2.pathTitle'), protocol === 'general' ? t('quiz.general') : protocol === 'cali' ? t('quiz.calisthenics') : t('quiz.comp'), 0],
                protocol === 'general' ? [t('q2.goalTitle'), { lose: t('quiz.loseFat'), gain: t('quiz.buildMuscle'), weight_gain: t('quiz.gainWeight'), maintain: t('quiz.maintain'), wellness: t('q2.wellness') }[goal] || goal, 0] : null,
                protocol === 'comp' ? [t('q2.divisionTitle'), t(('q2.div' + { mens_physique: 'Mp', classic: 'Classic', open: 'Open', bikini: 'Bikini', wellness: 'Wellness' }[division]) as any) + ` · ${weeksOut} ${t('q2.weeksShort')}`, 0] : null,
                [t('q2.statsTitle'), `${(compSex ?? sex) === 'male' ? t('quiz.male') : t('quiz.female')} · ${age} · ${height} cm · ${weight} kg`, 1],
                [t('q2.activityTitle'), { '1.2': t('quiz.sitting'), '1.375': t('quiz.light'), '1.55': t('quiz.active'), '1.725': t('quiz.veryActive'), '1.9': t('q2.athlete') }[activity] || activity, 2],
                [t('q2.trainingTitle'), `${days} ${t('q2.daysShort')} · ${splitStyle === 'balanced' ? t('q2.balanced') : t('q2.muscleFocus')} · ${equip === 'gym' ? t('q2.fullGym') : equip === 'home' ? t('q2.homeDb') : t('quiz.bodyweight')}`, 3],
                [t('q2.foodTitle'), `${{ nonveg: t('q2.nonveg'), egg: t('q2.eggetarian'), veg: t('quiz.veg'), vegan: t('quiz.vegan') }[diet]}${avoid.length ? ' · ' + avoid.map((a2) => t(('q2.' + a2) as any)).join(', ') : ''}`, 4],
              ].filter(Boolean).map((row: any, i: number) => (
                <Pressable key={i} onPress={() => setStep(row[2])} style={s.reviewRow}>
                  <Text style={s.reviewLabel}>{row[0]}</Text>
                  <Text style={s.reviewVal}>{row[1]}</Text>
                </Pressable>
              ))}
            </Card>
          )}

          {step === 6 && plan && (
            <>
              <Card>
                <H2>{t('quiz.yourPlan')}</H2>
                <Text style={s.kcal}>
                  {c?.target_kcal}
                  <Text style={s.kcalUnit}> {t('plan.kcalPerDay')}</Text>
                </Text>
                <View style={s.chips}>
                  <Chip label={`${c?.protein_g}g ${t('macro.protein')}`} />
                  <Chip label={`${c?.carbs_g}g ${t('macro.carbs')}`} />
                  <Chip label={`${c?.fat_g}g ${t('macro.fat')}`} />
                  <Chip label={`${(c?.water_ml ? c.water_ml / 1000 : 0).toFixed(1)} L`} />
                </View>
                <Muted>{fmt(t('q2.builtSummary'), { n: plan?.meals?.count ?? 0, d: plan?.training?.days ?? 0 })}</Muted>
              </Card>
              <Card>
                <H2>{t('plan.yourMeals')}</H2>
                {(plan?.meals?.slots ?? []).slice(0, 7).map((m: any, i: number) => (
                  <View key={i} style={s.previewRow}>
                    <Text style={s.previewName}>{trMealName(m.name)}</Text>
                    <Text style={s.previewMeta}>{m.kcal} kcal · {m.protein_g}g P · {trMealTime(m.time)}</Text>
                  </View>
                ))}
              </Card>
              <Card>
                <H2>{t('plan.split')}</H2>
                {(plan?.training?.split ?? []).map((d: any, i: number) => (
                  <View key={i} style={s.previewRow}>
                    <Text style={s.previewName}>{trDayName(d.name)}</Text>
                    <Text style={s.previewMeta}>{(d.blocks ?? []).length} {t('q2.exercises')}</Text>
                  </View>
                ))}
              </Card>
              <Card>
                <H2>{t('plan.suppStack')}</H2>
                {(plan?.supplements ?? []).map((sx: any, i: number) => (
                  <View key={i} style={s.previewRow}>
                    <Text style={s.previewName}>{sx.name}</Text>
                    <Text style={s.previewMeta}>{sx.dose}</Text>
                  </View>
                ))}
              </Card>
              <Btn label={t('plan.downloadPdf')} kind="ghost" onPress={() => sharePlanPdf(plan)} />
              <Btn
                label={t('q2.done')}
                onPress={() => {
                  Alert.alert(t('quiz.planSaved'), t('quiz.planLive'));
                  router.replace('/(tabs)/plan');
                }}
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {step < 6 && (
        <View style={s.footer}>
          {busy ? (
            <View style={s.busyWrap}>
              <ActivityIndicator color={C.orange} />
              <Text style={s.busyTxt}>{t('q2.building')}</Text>
            </View>
          ) : (
            <Btn
              label={step === 5 ? t('q2.buildBtn') : t('common.continue')}
              onPress={() => {
                if (!validStep()) return;
                if (step === 5) build();
                else setStep(step + 1);
              }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  back: { color: C.muted, fontFamily: F.bodyMed, fontSize: 14, width: 60 },
  barTitle: { color: C.ink, fontFamily: F.bodySemi, fontSize: 15 },
  stepNum: { color: C.muted, fontFamily: F.bodyMed, fontSize: 13, width: 60, textAlign: 'right' },
  progressWrap: { height: 4, backgroundColor: C.card2, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden' },
  progress: { height: 4, backgroundColor: C.orange, borderRadius: 2 },
  body: { padding: 14, gap: 12, paddingBottom: 24 },
  sub: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  opt: { borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 12, marginTop: 8, backgroundColor: C.card2 },
  optOn: { borderColor: C.orange, backgroundColor: '#2a2018' },
  optTitle: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14 },
  optTitleOn: { color: C.orange },
  optSub: { color: C.muted, fontFamily: F.body, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: { borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.card2 },
  pillOn: { borderColor: C.orange, backgroundColor: C.orange },
  pillTxt: { color: C.ink, fontFamily: F.bodyMed, fontSize: 13 },
  pillTxtOn: { color: '#14181C' },
  numRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  numLabel: { color: C.ink, fontFamily: F.bodyMed, fontSize: 14 },
  numInput: { backgroundColor: C.card2, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 8, color: C.ink, fontFamily: F.bodySemi, fontSize: 16, minWidth: 84, textAlign: 'center' },
  numUnit: { color: C.muted, fontFamily: F.body, fontSize: 13, width: 30 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 10 },
  reviewLabel: { color: C.muted, fontFamily: F.body, fontSize: 13 },
  reviewVal: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13, flexShrink: 1, textAlign: 'right' },
  kcal: { color: C.orange, fontFamily: F.headingX, fontSize: 40, marginTop: 6 },
  kcalUnit: { color: C.muted, fontFamily: F.heading, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, gap: 10 },
  previewName: { color: C.ink, fontFamily: F.bodyMed, fontSize: 13, flexShrink: 1 },
  previewMeta: { color: C.muted, fontFamily: F.body, fontSize: 12, textAlign: 'right' },
  footer: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  busyWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 10 },
  busyTxt: { color: C.muted, fontFamily: F.bodyMed, fontSize: 14 },
});
