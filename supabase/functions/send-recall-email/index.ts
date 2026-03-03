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

interface RecallEmailRequest {
  userId: string;
  email: string;
  recall: {
    productDescription: string;
    brandName: string;
    reason: string;
    classification: string;
    recallingFirm: string;
  };
  matchedProducts: string[];
}

serve(async (req): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, recall, matchedProducts }: RecallEmailRequest = await req.json();

    console.log(`Sending recall email to ${email} for user ${userId}`);

    // Determine severity color based on classification
    const getSeverityInfo = (classification: string) => {
      if (classification === 'Class I') {
        return { color: '#DC2626', label: 'HIGH RISK', description: 'May cause serious health problems or death' };
      } else if (classification === 'Class II') {
        return { color: '#F59E0B', label: 'MODERATE RISK', description: 'May cause temporary health problems' };
      }
      return { color: '#3B82F6', label: 'LOW RISK', description: 'Unlikely to cause health problems' };
    };

    const severity = getSeverityInfo(recall.classification);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: ${BRAND.fontFamily}; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Logo Header -->
              <div style="background: #f4f4f5; padding: 24px; text-align: center;">
                <img src="${BRAND.logoUrl}" alt="Food Fact Scanner" style="height: 48px;">
              </div>

              <!-- Header -->
              <div style="background-color: ${severity.color}; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ FDA FOOD RECALL ALERT</h1>
                <p style="color: white; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${severity.label} - ${severity.description}</p>
              </div>

              <!-- Content -->
              <div style="padding: 24px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  A product you may have purchased has been recalled by the FDA. Please check your pantry immediately.
                </p>

                <!-- Recalled Product Info -->
                <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <h2 style="color: #991B1B; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase;">Recalled Product</h2>
                  <p style="color: #7F1D1D; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${recall.productDescription}</p>
                  <p style="color: #991B1B; font-size: 14px; margin: 0;"><strong>Brand:</strong> ${recall.brandName}</p>
                  <p style="color: #991B1B; font-size: 14px; margin: 4px 0 0 0;"><strong>Company:</strong> ${recall.recallingFirm}</p>
                </div>

                <!-- Reason -->
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #374151; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase;">Reason for Recall</h3>
                  <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0;">${recall.reason}</p>
                </div>

                <!-- Your Scanned Products -->
                ${matchedProducts.length > 0 ? `
                <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <h3 style="color: #92400E; font-size: 14px; margin: 0 0 8px 0;">📱 Products You've Scanned That May Match:</h3>
                  <ul style="color: #92400E; font-size: 14px; margin: 0; padding-left: 20px;">
                    ${matchedProducts.map(p => `<li style="margin-bottom: 4px;">${p}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}

                <!-- What To Do -->
                <div style="background-color: #F3F4F6; border-radius: 8px; padding: 16px;">
                  <h3 style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">What You Should Do:</h3>
                  <ol style="color: #6B7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Check your pantry, refrigerator, and freezer for this product</li>
                    <li>Do NOT consume the recalled product</li>
                    <li>Return it to the store for a refund or dispose of it safely</li>
                    <li>If you've consumed this product and feel ill, contact your doctor</li>
                  </ol>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: ${BRAND.darkBackground}; padding: 24px; text-align: center;">
                <img src="${BRAND.logoUrl}" alt="Food Fact Scanner" style="height: 32px; margin-bottom: 12px; opacity: 0.9;">
                <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                  This alert was sent because you enabled FDA recall notifications in Food Fact Scanner.
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
          </div>
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
        from: "Food Fact Scanner Alerts <onboarding@resend.dev>",
        to: [email],
        subject: `⚠️ FDA Recall Alert: ${recall.brandName} - ${severity.label}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      // Categorize errors for better handling
      let errorType = 'unknown';
      let errorMessage = emailData.message || "Failed to send email";
      
      if (emailData.message?.includes('domain') || emailData.message?.includes('verify')) {
        errorType = 'domain_not_verified';
        errorMessage = 'Email domain not verified in Resend. Please verify your domain at resend.com/domains';
      } else if (emailResponse.status === 429 || emailData.message?.includes('rate')) {
        errorType = 'rate_limit';
        errorMessage = 'Rate limit exceeded. Will retry later.';
      } else if (emailResponse.status === 401 || emailResponse.status === 403) {
        errorType = 'auth_error';
        errorMessage = 'Resend API key is invalid or missing';
      }
      
      console.error(`Email send failed (${errorType}):`, errorMessage);
      return new Response(
        JSON.stringify({ success: false, error: errorMessage, errorType }),
        {
          status: emailResponse.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Recall email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-recall-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, errorType: 'exception' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});