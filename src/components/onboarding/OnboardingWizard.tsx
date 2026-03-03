import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check, ShieldAlert, Baby } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { WelcomeStep } from "./steps/WelcomeStep";
import { QuickProfileStep } from "./steps/QuickProfileStep";
import { MomJourneyStep } from "./steps/MomJourneyStep";
import { BabyProfileStep } from "./steps/BabyProfileStep";
import { SafetyConcernsStep } from "./steps/SafetyConcernsStep";
import { ContactInfoStep } from "./steps/ContactInfoStep";

export interface OnboardingData {
  profile: {
    is_vegan: boolean;
    is_gluten_free: boolean;
    is_dairy_free: boolean;
    is_pregnant: boolean;
    is_diabetic: boolean;
    is_heart_healthy: boolean;
    is_new_mom: boolean;
    is_nursing: boolean;
    has_weight_loss_goal: boolean;
    has_hypertension: boolean;
    has_high_cholesterol: boolean;
    has_kidney_disease: boolean;
    has_ibs: boolean;
    has_thyroid_condition: boolean;
    has_gout: boolean;
    has_autoimmune: boolean;
    has_celiac_disease: boolean;
    has_gerd: boolean;
    has_osteoporosis: boolean;
    has_liver_disease: boolean;
    is_cancer_survivor: boolean;
    allergies: string[];
  };
  momJourney: string | null;
  babyProfile: {
    due_date: string;
    baby_ages: number[];
    feeding_stage: string;
    baby_count: number;
    trimester?: string;
    newsletter_optin?: boolean;
  };
  safetyConcerns: string[];
  contactInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    smsConsent: boolean;
    legalConsent: boolean;
  };
}

const initialData: OnboardingData = {
  profile: {
    is_vegan: false,
    is_gluten_free: false,
    is_dairy_free: false,
    is_pregnant: false,
    is_diabetic: false,
    is_heart_healthy: false,
    is_new_mom: false,
    is_nursing: false,
    has_weight_loss_goal: false,
    has_hypertension: false,
    has_high_cholesterol: false,
    has_kidney_disease: false,
    has_ibs: false,
    has_thyroid_condition: false,
    has_gout: false,
    has_autoimmune: false,
    has_celiac_disease: false,
    has_gerd: false,
    has_osteoporosis: false,
    has_liver_disease: false,
    is_cancer_survivor: false,
    allergies: [],
  },
  momJourney: null,
  babyProfile: {
    due_date: "",
    baby_ages: [],
    feeding_stage: "",
    baby_count: 0,
    trimester: undefined,
    newsletter_optin: false,
  },
  safetyConcerns: [],
  contactInfo: {
    firstName: "",
    lastName: "",
    phone: "",
    smsConsent: false,
    legalConsent: false,
  },
};

interface OnboardingWizardProps {
  userId: string;
  user?: User | null;
  onComplete: () => void;
}

