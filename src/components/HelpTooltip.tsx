import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const HelpTooltip = ({ content, side = "top", className = "" }: HelpTooltipProps) => {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button 
          type="button"
          className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full ${className}`}
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[250px] text-sm">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};
