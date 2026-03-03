import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Scan, History, User, ShoppingCart, Shield, Crown, Pill, Users, Trophy, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StreakBadge } from "@/components/StreakBadge";
import { useStreak } from "@/hooks/useStreak";
import { CreditsCounter } from "@/components/UpgradePrompt";
import { hasPaidSubscription } from "@/lib/subscriptionUtils";
import { NotificationBell } from "@/components/community/NotificationBell";
import { useIsMobile } from "@/hooks/use-mobile";

export const Header = () => {
  const location = useLocation();
  const { streak } = useStreak();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dailyScanCount, setDailyScanCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchUserData();
    } else {
      setIsAdmin(false);
      setDailyScanCount(0);
      setSubscriptionTier(null);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc("is_admin");
      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchUserData = async () => {
    try {
      // Fetch total scan count (lifetime for free trial)
      const { data: totalScans } = await supabase.rpc("get_total_scan_count");
      setDailyScanCount(totalScans || 0);
      
      // Fetch subscription tier
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();
      
      setSubscriptionTier(profile?.subscription_tier || null);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const isPremium = hasPaidSubscription(subscriptionTier);
  const scansRemaining = 10 - dailyScanCount; // 10 lifetime scans for free trial

  // Desktop navigation items (shown in header on desktop)
  const desktopNavItems = [
    { path: "/scanner", icon: Scan, label: "Scan", isPro: false },
    { path: "/blog", icon: BookOpen, label: "Blog", isPro: false },
    { path: "/community", icon: Users, label: "Feed", isPro: false },
    { path: "/leaderboard", icon: Trophy, label: "Rewards", isPro: false },
    { path: "/shopping-analyzer", icon: ShoppingCart, label: "Shop", isPro: false },
    { path: "/medications", icon: Pill, label: "Meds", isPro: false },
    { path: "/history", icon: History, label: "History", isPro: false },
    { path: "/profile", icon: User, label: "Profile", isPro: false },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Streak + Credits */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity" title="Go to Home">
              <Logo size={isMobile ? "sm" : "md"} />
            </Link>
            {/* Streak Badge */}
            {streak && streak.currentStreak > 0 && (
              <StreakBadge
                currentStreak={streak.currentStreak}
                longestStreak={streak.longestStreak}
                totalScans={streak.totalScans}
                size="sm"
              />
            )}
            {/* Credits Counter - Only for free users */}
            {user && !isPremium && (
              <CreditsCounter creditsRemaining={Math.max(0, scansRemaining)} maxCredits={10} />
            )}
          </div>

          {/* Right: Mobile shows only notification bell, Desktop shows full nav */}
          <nav className="flex items-center gap-1">
            {/* Notification Bell - Always visible */}
            <NotificationBell />
            
            {/* Desktop Navigation - Hidden on mobile */}
            {!isMobile && (
              <>
                {desktopNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "relative px-3 py-2 rounded-lg transition-colors",
                        isActive 
                          ? "text-danger" 
                          : "text-muted-foreground hover:text-foreground hover:bg-danger/10"
                      )}
                    >
                      <div className="relative">
                        <item.icon className="w-5 h-5" />
                        {item.isPro && (
                          <Crown className="w-3 h-3 text-amber-500 absolute -top-1.5 -right-1.5 fill-amber-500" />
                        )}
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-danger shadow-[0_0_8px_hsl(var(--danger))]"
                        />
                      )}
                    </Link>
                  );
                })}
                
                {/* Admin Link - Only visible to admins on desktop */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={cn(
                      "relative px-3 py-2 rounded-lg transition-colors",
                      location.pathname === "/admin"
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                    )}
                  >
                    <Shield className="w-5 h-5" />
                    {location.pathname === "/admin" && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                      />
                    )}
                  </Link>
                )}
              </>
            )}
            
            {/* Mobile: Admin link shown as icon */}
            {isMobile && isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "relative px-3 py-2 rounded-lg transition-colors",
                  location.pathname === "/admin"
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                )}
              >
                <Shield className="w-5 h-5" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
