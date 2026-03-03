import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { initGA, initHotjar } from "@/lib/analytics";

const CONSENT_KEY = "cookie-consent";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay before showing banner
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShowBanner(false);
    // Initialize analytics after consent
    initGA();
    initHotjar();
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="container max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl shadow-2xl p-4 md:p-6 relative">
              <button
                onClick={handleDecline}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center gap-3 text-primary">
                  <Cookie className="w-8 h-8 flex-shrink-0" />
                </div>

                <div className="flex-1 pr-6 md:pr-0">
                  <h3 className="font-bold text-foreground mb-1">We use cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to improve your experience and analyze site usage. 
                    By clicking "Accept", you consent to our use of cookies. Read our{" "}
                    <Link 
                      to="/privacy" 
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>{" "}
                    for more information.
                  </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDecline}
                    className="flex-1 md:flex-none"
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="flex-1 md:flex-none"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
