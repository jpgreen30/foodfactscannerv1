import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  Scale, 
  Dumbbell, 
  Zap, 
  Heart, 
  Moon,
  Leaf,
  Shield,
  Sparkles,
  Target,
  ShieldAlert,
  Trophy,
  Rocket
} from "lucide-react";

interface GoalsData {
  dietary_goals: string | null;
  priorities: string[];
}

interface GoalsStepProps {
  data: GoalsData;
  onChange: (updates: Partial<GoalsData>) => void;
}

// Animated goals illustration
const AnimatedGoalsIllustration = () => (
  <div className="relative w-24 h-24 mx-auto mb-4">
    {/* Target rings */}
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-safe/30"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.1 }}
    />
    <motion.div
      className="absolute inset-3 rounded-full border-2 border-safe/50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2 }}
    />
    
    {/* Center target */}
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
      className="absolute inset-6 rounded-full bg-gradient-to-br from-safe to-safe/60 flex items-center justify-center shadow-[0_0_40px_hsl(var(--safe)/0.5)]"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Target className="w-6 h-6 text-white" />
      </motion.div>
    </motion.div>
    
    {/* Success stars */}
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          top: `${50 + Math.sin((angle * Math.PI) / 180) * 50}%`,
          left: `${50 + Math.cos((angle * Math.PI) / 180) * 50}%`,
          transform: "translate(-50%, -50%)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          delay: i * 0.3,
          ease: "easeInOut"
        }}
      >
        <Sparkles className="w-3 h-3 text-safe" />
      </motion.div>
    ))}
  </div>
);

const dietaryGoals = [
  { id: "weight_loss", label: "Weight Loss", icon: Scale, desc: "Track calorie dangers", emoji: "⚖️" },
  { id: "muscle_gain", label: "Muscle Gain", icon: Dumbbell, desc: "Protein-focused scanning", emoji: "💪" },
  { id: "energy", label: "More Energy", icon: Zap, desc: "Avoid energy-draining ingredients", emoji: "⚡" },
  { id: "heart_health", label: "Heart Protection", icon: Heart, desc: "Block heart-damaging foods", emoji: "❤️" },
  { id: "better_sleep", label: "Better Sleep", icon: Moon, desc: "Avoid sleep disruptors", emoji: "🌙" },
  { id: "general_wellness", label: "General Defense", icon: Leaf, desc: "Overall health protection", emoji: "🌿" },
];

const priorities = [
  { id: "avoid_additives", label: "Block Additives", icon: Shield, desc: "No artificial chemicals", emoji: "🛡️" },
  { id: "organic", label: "Organic Only", icon: Leaf, desc: "Warn on non-organic", emoji: "🌱" },
  { id: "low_sodium", label: "Low Sodium", icon: Sparkles, desc: "Alert on high salt", emoji: "🧂" },
  { id: "low_sugar", label: "Low Sugar", icon: Sparkles, desc: "Expose hidden sugars", emoji: "🍬" },
  { id: "whole_foods", label: "Whole Foods", icon: Leaf, desc: "Flag processed junk", emoji: "🥬" },
  { id: "high_fiber", label: "High Fiber", icon: Heart, desc: "Prioritize fiber content", emoji: "🌾" },
];

export const GoalsStep = ({ data, onChange }: GoalsStepProps) => {
  const togglePriority = (id: string) => {
    const isSelected = data.priorities.includes(id);
    onChange({
      priorities: isSelected
        ? data.priorities.filter((p) => p !== id)
        : [...data.priorities, id],
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedGoalsIllustration />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-safe" />
          Protection Goals
        </h2>
        <p className="text-muted-foreground">
          What are you defending against? We'll customize your <span className="text-safe font-semibold">threat detection</span>.
        </p>
      </motion.div>

      {/* Primary Goal */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Rocket className="w-4 h-4 text-safe" />
          Primary Mission
        </Label>
        <motion.div 
          className="grid grid-cols-2 gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {dietaryGoals.map((goal) => (
            <motion.button
              key={goal.id}
              variants={{
                hidden: { opacity: 0, scale: 0.9 },
                visible: { opacity: 1, scale: 1 }
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange({ dietary_goals: goal.id })}
              className={cn(
                "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                data.dietary_goals === goal.id
                  ? "border-safe bg-safe/20 shadow-[0_0_20px_hsl(var(--safe)/0.3)]"
                  : "border-border bg-muted/50 hover:border-safe/50"
              )}
            >
              {data.dietary_goals === goal.id && (
                <motion.div
                  className="absolute top-2 right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <div className="w-5 h-5 rounded-full bg-safe flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </motion.div>
              )}
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                  data.dietary_goals === goal.id ? "bg-muted" : "bg-muted/50"
                )}
                animate={data.dietary_goals === goal.id ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <span className="text-2xl">{goal.emoji}</span>
              </motion.div>
              <p className="font-medium text-foreground text-sm">{goal.label}</p>
              <p className="text-xs text-muted-foreground">{goal.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Priorities */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          Additional Shields (select all that apply)
        </Label>
        <motion.div 
          className="flex flex-wrap gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.03 } }
          }}
        >
          {priorities.map((priority) => {
            const isSelected = data.priorities.includes(priority.id);
            return (
              <motion.button
                key={priority.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => togglePriority(priority.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                  isSelected
                    ? "border-safe bg-safe/20 shadow-[0_0_15px_hsl(var(--safe)/0.3)]"
                    : "border-border bg-muted/50 hover:border-safe/50"
                )}
              >
                <motion.span
                  animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {priority.emoji}
                </motion.span>
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-safe" : "text-foreground"
                )}>
                  {priority.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Summary Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 bg-safe/20 rounded-xl border border-safe/30 relative overflow-hidden"
      >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-safe/10 via-safe/5 to-safe/10"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="relative">
          <p className="text-sm font-medium text-safe mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Your Protection Summary
          </p>
          <p className="text-sm text-muted-foreground">
            {data.dietary_goals ? (
              <>
                You're defending against threats to <span className="font-medium text-foreground">
                  {dietaryGoals.find(g => g.id === data.dietary_goals)?.label.toLowerCase()}
                </span>
                {data.priorities.length > 0 && (
                  <>, with shields for <span className="font-medium text-foreground">
                    {data.priorities.map(p => 
                      priorities.find(pr => pr.id === p)?.label.toLowerCase()
                    ).join(", ")}
                  </span>
                  </>
                )}
                .
              </>
            ) : (
              "Select a mission to see your protection summary."
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
