import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MealPreferences {
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  maxPrepTime?: number;
  calorieTarget?: number | null;
  proteinTarget?: number | null;
  budgetPreference?: 'budget' | 'moderate' | 'premium';
}

interface RecallWarning {
  ingredient: string;
  recalls: {
    brand: string;
    reason: string;
    classification: string;
  }[];
}

// Check ingredients against FDA recalls
async function checkIngredientRecalls(ingredients: string, supabaseUrl: string, supabaseKey: string): Promise<RecallWarning[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get active recalls from last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recalls } = await supabase
    .from('food_recalls')
    .select('brand_name, product_description, reason_for_recall, classification')
    .gte('created_at', ninetyDaysAgo);

  if (!recalls || recalls.length === 0) return [];

  const warnings: RecallWarning[] = [];
  const ingredientList = ingredients.toLowerCase().split(/[\n,]+/).map(i => i.trim()).filter(Boolean);
  
  for (const ingredient of ingredientList) {
    const matchingRecalls = recalls.filter(r => 
      r.product_description?.toLowerCase().includes(ingredient) ||
      r.brand_name?.toLowerCase().includes(ingredient) ||
      ingredient.includes(r.brand_name?.toLowerCase() || '')
    );
    
    if (matchingRecalls.length > 0) {
      warnings.push({
        ingredient,
        recalls: matchingRecalls.map(r => ({
          brand: r.brand_name || 'Unknown',
          reason: r.reason_for_recall || 'See FDA for details',
          classification: r.classification || 'Unknown'
        }))
      });
    }
  }
  
  return warnings;
}

