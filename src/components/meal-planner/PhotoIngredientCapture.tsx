import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  X,
  Loader2,
  ImagePlus,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhotoIngredientCaptureProps {
  onIngredientsDetected: (ingredients: string[]) => void;
  existingIngredients?: string;
}

export const PhotoIngredientCapture = ({
  onIngredientsDetected,
  existingIngredients,
}: PhotoIngredientCaptureProps) => {
  const { toast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Try uploading an image instead.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(dataUrl);
      stopCamera();
      analyzeImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-ingredient-photo", {
        body: { image: imageData },
      });

      if (error) throw error;

      const ingredients = data.ingredients || [];
      setDetectedIngredients(ingredients);
      setSelectedIngredients(new Set(ingredients));
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not identify ingredients. Try a clearer photo.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleIngredient = (ingredient: string) => {
    const updated = new Set(selectedIngredients);
    if (updated.has(ingredient)) {
      updated.delete(ingredient);
    } else {
      updated.add(ingredient);
    }
    setSelectedIngredients(updated);
  };

  const confirmSelection = () => {
    onIngredientsDetected(Array.from(selectedIngredients));
    resetState();
  };

  const resetState = () => {
    setCapturedImage(null);
    setDetectedIngredients([]);
    setSelectedIngredients(new Set());
    stopCamera();
  };

  return (
    <div className="space-y-3">
      {/* Trigger Buttons */}
      {!isCapturing && !capturedImage && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startCamera}
            className="flex-1 gap-2 border-background/20 text-background hover:bg-background/10"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 gap-2 border-background/20 text-background hover:bg-background/10"
          >
            <ImagePlus className="w-4 h-4" />
            Upload Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Camera View */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden bg-black"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 flex justify-center gap-3 bg-gradient-to-t from-black/80">
              <Button
                variant="ghost"
                size="icon"
                onClick={stopCamera}
                className="bg-background/20 hover:bg-background/30 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                onClick={capturePhoto}
                className="bg-caution hover:bg-caution/90 text-foreground rounded-full w-14 h-14"
              >
                <Camera className="w-6 h-6" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captured Image & Results */}
      <AnimatePresence>
        {capturedImage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Image Preview */}
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full aspect-[4/3] object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={resetState}
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Loading Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-foreground/80 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-caution" />
                  <p className="text-background text-sm font-medium">Detecting ingredients...</p>
                </div>
              )}
            </div>

            {/* Detected Ingredients */}
            {!isAnalyzing && detectedIngredients.length > 0 && (
              <div className="p-4 bg-safe/10 rounded-xl border border-safe/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-safe" />
                  <h4 className="font-medium text-background">Ingredients Found</h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {detectedIngredients.map((ingredient) => (
                    <Badge
                      key={ingredient}
                      variant="outline"
                      onClick={() => toggleIngredient(ingredient)}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedIngredients.has(ingredient)
                          ? "bg-safe/20 border-safe text-safe"
                          : "border-background/20 text-background/50 line-through"
                      )}
                    >
                      {selectedIngredients.has(ingredient) && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {ingredient}
                    </Badge>
                  ))}
                </div>
                <Button
                  onClick={confirmSelection}
                  disabled={selectedIngredients.size === 0}
                  className="w-full bg-safe hover:bg-safe/90 text-foreground"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add {selectedIngredients.size} Ingredient{selectedIngredients.size !== 1 ? "s" : ""}
                </Button>
              </div>
            )}

            {/* No Ingredients Found */}
            {!isAnalyzing && detectedIngredients.length === 0 && (
              <div className="p-4 bg-caution/10 rounded-xl border border-caution/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-caution" />
                  <p className="text-sm text-background">
                    No ingredients detected. Try a clearer photo with visible items.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={resetState}
                  className="w-full mt-3 border-background/20 text-background"
                >
                  Try Again
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
