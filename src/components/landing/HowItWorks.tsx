import { motion } from "framer-motion";
import { Baby } from "lucide-react";
import featureScan from "@/assets/feature-scan.png";
import featureResults from "@/assets/feature-results.png";
import featureSafety from "@/assets/feature-safety.png";

const steps = [
  {
    number: 1,
    image: featureScan,
    title: "Detect Toxins & Allergens",
    description: "Easy barcode scanning of baby food, snacks & formula. Instant detection of harmful ingredients.",
  },
  {
    number: 2,
    image: featureResults,
    title: "Tailored Health Recommends",
    description: "Personalized safety advice for expecting and new mothers based on your baby's age and needs.",
  },
  {
    number: 3,
    image: featureSafety,
    title: "Weekly Safety Alerts",
    description: "Get notified about FDA recalls and safety warnings for baby food products you've scanned.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Baby className="w-4 h-4" />
            See What You're Really Feeding Your Baby
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Protect your baby in three simple steps
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line - hidden on mobile */}
          <div className="hidden md:block absolute top-32 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Illustration card */}
                <div className="relative z-10 mb-6">
                  <div className="w-32 h-32 rounded-2xl bg-card border-2 border-border shadow-lg p-2 flex items-center justify-center overflow-hidden">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
