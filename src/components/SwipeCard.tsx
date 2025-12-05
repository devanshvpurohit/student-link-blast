import { useSwipe } from "@/hooks/useSwipe";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, X, TrendingUp, Sparkles } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";

interface DatingProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  year_of_study: number | null;
  interests: string[] | null;
  bio: string | null;
  dating_bio: string | null;
  dating_gender: string | null;
  dating_looking_for: string | null;
  score?: number;
}

interface SwipeCardProps {
  profile: DatingProfile;
  onLike: () => void;
  onSkip: () => void;
}

export interface SwipeCardRef {
  triggerSwipe: (direction: 'left' | 'right') => void;
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  ({ profile, onLike, onSkip }, ref) => {
    const { style, state, handlers, triggerSwipe } = useSwipe({
      onSwipeRight: onLike,
      onSwipeLeft: onSkip,
    });

    useImperativeHandle(ref, () => ({
      triggerSwipe,
    }));

    return (
      <div className="relative w-full max-w-md select-none">
        {/* Swipe indicators */}
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-200 ${
            state.direction === 'right' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-green-500/90 text-white px-6 py-3 rounded-full font-bold text-2xl rotate-[-15deg] border-4 border-green-400">
            LIKE
          </div>
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-200 ${
            state.direction === 'left' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-red-500/90 text-white px-6 py-3 rounded-full font-bold text-2xl rotate-[15deg] border-4 border-red-400">
            NOPE
          </div>
        </div>

        <Card
          className="overflow-hidden border-2 shadow-xl touch-none"
          style={style}
          {...handlers}
        >
          <div className="relative h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="text-9xl font-bold text-primary/40">
                {profile.full_name?.charAt(0) || "?"}
              </div>
            )}
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Name overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-3xl font-bold drop-shadow-lg">{profile.full_name}</h2>
              {profile.department && (
                <p className="text-white/90 drop-shadow-md">{profile.department}</p>
              )}
              {profile.year_of_study && (
                <p className="text-sm text-white/80 drop-shadow-md">
                  Year {profile.year_of_study}
                </p>
              )}
            </div>

            {/* Compatibility badge */}
            {profile.score !== undefined && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-bold text-sm">{profile.score}%</span>
              </div>
            )}
          </div>

          <CardContent className="p-5 space-y-4 bg-card">
            {profile.dating_bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{profile.dating_bio}</p>
            )}

            {profile.score !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Compatibility
                  </span>
                  <span className="font-semibold">{profile.score}%</span>
                </div>
                <Progress value={profile.score} className="h-2" />
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 5).map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.interests.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4 pt-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-14 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
                onClick={() => triggerSwipe('left')}
              >
                <X className="h-7 w-7 text-red-500" />
              </Button>
              <Button
                size="lg"
                className="flex-1 h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg"
                onClick={() => triggerSwipe('right')}
              >
                <Heart className="h-7 w-7 fill-current" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Swipe hint */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Swipe right to like, left to pass
        </p>
      </div>
    );
  }
);

SwipeCard.displayName = "SwipeCard";
