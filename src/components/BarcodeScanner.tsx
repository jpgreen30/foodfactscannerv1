import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Barcode, Loader2, Keyboard, Camera, Flashlight, FlashlightOff } from "lucide-react";
import { haptics, isNativePlatform } from "@/services/nativeCapabilities";
import { cn } from "@/lib/utils";
import { ScannerInstallPrompt, shouldShowInstallPrompt } from "@/components/ScannerInstallPrompt";

// Supported barcode formats for product and prescription scanning
const BARCODE_FORMATS = [
  // Food/Consumer Products
  Html5QrcodeSupportedFormats.UPC_A,           // 12 digits - USA standard
  Html5QrcodeSupportedFormats.UPC_E,           // 8 digits - compressed UPC
  Html5QrcodeSupportedFormats.EAN_13,          // 13 digits - International
  Html5QrcodeSupportedFormats.EAN_8,           // 8 digits - Small products
  Html5QrcodeSupportedFormats.ITF,             // Variable - Shipping
  
  // Prescription/Pharmaceutical Barcodes
  Html5QrcodeSupportedFormats.CODE_128,        // NDC codes, pharmaceutical industry standard
  Html5QrcodeSupportedFormats.CODE_39,         // Healthcare, pharmaceutical labels
  Html5QrcodeSupportedFormats.CODABAR,         // Blood banks, pharmacy labels
  Html5QrcodeSupportedFormats.DATA_MATRIX,     // Prescription bottles, pharmaceutical packaging
  Html5QrcodeSupportedFormats.QR_CODE,         // Modern prescription labels with detailed info
  Html5QrcodeSupportedFormats.PDF_417,         // Driver licenses, some pharmacy labels
  Html5QrcodeSupportedFormats.AZTEC,           // Some pharmaceutical applications
];

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

