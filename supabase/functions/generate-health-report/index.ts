import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanData {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  verdict: string | null;
  created_at: string;
  ingredients: any;
  dietary_flags: any;
}

interface ReportData {
  title: string;
  summary: string;
  healthGrade: string;
  totalScans: number;
  safeProducts: number;
  cautionProducts: number;
  avoidProducts: number;
  averageScore: number;
  topConcerns: string[];
  improvements: string[];
  recommendations: string[];
  scannedProducts: any[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sendEmail = true, daysBack = 7 } = await req.json().catch(() => ({}));

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get scan history for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const { data: scans, error: scansError } = await supabase
      .from("scan_history")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (scansError) {
      console.error("Error fetching scans:", scansError);
      throw new Error("Failed to fetch scan history");
    }

    const scanList = (scans || []) as ScanData[];

    // Calculate statistics
    const totalScans = scanList.length;
    const safeProducts = scanList.filter(s => s.verdict === "safe").length;
    const cautionProducts = scanList.filter(s => s.verdict === "caution").length;
    const avoidProducts = scanList.filter(s => s.verdict === "avoid").length;
    const scoresWithValue = scanList.filter(s => s.health_score !== null);
    const averageScore = scoresWithValue.length > 0 
      ? Math.round(scoresWithValue.reduce((sum, s) => sum + (s.health_score || 0), 0) / scoresWithValue.length)
      : 0;

    // Determine health grade
    let healthGrade = "A";
    if (averageScore >= 80) healthGrade = "A";
    else if (averageScore >= 70) healthGrade = "B";
    else if (averageScore >= 60) healthGrade = "C";
    else if (averageScore >= 50) healthGrade = "D";
    else healthGrade = "F";

    // Generate AI-powered analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userContext = profile ? `
User Profile:
- Health Conditions: ${JSON.stringify(profile.health_conditions || [])}
- Allergies: ${JSON.stringify(profile.allergies_detailed || [])}
- Diet Type: ${profile.diet_type || "Not specified"}
- Age Group: ${profile.age_group || "Not specified"}
` : "";

    const scanSummary = scanList.slice(0, 20).map(s => ({
      product: s.product_name,
      brand: s.brand,
      score: s.health_score,
      verdict: s.verdict
    }));

    const aiPrompt = `You are a health analyst. Generate a personalized weekly health report based on the user's food scanning history.

${userContext}

Scan Statistics (past ${daysBack} days):
- Total Scans: ${totalScans}
- Safe Products: ${safeProducts}
- Caution Products: ${cautionProducts}
- Avoid Products: ${avoidProducts}
- Average Health Score: ${averageScore}/100

Recent Scans: ${JSON.stringify(scanSummary)}

Generate a JSON response with:
1. summary: A 2-3 sentence personalized summary of their week (encouraging but honest)
2. topConcerns: Array of 3-5 specific health concerns based on their scans (e.g., "High sodium intake from processed foods")
3. improvements: Array of 2-3 positive changes or good choices they made
4. recommendations: Array of 3-5 actionable recommendations for next week

Respond ONLY with valid JSON in this exact format:
{
  "summary": "...",
  "topConcerns": ["...", "..."],
  "improvements": ["...", "..."],
  "recommendations": ["...", "..."]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a health analyst that generates personalized health reports. Always respond with valid JSON only." },
          { role: "user", content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("Failed to generate AI analysis");
    }

    const aiData = await aiResponse.json();
    let aiAnalysis: { summary: string; topConcerns: string[]; improvements: string[]; recommendations: string[] } = { 
      summary: "", 
      topConcerns: [] as string[], 
      improvements: [] as string[], 
      recommendations: [] as string[] 
    };
    
    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      aiAnalysis = {
        summary: `This week you scanned ${totalScans} products with an average health score of ${averageScore}. Keep making informed choices!`,
        topConcerns: avoidProducts > 0 ? [`${avoidProducts} products were flagged to avoid`] : [],
        improvements: safeProducts > 0 ? [`${safeProducts} safe product choices`] : [],
        recommendations: ["Continue scanning products before purchase", "Focus on whole foods when possible"]
      };
    }

