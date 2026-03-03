import { ReactNode } from "react";
import { Header } from "@/components/Header";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
  containerClassName?: string;
}

export const AppLayout = ({ 
  children, 
  showBottomNav = true,
  className,
  containerClassName 
}: AppLayoutProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const shouldShowBottomNav = showBottomNav && user && isMobile;

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <Header />
      <main className={cn(
        "container max-w-lg mx-auto px-4 py-6",
        shouldShowBottomNav && "pb-28",
        containerClassName
      )}>
        {children}
      </main>
      {user && <BottomNavigation />}
    </div>
  );
};
