import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, F } from '../constants/gfp';

// The coach endpoints return structured objects (headline, summary, wins,
// focus, highlights...). Earlier builds pushed them through JSON.stringify, so
// users saw raw braces and quotes on screen. This renders the known fields as
// real text and quietly ignores bookkeeping keys like score_pct or meals_target.

function asList(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map((x: any) => (typeof x === 'string' ? x : x && typeof x.text === 'string' ? x.text : ''))
      .filter((x: string) => !!x && x.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

// Accepts an object, or a JSON string the server sometimes sends verbatim.
function parseSummary(input: any): any {
  if (!input) return null;
  if (typeof input === 'object') return input;
  if (typeof input === 'string') {
    const s = input.trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        return JSON.parse(s);
      } catch {
        return { summary: input };
      }
    }
    return { summary: input };
  }
  return null;
}

function Section({ title, items, accent }: { title: string; items: string[]; accent?: string }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, accent ? { color: accent } : null]}>{title}</Text>
      {items.map((line, i) => (
        <View key={i} style={s.row}>
          <Text style={[s.bullet, accent ? { color: accent } : null]}>-</Text>
          <Text style={s.item}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

export function AiSummary({ data, emptyText }: { data: any; emptyText?: string }) {
  const d = parseSummary(data);
  const fallback = emptyText || 'Nothing to show yet.';
  if (!d) return <Text style={s.muted}>{fallback}</Text>;

  const headline = typeof d.headline === 'string' ? d.headline : '';
  const summary =
    typeof d.summary === 'string' ? d.summary : typeof d.text === 'string' ? d.text : '';
  const coach = typeof d.coach_message === 'string' ? d.coach_message : '';
  const verdict = typeof d.protein_verdict === 'string' ? d.protein_verdict : '';
  const highlights = asList(d.highlights);
  const wins = asList(d.wins);
  const focus = asList(d.focus);

  const empty =
    !headline && !summary && !coach && !verdict &&
    highlights.length === 0 && wins.length === 0 && focus.length === 0;
  if (empty) return <Text style={s.muted}>{fallback}</Text>;

  return (
    <View>
      {!!headline && <Text style={s.headline}>{headline}</Text>}
      {!!summary && <Text style={s.body}>{summary}</Text>}
      {highlights.length > 0 && <Section title="Highlights" items={highlights} />}
      {wins.length > 0 && <Section title="Wins" items={wins} accent={C.mint} />}
      {focus.length > 0 && <Section title="Focus next" items={focus} />}
      {!!verdict && <Text style={s.note}>{verdict}</Text>}
      {!!coach && <Text style={s.coach}>{coach}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  headline: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14, lineHeight: 20, marginBottom: 6 },
  body: { color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 20 },
  section: { marginTop: 12 },
  sectionTitle: { color: C.ink, fontFamily: F.bodySemi, fontSize: 12, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  bullet: { color: C.muted, fontFamily: F.body, fontSize: 13, lineHeight: 19 },
  item: { flex: 1, color: C.muted, fontFamily: F.body, fontSize: 12, lineHeight: 19 },
  note: {
    color: C.ink,
    fontFamily: F.bodyMed,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  coach: {
    color: C.mint,
    fontFamily: F.bodyMed,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  muted: { color: C.muted, fontFamily: F.body, fontSize: 13, lineHeight: 20 },
});
