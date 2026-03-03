import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DrugInteractionAlert, DrugInteraction } from "./DrugInteractionAlert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DrugInteractionCheckerProps {
  medicationName: string;
  scanId?: string;
  onComplete?: (hasInteractions: boolean) => void;
  autoCheck?: boolean;
}

export function DrugInteractionChecker({ 
  medicationName, 
  scanId,
  onComplete,
  autoCheck = true
}: DrugInteractionCheckerProps) {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (autoCheck && medicationName && user && !hasChecked) {
      checkInteractions();
    }
  }, [medicationName, user, autoCheck, hasChecked]);

  const checkInteractions = async () => {
    if (!user || !medicationName) return;

    setIsChecking(true);
    try {
      // Fetch user's existing medications from medication_reminders
      const { data: reminders, error: remindersError } = await supabase
        .from('medication_reminders')
        .select('medication_name, dosage')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (remindersError) throw remindersError;

      // Also fetch from profile medications if available
      const { data: profile } = await supabase
        .from('profiles')
        .select('medications')
        .eq('id', user.id)
        .single();

      // Combine medications from both sources
      const existingMedications = [
        ...(reminders?.map(r => r.medication_name) || []),
        ...((profile?.medications as any[] || []).map((m: any) => m.name || m))
      ].filter((med, index, self) => 
        med && 
        med.toLowerCase() !== medicationName.toLowerCase() &&
        self.indexOf(med) === index
      );

      if (existingMedications.length === 0) {
        console.log('No existing medications to check against');
        setHasChecked(true);
        onComplete?.(false);
        return;
      }

      console.log('Checking interactions for:', medicationName, 'against:', existingMedications);

      const { data, error } = await supabase.functions.invoke('check-drug-interactions', {
        body: { 
          scannedMedication: medicationName,
          existingMedications 
        }
      });

      if (error) throw error;

      console.log('Interaction check result:', data);

      if (data.hasInteractions && data.interactions.length > 0) {
        setInteractions(data.interactions);
        setShowAlert(true);

        // Store interactions in database
        for (const interaction of data.interactions) {
          await supabase.from('drug_interactions').insert({
            user_id: user.id,
            scanned_medication: medicationName,
            interacting_medication: interaction.medication,
            severity: interaction.severity,
            description: interaction.effect,
            recommendations: interaction.recommendation,
            mechanism: interaction.mechanism,
            scan_id: scanId || null,
          });
        }
      }

      setHasChecked(true);
      onComplete?.(data.hasInteractions);

    } catch (error: any) {
      console.error('Error checking drug interactions:', error);
      toast.error('Could not check drug interactions');
      setHasChecked(true);
      onComplete?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!user) return;

    try {
      // Update all interactions as acknowledged
      await supabase
        .from('drug_interactions')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('scanned_medication', medicationName)
        .is('acknowledged_at', null);

      setShowAlert(false);
      toast.info('Interaction warning acknowledged');
    } catch (error) {
      console.error('Error acknowledging interactions:', error);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking for drug interactions...</span>
      </div>
    );
  }

  if (showAlert && interactions.length > 0) {
    return (
      <DrugInteractionAlert
        interactions={interactions}
        scannedMedication={medicationName}
        onAcknowledge={handleAcknowledge}
        onDismiss={() => setShowAlert(false)}
      />
    );
  }

  return null;
}
