import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Download, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  downloadUrl?: string;
  fileName?: string;
  source: string; // For tracking: "15-toxic-ingredients", "homemade-recipes", etc.
}

export function LeadMagnetModal({
  isOpen,
  onClose,
  title,
  description,
  downloadUrl,
  fileName = "download.pdf",
  source,
}: LeadMagnetModalProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save to email_subscribers table
      const { error: dbError } = await (supabase as any)
        .from("email_subscribers")
        .upsert({
          email: email.toLowerCase().trim(),
          first_name: firstName || null,
          source: source,
          subscribed_at: new Date().toISOString(),
          status: "active",
        }, {
          onConflict: "email",
        });

      if (dbError) {
        console.error("Error saving subscriber:", dbError);
      }

      // 2. Send welcome email with PDF via edge function
      const { error: emailError } = await supabase.functions.invoke("send-lead-magnet", {
        body: {
          email: email.toLowerCase().trim(),
          firstName: firstName || "Parent",
          leadMagnet: source,
          downloadUrl: downloadUrl,
          fileName: fileName,
        },
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        // Still show success - they can download directly
      }

      // 3. Track in analytics (if you have mixpanel/segment)
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "lead_magnet_download", {
          event_category: "engagement",
          event_label: source,
          value: 1,
        });
      }

      setIsSuccess(true);

      // Auto-open the PDF cheat sheet in a new tab on success
      if (downloadUrl) {
        setTimeout(() => window.open(downloadUrl, "_blank"), 500);
      }

      toast({
        title: "Success! Check your email",
        description: "Your free guide is on its way. The cheat sheet is opening in a new tab for you to print or save!",
      });

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 m-4">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!isSuccess ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {title}
                    </h2>
                    <p className="text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Your first name (optional)"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Get My Free Guide
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Trust badges */}
                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      100% Secure
                    </span>
                    <span>•</span>
                    <span>No spam, ever</span>
                    <span>•</span>
                    <span>Unsubscribe anytime</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-safe/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-safe" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Check Your Inbox!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Your <strong>{title}</strong> has been sent to <strong>{email}</strong>.
                      <br /><br />
                      Can't find it? Check your spam folder or download below:
                    </p>
                    
                    {downloadUrl && (
                      <Button onClick={handleDownload} className="gap-2" size="lg">
                        <Download className="w-4 h-4" />
                        Download Now
                      </Button>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      While you're here, why not scan your baby's food?
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-2" 
                      onClick={() => {
                        onClose();
                        window.location.href = "/scanner";
                      }}
                    >
                      Scan Baby Food →
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for using the modal
import { useCallback } from "react";

export function useLeadMagnet() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Partial<LeadMagnetModalProps>>({});

  const openLeadMagnet = useCallback((config: Omit<LeadMagnetModalProps, "isOpen" | "onClose">) => {
    setConfig(config);
    setIsOpen(true);
  }, []);

  const closeLeadMagnet = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    openLeadMagnet,
    closeLeadMagnet,
    LeadMagnetModal: (
      <LeadMagnetModal
        isOpen={isOpen}
        onClose={closeLeadMagnet}
        {...(config as LeadMagnetModalProps)}
      />
    ),
  };
}
