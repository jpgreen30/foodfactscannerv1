import { supabase } from "@/integrations/supabase/client";

// Supported event types for Zapier/Make.com integration
export type ZapierEventType = 
  | "user_signup"
  | "product_scan"
  | "subscription_change"
  | "phone_number_submitted"
  | "recall_alert"
  | "health_score_alert"
  | "daily_digest"
  | "push_notification_sent"
  | "push_notification_opened"
  | "device_registered"
  | "legal_lead_submitted"
  | "community_post_created"
  | "community_post_liked"
  | "community_post_commented"
  | "family_profile_created"
  | "symptom_recorded"
  | "health_report_generated"
  | "custom";

export interface ZapierEventData {
  [key: string]: unknown;
}

interface TriggerResult {
  success: boolean;
  message: string;
  event?: string;
  status?: number;
}

/**
 * Trigger a Zapier/Make.com webhook with the specified event and data
 */
export async function triggerZapierWebhook(
  event: ZapierEventType,
  data: ZapierEventData,
  metadata?: {
    source?: string;
    userId?: string;
  }
): Promise<TriggerResult> {
  try {
    console.log(`[Automation] Triggering webhook for event: ${event}`);
    
    const { data: result, error } = await supabase.functions.invoke("trigger-zapier-webhook", {
      body: {
        event,
        data,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) {
      console.error("[Automation] Webhook trigger error:", error);
      return {
        success: false,
        message: error.message || "Failed to trigger webhook",
      };
    }

    console.log("[Automation] Webhook triggered successfully:", result);
    return result as TriggerResult;
  } catch (err) {
    console.error("[Automation] Unexpected error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Trigger webhook for new user signup
 */
export async function triggerUserSignupWebhook(userData: {
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  signup_source?: string;
  campaign?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("user_signup", userData, {
    source: "auth",
    userId: userData.user_id,
  });
}

/**
 * Trigger webhook for product scan
 */
export async function triggerProductScanWebhook(scanData: {
  scan_id?: string;
  user_id: string;
  product_name: string;
  brand?: string;
  barcode?: string;
  health_score?: number;
  verdict?: string;
  dietary_flags?: unknown;
  has_allergens?: boolean;
  recall_status?: string;
  subscription_tier?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("product_scan", scanData, {
    source: "scanner",
    userId: scanData.user_id,
  });
}

/**
 * Trigger webhook for subscription change
 */
export async function triggerSubscriptionChangeWebhook(subscriptionData: {
  user_id: string;
  previous_tier?: string;
  new_tier: string;
  change_type: "upgrade" | "downgrade" | "cancel" | "new";
  effective_date?: string;
  mrr_change?: number;
  currency?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("subscription_change", {
    ...subscriptionData,
    effective_date: subscriptionData.effective_date || new Date().toISOString(),
  }, {
    source: "billing",
    userId: subscriptionData.user_id,
  });
}

/**
 * Trigger webhook for phone number submission
 */
export async function triggerPhoneNumberWebhook(phoneData: {
  user_id: string;
  phone_number: string;
  wants_recall_sms?: boolean;
  phone_verified?: boolean;
  notification_types?: string[];
}): Promise<TriggerResult> {
  return triggerZapierWebhook("phone_number_submitted", phoneData, {
    source: "profile",
    userId: phoneData.user_id,
  });
}

/**
 * Trigger webhook for recall alert
 */
export async function triggerRecallAlertWebhook(recallData: {
  product_name: string;
  brand?: string;
  reason: string;
  action: string;
  severity?: string;
  affected_user_count?: number;
  push_sent?: number;
  sms_sent?: number;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("recall_alert", recallData, {
    source: "admin",
  });
}

/**
 * Trigger webhook for health score alert (dangerous product)
 */
export async function triggerHealthScoreAlertWebhook(alertData: {
  user_id: string;
  product_name: string;
  health_score: number;
  alert_threshold?: number;
  ingredients_of_concern?: string[];
}): Promise<TriggerResult> {
  return triggerZapierWebhook("health_score_alert", {
    ...alertData,
    alert_threshold: alertData.alert_threshold || 30,
  }, {
    source: "scanner",
    userId: alertData.user_id,
  });
}

/**
 * Trigger webhook when push notification is sent
 */
export async function triggerPushNotificationWebhook(notificationData: {
  type: string;
  title: string;
  body: string;
  target_audience?: string;
  users_targeted?: number;
  success_count?: number;
  fail_count?: number;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("push_notification_sent", notificationData, {
    source: "push_notifications",
  });
}

/**
 * Trigger webhook when push notification is opened
 */
export async function triggerPushNotificationOpenedWebhook(openData: {
  notification_id: string;
  user_id: string;
  notification_type: string;
  title: string;
  opened_at: string;
  time_to_open_seconds?: number;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("push_notification_opened", openData, {
    source: "push_notifications",
    userId: openData.user_id,
  });
}

/**
 * Trigger webhook when new device registers for push
 */
export async function triggerDeviceRegisteredWebhook(deviceData: {
  user_id: string;
  device_id?: string;
  platform: string;
  device_name?: string;
  registered_at?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("device_registered", {
    ...deviceData,
    registered_at: deviceData.registered_at || new Date().toISOString(),
  }, {
    source: "push_notifications",
    userId: deviceData.user_id,
  });
}

/**
 * Trigger webhook for legal lead submission - ALL data points included
 */
export async function triggerLegalLeadWebhook(leadData: {
  lead_id: string;
  user_id?: string;
  email?: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  lead_source?: string;
  lead_quality_score?: number;
  lead_category?: string;
  lead_status?: string;
  injury_description?: string;
  symptoms?: unknown[];
  symptom_severity?: string;
  symptom_duration?: string;
  health_conditions?: unknown;
  allergies?: unknown;
  family_affected?: unknown[];
  toxic_products_exposure?: unknown[];
  recalled_products_exposure?: unknown[];
  products_scanned?: unknown[];
  baby_food_concerns?: unknown;
  feeding_method?: string;
  consent_given: boolean;
  consent_timestamp?: string;
  consultation_requested?: boolean;
  consultation_requested_at?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("legal_lead_submitted", leadData, {
    source: "legal_consultation",
    userId: leadData.user_id,
  });
}

/**
 * Trigger webhook when community post is created
 */
export async function triggerCommunityPostCreatedWebhook(postData: {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: string;
  product_name?: string;
  product_barcode?: string;
  health_score?: number;
  verdict?: string;
  created_at?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("community_post_created", postData, {
    source: "community",
    userId: postData.user_id,
  });
}

/**
 * Trigger webhook when community post is liked
 */
export async function triggerCommunityPostLikedWebhook(likeData: {
  post_id: string;
  post_title: string;
  post_author_id: string;
  liker_user_id: string;
  like_count: number;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("community_post_liked", likeData, {
    source: "community",
    userId: likeData.liker_user_id,
  });
}

/**
 * Trigger webhook when community post receives a comment
 */
export async function triggerCommunityPostCommentedWebhook(commentData: {
  comment_id: string;
  post_id: string;
  post_title: string;
  post_author_id: string;
  commenter_user_id: string;
  comment_content: string;
  parent_comment_id?: string;
  comment_count: number;
  created_at?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("community_post_commented", commentData, {
    source: "community",
    userId: commentData.commenter_user_id,
  });
}

/**
 * Trigger webhook when family profile is created
 */
export async function triggerFamilyProfileCreatedWebhook(profileData: {
  profile_id?: string;
  user_id: string;
  name: string;
  relationship?: string;
  age_group?: string;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_dairy_free?: boolean;
  is_diabetic?: boolean;
  is_pregnant?: boolean;
  is_heart_healthy?: boolean;
  allergies_detailed?: string[];
  allergy_notes?: string;
  is_default?: boolean;
  created_at?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("family_profile_created", profileData, {
    source: "family_profiles",
    userId: profileData.user_id,
  });
}

/**
 * Trigger webhook when symptoms are recorded
 */
export async function triggerSymptomRecordedWebhook(symptomData: {
  user_id: string;
  symptoms: Array<{
    symptom: string;
    category?: string;
    severity: string;
    duration: string;
    who_affected?: string;
  }>;
  symptom_count: number;
  overall_severity?: string;
  longest_duration?: string;
  family_affected?: string[];
  linked_products?: Array<{
    product_name: string;
    brand?: string;
    health_score?: number;
  }>;
  created_at?: string;
}): Promise<TriggerResult> {
  return triggerZapierWebhook("symptom_recorded", symptomData, {
    source: "symptom_journal",
    userId: symptomData.user_id,
  });
}

/**
 * Trigger webhook when health report is generated
 */
export async function triggerHealthReportWebhook(reportData: {
  report_id: string;
  user_id: string;
  report_type: string;
  report_date: string;
  title: string;
  health_grade?: string;
  average_score?: number;
  total_scans?: number;
  safe_products?: number;
  caution_products?: number;
  avoid_products?: number;
  top_concerns?: unknown[];
  recommendations?: unknown[];
}): Promise<TriggerResult> {
  return triggerZapierWebhook("health_report_generated", reportData, {
    source: "health_reports",
    userId: reportData.user_id,
  });
}

/**
 * Trigger custom webhook event
 */
export async function triggerCustomWebhook(
  eventName: string,
  data: ZapierEventData,
  userId?: string
): Promise<TriggerResult> {
  return triggerZapierWebhook("custom", {
    custom_event_name: eventName,
    ...data,
  }, {
    source: "custom",
    userId,
  });
}

/**
 * Get available Zapier/Make.com event types with descriptions and data fields
 */
export function getAvailableEventTypes(): Array<{
  type: ZapierEventType;
  name: string;
  description: string;
  platforms: string[];
  dataFields: string[];
}> {
  return [
    {
      type: "user_signup",
      name: "New User Signup",
      description: "Triggered when a new user creates an account",
      platforms: ["HubSpot", "Mailchimp", "Klaviyo", "Blaze AI", "Make.com"],
      dataFields: ["user_id", "email", "first_name", "last_name", "created_at", "signup_source", "campaign"],
    },
    {
      type: "product_scan",
      name: "Product Scan",
      description: "Triggered when a user scans a product",
      platforms: ["HubSpot", "Blaze AI", "Crew AI", "Make.com"],
      dataFields: ["scan_id", "user_id", "product_name", "brand", "barcode", "health_score", "verdict", "dietary_flags", "has_allergens", "recall_status"],
    },
    {
      type: "subscription_change",
      name: "Subscription Change",
      description: "Triggered when a user upgrades, downgrades, or cancels",
      platforms: ["HubSpot", "Mailchimp", "Klaviyo", "Make.com"],
      dataFields: ["user_id", "previous_tier", "new_tier", "change_type", "effective_date", "mrr_change", "currency"],
    },
    {
      type: "phone_number_submitted",
      name: "Phone Number Submitted",
      description: "Triggered when a user provides their phone number",
      platforms: ["HubSpot", "Mailchimp", "Klaviyo", "Make.com"],
      dataFields: ["user_id", "phone_number", "wants_recall_sms", "phone_verified", "notification_types"],
    },
    {
      type: "recall_alert",
      name: "Recall Alert Sent",
      description: "Triggered when an admin sends a product recall alert",
      platforms: ["Blaze AI", "Crew AI", "Make.com", "Slack"],
      dataFields: ["product_name", "brand", "reason", "action", "severity", "affected_user_count", "push_sent", "sms_sent"],
    },
    {
      type: "health_score_alert",
      name: "Dangerous Product Alert",
      description: "Triggered when a user scans a product with low health score",
      platforms: ["HubSpot", "Mailchimp", "Blaze AI", "Make.com"],
      dataFields: ["user_id", "product_name", "health_score", "alert_threshold", "ingredients_of_concern"],
    },
    {
      type: "daily_digest",
      name: "Daily Analytics Digest",
      description: "Triggered daily with aggregate analytics data",
      platforms: ["HubSpot", "Blaze AI", "Crew AI", "Make.com"],
      dataFields: ["date", "total_signups", "total_scans", "new_subscribers", "active_users", "most_scanned_products", "average_health_score"],
    },
    {
      type: "push_notification_sent",
      name: "Push Notification Sent",
      description: "Triggered when a push notification is broadcast",
      platforms: ["HubSpot", "Slack", "Blaze AI", "Make.com"],
      dataFields: ["type", "title", "body", "target_audience", "users_targeted", "success_count", "fail_count"],
    },
    {
      type: "push_notification_opened",
      name: "Push Notification Opened",
      description: "Triggered when a user opens a push notification",
      platforms: ["HubSpot", "Blaze AI", "Crew AI", "Make.com"],
      dataFields: ["notification_id", "user_id", "notification_type", "title", "opened_at", "time_to_open_seconds"],
    },
    {
      type: "device_registered",
      name: "Device Registered",
      description: "Triggered when a user registers a new device for push",
      platforms: ["HubSpot", "Blaze AI", "Make.com"],
      dataFields: ["user_id", "device_id", "platform", "device_name", "registered_at"],
    },
    {
      type: "legal_lead_submitted",
      name: "Legal Lead Submitted",
      description: "Triggered when a user submits a legal consultation request",
      platforms: ["HubSpot", "Salesforce", "Blaze AI", "Make.com", "Crew AI"],
      dataFields: [
        "lead_id", "user_id", "email", "phone_number", "first_name", "last_name",
        "lead_source", "lead_quality_score", "lead_category", "lead_status",
        "injury_description", "symptoms", "symptom_severity", "symptom_duration",
        "health_conditions", "allergies", "family_affected",
        "toxic_products_exposure", "recalled_products_exposure", "products_scanned",
        "baby_food_concerns", "feeding_method", "consent_given", "consent_timestamp",
        "consultation_requested", "consultation_requested_at"
      ],
    },
    {
      type: "community_post_created",
      name: "Community Post Created",
      description: "Triggered when a user creates a new community post",
      platforms: ["Slack", "Discord", "HubSpot", "Make.com"],
      dataFields: ["post_id", "user_id", "title", "content", "post_type", "product_name", "product_barcode", "health_score", "verdict", "created_at"],
    },
    {
      type: "community_post_liked",
      name: "Community Post Liked",
      description: "Triggered when a community post receives a like",
      platforms: ["HubSpot", "Blaze AI", "Make.com"],
      dataFields: ["post_id", "post_title", "post_author_id", "liker_user_id", "like_count"],
    },
    {
      type: "community_post_commented",
      name: "Community Post Commented",
      description: "Triggered when a community post receives a comment",
      platforms: ["Slack", "HubSpot", "Blaze AI", "Make.com"],
      dataFields: ["comment_id", "post_id", "post_title", "post_author_id", "commenter_user_id", "comment_content", "parent_comment_id", "comment_count", "created_at"],
    },
    {
      type: "family_profile_created",
      name: "Family Profile Created",
      description: "Triggered when a user adds a new family member profile",
      platforms: ["HubSpot", "Mailchimp", "Make.com"],
      dataFields: ["profile_id", "user_id", "name", "relationship", "age_group", "is_vegan", "is_gluten_free", "is_dairy_free", "is_diabetic", "is_pregnant", "is_heart_healthy", "allergies_detailed", "allergy_notes", "is_default"],
    },
    {
      type: "symptom_recorded",
      name: "Symptom Recorded",
      description: "Triggered when a user records symptoms in their journal",
      platforms: ["HubSpot", "Blaze AI", "Make.com"],
      dataFields: ["user_id", "symptoms", "symptom_count", "overall_severity", "longest_duration", "family_affected", "linked_products", "created_at"],
    },
    {
      type: "health_report_generated",
      name: "Health Report Generated",
      description: "Triggered when a health report is created for a user",
      platforms: ["HubSpot", "Mailchimp", "Make.com"],
      dataFields: ["report_id", "user_id", "report_type", "report_date", "title", "health_grade", "average_score", "total_scans", "safe_products", "caution_products", "avoid_products", "top_concerns", "recommendations"],
    },
  ];
}
