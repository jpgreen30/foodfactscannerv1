import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Ingredient {
  name: string;
  definition: string;
  purpose: string;
  isNatural: boolean;
  riskLevel: "safe" | "low" | "moderate" | "high" | "caution" | "danger";
  healthConcerns?: string[];
  regulatoryStatus?: string;
  iarcClassification?: string;
}

interface IngredientCardProps {
  ingredient: Ingredient;
  index: number;
}

export const IngredientCard = ({ ingredient, index }: IngredientCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if there's any meaningful content to display
  const hasContent = 
    (ingredient.definition && ingredient.definition.trim()) ||
    (ingredient.purpose && ingredient.purpose.trim()) ||
    (ingredient.healthConcerns && ingredient.healthConcerns.length > 0) ||
    (ingredient.regulatoryStatus && ingredient.regulatoryStatus.trim()) ||
    (ingredient.iarcClassification && ingredient.iarcClassification.trim());

  const getRiskIcon = () => {
    switch (ingredient.riskLevel) {
      case "safe":
      case "low":
        return <CheckCircle className="w-5 h-5 text-safe" />;
      case "caution":
      case "moderate":
        return <AlertTriangle className="w-5 h-5 text-caution" />;
      case "danger":
      case "high":
        return <XCircle className="w-5 h-5 text-danger" />;
    }
  };

  const getRiskBadge = () => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium";
    switch (ingredient.riskLevel) {
      case "safe":
      case "low":
        return <span className={cn(baseClasses, "bg-safe-light text-safe")}>Safe</span>;
      case "caution":
      case "moderate":
        return <span className={cn(baseClasses, "bg-caution-light text-caution")}>Caution</span>;
      case "danger":
      case "high":
        return <span className={cn(baseClasses, "bg-danger-light text-danger")}>Avoid</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-card rounded-xl border shadow-sm overflow-hidden transition-all duration-200",
        isExpanded && "shadow-md"
      )}
    >
      <div
        onClick={() => hasContent && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-4 text-left transition-colors",
          hasContent && "hover:bg-muted/30 cursor-pointer"
        )}
      >
        <div className="flex items-center gap-3">
          {getRiskIcon()}
          <div>
            <h4 className="font-semibold text-card-foreground">{ingredient.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              {getRiskBadge()}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs",
                ingredient.isNatural 
                  ? "bg-primary-light text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                {ingredient.isNatural ? "Natural" : "Synthetic"}
              </span>
            </div>
          </div>
        </div>
        {hasContent && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50">
              {ingredient.definition && ingredient.definition.trim() && (
                <div className="pt-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">What is it?</p>
                      <p className="text-sm text-muted-foreground">{ingredient.definition}</p>
                    </div>
                  </div>
                </div>
              )}

              {ingredient.purpose && ingredient.purpose.trim() && (
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Why is it used?</p>
                    <p className="text-sm text-muted-foreground">{ingredient.purpose}</p>
                  </div>
                </div>
              )}

              {ingredient.healthConcerns && ingredient.healthConcerns.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-caution mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Health Concerns</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {ingredient.healthConcerns.map((concern, i) => (
                        <li key={i}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {ingredient.regulatoryStatus && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  <span className="font-medium">Regulatory Status:</span> {ingredient.regulatoryStatus}
                </div>
              )}

              {ingredient.iarcClassification && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  <span className="font-medium">IARC Classification:</span> {ingredient.iarcClassification}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