export const OnboardingWizard = ({ userId, user, onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [needsContactInfo, setNeedsContactInfo] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user needs to provide contact info and pre-fill from Google metadata
  useEffect(() => {
    const checkAndPrefillContactInfo = async () => {
      try {
        // Fetch current profile to check if contact info exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone_number")
          .eq("id", userId)
          .maybeSingle();

        const hasContactInfo = profile?.first_name && profile?.phone_number;
        setNeedsContactInfo(!hasContactInfo);

        // Pre-fill contact info from existing profile or Google metadata
        if (!hasContactInfo) {
          let firstName = profile?.first_name || "";
          let lastName = profile?.last_name || "";

          // Try to get name from Google OAuth metadata
          if (!firstName && user?.user_metadata) {
            const fullName = user.user_metadata.full_name || user.user_metadata.name || "";
            const nameParts = fullName.trim().split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          }

          setData((prev) => ({
            ...prev,
            contactInfo: {
              ...prev.contactInfo,
              firstName,
              lastName,
            },
          }));
        }
      } catch (error) {
        console.error("Error checking contact info:", error);
      }
    };

    checkAndPrefillContactInfo();
  }, [userId, user]);

  // Dynamic steps based on mom journey selection and contact info needs
  const getSteps = () => {
    const baseSteps = [
      { id: "welcome", title: "Welcome" },
    ];

    // Add contact info step if needed (right after welcome)
    if (needsContactInfo) {
      baseSteps.push({ id: "contact_info", title: "Stay Protected" });
    }

    baseSteps.push({ id: "mom_journey", title: "Your Journey" });

    // If user selected a mom journey, add baby-specific steps
    if (data.momJourney && data.momJourney !== "not_applicable") {
      baseSteps.push(
        { id: "baby_profile", title: "Baby Profile" },
        { id: "safety_concerns", title: "Safety Concerns" }
      );
    }

    baseSteps.push(
      { id: "profile", title: "Quick Profile" }
    );

    return baseSteps;
  };

  const STEPS = getSteps();
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateProfile = (updates: Partial<OnboardingData["profile"]>) => {
    setData((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  };

  const updateBabyProfile = (updates: Partial<OnboardingData["babyProfile"]>) => {
    setData((prev) => ({
      ...prev,
      babyProfile: { ...prev.babyProfile, ...updates },
    }));
  };

  const toggleSafetyConcern = (concern: string) => {
    setData((prev) => ({
      ...prev,
      safetyConcerns: prev.safetyConcerns.includes(concern)
        ? prev.safetyConcerns.filter((c) => c !== concern)
        : [...prev.safetyConcerns, concern],
    }));
  };

  const updateContactInfo = (updates: Partial<OnboardingData["contactInfo"]>) => {
    setData((prev) => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, ...updates },
    }));
  };

  const handleMomJourneySelect = (journey: string | null) => {
    setData((prev) => ({
      ...prev,
      momJourney: journey,
      profile: {
        ...prev.profile,
        is_pregnant: journey === "expecting",
        is_new_mom: journey === "new_mom" || journey === "toddler_mom",
        is_nursing: journey === "expecting" || journey === "new_mom",
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkipProfile = async () => {
    await handleComplete(true);
  };

  const getLeadCategory = (): string | null => {
    if (!data.momJourney) return null;
    
    if (data.momJourney === "expecting") return "prenatal";
    
    const ages = data.babyProfile.baby_ages;
    if (ages.length === 0) return "postnatal_0_6m";
    
    const maxAge = Math.max(...ages);
    if (maxAge <= 6) return "postnatal_0_6m";
    if (maxAge <= 12) return "postnatal_6_12m";
    return "postnatal_toddler";
  };

  const handleComplete = async (skipped = false) => {
    setIsSaving(true);
    try {
      const profileUpdate: Record<string, any> = {
        onboarding_completed: true,
      };

      // Always save contact info if provided (even if profile is skipped)
      if (data.contactInfo.firstName) {
        profileUpdate.first_name = data.contactInfo.firstName;
      }
      if (data.contactInfo.lastName) {
        profileUpdate.last_name = data.contactInfo.lastName;
      }
      if (data.contactInfo.phone) {
        const phoneDigits = data.contactInfo.phone.replace(/\D/g, "");
        const formattedPhone = phoneDigits.length === 10 ? `+1${phoneDigits}` : null;
        if (formattedPhone) {
          profileUpdate.phone_number = formattedPhone;
          profileUpdate.wants_recall_sms = data.contactInfo.smsConsent;
        }
      }

      // Only add profile data if not skipped
      if (!skipped) {
        profileUpdate.is_vegan = data.profile.is_vegan;
        profileUpdate.is_gluten_free = data.profile.is_gluten_free;
        profileUpdate.is_dairy_free = data.profile.is_dairy_free;
        profileUpdate.is_pregnant = data.profile.is_pregnant;
        profileUpdate.is_diabetic = data.profile.is_diabetic;
        profileUpdate.is_heart_healthy = data.profile.is_heart_healthy;
        profileUpdate.is_new_mom = data.profile.is_new_mom;
        profileUpdate.is_nursing = data.profile.is_nursing;
        // New health conditions
        profileUpdate.has_weight_loss_goal = data.profile.has_weight_loss_goal;
        profileUpdate.has_hypertension = data.profile.has_hypertension;
        profileUpdate.has_high_cholesterol = data.profile.has_high_cholesterol;
        profileUpdate.has_kidney_disease = data.profile.has_kidney_disease;
        profileUpdate.has_ibs = data.profile.has_ibs;
        profileUpdate.has_thyroid_condition = data.profile.has_thyroid_condition;
        profileUpdate.has_gout = data.profile.has_gout;
        profileUpdate.has_autoimmune = data.profile.has_autoimmune;
        profileUpdate.has_celiac_disease = data.profile.has_celiac_disease;
        profileUpdate.has_gerd = data.profile.has_gerd;
        profileUpdate.has_osteoporosis = data.profile.has_osteoporosis;
        profileUpdate.has_liver_disease = data.profile.has_liver_disease;
        profileUpdate.is_cancer_survivor = data.profile.is_cancer_survivor;
        profileUpdate.allergies_detailed = {
          items: data.profile.allergies,
          severity: {},
          notes: "",
        };

        // Add baby-specific data
        if (data.momJourney && data.momJourney !== "not_applicable") {
          profileUpdate.feeding_stage = data.babyProfile.feeding_stage || null;
          profileUpdate.parenting_concerns = data.safetyConcerns;
          profileUpdate.baby_count = data.babyProfile.baby_ages.length || 1;
          profileUpdate.baby_ages = data.babyProfile.baby_ages;
          profileUpdate.newsletter_optin = data.babyProfile.newsletter_optin || false;

          if (data.momJourney === "expecting" && data.babyProfile.due_date) {
            profileUpdate.due_date = data.babyProfile.due_date;
            // Store baby_dob as estimated DOB (the due date)
            profileUpdate.baby_dob = data.babyProfile.due_date;
          }
          
          if (data.babyProfile.trimester) {
            profileUpdate.trimester = data.babyProfile.trimester;
          }
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (profileError) throw profileError;

      // Create legal lead if consent given and phone provided
      if (data.contactInfo.legalConsent && data.contactInfo.phone) {
        const phoneDigits = data.contactInfo.phone.replace(/\D/g, "");
        const formattedPhone = phoneDigits.length === 10 ? `+1${phoneDigits}` : null;
        
        if (formattedPhone) {
          const leadCategory = getLeadCategory();
          
          // Check if lead already exists
          const { data: existingLead } = await supabase
            .from("legal_leads")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (existingLead) {
            // Update existing lead with contact info
            await supabase
              .from("legal_leads")
              .update({
                phone_number: formattedPhone,
                email: user?.email || null,
                first_name: data.contactInfo.firstName,
                last_name: data.contactInfo.lastName,
                lead_category: leadCategory,
                baby_food_concerns: data.safetyConcerns.length > 0 ? data.safetyConcerns : null,
                feeding_method: data.babyProfile.feeding_stage || null,
              })
              .eq("user_id", userId);
          } else {
            // Create new legal lead
            await supabase
              .from("legal_leads")
              .insert({
                user_id: userId,
                phone_number: formattedPhone,
                email: user?.email || null,
                first_name: data.contactInfo.firstName,
                last_name: data.contactInfo.lastName,
                consent_given: true,
                consent_timestamp: new Date().toISOString(),
                lead_source: "onboarding",
                lead_category: leadCategory,
                baby_food_concerns: data.safetyConcerns.length > 0 ? data.safetyConcerns : null,
                feeding_method: data.babyProfile.feeding_stage || null,
              });
          }
        }
      } else if (!skipped && data.momJourney && data.momJourney !== "not_applicable") {
        // Update existing lead with baby info even without legal consent
        const leadCategory = getLeadCategory();
        
        const { data: existingLead } = await supabase
          .from("legal_leads")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingLead) {
          await supabase
            .from("legal_leads")
            .update({
              lead_category: leadCategory,
              baby_food_concerns: data.safetyConcerns,
              feeding_method: data.babyProfile.feeding_stage || null,
            })
            .eq("user_id", userId);
        }
      }

      const message = data.momJourney && data.momJourney !== "not_applicable"
        ? "Your baby's protection shield is now active!"
        : "You're now protected against dangerous food products.";

      toast({
        title: "Protection Activated!",
        description: message,
      });

      // Auto-sync enriched profile to Klaviyo after onboarding
      supabase.functions.invoke('klaviyo-sync', {
        body: { 
          action: 'auto_sync_user', 
          userId,
          newsletter_optin: data.babyProfile.newsletter_optin || false,
        }
      }).catch(err => console.error('[Klaviyo] Post-onboarding sync error:', err));

      onComplete();
      navigate("/scanner");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    const stepId = STEPS[currentStep]?.id;
    
    switch (stepId) {
      case "welcome":
        return <WelcomeStep />;
      case "contact_info":
        return (
          <ContactInfoStep
            data={data.contactInfo}
            onChange={updateContactInfo}
          />
        );
      case "mom_journey":
        return (
          <MomJourneyStep
            selectedJourney={data.momJourney}
            onSelect={handleMomJourneySelect}
          />
        );
      case "baby_profile":
        return (
          <BabyProfileStep
            journey={data.momJourney!}
            data={data.babyProfile}
            onChange={updateBabyProfile}
          />
        );
      case "safety_concerns":
        return (
          <SafetyConcernsStep
            selectedConcerns={data.safetyConcerns}
            onToggle={toggleSafetyConcern}
          />
        );
      case "profile":
        return (
          <QuickProfileStep
            data={data.profile}
            onChange={updateProfile}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const isProfileStep = STEPS[currentStep]?.id === "profile";
  const isContactInfoStep = STEPS[currentStep]?.id === "contact_info";
  const isMomStep = STEPS[currentStep]?.id === "mom_journey" ||
                    STEPS[currentStep]?.id === "baby_profile" ||
                    STEPS[currentStep]?.id === "safety_concerns";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              {isMomStep ? (
                <Baby className="w-4 h-4 text-pink-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-danger" />
              )}
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="font-medium text-foreground">{STEPS[currentStep]?.title}</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted [&>div]:bg-danger" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 gap-2 border-border text-foreground hover:bg-muted"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          {isProfileStep && (
            <Button
              variant="ghost"
              onClick={handleSkipProfile}
              disabled={isSaving}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Skip
            </Button>
          )}
          
          {!isLastStep ? (
            <Button
              onClick={handleNext}
              className="flex-1 gap-2 bg-danger hover:bg-danger/90"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => handleComplete(false)}
              disabled={isSaving}
              className="flex-1 gap-2 bg-safe hover:bg-safe/90 text-white"
            >
              {isSaving ? "Activating..." : "Start Scanning"}
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
