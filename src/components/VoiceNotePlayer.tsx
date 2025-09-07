import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration?: number;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ 
  audioUrl, 
  duration 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const audioDuration = duration || audioRef.current?.duration || 0;

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 max-w-xs">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayback}
        className="h-8 w-8 p-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="flex-1">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-100"
            style={{ 
              width: audioDuration > 0 ? `${(currentTime / audioDuration) * 100}%` : '0%' 
            }}
          />
        </div>
      </div>
      
      <span className="text-xs text-muted-foreground min-w-[35px]">
        {formatTime(currentTime)} / {formatTime(audioDuration)}
      </span>
      
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};