// Training split + meal-structure library for the native Build My Plan quiz.
// Exercise lists mirror the website builder's output (taken from a protocol
// the site itself generated), so app-built plans match site-built ones.

export interface Ex { n: string; s: string }
export interface SplitDay { name: string; ex: Ex[] }

const S = (goal: string) => (goal === 'lose' ? '3 Ã 10â12' : '4 Ã 6â8');
const ACC = '3 Ã 12â15';

function d(name: string, goal: string, mains: string[], accs: string[]): SplitDay {
  return {
    name,
    ex: [
      ...mains.map((n) => ({ n, s: S(goal) })),
      ...accs.map((n) => ({ n, s: ACC })),
    ],
  };
}

export function buildSplit(style: string, days: number, goal: string): SplitDay[] {
  const g = goal || 'gain';
  const push = d('Push', g, ['Bench press', 'Overhead press', 'Incline dumbbell press', 'Triceps pushdown'], ['Lateral raise']);
  const pull = d('Pull', g, ['Lat pulldown', 'Barbell row', 'Face pull', 'Barbell curl'], ['Hanging leg raise']);
  const legs = d('Legs', g, ['Squat', 'Romanian deadlift', 'Leg press', 'Leg curl'], ['Standing calf raise']);
  const upper = d('Upper', g, ['Bench press', 'Barbell row', 'Overhead press', 'Lat pulldown'], ['Barbell curl', 'Triceps pushdown']);
  const lower = d('Lower', g, ['Squat', 'Romanian deadlift', 'Leg press', 'Leg curl'], ['Standing calf raise', 'Hanging leg raise']);
  const full = d('Full body', g, ['Squat', 'Bench press', 'Barbell row', 'Overhead press'], ['Hanging leg raise']);

  const bro: SplitDay[] = [
    d('Chest', g, ['Bench press', 'Incline dumbbell press', 'Cable chest fly', 'Triceps pushdown'], ['Hanging leg raise']),
    d('Back', g, ['Lat pulldown', 'Barbell row', 'Face pull', 'Barbell curl'], ['Hanging leg raise']),
    d('Shoulders', g, ['Overhead press', 'Lateral raise', 'Barbell shrug'], ['Hanging leg raise', 'Standing calf raise']),
    d('Arms', g, ['Barbell curl', 'Hammer curl', 'Triceps pushdown', 'Skull crushers'], ['Hanging leg raise']),
    legs,
    d('Chest + back', g, ['Bench press', 'Barbell row', 'Incline dumbbell press', 'Lat pulldown'], ['Cable chest fly']),
  ];

  const n = Math.min(6, Math.max(2, Math.round(days || 3)));
  if (style === 'bro') return bro.slice(0, n);
  if (style === 'upper_lower') {
    return [upper, lower, upper, lower, upper, lower].slice(0, n);
  }
  if (style === 'full_body') {
    return [full, full, full, full, full, full].slice(0, n).map((x, i) => ({ ...x, name: `Full body ${String.fromCharCode(65 + i)}` }));
  }
  // default: push / pull / legs
  return [push, pull, legs, push, pull, legs].slice(0, n);
}

// Meal count mirrors the site's behaviour (observed: 3579 kcal muscle-gain
// plan -> 7 meals). More food = more slots, bounded 4..7.
export function mealsFor(goal: string, kcal: number): number {
  const n = Math.round((kcal || 2200) / 500);
  return Math.min(7, Math.max(4, n));
}

export function perMeal(kcal: number, meals: number): number {
  if (!meals) return 0;
  return Math.round((kcal || 0) / meals);
}

// Calisthenics protocol days - bodyweight work, branched by focus.
export function buildCaliSplit(days: number, focus: string): SplitDay[] {
  const sch = '4 × 6–10';
  const skills: SplitDay = { name: 'Skills', ex: [
    { n: 'Handstand practice', s: '10 min' },
    { n: 'Tuck planche hold', s: '5 × 10s' },
    { n: 'Front lever tuck hold', s: '5 × 10s' },
    { n: 'Skin the cat', s: '3 × 5' },
  ] };
  const push: SplitDay = { name: 'Push', ex: [
    { n: 'Pseudo planche push-up', s: sch },
    { n: 'Dips', s: sch },
    { n: 'Pike push-up', s: sch },
    { n: 'Diamond push-up', s: '3 × 12–15' },
  ] };
  const pull: SplitDay = { name: 'Pull', ex: [
    { n: 'Pull-up', s: sch },
    { n: 'Chin-up', s: sch },
    { n: 'Australian row', s: '3 × 12–15' },
    { n: 'Hanging leg raise', s: '3 × 12–15' },
  ] };
  const legs: SplitDay = { name: 'Legs + core', ex: [
    { n: 'Pistol squat progression', s: sch },
    { n: 'Nordic curl progression', s: '3 × 5–8' },
    { n: 'Standing calf raise', s: '3 × 15' },
    { n: 'Hollow body hold', s: '4 × 30s' },
  ] };
  const base = focus === 'aesthetics' ? [push, pull, legs, push, pull, legs] : [skills, push, pull, legs, skills, push];
  const n = Math.min(6, Math.max(2, Math.round(days || 3)));
  return base.slice(0, n);
}
