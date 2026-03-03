import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, Skull, FlaskConical, Leaf, Baby, Milk } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface SafetyConcernsStepProps {
  selectedConcerns: string[];
  onToggle: (concern: string) => void;
}

interface ConcernOption {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  stat: string;
  color: string;
}

const CONCERN_OPTIONS: ConcernOption[] = [
  {
    id: "heavy_metals",
    icon: Skull,
    title: "Heavy Metals",
    description: "Lead, Arsenic, Cadmium, Mercury",
    stat: "95% of baby foods contain heavy metals",
    color: "from-red-500 to-rose-600",
  },
  {
    id: "pesticides",
    icon: FlaskConical,
    title: "Pesticide Residues",
    description: "Chemicals from conventional farming",
    stat: "Over 70% of produce has pesticide residue",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "bpa",
    icon: AlertTriangle,
    title: "BPA & Plastics",
    description: "Harmful chemicals from packaging",
    stat: "BPA exposure linked to developmental delays",
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "formula_safety",
    icon: Milk,
    title: "Formula Safety",
    description: "Recalls, contamination, and quality",
    stat: "Major formula recalls in recent years",
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "artificial_additives",
    icon: FlaskConical,
    title: "Artificial Colors & Additives",
    description: "Dyes and synthetic preservatives",
    stat: "Red 40, Yellow 5 linked to behavioral issues",
    color: "from-pink-500 to-fuchsia-600",
  },
  {
    id: "hidden_sugars",
    icon: Baby,
    title: "Hidden Sugars",
    description: "Added sugars harmful to babies",
    stat: "Recommended: 0g added sugar for babies",
    color: "from-cyan-500 to-teal-600",
  },
  {
    id: "organic",
    icon: Leaf,
    title: "Organic vs Conventional",
    description: "Understanding organic labels",
    stat: "Help identify truly clean products",
    color: "from-green-500 to-emerald-600",
  },
];

export const SafetyConcernsStep = ({ selectedConcerns, onToggle }: SafetyConcernsStepProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-danger to-red-600 mb-2">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          What Concerns You Most?
        </h2>
        <p className="text-muted-foreground">
          A 2021 Congressional report found <span className="text-danger font-semibold">95% of baby foods</span> contain toxic heavy metals.
          We'll flag these hidden dangers.
        </p>
      </motion.div>

      {/* Concern Options */}
      <div className="space-y-3">
        {CONCERN_OPTIONS.map((concern, index) => {
          const Icon = concern.icon;
          const isSelected = selectedConcerns.includes(concern.id);
          
          return (
            <motion.button
              key={concern.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onToggle(concern.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "bg-danger/10 border-danger/30 ring-1 ring-danger/20"
                  : "bg-muted/50 border-border hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${concern.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{concern.title}</h3>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "bg-danger border-danger" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{concern.description}</p>
                  <p className="text-xs text-danger mt-1 font-medium">
                    ⚠️ {concern.stat}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center text-muted-foreground text-sm"
      >
        {selectedConcerns.length === 0 ? (
          <p>Select the concerns you want us to prioritize</p>
        ) : (
          <p>
            <span className="font-semibold text-safe">{selectedConcerns.length}</span> concern{selectedConcerns.length !== 1 ? "s" : ""} selected - 
            we'll flag these in every scan
          </p>
        )}
      </motion.div>
    </div>
  );
};
