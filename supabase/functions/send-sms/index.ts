import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  to: string;
  message: string;
  user_id?: string;
  notification_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, user_id, notification_type } = await req.json() as SMSRequest;
    
    console.log("[send-sms] Sending SMS to:", to);

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !fromNumber) {
      console.error("[send-sms] Twilio credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Twilio not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Format phone number if needed
    let formattedTo = to.replace(/\D/g, "");
    if (formattedTo.length === 10) {
      formattedTo = `+1${formattedTo}`;
    } else if (!formattedTo.startsWith("+")) {
      formattedTo = `+${formattedTo}`;
    }

    // Send SMS via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const formData = new URLSearchParams();
    formData.append("To", formattedTo);
    formData.append("From", fromNumber);
    formData.append("Body", message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[send-sms] Twilio error:", result);
      
      // Log failed SMS to notification_history if user_id provided
      if (user_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        
        await supabase.from("notification_history").insert({
          user_id,
          notification_type: notification_type || "sms",
          title: "SMS Notification",
          body: message,
          status: "failed",
          error_message: result.message || "Failed to send SMS",
        });
      }

      return new Response(
        JSON.stringify({ success: false, error: result.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("[send-sms] SMS sent successfully. SID:", result.sid);

    // Log successful SMS to notification_history if user_id provided
    if (user_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabase.from("notification_history").insert({
        user_id,
        notification_type: notification_type || "sms",
        title: "SMS Notification",
        body: message,
        status: "sent",
        sent_at: new Date().toISOString(),
        data: { twilio_sid: result.sid, to: formattedTo },
      });
    }

    return new Response(
      JSON.stringify({ success: true, sid: result.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-sms] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
