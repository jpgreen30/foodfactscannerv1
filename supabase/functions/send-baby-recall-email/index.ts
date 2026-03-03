import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  backgroundColor: "#F7F4EF",
  darkBackground: "#2D4A4A",
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

interface BabyRecallEmailRequest {
  email: string;
  parentName: string;
  ageContext: string;
  recall: {
    productDescription: string;
    brandName: string | null;
    reason: string | null;
    classification: string | null;
    recallingFirm: string | null;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, parentName, ageContext, recall, severity }: BabyRecallEmailRequest = await req.json();

    if (!email || !recall) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and recall data are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[BABY-RECALL-EMAIL] Sending to ${email} for ${parentName}`);

    const severityColors = {
      critical: { bg: '#DC2626', text: '#FEE2E2', emoji: '🚨' },
      high: { bg: '#EA580C', text: '#FED7AA', emoji: '⚠️' },
      medium: { bg: '#CA8A04', text: '#FEF3C7', emoji: '⚡' },
      low: { bg: '#2563EB', text: '#DBEAFE', emoji: 'ℹ️' },
    };

    const colors = severityColors[severity] || severityColors.medium;
    const subjectEmoji = severity === 'critical' ? '🚨 URGENT: ' : '⚠️ ';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: ${BRAND.fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background: #f4f4f5; padding: 24px; text-align: center;">
              <img src="${BRAND.logoUrl}" alt="Food Fact Scanner" style="height: 48px;">
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.bg} 0%, ${BRAND.darkBackground} 100%); padding: 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">${colors.emoji}</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                Baby Food Safety Alert
              </h1>
              <p style="color: ${colors.text}; margin: 8px 0 0 0; font-size: 14px;">
                ${severity === 'critical' ? 'URGENT ACTION REQUIRED' : 'Important Information for Parents'}
              </p>
            </td>
          </tr>
          
          <!-- Personalized Greeting -->
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0;">
                Dear <strong>${parentName}</strong>${ageContext},
              </p>
              <p style="color: #6b7280; font-size: 15px; margin: 12px 0 0 0; line-height: 1.6;">
                We're alerting you about a recall that may affect products for your little one. Your baby's safety is our priority.
              </p>
            </td>
          </tr>
          
          <!-- Recall Details -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: ${colors.text}; border-left: 4px solid ${colors.bg}; border-radius: 8px; padding: 20px;">
                <h2 style="color: #1e1e2e; font-size: 18px; margin: 0 0 16px 0;">
                  ${recall.brandName || 'Product'} Recall
                </h2>
                
                <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">
                  <strong>Product:</strong><br>
                  ${recall.productDescription}
                </p>
                
                ${recall.reason ? `
                <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">
                  <strong>Reason:</strong><br>
                  ${recall.reason}
                </p>
                ` : ''}
                
                ${recall.recallingFirm ? `
                <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">
                  <strong>Company:</strong> ${recall.recallingFirm}
                </p>
                ` : ''}
                
                ${recall.classification ? `
                <p style="color: #374151; font-size: 14px; margin: 0;">
                  <strong>Classification:</strong> ${recall.classification}
                  ${recall.classification === 'Class I' ? ' (Most Serious)' : ''}
                </p>
                ` : ''}
              </div>
            </td>
          </tr>
          
          <!-- Action Steps -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h3 style="color: #1e1e2e; font-size: 16px; margin: 0 0 16px 0;">
                🛡️ Recommended Actions:
              </h3>
              <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Check your pantry</strong> for this product immediately</li>
                <li><strong>Stop using</strong> any matching products</li>
                <li><strong>Dispose of</strong> or return the product for a refund</li>
                <li><strong>Monitor your baby</strong> for any unusual symptoms</li>
                <li><strong>Contact your pediatrician</strong> if you have concerns</li>
              </ul>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" 
                 style="display: inline-block; background: linear-gradient(135deg, ${colors.bg} 0%, ${BRAND.darkBackground} 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                View Full FDA Recall Details
              </a>
            </td>
          </tr>
          
          <!-- Baby Safety Tips -->
          <tr>
            <td style="background-color: #ecfdf5; padding: 24px 32px;">
              <h3 style="color: ${BRAND.primaryDark}; font-size: 14px; margin: 0 0 12px 0;">
                👶 Baby Food Safety Tips:
              </h3>
              <ul style="color: ${BRAND.primaryColor}; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.7;">
                <li>Scan all baby foods with Food Fact Scanner before purchase</li>
                <li>Check for heavy metal testing certifications</li>
                <li>Vary your baby's diet to reduce exposure to any single contaminant</li>
                <li>Choose organic when possible for fruits and vegetables</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND.darkBackground}; padding: 24px 32px; text-align: center;">
              <img src="${BRAND.logoUrl}" alt="Food Fact Scanner" style="height: 32px; margin-bottom: 12px; opacity: 0.9;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this because you're a registered parent on Food Fact Scanner.<br>
                We monitor baby food recalls 24/7 to keep your little one safe.
              </p>
              <p style="color: #6b7280; font-size: 11px; margin: 16px 0 0 0;">
                Food Fact Scanner - Scan Smarter. Eat Safer.
              </p>
              <p style="color: #4b5563; font-size: 11px; margin: 8px 0 0 0;">
                <a href="https://foodfactscanner.com/privacy" style="color: ${BRAND.primaryColor};">Privacy</a> | 
                <a href="https://foodfactscanner.com/terms" style="color: ${BRAND.primaryColor};">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Food Fact Scanner Baby Alerts <onboarding@resend.dev>",
        to: [email],
        subject: `${subjectEmoji}Baby Food Recall: ${recall.brandName || 'Important Product'} - Action Required`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      let errorType = 'unknown';
      let errorMessage = emailData.message || "Failed to send email";
      
      if (emailData.message?.includes('domain') || emailData.message?.includes('verify')) {
        errorType = 'domain_not_verified';
      } else if (emailResponse.status === 429) {
        errorType = 'rate_limit';
      } else if (emailResponse.status === 401 || emailResponse.status === 403) {
        errorType = 'auth_error';
      }
      
      console.error(`[BABY-RECALL-EMAIL] Failed (${errorType}):`, errorMessage);
      return new Response(
        JSON.stringify({ success: false, error: errorMessage, errorType }),
        { status: emailResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[BABY-RECALL-EMAIL] Email sent successfully:", emailData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[BABY-RECALL-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});