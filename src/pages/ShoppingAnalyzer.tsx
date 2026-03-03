import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  History,
  Search,
  ShoppingCart,
  Lock,
  Zap,
  ArrowRight,
  Calendar,
  Sparkles,
  Crown,
} from "lucide-react";
import { ScanHistoryTab } from "@/components/shopping/ScanHistoryTab";
import { FindProductsTab } from "@/components/shopping/FindProductsTab";
import { SmartCartTab } from "@/components/shopping/SmartCartTab";
import { hasShoppingAnalyzerAccess } from "@/lib/subscriptionUtils";

const ShoppingAnalyzer = () => {
  const { user } = useAuth();
  const { getEffectiveTier } = useDebug();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [credits, setCredits] = useState<number>(0);
  const [activeTab, setActiveTab] = useState("history");

  const effectiveTier = getEffectiveTier(subscriptionTier);
  const hasSmartCartAccess = hasShoppingAnalyzerAccess(effectiveTier);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
        setSubscriptionTier(profile.subscription_tier || "free");
      }

      // Use get_total_scan_count for consistent free trial tracking
      const { data: totalScans } = await supabase.rpc('get_total_scan_count');
      const scansRemaining = Math.max(0, 10 - (totalScans || 0));
      setCredits(scansRemaining);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
            Smart Shopping
          </h1>
          <p className="text-muted-foreground">
            Your personal shopping health assistant
          </p>

          <div className="p-4 bg-danger/20 rounded-xl border border-danger/30 mt-6">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-danger" />
              <div className="text-left">
                <p className="font-bold text-foreground">Sign in to continue</p>
                <p className="text-sm text-muted-foreground">
                  Create a free account to access smart shopping features
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full mt-3 bg-danger hover:bg-danger/90"
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <>
    <Helmet>
      <title>Safe Baby Food Shopping Analyzer | Check Ingredients Before You Buy | FoodFactScanner®</title>
      <meta name="description" content="Analyze your shopping cart for toxic baby food ingredients, heavy metals, and unsafe products before you buy. Smart baby food safety checker for parents — scan, compare, and shop safely." />
      <meta name="keywords" content="baby food shopping analyzer, safe baby food shopping, baby food ingredient checker, toxic baby food brands, best safe baby food brands 2025" />
      <link rel="canonical" href="https://foodfactscanner.com/shopping-analyzer" />
      <meta property="og:title" content="Safe Baby Food Shopping Analyzer | FoodFactScanner®" />
      <meta property="og:description" content="Analyze your shopping cart for toxic baby food ingredients and heavy metals before you buy." />
      <meta property="og:url" content="https://foodfactscanner.com/shopping-analyzer" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <AppLayout containerClassName="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
          Smart Shopping
        </h1>
        <p className="text-muted-foreground">
          Your personal shopping health assistant
        </p>
      </motion.div>

      {/* Credits Display for Free Users */}
      {effectiveTier === "free" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-3 bg-caution/20 rounded-xl border border-caution/30"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-caution" />
            <span className="text-foreground text-sm">
              <span className="font-bold">{credits}</span> credits remaining
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/subscription")}
            className="text-caution hover:text-caution/80"
          >
            Get More <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}

      {/* AI Meal Planner Promo Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={() => navigate("/meal-planner")}
        className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 border border-primary/30 cursor-pointer hover:border-primary/50 transition-all group"
      >
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase">Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-primary" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              AI Meal Planner
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate personalized meal plans from your ingredients
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-muted/50 border border-border p-1 rounded-xl">
          <TabsTrigger 
            value="history" 
            className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs sm:text-sm"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">My</span> History
          </TabsTrigger>
          <TabsTrigger 
            value="search" 
            className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs sm:text-sm"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Find</span> Products
          </TabsTrigger>
          <TabsTrigger 
            value="cart" 
            className="flex-1 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs sm:text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Smart Cart
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="history" className="mt-0">
            <ScanHistoryTab />
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <FindProductsTab userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="cart" className="mt-0">
            <SmartCartTab userProfile={userProfile} subscriptionTier={effectiveTier || "free"} />
          </TabsContent>
        </div>
      </Tabs>
    </AppLayout>
    </>
  );
};

export default ShoppingAnalyzer;
