-- Fix security warnings by setting proper search paths
DROP FUNCTION IF EXISTS public.delete_expired_club_messages();
DROP FUNCTION IF EXISTS public.mark_club_message_viewed(UUID, UUID);

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION public.delete_expired_club_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.club_messages 
  WHERE expires_at <= now();
END;
$$;

-- Create function to mark message as viewed
CREATE OR REPLACE FUNCTION public.mark_club_message_viewed(message_id UUID, user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.club_messages 
  SET viewed_by = viewed_by || jsonb_build_array(user_id)
  WHERE id = message_id 
  AND NOT viewed_by ? user_id::text;
END;
$$;