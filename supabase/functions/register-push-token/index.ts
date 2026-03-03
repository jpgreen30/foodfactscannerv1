import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Register Device Token
 * Stores device push notification tokens for iOS/Android/Web
 */

interface RegisterRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
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
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: RegisterRequest = await req.json();
    const { token, platform, deviceName } = body;

    if (!token || !platform) {
      console.log('Missing required fields:', { token: !!token, platform: !!platform });
      return new Response(
        JSON.stringify({ error: 'Token and platform are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return new Response(
        JSON.stringify({ error: 'Invalid platform. Must be ios, android, or web' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Registering device token for user: ${user.id}, platform: ${platform}`);

    // Upsert device token (update if exists, insert if not)
    const { data, error } = await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: user.id,
          token,
          platform,
          device_name: deviceName || `${platform} device`,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'token',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error registering device token:', error);
      throw error;
    }

    console.log('Device token registered successfully:', data.id);

    // Ensure notification preferences exist
    const { error: prefError } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user.id },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );

    if (prefError) {
      console.warn('Error ensuring notification preferences:', prefError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deviceId: data.id,
        message: 'Device registered for push notifications'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error registering device:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to register device' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
