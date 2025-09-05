import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Bell, Hash, Calendar, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading } = useAuth();

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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome to Bazinga
        </h1>
        <p className="text-xl text-muted-foreground">The ultimate campus social platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/connect'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              Connect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Find friends, dating connections, and networking opportunities on campus.
            </p>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                Friends
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Heart className="h-3 w-3" />
                Dating
              </Badge>
            </div>
            <Button variant="outline" className="w-full gap-2">
              Start Connecting <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/pulse'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              Campus Pulse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Stay updated with campus news, events, and announcements.
            </p>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">News</Badge>
              <Badge variant="secondary">Events</Badge>
              <Badge variant="secondary">Updates</Badge>
            </div>
            <Button variant="outline" className="w-full gap-2">
              View Updates <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/anonyspace'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Hash className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              AnonySpace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Share thoughts and questions anonymously with the campus community.
            </p>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">Anonymous</Badge>
              <Badge variant="secondary">Safe Space</Badge>
            </div>
            <Button variant="outline" className="w-full gap-2">
              Share Anonymously <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/clubverse'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              ClubVerse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Discover and join student clubs and organizations on campus.
            </p>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">Clubs</Badge>
              <Badge variant="secondary">Activities</Badge>
            </div>
            <Button variant="outline" className="w-full gap-2">
              Explore Clubs <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/messages'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <MessageSquare className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Chat with your connections in real-time.
            </p>
            <div className="flex gap-2 mb-4">
              <Badge variant="secondary">Real-time</Badge>
              <Badge variant="secondary">Secure</Badge>
            </div>
            <Button variant="outline" className="w-full gap-2">
              Open Chat <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-6 text-center">
            <div className="text-muted-foreground">
              <p className="font-semibold mb-2">More features coming soon!</p>
              <p className="text-sm">Gamified Momentum, AI recommendations, and premium features.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to get started?</h2>
          <p className="text-muted-foreground mb-4">
            Complete your profile and start connecting with your campus community.
          </p>
          <Button size="lg" className="gap-2">
            Complete Profile <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
