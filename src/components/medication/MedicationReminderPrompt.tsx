import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, Bell, Clock, ArrowRight, X } from "lucide-react";
import { MedicationReminderForm } from "@/components/medication/MedicationReminderForm";
import { useNavigate } from "react-router-dom";

interface MedicationReminderPromptProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  scanId?: string;
}

export const MedicationReminderPrompt = ({ 
  isOpen, 
  onClose, 
  productName, 
  scanId 
}: MedicationReminderPromptProps) => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
    onClose();
  };

  const handleViewAll = () => {
    onClose();
    navigate("/medications");
  };

  if (showForm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Add Medication Reminder</DialogTitle>
          </DialogHeader>
          <MedicationReminderForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
            initialData={{
              medication_name: productName,
              scan_id: scanId,
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="text-center pt-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Pill className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">Set Medication Reminder?</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Never miss a dose of <span className="font-medium text-foreground">{productName}</span>. 
            Get timely reminders and track your medication.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-left">
              <Bell className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Smart Reminders</p>
                <p className="text-xs text-muted-foreground">Get notified when it's time to take your medication</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-left">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Refill Alerts</p>
                <p className="text-xs text-muted-foreground">Know when you're running low on pills</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => setShowForm(true)} 
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Bell className="w-4 h-4 mr-2" />
              Set Reminder
            </Button>
            <Button 
              variant="outline" 
              onClick={handleViewAll}
              className="w-full"
            >
              View All Medications
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
