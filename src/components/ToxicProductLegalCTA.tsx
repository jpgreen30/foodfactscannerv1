import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LegalConsultationForm } from "./LegalConsultationForm";
import { SymptomData } from "./SymptomTracker";
import { Scale, Phone, ChevronRight, X, Gavel, DollarSign, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ToxicIngredient {
  name: string;
  riskLevel: string;
  healthConcerns?: string[];
}

interface ToxicProductLegalCTAProps {
  productName: string;
  brand?: string;
  healthScore: number;
  toxicIngredients: ToxicIngredient[];
  scanId?: string;
}

const QUICK_SYMPTOMS = [
  { id: "headaches", label: "Headaches / Migraines", icon: "🤕", category: "neurological" },
  { id: "fatigue", label: "Chronic Fatigue", icon: "😴", category: "neurological" },
  { id: "digestive", label: "Digestive Issues", icon: "🤢", category: "digestive" },
  { id: "skin", label: "Skin Problems / Rashes", icon: "🔴", category: "skin" },
  { id: "allergies", label: "Allergic Reactions", icon: "🤧", category: "allergic" },
  { id: "focus", label: "Brain Fog / Focus Issues", icon: "😵", category: "neurological" },
  { id: "mood", label: "Mood Changes / Anxiety", icon: "😰", category: "neurological" },
  { id: "child_behavior", label: "Child Behavioral Issues", icon: "👶", category: "children" },
];

export const ToxicProductLegalCTA = ({
  productName,
  brand,
  healthScore,
  toxicIngredients,
  scanId,
}: ToxicProductLegalCTAProps) => {
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [symptomDuration, setSymptomDuration] = useState("weeks");
  const [whoAffected, setWhoAffected] = useState("me");
  const [showForm, setShowForm] = useState(false);
  const { trackCTAView, trackCTAClick, trackSymptomSelect, trackFormOpen } = useAnalyticsEvents();

  // Track CTA view on mount
  useEffect(() => {
    if (hasSignificantRisk) {
      trackCTAView(productName, scanId, healthScore);
    }
  }, [productName, scanId, healthScore, trackCTAView]);

  // Only show if there are high/moderate risk ingredients
  const hasSignificantRisk = toxicIngredients.some(
    (ing) => ing.riskLevel === "high" || ing.riskLevel === "danger" || ing.riskLevel === "moderate" || ing.riskLevel === "caution"
  );

  const toggleSymptom = (id: string) => {
    setSelectedSymptomIds(prev => {
      const newIds = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      // Track symptom selection
      if (!prev.includes(id)) {
        const symptom = QUICK_SYMPTOMS.find(s => s.id === id);
        if (symptom) {
          trackSymptomSelect(symptom.label, productName, scanId);
        }
      }
      return newIds;
    });
  };

  const handleCTAClick = () => {
    trackCTAClick(productName, scanId, selectedSymptomIds.length);
    trackFormOpen(productName, scanId);
    setShowForm(true);
  };

  const hasSymptoms = selectedSymptomIds.length > 0;

  // Convert quick symptoms to SymptomData format for the form
  const getSymptomDataForForm = (): SymptomData[] => {
    return selectedSymptomIds.map(id => {
      const symptom = QUICK_SYMPTOMS.find(s => s.id === id);
      return {
        symptom: symptom?.label || id,
        category: symptom?.category || "other",
        severity: symptomSeverity,
        duration: symptomDuration,
        whoAffected: whoAffected,
      };
    });
  };

  if (!hasSignificantRisk) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative overflow-hidden"
      >
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-danger/30 via-primary to-danger/30 rounded-2xl blur-xl opacity-40 animate-pulse" />
        
        <div className="relative bg-gradient-to-br from-card via-card to-danger/10 border-2 border-danger/50 rounded-2xl p-6 shadow-[0_0_40px_hsl(var(--danger)/0.2)]">
          {/* Urgency Badge */}
          <div className="absolute -top-3 left-6 flex gap-2">
            <span className="bg-danger text-danger-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              ⚠️ TIME SENSITIVE
            </span>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              FREE CONSULTATION
            </span>
          </div>

          <div className="mt-4">
            {/* Children Warning Section */}
            <div className="bg-danger/20 border border-danger/40 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-danger rounded-full flex items-center justify-center">
                  <span className="text-lg">👶</span>
                </div>
                <h4 className="font-bold text-danger text-sm uppercase">
                  ⚠️ Children Are At Higher Risk!
                </h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <p className="text-foreground flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>Children absorb <span className="font-bold text-danger">5x more toxins</span> than adults</span>
                </p>
                <p className="text-foreground flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span><span className="font-bold text-danger">1 in 6 kids</span> have developmental disorders linked to food toxins</span>
                </p>
                <p className="text-foreground flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>These ingredients cause <span className="font-bold text-danger">ADHD, cancer, organ damage</span></span>
                </p>
              </div>
              <p className="text-[10px] text-danger/80 mt-2 font-medium text-center">
                Your case could be worth MILLIONS if you or your family have been harmed
              </p>
            </div>

            {/* Symptom Checklist with Enhanced Tracking */}
            <div className="bg-caution/10 border border-caution/30 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-caution" />
                <h4 className="font-bold text-foreground text-sm">
                  Have You Experienced Any of These Symptoms?
                </h4>
              </div>
              
              {/* Quick Symptom Selection */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {QUICK_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => toggleSymptom(symptom.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-left ${
                      selectedSymptomIds.includes(symptom.id)
                        ? "bg-danger/20 border border-danger/50"
                        : "bg-background/50 border border-transparent hover:bg-background/80"
                    }`}
                  >
                    <span className="text-xs">{symptom.icon} {symptom.label}</span>
                  </button>
                ))}
              </div>

              {/* Symptom Details when selected */}
              {hasSymptoms && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Severity</label>
                      <Select value={symptomSeverity} onValueChange={(v) => setSymptomSeverity(v as any)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Duration</label>
                      <Select value={symptomDuration} onValueChange={setSymptomDuration}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="just_started">Just started</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Who</label>
                      <Select value={whoAffected} onValueChange={setWhoAffected}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="me">Me</SelectItem>
                          <SelectItem value="child_under_2">Child under 2</SelectItem>
                          <SelectItem value="child_2_5">Child (2-5)</SelectItem>
                          <SelectItem value="child_6_12">Child (6-12)</SelectItem>
                          <SelectItem value="teenager">Teenager</SelectItem>
                          <SelectItem value="multiple">Multiple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-2 bg-danger/20 border border-danger/40 rounded-lg">
                    <p className="text-xs text-center text-danger font-bold">
                      ⚠️ {selectedSymptomIds.length} symptom{selectedSymptomIds.length !== 1 ? "s" : ""} documented!
                    </p>
                    <p className="text-[10px] text-center text-foreground mt-1">
                      {symptomSeverity === "severe" ? "Severe symptoms = STRONGER case worth " : "These symptoms strengthen your case worth "}
                      <span className="text-safe font-bold">$500K - $5M+</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Main Question */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto bg-danger/20 rounded-full flex items-center justify-center border-2 border-danger/30 mb-3">
                <Scale className="w-8 h-8 text-danger" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {hasSymptoms ? "Your Symptoms Could Mean a BIGGER Settlement!" : "Did This Product Harm You or Your Family?"}
              </h3>
              <p className="text-base font-bold text-safe animate-pulse">
                💰 {hasSymptoms ? `${selectedSymptomIds.length} Symptoms = STRONGER Case!` : "YOUR CASE Could Be Worth MILLIONS!"}
              </p>
              <p className="text-xs text-foreground/80 mt-1">
                {hasSymptoms ? "Document your symptoms NOW before it's too late" : "Cases involving toxic ingredients have settled for $1M - $10M+"}
              </p>
            </div>

            {/* Two Clear Options */}
            <div className="space-y-3 mb-4">
              {/* Primary YES Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleCTAClick}
                  className="w-full h-14 gap-3 bg-danger hover:bg-danger/90 text-danger-foreground font-bold text-base shadow-lg shadow-danger/30"
                >
                  <Phone className="w-5 h-5" />
                  YES - I Want a FREE Consultation
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Secondary Option */}
              <Button
                variant="outline"
                onClick={handleCTAClick}
                className="w-full gap-2 border-primary/30 hover:bg-primary/10"
              >
                <Gavel className="w-4 h-4 text-primary" />
                I Want to Learn About My Rights
              </Button>
            </div>

            {/* Recent Settlements Section */}
            <div className="bg-safe/10 border border-safe/30 rounded-lg p-3 mb-3">
              <p className="text-xs font-bold text-safe text-center mb-2">💰 RECENT SETTLEMENTS</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-safe">$2.1M</p>
                  <p className="text-[10px] text-foreground/70">Food Additive</p>
                </div>
                <div className="border-x border-safe/20">
                  <p className="text-sm font-bold text-safe">$1.8M</p>
                  <p className="text-[10px] text-foreground/70">Child Illness</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-safe">$750K</p>
                  <p className="text-[10px] text-foreground/70">Contamination</p>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg mb-3">
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-safe mx-auto mb-1" />
                <span className="text-xs text-foreground/80">No Fees<br/>Unless You Win</span>
              </div>
              <div className="text-center border-x border-border">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-xs text-foreground/80">Response<br/>Within 24hrs</span>
              </div>
              <div className="text-center">
                <Gavel className="w-5 h-5 text-primary mx-auto mb-1" />
                <span className="text-xs text-foreground/80">Top Injury<br/>Attorneys</span>
              </div>
            </div>

            {/* Urgency Warning */}
            <div className="flex items-center justify-center gap-2 text-xs text-danger">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">Don't miss your chance at MILLIONS. Time limits apply!</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
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
                  productName={productName}
                  brand={brand}
                  healthScore={healthScore}
                  toxicIngredients={toxicIngredients}
                  scanId={scanId}
                  initialSymptoms={getSymptomDataForForm()}
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
