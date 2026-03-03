import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MessageCircle, FileText, History, Scale, Zap, Shield, AlertTriangle, Crown } from "lucide-react";
import { useMonetization } from "@/hooks/useMonetization";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import FearHero from "@/components/landing/FearHero";
import FeaturedIn from "@/components/landing/FeaturedIn";
import HowItWorks from "@/components/landing/HowItWorks";
import ScanResultPreview from "@/components/landing/ScanResultPreview";
import FeaturesShowcase from "@/components/landing/FeaturesShowcase";
import PricingSection from "@/components/landing/PricingSection";
import TrustBadges from "@/components/landing/TrustBadges";
import ShockingStats from "@/components/landing/ShockingStats";
import HiddenDangers from "@/components/landing/HiddenDangers";
import MissionStatement from "@/components/landing/MissionStatement";
import WorstCaseScenarios from "@/components/landing/WorstCaseScenarios";
import FearTestimonials from "@/components/landing/FearTestimonials";
import FAQSection from "@/components/landing/FAQSection";
import FinalScareCTA from "@/components/landing/FinalScareCTA";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { PersonalizedMealSuggestions } from "@/components/engagement/PersonalizedMealSuggestions";
import { DailyChallenges } from "@/components/engagement/DailyChallenges";
import { AppLayout } from "@/components/AppLayout";
import { LoadingSplash } from "@/components/LoadingSplash";
import { supabase } from "@/integrations/supabase/client";

interface Ingredient {
  name: string;
  riskLevel?: string;
}

interface ScanHistoryItem {
  id: string;
  product_name: string;
  health_score: number | null;
  verdict: string | null;
  created_at: string;
}

