import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_Tp7FufeTAhZfoW": "basic",
  "prod_Tp7Fy504jF6oAR": "premium",
  "prod_Tp7F1x3leA7Rnq": "annual",
};

const TIER_CREDITS: Record<string, number> = {
  basic: 20,
  premium: -1,
  annual: -1,
  free: 10,
};

const TIER_PRICES: Record<string, string> = {
  basic: "$9.99/month",
  premium: "$24.99/month",
  annual: "$74.99/year",
};

// Centralized Zapier webhook dispatcher
// Compute HubSpot lifecycle stage from tier
function getLifecycleStage(tier: string, isCanceled = false): string {
  if (isCanceled) return "Churned";
  switch (tier) {
    case "premium":
    case "annual":
      return "Premium Subscriber";
    case "basic":
      return "Basic Subscriber";
    default:
      return "Trial User";
  }
}

// Estimate LTV from tier
function estimateLTV(tier: string, totalScans: number): number {
  const monthlyPrices: Record<string, number> = { basic: 9.99, premium: 24.99, annual: 74.99 / 12 };
  const monthlyValue = monthlyPrices[tier] || 0;
  // Rough estimate: assume 1 month per 30 scans as retention proxy
  const estimatedMonths = Math.max(1, Math.ceil(totalScans / 15));
  return Math.round(monthlyValue * estimatedMonths * 100) / 100;
}

// Centralized Zapier webhook dispatcher with HubSpot fields
async function dispatchZapierEvent(
  supabase: any,
  event: string,
  payload: Record<string, unknown>
) {
  try {
    const { data: zapierSettings } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_webhook_url")
      .maybeSingle();

    if (!zapierSettings?.value) return;

    await fetch(zapierSettings.value, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });

    logStep(`Zapier dispatched: ${event}`);
  } catch (e) {
    logStep(`Zapier dispatch error for ${event}`, { error: String(e) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) throw new Error("No stripe-signature header");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } else {
      event = JSON.parse(body);
      logStep("WARNING: No webhook secret configured, skipping signature verification");
    }

    logStep("Event received", { type: event.type, id: event.id });

    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = await resolveCustomerEmail(stripe, invoice.customer as string, invoice.customer_email);
        if (email) await handlePaymentSucceeded(supabase, email, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const email = await resolveCustomerEmail(stripe, invoice.customer as string, invoice.customer_email);
        if (email) await handlePaymentFailed(supabase, email, invoice);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, stripe, subscription, "created");
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, stripe, subscription, "updated");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, stripe, subscription);
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function resolveCustomerEmail(stripe: Stripe, customerId: string, invoiceEmail?: string | null): Promise<string | null> {
  if (invoiceEmail) return invoiceEmail;
  if (!customerId) return null;
  const customer = await stripe.customers.retrieve(customerId);
  return customer.deleted ? null : customer.email || null;
}

async function getProfileByEmail(supabase: any, email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, subscription_tier, scan_credits_remaining, total_scans_used")
    .eq("email", email)
    .maybeSingle();
  if (error) logStep("Error fetching profile", { error: error.message });
  return data;
}

async function handlePaymentSucceeded(supabase: any, email: string, invoice: Stripe.Invoice) {
  logStep("Payment succeeded", { email, amount: invoice.amount_paid });
  const profile = await getProfileByEmail(supabase, email);
  if (!profile) return;

  await supabase.from("email_log").insert({
    user_id: profile.id,
    email_type: "payment_succeeded",
    metadata: { email, amount: invoice.amount_paid, currency: invoice.currency, invoice_id: invoice.id },
  });
}

async function handlePaymentFailed(supabase: any, email: string, invoice: Stripe.Invoice) {
  logStep("Payment failed", { email, amount: invoice.amount_due });
  const profile = await getProfileByEmail(supabase, email);
  if (!profile) return;

  await supabase.from("email_log").insert({
    user_id: profile.id,
    email_type: "payment_failed",
    metadata: { email, amount: invoice.amount_due, currency: invoice.currency, attempt_count: invoice.attempt_count },
  });

  // Zapier: payment.failed
  await dispatchZapierEvent(supabase, "payment.failed", {
    user_id: profile.id,
    plan: profile.subscription_tier || "free",
    amount: invoice.amount_due,
    currency: invoice.currency,
    attempt_count: invoice.attempt_count,
  });

  // Klaviyo
  const klaviyoKey = Deno.env.get("KLAVIYO_API_KEY");
  if (klaviyoKey) {
    try {
      await fetch("https://a.klaviyo.com/api/events/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Klaviyo-API-Key ${klaviyoKey}`, revision: "2024-02-15" },
        body: JSON.stringify({
          data: { type: "event", attributes: {
            metric: { data: { type: "metric", attributes: { name: "payment_failed" } } },
            profile: { data: { type: "profile", attributes: { email } } },
            properties: { amount: invoice.amount_due, attempt_count: invoice.attempt_count },
          } },
        }),
      });
    } catch (e) { logStep("Klaviyo error", { error: String(e) }); }
  }
}