    // Create report title
    const reportDate = new Date();
    const weekStart = new Date(startDate);
    const title = `Health Report: ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${reportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Generate HTML report
    const reportHtml = generateReportHtml({
      title,
      summary: aiAnalysis.summary,
      healthGrade,
      totalScans,
      safeProducts,
      cautionProducts,
      avoidProducts,
      averageScore,
      topConcerns: aiAnalysis.topConcerns,
      improvements: aiAnalysis.improvements,
      recommendations: aiAnalysis.recommendations,
      scannedProducts: scanList.slice(0, 10).map(s => ({
        name: s.product_name,
        brand: s.brand,
        score: s.health_score,
        verdict: s.verdict,
        date: s.created_at
      }))
    });

    // Save report to database
    const { data: report, error: insertError } = await supabase
      .from("health_reports")
      .insert({
        user_id: user.id,
        report_type: "weekly",
        title,
        summary: aiAnalysis.summary,
        health_grade: healthGrade,
        total_scans: totalScans,
        safe_products: safeProducts,
        caution_products: cautionProducts,
        avoid_products: avoidProducts,
        average_score: averageScore,
        top_concerns: aiAnalysis.topConcerns,
        improvements: aiAnalysis.improvements,
        recommendations: aiAnalysis.recommendations,
        scanned_products: scanList.slice(0, 20),
        report_html: reportHtml,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving report:", insertError);
      throw new Error("Failed to save report");
    }

    // Send email if requested
    let emailSent = false;
    if (sendEmail && profile?.email) {
      try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "SafeBite <reports@resend.dev>",
              to: [profile.email],
              subject: `📊 Your Weekly Health Report - Grade ${healthGrade}`,
              html: reportHtml,
            }),
          });

          if (emailResponse.ok) {
            emailSent = true;
            
            // Update report with email sent status
            await supabase
              .from("health_reports")
              .update({ email_sent: true, email_sent_at: new Date().toISOString() })
              .eq("id", report.id);
          } else {
            const errorText = await emailResponse.text();
            console.error("Email send failed:", errorText);
          }
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    console.log(`Generated health report for user ${user.id}, email sent: ${emailSent}`);

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: report.id,
        title,
        summary: aiAnalysis.summary,
        healthGrade,
        totalScans,
        safeProducts,
        cautionProducts,
        avoidProducts,
        averageScore,
        topConcerns: aiAnalysis.topConcerns,
        improvements: aiAnalysis.improvements,
        recommendations: aiAnalysis.recommendations,
        emailSent,
        createdAt: report.created_at
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to generate report" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateReportHtml(data: ReportData): string {
  const gradeColors: Record<string, string> = {
    A: "#22c55e",
    B: "#84cc16",
    C: "#eab308",
    D: "#f97316",
    F: "#ef4444"
  };
  
  const gradeColor = gradeColors[data.healthGrade] || "#6b7280";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${data.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; }
    .grade-circle { width: 100px; height: 100px; border-radius: 50%; background: white; color: ${gradeColor}; font-size: 48px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 20px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .content { padding: 32px; }
    .summary { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat { background: #f9fafb; padding: 16px; border-radius: 12px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #059669; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .section { margin-bottom: 24px; }
    .section h3 { color: #374151; margin: 0 0 12px; font-size: 16px; display: flex; align-items: center; gap: 8px; }
    .section ul { margin: 0; padding-left: 20px; }
    .section li { margin-bottom: 8px; color: #4b5563; }
    .concerns li { color: #dc2626; }
    .improvements li { color: #059669; }
    .product-list { list-style: none; padding: 0; }
    .product-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px; }
    .product-name { font-weight: 500; }
    .product-score { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .score-safe { background: #dcfce7; color: #166534; }
    .score-caution { background: #fef3c7; color: #92400e; }
    .score-avoid { background: #fee2e2; color: #991b1b; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
    .cta { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Health Report</h1>
      <p>${data.title}</p>
      <div class="grade-circle">${data.healthGrade}</div>
      <p>Your Health Grade</p>
    </div>
    
    <div class="content">
      <div class="summary">
        <strong>Summary:</strong> ${data.summary}
      </div>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.totalScans}</div>
          <div class="stat-label">Products Scanned</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.averageScore}</div>
          <div class="stat-label">Avg Health Score</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #22c55e">${data.safeProducts}</div>
          <div class="stat-label">Safe Products</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #ef4444">${data.avoidProducts}</div>
          <div class="stat-label">Avoid Products</div>
        </div>
      </div>
      
      ${data.topConcerns.length > 0 ? `
      <div class="section concerns">
        <h3>⚠️ Top Concerns</h3>
        <ul>
          ${data.topConcerns.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${data.improvements.length > 0 ? `
      <div class="section improvements">
        <h3>✅ What You Did Well</h3>
        <ul>
          ${data.improvements.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${data.recommendations.length > 0 ? `
      <div class="section">
        <h3>💡 Recommendations</h3>
        <ul>
          ${data.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${data.scannedProducts.length > 0 ? `
      <div class="section">
        <h3>📦 Recent Scans</h3>
        <ul class="product-list">
          ${data.scannedProducts.slice(0, 5).map(p => `
            <li class="product-item">
              <span class="product-name">${p.name}${p.brand ? ` - ${p.brand}` : ''}</span>
              <span class="product-score score-${p.verdict || 'safe'}">${p.score || '--'}/100</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>Keep scanning to make healthier choices! 🥗</p>
      <p style="font-size: 12px; color: #9ca3af;">SafeBite - Your Personal Food Safety Assistant</p>
    </div>
  </div>
</body>
</html>
  `;
}