const Index = () => {
  const { user, loading } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [toxicCount, setToxicCount] = useState(0);
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const monetization = useMonetization();

  useEffect(() => {
    if (user) {
      // Fetch user name
      supabase
        .from('profiles')
        .select('first_name, display_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setUserName(data?.first_name || data?.display_name?.split(' ')[0] || null);
        });

      // Fetch toxic scans count
      supabase
        .from('scan_history')
        .select('id, verdict, ingredients')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) {
            const toxicScans = data.filter((scan) => {
              if (scan.verdict === 'avoid') return true;
              const ingredients = scan.ingredients as unknown as Ingredient[] | null;
              if (ingredients && Array.isArray(ingredients)) {
                return ingredients.some((i) =>
                  ['high', 'moderate', 'danger', 'caution'].includes(i.riskLevel || '')
                );
              }
              return false;
            });
            setToxicCount(toxicScans.length);
          }
        });

      // Fetch recent scans (last 5)
      supabase
        .from('scan_history')
        .select('id, product_name, health_score, verdict, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setRecentScans(data as ScanHistoryItem[]);
        });
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = userName ? `, ${userName}` : '';
    
    if (hour >= 5 && hour < 12) return `Good Morning${name}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon${name}`;
    if (hour >= 17 && hour < 21) return `Good Evening${name}`;
    return `Good Night${name}`;
  };

  // Show branded loading splash while auth is resolving
  if (loading) {
    return <LoadingSplash />;
  }

  return (
    <>
    <Helmet>
      <title>FoodFactScanner® – #1 Baby Food Safety Scanner | Detect Heavy Metals & Toxins</title>
      <meta name="description" content="The #1 baby food safety scanner for parents. Scan barcodes to instantly detect heavy metals (arsenic, lead), toxic ingredients & FDA recalls in baby food. Free baby food ingredient checker — 10 free scans!" />
      <meta name="keywords" content="baby food safety scanner, toxic ingredients baby food, heavy metals baby food, baby food barcode scanner, FDA baby food recall, safe baby food brands 2025, food ingredient checker babies, arsenic lead baby food, baby food scanner app, organic baby food safety" />
      <link rel="canonical" href="https://foodfactscanner.com/" />
      <meta property="og:url" content="https://foodfactscanner.com/" />
      <meta property="og:title" content="FoodFactScanner® – #1 Baby Food Safety Scanner | Detect Heavy Metals & Toxins" />
      <meta property="og:description" content="The #1 baby food safety scanner for parents. Scan barcodes to instantly detect heavy metals (arsenic, lead), toxic ingredients & FDA recalls in baby food. Free baby food ingredient checker!" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="FoodFactScanner®" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="https://foodfactscanner.com/" />
      <meta name="twitter:title" content="FoodFactScanner® – #1 Baby Food Safety Scanner | Detect Heavy Metals & Toxins" />
      <meta name="twitter:description" content="The #1 baby food safety scanner for parents. Scan barcodes to instantly detect heavy metals, toxic ingredients & FDA recalls in baby food." />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
    </Helmet>
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AppLayout>
            <div className="space-y-6">
              <motion.div 
                className="text-center mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
                  {getGreeting()}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Your personalized health dashboard
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-5 gap-2"
              >
                {[
                  { to: "/scanner", icon: Camera, label: "Scan", color: "from-primary/20 to-primary/10", badge: 0 },
                  { to: "/history", icon: History, label: "History", color: "from-danger/20 to-danger/10", badge: 0 },
                  { to: "/legal-help", icon: Scale, label: "Legal", color: "from-yellow-500/20 to-yellow-600/10", badge: toxicCount },
                  { to: "/ingredient-chat", icon: MessageCircle, label: "Chat", color: "from-accent/30 to-accent/15", badge: 0 },
                  { to: "/health-reports", icon: FileText, label: "Reports", color: "from-secondary/40 to-secondary/20", badge: 0 },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${action.color} border border-border/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200`}
                  >
                    {action.badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center px-1.5 text-xs font-bold bg-danger text-white rounded-full animate-pulse">
                        {action.badge > 99 ? '99+' : action.badge}
                      </span>
                    )}
                    <action.icon className="h-6 w-6 text-foreground mb-1.5" />
                    <span className="text-xs font-semibold text-foreground">{action.label}</span>
                  </Link>
                ))}
              </motion.div>

              {/* Scan Credits Counter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {!monetization.loading && (
                  <div className={`p-4 rounded-2xl border ${
                    monetization.isBlocked 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : monetization.isUnlimited 
                        ? 'border-safe/30 bg-safe/5'
                        : monetization.scanCreditsRemaining <= 3 
                          ? 'border-caution/30 bg-caution/5' 
                          : 'border-border bg-card'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {monetization.isBlocked ? (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        ) : monetization.isUnlimited ? (
                          <Crown className="w-5 h-5 text-safe" />
                        ) : (
                          <Shield className="w-5 h-5 text-primary" />
                        )}
                        <span className="font-semibold text-foreground text-sm">
                          {monetization.isUnlimited 
                            ? 'Unlimited Scans' 
                            : monetization.isBlocked 
                              ? 'No Scans Remaining'
                              : `${monetization.scanCreditsRemaining} Scan${monetization.scanCreditsRemaining !== 1 ? 's' : ''} Remaining`
                          }
                        </span>
                      </div>
                      {!monetization.isUnlimited && (
                        <Link to="/subscription">
                          <Button size="sm" variant={monetization.isBlocked ? "destructive" : "default"} className="gap-1 text-xs">
                            <Zap className="w-3 h-3" />
                            Upgrade
                          </Button>
                        </Link>
                      )}
                    </div>
                    {!monetization.isUnlimited && (
                      <Progress 
                        value={(monetization.scanCreditsRemaining / 10) * 100} 
                        className="h-2"
                      />
                    )}
                  </div>
                )}
              </motion.div>

              {/* Recent Scan History */}
              {recentScans.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Recent Scans</h2>
                      <Link to="/history" className="text-xs text-primary font-medium">View All</Link>
                    </div>
                    <div className="space-y-2">
                      {recentScans.map((scan) => {
                        const score = scan.health_score ?? 0;
                        const riskColor = score >= 70 ? 'bg-safe' : score >= 40 ? 'bg-caution' : 'bg-danger';
                        const riskTextColor = score >= 70 ? 'text-safe' : score >= 40 ? 'text-caution' : 'text-danger';
                        const riskLabel = score >= 70 ? 'Low Risk' : score >= 40 ? 'Moderate' : 'High Risk';
                        
                        return (
                          <Link 
                            key={scan.id} 
                            to="/history"
                            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors"
                          >
                            <div className={`w-3 h-3 rounded-full ${riskColor} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{scan.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(scan.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${riskTextColor}`}>{score}/100</p>
                              <p className={`text-xs font-medium ${riskTextColor}`}>{riskLabel}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <PersonalizedMealSuggestions />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <DailyChallenges compact />
              </motion.div>
            </div>
          </AppLayout>
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-h-screen">
            {/* Logo Header - Public Landing Page */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
              <div className="container max-w-lg mx-auto px-4 py-3 flex justify-center">
                <Logo size="md" />
              </div>
            </header>

            <FearHero />
            <FeaturedIn />
            <HowItWorks />
            <ScanResultPreview />
            <FeaturesShowcase />
            <PricingSection />
            <TrustBadges />
            <ShockingStats />
            <HiddenDangers />
            <MissionStatement />
            <WorstCaseScenarios />
            <FearTestimonials />
            <FAQSection />
            <FinalScareCTA />
            <Footer />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default Index;
