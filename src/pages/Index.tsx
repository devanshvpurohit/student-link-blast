import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, MessageSquare, Bell, Hash, Calendar, ArrowRight,
  GraduationCap, Sparkles, BookOpen, PenTool, Layout as LayoutIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    { icon: Sparkles, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-100", label: "Discover", path: "/discover" },
    { icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-100", label: "Connect", path: "/connect" },
    { icon: Calendar, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-100", label: "Events", path: "/events" },
    { icon: Bell, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-100", label: "Pulse", path: "/pulse" },
  ];

  const contentBlocks = [
    {
      title: 'Directory',
      items: [
        { title: 'ClubVerse', icon: GraduationCap, desc: 'Student organizations & clubs', path: '/clubverse' },
        { title: 'Alumni', icon: BookOpen, desc: 'Network with graduates', path: '/alumni' },
      ]
    },
    {
      title: 'Social',
      items: [
        { title: 'AnonySpace', icon: Hash, desc: 'Anonymous discussions', path: '/anonyspace' },
        { title: 'Messages', icon: MessageSquare, desc: 'Direct chats & groups', path: '/messages' },
      ]
    }
  ];

  if (loading) return <div className="h-screen flex items-center justify-center text-sm text-muted-foreground">Loading workspace...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">

      {/* Header / Greeting */}
      <div className="space-y-2 mt-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-wider font-mono">
          <PenTool className="h-3 w-3" />
          <span>Workspace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening on campus today.
        </p>
      </div>

      {/* Quick Access Grid (Notion-like top blocks) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link, i) => (
          <button
            key={i}
            onClick={() => navigate(link.path)}
            className="group flex flex-col items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all text-left"
          >
            <div className={cn("p-2 rounded-md", link.color)}>
              <link.icon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-medium block group-hover:underline decoration-1 underline-offset-4">{link.label}</span>
              <span className="text-xs text-muted-foreground">Click to open</span>
            </div>
          </button>
        ))}
      </div>

      <div className="h-px bg-border w-full" />

      {/* Content Sections */}
      <div className="grid md:grid-cols-2 gap-8">
        {contentBlocks.map((block, i) => (
          <div key={i} className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">
              {block.title}
            </h3>
            <div className="space-y-2">
              {block.items.map((item, j) => (
                <div
                  key={j}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="p-2 bg-muted rounded-md text-foreground group-hover:bg-background border border-transparent group-hover:border-border transition-all">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* "New Page" / CTA Area */}
      <div className="mt-8 p-6 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-medium">Complete your Student ID</h3>
          <p className="text-sm text-muted-foreground">Add your major, year, and interests to get better matches.</p>
        </div>
        <Button onClick={() => navigate('/profile')} variant="outline" className="bg-background">
          Edit Profile
        </Button>
      </div>

    </div>
  );
};

export default Index;
