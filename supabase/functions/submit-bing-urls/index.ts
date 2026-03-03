import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BING_API_URL = "https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch";
const SITE_URL = "https://foodfactscanner.com";

// Default URLs to submit based on sitemap
const DEFAULT_URLS = [
  "https://foodfactscanner.com/",
  "https://foodfactscanner.com/scanner",
  "https://foodfactscanner.com/install",
  "https://foodfactscanner.com/subscription",
  "https://foodfactscanner.com/privacy-policy",
  "https://foodfactscanner.com/terms",
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('BING_WEBMASTER_API_KEY');
    
    if (!apiKey) {
      console.error("BING_WEBMASTER_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Bing Webmaster API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for custom URLs or use defaults
    let urlList = DEFAULT_URLS;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.urls && Array.isArray(body.urls) && body.urls.length > 0) {
          // Validate URLs belong to the site
          urlList = body.urls.filter((url: string) => 
            typeof url === 'string' && url.startsWith(SITE_URL)
          );
          
          if (urlList.length === 0) {
            return new Response(
              JSON.stringify({ error: "No valid URLs provided. URLs must start with " + SITE_URL }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch {
        // Use default URLs if body parsing fails
        console.log("No custom URLs provided, using defaults");
      }
    }

    // Bing allows max 10 URLs per batch
    if (urlList.length > 10) {
      urlList = urlList.slice(0, 10);
      console.log("Trimmed URL list to 10 (Bing limit)");
    }

    console.log("Submitting URLs to Bing:", urlList);

    // Submit to Bing Webmaster API
    const bingResponse = await fetch(`${BING_API_URL}?apikey=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        siteUrl: SITE_URL,
        urlList: urlList,
      }),
    });

    const responseText = await bingResponse.text();
    console.log("Bing API response status:", bingResponse.status);
    console.log("Bing API response:", responseText);

    if (!bingResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Bing API request failed", 
          status: bingResponse.status,
          details: responseText 
        }),
        { status: bingResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "URLs submitted to Bing successfully",
        urlsSubmitted: urlList,
        bingResponse: responseText ? JSON.parse(responseText) : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error submitting URLs to Bing:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
