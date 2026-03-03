import { motion } from "framer-motion";
import { Check, X, Zap, Shield, Crown, Baby, Bell, Heart, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    description: "Essential baby food safety",
    price: "$9.99",
    period: "/month",
    icon: Shield,
    popular: false,
    features: [
      { name: "20 scans per month", included: true },
      { name: "Toxin & allergen detection", included: true },
      { name: "FDA recall alerts", included: true },
      { name: "Personalized recommendations", included: true },
      { name: "Standard AI queue", included: true },
      { name: "Email support", included: true },
    ],
    cta: "Get Basic",
    ctaVariant: "outline" as const,
  },
  {
    name: "Premium",
    description: "Complete protection for your baby",
    price: "$24.99",
    period: "/month",
    icon: Crown,
    popular: true,
    features: [
      { name: "Unlimited scans", included: true },
      { name: "Priority AI queue", included: true },
      { name: "Toxin & allergen detection", included: true },
      { name: "FDA recall alerts", included: true },
      { name: "Personalized recommendations", included: true },
      { name: "Priority support", included: true },
    ],
    cta: "Get Premium",
    ctaVariant: "default" as const,
  },
];

const annualPlan = {
  name: "Annual Premium",
  description: "Best value - Save $225/year",
  price: "$74.99",
  period: "/year",
  savings: "Save 75%",
};

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-danger/10 text-danger text-sm font-bold mb-6 animate-pulse">
            <Zap className="w-4 h-4" />
            ⚠️ ONLY 10 FREE SCANS LEFT — Upgrade Before They're Gone!
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stop Guessing. Start Protecting.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your free scans won't last forever. Choose a plan to keep your baby safe.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-medium shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card className={`h-full ${plan.popular ? 'border-primary border-2 shadow-xl' : 'border-border'}`}>
                <CardHeader className="text-center pb-2">
                  <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                    <plan.icon className={`w-7 h-7 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-center gap-3">
                        {feature.included ? (
                          <div className="w-5 h-5 rounded-full bg-safe/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-safe" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <X className="w-3 h-3 text-muted-foreground" />
                          </div>
                        )}
                        <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.ctaVariant} 
                    className={`w-full mb-2 ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                    asChild
                  >
                    <Link to="/auth">
                      {plan.cta} — 30-Day Guarantee
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    If we don't protect your baby, get a full refund. No questions asked.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Annual Plan Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-8"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">{annualPlan.name}</h3>
                      <Badge className="bg-safe text-foreground">{annualPlan.savings}</Badge>
                    </div>
                    <p className="text-muted-foreground">{annualPlan.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-3xl font-bold text-foreground">{annualPlan.price}</span>
                    <span className="text-muted-foreground">{annualPlan.period}</span>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/auth">Get Annual</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          All plans include a 30-day money-back guarantee. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
