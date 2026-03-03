import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Heart, 
  Ribbon, 
  Shield, 
  Users, 
  Stethoscope, 
  Target,
  Award,
  HandHeart,
  ArrowLeft,
  CheckCircle,
  Globe,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About FoodFactScanner® | Baby Food Safety Mission & Medical Advisory Board</title>
        <meta name="description" content="Learn about FoodFactScanner®'s mission to protect babies from toxic ingredients, heavy metals, and unsafe baby food. Backed by medical experts and dedicated to food safety transparency." />
        <meta name="keywords" content="baby food safety mission, food transparency app, toxic baby food awareness, heavy metals baby food protection, baby food safety experts" />
        <link rel="canonical" href="https://foodfactscanner.com/about" />
        <meta property="og:title" content="About FoodFactScanner® | Baby Food Safety Mission" />
        <meta property="og:description" content="Learn about FoodFactScanner®'s mission to protect babies from toxic ingredients, heavy metals, and unsafe baby food." />
        <meta property="og:url" content="https://foodfactscanner.com/about" />
        <meta name="robots" content="index, follow" />
        <meta property="og:url" content="https://foodfactscanner.com/about" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <Logo size="sm" />
            <div className="w-20" />
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Our Story</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                Empowering You to Know{" "}
                <span className="text-primary">What You Eat</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                FoodFactScanner was born from a simple belief: everyone deserves to know exactly what's in their food. We're on a mission to make food transparency accessible to all.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-16 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wide">Our Mission</span>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Making Food Transparency the Standard
                </h2>
                <p className="text-muted-foreground mb-6">
                  The food industry has operated in the shadows for too long. Hidden ingredients, misleading labels, and toxic additives have become the norm. We're here to change that.
                </p>
                <p className="text-muted-foreground">
                  By combining cutting-edge AI technology with verified scientific data, we help millions of families make informed decisions about what they put on their tables.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-primary mb-2">2M+</p>
                  <p className="text-sm text-muted-foreground">Products Scanned</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-safe mb-2">500K+</p>
                  <p className="text-sm text-muted-foreground">Families Protected</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-blue-500 mb-2">500+</p>
                  <p className="text-sm text-muted-foreground">Doctor Partners</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <p className="text-3xl font-black text-pink-500 mb-2">$50K+</p>
                  <p className="text-sm text-muted-foreground">Donated to Research</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Healthcare Partnerships */}
        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Stethoscope className="w-5 h-5 text-safe" />
                <span className="text-sm font-semibold text-safe uppercase tracking-wide">Healthcare Partnerships</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Trusted by Medical Professionals
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We work closely with doctors, nutritionists, and healthcare organizations to ensure our recommendations are medically accurate and clinically relevant.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="w-12 h-12 rounded-full bg-safe/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-safe" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Medical Advisory Board</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Our recommendations are reviewed by a board of physicians, registered dietitians, and food scientists.
                </p>
                <Link to="/team" className="text-sm text-primary font-medium hover:underline">
                  Meet Our Team →
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="w-12 h-12 rounded-full bg-safe/10 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-safe" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Clinical Validation</h3>
                <p className="text-sm text-muted-foreground">
                  Our health scoring algorithm has been validated against peer-reviewed nutritional guidelines.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="w-12 h-12 rounded-full bg-safe/10 flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-safe" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Doctor Recommended</h3>
                <p className="text-sm text-muted-foreground">
                  Over 500 healthcare professionals recommend FoodFactScanner to their patients.
                </p>
              </motion.div>
            </div>

            {/* Doctor Quote */}
            <motion.blockquote
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-12 bg-gradient-to-r from-safe/10 to-primary/10 border border-safe/20 rounded-2xl p-8 text-center"
            >
              <p className="text-xl italic text-foreground mb-4">
                "FoodFactScanner has revolutionized how I counsel patients about nutrition. The instant ingredient analysis saves time and empowers my patients to make healthier choices."
              </p>
              <footer className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Dr. Michael Chen, MD, MPH</p>
                  <p className="text-sm text-muted-foreground">Internal Medicine, Stanford Health</p>
                </div>
              </footer>
            </motion.blockquote>
          </div>
        </section>

        {/* Cancer Research Donations */}
        <section className="py-16 bg-gradient-to-b from-pink-500/5 to-background">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Ribbon className="w-5 h-5 text-pink-500" />
                <span className="text-sm font-semibold text-pink-500 uppercase tracking-wide">Giving Back</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Supporting Cancer Research
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We believe in using our platform for good. A portion of every premium subscription is donated to cancer research organizations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="bg-card border border-pink-500/20 rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                      <HandHeart className="w-8 h-8 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-4xl font-black text-pink-500">$50,000+</p>
                      <p className="text-muted-foreground">Donated to Date</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">American Cancer Society</p>
                        <p className="text-sm text-muted-foreground">Supporting groundbreaking cancer research</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Cancer Research Institute</p>
                        <p className="text-sm text-muted-foreground">Funding immunotherapy breakthroughs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Stand Up To Cancer</p>
                        <p className="text-sm text-muted-foreground">Accelerating cancer treatment research</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-pink-500" />
                    <h3 className="font-bold text-foreground">Our Commitment</h3>
                  </div>
                  <p className="text-muted-foreground">
                    10% of every premium subscription goes directly to cancer research. When you protect your family's health, you're also helping fund the fight against cancer.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="w-5 h-5 text-pink-500" />
                    <h3 className="font-bold text-foreground">Transparency</h3>
                  </div>
                  <p className="text-muted-foreground">
                    We publish quarterly donation reports so you can see exactly where your contribution goes. Every dollar is tracked and verified.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-pink-500/10 to-primary/10 border border-pink-500/20 rounded-xl p-6">
                  <p className="text-foreground font-medium text-center">
                    🎗️ Together, we've helped fund over <span className="text-pink-500 font-bold">1,000 hours</span> of cancer research
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FDA & CDC Alignment */}
        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Government Alignment</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Supporting FDA & CDC Initiatives
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We align our data and recommendations with official FDA food safety guidelines and CDC dietary recommendations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-blue-500/20 rounded-xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">FDA Data Integration</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <span>Real-time FDA recall alerts integrated into scans</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <span>GRAS (Generally Recognized as Safe) ingredient verification</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <span>FDA nutrition labeling compliance checks</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-green-500/20 rounded-xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">CDC Guidelines</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Dietary Guidelines for Americans integration</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Chronic disease prevention recommendations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Allergen awareness based on CDC data</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-foreground">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-background mb-4">
                Join the Movement
              </h2>
              <p className="text-background/70 mb-8">
                Every scan you make helps build a healthier future. Start protecting your family today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/scanner">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    Start Scanning Free
                  </Button>
                </Link>
                <Link to="/">
                  <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link to="/team" className="text-muted-foreground hover:text-foreground transition-colors">
                Our Team
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/press" className="text-muted-foreground hover:text-foreground transition-colors">
                Press Kit
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-muted-foreground/50 text-sm mt-4">
              © 2025 FoodFactScanner.com. Your health is not negotiable.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default About;
