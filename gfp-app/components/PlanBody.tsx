import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, F } from '../constants/gfp';

/**
 * Dependency-free renderer for the plan text the server returns
 * (GET /companion/plan -> { plan }). The content is light markdown/HTML;
 * we render headings, bullet lists, bold, and paragraphs natively so the
 * "full plan" reads like part of the app instead of a web page.
 *
 * It is intentionally defensive: any weird input degrades to plain text
 * rather than throwing (this content used to render inside a WebView).
 */

function stripTags(s: string): string {
  return String(s ?? '')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|h[1-6]|li|ul|ol)\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, '’')
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"');
}

/** Split a line into <Text> spans, honouring **bold** markers. */
function renderInline(line: string, keyBase: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <Text key={`${keyBase}-b${i}`} style={styles.bold}>
          {p.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={`${keyBase}-t${i}`}>{p}</Text>;
  });
}

export function PlanBody({ text }: { text: string }) {
  let clean = '';
  try {
    clean = stripTags(text);
  } catch {
    clean = String(text ?? '');
  }

  const lines = clean.split('\n');
  const out: React.ReactNode[] = [];

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      out.push(<View key={`sp${i}`} style={{ height: 8 }} />);
      return;
    }
    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(
        <Text key={`h${i}`} style={level <= 2 ? styles.h1 : styles.h2}>
          {stripMd(h[2])}
        </Text>,
      );
      return;
    }
    // Bullets
    const b = line.match(/^([-*•])\s+(.*)$/);
    if (b) {
      out.push(
        <View key={`b${i}`} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{renderInline(b[2], `b${i}`)}</Text>
        </View>,
      );
      return;
    }
    // Paragraph
    out.push(
      <Text key={`p${i}`} style={styles.p}>
        {renderInline(line, `p${i}`)}
      </Text>,
    );
  });

  return <View>{out}</View>;
}

/** Drop leftover ** in heading text. */
function stripMd(s: string): string {
  return s.replace(/\*\*/g, '');
}

const styles = StyleSheet.create({
  h1: { color: C.ink, fontFamily: F.heading, fontSize: 17, marginTop: 12, marginBottom: 6 },
  h2: { color: C.ink, fontFamily: F.bodySemi, fontSize: 14, marginTop: 10, marginBottom: 4 },
  p: { color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 20, marginBottom: 2 },
  bold: { fontFamily: F.bodySemi, color: C.ink },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 3, paddingLeft: 2 },
  bulletDot: { color: C.orange, fontFamily: F.body, fontSize: 13, lineHeight: 20 },
  bulletText: { flex: 1, color: C.ink, fontFamily: F.body, fontSize: 13, lineHeight: 20 },
});
