import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Baby food and formula keywords for matching recalls
const BABY_FOOD_KEYWORDS = [
  'infant formula', 'baby formula', 'toddler formula',
  'baby food', 'infant food', 'toddler food',
  'baby cereal', 'infant cereal', 'rice cereal',
  'baby puree', 'baby pouch', 'baby snack',
  'gerber', 'enfamil', 'similac', 'earth\'s best',
  'beech-nut', 'happy baby', 'plum organics',
  'ella\'s kitchen', 'sprout', 'once upon a farm',
  'little spoon', 'yumi', 'serenity kids',
  'puffs', 'teething', 'mum-mum', 'yogurt melts',
];

// High-risk ingredients for babies
const HIGH_RISK_KEYWORDS = [
  'heavy metal', 'lead', 'arsenic', 'cadmium', 'mercury',
  'cronobacter', 'salmonella', 'listeria', 'e. coli',
  'choking', 'undeclared allergen', 'contamination',
];

interface BabyRecallResult {
  id: string;
  fda_recall_id: string | null;
  product_description: string;
  brand_name: string | null;
  reason_for_recall: string | null;
  classification: string | null;
  recalling_firm: string | null;
  created_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[BABY-RECALL] Starting baby food recall check...');

    // Check if this is a manual trigger or automatic
    let daysBack = 7;
    try {
      const body = await req.json();
      daysBack = body.daysBack || 7;
    } catch {
      // No body, use defaults
    }

