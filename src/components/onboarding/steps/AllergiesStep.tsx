import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertTriangle, Skull, X, ShieldOff, Siren } from "lucide-react";

interface AllergiesData {
  items: string[];
  severity: Record<string, "mild" | "moderate" | "severe">;
  notes: string;
}

interface AllergiesStepProps {
  data: AllergiesData;
  onChange: (updates: Partial<AllergiesData>) => void;
}

// Animated danger illustration
const AnimatedDangerIllustration = () => (
  <div className="relative w-24 h-24 mx-auto mb-4">
    {/* Pulsing danger rings */}
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-danger/40"
      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.div
      className="absolute inset-2 rounded-full border-2 border-danger/50"
      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
    />
    
    {/* Center warning */}
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="absolute inset-4 rounded-full bg-gradient-to-br from-danger to-danger/70 flex items-center justify-center shadow-[0_0_40px_hsl(var(--danger)/0.5)]"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Skull className="w-8 h-8 text-white" />
      </motion.div>
    </motion.div>
    
    {/* Warning triangles */}
    {[0, 120, 240].map((angle, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          top: `${50 + Math.sin((angle * Math.PI) / 180) * 48}%`,
          left: `${50 + Math.cos((angle * Math.PI) / 180) * 48}%`,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 + i * 0.1 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        >
          <AlertTriangle className="w-4 h-4 text-caution" />
        </motion.div>
      </motion.div>
    ))}
  </div>
);

const commonAllergens = [
  { id: "peanuts", label: "Peanuts", emoji: "🥜" },
  { id: "tree_nuts", label: "Tree Nuts", emoji: "🌰" },
  { id: "milk", label: "Milk", emoji: "🥛" },
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "wheat", label: "Wheat", emoji: "🌾" },
  { id: "soy", label: "Soy", emoji: "🫘" },
  { id: "fish", label: "Fish", emoji: "🐟" },
  { id: "shellfish", label: "Shellfish", emoji: "🦐" },
  { id: "sesame", label: "Sesame", emoji: "🌱" },
  { id: "mustard", label: "Mustard", emoji: "🟡" },
  { id: "celery", label: "Celery", emoji: "🥬" },
  { id: "sulphites", label: "Sulphites", emoji: "🍷" },
];

const severityLevels = [
  { id: "mild", label: "Mild", color: "bg-caution/30 text-caution", icon: "⚡" },
  { id: "moderate", label: "Moderate", color: "bg-orange-500/30 text-orange-400", icon: "⚠️" },
  { id: "severe", label: "Severe", color: "bg-danger/30 text-danger", icon: "☠️" },
];

export const AllergiesStep = ({ data, onChange }: AllergiesStepProps) => {
  const toggleAllergen = (id: string) => {
    const isSelected = data.items.includes(id);
    if (isSelected) {
      onChange({
        items: data.items.filter((item) => item !== id),
        severity: Object.fromEntries(
          Object.entries(data.severity).filter(([key]) => key !== id)
        ),
      });
    } else {
      onChange({
        items: [...data.items, id],
        severity: { ...data.severity, [id]: "moderate" },
      });
    }
  };

  const setSeverity = (id: string, level: "mild" | "moderate" | "severe") => {
    onChange({
      severity: { ...data.severity, [id]: level },
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedDangerIllustration />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <Siren className="w-5 h-5 text-danger" />
          Critical Danger Alerts
        </h2>
        <p className="text-muted-foreground">
          Select allergens that could harm you - we'll <span className="text-danger font-semibold">immediately warn</span> you
        </p>
      </motion.div>

      {/* Allergen Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <ShieldOff className="w-4 h-4 text-danger" />
          Deadly Allergens
        </Label>
        <motion.div 
          className="flex flex-wrap gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.03 } }
          }}
        >
          {commonAllergens.map((allergen) => {
            const isSelected = data.items.includes(allergen.id);
            return (
              <motion.button
                key={allergen.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 }
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleAllergen(allergen.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full border transition-all",
                  isSelected
                    ? "border-danger bg-danger/20 shadow-[0_0_15px_hsl(var(--danger)/0.3)]"
                    : "border-border bg-muted/50 hover:border-danger/50"
                )}
              >
                <motion.span
                  animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {allergen.emoji}
                </motion.span>
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-danger" : "text-foreground"
                )}>
                  {allergen.label}
                </span>
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                    >
                      <X className="w-3 h-3 text-danger" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Severity Selection for Selected Allergens */}
      <AnimatePresence>
        {data.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-caution" />
              Severity Levels
            </Label>
            <div className="space-y-2">
              {data.items.map((allergenId, index) => {
                const allergen = commonAllergens.find((a) => a.id === allergenId);
                if (!allergen) return null;
                
                return (
                  <motion.div
                    key={allergenId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{allergen.emoji}</span>
                      <span className="font-medium text-foreground">{allergen.label}</span>
                    </span>
                    <div className="flex gap-1">
                      {severityLevels.map((level) => (
                        <motion.button
                          key={level.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSeverity(allergenId, level.id as "mild" | "moderate" | "severe")}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1",
                            data.severity[allergenId] === level.id
                              ? level.color
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          <span>{level.icon}</span>
                          <span className="hidden sm:inline">{level.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional Notes */}
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Label className="text-sm font-medium text-foreground">
          Other allergies or notes (optional)
        </Label>
        <Textarea
          placeholder="E.g., sensitivity to artificial colors, specific brand allergies..."
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="resize-none bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-danger/50"
          rows={3}
        />
      </motion.div>
    </div>
  );
};
