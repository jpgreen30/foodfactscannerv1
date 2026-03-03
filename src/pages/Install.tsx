import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Download,
  Smartphone,
  Share,
  CheckCircle,
  Zap,
  Shield,
  Bell,
  Wifi,
  ArrowRight,
  MoreVertical,
  Plus,
  Scan,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getDeferredInstallPrompt,
  clearDeferredInstallPrompt,
} from "@/components/ScannerInstallPrompt";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const POLL_INTERVAL_MS = 500;
const POLL_MAX_MS = 5000;

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSamsung, setIsSamsung] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [pollExpired, setPollExpired] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect device/browser
    const ua = navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /ipad|iphone|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);
    const isSamsungBrowser = /samsungbrowser/.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSamsung(isSamsungBrowser);

    // 1. Immediately read the globally cached prompt (fires before page mount)
    const cached = getDeferredInstallPrompt();
    if (cached) {
      setDeferredPrompt(cached);
      return;
    }

    // 2. Fallback: listen for the event in case we arrived very quickly
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 3. Poll the global cache for up to POLL_MAX_MS in case there's a tiny delay
    let elapsed = 0;
    const poll = setInterval(() => {
      elapsed += POLL_INTERVAL_MS;
      const p = getDeferredInstallPrompt();
      if (p) {
        setDeferredPrompt(p);
        clearInterval(poll);
        window.removeEventListener("beforeinstallprompt", handler);
      } else if (elapsed >= POLL_MAX_MS) {
        clearInterval(poll);
        setPollExpired(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(poll);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        clearDeferredInstallPrompt();
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleRetryCheck = () => {
    const cached = getDeferredInstallPrompt();
    if (cached) {
      setDeferredPrompt(cached);
      setPollExpired(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant access from your home screen",
    },
    {
      icon: Wifi,
      title: "Works Offline",
      description: "Scan products even without internet",
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Get recall alerts instantly",
    },
    {
      icon: Shield,
      title: "Always Updated",
      description: "Latest features automatically",
    },
  ];

  return (
    <>
    <Helmet>
      <title>Install FoodFactScanner® | Free Baby Food Safety Scanner App for iOS & Android</title>
      <meta name="description" content="Install FoodFactScanner® — the free baby food safety scanner app for iOS and Android. Scan baby food barcodes anywhere to detect heavy metals, toxic ingredients, and FDA recalls instantly." />
      <meta name="keywords" content="install baby food scanner app, baby food safety app iOS Android, free baby food checker app, download baby food scanner, baby food barcode scanner app" />
      <link rel="canonical" href="https://foodfactscanner.com/install" />
      <meta property="og:url" content="https://foodfactscanner.com/install" />
      <meta property="og:title" content="Install FoodFactScanner® | Free Baby Food Safety Scanner App" />
      <meta property="og:description" content="Install the free baby food safety scanner app for iOS and Android. Detect heavy metals, toxic ingredients, and FDA recalls instantly." />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-lg mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* App Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-safe rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
            <Smartphone className="w-12 h-12 text-primary-foreground" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Install FoodFact
          </h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-4 bg-card border border-border rounded-xl"
            >
              <feature.icon className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-semibold text-foreground text-sm">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Install Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          {isInstalled ? (
            /* ── Already installed ── */
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-safe/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-safe" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Already Installed!
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                FoodFact is already on your home screen. Open it anytime for
                quick access.
              </p>
              <Link to="/scanner">
                <Button className="w-full gap-2">
                  <Scan className="w-5 h-5" />
                  Start Scanning
                </Button>
              </Link>
            </div>
          ) : isIOS ? (
            /* ── iOS Safari instructions ── */
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-center">
                Install on iPhone / iPad
              </h2>
              <div className="bg-caution/10 border border-caution/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-caution shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Important:</strong> You
                  must use Safari to install the app.
                </p>
              </div>
              <ol className="space-y-4">
                {[
                  {
                    label: "Tap the Share button",
                    detail: (
                      <span className="flex items-center gap-1">
                        Look for{" "}
                        <Share className="w-4 h-4 inline text-primary" /> at the
                        bottom of Safari
                      </span>
                    ),
                  },
                  {
                    label: 'Scroll and find "Add to Home Screen"',
                    detail: (
                      <span className="flex items-center gap-1">
                        Look for{" "}
                        <Plus className="w-4 h-4 inline text-primary" /> Add to
                        Home Screen
                      </span>
                    ),
                  },
                  {
                    label: 'Tap "Add"',
                    detail: "FoodFact will appear on your home screen",
                  },
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{step.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : deferredPrompt ? (
            /* ── Native install prompt available ── */
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Ready to Install
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Tap the button below to add FoodFact to your home screen.
              </p>
              <Button
                onClick={handleInstall}
                size="lg"
                className="w-full gap-2 h-14 text-lg"
                disabled={isInstalling}
              >
                <Download className="w-5 h-5" />
                {isInstalling ? "Installing…" : "Install FoodFact"}
                {!isInstalling && <ArrowRight className="w-5 h-5" />}
              </Button>
            </div>
          ) : !pollExpired ? (
            /* ── Still polling — show a subtle loading state ── */
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                Checking install availability…
              </p>
            </div>
          ) : isAndroid || isSamsung ? (
            /* ── Android fallback ── */
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-center">
                Install on Android
              </h2>
              <ol className="space-y-4 mb-6">
                {[
                  {
                    label: "Tap the menu button",
                    detail: (
                      <span className="flex items-center gap-1">
                        Look for{" "}
                        <MoreVertical className="w-4 h-4 inline text-primary" />{" "}
                        at the top-right corner
                      </span>
                    ),
                  },
                  {
                    label: 'Tap "Install app" or "Add to Home screen"',
                    detail: isSamsung
                      ? 'In Samsung Internet, look for "Add page to"'
                      : "Look for the install option in the menu",
                  },
                  {
                    label: "Confirm installation",
                    detail: "FoodFact will appear on your home screen",
                  },
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{step.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button
                variant="outline"
                onClick={handleRetryCheck}
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Again for Install Button
              </Button>
            </div>
          ) : (
            /* ── Generic fallback ── */
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2 text-center">
                Install from Browser Menu
              </h2>
              <p className="text-muted-foreground text-sm mb-4 text-center">
                Use your browser's menu to install FoodFact.
              </p>
              <div className="p-4 bg-muted rounded-lg text-sm text-left space-y-2 mb-4">
                <p>
                  <strong className="text-foreground">Chrome:</strong> Menu (⋮)
                  → Install app
                </p>
                <p>
                  <strong className="text-foreground">Edge:</strong> Menu (…) →
                  Apps → Install
                </p>
                <p>
                  <strong className="text-foreground">Firefox:</strong> Menu →
                  Install
                </p>
                <p>
                  <strong className="text-foreground">Safari:</strong> Share →
                  Add to Home Screen
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRetryCheck}
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Again for Install Button
              </Button>

              {/* Help accordion */}
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="why">
                  <AccordionTrigger className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Why isn't the install button showing?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p>The automatic install button may not appear if:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>The app is already installed on this device</li>
                      <li>
                        Your browser doesn't support PWA install (e.g. Firefox
                        desktop, some older browsers)
                      </li>
                      <li>
                        You've previously dismissed the install prompt — try
                        clearing site data and revisiting
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </motion.div>

        {/* CTA to continue in browser */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground mb-3">
              You can also use the app directly in your browser
            </p>
            <Link to="/scanner">
              <Button variant="outline" className="gap-2">
                <Scan className="w-4 h-4" />
                Continue in Browser
              </Button>
            </Link>
          </motion.div>
        )}
      </main>
    </div>
    </>
  );
};

export default Install;
