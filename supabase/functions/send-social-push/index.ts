import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Send Social Push Notification
 * Triggered by database webhook when a social notification is created
 * Sends push notifications for likes, comments, and replies
 */

interface SocialNotificationPayload {
  type: 'INSERT';
  table: 'social_notifications';
  record: {
    id: string;
    user_id: string;
    actor_id: string;
    notification_type: 'like' | 'comment' | 'reply';
    post_id: string | null;
    comment_id: string | null;
    is_read: boolean;
    created_at: string;
  };
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
    const payload: SocialNotificationPayload = await req.json();
    const { record } = payload;

    if (!record || !record.user_id || !record.actor_id) {
      console.log('Invalid payload:', payload);
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing social notification: ${record.notification_type} for user ${record.user_id}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get actor's profile for the notification message
    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('display_name, first_name')
      .eq('id', record.actor_id)
      .maybeSingle();

    const actorName = actorProfile?.display_name || actorProfile?.first_name || 'Someone';

    // Get post title if available
    let postTitle = 'your post';
    if (record.post_id) {
      const { data: post } = await supabase
        .from('community_posts')
        .select('title')
        .eq('id', record.post_id)
        .maybeSingle();
      
      if (post?.title) {
        postTitle = `"${post.title.slice(0, 30)}${post.title.length > 30 ? '...' : ''}"`;
      }
    }

    // Build notification content based on type
    let title = '';
    let body = '';

    switch (record.notification_type) {
      case 'like':
        title = '❤️ New Like';
        body = `${actorName} liked ${postTitle}`;
        break;
      case 'comment':
        title = '💬 New Comment';
        body = `${actorName} commented on ${postTitle}`;
        break;
      case 'reply':
        title = '↩️ New Reply';
        body = `${actorName} replied to your comment`;
        break;
    }

    // Check if user has push notifications enabled (via device tokens)
    const { data: devices, error: devicesError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', record.user_id)
      .eq('is_active', true);

    if (devicesError) {
      console.error('Error fetching device tokens:', devicesError);
      throw devicesError;
    }

    if (!devices || devices.length === 0) {
      console.log('No active devices found for user, skipping push notification');
      return new Response(
        JSON.stringify({ success: true, reason: 'No active devices' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${devices.length} active device(s), sending push notification`);

    // Call the existing send-push-notification function
    const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        userId: record.user_id,
        title,
        body,
        type: 'social_interaction',
        data: {
          notificationId: record.id,
          notificationType: record.notification_type,
          postId: record.post_id,
          commentId: record.comment_id,
          actorId: record.actor_id,
        },
      }),
    });

    const pushResult = await pushResponse.json();
    console.log('Push notification result:', pushResult);

    return new Response(
      JSON.stringify({ success: true, pushResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing social notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process notification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
