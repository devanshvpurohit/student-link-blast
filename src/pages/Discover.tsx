import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    Sparkles, Settings, X, Check, Search, Heart, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface MatchProfile extends Profile {
    compatibility_score: number;
}

const calculateCompatibility = (curr: Partial<Profile>, other: Profile) => {
    let score = 50;
    if (curr.department && other.department && curr.department === other.department) score += 20;
    if (curr.year_of_study && other.year_of_study && Math.abs(curr.year_of_study - other.year_of_study) <= 1) score += 10;
    if (curr.interests && other.interests) {
        const overlap = curr.interests.filter(i => other.interests?.includes(i)).length;
        score += Math.min(overlap * 5, 20);
    }
    return Math.min(score, 100);
};

const Discover = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<MatchProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<Partial<Profile>>({});
    const [loading, setLoading] = useState(true);

    const [settings, setSettings] = useState({
        dating_enabled: false,
        dating_looking_for: "friends",
        dating_bio: "",
        dating_gender: "",
    });

    useEffect(() => {
        if (user) {
            initDiscover();
        }
    }, [user]);

    const initDiscover = async () => {
        setLoading(true);
        if (!user) return;

        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            console.error("Error fetching user profile:", userError);
            setLoading(false);
            return;
        }

        setCurrentUserProfile(userData);
        setSettings({
            dating_enabled: userData.dating_enabled || false,
            dating_looking_for: userData.dating_looking_for || 'friends',
            dating_bio: userData.dating_bio || '',
            dating_gender: userData.dating_gender || '',
        });

        const { data: existingMatches } = await supabase
            .from('dating_matches')
            .select('liked_user_id')
            .eq('user_id', user.id);

        const seenIds = new Set(existingMatches?.map(m => m.liked_user_id) || []);
        seenIds.add(user.id);

        const { data: others } = await supabase
            .from('profiles')
            .select('*')
            .not('id', 'in', `(${Array.from(seenIds).join(',')})`)
            .eq('dating_enabled', true)
            .limit(20);

        if (others) {
            const scoredProfiles = others.map(p => ({
                ...p,
                compatibility_score: calculateCompatibility(userData, p)
            })).sort((a, b) => b.compatibility_score - a.compatibility_score);

            setProfiles(scoredProfiles);
        }

        setLoading(false);
    };

    const handleAction = async (action: 'pass' | 'like') => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile || !user) return;

        setCurrentIndex(prev => prev + 1);

        if (action === 'like') {
            toast.success(`Liked ${currentProfile.full_name?.split(' ')[0]}!`);
        }

        const { error } = await supabase.from('dating_matches').insert({
            user_id: user.id,
            liked_user_id: currentProfile.id,
            is_match: false,
            compatibility_score: currentProfile.compatibility_score
        });

        if (error) {
            console.error("Error saving match:", error);
        } else {
            const { data: theyLikedMe } = await supabase
                .from('dating_matches')
                .select('*')
                .eq('user_id', currentProfile.id)
                .eq('liked_user_id', user.id)
                .single();

            if (theyLikedMe) {
                toast.success("It's a Match!");
                await supabase.from('dating_matches').update({ is_match: true }).eq('id', theyLikedMe.id);
            }
        }
    };

    const updateSettings = async () => {
        if (!user) return;
        const { error } = await supabase.from('profiles').update({
            dating_enabled: settings.dating_enabled,
            dating_looking_for: settings.dating_looking_for,
            dating_bio: settings.dating_bio
        }).eq('id', user.id);

        if (error) {
            toast.error("Failed to update settings");
        } else {
            toast.success("Preferences updated");
            setShowSettings(false);
            initDiscover();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Finding matches...</p>
            </div>
        </div>
    );

    const currentProfile = profiles[currentIndex];

    if (!settings.dating_enabled) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-8 text-center space-y-6 max-w-md mx-auto animate-in">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-accent" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Ready to Discover?</h2>
                    <p className="text-muted-foreground">
                        Find students with similar interests, study partners, or maybe even your campus match.
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setSettings(s => ({ ...s, dating_enabled: true }));
                        setShowSettings(true);
                    }} 
                    size="lg" 
                    className="btn-accent w-full max-w-xs"
                >
                    Get Started
                </Button>
            </div>
        )
    }

    return (
        <div className="container-wide py-6 sm:py-10 h-[calc(100vh-4rem)] flex flex-col animate-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Find Your Match</p>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-accent" />
                        Discover
                    </h1>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowSettings(true)} 
                    className="gap-2"
                >
                    <Settings className="h-4 w-4" />
                    Preferences
                </Button>
            </div>

            <div className="flex-1 flex items-center justify-center">
                {currentProfile ? (
                    <div className="w-full max-w-sm card-elevated overflow-hidden flex flex-col h-full max-h-[600px]">
                        {/* Image Area */}
                        <div className="h-3/5 bg-muted relative group overflow-hidden">
                            {currentProfile.avatar_url ? (
                                <img src={currentProfile.avatar_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Profile" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-accent/5">
                                    <span className="text-8xl text-accent/30 font-bold">{currentProfile.full_name?.[0]}</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 glass text-foreground px-3 py-1.5 rounded-md border border-border flex items-center gap-1.5 text-sm font-medium">
                                <Heart className="h-4 w-4 text-accent fill-accent" />
                                {currentProfile.compatibility_score}%
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-5 flex flex-col justify-between bg-card">
                            <div>
                                <div className="mb-3">
                                    <h2 className="text-2xl font-bold tracking-tight">{currentProfile.full_name}</h2>
                                    <p className="text-muted-foreground text-sm">
                                        {currentProfile.department || 'Student'}
                                        {currentProfile.year_of_study && ` • Year ${currentProfile.year_of_study}`}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {(currentProfile.dating_bio || currentProfile.bio) && (
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            "{currentProfile.dating_bio || currentProfile.bio}"
                                        </p>
                                    )}

                                    {currentProfile.interests && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {currentProfile.interests.slice(0, 4).map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => handleAction('pass')}
                                    className="h-12"
                                >
                                    <X className="h-5 w-5 mr-1" />
                                    Pass
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={() => handleAction('like')}
                                    className="btn-accent h-12"
                                >
                                    <Heart className="h-5 w-5 mr-1" />
                                    Like
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 card-elevated max-w-sm w-full mx-auto">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
                        <p className="text-muted-foreground text-sm mb-4">Check back later for new students</p>
                        <Button variant="outline" onClick={() => initDiscover()}>
                            Refresh
                        </Button>
                    </div>
                )}
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Preferences</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div className="space-y-0.5">
                                <Label>Enable Discovery</Label>
                                <p className="text-xs text-muted-foreground">Show my profile to others</p>
                            </div>
                            <Switch
                                checked={settings.dating_enabled}
                                onCheckedChange={(c) => setSettings({ ...settings, dating_enabled: c })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>I'm looking for</Label>
                            <Select
                                value={settings.dating_looking_for}
                                onValueChange={(val) => setSettings({ ...settings, dating_looking_for: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="friends">Friends</SelectItem>
                                    <SelectItem value="study">Study Partners</SelectItem>
                                    <SelectItem value="dating">Relationship</SelectItem>
                                    <SelectItem value="mentor">Mentorship</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button className="w-full btn-accent" onClick={updateSettings}>
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Discover;