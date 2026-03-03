import { motion } from "framer-motion";
import { Leaf, Wheat, Milk, Baby, Heart, Droplets, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DietaryFlag {
  label: string;
  isCompatible: boolean;
  icon: "vegan" | "gluten" | "dairy" | "pregnancy" | "heart" | "diabetes";
}

interface DietaryFlagsProps {
  flags: DietaryFlag[];
}

const iconMap = {
  vegan: Leaf,
  gluten: Wheat,
  dairy: Milk,
  pregnancy: Baby,
  heart: Heart,
  diabetes: Droplets,
};

export const DietaryFlags = ({ flags }: DietaryFlagsProps) => {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-4">
      <h3 className="font-semibold text-lg mb-4 text-card-foreground">Dietary Compatibility</h3>
      <div className="grid grid-cols-2 gap-3">
        {flags.map((flag, index) => {
          const Icon = iconMap[flag.icon];
          return (
            <motion.div
              key={flag.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border",
                flag.isCompatible
                  ? "bg-safe-light border-safe/30"
                  : "bg-muted border-border"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                flag.isCompatible ? "text-safe" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium flex-1",
                flag.isCompatible ? "text-safe" : "text-muted-foreground"
              )}>
                {flag.label}
              </span>
              {flag.isCompatible ? (
                <Check className="w-4 h-4 text-safe" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
