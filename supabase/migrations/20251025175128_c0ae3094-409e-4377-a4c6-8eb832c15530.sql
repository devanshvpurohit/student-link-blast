-- Add alumni-related fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_alumni boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS graduation_year integer,
ADD COLUMN IF NOT EXISTS current_company text,
ADD COLUMN IF NOT EXISTS current_position text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS open_to_mentoring boolean DEFAULT false;

-- Drop the old constraint first
ALTER TABLE public.connections 
DROP CONSTRAINT IF EXISTS connections_connection_type_check;

-- Update existing rows BEFORE adding the new constraint
UPDATE public.connections 
SET connection_type = 'classmate' 
WHERE connection_type IN ('friend', 'networking');

UPDATE public.connections 
SET connection_type = 'professional' 
WHERE connection_type NOT IN ('classmate', 'study_group', 'project_partner', 'mentor', 'mentee', 'alumni', 'professional');

-- Now add the new constraint
ALTER TABLE public.connections 
ADD CONSTRAINT connections_connection_type_check 
CHECK (connection_type IN ('classmate', 'study_group', 'project_partner', 'mentor', 'mentee', 'alumni', 'professional'));

-- Create a jobs/opportunities table for alumni to post
CREATE TABLE IF NOT EXISTS public.alumni_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  description text NOT NULL,
  location text,
  job_type text CHECK (job_type IN ('full-time', 'part-time', 'internship', 'contract', 'volunteer')),
  application_url text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on alumni_opportunities
ALTER TABLE public.alumni_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS policies for alumni_opportunities
CREATE POLICY "Anyone can view active opportunities"
ON public.alumni_opportunities
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Alumni can create opportunities"
ON public.alumni_opportunities
FOR INSERT
WITH CHECK (
  auth.uid() = posted_by 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_alumni = true
  )
);

CREATE POLICY "Users can update own opportunities"
ON public.alumni_opportunities
FOR UPDATE
USING (auth.uid() = posted_by);

CREATE POLICY "Users can delete own opportunities"
ON public.alumni_opportunities
FOR DELETE
USING (auth.uid() = posted_by);