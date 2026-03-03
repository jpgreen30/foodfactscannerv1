import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initGA, initHotjar, trackPageView, hasConsent } from "@/lib/analytics";

const CONSENT_KEY = "cookie-consent";

export const useAnalytics = () => {
  const location = useLocation();

  // Initialize analytics when consent is given
  useEffect(() => {
    if (hasConsent()) {
      initGA();
      initHotjar();
    }

    // Listen for consent changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY && e.newValue === "accepted") {
        initGA();
        initHotjar();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (hasConsent()) {
      trackPageView(location.pathname + location.search);
    }
  }, [location]);
};

export default useAnalytics;
