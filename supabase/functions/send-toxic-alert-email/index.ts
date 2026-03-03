import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
  dangerColor: "#dc2626",
  warningColor: "#f59e0b",
  backgroundColor: "#F7F4EF",
  darkBackground: "#2D4A4A",
  ctaBlue: "#3b82f6",
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

interface ToxicAlertRequest {
  userId: string;
  userEmail: string;
  userName?: string;
  productName: string;
  brand?: string;
  healthScore: number;
  toxicIngredients: {
    name: string;
    riskLevel: string;
    healthConcerns: string[];
    iarcClassification?: string;
  }[];
  scanId?: string;
  consultationLink?: string;
}

const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel.toLowerCase()) {
    case 'high':
    case 'danger':
      return BRAND.dangerColor;
    case 'moderate':
    case 'caution':
      return BRAND.warningColor;
    default:
      return '#6b7280';
  }
};

const buildEmailHtml = (data: ToxicAlertRequest): string => {
  const ingredientRows = data.toxicIngredients.map(ing => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; font-weight: 600; color: ${getRiskColor(ing.riskLevel)};">
        ⚠️ ${ing.name}
      </td>
      <td style="padding: 12px;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${getRiskColor(ing.riskLevel)}20; color: ${getRiskColor(ing.riskLevel)};">
          ${ing.riskLevel.toUpperCase()} RISK
        </span>
      </td>
      <td style="padding: 12px; font-size: 13px; color: #4b5563;">
        ${ing.healthConcerns?.join(', ') || 'Potential health concerns'}
        ${ing.iarcClassification ? `<br><strong>IARC:</strong> ${ing.iarcClassification}` : ''}
      </td>
    </tr>
  `).join('');

  const consultationUrl = data.consultationLink || `https://vzwbngmfqhurlcienera.lovableproject.com/scanner?consultation=true&scan=${data.scanId || ''}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: ${BRAND.fontFamily}; background-color: #0a0a0a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Logo Header -->
        <div style="background: #f4f4f5; border-radius: 16px 16px 0 0; padding: 24px; text-align: center;">
          <img src="${BRAND.logoUrl}" alt="Food Fact Scanner" style="height: 48px;">
        </div>
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${BRAND.dangerColor} 0%, #7f1d1d 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ TOXIC PRODUCT ALERT</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Dangerous ingredients detected in your scanned product
          </p>
        </div>
        
        <!-- Product Info -->
        <div style="background: #1a1a1a; padding: 25px; border-left: 1px solid #333; border-right: 1px solid #333;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 style="color: white; margin: 0; font-size: 22px;">${data.productName}</h2>
              ${data.brand ? `<p style="color: #9ca3af; margin: 5px 0 0 0;">${data.brand}</p>` : ''}
            </div>
            <div style="text-align: center; background: ${data.healthScore < 30 ? BRAND.dangerColor : data.healthScore < 50 ? BRAND.warningColor : BRAND.primaryColor}; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-weight: bold; font-size: 20px;">${data.healthScore}</span>
            </div>
          </div>
          
          <div style="background: ${BRAND.dangerColor}20; border: 1px solid ${BRAND.dangerColor}50; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <p style="color: #fca5a5; margin: 0; font-size: 14px;">
              <strong>🚨 Warning:</strong> This product contains ${data.toxicIngredients.length} ingredient(s) that may pose health risks. Review the details below.
            </p>
          </div>
        </div>
        
        <!-- Toxic Ingredients Table -->
        <div style="background: #1a1a1a; padding: 0 25px 25px 25px; border-left: 1px solid #333; border-right: 1px solid #333;">
          <h3 style="color: white; margin: 0 0 15px 0;">Ingredients of Concern:</h3>
          <table style="width: 100%; border-collapse: collapse; background: #0d0d0d; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #262626;">
                <th style="padding: 12px; text-align: left; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Ingredient</th>
                <th style="padding: 12px; text-align: left; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Risk Level</th>
                <th style="padding: 12px; text-align: left; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Health Concerns</th>
              </tr>
            </thead>
            <tbody style="color: #e5e7eb;">
              ${ingredientRows}
            </tbody>
          </table>
        </div>
        
        <!-- CTA Section -->
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); padding: 30px; border-left: 1px solid #333; border-right: 1px solid #333;">
          <h3 style="color: white; margin: 0 0 10px 0; font-size: 20px;">
            🏛️ Were You Harmed By This Product?
          </h3>
          <p style="color: #94a3b8; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;">
            If you've experienced adverse health effects from consuming this product, you may be entitled to compensation. Our partner law firms specialize in product liability cases and offer <strong>FREE consultations</strong>.
          </p>
          <a href="${consultationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND.ctaBlue} 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            📞 Get FREE Legal Consultation
          </a>
          <p style="color: #64748b; margin: 15px 0 0 0; font-size: 12px;">
            No fees unless you win. Confidential. Available 24/7.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background: ${BRAND.darkBackground}; padding: 24px; border-radius: 0 0 16px 16px; text-align: center; border: 1px solid #333; border-top: none;">
          <img src="${BRAND.logoUrl}" alt="Food Fact Scanner" style="height: 32px; margin-bottom: 12px; opacity: 0.9;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            This alert was sent by Food Fact Scanner because you scanned a product containing concerning ingredients.
            <br>
            You can manage your notification preferences in the app settings.
          </p>
          <p style="color: #6b7280; font-size: 11px; margin: 16px 0 0 0;">
            Food Fact Scanner - Scan Smarter. Eat Safer.
          </p>
          <p style="color: #4b5563; font-size: 11px; margin: 8px 0 0 0;">
            <a href="https://foodfactscanner.com/privacy" style="color: ${BRAND.primaryColor};">Privacy</a> | 
            <a href="https://foodfactscanner.com/terms" style="color: ${BRAND.primaryColor};">Terms</a>
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ToxicAlertRequest = await req.json();
    
    console.log(`Sending toxic alert email to ${data.userEmail} for product: ${data.productName}`);
    console.log(`Toxic ingredients count: ${data.toxicIngredients.length}`);

    if (!data.userEmail || !data.toxicIngredients || data.toxicIngredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userEmail and toxicIngredients" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailHtml = buildEmailHtml(data);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Food Fact Scanner Safety Alerts <onboarding@resend.dev>",
        to: [data.userEmail],
        subject: `⚠️ ALERT: Toxic Ingredients Found in ${data.productName}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    // Update the legal_leads table if user exists
    if (data.userId) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Enrich lead with toxic product exposure
      const { error: updateError } = await supabaseClient
        .from("legal_leads")
        .upsert({
          user_id: data.userId,
          phone_number: "", // Will be updated by onboarding
          email: data.userEmail,
          toxic_products_exposure: [
            {
              product_name: data.productName,
              brand: data.brand,
              health_score: data.healthScore,
              toxic_ingredients: data.toxicIngredients,
              scanned_at: new Date().toISOString(),
              scan_id: data.scanId,
            }
          ],
          lead_source: "toxic_scan_alert",
          lead_quality_score: Math.max(50, 100 - data.healthScore), // Lower health score = higher lead quality
        }, { onConflict: "user_id" });

      if (updateError) {
        console.error("Error updating legal_leads:", updateError);
      } else {
        console.log("Legal lead enriched with toxic exposure data");
      }
    }

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-toxic-alert-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});