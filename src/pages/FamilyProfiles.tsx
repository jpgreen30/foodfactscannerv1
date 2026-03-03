import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { FamilyProfileCard } from "@/components/family/FamilyProfileCard";
import { FamilyProfileForm } from "@/components/family/FamilyProfileForm";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Plus,
  Loader2,
  Lock,
  ArrowLeft,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { hasFamilyAccess, hasPremiumFeatures, getMaxFamilyProfiles } from "@/lib/subscriptionUtils";
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

interface FamilyProfile {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  age_group: string | null;
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
  allergy_notes: string | null;
}

const FamilyProfiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getEffectiveTier } = useDebug();
  
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyProfile | null>(null);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch subscription tier
      const { data: profileData } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();

      if (profileData) {
        setSubscriptionTier(profileData.subscription_tier || "free");
      }

      // Fetch family profiles
      const { data: familyData, error } = await supabase
        .from("family_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setProfiles(familyData?.map(p => ({
        ...p,
        health_conditions: (p.health_conditions as string[]) || [],
        allergies_detailed: (p.allergies_detailed as string[]) || [],
      })) || []);
    } catch (error) {
      console.error("Error fetching family profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load family profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canAddProfile = () => {
    const effectiveTier = getEffectiveTier(subscriptionTier);
    const maxProfiles = getMaxFamilyProfiles(effectiveTier);
    if (maxProfiles === 0) return false;
    return profiles.length < maxProfiles;
  };

  const getProfileLimit = () => {
    const effectiveTier = getEffectiveTier(subscriptionTier);
    const limit = getMaxFamilyProfiles(effectiveTier);
    return limit === 0 ? "0" : limit.toString();
  };

  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from("family_profiles")
          .update({ is_default: false })
          .eq("user_id", user!.id);
      }

      if (editingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("family_profiles")
          .update({
            name: data.name,
            relationship: data.relationship || null,
            age_group: data.age_group || null,
            avatar_color: data.avatar_color,
            is_default: data.is_default,
            is_vegan: data.is_vegan,
            is_gluten_free: data.is_gluten_free,
            is_dairy_free: data.is_dairy_free,
            is_diabetic: data.is_diabetic,
            is_pregnant: data.is_pregnant,
            is_heart_healthy: data.is_heart_healthy,
            allergies_detailed: data.allergies_detailed,
            allergy_notes: data.allergy_notes || null,
          })
          .eq("id", editingProfile.id);

        if (error) throw error;

        toast({ title: "Profile Updated", description: `${data.name}'s profile has been updated` });
      } else {
        // Create new profile
        const { error } = await supabase
          .from("family_profiles")
          .insert({
            user_id: user!.id,
            name: data.name,
            relationship: data.relationship || null,
            age_group: data.age_group || null,
            avatar_color: data.avatar_color,
            is_default: data.is_default,
            is_vegan: data.is_vegan,
            is_gluten_free: data.is_gluten_free,
            is_dairy_free: data.is_dairy_free,
            is_diabetic: data.is_diabetic,
            is_pregnant: data.is_pregnant,
            is_heart_healthy: data.is_heart_healthy,
            allergies_detailed: data.allergies_detailed,
            allergy_notes: data.allergy_notes || null,
          });

        if (error) throw error;

        toast({ title: "Profile Created", description: `${data.name} has been added to your family` });
      }

      setShowForm(false);
      setEditingProfile(null);
      fetchData();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProfileId) return;

    try {
      const { error } = await supabase
        .from("family_profiles")
        .delete()
        .eq("id", deleteProfileId);

      if (error) throw error;

      toast({ title: "Profile Deleted", description: "Family member has been removed" });
      setDeleteProfileId(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <AppLayout>
      <div className="py-12 text-center">
          <Lock className="w-12 h-12 mx-auto text-danger mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to manage family profiles</p>
          <Button onClick={() => navigate("/auth")} className="bg-danger hover:bg-danger/90">
            Sign In
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-danger" />
        </div>
      </AppLayout>
    );
  }

  // Check if user has access to family profiles
  const effectiveTier = getEffectiveTier(subscriptionTier);
  const hasAccess = hasFamilyAccess(effectiveTier);

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 py-8"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-caution/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-caution" />
            </div>
            <h1 className="text-2xl font-black text-foreground uppercase">
              Family Profiles
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Protect your entire family with personalized health warnings for each member
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-primary/10 rounded-2xl border-2 border-primary"
          >
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-primary" />
              <div>
                <h2 className="font-bold text-foreground">Upgrade to Family Plan</h2>
                <p className="text-sm text-muted-foreground">$14.99/month</p>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-primary" />
                Add up to 5 family members
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Personalized warnings for each person
              </li>
            </ul>

            <Button
              onClick={() => navigate("/subscription")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/profile")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground uppercase">
            Family Profiles
          </h1>
          <p className="text-muted-foreground">
            {profiles.length} of {getProfileLimit()} profiles used
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {showForm || editingProfile ? (
            <FamilyProfileForm
              key="form"
              initialData={editingProfile || undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingProfile(null); }}
              isLoading={isSaving}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Add Button */}
              {canAddProfile() && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="w-full gap-2 bg-safe hover:bg-safe/90 text-foreground"
                >
                  <Plus className="w-5 h-5" />
                  Add Family Member
                </Button>
              )}

              {!canAddProfile() && subscriptionTier === "family" && (
                <div className="p-3 bg-caution/20 rounded-lg border border-caution/30 text-center">
                  <p className="text-sm text-foreground">
                    <span className="font-bold text-caution">Profile limit reached.</span>
                    {" "}Upgrade to Pro for unlimited profiles.
                  </p>
                </div>
              )}

              {/* Profiles List */}
              {profiles.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No family profiles yet</p>
                  <p className="text-sm text-muted-foreground/70">Add your first family member above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profiles.map(profile => (
                    <FamilyProfileCard
                      key={profile.id}
                      profile={profile}
                      onEdit={() => setEditingProfile(profile)}
                      onDelete={() => setDeleteProfileId(profile.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
          <AlertDialogContent className="bg-background border-danger/30">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete Family Profile?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete this family member's profile and their health settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-foreground hover:bg-muted">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-danger hover:bg-danger/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default FamilyProfiles;
