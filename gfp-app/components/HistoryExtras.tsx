import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { useLocale } from '../src/i18n/locale';
import { Card, H2, Muted, Btn } from './ui';
import { PlanBody } from './PlanBody';
import { useCached } from '../src/hooks/useCached';
import { Api } from '../src/api/client';
import { EP } from '../src/api/endpoints';
import { C, F } from '../constants/gfp';

/** The full Build My Plan report - the same content as the PDF - rendered
 *  natively from GET /companion/plan instead of being hidden behind a link. */
export function FullPlanCard() {
  const { t } = useLocale();
  const plan = useCached<any>('plan-full', EP.plan);
  const text = typeof plan.data?.plan === 'string' ? plan.data.plan : '';
  return (
    <Card>
      <H2>{t('plan.fullPlan')}</H2>
      {!text && plan.refreshing && <Muted>{t('plan.loadingPlan')}</Muted>}
      {!text && !plan.refreshing && (
        <Muted>{t('plan.buildHint')}</Muted>
      )}
      {!!text && <PlanBody text={text} />}
    </Card>
  );
}

/** Nearby gyms and supplement stores. The server searches Google Places by
 *  coordinates, so we ask the device for a fix rather than sending free text -
 *  the old town-name box was ignored by the API, which is why it never worked. */
export function NearbyPlaces() {
  const { t } = useLocale();
  const [kind, setKind] = useState<'gym' | 'store'>('gym');
  const [items, setItems] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Opens the phone's Maps app with a live search - the same results the
  // website's Nearby card shows via its Google Maps embed.
  const openMaps = useCallback(async (which: 'gym' | 'store', name?: string) => {
    const q = name || (which === 'store' ? 'supplement store' : 'gym');
    let c = coords;
    if (!c) {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const pos = await Location.getCurrentPositionAsync({});
          c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
        }
      } catch {}
    }
    const geo = c
      ? `geo:${c.lat},${c.lng}?q=${encodeURIComponent(q)}`
      : `geo:0,0?q=${encodeURIComponent(q)}`;
    const web = c
      ? `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${c.lat},${c.lng},14z`
      : `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
    try {
      await Linking.openURL(geo);
    } catch {
      try { await Linking.openURL(web); } catch {}
    }
  }, [coords]);

  const run = useCallback(async (which: 'gym' | 'store') => {
    setKind(which);
    setBusy(true);
    setMsg('');
    setItems(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setMsg(t('nearby.allowLocation'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      const r = await Api.places({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        kind: which,
      });
      if (r && r.enabled === false) {
        setMsg(t('nearby.notEnabled'));
        return;
      }
      const list = Array.isArray(r?.places) ? r.places : [];
      setItems(list);
      if (list.length === 0) setMsg(t('nearby.nothingNear'));
    } catch (e: any) {
      setMsg(e?.message || t('common.tryAgain'));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Card>
      <H2>{t('history.nearby')}</H2>
      <Muted>{t('history.nearbyHint')}</Muted>
      <View style={s.row}>
        <Btn
          label={t('nearby.findGyms')}
          onPress={() => run('gym')}
          loading={busy && kind === 'gym'}
          style={{ flex: 1 }}
        />
        <Btn
          label={t('nearby.stores')}
          kind="ghost"
          onPress={() => run('store')}
          loading={busy && kind === 'store'}
          style={{ flex: 1 }}
        />
      </View>
      {!!msg && <Muted>{msg}</Muted>}
      {(items ?? []).slice(0, 10).map((p: any, i: number) => (
        <TouchableOpacity key={i} style={s.item} onPress={() => openMaps(kind, String(p.name || p.title || ''))}>
          <Text style={s.name}>{p.name || p.title || 'Place'}</Text>
          {(!!p.address || !!p.rating) && (
            <Text style={s.meta}>
              {p.address ? String(p.address) : ''}
              {p.rating ? (p.address ? ' - ' : '') + String(p.rating) : ''}
            </Text>
          )}
        </TouchableOpacity>
      ))}
      <Btn
        label={t('nearby.openMaps')}
        kind="ghost"
        onPress={() => openMaps(kind)}
        style={{ marginTop: 10 }}
      />
      <Muted>{t('nearby.mapsHint')}</Muted>
    </Card>
  );
}

export function WorkoutDetail({ date }: { date?: string | null }) {
  const { t } = useLocale();
  const [sets, setSets] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    setLoading(true);
    Api.workouts(date)
      .then((r: any) => {
        if (!alive) return;
        const w = (Array.isArray(r?.workouts) && r.workouts[0]) || r?.active || null;
        setSets(Array.isArray(w?.sets) ? w.sets : []);
      })
      .catch(() => alive && setSets([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [date]);

  const groups: { ex: string; rows: any[] }[] = [];
  (sets || []).forEach((r: any) => {
    const ex = String(r.ex || r.n || r.name || "Exercise");
    const last = groups[groups.length - 1];
    if (last && last.ex === ex) last.rows.push(r);
    else groups.push({ ex, rows: [r] });
  });

  if (!date) return null;

  return (
    <Card>
      <H2>{t('history.exercisesDay')}</H2>
      {loading && !sets && <Muted>{t('history.loading')}</Muted>}
      {!!sets && groups.length === 0 && <Muted>{t('history.nothingDay')}</Muted>}
      {groups.map((g, i) => (
        <View key={i} style={s.exBlock}>
          <Text style={s.exName}>{g.ex}</Text>
          {g.rows.map((r: any, j: number) => (
            <Text key={j} style={s.setLine}>
              {"Set " + (j + 1) + ": " + (r.reps ? String(r.reps) : "-") + " reps" + (r.kg != null && r.kg !== "" ? "  x  " + String(r.kg) + " kg" : "")}
            </Text>
          ))}
        </View>
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 6 },
  item: {
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  name: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13 },
  exBlock: { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, paddingTop: 8 },
  exName: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13, marginBottom: 4 },
  setLine: { color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 19 },
  meta: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 2 },
});

/** Supplements taken on a given day — GET /companion/supplements?date= */
export function SupplementsDay({ date }: { date?: string | null }) {
  const { t } = useLocale();
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    Api.supplements(date)
      .then((r: any) => {
        if (alive) setItems(Array.isArray(r?.items) ? r.items : []);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [date]);

  if (!date) return null;

  return (
    <Card>
      <H2>{t('supp.forDay')}</H2>
      {items === null && <Muted>{t('history.loading')}</Muted>}
      {!!items && items.length === 0 && <Muted>{t('supp.empty')}</Muted>}
      {(items ?? []).map((it: any, i: number) => (
        <Text key={i} style={suppSt.line}>
          • {String(it.name || '')}
          {it.dose ? ` — ${it.dose}` : ''}
        </Text>
      ))}
    </Card>
  );
}

const suppSt = StyleSheet.create({
  line: { color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 21, marginTop: 4 },
});
