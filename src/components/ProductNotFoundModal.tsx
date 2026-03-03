import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Edit3, Send, AlertTriangle, Barcode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProductNotFoundModalProps {
  isOpen: boolean;
  barcode: string;
  onClose: () => void;
  onScanLabel: () => void;
  onManualEntry: (productData: ManualProductData) => void;
  onReportMissing: (barcode: string) => void;
  isProcessing?: boolean;
}

export interface ManualProductData {
  productName: string;
  brand: string;
  ingredients: string;
}

export const ProductNotFoundModal = ({
  isOpen,
  barcode,
  onClose,
  onScanLabel,
  onManualEntry,
  onReportMissing,
  isProcessing = false,
}: ProductNotFoundModalProps) => {
  const [showManualForm, setShowManualForm] = useState(false);
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSubmit = async () => {
    if (!productName.trim()) return;
    
    setIsSubmitting(true);
    await onManualEntry({
      productName: productName.trim(),
      brand: brand.trim(),
      ingredients: ingredients.trim(),
    });
    setIsSubmitting(false);
  };

  const handleReportMissing = () => {
    onReportMissing(barcode);
    onClose();
  };

  const resetForm = () => {
    setShowManualForm(false);
    setProductName("");
    setBrand("");
    setIngredients("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-caution/20 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-caution/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-caution" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-lg">Product Not Found</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Barcode className="w-3 h-3" />
                      {barcode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={handleClose}
                  disabled={isProcessing || isSubmitting}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {!showManualForm ? (
                <>
                  <p className="text-muted-foreground text-sm">
                    This barcode isn't in our database yet. You have a few options:
                  </p>

                  {/* Option 1: Scan Label */}
                  <button
                    onClick={() => {
                      handleClose();
                      onScanLabel();
                    }}
                    disabled={isProcessing}
                    className="w-full p-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Scan the Label Instead</p>
                        <p className="text-sm text-muted-foreground">
                          Take a photo of the ingredient list
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Enter Manually */}
                  <button
                    onClick={() => setShowManualForm(true)}
                    disabled={isProcessing}
                    className="w-full p-4 rounded-xl border border-border bg-muted/50 hover:bg-muted transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Edit3 className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Enter Details Manually</p>
                        <p className="text-sm text-muted-foreground">
                          Type in the product name and ingredients
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Report Missing */}
                  <button
                    onClick={handleReportMissing}
                    disabled={isProcessing}
                    className="w-full p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Send className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Report Missing Product</p>
                        <p className="text-sm text-muted-foreground">
                          Help us add this product to our database
                        </p>
                      </div>
                    </div>
                  </button>
                </>
              ) : (
                /* Manual Entry Form */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowManualForm(false)}
                      disabled={isSubmitting}
                    >
                      ← Back
                    </Button>
                    <span className="text-sm text-muted-foreground">Manual Entry</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        placeholder="e.g., Chocolate Chip Cookies"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        disabled={isSubmitting}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand">Brand (optional)</Label>
                      <Input
                        id="brand"
                        placeholder="e.g., Nature's Best"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        disabled={isSubmitting}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="ingredients">Ingredients (optional)</Label>
                      <Textarea
                        id="ingredients"
                        placeholder="Copy & paste the ingredient list from the package..."
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        disabled={isSubmitting}
                        className="mt-1 min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        For the most accurate analysis, include all ingredients
                      </p>
                    </div>

                    <Button
                      onClick={handleManualSubmit}
                      disabled={!productName.trim() || isSubmitting}
                      className="w-full gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Analyze Product
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
