import { motion } from "framer-motion";
import { Shield, Zap, AlertTriangle } from "lucide-react";
import { useMonetization } from "@/hooks/useMonetization";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ScanCreditsBanner() {
  const { isFreeTrial, scanCreditsRemaining, isBlocked, isUnlimited, loading } = useMonetization();

  if (loading || isUnlimited) return null;

  if (isBlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/10"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            Free scans used up — upgrade to keep scanning
          </span>
        </div>
        <Link to="/subscription">
          <Button size="sm" variant="destructive" className="gap-1">
            <Zap className="w-3 h-3" />
            Upgrade
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (isFreeTrial && scanCreditsRemaining <= 3) {
    const urgency = scanCreditsRemaining <= 1;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-between p-3 rounded-lg border ${
          urgency ? 'border-destructive/30 bg-destructive/5' : 'border-primary/30 bg-primary/5'
        }`}
      >
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${urgency ? 'text-destructive' : 'text-primary'}`} />
          <span className="text-sm text-foreground">
            <span className="font-bold">{scanCreditsRemaining}</span> free scan{scanCreditsRemaining !== 1 ? 's' : ''} remaining
          </span>
        </div>
        <Link to="/subscription">
          <Button size="sm" variant={urgency ? "destructive" : "default"} className="gap-1">
            <Zap className="w-3 h-3" />
            Upgrade
          </Button>
        </Link>
      </motion.div>
    );
  }

  return null;
}
