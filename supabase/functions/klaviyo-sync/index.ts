import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");
const KLAVIYO_REVISION = "2024-10-15";
const KLAVIYO_BASE_URL = "https://a.klaviyo.com/api";

interface KlaviyoProfile {
  email: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  location?: { city?: string; region?: string; country?: string; ip?: string };
  properties?: Record<string, unknown>;
}

interface KlaviyoEvent {
  metric_name: string;
  profile_email: string;
  properties?: Record<string, unknown>;
  value?: number;
}

interface KlaviyoApiResponse {
  data?: {
    id?: string;
    data?: Array<{ id: string; attributes: { name: string } }>;
  };
  errors?: Array<{ detail: string }>;
}

interface EnrichedProfileData {
  // Basic Info
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone_number?: string;
  
  // Pregnancy/Parenting
  is_pregnant?: boolean;
  is_nursing?: boolean;
  is_new_mom?: boolean;
  due_date?: string;
  baby_count?: number;
  feeding_stage?: string;
  baby_ages?: unknown;
  pregnancy_stage?: string;
  baby_age_months?: number;
  baby_dob?: string;
  trimester?: string;
  lifecycle_stage?: string;
  parenting_concerns?: unknown;
  
  // Newsletter
  newsletter_optin?: boolean;
  
  // Location
  signup_ip?: string;
  signup_location?: Record<string, unknown>;
  
  // Subscription
  subscription_tier?: string;
  subscription_expires_at?: string;
  subscription_status?: string;
  created_at?: string;
  
  // Health Profile
  is_diabetic?: boolean;
  is_gluten_free?: boolean;
  is_dairy_free?: boolean;
  is_vegan?: boolean;
  is_heart_healthy?: boolean;
  has_allergies?: boolean;
  allergies_detailed?: unknown;
  allergy_notes?: string;
  health_conditions?: unknown;
  medications?: unknown;
  
  // Health Condition Booleans
  has_weight_loss_goal?: boolean;
  has_hypertension?: boolean;
  has_high_cholesterol?: boolean;
  has_kidney_disease?: boolean;
  has_ibs?: boolean;
  has_thyroid_condition?: boolean;
  has_gout?: boolean;
  has_autoimmune?: boolean;
  has_celiac_disease?: boolean;
  has_gerd?: boolean;
  has_osteoporosis?: boolean;
  has_liver_disease?: boolean;
  is_cancer_survivor?: boolean;
  
  // Lifestyle/Diet
  diet_type?: string;
  dietary_goals?: string;
  age_group?: string;
  
  // Meal Planning Preferences
  cooking_skill_level?: string;
  max_prep_time_mins?: number;
  daily_calorie_target?: number;
  daily_protein_target?: number;
  budget_preference?: string;
  
  // Engagement
  trial_status?: string;
  trial_expired?: boolean;
  scan_credits_remaining?: number;
  high_intent_user?: boolean;
  high_risk_flag?: boolean;
  onboarding_completed?: boolean;
  wants_recall_sms?: boolean;
  
  // Scan Stats (from DB)
  total_scans_used?: number;
  last_scan_timestamp?: string;
  
  // Scan Stats (computed)
  total_scans?: number;
  avg_health_score?: number;
  last_scan_date?: string;
  recent_scans?: Array<{ product: string; score: number; date: string }>;
  
  // Legal
  legal_optin?: boolean;
  consultation_requested?: boolean;
  
  // Device
  pwa_installed?: boolean;
  device_platform?: string;
}

function getPregnancyStage(profile: EnrichedProfileData): string {
  if (profile.is_pregnant) return "prenatal";
  if (profile.is_nursing || profile.is_new_mom) return "postnatal";
  if (profile.baby_count && profile.baby_count > 0) return "postnatal";
  return "planning";
}

function getSubscriptionStatus(tier?: string, expiresAt?: string): string {
  if (!tier || tier === 'free') return "free_trial";
  if (expiresAt) {
    const expiry = new Date(expiresAt);
    if (expiry < new Date()) return "expired";
  }
  return "active";
}

function getDietaryPreferences(profile: EnrichedProfileData): string[] {
  const prefs: string[] = [];
  if (profile.is_gluten_free) prefs.push("gluten_free");
  if (profile.is_dairy_free) prefs.push("dairy_free");
  if (profile.is_vegan) prefs.push("vegan");
  if (profile.is_diabetic) prefs.push("diabetic");
  if (profile.is_heart_healthy) prefs.push("heart_healthy");
  return prefs;
}

