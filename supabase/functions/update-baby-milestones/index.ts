import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");
const KLAVIYO_REVISION = "2024-10-15";
const KLAVIYO_BASE_URL = "https://a.klaviyo.com/api";

function computeLifecycleStage(ageMonths: number): string {
  if (ageMonths < 0) return "prenatal";
  if (ageMonths <= 3) return "newborn";
  if (ageMonths <= 12) return "infant";
  if (ageMonths <= 36) return "toddler";
  if (ageMonths <= 60) return "preschool";
  return "school_age";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[Milestones] Starting baby milestone update...");

    // Fetch all profiles with baby_dob set
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone_number, baby_dob, due_date, is_pregnant, baby_age_months, lifecycle_stage, trimester")
      .not("baby_dob", "is", null);

    if (error) {
      console.error("[Milestones] Error fetching profiles:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!profiles || profiles.length === 0) {
      console.log("[Milestones] No profiles with baby_dob found");
      return new Response(JSON.stringify({ success: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Milestones] Processing ${profiles.length} profiles...`);

    let updated = 0;
    let synced = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        const dob = new Date(profile.baby_dob);
        const now = new Date();
        const ageMonths = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        const newStage = computeLifecycleStage(ageMonths);
        
        // Only update if something changed
        const currentAge = profile.baby_age_months;
        const currentStage = profile.lifecycle_stage;
        
        if (currentAge !== ageMonths || currentStage !== newStage) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              baby_age_months: ageMonths >= 0 ? ageMonths : null,
              lifecycle_stage: newStage,
              // If baby was born (prenatal -> newborn transition), mark as no longer pregnant
              ...(profile.is_pregnant && ageMonths >= 0 ? { is_pregnant: false, is_new_mom: true } : {}),
            })
            .eq("id", profile.id);

          if (updateError) {
            errors.push(`${profile.id}: ${updateError.message}`);
            continue;
          }
          updated++;
        }

        // Sync to Klaviyo if API key is set
        if (KLAVIYO_API_KEY && profile.email) {
          // Ensure phone is E.164
          let phoneNumber = profile.phone_number || undefined;
          if (phoneNumber) {
            const digits = phoneNumber.replace(/\D/g, '');
            if (digits.length === 10) phoneNumber = `+1${digits}`;
            else if (digits.length === 11 && digits.startsWith('1')) phoneNumber = `+${digits}`;
            else if (!phoneNumber.startsWith('+')) phoneNumber = `+${digits}`;
          }

          const klaviyoPayload = {
            data: {
              type: "profile",
              attributes: {
                email: profile.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone_number: phoneNumber,
                properties: {
                  baby_age_months: ageMonths >= 0 ? ageMonths : null,
                  lifecycle_stage: newStage,
                  baby_dob: profile.baby_dob,
                  trimester: profile.trimester,
                },
              },
            },
          };

          const klaviyoResponse = await fetch(`${KLAVIYO_BASE_URL}/profiles/`, {
            method: "POST",
            headers: {
              "Authorization": `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
              "revision": KLAVIYO_REVISION,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(klaviyoPayload),
          });

          if (klaviyoResponse.status === 409) {
            // Profile exists, search and update
            const searchResp = await fetch(
              `${KLAVIYO_BASE_URL}/profiles/?filter=equals(email,"${encodeURIComponent(profile.email)}")`,
              {
                headers: {
                  "Authorization": `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                  "revision": KLAVIYO_REVISION,
                  "Accept": "application/json",
                },
              }
            );
            const searchData = await searchResp.json();
            const profileId = searchData?.data?.[0]?.id;
            if (profileId) {
              await fetch(`${KLAVIYO_BASE_URL}/profiles/${profileId}/`, {
                method: "PATCH",
                headers: {
                  "Authorization": `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
                  "revision": KLAVIYO_REVISION,
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                },
                body: JSON.stringify({
                  data: { ...klaviyoPayload.data, id: profileId },
                }),
              });
            }
          }
          synced++;
        }
      } catch (profileError) {
        const err = profileError as Error;
        errors.push(`${profile.id}: ${err.message}`);
      }
    }

    console.log(`[Milestones] Complete: ${updated} updated, ${synced} synced to Klaviyo, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: profiles.length, 
        updated, 
        synced,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("[Milestones] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
