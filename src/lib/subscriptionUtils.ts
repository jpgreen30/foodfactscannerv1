// Subscription tier utility functions - Baby Food Scanner

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'annual';

const PAID_TIERS: SubscriptionTier[] = ['basic', 'premium', 'annual'];
const UNLIMITED_TIERS: SubscriptionTier[] = ['premium', 'annual'];

/**
 * Check if the user has any paid subscription
 */
export const hasPaidSubscription = (tier: string | null | undefined): boolean => {
  if (!tier) return false;
  return PAID_TIERS.includes(tier as SubscriptionTier);
};

/**
 * Check if the user has unlimited scans (Premium or Annual)
 */
export const hasUnlimitedScans = (tier: string | null | undefined): boolean => {
  if (!tier) return false;
  return UNLIMITED_TIERS.includes(tier as SubscriptionTier);
};

/**
 * Get scan limit for a tier
 * Returns -1 for unlimited
 */
export const getScanLimit = (tier: string | null | undefined): number => {
  if (!tier) return 10; // Free trial: 10 scans total (lifetime)
  switch (tier) {
    case 'basic': return 20; // 20 per month
    case 'premium': return -1; // Unlimited
    case 'annual': return -1; // Unlimited
    default: return 10; // Free trial: 10 scans total
  }
};

/**
 * @deprecated Use getScanLimit instead
 */
export const getMonthlyScanLimit = getScanLimit;

/**
 * Check if the user has access to all premium features
 */
export const hasPremiumFeatures = (tier: string | null | undefined): boolean => {
  if (!tier) return false;
  return ['premium', 'annual'].includes(tier);
};

/**
 * Check if the user has full history access (paid tiers only)
 * Free tier only gets 7 days of history
 */
export const hasFullHistoryAccess = (tier: string | null | undefined): boolean => {
  return hasPaidSubscription(tier);
};

/**
 * Get tier display name
 */
export const getTierDisplayName = (tier: string | null | undefined): string => {
  if (!tier) return 'Free Trial';
  switch (tier) {
    case 'basic': return 'Basic';
    case 'premium': return 'Premium';
    case 'annual': return 'Annual Premium';
    default: return 'Free Trial';
  }
};

/**
 * Check if the user has access to AI Shopping Analyzer
 */
export const hasShoppingAnalyzerAccess = (tier: string | null | undefined): boolean => {
  return hasPaidSubscription(tier);
};

/**
 * Check if the user has access to Health Reports generation
 */
export const hasHealthReportsAccess = (tier: string | null | undefined): boolean => {
  return hasPaidSubscription(tier);
};

/**
 * Check if user has access to personalized recommendations
 */
export const hasPersonalizedRecommendations = (tier: string | null | undefined): boolean => {
  return hasPaidSubscription(tier);
};

/**
 * Check if user has access to AI Meal Planner
 */
export const hasMealPlannerAccess = (tier: string | null | undefined): boolean => {
  return hasPaidSubscription(tier);
};

/**
 * Check if user has access to AI Ingredient Chat
 */
export const hasAIChatAccess = (tier: string | null | undefined): boolean => {
  return hasPaidSubscription(tier);
};

/**
 * Check if user has access to priority support
 */
export const hasPrioritySupport = (tier: string | null | undefined): boolean => {
  return hasPremiumFeatures(tier);
};

// Legacy functions kept for compatibility
export const hasFamilyAccess = (tier: string | null | undefined): boolean => {
  return hasPremiumFeatures(tier);
};

export const hasProAccess = (tier: string | null | undefined): boolean => {
  return hasPremiumFeatures(tier);
};

export const getMaxFamilyProfiles = (tier: string | null | undefined): number => {
  if (hasPremiumFeatures(tier)) return 10;
  if (tier === 'basic') return 2;
  return 0;
};

export const hasSavedRecipesAccess = (tier: string | null | undefined): boolean => {
  return hasPremiumFeatures(tier);
};
