import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Zap, Coffee, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const FocusTimer = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'short-break' | 'long-break'>('focus');
    const { toast } = useToast();

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            toast({
                title: "Time's up! 🎉",
                description: mode === 'focus' ? "Great focus session! Take a break." : "Break's over! Let's get back to it.",
            });
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode, toast]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'focus') setTimeLeft(25 * 60);
        else if (mode === 'short-break') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const setTimerMode = (newMode: 'focus' | 'short-break' | 'long-break') => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === 'focus') setTimeLeft(25 * 60);
        else if (newMode === 'short-break') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'focus'
        ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
        : mode === 'short-break'
            ? ((5 * 60 - timeLeft) / (5 * 60)) * 100
            : ((15 * 60 - timeLeft) / (15 * 60)) * 100;

    const handleShare = async () => {
        const shareData = {
            title: 'Bazinga Focus Mode',
            text: '⚡️ Focusing with Bazinga! Join me in the Zone. #BazingaFocus',
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                toast({
                    title: "Vibe Copied! 📋",
                    description: "Share your focus status with the world.",
                });
            } catch (err) {
                console.error('Error copying to clipboard:', err);
                toast({
                    title: "Error",
                    description: "Failed to copy to clipboard",
                    variant: "destructive"
                });
            }
        }
    };

    return (
        <Card className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pop/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-pop" />
                    Focus Zone
                </h3>
                <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
                    <button
                        onClick={() => setTimerMode('focus')}
                        className={cn("p-1.5 rounded-md transition-all text-xs font-medium", mode === 'focus' ? "bg-pop text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}
                        title="Focus Mode"
                    >
                        <Zap className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setTimerMode('short-break')}
                        className={cn("p-1.5 rounded-md transition-all text-xs font-medium", mode === 'short-break' ? "bg-fresh text-black shadow-lg" : "text-muted-foreground hover:bg-white/5")}
                        title="Short Break"
                    >
                        <Coffee className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center py-4">
                {/* Circular Progress (CSS based) */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-white/5"
                        />
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                            className={cn(
                                "transition-all duration-1000 ease-linear",
                                mode === 'focus' ? "text-pop" : "text-fresh"
                            )}
                            strokeLinecap="round"
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-bold tabular-nums tracking-tight">
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-sm text-muted-foreground mt-1 font-medium bg-white/5 px-3 py-1 rounded-full">
                            {isActive ? 'Simmering...' : 'Ready?'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-8 w-full max-w-[240px]">
                    <Button
                        size="lg"
                        className={cn(
                            "flex-1 rounded-2xl h-12 text-base shadow-lg transition-all active:scale-95",
                            isActive
                                ? "bg-secondary hover:bg-secondary/80 text-foreground border border-white/10"
                                : mode === 'focus' ? "bg-pop hover:bg-pop/90 text-white shadow-pop/25" : "bg-fresh hover:bg-fresh/90 text-black shadow-fresh/25"
                        )}
                        onClick={toggleTimer}
                    >
                        {isActive ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-1" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-12 w-12 rounded-2xl border-white/10 hover:bg-white/5"
                        onClick={resetTimer}
                        title="Reset Timer"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-12 w-12 rounded-2xl border-white/10 hover:bg-white/5 text-pop hover:text-pop/80"
                        onClick={handleShare}
                        title="Share Vibe"
                    >
                        <Share2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default FocusTimer;
