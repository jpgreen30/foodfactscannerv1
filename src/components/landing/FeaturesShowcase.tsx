import { motion } from "framer-motion";
import { 
  ScanBarcode, 
  FlaskConical, 
  Activity, 
  UserCheck, 
  Users, 
  Pill, 
  Repeat, 
  Calendar,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: ScanBarcode,
    title: "Barcode Scanner",
    description: "Scan any product barcode to reveal hidden ingredients instantly",
    category: "core",
    premium: false,
  },
  {
    icon: FlaskConical,
    title: "Ingredient Analysis",
    description: "AI-powered detection of 10,000+ harmful additives and chemicals",
    category: "safety",
    premium: false,
  },
  {
    icon: Activity,
    title: "Health Score",
    description: "Get a 0-100 health rating based on nutritional value and risks",
    category: "health",
    premium: false,
  },
  {
    icon: UserCheck,
    title: "Personalized Warnings",
    description: "Alerts based on your allergies, conditions, and dietary needs",
    category: "personal",
    premium: false,
  },
  {
    icon: Users,
    title: "Family Profiles",
    description: "Track health risks for your whole family, including children",
    category: "family",
    premium: true,
  },
  {
    icon: Pill,
    title: "Drug Interactions",
    description: "Check if food ingredients interact with your medications",
    category: "safety",
    premium: true,
  },
  {
    icon: Repeat,
    title: "Healthier Alternatives",
    description: "Discover safer products that match your preferences",
    category: "health",
    premium: false,
  },
  {
    icon: Calendar,
    title: "AI Meal Planning",
    description: "Generate personalized meal plans based on your health goals",
    category: "premium",
    premium: true,
  },
];

const categoryColors: Record<string, string> = {
  core: "bg-primary/10 text-primary",
  safety: "bg-destructive/10 text-destructive",
  health: "bg-safe/10 text-safe",
  personal: "bg-caution/10 text-caution",
  family: "bg-blue-500/10 text-blue-500",
  premium: "bg-purple-500/10 text-purple-500",
};

const FeaturesShowcase = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Eat Safely
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From instant barcode scanning to AI-powered meal planning — protect your family with comprehensive food intelligence
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${categoryColors[feature.category]} flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    {feature.premium && (
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-0">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
