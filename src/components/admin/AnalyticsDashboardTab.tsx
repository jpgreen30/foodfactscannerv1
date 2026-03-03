import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import {
  Users, ScanLine, CreditCard, Target, Loader2, Activity,
  ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle,
  TrendingUp, Megaphone, Crown, ShieldAlert, BarChart3,
  UserCheck, UserX, Zap
} from "lucide-react";

interface ComprehensiveAnalytics {
  user_metrics: {
    total_users: number;
    active_users_7d: number;
    trial_users: number;
    basic_subscribers: number;
    premium_subscribers: number;
    annual_subscribers: number;
    total_paid: number;
    conversion_rate: number;
    churn_rate: number;
    new_users_30d: number;
  };
  scan_metrics: {
    total_scans: number;
    avg_scans_per_user: number;
    high_risk_count: number;
    risk_distribution: { safe: number; moderate: number; high_risk: number };
    top_products: { product_name: string; brand: string; scan_count: number }[];
  };
  revenue_metrics: {
    mrr: number;
    arr: number;
    failed_payments_30d: number;
    upgrades_30d: number;
    upgrade_rate: number;
  };
  marketing_metrics: {
    leads_created: number;
    trial_starts_30d: number;
    conversion_funnel: {
      total_scans: number;
      cta_views: number;
      cta_clicks: number;
      form_submits: number;
      leads: number;
    };
  };
}

const RISK_COLORS = {
  safe: "hsl(var(--safe))",
  moderate: "hsl(var(--caution))",
  high_risk: "hsl(var(--danger))",
};

