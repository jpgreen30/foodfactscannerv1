import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak?: number;
  totalScans?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  animate?: boolean;
}

export const StreakBadge = ({
  currentStreak,
  longestStreak = 0,
  totalScans = 0,
  size = "sm",
  showTooltip = true,
  animate = true,
}: StreakBadgeProps) => {
  // Determine flame color based on streak length
  const getFlameColor = () => {
    if (currentStreak >= 30) return "text-purple-500";
    if (currentStreak >= 14) return "text-amber-500";
    if (currentStreak >= 7) return "text-orange-500";
    if (currentStreak >= 3) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getFlameGlow = () => {
    if (currentStreak >= 30) return "drop-shadow-[0_0_8px_hsl(280,70%,50%)]";
    if (currentStreak >= 14) return "drop-shadow-[0_0_8px_hsl(45,90%,50%)]";
    if (currentStreak >= 7) return "drop-shadow-[0_0_6px_hsl(30,90%,50%)]";
    if (currentStreak >= 3) return "drop-shadow-[0_0_4px_hsl(50,90%,50%)]";
    return "";
  };

  const sizeClasses = {
    sm: "h-6 gap-1 text-xs px-2",
    md: "h-8 gap-1.5 text-sm px-3",
    lg: "h-10 gap-2 text-base px-4",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const badge = (
    <motion.div
      className={cn(
        "inline-flex items-center rounded-full bg-background/80 border border-border/50 backdrop-blur-sm",
        sizeClasses[size],
        currentStreak > 0 && "border-amber-500/30 bg-amber-500/10"
      )}
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <motion.div
        animate={
          currentStreak >= 3 && animate
            ? {
                y: [0, -2, 0],
                scale: [1, 1.1, 1],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Flame
          className={cn(
            iconSizes[size],
            getFlameColor(),
            currentStreak >= 3 && getFlameGlow()
          )}
          fill={currentStreak >= 3 ? "currentColor" : "none"}
        />
      </motion.div>
      <span
        className={cn(
          "font-semibold",
          currentStreak > 0 ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {currentStreak}
      </span>
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex">{badge}</div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-center">
        <p className="font-semibold">
          {currentStreak > 0
            ? `🔥 ${currentStreak} Day Streak!`
            : "Start your streak!"}
        </p>
        {longestStreak > 0 && (
          <p className="text-xs text-muted-foreground">
            Best: {longestStreak} days
          </p>
        )}
        {totalScans > 0 && (
          <p className="text-xs text-muted-foreground">
            Total scans: {totalScans}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
