-- Add dating preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dating_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dating_gender TEXT,
ADD COLUMN IF NOT EXISTS dating_looking_for TEXT,
ADD COLUMN IF NOT EXISTS dating_age_min INTEGER,
ADD COLUMN IF NOT EXISTS dating_age_max INTEGER,
ADD COLUMN IF NOT EXISTS dating_bio TEXT;

-- Add romantic connection type to connections check constraint
ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_connection_type_check;
ALTER TABLE public.connections 
ADD CONSTRAINT connections_connection_type_check 
CHECK (connection_type IN ('classmate', 'study_group', 'project_partner', 'mentor', 'mentee', 'alumni', 'professional', 'romantic'));

-- Create dating matches table for mutual likes
CREATE TABLE IF NOT EXISTS public.dating_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_match BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, liked_user_id)
);

-- Enable RLS on dating_matches
ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;

-- RLS policies for dating_matches
CREATE POLICY "Users can view their own likes and matches"
ON public.dating_matches FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = liked_user_id);

CREATE POLICY "Users can create likes"
ON public.dating_matches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own likes"
ON public.dating_matches FOR UPDATE
USING (auth.uid() = user_id);

-- Function to check and create mutual match
CREATE OR REPLACE FUNCTION public.check_dating_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the liked user also liked this user
  IF EXISTS (
    SELECT 1 FROM dating_matches
    WHERE user_id = NEW.liked_user_id
    AND liked_user_id = NEW.user_id
  ) THEN
    -- Update both records to indicate a match
    UPDATE dating_matches SET is_match = true
    WHERE (user_id = NEW.user_id AND liked_user_id = NEW.liked_user_id)
       OR (user_id = NEW.liked_user_id AND liked_user_id = NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check for matches when a new like is created
CREATE TRIGGER on_dating_like_created
  AFTER INSERT ON public.dating_matches
  FOR EACH ROW EXECUTE FUNCTION public.check_dating_match();