import { createContext, useContext, useState, ReactNode } from "react";
import { SubscriptionTier } from "@/lib/subscriptionUtils";

interface DebugContextType {
  tierOverride: SubscriptionTier | null;
  setTierOverride: (tier: SubscriptionTier | null) => void;
  getEffectiveTier: (actualTier: string | null | undefined) => string | null;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider = ({ children }: { children: ReactNode }) => {
  const [tierOverride, setTierOverride] = useState<SubscriptionTier | null>(null);

  // Only apply override in development mode
  const getEffectiveTier = (actualTier: string | null | undefined): string | null => {
    if (import.meta.env.DEV && tierOverride) {
      return tierOverride;
    }
    return actualTier || null;
  };

  return (
    <DebugContext.Provider value={{ tierOverride, setTierOverride, getEffectiveTier }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    // Return a no-op implementation if used outside provider (production safety)
    return {
      tierOverride: null,
      setTierOverride: () => {},
      getEffectiveTier: (actualTier: string | null | undefined) => actualTier || null,
    };
  }
  return context;
};