export const AnalyticsDashboardTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ComprehensiveAnalytics | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.rpc("get_admin_comprehensive_analytics");
      if (error) throw error;
      setData(result as unknown as ComprehensiveAnalytics);
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      toast({ title: "Error", description: err.message || "Could not load analytics.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { user_metrics: um, scan_metrics: sm, revenue_metrics: rm, marketing_metrics: mm } = data;

  const riskData = [
    { name: "Safe", value: sm.risk_distribution.safe, color: RISK_COLORS.safe },
    { name: "Moderate", value: sm.risk_distribution.moderate, color: RISK_COLORS.moderate },
    { name: "High Risk", value: sm.risk_distribution.high_risk, color: RISK_COLORS.high_risk },
  ];
  const totalRiskScans = riskData.reduce((a, b) => a + b.value, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Command Center
        </h2>
        <p className="text-muted-foreground">All key business metrics at a glance</p>
      </div>

      {/* ── PRIMARY KPIs ── */}
      <Section title="Key Performance Indicators" icon={Target}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Trial → Paid"
            value={`${um.total_users > 0 ? ((um.total_paid / (um.total_paid + um.trial_users)) * 100).toFixed(1) : 0}%`}
            icon={Target}
            color="safe"
            description={`${um.total_paid} paid of ${um.total_paid + um.trial_users} trial+paid`}
          />
          <MetricCard
            title="Scans / User"
            value={sm.avg_scans_per_user}
            icon={ScanLine}
            color="primary"
            description={`${sm.total_scans} total scans`}
          />
          <MetricCard
            title="Risk Alerts / User"
            value={um.total_users > 0 ? (sm.high_risk_count / um.total_users).toFixed(2) : "0"}
            icon={ShieldAlert}
            color="danger"
            description={`${sm.high_risk_count} high-risk scans`}
          />
          <MetricCard
            title="Churn Rate"
            value={`${um.churn_rate}%`}
            icon={UserX}
            color={um.churn_rate > 10 ? "danger" : "safe"}
            description="Last 30 days"
          />
          <MetricCard
            title="Est. LTV"
            value={`$${um.churn_rate > 0 ? (Number(rm.mrr) / (um.churn_rate / 100) / (um.total_paid || 1)).toFixed(0) : "∞"}`}
            icon={DollarSign}
            color="safe"
            description="MRR / churn per user"
          />
        </div>
      </Section>

      {/* ── USER METRICS ── */}
      <Section title="User Metrics" icon={Users}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Users" value={um.total_users} icon={Users} color="primary" />
          <MetricCard title="Active (7d)" value={um.active_users_7d} icon={UserCheck} color="safe"
            description={`${um.total_users > 0 ? ((um.active_users_7d / um.total_users) * 100).toFixed(1) : 0}% of total`} />
          <MetricCard title="Trial Users" value={um.trial_users} icon={Zap} color="caution" />
          <MetricCard title="New (30d)" value={um.new_users_30d} icon={ArrowUpRight} color="primary"
            change={`+${um.new_users_30d}`} changeType="positive" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
          <MetricCard title="Basic" value={um.basic_subscribers} icon={Crown} color="primary" />
          <MetricCard title="Premium" value={um.premium_subscribers} icon={Crown} color="safe" />
          <MetricCard title="Annual" value={um.annual_subscribers} icon={Crown} color="caution" />
          <MetricCard title="Conversion Rate" value={`${um.conversion_rate}%`} icon={Target} color="safe"
            description={`${um.total_paid} paid / ${um.total_users} total`} />
          <MetricCard title="Churn Rate" value={`${um.churn_rate}%`} icon={UserX}
            color={um.churn_rate > 10 ? "danger" : "safe"}
            description="Last 30 days" />
        </div>
      </Section>

      {/* ── SCAN METRICS ── */}
      <Section title="Scan Metrics" icon={ScanLine}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Scans" value={sm.total_scans} icon={ScanLine} color="primary" />
          <MetricCard title="Avg / User" value={sm.avg_scans_per_user} icon={BarChart3} color="safe" />
          <MetricCard title="High-Risk Scans" value={sm.high_risk_count} icon={AlertTriangle} color="danger"
            description={`${totalRiskScans > 0 ? ((sm.high_risk_count / totalRiskScans) * 100).toFixed(1) : 0}% of scored`} />
          <Card className="overflow-hidden">
            <CardContent className="pt-4 pb-2">
              <p className="text-sm font-medium text-muted-foreground mb-1">Risk Distribution</p>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={28} strokeWidth={0}>
                        {riskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 text-xs">
                  {riskData.map(r => (
                    <div key={r.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="text-muted-foreground">{r.name}: {r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        {sm.top_products.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Most Scanned Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sm.top_products.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.product_name}</p>
                        <p className="text-xs text-muted-foreground">{p.brand || "Unknown brand"}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{p.scan_count} scans</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* ── REVENUE METRICS ── */}
      <Section title="Revenue Metrics" icon={DollarSign}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard title="MRR" value={`$${Number(rm.mrr).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} color="safe" />
          <MetricCard title="ARR" value={`$${Number(rm.arr).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="safe" />
          <MetricCard title="Failed Payments" value={rm.failed_payments_30d} icon={AlertTriangle}
            color={rm.failed_payments_30d > 0 ? "danger" : "safe"} description="Last 30 days" />
          <MetricCard title="Upgrades (30d)" value={rm.upgrades_30d} icon={ArrowUpRight} color="primary" />
          <MetricCard title="Upgrade Rate" value={`${rm.upgrade_rate}%`} icon={Target} color="primary"
            description="New users → paid" />
        </div>
      </Section>

      {/* ── MARKETING METRICS ── */}
      <Section title="Marketing Metrics" icon={Megaphone}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Leads Created" value={mm.leads_created} icon={Target} color="primary" />
          <MetricCard title="Trial Starts (30d)" value={mm.trial_starts_30d} icon={Zap} color="caution" />
          <MetricCard title="CTA Click Rate" value={
            mm.conversion_funnel.cta_views > 0
              ? `${((mm.conversion_funnel.cta_clicks / mm.conversion_funnel.cta_views) * 100).toFixed(1)}%`
              : "0%"
          } icon={TrendingUp} color="safe" />
          <MetricCard title="Lead Conversion" value={
            mm.conversion_funnel.total_scans > 0
              ? `${((mm.conversion_funnel.leads / mm.conversion_funnel.total_scans) * 100).toFixed(2)}%`
              : "0%"
          } icon={Target} color="safe" description="Scans → Leads" />
        </div>

        {/* Funnel */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversion Funnel (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Scans", value: mm.conversion_funnel.total_scans, color: "primary" },
                { label: "CTA Views", value: mm.conversion_funnel.cta_views, color: "caution" },
                { label: "CTA Clicks", value: mm.conversion_funnel.cta_clicks, color: "caution" },
                { label: "Submits", value: mm.conversion_funnel.form_submits, color: "safe" },
                { label: "Leads", value: mm.conversion_funnel.leads, color: "safe" },
              ].map((step, idx) => {
                const pct = mm.conversion_funnel.total_scans > 0
                  ? ((step.value / mm.conversion_funnel.total_scans) * 100).toFixed(1)
                  : "0";
                return (
                  <div key={step.label} className="text-center">
                    <div className={`h-2 bg-${step.color}/20 rounded-full overflow-hidden mb-2`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`h-full bg-${step.color}`}
                      />
                    </div>
                    <p className="text-lg font-bold">{step.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{step.label}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{pct}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </Section>
    </motion.div>
  );
};

// Reusable section wrapper
const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
      <Icon className="w-5 h-5 text-primary" />
      {title}
    </h3>
    {children}
  </div>
);

// Reusable metric card
const MetricCard = ({
  title, value, icon: Icon, color = "primary", description, change, changeType,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: "primary" | "safe" | "caution" | "danger";
  description?: string;
  change?: string;
  changeType?: "positive" | "negative";
}) => (
  <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {change && (
            <div className="flex items-center gap-1 mt-1">
              {changeType === "positive" ? <ArrowUpRight className="w-3 h-3 text-safe" /> : <ArrowDownRight className="w-3 h-3 text-danger" />}
              <span className={`text-xs font-medium ${changeType === "positive" ? "text-safe" : "text-danger"}`}>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl bg-${color}/10 shrink-0`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);
