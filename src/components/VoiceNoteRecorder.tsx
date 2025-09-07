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
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
        <VoiceNotePlayer 
          audioUrl={URL.createObjectURL(audioBlob)} 
          duration={duration}
        />
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
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording...</span>
          <span className="text-sm text-muted-foreground">{formatTime(duration)}</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="h-8 w-8 p-0"
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