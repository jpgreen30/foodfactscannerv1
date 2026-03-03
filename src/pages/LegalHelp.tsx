import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Scale, AlertTriangle, Phone, DollarSign, Shield, Clock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HealthScore } from "@/components/HealthScore";
import { LegalConsultationForm } from "@/components/LegalConsultationForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Ingredient {
  name: string;
  riskLevel?: string;
  concern?: string;
}

interface ToxicScan {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  verdict: string | null;
  ingredients: Ingredient[] | null;
  created_at: string;
  barcode: string | null;
}

const LegalHelp = () => {
  const { user } = useAuth();
  const [toxicScans, setToxicScans] = useState<ToxicScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<ToxicScan | null>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchToxicScans();
    }
  }, [user]);

  const fetchToxicScans = async () => {
    try {
      const { data, error } = await supabase
        .from("scan_history")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter to only toxic scans
      const filtered = (data || []).filter((scan) => {
        if (scan.verdict === "avoid") return true;
        const ingredients = scan.ingredients as unknown as Ingredient[] | null;
        if (ingredients && Array.isArray(ingredients)) {
          return ingredients.some((i) =>
            ["high", "moderate", "danger", "caution"].includes(i.riskLevel || "")
          );
        }
        return false;
      });

      setToxicScans(filtered as unknown as ToxicScan[]);
    } catch (error) {
      console.error("Error fetching toxic scans:", error);
    } finally {
      setLoading(false);
    }
  };

  const getToxicIngredients = (ingredients: Ingredient[] | null): Ingredient[] => {
    if (!ingredients || !Array.isArray(ingredients)) return [];
    return ingredients.filter((i) =>
      ["high", "moderate", "danger", "caution"].includes(i.riskLevel || "")
    );
  };

  const settlements = ["$2.1M", "$1.8M", "$750K", "$3.2M", "$950K"];

  return (
    <>
    <Helmet>
      <title>Baby Food Legal Help | Toxic Baby Food Lawsuit & FDA Recall Claims | FoodFactScanner®</title>
      <meta name="description" content="Get legal help if your child was harmed by toxic baby food. Connect with attorneys specializing in baby food heavy metals lawsuits, FDA recalls, and toxic ingredient claims. Free consultation available." />
      <meta name="keywords" content="toxic baby food lawsuit, baby food heavy metals legal help, FDA baby food recall lawsuit, baby food injury attorney, toxic baby food compensation" />
      <link rel="canonical" href="https://foodfactscanner.com/legal-help" />
      <meta property="og:title" content="Baby Food Legal Help | Toxic Baby Food Lawsuit Claims | FoodFactScanner®" />
      <meta property="og:description" content="Get legal help if your child was harmed by toxic baby food. Connect with attorneys for heavy metals lawsuits and FDA recall claims." />
      <meta property="og:url" content="https://foodfactscanner.com/legal-help" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-caution/20 via-caution/10 to-orange-500/20 border border-caution/30 p-6"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-caution/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-caution/20">
                <Scale className="h-6 w-6 text-caution" />
              </div>
              <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
                Toxic Exposure Report
              </h1>
            </div>
            <p className="text-muted-foreground mb-4">
              {toxicScans.length > 0 ? (
                <>
                  <span className="text-danger font-bold">{toxicScans.length} dangerous product{toxicScans.length !== 1 ? "s" : ""}</span> detected in your scan history
                </>
              ) : (
                "No toxic products detected yet"
              )}
            </p>
            {toxicScans.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-safe" />
                <span className="text-safe font-semibold">Potential settlement: $500K - $5M+</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Settlement Examples */}
        {toxicScans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-safe/30 bg-safe/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-safe" />
                  <span className="font-bold text-foreground">Recent Settlements We've Seen</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settlements.map((amount, i) => (
                    <Badge key={i} variant="outline" className="bg-safe/10 text-safe border-safe/30 font-bold">
                      {amount}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Time Sensitive Warning */}
        {toxicScans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-caution/10 border border-caution/30"
          >
            <Clock className="h-5 w-5 text-caution flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-bold">Time-sensitive:</span> Statutes of limitations may apply. Act now to protect your rights.
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && toxicScans.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-safe/20 flex items-center justify-center">
              <Shield className="h-8 w-8 text-safe" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No Toxic Products Found</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Great news! We haven't detected any dangerous products in your scan history yet.
            </p>
            <Button onClick={() => window.location.href = "/scanner"}>
              Scan a Product
            </Button>
          </motion.div>
        )}

        {/* Toxic Products List */}
        {!loading && toxicScans.length > 0 && (
          <div className="space-y-4">
            {toxicScans.map((scan, index) => {
              const toxicIngredients = getToxicIngredients(scan.ingredients);
              
              return (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Card className="border-danger/30 bg-gradient-to-br from-danger/5 to-transparent overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Health Score */}
                        <div className="flex-shrink-0">
                          <HealthScore score={scan.health_score || 0} size="sm" showLabel={false} />
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate">{scan.product_name}</h3>
                          {scan.brand && (
                            <p className="text-sm text-muted-foreground">{scan.brand}</p>
                          )}
                          
                          {/* Toxic Ingredients */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {toxicIngredients.slice(0, 3).map((ing, i) => (
                              <Badge 
                                key={i} 
                                variant="destructive" 
                                className="text-xs bg-danger/20 text-danger border-danger/30"
                              >
                                ☠️ {ing.name}
                              </Badge>
                            ))}
                            {toxicIngredients.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{toxicIngredients.length - 3} more
                              </Badge>
                            )}
                          </div>
                          
                          {/* Scan Date */}
                          <p className="text-xs text-muted-foreground mt-2">
                            Scanned: {format(new Date(scan.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      
                      {/* CTA Button */}
                      <Button
                        className="w-full mt-4 bg-gradient-to-r from-caution to-caution/80 hover:from-caution/90 hover:to-caution/70 text-black font-bold"
                        onClick={() => setSelectedScan(scan)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        CONSULT ATTORNEY - FREE
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bulk Submit CTA */}
        {!loading && toxicScans.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-caution/50 bg-gradient-to-br from-caution/20 to-orange-500/10">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-caution mx-auto mb-3" />
                <h3 className="font-bold text-lg text-foreground mb-2">
                  Multiple Toxic Products Detected
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Submit all {toxicScans.length} products for review. One comprehensive case = maximum settlement potential.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-caution to-caution/80 hover:from-caution/90 hover:to-caution/70 text-black font-bold animate-pulse"
                  onClick={() => setShowBulkForm(true)}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  SUBMIT ALL {toxicScans.length} PRODUCTS FOR REVIEW
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Consultation Form Modal for Single Product */}
        <Dialog open={!!selectedScan} onOpenChange={(open) => !open && setSelectedScan(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
            {selectedScan && (
              <LegalConsultationForm
                productName={selectedScan.product_name}
                brand={selectedScan.brand || undefined}
                healthScore={selectedScan.health_score || 0}
                toxicIngredients={getToxicIngredients(selectedScan.ingredients).map(i => ({
                  name: i.name,
                  riskLevel: i.riskLevel || "high",
                  healthConcerns: i.concern ? [i.concern] : []
                }))}
                scanId={selectedScan.id}
                onClose={() => setSelectedScan(null)}
                onComplete={() => setSelectedScan(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Consultation Form Modal for Bulk Submit */}
        <Dialog open={showBulkForm} onOpenChange={setShowBulkForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
            {toxicScans.length > 0 && (
              <LegalConsultationForm
                productName={toxicScans[0].product_name}
                brand={toxicScans[0].brand || undefined}
                healthScore={toxicScans[0].health_score || 0}
                toxicIngredients={getToxicIngredients(toxicScans[0].ingredients).map(i => ({
                  name: i.name,
                  riskLevel: i.riskLevel || "high",
                  healthConcerns: i.concern ? [i.concern] : []
                }))}
                scanId={toxicScans[0].id}
                additionalProducts={toxicScans.slice(1).map(scan => ({
                  productName: scan.product_name,
                  brand: scan.brand || undefined,
                  healthScore: scan.health_score || 0,
                  toxicIngredients: getToxicIngredients(scan.ingredients).map(i => ({
                    name: i.name,
                    riskLevel: i.riskLevel || "high",
                    healthConcerns: i.concern ? [i.concern] : []
                  }))
                }))}
                onClose={() => setShowBulkForm(false)}
                onComplete={() => setShowBulkForm(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
     </AppLayout>
    </>
  );
};
export default LegalHelp;
