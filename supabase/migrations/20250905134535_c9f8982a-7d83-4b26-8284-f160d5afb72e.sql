-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,
  interests TEXT[],
  bio TEXT,
  year_of_study INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connections table for networking/dating
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
  connection_type TEXT NOT NULL CHECK (connection_type IN ('friend', 'dating', 'networking')) DEFAULT 'friend',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table for Pulse (campus updates)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('news', 'event', 'announcement', 'general')) DEFAULT 'general',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_admin_post BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anon_posts table for AnonySpace
CREATE TABLE public.anon_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create anon_votes table to track votes
CREATE TABLE public.anon_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.anon_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create club_members table
CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin', 'moderator')) DEFAULT 'member',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anon_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anon_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Connections policies
CREATE POLICY "Users can view their connections" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create connection requests" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update their connections" ON public.connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Messages policies
CREATE POLICY "Users can view messages in their connections" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE id = connection_id 
    AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'accepted'
  )
);
CREATE POLICY "Users can send messages in their connections" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.connections 
    WHERE id = connection_id 
    AND (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'accepted'
  )
);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = created_by);

-- Anonymous posts policies (public read, authenticated write)
CREATE POLICY "Anyone can view anonymous posts" ON public.anon_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create anonymous posts" ON public.anon_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update anonymous posts" ON public.anon_posts FOR UPDATE USING (true);

-- Anonymous votes policies
CREATE POLICY "Users can view votes" ON public.anon_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.anon_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.anon_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.anon_votes FOR DELETE USING (auth.uid() = user_id);

-- Clubs policies
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Club creators can update clubs" ON public.clubs FOR UPDATE USING (auth.uid() = created_by);

-- Club members policies
CREATE POLICY "Users can view club memberships" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Users can request to join clubs" ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own membership" ON public.club_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Club admins can manage memberships" ON public.club_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.club_members cm 
    WHERE cm.club_id = club_members.club_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('admin', 'moderator')
    AND cm.status = 'approved'
  )
);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle vote updates
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote updates
CREATE TRIGGER update_votes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.anon_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_anon_post_votes();