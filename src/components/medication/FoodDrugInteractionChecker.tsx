import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FoodDrugInteractionAlert, FoodDrugInteraction } from "./FoodDrugInteractionAlert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Ingredient {
  name: string;
  [key: string]: any;
}

interface FoodDrugInteractionCheckerProps {
  ingredients: Ingredient[];
  productName: string;
  scanId?: string;
  onComplete?: (hasInteractions: boolean) => void;
  autoCheck?: boolean;
}

export function FoodDrugInteractionChecker({ 
  ingredients,
  productName,
  scanId,
  onComplete,
  autoCheck = true
}: FoodDrugInteractionCheckerProps) {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [interactions, setInteractions] = useState<FoodDrugInteraction[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (autoCheck && ingredients?.length > 0 && user && !hasChecked) {
      checkInteractions();
    }
  }, [ingredients, user, autoCheck, hasChecked]);

  const checkInteractions = async () => {
    if (!user || !ingredients || ingredients.length === 0) return;

    setIsChecking(true);
    try {
      // Fetch user's active medications from medication_reminders
      const { data: reminders, error: remindersError } = await supabase
        .from('medication_reminders')
        .select('medication_name, dosage')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (remindersError) throw remindersError;

      // Also check profile medications
      const { data: profile } = await supabase
        .from('profiles')
        .select('medications')
        .eq('id', user.id)
        .single();

      // Combine medications from both sources
      const existingMedications = [
        ...(reminders?.map(r => ({ medication_name: r.medication_name })) || []),
        ...((profile?.medications as any[] || []).map((m: any) => ({ medication_name: m.name || m })))
      ].filter((med, index, self) => 
        med.medication_name && 
        self.findIndex(m => m.medication_name === med.medication_name) === index
      );

      if (existingMedications.length === 0) {
        console.log('No medications to check against');
        setHasChecked(true);
        onComplete?.(false);
        return;
      }

      console.log('Checking food-drug interactions for:', ingredients.map(i => i.name), 'against:', existingMedications);

      const { data, error } = await supabase.functions.invoke('check-food-drug-interactions', {
        body: { 
          foodIngredients: ingredients.map(i => i.name),
          medications: existingMedications
        }
      });

      if (error) throw error;

      console.log('Food-drug interaction check result:', data);

      if (data.hasInteractions && data.interactions.length > 0) {
        setInteractions(data.interactions);
        setShowAlert(true);

        // Store interactions in database
        for (const interaction of data.interactions) {
          await supabase.from('food_drug_interactions').insert({
            user_id: user.id,
            food_ingredient: interaction.ingredient,
            medication_name: interaction.medication,
            severity: interaction.severity,
            effect: interaction.effect,
            recommendation: interaction.recommendation,
            alternative_foods: interaction.alternativeFoods || [],
            scan_id: scanId || null,
          });
        }

        // Show toast notification
        toast.warning("Food-Medication Interaction Detected", {
          description: `${productName} may interact with your medications.`,
        });
      }

      setHasChecked(true);
      onComplete?.(data.hasInteractions);

    } catch (error: any) {
      console.error('Error checking food-drug interactions:', error);
      setHasChecked(true);
      onComplete?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!user) return;

    try {
      // Update all interactions for this scan as acknowledged
      if (scanId) {
        await supabase
          .from('food_drug_interactions')
          .update({ acknowledged_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('scan_id', scanId)
          .is('acknowledged_at', null);
      }

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
        <span>Checking for food-medication interactions...</span>
      </div>
    );
  }

  if (showAlert && interactions.length > 0) {
    return (
      <FoodDrugInteractionAlert
        interactions={interactions}
        productName={productName}
        onAcknowledge={handleAcknowledge}
        onDismiss={() => setShowAlert(false)}
      />
    );
  }

  return null;
}
