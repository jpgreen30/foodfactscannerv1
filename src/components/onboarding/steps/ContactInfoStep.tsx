import { motion } from "framer-motion";
import { Phone, Shield, AlertTriangle, User, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

interface ContactInfoStepProps {
  data: {
    firstName: string;
    lastName: string;
    phone: string;
    smsConsent: boolean;
    legalConsent: boolean;
  };
  onChange: (updates: Partial<ContactInfoStepProps["data"]>) => void;
}

export const ContactInfoStep = ({ data, onChange }: ContactInfoStepProps) => {
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({ phone: formatted });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(239, 68, 68, 0.4)",
                "0 0 40px rgba(239, 68, 68, 0.6)",
                "0 0 20px rgba(239, 68, 68, 0.4)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-danger/20 flex items-center justify-center border-2 border-danger"
          >
            <Shield className="w-10 h-10 text-danger" />
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-danger text-sm font-bold tracking-widest uppercase"
          >
            Complete Your Protection
          </motion.p>
          <h2 className="text-2xl font-bold text-foreground">
            STAY PROTECTED
          </h2>
          <p className="text-muted-foreground text-sm">
            We need your contact info for emergency recall alerts
          </p>
        </div>
      </motion.div>

      {/* Warning Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-danger/10 border border-danger/30 rounded-lg p-4"
      >
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">
            Complete your profile to receive <span className="text-danger font-semibold">instant alerts</span> when products you've scanned are recalled or found to contain harmful ingredients.
          </p>
        </div>
      </motion.div>

      {/* Form Inputs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        {/* Name Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="First Name"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              className="pl-12 h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Last Name"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              className="h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Phone Input */}
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-danger" />
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={data.phone}
            onChange={handlePhoneChange}
            maxLength={14}
            className="pl-12 h-14 text-lg bg-muted/50 border-danger/30 text-foreground placeholder:text-muted-foreground focus:border-danger focus:ring-danger"
          />
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="smsConsent"
              checked={data.smsConsent}
              onCheckedChange={(checked) => onChange({ smsConsent: checked === true })}
              className="mt-1 border-danger/50 data-[state=checked]:bg-danger data-[state=checked]:border-danger"
            />
            <Label htmlFor="smsConsent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
              I want to receive <span className="text-danger font-semibold">emergency SMS alerts</span> when products I've scanned are recalled or found to be dangerous.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="legalConsent"
              checked={data.legalConsent}
              onCheckedChange={(checked) => onChange({ legalConsent: checked === true })}
              className="mt-1 border-danger/50 data-[state=checked]:bg-danger data-[state=checked]:border-danger"
            />
            <Label htmlFor="legalConsent" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
              I consent to being contacted about <span className="text-danger font-semibold">legal options</span> if I've been exposed to harmful or recalled products.
            </Label>
          </div>
        </div>
      </motion.div>

      {/* Security Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-2 pt-4"
      >
        <Shield className="w-4 h-4 text-safe" />
        <span className="text-xs text-muted-foreground">
          Your information is encrypted and protected
        </span>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 gap-3 pt-2"
      >
        {[
          { icon: Zap, text: "Instant Alerts" },
          { icon: Shield, text: "24/7 Monitoring" },
        ].map((feature, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 border border-border"
          >
            <feature.icon className="w-4 h-4 text-danger" />
            <span className="text-sm text-muted-foreground">{feature.text}</span>
          </div>
        ))}
      </motion.div>

      <p className="text-xs text-center text-muted-foreground pt-2">
        Standard message rates apply. Text STOP to unsubscribe anytime.
        <br />
        By continuing, you agree to our{" "}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
};
