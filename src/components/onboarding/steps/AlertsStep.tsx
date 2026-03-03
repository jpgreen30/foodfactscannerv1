import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Bell, Phone, Shield, AlertTriangle, Zap, Lock, MessageSquare } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AlertsStepProps {
  data: {
    phone: string;
    smsConsent: boolean;
    legalConsent: boolean;
    pushEnabled: boolean;
  };
  onChange: (updates: Partial<AlertsStepProps["data"]>) => void;
}

export const AlertsStep = ({ data, onChange }: AlertsStepProps) => {
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({ phone: formatted });
  };

  const requestPushNotifications = async () => {
    setIsRequestingPush(true);
    
    try {
      // Check if we're on a native platform
      if (Capacitor.isNativePlatform()) {
        const permResult = await PushNotifications.requestPermissions();
        
        if (permResult.receive === "granted") {
          await PushNotifications.register();
          onChange({ pushEnabled: true });
          toast({
            title: "Push Notifications Enabled!",
            description: "You'll receive instant alerts about FDA recalls.",
          });
        } else {
          toast({
            title: "Permission Denied",
            description: "You can enable notifications later in Settings.",
            variant: "destructive",
          });
        }
      } else {
        // Web push notifications
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          
          if (permission === "granted") {
            onChange({ pushEnabled: true });
            
            // Try to register with service worker
            if ("serviceWorker" in navigator && "PushManager" in window) {
              const registration = await navigator.serviceWorker.ready;
              const subscription = await (registration as any).pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: undefined, // Would need VAPID key
              }).catch(() => null);
              
              if (subscription) {
                // Save subscription to backend
                await supabase.functions.invoke("register-push-token", {
                  body: {
                    token: JSON.stringify(subscription),
                    platform: "web",
                    deviceName: navigator.userAgent,
                  },
                });
              }
            }
            
            toast({
              title: "Push Notifications Enabled!",
              description: "You'll receive instant alerts about FDA recalls.",
            });
          } else {
            toast({
              title: "Permission Denied",
              description: "You can enable notifications later in Settings.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Not Supported",
            description: "Your browser doesn't support push notifications.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Push notification error:", error);
      toast({
        title: "Error",
        description: "Could not enable push notifications. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPush(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with urgency */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-danger/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-danger animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-danger rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">
          🚨 Emergency Recall Line
        </h2>
        <p className="text-muted-foreground text-sm">
          The FDA is too slow. Get alerted <span className="text-danger font-semibold">BEFORE</span> it's on the news.
        </p>
      </motion.div>

      {/* Why this matters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-danger/10 border border-danger/30 rounded-xl p-4 space-y-2"
      >
        <div className="flex items-center gap-2 text-danger font-medium">
          <AlertTriangle className="w-4 h-4" />
          <span>Instant alerts when:</span>
        </div>
        <ul className="text-sm text-foreground/80 space-y-1.5 pl-6">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-danger rounded-full" />
            Products you've scanned are recalled
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-danger rounded-full" />
            Dangerous contamination is discovered
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-danger rounded-full" />
            Legal compensation may be available
          </li>
        </ul>
      </motion.div>

      {/* Phone Number Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4 text-danger" />
            Your Phone Number
          </label>
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={data.phone}
            onChange={handlePhoneChange}
            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-lg h-12"
            maxLength={14}
          />
        </div>

        {/* SMS Consent */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            id="smsConsent"
            checked={data.smsConsent}
            onCheckedChange={(checked) => onChange({ smsConsent: checked as boolean })}
            className="mt-0.5 border-muted-foreground data-[state=checked]:bg-danger data-[state=checked]:border-danger"
          />
          <label htmlFor="smsConsent" className="text-sm text-foreground/80 cursor-pointer">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              Text me FDA recall alerts
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              Msg & data rates may apply. Reply STOP to unsubscribe.
            </span>
          </label>
        </div>

        {/* Legal Consent */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            id="legalConsent"
            checked={data.legalConsent}
            onCheckedChange={(checked) => onChange({ legalConsent: checked as boolean })}
            className="mt-0.5 border-muted-foreground data-[state=checked]:bg-danger data-[state=checked]:border-danger"
          />
          <label htmlFor="legalConsent" className="text-sm text-foreground/80 cursor-pointer">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Shield className="w-3.5 h-3.5" />
              Contact me about legal options
            </span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              If products I scan have caused harm, a lawyer may reach out.
            </span>
          </label>
        </div>
      </motion.div>

      {/* Push Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={requestPushNotifications}
          disabled={isRequestingPush || data.pushEnabled}
          className={`w-full h-12 gap-2 ${
            data.pushEnabled 
              ? "bg-safe hover:bg-safe/90 text-white" 
              : "bg-muted hover:bg-muted/80 text-foreground border border-border"
          }`}
        >
          <Bell className={`w-5 h-5 ${data.pushEnabled ? "" : "animate-pulse"}`} />
          {isRequestingPush 
            ? "Enabling..." 
            : data.pushEnabled 
              ? "✓ Push Notifications Enabled" 
              : "Enable Push Notifications"
          }
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Get instant alerts even when the app is closed
        </p>
      </motion.div>

      {/* Security Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Your information is encrypted and protected</span>
      </motion.div>
    </div>
  );
};
