import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, FunnelChart, Funnel, LabelList
} from "recharts";
import { 
  TrendingUp, TrendingDown, Eye, MousePointer, FileText, Users, 
  Target, DollarSign, Loader2, ArrowRight
} from "lucide-react";

interface FunnelStats {
  total_scans: number;
  toxic_cta_views: number;
  toxic_cta_clicks: number;
  form_opens: number;
  form_submits: number;
  leads_created: number;
  leads_distributed: number;
  cta_view_rate: number;
  cta_click_rate: number;
  form_open_rate: number;
  form_completion_rate: number;
  overall_conversion_rate: number;
}

interface DailyStats {
  date: string;
  scans: number;
  cta_views: number;
  cta_clicks: number;
  form_submits: number;
  leads: number;
  click_rate: number;
  conversion_rate: number;
}

export const ConversionAnalyticsTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [daysBack, setDaysBack] = useState("30");
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  useEffect(() => {
    loadStats();
  }, [daysBack]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(daysBack, 10);
      
      // Load funnel stats
      const { data: funnel, error: funnelError } = await supabase.rpc("get_conversion_funnel_stats", {
        days_back: days
      });
      
      if (funnelError) throw funnelError;
      if (funnel && funnel.length > 0) {
        setFunnelStats(funnel[0]);
      }
      
      // Load daily stats
      const { data: daily, error: dailyError } = await supabase.rpc("get_daily_conversion_stats", {
        days_back: days
      });
      
      if (dailyError) throw dailyError;
      setDailyStats(daily || []);
    } catch (error: any) {
      console.error("Error loading conversion stats:", error);
      toast({
        title: "Error Loading Analytics",
        description: error.message || "Could not load conversion data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funnel data for visualization
  const funnelData = funnelStats ? [
    { name: "Total Scans", value: funnelStats.total_scans, fill: "hsl(var(--primary))" },
    { name: "CTA Views", value: funnelStats.toxic_cta_views, fill: "hsl(var(--chart-1))" },
    { name: "CTA Clicks", value: funnelStats.toxic_cta_clicks, fill: "hsl(var(--chart-2))" },
    { name: "Form Opens", value: funnelStats.form_opens, fill: "hsl(var(--chart-3))" },
    { name: "Form Submits", value: funnelStats.form_submits, fill: "hsl(var(--chart-4))" },
    { name: "Leads Created", value: funnelStats.leads_created, fill: "hsl(var(--safe))" },
  ] : [];

  const MetricCard = ({ 
    title, 
    value, 
    subValue, 
    icon: Icon, 
    trend,
    color = "primary" 
  }: {
    title: string;
    value: string | number;
    subValue?: string;
    icon: any;
    trend?: "up" | "down" | "neutral";
    color?: "primary" | "safe" | "caution" | "danger";
  }) => (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}/10 rounded-bl-full`} />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`w-5 h-5 text-${color}`} />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3 text-safe" />
            ) : trend === "down" ? (
              <TrendingDown className="w-3 h-3 text-danger" />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Conversion Analytics</h2>
          <p className="text-muted-foreground">Track clicks to legal leads funnel</p>
        </div>
        <Select value={daysBack} onValueChange={setDaysBack}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Scans"
          value={funnelStats?.total_scans || 0}
          icon={Eye}
          color="primary"
        />
        <MetricCard
          title="CTA Click Rate"
          value={`${funnelStats?.cta_click_rate || 0}%`}
          subValue={`${funnelStats?.toxic_cta_clicks || 0} clicks`}
          icon={MousePointer}
          color="caution"
        />
        <MetricCard
          title="Form Completion"
          value={`${funnelStats?.form_completion_rate || 0}%`}
          subValue={`${funnelStats?.form_submits || 0} submissions`}
          icon={FileText}
          color="primary"
        />
        <MetricCard
          title="Leads Created"
          value={funnelStats?.leads_created || 0}
          subValue={`${funnelStats?.overall_conversion_rate || 0}% of scans`}
          icon={Users}
          color="safe"
        />
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>
            Drop-off at each stage of the lead generation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Visual Funnel Steps */}
          <div className="space-y-3">
            {funnelData.map((step, index) => {
              const percentage = funnelData[0].value > 0 
                ? ((step.value / funnelData[0].value) * 100).toFixed(1)
                : "0";
              const dropOff = index > 0 && funnelData[index - 1].value > 0
                ? (((funnelData[index - 1].value - step.value) / funnelData[index - 1].value) * 100).toFixed(1)
                : null;
              
              return (
                <div key={step.name} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-28 text-sm text-muted-foreground shrink-0">
                      {step.name}
                    </div>
                    <div className="flex-1">
                      <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="absolute inset-y-0 left-0 rounded-lg"
                          style={{ backgroundColor: step.fill }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                          <span className="text-sm font-medium text-foreground z-10">
                            {step.value.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground z-10">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {dropOff && parseFloat(dropOff) > 0 && (
                      <Badge variant="outline" className="text-danger border-danger/30 shrink-0">
                        -{dropOff}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stage-to-Stage Conversion Rates */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-4">Stage Conversion Rates</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">{funnelStats?.cta_view_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Scans → CTA View</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">{funnelStats?.cta_click_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">View → Click</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">{funnelStats?.form_open_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Click → Form Open</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-primary">{funnelStats?.form_completion_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Form → Submit</p>
              </div>
              <div className="text-center p-3 bg-safe/10 rounded-lg border border-safe/30">
                <p className="text-lg font-bold text-safe">{funnelStats?.overall_conversion_rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Overall Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Daily Conversion Trends
          </CardTitle>
          <CardDescription>
            Daily breakdown of conversions and rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  className="text-xs"
                />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(val) => new Date(val).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="leads" 
                  stroke="hsl(var(--safe))" 
                  strokeWidth={2}
                  name="Leads Created"
                  dot={false}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="cta_clicks" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="CTA Clicks"
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversion_rate" 
                  stroke="hsl(var(--caution))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Conversion Rate %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>Detailed daily metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Scans</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">CTA Views</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Clicks</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Leads</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Click Rate</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.slice(-10).reverse().map((day) => (
                  <tr key={day.date} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-3">
                      {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="text-right py-2 px-3">{day.scans}</td>
                    <td className="text-right py-2 px-3">{day.cta_views}</td>
                    <td className="text-right py-2 px-3">{day.cta_clicks}</td>
                    <td className="text-right py-2 px-3 font-medium text-safe">{day.leads}</td>
                    <td className="text-right py-2 px-3">
                      <Badge variant={day.click_rate > 20 ? "default" : "secondary"} className="text-xs">
                        {day.click_rate}%
                      </Badge>
                    </td>
                    <td className="text-right py-2 px-3">
                      <Badge variant={day.conversion_rate > 5 ? "default" : "secondary"} className="text-xs">
                        {day.conversion_rate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
