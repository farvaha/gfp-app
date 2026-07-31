// Localises the client-side meal engine output (names, times, notes, food
// lines) and training day names. English is the canonical engine language;
// these helpers translate known patterns at render time.
import { translate as t, getLocale } from './locale';

export function fmt(template: string, vars: Record<string, string | number>): string {
  let out = template;
  Object.keys(vars).forEach((k) => {
    out = out.split('{' + k + '}').join(String(vars[k]));
  });
  return out;
}

function tr(key: string, fallback: string): string {
  const v = t(key);
  return v === key ? fallback : v;
}

export function trMealName(name: string): string {
  const raw = String(name || '');
  const m = raw.match(/^(.*?)( 2)?$/);
  const base = (m && m[1]) || raw;
  const suffix = m && m[2] ? ' 2' : '';
  const key = 'meal.' + base.toLowerCase().replace(/[^a-z]/g, '');
  return tr(key, base) + suffix;
}

export function trMealTime(time: string): string {
  const s = String(time || '');
  if (s === '1-2 h before training') return tr('time.preTrain', s);
  if (s === 'within 1-2 h after training') return tr('time.postTrain', s);
  if (s === '30 min before sleep') return tr('time.beforeSleep', s);
  return s;
}

const NOTE_KEYS: Record<string, string> = {
  'Carb-led so you have fuel in the tank.': 'note.pre',
  'Protein plus fast carbs to refill glycogen.': 'note.post',
  'Protein first thing steadies appetite for the day.': 'note.breakfast',
  'Keeps protein feeding steady between meals.': 'note.midam',
  'Your biggest balanced plate of the day.': 'note.lunch',
  'Bridges the gap so dinner is not a binge.': 'note.midpm',
  'Protein and vegetables, fats land here.': 'note.dinner',
  'Slow protein supports overnight recovery.': 'note.night',
};

export function trMealNote(note: string): string {
  const key = NOTE_KEYS[String(note || '')];
  return key ? tr(key, note) : note;
}

export function trFood(term: string): string {
  const slug = 'food.' + String(term || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return tr(slug, term);
}

/** Translate one generated food line, e.g. "110 g chicken breast (about 27 g protein)". */
export function trFoodLine(line: string): string {
  if (getLocale() === 'en') return line;
  const s = String(line || '');
  let m = s.match(/^(\d+) g (.+) \(about (\d+) g (protein|carbs)\)$/);
  if (m) {
    const macroWord = m[4] === 'protein' ? tr('food.gProtein', 'g protein') : tr('food.gCarbs', 'g carbs');
    return m[1] + ' g ' + trFood(m[2]) + ' (' + tr('food.about', 'about') + ' ' + m[3] + ' ' + macroWord + ')';
  }
  m = s.match(/^(.+) \(about (\d+) g fat\)$/);
  if (m) {
    return trFood(m[1]) + ' (' + tr('food.about', 'about') + ' ' + m[2] + ' ' + tr('food.gFat', 'g fat') + ')';
  }
  m = s.match(/^a handful of (.+)$/);
  if (m) return tr('food.handful', 'a handful of') + ' ' + trFood(m[1]);
  return s;
}

/** Localised "N meals a day, about X kcal and Y g protein each". */
export function trMealSummary(n: number, kcalEach: number, proteinEach: number): string {
  return fmt(tr('today.mealsAbout', '{n} meals a day, about {kcal} kcal and {p} g protein each'), {
    n, kcal: kcalEach, p: proteinEach,
  });
}

const DAY_TOKENS: Record<string, string> = {
  chest: 'muscle.chest', back: 'muscle.back', shoulders: 'muscle.shoulders',
  shoulder: 'muscle.shoulders', arms: 'muscle.arms', arm: 'muscle.arms',
  legs: 'muscle.legs', leg: 'muscle.legs', biceps: 'muscle.biceps',
  triceps: 'muscle.triceps', glutes: 'muscle.glutes', core: 'muscle.core',
  abs: 'muscle.core', forearms: 'muscle.forearms', calves: 'muscle.calves',
  push: 'muscle.push', pull: 'muscle.pull', upper: 'muscle.upper',
  lower: 'muscle.lower', rest: 'muscle.rest',
};

/** Translate a split day name like "Chest + back" or "Full body". */
export function trDayName(name: string): string {
  const raw = String(name || '');
  if (getLocale() === 'en' || !raw) return raw;
  if (/^full ?body$/i.test(raw.trim())) return tr('muscle.fullbody', raw);
  return raw
    .split('+')
    .map((part) => {
      const p = part.trim();
      const key = DAY_TOKENS[p.toLowerCase()];
      return key ? tr(key, p) : p;
    })
    .join(' + ');
}

/** Localised goal value ("gain" -> localized). */
export function trGoal(goal: string): string {
  const g = String(goal || '').toLowerCase();
  const map: Record<string, string> = {
    gain: 'goal.gain', lose: 'goal.lose', cut: 'goal.cut',
    maintain: 'goal.maintain', recomp: 'goal.recomp', general: 'goal.general',
  };
  return map[g] ? tr(map[g], goal) : goal;
}

/** Localised protocol path value using existing quiz keys. */
export function trProtocol(path: string): string {
  const p = String(path || '').toLowerCase();
  const map: Record<string, string> = {
    general: 'quiz.general', bro: 'quiz.bro', calisthenics: 'quiz.calisthenics',
    comp: 'quiz.comp', aesthetics: 'quiz.aesthetics', skills: 'quiz.skills',
  };
  return map[p] ? tr(map[p], path) : path;
}
