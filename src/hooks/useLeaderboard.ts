import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  points: number;
  total_scans: number;
  streak_days: number;
  is_current_user: boolean;
}

export function useLeaderboard(limit: number = 10) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_weekly_leaderboard', {
        p_limit: limit
      });
      
      if (error) throw error;
      
      const typedData = (data || []) as LeaderboardEntry[];
      setEntries(typedData);
      
      // Find current user's rank
      const currentUserEntry = typedData.find(e => e.is_current_user);
      setUserRank(currentUserEntry ? currentUserEntry.rank : null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const updateOnScan = useCallback(async (healthScore: number) => {
    if (!user) return;

    try {
      await supabase.rpc('update_leaderboard_on_scan', {
        p_health_score: healthScore
      });
      await fetchLeaderboard();
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }, [user, fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    isLoading,
    userRank,
    refetch: fetchLeaderboard,
    updateOnScan
  };
}
