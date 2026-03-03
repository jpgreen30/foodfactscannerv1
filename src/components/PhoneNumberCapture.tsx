import { useState } from "react";
import { Phone, Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { triggerPhoneNumberWebhook } from "@/services/zapierIntegration";

export const PhoneNumberCapture = () => {
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to receive recall alerts.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const phoneNumber = `+1${digits}`;
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          phone_number: phoneNumber,
          wants_recall_sms: true 
        })
        .eq("id", user.id);

      if (error) throw error;

      // Trigger Zapier webhook for phone number submission
      triggerPhoneNumberWebhook({
        user_id: user.id,
        phone_number: phoneNumber,
        wants_recall_sms: true,
        phone_verified: false,
        notification_types: ["recall_alerts"],
      }).catch(webhookError => {
        console.error('[Zapier] Phone webhook error:', webhookError);
      });

      setIsSubscribed(true);
      toast({
        title: "You're Subscribed!",
        description: "You'll receive SMS alerts for product recalls.",
      });
    } catch (error) {
      console.error("Error saving phone:", error);
      toast({
        title: "Error",
        description: "Could not save your phone number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-safe/10 border border-safe/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-safe/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-safe" />
          </div>
          <div>
            <p className="font-semibold text-safe">Subscribed to Recall Alerts</p>
            <p className="text-sm text-muted-foreground">We'll text you about dangerous product recalls.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">Get Recall Alerts via SMS</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to know when products you've scanned are recalled.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={handlePhoneChange}
            className="pl-10"
            maxLength={14}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground">
        Standard message rates apply. Text STOP to unsubscribe anytime.
      </p>
    </motion.div>
  );
};