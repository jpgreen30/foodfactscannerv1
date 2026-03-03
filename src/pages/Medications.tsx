import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pill, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { MedicationReminderForm } from "@/components/medication/MedicationReminderForm";
import { MedicationReminderCard } from "@/components/medication/MedicationReminderCard";
import { InteractionHistoryTab } from "@/components/medication/InteractionHistoryTab";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

interface MedicationReminder {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string;
  reminder_times: string[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  pills_remaining: number | null;
  refill_reminder_days: number | null;
}

interface MedicationLog {
  id: string;
  reminder_id: string;
  scheduled_time: string;
  taken_at: string | null;
  status: string;
  medication_reminders?: {
    medication_name: string;
    dosage: string | null;
  };
}

const Medications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState("reminders");
  const formRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to form when shown
  useEffect(() => {
    if (showAddForm && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showAddForm]);

  useEffect(() => {
    if (user) {
      fetchReminders();
      fetchLogs();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("medication_reminders")
        .select("*")
        .order("is_active", { ascending: false })
        .order("medication_name");

      if (error) throw error;
      
      // Parse reminder_times from JSON if needed
      const parsedData = (data || []).map(item => ({
        ...item,
        reminder_times: Array.isArray(item.reminder_times) 
          ? item.reminder_times 
          : JSON.parse(item.reminder_times as unknown as string)
      }));
      
      setReminders(parsedData);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("medication_logs")
        .select(`
          *,
          medication_reminders (
            medication_name,
            dosage
          )
        `)
        .order("scheduled_time", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    fetchReminders();
  };

  const activeReminders = reminders.filter(r => r.is_active);
  const pausedReminders = reminders.filter(r => !r.is_active);
  const todayLogs = logs.filter(l => l.taken_at && isToday(parseISO(l.taken_at)));

  if (!user) {
    return (
      <AppLayout className="bg-background">
        <Card>
          <CardContent className="p-8 text-center">
            <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to manage your medication reminders
            </p>
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Medication Reminders - Food Fact Scanner</title>
        <meta name="description" content="Manage your medication reminders and never miss a dose. Track prescriptions, set reminders, and log your medication intake." />
      </Helmet>

      <AppLayout className="bg-background" containerClassName="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Pill className="w-6 h-6 text-primary" />
                Medications
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Track your prescriptions and never miss a dose
              </p>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{activeReminders.length}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">{todayLogs.length}</div>
                <p className="text-xs text-muted-foreground">Taken Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">
                  {reminders.filter(r => 
                    r.pills_remaining !== null && 
                    r.refill_reminder_days !== null &&
                    r.pills_remaining <= r.refill_reminder_days
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">Need Refill</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div ref={formRef}>
              <MedicationReminderForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reminders" className="gap-2">
                <Clock className="w-4 h-4" />
                Reminders
              </TabsTrigger>
              <TabsTrigger value="interactions" className="gap-2">
                <ShieldAlert className="w-4 h-4" />
                Interactions
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reminders" className="mt-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : reminders.length === 0 && !showAddForm ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No Medication Reminders</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first medication to start tracking
                    </p>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medication
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Active Reminders */}
                  {activeReminders.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        Active ({activeReminders.length})
                      </h3>
                      {activeReminders.map((reminder) => (
                        <MedicationReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          onUpdate={fetchReminders}
                        />
                      ))}
                    </div>
                  )}

                  {/* Paused Reminders */}
                  {pausedReminders.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Paused ({pausedReminders.length})
                      </h3>
                      {pausedReminders.map((reminder) => (
                        <MedicationReminderCard
                          key={reminder.id}
                          reminder={reminder}
                          onUpdate={fetchReminders}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="interactions" className="mt-4">
              <InteractionHistoryTab />
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-3">
              {logs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">No History Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Your medication history will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                logs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${log.status === "taken" ? "bg-success/10" : "bg-muted"}`}>
                            {log.status === "taken" ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {log.medication_reminders?.medication_name || "Unknown Medication"}
                            </p>
                            {log.medication_reminders?.dosage && (
                              <p className="text-sm text-muted-foreground">
                                {log.medication_reminders.dosage}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          {log.taken_at && (
                            <>
                              <p className="font-medium">
                                {format(parseISO(log.taken_at), "h:mm a")}
                              </p>
                              <p className="text-muted-foreground">
                                {format(parseISO(log.taken_at), "MMM d")}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </AppLayout>
    </>
  );
};

export default Medications;
