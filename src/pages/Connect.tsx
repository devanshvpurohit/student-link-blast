import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Users, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  department?: string;
  bio?: string;
  year_of_study?: number;
  interests?: string[];
}

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  connection_type: string;
  profiles: Profile;
}

const Connect = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionType, setConnectionType] = useState<'friend' | 'dating' | 'networking'>('friend');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchConnections();
    }
  }, [user]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } else {
      setProfiles(data || []);
    }
  };

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        profiles!connections_receiver_id_fkey(*)
      `)
      .or(`requester_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      setConnections(data || []);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user?.id,
        receiver_id: receiverId,
        connection_type: connectionType,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Connection request sent!",
      });
      fetchConnections();
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update connection",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Connection ${status}!`,
      });
      fetchConnections();
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'dating': return <Heart className="h-4 w-4 text-red-500" />;
      case 'networking': return <Briefcase className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const pendingRequests = connections.filter(c => 
    c.receiver_id === user?.id && c.status === 'pending'
  );

  const myConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Connect</h1>
      
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="requests">
            Requests {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={connectionType === 'friend' ? 'default' : 'outline'}
                  onClick={() => setConnectionType('friend')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Friends
                </Button>
                <Button
                  variant={connectionType === 'dating' ? 'default' : 'outline'}
                  onClick={() => setConnectionType('dating')}
                  className="gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Dating
                </Button>
                <Button
                  variant={connectionType === 'networking' ? 'default' : 'outline'}
                  onClick={() => setConnectionType('networking')}
                  className="gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Networking
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        {profile.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{profile.full_name}</h3>
                      {profile.department && (
                        <p className="text-sm text-muted-foreground">{profile.department}</p>
                      )}
                      {profile.year_of_study && (
                        <p className="text-sm text-muted-foreground">Year {profile.year_of_study}</p>
                      )}
                    </div>
                  </div>
                  
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>
                  )}
                  
                  {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {profile.interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Button 
                    className="w-full gap-2"
                    onClick={() => sendConnectionRequest(profile.id)}
                  >
                    {getConnectionIcon(connectionType)}
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={request.profiles.avatar_url} />
                        <AvatarFallback>
                          {request.profiles.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.profiles.full_name}</h3>
                        <div className="flex items-center gap-2">
                          {getConnectionIcon(request.connection_type)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {request.connection_type} request
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => updateConnectionStatus(request.id, 'accepted')}
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateConnectionStatus(request.id, 'declined')}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-center text-muted-foreground">No pending requests</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="connections">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myConnections.map((connection) => {
              const otherProfile = connection.receiver_id === user?.id 
                ? connection.profiles 
                : connection.profiles;
              
              return (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={otherProfile.avatar_url} />
                        <AvatarFallback>
                          {otherProfile.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{otherProfile.full_name}</h3>
                        <div className="flex items-center gap-2">
                          {getConnectionIcon(connection.connection_type)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {connection.connection_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {myConnections.length === 0 && (
              <p className="text-center text-muted-foreground col-span-full">No connections yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Connect;