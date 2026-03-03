import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, X, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PushNotificationPromptProps {
  onClose?: () => void;
  trigger?: "immediate" | "after-scan";
}

export const PushNotificationPrompt = ({ onClose, trigger = "immediate" }: PushNotificationPromptProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    // Check if notifications are supported
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }

    // Check if already subscribed
    if (Notification.permission === "granted") {
      setIsSubscribed(true);
      return;
    }

    // Check if already denied
    if (Notification.permission === "denied") {
      return;
    }

    // For after-scan trigger, only show on first scan ever
    if (trigger === "after-scan") {
      const hasShownFirstScanPrompt = localStorage.getItem("push-first-scan-prompt-shown");
      if (hasShownFirstScanPrompt) {
        return; // Already shown on first scan, never show again
      }
      // Mark as shown and display after delay
      localStorage.setItem("push-first-scan-prompt-shown", "true");
      setTimeout(() => setShowPrompt(true), 1500);
      return;
    }

    // For immediate trigger, check if user dismissed prompt recently
    const dismissed = localStorage.getItem("push-prompt-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) {
      // Don't show for 3 days after dismissal
      return;
    }

    // Show prompt after a delay (after user has had a chance to use the app)
    setTimeout(() => setShowPrompt(true), 2000);
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setIsSubscribed(true);
        
        // Register for push notifications
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.ready;
          
          // Subscribe to push notifications
          const subscription = await (registration as any).pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              // This is a placeholder - in production, you'd use a real VAPID public key
              "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
            ),
          });

          // Save subscription to backend if user is logged in
          if (user) {
            await saveSubscription(subscription);
          }
        }

        // Update notification preferences
        if (user) {
          await supabase
            .from("notification_preferences")
            .upsert({
              user_id: user.id,
              recall_alerts: true,
              dangerous_product_alerts: true,
            }, { onConflict: "user_id" });
        }

        toast({
          title: "Notifications Enabled!",
          description: "You'll receive alerts about product recalls and dangers.",
        });

        setShowPrompt(false);
        onClose?.();
      } else {
        toast({
          title: "Permission Denied",
          description: "You can enable notifications later in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Could not enable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      await supabase.functions.invoke("register-push-token", {
        body: {
          token: JSON.stringify(subscription),
          platform: "web",
          deviceName: navigator.userAgent.includes("Mobile") ? "Mobile Browser" : "Desktop Browser",
        },
      });
    } catch (error) {
      console.error("Error saving push subscription:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("push-prompt-dismissed", Date.now().toString());
    onClose?.();
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!showPrompt || isSubscribed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-gradient-to-br from-caution/20 via-danger/10 to-transparent border border-caution/30 rounded-2xl p-5 shadow-lg"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-caution to-danger rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-caution/30">
                <BellRing className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Stay Protected!</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant alerts about recalled products
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0 -mt-1 -mr-1">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-danger" />
              <span>FDA recall alerts for products you've scanned</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-caution" />
              <span>Dangerous ingredient warnings</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-safe" />
              <span>Never miss a food safety update</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={requestPermission}
              disabled={isRequesting}
              className="flex-1 gap-2 bg-caution hover:bg-caution/90 text-foreground"
            >
              <Bell className="w-4 h-4" />
              {isRequesting ? "Enabling..." : "Enable Alerts"}
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="px-4">
              Later
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
