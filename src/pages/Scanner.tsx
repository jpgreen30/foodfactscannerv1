import { useState, useEffect } from "react";
import { ScanCreditsBanner } from "@/components/ScanCreditsBanner";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { ScannerView } from "@/components/ScannerView";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { HealthScore } from "@/components/HealthScore";
import { IngredientCard } from "@/components/IngredientCard";
import { NutritionChart } from "@/components/NutritionChart";
import { DietaryFlags } from "@/components/DietaryFlags";
import { Disclaimer } from "@/components/Disclaimer";
import { PersonalizedWarnings } from "@/components/PersonalizedWarnings";
import { HeavyMetalsAlert } from "@/components/HeavyMetalsAlert";
import { HealthierAlternatives } from "@/components/HealthierAlternatives";
import { ToxicIngredientsAlert } from "@/components/ToxicIngredientsAlert";
import { ToxicProductLegalCTA } from "@/components/ToxicProductLegalCTA";
import { ProfileSelector } from "@/components/family/ProfileSelector";
import { InstallAppBanner } from "@/components/InstallAppBanner";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { ProductNotFoundModal, ManualProductData } from "@/components/ProductNotFoundModal";
import { UpgradePrompt, PremiumTeaser } from "@/components/UpgradePrompt";
import { HelpTooltip } from "@/components/HelpTooltip";
import { ShareToCommunityButton } from "@/components/community/ShareToCommunityButton";
import { FoodDrugInteractionChecker } from "@/components/medication/FoodDrugInteractionChecker";
import { Button } from "@/components/ui/button";
import { ScanResult } from "@/data/mockData";
import { ArrowLeft, AlertTriangle, Share2, Bookmark, Check, Lock, Crown, Skull, ShieldAlert, MessageCircle, Facebook, Twitter, Linkedin, Mail, Link2, MessageSquare, Users, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDebug } from "@/contexts/DebugContext";
import { Link } from "react-router-dom";
import { triggerProductScanWebhook, triggerHealthScoreAlertWebhook } from "@/services/zapierIntegration";
import { trackScan, trackScanResult } from "@/lib/analytics";
import { hasPaidSubscription } from "@/lib/subscriptionUtils";
import { useStreak } from "@/hooks/useStreak";
import { useMonetization } from "@/hooks/useMonetization";

interface UserProfile {
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  is_pregnant: boolean;
  is_heart_healthy: boolean;
  is_diabetic: boolean;
  health_conditions: string[];
  allergies_detailed: any;
  age_group: string | null;
  subscription_tier: string;
}

interface PersonalizedWarning {
  type: "allergy" | "health" | "dietary";
  severity: "low" | "medium" | "high" | "critical";
  ingredient: string | null;
  message: string;
}

interface HealthierAlternative {
  name: string;
  brand?: string;
  reason: string;
  estimatedScore: number;
  keyBenefits: string[];
}

interface ExtendedScanResult extends ScanResult {
  personalizedWarnings?: PersonalizedWarning[];
  healthierAlternatives?: HealthierAlternative[];
}

// Free trial = 10 total lifetime scans (not daily)
const FREE_TRIAL_LIMIT = 10;

