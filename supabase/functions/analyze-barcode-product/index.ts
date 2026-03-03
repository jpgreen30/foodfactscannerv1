import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface HealthContext {
  hasData: boolean;
  metrics: {
    avgHeartRate?: number;
    lastBloodPressure?: { systolic: number; diastolic: number };
    avgStepsPerDay?: number;
    avgSleepHours?: number;
  };
  riskIndicators: {
    elevatedHeartRate: boolean;
    highBloodPressure: boolean;
    lowActivity: boolean;
    poorSleep: boolean;
  };
  warnings: string[];
}

// Structured output schema for tool calling
const analyzeProductTool = {
  type: "function",
  function: {
    name: "return_product_analysis",
    description: "Return the structured food product safety analysis.",
    parameters: {
      type: "object",
      properties: {
        productName: { type: "string", description: "Product name" },
        brand: { type: "string", description: "Brand name" },
        healthScore: { type: "number", description: "Health score 0-100. 80-100=healthy, 50-79=caution, 0-49=avoid" },
        verdict: { type: "string", enum: ["healthy", "caution", "avoid"] },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              definition: { type: "string", description: "Brief plain-language explanation" },
              purpose: { type: "string", description: "Why this ingredient is used" },
              isNatural: { type: "boolean" },
              riskLevel: { type: "string", enum: ["safe", "low", "moderate", "high"] },
              healthConcerns: { type: "array", items: { type: "string" } },
              regulatoryStatus: { type: "string", description: "FDA status" },
              iarcClassification: { type: "string", description: "IARC classification if applicable, or null" }
            },
            required: ["name", "definition", "purpose", "isNatural", "riskLevel", "healthConcerns", "regulatoryStatus"],
            additionalProperties: false
          }
        },
        nutrition: {
          type: "object",
          properties: {
            servingSize: { type: "string" },
            calories: { type: "number" },
            fat: { type: "number" },
            saturatedFat: { type: "number" },
            carbs: { type: "number" },
            sugar: { type: "number" },
            protein: { type: "number" },
            sodium: { type: "number" },
            fiber: { type: "number" }
          },
          required: ["servingSize", "calories", "fat", "saturatedFat", "carbs", "sugar", "protein", "sodium", "fiber"],
          additionalProperties: false
        },
        dietaryFlags: {
          type: "object",
          properties: {
            vegan: { type: "boolean" },
            glutenFree: { type: "boolean" },
            dairyFree: { type: "boolean" },
            pregnancySafe: { type: "boolean" },
            heartHealthy: { type: "boolean" },
            diabeticFriendly: { type: "boolean" }
          },
          required: ["vegan", "glutenFree", "dairyFree", "pregnancySafe", "heartHealthy", "diabeticFriendly"],
          additionalProperties: false
        },
        recalls: {
          type: "object",
          properties: {
            hasRecall: { type: "boolean" },
            reason: { type: "string" },
            severity: { type: "string" },
            action: { type: "string" }
          },
          required: ["hasRecall"],
          additionalProperties: false
        },
        personalizedWarnings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["allergy", "health", "dietary", "baby_safety", "medication_interaction"] },
              severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
              ingredient: { type: "string", description: "Ingredient name or null" },
              message: { type: "string", description: "Clear warning message for the user" }
            },
            required: ["type", "severity", "message"],
            additionalProperties: false
          }
        },
        healthierAlternatives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              brand: { type: "string" },
              reason: { type: "string", description: "Why this is healthier (1-2 sentences)" },
              estimatedScore: { type: "number" },
              keyBenefits: { type: "array", items: { type: "string" } }
            },
            required: ["name", "brand", "reason", "estimatedScore", "keyBenefits"],
            additionalProperties: false
          }
        }
      },
      required: ["productName", "brand", "healthScore", "verdict", "ingredients", "nutrition", "dietaryFlags", "recalls", "personalizedWarnings", "healthierAlternatives"],
      additionalProperties: false
    }
  }
};

