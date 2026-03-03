import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertOctagon, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Utensils,
  Pill,
  Lightbulb
} from "lucide-react";

export interface FoodDrugInteraction {
  ingredient: string;
  medication: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  effect: string;
  recommendation: string;
  alternativeFoods: string[];
}

interface FoodDrugInteractionAlertProps {
  interactions: FoodDrugInteraction[];
  productName: string;
  onAcknowledge?: () => void;
  onDismiss?: () => void;
}

const severityConfig = {
  contraindicated: {
    icon: AlertOctagon,
    bgClass: 'bg-red-500/10 border-red-500/50',
    iconClass: 'text-red-500',
    badgeVariant: 'destructive' as const,
    label: 'Contraindicated',
    description: 'Do NOT consume with this medication'
  },
  major: {
    icon: ShieldAlert,
    bgClass: 'bg-orange-500/10 border-orange-500/50',
    iconClass: 'text-orange-500',
    badgeVariant: 'default' as const,
    label: 'Major',
    description: 'Avoid or consult doctor'
  },
  moderate: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-500/10 border-yellow-500/50',
    iconClass: 'text-yellow-500',
    badgeVariant: 'secondary' as const,
    label: 'Moderate',
    description: 'Use with caution'
  },
  minor: {
    icon: Info,
    bgClass: 'bg-blue-500/10 border-blue-500/50',
    iconClass: 'text-blue-500',
    badgeVariant: 'outline' as const,
    label: 'Minor',
    description: 'Low risk'
  }
};

export function FoodDrugInteractionAlert({ 
  interactions, 
  productName,
  onAcknowledge, 
  onDismiss 
}: FoodDrugInteractionAlertProps) {
  const [expanded, setExpanded] = useState(true);
  
  // Get the highest severity interaction
  const severityOrder = ['contraindicated', 'major', 'moderate', 'minor'];
  const highestSeverity = interactions.reduce((highest, i) => {
    const currentIndex = severityOrder.indexOf(i.severity);
    const highestIndex = severityOrder.indexOf(highest);
    return currentIndex < highestIndex ? i.severity : highest;
  }, 'minor' as FoodDrugInteraction['severity']);

  const config = severityConfig[highestSeverity];
  const Icon = config.icon;

  return (
    <Alert className={`${config.bgClass} border-2 shadow-lg`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 ${config.iconClass} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <AlertTitle className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold">⚠️ Food-Medication Interaction</span>
              <Badge variant={config.badgeVariant}>{config.label}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </AlertTitle>

          <AlertDescription className="space-y-3">
            <p className="text-sm font-medium">
              <Utensils className="inline w-4 h-4 mr-1" />
              "{productName}" contains ingredients that may interact with your medications.
            </p>

            {expanded && (
              <div className="space-y-3 mt-4">
                {interactions.map((interaction, index) => {
                  const intConfig = severityConfig[interaction.severity];
                  const IntIcon = intConfig.icon;
                  
                  return (
                    <Card key={index} className={`p-3 ${intConfig.bgClass}`}>
                      <div className="flex items-start gap-2">
                        <IntIcon className={`w-4 h-4 mt-0.5 ${intConfig.iconClass} flex-shrink-0`} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm flex items-center gap-1">
                              <Utensils className="w-3 h-3" />
                              {interaction.ingredient}
                            </span>
                            <span className="text-muted-foreground">×</span>
                            <span className="font-semibold text-sm flex items-center gap-1">
                              <Pill className="w-3 h-3" />
                              {interaction.medication}
                            </span>
                            <Badge variant={intConfig.badgeVariant} className="text-xs">
                              {intConfig.label}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-foreground/90">
                            {interaction.effect}
                          </p>
                          
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Recommendation:</span> {interaction.recommendation}
                          </p>

                          {interaction.alternativeFoods && interaction.alternativeFoods.length > 0 && (
                            <div className="flex items-start gap-1 text-xs">
                              <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-500" />
                              <span>
                                <span className="font-medium">Safe alternatives:</span>{' '}
                                {interaction.alternativeFoods.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                <p className="text-xs text-muted-foreground italic mt-3">
                  ⚕️ This is for educational purposes only. Always consult your healthcare provider or pharmacist.
                </p>

                <div className="flex gap-2 mt-4">
                  {onAcknowledge && (
                    <Button 
                      onClick={onAcknowledge} 
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      I Understand the Risk
                    </Button>
                  )}
                  {onDismiss && (
                    <Button 
                      onClick={onDismiss} 
                      variant="ghost"
                      size="sm"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
