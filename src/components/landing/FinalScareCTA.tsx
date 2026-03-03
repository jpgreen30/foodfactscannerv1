import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScanBarcode, Shield, Heart, Stethoscope, Baby } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";

const FinalScareCTA = () => {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Decorative pattern background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground))_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      <div className="container max-w-lg mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center"
          >
            <Logo size="md" showGlow />
          </motion.div>

          <Badge className="bg-caution text-foreground px-4 py-2">
            🎉 Try FoodFactScanner FREE — 10 Scans Included
          </Badge>

          <h2 className="text-3xl md:text-4xl font-black text-primary-foreground">
            Your Baby Deserves{" "}
            <span className="text-caution">Safe Food</span>
          </h2>
          
          <p className="text-xl text-primary-foreground/80">
            Scan any baby food barcode and know exactly what's inside.
            <br />
            <span className="font-bold text-primary-foreground">Protect your little one today.</span>
          </p>

          <div className="flex items-center justify-center gap-2 text-primary-foreground/90">
            <Baby className="w-5 h-5" />
            <span className="font-bold">Trusted by 50,000+ parents</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-4"
          >
            <Link to="/auth?demo=1">
              <Button 
                size="xl" 
                className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary font-black text-xl px-12 py-8 shadow-lg"
              >
                <ScanBarcode className="w-7 h-7 mr-3" />
                START FREE TRIAL
              </Button>
            </Link>
          </motion.div>

          <p className="text-primary-foreground/60 text-sm">
            Just scan the barcode on any baby food to see what's really inside.
          </p>
        </motion.div>
      </div>

    </section>
  );
};

export default FinalScareCTA;
