// Local daily reminders (meals / workout / check-in) via expo-notifications.
// Everything is on-device - no push service involved.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { translate as t } from '../i18n/locale';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }) as any,
});

async function ensureChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch {}
  }
}

/** Ask for permission (Android 13+ runtime prompt). Returns granted. */
export async function ensureNotifPermission(): Promise<boolean> {
  await ensureChannel();
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

function dailyTrigger(hour: number, minute: number): any {
  const T: any = (Notifications as any).SchedulableTriggerInputTypes;
  return T
    ? { type: T.DAILY, hour, minute, channelId: 'reminders' }
    : { hour, minute, repeats: true, channelId: 'reminders' };
}

/** Re-create the local schedule from the user's toggles. */
export async function applyReminderSchedule(prefs: {
  meals?: boolean;
  workouts?: boolean;
  checkins?: boolean;
}): Promise<boolean> {
  const ok = await ensureNotifPermission();
  if (!ok) return false;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const add = (hour: number, minute: number, title: string, body: string) =>
      Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: dailyTrigger(hour, minute),
      });
    if (prefs.meals) {
      await add(8, 0, t('notif.mealTitle'), t('notif.mealBody'));
      await add(13, 0, t('notif.mealTitle'), t('notif.mealBody'));
      await add(19, 0, t('notif.mealTitle'), t('notif.mealBody'));
    }
    if (prefs.workouts) await add(17, 30, t('notif.workoutTitle'), t('notif.workoutBody'));
    if (prefs.checkins) await add(21, 0, t('notif.checkinTitle'), t('notif.checkinBody'));
    return true;
  } catch {
    return false;
  }
}
