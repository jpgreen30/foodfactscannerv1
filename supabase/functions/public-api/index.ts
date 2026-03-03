import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const logStep = (step: string, details?: any) => {
  console.log(`[PUBLIC-API] ${step}`, details ? JSON.stringify(details) : "");
};

// Simple hash function for API key verification
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API key from header
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key required. Include x-api-key header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Validating API key");

    // Hash the API key and look it up
    const keyHash = await hashApiKey(apiKey);
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("*, profiles!inner(subscription_tier)")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    if (keyError || !keyData) {
      logStep("Invalid API key");
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is Pro
    if (keyData.profiles?.subscription_tier !== "pro") {
      return new Response(
        JSON.stringify({ error: "API access requires Pro subscription" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyData.id);

    const userId = keyData.user_id;
    logStep("API key validated", { userId });

    // Parse URL and handle endpoints
    const url = new URL(req.url);
    const path = url.pathname.replace("/public-api", "");
    
    // GET /scan-history - Get user's scan history
    if (req.method === "GET" && (path === "/scan-history" || path === "")) {
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const { data: scans, error: scansError } = await supabase
        .from("scan_history")
        .select("id, product_name, brand, health_score, verdict, barcode, created_at, dietary_flags")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (scansError) throw scansError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: scans,
          pagination: { limit, offset, count: scans?.length || 0 }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /scan/:id - Get specific scan details
    if (req.method === "GET" && path.startsWith("/scan/")) {
      const scanId = path.replace("/scan/", "");
      
      const { data: scan, error: scanError } = await supabase
        .from("scan_history")
        .select("*")
        .eq("id", scanId)
        .eq("user_id", userId)
        .single();

      if (scanError || !scan) {
        return new Response(
          JSON.stringify({ error: "Scan not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: scan }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /health-reports - Get user's health reports
    if (req.method === "GET" && path === "/health-reports") {
      const { data: reports, error: reportsError } = await supabase
        .from("health_reports")
        .select("id, title, health_grade, report_date, total_scans, safe_products, caution_products, avoid_products, summary, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;

      return new Response(
        JSON.stringify({ success: true, data: reports }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /profile - Get user profile
    if (req.method === "GET" && path === "/profile") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, dietary_goals, is_vegan, is_gluten_free, is_dairy_free, is_pregnant, is_heart_healthy, is_diabetic, health_conditions, allergies_detailed")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      return new Response(
        JSON.stringify({ success: true, data: profile }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown endpoint
    return new Response(
      JSON.stringify({ 
        error: "Unknown endpoint",
        available_endpoints: [
          "GET /scan-history - List your scan history",
          "GET /scan/:id - Get specific scan details",
          "GET /health-reports - List your health reports",
          "GET /profile - Get your profile settings"
        ]
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("Error in public-api", { error: message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
