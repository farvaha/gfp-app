/**
 * Macro targets — ported from the website's builder.js.
 *
 * WHY THIS EXISTS
 * The Build My Plan quiz computes calories + macros *in the browser* and only
 * persists `target_kcal` into the saved protocol. Protein / carbs / fat targets
 * are never stored, so `goal-progress` returns them as 0. To show "Today vs your
 * plan" with protein without changing the website, we recompute them here from
 * the same inputs (`builder_state`) using the same coefficients as builder.js.
 *
 * IMPORTANT: calories are NOT recomputed — we always use the server's
 * `computed.target_kcal`, so the app can never disagree with the plan on kcal.
 *
 * Source coefficients (builder.js):
 *   goal kcal mult : lose 0.80 | gain 1.12 | weight_gain 1.18 | maintain ~1.0
 *   proteinKg      : comp division (2.1) ?? { lose 2.0 | gain 1.8 | weight_gain 1.6 }
 *   fat            : ~25% of kcal (0.22–0.32 depending on protocol)
 *   carbs          : remainder, at 4 kcal/g (protein 4, fat 9)
 *
 * If the builder's coefficients ever change on the website, update them here too.
 */

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

const LB_TO_KG = 0.45359237;

export interface BuilderState {
  weight?: number | string;
  wUnit?: string;
  goal?: string;
  protocol?: string;
  sex?: string;
  age?: number | string;
  height?: number | string;
  hUnit?: string;
  activity?: number | string;
  days?: number | string;
}

export interface MacroTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** false when we lacked bodyweight and had to fall back to kcal-share estimates */
  exact: boolean;
}

/** Bodyweight in kg, or null if unknown. */
export function weightKg(bs: BuilderState | null | undefined): number | null {
  if (!bs) return null;
  const raw = typeof bs.weight === 'string' ? parseFloat(bs.weight) : bs.weight;
  if (!raw || !isFinite(raw) || raw <= 0) return null;
  const unit = (bs.wUnit || 'kg').toLowerCase();
  const kg = unit.startsWith('lb') ? raw * LB_TO_KG : raw;
  // sanity clamp — guards against a mis-entered unit producing absurd targets
  if (kg < 25 || kg > 300) return null;
  return kg;
}

/** Protein g/kg for a goal, mirroring builder.js. */
export function proteinPerKg(bs: BuilderState | null | undefined): number {
  const protocol = (bs?.protocol || '').toLowerCase();
  // competition / athlete protocols run higher protein
  if (protocol.includes('comp') || protocol.includes('athlete')) return 2.1;

  switch ((bs?.goal || '').toLowerCase()) {
    case 'lose':
      return 2.0;
    case 'gain':
      return 1.8;
    case 'weight_gain':
      return 1.6;
    default:
      return 1.8; // maintain / wellness
  }
}

/** Fat as a fraction of total kcal, mirroring builder.js. */
export function fatFraction(bs: BuilderState | null | undefined): number {
  switch ((bs?.goal || '').toLowerCase()) {
    case 'lose':
      return 0.28;
    case 'gain':
    case 'weight_gain':
      return 0.25;
    default:
      return 0.28;
  }
}

/**
 * Build macro targets from the server's target_kcal + the saved builder_state.
 * `targetKcal` is authoritative and always passed straight through.
 */
export function macroTargets(
  targetKcal: number,
  bs: BuilderState | null | undefined,
): MacroTargets {
  const kcal = Math.max(0, Math.round(targetKcal || 0));
  if (!kcal) return { kcal: 0, protein: 0, carbs: 0, fat: 0, exact: false };

  const kg = weightKg(bs);
  const fatG = Math.round((kcal * fatFraction(bs)) / KCAL_PER_G.fat);

  let proteinG: number;
  let exact: boolean;

  if (kg) {
    proteinG = Math.round(kg * proteinPerKg(bs));
    exact = true;
  } else {
    // No bodyweight on file — fall back to ~25% of kcal from protein so the
    // card still gives a usable number rather than showing 0.
    proteinG = Math.round((kcal * 0.25) / KCAL_PER_G.protein);
    exact = false;
  }

  const remaining = kcal - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat;
  const carbsG = Math.max(0, Math.round(remaining / KCAL_PER_G.carbs));

  return { kcal, protein: proteinG, carbs: carbsG, fat: fatG, exact };
}

/** Percentage of a target hit, clamped to 0–100 for bar widths. */
export function pct(actual: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
}
