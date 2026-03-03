import { motion } from "framer-motion";
import { Baby, Heart, Flower2, User } from "lucide-react";

interface MomJourneyStepProps {
  selectedJourney: string | null;
  onSelect: (journey: string | null) => void;
}

const JOURNEY_OPTIONS = [
  {
    id: "expecting",
    icon: Flower2,
    title: "I'm Expecting",
    description: "Protect your pregnancy with food safety alerts",
    stat: "Over 800 chemicals pass to babies during pregnancy",
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
  },
  {
    id: "new_mom",
    icon: Baby,
    title: "I Have a Baby",
    description: "Ages 0-12 months • Monitor formula & first foods",
    stat: "95% of baby foods contain toxic heavy metals",
    color: "from-sky-500 to-blue-500",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
  },
  {
    id: "toddler_mom",
    icon: Heart,
    title: "I Have a Toddler",
    description: "Ages 1-3 years • Safe snacks & toddler foods",
    stat: "Lead found in 20% of popular toddler snacks",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "not_applicable",
    icon: User,
    title: "Not Applicable",
    description: "I'm scanning for myself or other family members",
    stat: "",
    color: "from-slate-400 to-slate-500",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
  },
];

export const MomJourneyStep = ({ selectedJourney, onSelect }: MomJourneyStepProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 mb-2">
          <Baby className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Are You Protecting a Little One?
        </h2>
        <p className="text-muted-foreground">
          Babies are <span className="text-danger font-semibold">10x more vulnerable</span> to food toxins.
          Let's set up their protection profile.
        </p>
      </motion.div>

      {/* Journey Options */}
      <div className="space-y-3">
        {JOURNEY_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedJourney === option.id;
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(option.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${option.bgColor} ${option.borderColor} ring-2 ring-offset-2 ring-offset-background`
                  : "bg-muted/50 border-border hover:border-muted-foreground/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${option.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  {option.stat && (
                    <p className="text-xs text-danger mt-2 font-medium">
                      ⚠️ {option.stat}
                    </p>
                  )}
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? option.borderColor : "border-muted-foreground/30"
                }`}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-3 h-3 rounded-full bg-gradient-to-br ${option.color}`}
                    />
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-danger/10 border border-danger/20 rounded-lg p-4 text-center"
      >
        <p className="text-sm text-foreground/80">
          🛡️ We'll flag ingredients that are <span className="font-semibold">unsafe for babies</span>,
          including heavy metals, choking hazards, and age-inappropriate foods.
        </p>
      </motion.div>
    </div>
  );
};