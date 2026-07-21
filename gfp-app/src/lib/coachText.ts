// The coach endpoints return structured objects. Older builds dropped them
// straight into a <Text> via JSON.stringify, so users saw raw braces, quotes
// and key names on screen. This turns one of those payloads into plain,
// readable prose. It never throws: anything unexpected degrades to a string.

function toLines(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map((x: any) => (typeof x === 'string' ? x : x && typeof x.text === 'string' ? x.text : ''))
      .filter((x: string) => !!x && x.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function coerce(input: any): any {
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

export function formatCoach(input: any): string {
  const d = coerce(input);
  if (!d) return '';

  const out: string[] = [];
  if (typeof d.headline === 'string' && d.headline.trim()) out.push(d.headline.trim());

  const summary =
    typeof d.summary === 'string' ? d.summary : typeof d.text === 'string' ? d.text : '';
  if (summary.trim()) out.push(summary.trim());

  const groups: Array<[string, string[]]> = [
    ['', toLines(d.highlights)],
    ['Wins', toLines(d.wins)],
    ['Focus next', toLines(d.focus)],
  ];
  groups.forEach(([title, lines]) => {
    if (lines.length === 0) return;
    const block = lines.map((l) => '- ' + l).join('\n');
    out.push(title ? title + '\n' + block : block);
  });

  if (typeof d.protein_verdict === 'string' && d.protein_verdict.trim()) {
    out.push(d.protein_verdict.trim());
  }
  if (typeof d.coach_message === 'string' && d.coach_message.trim()) {
    out.push(d.coach_message.trim());
  }

  return out.join('\n\n');
}
