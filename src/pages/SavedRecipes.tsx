import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat,
  Search,
  Trash2,
  Clock,
  Flame,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Heart,
  Filter,
  Loader2,
  Lock,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasSavedRecipesAccess } from "@/lib/subscriptionUtils";

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

interface SavedRecipe {
  id: string;
  name: string;
  meal_type: string;
  prep_time: string | null;
  cook_time: string | null;
  servings: number | null;
  safety_score: number | null;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  health_benefits: string[];
  warnings: string[];
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
}

const SavedRecipes = () => {
  const { user } = useAuth();
  const { getEffectiveTier } = useDebug();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");

  const effectiveTier = getEffectiveTier(subscriptionTier);
  const hasAccess = hasSavedRecipesAccess(effectiveTier);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();

      if (profile?.subscription_tier) {
        setSubscriptionTier(profile.subscription_tier);
      }

      fetchRecipes();
    } catch (error) {
      console.error("Error fetching user data:", error);
      fetchRecipes();
    }
  };

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_recipes" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedRecipes: SavedRecipe[] = (data || []).map((recipe: any) => ({
        ...recipe,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        health_benefits: Array.isArray(recipe.health_benefits) ? recipe.health_benefits : [],
        warnings: Array.isArray(recipe.warnings) ? recipe.warnings : [],
        nutrition: recipe.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      }));

      setRecipes(typedRecipes);
    } catch (error: any) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Error",
        description: "Could not load saved recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("saved_recipes" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRecipes((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "Recipe Removed",
        description: "Recipe deleted from your collection",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not delete recipe",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-caution/20 text-caution";
      case "lunch":
        return "bg-safe/20 text-safe";
      case "dinner":
        return "bg-primary/20 text-primary";
      default:
        return "bg-background/20 text-background";
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = !filterType || recipe.meal_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

  if (!user) {
    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-danger/20 rounded-xl border border-danger/30 text-center"
        >
          <BookOpen className="w-12 h-12 text-danger mx-auto mb-3" />
          <p className="font-bold text-foreground mb-2">Sign in required</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create an account to save and view your recipes
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-danger hover:bg-danger/90"
          >
            Sign In to Continue
          </Button>
        </motion.div>
      </AppLayout>
    );
  }

  // Gate for Pro users only
  if (!hasAccess) {
    return (
      <AppLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-caution/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-caution" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-wide mb-2">
              Pro Feature
            </h1>
            <p className="text-muted-foreground mb-4">
              Saved Recipes is part of the AI Meal Planner, available exclusively for Pro subscribers
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-3">
            <div className="flex items-center gap-2 text-foreground text-sm">
              <CheckCircle className="w-4 h-4 text-safe" />
              <span>AI-generated meal plans</span>
            </div>
            <div className="flex items-center gap-2 text-foreground text-sm">
              <CheckCircle className="w-4 h-4 text-safe" />
              <span>Save unlimited recipes</span>
            </div>
            <div className="flex items-center gap-2 text-foreground text-sm">
              <CheckCircle className="w-4 h-4 text-safe" />
              <span>Personalized nutrition tracking</span>
            </div>
          </div>
          <Button
            onClick={() => navigate("/subscription")}
            className="w-full gap-2 bg-caution hover:bg-caution/90 text-foreground"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </Button>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
            My Recipes
          </h1>
          <p className="text-muted-foreground">
            Your saved meal collection ({recipes.length} recipes)
          </p>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={filterType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(null)}
              className={cn(
                filterType === null
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              <Filter className="w-3 h-3 mr-1" />
              All
            </Button>
            {mealTypes.map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className={cn(
                  "capitalize whitespace-nowrap",
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-muted"
                )}
              >
                {type}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Loading recipes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRecipes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {recipes.length === 0
                ? "No saved recipes yet"
                : "No recipes match your search"}
            </p>
            <Button
              onClick={() => navigate("/meal-planner")}
              className="bg-caution hover:bg-caution/90 text-foreground"
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Generate Meals
            </Button>
          </motion.div>
        )}

        {/* Recipe List */}
        <div className="space-y-3">
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-muted/50 rounded-xl border border-border overflow-hidden"
            >
              {/* Recipe Header */}
              <div className="p-4 flex items-center gap-3">
                <button
                  onClick={() =>
                    setExpandedRecipe(
                      expandedRecipe === recipe.id ? null : recipe.id
                    )
                  }
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-caution/20 flex items-center justify-center shrink-0">
                    <ChefHat className="w-6 h-6 text-caution" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate">
                        {recipe.name}
                      </h3>
                      <Badge
                        className={cn("text-xs", getMealTypeColor(recipe.meal_type))}
                      >
                        {recipe.meal_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {recipe.prep_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {recipe.prep_time}
                        </span>
                      )}
                      {recipe.nutrition?.calories && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {recipe.nutrition.calories} cal
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {recipe.servings}
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedRecipe === recipe.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(recipe.id)}
                  disabled={deletingId === recipe.id}
                  className="text-danger hover:text-danger hover:bg-danger/10 shrink-0"
                >
                  {deletingId === recipe.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedRecipe === recipe.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-4">
                      {/* Warnings */}
                      {recipe.warnings?.length > 0 && (
                        <div className="p-3 bg-caution/10 rounded-lg border border-caution/30">
                          <div className="flex items-center gap-2 text-caution text-sm font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            Notes
                          </div>
                          <ul className="mt-1 text-sm text-muted-foreground">
                            {recipe.warnings.map((w, i) => (
                              <li key={i}>• {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Health Benefits */}
                      {recipe.health_benefits?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {recipe.health_benefits.map((benefit, i) => (
                            <Badge
                              key={i}
                              className="bg-safe/20 text-safe text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Ingredients */}
                      {recipe.ingredients?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">
                            Ingredients
                          </h4>
                          <ul className="space-y-1">
                            {recipe.ingredients.map((ing, i) => (
                              <li
                                key={i}
                                className="text-sm text-foreground flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-caution" />
                                <span className="font-medium">{ing.amount}</span>{" "}
                                {ing.item}
                                {ing.notes && (
                                  <span className="text-muted-foreground">
                                    ({ing.notes})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Instructions */}
                      {recipe.instructions?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-background mb-2">
                            Instructions
                          </h4>
                          <ol className="space-y-2">
                            {recipe.instructions.map((step, i) => (
                              <li
                                key={i}
                                className="text-sm text-background/80 flex gap-3"
                              >
                                <span className="w-6 h-6 rounded-full bg-caution/20 text-caution flex items-center justify-center text-xs font-bold shrink-0">
                                  {i + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Nutrition */}
                      {recipe.nutrition && (
                        <div className="grid grid-cols-5 gap-2 text-center">
                          {[
                            { label: "Calories", value: recipe.nutrition.calories },
                            {
                              label: "Protein",
                              value: `${recipe.nutrition.protein}g`,
                            },
                            { label: "Carbs", value: `${recipe.nutrition.carbs}g` },
                            { label: "Fat", value: `${recipe.nutrition.fat}g` },
                            { label: "Fiber", value: `${recipe.nutrition.fiber}g` },
                          ].map((item, i) => (
                            <div
                              key={i}
                              className="p-2 bg-background/5 rounded-lg"
                            >
                              <p className="text-lg font-bold text-background">
                                {item.value}
                              </p>
                              <p className="text-xs text-background/50">
                                {item.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Generate More Button */}
        {recipes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() => navigate("/meal-planner")}
              variant="outline"
              className="w-full gap-2 border-background/20 text-background hover:bg-background/10"
            >
              <ChefHat className="w-4 h-4" />
              Generate More Meals
            </Button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default SavedRecipes;
