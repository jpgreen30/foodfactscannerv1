import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Share, CheckCircle, Zap } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppBannerProps {
  trigger?: "immediate" | "after-scan";
}

export const InstallAppBanner = ({ trigger = "immediate" }: InstallAppBannerProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if user dismissed the banner before (only for immediate trigger)
    if (trigger === "immediate") {
      const dismissed = localStorage.getItem("pwa-banner-dismissed");
      if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // For after-scan trigger, only show on the FIRST scan ever
    if (trigger === "after-scan") {
      const hasShownFirstScanBanner = localStorage.getItem("pwa-first-scan-banner-shown");
      if (hasShownFirstScanBanner) {
        // Already shown on first scan, never show again
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (trigger === "immediate") {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS or after-scan trigger, show banner
    if (trigger === "after-scan") {
      // Show after first scan with a delay for better UX
      // Mark that we've shown the first scan banner
      localStorage.setItem("pwa-first-scan-banner-shown", "true");
      setTimeout(() => setShowBanner(true), 1500);
    } else if (isIOSDevice && trigger === "immediate") {
      setShowBanner(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [trigger]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    if (trigger === "immediate") {
      localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
    }
    // For after-scan, we don't need to set anything - it's already marked as shown
  };

  if (isInstalled || !showBanner) return null;

  // After-scan variant - more prominent card style
  if (trigger === "after-scan") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl p-5 shadow-lg shadow-primary/10">
            {showIOSInstructions ? (
              // iOS Instructions
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Share className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Install on iPhone</h3>
                      <p className="text-xs text-muted-foreground">Follow these steps:</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</span>
                    <span>Tap the <Share className="w-4 h-4 inline text-primary" /> Share button in Safari</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</span>
                    <span>Scroll down and tap "Add to Home Screen"</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</span>
                    <span>Tap "Add" to install FoodFact</span>
                  </li>
                </ol>

                <Button variant="outline" className="w-full" onClick={handleDismiss}>
                  Got it!
                </Button>
              </div>
            ) : (
              // After-scan install prompt
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                      <Smartphone className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">Get the App!</h3>
                      <p className="text-sm text-muted-foreground">
                        Scan products faster on your phone
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0 -mt-1 -mr-1">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background/50 rounded-lg p-2">
                    <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Instant Access</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <Download className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Works Offline</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2">
                    <CheckCircle className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Free Forever</p>
                  </div>
                </div>
                
                <Button onClick={handleInstall} className="w-full gap-2 h-12 text-base">
                  <Download className="w-5 h-5" />
                  Install FoodFact App
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Immediate variant - floating banner at bottom
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl shadow-primary/20">
          {showIOSInstructions ? (
            // iOS Instructions
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Share className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Install on iPhone</h3>
                    <p className="text-xs text-muted-foreground">Follow these steps:</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</span>
                  <span>Tap the <Share className="w-4 h-4 inline text-primary" /> Share button</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</span>
                  <span>Tap "Add" to install FoodFact</span>
                </li>
              </ol>

              <Button variant="outline" className="w-full" onClick={handleDismiss}>
                Got it!
              </Button>
            </div>
          ) : (
            // Default Install Banner
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">Install FoodFact</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Add to your home screen for quick access, offline use, and a native app experience.
                </p>
                
                <div className="flex gap-2">
                  <Button onClick={handleInstall} className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    Install App
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDismiss}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
