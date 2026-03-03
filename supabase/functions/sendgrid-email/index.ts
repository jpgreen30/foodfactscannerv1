import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "welcome" | "forgot_password" | "password_reset_confirm" | "email_verification" | "account_deleted" | "weekly_report" | "recall_alert" | "custom";
  to: string;
  toName?: string;
  subject?: string;
  htmlContent?: string;
  templateData?: Record<string, string>;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

// Email templates
const getEmailTemplate = (type: string, data: Record<string, string> = {}) => {
  const appName = "Food Fact Scanner";
  const primaryColor = BRAND.primaryColor;
  const baseUrl = data.baseUrl || "https://foodfactscanner.com";

  const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    body { font-family: ${BRAND.fontFamily}; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: ${BRAND.backgroundColor}; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .logo-header { background: ${BRAND.backgroundColor}; padding: 24px; text-align: center; }
    .logo-header img { height: 48px; }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${BRAND.primaryDark} 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px 24px; }
    .content h2 { color: #1f2937; margin: 0 0 16px; font-size: 22px; }
    .content p { color: #4b5563; margin: 0 0 16px; }
    .button { display: inline-block; background: ${primaryColor}; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
    .button:hover { background: ${BRAND.primaryDark}; }
    .footer { background: ${BRAND.darkBackground}; padding: 24px; text-align: center; }
    .footer img { height: 32px; margin-bottom: 12px; opacity: 0.9; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
    .footer a { color: ${primaryColor}; text-decoration: none; }
    .footer-links { color: #4b5563; font-size: 11px; margin: 8px 0 0 0; }
    .warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .warning-box p { color: #92400e; margin: 0; }
    .info-box { background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .info-box p { color: #1e40af; margin: 0; }
    .code { background: #f3f4f6; padding: 16px 24px; border-radius: 8px; font-family: monospace; font-size: 24px; letter-spacing: 4px; text-align: center; margin: 16px 0; }
  `;

  const logoHeader = `
    <div class="logo-header">
      <img src="${BRAND.logoUrl}" alt="${appName}" style="height: 48px;">
    </div>
  `;

  const footer = `
    <div class="footer">
      <img src="${BRAND.logoUrl}" alt="${appName}" style="height: 32px; margin-bottom: 12px; opacity: 0.9;">
      <p>© ${new Date().getFullYear()} ${appName}. Scan Smarter. Eat Safer.</p>
      <p class="footer-links">
        <a href="${baseUrl}/privacy" style="color: ${primaryColor};">Privacy Policy</a> | 
        <a href="${baseUrl}/terms" style="color: ${primaryColor};">Terms of Service</a>
      </p>
    </div>
  `;

  const templates: Record<string, { subject: string; html: string }> = {
    welcome: {
      subject: `Welcome to ${appName} - Protect Your Family's Health! 🛡️`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header">
              <h1>🎉 Welcome to ${appName}!</h1>
              <p>Your journey to safer, healthier food choices starts now</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name || "there"}!</h2>
              <p>Thank you for joining ${appName}! We're thrilled to have you as part of our community dedicated to food safety and health.</p>
              
              <div class="info-box">
                <p><strong>Here's what you can do:</strong></p>
              </div>
              
              <p>✅ <strong>Scan Products</strong> - Instantly check ingredients for harmful chemicals</p>
              <p>✅ <strong>Get Personalized Alerts</strong> - Based on your health profile</p>
              <p>✅ <strong>Track Your Health</strong> - Monitor symptoms linked to food</p>
              <p>✅ <strong>Receive Recall Alerts</strong> - Stay informed about FDA recalls</p>
              
              <a href="${baseUrl}/scanner" class="button">Start Scanning Now →</a>
              
              <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
                Need help getting started? Reply to this email and our team will assist you.
              </p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
    forgot_password: {
      subject: `Reset Your ${appName} Password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>Secure your ${appName} account</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name || "there"},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <a href="${data.resetLink || baseUrl + '/auth?type=recovery'}" class="button">Reset My Password</a>
              
              <div class="warning-box">
                <p>⚠️ This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${data.resetLink || '#'}" style="word-break: break-all;">${data.resetLink || 'Link not available'}</a>
              </p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
    password_reset_confirm: {
      subject: `Your ${appName} Password Has Been Changed`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header">
              <h1>✅ Password Changed</h1>
              <p>Your account security has been updated</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name || "there"},</h2>
              <p>Your ${appName} password was successfully changed on ${new Date().toLocaleDateString()}.</p>
              
              <div class="warning-box">
                <p>⚠️ If you didn't make this change, please reset your password immediately and contact our support team.</p>
              </div>
              
              <a href="${baseUrl}/auth" class="button">Go to ${appName}</a>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
    email_verification: {
      subject: `Verify Your ${appName} Email Address`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header">
              <h1>📧 Verify Your Email</h1>
              <p>One more step to complete your registration</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name || "there"},</h2>
              <p>Please verify your email address by clicking the button below:</p>
              
              <a href="${data.verifyLink || baseUrl}" class="button">Verify My Email</a>
              
              ${data.verificationCode ? `
              <p style="text-align: center; margin-top: 24px;">Or enter this verification code:</p>
              <div class="code">${data.verificationCode}</div>
              ` : ''}
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                This verification link expires in 24 hours.
              </p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
    account_deleted: {
      subject: `Your ${appName} Account Has Been Deleted`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);">
              <h1>👋 Account Deleted</h1>
              <p>We're sorry to see you go</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name || "there"},</h2>
              <p>Your ${appName} account has been successfully deleted as requested.</p>
              
              <p>We've removed:</p>
              <p>• Your personal information</p>
              <p>• Scan history</p>
              <p>• Health profile data</p>
              <p>• All saved preferences</p>
              
              <div class="info-box">
                <p>💡 Changed your mind? You can always create a new account at ${appName}.</p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                Thank you for being part of our community. We wish you the best!
              </p>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
    weekly_report: {
      subject: `📊 Your Weekly ${appName} Health Report`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header">
              <h1>📊 Weekly Health Report</h1>
              <p>Your food safety summary for the week</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name || "there"},</h2>
              <p>Here's your weekly health summary:</p>
              
              <div class="info-box">
                <p><strong>This Week's Stats:</strong></p>
                <p>🔍 Products Scanned: ${data.scansCount || '0'}</p>
                <p>✅ Safe Products: ${data.safeProducts || '0'}</p>
                <p>⚠️ Warnings Found: ${data.warningsCount || '0'}</p>
                <p>🔥 Current Streak: ${data.streakDays || '0'} days</p>
              </div>
              
              ${data.topConcern ? `
              <div class="warning-box">
                <p><strong>Top Concern:</strong> ${data.topConcern}</p>
              </div>
              ` : ''}
              
              <a href="${baseUrl}/health-reports" class="button">View Full Report</a>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
    recall_alert: {
      subject: `🚨 URGENT: Food Recall Alert - ${data.productName || 'Important Product'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header" style="background: linear-gradient(135deg, ${BRAND.dangerColor} 0%, #7f1d1d 100%);">
              <h1>🚨 Recall Alert</h1>
              <p>Action required for your safety</p>
            </div>
            <div class="content">
              <h2>Important Safety Notice</h2>
              
              <div class="warning-box" style="background: #fef2f2; border-color: #fecaca;">
                <p style="color: #991b1b;"><strong>Product:</strong> ${data.productName || 'Unknown Product'}</p>
                <p style="color: #991b1b;"><strong>Brand:</strong> ${data.brand || 'Unknown Brand'}</p>
                <p style="color: #991b1b;"><strong>Reason:</strong> ${data.reason || 'See details'}</p>
              </div>
              
              <h3>Recommended Action:</h3>
              <p>${data.action || 'Stop using this product immediately and dispose of it safely.'}</p>
              
              <p>This product was found in your scan history. Please check your pantry and take appropriate action.</p>
              
              <a href="${baseUrl}/history" class="button" style="background: ${BRAND.dangerColor};">Check My Scan History</a>
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
    custom: {
      subject: data.subject || `Message from ${appName}`,
      html: data.htmlContent || `
        <!DOCTYPE html>
        <html>
        <head><style>${baseStyles}</style></head>
        <body>
          <div class="container">
            ${logoHeader}
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              ${data.message || '<p>No content provided.</p>'}
            </div>
            ${footer}
          </div>
        </body>
        </html>
      `,
    },
  };

  return templates[type] || templates.custom;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[Resend] Request received:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("[Resend] API key not configured");
      throw new Error("Resend API key not configured");
    }

    const { type, to, toName, subject, htmlContent, templateData = {} }: EmailRequest = await req.json();
    console.log("[Resend] Email request:", { type, to, toName });

    if (!to || !type) {
      throw new Error("Missing required fields: 'to' and 'type'");
    }

    // Get email template
    const template = getEmailTemplate(type, { name: toName || "", ...templateData });
    const finalSubject = subject || template.subject;
    const finalHtml = htmlContent || template.html;

    // Send via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Food Fact Scanner <onboarding@resend.dev>",
        to: [to],
        subject: finalSubject,
        html: finalHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Resend] API error:", response.status, errorText);
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("[Resend] Email sent successfully to:", to, "ID:", result.id);

    // Log email to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    try {
      await supabase.from("notification_history").insert({
        user_id: templateData.userId || null,
        notification_type: `email_${type}`,
        title: finalSubject,
        body: `Email sent to ${to}`,
        status: "sent",
        sent_at: new Date().toISOString(),
        data: { type, to, toName, resendId: result.id },
      });
    } catch (logError) {
      console.warn("[Resend] Failed to log email:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent successfully to ${to}`,
        type,
        id: result.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Resend] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);