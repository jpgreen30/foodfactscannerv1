// Stripe product and price mapping - Baby Food Scanner tiers
export const STRIPE_TIERS = {
  basic: {
    product_id: "prod_Tp7FufeTAhZfoW",
    price_id: "price_1SrT0iApuONAOBDy520OVCmY",
    price: 9.99,
    name: "Basic",
    scans_per_month: 20,
  },
  premium: {
    product_id: "prod_Tp7Fy504jF6oAR",
    price_id: "price_1SrT18ApuONAOBDyfPpD1iFQ",
    price: 24.99,
    name: "Premium",
    scans_per_month: -1, // Unlimited
  },
  annual: {
    product_id: "prod_Tp7F1x3leA7Rnq",
    price_id: "price_1SrT1PApuONAOBDy1U4se7HQ",
    price: 74.99,
    name: "Annual Premium",
    scans_per_month: -1, // Unlimited
    is_annual: true,
  },
} as const;

export type SubscriptionTierKey = keyof typeof STRIPE_TIERS;

// Product ID to tier mapping for check-subscription
export const PRODUCT_TO_TIER: Record<string, SubscriptionTierKey> = {
  "prod_Tp7FufeTAhZfoW": "basic",
  "prod_Tp7Fy504jF6oAR": "premium",
  "prod_Tp7F1x3leA7Rnq": "annual",
};
