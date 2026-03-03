import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  History, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanItem {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  verdict: string | null;
  created_at: string;
}

interface HistoryStats {
  totalScans: number;
  averageScore: number;
  dangerCount: number;
  cautionCount: number;
  safeCount: number;
  trend: 'improving' | 'declining' | 'stable';
}

export const ScanHistoryTab = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScanHistory();
    }
  }, [user]);

  const fetchScanHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, product_name, brand, health_score, verdict, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setScans(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching scan history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (scanData: ScanItem[]) => {
    if (scanData.length === 0) {
      setStats(null);
      return;
    }

    const scoresWithValues = scanData.filter(s => s.health_score !== null);
    const averageScore = scoresWithValues.length > 0
      ? Math.round(scoresWithValues.reduce((acc, s) => acc + (s.health_score || 0), 0) / scoresWithValues.length)
      : 0;

    const dangerCount = scanData.filter(s => s.verdict === 'DANGEROUS' || (s.health_score && s.health_score < 40)).length;
    const cautionCount = scanData.filter(s => s.verdict === 'CAUTION' || (s.health_score && s.health_score >= 40 && s.health_score < 70)).length;
    const safeCount = scanData.filter(s => s.verdict === 'SAFE' || (s.health_score && s.health_score >= 70)).length;

    // Calculate trend from recent vs older scans
    const recentScans = scoresWithValues.slice(0, Math.min(10, scoresWithValues.length));
    const olderScans = scoresWithValues.slice(10, Math.min(20, scoresWithValues.length));
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentScans.length > 0 && olderScans.length > 0) {
      const recentAvg = recentScans.reduce((acc, s) => acc + (s.health_score || 0), 0) / recentScans.length;
      const olderAvg = olderScans.reduce((acc, s) => acc + (s.health_score || 0), 0) / olderScans.length;
      if (recentAvg > olderAvg + 5) trend = 'improving';
      else if (recentAvg < olderAvg - 5) trend = 'declining';
    }

    setStats({
      totalScans: scanData.length,
      averageScore,
      dangerCount,
      cautionCount,
      safeCount,
      trend
    });
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 70) return 'text-safe';
    if (score >= 40) return 'text-caution';
    return 'text-danger';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-muted/20';
    if (score >= 70) return 'bg-safe/20';
    if (score >= 40) return 'bg-caution/20';
    return 'bg-danger/20';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No Scans Yet</h3>
        <p className="text-muted-foreground">
          Start scanning products to see your shopping health report
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Grade Card */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Your Shopping Health</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-4xl font-black", getScoreColor(stats.averageScore))}>
                  {stats.averageScore}
                </span>
                <span className="text-muted-foreground">/100</span>
                {stats.trend === 'improving' && (
                  <div className="flex items-center gap-1 text-safe text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Improving</span>
                  </div>
                )}
                {stats.trend === 'declining' && (
                  <div className="flex items-center gap-1 text-danger text-sm">
                    <TrendingDown className="w-4 h-4" />
                    <span>Declining</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{stats.totalScans}</p>
              <p className="text-sm text-muted-foreground">products scanned</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-safe" />
              <span className="text-safe font-bold">{stats.safeCount}</span>
              <span className="text-muted-foreground text-sm">healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-caution" />
              <span className="text-caution font-bold">{stats.cautionCount}</span>
              <span className="text-muted-foreground text-sm">caution</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-danger" />
              <span className="text-danger font-bold">{stats.dangerCount}</span>
              <span className="text-muted-foreground text-sm">avoid</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Scans */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          Recent Scans
        </h3>
        <div className="space-y-2">
          {scans.slice(0, 20).map((scan, index) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "p-3 rounded-xl border flex items-center justify-between",
                getScoreBg(scan.health_score),
                scan.health_score && scan.health_score < 40 ? 'border-danger/30' :
                scan.health_score && scan.health_score < 70 ? 'border-caution/30' :
                'border-safe/30'
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{scan.product_name}</p>
                {scan.brand && (
                  <p className="text-sm text-muted-foreground truncate">{scan.brand}</p>
                )}
              </div>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                getScoreBg(scan.health_score),
                getScoreColor(scan.health_score)
              )}>
                {scan.health_score ?? '?'}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
