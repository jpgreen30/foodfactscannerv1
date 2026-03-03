import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supported event types for Zapier/Make.com integration
type ZapierEventType = 
  | "user_signup"
  | "product_scan"
  | "subscription_change"
  | "phone_number_submitted"
  | "recall_alert"
  | "health_score_alert"
  | "daily_digest"
  | "push_notification_sent"
  | "push_notification_opened"
  | "device_registered"
  | "legal_lead_submitted"
  | "community_post_created"
  | "community_post_liked"
  | "community_post_commented"
  | "family_profile_created"
  | "symptom_recorded"
  | "health_report_generated"
  | "custom";

interface WebhookPayload {
  event: ZapierEventType;
  data: Record<string, unknown>;
  metadata?: {
    source?: string;
    timestamp?: string;
    userId?: string;
  };
}

// Sanitize user data to protect privacy
function sanitizeUserData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ["password", "token", "secret", "api_key", "credit_card"];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      continue;
    }
    
    // Hash email for privacy (keep domain for segmentation)
    if (key === "email" && typeof value === "string") {
      const parts = value.split("@");
      if (parts.length === 2) {
        sanitized[key] = `***@${parts[1]}`;
        sanitized["email_domain"] = parts[1];
      }
      continue;
    }
    
    // Mask phone number (keep last 4 digits)
    if (key === "phone_number" && typeof value === "string") {
      sanitized[key] = value.replace(/\d(?=\d{4})/g, "*");
      continue;
    }
    
    sanitized[key] = value;
  }
  
  return sanitized;
}