const buildSystemPrompt = (userProfile?: any, preferences?: MealPreferences, recallWarnings?: RecallWarning[]) => {
  let profileContext = '';
  
  if (userProfile) {
    const conditions = [];
    if (userProfile.is_diabetic) conditions.push('diabetic - AVOID high sugar, refined carbs');
    if (userProfile.is_vegan) conditions.push('vegan - NO meat, dairy, eggs, honey');
    if (userProfile.is_gluten_free) conditions.push('gluten intolerant - NO wheat, barley, rye');
    if (userProfile.is_dairy_free) conditions.push('lactose intolerant - NO milk, cheese, butter');
    if (userProfile.is_pregnant) conditions.push('pregnant - AVOID raw fish, deli meats, high mercury fish, unpasteurized dairy');
    if (userProfile.is_heart_healthy) conditions.push('heart health focus - LOW sodium, low saturated fat');
    if (userProfile.is_nursing) conditions.push('nursing mother - include galactagogue foods (oats, leafy greens, fennel), stay hydrated');
    if (userProfile.is_new_mom) conditions.push('new mom - focus on nutrient-dense, energy-boosting meals');
    
    if (userProfile.health_conditions && Array.isArray(userProfile.health_conditions)) {
      conditions.push(...userProfile.health_conditions.map((c: string) => `has ${c}`));
    }
    
    if (userProfile.allergies_detailed && Array.isArray(userProfile.allergies_detailed)) {
      profileContext += `\n\n🚨 CRITICAL ALLERGIES - NEVER INCLUDE: ${userProfile.allergies_detailed.join(', ')}`;
    }
    
    if (conditions.length > 0) {
      profileContext += `\n\nUser Health Requirements:\n${conditions.map(c => `- ${c}`).join('\n')}`;
    }
    
    if (userProfile.age_group) {
      profileContext += `\nAge Group: ${userProfile.age_group}`;
    }

    if (userProfile.dietary_goals) {
      profileContext += `\nDietary Goals: ${userProfile.dietary_goals}`;
    }

    // Baby-specific context
    if (userProfile.feeding_stage) {
      const stageGuidelines: Record<string, string> = {
        breastfeeding: "Mom is breastfeeding - suggest galactagogue foods (oats, leafy greens, fennel, fenugreek) and avoid strong flavors that may affect breast milk. Include iron-rich and calcium-rich foods.",
        starting_solids: "Baby is starting solids (4-6 months) - suggest single-ingredient purees, iron-fortified foods. AVOID: honey, whole nuts, choking hazards, added salt/sugar, cow's milk as main drink.",
        baby_food: "Baby is eating purees/soft foods (6-9 months) - suggest soft, mashable textures, nutrient-dense ingredients. Introduce variety. AVOID: honey, whole grapes, popcorn, hard raw vegetables.",
        toddler_food: "Toddler eating table foods (12+ months) - suggest finger foods, balanced meals, cut appropriately. AVOID: choking hazards, excessive salt, added sugars."
      };
      profileContext += `\n\n👶 BABY FEEDING STAGE: ${stageGuidelines[userProfile.feeding_stage] || userProfile.feeding_stage}`;
    }

    if (userProfile.baby_ages && Array.isArray(userProfile.baby_ages) && userProfile.baby_ages.length > 0) {
      const ages = userProfile.baby_ages;
      const ageDescriptions = ages.map((a: number) => {
        if (a < 6) return `${a} months (breast milk/formula only, or just starting purees)`;
        if (a < 9) return `${a} months (purees and soft foods)`;
        if (a < 12) return `${a} months (soft finger foods, mashed table food)`;
        return `${a} months (toddler foods, cut small)`;
      });
      profileContext += `\nBaby age(s): ${ageDescriptions.join(', ')} - tailor textures and ingredients accordingly`;
    }

    if (userProfile.parenting_concerns && Array.isArray(userProfile.parenting_concerns) && userProfile.parenting_concerns.length > 0) {
      const concernGuidelines: Record<string, string> = {
        heavy_metals: "⚠️ HEAVY METALS CONCERN: AVOID rice cereals, certain fish (shark, swordfish, king mackerel, tilefish), apple/grape juice. Prefer variety of grains (oats, quinoa, barley).",
        pesticides: "🌿 PESTICIDES CONCERN: PREFER organic produce, especially for dirty dozen (strawberries, spinach, apples, grapes). Wash all fruits/vegetables thoroughly.",
        bpa: "🧴 BPA CONCERN: Use fresh ingredients over canned when possible. If using canned, prefer BPA-free labeled products.",
        artificial_additives: "🚫 ARTIFICIAL ADDITIVES: AVOID artificial colors (Red 40, Yellow 5, Blue 1), artificial preservatives (BHA, BHT), artificial sweeteners (aspartame, sucralose).",
        hidden_sugars: "🍬 HIDDEN SUGARS: AVOID added sugars, honey (for babies under 1), high-fructose corn syrup. Check labels for sugar aliases (dextrose, maltose, sucrose).",
        organic: "🌱 ORGANIC PRIORITY: Prioritize organic options especially for produce, dairy, and meat. Focus on whole, unprocessed foods."
      };
      const concerns = userProfile.parenting_concerns.map((c: string) => concernGuidelines[c]).filter(Boolean);
      if (concerns.length > 0) {
        profileContext += `\n\n⚠️ BABY SAFETY CONCERNS:\n${concerns.join('\n')}`;
      }
    }
  }

  // Add recall warnings to prompt
  let recallContext = '';
  if (recallWarnings && recallWarnings.length > 0) {
    recallContext = '\n\n🚨 FDA RECALL WARNINGS - AVOID THESE INGREDIENTS:\n';
    for (const warning of recallWarnings) {
      recallContext += `- ${warning.ingredient.toUpperCase()}: Recalled due to ${warning.recalls.map(r => r.reason).join('; ')}\n`;
    }
    recallContext += '\nSuggest safe alternatives for any recalled ingredients.';
  }

  // Add preferences context
  let preferencesContext = '';
  if (preferences) {
    if (preferences.skillLevel) {
      const skillDescriptions: Record<string, string> = {
        beginner: 'BEGINNER level - Use simple techniques only. No complex methods like braising, sous vide, or advanced knife skills. Keep instructions very clear and detailed.',
        intermediate: 'INTERMEDIATE level - Can handle moderate complexity. Some multi-step processes are okay.',
        advanced: 'ADVANCED level - Complex techniques welcome. Can handle challenging recipes.'
      };
      preferencesContext += `\n\nCooking Skill: ${skillDescriptions[preferences.skillLevel]}`;
    }

    if (preferences.maxPrepTime) {
      preferencesContext += `\nTime Constraint: Each recipe must have total prep+cook time under ${preferences.maxPrepTime} minutes.`;
    }

    if (preferences.calorieTarget) {
      preferencesContext += `\nCalorie Target: Aim for approximately ${preferences.calorieTarget} calories per meal.`;
    }

    if (preferences.proteinTarget) {
      preferencesContext += `\nProtein Target: Aim for approximately ${preferences.proteinTarget}g protein per meal.`;
    }

    if (preferences.budgetPreference) {
      const budgetDescriptions: Record<string, string> = {
        budget: 'BUDGET-FRIENDLY - Prioritize affordable, accessible ingredients. Suggest cost-saving substitutions.',
        moderate: 'MODERATE budget - Balance between cost and quality.',
        premium: 'PREMIUM ingredients welcome - Focus on quality and flavor over cost.'
      };
      preferencesContext += `\nBudget: ${budgetDescriptions[preferences.budgetPreference]}`;
    }
  }

  return `You are an expert nutritionist and meal planning AI specializing in family and baby-safe nutrition. Create personalized, safe meal plans based on available ingredients and user health requirements.
${profileContext}${recallContext}${preferencesContext}

CRITICAL RULES:
1. NEVER suggest ingredients that conflict with user allergies or dietary restrictions
2. NEVER suggest recalled ingredients - always provide alternatives
3. For baby/toddler meals: ensure age-appropriate textures, sizes, and ingredients
4. All meals must be practical and easy to prepare
5. Provide clear, concise cooking instructions${preferences?.skillLevel === 'beginner' ? ' (extra detailed for beginners)' : ''}
6. Include estimated nutrition info
7. Suggest ingredient substitutions when helpful
8. ALWAYS create meal plans even with limited ingredients - be creative with common pantry staples
9. If ingredients are very limited, suggest simple meals and note what additional items would help
${preferences?.maxPrepTime ? `10. STRICT: Total time (prep + cook) must be under ${preferences.maxPrepTime} minutes` : ''}

For families with babies/toddlers:
- Include meal ideas that work for the whole family with baby-safe modifications
- Note which portions are suitable for baby vs adults
- Suggest how to modify textures for different ages

You MUST always provide meal suggestions. Never refuse to create a meal plan.`;
};

