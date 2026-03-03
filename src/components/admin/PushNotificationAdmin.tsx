import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Send,
  Smartphone,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  Scale,
} from "lucide-react";
import { triggerPushNotificationWebhook, triggerDeviceRegisteredWebhook } from "@/services/zapierIntegration";

interface DeviceStats {
  total: number;
  ios: number;
  android: number;
  web: number;
}

interface NotificationStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
}

export const PushNotificationAdmin = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSendingLegalReminders, setIsSendingLegalReminders] = useState(false);
  
  // Stats
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ total: 0, ios: 0, android: 0, web: 0 });
  const [notificationStats, setNotificationStats] = useState<NotificationStats>({
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    open_rate: 0,
    click_rate: 0,
  });
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  
  // Form
  const [notificationType, setNotificationType] = useState<string>("dangerous_product");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [targetAudience, setTargetAudience] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDeviceStats(),
        loadNotificationStats(),
        loadRecentNotifications(),
      ]);
    } catch (error) {
      console.error("Error loading push notification data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeviceStats = async () => {
    const { data, error } = await supabase
      .from("device_tokens")
      .select("platform")
      .eq("is_active", true);

    if (error) {
      console.error("Error loading device stats:", error);
      return;
    }

    const stats: DeviceStats = { total: 0, ios: 0, android: 0, web: 0 };
    data?.forEach((device) => {
      stats.total++;
      if (device.platform === "ios") stats.ios++;
      else if (device.platform === "android") stats.android++;
      else if (device.platform === "web") stats.web++;
    });

    setDeviceStats(stats);
  };

  const loadNotificationStats = async () => {
    const { data, error } = await supabase
      .from("notification_history")
      .select("status, opened_at, clicked_at");

    if (error) {
      console.error("Error loading notification stats:", error);
      return;
    }

    const total_sent = data?.filter(n => n.status === "sent").length || 0;
    const total_opened = data?.filter(n => n.opened_at).length || 0;
    const total_clicked = data?.filter(n => n.clicked_at).length || 0;

    setNotificationStats({
      total_sent,
      total_opened,
      total_clicked,
      open_rate: total_sent > 0 ? Math.round((total_opened / total_sent) * 100) : 0,
      click_rate: total_sent > 0 ? Math.round((total_clicked / total_sent) * 100) : 0,
    });
  };

  const loadRecentNotifications = async () => {
    const { data, error } = await supabase
      .from("notification_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading recent notifications:", error);
      return;
    }

    setRecentNotifications(data || []);
  };

  const sendBroadcastNotification = async () => {
    if (!notificationTitle || !notificationBody) {
      toast({
        title: "Missing Information",
        description: "Please enter both title and message.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Get all users with active device tokens
      const { data: devices, error: devicesError } = await supabase
        .from("device_tokens")
        .select("user_id")
        .eq("is_active", true);

      if (devicesError) throw devicesError;

      // Get unique user IDs
      const uniqueUserIds = [...new Set(devices?.map(d => d.user_id) || [])];

      if (uniqueUserIds.length === 0) {
        toast({
          title: "No Devices",
          description: "There are no active devices to send notifications to.",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      // Send notification to each user
      let successCount = 0;
      let failCount = 0;

      for (const userId of uniqueUserIds) {
        const { error } = await supabase.functions.invoke("send-push-notification", {
          body: {
            userId,
            title: notificationTitle,
            body: notificationBody,
            type: notificationType,
          },
        });

        if (error) {
          failCount++;
          console.error(`Failed to send to ${userId}:`, error);
        } else {
          successCount++;
        }
      }

      // Trigger Zapier webhook
      triggerPushNotificationWebhook({
        type: notificationType,
        title: notificationTitle,
        body: notificationBody,
        target_audience: targetAudience,
        users_targeted: uniqueUserIds.length,
        success_count: successCount,
        fail_count: failCount,
      }).catch(err => console.error("[Zapier] Push notification webhook error:", err));

      toast({
        title: "Broadcast Sent",
        description: `Sent to ${successCount} users. ${failCount > 0 ? `${failCount} failed.` : ""}`,
      });

      // Clear form and reload data
      setNotificationTitle("");
      setNotificationBody("");
      await loadData();
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast({
        title: "Error",
        description: "Failed to send broadcast notification.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendLegalReminders = async (dryRun = false) => {
    setIsSendingLegalReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-legal-reminders', {
        body: { dryRun },
      });

      if (error) throw error;

      toast({
        title: dryRun ? "Dry Run Complete" : "Legal Reminders Sent",
        description: `${data.sent} notification(s) ${dryRun ? 'would be' : 'were'} sent. ${data.already_consulted} users already consulted.`,
      });

      if (!dryRun) {
        await loadData();
      }

      console.log('[Legal Reminders] Result:', data);
    } catch (error) {
      console.error('Error sending legal reminders:', error);
      toast({
        title: "Error",
        description: "Failed to send legal reminders.",
        variant: "destructive",
      });
    } finally {
      setIsSendingLegalReminders(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    subValue,
    color = "primary" 
  }: { 
    icon: any; 
    label: string; 
    value: string | number; 
    subValue?: string;
    color?: string;
  }) => (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Smartphone} label="Active Devices" value={deviceStats.total} subValue={`iOS: ${deviceStats.ios} | Android: ${deviceStats.android} | Web: ${deviceStats.web}`} />
        <StatCard icon={Send} label="Notifications Sent" value={notificationStats.total_sent} />
        <StatCard icon={Eye} label="Open Rate" value={`${notificationStats.open_rate}%`} subValue={`${notificationStats.total_opened} opened`} color="safe" />
        <StatCard icon={MousePointerClick} label="Click Rate" value={`${notificationStats.click_rate}%`} subValue={`${notificationStats.total_clicked} clicked`} color="primary" />
      </div>

      {/* Send Broadcast Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Send Broadcast Notification
          </CardTitle>
          <CardDescription>
            Send a push notification to all users with active devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dangerous_product">⚠️ Dangerous Product Alert</SelectItem>
                  <SelectItem value="recall">🚨 Recall Alert</SelectItem>
                  <SelectItem value="health_tip">💡 Health Tip</SelectItem>
                  <SelectItem value="weekly_report">📊 Weekly Report</SelectItem>
                  <SelectItem value="daily_summary">📋 Daily Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="premium">Premium Subscribers</SelectItem>
                  <SelectItem value="free">Free Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="Notification title..."
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Notification message..."
              value={notificationBody}
              onChange={(e) => setNotificationBody(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={sendBroadcastNotification}
              disabled={isSending || !notificationTitle || !notificationBody}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Broadcast
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              Will be sent to {deviceStats.total} device(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Legal Reminders Card */}
      <Card className="border-caution/30 bg-gradient-to-br from-caution/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-caution" />
            Legal Consultation Reminders
          </CardTitle>
          <CardDescription>
            Send push notifications to users with toxic scans who haven't consulted an attorney yet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground">
              This will identify users who have scanned products with toxic ingredients (high/moderate risk) 
              but haven't submitted a legal consultation request. Notifications encourage them to visit the Legal Help page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => sendLegalReminders(true)}
              disabled={isSendingLegalReminders}
              className="gap-2"
            >
              {isSendingLegalReminders ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Dry Run (Preview)
            </Button>
            <Button
              onClick={() => sendLegalReminders(false)}
              disabled={isSendingLegalReminders}
              className="gap-2 bg-caution hover:bg-caution/90 text-black"
            >
              {isSendingLegalReminders ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Legal Reminders
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Notifications
            </span>
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No notifications sent yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {notification.notification_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.status === "sent" ? (
                      <CheckCircle2 className="w-5 h-5 text-safe" />
                    ) : notification.status === "failed" ? (
                      <XCircle className="w-5 h-5 text-danger" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-warning animate-spin" />
                    )}
                    {notification.opened_at && (
                      <Badge variant="secondary" className="text-xs">
                        Opened
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationAdmin;
