import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  Scan, 
  Users, 
  User, 
  Grid3X3,
  ShoppingCart,
  Pill,
  UtensilsCrossed,
  History,
  FileText,
  Trophy,
  Baby,
  MessageCircle,
  BookOpen,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

const mainNavItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/scanner", icon: Scan, label: "Scan" },
  { path: "/community", icon: Users, label: "Feed" },
  { path: "more", icon: Grid3X3, label: "More", isDrawer: true },
  { path: "/profile", icon: User, label: "Profile" },
];

const moreMenuItems = [
  { path: "/shopping-analyzer", icon: ShoppingCart, label: "Shopping", premium: true },
  { path: "/medications", icon: Pill, label: "Medications", premium: true },
  { path: "/meal-planner", icon: UtensilsCrossed, label: "Meal Planner", premium: true },
  { path: "/history", icon: History, label: "Scan History", premium: false },
  { path: "/health-reports", icon: FileText, label: "Reports", premium: true },
  { path: "/leaderboard", icon: Trophy, label: "Rewards", premium: false },
  { path: "/family-profiles", icon: Baby, label: "Family", premium: true },
  { path: "/ingredient-chat", icon: MessageCircle, label: "AI Chat", premium: true },
  { path: "/saved-recipes", icon: BookOpen, label: "Recipes", premium: true },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "more") {
      return moreMenuItems.some(item => 
        location.pathname === item.path || location.pathname.startsWith(item.path + "/")
      );
    }
    return location.pathname === path || 
      (path !== "/" && location.pathname.startsWith(path));
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border md:hidden">
        <div className="flex items-center justify-around h-16 px-2 pb-safe max-w-lg mx-auto">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            
            if (item.isDrawer) {
              return (
                <button
                  key={item.path}
                  onClick={() => setIsMoreOpen(true)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors min-w-[60px]",
                    active
                      ? "text-danger"
                      : "text-muted-foreground active:bg-danger/10"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn("w-5 h-5", active && "scale-110")} />
                    {active && (
                      <motion.div
                        layoutId="bottom-nav-glow"
                        className="absolute -inset-2 rounded-full bg-danger/20 blur-md -z-10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    active && "font-bold"
                  )}>
                    {item.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-danger shadow-[0_0_8px_hsl(var(--danger))]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors min-w-[60px]",
                  active
                    ? "text-danger"
                    : "text-muted-foreground active:bg-danger/10"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("w-5 h-5", active && "scale-110")} />
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-glow"
                      className="absolute -inset-2 rounded-full bg-danger/20 blur-md -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  active && "font-bold"
                )}>
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-danger shadow-[0_0_8px_hsl(var(--danger))]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between border-b pb-4">
            <DrawerTitle className="text-lg font-semibold">More Features</DrawerTitle>
            <DrawerClose asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="p-4 grid grid-cols-3 gap-4 pb-8">
            {moreMenuItems.map((item) => {
              const itemActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                    itemActive 
                      ? "bg-danger/10 text-danger" 
                      : "hover:bg-muted active:scale-95"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    itemActive ? "bg-danger/20" : "bg-muted"
                  )}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center",
                    itemActive && "font-bold"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
