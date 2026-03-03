import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const mealSuggestionsTool = {
  type: "function",
  function: {
    name: "get_meal_suggestions",
    description: "Get quick meal suggestions based on user profile",
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Meal name" },
              emoji: { type: "string", description: "Relevant food emoji" },
              description: { type: "string", description: "Short 1-sentence description" },
              mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack", "baby"] },
              prepTime: { type: "string", description: "e.g., '15 mins'" },
              babyFriendly: { type: "boolean", description: "Safe for babies/toddlers" },
              babyMeal: { type: "boolean", description: "True if specifically designed as baby/toddler meal (purees, finger foods)" },
              keyBenefit: { type: "string", description: "One main health benefit" }
            },
            required: ["name", "emoji", "description", "mealType", "prepTime", "keyBenefit"]
          }
        }
      },
      required: ["suggestions"]
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Build context from profile
    let profileContext = '';
    if (profile) {
      if (profile.feeding_stage) profileContext += `Baby feeding stage: ${profile.feeding_stage}. `;
      if (profile.baby_ages?.length > 0) profileContext += `Baby age: ${profile.baby_ages[0]} months. `;
      if (profile.is_pregnant) profileContext += 'User is pregnant. ';
      if (profile.is_nursing) profileContext += 'User is nursing. ';
      if (profile.is_vegan) profileContext += 'Vegan diet. ';
      if (profile.is_gluten_free) profileContext += 'Gluten-free. ';
      if (profile.is_diabetic) profileContext += 'Diabetic - low sugar. ';
      if (profile.allergies_detailed?.length > 0) {
        profileContext += `Allergies: ${profile.allergies_detailed.join(', ')}. `;
      }
      if (profile.parenting_concerns?.length > 0) {
        profileContext += `Safety concerns: ${profile.parenting_concerns.join(', ')}. `;
      }
    }

    // Check if user has a baby or is pregnant - exclude "not_applicable" users
    const babyAges = Array.isArray(profile?.baby_ages) ? profile.baby_ages : [];
    const hasBaby = babyAges.length > 0 || !!profile?.feeding_stage || profile?.is_pregnant;
    const feedingStage = profile?.feeding_stage;

    // Build baby food context
    let babyFoodContext = '';
    if (hasBaby) {
      babyFoodContext = `\n\nBABY FOOD REQUIREMENTS:
- Feeding stage: ${feedingStage || 'unknown'}
- Include 2 dedicated baby/toddler meals with mealType: "baby"
- ${feedingStage === 'puree' ? 'Focus on smooth purees and first foods' : feedingStage === 'soft_foods' ? 'Include soft finger foods and mashed textures' : 'Include toddler-friendly meals that are easy to chew'}
- Ensure no honey (under 1 year), whole nuts, or choking hazards
- Mark these with babyMeal: true`;
    }

    const systemPrompt = `You are a helpful meal suggestion AI for parents and families. Provide a BALANCED mix of meal types throughout the day.

${profileContext}${babyFoodContext}

IMPORTANT INSTRUCTIONS:
- Return exactly ${hasBaby ? '8' : '6'} meal suggestions total
- Include: 1 breakfast, 2 lunch options, 2 dinner options, 1 snack${hasBaby ? ', and 2 baby-specific meals' : ''}
- For any meal safe for babies/toddlers, set babyFriendly: true
- ${hasBaby ? 'Baby-specific meals should have mealType: "baby" and babyMeal: true' : ''}
- Keep suggestions practical, healthy, and easy to prepare`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Give me meal suggestions for today - including breakfast, lunch, dinner, and snack options.${hasBaby ? ' Also include baby-appropriate meals.' : ''}` }
        ],
        tools: [mealSuggestionsTool],
        tool_choice: { type: "function", function: { name: "get_meal_suggestions" } },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI request failed');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let suggestions = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      suggestions = parsed.suggestions || [];
    }

    return new Response(
      JSON.stringify({ suggestions, hasBaby }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Quick suggestions error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
