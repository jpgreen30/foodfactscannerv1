import { supabase } from "@/integrations/supabase/client";

export type KlaviyoEventType = 
  | 'account_created'
  | 'product_scanned'
  | 'subscription_upgraded'
  | 'recall_alert_received'
  | 'symptom_reported'
  | 'profile_updated'
  | 'legal_optin'
  | 'low_credit'
  | 'upgrade_required';

interface KlaviyoProfile {
  email: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  properties?: Record<string, unknown>;
}

interface KlaviyoEvent {
  metric_name: string;
  profile_email: string;
  properties?: Record<string, unknown>;
  value?: number;
}

interface KlaviyoSettings {
  enabled: boolean;
  enabledEvents: KlaviyoEventType[];
  lists: {
    all_users?: string;
    premium_subscribers?: string;
    recall_alerts?: string;
    sms_subscribers?: string;
    parents?: string;
    legal_optins?: string;
  };
}

export interface EnrichedProfileData {
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
  parenting_concerns?: unknown;
  
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

// Cache for settings to avoid repeated DB calls
let settingsCache: KlaviyoSettings | null = null;
let settingsCacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

async function getKlaviyoSettings(): Promise<KlaviyoSettings> {
  const now = Date.now();
  
  if (settingsCache && (now - settingsCacheTime) < CACHE_TTL) {
    return settingsCache;
  }

  const { data: enabledData } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "klaviyo_enabled")
    .maybeSingle();

  const { data: eventsData } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "klaviyo_enabled_events")
    .maybeSingle();

  const { data: listsData } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "klaviyo_lists")
    .maybeSingle();

  settingsCache = {
    enabled: enabledData?.value === 'true',
    enabledEvents: eventsData?.value ? JSON.parse(eventsData.value) : [],
    lists: listsData?.value ? JSON.parse(listsData.value) : {},
  };
  settingsCacheTime = now;

  return settingsCache;
}

export function clearKlaviyoSettingsCache(): void {
  settingsCache = null;
  settingsCacheTime = 0;
}

