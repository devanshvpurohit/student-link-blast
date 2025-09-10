import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, X } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { VoiceNotePlayer } from './VoiceNotePlayer';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onSendVoiceNote,
  onCancel,
}) => {
  const {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder();

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Recording failed:', error);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoiceNote(audioBlob, duration);
      resetRecording();
    }
  };

  const handleCancel = () => {
    resetRecording();
    onCancel?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-background w-full">
        <div className="flex-1 min-w-0">
          <VoiceNotePlayer 
            audioUrl={URL.createObjectURL(audioBlob)} 
            duration={duration}
          />
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSend}
            className="h-8 w-8 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-background w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium truncate">Recording...</span>
          <span className="text-xs sm:text-sm text-muted-foreground">{formatTime(duration)}</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleStartRecording}
      className="h-8 w-8 p-0"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
};