import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Lead {
  id: string;
  user_id?: string;
  phone_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  consent_given: boolean;
  health_conditions?: any;
  allergies?: any;
  toxic_products_exposure?: any;
  injury_description?: string;
  lead_quality_score?: number;
  products_scanned?: any;
  symptoms?: any;
  symptom_severity?: string;
  symptom_duration?: string;
  family_affected?: any;
  created_at: string;
}

interface DistributeLeadRequest {
  leadId: string;
  endpointIds?: string[];
  forceDistribute?: boolean;
}

const buildLeadPayload = (lead: Lead) => {
  return {
    lead_id: lead.id,
    contact: {
      first_name: lead.first_name || "",
      last_name: lead.last_name || "",
      phone: lead.phone_number,
      email: lead.email || "",
    },
    consent: {
      given: lead.consent_given,
      timestamp: lead.created_at,
    },
    health_profile: {
      conditions: lead.health_conditions || [],
      allergies: lead.allergies || [],
    },
    symptoms: {
      items: lead.symptoms || [],
      overall_severity: lead.symptom_severity || null,
      duration: lead.symptom_duration || null,
      family_affected: lead.family_affected || [],
    },
    exposure: {
      toxic_products: lead.toxic_products_exposure || [],
      products_scanned: lead.products_scanned || [],
      injury_description: lead.injury_description || "",
    },
    quality: {
      score: lead.lead_quality_score || 0,
      source: "food_safety_app",
      has_documented_symptoms: (lead.symptoms || []).length > 0,
      children_affected: (lead.family_affected || []).some((f: any) => 
        f.member?.includes("child") || f.member?.includes("teenager")
      ),
    },
    timestamp: new Date().toISOString(),
  };
};

