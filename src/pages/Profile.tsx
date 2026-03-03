import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ToxicExposuresSummary } from "@/components/ToxicExposuresSummary";
import { APIKeySection } from "@/components/profile/APIKeySection";
import { StreakBadge } from "@/components/StreakBadge";
import { AchievementBadges } from "@/components/AchievementBadges";
import { DailyChallenges } from "@/components/engagement/DailyChallenges";
import { useStreak } from "@/hooks/useStreak";
import { 
  User, 
  Heart, 
  Baby, 
  Wheat, 
  Milk, 
  Leaf, 
  Droplets,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Settings,
  Loader2,
  Crown,
  Sparkles,
  Skull,
  AlertTriangle,
  ShieldAlert,
  Users,
  FileText,
  BookOpen,
  Key,
  MessageCircle,
  Watch,
  Flame,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPaidSubscription, getTierDisplayName } from "@/lib/subscriptionUtils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string | null;
  email: string | null;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  is_pregnant: boolean;
  is_heart_healthy: boolean;
  is_diabetic: boolean;
  onboarding_completed: boolean;
  subscription_tier: string;
  health_conditions: string[];
  allergies_detailed: any;
  dietary_goals: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { streak } = useStreak();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({ scansThisWeek: 0, dangerousAvoided: 0 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWeeklyStats();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchWeeklyStats = async () => {
    if (!user) return;
    
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from("scan_history")
        .select("health_score, verdict")
        .eq("user_id", user.id)
        .gte("created_at", oneWeekAgo.toISOString());

      if (!error && data) {
        const dangerousAvoided = data.filter(scan => scan.verdict === "avoid").length;
        setWeeklyStats({
          scansThisWeek: data.length,
          dangerousAvoided,
        });
      }
    } catch (err) {
      console.error("Error fetching weekly stats:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, is_vegan, is_gluten_free, is_dairy_free, is_pregnant, is_heart_healthy, is_diabetic, onboarding_completed, subscription_tier, health_conditions, allergies_detailed, dietary_goals")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          ...data,
          health_conditions: (data.health_conditions as string[]) || [],
          allergies_detailed: data.allergies_detailed || null,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof Profile, value: boolean) => {
    if (!profile || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, [key]: value } : null);
    } catch (error) {
      console.error("Error updating preference:", error);
      toast({
        title: "Error",
        description: "Could not save preference",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast({
      title: "Signed out",
      description: "You have been signed out successfully"
    });
  };

  const dietaryOptions = [
    { key: "is_heart_healthy" as const, icon: Heart, label: "Heart Protection", desc: "Low sodium, healthy fats" },
    { key: "is_pregnant" as const, icon: Baby, label: "Pregnancy Safe", desc: "Avoid harmful ingredients" },
    { key: "is_gluten_free" as const, icon: Wheat, label: "Gluten-Free", desc: "No wheat or gluten" },
    { key: "is_dairy_free" as const, icon: Milk, label: "Dairy-Free", desc: "No milk products" },
    { key: "is_vegan" as const, icon: Leaf, label: "Vegan", desc: "No animal products" },
    { key: "is_diabetic" as const, icon: Droplets, label: "Low Sugar", desc: "Diabetic-friendly options" },
  ];

  const isPremium = hasPaidSubscription(profile?.subscription_tier);

  if (!user) {
    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-danger/10 rounded-xl border border-danger/30"
        >
          <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center">
            <Skull className="w-8 h-8 text-danger" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Unprotected</h1>
            <p className="text-sm text-muted-foreground">Sign in to set up your defense system</p>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm" className="border-danger text-danger hover:bg-danger/20">
              Sign In
            </Button>
          </Link>
        </motion.div>

        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Sign in to customize your health alerts and protect yourself from hidden dangers.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout containerClassName="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-danger" />
      </AppLayout>
    );
  }

  return (
    <AppLayout containerClassName="space-y-6">
      {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border"
        >
          <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-danger" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {profile?.display_name || "User"}
              </h1>
              {isPremium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  {getTierDisplayName(profile?.subscription_tier)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profile?.email || user.email}</p>
          </div>
        </motion.div>

        {/* Streak & Stats Section */}
        {streak && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-xl border border-amber-500/20 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
                  Your Streak
                </h2>
                <StreakBadge
                  currentStreak={streak.currentStreak}
                  longestStreak={streak.longestStreak}
                  totalScans={streak.totalScans}
                  size="md"
                  showTooltip={false}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{streak.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Current</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{streak.longestStreak}</p>
                  <p className="text-xs text-muted-foreground">Best</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{streak.totalScans}</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
              </div>

              {/* Weekly Stats */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-safe" />
                  <span className="text-sm font-medium text-foreground">This Week</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{weeklyStats.scansThisWeek}</p>
                      <p className="text-[10px] text-muted-foreground">Scans</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-danger" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{weeklyStats.dangerousAvoided}</p>
                      <p className="text-[10px] text-muted-foreground">Dangers Avoided</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Daily Challenges Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.07 }}
        >
          <Link to="/leaderboard">
            <DailyChallenges compact />
          </Link>
        </motion.section>

        {/* Achievements Section */}
        {streak && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="bg-muted/50 rounded-xl border border-border p-4"
          >
            <AchievementBadges
              currentStreak={streak.currentStreak}
              longestStreak={streak.longestStreak}
              totalScans={streak.totalScans}
              hasDangerDetection={weeklyStats.dangerousAvoided > 0}
              isPremium={isPremium}
            />
          </motion.section>
        )}

        {/* Subscription Banner */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Link to="/subscription">
              <div className="p-4 rounded-xl bg-gradient-to-r from-danger to-orange-600 text-white shadow-[0_0_30px_hsl(var(--danger)/0.4)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wide">Stop Eating Blind</p>
                      <p className="text-sm opacity-90">Get unlimited protection now</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Onboarding CTA */}
        {!profile?.onboarding_completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/onboarding">
              <div className="p-4 rounded-xl bg-caution/20 border border-caution/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-caution/30 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-caution" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">⚠️ Set Up Your Defense</p>
                      <p className="text-sm text-muted-foreground">Configure personalized danger alerts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Health Profile Summary */}
        {profile?.onboarding_completed && (profile?.health_conditions?.length > 0 || profile?.allergies_detailed?.items?.length > 0) && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-danger/10 rounded-xl border border-danger/30 overflow-hidden"
          >
            <div className="p-4 border-b border-danger/20">
              <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <Skull className="w-5 h-5 text-danger" />
                Vulnerabilities to Watch
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                We'll alert you when these dangers are detected
              </p>
            </div>
            <div className="p-4 space-y-3">
              {profile?.health_conditions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-danger mb-2">Health Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.health_conditions.map((condition) => (
                      <Badge key={condition} variant="destructive" className="capitalize bg-danger/20 text-danger border-danger/30">
                        {condition.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile?.allergies_detailed?.items?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-danger mb-2">⚠️ Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies_detailed.items.map((allergen: string) => (
                      <Badge key={allergen} variant="destructive" className="capitalize">
                        {allergen.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile?.dietary_goals && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Goal</p>
                  <Badge variant="outline" className="capitalize border-border text-foreground">
                    {profile.dietary_goals.replace(/_/g, " ")}
                  </Badge>
                </div>
              )}
              <Link to="/onboarding" className="block">
                <Button variant="ghost" size="sm" className="w-full mt-2 text-danger hover:bg-danger/20">
                  Edit Defense Settings
                </Button>
              </Link>
            </div>
          </motion.section>
        )}

        {/* Toxic Exposures Summary - Legal Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          <ToxicExposuresSummary />
        </motion.div>

        {/* Dietary Preferences */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-muted/50 rounded-xl border border-border overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg text-foreground">Quick Alerts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Toggle warnings for common dietary dangers
            </p>
          </div>
          <div className="divide-y divide-border">
            {dietaryOptions.map((option, index) => (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="flex items-center gap-4 p-4"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  profile?.[option.key] ? "bg-danger/20" : "bg-muted"
                )}>
                  <option.icon className={cn(
                    "w-5 h-5",
                    profile?.[option.key] ? "text-danger" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </div>
                <Switch
                  checked={profile?.[option.key] || false}
                  onCheckedChange={(checked) => updatePreference(option.key, checked)}
                  disabled={isSaving}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Settings */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-muted/50 rounded-xl border border-border overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg text-foreground">Settings</h2>
          </div>
          <div className="divide-y divide-border">
            <Link to="/subscription">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    {isPremium ? "Manage your protection plan" : "Upgrade for full protection"}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>

            <Link to="/family-profiles">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Family Profiles</p>
                  <p className="text-sm text-muted-foreground">
                    Manage family member health settings
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>

            <Link to="/notifications">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-danger" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Danger Alerts</p>
                  <p className="text-sm text-muted-foreground">Recall notifications & updates</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>

            <Link to="/saved-recipes">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-caution/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-caution" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Saved Recipes</p>
                  <p className="text-sm text-muted-foreground">Your personal recipe collection</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>

            <Link to="/ingredient-chat">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">AI Ingredient Chat</p>
                  <p className="text-sm text-muted-foreground">Ask about any ingredient (Pro)</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>

            <Link to="/health-reports">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Health Reports</p>
                  <p className="text-sm text-muted-foreground">Weekly AI-powered health summaries</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>
            
            <Link to="/privacy">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Privacy & Data</p>
                  <p className="text-sm text-muted-foreground">View privacy policy & your rights</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </Link>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">App Settings</p>
                <p className="text-sm text-muted-foreground">Theme, language, etc.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.section>

        {/* App Settings Sheet */}
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                App Settings
              </SheetTitle>
              <SheetDescription>
                Configure your app preferences
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch 
                  checked={document.documentElement.classList.contains('dark')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      document.documentElement.classList.add('dark');
                      localStorage.setItem('theme', 'dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      localStorage.setItem('theme', 'light');
                    }
                  }}
                />
              </div>

              {/* Clear Cache */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">Clear App Cache</p>
                    <p className="text-sm text-muted-foreground">Remove temporary data</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    toast({
                      title: "Cache Cleared",
                      description: "App cache has been cleared successfully.",
                    });
                  }}
                >
                  Clear Cache
                </Button>
              </div>

              {/* App Version */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground">App Version</p>
                <p className="text-sm text-muted-foreground">v1.0.0</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* API Access - Pro Only */}
        {profile?.subscription_tier === "pro" && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-muted/50 rounded-xl border border-border overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                API Access
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Access your data programmatically
              </p>
            </div>
            <div className="p-4">
              <APIKeySection />
            </div>
          </motion.section>
        )}

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            variant="ghost" 
            className="w-full gap-2 text-danger hover:text-danger hover:bg-danger/20"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground py-4"
        >
          <p>FoodFact Scanner v1.0.0</p>
          <p className="mt-1">Protecting your health, one scan at a time</p>
        </motion.div>
    </AppLayout>
  );
};

export default Profile;