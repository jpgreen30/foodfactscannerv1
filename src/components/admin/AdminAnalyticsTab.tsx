import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface DailyData {
  date: string;
  count: number;
}

interface TierData {
  tier: string;
  count: number;
}

export const AdminAnalyticsTab = () => {
  const { toast } = useToast();
  const [signupData, setSignupData] = useState<DailyData[]>([]);
  const [scanData, setScanData] = useState<DailyData[]>([]);
  const [tierData, setTierData] = useState<TierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [signups, scans, tiers] = await Promise.all([
        supabase.rpc("get_admin_daily_signups", { _days: 30 }),
        supabase.rpc("get_admin_daily_scans", { _days: 30 }),
        supabase.rpc("get_admin_subscription_distribution"),
      ]);

      if (signups.error) throw signups.error;
      if (scans.error) throw scans.error;
      if (tiers.error) throw tiers.error;

      // Fill in missing dates for signups
      const filledSignups = fillMissingDates(signups.data || [], 30);
      const filledScans = fillMissingDates(scans.data || [], 30);

      setSignupData(filledSignups);
      setScanData(filledScans);
      setTierData(tiers.data || []);
    } catch (err) {
      console.error("Error loading analytics:", err);
      toast({
        title: "Error",
        description: "Could not load analytics. Make sure you have admin access.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillMissingDates = (data: DailyData[], days: number): DailyData[] => {
    const result: DailyData[] = [];
    const dataMap = new Map(data.map((d) => [d.date, d.count]));

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      result.push({
        date,
        count: dataMap.get(date) || 0,
      });
    }
    return result;
  };

  const TIER_COLORS = {
    free: "hsl(var(--muted-foreground))",
    premium: "hsl(var(--primary))",
    family: "hsl(var(--safe))",
    pro: "hsl(45, 93%, 47%)",
  };

  const chartConfig = {
    signups: {
      label: "Signups",
      color: "hsl(var(--primary))",
    },
    scans: {
      label: "Scans",
      color: "hsl(var(--safe))",
    },
  };

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
      {/* Signups Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            User Signups (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={signupData}>
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#signupGradient)"
                name="Signups"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scans Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-safe" />
              Daily Scans (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={scanData}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "d")}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--safe))"
                  radius={[4, 4, 0, 0]}
                  name="Scans"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-caution" />
              Subscription Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="tier"
                    label={({ tier, count }) => `${tier}: ${count}`}
                    labelLine={false}
                  >
                    {tierData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TIER_COLORS[entry.tier as keyof typeof TIER_COLORS] || TIER_COLORS.free}
                      />
                    ))}
                  </Pie>
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {tierData.map((tier) => (
                <div key={tier.tier} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] || TIER_COLORS.free,
                    }}
                  />
                  <span className="text-sm text-muted-foreground capitalize">
                    {tier.tier} ({tier.count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
