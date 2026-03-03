import { motion, AnimatePresence } from "framer-motion";
import { Skull, AlertTriangle, ChevronDown, ChevronUp, Volume2, Square, Scale, Phone, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LegalConsultationForm } from "./LegalConsultationForm";
import { playToxicAlert, isSoundEnabled } from "@/services/alertSounds";

interface Ingredient {
  name: string;
  definition?: string;
  purpose?: string;
  riskLevel: string;
  healthConcerns?: string[];
  regulatoryStatus?: string;
  iarcClassification?: string | null;
}

interface ToxicIngredientsAlertProps {
  ingredients: Ingredient[];
  productName?: string;
  brand?: string;
  healthScore?: number;
  scanId?: string;
}

const riskConfig = {
  high: {
    label: "HIGH RISK",
    bgClass: "bg-danger/20",
    borderClass: "border-danger",
    textClass: "text-danger",
    dotClass: "bg-danger",
  },
  moderate: {
    label: "MODERATE RISK",
    bgClass: "bg-caution/20",
    borderClass: "border-caution",
    textClass: "text-caution",
    dotClass: "bg-caution",
  },
};

const normalizeRiskLevel = (riskLevel: string): "high" | "moderate" | "low" | "safe" => {
  switch (riskLevel) {
    case "high":
    case "danger":
      return "high";
    case "moderate":
    case "caution":
      return "moderate";
    case "low":
      return "low";
    default:
      return "safe";
  }
};

