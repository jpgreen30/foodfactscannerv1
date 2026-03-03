import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  X, 
  Save, 
  Loader2,
  Leaf,
  Wheat,
  Milk,
  AlertTriangle,
  Baby,
  Heart
} from "lucide-react";

const AVATAR_COLORS = [
  "hsl(0, 70%, 50%)",
  "hsl(30, 70%, 50%)",
  "hsl(60, 70%, 45%)",
  "hsl(120, 70%, 40%)",
  "hsl(180, 70%, 45%)",
  "hsl(210, 70%, 50%)",
  "hsl(270, 70%, 50%)",
  "hsl(330, 70%, 50%)",
];

const RELATIONSHIPS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Partner",
  "Other",
];

const AGE_GROUPS = [
  "Infant (0-2)",
  "Child (3-12)",
  "Teen (13-17)",
  "Young Adult (18-30)",
  "Adult (31-50)",
  "Middle Age (51-65)",
  "Senior (65+)",
];

const COMMON_ALLERGIES = [
  "Peanuts",
  "Tree Nuts",
  "Milk",
  "Eggs",
  "Wheat",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
];

interface FamilyProfileFormData {
  name: string;
  relationship: string;
  age_group: string;
  avatar_color: string;
  is_default: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  is_diabetic: boolean;
  is_pregnant: boolean;
  is_heart_healthy: boolean;
  allergies_detailed: string[];
  allergy_notes: string;
}

interface FamilyProfileFormProps {
  initialData?: Partial<FamilyProfileFormData>;
  onSubmit: (data: FamilyProfileFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const FamilyProfileForm = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: FamilyProfileFormProps) => {
  const [formData, setFormData] = useState<FamilyProfileFormData>({
    name: initialData?.name || "",
    relationship: initialData?.relationship || "",
    age_group: initialData?.age_group || "",
    avatar_color: initialData?.avatar_color || AVATAR_COLORS[0],
    is_default: initialData?.is_default || false,
    is_vegan: initialData?.is_vegan || false,
    is_gluten_free: initialData?.is_gluten_free || false,
    is_dairy_free: initialData?.is_dairy_free || false,
    is_diabetic: initialData?.is_diabetic || false,
    is_pregnant: initialData?.is_pregnant || false,
    is_heart_healthy: initialData?.is_heart_healthy || false,
    allergies_detailed: initialData?.allergies_detailed || [],
    allergy_notes: initialData?.allergy_notes || "",
  });

  const toggleAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies_detailed: prev.allergies_detailed.includes(allergy)
        ? prev.allergies_detailed.filter(a => a !== allergy)
        : [...prev.allergies_detailed, allergy],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {/* Avatar Color Picker */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Color</Label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar_color: color }))}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    formData.avatar_color === color ? "scale-110 ring-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="name" className="text-muted-foreground">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Family member's name"
              required
              className="bg-muted/50 border-border text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Relationship</Label>
              <Select
                value={formData.relationship}
                onValueChange={v => setFormData(prev => ({ ...prev, relationship: v }))}
              >
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground">Age Group</Label>
              <Select
                value={formData.age_group}
                onValueChange={v => setFormData(prev => ({ ...prev, age_group: v }))}
              >
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="space-y-3">
        <h3 className="font-bold text-foreground">Dietary Preferences</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "is_vegan", label: "Vegan", icon: Leaf },
            { key: "is_gluten_free", label: "Gluten-Free", icon: Wheat },
            { key: "is_dairy_free", label: "Dairy-Free", icon: Milk },
            { key: "is_diabetic", label: "Diabetic", icon: AlertTriangle },
            { key: "is_pregnant", label: "Pregnant", icon: Baby },
            { key: "is_heart_healthy", label: "Heart Health", icon: Heart },
          ].map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-caution" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <Switch
                checked={formData[item.key as keyof FamilyProfileFormData] as boolean}
                onCheckedChange={v => setFormData(prev => ({ ...prev, [item.key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-3">
        <h3 className="font-bold text-foreground">Allergies</h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGIES.map(allergy => (
            <button
              key={allergy}
              type="button"
              onClick={() => toggleAllergy(allergy)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                formData.allergies_detailed.includes(allergy)
                  ? "bg-danger text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
        <Textarea
          value={formData.allergy_notes}
          onChange={e => setFormData(prev => ({ ...prev, allergy_notes: e.target.value }))}
          placeholder="Additional allergy notes..."
          className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Default Profile Toggle */}
      <div className="flex items-center justify-between p-3 bg-safe/10 rounded-lg border border-safe/20">
        <div>
          <p className="font-medium text-foreground">Set as Default</p>
          <p className="text-xs text-muted-foreground">Use this profile by default when scanning</p>
        </div>
        <Switch
          checked={formData.is_default}
          onCheckedChange={v => setFormData(prev => ({ ...prev, is_default: v }))}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-border text-foreground hover:bg-muted"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !formData.name.trim()}
          className="flex-1 bg-safe hover:bg-safe/90 text-foreground"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
};
