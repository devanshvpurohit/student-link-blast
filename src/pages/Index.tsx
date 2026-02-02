import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users, MessageSquare, Bell, Hash, Calendar, ChevronRight,
  GraduationCap, Sparkles, BookOpen, PenTool, Heart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    { icon: Sparkles, label: "Discover", desc: "Find your match", path: "/discover", rotate: "-1deg" },
    { icon: Users, label: "Connect", desc: "Campus friends", path: "/connect", rotate: "1deg" },
    { icon: Calendar, label: "Events", desc: "What's happening", path: "/events", rotate: "-0.5deg" },
    { icon: Bell, label: "Pulse", desc: "Stay updated", path: "/pulse", rotate: "0.5deg" },
  ];

  const contentBlocks = [
    {
      title: '📚 Directory',
      items: [
        { title: 'ClubVerse', icon: GraduationCap, desc: 'Student organizations & clubs', path: '/clubverse' },
        { title: 'Alumni', icon: BookOpen, desc: 'Network with graduates', path: '/alumni' },
      ]
    },
    {
      title: '💬 Social',
      items: [
        { title: 'AnonySpace', icon: Hash, desc: 'Anonymous discussions', path: '/anonyspace' },
        { title: 'Messages', icon: MessageSquare, desc: 'Direct chats & groups', path: '/messages' },
      ]
    }
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center font-handwriting text-2xl text-muted-foreground">
        Loading your notebook...
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">

      {/* Header / Greeting - Handwritten Style */}
      <div className="space-y-3 mt-6 sm:mt-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-scribble">
          <PenTool className="h-4 w-4" />
          <span>My Campus Notebook</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl text-foreground">
          Hey, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}! ✨
        </h1>
        <p className="text-muted-foreground font-handwritingAlt text-xl">
          Here's what's happening on campus today...
        </p>
      </div>

      {/* Quick Access - Sticky Note Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link, i) => (
          <button
            key={i}
            onClick={() => navigate(link.path)}
            style={{ transform: `rotate(${link.rotate})` }}
            className="group flex flex-col items-start gap-3 p-4 rounded-xl border-2 border-dashed border-border bg-card hover:border-accent hover:border-solid transition-all text-left shadow-paper hover:shadow-paper-hover"
          >
            <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <link.icon className="h-5 w-5" />
            </div>
            <div>
              <span className="font-handwritingAlt text-lg block">{link.label}</span>
              <span className="text-xs text-muted-foreground font-scribble">{link.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Divider - Notebook line style */}
      <div className="relative py-4">
        <div className="h-px bg-border w-full" />
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 bg-background px-3">
          <span className="text-muted-foreground font-handwriting text-lg">~</span>
        </div>
      </div>

      {/* Content Sections - Paper Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {contentBlocks.map((block, i) => (
          <div key={i} className="space-y-4">
            <h3 className="font-handwriting text-2xl text-foreground pl-1">
              {block.title}
            </h3>
            <div className="space-y-2">
              {block.items.map((item, j) => (
                <div
                  key={j}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/5 cursor-pointer transition-all group shadow-paper hover:shadow-paper-hover"
                >
                  <div className="p-2.5 bg-muted rounded-lg text-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-handwritingAlt text-lg">{item.title}</h4>
                    <p className="text-sm text-muted-foreground font-scribble">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA - Sticky Note Style */}
      <div 
        className="mt-8 p-6 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-handwriting text-2xl flex items-center gap-2 justify-center sm:justify-start">
            <Heart className="h-5 w-5 text-accent" />
            Complete your profile!
          </h3>
          <p className="text-sm text-muted-foreground font-scribble">
            Add your interests to get better matches & connections ✏️
          </p>
        </div>
        <Button 
          onClick={() => navigate('/profile')} 
          variant="outline" 
          className="bg-background font-handwritingAlt text-base border-2 hover:border-accent hover:bg-accent/10"
        >
          Edit Profile →
        </Button>
      </div>

    </div>
  );
};

export default Index;
