-- Create a trigger to automatically add club creators as admin members
CREATE OR REPLACE FUNCTION public.handle_new_club()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Add the club creator as an admin member with approved status
  INSERT INTO public.club_members (club_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'admin', 'approved');
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire after club creation
CREATE TRIGGER on_club_created
  AFTER INSERT ON public.clubs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_club();