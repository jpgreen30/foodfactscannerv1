import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { HealthScore } from "@/components/HealthScore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Skull, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  Smartphone 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductComments } from "@/components/social/ProductComments";

interface ScanData {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  verdict: string | null;
  ingredients: any;
  dietary_flags: any;
  created_at: string;
}

const getMetaDescription = (scanData: ScanData | null): string => {
  if (!scanData) return "View this product scan on FoodFact - Know What You Eat";
  
  const score = scanData.health_score ?? 0;
  const verdict = score >= 80 ? "Healthy Choice" : score >= 50 ? "Use Caution" : "Avoid This";
  const brandText = scanData.brand ? ` by ${scanData.brand}` : "";
  
  return `${scanData.product_name}${brandText} scored ${score}/100 (${verdict}). Scanned with FoodFact - the app that reveals what's really in your food.`;
};

const getMetaTitle = (scanData: ScanData | null): string => {
  if (!scanData) return "Product Scan | FoodFact";
  const score = scanData.health_score ?? 0;
  const emoji = score >= 80 ? "✅" : score >= 50 ? "⚠️" : "❌";
  return `${emoji} ${scanData.product_name} - Score: ${score}/100 | FoodFact`;
};

const SharedResult = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchScanResult = async () => {
      if (!scanId) {
        setError("No scan ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("scan_history")
          .select("id, product_name, brand, health_score, verdict, ingredients, dietary_flags, created_at")
          .eq("id", scanId)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching scan:", fetchError);
          setError("Could not load this scan result");
        } else if (!data) {
          setError("Scan result not found");
        } else {
          setScanData(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchScanResult();
  }, [scanId]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = scanData 
      ? `Check out this product: ${scanData.product_name} - Health Score: ${scanData.health_score}/100`
      : "Check out this product scan!";

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Label Genius: ${scanData?.product_name || "Scan Result"}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.log("Share cancelled");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Share it on your favorite social media.",
        });
      } catch {
        toast({
          title: "Could not copy link",
          variant: "destructive",
        });
      }
    }
  };

  const getVerdictInfo = (verdict: string | null, score: number | null) => {
    if (!verdict || score === null) return { color: "text-muted-foreground", icon: AlertTriangle, label: "Unknown" };
    if (score >= 80) return { color: "text-safe", icon: CheckCircle2, label: "Healthy Choice" };
    if (score >= 50) return { color: "text-warning", icon: AlertTriangle, label: "Use Caution" };
    return { color: "text-danger", icon: Skull, label: "Avoid This" };
  };

  const getDangerousIngredients = (ingredients: any) => {
    if (!ingredients || !Array.isArray(ingredients)) return [];
    return ingredients.filter((i: any) => i.riskLevel === "danger" || i.riskLevel === "caution");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !scanData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Scan Not Found</h1>
            <p className="text-muted-foreground">
              {error || "This scan result doesn't exist or has been removed."}
            </p>
            <Link to="/">
              <Button className="mt-4">
                <Smartphone className="w-4 h-4 mr-2" />
                Try Label Genius
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verdictInfo = getVerdictInfo(scanData.verdict, scanData.health_score);
  const VerdictIcon = verdictInfo.icon;
  const dangerousIngredients = getDangerousIngredients(scanData.ingredients);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic Meta Tags for Social Sharing */}
      <Helmet>
        <title>{getMetaTitle(scanData)}</title>
        <meta name="description" content={getMetaDescription(scanData)} />
        
        {/* Open Graph */}
        <meta property="og:title" content={getMetaTitle(scanData)} />
        <meta property="og:description" content={getMetaDescription(scanData)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
        <meta property="og:site_name" content="FoodFact" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getMetaTitle(scanData)} />
        <meta name="twitter:description" content={getMetaDescription(scanData)} />
        <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">{scanData.product_name}</h1>
            {scanData.brand && (
              <p className="text-muted-foreground">{scanData.brand}</p>
            )}
          </div>
          {scanData.health_score !== null && (
            <HealthScore score={scanData.health_score} size="md" />
          )}
        </motion.div>

        {/* Verdict Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`border-2 ${
            scanData.health_score !== null && scanData.health_score < 50 
              ? "border-danger/30 bg-danger/5" 
              : scanData.health_score !== null && scanData.health_score >= 80 
                ? "border-safe/30 bg-safe/5" 
                : "border-warning/30 bg-warning/5"
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${
                  scanData.health_score !== null && scanData.health_score < 50 
                    ? "bg-danger/10" 
                    : scanData.health_score !== null && scanData.health_score >= 80 
                      ? "bg-safe/10" 
                      : "bg-warning/10"
                }`}>
                  <VerdictIcon className={`w-6 h-6 ${verdictInfo.color}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${verdictInfo.color}`}>
                    {verdictInfo.label}
                  </h2>
                  <p className="text-sm text-foreground/80">
                    Health Score: {scanData.health_score}/100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dangerous Ingredients Warning */}
        {dangerousIngredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-danger/30 bg-gradient-to-br from-danger/10 to-danger/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Skull className="w-5 h-5 text-danger mt-0.5" />
                  <div>
                    <h3 className="font-bold text-foreground">
                      {dangerousIngredients.length} Concerning Ingredient{dangerousIngredients.length > 1 ? "s" : ""}
                    </h3>
                    <p className="text-sm text-foreground/80">
                      This product contains ingredients that may pose health risks
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dangerousIngredients.slice(0, 5).map((ing: any, idx: number) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className={`${
                        ing.riskLevel === "danger" 
                          ? "border-danger/50 text-danger bg-danger/10" 
                          : "border-warning/50 text-warning bg-warning/10"
                      }`}
                    >
                      {ing.name}
                    </Badge>
                  ))}
                  {dangerousIngredients.length > 5 && (
                    <Badge variant="outline" className="border-muted text-foreground/70">
                      +{dangerousIngredients.length - 5} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dietary Flags */}
        {scanData.dietary_flags && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Dietary Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "vegan", label: "Vegan" },
                    { key: "glutenFree", label: "Gluten-Free" },
                    { key: "dairyFree", label: "Dairy-Free" },
                    { key: "pregnancySafe", label: "Pregnancy Safe" },
                  ].map(({ key, label }) => {
                    const isCompatible = scanData.dietary_flags?.[key];
                    return (
                      <div 
                        key={key}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          isCompatible ? "bg-safe/10" : "bg-muted/50"
                        }`}
                      >
                        {isCompatible ? (
                          <CheckCircle2 className="w-4 h-4 text-safe" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-foreground/60" />
                        )}
                        <span className={`text-sm ${isCompatible ? "text-foreground" : "text-foreground/70"}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Community Comments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardContent className="pt-4">
              <ProductComments
                productBarcode={scanId || scanData.id}
                productName={scanData.product_name}
                defaultOpen
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                Want to scan your own products?
              </h3>
              <p className="text-sm text-foreground/80">
                Get instant health analysis for any food product with FoodFact
              </p>
              <Link to="/auth">
                <Button className="w-full gap-2">
                  <Smartphone className="w-4 h-4" />
                  Try FoodFact Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default SharedResult;
