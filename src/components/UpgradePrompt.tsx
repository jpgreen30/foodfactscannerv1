import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Crown, 
  X, 
  Zap, 
  Shield, 
  Flame, 
  AlertTriangle,
  Sparkles,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PromptVariant = 
  | "feature-locked"
  | "limit-warning"
  | "value-proposition"
  | "streak-milestone"
  | "dangerous-product";

interface UpgradePromptProps {
  variant: PromptVariant;
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  scanCount?: number;
  streakDays?: number;
  toxicCount?: number;
}

const variantConfig = {
  "feature-locked": {
    icon: Crown,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/20",
    title: "Premium Feature",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
  },
  "limit-warning": {
    icon: AlertTriangle,
    iconColor: "text-caution",
    iconBg: "bg-caution/20",
    title: "Running Low",
    gradient: "from-caution/20 via-orange-500/10 to-transparent",
  },
  "value-proposition": {
    icon: Shield,
    iconColor: "text-danger",
    iconBg: "bg-danger/20",
    title: "Stay Protected",
    gradient: "from-danger/20 via-red-500/10 to-transparent",
  },
  "streak-milestone": {
    icon: Flame,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-500/20",
    title: "🔥 Streak Milestone!",
    gradient: "from-orange-500/20 via-amber-500/10 to-transparent",
  },
  "dangerous-product": {
    icon: Zap,
    iconColor: "text-danger",
    iconBg: "bg-danger/20",
    title: "Danger Detected!",
    gradient: "from-danger/20 via-red-500/10 to-transparent",
  },
};

const premiumBenefits = [
  "Unlimited product scans",
  "AI-powered health insights",
  "Family profiles (up to 5)",
  "Priority recall alerts",
  "Personalized meal plans",
];

export const UpgradePrompt = ({
  variant,
  isOpen,
  onClose,
  featureName,
  scanCount,
  streakDays,
  toxicCount,
}: UpgradePromptProps) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const getDescription = () => {
    switch (variant) {
      case "feature-locked":
        return `${featureName || "This feature"} is available exclusively for paid subscribers. Upgrade now to unlock AI-powered health insights!`;
      case "limit-warning":
        return `You've used ${scanCount || 7} of your 10 free trial scans. Subscribe for unlimited protection!`;
      case "value-proposition":
        return `You've discovered ${toxicCount || 1} toxic ingredients. Subscribers get instant alerts and personalized recommendations.`;
      case "streak-milestone":
        return `Amazing! You're on a ${streakDays || 7}-day streak! Protect your progress with unlimited scans.`;
      case "dangerous-product":
        return `This product contains ingredients that may harm your health. Subscribers get detailed analysis and safer alternatives.`;
      default:
        return "Subscribe for the full experience.";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Header with gradient */}
            <div className={cn("p-6 pb-4 bg-gradient-to-b", config.gradient)}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.iconBg)}>
                  <Icon className={cn("w-6 h-6", config.iconColor)} fill={variant === "streak-milestone" ? "currentColor" : "none"} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{config.title}</h3>
                  <p className="text-sm text-muted-foreground">Unlock Premium</p>
                </div>
              </div>

              <p className="text-muted-foreground">{getDescription()}</p>
            </div>

            {/* Benefits list */}
            <div className="px-6 py-4 space-y-2">
              {premiumBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-safe/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-safe" />
                  </div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="p-6 pt-2 space-y-3">
              <Link to="/subscription" onClick={onClose}>
                <Button className="w-full bg-gradient-to-r from-danger to-orange-500 hover:from-danger/90 hover:to-orange-500/90 text-white shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onClose}
              >
                Maybe later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Inline teaser component for scan results
export const PremiumTeaser = ({ className }: { className?: string }) => {
  return (
    <Link to="/subscription">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 cursor-pointer",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground">
            Unlock Premium Insights
          </span>
          <Sparkles className="w-3 h-3 text-amber-500 ml-auto" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Get detailed analysis, alternatives & more
        </p>
      </motion.div>
    </Link>
  );
};

// Credits counter badge for header
interface CreditsCounterProps {
  creditsRemaining: number;
  maxCredits?: number;
}

export const CreditsCounter = ({ creditsRemaining, maxCredits = 10 }: CreditsCounterProps) => {
  const isLow = creditsRemaining <= 3;
  const isEmpty = creditsRemaining <= 0;

  if (creditsRemaining >= maxCredits) return null;

  return (
    <Link to="/subscription">
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-transform hover:scale-105",
          isEmpty
            ? "bg-danger/20 text-danger border-danger/30"
            : isLow
            ? "bg-caution/20 text-caution border-caution/30"
            : "bg-muted text-muted-foreground border-border"
        )}
      >
        <Zap className="w-3 h-3" />
        <span>{creditsRemaining}/{maxCredits}</span>
      </div>
    </Link>
  );
};
