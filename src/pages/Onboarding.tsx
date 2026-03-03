import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Loader2 } from "lucide-react";

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkOnboardingStatus();
    }
  }, [user, loading, navigate]);

  const checkOnboardingStatus = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user!.id)
        .maybeSingle();

      if (data?.onboarding_completed) {
        navigate("/scanner");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleComplete = () => {
    // Navigate happens in the wizard component
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <OnboardingWizard userId={user.id} user={user} onComplete={handleComplete} />;
};

export default Onboarding;
