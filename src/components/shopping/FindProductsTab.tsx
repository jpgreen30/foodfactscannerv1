import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Loader2, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRecommendation {
  name: string;
  brand: string;
  reason: string;
  estimatedScore: number;
  category: 'best' | 'okay' | 'avoid';
}

interface SearchResult {
  category: string;
  bestChoices: ProductRecommendation[];
  okayOptions: ProductRecommendation[];
  avoidThese: ProductRecommendation[];
  personalizedTip: string;
}

const QUICK_SEARCHES = [
  'Peanut Butter',
  'Yogurt',
  'Bread',
  'Cereal',
  'Pasta Sauce',
  'Snack Bars',
  'Chips',
  'Ice Cream'
];

interface FindProductsTabProps {
  userProfile: any;
}

export const FindProductsTab = ({ userProfile }: FindProductsTabProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) {
      toast({
        title: "Enter a product",
        description: "Type a product category to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-shopping-list', {
        body: { 
          mode: 'product_search',
          searchQuery: searchTerm,
          userProfile 
        }
      });

      if (error) throw error;
      setResult(data);
      setSearchQuery(searchTerm);
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error.message || "Could not search products",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-safe';
    if (score >= 40) return 'text-caution';
    return 'text-danger';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-safe/20 border-safe/30';
    if (score >= 40) return 'bg-caution/20 border-caution/30';
    return 'bg-danger/20 border-danger/30';
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a product (e.g., peanut butter)"
            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="bg-primary hover:bg-primary/90 shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Quick Search Tags */}
        {!result && (
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handleSearch(term)}
                className="px-3 py-1.5 rounded-full text-sm bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Finding the healthiest options...</p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Category Header */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground capitalize">
                {result.category}
              </h3>
              <p className="text-sm text-muted-foreground">Health recommendations based on your profile</p>
            </div>

            {/* Personalized Tip */}
            {result.personalizedTip && (
              <div className="p-4 rounded-xl bg-primary/20 border border-primary/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{result.personalizedTip}</p>
              </div>
            )}

            {/* Best Choices */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-safe" />
                <h4 className="font-bold text-safe uppercase text-sm tracking-wide">Best Choices</h4>
              </div>
              <div className="space-y-2">
                {(result.bestChoices || []).map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn("p-4 rounded-xl border", getScoreBg(product.estimatedScore))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                        <p className="text-sm text-foreground/80 mt-1">{product.reason}</p>
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold",
                        getScoreBg(product.estimatedScore),
                        getScoreColor(product.estimatedScore)
                      )}>
                        {product.estimatedScore}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Okay Options */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUp className="w-5 h-5 text-caution" />
                <h4 className="font-bold text-caution uppercase text-sm tracking-wide">Okay Options</h4>
              </div>
              <div className="space-y-2">
                {(result.okayOptions || []).map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    className={cn("p-4 rounded-xl border", getScoreBg(product.estimatedScore))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                        <p className="text-sm text-foreground/80 mt-1">{product.reason}</p>
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold",
                        getScoreBg(product.estimatedScore),
                        getScoreColor(product.estimatedScore)
                      )}>
                        {product.estimatedScore}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Avoid These */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ThumbsDown className="w-5 h-5 text-danger" />
                <h4 className="font-bold text-danger uppercase text-sm tracking-wide">Avoid These</h4>
              </div>
              <div className="space-y-2">
                {(result.avoidThese || []).map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={cn("p-4 rounded-xl border", getScoreBg(product.estimatedScore))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                        <p className="text-sm text-foreground/80 mt-1">{product.reason}</p>
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold",
                        getScoreBg(product.estimatedScore),
                        getScoreColor(product.estimatedScore)
                      )}>
                        {product.estimatedScore}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Search Again */}
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="w-full gap-2 border-border text-foreground hover:bg-muted"
            >
              Search Another Product
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
