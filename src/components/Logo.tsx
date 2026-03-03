import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-new-1.svg";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showGlow?: boolean;
}

const sizeClasses = {
  sm: "h-9",
  md: "h-16",
  lg: "h-24",
  xl: "h-32",
  "2xl": "h-44"
};

export const Logo = ({ size = "md", className, showGlow = false }: LogoProps) => {
  return (
    <img 
      src={logoImage} 
      alt="Food Fact Scanner" 
      className={cn(
        sizeClasses[size],
        "w-auto object-contain",
        showGlow && "drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]",
        className
      )}
    />
  );
};
