import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  hasPaidSubscription, 
  hasUnlimitedScans, 
  hasFamilyAccess, 
  hasProAccess,
  hasFullHistoryAccess,
  getTierDisplayName,
  SubscriptionTier
} from "@/lib/subscriptionUtils";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Bug, Crown, Sparkles } from "lucide-react";

interface DebugInfo {
  tier: string | null;
  expiresAt: string | null;
  credits: number;
  dailyScans: number;
  stripeCheck: {
    subscribed: boolean;
    tier: string | null;
    endDate: string | null;
  } | null;
  lastChecked: string | null;
}

const TIER_OPTIONS: { tier: SubscriptionTier; label: string; icon: string }[] = [
  { tier: "free", label: "Free Trial", icon: "🆓" },
  { tier: "basic", label: "Basic", icon: "💳" },
  { tier: "premium", label: "Premium", icon: "⭐" },
  { tier: "annual", label: "Annual", icon: "👑" },
];

export const SubscriptionDebugPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tierOverride, setTierOverride, getEffectiveTier } = useDebug();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    tier: null,
    expiresAt: null,
    credits: 0,
    dailyScans: 0,
    stripeCheck: null,
    lastChecked: null,
  });

  const fetchDebugInfo = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_expires_at")
        .eq("id", user.id)
        .single();

      // Fetch credits
      const { data: credits } = await supabase
        .from("scan_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single();

      // Fetch daily scans
      const today = new Date().toISOString().split("T")[0];
      const { data: dailyScans } = await supabase
        .from("daily_scans")
        .select("scan_count")
        .eq("user_id", user.id)
        .eq("scan_date", today)
        .single();

      setDebugInfo(prev => ({
        ...prev,
        tier: profile?.subscription_tier || "free",
        expiresAt: profile?.subscription_expires_at || null,
        credits: credits?.credits_remaining || 0,
        dailyScans: dailyScans?.scan_count || 0,
        lastChecked: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching debug info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStripeSubscription = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        toast({
          title: "Stripe Check Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setDebugInfo(prev => ({
        ...prev,
        stripeCheck: {
          subscribed: data.subscribed,
          tier: data.subscription_tier,
          endDate: data.subscription_end,
        },
      }));

      // Refresh local data
      await fetchDebugInfo();

      toast({
        title: "Stripe Subscription Checked",
        description: data.subscribed 
          ? `Active: ${data.subscription_tier} until ${new Date(data.subscription_end).toLocaleDateString()}`
          : "No active subscription found",
      });
    } catch (error) {
      console.error("Error checking Stripe:", error);
      toast({
        title: "Error",
        description: "Failed to check Stripe subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchDebugInfo();
    }
  }, [isOpen, user]);

  if (!user) return null;

  // Only show in development or for admin users
  const isDev = import.meta.env.DEV;
  if (!isDev) return null;

  const realTier = debugInfo.tier;
  const effectiveTier = getEffectiveTier(realTier);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-background/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/50"
        >
          <Bug className="h-4 w-4" />
        </Button>
      ) : (
        <Card className="w-80 shadow-xl border-2 border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Subscription Debug
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Tier Simulator */}
            <div className="space-y-2 p-3 bg-primary/10 rounded-lg border border-primary/30">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                TIER SIMULATOR (Dev Only)
              </div>
              <div className="grid grid-cols-2 gap-1">
                {TIER_OPTIONS.map(({ tier, label, icon }) => (
                  <Button
                    key={tier}
                    variant={tierOverride === tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTierOverride(tier)}
                    className={`text-xs h-7 ${tierOverride === tier ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {icon} {label}
                  </Button>
                ))}
              </div>
              {tierOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTierOverride(null)}
                  className="w-full text-xs h-6 text-muted-foreground"
                >
                  Reset to Real Tier
                </Button>
              )}
            </div>

            {/* Current Tier */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Real Tier:</span>
              <Badge variant={realTier === "free" ? "secondary" : "default"}>
                {getTierDisplayName(realTier)}
              </Badge>
            </div>

            {tierOverride && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Simulating:</span>
                <Badge className="bg-primary text-primary-foreground">
                  <Crown className="h-3 w-3 mr-1" />
                  {getTierDisplayName(tierOverride)}
                </Badge>
              </div>
            )}

            {/* Expires At */}
            {debugInfo.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span>{new Date(debugInfo.expiresAt).toLocaleDateString()}</span>
              </div>
            )}

            {/* Credits & Scans */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted rounded p-2">
                <div className="text-muted-foreground">Credits</div>
                <div className="font-bold">{debugInfo.credits}</div>
              </div>
              <div className="bg-muted rounded p-2">
                <div className="text-muted-foreground">Today's Scans</div>
                <div className="font-bold">{debugInfo.dailyScans}/5</div>
              </div>
            </div>

            {/* Feature Access */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground mb-2">Feature Access{tierOverride ? " (Simulated)" : ""}:</div>
              <FeatureCheck label="Paid Subscription" enabled={hasPaidSubscription(effectiveTier)} />
              <FeatureCheck label="Unlimited Scans" enabled={hasUnlimitedScans(effectiveTier)} />
              <FeatureCheck label="Full History" enabled={hasFullHistoryAccess(effectiveTier)} />
              <FeatureCheck label="Family Profiles" enabled={hasFamilyAccess(effectiveTier)} />
              <FeatureCheck label="Pro Features" enabled={hasProAccess(effectiveTier)} />
            </div>

            {/* Stripe Check Result */}
            {debugInfo.stripeCheck && (
              <div className="bg-muted/50 rounded p-2 text-xs">
                <div className="font-medium mb-1">Last Stripe Check:</div>
                <div className="flex items-center gap-1">
                  {debugInfo.stripeCheck.subscribed ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                  )}
                  <span>
                    {debugInfo.stripeCheck.subscribed 
                      ? `Active: ${debugInfo.stripeCheck.tier}`
                      : "No active subscription"}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={fetchDebugInfo}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={checkStripeSubscription}
                disabled={isLoading}
              >
                Check Stripe
              </Button>
            </div>

            {/* Last checked */}
            {debugInfo.lastChecked && (
              <div className="text-xs text-muted-foreground text-center">
                Last updated: {new Date(debugInfo.lastChecked).toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const FeatureCheck = ({ label, enabled }: { label: string; enabled: boolean }) => (
  <div className="flex items-center gap-2 text-xs">
    {enabled ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-red-500" />
    )}
    <span className={enabled ? "text-foreground" : "text-muted-foreground"}>{label}</span>
  </div>
);
