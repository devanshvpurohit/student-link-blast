import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users, MessageSquare, Bell, Hash, Calendar, ChevronRight,
  GraduationCap, Sparkles, BookOpen, Heart, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    { icon: Sparkles, label: "Discover", desc: "Find your match", path: "/discover" },
    { icon: Users, label: "Connect", desc: "Campus friends", path: "/connect" },
    { icon: Calendar, label: "Events", desc: "What's happening", path: "/events" },
    { icon: Bell, label: "Pulse", desc: "Stay updated", path: "/pulse" },
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <div className="w-8 h-8 rounded-xl bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold mx-auto mb-4 animate-pulse">
          B
        </div>
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="container-wide py-8 sm:py-12 space-y-10 animate-in">

      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl">
          Hello, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}.
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's what's happening on campus.
        </p>
      </div>

      {/* Quick Access */}
      <div className="feature-grid">
        {quickLinks.map((link, i) => (
          <button
            key={i}
            onClick={() => navigate(link.path)}
            className="card-interactive flex flex-col items-start gap-4 p-5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
              <link.icon className="h-5 w-5 text-accent group-hover:text-accent-foreground transition-colors duration-300" />
            </div>
            <div>
              <span className="font-semibold block text-[15px]">{link.label}</span>
              <span className="text-xs text-muted-foreground">{link.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid md:grid-cols-2 gap-10">
        {contentBlocks.map((block, i) => (
          <div key={i} className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {block.title}
            </h3>
            <div className="space-y-2">
              {block.items.map((item, j) => (
                <div
                  key={j}
                  onClick={() => navigate(item.path)}
                  className="card-interactive flex items-center gap-4 p-4"
                >
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[15px]">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="card-elevated p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Heart className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold">Complete your profile</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add your interests to get better matches & connections.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/profile')} 
          variant="accent"
          className="gap-2"
        >
          Edit Profile
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  );
};

export default Index;
