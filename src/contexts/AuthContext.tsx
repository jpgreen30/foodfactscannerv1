import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { triggerUserSignupWebhook } from "@/services/zapierIntegration";
import { trackSignUp, trackLogin } from "@/lib/analytics";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string, phone?: string, smsConsent?: boolean, legalConsent?: boolean) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo mode
    const urlParams = new URLSearchParams(window.location.search);
    const isDemo = urlParams.get('demo') === '1' || localStorage.getItem('demo_mode') === 'true';
    
    if (isDemo) {
      // Set mock demo user
      const demoUser = {
        id: 'demo-user-123',
        email: 'demo@foodfactscanner.com',
        user_metadata: { firstName: 'Demo', lastName: 'User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User;
      
      const demoSession = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: demoUser,
      } as Session;
      
      setUser(demoUser);
      setSession(demoSession);
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, phone?: string, smsConsent?: boolean, legalConsent?: boolean) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Capture IP address and geo location
    let ipData: { ip?: string; city?: string; region?: string; country?: string } = {};
    try {
      const ipResponse = await fetch('https://ipapi.co/json/');
      if (ipResponse.ok) {
        const ipJson = await ipResponse.json();
        ipData = {
          ip: ipJson.ip,
          city: ipJson.city,
          region: ipJson.region,
          country: ipJson.country_name
        };
      }
    } catch (ipError) {
      console.log('[Auth] Could not fetch IP address:', ipError);
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          display_name: firstName && lastName ? `${firstName} ${lastName}`.trim() : undefined
        }
      }
    });
    
    // Trigger Zapier webhook, Klaviyo sync, and analytics for new signups
    if (!error && data.user) {
      // Track signup in Google Analytics
      trackSignUp("email");
      
      // Format phone number for storage
      const phoneDigits = phone?.replace(/\D/g, "") || "";
      const formattedPhone = phoneDigits.length === 10 ? `+1${phoneDigits}` : null;
      
      // Update profile with phone number, SMS consent, and signup location FIRST
      const profileUpdates: Record<string, any> = {};
      if (formattedPhone) profileUpdates.phone_number = formattedPhone;
      if (smsConsent !== undefined) profileUpdates.wants_recall_sms = smsConsent && !!formattedPhone;
      if (ipData.ip) profileUpdates.signup_ip = ipData.ip;
      if (ipData.city) profileUpdates.signup_location = ipData;
      
      if (Object.keys(profileUpdates).length > 0) {
        await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", data.user.id);
      }
      
      // Auto-sync new user to Klaviyo AFTER profile DB update (so phone/location are available)
      supabase.functions.invoke('klaviyo-sync', {
        body: {
          action: 'auto_sync_new_user',
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone_number: formattedPhone,
          signup_ip: ipData.ip || null,
          signup_location: ipData.city ? ipData : null,
        }
      }).catch(err => console.error('[Klaviyo] Auto-sync error:', err));
      
      // Create legal lead if legal consent given and phone provided
      if (formattedPhone && legalConsent) {
        await supabase
          .from("legal_leads")
          .insert({
            user_id: data.user.id,
            phone_number: formattedPhone,
            email: email,
            first_name: firstName,
            last_name: lastName,
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
            lead_source: "registration",
          });
      }
      
      // Notify admin of new registration with IP address
      supabase.functions.invoke('notify-admin-registration', {
        body: {
          user_id: data.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone_number: formattedPhone,
          ip_address: ipData.ip,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          signup_source: 'web_app',
          geo_location: ipData.city ? ipData : null
        }
      }).catch(notifyError => {
        // Don't fail signup if admin notification fails
        console.error('[Auth] Admin notification error:', notifyError);
      });
      
      triggerUserSignupWebhook({
        user_id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
        signup_source: "web_app",
      }).catch(webhookError => {
        // Don't fail signup if webhook fails
        console.error('[Zapier] Signup webhook error:', webhookError);
      });
    }
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Track login in Google Analytics
    if (!error) {
      trackLogin("email");
    }
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
