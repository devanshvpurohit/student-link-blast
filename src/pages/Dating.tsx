import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Heart, X, MessageCircle, Sparkles, Settings, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DatingProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  year_of_study: number | null;
  interests: string[] | null;
  bio: string | null;
  dating_bio: string | null;
  dating_gender: string | null;
  dating_looking_for: string | null;
}

interface Match {
  id: string;
  user_id: string;
  liked_user_id: string;
  is_match: boolean;
  created_at: string;
  profiles: DatingProfile;
}

const Dating = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<DatingProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [datingEnabled, setDatingEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set());
  
  const [settings, setSettings] = useState({
    dating_enabled: false,
    dating_gender: "",
    dating_looking_for: "",
    dating_age_min: 18,
    dating_age_max: 30,
    dating_bio: "",
  });

  useEffect(() => {
    if (user) {
      fetchDatingSettings();
      fetchLikedUsers();
    }
  }, [user]);

  useEffect(() => {
    if (datingEnabled) {
      fetchProfiles();
      fetchMatches();
    }
  }, [datingEnabled]);

  const fetchDatingSettings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("dating_enabled, dating_gender, dating_looking_for, dating_age_min, dating_age_max, dating_bio")
      .eq("id", user.id)
      .single();

    if (data) {
      setDatingEnabled(data.dating_enabled || false);
      setSettings({
        dating_enabled: data.dating_enabled || false,
        dating_gender: data.dating_gender || "",
        dating_looking_for: data.dating_looking_for || "",
        dating_age_min: data.dating_age_min || 18,
        dating_age_max: data.dating_age_max || 30,
        dating_bio: data.dating_bio || "",
      });
    }
  };

  const fetchLikedUsers = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("dating_matches")
      .select("liked_user_id")
      .eq("user_id", user.id);

    if (data) {
      setLikedUsers(new Set(data.map(d => d.liked_user_id)));
    }
  };

  const fetchProfiles = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("dating_enabled", true)
      .neq("id", user.id);

    if (error) {
      toast.error("Failed to load profiles");
      return;
    }

    // Filter out already liked users
    const filtered = (data || []).filter(p => !likedUsers.has(p.id));
    setProfiles(filtered);
  };

  const fetchMatches = async () => {
    if (!user) return;

    // First get all matches
    const { data: matchesData, error: matchesError } = await supabase
      .from("dating_matches")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_match", true);

    if (matchesError) {
      toast.error("Failed to load matches");
      return;
    }

    if (!matchesData || matchesData.length === 0) {
      setMatches([]);
      return;
    }

    // Then get the profiles for matched users
    const likedUserIds = matchesData.map(m => m.liked_user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, department, year_of_study, interests, bio, dating_bio, dating_gender, dating_looking_for")
      .in("id", likedUserIds);

    if (profilesError) {
      toast.error("Failed to load match profiles");
      return;
    }

    // Combine the data
    const matchesWithProfiles = matchesData.map(match => {
      const profile = profilesData?.find(p => p.id === match.liked_user_id);
      return {
        ...match,
        profiles: profile || {
          id: match.liked_user_id,
          full_name: "Unknown",
          avatar_url: null,
          department: null,
          year_of_study: null,
          interests: null,
          bio: null,
          dating_bio: null,
          dating_gender: null,
          dating_looking_for: null,
        }
      };
    });

    setMatches(matchesWithProfiles);
  };

  const updateDatingSettings = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(settings)
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update settings");
      return;
    }

    toast.success("Dating settings updated!");
    setDatingEnabled(settings.dating_enabled);
    setShowSettings(false);
    
    if (settings.dating_enabled) {
      fetchProfiles();
    }
  };

  const handleLike = async (likedUserId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("dating_matches")
      .insert({
        user_id: user.id,
        liked_user_id: likedUserId,
      });

    if (error) {
      toast.error("Failed to like profile");
      return;
    }

    // Add to liked users set
    setLikedUsers(prev => new Set([...prev, likedUserId]));
    
    // Check if it's a match
    const { data: matchData } = await supabase
      .from("dating_matches")
      .select("is_match")
      .eq("user_id", user.id)
      .eq("liked_user_id", likedUserId)
      .single();

    if (matchData?.is_match) {
      toast.success("It's a match! 🎉", {
        description: "You can now start chatting!"
      });
      fetchMatches();
    }

    setCurrentIndex(prev => prev + 1);
  };

  const handleSkip = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const currentProfile = profiles[currentIndex];

  if (!datingEnabled && !showSettings) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Campus Dating</h1>
              <p className="text-muted-foreground mt-2">
                Connect with other students in a meaningful way
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Smart Matching</h3>
                  <p className="text-sm text-muted-foreground">
                    Find people based on shared interests and preferences
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Safe & Private</h3>
                  <p className="text-sm text-muted-foreground">
                    Only matched users can message each other
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">Campus Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with verified students from your university
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowSettings(true)} 
              className="w-full"
              size="lg"
            >
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-rose-500" />
          Campus Dating
        </h1>
        <Button variant="outline" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover">
            <Sparkles className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="matches">
            <Heart className="h-4 w-4 mr-2" />
            Matches ({matches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <div className="flex justify-center">
            {currentProfile ? (
              <Card className="w-full max-w-md overflow-hidden border-2">
                <div className="relative h-80 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  {currentProfile.avatar_url ? (
                    <img 
                      src={currentProfile.avatar_url} 
                      alt={currentProfile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-8xl font-bold text-primary/40">
                      {currentProfile.full_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{currentProfile.full_name}</h2>
                    {currentProfile.department && (
                      <p className="text-muted-foreground">{currentProfile.department}</p>
                    )}
                    {currentProfile.year_of_study && (
                      <p className="text-sm text-muted-foreground">
                        Year {currentProfile.year_of_study}
                      </p>
                    )}
                  </div>

                  {currentProfile.dating_bio && (
                    <p className="text-sm">{currentProfile.dating_bio}</p>
                  )}

                  {currentProfile.interests && currentProfile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary">{interest}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 border-2"
                      onClick={handleSkip}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                      onClick={() => handleLike(currentProfile.id)}
                    >
                      <Heart className="h-6 w-6 fill-current" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="w-full max-w-md">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg">No more profiles to show</p>
                  <p className="text-sm mt-2">Check back later for new matches!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {matches.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg">No matches yet</p>
                  <p className="text-sm mt-2">Start swiping to find your match!</p>
                </CardContent>
              </Card>
            ) : (
              matches.map((match) => (
                <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={match.profiles.avatar_url || undefined} />
                        <AvatarFallback className="text-xl">
                          {match.profiles.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{match.profiles.full_name}</h3>
                        {match.profiles.department && (
                          <p className="text-sm text-muted-foreground">
                            {match.profiles.department}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {match.profiles.dating_bio && (
                      <p className="text-sm">{match.profiles.dating_bio}</p>
                    )}
                    {match.profiles.interests && match.profiles.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {match.profiles.interests.slice(0, 3).map((interest, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button className="w-full" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dating Settings</DialogTitle>
            <DialogDescription>
              Customize your dating preferences and profile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Dating Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Show your profile to other students
                </p>
              </div>
              <Switch
                checked={settings.dating_enabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, dating_enabled: checked })
                }
              />
            </div>

            {settings.dating_enabled && (
              <>
                <div>
                  <Label>Your Gender</Label>
                  <Select
                    value={settings.dating_gender}
                    onValueChange={(value) => 
                      setSettings({ ...settings, dating_gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Looking For</Label>
                  <Select
                    value={settings.dating_looking_for}
                    onValueChange={(value) => 
                      setSettings({ ...settings, dating_looking_for: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="everyone">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Age</Label>
                    <Input
                      type="number"
                      min="18"
                      max="100"
                      value={settings.dating_age_min}
                      onChange={(e) => 
                        setSettings({ ...settings, dating_age_min: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Age</Label>
                    <Input
                      type="number"
                      min="18"
                      max="100"
                      value={settings.dating_age_max}
                      onChange={(e) => 
                        setSettings({ ...settings, dating_age_max: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Dating Bio</Label>
                  <Textarea
                    value={settings.dating_bio}
                    onChange={(e) => 
                      setSettings({ ...settings, dating_bio: e.target.value })
                    }
                    placeholder="Tell others about yourself, your interests, what you're looking for..."
                    rows={4}
                  />
                </div>
              </>
            )}

            <Button onClick={updateDatingSettings} className="w-full">
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dating;
