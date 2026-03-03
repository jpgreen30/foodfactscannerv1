import { motion, AnimatePresence } from "framer-motion";
import { X, Package, AlertTriangle, Skull, Shield, Beaker, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/HealthScore";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ProductComments } from "@/components/social/ProductComments";
interface Ingredient {
  name: string;
  riskLevel?: string;
  healthConcerns?: string;
  definition?: string;
  purpose?: string;
}

interface ScanDetailProps {
  scan: {
    id: string;
    product_name: string;
    brand: string | null;
    health_score: number | null;
    verdict: string | null;
    scan_type: string | null;
    created_at: string;
    ingredients?: Ingredient[];
    nutrition?: any;
    dietary_flags?: any;
    barcode?: string;
    image_url?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ScanDetailModal = ({ scan, isOpen, onClose }: ScanDetailProps) => {
  const getVerdictInfo = (verdict: string | null) => {
    switch (verdict) {
      case "healthy":
        return { text: "Safe to Consume", color: "text-safe", bg: "bg-safe/20", icon: Shield };
      case "caution":
        return { text: "Use Caution", color: "text-caution", bg: "bg-caution/20", icon: AlertTriangle };
      case "avoid":
        return { text: "AVOID - DANGEROUS", color: "text-danger", bg: "bg-danger/20", icon: Skull };
      default:
        return { text: "Unknown", color: "text-muted-foreground", bg: "bg-muted/20", icon: Package };
    }
  };

  const getRiskBadge = (riskLevel: string | undefined) => {
    switch (riskLevel) {
      case "danger":
        return <Badge variant="destructive" className="text-xs">Dangerous</Badge>;
      case "caution":
        return <Badge className="bg-caution/20 text-caution border-caution/30 text-xs">Caution</Badge>;
      case "safe":
        return <Badge className="bg-safe/20 text-safe border-safe/30 text-xs">Safe</Badge>;
      default:
        return null;
    }
  };

  const verdictInfo = getVerdictInfo(scan.verdict);
  const VerdictIcon = verdictInfo.icon;

  const ingredients = Array.isArray(scan.ingredients) ? scan.ingredients : [];
  const dangerousIngredients = ingredients.filter((i: Ingredient) => i.riskLevel === "danger");
  const cautionIngredients = ingredients.filter((i: Ingredient) => i.riskLevel === "caution");
  const safeIngredients = ingredients.filter((i: Ingredient) => i.riskLevel === "safe" || !i.riskLevel);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 ${verdictInfo.bg} border-b border-border`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {scan.image_url ? (
                    <img 
                      src={scan.image_url} 
                      alt={scan.product_name}
                      className="w-16 h-16 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <HealthScore score={scan.health_score || 0} size="sm" showLabel={false} />
                  )}
                  <div>
                    <h2 className="font-bold text-foreground text-lg leading-tight">{scan.product_name}</h2>
                    <p className="text-sm text-muted-foreground">{scan.brand || "Unknown brand"}</p>
                    {scan.image_url && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">Score:</span>
                        <span className={`text-sm font-bold ${
                          (scan.health_score || 0) >= 80 ? 'text-safe' : 
                          (scan.health_score || 0) >= 50 ? 'text-caution' : 'text-danger'
                        }`}>
                          {scan.health_score}/100
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={onClose}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Verdict Badge */}
              <div className={`mt-3 flex items-center gap-2 ${verdictInfo.color}`}>
                <VerdictIcon className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wide">{verdictInfo.text}</span>
              </div>
            </div>

            <ScrollArea className="max-h-[60vh]">
              <div className="p-4 space-y-4">
                {/* Scan Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(scan.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                  {scan.barcode && (
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{scan.barcode}</span>
                    </div>
                  )}
                </div>

                {/* Dangerous Ingredients */}
                {dangerousIngredients.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-danger flex items-center gap-2">
                      <Skull className="w-4 h-4" />
                      Dangerous Ingredients ({dangerousIngredients.length})
                    </h3>
                    <div className="space-y-2">
                      {dangerousIngredients.map((ing: Ingredient, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-danger/10 border border-danger/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-foreground">{ing.name}</span>
                            {getRiskBadge(ing.riskLevel)}
                          </div>
                          {ing.healthConcerns && (
                            <p className="text-sm text-danger">{ing.healthConcerns}</p>
                          )}
                          {ing.purpose && (
                            <p className="text-xs text-muted-foreground mt-1">Purpose: {ing.purpose}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caution Ingredients */}
                {cautionIngredients.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-caution flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Caution Ingredients ({cautionIngredients.length})
                    </h3>
                    <div className="space-y-2">
                      {cautionIngredients.map((ing: Ingredient, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-caution/10 border border-caution/30">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-foreground">{ing.name}</span>
                            {getRiskBadge(ing.riskLevel)}
                          </div>
                          {ing.healthConcerns && (
                            <p className="text-sm text-caution">{ing.healthConcerns}</p>
                          )}
                          {ing.purpose && (
                            <p className="text-xs text-muted-foreground mt-1">Purpose: {ing.purpose}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safe Ingredients */}
                {safeIngredients.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-safe flex items-center gap-2">
                      <Beaker className="w-4 h-4" />
                      Other Ingredients ({safeIngredients.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {safeIngredients.map((ing: Ingredient, idx: number) => (
                        <Badge 
                          key={idx} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {ing.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Ingredients Message */}
                {ingredients.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Beaker className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No ingredient data available for this scan</p>
                  </div>
                )}

                {/* Dietary Flags */}
                {scan.dietary_flags && Object.keys(scan.dietary_flags).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground">Dietary Information</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(scan.dietary_flags).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-xs capitalize">
                            {key.replace(/_/g, ' ')}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Comments Section */}
                <div className="border-t border-border pt-4">
                  <ProductComments
                    productBarcode={scan.barcode || scan.id}
                    productName={scan.product_name}
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <Button 
                onClick={onClose}
                className="w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
