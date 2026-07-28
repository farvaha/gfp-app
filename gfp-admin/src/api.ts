import { getCredentials } from './store';

const BASE = 'https://getfitplans.com/wp-json';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T = any>(path: string, opts: { method?: string; body?: any } = {}): Promise<T> {
  const creds = await getCredentials();
  if (!creds) throw new ApiError('Not connected. Open Settings and sign in.', 401);
  const auth = 'Basic ' + btoa(creds.username + ':' + creds.appPassword);
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'X-GFP-App': 'gfp-admin',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError((json && json.message) || `Request failed (${res.status})`, res.status);
  }
  return json as T;
}

export const Admin = {
  /** Used by the login screen to validate the application password. */
  test: () => call('/gfp/v1/admin/stats'),
  stats: () => call('/gfp/v1/admin/stats'),
  orders: () => call('/gfp/v1/admin/orders'),
  setOrderStatus: (order_id: number, status: string) =>
    call('/gfp/v1/admin/order-status', { method: 'POST', body: { order_id, status } }),
  users: (search?: string) =>
    call('/gfp/v1/admin/users' + (search ? '?search=' + encodeURIComponent(search) : '')),
  ban: (user_id: number, banned: boolean) =>
    call('/gfp/v1/admin/ban', { method: 'POST', body: { user_id, banned: banned ? 1 : 0 } }),
  feedback: () => call('/gfp/v1/admin/feedback'),
  release: () => call('/gfp/v1/admin/release'),
  publish: (payload: { versionName: string; versionCode: number; apkUrl: string; notes: string }) =>
    call('/gfp/v1/admin/publish', { method: 'POST', body: payload }),
};
