import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DebugProvider } from "@/contexts/DebugContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionDebugPanel } from "@/components/SubscriptionDebugPanel";
import CookieConsent from "@/components/CookieConsent";
import { useAnalytics } from "@/hooks/useAnalytics";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Scanner = lazy(() => import("./pages/Scanner"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Subscription = lazy(() => import("./pages/Subscription"));
const ShoppingAnalyzer = lazy(() => import("./pages/ShoppingAnalyzer"));
const FamilyProfiles = lazy(() => import("./pages/FamilyProfiles"));
const MealPlanner = lazy(() => import("./pages/MealPlanner"));
const SavedRecipes = lazy(() => import("./pages/SavedRecipes"));
const Admin = lazy(() => import("./pages/Admin"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const HealthReports = lazy(() => import("./pages/HealthReports"));
const SharedResult = lazy(() => import("./pages/SharedResult"));
const Symptoms = lazy(() => import("./pages/Symptoms"));
const IngredientChat = lazy(() => import("./pages/IngredientChat"));
const Medications = lazy(() => import("./pages/Medications"));
const About = lazy(() => import("./pages/About"));
const Team = lazy(() => import("./pages/Team"));
const Press = lazy(() => import("./pages/Press"));
const Community = lazy(() => import("./pages/Community"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LegalHelp = lazy(() => import("./pages/LegalHelp"));
const BlogIndexPage = lazy(() => import("./pages/blog/Index"));
const BlogPostPage = lazy(() => import("./pages/blog/Post"));
const CategoryPage = lazy(() => import("./pages/blog/Category"));
const TagPage = lazy(() => import("./pages/blog/Tag"));

const queryClient = new QueryClient();

// Redirect authenticated users away from auth page
const AuthRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/onboarding" replace />;
  return <Auth />;
};

// Analytics wrapper component - must be rendered inside Router
const AnalyticsWrapper = () => {
  useAnalytics();
  return null;
};

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DebugProvider>
            <TooltipProvider>
              <AnalyticsWrapper />
              <Toaster />
              <Sonner />
              <SubscriptionDebugPanel />
              <CookieConsent />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthRoute />} />
                <Route path="/install" element={<Install />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/about" element={<About />} />
                <Route path="/team" element={<Team />} />
                <Route path="/press" element={<Press />} />
                <Route path="/blog" element={<BlogIndexPage />} />
                <Route path="/blog/category/:slug" element={<CategoryPage />} />
                <Route path="/blog/tag/:tag" element={<TagPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/scan/:scanId" element={<SharedResult />} />
                
                {/* Onboarding - now public for demo */}
                <Route path="/onboarding" element={<Onboarding />} />
                
                {/* All routes now public for demo access */}
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/shopping-analyzer" element={<ShoppingAnalyzer />} />
                <Route path="/family-profiles" element={<FamilyProfiles />} />
                <Route path="/meal-planner" element={<MealPlanner />} />
                <Route path="/saved-recipes" element={<SavedRecipes />} />
                <Route path="/health-reports" element={<HealthReports />} />
                <Route path="/symptoms" element={<Symptoms />} />
                <Route path="/ingredient-chat" element={<IngredientChat />} />
                <Route path="/medications" element={<Medications />} />
                <Route path="/community" element={<Community />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/legal-help" element={<LegalHelp />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/notifications" element={<Notifications />} />
                
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TooltipProvider>
          </DebugProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