    // Find recent recalls that match baby food keywords
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: recentRecalls, error: recallError } = await supabase
      .from('food_recalls')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (recallError) {
      console.error('[BABY-RECALL] Error fetching recalls:', recallError);
      throw recallError;
    }

    console.log(`[BABY-RECALL] Found ${recentRecalls?.length || 0} recent recalls`);

    // Filter for baby-related recalls
    const babyRecalls: BabyRecallResult[] = (recentRecalls || []).filter((recall: BabyRecallResult) => {
      const searchText = `${recall.product_description} ${recall.brand_name || ''} ${recall.reason_for_recall || ''}`.toLowerCase();
      return BABY_FOOD_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
    });

    console.log(`[BABY-RECALL] Identified ${babyRecalls.length} baby food/formula recalls`);

    if (babyRecalls.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No baby food recalls found in recent period',
        babyRecallsFound: 0,
        parentsNotified: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find all parents (users with baby profiles)
    const { data: parents, error: parentError } = await supabase
      .from('profiles')
      .select('id, email, phone_number, wants_recall_sms, display_name, first_name, baby_ages, feeding_stage, is_pregnant, is_new_mom, is_nursing')
      .or('is_pregnant.eq.true,is_new_mom.eq.true,is_nursing.eq.true')
      .not('email', 'is', null);

    if (parentError) {
      console.error('[BABY-RECALL] Error fetching parents:', parentError);
      throw parentError;
    }

    console.log(`[BABY-RECALL] Found ${parents?.length || 0} parents to potentially notify`);

    if (!parents || parents.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No parents registered in the system',
        babyRecallsFound: babyRecalls.length,
        parentsNotified: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check notification preferences and send alerts
    let emailsSent = 0;
    let pushSent = 0;
    let emailsFailed = 0;
    const notifiedParents = new Set<string>();

    for (const recall of babyRecalls) {
      // Determine severity based on recall reason
      const recallText = `${recall.reason_for_recall || ''} ${recall.classification || ''}`.toLowerCase();
      const isHighRisk = HIGH_RISK_KEYWORDS.some(keyword => recallText.includes(keyword));
      const severity = isHighRisk ? 'critical' : 
                       recall.classification === 'Class I' ? 'high' : 'medium';

      console.log(`[BABY-RECALL] Processing recall: ${recall.product_description?.slice(0, 50)}... (${severity})`);

      for (const parent of parents) {
        // Check if we already notified this user about this recall
        const { data: existingMatch } = await supabase
          .from('user_recall_matches')
          .select('id')
          .eq('user_id', parent.id)
          .eq('recall_id', recall.id)
          .single();

        if (existingMatch) {
          console.log(`[BABY-RECALL] Already notified ${parent.id} about recall ${recall.id}`);
          continue;
        }

        // Check notification preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('recall_alerts, email_recall_alerts, user_email')
          .eq('user_id', parent.id)
          .single();

        const wantsEmailAlerts = prefs?.email_recall_alerts !== false;
        const wantsPushAlerts = prefs?.recall_alerts !== false;
        const email = prefs?.user_email || parent.email;

        // Record the match
        await supabase
          .from('user_recall_matches')
          .insert({
            user_id: parent.id,
            recall_id: recall.id,
            notification_type: wantsEmailAlerts ? 'email' : 'push',
          });

        notifiedParents.add(parent.id);

        // Prepare personalized message
        const parentName = parent.first_name || parent.display_name || 'Parent';
        let ageContext = '';
        if (parent.baby_ages && Array.isArray(parent.baby_ages) && parent.baby_ages.length > 0) {
          const ages = parent.baby_ages.map((a: number) => a < 12 ? `${a} months` : `${Math.floor(a / 12)} year(s)`);
          ageContext = ` (baby ages: ${ages.join(', ')})`;
        } else if (parent.is_pregnant) {
          ageContext = ' (expecting)';
        }

        // Send push notification
        if (wantsPushAlerts) {
          try {
            const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: parent.id,
                title: severity === 'critical' ? '🚨 URGENT: Baby Food Recall!' : '⚠️ Baby Food Recall Alert',
                body: `${recall.brand_name || 'A baby product'}: ${recall.product_description?.slice(0, 100)}. ${recall.reason_for_recall?.slice(0, 80) || 'Check details.'}`,
                type: 'baby_recall',
                data: {
                  recallId: recall.id,
                  productDescription: recall.product_description,
                  brandName: recall.brand_name,
                  reason: recall.reason_for_recall,
                  severity,
                }
              }
            });

            if (!pushError) pushSent++;
          } catch (pushErr) {
            console.error(`[BABY-RECALL] Push failed for ${parent.id}:`, pushErr);
          }
        }

        // Send email notification
        if (wantsEmailAlerts && email) {
          await delay(600); // Rate limiting for Resend

          try {
            const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-baby-recall-email', {
              body: {
                email,
                parentName,
                ageContext,
                recall: {
                  productDescription: recall.product_description,
                  brandName: recall.brand_name,
                  reason: recall.reason_for_recall,
                  classification: recall.classification,
                  recallingFirm: recall.recalling_firm,
                },
                severity,
              },
            });

            if (emailError || !emailResult?.success) {
              emailsFailed++;
              console.error(`[BABY-RECALL] Email failed for ${email}:`, emailError || emailResult?.error);
            } else {
              emailsSent++;
              // Update notified_at
              await supabase
                .from('user_recall_matches')
                .update({ notified_at: new Date().toISOString() })
                .eq('user_id', parent.id)
                .eq('recall_id', recall.id);
            }
          } catch (emailErr) {
            emailsFailed++;
            console.error(`[BABY-RECALL] Email error for ${email}:`, emailErr);
          }
        }
      }
    }

    console.log(`[BABY-RECALL] Complete: ${babyRecalls.length} recalls, ${notifiedParents.size} parents, ${emailsSent} emails, ${pushSent} push`);

    return new Response(JSON.stringify({
      success: true,
      babyRecallsFound: babyRecalls.length,
      parentsNotified: notifiedParents.size,
      emailsSent,
      pushNotificationsSent: pushSent,
      emailsFailed,
      recalls: babyRecalls.map(r => ({
        id: r.id,
        product: r.product_description?.slice(0, 100),
        brand: r.brand_name,
        reason: r.reason_for_recall?.slice(0, 100),
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[BABY-RECALL] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
