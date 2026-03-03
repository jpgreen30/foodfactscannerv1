import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Baby, AlertTriangle, ShieldAlert, ExternalLink, Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BabyRecall {
  id: string;
  product_description: string;
  brand_name: string | null;
  reason_for_recall: string | null;
  classification: string | null;
  recalling_firm: string | null;
  created_at: string;
}

interface BabyFoodRecallAlertsProps {
  onClose?: () => void;
}

export const BabyFoodRecallAlerts = ({ onClose }: BabyFoodRecallAlertsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recalls, setRecalls] = useState<BabyRecall[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    if (user) {
      fetchParentStatus();
      fetchBabyRecalls();
      fetchAlertPreferences();
    }
  }, [user]);

  const fetchParentStatus = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("is_pregnant, is_new_mom, is_nursing, baby_ages")
      .eq("id", user!.id)
      .single();

    if (data) {
      const babyAges = data.baby_ages;
      const hasBabyAges = Array.isArray(babyAges) && babyAges.length > 0;
      setIsParent(
        data.is_pregnant || 
        data.is_new_mom || 
        data.is_nursing || 
        hasBabyAges
      );
    }
  };

  const fetchAlertPreferences = async () => {
    const { data } = await supabase
      .from("notification_preferences")
      .select("recall_alerts, email_recall_alerts")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setAlertsEnabled(data.recall_alerts !== false);
    }
  };

  const fetchBabyRecalls = async () => {
    setLoading(true);
    try {
      // Fetch recent recalls
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("food_recalls")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter for baby-related keywords
      const babyKeywords = [
        'infant', 'baby', 'toddler', 'formula', 'gerber', 'enfamil', 
        'similac', 'beech-nut', 'happy baby', 'plum organics', 'puree',
        'cereal', 'puffs', 'teething'
      ];

      const babyRecalls = (data || []).filter((recall: BabyRecall) => {
        const searchText = `${recall.product_description} ${recall.brand_name || ''}`.toLowerCase();
        return babyKeywords.some(keyword => searchText.includes(keyword));
      });

      setRecalls(babyRecalls);
    } catch (error) {
      console.error("Error fetching baby recalls:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlerts = async () => {
    const newValue = !alertsEnabled;
    setAlertsEnabled(newValue);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user!.id,
        recall_alerts: newValue,
        email_recall_alerts: newValue,
      });

    if (error) {
      setAlertsEnabled(!newValue);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    } else {
      toast({
        title: newValue ? "Alerts Enabled" : "Alerts Disabled",
        description: newValue 
          ? "You'll receive baby food recall alerts" 
          : "You won't receive baby food recall alerts",
      });
    }
  };

  const getSeverityBadge = (classification: string | null) => {
    if (classification === "Class I") {
      return <Badge variant="destructive">High Risk</Badge>;
    }
    if (classification === "Class II") {
      return <Badge className="bg-amber-500">Moderate</Badge>;
    }
    return <Badge variant="secondary">Low Risk</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isParent) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6 text-center">
          <Baby className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Baby food recall alerts are available for registered parents.
          </p>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Update your profile to enable this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-danger/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ShieldAlert className="w-5 h-5 text-danger" />
            Baby Food Recalls
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {alertsEnabled ? (
                <Bell className="w-4 h-4 text-safe" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
              <Switch
                checked={alertsEnabled}
                onCheckedChange={toggleAlerts}
                className="data-[state=checked]:bg-safe"
              />
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Recent recalls affecting infant formula and baby foods
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-danger" />
          </div>
        ) : recalls.length === 0 ? (
          <div className="text-center py-8">
            <Baby className="w-12 h-12 mx-auto text-safe mb-3" />
            <p className="text-foreground font-medium">All Clear!</p>
            <p className="text-sm text-muted-foreground">
              No baby food recalls in the past 30 days
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {recalls.map((recall, index) => (
              <motion.div
                key={recall.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-muted border border-border hover:border-danger/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
                    <span className="font-medium text-foreground text-sm">
                      {recall.brand_name || "Unknown Brand"}
                    </span>
                  </div>
                  {getSeverityBadge(recall.classification)}
                </div>
                
                <p className="text-sm text-foreground/80 mb-2 line-clamp-2">
                  {recall.product_description}
                </p>
                
                {recall.reason_for_recall && (
                  <p className="text-xs text-danger/80 mb-2 line-clamp-1">
                    ⚠️ {recall.reason_for_recall}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDate(recall.created_at)}</span>
                  <a
                    href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    View Details <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!alertsEnabled && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-4">
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              Alerts are disabled. Enable to get notified about new baby food recalls.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
