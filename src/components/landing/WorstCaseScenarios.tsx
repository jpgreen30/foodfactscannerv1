import { motion } from "framer-motion";
import { HeartCrack, Brain, Baby, Activity } from "lucide-react";

const scenarios = [
  {
    icon: HeartCrack,
    title: "Heart Disease",
    description: "Trans fats and sodium hiding in 'healthy' foods silently clog your arteries.",
    warning: "The #1 killer in America.",
  },
  {
    icon: Brain,
    title: "Neurological Damage",
    description: "MSG, aspartame, and artificial colors linked to headaches, memory loss, and mood disorders.",
    warning: "Your brain is under attack.",
  },
  {
    icon: Baby,
    title: "Developmental Harm",
    description: "Heavy metals in baby food linked to lower IQ and developmental delays.",
    warning: "Your children are most vulnerable.",
  },
  {
    icon: Activity,
    title: "Metabolic Syndrome",
    description: "Hidden sugars and processed ingredients reprogram your metabolism to store fat.",
    warning: "Weight gain is just the beginning.",
  },
];

const WorstCaseScenarios = () => {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container max-w-lg mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-black text-foreground mb-2">
            The <span className="text-danger">Worst-Case</span> Scenarios
          </h2>
          <p className="text-muted-foreground">
            These aren't scare tactics. This is what the science says.
          </p>
        </motion.div>

        <div className="space-y-4">
          {scenarios.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-5 bg-card backdrop-blur rounded-xl border border-danger/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-danger/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-7 h-7 text-danger" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                  <p className="text-danger font-bold mt-2 text-sm">⚠️ {item.warning}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-2xl font-black text-foreground mt-10"
        >
          Every scan could save your life—
          <span className="text-danger">or your child's.</span>
        </motion.p>
      </div>
    </section>
  );
};

export default WorstCaseScenarios;
