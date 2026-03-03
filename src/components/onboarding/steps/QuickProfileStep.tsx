import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Baby, Heart, Droplet, Wheat, Leaf, Pill, Sparkles, Scale, Activity, Stethoscope, Zap, ShieldCheck } from "lucide-react";

interface QuickProfileStepProps {
  data: {
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
  onChange: (updates: Partial<QuickProfileStepProps["data"]>) => void;
}

const DIETARY_OPTIONS = [
  { id: "is_vegan", label: "Vegan", icon: Leaf, color: "text-green-400" },
  { id: "is_gluten_free", label: "Gluten-Free", icon: Wheat, color: "text-amber-400" },
  { id: "is_dairy_free", label: "Dairy-Free", icon: Droplet, color: "text-blue-400" },
];

const PARENTING_OPTIONS = [
  { id: "is_pregnant", label: "Currently Expecting", icon: Baby, color: "text-pink-400", description: "I'm pregnant" },
  { id: "is_nursing", label: "Nursing/Breastfeeding", icon: Sparkles, color: "text-purple-400", description: "Currently breastfeeding" },
  { id: "is_new_mom", label: "New Mom (Baby Under 2)", icon: Baby, color: "text-blue-400", description: "I have a baby or toddler" },
];

const HEALTH_OPTIONS = [
  { id: "is_diabetic", label: "Diabetic", icon: Pill, color: "text-purple-400", description: "Type 1 or Type 2 Diabetes" },
  { id: "is_heart_healthy", label: "Heart Condition", icon: Heart, color: "text-red-400", description: "Heart disease or arrhythmia" },
  { id: "has_weight_loss_goal", label: "Weight Loss Goals", icon: Scale, color: "text-teal-400", description: "Actively managing weight" },
  { id: "has_hypertension", label: "High Blood Pressure", icon: Activity, color: "text-orange-400", description: "Hypertension" },
  { id: "has_high_cholesterol", label: "High Cholesterol", icon: Heart, color: "text-pink-400", description: "LDL cholesterol management" },
  { id: "has_kidney_disease", label: "Kidney Disease", icon: Droplet, color: "text-cyan-400", description: "CKD or kidney conditions" },
  { id: "has_ibs", label: "IBS/Digestive Issues", icon: Stethoscope, color: "text-amber-400", description: "IBS, Crohn's, or digestive sensitivity" },
  { id: "has_thyroid_condition", label: "Thyroid Condition", icon: Zap, color: "text-yellow-400", description: "Hypo/Hyperthyroidism" },
  { id: "has_gout", label: "Gout", icon: Pill, color: "text-rose-400", description: "Elevated uric acid levels" },
  { id: "has_autoimmune", label: "Autoimmune Condition", icon: ShieldCheck, color: "text-indigo-400", description: "Lupus, RA, MS, etc." },
  { id: "has_celiac_disease", label: "Celiac Disease", icon: Wheat, color: "text-amber-500", description: "Gluten autoimmune disorder" },
  { id: "has_gerd", label: "GERD/Acid Reflux", icon: Stethoscope, color: "text-orange-500", description: "Gastroesophageal reflux" },
  { id: "has_osteoporosis", label: "Osteoporosis", icon: Activity, color: "text-slate-400", description: "Bone density condition" },
  { id: "has_liver_disease", label: "Liver Disease", icon: Droplet, color: "text-emerald-400", description: "Hepatic conditions" },
  { id: "is_cancer_survivor", label: "Cancer Survivor", icon: Heart, color: "text-violet-400", description: "Post-treatment considerations" },
];

const COMMON_ALLERGIES = [
  "Peanuts", "Tree Nuts", "Milk", "Eggs", "Wheat", "Soy", "Fish", "Shellfish"
];

export const QuickProfileStep = ({ data, onChange }: QuickProfileStepProps) => {
  const toggleAllergy = (allergy: string) => {
    const current = data.allergies || [];
    if (current.includes(allergy)) {
      onChange({ allergies: current.filter(a => a !== allergy) });
    } else {
      onChange({ allergies: [...current, allergy] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-safe/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-safe" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">
          Quick Profile Setup
        </h2>
        <p className="text-muted-foreground text-sm">
          Help us personalize your scan results (optional)
        </p>
      </motion.div>

      {/* Dietary Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Leaf className="w-4 h-4" />
          Dietary Preferences
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {DIETARY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isChecked = data[option.id as keyof typeof data] as boolean;
            
            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isChecked 
                    ? "bg-safe/20 border border-safe/40" 
                    : "bg-muted/50 border border-border hover:border-muted-foreground/30"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => onChange({ [option.id]: checked as boolean })}
                  className="border-muted-foreground/40 data-[state=checked]:bg-safe data-[state=checked]:border-safe"
                />
                <Icon className={`w-4 h-4 ${option.color}`} />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            );
          })}
        </div>
      </motion.div>

      {/* Parenting Stage - New/Expecting Moms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Baby className="w-4 h-4" />
          Parenting Stage
        </h3>
        <p className="text-xs text-muted-foreground">
          Select if applicable - helps us flag ingredients unsafe during pregnancy, nursing, or for young children
        </p>
        <div className="grid grid-cols-1 gap-2">
          {PARENTING_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isChecked = data[option.id as keyof typeof data] as boolean;
            
            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isChecked 
                    ? "bg-pink-500/20 border border-pink-500/40" 
                    : "bg-muted/50 border border-border hover:border-muted-foreground/30"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => onChange({ [option.id]: checked as boolean })}
                  className="border-muted-foreground/40 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                />
                <Icon className={`w-4 h-4 ${option.color}`} />
                <div className="flex-1">
                  <span className="text-sm text-foreground">{option.label}</span>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </motion.div>

      {/* Health Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Health Conditions
        </h3>
        <p className="text-xs text-muted-foreground">
          Select all that apply - helps us flag harmful ingredients for your conditions
        </p>
        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {HEALTH_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isChecked = data[option.id as keyof typeof data] as boolean;
            
            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isChecked 
                    ? "bg-caution/20 border border-caution/40" 
                    : "bg-muted/50 border border-border hover:border-muted-foreground/30"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => onChange({ [option.id]: checked as boolean })}
                  className="border-muted-foreground/40 data-[state=checked]:bg-caution data-[state=checked]:border-caution"
                />
                <Icon className={`w-4 h-4 shrink-0 ${option.color}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground block">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </label>
            );
          })}
        </div>
      </motion.div>

      {/* Common Allergies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-foreground/80">
          Common Allergies
        </h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGIES.map((allergy) => {
            const isSelected = (data.allergies || []).includes(allergy);
            
            return (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleAllergy(allergy)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  isSelected
                    ? "bg-danger/20 border border-danger/40 text-danger"
                    : "bg-muted/50 border border-border text-muted-foreground hover:border-muted-foreground/40"
                }`}
              >
                {allergy}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Skip hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-muted-foreground"
      >
        You can always update these settings later in your profile
      </motion.p>
    </div>
  );
};