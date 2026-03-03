import { AppLayout } from "@/components/AppLayout";
import { NotificationSettings } from "@/components/NotificationSettings";
import { PushNotificationTest } from "@/components/PushNotificationTest";
import { BabyFoodRecallAlerts } from "@/components/BabyFoodRecallAlerts";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, FlaskConical, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <AppLayout className="bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="gap-2 -ml-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Notification Settings
        </h1>
        <p className="text-muted-foreground">
          Configure how and when you receive alerts about food safety
        </p>
      </motion.div>

      <Tabs defaultValue="settings" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="baby" className="gap-2">
            <Baby className="h-4 w-4" />
            Baby Alerts
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="mt-4">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="baby" className="mt-4">
          <BabyFoodRecallAlerts />
        </TabsContent>
        <TabsContent value="test" className="mt-4">
          <PushNotificationTest />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Notifications;