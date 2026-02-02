import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users, Briefcase, UserX, MessageSquare, GraduationCap,
  Search, Check, X, Clock, ChevronRight, School, BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Use strict types from our generated definition
type Profile = Database['public']['Tables']['profiles']['Row'];
type Connection = Database['public']['Tables']['connections']['Row'] & {
  profiles: Profile // Joined data
};

const Connect = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionType, setConnectionType] = useState<Database['public']['Tables']['connections']['Row']['connection_type']>('classmate');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchProfiles(), fetchConnections()]);
    setIsLoading(false);
  };

  const fetchProfiles = async () => {
    // Get IDs of people I'm already connected with or have pending requests with
    if (!user) return;

    const { data: existingConnections } = await supabase
      .from('connections')
      .select('requester_id, receiver_id')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const connectedUserIds = new Set(
      existingConnections?.flatMap(conn => [conn.requester_id, conn.receiver_id]) || []
    );
    connectedUserIds.add(user.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${Array.from(connectedUserIds).join(',')})`)
      .limit(50);

    if (error) {
      console.error("Error loading profiles:", error);
    } else {
      setProfiles(data || []);
      setFilteredProfiles(data || []);
    }
  };

  const fetchConnections = async () => {
    if (!user) return;

    // Fetch connections where I am requester OR receiver
    // Note: Supabase JS client doesn't support complex joins easily with types, 
    // so we might need two queries or a view. 
    // For now, let's try a simple join if the foreign keys allow it directly.

    // Workaround: We'll fetch connections and then filter/map manually for the UI
    const { data, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(*),
        receiver:profiles!connections_receiver_id_fkey(*)
      `)
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
    } else {
      // Transform to a simpler structure for the UI
      const transformedData = (data || []).map((conn: any) => ({
        ...conn,
        // If I sent the request, show the receiver. If I received it, show the requester.
        profiles: conn.requester_id === user.id ? conn.receiver : conn.requester
      }));
      setConnections(transformedData);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        receiver_id: receiverId,
        connection_type: connectionType,
        status: 'pending'
      });

    if (error) {
      toast({ title: "Error", description: "Could not send request", variant: "destructive" });
    } else {
      toast({ title: "Request sent", description: `You asked to connect as ${connectionType.replace('_', ' ')}` });
      loadData();
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', connectionId);

    if (error) {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } else {
      toast({ title: status === 'accepted' ? "Connected!" : "Declined" });
      loadData();
    }
  };

  // Filter logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProfiles(profiles);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = profiles.filter(profile =>
        profile.full_name?.toLowerCase().includes(lowerTerm) ||
        profile.department?.toLowerCase().includes(lowerTerm) ||
        profile.interests?.some(i => i.toLowerCase().includes(lowerTerm))
      );
      setFilteredProfiles(filtered);
    }
  }, [searchTerm, profiles]);

  // Helper for icons
  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'professional': return <Briefcase className="h-4 w-4 text-blue-500" />;
      case 'mentor':
      case 'mentee': return <GraduationCap className="h-4 w-4 text-amber-500" />;
      case 'classmate': return <School className="h-4 w-4 text-emerald-500" />;
      case 'study_group': return <BookOpen className="h-4 w-4 text-purple-500" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Derived state
  const pendingRequests = connections.filter(c => c.receiver_id === user?.id && c.status === 'pending');
  const sentRequests = connections.filter(c => c.requester_id === user?.id && c.status === 'pending');
  const myConnections = connections.filter(c => c.status === 'accepted');

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Connect</h1>
          <p className="text-muted-foreground text-sm">Grow your academic and professional network.</p>
        </div>
      </div>

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-lg inline-flex">
          <TabsTrigger value="discover" className="rounded-md">Discover</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-md relative">
            Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="network" className="rounded-md">My Network</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students, departments, interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-muted/20 border-border"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              {/* Simplified filter pills for connection type */}
              {(['classmate', 'study_group', 'project_partner', 'mentor'] as const).map(type => (
                <Button
                  key={type}
                  variant={connectionType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setConnectionType(type)}
                  className="capitalize whitespace-nowrap"
                >
                  {getConnectionIcon(type)}
                  <span className="ml-2">{type.replace('_', ' ')}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <p className="col-span-full text-center py-12 text-muted-foreground animate-pulse">Loading profiles...</p>
            ) : filteredProfiles.length === 0 ? (
              <div className="col-span-full text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No students found.</p>
              </div>
            ) : (
              filteredProfiles.map(profile => (
                <Card key={profile.id} className="overflow-hidden border-border hover:border-primary/20 transition-colors">
                  <div className="p-4 flex flex-col items-center text-center space-y-3">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>{profile.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{profile.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{profile.department}</p>
                    </div>
                    {profile.interests && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {profile.interests.slice(0, 3).map(i => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5">{i}</Badge>
                        ))}
                      </div>
                    )}
                    <Button size="sm" className="w-full mt-2" onClick={() => sendConnectionRequest(profile.id)}>
                      Connect
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Received ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={req.profiles.avatar_url || undefined} />
                    <AvatarFallback>{req.profiles.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-sm">{req.profiles.full_name}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {getConnectionIcon(req.connection_type)}
                      <span className="capitalize">{req.connection_type.replace('_', ' ')} request</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateConnectionStatus(req.id, 'declined')}>Decline</Button>
                  <Button size="sm" onClick={() => updateConnectionStatus(req.id, 'accepted')}>Accept</Button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No pending requests.</p>
            )}
          </div>

          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-8">Sent ({sentRequests.length})</h3>
          <div className="space-y-2">
            {sentRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                    {req.profiles.full_name?.[0]}
                  </div>
                  <span className="text-sm font-medium">{req.profiles.full_name}</span>
                </div>
                <Badge variant="outline" className="text-xs font-normal">Pending</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myConnections.map(conn => (
              <div key={conn.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <Avatar>
                  <AvatarImage src={conn.profiles.avatar_url || undefined} />
                  <AvatarFallback>{conn.profiles.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{conn.profiles.full_name}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{conn.connection_type.replace('_', ' ')}</p>
                </div>
                <Button size="icon" variant="ghost">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Connect;