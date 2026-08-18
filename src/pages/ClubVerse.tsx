import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap, Users, Calendar, Search,
  ArrowRight, Plus, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

type Club = Database['public']['Tables']['clubs']['Row'];

const ClubVerse = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");


  const fetchClubs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('visibility', 'public')
      .order('name');

    if (error) console.error(error);
    else setClubs(data || []);
    setLoading(false);
  }, []);

  const fetchMyClubs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('club_members')
      .select('club_id, clubs(*)')
      .eq('user_id', user.id);

    if (data) {
      // Extract clubs from the join
      const joinedClubs = data.map((d) => d.clubs).filter((c): c is Club => c !== null);
      setMyClubs(joinedClubs);
    }
  }, [user]);
  useEffect(() => {
    fetchClubs();
    if (user) fetchMyClubs();
  }, [user, fetchClubs, fetchMyClubs]);


  const joinClub = async (clubId: string) => {
    if (!user) return;
    const { error } = await supabase.from('club_members').insert({
      club_id: clubId,
      user_id: user.id,
      status: 'pending',
      role: 'member'
    });

    if (error) {
      if (error.code === '23505') toast.error("Already a member or pending");
      else toast.error("Failed to join");
    } else {
      toast.success("Request sent to join!");
    }
  };

  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ClubVerse</h1>
          <p className="text-muted-foreground text-sm">Discover and join student organizations.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Start a Club
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Clubs</TabsTrigger>
          <TabsTrigger value="my">My Memberships</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find a club..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)
            ) : filteredClubs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No clubs found matching "{searchTerm}"
              </div>
            ) : (
              filteredClubs.map(club => (
                <Card key={club.id} className="flex flex-col hover:border-primary/50 transition-colors">
                  <CardHeader className="flex-row gap-4 items-start space-y-0 pb-2">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {club.avatar_url ? (
                        <img src={club.avatar_url} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <GraduationCap className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-1 font-normal text-[10px]">{club.category || 'General'}</Badge>
                      <CardTitle className="text-base">{club.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {club.description || 'No description provided.'}
                    </p>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => joinClub(club.id)}>
                      Join Club
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          {myClubs.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">You haven't joined any clubs yet.</p>
              <Button variant="outline" onClick={() => document.querySelector<HTMLElement>('[value="all"]')?.click()}>Browse Clubs</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClubs.map(club => (
                <Card key={club.id} className="flex flex-col border-l-4 border-l-primary">
                  <div className="p-4">
                    <h3 className="font-medium mb-1">{club.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Users className="h-3 w-3" />
                      <span>Member</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full gap-2">
                      View Dashboard
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubVerse;