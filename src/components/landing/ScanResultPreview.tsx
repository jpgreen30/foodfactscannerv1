import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, ArrowRight, Baby, Leaf, XCircle } from "lucide-react";

const ScanResultPreview = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See What You'll <span className="text-primary">Discover</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant, detailed analysis of any baby food product
          </p>
        </motion.div>

        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border-2 border-border shadow-xl overflow-hidden"
          >
            {/* Product Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                  <Baby className="w-10 h-10 text-primary/50" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">Traditional Rice Cereal</h3>
                  <p className="text-sm text-muted-foreground">Brand: Gerber • UPC: 041000220226</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-danger/20 text-danger text-sm font-semibold flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                      HIGH RISK
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="p-6 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Health Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[23%] bg-danger rounded-full" />
                  </div>
                  <span className="font-bold text-danger text-lg">23</span>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="p-6 space-y-4">
              <h4 className="font-semibold text-foreground mb-3">Dangerous Ingredients Found</h4>
              
              <div className="flex items-start gap-3 p-3 rounded-xl bg-danger/10 border border-danger/20">
                <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-danger">ARSENIC — 15.2 ppb</p>
                  <p className="text-sm text-foreground/70">FDA limit: 10 ppb • Exceeds by 52%</p>
                  <p className="text-sm text-muted-foreground mt-1">Long-term exposure causes cognitive impairment, cancer risk.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-danger/10 border border-danger/20">
                <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-danger">LEAD — 5.7 ppb</p>
                  <p className="text-sm text-foreground/70">FDA limit: 5 ppb • Exceeds by 14%</p>
                  <p className="text-sm text-muted-foreground mt-1">Causes developmental delays, learning difficulties.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-caution/10">
                <AlertTriangle className="w-5 h-5 text-caution flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Cadmium Detected</p>
                  <p className="text-sm text-muted-foreground">Below FDA limit but still concerning</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-safe/10">
                <ShieldCheck className="w-5 h-5 text-safe flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">No Mercury</p>
                  <p className="text-sm text-muted-foreground">Tested negative</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="p-6 bg-muted/30 border-t border-border">
              <Link to="/auth">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6">
                  Start Free Trial — Scan Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ScanResultPreview;
