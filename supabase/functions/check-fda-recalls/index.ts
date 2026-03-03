import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting helper to avoid hitting Resend's 2 req/sec limit
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface FDARecallResult {
  recall_number: string;
  product_description: string;
  recalling_firm: string;
  classification: string;
  reason_for_recall: string;
  status: string;
  distribution_pattern: string;
  recall_initiation_date: string;
  report_date: string;
  product_type: string;
  code_info: string;
}

interface FDAResponse {
  meta: {
    results: {
      total: number;
    };
  };
  results: FDARecallResult[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting FDA recall check...');

    // Fetch recent food recalls from FDA API (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '');

    const fdaUrl = `https://api.fda.gov/food/enforcement.json?search=report_date:[${dateStr}+TO+*]&limit=100`;
    
    console.log('Fetching from FDA API:', fdaUrl);
    
    const fdaResponse = await fetch(fdaUrl);
    
    if (!fdaResponse.ok) {
      // FDA API returns 404 when no results found
      if (fdaResponse.status === 404) {
        console.log('No recent recalls found from FDA API');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'No recent recalls found',
          newRecalls: 0,
          matchedUsers: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`FDA API error: ${fdaResponse.status}`);
    }

    const fdaData: FDAResponse = await fdaResponse.json();
    console.log(`Found ${fdaData.results?.length || 0} recalls from FDA`);

    let newRecallsCount = 0;
    let matchedUsersCount = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    const emailErrors: string[] = [];

    for (const recall of fdaData.results || []) {
      // Check if recall already exists
      const { data: existingRecall } = await supabase
        .from('food_recalls')
        .select('id')
        .eq('fda_recall_id', recall.recall_number)
        .single();

      if (existingRecall) {
        console.log(`Recall ${recall.recall_number} already exists, skipping`);
        continue;
      }

      // Extract brand name from recalling firm or product description
      const brandName = recall.recalling_firm || 
        recall.product_description.split(' ').slice(0, 2).join(' ');

      // Insert new recall
      const { data: newRecall, error: insertError } = await supabase
        .from('food_recalls')
        .insert({
          fda_recall_id: recall.recall_number,
          product_description: recall.product_description,
          brand_name: brandName,
          recalling_firm: recall.recalling_firm,
          classification: recall.classification,
          reason_for_recall: recall.reason_for_recall,
          status: recall.status,
          distribution_pattern: recall.distribution_pattern,
          recall_initiation_date: recall.recall_initiation_date,
          report_date: recall.report_date,
          product_type: recall.product_type,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting recall:', insertError);
        continue;
      }

      newRecallsCount++;
      console.log(`Inserted new recall: ${recall.recall_number}`);

      // Find users who may have scanned this product
      // Match by brand name or product keywords
      const searchTerms = [
        brandName.toLowerCase(),
        ...recall.product_description.toLowerCase().split(' ').filter((w: string) => w.length > 3)
      ].slice(0, 5);

      const { data: matchedScans } = await supabase
        .from('scan_history')
        .select('user_id, id, product_name, brand')
        .or(searchTerms.map((term: string) => `product_name.ilike.%${term}%,brand.ilike.%${term}%`).join(','));

      if (matchedScans && matchedScans.length > 0) {
        // Get unique user IDs
        const uniqueUserIds = [...new Set(matchedScans.map(s => s.user_id))];
        
        for (const userId of uniqueUserIds) {
          // Check if user has email alerts enabled
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('email_recall_alerts, user_email')
            .eq('user_id', userId)
            .single();

          if (prefs?.email_recall_alerts && prefs?.user_email) {
            // Record the match
            const userScans = matchedScans.filter(s => s.user_id === userId);
            
            const { data: matchRecord } = await supabase
              .from('user_recall_matches')
              .insert({
                user_id: userId,
                recall_id: newRecall.id,
                scan_id: userScans[0]?.id,
                notification_type: 'email',
              })
              .select()
              .single();

            // Add delay before sending email to avoid rate limiting (600ms = under 2/sec)
            await delay(600);

            // Trigger email notification
            const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-recall-email', {
              body: {
                userId,
                email: prefs.user_email,
                recall: {
                  productDescription: recall.product_description,
                  brandName,
                  reason: recall.reason_for_recall,
                  classification: recall.classification,
                  recallingFirm: recall.recalling_firm,
                },
                matchedProducts: userScans.map(s => s.product_name),
              },
            });

            if (emailError || !emailResult?.success) {
              emailsFailed++;
              const errorMsg = emailError?.message || emailResult?.error || 'Unknown email error';
              emailErrors.push(`${prefs.user_email}: ${errorMsg}`);
              console.error(`Failed to send email to ${prefs.user_email}:`, errorMsg);
            } else {
              emailsSent++;
              // Update notified_at only on successful email
              if (matchRecord?.id) {
                await supabase
                  .from('user_recall_matches')
                  .update({ notified_at: new Date().toISOString() })
                  .eq('id', matchRecord.id);
              }
              console.log(`Successfully sent recall email to ${prefs.user_email}`);
            }

            matchedUsersCount++;
          }
        }
      }
    }

    console.log(`Completed: ${newRecallsCount} new recalls, ${matchedUsersCount} users matched, ${emailsSent} emails sent, ${emailsFailed} emails failed`);

    return new Response(JSON.stringify({
      success: true,
      newRecalls: newRecallsCount,
      matchedUsers: matchedUsersCount,
      emailsSent,
      emailsFailed,
      emailErrors: emailErrors.slice(0, 5), // Limit to first 5 errors
      totalChecked: fdaData.results?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-fda-recalls:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
