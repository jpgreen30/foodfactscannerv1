import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard, LeaderboardEntry } from '@/hooks/useLeaderboard';

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
}

function getRankColor(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30';
    default:
      return '';
  }
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const initials = entry.display_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
        entry.is_current_user 
          ? 'bg-primary/10 border border-primary/30' 
          : getRankColor(entry.rank)
      }`}
    >
      <div className="w-8 flex justify-center">
        {getRankIcon(entry.rank)}
      </div>
      
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs bg-primary/20">
          {entry.is_current_user ? <User className="h-4 w-4" /> : initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          entry.is_current_user ? 'text-primary' : ''
        }`}>
          {entry.is_current_user ? 'You' : entry.display_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.total_scans} scans • {entry.streak_days} day streak
        </p>
      </div>
      
      <div className="text-right">
        <Badge variant="secondary" className="font-bold">
          {entry.points.toLocaleString()} pts
        </Badge>
      </div>
    </motion.div>
  );
}

export function WeeklyLeaderboard({ compact = false }: { compact?: boolean }) {
  const { entries, isLoading, userRank } = useLeaderboard(compact ? 5 : 10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Weekly Leaderboard
          </CardTitle>
          {userRank && userRank > 10 && (
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Your rank: #{userRank}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Compete with other health-conscious scanners
        </p>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No leaderboard data yet</p>
            <p className="text-xs">Start scanning to climb the ranks!</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <LeaderboardRow key={entry.user_id} entry={entry} index={index} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
