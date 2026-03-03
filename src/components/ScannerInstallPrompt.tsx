import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Smartphone,
  Zap,
  Bell,
  WifiOff,
  Shield,
  Download,
  X,
} from "lucide-react";

interface ScannerInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  onContinueWeb: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Store the deferred prompt globally
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Listen for the beforeinstallprompt event
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

// Getter so other pages can access the globally-captured prompt
export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

// Clear after use
export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
}

export const ScannerInstallPrompt = ({
  isOpen,
  onClose,
  onInstall,
  onContinueWeb,
}: ScannerInstallPromptProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === "accepted") {
          localStorage.setItem("pwa_installed", "true");
          onInstall();
        } else {
          onContinueWeb();
        }
      } catch (error) {
        console.error("Install prompt error:", error);
        onContinueWeb();
      } finally {
        setIsInstalling(false);
        deferredPrompt = null;
      }
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      // Show manual install instructions
      onContinueWeb();
    }
  };

  const handleContinueWeb = () => {
    if (dontShowAgain) {
      localStorage.setItem("scanner_install_prompt_dismissed", "true");
    }
    onContinueWeb();
  };

  const features = [
    {
      icon: Zap,
      title: "Instant Barcode Scanning",
      description: "10x faster product lookups",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Real-time recall & danger alerts",
    },
    {
      icon: WifiOff,
      title: "Works Offline",
      description: "Scan anywhere, anytime",
    },
    {
      icon: Shield,
      title: "Protected Health Insights",
      description: "Secure family health data",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-background to-muted/30 border-primary/20">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Get the Full Experience!
          </DialogTitle>
          <DialogDescription className="text-base">
            Install our app for the best scanning experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleInstall}
            className="w-full bg-primary hover:bg-primary/90 h-12 text-lg gap-2"
            disabled={isInstalling}
          >
            <Download className="w-5 h-5" />
            {isInstalling ? "Installing..." : "Install App Now"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleContinueWeb}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Continue on Web
          </Button>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
              className="border-muted-foreground/50"
            />
            <label
              htmlFor="dont-show"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this again
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to check if app should show install prompt
export function shouldShowInstallPrompt(): boolean {
  // Check if already installed (standalone mode)
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return false;
  }

  // Check if running as iOS app
  if ((navigator as any).standalone === true) {
    return false;
  }

  // Check if user has dismissed the prompt
  if (localStorage.getItem("scanner_install_prompt_dismissed") === "true") {
    return false;
  }

  // Check if already installed
  if (localStorage.getItem("pwa_installed") === "true") {
    return false;
  }

  return true;
}

export default ScannerInstallPrompt;
