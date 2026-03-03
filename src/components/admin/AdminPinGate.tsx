import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, KeyRound, Loader2 } from "lucide-react";

interface AdminPinGateProps {
  onVerified: () => void;
}

const SESSION_KEY = "admin_session_token";
const SESSION_EXPIRY_KEY = "admin_session_expiry";

export const AdminPinGate = ({ onVerified }: AdminPinGateProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setIsLoading(true);
    try {
      // Check if we have a valid session in localStorage
      const storedToken = localStorage.getItem(SESSION_KEY);
      const storedExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);
      
      if (storedToken && storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        if (Date.now() < expiryTime) {
          // Validate with server
          const { data: isValid } = await supabase.rpc("validate_admin_session", {
            session_token: storedToken
          });
          
          if (isValid) {
            onVerified();
            return;
          }
        }
        // Session expired or invalid, clear it
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
      }
      
      // Check if admin has PIN set
      const { data: hasPinSet } = await supabase.rpc("admin_has_pin");
      setHasPin(hasPinSet ?? false);
    } catch (error) {
      console.error("Session check error:", error);
      setHasPin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length < 4) {
      toast({
        title: "PIN Too Short",
        description: "PIN must be at least 4 characters.",
        variant: "destructive",
      });
      return;
    }
    
    if (pin !== confirmPin) {
      toast({
        title: "PINs Don't Match",
        description: "Please make sure both PINs match.",
        variant: "destructive",
      });
      return;
    }

    setIsSettingPin(true);
    try {
      const { data: success, error } = await supabase.rpc("set_admin_pin", {
        new_pin: pin
      });
      
      if (error) throw error;
      
      if (success) {
        toast({
          title: "PIN Set Successfully",
          description: "Your admin PIN has been configured.",
        });
        
        // Create session and proceed
        await createSessionAndProceed();
      } else {
        throw new Error("Failed to set PIN");
      }
    } catch (error: any) {
      toast({
        title: "Error Setting PIN",
        description: error.message || "Could not set admin PIN.",
        variant: "destructive",
      });
    } finally {
      setIsSettingPin(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!pin) {
      toast({
        title: "PIN Required",
        description: "Please enter your admin PIN.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data: isValid, error } = await supabase.rpc("verify_admin_pin", {
        pin_input: pin
      });
      
      if (error) throw error;
      
      if (isValid) {
        await createSessionAndProceed();
      } else {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify PIN.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const createSessionAndProceed = async () => {
    try {
      const { data: sessionToken, error } = await supabase.rpc("create_admin_session");
      
      if (error) throw error;
      
      if (sessionToken) {
        // Store session for 4 hours
        const expiryTime = Date.now() + (4 * 60 * 60 * 1000);
        localStorage.setItem(SESSION_KEY, sessionToken);
        localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
        onVerified();
      }
    } catch (error) {
      console.error("Session creation error:", error);
      onVerified(); // Fallback to allowing access if session creation fails
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-[60vh] px-4"
    >
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {hasPin ? "Admin Verification" : "Set Admin PIN"}
          </CardTitle>
          <CardDescription>
            {hasPin 
              ? "Enter your PIN to access the admin dashboard"
              : "Create a secure PIN to protect the admin area"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {hasPin ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pin" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Admin PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPin()}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
              
              <Button 
                onClick={handleVerifyPin} 
                className="w-full gap-2"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Verify & Access Dashboard
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-pin" className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Create PIN (min. 4 characters)
                </Label>
                <Input
                  id="new-pin"
                  type="password"
                  placeholder="Enter new PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  placeholder="Confirm your PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetPin()}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              
              <Button 
                onClick={handleSetPin} 
                className="w-full gap-2"
                disabled={isSettingPin}
              >
                {isSettingPin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Set PIN & Continue
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                This PIN adds an extra layer of security to the admin area.
                Your session will expire after 4 hours of inactivity.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
