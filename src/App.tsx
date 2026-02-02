import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import Alumni from "./pages/Alumni";
import Discover from "./pages/Discover";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="bazinga-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/pulse" element={<Pulse />} />
              <Route path="/anonyspace" element={<AnonySpace />} />
              <Route path="/clubverse" element={<ClubVerse />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/alumni" element={<Alumni />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/dating" element={<Navigate to="/discover" replace />} />
              <Route path="/events" element={<Events />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
