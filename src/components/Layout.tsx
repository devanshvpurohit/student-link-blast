import { ReactNode, useState } from 'react';
import { Users, MessageSquare, Bell, Hash, Calendar, User, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: Users, label: 'Connect', path: '/connect' },
    { icon: Bell, label: 'Pulse', path: '/pulse' },
    { icon: Hash, label: 'AnonySpace', path: '/anonyspace' },
    { icon: Calendar, label: 'ClubVerse', path: '/clubverse' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      {user && (
        <>
          {/* Desktop Floating Sidebar */}
          <aside className="hidden lg:flex fixed left-6 top-6 bottom-6 w-20 flex-col items-center py-8 glass rounded-3xl z-50 transition-all duration-300 hover:w-64 group overflow-hidden">
            <div
              className="mb-8 cursor-pointer transform transition-transform hover:scale-110"
              onClick={() => navigate('/')}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="text-white font-bold text-xl">B</span>
              </div>
            </div>

            <nav className="flex-1 w-full px-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 relative overflow-hidden transition-all duration-300",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                    <item.icon className={cn("h-5 w-5 min-w-[20px] transition-colors", isActive ? "text-primary" : "")} />
                    <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </nav>

            <div className="w-full px-4 space-y-2 mt-auto">
              <div className="pt-2 border-t border-white/10 w-full">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5 min-w-[20px]" />
                  <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                    Sign Out
                  </span>
                </Button>
              </div>
            </div>
          </aside>

          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2" onClick={() => navigate('/')}>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="font-bold text-lg text-foreground">Bazinga</span>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </header>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 top-16 bg-background z-40 lg:hidden animate-fade-in p-4 overflow-y-auto">
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={location.pathname === item.path ? "secondary" : "ghost"}
                    className="w-full justify-start h-12 text-lg"
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                ))}
                <div className="h-px bg-border my-4" />
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "relative min-h-screen transition-all duration-300",
        user ? "lg:pl-32 lg:pr-6 pt-20 lg:pt-6" : ""
      )}>
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;