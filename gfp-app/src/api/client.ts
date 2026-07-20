import * as SecureStore from 'expo-secure-store';
import { SITE } from './endpoints';

export const BASE = `${SITE}/wp-json`;
const NONCE_KEY = 'gfp_rest_nonce';

// WordPress REST nonce. The session itself rides in the shared native cookie
// jar (set by the WebView login); we only need to carry the nonce for writes.
let nonce: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export async function loadNonce(): Promise<string | null> {
  try { nonce = await SecureStore.getItemAsync(NONCE_KEY); } catch { nonce = null; }
  return nonce;
}

export async function setNonce(n: string | null) {
  nonce = n;
  try {
    if (n) await SecureStore.setItemAsync(NONCE_KEY, n);
    else await SecureStore.deleteItemAsync(NONCE_KEY);
  } catch {}
}

export function getNonce() { return nonce; }

/**
 * WordPress cookie-auth REST calls need an X-WP-Nonce for writes. The login /
 * register endpoints may hand it back under any of a few common keys — grab it
 * from wherever it lands so meal/workout/plan writes work right after sign-in.
 */
async function captureNonce(res: any): Promise<void> {
  if (!res || typeof res !== 'object') return;
  const n =
    res.nonce ?? res.rest_nonce ?? res._wpnonce ?? res.wp_nonce ??
    res.data?.nonce ?? res.user?.nonce;
  if (typeof n === 'string' && n) await setNonce(n);
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = '') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Opts = { method?: string; body?: any; timeoutMs?: number; noAuthRedirect?: boolean };

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-GFP-App': '1', // native app marker — see mu-plugin gfp-app-cookie-auth.php
        ...(nonce ? { 'X-WP-Nonce': nonce } : {}),
      },
      // include cookies from the shared native jar
      credentials: 'include',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timer);
    throw new ApiError(
      e?.name === 'AbortError' ? 'Request timed out.' : 'No connection.',
      0,
      'network'
    );
  }
  clearTimeout(timer);

  // WordPress refreshes the nonce on every authed response — keep it current.
  const fresh = res.headers.get('x-wp-nonce');
  if (fresh && fresh !== nonce) { setNonce(fresh); }

  const json: any = await res.json().catch(() => null);

  if (res.status === 401 || res.status === 403) {
    if (!opts.noAuthRedirect) onUnauthorized?.();
    throw new ApiError(
      json?.message || 'Please sign in again.',
      res.status,
      json?.code || 'unauthorized'
    );
  }
  if (!res.ok) {
    throw new ApiError(
      json?.message || `Request failed (${res.status}).`,
      res.status,
      json?.code || ''
    );
  }
  return json as T;
}

// Typed helpers over the real endpoints.
import { EP, Me, Billing, PlanResponse, ActiveProtocol, MealsResponse, WorkoutsResponse, Adherence, DailySummary } from './endpoints';