const buildSystemPrompt = (userProfile?: any, healthContext?: HealthContext) => {
  let basePrompt = `You are a board-certified pediatric food safety expert specializing in infant and toddler nutrition, with deep expertise in food science and toxicology.

Your task is to analyze a food product given its name, ingredient list, optional baby age, and country context, and return a comprehensive health and safety assessment using the provided tool.

Guidelines:
- Analyze EACH ingredient from the ingredients list
- For health score: 80-100 = healthy, 50-79 = caution, 0-49 = avoid
- Consider the Nutri-Score if provided (A=excellent, E=poor)
- Consider NOVA group if provided (1=unprocessed, 4=ultra-processed)
- Be evidence-based; don't exaggerate risks
- Flag artificial additives, excessive sugar, and concerning preservatives
- ALWAYS suggest 2-4 healthier alternatives that are widely available, in the same category, and avoid the problematic ingredients found
- If product is already very healthy (score 80+), note it's a great choice
- If ingredients are unavailable or limited, make reasonable evidence-based assumptions based on the product name and category. Never refuse to analyze.
- Apply regulatory standards based on the country provided (default: USA/FDA)`;

  // Add personalized warnings based on user profile
  if (userProfile) {
    const warnings: string[] = [];
    
    if (userProfile.is_diabetic) {
      warnings.push("USER IS DIABETIC - Flag any high sugar content (>5g per serving), high glycemic ingredients, added sugars, and hidden sugars.");
    }
    if (userProfile.is_pregnant) {
      warnings.push("USER IS PREGNANT - Flag unsafe ingredients for pregnancy: raw/undercooked, high mercury fish, excessive caffeine, nitrates, artificial sweeteners, unpasteurized products.");
    }
    if (userProfile.is_heart_healthy) {
      warnings.push("USER HAS HEART CONDITION - Flag high sodium (>400mg/serving), high saturated fat, trans fats, cholesterol.");
    }
    if (userProfile.is_vegan) {
      warnings.push("USER IS VEGAN - Flag animal-derived ingredients including hidden ones like gelatin, casein, whey, carmine, shellac.");
    }
    if (userProfile.is_gluten_free) {
      warnings.push("USER REQUIRES GLUTEN-FREE - Flag wheat, barley, rye, hidden gluten sources, cross-contamination risks.");
    }
    if (userProfile.is_dairy_free) {
      warnings.push("USER IS DAIRY-FREE - Flag milk, cheese, butter, cream, whey, casein, lactose, hidden dairy.");
    }

    // Baby-specific warnings
    if (userProfile.is_new_mom || userProfile.is_nursing) {
      const babyAges = userProfile.baby_ages || [];
      const feedingStage = userProfile.feeding_stage || "unknown";
      const concerns = userProfile.parenting_concerns || [];
      
      if (babyAges.length > 0) {
        const ageDescriptions = babyAges.map((age: number) => {
          if (age <= 6) return `${age} months (infant)`;
          if (age <= 12) return `${age} months (baby)`;
          return `${age} months (toddler)`;
        }).join(", ");
        
        warnings.push(`USER IS FEEDING BABY/TODDLER - Ages: ${ageDescriptions}. Apply strict baby food safety standards.`);
        
        const minAge = Math.min(...babyAges);
        if (minAge < 12) {
          warnings.push("- FLAG HONEY (botulism risk for babies under 12 months)");
          warnings.push("- FLAG whole nuts and seeds (choking hazard)");
          warnings.push("- FLAG excessive sodium (babies need <50mg per serving)");
          warnings.push("- FLAG added sugars (should be 0g for babies)");
        }
        if (minAge < 6) {
          warnings.push("- CRITICAL: Baby under 6 months - only breast milk/formula recommended.");
        }
      }
      
      if (concerns.includes("heavy_metals")) {
        warnings.push("PRIORITY: HEAVY METALS - Flag arsenic in rice, lead in root vegetables, cadmium, mercury.");
      }
      if (concerns.includes("pesticides")) {
        warnings.push("PRIORITY: PESTICIDES - Flag non-organic products and pesticide residue concerns.");
      }
      if (concerns.includes("bpa")) {
        warnings.push("PRIORITY: BPA/PLASTICS - Flag packaging concerns, BPA risks.");
      }
      if (concerns.includes("formula_safety")) {
        warnings.push("PRIORITY: FORMULA SAFETY - Check for formula recalls, contamination issues.");
      }
      if (concerns.includes("artificial_additives")) {
        warnings.push("PRIORITY: ARTIFICIAL ADDITIVES - Flag ALL artificial colors (Red 40, Yellow 5, Yellow 6), flavors, synthetic preservatives.");
      }
      if (concerns.includes("hidden_sugars")) {
        warnings.push("PRIORITY: HIDDEN SUGARS - Flag ANY added sugars, concentrated fruit juices as sweeteners.");
      }
      
      if (feedingStage === "breastfeeding" || feedingStage === "combination") {
        warnings.push("Mom is breastfeeding - also flag caffeine, alcohol, strong spices that could affect baby through breast milk.");
      }
      if (feedingStage === "starting_solids") {
        warnings.push("Baby is starting solids - flag common allergens and recommend gradual introduction.");
      }
    }

    // Health conditions
    if (userProfile.health_conditions?.length > 0) {
      userProfile.health_conditions.forEach((condition: string) => {
        switch (condition) {
          case "hypertension": warnings.push("USER HAS HYPERTENSION - Flag high sodium."); break;
          case "cholesterol": warnings.push("USER HAS HIGH CHOLESTEROL - Flag saturated fats, trans fats."); break;
          case "kidney_disease": warnings.push("USER HAS KIDNEY DISEASE - Flag high potassium, phosphorus, sodium."); break;
          case "ibs": warnings.push("USER HAS IBS - Flag high FODMAP ingredients, artificial sweeteners."); break;
          case "gout": warnings.push("USER HAS GOUT - Flag high purine ingredients."); break;
        }
      });
    }

    // Profile boolean flags
    if (userProfile.has_weight_loss_goal) warnings.push("USER HAS WEIGHT LOSS GOALS - Flag high-calorie density, high fat/sugar.");
    if (userProfile.has_hypertension) warnings.push("USER HAS HIGH BLOOD PRESSURE - Flag sodium >400mg/serving.");
    if (userProfile.has_high_cholesterol) warnings.push("USER HAS HIGH CHOLESTEROL - Flag saturated fat >3g/serving, trans fats.");
    if (userProfile.has_kidney_disease) warnings.push("USER HAS KIDNEY DISEASE - Flag high potassium, phosphorus, sodium, protein.");
    if (userProfile.has_ibs) warnings.push("USER HAS IBS - Flag high FODMAP: garlic, onion, wheat, lactose, fructose, sugar alcohols.");
    if (userProfile.has_thyroid_condition) warnings.push("USER HAS THYROID CONDITION - Flag goitrogens, note medication absorption concerns.");
    if (userProfile.has_gout) warnings.push("USER HAS GOUT - Flag high-purine foods, high-fructose corn syrup.");
    if (userProfile.has_autoimmune) warnings.push("USER HAS AUTOIMMUNE CONDITION - Flag inflammatory ingredients.");

    // Allergies
    if (userProfile.allergies_detailed?.items?.length > 0) {
      const allergens = userProfile.allergies_detailed.items.join(", ");
      const severityInfo = Object.entries(userProfile.allergies_detailed.severity || {})
        .map(([allergen, severity]) => `${allergen} (${severity})`)
        .join(", ");
      warnings.push(`USER HAS ALLERGIES: ${allergens}. Severity: ${severityInfo}. Flag presence including hidden sources and cross-contamination.`);
    }

    // Age-specific
    if (userProfile.age_group === "child") {
      warnings.push("USER IS A CHILD (2-12) - Flag excessive sugar, artificial colors, caffeine.");
    } else if (userProfile.age_group === "senior") {
      warnings.push("USER IS A SENIOR (65+) - Consider digestibility, medication interactions, nutrient density.");
    }

    // Medications
    if (userProfile.medications?.length > 0) {
      const meds = userProfile.medications.map((m: any) => m.name || m).join(", ");
      warnings.push(`USER IS TAKING MEDICATIONS: ${meds}. Check for food-drug interactions (grapefruit→statins, vitamin K→warfarin, tyramine→MAOIs, caffeine→stimulants, etc.). Add detected interactions to personalizedWarnings with type 'medication_interaction'.`);
    }

    if (warnings.length > 0) {
      basePrompt += `\n\nPERSONALIZED WARNINGS FOR THIS USER:\n${warnings.join("\n")}\n\nInclude specific warnings in personalizedWarnings.`;
    }
  }

  // Health context from smartwatch
  if (healthContext?.hasData && healthContext.warnings?.length > 0) {
    basePrompt += `\n\nSMARTWATCH HEALTH DATA:\n${healthContext.warnings.join("\n")}`;
    if (healthContext.metrics.avgHeartRate) basePrompt += `\nAvg heart rate: ${healthContext.metrics.avgHeartRate} bpm`;
    if (healthContext.metrics.lastBloodPressure) basePrompt += `\nBlood pressure: ${healthContext.metrics.lastBloodPressure.systolic}/${healthContext.metrics.lastBloodPressure.diastolic} mmHg`;
    if (healthContext.metrics.avgStepsPerDay) basePrompt += `\nAvg daily steps: ${healthContext.metrics.avgStepsPerDay}`;
    if (healthContext.metrics.avgSleepHours) basePrompt += `\nAvg sleep: ${healthContext.metrics.avgSleepHours} hours`;
  }

  return basePrompt;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { productData, userProfile } = typeof requestData.productData !== 'undefined' 
      ? requestData 
      : { productData: requestData, userProfile: null };
    
    if (!productData || !productData.productName) {
      return new Response(
        JSON.stringify({ error: 'Product data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Priority queue: Premium/Annual users get the Pro model (faster, higher quality)
    const subscriptionTier = userProfile?.subscription_tier || 'free';
    const isPremiumQueue = subscriptionTier === 'premium' || subscriptionTier === 'annual';
    const aiModel = isPremiumQueue ? 'google/gemini-3-pro-preview' : 'google/gemini-3-flash-preview';
    console.log('Analyzing product:', productData.productName, '| Queue:', isPremiumQueue ? 'PRIORITY' : 'standard', '| Model:', aiModel);

    // Fetch health context from smartwatch data if user is authenticated
    let healthContext: HealthContext | undefined;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } }
        });

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('health_sync_enabled')
            .eq('id', user.id)
            .single();

          // Fetch active medications
          const { data: medications } = await supabase
            .from('medication_reminders')
            .select('medication_name, dosage')
            .eq('user_id', user.id)
            .eq('is_active', true);

          if (medications && medications.length > 0 && userProfile) {
            userProfile.medications = medications.map(m => ({
              name: m.medication_name,
              dosage: m.dosage
            }));
            console.log('Found', medications.length, 'active medications');
          }

          if (profile?.health_sync_enabled) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: metrics } = await supabase
              .from('health_metrics')
              .select('*')
              .eq('user_id', user.id)
              .gte('recorded_at', sevenDaysAgo.toISOString())
              .order('recorded_at', { ascending: false });

            if (metrics && metrics.length > 0) {
              const heartRateMetrics = metrics.filter(m => m.metric_type === 'heart_rate');
              const bpMetrics = metrics.filter(m => m.metric_type === 'blood_pressure');
              const stepMetrics = metrics.filter(m => m.metric_type === 'steps');
              const sleepMetrics = metrics.filter(m => m.metric_type === 'sleep');

              const avgHeartRate = heartRateMetrics.length > 0
                ? Math.round(heartRateMetrics.reduce((sum, m) => sum + Number(m.value), 0) / heartRateMetrics.length)
                : undefined;
              const lastBp = bpMetrics[0];
              const lastBloodPressure = lastBp
                ? { systolic: Number(lastBp.value), diastolic: Number(lastBp.secondary_value) || 0 }
                : undefined;
              const avgStepsPerDay = stepMetrics.length > 0
                ? Math.round(stepMetrics.reduce((sum, m) => sum + Number(m.value), 0) / stepMetrics.length)
                : undefined;
              const avgSleepHours = sleepMetrics.length > 0
                ? Math.round(sleepMetrics.reduce((sum, m) => sum + Number(m.value), 0) / sleepMetrics.length * 10) / 10
                : undefined;

              const elevatedHeartRate = avgHeartRate ? avgHeartRate > 100 : false;
              const highBloodPressure = lastBloodPressure 
                ? lastBloodPressure.systolic > 140 || lastBloodPressure.diastolic > 90 : false;
              const lowActivity = avgStepsPerDay !== undefined && avgStepsPerDay < 3000;
              const poorSleep = avgSleepHours !== undefined && avgSleepHours < 6;

              const warnings: string[] = [];
              if (elevatedHeartRate) warnings.push(`USER HAS ELEVATED HEART RATE (avg ${avgHeartRate} bpm) - Flag stimulants and high-sodium foods.`);
              if (highBloodPressure) warnings.push(`USER HAS HIGH BLOOD PRESSURE (${lastBloodPressure?.systolic}/${lastBloodPressure?.diastolic} mmHg) - Strongly flag high sodium.`);
              if (lowActivity) warnings.push(`USER HAS LOW ACTIVITY (${avgStepsPerDay} steps/day) - Recommend lighter, lower-calorie options.`);
              if (poorSleep) warnings.push(`USER HAS POOR SLEEP (${avgSleepHours}h avg) - Flag caffeine and high sugar.`);

              healthContext = {
                hasData: true,
                metrics: { avgHeartRate, lastBloodPressure, avgStepsPerDay, avgSleepHours },
                riskIndicators: { elevatedHeartRate, highBloodPressure, lowActivity, poorSleep },
                warnings
              };
              console.log('Including health context from smartwatch data');
            }
          }
        }
      } catch (healthError) {
        console.error('Error fetching health context:', healthError);
      }
    }

    const systemPrompt = buildSystemPrompt(userProfile, healthContext);

    // Build structured user message with product name, ingredients, baby age, and country
    const babyAge = productData.babyAgeMonths || userProfile?.baby_age_months || null;
    const country = productData.country || "USA";

    const userMessage = `Analyze this product:

Product Name: ${productData.productName}
Brand: ${productData.brand || 'Unknown'}
Ingredients: ${productData.ingredientsText || 'Not available'}
${productData.ingredientsList?.length ? `Ingredients List: ${JSON.stringify(productData.ingredientsList)}` : ''}
Nutri-Score: ${productData.nutriscoreGrade || 'Not available'}
NOVA Group: ${productData.novaGroup || 'Not available'}
Categories: ${productData.categories || 'Not available'}
Allergens: ${productData.allergens || 'None listed'}
Labels: ${productData.labels || 'None'}
Baby Age: ${babyAge ? `${babyAge} months` : 'Not specified'}
Country: ${country}

Nutrition per 100g:
- Calories: ${productData.nutrition?.calories || 0} kcal
- Fat: ${productData.nutrition?.fat || 0}g
- Saturated Fat: ${productData.nutrition?.saturatedFat || 0}g
- Carbohydrates: ${productData.nutrition?.carbs || 0}g
- Sugar: ${productData.nutrition?.sugar || 0}g
- Protein: ${productData.nutrition?.protein || 0}g
- Sodium: ${productData.nutrition?.sodium || 0}mg
- Fiber: ${productData.nutrition?.fiber || 0}g

Provide a comprehensive health and safety assessment.${userProfile ? ' Include personalized warnings based on the user profile.' : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        tools: [analyzeProductTool],
        tool_choice: { type: "function", function: { name: "return_product_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Service is busy. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze product' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract structured data from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        const analysisResult = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        console.log('Analysis complete (structured) for:', analysisResult.productName);
        
        return new Response(
          JSON.stringify({ success: true, data: analysisResult }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse tool call arguments:', parseError);
      }
    }

    // Fallback: try content field (in case model didn't use tool calling)
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      let jsonString = content.trim();
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonString = jsonMatch[1].trim();
      const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) jsonString = jsonObjectMatch[0];

      try {
        const analysisResult = JSON.parse(jsonString);
        console.log('Analysis complete (fallback parse) for:', analysisResult.productName);
        return new Response(
          JSON.stringify({ success: true, data: analysisResult }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse fallback content:', parseError);
      }
    }

    // Final fallback
    console.error('No valid response from AI. Raw:', JSON.stringify(data).substring(0, 500));
    const fallbackResult = {
      productName: productData.productName || 'Unknown Product',
      brand: productData.brand || 'Unknown Brand',
      healthScore: 50,
      verdict: 'caution',
      ingredients: [],
      nutrition: productData.nutrition || {
        servingSize: 'N/A', calories: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, protein: 0, sodium: 0, fiber: 0
      },
      dietaryFlags: { vegan: false, glutenFree: false, dairyFree: false, pregnancySafe: true, heartHealthy: false, diabeticFriendly: false },
      recalls: { hasRecall: false, reason: null, severity: null, action: null },
      personalizedWarnings: [],
      healthierAlternatives: [],
      analysisNote: 'Analysis was limited. Please verify ingredients manually.'
    };
    
    return new Response(
      JSON.stringify({ success: true, data: fallbackResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-barcode-product function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
