import { useState, useEffect } from "react";
import { motion } from "framer-motion";
export type KlaviyoEventType = 
  | 'account_created'
  | 'product_scanned'
  | 'subscription_upgraded'
  | 'recall_alert_received'
  | 'symptom_reported'
  | 'profile_updated'
  | 'legal_optin'
  | 'low_credit'
  | 'upgrade_required';

import { 
  Music2,
  Save, 
  TestTube, 
  RefreshCw, 
  Check, 
  X, 
  ListPlus,
  Zap,
  Users,
  Bell,
  MessageSquare,
  Baby,
  Loader2,
  ExternalLink,
  Copy,
  Scale,
  BookOpen,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clearKlaviyoSettingsCache, type EnrichedProfileData } from "@/services/klaviyoIntegration";

interface KlaviyoList {
  id: string;
  name: string;
}

const eventTypes: { type: KlaviyoEventType; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    type: 'account_created', 
    label: 'Account Created', 
    description: 'Triggered when a new user signs up',
    icon: <Users className="w-4 h-4" />
  },
  { 
    type: 'product_scanned', 
    label: 'Product Scanned', 
    description: 'Triggered when user scans a product',
    icon: <Zap className="w-4 h-4" />
  },
  { 
    type: 'subscription_upgraded', 
    label: 'Subscription Upgraded', 
    description: 'Triggered when user upgrades their plan',
    icon: <Check className="w-4 h-4" />
  },
  { 
    type: 'recall_alert_received', 
    label: 'Recall Alert Received', 
    description: 'Triggered when user receives a recall alert',
    icon: <Bell className="w-4 h-4" />
  },
  { 
    type: 'symptom_reported', 
    label: 'Symptom Reported', 
    description: 'Triggered when user reports a health symptom',
    icon: <MessageSquare className="w-4 h-4" />
  },
  { 
    type: 'profile_updated', 
    label: 'Profile Updated', 
    description: 'Triggered when user updates their profile',
    icon: <Baby className="w-4 h-4" />
  },
  { 
    type: 'legal_optin', 
    label: 'Legal Opt-in', 
    description: 'Triggered when user opts into legal consultation',
    icon: <Scale className="w-4 h-4" />
  },
  { 
    type: 'low_credit', 
    label: 'Low Credit', 
    description: 'Triggered when user has 1 scan credit remaining',
    icon: <Bell className="w-4 h-4" />
  },
  { 
    type: 'upgrade_required', 
    label: 'Upgrade Required', 
    description: 'Triggered when user has 0 scans left',
    icon: <Zap className="w-4 h-4" />
  },
];

