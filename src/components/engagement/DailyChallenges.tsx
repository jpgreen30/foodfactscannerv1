import { motion } from 'framer-motion';
import { 
  Scan, Search, Heart, AlertTriangle, Users, Flame, 
  CheckCircle2, Trophy, Sparkles 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useDailyChallenges, Challenge } from '@/hooks/useDailyChallenges';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, React.ElementType> = {
  Scan: Scan,
  Search: Search,
  Heart: Heart,
  AlertTriangle: AlertTriangle,
  Users: Users,
  Flame: Flame,
};

function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const Icon = iconMap[challenge.icon] || Scan;
  const progress = Math.min((challenge.current_progress / challenge.target_count) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`relative overflow-hidden transition-all ${
        challenge.is_completed 
          ? 'border-green-500/50 bg-green-500/5' 
          : 'hover:border-primary/50'
      }`}>
        {challenge.is_completed && (
          <div className="absolute top-2 right-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </motion.div>
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              challenge.is_completed 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-primary/10 text-primary'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm">{challenge.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  +{challenge.reward_amount} pts
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {challenge.description}
              </p>
              
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-xs font-medium text-muted-foreground">
                  {challenge.current_progress}/{challenge.target_count}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DailyChallenges({ compact = false }: { compact?: boolean }) {
  const { challenges, isLoading, completedCount, totalPoints } = useDailyChallenges();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return null;
  }

  const displayChallenges = compact ? challenges.slice(0, 3) : challenges;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Daily Challenges
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {completedCount}/{challenges.length} Complete
            </Badge>
            {totalPoints > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                {totalPoints} pts earned
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {displayChallenges.map((challenge, index) => (
          <ChallengeCard 
            key={challenge.challenge_id} 
            challenge={challenge} 
            index={index} 
          />
        ))}
        
        {compact && challenges.length > 3 && (
          <p className="text-xs text-center text-muted-foreground">
            +{challenges.length - 3} more challenges
          </p>
        )}
      </CardContent>
    </Card>
  );
}
