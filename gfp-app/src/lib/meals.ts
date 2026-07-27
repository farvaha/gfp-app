// Meal engine: turns a calorie + macro target into a real eating plan -
// how many meals, at what time, how much of each macro in each, and what to
// actually put on the plate. ASCII only on purpose (encoding safety).
//
// Distribution rules used:
//  - Protein is spread evenly across meals (~0.4 g/kg per sitting maximises
//    muscle protein synthesis; even spacing beats back-loading).
//  - Carbs are skewed toward the meals either side of training, because that
//    is when glycogen replenishment and performance matter most.
//  - Fat is pushed away from the peri-workout window so digestion does not
//    blunt those meals, and topped up at the evening meal instead.

export interface MealSlot {
  name: string;
  time: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  note: string;
  foods: string[];
}

export interface MacroSet { kcal: number; protein: number; carbs: number; fat: number }

type Diet = 'none' | 'veg' | 'vegan' | 'halal';

// ---- food library -------------------------------------------------------

const PROTEIN: Record<string, string[]> = {
  none: ['chicken breast', 'lean beef', 'eggs', 'white fish', 'salmon', 'greek yoghurt', 'whey shake', 'cottage cheese'],
  veg: ['paneer', 'greek yoghurt', 'eggs', 'cottage cheese', 'whey shake', 'tofu', 'lentils', 'chickpeas'],
  vegan: ['tofu', 'tempeh', 'lentils', 'chickpeas', 'black beans', 'soy yoghurt', 'pea protein shake', 'edamame'],
  halal: ['chicken breast', 'halal lamb', 'eggs', 'white fish', 'salmon', 'greek yoghurt', 'whey shake', 'paneer'],
};

const CARBS: Record<string, string[]> = {
  none: ['oats', 'rice', 'roti', 'potato', 'sweet potato', 'pasta', 'banana', 'fruit'],
  veg: ['oats', 'rice', 'roti', 'potato', 'sweet potato', 'pasta', 'banana', 'fruit'],
  vegan: ['oats', 'rice', 'roti', 'potato', 'sweet potato', 'quinoa', 'banana', 'fruit'],
  halal: ['oats', 'rice', 'roti', 'potato', 'sweet potato', 'pasta', 'banana', 'fruit'],
};

const FATS: Record<string, string[]> = {
  none: ['olive oil', 'almonds', 'peanut butter', 'cheese', 'avocado'],
  veg: ['olive oil', 'almonds', 'peanut butter', 'cheese', 'avocado'],
  vegan: ['olive oil', 'almonds', 'peanut butter', 'tahini', 'avocado'],
  halal: ['olive oil', 'almonds', 'peanut butter', 'cheese', 'avocado'],
};

const VEG = ['spinach', 'broccoli', 'salad', 'mixed vegetables', 'peppers'];

function pick(list: string[], i: number): string {
  if (!list.length) return '';
  return list[i % list.length];
}

// Grams of food needed to hit a macro amount, rounded to something sane.
function portion(grams: number): number {
  if (grams <= 0) return 0;
  return Math.max(5, Math.round(grams / 5) * 5);
}

// ---- meal structure -----------------------------------------------------

interface SlotSpec { name: string; time: string; note: string; kcalPct: number; carbBias: number; fatBias: number }

