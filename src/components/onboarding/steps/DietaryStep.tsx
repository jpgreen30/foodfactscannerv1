import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Leaf, Wheat, Milk, Apple, AlertTriangle, Utensils, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DietaryData {
  is_vegan: boolean;
  is_vegetarian: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  diet_type: string | null;
}

interface DietaryStepProps {
  data: DietaryData;
  onChange: (updates: Partial<DietaryData>) => void;
}

// Animated dietary illustration
const AnimatedDietaryIllustration = () => (
  <div className="relative w-24 h-24 mx-auto mb-4">
    {/* Rotating plate */}
    <motion.div
      className="absolute inset-0 rounded-full border-4 border-dashed border-safe/30"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Center icon */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      className="absolute inset-2 rounded-full bg-gradient-to-br from-safe to-safe/60 flex items-center justify-center shadow-[0_0_40px_hsl(var(--safe)/0.4)]"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Utensils className="w-8 h-8 text-white" />
      </motion.div>
    </motion.div>
    
    {/* Floating food icons */}
    {[
      { Icon: Leaf, angle: 0, color: "text-safe" },
      { Icon: Wheat, angle: 90, color: "text-caution" },
      { Icon: Apple, angle: 180, color: "text-danger" },
      { Icon: Milk, angle: 270, color: "text-primary" },
    ].map(({ Icon, angle, color }, i) => (
      <motion.div
        key={i}
        className="absolute w-6 h-6"
        style={{
          top: `${50 + Math.sin((angle * Math.PI) / 180) * 45}%`,
          left: `${50 + Math.cos((angle * Math.PI) / 180) * 45}%`,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 + i * 0.1 }}
      >
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </motion.div>
      </motion.div>
    ))}
  </div>
);

const dietTypes = [
  { id: "standard", label: "Standard", desc: "No specific diet", emoji: "🍽️" },
  { id: "keto", label: "Keto", desc: "Low carb, high fat", emoji: "🥑" },
  { id: "paleo", label: "Paleo", desc: "Whole foods diet", emoji: "🥩" },
  { id: "mediterranean", label: "Mediterranean", desc: "Heart-healthy", emoji: "🫒" },
  { id: "whole30", label: "Whole30", desc: "30-day reset", emoji: "🥗" },
];

const dietaryOptions = [
  { key: "is_vegan" as const, icon: Leaf, label: "Vegan", desc: "Alert on animal products", color: "safe" },
  { key: "is_vegetarian" as const, icon: Apple, label: "Vegetarian", desc: "Alert on meat & fish", color: "safe" },
  { key: "is_gluten_free" as const, icon: Wheat, label: "Gluten-Free", desc: "Alert on wheat & gluten", color: "caution" },
  { key: "is_dairy_free" as const, icon: Milk, label: "Dairy-Free", desc: "Alert on milk products", color: "caution" },
];

export const DietaryStep = ({ data, onChange }: DietaryStepProps) => {
  return (
    <div className="space-y-6">
      <AnimatedDietaryIllustration />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-danger" />
          Dietary Defense Settings
        </h2>
        <p className="text-muted-foreground">
          We'll warn you when products violate these preferences
        </p>
      </motion.div>

      {/* Diet Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Diet Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {dietTypes.map((diet, index) => (
            <motion.button
              key={diet.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange({ diet_type: diet.id })}
              className={cn(
                "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                data.diet_type === diet.id
                  ? "border-danger bg-danger/20"
                  : "border-border bg-muted/50 hover:border-danger/50"
              )}
            >
              {data.diet_type === diet.id && (
                <motion.div
                  layoutId="diet-selected"
                  className="absolute inset-0 bg-danger/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative flex items-center gap-2">
                <span className="text-xl">{diet.emoji}</span>
                <div>
                  <p className="font-medium text-foreground text-sm">{diet.label}</p>
                  <p className="text-xs text-muted-foreground">{diet.desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-danger" />
          Alert Triggers
        </Label>
        <div className="space-y-2">
          {dietaryOptions.map((option, index) => (
            <motion.div
              key={option.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              whileHover={{ x: 3 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                data[option.key] 
                  ? `border-${option.color} bg-${option.color}/20` 
                  : "border-border bg-muted/50"
              )}
              style={{
                borderColor: data[option.key] ? `hsl(var(--${option.color}))` : undefined,
                backgroundColor: data[option.key] ? `hsl(var(--${option.color}) / 0.15)` : undefined,
              }}
            >
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  data[option.key] ? "bg-muted" : "bg-muted/50"
                )}
                animate={data[option.key] ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <option.icon className={cn(
                  "w-6 h-6 transition-colors",
                  data[option.key] ? `text-${option.color}` : "text-muted-foreground"
                )} 
                style={{ color: data[option.key] ? `hsl(var(--${option.color}))` : undefined }}
                />
              </motion.div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.desc}</p>
              </div>
              <Switch
                checked={data[option.key]}
                onCheckedChange={(checked) => onChange({ [option.key]: checked })}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
