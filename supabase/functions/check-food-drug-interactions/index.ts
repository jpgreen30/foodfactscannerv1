import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FoodDrugInteraction {
  ingredient: string;
  medication: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  effect: string;
  recommendation: string;
  alternativeFoods: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foodIngredients, medications } = await req.json();

    console.log('Checking food-drug interactions for ingredients:', foodIngredients);
    console.log('Against medications:', medications);

    if (!foodIngredients || foodIngredients.length === 0) {
      return new Response(
        JSON.stringify({ hasInteractions: false, interactions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!medications || medications.length === 0) {
      return new Response(
        JSON.stringify({ hasInteractions: false, interactions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract ingredient names
    const ingredientNames = foodIngredients.map((i: any) => 
      typeof i === 'string' ? i : (i.name || i.ingredient || '')
    ).filter(Boolean);

    // Extract medication names
    const medicationNames = medications.map((m: any) => 
      typeof m === 'string' ? m : (m.medication_name || m.name || '')
    ).filter(Boolean);

    if (ingredientNames.length === 0 || medicationNames.length === 0) {
      return new Response(
        JSON.stringify({ hasInteractions: false, interactions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI to analyze food-drug interactions
    const response = await fetch('https://lovable.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a pharmaceutical and nutritional interaction expert. Analyze potential food-drug interactions between food ingredients and medications.

IMPORTANT: You are providing general educational information, not medical advice. Always recommend consulting a healthcare provider or pharmacist.

Common food-drug interactions to check for:
- Grapefruit/grapefruit juice with statins (atorvastatin, simvastatin), calcium channel blockers, anti-anxiety meds, immunosuppressants
- Vitamin K rich foods (leafy greens, broccoli, brussels sprouts) with Warfarin/Coumadin
- Tyramine-rich foods (aged cheese, cured meats, wine, fermented foods) with MAOIs
- Potassium-rich foods (bananas, oranges, potatoes) with ACE inhibitors, potassium-sparing diuretics
- Dairy products with tetracycline, fluoroquinolones, bisphosphonates (reduces absorption)
- Caffeine with theophylline, stimulants, certain antidepressants
- Alcohol with many medications (sedatives, painkillers, antidepressants)
- High fiber foods with levothyroxine, digoxin (reduces absorption)
- Licorice with blood pressure medications, heart medications
- Cranberry juice with Warfarin

For each interaction found, classify severity as:
- contraindicated: Should never consume together, serious or life-threatening effects
- major: Significant interaction requiring avoidance or close monitoring
- moderate: May require monitoring or timing adjustments
- minor: Low risk, minimal clinical significance

Respond ONLY with a valid JSON object in this exact format:
{
  "hasInteractions": boolean,
  "interactions": [
    {
      "ingredient": "name of the food ingredient",
      "medication": "name of the affected medication",
      "severity": "minor|moderate|major|contraindicated",
      "effect": "description of how the food affects the medication",
      "recommendation": "what the user should do",
      "alternativeFoods": ["list", "of", "safe", "alternatives"]
    }
  ]
}

If no significant interactions exist, return: {"hasInteractions": false, "interactions": []}`
          },
          {
            role: 'user',
            content: `Check for food-drug interactions between these FOOD INGREDIENTS: ${ingredientNames.join(', ')} 
            
And these MEDICATIONS the user is taking: ${medicationNames.join(', ')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('No response from AI');
      return new Response(
        JSON.stringify({ hasInteractions: false, interactions: [], error: 'No AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response:', aiResponse);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiResponse];
      const jsonStr = jsonMatch[1]?.trim() || aiResponse.trim();
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ hasInteractions: false, interactions: [], error: 'Failed to parse response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize the response
    const interactions: FoodDrugInteraction[] = (parsedResponse.interactions || [])
      .filter((i: any) => i.ingredient && i.medication && i.severity && i.effect)
      .map((i: any) => ({
        ingredient: String(i.ingredient),
        medication: String(i.medication),
        severity: ['minor', 'moderate', 'major', 'contraindicated'].includes(i.severity) 
          ? i.severity 
          : 'moderate',
        effect: String(i.effect),
        recommendation: String(i.recommendation || 'Consult your healthcare provider or pharmacist'),
        alternativeFoods: Array.isArray(i.alternativeFoods) ? i.alternativeFoods.map(String) : [],
      }));

    return new Response(
      JSON.stringify({
        hasInteractions: interactions.length > 0,
        interactions,
        disclaimer: 'This is for educational purposes only and is not medical advice. Always consult your healthcare provider or pharmacist about potential food-drug interactions.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check food-drug interactions';
    console.error('Error in check-food-drug-interactions:', error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        hasInteractions: false,
        interactions: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
