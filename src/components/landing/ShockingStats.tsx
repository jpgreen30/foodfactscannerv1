import { motion, useInView } from "framer-motion";
import { AlertTriangle, Skull, FlaskConical, Heart, Baby, Activity } from "lucide-react";
import { useEffect, useState, useRef } from "react";

// Simulated live counter (will be replaced with real API call)
const useLiveScanCounter = () => {
  const [count, setCount] = useState(1247);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Simulate live updates (in production, fetch from /api/stats/scans-today)
    intervalRef.current = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return count;
};

const formatNumber = (num: number) => num.toLocaleString();

const stats = [
  {
    icon: Heart,
    stat: "70%",
    label: "of Americans have a chronic disease linked to diet",
    color: "danger",
  },
  {
    icon: FlaskConical,
    stat: "10,000+",
    label: "chemicals approved in US food—many banned in Europe",
    color: "caution",
  },
  {
    icon: Skull,
    stat: "32%",
    label: "higher risk of early death from ultra-processed foods",
    color: "danger",
  },
  {
    icon: Baby,
    stat: "95%",
    label: "of baby foods contain toxic heavy metals",
    color: "danger",
  },
];

const ShockingStats = () => {
  const liveCount = useLiveScanCounter();

  return (
    <section className="py-16 bg-muted/50">
      <div className="container max-w-lg mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-2 text-danger mb-4">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Shocking Facts</span>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-foreground">
            The Numbers Don't Lie
          </h2>
        </motion.div>

        <div className="space-y-4">
          {/* Live Scan Counter - First stat (most prominent) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="p-5 rounded-xl border-2 bg-primary/10 border-primary/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-primary/20">
                <Activity className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-black text-primary">
                  {formatNumber(liveCount)}+
                </p>
                <p className="text-foreground/70 font-medium">Scans completed in the last 24 hours</p>
              </div>
            </div>
          </motion.div>

          {stats.map((item, index) => (
            <motion.div
              key={item.stat}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index + 1) * 0.15 }}
              className={`p-5 rounded-xl border-2 ${
                item.color === "danger" 
                  ? "bg-danger/10 border-danger/30" 
                  : "bg-caution/10 border-caution/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                  item.color === "danger" ? "bg-danger/20" : "bg-caution/20"
                }`}>
                  <item.icon className={`w-7 h-7 ${
                    item.color === "danger" ? "text-danger" : "text-caution"
                  }`} />
                </div>
                <div>
                  <p className={`text-3xl font-black ${
                    item.color === "danger" ? "text-danger" : "text-caution"
                  }`}>
                    {item.stat}
                  </p>
                  <p className="text-foreground/70 font-medium">{item.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          Sources: CDC, FDA, NIH, Consumer Reports
        </motion.p>
      </div>
    </section>
  );
};

export default ShockingStats;
