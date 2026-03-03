import { motion } from "framer-motion";
import { Heart, Ribbon, Shield, Users } from "lucide-react";

const pillars = [
  {
    icon: Users,
    title: "Healthcare Partnership",
    description: "Working alongside doctors and nutritionists to empower patients with accurate, actionable food safety information.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Ribbon,
    title: "Cancer Research Support",
    description: "We donate a portion of every premium subscription to cancer research organizations fighting for a cure.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "Government Alignment",
    description: "Supporting FDA transparency initiatives and following CDC health guidelines to keep you informed.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

const MissionStatement = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-danger" />
            <span className="text-sm font-semibold text-danger uppercase tracking-wide">
              Our Mission
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            More Than An App — <span className="text-primary">A Movement</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We believe everyone deserves to know what's in their food. That's why we're committed to transparency, health advocacy, and giving back.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl ${pillar.bgColor} flex items-center justify-center`}>
                <pillar.icon className={`w-8 h-8 ${pillar.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {pillar.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Commitment Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-primary/10 via-pink-500/10 to-blue-500/10 border border-primary/20 rounded-2xl p-8 text-center"
        >
          <p className="text-lg md:text-xl font-medium text-foreground">
            🎗️ <span className="font-bold">Our Pledge:</span> For every premium subscription, we donate to cancer research and food safety advocacy organizations.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MissionStatement;
