import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Loader2, 
  Sparkles,
  DollarSign,
  RefreshCw,
  Share2,
  Copy,
  CheckCircle,
  Lock,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasShoppingAnalyzerAccess } from "@/lib/subscriptionUtils";

interface SmartCartItem {
  originalItem: string;
  recommendedProduct: string;
  brand: string;
  reason: string;
  healthScore: number;
  priceRange: string;
}

interface SmartCartResult {
  items: SmartCartItem[];
  overallHealthScore: number;
  moneySavingTips: string[];
  summary: string;
}

interface SmartCartTabProps {
  userProfile: any;
  subscriptionTier: string;
}

export const SmartCartTab = ({ userProfile, subscriptionTier }: SmartCartTabProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasAccess = hasShoppingAnalyzerAccess(subscriptionTier);
  const [shoppingList, setShoppingList] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [result, setResult] = useState<SmartCartResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleBuildCart = async () => {
    if (!shoppingList.trim()) {
      toast({
        title: "Empty List",
        description: "Enter items you want to buy",
        variant: "destructive",
      });
      return;
    }

    setIsBuilding(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-shopping-list', {
        body: { 
          mode: 'smart_cart',
          shoppingList,
          userProfile 
        }
      });

      if (error) throw error;
      setResult(data);
    } catch (error: any) {
      console.error("Build cart error:", error);
      toast({
        title: "Failed to Build Cart",
        description: error.message || "Could not create smart cart",
        variant: "destructive",
      });
    } finally {
      setIsBuilding(false);
    }
  };

  const handleCopyList = () => {
    if (!result) return;
    
    const listText = result.items.map(item => 
      `${item.recommendedProduct} (${item.brand}) - ${item.priceRange}`
    ).join('\n');
    
    navigator.clipboard.writeText(listText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied!",
      description: "Shopping list copied to clipboard",
    });
  };

  const handleShare = async () => {
    if (!result) return;
    
    const shareText = `My Smart Shopping List:\n\n${result.items.map(item => 
      `• ${item.recommendedProduct} (${item.brand})`
    ).join('\n')}\n\nOverall Health Score: ${result.overallHealthScore}/100`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Smart Shopping List',
          text: shareText,
        });
      } catch (err) {
        handleCopyList();
      }
    } else {
      handleCopyList();
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

  const getPriceIcon = (price: string) => {
    const count = (price.match(/\$/g) || []).length;
    return (
      <div className="flex">
        {[1, 2, 3].map((i) => (
          <DollarSign 
            key={i} 
            className={cn(
              "w-3 h-3",
              i <= count ? "text-primary" : "text-muted-foreground/30"
            )} 
          />
        ))}
      </div>
    );
  };

  // Show upgrade prompt for free users
  if (!hasAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 py-8"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-caution/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-caution" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Premium Feature
          </h3>
          <p className="text-muted-foreground mb-4">
            Upgrade to Premium to get AI-powered healthy shopping recommendations
          </p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-3">
          <div className="flex items-center gap-2 text-foreground text-sm">
            <CheckCircle className="w-4 h-4 text-safe" />
            <span>AI recommends healthiest brand alternatives</span>
          </div>
          <div className="flex items-center gap-2 text-foreground text-sm">
            <CheckCircle className="w-4 h-4 text-safe" />
            <span>Get health scores for each product</span>
          </div>
          <div className="flex items-center gap-2 text-foreground text-sm">
            <CheckCircle className="w-4 h-4 text-safe" />
            <span>Money-saving tips included</span>
          </div>
        </div>
        <Button
          onClick={() => navigate("/subscription")}
          className="w-full gap-2 bg-caution hover:bg-caution/90 text-foreground"
        >
          <Crown className="w-4 h-4" />
          Upgrade to Premium
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <p className="text-muted-foreground">
                Enter what you want to buy and we'll recommend the healthiest brands
              </p>
            </div>

            <Textarea
              value={shoppingList}
              onChange={(e) => setShoppingList(e.target.value)}
              placeholder="Enter items you want to buy:&#10;&#10;Milk&#10;Bread&#10;Peanut butter&#10;Yogurt&#10;Cereal&#10;..."
              className="min-h-[200px] bg-muted/50 border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
            
            <Button
              onClick={handleBuildCart}
              disabled={isBuilding || !shoppingList.trim()}
              className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
              size="lg"
            >
              {isBuilding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Building Smart Cart...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Build My Smart Cart
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Card */}
            <div className={cn(
              "p-5 rounded-2xl border",
              getScoreBg(result.overallHealthScore)
            )}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Your Smart Cart
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-4xl font-black", getScoreColor(result.overallHealthScore))}>
                      {result.overallHealthScore}
                    </span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyList}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground">{result.summary}</p>
            </div>

            {/* Smart Cart Items */}
            <div className="space-y-2">
              {(result.items || []).map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn("p-4 rounded-xl border", getScoreBg(item.healthScore))}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground line-through">
                          {item.originalItem}
                        </span>
                        <span className="text-muted-foreground/50">→</span>
                      </div>
                      <p className="font-bold text-foreground">{item.recommendedProduct}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{item.brand}</span>
                        <span className="text-muted-foreground/50">•</span>
                        {getPriceIcon(item.priceRange)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0",
                      getScoreBg(item.healthScore),
                      getScoreColor(item.healthScore)
                    )}>
                      {item.healthScore}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Money Saving Tips */}
            {result.moneySavingTips && result.moneySavingTips.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                    Money-Saving Tips
                  </h4>
                </div>
                <ul className="space-y-1">
                  {result.moneySavingTips.map((tip, index) => (
                    <li key={index} className="text-sm text-foreground">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Build Again Button */}
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="w-full gap-2 border-border text-foreground hover:bg-muted"
            >
              <RefreshCw className="w-4 h-4" />
              Build Another Cart
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
