import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Hand, X } from 'lucide-react';
import { useHandTracking, GestureType } from '@/hooks/useHandTracking';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface HandGestureControlProps {
  onClose: () => void;
}

export const HandGestureControl: React.FC<HandGestureControlProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleGesture = (gesture: GestureType) => {
    switch (gesture) {
      case 'swipe_right':
        toast('Swipe Right');
        window.history.forward();
        break;
      case 'swipe_left':
        toast('Swipe Left');
        window.history.back();
        break;
      case 'swipe_up':
        toast('Swipe Up - Scroll Up');
        window.scrollBy({ top: -100, behavior: 'smooth' });
        break;
      case 'swipe_down':
        toast('Swipe Down - Scroll Down');
        window.scrollBy({ top: 100, behavior: 'smooth' });
        break;
      case 'pinch':
        toast('Pinch - Go Home');
        navigate('/');
        break;
      case 'palm':
        toast('Palm - Pause');
        break;
      case 'point':
        // Just pointing, no action
        break;
    }
  };

  const { isActive, currentGesture, videoRef, canvasRef, startTracking, stopTracking } = useHandTracking(handleGesture);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  const getGestureDisplay = () => {
    switch (currentGesture) {
      case 'pinch': return '🤏 Pinch';
      case 'swipe_left': return '👈 Swipe Left';
      case 'swipe_right': return '👉 Swipe Right';
      case 'swipe_up': return '👆 Swipe Up';
      case 'swipe_down': return '👇 Swipe Down';
      case 'point': return '☝️ Pointing';
      case 'palm': return '✋ Palm';
      default: return '✋ Show your hand';
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 shadow-lg bg-card border-border w-[280px] sm:w-[320px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hand className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="text-sm sm:text-base font-semibold">Hand Controls</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopTracking();
            onClose();
          }}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          {isActive && (
            <div className="absolute top-2 left-2 right-2 z-10">
              <div className="bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-center">
                {getGestureDisplay()}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Gestures:</p>
          <ul className="space-y-0.5 text-[10px] sm:text-xs">
            <li>🤏 <strong>Pinch:</strong> Go Home</li>
            <li>👈 <strong>Swipe Left:</strong> Go Back</li>
            <li>👉 <strong>Swipe Right:</strong> Go Forward</li>
            <li>👆 <strong>Swipe Up:</strong> Scroll Up</li>
            <li>👇 <strong>Swipe Down:</strong> Scroll Down</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
