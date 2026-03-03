import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Share2, Users, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useReferral } from '@/hooks/useReferral';
import { Skeleton } from '@/components/ui/skeleton';

const rewards = [
  { count: 1, reward: '5 bonus scans', icon: '🎁' },
  { count: 5, reward: 'Community Builder badge', icon: '🏆' },
  { count: 10, reward: '1 month Premium free', icon: '👑' },
];

export function ReferralCard() {
  const { referralCode, referralCount, shareUrl, isLoading } = useReferral();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share it with friends to earn rewards',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Failed to copy',
        description: 'Please try again',
      });
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Label Lens',
          text: 'Scan food products to protect your family from harmful ingredients!',
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const nextReward = rewards.find(r => r.count > referralCount) || rewards[rewards.length - 1];

  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
      
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Invite Friends
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Earn rewards for every friend who joins
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Referral Stats */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{referralCount}</p>
              <p className="text-xs text-muted-foreground">Friends invited</p>
            </div>
          </div>
          
          {referralCount > 0 && (
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              {referralCount * 5} bonus scans earned
            </Badge>
          )}
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Your referral link
          </label>
          <div className="flex gap-2">
            <Input 
              value={shareUrl || ''} 
              readOnly 
              className="text-xs font-mono"
            />
            <Button 
              size="icon" 
              variant="outline" 
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button onClick={handleShare} className="w-full gap-2">
          <Share2 className="h-4 w-4" />
          Share with Friends
        </Button>

        {/* Reward Progress */}
        <div className="pt-2 border-t">
          <p className="text-xs font-medium mb-2">Next reward</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/20"
          >
            <span className="text-2xl">{nextReward.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{nextReward.reward}</p>
              <p className="text-xs text-muted-foreground">
                {Math.max(0, nextReward.count - referralCount)} more invite{nextReward.count - referralCount !== 1 ? 's' : ''} to go
              </p>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
