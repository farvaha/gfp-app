import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocale } from '../src/i18n/locale';
import { Card, H2, Muted, Btn, Chip } from './ui';
import { sharePlanPdf } from '../src/lib/pdf';
import { trDayName } from '../src/i18n/food';
import { C, F } from '../constants/gfp';

/** Renders the server engine's rich plan: supplements, progression and the
 *  full report, plus the PDF export button. Same cards, same look. */
export function RichPlan({ rich }: { rich: any }) {
  const { t } = useLocale();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const supps = rich?.supplements ?? [];
  const prog = rich?.training?.progression ?? {};
  const report = rich?.report ?? [];
  const split = rich?.training?.split ?? [];

  return (
    <>
      <Card>
        <View style={st.rowBetween}>
          <H2>{t('plan.suppStack')}</H2>
          <Chip label={`${supps.length}`} />
        </View>
        {supps.map((sx: any, i: number) => (
          <View key={i} style={st.suppRow}>
            <View style={st.suppHead}>
              <Text style={st.suppName}>{sx.name}</Text>
              <Text style={st.suppDose}>{sx.dose}</Text>
            </View>
            <Text style={st.suppTiming}>{sx.timing}</Text>
            <Text style={st.suppWhy}>{sx.reason}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <H2>{t('plan.progression')}</H2>
        <Text style={st.progRule}>{prog.rule}</Text>
        <Text style={st.progDeload}>{prog.deload}</Text>
        {!!prog.cardio && (
          <>
            <Text style={st.progLabel}>{t('plan.cardio')}</Text>
            <Text style={st.progRule}>{prog.cardio}</Text>
          </>
        )}
      </Card>

      {split.length > 0 && (
        <Card>
          <H2>{t('plan.setsDetail')}</H2>
          {split.map((d: any, i: number) => (
            <View key={i}>
              <Pressable onPress={() => setOpen((p) => ({ ...p, ['d' + i]: !p['d' + i] }))} style={st.secHead}>
                <Text style={st.secTitle}>{trDayName(d.name)}</Text>
                <Text style={st.secChevron}>{open['d' + i] ? '▾' : '▸'}</Text>
              </Pressable>
              {open['d' + i] &&
                (d.blocks ?? []).map((b: any, j: number) => (
                  <View key={j} style={st.exRow}>
                    <Text style={st.exName}>{b.ex}</Text>
                    <Text style={st.exMeta}>{b.sets} × {b.reps} · {b.rest_s}s</Text>
                  </View>
                ))}
            </View>
          ))}
        </Card>
      )}

      <Card>
        <H2>{t('plan.reportTitle')}</H2>
        {report.map((r: any, i: number) => (
          <View key={i}>
            <Pressable onPress={() => setOpen((p) => ({ ...p, ['r' + i]: !p['r' + i] }))} style={st.secHead}>
              <Text style={st.secTitle}>{r.title}</Text>
              <Text style={st.secChevron}>{open['r' + i] ? '▾' : '▸'}</Text>
            </Pressable>
            {open['r' + i] && <Text style={st.secBody}>{r.body}</Text>}
          </View>
        ))}
        <Btn label={t('plan.downloadPdf')} onPress={() => sharePlanPdf(rich)} style={{ marginTop: 14 }} />
        <Muted>{t('plan.pdfHint')}</Muted>
      </Card>
    </>
  );
}

const st = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suppRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, paddingVertical: 9 },
  suppHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  suppName: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14, flexShrink: 1 },
  suppDose: { color: C.orange, fontFamily: F.bodyMed, fontSize: 13 },
  suppTiming: { color: C.mint, fontFamily: F.body, fontSize: 12, marginTop: 2 },
  suppWhy: { color: C.muted, fontFamily: F.body, fontSize: 12, marginTop: 2, lineHeight: 17 },
  progRule: { color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 20, marginTop: 6 },
  progDeload: { color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 18, marginTop: 6 },
  progLabel: { color: C.muted, fontFamily: F.bodyMed, fontSize: 11, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  secTitle: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14 },
  secChevron: { color: C.orange, fontFamily: F.bodySemi, fontSize: 14 },
  secBody: { color: C.muted, fontFamily: F.body, fontSize: 13, lineHeight: 20, paddingBottom: 10 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 10 },
  exName: { color: C.ink, fontFamily: F.body, fontSize: 13, flexShrink: 1 },
  exMeta: { color: C.muted, fontFamily: F.bodyMed, fontSize: 12 },
});
