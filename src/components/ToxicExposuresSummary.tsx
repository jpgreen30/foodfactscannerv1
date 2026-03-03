import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LegalConsultationForm } from "./LegalConsultationForm";
import { Scale, Skull, AlertTriangle, ChevronRight, X, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ToxicScan {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  created_at: string;
  ingredients: any;
}

interface ToxicProduct {
  productName: string;
  brand?: string;
  healthScore: number;
  scannedAt: string;
  toxicIngredients: { name: string; riskLevel: string; healthConcerns?: string[] }[];
}

export const ToxicExposuresSummary = () => {
  const { user } = useAuth();
  const [toxicScans, setToxicScans] = useState<ToxicScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ToxicProduct[]>([]);

  useEffect(() => {
    if (user) {
      fetchToxicScans();
    }
  }, [user]);

  const fetchToxicScans = async () => {
    try {
      const { data, error } = await supabase
        .from("scan_history")
        .select("id, product_name, brand, health_score, created_at, ingredients")
        .eq("verdict", "avoid")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setToxicScans(data || []);
    } catch (error) {
      console.error("Error fetching toxic scans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getToxicProducts = (): ToxicProduct[] => {
    return toxicScans.map(scan => {
      const ingredients = Array.isArray(scan.ingredients) ? scan.ingredients : [];
      const toxicIngredients = ingredients
        .filter((i: any) => 
          i.riskLevel === "high" || 
          i.riskLevel === "moderate" || 
          i.riskLevel === "danger" || 
          i.riskLevel === "caution"
        )
        .map((i: any) => ({
          name: i.name,
          riskLevel: i.riskLevel,
          healthConcerns: i.healthConcerns,
        }));

      return {
        productName: scan.product_name,
        brand: scan.brand || undefined,
        healthScore: scan.health_score || 0,
        scannedAt: scan.created_at,
        toxicIngredients,
      };
    });
  };

  const handleOpenForm = (products?: ToxicProduct[]) => {
    const productsToUse = products || getToxicProducts();
    setSelectedProducts(productsToUse);
    setShowForm(true);
  };

  if (isLoading || toxicScans.length === 0) return null;

  const toxicProducts = getToxicProducts();
  const totalToxicIngredients = toxicProducts.reduce(
    (sum, p) => sum + p.toxicIngredients.length,
    0
  );

  // Only show legal CTA when there are actual toxic ingredients detected
  if (totalToxicIngredients === 0) return null;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-danger/20 via-danger/10 to-card rounded-xl border border-danger/30 overflow-hidden shadow-[0_0_30px_hsl(var(--danger)/0.2)]"
      >
        {/* Header */}
        <div className="p-5 border-b border-danger/30 bg-black/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-danger flex items-center justify-center">
                <Skull className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  Toxic Exposures
                  <Badge variant="destructive" className="text-sm font-bold px-2 py-1">
                    {toxicScans.length} products
                  </Badge>
                </h2>
                <p className="text-sm font-semibold text-white mt-1">
                  {totalToxicIngredients} harmful ingredients detected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="max-h-56 overflow-y-auto bg-black/20">
          {toxicProducts.slice(0, 5).map((product, index) => (
            <div
              key={index}
              className="flex items-center gap-4 px-5 py-4 border-b border-white/10 last:border-0 hover:bg-white/5 cursor-pointer"
              onClick={() => handleOpenForm([product])}
            >
              <div className="w-12 h-12 rounded-full bg-danger flex items-center justify-center text-base font-extrabold text-white">
                {product.healthScore}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base truncate">
                  {product.productName}
                </p>
                <p className="text-sm font-medium text-white/90 mt-0.5">
                  {product.brand} • {format(new Date(product.scannedAt), "MMM d")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-sm font-bold bg-danger text-white border-0 px-2 py-1">
                  {product.toxicIngredients.length} toxic
                </Badge>
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-6 bg-gray-900 border-t-2 border-yellow-400">
          {/* Millions Badge */}
          <div className="flex justify-center mb-5">
            <span className="bg-yellow-400 text-black text-lg font-black px-6 py-3 rounded-full animate-pulse shadow-lg shadow-yellow-400/50">
              💰 YOUR CASE COULD BE WORTH MILLIONS
            </span>
          </div>
          
          <div className="flex items-start gap-4 mb-5">
            <Scale className="w-10 h-10 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xl font-black text-white">
                Your exposure history could be worth MILLIONS!
              </p>
              <p className="text-base font-semibold text-white mt-2">
                Don't let corporations get away with harming consumers.
              </p>
            </div>
          </div>
          
          {/* Mini settlements - HIGH CONTRAST */}
          <div className="grid grid-cols-3 gap-3 mb-5 text-center">
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <p className="text-2xl font-black text-gray-900">$2.1M</p>
              <p className="text-sm font-bold text-gray-700">Settlement</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <p className="text-2xl font-black text-gray-900">$1.8M</p>
              <p className="text-sm font-bold text-gray-700">Settlement</p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <p className="text-2xl font-black text-gray-900">$750K</p>
              <p className="text-sm font-bold text-gray-700">Settlement</p>
            </div>
          </div>
          
          <Button
            onClick={() => handleOpenForm()}
            size="lg"
            className="w-full gap-3 bg-yellow-400 hover:bg-yellow-300 text-black text-xl font-black py-7 shadow-xl shadow-yellow-400/50 border-2 border-yellow-500"
          >
            <Phone className="w-7 h-7" />
            Get My FREE Case Review NOW
          </Button>
        </div>
      </motion.section>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 z-10 bg-card border border-border rounded-full shadow-lg"
                  onClick={() => setShowForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <LegalConsultationForm
                  productName={selectedProducts[0].productName}
                  brand={selectedProducts[0].brand}
                  healthScore={selectedProducts[0].healthScore}
                  toxicIngredients={selectedProducts[0].toxicIngredients}
                  additionalProducts={selectedProducts.slice(1).map(p => ({
                    productName: p.productName,
                    brand: p.brand,
                    healthScore: p.healthScore,
                  }))}
                  onComplete={() => setShowForm(false)}
                  onClose={() => setShowForm(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
