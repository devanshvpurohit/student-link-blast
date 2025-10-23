import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Settings, 
  MessageCircle, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Crown,
  Shield,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Club {
  id: string;
  name: string;
  description?: string;
  category?: string;
  avatar_url?: string;
  created_by: string;
  visibility: 'public' | 'private';
  created_at: string;
}

interface ClubMember {
  id: string;
  role: string;
  status: string;
  joined_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

interface ClubDashboardProps {
  club: Club;
  onClose: () => void;
  onOpenChat: (club: Club) => void;
}

const ClubDashboard = ({ club, onClose, onOpenChat }: ClubDashboardProps) => {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<ClubMember[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
    fetchUserRole();
  }, [club.id]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        *,
        profiles(full_name, avatar_url, email)
      `)
      .eq('club_id', club.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      const approved = data?.filter(m => m.status === 'approved') || [];
      const pending = data?.filter(m => m.status === 'pending') || [];
      setMembers(approved);
      setPendingMembers(pending);
    }
  };

  const fetchUserRole = async () => {
    const { data } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user?.id)
      .eq('status', 'approved')
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const handleMemberAction = async (memberId: string, action: 'approve' | 'reject' | 'remove') => {
    let updateData: any = {};
    
    if (action === 'approve') {
      updateData = { status: 'approved' };
    } else if (action === 'reject') {
      updateData = { status: 'rejected' };
    }

    if (action === 'remove') {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove member",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Member removed successfully",
        });
        fetchMembers();
      }
    } else {
      const { error } = await supabase
        .from('club_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) {
        toast({
          title: "Error",
          description: `Failed to ${action} member`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Member ${action}d successfully`,
        });
        fetchMembers();
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const canManageMembers = userRole === 'admin' || userRole === 'moderator';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="mx-2 max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={club.avatar_url} />
              <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{club.name}</span>
                {getRoleIcon(userRole)}
              </div>
              {club.category && (
                <Badge variant="secondary" className="text-xs">
                  {club.category}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          <div className="flex flex-col xs:flex-row gap-2 mb-4">
            <Button
              onClick={() => onOpenChat(club)}
              className="gap-2 flex-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden xs:inline">Open Chat</span>
              <span className="xs:hidden">Chat</span>
            </Button>
            {canManageMembers && (
              <Button variant="outline" className="gap-2 flex-1">
                <Settings className="h-4 w-4" />
                <span className="hidden xs:inline">Settings</span>
                <span className="xs:hidden">Set</span>
              </Button>
            )}
          </div>

          <Tabs defaultValue="members" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Students ({members.length})</span>
                <span className="sm:hidden">Students</span>
              </TabsTrigger>
              {canManageMembers && (
                <TabsTrigger value="pending" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Applications ({pendingMembers.length})</span>
                  <span className="sm:hidden">Pending</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4 overflow-y-auto max-h-60 sm:max-h-96">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profiles.avatar_url} />
                          <AvatarFallback>
                            {member.profiles.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {member.profiles.full_name || member.profiles.email}
                            </span>
                            {getRoleIcon(member.role)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {canManageMembers && member.user_id !== user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMemberAction(member.id, 'remove')}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {canManageMembers && (
              <TabsContent value="pending" className="space-y-4 overflow-y-auto max-h-60 sm:max-h-96">
                {pendingMembers.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No pending membership applications</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.profiles.avatar_url} />
                              <AvatarFallback>
                                {member.profiles.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">
                                {member.profiles.full_name || member.profiles.email}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {member.profiles.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col xs:flex-row gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleMemberAction(member.id, 'approve')}
                              className="gap-1 flex-1"
                            >
                              <UserCheck className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMemberAction(member.id, 'reject')}
                              className="gap-1 flex-1"
                            >
                              <UserX className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            )}

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Active Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{members.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Club members</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Founded
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {new Date(club.created_at).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Established</p>
                  </CardContent>
                </Card>
              </div>

              {club.description && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">About This Club</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {club.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClubDashboard;