import { useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Bell, Calendar, ArrowRight, GraduationCap, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PullToRefresh from '@/components/PullToRefresh';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    // Simulate refresh - in real app, this would refetch data
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshKey(prev => prev + 1);
  }, []);
  const features = [
    {
      title: 'Connect',
      description: 'Find friends on campus',
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      path: '/connect',
    },
    {
      title: 'Dating',
      description: 'Meet verified students',
      icon: Sparkles,
      iconBg: 'bg-dating/10',
      iconColor: 'text-dating',
      path: '/dating',
    },
    {
      title: 'ClubVerse',
      description: 'Join student clubs',
      icon: GraduationCap,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent-foreground',
      path: '/clubverse',
    },
    {
      title: 'Events',
      description: 'Campus activities',
      icon: Calendar,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      path: '/events',
    },
    {
      title: 'Pulse',
      description: 'Campus news & updates',
      icon: Bell,
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary-foreground',
      path: '/pulse',
    },
    {
      title: 'Alumni',
      description: 'Career & mentorship',
      icon: MessageSquare,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      path: '/alumni',
    },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="h-full">
      <div key={refreshKey} className="flex flex-col p-4 pb-2 min-h-full">
        {/* Hero Section - Compact */}
        <div className="text-center mb-4 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
            <Heart className="h-3 w-3" />
            <span>Your Campus Hub</span>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-gradient">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground">
            What would you like to do today?
          </p>
        </div>

        {/* Features Grid - Compact cards */}
        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group active:scale-95 transition-transform cursor-pointer border-muted/40 overflow-hidden"
                onClick={() => navigate(feature.path)}
              >
                <CardContent className="p-4">
                  <div className={`p-2.5 ${feature.iconBg} rounded-xl w-fit mb-2`}>
                    <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-0.5">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions - Sticky at bottom */}
        <div className="shrink-0 pt-3 space-y-2">
          <Button 
            className="w-full gap-2" 
            onClick={() => navigate('/profile')}
          >
            Complete Profile
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            className="w-full gap-2" 
            onClick={() => navigate('/connect')}
          >
            Start Connecting
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default Index;
