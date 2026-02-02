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
    Sparkles, Settings, X, Check, Search, Filter
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

interface MatchProfile extends Profile {
    compatibility_score: number;
}

const calculateCompatibility = (curr: Partial<Profile>, other: Profile) => {
    let score = 50;
    // Department Match (+20)
    if (curr.department && other.department && curr.department === other.department) score += 20;

    // Year Proximity (+10)
    if (curr.year_of_study && other.year_of_study && Math.abs(curr.year_of_study - other.year_of_study) <= 1) score += 10;

    // Interest Overlap (up to +20)
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

    // Local settings state (mirroring DB fields)
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

        // 1. Get current user profile
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

        // 2. Get matches (people I've already swiped on)
        const { data: existingMatches } = await supabase
            .from('dating_matches')
            .select('liked_user_id')
            .eq('user_id', user.id);

        const seenIds = new Set(existingMatches?.map(m => m.liked_user_id) || []);
        seenIds.add(user.id); // Don't show myself

        // 3. Get potential profiles
        // In a real app, use filters based on `dating_looking_for`, `dating_gender`, etc.
        const { data: others } = await supabase
            .from('profiles')
            .select('*')
            .not('id', 'in', `(${Array.from(seenIds).join(',')})`)
            .eq('dating_enabled', true) // Only show people who opted in
            .limit(20);

        if (others) {
            const scoredProfiles = others.map(p => ({
                ...p,
                compatibility_score: calculateCompatibility(userData, p)
            })).sort((a, b) => b.compatibility_score - a.compatibility_score); // Show best matches first

            setProfiles(scoredProfiles);
        }

        setLoading(false);
    };

    const handleAction = async (action: 'pass' | 'like') => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile || !user) return;

        // Optimistic UI update
        setCurrentIndex(prev => prev + 1);

        if (action === 'like') {
            toast.success(`Liked ${currentProfile.full_name?.split(' ')[0]}!`);
        }

        // Save to Supabase
        const { error } = await supabase.from('dating_matches').insert({
            user_id: user.id,
            liked_user_id: currentProfile.id,
            is_match: false, // Initial state, backend or logic should check for mutual match
            compatibility_score: currentProfile.compatibility_score
        });

        if (error) {
            console.error("Error saving match:", error);
        } else {
            // Check for mutual match (if they already liked me)
            const { data: theyLikedMe } = await supabase
                .from('dating_matches')
                .select('*')
                .eq('user_id', currentProfile.id)
                .eq('liked_user_id', user.id)
                .single();

            if (theyLikedMe) {
                toast.success("It's a Match! 🎉");
                // Update both records to is_match = true
                await supabase.from('dating_matches').update({ is_match: true }).eq('id', theyLikedMe.id);
                // We would need the ID of the record just inserted to update it too, 
                // simplified here for demo.
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
            // Reload profiles based on new settings
            initDiscover();
        }
    };

    // Render Logic
    if (loading) return (
        <div className="flex items-center justify-center h-full p-8 text-muted-foreground animate-pulse">
            Loading your matches...
        </div>
    );

    const currentProfile = profiles[currentIndex];

    if (!settings.dating_enabled) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-8 text-center space-y-6 max-w-md mx-auto">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-2">Enable Discovery?</h2>
                    <p className="text-muted-foreground">Turn on this feature to find students with similar interests, study partners, or new friends.</p>
                </div>
                <Button onClick={() => {
                    setSettings(s => ({ ...s, dating_enabled: true }));
                    // We'll save this when they confirm settings, or trigger a save now
                    // For better UX, let's open settings dialog or just toggle it and save
                    setShowSettings(true);
                }} size="lg" className="w-full">
                    Get Started
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        Discover
                    </h1>
                    <p className="text-muted-foreground text-sm">Based on your interests & department.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Preferences
                </Button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Main Card Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {currentProfile ? (
                        <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[650px] animate-in zoom-in-95 duration-300">
                            {/* Image Area */}
                            <div className="h-3/5 bg-muted/30 relative group overflow-hidden">
                                {currentProfile.avatar_url ? (
                                    <img src={currentProfile.avatar_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground bg-grid-pattern">
                                        <span className="text-6xl font-serif opacity-20">{currentProfile.full_name?.[0]}</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur text-foreground text-xs font-medium px-2 py-1 rounded border border-border flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-yellow-500" />
                                    {currentProfile.compatibility_score}% Match
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-6 flex flex-col justify-between bg-card">
                                <div>
                                    <div className="mb-4">
                                        <h2 className="text-2xl font-semibold tracking-tight">{currentProfile.full_name}</h2>
                                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                            {currentProfile.department || 'Student'}
                                            {currentProfile.year_of_study && <span>• Year {currentProfile.year_of_study}</span>}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {currentProfile.dating_bio ? (
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                "{currentProfile.dating_bio}"
                                            </p>
                                        ) : currentProfile.bio ? (
                                            <p className="text-sm leading-relaxed text-muted-foreground">
                                                "{currentProfile.bio}"
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No bio available.</p>
                                        )}

                                        {currentProfile.interests && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {currentProfile.interests.slice(0, 4).map((tag, i) => (
                                                    <Badge key={i} variant="secondary" className="font-normal border-border bg-muted/50">
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
                                        className="border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 h-12"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        size="lg"
                                        onClick={() => handleAction('like')}
                                        className="bg-foreground text-background hover:bg-foreground/90 h-12"
                                    >
                                        <Check className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-12 border border-dashed border-border rounded-xl bg-muted/5 max-w-sm w-full mx-auto">
                            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No more profiles</h3>
                            <p className="text-muted-foreground text-sm mb-6">Check back later for new students.</p>
                            <Button variant="outline" onClick={() => initDiscover()}>Refresh</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Discovery Preferences</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/5">
                            <div className="space-y-0.5">
                                <Label>Enable Discovery</Label>
                                <p className="text-xs text-muted-foreground">Show me to others</p>
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
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="friends">Friends</SelectItem>
                                    <SelectItem value="study">Study Partners</SelectItem>
                                    <SelectItem value="dating">Relatonship</SelectItem>
                                    <SelectItem value="mentor">Mentorship</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button className="w-full" onClick={updateSettings}>Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Discover;
