/**
 * Native port of the Build-My-Plan calorie math (website builder.js).
 *
 * The website computes target calories in the browser from the quiz answers and
 * saves them onto the protocol. We reproduce that here so the native quiz can
 * build a plan without a WebView. Macro targets (protein/carbs/fat) are then
 * derived by the existing src/lib/macros.ts from the same builder_state.
 *
 * NOTE: If the website's builder.js coefficients ever change, mirror them here
 * and in macros.ts. Calories shown in the app after saving always come back from
 * the server's `computed.target_kcal`, so the server stays authoritative.
 */

import type { BuilderState } from './macros';

const LB_TO_KG = 0.45359237;
const IN_TO_CM = 2.54;

/** Activity multipliers on top of BMR (Mifflin–St Jeor). */
export const ACTIVITY: Record<string, { label: string; factor: number }> = {
  sedentary: { label: 'Sedentary (desk job)', factor: 1.2 },
  light: { label: 'Lightly active (1–3 days/wk)', factor: 1.375 },
  moderate: { label: 'Moderately active (3–5 days/wk)', factor: 1.55 },
  active: { label: 'Very active (6–7 days/wk)', factor: 1.725 },
  athlete: { label: 'Athlete / physical job', factor: 1.9 },
};

/** Goal calorie multipliers (mirror macros.ts / builder.js). */
export const GOAL_MULT: Record<string, number> = {
  lose: 0.8,
  maintain: 1.0,
  gain: 1.12,
  weight_gain: 1.18,
};

export function toKg(weight?: number | string, unit?: string): number | null {
  const raw = typeof weight === 'string' ? parseFloat(weight) : weight;
  if (!raw || !isFinite(raw) || raw <= 0) return null;
  const kg = (unit || 'kg').toLowerCase().startsWith('lb') ? raw * LB_TO_KG : raw;
  return kg >= 25 && kg <= 300 ? kg : null;
}

export function toCm(height?: number | string, unit?: string): number | null {
  const raw = typeof height === 'string' ? parseFloat(height) : height;
  if (!raw || !isFinite(raw) || raw <= 0) return null;
  const cm = (unit || 'cm').toLowerCase().startsWith('in') ? raw * IN_TO_CM : raw;
  return cm >= 100 && cm <= 250 ? cm : null;
}

/**
 * Target calories from the quiz answers.
 * Returns 0 when we lack the inputs needed for a BMR estimate.
 */
export function computeTargetKcal(bs: BuilderState): number {
  const kg = toKg(bs.weight, bs.wUnit);
  const cm = toCm(bs.height, bs.hUnit);
  const age = typeof bs.age === 'string' ? parseInt(bs.age, 10) : bs.age;
  if (!kg || !cm || !age || !isFinite(age) || age < 13 || age > 100) return 0;

  const sexAdj = (bs.sex || '').toLowerCase().startsWith('f') ? -161 : 5;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + sexAdj;

  const actKey = String(bs.activity ?? 'moderate');
  const factor = ACTIVITY[actKey]?.factor ?? 1.55;
  const tdee = bmr * factor;

  const goalMult = GOAL_MULT[(bs.goal || 'maintain').toLowerCase()] ?? 1.0;
  return Math.round((tdee * goalMult) / 10) * 10; // round to nearest 10 kcal
}