function getHealthConditionsArray(profile: EnrichedProfileData): string[] {
  const conditions: string[] = [];
  if (profile.has_weight_loss_goal) conditions.push("weight_loss_goal");
  if (profile.has_hypertension) conditions.push("hypertension");
  if (profile.has_high_cholesterol) conditions.push("high_cholesterol");
  if (profile.has_kidney_disease) conditions.push("kidney_disease");
  if (profile.has_ibs) conditions.push("ibs");
  if (profile.has_thyroid_condition) conditions.push("thyroid_condition");
  if (profile.has_gout) conditions.push("gout");
  if (profile.has_autoimmune) conditions.push("autoimmune");
  if (profile.has_celiac_disease) conditions.push("celiac_disease");
  if (profile.has_gerd) conditions.push("gerd");
  if (profile.has_osteoporosis) conditions.push("osteoporosis");
  if (profile.has_liver_disease) conditions.push("liver_disease");
  if (profile.is_cancer_survivor) conditions.push("cancer_survivor");
  return conditions;
}

function computeLifecycleStage(profile: EnrichedProfileData): string {
  if (profile.lifecycle_stage) return profile.lifecycle_stage;
  
  if (profile.is_pregnant) {
    if (profile.trimester) return `prenatal_${profile.trimester}_trimester`;
    return "prenatal";
  }
  
  // Compute from baby_dob if available
  if (profile.baby_dob) {
    const dob = new Date(profile.baby_dob);
    const now = new Date();
    const ageMonths = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (ageMonths < 0) return "prenatal"; // Due date hasn't passed
    if (ageMonths <= 3) return "newborn";
    if (ageMonths <= 12) return "infant";
    if (ageMonths <= 36) return "toddler";
    if (ageMonths <= 60) return "preschool";
    return "school_age";
  }
  
  if (profile.baby_age_months !== undefined && profile.baby_age_months !== null) {
    if (profile.baby_age_months <= 3) return "newborn";
    if (profile.baby_age_months <= 12) return "infant";
    if (profile.baby_age_months <= 36) return "toddler";
    if (profile.baby_age_months <= 60) return "preschool";
    return "school_age";
  }
  
  return "planning";
}

function computeBabyAgeMonths(profile: EnrichedProfileData): number | null {
  if (!profile.baby_dob) return profile.baby_age_months ?? null;
  
  const dob = new Date(profile.baby_dob);
  const now = new Date();
  const ageMonths = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return ageMonths >= 0 ? ageMonths : null; // Negative means not born yet
}

