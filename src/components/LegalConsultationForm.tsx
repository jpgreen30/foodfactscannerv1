import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Scale, Phone, AlertTriangle, CheckCircle, Loader2, User, Mail, Shield, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAnalyticsEvents } from "@/hooks/useAnalyticsEvents";
import { SymptomTracker, SymptomData } from "./SymptomTracker";
import { triggerLegalLeadWebhook } from "@/services/zapierIntegration";

interface ToxicIngredient {
  name: string;
  riskLevel: string;
  healthConcerns?: string[];
}

interface AdditionalProduct {
  productName: string;
  brand?: string;
  healthScore: number;
  toxicIngredients?: ToxicIngredient[];
}

interface LegalConsultationFormProps {
  productName: string;
  brand?: string;
  healthScore: number;
  toxicIngredients: ToxicIngredient[];
  scanId?: string;
  additionalProducts?: AdditionalProduct[];
  initialSymptoms?: SymptomData[];
  onComplete?: () => void;
  onClose?: () => void;
}

export const LegalConsultationForm = ({
  productName,
  brand,
  healthScore,
  toxicIngredients,
  scanId,
  additionalProducts = [],
  initialSymptoms = [],
  onComplete,
  onClose,
}: LegalConsultationFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackFormSubmit, trackLeadCreated } = useAnalyticsEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSymptomTracker, setShowSymptomTracker] = useState(initialSymptoms.length > 0);
  const [showIngredientsBreakdown, setShowIngredientsBreakdown] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: user?.email || "",
    injuryDescription: "",
    consentLegal: false,
  });

  const [symptoms, setSymptoms] = useState<SymptomData[]>(initialSymptoms);
  const [familyAffected, setFamilyAffected] = useState<string[]>([]);

  const totalProducts = 1 + additionalProducts.length;

  // Helper for risk badge styling
  const getRiskBadgeStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
      case "danger":
        return "bg-danger/20 text-danger border-danger/30";
      case "moderate":
      case "caution":
        return "bg-caution/20 text-caution border-caution/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  // Convert database phone format (+1XXXXXXXXXX) to display format
  const formatPhoneFromDB = (phone: string) => {
    const digits = phone.replace(/\D/g, "").slice(-10);
    return formatPhoneNumber(digits);
  };

  // Pre-populate form with user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone_number, email")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        if (data) {
          const hasProfileData = data.first_name || data.last_name || data.phone_number;
          
          setFormData(prev => ({
            ...prev,
            firstName: data.first_name || prev.firstName,
            lastName: data.last_name || prev.lastName,
            phone: data.phone_number ? formatPhoneFromDB(data.phone_number) : prev.phone,
            email: data.email || user.email || prev.email,
          }));
          
          if (hasProfileData) {
            setIsProfileLoaded(true);
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      }
    };

    fetchProfileData();
  }, [user]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  // Calculate overall severity
  const getOverallSeverity = (): string | null => {
    if (symptoms.length === 0) return null;
    if (symptoms.some(s => s.severity === "severe")) return "severe";
    if (symptoms.some(s => s.severity === "moderate")) return "moderate";
    return "mild";
  };

  // Get longest duration
  const getLongestDuration = (): string | null => {
    if (symptoms.length === 0) return null;
    const durationOrder = ["just_started", "days", "weeks", "months", "over_6_months", "years"];
    let longest = 0;
    symptoms.forEach(s => {
      const idx = durationOrder.indexOf(s.duration);
      if (idx > longest) longest = idx;
    });
    return durationOrder[longest];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consentLegal) {
      toast({
        title: "Consent Required",
        description: "Please agree to be contacted by our partner law firms.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone || formData.phone.length < 14) {
      toast({
        title: "Phone Required",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firstName.trim()) {
      toast({
        title: "First Name Required",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Last Name Required",
        description: "Please enter your last name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build array of all toxic products with linked symptoms
      const allProducts = [
        {
          product_name: productName,
          brand: brand,
          health_score: healthScore,
          toxic_ingredients: toxicIngredients,
          scan_id: scanId,
          reported_at: new Date().toISOString(),
          linked_symptoms: symptoms.map(s => s.symptom),
        },
        ...additionalProducts.map(p => ({
          product_name: p.productName,
          brand: p.brand,
          health_score: p.healthScore,
          toxic_ingredients: p.toxicIngredients || [],
          reported_at: new Date().toISOString(),
          linked_symptoms: [],
        }))
      ];

      // Calculate quality score - higher with symptoms and children affected
      let qualityScore = Math.min(100, Math.max(50, 100 - healthScore));
      if (formData.injuryDescription) qualityScore += 10;
      if (totalProducts > 1) qualityScore += 10;
      if (symptoms.length > 0) qualityScore += 15;
      if (symptoms.some(s => s.severity === "severe")) qualityScore += 10;
      if (familyAffected.some(m => m.includes("child"))) qualityScore += 15;
      qualityScore = Math.min(100, qualityScore);

      // Create or update legal lead with symptoms
      const leadData = {
        user_id: user?.id || null,
        phone_number: formData.phone,
        email: formData.email || null,
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        injury_description: formData.injuryDescription || null,
        consent_given: true,
        consent_text: "I consent to being contacted by partner law firms regarding potential legal claims related to harmful food products.",
        consultation_requested: true,
        consultation_requested_at: new Date().toISOString(),
        toxic_products_exposure: allProducts,
        symptoms: symptoms.map(s => ({
          symptom: s.symptom,
          category: s.category,
          severity: s.severity,
          duration: s.duration,
          who_affected: s.whoAffected,
          reported_at: new Date().toISOString(),
        })),
        symptom_severity: getOverallSeverity(),
        symptom_duration: getLongestDuration(),
        family_affected: familyAffected.map(m => ({
          member: m,
          reported_at: new Date().toISOString(),
        })),
        lead_source: "consultation_form",
        lead_quality_score: qualityScore,
        lead_status: "qualified",
      };

      // Upsert the lead
      const { data: lead, error } = await supabase
        .from("legal_leads")
        .upsert(leadData as any, { onConflict: user?.id ? "user_id" : undefined })
        .select("id")
        .single();

      if (error) throw error;

      // Track form submission and lead creation
      trackFormSubmit(productName, scanId, symptoms.length, qualityScore);
      if (lead?.id) {
        trackLeadCreated(lead.id, productName, qualityScore);
      }

      // Trigger lead distribution and webhook
      if (lead?.id) {
        await supabase.functions.invoke("distribute-lead", {
          body: { leadId: lead.id },
        });
        
        // Trigger automation webhook with all data
        triggerLegalLeadWebhook({
          lead_id: lead.id,
          user_id: user?.id,
          email: formData.email,
          phone_number: formData.phone,
          first_name: formData.firstName,
          last_name: formData.lastName,
          lead_source: "consultation_form",
          lead_quality_score: qualityScore,
          lead_status: "qualified",
          injury_description: formData.injuryDescription,
          symptoms: symptoms,
          symptom_severity: getOverallSeverity() || undefined,
          symptom_duration: getLongestDuration() || undefined,
          family_affected: familyAffected.map(m => ({ member: m })),
          toxic_products_exposure: allProducts,
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          consultation_requested: true,
          consultation_requested_at: new Date().toISOString(),
        });
      }

      setIsSubmitted(true);
      toast({
        title: "Consultation Request Sent!",
        description: "A legal representative will contact you within 24 hours.",
      });

      onComplete?.();
    } catch (error: any) {
      console.error("Error submitting consultation request:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-6 text-center"
      >
        <div className="w-16 h-16 bg-safe/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-safe" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">💰 Case Review Started!</h3>
        <p className="text-muted-foreground mb-4">
          A legal representative will contact you within 24 hours to evaluate your potential <span className="text-safe font-bold">MILLION DOLLAR</span> case.
        </p>
        <div className="bg-safe/10 border border-safe/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Products Reported:</span> {totalProducts}
          </p>
          {symptoms.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Symptoms Documented:</span> {symptoms.length}
            </p>
          )}
          <p className="text-xs text-safe mt-1">Average settlements: $500K - $5M+</p>
        </div>
        <Button onClick={onClose} className="w-full">
          Continue Scanning
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-safe/20 via-primary/10 to-transparent p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-safe/20 rounded-full flex items-center justify-center">
            <Scale className="w-6 h-6 text-safe" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">💰 Your Case Could Be Worth MILLIONS</h3>
            <p className="text-sm text-safe font-medium">FREE Consultation • No fees unless you win</p>
          </div>
        </div>
        
        {/* Recent Settlements Badge */}
        <div className="bg-safe/10 border border-safe/30 rounded-lg p-2 mb-3">
          <p className="text-xs text-center text-muted-foreground">
            Food companies have paid <span className="font-bold text-safe">BILLIONS</span> in settlements. 
            Cases like yours average <span className="font-bold text-safe">$500K - $5M+</span>
          </p>
        </div>
        
        {/* Product reference with toxic ingredients breakdown */}
        <div className="bg-danger/10 border border-danger/30 rounded-lg overflow-hidden">
          {/* Header - clickable to expand */}
          <button
            type="button"
            onClick={() => setShowIngredientsBreakdown(!showIngredientsBreakdown)}
            className="w-full flex items-start gap-3 p-3 hover:bg-danger/20 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">
                {productName} {brand && `(${brand})`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {toxicIngredients.length} toxic ingredient{toxicIngredients.length !== 1 ? 's' : ''} will be shared with attorneys
              </p>
            </div>
            {showIngredientsBreakdown ? (
              <ChevronUp className="w-4 h-4 text-danger shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-danger shrink-0" />
            )}
          </button>
          
          {/* Expandable Ingredients List */}
          {showIngredientsBreakdown && (
            <div className="border-t border-danger/20 p-3 space-y-2 bg-danger/5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Evidence Being Submitted:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {toxicIngredients.map((ingredient, index) => (
                  <div 
                    key={index} 
                    className="bg-card rounded-lg p-2 border border-border"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {ingredient.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] ${getRiskBadgeStyle(ingredient.riskLevel)}`}
                      >
                        {ingredient.riskLevel === "high" || ingredient.riskLevel === "danger" 
                          ? "HIGH RISK" 
                          : "MODERATE RISK"}
                      </Badge>
                    </div>
                    {ingredient.healthConcerns && ingredient.healthConcerns.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {ingredient.healthConcerns.slice(0, 3).map((concern, i) => (
                          <span 
                            key={i} 
                            className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                          >
                            {concern}
                          </span>
                        ))}
                        {ingredient.healthConcerns.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{ingredient.healthConcerns.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Additional products if any */}
              {additionalProducts.length > 0 && (
                <div className="pt-2 border-t border-danger/20">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                    Additional Products:
                  </p>
                  {additionalProducts.map((product, i) => (
                    <div key={i} className="text-xs text-foreground">
                      + {product.productName} ({product.toxicIngredients?.length || 0} toxic ingredients)
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Symptoms Summary */}
        {symptoms.length > 0 && (
          <div className="mt-3 bg-caution/10 border border-caution/30 rounded-lg p-3">
            <p className="text-xs font-medium text-foreground mb-1">
              📋 {symptoms.length} Symptom{symptoms.length !== 1 ? 's' : ''} Documented
            </p>
            <div className="flex flex-wrap gap-1">
              {symptoms.slice(0, 4).map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {s.symptom}
                </Badge>
              ))}
              {symptoms.length > 4 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{symptoms.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Auto-filled indicator */}
        {isProfileLoaded && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-safe/10 border border-safe/30">
            <Sparkles className="w-4 h-4 text-safe" />
            <span className="text-xs text-safe font-medium">Auto-filled from your profile</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-foreground">First Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-foreground">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Symptom Tracker Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSymptomTracker(!showSymptomTracker)}
            className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                📋 Document Your Symptoms
              </span>
              {symptoms.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {symptoms.length} selected
                </Badge>
              )}
            </div>
            {showSymptomTracker ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {showSymptomTracker && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">
                Documenting symptoms strengthens your case and can lead to higher settlements.
              </p>
              <SymptomTracker
                selectedSymptoms={symptoms}
                onSymptomsChange={setSymptoms}
                familyAffected={familyAffected}
                onFamilyAffectedChange={setFamilyAffected}
                compact={false}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="injury" className="text-foreground">
            Additional Details (Optional)
          </Label>
          <Textarea
            id="injury"
            placeholder="Describe when symptoms started, frequency, any doctor visits, etc..."
            value={formData.injuryDescription}
            onChange={(e) => setFormData({ ...formData, injuryDescription: e.target.value })}
            className="min-h-[80px]"
          />
        </div>

        {/* Legal Consent */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consentLegal"
              checked={formData.consentLegal}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, consentLegal: checked as boolean })
              }
              className="mt-1"
            />
            <Label htmlFor="consentLegal" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I consent to being contacted by partner law firms regarding potential legal claims related to harmful food products. I understand this is a free consultation with no obligation.
            </Label>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>Your information is protected and confidential</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4" />
                Request Consultation
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
