import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, ShieldAlert, Skull, FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetalLevel {
  ppb: number | null;
  level: "safe" | "caution" | "avoid";
}

export interface HeavyMetalsData {
  found: boolean;
  arsenic: MetalLevel;
  lead: MetalLevel;
  cadmium: MetalLevel;
  mercury: MetalLevel;
  overallVerdict: "safe" | "caution" | "avoid";
  confidence: "high" | "medium" | "low";
  labSource?: string;
  testDate?: string;
  notes?: string;
}

interface HeavyMetalsAlertProps {
  data: HeavyMetalsData;
}

const metalConfig: Record<string, { name: string; icon: string; babyLimit: number; unit: string }> = {
  arsenic: { name: "Arsenic", icon: "As", babyLimit: 10, unit: "ppb" },
  lead: { name: "Lead", icon: "Pb", babyLimit: 1, unit: "ppb" },
  cadmium: { name: "Cadmium", icon: "Cd", babyLimit: 5, unit: "ppb" },
  mercury: { name: "Mercury", icon: "Hg", babyLimit: 2, unit: "ppb" },
};

const verdictConfig = {
  safe: {
    label: "SAFE",
    bgClass: "bg-safe/15",
    borderClass: "border-safe/40",
    textClass: "text-safe",
    badgeClass: "bg-safe text-safe-foreground",
    Icon: ShieldCheck,
  },
  caution: {
    label: "CAUTION",
    bgClass: "bg-caution/15",
    borderClass: "border-caution/40",
    textClass: "text-caution",
    badgeClass: "bg-caution text-caution-foreground",
    Icon: ShieldAlert,
  },
  avoid: {
    label: "AVOID",
    bgClass: "bg-danger/15",
    borderClass: "border-danger/40",
    textClass: "text-danger",
    badgeClass: "bg-danger text-danger-foreground",
    Icon: Skull,
  },
};

const levelColors = {
  safe: "bg-safe",
  caution: "bg-caution",
  avoid: "bg-danger",
};

const MetalBar = ({ metal, data }: { metal: string; data: MetalLevel }) => {
  const config = metalConfig[metal];
  if (!data.ppb && data.ppb !== 0) return null;

  const maxPpb = config.babyLimit * 6; // Scale bar to 6x limit
  const fillPercent = Math.min((data.ppb / maxPpb) * 100, 100);
  const limitPercent = Math.min((config.babyLimit / maxPpb) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {config.icon}
          </span>
          <span className="font-medium text-foreground">{config.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold">{data.ppb} {config.unit}</span>
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase",
            verdictConfig[data.level].badgeClass
          )}>
            {data.level}
          </span>
        </div>
      </div>
      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", levelColors[data.level])}
        />
        {/* Baby safety limit marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/50"
          style={{ left: `${limitPercent}%` }}
          title={`Baby safety limit: ${config.babyLimit} ${config.unit}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="text-foreground/60">Baby limit: {config.babyLimit} {config.unit}</span>
        <span>{maxPpb}</span>
      </div>
    </div>
  );
};

export const HeavyMetalsAlert = ({ data }: HeavyMetalsAlertProps) => {
  if (!data?.found) return null;

  const verdict = verdictConfig[data.overallVerdict];
  const VerdictIcon = verdict.Icon;

  const metals = [
    { key: "arsenic", data: data.arsenic },
    { key: "lead", data: data.lead },
    { key: "cadmium", data: data.cadmium },
    { key: "mercury", data: data.mercury },
  ].filter(m => m.data?.ppb !== null && m.data?.ppb !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border-2 overflow-hidden",
        verdict.borderClass,
        verdict.bgClass
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          data.overallVerdict === "avoid" ? "bg-danger" : data.overallVerdict === "caution" ? "bg-caution" : "bg-safe"
        )}>
          <FlaskConical className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-bold text-base uppercase tracking-wide", verdict.textClass)}>
              Heavy Metals Analysis
            </h3>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", verdict.badgeClass)}>
              {verdict.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lab-tested contaminant levels for baby food safety
          </p>
        </div>
      </div>

      {/* Metal bars */}
      <div className="px-4 pb-3 space-y-3">
        {metals.map(({ key, data: metalData }) => (
          <MetalBar key={key} metal={key} data={metalData} />
        ))}
      </div>

      {/* Source & notes */}
      <div className="px-4 pb-4 space-y-2">
        {data.labSource && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3 shrink-0" />
            <span>Source: <span className="font-medium text-foreground/80">{data.labSource}</span></span>
            {data.testDate && <span>• Tested: {data.testDate}</span>}
            {data.confidence && <span>• Confidence: {data.confidence}</span>}
          </div>
        )}
        {data.notes && (
          <p className="text-xs text-muted-foreground bg-background/30 rounded-lg p-2">
            {data.notes}
          </p>
        )}
        {data.overallVerdict === "avoid" && (
          <div className="flex items-start gap-2 p-2 bg-danger/10 rounded-lg border border-danger/20">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              <span className="font-bold text-danger">WARNING:</span> This product exceeds recommended baby food safety thresholds. Consider safer alternatives.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
