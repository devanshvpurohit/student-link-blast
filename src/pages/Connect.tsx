import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Users, Briefcase, UserX, MessageSquare, GraduationCap } from 'lucide-react';
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
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionType, setConnectionType] = useState<string>('classmate');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchConnections();
    }
  }, [user]);

  const fetchProfiles = async () => {
    // Get all existing connections to filter out already connected users
    const { data: existingConnections } = await supabase
      .from('connections')
      .select('requester_id, receiver_id')
      .or(`requester_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

    const connectedUserIds = new Set(
      existingConnections?.flatMap(conn => [conn.requester_id, conn.receiver_id]) || []
    );
    connectedUserIds.add(user?.id!); // Exclude current user

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${Array.from(connectedUserIds).join(',')})`);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } else {
      setProfiles(data || []);
      setFilteredProfiles(data || []);
    }
  };

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*),
        receiver:profiles!connections_receiver_id_fkey(*)
      `)
      .or(`requester_id.eq.${user?.id},receiver_id.eq.${user?.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      // Transform data to include the correct profile info
      const transformedData = (data || []).map(connection => ({
        ...connection,
        profiles: connection.requester_id === user?.id 
          ? connection.receiver 
          : connection.requester
      }));
      setConnections(transformedData);
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
      fetchProfiles(); // Refresh profiles to remove newly connected user
    }
  };

  const removeConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove connection",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Connection removed",
      });
      fetchConnections();
      fetchProfiles(); // Refresh profiles
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
      fetchProfiles(); // Refresh profiles
    }
  };

  // Filter profiles based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.interests?.some(interest => 
          interest.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredProfiles(filtered);
    }
  }, [searchTerm, profiles]);

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'networking': return <Briefcase className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-green-500" />;
    }
  };

  const pendingRequests = connections.filter(c => 
    c.receiver_id === user?.id && c.status === 'pending'
  );

  const sentRequests = connections.filter(c => 
    c.requester_id === user?.id && c.status === 'pending'
  );

  const myConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Campus Connect</h1>
        <p className="text-muted-foreground">Discover and connect with fellow students</p>
      </div>
      
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover Students</TabsTrigger>
          <TabsTrigger value="requests">
            Requests {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent {sentRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{sentRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">My Network</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Students</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by name, department, interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant={connectionType === 'classmate' ? 'default' : 'outline'}
                    onClick={() => setConnectionType('classmate')}
                    className="gap-1 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Classmate</span>
                  </Button>
                  <Button
                    variant={connectionType === 'professional' ? 'default' : 'outline'}
                    onClick={() => setConnectionType('professional')}
                    className="gap-1 text-xs sm:text-sm"
                    size="sm"
                  >
                    <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Professional</span>
                  </Button>
                  <Button
                    variant={connectionType === 'mentor' ? 'default' : 'outline'}
                    onClick={() => setConnectionType('mentor')}
                    className="gap-1 text-xs sm:text-sm"
                    size="sm"
                  >
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Mentor</span>
                  </Button>
                  <Button
                    variant={connectionType === 'alumni' ? 'default' : 'outline'}
                    onClick={() => setConnectionType('alumni')}
                    className="gap-1 text-xs sm:text-sm"
                    size="sm"
                  >
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Alumni</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {filteredProfiles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No students found matching your search</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((profile) => (
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
                    {connectionType === 'friend' ? 'Add Classmate' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Connection Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.profiles.avatar_url} />
                      <AvatarFallback>
                        {request.profiles.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{request.profiles.full_name}</h3>
                      {request.profiles.department && (
                        <p className="text-sm text-muted-foreground">{request.profiles.department}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getConnectionIcon(request.connection_type)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {request.connection_type === 'friend' ? 'Classmate' : 'Professional'} request
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
              ))}
              {pendingRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending connection requests</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.profiles.avatar_url} />
                      <AvatarFallback>
                        {request.profiles.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{request.profiles.full_name}</h3>
                      {request.profiles.department && (
                        <p className="text-sm text-muted-foreground">{request.profiles.department}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getConnectionIcon(request.connection_type)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {request.connection_type === 'friend' ? 'Classmate' : 'Professional'} request
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
              {sentRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending requests sent</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myConnections.map((connection) => {
              const otherProfile = connection.profiles;
              
              return (
                <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={otherProfile.avatar_url} />
                          <AvatarFallback className="text-lg">
                            {otherProfile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{otherProfile.full_name}</h3>
                          {otherProfile.department && (
                            <p className="text-sm text-muted-foreground">{otherProfile.department}</p>
                          )}
                          {otherProfile.year_of_study && (
                            <p className="text-xs text-muted-foreground">Year {otherProfile.year_of_study}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getConnectionIcon(connection.connection_type)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {connection.connection_type === 'friend' ? 'Classmate' : 'Professional'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeConnection(connection.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {myConnections.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Start building your campus network by connecting with fellow students!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Connect;