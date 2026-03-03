import { motion } from "framer-motion";
import { EyeOff, Skull, Beaker, Cookie } from "lucide-react";

const dangers = [
  {
    icon: EyeOff,
    title: '"Natural Flavors"',
    description: "Can contain up to 100 hidden chemicals. The FDA doesn't require disclosure.",
  },
  {
    icon: Beaker,
    title: "60+ Names for Sugar",
    description: "Maltodextrin, dextrose, sucrose... They hide it so you can't track it.",
  },
  {
    icon: Skull,
    title: "Carcinogens in Kids' Food",
    description: "Red 40, Yellow 5, BHT—linked to cancer, found in cereals and snacks.",
  },
  {
    icon: Cookie,
    title: '"Zero Sugar" Lies',
    description: "Artificial sweeteners linked to weight gain, diabetes, and gut damage.",
  },
];

const HiddenDangers = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container max-w-lg mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-black text-foreground mb-2">
            What They <span className="text-danger">Don't</span> Want You to Know
          </h2>
          <p className="text-muted-foreground">
            The food industry profits from your ignorance.
          </p>
        </motion.div>

        <div className="grid gap-4">
          {dangers.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-5 bg-card rounded-xl border-2 border-danger/20 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-danger" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{item.title}</h3>
                  <p className="text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HiddenDangers;