function buildKlaviyoProfilePayload(data: EnrichedProfileData): KlaviyoProfile {
  // Ensure phone is in E.164 format
  let phoneNumber = data.phone_number || undefined;
  if (phoneNumber) {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length === 10) {
      phoneNumber = `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      phoneNumber = `+${digits}`;
    } else if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+${digits}`;
    }
  }

  const computedLifecycleStage = computeLifecycleStage(data);
  const computedBabyAge = computeBabyAgeMonths(data);

  // Extract location from signup_location for Klaviyo's top-level location attribute
  const locationData = data.signup_location as { city?: string; region?: string; country?: string; country_name?: string; ip?: string } | undefined;

  return {
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    phone_number: phoneNumber,
    location: locationData ? {
      city: locationData.city,
      region: locationData.region,
      country: locationData.country_name || locationData.country,
      ip: locationData.ip,
    } : undefined,
    properties: {
      // Pregnancy/Parenting Stage
      pregnancy_stage: data.pregnancy_stage || getPregnancyStage(data),
      lifecycle_stage: computedLifecycleStage,
      due_date: data.due_date || null,
      baby_dob: data.baby_dob || null,
      trimester: data.trimester || null,
      baby_count: data.baby_count || 0,
      feeding_stage: data.feeding_stage || null,
      baby_ages: data.baby_ages || null,
      baby_age_months: computedBabyAge,
      parenting_concerns: data.parenting_concerns || null,
      
      // Newsletter
      newsletter_optin: data.newsletter_optin || false,
      
      // Location
      signup_location: data.signup_location || null,
      
      // Subscription & Engagement
      subscription_tier: data.subscription_tier || 'free',
      subscription_status: data.subscription_status || getSubscriptionStatus(data.subscription_tier, data.subscription_expires_at),
      signup_date: data.created_at,
      
      // Scan Activity
      total_scans: data.total_scans || 0,
      total_scans_used: data.total_scans_used || 0,
      avg_health_score: data.avg_health_score || null,
      last_scan_date: data.last_scan_date || null,
      last_scan_timestamp: data.last_scan_timestamp || null,
      recent_scans: data.recent_scans || [],
      
      // Legal
      legal_optin: data.legal_optin || false,
      consultation_requested: data.consultation_requested || false,
      
      // Device/Engagement
      pwa_installed: data.pwa_installed || false,
      device_platform: data.device_platform || 'web',
      
      // Health Profile
      has_allergies: data.has_allergies || false,
      dietary_preferences: getDietaryPreferences(data),
      health_conditions_json: data.health_conditions || null,
      health_conditions_flags: getHealthConditionsArray(data),
      allergies: data.allergies_detailed || null,
      allergy_notes: data.allergy_notes || null,
      medications: data.medications || null,
      
      // Lifestyle/Diet
      diet_type: data.diet_type || null,
      dietary_goals: data.dietary_goals || null,
      age_group: data.age_group || null,
      
      // Meal Planning Preferences
      cooking_skill_level: data.cooking_skill_level || null,
      max_prep_time_mins: data.max_prep_time_mins || null,
      daily_calorie_target: data.daily_calorie_target || null,
      daily_protein_target: data.daily_protein_target || null,
      budget_preference: data.budget_preference || null,
      
      // Engagement/Trial
      trial_status: data.trial_status || null,
      trial_expired: data.trial_expired || false,
      scan_credits_remaining: data.scan_credits_remaining ?? null,
      high_intent_user: data.high_intent_user || false,
      high_risk_flag: data.high_risk_flag || false,
      onboarding_completed: data.onboarding_completed || false,
      wants_recall_sms: data.wants_recall_sms || false,
      
      // Display name for personalization
      display_name: data.display_name || data.first_name || null,
    },
  };
}

