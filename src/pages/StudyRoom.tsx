import { useState, useEffect } from 'react';
import { Zap, BookOpen, ExternalLink, Music, Github, Info, LogIn } from 'lucide-react';
import FocusTimer from '@/components/FocusTimer';
import ScholarAI from '@/components/ScholarAI';
import VoiceChat from '@/components/VoiceChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLoginUrl, getTokenFromUrl } from '@/utils/spotify';
import { useToast } from '@/hooks/use-toast';

const StudyRoom = () => {
    const [spotifyToken, setSpotifyToken] = useState('');

    const { toast } = useToast();

    useEffect(() => {
        const hash = getTokenFromUrl();
        // @ts-ignore
        const _token = hash.access_token;
        if (_token) {
            setSpotifyToken(_token);
            window.location.hash = "";
            localStorage.setItem('spotify_token', _token);
            toast({ title: "Connected to Spotify! 🎵", description: "You can now control playback." });
        } else {
            const storedToken = localStorage.getItem('spotify_token');
            if (storedToken) setSpotifyToken(storedToken);
        }
    }, [toast]);

    const handleSpotifyLogin = () => {
        // Import CLIENT_ID from utils directly or use the one from env
        // We need to re-import or just rely on the one in utils if we export it
        const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
        if (!client_id) {
            toast({ title: "Configuration Error", description: "Spotify Client ID not set in .env", variant: "destructive" });
            return;
        }
        window.location.href = getLoginUrl(client_id);
    };

    return (
        <div className="pb-20 px-4 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-bold mb-2">
                    <span className="text-white">Study</span>
                    <span className="text-gradient-primary"> Rooms 🎧</span>
                </h1>
                <p className="text-muted-foreground">Join a room. Vibe together. Get it done.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Timer & Tools Area */}
                <div className="col-span-1 md:col-span-8 lg:col-span-8 space-y-6">
                    <FocusTimer />

                    {/* Scholar AI Integration */}
                    <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                        <ScholarAI />
                    </div>
                </div>

                {/* Sidebar Tools */}
                <div className="col-span-1 md:col-span-4 lg:col-span-4 space-y-6">

                    {/* Voice Chat */}
                    <VoiceChat />

                    {/* Spotify Embed with Login Prompt */}
                    <div className="space-y-4">
                        {!spotifyToken ? (
                            <Card className="glass-card bg-green-500/5 border-green-500/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4 text-green-400" />
                                        <h4 className="font-bold text-sm text-green-400">Connect Spotify</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        To enable full playback control, connect your Spotify account.
                                    </p>
                                    <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-black" onClick={handleSpotifyLogin}>
                                        <LogIn className="h-4 w-4 mr-2" />
                                        Connect Spotify Account
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Alert className="bg-green-500/10 border-green-500/20 text-green-200">
                                <Music className="h-4 w-4 text-green-400" />
                                <AlertTitle>Connected</AlertTitle>
                                <AlertDescription className="text-xs mt-1 text-green-200/80">
                                    Spotify is active. Control playback below.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Card className="glass-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Music className="h-5 w-5 text-fresh" />
                                    Focus Beats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl overflow-hidden bg-black/50">
                                    <iframe
                                        style={{ borderRadius: '12px' }}
                                        src="https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0"
                                        width="100%"
                                        height="352"
                                        frameBorder="0"
                                        allowFullScreen
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Tips */}
                    <Card className="glass-card bg-pop/5 border-pop/10">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-pop mb-2 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Pro Tip
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Use the Pomodoro technique to maintain high energy. 25 minutes of intense work followed by a 5-minute break is the sweet spot.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudyRoom;
