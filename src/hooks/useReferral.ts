import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useReferral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralCode = useCallback(async () => {
    if (!user) {
      setReferralCode(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_or_create_referral_code');
      
      if (error) throw error;
      setReferralCode(data);

      // Get referral count
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);
      
      setReferralCount(count || 0);
    } catch (error) {
      console.error('Error fetching referral code:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReferralCode();
  }, [fetchReferralCode]);

  const shareUrl = referralCode 
    ? `${window.location.origin}?ref=${referralCode}` 
    : null;

  return {
    referralCode,
    referralCount,
    shareUrl,
    isLoading,
    refetch: fetchReferralCode
  };
}
