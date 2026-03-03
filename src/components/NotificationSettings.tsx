import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, 
  BellOff, 
  Phone, 
  Moon, 
  Loader2,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Heart,
  Check,
  Mail,
  Volume2,
  VolumeX,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  initializePushNotifications, 
  getNotificationPreferences, 
  updateNotificationPreferences,
  sendTestNotification,
  type NotificationPreferences 
} from "@/services/pushNotifications";
import { isNativePlatform } from "@/services/nativeCapabilities";
import { isSoundEnabled, setSoundEnabled, playDangerAlert } from "@/services/alertSounds";

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSending, setIsTestingSending] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailRecallAlerts, setEmailRecallAlerts] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  
  // SMS recall alerts state
  const [smsRecallAlerts, setSmsRecallAlerts] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [isSavingSms, setIsSavingSms] = useState(false);
  
  // Alert sounds state
  const [alertSoundsEnabled, setAlertSoundsEnabled] = useState(true);
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    scanAlerts: true,
    recallAlerts: true,
    dangerousProductAlerts: true,
    dailySummary: false,
    weeklyReport: true,
    healthTips: false,
    socialNotifications: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
      
      // Load alert sounds preference
      setAlertSoundsEnabled(isSoundEnabled());

      // Load email recall preferences and SMS preferences from profile
      if (user?.id) {
        const { data: emailPrefs } = await supabase
          .from('notification_preferences')
          .select('email_recall_alerts, user_email')
          .eq('user_id', user.id)
          .single();
        
        if (emailPrefs) {
          setEmailRecallAlerts(emailPrefs.email_recall_alerts || false);
          setUserEmail(emailPrefs.user_email || user.email || "");
        } else {
          setUserEmail(user.email || "");
        }

        // Load SMS preferences from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, wants_recall_sms')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserPhone(profile.phone_number || "");
          setSmsRecallAlerts(profile.wants_recall_sms || false);
        }
      }

      // Check if push is available
      if (isNativePlatform()) {
        // On native, check if we have permission
        const { data } = await supabase
          .from('device_tokens')
          .select('id')
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .limit(1);
        
        setPushEnabled(data && data.length > 0);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnablePush = async () => {
    if (!isNativePlatform()) {
      toast({
        title: "Not Available",
        description: "Push notifications are only available on mobile devices. Install the app from App Store or Google Play.",
      });
      return;
    }

    try {
      const token = await initializePushNotifications();
      if (token) {
        setPushEnabled(true);
        toast({
          title: "Push Enabled",
          description: "You'll now receive notifications on this device.",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your device settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error enabling push:", error);
      toast({
        title: "Error",
        description: "Could not enable push notifications.",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    setIsSaving(true);
    try {
      const success = await updateNotificationPreferences({ [key]: value });
      if (!success) {
        // Revert on failure
        setPreferences(preferences);
        toast({
          title: "Error",
          description: "Could not save preference.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTestingSending(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        toast({
          title: "Test Sent",
          description: "Check your device for the test notification.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: "Could not send test notification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsTestingSending(false);
    }
  };

  const handleSaveEmailPreferences = async () => {
    if (!user?.id) return;
    
    if (emailRecallAlerts && !userEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive recall alerts.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingEmail(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email_recall_alerts: emailRecallAlerts,
          user_email: userEmail,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Email Preferences Saved",
        description: emailRecallAlerts 
          ? "You'll receive FDA recall alerts at your email." 
          : "Email recall alerts disabled.",
      });
    } catch (error) {
      console.error("Error saving email preferences:", error);
      toast({
        title: "Error",
        description: "Could not save email preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSaveSmsPreferences = async () => {
    if (!user?.id) return;
    
    if (smsRecallAlerts && !userPhone) {
      toast({
        title: "Phone Number Required",
        description: "Please add your phone number in Profile settings to receive SMS alerts.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingSms(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          wants_recall_sms: smsRecallAlerts,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "SMS Preferences Saved",
        description: smsRecallAlerts 
          ? "You'll receive FDA recall alerts via SMS." 
          : "SMS recall alerts disabled.",
      });
    } catch (error) {
      console.error("Error saving SMS preferences:", error);
      toast({
        title: "Error",
        description: "Could not save SMS preferences.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSms(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const notificationTypes = [
    {
      key: "recallAlerts" as const,
      label: "Recall Alerts",
      description: "Get notified when products you've scanned are recalled",
      icon: AlertTriangle,
      iconColor: "text-danger",
      priority: true,
    },
    {
      key: "dangerousProductAlerts" as const,
      label: "Dangerous Product Alerts",
      description: "Alerts for high-risk ingredients detected",
      icon: AlertTriangle,
      iconColor: "text-caution",
      priority: true,
    },
    {
      key: "socialNotifications" as const,
      label: "Community Notifications",
      description: "Likes, comments, and replies on your posts",
      icon: Users,
      iconColor: "text-primary",
    },
    {
      key: "scanAlerts" as const,
      label: "Scan Summaries",
      description: "Summary after each scan",
      icon: MessageSquare,
      iconColor: "text-primary",
    },
    {
      key: "dailySummary" as const,
      label: "Daily Digest",
      description: "Daily summary of your food safety",
      icon: Calendar,
      iconColor: "text-primary",
    },
    {
      key: "weeklyReport" as const,
      label: "Weekly Report",
      description: "Weekly health and scanning insights",
      icon: Calendar,
      iconColor: "text-safe",
    },
    {
      key: "healthTips" as const,
      label: "Health Tips",
      description: "Personalized nutrition tips",
      icon: Heart,
      iconColor: "text-primary",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Push Notification Enable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive real-time alerts on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pushEnabled ? (
            <div className="flex items-center gap-3 p-3 bg-safe/10 rounded-lg border border-safe/30">
              <Check className="w-5 h-5 text-safe" />
              <div>
                <p className="font-medium text-safe">Push Notifications Enabled</p>
                <p className="text-sm text-muted-foreground">You'll receive alerts on this device</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <BellOff className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications Disabled</p>
                  <p className="text-sm text-muted-foreground">
                    {isNativePlatform() 
                      ? "Enable to receive important alerts" 
                      : "Install the app on your phone to get push notifications"}
                  </p>
                </div>
              </div>
              {isNativePlatform() && (
                <Button onClick={handleEnablePush} className="w-full">
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Push Notifications
                </Button>
              )}
            </div>
          )}

          {pushEnabled && (
            <Button 
              variant="outline" 
              onClick={handleSendTest}
              disabled={isTestingSending}
              className="w-full"
            >
              {isTestingSending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Send Test Notification
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Toxic Alert Sounds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {alertSoundsEnabled ? (
              <Volume2 className="w-5 h-5 text-danger" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
            Toxic Ingredient Alert Sounds
          </CardTitle>
          <CardDescription>
            Play an alarm sound when dangerous ingredients are detected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <div>
                <p className="font-medium text-sm">Enable Alert Sounds</p>
                <p className="text-xs text-muted-foreground">
                  Plays when toxic or concerning ingredients are found
                </p>
              </div>
            </div>
            <Switch
              checked={alertSoundsEnabled}
              onCheckedChange={(checked) => {
                setAlertSoundsEnabled(checked);
                setSoundEnabled(checked);
                if (checked) {
                  playDangerAlert();
                }
                toast({
                  title: checked ? "Alert Sounds Enabled" : "Alert Sounds Disabled",
                  description: checked 
                    ? "You'll hear an alarm when toxic ingredients are detected"
                    : "Alert sounds have been muted",
                });
              }}
            />
          </div>
          
          {alertSoundsEnabled && (
            <Button 
              variant="outline" 
              onClick={() => playDangerAlert()}
              className="w-full gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Preview Alert Sound
            </Button>
          )}
        </CardContent>
      </Card>

      {/* SMS Recall Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            SMS Recall Alerts
          </CardTitle>
          <CardDescription>
            Get text message alerts when products you've scanned are recalled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Enable SMS Recall Alerts</p>
                <p className="text-xs text-muted-foreground">
                  {userPhone ? `Alerts will be sent to ${userPhone}` : "Add phone in Profile settings"}
                </p>
              </div>
            </div>
            <Switch
              checked={smsRecallAlerts}
              onCheckedChange={setSmsRecallAlerts}
              disabled={!userPhone}
            />
          </div>

          {!userPhone && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                No phone number on file. <a href="/profile" className="text-primary underline">Add one in your Profile</a> to receive SMS alerts.
              </p>
            </div>
          )}

          {userPhone && (
            <Button 
              onClick={handleSaveSmsPreferences}
              disabled={isSavingSms}
              className="w-full"
              variant={smsRecallAlerts ? "default" : "outline"}
            >
              {isSavingSms ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Phone className="w-4 h-4 mr-2" />
              )}
              Save SMS Preferences
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Email Recall Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-danger" />
            FDA Recall Email Alerts
          </CardTitle>
          <CardDescription>
            Get email notifications when products you've scanned are recalled by the FDA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <div>
                <p className="font-medium text-sm">Enable Email Recall Alerts</p>
                <p className="text-xs text-muted-foreground">
                  {emailRecallAlerts && userEmail ? `Alerts sent to ${userEmail}` : "Receive critical safety notifications"}
                </p>
              </div>
            </div>
            <Switch
              checked={emailRecallAlerts}
              onCheckedChange={async (checked) => {
                setEmailRecallAlerts(checked);
                // Auto-save when toggling - use auth email if no email set
                const emailToUse = userEmail || user?.email || "";
                if (checked && !userEmail && user?.email) {
                  setUserEmail(user.email);
                }
                if (user?.id) {
                  setIsSavingEmail(true);
                  try {
                    await supabase
                      .from('notification_preferences')
                      .upsert({
                        user_id: user.id,
                        email_recall_alerts: checked,
                        user_email: checked ? (emailToUse || null) : userEmail,
                      }, { onConflict: 'user_id' });
                    toast({
                      title: checked ? "Email Alerts Enabled" : "Email Alerts Disabled",
                      description: checked 
                        ? `FDA recall alerts will be sent to ${emailToUse || 'your email'}` 
                        : "You won't receive FDA recall emails",
                    });
                  } catch (error) {
                    console.error("Error saving email preferences:", error);
                    setEmailRecallAlerts(!checked); // Revert
                  } finally {
                    setIsSavingEmail(false);
                  }
                }
              }}
            />
          </div>

          {emailRecallAlerts && !userEmail && (
            <div className="p-3 bg-caution/10 border border-caution/30 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-caution shrink-0" />
              <p className="text-sm text-caution">
                No email set. Add your email below to receive alerts.
              </p>
            </div>
          )}

          {emailRecallAlerts && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSaveEmailPreferences}
                disabled={isSavingEmail || !userEmail}
                className="w-full"
              >
                {isSavingEmail ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {userEmail ? "Update Email" : "Save Email"}
              </Button>
            </div>
          )}

          {emailRecallAlerts && userEmail && (
            <div className="flex items-center gap-2 p-2 bg-safe/10 rounded-lg">
              <Check className="w-4 h-4 text-safe" />
              <p className="text-sm text-safe">You'll receive FDA recall alerts at {userEmail}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div 
              key={type.key}
              className={`flex items-center justify-between p-3 rounded-lg ${
                type.priority ? 'bg-danger/5 border border-danger/20' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <type.icon className={`w-5 h-5 ${type.iconColor}`} />
                <div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              </div>
              <Switch
                checked={preferences[type.key]}
                onCheckedChange={(checked) => handleToggle(type.key, checked)}
                disabled={isSaving}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Enable Quiet Hours</p>
                <p className="text-xs text-muted-foreground">
                  {preferences.quietHoursStart} - {preferences.quietHoursEnd}
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => handleToggle("quietHoursEnabled", checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};