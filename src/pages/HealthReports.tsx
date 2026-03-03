import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { hasProAccess, hasHealthReportsAccess } from "@/lib/subscriptionUtils";
import { 
  FileText, 
  Download, 
  Mail, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Shield,
  AlertTriangle,
  Ban,
  Sparkles,
  Lock,
  Crown,
  ChevronLeft,
  Eye,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HealthReport {
  id: string;
  title: string;
  summary: string | null;
  health_grade: string | null;
  total_scans: number | null;
  safe_products: number | null;
  caution_products: number | null;
  avoid_products: number | null;
  average_score: number | null;
  top_concerns: string[] | null;
  improvements: string[] | null;
  recommendations: string[] | null;
  report_html: string | null;
  email_sent: boolean | null;
  created_at: string;
}

const gradeColors: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-lime-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  F: "bg-red-500"
};

export default function HealthReports() {
  const { user } = useAuth();
  const { getEffectiveTier } = useDebug();
  const navigate = useNavigate();
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user!.id)
      .maybeSingle();
    if (data) setSubscriptionTier(data.subscription_tier || "free");
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("health_reports")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Transform the data to match our interface
      const typedReports: HealthReport[] = (data || []).map(r => ({
        ...r,
        top_concerns: r.top_concerns as string[] | null,
        improvements: r.improvements as string[] | null,
        recommendations: r.recommendations as string[] | null,
      }));
      setReports(typedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewReport = async (sendEmail: boolean = false) => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate reports");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-health-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sendEmail, daysBack: 7 }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to generate report");
      }

      toast.success(
        sendEmail 
          ? "Report generated and sent to your email!" 
          : "Report generated successfully!"
      );
      
      fetchReports();
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = (report: HealthReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const downloadReport = (report: HealthReport) => {
    const blob = new Blob([report.report_html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-report-${new Date(report.created_at).toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const downloadPdf = async (report: HealthReport) => {
    const effectiveTier = getEffectiveTier(subscriptionTier);
    if (!hasProAccess(effectiveTier)) {
      toast.error("PDF export is a Pro feature");
      return;
    }
    setIsDownloadingPdf(report.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-health-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ reportId: report.id }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const blob = new Blob([result.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || `health-report.pdf.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF-ready report downloaded!");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view reports</h2>
              <p className="text-muted-foreground mb-4">
                Access your personalized weekly health reports
              </p>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Gate access to paid tiers only
  const effectiveTier = getEffectiveTier(subscriptionTier);
  if (!hasHealthReportsAccess(effectiveTier)) {
    return (
      <AppLayout containerClassName="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <CardContent className="pt-8 pb-8 text-center relative">
              <div className="absolute top-4 right-4">
                <Badge className="bg-amber-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium Feature
                </Badge>
              </div>
              
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <Lock className="h-10 w-10 text-primary" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Health Reports</h1>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get AI-powered weekly analysis of your food choices with personalized recommendations
              </p>
              
              <div className="grid gap-3 text-left max-w-sm mx-auto mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm">Weekly AI health analysis</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">Track improvements over time</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-blue-500 shrink-0" />
                  <span className="text-sm">Personalized recommendations</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-purple-500 shrink-0" />
                  <span className="text-sm">Email reports to yourself</span>
                </div>
              </div>
              
              <Button 
                size="lg"
                onClick={() => navigate("/subscription")}
                className="gap-2"
              >
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Starting at $9.99/month
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <>
    <Helmet>
      <title>Baby Food Health Reports | Track Toxic Ingredient Exposure | FoodFactScanner®</title>
      <meta name="description" content="Generate personalized baby food health reports. Track your child's exposure to heavy metals, toxic ingredients, and unsafe baby food products over time. Protect your baby with data-driven insights." />
      <meta name="keywords" content="baby food health report, toxic ingredient exposure tracker, baby food safety report, heavy metals exposure baby, baby food scan history" />
      <link rel="canonical" href="https://foodfactscanner.com/health-reports" />
      <meta property="og:title" content="Baby Food Health Reports | FoodFactScanner®" />
      <meta property="og:description" content="Generate personalized baby food health reports tracking heavy metals and toxic ingredient exposure." />
      <meta property="og:url" content="https://foodfactscanner.com/health-reports" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <AppLayout containerClassName="max-w-2xl">
      <div className="space-y-6">
        {/* Generate Report Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">Generate New Report</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Get an AI-powered analysis of your food choices from the past 7 days
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => generateNewReport(false)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => generateNewReport(true)}
                    disabled={isGenerating}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Generate & Email
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Your Reports</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No reports yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate your first health report to see AI-powered insights
                </p>
                <Button onClick={() => generateNewReport(false)} disabled={isGenerating}>
                  Generate First Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {/* Grade Circle */}
                        <div 
                          className={`h-16 w-16 rounded-full ${gradeColors[report.health_grade] || 'bg-gray-500'} text-white flex items-center justify-center text-2xl font-bold shrink-0`}
                        >
                          {report.health_grade}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold truncate">{report.title}</h4>
                            {report.email_sent && (
                              <Badge variant="outline" className="shrink-0">
                                <Mail className="h-3 w-3 mr-1" />
                                Emailed
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(report.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          
                        {/* Stats Row */}
                          <div className="flex flex-wrap gap-3 text-sm mb-3">
                            <span className="flex items-center gap-1">
                              <Shield className="h-4 w-4 text-green-500" />
                              {report.safe_products ?? 0} safe
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              {report.caution_products ?? 0} caution
                            </span>
                            <span className="flex items-center gap-1">
                              <Ban className="h-4 w-4 text-red-500" />
                              {report.avoid_products ?? 0} avoid
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {report.summary || "No summary available"}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm" 
                              variant="outline"
                              onClick={() => viewReport(report)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => downloadReport(report)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Report View Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedReport?.title}</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => selectedReport && downloadReport(selectedReport)}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1">
            {selectedReport && (
              <iframe
                srcDoc={selectedReport.report_html}
                className="w-full h-[70vh] border-0"
                title="Health Report"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
    </>
  );
}
