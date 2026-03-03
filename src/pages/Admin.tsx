import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { 
  Loader2,
  Settings,
  LayoutDashboard,
  Users,
  ScanLine,
  BarChart3,
  ShieldAlert,
  Phone,
  Bell,
  TrendingUp,
  Mail,
  Music2,
  Menu,
  RefreshCw
} from "lucide-react";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminScansTab } from "@/components/admin/AdminScansTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminLeadsTab } from "@/components/admin/AdminLeadsTab";
import { PushNotificationAdmin } from "@/components/admin/PushNotificationAdmin";
import { ConversionAnalyticsTab } from "@/components/admin/ConversionAnalyticsTab";
import { AnalyticsDashboardTab } from "@/components/admin/AnalyticsDashboardTab";
import { AdminPinGate } from "@/components/admin/AdminPinGate";
import { EmailManagementTab } from "@/components/admin/EmailManagementTab";
import { KlaviyoIntegrationCard } from "@/components/admin/KlaviyoIntegrationCard";
import { triggerRecallAlertWebhook } from "@/services/zapierIntegration";

interface Analytics {
  total_users: number;
  users_today: number;
  users_this_week: number;
  total_scans: number;
  scans_today: number;
  paid_subscribers: number;
  sms_subscribers: number;
}

// Navigation items for admin menu
const adminNavItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "conversions", label: "Conversions", icon: TrendingUp },
  { id: "leads", label: "Legal Leads", icon: Phone },
  { id: "push", label: "Push", icon: Bell },
  { id: "email", label: "Email", icon: Mail },
  { id: "klaviyo", label: "Klaviyo", icon: Music2 },
  { id: "users", label: "Users", icon: Users },
  { id: "scans", label: "Scans", icon: ScanLine },
  { id: "analytics", label: "Charts", icon: BarChart3 },
];

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Recall alert form state
  const [recallProductName, setRecallProductName] = useState("");
  const [recallBrand, setRecallBrand] = useState("");
  const [recallReason, setRecallReason] = useState("");
  const [recallAction, setRecallAction] = useState("");
  const [isSendingRecall, setIsSendingRecall] = useState(false);
  const [isCheckingFdaRecalls, setIsCheckingFdaRecalls] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    } else {
      navigate("/auth");
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if user is admin using secure database function
      const { data: isAdminResult, error: adminError } = await supabase.rpc("is_admin");
      
      if (adminError) {
        console.error("Admin check error:", adminError);
        // If function doesn't exist yet or errors, deny access
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!isAdminResult) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges. Contact the administrator to get access.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Get user email from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      setUserEmail(profile?.email || user.email || null);

      await Promise.all([loadAnalytics(), loadWebhookSettings()]);
    } catch (err) {
      console.error("Error checking admin access:", err);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc("get_admin_analytics");
      
      if (error) {
        console.error("Analytics error:", error);
        toast({
          title: "Error loading analytics",
          description: error.message,
          variant: "destructive",
        });
      } else if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const loadWebhookSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "zapier_webhook_url")
      .maybeSingle();
    
    if (data?.value) {
      setZapierWebhookUrl(data.value);
    }
  };

  const saveWebhookUrl = async () => {
    setIsSavingWebhook(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ 
          key: "zapier_webhook_url", 
          value: zapierWebhookUrl,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: "key" 
        });

      if (error) throw error;

      toast({
        title: "Webhook Saved",
        description: "Zapier webhook URL has been saved successfully.",
      });
    } catch (err) {
      console.error("Error saving webhook:", err);
      toast({
        title: "Error",
        description: "Could not save webhook URL.",
        variant: "destructive",
      });
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const sendRecallAlert = async () => {
    if (!recallProductName && !recallBrand) {
      toast({
        title: "Missing Information",
        description: "Please enter at least a product name or brand.",
        variant: "destructive",
      });
      return;
    }
    if (!recallReason || !recallAction) {
      toast({
        title: "Missing Information",
        description: "Please enter the recall reason and recommended action.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingRecall(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-recall-alert", {
        body: {
          productName: recallProductName,
          brand: recallBrand,
          recallReason,
          recallAction,
          severity: "high",
        },
      });

      if (error) throw error;

      toast({
        title: "Recall Alert Sent",
        description: `Notified ${data?.stats?.usersWithAlertsEnabled || 0} users. Push: ${data?.stats?.pushNotificationsSent || 0}, SMS: ${data?.stats?.smsAlertsSent || 0}`,
      });

      // Trigger Zapier webhook for recall alert
      triggerRecallAlertWebhook({
        product_name: recallProductName,
        brand: recallBrand,
        reason: recallReason,
        action: recallAction,
        severity: "high",
        affected_user_count: data?.stats?.usersWithAlertsEnabled || 0,
        push_sent: data?.stats?.pushNotificationsSent || 0,
        sms_sent: data?.stats?.smsAlertsSent || 0,
      }).catch(err => console.error('[Zapier] Recall webhook error:', err));

      // Clear form
      setRecallProductName("");
      setRecallBrand("");
      setRecallReason("");
      setRecallAction("");
    } catch (err) {
      console.error("Error sending recall:", err);
      toast({
        title: "Error",
        description: "Could not send recall alert.",
        variant: "destructive",
      });
    } finally {
      setIsSendingRecall(false);
    }
  };

  const checkFdaRecalls = async () => {
    setIsCheckingFdaRecalls(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-fda-recalls");

      if (error) throw error;

      // Build detailed description with email stats
      let description = `Checked ${data?.totalChecked || 0} recalls from FDA. `;
      description += `Found ${data?.newRecalls || 0} new recalls. `;
      
      if (data?.matchedUsers > 0) {
        description += `Matched ${data?.matchedUsers} users. `;
        description += `Emails: ${data?.emailsSent || 0} sent, ${data?.emailsFailed || 0} failed.`;
      } else {
        description += 'No users matched affected products.';
      }

      // Show email errors if any
      if (data?.emailErrors && data.emailErrors.length > 0) {
        console.warn('Email errors:', data.emailErrors);
        toast({
          title: "FDA Recall Check Complete (with warnings)",
          description,
          variant: data.emailsFailed > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "FDA Recall Check Complete",
          description,
        });
      }
    } catch (err) {
      console.error("Error checking FDA recalls:", err);
      toast({
        title: "Error",
        description: "Could not check FDA recalls.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingFdaRecalls(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout showBottomNav={false} className="bg-background" containerClassName="max-w-6xl">
        <div className="py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Show PIN gate if not verified
  if (!isPinVerified) {
    return (
      <AppLayout showBottomNav={false} className="bg-background" containerClassName="max-w-6xl">
        <div className="py-8">
          <AdminPinGate onVerified={() => setIsPinVerified(true)} />
        </div>
      </AppLayout>
    );
  }

  // Render active tab content for mobile
  const renderActiveContent = () => {
    const overviewProps = {
      analytics,
      zapierWebhookUrl,
      setZapierWebhookUrl,
      isSavingWebhook,
      saveWebhookUrl,
      recallProductName,
      setRecallProductName,
      recallBrand,
      setRecallBrand,
      recallReason,
      setRecallReason,
      recallAction,
      setRecallAction,
      isSendingRecall,
      sendRecallAlert,
      isCheckingFdaRecalls,
      checkFdaRecalls,
    };

    switch (activeTab) {
      case "dashboard": return <AnalyticsDashboardTab />;
      case "overview": return <AdminOverviewTab {...overviewProps} />;
      case "conversions": return <ConversionAnalyticsTab />;
      case "leads": return <AdminLeadsTab />;
      case "push": return <PushNotificationAdmin />;
      case "email": return <EmailManagementTab />;
      case "klaviyo": return <KlaviyoIntegrationCard />;
      case "users": return <AdminUsersTab />;
      case "scans": return <AdminScansTab />;
      case "analytics": return <AdminAnalyticsTab />;
      default: return <AnalyticsDashboardTab />;
    }
  };

  const currentNavItem = adminNavItems.find(item => item.id === activeTab);

  return (
    <AppLayout showBottomNav={false} className="bg-background" containerClassName="max-w-6xl">
      <div className="space-y-4 md:space-y-6">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between bg-card border border-border rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">Admin</h1>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{userEmail}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={loadAnalytics} variant="ghost" size="icon" className="shrink-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Admin Menu
                  </SheetTitle>
                </SheetHeader>
                <nav className="p-2 space-y-1">
                  {adminNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                        activeTab === item.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile: Current section indicator */}
        {isMobile && currentNavItem && (
          <div className="flex items-center gap-2 px-1">
            <currentNavItem.icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{currentNavItem.label}</span>
          </div>
        )}

        {/* Desktop Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block bg-card border border-border rounded-xl p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-7 h-7 text-primary" />
                </div>
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-safe" />
                Logged in as: <span className="text-foreground font-medium">{userEmail}</span>
              </p>
            </div>
            <Button onClick={loadAnalytics} variant="outline" size="lg" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex gap-2 w-full overflow-x-auto pb-1 bg-card border border-border rounded-xl p-2 shadow-md scrollbar-thin">
              {adminNavItems.map((item) => (
                <TabsTrigger 
                  key={item.id}
                  value={item.id}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-foreground font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard"><AnalyticsDashboardTab /></TabsContent>
            <TabsContent value="overview">
              <AdminOverviewTab
                analytics={analytics}
                zapierWebhookUrl={zapierWebhookUrl}
                setZapierWebhookUrl={setZapierWebhookUrl}
                isSavingWebhook={isSavingWebhook}
                saveWebhookUrl={saveWebhookUrl}
                recallProductName={recallProductName}
                setRecallProductName={setRecallProductName}
                recallBrand={recallBrand}
                setRecallBrand={setRecallBrand}
                recallReason={recallReason}
                setRecallReason={setRecallReason}
                recallAction={recallAction}
                setRecallAction={setRecallAction}
                isSendingRecall={isSendingRecall}
                sendRecallAlert={sendRecallAlert}
                isCheckingFdaRecalls={isCheckingFdaRecalls}
                checkFdaRecalls={checkFdaRecalls}
              />
            </TabsContent>
            <TabsContent value="conversions"><ConversionAnalyticsTab /></TabsContent>
            <TabsContent value="leads"><AdminLeadsTab /></TabsContent>
            <TabsContent value="push"><PushNotificationAdmin /></TabsContent>
            <TabsContent value="email"><EmailManagementTab /></TabsContent>
            <TabsContent value="klaviyo"><KlaviyoIntegrationCard /></TabsContent>
            <TabsContent value="users"><AdminUsersTab /></TabsContent>
            <TabsContent value="scans"><AdminScansTab /></TabsContent>
            <TabsContent value="analytics"><AdminAnalyticsTab /></TabsContent>
          </Tabs>
        </div>

        {/* Mobile Content */}
        {isMobile && (
          <div className="space-y-4">
            {renderActiveContent()}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Admin;
