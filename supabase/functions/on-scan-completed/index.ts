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

    const { barcode, product_name, risk_level, heavy_metals_avoid, health_score } = await req.json();
    
    console.log(`[on-scan-completed] User ${user.id} scanned ${product_name}, risk: ${risk_level}`);

    // 1. Get current profile
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('subscription_status, subscription_tier, scan_credits_remaining, total_scans_used, email, first_name, high_risk_flag, trial_status, trial_expired, scan_reset_date')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: corsHeaders });
    }

    const tier = profile.subscription_tier || 'free';
    const isPremium = tier === 'premium' || tier === 'annual';
    const isBasic = tier === 'basic';
    const isFree = !isPremium && !isBasic;
    
    let scansUsed = profile.total_scans_used ?? 0;
    let blocked = false;
    let creditsRemaining = profile.scan_credits_remaining ?? 10;

    // 2. Handle scan limits by tier
    if (isFree) {
      // FREE: 10 lifetime scans, hard block after
      if (scansUsed >= 10 || profile.trial_expired) {
        blocked = true;
        await triggerEmail(serviceClient, user.id, 'upgrade_required', {
          email: user.email,
          first_name: profile.first_name,
          product_name,
        });
        
        // Ensure trial_expired is set
        if (!profile.trial_expired) {
          await serviceClient.from('profiles').update({ trial_expired: true, trial_status: 'expired' }).eq('id', user.id);
        }
        
        return new Response(JSON.stringify({
          success: false,
          blocked: true,
          message: 'Free trial scans exhausted. Please upgrade to continue.',
          scans_used: scansUsed,
          scan_limit: 10,
          credits_remaining: 0,
          prompt_type: 'hard_lock',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      creditsRemaining = Math.max(0, 10 - scansUsed - 1);
    } else if (isBasic) {
      // BASIC: 20 per billing cycle, reset monthly
      const now = new Date();
      const resetDate = profile.scan_reset_date ? new Date(profile.scan_reset_date) : null;
      
      // Check if we need to reset the monthly counter
      if (!resetDate || now >= resetDate) {
        // Reset scans and set next reset date (30 days from now)
        const nextReset = new Date(now);
        nextReset.setDate(nextReset.getDate() + 30);
        
        await serviceClient.from('profiles').update({
          scan_credits_remaining: 20,
          scan_reset_date: nextReset.toISOString(),
        }).eq('id', user.id);
        
        creditsRemaining = 20;
        console.log(`[on-scan-completed] Basic tier monthly reset for user ${user.id}, next reset: ${nextReset.toISOString()}`);
      } else {
        creditsRemaining = profile.scan_credits_remaining ?? 20;
      }
      
      if (creditsRemaining <= 0) {
        return new Response(JSON.stringify({
          success: false,
          blocked: true,
          message: 'Monthly scan limit reached. Resets on your next billing cycle or upgrade to Premium for unlimited.',
          scans_used: 20 - creditsRemaining,
          scan_limit: 20,
          credits_remaining: 0,
          prompt_type: 'basic_limit',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      creditsRemaining -= 1;
    }
    // PREMIUM/ANNUAL: unlimited, no blocking

    // 3. Update profile
    const updateData: Record<string, unknown> = {
      total_scans_used: scansUsed + 1,
      last_scan_timestamp: new Date().toISOString(),
    };

    if (isFree) {
      updateData.scan_credits_remaining = creditsRemaining;
      if (creditsRemaining === 0) {
        updateData.trial_status = 'expired';
        updateData.trial_expired = true;
      }
    } else if (isBasic) {
      updateData.scan_credits_remaining = creditsRemaining;
    }

    if (risk_level === 'high') {
      updateData.high_risk_flag = true;
    }

    // Detect high-intent users (3+ scans in quick succession)
    if (scansUsed >= 2 && isFree) {
      updateData.high_intent_user = true;
    }

    await serviceClient
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    // 4. Insert scan event
    await userClient
      .from('scan_events')
      .insert({
        user_id: user.id,
        barcode: barcode || null,
        product_name: product_name || 'Unknown',
        risk_level: risk_level || 'low',
        heavy_metals_avoid: heavy_metals_avoid || false,
      });

    // 5. Determine prompt type for free users
    let promptType: string | null = null;
    if (isFree) {
      const newScansUsed = scansUsed + 1;
      if (newScansUsed >= 10) {
        promptType = 'hard_lock'; // 10 scans used → hard lock modal
      } else if (newScansUsed >= 9) {
        promptType = 'strong_prompt'; // 9 scans used → stronger prompt
      } else if (newScansUsed >= 7) {
        promptType = 'soft_prompt'; // 7 scans used → soft upgrade prompt
      }
    }

    // 6. Trigger emails & Klaviyo events based on credit state
    if (isFree) {
      const newScansUsedCount = scansUsed + 1;

      // Trial started (first scan ever)
      if (newScansUsedCount === 1) {
        await triggerKlaviyoEvent(serviceClient, user.email || profile.email, 'Trial Started', {
          plan: 'free',
          total_credits: 10,
          user_id: user.id,
        });
      }

      // 5 scans remaining (5 used)
      if (newScansUsedCount === 5) {
        await triggerKlaviyoEvent(serviceClient, user.email || profile.email, '5 Scans Remaining', {
          scans_used: 5,
          credits_remaining: 5,
          plan: 'free',
          user_id: user.id,
        });
      }

      // 2 scans remaining (8 used)
      if (newScansUsedCount === 8) {
        await triggerKlaviyoEvent(serviceClient, user.email || profile.email, '2 Scans Remaining', {
          scans_used: 8,
          credits_remaining: 2,
          plan: 'free',
          user_id: user.id,
        });
      }

      if (creditsRemaining === 1) {
        await triggerEmail(serviceClient, user.id, 'low_credit', {
          email: user.email,
          first_name: profile.first_name,
          credits_remaining: 1,
          last_scanned_product: product_name,
        });
      }
      if (creditsRemaining === 0) {
        await triggerEmail(serviceClient, user.id, 'upgrade_required', {
          email: user.email,
          first_name: profile.first_name,
          product_name,
          high_risk: risk_level === 'high',
        });
        // Trial expired Klaviyo event
        await triggerKlaviyoEvent(serviceClient, user.email || profile.email, 'Trial Expired', {
          total_scans: newScansUsedCount,
          plan: 'free',
          user_id: user.id,
        });
      }
    }

    // 7. Handle high-risk scan
    if (risk_level === 'high') {
      await triggerEmail(serviceClient, user.id, 'high_risk_alert', {
        email: user.email,
        first_name: profile.first_name,
        product_name,
        health_score,
        subscription_status: profile.subscription_status,
      });
      // Klaviyo: High-Risk Product Scanned
      await triggerKlaviyoEvent(serviceClient, user.email || profile.email, 'High Risk Product Scanned', {
        product_name,
        health_score,
        risk_level: 'high',
        plan: tier,
        user_id: user.id,
      });
    }

    // 7b. Update Klaviyo profile with segment properties
    await updateKlaviyoSegmentProperties(serviceClient, user.id, user.email || profile.email, {
      tier,
      scansUsed: scansUsed + 1,
      isHighRisk: risk_level === 'high' || profile.high_risk_flag,
      creditsRemaining: isPremium ? -1 : creditsRemaining,
    });

    // 8. Dispatch Zapier webhooks with standardized payloads
    try {
      const { data: zapierSettings } = await serviceClient
        .from('app_settings')
        .select('value')
        .eq('key', 'zapier_webhook_url')
        .maybeSingle();

      if (zapierSettings?.value) {
        const webhookUrl = zapierSettings.value;
        const basePayload = {
          user_id: user.id,
          plan: tier,
          timestamp: new Date().toISOString(),
        };

        // Compute HubSpot lifecycle stage
        const lifecycleStage = isPremium ? "Premium Subscriber"
          : isBasic ? "Basic Subscriber"
          : (profile.trial_expired ? "Lead" : "Trial User");

        // Compute average risk from recent scan events
        const { data: recentScans } = await serviceClient
          .from('scan_events')
          .select('risk_level')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
          .limit(20);

        const riskMap: Record<string, number> = { low: 1, moderate: 2, high: 3 };
        const riskValues = (recentScans || []).map((s: any) => riskMap[s.risk_level] || 1);
        const riskHistoryAvg = riskValues.length > 0
          ? Math.round((riskValues.reduce((a: number, b: number) => a + b, 0) / riskValues.length) * 100) / 100
          : 0;

        const hubspotFields = {
          email: user.email || profile.email,
          subscription_status: profile.subscription_status || "free_trial",
          subscription_tier: tier,
          total_scans: scansUsed + 1,
          risk_history_average: riskHistoryAvg,
          trial_status: profile.trial_status || "active",
          lifecycle_stage: lifecycleStage,
        };

        // scan.completed
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'scan.completed',
            ...basePayload,
            ...hubspotFields,
            scan_count: scansUsed + 1,
            risk_level: risk_level || 'low',
            product_name,
            health_score,
            credits_remaining: isPremium ? -1 : creditsRemaining,
          }),
        });

        // scan.limit_reached
        if ((isFree && creditsRemaining === 0) || (isBasic && creditsRemaining === 0)) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'scan.limit_reached',
              ...basePayload,
              ...hubspotFields,
              scan_count: scansUsed + 1,
              scan_limit: isFree ? 10 : 20,
              risk_level: risk_level || 'low',
            }),
          });
        }

        // high_risk_detected
        if (risk_level === 'high') {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'high_risk_detected',
              ...basePayload,
              ...hubspotFields,
              scan_count: scansUsed + 1,
              risk_level: 'high',
              product_name,
              health_score,
            }),
          });
        }

        console.log('[on-scan-completed] Zapier webhooks dispatched');
      }
    } catch (e) {
      console.error('[on-scan-completed] Zapier webhook error:', e);
    }

    return new Response(JSON.stringify({
      success: true,
      blocked: false,
      credits_remaining: isPremium ? -1 : creditsRemaining,
      scans_used: scansUsed + 1,
      scan_limit: isFree ? 10 : isBasic ? 20 : -1,
      total_scans: scansUsed + 1,
      is_high_risk: risk_level === 'high',
      subscription_tier: tier,
      prompt_type: promptType,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[on-scan-completed] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Deduplicated email trigger - won't send same type within 24h
async function triggerEmail(
  serviceClient: any,
  userId: string,
  emailType: string,
  metadata: Record<string, unknown>
) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await serviceClient
      .from('email_log')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', emailType)
      .gte('sent_at', twentyFourHoursAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[email] Skipping ${emailType} for ${userId} - already sent within 24h`);
      return;
    }

    await serviceClient
      .from('email_log')
      .insert({ user_id: userId, email_type: emailType, metadata });

    // Trigger Klaviyo if API key is configured
    const klaviyoKey = Deno.env.get('KLAVIYO_API_KEY');
    if (klaviyoKey && metadata.email) {
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
              metric: { data: { type: 'metric', attributes: { name: emailType } } },
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email: metadata.email,
                    first_name: metadata.first_name,
                    properties: {
                      scan_credits_remaining: metadata.credits_remaining,
                      last_scanned_product: metadata.last_scanned_product || metadata.product_name,
                      subscription_status: metadata.subscription_status,
                      health_score: metadata.health_score,
                    },
                  },
                },
              },
              properties: metadata,
            },
          },
        }),
      });
      console.log(`[Klaviyo] Event ${emailType} sent for ${metadata.email}`);
    }

    console.log(`[email] ${emailType} triggered for user ${userId}`);
  } catch (error) {
    console.error(`[email] Error triggering ${emailType}:`, error);
  }
}

// Direct Klaviyo event tracker (separate from email dedup)
async function triggerKlaviyoEvent(
  serviceClient: any,
  email: string,
  metricName: string,
  properties: Record<string, unknown>
) {
  try {
    const klaviyoKey = Deno.env.get('KLAVIYO_API_KEY');
    if (!klaviyoKey || !email) return;

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
            metric: { data: { type: 'metric', attributes: { name: metricName } } },
            profile: { data: { type: 'profile', attributes: { email } } },
            properties,
            time: new Date().toISOString(),
          },
        },
      }),
    });
    console.log(`[Klaviyo] Event "${metricName}" sent for ${email}`);
  } catch (e) {
    console.error(`[Klaviyo] Error sending "${metricName}":`, e);
  }
}

// Update Klaviyo profile with segment-enabling properties
async function updateKlaviyoSegmentProperties(
  serviceClient: any,
  userId: string,
  email: string,
  ctx: { tier: string; scansUsed: number; isHighRisk: boolean; creditsRemaining: number }
) {
  try {
    const klaviyoKey = Deno.env.get('KLAVIYO_API_KEY');
    if (!klaviyoKey || !email) return;

    // Fetch parent indicators
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('is_pregnant, is_nursing, is_new_mom, baby_count')
      .eq('id', userId)
      .single();

    const isParent = profile?.is_pregnant || profile?.is_nursing || profile?.is_new_mom || (profile?.baby_count > 0);

    await fetch('https://a.klaviyo.com/api/profile-import/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
        'revision': '2024-02-15',
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email,
            properties: {
              // Segment: Trial Users
              is_trial_user: ctx.tier === 'free' || !ctx.tier,
              // Segment: Heavy Scanners (10+ scans)
              is_heavy_scanner: ctx.scansUsed >= 10,
              total_scans: ctx.scansUsed,
              // Segment: High-Risk Concern Parents
              is_high_risk_concern: ctx.isHighRisk && isParent,
              has_high_risk_history: ctx.isHighRisk,
              is_parent: isParent,
              // Segment: Premium Users
              is_premium_user: ['premium', 'annual', 'basic'].includes(ctx.tier),
              subscription_tier: ctx.tier,
              credits_remaining: ctx.creditsRemaining,
            },
          },
        },
      }),
    });
    console.log(`[Klaviyo] Segment properties updated for ${email}`);
  } catch (e) {
    console.error(`[Klaviyo] Error updating segment properties:`, e);
  }
}
