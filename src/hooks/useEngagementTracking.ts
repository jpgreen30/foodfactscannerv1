import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useEngagementTracking() {
  const { user } = useAuth();
  const { toast } = useToast();

  const trackScan = useCallback(async (healthScore: number) => {
    if (!user) return;

    try {
      // Update leaderboard
      await supabase.rpc('update_leaderboard_on_scan', {
        p_health_score: healthScore
      });

      // Update scan count challenges
      const scanResult = await supabase.rpc('update_challenge_progress', {
        p_challenge_type: 'scan_count',
        p_increment: 1
      });

      // Check for high score challenge
      if (healthScore >= 80) {
        await supabase.rpc('update_challenge_progress', {
          p_challenge_type: 'high_score',
          p_increment: 1
        });
      }

      // Check for danger detection challenge
      if (healthScore < 40) {
        await supabase.rpc('update_challenge_progress', {
          p_challenge_type: 'low_score',
          p_increment: 1
        });
      }

      // Check if any challenge was just completed
      if (scanResult.data) {
        const results = scanResult.data as unknown as Array<{
          challenge_id: string;
          new_progress: number;
          target: number;
          just_completed: boolean;
        }>;

        const justCompleted = results.filter(r => r.just_completed);
        if (justCompleted.length > 0) {
          toast({
            title: '🎉 Challenge Complete!',
            description: `You completed a daily challenge and earned points!`,
          });
        }
      }
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  }, [user, toast]);

  const trackCommunityPost = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.rpc('update_challenge_progress', {
        p_challenge_type: 'community',
        p_increment: 1
      });
    } catch (error) {
      console.error('Error tracking community post:', error);
    }
  }, [user]);

  const trackStreakMaintained = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.rpc('update_challenge_progress', {
        p_challenge_type: 'streak',
        p_increment: 1
      });
    } catch (error) {
      console.error('Error tracking streak:', error);
    }
  }, [user]);

  return {
    trackScan,
    trackCommunityPost,
    trackStreakMaintained
  };
}
