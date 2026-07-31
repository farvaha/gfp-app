// Translates the server's templated coach text (daily analysis + adherence
// focus lines) into the app language. The server always emits English from a
// fixed set of sprintf templates, so we can match and re-render them locally.
import { translate as t, getLocale } from './locale';
import { fmt } from './food';

function tr(key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

type Rule = { re: RegExp; key: string; vars: string[] };

const RULES: Rule[] = [
  { re: /^(\d+) meals logged · (\d+) kcal estimated$/, key: 'coach.mealsLogged', vars: ['n', 'kcal'] },
  { re: /^No meals logged this day\.$/, key: 'coach.noMeals', vars: [] },
  { re: /^(\d+) workout\(s\) · (\d+) kg volume · ~(\d+) kcal burned$/, key: 'coach.workouts', vars: ['n', 'vol', 'kcal'] },
  { re: /^No completed workouts this day\.$/, key: 'coach.noWorkouts', vars: [] },
  { re: /^posing done$/, key: 'coach.posingDone', vars: [] },
  { re: /^Check-in saved\.$/, key: 'coach.checkinSaved', vars: [] },
  { re: /^No prep check-in this day\.$/, key: 'coach.noCheckin', vars: [] },
  { re: /^Strong day — meals, training and check-in all on track\.$/, key: 'coach.strongDay', vars: [] },
  { re: /^Solid adherence — keep the momentum\.$/, key: 'coach.solid', vars: [] },
  { re: /^Partial log — review gaps below and plan tomorrow\.$/, key: 'coach.partial', vars: [] },
  { re: /^No activity recorded for this day\.$/, key: 'coach.noActivity', vars: [] },
  { re: /^Dialed in — nutrition, training and check-in all on plan\.$/, key: 'coach.dialedIn', vars: [] },
  { re: /^training behind: (\d+) left, (\d+) days? to go$/, key: 'coach.trainingBehind', vars: ['n', 'd'] },
  { re: /^train today to stay on pace$/, key: 'coach.trainToday', vars: [] },
  { re: /^protein (\d+)g behind pace$/, key: 'coach.proteinBehind', vars: ['n'] },
  { re: /^check-in pending$/, key: 'coach.checkinPending', vars: [] },
];

function translatePiece(piece: string): string {
  const s = piece.trim();
  if (!s) return piece;
  for (const rule of RULES) {
    const m = s.match(rule.re);
    if (m) {
      const vars: Record<string, string> = {};
      rule.vars.forEach((v, i) => { vars[v] = m[i + 1]; });
      const tpl = t(rule.key);
      if (tpl === rule.key) return piece; // no translation available
      return fmt(tpl, vars);
    }
  }
  // "Strong day. Left: X." / "On your way — X."
  let m = s.match(/^Strong day\. Left: (.+)\.$/);
  if (m) return fmt(tr('coach.strongLeft', s), { s: translateJoined(m[1]) });
  m = s.match(/^On your way — (.+)\.$/);
  if (m) return fmt(tr('coach.onWay', s), { s: translateJoined(m[1]) });
  // "Check-in: 74 kg ..." prefix
  if (s.startsWith('Check-in:')) return tr('coach.checkin', 'Check-in:') + s.slice('Check-in:'.length);
  // "Focus: a · b"
  if (s.startsWith('Focus:')) {
    return tr('coach.focus', 'Focus:') + ' ' + translateJoined(s.slice('Focus:'.length).trim().replace(/\.$/, '')) + '.';
  }
  return piece;
}

function translateJoined(s: string): string {
  return s.split('·').map((p) => translatePiece(p.trim())).join(' · ');
}

/** Translate a whole coach/analysis text block line by line. */
export function translateCoach(text: string): string {
  if (getLocale() === 'en' || !text) return text;
  return String(text)
    .split('\n')
    .map((line) => {
      const m = line.match(/^(\s*[-•]\s*)(.*)$/);
      if (m) return m[1] + translatePiece(m[2]);
      return translatePiece(line);
    })
    .join('\n');
}
