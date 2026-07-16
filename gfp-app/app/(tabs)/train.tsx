import React, { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, H2, Muted, Btn, Chip } from '../../components/ui';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { Api } from '../../src/api/client';
import { EP } from '../../src/api/endpoints';
import { C, F, R } from '../../constants/gfp';

/** One editable set row: reps + weight, exactly like the web app. */
interface SetRow {
  ex: string;
  reps: string;
  kg: string;
  done: boolean;
}

/** "4 × 6–8" -> 4 */
function setCount(scheme: string): number {
  const m = String(scheme || '').match(/^\s*(\d+)/);
  const n = m ? parseInt(m[1], 10) : 3;
  return Math.min(8, Math.max(1, n));
}
/** "4 × 6–8" -> "6–8" */
function repScheme(scheme: string): string {
  const m = String(scheme || '').split(/[×x]/);
  return (m[1] || '').trim();
}

export default function TrainScreen() {
  const prot = useCached<any>('active-protocol', EP.activeProtocol);
  const wk = useCached<any>('workouts-today', EP.workouts);
  const adh = useCached<any>('adherence-today', EP.adherenceToday);

  const split: any[] = prot.data?.computed?.split ?? [];
  const [dayIdx, setDayIdx] = useState(0);
  const [rows, setRows] = useState<SetRow[]>([]);
  const [busy, setBusy] = useState(false);

  // the workout already logged today, if any (PATCH target)
  const logged = wk.data?.workouts?.[0] ?? wk.data?.active ?? null;
  const loggedId: number | null = logged?.id ?? null;

  const day = split[dayIdx];

  // Build editable rows: from the logged workout if it exists, else from the plan.
  useEffect(() => {
    if (loggedId && Array.isArray(logged?.sets) && logged.sets.length) {
      setRows(
        logged.sets.map((s: any) => ({
          ex: String(s.ex ?? s.n ?? ''),
          reps: String(s.reps ?? ''),
          kg: String(s.kg ?? s.weight ?? ''),
          done: !!s.done,
        })),
      );
      return;
    }
    if (!day) {
      setRows([]);
      return;
    }
    const next: SetRow[] = [];
    for (const e of day.ex ?? []) {
      const n = setCount(e.s);
      for (let i = 0; i < n; i++) {
        next.push({ ex: e.n, reps: repScheme(e.s), kg: '', done: false });
      }
    }
    setRows(next);
  }, [dayIdx, loggedId, prot.data]);

  const doneCount = rows.filter((r) => r.done).length;

  const grouped = useMemo(() => {
    const g: { ex: string; idxs: number[] }[] = [];
    rows.forEach((r, i) => {
      const last = g[g.length - 1];
      if (last && last.ex === r.ex) last.idxs.push(i);
      else g.push({ ex: r.ex, idxs: [i] });
    });
    return g;
  }, [rows]);

  function edit(i: number, patch: Partial<SetRow>) {
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  }

  function addSet(afterIdx: number, ex: string) {
    setRows((prev) => {
      const copy = [...prev];
      copy.splice(afterIdx + 1, 0, { ex, reps: prev[afterIdx]?.reps ?? '', kg: prev[afterIdx]?.kg ?? '', done: false });
      return copy;
    });
  }

  function removeSet(i: number) {
    setRows((prev) => prev.filter((_, k) => k !== i));
  }

  async function save(status: 'in_progress' | 'completed') {
    setBusy(true);
    try {
      const sets = rows.map((r) => ({
        ex: r.ex,
        reps: r.reps,
        kg: r.kg ? Number(r.kg) : null,
        done: r.done,
      }));
      if (loggedId) {
        await Api.patchWorkout(loggedId, { sets, status });
      } else {
        // The server's POST /workouts only creates the row (it ignores `sets`
        // and `status` and always inserts an empty in_progress workout), so
        // create first, then PATCH the real payload onto the new id —
        // otherwise the user's first save silently drops every set.
        const created: any = await Api.startWorkout({
          day_index: dayIdx,
          protocol_id: prot.data?.id,
        });
        if (created?.id) {
          await Api.patchWorkout(Number(created.id), { sets, status });
        }
      }
      await wk.refresh();
      adh.refresh();
      if (status === 'completed') Alert.alert('Workout saved', 'Nice work.');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader title="Train" subtitle={day?.name} />

      <ScrollView
        contentContainerStyle={st.body}
        refreshControl={
          <RefreshControl
            refreshing={prot.refreshing || wk.refreshing}
            onRefresh={() => {
              prot.refresh();
              wk.refresh();
              adh.refresh();
            }}
            tintColor={C.muted}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Adherence today */}
        <Card>
          <View style={st.rowBetween}>
            <H2>Adherence today</H2>
            <Chip label={`${adh.data?.score_pct ?? 0}%`} />
          </View>
          <Muted>{adh.data?.coach_message || 'Log your sets as you go.'}</Muted>
        </Card>

        {/* Planned days */}
        {split.length > 0 ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
              {split.map((d: any, i: number) => (
                <Text
                  key={i}
                  onPress={() => setDayIdx(i)}
                  style={[st.dayChip, i === dayIdx && st.dayChipOn]}
                >
                  {d.name}
                </Text>
              ))}
            </ScrollView>

            <Card>
              <View style={st.rowBetween}>
                <H2>{day?.name ?? 'Workout'}</H2>
                <Chip label={`${doneCount}/${rows.length} sets`} />
              </View>

              {grouped.map((g) => (
                <View key={g.ex} style={st.exBlock}>
                  <Text style={st.exName}>{g.ex}</Text>

                  {g.idxs.map((i, n) => (
                    <View key={i} style={st.setRow}>
                      <Text
                        onPress={() => edit(i, { done: !rows[i].done })}
                        style={[st.tick, rows[i].done && st.tickOn]}
                      >
                        {rows[i].done ? '✓' : String(n + 1)}
                      </Text>

                      <TextInput
                        value={rows[i].reps}
                        onChangeText={(v) => edit(i, { reps: v })}
                        placeholder="reps"
                        placeholderTextColor={C.muted}
                        style={st.input}
                      />
                      <Text style={st.x}>×</Text>
                      <TextInput
                        value={rows[i].kg}
                        onChangeText={(v) => edit(i, { kg: v })}
                        placeholder="kg"
                        placeholderTextColor={C.muted}
                        keyboardType="numeric"
                        style={st.input}
                      />

                      <Text onPress={() => removeSet(i)} style={st.del}>
                        ✕
                      </Text>
                    </View>
                  ))}

                  <Text onPress={() => addSet(g.idxs[g.idxs.length - 1], g.ex)} style={st.addSet}>
                    + add set
                  </Text>
                </View>
              ))}

              <Btn
                label={busy ? 'Saving…' : loggedId ? 'Update workout' : 'Save workout'}
                onPress={() => save('in_progress')}
                loading={busy}
                style={{ marginTop: 12 }}
              />
              <Btn
                label="Finish workout"
                kind="mint"
                onPress={() => save('completed')}
                disabled={busy}
                style={{ marginTop: 8 }}
              />
            </Card>
          </>
        ) : (
          <Card>
            <H2>No training split yet</H2>
            <Muted>Build a plan to get your split.</Muted>
          </Card>
        )}

        <SportSession />
        <CardioCheckin onSaved={() => adh.refresh()} />

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

/** Sport session — POST /sessions */
function SportSession() {
  const [sport, setSport] = useState('');
  const [type, setType] = useState('');
  const [dur, setDur] = useState('');
  const [rpe, setRpe] = useState('');
  const [busy, setBusy] = useState(false);

  async function log() {
    setBusy(true);
    try {
      await Api.logSession({
        sport: sport || undefined,
        session_type: type || undefined,
        duration_min: dur ? Number(dur) : undefined,
        intensity_rpe: rpe ? Number(rpe) : undefined,
      });
      setSport('');
      setType('');
      setDur('');
      setRpe('');
      Alert.alert('Session logged');
    } catch (e: any) {
      Alert.alert('Could not log session', e?.message || '');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <H2>Sport session</H2>
      <View style={st.pair}>
        <TextInput value={sport} onChangeText={setSport} placeholder="Sport (e.g. soccer)" placeholderTextColor={C.muted} style={[st.input, st.flex]} />
        <TextInput value={type} onChangeText={setType} placeholder="Type (e.g. practice)" placeholderTextColor={C.muted} style={[st.input, st.flex]} />
      </View>
      <View style={st.pair}>
        <TextInput value={dur} onChangeText={setDur} placeholder="Minutes" placeholderTextColor={C.muted} keyboardType="number-pad" style={[st.input, st.flex]} />
        <TextInput value={rpe} onChangeText={setRpe} placeholder="RPE 1–10" placeholderTextColor={C.muted} keyboardType="number-pad" style={[st.input, st.flex]} />
      </View>
      <Btn label={busy ? 'Logging…' : 'Log session'} onPress={log} loading={busy} style={{ marginTop: 10 }} />
    </Card>
  );
}

/** Cardio check-in — POST /checkins { bodyweight_kg, cardio_minutes, notes } */
function CardioCheckin({ onSaved }: { onSaved: () => void }) {
  const [kg, setKg] = useState('');
  const [cardio, setCardio] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await Api.checkin({
        bodyweight_kg: kg ? Number(kg) : undefined,
        cardio_minutes: cardio ? Number(cardio) : undefined,
      });
      setKg('');
      setCardio('');
      onSaved();
      Alert.alert('Check-in saved');
    } catch (e: any) {
      Alert.alert('Could not save check-in', e?.message || '');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <H2>Cardio check-in</H2>
      <Muted>Bodyweight and cardio minutes for today.</Muted>
      <View style={st.pair}>
        <TextInput value={kg} onChangeText={setKg} placeholder="Weight (kg)" placeholderTextColor={C.muted} keyboardType="numeric" style={[st.input, st.flex]} />
        <TextInput value={cardio} onChangeText={setCardio} placeholder="Cardio (min)" placeholderTextColor={C.muted} keyboardType="number-pad" style={[st.input, st.flex]} />
      </View>
      <Btn label={busy ? 'Saving…' : 'Save check-in'} onPress={save} loading={busy} style={{ marginTop: 10 }} />
    </Card>
  );
}

const st = StyleSheet.create({
  body: { padding: 14, gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  chips: { gap: 8, paddingVertical: 2 },
  dayChip: {
    color: C.muted,
    fontFamily: F.bodyMed,
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: C.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    overflow: 'hidden',
  },
  dayChipOn: { color: '#fff', backgroundColor: C.orange, borderColor: C.orange },
  exBlock: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, paddingTop: 10 },
  exName: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13, marginBottom: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tick: {
    width: 28,
    height: 28,
    borderRadius: R.pill,
    textAlign: 'center',
    lineHeight: 28,
    color: C.muted,
    backgroundColor: C.card2,
    fontFamily: F.bodySemi,
    fontSize: 12,
    overflow: 'hidden',
  },
  tickOn: { color: '#fff', backgroundColor: C.mint },
  input: {
    color: C.ink,
    fontFamily: F.bodyMed,
    fontSize: 13,
    backgroundColor: C.card2,
    borderRadius: R.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 66,
    textAlign: 'center',
  },
  flex: { flex: 1, textAlign: 'left' },
  pair: { flexDirection: 'row', gap: 8, marginTop: 8 },
  x: { color: C.muted, fontFamily: F.body, fontSize: 12 },
  del: { color: C.danger, fontSize: 13, paddingHorizontal: 6 },
  addSet: { color: C.orange, fontFamily: F.bodySemi, fontSize: 12, marginTop: 4 },
});
