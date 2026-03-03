import { useState } from "react";
import { motion } from "framer-motion";
import { Baby, Calendar, Milk, Apple, Utensils, Mail, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface BabyProfileData {
  due_date: string;
  baby_ages: number[];
  feeding_stage: string;
  baby_count: number;
  trimester?: string;
  newsletter_optin?: boolean;
}

interface BabyProfileStepProps {
  journey: string;
  data: BabyProfileData;
  onChange: (updates: Partial<BabyProfileData>) => void;
}

const AGE_OPTIONS = [
  { id: "0-3", label: "0-3 months", months: 2, icon: "🍼" },
  { id: "3-6", label: "3-6 months", months: 4, icon: "🍼" },
  { id: "6-9", label: "6-9 months", months: 7, icon: "🥣" },
  { id: "9-12", label: "9-12 months", months: 10, icon: "🥄" },
  { id: "12-18", label: "12-18 months", months: 15, icon: "🥗" },
  { id: "18-24", label: "18-24 months", months: 21, icon: "🍽️" },
  { id: "24-36", label: "24-36 months", months: 30, icon: "🧒" },
];

const TRIMESTER_OPTIONS = [
  { id: "1st", label: "1st Trimester", description: "Weeks 1-12", monthsUntilDue: 6 },
  { id: "2nd", label: "2nd Trimester", description: "Weeks 13-26", monthsUntilDue: 4 },
  { id: "3rd", label: "3rd Trimester", description: "Weeks 27-40", monthsUntilDue: 2 },
];

const FEEDING_STAGES = [
  { 
    id: "breastfeeding", 
    icon: Milk, 
    label: "Breastfeeding Only",
    description: "I'm watching what I eat for my baby",
    forJourney: ["expecting", "new_mom"]
  },
  { 
    id: "formula", 
    icon: Baby, 
    label: "Formula Feeding",
    description: "Scanning formulas for safety",
    forJourney: ["new_mom"]
  },
  { 
    id: "combination", 
    icon: Baby, 
    label: "Combination",
    description: "Both breast milk and formula",
    forJourney: ["new_mom"]
  },
  { 
    id: "starting_solids", 
    icon: Apple, 
    label: "Starting Solids",
    description: "Introducing first foods (4-6+ months)",
    forJourney: ["new_mom"]
  },
  { 
    id: "baby_food", 
    icon: Utensils, 
    label: "Baby Foods",
    description: "Purees and soft foods",
    forJourney: ["new_mom", "toddler_mom"]
  },
  { 
    id: "toddler_food", 
    icon: Utensils, 
    label: "Toddler Foods",
    description: "Regular foods with modifications",
    forJourney: ["toddler_mom"]
  },
];

export const BabyProfileStep = ({ journey, data, onChange }: BabyProfileStepProps) => {
  const isExpecting = journey === "expecting";
  const [useTrimester, setUseTrimester] = useState(false);
  
  const filteredFeedingStages = FEEDING_STAGES.filter(stage => 
    stage.forJourney.includes(journey)
  );

  const handleAgeSelect = (months: number) => {
    const currentAges = data.baby_ages || [];
    if (currentAges.includes(months)) {
      onChange({ baby_ages: currentAges.filter(a => a !== months) });
    } else {
      onChange({ baby_ages: [...currentAges, months] });
    }
  };

  const handleTrimesterSelect = (trimesterId: string) => {
    const trimester = TRIMESTER_OPTIONS.find(t => t.id === trimesterId);
    if (!trimester) return;
    
    // Compute approximate due date
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + trimester.monthsUntilDue);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    onChange({ 
      trimester: trimesterId,
      due_date: dueDateStr,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 mb-2">
          {isExpecting ? <Calendar className="w-8 h-8 text-white" /> : <Baby className="w-8 h-8 text-white" />}
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {isExpecting ? "When Are You Due?" : "Tell Us About Your Little One"}
        </h2>
        <p className="text-muted-foreground">
          {isExpecting 
            ? "We'll provide trimester-specific safety alerts"
            : "We'll tailor warnings for your baby's age and feeding stage"
          }
        </p>
      </motion.div>

      {/* Due Date / Trimester for Expecting Moms */}
      {isExpecting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {!useTrimester ? (
            <>
              <Label htmlFor="due_date" className="text-foreground font-medium">
                Expected Due Date
              </Label>
              <Input
                id="due_date"
                type="date"
                value={data.due_date || ""}
                onChange={(e) => onChange({ due_date: e.target.value, trimester: undefined })}
                className="bg-muted/50 border-border text-foreground"
              />
              <button
                type="button"
                onClick={() => setUseTrimester(true)}
                className="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                Don't know your exact due date?
              </button>
            </>
          ) : (
            <>
              <Label className="text-foreground font-medium">
                Which Trimester Are You In?
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {TRIMESTER_OPTIONS.map((tri) => {
                  const isSelected = data.trimester === tri.id;
                  return (
                    <Button
                      key={tri.id}
                      type="button"
                      variant="outline"
                      onClick={() => handleTrimesterSelect(tri.id)}
                      className={`h-auto py-3 px-3 flex-col gap-1 ${
                        isSelected
                          ? "bg-sky-500/20 border-sky-500/50 text-foreground"
                          : "bg-muted/50 border-border text-muted-foreground"
                      }`}
                    >
                      <span className="text-sm font-medium">{tri.label}</span>
                      <span className="text-xs opacity-70">{tri.description}</span>
                    </Button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => { setUseTrimester(false); onChange({ trimester: undefined }); }}
                className="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                I know my exact due date
              </button>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            This helps us warn you about first-trimester risks like certain fish, deli meats, and unpasteurized products.
          </p>
        </motion.div>
      )}

      {/* Baby Age Selector */}
      {!isExpecting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <Label className="text-foreground font-medium">
            Baby's Age Range
          </Label>
          <p className="text-xs text-muted-foreground">
            Select all that apply if you have multiple children
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AGE_OPTIONS.map((age) => {
              const isSelected = (data.baby_ages || []).includes(age.months);
              return (
                <Button
                  key={age.id}
                  type="button"
                  variant="outline"
                  onClick={() => handleAgeSelect(age.months)}
                  className={`h-auto py-3 px-4 flex-col gap-1 ${
                    isSelected
                      ? "bg-sky-500/20 border-sky-500/50 text-foreground"
                      : "bg-muted/50 border-border text-muted-foreground"
                  }`}
                >
                  <span className="text-xl">{age.icon}</span>
                  <span className="text-sm font-medium">{age.label}</span>
                </Button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Feeding Stage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <Label className="text-foreground font-medium">
          {isExpecting ? "Planning to..." : "Current Feeding Stage"}
        </Label>
        <div className="space-y-2">
          {filteredFeedingStages.map((stage) => {
            const Icon = stage.icon;
            const isSelected = data.feeding_stage === stage.id;
            
            return (
              <Button
                key={stage.id}
                type="button"
                variant="outline"
                onClick={() => onChange({ feeding_stage: stage.id })}
                className={`w-full h-auto py-3 px-4 justify-start gap-3 ${
                  isSelected
                    ? "bg-sky-500/20 border-sky-500/50 text-foreground"
                    : "bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <span className="font-medium block">{stage.label}</span>
                  <span className="text-xs opacity-70">{stage.description}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* Newsletter Opt-in */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Gift className="w-6 h-6 text-sky-400" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              📬 Get Weekly Stage-Based Parenting Newsletters
            </p>
            <p className="text-xs text-muted-foreground">
              Tips, safety alerts, freebies worth $400 & much much more — personalized to your baby's exact age!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox
            id="newsletter_optin"
            checked={data.newsletter_optin || false}
            onCheckedChange={(checked) => onChange({ newsletter_optin: checked === true })}
          />
          <label htmlFor="newsletter_optin" className="text-sm text-foreground cursor-pointer">
            Yes, sign me up for free weekly newsletters!
          </label>
        </div>
      </motion.div>

      {/* Warning Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-danger/10 border border-danger/20 rounded-lg p-4"
      >
        <p className="text-sm text-foreground/80 text-center">
          {isExpecting 
            ? "🤰 We'll flag mercury in fish, listeria risks, and ingredients to avoid during each trimester."
            : "👶 We'll flag heavy metals, choking hazards, and age-inappropriate ingredients for your baby."
          }
        </p>
      </motion.div>
    </div>
  );
};
