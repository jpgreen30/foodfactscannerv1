import { motion } from "framer-motion";
import { Quote, Baby, Heart, Shield, Star } from "lucide-react";

const testimonials = [
  {
    quote: "I was shocked when I scanned a brand of baby food I trusted and found concerning levels of heavy metals. This app is a must-have for any parent.",
    author: "Sarah M.",
    context: "Mom of 2",
    avatar: "👩",
  },
  {
    quote: "As a first-time mom, I had no idea what to look for on labels. FoodFactScanner made it so easy to ensure my baby is eating safe food.",
    author: "Jessica T.",
    context: "New Mom",
    avatar: "👩‍🦱",
  },
  {
    quote: "I caught a recalled product in my pantry before feeding it to my toddler. The recall alerts alone are worth it!",
    author: "Emily R.",
    context: "Toddler Mom",
    avatar: "👩‍🦰",
  },
];

const trustBadges = [
  { icon: Shield, text: "FDA Data Verified" },
  { icon: Baby, text: "Pediatrician Reviewed" },
  { icon: Heart, text: "50,000+ Happy Parents" },
];

const FearTestimonials = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container max-w-lg mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-caution text-caution" />
            ))}
          </div>
          <h2 className="text-3xl font-black text-foreground mb-2">
            Trusted by <span className="text-primary">Parents</span> & Health Experts
          </h2>
          <p className="text-muted-foreground">
            Join thousands of families keeping their babies safe
          </p>
        </motion.div>

        <div className="space-y-4">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="p-6 bg-card rounded-xl border-2 border-border shadow-lg relative"
            >
              <Quote className="w-8 h-8 text-primary/30 absolute top-4 right-4" />
              <p className="text-foreground font-medium text-lg mb-4 pr-8">
                "{item.quote}"
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.avatar}</span>
                <div>
                  <p className="font-semibold text-foreground">{item.author}</p>
                  <p className="text-sm text-primary">{item.context}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          {trustBadges.map((badge) => (
            <div
              key={badge.text}
              className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full"
            >
              <badge.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{badge.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FearTestimonials;
