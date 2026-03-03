import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChefHat,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Meal {
  id: string;
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  prepTime?: string;
  calories?: number;
}

interface DayMeals {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snacks?: Meal[];
}

interface WeekPlan {
  [key: string]: DayMeals;
}

interface WeeklyCalendarProps {
  onAddMeal: (day: string, mealType: string) => void;
  onSelectMeal: (meal: Meal) => void;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const WeeklyCalendar = ({ onAddMeal, onSelectMeal }: WeeklyCalendarProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWeekPlan();
    }
  }, [user, weekStart]);

  const fetchWeekPlan = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", format(weekStart, "yyyy-MM-dd"))
        .maybeSingle();

      if (error) throw error;

      if (data?.meals) {
        setWeekPlan(data.meals as WeekPlan);
      } else {
        setWeekPlan({});
      }
    } catch (error) {
      console.error("Error fetching meal plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeMeal = async (day: string, mealType: string) => {
    if (!user) return;

    const updatedPlan = { ...weekPlan };
    if (updatedPlan[day]) {
      delete (updatedPlan[day] as any)[mealType];
      if (Object.keys(updatedPlan[day]).length === 0) {
        delete updatedPlan[day];
      }
    }

    try {
      const { error } = await supabase
        .from("meal_plans")
        .upsert(
          {
            user_id: user.id,
            week_start: format(weekStart, "yyyy-MM-dd"),
            meals: updatedPlan as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,week_start" }
        );

      if (error) throw error;

      setWeekPlan(updatedPlan);
      toast({
        title: "Meal removed",
        description: "Your meal plan has been updated",
      });
    } catch (error) {
      console.error("Error removing meal:", error);
      toast({
        title: "Error",
        description: "Could not remove meal",
        variant: "destructive",
      });
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-caution/20 text-caution border-caution/30";
      case "lunch":
        return "bg-safe/20 text-safe border-safe/30";
      case "dinner":
        return "bg-primary/20 text-primary border-primary/30";
      default:
        return "bg-muted/50 text-foreground border-border";
    }
  };

  const navigateWeek = (direction: number) => {
    setWeekStart((prev) => addDays(prev, direction * 7));
  };

  const isToday = (dayIndex: number) => {
    const dayDate = addDays(weekStart, dayIndex);
    return isSameDay(dayDate, new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-caution" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek(-1)}
          className="text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h3 className="font-bold text-foreground flex items-center gap-2 justify-center">
            <Calendar className="w-4 h-4" />
            Week of {format(weekStart, "MMM d, yyyy")}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek(1)}
          className="text-muted-foreground hover:bg-muted"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2 overflow-x-auto">
        {DAYS.map((day, dayIndex) => {
          const dayMeals = weekPlan[day] || {};
          const dayDate = addDays(weekStart, dayIndex);

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
              className={cn(
                "p-3 rounded-xl border transition-colors",
                isToday(dayIndex)
                  ? "bg-caution/10 border-caution/30"
                  : "bg-muted/30 border-border"
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold capitalize",
                      isToday(dayIndex) ? "text-caution" : "text-foreground"
                    )}
                  >
                    {day}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(dayDate, "MMM d")}
                  </span>
                  {isToday(dayIndex) && (
                    <Badge className="bg-caution/20 text-caution text-xs">Today</Badge>
                  )}
                </div>
              </div>

              {/* Meals Row */}
              <div className="grid grid-cols-3 gap-2">
                {MEAL_TYPES.map((mealType) => {
                  const meal = dayMeals[mealType as keyof DayMeals] as Meal | undefined;

                  return (
                    <div
                      key={mealType}
                      className={cn(
                        "p-2 rounded-lg border min-h-[60px] transition-all",
                        meal
                          ? getMealTypeColor(mealType)
                          : "border-dashed border-border hover:border-muted-foreground"
                      )}
                    >
                      {meal ? (
                        <div className="relative group">
                          <button
                            onClick={() => onSelectMeal(meal)}
                            className="w-full text-left"
                          >
                            <p className="text-xs font-medium truncate">{meal.name}</p>
                            {meal.calories && (
                              <p className="text-[10px] opacity-70 flex items-center gap-1 mt-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                {meal.calories} cal
                              </p>
                            )}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMeal(day, mealType)}
                            className="absolute -top-1 -right-1 w-5 h-5 opacity-0 group-hover:opacity-100 bg-danger/80 hover:bg-danger text-foreground rounded-full transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddMeal(day, mealType)}
                          className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[10px] capitalize">{mealType}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Week Stats */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-xl border border-border">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {Object.values(weekPlan).reduce(
              (acc, day) => acc + Object.keys(day).length,
              0
            )}
          </p>
          <p className="text-xs text-muted-foreground">Meals Planned</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {Object.keys(weekPlan).length}
          </p>
          <p className="text-xs text-muted-foreground">Days Filled</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {7 * 3 - Object.values(weekPlan).reduce(
              (acc, day) => acc + Object.keys(day).length,
              0
            )}
          </p>
          <p className="text-xs text-muted-foreground">Slots Open</p>
        </div>
      </div>
    </motion.div>
  );
};
