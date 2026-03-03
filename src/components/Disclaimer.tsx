import { Info, Bot } from "lucide-react";

export const Disclaimer = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-xl text-sm border border-primary/20">
        <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">AI Disclaimer:</span> This analysis is AI-generated and is not a substitute for professional medical advice. Results may contain inaccuracies.
        </p>
      </div>
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl text-sm">
        <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Medical Disclaimer:</span> This information is for educational purposes only and is not medical advice. Always consult a healthcare professional for dietary decisions.
        </p>
      </div>
    </div>
  );
};
