import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Baby, 
  Brain, 
  HeartPulse, 
  Pill, 
  Stethoscope,
  Clock,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SymptomData {
  symptom: string;
  category: string;
  severity: "mild" | "moderate" | "severe";
  duration: string;
  whoAffected: string;
}

interface SymptomTrackerProps {
  selectedSymptoms: SymptomData[];
  onSymptomsChange: (symptoms: SymptomData[]) => void;
  familyAffected: string[];
  onFamilyAffectedChange: (members: string[]) => void;
  compact?: boolean;
}

const SYMPTOM_CATEGORIES = [
  {
    id: "digestive",
    label: "Digestive Issues",
    icon: Stethoscope,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    symptoms: [
      "Stomach pain",
      "Nausea/Vomiting",
      "Diarrhea",
      "Bloating",
      "Acid reflux",
      "Loss of appetite",
    ],
  },
  {
    id: "neurological",
    label: "Neurological",
    icon: Brain,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    symptoms: [
      "Headaches/Migraines",
      "Brain fog",
      "Dizziness",
      "Chronic fatigue",
      "Memory issues",
      "Mood changes/Anxiety",
    ],
  },
  {
    id: "skin",
    label: "Skin Reactions",
    icon: HeartPulse,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    symptoms: [
      "Rashes",
      "Hives",
      "Eczema flare-up",
      "Itching",
      "Swelling",
    ],
  },
  {
    id: "allergic",
    label: "Allergic Reactions",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    symptoms: [
      "Difficulty breathing",
      "Throat tightness",
      "Anaphylaxis",
      "Swollen lips/tongue",
    ],
  },
  {
    id: "children",
    label: "Children's Symptoms",
    icon: Baby,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    symptoms: [
      "Behavioral changes",
      "Hyperactivity/ADHD symptoms",
      "Sleep issues",
      "Developmental concerns",
      "Irritability",
      "Poor concentration",
    ],
  },
];

const DURATION_OPTIONS = [
  { value: "just_started", label: "Just started" },
  { value: "days", label: "A few days" },
  { value: "weeks", label: "1-4 weeks" },
  { value: "months", label: "1-6 months" },
  { value: "over_6_months", label: "Over 6 months" },
  { value: "years", label: "Years" },
];

const WHO_AFFECTED_OPTIONS = [
  { value: "me", label: "Me" },
  { value: "child_under_2", label: "Child under 2" },
  { value: "child_2_5", label: "Child (2-5 years)" },
  { value: "child_6_12", label: "Child (6-12 years)" },
  { value: "teenager", label: "Teenager" },
  { value: "spouse", label: "Spouse/Partner" },
  { value: "multiple", label: "Multiple family members" },
];

export const SymptomTracker = ({
  selectedSymptoms,
  onSymptomsChange,
  familyAffected,
  onFamilyAffectedChange,
  compact = false,
}: SymptomTrackerProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    compact ? [] : ["digestive", "neurological"]
  );
  const [globalSeverity, setGlobalSeverity] = useState<"mild" | "moderate" | "severe">("moderate");
  const [globalDuration, setGlobalDuration] = useState("weeks");
  const [globalWhoAffected, setGlobalWhoAffected] = useState("me");

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSymptom = (symptom: string, category: string) => {
    const existing = selectedSymptoms.find((s) => s.symptom === symptom);
    if (existing) {
      onSymptomsChange(selectedSymptoms.filter((s) => s.symptom !== symptom));
    } else {
      onSymptomsChange([
        ...selectedSymptoms,
        {
          symptom,
          category,
          severity: globalSeverity,
          duration: globalDuration,
          whoAffected: globalWhoAffected,
        },
      ]);
    }
  };

  const updateSymptomDetails = (
    symptom: string,
    field: keyof SymptomData,
    value: string
  ) => {
    onSymptomsChange(
      selectedSymptoms.map((s) =>
        s.symptom === symptom ? { ...s, [field]: value } : s
      )
    );
  };

  const toggleFamilyMember = (member: string) => {
    if (familyAffected.includes(member)) {
      onFamilyAffectedChange(familyAffected.filter((m) => m !== member));
    } else {
      onFamilyAffectedChange([...familyAffected, member]);
    }
  };

  const getSelectedCount = (categoryId: string) => {
    const category = SYMPTOM_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return 0;
    return selectedSymptoms.filter((s) =>
      category.symptoms.includes(s.symptom)
    ).length;
  };

  return (
    <div className="space-y-4">
      {/* Global Settings */}
      {!compact && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Quick Settings (applies to new symptoms)
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Severity</Label>
              <Select value={globalSeverity} onValueChange={(v) => setGlobalSeverity(v as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <Select value={globalDuration} onValueChange={setGlobalDuration}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Who</Label>
              <Select value={globalWhoAffected} onValueChange={setGlobalWhoAffected}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHO_AFFECTED_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Symptom Categories */}
      <div className="space-y-2">
        {SYMPTOM_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          const selectedCount = getSelectedCount(category.id);

          return (
            <div
              key={category.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between p-3 transition-colors ${
                  selectedCount > 0 ? category.bgColor : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${category.color}`} />
                  <span className="font-medium text-sm text-foreground">
                    {category.label}
                  </span>
                  {selectedCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}
                    </Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Symptoms List */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-3 grid grid-cols-1 gap-2">
                    {category.symptoms.map((symptom) => {
                      const isSelected = selectedSymptoms.some(
                        (s) => s.symptom === symptom
                      );
                      const symptomData = selectedSymptoms.find(
                        (s) => s.symptom === symptom
                      );

                      return (
                        <div key={symptom} className="space-y-2">
                          <label
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? "bg-danger/10 border border-danger/30"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleSymptom(symptom, category.id)
                              }
                            />
                            <span className="text-sm text-foreground">
                              {symptom}
                            </span>
                          </label>

                          {/* Individual symptom settings */}
                          {isSelected && symptomData && !compact && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="ml-8 grid grid-cols-3 gap-2 pb-2"
                            >
                              <Select
                                value={symptomData.severity}
                                onValueChange={(v) =>
                                  updateSymptomDetails(symptom, "severity", v)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mild">Mild</SelectItem>
                                  <SelectItem value="moderate">Moderate</SelectItem>
                                  <SelectItem value="severe">Severe</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={symptomData.duration}
                                onValueChange={(v) =>
                                  updateSymptomDetails(symptom, "duration", v)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Duration" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DURATION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={symptomData.whoAffected}
                                onValueChange={(v) =>
                                  updateSymptomDetails(symptom, "whoAffected", v)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Who" />
                                </SelectTrigger>
                                <SelectContent>
                                  {WHO_AFFECTED_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Family Members Affected */}
      {!compact && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Who in your family has been affected?
          </h4>
          <div className="flex flex-wrap gap-2">
            {WHO_AFFECTED_OPTIONS.map((member) => (
              <button
                key={member.value}
                type="button"
                onClick={() => toggleFamilyMember(member.value)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  familyAffected.includes(member.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border hover:border-primary/50"
                }`}
              >
                {member.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedSymptoms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-danger/10 border border-danger/30 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? "s" : ""} selected
            </span>
            {selectedSymptoms.some((s) => s.severity === "severe") && (
              <Badge variant="destructive" className="text-xs">
                Severe symptoms reported
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            These symptoms strengthen your case. Law firms typically see{" "}
            <span className="text-safe font-medium">higher settlements</span> when symptoms are documented.
          </p>
        </motion.div>
      )}
    </div>
  );
};
