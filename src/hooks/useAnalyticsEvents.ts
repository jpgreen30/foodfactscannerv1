import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type EventType =
  | "toxic_cta_view"
  | "toxic_cta_click"
  | "symptom_select"
  | "form_open"
  | "form_submit"
  | "lead_created"
  | "lead_distributed";

type EventCategory = "legal_consultation" | "scan" | "onboarding";

interface TrackEventParams {
  eventType: EventType;
  eventCategory: EventCategory;
  eventData?: Record<string, any>;
  scanId?: string;
  productName?: string;
}

// Generate a session ID for tracking user journeys
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

export const useAnalyticsEvents = () => {
  const { user } = useAuth();
  const trackedEvents = useRef<Set<string>>(new Set());

  const trackEvent = useCallback(async ({
    eventType,
    eventCategory,
    eventData = {},
    scanId,
    productName,
  }: TrackEventParams) => {
    try {
      // Create a unique key to prevent duplicate tracking for same event in same session
      const eventKey = `${eventType}_${scanId || ""}_${productName || ""}_${Date.now().toString().slice(0, -3)}`;
      
      // Skip if already tracked within last second
      if (trackedEvents.current.has(eventKey)) {
        return;
      }
      trackedEvents.current.add(eventKey);
      
      // Clean up old keys (keep last 100)
      if (trackedEvents.current.size > 100) {
        const keysArray = Array.from(trackedEvents.current);
        trackedEvents.current = new Set(keysArray.slice(-50));
      }

      const sessionId = getSessionId();

      await supabase.from("analytics_events").insert({
        user_id: user?.id || null,
        event_type: eventType,
        event_category: eventCategory,
        event_data: eventData,
        session_id: sessionId,
        scan_id: scanId || null,
        product_name: productName || null,
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.error("[Analytics] Track event error:", error);
    }
  }, [user?.id]);

  const trackCTAView = useCallback((productName: string, scanId?: string, healthScore?: number) => {
    trackEvent({
      eventType: "toxic_cta_view",
      eventCategory: "legal_consultation",
      eventData: { healthScore },
      scanId,
      productName,
    });
  }, [trackEvent]);

  const trackCTAClick = useCallback((productName: string, scanId?: string, symptomsCount?: number) => {
    trackEvent({
      eventType: "toxic_cta_click",
      eventCategory: "legal_consultation",
      eventData: { symptomsCount },
      scanId,
      productName,
    });
  }, [trackEvent]);

  const trackSymptomSelect = useCallback((symptom: string, productName?: string, scanId?: string) => {
    trackEvent({
      eventType: "symptom_select",
      eventCategory: "legal_consultation",
      eventData: { symptom },
      scanId,
      productName,
    });
  }, [trackEvent]);

  const trackFormOpen = useCallback((productName: string, scanId?: string) => {
    trackEvent({
      eventType: "form_open",
      eventCategory: "legal_consultation",
      scanId,
      productName,
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((productName: string, scanId?: string, symptomsCount?: number, qualityScore?: number) => {
    trackEvent({
      eventType: "form_submit",
      eventCategory: "legal_consultation",
      eventData: { symptomsCount, qualityScore },
      scanId,
      productName,
    });
  }, [trackEvent]);

  const trackLeadCreated = useCallback((leadId: string, productName: string, qualityScore?: number) => {
    trackEvent({
      eventType: "lead_created",
      eventCategory: "legal_consultation",
      eventData: { leadId, qualityScore },
      productName,
    });
  }, [trackEvent]);

  const trackLeadDistributed = useCallback((leadId: string, firmName: string) => {
    trackEvent({
      eventType: "lead_distributed",
      eventCategory: "legal_consultation",
      eventData: { leadId, firmName },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackCTAView,
    trackCTAClick,
    trackSymptomSelect,
    trackFormOpen,
    trackFormSubmit,
    trackLeadCreated,
    trackLeadDistributed,
  };
};
