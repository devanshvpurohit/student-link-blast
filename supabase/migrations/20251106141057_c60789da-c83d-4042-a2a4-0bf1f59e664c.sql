-- Add verification and multi-photo support to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create profile_photos table for multiple photos
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, display_order)
);

-- Enable RLS on profile_photos
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_photos
CREATE POLICY "Users can view all profile photos"
ON public.profile_photos FOR SELECT
USING (true);

CREATE POLICY "Users can upload their own photos"
ON public.profile_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
ON public.profile_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
ON public.profile_photos FOR DELETE
USING (auth.uid() = user_id);

-- Create campus_events table
CREATE TABLE IF NOT EXISTS public.campus_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('academic', 'social', 'sports', 'club', 'career', 'other')),
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  max_attendees INTEGER,
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on campus_events
ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for campus_events
CREATE POLICY "Anyone can view public events"
ON public.campus_events FOR SELECT
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create events"
ON public.campus_events FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events"
ON public.campus_events FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Event creators can delete their events"
ON public.campus_events FOR DELETE
USING (auth.uid() = created_by);

-- Create event_rsvps table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.campus_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_rsvps
CREATE POLICY "Users can view RSVPs for events they can see"
ON public.event_rsvps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campus_events 
    WHERE id = event_id 
    AND (is_public = true OR created_by = auth.uid())
  )
);

CREATE POLICY "Users can RSVP to events"
ON public.event_rsvps FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
ON public.event_rsvps FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs"
ON public.event_rsvps FOR DELETE
USING (auth.uid() = user_id);

-- Create dating_conversations table for dating chats
CREATE TABLE IF NOT EXISTS public.dating_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.dating_matches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on dating_conversations
ALTER TABLE public.dating_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for dating_conversations
CREATE POLICY "Users can view conversations from their matches"
ON public.dating_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dating_matches
    WHERE id = match_id
    AND (user_id = auth.uid() OR liked_user_id = auth.uid())
    AND is_match = true
  )
);

-- Create dating_messages table
CREATE TABLE IF NOT EXISTS public.dating_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.dating_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on dating_messages
ALTER TABLE public.dating_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for dating_messages
CREATE POLICY "Users can view messages in their conversations"
ON public.dating_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dating_conversations dc
    JOIN dating_matches dm ON dc.match_id = dm.id
    WHERE dc.id = conversation_id
    AND (dm.user_id = auth.uid() OR dm.liked_user_id = auth.uid())
    AND dm.is_match = true
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.dating_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM dating_conversations dc
    JOIN dating_matches dm ON dc.match_id = dm.id
    WHERE dc.id = conversation_id
    AND (dm.user_id = auth.uid() OR dm.liked_user_id = auth.uid())
    AND dm.is_match = true
  )
);

-- Add compatibility score to dating_matches for smart algorithm
ALTER TABLE public.dating_matches
ADD COLUMN IF NOT EXISTS compatibility_score INTEGER DEFAULT 0;

-- Function to calculate compatibility score based on shared interests
CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(user1_id UUID, user2_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INTEGER := 0;
  user1_interests TEXT[];
  user2_interests TEXT[];
  shared_count INTEGER;
BEGIN
  -- Get interests for both users
  SELECT interests INTO user1_interests FROM profiles WHERE id = user1_id;
  SELECT interests INTO user2_interests FROM profiles WHERE id = user2_id;
  
  -- Calculate shared interests
  SELECT COUNT(*)::INTEGER INTO shared_count
  FROM unnest(user1_interests) AS interest
  WHERE interest = ANY(user2_interests);
  
  -- Base score from shared interests (10 points per shared interest)
  score := shared_count * 10;
  
  -- Bonus points for same department (20 points)
  IF EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = user1_id AND p2.id = user2_id
    AND p1.department = p2.department
    AND p1.department IS NOT NULL
  ) THEN
    score := score + 20;
  END IF;
  
  -- Bonus points for similar year of study (10 points)
  IF EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.id = user1_id AND p2.id = user2_id
    AND ABS(p1.year_of_study - p2.year_of_study) <= 1
    AND p1.year_of_study IS NOT NULL
    AND p2.year_of_study IS NOT NULL
  ) THEN
    score := score + 10;
  END IF;
  
  RETURN LEAST(score, 100); -- Cap at 100
END;
$$;

-- Enable realtime for dating messages
ALTER PUBLICATION supabase_realtime ADD TABLE dating_messages;
ALTER TABLE dating_messages REPLICA IDENTITY FULL;