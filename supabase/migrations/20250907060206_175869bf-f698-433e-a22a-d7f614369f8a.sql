-- Add delete policy for anonymous posts
CREATE POLICY "Users can delete their own anonymous posts" 
ON public.anon_posts 
FOR DELETE 
USING (false); -- Anonymous posts cannot be deleted since they're anonymous

-- Create a soft delete column instead for moderation
ALTER TABLE public.anon_posts 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Update the policy to hide deleted posts
DROP POLICY "Anyone can view anonymous posts" ON public.anon_posts;
CREATE POLICY "Anyone can view non-deleted anonymous posts" 
ON public.anon_posts 
FOR SELECT 
USING (deleted_at IS NULL);

-- Add reporting system for anonymous posts
CREATE TABLE public.anon_post_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.anon_posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on reports table
ALTER TABLE public.anon_post_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports
CREATE POLICY "Users can create reports" 
ON public.anon_post_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.anon_post_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);