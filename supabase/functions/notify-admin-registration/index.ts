import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Brand colors and assets - Teal/Orange theme
const BRAND = {
  logoUrl: "https://food-wise-decode.lovable.app/pwa-192x192.png",
  primaryColor: "#3D8B8B",
  primaryDark: "#2D7070",
  accentColor: "#F5A623",
  backgroundColor: "#F7F4EF",
  darkBackground: "#2D4A4A",
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

interface RegistrationData {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  signup_source?: string;
  geo_location?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const data: RegistrationData = await req.json();
    console.log("[notify-admin-registration] Received registration data:", {
      email: data.email,
      ip: data.ip_address,
      source: data.signup_source
    });

    // Log to user_registrations table
    const { error: insertError } = await supabase
      .from("user_registrations")
      .insert({
        user_id: data.user_id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        referrer: data.referrer,
        signup_source: data.signup_source || "web_app",
        geo_location: data.geo_location,
        admin_notified: false,
      });

    if (insertError) {
      console.error("[notify-admin-registration] Insert error:", insertError);
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("[notify-admin-registration] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Resend not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Not provided";
    const registrationTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: ${BRAND.fontFamily}; background-color: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .logo-header { background: #f4f4f5; padding: 24px; text-align: center; }
    .logo-header img { height: 48px; }
    .header { background: linear-gradient(135deg, ${BRAND.primaryColor} 0%, ${BRAND.primaryDark} 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .info-label { font-weight: 600; color: #374151; width: 140px; flex-shrink: 0; }
    .info-value { color: #6b7280; flex: 1; }
    .highlight { background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${BRAND.primaryColor}; }
    .footer { background: ${BRAND.darkBackground}; padding: 20px; text-align: center; }
    .footer img { height: 32px; margin-bottom: 12px; opacity: 0.9; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
    .btn { display: inline-block; padding: 12px 24px; background: ${BRAND.primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-header">
      <img src="${BRAND.logoUrl}" alt="Food Fact Scanner">
    </div>
    <div class="header">
      <h1>🎉 New User Registration</h1>
    </div>
    <div class="content">
      <div class="highlight">
        <strong>A new user has just registered for Food Fact Scanner!</strong>
      </div>
      
      <div class="info-row">
        <span class="info-label">👤 Full Name:</span>
        <span class="info-value">${fullName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">📧 Email:</span>
        <span class="info-value">${data.email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">📱 Phone:</span>
        <span class="info-value">${data.phone_number || "Not provided"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🕐 Registered:</span>
        <span class="info-value">${registrationTime} EST</span>
      </div>
      <div class="info-row">
        <span class="info-label">🌐 IP Address:</span>
        <span class="info-value">${data.ip_address || "Unknown"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">📍 Location:</span>
        <span class="info-value">${data.geo_location ? `${data.geo_location.city || ""}, ${data.geo_location.region || ""}, ${data.geo_location.country || ""}`.replace(/^, |, $/g, "") || "Unknown" : "Unknown"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🖥️ Browser:</span>
        <span class="info-value">${data.user_agent ? data.user_agent.substring(0, 80) + "..." : "Unknown"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🔗 Referrer:</span>
        <span class="info-value">${data.referrer || "Direct visit"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">📲 Source:</span>
        <span class="info-value">${data.signup_source || "web_app"}</span>
      </div>
      
      <center>
        <a href="https://foodfactscanner.com/admin" class="btn">View in Admin Panel</a>
      </center>
    </div>
    <div class="footer">
      <img src="${BRAND.logoUrl}" alt="Food Fact Scanner">
      <p>Food Fact Scanner Admin Notification System</p>
    </div>
  </div>
</body>
</html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Food Fact Scanner Notifications <onboarding@resend.dev>",
        to: ["jpgreen1@gmail.com"],
        subject: `New User Registration - ${fullName} (${data.email})`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("[notify-admin-registration] Resend error:", errorText);
    } else {
      const result = await emailResponse.json();
      console.log("[notify-admin-registration] Admin notification email sent successfully, ID:", result.id);
      
      // Update admin_notified flag
      await supabase
        .from("user_registrations")
        .update({ admin_notified: true, admin_notified_at: new Date().toISOString() })
        .eq("user_id", data.user_id);
    }

    // Dispatch Zapier webhooks: user.created + trial.started
    try {
      const { data: zapierSettings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'zapier_webhook_url')
        .maybeSingle();

      if (zapierSettings?.value) {
        const basePayload = {
          user_id: data.user_id,
          plan: "free",
          timestamp: new Date().toISOString(),
        };

        const hubspotFields = {
          email: data.email,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          subscription_status: "free_trial",
          subscription_tier: "free",
          total_scans: 0,
          risk_history_average: 0,
          ltv: 0,
          trial_status: "active",
          lifecycle_stage: "Lead",
        };

        // user.created
        await fetch(zapierSettings.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'user.created',
            ...basePayload,
            ...hubspotFields,
            signup_source: data.signup_source || 'web_app',
          }),
        });

        // trial.started
        await fetch(zapierSettings.value, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'trial.started',
            ...basePayload,
            ...hubspotFields,
            lifecycle_stage: "Trial User",
            scan_limit: 10,
            scan_count: 0,
          }),
        });

        console.log('[notify-admin-registration] Zapier webhooks dispatched: user.created, trial.started');
      }
    } catch (e) {
      console.error('[notify-admin-registration] Zapier dispatch error:', e);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[notify-admin-registration] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});