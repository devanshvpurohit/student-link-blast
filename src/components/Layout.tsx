import { ReactNode, useState, useEffect } from 'react';
import { Users, MessageSquare, Bell, Hash, Calendar, User, Hand, GraduationCap, Sparkles, Home, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HandGestureControl } from '@/components/HandGestureControl';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { canInstall, promptInstall, isAppInstalled } from '@/lib/pwa';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showHandControl, setShowHandControl] = useState(false);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    // Check if installable on mount and when prompt becomes available
    const checkInstallable = () => {
      setInstallable(canInstall() && !isAppInstalled());
    };

    checkInstallable();
    window.addEventListener('beforeinstallprompt', checkInstallable);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallable);
    };
  }, []);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setInstallable(false);
    }
  };

  // Bottom nav items for mobile
  const bottomNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Sparkles, label: 'Dating', path: '/dating' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: MessageSquare, label: 'Chat', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  // Full menu items for desktop sidebar
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Connect', path: '/connect' },
    { icon: Bell, label: 'Pulse', path: '/pulse' },
    { icon: Hash, label: 'AnonySpace', path: '/anonyspace' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: GraduationCap, label: 'ClubVerse', path: '/clubverse' },
    { icon: Sparkles, label: 'Dating', path: '/dating' },
    { icon: MessageSquare, label: 'Alumni', path: '/alumni' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b safe-area-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <h1 
            className="text-xl md:text-2xl font-bold text-gradient cursor-pointer transition-transform duration-200 hover:scale-105"
            onClick={() => navigate('/')}
          >
            Bazinga
          </h1>
          
          <div className="flex items-center gap-2 md:gap-3">
            {installable ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleInstall}
                className="gap-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-250"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Install</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/install')}
                className="gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Get App</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHandControl(!showHandControl)}
              className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 transition-colors duration-200"
            >
              <Hand className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            {user && (
              <>
                <span className="text-xs md:text-sm text-muted-foreground hidden md:block max-w-32 truncate">
                  {user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut}
                  className="rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
        {/* Desktop Navigation - Sidebar */}
        {user && (
          <nav className="hidden lg:block w-64 bg-card/50 backdrop-blur-sm border-r min-h-[calc(100vh-64px)] p-4 sticky top-16">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 rounded-xl transition-all duration-200",
                    location.pathname === item.path 
                      ? "bg-primary text-primary-foreground shadow-glow" 
                      : "hover:bg-primary/10 hover:text-primary"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-[calc(100vh-64px)] animate-fade-in",
          user && "pb-20 lg:pb-4" // Extra padding for bottom nav on mobile
        )}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="lg:hidden bottom-nav">
          <div className="flex items-center justify-around py-2 px-2">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-250 min-w-[60px]",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-2xs font-medium transition-colors",
                    isActive && "text-primary"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {showHandControl && <HandGestureControl onClose={() => setShowHandControl(false)} />}
    </div>
  );
};

export default Layout;
