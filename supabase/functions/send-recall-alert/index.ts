import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Send Recall Alert
 * Sends push notifications and SMS to users who have scanned a recalled product
 * 
 * This can be triggered:
 * - Manually by admin via API call
 * - Automatically by a scheduled job checking FDA recall database
 */

interface RecallAlertRequest {
  productName?: string;
  barcode?: string;
  brand?: string;
  recallReason: string;
  recallAction: string;
  recallDate?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

Deno.serve(async (req) => {
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
    console.log('[RECALL-ALERT] Function started');

    const body: RecallAlertRequest = await req.json();
    const { productName, barcode, brand, recallReason, recallAction, recallDate, severity = 'high' } = body;

    if (!recallReason || !recallAction) {
      return new Response(
        JSON.stringify({ error: 'recallReason and recallAction are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!productName && !barcode && !brand) {
      return new Response(
        JSON.stringify({ error: 'At least one of productName, barcode, or brand is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[RECALL-ALERT] Processing recall for:', { productName, barcode, brand });

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find users who have scanned this product
    let query = supabase
      .from('scan_history')
      .select('user_id, product_name, brand, barcode');

    if (barcode) {
      query = query.eq('barcode', barcode);
    } else if (productName && brand) {
      query = query.ilike('product_name', `%${productName}%`).ilike('brand', `%${brand}%`);
    } else if (productName) {
      query = query.ilike('product_name', `%${productName}%`);
    } else if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    const { data: affectedScans, error: scanError } = await query;

    if (scanError) {
      console.error('[RECALL-ALERT] Error finding affected users:', scanError);
      throw scanError;
    }

    if (!affectedScans || affectedScans.length === 0) {
      console.log('[RECALL-ALERT] No users have scanned this product');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users have scanned this product',
          usersNotified: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(affectedScans.map(scan => scan.user_id))];
    console.log(`[RECALL-ALERT] Found ${uniqueUserIds.length} unique users to notify`);

    // Get users who have recall alerts enabled and want SMS
    const { data: usersToNotify, error: userError } = await supabase
      .from('notification_preferences')
      .select('user_id, recall_alerts')
      .in('user_id', uniqueUserIds)
      .eq('recall_alerts', true);

    if (userError) {
      console.error('[RECALL-ALERT] Error fetching user preferences:', userError);
    }

    const usersWithAlertsEnabled = usersToNotify?.map(u => u.user_id) || uniqueUserIds;
    console.log(`[RECALL-ALERT] ${usersWithAlertsEnabled.length} users have recall alerts enabled`);

    // Get phone numbers for SMS alerts
    const { data: phoneUsers, error: phoneError } = await supabase
      .from('profiles')
      .select('id, phone_number, wants_recall_sms')
      .in('id', usersWithAlertsEnabled)
      .eq('wants_recall_sms', true)
      .not('phone_number', 'is', null);

    if (phoneError) {
      console.error('[RECALL-ALERT] Error fetching phone numbers:', phoneError);
    }

    console.log(`[RECALL-ALERT] ${phoneUsers?.length || 0} users have SMS enabled`);

    // Prepare notification content
    const displayProduct = productName || brand || 'A product you scanned';
    const notificationTitle = severity === 'critical' 
      ? '🚨 URGENT: Product Recall Alert!' 
      : '⚠️ Product Recall Alert';
    const notificationBody = `${displayProduct} has been recalled. Reason: ${recallReason}. ${recallAction}`;

    // Send push notifications to all users with alerts enabled
    const pushResults: Array<{ userId: string; success: boolean }> = [];
    
    for (const userId of usersWithAlertsEnabled) {
      try {
        // Call the send-push-notification function
        const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId,
            title: notificationTitle,
            body: notificationBody,
            type: 'recall',
            data: {
              productName,
              barcode,
              brand,
              recallReason,
              recallAction,
              recallDate,
              severity,
            }
          }
        });

        pushResults.push({ userId, success: !pushError });
        if (pushError) {
          console.error(`[RECALL-ALERT] Push failed for user ${userId}:`, pushError);
        }
      } catch (err) {
        console.error(`[RECALL-ALERT] Error sending push to ${userId}:`, err);
        pushResults.push({ userId, success: false });
      }
    }

    // Send SMS to users who opted in via Twilio
    const smsResults: Array<{ userId: string; phone: string; success: boolean }> = [];
    
    if (phoneUsers && phoneUsers.length > 0) {
      const smsMessage = `FOOD RECALL ALERT: ${displayProduct} has been recalled. ${recallReason}. ${recallAction} - Food Fact Scanner`;
      
      for (const user of phoneUsers) {
        try {
          // Call the send-sms edge function
          const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms', {
            body: {
              to: user.phone_number,
              message: smsMessage,
              user_id: user.id,
              notification_type: 'recall_sms'
            }
          });

          if (smsError) {
            console.error(`[RECALL-ALERT] SMS failed for user ${user.id}:`, smsError);
            smsResults.push({ userId: user.id, phone: user.phone_number!, success: false });
          } else {
            console.log(`[RECALL-ALERT] SMS sent to ${user.phone_number}`);
            smsResults.push({ userId: user.id, phone: user.phone_number!, success: true });
          }
        } catch (err) {
          console.error(`[RECALL-ALERT] Error sending SMS to ${user.id}:`, err);
          smsResults.push({ userId: user.id, phone: user.phone_number!, success: false });
        }
      }
    }

    const successfulPushes = pushResults.filter(r => r.success).length;
    const successfulSms = smsResults.filter(r => r.success).length;

    console.log(`[RECALL-ALERT] Complete. Push: ${successfulPushes}/${usersWithAlertsEnabled.length}, SMS: ${successfulSms}/${phoneUsers?.length || 0}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Recall alerts sent',
        stats: {
          totalAffectedUsers: uniqueUserIds.length,
          usersWithAlertsEnabled: usersWithAlertsEnabled.length,
          pushNotificationsSent: successfulPushes,
          smsAlertsSent: successfulSms,
        },
        pushResults,
        smsResults,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RECALL-ALERT] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send recall alerts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});