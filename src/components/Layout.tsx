import { ReactNode, useState } from 'react';
import { Users, MessageSquare, Bell, Hash, Calendar, User, Hand, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HandGestureControl } from '@/components/HandGestureControl';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showHandControl, setShowHandControl] = useState(false);

  const menuItems = [
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
      <header className="bg-card border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 
            className="text-xl md:text-2xl font-bold text-primary cursor-pointer"
            onClick={() => navigate('/')}
          >
            Bazinga
          </h1>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHandControl(!showHandControl)}
              className="h-8 w-8 p-0"
            >
              <Hand className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            {user && (
              <>
                <span className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
        {/* Mobile Navigation */}
        {user && (
          <nav className="lg:hidden bg-card border-b p-2">
            <div className="flex gap-1 overflow-x-auto">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  className="flex-shrink-0 gap-2"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden xs:inline">{item.label}</span>
                </Button>
              ))}
            </div>
          </nav>
        )}

        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden lg:block w-64 bg-card border-r min-h-screen p-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
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
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>

      {showHandControl && <HandGestureControl onClose={() => setShowHandControl(false)} />}
    </div>
  );
};

export default Layout;