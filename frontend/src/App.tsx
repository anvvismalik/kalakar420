import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LanguageSelection from "./pages/LanguageSelection";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Studio from "./pages/Studio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to check if language is selected
const LanguageGuard = ({ children }: { children: React.ReactNode }) => {
  const languageSelected = localStorage.getItem('kalakaar-language-selected');
  
  if (!languageSelected) {
    return <Navigate to="/language" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/language" element={<LanguageSelection />} />
            <Route
              path="/"
              element={
                <LanguageGuard>
                  <Index />
                </LanguageGuard>
              }
            />
            <Route
              path="/dashboard"
              element={
                <LanguageGuard>
                  <Dashboard />
                </LanguageGuard>
              }
            />
            <Route
              path="/signin"
              element={
                <LanguageGuard>
                  <SignIn />
                </LanguageGuard>
              }
            />
            <Route
              path="/signup"
              element={
                <LanguageGuard>
                  <SignUp />
                </LanguageGuard>
              }
            />
            <Route
              path="/studio"
              element={
                <LanguageGuard>
                  <Studio />
                </LanguageGuard>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;