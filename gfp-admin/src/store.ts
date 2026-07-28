import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Credential vault for the owner app.
 * The WordPress Application Password is stored in Android's encrypted
 * keystore-backed storage, never in plain AsyncStorage, and the app is
 * gated behind the device biometric (fingerprint/face/PIN fallback).
 */
const USER_KEY = 'gfp_admin_user';
const PASS_KEY = 'gfp_admin_pass';

export async function saveCredentials(username: string, appPassword: string) {
  await SecureStore.setItemAsync(USER_KEY, username);
  await SecureStore.setItemAsync(PASS_KEY, appPassword);
}

export async function getCredentials(): Promise<{ username: string; appPassword: string } | null> {
  const username = await SecureStore.getItemAsync(USER_KEY);
  const appPassword = await SecureStore.getItemAsync(PASS_KEY);
  if (!username || !appPassword) return null;
  return { username, appPassword };
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(USER_KEY);
  await SecureStore.deleteItemAsync(PASS_KEY);
}

/** True when the device can do biometric or device-credential auth. */
export async function canBiometric(): Promise<boolean> {
  try {
    const hw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hw && enrolled;
  } catch {
    return false;
  }
}

/** Prompt the owner. Resolves true on success or when no lock is available. */
export async function unlock(): Promise<boolean> {
  try {
    if (!(await canBiometric())) return true;
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock GFP Admin',
      cancelLabel: 'Cancel',
    });
    return !!res.success;
  } catch {
    return false;
  }
}
