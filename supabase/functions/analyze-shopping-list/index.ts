import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShoppingItem {
  name: string;
  riskLevel: 'safe' | 'caution' | 'danger';
  concerns: string[];
  alternatives?: string[];
}

interface AnalysisResult {
  items: ShoppingItem[];
  overallRisk: 'low' | 'medium' | 'high';
  summary: string;
  dangerCount: number;
  cautionCount: number;
  safeCount: number;
}

interface ProductRecommendation {
  name: string;
  brand: string;
  reason: string;
  estimatedScore: number;
  category: 'best' | 'okay' | 'avoid';
}

interface ProductSearchResult {
  category: string;
  bestChoices: ProductRecommendation[];
  okayOptions: ProductRecommendation[];
  avoidThese: ProductRecommendation[];
  personalizedTip: string;
}

interface SmartCartItem {
  originalItem: string;
  recommendedProduct: string;
  brand: string;
  reason: string;
  healthScore: number;
  priceRange: string;
}

interface SmartCartResult {
  items: SmartCartItem[];
  overallHealthScore: number;
  moneySavingTips: string[];
  summary: string;
}

const buildSystemPrompt = (mode: string, userProfile?: any) => {
  let profileContext = '';
  
  if (userProfile) {
    const conditions = [];
    if (userProfile.is_diabetic) conditions.push('diabetic');
    if (userProfile.is_vegan) conditions.push('vegan');
    if (userProfile.is_gluten_free) conditions.push('gluten intolerant');
    if (userProfile.is_dairy_free) conditions.push('lactose intolerant');
    if (userProfile.is_pregnant) conditions.push('pregnant');
    if (userProfile.is_heart_healthy) conditions.push('managing heart health');
    
    if (userProfile.health_conditions && Array.isArray(userProfile.health_conditions)) {
      conditions.push(...userProfile.health_conditions);
    }
    
    if (userProfile.allergies_detailed && Array.isArray(userProfile.allergies_detailed)) {
      profileContext += `\n\nCRITICAL ALLERGIES: ${userProfile.allergies_detailed.join(', ')}`;
    }
    
    if (conditions.length > 0) {
      profileContext += `\n\nUser Health Conditions: ${conditions.join(', ')}`;
    }
    
    if (userProfile.age_group) {
      profileContext += `\nAge Group: ${userProfile.age_group}`;
    }
  }

  if (mode === 'product_search') {
    return `You are an expert nutritionist helping users find healthier food products. Based on the product category they're looking for, recommend REAL specific brands and products available in US grocery stores.
${profileContext}

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "category": "the category searched",
  "bestChoices": [
    { "name": "Product Name", "brand": "Brand Name", "reason": "Why it's healthy", "estimatedScore": 85, "category": "best" }
  ],
  "okayOptions": [
    { "name": "Product Name", "brand": "Brand Name", "reason": "Pros and cons", "estimatedScore": 65, "category": "okay" }
  ],
  "avoidThese": [
    { "name": "Product Name", "brand": "Brand Name", "reason": "Why to avoid", "estimatedScore": 30, "category": "avoid" }
  ],
  "personalizedTip": "A tip based on user's health profile"
}

Guidelines:
- Recommend 3 products for each category (best, okay, avoid)
- Use REAL brand names and products available in US stores
- Consider user allergies and health conditions as CRITICAL
- estimatedScore is 0-100 (100 = healthiest)
- Be specific about WHY each product is good or bad`;
  }

  if (mode === 'smart_cart') {
    return `You are an expert nutritionist and smart shopper. The user has a shopping list - recommend the BEST specific brands/products for each item they want to buy, considering their health profile.
${profileContext}

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "originalItem": "what user wanted",
      "recommendedProduct": "Specific Product Name",
      "brand": "Brand Name",
      "reason": "Why this is the best choice",
      "healthScore": 85,
      "priceRange": "$" | "$$" | "$$$"
    }
  ],
  "overallHealthScore": 82,
  "moneySavingTips": ["tip 1", "tip 2"],
  "summary": "Brief summary of the optimized cart"
}

Guidelines:
- For each item, recommend a SPECIFIC real product with brand
- healthScore is 0-100 (100 = healthiest)
- Consider user's health conditions and allergies as CRITICAL
- Include budget-friendly alternatives where possible
- Be practical - these should be products available in typical US grocery stores`;
  }

  // Default: analyze shopping list mode
  return `You are an expert nutritionist and food safety analyst. Analyze a shopping list and identify potential health risks for each item.
${profileContext}

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "name": "item name from list",
      "riskLevel": "safe" | "caution" | "danger",
      "concerns": ["list of specific concerns"],
      "alternatives": ["healthier alternatives if risky"]
    }
  ],
  "overallRisk": "low" | "medium" | "high",
  "summary": "Brief 1-2 sentence summary of the list's health impact",
  "dangerCount": number,
  "cautionCount": number,
  "safeCount": number
}

Risk Level Guidelines:
- "danger": Contains allergens for this user, high sugar/sodium, ultra-processed, known harmful additives
- "caution": Moderate concerns, could be better choices available
- "safe": Whole foods, minimal processing, no concerns for this user

Be specific about concerns. If the user has allergies or conditions, flag ANY item that could trigger them as "danger".`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = 'analyze', shoppingList, searchQuery, userProfile } = await req.json();

    console.log('Request mode:', mode);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userPrompt = '';
    
    if (mode === 'product_search') {
      if (!searchQuery || searchQuery.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Search query is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userPrompt = `Find the healthiest options for this product category: "${searchQuery}"

Recommend specific brands and products available in US grocery stores. Include 3 best choices, 3 okay options, and 3 products to avoid.`;
    } else if (mode === 'smart_cart') {
      if (!shoppingList || shoppingList.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Shopping list is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userPrompt = `Create an optimized healthy shopping cart from this list. For each item, recommend the BEST specific brand and product:

${shoppingList}

Recommend specific products with brands that are healthiest while being practical and available in typical US grocery stores.`;
    } else {
      // Default analyze mode
      if (!shoppingList || shoppingList.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Shopping list is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userPrompt = `Analyze this shopping list and identify health risks:\n\n${shoppingList}`;
    }

    console.log('Processing request for mode:', mode);

    const systemPrompt = buildSystemPrompt(mode, userProfile);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to process request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully processed', mode, 'request');

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Shopping analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