export function KlaviyoIntegrationCard() {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [enabledEvents, setEnabledEvents] = useState<KlaviyoEventType[]>([]);
  const [isSendingTestEvents, setIsSendingTestEvents] = useState(false);
  const [lists, setLists] = useState<KlaviyoList[]>([]);
  const [listMappings, setListMappings] = useState<Record<string, string>>({
    all_users: '',
    premium_subscribers: '',
    recall_alerts: '',
    sms_subscribers: '',
    parents: '',
    legal_optins: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: enabledData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "klaviyo_enabled")
        .maybeSingle();

      const { data: eventsData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "klaviyo_enabled_events")
        .maybeSingle();

      const { data: listsData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "klaviyo_lists")
        .maybeSingle();

      const { data: lastSyncData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "klaviyo_last_sync")
        .maybeSingle();

      setIsEnabled(enabledData?.value === 'true');
      setEnabledEvents(eventsData?.value ? JSON.parse(eventsData.value) : []);
      setListMappings(listsData?.value ? JSON.parse(listsData.value) : {
        all_users: '',
        premium_subscribers: '',
        recall_alerts: '',
        sms_subscribers: '',
        parents: '',
        legal_optins: '',
      });
      setLastSyncAt(lastSyncData?.value || null);
    } catch (error) {
      console.error("Error loading Klaviyo settings:", error);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("klaviyo-sync", {
        body: { action: "test" },
      });

      if (error || !data?.success) {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: data?.error || error?.message || "Could not connect to Klaviyo",
          variant: "destructive",
        });
      } else {
        setConnectionStatus('connected');
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Klaviyo API",
        });
        // Load lists after successful connection
        fetchLists();
      }
    } catch (err) {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Failed to test Klaviyo connection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const fetchLists = async () => {
    setIsLoadingLists(true);
    try {
      const { data, error } = await supabase.functions.invoke("klaviyo-sync", {
        body: { action: "get_lists" },
      });

      if (error || !data?.success) {
        toast({
          title: "Error",
          description: "Could not fetch Klaviyo lists",
          variant: "destructive",
        });
      } else {
        setLists(data.lists || []);
      }
    } catch (err) {
      console.error("Error fetching lists:", err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        supabase.from("app_settings").upsert({
          key: "klaviyo_enabled",
          value: String(isEnabled),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" }),
        
        supabase.from("app_settings").upsert({
          key: "klaviyo_enabled_events",
          value: JSON.stringify(enabledEvents),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" }),
        
        supabase.from("app_settings").upsert({
          key: "klaviyo_lists",
          value: JSON.stringify(listMappings),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" }),
      ]);

      clearKlaviyoSettingsCache();

      toast({
        title: "Settings Saved",
        description: "Klaviyo integration settings have been saved",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEvent = (eventType: KlaviyoEventType) => {
    setEnabledEvents(prev => 
      prev.includes(eventType)
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    );
  };

  const bulkSync = async () => {
    setIsSyncing(true);
    setSyncProgress("Fetching user profiles...");
    
    try {
      // Fetch all user profiles with full data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id, email, first_name, last_name, display_name, phone_number,
          is_pregnant, is_nursing, is_new_mom, due_date, baby_count, feeding_stage, baby_ages,
          pregnancy_stage, baby_age_months, parenting_concerns,
          subscription_tier, subscription_expires_at, subscription_status, created_at,
          is_diabetic, is_gluten_free, is_dairy_free, is_vegan, is_heart_healthy,
          has_allergies, allergies_detailed, allergy_notes, health_conditions, medications,
          has_weight_loss_goal, has_hypertension, has_high_cholesterol, has_kidney_disease,
          has_ibs, has_thyroid_condition, has_gout, has_autoimmune, has_celiac_disease,
          has_gerd, has_osteoporosis, has_liver_disease, is_cancer_survivor,
          diet_type, dietary_goals, age_group,
          cooking_skill_level, max_prep_time_mins, daily_calorie_target, daily_protein_target, budget_preference,
          trial_status, trial_expired, scan_credits_remaining, high_intent_user, high_risk_flag,
          onboarding_completed, wants_recall_sms, total_scans_used, last_scan_timestamp
        `)
        .not("email", "is", null);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "No Users",
          description: "No users found to sync",
        });
        setSyncProgress(null);
        return;
      }

      setSyncProgress(`Fetching scan history for ${profiles.length} users...`);

      // Fetch scan stats for all users
      const { data: allScans } = await supabase
        .from("scan_history")
        .select("user_id, product_name, health_score, created_at")
        .order("created_at", { ascending: false });

      setSyncProgress("Fetching legal lead data...");

      // Fetch legal leads
      const { data: legalLeads } = await supabase
        .from("legal_leads")
        .select("user_id, consent_given, consultation_requested");

      setSyncProgress("Fetching device tokens...");

      // Fetch device tokens
      const { data: deviceTokens } = await supabase
        .from("device_tokens")
        .select("user_id, platform, is_active")
        .eq("is_active", true);

      setSyncProgress("Building enriched profiles...");

      // Group data by user
      const scansByUser = new Map<string, typeof allScans>();
      allScans?.forEach(scan => {
        const scans = scansByUser.get(scan.user_id) || [];
        scans.push(scan);
        scansByUser.set(scan.user_id, scans);
      });

      const legalByUser = new Map<string, typeof legalLeads extends (infer T)[] ? T : never>();
      legalLeads?.forEach(lead => {
        if (lead.user_id) legalByUser.set(lead.user_id, lead);
      });

      const deviceByUser = new Map<string, typeof deviceTokens extends (infer T)[] ? T : never>();
      deviceTokens?.forEach(token => {
        deviceByUser.set(token.user_id, token);
      });

      // Build enriched profiles
      const enrichedProfiles: EnrichedProfileData[] = profiles.map(p => {
        const userScans = scansByUser.get(p.id) || [];
        const totalScans = userScans.length;
        const avgHealthScore = totalScans > 0 
          ? Math.round(userScans.reduce((sum, s) => sum + (s.health_score || 0), 0) / totalScans)
          : undefined;
        const lastScanDate = userScans[0]?.created_at;
        const recentScans = userScans.slice(0, 5).map(s => ({
          product: s.product_name,
          score: s.health_score || 0,
          date: s.created_at.split('T')[0],
        }));

        const legalLead = legalByUser.get(p.id);
        const deviceToken = deviceByUser.get(p.id);

        return {
          email: p.email!,
          first_name: p.first_name || undefined,
          last_name: p.last_name || undefined,
          display_name: p.display_name || undefined,
          phone_number: p.phone_number || undefined,
          is_pregnant: p.is_pregnant || false,
          is_nursing: p.is_nursing || false,
          is_new_mom: p.is_new_mom || false,
          due_date: p.due_date || undefined,
          baby_count: p.baby_count || 0,
          feeding_stage: p.feeding_stage || undefined,
          baby_ages: p.baby_ages,
          pregnancy_stage: p.pregnancy_stage || undefined,
          baby_age_months: p.baby_age_months || undefined,
          parenting_concerns: p.parenting_concerns,
          subscription_tier: p.subscription_tier || undefined,
          subscription_expires_at: p.subscription_expires_at || undefined,
          subscription_status: p.subscription_status || undefined,
          created_at: p.created_at,
          is_diabetic: p.is_diabetic || false,
          is_gluten_free: p.is_gluten_free || false,
          is_dairy_free: p.is_dairy_free || false,
          is_vegan: p.is_vegan || false,
          is_heart_healthy: p.is_heart_healthy || false,
          has_allergies: p.has_allergies || false,
          allergies_detailed: p.allergies_detailed,
          allergy_notes: p.allergy_notes || undefined,
          health_conditions: p.health_conditions,
          medications: p.medications,
          has_weight_loss_goal: p.has_weight_loss_goal || false,
          has_hypertension: p.has_hypertension || false,
          has_high_cholesterol: p.has_high_cholesterol || false,
          has_kidney_disease: p.has_kidney_disease || false,
          has_ibs: p.has_ibs || false,
          has_thyroid_condition: p.has_thyroid_condition || false,
          has_gout: p.has_gout || false,
          has_autoimmune: p.has_autoimmune || false,
          has_celiac_disease: p.has_celiac_disease || false,
          has_gerd: p.has_gerd || false,
          has_osteoporosis: p.has_osteoporosis || false,
          has_liver_disease: p.has_liver_disease || false,
          is_cancer_survivor: p.is_cancer_survivor || false,
          diet_type: p.diet_type || undefined,
          dietary_goals: p.dietary_goals || undefined,
          age_group: p.age_group || undefined,
          cooking_skill_level: p.cooking_skill_level || undefined,
          max_prep_time_mins: p.max_prep_time_mins || undefined,
          daily_calorie_target: p.daily_calorie_target || undefined,
          daily_protein_target: p.daily_protein_target || undefined,
          budget_preference: p.budget_preference || undefined,
          trial_status: p.trial_status || undefined,
          trial_expired: p.trial_expired || false,
          scan_credits_remaining: p.scan_credits_remaining ?? undefined,
          high_intent_user: p.high_intent_user || false,
          high_risk_flag: p.high_risk_flag || false,
          onboarding_completed: p.onboarding_completed || false,
          wants_recall_sms: p.wants_recall_sms || false,
          total_scans_used: p.total_scans_used || 0,
          last_scan_timestamp: p.last_scan_timestamp || undefined,
          total_scans: totalScans,
          avg_health_score: avgHealthScore,
          last_scan_date: lastScanDate,
          recent_scans: recentScans,
          legal_optin: legalLead?.consent_given || false,
          consultation_requested: legalLead?.consultation_requested || false,
          pwa_installed: !!deviceToken,
          device_platform: deviceToken?.platform || 'web',
        };
      });

      setSyncProgress(`Syncing ${enrichedProfiles.length} profiles to Klaviyo...`);

      const { data, error } = await supabase.functions.invoke("klaviyo-sync", {
        body: { action: "bulk_sync_enriched", profiles: enrichedProfiles },
      });

      if (error) throw error;

      // Update last sync time
      const now = new Date().toISOString();
      await supabase.from("app_settings").upsert({
        key: "klaviyo_last_sync",
        value: now,
        updated_at: now,
      }, { onConflict: "key" });
      setLastSyncAt(now);

      toast({
        title: "Bulk Sync Complete",
        description: `Synced ${data.synced} profiles with full data, ${data.failed} failed`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
    } catch (err) {
      console.error("Bulk sync error:", err);
      toast({
        title: "Sync Failed",
        description: "Could not complete bulk sync",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const sendTestEvents = async () => {
    setIsSendingTestEvents(true);
    try {
      // Get admin user email
      const { data: { user } } = await supabase.auth.getUser();
      const testEmail = user?.email || 'test@example.com';

      const testEvents = [
        { metric_name: 'account_created', profile_email: testEmail, properties: { email: testEmail, first_name: 'Test', signup_date: new Date().toISOString(), subscription_tier: 'free' } },
        { metric_name: 'product_scanned', profile_email: testEmail, properties: { product_name: 'Test Product', barcode: '000000000000', health_score: 72, verdict: 'caution', scan_count: 1 } },
        { metric_name: 'subscription_upgraded', profile_email: testEmail, properties: { new_tier: 'premium', previous_tier: 'free', email: testEmail } },
        { metric_name: 'recall_alert_received', profile_email: testEmail, properties: { product_name: 'Test Recalled Product', recall_reason: 'Test recall', recall_date: new Date().toISOString(), severity: 'Class I' } },
        { metric_name: 'symptom_reported', profile_email: testEmail, properties: { symptoms: ['headache', 'nausea'], severity: 'mild', related_products: ['Test Product'] } },
        { metric_name: 'low_credit', profile_email: testEmail, properties: { credits_remaining: 1, total_scans_used: 9, subscription_tier: 'free' } },
        { metric_name: 'upgrade_required', profile_email: testEmail, properties: { total_scans_used: 10, subscription_tier: 'free', last_scan_date: new Date().toISOString() } },
        { metric_name: 'legal_optin', profile_email: testEmail, properties: { phone: '+1234567890', consent_given: true, products_exposed: ['Test Toxic Product'] } },
        { metric_name: 'profile_updated', profile_email: testEmail, properties: { updated_fields: ['pregnancy_stage'], pregnancy_stage: 'prenatal', dietary_preferences: ['gluten_free'] } },
      ];

      let succeeded = 0;
      let failed = 0;

      for (const event of testEvents) {
        const { error } = await supabase.functions.invoke("klaviyo-sync", {
          body: { action: "track_event", event },
        });
        if (error) {
          failed++;
          console.error(`Failed to send ${event.metric_name}:`, error);
        } else {
          succeeded++;
        }
      }

      toast({
        title: "Test Events Sent!",
        description: `${succeeded}/9 metrics created in Klaviyo. Go to Flows → Create Flow → Metric trigger to see them.${failed > 0 ? ` (${failed} failed)` : ''}`,
        variant: failed > 0 ? "destructive" : "default",
      });
    } catch (err) {
      console.error("Send test events error:", err);
      toast({
        title: "Error",
        description: "Failed to send test events",
        variant: "destructive",
      });
    } finally {
      setIsSendingTestEvents(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#000000] flex items-center justify-center">
              <Music2 className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div>
              <CardTitle className="text-foreground">Klaviyo Integration</CardTitle>
              <CardDescription>Email & SMS marketing automation</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}
              className="px-3 py-1"
            >
              {connectionStatus === 'connected' && <Check className="w-3 h-3 mr-1" />}
              {connectionStatus === 'error' && <X className="w-3 h-3 mr-1" />}
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Not tested'}
            </Badge>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={setIsEnabled}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Test */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            onClick={testConnection} 
            disabled={isTesting}
            variant="outline"
            className="gap-2"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            Test Connection
          </Button>
          <HelpTooltip content="Tests your API key. If it fails, check that the KLAVIYO_API_KEY secret is configured in your backend." />
          
          <Button
            onClick={fetchLists}
            disabled={isLoadingLists || connectionStatus !== 'connected'}
            variant="outline"
            className="gap-2"
          >
            {isLoadingLists ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Lists
          </Button>

          <Button
            onClick={sendTestEvents}
            disabled={isSendingTestEvents || connectionStatus !== 'connected'}
            variant="outline"
            className="gap-2"
          >
            {isSendingTestEvents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Send Test Events
          </Button>
          <HelpTooltip content="Sends one test event for each of the 9 metrics to Klaviyo. This creates the metrics so they appear when you set up Flows. Uses your admin email." />

          <a 
            href="https://www.klaviyo.com/login" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              Open Klaviyo <ExternalLink className="w-3 h-3" />
            </Button>
          </a>
        </div>

        {/* Important callout about metrics */}
        {connectionStatus === 'connected' && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-xs font-medium text-warning mb-1">⚠️ Metrics won't appear in Klaviyo until the first event fires</p>
            <p className="text-xs text-muted-foreground">
              Klaviyo auto-creates metrics on first use. Click <strong>"Send Test Events"</strong> above to populate all 9 metrics instantly. 
              After that, go to <strong>Klaviyo → Flows → Create Flow → Metric trigger</strong> and you'll see them in the dropdown.
            </p>
          </div>
        )}

        {/* Setup Guide */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm flex-1">📖 Complete Klaviyo Setup Guide</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-6">

              {/* Overview */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-sm mb-1">🔄 How It Works</h4>
                <p className="text-xs text-muted-foreground">
                  Your app automatically sends <strong>events</strong> (actions users take) and <strong>profile data</strong> (user attributes) to Klaviyo. 
                  You don't need to create metrics manually — <strong>Klaviyo auto-creates them</strong> the first time an event fires. 
                  You just need to create <strong>Flows</strong> (automated email sequences) that trigger on those metrics.
                </p>
              </div>

              {/* Step 1: API Key */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                  Add Your Klaviyo API Key
                </h4>
                <div className="text-xs text-muted-foreground space-y-1 ml-7">
                  <p>1. Log into <a href="https://www.klaviyo.com/login" target="_blank" rel="noopener noreferrer" className="text-primary underline">Klaviyo</a> → <strong>Settings → API Keys</strong></p>
                  <p>2. Create a <strong>Private API Key</strong> with full access</p>
                  <p>3. Add it as a secret named <code className="bg-muted px-1 rounded">KLAVIYO_API_KEY</code> in your backend secrets</p>
                  <p>4. Click <strong>"Test Connection"</strong> above to verify</p>
                </div>
              </div>

              {/* Step 2: Create Lists */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                  Create Lists in Klaviyo
                </h4>
                <div className="text-xs text-muted-foreground space-y-1 ml-7">
                  <p>1. Go to <strong>Audience → Lists & Segments → Create List</strong></p>
                  <p>2. Create these recommended lists:</p>
                  <div className="grid grid-cols-2 gap-1 mt-1 mb-1">
                    {['All Users', 'Premium Subscribers', 'Recall Alerts', 'SMS Subscribers', 'Parents / Baby Food', 'Legal Opt-ins'].map(name => (
                      <div key={name} className="flex items-center gap-1">
                        <span className="text-primary">•</span> {name}
                      </div>
                    ))}
                  </div>
                  <p>3. Click each list → <strong>Settings</strong> → Copy the <strong>List ID</strong></p>
                  <p>4. Paste each List ID in the <strong>List Mappings</strong> section below</p>
                </div>
              </div>

              {/* Step 3: Create Flows */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                  Create Flows (Automated Emails)
                </h4>
                <p className="text-xs text-muted-foreground ml-7 mb-2">
                  Go to <strong>Flows → Create Flow → Build your own</strong>. Set trigger to <strong>"Metric"</strong> and select the metric name. 
                  Metrics appear automatically after the first event fires (or after your first Bulk Sync).
                </p>
              </div>

              {/* All Events with Full Payloads */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">4</span>
                  All Events & Their Data Fields
                </h4>
                <p className="text-xs text-muted-foreground ml-7 mb-3">
                  Each event sends specific data you can use in email templates with <code className="bg-muted px-1 rounded">{'{{ event.property_name }}'}</code> syntax.
                </p>

                <div className="space-y-3 ml-7">
                  {/* account_created */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">account_created</code>
                      <Badge variant="secondary" className="text-[10px] h-4">On Signup</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when a new user registers. Use for welcome emails.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">email:</span> user's email</div>
                      <div><span className="text-muted-foreground">first_name:</span> first name</div>
                      <div><span className="text-muted-foreground">signup_date:</span> ISO timestamp</div>
                      <div><span className="text-muted-foreground">subscription_tier:</span> "free"</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> Welcome email → Wait 1 day → "How to scan your first product" → Wait 3 days → "Did you know about recalls?"
                    </div>
                  </div>

                  {/* product_scanned */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">product_scanned</code>
                      <Badge variant="secondary" className="text-[10px] h-4">On Scan</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires every time a user scans a product.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">product_name:</span> scanned product name</div>
                      <div><span className="text-muted-foreground">barcode:</span> product barcode</div>
                      <div><span className="text-muted-foreground">health_score:</span> 0-100 score</div>
                      <div><span className="text-muted-foreground">verdict:</span> "safe" | "caution" | "avoid"</div>
                      <div><span className="text-muted-foreground">scan_count:</span> user's total scans</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> If health_score &lt; 40 → Send "We found concerns with this product" email with alternatives
                    </div>
                  </div>

                  {/* subscription_upgraded */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">subscription_upgraded</code>
                      <Badge variant="secondary" className="text-[10px] h-4">On Upgrade</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when a user upgrades their plan.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">new_tier:</span> "basic" | "premium" | "annual"</div>
                      <div><span className="text-muted-foreground">previous_tier:</span> previous plan</div>
                      <div><span className="text-muted-foreground">email:</span> user's email</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> Thank you email → Guide to premium features → Ask for review after 7 days
                    </div>
                  </div>

                  {/* recall_alert_received */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">recall_alert_received</code>
                      <Badge variant="secondary" className="text-[10px] h-4">On Recall</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when a product the user scanned gets recalled.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">product_name:</span> recalled product</div>
                      <div><span className="text-muted-foreground">recall_reason:</span> reason for recall</div>
                      <div><span className="text-muted-foreground">recall_date:</span> date of recall</div>
                      <div><span className="text-muted-foreground">severity:</span> recall classification</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> Urgent email alert → "A product you scanned has been recalled" with details and safe alternatives
                    </div>
                  </div>

                  {/* symptom_reported */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">symptom_reported</code>
                      <Badge variant="secondary" className="text-[10px] h-4">On Symptom</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when a user logs health symptoms.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">symptoms:</span> array of reported symptoms</div>
                      <div><span className="text-muted-foreground">severity:</span> "mild" | "moderate" | "severe"</div>
                      <div><span className="text-muted-foreground">related_products:</span> recently scanned products</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> If severity = "severe" → Send legal consultation CTA email
                    </div>
                  </div>

                  {/* low_credit */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">low_credit</code>
                      <Badge variant="secondary" className="text-[10px] h-4">1 Scan Left</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when user has only 1 scan credit remaining.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">credits_remaining:</span> 1</div>
                      <div><span className="text-muted-foreground">total_scans_used:</span> total scans to date</div>
                      <div><span className="text-muted-foreground">subscription_tier:</span> current plan</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> "You have 1 scan left!" → Upgrade CTA with discount code
                    </div>
                  </div>

                  {/* upgrade_required */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">upgrade_required</code>
                      <Badge variant="secondary" className="text-[10px] h-4">0 Scans</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when user has 0 scans and tries to scan.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">total_scans_used:</span> total scans to date</div>
                      <div><span className="text-muted-foreground">subscription_tier:</span> "free"</div>
                      <div><span className="text-muted-foreground">last_scan_date:</span> date of last scan</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> "You've run out of scans" → Upgrade email → Wait 2 days → Follow-up with testimonials
                    </div>
                  </div>

                  {/* legal_optin */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">legal_optin</code>
                      <Badge variant="secondary" className="text-[10px] h-4">On Legal CTA</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when user opts into legal consultation.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">phone:</span> user's phone number</div>
                      <div><span className="text-muted-foreground">consent_given:</span> true</div>
                      <div><span className="text-muted-foreground">products_exposed:</span> toxic products scanned</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> Confirmation email → "A legal representative will contact you within 24 hours"
                    </div>
                  </div>

                  {/* profile_updated */}
                  <div className="p-3 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Baby className="w-4 h-4 text-primary" />
                      <code className="text-xs font-mono font-bold text-primary">profile_updated</code>
                      <Badge variant="secondary" className="text-[10px] h-4">On Profile Change</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Fires when user updates their health profile or preferences.</p>
                    <div className="text-xs space-y-0.5 bg-muted/50 p-2 rounded font-mono">
                      <div><span className="text-muted-foreground">updated_fields:</span> list of changed fields</div>
                      <div><span className="text-muted-foreground">pregnancy_stage:</span> current stage</div>
                      <div><span className="text-muted-foreground">dietary_preferences:</span> updated diet info</div>
                    </div>
                    <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                      <strong>💡 Flow idea:</strong> If pregnancy_stage changed → Send stage-specific nutrition guide
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Segmentation */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">5</span>
                  Create Segments (for Campaigns)
                </h4>
                <p className="text-xs text-muted-foreground ml-7 mb-2">
                  Go to <strong>Audience → Lists & Segments → Create Segment</strong>. Use profile properties (synced via Bulk Sync) to target specific users.
                </p>
                <div className="space-y-2 ml-7">
                  <div className="p-2 rounded border bg-background text-xs">
                    <strong>Pregnant Moms:</strong> <code className="bg-muted px-1 rounded">pregnancy_stage = "prenatal"</code>
                  </div>
                  <div className="p-2 rounded border bg-background text-xs">
                    <strong>High-Intent Free Users:</strong> <code className="bg-muted px-1 rounded">subscription_tier = "free" AND total_scans &gt; 5</code>
                  </div>
                  <div className="p-2 rounded border bg-background text-xs">
                    <strong>Diabetic Users:</strong> <code className="bg-muted px-1 rounded">health_conditions_flags CONTAINS "diabetic"</code>
                  </div>
                  <div className="p-2 rounded border bg-background text-xs">
                    <strong>Parents with Babies:</strong> <code className="bg-muted px-1 rounded">baby_count &gt; 0</code>
                  </div>
                  <div className="p-2 rounded border bg-background text-xs">
                    <strong>Expired Trials:</strong> <code className="bg-muted px-1 rounded">trial_expired = true AND subscription_tier = "free"</code>
                  </div>
                  <div className="p-2 rounded border bg-background text-xs">
                    <strong>Legal Leads:</strong> <code className="bg-muted px-1 rounded">legal_optin = true</code>
                  </div>
                </div>
              </div>

              {/* Step 6: Email Templates */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">6</span>
                  Use Dynamic Variables in Emails
                </h4>
                <p className="text-xs text-muted-foreground ml-7 mb-2">
                  In your Klaviyo email templates, use these dynamic tags for personalization:
                </p>
                <div className="ml-7 text-xs space-y-1 bg-muted/50 p-3 rounded font-mono">
                  <div><span className="text-muted-foreground">Profile:</span> {'{{ first_name }}'} · {'{{ email }}'} · {'{{ phone_number }}'}</div>
                  <div><span className="text-muted-foreground">Stage:</span> {'{{ pregnancy_stage }}'} · {'{{ baby_count }}'} · {'{{ due_date }}'}</div>
                  <div><span className="text-muted-foreground">Plan:</span> {'{{ subscription_tier }}'} · {'{{ scan_credits_remaining }}'}</div>
                  <div><span className="text-muted-foreground">Event data:</span> {'{{ event.product_name }}'} · {'{{ event.health_score }}'}</div>
                </div>
              </div>

              {/* Quick Start Checklist */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold text-sm mb-2">✅ Quick Start Checklist</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>☐ Add KLAVIYO_API_KEY secret → Test Connection</p>
                  <p>☐ Click "Refresh Lists" → Copy List IDs into mappings below</p>
                  <p>☐ Enable the event toggles you want (below)</p>
                  <p>☐ Click "Save Settings"</p>
                  <p>☐ Click "Sync All Users" to push all profiles to Klaviyo</p>
                  <p>☐ In Klaviyo: Create Flows triggered by the metric names above</p>
                  <p>☐ In Klaviyo: Create Segments using profile properties for campaigns</p>
                </div>
              </div>

            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* List Mappings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">List Mappings</Label>
            <HelpTooltip content="Create lists in Klaviyo under Audience > Lists & Segments. Copy the List ID and paste it here. Users are auto-subscribed to matching lists based on their profile." />
          </div>
          <p className="text-xs text-muted-foreground">
            Map your Klaviyo lists to different user segments. Enter the List ID from Klaviyo.
          </p>
          
          {lists.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium mb-2">Available Lists (click to copy ID):</p>
              <div className="flex flex-wrap gap-2">
                {lists.map(list => (
                  <Badge 
                    key={list.id} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      navigator.clipboard.writeText(list.id);
                      toast({ title: "Copied!", description: `List ID "${list.id}" copied` });
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {list.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-3">
            {[
              { key: 'all_users', label: 'All Users List', icon: <Users className="w-4 h-4" /> },
              { key: 'premium_subscribers', label: 'Premium Subscribers', icon: <Check className="w-4 h-4" /> },
              { key: 'recall_alerts', label: 'Recall Alerts', icon: <Bell className="w-4 h-4" /> },
              { key: 'sms_subscribers', label: 'SMS Subscribers', icon: <MessageSquare className="w-4 h-4" /> },
              { key: 'parents', label: 'Parents / Baby Food', icon: <Baby className="w-4 h-4" /> },
              { key: 'legal_optins', label: 'Legal Opt-ins', icon: <Scale className="w-4 h-4" /> },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <Label className="text-xs">{item.label}</Label>
                  <Input
                    placeholder="Enter Klaviyo List ID"
                    value={listMappings[item.key] || ''}
                    onChange={(e) => setListMappings(prev => ({ ...prev, [item.key]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Event Toggles */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Event Tracking</Label>
            <HelpTooltip content="Each enabled event sends a metric to Klaviyo when triggered. Create a Flow in Klaviyo with the matching metric name to send automated emails." />
          </div>
          <p className="text-xs text-muted-foreground">
            Enable events to sync user actions to Klaviyo for automated flows.
          </p>
          
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-3">
              {eventTypes.map((event, index) => (
                <motion.div
                  key={event.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {event.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
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

        <Separator />

        {/* Bulk Sync */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Bulk Sync (Full Data)</Label>
                <HelpTooltip content="Sends all user profiles with enriched data (pregnancy stage, scan history, subscription tier, legal opt-in) to Klaviyo at once. Run after initial setup or to refresh." />
              </div>
              <p className="text-xs text-muted-foreground">
                Sync all users with pregnancy stage, scan history, subscription status, legal opt-in & device info
              </p>
            </div>
            <Button
              onClick={bulkSync}
              disabled={isSyncing || connectionStatus !== 'connected'}
              variant="outline"
              className="gap-2"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListPlus className="w-4 h-4" />}
              Sync All Users
            </Button>
          </div>
          
          {syncProgress && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                {syncProgress}
              </p>
            </div>
          )}
          
          {lastSyncAt && (
            <p className="text-xs text-muted-foreground">
              Last sync: {new Date(lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>

        <Separator />

        {/* Data Points Info */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <Label className="text-sm font-medium">Synced Data Points</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>• Email & Name</div>
            <div>• Phone Number</div>
            <div>• Pregnancy Stage</div>
            <div>• Due Date & Baby Info</div>
            <div>• Scan Count & Avg Score</div>
            <div>• Recent Scans (last 5)</div>
            <div>• Subscription Tier & Status</div>
            <div>• Legal Opt-in Status</div>
            <div>• PWA Install Flag</div>
            <div>• Device Platform</div>
            <div>• Dietary Preferences</div>
            <div>• Health Conditions (13 flags)</div>
            <div>• Medications</div>
            <div>• Allergy Notes & Details</div>
            <div>• Diet Type & Goals</div>
            <div>• Age Group</div>
            <div>• Meal Preferences (5 fields)</div>
            <div>• Trial & Credit Status</div>
            <div>• High Intent / Risk Flags</div>
            <div>• Onboarding Completed</div>
            <div>• Wants Recall SMS</div>
            <div>• Total Scans Used (DB)</div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
