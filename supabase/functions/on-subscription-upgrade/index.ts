import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { new_tier, previous_tier } = await req.json();

    console.log(`[on-subscription-upgrade] User ${user.id} upgrading from ${previous_tier} to ${new_tier}`);

    // Determine credits based on tier
    const creditsMap: Record<string, number> = {
      basic: 20,
      premium: -1, // unlimited
      annual: -1,  // unlimited
    };

    const newCredits = creditsMap[new_tier] ?? 3;

    // Update profile
    await serviceClient
      .from('profiles')
      .update({
        subscription_status: new_tier,
        subscription_tier: new_tier,
        trial_status: 'upgraded',
        scan_credits_remaining: newCredits,
        high_intent_user: false, // Reset after upgrade
      })
      .eq('id', user.id);

    // Log email
    await serviceClient
      .from('email_log')
      .insert({
        user_id: user.id,
        email_type: 'upgrade_confirmation',
        metadata: {
          email: user.email,
          new_tier,
          previous_tier,
          credits: newCredits === -1 ? 'unlimited' : newCredits,
        },
      });

    // Trigger Klaviyo upgrade confirmation event
    const klaviyoKey = Deno.env.get('KLAVIYO_API_KEY');
    if (klaviyoKey && user.email) {
      const priceMap: Record<string, string> = {
        basic: '$9.99/month',
        premium: '$24.99/month',
        annual: '$74.99/year',
      };

      await fetch('https://a.klaviyo.com/api/events/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
          'revision': '2024-02-15',
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              metric: { data: { type: 'metric', attributes: { name: 'subscription_upgrade' } } },
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email: user.email,
                    properties: {
                      subscription_status: new_tier,
                      scan_credits_remaining: newCredits,
                    },
                  },
                },
              },
              properties: {
                new_tier,
                previous_tier,
                plan_price: priceMap[new_tier] || 'Unknown',
                credits: newCredits === -1 ? 'unlimited' : newCredits,
              },
            },
          },
        }),
      });
      console.log(`[Klaviyo] Upgrade event sent for ${user.email}`);
    }

    // Fire Zapier webhook
    try {
      const { data: zapierSettings } = await serviceClient
        .from('app_settings')
        .select('value')
        .eq('key', 'zapier_webhook_url')
        .maybeSingle();

      if (zapierSettings?.value) {
        await fetch(zapierSettings.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'subscription_upgrade',
            user_id: user.id,
            email: user.email,
            new_tier,
            previous_tier,
            timestamp: new Date().toISOString(),
          }),
        });
      }
    } catch (e) {
      console.error('[on-subscription-upgrade] Zapier error:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      new_tier,
      credits_remaining: newCredits,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[on-subscription-upgrade] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
