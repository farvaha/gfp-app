// Real GetFitPlans WordPress REST contract (namespace gfp/v1).
// Verified live against getfitplans.com — do not invent routes.

export const SITE = 'https://getfitplans.com';

// Web flows we host in a WebView (cookie session lives here).
export const WEB = {
  quiz: `${SITE}/build-my-plan/`,
  companion: `${SITE}/companion/`,
  pricing: `${SITE}/companion/`,
  account: `${SITE}/my-account/`,
  shop: `${SITE}/shop/`,
  orders: `${SITE}/my-account/orders/`,
};

export const EP = {
  // auth (cookie session, email + password)
  login: '/gfp/v1/auth/login',
  register: '/gfp/v1/auth/register',
  logout: '/gfp/v1/auth/logout',
  me: '/gfp/v1/auth/me',
  forgot: '/gfp/v1/auth/forgot-password',

  // companion data
  plan: '/gfp/v1/companion/plan',
  billing: '/gfp/v1/companion/billing',
  protocols: '/gfp/v1/companion/protocols',            // POST to save a built plan
  activeProtocol: '/gfp/v1/companion/protocols/active',
  dailySummary: '/gfp/v1/companion/daily-summary',
  adherenceToday: '/gfp/v1/companion/adherence/today',
  meals: '/gfp/v1/companion/meals',
  workouts: '/gfp/v1/companion/workouts',
  checkins: '/gfp/v1/companion/checkins',
  checkinToday: '/gfp/v1/companion/checkins/today',
  sessions: '/gfp/v1/companion/sessions',
  goalProgress: '/gfp/v1/companion/goal-progress',
  preiva: '/gfp/v1/companion/preiva',
  photoMeal: '/gfp/v1/companion/photo-meal',
  weeklyReview: '/gfp/v1/companion/weekly-review',
  historyDates: '/gfp/v1/companion/history/dates',

  // verified live 2026-07-14
  sport: '/gfp/v1/companion/sport',
  places: '/gfp/v1/companion/places',
  notifPrefs: '/gfp/v1/companion/notifications/prefs',
  meal: (id: number) => `/gfp/v1/companion/meals/${id}`,      // DELETE
  workout: (id: number) => `/gfp/v1/companion/workouts/${id}`, // PATCH
};

export type Tier = 'free' | 'standard' | 'enhanced';
export type BillingStatus = 'none' | 'trial' | 'active' | 'expired' | 'cancelled';

// GET /auth/me
export interface Me {
  id: number;
  email: string;
  name: string;
  tier: Tier;
  enhanced: boolean;
  billing?: Billing;
  onboarding?: any;
  streak?: number;
  streak_best?: number;
}

// GET /companion/billing
export interface Billing {
  plan: Tier;
  status: BillingStatus;
  has_access: boolean;
  trial_ends_at?: string | null;
  paid_until?: string | null;
  price_usd?: number;
  price_label?: string;
  currency?: string;
  gateway_ready?: boolean;
  checkout_url?: string;
  trial_days?: number;
}

// GET /companion/plan
export interface PlanResponse {
  plan: string;                     // rendered plan (markdown/html)
  can: {
    photo_log: boolean;
    weekly_review: boolean;
    push: boolean;
    progress_pdf: boolean;
  };
  sub?: any;
}

// Exercise as the server sends it: { n: "Bench press", s: "4 × 6–8" }
export interface Exercise { n: string; s: string }
export interface SplitDay { name: string; ex: Exercise[] }

// GET /companion/protocols/active -> computed
export interface Computed {
  target_kcal: number;
  goal: string;
  meals_count: number;
  training_days: number;
  split: SplitDay[];
}
export interface ActiveProtocol {
  id: number;
  protocol_path?: string;
  builder_state?: any;
  computed: Computed;
}

export interface Totals { kcal: number; protein: number; carbs: number; fat: number }

// GET /companion/meals
export interface MealsResponse {
  date: string;
  meals: any[];
  totals: Totals;
}

// GET /companion/workouts
export interface WorkoutsResponse {
  date: string;
  is_today: boolean;
  workouts: any[];
  active?: any;
  totals?: any;
}

// GET /companion/adherence/today
export interface Adherence {
  user_id: number;
  adherence_date: string;
  meals_logged: number;
  meals_target: number;
  workout_completed: boolean;
  checkin_completed: boolean;
  score_pct: number;
  coach_message?: string;
}

// GET /companion/daily-summary
export interface DailySummary {
  date: string;
  is_today: boolean;
  meals: any[];
  workouts: any[];
  checkin?: any;
  adherence?: Adherence;
  analysis?: any;
}
