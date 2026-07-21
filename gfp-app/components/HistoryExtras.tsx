import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Card, H2, Muted, Btn } from './ui';
import { PlanBody } from './PlanBody';
import { useCached } from '../src/hooks/useCached';
import { Api } from '../src/api/client';
import { EP } from '../src/api/endpoints';
import { C, F } from '../constants/gfp';

/** The full Build My Plan report - the same content as the PDF - rendered
 *  natively from GET /companion/plan instead of being hidden behind a link. */
export function FullPlanCard() {
  const plan = useCached<any>('plan-full', EP.plan);
  const text = typeof plan.data?.plan === 'string' ? plan.data.plan : '';
  return (
    <Card>
      <H2>Your full plan</H2>
      {!text && plan.refreshing && <Muted>Loading your plan...</Muted>}
      {!text && !plan.refreshing && (
        <Muted>Build your plan and the full report appears here.</Muted>
      )}
      {!!text && <PlanBody text={text} />}
    </Card>
  );
}

/** Nearby gyms and supplement stores. The server searches Google Places by
 *  coordinates, so we ask the device for a fix rather than sending free text -
 *  the old town-name box was ignored by the API, which is why it never worked. */
export function NearbyPlaces() {
  const [kind, setKind] = useState<'gym' | 'store'>('gym');
  const [items, setItems] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const run = useCallback(async (which: 'gym' | 'store') => {
    setKind(which);
    setBusy(true);
    setMsg('');
    setItems(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setMsg('Allow location access to find places near you.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const r = await Api.places({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        kind: which,
      });
      if (r && r.enabled === false) {
        setMsg('Nearby search is not switched on for this site yet.');
        return;
      }
      const list = Array.isArray(r?.places) ? r.places : [];
      setItems(list);
      if (list.length === 0) setMsg('Nothing found near you.');
    } catch (e: any) {
      setMsg(e?.message || 'Could not search right now.');
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Card>
      <H2>Nearby gyms and supplement stores</H2>
      <Muted>Uses your current location to find places close by.</Muted>
      <View style={s.row}>
        <Btn
          label="Find gyms"
          onPress={() => run('gym')}
          loading={busy && kind === 'gym'}
          style={{ flex: 1 }}
        />
        <Btn
          label="Supplement stores"
          kind="ghost"
          onPress={() => run('store')}
          loading={busy && kind === 'store'}
          style={{ flex: 1 }}
        />
      </View>
      {!!msg && <Muted>{msg}</Muted>}
      {(items ?? []).slice(0, 10).map((p: any, i: number) => (
        <View key={i} style={s.item}>
          <Text style={s.name}>{p.name || p.title || 'Place'}</Text>
          {(!!p.address || !!p.rating) && (
            <Text style={s.meta}>
              {p.address ? String(p.address) : ''}
              {p.rating ? (p.address ? ' - ' : '') + String(p.rating) : ''}
            </Text>
          )}
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
  meta: { color: C.muted, fontFamily: F.body, fontSize: 11, marginTop: 2 },
});
