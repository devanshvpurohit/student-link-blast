import { ReactNode } from 'react';
import { Users, MessageSquare, Bell, Hash, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Users, label: 'Connect', path: '/connect' },
    { icon: Bell, label: 'Pulse', path: '/pulse' },
    { icon: Hash, label: 'AnonySpace', path: '/anonyspace' },
    { icon: Calendar, label: 'ClubVerse', path: '/clubverse' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 
            className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => navigate('/')}
          >
            Bazinga
          </h1>
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* Navigation */}
        {user && (
          <nav className="w-64 bg-card border-r min-h-screen p-4">
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
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;