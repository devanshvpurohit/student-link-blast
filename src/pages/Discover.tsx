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
    Sparkles, Settings, X, Check, Search, Heart, PenTool
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
            toast.success(`Liked ${currentProfile.full_name?.split(' ')[0]}! 💕`);
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
                toast.success("It's a Match! 🎉✨");
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
            toast.success("Preferences updated ✨");
            setShowSettings(false);
            initDiscover();
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground font-handwriting text-2xl">Finding your matches...</p>
            </div>
        </div>
    );

    const currentProfile = profiles[currentIndex];

    if (!settings.dating_enabled) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-8 text-center space-y-6 max-w-md mx-auto animate-fade-in">
                <div 
                    className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center border-2 border-dashed border-accent/30"
                    style={{ transform: 'rotate(-3deg)' }}
                >
                    <Sparkles className="h-12 w-12 text-accent" />
                </div>
                <div className="space-y-2">
                    <h2 className="font-handwriting text-4xl">Ready to Discover?</h2>
                    <p className="text-muted-foreground font-scribble text-lg">
                        Find students with similar interests, study partners, or maybe even your campus crush! 💕
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setSettings(s => ({ ...s, dating_enabled: true }));
                        setShowSettings(true);
                    }} 
                    size="lg" 
                    className="w-full font-handwritingAlt text-lg h-14"
                >
                    Get Started →
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-scribble">
                        <PenTool className="h-4 w-4" />
                        <span>Find Your Match</span>
                    </div>
                    <h1 className="font-handwriting text-4xl flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-accent" />
                        Discover ✨
                    </h1>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowSettings(true)} 
                    className="gap-2 font-handwritingAlt border-2 border-dashed hover:border-solid"
                >
                    <Settings className="h-4 w-4" />
                    Preferences
                </Button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {currentProfile ? (
                        <div 
                            className="w-full max-w-sm bg-card border-2 border-dashed hover:border-solid rounded-2xl overflow-hidden flex flex-col h-full max-h-[650px] animate-scale-in shadow-paper-hover"
                            style={{ transform: 'rotate(-0.5deg)' }}
                        >
                            {/* Image Area */}
                            <div className="h-3/5 bg-muted/30 relative group overflow-hidden">
                                {currentProfile.avatar_url ? (
                                    <img src={currentProfile.avatar_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-accent/5">
                                        <span className="font-handwriting text-8xl text-accent/30">{currentProfile.full_name?.[0]}</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-background/95 backdrop-blur text-foreground font-handwritingAlt px-3 py-1.5 rounded-lg border-2 border-accent/20 flex items-center gap-1.5">
                                    <Heart className="h-4 w-4 text-accent fill-accent" />
                                    {currentProfile.compatibility_score}% Match
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-6 flex flex-col justify-between bg-card">
                                <div>
                                    <div className="mb-4">
                                        <h2 className="font-handwriting text-3xl">{currentProfile.full_name}</h2>
                                        <p className="text-muted-foreground font-scribble flex items-center gap-2 text-base">
                                            {currentProfile.department || 'Student'}
                                            {currentProfile.year_of_study && <span>• Year {currentProfile.year_of_study}</span>}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {currentProfile.dating_bio ? (
                                            <p className="font-scribble text-base leading-relaxed text-muted-foreground italic">
                                                "{currentProfile.dating_bio}"
                                            </p>
                                        ) : currentProfile.bio ? (
                                            <p className="font-scribble text-base leading-relaxed text-muted-foreground italic">
                                                "{currentProfile.bio}"
                                            </p>
                                        ) : (
                                            <p className="font-scribble text-base text-muted-foreground">No bio yet ✏️</p>
                                        )}

                                        {currentProfile.interests && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {currentProfile.interests.slice(0, 4).map((tag, i) => (
                                                    <Badge 
                                                        key={i} 
                                                        variant="secondary" 
                                                        className="font-handwritingAlt text-sm border-2 border-dashed"
                                                        style={{ transform: `rotate(${i % 2 === 0 ? '-1' : '1'}deg)` }}
                                                    >
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => handleAction('pass')}
                                        className="border-2 border-dashed hover:border-solid hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 h-14 font-handwritingAlt text-lg"
                                    >
                                        <X className="h-6 w-6 mr-1" />
                                        Pass
                                    </Button>
                                    <Button
                                        size="lg"
                                        onClick={() => handleAction('like')}
                                        className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 font-handwritingAlt text-lg"
                                    >
                                        <Heart className="h-6 w-6 mr-1" />
                                        Like
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="text-center p-12 border-2 border-dashed border-border rounded-2xl bg-card max-w-sm w-full mx-auto"
                            style={{ transform: 'rotate(-1deg)' }}
                        >
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-muted-foreground/20">
                                <Search className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <h3 className="font-handwriting text-2xl mb-2">That's everyone!</h3>
                            <p className="text-muted-foreground font-scribble text-base mb-6">Check back later for new students ✨</p>
                            <Button variant="outline" onClick={() => initDiscover()} className="font-handwritingAlt border-2 border-dashed hover:border-solid">
                                Refresh
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="font-handwriting text-3xl">Preferences ⚙️</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-xl bg-muted/10">
                            <div className="space-y-0.5">
                                <Label className="font-handwritingAlt text-base">Enable Discovery</Label>
                                <p className="text-xs text-muted-foreground font-scribble">Show me to others</p>
                            </div>
                            <Switch
                                checked={settings.dating_enabled}
                                onCheckedChange={(c) => setSettings({ ...settings, dating_enabled: c })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-handwritingAlt text-base">I'm looking for</Label>
                            <Select
                                value={settings.dating_looking_for}
                                onValueChange={(val) => setSettings({ ...settings, dating_looking_for: val })}
                            >
                                <SelectTrigger className="border-2 border-dashed focus:border-solid font-scribble">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="font-scribble">
                                    <SelectItem value="friends">Friends 👋</SelectItem>
                                    <SelectItem value="study">Study Partners 📚</SelectItem>
                                    <SelectItem value="dating">Relationship 💕</SelectItem>
                                    <SelectItem value="mentor">Mentorship 🎓</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button className="w-full font-handwritingAlt text-lg h-12" onClick={updateSettings}>
                            Save Changes ✓
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Discover;
