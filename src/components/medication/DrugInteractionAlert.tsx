import { AlertTriangle, AlertOctagon, Info, ShieldAlert, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export interface DrugInteraction {
  medication: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  effect: string;
  recommendation: string;
  mechanism: string;
}

interface DrugInteractionAlertProps {
  interactions: DrugInteraction[];
  scannedMedication: string;
  onAcknowledge: () => void;
  onDismiss?: () => void;
}

const severityConfig = {
  contraindicated: {
    icon: AlertOctagon,
    bgClass: 'bg-red-500/10 border-red-500/50',
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-500 text-white',
    label: 'CONTRAINDICATED',
    description: 'Do not take together - serious risk'
  },
  major: {
    icon: ShieldAlert,
    bgClass: 'bg-orange-500/10 border-orange-500/50',
    iconClass: 'text-orange-500',
    badgeClass: 'bg-orange-500 text-white',
    label: 'MAJOR',
    description: 'Consult doctor before taking'
  },
  moderate: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-500/10 border-yellow-500/50',
    iconClass: 'text-yellow-500',
    badgeClass: 'bg-yellow-500 text-black',
    label: 'MODERATE',
    description: 'May require monitoring'
  },
  minor: {
    icon: Info,
    bgClass: 'bg-blue-500/10 border-blue-500/50',
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-500 text-white',
    label: 'MINOR',
    description: 'Low risk - be aware'
  }
};

// Sort by severity (most severe first)
const severityOrder = ['contraindicated', 'major', 'moderate', 'minor'];

export function DrugInteractionAlert({ 
  interactions, 
  scannedMedication,
  onAcknowledge,
  onDismiss 
}: DrugInteractionAlertProps) {
  if (!interactions || interactions.length === 0) return null;

  // Sort interactions by severity
  const sortedInteractions = [...interactions].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  const highestSeverity = sortedInteractions[0].severity;
  const config = severityConfig[highestSeverity];
  const Icon = config.icon;

  const hasSerious = ['contraindicated', 'major'].includes(highestSeverity);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <Card className={`max-w-lg w-full max-h-[80vh] overflow-hidden border-2 ${config.bgClass} shadow-2xl`}>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${config.bgClass}`}>
                <Icon className={`w-8 h-8 ${config.iconClass}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${config.badgeClass}`}>
                    {config.label} INTERACTION
                  </span>
                  {onDismiss && (
                    <button onClick={onDismiss} className="ml-auto p-1 hover:bg-muted rounded">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-bold">
                  Drug Interaction Warning
                </h3>
                <p className="text-sm text-muted-foreground">
                  {scannedMedication} may interact with your medications
                </p>
              </div>
            </div>

            {/* Interactions List */}
            <div className="space-y-3">
              {sortedInteractions.map((interaction, index) => {
                const iConfig = severityConfig[interaction.severity];
                const IIcon = iConfig.icon;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${iConfig.bgClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <IIcon className={`w-5 h-5 mt-0.5 ${iConfig.iconClass} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold">{interaction.medication}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${iConfig.badgeClass}`}>
                            {iConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 mb-2">
                          {interaction.effect}
                        </p>
                        <div className="text-xs space-y-1">
                          <p className="text-muted-foreground">
                            <span className="font-medium">Mechanism:</span> {interaction.mechanism}
                          </p>
                          <p className={`font-medium ${iConfig.iconClass}`}>
                            ⚡ {interaction.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">⚕️ Important Disclaimer</p>
              <p>
                This information is for educational purposes only and is not a substitute for 
                professional medical advice. Always consult your doctor or pharmacist about 
                potential drug interactions before starting any new medication.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={onAcknowledge}
                className="flex-1"
                variant={hasSerious ? "destructive" : "default"}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I Understand the Risks
              </Button>
            </div>

            {hasSerious && (
              <p className="text-center text-xs text-red-500 font-medium">
                ⚠️ Please consult your healthcare provider before taking this medication
              </p>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
