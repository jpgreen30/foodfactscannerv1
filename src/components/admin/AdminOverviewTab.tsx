import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ZapierIntegrationCard } from "./ZapierIntegrationCard";
import { 
  Users, 
  ScanLine, 
  Crown, 
  Phone, 
  TrendingUp, 
  Loader2,
  AlertTriangle,
  Send,
  RefreshCw,
  Mail
} from "lucide-react";
import { Card as RecallCard, CardContent as RecallCardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Analytics {
  total_users: number;
  users_today: number;
  users_this_week: number;
  total_scans: number;
  scans_today: number;
  paid_subscribers: number;
  sms_subscribers: number;
}

interface AdminOverviewTabProps {
  analytics: Analytics | null;
  zapierWebhookUrl: string;
  setZapierWebhookUrl: (url: string) => void;
  isSavingWebhook: boolean;
  saveWebhookUrl: () => void;
  recallProductName: string;
  setRecallProductName: (name: string) => void;
  recallBrand: string;
  setRecallBrand: (brand: string) => void;
  recallReason: string;
  setRecallReason: (reason: string) => void;
  recallAction: string;
  setRecallAction: (action: string) => void;
  isSendingRecall: boolean;
  sendRecallAlert: () => void;
  isCheckingFdaRecalls?: boolean;
  checkFdaRecalls?: () => void;
}

export const AdminOverviewTab = ({
  analytics,
  zapierWebhookUrl,
  setZapierWebhookUrl,
  isSavingWebhook,
  saveWebhookUrl,
  recallProductName,
  setRecallProductName,
  recallBrand,
  setRecallBrand,
  recallReason,
  setRecallReason,
  recallAction,
  setRecallAction,
  isSendingRecall,
  sendRecallAlert,
  isCheckingFdaRecalls,
  checkFdaRecalls,
}: AdminOverviewTabProps) => {
  const statCards = [
    { 
      title: "Total Users", 
      value: analytics?.total_users || 0, 
      icon: Users, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Users Today", 
      value: analytics?.users_today || 0, 
      icon: TrendingUp, 
      color: "text-safe",
      bgColor: "bg-safe/10"
    },
    { 
      title: "Users This Week", 
      value: analytics?.users_this_week || 0, 
      icon: Users, 
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      title: "Total Scans", 
      value: analytics?.total_scans || 0, 
      icon: ScanLine, 
      color: "text-caution",
      bgColor: "bg-caution/10"
    },
    { 
      title: "Scans Today", 
      value: analytics?.scans_today || 0, 
      icon: ScanLine, 
      color: "text-caution",
      bgColor: "bg-caution/10"
    },
    { 
      title: "Paid Subscribers", 
      value: analytics?.paid_subscribers || 0, 
      icon: Crown, 
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    { 
      title: "SMS Subscribers", 
      value: analytics?.sms_subscribers || 0, 
      icon: Phone, 
      color: "text-safe",
      bgColor: "bg-safe/10"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Zapier Integration - Enhanced Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ZapierIntegrationCard
          webhookUrl={zapierWebhookUrl}
          setWebhookUrl={setZapierWebhookUrl}
          isSaving={isSavingWebhook}
          onSave={saveWebhookUrl}
        />
      </motion.div>

      {/* FDA Recall Check */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <RecallCard className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <RefreshCw className="w-5 h-5" />
              FDA Recall Sync
            </CardTitle>
            <CardDescription>
              Check the FDA database for new food recalls and automatically notify users who have scanned affected products via email.
            </CardDescription>
          </CardHeader>
          <RecallCardContent>
            <Button 
              onClick={checkFdaRecalls} 
              disabled={isCheckingFdaRecalls}
              className="w-full"
              variant="outline"
            >
              {isCheckingFdaRecalls ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Check FDA for New Recalls & Notify Users
            </Button>
          </RecallCardContent>
        </RecallCard>
      </motion.div>

      {/* Manual Recall Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <RecallCard className="border-danger/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-5 h-5" />
              Manual Recall Alert
            </CardTitle>
            <CardDescription>
              Manually notify users about a product recall. This triggers push notifications and Zapier webhooks.
            </CardDescription>
          </CardHeader>
          <RecallCardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Product Name"
                value={recallProductName}
                onChange={(e) => setRecallProductName(e.target.value)}
              />
              <Input
                placeholder="Brand"
                value={recallBrand}
                onChange={(e) => setRecallBrand(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="Recall Reason (e.g., Potential contamination with Salmonella)"
              value={recallReason}
              onChange={(e) => setRecallReason(e.target.value)}
              rows={2}
            />
            <Textarea
              placeholder="Recommended Action (e.g., Stop consumption and return to store for refund)"
              value={recallAction}
              onChange={(e) => setRecallAction(e.target.value)}
              rows={2}
            />
            <Button 
              onClick={sendRecallAlert} 
              disabled={isSendingRecall}
              className="w-full bg-danger hover:bg-danger/90"
            >
              {isSendingRecall ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Recall Alert to Affected Users
            </Button>
          </RecallCardContent>
        </RecallCard>
      </motion.div>
    </div>
  );
};
