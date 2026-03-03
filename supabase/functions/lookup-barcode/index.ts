import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();
    
    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Looking up barcode:', barcode);

    // Query Open Food Facts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    if (!response.ok) {
      console.error('Open Food Facts API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to lookup product', found: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      console.log('Product not found in database');
      return new Response(
        JSON.stringify({ found: false, barcode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const product = data.product;
    console.log('Product found:', product.product_name);

    // Extract and normalize product data
    const productData = {
      found: true,
      barcode,
      productName: product.product_name || product.product_name_en || 'Unknown Product',
      brand: product.brands || 'Unknown Brand',
      imageUrl: product.image_url || product.image_front_url || null,
      ingredientsText: product.ingredients_text || product.ingredients_text_en || '',
      ingredientsList: product.ingredients || [],
      nutrition: {
        servingSize: product.serving_size || 'Not specified',
        calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
        fat: Math.round((product.nutriments?.fat_100g || 0) * 10) / 10,
        saturatedFat: Math.round((product.nutriments?.['saturated-fat_100g'] || 0) * 10) / 10,
        carbs: Math.round((product.nutriments?.carbohydrates_100g || 0) * 10) / 10,
        sugar: Math.round((product.nutriments?.sugars_100g || 0) * 10) / 10,
        protein: Math.round((product.nutriments?.proteins_100g || 0) * 10) / 10,
        sodium: Math.round(product.nutriments?.sodium_100g * 1000 || 0),
        fiber: Math.round((product.nutriments?.fiber_100g || 0) * 10) / 10,
      },
      nutriscoreGrade: product.nutriscore_grade || null,
      novaGroup: product.nova_group || null,
      categories: product.categories || '',
      allergens: product.allergens || '',
      labels: product.labels || '',
    };

    // Query heavy metals data
    let heavyMetals = null;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: hmData } = await supabase
        .from('product_heavy_metals')
        .select('*')
        .eq('barcode', barcode)
        .order('test_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (hmData) {
        heavyMetals = {
          found: true,
          arsenic: { ppb: hmData.arsenic_ppb, level: hmData.arsenic_level },
          lead: { ppb: hmData.lead_ppb, level: hmData.lead_level },
          cadmium: { ppb: hmData.cadmium_ppb, level: hmData.cadmium_level },
          mercury: { ppb: hmData.mercury_ppb, level: hmData.mercury_level },
          overallVerdict: hmData.overall_verdict,
          confidence: hmData.confidence,
          labSource: hmData.lab_source,
          testDate: hmData.test_date,
          notes: hmData.notes,
        };
      }
    } catch (e) {
      console.error('Heavy metals lookup error:', e);
    }

    return new Response(
      JSON.stringify({ ...productData, heavyMetals }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in lookup-barcode function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', found: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
