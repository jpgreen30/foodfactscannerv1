import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useShoppingList, convertToShoppingItems } from "@/hooks/useShoppingList";
import { InteractiveShoppingList } from "@/components/meal-planner/InteractiveShoppingList";
import {
  ChefHat,
  Loader2,
  Lock,
  Clock,
  Users,
  Flame,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingCart,
  Lightbulb,
  Crown,
  Heart,
  Baby,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Ingredient {
  item: string;
  amount: string;
  notes?: string;
}

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Meal {
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: string;
  cookTime: string;
  servings: number;
  safetyScore: number;
  babyFriendly?: boolean;
  babyModifications?: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  healthBenefits: string[];
  warnings: string[];
}

interface RecallWarning {
  ingredient: string;
  recalls: {
    brand: string;
    reason: string;
    classification: string;
  }[];
}

interface MealPlan {
  meals: Meal[];
  shoppingList: string[];
  tips: string[];
  recallWarnings?: RecallWarning[];
}

const MealPlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getEffectiveTier } = useDebug();
  
  const [ingredients, setIngredients] = useState("");
  const [mealCount, setMealCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<number | null>(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [savedMeals, setSavedMeals] = useState<Set<number>>(new Set());
  const [savingMeal, setSavingMeal] = useState<number | null>(null);
  const [recentIngredients, setRecentIngredients] = useState<string[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  
  // Interactive shopping list hook
  const {
    items: shoppingItems,
    setShoppingList,
    toggleItem,
    removeItem,
    addItem,
    clearChecked,
  } = useShoppingList();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRecentScans();
    }
  }, [user]);

  // Auto-generate recipe when coming from meal suggestions
  useEffect(() => {
    const requestedRecipe = searchParams.get("recipe");
    const requestedType = searchParams.get("type");
    
    if (requestedRecipe && user && userProfile) {
      // Clear the URL params immediately to prevent re-triggering
      setSearchParams({});
      
      // Set the recipe name as the ingredient input
      setIngredients(requestedRecipe);
      setMealCount(1);
      
      // Auto-generate the specific recipe
      handleGenerateSpecificRecipe(requestedRecipe, requestedType);
    }
  }, [searchParams, user, userProfile]);

  const handleGenerateSpecificRecipe = async (recipeName: string, mealType: string | null) => {
    setIsGenerating(true);
    setMealPlan(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
        body: { 
          ingredients: recipeName,
          mealCount: 1,
          userProfile,
          specificRecipe: recipeName,
          mealType: mealType
        }
      });

      if (error) throw error;

      setMealPlan(data);
      setExpandedMeal(0);
      setSavedMeals(new Set());
      
      if (data.shoppingList) {
        setShoppingList(data.shoppingList);
      }
      
      toast({
        title: "Recipe Generated!",
        description: `Full recipe for ${recipeName} is ready`,
      });
    } catch (error: any) {
      console.error("Recipe generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate recipe",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchRecentScans = async () => {
    if (!user) return;
    setLoadingRecent(true);
    try {
      const { data } = await supabase
        .from("scan_history")
        .select("product_name, ingredients")
        .eq("user_id", user.id)
        .gte("health_score", 60) // Only safe products
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        const ingredientSet = new Set<string>();
        data.forEach((scan: any) => {
          if (scan.product_name) {
            ingredientSet.add(scan.product_name);
          }
          if (scan.ingredients && Array.isArray(scan.ingredients)) {
            scan.ingredients.slice(0, 3).forEach((ing: any) => {
              if (typeof ing === 'string') {
                ingredientSet.add(ing);
              } else if (ing.name) {
                ingredientSet.add(ing.name);
              }
            });
          }
        });
        setRecentIngredients(Array.from(ingredientSet).slice(0, 15));
      }
    } catch (error) {
      console.error("Error fetching recent scans:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const useRecentIngredients = () => {
    if (recentIngredients.length > 0) {
      setIngredients(recentIngredients.join("\n"));
      toast({
        title: "Ingredients Added",
        description: `Added ${recentIngredients.length} ingredients from your recent scans`,
      });
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (data) {
        setUserProfile(data);
        setSubscriptionTier(data.subscription_tier || "free");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!ingredients.trim()) {
      toast({
        title: "No Ingredients",
        description: "Please enter your available ingredients",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setMealPlan(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
        body: { 
          ingredients, 
          mealCount,
          userProfile 
        }
      });

      if (error) throw error;

      setMealPlan(data);
      setExpandedMeal(0);
      setSavedMeals(new Set()); // Reset saved meals for new plan
      
      // Update interactive shopping list
      if (data.shoppingList) {
        setShoppingList(data.shoppingList);
      }
    } catch (error: any) {
      console.error("Meal planning error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate meal plan",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-caution/20 text-caution';
      case 'lunch': return 'bg-safe/20 text-safe';
      case 'dinner': return 'bg-primary/20 text-primary';
      default: return 'bg-background/20 text-background';
    }
  };

  const handleSaveRecipe = async (meal: Meal, index: number) => {
    if (!user) return;
    
    setSavingMeal(index);
    try {
      const { error } = await supabase
        .from("saved_recipes" as any)
        .insert({
          user_id: user.id,
          name: meal.name,
          meal_type: meal.type,
          prep_time: meal.prepTime,
          cook_time: meal.cookTime,
          servings: meal.servings,
          safety_score: meal.safetyScore,
          ingredients: meal.ingredients as any,
          instructions: meal.instructions as any,
          nutrition: meal.nutrition as any,
          health_benefits: meal.healthBenefits as any,
          warnings: meal.warnings as any,
          is_favorite: true,
        });

      if (error) throw error;

      setSavedMeals((prev) => new Set(prev).add(index));
      toast({
        title: "Recipe Saved!",
        description: `${meal.name} added to your collection`,
      });
    } catch (error: any) {
      console.error("Error saving recipe:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Could not save recipe",
        variant: "destructive",
      });
    } finally {
      setSavingMeal(null);
    }
  };

  const effectiveTier = getEffectiveTier(subscriptionTier);
  const hasAccess = ["basic", "premium", "annual", "family", "pro"].includes(effectiveTier || "");

  // Show upgrade prompt for non-Pro users
  if (user && !hasAccess) {
    return (
      <AppLayout containerClassName="space-y-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 py-8"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-caution/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-caution" />
            </div>
            <h1 className="text-2xl font-black text-foreground uppercase">
              AI Meal Planner
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Get personalized meal ideas based on your ingredients and health needs
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-caution/10 rounded-2xl border-2 border-caution"
          >
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-caution" />
              <div>
                <h2 className="font-bold text-foreground">Paid Feature</h2>
                <p className="text-sm text-muted-foreground">Available with any subscription</p>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-foreground">
                <ChefHat className="w-4 h-4 text-caution" />
                AI-powered meal suggestions
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Sparkles className="w-4 h-4 text-caution" />
                Personalized to your health needs
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <ShoppingCart className="w-4 h-4 text-caution" />
                Auto-generated shopping lists
              </li>
            </ul>

            <Button
              onClick={() => navigate("/subscription")}
              className="w-full bg-caution hover:bg-caution/90 text-foreground"
            >
            <Crown className="w-4 h-4 mr-2" />
              Subscribe Now
            </Button>
          </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout containerClassName="space-y-6">
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-caution/20 flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-caution" />
          </div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
            AI Meal Planner
          </h1>
          <p className="text-muted-foreground">
            Enter your ingredients, get personalized safe meals
          </p>
        </motion.div>

        {!mealPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                What ingredients do you have?
              </label>
              <Textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Enter your available ingredients:&#10;&#10;Chicken breast&#10;Rice&#10;Broccoli&#10;Garlic&#10;Olive oil&#10;..."
                className="min-h-[180px] bg-muted/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                How many meals?
              </label>
              <div className="flex gap-2">
                {[2, 3, 5].map((num) => (
                  <Button
                    key={num}
                    variant={mealCount === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMealCount(num)}
                    className={cn(
                      mealCount === num 
                        ? "bg-caution text-foreground" 
                        : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {num} meals
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !ingredients.trim()}
              className="w-full gap-2 bg-caution hover:bg-caution/90 text-foreground shadow-[0_0_30px_hsl(var(--caution)/0.4)]"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Your Meal Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Meal Plan
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {mealPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Meals */}
              <div className="space-y-3">
                {mealPlan.meals.map((meal, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-muted/50 rounded-xl border border-border overflow-hidden"
                  >
                    {/* Meal Header */}
                    <div className="p-4 flex items-center gap-3">
                      <button
                        onClick={() => setExpandedMeal(expandedMeal === index ? null : index)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-caution/20 flex items-center justify-center shrink-0">
                          <ChefHat className="w-6 h-6 text-caution" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-foreground truncate">{meal.name}</h3>
                            <Badge className={cn("text-xs", getMealTypeColor(meal.type))}>
                              {meal.type}
                            </Badge>
                            {meal.babyFriendly && (
                              <Badge className="bg-safe/20 text-safe text-xs">
                                <Baby className="w-3 h-3 mr-1" />
                                Baby-safe
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {meal.prepTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {meal.nutrition.calories} cal
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {meal.servings}
                            </span>
                          </div>
                        </div>
                        {expandedMeal === index ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {/* Save Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveRecipe(meal, index);
                        }}
                        disabled={savingMeal === index || savedMeals.has(index)}
                        className={cn(
                          "shrink-0 transition-colors",
                          savedMeals.has(index)
                            ? "text-danger hover:text-danger"
                            : "text-muted-foreground hover:text-danger hover:bg-danger/10"
                        )}
                      >
                        {savingMeal === index ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Heart
                            className={cn(
                              "w-5 h-5",
                              savedMeals.has(index) && "fill-danger"
                            )}
                          />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedMeal === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border"
                        >
                          <div className="p-4 space-y-4">
                            {/* Warnings */}
                            {meal.warnings?.length > 0 && (
                              <div className="p-3 bg-caution/10 rounded-lg border border-caution/30">
                                <div className="flex items-center gap-2 text-caution text-sm font-medium">
                                  <AlertTriangle className="w-4 h-4" />
                                  Notes
                                </div>
                                <ul className="mt-1 text-sm text-muted-foreground">
                                  {meal.warnings.map((w, i) => (
                                    <li key={i}>• {w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Baby Modifications */}
                            {meal.babyModifications && (
                              <div className="p-3 bg-safe/10 rounded-lg border border-safe/30">
                                <div className="flex items-center gap-2 text-safe text-sm font-medium">
                                  <Baby className="w-4 h-4" />
                                  Baby-Safe Modification
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{meal.babyModifications}</p>
                              </div>
                            )}

                            {/* Health Benefits */}
                            {meal.healthBenefits?.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {meal.healthBenefits.map((benefit, i) => (
                                  <Badge key={i} className="bg-safe/20 text-safe text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {benefit}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Ingredients */}
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Ingredients</h4>
                              <ul className="space-y-1">
                                {meal.ingredients.map((ing, i) => (
                                  <li key={i} className="text-sm text-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-caution" />
                                    <span className="font-medium">{ing.amount}</span> {ing.item}
                                    {ing.notes && <span className="text-muted-foreground">({ing.notes})</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Instructions */}
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Instructions</h4>
                              <ol className="space-y-2">
                                {meal.instructions.map((step, i) => (
                                  <li key={i} className="text-sm text-foreground flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-caution/20 text-caution flex items-center justify-center text-xs font-bold shrink-0">
                                      {i + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* Nutrition */}
                            <div className="grid grid-cols-5 gap-2 text-center">
                              {[
                                { label: "Calories", value: meal.nutrition.calories },
                                { label: "Protein", value: `${meal.nutrition.protein}g` },
                                { label: "Carbs", value: `${meal.nutrition.carbs}g` },
                                { label: "Fat", value: `${meal.nutrition.fat}g` },
                                { label: "Fiber", value: `${meal.nutrition.fiber}g` },
                              ].map((item, i) => (
                                <div key={i} className="p-2 bg-muted/50 rounded-lg">
                                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                                  <p className="text-xs text-muted-foreground">{item.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Interactive Shopping List */}
              {shoppingItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <InteractiveShoppingList
                    items={shoppingItems}
                    onItemToggle={toggleItem}
                    onItemRemove={removeItem}
                    onAddItem={addItem}
                    onClearChecked={clearChecked}
                  />
                </motion.div>
              )}

              {/* Tips */}
              {mealPlan.tips?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 bg-safe/10 rounded-xl border border-safe/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-5 h-5 text-safe" />
                    <h3 className="font-bold text-foreground">Meal Prep Tips</h3>
                  </div>
                  <ul className="space-y-1">
                    {mealPlan.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {tip}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {savedMeals.size > 0 && (
                  <Button
                    onClick={() => navigate("/saved-recipes")}
                    className="w-full gap-2 bg-primary hover:bg-primary/90"
                  >
                    <BookOpen className="w-4 h-4" />
                    View My Collection ({savedMeals.size} saved)
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    setMealPlan(null);
                    setSavedMeals(new Set());
                  }}
                  variant="outline"
                  className="w-full gap-2 border-border text-foreground hover:bg-muted"
                >
                  <Sparkles className="w-4 h-4" />
                  Plan Different Meals
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign in prompt */}
        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-danger/20 rounded-xl border border-danger/30"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-danger" />
              <div>
                <p className="font-bold text-foreground">Sign in required</p>
                <p className="text-sm text-muted-foreground">
                  Create an account to use the AI Meal Planner
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full mt-3 bg-danger hover:bg-danger/90"
            >
              Sign In to Continue
            </Button>
          </motion.div>
        )}
    </AppLayout>
  );
};

export default MealPlanner;
