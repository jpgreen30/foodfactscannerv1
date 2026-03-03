import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const HealthScore = ({ score, size = "md", showLabel = true }: HealthScoreProps) => {
  const getScoreColor = () => {
    if (score >= 70) return "safe";
    if (score >= 40) return "caution";
    return "danger";
  };

  const getVerdict = () => {
    if (score >= 70) return "Healthy";
    if (score >= 40) return "Caution";
    return "Avoid";
  };

  const colorClass = getScoreColor();
  
  const sizeClasses = {
    sm: "w-16 h-16 text-lg",
    md: "w-24 h-24 text-2xl",
    lg: "w-32 h-32 text-4xl",
  };

  const strokeWidth = size === "sm" ? 4 : size === "md" ? 6 : 8;
  const radius = size === "sm" ? 28 : size === "md" ? 42 : 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              colorClass === "safe" && "text-safe",
              colorClass === "caution" && "text-caution",
              colorClass === "danger" && "text-danger"
            )}
          />
        </svg>
        <motion.span 
          className="font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {score}
        </motion.span>
      </div>
      {showLabel && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={cn(
            "font-semibold text-sm px-3 py-1 rounded-full",
            colorClass === "safe" && "bg-safe-light text-safe",
            colorClass === "caution" && "bg-caution-light text-caution",
            colorClass === "danger" && "bg-danger-light text-danger"
          )}
        >
          {getVerdict()}
        </motion.span>
      )}
    </div>
  );
};
