import { ReactNode, useState, useEffect } from 'react';
import { Users, MessageSquare, Calendar, User, Sparkles, Home, Download, Flame, Camera } from 'lucide-react';
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

  // Bottom nav - Dating + Social focus
  const bottomNavItems = [
    { icon: Home, label: 'Home', path: '/', color: 'text-primary' },
    { icon: Flame, label: 'Dating', path: '/dating', color: 'text-dating' },
    { icon: Camera, label: 'Feed', path: '/pulse', color: 'text-accent-foreground' },
    { icon: MessageSquare, label: 'Chat', path: '/messages', color: 'text-success' },
    { icon: User, label: 'Profile', path: '/profile', color: 'text-muted-foreground' },
  ];

  // Desktop sidebar menu
  const menuItems = [
    { icon: Home, label: 'Home', path: '/', color: 'text-primary' },
    { icon: Flame, label: 'Dating', path: '/dating', color: 'text-dating' },
    { icon: Users, label: 'Friends', path: '/connect', color: 'text-primary' },
    { icon: Camera, label: 'Feed', path: '/pulse', color: 'text-accent-foreground' },
    { icon: Calendar, label: 'Events', path: '/events', color: 'text-success' },
    { icon: MessageSquare, label: 'Messages', path: '/messages', color: 'text-success' },
    { icon: Sparkles, label: 'Clubs', path: '/clubverse', color: 'text-primary' },
    { icon: User, label: 'Profile', path: '/profile', color: 'text-muted-foreground' },
  ];

  const isDatingPage = location.pathname === '/dating';

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header with Dating branding */}
      <header className={cn(
        "shrink-0 border-b safe-area-top z-40 transition-colors",
        isDatingPage ? "bg-dating/5 border-dating/20" : "glass"
      )}>
        <div className="flex items-center justify-between px-4 h-14">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="p-1.5 bg-dating/10 rounded-lg">
              <Flame className="h-4 w-4 text-dating" />
            </div>
            <h1 className="text-lg font-bold">
              <span className="text-dating">Spark</span>
              <span className="text-foreground">Link</span>
            </h1>
          </div>
          
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
        {/* Desktop Sidebar */}
        {user && (
          <nav className="hidden lg:flex flex-col w-56 bg-card/50 backdrop-blur-sm border-r p-3 shrink-0">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const isDating = item.path === '/dating';
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 rounded-xl text-sm",
                      isActive && isDating && "bg-dating text-white hover:bg-dating/90",
                      isActive && !isDating && "bg-primary text-primary-foreground",
                      !isActive && "hover:bg-muted"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className={cn("h-4 w-4", !isActive && item.color)} />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="lg:hidden shrink-0 border-t bg-background/95 backdrop-blur-lg safe-area-bottom z-40">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isDating = item.path === '/dating';
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-[56px]",
                    isActive && isDating && "text-dating",
                    isActive && !isDating && "text-primary",
                    !isActive && "text-muted-foreground"
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