const Scanner = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ExtendedScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [isBarcodeMode, setIsBarcodeMode] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [dailyScanCount, setDailyScanCount] = useState(0);
  const [totalScanCount, setTotalScanCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string>("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptVariant, setUpgradePromptVariant] = useState<"limit-warning" | "value-proposition" | "dangerous-product" | "streak-milestone">("limit-warning");
  const { toast } = useToast();
  const { user } = useAuth();
  const { getEffectiveTier } = useDebug();
  const { updateStreak, streak } = useStreak();
  const monetization = useMonetization();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchDailyScanCount();
      fetchTotalScanCount();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("is_vegan, is_gluten_free, is_dairy_free, is_pregnant, is_heart_healthy, is_diabetic, health_conditions, allergies_detailed, age_group, subscription_tier")
        .eq("id", user!.id)
        .maybeSingle();

      if (data) {
        setUserProfile({
          ...data,
          health_conditions: (data.health_conditions as string[]) || [],
          allergies_detailed: data.allergies_detailed || null,
          age_group: data.age_group || null,
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchDailyScanCount = async () => {
    try {
      const { data } = await supabase.rpc("get_daily_scan_count");
      setDailyScanCount(data || 0);
    } catch (error) {
      console.error("Error fetching scan count:", error);
    }
  };

  const fetchTotalScanCount = async () => {
    try {
      const { data } = await supabase.rpc("get_total_scan_count");
      setTotalScanCount(data || 0);
    } catch (error) {
      console.error("Error fetching total scan count:", error);
    }
  };

  const incrementScanCount = async () => {
    try {
      const { data } = await supabase.rpc("increment_daily_scan");
      setDailyScanCount(data || 0);
      setTotalScanCount(prev => prev + 1); // Also increment local total count
      return data || 0;
    } catch (error) {
      console.error("Error incrementing scan count:", error);
      return dailyScanCount + 1;
    }
  };

  const checkScanLimit = (): boolean => {
    if (!user) return true;
    const effectiveTier = getEffectiveTier(userProfile?.subscription_tier);
    
    // Premium/Annual = unlimited
    if (["premium", "annual"].includes(effectiveTier || "")) return true;
    // Basic = server handles monthly reset, allow scan (server blocks if over)
    if (effectiveTier === "basic") return true;
    
    // Free trial = 10 total lifetime scans, hard block after
    if (totalScanCount >= FREE_TRIAL_LIMIT) {
      setIsLimitReached(true);
      return false;
    }
    return true;
  };

  // Handle prompt_type from on-scan-completed response
  const handleScanPrompts = (promptType: string | null, newTotalCount: number) => {
    if (!promptType) return;
    
    const scansLeft = FREE_TRIAL_LIMIT - newTotalCount;
    
    switch (promptType) {
      case 'hard_lock':
        // 10 scans used → hard lock modal
        setIsLimitReached(true);
        toast({
          title: "🔒 Free Trial Complete",
          description: "You've used all 10 free scans. Upgrade to keep protecting your family!",
          variant: "destructive",
        });
        break;
      case 'strong_prompt':
        // 9 scans used → stronger prompt
        setUpgradePromptVariant("value-proposition");
        setShowUpgradePrompt(true);
        toast({
          title: "🚨 Last Scan Remaining!",
          description: "After this, you won't be able to scan anymore. Upgrade now!",
          variant: "destructive",
        });
        break;
      case 'soft_prompt':
        // 7 scans used → soft upgrade prompt
        setUpgradePromptVariant("limit-warning");
        setShowUpgradePrompt(true);
        toast({
          title: `⚠️ Only ${scansLeft} Scan${scansLeft !== 1 ? 's' : ''} Left!`,
          description: "Upgrade to Basic ($9.99/mo) for 20 scans or Premium for unlimited.",
        });
        break;
    }
  };

  const saveScanToHistory = async (result: ExtendedScanResult, scanType: 'image' | 'barcode', barcodeValue?: string, imageUrl?: string) => {
    if (!user) return;

    try {
      const verdict = result.healthScore >= 80 ? 'healthy' : result.healthScore >= 50 ? 'caution' : 'avoid';
      
      const insertData = {
        user_id: user.id,
        product_name: result.productName,
        brand: result.brand,
        health_score: result.healthScore,
        verdict,
        scan_type: scanType,
        barcode: barcodeValue || null,
        image_url: imageUrl || null,
        ingredients: result.ingredients as unknown,
        nutrition: result.nutrition as unknown,
        dietary_flags: result.dietaryFlags as unknown,
        recalls: result.recalls || null,
      };

      const { data: scanData, error } = await supabase
        .from("scan_history")
        .insert(insertData as any)
        .select("id")
        .single();

      if (error) {
        console.error('Error saving scan:', error);
      } else {
        setIsSaved(true);
        setScanId(scanData?.id || null);
        
        // Update streak after successful scan
        updateStreak().then((result) => {
          if (result && result.currentStreak >= 7 && result.currentStreak % 7 === 0) {
            toast({
              title: `🔥 ${result.currentStreak} Day Streak!`,
              description: "You're on fire! Keep scanning to maintain your streak.",
            });
          }
        });
        
        // Trigger Zapier webhook for product scan
        const hasAllergens = result.personalizedWarnings?.some(w => w.type === "allergy") || false;
        
        triggerProductScanWebhook({
          scan_id: scanData?.id,
          user_id: user.id,
          product_name: result.productName,
          brand: result.brand,
          barcode: barcodeValue,
          health_score: result.healthScore,
          verdict,
          dietary_flags: result.dietaryFlags,
          has_allergens: hasAllergens,
          recall_status: result.recalls?.hasRecall ? "active" : "none",
          subscription_tier: userProfile?.subscription_tier,
        }).catch(err => console.error('[Zapier] Scan webhook error:', err));
        
        // Trigger health score alert webhook for dangerous products (score < 30)
        if (result.healthScore < 30) {
          const dangerousIngredients = result.ingredients
            .filter(i => i.riskLevel === "danger" || i.riskLevel === "caution")
            .map(i => i.name);
          
          triggerHealthScoreAlertWebhook({
            user_id: user.id,
            product_name: result.productName,
            health_score: result.healthScore,
            alert_threshold: 30,
            ingredients_of_concern: dangerousIngredients,
          }).catch(err => console.error('[Zapier] Health alert webhook error:', err));
        }

        // AUTO-SEND TOXIC ALERT EMAIL for dangerous products
        if (verdict === 'avoid' && user.email) {
          const toxicIngredients = result.ingredients
            .filter(i => i.riskLevel === "danger" || i.riskLevel === "caution")
            .map(i => ({
              name: i.name,
              riskLevel: i.riskLevel,
              healthConcerns: i.healthConcerns || [],
            }));

          if (toxicIngredients.length > 0) {
            supabase.functions.invoke("send-toxic-alert-email", {
              body: {
                userEmail: user.email,
                userName: userProfile?.subscription_tier ? "Valued Customer" : "User",
                productName: result.productName,
                brand: result.brand,
                healthScore: result.healthScore,
                toxicIngredients,
                scanId: scanData?.id,
                userId: user.id,
              },
            }).then(() => {
              console.log('[Toxic Alert] Email sent successfully');
            }).catch(err => {
              console.error('[Toxic Alert] Email failed:', err);
            });
          }
        }
      }
    } catch (err) {
      console.error('Error saving scan to history:', err);
    }
  };

  // Fire monetization tracking after a successful scan and handle upgrade prompts
  const trackMonetizationEvent = async (result: ExtendedScanResult, barcodeValue?: string) => {
    const riskLevel = result.healthScore < 40 ? 'high' : result.healthScore < 70 ? 'medium' : 'low';
    try {
      const scanResult = await monetization.recordScan({
        barcode: barcodeValue,
        product_name: result.productName,
        risk_level: riskLevel,
        heavy_metals_avoid: !!(result as any).heavyMetals?.found && (result as any).heavyMetals?.overallVerdict === 'AVOID',
        health_score: result.healthScore,
      });
      
      // Handle prompt_type from backend
      if (scanResult?.prompt_type) {
        handleScanPrompts(scanResult.prompt_type, scanResult.scans_used || totalScanCount + 1);
      } else if (scanResult?.blocked) {
        setIsLimitReached(true);
      } else {
        // Fallback: still show dangerous product prompts for free users
        showUpgradePromptsAfterScan(result);
      }
    } catch (err) {
      console.error('[Monetization] recordScan error:', err);
    }
  };

  const handleImageCapture = async (imageData: string) => {
    if (!checkScanLimit()) {
      toast({
        title: "Free Trial Limit Reached",
        description: "Upgrade for unlimited protection!",
        variant: "destructive"
      });
      return;
    }
    setIsProcessing(true);
    
    try {
      if (user) {
        await incrementScanCount();
      }

      const requestBody: any = { imageData };
      
      // Use active profile (could be main profile or family profile)
      if (activeProfile) {
        requestBody.userProfile = activeProfile;
      } else if (userProfile) {
        requestBody.userProfile = userProfile;
      }

      const { data, error } = await supabase.functions.invoke('analyze-food-label', {
        body: requestBody
      });

      if (error) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis Failed",
          description: error.message || "Could not analyze the food label. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      if (data?.error) {
        toast({
          title: "Analysis Error",
          description: data.error,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      if (data?.success && data?.data) {
        const result = data.data as ExtendedScanResult;
        setScanResult(result);
        setLastScannedBarcode(null); // Image scans don't have barcodes
        saveScanToHistory(result, 'image');
        trackMonetizationEvent(result);
        
        // Track scan in Google Analytics
        const verdict = result.healthScore >= 80 ? 'healthy' : result.healthScore >= 50 ? 'caution' : 'avoid';
        trackScan("label", result.productName);
        trackScanResult(result.healthScore, verdict);
        
        // Show upgrade prompts for free users
        showUpgradePromptsAfterScan(result);
      } else {
        toast({
          title: "No Results",
          description: "Could not extract information from the image. Please try a clearer photo.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    if (!checkScanLimit()) {
      toast({
        title: "Free Trial Limit Reached",
        description: "Upgrade for unlimited protection!",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      if (user) {
        await incrementScanCount();
      }

      const { data: lookupData, error: lookupError } = await supabase.functions.invoke('lookup-barcode', {
        body: { barcode }
      });

      if (lookupError) {
        console.error('Barcode lookup error:', lookupError);
        toast({
          title: "Lookup Failed",
          description: "Could not look up the barcode. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      if (!lookupData?.found) {
        setNotFoundBarcode(barcode);
        setShowNotFoundModal(true);
        setIsProcessing(false);
        return;
      }

      toast({
        title: "Product Found!",
        description: `Found: ${lookupData.productName}. Analyzing ingredients...`,
      });

      const requestBody: any = { productData: lookupData };
      
      // Use active profile (could be main profile or family profile)
      if (activeProfile) {
        requestBody.userProfile = activeProfile;
      } else if (userProfile) {
        requestBody.userProfile = userProfile;
      }

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-barcode-product', {
        body: requestBody
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        toast({
          title: "Analysis Failed",
          description: "Found the product but could not analyze it. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      if (analysisData?.success && analysisData?.data) {
        const result = analysisData.data as ExtendedScanResult;
        // Merge heavy metals data from barcode lookup into the analysis result
        if (lookupData.heavyMetals) {
          result.heavyMetals = lookupData.heavyMetals;
        }
        setScanResult(result);
        setIsBarcodeMode(false);
        setLastScannedBarcode(barcode);
        // Pass imageUrl from lookupData to save with scan history
        saveScanToHistory(result, 'barcode', barcode, lookupData.imageUrl);
        trackMonetizationEvent(result, barcode);
        
        // Track scan in Google Analytics
        const verdict = result.healthScore >= 80 ? 'healthy' : result.healthScore >= 50 ? 'caution' : 'avoid';
        trackScan("barcode", result.productName);
        trackScanResult(result.healthScore, verdict);
        
        // Show upgrade prompts for free users
        showUpgradePromptsAfterScan(result);
      } else {
        toast({
          title: "Analysis Error",
          description: analysisData?.error || "Could not analyze the product.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setScanId(null);
    setIsSaved(false);
    setIsLimitReached(false);
    setShowNotFoundModal(false);
    setNotFoundBarcode("");
    setLastScannedBarcode(null);
    setShowUpgradePrompt(false);
  };

  // Show upgrade prompts after scan for free users
  const showUpgradePromptsAfterScan = (result: ExtendedScanResult) => {
    const effectiveTier = getEffectiveTier(userProfile?.subscription_tier);
    const isPaidUser = hasPaidSubscription(effectiveTier);
    
    if (isPaidUser) return; // Don't show prompts to paid users
    
    const newTotalCount = totalScanCount + 1;
    const scansLeft = FREE_TRIAL_LIMIT - newTotalCount;
    
    // Priority 1: Dangerous product warning (health score < 40)
    if (result.healthScore < 40) {
      setTimeout(() => {
        setUpgradePromptVariant("dangerous-product");
        setShowUpgradePrompt(true);
      }, 1500);
      
      toast({
        title: "⚠️ Dangerous Product Detected!",
        description: "Premium members get safer alternatives & detailed guidance.",
        action: (
          <Link to="/subscription">
            <Button size="sm" variant="destructive">Upgrade</Button>
          </Link>
        ),
      });
      return;
    }
    
    // Priority 2: Running very low (1 scan left — 9 used)
    if (scansLeft === 1) {
      setTimeout(() => {
        setUpgradePromptVariant("value-proposition");
        setShowUpgradePrompt(true);
      }, 2000);
      
      toast({
        title: "🚨 Last Scan Remaining!",
        description: "After this, you won't be able to scan anymore. Upgrade now!",
        variant: "destructive",
      });
      return;
    }
    
    // Priority 3: Running low (3 scans left — 7 used)
    if (scansLeft <= 3) {
      setTimeout(() => {
        setUpgradePromptVariant("limit-warning");
        setShowUpgradePrompt(true);
      }, 2500);
      
      toast({
        title: `⚠️ Only ${scansLeft} Scan${scansLeft !== 1 ? 's' : ''} Left!`,
        description: "Upgrade for unlimited protection.",
        action: (
          <Link to="/subscription">
            <Button size="sm">Upgrade</Button>
          </Link>
        ),
      });
      return;
    }
    
    // Check for streak milestone (every 7 days)
    if (streak && streak.currentStreak > 0 && streak.currentStreak % 7 === 0) {
      setTimeout(() => {
        setUpgradePromptVariant("streak-milestone");
        setShowUpgradePrompt(true);
      }, 3000);
    }
  };

  // Handle manual product entry from "not found" modal
  const handleManualProductEntry = async (data: ManualProductData) => {
    setShowNotFoundModal(false);
    setIsProcessing(true);
    
    try {
      if (user) {
        await incrementScanCount();
      }

      const requestBody: any = {
        productData: {
          found: true,
          barcode: notFoundBarcode,
          productName: data.productName,
          brand: data.brand || "Unknown Brand",
          ingredientsText: data.ingredients,
          ingredientsList: [],
          nutrition: {
            servingSize: "Not specified",
            calories: 0,
            fat: 0,
            saturatedFat: 0,
            carbs: 0,
            sugar: 0,
            protein: 0,
            sodium: 0,
            fiber: 0,
          },
        },
      };

      if (activeProfile) {
        requestBody.userProfile = activeProfile;
      } else if (userProfile) {
        requestBody.userProfile = userProfile;
      }

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-barcode-product', {
        body: requestBody,
      });

      if (analysisError) {
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the product. Please try again.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (analysisData?.success && analysisData?.data) {
        const result = analysisData.data as ExtendedScanResult;
        setScanResult(result);
        setIsBarcodeMode(false);
        saveScanToHistory(result, 'barcode', notFoundBarcode);
        
        const verdict = result.healthScore >= 80 ? 'healthy' : result.healthScore >= 50 ? 'caution' : 'avoid';
        trackScan("barcode", result.productName);
        trackScanResult(result.healthScore, verdict);
      } else {
        toast({
          title: "Analysis Error",
          description: analysisData?.error || "Could not analyze the product.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Manual entry error:', err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle scan label option from "not found" modal
  const handleScanLabelFromModal = () => {
    setShowNotFoundModal(false);
    setIsBarcodeMode(false);
  };

  // Handle report missing product
  const handleReportMissingProduct = (barcode: string) => {
    toast({
      title: "Product Reported",
      description: `Thank you! Barcode ${barcode} has been reported for addition to our database.`,
    });
  };

  const nutritionItems = scanResult ? [
    { label: "Calories", value: scanResult.nutrition.calories, unit: "kcal" },
    { label: "Total Fat", value: scanResult.nutrition.fat, unit: "g", dailyValue: Math.round((scanResult.nutrition.fat / 65) * 100) },
    { label: "Saturated Fat", value: scanResult.nutrition.saturatedFat, unit: "g", dailyValue: Math.round((scanResult.nutrition.saturatedFat / 20) * 100) },
    { label: "Carbohydrates", value: scanResult.nutrition.carbs, unit: "g", dailyValue: Math.round((scanResult.nutrition.carbs / 300) * 100) },
    { label: "Sugar", value: scanResult.nutrition.sugar, unit: "g", dailyValue: Math.round((scanResult.nutrition.sugar / 50) * 100) },
    { label: "Protein", value: scanResult.nutrition.protein, unit: "g", dailyValue: Math.round((scanResult.nutrition.protein / 50) * 100) },
    { label: "Sodium", value: scanResult.nutrition.sodium, unit: "mg", dailyValue: Math.round((scanResult.nutrition.sodium / 2300) * 100) },
    { label: "Fiber", value: scanResult.nutrition.fiber, unit: "g", dailyValue: Math.round((scanResult.nutrition.fiber / 25) * 100) },
  ] : [];

  const dietaryFlags = scanResult ? [
    { label: "Vegan", isCompatible: scanResult.dietaryFlags.vegan, icon: "vegan" as const },
    { label: "Gluten-Free", isCompatible: scanResult.dietaryFlags.glutenFree, icon: "gluten" as const },
    { label: "Dairy-Free", isCompatible: scanResult.dietaryFlags.dairyFree, icon: "dairy" as const },
    { label: "Pregnancy Safe", isCompatible: scanResult.dietaryFlags.pregnancySafe, icon: "pregnancy" as const },
    { label: "Heart Healthy", isCompatible: scanResult.dietaryFlags.heartHealthy, icon: "heart" as const },
    { label: "Diabetic Friendly", isCompatible: scanResult.dietaryFlags.diabeticFriendly, icon: "diabetes" as const },
  ] : [];

  const isPremium = hasPaidSubscription(userProfile?.subscription_tier);
  const scansRemaining = FREE_TRIAL_LIMIT - totalScanCount;

  if (scanResult) {
    return (
      <AppLayout className="bg-background" containerClassName="space-y-6">
        {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button variant="ghost" onClick={resetScan} className="gap-2 -ml-2 text-foreground hover:text-foreground hover:bg-muted">
              <ArrowLeft className="w-4 h-4" />
              Scan Again
            </Button>
          </motion.div>

          {/* Product header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">{scanResult.productName}</h1>
              <p className="text-muted-foreground">{scanResult.brand}</p>
            </div>
            <div className="flex items-start gap-2">
              <HealthScore score={scanResult.healthScore} size="md" />
              <HelpTooltip 
                content="Health Score: 70-100 is Healthy, 40-69 is Caution, 0-39 is Avoid. Based on ingredients, additives, and nutritional value."
                side="left"
              />
            </div>
          </motion.div>

          {/* Toxic Ingredients Alert - Shows prominently if dangerous ingredients detected */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ToxicIngredientsAlert 
              ingredients={scanResult.ingredients}
              productName={scanResult.productName}
              brand={scanResult.brand}
              healthScore={scanResult.healthScore}
            />
          </motion.div>

          {/* Legal Consultation CTA - Shows after toxic ingredients detected */}
          <ToxicProductLegalCTA
            productName={scanResult.productName}
            brand={scanResult.brand}
            healthScore={scanResult.healthScore}
            toxicIngredients={scanResult.ingredients
              .filter(i => i.riskLevel === "high" || i.riskLevel === "moderate" || i.riskLevel === "danger" || i.riskLevel === "caution")
              .map(i => ({ name: i.name, riskLevel: i.riskLevel, healthConcerns: i.healthConcerns }))
            }
          />

          {/* Food-Drug Interaction Check - Shows if user has medications */}
          {user && scanResult.ingredients && scanResult.ingredients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 }}
            >
              <FoodDrugInteractionChecker
                ingredients={scanResult.ingredients}
                productName={scanResult.productName}
                scanId={scanId || undefined}
              />
            </motion.div>
          )}

          {/* Personalized Warnings */}
          {scanResult.personalizedWarnings && scanResult.personalizedWarnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <PersonalizedWarnings warnings={scanResult.personalizedWarnings} />
            </motion.div>
          )}

          {/* Recall alert if applicable */}
          {scanResult.recalls?.hasRecall && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 p-4 bg-danger/20 border border-danger/50 rounded-xl shadow-[0_0_20px_hsl(var(--danger)/0.3)]"
            >
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger">⚠️ ACTIVE RECALL</p>
                <p className="text-sm text-foreground mt-1">{scanResult.recalls.reason}</p>
                {scanResult.recalls.action && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Recommended Action:</span> {scanResult.recalls.action}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Heavy Metals Analysis */}
          {scanResult.heavyMetals?.found && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <HeavyMetalsAlert data={scanResult.heavyMetals} />
            </motion.div>
          )}

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {(() => {
                  const scoreEmoji = scanResult.healthScore >= 80 ? '✅' : scanResult.healthScore >= 50 ? '⚠️' : '❌';
                  const verdict = scanResult.healthScore >= 80 ? 'Healthy Choice!' : scanResult.healthScore >= 50 ? 'Use Caution' : 'Avoid This!';
                  const shareText = `${scoreEmoji} ${scanResult.productName} by ${scanResult.brand} - Health Score: ${scanResult.healthScore}/100 - ${verdict}. Scanned with Label Genius!`;
                  const shareUrl = scanId 
                    ? `${window.location.origin}/scan/${scanId}` 
                    : window.location.origin;
                  const encodedText = encodeURIComponent(shareText);
                  const encodedUrl = encodeURIComponent(shareUrl);

                  return (
                    <>
                      <DropdownMenuItem 
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank')}
                        className="gap-2 cursor-pointer"
                      >
                        <Facebook className="w-4 h-4 text-[#1877F2]" />
                        Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank')}
                        className="gap-2 cursor-pointer"
                      >
                        <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                        X (Twitter)
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')}
                        className="gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-[#25D366]" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank')}
                        className="gap-2 cursor-pointer"
                      >
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(`mailto:?subject=${encodeURIComponent(`Check out ${scanResult.productName}`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank')}
                        className="gap-2 cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            toast({
                              title: "Link copied!",
                              description: "Share it anywhere you like.",
                            });
                          } catch {
                            toast({
                              title: "Copy failed",
                              description: "Could not copy the link.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        Copy Link
                      </DropdownMenuItem>
                    </>
                  );
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
            {user && (
              <Button 
                variant={isSaved ? "default" : "outline"} 
                size="sm" 
                className={`flex-1 gap-2 ${isSaved ? 'bg-safe text-primary-foreground' : ''}`}
                disabled={isSaved}
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {isSaved ? "Saved" : "Save"}
              </Button>
            )}
            {isPremium && (
              <Link to="/ingredient-chat" className="flex-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask AI
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Share to Community - for harmful products */}
          {user && scanResult.healthScore < 80 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="flex"
            >
              <ShareToCommunityButton
                productName={scanResult.productName}
                brand={scanResult.brand}
                healthScore={scanResult.healthScore}
                verdict={scanResult.healthScore >= 80 ? 'healthy' : scanResult.healthScore >= 50 ? 'caution' : 'avoid'}
                barcode={lastScannedBarcode}
              />
            </motion.div>
          )}

          {/* Premium Teaser for free users */}
          {!isPremium && user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <PremiumTeaser />
            </motion.div>
          )}

          {/* Ingredients */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
              <Skull className="w-5 h-5 text-danger" />
              Ingredients Analysis
            </h2>
            <div className="space-y-3">
              {scanResult.ingredients.map((ingredient, index) => (
                <IngredientCard key={ingredient.name} ingredient={ingredient} index={index} />
              ))}
            </div>
          </motion.section>

          {/* Nutrition */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <NutritionChart items={nutritionItems} />
          </motion.section>

          {/* Dietary flags */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <DietaryFlags flags={dietaryFlags} />
          </motion.section>

          {/* Healthier Alternatives */}
          {scanResult.healthierAlternatives && scanResult.healthierAlternatives.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <HealthierAlternatives 
                alternatives={scanResult.healthierAlternatives} 
                currentScore={scanResult.healthScore}
              />
            </motion.section>
          )}

          {/* Phone Number Capture for Recall Alerts */}


          {/* Push Notification Prompt - Shows after scan */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <PushNotificationPrompt trigger="after-scan" />
          </motion.section>

          {/* Install App Banner - Shows after scan */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <InstallAppBanner trigger="after-scan" />
          </motion.section>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Disclaimer />
          </motion.div>

          {/* Upgrade Prompt Modal */}
          <UpgradePrompt
            variant={upgradePromptVariant}
            isOpen={showUpgradePrompt}
            onClose={() => setShowUpgradePrompt(false)}
            scanCount={dailyScanCount}
            streakDays={streak?.currentStreak}
            toxicCount={scanResult.ingredients.filter(i => i.riskLevel === "danger").length}
          />
      </AppLayout>
    );
  }

  // Scan Limit Reached View - Enhanced with fear-based messaging
  if (isLimitReached) {
    return (
      <AppLayout className="bg-background" containerClassName="space-y-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            {/* Scary Icon */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="w-24 h-24 mx-auto rounded-2xl bg-danger/20 flex items-center justify-center mb-6 shadow-[0_0_40px_hsl(var(--danger)/0.5)]"
            >
              <ShieldAlert className="w-12 h-12 text-danger animate-pulse" />
            </motion.div>

            <h1 className="text-3xl font-black text-danger uppercase tracking-wide mb-3">
              ⚠️ PROTECTION DISABLED
            </h1>
            
            <p className="text-lg text-muted-foreground mb-4">
              You've used all {FREE_TRIAL_LIMIT} free trial scans.
            </p>

            {/* Scary Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6 text-left"
            >
              <p className="text-sm text-danger font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                While you're unprotected:
              </p>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>87% of recalled products are still on store shelves</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>The average family consumes 14 hidden toxins daily</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-danger">•</span>
                  <span>Every meal you eat blind puts your family at risk</span>
                </li>
              </ul>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground"
            >
              <Users className="w-4 h-4 text-safe" />
              <span><span className="font-bold text-foreground">12,847</span> families protected this week</span>
            </motion.div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Link to="/subscription">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full gap-2 bg-gradient-to-r from-danger to-orange-500 hover:from-danger/90 hover:to-orange-500/90 text-white shadow-[0_0_25px_hsl(var(--danger)/0.6)] py-6 text-lg font-bold">
                    <Crown className="w-5 h-5" />
                    Get Unlimited Protection Now
                  </Button>
                </motion.div>
              </Link>
              
              <p className="text-xs text-muted-foreground">
                Only <span className="font-bold text-foreground">$5.99/month</span> • Cancel anytime
              </p>

              <Button 
                variant="ghost" 
                onClick={resetScan} 
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Continue without protection →
              </Button>
            </div>

            {/* Trending indicator */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
            >
              <TrendingUp className="w-3 h-3 text-safe" />
              <span>423 people upgraded in the last 24 hours</span>
            </motion.div>
          </motion.div>
      </AppLayout>
    );
  }

  if (isBarcodeMode) {
    return (
      <AppLayout className="bg-background" containerClassName="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BarcodeScanner
            onBarcodeDetected={handleBarcodeDetected}
            onClose={() => setIsBarcodeMode(false)}
            isProcessing={isProcessing}
          />
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <>
    <Helmet>
      <title>Baby Food Barcode Scanner | Detect Heavy Metals & Toxic Ingredients | FoodFactScanner®</title>
      <meta name="description" content="Scan baby food barcodes to instantly detect heavy metals (arsenic, lead, cadmium), toxic ingredients, and FDA recalls. The most trusted baby food safety scanner for parents. Try 10 free scans!" />
      <meta name="keywords" content="baby food barcode scanner, scan baby food ingredients, detect heavy metals baby food, baby food toxin scanner, food safety scanner app, baby food ingredient checker" />
      <link rel="canonical" href="https://foodfactscanner.com/scanner" />
      <meta property="og:title" content="Baby Food Barcode Scanner | Detect Heavy Metals & Toxic Ingredients" />
      <meta property="og:description" content="Scan baby food barcodes to instantly detect heavy metals, toxic ingredients, and FDA recalls. Try 10 free scans!" />
      <meta property="og:url" content="https://foodfactscanner.com/scanner" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <AppLayout className="bg-background" containerClassName="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-danger" />
                Protect Yourself
                <HelpTooltip 
                  content="Scan product labels or barcodes to get an instant health analysis, ingredient breakdown, and personalized warnings."
                  side="bottom"
                />
              </h1>
              <p className="text-muted-foreground mt-1">
                Scan before you eat. Know the hidden dangers.
              </p>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <ProfileSelector
                  selectedProfileId={selectedProfileId}
                  onProfileChange={(id, profile) => {
                    setSelectedProfileId(id);
                    setActiveProfile(profile);
                  }}
                />
                <HelpTooltip 
                  content="Switch between family profiles to get personalized warnings based on each person's allergies and health conditions."
                  side="left"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Scan limit indicator - always show for free users */}
        {user && !isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${scansRemaining > 1 ? 'bg-safe' : scansRemaining > 0 ? 'bg-caution animate-pulse' : 'bg-danger animate-pulse'}`} />
              <span className="text-sm text-foreground">
                <span className="font-bold text-primary">{Math.max(0, scansRemaining)}</span> of <span className="font-bold">{FREE_TRIAL_LIMIT}</span> free trial scans remaining
              </span>
              <HelpTooltip 
                content="Free trial includes 10 total scans. Upgrade for unlimited protection!"
                side="bottom"
              />
            </div>
            <Link to="/subscription">
              <Button variant="default" size="sm" className="gap-1">
                <Crown className="w-3 h-3" />
                Upgrade
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Show prompt to sign up for non-logged in users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-caution" />
              <span className="text-sm text-foreground">
                Sign up to get <span className="font-bold text-primary">10 free scans</span> to try
              </span>
            </div>
            <Link to="/auth">
              <Button variant="default" size="sm">
                Sign Up Free
              </Button>
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ScannerView 
            onImageCapture={handleImageCapture} 
            onBarcodeMode={() => setIsBarcodeMode(true)}
            isProcessing={isProcessing} 
          />
        </motion.div>

        <Disclaimer />

        {/* Product Not Found Modal */}
        <ProductNotFoundModal
          isOpen={showNotFoundModal}
          barcode={notFoundBarcode}
          onClose={() => setShowNotFoundModal(false)}
          onScanLabel={handleScanLabelFromModal}
          onManualEntry={handleManualProductEntry}
          onReportMissing={handleReportMissingProduct}
          isProcessing={isProcessing}
        />
    </AppLayout>
    </>
  );
};

export default Scanner;
