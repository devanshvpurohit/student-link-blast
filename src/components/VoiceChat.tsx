import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const VoiceChat = () => {
    const [isMuted, setIsMuted] = useState(true);
    const [isDeafened, setIsDeafened] = useState(false);
    const [volume, setVolume] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const startAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);

                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setVolume(average); // 0 to 255

                animationRef.current = requestAnimationFrame(updateVolume);
            };

            updateVolume();
            setIsMuted(false);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            // Handle permission denied or error
            setIsMuted(true);
        }
    };

    const stopAudio = () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setVolume(0);
        setIsMuted(true);
    };

    const toggleMute = () => {
        if (isMuted) {
            startAudio();
        } else {
            stopAudio();
        }
    };

    return (
        <Card className="glass-card mb-6">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
                        !isMuted ? "bg-pop/20" : "bg-white/5"
                    )}>
                        {/* Audio Visualizer Ring */}
                        {!isMuted && (
                            <div
                                className="absolute inset-0 rounded-full border-2 border-pop opacity-50 transition-all duration-75"
                                style={{ transform: `scale(${1 + (volume / 100)})` }}
                            />
                        )}
                        <Users className="h-5 w-5 text-pop z-10" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Study Room Voice</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={cn("w-2 h-2 rounded-full", !isMuted ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                            {isMuted ? "Disconnected" : "Connected"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn("rounded-full h-10 w-10", isMuted ? "text-destructive hover:bg-destructive/10" : "text-white bg-white/10")}
                        onClick={toggleMute}
                    >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn("rounded-full h-10 w-10", isDeafened ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-white/5")}
                        onClick={() => setIsDeafened(!isDeafened)}
                    >
                        {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default VoiceChat;
