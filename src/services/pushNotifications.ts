// Web-only stub for push notifications (no Capacitor needed)
import { isNativePlatform } from './nativeCapabilities';

export interface NotificationPreferences {
  scanAlerts: boolean;
  recallAlerts: boolean;
  dangerousProductAlerts: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  healthTips: boolean;
  socialNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  type: string;
  status: string;
  createdAt: string;
  readAt: string | null;
}

/**
 * Initialize push notifications (no-op on web)
 */
export async function initializePushNotifications(): Promise<string | null> {
  if (!isNativePlatform()) {
    console.log('Push notifications not available on web');
    return null;
  }
  return null;
}

/**
 * Get current notification permissions (always denied on web)
 */
export async function getNotificationPermissions(): Promise<NotificationPermissions> {
  if (!isNativePlatform()) {
    return { receipt: 'denied' };
  }
  return { receipt: 'denied' };
}

/**
 * Register device for push notifications (no-op on web)
 */
export async function registerForPushNotifications(): Promise<string | null> {
  console.log('Push notifications not available on web');
  return null;
}

/**
 * Unregister device from push notifications (no-op on web)
 */
export async function unregisterFromPushNotifications(): Promise<void> {
  console.log('Push notifications not available on web');
}

/**
 * Save notification preferences to Supabase (web-compatible)
 */
export async function saveNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
  // In a real app, this would save to Supabase
  console.log('Notification preferences saved (web stub):', prefs);
}

/**
 * Get notification preferences from Supabase (web-compatible)
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  // Return defaults
  return {
    scanAlerts: true,
    recallAlerts: true,
    dangerousProductAlerts: true,
    dailySummary: false,
    weeklyReport: true,
    healthTips: false,
    socialNotifications: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  };
}

/**
 * Get notification history (web stub)
 */
export async function getNotificationHistory(limit: number = 50): Promise<NotificationHistoryItem[]> {
  return [];
}

/**
 * Mark notification as read (no-op on web)
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  console.log(`Mark notification ${notificationId} as read (web stub)`);
}

/**
 * Delete notification (no-op on web)
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  console.log(`Delete notification ${notificationId} (web stub)`);
}

/**
 * Test push notification (no-op on web)
 */
export async function testPushNotification(title: string, body: string): Promise<boolean> {
  console.log(`Test push: ${title} - ${body} (web stub)`);
  return false;
}

// Default export
export default {
  initializePushNotifications,
  getNotificationPermissions,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  saveNotificationPreferences,
  getNotificationPreferences,
  getNotificationHistory,
  markNotificationRead,
  deleteNotification,
  testPushNotification,
};
