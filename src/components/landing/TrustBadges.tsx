import { motion } from "framer-motion";
import { Stethoscope, Shield, Heart, Ribbon, Award, CheckCircle } from "lucide-react";

const TrustBadges = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Doctor Endorsement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-safe/10 border border-safe/30 rounded-full px-6 py-3 mb-6">
            <Stethoscope className="w-5 h-5 text-safe" />
            <span className="text-safe font-bold text-sm uppercase tracking-wide">
              Recommended by 500+ Healthcare Professionals
            </span>
          </div>
          
          <blockquote className="max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl text-foreground/80 italic mb-4">
              "Finally, a tool that helps my patients make informed choices about what they're really eating. I recommend it to everyone in my practice."
            </p>
            <footer className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-foreground">Dr. Sarah Mitchell, MD</p>
                <p className="text-sm text-muted-foreground">Board-Certified Family Physician</p>
              </div>
            </footer>
          </blockquote>
        </motion.div>

        {/* Institutional Support Badges */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-bold text-foreground mb-2">FDA Aligned</h3>
            <p className="text-sm text-muted-foreground">
              Supporting FDA food safety initiatives and transparency standards
            </p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-blue-500">
              <CheckCircle className="w-4 h-4" />
              <span>FDA.gov Referenced Data</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <Award className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-bold text-foreground mb-2">CDC Guidelines</h3>
            <p className="text-sm text-muted-foreground">
              Aligned with CDC dietary guidelines and health recommendations
            </p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-green-500">
              <CheckCircle className="w-4 h-4" />
              <span>CDC.gov Standards</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Ribbon className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Cancer Research</h3>
            <p className="text-sm text-muted-foreground">
              A portion of every subscription supports cancer research initiatives
            </p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs text-pink-500">
              <Heart className="w-4 h-4" />
              <span>American Cancer Society Partner</span>
            </div>
          </motion.div>
        </div>

        {/* Trust Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center"
        >
          <div>
            <p className="text-3xl md:text-4xl font-black text-primary">500+</p>
            <p className="text-sm text-muted-foreground">Doctors Recommend</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-safe">$50K+</p>
            <p className="text-sm text-muted-foreground">Donated to Research</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-black text-blue-500">100%</p>
            <p className="text-sm text-muted-foreground">FDA Data Aligned</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBadges;
