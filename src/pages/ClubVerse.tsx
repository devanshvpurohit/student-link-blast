import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Crown, User, Lock, Globe, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ClubChat from '@/components/ClubChat';
import ClubDashboard from '@/components/ClubDashboard';

interface Club {
  id: string;
  name: string;
  description?: string;
  category?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  visibility: 'public' | 'private';
  member_count?: number;
  user_membership?: {
    status: string;
    role: string;
  };
}

interface ClubMember {
  id: string;
  role: string;
  status: string;
  joined_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

const ClubVerse = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [showChat, setShowChat] = useState(false);
  const [selectedChatClub, setSelectedChatClub] = useState<Club | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedDashboardClub, setSelectedDashboardClub] = useState<Club | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchClubs();
      fetchMyClubs();
    }
  }, [user]);

  const fetchClubs = async () => {
    // First get all clubs
    const { data: clubsData, error: clubsError } = await supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false });

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
      return;
    }

    // Get member counts for each club
    const { data: memberCounts, error: memberError } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('status', 'approved');

    if (memberError) {
      console.error('Error fetching member counts:', memberError);
      return;
    }

    // Get current user's memberships
    const { data: userMemberships, error: membershipError } = await supabase
      .from('club_members')
      .select('club_id, status, role')
      .eq('user_id', user?.id);

    if (membershipError) {
      console.error('Error fetching user memberships:', membershipError);
      return;
    }

    // Create member count map
    const memberCountMap = new Map();
    memberCounts?.forEach(member => {
      const count = memberCountMap.get(member.club_id) || 0;
      memberCountMap.set(member.club_id, count + 1);
    });

    // Create user membership map
    const membershipMap = new Map(userMemberships?.map(m => [m.club_id, m]) || []);
    
    // Process clubs with member count and user membership status
    const processedClubs = clubsData?.map(club => ({
      ...club,
      visibility: club.visibility as 'public' | 'private',
      member_count: memberCountMap.get(club.id) || 0,
      user_membership: membershipMap.get(club.id),
    })) || [];
    
    setClubs(processedClubs);
  };

  const fetchMyClubs = async () => {
    try {
      // Get user's club memberships first
      const { data: memberships } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', user?.id)
        .eq('status', 'approved');

      const memberClubIds = memberships?.map(m => m.club_id) || [];

      // Get clubs where user is either creator or approved member
      let query = supabase
        .from('clubs')
        .select('*');

      if (memberClubIds.length > 0) {
        query = query.or(`created_by.eq.${user?.id},id.in.(${memberClubIds.join(',')})`);
      } else {
        query = query.eq('created_by', user?.id || '');
      }

      const { data: clubsData, error: clubsError } = await query;

      if (clubsError) {
        console.error('Error fetching my clubs:', clubsError);
      } else {
        const processedMyClubs = clubsData?.map(club => ({
          ...club,
          visibility: club.visibility as 'public' | 'private',
        })) || [];
        setMyClubs(processedMyClubs);
      }
    } catch (error) {
      console.error('Error in fetchMyClubs:', error);
    }
  };

  const fetchClubMembers = async (clubId: string) => {
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .eq('club_id', clubId)
      .eq('status', 'approved')
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching club members:', error);
    } else {
      setClubMembers(data || []);
    }
  };

  const createClub = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a club name",
        variant: "destructive",
      });
      return;
    }

    // Check if club name already exists
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existingClub) {
      toast({
        title: "Error",
        description: "A club with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('clubs')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        visibility: visibility,
        created_by: user?.id,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create club",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Club created successfully!",
      });
      setName('');
      setDescription('');
      setCategory('');
      setVisibility('public');
      setIsCreateOpen(false);
      fetchClubs();
      fetchMyClubs();
    }
  };

  const joinClub = async (clubId: string) => {
    const { error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: user?.id,
        status: 'pending',
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to request club membership",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Membership request sent!",
      });
      fetchClubs();
    }
  };

  const openClubDetail = (club: Club) => {
    setSelectedClub(club);
    fetchClubMembers(club.id);
    setIsDetailOpen(true);
  };

  const openChat = (club: Club) => {
    setSelectedChatClub(club);
    setShowChat(true);
  };

  const openDashboard = (club: Club) => {
    setSelectedDashboardClub(club);
    setShowDashboard(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator': return <User className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">ClubVerse</h1>
        
        {user && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">Create Club</span>
                <span className="xs:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Club name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Input
                    placeholder="Category (optional)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                
                <div>
                  <Textarea
                    placeholder="Club description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Select value={visibility} onValueChange={(value: 'public' | 'private') => setVisibility(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Club visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public - Anyone can see and join
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Private - Invite only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={createClub} className="w-full">
                  Create Club
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Discover Clubs</span>
            <span className="sm:hidden">Discover</span>
          </TabsTrigger>
          <TabsTrigger value="my-clubs" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">My Clubs ({myClubs.length})</span>
            <span className="sm:hidden">Mine ({myClubs.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => (
              <Card key={club.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar>
                      <AvatarImage src={club.avatar_url} />
                      <AvatarFallback>
                        {club.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{club.name}</h3>
                        {club.visibility === 'private' ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {club.category && (
                        <Badge variant="secondary" className="text-xs">
                          {club.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {club.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {club.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {club.member_count || 0} members
                    </div>
                    
                    <div className="flex flex-col xs:flex-row gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openClubDetail(club)}
                        className="flex-1"
                      >
                        View
                      </Button>
                      
                      {club.user_membership?.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openChat(club)}
                          className="gap-1 flex-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="hidden xs:inline">Chat</span>
                        </Button>
                      )}
                      
                      {!club.user_membership && (
                        <Button 
                          size="sm"
                          onClick={() => joinClub(club.id)}
                          className="flex-1"
                        >
                          Join
                        </Button>
                      )}
                      
                      {club.user_membership?.status === 'pending' && (
                        <Button size="sm" variant="secondary" disabled>
                          Pending
                        </Button>
                      )}
                      
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {clubs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No clubs yet. Create the first one!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-clubs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClubs.map((club) => (
              <Card key={club.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar>
                      <AvatarImage src={club.avatar_url} />
                      <AvatarFallback>
                        {club.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{club.name}</h3>
                        {club.visibility === 'private' ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {club.category && (
                        <Badge variant="secondary" className="text-xs">
                          {club.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => openDashboard(club)}
                    >
                      <span className="hidden xs:inline">Dashboard</span>
                      <span className="xs:hidden">Dash</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => openChat(club)}
                      className="gap-1 flex-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden xs:inline">Chat</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {myClubs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">You haven't joined any clubs yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Club Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedClub?.avatar_url} />
                <AvatarFallback>
                  {selectedClub?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span>{selectedClub?.name}</span>
                  {selectedClub?.visibility === 'private' ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {selectedClub?.category && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedClub.category}
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedClub?.description && (
              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-muted-foreground">{selectedClub.description}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold mb-4">Members ({clubMembers.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clubMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profiles.avatar_url} />
                        <AvatarFallback>
                          {member.profiles.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.profiles.full_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      <span className="text-xs text-muted-foreground capitalize">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Club Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedChatClub?.name} - Vanishing Chat
            </DialogTitle>
          </DialogHeader>
          
          {selectedChatClub && (
            <ClubChat 
              clubId={selectedChatClub.id} 
              clubName={selectedChatClub.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Club Dashboard */}
      {showDashboard && selectedDashboardClub && (
        <ClubDashboard 
          club={selectedDashboardClub}
          onClose={() => setShowDashboard(false)}
          onOpenChat={(club) => {
            setShowDashboard(false);
            openChat(club);
          }}
        />
      )}
    </div>
  );
};

export default ClubVerse;