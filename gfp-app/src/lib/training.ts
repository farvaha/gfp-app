// Training intelligence: weekly volume landmarks per muscle, experience-scaled
// dosing, goal-specific loading, and a 4-week progression block.
//
// Volume is expressed in hard sets per muscle per week, using the MEV (minimum
// effective volume) / MAV (maximum adaptive volume) framework. Beginners sit
// near MEV because they grow on very little and recover slowly from junk
// volume; advanced lifters sit near MAV. Cutting trims volume (recovery is
// impaired in a deficit) while keeping intensity to hold onto muscle.
// ASCII only on purpose (encoding safety).

export type Experience = 'beginner' | 'intermediate' | 'advanced';

export interface VolumeTarget { muscle: string; sets: number }

const MEV: Record<string, number> = {
  Chest: 8, Back: 10, Shoulders: 8, Biceps: 6, Triceps: 6,
  Quads: 8, Hamstrings: 6, Glutes: 6, Calves: 8, Core: 6,
};

const MAV: Record<string, number> = {
  Chest: 18, Back: 22, Shoulders: 20, Biceps: 16, Triceps: 16,
  Quads: 18, Hamstrings: 14, Glutes: 14, Calves: 18, Core: 16,
};

function expFactor(e: Experience): number {
  if (e === 'advanced') return 0.9;
  if (e === 'intermediate') return 0.6;
  return 0.25;
}

function goalFactor(goal: string): number {
  const g = (goal || '').toLowerCase();
  if (g === 'lose') return 0.85;        // less volume, keep intensity
  if (g === 'gain' || g === 'weight_gain') return 1.1;
  return 1;
}

/** Weekly hard sets per muscle, scaled by experience, goal and days available. */
export function weeklyVolume(experience: Experience, goal: string, days: number): VolumeTarget[] {
  const f = expFactor(experience);
  const g = goalFactor(goal);
  // Fewer training days caps how much quality volume actually fits.
  const dayCap = Math.min(1, (Math.max(2, days || 3)) / 5);
  return Object.keys(MEV).map((m) => {
    const span = MAV[m] - MEV[m];
    const sets = Math.round((MEV[m] + span * f) * g * (0.7 + 0.3 * dayCap));
    return { muscle: m, sets: Math.max(4, sets) };
  });
}

/** Loading parameters for a goal - what actually drives the adaptation. */
export function loading(goal: string, experience: Experience) {
  const g = (goal || '').toLowerCase();
  if (g === 'lose') {
    return { reps: '8-12', rir: '1-2 reps in reserve', rest: '60-90 s', intensity: '65-75% 1RM',
      focus: 'Hold your strength while losing fat. Do not chase new maxes in a deficit.' };
  }
  if (g === 'gain' || g === 'weight_gain') {
    return { reps: experience === 'beginner' ? '8-12' : '6-10', rir: '1-2 reps in reserve', rest: '2-3 min',
      intensity: '70-85% 1RM',
      focus: 'Add a rep or a little load every week. Growth follows progressive overload.' };
  }
  return { reps: '6-12', rir: '2 reps in reserve', rest: '90 s-2 min', intensity: '70-80% 1RM',
    focus: 'Keep the quality high and stay consistent week to week.' };
}

export interface WeekBlock { week: number; label: string; detail: string }

/** A 4-week accumulation block ending in a deload - how real programmes run. */
export function progression(experience: Experience): WeekBlock[] {
  const bump = experience === 'beginner' ? 'Add 2.5 kg or 1 rep' : 'Add 1 rep or 2.5 kg';
  return [
    { week: 1, label: 'Week 1 - baseline', detail: 'Set your working weights. Stop 2 reps short of failure.' },
    { week: 2, label: 'Week 2 - build', detail: bump + ' on every main lift you managed cleanly.' },
    { week: 3, label: 'Week 3 - push', detail: 'Hardest week. Last set of each main lift close to failure (1 RIR).' },
    { week: 4, label: 'Week 4 - deload', detail: 'Two thirds of the sets, same weights. This is when you actually grow.' },
  ];
}

/** Plain-English reasoning shown to the user so the plan is not a black box. */
export function rationale(experience: Experience, goal: string, days: number, splitName: string): string[] {
  const g = (goal || '').toLowerCase();
  const out: string[] = [];
  out.push('You train ' + days + ' days a week, so a ' + splitName + ' lets each muscle be trained about twice weekly - better for growth than once.');
  if (experience === 'beginner') {
    out.push('As a beginner your volume starts near the minimum effective dose. You will grow on less than you think, and recover faster to train again.');
  } else if (experience === 'advanced') {
    out.push('At an advanced level your volume runs close to the maximum you can adapt to, because smaller doses no longer force change.');
  } else {
    out.push('At intermediate level volume sits between the minimum that works and the most you can recover from.');
  }
  if (g === 'lose') {
    out.push('In a calorie deficit recovery is reduced, so total sets are trimmed while loads stay heavy - that is what protects muscle while you lose fat.');
  } else if (g === 'gain' || g === 'weight_gain') {
    out.push('In a surplus you can recover from more work, so volume is raised and rest between sets is longer to keep every set heavy.');
  }
  out.push('Every fourth week is a deload. Fatigue masks fitness - the easy week is when the adaptation shows up.');
  return out;
}
