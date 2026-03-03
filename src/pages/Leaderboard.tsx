import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Users, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/AppLayout';
import { WeeklyLeaderboard } from '@/components/engagement/WeeklyLeaderboard';
import { DailyChallenges } from '@/components/engagement/DailyChallenges';
import { ReferralCard } from '@/components/engagement/ReferralCard';
import { useAuth } from '@/contexts/AuthContext';

export default function Leaderboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <AppLayout className="bg-background">
        <div className="py-12 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Join the Competition</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to track your progress and compete with others
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout className="bg-background">
      <Helmet>
        <title>Baby Food Safety Leaderboard & Challenges | FoodFactScanner®</title>
        <meta name="description" content="Compete with other parents on the FoodFactScanner® leaderboard. Complete daily baby food safety challenges, earn rewards, and become a top food safety advocate for your family." />
        <meta name="keywords" content="baby food safety leaderboard, food safety challenges, baby food scanner rewards, parent food safety community" />
        <link rel="canonical" href="https://foodfactscanner.com/leaderboard" />
        <meta property="og:url" content="https://foodfactscanner.com/leaderboard" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Challenges & Rewards</h1>
            <p className="text-sm text-muted-foreground">
              Complete challenges and climb the leaderboard
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="challenges" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges" className="gap-1">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-1">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-4">
            <DailyChallenges />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <WeeklyLeaderboard />
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <ReferralCard />
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
