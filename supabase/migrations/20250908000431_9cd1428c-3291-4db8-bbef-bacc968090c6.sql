-- Add visibility column to clubs table to support public/private clubs
ALTER TABLE public.clubs 
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';

-- Add constraint to ensure visibility is either 'public' or 'private'
ALTER TABLE public.clubs 
ADD CONSTRAINT clubs_visibility_check 
CHECK (visibility IN ('public', 'private'));

-- Update RLS policies to handle visibility
-- Drop existing policy for viewing clubs
DROP POLICY IF EXISTS "Anyone can view clubs" ON public.clubs;

-- Create new policy that only allows viewing public clubs or clubs where user is a member
CREATE POLICY "Users can view public clubs and their own clubs" 
ON public.clubs 
FOR SELECT 
USING (
  visibility = 'public' 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.club_members 
    WHERE club_id = clubs.id 
    AND user_id = auth.uid() 
    AND status = 'approved'
  )
);