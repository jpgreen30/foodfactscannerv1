import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChefHat, Sparkles, Clock, Baby, ArrowRight, RefreshCw, Loader2, Sunrise, Sun, Moon, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MealSuggestion {
  name: string;
  emoji: string;
  description: string;
  mealType: string;
  prepTime: string;
  babyFriendly?: boolean;
  babyMeal?: boolean;
  keyBenefit: string;
}

interface PersonalizedMealSuggestionsProps {
  compact?: boolean;
}

type MealTab = "all" | "breakfast" | "lunch" | "dinner" | "snack" | "baby";

export const PersonalizedMealSuggestions = ({ compact = false }: PersonalizedMealSuggestionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [hasBaby, setHasBaby] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<MealTab>("all");

  const fetchSuggestions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('quick-meal-suggestions', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;
      
      setSuggestions(data.suggestions || []);
      setHasBaby(data.hasBaby || false);
      setHasLoaded(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasLoaded) {
      fetchSuggestions();
    }
  }, [user]);

  const filteredSuggestions = useMemo(() => {
    if (activeTab === "all") return suggestions;
    return suggestions.filter(s => s.mealType === activeTab);
  }, [suggestions, activeTab]);

  const babySuggestions = useMemo(() => {
    return suggestions.filter(s => s.mealType === "baby" || s.babyMeal);
  }, [suggestions]);

  if (!user) return null;

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-caution/20 text-caution';
      case 'lunch': return 'bg-safe/20 text-safe';
      case 'dinner': return 'bg-primary/20 text-primary';
      case 'snack': return 'bg-accent/20 text-accent-foreground';
      case 'baby': return 'bg-pink-500/20 text-pink-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Sunrise className="w-3 h-3" />;
      case 'lunch': return <Sun className="w-3 h-3" />;
      case 'dinner': return <Moon className="w-3 h-3" />;
      case 'snack': return <Cookie className="w-3 h-3" />;
      case 'baby': return <Baby className="w-3 h-3" />;
      default: return null;
    }
  };

  const MealCard = ({ suggestion, index }: { suggestion: MealSuggestion; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer overflow-hidden"
      onClick={() => navigate(`/meal-planner?recipe=${encodeURIComponent(suggestion.name)}&type=${suggestion.mealType}`)}
    >
      <span className="text-xl shrink-0">{suggestion.emoji}</span>
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h4 className="font-medium text-foreground text-sm truncate">{suggestion.name}</h4>
          {suggestion.babyFriendly && !suggestion.babyMeal && (
            <Badge className="bg-safe/20 text-safe text-[10px] shrink-0 px-1.5 py-0.5">
              <Baby className="w-2.5 h-2.5 mr-0.5" />
              Safe
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{suggestion.description}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px]">
          <span className="flex items-center gap-0.5 text-muted-foreground/70">
            <Clock className="w-3 h-3 shrink-0" />
            {suggestion.prepTime}
          </span>
          <Badge className={cn("text-[10px] px-1.5 py-0 flex items-center gap-0.5", getMealTypeColor(suggestion.mealType))}>
            {getMealTypeIcon(suggestion.mealType)}
            {suggestion.mealType}
          </Badge>
          <span className="flex items-center gap-0.5 text-muted-foreground/70 truncate max-w-[120px]">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">{suggestion.keyBenefit}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-br from-caution/10 to-primary/10 rounded-xl border border-caution/20"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-caution" />
            <span className="font-bold text-foreground text-sm">Meal Ideas</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/meal-planner")}
            className="text-caution hover:text-caution/80 text-xs"
          >
            Full Planner
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-caution" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
              >
                <span className="text-lg">{suggestion.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{suggestion.name}</p>
                  <p className="text-xs text-muted-foreground">{suggestion.prepTime}</p>
                </div>
                {suggestion.babyFriendly && (
                  <Baby className="w-4 h-4 text-safe shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Tap to get personalized meal ideas
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gradient-to-br from-caution/10 via-transparent to-primary/10 rounded-2xl border border-caution/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-caution/20 flex items-center justify-center shrink-0">
            <ChefHat className="w-5 h-5 text-caution" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Today's Meal Ideas</h3>
            <p className="text-xs text-muted-foreground">Personalized for your family</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="text-muted-foreground hover:text-caution"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {isLoading && !hasLoaded ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-caution" />
            <p className="text-sm text-muted-foreground">Getting personalized ideas...</p>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MealTab)} className="mb-4">
          <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="flex-1 min-w-[60px] text-xs px-2 py-1.5">
              All
            </TabsTrigger>
            <TabsTrigger value="breakfast" className="flex-1 min-w-[60px] text-xs px-2 py-1.5">
              <Sunrise className="w-3 h-3 mr-1" />
              Breakfast
            </TabsTrigger>
            <TabsTrigger value="lunch" className="flex-1 min-w-[60px] text-xs px-2 py-1.5">
              <Sun className="w-3 h-3 mr-1" />
              Lunch
            </TabsTrigger>
            <TabsTrigger value="dinner" className="flex-1 min-w-[60px] text-xs px-2 py-1.5">
              <Moon className="w-3 h-3 mr-1" />
              Dinner
            </TabsTrigger>
            <TabsTrigger value="snack" className="flex-1 min-w-[60px] text-xs px-2 py-1.5">
              <Cookie className="w-3 h-3 mr-1" />
              Snacks
            </TabsTrigger>
            {hasBaby && (
              <TabsTrigger value="baby" className="flex-1 min-w-[60px] text-xs px-2 py-1.5">
                <Baby className="w-3 h-3 mr-1" />
                Baby
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab} className="mt-3">
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((suggestion, index) => (
                  <MealCard key={index} suggestion={suggestion} index={index} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No {activeTab} suggestions available
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-6 text-center">
          <p className="text-muted-foreground mb-3">Get AI-powered meal suggestions based on your profile</p>
          <Button
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="bg-caution hover:bg-caution/90 text-foreground"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Get Suggestions
          </Button>
        </div>
      )}

      <Button
        onClick={() => navigate("/meal-planner")}
        variant="outline"
        className="w-full border-caution/30 text-caution hover:bg-caution/10"
      >
        <ChefHat className="w-4 h-4 mr-2" />
        Open Full Meal Planner
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};