export const Api = {
  me: () => api<Me>(EP.me, { noAuthRedirect: true }),
  billing: () => api<Billing>(EP.billing),
  plan: () => api<PlanResponse>(EP.plan),
  activeProtocol: () => api<ActiveProtocol>(EP.activeProtocol),
  dailySummary: (date?: string) =>
    api<DailySummary>(EP.dailySummary + (date ? `?date=${encodeURIComponent(date)}` : '')),
  adherenceToday: () => api<Adherence>(EP.adherenceToday),
  meals: (date?: string) =>
    api<MealsResponse>(EP.meals + (date ? `?date=${encodeURIComponent(date)}` : '')),
  workouts: (date?: string) =>
    api<WorkoutsResponse>(EP.workouts + (date ? `?date=${encodeURIComponent(date)}` : '')),

  // writes
  /** POST /meals — { raw_text, meal_slot, log_date } */
  logMeal: (payload: { raw_text: string; meal_slot?: string; log_date?: string }) =>
    api(EP.meals, { method: 'POST', body: payload }),

  /** Step 1: AI-estimate macros from a photo. Returns { kcal, protein_g, carbs_g, fat_g, items, confidence }. */
  analyzePhoto: (imageBase64: string) =>
    api<any>(EP.photoMeal, { method: 'POST', body: { mode: 'analyze', image: imageBase64 } }),

  /** Step 2: save the (user-corrected) macros as a meal. */
  savePhotoMeal: (payload: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    raw_text?: string;
    items?: any;
    meal_slot?: string;
    log_date?: string;
    confidence?: any;
  }) => api(EP.photoMeal, { method: 'POST', body: payload }),

  /** POST /workouts — start/log a day. `sets` is the editable array. */
  startWorkout: (payload: {
    day_index: number;
    protocol_id?: number;
    sets?: any[];
    status?: string;
  }) => api<any>(EP.workouts, { method: 'POST', body: payload }),

  /** POST /sessions — sport session. */
  logSession: (payload: {
    sport?: string;
    session_type?: string;
    duration_min?: number;
    intensity_rpe?: number;
    notes?: string;
    metrics?: any;
    log_date?: string;
  }) => api(EP.sessions, { method: 'POST', body: payload }),

  /** POST /checkins — cardio check-in (bodyweight + cardio minutes). */
  checkin: (payload: {
    bodyweight_kg?: number;
    cardio_minutes?: number;
    notes?: string;
    posing_done?: boolean;
  }) => api(EP.checkins, { method: 'POST', body: payload }),
  chat: (payload: any) => api(EP.preiva, { method: 'POST', body: payload }),
  logout: () => api(EP.logout, { method: 'POST', noAuthRedirect: true }),

  // --- native auth (cookie session, email + password) ---
  /** POST /auth/login — establishes the WordPress cookie session in the shared
   *  native cookie jar and returns the current user. The REST nonce (needed for
   *  writes) is harvested from the response's x-wp-nonce header by api()
   *  automatically; we also accept it in the body if the server sends it there. */
  login: async (email: string, password: string) => {
    const res = await api<any>(EP.login, {
      method: 'POST',
      body: { email, password, username: email },
      noAuthRedirect: true,
    });
    await captureNonce(res);
    return res;
  },
  /** POST /auth/register — create an account. If the server logs the user in on
   *  register, the cookie session is already live afterwards. */
  register: async (payload: { email: string; password: string; name?: string }) => {
    const res = await api<any>(EP.register, {
      method: 'POST',
      body: { ...payload, username: payload.email },
      noAuthRedirect: true,
    });
    await captureNonce(res);
    return res;
  },
  /** POST /auth/forgot-password — trigger a reset email. */
  forgot: (email: string) =>
    api(EP.forgot, { method: 'POST', body: { email }, noAuthRedirect: true }),

  /** POST /companion/protocols — save a Build-My-Plan protocol (builder_state +
   *  client-computed target_kcal). Returns the created/active protocol. */
  createProtocol: (payload: any) =>
    api<any>(EP.protocols, { method: 'POST', body: payload }),

  // --- reads (verified routes) ---
  goalProgress: () => api<any>(EP.goalProgress),
  weeklyReview: () => api<any>(EP.weeklyReview),
  historyDates: () => api<any>(EP.historyDates),
  sessions: (date?: string) =>
    api<any>(date ? `${EP.sessions}?date=${encodeURIComponent(date)}` : EP.sessions),
  sport: () => api<any>(EP.sport),
  places: (q?: string) =>
    api<any>(q ? `${EP.places}?q=${encodeURIComponent(q)}` : EP.places),
  notifPrefs: () => api<any>(EP.notifPrefs),
  checkinToday: () => api<any>(EP.checkinToday),

  // --- writes ---
  setSport: (payload: { sport?: string; date?: string; session_type?: string }) =>
    api(EP.sport, { method: 'POST', body: payload }),
  saveNotifPrefs: (payload: any) =>
    api(EP.notifPrefs, { method: 'PUT', body: payload }),
  /** Edit a logged workout in place: { total_sets, top_weight_kg, main_lift, notes } */
  patchWorkout: (id: number, payload: any) =>
    api(EP.workout(id), { method: 'PATCH', body: payload }),
  /** Meals have no PATCH server-side — remove and re-add to "edit". */
  deleteMeal: (id: number) => api(EP.meal(id), { method: 'DELETE' }),
};
