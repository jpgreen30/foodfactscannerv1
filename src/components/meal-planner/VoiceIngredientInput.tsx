import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceIngredientInputProps {
  onTranscript: (text: string) => void;
}

export const VoiceIngredientInput = ({ onTranscript }: VoiceIngredientInputProps) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + "\n";
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript((prev) => prev + finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use voice input",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, toast]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    
    setTranscript("");
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    setIsListening(false);
    recognitionRef.current.stop();
  };

  const confirmTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript("");
    }
  };

  const cancelTranscript = () => {
    setTranscript("");
    stopListening();
  };

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <div className="space-y-2">
      {/* Mic Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "default" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          className={cn(
            "gap-2 transition-all",
            isListening
              ? "bg-danger hover:bg-danger/90 text-foreground animate-pulse"
              : "border-border text-foreground hover:bg-muted"
          )}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Voice Input
            </>
          )}
        </Button>

        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1"
          >
            <span className="w-2 h-2 bg-danger rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Listening...</span>
          </motion.div>
        )}
      </div>

      {/* Transcript Preview */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-muted/50 rounded-lg border border-border"
          >
            <p className="text-sm text-foreground/80 whitespace-pre-wrap mb-3">
              {transcript}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={confirmTranscript}
                className="flex-1 bg-safe hover:bg-safe/90 text-foreground"
              >
                <Check className="w-4 h-4 mr-1" />
                Add
              </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelTranscript}
                  className="border-border text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
