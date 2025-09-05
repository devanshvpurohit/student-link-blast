-- Fix security warnings by setting search_path for functions

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update the update_anon_post_votes function
CREATE OR REPLACE FUNCTION public.update_anon_post_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.anon_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
    ELSIF NEW.vote_type = 'down' THEN
      UPDATE public.anon_posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.anon_posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
    ELSIF OLD.vote_type = 'down' THEN
      UPDATE public.anon_posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
    END IF;
    
    IF NEW.vote_type = 'up' THEN
      UPDATE public.anon_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
    ELSIF NEW.vote_type = 'down' THEN
      UPDATE public.anon_posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.anon_posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
    ELSIF OLD.vote_type = 'down' THEN
      UPDATE public.anon_posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;