import { useState, useEffect, useCallback } from 'react';
import { 
  pushNotifications, 
  NotificationPreferences, 
  NotificationHistoryItem 
} from '@/services/pushNotifications';
import { isNativePlatform } from '@/services/nativeCapabilities';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Initialize push notifications
  const initialize = useCallback(async () => {
    if (!isNativePlatform()) {
      console.log('Push notifications not available on web');
      return;
    }

    setIsLoading(true);
    try {
      const token = await pushNotifications.initialize();
      if (token) {
        setIsInitialized(true);
        
        // Set up listeners
        await pushNotifications.setupListeners(
          // On notification received (foreground)
          (notification) => {
            toast({
              title: notification.title,
              description: notification.body,
            });
            // Refresh history
            loadHistory();
          },
          // On notification tapped
          (notification) => {
            // Handle navigation based on notification type
            const type = notification.data?.type as string;
            if (type === 'scan_alert' || type === 'dangerous_product') {
              // Could navigate to scan history
              console.log('Navigate to scan:', notification.data?.scanId);
            }
          }
        );
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    const prefs = await pushNotifications.getPreferences();
    setPreferences(prefs);
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    const success = await pushNotifications.updatePreferences(updates);
    if (success) {
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: 'Preferences updated',
        description: 'Your notification settings have been saved.',
      });
    }
    return success;
  }, [toast]);

  // Load notification history
  const loadHistory = useCallback(async () => {
    const items = await pushNotifications.getHistory();
    setHistory(items);
    setUnreadCount(items.filter(item => !item.readAt).length);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const success = await pushNotifications.markAsRead(notificationId);
    if (success) {
      setHistory(prev => 
        prev.map(item => 
          item.id === notificationId 
            ? { ...item, readAt: new Date().toISOString(), status: 'read' }
            : item
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    return success;
  }, []);

  // Send test notification
  const sendTest = useCallback(async () => {
    const success = await pushNotifications.sendTest();
    if (success) {
      toast({
        title: 'Test notification sent',
        description: 'Check your device for the notification.',
      });
    } else {
      toast({
        title: 'Failed to send',
        description: 'Could not send test notification.',
        variant: 'destructive',
      });
    }
    return success;
  }, [toast]);

  // Load preferences and history on mount
  useEffect(() => {
    loadPreferences();
    loadHistory();
  }, [loadPreferences, loadHistory]);

  return {
    // State
    isInitialized,
    isLoading,
    isAvailable: isNativePlatform(),
    preferences,
    history,
    unreadCount,
    
    // Actions
    initialize,
    updatePreferences,
    loadHistory,
    markAsRead,
    sendTest,
  };
}

export default usePushNotifications;
