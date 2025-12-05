import { useState, useRef, TouchEvent, MouseEvent } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeState {
  offsetX: number;
  offsetY: number;
  rotation: number;
  isDragging: boolean;
  direction: 'left' | 'right' | null;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight }: SwipeHandlers) => {
  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    isDragging: false,
    direction: null,
  });
  
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100;
  const ROTATION_FACTOR = 0.1;

  const handleStart = (clientX: number, clientY: number) => {
    startPos.current = { x: clientX, y: clientY };
    setState(prev => ({ ...prev, isDragging: true }));
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!state.isDragging) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    const rotation = deltaX * ROTATION_FACTOR;
    
    let direction: 'left' | 'right' | null = null;
    if (deltaX > SWIPE_THRESHOLD / 2) direction = 'right';
    else if (deltaX < -SWIPE_THRESHOLD / 2) direction = 'left';

    setState({
      offsetX: deltaX,
      offsetY: deltaY * 0.3,
      rotation,
      isDragging: true,
      direction,
    });
  };

  const handleEnd = () => {
    if (!state.isDragging) return;

    const { offsetX } = state;
    
    if (offsetX > SWIPE_THRESHOLD) {
      // Swipe right - animate out
      setState(prev => ({
        ...prev,
        offsetX: window.innerWidth,
        rotation: 30,
        isDragging: false,
      }));
      setTimeout(() => {
        onSwipeRight?.();
        resetState();
      }, 200);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      // Swipe left - animate out
      setState(prev => ({
        ...prev,
        offsetX: -window.innerWidth,
        rotation: -30,
        isDragging: false,
      }));
      setTimeout(() => {
        onSwipeLeft?.();
        resetState();
      }, 200);
    } else {
      // Return to center
      resetState();
    }
  };

  const resetState = () => {
    setState({
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      isDragging: false,
      direction: null,
    });
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? window.innerWidth : -window.innerWidth;
    const targetRotation = direction === 'right' ? 30 : -30;
    
    setState({
      offsetX: targetX,
      offsetY: 0,
      rotation: targetRotation,
      isDragging: false,
      direction,
    });
    
    setTimeout(() => {
      if (direction === 'right') {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
      resetState();
    }, 300);
  };

  // Touch handlers
  const onTouchStart = (e: TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Mouse handlers
  const onMouseDown = (e: MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    handleEnd();
  };

  const onMouseLeave = () => {
    if (state.isDragging) {
      handleEnd();
    }
  };

  const style = {
    transform: `translateX(${state.offsetX}px) translateY(${state.offsetY}px) rotate(${state.rotation}deg)`,
    transition: state.isDragging ? 'none' : 'transform 0.3s ease-out',
    cursor: state.isDragging ? 'grabbing' : 'grab',
  };

  return {
    cardRef,
    style,
    state,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
    triggerSwipe,
  };
};
