import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Pull-to-refresh component for mobile-first experience.
 * Wrap scrollable content with this component to enable pull-to-refresh.
 */
const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const THRESHOLD = 80; // Distance needed to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;
    
    // Only enable pull-to-refresh when scrolled to top
    if (container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance for natural feel
      const resistance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(resistance);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 flex justify-center transition-transform duration-200 z-10"
        style={{ 
          transform: `translateY(${pullDistance - 50}px)`,
          opacity: pullDistance > 10 ? 1 : 0
        }}
      >
        <div className={cn(
          'p-2 rounded-full bg-primary/10 backdrop-blur-sm',
          isRefreshing && 'animate-pulse'
        )}>
          <RefreshCw 
            className={cn(
              'h-5 w-5 text-primary transition-transform duration-200',
              isRefreshing && 'animate-spin'
            )}
            style={{ 
              transform: isRefreshing ? 'none' : `rotate(${progress * 180}deg)` 
            }}
          />
        </div>
      </div>
      
      {/* Content with pull offset */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
