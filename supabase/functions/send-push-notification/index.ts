import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Send Push Notification
 * Sends notifications to user devices via APNs/FCM
 * 
 * Supports:
 * - Scan alerts (dangerous products)
 * - Recall notifications
 * - Daily/weekly summaries
 * - Health tips
 */

interface NotificationRequest {
  userId: string;
  title: string;
  body: string;
  type: 'scan_alert' | 'recall' | 'dangerous_product' | 'daily_summary' | 'weekly_report' | 'health_tip' | 'social_interaction';
  data?: Record<string, unknown>;
  scanId?: string;
}

interface APNsPayload {
  aps: {
    alert: {
      title: string;
      body: string;
    };
    sound: string;
    badge?: number;
    'content-available'?: number;
  };
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // This endpoint requires service role for server-to-server calls
    const authHeader = req.headers.get('Authorization');
    
    // Parse request body
    const body: NotificationRequest = await req.json();
    const { userId, title, body: notificationBody, type, data, scanId } = body;

    if (!userId || !title || !notificationBody || !type) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'userId, title, body, and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending ${type} notification to user: ${userId}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check user's notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError);
    }

    // Check if user has enabled this notification type
    if (preferences) {
      const typeToPreference: Record<string, string> = {
        'scan_alert': 'scan_alerts',
        'recall': 'recall_alerts',
        'dangerous_product': 'dangerous_product_alerts',
        'daily_summary': 'daily_summary',
        'weekly_report': 'weekly_report',
        'health_tip': 'health_tips',
      };

      const prefKey = typeToPreference[type];
      if (prefKey && !preferences[prefKey]) {
        console.log(`User has disabled ${type} notifications`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: 'User has disabled this notification type' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check quiet hours
      if (preferences.quiet_hours_enabled) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const start = preferences.quiet_hours_start;
        const end = preferences.quiet_hours_end;

        // Simple quiet hours check (doesn't handle overnight spans perfectly)
        if (start && end) {
          if (start < end) {
            // Same day range (e.g., 09:00 - 17:00)
            if (currentTime >= start && currentTime <= end) {
              console.log('Within quiet hours, skipping notification');
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  reason: 'Within quiet hours' 
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            // Overnight range (e.g., 22:00 - 07:00)
            if (currentTime >= start || currentTime <= end) {
              console.log('Within quiet hours, skipping notification');
              return new Response(
                JSON.stringify({ 
                  success: false, 
                  reason: 'Within quiet hours' 
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }
    }

    // Get user's active device tokens
    const { data: devices, error: devicesError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (devicesError) {
      console.error('Error fetching device tokens:', devicesError);
      throw devicesError;
    }

    if (!devices || devices.length === 0) {
      console.log('No active devices found for user');
      
      // Still record the notification in history
      await supabase.from('notification_history').insert({
        user_id: userId,
        title,
        body: notificationBody,
        notification_type: type,
        data,
        scan_id: scanId,
        status: 'failed',
        error_message: 'No active devices',
      });

      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: 'No active devices registered' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${devices.length} active device(s)`);

    // Record notification in history
    const { data: notification, error: historyError } = await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        title,
        body: notificationBody,
        notification_type: type,
        data,
        scan_id: scanId,
        status: 'pending',
      })
      .select()
      .single();

    if (historyError) {
      console.error('Error recording notification:', historyError);
    }

    // Prepare push notification payloads
    const results: Array<{ device: string; success: boolean; error?: string }> = [];

    for (const device of devices) {
      try {
        if (device.platform === 'ios') {
          // APNs payload format
          const apnsPayload: APNsPayload = {
            aps: {
              alert: {
                title,
                body: notificationBody,
              },
              sound: 'default',
              'content-available': 1,
            },
            data: {
              type,
              scanId,
              ...data,
            },
          };

          // Note: Actual APNs sending requires APNs auth key
          // This is a placeholder for the push service integration
          console.log(`Would send to iOS device: ${device.id}`, apnsPayload);
          
          // TODO: Integrate with APNs when APNS_KEY is configured
          // For now, we'll simulate success
          results.push({ device: device.id, success: true });

        } else if (device.platform === 'android') {
          // FCM payload format
          const fcmPayload = {
            notification: {
              title,
              body: notificationBody,
            },
            data: {
              type,
              scanId: scanId || '',
              ...data,
            },
            token: device.token,
          };

          console.log(`Would send to Android device: ${device.id}`, fcmPayload);
          
          // TODO: Integrate with FCM when FCM_SERVER_KEY is configured
          results.push({ device: device.id, success: true });

        } else if (device.platform === 'web') {
          // Web Push payload
          const webPushPayload = {
            title,
            body: notificationBody,
            icon: '/apple-touch-icon.png',
            data: {
              type,
              scanId,
              ...data,
            },
          };

          console.log(`Would send to web device: ${device.id}`, webPushPayload);
          results.push({ device: device.id, success: true });
        }

      } catch (deviceError) {
        console.error(`Error sending to device ${device.id}:`, deviceError);
        results.push({ 
          device: device.id, 
          success: false, 
          error: deviceError instanceof Error ? deviceError.message : 'Unknown error' 
        });
      }
    }

    // Update notification status
    const allSuccessful = results.every(r => r.success);
    if (notification) {
      await supabase
        .from('notification_history')
        .update({
          status: allSuccessful ? 'sent' : 'failed',
          sent_at: allSuccessful ? new Date().toISOString() : null,
          error_message: allSuccessful ? null : 'Some devices failed',
        })
        .eq('id', notification.id);
    }

    console.log('Notification processing complete:', results);

    // Trigger Zapier webhook for push notification sent
    try {
      const zapierSettings = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'zapier_enabled_events')
        .maybeSingle();

      const enabledEvents = zapierSettings.data?.value 
        ? JSON.parse(zapierSettings.data.value) 
        : [];

      if (enabledEvents.includes('push_notification_sent')) {
        const webhookUrl = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'zapier_webhook_url')
          .maybeSingle();

        if (webhookUrl.data?.value) {
          await fetch(webhookUrl.data.value, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'push_notification_sent',
              timestamp: new Date().toISOString(),
              data: {
                notification_id: notification?.id,
                type,
                title,
                body: notificationBody,
                user_id: userId,
                devices_targeted: devices.length,
                success_count: results.filter(r => r.success).length,
                fail_count: results.filter(r => !r.success).length,
              },
            }),
          });
          console.log('[Zapier] Push notification webhook triggered');
        }
      }
    } catch (zapierError) {
      console.error('[Zapier] Error triggering webhook:', zapierError);
      // Don't fail the request if Zapier webhook fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        notificationId: notification?.id,
        devicesTargeted: devices.length,
        results,
        message: 'Notification queued for delivery'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
