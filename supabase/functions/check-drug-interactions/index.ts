import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InteractionResult {
  medication: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  effect: string;
  recommendation: string;
  mechanism: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scannedMedication, existingMedications } = await req.json();

    console.log('Checking interactions for:', scannedMedication);
    console.log('Against existing medications:', existingMedications);

    if (!scannedMedication) {
      return new Response(
        JSON.stringify({ error: 'Scanned medication is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!existingMedications || existingMedications.length === 0) {
      return new Response(
        JSON.stringify({ hasInteractions: false, interactions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI to analyze drug interactions
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
            content: `You are a pharmaceutical interaction database. Analyze potential drug interactions between medications.
            
IMPORTANT: You are providing general educational information, not medical advice. Always recommend consulting a healthcare provider.

For each interaction found, classify severity as:
- contraindicated: Should never be used together, serious or life-threatening effects
- major: Serious interaction requiring medical supervision or alternative treatment
- moderate: May require monitoring or dose adjustment
- minor: Low risk, minimal clinical significance

Respond ONLY with a valid JSON object in this exact format:
{
  "hasInteractions": boolean,
  "interactions": [
    {
      "medication": "name of the interacting medication",
      "severity": "minor|moderate|major|contraindicated",
      "effect": "description of the interaction effect",
      "recommendation": "what the user should do",
      "mechanism": "how the interaction works pharmacologically"
    }
  ]
}

If no significant interactions exist, return: {"hasInteractions": false, "interactions": []}`
          },
          {
            role: 'user',
            content: `Check for drug interactions between the NEW medication "${scannedMedication}" and these EXISTING medications: ${existingMedications.map((m: any) => typeof m === 'string' ? m : m.name || m.medication_name).join(', ')}`
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
    const interactions: InteractionResult[] = (parsedResponse.interactions || [])
      .filter((i: any) => i.medication && i.severity && i.effect)
      .map((i: any) => ({
        medication: String(i.medication),
        severity: ['minor', 'moderate', 'major', 'contraindicated'].includes(i.severity) 
          ? i.severity 
          : 'moderate',
        effect: String(i.effect),
        recommendation: String(i.recommendation || 'Consult your healthcare provider'),
        mechanism: String(i.mechanism || 'Mechanism not specified'),
      }));

    return new Response(
      JSON.stringify({
        hasInteractions: interactions.length > 0,
        interactions,
        disclaimer: 'This is for educational purposes only and is not medical advice. Always consult your healthcare provider or pharmacist about potential drug interactions.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check drug interactions';
    console.error('Error in check-drug-interactions:', error);
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
