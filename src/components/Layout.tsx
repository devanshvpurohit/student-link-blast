import { ReactNode, useState } from 'react';
import {
  Users, MessageSquare, Bell, Hash, Calendar, User,
  GraduationCap, Sparkles, Menu, X, LogOut, Search,
  ChevronRight, PanelLeftClose, PanelLeft, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Sparkles, label: 'Discover', path: '/discover' },
    { icon: Users, label: 'Connect', path: '/connect' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Pulse', path: '/pulse' },
    { icon: Hash, label: 'AnonySpace', path: '/anonyspace' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: GraduationCap, label: 'ClubVerse', path: '/clubverse' },
    { icon: MessageSquare, label: 'Alumni', path: '/alumni' },
  ];

  const isAuthPage = location.pathname === '/auth';
  if (isAuthPage) return <div className="min-h-screen bg-background">{children}</div>;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* 
        ========================================
        SIDEBAR NAVIGATION (Desktop)
        ========================================
      */}
      {user && (
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r border-border bg-sidebar-background transition-all duration-300 ease-in-out h-screen sticky top-0",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Sidebar Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
            {!sidebarCollapsed && (
              <div
                className="flex items-center gap-2 font-semibold cursor-pointer"
                onClick={() => navigate('/')}
              >
                <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">B</div>
                <span className="truncate">Bazinga</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          {/* User Profile Snippet */}
          {!sidebarCollapsed && (
            <div className="px-3 py-4">
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 transition-colors text-left group"
              >
                <Avatar className="h-8 w-8 rounded border border-border">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="rounded bg-muted text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || 'Student'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <ScrollArea className="flex-1 px-3">
            <nav className="flex flex-col gap-1 py-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-foreground")} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border/50 gap-1 flex flex-col">
            <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "justify-between px-2")}>
              <ThemeToggle />
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-destructive h-8 px-2"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* 
        ========================================
        MAIN CONTENT AREA
        ========================================
      */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">B</div>
            <span>Bazinga</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background pt-16 px-6 pb-6 overflow-y-auto animate-in fade-in slide-in-from-top-4">
            <nav className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                    location.pathname === item.path
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-border my-2" />
              <button
                onClick={() => {
                  navigate('/profile');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-muted/50"
              >
                <User className="h-5 w-5" />
                Profile
              </button>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
