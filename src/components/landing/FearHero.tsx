import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Star, Baby, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import heroMomBaby from "@/assets/hero-mom-baby.png";

const FearHero = () => {
  return (
    <section className="relative min-h-[90vh] bg-background overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-caution/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-safe/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-6 pb-8 md:pt-8 md:pb-16 relative z-10">
        {/* Header with Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-start mb-4 md:mb-8"
        >
          <Logo size="2xl" />
        </motion.div>

        {/* Mobile-only CTA - Above the fold */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:hidden text-center mb-4"
        >
          <h1 className="text-2xl font-black text-foreground mb-3 leading-tight">
            Know What's in{" "}
            <span className="text-primary">Your Baby's Food</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Scan any baby food to detect hidden toxins & allergens instantly.
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="w-full bg-caution hover:bg-caution/90 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            No credit card required
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* Left Content - Hidden on mobile, shown on desktop */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:block text-center lg:text-left order-2 lg:order-1"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Baby className="w-4 h-4" />
              For Parents Who Care
            </div>

            {/* Main Headline - AGGRESSIVE FEAR */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight mb-6">
              97% OF BABY FOOD IS{" "}
              <span className="text-danger">CONTAMINATED</span>
            </h1>

            {/* Subheadline - URGENT */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Heavy metals, lead, arsenic, and cadmium are hiding in your baby's food. 
              <strong className="text-foreground"> Scan any barcode in 10 seconds</strong> to know if it's safe. 
              Don't gamble with your child's health.
            </p>

            {/* Trust Indicators - SOCIAL PROOF */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-safe" />
                <span>120,000+ Parents Protected</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-5 h-5 text-caution fill-caution" />
                <span>4.8/5 from 2,000+ Reviews</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                <span>1,247 scans today</span>
              </div>
            </div>

            {/* Primary CTA - SCARCITY + URGENCY */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="/auth?demo=1">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-danger hover:bg-danger/90 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all group animate-pulse"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  START FREE TRIAL
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>

            {/* Secondary action - TRUST + SCARCITY */}
            <p className="mt-4 text-sm text-muted-foreground">
              🔒 Secure • No credit card • <span className="text-danger font-semibold">Only 10 free scans per user</span>
            </p>
          </motion.div>

          {/* Right Content - Mom and Baby Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative order-1 lg:order-2 flex justify-center"
          >
            <div className="relative">
              {/* Main Illustration - Smaller on mobile */}
              <img
                src={heroMomBaby}
                alt="Mother holding baby while scanning baby food with phone"
                className="w-full max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg rounded-2xl"
              />

              {/* Floating badge - Safe Result */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute -bottom-2 -left-2 md:-bottom-4 md:-left-4 bg-card px-3 py-2 md:px-4 md:py-3 rounded-xl shadow-lg border-2 border-safe/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-safe/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-safe" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Result</p>
                    <p className="font-bold text-safe text-sm md:text-base">Safe for Baby!</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating badge - Scan count */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -top-2 -right-2 md:-top-4 md:-right-4 bg-card px-3 py-2 md:px-4 md:py-3 rounded-xl shadow-lg border-2 border-primary/30"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Baby className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Scanned</p>
                    <p className="font-bold text-foreground text-sm md:text-base">120K+ Products</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Trial Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="bg-primary py-4"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
              <span className="text-primary-foreground font-bold text-lg">
                LIMITED TIME TRIAL — GET 10 FREE SCANS!
              </span>
            </div>
            <a href="/auth?demo=1">
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default FearHero;
