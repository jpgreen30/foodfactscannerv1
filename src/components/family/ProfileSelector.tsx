import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { ChevronDown, User, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FamilyProfile {
  id: string;
  name: string;
  avatar_color: string;
  is_default: boolean;
}

interface ProfileSelectorProps {
  selectedProfileId: string | null;
  onProfileChange: (profileId: string | null, profileData: any) => void;
}

export const ProfileSelector = ({ selectedProfileId, onProfileChange }: ProfileSelectorProps) => {
  const { user } = useAuth();
  const { getEffectiveTier } = useDebug();
  const [isOpen, setIsOpen] = useState(false);
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([]);
  const [mainProfile, setMainProfile] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      // Fetch main profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (profile) {
        setMainProfile(profile);
        setSubscriptionTier(profile.subscription_tier || "free");
        
        // If no profile selected yet, select main profile
        if (!selectedProfileId) {
          onProfileChange(null, profile);
        }
      }

      // Fetch family profiles if user has access
      if (profile?.subscription_tier === "family" || profile?.subscription_tier === "pro") {
        const { data: familyData } = await supabase
          .from("family_profiles")
          .select("id, name, avatar_color, is_default")
          .eq("user_id", user!.id)
          .order("is_default", { ascending: false });

        setFamilyProfiles(familyData || []);

        // If there's a default family profile, select it
        const defaultFamily = familyData?.find(p => p.is_default);
        if (defaultFamily && !selectedProfileId) {
          const { data: fullProfile } = await supabase
            .from("family_profiles")
            .select("*")
            .eq("id", defaultFamily.id)
            .maybeSingle();
          
          if (fullProfile) {
            onProfileChange(defaultFamily.id, fullProfile);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const handleSelectProfile = async (profileId: string | null) => {
    if (profileId === null) {
      // Selected main profile
      onProfileChange(null, mainProfile);
    } else {
      // Selected family profile
      const { data: profile } = await supabase
        .from("family_profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();

      if (profile) {
        onProfileChange(profileId, profile);
      }
    }
    setIsOpen(false);
  };

  const effectiveTier = getEffectiveTier(subscriptionTier);
  const hasAccess = effectiveTier === "family" || effectiveTier === "pro";

  // Don't show selector if no family profiles and no access
  if (!hasAccess || familyProfiles.length === 0) {
    return null;
  }

  const selectedName = selectedProfileId
    ? familyProfiles.find(p => p.id === selectedProfileId)?.name || "Family Member"
    : mainProfile?.display_name || "Me";

  const selectedColor = selectedProfileId
    ? familyProfiles.find(p => p.id === selectedProfileId)?.avatar_color || "hsl(210, 70%, 50%)"
    : "hsl(210, 70%, 50%)";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-xl border border-border hover:border-muted-foreground transition-colors"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold"
          style={{ backgroundColor: selectedColor }}
        >
          {selectedProfileId ? selectedName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
        </div>
        <span className="text-sm text-foreground font-medium">{selectedName}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 border-b border-border">
                <p className="text-xs text-muted-foreground px-2">Scanning for:</p>
              </div>
              
              {/* Main Profile */}
              <button
                onClick={() => handleSelectProfile(null)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors",
                  !selectedProfileId && "bg-safe/10"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">
                    {mainProfile?.display_name || "Me"} (You)
                  </p>
                </div>
                {!selectedProfileId && <Check className="w-4 h-4 text-safe" />}
              </button>

              {/* Family Profiles */}
              {familyProfiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors",
                    selectedProfileId === profile.id && "bg-safe/10"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-foreground font-bold"
                    style={{ backgroundColor: profile.avatar_color }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{profile.name}</p>
                    {profile.is_default && (
                      <span className="text-xs text-safe">Default</span>
                    )}
                  </div>
                  {selectedProfileId === profile.id && <Check className="w-4 h-4 text-safe" />}
                </button>
              ))}

              <div className="p-2 border-t border-border">
                <a
                  href="/family-profiles"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Users className="w-4 h-4" />
                  Manage Family Profiles
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
