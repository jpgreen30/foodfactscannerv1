import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Challenge {
  challenge_id: string;
  challenge_type: string;
  title: string;
  description: string;
  target_count: number;
  reward_amount: number;
  icon: string;
  current_progress: number;
  is_completed: boolean;
  reward_claimed: boolean;
}

export function useDailyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    if (!user) {
      setChallenges([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_daily_challenges');
      
      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateProgress = useCallback(async (challengeType: string, increment: number = 1) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('update_challenge_progress', {
        p_challenge_type: challengeType,
        p_increment: increment
      });
      
      if (error) throw error;
      
      // Refresh challenges after update
      await fetchChallenges();
      
      return data;
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      return null;
    }
  }, [user, fetchChallenges]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const completedCount = challenges.filter(c => c.is_completed).length;
  const totalPoints = challenges
    .filter(c => c.is_completed)
    .reduce((sum, c) => sum + c.reward_amount, 0);

  return {
    challenges,
    isLoading,
    refetch: fetchChallenges,
    updateProgress,
    completedCount,
    totalPoints
  };
}
