import { motion } from "framer-motion";
import { 
  User, 
  Edit2, 
  Trash2, 
  Check, 
  Heart, 
  Leaf, 
  Wheat, 
  Milk, 
  Baby,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FamilyProfile {
  id: string;
  name: string;
  relationship?: string;
  age_group?: string;
  avatar_color: string;
  is_default: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  is_diabetic: boolean;
  is_pregnant: boolean;
  is_heart_healthy: boolean;
  health_conditions: string[];
  allergies_detailed: string[];
}

interface FamilyProfileCardProps {
  profile: FamilyProfile;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
}

export const FamilyProfileCard = ({
  profile,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  selectable = false,
}: FamilyProfileCardProps) => {
  const getHealthIcons = () => {
    const icons = [];
    if (profile.is_vegan) icons.push({ icon: Leaf, label: "Vegan" });
    if (profile.is_gluten_free) icons.push({ icon: Wheat, label: "Gluten-Free" });
    if (profile.is_dairy_free) icons.push({ icon: Milk, label: "Dairy-Free" });
    if (profile.is_diabetic) icons.push({ icon: AlertTriangle, label: "Diabetic" });
    if (profile.is_pregnant) icons.push({ icon: Baby, label: "Pregnant" });
    if (profile.is_heart_healthy) icons.push({ icon: Heart, label: "Heart Health" });
    return icons;
  };

  const healthIcons = getHealthIcons();
  const allergyCount = profile.allergies_detailed?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border-2 transition-all cursor-pointer",
        isSelected 
          ? "bg-safe/20 border-safe" 
          : "bg-muted/50 border-border hover:border-muted-foreground"
      )}
      onClick={selectable ? onSelect : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-foreground font-bold text-lg"
          style={{ backgroundColor: profile.avatar_color }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground truncate">{profile.name}</h3>
            {profile.is_default && (
              <span className="px-2 py-0.5 text-xs bg-safe/20 text-safe rounded-full">
                Default
              </span>
            )}
            {isSelected && (
              <Check className="w-4 h-4 text-safe" />
            )}
          </div>
          
          {profile.relationship && (
            <p className="text-sm text-muted-foreground">{profile.relationship}</p>
          )}
          
          {profile.age_group && (
            <p className="text-xs text-muted-foreground/70">{profile.age_group}</p>
          )}

          {/* Health Icons */}
          {(healthIcons.length > 0 || allergyCount > 0) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {healthIcons.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-md bg-caution/20 flex items-center justify-center"
                  title={item.label}
                >
                  <item.icon className="w-3 h-3 text-caution" />
                </div>
              ))}
              {healthIcons.length > 3 && (
                <span className="text-xs text-muted-foreground">{healthIcons.length - 3}</span>
              )}
              {allergyCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-danger/20 text-danger rounded-full">
                  {allergyCount} allerg{allergyCount === 1 ? 'y' : 'ies'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!selectable && (onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="h-8 w-8 text-danger/60 hover:text-danger hover:bg-danger/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
