import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email templates for different lead magnets
const leadMagnetTemplates: Record<string, { subject: string; body: string }> = {
  "15-toxic-ingredients": {
    subject: "Your Free Guide: 15 Toxic Ingredients to Avoid",
    body: `
<h1>Thanks for subscribing!</h1>

<p>Hi {{firstName}},</p>

<p>Your free guide <strong>"15 Toxic Ingredients Hiding in Baby Food Labels"</strong> is attached to this email.</p>

<h2>What's inside:</h2>
<ul>
  <li>The 15 most dangerous ingredients found in baby food</li>
  <li>Hidden names manufacturers use to disguise them</li>
  <li>Printable wallet card for grocery shopping</li>
  <li>Safe alternatives for each toxic ingredient</li>
</ul>

<h2>Why this matters:</h2>
<p>A 2021 Congressional report found that 94% of baby foods contain toxic heavy metals. Many of these ingredients have been linked to:</p>
<ul>
  <li>Developmental delays</li>
  <li>Lowered IQ</li>
  <li>Behavioral problems</li>
  <li>Long-term health issues</li>
</ul>

<p><strong>Take the next step:</strong> <a href="https://foodfactscanner.com/scanner">Scan your baby's food free →</a></p>

<p>Stay safe,<br>
The FoodFactScanner Team</p>

<hr>
<p style="font-size: 12px; color: #666;">
You're receiving this because you requested our free guide. <br>
<a href="https://foodfactscanner.com">FoodFactScanner</a> | Protecting babies, empowering parents.
</p>
    `,
  },
  "homemade-recipes": {
    subject: "Your Free Recipe Book: 50 Homemade Baby Food Recipes",
    body: `
<h1>Thanks for subscribing!</h1>

<p>Hi {{firstName}},</p>

<p>Your free recipe book <strong>"50 Homemade Baby Food Recipes"</strong> is attached to this email.</p>

<h2>What's inside:</h2>
<ul>
  <li>50 easy recipes for babies 4-12 months</li>
  <li>Stage-by-stage feeding guide</li>
  <li>Nutritional breakdown for each recipe</li>
  <li>Batch cooking tips to save time</li>
  <li>Storage guidelines</li>
</ul>

<h2>Save $400+ per year</h2>
<p>Homemade baby food costs 80% less than store-bought pouches. Plus, you eliminate the risk of heavy metals and toxic ingredients.</p>

<p><strong>Not ready to cook everything?</strong> Use our scanner to check store-bought options: <a href="https://foodfactscanner.com/scanner">Scan baby food free →</a></p>

<p>Happy cooking!<br>
The FoodFactScanner Team</p>

<hr>
<p style="font-size: 12px; color: #666;">
You're receiving this because you requested our free recipes. <br>
<a href="https://foodfactscanner.com">FoodFactScanner</a> | Protecting babies, empowering parents.
</p>
    `,
  },
  "baby-food-safety-report": {
    subject: "Your 2025 Baby Food Safety Report",
    body: `
<h1>Thanks for subscribing!</h1>

<p>Hi {{firstName}},</p>

<p>Your <strong>2025 Baby Food Safety Report</strong> is attached to this email.</p>

<h2>What's inside:</h2>
<ul>
  <li>Complete heavy metal test results for 500+ products</li>
  <li>Brand rankings (safest to avoid)</li>
  <li>Ingredient-by-ingredient safety analysis</li>
  <li>FDA recall tracking</li>
  <li>Shopping guide by age/stage</li>
</ul>

<h2>The bottom line:</h2>
<p>90% of baby foods contain toxic heavy metals. But with the right information, you can protect your baby.</p>

<p><strong>Real-time protection:</strong> <a href="https://foodfactscanner.com/scanner">Scan any product instantly →</a></p>

<p>Stay safe,<br>
The FoodFactScanner Team</p>

<hr>
<p style="font-size: 12px; color: #666;">
You're receiving this because you requested our safety report. <br>
<a href="https://foodfactscanner.com">FoodFactScanner</a> | Protecting babies, empowering parents.
</p>
    `,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, leadMagnet, downloadUrl, fileName } = await req.json();

    if (!email || !leadMagnet) {
      return new Response(
        JSON.stringify({ error: "Email and leadMagnet are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get SendGrid API key
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    
    if (!sendgridApiKey) {
      console.error("SENDGRID_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Get template
    const template = leadMagnetTemplates[leadMagnet] || leadMagnetTemplates["15-toxic-ingredients"];
    
    // Personalize template
    const personalizedBody = template.body.replace(/\{\{firstName\}\}/g, firstName || "Parent");

    // Prepare email payload
    const emailPayload: any = {
      personalizations: [
        {
          to: [{ email }],
          subject: template.subject,
        },
      ],
      from: {
        email: "noreply@foodfactscanner.com",
        name: "FoodFactScanner",
      },
      reply_to: {
        email: "support@foodfactscanner.com",
        name: "FoodFactScanner Support",
      },
      content: [
        {
          type: "text/html",
          value: personalizedBody,
        },
      ],
    };

    // Add attachment if file URL is provided (optional)
    // In production, you'd host PDFs on a CDN and either:
    // 1. Attach them directly (if small enough)
    // 2. Include a download link in the email

    // Send via SendGrid
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SendGrid error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`[LEAD-MAGNET] Email sent to ${email} for ${leadMagnet}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[LEAD-MAGNET] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
