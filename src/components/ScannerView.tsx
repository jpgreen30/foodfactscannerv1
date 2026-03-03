import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X, Loader2, Scan, Barcode, ShieldAlert, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/HelpTooltip";
import { cn } from "@/lib/utils";

interface ScannerViewProps {
  onImageCapture: (imageData: string) => void;
  onBarcodeMode: () => void;
  isProcessing: boolean;
}

export const ScannerView = ({ onImageCapture, onBarcodeMode, isProcessing }: ScannerViewProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (error) {
      console.error("Camera access denied:", error);
    }
  }, []);

  const handleVideoRef = useCallback((video: HTMLVideoElement | null) => {
    if (video && streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(console.error);
    }
    videoRef.current = video;
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageData);
        stopCamera();
        onImageCapture(imageData);
      }
    }
  }, [onImageCapture, stopCamera]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setCapturedImage(imageData);
        onImageCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    stopCamera();
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full border-4 border-danger/20" />
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-transparent border-t-danger" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-lg font-bold text-foreground flex items-center gap-2"
        >
          <Skull className="w-5 h-5 text-danger" />
          Detecting threats...
        </motion.p>
        <p className="text-sm text-muted-foreground mt-2">
          Scanning for hidden dangers
        </p>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden border-2 border-danger/30">
          <img 
            src={capturedImage} 
            alt="Captured label" 
            className="w-full h-auto max-h-[400px] object-contain bg-background/5"
          />
          <button
            onClick={resetScanner}
            className="absolute top-3 right-3 p-2 bg-foreground/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-foreground transition-colors"
          >
            <X className="w-5 h-5 text-background" />
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Image captured. Tap X to scan again.
        </p>
      </div>
    );
  }

  if (isCameraActive) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden bg-background">
          <video
            ref={handleVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto max-h-[400px] object-cover"
          />
          <div className="absolute inset-0 pointer-events-none">
            {/* Scan overlay */}
            <div className="absolute inset-8 border-2 border-danger/50 rounded-xl">
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-danger shadow-[0_0_10px_hsl(var(--danger))]"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            {/* Corner markers */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-danger rounded-tl-lg" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-danger rounded-tr-lg" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-danger rounded-bl-lg" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-danger rounded-br-lg" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={stopCamera}
              className="bg-foreground/90 backdrop-blur-sm text-background"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={capturePhoto}
              className="bg-danger hover:bg-danger/90 shadow-[0_0_20px_hsl(var(--danger)/0.5)]"
            >
              <Camera className="w-5 h-5" />
              Capture
            </Button>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          ⚠️ Position the ingredient label within the danger zone
        </p>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barcode Scanner - Featured */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onBarcodeMode}
        className={cn(
          "w-full flex items-center gap-4 p-5 rounded-2xl",
          "bg-danger/20 border-2 border-danger/50 hover:border-danger",
          "transition-all duration-200 group shadow-[0_0_30px_hsl(var(--danger)/0.2)]"
        )}
      >
        <div className="w-14 h-14 rounded-xl bg-danger flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_hsl(var(--danger)/0.5)]">
          {/* Barcode icon visual */}
          <div className="flex items-center gap-[2px] h-7">
            {[2, 1, 3, 1, 2, 1, 3, 2, 1].map((w, i) => (
              <div key={i} className="bg-background rounded-sm" style={{ width: `${w}px`, height: '100%' }} />
            ))}
          </div>
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-foreground text-lg flex items-center gap-2">
            <span>⚡</span>
            <span>Barcode Scanner</span>
            <HelpTooltip 
              content="Point your camera at the barcode on the product packaging. We'll identify the product and analyze its ingredients automatically."
              side="bottom"
            />
          </p>
          <p className="text-sm text-muted-foreground">Scan UPC/EAN on product packaging</p>
        </div>
        <div className="px-3 py-1 bg-danger/30 rounded-full">
          <span className="text-xs font-medium text-danger">Fastest</span>
        </div>
      </motion.button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">or analyze label manually</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startCamera}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl",
            "bg-background/5 border-2 border-dashed border-danger/30 hover:border-danger/50",
            "transition-all duration-200 group"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8 text-danger" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground flex items-center justify-center gap-1">
              Scan Label
              <HelpTooltip 
                content="Take a photo of the ingredient list on the product. Our AI will analyze all ingredients and give you a health score."
                side="top"
              />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Use your camera</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl",
            "bg-background/5 border-2 border-dashed border-background/30 hover:border-background/50",
            "transition-all duration-200 group"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground flex items-center justify-center gap-1">
              Upload Image
              <HelpTooltip 
                content="Select an existing photo of an ingredient label from your device. Great for products you've photographed before."
                side="top"
              />
            </p>
            <p className="text-sm text-muted-foreground mt-1">From your gallery</p>
          </div>
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex items-center gap-3 p-4 bg-danger/10 rounded-xl border border-danger/20">
        <ShieldAlert className="w-5 h-5 text-danger shrink-0" />
        <p className="text-sm text-foreground">
          Point your camera at the ingredient list to <span className="text-danger font-semibold">expose hidden dangers</span>
        </p>
      </div>
    </div>
  );
};
