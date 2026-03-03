import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SymptomTracker, SymptomData } from "@/components/SymptomTracker";
import { 
  Package, 
  Activity, 
  Loader2, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

interface ToxicProduct {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  ingredients: any;
  created_at: string;
}

interface RecordSymptomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  toxicScans: ToxicProduct[];
  onSymptomsRecorded: () => void;
  standaloneMode?: boolean; // If true, save to user_symptoms table directly
}

export function RecordSymptomsModal({
  isOpen,
  onClose,
  toxicScans,
  onSymptomsRecorded,
  standaloneMode = false,
}: RecordSymptomsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [familyAffected, setFamilyAffected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"products" | "symptoms">("products");

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const getSelectedProductsData = () => {
    return toxicScans.filter((scan) => selectedProducts.includes(scan.id));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (symptoms.length === 0) {
      toast({
        title: "No symptoms selected",
        description: "Please select at least one symptom to record.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format symptoms for storage
      const formattedSymptoms = symptoms.map((s) => ({
        symptom: s.symptom,
        category: s.category,
        severity: s.severity,
        duration: s.duration,
        who_affected: s.whoAffected,
        reported_at: new Date().toISOString(),
      }));

      // Format toxic products exposure
      const toxicExposure = getSelectedProductsData().map((product) => ({
        scan_id: product.id,
        product_name: product.product_name,
        brand: product.brand,
        health_score: product.health_score,
        scanned_at: product.created_at,
      }));

      // Get overall severity (highest)
      const severityOrder = { mild: 1, moderate: 2, severe: 3 };
      const overallSeverity = symptoms.reduce((max, s) => {
        return severityOrder[s.severity] > severityOrder[max as keyof typeof severityOrder]
          ? s.severity
          : max;
      }, "mild");

      // Get longest duration
      const durationOrder = {
        just_started: 1,
        days: 2,
        weeks: 3,
        months: 4,
        over_6_months: 5,
        years: 6,
      };
      const longestDuration = symptoms.reduce((max, s) => {
        const current = durationOrder[s.duration as keyof typeof durationOrder] || 0;
        const maxVal = durationOrder[max as keyof typeof durationOrder] || 0;
        return current > maxVal ? s.duration : max;
      }, "just_started");

      // Save to user_symptoms table (standalone symptom tracking)
      for (const symptom of symptoms) {
        const { error: symptomError } = await supabase.from("user_symptoms").insert({
          user_id: user.id,
          symptom: symptom.symptom,
          category: symptom.category,
          severity: symptom.severity,
          duration: symptom.duration,
          who_affected: symptom.whoAffected,
          linked_products: toxicExposure,
          reported_at: new Date().toISOString(),
        });

        if (symptomError) {
          console.error("Error saving symptom:", symptomError);
        }
      }

      // Also save to legal_leads for tracking purposes (unless standalone mode)
      if (!standaloneMode && toxicExposure.length > 0) {
        // Format family affected
        const formattedFamily = familyAffected.map((member) => ({
          member,
          reported_at: new Date().toISOString(),
        }));

        await supabase.from("legal_leads").insert({
          user_id: user.id,
          symptoms: formattedSymptoms,
          symptom_severity: overallSeverity,
          symptom_duration: longestDuration,
          family_affected: formattedFamily,
          toxic_products_exposure: toxicExposure,
          phone_number: "not-provided",
          consent_given: true,
          consent_text: "Symptom journal entry - not a legal consultation request",
          lead_source: "symptom_journal",
          lead_status: "symptom_tracking",
          consultation_requested: false,
        });
      }

      toast({
        title: "Symptoms recorded",
        description: `${symptoms.length} symptom(s) saved successfully.`,
      });

      // Reset and close
      setSelectedProducts([]);
      setSymptoms([]);
      setFamilyAffected([]);
      setStep("products");
      onSymptomsRecorded();
      onClose();
    } catch (error) {
      console.error("Error recording symptoms:", error);
      toast({
        title: "Error",
        description: "Failed to record symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedProducts([]);
    setSymptoms([]);
    setFamilyAffected([]);
    setStep("products");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Record Symptoms
          </DialogTitle>
          <DialogDescription>
            {step === "products"
              ? "Select products you suspect are causing symptoms"
              : "Select the symptoms you're experiencing"}
          </DialogDescription>
        </DialogHeader>

        {step === "products" ? (
          <div className="space-y-4">
            {/* Product Selection */}
            {toxicScans.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Toxic Products Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Scan some products first to link symptoms to them.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Select products with health scores below 50 that may be causing symptoms:
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {toxicScans.map((product) => {
                    const isSelected = selectedProducts.includes(product.id);
                    return (
                      <motion.label
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-danger/50 bg-danger/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {product.product_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {product.brand && <span>{product.brand}</span>}
                            <span>•</span>
                            <span>{format(new Date(product.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            (product.health_score || 0) < 30
                              ? "border-danger/50 text-danger"
                              : "border-caution/50 text-caution"
                          }
                        >
                          {product.health_score || 0}
                        </Badge>
                      </motion.label>
                    );
                  })}
                </div>

                {/* Skip product selection option */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("symptoms")}
                  className="w-full text-muted-foreground"
                >
                  Skip - Record symptoms without linking to products
                </Button>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setStep("symptoms")}
                disabled={toxicScans.length === 0}
                className="flex-1"
              >
                {selectedProducts.length > 0
                  ? `Continue with ${selectedProducts.length} product(s)`
                  : "Continue"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Products Summary */}
            {selectedProducts.length > 0 && (
              <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Linking symptoms to:
                </p>
                <div className="flex flex-wrap gap-1">
                  {getSelectedProductsData().map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-xs">
                      {p.product_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Symptom Tracker */}
            <SymptomTracker
              selectedSymptoms={symptoms}
              onSymptomsChange={setSymptoms}
              familyAffected={familyAffected}
              onFamilyAffectedChange={setFamilyAffected}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-background">
              <Button
                variant="outline"
                onClick={() => setStep("products")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || symptoms.length === 0}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save {symptoms.length} Symptom{symptoms.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
