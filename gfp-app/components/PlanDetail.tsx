import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, H2, Muted, Chip } from './ui';
import { macroTargets } from '../src/lib/macros';
import { C, F, R } from '../constants/gfp';

// Renders the full protocol the server computed - macro targets, the complete
// training split with every exercise and set scheme, and the meal structure -
// so My Plan shows the same depth as the PDF instead of just a headline number.
// All of this already arrives in GET /companion/protocols/active; the app just
// was not drawing it.

interface Exercise { n?: string; s?: string }
interface SplitDay { name?: string; ex?: Exercise[] }

export function PlanDetail({ protocol }: { protocol: any }) {
  const c = protocol?.computed;
  if (!c) return null;

  const kcal = Number(c.target_kcal) || 0;
  const macros = macroTargets(kcal, protocol?.builder_state);
  const split: SplitDay[] = Array.isArray(c.split) ? c.split : [];

  return (
    <>
      <Card>
        <H2>Daily targets</H2>
        <View style={s.macroGrid}>
          <Macro label="Calories" value={`${kcal}`} unit="kcal" accent={C.orange} />
          <Macro label="Protein" value={`${macros.protein}`} unit="g" accent={C.mint} />
          <Macro label="Carbs" value={`${macros.carbs}`} unit="g" />
          <Macro label="Fat" value={`${macros.fat}`} unit="g" />
        </View>
        {!macros.exact && (
          <Muted>Add your bodyweight in Build My Plan for an exact protein target.</Muted>
        )}
      </Card>

      {split.length > 0 && (
        <Card>
          <View style={s.rowBetween}>
            <H2>Training split</H2>
            <Chip label={`${split.length} days`} />
          </View>
          {split.map((d, i) => (
            <View key={i} style={s.day}>
              <Text style={s.dayName}>{d.name || `Day ${i + 1}`}</Text>
              {(Array.isArray(d.ex) ? d.ex : []).map((e, j) => (
                <View key={j} style={s.exRow}>
                  <Text style={s.exName}>{e.n || 'Exercise'}</Text>
                  {!!e.s && <Text style={s.exScheme}>{e.s}</Text>}
                </View>
              ))}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <H2>Nutrition structure</H2>
        <View style={s.line}>
          <Text style={s.lineLabel}>Goal</Text>
          <Text style={s.lineValue}>{c.goal || '-'}</Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>Meals per day</Text>
          <Text style={s.lineValue}>{c.meals_count ?? '-'}</Text>
        </View>
        {!!c.meals_count && kcal > 0 && (
          <View style={s.line}>
            <Text style={s.lineLabel}>Per meal (recommended)</Text>
            <Text style={s.lineValue}>{`~${Math.round(kcal / c.meals_count)} kcal, ${Math.round(macros.protein / c.meals_count)}g protein`}</Text>
          </View>
        )}
        <View style={s.line}>
          <Text style={s.lineLabel}>Training days / week</Text>
          <Text style={s.lineValue}>{c.training_days ?? split.length}</Text>
        </View>
        {!!protocol?.protocol_path && (
          <View style={s.line}>
            <Text style={s.lineLabel}>Protocol</Text>
            <Text style={s.lineValue}>{String(protocol.protocol_path)}</Text>
          </View>
        )}
      </Card>
    </>
  );
}

function Macro({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: string }) {
  return (
    <View style={s.macro}>
      <Text style={[s.macroValue, accent ? { color: accent } : null]}>
        {value}
        <Text style={s.macroUnit}> {unit}</Text>
      </Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  macro: { width: '50%', paddingVertical: 8 },
  macroValue: { color: C.ink, fontFamily: F.headingX, fontSize: 22 },
  macroUnit: { color: C.muted, fontFamily: F.heading, fontSize: 12 },
  macroLabel: { color: C.muted, fontFamily: F.body, fontSize: 12, marginTop: 2 },
  day: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, paddingTop: 10 },
  dayName: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14, marginBottom: 6 },
  exRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  exName: { flex: 1, color: C.ink, fontFamily: F.body, fontSize: 13 },
  exScheme: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12, marginLeft: 10 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  lineLabel: { color: C.muted, fontFamily: F.body, fontSize: 13 },
  lineValue: { color: C.ink, fontFamily: F.bodySemi, fontSize: 13, textTransform: 'capitalize' },
});
