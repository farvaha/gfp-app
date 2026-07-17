import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Card, H2, Muted, Btn, Chip } from '../../components/ui';
import { AppHeader } from '../../components/AppHeader';
import { useCached } from '../../src/hooks/useCached';
import { Api } from '../../src/api/client';
import { EP } from '../../src/api/endpoints';
import { C, F, R } from '../../constants/gfp';

export default function HistoryScreen() {
  const dates = useCached<any>('history-dates', EP.historyDates);
  const [picked, setPicked] = useState<string | null>(null);
  const [day, setDay] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Coerce to plain date strings — the server has occasionally returned objects
  // here, and rendering a non-string (or calling .slice on it) would crash the
  // whole tab. Normalise defensively so this screen can't take the app down.
  const rawDates = dates.data?.dates;
  const list: string[] = Array.isArray(rawDates)
    ? rawDates
        .map((x: any) => (typeof x === 'string' ? x : x?.date ?? x?.d ?? x?.log_date ?? ''))
        .filter((x: any): x is string => typeof x === 'string' && x.length > 0)
    : [];
  const active =
    picked ?? (typeof dates.data?.today === 'string' ? dates.data.today : list[0]) ?? null;

  useEffect(() => {
    if (!active) return;
    let alive = true;
    setLoading(true);
    Api.dailySummary(active)
      .then((d) => alive && setDay(d))
      .catch(() => alive && setDay(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [active]);

  const analysis = day?.analysis;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader title="History" subtitle={active ?? undefined} />
      <ScrollView
        contentContainerStyle={st.body}
        refreshControl={<RefreshControl refreshing={dates.refreshing} onRefresh={dates.refresh} tintColor={C.muted} />}
      >
        {list.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
            {list.slice(0, 30).map((d) => (
              <Text key={d} onPress={() => setPicked(d)} style={[st.chip, d === active && st.chipOn]}>
                {String(d).length > 5 ? String(d).slice(5) : String(d)}
              </Text>
            ))}
          </ScrollView>
        )}

        {/* Recent log */}
        <Card>
          <View style={st.rowBetween}>
            <H2>Daily log</H2>
            {day?.adherence?.score_pct != null && <Chip label={`${day.adherence.score_pct}%`} />}
          </View>

          {loading ? (
            <Muted>Loading…</Muted>
          ) : !day ? (
            <Muted>Nothing logged for this day.</Muted>
          ) : (
            <>
              <Text style={st.sub}>Meals ({day.meals?.length ?? 0})</Text>
              {(day.meals ?? []).length === 0 ? (
                <Muted>No meals logged.</Muted>
              ) : (
                day.meals.map((m: any, i: number) => (
                  <Text key={i} style={st.line}>
                    • {m.raw_text || m.meal_slot || 'Meal'} — {Math.round(Number(m.est_kcal ?? m.kcal) || 0)} kcal, {Math.round(Number(m.est_protein_g ?? m.protein_g ?? m.protein) || 0)}g protein
                  </Text>
                ))
              )}

              <Text style={st.sub}>Workouts ({day.workouts?.length ?? 0})</Text>
              {(day.workouts ?? []).length === 0 ? (
                <Muted>No workout logged.</Muted>
              ) : (
                day.workouts.map((w: any, i: number) => (
                  <Text key={i} style={st.line}>
                    • {w.title || w.day || (w.day_index ? `Day ${w.day_index}` : 'Workout')} — {w.status || 'logged'}
                  </Text>
                ))
              )}

              {!!day.checkin && (
                <>
                  <Text style={st.sub}>Check-in</Text>
                  <Text style={st.line}>
                    • {day.checkin.bodyweight_kg ? `${day.checkin.bodyweight_kg} kg` : '—'}
                    {day.checkin.cardio_minutes ? ` · ${day.checkin.cardio_minutes} min cardio` : ''}
                  </Text>
                </>
              )}
            </>
          )}
        </Card>

        {/* End-of-day analysis */}
        <Card>
          <H2>End-of-day analysis</H2>
          {analysis ? (
            <Text style={st.analysis}>
              {typeof analysis === 'string' ? analysis : analysis.text || JSON.stringify(analysis)}
            </Text>
          ) : (
            <Muted>Log your day and your analysis appears here.</Muted>
          )}
        </Card>

        <NearbyFitness />
        <NotificationPrefs />

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

/** Nearby Fitness — GET /companion/places */
function NearbyFitness() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function search() {
    setBusy(true);
    try {
      const r = await Api.places(q || undefined);
      setItems(r?.places ?? r?.items ?? r?.results ?? []);
    } catch {
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <H2>Nearby fitness</H2>
      <Muted>Gyms, studios and healthy food near you.</Muted>
      <View style={st.searchRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Area or city"
          placeholderTextColor={C.muted}
          style={[st.input, { flex: 1 }]}
        />
        <Btn label={busy ? '…' : 'Find'} onPress={search} loading={busy} />
      </View>
      {items && items.length === 0 && <Muted>Nothing found.</Muted>}
      {(items ?? []).slice(0, 8).map((p: any, i: number) => (
        <Text key={i} style={st.line}>
          • {p.name || p.title} {p.address ? `— ${p.address}` : ''}
        </Text>
      ))}
    </Card>
  );
}

/** Notifications — GET/PUT /companion/notifications/prefs */
function NotificationPrefs() {
  const [p, setP] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Api.notifPrefs()
      .then(setP)
      .catch(() => {});
  }, []);

  async function toggle(key: string, v: boolean) {
    const next = { ...(p ?? {}), [key]: v };
    setP(next);
    setBusy(true);
    try {
      await Api.saveNotifPrefs({
        meals_enabled: !!next.meals_enabled,
        workouts_enabled: !!next.workouts_enabled,
        checkins_enabled: !!next.checkins_enabled,
        email_enabled: !!next.email_enabled,
      });
    } catch {
      /* keep optimistic state; it'll re-sync on next open */
    } finally {
      setBusy(false);
    }
  }

  const Row = ({ k, label }: { k: string; label: string }) => (
    <View style={st.prefRow}>
      <Text style={st.prefLabel}>{label}</Text>
      <Switch
        value={!!p?.[k]}
        onValueChange={(v) => toggle(k, v)}
        disabled={!p || busy}
        trackColor={{ true: C.mint, false: C.card2 }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <Card>
      <H2>Notifications</H2>
      {!p ? (
        <Muted>Loading…</Muted>
      ) : (
        <>
          <Row k="meals_enabled" label="Meal reminders" />
          <Row k="workouts_enabled" label="Workout reminders" />
          <Row k="checkins_enabled" label="Check-in reminders" />
          <Row k="email_enabled" label="Email updates" />
        </>
      )}
    </Card>
  );
}

const st = StyleSheet.create({
  body: { padding: 14, gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    color: C.muted,
    fontFamily: F.bodyMed,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: C.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.line,
    overflow: 'hidden',
  },
  chipOn: { color: '#fff', backgroundColor: C.orange, borderColor: C.orange },
  sub: { color: C.ink, fontFamily: F.bodySemi, fontSize: 12, marginTop: 12, marginBottom: 4 },
  line: { color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 19 },
  analysis: { color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 20 },
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10, marginBottom: 8 },
  input: {
    color: C.ink,
    fontFamily: F.bodyMed,
    fontSize: 13,
    backgroundColor: C.card2,
    borderRadius: R.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  prefLabel: { color: C.ink, fontFamily: F.bodyMed, fontSize: 13 },
});