export const ToxicIngredientsAlert = ({ 
  ingredients, 
  productName = "Unknown Product",
  brand,
  healthScore = 0,
  scanId
}: ToxicIngredientsAlertProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLegalForm, setShowLegalForm] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Play alert sound when toxic ingredients are detected
  useEffect(() => {
    const hasHighRisk = ingredients.some(
      (ing) => normalizeRiskLevel(ing.riskLevel) === "high"
    );
    const hasModerateRisk = ingredients.some(
      (ing) => normalizeRiskLevel(ing.riskLevel) === "moderate"
    );
    
    if (hasHighRisk || hasModerateRisk) {
      // Small delay to ensure component is visible first
      const timer = setTimeout(() => {
        playToxicAlert(hasHighRisk, hasModerateRisk);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [ingredients]);
  const toxicIngredients = ingredients.filter((ing) => {
    const normalized = normalizeRiskLevel(ing.riskLevel);
    return normalized === "high" || normalized === "moderate";
  });
  
  const highRiskIngredients = toxicIngredients.filter(
    (ing) => normalizeRiskLevel(ing.riskLevel) === "high"
  );
  const moderateRiskIngredients = toxicIngredients.filter(
    (ing) => normalizeRiskLevel(ing.riskLevel) === "moderate"
  );
  
  if (toxicIngredients.length === 0) {
    return null;
  }

  const hasHighRisk = highRiskIngredients.length > 0;

  const generateSpeechText = () => {
    let text = "";
    
    if (highRiskIngredients.length > 0) {
      text += `Warning! This product contains ${highRiskIngredients.length} high-risk ingredient${highRiskIngredients.length > 1 ? 's' : ''}. `;
      highRiskIngredients.forEach((ing, index) => {
        text += `${ing.name}. `;
        if (ing.healthConcerns && ing.healthConcerns.length > 0) {
          text += `Health concerns include: ${ing.healthConcerns.slice(0, 2).join(', ')}. `;
        }
      });
    }
    
    if (moderateRiskIngredients.length > 0) {
      text += `Additionally, there are ${moderateRiskIngredients.length} moderate-risk ingredient${moderateRiskIngredients.length > 1 ? 's' : ''}. `;
      moderateRiskIngredients.forEach((ing, index) => {
        text += `${ing.name}. `;
        if (ing.healthConcerns && ing.healthConcerns.length > 0) {
          text += `Concerns: ${ing.healthConcerns.slice(0, 1).join(', ')}. `;
        }
      });
    }
    
    text += hasHighRisk 
      ? "Consider avoiding or limiting consumption of this product."
      : "Review these ingredients based on your personal health needs.";
    
    return text;
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsPlaying(false);
  };

  const playVoiceAlert = () => {
    // Check if Web Speech API is supported
    if (!window.speechSynthesis) {
      toast({
        title: "Not Supported",
        description: "Voice playback is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      stopSpeech();
      return;
    }

    const speechText = generateSpeechText();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utteranceRef.current = utterance;

    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to select an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (voice) => voice.lang.startsWith("en") && voice.localService
    ) || voices.find((voice) => voice.lang.startsWith("en"));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsPlaying(false);
      utteranceRef.current = null;
      if (event.error !== "canceled") {
        toast({
          title: "Voice Alert Failed",
          description: "Could not play voice alert.",
          variant: "destructive",
        });
      }
    };

    window.speechSynthesis.speak(utterance);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl border-2 overflow-hidden",
        hasHighRisk 
          ? "border-danger bg-danger/10 shadow-[0_0_30px_hsl(var(--danger)/0.3)]" 
          : "border-caution bg-caution/10 shadow-[0_0_20px_hsl(var(--caution)/0.2)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1"
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            hasHighRisk ? "bg-danger" : "bg-caution"
          )}>
            <Skull className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h3 className={cn(
              "font-bold text-lg uppercase tracking-wide",
              hasHighRisk ? "text-danger" : "text-caution"
            )}>
              {hasHighRisk ? "⚠️ TOXIC INGREDIENTS DETECTED" : "⚠️ CONCERNING INGREDIENTS"}
            </h3>
            <p className="text-sm text-foreground font-medium">
              {highRiskIngredients.length > 0 && (
                <span className="text-danger font-semibold">{highRiskIngredients.length} high-risk</span>
              )}
              {highRiskIngredients.length > 0 && moderateRiskIngredients.length > 0 && ", "}
              {moderateRiskIngredients.length > 0 && (
                <span className="text-caution font-semibold">{moderateRiskIngredients.length} moderate-risk</span>
              )}
              {" "}ingredient{toxicIngredients.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </button>
        
        {/* Voice playback button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={playVoiceAlert}
            size="icon"
            className={cn(
              "rounded-full transition-all bg-safe hover:bg-safe/80 text-primary-foreground",
              isPlaying && "animate-pulse"
            )}
          >
            {isPlaying ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 pb-4 space-y-3"
        >
          {/* High risk ingredients first */}
          {highRiskIngredients.map((ingredient) => (
            <div
              key={ingredient.name}
              className={cn(
                "p-4 rounded-xl border",
                riskConfig.high.bgClass,
                riskConfig.high.borderClass
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", riskConfig.high.dotClass)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{ingredient.name}</span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      riskConfig.high.bgClass,
                      riskConfig.high.textClass
                    )}>
                      {riskConfig.high.label}
                    </span>
                  </div>
                  
                  {ingredient.definition && (
                    <p className="text-sm text-foreground/80 mt-1">{ingredient.definition}</p>
                  )}
                  
                  {ingredient.healthConcerns && ingredient.healthConcerns.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-danger uppercase mb-1">Health Concerns:</p>
                      <ul className="space-y-1">
                        {ingredient.healthConcerns.map((concern, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-danger shrink-0 mt-0.5" />
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {ingredient.iarcClassification && (
                    <p className="text-xs text-danger mt-2 font-medium">
                      IARC Classification: {ingredient.iarcClassification}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Moderate risk ingredients */}
          {moderateRiskIngredients.map((ingredient) => (
            <div
              key={ingredient.name}
              className={cn(
                "p-4 rounded-xl border",
                riskConfig.moderate.bgClass,
                riskConfig.moderate.borderClass
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", riskConfig.moderate.dotClass)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{ingredient.name}</span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      riskConfig.moderate.bgClass,
                      riskConfig.moderate.textClass
                    )}>
                      {riskConfig.moderate.label}
                    </span>
                  </div>
                  
                  {ingredient.definition && (
                    <p className="text-sm text-foreground/80 mt-1">{ingredient.definition}</p>
                  )}
                  
                  {ingredient.healthConcerns && ingredient.healthConcerns.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-caution uppercase mb-1">Health Concerns:</p>
                      <ul className="space-y-1">
                        {ingredient.healthConcerns.map((concern, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-caution shrink-0 mt-0.5" />
                            {concern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Summary warning */}
          <div className="flex items-center gap-2 p-3 bg-background/5 rounded-lg">
            <AlertTriangle className={cn("w-4 h-4 shrink-0", hasHighRisk ? "text-danger" : "text-caution")} />
            <p className="text-xs text-foreground/80">
              {hasHighRisk 
                ? "This product contains ingredients that may pose significant health risks. Consider avoiding or limiting consumption."
                : "This product contains ingredients that may affect some people. Review the concerns above."}
            </p>
          </div>

          {/* Were You Harmed CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-br from-safe/20 via-primary/20 to-safe/10 border-2 border-safe relative overflow-hidden"
          >
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-safe/0 via-safe/20 to-safe/0 animate-pulse" />
            
            <div className="relative">
              {/* Millions Badge */}
              <div className="flex justify-center mb-2">
                <span className="bg-safe text-safe-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  💰 CASES WORTH MILLIONS
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-safe" />
                <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                  You Could Be Owed MILLIONS!
                </h4>
              </div>
              
              <p className="text-xs text-foreground/80 mb-2 text-center">
                Food companies pay settlements averaging <span className="text-safe font-bold">$500K - $5M+</span>
              </p>
              
              {/* Mini settlements preview */}
              <div className="grid grid-cols-3 gap-1 mb-3 text-center">
                <div className="bg-background/50 rounded p-1">
                  <p className="text-xs font-bold text-safe">$2.1M</p>
                  <p className="text-[9px] text-foreground/70">Toxic Additive</p>
                </div>
                <div className="bg-background/50 rounded p-1">
                  <p className="text-xs font-bold text-safe">$1.8M</p>
                  <p className="text-[9px] text-foreground/70">Child Illness</p>
                </div>
                <div className="bg-background/50 rounded p-1">
                  <p className="text-xs font-bold text-safe">$750K</p>
                  <p className="text-[9px] text-foreground/70">Contamination</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => setShowLegalForm(true)}
                  className="w-full bg-safe hover:bg-safe/90 text-safe-foreground font-bold py-3 gap-2 shadow-lg shadow-safe/30"
                >
                  <CheckCircle className="w-5 h-5" />
                  YES - Get My FREE Case Review
                </Button>
                
                <div className="flex items-center justify-center gap-4 text-[10px] text-foreground/70">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    24/7 Support
                  </span>
                  <span>•</span>
                  <span>No Fees Unless You Win</span>
                  <span>•</span>
                  <span className="text-danger font-medium">Act Now!</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Legal Consultation Form Modal */}
      <AnimatePresence>
        {showLegalForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowLegalForm(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <LegalConsultationForm
                productName={productName}
                brand={brand}
                healthScore={healthScore}
                toxicIngredients={toxicIngredients.map(ing => ({
                  name: ing.name,
                  riskLevel: ing.riskLevel,
                  healthConcerns: ing.healthConcerns
                }))}
                scanId={scanId}
                onComplete={() => setShowLegalForm(false)}
                onClose={() => setShowLegalForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
