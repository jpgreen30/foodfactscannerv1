import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MonetizationState {
  subscriptionStatus: string;
  subscriptionTier: string;
  trialStatus: 'active' | 'expired' | 'converted';
  trialEndsAt: Date | null;
  totalScansUsed: number;
  highIntentUser: boolean;
  highRiskFlag: boolean;
  isUnlimited: boolean;
  isBlocked: boolean;
  loading: boolean;
}

export function useMonetization() {
  const { user } = useAuth();
  const [state, setState] = useState<MonetizationState>({
    subscriptionStatus: 'free_trial',
    subscriptionTier: 'free',
    trialStatus: 'active',
    trialEndsAt: null,
    totalScansUsed: 0,
    highIntentUser: false,
    highRiskFlag: false,
    isUnlimited: false,
    isBlocked: false,
    loading: true,
  });

  const fetchState = useCallback(async () => {
    if (!user) return;
    
    // Demo user: unlimited scans, no DB calls
    if (user.id === 'demo-user-123') {
      setState({
        subscriptionStatus: 'free_trial',
        subscriptionTier: 'free',
        trialStatus: 'active',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        totalScansUsed: 0,
        highIntentUser: true,
        highRiskFlag: false,
        isUnlimited: true,
        isBlocked: false,
        loading: false,
      });
      return;
    }
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_tier, total_scans_used, trial_status, trial_expires_at, high_intent_user, high_risk_flag')
        .eq('id', user.id)
        .single();

      if (data) {
        const tier = (data as any).subscription_tier || 'free';
        const subStatus = (data as any).subscription_status || 'free_trial';
        const trialStatus = (data as any).trial_status || 'active';
        const trialExpiresAt = (data as any).trial_expires_at ? new Date((data as any).trial_expires_at) : null;
        const isUnlimited = tier === 'premium' || tier === 'annual';
        const trialExpired = trialExpiresAt ? new Date() > trialExpiresAt : false;
        const isFree = tier === 'free';
        
        setState({
          subscriptionStatus: subStatus,
          subscriptionTier: tier,
          trialStatus: trialExpired ? 'expired' : (trialStatus as 'active' | 'expired' | 'converted'),
          trialEndsAt: trialExpiresAt,
          totalScansUsed: (data as any).total_scans_used ?? 0,
          highIntentUser: (data as any).high_intent_user ?? false,
          highRiskFlag: (data as any).high_risk_flag ?? false,
          isUnlimited,
          isFreeTrial: isFree && trialStatus === 'active',
          isBlocked: isFree && trialExpired,
          loading: false,
        });
      }
    } catch (err) {
      console.error('[useMonetization] Error:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const recordScan = useCallback(async (scanData: {
    barcode?: string;
    product_name: string;
    risk_level: string;
    heavy_metals_avoid?: boolean;
    health_score?: number;
  }) => {
    if (!user) return null;

    // Demo mode: skip DB writes
    if (user.id === 'demo-user-123') {
      console.log('[Demo] Scan recorded locally (no DB write)');
      await fetchState();
      return { demo: true };
    }

    try {
      const { data, error } = await supabase.functions.invoke('on-scan-completed', {
        body: scanData,
      });

      if (error) {
        console.error('[useMonetization] recordScan error:', error);
        return null;
      }

      // Refresh state after scan
      await fetchState();
      return data;
    } catch (err) {
      console.error('[useMonetization] recordScan error:', err);
      return null;
    }
  }, [user, fetchState]);

  const recordUpgrade = useCallback(async (newTier: string, previousTier?: string) => {
    if (!user) return null;

    // Demo mode: skip upgrade recording
    if (user.id === 'demo-user-123') {
      console.log('[Demo] Upgrade recorded locally (no DB write)');
      await fetchState();
      return { demo: true };
    }

    try {
      const { data, error } = await supabase.functions.invoke('on-subscription-upgrade', {
        body: {
          new_tier: newTier,
          previous_tier: previousTier || state.subscriptionStatus,
        },
      });

      if (error) {
        console.error('[useMonetization] recordUpgrade error:', error);
        return null;
      }

      await fetchState();
      return data;
    } catch (err) {
      console.error('[useMonetization] recordUpgrade error:', err);
      return null;
    }
  }, [user, fetchState, state.subscriptionStatus]);

  return {
    ...state,
    fetchState,
    recordScan,
    recordUpgrade,
  };
}
