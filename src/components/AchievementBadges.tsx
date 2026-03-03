import { motion } from "framer-motion";
import { 
  Flame, 
  Scan, 
  ShieldCheck, 
  Crown, 
  Trophy,
  Target,
  Zap,
  Star,
  Heart,
  Users,
  Calendar,
  Award,
  Medal,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  requirement: number;
  type: "streak" | "scans" | "danger" | "premium" | "social" | "milestone";
  tier: "bronze" | "silver" | "gold" | "platinum";
}

const achievements: Achievement[] = [
  // Streak badges
  {
    id: "streak_3",
    name: "Streak Starter",
    description: "3-day scanning streak",
    icon: Flame,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    requirement: 3,
    type: "streak",
    tier: "bronze",
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "7-day scanning streak",
    icon: Flame,
    color: "text-slate-400",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    requirement: 7,
    type: "streak",
    tier: "silver",
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    description: "14-day scanning streak",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    requirement: 14,
    type: "streak",
    tier: "silver",
  },
  {
    id: "streak_30",
    name: "Consistency King",
    description: "30-day scanning streak",
    icon: Flame,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-400",
    requirement: 30,
    type: "streak",
    tier: "gold",
  },
  {
    id: "streak_100",
    name: "Legendary Streak",
    description: "100-day scanning streak",
    icon: Trophy,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-400",
    requirement: 100,
    type: "streak",
    tier: "platinum",
  },
  // Scan count badges
  {
    id: "scans_10",
    name: "First Steps",
    description: "10 products scanned",
    icon: Scan,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    requirement: 10,
    type: "scans",
    tier: "bronze",
  },
  {
    id: "scans_50",
    name: "Power Scanner",
    description: "50 products scanned",
    icon: Target,
    color: "text-slate-400",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
    requirement: 50,
    type: "scans",
    tier: "silver",
  },
  {
    id: "scans_100",
    name: "Scan Master",
    description: "100 products scanned",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-400",
    requirement: 100,
    type: "scans",
    tier: "gold",
  },
  {
    id: "scans_500",
    name: "Health Guardian",
    description: "500 products scanned",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-400",
    requirement: 500,
    type: "scans",
    tier: "platinum",
  },
  {
    id: "scans_1000",
    name: "Scan Legend",
    description: "1000 products scanned",
    icon: Award,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-500",
    requirement: 1000,
    type: "scans",
    tier: "platinum",
  },
  // Special badges
  {
    id: "danger_detector",
    name: "Danger Detector",
    description: "Found a dangerous product",
    icon: ShieldCheck,
    color: "text-red-500",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    requirement: 1,
    type: "danger",
    tier: "bronze",
  },
  {
    id: "danger_hunter",
    name: "Danger Hunter",
    description: "Found 10 dangerous products",
    icon: ShieldCheck,
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-400",
    requirement: 10,
    type: "danger",
    tier: "silver",
  },
  {
    id: "family_protector",
    name: "Family Protector",
    description: "Avoided 25 harmful products",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-100",
    borderColor: "border-pink-400",
    requirement: 25,
    type: "danger",
    tier: "gold",
  },
  {
    id: "premium_member",
    name: "Premium Guardian",
    description: "Upgraded to Premium",
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    requirement: 1,
    type: "premium",
    tier: "platinum",
  },
  // Social badges
  {
    id: "community_member",
    name: "Community Member",
    description: "Joined the community",
    icon: Users,
    color: "text-cyan-500",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-300",
    requirement: 1,
    type: "social",
    tier: "bronze",
  },
  // Milestone badges
  {
    id: "early_adopter",
    name: "Early Adopter",
    description: "One of the first to join",
    icon: Star,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-400",
    requirement: 1,
    type: "milestone",
    tier: "gold",
  },
];

interface AchievementBadgesProps {
  currentStreak: number;
  longestStreak: number;
  totalScans: number;
  hasDangerDetection?: boolean;
  isPremium?: boolean;
  compact?: boolean;
}

export const AchievementBadges = ({
  currentStreak,
  longestStreak,
  totalScans,
  hasDangerDetection = false,
  isPremium = false,
  compact = false,
}: AchievementBadgesProps) => {
  const isAchievementEarned = (achievement: Achievement): boolean => {
    switch (achievement.type) {
      case "streak":
        return longestStreak >= achievement.requirement;
      case "scans":
        return totalScans >= achievement.requirement;
      case "danger":
        return hasDangerDetection;
      case "premium":
        return isPremium;
      default:
        return false;
    }
  };

  const getProgress = (achievement: Achievement): number => {
    switch (achievement.type) {
      case "streak":
        return Math.min(100, (longestStreak / achievement.requirement) * 100);
      case "scans":
        return Math.min(100, (totalScans / achievement.requirement) * 100);
      case "danger":
        return hasDangerDetection ? 100 : 0;
      case "premium":
        return isPremium ? 100 : 0;
      default:
        return 0;
    }
  };

  const earnedCount = achievements.filter(isAchievementEarned).length;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {achievements.map((achievement) => {
          const earned = isAchievementEarned(achievement);
          const Icon = achievement.icon;
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                earned
                  ? cn(achievement.bgColor, achievement.borderColor)
                  : "bg-card border-border opacity-60"
              )}
              title={`${achievement.name}: ${achievement.description}`}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  earned ? achievement.color : "text-muted-foreground"
                )}
                fill={earned && achievement.type === "streak" ? "currentColor" : "none"}
              />
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Achievements
        </h3>
        <Badge variant="secondary" className="text-xs">
          {earnedCount} / {achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement, index) => {
          const earned = isAchievementEarned(achievement);
          const progress = getProgress(achievement);
          const Icon = achievement.icon;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all",
                earned
                  ? cn(achievement.bgColor, achievement.borderColor, "shadow-sm")
                  : "bg-card border-border"
              )}
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    earned ? "bg-background/50" : "bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      earned ? achievement.color : "text-muted-foreground"
                    )}
                    fill={earned && achievement.type === "streak" ? "currentColor" : "none"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-medium text-sm truncate",
                      earned ? "text-foreground" : "text-foreground/70"
                    )}
                  >
                    {achievement.name}
                  </p>
                  <p
                    className={cn(
                      "text-xs truncate",
                      earned ? "text-muted-foreground" : "text-muted-foreground"
                    )}
                  >
                    {achievement.description}
                  </p>
                </div>
              </div>

              {/* Progress bar for unearned achievements */}
              {!earned && progress > 0 && (
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary/50 rounded-full"
                  />
                </div>
              )}

              {/* Earned checkmark */}
              {earned && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-safe rounded-full flex items-center justify-center"
                >
                  <Star className="w-3 h-3 text-white fill-white" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
