import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  Heart, 
  Baby, 
  Droplets, 
  Activity, 
  Brain, 
  Pill,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Stethoscope,
  HeartPulse
} from "lucide-react";

interface HealthConditionsData {
  conditions: string[];
  is_pregnant: boolean;
  is_diabetic: boolean;
  is_heart_healthy: boolean;
  age_group: string | null;
}

interface HealthConditionsStepProps {
  data: HealthConditionsData;
  onChange: (updates: Partial<HealthConditionsData>) => void;
}

// Animated health illustration
const AnimatedHealthIllustration = () => (
  <div className="relative w-24 h-24 mx-auto mb-4">
    {/* Heartbeat line */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      <motion.path
        d="M 0 50 L 20 50 L 30 30 L 40 70 L 50 50 L 60 50 L 70 40 L 80 60 L 90 50 L 100 50"
        fill="none"
        stroke="hsl(var(--danger))"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
    
    {/* Center heart */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
      className="absolute inset-4 rounded-full bg-gradient-to-br from-danger to-danger/60 flex items-center justify-center shadow-[0_0_40px_hsl(var(--danger)/0.4)]"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        <HeartPulse className="w-8 h-8 text-white" />
      </motion.div>
    </motion.div>
    
    {/* Orbiting medical icons */}
    {[
      { Icon: Stethoscope, angle: 45 },
      { Icon: Pill, angle: 135 },
      { Icon: Activity, angle: 225 },
      { Icon: Brain, angle: 315 },
    ].map(({ Icon, angle }, i) => (
      <motion.div
        key={i}
        className="absolute w-5 h-5"
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
          animate={{ 
            y: [0, -2, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
        >
          <Icon className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.div>
    ))}
  </div>
);

const healthConditions = [
  { id: "hypertension", label: "High Blood Pressure", icon: Activity, desc: "Alert on high sodium", emoji: "📈" },
  { id: "cholesterol", label: "High Cholesterol", icon: Heart, desc: "Alert on saturated fats", emoji: "🫀" },
  { id: "kidney_disease", label: "Kidney Disease", icon: Droplets, desc: "Alert on potassium/phosphorus", emoji: "💧" },
  { id: "ibs", label: "IBS/Digestive Issues", icon: Pill, desc: "Alert on FODMAP triggers", emoji: "🩺" },
  { id: "gout", label: "Gout", icon: Brain, desc: "Alert on high purine foods", emoji: "🦶" },
];

const ageGroups = [
  { id: "child", label: "Child (2-12)", desc: "Extra safety checks", emoji: "👶" },
  { id: "teen", label: "Teen (13-19)", desc: "Growth-focused alerts", emoji: "🧑" },
  { id: "adult", label: "Adult (20-64)", desc: "Standard protection", emoji: "👤" },
  { id: "senior", label: "Senior (65+)", desc: "Senior-specific warnings", emoji: "👴" },
];

const specialConditions = [
  { key: "is_pregnant" as const, icon: Baby, label: "Pregnant/Nursing", desc: "Alert on harmful ingredients for baby", color: "safe" },
  { key: "is_diabetic" as const, icon: Droplets, label: "Diabetic", desc: "Alert on sugar & hidden carbs", color: "caution" },
  { key: "is_heart_healthy" as const, icon: Heart, label: "Heart Condition", desc: "Alert on sodium & unhealthy fats", color: "danger" },
];

export const HealthConditionsStep = ({ data, onChange }: HealthConditionsStepProps) => {
  const toggleCondition = (id: string) => {
    const isSelected = data.conditions.includes(id);
    onChange({
      conditions: isSelected
        ? data.conditions.filter((c) => c !== id)
        : [...data.conditions, id],
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedHealthIllustration />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
          <ShieldAlert className="w-5 h-5 text-danger" />
          Health Vulnerabilities
        </h2>
        <p className="text-muted-foreground">
          Tell us your weak points so we can <span className="text-danger font-semibold">shield you</span> from dangerous ingredients
        </p>
      </motion.div>

      {/* Age Group */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Age Group
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {ageGroups.map((age, index) => (
            <motion.button
              key={age.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onChange({ age_group: age.id })}
              className={cn(
                "p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                data.age_group === age.id
                  ? "border-danger bg-danger/20"
                  : "border-border bg-muted/50 hover:border-danger/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{age.emoji}</span>
                <div>
                  <p className="font-medium text-foreground text-sm">{age.label}</p>
                  <p className="text-xs text-muted-foreground">{age.desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Special Conditions (Toggle) */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-caution" />
          Critical Conditions
        </Label>
        <div className="space-y-2">
          {specialConditions.map((condition, index) => (
            <motion.div
              key={condition.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              whileHover={{ x: 3 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                data[condition.key] ? "border-danger bg-danger/20" : "border-border bg-muted/50"
              )}
            >
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  data[condition.key] ? "bg-muted" : "bg-muted/50"
                )}
                animate={data[condition.key] ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <condition.icon className={cn(
                  "w-6 h-6 transition-colors",
                  data[condition.key] ? "text-danger" : "text-muted-foreground"
                )} />
              </motion.div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{condition.label}</p>
                <p className="text-sm text-muted-foreground">{condition.desc}</p>
              </div>
              <Switch
                checked={data[condition.key]}
                onCheckedChange={(checked) => onChange({ [condition.key]: checked })}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Other Health Conditions */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Other Vulnerabilities</Label>
        <motion.div 
          className="space-y-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {healthConditions.map((condition) => {
            const isSelected = data.conditions.includes(condition.id);
            return (
              <motion.button
                key={condition.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ scale: 1.01, x: 3 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleCondition(condition.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                  isSelected ? "border-danger bg-danger/20" : "border-border bg-muted/50 hover:border-danger/50"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  isSelected ? "bg-muted" : "bg-muted/50"
                )}>
                  <span className="text-xl">{condition.emoji}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{condition.label}</p>
                  <p className="text-sm text-muted-foreground">{condition.desc}</p>
                </div>
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-danger flex items-center justify-center"
                  >
                    <span className="text-white text-sm">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
