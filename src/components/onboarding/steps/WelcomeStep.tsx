import { motion } from "framer-motion";
import { AlertTriangle, Skull, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";

// No props needed - onboarding is mandatory

// Static logo illustration
const AnimatedLogo = () => (
  <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
    {/* Static glow background */}
    <div className="absolute inset-0 rounded-full bg-danger/20 blur-md" />
    
    {/* Central logo */}
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
      className="relative z-10"
    >
      <Logo size="lg" showGlow />
    </motion.div>
  </div>
);

export const WelcomeStep = () => {
  const features = [
    {
      icon: AlertTriangle,
      title: "Personalized Danger Alerts",
      description: "Get warned when products contain ingredients that threaten YOUR health",
      color: "from-caution/20 to-caution/5",
      iconColor: "text-caution",
      delay: 0.3,
    },
    {
      icon: Skull,
      title: "Hidden Threat Detection",
      description: "AI-powered analysis exposes what manufacturers don't want you to see",
      color: "from-danger/20 to-danger/5",
      iconColor: "text-danger",
      delay: 0.4,
    },
    {
      icon: Zap,
      title: "Instant Protection",
      description: "Know if food is safe BEFORE you eat it, not after the damage is done",
      color: "from-safe/20 to-safe/5",
      iconColor: "text-safe",
      delay: 0.5,
    },
  ];

  return (
    <div className="space-y-6">
      <AnimatedLogo />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-3"
      >
        <motion.h1 
          className="text-2xl font-black text-foreground uppercase tracking-wide"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          Set Up Your Defense System
        </motion.h1>
        <motion.p 
          className="text-muted-foreground max-w-sm mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tell us about your health vulnerabilities so we can protect you from 
          <span className="text-danger font-semibold"> hidden dangers</span> in every product you scan.
        </motion.p>
      </motion.div>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: feature.delay, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.02, x: 5 }}
            className={`flex items-start gap-4 p-4 bg-gradient-to-r ${feature.color} rounded-xl border border-border backdrop-blur-sm`}
          >
            <motion.div 
              className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};