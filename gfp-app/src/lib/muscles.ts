import { StringKey } from '../i18n/strings';

/**
 * Muscle-by-muscle exercise library for the workout builder.
 * Biceps and triceps are deliberately separate groups (not lumped as
 * "arms"), and any combination of muscles can be selected together -
 * the suggestion list is the union of every selected group.
 */
export type MuscleKey =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'legs' | 'glutes' | 'core' | 'forearms' | 'calves';

export const MUSCLES: { key: MuscleKey; labelKey: StringKey }[] = [
  { key: 'chest', labelKey: 'muscle.chest' },
  { key: 'back', labelKey: 'muscle.back' },
  { key: 'shoulders', labelKey: 'muscle.shoulders' },
  { key: 'biceps', labelKey: 'muscle.biceps' },
  { key: 'triceps', labelKey: 'muscle.triceps' },
  { key: 'legs', labelKey: 'muscle.legs' },
  { key: 'glutes', labelKey: 'muscle.glutes' },
  { key: 'core', labelKey: 'muscle.core' },
  { key: 'forearms', labelKey: 'muscle.forearms' },
  { key: 'calves', labelKey: 'muscle.calves' },
];

const LIB: Record<MuscleKey, string[]> = {
  chest: [
    'Bench press', 'Incline dumbbell press', 'Cable chest fly',
    'Machine chest press', 'Dips (chest lean)', 'Push-ups',
  ],
  back: [
    'Lat pulldown', 'Barbell row', 'Seated cable row',
    'Pull-ups', 'Single-arm dumbbell row', 'Straight-arm pulldown',
  ],
  shoulders: [
    'Overhead press', 'Dumbbell lateral raise', 'Rear delt fly',
    'Arnold press', 'Cable lateral raise', 'Face pull',
  ],
  biceps: [
    'Barbell curl', 'Incline dumbbell curl', 'Hammer curl',
    'Preacher curl', 'Cable curl', 'Concentration curl',
  ],
  triceps: [
    'Triceps pushdown', 'Skull crushers', 'Overhead rope extension',
    'Close-grip bench press', 'Dips (upright)', 'Cable kickback',
  ],
  legs: [
    'Back squat', 'Leg press', 'Romanian deadlift',
    'Walking lunge', 'Leg extension', 'Lying leg curl',
  ],
  glutes: [
    'Hip thrust', 'Bulgarian split squat', 'Cable glute kickback',
    'Sumo deadlift', 'Glute bridge', 'Step-ups',
  ],
  core: [
    'Hanging leg raise', 'Cable crunch', 'Plank',
    'Ab wheel rollout', 'Russian twist', 'Dead bug',
  ],
  forearms: [
    'Wrist curl', 'Reverse wrist curl', 'Farmer carry', 'Reverse curl',
  ],
  calves: [
    'Standing calf raise', 'Seated calf raise', 'Single-leg calf raise',
  ],
};

/** Union of exercises for the selected muscles, tagged with their group. */
export function suggestionsFor(selected: MuscleKey[]): { ex: string; muscle: MuscleKey }[] {
  const out: { ex: string; muscle: MuscleKey }[] = [];
  const seen = new Set<string>();
  for (const m of selected) {
    for (const ex of LIB[m] || []) {
      if (!seen.has(ex)) {
        seen.add(ex);
        out.push({ ex, muscle: m });
      }
    }
  }
  return out;
}
