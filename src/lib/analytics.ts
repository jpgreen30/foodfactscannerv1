// Google Analytics 4 Configuration
export const GA_MEASUREMENT_ID = "G-MW7WLZ9NW7";

// Hotjar Configuration
export const HOTJAR_SITE_ID = 6569882;
export const HOTJAR_VERSION = 6;

const CONSENT_KEY = "cookie-consent";

// Check if user has accepted cookies
export const hasConsent = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "accepted";
};

// Initialize Google Analytics
export const initGA = (): void => {
  if (!hasConsent() || !GA_MEASUREMENT_ID) {
    return;
  }

  // Check if already initialized
  if (window.gtag) return;

  // Load gtag.js script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    cookie_flags: "SameSite=None;Secure",
  });
};

// Track page views
export const trackPageView = (url: string): void => {
  if (!hasConsent() || !window.gtag) return;
  
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
): void => {
  if (!hasConsent() || !window.gtag) return;
  
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// ============================================
// Predefined Event Tracking Functions
// ============================================

// Auth Events
export const trackSignUp = (method: string = "email"): void => {
  trackEvent("sign_up", "auth", method);
};

export const trackLogin = (method: string = "email"): void => {
  trackEvent("login", "auth", method);
};

// Scan Events
export const trackScan = (scanType: "barcode" | "label" | "upload", productName?: string): void => {
  trackEvent("scan", "engagement", scanType);
  if (productName) {
    trackEvent("product_scanned", "engagement", productName);
  }
};

export const trackScanResult = (healthScore: number, verdict: string): void => {
  trackEvent("scan_result", "engagement", verdict, healthScore);
};

// Subscription Events
export const trackSubscriptionView = (tier: string): void => {
  trackEvent("view_subscription", "monetization", tier);
};

export const trackSubscriptionStart = (tier: string, price: number): void => {
  trackEvent("begin_checkout", "monetization", tier, price);
  // Also track as GA4 ecommerce event
  if (hasConsent() && window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency: "USD",
      value: price,
      items: [{ item_name: tier, price: price }],
    });
  }
};

export const trackSubscriptionComplete = (tier: string, price: number): void => {
  trackEvent("purchase", "monetization", tier, price);
  // Also track as GA4 ecommerce event
  if (hasConsent() && window.gtag) {
    window.gtag("event", "purchase", {
      currency: "USD",
      value: price,
      items: [{ item_name: tier, price: price }],
    });
  }
};

// Feature Usage Events
export const trackFeatureUse = (feature: string): void => {
  trackEvent("feature_use", "engagement", feature);
};

// Legal Lead Events
export const trackLegalCTAView = (): void => {
  trackEvent("legal_cta_view", "conversion");
};

export const trackLegalCTAClick = (): void => {
  trackEvent("legal_cta_click", "conversion");
};

export const trackLegalLeadSubmit = (): void => {
  trackEvent("legal_lead_submit", "conversion");
};

// Initialize Hotjar
export const initHotjar = (): void => {
  if (!hasConsent() || !HOTJAR_SITE_ID) {
    return;
  }

  // Check if already initialized
  if (window.hj) return;

  // Hotjar tracking code
  (function(h: Window, o: Document, t: string, j: string) {
    h.hj = h.hj || function(...args: unknown[]) {
      (h.hj.q = h.hj.q || []).push(args);
    };
    h._hjSettings = { hjid: HOTJAR_SITE_ID, hjsv: HOTJAR_VERSION };
    const a = o.getElementsByTagName('head')[0];
    const r = o.createElement('script');
    r.async = true;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
};

// Declare global types for gtag and Hotjar
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    hj: ((...args: unknown[]) => void) & { q?: unknown[] };
    _hjSettings: { hjid: number; hjsv: number };
  }
}
