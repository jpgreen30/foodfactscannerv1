import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[GENERATE-HEALTH-PDF] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    logStep("User authenticated", { userId: user.id });

    // Check if user is Pro
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_tier !== "pro") {
      return new Response(
        JSON.stringify({ error: "PDF export is a Pro feature" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reportId } = await req.json();
    if (!reportId) {
      throw new Error("Report ID is required");
    }

    logStep("Fetching report", { reportId });

    // Fetch the report
    const { data: report, error: reportError } = await supabase
      .from("health_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Generate a styled HTML that looks good when printed as PDF
    const pdfHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    @page { margin: 20mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3D8B8B;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      color: #3D8B8B;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      margin: 16px 0 8px;
    }
    .date {
      color: #666;
      font-size: 14px;
    }
    .grade-container {
      text-align: center;
      margin: 30px 0;
    }
    .grade {
      display: inline-block;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      font-size: 48px;
      font-weight: 900;
      line-height: 100px;
      color: white;
    }
    .grade-a { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .grade-b { background: linear-gradient(135deg, #84cc16, #65a30d); }
    .grade-c { background: linear-gradient(135deg, #eab308, #ca8a04); }
    .grade-d { background: linear-gradient(135deg, #f97316, #ea580c); }
    .grade-f { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
      padding: 20px;
      background: #f8f8f8;
      border-radius: 12px;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 900;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .safe { color: #22c55e; }
    .caution { color: #eab308; }
    .danger { color: #dc2626; }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #3D8B8B;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .summary {
      font-size: 16px;
      line-height: 1.8;
      color: #333;
    }
    .list {
      list-style: none;
      padding: 0;
    }
    .list li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .list li:last-child {
      border-bottom: none;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛡️ FoodFactScanner Health Report</div>
    <div class="title">${report.title}</div>
    <div class="date">Generated: ${new Date(report.created_at).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })}</div>
  </div>

  <div class="grade-container">
    <div class="grade grade-${(report.health_grade || 'C').toLowerCase()}">${report.health_grade || 'C'}</div>
    <p style="margin-top: 12px; font-size: 14px; color: #666;">Overall Health Grade</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value safe">${report.safe_products || 0}</div>
      <div class="stat-label">Safe Products</div>
    </div>
    <div class="stat">
      <div class="stat-value caution">${report.caution_products || 0}</div>
      <div class="stat-label">Use Caution</div>
    </div>
    <div class="stat">
      <div class="stat-value danger">${report.avoid_products || 0}</div>
      <div class="stat-label">Avoid</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Summary</div>
    <p class="summary">${report.summary || 'No summary available.'}</p>
  </div>

  ${report.top_concerns && Array.isArray(report.top_concerns) && report.top_concerns.length > 0 ? `
  <div class="section">
    <div class="section-title">Top Concerns</div>
    <ul class="list">
      ${(report.top_concerns as string[]).map((concern: string) => `<li>⚠️ ${concern}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${report.recommendations && Array.isArray(report.recommendations) && report.recommendations.length > 0 ? `
  <div class="section">
    <div class="section-title">Recommendations</div>
    <ul class="list">
      ${(report.recommendations as string[]).map((rec: string) => `<li>✓ ${rec}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${report.improvements && Array.isArray(report.improvements) && report.improvements.length > 0 ? `
  <div class="section">
    <div class="section-title">Areas for Improvement</div>
    <ul class="list">
      ${(report.improvements as string[]).map((imp: string) => `<li>→ ${imp}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="footer">
    <p>This report was generated by FoodFactScanner AI Health Analysis</p>
    <p>Report ID: ${report.id} | Total Scans Analyzed: ${report.total_scans || 0}</p>
    <p style="margin-top: 12px; font-style: italic;">
      This report is for informational purposes only and should not replace professional medical advice.
    </p>
  </div>
</body>
</html>
    `.trim();

    logStep("PDF HTML generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        html: pdfHtml,
        filename: `health-report-${report.report_date}.html`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("Error generating PDF", { error: message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
