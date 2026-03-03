import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  Users,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  BarChart3,
  Loader2,
  Building,
  FileText,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface LawFirmStats {
  id: string;
  name: string;
  endpoint_type: string;
  price_per_lead: number;
  monthly_cap: number | null;
  current_month_count: number;
  success_count: number;
  failure_count: number;
  total_revenue: number;
  is_active: boolean;
  contract_end_date: string | null;
  last_triggered_at: string | null;
}

interface DistributionSummary {
  total_leads_distributed: number;
  total_revenue: number;
  successful_distributions: number;
  failed_distributions: number;
  active_law_firms: number;
}

interface DailyStats {
  date: string;
  leads_distributed: number;
  revenue: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const LawFirmAnalyticsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lawFirms, setLawFirms] = useState<LawFirmStats[]>([]);
  const [summary, setSummary] = useState<DistributionSummary | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load law firm analytics
      const { data: firmsData, error: firmsError } = await supabase
        .rpc("get_law_firm_analytics");
      
      if (firmsError) throw firmsError;
      setLawFirms((firmsData || []) as LawFirmStats[]);

      // Load distribution summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc("get_lead_distribution_summary", { days_back: parseInt(dateRange) });
      
      if (summaryError) throw summaryError;
      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0] as DistributionSummary);
      }

      // Load daily stats
      const { data: dailyData, error: dailyError } = await supabase
        .rpc("get_daily_distribution_stats", { days_back: parseInt(dateRange) });
      
      if (dailyError) throw dailyError;
      setDailyStats((dailyData || []) as DailyStats[]);

    } catch (error: any) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportBillingReport = (firmId?: string) => {
    const firmsToExport = firmId 
      ? lawFirms.filter(f => f.id === firmId)
      : lawFirms;
    
    const reportData = firmsToExport.map(firm => ({
      "Law Firm": firm.name,
      "Price Per Lead": `$${firm.price_per_lead.toFixed(2)}`,
      "Leads This Month": firm.current_month_count,
      "Monthly Cap": firm.monthly_cap || "Unlimited",
      "Total Leads Delivered": firm.success_count,
      "Failed Deliveries": firm.failure_count,
      "Total Revenue": `$${firm.total_revenue.toFixed(2)}`,
      "Success Rate": `${((firm.success_count / (firm.success_count + firm.failure_count)) * 100 || 0).toFixed(1)}%`,
      "Contract End Date": firm.contract_end_date || "N/A",
      "Status": firm.is_active ? "Active" : "Inactive",
    }));

    // CSV export
    const headers = Object.keys(reportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...reportData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billing_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();

    toast({
      title: "Report Exported",
      description: `Exported billing report for ${firmsToExport.length} law firm(s)`,
    });
  };

  const revenueByFirm = lawFirms
    .filter(f => f.total_revenue > 0)
    .map(f => ({
      name: f.name.length > 15 ? f.name.substring(0, 15) + "..." : f.name,
      fullName: f.name,
      value: f.total_revenue,
    }))
    .slice(0, 5);

  const chartConfig: ChartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    leads: { label: "Leads", color: "hsl(var(--chart-2))" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Law Firm Analytics & Billing
          </h3>
          <p className="text-sm text-muted-foreground">
            Track revenue, lead distribution, and law firm performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportBillingReport()}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              ${summary?.total_revenue?.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Leads Distributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">
              {summary?.total_leads_distributed || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {summary?.successful_distributions || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {summary?.failed_distributions || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Active Firms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-400">
              {summary?.active_law_firms || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Revenue & Leads Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyStats.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart data={dailyStats}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), "MMM d")}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name="Revenue ($)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="leads_distributed" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={false}
                    name="Leads"
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No distribution data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Firm */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Revenue by Law Firm
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByFirm.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={revenueByFirm} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg p-2 shadow-lg">
                            <p className="font-medium">{payload[0].payload.fullName}</p>
                            <p className="text-primary">${Number(payload[0].value).toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Law Firms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Law Firm Performance
          </CardTitle>
          <CardDescription>
            Detailed breakdown of each law firm's metrics and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Law Firm</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price/Lead</TableHead>
                <TableHead>Monthly Usage</TableHead>
                <TableHead>Total Leads</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lawFirms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No law firms configured yet
                  </TableCell>
                </TableRow>
              ) : (
                lawFirms.map((firm) => {
                  const successRate = firm.success_count + firm.failure_count > 0
                    ? ((firm.success_count / (firm.success_count + firm.failure_count)) * 100).toFixed(1)
                    : "0";
                  const capUsage = firm.monthly_cap 
                    ? `${firm.current_month_count}/${firm.monthly_cap}`
                    : `${firm.current_month_count}/∞`;
                  const isNearCap = firm.monthly_cap && firm.current_month_count >= firm.monthly_cap * 0.8;
                  
                  return (
                    <TableRow key={firm.id}>
                      <TableCell className="font-medium">{firm.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {firm.endpoint_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-400 font-medium">
                        ${firm.price_per_lead?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        <span className={isNearCap ? "text-yellow-400" : ""}>
                          {capUsage}
                        </span>
                      </TableCell>
                      <TableCell>{firm.success_count}</TableCell>
                      <TableCell>
                        <span className={Number(successRate) >= 80 ? "text-green-400" : Number(successRate) >= 50 ? "text-yellow-400" : "text-red-400"}>
                          {successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-green-400">
                        ${firm.total_revenue?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>
                        {firm.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportBillingReport(firm.id)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
