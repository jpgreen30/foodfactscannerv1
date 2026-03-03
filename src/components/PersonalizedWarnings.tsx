import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonalizedWarning {
  type: "allergy" | "health" | "dietary";
  severity: "low" | "medium" | "high" | "critical";
  ingredient: string | null;
  message: string;
}

interface PersonalizedWarningsProps {
  warnings: PersonalizedWarning[];
}

const severityConfig = {
  critical: {
    icon: XCircle,
    bgClass: "bg-danger-light",
    borderClass: "border-danger/30",
    textClass: "text-danger",
    label: "Critical"
  },
  high: {
    icon: AlertTriangle,
    bgClass: "bg-danger-light",
    borderClass: "border-danger/30",
    textClass: "text-danger",
    label: "High Risk"
  },
  medium: {
    icon: AlertCircle,
    bgClass: "bg-caution-light",
    borderClass: "border-caution/30",
    textClass: "text-caution",
    label: "Caution"
  },
  low: {
    icon: Info,
    bgClass: "bg-muted",
    borderClass: "border-border",
    textClass: "text-muted-foreground",
    label: "Info"
  }
};

const typeLabels = {
  allergy: "Allergy Alert",
  health: "Health Warning",
  dietary: "Dietary Alert"
};

export const PersonalizedWarnings = ({ warnings }: PersonalizedWarningsProps) => {
  // Filter out invalid warnings and sort by severity (critical first)
  const validWarnings = (warnings || []).filter(w => w && w.severity && w.message);
  const sortedWarnings = [...validWarnings].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });
  
  if (sortedWarnings.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-caution" />
        Personalized Warnings
      </h2>
      
      <div className="space-y-2">
        {sortedWarnings.map((warning, index) => {
          const config = severityConfig[warning.severity] || severityConfig.low;
          const Icon = config.icon;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border",
                config.bgClass,
                config.borderClass
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", config.textClass)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-xs font-semibold uppercase", config.textClass)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {typeLabels[warning.type]}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1">{warning.message}</p>
                {warning.ingredient && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Related to: <span className="font-medium">{warning.ingredient}</span>
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
