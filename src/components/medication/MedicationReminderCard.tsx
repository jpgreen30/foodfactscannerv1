import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Pill, 
  Clock, 
  Calendar, 
  Check, 
  Trash2, 
  Bell,
  AlertTriangle,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface MedicationReminderCardProps {
  reminder: MedicationReminder;
  onUpdate: () => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  three_times_daily: "3x daily",
  four_times_daily: "4x daily",
  every_other_day: "Every other day",
  weekly: "Weekly",
  as_needed: "As needed",
};

export const MedicationReminderCard = ({ reminder, onUpdate }: MedicationReminderCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleActive = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("medication_reminders")
        .update({ is_active: !reminder.is_active })
        .eq("id", reminder.id);

      if (error) throw error;

      toast.success(reminder.is_active ? "Reminder paused" : "Reminder activated");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating reminder:", error);
      toast.error("Failed to update reminder");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("medication_reminders")
        .delete()
        .eq("id", reminder.id);

      if (error) throw error;

      toast.success("Reminder deleted");
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    }
    setShowDeleteDialog(false);
  };

  const markTaken = async () => {
    try {
      const { error } = await supabase.from("medication_logs").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        reminder_id: reminder.id,
        scheduled_time: new Date().toISOString(),
        taken_at: new Date().toISOString(),
        status: "taken",
      });

      if (error) throw error;

      // Decrement pills remaining if tracking
      if (reminder.pills_remaining && reminder.pills_remaining > 0) {
        await supabase
          .from("medication_reminders")
          .update({ pills_remaining: reminder.pills_remaining - 1 })
          .eq("id", reminder.id);
      }

      toast.success(`${reminder.medication_name} marked as taken!`);
      onUpdate();
    } catch (error: any) {
      console.error("Error logging medication:", error);
      toast.error("Failed to log medication");
    }
  };

  const needsRefill = reminder.pills_remaining !== null && 
    reminder.refill_reminder_days !== null &&
    reminder.pills_remaining <= reminder.refill_reminder_days;

  return (
    <>
      <Card className={`transition-all ${!reminder.is_active ? "opacity-60" : ""} ${needsRefill ? "border-warning" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-full ${reminder.is_active ? "bg-primary/10" : "bg-muted"}`}>
                <Pill className={`w-5 h-5 ${reminder.is_active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{reminder.medication_name}</h3>
                  {reminder.dosage && (
                    <Badge variant="secondary" className="text-xs">
                      {reminder.dosage}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {FREQUENCY_LABELS[reminder.frequency] || reminder.frequency}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" />
                    {reminder.reminder_times.join(", ")}
                  </span>
                </div>

                {reminder.notes && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {reminder.notes}
                  </p>
                )}

                {needsRefill && (
                  <div className="flex items-center gap-1 mt-2 text-warning text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Low supply: {reminder.pills_remaining} pills left</span>
                  </div>
                )}

                {reminder.pills_remaining !== null && !needsRefill && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {reminder.pills_remaining} pills remaining
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={reminder.is_active}
                onCheckedChange={toggleActive}
                disabled={isUpdating}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={markTaken}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Taken
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-danger focus:text-danger"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {reminder.is_active && (
            <Button
              onClick={markTaken}
              className="w-full mt-3 bg-success hover:bg-success/90"
              size="sm"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Taken
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the reminder for {reminder.medication_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-danger hover:bg-danger/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
