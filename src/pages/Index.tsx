import { useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Calendar, ArrowRight, Sparkles, Heart, Flame, Camera, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PullToRefresh from '@/components/PullToRefresh';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshKey(prev => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dating mx-auto"></div>
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
        {/* Hero Section - Dating Focus */}
        <div className="relative mb-4 pt-2">
          <div className="absolute inset-0 bg-gradient-to-br from-dating/20 via-transparent to-primary/10 rounded-3xl blur-3xl -z-10" />
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dating/10 text-dating text-xs font-semibold mb-3 animate-pulse-subtle">
              <Flame className="h-3.5 w-3.5" />
              <span>Find Your Match</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              <span className="text-gradient">Date.</span>{' '}
              <span className="text-foreground">Connect.</span>{' '}
              <span className="text-muted-foreground">Vibe.</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Meet verified students near you
            </p>
          </div>
        </div>

        {/* Primary Action - Start Dating */}
        <Card 
          className="group mb-4 overflow-hidden border-dating/30 bg-gradient-to-br from-dating/5 to-transparent cursor-pointer active:scale-[0.98] transition-all"
          onClick={() => navigate('/dating')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-dating/10 rounded-2xl">
              <Heart className="h-7 w-7 text-dating" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Start Swiping</h3>
              <p className="text-xs text-muted-foreground">
                Discover compatible matches today
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-dating group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-3 rounded-xl bg-card border">
            <Zap className="h-4 w-4 text-dating mx-auto mb-1" />
            <p className="text-lg font-bold">24</p>
            <p className="text-2xs text-muted-foreground">New Likes</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-card border">
            <Sparkles className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">8</p>
            <p className="text-2xs text-muted-foreground">Matches</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-card border">
            <MessageSquare className="h-4 w-4 text-success mx-auto mb-1" />
            <p className="text-lg font-bold">12</p>
            <p className="text-2xs text-muted-foreground">Messages</p>
          </div>
        </div>

        {/* Social Features Grid */}
        <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">SOCIAL</h2>
        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
          <Card 
            className="group active:scale-95 transition-transform cursor-pointer border-muted/40"
            onClick={() => navigate('/connect')}
          >
            <CardContent className="p-4">
              <div className="p-2.5 bg-primary/10 rounded-xl w-fit mb-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-0.5">Friends</h3>
              <p className="text-xs text-muted-foreground">Connect with classmates</p>
            </CardContent>
          </Card>

          <Card 
            className="group active:scale-95 transition-transform cursor-pointer border-muted/40"
            onClick={() => navigate('/pulse')}
          >
            <CardContent className="p-4">
              <div className="p-2.5 bg-accent/10 rounded-xl w-fit mb-2">
                <Camera className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-sm mb-0.5">Feed</h3>
              <p className="text-xs text-muted-foreground">Campus updates</p>
            </CardContent>
          </Card>

          <Card 
            className="group active:scale-95 transition-transform cursor-pointer border-muted/40"
            onClick={() => navigate('/events')}
          >
            <CardContent className="p-4">
              <div className="p-2.5 bg-success/10 rounded-xl w-fit mb-2">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-semibold text-sm mb-0.5">Events</h3>
              <p className="text-xs text-muted-foreground">Parties & meetups</p>
            </CardContent>
          </Card>

          <Card 
            className="group active:scale-95 transition-transform cursor-pointer border-muted/40"
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-4">
              <div className="p-2.5 bg-dating/10 rounded-xl w-fit mb-2">
                <MessageSquare className="h-5 w-5 text-dating" />
              </div>
              <h3 className="font-semibold text-sm mb-0.5">Chats</h3>
              <p className="text-xs text-muted-foreground">Keep in touch</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile CTA */}
        <div className="shrink-0 pt-3">
          <Button 
            variant="outline"
            className="w-full gap-2 border-dating/30 text-dating hover:bg-dating/10" 
            onClick={() => navigate('/profile')}
          >
            <Camera className="h-4 w-4" />
            Complete Your Profile
          </Button>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default Index;
