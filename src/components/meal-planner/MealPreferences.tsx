import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  ChefHat,
  Clock,
  Flame,
  DollarSign,
  Dumbbell,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MealPreferencesData {
  skillLevel: "beginner" | "intermediate" | "advanced";
  maxPrepTime: number;
  calorieTarget: number | null;
  proteinTarget: number | null;
  budgetPreference: "budget" | "moderate" | "premium";
}

interface MealPreferencesProps {
  preferences: MealPreferencesData;
  onChange: (preferences: MealPreferencesData) => void;
}

const skillLevels = [
  { value: "beginner", label: "Beginner", icon: ChefHat, description: "Simple recipes, basic techniques" },
  { value: "intermediate", label: "Intermediate", icon: ChefHat, description: "Moderate complexity" },
  { value: "advanced", label: "Advanced", icon: ChefHat, description: "Complex techniques welcome" },
] as const;

const timeOptions = [
  { value: 15, label: "15 min", icon: Zap },
  { value: 30, label: "30 min", icon: Clock },
  { value: 45, label: "45 min", icon: Clock },
  { value: 60, label: "60+ min", icon: Clock },
] as const;

const budgetOptions = [
  { value: "budget", label: "Budget", icon: DollarSign, description: "Cost-effective" },
  { value: "moderate", label: "Moderate", icon: DollarSign, description: "Balanced" },
  { value: "premium", label: "Premium", icon: DollarSign, description: "Quality first" },
] as const;

export const MealPreferences = ({ preferences, onChange }: MealPreferencesProps) => {
  const [showMacros, setShowMacros] = useState(
    preferences.calorieTarget !== null || preferences.proteinTarget !== null
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-5"
    >
      {/* Skill Level */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ChefHat className="w-4 h-4" />
          Cooking Skill Level
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {skillLevels.map((skill) => (
            <Button
              key={skill.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...preferences, skillLevel: skill.value })}
              className={cn(
                "h-auto py-2 px-3 flex flex-col items-center gap-1 transition-all",
                preferences.skillLevel === skill.value
                  ? "border-caution bg-caution/20 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-xs font-medium">{skill.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Max Prep Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Maximum Prep Time
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {timeOptions.map((time) => (
            <Button
              key={time.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...preferences, maxPrepTime: time.value })}
              className={cn(
                "h-auto py-2 px-3 flex flex-col items-center gap-1 transition-all",
                preferences.maxPrepTime === time.value
                  ? "border-caution bg-caution/20 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <time.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{time.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Budget Preference
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {budgetOptions.map((budget) => (
            <Button
              key={budget.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...preferences, budgetPreference: budget.value })}
              className={cn(
                "h-auto py-2 px-3 flex flex-col items-center gap-1 transition-all",
                preferences.budgetPreference === budget.value
                  ? "border-caution bg-caution/20 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-xs font-medium">{budget.label}</span>
              <span className="text-[10px] text-muted-foreground">{budget.description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Macro Targets Toggle */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowMacros(!showMacros);
            if (showMacros) {
              onChange({ ...preferences, calorieTarget: null, proteinTarget: null });
            }
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-muted gap-2"
        >
          <Dumbbell className="w-4 h-4" />
          {showMacros ? "Hide Macro Targets" : "Add Calorie/Protein Goals"}
        </Button>

        {showMacros && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border"
          >
            {/* Calorie Target */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Flame className="w-4 h-4 text-caution" />
                  Calories per meal
                </Label>
                <Badge variant="outline" className="border-border text-foreground">
                  {preferences.calorieTarget ?? "Any"}
                </Badge>
              </div>
              <Slider
                value={[preferences.calorieTarget ?? 500]}
                onValueChange={([val]) => onChange({ ...preferences, calorieTarget: val })}
                min={200}
                max={1000}
                step={50}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>200</span>
                <span>1000</span>
              </div>
            </div>

            {/* Protein Target */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  Protein per meal
                </Label>
                <Badge variant="outline" className="border-border text-foreground">
                  {preferences.proteinTarget ? `${preferences.proteinTarget}g` : "Any"}
                </Badge>
              </div>
              <Slider
                value={[preferences.proteinTarget ?? 30]}
                onValueChange={([val]) => onChange({ ...preferences, proteinTarget: val })}
                min={10}
                max={60}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10g</span>
                <span>60g</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