// Tool definition for structured output
const mealPlanTool = {
  type: "function",
  function: {
    name: "create_meal_plan",
    description: "Create a personalized meal plan with recipes based on available ingredients",
    parameters: {
      type: "object",
      properties: {
        meals: {
          type: "array",
          description: "Array of meal recipes",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the meal" },
              type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"], description: "Type of meal" },
              prepTime: { type: "string", description: "Preparation time, e.g., '15 mins'" },
              cookTime: { type: "string", description: "Cooking time, e.g., '20 mins'" },
              servings: { type: "number", description: "Number of servings" },
              safetyScore: { type: "number", description: "Safety score from 0-100 based on user's health needs" },
              babyFriendly: { type: "boolean", description: "Whether this meal is suitable for babies/toddlers" },
              babyModifications: { type: "string", description: "How to modify this meal for baby if applicable" },
              ingredients: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    item: { type: "string", description: "Ingredient name" },
                    amount: { type: "string", description: "Amount needed, e.g., '1 cup'" },
                    notes: { type: "string", description: "Optional notes about the ingredient" }
                  },
                  required: ["item", "amount"]
                }
              },
              instructions: {
                type: "array",
                items: { type: "string" },
                description: "Step-by-step cooking instructions"
              },
              nutrition: {
                type: "object",
                properties: {
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  fiber: { type: "number" }
                },
                required: ["calories", "protein", "carbs", "fat"]
              },
              healthBenefits: {
                type: "array",
                items: { type: "string" },
                description: "List of health benefits"
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "Any relevant warnings for this user"
              },
              estimatedCost: { type: "string", enum: ["budget", "moderate", "premium"] },
              difficultyLevel: { type: "string", enum: ["easy", "medium", "hard"] }
            },
            required: ["name", "type", "prepTime", "cookTime", "servings", "ingredients", "instructions", "nutrition", "healthBenefits", "difficultyLevel"]
          }
        },
        shoppingList: {
          type: "array",
          description: "Structured shopping list with categories and details",
          items: {
            type: "object",
            properties: {
              item: { type: "string", description: "Item name" },
              quantity: { type: "string", description: "Amount needed, e.g., '2 cups', '1 lb', '3'" },
              category: { 
                type: "string", 
                enum: ["produce", "dairy", "meat", "pantry", "frozen", "bakery", "beverages", "other"],
                description: "Store aisle category"
              },
              estimatedPrice: { type: "string", description: "Price range, e.g., '$3-5'" },
              healthierAlternative: { type: "string", description: "Optional healthier swap suggestion" },
              notes: { type: "string", description: "Optional notes like 'organic preferred' or 'for baby food'" }
            },
            required: ["item", "quantity", "category"]
          }
        },
        tips: {
          type: "array",
          items: { type: "string" },
          description: "General meal prep tips based on their ingredients"
        },
        recallAlerts: {
          type: "array",
          items: { type: "string" },
          description: "Any FDA recall warnings about ingredients"
        }
      },
      required: ["meals", "shoppingList", "tips"]
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, mealCount, mealTypes, userProfile, preferences, specificRecipe, mealType } = await req.json();

    if (!ingredients || ingredients.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Ingredients list is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating meal plan for ingredients:', ingredients.substring(0, 100));
    console.log('Specific recipe requested:', specificRecipe);
    console.log('User feeding stage:', userProfile?.feeding_stage);
    console.log('Baby ages:', userProfile?.baby_ages);
    console.log('Parenting concerns:', userProfile?.parenting_concerns);

    // Check for FDA recalls on ingredients
    let recallWarnings: RecallWarning[] = [];
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      recallWarnings = await checkIngredientRecalls(ingredients, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      if (recallWarnings.length > 0) {
        console.log('Found recall warnings:', recallWarnings.length);
      }
    }

    const systemPrompt = buildSystemPrompt(userProfile, preferences, recallWarnings);
    
    // Different prompt for specific recipe vs general meal plan
    let userMessage: string;
    
    if (specificRecipe) {
      // User clicked on a specific meal suggestion - generate detailed recipe
      userMessage = `Create a detailed, complete recipe for "${specificRecipe}"${mealType ? ` (${mealType})` : ''}.

Please provide:
1. Full ingredients list with exact amounts
2. Step-by-step cooking instructions (clear and detailed)
3. Complete nutrition information
4. A shopping list for all ingredients needed
5. Health benefits specific to my dietary needs
6. Any relevant warnings or modifications

Make this recipe practical, delicious, and tailored to my specific health profile and dietary restrictions.`;
    } else {
      // Standard meal plan generation
      userMessage = `Generate ${mealCount || 3} meal ideas using these available ingredients:

${ingredients}

${mealTypes?.length ? `Preferred meal types: ${mealTypes.join(', ')}` : 'Include a mix of breakfast, lunch, dinner options.'}`;
    }

    if (userProfile?.feeding_stage || userProfile?.baby_ages?.length > 0) {
      userMessage += `\n\n👶 IMPORTANT: This family has a baby/toddler. Please include baby-friendly meal options or modifications where possible.`;
    }

    if (preferences?.calorieTarget) {
      userMessage += `\n\nTarget approximately ${preferences.calorieTarget} calories per meal.`;
    }
    if (preferences?.proteinTarget) {
      userMessage += `\nTarget approximately ${preferences.proteinTarget}g protein per meal.`;
    }
    if (preferences?.maxPrepTime) {
      userMessage += `\nKeep total time under ${preferences.maxPrepTime} minutes.`;
    }

    if (recallWarnings.length > 0) {
      userMessage += `\n\n⚠️ RECALL ALERT: Some ingredients may be recalled. Avoid: ${recallWarnings.map(w => w.ingredient).join(', ')}. Suggest safe alternatives.`;
    }

    userMessage += `\n\nMake the meals practical, delicious, and safe for my specific health needs. Prioritize using the ingredients I have, and feel free to suggest common pantry staples (salt, pepper, oil, basic spices) as additions. Be creative even with limited ingredients!`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        tools: [mealPlanTool],
        tool_choice: { type: "function", function: { name: "create_meal_plan" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few moments.' }),
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
        JSON.stringify({ error: 'Failed to generate meal plan. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let mealPlan;
    
    if (toolCall?.function?.arguments) {
      try {
        mealPlan = JSON.parse(toolCall.function.arguments);
        console.log('Meal plan generated from tool call with', mealPlan.meals?.length || 0, 'meals');
      } catch (parseError) {
        console.error('Failed to parse tool call arguments:', parseError);
        console.error('Raw arguments:', toolCall.function.arguments);
        return new Response(
          JSON.stringify({ error: 'Failed to parse meal plan response' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fallback: try to extract from content if tool calling didn't work
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            mealPlan = JSON.parse(jsonMatch[0]);
            console.log('Meal plan extracted from content with', mealPlan.meals?.length || 0, 'meals');
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          console.error('Raw content:', content?.substring(0, 500));
          return new Response(
            JSON.stringify({ error: 'Failed to parse meal plan. Please try with different ingredients.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.error('No content or tool calls in AI response:', JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: 'Invalid AI response. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Ensure required fields exist
    if (!mealPlan.meals || !Array.isArray(mealPlan.meals)) {
      mealPlan.meals = [];
    }
    if (!mealPlan.shoppingList) {
      mealPlan.shoppingList = [];
    }
    if (!mealPlan.tips) {
      mealPlan.tips = [];
    }
    
    // Add recall warnings to response
    mealPlan.recallWarnings = recallWarnings;

    return new Response(
      JSON.stringify(mealPlan),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Meal planner error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
