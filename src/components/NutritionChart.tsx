import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NutritionItem {
  label: string;
  value: number;
  unit: string;
  dailyValue?: number;
}

interface NutritionChartProps {
  items: NutritionItem[];
}

export const NutritionChart = ({ items }: NutritionChartProps) => {
  const getBarColor = (dailyValue?: number) => {
    if (!dailyValue) return "bg-primary";
    if (dailyValue <= 20) return "bg-safe";
    if (dailyValue <= 50) return "bg-caution";
    return "bg-danger";
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm p-4">
      <h3 className="font-semibold text-lg mb-4 text-card-foreground">Nutrition Facts</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1"
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">{item.label}</span>
              <span className="text-muted-foreground">
                {item.value}{item.unit}
                {item.dailyValue && (
                  <span className="ml-1">({item.dailyValue}% DV)</span>
                )}
              </span>
            </div>
            {item.dailyValue && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.dailyValue, 100)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn("h-full rounded-full", getBarColor(item.dailyValue))}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