// Format payload based on event type for better Zapier/Make.com compatibility
function formatPayloadForZapier(event: ZapierEventType, data: Record<string, unknown>): Record<string, unknown> {
  const basePayload = {
    event_type: event,
    timestamp: new Date().toISOString(),
    source: "food_scanner_app",
  };

  switch (event) {
    case "user_signup":
      return {
        ...basePayload,
        user: {
          id: data.user_id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          created_at: data.created_at,
        },
        marketing: {
          source: data.signup_source || "organic",
          campaign: data.campaign || null,
        },
      };

    case "product_scan":
      return {
        ...basePayload,
        scan: {
          id: data.scan_id,
          product_name: data.product_name,
          brand: data.brand,
          barcode: data.barcode,
          health_score: data.health_score,
          verdict: data.verdict,
        },
        user: {
          id: data.user_id,
          subscription_tier: data.subscription_tier,
        },
        flags: {
          dietary_flags: data.dietary_flags,
          has_allergens: data.has_allergens,
          recall_status: data.recall_status,
        },
      };

    case "subscription_change":
      return {
        ...basePayload,
        subscription: {
          user_id: data.user_id,
          previous_tier: data.previous_tier,
          new_tier: data.new_tier,
          change_type: data.change_type,
          effective_date: data.effective_date,
        },
        revenue: {
          mrr_change: data.mrr_change,
          currency: data.currency || "USD",
        },
      };

    case "phone_number_submitted":
      return {
        ...basePayload,
        contact: {
          user_id: data.user_id,
          phone_number: data.phone_number,
          wants_recall_sms: data.wants_recall_sms,
          phone_verified: data.phone_verified,
        },
        preferences: {
          notification_types: data.notification_types,
        },
      };

    case "recall_alert":
      return {
        ...basePayload,
        alert: {
          product_name: data.product_name,
          brand: data.brand,
          reason: data.reason,
          action: data.action,
          severity: data.severity,
        },
        affected_users: data.affected_user_count,
        notifications: {
          push_sent: data.push_sent,
          sms_sent: data.sms_sent,
        },
      };

    case "health_score_alert":
      return {
        ...basePayload,
        alert: {
          user_id: data.user_id,
          product_name: data.product_name,
          health_score: data.health_score,
          alert_threshold: data.alert_threshold,
          ingredients_of_concern: data.ingredients_of_concern,
        },
      };

    case "daily_digest":
      return {
        ...basePayload,
        digest: {
          date: data.date,
          total_signups: data.total_signups,
          total_scans: data.total_scans,
          new_subscribers: data.new_subscribers,
          active_users: data.active_users,
        },
        trends: {
          most_scanned_products: data.most_scanned_products,
          average_health_score: data.average_health_score,
        },
      };

    case "push_notification_sent":
      return {
        ...basePayload,
        notification: {
          type: data.type,
          title: data.title,
          body: data.body,
          target_audience: data.target_audience,
        },
        stats: {
          users_targeted: data.users_targeted,
          success_count: data.success_count,
          fail_count: data.fail_count,
        },
      };

    case "push_notification_opened":
      return {
        ...basePayload,
        notification: {
          id: data.notification_id,
          type: data.notification_type,
          title: data.title,
        },
        engagement: {
          user_id: data.user_id,
          opened_at: data.opened_at,
          time_to_open_seconds: data.time_to_open_seconds,
        },
      };

    case "device_registered":
      return {
        ...basePayload,
        device: {
          id: data.device_id,
          platform: data.platform,
          device_name: data.device_name,
          registered_at: data.registered_at,
        },
        user: {
          id: data.user_id,
        },
      };

    case "legal_lead_submitted":
      return {
        ...basePayload,
        lead: {
          id: data.lead_id,
          user_id: data.user_id,
          email: data.email,
          phone_number: data.phone_number,
          first_name: data.first_name,
          last_name: data.last_name,
          lead_source: data.lead_source,
          lead_quality_score: data.lead_quality_score,
          lead_category: data.lead_category,
          lead_status: data.lead_status,
          injury_description: data.injury_description,
        },
        health_context: {
          symptoms: data.symptoms,
          symptom_severity: data.symptom_severity,
          symptom_duration: data.symptom_duration,
          health_conditions: data.health_conditions,
          allergies: data.allergies,
          family_affected: data.family_affected,
        },
        products: {
          toxic_products_exposure: data.toxic_products_exposure,
          recalled_products_exposure: data.recalled_products_exposure,
          products_scanned: data.products_scanned,
          baby_food_concerns: data.baby_food_concerns,
          feeding_method: data.feeding_method,
        },
        consent: {
          consent_given: data.consent_given,
          consent_timestamp: data.consent_timestamp,
          consultation_requested: data.consultation_requested,
          consultation_requested_at: data.consultation_requested_at,
        },
      };

    case "community_post_created":
      return {
        ...basePayload,
        post: {
          id: data.post_id,
          user_id: data.user_id,
          title: data.title,
          content: data.content,
          post_type: data.post_type,
          created_at: data.created_at,
        },
        product_context: {
          product_name: data.product_name,
          product_barcode: data.product_barcode,
          health_score: data.health_score,
          verdict: data.verdict,
        },
      };

    case "community_post_liked":
      return {
        ...basePayload,
        like: {
          post_id: data.post_id,
          post_title: data.post_title,
          post_author_id: data.post_author_id,
          liker_user_id: data.liker_user_id,
          like_count: data.like_count,
        },
      };

    case "community_post_commented":
      return {
        ...basePayload,
        comment: {
          id: data.comment_id,
          post_id: data.post_id,
          post_title: data.post_title,
          post_author_id: data.post_author_id,
          commenter_user_id: data.commenter_user_id,
          content: data.comment_content,
          parent_comment_id: data.parent_comment_id,
          comment_count: data.comment_count,
          created_at: data.created_at,
        },
      };

    case "family_profile_created":
      return {
        ...basePayload,
        profile: {
          id: data.profile_id,
          user_id: data.user_id,
          name: data.name,
          relationship: data.relationship,
          age_group: data.age_group,
          is_default: data.is_default,
          created_at: data.created_at,
        },
        dietary_preferences: {
          is_vegan: data.is_vegan,
          is_gluten_free: data.is_gluten_free,
          is_dairy_free: data.is_dairy_free,
          is_diabetic: data.is_diabetic,
          is_pregnant: data.is_pregnant,
          is_heart_healthy: data.is_heart_healthy,
        },
        allergies: {
          allergies_detailed: data.allergies_detailed,
          allergy_notes: data.allergy_notes,
        },
      };

    case "symptom_recorded":
      return {
        ...basePayload,
        symptom_journal: {
          user_id: data.user_id,
          symptoms: data.symptoms,
          symptom_count: data.symptom_count,
          overall_severity: data.overall_severity,
          longest_duration: data.longest_duration,
          family_affected: data.family_affected,
          created_at: data.created_at,
        },
        linked_products: data.linked_products,
      };

    case "health_report_generated":
      return {
        ...basePayload,
        report: {
          id: data.report_id,
          user_id: data.user_id,
          report_type: data.report_type,
          report_date: data.report_date,
          title: data.title,
          health_grade: data.health_grade,
        },
        metrics: {
          average_score: data.average_score,
          total_scans: data.total_scans,
          safe_products: data.safe_products,
          caution_products: data.caution_products,
          avoid_products: data.avoid_products,
        },
        insights: {
          top_concerns: data.top_concerns,
          recommendations: data.recommendations,
        },
      };

    default:
      return {
        ...basePayload,
        ...data,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const payload = await req.json() as WebhookPayload;
    const { event, data, metadata } = payload;
    
    console.log(`[AUTOMATION-WEBHOOK] Processing event: ${event}`);
    console.log(`[AUTOMATION-WEBHOOK] Metadata:`, metadata);

    // Get webhook configuration from app_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "zapier_webhook_url",
        "zapier_enabled_events",
        "zapier_privacy_mode",
      ]);

    if (settingsError) {
      console.error("[AUTOMATION-WEBHOOK] Error fetching settings:", settingsError);
      return new Response(JSON.stringify({ error: "Could not fetch webhook settings" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const settingsMap = Object.fromEntries(
      settings?.map(s => [s.key, s.value]) || []
    );

    const webhookUrl = settingsMap["zapier_webhook_url"];
    const enabledEvents = settingsMap["zapier_enabled_events"] 
      ? JSON.parse(settingsMap["zapier_enabled_events"]) 
      : ["user_signup"]; // Default to user_signup only
    const privacyMode = settingsMap["zapier_privacy_mode"] === "true";

    if (!webhookUrl) {
      console.log("[AUTOMATION-WEBHOOK] No webhook URL configured, skipping");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "No webhook URL configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if this event type is enabled
    if (!enabledEvents.includes(event) && event !== "custom") {
      console.log(`[AUTOMATION-WEBHOOK] Event ${event} is not enabled, skipping`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Event type '${event}' is not enabled` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Sanitize data if privacy mode is enabled
    const processedData = privacyMode ? sanitizeUserData(data) : data;
    
    // Format payload for Zapier/Make.com
    const zapierPayload = formatPayloadForZapier(event, processedData);

    console.log("[AUTOMATION-WEBHOOK] Sending to webhook...");
    console.log("[AUTOMATION-WEBHOOK] Payload:", JSON.stringify(zapierPayload, null, 2));

    // Send to Zapier/Make.com webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zapierPayload),
    });

    console.log(`[AUTOMATION-WEBHOOK] Response status: ${response.status}`);

    // Log the webhook call for auditing
    await supabaseClient
      .from("app_settings")
      .upsert({
        key: "zapier_last_webhook_call",
        value: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          status: response.status,
          success: response.ok,
        }),
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Webhook triggered successfully",
      event,
      status: response.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[AUTOMATION-WEBHOOK] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
