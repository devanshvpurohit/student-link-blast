import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
    Sparkles, Settings, Users, ArrowRight,
    X, Check, RotateCcw, Filter, Search
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Re-using the interfaces and compatibility logic from the previous step, but restyling the UI
interface DiscoverProfile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    department: string | null;
    year_of_study: number | null;
    interests: string[] | null;
    bio: string | null;
    discover_bio: string | null;
    discover_looking_for: string | null;
    compatibility_score?: number;
}

interface Match {
    id: string;
    user_id: string;
    matched_user_id: string;
    compatibility_score: number;
    is_mutual: boolean;
    profile: DiscoverProfile;
}

const calculateCompatibility = (curr: Partial<DiscoverProfile>, other: DiscoverProfile) => {
    // Simplified logic for demo
    let score = 50;
    if (curr.department === other.department) score += 20;
    if (Math.abs((curr.year_of_study || 0) - (other.year_of_study || 0)) <= 1) score += 10;
    return Math.min(score, 100);
};

const Discover = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [matches, setMatches] = useState<Match[]>([]);
    const [discoverEnabled, setDiscoverEnabled] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<Partial<DiscoverProfile>>({});
    const [loading, setLoading] = useState(true);

    // Settings state
    const [settings, setSettings] = useState({
        discover_enabled: false,
        discover_looking_for: "friends",
        discover_bio: "",
        min_compatibility: 30,
    });

    useEffect(() => {
        if (user) {
            // Mock init
            fetchSettings();
            fetchProfile();
        }
    }, [user]);

    const fetchSettings = async () => {
        // simulate fetch
        setLoading(false);
        setDiscoverEnabled(true);
        // In real app, fetch from supabase
    };

    const fetchProfile = async () => {
        // In real app, fetch from supabase
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setCurrentUserProfile(data);

        // Fetch potential matches
        const { data: others } = await supabase.from('profiles').select('*').neq('id', user.id);
        if (others) {
            setProfiles(others.map(p => ({ ...p, compatibility_score: calculateCompatibility(data || {}, p) })));
        }
    };

    const handleAction = (action: 'pass' | 'connect') => {
        if (action === 'connect') {
            toast.success("Connection request sent!");
            // Add logic to save to DB
        }
        setCurrentIndex(prev => prev + 1);
    };

    // If loading
    if (loading) return <div className="p-8 text-muted-foreground">Loading directory...</div>;

    const currentProfile = profiles[currentIndex];

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 h-[calc(100vh-4rem)] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        Discover
                    </h1>
                    <p className="text-muted-foreground text-sm">Find students with similar interests.</p>
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
                        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
                            {/* Image Area */}
                            <div className="h-1/2 bg-muted/30 relative group">
                                {currentProfile.avatar_url ? (
                                    <img src={currentProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                        <span className="text-4xl font-mono">{currentProfile.full_name?.[0]}</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur text-foreground text-xs font-medium px-2 py-1 rounded border border-border">
                                    {currentProfile.compatibility_score}% Match
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 p-6 flex flex-col">
                                <div className="mb-4">
                                    <h2 className="text-xl font-semibold">{currentProfile.full_name}</h2>
                                    <p className="text-sm text-muted-foreground">{currentProfile.department || 'Student'} • {currentProfile.year_of_study ? `Year ${currentProfile.year_of_study}` : ''}</p>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                    {currentProfile.bio && (
                                        <div className="p-3 bg-muted/30 rounded-lg text-sm italic border-l-2 border-primary/20">
                                            "{currentProfile.bio}"
                                        </div>
                                    )}

                                    {currentProfile.interests && (
                                        <div className="flex flex-wrap gap-2">
                                            {currentProfile.interests.map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="font-normal border-border">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <Button variant="outline" onClick={() => handleAction('pass')} className="hover:bg-destructive/10 hover:text-destructive border-border">
                                        <X className="h-4 w-4 mr-2" />
                                        Pass
                                    </Button>
                                    <Button onClick={() => handleAction('connect')} className="bg-foreground text-background hover:bg-foreground/90">
                                        <Check className="h-4 w-4 mr-2" />
                                        Connect
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-12 border border-dashed border-border rounded-xl bg-muted/10">
                            <p className="text-muted-foreground">No more profiles to show.</p>
                            <Button variant="link" onClick={() => setCurrentIndex(0)}>Start over</Button>
                        </div>
                    )}
                </div>

                {/* Sidebar Matches (Desktop) */}
                <div className="hidden md:block w-72 border-l border-border pl-6">
                    <h3 className="font-medium text-sm mb-4 flex items-center justify-between">
                        <span>Recent Matches</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">0</span>
                    </h3>
                    <div className="text-sm text-muted-foreground italic">
                        Start connecting to see matches here.
                    </div>
                </div>
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discovery Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <Label>Enable Discovery</Label>
                            <Switch checked={discoverEnabled} onCheckedChange={setDiscoverEnabled} />
                        </div>
                        <div className="space-y-2">
                            <Label>Looking For</Label>
                            <Select value={settings.discover_looking_for} onValueChange={(val) => setSettings({ ...settings, discover_looking_for: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="friends">Friends</SelectItem>
                                    <SelectItem value="study">Study Partners</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full" onClick={() => setShowSettings(false)}>Save</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Discover;
