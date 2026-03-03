import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Clock, Calendar, Bell, Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MedicationReminderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    medication_name?: string;
    scan_id?: string;
  };
}

const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "four_times_daily", label: "Four times daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
];

export const MedicationReminderForm = ({ onSuccess, onCancel, initialData }: MedicationReminderFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicationName, setMedicationName] = useState(initialData?.medication_name || "");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("once_daily");
  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [pillsRemaining, setPillsRemaining] = useState<string>("");
  const [refillReminderDays, setRefillReminderDays] = useState("7");
  const [enableRefillReminder, setEnableRefillReminder] = useState(false);

  const addReminderTime = () => {
    if (reminderTimes.length < 6) {
      setReminderTimes([...reminderTimes, "12:00"]);
    }
  };

  const removeReminderTime = (index: number) => {
    if (reminderTimes.length > 1) {
      setReminderTimes(reminderTimes.filter((_, i) => i !== index));
    }
  };

  const updateReminderTime = (index: number, value: string) => {
    const updated = [...reminderTimes];
    updated[index] = value;
    setReminderTimes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to create reminders");
      return;
    }

    if (!medicationName.trim()) {
      toast.error("Please enter a medication name");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("medication_reminders").insert({
        user_id: user.id,
        medication_name: medicationName.trim(),
        dosage: dosage.trim() || null,
        frequency,
        reminder_times: reminderTimes,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes.trim() || null,
        pills_remaining: pillsRemaining ? parseInt(pillsRemaining) : null,
        refill_reminder_days: enableRefillReminder ? parseInt(refillReminderDays) : null,
        scan_id: initialData?.scan_id || null,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Medication reminder created!", {
        description: `You'll be reminded to take ${medicationName}`,
      });
      
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create reminder", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pill className="w-5 h-5 text-primary" />
          Add Medication Reminder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medication Name */}
          <div className="space-y-2">
            <Label htmlFor="medication-name">Medication Name *</Label>
            <Input
              id="medication-name"
              placeholder="e.g., Lisinopril, Metformin"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              required
            />
          </div>

          {/* Dosage */}
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              placeholder="e.g., 10mg, 2 tablets"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reminder Times */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Reminder Times
            </Label>
            <div className="space-y-2">
              {reminderTimes.map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => updateReminderTime(index, e.target.value)}
                    className="flex-1"
                  />
                  {reminderTimes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReminderTime(index)}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {reminderTimes.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReminderTime}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Time
                </Button>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date (optional)</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          {/* Refill Reminder */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="refill-reminder" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Refill Reminder
              </Label>
              <Switch
                id="refill-reminder"
                checked={enableRefillReminder}
                onCheckedChange={setEnableRefillReminder}
              />
            </div>
            {enableRefillReminder && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pills-remaining">Pills Remaining</Label>
                  <Input
                    id="pills-remaining"
                    type="number"
                    placeholder="30"
                    value={pillsRemaining}
                    onChange={(e) => setPillsRemaining(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refill-days">Remind Before (days)</Label>
                  <Input
                    id="refill-days"
                    type="number"
                    value={refillReminderDays}
                    onChange={(e) => setRefillReminderDays(e.target.value)}
                    min="1"
                    max="30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Take with food, avoid grapefruit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Create Reminder
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
