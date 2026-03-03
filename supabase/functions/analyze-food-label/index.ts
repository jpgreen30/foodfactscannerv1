import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Structured output schema for tool calling
const analyzeProductTool = {
  type: "function",
  function: {
    name: "return_product_analysis",
    description: "Return the structured food product safety analysis from a label image.",
    parameters: {
      type: "object",
      properties: {
        productName: { type: "string", description: "Product name if visible, or 'Unknown Product'" },
        brand: { type: "string", description: "Brand name if visible, or 'Unknown Brand'" },
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
        },
        heavyMetals: {
          type: "object",
          properties: {
            found: { type: "boolean" },
            arsenic: { type: "object", properties: { ppb: { type: "number" }, level: { type: "string", enum: ["safe", "caution", "avoid"] } }, required: ["level"], additionalProperties: false },
            lead: { type: "object", properties: { ppb: { type: "number" }, level: { type: "string", enum: ["safe", "caution", "avoid"] } }, required: ["level"], additionalProperties: false },
            cadmium: { type: "object", properties: { ppb: { type: "number" }, level: { type: "string", enum: ["safe", "caution", "avoid"] } }, required: ["level"], additionalProperties: false },
            mercury: { type: "object", properties: { ppb: { type: "number" }, level: { type: "string", enum: ["safe", "caution", "avoid"] } }, required: ["level"], additionalProperties: false },
            overallVerdict: { type: "string", enum: ["safe", "caution", "avoid"] },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            notes: { type: "string" }
          },
          required: ["found", "overallVerdict", "confidence"],
          additionalProperties: false
        }
      },
      required: ["productName", "brand", "healthScore", "verdict", "ingredients", "nutrition", "dietaryFlags", "recalls", "personalizedWarnings", "healthierAlternatives"],
      additionalProperties: false
    }
  }
};

const buildSystemPrompt = (userProfile?: any) => {
  let basePrompt = `You are a board-certified pediatric food safety expert specializing in infant and toddler nutrition, with deep expertise in food science and toxicology.

Your task is to analyze a food label image and extract all ingredient and nutrition information, then return a comprehensive health and safety assessment using the provided tool.

Guidelines:
- Extract ALL visible ingredients from the label
- For health score: 80-100 = healthy, 50-79 = caution, 0-49 = avoid
- Be accurate about natural vs synthetic ingredients
- Flag any concerning additives (artificial colors, preservatives with known issues)
- If nutrition facts aren't visible, estimate reasonable values or use 0
- Be evidence-based; don't exaggerate risks
- If you cannot read the label clearly, do your best with what's visible
- ALWAYS suggest 2-4 healthier alternatives that are widely available, in the same category, and avoid the problematic ingredients found
- If product is already very healthy (score 80+), note it's a great choice`;

  if (userProfile) {
    const warnings: string[] = [];
    
    if (userProfile.is_diabetic) warnings.push("USER IS DIABETIC - Flag high sugar content, high glycemic ingredients.");
    if (userProfile.is_pregnant) warnings.push("USER IS PREGNANT - Flag unsafe pregnancy ingredients.");
    if (userProfile.is_heart_healthy) warnings.push("USER HAS HEART CONDITION - Flag high sodium, saturated fat, trans fats.");
    if (userProfile.is_vegan) warnings.push("USER IS VEGAN - Flag animal-derived ingredients.");
    if (userProfile.is_gluten_free) warnings.push("USER REQUIRES GLUTEN-FREE - Flag wheat, barley, rye, hidden gluten.");
    if (userProfile.is_dairy_free) warnings.push("USER IS DAIRY-FREE - Flag milk, whey, casein, lactose.");

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
          warnings.push("- FLAG HONEY, whole nuts/seeds, excessive sodium, added sugars for babies.");
        }
        if (minAge < 6) {
          warnings.push("- CRITICAL: Baby under 6 months - only breast milk/formula recommended.");
        }
      }
      
      if (concerns.includes("heavy_metals")) warnings.push("PRIORITY: HEAVY METALS - Flag arsenic, lead, cadmium, mercury concerns.");
      if (concerns.includes("pesticides")) warnings.push("PRIORITY: PESTICIDES - Flag non-organic products.");
      if (concerns.includes("artificial_additives")) warnings.push("PRIORITY: ARTIFICIAL ADDITIVES - Flag ALL artificial colors, flavors, preservatives.");
      if (concerns.includes("hidden_sugars")) warnings.push("PRIORITY: HIDDEN SUGARS - Flag ANY added sugars.");
      
      if (feedingStage === "breastfeeding" || feedingStage === "combination") {
        warnings.push("Mom is breastfeeding - flag caffeine, alcohol, foods affecting baby through breast milk.");
      }
    }

    if (userProfile.health_conditions?.length > 0) {
      userProfile.health_conditions.forEach((condition: string) => {
        switch (condition) {
          case "hypertension": warnings.push("USER HAS HYPERTENSION - Flag high sodium."); break;
          case "cholesterol": warnings.push("USER HAS HIGH CHOLESTEROL - Flag saturated/trans fats."); break;
          case "kidney_disease": warnings.push("USER HAS KIDNEY DISEASE - Flag potassium, phosphorus, sodium."); break;
          case "ibs": warnings.push("USER HAS IBS - Flag high FODMAP ingredients."); break;
          case "gout": warnings.push("USER HAS GOUT - Flag high purine ingredients."); break;
        }
      });
    }

    if (userProfile.allergies_detailed?.items?.length > 0) {
      const allergens = userProfile.allergies_detailed.items.join(", ");
      warnings.push(`USER HAS ALLERGIES: ${allergens}. Flag presence including hidden sources and cross-contamination.`);
    }

    if (userProfile.age_group === "child") warnings.push("USER IS A CHILD (2-12) - Flag excessive sugar, artificial colors, caffeine.");
    else if (userProfile.age_group === "senior") warnings.push("USER IS A SENIOR (65+) - Consider digestibility, medication interactions.");

    if (warnings.length > 0) {
      basePrompt += `\n\nPERSONALIZED WARNINGS FOR THIS USER:\n${warnings.join("\n")}\n\nInclude specific warnings in personalizedWarnings.`;
    }
  }

  return basePrompt;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { imageData, userProfile } = requestData;
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
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
    console.log('Analyzing food label image | Queue:', isPremiumQueue ? 'PRIORITY' : 'standard', '| Model:', aiModel);

    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const systemPrompt = buildSystemPrompt(userProfile);

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
          { 
            role: 'user', 
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
              },
              {
                type: 'text',
                text: `Analyze this food label image and extract all ingredient and nutrition information. Provide a comprehensive health and safety assessment.${userProfile ? ' Include personalized warnings based on the user profile.' : ''}`
              }
            ]
          }
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
        JSON.stringify({ error: 'Failed to analyze image' }),
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

    // Fallback: try content field
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      let jsonString = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonString = jsonMatch[1].trim();

      try {
        const analysisResult = JSON.parse(jsonString);
        console.log('Analysis complete (fallback) for:', analysisResult.productName);
        return new Response(
          JSON.stringify({ success: true, data: analysisResult }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
      }
    }

    console.error('No valid response from AI');
    return new Response(
      JSON.stringify({ error: 'Failed to parse analysis results' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-food-label function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