async function handleSubscriptionChange(
  supabase: any, stripe: Stripe, subscription: Stripe.Subscription, action: "created" | "updated"
) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return;

  const profile = await getProfileByEmail(supabase, customer.email);
  if (!profile) return;

  const productId = subscription.items.data[0]?.price?.product as string;
  const newTier = PRODUCT_TO_TIER[productId] || "premium";
  const previousTier = profile.subscription_tier || "free";
  const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const credits = TIER_CREDITS[newTier] ?? 10;

  const updateData: Record<string, any> = {
    subscription_tier: isActive ? newTier : "free",
    subscription_status: isActive ? newTier : "free_trial",
    subscription_expires_at: subscriptionEnd,
    trial_expired: false,
  };

  if (action === "created" || previousTier !== newTier) {
    updateData.scan_credits_remaining = credits;
    updateData.scan_reset_date = new Date().toISOString();
  }

  await supabase.from("profiles").update(updateData).eq("id", profile.id);

  await supabase.from("email_log").insert({
    user_id: profile.id,
    email_type: `subscription_${action}`,
    metadata: { email: customer.email, new_tier: newTier, previous_tier: previousTier, subscription_id: subscription.id },
  });

  // Zapier dispatch with HubSpot fields
  const totalScans = profile.total_scans_used || 0;
  const hubspotFields = {
    email: customer.email,
    subscription_status: isActive ? newTier : "free_trial",
    subscription_tier: isActive ? newTier : "free",
    total_scans: totalScans,
    ltv: estimateLTV(newTier, totalScans),
    trial_status: "converted",
    lifecycle_stage: getLifecycleStage(isActive ? newTier : "free"),
  };

  if (action === "created") {
    await dispatchZapierEvent(supabase, "subscription.started", {
      user_id: profile.id,
      plan: newTier,
      price: TIER_PRICES[newTier] || "unknown",
      scan_count: totalScans,
      ...hubspotFields,
    });
    // Klaviyo: Subscription Purchased
    await sendKlaviyoEvent(customer.email, "Subscription Purchased", {
      tier: newTier,
      price: TIER_PRICES[newTier],
      user_id: profile.id,
    });
    await updateKlaviyoSegments(customer.email, newTier, totalScans, false);
  } else if (previousTier !== newTier && isActive) {
    await dispatchZapierEvent(supabase, "subscription.upgraded", {
      user_id: profile.id,
      plan: newTier,
      previous_plan: previousTier,
      price: TIER_PRICES[newTier] || "unknown",
      scan_count: totalScans,
      ...hubspotFields,
    });
    // Klaviyo: Subscription Upgraded
    await sendKlaviyoEvent(customer.email, "Subscription Purchased", {
      tier: newTier,
      previous_tier: previousTier,
      price: TIER_PRICES[newTier],
      user_id: profile.id,
      is_upgrade: true,
    });
    await updateKlaviyoSegments(customer.email, newTier, totalScans, false);
  }

  logStep(`Subscription ${action}`, { userId: profile.id, previousTier, newTier });
}

async function handleSubscriptionDeleted(supabase: any, stripe: Stripe, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !customer.email) return;

  const profile = await getProfileByEmail(supabase, customer.email);
  if (!profile) return;

  const previousTier = profile.subscription_tier || "free";

  await supabase.from("profiles").update({
    subscription_tier: "free",
    subscription_status: "free_trial",
    subscription_expires_at: null,
    scan_credits_remaining: 10,
    trial_expired: false,
  }).eq("id", profile.id);

  await supabase.from("email_log").insert({
    user_id: profile.id,
    email_type: "subscription_deleted",
    metadata: { email: customer.email, previous_tier: previousTier, subscription_id: subscription.id },
  });

  // Zapier: subscription.canceled with HubSpot fields
  const totalScans = profile.total_scans_used || 0;
  await dispatchZapierEvent(supabase, "subscription.canceled", {
    user_id: profile.id,
    plan: "free",
    previous_plan: previousTier,
    scan_count: totalScans,
    email: customer.email,
    subscription_status: "free_trial",
    subscription_tier: "free",
    total_scans: totalScans,
    ltv: estimateLTV(previousTier, totalScans),
    trial_status: "churned",
    lifecycle_stage: "Churned",
  });

  // Klaviyo: Subscription Canceled
  const klaviyoKey = Deno.env.get("KLAVIYO_API_KEY");
  if (klaviyoKey) {
    await sendKlaviyoEvent(customer.email, "Subscription Canceled", {
      previous_tier: previousTier,
      user_id: profile.id,
    });
    await updateKlaviyoSegments(customer.email, "free", totalScans, true);
  }

  logStep("Subscription deleted", { userId: profile.id, previousTier });
}

// Klaviyo helpers
async function sendKlaviyoEvent(email: string, metricName: string, properties: Record<string, unknown>) {
  const klaviyoKey = Deno.env.get("KLAVIYO_API_KEY");
  if (!klaviyoKey) return;
  try {
    await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${klaviyoKey}`,
        revision: "2024-02-15",
      },
      body: JSON.stringify({
        data: { type: "event", attributes: {
          metric: { data: { type: "metric", attributes: { name: metricName } } },
          profile: { data: { type: "profile", attributes: { email } } },
          properties,
          time: new Date().toISOString(),
        } },
      }),
    });
    logStep(`Klaviyo event "${metricName}" sent for ${email}`);
  } catch (e) { logStep(`Klaviyo error for "${metricName}"`, { error: String(e) }); }
}

async function updateKlaviyoSegments(email: string, tier: string, totalScans: number, isChurned: boolean) {
  const klaviyoKey = Deno.env.get("KLAVIYO_API_KEY");
  if (!klaviyoKey) return;
  try {
    await fetch("https://a.klaviyo.com/api/profile-import/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${klaviyoKey}`,
        revision: "2024-02-15",
      },
      body: JSON.stringify({
        data: { type: "profile", attributes: {
          email,
          properties: {
            is_trial_user: tier === "free",
            is_premium_user: ["premium", "annual", "basic"].includes(tier),
            is_heavy_scanner: totalScans >= 10,
            is_churned: isChurned,
            subscription_tier: tier,
            total_scans: totalScans,
          },
        } },
      }),
    });
    logStep(`Klaviyo segments updated for ${email}`);
  } catch (e) { logStep(`Klaviyo segment error`, { error: String(e) }); }
}
