import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalScans: number;
  lastScanDate: string | null;
  badges: string[];
}

interface UseStreakReturn {
  streak: StreakData | null;
  isLoading: boolean;
  updateStreak: () => Promise<{ isNewStreak: boolean; currentStreak: number } | null>;
  refetch: () => Promise<void>;
}

export const useStreak = (): UseStreakReturn => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setStreak(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_user_streak");
      
      if (error) {
        console.error("Error fetching streak:", error);
        setStreak(null);
      } else if (data && data.length > 0) {
        const row = data[0];
        setStreak({
          currentStreak: row.current_streak || 0,
          longestStreak: row.longest_streak || 0,
          totalScans: row.total_scans || 0,
          lastScanDate: row.last_scan_date,
          badges: (row.badges as string[]) || [],
        });
      } else {
        // No streak data yet, initialize with defaults
        setStreak({
          currentStreak: 0,
          longestStreak: 0,
          totalScans: 0,
          lastScanDate: null,
          badges: [],
        });
      }
    } catch (err) {
      console.error("Error fetching streak:", err);
      setStreak(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateStreak = useCallback(async (): Promise<{ isNewStreak: boolean; currentStreak: number } | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("update_user_streak");
      
      if (error) {
        console.error("Error updating streak:", error);
        return null;
      }

      if (data) {
        const result = data as {
          current_streak: number;
          longest_streak: number;
          total_scans: number;
          last_scan_date: string;
          is_new_streak: boolean;
        };

        setStreak(prev => ({
          currentStreak: result.current_streak,
          longestStreak: result.longest_streak,
          totalScans: result.total_scans,
          lastScanDate: result.last_scan_date,
          badges: prev?.badges || [],
        }));

        return {
          isNewStreak: result.is_new_streak,
          currentStreak: result.current_streak,
        };
      }
      return null;
    } catch (err) {
      console.error("Error updating streak:", err);
      return null;
    }
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak,
    isLoading,
    updateStreak,
    refetch: fetchStreak,
  };
};