export const BarcodeScanner = ({ onBarcodeDetected, onClose, isProcessing }: BarcodeScannerProps) => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [hasPassedInstallPrompt, setHasPassedInstallPrompt] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [isActivelyScanning, setIsActivelyScanning] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.log('Scanner already stopped');
      }
      scannerRef.current = null;
    }
    setTorchEnabled(false);
    setTorchAvailable(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current) return;
    
    try {
      const videoElement = document.querySelector('#barcode-scanner-container video') as HTMLVideoElement;
      if (!videoElement?.srcObject) return;
      
      const stream = videoElement.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      if (track && 'applyConstraints' in track) {
        const newTorchState = !torchEnabled;
        await track.applyConstraints({
          advanced: [{ torch: newTorchState } as MediaTrackConstraintSet]
        });
        setTorchEnabled(newTorchState);
        
        if (isNativePlatform()) {
          haptics.impact('light');
        }
      }
    } catch (error) {
      console.log('Torch toggle failed:', error);
    }
  }, [torchEnabled]);

  const checkTorchAvailability = useCallback(async () => {
    try {
      const videoElement = document.querySelector('#barcode-scanner-container video') as HTMLVideoElement;
      if (!videoElement?.srcObject) return;
      
      const stream = videoElement.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      if (track) {
        const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        if (capabilities?.torch) {
          setTorchAvailable(true);
          console.log('[BarcodeScanner] Torch is available');
        }
      }
    } catch (error) {
      console.log('Torch availability check failed:', error);
    }
  }, []);

  // Check for install prompt on mount
  useEffect(() => {
    if (shouldShowInstallPrompt() && !hasPassedInstallPrompt) {
      setShowInstallPrompt(true);
    } else {
      setHasPassedInstallPrompt(true);
    }
  }, []);

  useEffect(() => {
    // Don't start camera scanner if in manual entry mode or waiting on install prompt
    if (isManualEntry || !hasPassedInstallPrompt) return;

    let mounted = true;
    const scannerId = "barcode-scanner-container";
    let lastDetected = "";
    let lastDetectedTime = 0;

    const startScanner = async () => {
      try {
        // Wait for the container to be in DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted) return;

        console.log('[BarcodeScanner] Starting scanner with formats:', BARCODE_FORMATS.map(f => Html5QrcodeSupportedFormats[f]));

        // Create scanner with format configuration and native detector enabled
        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport: BARCODE_FORMATS,
          useBarCodeDetectorIfSupported: true, // Use native BarcodeDetector API when available
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        // Calculate responsive qrbox size
        const containerWidth = containerRef.current?.clientWidth || 350;
        const qrboxWidth = Math.min(containerWidth - 40, 300);
        const qrboxHeight = Math.floor(qrboxWidth * 0.45); // Barcode aspect ratio

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15, // Increased for faster detection
            qrbox: { width: qrboxWidth, height: qrboxHeight },
            aspectRatio: 1.5,
          },
          (decodedText, decodedResult) => {
            const now = Date.now();
            // Debounce: ignore same barcode within 2 seconds
            if (mounted && !isProcessing && (decodedText !== lastDetected || now - lastDetectedTime > 2000)) {
              lastDetected = decodedText;
              lastDetectedTime = now;
              
              console.log('[BarcodeScanner] Detected:', decodedText, 'Format:', decodedResult?.result?.format?.formatName || 'unknown');
              
              // Trigger haptic feedback on successful scan
              if (isNativePlatform()) {
                haptics.notification('success');
              }
              setLastScanned(decodedText);
              onBarcodeDetected(decodedText);
            }
          },
          () => {
            // Scanner is actively looking - update UI state
            if (mounted && !isActivelyScanning) {
              setIsActivelyScanning(true);
            }
          }
        );

        if (mounted) {
          setIsStarting(false);
          setIsActivelyScanning(true);
          console.log('[BarcodeScanner] Scanner started successfully');
          
          // Check torch availability after a short delay
          setTimeout(() => {
            if (mounted) {
              checkTorchAvailability();
            }
          }, 500);
        }
      } catch (err: any) {
        console.error("[BarcodeScanner] Failed to start:", err);
        if (mounted) {
          // Provide specific error messages
          let errorMessage = "Could not access camera.";
          if (err?.name === 'NotAllowedError') {
            errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
          } else if (err?.name === 'NotFoundError') {
            errorMessage = "No camera found. Please connect a camera or use manual entry.";
          } else if (err?.name === 'NotReadableError') {
            errorMessage = "Camera is in use by another app. Please close other apps using the camera.";
          } else if (err?.message) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [stopScanner, isManualEntry, hasPassedInstallPrompt, isProcessing, onBarcodeDetected, checkTorchAvailability]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleManualSubmit = () => {
    const trimmedBarcode = manualBarcode.trim();
    
    // Validate barcode format - supports UPC/EAN (8-14 digits) and NDC codes (10-11 digits with optional dashes)
    if (!trimmedBarcode) {
      setManualError("Please enter a barcode or NDC number");
      return;
    }
    
    // Remove dashes for NDC codes (format: XXXXX-XXXX-XX or XXXXX-XXX-XX)
    const cleanedBarcode = trimmedBarcode.replace(/-/g, '');
    
    // Accept 8-14 digit numeric codes (covers UPC, EAN, NDC)
    if (!/^\d{8,14}$/.test(cleanedBarcode)) {
      setManualError("Enter 8-14 digits (or NDC with dashes like 12345-6789-01)");
      return;
    }
    
    setManualError(null);
    if (isNativePlatform()) {
      haptics.notification('success');
    }
    onBarcodeDetected(trimmedBarcode);
  };

  const switchToManualEntry = async () => {
    await stopScanner();
    setIsManualEntry(true);
    setError(null);
  };

  const switchToCameraScanner = () => {
    setIsManualEntry(false);
    setIsStarting(true);
    setManualBarcode("");
    setManualError(null);
  };

  const handleInstallPromptComplete = () => {
    setShowInstallPrompt(false);
    setHasPassedInstallPrompt(true);
  };

  // Install prompt UI
  if (showInstallPrompt) {
    return (
      <ScannerInstallPrompt
        isOpen={showInstallPrompt}
        onClose={handleInstallPromptComplete}
        onInstall={handleInstallPromptComplete}
        onContinueWeb={handleInstallPromptComplete}
      />
    );
  }

  // Manual entry UI
  if (isManualEntry) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" />
              Enter Barcode Manually
            </h3>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-muted-foreground hover:bg-muted">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Type the barcode number found on the product packaging
          </p>
        </div>

        <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">
              Barcode or NDC Number
            </label>
            <Input
              type="text"
              inputMode="text"
              placeholder="Enter barcode or NDC (e.g., 12345-6789-01)"
              value={manualBarcode}
              onChange={(e) => {
                // Allow digits and dashes for NDC codes
                const value = e.target.value.replace(/[^\d-]/g, '');
                setManualBarcode(value);
                setManualError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
              className="text-lg tracking-widest font-mono"
              maxLength={14}
              disabled={isProcessing}
            />
            {manualError && (
              <p className="text-sm text-danger">{manualError}</p>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Barcode className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              For food: barcode below the lines. For prescriptions: NDC number on the label (format: 12345-6789-01)
            </p>
          </div>

          <Button 
            onClick={handleManualSubmit} 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isProcessing || !manualBarcode.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Looking up product...
              </>
            ) : (
              "Look Up Product"
            )}
          </Button>
        </div>

        <Button 
          variant="outline" 
          onClick={switchToCameraScanner} 
          className="w-full border-border text-foreground hover:bg-muted gap-2"
          disabled={isProcessing}
        >
          <Camera className="w-4 h-4" />
          Use Camera Scanner Instead
        </Button>

        <Button 
          variant="ghost" 
          onClick={handleClose} 
          className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
          disabled={isProcessing}
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Camera error UI with manual entry option
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Barcode Scanner</h3>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-muted-foreground hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 bg-danger/20 rounded-xl text-center border border-danger/30">
          <p className="text-danger">{error}</p>
          <div className="flex flex-col gap-2 mt-4">
            <Button 
              onClick={switchToManualEntry} 
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Keyboard className="w-4 h-4" />
              Enter Barcode Manually
            </Button>
            <Button variant="outline" onClick={handleClose} className="border-border text-foreground hover:bg-muted">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Camera scanner UI
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Barcode className="w-5 h-5 text-danger" />
            Scan Product Barcode
          </h3>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-muted-foreground hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Point your camera at the barcode on the product packaging
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-background" ref={containerRef}>
        <div 
          id="barcode-scanner-container" 
          className={cn(
            "w-full min-h-[300px]",
            isStarting && "opacity-0"
          )}
        />
        
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-danger mx-auto mb-2" />
              <p className="text-sm text-foreground">Starting camera...</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/90 backdrop-blur-sm">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-10 h-10 text-danger" />
              </motion.div>
              <p className="text-sm text-background mt-3 font-medium">Looking up product...</p>
            </div>
          </div>
        )}

        {!isStarting && !isProcessing && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scan target overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-36 border-2 border-danger/70 rounded-xl relative">
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-danger shadow-[0_0_10px_hsl(var(--danger))]"
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-danger rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-danger rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-danger rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-danger rounded-br-lg" />
                
                {/* Barcode visual hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="flex items-end gap-[2px] h-12">
                    {/* Simulated barcode lines */}
                    {[3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3].map((width, i) => (
                      <div 
                        key={i} 
                        className="bg-danger/60 rounded-sm"
                        style={{ 
                          width: `${width * 2}px`, 
                          height: `${60 + (i % 3) * 20}%` 
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Flashlight toggle button */}
            {torchAvailable && (
              <div className="absolute top-3 right-3 pointer-events-auto">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={toggleTorch}
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg backdrop-blur-sm",
                    torchEnabled 
                      ? "bg-caution text-caution-foreground hover:bg-caution/90" 
                      : "bg-card/80 text-card-foreground hover:bg-card"
                  )}
                >
                  {torchEnabled ? (
                    <Flashlight className="w-6 h-6" />
                  ) : (
                    <FlashlightOff className="w-6 h-6" />
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Align the barcode within the frame
        <span className="block text-xs mt-1 opacity-75">Supports food barcodes (UPC/EAN) and prescription bottles (NDC/Code 128)</span>
      </p>

      {/* Manual entry option */}
      <Button 
        variant="outline" 
        onClick={switchToManualEntry} 
        className="w-full border-border text-foreground hover:bg-muted gap-2"
        disabled={isProcessing}
      >
        <Keyboard className="w-4 h-4" />
        Enter Barcode Manually
      </Button>

      <Button 
        variant="ghost" 
        onClick={handleClose} 
        className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
        disabled={isProcessing}
      >
        Cancel
      </Button>
    </div>
  );
};
