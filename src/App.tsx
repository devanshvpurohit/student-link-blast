import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Connect from "./pages/Connect";
import Pulse from "./pages/Pulse";
import AnonySpace from "./pages/AnonySpace";
import ClubVerse from "./pages/ClubVerse";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import StudyRoom from "./pages/StudyRoom";
import Alumni from "./pages/Alumni";
import Discover from "./pages/Discover";
import Events from "./pages/Events";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, hasProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (hasProfile === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="bazinga-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/auth" element={<Auth />} />

            {/* Onboarding Route (requires auth but not profile) */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* Application Routes (require auth and profile) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Index /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/connect" element={
              <ProtectedRoute>
                <Layout><Connect /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/pulse" element={
              <ProtectedRoute>
                <Layout><Pulse /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/study-room" element={
              <ProtectedRoute>
                <Layout><StudyRoom /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/anonyspace" element={
              <ProtectedRoute>
                <Layout><AnonySpace /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/clubverse" element={
              <ProtectedRoute>
                <Layout><ClubVerse /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Layout><Messages /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/alumni" element={
              <ProtectedRoute>
                <Layout><Alumni /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/discover" element={
              <ProtectedRoute>
                <Layout><Discover /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/dating" element={<Navigate to="/discover" replace />} />
            <Route path="/events" element={
              <ProtectedRoute>
                <Layout><Events /></Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
