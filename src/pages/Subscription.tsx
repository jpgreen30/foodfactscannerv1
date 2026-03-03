import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_TIERS, SubscriptionTierKey } from "@/lib/stripeConfig";
import { trackSubscriptionView, trackSubscriptionStart, trackSubscriptionComplete } from "@/lib/analytics";
import { 
  Check, 
  Crown, 
  Zap, 
  Infinity, 
  Loader2,
  Shield,
  XCircle,
  Baby,
  Bell,
  Heart,
  Star,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: any;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  features: { icon: any; text: string; included: boolean }[];
  highlight?: boolean;
  badge?: string;
}

const Subscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [credits, setCredits] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    // Handle success/cancel from Stripe
    if (searchParams.get("success") === "true") {
      const tier = searchParams.get("tier") || currentTier;
      const tierConfig = STRIPE_TIERS[tier as SubscriptionTierKey];
      if (tierConfig) {
        trackSubscriptionComplete(tier, tierConfig.price);
      }
      
      toast({
        title: "Subscription Successful!",
        description: "Your subscription is now active. Enjoy protecting your baby!",
      });
      checkSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Checkout Canceled",
        description: "Your subscription was not completed.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();

      if (profile?.subscription_tier) {
        setCurrentTier(profile.subscription_tier);
      }

      // Use get_total_scan_count for consistent free trial tracking
      const { data: totalScans } = await supabase.rpc('get_total_scan_count');
      const scansRemaining = Math.max(0, 10 - (totalScans || 0));
      setCredits(scansRemaining);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data?.subscription_tier) {
        setCurrentTier(data.subscription_tier);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (tierId === "free" || !(tierId in STRIPE_TIERS)) {
      return;
    }

    setSelectedTier(tierId);
    
    try {
      const tierConfig = STRIPE_TIERS[tierId as SubscriptionTierKey];
      const priceId = tierConfig.price_id;
      
      trackSubscriptionStart(tierId, tierConfig.price);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSelectedTier(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsManaging(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription management.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  const tiers: SubscriptionTier[] = [
    {
      id: "free",
      name: "Free Trial",
      price: "$0",
      period: "",
      description: "10 scans to try it out",
      icon: Baby,
      iconColor: "text-muted-foreground",
      bgColor: "bg-muted/30",
      borderColor: "border-muted",
      features: [
        { icon: Zap, text: "10 scans total (lifetime)", included: true },
        { icon: Shield, text: "Toxin & allergen detection", included: true },
        { icon: Bell, text: "FDA recall alerts", included: true },
        { icon: Heart, text: "Personalized recommendations", included: true },
        { icon: XCircle, text: "Standard AI queue", included: true },
      ],
    },
    {
      id: "basic",
      name: "Basic",
      price: "$9.99",
      period: "/month",
      description: "Essential baby food safety",
      icon: Shield,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/50",
      features: [
        { icon: Zap, text: "20 scans per month", included: true },
        { icon: Shield, text: "Toxin & allergen detection", included: true },
        { icon: Bell, text: "FDA recall alerts", included: true },
        { icon: Heart, text: "Personalized recommendations", included: true },
        { icon: Star, text: "Email support", included: true },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: "$24.99",
      period: "/month",
      description: "Complete baby protection",
      icon: Crown,
      iconColor: "text-caution",
      bgColor: "bg-caution/10",
      borderColor: "border-caution",
      highlight: true,
      badge: "Most Popular",
      features: [
        { icon: Infinity, text: "Unlimited scans", included: true },
        { icon: Zap, text: "Priority AI queue", included: true },
        { icon: Shield, text: "Toxin & allergen detection", included: true },
        { icon: Bell, text: "FDA recall alerts", included: true },
        { icon: Heart, text: "Personalized recommendations", included: true },
        { icon: Crown, text: "Priority support", included: true },
      ],
    },
    {
      id: "annual",
      name: "Annual Premium",
      price: "$74.99",
      period: "/year",
      description: "Best value — Save $225/year",
      icon: Star,
      iconColor: "text-safe",
      bgColor: "bg-safe/10",
      borderColor: "border-safe",
      badge: "Best Value",
      features: [
        { icon: Infinity, text: "Unlimited scans", included: true },
        { icon: Zap, text: "Priority AI queue", included: true },
        { icon: Shield, text: "Toxin & allergen detection", included: true },
        { icon: Bell, text: "FDA recall alerts", included: true },
        { icon: Heart, text: "Personalized recommendations", included: true },
        { icon: Crown, text: "Priority support", included: true },
      ],
    },
  ];

  if (isLoading) {
    return (
      <AppLayout containerClassName="max-w-4xl">
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
    <Helmet>
      <title>Baby Food Safety Scanner Plans & Pricing | FoodFactScanner® Premium</title>
      <meta name="description" content="Upgrade to FoodFactScanner® Premium for unlimited baby food barcode scans, heavy metals detection, FDA recall alerts, and personalized safety reports. Protect your baby with the best baby food safety app." />
      <meta name="keywords" content="baby food scanner subscription, baby food safety app premium, unlimited baby food scans, baby food safety plan, best baby food safety app" />
      <link rel="canonical" href="https://foodfactscanner.com/subscription" />
      <meta property="og:title" content="Baby Food Safety Scanner Plans & Pricing | FoodFactScanner®" />
      <meta property="og:description" content="Upgrade for unlimited baby food scans, heavy metals detection, and FDA recall alerts." />
      <meta property="og:url" content="https://foodfactscanner.com/subscription" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <AppLayout containerClassName="max-w-4xl">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex justify-center mb-4">
            <Baby className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
            Protect Your Baby
          </h1>
          <p className="text-muted-foreground">
            Choose the plan that's right for your family
          </p>
        </motion.div>

        {/* Credits Display for Free Users */}
        {user && currentTier === "free" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-primary/20 rounded-xl border border-primary/30 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-foreground">
                You have <span className="font-bold text-primary">{credits}</span> free scans remaining
              </span>
            </div>
          </motion.div>
        )}

        {/* Manage Subscription Button for Paid Users */}
        {user && currentTier !== "free" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleManageSubscription}
              disabled={isManaging}
              variant="outline"
              className="border-border text-foreground hover:bg-muted/50"
            >
              {isManaging ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          </motion.div>
        )}

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-5 rounded-2xl border-2 relative overflow-hidden",
                tier.bgColor,
                tier.borderColor,
                currentTier === tier.id && "ring-2 ring-offset-2 ring-offset-foreground ring-safe"
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <div className={cn(
                  "absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg uppercase",
                  tier.id === "premium" ? "bg-caution text-foreground" :
                  tier.id === "annual" ? "bg-safe text-foreground" :
                  "bg-primary text-foreground"
                )}>
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <tier.icon className={cn("w-6 h-6", tier.iconColor)} />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{tier.name}</h2>
                    <p className={tier.iconColor}>{tier.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{tier.price}</p>
                  <p className="text-sm text-muted-foreground">{tier.period}</p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-4">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      feature.included ? "bg-safe/20" : "bg-danger/20"
                    )}>
                      {feature.included ? (
                        <Check className="w-4 h-4 text-safe" />
                      ) : (
                        <XCircle className="w-3 h-3 text-danger" />
                      )}
                    </div>
                    <span className={cn(
                      "text-sm",
                      feature.included ? "text-foreground" : "text-muted-foreground/70 line-through"
                    )}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {currentTier === tier.id ? (
                <div className="text-center py-2 px-4 rounded-lg border bg-safe/20 border-safe/30">
                  <span className="text-sm font-medium text-safe">
                    ✓ Your Current Plan
                  </span>
                </div>
              ) : tier.id === "free" ? null : (
                <Button 
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={selectedTier === tier.id}
                  className={cn(
                    "w-full gap-2",
                    tier.id === "basic" ? "bg-primary hover:bg-primary/90 text-primary-foreground" :
                    tier.id === "premium" ? "bg-caution hover:bg-caution/90 text-foreground" :
                    "bg-safe hover:bg-safe/90 text-foreground"
                  )}
                >
                  {selectedTier === tier.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Get {tier.name}
                    </>
                  )}
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-primary/20 rounded-xl border border-primary/30"
        >
          <p className="text-sm text-center text-foreground">
            <span className="font-bold text-primary">🍼 Every scan protects your baby from hidden dangers.</span>
            <br />
            <span className="text-muted-foreground">30-day money-back guarantee. Cancel anytime.</span>
          </p>
        </motion.div>
      </div>
     </AppLayout>
    </>
  );
};
export default Subscription;