async function invokeKlaviyoFunction(action: string, params: Record<string, unknown> = {}): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("klaviyo-sync", {
      body: { action, ...params },
    });

    if (error) {
      console.error(`[Klaviyo] Function error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error(`[Klaviyo] Request error:`, err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Helper to calculate pregnancy stage
function getPregnancyStage(profile: Partial<EnrichedProfileData>): string {
  if (profile.is_pregnant) return "prenatal";
  if (profile.is_nursing || profile.is_new_mom) return "postnatal";
  if (profile.baby_count && profile.baby_count > 0) return "postnatal";
  return "planning";
}

// Helper to get subscription status
function getSubscriptionStatus(tier?: string, expiresAt?: string): string {
  if (!tier || tier === 'free') return "free_trial";
  if (expiresAt) {
    const expiry = new Date(expiresAt);
    if (expiry < new Date()) return "expired";
  }
  return "active";
}

// Helper to get dietary preferences
function getDietaryPreferences(profile: Partial<EnrichedProfileData>): string[] {
  const prefs: string[] = [];
  if (profile.is_gluten_free) prefs.push("gluten_free");
  if (profile.is_dairy_free) prefs.push("dairy_free");
  if (profile.is_vegan) prefs.push("vegan");
  if (profile.is_diabetic) prefs.push("diabetic");
  if (profile.is_heart_healthy) prefs.push("heart_healthy");
  return prefs;
}

// Helper to get active health conditions as an array
function getHealthConditionsArray(profile: Partial<EnrichedProfileData>): string[] {
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

// Build enriched Klaviyo profile payload
export function buildEnrichedKlaviyoProfile(data: EnrichedProfileData): KlaviyoProfile {
  return {
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    phone_number: data.phone_number,
    properties: {
      // Pregnancy/Parenting Stage
      pregnancy_stage: data.pregnancy_stage || getPregnancyStage(data),
      due_date: data.due_date || null,
      baby_count: data.baby_count || 0,
      feeding_stage: data.feeding_stage || null,
      baby_ages: data.baby_ages || null,
      baby_age_months: data.baby_age_months || null,
      parenting_concerns: data.parenting_concerns || null,
      
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

export async function syncProfileToKlaviyo(profile: KlaviyoProfile): Promise<boolean> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled) {
    console.log("[Klaviyo] Integration disabled, skipping profile sync");
    return false;
  }

  const result = await invokeKlaviyoFunction("sync_profile", { profile });
  return result.success;
}

export async function syncEnrichedProfileToKlaviyo(profile: EnrichedProfileData): Promise<boolean> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled) {
    console.log("[Klaviyo] Integration disabled, skipping enriched profile sync");
    return false;
  }

  const result = await invokeKlaviyoFunction("sync_enriched_profile", { profile });
  return result.success;
}

export async function syncUserByIdToKlaviyo(userId: string): Promise<boolean> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled) {
    console.log("[Klaviyo] Integration disabled, skipping user sync");
    return false;
  }

  const result = await invokeKlaviyoFunction("sync_user_by_id", { userId });
  return result.success;
}

export async function subscribeToKlaviyoList(email: string, listId: string): Promise<boolean> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled) {
    console.log("[Klaviyo] Integration disabled, skipping list subscription");
    return false;
  }

  const result = await invokeKlaviyoFunction("subscribe_to_list", { email, listId });
  return result.success;
}

export async function trackKlaviyoEvent(event: KlaviyoEvent): Promise<boolean> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled) {
    console.log("[Klaviyo] Integration disabled, skipping event tracking");
    return false;
  }

  const result = await invokeKlaviyoFunction("track_event", { event });
  return result.success;
}

// Fetch user's enriched data from the database
export async function fetchUserEnrichedData(userId: string): Promise<EnrichedProfileData | null> {
  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.email) {
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
    : undefined;
  const lastScanDate = scanStats?.[0]?.created_at || undefined;
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
    first_name: profile.first_name || undefined,
    last_name: profile.last_name || undefined,
    display_name: profile.display_name || undefined,
    phone_number: profile.phone_number || undefined,
    is_pregnant: profile.is_pregnant || false,
    is_nursing: profile.is_nursing || false,
    is_new_mom: profile.is_new_mom || false,
    due_date: profile.due_date || undefined,
    baby_count: profile.baby_count || 0,
    feeding_stage: profile.feeding_stage || undefined,
    baby_ages: profile.baby_ages,
    pregnancy_stage: profile.pregnancy_stage || undefined,
    baby_age_months: profile.baby_age_months || undefined,
    parenting_concerns: profile.parenting_concerns,
    subscription_tier: profile.subscription_tier || undefined,
    subscription_expires_at: profile.subscription_expires_at || undefined,
    subscription_status: profile.subscription_status || undefined,
    created_at: profile.created_at,
    is_diabetic: profile.is_diabetic || false,
    is_gluten_free: profile.is_gluten_free || false,
    is_dairy_free: profile.is_dairy_free || false,
    is_vegan: profile.is_vegan || false,
    is_heart_healthy: profile.is_heart_healthy || false,
    has_allergies: profile.has_allergies || false,
    allergies_detailed: profile.allergies_detailed,
    allergy_notes: profile.allergy_notes || undefined,
    health_conditions: profile.health_conditions,
    medications: profile.medications,
    // Health condition booleans
    has_weight_loss_goal: profile.has_weight_loss_goal || false,
    has_hypertension: profile.has_hypertension || false,
    has_high_cholesterol: profile.has_high_cholesterol || false,
    has_kidney_disease: profile.has_kidney_disease || false,
    has_ibs: profile.has_ibs || false,
    has_thyroid_condition: profile.has_thyroid_condition || false,
    has_gout: profile.has_gout || false,
    has_autoimmune: profile.has_autoimmune || false,
    has_celiac_disease: profile.has_celiac_disease || false,
    has_gerd: profile.has_gerd || false,
    has_osteoporosis: profile.has_osteoporosis || false,
    has_liver_disease: profile.has_liver_disease || false,
    is_cancer_survivor: profile.is_cancer_survivor || false,
    // Lifestyle/Diet
    diet_type: profile.diet_type || undefined,
    dietary_goals: profile.dietary_goals || undefined,
    age_group: profile.age_group || undefined,
    // Meal planning
    cooking_skill_level: profile.cooking_skill_level || undefined,
    max_prep_time_mins: profile.max_prep_time_mins || undefined,
    daily_calorie_target: profile.daily_calorie_target || undefined,
    daily_protein_target: profile.daily_protein_target || undefined,
    budget_preference: profile.budget_preference || undefined,
    // Engagement
    trial_status: profile.trial_status || undefined,
    trial_expired: profile.trial_expired || false,
    scan_credits_remaining: profile.scan_credits_remaining ?? undefined,
    high_intent_user: profile.high_intent_user || false,
    high_risk_flag: profile.high_risk_flag || false,
    onboarding_completed: profile.onboarding_completed || false,
    wants_recall_sms: profile.wants_recall_sms || false,
    // Scan stats from DB
    total_scans_used: profile.total_scans_used || 0,
    last_scan_timestamp: profile.last_scan_timestamp || undefined,
    // Computed scan stats
    total_scans: totalScans,
    avg_health_score: avgHealthScore,
    last_scan_date: lastScanDate,
    recent_scans: recentScans,
    legal_optin: legalLead?.consent_given || false,
    consultation_requested: legalLead?.consultation_requested || false,
    pwa_installed: pwaInstalled,
    device_platform: devicePlatform,
  };
}

// Convenience functions for specific events
export async function triggerKlaviyoSignup(user: {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  userId?: string;
  is_pregnant?: boolean;
  is_nursing?: boolean;
  is_new_mom?: boolean;
  due_date?: string;
  baby_count?: number;
}): Promise<void> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled || !settings.enabledEvents.includes('account_created')) {
    return;
  }

  console.log("[Klaviyo] Triggering signup event for:", user.email);

  // Build enriched profile data
  const profileData: EnrichedProfileData = {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    phone_number: user.phone_number,
    is_pregnant: user.is_pregnant,
    is_nursing: user.is_nursing,
    is_new_mom: user.is_new_mom,
    due_date: user.due_date,
    baby_count: user.baby_count,
    subscription_tier: 'free',
    created_at: new Date().toISOString(),
    total_scans: 0,
    legal_optin: false,
    pwa_installed: false,
  };

  // Sync enriched profile
  await syncEnrichedProfileToKlaviyo(profileData);

  // Subscribe to all users list
  if (settings.lists.all_users) {
    await subscribeToKlaviyoList(user.email, settings.lists.all_users);
  }

  // Subscribe to parents list if applicable
  if (settings.lists.parents && (user.is_pregnant || user.is_nursing || user.is_new_mom || (user.baby_count && user.baby_count > 0))) {
    await subscribeToKlaviyoList(user.email, settings.lists.parents);
  }

  // Track event
  await trackKlaviyoEvent({
    metric_name: "Created Account",
    profile_email: user.email,
    properties: {
      source: "web_app",
      pregnancy_stage: getPregnancyStage(user),
      has_baby: user.baby_count ? user.baby_count > 0 : false,
    },
  });
}

export async function triggerKlaviyoScan(userEmail: string, scanData: {
  product_name: string;
  health_score: number;
  verdict?: string;
  brand?: string;
}, userId?: string): Promise<void> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled || !settings.enabledEvents.includes('product_scanned')) {
    return;
  }

  console.log("[Klaviyo] Triggering scan event for:", userEmail);

  // Update profile with latest scan stats if we have userId
  if (userId) {
    const enrichedData = await fetchUserEnrichedData(userId);
    if (enrichedData) {
      await syncEnrichedProfileToKlaviyo(enrichedData);
    }
  }

  await trackKlaviyoEvent({
    metric_name: "Product Scanned",
    profile_email: userEmail,
    properties: {
      product_name: scanData.product_name,
      health_score: scanData.health_score,
      verdict: scanData.verdict,
      brand: scanData.brand,
    },
    value: scanData.health_score,
  });
}

export async function triggerKlaviyoUpgrade(userEmail: string, newTier: string, userId?: string): Promise<void> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled || !settings.enabledEvents.includes('subscription_upgraded')) {
    return;
  }

  console.log("[Klaviyo] Triggering upgrade event for:", userEmail);

  // Sync full enriched profile if we have userId
  if (userId) {
    const enrichedData = await fetchUserEnrichedData(userId);
    if (enrichedData) {
      enrichedData.subscription_tier = newTier;
      await syncEnrichedProfileToKlaviyo(enrichedData);
    }
  } else {
    // Fallback to basic profile update
    await syncProfileToKlaviyo({
      email: userEmail,
      properties: {
        subscription_tier: newTier,
        subscription_status: 'active',
        upgraded_at: new Date().toISOString(),
      },
    });
  }

  // Add to premium list if applicable
  if (settings.lists.premium_subscribers && ['basic', 'premium', 'annual'].includes(newTier)) {
    await subscribeToKlaviyoList(userEmail, settings.lists.premium_subscribers);
  }

  await trackKlaviyoEvent({
    metric_name: "Upgraded Subscription",
    profile_email: userEmail,
    properties: {
      new_tier: newTier,
    },
  });
}

export async function triggerKlaviyoRecallAlert(userEmail: string, recallData: {
  product_name: string;
  brand?: string;
  reason: string;
}): Promise<void> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled || !settings.enabledEvents.includes('recall_alert_received')) {
    return;
  }

  console.log("[Klaviyo] Triggering recall alert event for:", userEmail);

  await trackKlaviyoEvent({
    metric_name: "Recall Alert Received",
    profile_email: userEmail,
    properties: {
      product_name: recallData.product_name,
      brand: recallData.brand,
      reason: recallData.reason,
    },
  });
}

export async function triggerKlaviyoSymptom(userEmail: string, symptomData: {
  symptom: string;
  severity?: string;
  linked_products?: string[];
}): Promise<void> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled || !settings.enabledEvents.includes('symptom_reported')) {
    return;
  }

  console.log("[Klaviyo] Triggering symptom event for:", userEmail);

  await trackKlaviyoEvent({
    metric_name: "Symptom Reported",
    profile_email: userEmail,
    properties: {
      symptom: symptomData.symptom,
      severity: symptomData.severity,
      linked_products: symptomData.linked_products,
    },
  });
}

export async function triggerKlaviyoLegalOptin(userEmail: string, userId?: string): Promise<void> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled || !settings.enabledEvents.includes('legal_optin')) {
    return;
  }

  console.log("[Klaviyo] Triggering legal opt-in event for:", userEmail);

  // Update profile with legal opt-in status
  if (userId) {
    const enrichedData = await fetchUserEnrichedData(userId);
    if (enrichedData) {
      await syncEnrichedProfileToKlaviyo(enrichedData);
    }
  } else {
    await syncProfileToKlaviyo({
      email: userEmail,
      properties: {
        legal_optin: true,
        legal_optin_date: new Date().toISOString(),
      },
    });
  }

  // Subscribe to legal opt-ins list if available
  if (settings.lists.legal_optins) {
    await subscribeToKlaviyoList(userEmail, settings.lists.legal_optins);
  }

  await trackKlaviyoEvent({
    metric_name: "Legal Consultation Opted In",
    profile_email: userEmail,
    properties: {
      opted_in_at: new Date().toISOString(),
    },
  });
}

export async function triggerKlaviyoProfileUpdate(userEmail: string, userId: string): Promise<void> {
  const settings = await getKlaviyoSettings();
  
  if (!settings.enabled || !settings.enabledEvents.includes('profile_updated')) {
    return;
  }

  console.log("[Klaviyo] Triggering profile update for:", userEmail);

  const enrichedData = await fetchUserEnrichedData(userId);
  if (enrichedData) {
    await syncEnrichedProfileToKlaviyo(enrichedData);
  }

  await trackKlaviyoEvent({
    metric_name: "Profile Updated",
    profile_email: userEmail,
    properties: {
      updated_at: new Date().toISOString(),
    },
  });
}
