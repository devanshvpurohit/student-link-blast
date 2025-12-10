import { ReactNode, useState, useEffect } from 'react';
import { Users, MessageSquare, Bell, Calendar, User, GraduationCap, Sparkles, Home, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
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

  // Bottom nav items for mobile - primary navigation
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
    { icon: GraduationCap, label: 'ClubVerse', path: '/clubverse' },
    { icon: Sparkles, label: 'Dating', path: '/dating' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: MessageSquare, label: 'Alumni', path: '/alumni' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Compact Header */}
      <header className="shrink-0 glass border-b safe-area-top z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 
            className="text-lg font-bold text-gradient cursor-pointer"
            onClick={() => navigate('/')}
          >
            Bazinga
          </h1>
          
          <div className="flex items-center gap-2">
            {installable ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleInstall}
                className="h-9 w-9 rounded-xl"
              >
                <Download className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/install')}
                className="h-9 w-9 rounded-xl text-muted-foreground"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <ThemeToggle />
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="rounded-xl text-xs"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Navigation - Sidebar */}
        {user && (
          <nav className="hidden lg:flex flex-col w-56 bg-card/50 backdrop-blur-sm border-r p-3 shrink-0">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 rounded-xl text-sm",
                    location.pathname === item.path 
                      ? "bg-primary text-primary-foreground" 
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

        {/* Main Content - Full height, scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - Fixed height */}
      {user && (
        <nav className="lg:hidden shrink-0 border-t bg-background/95 backdrop-blur-lg safe-area-bottom z-40">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-[56px]",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive && "scale-110"
                  )} />
                  <span className="text-2xs font-medium">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