async function klaviyoRequest(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<{ data?: KlaviyoApiResponse; error?: string; status: number }> {
  if (!KLAVIYO_API_KEY) {
    return { error: "Klaviyo API key not configured", status: 500 };
  }

  try {
    const response = await fetch(`${KLAVIYO_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
        "revision": KLAVIYO_REVISION,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let responseData: KlaviyoApiResponse;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { data: undefined };
    }

    if (!response.ok) {
      console.error(`Klaviyo API error: ${response.status}`, responseData);
      return { 
        error: responseData?.errors?.[0]?.detail || `API error: ${response.status}`, 
        status: response.status 
      };
    }

    return { data: responseData, status: response.status };
  } catch (err) {
    const error = err as Error;
    console.error("Klaviyo request error:", error);
    return { error: error.message, status: 500 };
  }
}

async function testConnection(): Promise<{ success: boolean; error?: string; account?: unknown }> {
  console.log("[Klaviyo] Testing connection...");
  
  const result = await klaviyoRequest("/accounts/");
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  console.log("[Klaviyo] Connection successful");
  return { success: true, account: result.data };
}

async function syncProfile(profile: KlaviyoProfile): Promise<{ success: boolean; profileId?: string; error?: string }> {
  console.log("[Klaviyo] Syncing profile:", profile.email, "phone:", profile.phone_number || "none", "location:", JSON.stringify(profile.location || null));
  
  // Build attributes with optional top-level location for Klaviyo geo-targeting
  const attributes: Record<string, unknown> = {
    email: profile.email,
    phone_number: profile.phone_number,
    first_name: profile.first_name,
    last_name: profile.last_name,
    properties: profile.properties || {},
  };
  
  if (profile.location && (profile.location.city || profile.location.region || profile.location.country || profile.location.ip)) {
    attributes.location = {
      city: profile.location.city || undefined,
      region: profile.location.region || undefined,
      country: profile.location.country || undefined,
      ip: profile.location.ip || undefined,
    };
  }
  
  const payload = {
    data: {
      type: "profile",
      attributes,
    },
  };

  const result = await klaviyoRequest("/profiles/", "POST", payload);
  
  if (result.error) {
    // Check if profile already exists - try to update instead
    if (result.status === 409) {
      console.log("[Klaviyo] Profile exists, attempting update...");
      // Get profile ID by email and update
      const searchResult = await klaviyoRequest(
        `/profiles/?filter=equals(email,"${encodeURIComponent(profile.email)}")`
      );
      
      const profileData = searchResult.data?.data;
      if (Array.isArray(profileData) && profileData[0]?.id) {
        const profileId = profileData[0].id;
        const updatePayload = {
          data: {
            type: "profile",
            id: profileId,
            attributes: payload.data.attributes,
          },
        };
        const updateResult = await klaviyoRequest(`/profiles/${profileId}/`, "PATCH", updatePayload);
        
        if (updateResult.error) {
          return { success: false, error: updateResult.error };
        }
        
        return { success: true, profileId };
      }
    }
    return { success: false, error: result.error };
  }
  
  console.log("[Klaviyo] Profile synced successfully");
  return { success: true, profileId: result.data?.data?.id as string | undefined };
}

async function syncEnrichedProfile(data: EnrichedProfileData): Promise<{ success: boolean; profileId?: string; error?: string }> {
  const profile = buildKlaviyoProfilePayload(data);
  return syncProfile(profile);
}

async function subscribeToList(email: string, listId: string, phoneNumber?: string): Promise<{ success: boolean; error?: string }> {
  console.log("[Klaviyo] Subscribing to list:", listId, "phone:", phoneNumber ? "provided" : "none");
  
  // Build profile attributes including phone + SMS consent so subscription doesn't strip phone
  const profileAttributes: Record<string, unknown> = {
    email,
    subscriptions: {
      email: {
        marketing: {
          consent: "SUBSCRIBED",
        },
      },
      ...(phoneNumber ? {
        sms: {
          marketing: {
            consent: "SUBSCRIBED",
          },
        },
      } : {}),
    },
  };
  
  // Include phone_number so the subscription payload doesn't overwrite it to null
  if (phoneNumber) {
    profileAttributes.phone_number = phoneNumber;
  }

  // Step 1: Subscribe via bulk create (handles consent/marketing status)
  const subscribePayload = {
    data: {
      type: "profile-subscription-bulk-create-job",
      attributes: {
        profiles: {
          data: [
            {
              type: "profile",
              attributes: profileAttributes,
            },
          ],
        },
      },
      relationships: {
        list: {
          data: {
            type: "list",
            id: listId,
          },
        },
      },
    },
  };

  const subscribeResult = await klaviyoRequest("/profile-subscription-bulk-create-jobs/", "POST", subscribePayload);
  
  if (subscribeResult.error) {
    console.log("[Klaviyo] Subscribe job error, trying direct add:", subscribeResult.error);
  } else {
    console.log("[Klaviyo] Subscribe job accepted");
  }

  // Step 2: Also directly add profile to list via relationships endpoint (ensures membership)
  // First get the profile ID by email
  const searchResult = await klaviyoRequest(
    `/profiles/?filter=equals(email,"${encodeURIComponent(email)}")`
  );
  
  const profileData = searchResult.data?.data;
  if (Array.isArray(profileData) && profileData[0]?.id) {
    const profileId = profileData[0].id;
    
    const addPayload = {
      data: [
        {
          type: "profile",
          id: profileId,
        },
      ],
    };

    const addResult = await klaviyoRequest(`/lists/${listId}/relationships/profiles/`, "POST", addPayload);
    
    if (addResult.error) {
      console.log("[Klaviyo] Direct list add error:", addResult.error);
    } else {
      console.log("[Klaviyo] Profile added to list directly");
    }
  } else {
    console.log("[Klaviyo] Could not find profile to add to list directly");
  }
  
  console.log("[Klaviyo] Subscribed to list successfully");
  return { success: true };
}

async function trackEvent(event: KlaviyoEvent): Promise<{ success: boolean; error?: string }> {
  console.log("[Klaviyo] Tracking event:", event.metric_name);
  
  const payload = {
    data: {
      type: "event",
      attributes: {
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: event.metric_name,
            },
          },
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: event.profile_email,
            },
          },
        },
        properties: event.properties || {},
        value: event.value,
        time: new Date().toISOString(),
      },
    },
  };

  const result = await klaviyoRequest("/events/", "POST", payload);
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  console.log("[Klaviyo] Event tracked successfully");
  return { success: true };
}

async function getLists(): Promise<{ success: boolean; lists?: { id: string; name: string }[]; error?: string }> {
  console.log("[Klaviyo] Fetching lists...");
  
  const result = await klaviyoRequest("/lists/");
  
  if (result.error) {
    return { success: false, error: result.error };
  }
  
  const rawData = result.data?.data;
  const lists: { id: string; name: string }[] = [];
  
  if (Array.isArray(rawData)) {
    for (const list of rawData) {
      if (list.id && list.attributes?.name) {
        lists.push({
          id: list.id,
          name: list.attributes.name,
        });
      }
    }
  }
  
  console.log(`[Klaviyo] Found ${lists.length} lists`);
  return { success: true, lists };
}

async function bulkSyncProfiles(profiles: KlaviyoProfile[]): Promise<{ 
  success: boolean; 
  synced: number; 
  failed: number; 
  errors: string[] 
}> {
  console.log(`[Klaviyo] Bulk syncing ${profiles.length} profiles...`);
  
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];
  
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(profile => syncProfile(profile))
    );
    
    results.forEach((result, index) => {
      if (result.success) {
        synced++;
      } else {
        failed++;
        errors.push(`${batch[index].email}: ${result.error}`);
      }
    });
    
    // Add small delay between batches to respect rate limits
    if (i + batchSize < profiles.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[Klaviyo] Bulk sync complete: ${synced} synced, ${failed} failed`);
  return { success: failed === 0, synced, failed, errors };
}

async function bulkSyncEnrichedProfiles(profiles: EnrichedProfileData[]): Promise<{ 
  success: boolean; 
  synced: number; 
  failed: number; 
  errors: string[] 
}> {
  console.log(`[Klaviyo] Bulk syncing ${profiles.length} enriched profiles...`);
  
  const klaviyoProfiles = profiles.map(p => buildKlaviyoProfilePayload(p));
  return bulkSyncProfiles(klaviyoProfiles);
}

async function fetchFullUserData(userId: string): Promise<EnrichedProfileData | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("[Klaviyo] Error fetching profile:", profileError);
    return null;
  }

  // Fetch scan stats
  const { data: scanStats } = await supabase
    .from("scan_history")
    .select("product_name, health_score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const totalScans = scanStats?.length || 0;
  const avgHealthScore = totalScans > 0 
    ? Math.round(scanStats!.reduce((sum, s) => sum + (s.health_score || 0), 0) / totalScans)
    : null;
  const lastScanDate = scanStats?.[0]?.created_at || null;
  const recentScans = (scanStats || []).slice(0, 5).map(s => ({
    product: s.product_name,
    score: s.health_score || 0,
    date: s.created_at.split('T')[0],
  }));

  // Fetch legal lead status
  const { data: legalLead } = await supabase
    .from("legal_leads")
    .select("consent_given, consultation_requested")
    .eq("user_id", userId)
    .maybeSingle();

  // Fetch device tokens
  const { data: deviceTokens } = await supabase
    .from("device_tokens")
    .select("platform, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1);

  const pwaInstalled = deviceTokens && deviceTokens.length > 0;
  const devicePlatform = deviceTokens?.[0]?.platform || 'web';

  return {
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    display_name: profile.display_name,
    phone_number: profile.phone_number,
    is_pregnant: profile.is_pregnant,
    is_nursing: profile.is_nursing,
    is_new_mom: profile.is_new_mom,
    due_date: profile.due_date,
    baby_dob: profile.baby_dob,
    trimester: profile.trimester,
    lifecycle_stage: profile.lifecycle_stage,
    baby_count: profile.baby_count,
    feeding_stage: profile.feeding_stage,
    baby_ages: profile.baby_ages,
    pregnancy_stage: profile.pregnancy_stage,
    baby_age_months: profile.baby_age_months,
    parenting_concerns: profile.parenting_concerns,
    newsletter_optin: profile.newsletter_optin,
    signup_ip: profile.signup_ip,
    signup_location: profile.signup_location,
    subscription_tier: profile.subscription_tier,
    subscription_expires_at: profile.subscription_expires_at,
    subscription_status: profile.subscription_status,
    created_at: profile.created_at,
    is_diabetic: profile.is_diabetic,
    is_gluten_free: profile.is_gluten_free,
    is_dairy_free: profile.is_dairy_free,
    is_vegan: profile.is_vegan,
    is_heart_healthy: profile.is_heart_healthy,
    has_allergies: profile.has_allergies,
    allergies_detailed: profile.allergies_detailed,
    allergy_notes: profile.allergy_notes,
    health_conditions: profile.health_conditions,
    medications: profile.medications,
    // Health condition booleans
    has_weight_loss_goal: profile.has_weight_loss_goal,
    has_hypertension: profile.has_hypertension,
    has_high_cholesterol: profile.has_high_cholesterol,
    has_kidney_disease: profile.has_kidney_disease,
    has_ibs: profile.has_ibs,
    has_thyroid_condition: profile.has_thyroid_condition,
    has_gout: profile.has_gout,
    has_autoimmune: profile.has_autoimmune,
    has_celiac_disease: profile.has_celiac_disease,
    has_gerd: profile.has_gerd,
    has_osteoporosis: profile.has_osteoporosis,
    has_liver_disease: profile.has_liver_disease,
    is_cancer_survivor: profile.is_cancer_survivor,
    // Lifestyle/Diet
    diet_type: profile.diet_type,
    dietary_goals: profile.dietary_goals,
    age_group: profile.age_group,
    // Meal planning
    cooking_skill_level: profile.cooking_skill_level,
    max_prep_time_mins: profile.max_prep_time_mins,
    daily_calorie_target: profile.daily_calorie_target,
    daily_protein_target: profile.daily_protein_target,
    budget_preference: profile.budget_preference,
    // Engagement
    trial_status: profile.trial_status,
    trial_expired: profile.trial_expired,
    scan_credits_remaining: profile.scan_credits_remaining,
    high_intent_user: profile.high_intent_user,
    high_risk_flag: profile.high_risk_flag,
    onboarding_completed: profile.onboarding_completed,
    wants_recall_sms: profile.wants_recall_sms,
    // Scan stats from DB
    total_scans_used: profile.total_scans_used,
    last_scan_timestamp: profile.last_scan_timestamp,
    // Computed scan stats
    total_scans: totalScans,
    avg_health_score: avgHealthScore ?? undefined,
    last_scan_date: lastScanDate ?? undefined,
    recent_scans: recentScans,
    legal_optin: legalLead?.consent_given || false,
    consultation_requested: legalLead?.consultation_requested || false,
    pwa_installed: pwaInstalled || false,
    device_platform: devicePlatform || 'web',
  };
}

async function syncUserById(userId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[Klaviyo] Syncing user by ID: ${userId}`);
  
  const userData = await fetchFullUserData(userId);
  
  if (!userData || !userData.email) {
    return { success: false, error: "User not found or has no email" };
  }
  
  const result = await syncEnrichedProfile(userData);
  return result;
}

async function getKlaviyoListSettings(): Promise<Record<string, string>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "klaviyo_lists")
    .maybeSingle();

  if (data?.value) {
    try {
      return JSON.parse(data.value);
    } catch {
      return {};
    }
  }
  return {};
}

async function autoSyncNewUser(
  email: string,
  firstName?: string,
  lastName?: string,
  phoneNumber?: string,
  signupIp?: string,
  signupLocation?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; steps?: Record<string, unknown> }> {
  console.log(`[Klaviyo] Auto-syncing new user: ${email}`);
  const steps: Record<string, unknown> = {};

  // Ensure phone is in E.164 format
  let formattedPhone = phoneNumber || undefined;
  if (formattedPhone) {
    const digits = formattedPhone.replace(/\D/g, '');
    if (digits.length === 10) {
      formattedPhone = `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      formattedPhone = `+${digits}`;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${digits}`;
    }
  }

  // Build location for Klaviyo's top-level location attribute
  const loc = signupLocation as { city?: string; region?: string; country?: string; country_name?: string; ip?: string } | undefined;
  const locationObj = loc ? {
    city: loc.city,
    region: loc.region,
    country: loc.country_name || loc.country,
    ip: loc.ip || signupIp,
  } : signupIp ? { ip: signupIp } : undefined;

  // 1. Create/update profile with phone and location
  const profileResult = await syncProfile({
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: formattedPhone,
    location: locationObj,
    properties: {
      signup_date: new Date().toISOString(),
      signup_source: "web_app",
      subscription_tier: "free",
      subscription_status: "free_trial",
      signup_location: signupLocation || null,
    },
  });
  steps.profile_sync = profileResult;

  // 2. Subscribe to all_users list (pass phone so subscription doesn't strip it)
  const lists = await getKlaviyoListSettings();
  if (lists.all_users) {
    const listResult = await subscribeToList(email, lists.all_users, formattedPhone);
    steps.list_subscribe = listResult;
  } else {
    steps.list_subscribe = { skipped: true, reason: "no all_users list configured" };
  }

  // 3. Track account_created event
  const eventResult = await trackEvent({
    metric_name: "account_created",
    profile_email: email,
    properties: {
      first_name: firstName || "",
      last_name: lastName || "",
      signup_source: "web_app",
    },
  });
  steps.event_track = eventResult;

  const allSuccess = profileResult.success && eventResult.success;
  console.log(`[Klaviyo] Auto-sync complete for ${email}: ${allSuccess ? "success" : "partial failure"}`);
  return { success: allSuccess, steps };
}

async function autoSyncExistingUser(userId: string, newsletterOptin?: boolean): Promise<{ success: boolean; error?: string; steps?: Record<string, unknown> }> {
  console.log(`[Klaviyo] Auto-syncing existing user: ${userId}`);
  const steps: Record<string, unknown> = {};

  // 1. Fetch full user data and sync enriched profile
  const userData = await fetchFullUserData(userId);
  if (!userData || !userData.email) {
    return { success: false, error: "User not found or has no email" };
  }

  const profileResult = await syncEnrichedProfile(userData);
  steps.profile_sync = profileResult;

  // 2. Subscribe to relevant lists based on profile (pass phone to prevent stripping)
  const lists = await getKlaviyoListSettings();
  const userPhone = userData.phone_number || undefined;
  
  if (lists.all_users) {
    const r = await subscribeToList(userData.email, lists.all_users, userPhone);
    steps.list_all_users = r;
  }
  if (lists.parents && (userData.is_pregnant || userData.is_nursing || userData.is_new_mom || (userData.baby_count && userData.baby_count > 0))) {
    const r = await subscribeToList(userData.email, lists.parents, userPhone);
    steps.list_parents = r;
  }
  if (lists.premium_subscribers && userData.subscription_tier && !["free", "basic"].includes(userData.subscription_tier)) {
    const r = await subscribeToList(userData.email, lists.premium_subscribers, userPhone);
    steps.list_premium = r;
  }
  if (lists.sms_subscribers && userData.wants_recall_sms && userData.phone_number) {
    const r = await subscribeToList(userData.email, lists.sms_subscribers, userPhone);
    steps.list_sms = r;
  }
  
  // 3. Subscribe to newsletter list if opted in
  const shouldSubscribeNewsletter = newsletterOptin !== undefined ? newsletterOptin : userData.newsletter_optin;
  if (lists.newsletter && shouldSubscribeNewsletter) {
    const r = await subscribeToList(userData.email, lists.newsletter, userPhone);
    steps.list_newsletter = r;
  }

  console.log(`[Klaviyo] Auto-sync complete for user ${userId}`);
  return { success: profileResult.success, steps };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    console.log(`[Klaviyo] Action: ${action}`);

    let result: { success: boolean; error?: string; [key: string]: unknown };

    switch (action) {
      case "test":
        result = await testConnection();
        break;
        
      case "sync_profile":
        result = await syncProfile(params.profile);
        break;
      
      case "sync_enriched_profile":
        result = await syncEnrichedProfile(params.profile);
        break;
        
      case "sync_user_by_id":
        result = await syncUserById(params.userId);
        break;
        
      case "subscribe_to_list":
        result = await subscribeToList(params.email, params.listId);
        break;
        
      case "track_event":
        result = await trackEvent(params.event);
        break;
        
      case "get_lists":
        result = await getLists();
        break;
        
      case "bulk_sync":
        result = await bulkSyncProfiles(params.profiles);
        break;
        
      case "bulk_sync_enriched":
        result = await bulkSyncEnrichedProfiles(params.profiles);
        break;

      case "auto_sync_new_user":
        result = await autoSyncNewUser(params.email, params.first_name, params.last_name, params.phone_number, params.signup_ip, params.signup_location);
        break;

      case "auto_sync_user":
        result = await autoSyncExistingUser(params.userId, params.newsletter_optin);
        break;
        
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.success === false && result.error ? 400 : 200,
    });
  } catch (err) {
    const error = err as Error;
    console.error("[Klaviyo] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