// Bias numbers are relative weights, not percentages - they are normalised
// after the slots for this meal count are chosen.
function slotPlan(meals: number, trainsToday: boolean): SlotSpec[] {
  const pre = { name: 'Pre-workout', time: '1-2 h before training', note: 'Carb-led so you have fuel in the tank.', kcalPct: 0.15, carbBias: 1.6, fatBias: 0.3 };
  const post = { name: 'Post-workout', time: 'within 1-2 h after training', note: 'Protein plus fast carbs to refill glycogen.', kcalPct: 0.2, carbBias: 1.8, fatBias: 0.3 };
  const breakfast = { name: 'Breakfast', time: '7:00 - 9:00', note: 'Protein first thing steadies appetite for the day.', kcalPct: 0.2, carbBias: 1.0, fatBias: 1.0 };
  const midAm = { name: 'Mid-morning', time: '10:30 - 11:30', note: 'Keeps protein feeding steady between meals.', kcalPct: 0.12, carbBias: 0.9, fatBias: 1.0 };
  const lunch = { name: 'Lunch', time: '13:00 - 14:00', note: 'Your biggest balanced plate of the day.', kcalPct: 0.25, carbBias: 1.1, fatBias: 1.0 };
  const midPm = { name: 'Afternoon snack', time: '16:00 - 17:00', note: 'Bridges the gap so dinner is not a binge.', kcalPct: 0.1, carbBias: 0.9, fatBias: 1.0 };
  const dinner = { name: 'Dinner', time: '19:00 - 20:30', note: 'Protein and vegetables, fats land here.', kcalPct: 0.25, carbBias: 0.8, fatBias: 1.5 };
  const night = { name: 'Before bed', time: '30 min before sleep', note: 'Slow protein supports overnight recovery.', kcalPct: 0.1, carbBias: 0.4, fatBias: 1.2 };

  const n = Math.min(7, Math.max(3, Math.round(meals || 4)));
  let out: SlotSpec[];
  if (n <= 3) out = [breakfast, lunch, dinner];
  else if (n === 4) out = [breakfast, lunch, trainsToday ? post : midPm, dinner];
  else if (n === 5) out = [breakfast, midAm, lunch, trainsToday ? post : midPm, dinner];
  else if (n === 6) out = [breakfast, midAm, lunch, trainsToday ? pre : midPm, trainsToday ? post : dinner, dinner];
  else out = [breakfast, midAm, lunch, trainsToday ? pre : midPm, trainsToday ? post : midPm, dinner, night];

  // de-duplicate names (6-meal non-training day can repeat dinner)
  const seen: Record<string, number> = {};
  return out.map((s) => {
    seen[s.name] = (seen[s.name] || 0) + 1;
    return seen[s.name] > 1 ? { ...s, name: s.name + ' 2' } : s;
  });
}

// ---- main builder -------------------------------------------------------

export function buildMealPlan(
  targets: MacroSet,
  meals: number,
  opts?: { diet?: string; trainsToday?: boolean; goal?: string }
): MealSlot[] {
  const kcal = Math.max(0, Math.round(targets.kcal || 0));
  if (!kcal) return [];

  const diet = (opts?.diet as Diet) || 'none';
  const trainsToday = opts?.trainsToday !== false;
  const specs = slotPlan(meals, trainsToday);
  const n = specs.length;

  // normalise the kcal split so it always adds to 100%
  const pctTotal = specs.reduce((a, s) => a + s.kcalPct, 0) || 1;
  const carbTotal = specs.reduce((a, s) => a + s.carbBias, 0) || 1;
  const fatTotal = specs.reduce((a, s) => a + s.fatBias, 0) || 1;

  const proteinPer = Math.round((targets.protein || 0) / n);

  const pFoods = PROTEIN[diet] || PROTEIN.none;
  const cFoods = CARBS[diet] || CARBS.none;
  const fFoods = FATS[diet] || FATS.none;

  return specs.map((s, i) => {
    const slotKcal = Math.round((kcal * s.kcalPct) / pctTotal);
    const carbs = Math.round(((targets.carbs || 0) * s.carbBias) / carbTotal);
    const fat = Math.round(((targets.fat || 0) * s.fatBias) / fatTotal);

    const foods: string[] = [];
    foods.push(portion(proteinPer * 4) + ' g ' + pick(pFoods, i) + ' (about ' + proteinPer + ' g protein)');
    if (carbs > 0) foods.push(portion(carbs * 3) + ' g ' + pick(cFoods, i) + ' (about ' + carbs + ' g carbs)');
    if (fat >= 5) foods.push(pick(fFoods, i) + ' (about ' + fat + ' g fat)');
    if (s.name !== 'Before bed' && s.name !== 'Pre-workout') foods.push('a handful of ' + pick(VEG, i));

    return {
      name: s.name,
      time: s.time,
      note: s.note,
      kcal: slotKcal,
      protein: proteinPer,
      carbs,
      fat,
      foods,
    };
  });
}

/** One-line summary for cards: '6 meals a day, about 538 kcal each'. */
export function mealSummary(targets: MacroSet, meals: number): string {
  const n = Math.max(1, meals || 1);
  const per = Math.round((targets.kcal || 0) / n);
  return n + ' meals a day, about ' + per + ' kcal and ' + Math.round((targets.protein || 0) / n) + ' g protein each';
}

/** Which meal is next, given the hour of day. Used by the Today screen. */
export function nextMeal(plan: MealSlot[], hour: number): MealSlot | null {
  if (!plan.length) return null;
  const starts = [8, 11, 13, 16, 18, 20, 22];
  for (let i = 0; i < plan.length; i++) {
    if (hour < (starts[i] !== undefined ? starts[i] : 23)) return plan[i];
  }
  return plan[plan.length - 1];
}