const buildEmailHtml = (lead: Lead): string => {
  const toxicProducts = lead.toxic_products_exposure || [];
  const productsList = toxicProducts.map((p: any) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px; font-weight: 600;">${p.product_name || 'Unknown Product'}</td>
      <td style="padding: 10px;">${p.brand || 'N/A'}</td>
      <td style="padding: 10px; text-align: center;">
        <span style="background: ${p.health_score < 30 ? '#dc2626' : p.health_score < 50 ? '#f59e0b' : '#22c55e'}; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
          ${p.health_score || 'N/A'}
        </span>
      </td>
      <td style="padding: 10px; font-size: 13px;">${(p.toxic_ingredients || []).map((i: any) => i.name).join(', ') || 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 20px; background: #f3f4f6;">
      <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 25px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">🔥 New Qualified Lead</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">From Food Safety Scanner App</p>
        </div>
        
        <!-- Lead Quality Badge -->
        <div style="padding: 20px; background: #fef3c7; border-bottom: 1px solid #fcd34d;">
          <span style="background: #f59e0b; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
            Lead Quality Score: ${lead.lead_quality_score || 0}/100
          </span>
        </div>
        
        <!-- Contact Info -->
        <div style="padding: 25px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">📞 Contact Information</h2>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 120px;">Name:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${lead.first_name || ''} ${lead.last_name || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Phone:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${lead.phone_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #1f2937;">${lead.email || 'Not provided'}</td>
            </tr>
          </table>
        </div>
        
        <!-- Injury Description -->
        ${lead.injury_description ? `
        <div style="padding: 25px; border-bottom: 1px solid #e5e7eb; background: #fef2f2;">
          <h2 style="margin: 0 0 15px 0; color: #991b1b; font-size: 18px;">⚠️ Injury Description</h2>
          <p style="margin: 0; color: #1f2937; line-height: 1.6;">${lead.injury_description}</p>
        </div>
        ` : ''}
        
        ${(lead.symptoms && lead.symptoms.length > 0) ? `
        <div style="padding: 25px; border-bottom: 1px solid #e5e7eb; background: #fff7ed;">
          <h2 style="margin: 0 0 15px 0; color: #c2410c; font-size: 18px;">🩺 Documented Symptoms (${lead.symptoms.length})</h2>
          <p style="margin: 0 0 10px 0; color: #1f2937;"><strong>Overall Severity:</strong> ${lead.symptom_severity || 'Not specified'} | <strong>Duration:</strong> ${lead.symptom_duration || 'Not specified'}</p>
          <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
            ${lead.symptoms.map((s: any) => `<li style="margin: 5px 0;">${s.symptom} (${s.severity}, ${s.duration}) - Affects: ${s.who_affected}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        
        <!-- Toxic Product Exposure -->
        ${toxicProducts.length > 0 ? `
        <div style="padding: 25px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">☠️ Toxic Product Exposure (${toxicProducts.length} products)</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; color: #6b7280;">Product</th>
                <th style="padding: 10px; text-align: left; color: #6b7280;">Brand</th>
                <th style="padding: 10px; text-align: center; color: #6b7280;">Score</th>
                <th style="padding: 10px; text-align: left; color: #6b7280;">Toxic Ingredients</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <!-- Health Conditions -->
        ${lead.health_conditions && Object.keys(lead.health_conditions).length > 0 ? `
        <div style="padding: 25px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">🏥 Health Conditions</h2>
          <p style="margin: 0; color: #1f2937;">${JSON.stringify(lead.health_conditions)}</p>
        </div>
        ` : ''}
        
        <!-- Consent & Timestamp -->
        <div style="padding: 25px; background: #f9fafb;">
          <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">✅ Consent & Compliance</h2>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Consent Given:</td>
              <td style="padding: 6px 0; color: #059669; font-weight: 600;">Yes</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Lead Created:</td>
              <td style="padding: 6px 0; color: #1f2937;">${new Date(lead.created_at).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Lead ID:</td>
              <td style="padding: 6px 0; color: #6b7280; font-family: monospace; font-size: 12px;">${lead.id}</td>
            </tr>
          </table>
        </div>
        
        <!-- CTA -->
        <div style="padding: 25px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%);">
          <p style="margin: 0; color: white; font-size: 16px; font-weight: 600;">
            📞 Contact this lead immediately for best conversion!
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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { leadId, endpointIds, forceDistribute }: DistributeLeadRequest = await req.json();

    console.log(`Distributing lead ${leadId} to endpoints:`, endpointIds || "all active");

    // Fetch the lead
    const { data: lead, error: leadError } = await supabaseClient
      .from("legal_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Lead not found:", leadError);
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch active endpoints
    let endpointsQuery = supabaseClient
      .from("webhook_endpoints")
      .select("*")
      .eq("is_active", true);

    if (endpointIds && endpointIds.length > 0) {
      endpointsQuery = endpointsQuery.in("id", endpointIds);
    }

    const { data: endpoints, error: endpointsError } = await endpointsQuery;

    if (endpointsError) {
      console.error("Error fetching endpoints:", endpointsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch distribution endpoints" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!endpoints || endpoints.length === 0) {
      console.log("No active endpoints configured");
      return new Response(
        JSON.stringify({ success: true, message: "No active endpoints configured", distributed_to: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${endpoints.length} active endpoints`);

    const results: any[] = [];
    const leadPayload = buildLeadPayload(lead);

    for (const endpoint of endpoints) {
      let status = "pending";
      let responseCode: number | null = null;
      let responseBody: string | null = null;
      let errorMessage: string | null = null;

      try {
        // Check filters if not forcing distribution
        if (!forceDistribute && endpoint.filters) {
          const filters = endpoint.filters as any;
          if (filters.min_quality_score && (lead.lead_quality_score || 0) < filters.min_quality_score) {
            console.log(`Skipping endpoint ${endpoint.name}: quality score below minimum`);
            continue;
          }
        }

        console.log(`Distributing to endpoint: ${endpoint.name} (${endpoint.endpoint_type})`);

        if (endpoint.endpoint_type === "email" && endpoint.email) {
          // Send email via Resend API
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Lead Alerts <leads@resend.dev>",
              to: [endpoint.email],
              subject: `🔥 New Lead: ${lead.first_name || ''} ${lead.last_name || ''} - Score: ${lead.lead_quality_score || 0}`,
              html: buildEmailHtml(lead),
            }),
          });
          
          responseCode = emailResponse.status;
          responseBody = await emailResponse.text();
          status = emailResponse.ok ? "success" : "failed";
          console.log(`Email sent to ${endpoint.email}: ${emailResponse.status}`);

        } else if (endpoint.url) {
          // Send webhook/API/Zapier request
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(endpoint.headers as Record<string, string> || {}),
          };

          if (endpoint.api_key) {
            headers["Authorization"] = `Bearer ${endpoint.api_key}`;
          }

          const response = await fetch(endpoint.url, {
            method: "POST",
            headers,
            body: JSON.stringify(leadPayload),
          });

          responseCode = response.status;
          responseBody = await response.text();
          status = response.ok ? "success" : "failed";

          if (!response.ok) {
            errorMessage = `HTTP ${response.status}: ${responseBody}`;
          }

          console.log(`Webhook response from ${endpoint.name}: ${response.status}`);
        }

        // Update endpoint stats
        if (status === "success") {
          await supabaseClient
            .from("webhook_endpoints")
            .update({
              success_count: (endpoint.success_count || 0) + 1,
              last_triggered_at: new Date().toISOString(),
            })
            .eq("id", endpoint.id);
        } else if (status === "failed") {
          await supabaseClient
            .from("webhook_endpoints")
            .update({
              failure_count: (endpoint.failure_count || 0) + 1,
              last_triggered_at: new Date().toISOString(),
            })
            .eq("id", endpoint.id);
        }

      } catch (error: any) {
        status = "failed";
        errorMessage = error.message;
        console.error(`Error distributing to ${endpoint.name}:`, error);
      }

      // Log the distribution attempt
      await supabaseClient
        .from("lead_distribution_logs")
        .insert({
          lead_id: leadId,
          endpoint_id: endpoint.id,
          status,
          response_code: responseCode,
          response_body: responseBody?.substring(0, 1000),
          error_message: errorMessage,
        });

      results.push({
        endpoint_id: endpoint.id,
        endpoint_name: endpoint.name,
        endpoint_type: endpoint.endpoint_type,
        status,
        response_code: responseCode,
      });
    }

    const successCount = results.filter(r => r.status === "success").length;
    console.log(`Distribution complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        distributed_to: successCount,
        total_endpoints: results.length,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in distribute-lead:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
