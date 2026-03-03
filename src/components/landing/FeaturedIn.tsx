import { motion } from "framer-motion";

const publications = [
  { name: "WebMD", logo: "WebMD" },
  { name: "Mayo Clinic", logo: "Mayo Clinic" },
  { name: "Johns Hopkins", logo: "Johns Hopkins" },
  { name: "FDA.gov", logo: "FDA.gov" },
  { name: "CDC.gov", logo: "CDC.gov" },
  { name: "Consumer Reports", logo: "Consumer Reports" },
];

const FeaturedIn = () => {
  return (
    <section className="py-10 bg-background border-y border-border/30">
      <div className="container max-w-4xl mx-auto px-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em] mb-2"
        >
          Trusted By Health Professionals Nationwide
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-muted-foreground/60 text-xs mb-6"
        >
          Referenced by leading health organizations
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {publications.map((pub, index) => (
            <motion.div
              key={pub.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <span className="text-lg md:text-xl font-bold text-muted-foreground/40 group-hover:text-muted-foreground transition-colors duration-300 cursor-default">
                {pub.logo}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedIn;
