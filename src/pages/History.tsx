import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { HealthScore } from "@/components/HealthScore";
import { Button } from "@/components/ui/button";
import { LegalConsultationForm } from "@/components/LegalConsultationForm";
import { ScanDetailModal } from "@/components/ScanDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Clock, Trash2, Loader2, Skull, ShieldAlert, AlertTriangle, Crown, Lock, Scale, X, Phone, ChevronRight, Bell, SortAsc, SortDesc, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subMonths, isAfter } from "date-fns";
import { hasFullHistoryAccess } from "@/lib/subscriptionUtils";

interface ScanHistoryItem {
  id: string;
  product_name: string;
  brand: string | null;
  health_score: number | null;
  verdict: string | null;
  scan_type: string | null;
  created_at: string;
  ingredients?: any;
  nutrition?: any;
  dietary_flags?: any;
  barcode?: string;
  image_url?: string;
}

interface RecallMatch {
  id: string;
  recall_id: string;
  scan_id: string | null;
  food_recalls: {
    product_description: string;
    reason_for_recall: string | null;
    classification: string | null;
  } | null;
}

const FREE_TIER_HISTORY_DAYS = 7;

type SortOrder = "newest" | "oldest";
type FilterPeriod = "all" | "week" | "month" | "3months";

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [allScans, setAllScans] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [showLegalForm, setShowLegalForm] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailScan, setDetailScan] = useState<ScanHistoryItem | null>(null);
  
  // Sorting and filtering state
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  
  // Recalled products state
  const [recallMatches, setRecallMatches] = useState<RecallMatch[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchScanHistory();
      fetchRecallMatches();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();
      
      setSubscriptionTier(data?.subscription_tier || "free");
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchScanHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("scan_history")
        .select("id, product_name, brand, health_score, verdict, scan_type, created_at, ingredients, nutrition, dietary_flags, barcode, image_url")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllScans(data || []);
    } catch (error) {
      console.error("Error fetching scan history:", error);
      toast({
        title: "Error",
        description: "Could not load scan history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecallMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("user_recall_matches")
        .select(`
          id,
          recall_id,
          scan_id,
          food_recalls (
            product_description,
            reason_for_recall,
            classification
          )
        `)
        .eq("user_id", user!.id);

      if (error) throw error;
      setRecallMatches((data as RecallMatch[]) || []);
    } catch (error) {
      console.error("Error fetching recall matches:", error);
    }
  };

  // Filter and sort scans based on subscription tier, filter period, and sort order
  const filteredAndSortedScans = useMemo(() => {
    let result = [...allScans];

    // Apply subscription tier filter for free users
    if (!hasFullHistoryAccess(subscriptionTier)) {
      const cutoffDate = subDays(new Date(), FREE_TIER_HISTORY_DAYS);
      result = result.filter(scan => isAfter(new Date(scan.created_at), cutoffDate));
    }

    // Apply date filter
    if (filterPeriod !== "all") {
      const now = new Date();
      let filterDate: Date;
      
      switch (filterPeriod) {
        case "week":
          filterDate = subDays(now, 7);
          break;
        case "month":
          filterDate = subMonths(now, 1);
          break;
        case "3months":
          filterDate = subMonths(now, 3);
          break;
        default:
          filterDate = new Date(0);
      }
      
      result = result.filter(scan => isAfter(new Date(scan.created_at), filterDate));
    }

    // Apply sort order
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [allScans, subscriptionTier, filterPeriod, sortOrder]);

  // Update scans when filteredAndSortedScans changes
  useEffect(() => {
    setScans(filteredAndSortedScans);
  }, [filteredAndSortedScans]);

  const hasOlderScans = !hasFullHistoryAccess(subscriptionTier) && allScans.length > scans.length;

  const deleteScan = async (scanId: string) => {
    try {
      const { error } = await supabase
        .from("scan_history")
        .delete()
        .eq("id", scanId);

      if (error) throw error;

      setScans(prev => prev.filter(scan => scan.id !== scanId));
      toast({
        title: "Deleted",
        description: "Scan removed from history"
      });
    } catch (error) {
      console.error("Error deleting scan:", error);
      toast({
        title: "Error",
        description: "Could not delete scan",
        variant: "destructive"
      });
    }
  };

  const getVerdictStyle = (verdict: string | null) => {
    switch (verdict) {
      case "healthy": return { text: "Safe", class: "text-safe" };
      case "caution": return { text: "⚠️ Caution", class: "text-caution" };
      case "avoid": return { text: "☠️ DANGER", class: "text-danger font-bold" };
      default: return { text: "Unknown", class: "text-muted-foreground" };
    }
  };

  const toxicScansCount = scans.filter(s => s.verdict === 'avoid').length;

  const handleLegalClick = (scan: ScanHistoryItem) => {
    setSelectedScan(scan);
    setShowLegalForm(true);
  };

  const getToxicIngredients = (scan: ScanHistoryItem) => {
    if (!scan.ingredients || !Array.isArray(scan.ingredients)) return [];
    return scan.ingredients
      .filter((i: any) => i.riskLevel === "high" || i.riskLevel === "moderate" || i.riskLevel === "danger" || i.riskLevel === "caution")
      .map((i: any) => ({
        name: i.name,
        riskLevel: i.riskLevel,
        healthConcerns: i.healthConcerns,
      }));
  };

  const handleScanClick = (scan: ScanHistoryItem) => {
    setDetailScan(scan);
    setShowDetailModal(true);
  };

  if (!user) {
    return (
      <AppLayout className="bg-background" containerClassName="py-12 text-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-danger/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--danger)/0.3)]">
              <Skull className="w-10 h-10 text-danger" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">Threat History</h1>
              <p className="text-muted-foreground mt-2">
                Sign in to track what you've been exposed to
              </p>
            </div>
            <Link to="/auth">
              <Button className="gap-2 bg-danger hover:bg-danger/90 shadow-[0_0_20px_hsl(var(--danger)/0.5)]">
                Sign In to Protect Yourself
                <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </motion.div>
    </AppLayout>
    );
  }

  return (
    <AppLayout className="bg-background" containerClassName="space-y-6">
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-danger" />
              Threat Log
            </h1>
            <p className="text-muted-foreground mt-1">
              Products you've scanned for hidden dangers
            </p>
          </div>
          <Link to="/notifications">
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="w-4 h-4" />
              Alerts
            </Button>
          </Link>
        </motion.div>

        {/* Recalled Products Alert */}
        {recallMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl bg-danger/20 border border-danger/40"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-danger/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-danger">
                  ⚠️ {recallMatches.length} of your scanned products have been recalled!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check your email for detailed recall information or visit the FDA website.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sort and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-[140px]">
              {sortOrder === "newest" ? (
                <SortDesc className="w-4 h-4 mr-2" />
              ) : (
                <SortAsc className="w-4 h-4 mr-2" />
              )}
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Legal Help Banner - shows if user has scanned toxic products */}
        {toxicScansCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-danger/10 border border-primary/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  You've scanned {toxicScansCount} dangerous product{toxicScansCount !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Were you harmed? Get a FREE legal consultation with no obligation.
                </p>
                <Button
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => {
                    const firstToxic = scans.find(s => s.verdict === 'avoid');
                    if (firstToxic) handleLegalClick(firstToxic);
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Speak to an Attorney
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-danger" />
          </div>
        ) : scans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-danger/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <p className="text-muted-foreground">No scans yet - you're eating blind!</p>
            <Link to="/scanner">
              <Button className="gap-2 bg-danger hover:bg-danger/90">
                Start Protecting Yourself
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan, index) => {
              const verdictStyle = getVerdictStyle(scan.verdict);
              return (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border cursor-pointer hover:shadow-lg transition-all ${
                    scan.verdict === 'avoid' 
                      ? 'bg-danger/10 border-danger/30 hover:border-danger/50' 
                      : scan.verdict === 'caution'
                      ? 'bg-caution/10 border-caution/30 hover:border-caution/50'
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                  onClick={() => handleScanClick(scan)}
                >
                  <div className="flex items-center gap-4">
                    {scan.image_url ? (
                      <img 
                        src={scan.image_url} 
                        alt={scan.product_name}
                        className="w-14 h-14 object-cover rounded-lg border border-border"
                        onError={(e) => {
                          // Fallback to HealthScore if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={scan.image_url ? "hidden" : ""}>
                      <HealthScore score={scan.health_score || 0} size="sm" showLabel={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{scan.product_name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground truncate">{scan.brand || "Unknown brand"}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className={verdictStyle.class}>
                          {verdictStyle.text}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(scan.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScan(scan.id);
                        }}
                        className="p-2 text-muted-foreground hover:text-danger transition-colors"
                        aria-label="Delete scan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  
                  {/* Legal Help CTA for toxic products */}
                  {scan.verdict === 'avoid' && (
                    <div className="mt-3 pt-3 border-t border-danger/20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLegalClick(scan);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Get Legal Help</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
            
            {/* Upgrade prompt for free users with older history */}
            {hasOlderScans && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-gradient-to-br from-caution/20 to-danger/20 border border-caution/30"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-caution/20 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-caution" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <Crown className="w-4 h-4 text-caution" />
                      {allScans.length - scans.length} older scans hidden
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Free accounts only see the last 7 days. Upgrade to access your complete scan history.
                    </p>
                    <Link to="/subscription">
                      <Button size="sm" className="mt-3 gap-2 bg-caution hover:bg-caution/90 text-foreground">
                        <Crown className="w-4 h-4" />
                        Unlock Full History
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Legal Consultation Modal */}
        <AnimatePresence>
          {showLegalForm && selectedScan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowLegalForm(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 z-10 bg-card border border-border rounded-full shadow-lg"
                    onClick={() => setShowLegalForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <LegalConsultationForm
                    productName={selectedScan.product_name}
                    brand={selectedScan.brand || undefined}
                    healthScore={selectedScan.health_score || 0}
                    toxicIngredients={getToxicIngredients(selectedScan)}
                    scanId={selectedScan.id}
                    onComplete={() => setShowLegalForm(false)}
                    onClose={() => setShowLegalForm(false)}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Detail Modal */}
        {detailScan && (
          <ScanDetailModal
            scan={detailScan}
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setDetailScan(null);
            }}
          />
        )}
    </AppLayout>
  );
};

export default History;
