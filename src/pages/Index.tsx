import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Bell, Hash, Calendar, ArrowRight, GraduationCap, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      title: 'Connect',
      description: 'Find friends and networking opportunities on campus',
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      path: '/connect',
      badges: ['Friends', 'Network', 'Study Groups']
    },
    {
      title: 'Campus Pulse',
      description: 'Stay updated with campus news, events, and announcements',
      icon: Bell,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      path: '/pulse',
      badges: ['News', 'Events', 'Updates']
    },
    {
      title: 'AnonySpace',
      description: 'Share thoughts and questions anonymously with the campus community',
      icon: Hash,
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary-foreground',
      path: '/anonyspace',
      badges: ['Anonymous', 'Safe Space', 'Community']
    },
    {
      title: 'ClubVerse',
      description: 'Discover and join student clubs and organizations',
      icon: GraduationCap,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      path: '/clubverse',
      badges: ['Clubs', 'Activities', 'Community']
    },
    {
      title: 'Dating',
      description: 'Find meaningful connections with verified students on campus',
      icon: Sparkles,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      path: '/dating',
      badges: ['Verified', 'Matches', 'Chat']
    },
    {
      title: 'Events',
      description: 'Create and RSVP to campus events and activities',
      icon: Calendar,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      path: '/events',
      badges: ['Calendar', 'Social', 'RSVPs']
    },
    {
      title: 'Alumni Network',
      description: 'Connect with alumni for mentoring and career opportunities',
      icon: MessageSquare,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      path: '/alumni',
      badges: ['Mentorship', 'Jobs', 'Career']
    },
    {
      title: 'Messages',
      description: 'Chat with your connections in real-time',
      icon: MessageSquare,
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary-foreground',
      path: '/messages',
      badges: ['Real-time', 'Secure', 'Voice Notes']
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Heart className="h-4 w-4" />
            <span>Your Campus Social Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            Welcome to Bazinga
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect, discover, and thrive in your campus community with all the tools you need in one place
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-muted/40 hover:border-primary/40 overflow-hidden"
                onClick={() => navigate(feature.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`p-3 ${feature.iconBg} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {feature.badges.map((badge, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10 group-hover:text-primary">
                    Explore
                    <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/10">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
          <CardContent className="relative p-6 sm:p-8 lg:p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                Complete your profile and unlock all features. Join thousands of students already connecting on campus.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="gap-2 shadow-lg hover:shadow-xl transition-shadow" 
                  onClick={() => navigate('/profile')}
                >
                  Complete Profile
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => navigate('/connect')}
                >
                  Start Connecting
                  <Users className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
