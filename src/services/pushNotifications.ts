import { supabase } from "@/integrations/supabase/client";
import { isNativePlatform, getPlatform } from "./nativeCapabilities";

/**
 * Push Notifications Service
 * Handles device registration and notification preferences
 */

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
 * Initialize push notifications for native platforms
 */
export async function initializePushNotifications(): Promise<string | null> {
  if (!isNativePlatform()) {
    console.log('Push notifications not available on web');
    return null;
  }

  try {
    // Dynamic import for Capacitor push notifications
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Register with APNs/FCM
    await PushNotifications.register();

    // Return the token via a promise
    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success:', token.value);
        
        // Register token with our backend
        await registerDeviceToken(token.value);
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
        resolve(null);
      });
    });

  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return null;
  }
}

/**
 * Register device token with backend
 */
export async function registerDeviceToken(token: string, deviceName?: string): Promise<boolean> {
  try {
    const platform = getPlatform() as 'ios' | 'android' | 'web';
    
    const { data, error } = await supabase.functions.invoke('register-push-token', {
      body: {
        token,
        platform,
        deviceName,
      }
    });

    if (error) {
      console.error('Error registering device token:', error);
      return false;
    }

    console.log('Device token registered:', data);
    return true;

  } catch (error) {
    console.error('Error registering device token:', error);
    return false;
  }
}

/**
 * Set up push notification listeners
 */
export async function setupPushListeners(
  onNotificationReceived: (notification: { title: string; body: string; data: Record<string, unknown> }) => void,
  onNotificationTapped: (notification: { title: string; body: string; data: Record<string, unknown> }) => void
): Promise<void> {
  if (!isNativePlatform()) {
    return;
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received:', notification);
      onNotificationReceived({
        title: notification.title || '',
        body: notification.body || '',
        data: notification.data || {},
      });
    });

    // Notification tapped
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push notification action:', action);
      onNotificationTapped({
        title: action.notification.title || '',
        body: action.notification.body || '',
        data: action.notification.data || {},
      });
    });

  } catch (error) {
    console.error('Error setting up push listeners:', error);
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found, return defaults
        return {
          scanAlerts: true,
          recallAlerts: true,
          dangerousProductAlerts: true,
          dailySummary: false,
          weeklyReport: true,
          healthTips: false,
          socialNotifications: true,
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
        };
      }
      throw error;
    }

    return {
      scanAlerts: data.scan_alerts,
      recallAlerts: data.recall_alerts,
      dangerousProductAlerts: data.dangerous_product_alerts,
      dailySummary: data.daily_summary,
      weeklyReport: data.weekly_report,
      healthTips: data.health_tips,
      socialNotifications: data.social_notifications ?? true,
      quietHoursEnabled: data.quiet_hours_enabled,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
    };

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const dbPreferences: Record<string, unknown> = {};
    
    if (preferences.scanAlerts !== undefined) dbPreferences.scan_alerts = preferences.scanAlerts;
    if (preferences.recallAlerts !== undefined) dbPreferences.recall_alerts = preferences.recallAlerts;
    if (preferences.dangerousProductAlerts !== undefined) dbPreferences.dangerous_product_alerts = preferences.dangerousProductAlerts;
    if (preferences.dailySummary !== undefined) dbPreferences.daily_summary = preferences.dailySummary;
    if (preferences.weeklyReport !== undefined) dbPreferences.weekly_report = preferences.weeklyReport;
    if (preferences.healthTips !== undefined) dbPreferences.health_tips = preferences.healthTips;
    if (preferences.socialNotifications !== undefined) dbPreferences.social_notifications = preferences.socialNotifications;
    if (preferences.quietHoursEnabled !== undefined) dbPreferences.quiet_hours_enabled = preferences.quietHoursEnabled;
    if (preferences.quietHoursStart !== undefined) dbPreferences.quiet_hours_start = preferences.quietHoursStart;
    if (preferences.quietHoursEnd !== undefined) dbPreferences.quiet_hours_end = preferences.quietHoursEnd;

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...dbPreferences,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(limit: number = 50): Promise<NotificationHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('notification_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notification history:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      title: item.title,
      body: item.body,
      type: item.notification_type,
      status: item.status,
      createdAt: item.created_at,
      readAt: item.read_at,
    }));

  } catch (error) {
    console.error('Error fetching notification history:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_history')
      .update({ 
        read_at: new Date().toISOString(),
        status: 'read',
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Send a test notification (for debugging)
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: user.id,
        title: 'Test Notification',
        body: 'Push notifications are working!',
        type: 'health_tip',
      }
    });

    if (error) {
      console.error('Error sending test notification:', error);
      return false;
    }

    console.log('Test notification sent:', data);
    return true;

  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

// Export service object
export const pushNotifications = {
  initialize: initializePushNotifications,
  registerToken: registerDeviceToken,
  setupListeners: setupPushListeners,
  getPreferences: getNotificationPreferences,
  updatePreferences: updateNotificationPreferences,
  getHistory: getNotificationHistory,
  markAsRead: markNotificationAsRead,
  sendTest: sendTestNotification,
};

export default pushNotifications;
