import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { HelpTooltip } from "@/components/HelpTooltip";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAvailableEventTypes, ZapierEventType } from "@/services/zapierIntegration";
import { 
  Webhook, 
  Save, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Shield,
  Zap,
  ExternalLink,
  TestTube,
  Code,
  FileJson,
  Copy,
  Check,
  BookOpen,
  ChevronDown
} from "lucide-react";

interface ZapierIntegrationCardProps {
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export const ZapierIntegrationCard = ({
  webhookUrl,
  setWebhookUrl,
  isSaving,
  onSave,
}: ZapierIntegrationCardProps) => {
  const { toast } = useToast();
  const [enabledEvents, setEnabledEvents] = useState<ZapierEventType[]>(["user_signup"]);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedEvent, setCopiedEvent] = useState<string | null>(null);
  const [lastWebhookCall, setLastWebhookCall] = useState<{
    event: string;
    timestamp: string;
    success: boolean;
  } | null>(null);

  const eventTypes = getAvailableEventTypes();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["zapier_enabled_events", "zapier_privacy_mode", "zapier_last_webhook_call"]);

    if (settings) {
      const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
      
      if (settingsMap["zapier_enabled_events"]) {
        try {
          setEnabledEvents(JSON.parse(settingsMap["zapier_enabled_events"]));
        } catch (e) {
          console.error("Error parsing enabled events:", e);
        }
      }
      
      if (settingsMap["zapier_privacy_mode"]) {
        setPrivacyMode(settingsMap["zapier_privacy_mode"] === "true");
      }

      if (settingsMap["zapier_last_webhook_call"]) {
        try {
          setLastWebhookCall(JSON.parse(settingsMap["zapier_last_webhook_call"]));
        } catch (e) {
          console.error("Error parsing last webhook call:", e);
        }
      }
    }
  };

  const toggleEvent = async (eventType: ZapierEventType) => {
    const newEvents = enabledEvents.includes(eventType)
      ? enabledEvents.filter(e => e !== eventType)
      : [...enabledEvents, eventType];
    
    setEnabledEvents(newEvents);
    
    await supabase
      .from("app_settings")
      .upsert({
        key: "zapier_enabled_events",
        value: JSON.stringify(newEvents),
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
  };

  const togglePrivacyMode = async () => {
    const newValue = !privacyMode;
    setPrivacyMode(newValue);
    
    await supabase
      .from("app_settings")
      .upsert({
        key: "zapier_privacy_mode",
        value: String(newValue),
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Missing Webhook URL",
        description: "Please enter your webhook URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-zapier-webhook", {
        body: {
          event: "custom",
          data: {
            custom_event_name: "test_connection",
            message: "This is a test from your Food Scanner app",
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Test Successful",
          description: "Your webhook is working correctly!",
        });
        loadSettings();
      } else {
        toast({
          title: "Test Result",
          description: data?.message || "Webhook may not be configured correctly.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Test webhook error:", err);
      toast({
        title: "Test Failed",
        description: "Could not reach the webhook. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyEventSchema = (event: typeof eventTypes[0]) => {
    const schema = {
      event_type: event.type,
      timestamp: new Date().toISOString(),
      source: "food_scanner_app",
      data: event.dataFields.reduce((acc, field) => {
        acc[field] = `<${field}>`;
        return acc;
      }, {} as Record<string, string>),
    };
    
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopiedEvent(event.type);
    setTimeout(() => setCopiedEvent(null), 2000);
    
    toast({
      title: "Schema Copied",
      description: `${event.name} schema copied to clipboard.`,
    });
  };

  const enabledCount = enabledEvents.length;
  const totalEvents = eventTypes.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-primary" />
          Automation Integration
          <Badge variant="secondary" className="ml-auto">
            <Zap className="w-3 h-3 mr-1" />
            {enabledCount}/{totalEvents} Active
          </Badge>
        </CardTitle>
        <CardDescription>
          Connect to Zapier, Make.com, or any webhook to automate workflows with HubSpot, Mailchimp, Salesforce, Blaze AI, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Tabs */}
        <Tabs defaultValue="zapier" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="zapier" className="gap-2">
              <Zap className="w-4 h-4" />
              Zapier
            </TabsTrigger>
            <TabsTrigger value="make" className="gap-2">
              <Webhook className="w-4 h-4" />
              Make.com
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="zapier" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-sm mb-2">Zapier Quick Setup</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Create a new Zap in Zapier</li>
                <li>Choose "Webhooks by Zapier" as the trigger</li>
                <li>Select "Catch Hook" and copy the webhook URL</li>
                <li>Paste the URL below and save</li>
                <li>Enable the events you want to trigger automations</li>
                <li>Connect actions like HubSpot, Mailchimp, or Blaze AI</li>
              </ol>
              <a 
                href="https://zapier.com/apps/webhook/integrations" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 mt-2 text-xs"
              >
                Open Zapier Webhooks
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </TabsContent>
          
          <TabsContent value="make" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <h4 className="font-medium text-sm mb-2">Make.com Quick Setup</h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Create a new Scenario in Make.com</li>
                <li>Add a "Webhooks" module → "Custom webhook"</li>
                <li>Copy the webhook URL provided by Make</li>
                <li>Paste the URL below and save</li>
                <li>Click "Test" to send sample data to Make</li>
                <li>Make will detect your data structure automatically</li>
              </ol>
              <a 
                href="https://www.make.com/en/integrations/webhooks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline inline-flex items-center gap-1 mt-2 text-xs"
              >
                Open Make.com Webhooks
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recommended Zaps & HubSpot Setup Guide */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm flex-1">Recommended Zaps & HubSpot Setup</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            {/* Recommended Zaps */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <h4 className="font-medium text-sm">Recommended Zaps</h4>
              {[
                { trigger: 'New User Signup', action: 'HubSpot: Create/Update Contact', icon: '👤' },
                { trigger: 'Product Scan', action: 'Google Sheets: Log scan data', icon: '📊' },
                { trigger: 'Subscription Upgrade', action: 'Slack: Post notification', icon: '🎉' },
                { trigger: 'Recall Alert', action: 'Email: Forward to team', icon: '🚨' },
              ].map(zap => (
                <div key={zap.trigger} className="flex items-center gap-2 p-2 rounded bg-background border text-xs">
                  <span>{zap.icon}</span>
                  <span className="font-medium">{zap.trigger}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-muted-foreground">{zap.action}</span>
                </div>
              ))}
            </div>

            {/* HubSpot Setup Guide */}
            <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-orange-500 text-white flex items-center justify-center text-xs font-bold">H</span>
                HubSpot Setup via Zapier
              </h4>
              <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                <li>In Zapier: Create new Zap → Trigger = <strong>"Webhooks by Zapier"</strong> → <strong>"Catch Hook"</strong></li>
                <li>Copy the webhook URL and paste it in the <strong>Webhook URL</strong> field below</li>
                <li>Click <strong>"Test"</strong> to send sample data so Zapier detects the schema</li>
                <li>Add Action: Search <strong>"HubSpot"</strong> → <strong>"Create or Update Contact"</strong></li>
                <li>Map fields:
                  <div className="mt-1 ml-4 space-y-1">
                    <div><code className="bg-muted px-1 rounded">email</code> → Email</div>
                    <div><code className="bg-muted px-1 rounded">first_name</code> → First Name</div>
                    <div><code className="bg-muted px-1 rounded">subscription_tier</code> → Custom Property</div>
                    <div><code className="bg-muted px-1 rounded">total_scans</code> → Custom Property</div>
                  </div>
                </li>
                <li>For scan events: Create another Zap with Action <strong>"Create Engagement"</strong> or <strong>"Add Contact to List"</strong></li>
                <li>Turn on the Zap — contacts will sync automatically!</li>
              </ol>
              <a 
                href="https://zapier.com/apps/hubspot/integrations/webhook" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline inline-flex items-center gap-1 text-xs"
              >
                Zapier + HubSpot Templates
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Webhook URL */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Webhook URL</label>
            <HelpTooltip content="Paste the URL from Zapier's 'Webhooks by Zapier' trigger (Catch Hook) or Make.com's Custom Webhook module." />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="https://hooks.zapier.com/... or https://hook.eu1.make.com/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={onSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
            <Button 
              onClick={testWebhook} 
              disabled={isTesting || !webhookUrl}
              variant="outline"
              size="sm"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-1" />
                  Test
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Last Webhook Call Status */}
        {lastWebhookCall && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {lastWebhookCall.success ? (
              <CheckCircle2 className="w-4 h-4 text-safe" />
            ) : (
              <XCircle className="w-4 h-4 text-danger" />
            )}
            <span className="text-sm">
              Last call: <strong>{lastWebhookCall.event}</strong> at{" "}
              {new Date(lastWebhookCall.timestamp).toLocaleString()}
            </span>
          </div>
        )}

        <Separator />

        {/* Privacy Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-medium">Privacy Mode</span>
              <HelpTooltip content="When enabled, emails are masked (j***@example.com) and phone numbers are partially hidden before sending to external services." />
            </div>
            <p className="text-sm text-muted-foreground">
              Mask emails and phone numbers before sending to webhooks
            </p>
          </div>
          <Switch checked={privacyMode} onCheckedChange={togglePrivacyMode} />
        </div>

        <Separator />

        {/* Event Types with Data Schema */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Enabled Events</label>
              <HelpTooltip content="Only enabled events fire webhooks. Disable events you don't need to reduce API calls and noise in your automation tools." />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileJson className="w-4 h-4" />
                  View Data Schema
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Event Data Schema
                  </DialogTitle>
                  <DialogDescription>
                    Copy the JSON schema for each event type to configure your automation
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4">
                    {eventTypes.map((event) => (
                      <div key={event.type} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{event.name}</h4>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyEventSchema(event)}
                            className="gap-2"
                          >
                            {copiedEvent === event.type ? (
                              <>
                                <Check className="w-4 h-4 text-safe" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto">
                          <div className="text-muted-foreground mb-1">// Available fields:</div>
                          {event.dataFields.map((field, i) => (
                            <div key={field} className="text-foreground">
                              {field}{i < event.dataFields.length - 1 ? ',' : ''}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.platforms.map((platform) => (
                            <Badge key={platform} variant="outline" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-3">
              {eventTypes.map((event) => (
                <motion.div
                  key={event.type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{event.name}</span>
                      {enabledEvents.includes(event.type) && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs bg-muted/50">
                        {event.dataFields.length} fields
                      </Badge>
                      {event.platforms.slice(0, 3).map((platform) => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                      {event.platforms.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{event.platforms.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={enabledEvents.includes(event.type)}
                    onCheckedChange={() => toggleEvent(event.type)}
                  />
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
