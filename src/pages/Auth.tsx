import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2, ArrowLeft, User, Phone, Shield, MessageSquare, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Logo } from "@/components/Logo";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(1, "This field is required").max(50, "Name must be less than 50 characters");

type AuthView = "login" | "signup" | "forgot" | "reset";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(true);
  const [legalConsent, setLegalConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; firstName?: string; lastName?: string }>({});

  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "recovery") {
      setView("reset");
    }
  }, [searchParams]);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Force service worker update to prevent stale SW from intercepting /~oauth routes
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          reg.update();
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; firstName?: string; lastName?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    // Only validate names for signup
    if (view === "signup") {
      const firstNameResult = nameSchema.safeParse(firstName.trim());
      if (!firstNameResult.success) {
        newErrors.firstName = firstNameResult.error.errors[0].message;
      }
      
      const lastNameResult = nameSchema.safeParse(lastName.trim());
      if (!lastNameResult.success) {
        newErrors.lastName = lastNameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link."
        });
        setView("login");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setErrors({ password: passwordResult.error.errors[0].message });
      return;
    }
    
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset."
        });
        navigate("/onboarding");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (view === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Login Failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You're now protected."
          });
          navigate("/onboarding");
        }
      } else {
        const { error } = await signUp(email, password, firstName.trim(), lastName.trim(), phone, smsConsent, legalConsent);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive"
            });
            setView("login");
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "Let's set up your protection profile!"
          });
          navigate("/onboarding");
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password View
  if (view === "forgot") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container max-w-lg mx-auto px-4 py-6">
          <button
            onClick={() => setView("login")}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto rounded-2xl bg-danger flex items-center justify-center shadow-[0_0_30px_hsl(var(--danger)/0.5)]"
              >
                <Mail className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                <p className="text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                    className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-danger">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-danger hover:bg-danger/90 shadow-[0_0_20px_hsl(var(--danger)/0.5)]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  // Reset Password View
  if (view === "reset") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container max-w-lg mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-8"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto rounded-2xl bg-danger flex items-center justify-center shadow-[0_0_30px_hsl(var(--danger)/0.5)]"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
                <p className="text-muted-foreground mt-1">
                  Enter your new password below
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({});
                      }}
                      className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-danger">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({});
                      }}
                      className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-danger">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-danger hover:bg-danger/90 shadow-[0_0_20px_hsl(var(--danger)/0.5)]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container max-w-lg mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <Logo size="md" showGlow />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-foreground uppercase tracking-wide">
                {view === "login" ? "Access Your Shield" : "Start Protection"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {view === "login" 
                  ? "Sign in to continue protecting yourself" 
                  : "Join thousands protecting their families"}
              </p>
            </div>
          </div>

          {/* Google OAuth */}
          <div className="space-y-3">
            {/* Preview host warning */}
            {(() => {
              const isPreview = typeof window !== 'undefined' && /id-preview--.*\.lovable\.app/.test(window.location.hostname);
              if (!isPreview) return null;
              return (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">You're in the preview</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Google sign-in works best from the published app.{" "}
                      <a
                        href="https://food-wise-decode.lovable.app/auth"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium text-foreground"
                      >
                        Open published app →
                      </a>
                    </p>
                  </div>
                </div>
              );
            })()}

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-3 border-border text-foreground hover:bg-muted"
              onClick={async () => {
                if (isLoading) return;
                setIsLoading(true);

                try {
                  console.info("[OAuth] Starting Google sign-in via direct Supabase OAuth", { hostname: window.location.hostname, origin: window.location.origin });
                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: window.location.origin,
                      queryParams: { prompt: "select_account" },
                      skipBrowserRedirect: true,
                    },
                  });
                  if (error) {
                    console.error("[OAuth] Google error:", error);
                    toast({ title: "Google Sign In Failed", description: error.message ?? "Something went wrong. Please try again.", variant: "destructive" });
                  } else if (data?.url) {
                    window.location.href = data.url;
                    return;
                  }
                } catch (err) {
                  console.error("[Auth] Google sign-in error:", err);
                  toast({ title: "Google Sign In Failed", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>



            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Name fields - only show for signup */}
              {view === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setErrors(prev => ({ ...prev, firstName: undefined }));
                        }}
                        className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-sm text-danger">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setErrors(prev => ({ ...prev, lastName: undefined }));
                        }}
                        className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-sm text-danger">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Phone number and consent - only show for signup */}
              {view === "signup" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4 text-danger" />
                      Phone Number (for FDA Recall Alerts)
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          let formatted = digits;
                          if (digits.length <= 3) formatted = digits;
                          else if (digits.length <= 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                          else formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
                          setPhone(formatted);
                        }}
                        className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                        disabled={isLoading}
                        maxLength={14}
                      />
                    </div>
                  </div>

                  {/* SMS Consent */}
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Checkbox
                      id="smsConsent"
                      checked={smsConsent}
                      onCheckedChange={(checked) => setSmsConsent(checked as boolean)}
                      className="mt-0.5 border-border data-[state=checked]:bg-danger data-[state=checked]:border-danger"
                    />
                    <label htmlFor="smsConsent" className="text-sm text-foreground cursor-pointer">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Text me FDA recall alerts
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        Msg & data rates may apply. Reply STOP to unsubscribe.
                      </span>
                    </label>
                  </div>

                  {/* Legal Consent */}
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Checkbox
                      id="legalConsent"
                      checked={legalConsent}
                      onCheckedChange={(checked) => setLegalConsent(checked as boolean)}
                      className="mt-0.5 border-border data-[state=checked]:bg-danger data-[state=checked]:border-danger"
                    />
                    <label htmlFor="legalConsent" className="text-sm text-foreground cursor-pointer">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Shield className="w-3.5 h-3.5" />
                        Contact me about legal options
                      </span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        If products I scan have caused harm, a lawyer may reach out.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-danger">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className="pl-10 bg-white border-border text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-danger">{errors.password}</p>
                )}
              </div>
            </div>

            {view === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-sm text-danger hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-danger hover:bg-danger/90 shadow-[0_0_20px_hsl(var(--danger)/0.5)]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {view === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                view === "login" ? "Access Protection" : "Start Protection"
              )}
            </Button>
          </form>

          {/* Toggle View */}
          <p className="text-center text-muted-foreground">
            {view === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setView("signup")}
                  className="text-danger hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setView("login")}
                  className="text-danger hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
          
          {/* Privacy Policy Link */}
          <p className="text-muted-foreground/60 text-sm">
            By signing up, you agree to our{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
